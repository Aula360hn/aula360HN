const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'www', 'aula360.html');
let html = fs.readFileSync(filePath, 'utf8');

// Fix the extra closing </div> between gdhn-brand and side-menu
const badSection = `<div class="brand-text">
                    <div class="brand-hl-text">
                        <span class="brand-hl-aula">Aula</span><span class="brand-hl-360">360</span><span class="brand-hl-hn">HN</span>
                    </div>
                </div>
            </div>
            
            
            </div>
            <nav class="gdhn-menu" id="side-menu">`;

const goodSection = `<div class="brand-text">
                    <div class="brand-hl-text">
                        <span class="brand-hl-aula">Aula</span><span class="brand-hl-360">360</span><span class="brand-hl-hn">HN</span>
                    </div>
                </div>
            </div>
            <nav class="gdhn-menu" id="side-menu">`;

if (html.includes(badSection)) {
    html = html.replace(badSection, goodSection);
    console.log('[fix_dom] Extra </div> removed successfully!');
} else {
    // Regex fallback
    html = html.replace(/<\/div>\s*<\/div>\s*<nav class="gdhn-menu"/, '</div>\n            <nav class="gdhn-menu"');
    console.log('[fix_dom] Regex fallback applied.');
}

// Bump cache buster to v2026.10.04.18
html = html.replace(/style\.css\?v=[^"'\s>]+/, 'style.css?v=2026.10.04.18');
html = html.replace(/ui\.js\?v=[^"'\s>]+/, 'ui.js?v=2026.10.04.18');

fs.writeFileSync(filePath, html, 'utf8');
console.log('[fix_dom] www/aula360.html saved with v2026.10.04.18');
