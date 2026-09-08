const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '../app/components/CockpitHeader.tsx');
let content = fs.readFileSync(headerPath, 'utf8');

const oldHeaderCenterStart = `{/* Center Group: Centered Search / Scenario Command Panel + Action Buttons */}`;
const oldHeaderCenterEnd = `{/* Right Group: Archive, Notifications, Settings, Profile */}`;

const startIndex = content.indexOf(oldHeaderCenterStart);
const endIndex = content.indexOf(oldHeaderCenterEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find delimiters in CockpitHeader.tsx");
  process.exit(1);
}

const newHeaderCenter = `{/* Center Group: Unified Capsule Navigation & Search Panel matching App Theme */}
      <div className="header-center">
        <div className="nav-pill-container" style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f4f5f7", border: "1px solid #e2e5ea", borderRadius: "24px", padding: "3px 6px" }}>
          {/* Integrated Search / Scenario Command Pill */}
          <div className="search-scenario-panel" style={{ position: "relative" }}>
            <button
              type="button"
              className="scenario-search-trigger"
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              title="Search route scenarios (Dijkstra shortest paths)"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "#ffffff",
                border: "none",
                borderRadius: "18px",
                padding: "4.5px 12px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                transition: "all 0.15s ease",
              }}
            >
              <Search size={13} style={{ color: "#4b5563", flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>Route:</span>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#111827" }}>
                {activeScenario}
              </span>
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  background: "#eef2f6",
                  color: "#374151",
                  padding: "2px 7px",
                  borderRadius: "10px",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.2px",
                }}
              >
                Origin → D1 → D2 → D3
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
            </button>

            {/* Searchable Scenarios Dropdown (Theme Matched) */}
            {showScenarioMenu && (
              <div
                className="cockpit-dropdown-menu scenario-search-dropdown"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: "calc(100% + 8px)",
                  width: 390,
                  maxHeight: 440,
                  overflowY: "auto",
                  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.14)",
                  padding: "8px",
                  zIndex: 9999,
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e5ea",
                }}
              >
                {/* Search Filter Box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    background: "#f4f5f7",
                    border: "1px solid #e2e5ea",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    marginBottom: 8,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Search size={13} style={{ color: "#6b7280" }} />
                  <input
                    type="text"
                    placeholder="Search route or hub (Tribeca, Canal, D1, D2)..."
                    value={scenarioSearchFilter}
                    onChange={(e) => setScenarioSearchFilter(e.target.value)}
                    autoFocus
                    style={{
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "11.5px",
                      width: "100%",
                      color: "#111827",
                      fontFamily: "inherit",
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
                        color: "#9ca3af",
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
                    color: "#6b7280",
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
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                          padding: "8px 10px",
                          borderRadius: "8px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 4,
                          textAlign: "left",
                          background: isActive ? "#eff6ff" : "transparent",
                          border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                          cursor: "pointer",
                          transition: "all 0.12s ease",
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
                              color: isActive ? "#1d4ed8" : "#111827",
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
                            marginTop: 1,
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
                          <span style={{ color: "#9ca3af" }}>→</span>
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

          <span className="nav-inline-divider" style={{ width: 1, height: 16, background: "#e2e5ea", margin: "0 2px" }} />

          {/* Quick Action Buttons within same capsule */}
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

const updatedContent = content.substring(0, startIndex) + newHeaderCenter + content.substring(endIndex);
fs.writeFileSync(headerPath, updatedContent, 'utf8');
console.log("Successfully updated search bar to match FoxFreight color scheme!");
