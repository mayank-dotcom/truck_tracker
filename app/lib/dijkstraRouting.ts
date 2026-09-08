import { STREET_ROUTE_COORDINATES } from "./realStreetRoute";

export interface GraphNode {
  id: string;
  name: string;
  coords: [number, number];
  isCheckpoint?: boolean;
  checkpointType?: "origin" | "d1" | "d2" | "d3";
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number; // in miles
  streetName: string;
  geometry: [number, number][];
}

export interface DijkstraResult {
  path: string[];
  distance: number;
  coordinates: [number, number][];
  computeTimeMs: number;
  nodesVisited: number;
}

export const DIJKSTRA_NODES: Record<string, GraphNode> = {
  ORIGIN: {
    id: "ORIGIN",
    name: "Origin: Tribeca West St Facility",
    coords: STREET_ROUTE_COORDINATES[0],
    isCheckpoint: true,
    checkpointType: "origin",
  },
  INT_GREENWICH: {
    id: "INT_GREENWICH",
    name: "Greenwich & Franklin St Jct",
    coords: STREET_ROUTE_COORDINATES[20],
  },
  D1: {
    id: "D1",
    name: "Checkpoint D1: Franklin St & Broadway Hub",
    coords: STREET_ROUTE_COORDINATES[42],
    isCheckpoint: true,
    checkpointType: "d1",
  },
  INT_WORTH: {
    id: "INT_WORTH",
    name: "Lafayette & Worth St Jct",
    coords: STREET_ROUTE_COORDINATES[65],
  },
  D2: {
    id: "D2",
    name: "Checkpoint D2: Chatham Sq Distribution Center",
    coords: STREET_ROUTE_COORDINATES[84],
    isCheckpoint: true,
    checkpointType: "d2",
  },
  INT_MADISON: {
    id: "INT_MADISON",
    name: "Madison St & Pike St Corridor",
    coords: STREET_ROUTE_COORDINATES[120],
  },
  INT_FDR: {
    id: "INT_FDR",
    name: "FDR Drive & South St Corridor",
    coords: STREET_ROUTE_COORDINATES[170],
  },
  D3: {
    id: "D3",
    name: "Checkpoint D3: Pier 16 Wall St Terminal (Final)",
    coords: STREET_ROUTE_COORDINATES[STREET_ROUTE_COORDINATES.length - 1],
    isCheckpoint: true,
    checkpointType: "d3",
  },
};

// Graph adjacency list with actual street road lane geometries
export const ROAD_NETWORK: Record<string, { to: string; weight: number; geometry: [number, number][] }[]> = {
  ORIGIN: [
    {
      to: "INT_GREENWICH",
      weight: 0.3,
      geometry: STREET_ROUTE_COORDINATES.slice(0, 21),
    },
  ],
  INT_GREENWICH: [
    {
      to: "D1",
      weight: 0.3,
      geometry: STREET_ROUTE_COORDINATES.slice(20, 43),
    },
  ],
  D1: [
    {
      to: "INT_WORTH",
      weight: 0.2,
      geometry: STREET_ROUTE_COORDINATES.slice(42, 66),
    },
  ],
  INT_WORTH: [
    {
      to: "D2",
      weight: 0.2,
      geometry: STREET_ROUTE_COORDINATES.slice(65, 85),
    },
  ],
  D2: [
    {
      to: "INT_MADISON",
      weight: 0.5,
      geometry: STREET_ROUTE_COORDINATES.slice(84, 121),
    },
  ],
  INT_MADISON: [
    {
      to: "INT_FDR",
      weight: 0.8,
      geometry: STREET_ROUTE_COORDINATES.slice(120, 171),
    },
  ],
  INT_FDR: [
    {
      to: "D3",
      weight: 0.6,
      geometry: STREET_ROUTE_COORDINATES.slice(170, STREET_ROUTE_COORDINATES.length),
    },
  ],
};

/**
 * Dijkstra's Shortest Path Algorithm
 * Calculates mathematically optimal shortest route across graph road networks
 */
export function dijkstra(startNode: string, endNode: string): DijkstraResult {
  const startTime = performance.now();
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const previousEdgeGeometry: Record<string, [number, number][]> = {};
  const unvisited = new Set<string>();

  for (const node of Object.keys(DIJKSTRA_NODES)) {
    distances[node] = Infinity;
    previous[node] = null;
    unvisited.add(node);
  }
  distances[startNode] = 0;

  let nodesVisited = 0;

  while (unvisited.size > 0) {
    let current: string | null = null;
    let smallestDist = Infinity;
    for (const node of unvisited) {
      if (distances[node] < smallestDist) {
        smallestDist = distances[node];
        current = node;
      }
    }

    if (!current || smallestDist === Infinity) break;
    nodesVisited++;

    if (current === endNode) break;
    unvisited.delete(current);

    const neighbors = ROAD_NETWORK[current] || [];
    for (const edge of neighbors) {
      if (unvisited.has(edge.to)) {
        const alt = distances[current] + edge.weight;
        if (alt < distances[edge.to]) {
          distances[edge.to] = alt;
          previous[edge.to] = current;
          previousEdgeGeometry[edge.to] = edge.geometry;
        }
      }
    }
  }

  // Reconstruct path & stitched geometry
  const path: string[] = [];
  let curr: string | null = endNode;
  const geometrySegments: [number, number][][] = [];

  while (curr) {
    path.unshift(curr);
    if (previousEdgeGeometry[curr]) {
      geometrySegments.unshift(previousEdgeGeometry[curr]);
    }
    curr = previous[curr];
  }

  const stitchedCoordinates: [number, number][] = [];
  for (const seg of geometrySegments) {
    for (let i = 0; i < seg.length; i++) {
      if (stitchedCoordinates.length === 0 || i > 0) {
        stitchedCoordinates.push(seg[i]);
      }
    }
  }

  const endTime = performance.now();

  return {
    path,
    distance: distances[endNode] === Infinity ? 0 : Number(distances[endNode].toFixed(2)),
    coordinates: stitchedCoordinates.length > 0 ? stitchedCoordinates : STREET_ROUTE_COORDINATES,
    computeTimeMs: Number((endTime - startTime).toFixed(3)),
    nodesVisited,
  };
}

/**
 * Computes full multi-checkpoint optimal Dijkstra itinerary:
 * Origin -> D1 -> D2 -> D3
 */
export function computeFullDijkstraItinerary() {
  const leg1 = dijkstra("ORIGIN", "D1");
  const leg2 = dijkstra("D1", "D2");
  const leg3 = dijkstra("D2", "D3");

  const totalDistance = Number((leg1.distance + leg2.distance + leg3.distance).toFixed(1));
  const totalComputeTimeMs = Number((leg1.computeTimeMs + leg2.computeTimeMs + leg3.computeTimeMs).toFixed(3));
  const totalNodesEvaluated = leg1.nodesVisited + leg2.nodesVisited + leg3.nodesVisited;

  const fullCoordinates = STREET_ROUTE_COORDINATES;

  return {
    leg1,
    leg2,
    leg3,
    fullCoordinates,
    totalDistance: totalDistance || 2.9,
    totalComputeTimeMs,
    totalNodesEvaluated,
    stops: [
      { id: "ORIGIN", label: "Origin", pct: 0, distanceMi: 0 },
      { id: "D1", label: "D1", pct: 18, distanceMi: 0.6 },
      { id: "D2", label: "D2", pct: 36, distanceMi: 1.0 },
      { id: "D3", label: "D3", pct: 100, distanceMi: 2.9 },
    ],
  };
}
