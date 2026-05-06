const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome Ã© obrigatÃ³rio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email Ã© obrigatÃ³rio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, informe um email vÃ¡lido",
      ],
    },
    password: {
      type: String,
      required: function () {
        // Senha Ã© obrigatÃ³ria apenas se nÃ£o for login com Google
        return !this.googleId;
      },
      minlength: [6, "Senha deve ter no mÃ­nimo 6 caracteres"],
      select: false, // NÃ£o retornar senha por padrÃ£o
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
    // EndereÃ§o
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
    // EndereÃ§os favoritos
    favoriteAddresses: [
      {
        name: { type: String, required: true, trim: true }, // ex: "Casa", "Trabalho", "Academia"
        icon: { type: String, default: "home" }, // home, work, favorite, shopping-cart, school, restaurant, gym
        
        // EndereÃ§o completo formatado
        formattedAddress: { type: String, trim: true },
        
        // Componentes do endereÃ§o
        street: { type: String, trim: true },
        streetNumber: { type: String, trim: true },
        address: { type: String, required: true, trim: true },
        neighborhood: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        region: { type: String, trim: true }, 
        postalCode: { type: String, trim: true },
        
        // Coordenadas
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        
        createdAt: { type: Date, default: Date.now },
      },
    ],
    paymentMethods: [
      {
        brand: { type: String, trim: true },
        last4: { type: String, trim: true },
        holderName: { type: String, trim: true },
        expiryMonth: { type: Number, min: 1, max: 12 },
        expiryYear: { type: Number, min: 0, max: 99 },
        token: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    wallet: {
      balance: { type: Number, default: 0 },
      transactions: [
        {
          type: {
            type: String,
            enum: ["topup", "ride_payment", "refund", "adjustment"],
          },
          amount: { type: Number, required: true },
          description: { type: String, trim: true },
          createdAt: { type: Date, default: Date.now },
          referenceId: { type: String, trim: true },
        },
      ],
    },
    // PreferÃªncias
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
    // Dados especÃ­ficos do motorista
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
      sparse: true, // Permite mÃºltiplos documentos sem esse campo
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

// MÃ©todo para comparar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// MÃ©todo para remover campos sensÃ­veis do JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
