'use strict';

var Backbone = require('backbone');

var dagreD3 = require('dagre-d3');
var d3 = require('d3');

var nodes = [
  {name: 'Thing one', identifier: 'one'},
  {name: 'Thing two', identifier: 'two'},
  {name: 'Thing three', identifier: 'three'},
  {name: 'Thing four', identifier: 'four'}
];
var edges = [
  {child: 'one', parent: 'two', relationship: 'likes'},
  {child: 'two', parent: 'three', relationship: 'likes'},
  {child: 'three', parent: 'four', relationship: 'likes'}
];

var GraphState = Backbone.Model.extend({
  initialize: function () {
    this.set({rankdir: 'lr'});
  }
});

function main () {
  function onZoom () {
    inner.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
  }
  var svg = d3.select('svg'),
      inner = svg.select('g');

  var state = new GraphState();
  var graph = new dagreD3.graphlib.Graph();

  graph.setGraph(state.toJSON());

  nodes.forEach(function (node) {
    graph.setNode(node.identifier, {label: node.name});
  });
  edges.forEach(function (edge) {
    graph.setEdge(edge.child, edge.parent, {label: edge.relationship});
  });

  // Set up zoom support
  var zoom = d3.behavior.zoom().on('zoom', onZoom);
  svg.call(zoom);

  // Create the renderer
  var render = new dagreD3.render();

  // Run the renderer. This is what draws the final graph.
  render(inner, graph);

  // Center the graph
  var initialScale = 0.75;
  svg.attr('width', graph.graph().width * 3);
  zoom.translate([(svg.attr('width') - graph.graph().width * initialScale) / 2, 20])
    .scale(initialScale)
    .event(svg);
  svg.attr('height', graph.graph().height * initialScale + 40);

  state.on('change:rankdir', function () {
    graph.setGraph(state.toJSON());
    render(inner, graph);
  });

}

window.onload = main;
