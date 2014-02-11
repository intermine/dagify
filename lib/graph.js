(function(){
  var ref$, unique, filter, sort, map, join, find, each, Graph;
  ref$ = require('prelude-ls'), unique = ref$.unique, filter = ref$.filter, sort = ref$.sort, map = ref$.map, join = ref$.join, find = ref$.find, each = ref$.each;
  Graph = (function(){
    Graph.displayName = 'Graph';
    var onlyMarked, heights, relationships, sources, roots, deMark, prototype = Graph.prototype, constructor = Graph;
    function Graph(arg$){
      this.nodes = arg$.nodes, this.edges = arg$.edges;
    }
    onlyMarked = filter(function(){
      return function(it){
        return it.marked;
      }(function(it){
        return it.source;
      }.apply(this, arguments));
    });
    heights = function(){
      return sort(unique(map(function(it){
        return it.stepsFromLeaf;
      }).apply(this, arguments)));
    };
    relationships = function(){
      return unique((function(it){
        return it.concat(['elision']);
      })(map(function(it){
        return it.label;
      }).apply(this, arguments)));
    };
    sources = function(){
      return sort(unique(map(join('-'))(function(it){
        return it.sources;
      }.apply(this, arguments))));
    };
    roots = filter(function(it){
      return it.isRoot;
    });
    deMark = function(n){
      return n.marked = n.isReachable = n.isFocus = n.isSource = n.isTarget = false;
    };
    prototype.getMarkedStatements = function(){
      return onlyMarked(this.edges);
    };
    prototype.unmark = function(){
      return each(deMark, this.nodes);
    };
    prototype.getHeights = function(){
      return heights(this.nodes);
    };
    prototype.getRelationships = function(){
      return relationships(this.edges);
    };
    prototype.getSources = function(){
      return sources(this.nodes);
    };
    prototype.getRoots = function(){
      return roots(this.nodes);
    };
    prototype.getNode = function(nodeId){
      return find(function(){
        return (function(it){
          return it === nodeId;
        })(function(it){
          return it.id;
        }.apply(this, arguments));
      }, this.nodes);
    };
    return Graph;
  }());
  module.exports = {
    Graph: Graph
  };
}).call(this);
