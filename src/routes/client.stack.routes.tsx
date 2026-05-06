import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/(authenticated)/Client/Home";
import HistoryScreen from "../screens/(authenticated)/Client/History/HistoryList";
import WalletScreen from "../screens/(authenticated)/Client/Profile/Wallet";
import ProfileScreen from "../screens/(authenticated)/Client/Profile/ProfileView";
import HelpScreen from "../screens/(authenticated)/Client/Profile/Help";
import SettingsScreen from "../screens/(authenticated)/Client/Profile/Settings";
import AddressPickerScreen from "../screens/(authenticated)/Client/Ride/Request/AddressPicker";
import FavoritesScreen from "../screens/(authenticated)/Client/Favorites/FavoritesList";
import SelectVehicleScreen from "../screens/(authenticated)/Client/Ride/Request/SelectVehicle";
import ServicePurposeScreen from "../screens/(authenticated)/Client/Ride/Request/ServicePurpose";
import OrderSummaryScreen from "../screens/(authenticated)/Client/Ride/Request/OrderSummary";
import CancelFeeScreen from "../screens/(authenticated)/Client/Ride/Cancellation/CancelFee";
import ChatScreen from "../screens/(authenticated)/Client/Ride/Tracking/Chat";
import OrderDetailsScreen from "../screens/(authenticated)/Client/History/OrderDetails";
import PaymentScreen from "../screens/(authenticated)/Client/Ride/Request/Payment";
import RideTrackingScreen from "../screens/(authenticated)/Client/Ride/Tracking/RideTracking";
import RideCompletedScreen from "../screens/(authenticated)/Client/Ride/Completion/RideCompleted";
import RateDriverScreen from "../screens/(authenticated)/Client/Ride/Completion/RateDriver";
import CancelRideScreen from "../screens/(authenticated)/Client/Ride/Cancellation/CancelRide";
import ClientCityScreen from "../screens/(authenticated)/Client/ClientCityScreen";
import ConfirmPickupScreen from "../screens/(authenticated)/Client/Ride/Request/ConfirmPickup";
import AddPaymentMethodScreen from "../screens/(authenticated)/Client/Profile/AddPaymentMethod";
import SafetyCenterScreen from "../screens/(authenticated)/Client/Safety/SafetyCenter";
import TipDriverScreen from "../screens/(authenticated)/Client/Ride/Completion/TipDriver";
import NotificationsCenterScreen from "../screens/(authenticated)/Client/Notifications/NotificationsCenter";
import SearchingDriverScreen from "../screens/(authenticated)/Client/Ride/SearchingDriver";
import ActiveOrdersScreen from "../screens/(authenticated)/Client/Orders/ActiveOrders";
import RideOffersMarketplaceScreen from "../screens/(authenticated)/Client/Orders/RideOffersMarketplaceScreen";
import PaymentsCenterScreen from "../screens/(authenticated)/Client/Profile/PaymentsCenter";
import CouponsScreen from "../screens/(authenticated)/Client/Profile/CouponsScreen";
import ReceiptsScreen from "../screens/(authenticated)/Client/Profile/ReceiptsScreen";
import PrivacyDataScreen from "../screens/(authenticated)/Client/Profile/PrivacyDataScreen";
import InviteFriendsScreen from "../screens/(authenticated)/Client/Profile/InviteFriendsScreen";
import SupportCenterScreen from "../screens/(authenticated)/Client/Profile/SupportCenterScreen";

type ClientStackRoutesProps = {
  initialRideId?: string | null;
};

const Stack = createNativeStackNavigator();

export default function ClientStackRoutes({
  initialRideId,
}: ClientStackRoutesProps) {
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

      <Stack.Screen name="LocationPicker" component={AddressPickerScreen} />
      <Stack.Screen name="EditFavorite" component={AddressPickerScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="SelectVehicle" component={SelectVehicleScreen} />
      <Stack.Screen name="ServicePurpose" component={ServicePurposeScreen} />
      <Stack.Screen name="FinalOrderSummary" component={OrderSummaryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="SearchingDriver" component={SearchingDriverScreen} />
      <Stack.Screen name="ActiveOrders" component={ActiveOrdersScreen} />
      <Stack.Screen
        name="RideOffersMarketplace"
        component={RideOffersMarketplaceScreen}
      />
      <Stack.Screen
        name="RideTracking"
        component={RideTrackingScreen}
        initialParams={initialRideId ? { rideId: initialRideId } : undefined}
      />
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
      <Stack.Screen name="PaymentsCenter" component={PaymentsCenterScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} />
      <Stack.Screen name="PrivacyData" component={PrivacyDataScreen} />
      <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      <Stack.Screen name="SupportCenter" component={SupportCenterScreen} />
    </Stack.Navigator>
  );
}
