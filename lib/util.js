(function(){
  var ref$, reject, empty, any, min, max, each, map, pairsToObj, objectify, error, len, within, notify, failWhenEmpty, doTo, anyTest, relationshipTest;
  ref$ = require('prelude-ls'), reject = ref$.reject, empty = ref$.empty, any = ref$.any, min = ref$.min, max = ref$.max, each = ref$.each, map = ref$.map, pairsToObj = ref$.pairsToObj;
  objectify = curry$(function(key, value, list){
    return function(){
      return pairsToObj(map(function(it){
        return [key(it), value(it)];
      }).apply(this, arguments));
    }(
    list);
  });
  error = function(msg){
    return $.Deferred(function(){
      return this.reject(msg);
    });
  };
  len = function(it){
    return it.length;
  };
  within = curry$(function(upper, lower, actual){
    return min(upper, max(lower, actual));
  });
  notify = function(it){
    return alert(it);
  };
  failWhenEmpty = curry$(function(msg, promise){
    return promise.then(function(it){
      if (empty(it)) {
        return error(msg);
      } else {
        return it;
      }
    });
  });
  doTo = function(f, x){
    return f(x);
  };
  anyTest = curry$(function(tests, x){
    return any(flip$(doTo)(x), tests);
  });
  relationshipTest = curry$(function(link, defVal, x){
    switch (false) {
    case !(link && link.label):
      return link === x;
    case !link:
      return link === x.label;
    default:
      return defVal;
    }
  });
  module.exports = {
    toLtrb: toLtrb,
    toXywh: toXywh,
    markSubtree: markSubtree,
    objectify: objectify,
    error: error,
    len: len,
    within: within,
    notify: notify,
    failWhenEmpty: failWhenEmpty,
    doTo: doTo,
    anyTest: anyTest,
    relationshipTest: relationshipTest
  };
  function markSubtree(root, prop, val){
    var queue, moar, n;
    queue = [root];
    moar = function(arg$){
      var edges;
      edges = arg$.edges;
      return reject(function(){
        return (function(it){
          return it === val;
        })(function(it){
          return it[prop];
        }.apply(this, arguments));
      })(
      map(function(it){
        return it.source;
      }, edges));
    };
    while (n = queue.shift()) {
      n[prop] = val;
      each(bind$(queue, 'push'), moar(n));
    }
    return root;
  }
  function toLtrb(arg$, k){
    var x, y, height, width;
    x = arg$.x, y = arg$.y, height = arg$.height, width = arg$.width;
    k == null && (k = 1);
    return {
      l: x - k * width / 2,
      t: y - k * height / 2,
      r: x + k * width / 2,
      b: y + k * height / 2
    };
  }
  function toXywh(arg$){
    var l, t, r, b;
    l = arg$.l, t = arg$.t, r = arg$.r, b = arg$.b;
    return {
      x: l + (r - l) / 2,
      y: t + (b - t) / 2,
      height: b - t,
      width: r - l
    };
  }
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
  function flip$(f){
    return curry$(function (x, y) { return f(y, x); });
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);
