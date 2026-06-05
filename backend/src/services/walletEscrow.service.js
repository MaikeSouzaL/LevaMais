/**
 * walletEscrow.service — Escrow do Saldo LevaPay (método de pagamento "wallet").
 *
 * Fluxo:
 *   reserve  → no aceite/confirmação: move total de wallet.balance → wallet.held (cliente).
 *   release  → na conclusão: baixa o held e credita o motorista (driverValue); a taxa
 *              da plataforma é a diferença (total − driverValue), receita implícita.
 *   refund   → no cancelamento: devolve o held ao saldo (menos taxa, na Fase 2).
 *
 * Idempotente: cada transição é guardada por ride.payment.escrow.status.
 * Observação: opera sem transações Mongo multi-doc (compatível com Mongo standalone);
 * o status do escrow no Ride é a fonte de verdade contra reprocessamento/retries.
 */

const User = require("../models/User");
const Partner = require("../models/Partner");

function toMoney(v) {
  return Number(Number(v || 0).toFixed(2));
}

function clientIdOf(ride) {
  return ride?.clientId?._id || ride?.clientId;
}

function rideAmount(ride) {
  return toMoney(ride?.pricing?.total || ride?.negotiation?.finalAgreedPrice || 0);
}

/**
 * Retém (hold) o total da corrida na carteira do cliente.
 * Muta ride.payment.escrow (o chamador salva o Ride). Lança erro se saldo insuficiente.
 */
async function reserve(ride) {
  ride.payment = ride.payment || {};
  ride.payment.escrow = ride.payment.escrow || { status: "none" };

  if (ride.payment.escrow.status === "reserved" || ride.payment.escrow.status === "released") {
    console.log(`[Escrow] reserve SKIP — já está ${ride.payment.escrow.status}`, { rideId: String(ride._id) });
    return { ok: true, alreadyReserved: true, amount: toMoney(ride.payment.escrow.amount) };
  }

  const amount = rideAmount(ride);
  if (amount <= 0) {
    console.log(`[Escrow] reserve FAIL — amount inválido`, { rideId: String(ride._id), amount });
    const err = new Error("Valor da corrida inválido para retenção de saldo.");
    err.code = "INVALID_AMOUNT";
    throw err;
  }

  const client = await User.findById(clientIdOf(ride));
  if (!client) {
    console.log(`[Escrow] reserve FAIL — cliente não encontrado`, { clientId: clientIdOf(ride) });
    const err = new Error("Cliente não encontrado para retenção de saldo.");
    err.code = "CLIENT_NOT_FOUND";
    throw err;
  }

  client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
  const balance = toMoney(client.wallet.balance);
  if (balance < amount) {
    console.log(`[Escrow] reserve FAIL — saldo insuficiente`, { rideId: String(ride._id), balance, amount });
    const err = new Error("Saldo LevaPay insuficiente para esta corrida.");
    err.code = "INSUFFICIENT_BALANCE";
    err.required = amount;
    err.available = balance;
    throw err;
  }

  client.wallet.balance = toMoney(balance - amount);
  client.wallet.held = toMoney(Number(client.wallet.held || 0) + amount);
  client.wallet.transactions = client.wallet.transactions || [];
  client.wallet.transactions.push({
    type: "hold",
    amount,
    description: `Retenção LevaPay da corrida ${ride._id}`,
    rideId: String(ride._id),
    createdAt: new Date(),
  });
  await client.save();

  ride.payment.escrow.status = "reserved";
  ride.payment.escrow.amount = amount;
  ride.payment.escrow.reservedAt = new Date();

  console.log(`[Escrow] reserve OK`, { rideId: String(ride._id), amount, clientBalance: client.wallet.balance, clientHeld: client.wallet.held });
  return { ok: true, amount };
}

/**
 * Libera o valor retido na conclusão: baixa o held do cliente e credita o motorista.
 * Muta ride.payment.escrow (o chamador salva o Ride).
 */
