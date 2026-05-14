jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/Withdrawal", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
}));

const User = require("../src/models/User");
const Withdrawal = require("../src/models/Withdrawal");
const paymentController = require("../src/controllers/payment.controller");
const withdrawController = require("../src/controllers/withdraw.controller");

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("payment and withdraw compatibility controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("processes wallet payment and debits client wallet", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      wallet: {
        balance: 50,
        transactions: [],
      },
      paymentMethods: [],
      save,
    };

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const req = {
      user: { id: "user-1" },
      body: {
        amount: 20,
        method: "wallet",
        description: "Entrega centro",
      },
    };
    const res = createRes();

    await paymentController.process(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(user.wallet.balance).toBe(30);
    expect(user.wallet.transactions).toHaveLength(1);
    expect(user.wallet.transactions[0]).toMatchObject({
      type: "ride_payment",
      amount: 20,
      description: "Entrega centro",
    });
    expect(save).toHaveBeenCalled();
  });

  test("rejects wallet payment when balance is insufficient", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        wallet: { balance: 5, transactions: [] },
        paymentMethods: [],
      }),
    });

    const req = {
      user: { id: "user-1" },
      body: {
        amount: 20,
        method: "wallet",
      },
    };
    const res = createRes();

    await paymentController.process(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Saldo insuficiente",
      }),
    );
  });

  test("creates withdrawal request and debits driver balance", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      userType: "driver",
      driverBalance: {
        balance: 120,
        totalDeposits: 200,
        totalDeductions: 30,
        transactions: [],
      },
      save,
    };
    const withdrawalDoc = {
      _id: "withdraw-1",
      amount: 40,
      pixKey: "driver@example.com",
      pixKeyType: "email",
      status: "pending",
      createdAt: new Date("2026-05-14T12:00:00.000Z"),
    };

    User.findById.mockResolvedValue(user);
    Withdrawal.create.mockResolvedValue(withdrawalDoc);

    const req = {
      user: { id: "driver-1" },
      body: {
        amount: 40,
        pixKeyType: "email",
        pixKey: "driver@example.com",
      },
    };
    const res = createRes();

    await withdrawController.request(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(user.driverBalance.balance).toBe(80);
    expect(user.driverBalance.transactions).toHaveLength(1);
    expect(user.driverBalance.transactions[0]).toMatchObject({
      type: "withdrawal",
      amount: 40,
      status: "pending",
    });
    expect(Withdrawal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "driver-1",
        amount: 40,
        pixKey: "driver@example.com",
      }),
    );
    expect(save).toHaveBeenCalled();
  });

  test("cancels pending withdrawal and refunds driver balance", async () => {
    const saveUser = jest.fn().mockResolvedValue(undefined);
    const saveWithdrawal = jest.fn().mockResolvedValue(undefined);
    const user = {
      driverBalance: {
        balance: 60,
        transactions: [
          {
            type: "withdrawal",
            amount: 30,
            pixKey: "11999999999",
            status: "pending",
            description: "Saque de R$ 30.00",
          },
        ],
      },
      save: saveUser,
    };
    const withdrawal = {
      amount: 30,
      pixKey: "11999999999",
      status: "pending",
      save: saveWithdrawal,
    };

    Withdrawal.findOne.mockResolvedValue(withdrawal);
    User.findById.mockResolvedValue(user);

    const req = {
      user: { id: "driver-1" },
      params: { withdrawId: "withdraw-1" },
    };
    const res = createRes();

    await withdrawController.cancel(req, res);

    expect(user.driverBalance.balance).toBe(90);
    expect(user.driverBalance.transactions[0].status).toBe("failed");
    expect(withdrawal.status).toBe("rejected");
    expect(saveUser).toHaveBeenCalled();
    expect(saveWithdrawal).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      }),
    );
  });
});
