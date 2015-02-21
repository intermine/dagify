'use strict';

/*
 * These are the default values for the methods that may
 * be overriden/re-implemented on the widgets. As such they
 * define useful defaults, but won't be applicable for every
 * use case.
 */

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

module.exports = {
  // All these methods can/should be replaced with more
  // specific implementations
  // depending on the shape of the incoming data.
  getNodeID: defaultGetNodeID,
  getEdgeSource: defaultGetEdgeSource,
  getEdgeTarget: defaultGetEdgeTarget,
  getNodeLabel: simpleGetLabel,
  getEdgeLabel: simpleGetLabel,
  getBaseNode: createBaseNode,
  getBaseEdge: createBaseEdge
};
