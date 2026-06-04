const Ride = require("../models/Ride");
const DriverLocation = require("../models/DriverLocation");
const RideTrackPoint = require("../models/RideTrackPoint");
const User = require("../models/User");

const ACTIVE_STATUSES = [
  "requesting",
  "payment_pending",
  "driver_assigned",
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
];

const ROUTE_TRACKING_STATUSES = [
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
];

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = String(item?._id || key || "unknown");
    acc[value] = Number(item?.count || 0);
    return acc;
  }, {});
}

function buildAlert({ id, severity, title, message, value }) {
  return { id, severity, title, message, value };
}

function resolveHealth(alerts) {
  if (alerts.some((alert) => alert.severity === "critical")) return "critical";
  if (alerts.some((alert) => alert.severity === "warning")) return "warning";
  return "healthy";
}

async function getRouteTrackingStats(activeRides, staleCutoff) {
  const trackedRides = activeRides.filter((ride) =>
    ROUTE_TRACKING_STATUSES.includes(String(ride.status || "")) && ride.driverId,
  );
  if (!trackedRides.length) {
    return { expected: 0, fresh: 0, stale: 0, missing: 0, staleRideIds: [] };
  }

  const rideIds = trackedRides.map((ride) => ride._id);
  const latestPoints = await RideTrackPoint.aggregate([
    { $match: { rideId: { $in: rideIds } } },
    { $sort: { capturedAt: -1 } },
    {
      $group: {
        _id: "$rideId",
        capturedAt: { $first: "$capturedAt" },
      },
    },
  ]);

  const latestByRideId = new Map(
    latestPoints.map((point) => [String(point._id), point.capturedAt]),
  );

  let fresh = 0;
  let stale = 0;
  let missing = 0;
  const staleRideIds = [];

  trackedRides.forEach((ride) => {
    const capturedAt = latestByRideId.get(String(ride._id));
    if (!capturedAt) {
      missing += 1;
      staleRideIds.push(String(ride._id));
      return;
    }
    if (new Date(capturedAt).getTime() < staleCutoff.getTime()) {
      stale += 1;
      staleRideIds.push(String(ride._id));
      return;
    }
    fresh += 1;
  });

  return {
    expected: trackedRides.length,
    fresh,
    stale,
    missing,
    staleRideIds: staleRideIds.slice(0, 10),
  };
}

