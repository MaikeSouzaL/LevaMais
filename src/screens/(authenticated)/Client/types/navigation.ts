/**
 * Navigation Types (Client)
 * Fonte de verdade para as rotas do fluxo cliente (drawer + stack).
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type DeliveryAddressProfile = {
  address: string;
  addressCoords: { latitude: number; longitude: number } | null;
  details?: string;
  contactName: string;
  contactPhone: string;
};

export type DeliveryVehicleType = "motorcycle" | "car" | "van" | "truck";

export type DeliveryFlowPayload = {
  flow: "send" | "receive";
  vehicleType: DeliveryVehicleType;
  pickupProfile: DeliveryAddressProfile;
  dropoffProfile: DeliveryAddressProfile;
  stops?: DeliveryAddressProfile[];
};

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
        initialVehicle?: string;
        initialService?: string;
        resumeDriverFound?: boolean;
        activeRideId?: string;
        confirmedSender?: DeliveryAddressProfile;
        deliveryDraftProfile?: {
          role: "pickup" | "dropoff";
          profile: DeliveryAddressProfile;
          vehicleType?: DeliveryVehicleType | string;
          flow?: "send" | "receive" | string;
        };
      }
    | undefined;
  LocationPicker:
    | {
        selectionMode?: string;
        returnScreen?: string;
        returnMode?: "sender" | "receiver";
        senderData?: {
          mode: string;
          address: string;
          addressCoords: { latitude: number; longitude: number } | null;
          addressDetails: string;
          contactName: string;
          contactPhone: string;
        };
        favoriteId?: string;
        favoriteData?: any;
        initialLocation?: {
          formattedAddress?: string;
          latitude: number;
          longitude: number;
        };
        initialVehicle?: string;
        initialService?: string;
        vehicleType?: DeliveryVehicleType | string;
        flow?: "send" | "receive" | string;
        pickupProfile?: DeliveryAddressProfile | null;
        dropoffProfile?: DeliveryAddressProfile | null;
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
  FavoriteAddressFlow:
    | {
        initialSearchMode?: "home" | "work" | "favorite" | "favoritesList";
        selectionMode?: boolean;
        returnScreen?: string;
        isSender?: boolean;
        returnMode?: "sender" | "receiver";
        vehicleType?: string;
        flow?: "send" | "receive" | string;
        pickupProfile?: DeliveryAddressProfile | null;
        dropoffProfile?: DeliveryAddressProfile | null;
        mapPickedAddress?: string;
        mapPickedLatitude?: number;
        mapPickedLongitude?: number;
        mapPickedName?: string;
        mapPickedPhone?: string;
        mapPickedDetails?: string;
        isFromMapSelection?: boolean;
      }
    | undefined;
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
  DeliverySenderInfo:
    | {
        mode?: "sender" | "receiver";
        vehicleType?: DeliveryVehicleType | string;
        flow?: "send" | "receive" | string;
        pickupProfile?: DeliveryAddressProfile | null;
        dropoffProfile?: DeliveryAddressProfile | null;
        stops?: DeliveryAddressProfile[];
        isAddingStop?: boolean;
        senderData?: {
          mode: string;
          address: string;
          addressCoords: { latitude: number; longitude: number } | null;
          addressDetails: string;
          contactName: string;
          contactPhone: string;
        };
        mapPickedAddress?: string;
        mapPickedLatitude?: number;
        mapPickedLongitude?: number;
        mapPickedName?: string;
        mapPickedPhone?: string;
        mapPickedDetails?: string;
      }
    | undefined;
  DeliveryDetails: DeliveryFlowPayload;
  DeliveryMapPicker:
    | {
        initialLatitude?: number;
        initialLongitude?: number;
        returnField?: string;
        returnScreen?: "DeliverySenderInfo" | "FavoriteAddressFlow";
        favoriteInitialSearchMode?: "home" | "work" | "favorite";
        selectionMode?: boolean;
        returnMode?: "sender" | "receiver";
        vehicleType?: DeliveryVehicleType | string;
        flow?: "send" | "receive" | string;
        pickupProfile?: DeliveryAddressProfile | null;
        dropoffProfile?: DeliveryAddressProfile | null;
      }
    | undefined;
  EditDeliveryAddress:
    | {
        addressId?: string;
        addressData?: any;
        mapPickedAddress?: string;
        mapPickedLatitude?: number;
        mapPickedLongitude?: number;
      }
    | undefined;
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
  DeliveryTracking: { rideId: string };
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
  TipDriver: { rideId: string; driverName?: string; serviceType?: string };
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
  RideBidSetup:
    | {
        pickup?: { address: string; latitude: number; longitude: number };
        dropoff?: { address: string; latitude: number; longitude: number };
        routeCoordinates?: Array<{ latitude: number; longitude: number }>;
        vehicleType?: string;
        initialDistanceKm?: number;
        initialDurationMin?: number;
        preferScheduled?: boolean;
      }
    | undefined;
  RideBiddingScreen:
    | {
        pickup: { address: string; latitude: number; longitude: number };
        dropoff: { address: string; latitude: number; longitude: number };
        routeCoordinates?: Array<{ latitude: number; longitude: number }>;
        vehicleType: string;
        clientOffer: number;
        estimate: {
          suggestedPrice: number;
          minPrice: number;
          maxPrice: number;
          distanceKm: number;
          durationMin: number;
          pricingBreakdown: {
            baseFare: number;
            distancePrice: number;
            total: number;
          };
        };
      }
    | undefined;
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<ClientStackParamList, 'Home'>;
export type AddressPickerScreenNavigationProp = NativeStackNavigationProp<ClientStackParamList, 'LocationPicker'>;
export type SelectVehicleScreenNavigationProp = NativeStackNavigationProp<ClientStackParamList, 'SelectVehicle'>;
export type RideTrackingScreenNavigationProp = NativeStackNavigationProp<ClientStackParamList, 'RideTracking'>;
