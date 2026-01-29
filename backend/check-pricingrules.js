require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.db.collection('pricingrules');

  const count = await col.countDocuments();
  console.log('📊 TOTAL PRICING RULES:', count);

  const byVehicle = await col
    .aggregate([
      { $group: { _id: '$vehicleCategory', count: { $sum: 1 }, active: { $sum: { $cond: ['$active', 1, 0] } } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  console.log('\n🚗 POR CATEGORIA:');
  byVehicle.forEach((x) => console.log(`  - ${x._id}: ${x.count} (active=${x.active})`));

  const byCity = await col
    .aggregate([
      { $group: { _id: '$cityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])
    .toArray();
  console.log('\n🏙️ TOP cityId:');
  byCity.forEach((x) => console.log(`  - ${x._id}: ${x.count}`));

  // sample motorcycles
  const sampleMoto = await col.find({ vehicleCategory: 'motorcycle', active: true }).limit(5).toArray();
  console.log('\n🏍️ SAMPLE motorcycle active:', JSON.stringify(sampleMoto, null, 2));

  await mongoose.disconnect();
})().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
