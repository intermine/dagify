'use strict';

var BaseView = require('./base');

require('../hbs/helpers');

var ControlsView = BaseView.extend({
  template: require('../templates/controls'),
  events: {
    'change [name=root]': 'changeCurrentRoot'
  },
  changeCurrentRoot: function (event) {
    var currentRoot = this.$(event.target).val();
    this.model.set({currentRoot: currentRoot});
  }
});

module.exports = ControlsView;
