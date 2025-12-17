import { z } from "zod";

// Schema para cadastro de usuário
export const registerUserSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(50, "Senha deve ter no máximo 50 caracteres"),
  phone: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      return val;
    })
    .refine(
      (val) => {
        if (!val) return true; // Opcional, então undefined é válido
        return val.length >= 10;
      },
      {
        message: "Telefone deve ter no mínimo 10 caracteres",
      }
    ),
  city: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      return val;
    })
    .refine(
      (val) => {
        if (!val) return true; // Opcional, então undefined é válido
        return val.length <= 100;
      },
      {
        message: "Cidade deve ter no máximo 100 caracteres",
      }
    ),
  userType: z
    .enum(["client", "driver", "admin"], {
      errorMap: () => ({ message: "Tipo de usuário inválido" }),
    })
    .optional()
    .default("client"),
  acceptedTerms: z.boolean().optional().default(false),
  // Documentos (opcionais)
  cpf: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : undefined)),
  cnpj: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : undefined)),
  // Dados da empresa (opcionais)
  companyName: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : undefined)),
  companyEmail: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      return val.toLowerCase().trim();
    })
    .refine(
      (val) => {
        if (!val) return true;
        return z.string().email().safeParse(val).success;
      },
      { message: "Email da empresa inválido" }
    ),
  companyPhone: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== "" ? val : undefined)),
  // Endereço (opcional)
  address: z
    .object({
      street: z.string(),
      number: z.string(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string(),
      state: z.string().max(2),
      zipCode: z.string().optional(),
      referencePoint: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  // Preferências (opcionais)
  preferredPayment: z.enum(["pix", "cash", "card"]).optional(),
  notificationsEnabled: z.boolean().optional(),
});

// Schema para login
export const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase().trim(),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Schema para autenticação Google
export const googleAuthSchema = z.object({
  googleId: z.string().min(1, "Google ID é obrigatório"),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  name: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  profilePhoto: z.string().url("URL da foto inválida").optional(),
});

// Tipos inferidos dos schemas
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
