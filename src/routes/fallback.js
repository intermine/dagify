'use strict';

var template = require('../templates/fallback');

function load (page) {
  var elem = document.querySelector('.graph-container');
  elem.innerHTML = template({page: page});
}

module.exports = load;
