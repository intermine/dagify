'use strict';

var Backbone = require('backbone');

var GraphState = Backbone.Model.extend({
  initialize: function () {
    this.set({rankdir: 'lr'});
  }
});
module.exports = GraphState;
