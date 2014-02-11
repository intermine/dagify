(function(){
  var DEFAULT_GRAPH_STATE, $, dagify, ref$, min, map, id, each, first, zipAll, objectify, GraphState, getGraphState, OntologyWidget, Widget;
  DEFAULT_GRAPH_STATE = {
    view: 'Dag',
    smallGraphThreshold: 20,
    jiggle: null,
    spline: 'curved',
    dagDirection: 'LR',
    maxmarked: 20,
    tickK: 15,
    translate: [5, 5],
    elision: null
  };
  $ = jQuery;
  dagify = require('./dagify');
  ref$ = require('prelude-ls'), min = ref$.min, map = ref$.map, id = ref$.id, each = ref$.each, first = ref$.first, zipAll = ref$.zipAll;
  objectify = require('./util').objectify;
  GraphState = require('./state');
  getGraphState = function(config){
    var initVals, data;
    initVals = {
      root: null,
      animating: 'waiting'
    };
    data = import$(import$(import$({}, DEFAULT_GRAPH_STATE), initVals), config.graphState);
    if (data.query == null) {
      throw new Error("No query provided.");
    }
    return new GraphState(data);
  };
  OntologyWidget = (function(superclass){
    var prototype = extend$((import$(OntologyWidget, superclass).displayName = 'OntologyWidget', OntologyWidget), superclass).prototype, constructor = OntologyWidget;
    prototype.initialize = function(config, templates){
      var Service;
      this.config = config;
      this.templates = templates;
      Service = intermine.Service;
      this.service = new Service(this.config.service);
      this.model = getGraphState(this.config);
      return this.interopMines = objectify(function(it){
        return it.taxonId;
      }, function(grp){
        var name;
        name = grp.name;
        return (function(it){
          return it.name = name, it;
        })(new Service(grp));
      })(
      this.config.interop);
    };
    prototype.toString = function(){
      return "[OntologyWidget(" + this.cid + ")]";
    };
    prototype.render = function(target){
      var elem;
      elem = $(target)[0];
      this.setElement(elem);
      if (!this.model.has('dimensions')) {
        this.model.set({
          dimensions: {
            w: elem.offsetWidth,
            h: elem.offsetHeight || min($('body').height(), elem.offsetWidth)
          }
        });
      }
      this.renderChrome();
      this.startListening();
      this.loadData();
      return this;
    };
    OntologyWidget.BINDINGS = {
      tickK: '.min-ticks',
      jiggle: '.jiggle',
      spline: '.spline',
      view: '.graph-view',
      dagDirection: '.dag-direction'
    };
    prototype.startListening = function(){
      var key, ref$, sel, this$ = this;
      for (key in ref$ = constructor.BINDINGS) {
        sel = ref$[key];
        fn$();
      }
      this.listenTo(this.model, 'change:query', this.loadData);
      this.listenTo(this.model, 'change:query', bind$(this, 'resetHomologyButtons'));
      this.listenTo(this.model, 'change:heights', this.fillElisionSelector);
      this.listenTo(this.model, 'change:root', this.onRootChange);
      this.listenTo(this.model, 'change:elision', function(m, elision){
        return this$.$('.elision').val(elision);
      });
      this.listenTo(this.model, 'change:all', bind$(this, 'renderRoots'));
      this.listenTo(this.model, 'change:all', function(m, graph){
        return m.set({
          root: first(graph.getRoots())
        });
      });
      this.listenTo(this.model, 'change:graph change:view change:dagDirection', bind$(this, 'presentGraph'));
      this.listenTo(this.model, 'nodes:marked change:all', bind$(this, 'showOntologyTable'));
      this.on('controls:changed', function(){
        return this$.$el.foundation();
      });
      return this.on('graph:reset', function(){
        this$.model.get('all').unmark();
        return this$.model.trigger('nodes:marked');
      });
      function fn$(sel){
        return this$.listenTo(this$.model, 'change:' + key, function(m, v){
          return this$.$(sel).val(v);
        });
      }
    };
    prototype.onRootChange = function(){
      var root;
      root = this.model.get('root');
      console.log("Root is now " + (root != null ? root.id : void 8) + ": " + (root != null ? root.label : void 8));
      if (root != null) {
        return this.$('.graph-root').val(root.id);
      }
    };
    prototype.renderRoots = function(){
      var roots, select, i$, ref$, len$, r;
      roots = this.model.get('all').getRoots();
      select = this.$('select.graph-root').empty();
      for (i$ = 0, len$ = (ref$ = roots.concat({
        id: null,
        label: 'All'
      })).length; i$ < len$; ++i$) {
        r = ref$[i$];
        select.append("<option value=\"" + r.id + "\">" + r.label + "</option>");
      }
      return this.trigger('controls:changed');
    };
    prototype.presentGraph = function(){
      var view, render, this$ = this;
      console.log("Presenting graph to the world");
      view = this.model.get('view');
      render = dagify['render' + view] || dagify.renderDag;
      return process.nextTick(function(){
        return render(this$.model, this$.model.get('graph'));
      });
    };
    prototype.resetHomologyButtons = function(){
      return this.$('.interop-sources a').removeClass('disabled');
    };
    prototype.fillElisionSelector = function(){
      var elisionSelector, i$, ref$, len$, h, text, level;
      elisionSelector = this.$('select.elision');
      elisionSelector.empty();
      for (i$ = 0, len$ = (ref$ = this.model.get('heights')).length; i$ < len$; ++i$) {
        h = ref$[i$];
        text = h === 0
          ? "Show all terms"
          : h === 1
            ? "Show only direct terms, and the root term"
            : "Show all terms within " + h + " steps of a directly annotated term";
        elisionSelector.append("<option value=\"" + h + "\">" + text + "</option>");
      }
      this.trigger('controls:changed');
      if (level = this.model.get('elision')) {
        return elisionSelector.val(level);
      }
    };
    prototype.renderChrome = function(){
      var key, ref$, sel;
      this.$el.html(this.templates['widget.html']());
      for (key in ref$ = Widget.BINDINGS) {
        sel = ref$[key];
        this.$(sel).val(this.model.get(key));
      }
      this.model.set('svg', first(this.$el.find('svg')));
      this.setUpOntologyTable();
      return this.setupInterop();
    };
    prototype.setUpOntologyTable = function(){
      var ref$, w, h, table;
      ref$ = this.model.get('dimensions'), w = ref$.w, h = ref$.h;
      table = this.$('.ontology-table').addClass('open').css({
        top: 0.05 * h,
        left: w - 50,
        height: 0.9 * h,
        width: 0.6 * w
      });
      table.find('.scroll-container').css({
        'max-height': 0.8 * h
      });
      return table.find('table').addClass('tablesorter').tablesorter();
    };
    prototype.setupInterop = function(){
      var $ul, self, toOption;
      $ul = this.$('.interop-sources');
      self = this;
      toOption = function(group){
        var $li;
        $li = $("<li><a class=\"small button\">" + group.name + "</a></li>");
        return $li.find('a').on('click', function(){
          var $this;
          $this = $(this);
          if ($this.hasClass('disabled')) {
            return;
          }
          $this.addClass('disabled');
          return self.addDataFrom(group.taxonId);
        });
      };
      return each(function(){
        return bind$($ul, 'append')(toOption.apply(this, arguments));
      }, this.config.interop);
    };
    prototype.addDataFrom = function(taxonId){
      var service, graph, query, monitor, merging, this$ = this;
      service = this.interopMines[taxonId];
      graph = this.model.get('all');
      query = this.model.get('query');
      monitor = dagify.progressMonitor(this.$('.homologue-progress'));
      merging = dagify.fetchAndMergeHomology(monitor, this.service, service, graph, query, taxonId);
      merging.fail(this.reportError);
      merging.done(function(merged){
        return this$.annotate(merged);
      });
      merging.done(function(merged){
        return this$.model.set({
          all: merged
        });
      });
      return merging.done(function(merged){
        return this$.model.set({
          roots: merged.getRoots()
        });
      });
    };
    prototype.linkRow = function(link){
      var evt, $row, this$ = this;
      evt = 'relationship:highlight';
      $row = $(this.templates['ontologyRelationshipRow.html'](link));
      return $row.on('mouseout', function(){
        $row.removeClass('highlit');
        return this$.model.trigger(evt, null);
      }).on('mouseover', function(){
        $row.addClass('highlit');
        return this$.model.trigger(evt, link);
      });
    };
    prototype.termRow = function(term){
      var evt, $row, this$ = this;
      evt = 'term:highlight';
      $row = $(this.templates['ontologyTermRow.html'](term));
      return $row.on('mouseout', function(){
        $row.removeClass('highlit');
        return this$.model.trigger(evt, null);
      }).on('mouseover', function(){
        $row.addClass('highlit');
        return this$.model.trigger(evt, term);
      });
    };
    prototype.showOntologyTable = function(){
      var ref$, w, h, markedStatements, $tables, templates, filters, ontologyTable, i$, len$, ref1$, $el, tmpl, f;
      ref$ = this.model.get('dimensions'), w = ref$.w, h = ref$.h;
      markedStatements = this.model.get('all').getMarkedStatements();
      console.log("Got " + markedStatements.length + " marked statements");
      $tables = map(bind$(this, '$'), ['.marked-statements', '.marked-terms']);
      templates = [bind$(this, 'linkRow'), bind$(this, 'termRow')];
      filters = [id, dagify.edgesToNodes];
      each(function(it){
        return it.find('tbody').empty();
      }, $tables);
      ontologyTable = this.$('.ontology-table');
      if (markedStatements.length) {
        for (i$ = 0, len$ = (ref$ = zipAll($tables, templates, filters)).length; i$ < len$; ++i$) {
          ref1$ = ref$[i$], $el = ref1$[0], tmpl = ref1$[1], f = ref1$[2];
          each(fn$, f(markedStatements));
        }
        ontologyTable.show().foundation('section', 'reflow').find('table').trigger('update');
        return this.toggleOntologyTable();
      } else {
        return ontologyTable.animate({
          left: w - 50
        }, function(){
          return ontologyTable.removeClass('open').hide();
        });
      }
      function fn$(){
        return bind$($el, 'append')(tmpl.apply(this, arguments));
      }
    };
    prototype.events = function(){
      var state, evts, key, ref$, sel, this$ = this;
      state = this.model;
      evts = {
        'submit .graph-control': function(e){
          return e.preventDefault();
        },
        'click .graph-control .resizer': 'toggleDisplayOptions',
        'click .graph-reset': function(){
          return this$.trigger('graph:reset');
        },
        'click .marked-terms .description .more': function(it){
          return $(it.target).hide().prev().hide().end().next().show();
        }
      };
      for (key in ref$ = Widget.BINDINGS) {
        sel = ref$[key];
        evts['change ' + sel] = fn$;
      }
      evts['click .button.symbol'] = function(){
        var newSymbol;
        newSymbol = this.$('input.symbol').val();
        return state.set({
          query: newSymbol
        });
      };
      evts['change .graph-root'] = function(e){
        var rootId;
        rootId = $(e.target).val();
        return state.set({
          root: state.get('all').getNode(rootId)
        });
      };
      evts['change .elision'] = function(it){
        return state.set('elision', parseInt($(it.target).val(), 10));
      };
      evts['click .slide-control'] = bind$(this, 'toggleOntologyTable');
      return evts;
      function fn$(){
        return state.set(key, function(it){
          return $(it.target).val();
        }.apply(this, arguments));
      }
    };
    prototype.toggleOntologyTable = function(event){
      var getLeft, table, wasOpen, icon, this$ = this;
      getLeft = function(isOpen){
        var w;
        w = $('body').outerWidth();
        return w - 50 - (isOpen
          ? 0
          : this$.$('.ontology-table .section-container').outerWidth());
      };
      table = this.$('.ontology-table');
      wasOpen = !event || table.hasClass('open');
      table.toggleClass('open').animate({
        left: getLeft(wasOpen)
      });
      return icon = $('.slide-control i').removeClass('icon-chevron-right icon-chevron-left').addClass(wasOpen ? 'icon-chevron-left' : 'icon-chevron-right');
    };
    prototype.toggleDisplayOptions = function(){
      this.$('.graph-control .resizer').toggleClass('icon-resize-small icon-resize-full');
      return this.$('.graph-control .hidable').slideToggle();
    };
    prototype.loadData = function(){
      var monitor, building, this$ = this;
      monitor = dagify.progressMonitor(this.$('.dag .progress'));
      building = dagify.graphify(monitor, this.service.rows, this.model.get('query'));
      building.fail(this.reportError);
      building.done(function(graph){
        return this$.annotate(graph);
      });
      building.done(function(graph){
        return this$.model.set({
          all: graph
        });
      });
      return building.done(function(graph){
        return this$.model.set({
          roots: graph.getRoots()
        });
      });
    };
    prototype.annotate = function(graph){
      var this$ = this;
      dagify.annotateForCounts(this.service.query, graph.nodes);
      return dagify.doHeightAnnotation(graph.nodes).done(function(){
        this$.model.set({
          heights: graph.getHeights()
        });
        return this$.model.trigger('annotated:height');
      });
    };
    prototype.reportError = function(e){
      return alert("Error: " + e);
    };
    function OntologyWidget(){
      this.loadData = bind$(this, 'loadData', prototype);
      this.fillElisionSelector = bind$(this, 'fillElisionSelector', prototype);
      this.onRootChange = bind$(this, 'onRootChange', prototype);
      OntologyWidget.superclass.apply(this, arguments);
    }
    return OntologyWidget;
  }(Backbone.View));
  Widget = OntologyWidget;
  module.exports = OntologyWidget;
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
}).call(this);
