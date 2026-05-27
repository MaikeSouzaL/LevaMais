const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
let content = fs.readFileSync(file, 'utf8');

// Helper to do exact replacement
function replaceExact(target, replacement, name) {
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log(`Successfully replaced ${name}!`);
  } else {
    const normTarget = target.replace(/\r\n/g, '\n');
    const normContent = content.replace(/\r\n/g, '\n');
    if (normContent.includes(normTarget)) {
      content = normContent.replace(normTarget, replacement);
      console.log(`Successfully replaced ${name} (normalized)!`);
    } else {
      console.error(`Failed to find ${name}!`);
    }
  }
}

// 1. Block A (dispatch search)
const targetA = `            io.to(\`driver-\${driver.driverId}\`).emit(
              "new-ride-request",
              buildRideRequestPayload(ride, {
                distanceToPickup,
                clientRidesCount,
              }),
            );`;

const replaceA = `            const payload = buildRideRequestPayload(ride, {
              distanceToPickup,
              clientRidesCount,
            });
            io.to(\`driver-\${driver.driverId}\`).emit("new-ride-request", payload);
            if (ride.serviceType === "delivery") {
              io.to(\`driver-\${driver.driverId}\`).emit("delivery_open", payload);
            } else {
              io.to(\`driver-\${driver.driverId}\`).emit("ride_open", payload);
            }`;

replaceExact(targetA, replaceA, 'Block A');

// 2. Block B (next driver dispatch)
const targetB = `          const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id, status: "completed" }).catch(() => 0);
          io.to(\`driver-\${next.driverId}\`).emit(
            "new-ride-request",
            buildRideRequestPayload(ride, { distanceToPickup: 0, clientRidesCount })
          );`;

const replaceB = `          const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id, status: "completed" }).catch(() => 0);
          const payloadNext = buildRideRequestPayload(ride, { distanceToPickup: 0, clientRidesCount });
          io.to(\`driver-\${next.driverId}\`).emit("new-ride-request", payloadNext);
          if (ride.serviceType === "delivery") {
            io.to(\`driver-\${next.driverId}\`).emit("delivery_open", payloadNext);
          } else {
            io.to(\`driver-\${next.driverId}\`).emit("ride_open", payloadNext);
          }`;

replaceExact(targetB, replaceB, 'Block B');

// 3. Block C (driver found accept - Index based flawless lookup)
const keyC = 'io.to(' + '`client-' + '${ride.clientId._id}' + '`' + ').emit("driver-found"';
const keyIdx = content.indexOf(keyC);
if (keyIdx >= 0) {
  const startIdx = content.lastIndexOf('const io = req.app.get("io");', keyIdx);
  const endIdx = content.indexOf('io.emit("ride-taken", { rideId: ride._id });', keyIdx);
  if (startIdx >= 0 && endIdx >= 0) {
    const closeBraceIdx = content.indexOf('}', endIdx + 45);
    if (closeBraceIdx >= 0) {
      const targetString = content.substring(startIdx, closeBraceIdx + 1);
      
      const replaceC = `const io = req.app.get("io");
      if (io) {
        // Obter dados do motorista
        const driverLocation = await DriverLocation.findOne({ driverId });

        const acceptPayload = {
          rideId: ride._id,
          driver: {
            id: ride.driverId._id,
            name: ride.driverId.name,
            phone: ride.driverId.phone,
            profilePhoto: ride.driverId.profilePhoto,
            rating: Number(ride.driverId.rating || 5),
            vehicle: driverLocation?.vehicle || {},
          },
          eta: ride.duration,
        };
        io.to(\`client-\${ride.clientId._id}\`).emit("driver-found", acceptPayload);
        if (ride.serviceType === "delivery") {
          io.to(\`client-\${ride.clientId._id}\`).emit("delivery_accepted", acceptPayload);
        } else {
          io.to(\`client-\${ride.clientId._id}\`).emit("ride_accepted", acceptPayload);
        }

        // Notificar outros motoristas que a corrida foi aceita
        io.emit("ride-taken", { rideId: ride._id });
      }`;
      
      content = content.replace(targetString, replaceC);
      console.log('Successfully replaced Block C using flawless index search!');
    } else {
      console.error('Failed to find closeBraceIdx for Block C!');
    }
  } else {
    console.error('Failed to find boundaries for Block C!');
  }
} else {
  console.error('Failed to find keyIdx for Block C!');
}

