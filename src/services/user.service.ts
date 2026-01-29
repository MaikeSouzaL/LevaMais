import api from "./api";

export type UserProfile = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  userType?: "client" | "driver" | "admin";
  profilePhoto?: string;
  preferredPayment?: "pix" | "cash" | "card";
  notificationsEnabled?: boolean;
  vehicleType?: "motorcycle" | "car" | "van" | "truck";
  vehicleInfo?: {
    plate?: string;
    model?: string;
    color?: string;
    year?: number;
  };
};

export type GetProfileResponse = { success: boolean; data: { user: UserProfile } };

export type UpdateProfilePayload = Partial<
  Pick<
    UserProfile,
    | "name"
    | "phone"
    | "city"
    | "profilePhoto"
    | "preferredPayment"
    | "notificationsEnabled"
    | "vehicleType"
    | "vehicleInfo"
  >
>;

async function getProfile(): Promise<UserProfile> {
  const res = await api.get<GetProfileResponse>("/auth/profile");
  return res.data.data.user;
}

async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const res = await api.patch<GetProfileResponse>("/auth/profile", payload);
  return res.data.data.user;
}

export default { getProfile, updateProfile };
