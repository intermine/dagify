(function(){
  var ref$, any, minimum, map, fold, unique, getRank, getRoot, canReachAny, transitiveClosure, descendentsOf, ancestorsOf, out$ = typeof exports != 'undefined' && exports || this;
  ref$ = require('prelude-ls'), any = ref$.any, minimum = ref$.minimum, map = ref$.map, fold = ref$.fold, unique = ref$.unique;
  out$.getRank = getRank = curry$(function(g, n){
    var succ;
    succ = g.successors(n);
    if (succ.length) {
      return 1 + minimum(map(getRank(g), succ));
    } else {
      return 0;
    }
  });
  out$.getRoot = getRoot = curry$(function(g, n){
    var next;
    next = g.successors(n)[0];
    if (next != null) {
      return getRoot(g, next);
    } else {
      return n;
    }
  });
  out$.canReachAny = canReachAny = curry$(function(g, roots, nid){
    var succ;
    succ = g.successors(nid);
    return in$(nid, roots) || any(canReachAny(g, roots), succ);
  });
  transitiveClosure = curry$(function(f, g, n){
    var forNode;
    forNode = f(g, n);
    return unique(fold(curry$(function(x$, y$){
      return x$.concat(y$);
    }), forNode, map(transitiveClosure(f, g), forNode)));
  });
  out$.descendentsOf = descendentsOf = transitiveClosure(function(g, n){
    return g.predecessors(n);
  });
  out$.ancestorsOf = ancestorsOf = transitiveClosure(function(g, n){
    return g.successors(n);
  });
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
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);
