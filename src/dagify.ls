/* See https://github.com/cpettitt/dagre/blob/master/demo/demo-d3.html */

require! [ './util.js', 'prelude-ls' ]

{is-type, map, concat-map, fold, sort-by, empty, filter, reject, find, flip, id, sort, mean, sum, sin, cos, values, any, each, join, all, zip, head, unique, minimum, maximum, min, max, ln, reverse, pairs-to-obj} = prelude-ls

{mark-subtree, any-test, notify, fail-when-empty, objectify, error, len, within} = util
{Graph} = require './graph'
{Node, new-node} = require './node'
{render-dag} = require './dag'
{render-force} = require './force'
GraphState = require './state'

$ = jQuery

non-curated-evidence-codes = <[ IBA IBD IEA IGC IKR ISA ISO ISS RCA ]>

# Get the ontology terms for a gene.
direct-terms = (constraints) ->
    select: <[ goAnnotation.ontologyTerm.identifier ]>
    from: \Gene
    where: constraints

get-homology-where-clause = (genes) ->
    primaryIdentifier: genes
    'goAnnotation.evidence.code.code': {'NONE OF': non-curated-evidence-codes}

direct-homology-terms = (genes) ->
    select: <[ goAnnotation.ontologyTerm.identifier ]>
    from: \Gene
    where: get-homology-where-clause genes

all-go-terms = (constraints) ->
    name: \ALL-TERMS
    select: <[ goAnnotation.ontologyTerm.identifier goAnnotation.ontologyTerm.parents.identifier ]>
    from: \Gene
    where: constraints

# Simple one level flattening.
flatten = concat-map id

flat-rows = (get-rows, q) --> get-rows(q).then unique . flatten

all-homology-terms = (children) ->
    name: \ALL-HOMOLOGY
    select: <[ parents.identifier ]>
    from: \OntologyTerm
    where: {identifier:children}

whole-graph-q = (terms) ->
    name: \EDGES
    select: <[ childTerm.identifier relationship parentTerm.identifier ]>
    from: \OntologyRelation
    where:
        'childTerm.identifier': terms
        direct: \true

count-query = (terms) ->
    select: <[ symbol ]>
    from: \Gene
    where:
        'goAnnotation.ontologyTerm.parents.identifier': terms

homologue-query = (symbol, targetOrganism) -->
  select: <[ homologues.homologue.primaryIdentifier ]>
  from: \Gene
  where:
    symbol: [symbol]
    "homologues.homologue.organism.taxonId": targetOrganism

# Get all the names for our ontology terms in one fell swoop, and build a mapping.
fetch-names = (source, get-rows, symbols, identifier) -->
    q =
        select: <[ identifier name description ]>
        from: \OntologyTerm
        where: {identifier}

    node = new-node source, symbols

    get-rows(q).then objectify (.0), (-> node ...it)

row-to-node = ([source, label, target]) -> {target, label, source}

get-gene-symbol = (get-rows, id) -> match id
  | (is-type \Number) => { select: <[Gene.symbol]>, where: {id} } |> flat-rows . get-rows
  | otherwise         => { select: <[Gene.symbol]>, where: id } |> flat-rows . get-rows

graphify = (monitor, get-rows, symbol) --> match symbol
  | (is-type \String) => _graphify monitor, get-rows, [symbol], {symbol: [symbol]}
  | (is-type \Number) => _graphify monitor, get-rows, (get-gene-symbol get-rows, symbol), {id: [symbol]}
  | otherwise         => _graphify monitor, get-rows, (get-gene-symbol get-rows, symbol), symbol

_graphify = (monitor, get-rows, symbols, query) ->
    console.log "Drawing graph for:", query
    fetch-flat = flat-rows get-rows

    getting-direct = query |> direct-terms |> fetch-flat |> fail-when-empty "No annotation found for #{ query }"
    getting-all = query |> all-go-terms |> fetch-flat
    getting-names = $.when symbols, getting-all
        .then fetch-names \flymine, get-rows
    getting-edges = getting-all.then(get-rows << whole-graph-q).then map row-to-node

    monitor [getting-direct, getting-all, getting-names, getting-edges]

    (.then make-graph) $.when getting-direct, getting-edges, getting-names

fetch-and-merge-homology = (monitor, homology-service, data-service, graph, query, source) ->
    rs = flat-rows data-service~rows
    merge-graph = merge-graphs graph

    getting-homologues = homologue-query query, source
        |> flat-rows homology-service~rows
        |> fail-when-empty "No homologues found"

    getting-direct = getting-homologues.then rs . direct-homology-terms
    getting-all = getting-direct.then rs . all-homology-terms
    getting-names = $.when getting-homologues, getting-all
        .then fetch-names data-service.name, data-service~rows
    getting-edges = getting-all
        .then data-service~rows . whole-graph-q
        .then map row-to-node

    monitor [getting-homologues, getting-direct, getting-all, getting-names, getting-edges]

    $.when getting-direct, getting-edges, getting-names
        .then make-graph >> merge-graph

