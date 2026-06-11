import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";

export type UserProfile = {
  _id: string;
  name: string;
  nome?: string;
  email: string;
  phone?: string;
  telefone?: string;
  city?: string;
  cidade?: string;
  cpf?: string;
  cnpj?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  userType?: "client" | "driver" | "admin";
  profilePhoto?: string;
  preferredPayment?: "pix" | "cash" | "card";
  notificationsEnabled?: boolean;
  enableMapAnimation?: boolean;
  mapTheme?: "light" | "dark";
  queueRedispatchInterval?: number | null;
  vehicleType?: "motorcycle" | "car" | "van" | "truck";
  vehicleInfo?: {
    plate?: string;
    model?: string;
    color?: string;
    year?: number;
  };
  gpsQuality?: "low" | "balanced" | "high";
  driverPreferences?: {
    serviceTypes?: Array<"ride" | "delivery">;
    selectedVehicles?: Array<"motorcycle" | "car" | "van" | "truck">;
    searchRadiusKm?: number;
    autoAccept?: boolean;
    acceptsCardMachine?: boolean;
    acceptsCash?: boolean;
    acceptsPix?: boolean;
  };
  driverStatus?: "none" | "pending" | "approved" | "rejected" | "blocked" | "suspended";
  tourSeen?: boolean;
  driverDocuments?: {
    cnhFront?: string;
    cnhBack?: string;
    crlvFront?: string;
    crlvBack?: string;
    vehiclePhoto?: string;
    selfie?: string;
    submittedAt?: string;
    rejectionReason?: string;
    faceMatchStatus?: "none" | "pending" | "approved" | "rejected";
    faceMatchConfidence?: number;
    backgroundCheckStatus?: "none" | "pending" | "approved" | "rejected";
    riskFlags?: string[];
  };
  clientVerification?: {
    status?: "none" | "pending" | "approved" | "rejected";
    cpfStatus?: "unchecked" | "valid" | "invalid" | "manual_review";
    selfieStatus?: "none" | "pending" | "approved" | "rejected";
    documents?: {
      selfie?: string;
      rgFront?: string;
      rgBack?: string;
    };
    rejectionReason?: string;
    submittedAt?: string;
  };
  acceptedTerms?: boolean;
  paymentMethods?: Array<any>;
  wallet?: {
    balance: number;
    transactions: Array<any>;
  };
};

export type GetProfileResponse = { success: boolean; data: { user: UserProfile } };

export type UpdateProfilePayload = Partial<
  Pick<
    UserProfile,
    | "name"
    | "phone"
    | "city"
    | "userType"
    | "profilePhoto"
    | "preferredPayment"
    | "notificationsEnabled"
    | "enableMapAnimation"
    | "mapTheme"
    | "gpsQuality"
    | "queueRedispatchInterval"
    | "vehicleType"
    | "vehicleInfo"
    | "acceptedTerms"
    | "cpf"
    | "cnpj"
    | "companyName"
    | "companyEmail"
    | "companyPhone"
    | "driverPreferences"
    | "tourSeen"
  >
>;

async function getProfile(): Promise<UserProfile> {
  const userId = await requireUserId();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) throw new Error("Perfil não encontrado");

  const { data: driver } = await supabase
    .from("driver_details")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return {
    _id: profile.id,
    name: profile.full_name || "",
    nome: profile.full_name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    telefone: profile.phone || "",
    city: profile.city || "",
    cidade: profile.city || "",
    cpf: profile.cpf || "",
    userType: (profile.role || "client") as "client" | "driver" | "admin",
    profilePhoto: profile.avatar_url || "",
    mapTheme: (profile.map_theme || "light") as "light" | "dark",
    tourSeen: profile.tour_seen || false,
    acceptedTerms: profile.accepted_terms || false,
    wallet: {
      balance: profile.wallet_balance || 0,
      transactions: [],
    },
    vehicleType: driver?.vehicle_type || undefined,
    vehicleInfo: driver ? {
      plate: driver.vehicle_plate || undefined,
      model: driver.vehicle_model || undefined,
      color: driver.vehicle_color || undefined,
      year: driver.vehicle_year || undefined,
    } : undefined,
    driverPreferences: driver ? {
      serviceTypes: (driver.service_types || []) as any,
      searchRadiusKm: driver.search_radius_km || 5,
      autoAccept: driver.auto_accept || false,
      acceptsCardMachine: driver.accepts_card || false,
      acceptsCash: driver.accepts_cash !== false,
      acceptsPix: driver.accepts_pix || false,
    } : undefined,
    driverStatus: driver?.status || "none",
  };
}

