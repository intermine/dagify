Backbone = require \backbone
Q = require \q
Backbone.$ = $
{Settings} = require './settings'
{DAG} = require './dag'

{apply, pairs-to-obj, split, id, any, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

base-query =
    from: 'Company'
    joins: ['bank']
    select: [
        \name
        \vatNumber
        \address.address
        \departments.name
        \departments.employees.address.address
        \departments.employees.name
        \departments.employees.age
        \departments.employees.fullTime
    ]

$(document).ready main

function main
    $(document).foundation!
    testmodel = new intermine.Service root: "http://localhost:8080/intermine-test"

    settings = new Settings
        ..$el.append-to document.get-element-by-id \controls

    window.dag = new DAG
        ..set-element document.get-element-by-id \org-chart
        ..on \add:class, settings~add-class
        ..on \add:path, settings.paths~add
        ..render!

    getting-companies = testmodel.records select: <[ Company.name ]>
        ..then wire-up testmodel, settings, dag

add-relation = (service, dag, select, name) -->
    query = {select, where: {name}}
    process-p = service.fetch-model!
                       .then (m) -> [m.make-path p for p in select]
                       .then map process-results _, dag~add-node, dag~add-edge
    results-p = service.records query
    Q.all [process-p, results-p]
     .fail console~error
     .then ([fs, results]) ->
        console.log results
        each (`apply` [results]), fs
        dag.update-graph!

load-org-chart = (service, dag, name) -->

    query = {where: {name}} <<< base-query
    Q.all [service.query(query), service.fetch-model!]
        .then ([pq, m]) ->
            fs = [process-results m.make-path view for view in pq.views]
            service.records pq
                    .fail console~error
                    .then (results) ->
                        nodes = []
                        edges = []
                        for f in fs
                            f nodes~push, edges~push, results
                        dag.set-graph {nodes, edges}

bank-views = [
    \Company.bank.name
    \Company.bank.debtors.debt
    \Company.bank.debtors.interestRate
    \Company.bank.debtors.owedBy.name
]

wire-up = (service, settings, dag, companies) -->
    settings
        ..collection = new Backbone.Collection companies
        ..render!
    settings.classes.on \change:hidden, ->
        hidden-classes = settings.classes.filter (.get \hidden) .map (.get \name)
        dag.state.set {hidden-classes}
    settings.paths.on \change:hidden, ->
        hidden-paths = settings.paths.filter (.get \hidden) .map (.get \path)
        dag.state.set {hidden-paths}
    add-rel = add-relation service, dag
    settings.on \filter, dag.state.set \filter, _
    settings.on \align:attrs, dag.state.set \alignAttrs, _
    settings.on \hide:attrs, dag.state.set \hideAttrs, _
    settings.on \chosen:company, load-org-chart service, dag
    settings.on \chosen:layout, dag~set-layout
    settings.on \show:contractors, add-rel ["Company.contractors.name"]
    settings.on \show:secretaries, add-rel ["Company.secretarys.name"]
    settings.on \show:banks, add-rel bank-views

    load-org-chart service, dag, (.name) first companies


process-results = (path, add-node, add-edge, result) -->
    steps = path.all-descriptors!
    add-ref = (parent, path-to-here, next-step, next-depth, obj) -->
        return unless obj?
        obj <<< id: obj.object-id, node-type: \ref, path: path-to-here
        add-node obj
        add-edge source: obj, target: parent if parent?
        if next-step?
            process-level next-depth, obj, obj[next-step.name]

    process-level = (depth, parent, obj) ->
        step = steps[depth]
        next-depth = depth + 1
        path-to-here = join \., map (.name), steps.slice 0, next-depth
        next-step = steps[next-depth]
        if step.is-collection
            coll =
                id: "#{ parent.id }-#{ step.name }"
                name: step.name
                path: path-to-here
                node-type: \coll
                'class': "Collection<#{ step.referenced-type }>"
            add-node coll
            add-edge source: coll, target: parent
            each (add-ref coll, path-to-here, next-step, next-depth), obj
        else if step.fields? or step.referenced-type?
            add-ref parent, path-to-here, next-step, next-depth, obj
        else
            node =
                path: path-to-here
                node-type: \attr
                id: "#{ parent.id }-#{ step.name }"
                value: obj
                'class': step.type

            add-node node
            add-edge {label: step.name, source: node, target: parent} if parent?

    for obj in result
        process-level 0, null, obj

graphify = (path, results) -->
    nodes = []
    edges = []
    process-results path, nodes~push, edges~push, results
    {nodes, edges}
