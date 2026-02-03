/**
 * Navigation - Helpers de navegação
 * Centraliza rotas e funções de navegação
 */

import type { NavigationProp } from '@react-navigation/native';

/**
 * Rotas do módulo Client
 */
export const ROUTES = {
  // Home
  HOME: 'Home',
  
  // Address
  ADDRESS_PICKER: 'AddressPicker',
  FAVORITES: 'Favorites',
  ADD_FAVORITE: 'AddFavorite',
  
  // Ride Request
  SELECT_VEHICLE: 'SelectVehicle',
  SERVICE_PURPOSE: 'ServicePurpose',
  PAYMENT_METHOD: 'PaymentMethod',
  ORDER_SUMMARY: 'OrderSummary',
  
  // Ride Search
  SEARCHING_DRIVER: 'SearchingDriver',
  SEARCH_TIMEOUT: 'SearchTimeout',
  
  // Ride Tracking
  RIDE_TRACKING: 'RideTracking',
  CHAT: 'Chat',
  
  // Ride Completion
  RIDE_COMPLETED: 'RideCompleted',
  RATE_DRIVER: 'RateDriver',
  
  // Ride Cancellation
  CANCEL_RIDE: 'CancelRide',
  CANCEL_FEE: 'CancelFee',
  
  // History
  HISTORY: 'History',
  ORDER_DETAILS: 'OrderDetails',
  
  // Profile
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  CITY_SELECTION: 'CitySelection',
  WALLET: 'Wallet',
  HELP: 'Help',
} as const;

/**
 * Navega para Home
 */
export function navigateToHome(navigation: any): void {
  try {
    navigation.navigate(ROUTES.HOME);
  } catch (error) {
    console.error('Error navigating to Home:', error);
    navigation.goBack();
  }
}

/**
 * Navega para seleção de endereço
 */
export function navigateToAddressPicker(
  navigation: any,
  type: 'pickup' | 'destination'
): void {
  navigation.navigate(ROUTES.ADDRESS_PICKER, { type });
}

/**
 * Navega para seleção de veículo
 */
export function navigateToSelectVehicle(navigation: any): void {
  navigation.navigate(ROUTES.SELECT_VEHICLE);
}

/**
 * Navega para finalidade do serviço
 */
export function navigateToServicePurpose(navigation: any): void {
  navigation.navigate(ROUTES.SERVICE_PURPOSE);
}

/**
 * Navega para método de pagamento
 */
export function navigateToPaymentMethod(navigation: any, amount: number): void {
  navigation.navigate(ROUTES.PAYMENT_METHOD, { amount });
}

/**
 * Navega para resumo do pedido
 */
export function navigateToOrderSummary(navigation: any): void {
  navigation.navigate(ROUTES.ORDER_SUMMARY);
}

/**
 * Navega para busca de motorista
 */
export function navigateToSearchingDriver(navigation: any): void {
  navigation.navigate(ROUTES.SEARCHING_DRIVER);
}

/**
 * Navega para acompanhamento da corrida
 */
export function navigateToRideTracking(navigation: any, rideId: string): void {
  navigation.navigate(ROUTES.RIDE_TRACKING, { rideId });
}

/**
 * Navega para corrida concluída
 */
export function navigateToRideCompleted(navigation: any, rideId: string): void {
  navigation.navigate(ROUTES.RIDE_COMPLETED, { rideId });
}

/**
 * Navega para avaliação do motorista
 */
export function navigateToRateDriver(navigation: any, rideId: string): void {
  navigation.navigate(ROUTES.RATE_DRIVER, { rideId });
}

/**
 * Navega para cancelamento da corrida
 */
export function navigateToCancelRide(
  navigation: any,
  rideId: string,
  total?: number
): void {
  navigation.navigate(ROUTES.CANCEL_RIDE, { rideId, total });
}

/**
 * Navega para chat
 */
export function navigateToChat(
  navigation: any,
  rideId: string,
  driverName: string
): void {
  navigation.navigate(ROUTES.CHAT, { rideId, driverName });
}

/**
 * Navega para histórico
 */
export function navigateToHistory(navigation: any): void {
  navigation.navigate(ROUTES.HISTORY);
}

/**
 * Navega para detalhes do pedido
 */
export function navigateToOrderDetails(navigation: any, rideId: string): void {
  navigation.navigate(ROUTES.ORDER_DETAILS, { rideId });
}

/**
 * Navega para favoritos
 */
export function navigateToFavorites(navigation: any): void {
  navigation.navigate(ROUTES.FAVORITES);
}

/**
 * Navega para adicionar favorito
 */
export function navigateToAddFavorite(
  navigation: any,
  address: string,
  coordinates: { latitude: number; longitude: number }
): void {
  navigation.navigate(ROUTES.ADD_FAVORITE, { address, coordinates });
}

/**
 * Navega para perfil
 */
export function navigateToProfile(navigation: any): void {
  navigation.navigate(ROUTES.PROFILE);
}

/**
 * Navega para configurações
 */
export function navigateToSettings(navigation: any): void {
  navigation.navigate(ROUTES.SETTINGS);
}

/**
 * Navega para seleção de cidade
 */
export function navigateToCitySelection(navigation: any): void {
  navigation.navigate(ROUTES.CITY_SELECTION);
}

/**
 * Navega para carteira
 */
export function navigateToWallet(navigation: any): void {
  navigation.navigate(ROUTES.WALLET);
}

/**
 * Navega para ajuda
 */
export function navigateToHelp(navigation: any): void {
  navigation.navigate(ROUTES.HELP);
}

/**
 * Volta para tela anterior
 */
export function goBack(navigation: any): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigateToHome(navigation);
  }
}

/**
 * Reseta navegação para Home
 */
export function resetToHome(navigation: any): void {
  navigation.reset({
    index: 0,
    routes: [{ name: ROUTES.HOME }],
  });
}
