Backbone = require \backbone
{UniqueCollection} = require './unique-collection.ls'
{first, intersection} = require 'prelude-ls'

export class Controls extends Backbone.View

    tagName: \form
    className: \controls

    initialize: ->
        @state = new Backbone.Model
        @top-terms = new UniqueCollection [], key-fn: (.identifier)
        @roots = new UniqueCollection [], key-fn: (.identifier)
        @roots.on \add, @~insert-root
        @top-terms.on 'add', @~insert-term

    render: ->
        @$el.empty!
        @$el.append """
            <div class="row collapse">
                <div class="small-9 columns">
                    <input class="find" type="text" placeholder="filter">
                </div>
                <div class="small-3 columns">
                    <button class="clear-filter postfix">clear</button>
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
            <div class="section-container accordion terms" data-section=accordion>
            </div>
        """
        @roots.each @~insert-root
        @top-terms.each @~insert-term

    reflow-section = -> $(document).foundation \section, \reflow

    insert-root: (root) ->
        root-section = $ """
            <section class="root-term-#{ root.escape \objectId }">
                <p class="title" data-section-title>
                    <a href="#">#{ root.escape \name }</a>
                </p>
                <div class="content" data-section-content"></div>
            </section>
        """
        root-section.click ~> @state.set current-root: root
        @$('.terms').append root-section
        reflow-section!

    insert-term: (term) ~>
        @$(".terms .root-term-#{ term.get \parentTerm } .content").append """
            <label>
                <input type="checkbox" value="#{ term.escape \identifier }" 
                    checked="#{ not term.get \hidden }"/>
                #{term.escape \name}
            </label>
        """
        reflow-section!

    wire-to-dag: (dag) ->
        @on \filter, dag.state.set \filter, _
        @on \chosen:layout, dag~set-layout
        @state.on \change:currentRoot, (state, root, {init} = {}) ~>
            @$(".root-term-#{ root.get \objectId }").trigger \click
            dag.trigger 'redraw' unless init

        dag.on \whole:graph, (g) ~>
            sinks = g.sinks!
            roots = [g.node n for n in sinks]
            one-removed = [p for n in sinks
                             for p in g.predecessors(n)]
            @state.set({current-root: first roots}, init: true) unless @state.has \currentRoot
            @roots.add roots
            for n in one-removed
                @top-terms.add g.node(n).set parent-term: first intersection sinks, g.successors(n)

        dag.set-root-filter (ontology-term) ~>
            current-root = @state.get(\currentRoot) ? @roots.first!
            ontology-term.identifier is current-root.get \identifier

    events: ->
        'click .clear-filter': (e) ->
            e.prevent-default!
            @$('.find').val null
            @trigger \filter, null
        'keyup .find': (e) -> @trigger \filter, e.target.value
        'click .terms': (e) ->
            hide = @$('.terms input').filter(':not(:checked)').map( -> $(@).val!).get!
            @top-terms.each (x) -> x.set hidden: (x.get(\identifier) in hide)
        'change .layout': (e) ->
            @trigger \chosen:layout, $(e.target).val!
            $(e.target).blur!
