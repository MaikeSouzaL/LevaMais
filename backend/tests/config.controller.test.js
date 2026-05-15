jest.mock("../src/models/PlatformConfig", () => ({
  findOne: jest.fn(),
}));

const PlatformConfig = require("../src/models/PlatformConfig");
const configController = require("../src/controllers/config.controller");

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("config controller - policy versions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns persisted policy versions when config exists", async () => {
    PlatformConfig.findOne.mockResolvedValue({
      policyVersions: {
        consentVersion: "consent-2026-06-01",
        termsVersion: "terms-2026-06-01",
        privacyPolicyVersion: "privacy-2026-06-01",
      },
    });

    const req = {};
    const res = createRes();

    await configController.getPolicyVersions(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        consentVersion: "consent-2026-06-01",
        termsVersion: "terms-2026-06-01",
        privacyPolicyVersion: "privacy-2026-06-01",
      },
    });
  });

  test("returns default policy versions when database fails", async () => {
    PlatformConfig.findOne.mockRejectedValue(new Error("db down"));

    const req = {};
    const res = createRes();

    await configController.getPolicyVersions(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        consentVersion: "2026-05-14",
        termsVersion: "2026-05-14",
        privacyPolicyVersion: "2026-05-14",
      },
    });
  });
});
