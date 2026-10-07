const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'www', 'aula360.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Sidebar height and menu container flex rules
html = html.replace(/\.gdhn-sidebar\s*\{[^}]*width:\s*256px;[^}]*\}/, `.gdhn-sidebar {
            width: 256px;
            height: 100vh !important;
            max-height: 100vh !important;
            background: linear-gradient(180deg, #1A1D27 0%, #1E2235 100%);
            border-right: none;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            z-index: 20;
            box-shadow: 2px 0 16px rgba(0, 0, 0, 0.15);
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden !important;
        }`);

// Replace .gdhn-menu and its webkit-scrollbar blocks
const menuCssRegex = /(#side-menu,\s*)?\.gdhn-menu\s*\{[^}]*\}[\s\S]*?\.gdhn-menu::-webkit-scrollbar-thumb:(hover|active)\s*\{[^}]*\}/;
const newMenuCss = `#side-menu,
        .gdhn-menu {
            flex: 1 1 auto;
            min-height: 0 !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            padding: 12px 8px 48px 10px !important;
            display: flex;
            flex-direction: column;
            gap: 2px;
            touch-action: pan-y !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior-y: contain !important;
            scroll-behavior: smooth !important;
            scrollbar-width: auto !important; 
            scrollbar-color: #64748b rgba(0, 0, 0, 0.45) !important; 
        }
        #side-menu::-webkit-scrollbar,
        .gdhn-menu::-webkit-scrollbar { 
            width: 14px !important; 
            display: block !important;
        }
        #side-menu::-webkit-scrollbar-track,
        .gdhn-menu::-webkit-scrollbar-track { 
            background: rgba(0, 0, 0, 0.45) !important; 
            border-radius: 10px !important; 
            margin: 6px 2px !important; 
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        #side-menu::-webkit-scrollbar-thumb,
        .gdhn-menu::-webkit-scrollbar-thumb { 
            background: #64748b !important; 
            border-radius: 10px !important; 
            border: 2px solid #1A1D27 !important; 
            min-height: 52px !important;
            cursor: grab !important;
        }
        #side-menu::-webkit-scrollbar-thumb:hover,
        #side-menu::-webkit-scrollbar-thumb:active,
        .gdhn-menu::-webkit-scrollbar-thumb:hover,
        .gdhn-menu::-webkit-scrollbar-thumb:active { 
            background: #00C853 !important; 
            cursor: grabbing !important;
        }
        .sidebar-scroll-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(0, 0, 0, 0.25);
            font-size: 11px;
            color: rgba(255, 255, 255, 0.35);
            flex-shrink: 0;
            z-index: 10;
        }
        .sidebar-scroll-btn {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: rgba(255, 255, 255, 0.85);
            width: 32px;
            height: 30px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }
        .sidebar-scroll-btn:hover {
            background: var(--primary);
            color: #ffffff;
            border-color: var(--primary);
            transform: scale(1.06);
        }
        .sidebar-scroll-btn:active {
            transform: scale(0.94);
        }
        .sidebar-scroll-btn i,
        .sidebar-scroll-btn svg {
            width: 16px;
            height: 16px;
        }
        .gdhn-sidebar.collapsed:not(.hover-expanded) .sidebar-scroll-bar {
            display: none !important;
        }`;

if (menuCssRegex.test(html)) {
    html = html.replace(menuCssRegex, newMenuCss);
} else {
    // Fallback replacement
    html = html.replace(/\.gdhn-menu\s*\{[^}]*\}/, newMenuCss);
}

html = html.replace(/\.gdhn-sidebar\.collapsed\.hover-expanded\s+\.gdhn-menu\s*\{[^}]*\}/, `.gdhn-sidebar.collapsed.hover-expanded .gdhn-menu {
        align-items: stretch !important;
        padding: 12px 8px 48px 10px !important;
        overflow-y: auto !important;
        min-height: 0 !important;
        scrollbar-width: auto !important;
        scrollbar-color: #64748b rgba(0, 0, 0, 0.45) !important;
    }`);

html = html.replace(/\.gdhn-sidebar\.collapsed\s+\.gdhn-menu\s*\{[^}]*\}/, `.gdhn-sidebar.collapsed .gdhn-menu {
            padding: 12px 8px 40px 8px !important;
            align-items: center;
            min-height: 0 !important;
        }`);

// Replace sidebar-footer with sidebar-scroll-bar in HTML structure
const footerRegex = /<div class="sidebar-footer">[\s\S]*?<\/div>/;
const newFooterHtml = `<div class="sidebar-scroll-bar">
                <button type="button" class="sidebar-scroll-btn" onclick="document.getElementById('side-menu').scrollBy({top: -220, behavior: 'smooth'})" title="Desplazar hacia arriba">
                    <i data-lucide="chevron-up"></i>
                </button>
                <span class="sidebar-scroll-label" style="font-size:11px;font-weight:600;opacity:0.6;">&copy; 2026 Offline</span>
                <button type="button" class="sidebar-scroll-btn" onclick="document.getElementById('side-menu').scrollBy({top: 220, behavior: 'smooth'})" title="Desplazar hacia abajo">
                    <i data-lucide="chevron-down"></i>
                </button>
            </div>`;

if (footerRegex.test(html)) {
    html = html.replace(footerRegex, newFooterHtml);
}

// Update cache busters to current timestamp
const nowVer = '2026.10.06.' + Math.floor(Date.now() / 1000);
html = html.replace(/style\.css\?v=[^"'\s>]+/, 'style.css?v=' + nowVer);
html = html.replace(/ui\.js\?v=[^"'\s>]+/, 'ui.js?v=' + nowVer);
html = html.replace(/app\.js\?v=[^"'\s>]+/, 'app.js?v=' + nowVer);

fs.writeFileSync(filePath, html, 'utf8');
console.log(`[update_aula] Success: www/aula360.html updated with tactile scrollbar, scroll buttons and v=${nowVer}`);
