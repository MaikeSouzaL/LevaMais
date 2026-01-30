const mongoose = require("mongoose");

const representativeSchema = new mongoose.Schema(
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
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, "Telefone é obrigatório"],
    },
    cpfCnpj: {
      type: String,
      required: [true, "CPF ou CNPJ é obrigatório"],
    },
    // Futuro: Link com usuário de login
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Dados bancários para repasse futuro
    bankInfo: {
      bank: String,
      agency: String,
      account: String,
      pixKey: String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Representative", representativeSchema);
