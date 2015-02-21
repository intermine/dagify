'use strict';

var Backbone = require('backbone');

var GraphState = Backbone.Model.extend({
  defaults: function () {
    return {rankdir: 'lr'};
  }
});
module.exports = GraphState;
