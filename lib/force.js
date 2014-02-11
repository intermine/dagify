(function(){
  var ref$, linkStroke, termColor, drawRootLabels, termPalette, relationshipPalette, colourFilter, linkFill, mvTowards, drawSourceLegend, drawRelationshipLegend, centreAndZoom, markSubtree, relationshipTest, minimum, maximum, max, min, even, mean, reject, unique, join, abs, sqrt, cos, sin, Obj, sum, any, sortBy, map, fold, filter, each, ln, isRoot, toRadians, getR, half, countBy, linkOpacity, minTicks, cartesianDistance, gravitateTowards, antiGrav, stratify, centrify, unfix, linkSpline, drawCurve, drawPauseBtn, linkDistance, getCharge, renderForce;
  ref$ = require('./svg'), linkStroke = ref$.linkStroke, termColor = ref$.termColor, drawRootLabels = ref$.drawRootLabels, termPalette = ref$.termPalette, relationshipPalette = ref$.relationshipPalette, colourFilter = ref$.colourFilter, linkFill = ref$.linkFill, mvTowards = ref$.mvTowards, drawSourceLegend = ref$.drawSourceLegend, drawRelationshipLegend = ref$.drawRelationshipLegend, drawRootLabels = ref$.drawRootLabels, centreAndZoom = ref$.centreAndZoom;
  ref$ = require('./util'), markSubtree = ref$.markSubtree, relationshipTest = ref$.relationshipTest;
  ref$ = require('prelude-ls'), minimum = ref$.minimum, maximum = ref$.maximum, max = ref$.max, min = ref$.min, even = ref$.even, mean = ref$.mean, reject = ref$.reject, unique = ref$.unique, join = ref$.join, abs = ref$.abs, sqrt = ref$.sqrt, cos = ref$.cos, sin = ref$.sin, Obj = ref$.Obj, sum = ref$.sum, any = ref$.any, sortBy = ref$.sortBy, map = ref$.map, fold = ref$.fold, filter = ref$.filter, each = ref$.each, ln = ref$.ln;
  isRoot = function(it){
    return it.isRoot;
  };
  toRadians = (function(it){
    return it * Math.PI / 180;
  });
  getR = function(it){
    return it.radius();
  };
  half = (function(it){
    return it / 2;
  });
  countBy = curry$(function(f, xs){
    return fold(function(sum, x){
      return sum + (f(x) ? 1 : 0);
    }, 0, xs);
  });
  linkOpacity = {
    normal: 0.6,
    muted: 0.3,
    focus: 0.8,
    unfocus: 0.2
  };
  minTicks = 20;
  cartesianDistance = (function(f){
    return function(a, b){
      return f([a.x - b.x, a.y - b.y]);
    };
  }.call(this, function(){
    return sqrt(sum(map((function(it){
      return Math.pow(it, 2);
    })).apply(this, arguments)));
  }));
  gravitateTowards = function(target, node){
    var x, y, speed;
    x = target.x, y = target.y;
    speed = min(1, 1 / cartesianDistance(target, node));
    return mvTowards(speed, {
      x: x,
      y: y
    }, node);
  };
  antiGrav = curry$(function(target, node){
    var x, y, speed;
    x = target.x, y = target.y;
    speed = half(min(1, 1 / cartesianDistance(target, node)));
    return mvTowards(0 - speed, {
      x: x,
      y: y
    }, node);
  });
  stratify = function(state){
    var ref$, dimensions, graph, zoom, currentFontSize, roots, leaves, surface, widthRange, corners, quantile, i$, len$, n;
    ref$ = state.toJSON(), dimensions = ref$.dimensions, graph = ref$.graph, zoom = ref$.zoom;
    currentFontSize = Math.min(40, 20 / zoom);
    roots = sortBy(function(it){
      return it.x;
    }, filter(isRoot, graph.nodes));
    each(function(){
      return bind$(console, 'log')(function(it){
        return it.x;
      }.apply(this, arguments));
    }, roots);
    leaves = sortBy(function(it){
      return it.x;
    }, filter(function(it){
      return it.isDirect && it.isLeaf;
    }, graph.nodes));
    surface = minimum([0].concat(map(function(it){
      return it.y;
    }, graph.nodes)));
    widthRange = d3.scale.linear().range([0.1 * dimensions.w, 0.9 * dimensions.w]).domain([0, leaves.length - 1]);
    corners = d3.scale.quantile().domain([0, dimensions.w]).range([0, dimensions.w]);
    quantile = (function(){
      switch (false) {
      case !!roots.length:
        return function(){
          return dimensions.w / 2;
        };
      default:
        return d3.scale.quantile().domain([0, dimensions.w]).range((function(){
          var i$, to$, results$ = [];
          for (i$ = 0, to$ = roots.length; i$ < to$; ++i$) {
            results$.push(i$);
          }
          return results$;
        }()));
      }
    }());
    roots.forEach(function(root, i){
      root.fixed = false;
      return gravitateTowards({
        y: surface - getR(root),
        x: root.x
      }, root);
    });
    for (i$ = 0, len$ = (ref$ = graph.nodes).length; i$ < len$; ++i$) {
      n = ref$[i$];
      if (!n.isRoot && n.y + getR(n) < surface) {
        gravitateTowards({
          x: n.root.x,
          y: dimensions.h
        }, n);
      }
    }
    return leaves.forEach(function(n, i){
      var speed;
      speed = n.y < dimensions.h / 2 ? 0.05 : 0.005;
      if (n.y < dimensions.h * 0.9) {
        gravitateTowards({
          x: widthRange(i),
          y: dimensions.h * 0.9
        }, n);
      }
      if (n.y >= dimensions.h * 0.88) {
        return n.y = dimensions.h * 0.9 + currentFontSize * 1.1 * i;
      }
    });
  };
  centrify = function(state){
    var ref$, graph, ref1$, w, h, roots, meanD, centre;
    ref$ = state.toJSON(), graph = ref$.graph, ref1$ = ref$.dimensions, w = ref1$.w, h = ref1$.h;
    roots = sortBy(function(it){
      return it.y;
    }, filter(isRoot, graph.nodes));
    meanD = mean(map(function(){
      return (function(it){
        return it * 2;
      })(getR.apply(this, arguments));
    }, roots));
    if (roots.length === 1) {
      ref$ = roots[0];
      ref$.x = half(w);
      ref$.y = half(h);
      ref$.fixed = true;
    } else {
      roots.forEach(function(n, i){
        var goal;
        goal = {
          x: half(w),
          y: half(h) - meanD * roots.length / 2 + meanD * i
        };
        gravitateTowards(goal, n);
      });
    }
    centre = {
      x: half(w),
      y: half(h)
    };
    return each(antiGrav(centre), filter(function(it){
      return it.isLeaf;
    }, graph.nodes));
  };
  unfix = function(state){
    each((function(it){
      return it.fixed = false, it;
    }))(
    filter(isRoot)(
    function(it){
      return it.nodes;
    }(
    state.get('graph'))));
  };
  linkSpline = curry$(function(offsetScale, args){
    var source, target, lineLength, endPoint, radiusS, cos90, sin90, meanX, meanY, offset, mp1X, mp1Y, mp2X, mp2Y;
    source = args[0], target = args[1], lineLength = args[2], endPoint = args[3], radiusS = args[4], cos90 = args[5], sin90 = args[6];
    meanX = mean(map(function(it){
      return it.x;
    }, [source, target]));
    meanY = mean(map(function(it){
      return it.y;
    }, [source, target]));
    offset = offsetScale * lineLength - radiusS / 4;
    mp1X = meanX + offset * cos90;
    mp1Y = meanY + offset * sin90;
    mp2X = meanX + offset * cos90;
    mp2Y = meanY + offset * sin90;
    return [[source.x - radiusS * 0.9 * cos90, source.y - radiusS * 0.9 * sin90], [mp2X, mp2Y], endPoint, endPoint, [mp1X, mp1Y], [source.x + radiusS * 0.9 * cos90, source.y + radiusS * 0.9 * sin90]];
  });
  drawCurve = (function(line){
    return function(arg$){
      var target, source, cos, sin, sqrt, atan2, pow, PI, slope, ref$, sinS, cosS, slopePlus90, sin90, cos90, radiusT, radiusS, lineLength, endPoint, args;
      target = arg$.target, source = arg$.source;
      cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2, pow = Math.pow, PI = Math.PI;
      slope = atan2(target.y - source.y, target.x - source.x);
      ref$ = map(function(it){
        return it(slope);
      }, [sin, cos]), sinS = ref$[0], cosS = ref$[1];
      slopePlus90 = PI / 2 + slope;
      ref$ = map(function(it){
        return it(slopePlus90);
      }, [sin, cos]), sin90 = ref$[0], cos90 = ref$[1];
      ref$ = map(getR, [target, source]), radiusT = ref$[0], radiusS = ref$[1];
      lineLength = sqrt(pow(target.x - source.x, 2) + pow(target.y - source.y, 2));
      endPoint = [target.x - radiusT * 0.9 * cosS, target.y - radiusT * 0.9 * sinS];
      args = [source, target, lineLength, endPoint, radiusS, cos90, sin90];
      return (function(it){
        return it + 'Z';
      })(
      line(
      linkSpline(0.1)(
      args)));
    };
  }.call(this, d3.svg.line().interpolate('basis')));
  drawPauseBtn = curry$(function(dimensions, state, svg){
    var ref$, cx, cy, radius, x, y, btn, drawPauseBars, symbolLine, drawPlaySymbol;
    ref$ = map((function(it){
      return it * 0.9;
    }), [dimensions.w, dimensions.h]), cx = ref$[0], cy = ref$[1];
    radius = 0.075 * dimensions.h;
    ref$ = map((function(it){
      return it - radius;
    }), [cx, cy]), x = ref$[0], y = ref$[1];
    svg.selectAll('g.btn').remove();
    btn = svg.append('g').attr('class', 'btn').attr('x', x).attr('y', y);
    btn.append('circle').attr('r', radius).attr('cx', cx).attr('cy', cy).attr('stroke', 'black').attr('stroke-width', 5).attr('fill', '#ccc').attr('opacity', 0.2);
    drawPauseBars = function(){
      var pauseBar, i$, ref$, len$, f, results$ = [];
      btn.selectAll('path.play-symbol').remove();
      pauseBar = {
        width: 0.025 * dimensions.h,
        height: 0.08 * dimensions.h
      };
      for (i$ = 0, len$ = (ref$ = [-1.2, 0.2]).length; i$ < len$; ++i$) {
        f = ref$[i$];
        results$.push(btn.append('rect').attr('class', 'pause-bar').attr('width', pauseBar.width).attr('x', cx + f * pauseBar.width).attr('height', pauseBar.height).attr('y', cy - pauseBar.height / 2).attr('fill', '#555').attr('opacity', 0.2));
      }
      return results$;
    };
    symbolLine = d3.svg.line().x(function(arg$){
      var r, a;
      r = arg$[0], a = arg$[1];
      return cx + r * cos(a);
    }).y(function(arg$){
      var r, a;
      r = arg$[0], a = arg$[1];
      return cy + r * sin(a);
    }).interpolate('linear');
    drawPlaySymbol = function(){
      var innerR, points, res$, i$, ref$, len$, angle;
      btn.selectAll('.pause-bar').remove();
      innerR = 0.75 * radius;
      res$ = [];
      for (i$ = 0, len$ = (ref$ = [0, 120, 240]).length; i$ < len$; ++i$) {
        angle = ref$[i$];
        res$.push([innerR, toRadians(angle)]);
      }
      points = res$;
      return btn.append('path').attr('class', 'play-symbol').attr('fill', '#555').attr('opacity', 0.2).attr('d', (function(it){
        return it + 'Z';
      })(symbolLine(points)));
    };
    drawPlaySymbol();
    state.on('change:animating', function(s, currently){
      switch (currently) {
      case 'paused':
        return drawPlaySymbol();
      case 'running':
        return drawPauseBars();
      }
    });
    return btn.on('click', function(){
      switch (state.get('animating')) {
      case 'paused':
        return state.set({
          animating: 'running'
        });
      case 'running':
        return state.set({
          animating: 'paused'
        });
      }
    });
  });
  linkDistance = function(arg$){
    var source, target, ns, edges, markedBump, mutedPenalty, radii;
    source = arg$.source, target = arg$.target;
    ns = [source, target];
    edges = sum(map(function(it){
      var ref$;
      return ((ref$ = it.edges) != null ? ref$.length : void 8) || 0;
    }, ns));
    markedBump = 50 * countBy(function(it){
      return it.marked;
    }, ns);
    mutedPenalty = any(function(it){
      return it.muted;
    }, ns) ? 100 : 0;
    radii = sum(map(getR, ns));
    return 3 * edges + radii + 50 + markedBump - mutedPenalty;
  };
  getCharge = function(d){
    var radius, rootBump, edgeBump, markedBump, k;
    radius = getR(d);
    rootBump = isRoot(d) ? 150 : 0;
    edgeBump = 10 * d.edges.length;
    markedBump = d.marked ? 2 : 1;
    k = 250;
    return 1 - (k + radius + rootBump + edgeBump) * markedBump;
  };
  renderForce = function(state, graph){
    var dimensions, force, svg, throbber, getLabelFontSize, zoom, relationships, svgGroup, link, getLabelId, node, nG, texts, tickCount, _isReady;
    if (graph.edges.length > 250 && !state.has('elision')) {
      return state.set({
        elision: 2
      });
    }
    dimensions = state.get('dimensions');
    force = d3.layout.force().size([dimensions.w, dimensions.h]).charge(getCharge).gravity(0.04).linkStrength(0.8).linkDistance(linkDistance);
    state.on('change:spline', function(){
      return state.set({
        animating: 'running'
      });
    });
    state.on('change:jiggle', function(){
      return state.set({
        animating: 'running'
      });
    });
    state.on('graph:reset', updateMarked);
    state.on('change:animating', function(){
      var currently;
      currently = state.get('animating');
      switch (currently) {
      case 'running':
        force.resume();
        break;
      case 'paused':
        force.stop();
      }
    });
    svg = d3.select(state.get('svg'));
    svg.selectAll('g').remove();
    throbber = svg.append('use').attr('x', dimensions.w / 2 - 150).attr('y', dimensions.h / 2 - 150).attr('xlink:href', '#throbber');
    state.on('change:translate', function(s, currentTranslation){
      svgGroup.attr('transform', "translate(" + currentTranslation + ") scale(" + s.get('zoom') + ")");
      return force.tick();
    });
    state.on('change:zoom', function(s, currentZoom){
      svgGroup.attr('transform', "translate(" + s.get('translate') + ") scale(" + currentZoom + ")");
      return force.tick();
    });
    getLabelFontSize = function(){
      return Math.min(40, 20 / state.get('zoom'));
    };
    zoom = d3.behavior.zoom().scale(state.get('zoom')).on('zoom', function(){
      return state.set({
        zoom: d3.event.scale,
        translate: d3.event.translate.slice()
      });
    });
    svg.call(zoom);
    relationships = state.get('relationships');
    svg.attr('width', dimensions.w).attr('height', dimensions.h).call(drawPauseBtn(dimensions, state)).call(drawRootLabels(graph, dimensions));
    svgGroup = svg.append('g').attr('class', 'ontology').attr('transform', 'translate(5, 5)');
    force.nodes(graph.nodes).links(graph.edges).on('tick', tick).on('end', function(){
      state.set('animating', 'paused');
      return tick();
    });
    link = svgGroup.selectAll('.force-link').data(graph.edges);
    link.enter().append(state.has('spline') ? 'path' : 'line').attr('class', 'force-link').attr('stroke-width', '1px').attr('stroke', linkStroke).attr('fill', linkFill).append('title', function(e){
      return e.source.label + " " + e.label + " " + e.target.label;
    });
    link.exit().remove();
    getLabelId = function(){
      return (function(it){
        return 'label-' + it;
      })(function(it){
        return it.replace(/:/g, '-');
      }(function(it){
        return it.id;
      }.apply(this, arguments)));
    };
    node = svgGroup.selectAll('.force-node').data(graph.nodes);
    nG = node.enter().append('g').attr('class', 'force-node').call(force.drag).on('click', drawPathToRoot);
    node.exit().remove();
    nG.append('circle').attr('class', function(arg$){
      var sources;
      sources = arg$.sources;
      return join(' ', ['force-term'].concat(sources));
    }).classed('root', isRoot).classed('direct', function(it){
      return it.isDirect;
    }).attr('fill', termColor).attr('cx', -dimensions.w).attr('cy', -dimensions.h).attr('r', getR);
    nG.append('text').attr('class', 'count-label').attr('fill', 'white').attr('text-anchor', 'middle').attr('display', 'none').attr('x', -dimensions.w).attr('y', -dimensions.h).attr('dy', '0.3em');
    texts = svgGroup.selectAll('text.force-label').data(graph.nodes);
    texts.enter().append('text').attr('class', 'force-label').attr('text-anchor', 'start').attr('fill', '#555').attr('stroke', 'white').attr('stroke-width', '0.1px').attr('text-rendering', 'optimizeLegibility').attr('display', function(it){
      if (it.isDirect) {
        return 'block';
      } else {
        return 'none';
      }
    }).attr('id', getLabelId).attr('x', -dimensions.w).attr('y', -dimensions.h).text(function(it){
      return it.label;
    }).on('click', drawPathToRoot);
    nG.append('title').text(function(it){
      return it.label;
    });
    svg.call(drawRelationshipLegend(state, relationshipPalette)).call(drawSourceLegend(state, termPalette));
    tickCount = 0;
    state.set('animating', 'running');
    force.start();
    state.on('relationship:highlight', function(rel){
      var test, colFilt;
      test = relationshipTest(rel, false);
      colFilt = colourFilter(test);
      link.transition().duration(50).attr('fill', function(d){
        return colFilt(d)(
        linkFill(d));
      }).attr('opacity', function(it){
        if (!rel || test(it)) {
          return linkOpacity.normal;
        } else {
          return linkOpacity.unfocus;
        }
      });
      return link.classed('highlit', test);
    });
    state.on('term:highlight', function(term){
      force.stop();
      nG.selectAll('circle.force-term').filter(function(it){
        return it.marked;
      }).transition().duration(50).attr('opacity', function(it){
        if (!term || it === term) {
          return 1;
        } else {
          return 0.5;
        }
      });
      return link.filter(function(){
        return function(it){
          return it.marked;
        }(function(it){
          return it.source;
        }.apply(this, arguments));
      }).transition().duration(50).attr('opacity', function(it){
        if (!term || it.source === term) {
          return linkOpacity.focus;
        } else {
          return linkOpacity.unfocus;
        }
      });
    });
    state.once('force:ready', function(){
      return centreAndZoom(function(it){
        return it.x;
      }, function(it){
        return it.y;
      }, state, graph.nodes, zoom);
    });
    _isReady = false;
    function isReady(){
      var ref$, animating, tickK, edges;
      if (_isReady) {
        return true;
      }
      ref$ = state.toJSON(), animating = ref$.animating, tickK = ref$.tickK, edges = ref$.graph.edges;
      _isReady = animating === 'paused' || tickCount > tickK * ln(edges.length);
      if (_isReady) {
        state.trigger('force:ready');
      }
      return _isReady;
    }
    function drawPathToRoot(d, i){
      var queue, moar, count, max, n;
      state.set('animating', 'running');
      if (isRoot(d)) {
        toggleSubtree(d);
      } else {
        queue = [d];
        moar = function(it){
          return unique(
          reject(function(it){
            return it.marked;
          })(
          map(function(it){
            return it.target;
          })(
          it.edges)));
        };
        count = 0;
        max = state.get('maxmarked');
        while (count++ < max && (n = queue.shift())) {
          n.marked = true;
          each(bind$(queue, 'push'), moar(n));
        }
      }
      return updateMarked();
    }
    function toggleSubtree(root){
      return markSubtree(root, 'muted', !root.muted);
    }
    function updateMarked(){
      var currentAnimation;
      state.trigger('nodes:marked');
      currentAnimation = state.get('animating');
      state.set('animating', 'running');
      force.start();
      return setTimeout(function(){
        return state.set('animating', currentAnimation);
      }, 150);
    }
    function tick(){
      var jiggle, currentFontSize, fontPlusPad, meanX, getHalf, texts, displayedTexts, circles;
      tickCount++;
      jiggle = (function(){
        switch (state.get('jiggle')) {
        case 'strata':
          return stratify;
        case 'centre':
          return centrify;
        default:
          return unfix;
        }
      }());
      if (jiggle) {
        jiggle(state);
      }
      if (!isReady()) {
        return;
      }
      if (throbber != null) {
        throbber.remove();
      }
      currentFontSize = getLabelFontSize();
      fontPlusPad = currentFontSize * 1.1;
      meanX = mean(map(function(it){
        return it.x;
      }, graph.nodes));
      getHalf = d3.scale.quantile().domain([0, dimensions.w]).range(['left', 'right']);
      texts = svgGroup.selectAll('text.force-label');
      displayedTexts = texts.filter(function(){
        return 'block' === d3.select(this).attr('display');
      });
      displayedTexts.each(function(d1, i){
        var ys, thisHalf, op;
        ys = [];
        thisHalf = getHalf(d1.x);
        displayedTexts.each(function(d2){
          if (d2 !== d2 && getHalf(d2.x === thisHalf) && abs(d1.y - d2.y) < fontPlusPad) {
            return ys.push(d2.y);
          }
        });
        if (ys.length) {
          op = d1.y > mean(ys)
            ? curry$(function(x$, y$){
              return x$ + y$;
            })
            : curry$(function(x$, y$){
              return x$ - y$;
            });
          return d1.y = op(d1.y, fontPlusPad);
        }
      });
      texts.attr('x', function(it){
        return it.x;
      }).attr('text-anchor', function(it){
        if (it.x < meanX) {
          return 'end';
        } else {
          return 'start';
        }
      }).attr('y', function(it){
        return it.y;
      }).attr('dx', function(it){
        if (it.x < meanX) {
          return 1 - getR(it);
        } else {
          return getR(it);
        }
      });
      if (state.has('spline')) {
        link.attr('d', drawCurve);
      } else {
        link.attr('x1', function(it){
          return it.source.x;
        }).attr('y1', function(it){
          return it.source.y;
        }).attr('x2', function(it){
          return it.target.x;
        }).attr('y2', function(it){
          return it.target.y;
        });
      }
      svgGroup.selectAll('text').attr('display', function(arg$){
        var marked, id, edges, isDirect;
        marked = arg$.marked, id = arg$.id, edges = arg$.edges, isDirect = arg$.isDirect;
        switch (false) {
        case !(graph.nodes.length < state.get('smallGraphThreshold')):
          return 'block';
        case !(state.get('zoom') > 1.2):
          return 'block';
        case !(marked || isDirect):
          return 'block';
        default:
          return 'none';
        }
      });
      node.selectAll('text.count-label').text(function(){
        return sum(function(it){
          return it.counts;
        }.apply(this, arguments));
      }).attr('x', function(it){
        return it.x;
      }).attr('y', function(it){
        return it.y;
      }).attr('font-size', function(){
        return (function(it){
          return it / 1.5;
        })(getR.apply(this, arguments));
      }).attr('display', function(arg$){
        var marked, isRoot, isDirect;
        marked = arg$.marked, isRoot = arg$.isRoot, isDirect = arg$.isDirect;
        switch (false) {
        case !(marked || isDirect || isRoot):
          return 'block';
        default:
          return 'none';
        }
      });
      svgGroup.selectAll('text.force-label').attr('font-size', currentFontSize);
      link.attr('stroke-width', function(arg$){
        var target;
        target = arg$.target;
        switch (false) {
        case !target.marked:
          return '2px';
        default:
          return '1px';
        }
      });
      circles = node.selectAll('circle').attr('r', getR).attr('cx', function(it){
        return it.x;
      }).attr('cy', function(it){
        return it.y;
      });
      if (any(function(it){
        return it.marked;
      }, graph.nodes)) {
        circles.attr('opacity', function(it){
          if (it.marked || it.isRoot) {
            return 1;
          } else {
            return 0.2;
          }
        });
        link.attr('opacity', function(arg$){
          var source, target;
          source = arg$.source, target = arg$.target;
          switch (false) {
          case !(source.marked && (target.marked || target.isRoot)):
            return linkOpacity.focus;
          default:
            return linkOpacity.unfocus;
          }
        });
        return svgGroup.selectAll('text').attr('opacity', function(it){
          if (it.marked) {
            return 1;
          } else {
            return 0.2;
          }
        });
      } else {
        link.attr('opacity', function(arg$){
          var muted;
          muted = arg$.source.muted;
          if (muted) {
            return linkOpacity.muted;
          } else {
            return linkOpacity.normal;
          }
        });
        circles.attr('opacity', function(arg$){
          var muted, isDirect;
          muted = arg$.muted, isDirect = arg$.isDirect;
          switch (false) {
          case !muted:
            return 0.3;
          case !isDirect:
            return 1;
          default:
            return 0.9;
          }
        });
        return svgGroup.selectAll('text').attr('opacity', function(it){
          if (it.muted) {
            return 0.3;
          } else {
            return 1;
          }
        });
      }
    }
    return tick;
  };
  module.exports = {
    renderForce: renderForce
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
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);
