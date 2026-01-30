const User = require("../models/User");

class FavoriteAddressController {
  // Listar endereços favoritos do usuário
  async list(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("favoriteAddresses");

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      return res.json({
        favorites: user.favoriteAddresses || [],
      });
    } catch (error) {
      console.error("Erro ao listar favoritos:", error);
      return res.status(500).json({
        error: "Erro ao listar endereços favoritos",
        details: error.message,
      });
    }
  }

  // Adicionar novo endereço favorito
  async create(req, res) {
    try {
      const userId = req.user.id;
      const { name, icon, address, neighborhood, city, state, latitude, longitude } = req.body;

      // Validações
      if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({
          error: "Nome, endereço e coordenadas são obrigatórios",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verificar se já existe favorito com mesmo nome
      const existingFavorite = user.favoriteAddresses?.find(
        (fav) => fav.name.toLowerCase() === name.toLowerCase()
      );

      if (existingFavorite) {
        return res.status(400).json({
          error: `Você já possui um favorito com o nome "${name}"`,
        });
      }

      // Adicionar novo favorito
      const newFavorite = {
        name,
        icon: icon || "home",
        address,
        neighborhood,
        city,
        state,
        latitude,
        longitude,
        createdAt: new Date(),
      };

      user.favoriteAddresses = user.favoriteAddresses || [];
      user.favoriteAddresses.push(newFavorite);

      await user.save();

      return res.status(201).json({
        message: "Favorito adicionado com sucesso",
        favorite: newFavorite,
        favorites: user.favoriteAddresses,
      });
    } catch (error) {
      console.error("Erro ao adicionar favorito:", error);
      return res.status(500).json({
        error: "Erro ao adicionar endereço favorito",
        details: error.message,
      });
    }
  }

  // Atualizar endereço favorito
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { favoriteId } = req.params;
      const { name, icon, address, neighborhood, city, state, latitude, longitude } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const favorite = user.favoriteAddresses?.id(favoriteId);
      if (!favorite) {
        return res.status(404).json({ error: "Favorito não encontrado" });
      }

      // Atualizar campos
      if (name) favorite.name = name;
      if (icon) favorite.icon = icon;
      if (address) favorite.address = address;
      if (neighborhood !== undefined) favorite.neighborhood = neighborhood;
      if (city !== undefined) favorite.city = city;
      if (state !== undefined) favorite.state = state;
      if (latitude) favorite.latitude = latitude;
      if (longitude) favorite.longitude = longitude;

      await user.save();

      return res.json({
        message: "Favorito atualizado com sucesso",
        favorite,
        favorites: user.favoriteAddresses,
      });
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      return res.status(500).json({
        error: "Erro ao atualizar endereço favorito",
        details: error.message,
      });
    }
  }

  // Deletar endereço favorito
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { favoriteId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const favoriteIndex = user.favoriteAddresses?.findIndex(
        (fav) => fav._id.toString() === favoriteId
      );

      if (favoriteIndex === -1 || favoriteIndex === undefined) {
        return res.status(404).json({ error: "Favorito não encontrado" });
      }

      user.favoriteAddresses.splice(favoriteIndex, 1);
      await user.save();

      return res.json({
        message: "Favorito removido com sucesso",
        favorites: user.favoriteAddresses,
      });
    } catch (error) {
      console.error("Erro ao deletar favorito:", error);
      return res.status(500).json({
        error: "Erro ao deletar endereço favorito",
        details: error.message,
      });
    }
  }
}

module.exports = new FavoriteAddressController();
