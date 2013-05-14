{all, any, map, filter} = require \prelude-ls
{any-test} = require './util'

is-root = (.is-root)

trim-graph-to-height = ({nodes, edges}, level) ->
    return {nodes, edges} unless level

    at-or-below-height = (.steps-from-leaf) >> (<= level)
    acceptable = any-test [is-root, at-or-below-height]

    filtered =
        nodes: filter acceptable, nodes
        edges: filter (-> all acceptable, [it.source, it.target]), edges

    for n in filtered.nodes when (not n.is-root) and any (not) . acceptable, map (.target), n.edges
        elision = {source: n, target: n.root, label: \elision}
        filtered.edges.push elision

    return filtered

class GraphState extends Backbone.Model

    to-string: -> """[GraphState #{ @cid }]"""

    initialize: ->
        console.log "Listening to myself"
        @on 'annotated:height change:elision change:root change:all', @~update-graph

    update-graph: ->
        console.log "Updating presented graph"
        level = @get \elision
        current-root = @get \root
        {nodes:all-nodes, edges:all-edges} = @get \all
        nodes =
            | current-root => filter (is current-root) << (.root), all-nodes
            | otherwise => all-nodes.slice!
        edges =
            | current-root => filter (is current-root) << (.root) << (.target), all-edges
            | otherwise => all-edges.slice!
        graph =
            | level and any (.steps-from-leaf), nodes => trim-graph-to-height {nodes, edges}, level
            | otherwise => {nodes, edges}
        @set {graph}

module.exports = GraphState
