(function(){
  var Service, objectify, ref$, map, pairsToObj, interop, interopLaterMaybeWhenTheyUpgrade, OntologyWidget, queryParams, currentSymbol, main;
  Service = intermine.Service;
  objectify = require('./util').objectify;
  ref$ = require('prelude-ls'), map = ref$.map, pairsToObj = ref$.pairsToObj;
  interop = [
    {
      taxonId: 4932,
      root: 'yeastmine-test.yeastgenome.org/yeastmine-dev',
      name: 'SGD'
    }, {
      taxonId: 10090,
      root: 'http://beta.mousemine.org/mousemine',
      name: 'MGI'
    }, {
      taxonId: 6239,
      root: 'http://intermine.modencode.org/release-32',
      name: 'modMine'
    }
  ];
  interopLaterMaybeWhenTheyUpgrade = [
    {
      taxonId: 7955,
      root: 'zmine.zfin.org/zebrafishmine',
      name: 'ZFin'
    }, {
      taxonId: 10116,
      root: 'http://ratmine.mcw.edu/ratmine',
      name: 'RGD'
    }
  ];
  OntologyWidget = require('./presenter');
  queryParams = pairsToObj(
  map(function(){
    return map(decodeURIComponent)(function(it){
      return it.split('=');
    }.apply(this, arguments));
  })(
  function(it){
    return it.split('&');
  }(
  function(it){
    return it.substring(1);
  }(
  location.search || '?'))));
  currentSymbol = function(){
    return queryParams.symbol || 'bsk';
  };
  main = function(symbol){
    var target, config, x$, widget;
    target = '#dag';
    console.log("Rendering a widget for " + symbol);
    config = {
      interop: interop,
      service: {
        root: 'http://www.flymine.org/query'
      },
      graphState: {
        query: symbol
      }
    };
    x$ = widget = new OntologyWidget(config, window.ecoTemplates);
    x$.render(target);
    return x$;
  };
  $(function(){
    return main(currentSymbol());
  });
}).call(this);
