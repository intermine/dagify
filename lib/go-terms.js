(function(){
  var UniqueCollection, Terms, out$ = typeof exports != 'undefined' && exports || this;
  UniqueCollection = require('./unique-collection.ls').UniqueCollection;
  out$.Terms = Terms = (function(superclass){
    var prototype = extend$((import$(Terms, superclass).displayName = 'Terms', Terms), superclass).prototype, constructor = Terms;
    function Terms(keyFn){
      keyFn == null && (keyFn = function(it){
        return it.identifier;
      });
      Terms.superclass.call(this, [], {
        keyFn: keyFn
      });
    }
    return Terms;
  }(UniqueCollection));
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
