Backbone = require \backbone
Q = require \q
Backbone.$ = $
{DAG} = require './dag.ls'
{Controls} = require './ontology-controls.ls'
{Service} = intermine # TODO: browserify intermine!!

{group-by, apply, concat-map, fold, id, any, unique, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

# Mock results.
results-a = require '../data/result_0.json'
results-b = require '../data/result_1-edges.json'
results-c = require '../data/result_2-nodes.json'

FLYMINE = 'http://beta.flymine.org/beta/service'

Promise = do ->
    unit = (a) -> Q a
    bind = (ma, f) --> Q(ma).then f
    lift = (f, ma) --> bind ma, f
    {unit, bind, lift}

$(document).ready main

cssify = (.replace /[^a-z-]/g, '-') . (.to-lower-case!) . String

dag-opts =
    rank-scale: [0.95, 0.8]
    node-key: (.identifier)
    edge-labels: <[relationship]>
    edge-props: <[childTerm parentTerm]>
    on-node-click: (nid) -> @zoom-to nid
    get-edge-class: (edge) -> cssify edge.get \relationship
    get-node-class: (node) -> if node.get(\direct) then \direct else \inferred
    on-edge-click: (g, eid) ->
        @zoom-to g.source(eid)
        set-timeout (~> @zoom-to g.target eid), 770ms

function main
    $(document).foundation!
    flymine = new Service root: FLYMINE

    window.dag = dag = new DAG dag-opts
        ..set-element document.get-element-by-id \chart
        ..render!

    controls = new Controls
        ..$el.append-to document.get-element-by-id \controls
        ..wire-to-dag dag
        ..render!

    p = get-graph-for flymine, symbol: \cdc2, 'organism.taxonId': 7227
        .then dag~set-graph
        .fail (err) -> console.error err?.stack ? err
    console.debug p

function get-mock-graph-for service, constraint then Q.try ->
    terms = results-a.results
    direct = _.index-by [direct for [direct, indirect] in terms]
    edges = results-b.results
    nodes = results-c.results
    for n in nodes
        n.direct = direct[n.identifier]? # in direct
    return {nodes, edges}

function get-graph-for service, constraint
    let {bind} = Promise
        terms <- bind service.rows term-query constraint
        direct = _.index-by [direct for [direct, indirect] in terms]
        identifiers = terms |> concat-map id |> unique
        [edges, nodes] <- bind Q.all [service.records q identifiers for q in [edge-query, node-query]]
        for n in nodes
            n.direct = direct[n.identifier]? # in direct
        {nodes, edges}

#
#   def = Q.defer!
#   do
#       terms <- service.rows term-query constraint
#       direct = [direct for [direct, indirect] in terms]
#       identifiers = terms |> concat-map id |> unique
#       edges <- service.records edge-query identifiers
#       nodes <- service.records node-query identifiers
#       for n in nodes
#           n.direct = n.identifier in direct
#       def.resolve {nodes, edges}
#   return def.promise
#

# threading = (promise, ...steps) -> fold ((p, f) -> p.then f), promise, steps

function term-query constraints then do
    name: \edge-query
    from: \Gene
    select: <[ goAnnotation.ontologyTerm.identifier goAnnotation.ontologyTerm.parents.identifier ]>
    where: constraints

function node-query terms then do
    name: \GoTerms
    from: \OntologyTerm
    select: <[ identifier name ]>
    where:
        identifier: terms

function edge-query terms then do
    name: \graph-query
    from: \OntologyRelation
    select: <[ childTerm.identifier relationship parentTerm.identifier ]>
    where:
        'childTerm.identifier': terms
        direct: \true

