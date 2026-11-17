const fs = require('fs');
const path = require('path');

const root = __dirname;
const www = path.join(root, 'www');
const githubDir = path.join(root, '_SUBIR_A_GITHUB');
const androidPublic = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public');

[www, githubDir, androidPublic].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Lista de archivos JS, HTML, CSS y assets principales
const filesToCopy = [
    'aula360.html',
    'index.html',
    'sace_logic.js',
    'reportes.js',
    'crypto-js.min.js',
    'pizarra_studio.html',
    'pizarra_studio.js',
    'style.css',
    'student_avatars.js',
  'app_greeting.js',
    'diagnosticas_catalog.js',
    'app.js',
    'libreria.js',
    'pizarra360.js',
    'bitacora.js',
        'banco_rubricas.js',
    'evaluacion_v2.js',
    'rid.js',
    'cuadro_sace.js',
    'pruebas_diagnosticas.js',
    'pruebas_formativas.js',
    'banco_curricular.js',
    'formalizacion.js',
    'honduras_geo.js',
    'normativas_sace.js',
    'auto_backup.js',
    'store.js',
    'router.js',
    'ui.js',
    'conducta.js',
    'mazo_juez.png',
    'sace.js',
    'google_script.gs',
    'google_sheets_sync.js',
    'equipos_trabajo.js',
    'organizacion_grado.js',
    'escritura_inteligente.js',
    'reporte_parcial.js',
    'ai.js',
    'tutor_360.js',
    'sw.js',
    'manifest.json',
    'logo.png',
    'logo-192.png',
    'logo-512.png',
    'splash-logo.png',
    'logotipo_horizontal.svg',
    'assistant_avatar.jpg',
    'assistant_avatar_base.jpg',
    'assistant_avatar_wink.jpg',
    'assistant_avatar_head.png',
    'assistant_avatar_head_base.png',
    'assistant_avatar_head_wink.png',
    'xlsx.full.min.js',
    'lucide.min.js',
    'chart.min.js',
    'sweetalert2.all.min.js',
    'html2pdf.bundle.min.js',
    'pdf.min.js',
    'pdf.worker.min.js',
    'html2canvas.min.js',
    'README.md',
    'package.json',
    'capacitor.config.json',
    'build_www.js',
    'update_aula.js'
];

let copiedWww = 0;
let copiedGithub = 0;
let copiedAndroid = 0;

filesToCopy.forEach(file => {
    const src = path.join(root, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(www, file));
        copiedWww++;
        fs.copyFileSync(src, path.join(githubDir, file));
        copiedGithub++;
        fs.copyFileSync(src, path.join(androidPublic, file));
        copiedAndroid++;
    }
});

// Sincronizar el index.html optimizado desde www si existe aula360.html
const aulaHtml = path.join(www, 'aula360.html');
if (fs.existsSync(aulaHtml)) {
    fs.copyFileSync(aulaHtml, path.join(githubDir, 'index.html'));
    fs.copyFileSync(aulaHtml, path.join(androidPublic, 'index.html'));
    fs.copyFileSync(aulaHtml, path.join(www, 'index.html'));
}

// Copiar carpetas assets e icons si existen
['assets', 'icons'].forEach(dir => {
    const srcDir = path.join(root, dir);
    if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, path.join(www, dir), { recursive: true });
        fs.cpSync(srcDir, path.join(githubDir, dir), { recursive: true });
        fs.cpSync(srcDir, path.join(androidPublic, dir), { recursive: true });
    }
});

console.log(`[build_www] ${copiedWww} archivos copiados a www/, ${copiedGithub} a _SUBIR_A_GITHUB/ y ${copiedAndroid} a Android Assets`);


