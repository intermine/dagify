'use strict';

var Handlebars = require('handlebars');

function optionHelper (value, label, selectedValue) {
  var prop = (value === selectedValue) ? 'selected="selected"' : '';
  return new Handlebars.SafeString(
    '<option value="' + value + '"' + prop + '>' +
    label +
    '</option>'
  );
}

Handlebars.registerHelper('option', optionHelper);
