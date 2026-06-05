const mongoose = require("mongoose");

// Produto/serviço de uma loja, com modificadores/adicionais e combos — Fase D.
// modifierGroups é genérico para cobrir as 4 categorias (restaurante/farmácia/mercado/oficina) sem schemas distintos.
const modifierOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    priceDelta: { type: Number, default: 0 }, // +R$ sobre o basePrice
    available: { type: Boolean, default: true },
  },
  { _id: false },
);

const modifierGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Tamanho", "Adicionais", "Ponto da carne"
    min: { type: Number, min: 0, default: 0 }, // 1 = obrigatório
    max: { type: Number, min: 1, default: 1 }, // >1 = múltipla seleção
    options: { type: [modifierOptionSchema], default: [] },
  },
  { _id: false },
);

const storeProductSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Loja é obrigatória"],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    name: {
      type: String,
      required: [true, "Nome do produto é obrigatório"],
      trim: true,
    },
    description: { type: String, default: "" },
    photo: { type: String, default: "" },
    basePrice: {
      type: Number,
      required: [true, "Preço base é obrigatório"],
      min: 0,
    },
    unit: {
      type: String,
      enum: ["unit", "kg", "g", "l", "ml", "service"],
      default: "unit",
    },
    sku: { type: String, default: "" },
    modifierGroups: { type: [modifierGroupSchema], default: [] },
    combo: {
      isCombo: { type: Boolean, default: false },
      items: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "StoreProduct" },
          quantity: { type: Number, min: 1, default: 1 },
        },
      ],
    },
    // Farmácia: itens controlados que exigem confirmação/receita
    requiresConfirmation: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    stock: { type: Number, default: null }, // null = ilimitado; mercados controlam estoque
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

storeProductSchema.index({ storeId: 1, available: 1, order: 1 });
storeProductSchema.index({ name: "text", description: "text" }); // busca textual

module.exports = mongoose.model("StoreProduct", storeProductSchema);
