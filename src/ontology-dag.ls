Backbone = require \backbone
Q = require \q
Backbone.$ = $
{DAG} = require './dag.ls'
{Service} = intermine # TODO: browserify intermine!!

{apply, pairs-to-obj, split, id, any, each, find, sort-by, last, join, map, is-type, all, first} = require 'prelude-ls'

FLYMINE = 'http://www.flymine.org/query/service'

$(document).ready main

function main
    $(document).foundation!
    flymine = new Service root: FLYMINE

    window.dag = dag = new DAG
        ..set-element document.get-element-by-id \chart
        ..render!

    get-graph-for flymine, symbol: \bsk .then dag~set-graph

function get-graph-for service, contraint
    nodes = []
    edges = []

