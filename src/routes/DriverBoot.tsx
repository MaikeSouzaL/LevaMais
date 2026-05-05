import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";

import DrawerDriverRoutes from "./drawer.driver.routes";
import rideService from "../services/ride.service";

export default function DriverBoot() {
  const [loading, setLoading] = useState(true);
  const [initialRideId, setInitialRideId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await rideService.getActive();

        if (!mounted) return;

        if (res?.active && res.ride?._id) {
          setInitialRideId(res.ride._id);
        }
      } catch {
        // fluxo silencioso: se falhar, entra no DriverHome normalmente
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#091A2F",
          padding: 24,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.75)" }}>Carregando...</Text>
      </View>
    );
  }

  return <DrawerDriverRoutes initialRideId={initialRideId} />;
}

