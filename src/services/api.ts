import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Configuracao base da API
// Preferencia:
// - EXPO_PUBLIC_API_URL (ex.: http://192.168.1.8:3000)
// - Fallback para rede local de desenvolvimento
// Obs: baseURL inclui /api
const RAW_BASE = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.7:3001";
const API_BASE_URL = RAW_BASE.replace(/\/$/, "") + "/api";

if (__DEV__) {
  console.log("[API] Base URL:", API_BASE_URL);
}

function createApiInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Interceptor para adicionar token automaticamente
  instance.interceptors.request.use(
    (config) => {
      try {
        const { useAuthStore } = require("../context/authStore");
        const token = useAuthStore.getState().token;

        if (token) {
          const headers: any = config.headers;
          if (headers && typeof headers.set === "function") {
            headers.set("Authorization", `Bearer ${token}`);
          } else {
            config.headers = {
              ...(config.headers as any),
              Authorization: `Bearer ${token}`,
            } as any;
          }
        }
      } catch {
        // no-op
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status;

        // 401 = sessao invalida/expirada
        if (status === 401) {
          try {
            const { useAuthStore } = require("../context/authStore");
            useAuthStore.getState().logout();
          } catch {
            // no-op
          }

          const apiMsg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Sessao expirada. Faca login novamente.";

          return Promise.reject(new Error(apiMsg));
        }

        // 403 = sem permissao (nao deslogar)
        if (status === 403) {
          const apiMsg =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Voce nao tem permissao para realizar esta acao.";
          return Promise.reject(new Error(apiMsg));
        }

        return Promise.reject(error);
      }

      if (error.request) {
        return Promise.reject(
          new Error("Erro de conexao. Verifique sua internet."),
        );
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

const apiInstance = createApiInstance();

export function apiGet<T = any>(
  endpoint: string,
  token?: string,
): Promise<AxiosResponse<T>> {
  const config: AxiosRequestConfig = {};
  if (token) {
    config.headers = {
      Authorization: `Bearer ${token}`,
    };
  }
  return apiInstance.get<T>(endpoint, config);
}

export function apiPost<T = any>(
  endpoint: string,
  data: any,
  token?: string,
): Promise<AxiosResponse<T>> {
  const config: AxiosRequestConfig = {};
  if (token) {
    config.headers = {
      Authorization: `Bearer ${token}`,
    };
  }
  return apiInstance.post<T>(endpoint, data, config);
}

export function apiPut<T = any>(
  endpoint: string,
  data: any,
  token?: string,
): Promise<AxiosResponse<T>> {
  const config: AxiosRequestConfig = {};
  if (token) {
    config.headers = {
      Authorization: `Bearer ${token}`,
    };
  }
  return apiInstance.put<T>(endpoint, data, config);
}

export function apiDelete<T = any>(
  endpoint: string,
  token?: string,
): Promise<AxiosResponse<T>> {
  const config: AxiosRequestConfig = {};
  if (token) {
    config.headers = {
      Authorization: `Bearer ${token}`,
    };
  }
  return apiInstance.delete<T>(endpoint, config);
}

export function setBaseURL(url: string): void {
  apiInstance.defaults.baseURL = url;
}

export function getBaseURL(): string {
  return apiInstance.defaults.baseURL || API_BASE_URL;
}

export default apiInstance;