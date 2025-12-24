const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, informe um email válido",
      ],
    },
    password: {
      type: String,
      required: function () {
        // Senha é obrigatória apenas se não for login com Google
        return !this.googleId;
      },
      minlength: [6, "Senha deve ter no mínimo 6 caracteres"],
      select: false, // Não retornar senha por padrão
    },
    phone: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    // Documentos
    cpf: {
      type: String,
      trim: true,
      sparse: true,
    },
    cnpj: {
      type: String,
      trim: true,
      sparse: true,
    },
    // Dados da empresa (se CNPJ)
    companyName: {
      type: String,
      trim: true,
    },
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    companyPhone: {
      type: String,
      trim: true,
    },
    // Endereço
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      complement: { type: String, trim: true },
      neighborhood: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true, maxlength: 2 },
      zipCode: { type: String, trim: true },
      referencePoint: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    // Preferências
    preferredPayment: {
      type: String,
      enum: ["pix", "cash", "card"],
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    userType: {
      type: String,
      enum: ["client", "driver", "admin"],
      default: "client",
    },
    // Dados específicos do motorista
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
    },
    vehicleInfo: {
      plate: String,
      model: String,
      color: String,
      year: Number,
    },
    googleId: {
      type: String,
      sparse: true, // Permite múltiplos documentos sem esse campo
    },
    profilePhoto: {
      type: String,
    },
    acceptedTerms: {
      type: Boolean,
      default: false,
    },
    // Push Notifications
    pushToken: {
      type: String,
      trim: true,
    },
    pushTokenUpdatedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash da senha antes de salvar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para remover campos sensíveis do JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
