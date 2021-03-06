dagre-d3 = require \dagre-d3
d3 = require \d3
Backbone = require \backbone

{UniqueCollection} = require './unique-collection.ls'
{key-code} = require './keycodes.ls'
{can-reach-any, ancestors-of, get-rank, get-root} = require './graph-utils.ls'

{union, difference, maximum, minimum, filter, max, pairs-to-obj, split, id, any, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

class CanBeHidden extends Backbone.Model

    defaults: {hidden: false, nonebelow: false, noneabove: false}

    toggle: (prop) -> @set prop, not @get prop

export class DAG extends Backbone.View

    initialize: (opts = {}) ->
        @rank-scale = opts.rank-scale ? [1, 1]
        @node-labels = opts.node-labels ? <[name value label class]>
        @edge-labels = opts.edge-labels ? <[name value label class]>
        @is-closable = opts?.is-closable ? (node) -> true
        @on-node-click = opts?.on-node-click
        @on-edge-click = opts?.on-edge-click
        @get-node-class = opts?.get-node-class ? (-> null)
        @get-edge-class = opts?.get-edge-class ? (-> null)
        @get-roots = opts?.get-roots ? (.sinks!)
        @get-ends = opts.get-ends ? (edge) -> map @node-models~key-fn, @edge-vec id, edge
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

    add-centre = (dims) ->
        dims.cx = dims.width / 2 + dims.left
        dims.cy = dims.height / 2 + dims.top
        dims

    pos-info = add-centre . (.get-bounding-client-rect!) . first . first

    zoom-to = (new-zoom, [dx, dy]) ->
        state = @state
        dz = @zoom
        [x, y] = state.get \translate
        scale  = state.get \zoom
        {cx, cy} = @get-el-dims!
        [tx, ty] = [(cx - x + dx) / scale, (cy - y + dy) / scale]
        [lx, ly] = [tx * new-zoom + x, ty * new-zoom + y]
        new-translate = [x + cx - lx, y + cy - ly]
        dz.scale new-zoom
        dz.translate new-translate

        d3.transition!
            .duration 750ms # @state.get \duration
            .call dz~event

    zoom-to: (nid) ->
        return unless @renderer?
        el-dims = @get-el-dims!
        b-rect = pos-info @renderer.node-roots!.filter (is nid)
        [dx, dy] = [b-rect[dim] - el-dims[dim] for dim in <[ cx cy ]>]
        return zoom-to.call @, 0.9, [dx - b-rect.width, dy]

    set-up-listeners: ->
        @state.on \change:translate, (s, current-translation) ~>
            @zoom?.translate current-translation
            @g.attr \transform, "translate(#{ current-translation }) scale(#{ s.get \zoom })"

        @state.on \change:zoom, (s, current-zoom) ~>
            @zoom?.scale current-zoom
            @g.attr \transform, "translate(#{ s.get(\translate) }) scale(#{ current-zoom })"

        @state.on \change:rankDir, @~update-graph
        @state.on 'change:alignAttrs change:hideAttrs change:hiddenClasses change:hiddenPaths', ~>
            @graph = null
            @state.set \duration, 350ms
            @update-graph!

        @state.on 'change:filter', (s, filter-term) ~>
            n-sel    = @renderer.node-roots!
            e-sel    = @renderer.edge-roots!

            label  = @renderer.get-node-label!
            normed = String(filter-term ? '').to-lower-case!
            g      = @graph
            n-sel.classed \filtered, n-f =
                | normed?.length => (nid) -> filter-term is nid or normed `within` label g.node nid
                | otherwise      => -> false
            e-sel.classed \filtered, (eid) -> any n-f, g.incident-nodes eid

            @fit-to-bounds! unless filter-term?

        on-graph-change = ~>
            @graph = null
            @state.set \duration, 350ms

        @node-models.on 'add reset', on-graph-change
        @edge-models.on 'add reset', on-graph-change
        @node-models.on 'change:nonebelow change:hidden change:noneabove', (m, v, {batch} = {}) ~>
            return if batch
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
            scale  = @state.get \zoom
            zoom-to.call @, (scale + factor), [0, 0]

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


    get-el-dims: ->
        padding = 20px
        el-dims = pairs-to-obj [[name, @$el[name]! - padding * 2] for name in <[ height width ]>]
            ..top = padding
            ..bottom = ..height + padding
            ..left = padding
            ..cx = ..width / 2 + ..left
            ..cy = ..height / 2 + ..top
            ..right = ..width + padding

    get-node-dims: -> pos-info @g

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
        @zoom.scale(new-zoom).translate([new-x, new-y]).event @g
        # @state.set zoom: new-zoom, translate: [new-x, new-y]

        ## TODO: Is there a one step way to calculate this??

        node-bounds = @get-node-dims! # Get the recalculated dimensions, for centering

        [nx, ny] = [node-bounds[size] / 2 + node-bounds[offset] for [size, offset] in [<[width left]>, <[height top]>]]

        dx = el-dims.cx - nx
        dy = el-dims.cy - ny

        new-translation = [new-x + dx, new-y + dy]
        # @state.set translate: new-translation
        @zoom.translate(new-translation).event @g

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

    node-is-hidden = ({hide-attrs, hidden-classes, hidden-paths}, black-list, nm) -->
        node = nm.toJSON!
        cls = node.class
        pth = node.path
        nt = node.node-type
        node.hidden or (nm in black-list)
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
            [source, target] = @get-ends edge
            g.add-edge @edge-models.key-for(edge), source, target, edge

        @trigger \whole:graph, g # Let interested parties know what the full graph looks like.

        roots = filter (@state.get(\rootFilter) g), @get-roots g

        # Reduce to the current subgraph.
        g = g.filter-nodes can-reach-any g, roots

        unwanted-kids = [n for n in g.nodes!
                            when g.out-edges(n).length # this is required. No idea why
                            and all (-> g.node(it).get \nonebelow), g.successors(n)]
        unwanted-parents = [p for n in g.nodes!
                              when g.node(n).get \noneabove
                                for p in [n] ++ ancestors-of g, n
                                when g.out-edges(p).length]

        protected-parents = if unwanted-parents.length is 0
            []
        else
            [p for n in g.nodes!
                      when g.node(n).get \direct
                          and not g.node(n).get \noneabove
                      for p in [n] ++ ancestors-of g, n]

        unwanted = union unwanted-kids, unwanted-parents
        black-list = map g~node, unwanted `difference` protected-parents

        is-hidden = node-is-hidden @state.toJSON!, black-list

        # Now trim the graph down, first any user configured filter
        g = g.filter-nodes ((nid) ~> @node-filter g.node(nid).toJSON!, nid, g) if @node-filter?

        # Then standard filter.
        g = g.filter-nodes (nid) -> not is-hidden g.node(nid)

        # and once more, getting rid of now stranded sections.
        g = g.filter-nodes can-reach-any g, roots

        align-attrs = @state.get \alignAttrs
        g.each-node (nid, nm) ->
            if nid in roots
                nm.rank = \max
            else if align-attrs and \attr is nm.get \nodeType
                nm.rank = \min
            else
                delete nm.rank

        console.debug "Graph construction took #{ (new Date().get-time! - start) / 1e4ms } secs"
        console.debug "Order: #{ g.order! }, size: #{ g.size! }"
        return @graph = g

    get-renderer: ->

        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph  = @get-graph!

        max-rank = maximum map (get-rank graph), graph.nodes!

        @opacity-scale = if not max-rank
            id
        else
            d3.scale.linear!.domain [max-rank, 0]
                    .range @rank-scale
                    .interpolate d3.interpolate-number

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

        super-draw-edge = @renderer.draw-edge!
        @renderer.draw-edge (g, eid, sel) ~>
          super-draw-edge ...arguments
          edge-class = @get-edge-class @graph.edge eid
          sel.classed edge-class, true if edge-class?
          sel.select-all('path').on \click, ~> @trigger 'click:edge', @graph, eid, sel
          sel.select-all('.edge-label').on \click, ~> @trigger 'click:edge', @graph, eid, sel
          if @on-edge-click?
              sel.select-all('path').on \click, ~> @on-edge-click @graph, eid, sel
              sel.select-all('.edge-label').on \click, ~> @on-edge-click @graph, eid, sel

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

            svg-node.on \click, ~> @trigger 'click:node', nid, node, svg-node
            nc = @get-node-class node
            svg-node.classed nc, true if nc?

        @on \click:node, (nid, node, svg-node) ~>
            if @on-node-click?
                @on-node-click nid, node, svg-node
            else if @is-closable node
                node.set nonebelow: not node.get \nonebelow
                svg-node.classed \nonebelow, node.get \nonebelow

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
                <!-- a transparent grey glow with no offset -->
                <filter id="glow">
                    <!-- Returns a green colour -->
                    <feColorMatrix type="matrix" values=
                                "0 0 0 0 0
                                 1 1 1 1 0
                                 0 0 0 0 0
                                 0 0 0 1 0"/>
                    <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                <g transform="translate(20,20)"/>
            </svg>
        """

        @svg = d3.select 'svg'
        @g = d3.select 'svg g'

        @zoom = d3.behavior.zoom!
            .scale @state.get \zoom
            .translate @state.get \translate
            .on \zoom, ~> @state.set zoom: d3.event.scale, translate: d3.event.translate.slice!

        @svg.call @zoom

        @get-renderer!run @g

        return this

    update-graph: ->

        return unless @renderer? # Not rendered for first time yet.
        duration = @state.get \duration
        layout = dagre-d3.layout!rank-dir @state.get \rankDir
        graph = @get-graph!

        start = new Date().get-time!

        @renderer.graph graph
            ..layout layout
            ..transition (.duration duration) . (.transition!)
            ..update!

        console.debug "Update took #{ (new Date().get-time! - start) / 1000ms } seconds"
        set-timeout @~fit-to-bounds, duration + 1ms if graph.size! # TODO: avoid this if already zoomed?

