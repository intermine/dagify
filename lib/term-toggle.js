(function(){
  var Backbone, TermControl, out$ = typeof exports != 'undefined' && exports || this;
  Backbone = require('backbone');
  out$.TermControl = TermControl = (function(superclass){
    var prototype = extend$((import$(TermControl, superclass).displayName = 'TermControl', TermControl), superclass).prototype, constructor = TermControl;
    prototype.tagName = 'label';
    prototype.initialize = function(options){
      var this$ = this;
      this.options = options;
      return this.model.on("change:" + this.options.toggle, function(m, notChecked){
        return this$.$('input').prop('checked', !notChecked);
      });
    };
    prototype.render = function(){
      var ref$, cls, toggle, prop, desc, x$;
      ref$ = this.options, cls = ref$.cls, toggle = ref$.toggle, prop = ref$.prop, desc = ref$.desc;
      x$ = this.$el;
      x$.addClass(cls);
      x$.html("<input type=\"checkbox\" value=\"" + this.model.escape('identifier') + "\" \n    checked=\"" + !this.model.get(toggle) + "\"/>\n<span class=\"detail\">" + this.model.escape(prop) + " " + desc + "</span>\n<span class=\"name\">" + this.model.escape('name') + "</span>");
      return this;
    };
    prototype.events = function(){
      return {
        'change input': function(e){
          return this.model.toggle(this.options.toggle);
        }
      };
    };
    function TermControl(){
      TermControl.superclass.apply(this, arguments);
    }
    return TermControl;
  }(Backbone.View));
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
