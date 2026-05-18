require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const pricingConfigCol = mongoose.connection.db.collection('pricingconfigs');
  const platformConfigCol = mongoose.connection.db.collection('platformconfigs');
  
  const pricingConfig = await pricingConfigCol.findOne();
  const platformConfig = await platformConfigCol.findOne();
  
  console.log('📋 PRICING CONFIG (Global):', JSON.stringify(pricingConfig, null, 2));
  console.log('\n⚙️ PLATFORM CONFIG:', JSON.stringify(platformConfig, null, 2));
  
  await mongoose.disconnect();
})().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
