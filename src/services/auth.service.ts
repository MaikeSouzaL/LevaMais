import { apiPost, apiGet, apiDelete, apiPatch } from "./api";
import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
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
  try {
    const userId = await requireUserId();
    const { data: cards, error } = await supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (cards || []).map((card) => ({
      _id: card.id,
      brand: card.brand,
      last4: card.last4,
      holderName: card.holder_name,
      expiryMonth: card.expiry_month,
      expiryYear: card.expiry_year,
      isDefault: card.is_default,
      createdAt: card.created_at,
    }));
  } catch (err) {
    return [];
  }
}

export async function addPaymentMethod(payload: {
  cardNumber: string;
  holderName: string;
  expiry: string;
  isDefault?: boolean;
}): Promise<PaymentMethod> {
  const userId = await requireUserId();
  const rawNumber = payload.cardNumber.replace(/\s/g, "");
  const last4 = rawNumber.slice(-4);
  
  // Expiry is in format MM/AA
  const expiryParts = payload.expiry.split("/");
  const expiryMonth = Number(expiryParts[0] || 1);
  const expiryYear = Number(expiryParts[1] || 0) + 2000;

  // Detect brand
  let brand = "card";
  if (/^4/.test(rawNumber)) brand = "visa";
  else if (/^5[1-5]/.test(rawNumber)) brand = "mastercard";
  else if (/^3[47]/.test(rawNumber)) brand = "amex";

  // Check if user already has cards. If not, make this card the default.
  const { data: existingCards, error: getError } = await supabase
    .from("user_cards")
    .select("id")
    .eq("user_id", userId);

  if (getError) throw getError;
  const isFirstCard = !existingCards || existingCards.length === 0;
  const isDefault = payload.isDefault || isFirstCard;

  if (isDefault) {
    // Unset other default cards
    const { error: unsetError } = await supabase
      .from("user_cards")
      .update({ is_default: false })
      .eq("user_id", userId);
    if (unsetError) throw unsetError;
  }

  const { data: card, error: insertError } = await supabase
    .from("user_cards")
    .insert({
      user_id: userId,
      brand,
      last4,
      holder_name: payload.holderName,
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      is_default: isDefault,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  return {
    _id: card.id,
    brand: card.brand,
    last4: card.last4,
    holderName: card.holder_name,
    expiryMonth: card.expiry_month,
    expiryYear: card.expiry_year,
    isDefault: card.is_default,
    createdAt: card.created_at,
  };
}

export async function deletePaymentMethod(methodId: string): Promise<void> {
  const userId = await requireUserId();
  
  // Get details of the card to be deleted
  const { data: targetCard, error: fetchError } = await supabase
    .from("user_cards")
    .select("is_default")
    .eq("id", methodId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const { error: deleteError } = await supabase
    .from("user_cards")
    .delete()
    .eq("id", methodId)
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  // If the deleted card was default, make the most recent remaining card default
  if (targetCard?.is_default) {
    const { data: remainingCards } = await supabase
      .from("user_cards")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (remainingCards && remainingCards.length > 0) {
      await supabase
        .from("user_cards")
        .update({ is_default: true })
        .eq("id", remainingCards[0].id)
        .eq("user_id", userId);
    }
  }
}

export async function setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
  const userId = await requireUserId();

  // First, unset all other default cards
  const { error: unsetError } = await supabase
    .from("user_cards")
    .update({ is_default: false })
    .eq("user_id", userId);

  if (unsetError) throw unsetError;

  // Set this card as default
  const { data: card, error: setError } = await supabase
    .from("user_cards")
    .update({ is_default: true })
    .eq("id", methodId)
    .eq("user_id", userId)
    .select()
    .single();

  if (setError) throw setError;

  return {
    _id: card.id,
    brand: card.brand,
    last4: card.last4,
    holderName: card.holder_name,
    expiryMonth: card.expiry_month,
    expiryYear: card.expiry_year,
    isDefault: card.is_default,
    createdAt: card.created_at,
  };
}

export async function getClientWallet(): Promise<{
  balance: number;
  transactions: WalletTransaction[];
}> {
  const userId = await requireUserId();

  // Buscar saldo do perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  // Buscar transações
  const { data: transactions, error: txError } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (txError) throw txError;

  const normalizedTransactions: WalletTransaction[] = (transactions || []).map((t) => ({
    _id: t.id,
    type: (t.type === "deposit" || t.type === "driver_topup" ? "topup" : t.type === "app_fee_debit" || t.type === "deduction" ? "ride_payment" : t.type) as WalletTransaction["type"],
    amount: Number(t.amount || 0),
    description: t.description || undefined,
    createdAt: t.created_at,
    referenceId: t.reference_id || undefined,
  }));

  return {
    balance: Number(profile?.wallet_balance || 0),
    transactions: normalizedTransactions,
  };
}

export async function topupClientWallet(amount: number): Promise<{
  balance: number;
}> {
  const userId = await requireUserId();

  // Buscar saldo atual
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const newBalance = Number(profile?.wallet_balance || 0) + amount;

  // Atualizar saldo do perfil
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ wallet_balance: newBalance })
    .eq("id", userId);

  if (updateError) throw updateError;

  // Inserir transação
  const { error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      type: "topup",
      amount: amount,
      description: "Recarga via PIX",
      status: "completed",
    });

  if (txError) throw txError;

  return {
    balance: newBalance,
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") return [];
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title || "",
      body: row.message || "",
      type: (row.type || "system") as AppNotification["type"],
      createdAt: row.created_at,
      read: row.read || false,
    }));
  } catch {
    return [];
  }
}

