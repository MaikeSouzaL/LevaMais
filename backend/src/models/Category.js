const mongoose = require("mongoose");

// Taxonomia de lojas e de itens de cardápio do marketplace (Fase D).
// kind="store": categoria de loja (ex.: Restaurantes). kind="product": categoria interna do cardápio.
const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "Slug é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    kind: {
      type: String,
      enum: ["store", "product"],
      default: "store",
    },
    // Hierarquia (ex.: "Pizzas" sob "Restaurantes")
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    // Ícone Lucide (regra do projeto: Lucide é a única lib de ícones)
    icon: {
      type: String,
      default: "store",
    },
    order: {
      type: Number,
      default: 0,
    },
    // Comissão padrão da categoria (%). Override pela Store; ver fluxo financeiro Fase D.
    defaultCommissionPct: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

categorySchema.index({ kind: 1, active: 1, order: 1 });
categorySchema.index({ parentId: 1 });

module.exports = mongoose.model("Category", categorySchema);
