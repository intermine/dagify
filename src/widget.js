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

// These collection don't have any custom behaviour, but
// you would add it here if the need some.
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
// Injects methods onto the object - Feel free to subclass.
var Widget = module.exports = function Widget (data, methods) {
  if (!(this instanceof Widget)) return new Widget(data, methods);

  if (methods) _.extend(this, _.pick(methods, _.keys(AbstractAPI)));
  this.graphState = new GraphState(data && data.opts);
  this.nodes = new Nodes(data && data.nodes);
  this.edges = new Edges(data && data.edges);

  if (data && data.el) {
    this.setElement(data.el);
  }
  if (data && data.summaryEl) {
    this.setSummaryElement(data.summaryEl);
  }

  this.listenTo(this.graphState, 'change', this.update);
  this.listenTo(this.nodes, 'add remove reset', this.update);
  this.listenTo(this.edges, 'add remove reset', this.update);
};

// The methods of Widget
Widget.prototype = _.extend(
  { // The public API of this widget:

    // Set the main element.
    setElement: function (el) {
      this.graphElement = getElement(el);
    },
    // Set the summary element.
    setSummaryElement: function (el) {
      this.summaryElement = getElement(el);
    },
    // Traverse nodes.
    eachNode: function (forEach) {
      var filter = this._canReachCurrentRoot();
      this.nodes
          .filter(filter)
          .forEach(forEach);
    },
    // Traverse edges
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
    // Update the graph and its summary.
    update: function () {
      this._updateGraph();
      this._renderSummary();
    }, 
    // Render.
    render: function () {
      this._renderGraph();
      this._renderSummary();
    }
  }
  , AbstractAPI
  , PrivateAPI
  , Backbone.Events // Mixins..
);

function getElement (elOrSelector) {
  if (_.isString(elOrSelector)) {
    return document.querySelector(elOrSelector);
  } else {
    return elOrSelector;
  }
}
