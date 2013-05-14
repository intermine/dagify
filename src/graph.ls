{unique, filter, sort, map, join, find, each} = require \prelude-ls

class Graph
    ({@nodes, @edges}) ->

    only-marked   = filter (.marked) . (.source)
    heights       = sort . unique . map (.steps-from-leaf)
    relationships = unique . (++ [\elision]) . map (.label)
    sources       = sort . unique . (map join \-) . (.sources)
    roots         = filter (.is-root)
    de-mark = (n) -> n.marked = n.is-reachable = n.is-focus = n.is-source = n.is-target = false

    get-marked-statements: -> only-marked @edges

    unmark: -> each de-mark, @nodes

    get-heights: -> heights @nodes

    get-relationships: -> relationships @edges

    get-sources: -> sources @nodes

    get-roots: -> roots @nodes

    get-node: (node-id) -> find (is node-id) . (.id), @nodes

module.exports = {Graph}

