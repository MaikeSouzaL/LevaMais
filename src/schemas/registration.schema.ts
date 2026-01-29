import { z } from "zod";

// Schema para Step 1 - Dados pessoais (base sem validações condicionais)
const step1DataBaseSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  phone: z
    .string()
    .min(10, "Telefone deve ter no mínimo 10 caracteres")
    .refine(
      (val) => {
        const cleaned = val.replace(/\D/g, "");
        return cleaned.length >= 10 && cleaned.length <= 11;
      },
      { message: "Telefone inválido" },
    ),
  documentType: z.enum(["cpf", "cnpj"]),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  companyName: z.string().optional(),
  companyEmail: z.string().optional(),
  companyPhone: z.string().optional(),
});

// Schema com validações condicionais usando refine
export const step1DataSchema = step1DataBaseSchema
  .refine(
    (data) => {
      if (data.documentType === "cpf") {
        if (!data.cpf || data.cpf.trim() === "") {
          return false;
        }
        const cleaned = data.cpf.replace(/\D/g, "");
        return cleaned.length === 11;
      }
      return true;
    },
    {
      message: "CPF é obrigatório e deve ter 11 dígitos",
      path: ["cpf"],
    },
  )
  .refine(
    (data) => {
      if (data.documentType === "cnpj") {
        if (!data.cnpj || data.cnpj.trim() === "") {
          return false;
        }
        const cleaned = data.cnpj.replace(/\D/g, "");
        return cleaned.length === 14;
      }
      return true;
    },
    {
      message: "CNPJ é obrigatório e deve ter 14 dígitos",
      path: ["cnpj"],
    },
  )
  .refine(
    (data) => {
      if (data.documentType === "cnpj") {
        return data.companyName && data.companyName.trim() !== "";
      }
      return true;
    },
    {
      message: "Nome da empresa é obrigatório quando usar CNPJ",
      path: ["companyName"],
    },
  );

// Schema para Step 2 - Endereço (apenas coordenadas são obrigatórias)
export const step2AddressSchema = z.object({
  address: z.object({
    latitude: z.number({
      required_error: "Latitude é obrigatória",
      invalid_type_error: "Latitude deve ser um número",
    }),
    longitude: z.number({
      required_error: "Longitude é obrigatória",
      invalid_type_error: "Longitude deve ser um número",
    }),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    referencePoint: z.string().optional(),
  }),
});

// Schema para Step 3 - Preferências
export const step3PreferencesSchema = z.object({
  preferredPayment: z.enum(["pix", "cash", "card"]).optional(),
  notificationsEnabled: z.boolean().optional().default(true),
});

// Schema completo de registro (combinando todos os steps)
// Usar o schema base para poder fazer merge, depois aplicar os refinements
export const completeRegistrationSchema = step1DataBaseSchema
  .merge(step2AddressSchema)
  .merge(step3PreferencesSchema)
  .extend({
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    userType: z.enum(["client", "driver"]),
    acceptedTerms: z.boolean(),
    // Driver
    vehicleType: z.enum(["motorcycle", "car", "van", "truck"]).optional(),
    vehicleInfo: z
      .object({
        plate: z.string().optional(),
        model: z.string().optional(),
        color: z.string().optional(),
        year: z.number().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.documentType === "cpf") {
        if (!data.cpf || data.cpf.trim() === "") {
          return false;
        }
        const cleaned = data.cpf.replace(/\D/g, "");
        return cleaned.length === 11;
      }
      return true;
    },
    {
      message: "CPF é obrigatório e deve ter 11 dígitos",
      path: ["cpf"],
    },
  )
  .refine(
    (data) => {
      if (data.userType === "driver") {
        return !!data.vehicleType;
      }
      return true;
    },
    {
      message: "Selecione o tipo de veículo",
      path: ["vehicleType"],
    },
  )
  .refine(
    (data) => {
      if (data.documentType === "cnpj") {
        if (!data.cnpj || data.cnpj.trim() === "") {
          return false;
        }
        const cleaned = data.cnpj.replace(/\D/g, "");
        return cleaned.length === 14;
      }
      return true;
    },
    {
      message: "CNPJ é obrigatório e deve ter 14 dígitos",
      path: ["cnpj"],
    },
  )
  .refine(
    (data) => {
      if (data.documentType === "cnpj") {
        return data.companyName && data.companyName.trim() !== "";
      }
      return true;
    },
    {
      message: "Nome da empresa é obrigatório quando usar CNPJ",
      path: ["companyName"],
    },
  );

// Tipos inferidos
export type Step1DataInput = z.infer<typeof step1DataSchema>;
export type Step2AddressInput = z.infer<typeof step2AddressSchema>;
export type Step3PreferencesInput = z.infer<typeof step3PreferencesSchema>;
export type CompleteRegistrationInput = z.infer<
  typeof completeRegistrationSchema
>;
