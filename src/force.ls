{link-stroke, term-color, draw-root-labels, term-palette, relationship-palette, colour-filter, link-fill, mv-towards, draw-source-legend, draw-relationship-legend, draw-root-labels, centre-and-zoom} = require './svg'
{mark-subtree, relationship-test} = require './util'
{minimum, maximum, even, mean, reject, unique, join, abs, cos, sin, Obj, sum, any, sort-by, map, fold, filter, each, ln} = require \prelude-ls

is-root = (.is-root)
to-radians = (* Math.PI / 180)
get-r = (.radius!)
count-by = (f, xs) --> fold ((sum, x) -> sum + if f x then 1 else 0), 0, xs

link-opacity =
    normal: 0.6
    muted: 0.3
    focus: 0.8
    unfocus: 0.2

min-ticks = 20

stratify = (state) ->
    {dimensions, graph, zoom} = state.toJSON!
    current-font-size = Math.min 40, 20 / zoom
    roots = sort-by (.x), filter is-root, graph.nodes
    leaves = sort-by (.x), filter (-> it.is-direct and it.is-leaf), graph.nodes
    surface = minimum [0] ++ map (.y), graph.nodes
    width-range = d3.scale.linear!
        .range [0.1 * dimensions.w, 0.9 * dimensions.w]
        .domain [0, leaves.length - 1]

    corners = d3.scale.quantile!
        .domain [0, dimensions.w]
        .range [0, dimensions.w]
    quantile =
        | not roots.length => -> dimensions.w / 2
        | otherwise =>
            d3.scale.quantile!
                .domain [0, dimensions.w]
                .range [0 til roots.length]

    roots.for-each (root, i) ->
        root.fixed = false
        mv-towards 0.01, {y: (surface - get-r root), x: root.x}, root #width-range i}, root

    for n in graph.nodes when (not n.is-root) and (n.y + get-r n) < surface
        mv-towards 0.001, {x: n.root.x, y: dimensions.h}, n

    leaves.for-each (n, i) ->
        speed = if n.y < (dimensions.h / 2) then 0.05 else 0.005
        if n.y < dimensions.h * 0.9
            mv-towards speed, {x: (width-range i), y: dimensions.h * 0.9}, n
        if n.y >= dimensions.h * 0.85
            n.y = dimensions.h * 0.9 + (current-font-size * 1.1 * i)

centrify = (state) ->
    {graph, graph:{w, h}} = state.toJSON!
    roots = sort-by (.y), filter is-root, graph.nodes
    mean-d = mean map (* 2) << get-r, roots
    half = (/ 2)

    # Put root nodes under a centripetal force.
    if roots.length is 1
        roots[0] <<< {x: (half w), y: (half h), fixed: true}
    else
        roots.for-each !(n, i) ->
            goal =
                x: half w
                y: (half h) - (mean-d * roots.length / 2) + (mean-d * i)
            mv-towards 0.05, goal, n

    # Put leaf nodes under a centrifugal force. Must be very faint to avoid reaching terminal
    # velocity.
    centre =
        x: half w
        y: half h
    max-h = maximum map (.steps-from-leaf), graph.nodes
    for leaf in graph.nodes when not is-root leaf
        base-speed = -0.0003
        speed =
            | leaf.is-leaf => base-speed
            | max-h => base-speed * (1 - leaf.steps-from-leaf * 1 / max-h)
            | otherwise => 0
        mv-towards speed, centre, leaf

unfix = !(state) -> state.get \graph |> (.nodes) |> filter is-root |> each (<<< fixed: false)

link-spline = (offset-scale, args) -->
    [source, target, line-length, end-point, radius-s, cos90, sin90] = args
    mean-x = mean map (.x), [source, target]
    mean-y = mean map (.y), [source, target]

    offset = (offset-scale * line-length) - (radius-s / 4)

    mp1-x = mean-x + offset * cos90
    mp1-y = mean-y + offset * sin90
    mp2-x = mean-x + offset * cos90
    mp2-y = mean-y + offset * sin90

    [
        [(source.x - radius-s * 0.9 * cos90), (source.y - radius-s * 0.9 * sin90)],
        [mp2-x, mp2-y],
        end-point,
        end-point,
        [mp1-x, mp1-y],
        [(source.x + radius-s * 0.9 * cos90), (source.y + radius-s * 0.9 * sin90)]
    ]

