const Sender = require("../models/Sender");

const senderController = {
  // Obter o remetente do usuário
  async get(req, res) {
    try {
      const sender = await Sender.findOne({ userId: req.user.id });
      res.json({ success: true, sender });
    } catch (error) {
      console.error("Erro ao buscar remetente:", error);
      res.status(500).json({ success: false, message: "Erro ao buscar remetente" });
    }
  },

  // Salvar ou atualizar o remetente do usuário
  async save(req, res) {
    try {
      const {
        address,
        formattedAddress,
        details,
        contactName,
        contactPhone,
        latitude,
        longitude,
      } = req.body;

      let sender = await Sender.findOne({ userId: req.user.id });

      if (sender) {
        // Update
        sender.address = address;
        sender.formattedAddress = formattedAddress || address;
        sender.details = details;
        sender.contactName = contactName;
        sender.contactPhone = contactPhone;
        sender.latitude = latitude;
        sender.longitude = longitude;
        await sender.save();
      } else {
        // Create
        sender = new Sender({
          userId: req.user.id,
          address,
          formattedAddress: formattedAddress || address,
          details,
          contactName,
          contactPhone,
          latitude,
          longitude,
        });
        await sender.save();
      }

      res.json({ success: true, sender });
    } catch (error) {
      console.error("Erro ao salvar remetente:", error);
      res.status(500).json({ success: false, message: "Erro ao salvar remetente" });
    }
  },
};

module.exports = senderController;
