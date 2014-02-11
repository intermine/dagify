(function(){
  var Backbone, _, Terms, ref$, Obj, any, unique, map, pairsToObj, fold, first, intersection, getRoot, ancestorsOf, descendentsOf, RootTerm, rootNode, countDesc, countAnc, Controls, out$ = typeof exports != 'undefined' && exports || this, slice$ = [].slice;
  Backbone = require('backbone');
  _ = require('underscore');
  Terms = require('./go-terms.ls').Terms;
  ref$ = require('prelude-ls'), Obj = ref$.Obj, any = ref$.any, unique = ref$.unique, map = ref$.map, pairsToObj = ref$.pairsToObj, fold = ref$.fold, first = ref$.first, intersection = ref$.intersection;
  ref$ = require('./graph-utils.ls'), getRoot = ref$.getRoot, ancestorsOf = ref$.ancestorsOf, descendentsOf = ref$.descendentsOf;
  RootTerm = require('./root-term.ls').RootTerm;
  rootNode = function(g, n){
    return g.node(getRoot(g, n));
  };
  countDesc = function(){
    return function(it){
      return it.length;
    }(descendentsOf.apply(this, arguments));
  };
  countAnc = function(){
    return function(it){
      return it.length;
    }(ancestorsOf.apply(this, arguments));
  };
  out$.Controls = Controls = (function(superclass){
    var prototype = extend$((import$(Controls, superclass).displayName = 'Controls', Controls), superclass).prototype, constructor = Controls;
    prototype.tagName = 'form';
    prototype.className = 'controls';
    prototype.initialize = function(options){
      var tk, ref$;
      options == null && (options = {});
      this.termKey = tk = (ref$ = options.termKey) != null
        ? ref$
        : function(it){
          return it.identifier;
        };
      this.termTemplate = _.template((ref$ = options.termTemplate) != null ? ref$ : "<%- name %> (<%- identifier %>)");
      this.state = new Backbone.Model;
      this.topTerms = new Terms(tk);
      this.roots = new Terms(tk);
      this.directTerms = new Terms(tk);
      return this.roots.on('add', bind$(this, 'insertRoot'));
    };
    prototype.showTermSuggestion = function(ul, term){
      return function(it){
        return it.appendTo(ul);
      }($("<li><a>" + this.termTemplate(term.toJSON()) + "</a></li>"));
    };
    prototype.selectTerm = curry$((function(textBox, report, e, arg$){
      var item, term;
      item = arg$.item;
      e.preventDefault();
      term = this.termKey(item.toJSON());
      textBox.val(this.termTemplate(item.toJSON()));
      return report(term);
    }), true);
    prototype.render = function(){
      this.$el.html("<div class=\"row collapse\">\n    <div class=\"small-9 columns\">\n        <input class=\"find\" type=\"text\" placeholder=\"filter\">\n    </div>\n    <div class=\"small-3 columns\">\n        <button class=\"clear-filter postfix button\">clear</button>\n    </div>\n</div>\n<select class=\"layout\">\n    <option value=\"BT\">Vertical</option>\n    <option value=\"LR\">Horizontal</option>\n    <option value=\"TB\">Inverse Vertical</option>\n    <option value=\"RL\">Inverse Horizontal</option>\n</select>\n<dl class=\"accordion terms\" data-section=accordion>\n</dl>");
      this.roots.each(bind$(this, 'insertRoot'));
      return this.initAutocomplete();
    };
    prototype.initAutocomplete = function(){
      var finder, report, source, onChoice, select, focus, ac;
      finder = this.$('.find');
      report = bind$(this, 'trigger');
      source = bind$(this, 'suggestTerms');
      onChoice = this.selectTerm(finder, partialize$.apply(this, [report, ['chosen', void 8], [1]]));
      select = function(){
        return function(){
          return finder.blur();
        }(onChoice.apply(this, arguments));
      };
      focus = this.selectTerm(finder, partialize$.apply(this, [report, ['filter', void 8], [1]]));
      ac = function(it){
        return it.data('ui-autocomplete');
      }(
      function(it){
        return it.autocomplete({
          source: source,
          select: select,
          focus: focus
        });
      }(
      finder));
      return ac._renderItem = bind$(this, 'showTermSuggestion');
    };
    prototype.suggestTerms = function(arg$, done){
      var term, currentId, terms, ref$, re, t;
      term = arg$.term;
      currentId = this.termKey(this.state.get('currentRoot').toJSON());
      terms = (ref$ = this.termsFor[currentId]) != null
        ? ref$
        : [];
      re = new RegExp($.ui.autocomplete.escapeRegex(term), 'i');
      return done((function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = terms).length; i$ < len$; ++i$) {
          t = ref$[i$];
          if (any(bind$(re, 'test'), map(bind$(t, 'get'), ['identifier', 'name']))) {
            results$.push(t);
          }
        }
        return results$;
      }()));
    };
    prototype.insertRoot = function(root){
      var id, view;
      id = this.termKey(root.toJSON());
      this.rootViews[id] = view = new RootTerm({
        model: root,
        highLevelTerms: this.topTerms,
        lowLevelTerms: this.directTerms
      });
      view.render();
      view.on('select:rootTerm', partialize$.apply(this.state, [this.state.set, ['currentRoot', void 8], [1]]));
      view.trigger('currentRoot', this.state.get('currentRoot'));
      return this.$('.terms').append(view.el);
    };
    prototype.readGraph = function(g){
      var sinks, roots, res$, i$, len$, n, oneRemoved, j$, ref$, len1$, p;
      sinks = g.sinks();
      res$ = [];
      for (i$ = 0, len$ = sinks.length; i$ < len$; ++i$) {
        n = sinks[i$];
        res$.push(g.node(n));
      }
      roots = res$;
      res$ = [];
      for (i$ = 0, len$ = sinks.length; i$ < len$; ++i$) {
        n = sinks[i$];
        for (j$ = 0, len1$ = (ref$ = g.predecessors(n)).length; j$ < len1$; ++j$) {
          p = ref$[j$];
          res$.push(p);
        }
      }
      oneRemoved = res$;
      if (!this.state.has('currentRoot')) {
        this.state.set({
          currentRoot: first(roots)
        }, {
          init: true
        });
      }
      this.roots.add(roots);
      for (i$ = 0, len$ = oneRemoved.length; i$ < len$; ++i$) {
        n = oneRemoved[i$];
        this.topTerms.add(g.node(n).set({
          descendents: countDesc(g, n),
          rootTerm: rootNode(g, n)
        }));
      }
      for (i$ = 0, len$ = (ref$ = g.nodes()).length; i$ < len$; ++i$) {
        n = ref$[i$];
        if (g.node(n).get('direct')) {
          this.directTerms.add(g.node(n).set({
            ancestors: countAnc(g, n),
            rootTerm: rootNode(g, n)
          }));
        }
      }
      this.termsFor = Obj.map(map(bind$(g, 'node')), _.groupBy(g.nodes(), getRoot(g)));
      return $('.ui-autocomplete').addClass('f-dropdown');
    };
    prototype.rootViews = {};
    prototype.termsFor = {};
    prototype.wireToDag = function(dag){
      var this$ = this;
      this.on('filter chosen', partialize$.apply(dag.state, [dag.state.set, ['filter', void 8], [1]]));
      this.on('chosen', bind$(dag, 'zoomTo'));
      this.on('chosen:layout', bind$(dag, 'setLayout'));
      this.state.on('change:currentRoot', function(state, selected, arg$){
        var init, id, ref$, view;
        init = (arg$ != null
          ? arg$
          : {}).init;
        for (id in ref$ = this$.rootViews) {
          view = ref$[id];
          view.trigger('currentRoot', selected);
        }
        if (!init) {
          return dag.trigger('redraw');
        }
      });
      dag.on('whole:graph', bind$(this, 'readGraph'));
      return dag.setRootFilter(function(ontologyTerm){
        var currentRoot, ref$;
        currentRoot = (ref$ = this$.state.get('currentRoot')) != null
          ? ref$
          : this$.roots.first();
        return ontologyTerm.identifier === currentRoot.get('identifier');
      });
    };
    prototype.events = function(){
      return {
        'submit': function(it){
          return it.preventDefault();
        },
        'click .clear-filter': function(e){
          e.preventDefault();
          this.$('.find').val(null);
          return this.trigger('filter', null);
        },
        'keyup .find': function(e){
          return this.trigger('filter', e.target.value);
        },
        'change .layout': function(e){
          this.trigger('chosen:layout', $(e.target).val());
          return $(e.target).blur();
        }
      };
    };
    function Controls(){
      this.selectTerm = bind$(this, 'selectTerm', prototype);
      Controls.superclass.apply(this, arguments);
    }
    return Controls;
  }(Backbone.View));
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
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
  function partialize$(f, args, where){
    var context = this;
    return function(){
      var params = slice$.call(arguments), i,
          len = params.length, wlen = where.length,
          ta = args ? args.concat() : [], tw = where ? where.concat() : [];
      for(i = 0; i < len; ++i) { ta[tw[0]] = params[i]; tw.shift(); }
      return len < wlen && len ?
        partialize$.apply(context, [f, ta, tw]) : f.apply(context, ta);
    };
  }
}).call(this);
