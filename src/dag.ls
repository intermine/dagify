dagre-d3 = require \dagre-d3
d3 = require \d3
Backbone = require \backbone
{UniqueCollection} = require './unique-collection.ls'
{key-code} = require './keycodes.ls'
{ancestors-of, get-rank} = require './graph-utils.ls'

{difference, maximum, minimum, filter, max, pairs-to-obj, split, id, any, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

class CanBeHidden extends Backbone.Model

    defaults: {hidden: false, nonebelow: false, noneabove: false}

export class DAG extends Backbone.View

    initialize: (opts = {}) ->
        @rank-scale = opts.rank-scale ? [1, 1]
        @node-labels = opts.node-labels ? <[name value label class]>
        @edge-labels = opts.edge-labels ? <[name value label class]>
        @is-closable = opts?.is-closable ? (node) -> true
        @get-node-class = opts?.get-node-class ? (-> null)
        @get-roots = opts?.get-roots ? (.sinks!)
        edge-props = opts?.edge-props ? <[source target]>
        @edge-vec = (f, edge) --> map f . edge~get, edge-props
        node-key = opts?.node-key ? (.id)
        edge-key = opts?.edge-key ? (e) -> join \-, map node-key . (e.), edge-props
        @node-models = new UniqueCollection [], key-fn: node-key
        @node-models.model = CanBeHidden
        @edge-models = new UniqueCollection [], key-fn: edge-key
        @state = new Backbone.Model do
            zoom: 1
            rankDir: \BT
            hidden-classes: []
            hidden-paths: []
            translate: [20, 20]
            duration: 0ms
            root-filter: (g, x) --> true

        @set-up-listeners!

    set-root-filter: (f) -> @state.set \rootFilter, (g, nid) --> f g.node(nid).toJSON!, g

    within = (target, search-space) ->
        ~String(search-space).to-lower-case!index-of target

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
            @state.set \duration, 350ms
            @update-graph!

        @state.on 'change:filter', (s, filter-term) ~>
            sel = @renderer._nodeRoots # TODO - expose this in Renderer
            label = @renderer.get-node-label!
            normed = filter-term?.to-lower-case!
            g = @graph
            f = (nid) ->
                | normed?.length => filter-term is nid or normed `within` label g.node nid
                | otherwise      => false
            sel.classed \filtered, f
            # TODO: zoom into singly matching nodes...
            # matching = filter f, g.nodes!
            # if matching.length is 1
            #    console.log matching

        on-graph-change = ~>
            @graph = null
            @state.set \duration, 350ms

        @node-models.on 'add reset', on-graph-change
        @edge-models.on 'add reset', on-graph-change
        @node-models.on 'change:nonebelow change:hidden change:noneabove', ~>
            @graph = null
            @state.set \duration, 350ms
            @update-graph!

        @on \redraw, ~>
            @graph = null
            @update-graph!

        shift = (dx, dy, event) ~~>
            [x, y] = @state.get \translate
            @state.set translate: [x + dx, y + dy]

        # Translation adjustment gratefully taken from:
        #   http://bl.ocks.org/linssen/7352810 
        zoom = (factor, event) ~~>
            [x, y] = @state.get \translate
            scale  = @state.get \zoom
            {cx, cy} = @get-el-dims!

            new-zoom = scale + factor
            [tx, ty] = [(cx - x) / scale, (cy - y) / scale]
            [lx, ly] = [tx * new-zoom + x, ty * new-zoom + y]
            new-translate = [x + cx - lx, y + cy - ly]

            d3.transition!
              .duration 750ms # @state.get \duration
              .tween \zoom, ~>
                interp-tr = d3.interpolate [x, y], new-translate
                interp-sc = d3.interpolate scale, new-zoom
                (time) ~> @state.set do
                    zoom: interp-sc time
                    translate: interp-tr time

        move = pairs-to-obj [
            [key-code.UP, shift 0, 100],
            [key-code.DOWN, shift 0, -100],
            [key-code.LEFT, shift 100, 0],
            [key-code.RIGHT, shift -100, 0],
            [key-code.MINUS, zoom -0.2],
            [key-code.PLUS, zoom 0.2],
            [key-code.HOME, @~fit-to-bounds]
        ]

        $(window).on \keyup, (e) -> move[e.key-code]?! unless $(e.target).is \input


    get-el-centre: ->

    get-el-dims: ->
        padding = 20px
        el-dims = pairs-to-obj [[name, @$el[name]! - padding * 2] for name in <[ height width ]>]
            ..top = padding
            ..bottom = ..height + padding
            ..left = padding
            ..cx = ..width / 2 + ..left
            ..cy = ..height / 2 + ..top
            ..right = ..width + padding

    get-node-dims: -> first [e.get-bounding-client-rect! for sel in @g for e in sel]

    contains = (outer, inner) ->
        inner.left >= outer.left
          and inner.right <= outer.right
          and inner.top >= outer.top
          and inner.bottom <= outer.bottom

    fit-to-bounds: (recurrance = 0) ->
        node-bounds = @get-node-dims!
        el-dims = @get-el-dims!

        return if recurrance and el-dims `contains` node-bounds or recurrance > 10

        {zoom, translate: [x, y]} = @state.toJSON!

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

        [nx, ny] = [node-bounds[size] / 2 + node-bounds[offset] for [size, offset] in [<[width left]>, <[height top]>]]

        dx = el-dims.cx - nx
        dy = el-dims.cy - ny

        new-translation = [new-x + dx, new-y + dy]
        @state.set translate: new-translation

        set-timeout (~> @fit-to-bounds recurrance + 1), 10ms

    set-graph: ({nodes, edges}) ->
        @node-models.reset nodes
        @edge-models.reset edges
        @state.set \duration, 700ms
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

    node-is-hidden = ({hide-attrs, hidden-classes, hidden-paths}, unwanted-kids, unwanted-parents, nm) -->
        node = nm.toJSON!
        cls = node.class
        pth = node.path
        nt = node.node-type
        node.hidden or node.noneabove
                    or (nm in unwanted-kids)
                    or (nm in unwanted-parents)
                    or (hide-attrs and nt is \attr)
                    or (cls in hidden-classes)
                    or (any pth~match, hidden-paths)

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
            ends = @edge-vec id, edge
            [source, target] = map @node-models~key-fn, ends
            g.add-edge @edge-models.key-for(edge), source, target, edge

        @trigger \whole:graph, g # Let interested parties know what the full graph looks like.

        unwanted-kids = [g.node(n) for n in g.nodes!
                                   when g.out-edges(n).length # this is required. No idea why
                                   and all (-> g.node(it).get \nonebelow), g.successors(n)]
        unwanted-parents = [g.node(p) for n in g.nodes!.filter (-> g.node(it).get(\noneabove))
                                      for p in ancestors-of g, n
                                      when g.out-edges(p).length]

        protected-parents = if unwanted-parents.length is 0
            []
        else
            [g.node(p) for n in g.nodes!.filter (-> g.node(it).get \direct and not g.node(it).get \noneabove)
                       for p in [n] ++ ancestors-of g, n]

        unwanted-parents = difference unwanted-parents, protected-parents

        can-reach-any = (roots, nid) -->
            succ = g.successors nid
            (nid in roots) or (any (in roots), succ) or (any (can-reach-any roots), succ)

        is-hidden = node-is-hidden @state.toJSON!, unwanted-kids, unwanted-parents

        roots = filter (@state.get(\rootFilter) g), @get-roots g

        # Now trim the graph down, first any user configured filter
        g = g.filter-nodes ((nid) ~> @node-filter g.node(nid).toJSON!, nid, g) if @node-filter?

        # Then standard filter.
        g = g.filter-nodes (nid) -> not is-hidden g.node(nid)

        # and once more, getting rid of now stranded sections.
        g = g.filter-nodes can-reach-any roots

        align-attrs = @state.get \alignAttrs
        g.each-node (nid, nm) ->
            if align-attrs and \attr is nm.get \nodeType
                nm.rank = \min
            else
                delete nm.rank

        console.debug "Graph construction took #{ (new Date().get-time! - start) / 1e4ms } secs"
        console.debug "Order: #{ g.order! }, size: #{ g.size! }"
        return @graph = g

    get-renderer: ->

        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph  = @get-graph!

        node-labels = @node-labels
        edge-labels = @edge-labels
        labeler = (labels, model) --> (model.get find model~has, labels) ? ''
        @renderer = new dagre-d3.Renderer
            ..get-node-label labeler node-labels
            ..get-edge-label labeler edge-labels
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
            rank = get-rank g, nid

            svg-node.select-all \.label-bkg
                    .attr \opacity, @opacity-scale rank

            svg-node.classed "rank-#{ rank }", true
            title = labeler node
            svg-node.select-all \title
              .data [title]
              .enter!
              .append \title
              .text (d) -> d
            if @is-closable node
                svg-node.on \click, ~>
                    node.set nonebelow: not node.get \nonebelow
                    svg-node.classed \nonebelow, node.get \nonebelow
            nc = @get-node-class g, nid, node
            svg-node.classed nc, true if nc?

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
        duration = @state.get \duration
        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph = @get-graph!

        max-rank = maximum map (get-rank graph), graph.nodes!

        @opacity-scale = if not max-rank
            id
        else
            d3.scale.linear!.domain [max-rank, 0]
                    .range @rank-scale
                    .interpolate d3.interpolate-number

        start = new Date().get-time!

        @renderer.graph graph
            ..layout layout
            ..transition (.duration duration) . (.transition!)
            ..update!

        console.debug "Update took #{ (new Date().get-time! - start) / 1000ms } seconds"
        set-timeout @~fit-to-bounds, duration + 1ms if graph.size!

