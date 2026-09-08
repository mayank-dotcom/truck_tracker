const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '../app/components/CockpitHeader.tsx');
let content = fs.readFileSync(headerPath, 'utf8');

const oldHeaderCenterStart = `{/* Center Group: Unified Capsule Navigation & Search Panel matching App Theme */}`;
const oldHeaderCenterEnd = `{/* Right Group: Archive, Notifications, Settings, Profile */}`;

const startIndex = content.indexOf(oldHeaderCenterStart);
const endIndex = content.indexOf(oldHeaderCenterEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find delimiters in CockpitHeader.tsx");
  process.exit(1);
}

const newHeaderCenter = `{/* Center Group: Unified Capsule Navigation & Search Panel matching App Theme with Signature Yellow (#faff02) */}
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
                gap: 8,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                padding: "3.5px 10px 3.5px 6px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
                transition: "all 0.15s ease",
              }}
            >
              {/* Signature Electric Yellow Search Icon Disc */}
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#faff02",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#111827",
                  boxShadow: "0 1px 4px rgba(250, 255, 2, 0.5)",
                  flexShrink: 0,
                }}
              >
                <Search size={11} style={{ strokeWidth: 2.8 }} />
              </div>

              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Route:</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                {activeScenario}
              </span>

              {/* Signature Yellow Checkpoints Badge */}
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 800,
                  background: "#faff02",
                  color: "#111827",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.2px",
                  boxShadow: "0 1px 3px rgba(250, 255, 2, 0.3)",
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

            {/* Searchable Scenarios Dropdown (Theme Matched with Signature Yellow Accents) */}
            {showScenarioMenu && (
              <div
                className="cockpit-dropdown-menu scenario-search-dropdown"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: "calc(100% + 8px)",
                  width: 410,
                  maxHeight: 450,
                  overflowY: "auto",
                  boxShadow: "0 14px 36px rgba(15, 23, 42, 0.16)",
                  padding: "10px",
                  zIndex: 9999,
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1.5px solid #faff02",
                }}
              >
                {/* Search Filter Box */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "7px 11px",
                    marginBottom: 10,
                    transition: "border-color 0.15s ease",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#faff02",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#111827",
                      flexShrink: 0,
                    }}
                  >
                    <Search size={10} style={{ strokeWidth: 2.8 }} />
                  </div>
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
                      fontSize: "12px",
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
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Header Label with Signature Yellow Pill */}
                <div
                  style={{
                    padding: "2px 6px 8px",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Dijkstra Shortest Path Routes</span>
                  <span
                    style={{
                      fontSize: "9.5px",
                      background: "#faff02",
                      color: "#111827",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      boxShadow: "0 1px 3px rgba(250, 255, 2, 0.4)",
                    }}
                  >
                    Map Real Street Lanes
                  </span>
                </div>

                {/* Scenarios List with Origin, D1, D2, D3 Points */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                          padding: "10px 11px",
                          borderRadius: "9px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 5,
                          textAlign: "left",
                          background: isActive ? "#fdffe5" : "transparent",
                          border: isActive ? "1.5px solid #faff02" : "1px solid #f1f5f9",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isActive ? "0 2px 6px rgba(250, 255, 2, 0.25)" : "none",
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
                              fontSize: "12.5px",
                              color: "#111827",
                            }}
                          >
                            {sc.name}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                background: isActive ? "#faff02" : "#fef08a",
                                color: "#111827",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid rgba(0,0,0,0.06)",
                              }}
                            >
                              {sc.badge}
                            </span>
                            {isActive && (
                              <span
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                  background: "#faff02",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#111827",
                                }}
                              >
                                <Check size={11} style={{ strokeWidth: 3 }} />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Distinct Checkpoint Points for this Scenario: Origin -> D1 -> D2 -> D3 */}
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 3.5,
                            marginTop: 1,
                            fontSize: "9.5px",
                          }}
                        >
                          <span
                            style={{
                              background: "#faff02",
                              color: "#111827",
                              fontWeight: 700,
                              padding: "1.5px 6px",
                              borderRadius: "4px",
                              border: "1px solid rgba(0,0,0,0.08)",
                            }}
                          >
                            Origin: {sc.checkpoints.origin.name.replace("Origin: ", "")}
                          </span>
                          <span style={{ color: "#94a3af", fontWeight: 700 }}>→</span>
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              fontWeight: 600,
                              padding: "1.5px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            D1: {sc.checkpoints.d1.name.replace("Checkpoint D1: ", "")}
                          </span>
                          <span style={{ color: "#94a3af", fontWeight: 700 }}>→</span>
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              fontWeight: 600,
                              padding: "1.5px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            D2: {sc.checkpoints.d2.name.replace("Checkpoint D2: ", "")}
                          </span>
                          <span style={{ color: "#94a3af", fontWeight: 700 }}>→</span>
                          <span
                            style={{
                              background: "#faff02",
                              color: "#111827",
                              fontWeight: 700,
                              padding: "1.5px 6px",
                              borderRadius: "4px",
                              border: "1px solid rgba(0,0,0,0.08)",
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
console.log("Successfully updated search bar with signature FoxFreight yellow (#faff02) accents!");