async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const userId = await requireUserId();
  
  const profileUpdates: any = {};
  if (payload.name !== undefined) profileUpdates.full_name = payload.name;
  if (payload.phone !== undefined) profileUpdates.phone = payload.phone;
  if (payload.city !== undefined) profileUpdates.city = payload.city;
  if (payload.mapTheme !== undefined) profileUpdates.map_theme = payload.mapTheme;
  if (payload.tourSeen !== undefined) profileUpdates.tour_seen = payload.tourSeen;
  if (payload.acceptedTerms !== undefined) profileUpdates.accepted_terms = payload.acceptedTerms;
  if (payload.cpf !== undefined) profileUpdates.cpf = payload.cpf;
  if (payload.profilePhoto !== undefined) profileUpdates.avatar_url = payload.profilePhoto;
  if (payload.userType !== undefined) profileUpdates.role = payload.userType;

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(profileUpdates)
      .eq("id", userId);
    if (error) throw error;
  }

  const driverUpdates: any = {};
  if (payload.vehicleType !== undefined) driverUpdates.vehicle_type = payload.vehicleType;
  if (payload.vehicleInfo !== undefined) {
    if (payload.vehicleInfo.plate !== undefined) driverUpdates.vehicle_plate = payload.vehicleInfo.plate;
    if (payload.vehicleInfo.model !== undefined) driverUpdates.vehicle_model = payload.vehicleInfo.model;
    if (payload.vehicleInfo.color !== undefined) driverUpdates.vehicle_color = payload.vehicleInfo.color;
    if (payload.vehicleInfo.year !== undefined) driverUpdates.vehicle_year = payload.vehicleInfo.year;
  }
  if (payload.driverPreferences !== undefined) {
    if (payload.driverPreferences.serviceTypes !== undefined) driverUpdates.service_types = payload.driverPreferences.serviceTypes;
    if (payload.driverPreferences.searchRadiusKm !== undefined) driverUpdates.search_radius_km = payload.driverPreferences.searchRadiusKm;
    if (payload.driverPreferences.autoAccept !== undefined) driverUpdates.auto_accept = payload.driverPreferences.autoAccept;
    if ((payload.driverPreferences as any).acceptsCardMachine !== undefined) driverUpdates.accepts_card = (payload.driverPreferences as any).acceptsCardMachine;
    if ((payload.driverPreferences as any).acceptsCash !== undefined) driverUpdates.accepts_cash = (payload.driverPreferences as any).acceptsCash;
    if ((payload.driverPreferences as any).acceptsPix !== undefined) driverUpdates.accepts_pix = (payload.driverPreferences as any).acceptsPix;
  }

  if (Object.keys(driverUpdates).length > 0) {
    await supabase.from("driver_details").upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
    const { error } = await supabase
      .from("driver_details")
      .update(driverUpdates)
      .eq("id", userId);
    if (error) throw error;
  }

  return getProfile();
}

async function uploadProfilePhoto(imageUri: string): Promise<string> {
  const userId = await requireUserId();
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("kyc")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (error) throw error;
  
  const { data } = supabase.storage.from("kyc").getPublicUrl(path);
  const publicUrl = data?.publicUrl || "";
  
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);

  if (updateError) throw updateError;
  
  return publicUrl;
}

export default { getProfile, updateProfile, uploadProfilePhoto };
