'use strict';

var template = require('../templates/contact');

function load (container, summary, controls) {
  summary && (summary.innerHTML = '');
  container && (container.innerHTML = template());
}

module.exports = load;