async function release(ride, { driverId, driverValue, platformFee } = {}) {
  ride.payment = ride.payment || {};
  ride.payment.escrow = ride.payment.escrow || { status: "none" };

  if (ride.payment.escrow.status !== "reserved") {
    console.log(`[Escrow] release SKIP — status é ${ride.payment.escrow.status}`, { rideId: String(ride._id) });
    return { ok: false, skipped: true, reason: ride.payment.escrow.status };
  }

  const amount = toMoney(ride.payment.escrow.amount || rideAmount(ride));
  const credit =
    driverValue != null ? toMoney(driverValue) : toMoney(Math.max(0, amount - toMoney(platformFee)));

  // 1) Baixa o held do cliente.
  const client = await User.findById(clientIdOf(ride));
  if (client) {
    client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
    client.wallet.held = toMoney(Math.max(0, Number(client.wallet.held || 0) - amount));
    client.wallet.transactions = client.wallet.transactions || [];
    client.wallet.transactions.push({
      type: "release",
      amount,
      description: `Pagamento liberado da corrida ${ride._id}`,
      rideId: String(ride._id),
      createdAt: new Date(),
    });
    await client.save();
  }

  // 2) Credita o motorista (a taxa da plataforma já está embutida: credit = total − taxa).
  if (driverId && credit > 0) {
    const driver = await User.findById(driverId);
    if (driver) {
      driver.driverBalance = driver.driverBalance || {
        balance: 0,
        totalDeposits: 0,
        totalDeductions: 0,
        transactions: [],
      };
      const txs = Array.isArray(driver.driverBalance.transactions) ? driver.driverBalance.transactions : [];
      const already = txs.some((t) => t?.rideId === String(ride._id) && t?.type === "client_in_app_payment");
      if (!already) {
        driver.driverBalance.balance = toMoney(Number(driver.driverBalance.balance || 0) + credit);
        driver.driverBalance.totalDeposits = toMoney(Number(driver.driverBalance.totalDeposits || 0) + credit);
        driver.driverBalance.transactions.push({
          type: "client_in_app_payment",
          amount: credit,
          description: `Crédito LevaPay da corrida ${ride._id}`,
          rideId: String(ride._id),
          status: "completed",
          createdAt: new Date(),
        });
        await driver.save();
      }
    }
  }

  ride.payment.escrow.status = "released";
  ride.payment.escrow.releasedAt = new Date();
  console.log(`[Escrow] release OK`, { rideId: String(ride._id), amount, credit, driverId });
  return { ok: true, credit, amount };
}

/**
 * Estorna o valor retido ao cliente no cancelamento.
 * feeAmount: taxa de cancelamento a reter do estorno (Fase 2; padrão 0).
 * Muta ride.payment.escrow (o chamador salva o Ride).
 */
async function refund(ride, { feeAmount = 0 } = {}) {
  ride.payment = ride.payment || {};
  ride.payment.escrow = ride.payment.escrow || { status: "none" };

  if (ride.payment.escrow.status !== "reserved") {
    return { ok: false, skipped: true, reason: ride.payment.escrow.status };
  }

  const amount = toMoney(ride.payment.escrow.amount || 0);
  const fee = toMoney(Math.min(Math.max(0, feeAmount), amount));
  const back = toMoney(amount - fee);

  const client = await User.findById(clientIdOf(ride));
  if (client) {
    client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
    client.wallet.held = toMoney(Math.max(0, Number(client.wallet.held || 0) - amount));
    client.wallet.balance = toMoney(Number(client.wallet.balance || 0) + back);
    client.wallet.transactions = client.wallet.transactions || [];
    client.wallet.transactions.push({
      type: "refund_hold",
      amount: back,
      description: `Estorno LevaPay da corrida ${ride._id}${fee > 0 ? ` (taxa R$ ${fee})` : ""}`,
      rideId: String(ride._id),
      createdAt: new Date(),
    });
    await client.save();
  }

  ride.payment.escrow.status = "refunded";
  ride.payment.escrow.refundedAt = new Date();
  return { ok: true, refunded: back, fee };
}

