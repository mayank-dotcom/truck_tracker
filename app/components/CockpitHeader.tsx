"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Undo2,
  Redo2,
  GitFork,
  List,
  Square,
  Archive,
  Bell,
  Settings,
  ChevronDown,
  Zap,
  Menu,
  X,
  Check,
  Truck,
  Sun,
  Moon,
  AlertTriangle,
  Package,
  Layers,
  Fuel,
  Sliders,
  User,
  MapPin,
} from "lucide-react";

interface CockpitHeaderProps {
  activeScenario?: string;
  onScenarioChange?: (scenario: string) => void;
  activeNavTab?: string;
  onNavTabChange?: (tab: string) => void;
  isOptimizerActive?: boolean;
  onOptimizerClick?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onShowToast?: (msg: string) => void;
}

import { STATIC_SCENARIOS, StaticScenario } from "../lib/staticRoutes";

const INITIAL_NOTIFICATIONS = [
  {
    id: "n-1",
    type: "critical",
    title: "Traffic Congestion on I-278",
    detail: "46 min bottleneck near Gowanus. Reroute advised.",
    time: "2m ago",
  },
  {
    id: "n-2",
    type: "warning",
    title: "Pallet #837726633 Ready",
    detail: "Bay 4 inspection passed. Loading authorization granted.",
    time: "8m ago",
  },
  {
    id: "n-3",
    type: "success",
    title: "AI Optimizer Found +$1,100",
    detail: "2 backhaul pickups merged into return route.",
    time: "15m ago",
  },
];

