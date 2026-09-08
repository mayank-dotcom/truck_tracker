/**
 * High-Visibility 3D Architectural Buildings & Landmarks for Delhi NCR Logistics Corridor
 * Designed specifically for high contrast, volumetric realism, and immediate visual pop
 * on dark tactical maps (MapLibre GL JS fill-extrusion).
 */

export interface Building3DProperties {
  id: string;
  name: string;
  height: number;
  base_height: number;
  type: "logistics" | "landmark" | "commercial" | "tech";
  color: string;
  roofColor: string;
  floors: number;
  status: string;
}

export interface Building3DFeature {
  type: "Feature";
  properties: Building3DProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface Building3DCollection {
  type: "FeatureCollection";
  features: Building3DFeature[];
}

// Helper to create oriented box polygon (in [lng, lat] GeoJSON format, CCW order)
function createBox(
  centerLng: number,
  centerLat: number,
  widthM: number,
  heightM: number,
  rotationDeg = 0
): number[][] {
  const dLat = heightM / 111320 / 2;
  const dLng = widthM / (111320 * Math.cos((centerLat * Math.PI) / 180)) / 2;
  const cos = Math.cos((rotationDeg * Math.PI) / 180);
  const sin = Math.sin((rotationDeg * Math.PI) / 180);

  // Counter-Clockwise order: bottom-left, bottom-right, top-right, top-left, close
  return [
    [-dLng, -dLat],
    [dLng, -dLat],
    [dLng, dLat],
    [-dLng, dLat],
    [-dLng, -dLat],
  ].map(([dx, dy]) => [
    Number((centerLng + (dx * cos - dy * sin)).toFixed(6)),
    Number((centerLat + (dx * sin + dy * cos)).toFixed(6)),
  ]);
}

// Helper to create circular polygon for towers and spires
function createCircle(
  centerLng: number,
  centerLat: number,
  radiusM: number,
  sides = 16
): number[][] {
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((centerLat * Math.PI) / 180));
  const pts: number[][] = [];
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    pts.push([
      Number((centerLng + Math.cos(a) * dLng).toFixed(6)),
      Number((centerLat + Math.sin(a) * dLat).toFixed(6)),
    ]);
  }
  return pts;
}

