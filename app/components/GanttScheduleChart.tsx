"use client";

import { useState } from "react";
import {
  Calendar,
  List,
  SlidersHorizontal,
  Settings,
  Maximize2,
  Minimize2,
  ChevronDown,
  Square,
  CheckSquare,
  Check,
  Clock,
  X,
} from "lucide-react";

interface GanttTask {
  id: string;
  orderCode: string;
  driverName: string;
  startPercent: number;
  widthPercent: number;
  barColor: string;
  endLabel?: string;
  offsetLabel?: string;
  offsetColor?: string;
  isChecked?: boolean;
}

const INITIAL_GANTT_TASKS: GanttTask[] = [
  {
    id: "g-1",
    orderCode: "UTD38723",
    driverName: "John Davis (Unit #402)",
    startPercent: 12,
    widthPercent: 18,
    barColor: "#2563eb",
    endLabel: "16:21",
    isChecked: true,
  },
  {
    id: "g-2",
    orderCode: "AB36263",
    driverName: "Marcus Vance (Unit #119)",
    startPercent: 12,
    widthPercent: 24,
    barColor: "#1d4ed8",
    endLabel: "16:52",
    isChecked: false,
  },
  {
    id: "g-3",
    orderCode: "STR38377",
    driverName: "Elena Rostova (Unit #304)",
    startPercent: 28,
    widthPercent: 36,
    barColor: "#0d9488",
    endLabel: "21:05",
    offsetLabel: "+1:17",
    offsetColor: "#2dd4bf",
    isChecked: false,
  },
  {
    id: "g-4",
    orderCode: "GHT3535",
    driverName: "Carlos Mendez (Unit #812)",
    startPercent: 44,
    widthPercent: 40,
    barColor: "#16a34a",
    endLabel: "23:17",
    offsetLabel: "+2:10",
    offsetColor: "#4ade80",
    isChecked: false,
  },
  {
    id: "g-5",
    orderCode: "GHR37652",
    driverName: "Samir Patel (Unit #515)",
    startPercent: 40,
    widthPercent: 34,
    barColor: "#eab308",
    endLabel: "21:42",
    offsetLabel: "+1:37",
    offsetColor: "#facc15",
    isChecked: false,
  },
];

