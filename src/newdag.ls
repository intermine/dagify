Backbone = require \backbone
Q = require \q
d3 = require \d3
dagre-d3 = require \dagre-d3
Backbone.$ = $
{split, id, any, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

node-padding = 20px

class UniqueCollection extends Backbone.Collection

    (elems, {@key-fn}:opts) ->
        super elems, opts

    is-array = is-type \Array

    add: (args, opts) ->
        to-add = if is-array args then args else [args]
        for arg in to-add
            unless @any((m) ~> (@key-fn arg) is (@key-for m))
                super arg, opts

    key-for: (m) -> @key-fn m.toJSON!

class Settings extends Backbone.View

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
            <option value="LR">Horizontal</option>
            <option value="BT">Vertical</option>
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
        'change .companies': (e) -> @trigger \chosen:company, $(e.target).val!
        'click .align-attrs': (e) ->
            @trigger \align:attrs, @$('.align-attrs').is \:checked
        'click .classes': (e) ->
            hide = @$('.classes input').filter(':not(:checked)').map( -> $(@).val!).get!
            @classes.each (cls) -> cls.set hidden: (cls.get(\name) in hide)
        'click .paths': (e) ->
            hide = @$('.paths input').filter(':not(:checked)').map( -> $(@).val!).get!
            @paths.each (pth) -> pth.set hidden: (pth.get(\path) in hide)
        'change .layout': (e) -> @trigger \chosen:layout, $(e.target).val!
        'click .add-contractors': (e) ->
            e.prevent-default!
            @trigger \show:contractors, @$('.companies').val!
        'click .add-secretaries': (e) ->
            e.prevent-default!
            @trigger \show:secretaries, @$('.companies').val!
        'click .add-banks': (e) ->
            e.prevent-default!
            @trigger \show:banks, @$('.companies').val!

class DAG extends Backbone.View

    initialize: ->
        @node-models = new UniqueCollection [], key-fn: (.id)
        @edge-models = new UniqueCollection [], key-fn: (e) -> join \-, map (.id) . (e.), <[ source target ]>
        @state = new Backbone.Model zoom: 1, rankDir: \LR, hidden-classes: [], hidden-paths: []
        @set-up-listeners!

    set-up-listeners: ->
        @state.on \change:translate, (s, current-translation) ~>
            @g.attr \transform, "translate(#{ current-translation }) scale(#{ s.get \zoom })"

        @state.on \change:zoom, (s, current-zoom) ~>
            @g.attr \transform, "translate(#{ s.get(\translate) }) scale(#{ current-zoom })"

        @state.on \change:rankDir, @~update-graph
        @state.on 'change:alignAttrs change:hiddenClasses change:hiddenPaths', ~>
            @graph = null
            @update-graph!

        @state.on 'change:filter', (s, filter-term) ~>
            sel = @renderer._nodeRoots # TODO - expose this in Renderer
            label = @renderer.get-node-label!
            normed = filter-term?.to-lower-case!
            g = @graph
            sel.classed \filtered, (nid, i) ->
                return false unless normed? and normed.length
                return true if ~String(label g.node nid).to-lower-case!index-of normed

        @node-models.on 'add reset', ~> @graph = null
        @edge-models.on 'add reset', ~> @graph = null
        @node-models.on 'change:nonebelow', ~>
            @graph = null
            @update-graph!

    events: ->
        'term:highlight': (nid) ->
            scale = @descale!
            @nodes.attr \opacity, (datum) -> if (not nid) or (datum is nid) then 1 else 0.5

    set-graph: ({nodes, edges}) ->
        @node-models.reset nodes
        @edge-models.reset edges
        @update-graph!

    add-node: (node) ->
        # Preserve uniqueness
        @node-models.add node

    add-edge: (edge) ->
        # Preserve uniqueness
        @edge-models.add edge

    set-layout: (layout) -> @state.set \rankDir, layout

    to-string: -> """[views/dag/DAG #{ @cid }]"""

    descale: -> 1 / @state.get \zoom

    marker-end: ->
        if @state.get \direction is \LR then 'url(#Triangle)' else 'url(#TriangleDown)'

    edge-vec = (f, edge) --> map f . edge~get, <[source target]>
    edge-classes = edge-vec (.class)

    node-is-hidden = ({hidden-classes, hidden-paths}, unwanted-kids, nm) -->
        node = nm.toJSON!
        cls = node.class
        pth = node.path
        (nm in unwanted-kids) or (cls in hidden-classes) or (any pth~match, hidden-paths)

    get-graph: ->
        return @graph if @graph?
        self = @

        {hidden-classes, hidden-paths} = @state.toJSON!

        g = new dagre-d3.Digraph

        @node-models.each (node) ~>
            @trigger \add:class, node.get \class
            @trigger \add:path, {path: node.get \path} if node.has \path
            g.add-node @node-models.key-for(node), node


        @edge-models.each (edge) ~>
            ends = edge-vec id, edge
            [source, target] = map @node-models~key-fn, ends
            g.add-edge @edge-models.key-for(edge), source, target, edge

        unwanted-kids = [g.node(k) for n in g.nodes!
                                   for k in g.predecessors(n)
                                   when g.node(n).get(\nonebelow) and g.out-edges(k).length <= 1]

        can-reach-any = (roots, nid) -->
            succ = g.successors nid
            (nid in roots) or (any (in roots), succ) or (any (can-reach-any roots), succ)

        is-hidden = node-is-hidden @state.toJSON!, unwanted-kids

        roots = g.sinks!
        # Now trim the graph down.
        g = g.filter-nodes (nid) -> not is-hidden g.node(nid)
        # and once more, getting rid of now stranded sections.
        g = g.filter-nodes can-reach-any roots

        align-attrs = @state.get \alignAttrs
        g.each-node (nid, nm) ->
            if align-attrs and \attr is nm.get \nodeType
                nm.rank = \min
            else
                delete nm.rank

        console.log "Order: #{ g.order! }, size: #{ g.size! }"
        return @graph = g

    get-renderer: ->

        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph  = @get-graph!

        @renderer = new dagre-d3.Renderer
            ..get-node-label (nm) -> nm.get find nm~has, <[name address value label]>
            ..get-edge-label (em) -> if em.has(\label) then em.get(\label) else ''
            ..node-join-key (d) -> d
            ..edge-join-key (d) -> d
            ..layout layout
            ..graph graph

        super-draw-node = @renderer.draw-node!
        @renderer.draw-node (g, nid, svg-node) ~>
            super-draw-node g, nid, svg-node
            node = @graph.node nid
            svg-node.classed \nonebelow, node.get \nonebelow
            if nt = node.get \nodeType
                if nt in <[ref coll]>
                    svg-node.on \click, ~>
                        node.set nonebelow: not node.get \nonebelow
                        svg-node.classed \nonebelow, node.get \nonebelow
                svg-node.classed nt, true

        @renderer

    render: ->
        @$el.append """
            <svg>
                <g transform="translate(20,20)"/>
            </svg>
        """

        @svg = d3.select 'svg'
        @g = d3.select 'svg g'

        zoom = d3.behavior.zoom!
            .scale @state.get \zoom
            .on \zoom, ~> @state.set zoom: d3.event.scale, translate: d3.event.translate.slice!

        @svg.call zoom

        @get-renderer!run @g

        @nodes = @g.selectAll '.node'

        @nodes.on \click, (nid, i) ~>
            next = @get-graph!~successors
            path = []
            succ = next nid
            while succ.length
                path = path ++ succ
                succ = next succ[0]

        return this

    update-graph: ->

        return unless @renderer? # Not rendered for first time yet.
        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph = @get-graph!

        @renderer.graph graph
            ..layout layout
            ..transition (.duration 500) . (.transition!)
            ..update!

base-query =
    from: 'Company'
    joins: ['bank']
    select: [
        \name
        \vatNumber
        \address.address
        \departments.name
        \departments.employees.address.address
        \departments.employees.name
        \departments.employees.age
        \departments.employees.fullTime
    ]

main = ->
    $(document).foundation!
    testmodel = new intermine.Service root: "http://localhost/intermine-test"

    settings = new Settings

    window.dag = new DAG el: $('body')
        ..on \add:class, settings~add-class
        ..on \add:path, settings.paths~add
        ..render!

    load-org-chart = (name) ->

        query = {where: {name}} <<< base-query
        Q.all [testmodel.query(query), testmodel.fetch-model!]
         .then ([pq, m]) ->
             fs = [process-results m.make-path view for view in pq.views]
             testmodel.records pq
                      .fail console~error
                      .then (results) ->
                          nodes = []
                          edges = []
                          for f in fs
                              f nodes~push, edges~push, results
                          dag.set-graph {nodes, edges}

    add-relation = (path-string, name) -->
        query = select: [path-string], where: {name}
        testmodel.fetch-model!then (.make-path path-string)
                    .then (path) -> process-results path, dag~add-node, dag~add-edge
                    .then (process) -> testmodel.records(query).then process
                    .done dag~update-graph

    getting-companies = testmodel.records select: <[ Company.name ]>
        ..then (companies) ->
            settings
                ..collection = new Backbone.Collection companies
                ..render!
                ..$el.append-to 'body'
            settings.classes.on \change:hidden, ->
                hidden-classes = settings.classes.filter (.get \hidden) .map (.get \name)
                dag.state.set {hidden-classes}
            settings.paths.on \change:hidden, ->
                hidden-paths = settings.paths.filter (.get \hidden) .map (.get \path)
                dag.state.set {hidden-paths}
            settings.on \filter, dag.state.set \filter, _
            settings.on \align:attrs, dag.state.set \alignAttrs, _
            settings.on \chosen:company, load-org-chart
            settings.on \chosen:layout, dag~set-layout
            settings.on \show:contractors, add-relation "Company.contractors.name"
            settings.on \show:secretaries, add-relation "Company.secretarys.name"
            settings.on \show:banks, add-relation "Company.bank.name"

            load-org-chart (.name) first companies


process-results = (path, add-node, add-edge, result) -->
    steps = path.all-descriptors!
    add-ref = (parent, path-to-here, next-step, next-depth, obj) -->
        return unless obj?
        obj <<< id: obj.object-id, node-type: \ref, path: path-to-here
        add-node obj
        add-edge source: obj, target: parent if parent?
        if next-step?
            process-level next-depth, obj, obj[next-step.name]

    process-level = (depth, parent, obj) ->
        step = steps[depth]
        next-depth = depth + 1
        path-to-here = join \., map (.name), steps.slice 0, next-depth
        next-step = steps[next-depth]
        if step.is-collection
            coll =
                id: "#{ parent.id }-#{ step.name }"
                name: step.name
                path: path-to-here
                node-type: \coll
                'class': "Collection<#{ step.referenced-type }>"
            add-node coll
            add-edge source: coll, target: parent
            each (add-ref coll, path-to-here, next-step, next-depth), obj
        else if step.fields? or step.referenced-type?
            add-ref parent, path-to-here, next-step, next-depth, obj
        else
            node =
                path: path-to-here
                node-type: \attr
                id: "#{ parent.id }-#{ step.name }"
                value: obj
                'class': step.type

            add-node node
            add-edge {label: step.name, source: node, target: parent} if parent?

    for obj in result
        process-level 0, null, obj

graphify = (path, results) -->
    nodes = []
    edges = []
    process-results path, nodes~push, edges~push, results
    {nodes, edges}

$(document).ready main

