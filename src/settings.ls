Backbone = require \backbone
{UniqueCollection} = require './unique-collection'
{split, join} = require 'prelude-ls'


export class Settings extends Backbone.View

    tagName: \form
    className: \settings

    initialize: ->
        @classes = new Backbone.Collection
        @classes.on 'add', @~insert-class
        @paths = new UniqueCollection [], key-fn: (.path)
        @paths.on 'add', @~insert-path

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

        select = $ '<select>' .add-class \companies .append-to @el
        add-company = select~append . (-> "<option>#{ it }</option>") . (.get \name)
        @collection.each add-company
        @$el.append """<select class="layout">
            <option value="BT">Vertical</option>
            <option value="LR">Horizontal</option>
            <option value="TB">Inverse Vertical</option>
            <option value="RL">Inverse Horizontal</option>
        </select>
        """
        @$el.append """<button class="small add-contractors">Add contractors</button>"""
        @$el.append """<button class="small add-secretaries">Add secretaries</button>"""
        @$el.append """<button class="small add-banks">Add banks</button>"""
        @$el.append """
            <label>
                <input type="checkbox" class="align-attrs">
                Align attributes
            </label>
            <label>
                <input type="checkbox" checked class="show-attrs">
                Show attributes
            </label>
        """
        @$el.append """
            <div class="section-container auto" data-section>
              <section class="active">
                <p class="title" data-section-title><a href="#">Filter By Path</a></p>
                <div class="content paths" data-section-content>
                </div>
              </section>
              <section class="active">
                <p class="title" data-section-title><a href="#">Filter By Type</a></p>
                <div class="content classes" data-section-content>
                </div>
              </section>
            </div>
        """
        @classes.each @~insert-class
        @paths.each @~insert-path

    add-class: (cls) ->
        unless @classes.any ((c) -> cls is c.get \name)
            @classes.add name: cls

    insert-class: (cls) ~>
        @$('.classes').append """
            <label>
                <input type="checkbox" value="#{ cls.escape \name }" checked=#{ cls.get \hidden }/>
                #{cls.escape \name}
            </label>
        """
        $(document).foundation \section, \reflow

    insert-path: (pth) ->
        human-path = join ' > ', split '.', pth.get \path
        @$('.paths').append """
            <label>
                <input type="checkbox" value="#{ pth.escape \path }" checked=#{ pth.get \hidden }/>
                #{ human-path }
            </label>
        """
        $(document).foundation \section, \reflow

    events: ->
        'click .clear-filter': (e) ->
            e.prevent-default!
            @$('.find').val null
        'keyup .find': (e) -> @trigger \filter, e.target.value
        'change .companies': (e) ->
            @trigger \chosen:company, $(e.target).val!
            $(e.target).blur!
        'click .align-attrs': (e) ->
            @trigger \align:attrs, @$('.align-attrs').is \:checked
        'click .show-attrs': (e) ->
            @trigger \hide:attrs, not @$('.show-attrs').is \:checked
        'click .classes': (e) ->
            hide = @$('.classes input').filter(':not(:checked)').map( -> $(@).val!).get!
            @classes.each (cls) -> cls.set hidden: (cls.get(\name) in hide)
        'click .paths': (e) ->
            hide = @$('.paths input').filter(':not(:checked)').map( -> $(@).val!).get!
            @paths.each (pth) -> pth.set hidden: (pth.get(\path) in hide)
        'change .layout': (e) ->
            @trigger \chosen:layout, $(e.target).val!
            $(e.target).blur!
        'click .add-contractors': (e) ->
            e.prevent-default!
            @trigger \show:contractors, @$('.companies').val!
        'click .add-secretaries': (e) ->
            e.prevent-default!
            @trigger \show:secretaries, @$('.companies').val!
        'click .add-banks': (e) ->
            e.prevent-default!
            @trigger \show:banks, @$('.companies').val!

