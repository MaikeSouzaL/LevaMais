const City = require("../models/City");
const User = require("../models/User");

class CityController {
  // Listar todas as cidades
  async index(req, res) {
    try {
      const { active, isActive, state } = req.query;
      const filter = {};

      // Compatibilidade: aceitar 'active' (legado) e 'isActive' (atual)
      if (active !== undefined) {
        filter.isActive = active === "true";
      }
      if (isActive !== undefined) {
        filter.isActive = isActive === "true";
      }

      if (state) {
        filter.state = state.toUpperCase();
      }

      const cities = await City.find(filter).sort({ name: 1 });

      return res.json(cities);
    } catch (error) {
      console.error("Erro ao listar cidades:", error);
      return res.status(500).json({
        error: "Erro ao listar cidades",
        message: error.message,
      });
    }
  }

  // Buscar cidade por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      const city = await City.findById(id);

      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }

      return res.json(city);
    } catch (error) {
      console.error("Erro ao buscar cidade:", error);
      return res.status(500).json({
        error: "Erro ao buscar cidade",
        message: error.message,
      });
    }
  }

  // Criar nova cidade
  async store(req, res) {
    try {
      const cityData = req.body;

      // Verificar se já existe cidade com mesmo nome e estado
      const existingCity = await City.findOne({
        name: cityData.name,
        state: cityData.state,
      });

      if (existingCity) {
        return res.status(400).json({
          error: "Já existe uma cidade cadastrada com este nome neste estado",
        });
      }

      const city = await City.create(cityData);

      return res.status(201).json(city);
    } catch (error) {
      console.error("Erro ao criar cidade:", error);
      return res.status(400).json({
        error: "Erro ao criar cidade",
        message: error.message,
      });
    }
  }

  // Atualizar cidade
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const city = await City.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }

      return res.json(city);
    } catch (error) {
      console.error("Erro ao atualizar cidade:", error);
      return res.status(400).json({
        error: "Erro ao atualizar cidade",
        message: error.message,
      });
    }
  }

  // Deletar cidade
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Verificar se existem usuários vinculados a esta cidade
      const usersInCity = await User.countDocuments({ city: id });

      if (usersInCity > 0) {
        return res.status(400).json({
          error: "Não é possível excluir cidade com usuários vinculados",
          usersCount: usersInCity,
        });
      }

      const city = await City.findByIdAndDelete(id);

      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }

      return res.json({ message: "Cidade excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar cidade:", error);
      return res.status(500).json({
        error: "Erro ao deletar cidade",
        message: error.message,
      });
    }
  }

  // Obter estatísticas da cidade
  async stats(req, res) {
    try {
      const { id } = req.params;

      const city = await City.findById(id);

      if (!city) {
        return res.status(404).json({ error: "Cidade não encontrada" });
      }

      // Buscar estatísticas reais
      const totalDrivers = await User.countDocuments({
        "address.city": city.name,
        userType: "driver",
      });

      const activeDrivers = await User.countDocuments({
        "address.city": city.name,
        userType: "driver",
        isActive: true,
      });

      const totalClients = await User.countDocuments({
        "address.city": city.name,
        userType: "client",
      });

      // Atualizar estatísticas da cidade
      city.stats = {
        totalDrivers,
        activeDrivers,
        totalClients,
        totalRides: city.stats.totalRides || 0,
      };

      await city.save();

      return res.json(city.stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return res.status(500).json({
        error: "Erro ao buscar estatísticas",
        message: error.message,
      });
    }
  }

  // Listar fusos horários disponíveis
  async timezones(req, res) {
    try {
      const timezones = [
        { value: "America/Rio_Branco", label: "Acre - Rio Branco (UTC-5)" },
        {
          value: "America/Manaus",
          label: "Amazonas - Manaus (UTC-4)",
        },
        {
          value: "America/Porto_Velho",
          label: "Rondônia - Porto Velho (UTC-4)",
        },
        {
          value: "America/Boa_Vista",
          label: "Roraima - Boa Vista (UTC-4)",
        },
        {
          value: "America/Cuiaba",
          label: "Mato Grosso - Cuiabá (UTC-4)",
        },
        {
          value: "America/Sao_Paulo",
          label: "São Paulo - São Paulo (UTC-3)",
        },
        {
          value: "America/Bahia",
          label: "Bahia - Salvador (UTC-3)",
        },
        {
          value: "America/Belem",
          label: "Pará - Belém (UTC-3)",
        },
        {
          value: "America/Fortaleza",
          label: "Ceará - Fortaleza (UTC-3)",
        },
        {
          value: "America/Recife",
          label: "Pernambuco - Recife (UTC-3)",
        },
        {
          value: "America/Maceio",
          label: "Alagoas - Maceió (UTC-3)",
        },
        {
          value: "America/Araguaina",
          label: "Tocantins - Palmas (UTC-3)",
        },
        {
          value: "America/Santarem",
          label: "Pará - Santarém (UTC-3)",
        },
        {
          value: "America/Noronha",
          label: "Fernando de Noronha (UTC-2)",
        },
      ];

      return res.json(timezones);
    } catch (error) {
      console.error("Erro ao listar fusos horários:", error);
      return res.status(500).json({
        error: "Erro ao listar fusos horários",
        message: error.message,
      });
    }
  }
}

module.exports = new CityController();
