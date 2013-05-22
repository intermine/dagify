{unique, filter, id, flip, join, maximum, minimum, map} = require \prelude-ls

brighten = (.brighter!) << (d3~rgb)
darken = (.darker!) << (d3~rgb)

term-palette = darken << d3.scale.category20!
term-color = term-palette << (join \-) << (.sources)

relationship-palette = d3.scale.category10!
link-fill = relationship-palette << (.label)
link-stroke = darken << link-fill

BRIGHTEN = brighten . brighten

colour-filter = (test, x) --> if test x then brighten else id

mv-towards = !(how-much, goal, n) ->
    scale = (* how-much)
    dx = scale goal.x - n.x
    dy = scale goal.y - n.y
    n.x += dx
    n.y += dy

is-root = (.is-root)

get-min-max-size = (f, coll) ->
    map f, coll |> -> {min: (minimum it), max: (maximum it)} |> -> it <<< size: it.max - it.min

draw-root-labels = (graph, dimensions, svg) -->
    let roots = filter is-root, graph.nodes
        if roots.length is 1
            parts = roots[0].label.split \_
            root-g = svg.append \g
                .attr \class, \root-label
            root-label = root-g.append \text
                .attr \x, 0
                .attr \y, 0
                .attr \font-size, 0.2 * dimensions.h
                .attr \opacity, 0.05
            for word, i in parts
                root-label.append \tspan
                    .text word
                    .attr \x, 0
                    .attr \dx, \0.3em
                    .attr \dy, if i then \1em else 0

            {width:text-width, height: text-height} = root-label.node!getBBox!
            tx = dimensions.w - 1.1 * text-width
            ty = 60 + text-height / 2
            root-g.attr \transform, "translate(#{ tx },#{ ty })"

centre-and-zoom = (xf, yf, state, nodes, zoom) ->
    padding = 50
    {h, w}:dimensions = state.get \dimensions
    [x, y] = [ get-min-max-size f, nodes for f in [xf, yf] ]

    display-ratio = w / h
    graph-ratio   = x.size / y.size

    # Are we operating vertically or horizontally
    [dim, val] =
        | display-ratio < graph-ratio => [w, x.size]
        | otherwise => [h, y.size]

    # Calculate scale and translation
    scale = dim * 0.9 / (val + padding * 2)
    translate = map (+ padding) << (0 -) << (.min), [x, y]
        ..0 += w / 2 - scale * x.size / 2
        ..1 += h / 2 - scale * y.size / 2 - padding * scale

    console.log "x.min = #{ x.min }, y.min = #{ y.min }"

    console.log \translate, translate
    console.log \scale, scale

    # Apply
    zoom.scale scale
    zoom.translate translate
    state.set {zoom: scale, translate}

draw-relationship-legend = (state, palette, svg) -->
    {all, dimensions} = state.toJSON!
    relationships = all.get-relationships!
    height = 50
    padding = 25
    width = if dimensions.h > dimensions.w then (dimensions.w - padding * 2) / relationships.length else 180

    [get-x, get-y] = [(flip -> padding + width * it), (-> padding)]
    #   | dimensions.h > dimensions.w => [(flip -> padding + width * it), (-> padding)]
    #   | otherwise => [ (-> padding), (flip -> padding + height * it)]

    legend = svg.select-all \g.legend
        .data relationships

    lg = legend.enter!
        .append \g
        .attr \class, \legend
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .on \mouseover, (d, i) ->
            state.trigger \relationship:highlight, d
            d3.select(@).select-all(\rect).attr \fill, brighten . palette
        .on \mouseout, ->
            state.trigger \relationship:highlight, null
            d3.select(@).select-all(\rect).attr \fill, palette
        .on \click, (rel) ->
            for e in state.get(\all).edges when e.label is rel
                for n in [e.source, e.target]
                    n.marked = true
            state.trigger \nodes:marked
    legend.exit!remove!

    lg.append \rect
        .attr \opacity, 0.6
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .attr \fill, palette

    lg.append \text
        .attr \x, get-x
        .attr \y, get-y
        .attr \dy, height / 2
        .attr \dx, \0.5em
        .text id

draw-source-legend = (state, palette, svg) -->
    dimensions = state.get \dimensions
    {nodes} = state.get \graph
    height = 50
    padding = 25
    sources = unique map (join \-) << (.sources), nodes
    width = if dimensions.h > dimensions.w then (dimensions.w - padding * 2) / sources.length else 180

    [get-x, get-y] = [(flip -> padding + width * it), (-> padding + height)]

    source-g = svg.select-all \g.source-legend
        .data sources

    sg = source-g.enter!
        .append \g
        .attr \class, \source-legend
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .on \mouseover, (d, i) ->
            state.trigger \source:highlight, d
            d3.select(@).select-all(\rect).attr \fill, brighten . palette
        .on \mouseout, ->
            state.trigger \source:highlight, null
            d3.select(@).select-all(\rect).attr \fill, palette

    source-g.exit!remove!

    sg.append \rect
        .attr \opacity, 0.6
        .attr \width, width
        .attr \height, height
        .attr \x, get-x
        .attr \y, get-y
        .attr \fill, palette

    sg.append \text
        .attr \x, get-x
        .attr \y, get-y
        .attr \dy, height / 2
        .attr \dx, \0.5em
        .text id

module.exports = {
    centre-and-zoom, draw-relationship-legend, draw-source-legend, draw-root-labels,
    colour-filter, mv-towards, brighten, BRIGHTEN, darken, link-fill, link-stroke,
    relationship-palette, term-palette, term-color, get-min-max-size
}

