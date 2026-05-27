/**
 * Navigation Types (Driver)
 * Fonte de verdade para as rotas do fluxo motorista (drawer + stack).
 */

export type DriverStackParamList = {
  // Telas principais
  DriverHome: undefined;
  DriverRide: { rideId: string };
  DriverRateClient: { rideId: string };
  DriverCancelRide: { rideId: string };

  // Telas de entrega
  DeliveryOfferScreen: { rideId: string };
  DeliveryOfferDetail: { rideId: string };
  DeliveryPickupConfirm: { rideId: string };
  DeliveryDropoffConfirm: { rideId: string };

  // Telas de negociação
  DriverNegotiation: { rideId: string };

  // Telas de histórico
  DriverHistoryRideDetails: { rideId: string };

  // Telas de chat
  DriverChat: { rideId: string; recipientName?: string };

  // Telas de finanças
  DriverEarnings: undefined;
  DriverWithdraw: undefined;
  DriverStatement: undefined;
  DriverPayouts: undefined;
  DriverIncentives: undefined;
  DriverRideDetails: { rideId: string };

  // Telas de perfil e configurações
  DriverProfile: undefined;
  DriverVehicle: undefined;
  DriverDocuments: undefined;
  DriverRatings: undefined;
  DriverHistory: undefined;
  DriverWorkPreferences: undefined;
  DriverSafety: undefined;
  DriverSupportCenter: undefined;
  DriverHelp: undefined;
  DriverSettings: undefined;
  DriverShiftOffers: undefined;
  DriverRequests: undefined;
};
