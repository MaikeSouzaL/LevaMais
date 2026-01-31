export interface RegistrationData {
  // Dados pessoais
  name: string;
  email: string;
  phone: string;
  documentType: String; 
  cpf?: string;
  cnpj?: string;
  // Campos da empresa (se CNPJ)
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  // Endereço
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    zipCode: string;
    referencePoint?: string;
    latitude?: number;
    longitude?: number;
  };
  // Driver (quando userType === "driver")
  vehicleType?: "motorcycle" | "car" | "van" | "truck";
  vehicleInfo?: {
    plate?: string;
    model?: string;
    color?: string;
    year?: number;
  };

  driverLocation?: {
    region?: string;
    state?: string;
    city?: string;
  };

  // Preferências
  preferredPayment?: "pix" | "cash" | "card";
  notificationsEnabled?: boolean;

  // Outros
  userType: string
  password: string;
  acceptedTerms: boolean;
  city?: string;
  googleId?: string;
  profilePhoto?: string;
}
