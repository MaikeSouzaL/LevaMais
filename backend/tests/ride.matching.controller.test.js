jest.mock("../src/models/Ride", () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/models/DriverLocation", () => ({
  findOne: jest.fn(),
  findNearby: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/models/PricingConfig", () => ({}));
jest.mock("../src/models/City", () => ({
  findById: jest.fn(),
}));
jest.mock("../src/models/ShiftOffer", () => ({
  findOne: jest.fn(),
}));
jest.mock("../src/models/Promotion", () => ({
  findOne: jest.fn(),
}));

const Ride = require("../src/models/Ride");
const DriverLocation = require("../src/models/DriverLocation");
const User = require("../src/models/User");
const ShiftOffer = require("../src/models/ShiftOffer");
const rideController = require("../src/controllers/ride.controller");

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("ride matching guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockResolvedValue(null);
  });

  test("rejects ride creation when service type is incompatible with vehicle", async () => {
    Ride.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = {
      user: { id: "client-1" },
      body: {
        serviceType: "ride",
        vehicleType: "truck",
        pickup: { latitude: -12, longitude: -61, address: "A" },
        dropoff: { latitude: -12.1, longitude: -61.1, address: "B" },
        pricing: { total: 25 },
      },
      app: { get: jest.fn() },
    };
    const res = createRes();

    await rideController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Tipo de servico incompativel com o veiculo selecionado",
      }),
    );
  });

  test("rejects driver accept when service type is not enabled for current vehicle", async () => {
    ShiftOffer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    DriverLocation.findOne.mockResolvedValue({
      vehicleType: "van",
      serviceTypes: ["delivery"],
      currentRideId: null,
    });
    Ride.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "ride-1",
        serviceType: "ride",
        vehicleType: "van",
      }),
    });

    const req = {
      user: { id: "driver-1" },
      params: { rideId: "ride-1" },
      app: { get: jest.fn() },
    };
    const res = createRes();

    await rideController.accept(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  test("rejects driver negotiation offer when ride is incompatible with current vehicle setup", async () => {
    ShiftOffer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    DriverLocation.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        vehicleType: "van",
        serviceTypes: ["delivery"],
        currentRideId: null,
      }),
    });
    Ride.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "ride-2",
        status: "requesting",
        serviceType: "ride",
        vehicleType: "van",
        negotiation: { enabled: true, clientOffer: 25, offers: [] },
        pricing: { total: 25 },
      }),
    });

    const req = {
      user: { id: "driver-2", userType: "driver" },
      params: { rideId: "ride-2" },
      body: { action: "accept" },
      app: { get: jest.fn() },
    };
    const res = createRes();

    await rideController.submitOfferResponse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Servico incompativel com o veiculo do motorista",
      }),
    );
  });

  test("rejects scheduled ride accept when service type is incompatible with current vehicle", async () => {
    ShiftOffer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    DriverLocation.findOne.mockResolvedValue({
      vehicleType: "truck",
      serviceTypes: ["delivery"],
      currentRideId: null,
    });
    Ride.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "ride-3",
        status: "scheduled",
        serviceType: "ride",
        vehicleType: "truck",
      }),
    });

    const req = {
      user: { id: "driver-3", userType: "driver" },
      params: { rideId: "ride-3" },
      app: { get: jest.fn() },
    };
    const res = createRes();

    await rideController.acceptScheduled(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Servico incompativel com o veiculo do motorista",
      }),
    );
    expect(Ride.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("rejects driver negotiation response when driver has an active shift", async () => {
    ShiftOffer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "shift-1",
        title: "Plantao Centro",
        startAt: new Date(Date.now() - 5 * 60 * 1000),
        endAt: new Date(Date.now() + 55 * 60 * 1000),
      }),
    });
    DriverLocation.findOne.mockReturnValue({
      select: jest.fn(),
    });
    Ride.findById.mockReturnValue({
      populate: jest.fn(),
    });

    const req = {
      user: { id: "driver-4", userType: "driver" },
      params: { rideId: "ride-4" },
      body: { action: "accept" },
      app: { get: jest.fn() },
    };
    const res = createRes();

    await rideController.submitOfferResponse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Voce esta em plantao ativo e nao pode responder negociacoes agora",
      }),
    );
    expect(DriverLocation.findOne).not.toHaveBeenCalled();
    expect(Ride.findById).not.toHaveBeenCalled();
  });

  test("filters available scheduled rides by driver vehicle and enabled service types", async () => {
    DriverLocation.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        vehicleType: "van",
        serviceTypes: ["delivery"],
      }),
    });

    const sortMock = jest.fn().mockResolvedValue([
      { _id: "ride-scheduled-1", vehicleType: "van", serviceType: "delivery" },
    ]);
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    Ride.find.mockReturnValue({ populate: populateMock });

    const req = { user: { id: "driver-5" } };
    const res = createRes();

    await rideController.getAvailableScheduledRides(req, res);

    expect(Ride.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "scheduled",
        vehicleType: "van",
        serviceType: { $in: ["delivery"] },
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
      }),
    );
  });

  test("accepts scheduled ride when driver is compatible and available", async () => {
    ShiftOffer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    DriverLocation.findOne.mockResolvedValue({
      vehicleType: "van",
      serviceTypes: ["delivery"],
      currentRideId: null,
    });
    Ride.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: "ride-ok-1",
        status: "scheduled",
        serviceType: "delivery",
        vehicleType: "van",
      }),
    });

    const populatedRide = {
      _id: "ride-ok-1",
      status: "driver_assigned",
      serviceType: "delivery",
      vehicleType: "van",
      clientId: { _id: "client-1", name: "Cliente" },
    };
    Ride.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(populatedRide),
    });

    const req = {
      user: { id: "driver-6", userType: "driver" },
      params: { rideId: "ride-ok-1" },
      app: { get: jest.fn() },
    };
    const res = createRes();

    await rideController.acceptScheduled(req, res);

    expect(Ride.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "ride-ok-1",
        status: "scheduled",
      }),
      expect.objectContaining({
        driverId: "driver-6",
        status: "driver_assigned",
      }),
      expect.objectContaining({ new: true }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Corrida agendada aceita com sucesso",
        ride: expect.objectContaining({
          _id: "ride-ok-1",
          status: "driver_assigned",
        }),
      }),
    );
  });

  test("allows status transition from driver_assigned to driver_arriving", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    Ride.findById.mockResolvedValue({
      _id: "ride-transition-1",
      driverId: { toString: () => "driver-7" },
      clientId: "client-7",
      serviceType: "delivery",
      status: "driver_assigned",
      proofs: {},
      save,
    });

    const req = {
      user: { id: "driver-7", userType: "driver" },
      params: { rideId: "ride-transition-1" },
      body: { status: "driver_arriving" },
      app: { get: jest.fn().mockReturnValue(null) },
    };
    const res = createRes();

    await rideController.updateStatus(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Status atualizado",
        ride: expect.objectContaining({
          status: "driver_arriving",
        }),
      }),
    );
  });

  test("blocks delivery start without pickup proof photo", async () => {
    Ride.findById.mockResolvedValue({
      _id: "ride-proof-1",
      driverId: { toString: () => "driver-8" },
      clientId: "client-8",
      serviceType: "delivery",
      status: "arrived",
      proofs: {},
      save: jest.fn(),
    });

    const req = {
      user: { id: "driver-8", userType: "driver" },
      params: { rideId: "ride-proof-1" },
      body: { status: "in_progress" },
      app: { get: jest.fn().mockReturnValue(null) },
    };
    const res = createRes();

    await rideController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Envie a foto da coleta antes de iniciar a entrega",
      }),
    );
  });

  test("blocks delivery completion without delivery proof photo", async () => {
    Ride.findById.mockResolvedValue({
      _id: "ride-proof-2",
      driverId: { toString: () => "driver-9" },
      clientId: "client-9",
      serviceType: "delivery",
      status: "in_progress",
      proofs: { pickupPhoto: "base64://pickup" },
      save: jest.fn(),
    });

    const req = {
      user: { id: "driver-9", userType: "driver" },
      params: { rideId: "ride-proof-2" },
      body: { status: "completed" },
      app: { get: jest.fn().mockReturnValue(null) },
    };
    const res = createRes();

    await rideController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Envie a foto da entrega antes de finalizar",
      }),
    );
  });

  test("allows delivery start when pickup proof exists", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    Ride.findById.mockResolvedValue({
      _id: "ride-proof-ok-1",
      driverId: { toString: () => "driver-10" },
      clientId: "client-10",
      serviceType: "delivery",
      status: "arrived",
      proofs: { pickupPhoto: "base64://pickup" },
      save,
    });

    const req = {
      user: { id: "driver-10", userType: "driver" },
      params: { rideId: "ride-proof-ok-1" },
      body: { status: "in_progress" },
      app: { get: jest.fn().mockReturnValue(null) },
    };
    const res = createRes();

    await rideController.updateStatus(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Status atualizado",
        ride: expect.objectContaining({
          status: "in_progress",
        }),
      }),
    );
  });

  test("allows delivery completion when delivery proof exists", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    Ride.findById.mockResolvedValue({
      _id: "ride-proof-ok-2",
      driverId: { toString: () => "driver-11" },
      clientId: "client-11",
      serviceType: "delivery",
      status: "in_progress",
      pricing: { total: 10, driverValue: 8 },
      proofs: { pickupPhoto: "base64://pickup", deliveryPhoto: "base64://delivery" },
      save,
    });

    const req = {
      user: { id: "driver-11", userType: "driver" },
      params: { rideId: "ride-proof-ok-2" },
      body: { status: "completed" },
      app: { get: jest.fn().mockReturnValue(null) },
    };
    const res = createRes();

    await rideController.updateStatus(req, res);

    expect(DriverLocation.findOneAndUpdate).toHaveBeenCalledWith(
      { driverId: "driver-11" },
      expect.objectContaining({
        status: "available",
        currentRideId: null,
      }),
    );
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Status atualizado",
        ride: expect.objectContaining({
          status: "completed",
        }),
      }),
    );
  });
});
