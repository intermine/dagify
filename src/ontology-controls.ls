Backbone = require \backbone
{UniqueCollection} = require './unique-collection.ls'
{intersection} = require 'prelude-ls'

export class Controls extends Backbone.View

    tagName: \form
    className: \controls

    initialize: ->
        @top-terms = new UniqueCollection [], key-fn: (.identifier)
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
            <div class="section-container auto" data-section>
              <section class="active">
                <p class="title" data-section-title><a href="#">Filter By High-Level Term</a></p>
                <div class="content terms" data-section-content>
                </div>
              </section>
              <section class="active">
                <p class="title" data-section-title><a href="#">Filter By Source</a></p>
                <div class="content sources" data-section-content>
                </div>
              </section>
            </div>
        """
        @top-terms.each @~insert-term

    insert-term: (term) ~>
        console.log term
        if term.has \parentTerm
            @$('.terms .root-term-' + term.get(\parentTerm)).append """
                <label>
                    <input type="checkbox" value="#{ term.escape \identifier }" 
                        checked="#{ not term.get \hidden }"/>
                    #{term.escape \name}
                </label>
            """
        else
            @$('.terms').append """
                <fieldset class="root-term-#{ term.get(\objectId) }">
                    <legend>#{ term.escape \name }</legend>
                </fieldset>
            """
        $(document).foundation \section, \reflow

    wire-to-dag: (dag) ->
        @on \filter, dag.state.set \filter, _
        @on \chosen:layout, dag~set-layout

        dag.on \whole:graph, (g) ~>
            roots = [n for n in g.sinks!]
            one-removed = [p for n in roots
                             for p in g.predecessors(n)]
            top-level = for n in roots ++ one-removed
                m = g.node n
                if n in one-removed
                    [parent] = intersection roots, g.successors(n)
                    m.set \parentTerm, parent
                m
            @top-terms.add top-level

    events: ->
        'click .clear-filter': (e) ->
            e.prevent-default!
            @$('.find').val null
            @trigger \filter, null
        'keyup .find': (e) -> @trigger \filter, e.target.value
        'click .terms': (e) ->
            hide = @$('.terms input').filter(':not(:checked)').map( -> $(@).val!).get!
            console.log hide
            @top-terms.each (x) -> x.set hidden: (x.get(\identifier) in hide)
        'change .layout': (e) ->
            @trigger \chosen:layout, $(e.target).val!
            $(e.target).blur!
