const Representative = require("../models/Representative");

class RepresentativeController {
  async index(req, res) {
    try {
      const reps = await Representative.find().sort({ name: 1 });
      res.json(reps);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar representantes" });
    }
  }

  async store(req, res) {
    try {
      const rep = await Representative.create(req.body);
      res.status(201).json(rep);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const rep = await Representative.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!rep) return res.status(404).json({ error: "Representante não encontrado" });
      res.json(rep);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const rep = await Representative.findByIdAndDelete(req.params.id);
      if (!rep) return res.status(404).json({ error: "Representante não encontrado" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar representante" });
    }
  }
}

module.exports = new RepresentativeController();
