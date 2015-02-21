'use strict';

var Widget = require('../widget');
var graph = require('./fixtures/small');
var methods = {
  getNodeLabel: function (node) {
    return node.name;
  },
  getNodeID: function (node) {
    return node.identifier;
  },
  getEdgeSource: function (edge) {
    return edge.child;
  },
  getEdgeTarget: function (edge) {
    return edge.parent;
  },
  getEdgeLabel: function (edge) {
    return edge.relationship;
  }
}

function load (container, summary) {
  var widget = new Widget(graph, methods);
  widget.graphElement = container;
  widget.summaryElement = summary;

  widget.render();
}

module.exports = load;
