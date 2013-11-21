Backbone = require \backbone
{UniqueCollection} = require './unique-collection.ls'
{first, intersection} = require 'prelude-ls'
{get-root} = require './graph-utils.ls'

reflow-section = -> $(document).foundation()

class GOTerms extends UniqueCollection

    -> super [], key-fn: (.identifier)


export class Controls extends Backbone.View

    tagName: \form
    className: \controls

    initialize: ->
        @state = new Backbone.Model
        @top-terms = new GOTerms
        @roots = new GOTerms
        @direct-terms = new GOTerms
        @roots.on \add, @~insert-root
        @top-terms.on 'add', @~insert-term
        @direct-terms.on \add, @~insert-direct-term

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
        @top-terms.each @~insert-term
        @direct-terms.each @~insert-direct-term
        reflow-section!

    insert-root: (root) ->
        is-current = root is @state.get \currentRoot
        root-section = $ """
            <dd class="root-term root-term-#{ root.escape \objectId }">
                <a href="#"
                   class="title #{ if is-current then \active else ''}">
                    #{ root.escape \name }
                </a>
                <div class="content #{ if is-current then \active else ''}">
                  <fieldset>
                    <legend>General Term</legend>
                    <div class="high-level">
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>Specific Term</legend>
                    <div class="low-level">
                    </div>
                  </fieldset>
                </div>
            </dd>
        """
        root-section.click ~>
            root-section.find('.content').toggle-class \active
            @state.set current-root: root
        @$('.terms').append root-section
        reflow-section!

    insert-term: (term) ~>
        @$(".terms .root-term-#{ term.get \rootTerm } .high-level").append """
            <label class="high-level-term">
                <input type="checkbox" value="#{ term.escape \identifier }" 
                    checked="#{ not term.get \hidden }"/>
                #{term.escape \name}
            </label>
        """
        reflow-section!

    insert-direct-term: (term) ->
        @$(".terms .root-term-#{ term.get \rootTerm } .low-level").append """
            <label class="low-level-term">
                <input type="checkbox" value="#{ term.escape \identifier }" 
                    checked="#{ not term.get \hidden }"/>
                #{term.escape \name}
            </label>
        """
        reflow-section!


    wire-to-dag: (dag) ->
        @on \filter, dag.state.set \filter, _
        @on \chosen:layout, dag~set-layout
        @state.on \change:currentRoot, (state, selected, {init} = {}) ~>
            # Handle this manually. Foundation 5 is not-dynamic :(
            obj-id = selected.get \objectId
            for non-selected in @roots.filter (isnt selected)
                cls = '.root-term-' + non-selected.get \objectId
                @$("#{ cls } .title").remove-class \active
                @$("#{ cls } .content").remove-class \active
            @$(".root-term-#{ obj-id } .content").add-class \active
            @$(".root-term-#{ obj-id } .title").add-class \active

            dag.trigger 'redraw' unless init

        dag.on \whole:graph, (g) ~>
            sinks = g.sinks!
            roots = [g.node n for n in sinks]
            one-removed = [p for n in sinks
                             for p in g.predecessors(n)]
            @state.set({current-root: first roots}, init: true) unless @state.has \currentRoot
            @roots.add roots
            for n in one-removed
                @top-terms.add g.node(n).set root-term: get-root g, n
            for n in g.nodes! when g.node(n).get \direct
                @direct-terms.add g.node(n).set root-term: get-root g, n
            available-terms = [g.node(n).get \name for n in g.nodes!]
            @$('.find').autocomplete source: available-terms
            $('.ui-autocomplete').add-class \f-dropdown

        dag.set-root-filter (ontology-term) ~>
            current-root = @state.get(\currentRoot) ? @roots.first!
            ontology-term.identifier is current-root.get \identifier

    set-if-unchecked = (coll, selector, key, e) -->
        hide = @$(selector).filter(':not(:checked)').map( -> $(@).val!).get!
        coll.each (x) -> x.set key, (x.get(\identifier) in hide)

    events: ->
        'click .clear-filter': (e) ->
            e.prevent-default!
            @$('.find').val null
            @trigger \filter, null
        'keyup .find': (e) -> @trigger \filter, e.target.value
        'click .low-level-term': set-if-unchecked @direct-terms, '.low-level-term input', \noneabove
        'click .high-level-term': set-if-unchecked @top-terms, '.high-level-term input', \hidden
        'change .layout': (e) ->
            @trigger \chosen:layout, $(e.target).val!
            $(e.target).blur!