mark-depth = (node, depth-at-node, max-depth) ->
    node.depths.push depth-at-node
    next-depth = depth-at-node + 1
    return if next-depth > max-depth
    for target in map (.target), node.edges when node isnt target
        mark-depth target, next-depth, max-depth

annotate-for-height = (nodes, level = 50) ->
    leaves = filter (.is-direct), nodes
    for leaf in leaves
        mark-depth leaf, 0, level
    each (-> it <<< steps-from-leaf: minimum it.depths), nodes

do-height-annotation = (nodes) ->
    def = $.Deferred -> set-timeout (~>
        annotate-for-height nodes
        @resolve!
    ), 0
    def.promise!

set-into = (m, k, v) -> m <<< pairs-to-obj [ [k, v] ]

cache-func = ([mapping, key-func = id]) -> (mapping.) << key-func

merge-graphs = (left, right) -->
    console.log "Starting with #{ len left.nodes} nodes and #{ len left.edges } edges"

    e-key = (e) -> e.source.id + e.label + e.target.id
    add-node-to-mapping = (m, n) -> if m[n.id] then m else set-into m, n.id, n
    add-edge-to-mapping = (m, e) ->
        key = e-key e
        if m[key] then m else set-into m, key, e

    [nodes-by-id, edges-by-key] = [ fold f, {}, concat-map attr, [left, right] for [f, attr]
        in [ [add-node-to-mapping, (.nodes)], [add-edge-to-mapping, (.edges)] ] ]
    [real-nodes, real-edges] = map cache-func, [[nodes-by-id, (.id)], [edges-by-key, e-key]]

    # Merge in properties of nodes that exist in both graphs,
    for [n, real] in zip right.nodes, map real-nodes, right.nodes
        if n is real
            real.root = real-nodes real.root
            real.edges = map real-edges, real.edges
        else
            real.sources .= concat n.sources
            real.symbols .= concat n.symbols
            real.is-direct or= n.is-direct
            real.edges = unique(real.edges ++ map real-edges, n.edges)

    # Ensure that new edges refer to nodes in the real graph.
    for [e, real] in zip right.edges, map real-edges, right.edges when e is real
        [source, target] = map real-nodes << (-> it e), [(.source), (.target)]
        e <<< {source, target}

    # nb: annotation for height was being done here..
    new Graph {nodes: (values nodes-by-id), edges: (values edges-by-key)}

edge-to-nodes = ({source, target}) -> [source, target]

annotate-for-counts = (make-query, nodes) ->
    making-q = make-query count-query map (.id), nodes
    summarising = making-q
        .then (.summarise \goAnnotation.ontologyTerm.parents.identifier)
        .then objectify (.item), (.count)

    summarising.done (summary) -> each (-> it.add-count summary[it.id]), nodes

# Take a set of promises, and report the proportion (as a number 0 .. 1)
# of them that are completed, when they each finish, and report
# that all are complete (ie. 1) if any of them fail.
monitor-progress = (report, stages) -->
    n-stages = stages.length
    complete = 0
    stage-complete = -> report ++complete / n-stages
    on-error = -> report 1

    report complete
    each (.done stage-complete), stages
    each (.fail on-error), stages

progress-monitor = (selector) ->
    $progress = $ selector
    monitor-progress (progress) ->
        $progress.find(\.meter).css \width, "#{ progress * 100}%"
        $progress.toggle progress < 1

edges-to-nodes = unique . concat-map edge-to-nodes

missing-node-msg = (e, prop) ->
    "Could not find node: #{ e[prop] }, the #{ prop } of #{ if prop is \source then e.target else e.source }"

make-graph = (direct-nodes, edges, node-for-ident) ->

    # Add edges to nodes. Edges belong to both the source and the target.
    for e in edges
        for prop in <[ source target ]>
            node = node-for-ident[e[prop]]
            throw new Error(missing-node-msg e, prop) unless node?
            node.edges.push e

    # Lift idents to nodes
    for e in edges
        e.source = node-for-ident[e.source]
        e.target = node-for-ident[e.target]

    nodes = values node-for-ident

    is-root = (n) -> all (is n), map (.target), n.edges
    is-leaf = (n) -> all (is n), map (.source), n.edges

    # Precompute all these useful properties.
    for n in nodes
        n.is-direct = n.id in direct-nodes
        n.is-leaf = is-leaf n
        n.is-root = is-root n
        n.marked = n.muted = false
        if n.is-root
            mark-subtree n, \root, n

    new Graph {nodes, edges}


module.exports = {
    progress-monitor, graphify, fetch-and-merge-homology, annotate-for-counts,
    do-height-annotation, edges-to-nodes, render-dag, render-force
}

