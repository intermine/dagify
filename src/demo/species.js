'use strict';

var Widget = require('../widget');
var graph = require('../fixtures/species');

function load () {
  var widget = new Widget(graph);
  widget.graphElement = document.querySelector('.graph-container');
  widget.summaryElement = document.querySelector('.graph-summary');

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
