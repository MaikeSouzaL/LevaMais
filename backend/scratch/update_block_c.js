const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
let content = fs.readFileSync(file, 'utf8');

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

// Let's replace the escaped backticks with real backticks for search
const targetCReal = targetC.replace(/\\`/g, '`').replace(/\\\$/g, '$');

if (content.includes(targetCReal)) {
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

  const replaceCReal = replaceC.replace(/\\`/g, '`').replace(/\\\$/g, '$');

  content = content.replace(targetCReal, replaceCReal);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully replaced Block C using exact real backticks match!');
} else {
  // Let's check with normalized newlines
  const targetCNorm = targetCReal.replace(/\r\n/g, '\n');
  const contentNorm = content.replace(/\r\n/g, '\n');
  if (contentNorm.includes(targetCNorm)) {
    const replaceCNorm = replaceC.replace(/\\`/g, '`').replace(/\\\$/g, '$').replace(/\r\n/g, '\n');
    content = contentNorm.replace(targetCNorm, replaceCNorm);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully replaced Block C using normalized real backticks match!');
  } else {
    console.error('Failed to match Block C even with real backticks!');
  }
}