export default function GanttScheduleChart({
  selectedOrder = "UTD38723",
  onSelectOrder,
  onShowToast,
}: {
  selectedOrder?: string;
  onSelectOrder?: (code: string) => void;
  onShowToast?: (msg: string) => void;
}) {
  const [tasks, setTasks] = useState<GanttTask[]>(INITIAL_GANTT_TASKS);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Freight Orders");
  const [showCalendarMenu, setShowCalendarMenu] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>("Friday, Dec 20, 2025");
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<GanttTask | null>(null);
  const [timelineGranularity, setTimelineGranularity] = useState<"2h" | "1h">("2h");

  const currentTimePercent = 74; // Position of "21:32" line

  const toggleCheck = (id: string, code: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isChecked: !t.isChecked } : t))
    );
    onSelectOrder?.(code);
    onShowToast?.(`Gantt focus: Task ${code}`);
  };

  const handleBarClick = (task: GanttTask) => {
    setActiveTooltip(activeTooltip?.id === task.id ? null : task);
    onSelectOrder?.(task.orderCode);
    onShowToast?.(`Selected ${task.orderCode} (${task.driverName})`);
  };

  return (
    <div
      className={`gantt-chart-card ${isMaximized ? "maximized-quadrant" : ""}`}
      style={
        isMaximized
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 9990,
              borderRadius: 0,
            }
          : {}
      }
    >
      {/* Header Bar */}
      <div className="gantt-card-header" style={{ position: "relative" }}>
        <div className="gantt-title-group">
          <h3 className="gantt-card-title">Gantt Chart</h3>

          {/* Category Filter Dropdown */}
          <div
            className="gantt-filter-dropdown"
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
            style={{ cursor: "pointer" }}
            title="Click to filter timeline category"
          >
            <span>{selectedCategory}</span>
            <ChevronDown size={13} />
          </div>

          {/* Category Dropdown Menu */}
          {showCategoryMenu && (
            <div
              className="cockpit-dropdown-menu"
              style={{
                top: 34,
                left: 100,
                minWidth: 180,
                padding: 6,
              }}
            >
              {["Freight Orders", "Driver Shifts", "Hub Inbound", "Critical Path Only"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`dropdown-item ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setShowCategoryMenu(false);
                    onShowToast?.(`Timeline filtered by: ${cat}`);
                  }}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check size={13} className="text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="gantt-card-actions">
          {/* Date Picker Button */}
          <button
            type="button"
            className="gantt-date-btn"
            onClick={() => setShowCalendarMenu(!showCalendarMenu)}
            title="Select Timeline Date"
          >
            <Calendar size={13} />
            <span>{selectedDate}</span>
          </button>

          {/* Calendar Picker Popup */}
          {showCalendarMenu && (
            <div
              className="cockpit-dropdown-menu"
              style={{
                top: 36,
                right: 130,
                left: "auto",
                minWidth: 200,
                padding: 6,
              }}
            >
              {["Thursday, Dec 19, 2025", "Friday, Dec 20, 2025", "Saturday, Dec 21, 2025"].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`dropdown-item ${selectedDate === d ? "active" : ""}`}
                  onClick={() => {
                    setSelectedDate(d);
                    setShowCalendarMenu(false);
                    onShowToast?.(`Gantt date loaded: ${d}`);
                  }}
                >
                  <span>{d}</span>
                  {selectedDate === d && <Check size={13} className="text-blue-600" />}
                </button>
              ))}
            </div>
          )}

          {/* List View Toggle */}
          <button
            type="button"
            className="gantt-util-btn"
            title="Toggle Schedule Table View"
            onClick={() => onShowToast?.("Toggled schedule table breakdown")}
          >
            <List size={13} />
          </button>

          {/* Filter Schedule Button */}
          <button
            type="button"
            className="gantt-util-btn"
            title="Filter by Timeline Duration"
            onClick={() => onShowToast?.("Filter: Showing active shifts & deliveries")}
          >
            <SlidersHorizontal size={13} />
          </button>

          {/* Gantt Settings Button */}
          <button
            type="button"
            className="gantt-util-btn"
            title="Timeline Zoom & Granularity"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          >
            <Settings size={13} />
          </button>

          {/* Settings Popup */}
          {showSettingsMenu && (
            <div
              className="cockpit-dropdown-menu"
              style={{
                top: 36,
                right: 36,
                left: "auto",
                minWidth: 190,
                padding: 6,
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, padding: "4px 8px", color: "#6b7280" }}>
                Timeline Granularity
              </div>
              <button
                type="button"
                className={`dropdown-item ${timelineGranularity === "2h" ? "active" : ""}`}
                onClick={() => {
                  setTimelineGranularity("2h");
                  setShowSettingsMenu(false);
                  onShowToast?.("Timeline scale: 2-hour increments");
                }}
              >
                <span>2-Hour Windows (Default)</span>
              </button>
              <button
                type="button"
                className={`dropdown-item ${timelineGranularity === "1h" ? "active" : ""}`}
                onClick={() => {
                  setTimelineGranularity("1h");
                  setShowSettingsMenu(false);
                  onShowToast?.("Timeline scale: 1-hour increments");
                }}
              >
                <span>1-Hour High Resolution</span>
              </button>
            </div>
          )}

          {/* Maximize Button */}
          <button
            type="button"
            className="gantt-util-btn"
            title={isMaximized ? "Restore Normal View" : "Maximize Gantt Timeline"}
            onClick={() => {
              setIsMaximized(!isMaximized);
              onShowToast?.(isMaximized ? "Restored normal view" : "Maximized Gantt chart");
            }}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Timeline Ruler Header */}
      <div className="gantt-timeline-header">
        <div className="timeline-code-col" />
        <div className="timeline-hours-track">
          <span style={{ left: "10%" }}>14:00</span>
          <span style={{ left: "26%" }}>16:00</span>
          <span style={{ left: "42%" }}>18:00</span>
          <span style={{ left: "58%" }}>20:00</span>
          <span style={{ left: "80%" }}>22:00</span>
          <span style={{ left: "96%" }}>00:00</span>

          {/* Current Time Marker Pill (21:32) */}
          <div
            className="current-time-marker-pill"
            style={{ left: `${currentTimePercent}%`, cursor: "pointer" }}
            onClick={() => onShowToast?.("Current dispatch time: 21:32 UTC (On Schedule)")}
            title="Current Live Time Marker"
          >
            21:32
          </div>
        </div>
      </div>

      {/* Gantt Body & Rows */}
      <div className="gantt-body-container" style={{ position: "relative" }}>
        {/* Continuous Vertical Current Time Indicator Line */}
        <div
          className="current-time-vertical-rule"
          style={{ left: `calc(130px + (100% - 130px) * ${currentTimePercent / 100})` }}
        />

        {/* Task Rows */}
        {tasks.map((task) => {
          const isSelected = task.orderCode === selectedOrder || task.isChecked;

          return (
            <div
              key={task.id}
              className="gantt-row"
              style={{
                background: isSelected ? "rgba(37, 99, 235, 0.04)" : undefined,
                borderRadius: 4,
              }}
            >
              {/* Left: Checkbox & Order ID */}
              <div
                className="gantt-row-label"
                onClick={() => toggleCheck(task.id, task.orderCode)}
                title="Click to check task"
              >
                {isSelected ? (
                  <CheckSquare size={13} className="gantt-check checked text-blue-600" />
                ) : (
                  <Square size={13} className="gantt-check" />
                )}
                <span className="gantt-code" style={{ fontWeight: isSelected ? 700 : 500 }}>
                  {task.orderCode}
                </span>
              </div>

              {/* Right: Bar Track Area */}
              <div className="gantt-bar-track">
                {/* Optional Offset Dotted Delay Line */}
                {task.offsetLabel && (
                  <div
                    className="gantt-offset-connector"
                    style={{
                      left: `${task.startPercent - 12}%`,
                      width: `12%`,
                      borderColor: task.offsetColor,
                    }}
                    title={`Delay Offset: ${task.offsetLabel}`}
                  >
                    <span className="offset-badge" style={{ color: task.offsetColor }}>
                      {task.offsetLabel}
                    </span>
                  </div>
                )}

                {/* Solid Scheduled Bar */}
                <div
                  className="gantt-bar-fill"
                  style={{
                    left: `${task.startPercent}%`,
                    width: `${task.widthPercent}%`,
                    backgroundColor: task.barColor,
                    cursor: "pointer",
                    transform: isSelected ? "scaleY(1.2)" : "scaleY(1)",
                    transition: "transform 0.15s ease",
                  }}
                  onClick={() => handleBarClick(task)}
                  title={`Order #${task.orderCode} - Driver: ${task.driverName} - Click for details`}
                >
                  {task.endLabel && (
                    <span className="gantt-bar-end-time">{task.endLabel}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating Bar Detail Tooltip */}
        {activeTooltip && (
          <div
            className="cockpit-modal-card"
            style={{
              position: "absolute",
              bottom: 8,
              right: 16,
              width: 260,
              padding: 12,
              zIndex: 30,
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={13} className="text-blue-600" />
                <span style={{ fontSize: "12px", fontWeight: 700 }}>{activeTooltip.orderCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <X size={13} />
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: 6, lineHeight: 1.4 }}>
              <div>• <b>Driver:</b> {activeTooltip.driverName}</div>
              <div>• <b>Scheduled End:</b> {activeTooltip.endLabel}</div>
              {activeTooltip.offsetLabel && (
                <div>• <b>Traffic Delay:</b> {activeTooltip.offsetLabel}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
