"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  RotateCcw,
  SlidersHorizontal,
  List,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Check,
  MoreVertical,
  Truck,
  Box,
  Scale,
  ShieldCheck,
  AlertCircle,
  X,
  Layers,
} from "lucide-react";

import dynamic from "next/dynamic";

// Dynamic import of 3D viewer to ensure purely client-side WebGL rendering
const Truck3DViewer = dynamic(() => import("./Truck3DViewer"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 280,
        background: "#0d0d0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        fontSize: "12px",
      }}
    >
      Initializing 3D WebGL Engine...
    </div>
  ),
});

interface PalletOrder {
  id: string;
  orderNumber: string;
  address: string;
  pallets: number;
  weight: number;
  isSelected?: boolean;
  status: "checked" | "pending";
}

const INITIAL_ORDERS: PalletOrder[] = [
  {
    id: "ord-1",
    orderNumber: "237325623",
    address: "2464 Royal Ln. Mesa",
    pallets: 3,
    weight: 1040,
    status: "checked",
    isSelected: false,
  },
  {
    id: "ord-2",
    orderNumber: "837726633",
    address: "3517 W.映像 St. Utica",
    pallets: 1,
    weight: 1340,
    status: "checked",
    isSelected: true,
  },
  {
    id: "ord-3",
    orderNumber: "876354523",
    address: "6591 Elgin St. Celina",
    pallets: 6,
    weight: 3127,
    status: "pending",
    isSelected: false,
  },
  {
    id: "ord-4",
    orderNumber: "912384910",
    address: "1901 Thornridge Cir. Shiloh",
    pallets: 3,
    weight: 1231,
    status: "pending",
    isSelected: false,
  },
];

export default function TruckLoadingPanel({
  selectedOrder = "UTD38723",
  onSelectOrder,
  isOptimizerActive = true,
  onShowToast,
  isDarkMode = false,
}: {
  selectedOrder?: string;
  onSelectOrder?: (code: string) => void;
  isOptimizerActive?: boolean;
  onShowToast?: (msg: string) => void;
  isDarkMode?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"Planning" | "Distribution" | "Statistics">(
    "Planning"
  );
  const [orders, setOrders] = useState<PalletOrder[]>(INITIAL_ORDERS);
  
  // Model selection state synchronized with selectedOrder
  const [localModelId, setLocalModelId] = useState<"truck1" | "truck2">(
    selectedOrder === "UTD73525" ? "truck2" : "truck1"
  );

  useEffect(() => {
    if (selectedOrder === "UTD73525") {
      setLocalModelId("truck2");
    } else if (selectedOrder === "UTD38723") {
      setLocalModelId("truck1");
    }
  }, [selectedOrder]);

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showFilterMenu, setShowFilterMenu] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "checked" | "pending">("all");

  // Toggle order checkbox and selection
  const toggleOrderCheck = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const nextStatus = o.status === "checked" ? "pending" : "checked";
          onShowToast?.(
            nextStatus === "checked"
              ? `Pallet #${o.orderNumber} marked Loaded (✓)`
              : `Pallet #${o.orderNumber} marked Pending (☐)`
          );
          return {
            ...o,
            status: nextStatus,
            isSelected: !o.isSelected,
          };
        }
        return o;
      })
    );
  };

  // Calculate dynamic weight from checked orders
  const currentCheckedWeight = orders
    .filter((o) => o.status === "checked")
    .reduce((sum, o) => sum + o.weight, 5260); // base tare + cargo

  return (
    <div
      className="truck-loading-panel"
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        width: "100%",
        height: "100%",
        background: isDarkMode ? "#0d0d0d" : "#ffffff",
        overflow: "hidden",
        borderRadius: "0px",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          background: isDarkMode ? "#0d0d0d" : "#ffffff",
          borderRadius: "0px",
        }}
      >
        <Truck3DViewer
          selectedModelId={localModelId}
          isDarkMode={isDarkMode}
          onShowToast={onShowToast}
        />
      </div>
    </div>
  );
}
