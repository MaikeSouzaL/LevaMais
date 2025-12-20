import { apiPost, apiGet, apiDelete } from "./api";
import type { ApiResponse, AuthResponse, User } from "../types/api";
import {
  registerUserSchema,
  loginSchema,
  googleAuthSchema,
  type RegisterUserInput,
  type LoginInput,
  type GoogleAuthInput,
} from "../schemas/auth.schema";

// Cadastrar usuário manualmente com email e senha
export async function registerUser(
  userData: RegisterUserInput
): Promise<ApiResponse<AuthResponse>> {
  try {
    // Validar dados com Zod
    const validatedData = registerUserSchema.parse(userData);

    const response = await apiPost<ApiResponse<AuthResponse>>(
      "/auth/register",
      validatedData
    );

    return response.data;
  } catch (error: any) {
    // Erro de validação Zod
    if (error.issues) {
      const firstError = error.issues[0];
      return {
        success: false,
        message: firstError.message || "Dados inválidos",
        error: "validation_error",
      };
    }

    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao cadastrar usuário:", error);
    return {
      success: false,
      message: error.message || "Erro de conexão. Verifique sua internet.",
      error: error.message,
    };
  }
}

// Login com email e senha
export async function login(
  loginData: LoginInput
): Promise<ApiResponse<AuthResponse>> {
  try {
    // Validar dados com Zod
    const validatedData = loginSchema.parse(loginData);

    const response = await apiPost<ApiResponse<AuthResponse>>(
      "/auth/login",
      validatedData
    );

    return response.data;
  } catch (error: any) {
    // Erro de validação Zod
    if (error.issues) {
      const firstError = error.issues[0];
      return {
        success: false,
        message: firstError.message || "Dados inválidos",
        error: "validation_error",
      };
    }

    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao fazer login:", error);
    return {
      success: false,
      message: error.message || "Erro de conexão. Verifique sua internet.",
      error: error.message,
    };
  }
}

// Login ou cadastro com Google
export async function googleAuth(
  googleData: GoogleAuthInput
): Promise<ApiResponse<AuthResponse>> {
  try {
    // Validar dados com Zod
    const validatedData = googleAuthSchema.parse(googleData);

    const response = await apiPost<ApiResponse<AuthResponse>>(
      "/auth/google",
      validatedData
    );

    return response.data;
  } catch (error: any) {
    // Erro de validação Zod
    if (error.issues) {
      const firstError = error.issues[0];
      return {
        success: false,
        message: firstError.message || "Dados inválidos",
        error: "validation_error",
      };
    }

    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro na autenticação Google:", error);
    return {
      success: false,
      message: error.message || "Erro de conexão. Verifique sua internet.",
      error: error.message,
    };
  }
}

// Buscar perfil do usuário autenticado
export async function getProfile(token: string): Promise<ApiResponse<User>> {
  try {
    const response = await apiGet<ApiResponse<User>>("/auth/profile", token);

    return response.data;
  } catch (error: any) {
    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao buscar perfil:", error);
    return {
      success: false,
      message: error.message || "Erro de conexão. Verifique sua internet.",
      error: error.message,
    };
  }
}

// Solicitar recuperação de senha (envia código por email)
export async function requestPasswordReset(data: {
  email: string;
}): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await apiPost<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      { email: data.email.trim().toLowerCase() }
    );

    return response.data;
  } catch (error: any) {
    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao solicitar recuperação de senha:", error);
    return {
      success: false,
      message: error.message || "Erro de conexão. Verifique sua internet.",
      error: error.message,
    };
  }
}

// Verificar código de recuperação
export async function verifyResetCode(data: {
  email: string;
  code: string;
}): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await apiPost<ApiResponse<{ message: string }>>(
      "/auth/verify-reset-code",
      {
        email: data.email.trim().toLowerCase(),
        code: data.code,
      }
    );

    return response.data;
  } catch (error: any) {
    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao verificar código:", error);
    return {
      success: false,
      message: error.message || "Erro de conexão. Verifique sua internet.",
      error: error.message,
    };
  }
}

// Redefinir senha com código
export async function resetPassword(data: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<ApiResponse<{ message: string }>> {
  try {
    if (data.newPassword.length < 6) {
      return {
        success: false,
        message: "A senha deve ter pelo menos 6 caracteres",
        error: "validation_error",
      };
    }

    const response = await apiPost<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      {
        email: data.email.trim().toLowerCase(),
        code: data.code,
        newPassword: data.newPassword,
      }
    );

    return response.data;
  } catch (error: any) {
    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao redefinir senha:", error);
    return {
      success: false,
      message: error.message || "Erro de conexão. Verifique sua internet.",
      error: error.message,
    };
  }
}

// Verificar se o servidor está online
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await apiGet("/health");
    return response.status === 200;
  } catch (error) {
    console.error("Servidor offline:", error);
    return false;
  }
}

// Salvar push token no backend
export async function savePushToken(
  pushToken: string,
  token: string
): Promise<ApiResponse<{ pushToken: string; pushTokenUpdatedAt: Date }>> {
  try {
    if (!pushToken || !token) {
      return {
        success: false,
        message: "Push token e token de autenticação são obrigatórios",
        error: "validation_error",
      };
    }

    const response = await apiPost<
      ApiResponse<{ pushToken: string; pushTokenUpdatedAt: Date }>
    >("/auth/push-token", { pushToken }, token);

    return response.data;
  } catch (error: any) {
    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao salvar push token:", error);
    return {
      success: false,
      message: error.message || "Erro ao salvar push token",
      error: error.message,
    };
  }
}

// Remover push token no backend (logout ou desativar notificações)
export async function removePushToken(
  token: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    if (!token) {
      return {
        success: false,
        message: "Token de autenticação é obrigatório",
        error: "validation_error",
      };
    }

    const response = await apiDelete<ApiResponse<{ message: string }>>(
      "/auth/push-token",
      token
    );

    return response.data;
  } catch (error: any) {
    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
    console.error("Erro ao remover push token:", error);
    return {
      success: false,
      message: error.message || "Erro ao remover push token",
      error: error.message,
    };
  }
}
