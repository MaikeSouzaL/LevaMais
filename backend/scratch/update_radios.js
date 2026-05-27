const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Solicitar entrega (delivery_open)
// Find lines: io.to(`driver-${driver.driverId}`).emit(\n              "new-ride-request",\n              buildRideRequestPayload(ride, {\n                distanceToPickup,\n                clientRidesCount,\n              }),\n            );
const targetDispatch = `            io.to(\`driver-\${driver.driverId}\`).emit(
              "new-ride-request",
              buildRideRequestPayload(ride, {
                distanceToPickup,
                clientRidesCount,
              }),
            );`;

const replaceDispatch = `            const payload = buildRideRequestPayload(ride, {
              distanceToPickup,
              clientRidesCount,
            });
            io.to(\`driver-\${driver.driverId}\`).emit("new-ride-request", payload);
            if (ride.serviceType === "delivery") {
              io.to(\`driver-\${driver.driverId}\`).emit("delivery_open", payload);
            }`;

if (content.includes('"new-ride-request"')) {
  // Let's replace the 4 standard occurrences of new-ride-request
  
  // Occurrence 1: line 455
  content = content.replace(
    /io\.to\(`driver-\${driver\.driverId}`\)\.emit\(\s*"new-ride-request",\s*buildRideRequestPayload\(ride,\s*\{\s*distanceToPickup,\s*clientRidesCount,\s*\}\),\s*\);/g,
    replaceDispatch
  );

  // Occurrence 2: line 1593
  content = content.replace(
    /io\.to\(`driver-\${next\.driverId}`\)\.emit\(\s*"new-ride-request",\s*buildRideRequestPayload\(ride,\s*\{\s*distanceToPickup:\s*0,\s*clientRidesCount\s*\}\)\s*\);/g,
    `const payloadNext = buildRideRequestPayload(ride, { distanceToPickup: 0, clientRidesCount });
          io.to(\`driver-\${next.driverId}\`).emit("new-ride-request", payloadNext);
          if (ride.serviceType === "delivery") {
            io.to(\`driver-\${next.driverId}\`).emit("delivery_open", payloadNext);
          }`
  );

  // Occurrence 3: line 1823
  content = content.replace(
    /io\.to\(`driver-\${driverId}`\)\.emit\(\s*"new-ride-request",\s*buildRideRequestPayload\(ride,\s*\{\s*distanceToPickup,\s*clientRidesCount\s*\}\)\s*\);/g,
    `const payloadDr = buildRideRequestPayload(ride, { distanceToPickup, clientRidesCount });
          io.to(\`driver-\${driverId}\`).emit("new-ride-request", payloadDr);
          if (ride.serviceType === "delivery") {
            io.to(\`driver-\${driverId}\`).emit("delivery_open", payloadDr);
          }`
  );

  // Occurrence 4: line 2062
  content = content.replace(
    /io\.to\(`driver-\${ride\.driverId\?\._id\s*\|\|\s*ride\.driverId}`\)\.emit\(\s*"new-ride-request",\s*buildRideRequestPayload\(ride,\s*\{\s*distanceToPickup:\s*0\s*\}\)\s*\);/g,
    `const payloadAssigned = buildRideRequestPayload(ride, { distanceToPickup: 0 });
        io.to(\`driver-\${ride.driverId?._id || ride.driverId}\`).emit("new-ride-request", payloadAssigned);
        if (ride.serviceType === "delivery") {
          io.to(\`driver-\${ride.driverId?._id || ride.driverId}\`).emit("delivery_open", payloadAssigned);
        }`
  );
}

// 2. Aceitar entrega (delivery_accepted)
const targetAccept = `        io.to(\`client-\${ride.clientId._id}\`).emit("driver-found", {
          rideId: ride._id,
          driver: {
            id: ride.driverId._id,
            name: ride.driverId.name,
            phone: ride.driverId.phone,
            profilePhoto: ride.driverId.profilePhoto,
            rating: ride.driverId.rating,
            lat: driverLocation?.location?.coordinates[1],
            lng: driverLocation?.location?.coordinates[0],
          },
        });`;

