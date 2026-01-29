import React, { useState } from "react";
import AuthRoutes from "./auth.routes";
import ClientBoot from "./ClientBoot";
import DrawerDriverRoutes from "./drawer.driver.routes";
import { useAuthStore } from "../context/authStore";

export default function Routes() {
  const { isAuthenticated, userType } = useAuthStore();

  if (!isAuthenticated) {
    return <AuthRoutes />;
  }

  // Rotas autenticadas
  if (userType === "client") {
    return <ClientBoot />;
  }

  if (userType === "driver") {
    return <DrawerDriverRoutes />;
  }

  // Fallback - retorna null se não houver tipo de usuário definido
  return null;
}
