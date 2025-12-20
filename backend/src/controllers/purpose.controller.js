const Purpose = require('../models/Purpose');

// List all purposes, optionally filtered by vehicleType
exports.getAll = async (req, res) => {
  try {
    const { vehicleType } = req.query;
    const filter = vehicleType ? { vehicleType } : {};
    
    const purposes = await Purpose.find(filter).sort({ updatedAt: -1 });
    
    res.json(purposes);
  } catch (error) {
    console.error('Error getting purposes:', error);
    res.status(500).json({ message: 'Erro ao buscar tipos de serviço' });
  }
};

// Create a new purpose
exports.create = async (req, res) => {
  try {
    const { vehicleType, id, title, subtitle, icon, badges, isActive } = req.body;

    // Check if ID already exists for this vehicle
    const existing = await Purpose.findOne({ vehicleType, id });
    if (existing) {
      return res.status(400).json({ message: `O ID "${id}" já existe para ${vehicleType}.` });
    }

    const purpose = new Purpose({
      vehicleType,
      id,
      title,
      subtitle,
      icon,
      badges,
      isActive
    });

    await purpose.save();
    res.status(201).json(purpose);
  } catch (error) {
    console.error('Error creating purpose:', error);
    res.status(500).json({ message: 'Erro ao criar tipo de serviço' });
  }
};

// Update a purpose
exports.update = async (req, res) => {
  try {
    const { id } = req.params; // MongoDB _id or custom id? Let's use custom id + vehicleType query for flexibility or just _id if frontend sends it. 
    // Ideally frontend sends _id for updates. But if we stick to the custom id:
    // We need to know which one to update. 
    // Let's assume the route is /:id and we search by _id first, or by custom id + vehicleType if passed.
    // For simplicity, let's assume standard REST: PUT /api/purposes/:id (where :id is the MongoDB _id)
    
    // However, the frontend currently uses the custom slug 'id'.
    // Let's support updating by the custom 'id' AND 'vehicleType' passed in query or body? 
    // OR, let's make the route accept the mongo _id.
    
    // Strategy: The frontend currently works with custom IDs. Let's find by custom ID and vehicleType (passed in body or query).
    // Actually, to make it robust, let's accept the MongoDB _id if available, otherwise assume the param is the custom ID and we need the vehicleType from body to be unique.
    
    // Simplest approach for this transition: 
    // Route: PUT /api/purposes/:id 
    // We'll search by _id. The frontend will need to have the _id available.
    // The current seed data doesn't have _id. When we fetch from DB, it will have _id.
    
    const { title, subtitle, icon, badges, isActive, vehicleType } = req.body;
    
    // Find by custom ID and Vehicle Type (since that's what we have in the unique index)
    // The route param :id corresponds to the custom "slug" ID.
    const purpose = await Purpose.findOneAndUpdate(
      { id: req.params.id, vehicleType }, 
      { title, subtitle, icon, badges, isActive },
      { new: true }
    );

    if (!purpose) {
      return res.status(404).json({ message: 'Tipo de serviço não encontrado' });
    }

    res.json(purpose);
  } catch (error) {
    console.error('Error updating purpose:', error);
    res.status(500).json({ message: 'Erro ao atualizar tipo de serviço' });
  }
};

// Delete a purpose
exports.delete = async (req, res) => {
  try {
    const { id } = req.params; // Custom slug ID
    const { vehicleType } = req.query; // Need vehicleType to identify unique item

    if (!vehicleType) {
      return res.status(400).json({ message: 'VehicleType é obrigatório para exclusão' });
    }

    const result = await Purpose.findOneAndDelete({ id, vehicleType });

    if (!result) {
      return res.status(404).json({ message: 'Tipo de serviço não encontrado' });
    }

    res.json({ message: 'Tipo de serviço excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting purpose:', error);
    res.status(500).json({ message: 'Erro ao excluir tipo de serviço' });
  }
};

// Toggle Active Status
exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleType } = req.body;

    const purpose = await Purpose.findOne({ id, vehicleType });
    if (!purpose) {
      return res.status(404).json({ message: 'Tipo de serviço não encontrado' });
    }

    purpose.isActive = !purpose.isActive;
    await purpose.save();

    res.json(purpose);
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ message: 'Erro ao alterar status' });
  }
};

// Seed database with initial data
exports.seed = async (req, res) => {
  try {
    const SEED_DATA = [
      // Motorcycle
      { vehicleType: "motorcycle", id: "delivery", title: "Entrega de Delivery", subtitle: "Entregar pacotes e encomendas", icon: "Package", isActive: true },
      { vehicleType: "motorcycle", id: "documents", title: "Documentos", subtitle: "Envio e retirada de documentos", icon: "FileText", isActive: true },
      { vehicleType: "motorcycle", id: "market-light", title: "Compras de Supermercado", subtitle: "Itens leves e compras do dia a dia", icon: "ShoppingBasket", isActive: true },
      { vehicleType: "motorcycle", id: "express", title: "Expresso", subtitle: "Coleta e entrega rápida", icon: "Zap", badges: ["RÁPIDO"], isActive: true },
      { vehicleType: "motorcycle", id: "pharmacy", title: "Farmácia", subtitle: "Medicamentos e itens de saúde", icon: "Pill", isActive: true },
      { vehicleType: "motorcycle", id: "petshop", title: "Pet Shop", subtitle: "Itens para pets", icon: "Dog", isActive: true },
      
      // Car
      { vehicleType: "car", id: "delivery", title: "Entrega de Delivery", subtitle: "Pacotes médios e encomendas", icon: "Package", isActive: true },
      { vehicleType: "car", id: "documents", title: "Documentos e Processos", subtitle: "Envio seguro de documentos", icon: "FileText", isActive: true },
      { vehicleType: "car", id: "market-medium", title: "Compras de Mês", subtitle: "Compras médias de supermercado", icon: "ShoppingCart", isActive: true },
      { vehicleType: "car", id: "express", title: "Expresso Carro", subtitle: "Entrega rápida com segurança", icon: "Zap", isActive: true },
      { vehicleType: "car", id: "fragile", title: "Frágil/Delicado", subtitle: "Transporte cuidadoso (bolos, vidro)", icon: "ShieldCheck", badges: ["CUIDADO"], isActive: true },
      
      // Van
      { vehicleType: "van", id: "moving-light", title: "Mudança Leve", subtitle: "Pequenos móveis e caixas", icon: "Truck", isActive: true },
      { vehicleType: "van", id: "market-bulk", title: "Abastecimento", subtitle: "Restaurantes e comércios", icon: "ShoppingBag", isActive: true },
      
      // Truck
      { vehicleType: "truck", id: "moving", title: "Mudança Completa", subtitle: "Residencial ou comercial", icon: "Home", isActive: true },
      { vehicleType: "truck", id: "commercial-load", title: "Carga Comercial", subtitle: "Paletes e mercadorias", icon: "Container", isActive: true }
    ];

    // Delete existing data to avoid duplicates (optional, or check existence)
    await Purpose.deleteMany({});
    
    await Purpose.insertMany(SEED_DATA);
    
    res.json({ message: 'Banco de dados populado com sucesso!', count: SEED_DATA.length });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ message: 'Erro ao popular banco de dados' });
  }
};