/**
 * Adiciona uma dívida pendente ao cliente (taxa de cancelamento em corrida
 * cash/maquininha, onde não há valor in-app para debitar).
 */
async function addPendingDebt(clientId, amount, rideId) {
  const amt = toMoney(amount);
  if (amt <= 0) return { ok: true, added: 0 };
  const client = await User.findById(clientId?._id || clientId);
  if (!client) return { ok: false, reason: "client_not_found" };
  client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
  client.pendingDebt = toMoney(Number(client.pendingDebt || 0) + amt);
  client.wallet.transactions = client.wallet.transactions || [];
  client.wallet.transactions.push({
    type: "cancellation_fee",
    amount: amt,
    description: `Taxa de cancelamento (dívida) da corrida ${rideId}`,
    rideId: String(rideId),
    createdAt: new Date(),
  });
  await client.save();
  return { ok: true, pendingDebt: client.pendingDebt };
}

/** Debita um valor do saldo do motorista (ex.: multa por cancelamento tardio). Idempotente por rideId+type. */
async function debitDriver(driverId, rideId, amount, { type = "cancellation_penalty", description } = {}) {
  const amt = toMoney(amount);
  if (amt <= 0 || !driverId) return { ok: true, debited: 0 };
  const driver = await User.findById(driverId);
  if (!driver) return { ok: false, reason: "driver_not_found" };
  driver.driverBalance = driver.driverBalance || {
    balance: 0,
    totalDeposits: 0,
    totalDeductions: 0,
    transactions: [],
  };
  const txs = Array.isArray(driver.driverBalance.transactions) ? driver.driverBalance.transactions : [];
  const already = txs.some((t) => t?.rideId === String(rideId) && t?.type === type);
  if (already) return { ok: true, debited: 0, already: true };
  driver.driverBalance.balance = toMoney(Number(driver.driverBalance.balance || 0) - amt);
  driver.driverBalance.totalDeductions = toMoney(Number(driver.driverBalance.totalDeductions || 0) + amt);
  driver.driverBalance.transactions.push({
    type,
    amount: amt,
    description: description || `Débito da corrida ${rideId}`,
    rideId: String(rideId),
    status: "completed",
    createdAt: new Date(),
  });
  await driver.save();
  return { ok: true, debited: amt };
}

/** Credita um valor no saldo do motorista (ex.: parte da taxa de cancelamento). Idempotente por rideId+type. */
async function creditDriver(driverId, rideId, amount, { type = "cancellation_fee", description } = {}) {
  const amt = toMoney(amount);
  if (amt <= 0 || !driverId) return { ok: true, credited: 0 };
  const driver = await User.findById(driverId);
  if (!driver) return { ok: false, reason: "driver_not_found" };
  driver.driverBalance = driver.driverBalance || {
    balance: 0,
    totalDeposits: 0,
    totalDeductions: 0,
    transactions: [],
  };
  const txs = Array.isArray(driver.driverBalance.transactions) ? driver.driverBalance.transactions : [];
  const already = txs.some((t) => t?.rideId === String(rideId) && t?.type === type);
  if (already) return { ok: true, credited: 0, already: true };
  driver.driverBalance.balance = toMoney(Number(driver.driverBalance.balance || 0) + amt);
  driver.driverBalance.totalDeposits = toMoney(Number(driver.driverBalance.totalDeposits || 0) + amt);
  driver.driverBalance.transactions.push({
    type,
    amount: amt,
    description: description || `Crédito da corrida ${rideId}`,
    rideId: String(rideId),
    status: "completed",
    createdAt: new Date(),
  });
  await driver.save();
  return { ok: true, credited: amt };
}

/**
 * Quita a dívida pendente do cliente usando o saldo LevaPay (total ou parcial).
 * Recebe um doc User já carregado e o MUTA (o chamador salva). Retorna o restante.
 */
