(function(){
  var Q, Service, ref$, concatMap, id, unique, OntologyWidget, resultsA, resultsB, resultsC, FLYMINE, Promise, dagOpts, cssify;
  Q = require('q');
  Service = require('imjs').Service;
  ref$ = require('prelude-ls'), concatMap = ref$.concatMap, id = ref$.id, unique = ref$.unique;
  OntologyWidget = require('./ontology-widget.ls');
  resultsA = require('../data/result_0.json');
  resultsB = require('../data/result_1-edges.json');
  resultsC = require('../data/result_2-nodes.json');
  FLYMINE = 'http://www.flymine.org/query/service';
  Promise = function(){
    var unit, lift, bind;
    unit = function(a){
      return Q(a);
    };
    lift = curry$(function(f, ma){
      return ma.then(f);
    });
    bind = curry$(function(ma, f){
      return Q(ma).then(f);
    });
    return {
      unit: unit,
      bind: bind,
      lift: lift
    };
  }();
  dagOpts = {
    rankScale: [0.95, 0.8],
    nodeKey: function(it){
      return it.identifier;
    },
    edgeLabels: ['relationship'],
    edgeProps: ['childTerm', 'parentTerm'],
    onNodeClick: function(nid){
      return this.zoomTo(nid);
    },
    getEdgeClass: function(edge){
      return cssify(edge.get('relationship'));
    },
    getNodeClass: function(node){
      if (node.get('direct')) {
        return 'direct';
      } else {
        return 'inferred';
      }
    },
    onEdgeClick: function(g, eid){
      var this$ = this;
      this.zoomTo(g.source(eid));
      return setTimeout(function(){
        return this$.zoomTo(g.target(eid));
      }, 770);
    }
  };
  $(document).ready(main);
  cssify = function(){
    return function(it){
      return it.replace(/[^a-z-]/g, '-');
    }(function(it){
      return it.toLowerCase();
    }(String.apply(this, arguments)));
  };
  function main(){
    var flymine, x$, widget;
    flymine = new Service({
      root: FLYMINE
    });
    x$ = widget = new OntologyWidget(dagOpts);
    x$.setElement(document.getElementById('ontology-widget'));
    x$.on('all', bind$(console, 'log'));
    x$.render();
    return getGraphFor(flymine, {
      symbol: 'cdc2',
      'organism.taxonId': 7227
    }).then(bind$(widget, 'setGraph')).fail(function(err){
      var ref$;
      return console.error((ref$ = err != null ? err.stack : void 8) != null ? ref$ : err);
    });
  }
  function getMockGraphFor(service, constraint){
    return Q['try'](function(){
      var terms, direct, indirect, edges, nodes, i$, len$, n;
      terms = resultsA.results;
      direct = _.indexBy((function(){
        var i$, ref$, len$, ref1$, results$ = [];
        for (i$ = 0, len$ = (ref$ = terms).length; i$ < len$; ++i$) {
          ref1$ = ref$[i$], direct = ref1$[0], indirect = ref1$[1];
          results$.push(direct);
        }
        return results$;
      }()));
      edges = resultsB.results;
      nodes = resultsC.results;
      for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
        n = nodes[i$];
        n.direct = direct[n.identifier] != null;
      }
      return {
        nodes: nodes,
        edges: edges
      };
    });
  }
  function getGraphFor(service, constraint){
    return (function(arg$){
      var unit, bind;
      unit = arg$.unit, bind = arg$.bind;
      return bind(service.rows(termQuery(constraint)), function(terms){
        var direct, indirect, identifiers, q;
        direct = _.indexBy((function(){
          var i$, ref$, len$, ref1$, results$ = [];
          for (i$ = 0, len$ = (ref$ = terms).length; i$ < len$; ++i$) {
            ref1$ = ref$[i$], direct = ref1$[0], indirect = ref1$[1];
            results$.push(direct);
          }
          return results$;
        }()));
        identifiers = unique(
        concatMap(id)(
        terms));
        return bind(Q.all((function(){
          var i$, ref$, len$, results$ = [];
          for (i$ = 0, len$ = (ref$ = [edgeQuery, nodeQuery]).length; i$ < len$; ++i$) {
            q = ref$[i$];
            results$.push(service.records(q(identifiers)));
          }
          return results$;
        }())), function(arg$){
          var edges, nodes, i$, len$, n;
          edges = arg$[0], nodes = arg$[1];
          for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
            n = nodes[i$];
            n.direct = direct[n.identifier] != null;
          }
          return unit({
            nodes: nodes,
            edges: edges
          });
        });
      });
    }.call(this, Promise));
  }
  function termQuery(constraints){
    return {
      name: 'edge-query',
      from: 'Gene',
      select: ['goAnnotation.ontologyTerm.identifier', 'goAnnotation.ontologyTerm.parents.identifier'],
      where: constraints
    };
  }
  function nodeQuery(terms){
    return {
      name: 'GoTerms',
      from: 'OntologyTerm',
      select: ['identifier', 'name'],
      where: {
        identifier: terms
      }
    };
  }
  function edgeQuery(terms){
    return {
      name: 'graph-query',
      from: 'OntologyRelation',
      select: ['childTerm.identifier', 'relationship', 'parentTerm.identifier'],
      where: {
        'childTerm.identifier': terms,
        direct: 'true'
      }
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
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
}).call(this);
