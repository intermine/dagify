(function(){
  var Backbone, isType, UniqueCollection, out$ = typeof exports != 'undefined' && exports || this;
  Backbone = require('backbone');
  isType = require('prelude-ls').isType;
  out$.UniqueCollection = UniqueCollection = (function(superclass){
    var isArray, prototype = extend$((import$(UniqueCollection, superclass).displayName = 'UniqueCollection', UniqueCollection), superclass).prototype, constructor = UniqueCollection;
    function UniqueCollection(elems, opts){
      this.keyFn = opts.keyFn;
      UniqueCollection.superclass.call(this, elems, opts);
    }
    isArray = isType('Array');
    prototype.add = function(args, opts){
      var toAdd, i$, len$, arg, results$ = [], this$ = this;
      toAdd = isArray(args)
        ? args
        : [args];
      for (i$ = 0, len$ = toAdd.length; i$ < len$; ++i$) {
        arg = toAdd[i$];
        if (!this.any(fn$)) {
          results$.push(superclass.prototype.add.call(this, arg, opts));
        }
      }
      return results$;
      function fn$(m){
        return this$.keyFn(arg) === this$.keyFor(m);
      }
    };
    prototype.keyFor = function(m){
      return this.keyFn(m.toJSON());
    };
    return UniqueCollection;
  }(Backbone.Collection));
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
}).call(this);
