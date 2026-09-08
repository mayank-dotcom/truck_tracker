const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'osrm_route.json'), 'utf8'));
const coords = data.coordinates;

const code = `// 100% Real-world turn-by-turn road driving lane coordinates for Lower Manhattan
// Generated via OSRM street network (Origin -> D1 -> D2 -> D3)
export const STREET_ROUTE_COORDINATES: [number, number][] = ${JSON.stringify(coords, null, 2)};

export const CONGESTED_SEGMENT: [number, number][] = STREET_ROUTE_COORDINATES.slice(130, 200);

export interface DeliveryStop {
  id: "origin" | "d1" | "d2" | "d3";
  code: string;
  name: string;
  address: string;
  coords: [number, number];
  pct: number;
  distanceMi: number;
  eta: string;
}

export const ROUTE_STOPS: DeliveryStop[] = [
  {
    id: "origin",
    code: "Origin",
    name: "Origin Facility",
    address: "2464 Royal Ln. Mesa (Tribeca Facility)",
    coords: STREET_ROUTE_COORDINATES[0],
    pct: 0,
    distanceMi: 0,
    eta: "06:45 (Departed)",
  },
  {
    id: "d1",
    code: "D1",
    name: "Delivery Point 1",
    address: "Franklin St & Broadway Hub",
    coords: STREET_ROUTE_COORDINATES[42],
    pct: 18,
    distanceMi: 0.6,
    eta: "07:18",
  },
  {
    id: "d2",
    code: "D2",
    name: "Delivery Point 2",
    address: "Chatham Sq Distribution Hub",
    coords: STREET_ROUTE_COORDINATES[84],
    pct: 36,
    distanceMi: 1.0,
    eta: "07:35",
  },
  {
    id: "d3",
    code: "D3",
    name: "Delivery Point 3 (Final)",
    address: "Cockpit 376 (Pier 16 Seaport Terminal)",
    coords: STREET_ROUTE_COORDINATES[STREET_ROUTE_COORDINATES.length - 1],
    pct: 100,
    distanceMi: 2.9,
    eta: "01:37 (+46m)",
  },
];

export const WAYPOINT_COORDINATES = {
  origin: ROUTE_STOPS[0].coords,
  d1: ROUTE_STOPS[1].coords,
  d2: ROUTE_STOPS[2].coords,
  d3: ROUTE_STOPS[3].coords,
};

export function getInterpolatedPosition(pct: number): { lng: number; lat: number; bearing: number } {
  const clamped = Math.max(0, Math.min(100, pct));
  const total = STREET_ROUTE_COORDINATES.length - 1;
  const exact = (clamped / 100) * total;
  const base = Math.floor(exact);
  const next = Math.min(base + 1, total);
  const frac = exact - base;

  const p1 = STREET_ROUTE_COORDINATES[base];
  const p2 = STREET_ROUTE_COORDINATES[next];

  const lng = p1[0] + (p2[0] - p1[0]) * frac;
  const lat = p1[1] + (p2[1] - p1[1]) * frac;

  // Calculate angle in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  const dLng = p2[0] - p1[0];
  const dLat = p2[1] - p1[1];
  let bearing = Math.atan2(dLng, dLat) * (180 / Math.PI);
  if (bearing < 0) bearing += 360;

  return { lng, lat, bearing };
}

export function getTruckStatus(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  const totalDistance = 2.9;
  const distanceCovered = Number(((clamped / 100) * totalDistance).toFixed(1));

  let currentLocation = "Tribeca West St Terminal";
  let nextStop = ROUTE_STOPS[1]; // D1
  let nextStopDist = Math.max(0.1, Number((0.6 - distanceCovered).toFixed(1)));
  let completedCount = 0;
  let activeLeg = "Origin → D1";

  if (clamped < 18) {
    currentLocation = "Franklin St / Greenwich Corridor";
    nextStop = ROUTE_STOPS[1];
    nextStopDist = Math.max(0.1, Number((0.6 - distanceCovered).toFixed(1)));
    completedCount = 0;
    activeLeg = "Origin → D1";
  } else if (clamped < 36) {
    currentLocation = "Lafayette & Worth St Transit";
    nextStop = ROUTE_STOPS[2];
    nextStopDist = Math.max(0.1, Number((1.0 - distanceCovered).toFixed(1)));
    completedCount = 1;
    activeLeg = "D1 → D2";
  } else if (clamped < 98) {
    currentLocation = "Madison St & FDR Drive Corridor";
    nextStop = ROUTE_STOPS[3];
    nextStopDist = Math.max(0.1, Number((2.9 - distanceCovered).toFixed(1)));
    completedCount = 2;
    activeLeg = "D2 → D3";
  } else {
    currentLocation = "Pier 16 Wall St Terminal (Arrived)";
    nextStop = ROUTE_STOPS[3];
    nextStopDist = 0;
    completedCount = 3;
    activeLeg = "D3 (Final Dock)";
  }

  return {
    distanceCovered,
    totalDistance,
    currentLocation,
    nextStop,
    nextStopDist,
    completedCount,
    activeLeg,
  };
}
`;

fs.writeFileSync(path.join(__dirname, 'realStreetRoute.ts'), code);
console.log('Successfully generated realStreetRoute.ts with', coords.length, 'street road lane coordinates.');
