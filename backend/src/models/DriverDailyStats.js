const mongoose = require("mongoose");

/**
 * Armazena o histórico consolidado de atividade diária de cada motorista.
 * Registra horas trabalhadas, garantindo escalabilidade a longo prazo sem inflar o modelo User.
 */
const DriverDailyStatsSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateStr: {
      type: String, // Formato ISO "YYYY-MM-DD"
      required: true,
    },
    totalSeconds: {
      type: Number,
      default: 0,
    },
    onlineSessionsCount: {
      type: Number,
      default: 0,
    },
    completedRidesCount: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalPlatformFees: {
      type: Number,
      default: 0,
    },
    walletBalanceStart: {
      type: Number,
      default: 0,
    },
    walletBalanceEnd: {
      type: Number,
      default: 0,
    },
    firstOnlineAt: {
      type: Date,
      default: null,
    },
    lastOfflineAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Chave única para impedir qualquer duplicidade de histórico no mesmo dia para o mesmo motorista
DriverDailyStatsSchema.index({ driverId: 1, dateStr: 1 }, { unique: true });

module.exports = mongoose.model("DriverDailyStats", DriverDailyStatsSchema);
