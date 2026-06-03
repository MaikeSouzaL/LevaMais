/**
 * Seed das categorias de CORRIDA (ride) — moto / economy / comfort / luxury.
 *
 * Popula o banco (coleção RideCategory) com as regras GLOBAIS (cityId: null).
 * A dashboard administrativa pode sobrescrever/criar regras por cidade depois.
 *
 * Uso:
 *   node scripts/seed-ride-categories.js
 *   node scripts/seed-ride-categories.js --force            (sobrescreve valores existentes)
 *   node scripts/seed-ride-categories.js --cities           (também clona p/ todas as cidades ativas)
 *   node scripts/seed-ride-categories.js --city <cityId>    (clona p/ uma cidade específica)
 *   node scripts/seed-ride-categories.js --cities --force
 */

require("dotenv").config();
const mongoose = require("mongoose");
const database = require("../src/config/database");
const RideCategory = require("../src/models/RideCategory");
const City = require("../src/models/City");

const FORCE = process.argv.includes("--force");
const ALL_CITIES = process.argv.includes("--cities");
const CITY_FLAG_INDEX = process.argv.indexOf("--city");
const SINGLE_CITY_ID = CITY_FLAG_INDEX !== -1 ? process.argv[CITY_FLAG_INDEX + 1] : null;

const CATEGORIES = [
  {
    category: "moto",
    label: "Moto",
    description: "Rápido e econômico",
    icon: "two-wheeler",
    vehicleType: "motorcycle",
    cityId: null,
    active: true,
    order: 0,
    maxPassengers: 1,
    pricing: { minimumKm: 2, minimumFee: 5, pricePerKm: 1.2, pricePerMinute: 0, multiplier: 0.75, feePerStop: 2 },
  },
  {
    category: "car_economy",
    label: "Economy",
    description: "Carros do dia a dia",
    icon: "directions-car",
    vehicleType: "car",
    cityId: null,
    active: true,
    order: 1,
    maxPassengers: 4,
    pricing: { minimumKm: 2, minimumFee: 7, pricePerKm: 1.7, pricePerMinute: 0, multiplier: 1.0, feePerStop: 2 },
  },
  {
    category: "car_comfort",
    label: "Comfort",
    description: "Mais espaço e conforto",
    icon: "directions-car",
    vehicleType: "car",
    cityId: null,
    active: true,
    order: 2,
    maxPassengers: 4,
    pricing: { minimumKm: 2, minimumFee: 9, pricePerKm: 2.2, pricePerMinute: 0, multiplier: 1.35, feePerStop: 2 },
  },
  {
    category: "car_luxury",
    label: "Luxo",
    description: "Veículos premium",
    icon: "directions-car",
    vehicleType: "car",
    cityId: null,
    active: true,
    order: 3,
    maxPassengers: 4,
    pricing: { minimumKm: 2, minimumFee: 14, pricePerKm: 3.0, pricePerMinute: 0, multiplier: 1.9, feePerStop: 2 },
  },
];

const stats = { created: 0, updated: 0, skipped: 0 };

// Upsert das 4 categorias para um dado escopo (cityId = null para global).
async function upsertCategoriesFor(cityId, scopeLabel) {
  for (const base of CATEGORIES) {
    const cat = { ...base, cityId };
    const existing = await RideCategory.findOne({ category: cat.category, cityId });
    if (!existing) {
      await RideCategory.create(cat);
      stats.created += 1;
      console.log(`✅ [${scopeLabel}] criada: ${cat.category} (${cat.label})`);
    } else if (FORCE) {
      await RideCategory.updateOne({ _id: existing._id }, { $set: cat });
      stats.updated += 1;
      console.log(`♻️  [${scopeLabel}] atualizada (--force): ${cat.category}`);
    } else {
      stats.skipped += 1;
      console.log(`⏭️  [${scopeLabel}] já existe: ${cat.category} (use --force)`);
    }
  }
}

async function run() {
  await database.connect();

  // 1) Sempre garante as categorias GLOBAIS (cityId: null)
  await upsertCategoriesFor(null, "GLOBAL");

  // 2) Cidade específica
  if (SINGLE_CITY_ID) {
    const city = await City.findById(SINGLE_CITY_ID).select("name");
    if (!city) {
      console.warn(`⚠️  Cidade ${SINGLE_CITY_ID} não encontrada — pulando.`);
    } else {
      await upsertCategoriesFor(city._id, `CIDADE:${city.name}`);
    }
  }

  // 3) Todas as cidades ativas
  if (ALL_CITIES) {
    const cities = await City.find({ isActive: true }).select("name");
    if (cities.length === 0) {
      console.warn("⚠️  Nenhuma cidade ativa encontrada.");
    }
    for (const city of cities) {
      await upsertCategoriesFor(city._id, `CIDADE:${city.name}`);
    }
  }

  console.log(`\nResumo → criadas: ${stats.created} | atualizadas: ${stats.updated} | mantidas: ${stats.skipped}`);
  await database.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Erro no seed de categorias de corrida:", err);
  process.exit(1);
});