const replaceAccept = `        const acceptPayload = {
          rideId: ride._id,
          driver: {
            id: ride.driverId._id,
            name: ride.driverId.name,
            phone: ride.driverId.phone,
            profilePhoto: ride.driverId.profilePhoto,
            rating: ride.driverId.rating,
            lat: driverLocation?.location?.coordinates[1],
            lng: driverLocation?.location?.coordinates[0],
          },
        };
        io.to(\`client-\${ride.clientId._id}\`).emit("driver-found", acceptPayload);
        if (ride.serviceType === "delivery") {
          io.to(\`client-\${ride.clientId._id}\`).emit("delivery_accepted", acceptPayload);
        }`;

content = content.replace(
  /io\.to\(`client-\${ride\.clientId\._id}`\)\.emit\("driver-found",\s*\{\s*rideId:\s*ride\._id,\s*driver:\s*\{\s*id:\s*ride\.driverId\._id,[\s\S]*?\}\s*\}\);/g,
  replaceAccept
);

// 3. Cancelar entrega (delivery_cancelled)
// Emitted under activeTimeout, paymentExpired, manualCancel, clientTimeout
// Replace io.to(`client-${clientId}`).emit("ride-cancelled", ...
content = content.replace(
  /io\.to\(`client-\${clientId}`\)\.emit\(\s*"ride-cancelled",\s*\{\s*rideId:\s*ride\._id,\s*reason:\s*"no_driver_found",\s*\}\s*\);/g,
  `const cancelPayload1 = { rideId: ride._id, reason: "no_driver_found" };
              io.to(\`client-\${clientId}\`).emit("ride-cancelled", cancelPayload1);
              if (ride.serviceType === "delivery") {
                io.to(\`client-\${clientId}\`).emit("delivery_cancelled", cancelPayload1);
              }`
);

content = content.replace(
  /io\.to\(`driver-\${driver\.driverId}`\)\.emit\(\s*"ride-cancelled",\s*\{\s*rideId:\s*ride\._id,\s*reason:\s*"tempo_limite_esgotado",\s*\}\s*\);/g,
  `const cancelPayload2 = { rideId: ride._id, reason: "tempo_limite_esgotado" };
                  io.to(\`driver-\${driver.driverId}\`).emit("ride-cancelled", cancelPayload2);
                  if (ride.serviceType === "delivery") {
                    io.to(\`driver-\${driver.driverId}\`).emit("delivery_cancelled", cancelPayload2);
                  }`
);

content = content.replace(
  /io\.to\("driver-"\s*\+\s*previousDriverId\)\.emit\(\s*"ride-cancelled",\s*\{\s*rideId:\s*ride\._id,\s*reason:\s*"tempo_pagamento_expirado"\s*\}\s*\);/g,
  `const cancelPayload3 = { rideId: ride._id, reason: "tempo_pagamento_expirado" };
            io.to("driver-" + previousDriverId).emit("ride-cancelled", cancelPayload3);
            if (ride.serviceType === "delivery") {
              io.to("driver-" + previousDriverId).emit("delivery_cancelled", cancelPayload3);
            }`
);

content = content.replace(
  /io\.to\(`\${targetType}-\${targetId}`\)\.emit\("ride-cancelled",\s*\{\s*rideId:\s*ride\._id,\s*cancelledBy:\s*isClient\s*\?\s*"client"\s*:\s*"driver",\s*reason,\s*cancellationFee,\s*\}\);/g,
  `const cancelPayload4 = {
            rideId: ride._id,
            cancelledBy: isClient ? "client" : "driver",
            reason,
            cancellationFee,
          };
          io.to(\`\${targetType}-\${targetId}\`).emit("ride-cancelled", cancelPayload4);
          if (ride.serviceType === "delivery") {
            io.to(\`\${targetType}-\${targetId}\`).emit("delivery_cancelled", cancelPayload4);
          }`
);

content = content.replace(
  /io\.emit\("ride-cancelled",\s*\{\s*rideId:\s*ride\._id,\s*cancelledBy:\s*"client",\s*reason:\s*"cancelamento_pre_aceite"\s*\}\s*\);/g,
  `const cancelPayload5 = {
            rideId: ride._id,
            cancelledBy: "client",
            reason: "cancelamento_pre_aceite"
          };
          io.emit("ride-cancelled", cancelPayload5);
          if (ride.serviceType === "delivery") {
            io.emit("delivery_cancelled", cancelPayload5);
          }`
);

