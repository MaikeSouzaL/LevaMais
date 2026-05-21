import { apiPost, apiGet, apiDelete, apiPatch } from "./api";
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
  userData: RegisterUserInput,
): Promise<ApiResponse<AuthResponse>> {
  try {
    // Validar dados com Zod
    const validatedData = registerUserSchema.parse(userData);

    const response = await apiPost<ApiResponse<AuthResponse>>(
      "/auth/register",
      validatedData,
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
  loginData: LoginInput,
): Promise<ApiResponse<AuthResponse>> {
  try {
    // Validar dados com Zod
    const validatedData = loginSchema.parse(loginData);

    const response = await apiPost<ApiResponse<AuthResponse>>(
      "/auth/login",
      validatedData,
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

export async function checkEmailExists(
  email: string,
): Promise<
  ApiResponse<{ exists: boolean; isActive: boolean; userType?: string }>
> {
  try {
    const response = await apiPost<
      ApiResponse<{ exists: boolean; isActive: boolean; userType?: string }>
    >("/auth/check-email", { email: email.trim().toLowerCase() });

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: false,
      message: error.message || "Erro ao verificar email",
      error: error.message,
    };
  }
}

// Login ou cadastro com Google
export async function googleAuth(
  googleData: GoogleAuthInput,
): Promise<ApiResponse<AuthResponse>> {
  try {
    // Validar dados com Zod
    const validatedData = googleAuthSchema.parse(googleData);

    const response = await apiPost<ApiResponse<AuthResponse>>(
      "/auth/google",
      validatedData,
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
export async function getProfile(
  token: string,
): Promise<ApiResponse<{ user: User }>> {
  try {
    const response = await apiGet<ApiResponse<{ user: User }>>(
      "/auth/profile",
      token,
    );

    return response.data;
  } catch (error: any) {
    // 🛡️ Graceful Gating: Don't log error if it's just a 401 (expired/invalid token)
    // This avoids "scary" logs when the app is just cleaning up a stale session.
    if (error.response?.status !== 401) {
      console.error("Erro ao buscar perfil:", error);
    }

    // Erro da API
    if (error.response?.data) {
      return error.response.data;
    }

    // Erro de rede ou outro
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
      { email: data.email.trim().toLowerCase() },
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
      },
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
      },
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
  token: string,
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
  token: string,
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
      token,
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

export async function sendPhoneVerification(
  phone: string,
  userId?: string,
): Promise<ApiResponse<{ message: string }>> {
  try {
    let normalizedPhone = String(phone || "").replace(/\D/g, "");

    // Remove leading zero (comum em discagem interurbana no Brasil: 0 + DDD)
    if ((normalizedPhone.length === 11 || normalizedPhone.length === 12) && normalizedPhone.startsWith("0")) {
      normalizedPhone = normalizedPhone.substring(1);
    }

    // Remove prefixo 55 se presente (Brasil)
    if ((normalizedPhone.length === 12 || normalizedPhone.length === 13) && normalizedPhone.startsWith("55")) {
      normalizedPhone = normalizedPhone.substring(2);
    }

    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      return { success: false, message: "Telefone invalido" };
    }

    const response = await apiPost<ApiResponse<{ message: string }>>(
      "/auth/send-phone-code",
      { phone: normalizedPhone, userId: userId || undefined },
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) return error.response.data;
    return { success: false, message: error.message || "Erro ao enviar codigo" };
  }
}

export async function verifyPhoneCode(
  phone: string,
  code: string,
): Promise<ApiResponse<{ verified: boolean }>> {
  try {
    const currentCode = String(code || "").trim();
    
    let normalizedPhone = String(phone || "").replace(/\D/g, "");
    
    // Remove leading zero
    if ((normalizedPhone.length === 11 || normalizedPhone.length === 12) && normalizedPhone.startsWith("0")) {
      normalizedPhone = normalizedPhone.substring(1);
    }

    if ((normalizedPhone.length === 12 || normalizedPhone.length === 13) && normalizedPhone.startsWith("55")) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    const response = await apiPost<ApiResponse<{ verified: boolean }>>(
      "/auth/verify-phone-code",
      { phone: normalizedPhone, code: currentCode },
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) return error.response.data;
    return { success: false, message: error.message || "Erro ao verificar codigo" };
  }
}

export type PaymentMethod = {
  _id: string;
  brand: string;
  last4: string;
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
};

export type WalletTransaction = {
  _id: string;
  type: "topup" | "ride_payment" | "refund" | "adjustment";
  amount: number;
  description?: string;
  createdAt: string;
  referenceId?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: "ride" | "promo" | "system" | "payment";
  createdAt: string;
  read: boolean;
};

export type PrivacyExportPayload = {
  generatedAt: string;
  account: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    userType: "client" | "driver" | "admin";
    profilePhoto?: string | null;
    preferredPayment?: "pix" | "cash" | "card" | null;
    notificationsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
  };
  documents: {
    cpf?: string | null;
    cnpj?: string | null;
    companyName?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
  };
  address?: any;
  paymentMethods: PaymentMethod[];
  wallet: {
    balance: number;
    transactionsCount: number;
  };
  privacy: {
    consentVersion: string;
    termsVersion?: string;
    privacyPolicyVersion?: string;
    acceptedTerms: boolean;
    acceptedTermsAt?: string | null;
    acceptedPrivacyAt?: string | null;
    consentRevokedAt?: string | null;
    accountDeletionStatus: "none" | "requested" | "completed";
    accountDeletionRequestedAt?: string | null;
    accountDeletionCompletedAt?: string | null;
  };
  rides: {
    total: number;
    byStatus: Record<string, number>;
  };
};

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await apiGet("/auth/payment-methods");
  return response.data?.paymentMethods || [];
}

export async function addPaymentMethod(payload: {
  cardNumber: string;
  holderName: string;
  expiry: string;
  isDefault?: boolean;
}): Promise<PaymentMethod> {
  const response = await apiPost("/auth/payment-methods", payload);
  return response.data?.paymentMethod;
}

export async function deletePaymentMethod(methodId: string): Promise<void> {
  await apiDelete(`/auth/payment-methods/${methodId}`);
}

export async function setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
  const response = await apiPatch(`/auth/payment-methods/${methodId}/default`, {});
  return response.data?.paymentMethod;
}

export async function getClientWallet(): Promise<{
  balance: number;
  transactions: WalletTransaction[];
}> {
  const response = await apiGet("/auth/wallet");
  return {
    balance: Number(response.data?.balance || 0),
    transactions: response.data?.transactions || [],
  };
}

export async function topupClientWallet(amount: number): Promise<{
  balance: number;
}> {
  const response = await apiPost("/auth/wallet/topup", { amount });
  return {
    balance: Number(response.data?.balance || 0),
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  const response = await apiGet("/auth/notifications");
  return response.data?.notifications || [];
}

export async function exportPrivacyData(): Promise<PrivacyExportPayload> {
  const response = await apiGet("/auth/privacy-export");
  return response.data?.data;
}

export async function recordPrivacyConsent(payload?: {
  acceptedTerms?: boolean;
  acceptedPrivacy?: boolean;
  consentVersion?: string;
  termsVersion?: string;
  privacyPolicyVersion?: string;
}): Promise<{
  consentVersion: string;
  termsVersion: string;
  privacyPolicyVersion: string;
  acceptedTermsAt: string;
  acceptedPrivacyAt: string;
}> {
  const response = await apiPost("/auth/privacy-consent", payload || {});
  return response.data?.data;
}

export async function revokePrivacyConsent(): Promise<{
  consentRevokedAt: string;
}> {
  const response = await apiPost("/auth/privacy-revoke", {});
  return response.data?.data;
}

export async function deleteOwnAccount(reason?: string): Promise<{
  accountDeletionCompletedAt: string;
  accountDeletionStatus: "completed";
}> {
  const response = await apiPost("/auth/account-delete", {
    reason,
  });
  return response.data?.data;
}

/**
 * Envia os documentos (cnh, crlv, selfie) em um objeto FormData
 * para o endpoint multi-part no backend.
 */
export async function submitDriverVerification(
  formData: FormData,
  token?: string
): Promise<ApiResponse<any>> {
  try {
    const response = await apiPost<ApiResponse<any>>(
      "/auth/driver-verification",
      formData,
      token
    );
    return response.data;
  } catch (error: any) {
    console.error("[AuthService] Erro ao enviar verificacao:", error);
    if (error.response?.data) {
      console.log("[AuthService] Server Response Error Data:", JSON.stringify(error.response.data));
    }
    return {
      success: false,
      message: error.response?.data?.message || "Erro ao enviar documentos.",
      error: error.message,
    };
  }
}
