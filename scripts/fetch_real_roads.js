const https = require('https');
const fs = require('fs');
const path = require('path');

const NODES = {
  // Common Manhattan intersections
  TRIBECA_WEST: { id: "NODE_TRIBECA_WEST", name: "Tribeca West St Terminal (Origin)", coords: [-74.011331, 40.718775] },
  FRANKLIN_BROADWAY: { id: "NODE_FRANKLIN_BROADWAY", name: "Franklin & Broadway Hub (D1)", coords: [-74.003023, 40.715632] },
  CHATHAM_SQ: { id: "NODE_CHATHAM_SQ", name: "Chatham Sq Distribution Hub (D2)", coords: [-73.998394, 40.713531] },
  PIER16_SEAPORT: { id: "NODE_PIER16_SEAPORT", name: "Pier 16 Seaport Terminal (D3)", coords: [-74.003696, 40.705676] },

  HUDSON_CANAL: { id: "NODE_HUDSON_CANAL", name: "Hudson & Canal St Terminal", coords: [-74.0085, 40.7215] },
  BROADWAY_CANAL: { id: "NODE_BROADWAY_CANAL", name: "Canal & Broadway Interchange", coords: [-74.0015, 40.7198] },
  FOLEY_SQ: { id: "NODE_FOLEY_SQ", name: "Foley Sq Federal Transit Bay", coords: [-74.0028, 40.7145] },
  BATTERY_PARK: { id: "NODE_BATTERY_PARK", name: "Battery Park Maritime Terminal", coords: [-74.0150, 40.7035] },

  EAST_BROADWAY: { id: "NODE_EAST_BROADWAY", name: "East Broadway Distribution Terminal", coords: [-73.9928, 40.7125] },
  WEST_CHAMBERS: { id: "NODE_WEST_CHAMBERS", name: "West & Chambers St Depot", coords: [-74.0125, 40.7160] },
  WALL_BROAD: { id: "NODE_WALL_BROAD", name: "Wall St Financial Dock Terminal", coords: [-74.0110, 40.7068] },
};

// Road edges to fetch from OSRM
const EDGES_TO_FETCH = [
  // Scenario 1
  ["TRIBECA_WEST", "FRANKLIN_BROADWAY", "West St & Franklin St"],
  ["FRANKLIN_BROADWAY", "CHATHAM_SQ", "Worth St & Chatham Sq"],
  ["CHATHAM_SQ", "PIER16_SEAPORT", "Pearl St & FDR South"],

  // Scenario 2
  ["HUDSON_CANAL", "BROADWAY_CANAL", "Canal St Commercial Corridor"],
  ["BROADWAY_CANAL", "FOLEY_SQ", "Lafayette & Centre St"],
  ["FOLEY_SQ", "BATTERY_PARK", "Broadway South to Battery Pl"],

  // Scenario 3
  ["BROADWAY_CANAL", "FOLEY_SQ", "Centre St Medical Corridor"],
  ["FOLEY_SQ", "EAST_BROADWAY", "Worth & East Broadway Hub"],
  ["EAST_BROADWAY", "PIER16_SEAPORT", "South St Seaport Arterial"],

  // Scenario 4
  ["WEST_CHAMBERS", "FRANKLIN_BROADWAY", "West St to Franklin Connector"],
  ["CHATHAM_SQ", "BATTERY_PARK", "Park Row to Battery Park South"],

  // Scenario 5
  ["WEST_CHAMBERS", "BATTERY_PARK", "West St Arterial South"],
  ["BATTERY_PARK", "WALL_BROAD", "State St & Broad St Financial"],
  ["WALL_BROAD", "PIER16_SEAPORT", "Water St to Fulton Seaport"],

  // Additional connecting edges for Dijkstra flexibility
  ["TRIBECA_WEST", "HUDSON_CANAL", "West St to Canal Ramp"],
  ["HUDSON_CANAL", "WEST_CHAMBERS", "Hudson & Greenwich South"],
  ["FRANKLIN_BROADWAY", "FOLEY_SQ", "Centre St Connector"],
  ["FOLEY_SQ", "CHATHAM_SQ", "Worth St Connector"],
  ["FOLEY_SQ", "WALL_BROAD", "Broadway South Corridor"],
];

function fetchOsrmRoute(c1, c2) {
  return new Promise((resolve, reject) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${c1[0]},${c1[1]};${c2[0]},${c2[1]}?overview=full&geometries=geojson`;
    https.get(url, { headers: { 'User-Agent': 'FoxFreightRouting/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
            const route = json.routes[0];
            resolve({
              distanceMeters: route.distance,
              distanceMiles: Number((route.distance * 0.000621371).toFixed(2)),
              durationSeconds: route.duration,
              coordinates: route.geometry.coordinates,
            });
          } else {
            reject(new Error(`OSRM error: ${json.code} - ${json.message || ''}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log(`Fetching ${EDGES_TO_FETCH.length} road edges along real street network...`);
  const results = {};

  for (let i = 0; i < EDGES_TO_FETCH.length; i++) {
    const [fromKey, toKey, streetName] = EDGES_TO_FETCH[i];
    const n1 = NODES[fromKey];
    const n2 = NODES[toKey];
    const edgeKey = `${fromKey}__${toKey}`;

    if (results[edgeKey]) continue;

    console.log(`[${i+1}/${EDGES_TO_FETCH.length}] Fetching ${fromKey} -> ${toKey} (${streetName})...`);
    try {
      const data = await fetchOsrmRoute(n1.coords, n2.coords);
      console.log(`  -> OK: ${data.distanceMiles} mi, ${data.coordinates.length} real road coords`);
      results[edgeKey] = {
        from: n1.id,
        to: n2.id,
        fromKey,
        toKey,
        streetName,
        weight: data.distanceMiles,
        geometry: data.coordinates,
      };
      await sleep(150); // Be courteous to public OSRM API
    } catch (err) {
      console.error(`  -> Failed: ${err.message}`);
    }
  }

  const outPath = path.join(__dirname, 'real_road_network_data.json');
  fs.writeFileSync(outPath, JSON.stringify({ nodes: NODES, edges: results }, null, 2));
  console.log(`Successfully saved road network data with ${Object.keys(results).length} edges to ${outPath}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