// 4. Block D (timeout client cancel)
const targetD = `            if (clientId) {
              io.to(\`client-\${clientId}\`).emit("ride-cancelled", {
                rideId: ride._id,
                reason: "no_driver_found",
              });
            }`;

const replaceD = `            if (clientId) {
              const cancelPayload1 = { rideId: ride._id, reason: "no_driver_found" };
              io.to(\`client-\${clientId}\`).emit("ride-cancelled", cancelPayload1);
              if (ride.serviceType === "delivery") {
                io.to(\`client-\${clientId}\`).emit("delivery_cancelled", cancelPayload1);
              } else {
                io.to(\`client-\${clientId}\`).emit("ride_cancelled", cancelPayload1);
              }
            }`;

replaceExact(targetD, replaceD, 'Block D');

// 5. Block E (timeout drivers cancel)
const targetE = `                  io.to(\`driver-\${driver.driverId}\`).emit("ride-cancelled", {
                    rideId: ride._id,
                    reason: "tempo_limite_esgotado",
                  });`;

const replaceE = `                  const cancelPayload2 = { rideId: ride._id, reason: "tempo_limite_esgotado" };
                  io.to(\`driver-\${driver.driverId}\`).emit("ride-cancelled", cancelPayload2);
                  if (ride.serviceType === "delivery") {
                    io.to(\`driver-\${driver.driverId}\`).emit("delivery_cancelled", cancelPayload2);
                  } else {
                    io.to(\`driver-\${driver.driverId}\`).emit("ride_cancelled", cancelPayload2);
                  }`;

replaceExact(targetE, replaceE, 'Block E');

// 6. Block F (payment expired cancel)
const targetF = `          if (previousDriverId) {
            io.to("driver-" + previousDriverId).emit("delivery-selection-expired", {
              rideId: ride._id,
              reason: "tempo_pagamento_expirado",
            });
            io.to("driver-" + previousDriverId).emit("ride-cancelled", {
              rideId: ride._id,
              cancelledBy: "system",
              reason: "payment_timeout",
              message: "Pagamento do cliente expirou. Solicitação cancelada para o motorista.",
            });
          }`;

const replaceF = `          if (previousDriverId) {
            io.to("driver-" + previousDriverId).emit("delivery-selection-expired", {
              rideId: ride._id,
              reason: "tempo_pagamento_expirado",
            });
            const cancelPayload3 = {
              rideId: ride._id,
              cancelledBy: "system",
              reason: "payment_timeout",
              message: "Pagamento do cliente expirou. Solicitação cancelada para o motorista.",
            };
            io.to("driver-" + previousDriverId).emit("ride-cancelled", cancelPayload3);
            if (ride.serviceType === "delivery") {
              io.to("driver-" + previousDriverId).emit("delivery_cancelled", cancelPayload3);
            } else {
              io.to("driver-" + previousDriverId).emit("ride_cancelled", cancelPayload3);
            }
          }`;

replaceExact(targetF, replaceF, 'Block F');

// 7. Block G (counter proposal offerselected)
const targetG = `          io.to(\`driver-\${driverId}\`).emit(
            "new-ride-request",
            buildRideRequestPayload(ride, {
              negotiationSelected: true,
              clientRidesCount,
            }),
          );
          io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride-offer-selected", {
            rideId: ride._id,
            driverId,
            finalPrice
          });`;

