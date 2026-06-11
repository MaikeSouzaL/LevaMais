import { account, databases, storage, APPWRITE_DB_ID, APPWRITE_COLLECTIONS, APPWRITE_BUCKETS, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "../lib/appwrite";
import { ID, OAuthProvider } from "react-native-appwrite";

/**
 * 🔐 Login with Email and Password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    // Appwrite uses createEmailPasswordSession
    const session = await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    return { session, user };
  } catch (error) {
    throw error;
  }
}

/**
 * 📝 Register with Email and Password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
) {
  try {
    // 1. Create the Auth user
    const user = await account.create(ID.unique(), email, password, fullName);

    // 2. Immediately create the session so we are logged in
    const session = await account.createEmailPasswordSession(email, password);

    // 3. Create the basic Profile in the Database
    await databases.createDocument(
      APPWRITE_DB_ID,
      APPWRITE_COLLECTIONS.PROFILES,
      user.$id, // Document ID matches User ID
      {
        user_id: user.$id,
        phone: phone || null,
        accepted_terms: false,
      }
    );

    return { user, session };
  } catch (error) {
    throw error;
  }
}

/**
 * 🌍 Google OAuth Sign In
 * Appwrite has built-in OAuth support, we can use createOAuth2Session
 * However, since React Native uses GoogleSignin native module, 
 * we might need to pass the token to Appwrite or use createOAuth2Token.
 * React Native Appwrite SDK `account.createOAuth2Session()` opens a browser.
 * If you prefer native GoogleSignin, you can create a custom token in Appwrite functions,
 * but Appwrite supports `createOAuth2Token(Provider.Google, ...)` natively if set up correctly.
 */
export async function signInWithGoogle(idToken: string): Promise<any> {
  throw new Error("Native Google Sign In requires an Appwrite function for token exchange. Use createOAuth2Session instead.");
}

export async function signOut() {
  try {
    await account.deleteSession("current");
  } catch (error) {
    throw error;
  }
}

export async function requireUserId(): Promise<string> {
  const user = await account.get();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");
  return user.$id;
}

export async function getSession() {
  try {
    const session = await account.getSession("current");
    return session;
  } catch (error) {
    // No active session
    return null;
  }
}

export async function getProfile(userId: string) {
  try {
    const profile = await databases.getDocument(
      APPWRITE_DB_ID,
      APPWRITE_COLLECTIONS.PROFILES,
      userId
    );
    return profile;
  } catch (error) {
    // Document not found means they don't have a profile yet
    return null;
  }
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  city?: string;
  role?: "client" | "driver" | "admin";
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
  avatar?: string;
}

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const data = await databases.updateDocument(
    APPWRITE_DB_ID,
    APPWRITE_COLLECTIONS.PROFILES,
    userId,
    updates
  );
  return data;
}

export async function updateMyProfile(updates: ProfileUpdate) {
  const user = await account.get();
  return updateProfile(user.$id, updates);
}

export async function createDriverDetails(userId: string) {
  const data = await databases.createDocument(
    APPWRITE_DB_ID,
    APPWRITE_COLLECTIONS.DRIVERS,
    userId, // documentId matches userId
    {
      user_id: userId,
      status: "pending"
    }
  );
  return data;
}

/**
 * --------------------------------------------------------------------------
 * CLIENT KYC & DOCUMENTS
 * --------------------------------------------------------------------------
 */

export async function saveClientKyc(payload: any) {
  const user = await account.get();
  
  // Create or update the Verifications document
  await databases.createDocument(
    APPWRITE_DB_ID,
    APPWRITE_COLLECTIONS.VERIFICATIONS,
    user.$id, // Using the same ID
    {
      user_id: user.$id,
      document_type: payload.cnpj ? "CNPJ" : "CPF",
      document_number: payload.cnpj || payload.cpf,
      status: "pending"
    }
  ).catch(async () => {
    // If it already exists, update it
    await databases.updateDocument(
      APPWRITE_DB_ID,
      APPWRITE_COLLECTIONS.VERIFICATIONS,
      user.$id,
      {
        document_type: payload.cnpj ? "CNPJ" : "CPF",
        document_number: payload.cnpj || payload.cpf,
        status: "pending"
      }
    );
  });

  // Also update Profile
  const profileUpdates: any = {
    cpf: payload.cpf || "",
    city: payload.city || "",
    phone: payload.phone || "",
    kyc_status: "pending"
  };

  if (payload.cnpj) {
    profileUpdates.cnpj = payload.cnpj;
    profileUpdates.company_name = payload.company_name;
    profileUpdates.company_email = payload.company_email;
    profileUpdates.company_phone = payload.company_phone;
  }

  await updateMyProfile(profileUpdates);
  return { kyc_status: "pending" };
}

export async function uploadClientSelfie(uri: string) {
  const user = await account.get();

  const file = {
    name: `selfie_${user.$id}.jpg`,
    type: 'image/jpeg',
    uri: uri,
  };

  const uploadResult = await storage.createFile(
    APPWRITE_BUCKETS.KYC,
    ID.unique(),
    file as any
  );

  await updateMyProfile({ kyc_status: "approved", selfie_url: uploadResult.$id } as any);
  
  return { kyc_status: "approved" };
}

export async function getKycSelfieUrl(path: string | null) {
  if (!path) return null;
  
  // Construct the URL manually to prevent TypeScript/SDK type errors (since getFileView in some React Native SDK versions fetches the file buffer instead of returning the URL)
  try {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKETS.KYC}/files/${path}/view?project=${APPWRITE_PROJECT_ID}`;
  } catch (error) {
    return null;
  }
}

/**
 * --------------------------------------------------------------------------
 * DRIVER VEHICLE & DOCUMENTS
 * --------------------------------------------------------------------------
 */

export async function getMyDriverDetails() {
  try {
    const user = await account.get();
    const details = await databases.getDocument(
      APPWRITE_DB_ID,
      APPWRITE_COLLECTIONS.DRIVERS,
      user.$id
    );
    return details;
  } catch (e) {
    return null;
  }
}

export async function saveDriverVehicle(payload: {
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_color?: string;
  vehicle_year?: number;
}) {
  const user = await account.get();
  const data = await databases.updateDocument(
    APPWRITE_DB_ID,
    APPWRITE_COLLECTIONS.DRIVERS,
    user.$id,
    {
      ...payload,
      status: "pending"
    }
  );
  return data;
}

export async function uploadDriverDocument(docName: string, uri: string) {
  const user = await account.get();
  
  const file = {
    name: `${docName}_${user.$id}.jpg`,
    type: 'image/jpeg',
    uri: uri,
  };

  const uploadResult = await storage.createFile(
    APPWRITE_BUCKETS.KYC,
    ID.unique(),
    file as any
  );

  // Update driver details with the file ID
  const updates: any = {};
  updates[`${docName}_url`] = uploadResult.$id;
  updates.status = "pending"; // Changing document puts status to pending for review

  await databases.updateDocument(
    APPWRITE_DB_ID,
    APPWRITE_COLLECTIONS.DRIVERS,
    user.$id,
    updates
  );

  return { status: "pending" };
}
