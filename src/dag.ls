{term-palette, get-min-max-size, link-fill, draw-root-labels, relationship-palette, mv-towards, brighten, BRIGHTEN, colour-filter, term-color, link-stroke, centre-and-zoom, draw-relationship-legend, draw-source-legend} = require './svg'
{to-xywh, within, to-ltrb, relationship-test} = require './util'
{sort-by, unique, id, reverse, reject, each, mean, fold, sort, join, filter, map, any} = require \prelude-ls

DAGRE = require '../vendor/dagre'

node-padding = 20px
len = (.length)

rect-color = BRIGHTEN . term-color

to-node-id = (\node +) << (.replace /:/g, \_) << (.id)

do-update = (group) ->

    group.select-all \circle.cp
        .attr \r, 10
        .attr \cx, (.x)
        .attr \cy, (.y)

    label-g = group.select-all \g.label

    label-g
        .attr \dx, ({dagre: {points}}) -> mean map (.x), points
        .attr \dy, ({dagre: {points}}) -> mean map (.y), points
        .attr \width, (.width)
        .attr \height, (.height)
        .attr \transform, ({dagre: {points}, bbox}) ->
            x = mean map (.x), points
            y = mean map (.y), points
            "translate(#{ x },#{ y })"

invert-layout = (dimensions, nodes, edges) ->
    y-stats = get-min-max-size (.dagre.y), nodes
    invert-scale = d3.scale.linear!
        .domain [y-stats.min, y-stats.max]
        .range [dimensions.h * 0.9, 0]
    invert-node = invert-scale . (.dagre.y)
    invert-points = reverse << map ({y}:pt) -> pt <<< y: invert-scale y
    for n in nodes
        n.dagre.y = invert-node n
    for e in edges
        e.dagre.points = invert-points e.dagre.points

separate-colliding = (left, right) ->
    [pt-a, pt-b] = map (to-xywh << (.bounds)), [left, right]
    speed = 0.1
    mv-towards -speed, pt-a, pt-b unless right.is-centre
    mv-towards -speed, pt-b, pt-a unless left.is-centre
    left.bounds <<< to-ltrb pt-a
    right.bounds <<< to-ltrb pt-b

de-dup = (f) -> fold ((ls, e) -> if (any (is f e), map f, ls) then ls.slice! else ls ++ [e]), []
to-combos = de-dup (join \-) << sort << (map (.id))

get-overlapping = (things) ->
    to-combos [ [t, tt] for t in things for tt in things when t isnt tt and overlaps t, tt]

explodify = (highlit, i, rounds-per-run, max-rounds, done) ->
    collisions = get-overlapping highlit
    next-break = i + rounds-per-run

    while collisions.length and i++ < max-rounds and i < next-break
        for [left, right] in collisions

            separate-colliding left, right

        collisions = get-overlapping highlit

    if collisions.length and i < max-rounds
        done!
        process.next-tick -> explodify highlit, i, rounds-per-run, max-rounds, done
    else
        console.log "#{ collisions.length } collisions left after #{ i } rounds"
        done!

add-labels = (selection) ->

    label-g = selection.append \g
        ..attr \class, \label
        ..append \rect
        ..append \text

    label-g.each (d) ->
        d.bbox = @getBBox!
        if d.label?.length
            d.width = d.bbox.width + 2 * node-padding
            d.height = d.bbox.height + 2 * node-padding
        else
            d.width = d.height = 0

    label-g.select \text
        .attr \text-anchor, \left
        .append \tspan
            .attr \dy, \1em
            .text (.label)

    label-g #.select \rect
        .attr \dx, ({dagre: {points}}) -> mean map (.x), points
        .attr \dy, ({dagre: {points}}) -> mean map (.y), points
        .attr \width, (.width)
        .attr \height, (.height)

    label-g.attr \transform, ({dagre: {points}}) ->
        x = mean map (.x), points
        y = mean map (.y), points
        "translate(#{ x },#{ y })"

only-marked = (nodes, edges) ->
    nodes: filter (.marked), nodes
    edges: filter (.marked) << (.source), edges

mark-reachable = (node) ->
    node.is-focus = true
    queue = [node]
    moar = (n) -> reject (is n), map (.target), n.edges
    while n = queue.shift!
        n.marked = true
        each queue~push, moar n

get-node-drag-pos = (pos-prop) -> -> d3.event[pos-prop]

do-line = d3.svg.line!
        .x (.x)
        .y (.y)
        .interpolate \basis

