'use strict';

var template = require('../templates/contact');

function load () {
  document.querySelector('.graph-container').innerHTML = template();
}

module.exports = load;
