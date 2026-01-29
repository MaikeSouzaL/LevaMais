export interface RegistrationData {
  // Dados pessoais
  name: string;
  email: string;
  phone: string;
  documentType: "cpf" | "cnpj";
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

  // Preferências
  preferredPayment?: "pix" | "cash" | "card";
  notificationsEnabled?: boolean;

  // Outros
  userType: "client" | "driver";
  password: string;
  acceptedTerms: boolean;
  city?: string; // Cidade do usuário (pode vir dos dados anteriores)
}
