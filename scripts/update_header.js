const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '../app/components/CockpitHeader.tsx');
let content = fs.readFileSync(headerPath, 'utf8');

// Replace the entire header JSX body up to header-right
const oldHeaderStart = `{/* Left Group: Menu & Interactive Search/Scenario Panel */}`;
const oldHeaderEnd = `{/* Right Group: Archive, Notifications, Settings, Profile */}`;

const startIndex = content.indexOf(oldHeaderStart);
const endIndex = content.indexOf(oldHeaderEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find delimiters in CockpitHeader.tsx");
  process.exit(1);
}

const newHeaderMiddle = `{/* Left Group: Truck Logo & Dispatch Command Menu */}
      <div className="header-left" style={{ position: "relative" }}>
        {/* Truck Logo Button (Replaces hamburger icon) */}
        <button
          type="button"
          className="header-truck-logo-btn"
          title="FoxFreight Fleet Dispatch Command & Telematics Menu"
          onClick={() => setShowQuickMenu(!showQuickMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 10px",
            borderRadius: "8px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1d4ed8",
            cursor: "pointer",
            transition: "all 0.18s ease",
          }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 5px rgba(37, 99, 235, 0.35)",
            }}
          >
            <Truck size={14} style={{ strokeWidth: 2.3 }} />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: "13px",
              letterSpacing: "-0.3px",
              color: "#0f172a",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Fox<span style={{ color: "#2563eb" }}>Freight</span>
          </span>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#16a34a",
              boxShadow: "0 0 6px rgba(22, 163, 74, 0.6)",
            }}
            title="Live GPS Fleet Stream Connected"
          />
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

      {/* Center Group: Centered Search / Scenario Command Panel + Action Buttons */}
      <div className="header-center" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Search / Operating Scenario Command Panel (Centered & Theme Styled) */}
        <div className="search-scenario-panel" style={{ position: "relative" }}>
          <div
            className="scenario-search-trigger"
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            title="Search & select route scenarios with Dijkstra shortest paths"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "9px",
              padding: "6px 13px",
              cursor: "pointer",
              transition: "all 0.18s ease",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
          >
            <Search size={14} style={{ color: "#2563eb", flexShrink: 0 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Route:
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>
                {activeScenario}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  padding: "1.5px 7px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  letterSpacing: "0.2px",
                }}
              >
                Origin → D1 → D2 → D3
              </span>
            </div>
            <ChevronDown
              size={13}
              style={{
                color: "#64748b",
                transform: showScenarioMenu ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
                marginLeft: 3,
              }}
            />
          </div>

          {/* Searchable Scenarios Dropdown */}
          {showScenarioMenu && (
            <div
              className="cockpit-dropdown-menu scenario-search-dropdown"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 6px)",
                width: 400,
                maxHeight: 450,
                overflowY: "auto",
                boxShadow: "0 14px 35px rgba(15, 23, 42, 0.16)",
                padding: "8px",
                zIndex: 9999,
                background: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            >
              {/* Search Filter Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "7px",
                  padding: "6px 10px",
                  marginBottom: 8,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Search size={13} style={{ color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Search route, hub (Tribeca, Canal, D1, D2)..."
                  value={scenarioSearchFilter}
                  onChange={(e) => setScenarioSearchFilter(e.target.value)}
                  autoFocus
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "11.5px",
                    width: "100%",
                    color: "#0f172a",
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
                      color: "#94a3b8",
                      display: "flex",
                    }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* Header Label */}
              <div
                style={{
                  padding: "4px 8px 6px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Dijkstra Shortest Path Routes</span>
                <span style={{ fontSize: "9.5px", color: "#2563eb", fontWeight: 700 }}>Map Real Street Lanes</span>
              </div>

              {/* Scenarios List with Origin, D1, D2, D3 Points */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {filteredScenarios.map((sc) => {
                  const isActive = sc.name === activeScenario;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      className={\`dropdown-item \${isActive ? "active" : ""}\`}
                      onClick={() => {
                        handleSelectScenario(sc.name);
                        setScenarioSearchFilter("");
                      }}
                      style={{
                        padding: "9px 10px",
                        borderRadius: "7px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 4,
                        textAlign: "left",
                        background: isActive ? "#eff6ff" : "transparent",
                        border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                        cursor: "pointer",
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
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "12px",
                            color: isActive ? "#1d4ed8" : "#0f172a",
                          }}
                        >
                          {sc.name}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              background: "#fef08a",
                              color: "#854d0e",
                              padding: "1.5px 5px",
                              borderRadius: "3px",
                            }}
                          >
                            {sc.badge}
                          </span>
                          {isActive && <Check size={14} className="text-blue-600" />}
                        </div>
                      </div>

                      {/* Distinct Checkpoint Points for this Scenario: Origin -> D1 -> D2 -> D3 */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 3,
                          marginTop: 2,
                          fontSize: "9.5px",
                        }}
                      >
                        <span
                          style={{
                            background: "#dbeafe",
                            color: "#1e40af",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "3px",
                          }}
                        >
                          Origin: {sc.checkpoints.origin.name.replace("Origin: ", "")}
                        </span>
                        <span style={{ color: "#94a3af" }}>→</span>
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#334155",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "3px",
                          }}
                        >
                          D1: {sc.checkpoints.d1.name.replace("Checkpoint D1: ", "")}
                        </span>
                        <span style={{ color: "#94a3af" }}>→</span>
                        <span
                          style={{
                            background: "#f1f5f9",
                            color: "#334155",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "3px",
                          }}
                        >
                          D2: {sc.checkpoints.d2.name.replace("Checkpoint D2: ", "")}
                        </span>
                        <span style={{ color: "#94a3af" }}>→</span>
                        <span
                          style={{
                            background: "#dbeafe",
                            color: "#1e40af",
                            fontWeight: 600,
                            padding: "1px 5px",
                            borderRadius: "3px",
                          }}
                        >
                          D3: {sc.checkpoints.d3.name.replace("Checkpoint D3: ", "")}
                        </span>
                      </div>

                      <div
                        className="dropdown-item-desc"
                        style={{
                          marginTop: 2,
                          fontSize: "10.5px",
                          color: "#64748b",
                          lineHeight: "1.3",
                        }}
                      >
                        {sc.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (Optimizer pill removed) */}
        <div className="nav-pill-container" style={{ marginLeft: "4px" }}>
          {/* Quick Action Buttons */}
          <button
            type="button"
            className="nav-action-btn"
            title="Undo Last Dispatch Change"
            onClick={() => onShowToast?.("Undo: Previous route state restored")}
          >
            <Undo2 size={13} />
          </button>

          <button
            type="button"
            className="nav-action-btn"
            title="Redo Dispatch Change"
            onClick={() => onShowToast?.("Redo: Applied route optimization step")}
          >
            <Redo2 size={13} />
          </button>

          <button
            type="button"
            className="nav-action-btn"
            title="Split Route Scenario (A/B Test)"
            onClick={() => setShowSplitModal(true)}
          >
            <GitFork size={13} />
          </button>

          <button
            type="button"
            className="nav-action-btn"
            title="Toggle Cockpit Layout Mode"
            onClick={() => onShowToast?.("Toggled Quad-Quadrant Cockpit Mode")}
          >
            <List size={13} />
          </button>

          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            className="nav-action-btn dark-pill"
            title={isDarkMode ? "Switch to Daylight Mode" : "Switch to Surveillance Dark Mode"}
            onClick={onToggleDarkMode}
          >
            {isDarkMode ? <Sun size={12} className="text-yellow-300" /> : <Moon size={12} />}
          </button>
        </div>
      </div>
      
      `;

const updatedContent = content.substring(0, startIndex) + newHeaderMiddle + content.substring(endIndex);
fs.writeFileSync(headerPath, updatedContent, 'utf8');
console.log("Successfully updated CockpitHeader.tsx with Truck logo and centered search bar!");
