const PlatformConfig = require("../models/PlatformConfig");

// Default configurations
const DEFAULT_CONFIG = {
  rideCategories: [
    { id: "ride", label: "Corrida", icon: "car-front" },
    { id: "shared", label: "Compartilhada", icon: "users" },
  ],
  deliveryTypes: [
    { id: "express", label: "Express", description: "Entrega rápida", estimatedTime: "15-30 min" },
    { id: "standard", label: "Padrão", description: "Entrega dentro do horário", estimatedTime: "1-2 horas" },
    { id: "scheduled", label: "Agendada", description: "Agendar entrega", estimatedTime: "Outro horário" },
  ],
  deliveryVehicles: [
    { id: "motorcycle", label: "Moto", icon: "two-wheeler" },
    { id: "car", label: "Carro", icon: "car-front" },
    { id: "van", label: "Van", icon: "van" },
    { id: "truck", label: "Caminhão", icon: "truck" },
  ],
  cancelReasons: [
    { id: "driver_far", label: "Motorista está muito longe" },
    { id: "traffic", label: "Trânsito intenso" },
    { id: "vehicle_issue", label: "Problema no veículo" },
    { id: "changed_mind", label: "Mudei de ideia" },
    { id: "other", label: "Outro motivo" },
  ],
  depositConfig: [
    { amount: 5, label: "R$ 5" },
    { amount: 10, label: "R$ 10" },
    { amount: 15, label: "R$ 15" },
    { amount: 20, label: "R$ 20" },
    { amount: 50, label: "R$ 50" },
    { amount: 100, label: "R$ 100" },
  ],
  rideSettings: {
    deductionPercentage: 0.15,
    minimumBalance: 5,
    minRideValue: 10,
    maxRideDistance: 100,
  },
  supportChannels: {
    phone: "0800123456",
    email: "suporte@levamais.app",
    whatsapp: "5500000000000",
    helpCenterUrl: "",
  },
  policyVersions: {
    termsVersion: "2026-05-14",
    privacyPolicyVersion: "2026-05-14",
    consentVersion: "2026-05-14",
  },
  isDevelopmentMode: true,
};

const configController = {
  // Get ride categories
  getRideCategories: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const categories = config?.rideCategories || DEFAULT_CONFIG.rideCategories;

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.rideCategories,
      });
    }
  },

  // Get delivery types
  getDeliveryTypes: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const types = config?.deliveryTypes || DEFAULT_CONFIG.deliveryTypes;

      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.deliveryTypes,
      });
    }
  },

  // Get delivery vehicles
  getDeliveryVehicles: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const vehicles = config?.deliveryVehicles || DEFAULT_CONFIG.deliveryVehicles;

      res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.deliveryVehicles,
      });
    }
  },

  // Get cancel reasons
  getCancelReasons: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const reasons = config?.cancelReasons || DEFAULT_CONFIG.cancelReasons;

      res.json({
        success: true,
        data: reasons,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.cancelReasons,
      });
    }
  },

  // Get deposit configuration
  getDepositConfig: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const deposits = config?.depositConfig || DEFAULT_CONFIG.depositConfig;

      res.json({
        success: true,
        data: deposits,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.depositConfig,
      });
    }
  },

  // Get ride settings (deduction percentage, etc)
  getRideSettings: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const rawDeduction = config?.appFeePercentage !== undefined ? config.appFeePercentage / 100 : (config?.rideSettings?.deductionPercentage || DEFAULT_CONFIG.rideSettings.deductionPercentage);
      const settings = {
        ...DEFAULT_CONFIG.rideSettings,
        ...(config?.rideSettings || {}),
        deductionPercentage: rawDeduction
      };

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.rideSettings,
      });
    }
  },

  // Get deduction percentage
  getDeductionPercentage: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const percentage = config?.appFeePercentage !== undefined ? config.appFeePercentage / 100 : (config?.rideSettings?.deductionPercentage || DEFAULT_CONFIG.rideSettings.deductionPercentage);

      res.json({
        success: true,
        data: {
          percentage: percentage,
        },
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          percentage: DEFAULT_CONFIG.rideSettings.deductionPercentage,
        },
      });
    }
  },

  getSupportChannels: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const supportChannels = config?.supportChannels || DEFAULT_CONFIG.supportChannels;

      res.json({
        success: true,
        data: supportChannels,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.supportChannels,
      });
    }
  },

  getPolicyVersions: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const policyVersions = config?.policyVersions || DEFAULT_CONFIG.policyVersions;

      res.json({
        success: true,
        data: policyVersions,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG.policyVersions,
      });
    }
  },

  // Get all config
  getAllConfig: async (req, res) => {
    try {
      const config = await PlatformConfig.findOne();
      const fullConfig = {
        rideCategories: config?.rideCategories || DEFAULT_CONFIG.rideCategories,
        deliveryTypes: config?.deliveryTypes || DEFAULT_CONFIG.deliveryTypes,
        deliveryVehicles: config?.deliveryVehicles || DEFAULT_CONFIG.deliveryVehicles,
        cancelReasons: config?.cancelReasons || DEFAULT_CONFIG.cancelReasons,
        depositConfig: config?.depositConfig || DEFAULT_CONFIG.depositConfig,
        rideSettings: config?.rideSettings || DEFAULT_CONFIG.rideSettings,
        supportChannels: config?.supportChannels || DEFAULT_CONFIG.supportChannels,
        policyVersions: config?.policyVersions || DEFAULT_CONFIG.policyVersions,
        isDevelopmentMode: config?.isDevelopmentMode !== undefined ? config.isDevelopmentMode : DEFAULT_CONFIG.isDevelopmentMode,
      };

      res.json({
        success: true,
        data: fullConfig,
      });
    } catch (error) {
      res.json({
        success: true,
        data: DEFAULT_CONFIG,
      });
    }
  },

  // Update config (admin only)
  updateConfig: async (req, res) => {
    try {
      // This should be admin only - add check if needed
      let config = await PlatformConfig.findOne();

      if (!config) {
        config = new PlatformConfig(req.body);
      } else {
        Object.assign(config, req.body);
      }

      await config.save();

      res.json({
        success: true,
        message: "Configuração atualizada com sucesso",
        data: config,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = configController;
