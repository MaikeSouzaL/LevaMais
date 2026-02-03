/**
 * Navigation Types
 * Define todos os tipos de navegação do módulo Client
 */

export type ClientStackParamList = {
  // Home
  Home: undefined;

  // Address
  AddressPicker: {
    type: 'pickup' | 'destination';
  };
  Favorites: undefined;
  AddFavorite: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  // Ride Request
  SelectVehicle: undefined;
  ServicePurpose: undefined;
  PaymentMethod: {
    amount: number;
    order?: any; // FinalOrderSummaryData
  };
  OrderSummary: undefined;

  // Ride Search
  SearchingDriver: undefined;
  SearchTimeout: undefined;

  // Ride Tracking
  RideTracking: {
    rideId: string;
  };
  Chat: {
    rideId: string;
    driverName: string;
  };

  // Ride Completion
  RideCompleted: {
    rideId: string;
  };
  RateDriver: {
    rideId: string;
  };

  // Ride Cancellation
  CancelRide: {
    rideId: string;
    total?: number;
  };
  CancelFee: {
    rideId: string;
    fee: number;
  };

  // History
  History: undefined;
  OrderDetails: {
    rideId: string;
  };

  // Profile
  Profile: undefined;
  Settings: undefined;
  CitySelection: undefined;
  Wallet: undefined;
  Help: undefined;
};

/**
 * Tipos de navegação para cada tela
 */
export type HomeScreenNavigationProp = any; // NavigationProp<ClientStackParamList, 'Home'>;
export type AddressPickerScreenNavigationProp = any;
export type SelectVehicleScreenNavigationProp = any;
export type RideTrackingScreenNavigationProp = any;
// ... adicionar outros conforme necessário
