Backbone = require \backbone

export class TermControl extends Backbone.View

    tag-name: \label

    initialize: (@options) ->
        @model.on "change:#{ @options.toggle }", (m, not-checked) ~>
            @$('input').prop \checked, not not-checked

    render: ->
        {cls, toggle, prop, desc} = @options
        @$el
            ..add-class cls
            ..html """
            <input type="checkbox" value="#{ @model.escape \identifier }" 
                checked="#{ not @model.get toggle }"/>
            <span class="detail">#{@model.escape prop} #{ desc }</span>
            <span class="name">#{@model.escape \name}</span>
        """
        return this

    events: ->
        'change input': (e) ->
            @model.toggle @options.toggle
