import React from "react";
import { Polyline } from "react-native-maps";
import { AnimatedRoutePath } from "./AnimatedRoutePath";

interface PremiumDottedRouteProps {
  coordinates: Array<{ latitude: number; longitude: number }>;
}

export const PremiumDottedRoute = ({ coordinates }: PremiumDottedRouteProps) => {
  if (!coordinates || coordinates.length === 0) return null;

  return (
    <>
      {/* A single clean high-contrast solid dark navy line */}
      <Polyline
        coordinates={coordinates}
        strokeColor="#091A2F"
        strokeWidth={4}
        lineCap="round"
        zIndex={20}
      />

      {/* 🚀 Realtime Dynamic Animation Overlay Engine */}
      <AnimatedRoutePath coordinates={coordinates} />
    </>
  );
};
