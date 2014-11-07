Q = require \q
{Service} = require \imjs
_ = require \underscore
{concat-map, id, unique} = require 'prelude-ls'

OntologyWidget = require './ontology-widget.ls'

# Mock results.
results-a = require '../data/result_0.json'
results-b = require '../data/result_1-edges.json'
results-c = require '../data/result_2-nodes.json'

FLYMINE = 'http://www.flymine.org/query/service'

Promise = do ->
    unit = (a) -> Q a
    lift = (f, ma) --> ma.then f
    bind = (ma, f) --> Q(ma).then f
    {unit, bind, lift}

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

$(document).ready main

cssify = (.replace /[^a-z-]/g, '-') . (.to-lower-case!) . String

function main
    flymine = new Service root: FLYMINE

    widget = new OntologyWidget dag-opts
        ..set-element document.get-element-by-id \ontology-widget
        ..on \all, console~log
        ..render!

    get-graph-for flymine, symbol: \cdc2, 'organism.taxonId': 7227
        .then widget~set-graph
        .fail (err) -> console.error err?.stack ? err

function get-mock-graph-for service, constraint then Q.try ->
    terms = results-a.results
    direct = _.index-by [direct for [direct, indirect] in terms]
    edges = results-b.results
    nodes = results-c.results
    for n in nodes
        n.direct = direct[n.identifier]? # in direct
    return {nodes, edges}

function get-graph-for service, constraint
    let {unit, bind} = Promise
        terms <- bind service.rows term-query constraint
        direct = _.index-by [direct for [direct, indirect] in terms]
        identifiers = terms |> concat-map id |> unique
        [edges, nodes] <- bind Q.all [service.records q identifiers for q in [edge-query, node-query]]
        for n in nodes
            n.direct = direct[n.identifier]? # in direct
        unit {nodes, edges}

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

