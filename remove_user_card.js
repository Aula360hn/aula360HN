const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'www', 'aula360.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Remove the entire sidebar-user-card block
const userCardRegex = /<div class="sidebar-user-card"[\s\S]*?<\/div>\s*<\/div>/;
if (userCardRegex.test(html)) {
    html = html.replace(userCardRegex, '');
    console.log('[remove_user_card] Bloque sidebar-user-card eliminado de aula360.html');
}

// Also hide it via CSS just in case
if (!html.includes('.sidebar-user-card { display: none !important; }')) {
    html = html.replace('</style>', `    .sidebar-user-card { display: none !important; }\n    </style>`);
}

// 2. Bump cache version to v2026.10.04.17
html = html.replace(/style\.css\?v=[^"'\s>]+/, 'style.css?v=2026.10.04.17');
html = html.replace(/ui\.js\?v=[^"'\s>]+/, 'ui.js?v=2026.10.04.17');

fs.writeFileSync(filePath, html, 'utf8');
console.log('[remove_user_card] Guardado exitosamente con versión v2026.10.04.17');