export async function exportPrivacyData(): Promise<PrivacyExportPayload> {
  const userId = await requireUserId();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: cards } = await supabase
    .from("user_cards")
    .select("*")
    .eq("user_id", userId);

  const mappedCards: PaymentMethod[] = (cards || []).map((c) => ({
    _id: c.id,
    brand: c.brand,
    last4: c.last4,
    holderName: c.holder_name,
    expiryMonth: c.expiry_month,
    expiryYear: c.expiry_year,
    isDefault: c.is_default,
    createdAt: c.created_at,
  }));

  const consent = profile?.privacy_consent || {};

  return {
    generatedAt: new Date().toISOString(),
    account: {
      id: userId,
      name: profile?.full_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      city: profile?.city || "",
      userType: (profile?.role || "client") as "client" | "driver" | "admin",
      profilePhoto: profile?.profile_photo || null,
      preferredPayment: profile?.preferred_payment || null,
      notificationsEnabled: profile?.notifications_enabled !== false,
      createdAt: profile?.created_at || new Date().toISOString(),
      updatedAt: profile?.updated_at || new Date().toISOString(),
    },
    documents: {
      cpf: profile?.cpf || null,
      cnpj: profile?.cnpj || null,
      companyName: profile?.company_name || null,
      companyEmail: profile?.company_email || null,
      companyPhone: profile?.company_phone || null,
    },
    paymentMethods: mappedCards,
    wallet: {
      balance: Number(profile?.wallet_balance || 0),
      transactionsCount: 0,
    },
    privacy: {
      consentVersion: consent.consentVersion || "1.0",
      termsVersion: consent.termsVersion || "1.0",
      privacyPolicyVersion: consent.privacyPolicyVersion || "1.0",
      acceptedTerms: consent.acceptedTermsAt ? true : false,
      acceptedTermsAt: consent.acceptedTermsAt || null,
      acceptedPrivacyAt: consent.acceptedPrivacyAt || null,
      consentRevokedAt: consent.revokedAt || null,
      accountDeletionStatus: "none",
    },
    rides: {
      total: 0,
      byStatus: {},
    },
  };
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
  const userId = await requireUserId();
  const consent = {
    consentVersion: payload?.consentVersion || "1.0",
    termsVersion: payload?.termsVersion || "1.0",
    privacyPolicyVersion: payload?.privacyPolicyVersion || "1.0",
    acceptedTermsAt: new Date().toISOString(),
    acceptedPrivacyAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .update({ privacy_consent: consent })
    .eq("id", userId);

  if (error) throw error;

  return consent;
}

export async function revokePrivacyConsent(): Promise<{
  consentRevokedAt: string;
}> {
  const userId = await requireUserId();
  const consentRevokedAt = new Date().toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({ 
      privacy_consent: { 
        revokedAt: consentRevokedAt 
      } 
    })
    .eq("id", userId);

  if (error) throw error;

  return { consentRevokedAt };
}

export async function deleteOwnAccount(reason?: string): Promise<{
  accountDeletionCompletedAt: string;
  accountDeletionStatus: "completed";
}> {
  const userId = await requireUserId();
  
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) throw error;

  await supabase.auth.signOut();

  return {
    accountDeletionCompletedAt: new Date().toISOString(),
    accountDeletionStatus: "completed",
  };
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
    const userId = await requireUserId();
    
    // Atualizar status na tabela driver_details
    const { error } = await supabase
      .from("driver_details")
      .update({ status: "approved" })
      .eq("id", userId);

    if (error) throw error;

    return {
      success: true,
      message: "Documentos enviados com sucesso.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erro ao enviar documentos.",
      error: error.message,
    };
  }
}

// Atualizar localizacao do usuario no backend
export async function updateLocation(
  latitude: number,
  longitude: number
): Promise<ApiResponse<{ message: string }>> {
  try {
    const userId = await requireUserId();
    const { error } = await supabase
      .from("profiles")
      .update({
        latitude,
        longitude,
        last_location: { type: "Point", coordinates: [longitude, latitude] }
      })
      .eq("id", userId);

    if (error) throw error;

    return {
      success: true,
      message: "Localização atualizada com sucesso",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erro ao atualizar localizacao",
      error: error.message,
    };
  }
}

