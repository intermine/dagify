'use strict';

var Widget = require('../widget');
var graph = require('../fixtures/small');

function load () {
  var widget = new Widget(graph);
  widget.graphElement = document.querySelector('.graph-container');
  widget.summaryElement = document.querySelector('.graph-summary');

  widget.getNodeLabel = function (node) {
    return node.name;
  };
  widget.getNodeID = function (node) {
    return node.identifier;
  };
  widget.getEdgeSource = function (edge) {
    return edge.child;
  };
  widget.getEdgeTarget = function (edge) {
    return edge.parent;
  };
  widget.getEdgeLabel = function (edge) {
    return edge.relationship;
  };
  widget.render();
}

module.exports = load;
