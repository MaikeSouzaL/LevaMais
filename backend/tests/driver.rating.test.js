const User = require("../src/models/User");
const Ride = require("../src/models/Ride");
const RideHistory = require("../src/models/RideHistory");
const rideController = require("../src/controllers/ride.controller");

jest.mock("../src/models/User", () => {
  const mongoose = require("mongoose");
  
  // Real schema with our virtual rating defined
  const userSchema = new mongoose.Schema({
    name: String,
    ratingStats: {
      averageStars: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      starDistribution: {
        "1": { type: Number, default: 0 },
        "2": { type: Number, default: 0 },
        "3": { type: Number, default: 0 },
        "4": { type: Number, default: 0 },
        "5": { type: Number, default: 0 },
      },
    },
  });

  userSchema.virtual("rating").get(function () {
    return this.ratingStats && this.ratingStats.totalRatings > 0
      ? this.ratingStats.averageStars
      : 5.0;
  });

  const UserModel = mongoose.model("MockUser", userSchema);

  return {
    findById: jest.fn(),
    schema: UserModel.schema,
    model: UserModel,
  };
});

jest.mock("../src/models/Ride", () => {
  const mongoose = require("mongoose");
  const schema = new mongoose.Schema({});
  return {
    schema,
    findById: jest.fn(),
    find: jest.fn(),
  };
});

jest.mock("../src/models/RideHistory", () => {
  const mongoose = require("mongoose");
  const schema = new mongoose.Schema({});
  return {
    schema,
    findById: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(),
  };
});

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Driver Dynamic Rating Constraints (Last 50 Rated Trips)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("User rating virtual defaults to 5.0 when driver has no ratings", () => {
    const MockUserClass = require("../src/models/User").model;
    const driver = new MockUserClass({
      name: "John Doe",
      ratingStats: { averageStars: 0, totalRatings: 0 },
    });

    expect(driver.rating).toBe(5.0);
  });

  test("User rating virtual returns actual averageStars when ratings exist", () => {
    const MockUserClass = require("../src/models/User").model;
    const driver = new MockUserClass({
      name: "John Doe",
      ratingStats: { averageStars: 4.7, totalRatings: 5 },
    });

    expect(driver.rating).toBe(4.7);
  });

  test("rateClientToDriver calculates moving average of last 50 completed/rated rides", async () => {
    // Mock user/driver
    const MockUserClass = require("../src/models/User").model;
    const mockDriver = new MockUserClass({
      _id: "driver-123",
      ratingStats: { averageStars: 0, totalRatings: 0 },
    });
    mockDriver.save = jest.fn().mockResolvedValue(mockDriver);
    User.findById.mockResolvedValue(mockDriver);

    // Mock target ride being rated
    const mockRide = {
      _id: "ride-target",
      clientId: "client-123",
      driverId: "driver-123",
      status: "completed",
      rating: {},
      save: jest.fn().mockResolvedValue(true),
    };
    Ride.findById.mockResolvedValue(mockRide);

    // We will generate 60 past completed rated rides to test the limit to last 50
    // 10 oldest rated with 1 star, 50 newest rated with 5 stars
    const generateRides = (count, stars, startingDate) => {
      const list = [];
      for (let i = 0; i < count; i++) {
        const date = new Date(startingDate);
        date.setMinutes(date.getMinutes() + i);
        list.push({
          driverId: "driver-123",
          status: "completed",
          rating: {
            clientRating: {
              stars: stars,
              createdAt: date,
            },
          },
          createdAt: date,
        });
      }
      return list;
    };

    // 10 old rides rated 1 star, starting at 2026-05-30T10:00:00Z
    const oldRides = generateRides(10, 1, new Date("2026-05-30T10:00:00Z").getTime());
    // 50 new rides rated 5 stars, starting at 2026-05-30T11:00:00Z
    const newRides = generateRides(50, 5, new Date("2026-05-30T11:00:00Z").getTime());

    // Mock Ride.find and RideHistory.find
    // Let's divide them between the active and archived collections
    Ride.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(newRides),
      }),
    });
    RideHistory.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(oldRides),
      }),
    });

    const req = {
      params: { rideId: "ride-target" },
      user: { id: "client-123" },
      body: { stars: 5, comment: "Excelente viagem!" },
    };
    const res = createRes();

    await rideController.rateClientToDriver(req, res);

    // Assert that ride rating stars were set
    expect(mockRide.rating.clientRating.stars).toBe(5);
    expect(mockRide.save).toHaveBeenCalled();

    // Assert that the driver rating was calculated solely based on the 50 newest rides
    // All 50 newest are 5 stars, so the average must be exactly 5.0, ignoring the 10 oldest 1-star rides!
    expect(mockDriver.ratingStats.averageStars).toBe(5.0);
    expect(mockDriver.ratingStats.totalRatings).toBe(50);
    expect(mockDriver.ratingStats.starDistribution["5"]).toBe(50);
    expect(mockDriver.ratingStats.starDistribution["1"]).toBe(0);
    expect(mockDriver.save).toHaveBeenCalled();
  });
});