async function settlePendingDebt(client) {
  if (!client) return { ok: false, settled: 0, remaining: 0 };
  const debt = toMoney(client.pendingDebt || 0);
  if (debt <= 0) return { ok: true, settled: 0, remaining: 0 };
  client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
  const balance = toMoney(client.wallet.balance);
  const pay = toMoney(Math.min(debt, balance));
  if (pay <= 0) return { ok: true, settled: 0, remaining: debt };
  client.wallet.balance = toMoney(balance - pay);
  client.pendingDebt = toMoney(debt - pay);
  client.wallet.transactions = client.wallet.transactions || [];
  client.wallet.transactions.push({
    type: "debt_settlement",
    amount: pay,
    description: "Quitação de taxa de cancelamento pendente",
    createdAt: new Date(),
  });
  return { ok: true, settled: pay, remaining: client.pendingDebt };
}

/**
 * Liquidação de ENTREGA FALHA (destinatário ausente / endereço errado).
 * Regra: cliente paga 100% da entrega; o motorista recebe total×(1+bonusPct)
 * (sem desconto de comissão + bônus); a plataforma absorve a comissão + o bônus.
 * Muta ride.deliveryFailure (o chamador salva o Ride).
 */
async function settleFailedDelivery(ride, { driverId, bonusPct = 0.15 } = {}) {
  const amount = toMoney(ride?.pricing?.total || ride?.payment?.escrow?.amount || 0);
  const driverCredit = toMoney(amount * (1 + Number(bonusPct || 0)));
  ride.deliveryFailure = ride.deliveryFailure || {};

  let chargedVia = "none";

  // 1) Cobrança do cliente (100% da entrega).
  const escrowReserved = ride?.payment?.escrow?.status === "reserved";
  if (escrowReserved) {
    // Consome o valor já retido (cliente pagou via LevaPay).
    const held = toMoney(ride.payment.escrow.amount || amount);
    const client = await User.findById(clientIdOf(ride));
    if (client) {
      client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
      client.wallet.held = toMoney(Math.max(0, Number(client.wallet.held || 0) - held));
      client.wallet.transactions = client.wallet.transactions || [];
      client.wallet.transactions.push({
        type: "delivery_failed_charge",
        amount: held,
        description: `Entrega não concluída (destino) — corrida ${ride._id}`,
        rideId: String(ride._id),
        createdAt: new Date(),
      });
      await client.save();
    }
    ride.payment.escrow.status = "released";
    ride.payment.escrow.releasedAt = new Date();
    chargedVia = "wallet_hold";
  } else if (amount > 0) {
    // Sem valor in-app (cash/maquininha): vira dívida do cliente.
    const client = await User.findById(clientIdOf(ride));
    if (client) {
      client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
      client.pendingDebt = toMoney(Number(client.pendingDebt || 0) + amount);
      client.wallet.transactions = client.wallet.transactions || [];
      client.wallet.transactions.push({
        type: "delivery_failed_charge",
        amount,
        description: `Entrega não concluída (destino) — dívida da corrida ${ride._id}`,
        rideId: String(ride._id),
        createdAt: new Date(),
      });
      await client.save();
    }
    chargedVia = "pending_debt";
  }

  // 2) Crédito ao motorista: total + bônus, sem desconto de comissão.
  if (driverId && driverCredit > 0) {
    const driver = await User.findById(driverId);
    if (driver) {
      driver.driverBalance = driver.driverBalance || {
        balance: 0,
        totalDeposits: 0,
        totalDeductions: 0,
        transactions: [],
      };
      const txs = Array.isArray(driver.driverBalance.transactions) ? driver.driverBalance.transactions : [];
      const already = txs.some((t) => t?.rideId === String(ride._id) && t?.type === "delivery_failed_payout");
      if (!already) {
        driver.driverBalance.balance = toMoney(Number(driver.driverBalance.balance || 0) + driverCredit);
        driver.driverBalance.totalDeposits = toMoney(Number(driver.driverBalance.totalDeposits || 0) + driverCredit);
        driver.driverBalance.transactions.push({
          type: "delivery_failed_payout",
          amount: driverCredit,
          description: `Entrega não concluída + retorno (corrida ${ride._id})`,
          rideId: String(ride._id),
          status: "completed",
          createdAt: new Date(),
        });
        await driver.save();
      }
    }
  }

  ride.deliveryFailure.clientCharged = amount;
  ride.deliveryFailure.driverPaid = driverCredit;
  ride.deliveryFailure.chargedVia = chargedVia;
  return { ok: true, amount, driverCredit, chargedVia };
}

