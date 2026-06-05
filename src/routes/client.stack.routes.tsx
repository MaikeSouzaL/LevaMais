import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "@/screens/(authenticated)/Client/Home";
import HistoryScreen from "@/screens/(authenticated)/Client/History/HistoryList";
import WalletScreen from "@/screens/(authenticated)/Client/Profile/Wallet";
import ProfileScreen from "@/screens/(authenticated)/Client/Profile/ProfileView";
import HelpScreen from "@/screens/(authenticated)/Client/Profile/Help";
import SettingsScreen from "@/screens/(authenticated)/Client/Profile/Settings";
import EditAccountScreen from "../screens/(authenticated)/Client/Profile/EditAccountScreen";
import AddressPickerScreen from "../screens/(authenticated)/Client/Ride/Request/AddressPicker";
import DestinationSearchScreen from "../screens/(authenticated)/Client/Ride/Request/DestinationSearch";
import FavoritesScreen from "../screens/(authenticated)/Client/Favorites/FavoritesList";
import FavoriteAddressFlowScreen from "../screens/(authenticated)/Client/Favorites/FavoriteAddressFlow";
import RideSetupScreen from "../screens/(authenticated)/Client/Ride/Request/RideSetup";
import RideBidSetupScreen from "../screens/(authenticated)/Client/Ride/Request/RideBidSetupScreen";
import RideBiddingScreen from "../screens/(authenticated)/Client/Ride/Request/RideBiddingScreen";
import RideCategorySelectScreen from "../screens/(authenticated)/Client/Ride/Request/RideCategorySelect";
import RouteAuditScreen from "../screens/(authenticated)/Client/History/RouteAudit";
import DeliverySetupScreen from "../screens/(authenticated)/Client/Ride/Request/DeliverySetup";
import DeliverySenderInfoScreen from "../screens/(authenticated)/Client/Ride/Request/DeliverySenderInfo";
import DeliveryDetailsScreen from "../screens/(authenticated)/Client/Ride/Request/DeliveryDetails";
import EditDeliveryAddressScreen from "../screens/(authenticated)/Client/Ride/Request/EditDeliveryAddress";
import DeliveryMapPickerScreen from "../screens/(authenticated)/Client/Ride/Request/DeliveryMapPicker";
import DeliveryReviewScreen from "../screens/(authenticated)/Client/Ride/Request/DeliveryReview";
import CancelFeeScreen from "../screens/(authenticated)/Client/Ride/Cancellation/CancelFee";
import ChatScreen from "../screens/(authenticated)/Client/Ride/Tracking/Chat";
import OrderDetailsScreen from "../screens/(authenticated)/Client/History/OrderDetails";
import RideTrackingScreen from "../screens/(authenticated)/Client/Ride/Tracking/RideTracking";
import DeliveryTrackingScreen from "../screens/(authenticated)/Client/Ride/Tracking/DeliveryTracking";
import RideCompletedScreen from "../screens/(authenticated)/Client/Ride/Completion/RideCompleted";
import RateDriverScreen from "../screens/(authenticated)/Client/Ride/Completion/RateDriver";
import CancelRideScreen from "../screens/(authenticated)/Client/Ride/Cancellation/CancelRide";
import ClientCityScreen from "../screens/(authenticated)/Client/ClientCityScreen";
import ConfirmPickupScreen from "../screens/(authenticated)/Client/Ride/Request/ConfirmPickup";
import AddPaymentMethodScreen from "../screens/(authenticated)/Client/Profile/AddPaymentMethod";
import SafetyCenterScreen from "../screens/(authenticated)/Client/Safety/SafetyCenter";
import TipDriverScreen from "../screens/(authenticated)/Client/Ride/Completion/TipDriver";
import NotificationsCenterScreen from "../screens/(authenticated)/Client/Notifications/NotificationsCenter";
import ActiveOrdersScreen from "../screens/(authenticated)/Client/Orders/ActiveOrders";
import RideOffersMarketplaceScreen from "../screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen";
import OrderSentScreen from "../screens/(authenticated)/Client/Ride/OrderSentScreen";
import ShiftOffersClientScreen from "../screens/(authenticated)/Client/Orders/ShiftOffersClientScreen";
import DepositScreen from "../screens/(authenticated)/Client/Wallet/DepositScreen";
import PaymentsCenterScreen from "../screens/(authenticated)/Client/Profile/PaymentsCenter";
import CouponsScreen from "../screens/(authenticated)/Client/Profile/CouponsScreen";
import ReceiptsScreen from "../screens/(authenticated)/Client/Profile/ReceiptsScreen";
import PrivacyDataScreen from "../screens/(authenticated)/Client/Profile/PrivacyDataScreen";
import InviteFriendsScreen from "../screens/(authenticated)/Client/Profile/InviteFriendsScreen";
import SupportCenterScreen from "../screens/(authenticated)/Client/Profile/SupportCenterScreen";
import PlannedRoutesScreen from "../screens/(authenticated)/Client/Routes/PlannedRoutesScreen";
import RouteReserveScreen from "../screens/(authenticated)/Client/Routes/RouteReserveScreen";
import FreightScreen from "../screens/(authenticated)/Client/Routes/FreightScreen";
import CarrierProfileScreen from "../screens/(authenticated)/Client/Routes/CarrierProfileScreen";

