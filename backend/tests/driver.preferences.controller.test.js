jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

const User = require("../src/models/User");
const driverController = require("../src/controllers/driver.controller");

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("driver preferences persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("stores driver preferences outside driverBalance", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      userType: "driver",
      vehicleType: "motorcycle",
      driverPreferences: undefined,
      save,
    };

    User.findById.mockResolvedValue(user);

    const req = {
      user: { id: "driver-1" },
      body: {
        serviceTypes: ["delivery"],
        selectedVehicles: ["motorcycle"],
        searchRadiusKm: 12,
        autoAccept: true,
      },
    };
    const res = createRes();

    await driverController.updateDriverPreferences(req, res);

    expect(user.driverPreferences).toMatchObject({
      serviceTypes: ["delivery"],
      selectedVehicles: ["motorcycle"],
      searchRadiusKm: 12,
      autoAccept: true,
    });
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });
});