async function reserveOrder(order) {
  order.payment = order.payment || {};
  order.payment.escrow = order.payment.escrow || { status: "none" };

  if (order.payment.escrow.status === "reserved" || order.payment.escrow.status === "released") {
    return { ok: true, alreadyReserved: true, amount: toMoney(order.payment.escrow.amount) };
  }

  const amount = toMoney(order.pricing?.total || 0);
  if (amount <= 0) {
    const err = new Error("Valor do pedido inválido para retenção de saldo.");
    err.code = "INVALID_AMOUNT";
    throw err;
  }

  const client = await User.findById(order.clientId);
  if (!client) {
    const err = new Error("Cliente não encontrado para retenção de saldo.");
    err.code = "CLIENT_NOT_FOUND";
    throw err;
  }

  client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
  const balance = toMoney(client.wallet.balance);
  if (balance < amount) {
    const err = new Error("Saldo LevaPay insuficiente para este pedido.");
    err.code = "INSUFFICIENT_BALANCE";
    err.required = amount;
    err.available = balance;
    throw err;
  }

  client.wallet.balance = toMoney(balance - amount);
  client.wallet.held = toMoney(Number(client.wallet.held || 0) + amount);
  client.wallet.transactions = client.wallet.transactions || [];
  client.wallet.transactions.push({
    type: "hold",
    amount,
    description: `Retenção LevaPay do pedido ${order.orderNumber}`,
    referenceId: String(order._id),
    createdAt: new Date(),
  });
  await client.save();

  order.payment.escrow.status = "reserved";
  order.payment.escrow.amount = amount;
  order.payment.escrow.reservedAt = new Date();

  return { ok: true, amount };
}

async function releaseOrder(order) {
  order.payment = order.payment || {};
  order.payment.escrow = order.payment.escrow || { status: "none" };

  if (order.payment.escrow.status !== "reserved") {
    return { ok: false, skipped: true, reason: order.payment.escrow.status };
  }

  const amount = toMoney(order.payment.escrow.amount || order.pricing?.total || 0);

  // 1) Baixa o held do cliente
  const client = await User.findById(order.clientId);
  if (client) {
    client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
    client.wallet.held = toMoney(Math.max(0, Number(client.wallet.held || 0) - amount));
    client.wallet.transactions = client.wallet.transactions || [];
    client.wallet.transactions.push({
      type: "release",
      amount,
      description: `Pagamento liberado do pedido ${order.orderNumber}`,
      referenceId: String(order._id),
      createdAt: new Date(),
    });
    await client.save();
  }

  // 2) Credita o parceiro
  if (order.partnerId && order.pricing?.partnerPayout > 0) {
    const partner = await Partner.findById(order.partnerId);
    if (partner && partner.ownerUserId) {
      const partnerOwner = await User.findById(partner.ownerUserId);
      if (partnerOwner) {
        partnerOwner.wallet = partnerOwner.wallet || { balance: 0, held: 0, transactions: [] };
        partnerOwner.wallet.transactions = partnerOwner.wallet.transactions || [];
        const already = partnerOwner.wallet.transactions.some(
          (t) => t?.referenceId === String(order._id) && t?.type === "marketplace_payout"
        );
        if (!already) {
          const payout = toMoney(order.pricing.partnerPayout);
          partnerOwner.wallet.balance = toMoney(Number(partnerOwner.wallet.balance || 0) + payout);
          partnerOwner.wallet.transactions.push({
            type: "marketplace_payout",
            amount: payout,
            description: `Repasse do pedido de marketplace ${order.orderNumber}`,
            referenceId: String(order._id),
            createdAt: new Date(),
          });
          await partnerOwner.save();
        }
      }
    }
  }

  order.payment.escrow.status = "released";
  order.payment.escrow.releasedAt = new Date();
  order.payment.payoutStatus = "released";
  order.payment.payoutAt = new Date();

  return { ok: true, amount };
}

