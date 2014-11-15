'use strict';

var Backbone = require('backbone');
var _ = require('underscore');

// Provides the default for the abstract methods needed to build a graph.
var AbstractAPI = require('./widget/abstract-api');
// Provides _renderGraph, _renderSummary, _updateGraph,
// _getNode, _canReachCurrentRoot
var PrivateAPI = require('./widget/private-api');
// The Graph state model.
var GraphState = require('./models/graph-state');

var Nodes = Backbone.Collection.extend({
  model: Backbone.Model
});
var Edges = Backbone.Collection.extend({
  model: Backbone.Model
});

// Initialises the three state properties:
//   * graphState :: Model
//   * nodes :: Collection
//   * edges :: Collection
var Widget = module.exports = function Widget (data) {
  this.graphState = new GraphState();
  this.nodes = new Nodes(data.nodes);
  this.edges = new Edges(data.edges);

  this.listenTo(this.graphState, 'change', this.update);
  this.listenTo(this.nodes, 'add remove reset', this.update);
  this.listenTo(this.edges, 'add remove reset', this.update);
};

Widget.prototype = _.extend(
  {
    eachNode: function (forEach) {
      var filter = this._canReachCurrentRoot();
      this.nodes
          .filter(filter)
          .forEach(forEach);
    },
    eachEdge: function (forEach) {
      var canReach = this._canReachCurrentRoot();
      var filter = function (edge) {
        var data = edge.toJSON();
        var source = this._getNode(this.getEdgeSource(data));
        var target = this._getNode(this.getEdgeTarget(data));
        return _.any([source, target], canReach);
      }.bind(this);
      this.edges
          .filter(filter)
          .forEach(forEach);
    },
    update: function () {
      this._updateGraph();
      this._renderSummary();
    }, 
    render: function () {
      this._renderGraph();
      this._renderSummary();
    }
  }
  , AbstractAPI
  , PrivateAPI
  , Backbone.Events // Mixins..
);
