const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'www', 'aula360.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Reemplazar el bloque erróneo de submenú en los estilos embebidos
const targetStart = '.gdhn-sidebar:not(.collapsed) .sidebar-submenu-items';
const targetEnd = '/* --- ANIMACIÓN Y EFECTOS HOVER DINÁMICOS CON GLOW DE COLOR --- */';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const replacementCss = `
        .sidebar-submenu-wrapper {
            width: 100% !important;
            position: relative !important;
        }

        .sidebar-submenu-items {
            display: none !important;
            padding-left: 28px !important;
            padding-top: 2px !important;
            padding-bottom: 4px !important;
            flex-direction: column !important;
            gap: 2px !important;
            width: 100% !important;
        }

        .sidebar-submenu-items.open {
            display: flex !important;
            animation: submenuSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @keyframes submenuSlideDown {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .submenu-chevron {
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .submenu-parent-btn.open .submenu-chevron {
            transform: rotate(180deg) !important;
        }

        .sidebar-submenu-wrapper button.gdhn-nav-item.submenu-child-btn {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            padding: 7px 12px !important;
            border-radius: 8px !important;
            font-size: 12.5px !important;
            font-weight: 500 !important;
            color: rgba(255, 255, 255, 0.65) !important;
            width: 100% !important;
            transition: all 0.2s ease !important;
            text-align: left !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .sidebar-submenu-wrapper button.gdhn-nav-item.submenu-child-btn:hover {
            background: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
            transform: translateX(3px) !important;
        }

        .sidebar-submenu-wrapper button.gdhn-nav-item.submenu-child-btn.active {
            background: rgba(0, 200, 83, 0.15) !important;
            color: #2DD4BF !important;
            font-weight: 700 !important;
        }

        `;
    content = content.substring(0, startIndex) + replacementCss + content.substring(endIndex);
    console.log('[fix_html] Bloque 1 de estilos reemplazado con éxito.');
} else {
    console.warn('[fix_html] No se encontró el bloque 1.');
}

// 2. Reemplazar la regla que forzaba display:flex en collapsed
const collapsedTarget = '.gdhn-sidebar.collapsed .sidebar-submenu-items';
const collapsedIndex = content.indexOf(collapsedTarget);
if (collapsedIndex !== -1) {
    const braceClose = content.indexOf('}', collapsedIndex);
    if (braceClose !== -1) {
        const replacementCollapsed = `.gdhn-sidebar.collapsed:not(.hover-expanded) .sidebar-submenu-items {\n            display: none !important;\n        }`;
        content = content.substring(0, collapsedIndex) + replacementCollapsed + content.substring(braceClose + 1);
        console.log('[fix_html] Bloque 2 (collapsed submenu) reemplazado con éxito.');
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('[fix_html] Archivo guardado correctamente.');
