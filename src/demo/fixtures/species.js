var species = [
  // Graph 1 - humans.
  /* 00 */ {name: 'H. sapiens', status: 'extant'},
  /* 01 */ {name: 'H. neanderthalensis', status: 'extinct'},
  /* 02 */ {name: 'H. heidelbergensis', status: 'extinct'},
  /* 03 */ {name: 'H. erectus', status: 'extinct'},
  /* 04 */ {name: 'H. ergaster', status: 'extinct'},
  /* 05 */ {name: 'H. habilis', status: 'extinct'},

  // Graph 2 - dinosaurs
  /* 06 */ {name: 'Crocodilians',     status: 'named_common_ancestor'},
  /* 07 */ {name: 'Pterosaurs',       status: 'extinct'},
  /* 08 */ {name: 'Horned Dinos',     status: 'extinct'},
  /* 09 */ {name: 'Domeheads',        status: 'extinct'},
  /* 10 */ {name: 'Duckbills',        status: 'extinct'},
  /* 11 */ {name: 'Armoured Dinos',   status: 'extinct'},
  /* 12 */ {name: 'Sauropods',        status: 'extinct'},
  /* 13 */ {name: 'Prosauropods',     status: 'extinct'},
  /* 14 */ {name: 'Other Theropods',  status: 'extinct'},
  /* 15 */ {name: 'Birds',            status: 'extant'},
  /* 16 */ {name: 'horned-and-domes', status: 'common_ancestor'},
  /* 17 */ {name: 'domes-and-ducks',  status: 'common_ancestor'},
  /* 18 */ {name: 'Ornithischians',   status: 'named_common_ancestor'},
  /* 19 */ {name: 'all-sauropods',    status: 'common_ancestor'},
  /* 20 */ {name: 'Saurischians',     status: 'named_common_ancestor'},
  /* 21 */ {name: 'Theropods',        status: 'named_common_ancestor'},
  /* 22 */ {name: 'Dinosaurs',        status: 'named_common_ancestor'},
  /* 23 */ {name: 'Ornithodirans',    status: 'named_common_ancestor'},
  /* 24 */ {name: 'Archosaurs',       status: 'named_common_ancestor'},
  /* 25 */ {name: 'Alligators',       status: 'extant'},
  /* 26 */ {name: 'Crocodiles',       status: 'extant'},

  /* 27 */ {name: 'Homo',             status: 'genus'}
];

var relationships = [
  // Graph 1 - humans
  {subject: species[0], ancestor: species[2]},
  {subject: species[1], ancestor: species[2]},
  {subject: species[2], ancestor: species[4]},
  {subject: species[3], ancestor: species[4]},
  {subject: species[4], ancestor: species[5]},
  {subject: species[5], ancestor: species[27]},

  // Graph 2 - dinosaurs
  {subject: species[6],  ancestor: species[24]},
  {subject: species[23], ancestor: species[24]},
  {subject: species[22], ancestor: species[23]},
  {subject: species[7],  ancestor: species[23]},
  {subject: species[18], ancestor: species[22]},
  {subject: species[20], ancestor: species[22]},
  {subject: species[17], ancestor: species[18]},
  {subject: species[11], ancestor: species[18]},
  {subject: species[16], ancestor: species[17]},
  {subject: species[10], ancestor: species[17]},
  {subject: species[8],  ancestor: species[16]},
  {subject: species[9],  ancestor: species[16]},
  {subject: species[19], ancestor: species[20]},
  {subject: species[21], ancestor: species[20]},
  {subject: species[12], ancestor: species[19]},
  {subject: species[13], ancestor: species[19]},
  {subject: species[14], ancestor: species[21]},
  {subject: species[15], ancestor: species[21]},
  {subject: species[25], ancestor: species[6]},
  {subject: species[26], ancestor: species[6]}

];

exports.nodes = species;
exports.edges = relationships;
