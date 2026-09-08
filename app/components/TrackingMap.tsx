"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Coordinates, DeliveryStop } from "../types/tracking";
import { generateDelhi3DBuildings } from "../lib/delhi3DBuildings";
import {
  Box,
  Video,
  RotateCcw,
  Layers,
  Compass,
  Key,
  CheckCircle2,
  ExternalLink,
  X,
} from "lucide-react";

interface TrackingMapProps {
  currentLocation: Coordinates;
  stops: DeliveryStop[];
  routePath: Coordinates[];
  currentPointIndex: number;
  heading: number;
  isTracking?: boolean;
  viewLevel?: "city" | "district" | "street";
  onViewLevelChange?: (level: "city" | "district" | "street") => void;
}

type CameraMode = "3d" | "chase" | "orbit" | "2d";

// OpenFreeMap Dark vector style (free vector tiles with city-wide buildings, NO API KEY)
const VECTOR_DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

// Esri Dark Gray base tiles with maxzoom: 16 (PREVENTS "Map data not available yet" on zoom > 16)
const ESRI_DARK_STYLE: any = {
  version: 8,
  name: "FoxFreight Tactical Dark",
  sources: {
    "esri-dark": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "© Esri, HERE, Garmin, © OpenStreetMap contributors",
      maxzoom: 16, // Prevents MapLibre from requesting nonexistent z17+ tiles!
    },
  },
  layers: [
    {
      id: "esri-dark-base",
      type: "raster",
      source: "esri-dark",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

function createStopMarkerEl(label: string, status: string): HTMLDivElement {
  const el = document.createElement("div");
  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  const borderColor = isCompleted || isCurrent ? "#c8a846" : "#666";
  const bgColor = isCompleted ? "#c8a846" : "#111827";
  const textColor = isCompleted ? "#111827" : isCurrent ? "#ffd580" : "#999";
  const glow = isCompleted || isCurrent ? `0 0 20px ${borderColor}90` : "none";

  el.style.cssText = `
    width: 42px; height: 42px;
    border-radius: 50%;
    border: 2.5px solid ${borderColor};
    background: ${bgColor};
    display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 800;
    color: ${textColor};
    box-shadow: ${glow};
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  el.textContent = label;
  return el;
}

function createTruckMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "truck-marker-3d";
  el.innerHTML = `
    <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
      <!-- Ground Shadow Disc -->
      <div style="position: absolute; width: 54px; height: 54px; border-radius: 50%; background: radial-gradient(circle, rgba(0,0,0,0.9) 0%, transparent 70%); transform: translateY(6px) scaleY(0.55);"></div>
      
      <!-- Truck SVG with Forward Illuminating Beam -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" style="position: relative; z-index: 2;">
        <defs>
          <filter id="truck-glow-vivid" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="pulse-grad-vivid" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffd580" stop-opacity="0.5"/>
            <stop offset="60%" stop-color="#c8a846" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#c8a846" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="headlight-cone-vivid" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stop-color="#ffd580" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#ffd580" stop-opacity="0"/>
          </linearGradient>
        </defs>
        
        <!-- Forward Headlight Beam onto Road -->
        <polygon points="32,18 10,0 54,0" fill="url(#headlight-cone-vivid)" opacity="0.65"/>
        
        <!-- Radar Pulse Circle -->
        <circle cx="32" cy="32" r="28" fill="url(#pulse-grad-vivid)" class="pulse-ring"/>
        
        <!-- Tactical Core -->
        <circle cx="32" cy="32" r="19" fill="#0b0f17" stroke="#c8a846" stroke-width="3" filter="url(#truck-glow-vivid)"/>
        
        <!-- Heading Arrow -->
        <polygon points="32,16 41,39 32,33 23,39" fill="#ffd580"/>
        <circle cx="32" cy="32" r="3.5" fill="#ffffff"/>
      </svg>
    </div>
  `;
  return el;
}

export default function TrackingMap({
  currentLocation,
  stops,
  routePath,
  currentPointIndex,
  heading,
  isTracking,
  viewLevel = "district",
  onViewLevelChange,
}: TrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const truckMarkerRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const isInitialized = useRef(false);

  // Mapbox Token Management
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [tokenInputValue, setTokenInputValue] = useState<string>("");
  const [activeEngine, setActiveEngine] = useState<"mapbox" | "maplibre">("maplibre");

  // HUD & Camera States
  const [cameraMode, setCameraMode] = useState<CameraMode>("3d");
  const [pitchVal, setPitchVal] = useState<number>(62);
  const [heightBoost, setHeightBoost] = useState<number>(1.5);
  const [selectedBuilding, setSelectedBuilding] = useState<{
    name: string;
    height: number;
    floors: number;
    type: string;
    status: string;
  } | null>(null);

  const heightBoostRef = useRef<number>(heightBoost);
  heightBoostRef.current = heightBoost;

  const cameraModeRef = useRef<CameraMode>(cameraMode);
  cameraModeRef.current = cameraMode;

  const orbitAngleRef = useRef<number>(-25);

  // Load saved token on mount
  useEffect(() => {
    const envToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || "";
    const savedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("foxfreight_mapbox_token")?.trim() || ""
        : "";
    const active = savedToken || envToken;
    if (active) {
      setMapboxToken(active);
      setTokenInputValue(active);
      setActiveEngine("mapbox");
    }
  }, []);

  // Setup layers: ALL BUILDINGS 100% JET BLACK (User Request: "buildign wagerha sab black rakhna")
  const addAllBlackLayers = useCallback(
    (map: any, isMapbox: boolean) => {
      // 1. Directional Sun/Shadow Lighting (sculpts black architectural edges)
      try {
        map.setLight({
          anchor: "viewport",
          color: "#d4af37", // Warm ambient sunlight highlighting edges of black buildings
          intensity: 0.65,
          position: [1.5, 210, 55],
        });
      } catch (err) {
        console.warn("Lighting setup:", err);
      }

      // 2. Official Mapbox 3D composite vector buildings in JET BLACK
      if (isMapbox) {
        try {
          const layers = map.getStyle().layers;
          let labelLayerId: string | undefined;
          for (let i = 0; i < layers.length; i++) {
            if (
              layers[i].type === "symbol" &&
              layers[i].layout &&
              layers[i].layout["text-field"]
            ) {
              labelLayerId = layers[i].id;
              break;
            }
          }

          if (!map.getLayer("3d-buildings-mapbox")) {
            map.addLayer(
              {
                id: "3d-buildings-mapbox",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 14,
                paint: {
                  // PURE STEALTH BLACK BUILDINGS
                  "fill-extrusion-color": [
                    "interpolate",
                    ["linear"],
                    ["get", "height"],
                    0,
                    "#050810",
                    25,
                    "#080c16",
                    60,
                    "#0b101c",
                    120,
                    "#0e1422",
                  ],
                  "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    15.05,
                    ["*", ["get", "height"], heightBoostRef.current],
                  ],
                  "fill-extrusion-base": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    15.05,
                    ["get", "min_height"],
                  ],
                  "fill-extrusion-opacity": 0.96,
                  "fill-extrusion-vertical-gradient": true,
                },
              },
              labelLayerId
            );
          }
        } catch (e) {
          console.warn("Mapbox 3D layer setup:", e);
        }
      } else {
        // Fallback Vector tiles: OpenStreetMap building layers styled JET BLACK
        if (map.getSource("openmaptiles")) {
          if (map.getLayer("building")) {
            try {
              map.setPaintProperty("building", "fill-color", "#060911");
              map.setPaintProperty(
                "building",
                "fill-outline-color",
                "rgba(56, 189, 248, 0.35)"
              );
              map.setPaintProperty("building", "fill-opacity", 0.9);
            } catch {}
          }

          if (!map.getLayer("osm-3d-city-buildings")) {
            try {
              map.addLayer({
                id: "osm-3d-city-buildings",
                source: "openmaptiles",
                "source-layer": "building",
                type: "fill-extrusion",
                minzoom: 14,
                paint: {
                  // PURE STEALTH BLACK
                  "fill-extrusion-color": [
                    "interpolate",
                    ["linear"],
                    ["to-number", ["coalesce", ["get", "render_height"], 15]],
                    0,
                    "#050810",
                    20,
                    "#080c16",
                    50,
                    "#0b101c",
                    100,
                    "#0e1422",
                  ],
                  "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    14,
                    0,
                    15.5,
                    [
                      "case",
                      [
                        ">",
                        ["to-number", ["coalesce", ["get", "render_height"], 0]],
                        0,
                      ],
                      [
                        "*",
                        ["to-number", ["get", "render_height"]],
                        heightBoostRef.current,
                      ],
                      ["*", 18, heightBoostRef.current],
                    ],
                  ],
                  "fill-extrusion-base": [
                    "case",
                    [
                      ">",
                      ["to-number", ["coalesce", ["get", "render_min_height"], 0]],
                      0,
                    ],
                    ["to-number", ["get", "render_min_height"]],
                    0,
                  ],
                  "fill-extrusion-opacity": 0.95,
                  "fill-extrusion-vertical-gradient": true,
                },
              });
            } catch {}
          }
        }
      }

      // 3. FoxFreight Corridor 3D & 2D Buildings (249 Architectural Structures)
      if (!map.getSource("corridor-3d-source")) {
        const corridor3DData = generateDelhi3DBuildings();
        map.addSource("corridor-3d-source", {
          type: "geojson",
          data: corridor3DData,
        });
      }

      // 4. Ground 2D Building Footprints (ALL PURE JET BLACK with subtle borders!)
      if (!map.getLayer("corridor-buildings-2d")) {
        map.addLayer({
          id: "corridor-buildings-2d",
          type: "fill",
          source: "corridor-3d-source",
          paint: {
            "fill-color": "#060912", // Deep Jet Black Fill
            "fill-outline-color": [
              "match",
              ["get", "type"],
              "logistics",
              "#c8a846",
              "landmark",
              "#d4af37",
              "tech",
              "#3b82f6",
              "#334155",
            ],
            "fill-opacity": 0.98,
          },
        });
      }

      // 5. Glowing 2D Footprint Outlines
      if (!map.getLayer("corridor-buildings-footprints")) {
        map.addLayer({
          id: "corridor-buildings-footprints",
          type: "line",
          source: "corridor-3d-source",
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "logistics",
              "#ffd580",
              "landmark",
              "#ffe082",
              "tech",
              "#93c5fd",
              "#60a5fa",
            ],
            "line-width": 2,
            "line-opacity": 0.85,
          },
        });
      }

      // 6. Volumetric 3D Extrusion Layer (ALL PURE JET BLACK!)
      if (!map.getLayer("corridor-3d-buildings")) {
        map.addLayer({
          id: "corridor-3d-buildings",
          type: "fill-extrusion",
          source: "corridor-3d-source",
          paint: {
            // STEALTH JET-BLACK OBSIDIAN
            "fill-extrusion-color": [
              "match",
              ["get", "type"],
              "logistics",
              "#090e18",
              "landmark",
              "#0c111c",
              "tech",
              "#070b14",
              "#080c16",
            ],
            "fill-extrusion-height": [
              "*",
              ["to-number", ["coalesce", ["get", "height"], 30]],
              heightBoostRef.current,
            ],
            "fill-extrusion-base": [
              "to-number",
              ["coalesce", ["get", "base_height"], 0],
            ],
            "fill-extrusion-opacity": 0.98,
            "fill-extrusion-vertical-gradient": true,
          },
        });
      }

      // 7. Interactive Click on Buildings
      const handleBuildingClick = (e: any) => {
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties;
        if (props) {
          setSelectedBuilding({
            name: String(props.name || "Stealth Monitored Structure"),
            height: Number(props.height) || 45,
            floors: Number(props.floors) || 12,
            type: String(props.type || "Commercial").toUpperCase(),
            status: String(props.status || "Black Monitored Zone"),
          });
        }
      };

      map.on("click", "corridor-3d-buildings", handleBuildingClick);
      map.on("click", "corridor-buildings-2d", handleBuildingClick);
      if (isMapbox) {
        map.on("click", "3d-buildings-mapbox", handleBuildingClick);
      }

      map.on("mouseenter", "corridor-3d-buildings", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "corridor-3d-buildings", () => {
        map.getCanvas().style.cursor = "";
      });

      // 8. Route Lines
      const routeCoords = routePath.map((p) => [p.lng, p.lat]);

      if (!map.getSource("route-full")) {
        map.addSource("route-full", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeCoords,
            },
          },
        });
      }

      if (!map.getSource("route-traveled")) {
        const traveledCoords = routePath
          .slice(0, currentPointIndex + 1)
          .map((p) => [p.lng, p.lat]);
        map.addSource("route-traveled", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates:
                traveledCoords.length > 0 ? traveledCoords : [routeCoords[0]],
            },
          },
        });
      }

      // Full Route Line (Dashed Gold)
      if (!map.getLayer("route-full-line")) {
        map.addLayer({
          id: "route-full-line",
          type: "line",
          source: "route-full",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#c8a846",
            "line-width": 4,
            "line-opacity": 0.35,
            "line-dasharray": [2, 3],
          },
        });
      }

      // Traveled Route Core (Solid Lime Yellow)
      if (!map.getLayer("route-traveled-line")) {
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
      }
    },
    [routePath, currentPointIndex]
  );

  // Initialize or Re-initialize Map (Mapbox GL JS or MapLibre GL JS)
  const initMap = useCallback(
    (token: string) => {
      if (!mapContainer.current) return;

      // Clean up previous map instance
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
      stopMarkersRef.current = [];
      truckMarkerRef.current = null;

      const isMapbox = Boolean(token && token.startsWith("pk."));
      setActiveEngine(isMapbox ? "mapbox" : "maplibre");

      let map: any;

      if (isMapbox) {
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [currentLocation.lng, currentLocation.lat],
          zoom: 15.2,
          pitch: 62,
          bearing: -25,
          attributionControl: false,
        });
        map.addControl(
          new mapboxgl.NavigationControl({ visualizePitch: true }),
          "bottom-right"
        );
      } else {
        map = new maplibregl.Map({
          container: mapContainer.current,
          style: VECTOR_DARK_STYLE_URL,
          center: [currentLocation.lng, currentLocation.lat],
          zoom: 15.2,
          pitch: 62,
          bearing: -25,
          maxZoom: 20,
          attributionControl: false,
        });
        map.addControl(
          new maplibregl.NavigationControl({ visualizePitch: true }),
          "bottom-right"
        );
      }

      map.on("error", (e: any) => {
        console.warn("Map engine event warning:", e);
      });

      map.on("load", () => {
        addAllBlackLayers(map, isMapbox);

        // Stop Markers
        stops.forEach((stop) => {
          const el = createStopMarkerEl(stop.label, stop.status);

          const PopupConstructor = isMapbox ? mapboxgl.Popup : maplibregl.Popup;
          const MarkerConstructor = isMapbox ? mapboxgl.Marker : maplibregl.Marker;

          const popup = new PopupConstructor({
            offset: 24,
            closeButton: false,
            className: "ff-popup",
          }).setHTML(`
            <div class="ff-popup-content">
              <div class="ff-popup-label">${stop.label} — ${stop.name}</div>
              <div class="ff-popup-address">${stop.address}</div>
              <div class="ff-popup-eta">ETA: ${stop.estimatedArrival}</div>
            </div>
          `);

          const marker = new MarkerConstructor({ element: el })
            .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
            .setPopup(popup as any)
            .addTo(map);

          stopMarkersRef.current.push(marker);
        });

        // 3D Truck Marker
        const truckEl = createTruckMarkerEl();
        const MarkerConstructor = isMapbox ? mapboxgl.Marker : maplibregl.Marker;
        truckMarkerRef.current = new MarkerConstructor({
          element: truckEl,
          rotationAlignment: "map",
          pitchAlignment: "map",
        })
          .setLngLat([currentLocation.lng, currentLocation.lat])
          .addTo(map);
      });

      mapRef.current = map;
    },
    [currentLocation, stops, addAllBlackLayers]
  );

  // Initial map mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const envToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || "";
    const savedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("foxfreight_mapbox_token")?.trim() || ""
        : "";
    initMap(savedToken || envToken);

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
      isInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save Mapbox Token handler
  const handleSaveMapboxToken = () => {
    const cleanToken = tokenInputValue.trim();
    if (cleanToken) {
      localStorage.setItem("foxfreight_mapbox_token", cleanToken);
      setMapboxToken(cleanToken);
      setIsTokenModalOpen(false);
      initMap(cleanToken);
    }
  };

  const handleClearMapboxToken = () => {
    localStorage.removeItem("foxfreight_mapbox_token");
    setMapboxToken("");
    setTokenInputValue("");
    setIsTokenModalOpen(false);
    initMap("");
  };

  // Update truck position, rotation and camera tracking
  useEffect(() => {
    if (!mapRef.current || !truckMarkerRef.current) return;
    const map = mapRef.current;

    const lngLat: [number, number] = [currentLocation.lng, currentLocation.lat];
    truckMarkerRef.current.setLngLat(lngLat);

    // Rotate truck marker smoothly
    const el = truckMarkerRef.current.getElement();
    if (el) {
      const svg = el.querySelector("svg");
      if (svg) {
        (svg as unknown as HTMLElement).style.transform = `rotate(${heading}deg)`;
        (svg as unknown as HTMLElement).style.transition =
          "transform 0.08s linear";
      }
    }

    // Update traveled route line GeoJSON
    const source = map.getSource("route-traveled");
    if (source && source.setData) {
      const traveledCoords = routePath
        .slice(0, currentPointIndex + 1)
        .map((p) => [p.lng, p.lat]);
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: traveledCoords.length > 0 ? traveledCoords : [lngLat],
        },
      });
    }

    // Dynamic Camera Follow
    const mode = cameraModeRef.current;
    if (isTracking) {
      if (mode === "chase") {
        const rad = ((heading + 180) * Math.PI) / 180;
        const distM = 240;
        const dLat = (distM * Math.cos(rad)) / 111320;
        const dLng =
          (distM * Math.sin(rad)) /
          (111320 * Math.cos((currentLocation.lat * Math.PI) / 180));

        map.easeTo({
          center: [
            currentLocation.lng + dLng * 0.35,
            currentLocation.lat + dLat * 0.35,
          ],
          zoom: 15.6,
          pitch: 66,
          bearing: heading,
          duration: 90,
        });
      } else if (mode === "3d") {
        map.easeTo({
          center: lngLat,
          pitch: pitchVal,
          bearing: -25,
          zoom: 15.0,
          duration: 90,
        });
      } else if (mode === "orbit") {
        orbitAngleRef.current = (orbitAngleRef.current + 0.6) % 360;
        map.easeTo({
          center: lngLat,
          pitch: 58,
          bearing: orbitAngleRef.current,
          zoom: 15.2,
          duration: 90,
        });
      } else if (mode === "2d") {
        map.easeTo({
          center: lngLat,
          pitch: 0,
          bearing: 0,
          zoom: 14.5,
          duration: 90,
        });
      }
    }
  }, [currentLocation, currentPointIndex, heading, routePath, pitchVal, isTracking]);

  // Update stop markers styling on status changes
  useEffect(() => {
    stopMarkersRef.current.forEach((marker, index) => {
      if (index < stops.length) {
        const stop = stops[index];
        const el = marker.getElement();
        const isCompleted = stop.status === "completed";
        const isCurrent = stop.status === "current";
        const borderColor = isCompleted || isCurrent ? "#c8a846" : "#666";
        const bgColor = isCompleted ? "#c8a846" : "#111827";
        const textColor = isCompleted
          ? "#111827"
          : isCurrent
            ? "#ffd580"
            : "#888";
        const glow =
          isCompleted || isCurrent ? `0 0 20px ${borderColor}90` : "none";

        el.style.borderColor = borderColor;
        el.style.backgroundColor = bgColor;
        el.style.color = textColor;
        el.style.boxShadow = glow;
      }
    });
  }, [stops]);

  // Respond to view level changes (City, District, Street)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (viewLevel === "city") {
      map.easeTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 12.8,
        pitch: 35,
        duration: 700,
      });
    } else if (viewLevel === "district") {
      map.easeTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 15.2,
        pitch: 60,
        duration: 700,
      });
    } else if (viewLevel === "street") {
      map.easeTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 17.5,
        pitch: 68,
        duration: 700,
      });
    }
  }, [viewLevel, currentLocation]);

  // Height multiplier handler
  const handleHeightBoostChange = useCallback((boost: number) => {
    setHeightBoost(boost);
    heightBoostRef.current = boost;
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (map.getLayer("corridor-3d-buildings")) {
      map.setPaintProperty("corridor-3d-buildings", "fill-extrusion-height", [
        "*",
        ["to-number", ["coalesce", ["get", "height"], 30]],
        boost,
      ]);
    }
    if (map.getLayer("3d-buildings-mapbox")) {
      map.setPaintProperty("3d-buildings-mapbox", "fill-extrusion-height", [
        "interpolate",
        ["linear"],
        ["zoom"],
        14,
        0,
        15.05,
        ["*", ["get", "height"], boost],
      ]);
    }
    if (map.getLayer("osm-3d-city-buildings")) {
      map.setPaintProperty("osm-3d-city-buildings", "fill-extrusion-height", [
        "interpolate",
        ["linear"],
        ["zoom"],
        14,
        0,
        15.5,
        [
          "case",
          [">", ["to-number", ["coalesce", ["get", "render_height"], 0]], 0],
          ["*", ["to-number", ["get", "render_height"]], boost],
          ["*", 18, boost],
        ],
      ]);
    }
  }, []);

  // Pitch change handler
  const handlePitchChange = useCallback((pitch: number) => {
    setPitchVal(pitch);
    if (!mapRef.current) return;
    mapRef.current.easeTo({ pitch, duration: 400 });
  }, []);

  // Camera Mode switcher
  const handleModeChange = useCallback(
    (mode: CameraMode) => {
      setCameraMode(mode);
      if (!mapRef.current) return;
      const map = mapRef.current;

      if (mode === "chase") {
        map.easeTo({
          center: [currentLocation.lng, currentLocation.lat],
          pitch: 66,
          bearing: heading,
          zoom: 15.6,
          duration: 600,
        });
      } else if (mode === "3d") {
        setPitchVal(62);
        map.easeTo({
          center: [currentLocation.lng, currentLocation.lat],
          pitch: 62,
          bearing: -25,
          zoom: 15.2,
          duration: 600,
        });
      } else if (mode === "orbit") {
        map.easeTo({
          center: [currentLocation.lng, currentLocation.lat],
          pitch: 58,
          zoom: 15.2,
          duration: 600,
        });
      } else if (mode === "2d") {
        setPitchVal(0);
        map.easeTo({
          pitch: 0,
          bearing: 0,
          zoom: 14.5,
          duration: 600,
        });
      }
    },
    [currentLocation, heading]
  );

  // Fit all stops overview
  const handleFitRoute = useCallback(() => {
    if (!mapRef.current) return;
    const allCoords = stops.map(
      (s) => [s.coordinates.lng, s.coordinates.lat] as [number, number]
    );
    const BoundsConstructor =
      activeEngine === "mapbox" ? mapboxgl.LngLatBounds : maplibregl.LngLatBounds;
    const bounds = new BoundsConstructor(allCoords[0], allCoords[0]);
    allCoords.forEach((c) => bounds.extend(c));
    mapRef.current.fitBounds(bounds, { padding: 90, pitch: 55, bearing: -20 });
  }, [stops, activeEngine]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Map Canvas */}
      <div
        ref={mapContainer}
        className="tracking-map"
        id="tracking-map"
        style={{ width: "100%", height: "100%" }}
      />

      {/* FLOATING 3D COMMAND HUD OVERLAY */}
      <div className="tactical-3d-hud" id="tactical-3d-hud">
        {/* Top Camera Mode Group */}
        <div className="hud-mode-group">
          <button
            type="button"
            className={`hud-btn ${cameraMode === "3d" ? "active" : ""}`}
            onClick={() => handleModeChange("3d")}
            title="3D Tactical Skyline Perspective"
          >
            <Box size={13} className="hud-icon" />
            <span>3D SKYLINE</span>
          </button>

          <button
            type="button"
            className={`hud-btn ${cameraMode === "chase" ? "active" : ""}`}
            onClick={() => handleModeChange("chase")}
            title="Driver Chase Cam (Dynamic Follow)"
          >
            <Video size={13} className="hud-icon" />
            <span>CHASE CAM</span>
          </button>

          <button
            type="button"
            className={`hud-btn ${cameraMode === "orbit" ? "active" : ""}`}
            onClick={() => handleModeChange("orbit")}
            title="360° Orbit Inspection"
          >
            <RotateCcw size={13} className="hud-icon" />
            <span>ORBIT 360°</span>
          </button>

          <button
            type="button"
            className={`hud-btn ${cameraMode === "2d" ? "active" : ""}`}
            onClick={() => handleModeChange("2d")}
            title="2D Top-Down Tactical Grid"
          >
            <Layers size={13} className="hud-icon" />
            <span>2D GRID</span>
          </button>
        </div>

        {/* Secondary Bar: Engine, Pitch & Height Scaling Controls */}
        <div className="hud-sub-bar">
          {/* Mapbox Token / Engine Selector Button */}
          <button
            type="button"
            className={`hud-token-btn ${activeEngine === "mapbox" ? "connected" : ""}`}
            onClick={() => setIsTokenModalOpen(true)}
            title="Configure Mapbox GL JS Access Token"
          >
            <Key size={11} />
            <span>
              {activeEngine === "mapbox" ? "MAPBOX 3D: ACTIVE" : "ATTACH MAPBOX KEY"}
            </span>
          </button>

          {/* Pitch Presets */}
          <div className="hud-control-cluster">
            <span className="hud-cluster-label">PITCH:</span>
            <button
              type="button"
              className={`hud-pill ${pitchVal === 0 ? "active" : ""}`}
              onClick={() => handlePitchChange(0)}
            >
              0°
            </button>
            <button
              type="button"
              className={`hud-pill ${pitchVal === 45 ? "active" : ""}`}
              onClick={() => handlePitchChange(45)}
            >
              45°
            </button>
            <button
              type="button"
              className={`hud-pill ${pitchVal === 62 || pitchVal === 60 ? "active" : ""}`}
              onClick={() => handlePitchChange(62)}
            >
              60°
            </button>
            <button
              type="button"
              className={`hud-pill ${pitchVal === 74 ? "active" : ""}`}
              onClick={() => handlePitchChange(74)}
            >
              75°
            </button>
          </div>

          {/* 3D Extrusion Height Multiplier */}
          <div className="hud-control-cluster">
            <span className="hud-cluster-label">3D HEIGHT:</span>
            <button
              type="button"
              className={`hud-pill ${heightBoost === 1.0 ? "active" : ""}`}
              onClick={() => handleHeightBoostChange(1.0)}
            >
              1.0x
            </button>
            <button
              type="button"
              className={`hud-pill ${heightBoost === 1.5 ? "active" : ""}`}
              onClick={() => handleHeightBoostChange(1.5)}
            >
              1.5x
            </button>
            <button
              type="button"
              className={`hud-pill ${heightBoost === 2.2 ? "active" : ""}`}
              onClick={() => handleHeightBoostChange(2.2)}
            >
              2.2x
            </button>
          </div>

          {/* Fit Full Route Button */}
          <button
            type="button"
            className="hud-fit-btn"
            onClick={handleFitRoute}
            title="Overview Full Route"
          >
            <Compass size={12} style={{ marginRight: 4 }} />
            <span>FULL ROUTE</span>
          </button>
        </div>

        {/* Live 3D Telemetry Strip */}
        <div className="hud-telemetry-badge">
          <span className="badge-dot" />
          <span className="badge-text">
            {activeEngine === "mapbox"
              ? "MAPBOX GL JS v3 ACTIVE • STEALTH JET-BLACK 3D MESH • NO ZOOM LIMIT"
              : "STEALTH TACTICAL 3D ACTIVE • 249 JET-BLACK STRUCTURES • VECTOR MESH"}
          </span>
        </div>
      </div>

      {/* Selected 3D Building Telemetry Card */}
      {selectedBuilding && (
        <div className="building-telemetry-card">
          <div className="telemetry-header">
            <span className="telemetry-type">{selectedBuilding.type}</span>
            <button
              type="button"
              className="telemetry-close"
              onClick={() => setSelectedBuilding(null)}
            >
              ✕
            </button>
          </div>
          <div className="telemetry-title">{selectedBuilding.name}</div>
          <div className="telemetry-grid">
            <div className="telemetry-item">
              <span className="item-label">HEIGHT</span>
              <span className="item-val">{selectedBuilding.height}m</span>
            </div>
            <div className="telemetry-item">
              <span className="item-label">FLOORS</span>
              <span className="item-val">{selectedBuilding.floors}</span>
            </div>
            <div className="telemetry-item">
              <span className="item-label">FACADE</span>
              <span className="item-val">STEALTH JET BLACK</span>
            </div>
            <div className="telemetry-item">
              <span className="item-label">ZONE</span>
              <span className="item-val">DELHI NCR</span>
            </div>
          </div>
        </div>
      )}

      {/* Mapbox Token Modal */}
      {isTokenModalOpen && (
        <div
          className="mapbox-modal-backdrop"
          onClick={() => setIsTokenModalOpen(false)}
        >
          <div
            className="mapbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mapbox-modal-header">
              <div className="mapbox-modal-title">
                <Key size={16} color="#c8a846" />
                <span>MAPBOX GL JS CONFIGURATION</span>
              </div>
              <button
                type="button"
                className="telemetry-close"
                onClick={() => setIsTokenModalOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            <p className="mapbox-modal-desc">
              Enter your Mapbox public access token (starts with{" "}
              <code>pk.eyJ...</code>) to enable official Mapbox GL JS v3 3D
              vector maps with jet-black buildings. You can get a free token at{" "}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#c8a846", textDecoration: "underline" }}
              >
                mapbox.com
              </a>{" "}
              (50,000 free loads/month).
            </p>

            <input
              type="text"
              className="mapbox-input"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6..."
              value={tokenInputValue}
              onChange={(e) => setTokenInputValue(e.target.value)}
              autoFocus
            />

            <div className="mapbox-modal-actions">
              {mapboxToken && (
                <button
                  type="button"
                  className="mapbox-btn-clear"
                  onClick={handleClearMapboxToken}
                >
                  Disconnect Token
                </button>
              )}
              <button
                type="button"
                className="mapbox-btn-cancel"
                onClick={() => setIsTokenModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mapbox-btn-save"
                onClick={handleSaveMapboxToken}
              >
                Save &amp; Activate Mapbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
