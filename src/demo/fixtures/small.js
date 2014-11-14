'use strict';

exports.nodes = [
  {name: 'Thing one', identifier: 'one'},
  {name: 'Thing two', identifier: 'two'},
  {name: 'Thing three', identifier: 'three'},
  {name: 'Thing four', identifier: 'four'},
  {name: 'Ding eins', identifier: 'eins'},
  {name: 'Ding zwei', identifier: 'zwei'},
  {name: 'Ding drei', identifier: 'drei'},
  {name: 'Ding vier', identifier: 'vier'},
  {name: 'German', identifier: 'lang:de'},
  {name: 'English', identifier: 'lang:en'},
];
exports.edges = [
  {child: 'one',    parent: 'lang:en', relationship: 'instance_of'},
  {child: 'two',    parent: 'lang:en', relationship: 'instance_of'},
  {child: 'three',  parent: 'lang:en', relationship: 'instance_of'},
  {child: 'four',   parent: 'lang:en', relationship: 'instance_of'},
  {child: 'eins',   parent: 'lang:de', relationship: 'instance_of'},
  {child: 'zwei',   parent: 'lang:de', relationship: 'instance_of'},
  {child: 'drei',   parent: 'lang:de', relationship: 'instance_of'},
  {child: 'vier',   parent: 'lang:de', relationship: 'instance_of'},
  {parent: 'one',   child: 'two', relationship: 'follows'},
  {parent: 'two',   child: 'three', relationship: 'follows'},
  {parent: 'three', child: 'four', relationship: 'follows'},
  {parent: 'eins',   child: 'zwei', relationship: 'follows'},
  {parent: 'zwei',   child: 'drei', relationship: 'follows'},
  {parent: 'drei', child: 'vier', relationship: 'follows'},
  {child: 'eins', parent: 'one', relationship: 'translates'},
  {child: 'zwei', parent: 'two', relationship: 'translates'},
  {child: 'drei', parent: 'three', relationship: 'translates'},
  {child: 'vier', parent: 'four', relationship: 'translates'},
  {parent: 'eins', child: 'one', relationship: 'translates'},
  {parent: 'zwei', child: 'two', relationship: 'translates'},
  {parent: 'drei', child: 'three', relationship: 'translates'},
  {parent: 'vier', child: 'four', relationship: 'translates'}
];

