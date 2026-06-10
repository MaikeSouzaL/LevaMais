import { supabase } from "../lib/supabase";

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  city?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, city },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle(idToken: string) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  city?: string;
  role?: "client" | "driver";
  accepted_terms?: boolean;
  tour_seen?: boolean;
  expo_push_token?: string;
  map_theme?: "light" | "dark";
  cpf?: string;
  cnpj?: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  selfie_url?: string;
  kyc_status?: "none" | "pending" | "approved" | "rejected";
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Atualiza o perfil do usuário autenticado, obtendo o id direto da sessão
 * validada no servidor (auth.getUser). Garante que o id sempre coincide com
 * auth.uid() — evita UPDATE com 0 linhas por RLS quando o _id passado por
 * parâmetro está dessincronizado da sessão.
 */
export async function updateMyProfile(updates: ProfileUpdate) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return updateProfile(user.id, updates);
}

export async function createDriverDetails(userId: string) {
  const { data, error } = await supabase
    .from("driver_details")
    .insert({ id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// KYC do cliente (Fase 3) — CPF/CNPJ + selfie no Supabase Storage
// Auto-aprovação: status "approved" quando há documento (CPF/CNPJ) E selfie.
// ─────────────────────────────────────────────────────────────────────────────

/** Decodifica base64 → Uint8Array sem depender de libs nativas (Expo image-picker retorna base64). */
function base64ToUint8Array(base64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (i + 2 < clean.length) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (i + 3 < clean.length) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes.subarray(0, p);
}

export async function requireUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Sessão expirada. Faça login novamente.");
  return user.id;
}

/** Recalcula o status de KYC com base nos dados atuais do perfil e persiste. */
async function recomputeKycStatus(userId: string): Promise<"none" | "pending" | "approved"> {
  const { data } = await supabase
    .from("profiles")
    .select("cpf, cnpj, selfie_url")
    .eq("id", userId)
    .single();
  const hasDoc = Boolean(data?.cpf || data?.cnpj);
  const hasSelfie = Boolean(data?.selfie_url);
  const status: "none" | "pending" | "approved" =
    hasDoc && hasSelfie ? "approved" : hasDoc || hasSelfie ? "pending" : "none";
  await supabase.from("profiles").update({ kyc_status: status }).eq("id", userId);
  return status;
}

/** Salva dados cadastrais (PF/PJ) e recalcula o status de KYC. */
export async function saveClientKyc(payload: {
  cpf?: string;
  cnpj?: string;
  full_name?: string;
  city?: string;
  phone?: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
}) {
  const userId = await requireUserId();
  await updateProfile(userId, payload);
  const kyc_status = await recomputeKycStatus(userId);
  return { ...payload, kyc_status };
}

/** Faz upload da selfie (base64) para o bucket `kyc`, salva o caminho e recalcula o status. */
export async function uploadClientSelfie(base64: string): Promise<{ path: string; kyc_status: string }> {
  const userId = await requireUserId();
  const bytes = base64ToUint8Array(base64);
  const path = `${userId}/selfie.jpg`;
  const { error } = await supabase.storage
    .from("kyc")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  await updateProfile(userId, { selfie_url: path });
  const kyc_status = await recomputeKycStatus(userId);
  return { path, kyc_status };
}

/** Gera URL assinada (1h) para exibir a selfie de um caminho do bucket privado `kyc`. */
export async function getKycSelfieUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("kyc").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// KYC do motorista (Fase 3) — CNH/selfie/antecedentes + veículo/CRLV no driver_details
// Documentos no mesmo bucket privado `kyc` em {uid}/{kind}.jpg. Auto-aprovação.
// ─────────────────────────────────────────────────────────────────────────────

export type DriverDocKind =
  | "cnh_front"
  | "cnh_back"
  | "selfie"
  | "criminal_record"
  | "cpf_photo"
  | "profile_photo"
  | "crlv_front"
  | "crlv_back"
  | "vehicle_photo";

/** Garante que existe a linha em driver_details para o usuário atual. */
export async function ensureDriverDetails(): Promise<void> {
  const userId = await requireUserId();
  await supabase.from("driver_details").upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
}

/** Lê o driver_details do usuário autenticado. */
export async function getMyDriverDetails() {
  const userId = await requireUserId();
  const { data } = await supabase.from("driver_details").select("*").eq("id", userId).maybeSingle();
  return data;
}

/** Auto-aprovação do motorista: aprovado quando CNH (frente+verso) + selfie + veículo (placa + CRLV frente). */
async function recomputeDriverStatus(userId: string): Promise<"none" | "pending" | "approved"> {
  const { data } = await supabase
    .from("driver_details")
    .select("cnh_front_url, cnh_back_url, selfie_url, vehicle_plate, crlv_front_url")
    .eq("id", userId)
    .maybeSingle();

  const hasPersonalDocs = Boolean(data?.cnh_front_url && data?.cnh_back_url && data?.selfie_url);
  const hasVehicle = Boolean(data?.vehicle_plate && data?.crlv_front_url);
  const anything = Boolean(
    data?.cnh_front_url || data?.cnh_back_url || data?.selfie_url || data?.vehicle_plate || data?.crlv_front_url,
  );

  const status: "none" | "pending" | "approved" =
    hasPersonalDocs && hasVehicle ? "approved" : anything ? "pending" : "none";

  await supabase.from("driver_details").update({ status }).eq("id", userId);
  return status;
}

/** Faz upload de um documento do motorista (base64) e atualiza a coluna correspondente. */
export async function uploadDriverDocument(
  kind: DriverDocKind,
  base64: string,
): Promise<{ path: string; status: string }> {
  const userId = await requireUserId();
  await ensureDriverDetails();
  const bytes = base64ToUint8Array(base64);
  const path = `${userId}/${kind}.jpg`;
  const { error } = await supabase.storage
    .from("kyc")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (error) throw error;
  await supabase
    .from("driver_details")
    .update({ [`${kind}_url`]: path })
    .eq("id", userId);
  const status = await recomputeDriverStatus(userId);
  return { path, status };
}

/** Salva os dados do veículo no driver_details e recalcula o status. */
export async function saveDriverVehicle(payload: {
  vehicle_type?: "motorcycle" | "car" | "van" | "truck";
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_year?: number;
}): Promise<{ status: string }> {
  const userId = await requireUserId();
  await ensureDriverDetails();
  await supabase.from("driver_details").update(payload).eq("id", userId);
  const status = await recomputeDriverStatus(userId);
  return { status };
}
