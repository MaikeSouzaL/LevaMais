import React, { useState } from "react";
import AuthRoutes from "./auth.routes";
// import DrawerClienteRoutes from "./drawer.cliente.routes";
// import DrawerDriverRoutes from "./drawer.driver.routes";
import { useAuthStore } from "../context/authStore";

export default function Routes() {
  const { isAuthenticated, userType } = useAuthStore();

  if (!isAuthenticated) {
    return <AuthRoutes />;
  }

  // if (userType === "client") {
  //   return <DrawerClienteRoutes />;
  // }

  // if (userType === "driver") {
  //   return <DrawerDriverRoutes />;
  // }

  return null;
}
