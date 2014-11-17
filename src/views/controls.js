'use strict';

var _ = require('underscore');
var BaseView = require('./base');

require('../hbs/helpers');

var layouts = [
  {label: 'Horizontal',         value: 'lr'},
  {label: 'Vertical',           value: 'tb'},
  {label: 'Reverse Horizontal', value: 'rl'},
  {label: 'Reverse Vertical',   value: 'bt'}
];

var ControlsView = BaseView.extend({
  template: require('../templates/controls'),
  events: {
    'change [name=root]': 'changeCurrentRoot',
    'change [name=rankdir]': 'changeLayout'
  },
  data: function () {
    return _.extend({layouts: layouts}, this.model.toJSON());
  },
  changeLayout: function (event) {
    var rankdir = this.$(event.target).val();
    this.model.set({rankdir: rankdir});
  },
  changeCurrentRoot: function (event) {
    var currentRoot = this.$(event.target).val();
    this.model.set({currentRoot: currentRoot});
  }
});

module.exports = ControlsView;