// 4. Negociar entrega (delivery_negotiated)
content = content.replace(
  /io\.to\(`client-\${resolvedClientId}`\)\.emit\("ride-offers-updated",\s*\{\s*rideId:\s*ride\._id\s*\}\);/g,
  `io.to(\`client-\${resolvedClientId}\`).emit("ride-offers-updated", { rideId: ride._id });
          if (ride.serviceType === "delivery") {
            io.to(\`client-\${resolvedClientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_received" });
          }`
);

content = content.replace(
  /io\.to\(`client-\${resolvedClientId}`\)\.emit\("ride-offers-updated",\s*\{\s*rideId:\s*ride\._id,\s*status:\s*"expired"\s*\}\);/g,
  `io.to(\`client-\${resolvedClientId}\`).emit("ride-offers-updated", { rideId: ride._id, status: "expired" });
            if (ride.serviceType === "delivery") {
              io.to(\`client-\${resolvedClientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_expired" });
            }`
);

content = content.replace(
  /io\.to\(`client-\${ride\.clientId\._id\s*\|\|\s*ride\.clientId}`\)\.emit\("ride-offer-selected",\s*\{\s*rideId:\s*ride\._id,\s*driverId\s*\}\);/g,
  `io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride-offer-selected", { rideId: ride._id, driverId });
          if (ride.serviceType === "delivery") {
            io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "offer_selected", driverId });
          }`
);

content = content.replace(
  /io\.to\(`client-\${clientId}`\)\.emit\("ride-offers-updated",\s*\{\s*rideId:\s*ride\._id\s*\}\);/g,
  `io.to(\`client-\${clientId}\`).emit("ride-offers-updated", { rideId: ride._id });
        if (ride.serviceType === "delivery") {
          io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_received" });
        }`
);

content = content.replace(
  /io\.to\(`client-\${clientId}`\)\.emit\("driver-accepted-offer",\s*\{\s*rideId:\s*ride\._id,\s*driverId\s*\}\);/g,
  `io.to(\`client-\${clientId}\`).emit("driver-accepted-offer", { rideId: ride._id, driverId });
          if (ride.serviceType === "delivery") {
            io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_accepted", driverId });
          }`
);

content = content.replace(
  /io\.to\(`driver-\${driverId}`\)\.emit\("client-counter-proposal",\s*\{\s*rideId:\s*ride\._id\s*\}\);/g,
  `io.to(\`driver-\${driverId}\`).emit("client-counter-proposal", { rideId: ride._id });
        if (ride.serviceType === "delivery") {
          io.to(\`driver-\${driverId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "counter_proposal" });
        }`
);

content = content.replace(
  /io\.to\(`client-\${ride\.clientId\._id\s*\|\|\s*ride\.clientId}`\)\.emit\("ride-offer-selected",\s*\{\s*rideId:\s*ride\._id,\s*driverId:\s*selectedDriverId\s*\}\);/g,
  `io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride-offer-selected", { rideId: ride._id, driverId: selectedDriverId });
        if (ride.serviceType === "delivery") {
          io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "offer_selected", driverId: selectedDriverId });
        }`
);

content = content.replace(
  /io\.to\(`client-\${clientId}`\)\.emit\("ride-offers-updated",\s*\{\s*rideId\s*\}\);/g,
  `io.to(\`client-\${clientId}\`).emit("ride-offers-updated", { rideId });
          if (ride.serviceType === "delivery") {
            io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId, action: "proposal_rejected" });
          }`
);

content = content.replace(
  /io\.to\(`driver-\${driverId}`\)\.emit\("ride-offer-rejected-by-client",\s*\{\s*rideId\s*\}\);/g,
  `io.to(\`driver-\${driverId}\`).emit("ride-offer-rejected-by-client", { rideId });
          if (ride.serviceType === "delivery") {
            io.to(\`driver-\${driverId}\`).emit("delivery_negotiated", { rideId, action: "proposal_rejected" });
          }`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully added dedicated websocket radio channels to backend ride controller!');
