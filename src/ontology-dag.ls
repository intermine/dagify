Backbone = require \backbone
Q = require \q
Backbone.$ = $
{DAG} = require './dag.ls'
{Controls} = require './ontology-controls.ls'
{Service} = intermine # TODO: browserify intermine!!

{group-by, apply, concat-map, fold, id, any, unique, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

FLYMINE = 'http://beta.flymine.org/beta/service'

$(document).ready main

dag-opts =
    rank-scale: [0.9, 0.5]
    node-key: (.identifier)
    edge-labels: <[relationship]>
    edge-props: <[childTerm parentTerm]>
    is-closable: (node) -> not node.get \direct
    get-node-class: (graph, nid, node) -> if node.get(\direct) then \direct else \inferred

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

    get-graph-for flymine, symbol: \cdc2, 'organism.taxonId': 7227
        .then dag~set-graph
        .fail (err) -> console.error err?.stack ? err

function get-graph-for service, constraint
    def = Q.defer!
    do
        terms <- service.rows term-query constraint
        direct = [direct for [direct, indirect] in terms]
        # direct-to-indirect = group-by (.0), terms
        identifiers = terms |> concat-map id |> unique
        edges <- service.records edge-query identifiers
        nodes <- service.records node-query identifiers
        for n in nodes
            n.direct = n.identifier in direct
            # if n.direct
            #    n.parents = map (.1), direct-to-indirect[n.identifier]
        def.resolve {nodes, edges}
    return def.promise

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

