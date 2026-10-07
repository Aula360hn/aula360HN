const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'www', 'aula360.html');
let html = fs.readFileSync(filePath, 'utf8');

html = html.replace(/cuadro_sace\.js\?v=[^"'\s>]+/, 'cuadro_sace.js?v=2026.10.04.20');
html = html.replace(/app\.js\?v=[^"'\s>]+/, 'app.js?v=2026.10.04.20');
html = html.replace(/style\.css\?v=[^"'\s>]+/, 'style.css?v=2026.10.04.20');
html = html.replace(/ui\.js\?v=[^"'\s>]+/, 'ui.js?v=2026.10.04.20');

fs.writeFileSync(filePath, html, 'utf8');
console.log('[bump_versions] Cache versions updated to v2026.10.04.20 in www/aula360.html');
