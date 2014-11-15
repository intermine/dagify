'use strict';

var Widget = require('../widget');
var graph = require('./fixtures/species');

function load (container, summary) {
  var widget = new Widget(graph);
  widget.graphState.set({rankdir: 'tb'});
  widget.graphElement = container;
  widget.summaryElement = summary;

  widget.getNodeLabel = function (node) {
    if (node.status === 'common_ancestor') {
      return '';
    }
    return node.name;
  };
  widget.getNodeID = function (node) {
    return node.name;
  };
  widget.getBaseNode = function (node) {
    if (node.status === 'common_ancestor') {
      return {rx: 12, ry: 12, width: 4, height: 4};
    } else {
      var n = {rx: 2, ry: 2};
      if (node.status === 'extant') {
        n.rank = 'same';
      }
      return n;
    }
  };
  widget.getEdgeSource = function (edge) {
    return edge.subject.name;
  };
  widget.getEdgeTarget = function (edge) {
    return edge.ancestor.name;
  };
  widget.getEdgeLabel = function (edge) {
    if (edge.ancestor.status === 'common_ancestor') {
      return '';
    }
    return 'descends from';
  };
  widget.render();
}

module.exports = load;
