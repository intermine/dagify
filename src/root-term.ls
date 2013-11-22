Backbone = require \backbone

export class RootTerm extends Backbone.View

    tag-name: \dd
    class-name: \root-term

    initialize: ({@high-level-terms, @low-level-terms}) ->
        @high-level-terms.on \add, @~append-high-level-term
        @low-level-terms.on \add, @~append-low-level-term
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
            </div>
        """
        @high-level-terms.each @~append-high-level-term
        @low-level-terms.each @~append-low-level-term
        return this

    append-high-level-term: (term) ->
        return unless term.get(\rootTerm) is @model
        @$('.content.high-level').append @term-control \high-level-term, term

    append-low-level-term: (term) ->
        return unless term.get(\rootTerm) is @model
        @$('.content.low-level').append @term-control \low-level-term, term

    term-control: (cls, term) -> """
        <label class="#{ cls }">
            <input type="checkbox" value="#{ term.escape \identifier }" 
                checked="#{ not term.get \hidden }"/>
            #{term.escape \name}
        </label>
    """

    set-if-unchecked = (coll, selector, key, e) -->
        e.stop-propagation!
        hide = @$(selector).filter(':not(:checked)').map( -> $(@).val!).get!
        coll.each (x) -> x.set key, (x.get(\identifier) in hide)

    tab-select = (cls, e) -->
        e.stop-propagation!
        @$('.tabs dd').remove-class \active
        @$(".tabs .#{ cls }").add-class \active
        @$('.tabs-content .content').remove-class \active
        @$(".tabs-content .content.#{ cls }").add-class \active

    events: ->
        'click .tabs .high-level': tab-select \high-level
        'click .tabs .low-level': tab-select \low-level
        'click .low-level-term': set-if-unchecked @low-level-terms, '.low-level-term input', \noneabove
        'click .high-level-term': set-if-unchecked @high-level-terms, '.high-level-term input', \hidden
        'click .title': (e) ->
            e.stop-propagation!
            @$('.sub-terms').toggle-class \active # Will be overridden if change
            @trigger \select:rootTerm, @model

