'use strict';

var Backbone = require('backbone');
var string = require('underscore.string');

var Router = Backbone.View.extend({
  initialize: function () {
    this.listenTo(this.model, 'change:page', this.changeTabState);
  },
  sections: ['words', 'species', 'contact'],
  template: require('./templates/nav-pills'),
  changeTabState: function () {
    var page = this.model.get('page');
    this.$('li').removeClass('active');
    this.$('li.' + page).addClass('active');
  },
  events: function () {
    var events = {};
    var state = this.model;
    this.sections.forEach(function (page) {
      events['click li.' + page] = state.set.bind(state, {page: page});
    });
    return events;
  },
  render: function () {
    this.$el.html(this.template({sections: this.sections.map(function (s) {
      return {id: s, name: string.capitalize(s)};
    })}));
  }
});

module.exports = Router;
