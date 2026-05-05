/**
 * Navigation helpers (Client)
 * Alinhado com as rotas reais da arquitetura Drawer + Stack cliente.
 */

export const ROUTES = {
  HOME: "Home",
  LOCATION_PICKER: "LocationPicker",
  EDIT_FAVORITE: "EditFavorite",
  FAVORITES: "Favorites",
  SELECT_VEHICLE: "SelectVehicle",
  SERVICE_PURPOSE: "ServicePurpose",
  FINAL_ORDER_SUMMARY: "FinalOrderSummary",
  PAYMENT: "Payment",
  RIDE_TRACKING: "RideTracking",
  CHAT: "Chat",
  RIDE_COMPLETED: "RideCompleted",
  CLIENT_RATE_DRIVER: "ClientRateDriver",
  CLIENT_CANCEL_RIDE: "ClientCancelRide",
  CANCEL_FEE: "CancelFee",
  HISTORY: "History",
  ORDER_DETAILS: "OrderDetails",
  PROFILE: "Profile",
  SETTINGS: "Settings",
  WALLET: "Wallet",
  HELP: "Help",
  CLIENT_CITY: "ClientCity",
  SAFETY_CENTER: "SafetyCenter",
  NOTIFICATIONS_CENTER: "NotificationsCenter",
  TIP_DRIVER: "TipDriver",
  SEARCHING_DRIVER: "SearchingDriver",
} as const;

export function navigateToHome(navigation: any): void {
  navigation.navigate(ROUTES.HOME);
}

export function navigateToRideTracking(navigation: any, rideId: string): void {
  navigation.navigate(ROUTES.RIDE_TRACKING, { rideId });
}

export function navigateToChat(
  navigation: any,
  rideId: string,
  driverName?: string,
): void {
  navigation.navigate(ROUTES.CHAT, { rideId, driverName });
}

export function navigateToClientCancelRide(
  navigation: any,
  rideId: string,
  total?: number,
): void {
  navigation.navigate(ROUTES.CLIENT_CANCEL_RIDE, { rideId, total });
}

export function navigateToClientRateDriver(
  navigation: any,
  rideId: string,
  driverName?: string,
): void {
  navigation.navigate(ROUTES.CLIENT_RATE_DRIVER, { rideId, driverName });
}

export function navigateToTipDriver(
  navigation: any,
  rideId: string,
  driverName?: string,
): void {
  navigation.navigate(ROUTES.TIP_DRIVER, { rideId, driverName });
}

export function resetToHome(navigation: any): void {
  navigation.reset({
    index: 0,
    routes: [{ name: ROUTES.HOME }],
  });
}
