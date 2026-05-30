/**
 * Ride controller extensions — Multiple Stops, Change Destination, Favorite Drivers
 */
const Ride = require('../models/Ride');
const User = require('../models/User');
const mongoose = require('mongoose');

const NON_TERMINAL = ['accepted', 'driver_arriving', 'arrived', 'in_progress'];

// ─── ADD STOP ───────────────────────────────────────────────
async function addStop(req, res) {
  try {
    const { rideId } = req.params;
    const { address, latitude, longitude, order } = req.body;

    if (!address || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Endereço da parada é obrigatório' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Corrida não encontrada' });

    // Cliente ou motorista podem adicionar parada
    const isClient = String(ride.clientId?._id || ride.clientId) === String(req.user.id);
    const isDriver = String(ride.driverId?._id || ride.driverId) === String(req.user.id);
    if (!isClient && !isDriver) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    if (!NON_TERMINAL.includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Não é possível adicionar parada neste status' });
    }

    if (!Array.isArray(ride.stops)) ride.stops = [];

    const stopOrder = order ?? ride.stops.length;
    ride.stops.push({
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      order: stopOrder,
    });
    await ride.save();

    // Notificar via WebSocket
    const io = req.app.get('io');
    if (io) {
      const clientId = ride.clientId?._id || ride.clientId;
      const driverId = ride.driverId?._id || ride.driverId;
      const payload = { rideId: ride._id, stops: ride.stops };
      if (clientId) io.to(`client-${clientId}`).emit('ride-stops-updated', payload);
      if (driverId) io.to(`driver-${driverId}`).emit('ride-stops-updated', payload);
    }

    return res.json({ success: true, stops: ride.stops, message: 'Parada adicionada' });
  } catch (error) {
    console.error('[addStop] Erro:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─── CHANGE DROPOFF ─────────────────────────────────────────
async function changeDropoff(req, res) {
  try {
    const { rideId } = req.params;
    const { address, latitude, longitude } = req.body;

    if (!address || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Novo destino é obrigatório' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: 'Corrida não encontrada' });

    const isClient = String(ride.clientId?._id || ride.clientId) === String(req.user.id);
    const isDriver = String(ride.driverId?._id || ride.driverId) === String(req.user.id);
    if (!isClient && !isDriver) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    if (!NON_TERMINAL.includes(ride.status)) {
      return res.status(400).json({ success: false, message: 'Não é possível alterar destino neste status' });
    }

    // Salvar destino antigo como histórico
    if (!ride.dropoffHistory) ride.dropoffHistory = [];
    ride.dropoffHistory.push({
      address: ride.dropoff.address,
      latitude: ride.dropoff.latitude,
      longitude: ride.dropoff.longitude,
      changedAt: new Date(),
      changedBy: req.user.id,
    });

    // Atualizar destino
    ride.dropoff = {
      address,
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
    await ride.save();

    const io = req.app.get('io');
    if (io) {
      const clientId = ride.clientId?._id || ride.clientId;
      const driverId = ride.driverId?._id || ride.driverId;
      const payload = { rideId: ride._id, dropoff: ride.dropoff };
      if (clientId) io.to(`client-${clientId}`).emit('ride-dropoff-changed', payload);
      if (driverId) io.to(`driver-${driverId}`).emit('ride-dropoff-changed', payload);
    }

    return res.json({ success: true, dropoff: ride.dropoff, message: 'Destino alterado' });
  } catch (error) {
    console.error('[changeDropoff] Erro:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─── FAVORITE DRIVERS ───────────────────────────────────────
async function addFavoriteDriver(req, res) {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ success: false, message: 'ID do motorista obrigatório' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    if (!Array.isArray(user.favoriteDrivers)) user.favoriteDrivers = [];

    const alreadyFav = user.favoriteDrivers.some((id) => String(id) === String(driverId));
    if (alreadyFav) {
      return res.json({ success: true, message: 'Motorista já está nos favoritos' });
    }

    user.favoriteDrivers.push(driverId);
    await user.save();

    return res.json({ success: true, favoriteDrivers: user.favoriteDrivers, message: 'Motorista favoritado!' });
  } catch (error) {
    console.error('[addFavoriteDriver] Erro:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function removeFavoriteDriver(req, res) {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ success: false, message: 'ID do motorista obrigatório' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    user.favoriteDrivers = (user.favoriteDrivers || []).filter((id) => String(id) !== String(driverId));
    await user.save();

    return res.json({ success: true, favoriteDrivers: user.favoriteDrivers, message: 'Removido dos favoritos' });
  } catch (error) {
    console.error('[removeFavoriteDriver] Erro:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function getFavoriteDrivers(req, res) {
  try {
    const user = await User.findById(req.user.id).populate('favoriteDrivers', 'name phone profilePhoto rating');
    return res.json({
      success: true,
      favoriteDrivers: user?.favoriteDrivers || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { addStop, changeDropoff, addFavoriteDriver, removeFavoriteDriver, getFavoriteDrivers };
