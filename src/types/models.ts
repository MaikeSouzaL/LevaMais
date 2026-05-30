/**
 * Canonical domain model types for the Leva+ app.
 * These are the single source of truth for core entity shapes.
 */

export type UserType = 'client' | 'driver' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  avatar?: string;
  rating?: number;

  // Auth / onboarding
  googleId?: string;
  profilePhoto?: string;
  acceptedTerms: boolean;
  tourSeen?: boolean;
  isActive?: boolean;
  expoPushToken?: string;

  // Driver-specific fields
  userType?: UserType;
  driverStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  vehicleType?: 'motorcycle' | 'car' | 'van' | 'truck';
  vehicleInfo?: {
    plate?: string;
    model?: string;
    color?: string;
    year?: number;
  };
  enableMapAnimation?: boolean;
  driverPreferences?: {
    serviceTypes?: Array<'ride' | 'delivery'>;
    selectedVehicles?: Array<'motorcycle' | 'car' | 'van' | 'truck'>;
    searchRadiusKm?: number;
    autoAccept?: boolean;
  };

  // CPF/CNPJ & Company details
  cpf?: string;
  cnpj?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;

  // Payment & verification
  paymentMethods?: Array<any>;
  clientVerification?: {
    status?: 'none' | 'pending' | 'approved' | 'rejected';
    cpfStatus?: string;
    selfieStatus?: string;
    documents?: {
      selfie?: string;
      rgFront?: string;
      rgBack?: string;
    };
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
  } | null;

  // Visual preference
  mapTheme?: 'light' | 'dark' | string;
}
