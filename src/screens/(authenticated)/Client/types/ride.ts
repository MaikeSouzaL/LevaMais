/**
 * Tipos do modulo Client para corridas.
 */

export type RideStatus =
  | 'requesting'
  | 'payment_pending'
  | 'payment_failed'
  | 'driver_assigned'
  | 'accepted'
  | 'driver_arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'cancelled_by_client'
  | 'cancelled_by_driver'
  | 'cancelled_no_driver'
  | 'expired'
  | 'timeout'
  | 'pending'
  | 'arriving';

export type VehicleType = 'motorcycle' | 'car' | 'van' | 'truck';

export type ServiceMode =
  | 'ride'
  | 'delivery'
  | 'transport'
  | 'moving'
  | 'other'
  | 'frete';

export type PaymentMethod =
  | 'cash'
  | 'pix'
  | 'card'
  | 'credit'
  | 'credit_card'
  | 'debit'
  | 'debit_card'
  | 'wallet';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Address {
  formatted: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates: LatLng;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  plate: string;
  year?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  rating: number;
  totalRides: number;
  vehicle: Vehicle;
}

export interface RideOffer {
  id: string;
  vehicleType: VehicleType;
  price: number;
  estimatedDuration: number;
  estimatedDistance: number;
  available: boolean;
}

export interface Ride {
  searchTimeoutSeconds?: number;
  id: string;
  status: RideStatus;
  vehicleType: VehicleType;
  serviceMode: ServiceMode;
  paymentMethod: PaymentMethod;
  pickup: Address;
  destination: Address;
  driver?: Driver;
  price: number;
  distance: number;
  duration: number;
  estimatedArrival?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancellationFee?: number;
  rating?: number;
  ratingComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RideDraft {
  pickup?: Address;
  destination?: Address;
  vehicleType?: VehicleType;
  serviceMode?: ServiceMode;
  paymentMethod?: PaymentMethod;
  selectedOffer?: RideOffer;
}

export interface RideHistory {
  id: string;
  status: RideStatus;
  pickup: {
    formatted: string;
  };
  destination: {
    formatted: string;
  };
  price: number;
  paymentMethod: PaymentMethod;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface RideStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalSpent: number;
  averageRating: number;
}

export interface CancellationReason {
  id: string;
  label: string;
}

export interface Rating {
  stars: number;
  comment?: string;
}
