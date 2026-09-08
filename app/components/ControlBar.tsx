"use client";

import { Play, Pause, RotateCcw, Square } from "lucide-react";

interface ControlBarProps {
  isTracking: boolean;
  isPaused: boolean;
  isComplete: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

export default function ControlBar({
  isTracking,
  isPaused,
  isComplete,
  onStart,
  onPause,
  onResume,
  onReset,
}: ControlBarProps) {
  return (
    <div className="control-bar" id="control-bar">
      {!isTracking && !isComplete && (
        <button
          className="control-btn primary"
          onClick={onStart}
          id="btn-start"
        >
          <Play size={16} />
          START TRACKING
        </button>
      )}
      {isTracking && !isPaused && (
        <button
          className="control-btn warning"
          onClick={onPause}
          id="btn-pause"
        >
          <Pause size={16} />
          PAUSE
        </button>
      )}
      {isTracking && isPaused && (
        <button
          className="control-btn primary"
          onClick={onResume}
          id="btn-resume"
        >
          <Play size={16} />
          RESUME
        </button>
      )}
      {isComplete && (
        <button
          className="control-btn primary"
          onClick={onStart}
          id="btn-restart"
        >
          <Play size={16} />
          REPLAY ROUTE
        </button>
      )}
      {(isTracking || isComplete) && (
        <button
          className="control-btn danger"
          onClick={onReset}
          id="btn-reset"
        >
          <RotateCcw size={16} />
          RESET
        </button>
      )}
    </div>
  );
}
