import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Configuração base da API
// Para Android Emulator use: http://10.0.2.2:3000/api
// Para Android Device/IOs use: http://SEU_IP_LOCAL:3000/api (ex: http://192.168.1.100:3000/api)
// Para produção, configure a URL do seu servidor
const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:3000/api" // Android Emulator
  : "https://sua-api-producao.com/api";

// Criar instância do axios
function createApiInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Interceptor para adicionar token nas requisições
  instance.interceptors.request.use(
    (config) => {
      // O token será adicionado manualmente em cada chamada
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor para tratar erros de resposta
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        // Erro da API
        return Promise.reject(error);
      } else if (error.request) {
        // Erro de rede
        return Promise.reject(
          new Error("Erro de conexão. Verifique sua internet.")
        );
      } else {
        // Erro ao configurar requisição
        return Promise.reject(error);
      }
    }
  );

  return instance;
}

const apiInstance = createApiInstance();

// Funções helpers para requisições
export function apiGet<T = any>(
  endpoint: string,
  token?: string
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
  token?: string
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
  token?: string
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
  token?: string
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
