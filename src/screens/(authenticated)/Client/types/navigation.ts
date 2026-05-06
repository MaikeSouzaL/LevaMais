/**
 * Navigation Types (Client)
 * Fonte de verdade para as rotas do fluxo cliente (drawer + stack).
 */

export type ClientStackParamList = {
  Home:
    | {
        reopenOffers?: boolean;
        vehicleType?: string;
        startSearch?: boolean;
        searchData?: {
          title?: string;
          price?: string;
          eta?: string;
          rideId?: string;
        };
        searchRoute?: {
          pickup?: {
            address?: string;
            formattedAddress?: string;
            latitude: number;
            longitude: number;
          };
          dropoff?: {
            address?: string;
            formattedAddress?: string;
            latitude: number;
            longitude: number;
          };
          vehicleType?: string;
          purposeId?: string;
        };
        openOffersFor?: string;
        purposeId?: string;
        pickup?: {
          address?: string;
          formattedAddress?: string;
          latitude: number;
          longitude: number;
        };
        dropoff?: {
          address?: string;
          formattedAddress?: string;
          latitude: number;
          longitude: number;
        };
        home_dropoff?: {
          address: string;
          latitude: number;
          longitude: number;
        };
        currentLocation?: {
          address: string;
          latitude: number;
          longitude: number;
        };
        favorite_creation?: boolean;
        initialVehicle?: string;
        initialService?: string;
        resumeDriverFound?: boolean;
      }
    | undefined;
  LocationPicker:
    | {
        selectionMode?: string;
        returnScreen?: string;
        initialLocation?: {
          formattedAddress?: string;
          latitude: number;
          longitude: number;
        };
        initialVehicle?: string;
        initialService?: string;
      }
    | undefined;
  EditFavorite:
    | {
        favoriteId?: string;
        favoriteData?: any;
        returnScreen?: string;
      }
    | undefined;
  Favorites: undefined;
  SelectVehicle:
    | {
        pickup?: { address: string; latitude: number; longitude: number };
        dropoff?: { address: string; latitude: number; longitude: number };
      }
    | undefined;
  ServicePurpose:
    | {
        vehicleType?: string;
        pickup?: { address: string; latitude: number; longitude: number };
        dropoff?: { address: string; latitude: number; longitude: number };
        initialPurposeId?: string;
      }
    | undefined;
  FinalOrderSummary: { data: any };
  Payment: { amount: number; order?: any };
  RideTracking: { rideId: string };
  Chat: { rideId: string; driverName?: string };
  RideCompleted: {
    rideId: string;
    total?: number;
    pickupAddress?: string;
    dropoffAddress?: string;
    driverName?: string;
  };
  ClientRateDriver: { rideId: string; driverName?: string };
  ClientCancelRide: { rideId: string; total?: number };
  CancelFee: { rideId: string; fee: number };
  History: undefined;
  OrderDetails: { rideId?: string; order?: any };
  Profile: undefined;
  Settings: undefined;
  Wallet: undefined;
  Help: undefined;
  ClientCity: undefined;
  ConfirmPickup: {
    formattedAddress?: string;
    address?: string;
    latitude: number;
    longitude: number;
    returnScreen?: string;
  };
  AddPaymentMethod: undefined;
  SafetyCenter: undefined;
  TipDriver: { rideId: string; driverName?: string };
  NotificationsCenter: undefined;
  SearchingDriver: { rideId: string };
  ActiveOrders: undefined;
  RideOffersMarketplace: { rideId: string };
  PaymentsCenter: undefined;
  Coupons: undefined;
  Receipts: undefined;
  PrivacyData: undefined;
  InviteFriends: undefined;
  SupportCenter: undefined;
};

export type HomeScreenNavigationProp = any;
export type AddressPickerScreenNavigationProp = any;
export type SelectVehicleScreenNavigationProp = any;
export type RideTrackingScreenNavigationProp = any;
