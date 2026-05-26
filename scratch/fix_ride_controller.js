const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backend', 'src', 'controllers', 'ride.controller.js');
console.log('Modifying file:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('File not found!');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// 1. Encontrar o início e fim da query a partir de "negotiation.offers.driverId" até .populate
const startMarker = '"negotiation.offers.driverId": { $ne: new mongoose.Types.ObjectId(driverId) },';
const endMarker = '.populate("clientId", "name phone profilePhoto rating");';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  console.log('Found query markers! Removing requestedAt filter to keep active offers visible permanently...');
  
  const originalBlock = content.substring(startIndex, endIndex + endMarker.length);
  const simplifiedBlock = `"negotiation.offers.driverId": { $ne: new mongoose.Types.ObjectId(driverId) },\n        $and: [\n          {\n            $or: [\n              { status: "requesting", driverId: null },\n              { status: "driver_assigned", driverId },\n            ],\n          },\n          { "rejectedBy.driverId": { $ne: driverId } },\n        ],\n      })\n        .sort({ requestedAt: -1 })\n        .limit(30)\n        .populate("clientId", "name phone profilePhoto rating");`;
  
  content = content.replace(originalBlock, simplifiedBlock);
  console.log('Query simplified and requestedAt filter removed successfully!');
} else {
  console.error('Markers not found in file!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Modification completed successfully!');
