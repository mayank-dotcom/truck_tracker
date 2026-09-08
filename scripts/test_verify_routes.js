const fs = require('fs');

// We can test by reading and compiling the logic or checking with tsc / next build
console.log("Checking scenarioRoutes file size and contents...");
const content = fs.readFileSync('./app/lib/scenarioRoutes.ts', 'utf8');
console.log("File length:", content.length);
console.log("Has Dijkstra:", content.includes("function runDijkstraShortestPath"));
console.log("Has computeScenarioDijkstraItinerary:", content.includes("function computeScenarioDijkstraItinerary"));
console.log("Has OPERATING_SCENARIOS:", content.includes("export const OPERATING_SCENARIOS"));
