const fs = require('fs');
const path = require('path');

const root = __dirname;
const www = path.join(root, 'www');

if (!fs.existsSync(www)) {
    fs.mkdirSync(www, { recursive: true });
}

// Lista de archivos JS, HTML, CSS y assets principales
const filesToCopy = [
    'index.html',
    'pizarra_studio.html',
    'pizarra_studio.js',
    'style.css',
    'app.js',
    'libreria.js',
    'pizarra360.js',
    'bitacora.js',
    'notas_rapidas.js',
    'banco_rubricas.js',
    'evaluacion_v2.js',
    'rid.js',
    'cuadro_sace.js',
    'pruebas_diagnosticas.js',
    'pruebas_formativas.js',
    'banco_curricular.js',
    'formalizacion.js',
    'seed_rubricas.js',
    'store.js',
    'router.js',
    'ui.js',
    'sace.js',
    'google_script.gs',
    'google_sheets_sync.js',
    'equipos_trabajo.js',
    'escritura_inteligente.js',
    'reporte_parcial.js',
    'ai.js',
    'sw.js',
    'manifest.json',
    'logo.png',
    'logo-192.png',
    'logo-512.png',
    'splash-logo.png',
    'logotipo_horizontal.svg',
    'xlsx.full.min.js',
    'lucide.min.js'
];

let copied = 0;
filesToCopy.forEach(file => {
    const src = path.join(root, file);
    const dest = path.join(www, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        copied++;
    }
});

// Copiar carpetas assets e icons si existen
['assets', 'icons'].forEach(dir => {
    const srcDir = path.join(root, dir);
    const destDir = path.join(www, dir);
    if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, destDir, { recursive: true });
    }
});

console.log(`[build_www] ${copied} archivos copiados exitosamente a www/`);
