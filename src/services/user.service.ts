import { Platform } from "react-native";
import api, { apiPatch } from "./api";

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
  };
  driverStatus?: "pending" | "approved" | "rejected";
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
  };
  acceptedTerms?: boolean;
  paymentMethods?: Array<any>;
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
  const res = await api.get<GetProfileResponse>("/auth/profile");
  return res.data.data.user;
}

async function updateProfile(payload: UpdateProfilePayload, token?: string): Promise<UserProfile> {
  if (token) {
    const res = await apiPatch<GetProfileResponse>("/auth/profile", payload, token);
    return res.data.data.user;
  }
  const res = await api.patch<GetProfileResponse>("/auth/profile", payload);
  return res.data.data.user;
}

async function uploadProfilePhoto(imageUri: string): Promise<string> {
  const formData = new FormData();
  
  const filename = imageUri.split("/").pop() || `profile-${Date.now()}.jpg`;
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";
  
  const normalizedUri = Platform.OS === "ios" ? imageUri.replace("file://", "") : imageUri;

  formData.append("photo", {
    uri: normalizedUri,
    name: filename,
    type: mimeType,
  } as any);

  const res = await api.post<GetProfileResponse>("/auth/profile-photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  
  return res.data.data.user.profilePhoto || "";
}

export default { getProfile, updateProfile, uploadProfilePhoto };