export function generateDelhi3DBuildings(): Building3DCollection {
  const features: Building3DFeature[] = [];
  let idCounter = 1;

  const addBuilding = (
    name: string,
    coords: number[][],
    height: number,
    baseHeight: number,
    type: Building3DProperties["type"],
    status = "Monitored Zone"
  ) => {
    features.push({
      type: "Feature",
      properties: {
        id: `bld-${idCounter++}`,
        name,
        height,
        base_height: baseHeight,
        type,
        color: "#080c14",
        roofColor: "#0d1320",
        floors: Math.max(1, Math.round(height / 3.5)),
        status,
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    });
  };

  // ============================================================================
  // 1. ORIGIN: FOXFREIGHT CENTRAL LOGISTICS HUB
  // Origin Coordinates: lat: 28.6508, lng: 77.2373
  // Placed RIGHT IN FRONT AND SIDES OF THE TRUCK!
  // ============================================================================

  // FoxFreight Central Command Tower (95m tall, gold)
  addBuilding(
    "FoxFreight Central Command Tower",
    createBox(77.2373, 28.6515, 80, 65, 0),
    95,
    0,
    "logistics",
    "Central Fleet HQ"
  );

  // Communications Spire on top (120m Apex)
  addBuilding(
    "Central Telemetry Mast",
    createCircle(77.2373, 28.6515, 10, 10),
    120,
    95,
    "logistics",
    "Active Telemetry Spire"
  );

  // Automated Cargo Sorting Bay Alpha (Directly to the Left of truck)
  addBuilding(
    "Automated Cargo Terminal Alpha",
    createBox(77.2361, 28.6508, 110, 60, 0),
    48,
    0,
    "logistics",
    "Automated Sorting Bay"
  );

  // Automated Cargo Terminal Bravo (Directly to the Right of truck)
  addBuilding(
    "Automated Cargo Terminal Bravo",
    createBox(77.2385, 28.6508, 105, 55, 0),
    46,
    0,
    "logistics",
    "High-Capacity Loading"
  );

  // Cryo-Logistics Bay (North-west)
  addBuilding(
    "Cryo-Logistics Bay",
    createBox(77.2362, 28.6521, 80, 50, 90),
    40,
    0,
    "logistics",
    "Climate Controlled"
  );

  // Security Pylons
  addBuilding(
    "Perimeter Defense Pylon 1",
    createBox(77.2355, 28.6514, 30, 30, 0),
    60,
    0,
    "logistics",
    "Gate Security"
  );
  addBuilding(
    "Perimeter Defense Pylon 2",
    createBox(77.2391, 28.6514, 30, 30, 0),
    60,
    0,
    "logistics",
    "Gate Security"
  );

  // Connaught Place Inner & Outer Architectural Colonnades
  const cpCenter = { lng: 77.2195, lat: 28.6328 };
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    // Inner Circle blocks
    const inLng = cpCenter.lng + Math.cos(angle) * 0.0022;
    const inLat = cpCenter.lat + Math.sin(angle) * 0.0019;
    addBuilding(
      `CP Inner Colonnade ${String.fromCharCode(65 + i)}`,
      createBox(inLng, inLat, 80, 50, (angle * 180) / Math.PI + 90),
      40,
      0,
      "commercial"
    );

    // Outer Circle blocks
    const outLng = cpCenter.lng + Math.cos(angle + 0.15) * 0.0042;
    const outLat = cpCenter.lat + Math.sin(angle + 0.15) * 0.0036;
    addBuilding(
      `CP Outer Plaza Block ${i + 1}`,
      createBox(outLng, outLat, 105, 55, (angle * 180) / Math.PI + 90),
      55,
      0,
      "commercial"
    );
  }

  // Barakhamba & Tolstoy Skyscraper Avenue
  const barakhambaTowers = [
    { name: "Statesman House", lng: 77.2248, lat: 28.6315, w: 55, h: 55, ht: 92 },
    { name: "Gopal Das Bhawan", lng: 77.2272, lat: 28.6305, w: 58, h: 50, ht: 88 },
    { name: "Vijaya Building", lng: 77.2255, lat: 28.6292, w: 52, h: 50, ht: 82 },
    { name: "Kanchenjunga Tower", lng: 77.2268, lat: 28.6282, w: 50, h: 48, ht: 78 },
    { name: "Hindustan Times House", lng: 77.2228, lat: 28.6308, w: 56, h: 52, ht: 96 },
    { name: "Antriksh Bhawan", lng: 77.2215, lat: 28.6288, w: 60, h: 50, ht: 85 },
  ];
  barakhambaTowers.forEach((t) => {
    addBuilding(t.name, createBox(t.lng, t.lat, t.w, t.h, 25), t.ht, 0, "tech");
  });

  // ============================================================================
  // 2. STOP D1: INDIA GATE & METRO DISTRIBUTION HUB
  // Stop Coordinates: lat: 28.6139, lng: 77.209
  // ============================================================================

  const d1Lng = 77.209;
  const d1Lat = 28.6139;

  // India Gate Memorial Arch (60m tall, radiant imperial gold)
  addBuilding(
    "India Gate Memorial Arch",
    createBox(d1Lng + 0.0006, d1Lat + 0.0006, 50, 32, 0),
    60,
    0,
    "landmark",
    "National Monument"
  );
  // Upper Crown Cornice (68m Apex)
  addBuilding(
    "India Gate Crown Cornice",
    createBox(d1Lng + 0.0006, d1Lat + 0.0006, 52, 34, 0),
    68,
    60,
    "landmark",
    "Memorial Spire"
  );

  // Stop D1: Metro Distribution Hub
  addBuilding(
    "Metro Distribution Hub (Stop D1)",
    createBox(d1Lng - 0.0012, d1Lat - 0.0008, 100, 65, 45),
    52,
    0,
    "logistics",
    "Active Waypoint D1"
  );
  addBuilding(
    "Metro Drone Dispatch Tower",
    createBox(d1Lng - 0.0022, d1Lat + 0.0002, 45, 45, 45),
    72,
    0,
    "logistics",
    "Autonomous Dock"
  );
  addBuilding(
    "Metro Automated Sorting Wing",
    createBox(d1Lng - 0.0006, d1Lat - 0.0018, 90, 52, 135),
    42,
    0,
    "logistics"
  );

  // Central Vista Administrative Complexes
  const cvBlocks = [
    { name: "Vigyan Bhawan Annex", lng: 77.2185, lat: 28.6115, w: 95, h: 70, ht: 52 },
    { name: "Udyog Bhawan Complex", lng: 77.2145, lat: 28.6135, w: 105, h: 75, ht: 48 },
    { name: "Nirman Bhawan", lng: 77.2162, lat: 28.6152, w: 100, h: 68, ht: 46 },
    { name: "Shastri Bhawan", lng: 77.2155, lat: 28.6178, w: 110, h: 72, ht: 50 },
  ];
  cvBlocks.forEach((b) => {
    addBuilding(b.name, createBox(b.lng, b.lat, b.w, b.h, 15), b.ht, 0, "commercial");
  });

  // ============================================================================
  // 3. MID-ROUTE: RING ROAD & LAJPAT NAGAR URBAN CORRIDOR
  // ============================================================================

  const midBlocks = [
    { name: "Lodhi Institutional Center", lng: 77.2285, lat: 28.5925, w: 95, h: 65, ht: 60 },
    { name: "CGO Complex Tower A", lng: 77.2345, lat: 28.5885, w: 75, h: 65, ht: 85 },
    { name: "CGO Complex Tower B", lng: 77.2362, lat: 28.5878, w: 72, h: 60, ht: 78 },
    { name: "Paryavaran Bhawan", lng: 77.2352, lat: 28.5898, w: 80, h: 58, ht: 72 },
    { name: "Lajpat Commercial Bay 1", lng: 77.2415, lat: 28.5795, w: 98, h: 58, ht: 56 },
    { name: "Lajpat Trade Center", lng: 77.2435, lat: 28.5768, w: 88, h: 62, ht: 68 },
    { name: "Ring Road Logistics Depot", lng: 77.2458, lat: 28.5732, w: 105, h: 65, ht: 52 },
    { name: "Defence Colony Plaza", lng: 77.2392, lat: 28.5725, w: 85, h: 58, ht: 58 },
    { name: "Moolchand MedTech Center", lng: 77.2368, lat: 28.5685, w: 95, h: 70, ht: 70 },
    { name: "South Extension Commercial Block", lng: 77.2442, lat: 28.5645, w: 105, h: 58, ht: 62 },
  ];
  midBlocks.forEach((b) => {
    addBuilding(b.name, createBox(b.lng, b.lat, b.w, b.h, 35), b.ht, 0, "commercial");
  });

  // ============================================================================
  // 4. STOP D2: NEHRU PLACE HIGH-RISE SKYSCRAPER METROPOLIS
  // Stop Coordinates: lat: 28.5535, lng: 77.2588
  // ============================================================================

  const npCenter = { lng: 77.2588, lat: 28.5535 };

  // South Delhi Depot (Stop D2)
  addBuilding(
    "South Delhi Logistics Depot (Stop D2)",
    createBox(npCenter.lng + 0.0012, npCenter.lat + 0.0008, 105, 70, 20),
    58,
    0,
    "logistics",
    "Active Waypoint D2"
  );
  addBuilding(
    "Depot High-Capacity Sorting Wing",
    createBox(npCenter.lng + 0.0024, npCenter.lat + 0.0002, 85, 55, 20),
    45,
    0,
    "logistics"
  );

  // Giant Nehru Place Skyscrapers (up to 115m tall)
  const npTowers = [
    { name: "Eros Corporate Tower", lng: 77.2552, lat: 28.5495, w: 60, h: 55, ht: 110 },
    { name: "IFCI Tower", lng: 77.2575, lat: 28.5482, w: 62, h: 56, ht: 115 },
    { name: "Devika Tower", lng: 77.2542, lat: 28.5512, w: 55, h: 50, ht: 95 },
    { name: "Chiranjeev Tower", lng: 77.2532, lat: 28.5522, w: 56, h: 52, ht: 92 },
    { name: "Modi Tower", lng: 77.2562, lat: 28.5505, w: 58, h: 52, ht: 100 },
    { name: "Ansal Tower", lng: 77.2525, lat: 28.5532, w: 54, h: 50, ht: 86 },
    { name: "Hemkunt Tower", lng: 77.2518, lat: 28.5542, w: 56, h: 50, ht: 88 },
    { name: "Nehru Place Plaza A", lng: 77.2538, lat: 28.5488, w: 105, h: 65, ht: 65 },
    { name: "Nehru Place Plaza B", lng: 77.2568, lat: 28.5522, w: 110, h: 62, ht: 62 },
    { name: "Kalkaji Tech Center", lng: 77.2605, lat: 28.5515, w: 80, h: 58, ht: 78 },
  ];
  npTowers.forEach((t) => {
    addBuilding(t.name, createBox(t.lng, t.lat, t.w, t.h, 30), t.ht, 0, "tech");
    if (t.ht > 90) {
      addBuilding(
        `${t.name} Antenna Spire`,
        createCircle(t.lng, t.lat, 7, 8),
        t.ht + 20,
        t.ht,
        "tech"
      );
    }
  });

  // ============================================================================
  // 5. SOUTH DELHI & SAKET CORRIDOR (D2 -> D3)
  // ============================================================================

  const saketBlocks = [
    { name: "Greater Kailash Trade Plaza", lng: 77.2485, lat: 28.5492, w: 90, h: 60, ht: 62 },
    { name: "Chirag Delhi Innovation Hub", lng: 77.2415, lat: 28.5468, w: 100, h: 65, ht: 72 },
    { name: "Panchsheel Commercial Wing", lng: 77.2345, lat: 28.5435, w: 85, h: 58, ht: 58 },
    { name: "Hauz Khas Enclave Towers", lng: 77.2285, lat: 28.5412, w: 95, h: 62, ht: 70 },
    { name: "IIT Delhi Innovation District", lng: 77.2185, lat: 28.5385, w: 110, h: 72, ht: 75 },
    { name: "Saket District Center Tower 1", lng: 77.2155, lat: 28.5325, w: 75, h: 60, ht: 92 },
    { name: "Saket District Center Tower 2", lng: 77.2138, lat: 28.5312, w: 78, h: 55, ht: 86 },
    { name: "Select Citywalk Complex", lng: 77.2182, lat: 28.5288, w: 120, h: 90, ht: 55 },
    { name: "South Court Commercial Bay", lng: 77.2125, lat: 28.5295, w: 85, h: 58, ht: 65 },
  ];
  saketBlocks.forEach((b) => {
    addBuilding(b.name, createBox(b.lng, b.lat, b.w, b.h, 60), b.ht, 0, "commercial");
  });

  // ============================================================================
  // 6. STOP D3: QUTUB MINAR & WEST CARGO TERMINAL
  // Stop Coordinates: lat: 28.5245, lng: 77.1850
  // ============================================================================

  const qmCenter = { lng: 77.1854, lat: 28.5245 };

  // Qutub Minar: 5-Tier Stepped Tapering Cylindrical Tower (105m Apex, Radiant Gold)
  const qutubTiers = [
    { radius: 20, h: 32, bh: 0, name: "Qutub Minar Base Tier (Red Sandstone)" },
    { radius: 16, h: 54, bh: 32, name: "Qutub Minar Tier 2 (Carved Shaft)" },
    { radius: 12, h: 74, bh: 54, name: "Qutub Minar Tier 3 (Fluted Balconies)" },
    { radius: 9, h: 90, bh: 74, name: "Qutub Minar Tier 4 (Marble Inlay)" },
    { radius: 6, h: 105, bh: 90, name: "Qutub Minar Golden Apex Spire" },
  ];
  qutubTiers.forEach((tier) => {
    addBuilding(
      tier.name,
      createCircle(qmCenter.lng + 0.0006, qmCenter.lat + 0.0004, tier.radius, 16),
      tier.h,
      tier.bh,
      "landmark",
      "UNESCO Heritage Site"
    );
  });

  // Stop D3: West Cargo Terminal
  addBuilding(
    "West Cargo Terminal (Stop D3)",
    createBox(qmCenter.lng - 0.0015, qmCenter.lat - 0.0012, 110, 70, 40),
    52,
    0,
    "logistics",
    "Final Destination D3"
  );
  addBuilding(
    "West Cargo Automated Logistics Bay",
    createBox(qmCenter.lng - 0.0028, qmCenter.lat - 0.0018, 85, 58, 40),
    40,
    0,
    "logistics"
  );

  // ============================================================================
  // 7. TRANSIT CORRIDOR FLANKING BUILDINGS (160+ TALL BUILDINGS)
  // Continuous 3D streetscape along every single segment of the route!
  // ============================================================================

  const corridorWaypoints = [
    { lng: 77.2373, lat: 28.6508 },
    { lng: 77.2345, lat: 28.6465 },
    { lng: 77.2298, lat: 28.6412 },
    { lng: 77.2252, lat: 28.6358 },
    { lng: 77.2198, lat: 28.6295 },
    { lng: 77.2148, lat: 28.6225 },
    { lng: 77.2115, lat: 28.618 },
    { lng: 77.209, lat: 28.6139 },
    { lng: 77.2155, lat: 28.6085 },
    { lng: 77.2225, lat: 28.601 },
    { lng: 77.2305, lat: 28.5935 },
    { lng: 77.2395, lat: 28.5845 },
    { lng: 77.248, lat: 28.5738 },
    { lng: 77.254, lat: 28.5635 },
    { lng: 77.2588, lat: 28.5535 },
    { lng: 77.252, lat: 28.5515 },
    { lng: 77.2425, lat: 28.5485 },
    { lng: 77.232, lat: 28.5445 },
    { lng: 77.2195, lat: 28.5398 },
    { lng: 77.208, lat: 28.5352 },
    { lng: 77.196, lat: 28.5298 },
    { lng: 77.185, lat: 28.5245 },
  ];

  for (let i = 0; i < corridorWaypoints.length - 1; i++) {
    const p1 = corridorWaypoints[i];
    const p2 = corridorWaypoints[i + 1];

    const dx = p2.lng - p1.lng;
    const dy = p2.lat - p1.lat;
    const angle = Math.atan2(dy, dx);
    const deg = (angle * 180) / Math.PI;

    // Normal vector perpendicular to road
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);

    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const roadLng = p1.lng + dx * t;
      const roadLat = p1.lat + dy * t;

      // Left side building (offset ~45-65m)
      const offsetMLeft = 45 + ((s * 17) % 20);
      const dLngL = (offsetMLeft * nx) / (111320 * Math.cos((roadLat * Math.PI) / 180));
      const dLatL = (offsetMLeft * ny) / 111320;
      const heightL = 45 + ((s * 29 + i * 13) % 52);

      addBuilding(
        `Sector ${i + 1} Urban Tower L-${s}`,
        createBox(roadLng + dLngL, roadLat + dLatL, 55 + (s % 3) * 14, 45 + (i % 3) * 10, deg),
        heightL,
        0,
        heightL > 65 ? "tech" : "commercial"
      );

      // Right side building (offset ~45-65m)
      const offsetMRight = -(48 + ((s * 23) % 20));
      const dLngR = (offsetMRight * nx) / (111320 * Math.cos((roadLat * Math.PI) / 180));
      const dLatR = (offsetMRight * ny) / 111320;
      const heightR = 42 + ((s * 31 + i * 19) % 55);

      addBuilding(
        `Sector ${i + 1} Commercial Bay R-${s}`,
        createBox(roadLng + dLngR, roadLat + dLatR, 58 + (i % 3) * 12, 48 + (s % 3) * 10, deg),
        heightR,
        0,
        "commercial"
      );
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
