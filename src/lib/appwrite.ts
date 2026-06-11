import { Client, Account, Databases, Storage, Functions } from 'react-native-appwrite';

export const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '6a2b26a4003de85077f7';

export const APPWRITE_DB_ID = 'leva_mais_db';
export const APPWRITE_COLLECTIONS = {
  PROFILES: 'profiles',
  DRIVERS: 'drivers',
  COMPANIES: 'companies',
  VERIFICATIONS: 'verifications',
};

export const APPWRITE_BUCKETS = {
  KYC: 'kyc_bucket',
};

// Initialize Appwrite SDK
const client = new Client();

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setPlatform('com.levamais.app'); // We set a default package name, might need adjustment

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client };