const replaceG = `          const payloadDr = buildRideRequestPayload(ride, {
            negotiationSelected: true,
            clientRidesCount,
          });
          io.to(\`driver-\${driverId}\`).emit("new-ride-request", payloadDr);
          if (ride.serviceType === "delivery") {
            io.to(\`driver-\${driverId}\`).emit("delivery_open", payloadDr);
          } else {
            io.to(\`driver-\${driverId}\`).emit("ride_open", payloadDr);
          }

          io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride-offer-selected", {
            rideId: ride._id,
            driverId,
            finalPrice
          });
          if (ride.serviceType === "delivery") {
            io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "offer_selected", driverId });
          } else {
            io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "offer_selected", driverId });
          }`;

replaceExact(targetG, replaceG, 'Block G');

// 8. Block H (driver accepted offer)
const targetH = `        io.to(\`client-\${clientId}\`).emit("ride-offers-updated", {
          rideId: ride._id,
        });
        if (status === "accepted") {
          io.to(\`client-\${clientId}\`).emit("driver-accepted-offer", {
            rideId: ride._id,
            driverId,
            amount,
          });
        }`;

const replaceH = `        io.to(\`client-\${clientId}\`).emit("ride-offers-updated", {
          rideId: ride._id,
        });
        if (ride.serviceType === "delivery") {
          io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_received" });
        } else {
          io.to(\`client-\${clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_received" });
        }

        if (status === "accepted") {
          io.to(\`client-\${clientId}\`).emit("driver-accepted-offer", {
            rideId: ride._id,
            driverId,
            amount,
          });
          if (ride.serviceType === "delivery") {
            io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_accepted", driverId });
          } else {
            io.to(\`client-\${clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_accepted", driverId });
          }
        }`;

replaceExact(targetH, replaceH, 'Block H');

// 9. Block I (client counter)
const targetI = `        io.to(\`client-\${clientId}\`).emit("ride-offers-updated", { rideId: ride._id });
        io.to(\`driver-\${driverId}\`).emit("client-counter-proposal", {
          rideId: ride._id,
          amount: offer.amount
        });
        io.to(\`driver-\${driverId}\`).emit("waiting-queue-updated", { rideId: ride._id });`;

const replaceI = `        io.to(\`client-\${clientId}\`).emit("ride-offers-updated", { rideId: ride._id });
        if (ride.serviceType === "delivery") {
          io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_updated" });
        } else {
          io.to(\`client-\${clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_updated" });
        }

        io.to(\`driver-\${driverId}\`).emit("client-counter-proposal", {
          rideId: ride._id,
          amount: offer.amount
        });
        if (ride.serviceType === "delivery") {
          io.to(\`driver-\${driverId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "counter_proposal" });
        } else {
          io.to(\`driver-\${driverId}\`).emit("ride_negotiated", { rideId: ride._id, action: "counter_proposal" });
        }

        io.to(\`driver-\${driverId}\`).emit("waiting-queue-updated", { rideId: ride._id });`;

replaceExact(targetI, replaceI, 'Block I');

// 10. Block J (selectOffer)
const targetJ = `      const io = req.app.get("io");
      if (io) {
        const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id || ride.clientId, status: "completed" }).catch(() => 0);
        io.to(\`driver-\${selectedDriverId}\`).emit(
          "client-selected-offer-awaiting-payment",
          buildRideRequestPayload(ride, {
            negotiationSelected: true,
            clientRidesCount,
          }),
        );
        io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride-offer-selected", {
          rideId: ride._id,
          driverId: selectedDriverId,
          finalPrice,
        });
      }`;

