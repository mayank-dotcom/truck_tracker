"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Maximize2,
  Minimize2,
  X,
  Play,
  Pause,
  List,
  GitFork,
  Map as MapIcon,
  Plus,
  Minus,
  Navigation,
  Layers,
  Compass,
  Cpu,
  Moon,
  Sun,
} from "lucide-react";
import TruckLengthIcon from '@iconify-react/iconoir/truck-length';
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  getStaticRouteByScenario,
  getInterpolatedRoutePosition,
  ScenarioCheckpoint,
} from "../lib/staticRoutes";

interface CockpitMapProps {
  orderId?: string;
  activeScenario?: string;
  isTracking?: boolean;
  isOptimizerActive?: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onCloseOrder?: () => void;
  onShowToast?: (msg: string) => void;
}

// 100% Free, Zero API Key, Zero Watermark Professional Basemap Style (ArcGIS Canvas World Tiles)
const MASTER_MAP_STYLE: any = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, Esri",
      maxzoom: 19,
    },
    "carto-light-ref": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    "carto-dark": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors, Esri",
      maxzoom: 19,
    },
    "carto-dark-ref": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "map-base-bg",
      type: "background",
      paint: { "background-color": "#f8fafc" },
    },
    {
      id: "carto-light-layer",
      type: "raster",
      source: "carto-light",
      minzoom: 0,
      maxzoom: 22,
      paint: { "raster-opacity": 1, "raster-opacity-transition": { duration: 250 } },
    },
    {
      id: "carto-light-ref-layer",
      type: "raster",
      source: "carto-light-ref",
      minzoom: 0,
      maxzoom: 22,
      paint: { "raster-opacity": 1, "raster-opacity-transition": { duration: 250 } },
    },
    {
      id: "carto-dark-layer",
      type: "raster",
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 22,
      paint: { "raster-opacity": 0, "raster-opacity-transition": { duration: 250 } },
    },
    {
      id: "carto-dark-ref-layer",
      type: "raster",
      source: "carto-dark-ref",
      minzoom: 0,
      maxzoom: 22,
      paint: { "raster-opacity": 0, "raster-opacity-transition": { duration: 250 } },
    },
  ],
};

// 1. Solid Royal Blue Leaf / Teardrop Pin (For Origin & Destination)
function createBlueLeafPin(titleText: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "cockpit-blue-leaf-pin";
  el.title = titleText;
  el.style.cssText = "width: 32px; height: 38px; cursor: pointer; user-select: none; position: relative; display: block; margin: 0; padding: 0;";
  el.innerHTML = `
    <div style="position: relative; width: 32px; height: 38px; display: flex; align-items: center; justify-content: center;">
      <svg viewBox="0 0 32 38" width="32" height="38" style="position: absolute; top: 0; left: 0; filter: drop-shadow(0 4px 8px rgba(37, 99, 235, 0.45)); display: block;">
        <path d="M 16 2 C 7.5 2 1 8.5 1 17 C 1 26.5 16 38 16 38 C 16 38 31 26.5 31 17 C 31 8.5 24.5 2 16 2 Z"
              fill="#2563eb"
              stroke="#1d4ed8"
              stroke-width="1.8"
        />
        <circle cx="16" cy="16" r="4.5" fill="#ffffff" />
      </svg>
      <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 6px; height: 6px; border-radius: 50%; background: #0f172a;"></div>
    </div>
  `;
  return el;
}

// 2. Translucent Circular Halo Checkpoint Marker (For D1 & D2)
function createHaloCheckpointMarker(label: string, titleText: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "cockpit-halo-checkpoint";
  el.title = titleText;
  el.style.cssText = "width: 38px; height: 38px; cursor: pointer; user-select: none; position: relative; display: flex; align-items: center; justify-content: center;";
  el.innerHTML = `
    <div class="pin-pulse-wave"></div>
    <div class="halo-circle" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(148, 163, 184, 0.32); border: 1.5px solid rgba(148, 163, 184, 0.55); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: all 0.25s ease;">
      <div class="halo-inner-dot" style="width: 5.5px; height: 5.5px; border-radius: 50%; background: #0f172a; transition: all 0.25s ease;"></div>
    </div>
    <span class="pin-label-text" style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: 8px; color: #1e293b; background: rgba(255,255,255,0.92); padding: 1px 4px; border-radius: 3px; border: 1px solid #e2e8f0; white-space: nowrap; pointer-events: none; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.25s ease;">${label}</span>
  `;
  return el;
}



// 4. Directional Chevron Arrow on Route
function createRouteChevron(bearing: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "route-chevron-arrow";
  el.style.cssText = "width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; pointer-events: none;";
  el.innerHTML = `
    <svg viewBox="0 0 16 16" width="11" height="11" style="transform: rotate(${bearing}deg); filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35));">
      <polygon points="8,1 15,15 8,11 1,15" fill="#0f172a" />
    </svg>
  `;
  return el;
}

