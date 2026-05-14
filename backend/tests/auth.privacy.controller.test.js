jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/Ride", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/models/PasswordReset", () => ({}));
jest.mock("../src/models/PhoneVerification", () => ({}));
jest.mock("../src/services/email.service", () => ({
  sendPasswordResetEmail: jest.fn(),
}));

const User = require("../src/models/User");
const Ride = require("../src/models/Ride");
const authController = require("../src/controllers/auth.controller");

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("auth privacy flows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("records privacy consent version and timestamps", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      acceptedTerms: false,
      save,
    };

    User.findById.mockResolvedValue(user);

    const req = {
      user: { id: "user-1" },
      body: {
        acceptedTerms: true,
        acceptedPrivacy: true,
        consentVersion: "2026-05-14",
      },
    };
    const res = createRes();

    await authController.recordPrivacyConsent(req, res);

    expect(user.acceptedTerms).toBe(true);
    expect(user.consentVersion).toBe("2026-05-14");
    expect(user.acceptedTermsAt).toBeInstanceOf(Date);
    expect(user.acceptedPrivacyAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });

  test("blocks consent revocation when there is an active ride", async () => {
    User.findById.mockResolvedValue({ _id: "user-1" });
    Ride.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "ride-1", status: "accepted" }),
      }),
    });

    const req = { user: { id: "user-1" } };
    const res = createRes();

    await authController.revokePrivacyConsent(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  test("anonymizes account when deleting without active rides", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      _id: "507f1f77bcf86cd799439011",
      isActive: true,
      acceptedTerms: true,
      notificationsEnabled: true,
      favoriteAddresses: [{ name: "Casa" }],
      paymentMethods: [{ _id: "pm1" }],
      wallet: { balance: 10, transactions: [{ type: "topup" }] },
      save,
    };

    User.findById.mockResolvedValue(user);
    Ride.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = {
      user: { id: "user-1" },
      body: { reason: "Teste" },
    };
    const res = createRes();

    await authController.deleteOwnAccount(req, res);

    expect(user.isActive).toBe(false);
    expect(user.name).toBe("Conta excluida");
    expect(user.email).toContain("deleted_");
    expect(user.favoriteAddresses).toEqual([]);
    expect(user.paymentMethods).toEqual([]);
    expect(user.wallet).toEqual({ balance: 0, transactions: [] });
    expect(user.accountDeletionStatus).toBe("completed");
    expect(save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });
});