async function refundOrder(order) {
  order.payment = order.payment || {};
  order.payment.escrow = order.payment.escrow || { status: "none" };

  if (order.payment.escrow.status !== "reserved") {
    return { ok: false, skipped: true, reason: order.payment.escrow.status };
  }

  const amount = toMoney(order.payment.escrow.amount || 0);

  const client = await User.findById(order.clientId);
  if (client) {
    client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
    client.wallet.held = toMoney(Math.max(0, Number(client.wallet.held || 0) - amount));
    client.wallet.balance = toMoney(Number(client.wallet.balance || 0) + amount);
    client.wallet.transactions = client.wallet.transactions || [];
    client.wallet.transactions.push({
      type: "refund_hold",
      amount,
      description: `Estorno LevaPay do pedido ${order.orderNumber}`,
      referenceId: String(order._id),
      createdAt: new Date(),
    });
    await client.save();
  }

  order.payment.escrow.status = "refunded";
  order.payment.escrow.refundedAt = new Date();

  return { ok: true, refunded: amount };
}

// ---------------------------------------------------------------------------
// Rotas planejadas / maloteiro (Fase D7–D9)
// Escrow de RouteReservation: hold no cliente na reserva, release credita o
// MOTORISTA (driverPayout) na entrega, refund estorna. Espelha reserveOrder/etc.
// ---------------------------------------------------------------------------

function reservationLabel(reservation, opts = {}) {
  return `${opts.label || "reserva de rota"} ${String(reservation._id)}`;
}

async function reserveReservation(reservation, opts = {}) {
  reservation.payment = reservation.payment || {};
  reservation.payment.escrow = reservation.payment.escrow || { status: "none" };

  if (
    reservation.payment.escrow.status === "reserved" ||
    reservation.payment.escrow.status === "released"
  ) {
    return { ok: true, alreadyReserved: true, amount: toMoney(reservation.payment.escrow.amount) };
  }

  const amount = toMoney(reservation.pricing?.price || 0);
  if (amount <= 0) {
    const err = new Error("Valor da reserva inválido para retenção de saldo.");
    err.code = "INVALID_AMOUNT";
    throw err;
  }

  const client = await User.findById(reservation.clientId);
  if (!client) {
    const err = new Error("Cliente não encontrado para retenção de saldo.");
    err.code = "CLIENT_NOT_FOUND";
    throw err;
  }

  client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
  const balance = toMoney(client.wallet.balance);
  if (balance < amount) {
    const err = new Error("Saldo LevaPay insuficiente para esta reserva.");
    err.code = "INSUFFICIENT_BALANCE";
    err.required = amount;
    err.available = balance;
    throw err;
  }

  client.wallet.balance = toMoney(balance - amount);
  client.wallet.held = toMoney(Number(client.wallet.held || 0) + amount);
  client.wallet.transactions = client.wallet.transactions || [];
  client.wallet.transactions.push({
    type: "hold",
    amount,
    description: `Retenção LevaPay da ${reservationLabel(reservation, opts)}`,
    referenceId: String(reservation._id),
    createdAt: new Date(),
  });
  await client.save();

  reservation.payment.escrow.status = "reserved";
  reservation.payment.escrow.amount = amount;
  reservation.payment.escrow.reservedAt = new Date();

  return { ok: true, amount };
}

