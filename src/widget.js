'use strict';

var dagreD3 = require('dagre-d3');
var Backbone = require('backbone');

var GraphState = require('./models/graph-state');
var renderGraph = require('./d3/render-graph');
var summaryTemplate = require('./templates/graph.summary');

var Nodes = Backbone.Collection.extend({
  model: Backbone.Model
});
var Edges = Backbone.Collection.extend({
  model: Backbone.Model
});

function Widget (data) {
  this.graphState = new GraphState();
  this.nodes = new Nodes(data.nodes);
  this.edges = new Edges(data.edges);

  this.graphState.on('change', function () {
    this._updateGraph();
  }.bind(this));
  this.nodes.on('add remove reset', function () {
    this._updateGraph();
    this._renderSummary();
  }.bind(this));
  this.edges.on('add remove reset', function () {
    this._updateGraph();
    this._renderSummary();
  }.bind(this));
}

module.exports = Widget;

// Assumes nodes are: {label, id}
function simpleGetLabel (obj) {
  return obj.label;
}
function defaultGetNodeID (node) {
  return node.id;
}
// Assumes edges are: {label, source, target}
function defaultGetEdgeSource (edge) {
  return edge.source;
}
function defaultGetEdgeTarget (edge) {
  return edge.target;
}
// Nodes by default have 2px rounded corners.
function createBaseNode (node) {
  return {rx: 2, ry: 2};
}
// Edges by default have no data.
function createBaseEdge () {
  return {};
}

Widget.prototype = {
  // All these methods can/should be replaced with more specific implementations
  // depending on the shape of the incoming data.
  getNodeID: defaultGetNodeID,
  getEdgeSource: defaultGetEdgeSource,
  getEdgeTarget: defaultGetEdgeTarget,
  getNodeLabel: simpleGetLabel,
  getEdgeLabel: simpleGetLabel,
  getBaseNode: createBaseNode,
  getBaseEdge: createBaseEdge,

  buildGraph: function () {
    var self = this
      , graph = new dagreD3.graphlib.Graph();

    graph.setGraph(this.graphState.toJSON());

    this.nodes.each(function (model) {
      var node = model.toJSON();
      var nodeID = self.getNodeID(node);
      var nodeData = self.getBaseNode(node);
      nodeData.label = self.getNodeLabel(node);
      graph.setNode(nodeID, nodeData);
    });
    this.edges.each(function (model) {
      var edge = model.toJSON();
      var sourceId = self.getEdgeSource(edge);
      var targetId = self.getEdgeTarget(edge);
      var edgeData = self.getBaseEdge();
      edgeData.label = self.getEdgeLabel(edge);
      graph.setEdge(sourceId, targetId, edgeData);
    });
    return graph;
  },

  render: function () {
    this._renderGraph();
    this._renderSummary();
  },

  // Private - these methods are not part of the public API
  _renderSummary: function () {
    if (this.summaryElement) {
      this.summaryElement.innerHTML = summaryTemplate({
        edgeCount: this.edges.size(),
        nodeCount: this.nodes.size()
      });
    }
  },

  _updateGraph: function () {
    if (this._update) {
      this._update(this.buildGraph());
    }
  },

  _renderGraph: function () {
    if (this.graphElement) {
      this._update = renderGraph(this.graphElement, this.buildGraph());
    }
  }

};
