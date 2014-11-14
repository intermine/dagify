'use strict';

var Widget = require('../widget');
var graph = require('./fixtures/species');

function load (container, summary) {
  var widget = new Widget(graph);
  widget.graphState.set({rankdir: 'tb'});
  widget.graphElement = container;
  widget.summaryElement = summary;

  widget.getNodeLabel = function (node) {
    return node.name;
  };
  widget.getNodeID = function (node) {
    return node.name;
  };
  widget.getEdgeSource = function (edge) {
    return edge.subject.name;
  };
  widget.getEdgeTarget = function (edge) {
    return edge.ancestor.name;
  };
  widget.getEdgeLabel = function (edge) {
    return 'descends from';
  };
  widget.render();
}

module.exports = load;
