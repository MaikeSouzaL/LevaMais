const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/controllers/ride.controller.js');
const content = fs.readFileSync(file, 'utf8');

const index = content.indexOf('driver-found');
if (index >= 0) {
  console.log('FOUND INDEX:', index);
  // Get snippet around the index
  const start = index - 300;
  const snippet = content.substring(start, start + 800);
  console.log('--- SNIPPET TEXT ---');
  console.log(snippet);
  console.log('--- END SNIPPET ---');
} else {
  console.error('NOT FOUND driver-found');
}