export default function CockpitHeader({
  activeScenario = "PB-LP-PB Scenario",
  onScenarioChange,
  activeNavTab = "Optimizer",
  onNavTabChange,
  isOptimizerActive = true,
  onOptimizerClick,
  isDarkMode = false,
  onToggleDarkMode,
  onShowToast,
}: CockpitHeaderProps) {
  // Dropdowns and Modals state
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [scenarioSearchFilter, setScenarioSearchFilter] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);

  // Filter scenarios based on user search in the scenario search panel
  const filteredScenarios = STATIC_SCENARIOS.filter((sc) => {
    if (!scenarioSearchFilter.trim()) return true;
    const query = scenarioSearchFilter.toLowerCase();
    return (
      sc.name.toLowerCase().includes(query) ||
      sc.desc.toLowerCase().includes(query) ||
      sc.checkpoints.origin.name.toLowerCase().includes(query) ||
      sc.checkpoints.d1.name.toLowerCase().includes(query) ||
      sc.checkpoints.d2.name.toLowerCase().includes(query) ||
      sc.checkpoints.d3.name.toLowerCase().includes(query)
    );
  });

  // Active scenario object for dynamic checkpoint labels
  const activeScenarioObj =
    STATIC_SCENARIOS.find((sc) => sc.name === activeScenario) || STATIC_SCENARIOS[0];

  const getCheckpointShortLabel = (name: string): string => {
    return name
      .replace(/^Origin:\s*/i, "")
      .replace(/^Checkpoint\s+(D1|D2|D3):\s*/i, "")
      .replace(/\s*\(Final\)/i, "")
      .replace(/\s+(Terminal|Distribution Center|Distribution Hub|Interchange|Transit Bay|Cold Depot|Cargo Deck|Financial Dock|Container Facility|Vault|Depot|Hub)/gi, "")
      .trim();
  };

  // Notifications state
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Settings state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unitSystem, setUnitSystem] = useState<"lb" | "kg">("lb");
  const [refreshRate, setRefreshRate] = useState<"100ms" | "1s">("100ms");



  const handleTabSelect = (tab: string) => {
    onNavTabChange?.(tab);
    if (tab === "Optimizer") {
      onOptimizerClick?.();
    }
  };

  const handleSelectScenario = (scenarioName: string) => {
    onScenarioChange?.(scenarioName);
    setShowScenarioMenu(false);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    onShowToast?.("Alert dismissed");
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    onShowToast?.("All notifications cleared");
    setShowNotifications(false);
  };

  return (
    <header className="cockpit-header">
      {/* Left Group: Truck Logo & Dispatch Command Menu */}
      <div className="header-left" style={{ position: "relative" }}>
        {/* Zoomer Brand & Menu Trigger */}
        <button
          type="button"
          className="header-icon-btn"
          title="Zoomer Fleet Dispatch Command & Telematics Menu"
          onClick={() => setShowQuickMenu(!showQuickMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "2px 6px",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary, #111827)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image.png"
            alt="Zoomer Logo"
            className="cockpit-brand-logo"
            style={{
              height: "48px",
              width: "auto",
              objectFit: "contain",
              display: "block",
            }}
          />
          <span
            className="molle-regular-italic cockpit-brand-text"
            style={{
              fontFamily: '"Molle", cursive',
              fontWeight: 400,
              fontStyle: "italic",
              fontSize: "23px",
              color: "inherit",
              lineHeight: 1,
            }}
          >
            Zoomer
          </span>
        </button>

        {/* Quick Menu Popup */}
        {showQuickMenu && (
          <div className="cockpit-dropdown-menu" style={{ left: 0, minWidth: 240, top: "calc(100% + 6px)" }}>
            <div
              style={{
                padding: "8px 12px",
                fontSize: "11px",
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Dispatch Command Tools
            </div>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                onShowToast?.("Telemetry radar: 48 units active in Tri-State corridor");
                setShowQuickMenu(false);
              }}
            >
              <Truck size={14} className="text-blue-600" />
              <div>
                <div>Live Fleet Telematics</div>
                <div className="dropdown-item-desc">48 units on road</div>
              </div>
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                onShowToast?.("Fuel & Toll Arbitrage: $412 saved today");
                setShowQuickMenu(false);
              }}
            >
              <Fuel size={14} className="text-green-600" />
              <div>
                <div>Fuel & Toll Arbitrage</div>
                <div className="dropdown-item-desc">NJ Turnpike bypass active</div>
              </div>
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                onShowToast?.("eBOL Manifest Vault loaded: 16 verified bills");
                setShowQuickMenu(false);
              }}
            >
              <Layers size={14} className="text-teal-600" />
              <div>
                <div>eBOL Digital Vault</div>
                <div className="dropdown-item-desc">16 verified bills of lading</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Center Group: Clean Centered Search / Scenario Command Panel */}
      <div className="header-center">
        {/* Integrated Search / Scenario Command Pill */}
        <div className="search-scenario-panel" style={{ position: "relative" }}>
          {/* Outer pill container matching reference image: dark body + circular icon on right */}
          <button
            type="button"
            className="scenario-search-trigger"
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            title="Search route scenarios (Dijkstra shortest paths)"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "280px",
              background: "#ffffff",
              border: "1.5px solid var(--text-secondary, #4b5563)",
              borderRadius: "9999px",
              padding: "0px 1px 0px 14px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <MapPin size={13} style={{ color: "#6b7280", flexShrink: 0 }} />
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#111827" }}>
                {activeScenario}
              </span>
              <ChevronDown
                size={12}
                style={{
                  color: "#6b7280",
                  transform: showScenarioMenu ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                  marginLeft: 1,
                }}
              />
            </div>

            {/* Circular Yellow Search Icon Button on the Right */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#faff02",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#111827",
                flexShrink: 0,
                transform: "translateX(1px)",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
              }}
            >
              <Search size={16} style={{ strokeWidth: 2.8 }} />
            </div>
          </button>

          {/* Minimal Yellow Map-Card Styled Search Dropdown */}
          {showScenarioMenu && (
            <div
              className="cockpit-dropdown-menu scenario-search-dropdown"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 6px)",
                width: 320,
                maxHeight: 380,
                overflowY: "auto",
                background: "rgba(254, 252, 191, 0.95)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: "8px",
                padding: "8px",
                zIndex: 9999,
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Minimal Search Filter Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "rgba(255, 255, 255, 0.85)",
                  border: "1px solid rgba(0, 0, 0, 0.09)",
                  borderRadius: "6px",
                  padding: "5px 9px",
                  marginBottom: 6,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Search size={12} style={{ color: "#475569" }} />
                <input
                  type="text"
                  placeholder="Search route (Tribeca, Canal, Metro)..."
                  value={scenarioSearchFilter}
                  onChange={(e) => setScenarioSearchFilter(e.target.value)}
                  autoFocus
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "11px",
                    width: "100%",
                    color: "#0f172a",
                    fontFamily: "inherit",
                    fontWeight: 500,
                  }}
                />
                {scenarioSearchFilter && (
                  <button
                    type="button"
                    onClick={() => setScenarioSearchFilter("")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      display: "flex",
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Minimal Scenarios List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {filteredScenarios.map((sc) => {
                  const isActive = sc.name === activeScenario;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        handleSelectScenario(sc.name);
                        setScenarioSearchFilter("");
                      }}
                      style={{
                        padding: "7px 9px",
                        borderRadius: "7px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        textAlign: "left",
                        background: isActive ? "#ffffff" : "transparent",
                        border: isActive ? "1px solid rgba(0, 0, 0, 0.12)" : "1px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                        boxShadow: isActive ? "0 1px 4px rgba(0, 0, 0, 0.08)" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          width: "100%",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "11.5px",
                              color: "#0f172a",
                            }}
                          >
                            {sc.name}
                          </span>
                          {isActive && <Check size={12} style={{ color: "#0f172a", strokeWidth: 3 }} />}
                        </div>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: 800,
                            background: isActive ? "#faff02" : "rgba(0, 0, 0, 0.06)",
                            color: "#0f172a",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          {sc.badge}
                        </span>
                      </div>

                      {/* Minimal Origin -> Destination summary */}
                      <div
                        style={{
                          fontSize: "9.5px",
                          color: "#475569",
                          fontWeight: 500,
                          marginTop: "1.5px",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <span>{sc.checkpoints.origin.name.replace("Origin: ", "").split(" ")[0]}</span>
                        <span>→</span>
                        <span>{sc.checkpoints.d1.name.replace("Checkpoint D1: ", "").split(" ")[0]}</span>
                        <span>→</span>
                        <span>{sc.checkpoints.d2.name.replace("Checkpoint D2: ", "").split(" ")[0]}</span>
                        <span>→</span>
                        <span>{sc.checkpoints.d3.name.replace("Checkpoint D3: ", "").split(" ")[0]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Group: Notifications, Theme Toggle, Settings, Profile */}
      <div className="header-right" style={{ position: "relative", display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Notification Bell with Badge */}
        <div className="notification-wrapper">
          <button
            type="button"
            className="header-icon-btn"
            title="Dispatch Alerts & Telemetry"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={16} />
          </button>
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}

          {/* Notification Flyout */}
          {showNotifications && (
            <div className="header-flyout-panel">
              <div className="flyout-header">
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span className="flyout-title">Dispatch Alerts</span>
                  <span className="flyout-badge">{notifications.length} Active</span>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllNotifications}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "10.5px",
                      color: "#6b7280",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="flyout-list">
                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 16px",
                      textAlign: "center",
                      color: "#9ca3af",
                      fontSize: "12px",
                    }}
                  >
                    No pending dispatch alerts
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className="flyout-item"
                      onClick={() => handleDismissNotification(item.id)}
                    >
                      <div className="flyout-item-top">
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {item.type === "critical" && (
                            <AlertTriangle size={13} className="text-orange-600" />
                          )}
                          {item.type === "warning" && (
                            <Package size={13} className="text-yellow-600" />
                          )}
                          {item.type === "success" && (
                            <Zap size={13} className="text-green-600" />
                          )}
                          <span>{item.title}</span>
                        </div>
                        <span className="flyout-item-time">{item.time}</span>
                      </div>
                      <div className="flyout-item-text">{item.detail}</div>
                      <span className="flyout-item-action">Click to acknowledge & dismiss →</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>



        {/* User Profile Avatar with Yellow Map-Card Circular Treatment */}
        <button
          type="button"
          className="header-user-avatar"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          title="Dispatcher: Alex Mercer (Chief Logistics Officer)"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "#faff02",
            color: "#111827",
            border: "1px solid rgba(0, 0, 0, 0.12)",
            boxShadow: "0 1px 4px rgba(250, 255, 2, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <User size={15} style={{ strokeWidth: 2.4, color: "#111827" }} />
        </button>

        {/* User Profile Popup */}
        {showProfileMenu && (
          <div className="cockpit-dropdown-menu" style={{ right: 0, minWidth: 200, top: "calc(100% + 6px)" }}>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #e5e7eb",
                fontSize: "11px",
              }}
            >
              <div style={{ fontWeight: 700, color: "#111827" }}>Alex Mercer</div>
              <div style={{ color: "#6b7280", fontSize: "10px" }}>Lead Freight Dispatcher #482</div>
            </div>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                onShowToast?.("Profile settings opened");
                setShowProfileMenu(false);
              }}
            >
              <User size={13} />
              <span>Operator Profile</span>
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                onShowToast?.("Active dispatch session locked");
                setShowProfileMenu(false);
              }}
            >
              <Sliders size={13} />
              <span>Shift Preferences</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="cockpit-modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="cockpit-modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Settings size={15} className="text-blue-600" />
                <h3>Cockpit Preferences & Telemetry</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close settings modal"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-setting-row">
                <div className="modal-setting-info">
                  <div className="setting-title">Weight Measurement Units</div>
                  <div className="setting-desc">Toggle between Imperial pounds and Metric kilograms</div>
                </div>
                <div className="modal-setting-control">
                  <button
                    type="button"
                    className={`modal-btn ${unitSystem === "lb" ? "primary" : "secondary"}`}
                    onClick={() => {
                      setUnitSystem("lb");
                      onShowToast?.("Units set to Pounds (lb)");
                    }}
                  >
                    lb
                  </button>
                  <button
                    type="button"
                    className={`modal-btn ${unitSystem === "kg" ? "primary" : "secondary"}`}
                    onClick={() => {
                      setUnitSystem("kg");
                      onShowToast?.("Units set to Kilograms (kg)");
                    }}
                  >
                    kg
                  </button>
                </div>
              </div>

              <div className="modal-setting-row">
                <div className="modal-setting-info">
                  <div className="setting-title">GPS Telemetry Rate</div>
                  <div className="setting-desc">Real-time truck coordinates update frequency</div>
                </div>
                <div className="modal-setting-control">
                  <button
                    type="button"
                    className={`modal-btn ${refreshRate === "100ms" ? "primary" : "secondary"}`}
                    onClick={() => {
                      setRefreshRate("100ms");
                      onShowToast?.("GPS Rate: 100ms Ultra-Smooth");
                    }}
                  >
                    100ms
                  </button>
                  <button
                    type="button"
                    className={`modal-btn ${refreshRate === "1s" ? "primary" : "secondary"}`}
                    onClick={() => {
                      setRefreshRate("1s");
                      onShowToast?.("GPS Rate: 1s Eco");
                    }}
                  >
                    1s
                  </button>
                </div>
              </div>

              <div className="modal-setting-row">
                <div className="modal-setting-info">
                  <div className="setting-title">Surveillance Dark Mode</div>
                  <div className="setting-desc">High-contrast night vision interface</div>
                </div>
                <div className="modal-setting-control">
                  <button
                    type="button"
                    className={`modal-btn ${isDarkMode ? "primary" : "secondary"}`}
                    onClick={onToggleDarkMode}
                    style={{ minWidth: 64 }}
                  >
                    {isDarkMode ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              <div className="modal-setting-row">
                <div className="modal-setting-info">
                  <div className="setting-title">Dispatch Chime Sounds</div>
                  <div className="setting-desc">Audio feedback for critical alerts and orders</div>
                </div>
                <div className="modal-setting-control">
                  <button
                    type="button"
                    className={`modal-btn ${soundEnabled ? "primary" : "secondary"}`}
                    onClick={() => {
                      setSoundEnabled(!soundEnabled);
                      onShowToast?.(soundEnabled ? "Audio chime muted" : "Audio chime enabled");
                    }}
                    style={{ minWidth: 54 }}
                  >
                    {soundEnabled ? "On" : "Muted"}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => setShowSettingsModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={() => {
                  onShowToast?.("Settings saved to dispatcher profile");
                  setShowSettingsModal(false);
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Scenario A/B Modal */}
      {showSplitModal && (
        <div className="cockpit-modal-backdrop" onClick={() => setShowSplitModal(false)}>
          <div className="cockpit-modal-card split-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <GitFork size={16} className="text-blue-600" />
                <h3>Route Scenario Split Comparison (A / B)</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowSplitModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>
                    BRANCH A (Standard)
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, marginTop: 4 }}>
                    Direct Urban Corridor
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: 4 }}>
                    • Distance: 14.8 mi<br />
                    • Delay: +46 min traffic<br />
                    • Revenue: $4,200
                  </div>
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "#f8fee4",
                    border: "1px solid #faff02",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#4d7c0f" }}>
                    BRANCH B (AI Optimized)
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, marginTop: 4 }}>
                    Bypass + 2 Backhauls
                  </div>
                  <div style={{ fontSize: "11px", color: "#365314", marginTop: 4 }}>
                    • Distance: 18.2 mi<br />
                    • Delay: 0 min (Bypassed)<br />
                    • Revenue: $5,300 (+$1,100)
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => setShowSplitModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn primary"
                onClick={() => {
                  onShowToast?.("Applied Branch B: AI Optimized route active (+$1,100)");
                  setShowSplitModal(false);
                }}
              >
                Apply Branch B (+$1,100)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