function getDynamicTruckStatus(
  stops: ScenarioCheckpoint[],
  totalDistance: number,
  pct: number
) {
  const clamped = Math.max(0, Math.min(100, pct));
  const distanceCovered = Number(((clamped / 100) * totalDistance).toFixed(1));

  const d1Pct = stops[1]?.pct || 25;
  const d2Pct = stops[2]?.pct || 60;

  let currentLocation = stops[0]?.name || "Origin Terminal";
  let nextStop = stops[1] || stops[0];
  let nextStopDist = Math.max(0.1, Number(((stops[1]?.distanceMi || 0.7) - distanceCovered).toFixed(1)));
  let completedCount = 0;
  let activeLeg = `${stops[0]?.code} → ${stops[1]?.code}`;

  if (clamped < d1Pct) {
    currentLocation = `${stops[0]?.name.replace("Origin: ", "")} Corridor`;
    nextStop = stops[1];
    nextStopDist = Math.max(0.1, Number(((stops[1]?.distanceMi || 0.7) - distanceCovered).toFixed(1)));
    completedCount = 0;
    activeLeg = `${stops[0]?.code} → ${stops[1]?.code}`;
  } else if (clamped < d2Pct) {
    currentLocation = `${stops[1]?.name.replace("Checkpoint D1: ", "")} Transit`;
    nextStop = stops[2];
    nextStopDist = Math.max(0.1, Number(((stops[2]?.distanceMi || 1.7) - distanceCovered).toFixed(1)));
    completedCount = 1;
    activeLeg = `${stops[1]?.code} → ${stops[2]?.code}`;
  } else if (clamped < 98) {
    currentLocation = `${stops[2]?.name.replace("Checkpoint D2: ", "")} Corridor`;
    nextStop = stops[3];
    nextStopDist = Math.max(0.1, Number((totalDistance - distanceCovered).toFixed(1)));
    completedCount = 2;
    activeLeg = `${stops[2]?.code} → ${stops[3]?.code}`;
  } else {
    currentLocation = `${stops[3]?.name.replace("Checkpoint D3: ", "")} (Arrived)`;
    nextStop = stops[3];
    nextStopDist = 0;
    completedCount = 3;
    activeLeg = `${stops[3]?.code} (Final Dock)`;
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

export default function CockpitMap({
  orderId = "UTD38723",
  activeScenario = "PB-LP-PB Scenario",
  isTracking = true,
  isOptimizerActive = true,
  isDarkMode = false,
  onToggleDarkMode,
  onCloseOrder,
  onShowToast,
}: CockpitMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);
  const scrubberTrackRef = useRef<HTMLDivElement>(null);

  // References to stop marker elements for dynamic status & celebration animations
  const originMarkerRef = useRef<any>(null);
  const d1MarkerRef = useRef<any>(null);
  const d2MarkerRef = useRef<any>(null);
  const d3MarkerRef = useRef<any>(null);
  const chevronMarkersRef = useRef<any[]>([]);

  const d1MarkerElRef = useRef<HTMLDivElement | null>(null);
  const d2MarkerElRef = useRef<HTMLDivElement | null>(null);
  const d3MarkerElRef = useRef<HTMLDivElement | null>(null);

  // Track checkpoint celebration trigger state to prevent duplicate toasts
  const lastCrossedCheckpointRef = useRef<string | null>(null);

  // Dynamic Dijkstra Itinerary State
  const [currentItinerary, setCurrentItinerary] = useState(() =>
    getStaticRouteByScenario(activeScenario)
  );
  const currentItineraryRef = useRef(currentItinerary);
  currentItineraryRef.current = currentItinerary;

  // Ref to always hold latest updateTruckPosition so setInterval never goes stale
  const updateTruckPositionRef = useRef<(pct: number) => void>(() => {});

  // Track the last scenario we actually applied to the map. Guards against the
  // reload effect re-firing when onShowToast/onCloseOrder change identity after
  // checkpoint toasts trigger a parent re-render (which otherwise resets progress
  // to 0 just as the truck crosses D1 -> truck keeps snapping back to origin).
  const appliedScenarioRef = useRef<string | null>(null);

  // Live dark-mode flag so the map style / layer colors stay in sync across
  // closures bound at mount time (initLayers, error fallback, etc.).
  const isDarkModeRef = useRef<boolean>(isDarkMode);
  isDarkModeRef.current = isDarkMode;

  // DOM markers (pins, truck) survive basemap style changes — create them once.
  const markersCreatedRef = useRef<boolean>(false);

  const [progress, setProgress] = useState<number>(20); // Percentage along route (0 to 100)
  const progressRef = useRef<number>(progress);
  progressRef.current = progress;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showOptimizationCard, setShowOptimizationCard] = useState<boolean>(true);
  const [isPlanApplied, setIsPlanApplied] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showWaypointsList, setShowWaypointsList] = useState<boolean>(false);
  const [showOrderTelemetry, setShowOrderTelemetry] = useState<boolean>(false);
  const [showTrafficLayer, setShowTrafficLayer] = useState<boolean>(true);

  // Compute real-time truck status
  const truckStatus = getDynamicTruckStatus(
    currentItinerary.stops,
    currentItinerary.totalDistance,
    progress
  );

  // Helper to place directional chevron arrows along route
  const updateChevrons = useCallback((map: any, coords: [number, number][]) => {
    chevronMarkersRef.current.forEach((m) => m.remove());
    chevronMarkersRef.current = [];
    if (!coords || coords.length < 5) return;
    const step = Math.max(10, Math.floor(coords.length / 7));
    for (let idx = step; idx < coords.length - 2; idx += step) {
      const p1 = coords[idx];
      const p2 = coords[idx + 1];
      const dLng = p2[0] - p1[0];
      const dLat = p2[1] - p1[1];
      let b = Math.atan2(dLng, dLat) * (180 / Math.PI);
      if (b < 0) b += 360;

      const chEl = createRouteChevron(b);
      const marker = new maplibregl.Marker({ element: chEl, anchor: "center" })
        .setLngLat(p1)
        .addTo(map);
      chevronMarkersRef.current.push(marker);
    }
  }, []);

  // Helper to fit map bounds to the exact route coordinates with optimal padding
  const fitRouteBounds = useCallback((duration: number = 500) => {
    if (!mapRef.current) return;
    const bounds = new maplibregl.LngLatBounds();
    currentItineraryRef.current.fullCoordinates.forEach((coord) => bounds.extend(coord));
    mapRef.current.fitBounds(bounds, {
      padding: { top: 70, bottom: 90, left: 60, right: 60 },
      maxZoom: 15.5,
      duration,
    });
  }, []);

  // Seamless zero-latency theme updater using setPaintProperty (preserves GeoJSON path layers)
  const applyThemeColors = useCallback((dark: boolean) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    try {
      if (map.getLayer("carto-light-layer")) {
        map.setPaintProperty("carto-light-layer", "raster-opacity", dark ? 0 : 1);
      }
      if (map.getLayer("carto-light-ref-layer")) {
        map.setPaintProperty("carto-light-ref-layer", "raster-opacity", dark ? 0 : 1);
      }
      if (map.getLayer("carto-dark-layer")) {
        map.setPaintProperty("carto-dark-layer", "raster-opacity", dark ? 1 : 0);
      }
      if (map.getLayer("carto-dark-ref-layer")) {
        map.setPaintProperty("carto-dark-ref-layer", "raster-opacity", dark ? 1 : 0);
      }
      if (map.getLayer("map-base-bg")) {
        map.setPaintProperty("map-base-bg", "background-color", dark ? "#111111" : "#f8fafc");
      }
      if (map.getLayer("route-casing-normal")) {
        map.setPaintProperty("route-casing-normal", "line-color", dark ? "#262626" : "#ffffff");
      }
      if (map.getLayer("route-line-normal")) {
        map.setPaintProperty("route-line-normal", "line-color", dark ? "#e5e5e5" : "#0f172a");
      }
    } catch (err) {
      console.warn("Failed to apply theme colors:", err);
    }
  }, []);

  // Initialize MapLibre with clean light/dark cartographic style & auto-fit
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // maplibre-gl v6 loads its Web Worker from a sibling file resolved via
    // import.meta.url, which bundlers cannot reliably resolve. Serve the worker
    // from /public and point maplibre at it so GeoJSON sources actually render.
    if (typeof window !== "undefined") {
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
    }

    const bounds = new maplibregl.LngLatBounds();
    currentItineraryRef.current.fullCoordinates.forEach((coord) => bounds.extend(coord));

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MASTER_MAP_STYLE,
      center: [-74.004, 40.712],
      zoom: 14,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    let isInitialized = false;

    const initLayers = () => {
      if (!map.isStyleLoaded()) return;
      isInitialized = true;

      const itinerary = currentItineraryRef.current;
      const dark = isDarkModeRef.current;
      const needsLayers = !map.getSource("route-normal");

      // Sources/layers are wiped on every setStyle() — rebuild when missing so the
      // switch between light/dark basemaps keeps the route rendered.
      if (needsLayers) {
        // 1. Main Dijkstra Planned Route Line (Solid Bold Jet-Black Road Corridor)
        map.addSource("route-normal", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: itinerary.fullCoordinates,
            },
          },
        });

        // Planned Route Outer Casing (high contrast rim around the core line)
        map.addLayer({
          id: "route-casing-normal",
          type: "line",
          source: "route-normal",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": dark ? "#262626" : "#ffffff",
            "line-width": 9,
            "line-opacity": 1,
          },
        });

        // Planned Route Core Line (bold & clearly visible on either basemap)
        map.addLayer({
          id: "route-line-normal",
          type: "line",
          source: "route-normal",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": dark ? "#e5e5e5" : "#0f172a",
            "line-width": 5.5,
            "line-opacity": 1,
          },
        });


        const currentPct = progressRef.current;
        const initialIdx = Math.max(1, Math.floor((currentPct / 100) * (itinerary.fullCoordinates.length - 1)));
        const initialTraveledCoords = itinerary.fullCoordinates.slice(0, initialIdx + 1);

        map.addSource("route-traveled", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: initialTraveledCoords,
            },
          },
        });

        // Traveled Path Solid Lime Yellow Trail (Clean, sharp, no blur/glow)
        map.addLayer({
          id: "route-traveled-line",
          type: "line",
          source: "route-traveled",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#faff02",
            "line-width": 5.5,
            "line-opacity": 1,
          },
        });

        // 5. Directional Arrow Chevrons along route
        updateChevrons(map, itinerary.fullCoordinates);
      }

      // DOM markers survive style changes; only add them on the very first load.
      if (!markersCreatedRef.current) {
        // 6. Origin Solid Blue Teardrop Leaf Pin (Top Left)
        const originEl = createBlueLeafPin(itinerary.stops[0].name);
        originMarkerRef.current = new maplibregl.Marker({ element: originEl, anchor: "bottom" })
          .setLngLat(itinerary.waypoints.origin)
          .addTo(map);

        // 8. Delivery Point 1 (D1) Translucent Halo Checkpoint
        const d1El = createHaloCheckpointMarker("D1", itinerary.stops[1].name);
        d1MarkerElRef.current = d1El;
        d1MarkerRef.current = new maplibregl.Marker({ element: d1El, anchor: "center" })
          .setLngLat(itinerary.waypoints.d1)
          .addTo(map);

        // 9. Delivery Point 2 (D2) Translucent Halo Checkpoint
        const d2El = createHaloCheckpointMarker("D2", itinerary.stops[2].name);
        d2MarkerElRef.current = d2El;
        d2MarkerRef.current = new maplibregl.Marker({ element: d2El, anchor: "center" })
          .setLngLat(itinerary.waypoints.d2)
          .addTo(map);

        // 10. Delivery Point 3 (D3 - Destination) Solid Blue Teardrop Leaf Pin (Bottom Right)
        const d3El = createBlueLeafPin(itinerary.stops[3].name);
        d3MarkerElRef.current = d3El;
        d3MarkerRef.current = new maplibregl.Marker({ element: d3El, anchor: "bottom" })
          .setLngLat(itinerary.waypoints.d3)
          .addTo(map);

        // 11. Active Directional Truck Marker with Topview Vehicle Asset
        const truckEl = document.createElement("div");
        truckEl.className = "cockpit-active-truck-marker";
        truckEl.title = `FoxFreight Truck - Travelling: ${itinerary.name}`;
        truckEl.innerHTML = `
          <div class="truck-heading-ring"></div>
          <div class="truck-topview-wrapper">
            <img src="/images/topview.png" alt="FoxFreight Truck" class="truck-topview-image" />
          </div>
        `;
        const initialPos = getInterpolatedRoutePosition(itinerary.fullCoordinates, progress);
        truckMarkerRef.current = new maplibregl.Marker({ element: truckEl, anchor: "center" })
          .setLngLat([initialPos.lng, initialPos.lat])
          .addTo(map);

        const vehicleEl = truckEl.querySelector(".truck-topview-wrapper") as HTMLElement | null;
        if (vehicleEl) {
          vehicleEl.style.transform = `rotate(${initialPos.bearing + 90}deg)`;
        }

        markersCreatedRef.current = true;
      } else {
        // Re-anchor existing markers to the current itinerary after a rebuild.
        originMarkerRef.current?.setLngLat(itinerary.waypoints.origin);
        d1MarkerRef.current?.setLngLat(itinerary.waypoints.d1);
        d2MarkerRef.current?.setLngLat(itinerary.waypoints.d2);
        d3MarkerRef.current?.setLngLat(itinerary.waypoints.d3);
      }

      // Auto-fit bounds once initial rendering is ready
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 90, left: 60, right: 60 },
        maxZoom: 15.5,
        duration: 0,
      });

      // Immediately paint the traveled path at current progress
      updateTruckPositionRef.current(progress);

      // Apply theme-specific layer opacities and line colors
      applyThemeColors(isDarkModeRef.current);

      // Trigger a resize after 100ms to guarantee complete raster tile coverage
      setTimeout(() => {
        map.resize();
      }, 100);
    };

    map.on("load", initLayers);
    map.on("style.load", initLayers);
    map.on("styledata", () => {
      if (map.isStyleLoaded()) {
        initLayers();
      }
    });
    if (map.isStyleLoaded()) {
      initLayers();
    }

    mapRef.current = map;

    // ResizeObserver ensures the map always fits the container whenever resized
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markersCreatedRef.current = false;
    };
  }, [applyThemeColors]);

  // Update map and route layers whenever activeScenario changes (only on real change)
  useEffect(() => {
    if (appliedScenarioRef.current === activeScenario) return;
    appliedScenarioRef.current = activeScenario;

    const nextItinerary = getStaticRouteByScenario(activeScenario);
    setCurrentItinerary(nextItinerary);
    currentItineraryRef.current = nextItinerary;
    setProgress(0);
    lastCrossedCheckpointRef.current = null;

    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      const map = mapRef.current;
      try {
        // 1. Update planned route LineString GeoJSON
        const normalSource = map.getSource("route-normal") as maplibregl.GeoJSONSource | undefined;
        if (normalSource && typeof normalSource.setData === "function") {
          normalSource.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: nextItinerary.fullCoordinates,
            },
          });
        }



        // 3. Move checkpoint markers to new Origin, D1, D2, D3 coordinates
        originMarkerRef.current?.setLngLat(nextItinerary.waypoints.origin);
        d1MarkerRef.current?.setLngLat(nextItinerary.waypoints.d1);
        d2MarkerRef.current?.setLngLat(nextItinerary.waypoints.d2);
        d3MarkerRef.current?.setLngLat(nextItinerary.waypoints.d3);

        // Reset badge texts
        if (d1MarkerElRef.current) {
          const lbl = d1MarkerElRef.current.querySelector(".pin-label-text");
          if (lbl) lbl.textContent = "D1";
          d1MarkerElRef.current.classList.remove("completed", "checkpoint-pulse-active");
        }
        if (d2MarkerElRef.current) {
          const lbl = d2MarkerElRef.current.querySelector(".pin-label-text");
          if (lbl) lbl.textContent = "D2";
          d2MarkerElRef.current.classList.remove("completed", "checkpoint-pulse-active");
        }
        if (d3MarkerElRef.current) {
          const lbl = d3MarkerElRef.current.querySelector(".pin-label-text");
          if (lbl) lbl.textContent = "D3";
          d3MarkerElRef.current.classList.remove("completed", "checkpoint-pulse-active");
        }

        // 4. Update chevrons along new path
        updateChevrons(map, nextItinerary.fullCoordinates);

        // 5. Smoothly fit map bounds to the new shortest path route
        const bounds = new maplibregl.LngLatBounds();
        nextItinerary.fullCoordinates.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, {
          padding: { top: 70, bottom: 90, left: 60, right: 60 },
          maxZoom: 15.5,
          duration: 750,
        });

        updateTruckPositionRef.current(0);
        onShowToast?.(`Route Loaded: ${nextItinerary.name} (${nextItinerary.totalDistance} mi)`);
      } catch (err) {
        console.error("Error updating route scenario on map:", err);
      }
    }
  }, [activeScenario]);

  // Re-fit bounds and resize map when toggling maximize
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current.resize();
      fitRouteBounds(350);
    }, 80);
    return () => clearTimeout(timer);
  }, [isMaximized, fitRouteBounds]);

  // Seamless zero-latency theme switching without destroying GeoJSON layers/path
  const appliedThemeRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (appliedThemeRef.current === isDarkMode) return;
    appliedThemeRef.current = isDarkMode;
    applyThemeColors(isDarkMode);
    onShowToast?.(isDarkMode ? "Dark mode enabled" : "Light mode enabled");
  }, [isDarkMode, applyThemeColors]);

  // Update truck position, heading angle, dynamic path drawing, and checkpoint animations
  const updateTruckPosition = useCallback((pct: number) => {
    const coords = currentItineraryRef.current.fullCoordinates;
    const { lng, lat, bearing } = getInterpolatedRoutePosition(coords, pct);

    // 1. Move truck marker & rotate topview vehicle
    if (truckMarkerRef.current) {
      truckMarkerRef.current.setLngLat([lng, lat]);
      const vehicleEl = truckMarkerRef.current.getElement().querySelector(".truck-topview-wrapper") as HTMLElement | null;
      if (vehicleEl) {
        vehicleEl.style.transform = `rotate(${bearing + 90}deg)`;
      }
    }

    // 2. Dynamic Traveled Path Drawing on Map (Draws LIVE behind the truck)
    const map = mapRef.current;
    if (map) {
      try {
        const traveledSrc = map.getSource("route-traveled") as maplibregl.GeoJSONSource | undefined;
        if (traveledSrc && typeof traveledSrc.setData === "function") {
          const totalIdx = coords.length - 1;
          const baseIdx = Math.floor((pct / 100) * totalIdx);
          const currentCoords: [number, number][] =
            pct >= 100
              ? [...coords]
              : [...coords.slice(0, baseIdx + 1), [lng, lat]];
          traveledSrc.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: currentCoords,
            },
          });
        }
      } catch {
        // Safe failover
      }
    }

    // 3. Checkpoint Crossing Animations & Dynamic Badge Updates
    const stops = currentItineraryRef.current.stops;
    const d1Pct = stops[1]?.pct || 25;
    const d2Pct = stops[2]?.pct || 60;
    const d3Pct = stops[3]?.pct || 100;

    if (d1MarkerElRef.current) {
      const isD1Done = pct >= d1Pct;
      const isCrossingD1 = pct >= d1Pct - 2 && pct <= d1Pct + 2;
      d1MarkerElRef.current.classList.toggle("completed", isD1Done);
      d1MarkerElRef.current.classList.toggle("checkpoint-pulse-active", isCrossingD1);
      const label = d1MarkerElRef.current.querySelector(".pin-label-text");
      if (label) label.textContent = isD1Done ? "D1 ✓" : "D1";

      if (isCrossingD1 && lastCrossedCheckpointRef.current !== "D1") {
        lastCrossedCheckpointRef.current = "D1";
        setTimeout(() => {
          onShowToast?.(`🎯 Checkpoint D1 Reached: ${stops[1].name} — Unloaded ✓`);
        }, 0);
      }
    }

    if (d2MarkerElRef.current) {
      const isD2Done = pct >= d2Pct;
      const isCrossingD2 = pct >= d2Pct - 2 && pct <= d2Pct + 2;
      d2MarkerElRef.current.classList.toggle("completed", isD2Done);
      d2MarkerElRef.current.classList.toggle("checkpoint-pulse-active", isCrossingD2);
      const label = d2MarkerElRef.current.querySelector(".pin-label-text");
      if (label) label.textContent = isD2Done ? "D2 ✓" : "D2";

      if (isCrossingD2 && lastCrossedCheckpointRef.current !== "D2") {
        lastCrossedCheckpointRef.current = "D2";
        setTimeout(() => {
          onShowToast?.(`🎯 Checkpoint D2 Reached: ${stops[2].name} — Unloaded ✓`);
        }, 0);
      }
    }

    if (d3MarkerElRef.current) {
      const isD3Done = pct >= d3Pct;
      const isCrossingD3 = pct >= d3Pct - 1;
      d3MarkerElRef.current.classList.toggle("completed", isD3Done);
      d3MarkerElRef.current.classList.toggle("checkpoint-pulse-active", isCrossingD3);
      const label = d3MarkerElRef.current.querySelector(".pin-label-text");
      if (label) label.textContent = isD3Done ? "D3 ✓" : "D3";

      if (isCrossingD3 && lastCrossedCheckpointRef.current !== "D3") {
        lastCrossedCheckpointRef.current = "D3";
        setTimeout(() => {
          onShowToast?.(`🏁 Final Destination D3 Reached: ${stops[3].name} — Route Complete! +$1,100`);
        }, 0);
      }
    }

    // Reset crossing ref when looped back to start
    if (pct < 10) {
      lastCrossedCheckpointRef.current = null;
    }
  }, [onShowToast]);

  // Keep ref always pointing to latest version (avoids stale closure in setInterval)
  useEffect(() => {
    updateTruckPositionRef.current = updateTruckPosition;
  }, [updateTruckPosition]);

  // Animate truck along route (Origin -> D1 -> D2 -> D3)
  // Increment progress on a timer; position updates happen in the effect below.
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        let next = prev + 0.3;
        if (next > 100) next = 0;
        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Apply the latest progress to the truck marker & traveled path every time it changes.
  // (Keeps the position side-effect out of the state updater, so it can never be
  //  dropped or double-invoked by React's StrictMode/production reducers.)
  useEffect(() => {
    updateTruckPositionRef.current(progress);
  }, [progress]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 250 });
    onShowToast?.("Zoomed in map view");
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 250 });
    onShowToast?.("Zoomed out map view");
  };

  const handleToggle3D = () => {
    if (!mapRef.current) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    if (next3D) {
      mapRef.current.easeTo({
        pitch: 52,
        bearing: -18,
        duration: 700,
      });
      onShowToast?.("3D Isometric Perspective Enabled");
    } else {
      mapRef.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 700,
      });
      onShowToast?.("2D Flat Plan Perspective Enabled");
    }
  };

  const handleResetCamera = () => {
    fitRouteBounds(600);
    onShowToast?.("Camera auto-aligned to Dijkstra optimal route");
  };



  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberTrackRef.current) return;
    const rect = scrubberTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    setProgress(newPct);
    updateTruckPosition(newPct);
    onShowToast?.(`Scrubbed timeline to ${Math.round(newPct)}% route progress`);
  };

  const handleApplyPlan = () => {
    setIsPlanApplied(true);
    onShowToast?.("Dijkstra Optimization Applied: +$1,100 revenue booked, shortest path active!");
  };

  return (
    <div
      className={`cockpit-map-card ${isMaximized ? "maximized-view" : ""}`}
      id="cockpit-map-card"
    >
      {/* 1. Base Map Container (Full bleed background layer) */}
      <div ref={mapContainer} className="cockpit-map-canvas" />

      {/* 2. Top-Right Floating Controls (Telemetry & Fullscreen) */}
      <div className="map-top-bar" style={{ justifyContent: "flex-end" }}>
        <div className="map-top-actions">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            className={`map-util-btn dark-mode-toggle ${isDarkMode ? "active" : ""}`}
            onClick={() => {
              onToggleDarkMode?.();
            }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Route Telemetry Toggle (Truck Icon) */}
          <button
            type="button"
            className={`map-util-btn ${showOptimizationCard ? "active" : ""}`}
            onClick={() => {
              const next = !showOptimizationCard;
              setShowOptimizationCard(next);
              onShowToast?.(next ? "Route telemetry card opened" : "Route telemetry card closed");
            }}
            title={showOptimizationCard ? "Hide Route Telemetry Card" : "Open Route Telemetry Card"}
          >
            <TruckLengthIcon width="20" height="20" className="text-slate-900" />
          </button>

          {/* Maximize / Minimize View */}
          <button
            type="button"
            className={`map-util-btn ${isMaximized ? "active" : ""}`}
            onClick={() => {
              const next = !isMaximized;
              setIsMaximized(next);
              onShowToast?.(next ? "Map expanded to full cockpit" : "Restored quadrant view");
            }}
            title={isMaximized ? "Restore Grid View" : "Maximize Map"}
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* 2b. Bottom-Right Floating Controls (Camera Reset & 3D View) */}
      <div className="map-bottom-actions">
        {/* Reset Camera & Auto-Fit Route */}
        <button
          type="button"
          className="map-util-btn"
          onClick={handleResetCamera}
          title="Reset Camera & Auto-Fit Route"
        >
          <Navigation size={18} />
        </button>

        {/* 3D / 2D Perspective Toggle */}
        <button
          type="button"
          className={`map-util-btn ${is3DMode ? "active" : ""}`}
          onClick={handleToggle3D}
          title={is3DMode ? "Switch to 2D Plan View" : "Switch to 3D Perspective"}
        >
          <Compass size={18} />
        </button>
      </div>

      {/* 3. Floating Order Details Telemetry Overlay */}
      {showOrderTelemetry && (
        <div
          className="cockpit-dropdown-menu"
          style={{
            top: 48,
            left: 14,
            minWidth: 230,
            padding: 10,
            zIndex: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700 }}>Order Telemetry</span>
            <button
              type="button"
              onClick={() => setShowOrderTelemetry(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
            >
              <X size={12} />
            </button>
          </div>
          <div style={{ fontSize: "10.5px", color: "#4b5563", lineHeight: 1.5 }}>
            <div><strong>Status:</strong> Active In-Transit</div>
            <div><strong>Manifest:</strong> 7,640 lb / 3 pallets</div>
            <div><strong>Origin:</strong> 2464 Royal Ln. Mesa</div>
            <div><strong>Destination:</strong> Pier 16 Wall St Dock</div>
            <div><strong>Routing Engine:</strong> Dijkstra Shortest Path</div>
          </div>
        </div>
      )}

      {/* 5. Zoom In/Out Floating Controls on the Left */}
      <div className="map-zoom-controls">
        <button
          type="button"
          className="map-zoom-btn"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          className="map-zoom-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>
      </div>

      {/* 6. Live Route Telemetry Floating Yellow Card (Matching Reference Image) */}
      {showOptimizationCard && (
        <div
          className="route-telemetry-card"
          id="route-telemetry-card"
        >
          <div className="telemetry-card-header">
            <div className="telemetry-title-row">
              <TruckLengthIcon width="16" height="16" className="text-slate-900" />
              <span className="telemetry-title">Route Telemetry</span>
            </div>
            <button
              type="button"
              className="telemetry-expand-btn"
              onClick={() => {
                setShowOptimizationCard(false);
                onShowToast?.("Route telemetry minimized");
              }}
              title="Minimize Telemetry Card"
            >
              <Minimize2 size={12} />
            </button>
          </div>

          <div className="telemetry-items-list">
            {/* 1. Current location */}
            <div className="telemetry-row">
              <span className="telemetry-label">Current location</span>
              <span className="telemetry-value" title={truckStatus.currentLocation}>
                {truckStatus.currentLocation}
              </span>
            </div>

            {/* 2. Distance covered with Live Milestone Number Line */}
            <div className="telemetry-distance-block">
              <div className="telemetry-row telemetry-row-compact">
                <span className="telemetry-label">Distance covered</span>
                <span className="telemetry-value telemetry-mono">
                  {truckStatus.distanceCovered} mi <span className="telemetry-subval">/ {truckStatus.totalDistance} mi ({Math.round(progress)}%)</span>
                </span>
              </div>

              {/* Number Line showing distance covered to each milestone point */}
              <div className="milestone-number-line">
                {/* Milestone distance markers */}
                <div className="number-line-labels top">
                  <span style={{ left: "0%", transform: "translateX(0%)" }}>0 mi</span>
                  <span style={{ left: `${currentItinerary.stops[1]?.pct || 25}%`, transform: "translateX(-50%)" }}>
                    {currentItinerary.stops[1]?.distanceMi} mi
                  </span>
                  <span style={{ left: `${currentItinerary.stops[2]?.pct || 60}%`, transform: "translateX(-50%)" }}>
                    {currentItinerary.stops[2]?.distanceMi} mi
                  </span>
                  <span style={{ left: "100%", transform: "translateX(-100%)" }}>
                    {currentItinerary.totalDistance} mi
                  </span>
                </div>

                {/* Progress track axis line */}
                <div className="number-line-axis">
                  <div
                    className="number-line-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                  <div
                    className="number-line-indicator"
                    style={{ left: `${Math.min(100, Math.max(0, progress))}%` }}
                    title={`Live: ${truckStatus.distanceCovered} mi`}
                  />
                  <div className={`number-line-tick ${progress >= 0 ? "reached" : ""}`} style={{ left: "0%" }} />
                  <div className={`number-line-tick ${progress >= (currentItinerary.stops[1]?.pct || 25) ? "reached" : ""}`} style={{ left: `${currentItinerary.stops[1]?.pct || 25}%` }} />
                  <div className={`number-line-tick ${progress >= (currentItinerary.stops[2]?.pct || 60) ? "reached" : ""}`} style={{ left: `${currentItinerary.stops[2]?.pct || 60}%` }} />
                  <div className={`number-line-tick ${progress >= (currentItinerary.stops[3]?.pct || 100) ? "reached" : ""}`} style={{ left: "100%" }} />
                </div>

                {/* Milestone checkpoint labels */}
                <div className="number-line-labels bottom">
                  <span style={{ left: "0%", transform: "translateX(0%)" }} className={progress >= 0 ? "label-active" : ""}>
                    {currentItinerary.stops[0]?.code}
                  </span>
                  <span style={{ left: `${currentItinerary.stops[1]?.pct || 25}%`, transform: "translateX(-50%)" }} className={progress >= (currentItinerary.stops[1]?.pct || 25) ? "label-active" : ""}>
                    {currentItinerary.stops[1]?.code}
                  </span>
                  <span style={{ left: `${currentItinerary.stops[2]?.pct || 60}%`, transform: "translateX(-50%)" }} className={progress >= (currentItinerary.stops[2]?.pct || 60) ? "label-active" : ""}>
                    {currentItinerary.stops[2]?.code}
                  </span>
                  <span style={{ left: "100%", transform: "translateX(-100%)" }} className={progress >= (currentItinerary.stops[3]?.pct || 100) ? "label-active" : ""}>
                    {currentItinerary.stops[3]?.code}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Next stop */}
            <div className="telemetry-row">
              <span className="telemetry-label">Next stop</span>
              <span className="telemetry-next-pill">
                {truckStatus.completedCount === 3
                  ? "D3 Arrived 🏁"
                  : `${truckStatus.nextStop.code} (${truckStatus.nextStopDist} mi)`}
              </span>
            </div>

            {/* 4. Completed stops */}
            <div className="telemetry-row">
              <span className="telemetry-label">Completed stops</span>
              <div className="telemetry-stops-badges">
                <span className={`telemetry-stop-badge ${progress >= (currentItinerary.stops[1]?.pct || 25) ? "done" : "pending"}`}>
                  {progress >= (currentItinerary.stops[1]?.pct || 25) ? "D1 ✓" : "D1"}
                </span>
                <span className="telemetry-arrow">→</span>
                <span className={`telemetry-stop-badge ${progress >= (currentItinerary.stops[2]?.pct || 60) ? "done" : progress >= (currentItinerary.stops[1]?.pct || 25) ? "active" : "pending"}`}>
                  {progress >= (currentItinerary.stops[2]?.pct || 60) ? "D2 ✓" : "D2"}
                </span>
                <span className="telemetry-arrow">→</span>
                <span className={`telemetry-stop-badge ${progress >= (currentItinerary.stops[3]?.pct || 100) ? "done" : progress >= (currentItinerary.stops[2]?.pct || 60) ? "active" : "pending"}`}>
                  {progress >= (currentItinerary.stops[3]?.pct || 100) ? "D3 ✓" : "D3"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Floating Waypoints Drawer / Popup */}
      {showWaypointsList && (
        <div
          className="cockpit-dropdown-menu"
          style={{
            bottom: 56,
            left: 14,
            top: "auto",
            minWidth: 280,
            padding: 12,
            zIndex: 15,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: "12px", fontWeight: 700 }}>Dijkstra Checkpoints Schedule</span>
            <button
              type="button"
              onClick={() => setShowWaypointsList(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
            >
              <X size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {currentItinerary.stops.map((stop) => {
              const isPassed = progress >= (stop.pct || 0);
              return (
                <div
                  key={stop.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    padding: "6px 8px",
                    borderRadius: 5,
                    background: isPassed ? "#dcfce7" : "#f8fafc",
                    border: isPassed ? "1px solid #86efac" : "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>{stop.code}: {stop.name}</span>
                      {isPassed && <span style={{ color: "#16a34a", fontSize: "10px" }}>✓</span>}
                    </div>
                    <div style={{ fontSize: "9.5px", color: "#64748b" }}>{stop.address}</div>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: "10.5px",
                      color: isPassed ? "#166534" : "#111827",
                    }}
                  >
                    {stop.distanceMi} mi
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
