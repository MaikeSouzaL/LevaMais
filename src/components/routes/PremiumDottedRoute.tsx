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
      {/* Base ambient subtle path glow - ensures route shape is softly established */}
      <Polyline
        coordinates={coordinates}
        strokeColor="rgba(2, 222, 149, 0.15)"
        strokeWidth={8}
        lineCap="round"
        zIndex={19}
      />

      {/* The Primary Brand Dotted Route */}
      <Polyline
        coordinates={coordinates}
        strokeColor="#02de95" // Matches tailwind primary explicitly for polyline engine
        strokeWidth={3}
        lineDashPattern={[3, 12]}
        lineCap="round"
        zIndex={20}
      />

      {/* 🚀 Realtime Dynamic Animation Overlay Engine */}
      <AnimatedRoutePath coordinates={coordinates} />
    </>
  );
};
