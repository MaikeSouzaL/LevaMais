import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DriverHomeScreen from "../screens/(authenticated)/Driver/DriverHomeScreen";
import DriverRequestsScreen from "../screens/(authenticated)/Driver/DriverRequestsScreen";
import DriverRideScreen from "../screens/(authenticated)/Driver/DriverRideScreen";
import DriverRateClientScreen from "../screens/(authenticated)/Driver/DriverRateClientScreen";
import DriverCancelRideScreen from "../screens/(authenticated)/Driver/DriverCancelRideScreen";
import DriverEarningsScreen from "../screens/(authenticated)/Driver/DriverEarningsScreen";
import DriverHistoryScreen from "../screens/(authenticated)/Driver/DriverHistoryScreen";
import DriverProfileScreen from "../screens/(authenticated)/Driver/DriverProfileScreen";
import DriverVehicleScreen from "../screens/(authenticated)/Driver/DriverVehicleScreen";
import DriverSettingsScreen from "../screens/(authenticated)/Driver/DriverSettingsScreen";
import DriverWithdrawScreen from "../screens/(authenticated)/Driver/DriverWithdrawScreen";
import DriverStatementScreen from "../screens/(authenticated)/Driver/DriverStatementScreen";
import DriverRideDetailsScreen from "../screens/(authenticated)/Driver/DriverRideDetailsScreen";
import DriverHistoryRideDetailsScreen from "../screens/(authenticated)/Driver/DriverHistoryRideDetailsScreen";
import DriverHelpScreen from "../screens/(authenticated)/Driver/DriverHelpScreen";
import DriverChatScreen from "../screens/(authenticated)/Driver/DriverChatScreen";
import DriverSafetyScreen from "../screens/(authenticated)/Driver/DriverSafetyScreen";
import DriverPayoutsScreen from "../screens/(authenticated)/Driver/DriverPayoutsScreen";
import DriverIncentivesScreen from "../screens/(authenticated)/Driver/DriverIncentivesScreen";
import DriverWorkPreferencesScreen from "../screens/(authenticated)/Driver/DriverWorkPreferencesScreen";
import DriverDocumentsScreen from "../screens/(authenticated)/Driver/DriverDocumentsScreen";
import DriverRatingsScreen from "../screens/(authenticated)/Driver/DriverRatingsScreen";
import DriverSupportCenterScreen from "../screens/(authenticated)/Driver/DriverSupportCenterScreen";
import DriverShiftOffersScreen from "../screens/(authenticated)/Driver/DriverShiftOffersScreen";
import DeliveryOfferScreen from "../screens/(authenticated)/Driver/DeliveryOfferScreen";
import DriverNegotiationScreen from "../screens/(authenticated)/Driver/DriverNegotiationScreen";
import DeliveryPickupConfirmScreen from "../screens/(authenticated)/Driver/DeliveryPickupConfirm";
import DeliveryDropoffConfirmScreen from "../screens/(authenticated)/Driver/DeliveryDropoffConfirm";

const Stack = createNativeStackNavigator();

type DriverStackRoutesProps = {
  initialRideId?: string | null;
};

export default function DriverStackRoutes({ initialRideId }: DriverStackRoutesProps) {
  const initialRouteName = initialRideId ? "DriverRide" : "DriverHome";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
      <Stack.Screen name="DriverRequests" component={DriverRequestsScreen} />
      <Stack.Screen name="DriverFinance" component={DriverEarningsScreen} />
      <Stack.Screen name="DriverWithdraw" component={DriverWithdrawScreen} />
      <Stack.Screen name="DriverStatement" component={DriverStatementScreen} />
      <Stack.Screen name="DriverPayouts" component={DriverPayoutsScreen} />
      <Stack.Screen name="DriverIncentives" component={DriverIncentivesScreen} />
      <Stack.Screen name="DriverRideDetails" component={DriverRideDetailsScreen} />
      <Stack.Screen name="DriverHistory" component={DriverHistoryScreen} />
      <Stack.Screen name="DriverHistoryRideDetails" component={DriverHistoryRideDetailsScreen} />
      <Stack.Screen name="DriverShiftOffers" component={DriverShiftOffersScreen} />
      <Stack.Screen name="DriverRatings" component={DriverRatingsScreen} />
      <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
      <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
      <Stack.Screen name="DriverWorkPreferences" component={DriverWorkPreferencesScreen} />
      <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
      <Stack.Screen name="DriverSafety" component={DriverSafetyScreen} />
      <Stack.Screen name="DriverSupportCenter" component={DriverSupportCenterScreen} />
      <Stack.Screen name="DriverHelp" component={DriverHelpScreen} />
      <Stack.Screen name="DriverSettings" component={DriverSettingsScreen} />

      <Stack.Screen
        name="DriverRide"
        component={DriverRideScreen}
        initialParams={initialRideId ? { rideId: initialRideId } : undefined}
      />
      <Stack.Screen name="DriverRateClient" component={DriverRateClientScreen} />
      <Stack.Screen name="DriverCancelRide" component={DriverCancelRideScreen} />
      <Stack.Screen name="DriverChat" component={DriverChatScreen} />
      <Stack.Screen name="DriverNegotiation" component={DriverNegotiationScreen} />
      <Stack.Screen name="DeliveryOfferScreen" component={DeliveryOfferScreen} />
      <Stack.Screen name="DeliveryPickupConfirm" component={DeliveryPickupConfirmScreen} />
      <Stack.Screen name="DeliveryDropoffConfirm" component={DeliveryDropoffConfirmScreen} />
    </Stack.Navigator>
  );
}
