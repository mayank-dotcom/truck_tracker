const fs = require('fs');

// We test by transpiling or running a quick check on the scenarios in ts
console.log("Checking GRAPH_NODES keys...");
const content = fs.readFileSync('./app/lib/scenarioRoutes.ts', 'utf8');

const hasNodeTribecaWest = content.includes('"NODE_TRIBECA_WEST":');
console.log("Has NODE_TRIBECA_WEST key in GRAPH_NODES:", hasNodeTribecaWest);
const hasNodeFranklin = content.includes('"NODE_FRANKLIN_BROADWAY":');
console.log("Has NODE_FRANKLIN_BROADWAY key in GRAPH_NODES:", hasNodeFranklin);
const hasNodeChatham = content.includes('"NODE_CHATHAM_SQ":');
console.log("Has NODE_CHATHAM_SQ key in GRAPH_NODES:", hasNodeChatham);
const hasNodePier16 = content.includes('"NODE_PIER16_SEAPORT":');
console.log("Has NODE_PIER16_SEAPORT key in GRAPH_NODES:", hasNodePier16);
