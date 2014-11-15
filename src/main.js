'use strict';

var Backbone = require('backbone');
var string = require('underscore.string');

var Router = require('./router');

var routes = {
  words: require('./demo/words'),
  species: require('./demo/species'),
  contact: require('./routes/contact'),
  fallback: require('./routes/fallback')
};

// Propagate jQuery.
Backbone.$ = (window.jQuery || window.Zepto);

function main () {
  var header    = document.querySelector('.app > .header')
    , container = document.querySelector('.graph-container')
    , summary   = document.querySelector('.graph-summary')
    , controls  = document.querySelector('.graph-controls')
    , state     = new Backbone.Model()
    , router    = new Router({model: state, el: header})
    ;

  router.render();

  state.on('change:page', function () {
    var page = state.get('page');
    var heading = document.querySelector('.app > .jumbotron h2');
    summary.innerHTML = '';
    controls.innerHTML = '';
    if (page in routes) {
      heading.innerHTML = string.capitalize(page);
      routes[page](container, summary, controls);
    } else {
      heading.innerHTML = '404';
      routes.fallback(container, summary, controls, page);
    }
  });

  var page = (window.location.hash || '#words').slice(1);
  state.set({page: page});
}

window.onload = main;