async function releaseReservation(reservation, opts = {}) {
  reservation.payment = reservation.payment || {};
  reservation.payment.escrow = reservation.payment.escrow || { status: "none" };

  if (reservation.payment.escrow.status !== "reserved") {
    return { ok: false, skipped: true, reason: reservation.payment.escrow.status };
  }

  const payoutType = opts.payoutType || "route_payout";
  const amount = toMoney(reservation.payment.escrow.amount || reservation.pricing?.price || 0);

  // 1) Baixa o held do cliente
  const client = await User.findById(reservation.clientId);
  if (client) {
    client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
    client.wallet.held = toMoney(Math.max(0, Number(client.wallet.held || 0) - amount));
    client.wallet.transactions = client.wallet.transactions || [];
    client.wallet.transactions.push({
      type: "release",
      amount,
      description: `Pagamento liberado da ${reservationLabel(reservation, opts)}`,
      referenceId: String(reservation._id),
      createdAt: new Date(),
    });
    await client.save();
  }

  // 2) Credita o motorista (driverPayout), idempotente por id+tipo
  const driverId = reservation.driverId;
  const payout = toMoney(reservation.pricing?.driverPayout || 0);
  if (driverId && payout > 0) {
    const driver = await User.findById(driverId);
    if (driver) {
      driver.wallet = driver.wallet || { balance: 0, held: 0, transactions: [] };
      driver.wallet.transactions = driver.wallet.transactions || [];
      const already = driver.wallet.transactions.some(
        (t) => t?.referenceId === String(reservation._id) && t?.type === payoutType,
      );
      if (!already) {
        driver.wallet.balance = toMoney(Number(driver.wallet.balance || 0) + payout);
        driver.wallet.transactions.push({
          type: payoutType,
          amount: payout,
          description: `Repasse da ${reservationLabel(reservation, opts)}`,
          referenceId: String(reservation._id),
          createdAt: new Date(),
        });
        await driver.save();
      }
    }
  }

  reservation.payment.escrow.status = "released";
  reservation.payment.escrow.releasedAt = new Date();

  return { ok: true, amount, payout };
}

async function refundReservation(reservation, opts = {}) {
  reservation.payment = reservation.payment || {};
  reservation.payment.escrow = reservation.payment.escrow || { status: "none" };

  if (reservation.payment.escrow.status !== "reserved") {
    return { ok: false, skipped: true, reason: reservation.payment.escrow.status };
  }

  const amount = toMoney(reservation.payment.escrow.amount || 0);

  const client = await User.findById(reservation.clientId);
  if (client) {
    client.wallet = client.wallet || { balance: 0, held: 0, transactions: [] };
    client.wallet.held = toMoney(Math.max(0, Number(client.wallet.held || 0) - amount));
    client.wallet.balance = toMoney(Number(client.wallet.balance || 0) + amount);
    client.wallet.transactions = client.wallet.transactions || [];
    client.wallet.transactions.push({
      type: "refund_hold",
      amount,
      description: `Estorno LevaPay da ${reservationLabel(reservation, opts)}`,
      referenceId: String(reservation._id),
      createdAt: new Date(),
    });
    await client.save();
  }

  reservation.payment.escrow.status = "refunded";
  reservation.payment.escrow.refundedAt = new Date();

  return { ok: true, refunded: amount };
}

module.exports = {
  reserve,
  release,
  refund,
  addPendingDebt,
  creditDriver,
  debitDriver,
  settlePendingDebt,
  settleFailedDelivery,
  toMoney,
  reserveOrder,
  releaseOrder,
  refundOrder,
  reserveReservation,
  releaseReservation,
  refundReservation,
  // Frete sob demanda (T3) — reaproveita o mesmo escrow com label/payout próprios.
  reserveFreight: (doc) => reserveReservation(doc, { label: "frete" }),
  releaseFreight: (doc) => releaseReservation(doc, { label: "frete", payoutType: "freight_payout" }),
  refundFreight: (doc) => refundReservation(doc, { label: "frete" }),
};
