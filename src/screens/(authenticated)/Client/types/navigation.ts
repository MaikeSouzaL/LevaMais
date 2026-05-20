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
        rideId?: string;
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
        showSuccessQueueModal?: boolean;
        currentLocation?: {
          address: string;
          latitude: number;
          longitude: number;
        };
        favorite_creation?: boolean;
        initialVehicle?: string;
        initialService?: string;
        resumeDriverFound?: boolean;
        activeRideId?: string;
      }
    | undefined;
  LocationPicker:
    | {
        selectionMode?: string;
        returnScreen?: string;
        favoriteId?: string;
        favoriteData?: any;
        initialLocation?: {
          formattedAddress?: string;
          latitude: number;
          longitude: number;
        };
        initialVehicle?: string;
        initialService?: string;
      }
    | undefined;
  DestinationSearch:
    | {
        initialVehicle?: string;
        preferScheduled?: boolean;
        serviceType?: "ride" | "delivery";
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
  AddFavorite: undefined;
  SelectVehicle:
    | {
        pickup?: { address: string; latitude: number; longitude: number };
        dropoff?: { address: string; latitude: number; longitude: number };
      }
    | undefined;
  RideSetup:
    | {
        vehicleType?: "car" | "motorcycle" | "van" | "truck";
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
  DeliverySetup:
    | {
        vehicleType?: string;
        preferScheduled?: boolean;
        pickup?: { address: string; latitude: number; longitude: number };
        dropoff?: { address: string; latitude: number; longitude: number };
        initialDistanceKm?: number | null;
        initialDurationMin?: number | null;
      }
    | undefined;
  DeliveryReview:
    | {
        pickup: { address: string; latitude: number; longitude: number };
        dropoff: { address: string; latitude: number; longitude: number };
        cityId?: string;
        preferScheduled?: boolean;
        scheduledOffsetMin?: number;
        vehicleType?: string;
        deliveryType?: string;
        cargoSize?: "small" | "medium" | "large";
        needsHelper?: boolean;
        priority?: number;
        cargoDescription?: string;
        pickupComplement?: string;
        dropoffComplement?: string;
        recipientName?: string;
        recipientPhone?: string;
        recipientInstructions?: string;
        deliveryPin?: string;
        offerValue?: number;
        paymentMethod?: string;
        pricingSnapshot?: any;
      }
    | undefined;
  DeliveryPaymentConfirm:
    | {
        rideId: string;
      }
    | undefined;
  RideTracking: { rideId: string };
  Chat: { rideId: string; driverName?: string };
  RideCompleted: {
    rideId: string;
    total?: number;
    pickupAddress?: string;
    dropoffAddress?: string;
    driverName?: string;
    driverId?: string;
    driverRating?: { averageStars?: number; totalRatings?: number };
    existingRating?: { stars: number; comment?: string };
    serviceType?: string;
  };
  ClientRateDriver: { rideId: string; driverName?: string; serviceType?: string };
  ClientCancelRide: {
    rideId: string;
    total?: number;
    status?: string;
    estimatedFee?: number;
  };
  CancelFee: { rideId: string; fee: number; total?: number; serviceType?: string };
  History: undefined;
  OrderDetails: { rideId?: string; order?: any };
  Profile: undefined;
  Settings: undefined;
  EditAccount: undefined;
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
  SearchingDriver: { rideId: string; serviceType?: string };
  ActiveOrders: undefined;
  ShiftOffersClient: undefined;
  RideOffersMarketplace: { rideId: string; autoOpenIncrease?: boolean };
  PaymentsCenter: undefined;
  Coupons: undefined;
  Receipts: undefined;
  PrivacyData: undefined;
  InviteFriends: undefined;
  SupportCenter: undefined;
  OrderSent: { rideId?: string };
};

export type HomeScreenNavigationProp = any;
export type AddressPickerScreenNavigationProp = any;
export type SelectVehicleScreenNavigationProp = any;
export type RideTrackingScreenNavigationProp = any;
