jest.mock("../src/models/User", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/Withdrawal", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
}));
jest.mock("../src/models/PaymentWebhookEvent", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  aggregate: jest.fn(),
}));

const User = require("../src/models/User");
const Withdrawal = require("../src/models/Withdrawal");
const PaymentWebhookEvent = require("../src/models/PaymentWebhookEvent");
const paymentController = require("../src/controllers/payment.controller");
const withdrawController = require("../src/controllers/withdraw.controller");

function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("payment and withdraw compatibility controllers", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalWebhookSecret = process.env.PAYMENTS_WEBHOOK_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.PAYMENTS_WEBHOOK_SECRET = originalWebhookSecret;
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

  test("processes payment webhook confirmation and credits wallet with idempotency", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const user = {
      wallet: {
        balance: 10,
        transactions: [],
      },
      save,
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    PaymentWebhookEvent.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    PaymentWebhookEvent.create.mockResolvedValue({ _id: "evt_1" });

    const req = {
      headers: { "x-webhook-secret": "secret-123" },
      body: {
        event: "payment.confirmed",
        transactionId: "gw_tx_1",
        userId: "user-1",
        amount: 15,
      },
    };
    const res = createRes();
    process.env.PAYMENTS_WEBHOOK_SECRET = "secret-123";

    await paymentController.webhook(req, res);

    expect(user.wallet.balance).toBe(25);
    expect(user.wallet.transactions).toHaveLength(1);
    expect(user.wallet.transactions[0]).toMatchObject({
      type: "topup",
      amount: 15,
      referenceId: "gw_tx_1",
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(PaymentWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "gw_tx_1",
        event: "payment.confirmed",
        status: "processed",
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        status: "processed",
        transactionId: "gw_tx_1",
      }),
    );

    // Duplicate webhook event should not credit again
    PaymentWebhookEvent.findOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ _id: "evt_1" }),
    });
    const resDuplicate = createRes();
    await paymentController.webhook(req, resDuplicate);
    expect(user.wallet.balance).toBe(25);
    expect(save).toHaveBeenCalledTimes(1);
    expect(resDuplicate.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        status: "already_processed",
        transactionId: "gw_tx_1",
      }),
    );
  });

  test("acknowledges cancelled payment webhook and stores audit event", async () => {
    PaymentWebhookEvent.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    PaymentWebhookEvent.create.mockResolvedValue({ _id: "evt_2" });
    process.env.PAYMENTS_WEBHOOK_SECRET = "secret-123";

    const req = {
      headers: { "x-webhook-secret": "secret-123" },
      body: {
        event: "payment.cancelled",
        transactionId: "gw_tx_2",
      },
    };
    const res = createRes();

    await paymentController.webhook(req, res);

    expect(PaymentWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "gw_tx_2",
        event: "payment.cancelled",
        status: "acknowledged",
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        status: "acknowledged",
        transactionId: "gw_tx_2",
        event: "payment.cancelled",
      }),
    );
  });

  test("lists webhook events with filters for admin reconciliation", async () => {
    const fakeEvents = [
      {
        _id: "evt_10",
        transactionId: "gw_tx_10",
        event: "payment.confirmed",
        userId: "user-10",
        amount: 55.5,
        status: "processed",
        processedAt: new Date("2026-05-14T12:00:00.000Z"),
        replayedAt: new Date("2026-05-14T13:00:00.000Z"),
        replayReason: "reconciliacao manual",
        replayedBy: {
          adminId: "admin-10",
          adminEmail: "admin10@leva.local",
        },
        createdAt: new Date("2026-05-14T12:00:00.000Z"),
      },
    ];

    const limitMock = jest.fn().mockResolvedValue(fakeEvents);
    const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
    PaymentWebhookEvent.find.mockReturnValue({ sort: sortMock });

    const req = {
      query: {
        transactionId: "gw_tx_10",
        event: "payment.confirmed",
        dateFrom: "2026-05-01",
        dateTo: "2026-05-31",
        limit: "50",
      },
    };
    const res = createRes();

    await paymentController.listWebhookEvents(req, res);

    expect(PaymentWebhookEvent.find).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "gw_tx_10",
        event: "payment.confirmed",
        createdAt: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date),
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 1,
        events: [
          expect.objectContaining({
            transactionId: "gw_tx_10",
            event: "payment.confirmed",
            amount: 55.5,
            status: "processed",
            replayReason: "reconciliacao manual",
            replayedBy: expect.objectContaining({
              adminId: "admin-10",
              adminEmail: "admin10@leva.local",
            }),
          }),
        ],
      }),
    );
  });

  test("returns webhook event details by id for admin reconciliation", async () => {
    PaymentWebhookEvent.findById.mockResolvedValue({
      _id: "evt_detail_1",
      transactionId: "gw_tx_detail_1",
      event: "payment.failed",
      userId: "user-15",
      amount: 33.9,
      status: "acknowledged",
      rawPayload: { reason: "card_declined" },
      processedAt: new Date("2026-05-14T13:00:00.000Z"),
      createdAt: new Date("2026-05-14T13:00:00.000Z"),
      updatedAt: new Date("2026-05-14T13:05:00.000Z"),
    });

    const req = { params: { eventId: "evt_detail_1" } };
    const res = createRes();

    await paymentController.getWebhookEventById(req, res);

    expect(PaymentWebhookEvent.findById).toHaveBeenCalledWith("evt_detail_1");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        event: expect.objectContaining({
          id: "evt_detail_1",
          transactionId: "gw_tx_detail_1",
          event: "payment.failed",
          rawPayload: { reason: "card_declined" },
        }),
      }),
    );
  });

  test("returns 404 when webhook event detail is not found", async () => {
    PaymentWebhookEvent.findById.mockResolvedValue(null);

    const req = { params: { eventId: "evt_missing" } };
    const res = createRes();

    await paymentController.getWebhookEventById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Evento de webhook nao encontrado",
      }),
    );
  });

  test("replays confirmed webhook event and credits wallet when not settled", async () => {
    const saveUser = jest.fn().mockResolvedValue(undefined);
    const saveEvent = jest.fn().mockResolvedValue(undefined);
    const eventDoc = {
      _id: "evt_replay_1",
      event: "payment.confirmed",
      transactionId: "gw_tx_replay_1",
      userId: "user-21",
      amount: 40,
      rawPayload: {},
      status: "acknowledged",
      save: saveEvent,
    };
    const user = {
      wallet: { balance: 5, transactions: [] },
      save: saveUser,
    };

    PaymentWebhookEvent.findById.mockResolvedValue(eventDoc);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const req = {
      params: { eventId: "evt_replay_1" },
      body: { reason: "reconciliacao manual" },
      user: { id: "admin-1", email: "admin@leva.local" },
    };
    const res = createRes();

    await paymentController.replayWebhookEvent(req, res);

    expect(user.wallet.balance).toBe(45);
    expect(user.wallet.transactions).toHaveLength(1);
    expect(user.wallet.transactions[0]).toMatchObject({
      type: "topup",
      amount: 40,
      referenceId: "gw_tx_replay_1",
    });
    expect(eventDoc.status).toBe("processed");
    expect(eventDoc.replayReason).toBe("reconciliacao manual");
    expect(eventDoc.replayedBy).toEqual({
      adminId: "admin-1",
      adminEmail: "admin@leva.local",
    });
    expect(saveUser).toHaveBeenCalled();
    expect(saveEvent).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        status: "processed",
        transactionId: "gw_tx_replay_1",
      }),
    );
  });

  test("replay returns already_settled when transaction is already in wallet", async () => {
    const saveEvent = jest.fn().mockResolvedValue(undefined);
    const eventDoc = {
      _id: "evt_replay_2",
      event: "payment.confirmed",
      transactionId: "gw_tx_replay_2",
      userId: "user-22",
      amount: 18,
      rawPayload: {},
      status: "acknowledged",
      save: saveEvent,
    };
    const user = {
      wallet: {
        balance: 30,
        transactions: [{ type: "topup", amount: 18, referenceId: "gw_tx_replay_2" }],
      },
      save: jest.fn(),
    };

    PaymentWebhookEvent.findById.mockResolvedValue(eventDoc);
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const req = {
      params: { eventId: "evt_replay_2" },
      body: { reason: "reprocessamento preventivo" },
      user: { id: "admin-2", email: "ops@leva.local" },
    };
    const res = createRes();

    await paymentController.replayWebhookEvent(req, res);

    expect(user.wallet.balance).toBe(30);
    expect(eventDoc.status).toBe("already_settled");
    expect(eventDoc.replayReason).toBe("reprocessamento preventivo");
    expect(eventDoc.replayedBy).toEqual({
      adminId: "admin-2",
      adminEmail: "ops@leva.local",
    });
    expect(saveEvent).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        status: "already_settled",
        transactionId: "gw_tx_replay_2",
      }),
    );
  });

  test("replay rejects non-confirmed webhook event type", async () => {
    PaymentWebhookEvent.findById.mockResolvedValue({
      _id: "evt_replay_3",
      event: "payment.failed",
      transactionId: "gw_tx_replay_3",
      userId: "user-23",
      amount: 10,
      rawPayload: {},
    });

    const req = {
      params: { eventId: "evt_replay_3" },
      body: { reason: "diagnostico" },
      user: { id: "admin-3", email: "admin3@leva.local" },
    };
    const res = createRes();

    await paymentController.replayWebhookEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Replay permitido apenas para payment.confirmed",
      }),
    );
  });

  test("replay rejects request without reason", async () => {
    const req = {
      params: { eventId: "evt_replay_missing_reason" },
      body: {},
      user: { id: "admin-4", email: "admin4@leva.local" },
    };
    const res = createRes();

    await paymentController.replayWebhookEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Motivo do replay obrigatorio",
      }),
    );
    expect(PaymentWebhookEvent.findById).not.toHaveBeenCalled();
  });

  test("returns webhook events summary grouped by event and status", async () => {
    PaymentWebhookEvent.aggregate.mockResolvedValue([
      { _id: { event: "payment.cancelled", status: "acknowledged" }, count: 2 },
      { _id: { event: "payment.confirmed", status: "processed" }, count: 4 },
      { _id: { event: "payment.confirmed", status: "already_settled" }, count: 1 },
    ]);

    const req = {
      query: {
        dateFrom: "2026-05-01",
        dateTo: "2026-05-31",
      },
    };
    const res = createRes();

    await paymentController.getWebhookEventsSummary(req, res);

    expect(PaymentWebhookEvent.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            createdAt: expect.objectContaining({
              $gte: expect.any(Date),
              $lte: expect.any(Date),
            }),
          }),
        }),
      ]),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        totals: { totalEvents: 7 },
        items: expect.arrayContaining([
          expect.objectContaining({
            event: "payment.confirmed",
            status: "processed",
            count: 4,
          }),
        ]),
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

  test("blocks webhook in production when secret is not configured", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.PAYMENTS_WEBHOOK_SECRET;

    const req = {
      headers: {},
      body: {
        event: "payment.confirmed",
        transactionId: "gw_tx_prod_1",
        userId: "user-1",
        amount: 10,
      },
    };
    const res = createRes();

    await paymentController.webhook(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Webhook desabilitado por configuracao",
      }),
    );
    expect(PaymentWebhookEvent.findOne).not.toHaveBeenCalled();
  });
});