type ClientStackRoutesProps = {
  initialRideId?: string | null;
  route?: any;
};

const Stack = createNativeStackNavigator();

export default function ClientStackRoutes({
  initialRideId: propInitialRideId,
  route,
}: ClientStackRoutesProps) {
  const initialRideId = propInitialRideId || route?.params?.initialRideId;
  const initialRouteName = initialRideId ? "RideTracking" : "Home";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditAccount" component={EditAccountScreen} />

      <Stack.Screen name="LocationPicker" component={AddressPickerScreen} />
      <Stack.Screen name="DestinationSearch" component={DestinationSearchScreen} />
      <Stack.Screen name="EditFavorite" component={AddressPickerScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="FavoriteAddressFlow" component={FavoriteAddressFlowScreen} />
      <Stack.Screen name="RideSetup" component={RideSetupScreen} />
      <Stack.Screen name="RideCategorySelect" component={RideCategorySelectScreen} />
      <Stack.Screen name="RouteAudit" component={RouteAuditScreen} />
      <Stack.Screen name="RideBidSetup" component={RideBidSetupScreen} />
      <Stack.Screen name="RideBiddingScreen" component={RideBiddingScreen} />
      <Stack.Screen name="DeliverySenderInfo" component={DeliverySenderInfoScreen} />
      <Stack.Screen name="EditDeliveryAddress" component={EditDeliveryAddressScreen} />
      <Stack.Screen name="DeliveryMapPicker" component={DeliveryMapPickerScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <Stack.Screen name="DeliverySetup" component={DeliverySetupScreen} />
      <Stack.Screen name="DeliveryReview" component={DeliveryReviewScreen} />
      <Stack.Screen name="OrderSent" component={OrderSentScreen} />
      <Stack.Screen name="ActiveOrders" component={ActiveOrdersScreen} />
      <Stack.Screen name="ShiftOffersClient" component={ShiftOffersClientScreen} />
      <Stack.Screen
        name="RideOffersMarketplace"
        component={RideOffersMarketplaceScreen}
      />
      <Stack.Screen
        name="RideTracking"
        component={RideTrackingScreen}
        initialParams={initialRideId ? { rideId: initialRideId } : undefined}
      />
      <Stack.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ClientCancelRide" component={CancelRideScreen} />
      <Stack.Screen name="CancelFee" component={CancelFeeScreen} />
      <Stack.Screen name="RideCompleted" component={RideCompletedScreen} />
      <Stack.Screen name="ClientRateDriver" component={RateDriverScreen} />
      <Stack.Screen name="TipDriver" component={TipDriverScreen} />

      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="ClientCity" component={ClientCityScreen} />
      <Stack.Screen name="ConfirmPickup" component={ConfirmPickupScreen} />
      <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
      <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />
      <Stack.Screen
        name="NotificationsCenter"
        component={NotificationsCenterScreen}
      />
      <Stack.Screen name="Deposit" component={DepositScreen} />
      <Stack.Screen name="PaymentsCenter" component={PaymentsCenterScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} />
      <Stack.Screen name="PrivacyData" component={PrivacyDataScreen} />
      <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      <Stack.Screen name="SupportCenter" component={SupportCenterScreen} />
      <Stack.Screen name="PlannedRoutes" component={PlannedRoutesScreen} />
      <Stack.Screen name="RouteReserve" component={RouteReserveScreen} />
      <Stack.Screen name="Freight" component={FreightScreen} />
      <Stack.Screen name="CarrierProfile" component={CarrierProfileScreen} />
    </Stack.Navigator>
  );
}

