dagre-d3 = require \dagre-d3
d3 = require \d3
Backbone = require \backbone
{UniqueCollection} = require './unique-collection'
{key-code} = require './keycodes'

{pairs-to-obj, split, id, any, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

export class DAG extends Backbone.View

    initialize: ->
        @node-models = new UniqueCollection [], key-fn: (.id)
        @edge-models = new UniqueCollection [], key-fn: (e) -> join \-, map (.id) . (e.), <[ source target ]>
        @state = new Backbone.Model zoom: 1, rankDir: \BT, hidden-classes: [], hidden-paths: [], translate: [20, 20]
        @set-up-listeners!

    set-up-listeners: ->
        @state.on \change:translate, (s, current-translation) ~>
            @zoom.translate current-translation
            @g.attr \transform, "translate(#{ current-translation }) scale(#{ s.get \zoom })"

        @state.on \change:zoom, (s, current-zoom) ~>
            @zoom.scale current-zoom
            @g.attr \transform, "translate(#{ s.get(\translate) }) scale(#{ current-zoom })"

        @state.on \change:rankDir, @~update-graph
        @state.on 'change:alignAttrs change:hideAttrs change:hiddenClasses change:hiddenPaths', ~>
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

        state = @state
        shift = (dx, dy) -> ->
            [x, y] = state.get \translate
            state.set translate: [x + dx, y + dy]
        zoom = (incr) -> -> state.set zoom: state.get(\zoom) + incr

        move = pairs-to-obj [
            [key-code.UP, shift 0, 100],
            [key-code.DOWN, shift 0, -100],
            [key-code.LEFT, shift 100, 0],
            [key-code.RIGHT, shift -100, 0],
            [key-code.MINUS, zoom -0.1],
            [key-code.PLUS, zoom 0.1],
            [key-code.HOME, @~fit-to-bounds]
        ]

        $(window).on \keyup, (e) -> move[e.key-code]?! unless $(e.target).is \input

    get-el-dims: ->
        padding = 20px
        el-dims = pairs-to-obj [[name, @$el[name]! - padding * 2] for name in <[ height width ]>]
            ..top = padding
            ..bottom = ..height + padding
            ..left = padding
            ..right = ..width + padding

    get-node-dims: -> first [e.get-bounding-client-rect! for sel in @g for e in sel]

    fit-to-bounds: ->
        {zoom, translate: [x, y]} = @state.toJSON!
        node-bounds = @get-node-dims!
        el-dims = @get-el-dims!

        # Get the most egregiously wrong ratio
        [dw, dh] = [node-bounds[prop] - el-dims[prop] for prop in <[width height]>]
        ratio =
            | dw > dh   => el-dims.width / node-bounds.width
            | otherwise => el-dims.height / node-bounds.height

        new-zoom = zoom * ratio
        new-x = x * new-zoom
        new-y = y * new-zoom

        # Apply the scale changes.
        @state.set zoom: new-zoom, translate: [new-x, new-y]

        ## TODO: Is there a one step way to calculate this??

        node-bounds = @get-node-dims! # Get the recalculated dimensions, for centering

        [ex, ey] = [el-dims[size] / 2 + el-dims[offset] for [size, offset] in [<[width left]>, <[height top]>]]
        [nx, ny] = [node-bounds[size] / 2 + node-bounds[offset] for [size, offset] in [<[width left]>, <[height top]>]]
        dx = ex - nx
        dy = ey - ny

        @state.set translate: [new-x + dx, new-y + dy]

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

    node-is-hidden = ({hide-attrs, hidden-classes, hidden-paths}, unwanted-kids, nm) -->
        node = nm.toJSON!
        cls = node.class
        pth = node.path
        nt = node.node-type
        (nm in unwanted-kids) or (hide-attrs and nt is \attr) or (cls in hidden-classes) or (any pth~match, hidden-paths)

    get-graph: ->
        return @graph if @graph?
        start = new Date().get-time!
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

        console.log "Graph construction took #{ (new Date().get-time! - start) / 1e4ms } secs"
        console.log "Order: #{ g.order! }, size: #{ g.size! }"
        return @graph = g

    get-renderer: ->

        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph  = @get-graph!

        @renderer = new dagre-d3.Renderer
            ..get-node-label (nm) -> nm.get find nm~has, <[name address value label class]>
            ..get-edge-label (em) -> if em.has(\label) then em.get(\label) else ''
            ..node-join-key (d) -> d
            ..edge-join-key (d) -> d
            ..layout layout
            ..graph graph

        super-draw-node = @renderer.draw-node!
        @renderer.draw-node (g, nid, svg-node) ~>
            super-draw-node g, nid, svg-node
            labeler = @renderer.get-node-label!
            node = @graph.node nid
            svg-node.classed \nonebelow, node.get \nonebelow
            svg-node.append \title
                    .text labeler node
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
                <filter id="dropshadow" height="130%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> <!-- stdDeviation is how much to blur -->
                    <feOffset dx="2" dy="2" result="offsetblur"/> <!-- how much to offset -->
                    <feMerge> 
                        <feMergeNode/> <!-- this contains the offset blurred image -->
                        <feMergeNode in="SourceGraphic"/> <!-- this contains the element that the filter is applied to -->
                    </feMerge>
                </filter>
                <g transform="translate(20,20)"/>
            </svg>
        """

        @svg = d3.select 'svg'
        @g = d3.select 'svg g'

        @zoom = d3.behavior.zoom!
            .scale @state.get \zoom
            .on \zoom, ~> @state.set zoom: d3.event.scale, translate: d3.event.translate.slice!

        @svg.call @zoom

        @get-renderer!run @g

        return this

    update-graph: ->

        return unless @renderer? # Not rendered for first time yet.
        duration = 500ms
        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph = @get-graph!

        start = new Date().get-time!
        @renderer.graph graph
            ..layout layout
            ..transition (.duration duration) . (.transition!)
            ..update!

        set-timeout @~fit-to-bounds, duration + 1ms

        console.log "Update took #{ (new Date().get-time! - start) / 1000ms } seconds"
