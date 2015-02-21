'use strict';

var _ = require('underscore');
var Backbone = require('backbone');
var string = require('underscore.string');

var Router = module.exports = Backbone.View.extend({
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
  setPage: function (page) {
    this.model.set({page: page});
  },
  events: function () {
    var self = this;
    return _.object(this.sections.map(function (page) {
      return ['click li.' + page, self.setPage.bind(self, page)];
    }));
  },
  data: function () {
    return {sections: this.sections.map(sectionData)}
  },
  render: function () {
    this.$el.html(this.template(this.data()));
  }
});

function sectionData (s) {
  return {id: s, name: string.capitalize(s)};
}