const operationsController = {
  async getSummary(req, res) {
    try {
      const now = new Date();
      const staleLocationSeconds = Number(req.query.staleLocationSeconds || 90);
      const staleRouteSeconds = Number(req.query.staleRouteSeconds || 120);
      const queueAlertSeconds = Number(req.query.queueAlertSeconds || 300);
      const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const staleLocationCutoff = new Date(now.getTime() - staleLocationSeconds * 1000);
      const staleRouteCutoff = new Date(now.getTime() - staleRouteSeconds * 1000);
      const queueAlertCutoff = new Date(now.getTime() - queueAlertSeconds * 1000);

      const [
        statusCountsRaw,
        serviceCountsRaw,
        activeRides,
        recentRides,
        locationCountsRaw,
        staleLocations,
        totalDrivers,
        approvedDrivers,
      ] = await Promise.all([
        Ride.aggregate([
          { $match: { createdAt: { $gte: since24h } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Ride.aggregate([
          { $match: { createdAt: { $gte: since24h } } },
          { $group: { _id: "$serviceType", count: { $sum: 1 } } },
        ]),
        Ride.find({ status: { $in: ACTIVE_STATUSES } })
          .select("serviceType status requestedAt createdAt driverId clientId pickup dropoff pricing")
          .populate("clientId", "name email")
          .lean(),
        Ride.find({ createdAt: { $gte: since24h } })
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(10)
          .select("serviceType status createdAt updatedAt clientId pickup dropoff pricing")
          .populate("clientId", "name email")
          .lean(),
        DriverLocation.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        DriverLocation.find({
          status: { $ne: "offline" },
          lastUpdated: { $lt: staleLocationCutoff },
        })
          .select("driverId status lastUpdated vehicleType")
          .populate("driverId", "name email")
          .limit(10)
          .lean(),
        User.countDocuments({ userType: "driver" }),
        User.countDocuments({ userType: "driver", driverStatus: "approved" }),
      ]);

      const routeTracking = await getRouteTrackingStats(activeRides, staleRouteCutoff);
      const ridesByStatus = countBy(statusCountsRaw);
      const ridesByService = countBy(serviceCountsRaw);
      const driversByStatus = countBy(locationCountsRaw);
      const availableDrivers = Number(driversByStatus.available || 0);
      const onlineDrivers =
        Number(driversByStatus.available || 0) +
        Number(driversByStatus.busy || 0) +
        Number(driversByStatus.on_ride || 0);
      const paymentPending = activeRides.filter((ride) => ride.status === "payment_pending").length;
      const waitingRequests = activeRides.filter((ride) => {
        if (ride.status !== "requesting") return false;
        const createdAt = new Date(ride.requestedAt || ride.createdAt || now);
        return createdAt.getTime() < queueAlertCutoff.getTime();
      }).length;

      const alerts = [];
      if (staleLocations.length > 0) {
        alerts.push(buildAlert({
          id: "stale-driver-locations",
          severity: "warning",
          title: "Localizações vencidas",
          message: "Há motoristas online sem atualização recente de GPS.",
          value: staleLocations.length,
        }));
      }
      if (routeTracking.stale + routeTracking.missing > 0) {
        alerts.push(buildAlert({
          id: "stale-route-tracking",
          severity: "critical",
          title: "Rotas sem ping recente",
          message: "Há corridas/entregas em andamento sem telemetria recente.",
          value: routeTracking.stale + routeTracking.missing,
        }));
      }
      if (paymentPending > 0) {
        alerts.push(buildAlert({
          id: "payment-pending",
          severity: "warning",
          title: "Pagamentos aguardando confirmação",
          message: "Existem pedidos selecionados ainda travados em pagamento pendente.",
          value: paymentPending,
        }));
      }
      if (waitingRequests > 0) {
        alerts.push(buildAlert({
          id: "requesting-queue",
          severity: "warning",
          title: "Solicitações envelhecidas",
          message: "Há pedidos procurando motorista há mais tempo que o limite operacional.",
          value: waitingRequests,
        }));
      }
      if (availableDrivers === 0 && activeRides.some((ride) => ride.status === "requesting")) {
        alerts.push(buildAlert({
          id: "no-available-drivers",
          severity: "critical",
          title: "Sem motorista livre",
          message: "Existem solicitações em aberto e nenhum motorista disponível no radar.",
          value: 0,
        }));
      }

      const coveragePct = routeTracking.expected
        ? Math.round((routeTracking.fresh / routeTracking.expected) * 100)
        : 100;

      return res.json({
        success: true,
        generatedAt: now.toISOString(),
        health: resolveHealth(alerts),
        thresholds: {
          staleLocationSeconds,
          staleRouteSeconds,
          queueAlertSeconds,
        },
        rides: {
          active: activeRides.length,
          byStatus: ridesByStatus,
          byService: ridesByService,
          paymentPending,
          waitingRequests,
        },
        drivers: {
          total: totalDrivers,
          approved: approvedDrivers,
          online: onlineDrivers,
          available: availableDrivers,
          busy: Number(driversByStatus.busy || 0),
          onRide: Number(driversByStatus.on_ride || 0),
          offline: Number(driversByStatus.offline || 0),
          staleLocations: staleLocations.length,
        },
        tracking: {
          ...routeTracking,
          coveragePct,
        },
        alerts,
        recentEvents: recentRides.map((ride) => ({
          id: String(ride._id),
          serviceType: ride.serviceType,
          status: ride.status,
          clientName: ride.clientId?.name || "Cliente",
          pickup: ride.pickup?.address || "",
          dropoff: ride.dropoff?.address || "",
          total: Number(ride.pricing?.total || 0),
          updatedAt: ride.updatedAt || ride.createdAt,
        })),
        staleLocations: staleLocations.map((item) => ({
          driverId: String(item.driverId?._id || item.driverId || ""),
          driverName: item.driverId?.name || "Motorista",
          status: item.status,
          vehicleType: item.vehicleType,
          lastUpdated: item.lastUpdated,
        })),
      });
    } catch (error) {
      console.error("[Operations] summary error:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao gerar resumo operacional",
        error: error.message,
      });
    }
  },
};

module.exports = operationsController;
