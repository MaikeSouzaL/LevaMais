"use client";

import { apiClient, setToken } from "./apiClient";
import type { PartnerSession } from "@/types";

export async function login(email: string, password: string): Promise<PartnerSession> {
  const response = await apiClient.post("/auth/login", { email, password });
  const token = response.data?.token || response.data?.data?.token;
  if (!token) throw new Error("Login sem token retornado pelo backend");
  setToken(token);
  return {
    token,
    user: response.data?.user || response.data?.data?.user,
  };
}

export interface ClientWallet {
  balance: number;
  held: number;
}

export async function getClientWallet(): Promise<ClientWallet> {
  const response = await apiClient.get<{ data?: ClientWallet } | ClientWallet>("/auth/wallet");
  const result = (response.data as { data?: ClientWallet }).data || (response.data as ClientWallet);
  return result || { balance: 0, held: 0 };
}
