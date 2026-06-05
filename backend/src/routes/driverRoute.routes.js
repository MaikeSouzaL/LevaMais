const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/driverRoute.controller");
const scheduleCtrl = require("../controllers/routeSchedule.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Rotas planejadas / maloteiro (Fase D7–D9). Tudo exige login (cliente/motorista).
router.use(authenticateToken);

// MOTORISTA/TRANSPORTADORA — agendas de rotas recorrentes (T2)
router.post("/schedules", scheduleCtrl.createSchedule);
router.get("/schedules", scheduleCtrl.listSchedules);
router.patch("/schedules/:scheduleId", scheduleCtrl.updateSchedule);
router.post("/schedules/:scheduleId/toggle", scheduleCtrl.toggleSchedule);
router.delete("/schedules/:scheduleId", scheduleCtrl.deleteSchedule);

// CLIENTE — descoberta e reserva
router.get("/discover", ctrl.discoverRoutes);
router.get("/mine/reservations", ctrl.listMyReservations);
router.post("/reservations", ctrl.createReservation);
router.get("/reservations/:reservationId", ctrl.getReservation);
router.post("/reservations/:reservationId/cancel", ctrl.cancelReservation);

// MOTORISTA — gestão de rotas
router.post("/", ctrl.publishRoute);
router.get("/mine", ctrl.listMyRoutes);
router.patch("/:id", ctrl.updateRoute);
router.post("/:id/cancel", ctrl.cancelRoute);
router.post("/:id/start", ctrl.startRoute);
router.get("/:id/reservations", ctrl.listRouteReservations);

// MOTORISTA — execução de reservas
router.post("/reservations/:reservationId/accept", ctrl.acceptReservation);
router.post("/reservations/:reservationId/reject", ctrl.rejectReservation);
router.post("/reservations/:reservationId/pickup", ctrl.pickupReservation);
router.post("/reservations/:reservationId/deliver", ctrl.deliverReservation);

// CLIENTE/MOTORISTA — detalhe da rota (deixar por último para não capturar /discover, /mine, /reservations)
router.get("/:id", ctrl.getRoute);

module.exports = router;
