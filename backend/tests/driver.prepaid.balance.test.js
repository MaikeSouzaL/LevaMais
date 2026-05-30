const User = require("../src/models/User");
const Ride = require("../src/models/Ride");
const ShiftOffer = require("../src/models/ShiftOffer");
const DriverLocation = require("../src/models/DriverLocation");
const rideController = require("../src/controllers/ride.controller");

jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/models/Ride", () => {
  const mongoose = require("mongoose");
  const schema = new mongoose.Schema({});
  return {
    schema,
    findById: jest.fn(),
  };
});

jest.mock("../src/models/ShiftOffer", () => ({
  findOne: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue(null),
  }),
}));

jest.mock("../src/models/DriverLocation", () => ({
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn().mockResolvedValue(null),
}));

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Driver Prepaid Balance Constraints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ShiftOffer.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    }); // No active shift by default
    DriverLocation.findOne.mockResolvedValue(null); // Default location mocks
  });

  describe("accept method", () => {
    test("blocks driver from accepting a ride if balance is <= 0", async () => {
      const mockDriver = {
        _id: "driver-123",
        driverBalance: { balance: 0 }
      };
      User.findById.mockResolvedValue(mockDriver);

      const req = {
        params: { rideId: "ride-123" },
        user: { id: "driver-123" }
      };
      const res = createRes();

      await rideController.accept(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Saldo insuficiente"),
        })
      );
    });

    test("allows driver to accept a ride if balance is > 0", async () => {
      const mockDriver = {
        _id: "driver-123",
        driverBalance: { balance: 0.10 }
      };
      User.findById.mockResolvedValue(mockDriver);

      // Make next checks pass or fail gracefully
      DriverLocation.findOne.mockResolvedValue({
        driverId: "driver-123",
        vehicleType: "car",
        serviceTypes: ["ride"],
        currentRideId: null
      });
      Ride.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "ride-123",
          serviceType: "ride",
          vehicleType: "car",
          status: "requesting"
        })
      });

      const req = {
        params: { rideId: "ride-123" },
        user: { id: "driver-123" }
      };
      const res = createRes();

      await rideController.accept(req, res);

      // It shouldn't block with "Saldo insuficiente" (status 400 with balance error)
      if (res.status.mock.calls.length > 0) {
        expect(res.json.mock.calls[0][0].error).not.toContain("Saldo insuficiente");
      }
    });
  });

  describe("submitOfferResponse method", () => {
    test("blocks driver from bidding if balance is <= 0", async () => {
      const mockDriver = {
        _id: "driver-123",
        driverBalance: { balance: -2.50 }
      };
      User.findById.mockResolvedValue(mockDriver);

      const req = {
        params: { rideId: "ride-123" },
        user: { id: "driver-123" }
      };
      const res = createRes();

      await rideController.submitOfferResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Saldo insuficiente"),
        })
      );
    });
  });

  describe("acceptScheduled method", () => {
    test("blocks driver from accepting scheduled ride if balance is <= 0", async () => {
      const mockDriver = {
        _id: "driver-123",
        driverBalance: { balance: 0 }
      };
      User.findById.mockResolvedValue(mockDriver);

      const req = {
        params: { rideId: "ride-123" },
        user: { id: "driver-123" }
      };
      const res = createRes();

      await rideController.acceptScheduled(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Saldo insuficiente"),
        })
      );
    });
  });
});
