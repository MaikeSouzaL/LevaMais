const PlatformConfig = require("../models/PlatformConfig");

class PlatformConfigController {
  async get(req, res) {
    try {
      let config = await PlatformConfig.findOne().sort({ createdAt: -1 });
      if (!config) {
        config = await PlatformConfig.create({ appFeePercentage: 20 });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  }

  async update(req, res) {
    try {
      // Sempre cria um novo registro para manter histórico ou atualiza o último?
      // O modelo sugere histórico (createdAt). Vamos criar um novo para manter histórico de alterações.
      // Ou atualizar o existente se quisermos simplicidade. 
      // Vamos atualizar o último ou criar se não existir (upsert logic simplificada).
      
      let config = await PlatformConfig.findOne().sort({ createdAt: -1 });
      if (config) {
        config.appFeePercentage = req.body.appFeePercentage;
        if (req.body.splitRules) config.splitRules = req.body.splitRules;
        await config.save();
      } else {
        config = await PlatformConfig.create(req.body);
      }
      res.json(config);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new PlatformConfigController();
