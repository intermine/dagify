(function(){
  var ref$, all, any, map, filter, anyTest, isRoot, trimGraphToHeight, GraphState;
  ref$ = require('prelude-ls'), all = ref$.all, any = ref$.any, map = ref$.map, filter = ref$.filter;
  anyTest = require('./util').anyTest;
  isRoot = function(it){
    return it.isRoot;
  };
  trimGraphToHeight = function(arg$, level){
    var nodes, edges, atOrBelowHeight, acceptable, filtered, i$, ref$, len$, n, elision;
    nodes = arg$.nodes, edges = arg$.edges;
    if (!level) {
      return {
        nodes: nodes,
        edges: edges
      };
    }
    atOrBelowHeight = function(){
      return (function(it){
        return it <= level;
      })(function(it){
        return it.stepsFromLeaf;
      }.apply(this, arguments));
    };
    acceptable = anyTest([isRoot, atOrBelowHeight]);
    filtered = {
      nodes: filter(acceptable, nodes),
      edges: filter(function(it){
        return all(acceptable, [it.source, it.target]);
      }, edges)
    };
    for (i$ = 0, len$ = (ref$ = filtered.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      if (!n.isRoot && any(fn$, map(fn1$, n.edges))) {
        elision = {
          source: n,
          target: n.root,
          label: 'elision'
        };
        filtered.edges.push(elision);
      }
    }
    return filtered;
    function fn$(){
      return not$(acceptable.apply(this, arguments));
    }
    function fn1$(it){
      return it.target;
    }
  };
  GraphState = (function(superclass){
    var prototype = extend$((import$(GraphState, superclass).displayName = 'GraphState', GraphState), superclass).prototype, constructor = GraphState;
    prototype.toString = function(){
      return "[GraphState " + this.cid + "]";
    };
    prototype.initialize = function(){
      console.log("Listening to myself");
      return this.on('annotated:height change:elision change:root change:all', bind$(this, 'updateGraph'));
    };
    prototype.updateGraph = function(){
      var level, currentRoot, ref$, allNodes, allEdges, nodes, edges, graph;
      console.log("Updating presented graph");
      level = this.get('elision');
      currentRoot = this.get('root');
      ref$ = this.get('all'), allNodes = ref$.nodes, allEdges = ref$.edges;
      nodes = (function(){
        switch (false) {
        case !currentRoot:
          return filter(function(){
            return (function(it){
              return it === currentRoot;
            })(function(it){
              return it.root;
            }.apply(this, arguments));
          }, allNodes);
        default:
          return allNodes.slice();
        }
      }());
      edges = (function(){
        switch (false) {
        case !currentRoot:
          return filter(function(){
            return (function(it){
              return it === currentRoot;
            })(function(it){
              return it.root;
            }(function(it){
              return it.target;
            }.apply(this, arguments)));
          }, allEdges);
        default:
          return allEdges.slice();
        }
      }());
      graph = (function(){
        switch (false) {
        case !(level && any(function(it){
          return it.stepsFromLeaf;
        }, nodes)):
          return trimGraphToHeight({
            nodes: nodes,
            edges: edges
          }, level);
        default:
          return {
            nodes: nodes,
            edges: edges
          };
        }
      }());
      return this.set({
        graph: graph
      });
    };
    function GraphState(){
      GraphState.superclass.apply(this, arguments);
    }
    return GraphState;
  }(Backbone.Model));
  module.exports = GraphState;
  function not$(x){ return !x; }
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);
