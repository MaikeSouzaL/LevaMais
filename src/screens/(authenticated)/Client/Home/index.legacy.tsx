import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";

import { LocationLoadingScreen } from "@/components/ui/LocationLoadingScreen";
import { useAuthStore } from "@/context/authStore";
import { FavoriteAddress } from "@/services/favoriteAddress.service";
import rideService from "@/services/ride.service";
import { DashboardView } from "./components/DashboardView";
import { useMapLocation } from "../Shared/hooks";

type HomeRouteParams = {
  startSearch?: boolean;
  searchData?: {
    title?: string;
    price?: string;
    eta?: string;
    rideId?: string;
  };
  currentLocation?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  home_dropoff?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  favorite_creation?: boolean;
  initialVehicle?: "motorcycle" | "car" | "van" | "truck";
  initialService?: string;
};

type LocationPoint = {
  address: string;
  latitude: number;
  longitude: number;
};

const toLocationPoint = (input: any): LocationPoint | null => {
  const latitude = Number(input?.latitude);
  const longitude = Number(input?.longitude);

  if (!input?.address || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    address: input.address,
    latitude,
    longitude,
  };
};

export default function HomeScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const route = useRoute<any>();
  const params = (route.params || {}) as HomeRouteParams;

  const mapLocation = useMapLocation();
  const userType = useAuthStore((s) => s.userType);

  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [dropoff, setDropoff] = useState<LocationPoint | null>(null);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const resolvedPickupFromMap = useMemo(() => {
    const lat = mapLocation.userRegion?.latitude ?? mapLocation.region?.latitude;
    const lng = mapLocation.userRegion?.longitude ?? mapLocation.region?.longitude;

    if (lat == null || lng == null) return null;

    return {
      address: mapLocation.currentAddress || "Sua localizacao",
      latitude: Number(lat),
      longitude: Number(lng),
    };
  }, [
    mapLocation.currentAddress,
    mapLocation.region?.latitude,
    mapLocation.region?.longitude,
    mapLocation.userRegion?.latitude,
    mapLocation.userRegion?.longitude,
  ]);

  useEffect(() => {
    if (!pickup && resolvedPickupFromMap) {
      setPickup(resolvedPickupFromMap);
      setPickupAddress(resolvedPickupFromMap.address);
    }
  }, [pickup, resolvedPickupFromMap]);

  useEffect(() => {
    if (!params.currentLocation) return;

    const nextPickup = toLocationPoint(params.currentLocation);
    if (nextPickup) {
      setPickup(nextPickup);
      setPickupAddress(nextPickup.address);
    }

    navigation.setParams({ currentLocation: undefined });
  }, [navigation, params.currentLocation]);

  useEffect(() => {
    const incomingDropoff = params.home_dropoff || params.dropoff;
    if (!incomingDropoff) return;

    const nextDropoff = toLocationPoint(incomingDropoff);
    if (nextDropoff) {
      setDropoff(nextDropoff);
      setDropoffAddress(nextDropoff.address);
    }

    const initialVehicle = params.initialVehicle;
    const initialService = params.initialService;

    navigation.setParams({
      home_dropoff: undefined,
      dropoff: undefined,
      initialVehicle: undefined,
      initialService: undefined,
    });

    if (!nextDropoff || !initialVehicle) {
      return;
    }

    const nextPickup = pickup || resolvedPickupFromMap;
    if (!nextPickup) {
      navigation.navigate("LocationPicker", {
        selectionMode: "currentLocation",
        returnScreen: "Home",
      } as never);
      return;
    }

    setPickup(nextPickup);
    setPickupAddress(nextPickup.address);

    navigation.navigate("ServicePurpose", {
      vehicleType: initialVehicle,
      pickup: nextPickup,
      dropoff: nextDropoff,
      initialPurposeId: initialService,
    } as never);
  }, [
    navigation,
    params.dropoff,
    params.home_dropoff,
    params.initialService,
    params.initialVehicle,
    pickup,
    resolvedPickupFromMap,
  ]);

  useEffect(() => {
    if (!params.startSearch || !params.searchData?.rideId) return;

    const rideId = params.searchData.rideId;

    navigation.setParams({
      startSearch: undefined,
      searchData: undefined,
      searchRoute: undefined,
    });

    navigation.navigate("SearchingDriver", { rideId } as never);
  }, [navigation, params.searchData?.rideId, params.startSearch]);

  useEffect(() => {
    if (!params.favorite_creation) return;

    setDashboardRefreshTrigger((prev) => prev + 1);
    navigation.setParams({ favorite_creation: undefined });
  }, [navigation, params.favorite_creation]);

  const ensurePickup = useCallback(() => {
    const nextPickup = pickup || resolvedPickupFromMap;
    if (!nextPickup) return null;

    if (!pickup) {
      setPickup(nextPickup);
      setPickupAddress(nextPickup.address);
    }

    return nextPickup;
  }, [pickup, resolvedPickupFromMap]);

  const handleSelectFlow = useCallback(
    (vehicleId: string, serviceId?: string) => {
      const nextPickup = ensurePickup();
      const hasDropoffCoords =
        Number.isFinite(Number(dropoff?.latitude)) &&
        Number.isFinite(Number(dropoff?.longitude));

      if (!nextPickup) {
        navigation.navigate("LocationPicker", {
          selectionMode: "currentLocation",
          returnScreen: "Home",
        } as never);
        return;
      }

      if (!hasDropoffCoords) {
        navigation.navigate("LocationPicker", {
          selectionMode: "home_dropoff",
          returnScreen: "Home",
          initialVehicle: vehicleId,
          initialService: serviceId,
        } as never);
        return;
      }

      navigation.navigate("ServicePurpose", {
        vehicleType: vehicleId,
        pickup: nextPickup,
        dropoff,
        initialPurposeId: serviceId,
      } as never);
    },
    [dropoff, ensurePickup, navigation],
  );

  const handleSelectFavorite = useCallback(
    (fav: FavoriteAddress) => {
      const nextPickup = ensurePickup();

      if (!nextPickup) {
        navigation.navigate("LocationPicker", {
          selectionMode: "currentLocation",
          returnScreen: "Home",
        } as never);
        return;
      }

      const nextDropoff = {
        address: fav.formattedAddress || fav.address,
        latitude: Number(fav.latitude),
        longitude: Number(fav.longitude),
      };

      setDropoff(nextDropoff);
      setDropoffAddress(nextDropoff.address);

      navigation.navigate("SelectVehicle", {
        pickup: nextPickup,
        dropoff: nextDropoff,
      } as never);
    },
    [ensurePickup, navigation],
  );

  const handlePressMenu = useCallback(() => {
    const parent = (navigation as any).getParent?.();

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    if ((navigation as any).openDrawer) {
      (navigation as any).openDrawer();
    }
  }, [navigation]);

  const handleEditPickup = useCallback(() => {
    navigation.navigate("LocationPicker", {
      selectionMode: "currentLocation",
      returnScreen: "Home",
      initialLocation: pickup
        ? {
            formattedAddress: pickup.address,
            latitude: pickup.latitude,
            longitude: pickup.longitude,
          }
        : undefined,
    } as never);
  }, [navigation, pickup]);

  const handleEditDropoff = useCallback(() => {
    navigation.navigate("LocationPicker", {
      selectionMode: "home_dropoff",
      returnScreen: "Home",
      initialLocation: dropoff
        ? {
            formattedAddress: dropoff.address,
            latitude: dropoff.latitude,
            longitude: dropoff.longitude,
          }
        : undefined,
    } as never);
  }, [dropoff, navigation]);

  const handleAddFavorite = useCallback(() => {
    navigation.navigate("LocationPicker", {
      selectionMode: "favorite_creation",
      returnScreen: "Home",
    } as never);
  }, [navigation]);

  const handleDefaultAddressFound = useCallback(
    (address: string) => {
      if (pickupAddress || !address) return;
      setPickupAddress(address);
    },
    [pickupAddress],
  );

  useFocusEffect(
    useCallback(() => {
      if (userType !== "client") return;
      let active = true;

      (async () => {
        try {
          const res = await rideService.getActiveList();
          if (!active) return;
          setActiveOrdersCount(Number(res?.count || 0));
        } catch {
          if (!active) return;
          setActiveOrdersCount(0);
        }
      })();

      return () => {
        active = false;
      };
    }, [userType]),
  );

  if (!mapLocation.region) {
    return <LocationLoadingScreen />;
  }

  return (
    <DashboardView
      userAddress={pickupAddress || mapLocation.currentAddress}
      destinationAddress={dropoffAddress}
      onPressAddress={handleEditPickup}
      onPressDestination={handleEditDropoff}
      onPressMenu={handlePressMenu}
      onPressAddFavorite={handleAddFavorite}
      onSelectFlow={handleSelectFlow}
      onSelectFavorite={handleSelectFavorite}
      onDefaultAddressFound={handleDefaultAddressFound}
      refreshTrigger={dashboardRefreshTrigger}
      activeOrdersCount={activeOrdersCount}
      onPressActiveOrders={() => navigation.navigate("ActiveOrders" as never)}
    />
  );
}
