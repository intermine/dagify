(function(){
  var Backbone, Q, Settings, DAG, ref$, apply, pairsToObj, split, id, any, each, find, sortBy, last, join, map, isType, all, first, baseQuery, dagOpts, addRelation, loadOrgChart, bankViews, wireUp, processResults, graphify, slice$ = [].slice;
  Backbone = require('backbone');
  Q = require('q');
  Backbone.$ = $;
  Settings = require('./settings.ls').Settings;
  DAG = require('./dag.ls').DAG;
  ref$ = require('prelude-ls'), apply = ref$.apply, pairsToObj = ref$.pairsToObj, split = ref$.split, id = ref$.id, any = ref$.any, each = ref$.each, find = ref$.find, sortBy = ref$.sortBy, last = ref$.last, join = ref$.join, map = ref$.map, isType = ref$.isType, all = ref$.all, first = ref$.first;
  baseQuery = {
    from: 'Company',
    joins: ['bank'],
    select: ['name', 'vatNumber', 'address.address', 'departments.name', 'departments.employees.address.address', 'departments.employees.name', 'departments.employees.age', 'departments.employees.fullTime']
  };
  $(document).ready(main);
  dagOpts = {
    isClosable: function(node){
      var ref$;
      return (ref$ = node.get('nodeType')) === 'ref' || ref$ === 'coll';
    },
    getNodeClass: function(graph, nid, node){
      return node.get('nodeType');
    }
  };
  function main(){
    var testmodel, x$, settings, y$, z$, gettingCompanies;
    $(document).foundation();
    testmodel = new intermine.Service({
      root: "http://localhost:8080/intermine-test"
    });
    x$ = settings = new Settings;
    x$.$el.appendTo(document.getElementById('controls'));
    y$ = window.dag = new DAG(dagOpts);
    y$.setElement(document.getElementById('org-chart'));
    y$.on('add:class', bind$(settings, 'addClass'));
    y$.on('add:path', bind$(settings.paths, 'add'));
    y$.render();
    z$ = gettingCompanies = testmodel.records({
      select: ['Company.name']
    });
    z$.then(wireUp(testmodel, settings, dag));
    return z$;
  }
  addRelation = curry$(function(service, dag, select, name){
    var query, processP, resultsP;
    query = {
      select: select,
      where: {
        name: name
      }
    };
    processP = service.fetchModel().then(function(m){
      var i$, ref$, len$, p, results$ = [];
      for (i$ = 0, len$ = (ref$ = select).length; i$ < len$; ++i$) {
        p = ref$[i$];
        results$.push(m.makePath(p));
      }
      return results$;
    }).then(map(partialize$.apply(this, [processResults, [void 8, bind$(dag, 'addNode'), bind$(dag, 'addEdge')], [0]])));
    resultsP = service.records(query);
    return Q.all([processP, resultsP]).fail(bind$(console, 'error')).then(function(arg$){
      var fs, results;
      fs = arg$[0], results = arg$[1];
      console.log(results);
      each(flip$(apply)([results]), fs);
      return dag.updateGraph();
    });
  });
  loadOrgChart = curry$(function(service, dag, name){
    var query;
    query = import$({
      where: {
        name: name
      }
    }, baseQuery);
    return Q.all([service.query(query), service.fetchModel()]).then(function(arg$){
      var pq, m, fs, res$, i$, ref$, len$, view;
      pq = arg$[0], m = arg$[1];
      res$ = [];
      for (i$ = 0, len$ = (ref$ = pq.views).length; i$ < len$; ++i$) {
        view = ref$[i$];
        res$.push(processResults(m.makePath(view)));
      }
      fs = res$;
      return service.records(pq).fail(bind$(console, 'error')).then(function(results){
        var nodes, edges, i$, ref$, len$, f;
        nodes = [];
        edges = [];
        for (i$ = 0, len$ = (ref$ = fs).length; i$ < len$; ++i$) {
          f = ref$[i$];
          f(bind$(nodes, 'push'), bind$(edges, 'push'), results);
        }
        return dag.setGraph({
          nodes: nodes,
          edges: edges
        });
      });
    });
  });
  bankViews = ['Company.bank.name', 'Company.bank.debtors.debt', 'Company.bank.debtors.interestRate', 'Company.bank.debtors.owedBy.name'];
  wireUp = curry$(function(service, settings, dag, companies){
    var x$, addRel;
    x$ = settings;
    x$.collection = new Backbone.Collection(companies);
    x$.render();
    settings.classes.on('change:hidden', function(){
      var hiddenClasses;
      hiddenClasses = settings.classes.filter(function(it){
        return it.get('hidden');
      }).map(function(it){
        return it.get('name');
      });
      return dag.state.set({
        hiddenClasses: hiddenClasses
      });
    });
    settings.paths.on('change:hidden', function(){
      var hiddenPaths;
      hiddenPaths = settings.paths.filter(function(it){
        return it.get('hidden');
      }).map(function(it){
        return it.get('path');
      });
      return dag.state.set({
        hiddenPaths: hiddenPaths
      });
    });
    addRel = addRelation(service, dag);
    settings.on('filter', partialize$.apply(dag.state, [dag.state.set, ['filter', void 8], [1]]));
    settings.on('align:attrs', partialize$.apply(dag.state, [dag.state.set, ['alignAttrs', void 8], [1]]));
    settings.on('hide:attrs', partialize$.apply(dag.state, [dag.state.set, ['hideAttrs', void 8], [1]]));
    settings.on('chosen:company', loadOrgChart(service, dag));
    settings.on('chosen:layout', bind$(dag, 'setLayout'));
    settings.on('show:contractors', addRel(["Company.contractors.name"]));
    settings.on('show:secretaries', addRel(["Company.secretarys.name"]));
    settings.on('show:banks', addRel(bankViews));
    return loadOrgChart(service, dag, function(it){
      return it.name;
    }(first(companies)));
  });
  processResults = curry$(function(path, addNode, addEdge, result){
    var steps, addRef, processLevel, i$, len$, obj, results$ = [];
    steps = path.allDescriptors();
    addRef = curry$(function(parent, pathToHere, nextStep, nextDepth, obj){
      if (obj == null) {
        return;
      }
      obj.id = obj.objectId;
      obj.nodeType = 'ref';
      obj.path = pathToHere;
      addNode(obj);
      if (parent != null) {
        addEdge({
          source: obj,
          target: parent
        });
      }
      if (nextStep != null) {
        return processLevel(nextDepth, obj, obj[nextStep.name]);
      }
    });
    processLevel = function(depth, parent, obj){
      var step, nextDepth, pathToHere, nextStep, coll, node;
      step = steps[depth];
      nextDepth = depth + 1;
      pathToHere = join('.', map(function(it){
        return it.name;
      }, steps.slice(0, nextDepth)));
      nextStep = steps[nextDepth];
      if (step.isCollection) {
        coll = {
          id: parent.id + "-" + step.name,
          name: step.name,
          path: pathToHere,
          nodeType: 'coll',
          'class': "Collection<" + step.referencedType + ">"
        };
        addNode(coll);
        addEdge({
          source: coll,
          target: parent
        });
        return each(addRef(coll, pathToHere, nextStep, nextDepth), obj);
      } else if (step.fields != null || step.referencedType != null) {
        return addRef(parent, pathToHere, nextStep, nextDepth, obj);
      } else {
        node = {
          path: pathToHere,
          nodeType: 'attr',
          id: parent.id + "-" + step.name,
          value: obj,
          'class': step.type
        };
        addNode(node);
        if (parent != null) {
          return addEdge({
            label: step.name,
            source: node,
            target: parent
          });
        }
      }
    };
    for (i$ = 0, len$ = result.length; i$ < len$; ++i$) {
      obj = result[i$];
      results$.push(processLevel(0, null, obj));
    }
    return results$;
  });
  graphify = curry$(function(path, results){
    var nodes, edges;
    nodes = [];
    edges = [];
    processResults(path, bind$(nodes, 'push'), bind$(edges, 'push'), results);
    return {
      nodes: nodes,
      edges: edges
    };
  });
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
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
  function flip$(f){
    return curry$(function (x, y) { return f(y, x); });
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
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
