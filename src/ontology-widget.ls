Backbone = require \backbone
Backbone.$ = $

{DAG} = require './dag.ls'
{Controls} = require './ontology-controls.ls'

module.exports = class OntologyWidget extends Backbone.View

    (options) ->
        @dag = new DAG options
        @set-graph = @dag~set-graph

    HTML = """
        <div class="large-9 columns ont-w-chart"></div>
        <div class="large-3 columns ont-w-controls"></div>
    """

    class-name: 'ont-widget row'

    render: ->
        @$el.html HTML
        @$el.css height: '100%', width: '100%'
        @$('.ont-w-chart').css height: '100%'

        dag = @dag
            ..set-element @$ '.ont-w-chart'
            ..render!

        controls = new Controls
            ..$el.append-to @$ '.ont-w-controls'
            ..wire-to-dag dag
            ..render!

        @$el.foundation!

        return this

