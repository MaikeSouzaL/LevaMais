// Mixin helpers for rating + proofs (separated to keep ride.controller readable)

module.exports.attach = function attach(RideController, deps) {
  const { Ride, DriverLocation } = deps;

  // Cliente avalia motorista
  RideController.prototype.rateClientToDriver = async function rateClientToDriver(
    req,
    res,
  ) {
    try {
      const { rideId } = req.params;
      const userId = String(req.user.id);
      const { stars, comment } = req.body || {};

      const n = Number(stars);
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: "Stars deve ser entre 1 e 5" });
      }

      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ error: "Corrida não encontrada" });

      if (String(ride.clientId) !== userId) {
        return res.status(403).json({ error: "Apenas o cliente pode avaliar" });
      }

      if (ride.status !== "completed") {
        return res.status(400).json({ error: "Só é possível avaliar após finalizar" });
      }

      if (ride.rating?.clientRating?.stars) {
        return res.status(400).json({ error: "Avaliação já enviada" });
      }

      ride.rating = ride.rating || {};
      ride.rating.clientRating = {
        stars: n,
        comment: comment ? String(comment) : undefined,
        createdAt: new Date(),
      };

      await ride.save();
      return res.json({ message: "Avaliação registrada" });
    } catch (error) {
      console.error("Erro ao avaliar motorista:", error);
      return res.status(500).json({ error: "Erro ao avaliar", details: error.message });
    }
  };

  // Motorista avalia cliente
  RideController.prototype.rateDriverToClient = async function rateDriverToClient(
    req,
    res,
  ) {
    try {
      const { rideId } = req.params;
      const userId = String(req.user.id);
      const { stars, comment } = req.body || {};

      const n = Number(stars);
      if (!Number.isFinite(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: "Stars deve ser entre 1 e 5" });
      }

      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ error: "Corrida não encontrada" });

      if (!ride.driverId || String(ride.driverId) !== userId) {
        return res.status(403).json({ error: "Apenas o motorista pode avaliar" });
      }

      if (ride.status !== "completed") {
        return res.status(400).json({ error: "Só é possível avaliar após finalizar" });
      }

      if (ride.rating?.driverRating?.stars) {
        return res.status(400).json({ error: "Avaliação já enviada" });
      }

      ride.rating = ride.rating || {};
      ride.rating.driverRating = {
        stars: n,
        comment: comment ? String(comment) : undefined,
        createdAt: new Date(),
      };

      await ride.save();
      return res.json({ message: "Avaliação registrada" });
    } catch (error) {
      console.error("Erro ao avaliar cliente:", error);
      return res.status(500).json({ error: "Erro ao avaliar", details: error.message });
    }
  };

  // Prova de coleta
  RideController.prototype.uploadPickupProof = async function uploadPickupProof(
    req,
    res,
  ) {
    try {
      const { rideId } = req.params;
      const userId = String(req.user.id);
      const { photoBase64 } = req.body || {};

      if (!photoBase64) {
        return res.status(400).json({ error: "photoBase64 é obrigatório" });
      }

      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ error: "Corrida não encontrada" });

      if (!ride.driverId || String(ride.driverId) !== userId) {
        return res.status(403).json({ error: "Apenas o motorista pode enviar" });
      }

      if (ride.serviceType !== "delivery") {
        return res.status(400).json({ error: "Prova de foto apenas para entregas" });
      }

      ride.proofs = ride.proofs || {};
      ride.proofs.pickupPhoto = String(photoBase64);
      ride.proofs.pickupAt = new Date();

      await ride.save();
      return res.json({ message: "Prova de coleta salva" });
    } catch (error) {
      console.error("Erro ao salvar prova de coleta:", error);
      return res.status(500).json({ error: "Erro ao salvar prova", details: error.message });
    }
  };

  // Prova de entrega
  RideController.prototype.uploadDeliveryProof = async function uploadDeliveryProof(
    req,
    res,
  ) {
    try {
      const { rideId } = req.params;
      const userId = String(req.user.id);
      const { photoBase64 } = req.body || {};

      if (!photoBase64) {
        return res.status(400).json({ error: "photoBase64 é obrigatório" });
      }

      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ error: "Corrida não encontrada" });

      if (!ride.driverId || String(ride.driverId) !== userId) {
        return res.status(403).json({ error: "Apenas o motorista pode enviar" });
      }

      if (ride.serviceType !== "delivery") {
        return res.status(400).json({ error: "Prova de foto apenas para entregas" });
      }

      // regra: precisa ter prova de coleta antes de prova de entrega
      if (!ride.proofs?.pickupPhoto) {
        return res.status(400).json({
          error: "Envie a foto da coleta antes da foto da entrega",
        });
      }

      ride.proofs = ride.proofs || {};
      ride.proofs.deliveryPhoto = String(photoBase64);
      ride.proofs.deliveryAt = new Date();

      await ride.save();

      // opcional: ao enviar prova de entrega, podemos liberar o motorista ao completar
      return res.json({ message: "Prova de entrega salva" });
    } catch (error) {
      console.error("Erro ao salvar prova de entrega:", error);
      return res.status(500).json({ error: "Erro ao salvar prova", details: error.message });
    }
  };
};
