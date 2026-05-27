const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
let content = fs.readFileSync(file, 'utf8');

const key = 'io.to(`client-${ride.clientId._id}`).emit("driver-found"';
const index = content.indexOf(key);
if (index >= 0) {
  const etaIndex = content.indexOf('eta: ride.duration', index);
  if (etaIndex >= 0) {
    const closeBraceIndex = content.indexOf('}', etaIndex);
    if (closeBraceIndex >= 0) {
      const ioIndex = content.lastIndexOf('const io = req.app.get("io");', index);
      if (ioIndex >= 0) {
        const targetString = content.substring(ioIndex, closeBraceIndex + 1);
        console.log('FOUND TARGET STRING!');
        
        const replacement = `const io = req.app.get("io");
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
        
        content = content.replace(targetString, replacement);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Block C successfully updated using index-based lookup!');
      }
    }
  }
} else {
  console.error('Failed to find key!');
}