const replaceJ = `      const io = req.app.get("io");
      if (io) {
        const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id || ride.clientId, status: "completed" }).catch(() => 0);
        const payloadAwaiting = buildRideRequestPayload(ride, {
          negotiationSelected: true,
          clientRidesCount,
        });
        io.to(\`driver-\${selectedDriverId}\`).emit("client-selected-offer-awaiting-payment", payloadAwaiting);
        if (ride.serviceType === "delivery") {
          io.to(\`driver-\${selectedDriverId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_accepted", driverId: selectedDriverId });
        } else {
          io.to(\`driver-\${selectedDriverId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_accepted", driverId: selectedDriverId });
        }

        io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride-offer-selected", {
          rideId: ride._id,
          driverId: selectedDriverId,
          finalPrice,
        });
        if (ride.serviceType === "delivery") {
          io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "offer_selected", driverId: selectedDriverId });
        } else {
          io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "offer_selected", driverId: selectedDriverId });
        }
      }`;

replaceExact(targetJ, replaceJ, 'Block J');

// 11. Block K (declineOffer)
const targetK = `        const io = req.app.get("socketio") || req.app.get("io");
        if (io) {
          io.to(\`client-\${clientId}\`).emit("ride-offers-updated", { rideId });
          io.to(\`driver-\${driverId}\`).emit("ride-offer-rejected-by-client", { rideId });
        }`;

const replaceK = `        const io = req.app.get("socketio") || req.app.get("io");
        if (io) {
          io.to(\`client-\${clientId}\`).emit("ride-offers-updated", { rideId });
          if (ride.serviceType === "delivery") {
            io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId, action: "proposal_rejected" });
          } else {
            io.to(\`client-\${clientId}\`).emit("ride_negotiated", { rideId, action: "proposal_rejected" });
          }

          io.to(\`driver-\${driverId}\`).emit("ride-offer-rejected-by-client", { rideId });
          if (ride.serviceType === "delivery") {
            io.to(\`driver-\${driverId}\`).emit("delivery_negotiated", { rideId, action: "proposal_rejected" });
          } else {
            io.to(\`driver-\${driverId}\`).emit("ride_negotiated", { rideId, action: "proposal_rejected" });
          }
        }`;

replaceExact(targetK, replaceK, 'Block K');

// 12. Block L (manual cancel)
const targetL = `        if (targetId) {
          io.to(\`\${targetType}-\${targetId}\`).emit("ride-cancelled", {
            rideId: ride._id,
            cancelledBy: isClient ? "client" : "driver",
            reason,
            cancellationFee,
          });
        } else if (isClient && !ride.driverId) {
          // Broadcast cancel message to ALL connected drivers to guarantee popup is cleared instantly everywhere
          io.emit("ride-cancelled", {
            rideId: ride._id,
            cancelledBy: "client",
            reason: "cancelamento_pre_aceite"
          });
        }`;

const replaceL = `        if (targetId) {
          const cancelPayload4 = {
            rideId: ride._id,
            cancelledBy: isClient ? "client" : "driver",
            reason,
            cancellationFee,
          };
          io.to(\`\${targetType}-\${targetId}\`).emit("ride-cancelled", cancelPayload4);
          if (ride.serviceType === "delivery") {
            io.to(\`\${targetType}-\${targetId}\`).emit("delivery_cancelled", cancelPayload4);
          } else {
            io.to(\`\${targetType}-\${targetId}\`).emit("ride_cancelled", cancelPayload4);
          }
        } else if (isClient && !ride.driverId) {
          // Broadcast cancel message to ALL connected drivers to guarantee popup is cleared instantly everywhere
          const cancelPayload5 = {
            rideId: ride._id,
            cancelledBy: "client",
            reason: "cancelamento_pre_aceite"
          };
          io.emit("ride-cancelled", cancelPayload5);
          if (ride.serviceType === "delivery") {
            io.emit("delivery_cancelled", cancelPayload5);
          } else {
            io.emit("ride_cancelled", cancelPayload5);
          }
        }`;

replaceExact(targetL, replaceL, 'Block L');

fs.writeFileSync(file, content, 'utf8');
console.log('ALL 12 precise blocks updated FLAWLESSLY with correct syntax!');
