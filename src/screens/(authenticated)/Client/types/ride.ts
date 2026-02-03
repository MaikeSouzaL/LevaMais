/**
 * Ride Types
 * Define todos os tipos relacionados a corridas
 */

/**
 * Status da corrida
 */
export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/**
 * Tipo de veículo
 */
export type VehicleType = 'motorcycle' | 'car' | 'van' | 'truck';

/**
 * Modo de serviço
 */
export type ServiceMode = 'transport' | 'delivery' | 'moving' | 'other' | 'ride';

/**
 * Método de pagamento
 */
export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit' | 'wallet';

/**
 * Coordenadas geográficas
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Endereço
 */
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

/**
 * Veículo
 */
export interface Vehicle {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  color: string;
  plate: string;
  year?: number;
}

/**
 * Motorista
 */
export interface Driver {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  rating: number;
  totalRides: number;
  vehicle: Vehicle;
}

/**
 * Oferta de corrida
 */
export interface RideOffer {
  id: string;
  vehicleType: VehicleType;
  price: number;
  estimatedDuration: number; // em segundos
  estimatedDistance: number; // em metros
  available: boolean;
}

/**
 * Corrida
 */
export interface Ride {
  id: string;
  status: RideStatus;
  vehicleType: VehicleType;
  serviceMode: ServiceMode;
  paymentMethod: PaymentMethod;
  pickup: Address;
  destination: Address;
  driver?: Driver;
  price: number;
  distance: number; // em metros
  duration: number; // em segundos
  estimatedArrival?: string; // ISO date
  startedAt?: string; // ISO date
  completedAt?: string; // ISO date
  cancelledAt?: string; // ISO date
  cancellationReason?: string;
  cancellationFee?: number;
  rating?: number;
  ratingComment?: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

/**
 * Rascunho de corrida (usado durante o fluxo de solicitação)
 */
export interface RideDraft {
  pickup?: Address;
  destination?: Address;
  vehicleType?: VehicleType;
  serviceMode?: ServiceMode;
  paymentMethod?: PaymentMethod;
  selectedOffer?: RideOffer;
}

/**
 * Histórico de corrida (versão resumida)
 */
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

/**
 * Estatísticas de corridas
 */
export interface RideStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalSpent: number;
  averageRating: number;
}

/**
 * Motivo de cancelamento
 */
export interface CancellationReason {
  id: string;
  label: string;
}

/**
 * Avaliação
 */
export interface Rating {
  stars: number; // 1-5
  comment?: string;
}
