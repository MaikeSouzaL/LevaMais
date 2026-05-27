const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Block A replacement
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

if (content.includes(targetA)) {
  content = content.replace(targetA, replaceA);
  console.log('Replaced Block A!');
} else {
  console.error('Block A not found!');
}

// 2. Block C replacement
const targetC = `      // Notificar cliente via WebSocket
      const io = req.app.get("io");
      if (io) {
        // Obter dados do motorista
        const driverLocation = await DriverLocation.findOne({ driverId });

        io.to(\`client-\${ride.clientId._id}\`).emit("driver-found", {
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
        });
      }`;

const replaceC = `      // Notificar cliente via WebSocket
      const io = req.app.get("io");
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
      }`;

if (content.includes(targetC)) {
  content = content.replace(targetC, replaceC);
  console.log('Replaced Block C!');
} else {
  console.error('Block C not found!');
}

// 3. Block E replacement
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

if (content.includes(targetE)) {
  content = content.replace(targetE, replaceE);
  console.log('Replaced Block E!');
} else {
  console.error('Block E not found!');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Remaining blocks successfully updated!');
