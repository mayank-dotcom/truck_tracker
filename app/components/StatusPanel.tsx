"use client";

import { useState, useEffect } from "react";
import { TruckStatus, DeliveryStop } from "../types/tracking";
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  Gauge,
  CheckCircle2,
  Circle,
  Target,
  Compass,
} from "lucide-react";

interface StatusPanelProps {
  truckStatus: TruckStatus;
  stops: DeliveryStop[];
  progress: number;
  isTracking: boolean;
  isPaused: boolean;
  isComplete: boolean;
}

export default function StatusPanel({
  truckStatus,
  stops,
  progress,
  isTracking,
  isPaused,
  isComplete,
}: StatusPanelProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTimeStr(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel = isComplete
    ? "DELIVERED"
    : isTracking && !isPaused
      ? "ACTIVE"
      : isPaused
        ? "PAUSED"
        : "STANDBY";

  const statusColor = isComplete
    ? "#4ade80"
    : isTracking && !isPaused
      ? "#c8a846"
      : isPaused
        ? "#f97316"
        : "#888";

  return (
    <div className="status-panel" id="status-panel">
      {/* Truck Identity */}
      <div className="panel-section" id="truck-identity">
        <div className="truck-header">
          <div className="truck-icon-box">
            <Truck size={20} strokeWidth={1.5} />
          </div>
          <div>
            <div className="truck-id">{truckStatus.currentLocationName === "Route Complete" ? "FF-TRK-4200" : "FF-TRK-4200"}</div>
            <div className="truck-driver">Driver: Rajesh Kumar</div>
          </div>
        </div>
        <div className="status-badge" style={{ borderColor: statusColor }}>
          <span
            className="status-dot"
            style={{ backgroundColor: statusColor }}
          />
          <span style={{ color: statusColor }}>{statusLabel}</span>
        </div>
      </div>

      {/* Live Stats */}
      <div className="panel-section" id="live-stats">
        <div className="section-title">
          <Compass size={12} />
          LIVE TELEMETRY
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">
              <MapPin size={11} /> Location
            </div>
            <div className="stat-value">{truckStatus.currentLocationName}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">
              <Navigation size={11} /> Distance
            </div>
            <div className="stat-value">
              {truckStatus.distanceCovered} <span className="stat-unit">/ {truckStatus.totalDistance} km</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">
              <Gauge size={11} /> Speed
            </div>
            <div className="stat-value">
              {truckStatus.speed} <span className="stat-unit">km/h</span>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">
              <Clock size={11} /> ETA
            </div>
            <div className="stat-value">{truckStatus.eta}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="panel-section" id="route-progress">
        <div className="section-title">
          <Target size={12} />
          ROUTE PROGRESS
        </div>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">{progress.toFixed(0)}%</div>
        </div>
        <div className="progress-detail">
          NEXT STOP: {truckStatus.nextStop}
        </div>
      </div>

      {/* Delivery Stops */}
      <div className="panel-section" id="delivery-stops">
        <div className="section-title">
          <MapPin size={12} />
          DELIVERY MANIFEST
        </div>
        <div className="stops-list">
          {stops.map((stop, idx) => (
            <div
              key={stop.id}
              className={`stop-item ${stop.status}`}
              id={`stop-${stop.id}`}
            >
              <div className="stop-line">
                {idx < stops.length - 1 && (
                  <div
                    className={`stop-connector ${
                      stop.status === "completed" ? "completed" : ""
                    }`}
                  />
                )}
                <div className="stop-dot">
                  {stop.status === "completed" ? (
                    <CheckCircle2 size={16} className="stop-icon completed" />
                  ) : stop.status === "current" ? (
                    <Target size={16} className="stop-icon current" />
                  ) : (
                    <Circle size={16} className="stop-icon upcoming" />
                  )}
                </div>
              </div>
              <div className="stop-info">
                <div className="stop-label-row">
                  <span className="stop-label">{stop.label}</span>
                  <span className="stop-name">{stop.name}</span>
                </div>
                <div className="stop-address">{stop.address}</div>
                <div className="stop-eta">
                  {stop.status === "completed"
                    ? "✓ Delivered"
                    : `ETA: ${stop.estimatedArrival}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signal Info */}
      <div className="panel-section signal-section" id="signal-info">
        <div className="signal-row">
          <span className="signal-label">Signal</span>
          <span className="signal-value">
            <span className="signal-indicator strong" />
            STRONG
          </span>
        </div>
        <div className="signal-row">
          <span className="signal-label">GPS Accuracy</span>
          <span className="signal-value">±3m</span>
        </div>
        <div className="signal-row">
          <span className="signal-label">Last Update</span>
          <span className="signal-value" suppressHydrationWarning>
            {timeStr || "LIVE"}
          </span>
        </div>
      </div>
    </div>
  );
}
