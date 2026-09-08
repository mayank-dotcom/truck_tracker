export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliveryStop {
  id: string;
  label: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  estimatedArrival: string;
  status: "completed" | "current" | "upcoming";
}

export interface TruckStatus {
  currentLocation: Coordinates;
  currentLocationName: string;
  distanceCovered: number;
  totalDistance: number;
  nextStop: string;
  completedStops: string[];
  speed: number;
  eta: string;
  heading: number;
}

export interface RouteSegment {
  from: Coordinates;
  to: Coordinates;
  points: Coordinates[];
}

export interface RouteData {
  truckId: string;
  driverName: string;
  origin: DeliveryStop;
  deliveryStops: DeliveryStop[];
  routeSegments: RouteSegment[];
  totalDistance: number;
}
