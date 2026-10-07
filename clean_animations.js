const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'www', 'aula360.html');
let html = fs.readFileSync(filePath, 'utf8');

// Remove submenuSlideDown animation and keyframes from embedded styles
html = html.replace(/animation:\s*submenuSlideDown[^;]+;?/g, '');
html = html.replace(/@keyframes\s+submenuSlideDown\s*\{[^}]*\}/g, '');

// Bump cache busters
html = html.replace(/style\.css\?v=[^"'\s>]+/, 'style.css?v=2026.10.04.19');
html = html.replace(/ui\.js\?v=[^"'\s>]+/, 'ui.js?v=2026.10.04.19');

fs.writeFileSync(filePath, html, 'utf8');
console.log('[clean_animations] Success: Animations removed and bumped to v2026.10.04.19');
