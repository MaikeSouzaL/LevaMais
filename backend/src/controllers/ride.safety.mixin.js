/**
 * Ride controller extensions — SOS & Share Token
 */
const crypto = require('crypto');
const Ride = require('../models/Ride');

const SOS_ALERT_PREFIX = 'sos_alert_';
const SHARE_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * POST /api/rides/:rideId/sos
 * Endpoint de alerta de emergência.
 * Registra o evento e notifica via WebSocket.
 */
async function triggerSOS(req, res) {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;
    const { location, message } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    }

    const isClient = String(ride.clientId?._id || ride.clientId) === String(userId);
    const isDriver = String(ride.driverId?._id || ride.driverId) === String(userId);
    if (!isClient && !isDriver) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    // Registrar evento de SOS
    if (!ride.safetyEvents) ride.safetyEvents = [];
    ride.safetyEvents.push({
      type: 'sos',
      triggeredBy: userId,
      triggeredByRole: isClient ? 'client' : 'driver',
      location: location || null,
      message: message || '',
      timestamp: new Date(),
    });
    await ride.save();

    // Notificar via WebSocket
    const io = req.app.get('io');
    if (io) {
      const alertPayload = {
        rideId: String(ride._id),
        triggeredBy: userId,
        role: isClient ? 'client' : 'driver',
        location,
        message,
        timestamp: new Date().toISOString(),
      };

      // Notificar admins e o outro participante
      io.emit('sos-alert', alertPayload);

      // Também notificar diretamente o outro participante
      const targetRoom = isClient
        ? `driver-${ride.driverId?._id || ride.driverId}`
        : `client-${ride.clientId?._id || ride.clientId}`;
      if (isClient && ride.driverId) {
        io.to(`driver-${ride.driverId._id || ride.driverId}`).emit('sos-alert', alertPayload);
      } else if (ride.clientId) {
        io.to(`client-${ride.clientId._id || ride.clientId}`).emit('sos-alert', alertPayload);
      }
    }

    // Notificar push (admin)
    try {
      const pushService = require('../services/push-notification.service');
      pushService.sendPushToAdmins?.(
        '🚨 Alerta de Emergência',
        `Corrida ${rideId}: ${isClient ? 'Cliente' : 'Motorista'} ativou SOS. ${message || ''}`,
        { type: 'sos_alert', rideId: String(ride._id) },
      ).catch(() => {});
    } catch {}

    return res.json({ success: true, message: 'Alerta de emergência enviado' });
  } catch (error) {
    console.error('Erro ao acionar SOS:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar alerta' });
  }
}

/**
 * GET /api/rides/:rideId/share-token
 * Gera um token público temporário para compartilhamento de rastreamento.
 */
async function generateShareToken(req, res) {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    }

    const isClient = String(ride.clientId?._id || ride.clientId) === String(userId);
    const isDriver = String(ride.driverId?._id || ride.driverId) === String(userId);
    if (!isClient && !isDriver) {
      return res.status(403).json({ success: false, message: 'Acesso negado' });
    }

    // Gerar token único
    const token = crypto.randomBytes(16).toString('hex');

    if (!ride.shareTokens) ride.shareTokens = [];
    ride.shareTokens.push({
      token,
      createdBy: userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + SHARE_TOKEN_EXPIRY_MS),
    });
    await ride.save();

    const shareUrl = `${process.env.APP_URL || 'https://levamais.app'}/track/${rideId}?token=${token}`;

    return res.json({
      success: true,
      token,
      shareUrl,
      expiresAt: ride.shareTokens[ride.shareTokens.length - 1].expiresAt,
    });
  } catch (error) {
    console.error('Erro ao gerar share token:', error);
    return res.status(500).json({ success: false, message: 'Erro ao gerar link de compartilhamento' });
  }
}

/**
 * GET /api/rides/track/:rideId
 * Rastreamento público — não requer autenticação, apenas token válido.
 */
async function publicTrack(req, res) {
  try {
    const { rideId } = req.params;
    const token = req.query.token;

    if (!token) {
      return res.status(403).json({ success: false, message: 'Token não fornecido' });
    }

    const ride = await Ride.findById(rideId)
      .populate('driverId', 'name phone profilePhoto rating')
      .select('status pickup dropoff pricing');

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Corrida não encontrada' });
    }

    // Validar token
    const validToken = (ride.shareTokens || []).find(
      (st) => st.token === token && new Date(st.expiresAt) > new Date(),
    );

    if (!validToken) {
      return res.status(403).json({ success: false, message: 'Link inválido ou expirado' });
    }

    // Dados públicos limitados
    return res.json({
      success: true,
      ride: {
        _id: ride._id,
        status: ride.status,
        pickup: {
          address: ride.pickup?.address,
          latitude: ride.pickup?.latitude,
          longitude: ride.pickup?.longitude,
        },
        dropoff: {
          address: ride.dropoff?.address,
          latitude: ride.dropoff?.latitude,
          longitude: ride.dropoff?.longitude,
        },
        pricing: { total: ride.pricing?.total },
        driver: {
          name: ride.driverId?.name,
          rating: ride.driverId?.rating,
        },
      },
    });
  } catch (error) {
    console.error('Erro no rastreamento público:', error);
    return res.status(500).json({ success: false, message: 'Erro ao carregar rastreamento' });
  }
}

module.exports = { triggerSOS, generateShareToken, publicTrack };