# http://bl.ocks.org/sboak/2942559
# http://bl.ocks.org/sboak/2942556
draw-curve = let line = d3.svg.line!interpolate \basis
    ({target, source}) ->
        {cos, sin, sqrt, atan2, pow, PI} = Math
        slope = atan2 (target.y - source.y), (target.x - source.x)
        [sin-s, cos-s] = map (-> it slope), [sin, cos]
        slope-plus90 = PI / 2 + slope
        [sin90, cos90] = map (-> it slope-plus90), [sin, cos]

        [radius-t, radius-s] = map get-r, [target, source]

        line-length = sqrt pow(target.x - source.x, 2) + pow(target.y - source.y, 2)
        end-point = [(target.x - radius-t * 0.9 * cos-s), (target.y - radius-t * 0.9 * sin-s)]

        args = [source, target, line-length, end-point, radius-s, cos90, sin90]

        args |> link-spline 0.1 |> line |> (+ \Z)

draw-pause-btn = (dimensions, state, svg) -->
    [cx, cy] = map (* 0.9), [dimensions.w, dimensions.h]
    radius = 0.075 * dimensions.h
    [x, y] = map (- radius), [cx, cy]

    svg.select-all \g.btn .remove!

    btn = svg.append \g
        .attr \class, \btn
        .attr \x, x
        .attr \y, y

    btn.append \circle
        .attr \r, radius
        .attr \cx, cx
        .attr \cy, cy
        .attr \stroke, \black
        .attr \stroke-width, 5px
        .attr \fill \#ccc
        .attr \opacity, 0.2

    draw-pause-bars = ->

        btn.select-all(\path.play-symbol).remove!

        pause-bar =
            width: 0.025 * dimensions.h
            height: 0.08 * dimensions.h

        for f in [-1.2, 0.2]
            btn.append \rect
                .attr \class, \pause-bar
                .attr \width, pause-bar.width
                .attr \x, cx + f * pause-bar.width
                .attr \height, pause-bar.height
                .attr \y, cy - pause-bar.height /2
                .attr \fill, \#555
                .attr \opacity, 0.2

    symbol-line = d3.svg.line!
        .x ([r, a]) -> cx + r * cos a
        .y ([r, a]) -> cy + r * sin a
        .interpolate \linear

    draw-play-symbol = ->

        btn.select-all(\.pause-bar).remove!

        inner-r = 0.75 * radius

        points = [ [inner-r, to-radians angle] for angle in [0, 120, 240] ]

        btn.append \path
            .attr \class, \play-symbol
            .attr \fill, \#555
            .attr \opacity, 0.2
            .attr \d, (+ \Z) symbol-line points

    draw-play-symbol!

    state.on \change:animating, (s, currently) -> switch currently
        | \paused => draw-play-symbol!
        | \running => draw-pause-bars!

    btn.on \click, -> switch state.get \animating
        | \paused => state.set animating: \running
        | \running => state.set animating: \paused

link-distance = ({source, target}) ->
    ns = [source, target]
    edges = sum map (-> it.edges?.length or 0), ns
    marked-bump = 50 * count-by (.marked), ns
    muted-penalty = if (any (.muted), ns) then 100 else 0
    radii = sum map get-r, ns
    (3 * edges) + radii + 50 + marked-bump - muted-penalty

get-charge = (d) ->
    radius = get-r d
    root-bump = if is-root d then 150 else 0
    edge-bump = 10 * d.edges.length
    marked-bump = if d.marked then 2 else 1
    k = 250
    1 - (k + radius + root-bump + edge-bump) * marked-bump

