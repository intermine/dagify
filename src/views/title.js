'use strict';

var string = require('underscore.string');
var Base = require('./base');
var template = require('../templates/title');

var Icons = {
  CLOSED: 'fa-chevron-right',
  OPEN: 'fa-chevron-down'
};

module.exports = Base.extend({
  template: template,
  events: {'click': 'toggleClosed'},
  data: function () {
    var title = string.capitalize(this.model.get('title'));
    var icon = this.model.get('closed') ? Icons.CLOSED : Icons.OPEN;
    return {title: title, icon: icon};
  },
  toggleClosed: function () {
    this.model.set({closed: !this.model.get('closed')});
  }
});
