(function(){
  var ref$, empty, ln, sum, isRoot, isLeaf, isDirect, Node, newNode;
  ref$ = require('prelude-ls'), empty = ref$.empty, ln = ref$.ln, sum = ref$.sum;
  isRoot = function(it){
    return it.isRoot;
  };
  isLeaf = function(it){
    return it.isLeaf;
  };
  isDirect = function(it){
    return it.isDirect;
  };
  Node = (function(){
    Node.displayName = 'Node';
    var prototype = Node.prototype, constructor = Node;
    function Node(label, id, description, origin, syms){
      var this$ = this instanceof ctor$ ? this : new ctor$;
      this$.label = label;
      this$.id = id;
      this$.description = description;
      this$.counts = [];
      this$.sources = [origin];
      this$.symbols = syms.slice();
      this$.edges = [];
      this$.depths = [];
      return this$;
    } function ctor$(){} ctor$.prototype = prototype;
    prototype.marked = false;
    prototype.muted = false;
    prototype.isLeaf = false;
    prototype.isRoot = false;
    prototype.isDirect = false;
    prototype.radius = function(){
      var k, countPortion, markedFac;
      k = 5;
      countPortion = empty(this.counts)
        ? 0
        : 1.5 * ln(this.getTotalCount());
      markedFac = this.marked ? 2 : 1;
      return (k + countPortion) * markedFac;
    };
    prototype.getTotalCount = function(){
      return sum(this.counts);
    };
    prototype.addCount = function(c){
      if (c != null) {
        return this.counts.push(c);
      }
    };
    return Node;
  }());
  newNode = curry$(function(src, syms, id, label, desc){
    return Node(label, id, desc, src, syms);
  });
  module.exports = {
    Node: Node,
    newNode: newNode,
    isLeaf: isLeaf,
    isRoot: isRoot,
    isDirect: isDirect
  };
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);
