const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
const content = fs.readFileSync(file, 'utf8');

const index = content.indexOf('const driverLocation = await DriverLocation.findOne({ driverId });');
if (index >= 0) {
  console.log('FOUND INDEX:', index);
  const snippet = content.substring(index, index + 600);
  console.log('SNIPPET CHARCODES:');
  for (let i = 0; i < snippet.length; i++) {
    const char = snippet[i];
    const code = snippet.charCodeAt(i);
    // Print first 100 charcodes to find newlines or weird chars
    if (i < 150) {
      console.log(`${i}: '${char}' (${code})`);
    }
  }
  console.log('--- SNIPPET TEXT ---');
  console.log(snippet);
  console.log('--- END SNIPPET ---');
} else {
  console.error('NOT FOUND const driverLocation = ...');
}
