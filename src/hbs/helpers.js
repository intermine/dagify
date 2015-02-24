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

function checkboxHelper (value, label, checked) {
  var prop = (checked) ? ' checked' : '';
  var val = Handlebars.Utils.escapeExpression(value);
  var content = Handlebars.Utils.escapeExpression(label);
  return new Handlebars.SafeString(
    '<label>' +
    '<input type="checkbox" value="' + val + '"' + prop + '>'
    + content +
    '</label>'
  );
}

Handlebars.registerHelper('option', optionHelper);
Handlebars.registerHelper('checkbox', checkboxHelper);
