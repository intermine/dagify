(function(){
  var Backbone, TermControl, RootTerm, out$ = typeof exports != 'undefined' && exports || this;
  Backbone = require('backbone');
  TermControl = require('./term-toggle.ls').TermControl;
  out$.RootTerm = RootTerm = (function(superclass){
    var invertSelection, prototype = extend$((import$(RootTerm, superclass).displayName = 'RootTerm', RootTerm), superclass).prototype, constructor = RootTerm;
    prototype.tagName = 'dd';
    prototype.className = 'root-term';
    prototype.initialize = function(arg$){
      var this$ = this;
      this.highLevelTerms = arg$.highLevelTerms, this.lowLevelTerms = arg$.lowLevelTerms;
      this.state = new Backbone.Model({
        selection: 'high'
      });
      this.highLevelTerms.on('add', bind$(this, 'appendHighLevelTerm'));
      this.lowLevelTerms.on('add', bind$(this, 'appendLowLevelTerm'));
      this.state.on('change:selection', bind$(this, 'tabSelect'));
      return this.on('currentRoot', function(root){
        if (root === this$.model) {
          this$.$('.title').addClass('active');
          return this$.$('.sub-terms').addClass('active');
        } else {
          this$.$('.sub-terms').removeClass('active');
          return this$.$('.title').removeClass('active');
        }
      });
    };
    prototype.render = function(){
      var isCurrent;
      isCurrent = this.model.toJSON().isCurrent;
      this.el.innerHTML = "<a href=\"#\"\n    class=\"title " + (isCurrent ? 'active' : '') + "\">\n    " + this.model.escape('name') + "\n</a>\n<div class=\"sub-terms content " + (isCurrent ? 'active' : '') + "\">\n    <dl class=\"tabs\" data-tab>\n      <dd class=\"active high-level\"><a>High Level</a></dd>\n      <dd class=\"low-level\"><a>Low Level</a></dd>\n    </dl>\n    <div class=\"tabs-content\">\n      <div class=\"active content high-level\"></div>\n      <div class=\"content low-level\"></div>\n    </div>\n    <button class=\"button tiny invert\">Invert Selection</button>\n</div>";
      this.highLevelTerms.each(bind$(this, 'appendHighLevelTerm'));
      this.lowLevelTerms.each(bind$(this, 'appendLowLevelTerm'));
      return this;
    };
    prototype.appendHighLevelTerm = function(term){
      if (term.get('rootTerm') !== this.model) {
        return;
      }
      return this.$('.content.high-level').append(this.termControl('high-level-term', term, 'descendents', "child terms", 'hidden'));
    };
    prototype.appendLowLevelTerm = function(term){
      if (term.get('rootTerm') !== this.model) {
        return;
      }
      return this.$('.content.low-level').append(this.termControl('low-level-term', term, 'ancestors', "parent terms", 'noneabove'));
    };
    prototype.termControl = function(cls, term, prop, desc, toggle){
      return function(it){
        return it.render().el;
      }(new TermControl({
        model: term,
        cls: cls,
        prop: prop,
        desc: desc,
        toggle: toggle
      }));
    };
    prototype.tabSelect = function(state, cls){
      this.$('.tabs dd').removeClass('active');
      this.$(".tabs ." + cls + "-level").addClass('active');
      this.$('.tabs-content .content').removeClass('active');
      return this.$(".tabs-content .content." + cls + "-level").addClass('active');
    };
    invertSelection = function(e){
      var m, sel, coll, prop, term, t;
      e.stopPropagation();
      m = this.model;
      sel = this.state.get('selection');
      coll = (function(){
        switch (sel) {
        case 'high':
          return this.highLevelTerms;
        case 'low':
          return this.lowLevelTerms;
        default:
          throw new Error("illegal selection");
        }
      }.call(this));
      prop = (function(){
        switch (sel) {
        case 'high':
          return 'hidden';
        case 'low':
          return 'noneabove';
        default:
          throw new Error("illegal selection");
        }
      }());
      t = (function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = coll.filter(fn$)).length; i$ < len$; ++i$) {
          term = ref$[i$];
          results$.push(term.set(prop, !term.get(prop), {
            batch: true
          }));
        }
        return results$;
        function fn$(it){
          return it.get('rootTerm') === m;
        }
      }())[0];
      return t != null ? t.trigger("change:" + prop, t, t.get(prop)) : void 8;
    };
    prototype.events = function(){
      return {
        'click .invert': invertSelection,
        'click .tabs .high-level': function(){
          return this.state.set({
            selection: 'high'
          });
        },
        'click .tabs .low-level': function(){
          return this.state.set({
            selection: 'low'
          });
        },
        'click .title': function(e){
          e.stopPropagation();
          this.$('.sub-terms').toggleClass('active');
          return this.trigger('select:rootTerm', this.model);
        }
      };
    };
    function RootTerm(){
      RootTerm.superclass.apply(this, arguments);
    }
    return RootTerm;
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
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);
