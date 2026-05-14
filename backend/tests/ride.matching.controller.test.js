jest.mock("../src/models/Ride", () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/models/DriverLocation", () => ({
  findOne: jest.fn(),
  findNearby: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/models/User", () => ({}));
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
});
