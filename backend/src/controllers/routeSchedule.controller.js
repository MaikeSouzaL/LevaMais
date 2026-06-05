const mongoose = require("mongoose");
const RouteSchedule = require("../models/RouteSchedule");
const DriverRoute = require("../models/DriverRoute");
const Carrier = require("../models/Carrier");
const { isActiveCarrier } = require("./carrier.controller");

// Rotas recorrentes (Modo Transportadora / T2). Exige transportadora ativa + KYC aprovado.

const VEHICLE_TYPES = new Set(["motorcycle", "car", "van", "truck"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function normalizeText(value, max) {
  const t = String(value || "").trim();
  return t ? t.slice(0, max) : "";
}

function toGeoPoint(input = {}) {
  const point = {
    cityId: mongoose.isValidObjectId(input.cityId) ? input.cityId : null,
    label: normalizeText(input.label, 120),
  };
  const lng = Number(input?.location?.coordinates?.[0] ?? input.longitude);
  const lat = Number(input?.location?.coordinates?.[1] ?? input.latitude);
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    point.location = { type: "Point", coordinates: [lng, lat] };
  }
  return point;
}

function normalizeDays(input) {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)));
}

function normalizeTime(input) {
  const m = String(input || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "08:00";
  const hh = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// Materializa DriverRoutes para os próximos N dias a partir da agenda.
async function generateUpcomingRoutes(schedule, daysAhead = 14) {
  if (!schedule.active) return 0;
  const [hh, mm] = String(schedule.departTime || "08:00").split(":").map((n) => Number(n));
  const now = new Date();
  let created = 0;

  for (let d = 0; d <= daysAhead; d += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    day.setHours(hh || 8, mm || 0, 0, 0);
    if (day.getTime() <= Date.now()) continue;
    if (!schedule.daysOfWeek.includes(day.getDay())) continue;

    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
    // eslint-disable-next-line no-await-in-loop
    const exists = await DriverRoute.exists({ scheduleId: schedule._id, departAt: { $gte: dayStart, $lte: dayEnd } });
    if (exists) continue;

    // eslint-disable-next-line no-await-in-loop
    await DriverRoute.create({
      driverId: schedule.driverId,
      scheduleId: schedule._id,
      vehicleType: schedule.vehicleType,
      origin: schedule.origin,
      destination: schedule.destination,
      waypoints: schedule.waypoints,
      departAt: day,
      capacity: schedule.capacity,
      pricing: schedule.pricing,
      status: "published",
      statusHistory: [{ status: "published", at: new Date(), note: "Gerada por agenda recorrente" }],
    });
    created += 1;
  }

  schedule.lastGeneratedDate = new Date();
  await schedule.save();
  return created;
}

async function requireCarrier(req, res) {
  const ok = await isActiveCarrier(req.user.id);
  if (!ok) {
    sendError(res, 403, "Recurso exclusivo de transportadoras aprovadas. Ative o Modo Transportadora.");
    return false;
  }
  return true;
}

async function createSchedule(req, res) {
  try {
    if (!(await requireCarrier(req, res))) return undefined;

    const { vehicleType, origin, destination, waypoints, daysOfWeek, departTime, capacity, pricing } = req.body || {};
    if (!VEHICLE_TYPES.has(String(vehicleType))) return sendError(res, 400, "Tipo de veiculo invalido");

    const days = normalizeDays(daysOfWeek);
    if (!days.length) return sendError(res, 400, "Selecione ao menos um dia da semana");

    const originPoint = toGeoPoint(origin);
    const destPoint = toGeoPoint(destination);
    if (!originPoint.label && !originPoint.cityId) return sendError(res, 400, "Origem e obrigatoria");
    if (!destPoint.label && !destPoint.cityId) return sendError(res, 400, "Destino e obrigatorio");

    const carrier = await Carrier.findOne({ driverUserId: req.user.id }).select("_id pricing");
    const schedule = await RouteSchedule.create({
      driverId: req.user.id,
      carrierId: carrier?._id || null,
      vehicleType,
      origin: originPoint,
      destination: destPoint,
      waypoints: Array.isArray(waypoints) ? waypoints.slice(0, 10).map(toGeoPoint) : [],
      daysOfWeek: days,
      departTime: normalizeTime(departTime),
      capacity: {
        maxItems: Math.max(1, Number(capacity?.maxItems) || 10),
        maxWeightKg: Math.max(0, Number(capacity?.maxWeightKg) || 50),
        maxVolumeL: Math.max(0, Number(capacity?.maxVolumeL) || 100),
      },
      pricing: {
        basePrice: Math.max(0, Number(pricing?.basePrice) ?? carrier?.pricing?.basePrice ?? 0) || 0,
        pricePerKg: Math.max(0, Number(pricing?.pricePerKg) ?? carrier?.pricing?.pricePerKg ?? 0) || 0,
      },
      active: true,
    });

    const generated = await generateUpcomingRoutes(schedule);
    return res.status(201).json({ success: true, data: schedule, schedule, generated });
  } catch (error) {
    console.error("Erro ao criar agenda:", error);
    return sendError(res, 500, "Erro ao criar agenda", { details: error.message });
  }
}

async function listSchedules(req, res) {
  try {
    const schedules = await RouteSchedule.find({ driverId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    // Top-up: mantém as próximas ocorrências materializadas
    for (const s of schedules) {
      // eslint-disable-next-line no-await-in-loop
      if (s.active) await generateUpcomingRoutes(s).catch(() => {});
    }
    return res.json({ success: true, data: schedules, schedules });
  } catch (error) {
    return sendError(res, 500, "Erro ao listar agendas", { details: error.message });
  }
}

async function updateSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    if (!mongoose.isValidObjectId(scheduleId)) return sendError(res, 400, "scheduleId invalido");
    const schedule = await RouteSchedule.findOne({ _id: scheduleId, driverId: req.user.id });
    if (!schedule) return sendError(res, 404, "Agenda nao encontrada");

    const { daysOfWeek, departTime, capacity, pricing, vehicleType } = req.body || {};
    if (vehicleType !== undefined && VEHICLE_TYPES.has(String(vehicleType))) schedule.vehicleType = vehicleType;
    if (daysOfWeek !== undefined) {
      const days = normalizeDays(daysOfWeek);
      if (!days.length) return sendError(res, 400, "Selecione ao menos um dia da semana");
      schedule.daysOfWeek = days;
    }
    if (departTime !== undefined) schedule.departTime = normalizeTime(departTime);
    if (capacity) {
      if (capacity.maxItems !== undefined) schedule.capacity.maxItems = Math.max(1, Number(capacity.maxItems) || schedule.capacity.maxItems);
      if (capacity.maxWeightKg !== undefined) schedule.capacity.maxWeightKg = Math.max(0, Number(capacity.maxWeightKg) || 0);
    }
    if (pricing) {
      if (pricing.basePrice !== undefined) schedule.pricing.basePrice = Math.max(0, Number(pricing.basePrice) || 0);
      if (pricing.pricePerKg !== undefined) schedule.pricing.pricePerKg = Math.max(0, Number(pricing.pricePerKg) || 0);
    }
    await schedule.save();
    const generated = await generateUpcomingRoutes(schedule).catch(() => 0);
    return res.json({ success: true, data: schedule, schedule, generated });
  } catch (error) {
    return sendError(res, 500, "Erro ao atualizar agenda", { details: error.message });
  }
}

async function toggleSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    if (!mongoose.isValidObjectId(scheduleId)) return sendError(res, 400, "scheduleId invalido");
    const schedule = await RouteSchedule.findOne({ _id: scheduleId, driverId: req.user.id });
    if (!schedule) return sendError(res, 404, "Agenda nao encontrada");
    schedule.active = !schedule.active;
    await schedule.save();
    if (schedule.active) await generateUpcomingRoutes(schedule).catch(() => {});
    return res.json({ success: true, data: schedule, schedule });
  } catch (error) {
    return sendError(res, 500, "Erro ao alternar agenda", { details: error.message });
  }
}

async function deleteSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    if (!mongoose.isValidObjectId(scheduleId)) return sendError(res, 400, "scheduleId invalido");
    const schedule = await RouteSchedule.findOne({ _id: scheduleId, driverId: req.user.id });
    if (!schedule) return sendError(res, 404, "Agenda nao encontrada");
    schedule.active = false;
    await schedule.save();
    // Remove apenas as rotas futuras ainda sem reservas geradas por esta agenda
    await DriverRoute.deleteMany({ scheduleId: schedule._id, status: "published", departAt: { $gte: new Date() } });
    return res.json({ success: true, data: { _id: schedule._id, removed: true } });
  } catch (error) {
    return sendError(res, 500, "Erro ao remover agenda", { details: error.message });
  }
}

module.exports = {
  generateUpcomingRoutes,
  createSchedule,
  listSchedules,
  updateSchedule,
  toggleSchedule,
  deleteSchedule,
};
