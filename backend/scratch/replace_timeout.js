const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
let content = fs.readFileSync(file, 'utf8');

const target = `            activeOffers.length === 0`;

if (!content.includes('activeOffers.length === 0')) {
  console.log('Target string NOT found in file!');
  process.exit(1);
}

// Replace the activeOffers.length === 0 check to just true (or remove it)
// We will replace:
// !updatedRide.isWaitingInQueue &&
// activeOffers.length === 0 // 🛡️ Only cancel if no negotiations are currently active!
// with just:
// !updatedRide.isWaitingInQueue

content = content.replace(
  /!\s*updatedRide\.isWaitingInQueue\s*&&\s*activeOffers\.length\s*===\s*0[^\n]*/g,
  '!updatedRide.isWaitingInQueue'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully replaced negotiation shield from search timeout!');
