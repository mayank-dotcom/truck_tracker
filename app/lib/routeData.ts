import { RouteData, Coordinates } from "../types/tracking";

// Interpolate points between two coordinates for smooth animation
function interpolatePoints(
  from: Coordinates,
  to: Coordinates,
  numPoints: number
): Coordinates[] {
  const points: Coordinates[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t,
    });
  }
  return points;
}

// Delhi NCR logistics route
const origin: Coordinates = { lat: 28.6508, lng: 77.2373 }; // Connaught Place (Warehouse)
const d1: Coordinates = { lat: 28.6139, lng: 77.209 }; // India Gate area
const d2: Coordinates = { lat: 28.5535, lng: 77.2588 }; // Nehru Place
const d3: Coordinates = { lat: 28.5245, lng: 77.185 }; // Qutub Minar area

// Create waypoints for more realistic route paths
const originToD1Waypoints: Coordinates[] = [
  origin,
  { lat: 28.6465, lng: 77.2345 },
  { lat: 28.6412, lng: 77.2298 },
  { lat: 28.6358, lng: 77.2252 },
  { lat: 28.6295, lng: 77.2198 },
  { lat: 28.6225, lng: 77.2148 },
  { lat: 28.618, lng: 77.2115 },
  d1,
];

const d1ToD2Waypoints: Coordinates[] = [
  d1,
  { lat: 28.6085, lng: 77.2155 },
  { lat: 28.601, lng: 77.2225 },
  { lat: 28.5935, lng: 77.2305 },
  { lat: 28.5845, lng: 77.2395 },
  { lat: 28.5738, lng: 77.248 },
  { lat: 28.5635, lng: 77.254 },
  d2,
];

const d2ToD3Waypoints: Coordinates[] = [
  d2,
  { lat: 28.5515, lng: 77.252 },
  { lat: 28.5485, lng: 77.2425 },
  { lat: 28.5445, lng: 77.232 },
  { lat: 28.5398, lng: 77.2195 },
  { lat: 28.5352, lng: 77.208 },
  { lat: 28.5298, lng: 77.196 },
  d3,
];

// Interpolate between waypoints for smoother animation
function buildSmoothPath(waypoints: Coordinates[]): Coordinates[] {
  const smooth: Coordinates[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = interpolatePoints(waypoints[i], waypoints[i + 1], 8);
    // Avoid duplicating the connecting point
    if (i > 0) segment.shift();
    smooth.push(...segment);
  }
  return smooth;
}

export const routeData: RouteData = {
  truckId: "FF-TRK-4200",
  driverName: "Rajesh Kumar",
  origin: {
    id: "origin",
    label: "ORIGIN",
    name: "FoxFreight Warehouse",
    address: "Connaught Place, New Delhi",
    coordinates: origin,
    estimatedArrival: "--",
    status: "completed",
  },
  deliveryStops: [
    {
      id: "d1",
      label: "D1",
      name: "Metro Distribution Hub",
      address: "India Gate, New Delhi",
      coordinates: d1,
      estimatedArrival: "10:30 AM",
      status: "upcoming",
    },
    {
      id: "d2",
      label: "D2",
      name: "South Delhi Depot",
      address: "Nehru Place, New Delhi",
      coordinates: d2,
      estimatedArrival: "11:45 AM",
      status: "upcoming",
    },
    {
      id: "d3",
      label: "D3",
      name: "Heritage Logistics Point",
      address: "Qutub Minar, New Delhi",
      coordinates: d3,
      estimatedArrival: "01:15 PM",
      status: "upcoming",
    },
  ],
  routeSegments: [
    {
      from: origin,
      to: d1,
      points: buildSmoothPath(originToD1Waypoints),
    },
    {
      from: d1,
      to: d2,
      points: buildSmoothPath(d1ToD2Waypoints),
    },
    {
      from: d2,
      to: d3,
      points: buildSmoothPath(d2ToD3Waypoints),
    },
  ],
  totalDistance: 22.4,
};

// Build the full route path (all points concatenated)
export function getFullRoutePath(): Coordinates[] {
  const allPoints: Coordinates[] = [];
  for (let i = 0; i < routeData.routeSegments.length; i++) {
    const seg = routeData.routeSegments[i];
    if (i === 0) {
      allPoints.push(...seg.points);
    } else {
      // Skip first point of subsequent segments to avoid duplicate
      allPoints.push(...seg.points.slice(1));
    }
  }
  return allPoints;
}

// Calculate distance between two coords in km (Haversine)
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng *
      sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Get cumulative distances at each point in route
export function getCumulativeDistances(path: Coordinates[]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    distances.push(distances[i - 1] + haversineDistance(path[i - 1], path[i]));
  }
  return distances;
}

// Calculate bearing between two coordinates
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
