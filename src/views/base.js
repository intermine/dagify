'use strict';

var Backbone = require('backbone');

var BaseView = Backbone.View.extend({
  initialize: function () {
    this.listenTo(this.model, 'change', this.render);
  },
  data: function () {
    return this.model.toJSON();
  },
  render: function () {
    this.$el.html(this.template(this.data()));
  }
});

module.exports = BaseView;

