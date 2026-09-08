"use client";

import { useState } from "react";
import {
  Calendar,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  Truck,
  Check,
  X,
  Activity,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface FreightOrder {
  id: string;
  orderCode: string;
  modelId: "truck1" | "truck2";
  truckLabel: string;
  status: "Awaiting" | "In Progress" | "Completed";
  originAddress: string;
  destAddress: string;
  departTime: string;
  currentTime?: string;
  arrivalTime: string;
  payload: number;
  progressPct?: number;
}

const INITIAL_ORDERS_DATA: FreightOrder[] = [
  {
    id: "fo-1",
    orderCode: "UTD38723",
    modelId: "truck1",
    truckLabel: "Truck 01",
    status: "In Progress",
    originAddress: "2464 Royal Ln. Mesa",
    destAddress: "Cockpit 376",
    departTime: "6:45",
    currentTime: "06:45",
    arrivalTime: "01:37",
    payload: 7640,
    progressPct: 52,
  },
  {
    id: "fo-2",
    orderCode: "UTD73525",
    modelId: "truck2",
    truckLabel: "Truck 02",
    status: "In Progress",
    originAddress: "6591 Elgin St. Celina",
    destAddress: "Cockpit 376",
    departTime: "8:15",
    currentTime: "10:30",
    arrivalTime: "03:40",
    payload: 11090,
    progressPct: 42,
  },
];

export default function FreightOrdersList({
  selectedOrder = "UTD38723",
  onSelectOrder,
  onShowToast,
  isDarkMode = false,
}: {
  selectedOrder?: string;
  onSelectOrder?: (code: string) => void;
  onShowToast?: (msg: string) => void;
  isDarkMode?: boolean;
}) {
  const [orders, setOrders] = useState<FreightOrder[]>(INITIAL_ORDERS_DATA);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState<boolean>(false);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>("Friday, Dec 20, 2025");
  const [statusFilter, setStatusFilter] = useState<"All" | "Awaiting" | "In Progress" | "Completed">("All");
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

  const handleOrderClick = (code: string) => {
    onSelectOrder?.(code);
    onShowToast?.(`Selected Order #${code} - Synchronized with Map & Truck Bay`);
  };

  const handleToggleSelectAll = () => {
    const next = !isAllSelected;
    setIsAllSelected(next);
    onShowToast?.(next ? "Selected all active freight orders" : "Deselected all orders");
  };

  // Always strictly show 2 orders as requested
  const filteredOrders = orders.slice(0, 2);

  return (
    <div
      className={`freight-orders-card ${isMaximized ? "maximized-quadrant" : ""}`}
      style={{
        background: isDarkMode ? "#0d0d0d" : "#ffffff",
        color: isDarkMode ? "#ffffff" : "#111827",
        ...(isMaximized
          ? {
              position: "fixed",
              inset: 0,
              zIndex: 9990,
              borderRadius: 0,
            }
          : {}),
      }}
    >
      {/* Header Bar */}
      <div className="freight-card-header" style={{ position: "relative", marginBottom: "8px" }}>
        <h3 className="freight-card-title" style={{ fontSize: "16px", fontWeight: 700, color: isDarkMode ? "#ffffff" : "var(--text-primary)" }}>
          Road Freight Orders
        </h3>

        <div className="freight-card-actions" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Calendar View Button */}
          <button
            type="button"
            className="freight-util-btn"
            title="Dispatch Calendar Date"
            style={{ width: 28, height: 28, borderRadius: 6, color: isDarkMode ? "#a1a1aa" : "#000000" }}
            onClick={() => {
              setShowCalendarMenu(!showCalendarMenu);
              setShowFilterMenu(false);
            }}
          >
            <Calendar size={18} />
          </button>

          {/* Filter Orders Button */}
          <button
            type="button"
            className={`freight-util-btn ${statusFilter !== "All" || showFilterMenu ? "active" : ""}`}
            title="Filter by Order Status"
            style={{ width: 28, height: 28, borderRadius: 6, color: isDarkMode ? (statusFilter !== "All" || showFilterMenu ? "#faff02" : "#a1a1aa") : "#000000" }}
            onClick={() => {
              setShowFilterMenu(!showFilterMenu);
              setShowCalendarMenu(false);
            }}
          >
            <SlidersHorizontal size={18} />
          </button>

          {/* Maximize Button */}
          <button
            type="button"
            className="freight-util-btn"
            title={isMaximized ? "Restore Normal View" : "Maximize Orders Panel"}
            style={{ width: 28, height: 28, borderRadius: 6, color: isDarkMode ? "#a1a1aa" : "#000000" }}
            onClick={() => {
              setIsMaximized(!isMaximized);
              onShowToast?.(isMaximized ? "Restored normal view" : "Maximized orders panel");
            }}
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        {/* Calendar Picker Popup - Telemetry Yellow Style */}
        {showCalendarMenu && (
          <div
            className="cockpit-dropdown-menu"
            style={{
              top: 36,
              right: 70,
              left: "auto",
              minWidth: 210,
              background: isDarkMode ? "#1c1c1c" : "rgba(254, 252, 191, 0.96)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: isDarkMode ? "1px solid #333333" : "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: "8px",
              padding: "7px",
              zIndex: 9999,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12), 0 3px 8px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ fontSize: "10.5px", fontWeight: 800, padding: "3px 6px 5px", color: isDarkMode ? "#d4d4d4" : "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Select Schedule Date
            </div>
            {["Thursday, Dec 19, 2025", "Friday, Dec 20, 2025", "Saturday, Dec 21, 2025"].map((d) => {
              const isActive = selectedDate === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setShowCalendarMenu(false);
                    onShowToast?.(`Loaded schedule for: ${d}`);
                  }}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: isActive ? (isDarkMode ? "#0d0d0d" : "#ffffff") : "transparent",
                    border: isActive
                      ? isDarkMode
                        ? "1px solid #faff02"
                        : "1px solid rgba(0, 0, 0, 0.1)"
                      : "1px solid transparent",
                    color: isDarkMode ? "#ffffff" : "#0f172a",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "11.5px",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    boxShadow: isActive ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                  }}
                >
                  <span>{d}</span>
                  {isActive && <Check size={13} style={{ color: isDarkMode ? "#faff02" : "#0f172a", strokeWidth: 3 }} />}
                </button>
              );
            })}
          </div>
        )}

        {/* Filter Popup Menu - Telemetry Yellow Style */}
        {showFilterMenu && (
          <div
            className="cockpit-dropdown-menu"
            style={{
              top: 36,
              right: 36,
              left: "auto",
              minWidth: 175,
              background: isDarkMode ? "#1c1c1c" : "rgba(254, 252, 191, 0.96)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: isDarkMode ? "1px solid #333333" : "1px solid rgba(0, 0, 0, 0.12)",
              borderRadius: "8px",
              padding: "7px",
              zIndex: 9999,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12), 0 3px 8px rgba(0, 0, 0, 0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ fontSize: "10.5px", fontWeight: 800, padding: "3px 6px 5px", color: isDarkMode ? "#d4d4d4" : "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Filter by Status
            </div>
            {(["All", "In Progress", "Awaiting", "Completed"] as const).map((st) => {
              const isActive = statusFilter === st;
              const count = st === "All" ? orders.length : orders.filter((o) => o.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setShowFilterMenu(false);
                    onShowToast?.(`Filtered orders by: ${st}`);
                  }}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    background: isActive ? (isDarkMode ? "#0d0d0d" : "#ffffff") : "transparent",
                    border: isActive
                      ? isDarkMode
                        ? "1px solid #faff02"
                        : "1px solid rgba(0, 0, 0, 0.1)"
                      : "1px solid transparent",
                    color: isDarkMode ? "#ffffff" : "#0f172a",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "11.5px",
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                    boxShadow: isActive ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: isDarkMode
                          ? st === "In Progress"
                            ? "#faff02"
                            : st === "Completed"
                            ? "#ffffff"
                            : "#737373"
                          : st === "Completed"
                          ? "#16a34a"
                          : st === "In Progress"
                          ? "#2563eb"
                          : st === "Awaiting"
                          ? "#eab308"
                          : "#64748b",
                      }}
                    />
                    <span>{st}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: "10px", color: isDarkMode ? "#8f8f8f" : "#64748b", fontWeight: 600 }}>({count})</span>
                    {isActive && <Check size={13} style={{ color: isDarkMode ? "#faff02" : "#0f172a", strokeWidth: 3 }} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Subheader KPI Summary */}
      <div
        className="freight-kpi-bar"
        style={{
          borderBottom: isDarkMode ? "1px solid #262626" : "1px solid var(--border-light)",
          paddingBottom: "10px",
          marginBottom: "10px",
          fontSize: "13px",
        }}
      >
        <div
          className="kpi-checkbox-group"
          onClick={handleToggleSelectAll}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: isDarkMode ? "#e5e5e5" : "#000000",
          }}
          title="Click to toggle Select All"
        >
          {isAllSelected ? (
            <CheckSquare size={17} className="kpi-checkbox" style={{ color: isDarkMode ? "#faff02" : "#000000" }} />
          ) : (
            <Square size={17} className="kpi-checkbox" style={{ color: isDarkMode ? "#737373" : "#000000" }} />
          )}
          <span className="kpi-count" style={{ fontSize: "13.5px", fontWeight: 600, color: isDarkMode ? "#e5e5e5" : "#000000" }}>
            {filteredOrders.length} Orders ({statusFilter})
          </span>
        </div>
        <div className="kpi-metrics-group" style={{ fontSize: "13px", fontWeight: 600, color: isDarkMode ? "#d4d4d4" : "#000000" }}>
          <span
            className="kpi-item"
            style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600, color: isDarkMode ? "#d4d4d4" : "#000000" }}
            onClick={() => onShowToast?.("Total active payload")}
            title="Total Active Payload"
          >
            Σ {filteredOrders.reduce((sum, o) => sum + o.payload, 0).toLocaleString()} lb
          </span>
        </div>
      </div>

      {/* Orders List View - Flexibly fills the container and extends full-bleed width */}
      <div
        className="freight-orders-scroll is-list-view"
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          gap: 0,
          padding: 0,
          margin: "0 -16px -12px -16px",
        }}
      >
        {filteredOrders.map((order, idx) => {
          const isSelected = order.orderCode === selectedOrder;
          const progressPct = order.progressPct ?? 52;
          const isLastItem = idx === filteredOrders.length - 1;

          return (
            <div
              key={order.id}
              className={`freight-order-item ${isSelected ? "active" : ""} direct-row-view`}
              onClick={() => handleOrderClick(order.orderCode)}
              style={{
                flex: 1,
                minHeight: 0,
                cursor: "pointer",
                borderRadius: "0px",
                padding: "10px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                background: isSelected
                  ? isDarkMode
                    ? "rgba(250, 255, 2, 0.09)"
                    : "rgba(250, 255, 2, 0.06)"
                  : isDarkMode
                  ? "#212121"
                  : "transparent",
                border: "none",
                borderLeft: isSelected
                  ? "3.5px solid #faff02"
                  : isDarkMode
                  ? "3.5px solid #ffffff"
                  : "3.5px solid #000000",
                borderBottom: isLastItem
                  ? "none"
                  : isDarkMode
                  ? "1px solid #2e2e2e"
                  : "1px solid #f1f5f9",
                boxShadow: "none",
                transition: "all 0.15s ease",
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
              title={`Click to switch to ${order.truckLabel} (#${order.orderCode})`}
            >
              {/* Top Row: Checkbox, Order Code & Status Tag */}
              <div
                className="item-top-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <div
                  className="item-code-group"
                  style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: isSelected
                        ? "1.5px solid #faff02"
                        : isDarkMode
                        ? "1.5px solid #666666"
                        : "1.5px solid #000000",
                      background: isSelected ? "#faff02" : (isDarkMode ? "rgba(255, 255, 255, 0.04)" : "transparent"),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <Check size={13} color="#000000" strokeWidth={3} />}
                  </div>
                  <span
                    style={{
                      fontSize: "16.5px",
                      fontWeight: 800,
                      color: isSelected
                        ? (isDarkMode ? "#ffffff" : "#0f172a")
                        : (isDarkMode ? "#e0e0e0" : "#334155"),
                      letterSpacing: "-0.2px",
                      fontFamily: "var(--font-sans, system-ui, sans-serif)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.orderCode}
                  </span>
                </div>

                <div
                  className="item-status-badge"
                  title={`Status: ${order.status}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDarkMode ? "#ffffff" : "#000000",
                    padding: "2px",
                    flexShrink: 0,
                  }}
                >
                  {order.status === "Completed" ? (
                    <CheckCircle2 size={22} strokeWidth={2.4} color={isDarkMode ? (isSelected ? "#ffffff" : "#9e9e9e") : "#000000"} />
                  ) : order.status === "Awaiting" ? (
                    <Clock size={22} strokeWidth={2.4} color={isDarkMode ? (isSelected ? "#ffffff" : "#9e9e9e") : "#000000"} />
                  ) : (
                    <Activity size={22} strokeWidth={2.4} color={isDarkMode ? (isSelected ? "#faff02" : "#9e9e9e") : "#000000"} />
                  )}
                </div>
              </div>

              {/* Bottom Section: Truck Thumb (Left) + Destination Route Timeline (Right) */}
              <div
                className="item-content-row"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  width: "100%",
                  minWidth: 0,
                }}
              >
                {/* Left: Mini Truck Column with Payload Bar & Weight */}
                <div
                  className="order-truck-thumb"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    width: 52,
                    flexShrink: 0,
                  }}
                >
                  <Truck size={24} color={isDarkMode ? (isSelected ? "#faff02" : "#9e9e9e") : "#000000"} strokeWidth={1.8} />
                  <div
                    className="truck-payload-bar"
                    style={{
                      width: 40,
                      height: 4,
                      background: isDarkMode ? "#383838" : "#e2e8f0",
                      borderRadius: 2,
                      overflow: "hidden",
                      marginTop: 4,
                      marginBottom: 4,
                      border: isDarkMode ? "0.5px solid rgba(255, 255, 255, 0.08)" : "0.5px solid rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <div
                      className="payload-fill"
                      style={{
                        width: `${Math.min(100, (order.payload / 12000) * 100)}%`,
                        height: "100%",
                        background: isSelected ? "#faff02" : (isDarkMode ? "#757575" : "#0f172a"),
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: isSelected ? (isDarkMode ? "#ffffff" : "#1e293b") : (isDarkMode ? "#a3a3a3" : "#64748b"),
                      whiteSpace: "nowrap",
                    }}
                  >
                    {order.payload.toLocaleString()} lb
                  </span>
                </div>

                {/* Right: Route Information Column (Image 2 style with signature #faff02 yellow line) */}
                <div
                  className="order-route-column"
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {/* Row 1: Addresses */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 6,
                      marginBottom: "6px",
                      width: "100%",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14.5px",
                        fontWeight: 600,
                        color: isSelected ? (isDarkMode ? "#ffffff" : "#1e293b") : (isDarkMode ? "#e0e0e0" : "#475569"),
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {order.originAddress}
                    </span>
                    <span
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 500,
                        color: isDarkMode ? (isSelected ? "#d4d4d4" : "#8e8e8e") : "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flexShrink: 0,
                        maxWidth: "48%",
                        textAlign: "right",
                      }}
                    >
                      {order.destAddress}
                    </span>
                  </div>

                  {/* Row 2: Continuous Timeline Track Bar with #faff02 Line & Milestone Dot */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 5,
                      background: isDarkMode ? "#383838" : "#e2e8f0",
                      borderRadius: 2.5,
                      margin: "8px 0 6px 0",
                      border: isDarkMode ? "0.5px solid rgba(255, 255, 255, 0.08)" : "0.5px solid rgba(0, 0, 0, 0.08)",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Signature #faff02 yellow progress track up to milestone */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${progressPct}%`,
                        background: isSelected ? "#faff02" : (isDarkMode ? "#757575" : "#94a3b8"),
                        borderRadius: 2.5,
                        boxShadow: isSelected && !isDarkMode ? "0 0 6px rgba(250, 255, 2, 0.8)" : "none",
                      }}
                    />
                    {/* Milestone Dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${progressPct}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 13,
                        height: 13,
                        borderRadius: "50%",
                        background: isSelected ? "#faff02" : (isDarkMode ? "#9e9e9e" : "#475569"),
                        border: isDarkMode ? "2px solid #1a1a1a" : "2px solid #0f172a",
                        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.25)",
                        zIndex: 2,
                      }}
                    />
                  </div>

                  {/* Row 3: Timestamps */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 18,
                      marginTop: 3,
                      minWidth: 0,
                    }}
                  >
                    {/* Depart Time on Left */}
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isSelected ? (isDarkMode ? "#ffffff" : "#0f172a") : (isDarkMode ? "#8e8e8e" : "#64748b"),
                        lineHeight: 1,
                      }}
                    >
                      {order.departTime}
                    </span>

                    {/* Current Checkpoint Time */}
                    <span
                      style={{
                        position: "absolute",
                        left: `${Math.max(16, Math.min(84, progressPct))}%`,
                        transform: "translateX(-50%)",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: isSelected ? (isDarkMode ? "#ffffff" : "#0f172a") : (isDarkMode ? "#e0e0e0" : "#475569"),
                        lineHeight: 1,
                      }}
                    >
                      {order.currentTime || order.departTime}
                    </span>

                    {/* Arrival Time on Right */}
                    <span
                      style={{
                        position: "absolute",
                        right: 0,
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isSelected ? (isDarkMode ? "#ffffff" : "#0f172a") : (isDarkMode ? "#8e8e8e" : "#64748b"),
                        lineHeight: 1,
                      }}
                    >
                      {order.arrivalTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
