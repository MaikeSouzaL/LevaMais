const Favorite = require("../models/Favorite");

exports.create = async (req, res) => {
  try {
    const { userId, label, icon, address, latitude, longitude } = req.body;

    // Verifica se o usuário que está tentando criar é o mesmo do token ou admin
    // Assumindo que o middleware de auth adiciona req.user
    // Convertendo para string para garantir a comparação correta
    if (req.user.id.toString() !== userId && req.user.userType !== 'admin') {
      console.log('Forbidden: Token User ID:', req.user.id.toString(), 'Request User ID:', userId);
      return res.status(403).json({ message: "Acesso negado" });
    }

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

exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id.toString() !== userId && req.user.userType !== 'admin') {
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

    if (req.user.id.toString() !== favorite.userId.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({ message: "Acesso negado" });
    }

    await favorite.deleteOne();

    res.json({ message: "Favorito removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar favorito:", error);
    res.status(500).json({ message: "Erro ao deletar favorito" });
  }
};
