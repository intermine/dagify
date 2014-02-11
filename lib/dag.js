(function(){
  var dagreD3, d3, Backbone, UniqueCollection, keyCode, ref$, canReachAny, ancestorsOf, getRank, getRoot, union, difference, maximum, minimum, filter, max, pairsToObj, split, id, any, each, find, sortBy, last, join, map, isType, all, first, CanBeHidden, DAG, out$ = typeof exports != 'undefined' && exports || this;
  dagreD3 = require('dagre-d3');
  d3 = require('d3');
  Backbone = require('backbone');
  UniqueCollection = require('./unique-collection.ls').UniqueCollection;
  keyCode = require('./keycodes.ls').keyCode;
  ref$ = require('./graph-utils.ls'), canReachAny = ref$.canReachAny, ancestorsOf = ref$.ancestorsOf, getRank = ref$.getRank, getRoot = ref$.getRoot;
  ref$ = require('prelude-ls'), union = ref$.union, difference = ref$.difference, maximum = ref$.maximum, minimum = ref$.minimum, filter = ref$.filter, max = ref$.max, pairsToObj = ref$.pairsToObj, split = ref$.split, id = ref$.id, any = ref$.any, each = ref$.each, find = ref$.find, sortBy = ref$.sortBy, last = ref$.last, join = ref$.join, map = ref$.map, isType = ref$.isType, all = ref$.all, first = ref$.first;
  CanBeHidden = (function(superclass){
    var prototype = extend$((import$(CanBeHidden, superclass).displayName = 'CanBeHidden', CanBeHidden), superclass).prototype, constructor = CanBeHidden;
    prototype.defaults = {
      hidden: false,
      nonebelow: false,
      noneabove: false
    };
    prototype.toggle = function(prop){
      return this.set(prop, !this.get(prop));
    };
    function CanBeHidden(){
      CanBeHidden.superclass.apply(this, arguments);
    }
    return CanBeHidden;
  }(Backbone.Model));
  out$.DAG = DAG = (function(superclass){
    var within, addCentre, posInfo, zoomTo, contains, nodeIsHidden, prototype = extend$((import$(DAG, superclass).displayName = 'DAG', DAG), superclass).prototype, constructor = DAG;
    prototype.initialize = function(opts){
      var ref$, edgeProps, nodeKey, edgeKey;
      opts == null && (opts = {});
      this.rankScale = (ref$ = opts.rankScale) != null
        ? ref$
        : [1, 1];
      this.nodeLabels = (ref$ = opts.nodeLabels) != null
        ? ref$
        : ['name', 'value', 'label', 'class'];
      this.edgeLabels = (ref$ = opts.edgeLabels) != null
        ? ref$
        : ['name', 'value', 'label', 'class'];
      this.isClosable = (ref$ = opts != null ? opts.isClosable : void 8) != null
        ? ref$
        : function(node){
          return true;
        };
      this.onNodeClick = opts != null ? opts.onNodeClick : void 8;
      this.onEdgeClick = opts != null ? opts.onEdgeClick : void 8;
      this.getNodeClass = (ref$ = opts != null ? opts.getNodeClass : void 8) != null
        ? ref$
        : function(){
          return null;
        };
      this.getEdgeClass = (ref$ = opts != null ? opts.getEdgeClass : void 8) != null
        ? ref$
        : function(){
          return null;
        };
      this.getRoots = (ref$ = opts != null ? opts.getRoots : void 8) != null
        ? ref$
        : function(it){
          return it.sinks();
        };
      this.getEnds = (ref$ = opts.getEnds) != null
        ? ref$
        : function(edge){
          return map(bind$(this.nodeModels, 'keyFn'), this.edgeVec(id, edge));
        };
      edgeProps = (ref$ = opts != null ? opts.edgeProps : void 8) != null
        ? ref$
        : ['source', 'target'];
      this.edgeVec = curry$(function(f, edge){
        return map(function(){
          return f(bind$(edge, 'get').apply(this, arguments));
        }, edgeProps);
      });
      nodeKey = (ref$ = opts != null ? opts.nodeKey : void 8) != null
        ? ref$
        : function(it){
          return it.id;
        };
      edgeKey = (ref$ = opts != null ? opts.edgeKey : void 8) != null
        ? ref$
        : function(e){
          return join('-', map(function(){
            return nodeKey(function(it){
              return e[it];
            }.apply(this, arguments));
          }, edgeProps));
        };
      this.nodeModels = new UniqueCollection([], {
        keyFn: nodeKey
      });
      this.nodeModels.model = CanBeHidden;
      this.edgeModels = new UniqueCollection([], {
        keyFn: edgeKey
      });
      this.state = new Backbone.Model({
        zoom: 1,
        rankDir: 'BT',
        hiddenClasses: [],
        hiddenPaths: [],
        translate: [20, 20],
        duration: 0,
        rootFilter: curry$(function(g, x){
          return true;
        })
      });
      return this.setUpListeners();
    };
    prototype.setRootFilter = function(f){
      return this.state.set('rootFilter', curry$(function(g, nid){
        return f(g.node(nid).toJSON(), g);
      }));
    };
    within = function(target, searchSpace){
      return ~String(searchSpace).toLowerCase().indexOf(target);
    };
    addCentre = function(dims){
      dims.cx = dims.width / 2 + dims.left;
      dims.cy = dims.height / 2 + dims.top;
      return dims;
    };
    posInfo = function(){
      return addCentre(function(it){
        return it.getBoundingClientRect();
      }(first(first.apply(this, arguments))));
    };
    zoomTo = function(newZoom, arg$){
      var dx, dy, state, dz, ref$, x, y, scale, cx, cy, tx, ty, lx, ly, newTranslate;
      dx = arg$[0], dy = arg$[1];
      state = this.state;
      dz = this.zoom;
      ref$ = state.get('translate'), x = ref$[0], y = ref$[1];
      scale = state.get('zoom');
      ref$ = this.getElDims(), cx = ref$.cx, cy = ref$.cy;
      ref$ = [(cx - x + dx) / scale, (cy - y + dy) / scale], tx = ref$[0], ty = ref$[1];
      ref$ = [tx * newZoom + x, ty * newZoom + y], lx = ref$[0], ly = ref$[1];
      newTranslate = [x + cx - lx, y + cy - ly];
      dz.scale(newZoom);
      dz.translate(newTranslate);
      return d3.transition().duration(750).call(bind$(dz, 'event'));
    };
    prototype.zoomTo = function(nid){
      var elDims, bRect, dim, ref$, dx, dy;
      if (this.renderer == null) {
        return;
      }
      elDims = this.getElDims();
      bRect = posInfo(this.renderer.nodeRoots().filter((function(it){
        return it === nid;
      })));
      ref$ = (function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = ['cx', 'cy']).length; i$ < len$; ++i$) {
          dim = ref$[i$];
          results$.push(bRect[dim] - elDims[dim]);
        }
        return results$;
      }()), dx = ref$[0], dy = ref$[1];
      return zoomTo.call(this, 0.9, [dx - bRect.width, dy]);
    };
    prototype.setUpListeners = function(){
      var onGraphChange, shift, zoom, move, this$ = this;
      this.state.on('change:translate', function(s, currentTranslation){
        var ref$;
        if ((ref$ = this$.zoom) != null) {
          ref$.translate(currentTranslation);
        }
        return this$.g.attr('transform', "translate(" + currentTranslation + ") scale(" + s.get('zoom') + ")");
      });
      this.state.on('change:zoom', function(s, currentZoom){
        var ref$;
        if ((ref$ = this$.zoom) != null) {
          ref$.scale(currentZoom);
        }
        return this$.g.attr('transform', "translate(" + s.get('translate') + ") scale(" + currentZoom + ")");
      });
      this.state.on('change:rankDir', bind$(this, 'updateGraph'));
      this.state.on('change:alignAttrs change:hideAttrs change:hiddenClasses change:hiddenPaths', function(){
        this$.graph = null;
        this$.state.set('duration', 350);
        return this$.updateGraph();
      });
      this.state.on('change:filter', function(s, filterTerm){
        var nSel, eSel, label, normed, g, nF;
        nSel = this$.renderer.nodeRoots();
        eSel = this$.renderer.edgeRoots();
        label = this$.renderer.getNodeLabel();
        normed = String(filterTerm != null ? filterTerm : '').toLowerCase();
        g = this$.graph;
        nSel.classed('filtered', nF = (function(){
          switch (false) {
          case !(normed != null && normed.length):
            return function(nid){
              return filterTerm === nid || within(normed, label(g.node(nid)));
            };
          default:
            return function(){
              return false;
            };
          }
        }()));
        eSel.classed('filtered', function(eid){
          return any(nF, g.incidentNodes(eid));
        });
        if (filterTerm == null) {
          return this$.fitToBounds();
        }
      });
      onGraphChange = function(){
        this$.graph = null;
        return this$.state.set('duration', 350);
      };
      this.nodeModels.on('add reset', onGraphChange);
      this.edgeModels.on('add reset', onGraphChange);
      this.nodeModels.on('change:nonebelow change:hidden change:noneabove', function(m, v, arg$){
        var batch;
        batch = (arg$ != null
          ? arg$
          : {}).batch;
        if (batch) {
          return;
        }
        this$.graph = null;
        this$.state.set('duration', 350);
        return this$.updateGraph();
      });
      this.on('redraw', function(){
        this$.graph = null;
        return this$.updateGraph();
      });
      shift = curry$((function(dx, dy, event){
        var ref$, x, y;
        ref$ = this$.state.get('translate'), x = ref$[0], y = ref$[1];
        return this$.state.set({
          translate: [x + dx, y + dy]
        });
      }), true);
      zoom = curry$((function(factor, event){
        var scale;
        scale = this$.state.get('zoom');
        return zoomTo.call(this$, scale + factor, [0, 0]);
      }), true);
      move = pairsToObj([[keyCode.UP, shift(0, 100)], [keyCode.DOWN, shift(0, -100)], [keyCode.LEFT, shift(100, 0)], [keyCode.RIGHT, shift(-100, 0)], [keyCode.MINUS, zoom(-0.2)], [keyCode.PLUS, zoom(0.2)], [keyCode.HOME, bind$(this, 'fitToBounds')]]);
      return $(window).on('keyup', function(e){
        var key$;
        if (!$(e.target).is('input')) {
          return typeof move[key$ = e.keyCode] === 'function' ? move[key$]() : void 8;
        }
      });
    };
    prototype.getElDims = function(){
      var padding, x$, elDims, name;
      padding = 20;
      x$ = elDims = pairsToObj((function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = ['height', 'width']).length; i$ < len$; ++i$) {
          name = ref$[i$];
          results$.push([name, this.$el[name]() - padding * 2]);
        }
        return results$;
      }.call(this)));
      x$.top = padding;
      x$.bottom = x$.height + padding;
      x$.left = padding;
      x$.cx = x$.width / 2 + x$.left;
      x$.cy = x$.height / 2 + x$.top;
      x$.right = x$.width + padding;
      return x$;
    };
    prototype.getNodeDims = function(){
      return posInfo(this.g);
    };
    contains = function(outer, inner){
      return inner.left >= outer.left && inner.right <= outer.right && inner.top >= outer.top && inner.bottom <= outer.bottom;
    };
    prototype.fitToBounds = function(recurrance){
      var nodeBounds, elDims, ref$, zoom, ref1$, x, y, prop, dw, dh, ratio, newZoom, newX, newY, size, offset, nx, ny, dx, dy, newTranslation, this$ = this;
      recurrance == null && (recurrance = 0);
      nodeBounds = this.getNodeDims();
      elDims = this.getElDims();
      if (recurrance && contains(elDims, nodeBounds) || recurrance > 10) {
        return;
      }
      ref$ = this.state.toJSON(), zoom = ref$.zoom, ref1$ = ref$.translate, x = ref1$[0], y = ref1$[1];
      ref$ = (function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = ['width', 'height']).length; i$ < len$; ++i$) {
          prop = ref$[i$];
          results$.push(nodeBounds[prop] - elDims[prop]);
        }
        return results$;
      }()), dw = ref$[0], dh = ref$[1];
      ratio = (function(){
        switch (false) {
        case !(dw > dh):
          return elDims.width / nodeBounds.width;
        default:
          return elDims.height / nodeBounds.height;
        }
      }());
      newZoom = zoom * ratio;
      newX = x * newZoom;
      newY = y * newZoom;
      this.zoom.scale(newZoom).translate([newX, newY]).event(this.g);
      nodeBounds = this.getNodeDims();
      ref$ = (function(){
        var i$, ref$, len$, ref1$, results$ = [];
        for (i$ = 0, len$ = (ref$ = [['width', 'left'], ['height', 'top']]).length; i$ < len$; ++i$) {
          ref1$ = ref$[i$], size = ref1$[0], offset = ref1$[1];
          results$.push(nodeBounds[size] / 2 + nodeBounds[offset]);
        }
        return results$;
      }()), nx = ref$[0], ny = ref$[1];
      dx = elDims.cx - nx;
      dy = elDims.cy - ny;
      newTranslation = [newX + dx, newY + dy];
      this.zoom.translate(newTranslation).event(this.g);
      return setTimeout(function(){
        return this$.fitToBounds(recurrance + 1);
      }, 10);
    };
    prototype.setGraph = function(arg$){
      var nodes, edges;
      nodes = arg$.nodes, edges = arg$.edges;
      this.nodeModels.reset(nodes);
      this.edgeModels.reset(edges);
      this.state.set('duration', 700);
      return this.updateGraph();
    };
    prototype.addNode = function(node){
      return this.nodeModels.add(node);
    };
    prototype.addEdge = function(edge){
      return this.edgeModels.add(edge);
    };
    prototype.setLayout = function(layout){
      return this.state.set('rankDir', layout);
    };
    prototype.toString = function(){
      return "[views/dag/DAG " + this.cid + "]";
    };
    prototype.descale = function(){
      return 1 / this.state.get('zoom');
    };
    prototype.markerEnd = function(){
      if (this.state.get('direction' === 'LR')) {
        return 'url(#Triangle)';
      } else {
        return 'url(#TriangleDown)';
      }
    };
    nodeIsHidden = curry$(function(arg$, blackList, nm){
      var hideAttrs, hiddenClasses, hiddenPaths, node, cls, pth, nt;
      hideAttrs = arg$.hideAttrs, hiddenClasses = arg$.hiddenClasses, hiddenPaths = arg$.hiddenPaths;
      node = nm.toJSON();
      cls = node['class'];
      pth = node.path;
      nt = node.nodeType;
      return node.hidden || in$(nm, blackList) || (hideAttrs && nt === 'attr') || in$(cls, hiddenClasses) || any(bind$(pth, 'match'), hiddenPaths);
    });
    prototype.getGraph = function(){
      var start, self, ref$, hiddenClasses, hiddenPaths, g, roots, unwantedKids, res$, i$, len$, n, unwantedParents, j$, ref1$, len1$, p, protectedParents, unwanted, blackList, isHidden, alignAttrs, this$ = this;
      if (this.graph != null) {
        return this.graph;
      }
      start = new Date().getTime();
      self = this;
      ref$ = this.state.toJSON(), hiddenClasses = ref$.hiddenClasses, hiddenPaths = ref$.hiddenPaths;
      g = new dagreD3.Digraph;
      this.nodeModels.each(function(node){
        this$.trigger('add:class', node.get('class'));
        if (node.has('path')) {
          this$.trigger('add:path', {
            path: node.get('path')
          });
        }
        return g.addNode(this$.nodeModels.keyFor(node), node);
      });
      this.edgeModels.each(function(edge){
        var ref$, source, target;
        ref$ = this$.getEnds(edge), source = ref$[0], target = ref$[1];
        return g.addEdge(this$.edgeModels.keyFor(edge), source, target, edge);
      });
      this.trigger('whole:graph', g);
      roots = filter(this.state.get('rootFilter')(g), this.getRoots(g));
      g = g.filterNodes(canReachAny(g, roots));
      res$ = [];
      for (i$ = 0, len$ = (ref$ = g.nodes()).length; i$ < len$; ++i$) {
        n = ref$[i$];
        if (g.outEdges(n).length && all(fn$, g.successors(n))) {
          res$.push(n);
        }
      }
      unwantedKids = res$;
      res$ = [];
      for (i$ = 0, len$ = (ref$ = g.nodes()).length; i$ < len$; ++i$) {
        n = ref$[i$];
        if (g.node(n).get('noneabove')) {
          for (j$ = 0, len1$ = (ref1$ = [n].concat(ancestorsOf(g, n))).length; j$ < len1$; ++j$) {
            p = ref1$[j$];
            if (g.outEdges(p).length) {
              res$.push(p);
            }
          }
        }
      }
      unwantedParents = res$;
      protectedParents = unwantedParents.length === 0
        ? []
        : (function(){
          var i$, ref$, len$, j$, ref1$, len1$, results$ = [];
          for (i$ = 0, len$ = (ref$ = g.nodes()).length; i$ < len$; ++i$) {
            n = ref$[i$];
            if (g.node(n).get('direct') && !g.node(n).get('noneabove')) {
              for (j$ = 0, len1$ = (ref1$ = [n].concat(ancestorsOf(g, n))).length; j$ < len1$; ++j$) {
                p = ref1$[j$];
                results$.push(p);
              }
            }
          }
          return results$;
        }());
      unwanted = union(unwantedKids, unwantedParents);
      blackList = map(bind$(g, 'node'), difference(unwanted, protectedParents));
      isHidden = nodeIsHidden(this.state.toJSON(), blackList);
      if (this.nodeFilter != null) {
        g = g.filterNodes(function(nid){
          return this$.nodeFilter(g.node(nid).toJSON(), nid, g);
        });
      }
      g = g.filterNodes(function(nid){
        return !isHidden(g.node(nid));
      });
      g = g.filterNodes(canReachAny(g, roots));
      alignAttrs = this.state.get('alignAttrs');
      g.eachNode(function(nid, nm){
        var ref$;
        if (in$(nid, roots)) {
          return nm.rank = 'max';
        } else if (alignAttrs && 'attr' === nm.get('nodeType')) {
          return nm.rank = 'min';
        } else {
          return ref$ = nm.rank, delete nm.rank, ref$;
        }
      });
      console.debug("Graph construction took " + (new Date().getTime() - start) / 1e4 + " secs");
      console.debug("Order: " + g.order() + ", size: " + g.size());
      return this.graph = g;
      function fn$(it){
        return g.node(it).get('nonebelow');
      }
    };
    prototype.getRenderer = function(){
      var layout, graph, nodeLabels, edgeLabels, labeler, x$, superDrawEdge, superDrawNode, this$ = this;
      layout = dagreD3.layout().rankDir(this.state.get('rankDir'));
      graph = this.getGraph();
      nodeLabels = this.nodeLabels;
      edgeLabels = this.edgeLabels;
      labeler = curry$(function(labels, model){
        var ref$;
        return (ref$ = model.get(find(bind$(model, 'has'), labels))) != null ? ref$ : '';
      });
      x$ = this.renderer = new dagreD3.Renderer;
      x$.getNodeLabel(labeler(nodeLabels));
      x$.getEdgeLabel(labeler(edgeLabels));
      x$.nodeJoinKey(function(d){
        return d;
      });
      x$.edgeJoinKey(function(d){
        return d;
      });
      x$.layout(layout);
      x$.graph(graph);
      superDrawEdge = this.renderer.drawEdge();
      this.renderer.drawEdge(function(g, eid, sel){
        var edgeClass;
        superDrawEdge.apply(null, arguments);
        edgeClass = this$.getEdgeClass(this$.graph.edge(eid));
        if (edgeClass != null) {
          sel.classed(edgeClass, true);
        }
        sel.selectAll('path').on('click', function(){
          return this$.trigger('click:edge', this$.graph, eid, sel);
        });
        sel.selectAll('.edge-label').on('click', function(){
          return this$.trigger('click:edge', this$.graph, eid, sel);
        });
        if (this$.onEdgeClick != null) {
          sel.selectAll('path').on('click', function(){
            return this$.onEdgeClick(this$.graph, eid, sel);
          });
          return sel.selectAll('.edge-label').on('click', function(){
            return this$.onEdgeClick(this$.graph, eid, sel);
          });
        }
      });
      superDrawNode = this.renderer.drawNode();
      this.renderer.drawNode(function(g, nid, svgNode){
        var labeler, node, rank, title, nc;
        superDrawNode(g, nid, svgNode);
        labeler = this$.renderer.getNodeLabel();
        node = this$.graph.node(nid);
        svgNode.classed('nonebelow', node.get('nonebelow'));
        rank = getRank(g, nid);
        svgNode.selectAll('.label-bkg').attr('opacity', this$.opacityScale(rank));
        svgNode.classed("rank-" + rank, true);
        title = labeler(node);
        svgNode.selectAll('title').data([title]).enter().append('title').text(function(d){
          return d;
        });
        svgNode.on('click', function(){
          return this$.trigger('click:node', nid, node, svgNode);
        });
        nc = this$.getNodeClass(node);
        if (nc != null) {
          return svgNode.classed(nc, true);
        }
      });
      this.on('click:node', function(nid, node, svgNode){
        if (this$.onNodeClick != null) {
          return this$.onNodeClick(nid, node, svgNode);
        } else if (this$.isClosable(node)) {
          node.set({
            nonebelow: !node.get('nonebelow')
          });
          return svgNode.classed('nonebelow', node.get('nonebelow'));
        }
      });
      return this.renderer;
    };
    prototype.render = function(){
      var this$ = this;
      this.$el.append("<svg>\n    <filter id=\"dropshadow\" height=\"130%\">\n        <feGaussianBlur in=\"SourceAlpha\" stdDeviation=\"3\"/> <!-- stdDeviation is how much to blur -->\n        <feOffset dx=\"2\" dy=\"2\" result=\"offsetblur\"/> <!-- how much to offset -->\n        <feMerge> \n            <feMergeNode/> <!-- this contains the offset blurred image -->\n            <feMergeNode in=\"SourceGraphic\"/> <!-- this contains the element that the filter is applied to -->\n        </feMerge>\n    </filter>\n    <!-- a transparent grey glow with no offset -->\n    <filter id=\"glow\">\n        <!-- Returns a green colour -->\n        <feColorMatrix type=\"matrix\" values=\n                    \"0 0 0 0 0\n                     1 1 1 1 0\n                     0 0 0 0 0\n                     0 0 0 1 0\"/>\n        <feGaussianBlur stdDeviation=\"5\" result=\"coloredBlur\"/>\n        <feMerge>\n            <feMergeNode in=\"coloredBlur\"/>\n            <feMergeNode in=\"SourceGraphic\"/>\n        </feMerge>\n    </filter>\n    <g transform=\"translate(20,20)\"/>\n</svg>");
      this.svg = d3.select('svg');
      this.g = d3.select('svg g');
      this.zoom = d3.behavior.zoom().scale(this.state.get('zoom')).translate(this.state.get('translate')).on('zoom', function(){
        return this$.state.set({
          zoom: d3.event.scale,
          translate: d3.event.translate.slice()
        });
      });
      this.svg.call(this.zoom);
      this.getRenderer().run(this.g);
      return this;
    };
    prototype.updateGraph = function(){
      var duration, layout, graph, maxRank, start, x$;
      if (this.renderer == null) {
        return;
      }
      duration = this.state.get('duration');
      layout = dagreD3.layout().rankDir(this.state.get('rankDir'));
      graph = this.getGraph();
      maxRank = maximum(map(getRank(graph), graph.nodes()));
      this.opacityScale = !maxRank
        ? id
        : d3.scale.linear().domain([maxRank, 0]).range(this.rankScale).interpolate(d3.interpolateNumber);
      start = new Date().getTime();
      x$ = this.renderer.graph(graph);
      x$.layout(layout);
      x$.transition(function(){
        return function(it){
          return it.duration(duration);
        }(function(it){
          return it.transition();
        }.apply(this, arguments));
      });
      x$.update();
      console.debug("Update took " + (new Date().getTime() - start) / 1000 + " seconds");
      if (graph.size()) {
        return setTimeout(bind$(this, 'fitToBounds'), duration + 1);
      }
    };
    function DAG(){
      DAG.superclass.apply(this, arguments);
    }
    return DAG;
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
