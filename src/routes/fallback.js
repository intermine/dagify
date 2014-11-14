'use strict';

var template = require('../templates/fallback');

function load (container, summary, controls, page) {
  summary && (summary.innerHTML = '');
  container && (container.innerHTML = template({page: page}));
}

module.exports = load;
