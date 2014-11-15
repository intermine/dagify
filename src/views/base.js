'use strict';

var Backbone = require('backbone');

var BaseView = Backbone.View.extend({
  initialize: function () {
    this.listenTo(this.model, 'change', this.render);
  },
  render: function () {
    this.$el.html(this.template(this.model.toJSON()));
  }
});

module.exports = BaseView;

