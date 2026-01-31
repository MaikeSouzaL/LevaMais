const PricingRule = require("../models/PricingRule");
const City = require("../models/City");
const Purpose = require("../models/Purpose");
const PricingConfig = require("../models/PricingConfig");

class PricingController {
  // Listar todas as regras de preço
  async index(req, res) {
    try {
      const { cityId, vehicleCategory, active } = req.query;
      const filter = {};

      if (cityId) {
        filter.cityId = cityId;
      }

      if (vehicleCategory) {
        filter.vehicleCategory = vehicleCategory;
      }

      if (active !== undefined) {
        filter.active = active === "true";
      }

      const pricingRules = await PricingRule.find(filter)
        .populate("cityId", "name state")
        .populate("purposeId", "name icon")
        .sort({ priority: -1, createdAt: -1 });

      return res.json(pricingRules);
    } catch (error) {
      console.error("Erro ao listar regras de preço:", error);
      return res.status(500).json({
        error: "Erro ao listar regras de preço",
        message: error.message,
      });
    }
  }

  // Buscar regra por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      const pricingRule = await PricingRule.findById(id)
        .populate("cityId", "name state")
        .populate("purposeId", "name icon");

      if (!pricingRule) {
        return res.status(404).json({ error: "Regra de preço não encontrada" });
      }

      return res.json(pricingRule);
    } catch (error) {
      console.error("Erro ao buscar regra de preço:", error);
      return res.status(500).json({
        error: "Erro ao buscar regra de preço",
        message: error.message,
      });
    }
  }

  // Criar nova regra
  async store(req, res) {
    try {
      const ruleData = req.body;

      // Verificar se a cidade existe
      const city = await City.findById(ruleData.cityId);
      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }

      // Verificar se o tipo de serviço existe (se fornecido)
      if (ruleData.purposeId) {
        const purpose = await Purpose.findById(ruleData.purposeId);
        if (!purpose) {
          return res
            .status(404)
            .json({ error: "Tipo de serviço não encontrado" });
        }
      }

      const pricingRule = await PricingRule.create(ruleData);

      // Popular dados relacionados
      await pricingRule.populate("cityId", "name state");
      await pricingRule.populate("purposeId", "name icon");

      return res.status(201).json(pricingRule);
    } catch (error) {
      console.error("Erro ao criar regra de preço:", error);
      return res.status(400).json({
        error: "Erro ao criar regra de preço",
        message: error.message,
      });
    }
  }

  // Atualizar regra
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const pricingRule = await PricingRule.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("cityId", "name state")
        .populate("purposeId", "name icon");

      if (!pricingRule) {
        return res.status(404).json({ error: "Regra de preço não encontrada" });
      }

      return res.json(pricingRule);
    } catch (error) {
      console.error("Erro ao atualizar regra de preço:", error);
      return res.status(400).json({
        error: "Erro ao atualizar regra de preço",
        message: error.message,
      });
    }
  }

  // Deletar regra
  async delete(req, res) {
    try {
      const { id } = req.params;

      const pricingRule = await PricingRule.findByIdAndDelete(id);

      if (!pricingRule) {
        return res.status(404).json({ error: "Regra de preço não encontrada" });
      }

      return res.json({ message: "Regra de preço excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar regra de preço:", error);
      return res.status(500).json({
        error: "Erro ao deletar regra de preço",
        message: error.message,
      });
    }
  }

  // Calcular preço de uma corrida
  async calculate(req, res) {
    try {
      // DEPRECIADO: este endpoint existia com uma lógica própria.
      // Fonte da verdade agora é /rides/calculate-price (mesma regra que o app cliente usa).

      const { cityId, vehicleCategory, purposeId, pickup, dropoff } = req.body;

      if (
        !pickup?.latitude ||
        !pickup?.longitude ||
        !dropoff?.latitude ||
        !dropoff?.longitude
      ) {
        return res.status(400).json({
          error: "pickup e dropoff (com latitude/longitude) são obrigatórios",
        });
      }

      if (!vehicleCategory) {
        return res.status(400).json({
          error: "vehicleCategory é obrigatório",
        });
      }

      const rideController = require("./ride.controller");

      // Reaproveita a mesma assinatura do ride.calculatePrice
      req.body = {
        pickup,
        dropoff,
        vehicleType: vehicleCategory,
        purposeId,
        cityId,
      };

      // Retorna exatamente o mesmo formato do endpoint oficial
      return rideController.calculatePrice(req, res);
    } catch (error) {
      console.error("Erro ao calcular preço:", error);
      return res.status(500).json({
        error: "Erro ao calcular preço",
        message: error.message,
      });
    }
  }

  // Configuração agregada de preços (GET)
  async getConfig(req, res) {
    try {
      const config = await PricingConfig.findOne().sort({ updatedAt: -1 });
      if (!config) {
        return res.status(404).json({ error: "Configuração não encontrada" });
      }
      return res.json({ config });
    } catch (error) {
      console.error("Erro ao buscar configuração de preços:", error);
      return res.status(500).json({
        error: "Erro ao buscar configuração de preços",
        message: error.message,
      });
    }
  }

  // Configuração agregada de preços (PUT)
  async updateConfig(req, res) {
    try {
      const data = req.body;
      const options = { upsert: true, new: true, setDefaultsOnInsert: true };
      const config = await PricingConfig.findOneAndUpdate({}, data, options);
      return res.json({ config });
    } catch (error) {
      console.error("Erro ao atualizar configuração de preços:", error);
      return res.status(400).json({
        error: "Erro ao atualizar configuração de preços",
        message: error.message,
      });
    }
  }

  // Listar categorias de veículos
  async categories(req, res) {
    try {
      const categories = [
        {
          value: "motorcycle",
          label: "Moto",
          icon: "Bike",
          description: "Entregas rápidas e ágeis",
        },
        {
          value: "car",
          label: "Carro",
          icon: "Car",
          description: "Conforto e espaço para passageiros",
        },
        {
          value: "van",
          label: "Van",
          icon: "Truck",
          description: "Maior capacidade de carga",
        },
        {
          value: "truck",
          label: "Caminhão",
          icon: "Truck",
          description: "Cargas volumosas e pesadas",
        },
      ];

      return res.json(categories);
    } catch (error) {
      console.error("Erro ao listar categorias:", error);
      return res.status(500).json({
        error: "Erro ao listar categorias",
        message: error.message,
      });
    }
  }
}

module.exports = new PricingController();
