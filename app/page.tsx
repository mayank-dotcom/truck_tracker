"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Map as MapIcon, Truck as TruckIcon, ClipboardList } from "lucide-react";
import TruckLoadingPanel from "./components/TruckLoadingPanel";
import FreightOrdersList from "./components/FreightOrdersList";

// Dynamically import map component with ssr: false to guarantee clean client-side hydration
const CockpitMap = dynamic(() => import("./components/CockpitMap"), {
  ssr: false,
  loading: () => (
    <div
      className="cockpit-map-card"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
      }}
    >
      <div style={{ color: "#9ca3af", fontSize: "12px", fontFamily: "Inter, sans-serif" }}>
        Loading interactive map telemetry...
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedOrder, setSelectedOrder] = useState<string>("UTD38723");
  const [isOptimizerActive, setIsOptimizerActive] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string>("PB-LP-PB Scenario");
  const [activeNavTab, setActiveNavTab] = useState<string>("Optimizer");
  const [activeMobileView, setActiveMobileView] = useState<"map" | "truck" | "orders">("map");

  // Draggable Splitter State (Map Width Percentage)
  const [splitPct, setSplitPct] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleScenarioChange = (scenario: string) => {
    setActiveScenario(scenario);
  };

  const handleOrderSelect = (orderCode: string) => {
    setSelectedOrder(orderCode);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Trigger resize event when switching views on mobile so Map & 3D WebGL adjust immediately
  const handleMobileViewChange = (view: "map" | "truck" | "orders") => {
    setActiveMobileView(view);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("resize"));
      }
    }, 50);
  };

  // Drag handlers using Pointer Events with setPointerCapture for smooth tracking
  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const newPct = ((e.clientX - rect.left) / rect.width) * 100;
    // Allow dragging between 20% and 80%
    const clampedPct = Math.min(Math.max(newPct, 20), 80);
    setSplitPct(clampedPct);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    setSplitPct(50);
  };

  return (
    <div
      className={`cockpit-viewport ${isDarkMode ? "dark-theme" : ""}`}
      id="cockpit-viewport"
    >
      {/* Main Cockpit Frame */}
      <div
        className={`cockpit-app-frame ${isDarkMode ? "dark-frame" : ""}`}
        id="cockpit-app-frame"
      >
        {/* Cockpit Layout: Left Map + Draggable Splitter + Right Column (Truck Bay & Freight Orders) */}
        <main
          ref={gridRef}
          className={`cockpit-grid mobile-view-${activeMobileView}`}
          id="cockpit-grid"
          style={{
            userSelect: isDragging ? "none" : "auto",
          }}
        >
          {/* Left Column: Full-Height Route Map & Live Waypoint Tracker */}
          <div
            className={`cockpit-map-column ${activeMobileView === "map" ? "mobile-active" : "mobile-hidden"}`}
            style={{ minWidth: 0 }}
          >
            <CockpitMap
              orderId={selectedOrder}
              activeScenario={activeScenario}
              isTracking={true}
              isOptimizerActive={isOptimizerActive}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
              onCloseOrder={() => {
                setSelectedOrder("UNASSIGNED");
              }}
            />
          </div>

          {/* Draggable Divider Splitter (Hidden on mobile via CSS) */}
          <div
            className={`cockpit-divider-resizer ${isDragging ? "dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            title="Drag left/right to resize Map and Truck area (Double-click to reset 50/50)"
          >
            <div className="resizer-handle-pill" />
          </div>

          {/* Right Column: Stacked Freight Truck Cargo Bay (Top) + Road Freight Orders (Bottom) */}
          <div
            className={`cockpit-sidebar-column ${
              activeMobileView === "truck" || activeMobileView === "orders" ? "mobile-active" : "mobile-hidden"
            } mobile-show-${activeMobileView}`}
            style={{ minWidth: 0 }}
          >
            <div className={`truck-section-wrapper ${activeMobileView === "orders" ? "mobile-hide-section" : ""}`}>
              <TruckLoadingPanel
                selectedOrder={selectedOrder}
                onSelectOrder={handleOrderSelect}
                isOptimizerActive={isOptimizerActive}
                isDarkMode={isDarkMode}
              />
            </div>
            <div className={`orders-section-wrapper ${activeMobileView === "truck" ? "mobile-hide-section" : ""}`}>
              <FreightOrdersList
                selectedOrder={selectedOrder}
                onSelectOrder={handleOrderSelect}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </main>

        {/* Mobile View Switcher Segmented Bar (Visible exclusively on mobile screens < 768px) */}
        <nav
          className="cockpit-mobile-nav"
          style={{
            background: isDarkMode ? "#141414" : "#ffffff",
            borderTop: isDarkMode ? "1px solid #282828" : "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            className={`mobile-nav-tab ${activeMobileView === "map" ? "active" : ""}`}
            onClick={() => handleMobileViewChange("map")}
            style={{
              color: activeMobileView === "map" ? (isDarkMode ? "#faff02" : "#0f172a") : (isDarkMode ? "#888888" : "#64748b"),
              borderTop: activeMobileView === "map" ? (isDarkMode ? "2.5px solid #faff02" : "2.5px solid #0f172a") : "2.5px solid transparent",
            }}
          >
            <MapIcon size={18} />
            <span>Live Map</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-tab ${activeMobileView === "truck" ? "active" : ""}`}
            onClick={() => handleMobileViewChange("truck")}
            style={{
              color: activeMobileView === "truck" ? (isDarkMode ? "#faff02" : "#0f172a") : (isDarkMode ? "#888888" : "#64748b"),
              borderTop: activeMobileView === "truck" ? (isDarkMode ? "2.5px solid #faff02" : "2.5px solid #0f172a") : "2.5px solid transparent",
            }}
          >
            <TruckIcon size={18} />
            <span>Cargo Bay (3D)</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-tab ${activeMobileView === "orders" ? "active" : ""}`}
            onClick={() => handleMobileViewChange("orders")}
            style={{
              color: activeMobileView === "orders" ? (isDarkMode ? "#faff02" : "#0f172a") : (isDarkMode ? "#888888" : "#64748b"),
              borderTop: activeMobileView === "orders" ? (isDarkMode ? "2.5px solid #faff02" : "2.5px solid #0f172a") : "2.5px solid transparent",
            }}
          >
            <ClipboardList size={18} />
            <span>Orders (2)</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
