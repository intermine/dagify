'use strict';

var Widget = require('../widget');
var ControlsView = require('../views/controls');
var graph = require('./fixtures/species');
var opts = {
  rankdir: 'tb',
  rootName: 'evolutionary tree',
  currentRoot: null,
  roots: []
};

var SpeciesWidget = {
  getNodeLabel: function (node) {
    if (node.status === 'common_ancestor') {
      return '';
    }
    return node.name;
  },
  getNodeID: function (node) {
    return node.name;
  },
  getBaseNode: function (node) {
    if (node.status === 'common_ancestor') {
      return {rx: 2, ry: 2, padding: 2};
    } else {
      var n = {rx: 2, ry: 2};
      if (node.status === 'extant') {
        n.rank = 'same';
      }
      return n;
    }
  },
  getBaseEdge: function (edge) {
    if (edge.ancestor.status === 'common_ancestor') {
      return {arrowhead: 'none'};
    }
    return {arrowhead: 'vee'};
  },
  getEdgeSource: function (edge) {
    return edge.subject.name;
  },
  getEdgeTarget: function (edge) {
    return edge.ancestor.name;
  },
  getEdgeLabel: function (edge) {
    if (edge.ancestor.status === 'common_ancestor') {
      return '';
    }
    return 'descends from';
  }
};

module.exports = function load (container, summary, controls) {
  var data = {opts: opts,nodes: graph.nodes,edges: graph.edges};
  var widget = new Widget(data, SpeciesWidget);
  widget.graphElement = container;
  widget.summaryElement = summary;

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

  widget.render();
};
