'use strict';

var dagreD3 = require('dagre-d3');

/**
 * @params widget - An object with the following structure:
 *   graphState :: Jsonable
 *   eachNode :: (Jsonable) -> ()
 *   eachEdge (Jsonable) -> ()
 *   trigger :: (String, args...) -> ()
 *   getNodeID :: (Obj) -> String
 *   getNodeLabel :: (Obj) -> String
 *   getBaseNode :: (Obj) -> (Obj)
 *   getEdgeSource :: (Obj) -> String
 *   getEdgeTarget :: (Obj) -> String
 *   getBaseEdge :: (Obj) -> (Obj)
 *   getEdgeLabel :: (Obj) -> String
 * 
 * where: 
 *   Jsonable is an object with the following structure:
 *     toJSON :: () -> (Obj)
 */
module.exports = function buildGraph (widget) {
	var graph = new dagreD3.graphlib.Graph();

	graph.setGraph(widget.graphState.toJSON());

	widget.eachNode(function (model) {
		var node = model.toJSON();
		var nodeID = widget.getNodeID(node);
		var nodeData = widget.getBaseNode(node);
		nodeData.label = widget.getNodeLabel(node);
		graph.setNode(nodeID, nodeData);
	});
	widget.eachEdge(function (model) {
		var edge = model.toJSON();
		var sourceId = widget.getEdgeSource(edge);
		var targetId = widget.getEdgeTarget(edge);
		var edgeData = widget.getBaseEdge();
		edgeData.label = widget.getEdgeLabel(edge);
		graph.setEdge(sourceId, targetId, edgeData);
	});
  // publish details of the new graph to listeners.
	widget.trigger('change:graph', graph);
	return graph;
};
