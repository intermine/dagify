Backbone = require \backbone
{TermControl} = require './term-toggle.ls'

export class RootTerm extends Backbone.View

    tag-name: \dd
    class-name: \root-term

    initialize: ({@high-level-terms, @low-level-terms}) ->
        @state = new Backbone.Model selection: \high
        @high-level-terms.on \add, @~append-high-level-term
        @low-level-terms.on \add, @~append-low-level-term
        @state.on \change:selection, @~tab-select
        @on \currentRoot, (root) ~>
            if root is @model
                @$('.title').add-class \active
                @$('.sub-terms').add-class \active
            else
                @$('.sub-terms').remove-class \active
                @$('.title').remove-class \active

    render: ->
        {is-current} = @model.toJSON!
        @el.innerHTML = """
            <a href="#"
                class="title #{ if is-current then \active else ''}">
                #{ @model.escape \name }
            </a>
            <div class="sub-terms content #{ if is-current then \active else ''}">
                <dl class="tabs" data-tab>
                  <dd class="active high-level"><a>High Level</a></dd>
                  <dd class="low-level"><a>Low Level</a></dd>
                </dl>
                <div class="tabs-content">
                  <div class="active content high-level"></div>
                  <div class="content low-level"></div>
                </div>
                <button class="button tiny invert">Invert Selection</button>
            </div>
        """
        @high-level-terms.each @~append-high-level-term
        @low-level-terms.each @~append-low-level-term
        return this

    append-high-level-term: (term) ->
        return unless term.get(\rootTerm) is @model
        @$('.content.high-level').append @term-control \high-level-term, term, \descendents, "child terms", \hidden

    append-low-level-term: (term) ->
        return unless term.get(\rootTerm) is @model
        @$('.content.low-level').append @term-control \low-level-term, term, \ancestors, "parent terms", \noneabove

    term-control: (cls, term, prop, desc, toggle) ->
        (.render!.el) new TermControl {model: term, cls, prop, desc, toggle}

    tab-select: (state, cls) ->
        @$('.tabs dd').remove-class \active
        @$(".tabs .#{ cls }-level").add-class \active
        @$('.tabs-content .content').remove-class \active
        @$(".tabs-content .content.#{ cls }-level").add-class \active

    invert-selection = (e) ->
        e.stop-propagation!
        m = @model
        sel = @state.get \selection
        coll = switch sel
            | \high     => @high-level-terms
            | \low      => @low-level-terms
            | otherwise => throw new Error "illegal selection"
        prop = switch sel
            | \high     => \hidden
            | \low      => \noneabove
            | otherwise => throw new Error "illegal selection"
        # Flag update as batched, so they don't all go through.
        [t] = for term in coll.filter (.get(\rootTerm) is m)
            term.set prop, (not term.get prop), batch: true
        t?.trigger "change:#{ prop }", t, t.get prop # Send the update bat-signal

    events: ->
        'click .invert': invert-selection
        'click .tabs .high-level': -> @state.set selection: \high
        'click .tabs .low-level': -> @state.set selection: \low
        'click .title': (e) ->
            e.stop-propagation!
            @$('.sub-terms').toggle-class \active # Will be overridden if change
            @trigger \select:rootTerm, @model