render-force = (state, graph) ->

    if graph.edges.length > 250 and not state.has(\elision)
        return state.set elision: 2

    dimensions = state.get \dimensions

    force = d3.layout.force!
        .size [dimensions.w, dimensions.h]
        .charge get-charge
        .gravity 0.04
        .link-strength 0.8
        .link-distance link-distance

    state.on \change:spline, -> state.set animating: \running
    state.on \change:jiggle, -> state.set animating: \running
    state.on \graph:reset, update-marked

    state.on \change:animating, !->
        currently = state.get \animating
        switch currently
            | \running => force.resume!
            | \paused => force.stop!

    svg = d3.select state.get \svg

    svg.select-all(\g).remove!

    throbber = svg.append \use
        .attr \x, dimensions.w / 2 - 150
        .attr \y, dimensions.h / 2 - 150
        .attr \xlink:href, \#throbber

    state.on \change:translate, (s, current-translation) ->
        svg-group.attr \transform, "translate(#{ current-translation }) scale(#{ s.get \zoom })"
        force.tick!

    state.on \change:zoom, (s, current-zoom) ->
        svg-group.attr \transform, "translate(#{ s.get(\translate) }) scale(#{ current-zoom })"
        force.tick!

    get-label-font-size = -> Math.min 40, 20 / state.get \zoom

    zoom = d3.behavior.zoom!
        .scale state.get \zoom
        .on \zoom, -> state.set {zoom: d3.event.scale, translate: d3.event.translate.slice!}

    svg.call zoom

    relationships = state.get \relationships

    svg
        .attr \width, dimensions.w
        .attr \height, dimensions.h
        .call draw-pause-btn dimensions, state
        .call draw-root-labels graph, dimensions

    svg-group = svg.append(\g)
        .attr \class, \ontology
        .attr \transform, 'translate(5, 5)'

    force.nodes graph.nodes
        .links graph.edges
        .on \tick, tick
        .on \end, ->
            state.set \animating, \paused
            tick! # Run the last tick.

    link = svg-group.select-all \.force-link
        .data graph.edges
    link.enter!
        .append (if state.has(\spline) then \path else \line)
        .attr \class, \force-link
        .attr \stroke-width, \1px
        .attr \stroke, link-stroke
        .attr \fill, link-fill
        .append \title, (e) -> "#{ e.source.label } #{ e.label } #{ e.target.label }"
    link.exit!remove!

    get-label-id = (\label- +) << (.replace /:/g, \-) << (.id)
    node = svg-group.select-all \.force-node
        .data graph.nodes
    n-g = node.enter!
        .append \g
        .attr \class, \force-node
        .call force.drag
        .on \click, draw-path-to-root
    node.exit!remove!

    n-g.append \circle
        .attr \class, ({sources}) -> join ' ', [\force-term] ++ sources
        .classed \root, is-root
        .classed \direct, (.is-direct)
        .attr \fill, term-color
        .attr \cx, -dimensions.w
        .attr \cy, -dimensions.h
        .attr \r, get-r

    n-g.append \text
        .attr \class, \count-label
        .attr \fill, \white
        .attr \text-anchor, \middle
        .attr \display, \none
        .attr \x, -dimensions.w
        .attr \y, -dimensions.h
        .attr \dy, \0.3em

    texts = svg-group.select-all \text.force-label
        .data graph.nodes

    texts.enter!
        .append \text
        .attr \class, \force-label
        .attr \text-anchor, \start
        .attr \fill, \#555
        .attr \stroke, \white
        .attr \stroke-width, \0.1px
        .attr \text-rendering, \optimizeLegibility
        .attr \display, -> if it.is-direct then \block else \none
        .attr \id, get-label-id
        .attr \x, -dimensions.w
        .attr \y, -dimensions.h
        .text (.label)
        .on \click, draw-path-to-root

    n-g.append \title
        .text (.label)

    svg.call draw-relationship-legend state, relationship-palette
       .call draw-source-legend state, term-palette

    tick-count = 0

    state.set \animating, \running
    force.start!

    state.on \relationship:highlight, (rel) ->
        test = relationship-test rel, false
        col-filt = colour-filter test

        link.transition!
            .duration 50ms
            .attr \fill, (d) -> link-fill d |> col-filt d
            .attr \opacity, -> if (not rel) or (test it) then link-opacity.normal else link-opacity.unfocus
        link.classed \highlit, test

    state.on \term:highlight, (term) ->
        force.stop!
        n-g.select-all \circle.force-term
            .filter (.marked)
            .transition!
            .duration 50ms
            .attr \opacity, -> if (not term) or (it is term) then 1 else 0.5
        link.filter (.marked) << (.source)
            .transition!
            .duration 50ms
            .attr \opacity, -> if (not term) or (it.source is term) then link-opacity.focus else link-opacity.unfocus

    state.once \force:ready, -> centre-and-zoom (.x), (.y), state, graph.nodes, zoom

    _is-ready = false

    function is-ready
        return true if _is-ready
        {animating, tick-k, graph: {edges}} = state.toJSON!
        _is-ready := animating is \paused or tick-count > tick-k * ln edges.length
        if _is-ready
            state.trigger \force:ready
        return _is-ready

    function draw-path-to-root d, i
        state.set \animating, \running
        if is-root d
            toggle-subtree d
        else
            queue = [d]
            moar = -> it.edges |> map (.target) |> reject (.marked) |> unique
            count = 0
            max = state.get \maxmarked # don't overwhelm things
            while (count++ < max) and n = queue.shift!
                n.marked = true
                each queue~push, moar n
        update-marked!

    function toggle-subtree root
        mark-subtree root, \muted, not root.muted

    function update-marked
        state.trigger \nodes:marked
        current-animation = state.get \animating
        state.set \animating, \running
        force.start! # needed to recalculate charges
        set-timeout (-> state.set \animating, current-animation), 150 # don't think this is really working...

    function tick

        tick-count++

        jiggle = switch state.get \jiggle
            | \strata => stratify
            | \centre => centrify
            | otherwise => unfix

        jiggle state if jiggle

        return unless is-ready!
        throbber?.remove!

        current-font-size = get-label-font-size!
        font-plus-pad = current-font-size * 1.1

        mean-x = mean map (.x), graph.nodes

        # find overlapping labels
        get-half = d3.scale.quantile!
            .domain [0, dimensions.w]
            .range [\left, \right]

        texts = svg-group.select-all \text.force-label
        displayed-texts = texts.filter -> \block is d3.select(@).attr \display
        displayed-texts.each (d1, i) ->
            ys = []
            this-half = get-half d1.x
            displayed-texts.each (d2) ->
                ys.push d2.y if d2 isnt d2 and (get-half d2.x is this-half) and abs(d1.y - d2.y) < font-plus-pad
            if ys.length
                op = if d1.y > mean ys then (+) else (-)
                d1.y = op d1.y, font-plus-pad # Jiggle them out of the way of each other.

        texts.attr \x, (.x)
            .attr \text-anchor, -> if it.x < mean-x then \end else \start
            .attr \y, (.y)
            .attr \dx, -> if it.x < mean-x then 1 - get-r it else get-r it

        if state.has(\spline)
            link.attr \d, draw-curve
        else
            link.attr \x1, (.source.x)
                .attr \y1, (.source.y)
                .attr \x2, (.target.x)
                .attr \y2, (.target.y)

        svg-group.select-all \text
            .attr \display ({marked, id, edges, is-direct}) ->
                | graph.nodes.length < state.get(\smallGraphThreshold) => \block
                | state.get(\zoom) > 1.2 => \block
                | (marked or is-direct) => \block
                | otherwise => \none

        node.select-all \text.count-label
            .text sum << (.counts)
            .attr \x, (.x)
            .attr \y, (.y)
            .attr \font-size, (/ 1.5) << get-r
            .attr \display ({marked, is-root, is-direct}) ->
                | marked or is-direct or is-root => \block
                | otherwise => \none

        svg-group.select-all \text.force-label
            .attr \font-size, current-font-size

        link.attr \stroke-width, ({target}) ->
            | target.marked => \2px
            | otherwise => \1px

        circles = node.select-all \circle
            .attr \r, get-r
            .attr \cx, (.x)
            .attr \cy, (.y)

        if any (.marked), graph.nodes
            circles.attr \opacity, -> if it.marked or it.is-root then 1 else 0.2
            link.attr \opacity, ({source, target}) ->
                | source.marked and (target.marked or target.is-root) => link-opacity.focus
                | otherwise => link-opacity.unfocus
            svg-group.select-all \text
                .attr \opacity, -> if it.marked then 1 else 0.2
        else
            link.attr \opacity, ({source: {muted}}) -> if muted then link-opacity.muted else link-opacity.normal
            circles.attr \opacity, ({muted, is-direct}) ->
                | muted => 0.3
                | is-direct => 1
                | otherwise => 0.9
            svg-group.select-all \text
                .attr \opacity, -> if it.muted then 0.3 else 1

module.exports = {render-force}
