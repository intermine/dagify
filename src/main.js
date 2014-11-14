'use strict';

var Backbone = require('backbone');

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
  var header = document.querySelector('.app > .header');
  var state = new Backbone.Model();
  var router = new Router({model: state, el: header});

  state.on('change:page', function () {
    var page = state.get('page');
    if (page in routes) {
      routes[page]();
    } else {
      routes.fallback(page);
    }
  });

  state.set({page: 'words'});
}

window.onload = main;
