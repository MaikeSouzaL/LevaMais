import { databases, APPWRITE_DB_ID, APPWRITE_COLLECTIONS, APPWRITE_ENDPOINT, APPWRITE_BUCKETS, APPWRITE_PROJECT_ID } from "../lib/appwrite";
import { Query, Models } from "appwrite";

interface ProfileDoc extends Models.Document {
  full_name?: string;
  email?: string;
  phone?: string;
  cpf?: string;
  is_active?: boolean;
  city?: string;
  kyc_status?: string;
  selfie_url?: string;
}

interface DriverDetailsDoc extends Models.Document {
  cnh_front_url?: string;
  cnh_back_url?: string;
  crlv_front_url?: string;
  crlv_back_url?: string;
  selfie_url?: string;
  vehicle_photo_url?: string;
  rejection_reason?: string;
  status?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_year?: number;
}

function getFileUrl(fileId: string | null | undefined) {
  if (!fileId) return "";
  if (fileId.startsWith("http")) return fileId;
  return `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKETS.KYC}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

export const verificationAdminService = {
  async listUsers(userType: "driver" | "client") {
    try {
      const { documents: profiles } = await databases.listDocuments(
        APPWRITE_DB_ID,
        APPWRITE_COLLECTIONS.PROFILES,
        [Query.equal("role", userType), Query.limit(100)]
      );

      if (userType === "client") {
        return profiles.map((row: ProfileDoc) => {
          return {
            _id: row.$id,
            name: row.full_name || "",
            email: row.email || "",
            phone: row.phone || "",
            cpf: row.cpf || undefined,
            userType: "client",
            isActive: row.is_active !== false,
            createdAt: row.$createdAt,
            city: row.city || undefined,
            clientVerification: {
              status: row.kyc_status || "none",
              cpfStatus: row.kyc_status === "approved" ? "approved" : "pending",
              selfieStatus: row.kyc_status === "approved" ? "approved" : "pending",
              documents: {
                selfie: getFileUrl(row.selfie_url),
              },
              rejectionReason: "",
            },
          };
        });
      } else {
        // Fetch all drivers details
        const { documents: driversDetails } = await databases.listDocuments(
          APPWRITE_DB_ID,
          APPWRITE_COLLECTIONS.DRIVERS,
          [Query.limit(100)]
        );

        const detailsMap: Record<string, DriverDetailsDoc> = {};
        driversDetails.forEach(d => {
          detailsMap[d.$id] = d;
        });

        return profiles.map((row: ProfileDoc) => {
          const details = detailsMap[row.$id] || null;
          
          const driverDocs = details ? {
            cnhFront: getFileUrl(details.cnh_front_url),
            cnhBack: getFileUrl(details.cnh_back_url),
            crlvFront: getFileUrl(details.crlv_front_url),
            crlvBack: getFileUrl(details.crlv_back_url),
            selfie: getFileUrl(details.selfie_url),
            vehiclePhoto: getFileUrl(details.vehicle_photo_url),
            rejectionReason: details.rejection_reason || "",
            cnhFrontStatus: details.status === "approved" ? "approved" : (details.status === "rejected" ? "rejected" : "pending"),
            cnhBackStatus: details.status === "approved" ? "approved" : (details.status === "rejected" ? "rejected" : "pending"),
            selfieStatus: details.status === "approved" ? "approved" : "pending",
            cpfStatus: details.status === "approved" ? "approved" : "pending",
            bankAccountStatus: details.status === "approved" ? "approved" : "pending",
            faceMatchStatus: details.status === "approved" ? "approved" : "pending",
            backgroundCheckStatus: details.status === "approved" ? "approved" : "pending",
            vehiclePhotoStatus: details.status === "approved" ? "approved" : (details.status === "rejected" ? "rejected" : "pending"),
            crlvFrontStatus: details.status === "approved" ? "approved" : (details.status === "rejected" ? "rejected" : "pending"),
            crlvBackStatus: details.status === "approved" ? "approved" : (details.status === "rejected" ? "rejected" : "pending"),
            reviewedAt: details.reviewed_at,
            reviewedBy: details.reviewed_by,
          } : undefined;

          return {
            _id: row.$id,
            name: row.full_name || "",
            email: row.email || "",
            phone: row.phone || "",
            cpf: row.cpf || undefined,
            userType: "driver",
            isActive: row.is_active !== false,
            createdAt: row.$createdAt,
            city: row.city || undefined,
            driverStatus: details?.status || "none",
            driverDocuments: driverDocs,
            vehicles: details ? [
              {
                _id: details.$id,
                type: details.vehicle_type || "car",
                plate: details.vehicle_plate || "",
                model: details.vehicle_model || "",
                color: details.vehicle_color || "",
                year: details.vehicle_year || 0,
                status: details.status === "approved" ? "approved" : (details.status === "rejected" ? "rejected" : "pending"),
                documents: {
                  crlvFront: getFileUrl(details.crlv_front_url),
                  crlvBack: getFileUrl(details.crlv_back_url),
                  vehiclePhoto: getFileUrl(details.vehicle_photo_url),
                },
                createdAt: details.$createdAt,
                updatedAt: details.$updatedAt,
              }
            ] : [],
          };
        });
      }
    } catch (error) {
      console.error("Error listing users for verification:", error);
      return [];
    }
  },

  async approveUser(userId: string, userType: "driver" | "client") {
    if (userType === "driver") {
      await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_COLLECTIONS.PROFILES, userId, {
        is_active: true
      });
      await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_COLLECTIONS.DRIVERS, userId, {
        status: "approved",
        rejection_reason: null,
        reviewed_at: new Date().toISOString()
      });
    } else {
      await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_COLLECTIONS.PROFILES, userId, {
        is_active: true,
        kyc_status: "approved"
      });
    }
  },

  async rejectUser(userId: string, userType: "driver" | "client", reason: string) {
    if (userType === "driver") {
      await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_COLLECTIONS.PROFILES, userId, {
        is_active: false
      });
      await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_COLLECTIONS.DRIVERS, userId, {
        status: "rejected",
        rejection_reason: reason,
        reviewed_at: new Date().toISOString()
      });
    } else {
      await databases.updateDocument(APPWRITE_DB_ID, APPWRITE_COLLECTIONS.PROFILES, userId, {
        is_active: false,
        kyc_status: "rejected"
      });
    }
  },

  async updateDriverVerification(
    userId: string,
    field: string,
    status: string,
    reason?: string,
    riskFlags?: string[]
  ) {
    const updates: Record<string, unknown> = {};
    if (field === "driverStatus" || field === "status") {
      updates.status = status;
      if (reason) updates.rejection_reason = reason;
      updates.reviewed_at = new Date().toISOString();
    } else {
      if (status === "rejected") {
        updates.status = "rejected";
        if (reason) updates.rejection_reason = reason;
      }
    }

    const updated = await databases.updateDocument(
      APPWRITE_DB_ID,
      APPWRITE_COLLECTIONS.DRIVERS,
      userId,
      updates
    );
    return updated;
  },
};
