const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '../app/components/CockpitHeader.tsx');
let content = fs.readFileSync(headerPath, 'utf8');

const oldHeaderCenterStart = `{/* Center Group: Unified Capsule Navigation & Minimal Yellow Map-Card Styled Search Dropdown */}`;
const oldHeaderRightEnd = `{/* Settings Modal */}`;

const startIndex = content.indexOf(oldHeaderCenterStart);
const endIndex = content.indexOf(oldHeaderRightEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find delimiters in CockpitHeader.tsx");
  process.exit(1);
}

const newCenterAndRight = `{/* Center Group: Clean Centered Search / Scenario Command Panel */}
      <div className="header-center">
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
              borderRadius: "20px",
              padding: "4px 12px 4px 6px",
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

          {/* Minimal Yellow Map-Card Styled Search Dropdown */}
          {showScenarioMenu && (
            <div
              className="cockpit-dropdown-menu scenario-search-dropdown"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                top: "calc(100% + 8px)",
                width: 320,
                maxHeight: 380,
                overflowY: "auto",
                background: "rgba(254, 252, 191, 0.95)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                borderRadius: "12px",
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
                  borderRadius: "8px",
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

      {/* Right Group: Archive, Notifications, Theme Toggle, Settings, Profile */}
      <div className="header-right" style={{ position: "relative", display: "flex", alignItems: "center", gap: "6px" }}>
        {/* Archive Button */}
        <button
          type="button"
          className="header-icon-btn"
          title="Historical Dispatches Archive"
          onClick={() => onShowToast?.("Archive loaded: 318 past delivery manifests available")}
        >
          <Archive size={16} />
        </button>

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

        {/* Theme Toggle Button (Moved right next to Notification Bell) */}
        <button
          type="button"
          className="header-icon-btn theme-toggle-btn"
          title={isDarkMode ? "Switch to Daylight Mode" : "Switch to Surveillance Dark Mode"}
          onClick={onToggleDarkMode}
        >
          {isDarkMode ? <Sun size={16} className="text-yellow-300" /> : <Moon size={16} />}
        </button>

        {/* Settings Gear */}
        <button
          type="button"
          className="header-icon-btn"
          title="Cockpit Preferences & Telemetry Settings"
          onClick={() => setShowSettingsModal(true)}
        >
          <Settings size={16} />
        </button>

        {/* User Profile Avatar */}
        <button
          type="button"
          className="header-user-avatar"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          title="Dispatcher: Alex Mercer (Chief Logistics Officer)"
        >
          <span>AM</span>
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
    </header>

    `;

const updatedContent = content.substring(0, startIndex) + newCenterAndRight + content.substring(endIndex);
fs.writeFileSync(headerPath, updatedContent, 'utf8');
console.log("Successfully removed action buttons and moved theme toggle next to notification bell!");
