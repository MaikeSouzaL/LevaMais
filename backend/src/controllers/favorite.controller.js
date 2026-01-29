const Favorite = require("../models/Favorite");

exports.create = async (req, res) => {
  try {
    const {
      userId: requestedUserId,
      label,
      icon,
      address,
      latitude,
      longitude,
    } = req.body;

    // Por padrão, favorito sempre pertence ao usuário autenticado.
    // Admin pode criar em nome de outro user (opcional).
    const userId =
      req.user.userType === "admin" && requestedUserId
        ? requestedUserId
        : req.user.id;

    const favorite = await Favorite.create({
      userId,
      label,
      icon,
      address,
      latitude,
      longitude,
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error("Erro ao criar favorito:", error);
    res.status(500).json({ message: "Erro ao criar favorito" });
  }
};

exports.listMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    res.status(500).json({ message: "Erro ao listar favoritos" });
  }
};

exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id.toString() !== userId && req.user.userType !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }

    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });

    res.json(favorites);
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    res.status(500).json({ message: "Erro ao listar favoritos" });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const favorite = await Favorite.findById(id);

    if (!favorite) {
      return res.status(404).json({ message: "Favorito não encontrado" });
    }

    if (
      req.user.id.toString() !== favorite.userId.toString() &&
      req.user.userType !== "admin"
    ) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    await favorite.deleteOne();

    res.json({ message: "Favorito removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar favorito:", error);
    res.status(500).json({ message: "Erro ao deletar favorito" });
  }
};
