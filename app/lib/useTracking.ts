"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { TruckStatus, Coordinates, DeliveryStop } from "../types/tracking";
import {
  routeData,
  getFullRoutePath,
  getCumulativeDistances,
  calculateBearing,
  haversineDistance,
} from "../lib/routeData";

const ANIMATION_INTERVAL = 80; // ms between position updates
const SPEED_KMH = 40; // simulated speed in km/h

interface UseTrackingReturn {
  truckStatus: TruckStatus;
  stops: DeliveryStop[];
  currentPointIndex: number;
  fullPath: Coordinates[];
  isTracking: boolean;
  isPaused: boolean;
  isComplete: boolean;
  progress: number;
  startTracking: () => void;
  pauseTracking: () => void;
  resumeTracking: () => void;
  resetTracking: () => void;
}

export function useTracking(): UseTrackingReturn {
  const fullPath = useRef(getFullRoutePath());
  const cumulativeDistances = useRef(getCumulativeDistances(fullPath.current));
  const totalRouteDistance = useRef(
    cumulativeDistances.current[cumulativeDistances.current.length - 1]
  );

  // Determine segment boundaries (indices into fullPath where each segment ends)
  const segmentEndIndices = useRef<number[]>(
    (() => {
      let idx = 0;
      const ends: number[] = [];
      for (const seg of routeData.routeSegments) {
        idx += seg.points.length - (ends.length > 0 ? 1 : 0);
        ends.push(idx - 1);
      }
      return ends;
    })()
  );

  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completedStopIds, setCompletedStopIds] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine which stops are completed based on current point index
  const getCompletedStops = useCallback(
    (pointIdx: number): string[] => {
      const completed: string[] = [];
      const ends = segmentEndIndices.current;
      // Segment 0: origin -> D1, ends at ends[0]
      // Segment 1: D1 -> D2, ends at ends[1]
      // Segment 2: D2 -> D3, ends at ends[2]
      if (ends.length >= 1 && pointIdx >= ends[0]) completed.push("d1");
      if (ends.length >= 2 && pointIdx >= ends[1]) completed.push("d2");
      if (ends.length >= 3 && pointIdx >= ends[2]) completed.push("d3");
      return completed;
    },
    []
  );

  const getNextStop = useCallback(
    (pointIdx: number): string => {
      const ends = segmentEndIndices.current;
      if (ends.length >= 1 && pointIdx < ends[0]) return "D1 – Metro Distribution Hub";
      if (ends.length >= 2 && pointIdx < ends[1]) return "D2 – South Delhi Depot";
      if (ends.length >= 3 && pointIdx < ends[2]) return "D3 – Heritage Logistics Point";
      return "Route Complete";
    },
    []
  );

  const getCurrentLocationName = useCallback(
    (pointIdx: number): string => {
      const ends = segmentEndIndices.current;
      if (pointIdx === 0) return "FoxFreight Warehouse";
      if (ends.length >= 1 && pointIdx <= ends[0]) return "En route to D1";
      if (ends.length >= 1 && pointIdx === ends[0]) return "Metro Distribution Hub";
      if (ends.length >= 2 && pointIdx <= ends[1]) return "En route to D2";
      if (ends.length >= 2 && pointIdx === ends[1]) return "South Delhi Depot";
      if (ends.length >= 3 && pointIdx <= ends[2]) return "En route to D3";
      if (ends.length >= 3 && pointIdx === ends[2]) return "Heritage Logistics Point";
      return "Route Complete";
    },
    []
  );

  const calculateETA = useCallback(
    (pointIdx: number): string => {
      const remaining =
        totalRouteDistance.current - cumulativeDistances.current[pointIdx];
      if (remaining <= 0) return "Arrived";
      const hoursRemaining = remaining / SPEED_KMH;
      const mins = Math.round(hoursRemaining * 60);
      if (mins < 60) return `${mins} min`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    },
    []
  );

  const truckStatus: TruckStatus = {
    currentLocation: fullPath.current[currentPointIndex],
    currentLocationName: getCurrentLocationName(currentPointIndex),
    distanceCovered: parseFloat(
      cumulativeDistances.current[currentPointIndex].toFixed(1)
    ),
    totalDistance: parseFloat(totalRouteDistance.current.toFixed(1)),
    nextStop: getNextStop(currentPointIndex),
    completedStops: completedStopIds,
    speed: isTracking && !isPaused ? SPEED_KMH : 0,
    eta: calculateETA(currentPointIndex),
    heading:
      currentPointIndex < fullPath.current.length - 1
        ? calculateBearing(
            fullPath.current[currentPointIndex],
            fullPath.current[currentPointIndex + 1]
          )
        : 0,
  };

  // Build stops with dynamic status
  const stops: DeliveryStop[] = [
    {
      ...routeData.origin,
      status: "completed",
    },
    ...routeData.deliveryStops.map((stop) => ({
      ...stop,
      status: completedStopIds.includes(stop.id)
        ? ("completed" as const)
        : getNextStop(currentPointIndex).includes(stop.label)
          ? ("current" as const)
          : ("upcoming" as const),
    })),
  ];

  const progress =
    (currentPointIndex / (fullPath.current.length - 1)) * 100;

  const tick = useCallback(() => {
    setCurrentPointIndex((prev) => {
      const next = prev + 1;
      if (next >= fullPath.current.length) {
        // Route complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsTracking(false);
        setIsComplete(true);
        setCompletedStopIds(["d1", "d2", "d3"]);
        return fullPath.current.length - 1;
      }
      // Update completed stops
      const completed = getCompletedStops(next);
      setCompletedStopIds(completed);
      return next;
    });
  }, [getCompletedStops]);

  const startTracking = useCallback(() => {
    if (isComplete) {
      setCurrentPointIndex(0);
      setCompletedStopIds([]);
      setIsComplete(false);
    }
    setIsTracking(true);
    setIsPaused(false);
    intervalRef.current = setInterval(tick, ANIMATION_INTERVAL);
  }, [tick, isComplete]);

  const pauseTracking = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeTracking = useCallback(() => {
    setIsPaused(false);
    intervalRef.current = setInterval(tick, ANIMATION_INTERVAL);
  }, [tick]);

  const resetTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentPointIndex(0);
    setCompletedStopIds([]);
    setIsTracking(false);
    setIsPaused(false);
    setIsComplete(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    truckStatus,
    stops,
    currentPointIndex,
    fullPath: fullPath.current,
    isTracking,
    isPaused,
    isComplete,
    progress,
    startTracking,
    pauseTracking,
    resumeTracking,
    resetTracking,
  };
}
