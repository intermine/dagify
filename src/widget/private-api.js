'use strict';

var _ = require('underscore');
var renderGraph = require('../d3/render-graph');
var summaryTemplate = require('../templates/graph.summary');
var buildGraph = require('../logic/build-graph');

// Private - these methods are not part of the public API
module.exports = {

  _getNode: function (nid) {
    return this.nodes.find(function (node) {
      return this.getNodeID(node.toJSON()) === nid;
    }.bind(this));
  },

  _getParentsOf: function (nid) {
    var parents = [];
    this.edges.each(function (edge) {
      var data = edge.toJSON();
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
    var getID = _.compose(this.getNodeID, function (nm) { return nm.toJSON() });

    // _canReach :: (NodeModel) -> bool
    var _canReach = function (node) {
      var nid = getID(node);
      if (nid in cache) {
        return cache[nid];
      }
      // parents :: [nid]
      var parents = this._getParentsOf(nid);
      if (_.include(parents, currentRoot)) {
        return cache[nid] = true;
      } else {
        return cache[nid] = _.any(parents.map(getNode), _canReach);
      }
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
