'use strict';

var Widget = require('../widget');
var ControlsView = require('../views/controls');
var graph = require('./fixtures/species');

function load (container, summary, controls) {
  var widget = new Widget(graph);
  widget.graphElement = container;
  widget.summaryElement = summary;

  widget.graphState.set({
    rankdir: 'tb',
    rootName: 'evolutionary tree',
    currentRoot: null,
    roots: []
  });
  widget.on('change:graph', function (graph) {
    var currentRoot = graph.graph().currentRoot;
    if (!currentRoot) { // Only want to know about whole graph.
      var sinks = graph.sinks();
      var roots = widget.graphState.get('roots');
      if (sinks.sort().join('') !== roots.sort().join('')) {
        widget.graphState.set({roots: sinks});
      }
    }
  });
  widget.graphState.on('change:currentRoot', function (m, v) {
    console.log('root', v);
  });

  var graphControls = new ControlsView({
    model: widget.graphState,
    el: controls
  });
  graphControls.render();

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
      return {rx: 2, ry: 2, padding: 2};
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
