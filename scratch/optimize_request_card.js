const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'screens', '(authenticated)', 'Driver', 'components', 'DriverRequestCard.tsx');
console.log('Target file:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('File not found!');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Substituições universais de altura e border-radius dos botões
content = content.replace(/height:\s*56,?/g, 'height: 46,');
content = content.replace(/borderRadius:\s*16,?/g, 'borderRadius: 12,');

// Botão de Contraoferta (altura 44 e marginTop 8)
content = content.replace(
  'marginTop: 8,\n                height: 46,\n                borderRadius: 12,',
  'marginTop: 8,\n                height: 44,\n                borderRadius: 12,'
);
// Caso tenha quebra de linha CRLF
content = content.replace(
  'marginTop: 8,\r\n                height: 46,\r\n                borderRadius: 12,',
  'marginTop: 8,\r\n                height: 44,\r\n                borderRadius: 12,'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('DriverRequestCard styling optimized successfully with CRLF-proof logic!');
