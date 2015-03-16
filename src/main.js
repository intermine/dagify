'use strict';

var Backbone = require('backbone');
var jquery = require('jquery');
var Router = require('./router');

var routes = {
  words: require('./demo/words'),
  species: require('./demo/species'),
  contact: require('./routes/contact'),
  fallback: require('./routes/fallback')
};

var TitleView = require('./views/title');

// Propagate jQuery.
Backbone.$ = jquery;

function main () {
  var header    = document.querySelector('.app > .header')
    , heading = document.querySelector('.app-content > .jumbotron h2')
    , container = document.querySelector('.graph-container')
    , summary   = document.querySelector('.graph-summary')
    , controls  = document.querySelector('.graph-controls')
    , state     = new Backbone.Model()
    , router    = new Router({model: state, el: header})
    , title     = new TitleView({model: state, el: heading})
    ;

  router.render();
  title.render();

  state.on('change:closed', function (m, closed) {
    Backbone.$(summary).add(controls).slideToggle(!closed);
  });

  state.on('change:page', function () {
    var page = state.get('page');
    summary.innerHTML = '';
    controls.innerHTML = '';
    if (page in routes) {
      state.set({title: page});
      routes[page](container, summary, controls);
    } else {
      state.set({title: '404'});
      routes.fallback(container, summary, controls, page);
    }
  });

  var page = (window.location.hash || '#words').slice(1);
  state.set({page: page});
}

window.onload = main;
