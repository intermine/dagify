'use strict';

var Handlebars = require('handlebars');

function optionHelper (value, label, selectedValue) {
  var prop = (value === selectedValue) ? ' selected' : '';
  var val = Handlebars.Utils.escapeExpression(value);
  var content = Handlebars.Utils.escapeExpression(label);
  return new Handlebars.SafeString(
    '<option value="' + val + '"' + prop + '>' + content + '</option>'
  );
}

Handlebars.registerHelper('option', optionHelper);
