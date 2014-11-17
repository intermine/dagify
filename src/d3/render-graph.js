'use strict';

var d3 = require('d3');
var dagreD3 = require('dagre-d3');
var template = require('../templates/graph.container');

function getZoomTranslation (e) {
  return 'translate(' + e.translate + ')scale(' + e.scale + ')';
}

function getZoomHandler (selection) {
  return function () {
    selection.attr('transform', getZoomTranslation(d3.event));
  };
}

module.exports = function (element, graph) {
  element.innerHTML = template();

  // Create all the selectors.
  var container = d3.select(element)
    , svg = container.select('svg')
    , inner = svg.select('g');

  // Set up zoom support
  var zoom = d3.behavior.zoom().on('zoom', getZoomHandler(inner));
  svg.call(zoom);

  // Create the renderer
  var render = new dagreD3.render();

  render.arrows().none = function () {}; // Edges without arrows.

  // Run the renderer. This is what draws the final graph.
  render(inner, graph);

  // Center the graph
  var initialScale = 0.75;
  var meta = graph.graph();
  var center = function () {
    var meta = graph.graph();
    var x = (svg.attr('width') - meta.width * initialScale) / 2;
    return zoom.translate([x, 20])
               .scale(initialScale);
  };
  svg.attr('width', element.getBoundingClientRect().width);
  svg.attr('height', meta.height * initialScale + 40);
  center().event(svg);

  // Return a function to update this rendered representation.
  return function update (graph) {
    render(inner, graph);
    center().event(svg.transition().duration(500));
  };
};
