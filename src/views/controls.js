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
    return _.extend(this.model.toJSON(), {
      layouts: layouts,
      roots: this.getRoots()
    });
  },
  getRoots: function () {
    return [{label: ':all', value: null}].concat(this.model.get('roots').map(function (r) {
      return {label: r, value: r};
    }));
  },
  changeLayout: function (event) {
    var rankdir = event.target.value;
    this.model.set({rankdir: rankdir});
  },
  changeCurrentRoot: function (event) {
    var currentRoot = event.target.value;
    this.model.set({currentRoot: currentRoot});
  }
});

module.exports = ControlsView;
