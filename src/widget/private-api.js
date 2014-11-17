'use strict';

var _ = require('underscore');
var renderGraph = require('../d3/render-graph');
var summaryTemplate = require('../templates/graph.summary');
var buildGraph = require('../logic/build-graph');

var asData = function (model) {
  return model.toJSON();
};

// Private - these methods are not part of the public API
module.exports = {

  _getNode: function (nid) {
    return this.nodes.find(function (node) {
      return this.getNodeID(asData(node)) === nid;
    }.bind(this));
  },

  _getParentsOf: function (nid) {
    var parents = [];
    this.edges.each(function (edge) {
      var data = asData(edge);
      var node = this.getEdgeSource(data);
      var parent = this.getEdgeTarget(data);
      if (node === nid) {
        parents.push(parent);
      }
    }.bind(this));
    return parents;
  },
  _canReachCurrentRoot: function () {
    var currentRoot = this.graphState.get('currentRoot')
      , cache = {}; 
    cache[currentRoot] = true; // Obviously the root can reach itself.
    if (!currentRoot) {
      return function () { return true; };
    }
    // getNode :: (nid) -> NodeModel
    var getNode = this._getNode.bind(this);
    // getID :: (NodeModel) -> nid
    var getID = _.compose(this.getNodeID, asData);

    // _canReach :: (NodeModel) -> bool
    var _canReach = function (node) {
      var nid = getID(node);
      if (!(nid in cache)) {
        // parents :: [nid]
        var parents = this._getParentsOf(nid);
        if (_.include(parents, currentRoot)) {
          cache[nid] = true;
        } else {
          cache[nid] = _.any(parents.map(getNode), _canReach);
        }
      }
      return cache[nid];
    }.bind(this);
    return _canReach;
  },

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
      this._update(buildGraph(this));
    }
  },

  _renderGraph: function () {
    if (this.graphElement) {
      this._update = renderGraph(this.graphElement, buildGraph(this));
    }
  }
};