calculate-spline = (dir, {source: {dagre:source}, target:{dagre:target}, dagre: {points}}) -->
    p0 =
        | dir is \LR => x: (source.x + source.width / 2), y: source.y
        | otherwise => x: target.x, y: (target.y + target.height / 2)
    p1 =
        | dir is \LR => x: (source.x + source.width / 2 + 10px), y: source.y
        | otherwise => x: target.x, y: (target.y + 10px + target.height / 2)
    pNminus1 =
        | dir is \LR => x: (target.x - 15px - target.width / 2), y: target.y
        | otherwise => x: source.x, y: (source.y - 15px - source.height / 2)
    pN =
        | dir is \LR => x: (target.x - target.width / 2), y: target.y
        | otherwise => x: source.x, y: (source.y - source.height / 2)
    ps = [p0, p1] ++ points ++ [pNminus1, pN]

    do-line if dir is \LR then ps else reverse ps

translate-edge = (svg, e, dx, dy) -->
    for p in e.dagre.points
        p.x = p.x + dx
        p.y = p.y + dy

render-dag = (state, {reset, nodes, edges}) ->

    svg = d3.select state.get \svg

    svg.select-all(\g).remove!

    dimensions = state.get \dimensions

    svg
       .attr \width, dimensions.w
       .attr \height, dimensions.h
       .call draw-relationship-legend state, relationship-palette
       .call draw-root-labels {nodes}, dimensions
       .call draw-source-legend state, term-palette

    svg-group = svg.append(\g).attr \transform, 'translate(5, 5)'

    update = -> do-update svg-group
    spline = calculate-spline state.get \dagDirection

    re-render = -> render-dag state, it

    reset ?= -> state.set \graph, {nodes, edges} if state.get(\view) is \Dag
    get-descale = -> 1 / state.get \zoom

    state.on \nodes:marked, ->
        return if state.get(\view) isnt \Dag
        filtered = only-marked nodes, edges
        if filtered.nodes.length
            re-render filtered <<< {reset}
        else
            reset!

    console.log "Rendering #{ len nodes } nodes and #{ len edges } edges"

    svgBBox = svg.node!getBBox!

    mv-edge = translate-edge svg

    svg-group.select-all('*').remove!

    svg-edges = svg-group.select-all 'g .edge'
        .data edges

    edges-enter = svg-edges.enter!
        .append \g
        .attr \id, -> (it.source.id + it.label + it.target.id).replace /:/g, \_
        .attr \class, \edge

    svg-edges.exit!remove!

    svg-nodes = svg-group.select-all 'g .node'
        .data nodes

    nodes-enter = svg-nodes.enter!
        .append \g
        .attr \class, \node
        .attr \id, to-node-id

    svg-nodes.exit!remove!

    nodes-enter.on \click, (node) ->
        was-filtered = node.is-focus
        (.unmark!) state.get \all
        if was-filtered
            console.log "Resetting"
            reset!
        else
            mark-reachable node
            state.trigger \graph:marked
            filtered = only-marked nodes, edges
            re-render filtered <<< {reset}

    state.on \relationship:highlight, (link) ->
        scale = get-descale!
        test = relationship-test link, true
        node-test = (.edges) >> any test
        col-filt = colour-filter test
        nodes-enter
            .classed \highlight, if link then node-test else (-> false)
            .transition!
            .duration 100ms
            .attr \opacity, (node) -> if node-test node then 1 else 0.5

        edges-enter
            .transition!
            .duration 100ms
            .attr \opacity, (e) -> if test e then 0.8 else 0.2
            .attr \stroke, (e) -> link-stroke e |> col-filt e

    state.on \term:highlight, (node) ->
        scale = get-descale!
        nodes-enter
            .classed \highlight, (is node)
            .attr \opacity, (datum) -> if (not node) or (datum is node) then 1 else 0.5
            .attr \transform, ->
                | it is node => "translate(#{ it.dagre.x },#{ it.dagre.y }), scale(#{ scale })"
                | otherwise => "translate(#{ it.dagre.x },#{ it.dagre.y })"

    state.on \source:highlight, (sources) ->
        pattern = new RegExp sources
        test = pattern~test << (join \-) << (.sources)
        scale = within 2, 1, get-descale!
        nodes-enter
            .classed \highlight, test
            .attr \opacity, -> if (not sources) or (test it) then 1 else 0.5
            .attr \transform, ->
                | test it => "translate(#{ it.dagre.x },#{ it.dagre.y }), scale(#{ scale })"
                | otherwise => "translate(#{ it.dagre.x },#{ it.dagre.y })"


    marker-end = if state.get(\dagDirection) is \LR then 'url(#Triangle)' else 'url(#TriangleDown)'
    #   .attr \marker-end, marker-end

    edges-enter.append \path
        .attr \stroke-width, 5px
        .attr \opacity, 0.8
        .attr \stroke, link-stroke

    rects = nodes-enter.append \rect

    #nodes-enter.append \title
    #    .text (.label)

    drag-cp = d3.behavior.drag!
        .on \drag, (d) ->
            d.y += d3.event.dy
            mv-edge d.parent, d3.event.dx, 0
            d3.select(\# + d.parent.dagre.id).attr \d, spline

    line-wrap = (str) ->
        buff = ['']
        max-ll = 25
        for word in str.split ' '
            if buff[* - 1].length + word.length + 1 > max-ll
                buff.push ''
            buff[* - 1] += ' ' + word
        map (.substring 1), buff

    labels = nodes-enter.append \text
        .attr \class, \dag-label
        .attr \text-anchor, \middle
        .attr \x, 0
        .classed \direct, (.is-direct)

    labels.each (n) ->
        text = line-wrap n.label
        el = d3.select @
        for line in text
            el.append \tspan
                .text line
                .attr \dy, \1em
                .attr \x, 0
        bbox = @getBBox!
        n.bbox = bbox
        n.width = bbox.width + 2 * node-padding
        n.height = bbox.height + 2 * node-padding

    rects
        .attr \class, ({sources}) -> join ' ', [ \dag-term ] ++ sources
        .attr \width, (.width)
        .attr \height, (.height)
        .attr \x, (1 -) << (/ 2) << (.width)
        .attr \y, (1 -) << (/ 2) << (.height)
        .attr \fill, rect-color
        .attr \opacity, 0.8
        .classed \focus, (.is-focus)
        .classed \direct, (.is-direct)
        .classed \root, (.is-root)

    labels
        .attr \x, -> -it.bbox.width
        .attr \y, -> -it.bbox.height / 2

    dagre.layout!
        .nodeSep 50
        .edgeSep 50
        .rankSep 75
        .rankDir state.get(\dagDirection)
        .nodes nodes
        .edges edges
        .debugLevel 1
        .run!

    if state.get(\dagDirection) isnt \LR
        invert-layout state.get(\dimensions), nodes, edges

    # Apply the layout
    do apply-layout = ->
        nodes-enter.attr \transform, -> "translate(#{ it.dagre.x },#{ it.dagre.y })"

    zoom = d3.behavior.zoom!
        .scale state.get \zoom
        .on \zoom, -> state.set {zoom: d3.event.scale, translate: d3.event.translate.slice!}

    state.on \change:translate, (s, current-translation) ->
        svg-group.attr \transform, "translate(#{ current-translation }) scale(#{ s.get \zoom })"

    state.on \change:zoom, (s, current-zoom) ->
        svg-group.attr \transform, "translate(#{ s.get(\translate) }) scale(#{ current-zoom })"

    svg.call zoom

    centre-and-zoom ((.x) << (.dagre)), ((.y) << (.dagre)), state, nodes, zoom

    fix-dag-box-collisions = (max-i, d, i) -->
        return if i < max-i # only fire once, and only at the end of all transitions.
        scale = get-descale!
        half-pad = node-padding / 2
        is-focussed = -> any (.highlight), it.edges

        highlit = map (-> it <<< {bounds: to-ltrb it.dagre{x, y, height, width}, scale}), filter is-focussed, nodes

        max-rounds = 80
        round = 0
        rounds-per-run = 6

        focussed-nodes = nodes-enter.filter is-focussed
        affected-edges = edges-enter.filter (.highlight)
            .select-all \path

        reroute = ({source, target, dagre}) ->
            [s, t] = map (-> dagre: to-xywh it.bounds), [source, target]
            spline {dagre, source: s, target: t}

        explodify highlit, round, rounds-per-run, max-rounds, ->
            focussed-nodes.attr \transform, (n) ->
                {x, y} = to-xywh n.bounds
                "translate(#{ x },#{ y }) scale(#{ scale })"
            focussed-nodes.select-all \rect .attr \fill, (n) ->
                n |> rect-color |> if n.is-centre then brighten else id
            affected-edges.each (edge, i) ->
                f = ~> d3.select(@).attr \d, reroute edge
                set-timeout f, 0

    var cooldown

    focus-edges = ->
        some-lit = any (.highlight), edges

        if cooldown? and not some-lit
            clear-timeout cooldown

        delay = if some-lit then 250ms else 0

        cooldown := set-timeout (animate-focus some-lit), delay

    animate-focus = (some-lit) -> ->

        duration = 100ms
        de-scale = Math.max 1, get-descale!
        max-i = nodes.length - 1

        not-focussed = -> not some-lit or not any (.highlight), it.edges

        nodes-enter.transition!
            .duration duration * 2
            .attr \transform, ->
                | not-focussed it => "translate(#{ it.dagre.x },#{ it.dagre.y })"
                | otherwise => "translate(#{ it.dagre.x },#{ it.dagre.y }) scale(#{ de-scale })"
            .attr \opacity, ->
                | not some-lit => 1
                | any (.highlight), it.edges => 1
                | otherwise => 0.3
            .each \end, if (some-lit and de-scale > 1) then fix-dag-box-collisions max-i else (->)

        edge-paths = svg-edges.select-all \path
            .transition!
                .duration duration
                .attr \stroke-width, -> if it.highlight then 10px * de-scale else 5px
                .attr \stroke, ->
                    | it.highlight => BRIGHTEN link-stroke it
                    | otherwise    => link-stroke it
                .attr \fill, ->
                    | it.highlight => BRIGHTEN link-fill it
                    | otherwise    => link-fill it
                .attr \opacity, ->
                    | not some-lit or it.highlight => 0.8
                    | some-lit => 0.2
                    | otherwise => 0.5

        # see fix-dag-box-collisions
        unless some-lit
            edge-paths.attr \d, spline
            nodes-enter.select-all \rect
                .attr \fill, rect-color

        svg-edges.select-all \text
            .transition!
                .duration duration
                .attr \font-weight, -> if it.highlight then \bold else \normal
                .attr \font-size, -> if it.highlight then 28px else 14px

    highlight-targets = (node) ->
        svg-group.node().append-child this # Move to front

        moar = (n) -> reject (is n), map (.target), n.edges
        node.is-centre = true
        queue = [node]
        max-marked = 15 # Crashing the browser with too many...
        marked = 0

        while (n = queue.shift!) and marked++ < max-marked
            each (<<< highlight: true), reject (is n) << (.target), n.edges
            each queue~push, moar n
        focus-edges!

    nodes-enter.on \mouseover, highlight-targets

    nodes-enter.on \mouseout, (node) ->
        for e in edges
            e.source.is-centre = e.target.is-centre = false
            e.highlight = false
        focus-edges!

    # ensure two control points between source and target
    edges-enter.each (d) ->
        {points} = d.dagre
        unless points.length
            s = d.source.dagre
            t = d.target.dagre
            # Add the midpoint.
            points.push x: (s.x + t.x) / 2, y: (s.y + t.y) / 2

        if points.length is 1
            points.push points[0]{x, y}

    add-labels edges-enter

    # Control points on the lines themselves
    edges-enter.select-all \circle.cp
        .data (d) ->
            each (<<< parent: d), d.dagre.points
            d.dagre.points.slice!reverse!
        .enter!
        .append \circle
            .attr \class, \cp
            .call drag-cp

    svg-edges.select-all \path
        .attr \id, (.id) << (.dagre)
        .attr \d, spline
        .attr \stroke, link-stroke

    update!

    get-drag-x = get-node-drag-pos \x
    get-drag-y = get-node-drag-pos \y

    drag-handler = (d, i) ->
        prev-x = d.dagre.x
        prev-y = d.dagre.y
        # Must be inside the svg box
        d.dagre.x = get-drag-x!
        d.dagre.y = get-drag-y!

        d3.select(@).attr \transform, "translate(#{ d.dagre.x },#{ d.dagre.y })"

        dx = d.dagre.x - prev-x
        dy = d.dagre.y - prev-y

        for e in d.edges
            mv-edge e, dx, dy
            update!
            d3.select(\# + e.dagre.id).attr \d, spline(e)

    node-drag = d3.behavior.drag!
        .origin ({pos, dagre}) -> (if pos then pos else dagre) |> ({x, y}) -> {x, y}
        .on \drag, drag-handler

    edge-drag = d3.behavior.drag!
        .on \drag, (d, i) ->
            mv-edge d, d3.event.dx, d3.event.dy
            d3.select(@).attr \d, spline d

    svg.call zoom

    nodes-enter.call node-drag
    edges-enter.call edge-drag

module.exports = {render-dag}

function overlaps {bounds:a}, {bounds:b}
    p = node-padding

    # Check for:
    #
    #    +- +-----+----+
    #    |  |     |    |
    #    |  |     |    |
    #    + -+-----+----+
    #
    [a, b] = sort-by (.l), [a, b]
    overlaps-h =
        | a.l - p < b.l and b.l - p < a.r => true
        | a.l - p < b.r and b.r + p < a.r => true
        | otherwise => false

    [a, b] = sort-by (.t), [a, b]
    overlaps-v =
        | a.t - p < b.t and b.t - p < a.b => true
        | a.t - p < b.b and b.b + p < a.b => true
        | otherwise => false

    contained =
        | overlaps-h or overlaps-v => false
        | a.l < b.l and b.l < a.r and a.t < b.t and b.t < a.b => true
        | otherwise => false

    contained or (overlaps-h and overlaps-v)

