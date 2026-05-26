const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/levamais';
console.log('Connecting to Mongo:', mongoUri);

async function checkActiveRides() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB!');

    const Ride = mongoose.model('Ride', new mongoose.Schema({}, { strict: false }));
    const DriverLocation = mongoose.model('DriverLocation', new mongoose.Schema({}, { strict: false }));

    const requestingRides = await Ride.find({
      status: { $in: ['requesting', 'driver_assigned'] }
    });

    console.log(`Found ${requestingRides.length} rides with status requesting/driver_assigned:`);
    for (const r of requestingRides) {
      console.log('====================================');
      console.log('ID:', r._id);
      console.log('Status:', r.get('status'));
      console.log('VehicleType:', r.get('vehicleType'));
      console.log('ServiceType:', r.get('serviceType'));
      console.log('ClientId:', r.get('clientId'));
      console.log('DriverId:', r.get('driverId'));
      console.log('RequestedAt:', r.get('requestedAt'));
      console.log('CreatedAt:', r.get('createdAt'));
      console.log('isWaitingInQueue:', r.get('isWaitingInQueue'));
      console.log('rejectedBy:', JSON.stringify(r.get('rejectedBy')));
      console.log('negotiation:', JSON.stringify(r.get('negotiation')));
    }

    const driverLocations = await DriverLocation.find({});
    console.log('\n====================================');
    console.log(`Found ${driverLocations.length} driver locations:`);
    for (const dl of driverLocations) {
      console.log('DriverId:', dl.get('driverId'));
      console.log('Status:', dl.get('status'));
      console.log('VehicleType:', dl.get('vehicleType'));
      console.log('ServiceTypes:', JSON.stringify(dl.get('serviceTypes')));
      console.log('currentRideId:', dl.get('currentRideId'));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkActiveRides();
