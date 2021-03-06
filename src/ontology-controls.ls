Backbone = require \backbone
_ = require 'underscore'
{Terms} = require './go-terms.ls'
{Obj, any, unique, map, pairs-to-obj, fold, first, intersection} = require 'prelude-ls'
{get-root, ancestors-of, descendents-of} = require './graph-utils.ls'
{RootTerm} = require './root-term.ls'

root-node = (g, n) -> g.node get-root g, n

count-desc = (.length) . descendents-of

count-anc = (.length) . ancestors-of

export class Controls extends Backbone.View

    tagName: \form
    className: \controls

    initialize: (options = {}) ->
        @term-key = tk = options.term-key ? (.identifier)
        @term-template = _.template options.term-template ? """<%- name %> (<%- identifier %>)"""
        @state = new Backbone.Model
        @top-terms = new Terms tk
        @roots = new Terms tk
        @direct-terms = new Terms tk
        @roots.on \add, @~insert-root

    show-term-suggestion: (ul, term) -> (.append-to ul) $ "<li><a>#{ @term-template term.toJSON! }</a></li>"

    select-term: (text-box, report, e, {item}) ~~>
        e.prevent-default!
        term = @term-key item.toJSON!
        text-box.val @term-template item.toJSON!
        report term

    render: ->
        @$el.html """
            <div class="row collapse">
                <div class="small-9 columns">
                    <input class="find" type="text" placeholder="filter">
                </div>
                <div class="small-3 columns">
                    <button class="clear-filter postfix button">clear</button>
                </div>
            </div>
            <select class="layout">
                <option value="BT">Vertical</option>
                <option value="LR">Horizontal</option>
                <option value="TB">Inverse Vertical</option>
                <option value="RL">Inverse Horizontal</option>
            </select>
            <dl class="accordion terms" data-section=accordion>
            </dl>
        """
        @roots.each @~insert-root
        @init-autocomplete!

    init-autocomplete: ->
        finder = @$ '.find'
        report = @~trigger
        source = @~suggest-terms

        on-choice = @select-term finder, report \chosen, _
        select = (-> finder.blur!) . on-choice
        focus  = @select-term finder, report \filter, _
        ac = finder
                |> (.autocomplete {source, select, focus})
                |> (.data \ui-autocomplete)
        ac._render-item = @~show-term-suggestion

    suggest-terms: ({term}, done) ->
        current-id = @term-key @state.get(\currentRoot).toJSON!
        terms = @terms-for[current-id] ? []
        re = new RegExp $.ui.autocomplete.escape-regex(term), 'i'
        done [t for t in terms when any re~test, map t~get, <[identifier name]>]

    insert-root: (root) ->
        id = @term-key root.toJSON!
        @root-views[id] = view = new RootTerm model: root, high-level-terms: @top-terms, low-level-terms: @direct-terms

        view.render!
        view.on \select:rootTerm, @state.set \currentRoot, _
        view.trigger \currentRoot, @state.get \currentRoot
        @$('.terms').append view.el

    read-graph: (g) ->
        sinks = g.sinks!
        roots = [g.node n for n in sinks]
        one-removed = [p for n in sinks
                            for p in g.predecessors(n)]
        @state.set({current-root: first roots}, init: true) unless @state.has \currentRoot
        @roots.add roots
        for n in one-removed
            @top-terms.add g.node(n).set descendents: (count-desc g, n), root-term: root-node g, n
        for n in g.nodes! when g.node(n).get \direct
            @direct-terms.add g.node(n).set ancestors: (count-anc g, n), root-term: root-node g, n

        @terms-for = Obj.map (map g~node), _.group-by g.nodes!, get-root g

        $('.ui-autocomplete').add-class \f-dropdown

    root-views: {}
    terms-for: {}

    wire-to-dag: (dag) ->
        @on 'filter chosen', dag.state.set \filter, _
        @on 'chosen', dag~zoom-to
        @on \chosen:layout, dag~set-layout
        @state.on \change:currentRoot, (state, selected, {init} = {}) ~>
            # Handle this manually. Foundation 5 is not-dynamic :(
            for id, view of @root-views
                view.trigger \currentRoot, selected

            dag.trigger 'redraw' unless init

        dag.on \whole:graph, @~read-graph

        dag.set-root-filter (ontology-term) ~>
            current-root = @state.get(\currentRoot) ? @roots.first!
            ontology-term.identifier is current-root.get \identifier

    events: ->
        'submit': (.prevent-default!)
        'click .clear-filter': (e) ->
            e.prevent-default!
            @$('.find').val null
            @trigger \filter, null
        'keyup .find': (e) ->
            @trigger \filter, e.target.value
        'change .layout': (e) ->
            @trigger \chosen:layout, $(e.target).val!
            $(e.target).blur!
