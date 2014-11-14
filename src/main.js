'use strict';

var Backbone = require('backbone');
var string = require('underscore.string');

var routes = {
  words: require('./demo/words'),
  species: require('./demo/species'),
  contact: require('./routes/contact'),
  fallback: require('./routes/fallback')
};

// Propagate jQuery.
Backbone.$ = window.jQuery;

var Router = Backbone.View.extend({
  initialize: function () {
    this.listenTo(this.model, 'change:page', this.changeTabState);
  },
  changeTabState: function () {
    var page = this.model.get('page');
    this.$('li').removeClass('active');
    this.$('li.' + page).addClass('active');
  },
  events: function () {
    var events = {};
    var state = this.model;
    ['words', 'species', 'contact'].forEach(function (page) {
      events['click li.' + page] = state.set.bind(state, {page: page});
    });
    return events;
  }
});

function main () {
  var header    = document.querySelector('.app > .header')
    , container = document.querySelector('.graph-container')
    , summary   = document.querySelector('.graph-summary')
    , controls  = document.querySelector('.graph-controls')
    , state     = new Backbone.Model()
    , router    = new Router({model: state, el: header})
    ;

  state.on('change:page', function () {
    var page = state.get('page');
    var heading = document.querySelector('.app > .jumbotron h2');
    if (page in routes) {
      heading.innerHTML = string.capitalize(page);
      routes[page](container, summary, controls);
    } else {
      heading.innerHTML = '404';
      routes.fallback(container, summary, controls, page);
    }
  });

  var hash = window.location.hash;
  if (hash) {
    console.log('page => ' + hash.slice(1));
    state.set({page: hash.slice(1)});
  } else {
    state.set({page: 'words'});
  }
}

window.onload = main;
