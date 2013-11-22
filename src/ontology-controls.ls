Backbone = require \backbone
{GOTerms} = require './go-terms.ls'
{unique, map, pairs-to-obj, fold, first, intersection} = require 'prelude-ls'
{get-root} = require './graph-utils.ls'
{RootTerm} = require './root-term.ls'

root-node = (g, n) -> g.node get-root g, n

flat-graph-map = (f, g, n) -->
    for-node = f g, n
    unique fold (++), for-node, map (flat-graph-map f, g), for-node

descendents-in = flat-graph-map (g, n) -> g.predecessors n

ancestors-in = flat-graph-map (g, n) -> g.successors n

count-desc = (.length) . descendents-in

count-anc = (.length) . ancestors-in

export class Controls extends Backbone.View

    tagName: \form
    className: \controls

    initialize: ->
        @state = new Backbone.Model
        @top-terms = new GOTerms
        @roots = new GOTerms
        @direct-terms = new GOTerms
        @roots.on \add, @~insert-root

    render: ->
        @$el.empty!
        @$el.append """
            <div class="row collapse">
                <div class="small-9 columns">
                    <input class="find" type="text" placeholder="filter">
                </div>
                <div class="small-3 columns">
                    <button class="clear-filter postfix button">clear</button>
                </div>
            </div>
        """
        @$el.append """<select class="layout">
            <option value="BT">Vertical</option>
            <option value="LR">Horizontal</option>
            <option value="TB">Inverse Vertical</option>
            <option value="RL">Inverse Horizontal</option>
        </select>
        """
        @$el.append """
            <dl class="accordion terms" data-section=accordion>
            </dl>
        """
        @roots.each @~insert-root

    insert-root: (root) ->
        id = root.get \objectId
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

        @term-names = pairs-to-obj [[r-id, [g.node(n).get \name for n in ns]] for r-id, ns of _.group-by g.nodes!, get-root g]

        console.log @term-names

        $('.ui-autocomplete').add-class \f-dropdown

    root-views: {}
    term-names: {}

    wire-to-dag: (dag) ->
        @on \filter, dag.state.set \filter, _
        @on \chosen:layout, dag~set-layout
        @state.on \change:currentRoot, (state, selected, {init} = {}) ~>
            # Handle this manually. Foundation 5 is not-dynamic :(
            for id, view of @root-views
                view.trigger \currentRoot, selected

            @$('.find').autocomplete source: @term-names[selected.get \objectId]

            dag.trigger 'redraw' unless init

        dag.on \whole:graph, @~read-graph

        dag.set-root-filter (ontology-term) ~>
            current-root = @state.get(\currentRoot) ? @roots.first!
            console.log ontology-term.identifier, current-root.get \identifier
            ontology-term.identifier is current-root.get \identifier

    events: ->
        'click .clear-filter': (e) ->
            e.prevent-default!
            @$('.find').val null
            @trigger \filter, null
        'keyup .find': (e) -> @trigger \filter, e.target.value
        'change .layout': (e) ->
            @trigger \chosen:layout, $(e.target).val!
            $(e.target).blur!
