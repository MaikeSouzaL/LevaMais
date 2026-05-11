const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/leva-mais');
    console.log('Connected to DB');

    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.model('UserAudit', userSchema);

    const users = await User.find().sort({ createdAt: -1 }).limit(5);
    
    console.log('--- LATEST USERS ---');
    users.forEach((u, i) => {
      console.log(`User ${i+1}: Name=[${u.name}] Email=[${u.email}] Type=[${u.userType}] DriverStatus=[${u.driverStatus}] CreatedAt=[${u.createdAt}]`);
    });
    console.log('---------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err);
    process.exit(1);
  }
}

checkUsers();
