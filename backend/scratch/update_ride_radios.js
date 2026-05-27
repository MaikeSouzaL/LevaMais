const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Solicitar Corrida (ride_open)
// In occurrence 1:
content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`driver-\${driver\.driverId}`\)\.emit\("delivery_open", payload\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
              io.to(\`driver-\${driver.driverId}\`).emit("delivery_open", payload);
            } else {
              io.to(\`driver-\${driver.driverId}\`).emit("ride_open", payload);
            }`
);

// In occurrence 2 (next.driverId):
content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`driver-\${next\.driverId}`\)\.emit\("delivery_open", payloadNext\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`driver-\${next.driverId}\`).emit("delivery_open", payloadNext);
          } else {
            io.to(\`driver-\${next.driverId}\`).emit("ride_open", payloadNext);
          }`
);

// In occurrence 3 (driverId):
content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`driver-\${driverId}`\)\.emit\("delivery_open", payloadDr\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`driver-\${driverId}\`).emit("delivery_open", payloadDr);
          } else {
            io.to(\`driver-\${driverId}\`).emit("ride_open", payloadDr);
          }`
);

// In occurrence 4 (assigned):
content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`driver-\${ride\.driverId\?\._id \|\| ride\.driverId}`\)\.emit\("delivery_open", payloadAssigned\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
          io.to(\`driver-\${ride.driverId?._id || ride.driverId}\`).emit("delivery_open", payloadAssigned);
        } else {
          io.to(\`driver-\${ride.driverId?._id || ride.driverId}\`).emit("ride_open", payloadAssigned);
        }`
);

// 2. Aceitar Corrida (ride_accepted)
content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${ride\.clientId\._id}`\)\.emit\("delivery_accepted", acceptPayload\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
          io.to(\`client-\${ride.clientId._id}\`).emit("delivery_accepted", acceptPayload);
        } else {
          io.to(\`client-\${ride.clientId._id}\`).emit("ride_accepted", acceptPayload);
        }`
);

// 3. Cancelar Corrida (ride_cancelled)
content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${clientId}`\)\.emit\("delivery_cancelled", cancelPayload1\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
                io.to(\`client-\${clientId}\`).emit("delivery_cancelled", cancelPayload1);
              } else {
                io.to(\`client-\${clientId}\`).emit("ride_cancelled", cancelPayload1);
              }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`driver-\${driver\.driverId}`\)\.emit\("delivery_cancelled", cancelPayload2\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
                    io.to(\`driver-\${driver.driverId}\`).emit("delivery_cancelled", cancelPayload2);
                  } else {
                    io.to(\`driver-\${driver.driverId}\`).emit("ride_cancelled", cancelPayload2);
                  }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\("driver-" \+ previousDriverId\)\.emit\("delivery_cancelled", cancelPayload3\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
              io.to("driver-" + previousDriverId).emit("delivery_cancelled", cancelPayload3);
            } else {
              io.to("driver-" + previousDriverId).emit("ride_cancelled", cancelPayload3);
            }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`\${targetType}-\${targetId}`\)\.emit\("delivery_cancelled", cancelPayload4\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`\${targetType}-\${targetId}\`).emit("delivery_cancelled", cancelPayload4);
          } else {
            io.to(\`\${targetType}-\${targetId}\`).emit("ride_cancelled", cancelPayload4);
          }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.emit\("delivery_cancelled", cancelPayload5\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.emit("delivery_cancelled", cancelPayload5);
          } else {
            io.emit("ride_cancelled", cancelPayload5);
          }`
);

// 4. Negociar Corrida (ride_negotiated)
content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${resolvedClientId}`\)\.emit\("delivery_negotiated", \{\s*rideId:\s*ride\._id,\s*action:\s*"proposal_received"\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`client-\${resolvedClientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_received" });
          } else {
            io.to(\`client-\${resolvedClientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_received" });
          }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${resolvedClientId}`\)\.emit\("delivery_negotiated", \{\s*rideId:\s*ride\._id,\s*action:\s*"proposal_expired"\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
              io.to(\`client-\${resolvedClientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_expired" });
            } else {
              io.to(\`client-\${resolvedClientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_expired" });
            }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${ride\.clientId\._id\s*\|\|\s*ride\.clientId}`\)\.emit\("delivery_negotiated", \{\s*rideId:\s*ride\._id,\s*action:\s*"offer_selected",\s*driverId\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "offer_selected", driverId });
          } else {
            io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "offer_selected", driverId });
          }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${clientId}`\)\.emit\("delivery_negotiated", \{\s*rideId:\s*ride\._id,\s*action:\s*"proposal_received"\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
          io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_received" });
        } else {
          io.to(\`client-\${clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_received" });
        }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${clientId}`\)\.emit\("delivery_negotiated", \{\s*rideId:\s*ride\._id,\s*action:\s*"proposal_accepted",\s*driverId\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "proposal_accepted", driverId });
          } else {
            io.to(\`client-\${clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "proposal_accepted", driverId });
          }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`driver-\${driverId}`\)\.emit\("delivery_negotiated", \{\s*rideId:\s*ride\._id,\s*action:\s*"counter_proposal"\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
          io.to(\`driver-\${driverId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "counter_proposal" });
        } else {
          io.to(\`driver-\${driverId}\`).emit("ride_negotiated", { rideId: ride._id, action: "counter_proposal" });
        }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${ride\.clientId\._id\s*\|\|\s*ride\.clientId}`\)\.emit\("delivery_negotiated", \{\s*rideId:\s*ride\._id,\s*action:\s*"offer_selected",\s*driverId:\s*selectedDriverId\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
          io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("delivery_negotiated", { rideId: ride._id, action: "offer_selected", driverId: selectedDriverId });
        } else {
          io.to(\`client-\${ride.clientId._id || ride.clientId}\`).emit("ride_negotiated", { rideId: ride._id, action: "offer_selected", driverId: selectedDriverId });
        }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`client-\${clientId}`\)\.emit\("delivery_negotiated", \{\s*rideId,\s*action:\s*"proposal_rejected"\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`client-\${clientId}\`).emit("delivery_negotiated", { rideId, action: "proposal_rejected" });
          } else {
            io.to(\`client-\${clientId}\`).emit("ride_negotiated", { rideId, action: "proposal_rejected" });
          }`
);

content = content.replace(
  /if \(ride\.serviceType === "delivery"\) \{\s*io\.to\(`driver-\${driverId}`\)\.emit\("delivery_negotiated", \{\s*rideId,\s*action:\s*"proposal_rejected"\s*\}\);\s*\}/g,
  `if (ride.serviceType === "delivery") {
            io.to(\`driver-\${driverId}\`).emit("delivery_negotiated", { rideId, action: "proposal_rejected" });
          } else {
            io.to(\`driver-\${driverId}\`).emit("ride_negotiated", { rideId, action: "proposal_rejected" });
          }`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully added dedicated ride websocket radio channels to backend ride controller!');
