// ==========================================================================
// MÓDULO LIBRERÍA READER (GDHN)
// Descripción: Gestor y lector de PDFs y documentos, simulando un "Librera Reader".
// Características: Lupa, Multi-página (1-4), Lector a voz, Organización por carpetas, etc.
// ==========================================================================

window.Libreria = {
    triggerFilePicker: function () {
        const u = document.getElementById('pdf-uploader');
        if (u) u.click();
    },
    state: {
        libros: [], // Lista de archivos PDF (metadatos)
        vistaActual: 'todas',
        lectorAbierto: false,
        libroActual: null,
        pdfDoc: null,
        pageNum: 1,
        pageRendering: false,
        pageNumPending: null,
        scale: 1.0,
        layout: 1, // 1, 2, 3, 4 páginas
        isSpeaking: false,
        ttsUtterance: null,
        synth: window.speechSynthesis,
        viewMode: 'grid', // 'grid' | 'list'
        sortBy: 'date',   // 'date' | 'name' | 'size'
        searchQuery: '',

        // Pizarra Blanca (Whiteboard)
        drawMode: 'none',   // 'pen', 'highlighter', 'eraser', 'text', 'note', 'image', 'none'
        drawColor: '#ef4444', // red default
        drawSize: 3,
        isDrawing: false,
        undoStack: {},  // { [pageNum]: [{canvasData, htmlData}, ...] }
        redoStack: {}   // { [pageNum]: [{canvasData, htmlData}, ...] }
    },

    ensurePdfJs: async function () {
        if (window.pdfjsLib) return true;
        return new Promise(resolve => {
            let attempt = 0;
            const check = setInterval(() => {
                attempt++;
                if (window.pdfjsLib || attempt > 25) { // max 5 segundos
                    clearInterval(check);
                    resolve(!!window.pdfjsLib);
                }
            }, 200);
        });
    },

    db: {
        instance: null,
        connect: function () {
            return new Promise((resolve, reject) => {
                if (this.instance) return resolve(this.instance);
                const req = indexedDB.open('GdhnLibreriaDB', 4);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('pdfs')) {
                        db.createObjectStore('pdfs', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('notes')) {
                        db.createObjectStore('notes', { keyPath: 'id' }); // id: bookId_pageNum
                    }
                    if (!db.objectStoreNames.contains('teacher_notes')) {
                        db.createObjectStore('teacher_notes', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('teacher_bookmarks')) {
                        db.createObjectStore('teacher_bookmarks', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('teacher_resources')) {
                        db.createObjectStore('teacher_resources', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('teacher_history')) {
                        db.createObjectStore('teacher_history', { keyPath: 'id' });
                    }
                };
                req.onsuccess = (e) => {
                    this.instance = e.target.result;
                    resolve(this.instance);
                };
                req.onerror = (e) => reject(e);
            });
        },
        savePdf: async function (id, base64Data) {
            const db = await this.connect();
            return new Promise((resolve, reject) => {
                const txn = db.transaction('pdfs', 'readwrite');
                const store = txn.objectStore('pdfs');
                const req = store.put({ id: id, data: base64Data });
                req.onsuccess = () => resolve();
                req.onerror = (e) => reject(e);
            });
        },
        getPdf: async function (id) {
            const db = await this.connect();
            return new Promise((resolve, reject) => {
                const txn = db.transaction('pdfs', 'readonly');
                const store = txn.objectStore('pdfs');
                const req = store.get(id);
                req.onsuccess = (e) => resolve(e.target.result ? e.target.result.data : null);
                req.onerror = (e) => reject(e);
            });
        },
        saveNotes: async function (bookId, pageNum, data) {
            const db = await this.connect();
            return new Promise((resolve, reject) => {
                const txn = db.transaction('notes', 'readwrite');
                const store = txn.objectStore('notes');
                const req = store.put({ id: `${bookId}_${pageNum}`, data: data });
                req.onsuccess = () => resolve();
                req.onerror = (e) => reject(e);
            });
        },
        getNotes: async function (bookId, pageNum) {
            const db = await this.connect();
            return new Promise((resolve, reject) => {
                const txn = db.transaction('notes', 'readonly');
                const store = txn.objectStore('notes');
                const req = store.get(`${bookId}_${pageNum}`);
                req.onsuccess = (e) => resolve(e.target.result ? e.target.result.data : null);
                req.onerror = (e) => reject(e);
            });
        },
        saveGeneric: async function (storeName, id, data) {
            const db = await this.connect();
            return new Promise((resolve, reject) => {
                const txn = db.transaction(storeName, 'readwrite');
                const store = txn.objectStore(storeName);
                const req = store.put({ id: id, data: data });
                req.onsuccess = () => resolve();
                req.onerror = (e) => reject(e);
            });
        },
        getGeneric: async function (storeName, id) {
            const db = await this.connect();
            return new Promise((resolve, reject) => {
                const txn = db.transaction(storeName, 'readonly');
                const store = txn.objectStore(storeName);
                const req = store.get(id);
                req.onsuccess = (e) => resolve(e.target.result ? e.target.result.data : null);
                req.onerror = (e) => reject(e);
            });
        }
    },

    init: function () {
        // Cargar datos de localStorage
        const data = localStorage.getItem('gdhn_libreria');
        if (data) {
            try {
                this.state.libros = JSON.parse(data);
            } catch (e) {
                this.state.libros = [];
            }
        }

        // Agregar estilos al documento de forma que SIEMPRE se actualice
        let style = document.getElementById('libreria-styles');
        if (!style) {
            style = document.createElement('style');
            style.id = 'libreria-styles';
            document.head.appendChild(style);
        }
        style.textContent = `
                /* LIBRERIA STYLES AL ESTILO LIBRERA APP */
                .lib-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 12px; padding: 12px; }
                .lib-book { 
                    display: flex; flex-direction: column; background: #fff; 
                    border: 1px solid #e0e0e0; border-radius: 4px; 
                    overflow: hidden; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
                }
                .lib-book:hover { box-shadow: 0 4px 6px rgba(0,0,0,0.15); transform: translateY(-2px); }
                .lib-cover { height: 160px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 2px solid #e0e0e0; }
                .lib-cover-text { font-size: 13px; font-weight: bold; color: #444; text-align: center; padding: 8px; font-family: serif; word-break: break-word; }
                .lib-info { padding: 8px; display: flex; flex-direction: column; gap: 2px; position: relative; }
                .lib-title { font-size: 11px; font-weight: 500; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 4px; }
                .lib-meta { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #777; font-weight: bold; }
                .lib-actions { display: flex; align-items: center; gap: 4px; }
                .lib-actions i { width: 14px; height: 14px; color: #999; }
                
                /* VISTA DE LISTA */
                .lib-grid.list-view { display: flex; flex-direction: column; gap: 0; padding: 0; }
                .lib-grid.list-view .lib-book { flex-direction: row; height: 80px; align-items: center; padding: 0; border: none; border-bottom: 1px solid #e0e0e0; border-radius: 0; box-shadow: none; }
                .lib-grid.list-view .lib-book:hover { transform: none; background: #f9f9f9; }
                .lib-grid.list-view .lib-cover { height: 100%; width: 60px; border-bottom: none; border-right: 1px solid #eee; flex-shrink: 0; }
                .lib-grid.list-view .lib-info { flex: 1; padding: 0 12px; }
                
                /* TOOLBAR AL ESTILO LIBRERA */
                .lib-header-bar { background: #3b4282; color: #fff; display: flex; align-items: center; padding: 0 8px; height: 48px; }
                .lib-header-btn { background: transparent; border: none; color: #fff; height: 48px; padding: 0 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; opacity: 0.8; transition: opacity 0.2s; }
                .lib-header-btn.active { opacity: 1; border-bottom: 3px solid #fff; }
                .lib-header-btn i { width: 16px; height: 16px; }
                
                .lib-sub-toolbar { background: #f0f0f0; border-bottom: 1px solid #ddd; display: flex; align-items: center; padding: 6px 8px; gap: 8px; }
                .lib-search-container { flex: 1; display: flex; align-items: center; background: #fff; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; }
                .lib-search-input { flex: 1; border: none; padding: 6px 10px; font-size: 13px; outline: none; background: transparent; }
                .lib-search-count { font-size: 12px; color: #666; font-weight: bold; padding: 0 10px; background: #fff; border-left: 1px solid #eee; display: flex; align-items: center; justify-content: center; min-width: 40px; }
                .lib-sub-btn { background: #3b4282; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
                .lib-icon-btn { background: transparent; border: none; color: #3b4282; cursor: pointer; padding: 6px; display: grid; place-items: center; }
                
                /* READER STYLES */
                .reader-overlay { position: fixed; inset: 0; background: #060608; z-index: 9999; display: flex; flex-direction: column; color: #fff; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
                .reader-overlay.active { opacity: 1; pointer-events: auto; }
                
                /* ── HEADER ── */
                .reader-header { display: flex; align-items: center; justify-content: space-between; padding: calc(env(safe-area-inset-top, 0px) + 8px) 12px 8px 12px; background: rgba(10,10,14,0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.06); min-height: 54px; height: auto; flex-shrink: 0; flex-wrap: wrap; gap: 8px; }
                .reader-title { font-size: 12.5px; font-weight: 500; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 100%; color: rgba(255,255,255,0.45); letter-spacing: 0.03em; flex-shrink: 0; padding-top: 4px; }
                .reader-controls { display: flex; align-items: center; justify-content: flex-start; gap: 8px 5px; flex-wrap: wrap; flex: 1 1 100%; margin-left: 0; }

                /* ── BUTTON BASE ── */
                .reader-btn {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.55);
                    width: 36px; height: 36px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: grid; place-items: center;
                    font-size: 15px;
                    transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s, box-shadow 0.18s;
                    position: relative;
                    flex-shrink: 0;
                }
                .reader-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(255,255,255,0.22);
                    color: #fff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(0,0,0,0.5);
                }
                .reader-btn:active { transform: translateY(0); box-shadow: none; }

                /* ── BUTTON TEXT (pill) ── */
                .reader-btn-text {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 6px !important;
                    width: auto !important;
                    padding: 0 12px !important;
                    font-size: 12px !important;
                    font-weight: 600 !important;
                    letter-spacing: 0.02em !important;
                    border-radius: 10px !important;
                }

                /* ── MODE BUTTONS (Docente / Split / Explicar / Resolver) ── */
                .reader-btn.btn-mode-docente       { border-color: rgba(74,222,128,0.25); color: #6ee7a0; }
                .reader-btn.btn-mode-docente:hover { background: rgba(74,222,128,0.12); border-color: rgba(74,222,128,0.5); color: #4ade80; box-shadow: 0 0 16px rgba(74,222,128,0.2); }
                .reader-btn.btn-mode-docente.active{ background: rgba(74,222,128,0.18); border-color: #4ade80; color: #4ade80; box-shadow: 0 0 14px rgba(74,222,128,0.35); }

                .reader-btn.btn-mode-split       { border-color: rgba(167,139,250,0.25); color: #a78bfa; }
                .reader-btn.btn-mode-split:hover { background: rgba(167,139,250,0.12); border-color: rgba(167,139,250,0.5); color: #c4b5fd; box-shadow: 0 0 16px rgba(139,92,246,0.2); }
                .reader-btn.btn-mode-split.active{ background: rgba(167,139,250,0.18); border-color: #a78bfa; color: #c4b5fd; box-shadow: 0 0 14px rgba(139,92,246,0.35); }

                .reader-btn.btn-mode-explicar       { border-color: rgba(96,165,250,0.25); color: #93c5fd; }
                .reader-btn.btn-mode-explicar:hover { background: rgba(96,165,250,0.12); border-color: rgba(96,165,250,0.5); color: #60a5fa; box-shadow: 0 0 16px rgba(59,130,246,0.2); }

                .reader-btn.btn-mode-resolver       { border-color: rgba(251,191,36,0.22); color: #fcd34d; }
                .reader-btn.btn-mode-resolver:hover { background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.5); color: #fbbf24; box-shadow: 0 0 16px rgba(251,191,36,0.2); }

                /* ── IA GEMINI ── */
                .reader-btn.btn-ia-gemini       { border-color: rgba(251,191,36,0.3); color: #fcd34d; }
                .reader-btn.btn-ia-gemini:hover { background: rgba(251,191,36,0.12); border-color: rgba(251,191,36,0.55); color: #fbbf24; box-shadow: 0 0 18px rgba(251,191,36,0.25); }
                .reader-btn.btn-ia-gemini.active{ background: rgba(251,191,36,0.16); border-color: #fbbf24; color: #fde68a; box-shadow: 0 0 20px rgba(251,191,36,0.4); }

                /* TextLayer PDF.js */
                .textLayer { position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; opacity: 1; line-height: 1.0; }
                .textLayer > span { color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; }
                .textLayer ::selection { background: rgba(0,0,255, 0.3); }

                /* ── MODO LECTURA NOCTURNA Y PRESENTACIÓN ── */
                .reader-dark-mode canvas.reader-canvas { filter: invert(1) hue-rotate(180deg) brightness(0.95); }
                .reader-dark-mode .html-layer { filter: invert(1) hue-rotate(180deg); }
                
                .reader-overlay.presentation-mode-active .reader-header,
                .reader-overlay.presentation-mode-active .reader-footer,
                .reader-overlay.presentation-mode-active .wb-toggle-btn,
                .reader-overlay.presentation-mode-active .reader-wb-toolbar {
                    display: none !important;
                }
                .reader-overlay.presentation-mode-active .reader-body {
                    padding: 0 !important;
                    background: #060608 !important;
                }
                
                /* ── MINIMAPA ── */
                .reader-minimap { position: absolute; bottom: 80px; right: 20px; width: 160px; max-height: 200px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; z-index: 1000; overflow: hidden; display: none; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                .reader-minimap-content { position: relative; width: 100%; height: 100%; transform-origin: top left; }
                .reader-minimap-viewport { position: absolute; border: 2px solid #ef4444; background: rgba(239,68,68,0.2); pointer-events: auto; cursor: move; box-sizing: border-box; }
                .reader-minimap-preview { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 2px; padding: 4px; box-sizing: border-box; }
                .reader-minimap-page { background: #fff; width: 100%; border-radius: 2px; }


                /* ── EVIDENCIAS ── */
                .reader-btn.btn-evidencias       { border-color: rgba(236,72,153,0.25); color: #f9a8d4; }
                .reader-btn.btn-evidencias:hover { background: rgba(236,72,153,0.12); border-color: rgba(236,72,153,0.5); color: #ec4899; box-shadow: 0 0 16px rgba(236,72,153,0.2); }
                .reader-btn.btn-evidencias.active{ background: rgba(236,72,153,0.16); border-color: #ec4899; color: #f472b6; box-shadow: 0 0 18px rgba(236,72,153,0.35); }

                /* ── GUARDAR ── */
                .reader-btn.btn-guardar       { border-color: rgba(16,185,129,0.28); color: #6ee7b7; }
                .reader-btn.btn-guardar:hover { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.55); color: #10b981; box-shadow: 0 0 16px rgba(16,185,129,0.2); }

                /* ── REGRESAR ── */
                .reader-btn.btn-regresar       { border-color: rgba(239,68,68,0.25); color: #fca5a5; }
                .reader-btn.btn-regresar:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.5); color: #ef4444; box-shadow: 0 0 16px rgba(239,68,68,0.2); }

                .reader-controls-separator { width: 1px; height: 26px; background: rgba(255,255,255,0.1); margin: 0 3px; flex-shrink: 0; }

                /* ── EVIDENCIAS DROPDOWN ── */
                .ev-dropdown-dark { position:absolute; top:46px; right:0; background:rgba(18,18,24,0.96); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1px solid rgba(255,255,255,0.1); border-radius:14px; box-shadow:0 16px 48px rgba(0,0,0,0.8); display:none; flex-direction:column; width:240px; z-index:9999; overflow:hidden; }
                .ev-dropdown-dark.show { display:flex; }
                .ev-section-title { padding:8px 14px 6px; font-size:10px; font-weight:700; letter-spacing:0.1em; color:rgba(255,255,255,0.3); text-transform:uppercase; }
                .ev-dark-btn { display:flex; align-items:center; gap:10px; padding:10px 16px; border:none; background:transparent; color:rgba(255,255,255,0.7); font-size:13px; cursor:pointer; width:100%; text-align:left; transition:all 0.15s; }
                .ev-dark-btn:hover { background:rgba(255,255,255,0.07); color:#fff; }
                .ev-dark-btn i { width:15px; opacity:0.6; flex-shrink:0; }
                .reader-select { color: rgba(255,255,255,0.75) !important; background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 10px !important; padding: 0 28px 0 12px !important; font-size: 13px !important; height: 36px !important; width: auto !important; cursor: pointer !important; appearance: none !important; -webkit-appearance: none !important; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important; background-repeat: no-repeat !important; background-position: right 8px center !important; background-size: 14px !important; transition: all 0.18s ease; }
                .reader-select:hover { background-color: rgba(255,255,255,0.1) !important; color: #fff !important; border-color: rgba(255,255,255,0.25) !important; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
                .reader-select option { background: #111 !important; color: #eee !important; }
                
                .reader-body { flex: 1; overflow: auto; background: #1a1a1a; display: block; text-align: center; position: relative; padding: 20px; touch-action: pan-x pan-y; }
                
                .reader-pages-container { display: inline-flex; gap: 20px; flex-wrap: wrap; justify-content: center; perspective: 2000px; transform-style: preserve-3d; touch-action: pan-x pan-y; transform-origin: center top; margin: 0 auto; text-align: left; vertical-align: top; }
                .reader-canvas-wrapper { position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.5); background: #fff; transition: transform 0.3s ease-in, opacity 0.3s ease-in; }
                .reader-canvas { display: block; height: auto; }
                
                .turning-next .reader-canvas-wrapper { transform: translateX(-30px); opacity: 0; }
                .turning-prev .reader-canvas-wrapper { transform: translateX(30px); opacity: 0; }
                
                @keyframes in-next { 0% { transform: translateX(30px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
                @keyframes in-prev { 0% { transform: translateX(-30px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
                .in-from-next .reader-canvas-wrapper { animation: in-next 0.35s ease-out forwards; }
                .in-from-prev .reader-canvas-wrapper { animation: in-prev 0.35s ease-out forwards; }
                
                .reader-footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #111; border-top: 1px solid #333; height: 50px; position: relative; }
                .reader-progress-bar { position: absolute; top: -1px; left: 0; height: 2px; background: var(--primary); width: 0%; transition: width 0.3s ease; }
                .reader-page-info { font-size: 13px; font-variant-numeric: tabular-nums; display: flex; align-items: center; gap: 6px; }
                .modern-page-nav { display: flex; align-items: center; background: rgba(255,255,255,0.08); border-radius: 20px; padding: 4px 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.2); backdrop-filter: blur(4px); transition: border-color 0.2s; }
                .modern-page-nav:focus-within { border-color: #00C853; background: rgba(255,255,255,0.12); }
                .modern-page-input { background: transparent; border: none; color: #fff; text-align: right; width: 40px; font-size: 14px; font-weight: 600; outline: none; padding: 0; font-variant-numeric: tabular-nums; }
                .modern-page-input::-webkit-inner-spin-button, .modern-page-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                .modern-page-divider { color: rgba(255,255,255,0.4); margin: 0 8px; font-weight: 300; font-size: 15px; }
                .modern-page-total { color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums; }
                .reader-percent { background: rgba(0, 200, 83, 0.12); color: #4ADE80; border: 1px solid rgba(0, 200, 83, 0.3); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; margin-left: 8px; letter-spacing: 0.5px; }
                .reader-nav { display: flex; align-items: center; gap: 10px; }
                
                .reader-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(26,26,26,0.8); z-index: 10; font-size: 14px; color: #888; }
                
                /* Layout selector popover */
                .layout-popover { position: absolute; top: 50px; right: 80px; background: #222; border: 1px solid #444; border-radius: 8px; padding: 8px; display: none; flex-direction: column; gap: 4px; z-index: 10000; box-shadow: 0 10px 30px rgba(0,0,0,0.8); }
                .layout-popover.show { display: flex; }
                .layout-option { padding: 8px 16px; font-size: 12px; cursor: pointer; border-radius: 4px; transition: background 0.1s; }
                .layout-option:hover { background: #333; }
                .layout-option.active { background: #00C853; color: #fff; }

                /* WHITEBOARD (PIZARRA) STYLES */
                .wb-toggle-btn { position: absolute; top: 90px; left: 18px; background: rgba(15,23,42,0.85); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.12); width: 42px; height: 42px; border-radius: 50%; box-shadow: 0 4px 16px rgba(0,0,0,0.5); display: grid; place-items: center; z-index: 101; cursor: pointer; transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); }
                .wb-toggle-btn:hover { background: rgba(56,189,248,0.18); border-color: rgba(56,189,248,0.5); color: #38bdf8; box-shadow: 0 0 20px rgba(56,189,248,0.25); transform: scale(1.06); }
                .wb-toggle-btn.active { background: rgba(56,189,248,0.2); border-color: #38bdf8; color: #7dd3fc; box-shadow: 0 0 22px rgba(56,189,248,0.4); }
                .reader-wb-toolbar { position: absolute; top: 140px; left: 18px; background: rgba(10,12,20,0.88); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-radius: 14px; padding: 8px 6px; display: flex; flex-direction: column; gap: 5px; z-index: 100; box-shadow: 0 8px 32px rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.08); transition: opacity 0.28s, transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); transform-origin: top left; max-height: calc(100vh - 160px); overflow-y: auto; overflow-x: visible; scrollbar-width: none; }
                .reader-wb-toolbar::-webkit-scrollbar { display: none; }
                .reader-wb-toolbar.collapsed { opacity: 0; transform: scale(0.88) translateY(-18px); pointer-events: none; }
                .wb-btn { width: 34px; height: 34px; border-radius: 9px; background: transparent; color: rgba(255,255,255,0.5); border: 1px solid transparent; cursor: pointer; display: grid; place-items: center; transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1); position: relative; }
                .wb-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.15); color: #fff; transform: translateY(-1px); }
                .wb-btn:active { transform: translateY(0); }
                .wb-btn.active { background: rgba(56,189,248,0.18); border-color: rgba(56,189,248,0.6); color: #38bdf8; box-shadow: 0 0 12px rgba(56,189,248,0.3); }
                .wb-btn[title]:hover::after { content: attr(title); position: fixed; left: 72px; background: rgba(0,0,0,0.9); color: #fff; padding: 5px 10px; border-radius: 8px; font-size: 11px; white-space: nowrap; pointer-events: none; z-index: 99999; box-shadow: 0 4px 16px rgba(0,0,0,0.5); transform: translateY(-50%); margin-top: 17px; border: 1px solid rgba(255,255,255,0.1); }
                .wb-colors { display: flex; flex-direction: row; flex-wrap: wrap; width: 56px; justify-content: center; gap: 6px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; align-items: center; }
                .wb-color { width: 22px; height: 22px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.15s, box-shadow 0.15s; flex-shrink: 0; }
                .wb-color.active { border-color: #fff; transform: scale(1.18); box-shadow: 0 0 8px rgba(255,255,255,0.6); }
                
                .html-layer { position: absolute; top:0; left:0; right:0; bottom:0; pointer-events: none; overflow: hidden; }
                
                /* MEJORAS A CUADROS DE TEXTO Y NOTAS INTERACTIVAS */
                .wb-text-container { position: absolute; pointer-events: auto; display: inline-block; min-width: 150px; min-height: 60px; border: 1px dashed transparent; transition: border-color 0.2s; }
                .wb-text-container:hover, .wb-text-container:focus-within { border-color: rgba(0,0,0,0.3); background: rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .wb-text-box { width: 100%; height: 100%; min-height: 60px; padding: 28px 10px 10px 10px; box-sizing: border-box; outline: none; background: transparent; color: inherit; font-size: 18px; font-family: sans-serif; resize: both; overflow: auto; line-height: 1.3; font-weight: 500; border: none; text-shadow: 0 0 2px rgba(255,255,255,0.8); }
                .wb-text-drag-handle { position: absolute; top: 0; left: 0; right: 0; height: 24px; background: rgba(0,0,0,0.05); color: #555; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: move; opacity: 0; transition: opacity 0.2s; z-index: 5;}
                .wb-text-container:hover .wb-text-drag-handle { opacity: 1; }
                .wb-text-delete { position: absolute; top: 4px; right: 4px; background: #ef4444; color: #fff; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0; transition: opacity 0.2s; z-index: 10; }
                .wb-text-container:hover .wb-text-delete { opacity: 1; }
                
                .wb-note { position: absolute; pointer-events: auto; background: #FEF08A; color: #333; width: 160px; min-height: 140px; box-shadow: 2px 4px 12px rgba(0,0,0,0.25); font-size: 14px; font-family: "Comic Sans MS", cursive, sans-serif; resize: both; overflow: hidden; display: flex; flex-direction: column; z-index: 50; transition: box-shadow 0.2s; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; }
                .wb-note:focus-within { z-index: 200 !important; box-shadow: 4px 8px 24px rgba(0,0,0,0.35); }
                .wb-note-header { height: 26px; background: rgba(0,0,0,0.06); cursor: move; display: flex; align-items: center; justify-content: flex-end; padding: 0 4px; gap: 4px; }
                .wb-note-btn { width: 20px; height: 20px; display: grid; place-items: center; cursor: pointer; border-radius: 4px; background: transparent; font-size: 10px; font-weight: bold; border: none; transition: background 0.1s; }
                .wb-note-btn:hover { background: rgba(0,0,0,0.1); }
                .wb-note-clone { color: #3b82f6; font-size: 13px; }
                .wb-note-delete { color: #ef4444; font-size: 14px; }
                .wb-note-content { flex: 1; border: none; background: transparent; padding: 8px; width: 100%; box-sizing: border-box; resize: none; outline: none; font-family: inherit; font-size: inherit; color: inherit; line-height: 1.35; overflow-y: auto; }
                .wb-image-container { position: absolute; pointer-events: auto; display: inline-block; resize: both; overflow: hidden; min-width: 50px; min-height: 50px; outline: 1px dashed rgba(0,0,0,0.3); }
                .wb-image-container img { width: 100%; height: 100%; display: block; object-fit: cover; pointer-events: none; }
                .wb-img-drag-handle { position: absolute; top: 0; left: 0; right: 0; height: 24px; background: rgba(0,0,0,0.5); color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; cursor: move; opacity: 0; transition: opacity 0.2s; z-index: 5;}
                .wb-image-container:hover .wb-img-drag-handle { opacity: 1; }
                .wb-image-delete { position: absolute; top: 4px; right: 4px; background: #ef4444; color: #fff; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: bold; opacity: 0; transition: opacity 0.2s; z-index: 10; }
                .wb-image-container:hover .wb-image-delete { opacity: 1; }
                .drawing-layer { position: absolute; top: 0; left: 0; }
                
                /* MEJORAS AL SUBRAYADOR (HIGHLIGHT RECTANGLE - SERPIENTE LED) */
                @property --led-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
                .wb-hl-box { position: absolute; pointer-events: auto; mix-blend-mode: multiply; opacity: 0.8; box-sizing: border-box; border-radius: 4px; }
                .wb-hl-box::before { 
                    content: ''; position: absolute; inset: -2px; padding: 2px; border-radius: 5px; pointer-events: none; opacity: 0.8; transition: opacity 0.2s;
                    background: conic-gradient(from var(--led-angle), transparent 60%, currentColor 100%);
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor; mask-composite: exclude;
                    animation: led-snake 1.5s linear infinite;
                }
                @keyframes led-snake { to { --led-angle: 360deg; } }
                .wb-hl-box.wb-hl-creating::before { display: none; }
                .wb-hl-box.wb-hl-creating { pointer-events: none; border: 1px dashed rgba(0,0,0,0.3); opacity: 0.4; }
                .wb-hl-box:hover, .wb-hl-box:focus-within { opacity: 1; }
                .wb-hl-box:hover::before, .wb-hl-box:focus-within::before { opacity: 1; padding: 3px; inset: -3px; }
                .wb-hl-delete { position: absolute; top: -10px; right: -10px; background: #ef4444; color: #fff; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; font-weight: bold; opacity: 0; transition: opacity 0.2s; z-index: 10; }
                .wb-hl-box:hover .wb-hl-delete { opacity: 1; }
                .wb-hl-drag-handle { position: absolute; left: -16px; top: 50%; transform: translateY(-50%); background: #333; color: #fff; width: 16px; height: 20px; font-size: 10px; cursor: move; opacity: 0; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; border-radius: 4px 0 0 4px; box-shadow: -1px 2px 4px rgba(0,0,0,0.3); z-index: 5;}
                .wb-hl-box:hover .wb-hl-drag-handle { opacity: 1; }
                
                .wb-hl-resizer { position: absolute; background: transparent; opacity: 0; transition: background 0.2s;}
                .wb-hl-box:hover .wb-hl-resizer { opacity: 1; }
                .wb-hl-resizer:hover { background: rgba(0,0,0,0.3); }
                .wb-hl-resizer.n { top: -2px; left: 0; right: 0; height: 5px; cursor: ns-resize; }
                .wb-hl-resizer.s { bottom: -2px; left: 0; right: 0; height: 5px; cursor: ns-resize; }
                .wb-hl-resizer.e { top: 0; bottom: 0; right: -2px; width: 5px; cursor: ew-resize; }
                .wb-hl-resizer.w { top: 0; bottom: 0; left: -2px; width: 5px; cursor: ew-resize; }
                
                /* DICCIONARIO */
                .wb-dictionary { position: absolute; top: 100px; right: 20px; width: 300px; background: #fff; color: #333; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: none; flex-direction: column; z-index: 1000; overflow: hidden; border: 1px solid #ccc; }
                .wb-dict-header { background: #3b4282; color: #fff; padding: 10px; display: flex; justify-content: space-between; align-items: center; cursor: move; font-size: 14px; font-weight: bold; }
                .wb-dict-close { cursor: pointer; color: #ffadad; transition: color 0.2s; } .wb-dict-close:hover { color: #fff; }
                .wb-dict-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
                .wb-dict-input { display: flex; gap: 5px; }
                .wb-dict-input input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-size: 13px; }
                .wb-dict-input input:focus { border-color: #00C853; }
                .wb-dict-input button { background: #00C853; color: #fff; border: none; padding: 8px; border-radius: 4px; cursor: pointer; display:grid; place-items:center; }
                .wb-dict-result { font-size: 13px; line-height: 1.5; color: #444; }
                .wb-dict-result h4 { margin: 0 0 6px 0; font-size: 16px; color: #111; text-transform: capitalize; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                /* AI PANEL & SPLIT PANEL */
                .reader-body { transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .reader-body.ai-open { margin-right: 360px; }
                .reader-body.split-open { margin-right: 400px; }
                
                .split-panel { position: absolute; top: 50px; right: -400px; bottom: 50px; width: 400px; background: #f8fafc; color: #333; z-index: 2000; box-shadow: -4px 0 20px rgba(0,0,0,0.2); display: flex; flex-direction: column; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-left: 1px solid #ddd; }
                .split-panel.open { right: 0; }
                .split-header { background: #1e293b; color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
                .split-tabs { display: flex; background: #e2e8f0; border-bottom: 1px solid #cbd5e1; flex-wrap: wrap; }
                .split-tab { flex: 1; text-align: center; padding: 10px 4px; font-size: 11px; font-weight: 600; cursor: pointer; color: #64748b; transition: all 0.2s; border-bottom: 2px solid transparent; min-width: 80px; }
                .split-tab.active { color: #0f172a; border-bottom-color: #00C853; background: #fff; }
                .split-content { flex: 1; overflow-y: auto; padding: 16px; background: #fff; display: none; }
                .split-content.active { display: block; }
                
                .sp-input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; font-size: 13px; font-family: inherit; }
                .sp-textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 10px; font-size: 13px; font-family: inherit; resize: vertical; min-height: 80px; }
                .sp-btn { background: #00C853; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
                .sp-btn:hover { background: #00b34a; }
                .sp-btn-outline { background: transparent; color: #0f172a; border: 1px solid #ccc; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 8px; }
                .sp-btn-outline:hover { background: #f1f5f9; }
                .sp-label { display: block; font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
                
                /* THUMBNAILS */
                .reader-thumbnails-strip { position: absolute; bottom: 50px; left: 0; right: 0; height: 60px; background: rgba(30,41,59,0.9); display: flex; align-items: center; padding: 0 16px; overflow-x: auto; gap: 8px; z-index: 1000; transition: bottom 0.3s; backdrop-filter: blur(5px); }
                .reader-thumbnails-strip.hidden { bottom: -110px; }
                .thumb-btn { width: 40px; height: 50px; flex-shrink: 0; background: #fff; border: 2px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; color: #334155; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .thumb-btn:hover { border-color: #3b82f6; transform: translateY(-2px); }
                .thumb-btn.active { border-color: #00C853; color: #00C853; background: #f0fdf4; box-shadow: 0 0 10px rgba(0,200,83,0.5); }
                .thumb-toggle-btn { position: absolute; bottom: 60px; right: 20px; background: #1e293b; color: #fff; border: none; padding: 6px 12px; border-radius: 6px 6px 0 0; cursor: pointer; z-index: 1001; font-size: 11px; font-weight: bold; transition: bottom 0.3s; display: flex; align-items: center; gap: 6px; }
                .thumb-toggle-btn.hidden { bottom: 0; }
                .thumb-toggle-btn:hover { background: #334155; }
                
                .ai-panel { position: absolute; top: 0; right: calc(-1 * var(--ai-panel-width, 360px)); bottom: 0; width: var(--ai-panel-width, 360px); background: #fff; color: #333; z-index: 2000; box-shadow: -4px 0 20px rgba(0,0,0,0.3); display: flex; flex-direction: column; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-left: 1px solid #ddd; }
                .ai-panel.open { right: 0; }
                .ai-resizer { position: absolute; left: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; z-index: 2001; background: transparent; transition: background 0.2s; }
                .ai-resizer:hover { background: rgba(0,200,83,0.3); }
                .ai-header { background: #1e1e1e; color: #fff; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00C853; }
                .ai-accordion-header { background: #f8fafc; border: none; border-bottom: 1px solid #eee; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; width: 100%; color: #334155; transition: background 0.2s; }
                .ai-accordion-header:hover { background: #f1f5f9; }
                .ai-header h3 { margin: 0; font-size: 15px; display: flex; align-items: center; gap: 8px; font-weight: 600; }
                .ai-btn-close { background: transparent; border: none; color: #ccc; cursor: pointer; display: grid; place-items: center; transition: color 0.2s; }
                .ai-btn-close:hover { color: #fff; }
                .ai-quick-actions { display: flex; flex-wrap: wrap; gap: 6px; padding: 12px; border-bottom: 1px solid #eee; background: #f8fafc; }
                .ai-qa-btn { background: #fff; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 16px; font-size: 11px; font-weight: 500; color: #334155; cursor: pointer; text-align: center; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .ai-qa-btn:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); }
                .ai-chat-body { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; background: #fff; }
                
                /* EVIDENCIAS */
                .ev-btn { background: transparent; border: none; padding: 10px 12px; text-align: left; cursor: pointer; color: #334155; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: background 0.2s; border-bottom: 1px solid #f1f5f9; }
                .ev-btn:hover { background: #f1f5f9; color: #0f172a; }
                #evidencias-dropdown.show { display: flex !important; }
                .rec-indicator { display: inline-block; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; animation: pulse-red 1.5s infinite; margin-right: 6px; }
                @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .ai-msg { padding: 12px 14px; border-radius: 8px; font-size: 13.5px; line-height: 1.5; max-width: 90%; word-break: break-word;}
                .ai-msg.bot { background: #f1f5f9; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 2px;}
                .ai-msg.user { background: #00C853; color: #fff; align-self: flex-end; border-bottom-right-radius: 2px;}
                .ai-chat-input-area { padding: 14px 16px; background: #fff; border-top: 1px solid #eee; }
                .ai-chat-input-wrap { display: flex; gap: 8px; align-items: flex-end; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px; }
                .ai-chat-input-wrap textarea { flex: 1; padding: 8px; border: none; background: transparent; outline: none; font-size: 13.5px; resize: none; max-height: 100px; min-height: 24px; font-family: inherit; }
                .ai-chat-input-wrap button { background: #00C853; color: #fff; border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: grid; place-items: center; align-self: flex-end; margin-bottom: 2px; transition: background 0.2s;}
                .ai-chat-input-wrap button:hover { background: #0f766e; }
            `;
        // Cargar libreria PDF.js si no existe
        if (!window.pdfjsLib) {
            const script = document.createElement('script');
            script.src = 'pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
            };
            document.head.appendChild(script);
        }

        // Add reader UI to DOM if not exists (always refresh it for latest updates)
        const oldReader = document.getElementById('gdhn-reader');
        if (oldReader) oldReader.remove();

        const readerHtml = `
            <div id="gdhn-reader" class="reader-overlay">
                <div class="reader-header" id="reader-header">
                    <div class="reader-title" id="reader-title">Documento</div>
                    <div class="reader-controls">
                        <!-- MENÚ PRINCIPAL DESPLEGABLE -->
                        <button class="reader-btn reader-btn-text" id="btn-main-menu" onclick="Libreria.toggleMainMenu()" title="Menú Principal" style="border-color: rgba(56,189,248,0.3); color: #7dd3fc; height: 36px; margin-left: 4px;">
                            <i data-lucide="menu" style="width:15px"></i>
                            <span>Menú Principal</span>
                        </button>
                        <!-- Separator -->
                        <div class="reader-controls-separator" style="margin-left: 6px; margin-right: 6px;"></div>

                        <!-- LUPA / ENFOCAR EJERCICIO HD -->
                        <button class="reader-btn reader-btn-text" id="wb-crop" onclick="Libreria.setDrawMode('crop')" title="Lupa de Ejercicio: Arrastra un recuadro para enfocar cualquier ejercicio u imagen en HD" style="border-color: rgba(236,72,153,0.35); color: #f472b6; height: 36px;">
                            <i data-lucide="crop" style="width:15px"></i>
                            <span>Enfocar Ejercicio</span>
                        </button>

                        <!-- MODO PRESENTACIÓN PRO -->
                        <button class="reader-btn reader-btn-text" id="btn-presentation-mode" onclick="Libreria.togglePresentationMode()" title="Modo Presentación Pro a Pantalla Completa" style="border-color: rgba(16,185,129,0.35); color: #34d399; height: 36px;">
                            <i data-lucide="monitor" style="width:15px"></i>
                            <span>Presentación</span>
                        </button>

                        <!-- MARCADOR RÁPIDO -->
                        <button class="reader-btn" onclick="Libreria.quickBookmarkCurrentPage()" title="Marcar esta página como importante">
                            <i data-lucide="bookmark" style="width:17px; color:#f59e0b;"></i>
                        </button>

                        <!-- Separator -->
                        <div class="reader-controls-separator" style="margin-left: 6px; margin-right: 6px;"></div>

                        <!-- TTS -->
                        <button class="reader-btn" id="btn-tts" onclick="Libreria.toggleTTS()" title="Lector de voz (Text-To-Speech)">
                            <i data-lucide="volume-2" style="width:17px"></i>
                        </button>
                        <!-- Smart Zoom -->
                        <button class="reader-btn" onclick="Libreria.fitWidth()" title="Ajustar Ancho"><i data-lucide="move-horizontal" style="width:17px"></i></button>
                        <button class="reader-btn" onclick="Libreria.fitHeight()" title="Ajustar Alto"><i data-lucide="move-vertical" style="width:17px"></i></button>
                        
                        <!-- Zoom Out -->
                        <button class="reader-btn" onclick="Libreria.zoomOut()" title="Alejar (Lupa -)">
                            <i data-lucide="zoom-out" style="width:18px"></i>
                        </button>
                        <!-- Zoom Scale Selector -->
                        <select class="reader-select" onchange="Libreria.setZoom(this.value)" id="reader-zoom-select">
                            <option value="0.5">50%</option>
                            <option value="0.75">75%</option>
                            <option value="1.0" selected>100%</option>
                            <option value="1.25">125%</option>
                            <option value="1.5">150%</option>
                            <option value="2.0">200%</option>
                        </select>
                        <!-- Zoom In -->
                        <button class="reader-btn" onclick="Libreria.zoomIn()" title="Acercar (Lupa +)">
                            <i data-lucide="zoom-in" style="width:18px"></i>
                        </button>
                        <!-- Multi-page toggle -->
                        <button class="reader-btn" onclick="Libreria.toggleLayoutMenu()" title="Diseño de página (1,2,3,4)">
                            <i data-lucide="layout-grid" style="width:18px"></i>
                        </button>
                        <div id="layout-popover" class="layout-popover">
                            <div class="layout-option active" onclick="Libreria.setLayout(1)">1 Página</div>
                            <div class="layout-option" onclick="Libreria.setLayout(2)">2 Páginas</div>
                            <div class="layout-option" onclick="Libreria.setLayout(3)">3 Páginas</div>
                            <div class="layout-option" onclick="Libreria.setLayout(4)">4 Páginas</div>
                        </div>
                        
                        <div class="reader-minimap" id="reader-minimap">
                            <div class="reader-minimap-content" id="reader-minimap-content">
                                <div class="reader-minimap-preview" id="reader-minimap-preview"></div>
                                <div class="reader-minimap-viewport" id="reader-minimap-viewport"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BOTÓN FLOTANTE HERRAMIENTAS DOCENTES -->
                <button id="wb-toggle-btn" class="wb-toggle-btn" onclick="document.getElementById('wb-toolbar').classList.toggle('collapsed')" title="Herramientas de Pizarra">
                    <i data-lucide="pen-tool" style="width:20px;"></i>
                </button>

                <!-- HERRAMIENTAS DE PIZARRA DOCENTE -->
                <div class="reader-wb-toolbar collapsed" id="wb-toolbar" style="max-height: 80vh; overflow-y: auto;">
                    <div class="wb-toolbar-header" id="wb-toolbar-header" title="Arrastrar barra"></div>
                    <div style="display:flex; flex-direction:row; align-items:center; justify-content:space-between; padding:4px 2px; margin-bottom: 2px;">
                        <button class="wb-btn" onclick="Libreria.wbUndo()" title="Deshacer última acción (Ctrl+Z)" style="border:1px solid #60a5fa; color:#60a5fa; background:rgba(96,165,250,0.12); border-radius:6px; width:34px; height:34px;"><i data-lucide="undo-2" style="width:16px"></i></button>
                        <button class="wb-btn" onclick="Libreria.wbRedo()" title="Rehacer acción (Ctrl+Y)" style="border:1px solid #60a5fa; color:#60a5fa; background:rgba(96,165,250,0.12); border-radius:6px; width:34px; height:34px;"><i data-lucide="redo-2" style="width:16px"></i></button>
                    </div>
                    
                    <div class="wb-btn-group" style="display:grid; grid-template-columns: 1fr 1fr; gap:4px; margin-top:8px;">
                        <button class="wb-btn active" id="wb-none" onclick="Libreria.setDrawMode('none')" title="Seleccionar texto/gráfico"><i data-lucide="mouse-pointer-2" style="width:18px"></i></button>
                        <button class="wb-btn" id="wb-pen" onclick="Libreria.setDrawMode('pen')" title="Lápiz / Bolígrafo"><i data-lucide="pen-tool" style="width:18px"></i></button>
                        <button class="wb-btn" id="wb-highlighter" onclick="Libreria.setDrawMode('highlighter')" title="Resaltador"><i data-lucide="edit-3" style="width:18px"></i></button>
                        <button class="wb-btn" id="wb-eraser" onclick="Libreria.setDrawMode('eraser')" title="Borrador Mágico"><i data-lucide="eraser" style="width:18px"></i></button>
                    </div>

                    <div class="wb-btn-group" style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
                        <button class="wb-btn" id="wb-text" onclick="Libreria.setDrawMode('text')" title="Insertar Cuadro de Texto"><i data-lucide="type" style="width:18px"></i></button>
                        <button class="wb-btn" id="wb-laser" onclick="Libreria.setDrawMode('laser')" title="Puntero Láser (TV)"><i data-lucide="crosshair" style="width:18px; color:#f59e0b;"></i></button>
                    </div>

                    <div class="wb-btn-group" style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
                        <button class="wb-btn" id="wb-eye" onclick="Libreria.toggleAnnotations()" title="Mostrar/Ocultar Anotaciones"><i data-lucide="eye-off" style="width:18px"></i></button>
                        <button class="wb-btn" id="wb-spot" onclick="Libreria.toggleSpotlight()" title="Herramienta de Enfoque (Spotlight)"><i data-lucide="focus" style="width:18px"></i></button>
                    </div>

                    <div style="display:flex; flex-direction:row; align-items:center; justify-content:center; margin-top:6px; border-top: 1px solid #444; padding-top:6px;">
                        <button class="wb-btn" onclick="Libreria.wbClearAll()" title="Borrar TODOS los apuntes de la página" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: auto; padding: 8px 4px; border: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); gap: 4px; border-radius: 8px;"><i data-lucide="trash" style="width:18px; color: #ef4444;"></i> <span style="font-size: 11px; color: #ef4444; font-weight: 500; text-transform: uppercase;">Borrar todo</span></button>
                    </div>

                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; margin-top:6px; border-top:1px solid #444; padding-top:8px;">
                        <label style="font-size:9px;color:#888;text-transform:uppercase;">Grosor</label>
                        <input type="range" min="1" max="20" value="3" style="width:60px; height:4px; accent-color:#00C853; margin-bottom:8px;" oninput="Libreria.state.drawSize=+this.value">
                    </div>
                    <div class="wb-colors">
                        <div class="wb-color active" style="background:#ef4444;" onclick="Libreria.setDrawColor('#ef4444', this)"></div>
                        <div class="wb-color" style="background:#3b82f6;" onclick="Libreria.setDrawColor('#3b82f6', this)"></div>
                        <div class="wb-color" style="background:#10b981;" onclick="Libreria.setDrawColor('#10b981', this)"></div>
                        <div class="wb-color" style="background:#f59e0b;" onclick="Libreria.setDrawColor('#f59e0b', this)"></div>
                        <div class="wb-color" style="background:#000000;" onclick="Libreria.setDrawColor('#000000', this)"></div>
                        <div class="wb-color" style="background:#ffffff;" onclick="Libreria.setDrawColor('#ffffff', this)"></div>
                        <div style="display:flex; justify-content:center; width:100%; margin-top:4px; margin-bottom:4px;">
                            <div class="wb-color" style="width: 22px; height: 22px; border-radius: 50%; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.3); background: #8b5cf6;" title="Color Personalizado">
                                <input type="color" value="#8b5cf6" style="position: absolute; top: -10px; left: -10px; width: 44px; height: 44px; padding: 0; border: none; cursor: pointer; opacity: 0;" onchange="Libreria.setDrawColor(this.value, null); this.parentElement.style.background = this.value;">
                            </div>
                        </div>
                    </div>
                    <input type="file" id="wb-file-img" accept="image/*" style="display:none;" onchange="Libreria.insertImage(event)">
                </div>
                
                <div class="reader-body" id="reader-body">
                    <div id="reader-loading" class="reader-loading">Cargando PDF...</div>
                    <div id="reader-pages-container" class="reader-pages-container">
                        <!-- Canvases injected here -->
                    </div>
                    
                    <!-- DICCIONARIO WIDGET -->
                    <div id="wb-dictionary" class="wb-dictionary">
                        <div class="wb-dict-header" id="wb-dict-header">
                            <span>📖 Diccionario / Wiki</span>
                            <i data-lucide="x" class="wb-dict-close" onclick="Libreria.toggleDictionary()" style="width:18px"></i>
                        </div>
                        <div class="wb-dict-body">
                            <div class="wb-dict-input">
                                <input type="text" id="wb-dict-term" placeholder="Escribe una palabra..." onkeyup="if(event.key === 'Enter') Libreria.searchDictionary()">
                                <button onclick="Libreria.searchDictionary()"><i data-lucide="search" style="width:14px"></i></button>
                            </div>
                            <div id="wb-dict-result" class="wb-dict-result">
                                <p style="color:#888; text-align:center; margin-top: 20px;">Busca una palabra para ver su significado o resumen.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="reader-footer">
                    <div id="reader-progress-bar" class="reader-progress-bar"></div>
                    <div class="reader-nav">
                        <button class="reader-btn" onclick="Libreria.prevPage()" title="Anterior"><i data-lucide="chevron-left" style="width:18px"></i></button>
                        <button class="reader-btn" onclick="Libreria.nextPage()" title="Siguiente"><i data-lucide="chevron-right" style="width:18px"></i></button>
                    </div>
                    <div class="reader-page-info">
                        <div class="modern-page-nav">
                            <input type="number" id="reader-page-input" class="modern-page-input" value="1" min="1" onchange="Libreria.goToPage(this.value)" onkeyup="if(event.key === 'Enter') Libreria.goToPage(this.value)" title="Ir a página y dar Enter">
                            <span class="modern-page-divider">/</span>
                            <span id="reader-page-count" class="modern-page-total">--</span>
                        </div>
                        <span id="reader-percent" class="reader-percent">0%</span>
                    </div>
                </div>
                
                <!-- MINIATURAS STRIP -->
                <button class="thumb-toggle-btn hidden" id="thumb-toggle-btn" onclick="Libreria.toggleThumbnailsStrip()"><i data-lucide="gallery-horizontal" style="width:14px"></i> Miniaturas</button>
                <div class="reader-thumbnails-strip hidden" id="reader-thumbnails-strip">
                    <!-- Thumbnails inyectados aquí -->
                </div>
                
                <div id="main-menu-dropdown" class="ev-dropdown-dark" style="position: absolute; width: 260px; top: 60px; left: 12px; max-height: calc(100vh - 80px); overflow-y: auto; z-index: 2147483647; box-shadow: 0 10px 40px rgba(0,0,0,0.9); padding-bottom: 10px;">
                    <div class="ev-section-title">Acciones Principales</div>
                    <button class="ev-dark-btn" style="color: #6ee7b7;" onclick="Libreria.saveAllDrawingsManual()"><i data-lucide="save"></i> Guardar Cambios Pizarra</button>
                    <button class="ev-dark-btn" style="color: #fca5a5;" onclick="Libreria.closeLector()"><i data-lucide="log-out"></i> Regresar a Biblioteca</button>
                    
                    <div class="ev-section-title" style="margin-top:6px;">Modos de Vista</div>
                    <button class="ev-dark-btn" onclick="Libreria.toggleDarkMode()"><i data-lucide="moon"></i> Modo Lectura Nocturna</button>
                    <button class="ev-dark-btn" onclick="Libreria.toggleTeacherMode()"><i data-lucide="monitor-play"></i> Modo Docente</button>
                    <button class="ev-dark-btn" onclick="Libreria.toggleSplitPanel()"><i data-lucide="layout-panel-right"></i> Vista Dividida</button>
                    <button class="ev-dark-btn" onclick="Libreria.modoExplicar()"><i data-lucide="presentation"></i> Modo Explicar</button>
                    <button class="ev-dark-btn" onclick="Libreria.modoResolver()"><i data-lucide="edit-3"></i> Modo Resolver</button>

                    <div class="ev-section-title" style="margin-top:6px;">Inteligencia Artificial</div>
                    <button class="ev-dark-btn" style="color: #fcd34d;" onclick="Libreria.toggleAIPanel()"><i data-lucide="sparkles"></i> IA Gemini</button>

                    <div class="ev-section-title" style="margin-top:6px;">Pizarra 360</div>
                    <button class="ev-dark-btn" onclick="Views.Pizarra360.openFloatingTool('libreta')">📓 Libreta de Clase</button>
                    <button class="ev-dark-btn" onclick="Views.Pizarra360.openFloatingTool('ruleta')">🎡 Ruleta de Estudiantes</button>
                    <button class="ev-dark-btn" onclick="Views.Pizarra360.openFloatingTool('equipos')">👥 Formador de Equipos</button>
                    <button class="ev-dark-btn" onclick="Views.Pizarra360.openFloatingTool('timer')">⏱ Temporizador</button>
                    <button class="ev-dark-btn" onclick="Views.Pizarra360.openFloatingTool('participacion')">🙋 Participación</button>
                    <button class="ev-dark-btn" onclick="Views.Pizarra360.openFloatingTool('dado')">🎲 Dado Virtual</button>
                    <button class="ev-dark-btn" onclick="Views.Pizarra360.openFloatingTool('semaforo')">🚦 Semáforo</button>

                    <div class="ev-section-title" style="margin-top:6px;">Evidencias y Compartir</div>
                    <button class="ev-dark-btn" onclick="Libreria.toggleRecording()"><i data-lucide="video"></i> Iniciar Grabación</button>
                    <button class="ev-dark-btn" onclick="Libreria.openClassHistory()"><i data-lucide="history"></i> Historial de Clases</button>
                    <button class="ev-dark-btn" onclick="Libreria.exportCurrentPagePDF()"><i data-lucide="file-text"></i> Exportar Página Actual</button>
                    <button class="ev-dark-btn" onclick="Libreria.exportFullPDF()"><i data-lucide="file-check-2"></i> Exportar Libro Completo</button>
                    <button class="ev-dark-btn" onclick="Libreria.exportImageShare()"><i data-lucide="share-2"></i> Compartir Imagen</button>
                </div>
                
                <!-- AI PANEL -->
                <div id="ai-panel" class="ai-panel">
                    <div id="ai-resizer" class="ai-resizer"></div>
                    <div class="ai-header">
                        <h3><i data-lucide="sparkles" style="width:18px; color: #fbbf24;"></i> Asistente de IA</h3>
                        <button class="ai-btn-close" onclick="Libreria.toggleAIPanel()"><i data-lucide="chevron-right" style="width:20px;"></i></button>
                    </div>
                    <!-- ACCORDION HEADER -->
                    <button class="ai-accordion-header" onclick="const el=document.getElementById('ai-quick-actions-body'); const icon=document.getElementById('ai-accordion-icon'); if(el.style.display==='none'){ el.style.display='flex'; icon.setAttribute('data-lucide', 'chevron-up'); } else { el.style.display='none'; icon.setAttribute('data-lucide', 'chevron-down'); } if(window.lucide) window.lucide.createIcons();">
                        <span style="font-weight:600; font-size:12px; display:flex; align-items:center; gap:6px;"><i data-lucide="zap" style="width:14px; color:#fbbf24;"></i> Acciones Rápidas</span>
                        <i id="ai-accordion-icon" data-lucide="chevron-up" style="width:16px; color:#888;"></i>
                    </button>
                    <div class="ai-quick-actions" id="ai-quick-actions-body">
                        <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Extrae de esta lectura entre 3 y 5 ideas o conceptos principales. Mantén el formato corto y claro.')">
                            <i data-lucide="book-open" style="width:16px; color:#3b82f6;"></i> Resumir conceptos clave
                        </button>
                        <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Genera 5 preguntas variadas sobre este texto, ideales para evaluar la comprensión.')">
                            <i data-lucide="help-circle" style="width:16px; color:#10b981;"></i> Generar preguntas
                        </button>
                        <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Propón una actividad lúdica breve de 5 a 10 minutos para realizar en clase sobre este tema.')">
                            <i data-lucide="puzzle" style="width:16px; color:#f59e0b;"></i> Proponer actividad lúdica
                        </button>
                        
                        <!-- Primary Actions -->
                        <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Extrae 5 palabras de vocabulario clave de esta lectura y añade una definición sencilla para cada una.')">
                            <i data-lucide="key" style="width:16px; color:#8b5cf6;"></i> Extraer vocabulario clave
                        </button>
                        <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Identifica 1 idea principal general y, si aplica, hasta 2 ideas secundarias de esta página.')">
                            <i data-lucide="lightbulb" style="width:16px; color:#facc15;"></i> Identificar idea principal
                        </button>
                        <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Genera una guía de trabajo con 4 a 6 instrucciones numeradas para que los estudiantes trabajen con esta lectura.')">
                            <i data-lucide="clipboard-list" style="width:16px; color:#ec4899;"></i> Generar guía de trabajo
                        </button>

                        <!-- Secondary Options toggle -->
                        <div style="width: 100%; margin-top: 4px; display: flex; flex-direction: column;">
                            <button class="ai-qa-btn" style="width: 100%; justify-content: center; background: #f1f5f9; border-color: #cbd5e1; font-weight: bold;" onclick="const el = document.getElementById('ai-secondary-actions'); el.style.display = el.style.display === 'flex' ? 'none' : 'flex';">
                                <i data-lucide="plus" style="width:16px;"></i> Más opciones
                            </button>
                            
                            <div id="ai-secondary-actions" style="display:none; flex-direction:row; flex-wrap:wrap; gap:6px; margin-top:8px;">
                                <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Genera un cuestionario de 5 preguntas de selección única con 3 opciones y la respuesta correcta sobre esta lectura.')">
                                    <i data-lucide="list-checks" style="width:16px; color:#14b8a6;"></i> Generar cuestionario
                                </button>
                                <button class="ai-qa-btn" onclick="let g=prompt('¿A qué grado deseas adaptar la explicación? (Ej. 7mo grado)'); if(g) Libreria.aiPrompt('Adapta la explicación de este contenido para estudiantes de ' + g + ' con un lenguaje adecuado y claro.')">
                                    <i data-lucide="graduation-cap" style="width:16px; color:#f43f5e;"></i> Adaptar explicación al grado
                                </button>
                                <button class="ai-qa-btn" onclick="Libreria.aiPrompt('Crea un esquema de presentación con 4 a 6 diapositivas en formato texto basadas en este contenido. Solo entrega el título y contenido sugerido por diapositiva, sin generar archivos PPTX.')">
                                    <i data-lucide="presentation" style="width:16px; color:#0ea5e9;"></i> Crear esquema de presentación
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="ai-chat-body" id="ai-chat-body">
                        <div class="ai-msg bot">¡Hola! Soy tu asistente pedagógico. Selecciona una acción rápida o escríbeme qué necesitas de la lectura actual.</div>
                    </div>
                    <div class="ai-chat-input-area">
                        <div class="ai-chat-input-wrap">
                            <textarea id="ai-chat-input" placeholder="Pregúntame algo..." onkeyup="if(event.key==='Enter' && !event.shiftKey) { event.preventDefault(); Libreria.aiSendCustom(); }" rows="1"></textarea>
                            <button onclick="Libreria.aiSendCustom()"><i data-lucide="send" style="width:16px;"></i></button>
                        </div>
                    </div>
                </div>

                <!-- SPLIT PANEL (VISTA DIVIDIDA) -->
                <div id="split-panel" class="split-panel">
                    <div class="split-header">
                        <h3 style="margin:0; font-size: 15px; display:flex; align-items:center; gap:8px;"><i data-lucide="layout-panel-right" style="width:18px;"></i> Panel Docente</h3>
                        <button class="ai-btn-close" onclick="Libreria.toggleSplitPanel()"><i data-lucide="x" style="width:20px;"></i></button>
                    </div>
                    <div class="split-tabs">
                        <div class="split-tab active" onclick="Libreria.switchSplitTab('tab-whiteboard')">Pizarra Aux</div>
                        <div class="split-tab" onclick="Libreria.switchSplitTab('tab-notes')">Notas</div>
                        <div class="split-tab" onclick="Libreria.switchSplitTab('tab-bookmark')">Marcador</div>
                        <div class="split-tab" onclick="Libreria.switchSplitTab('tab-resources')">Recursos</div>
                    </div>
                    
                    <!-- Pizarra Auxiliar -->
                    <div class="split-content active" id="tab-whiteboard" style="padding:0; display:flex; flex-direction:column;">
                        <div style="padding:8px; background:#f1f5f9; border-bottom:1px solid #ddd; display:flex; gap:8px;">
                            <button class="sp-btn-outline" style="margin:0; padding:6px; flex:1; display:flex; align-items:center; justify-content:center; gap:4px; font-weight:600; border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.05);" onclick="Libreria.clearAuxWhiteboard()"><i data-lucide="trash" style="width:14px;"></i> Limpiar</button>
                            <button class="sp-btn-outline" style="margin:0; padding:6px; flex:1; display:flex; align-items:center; justify-content:center; gap:4px; font-weight:600; border-color:#ec4899; color:#ec4899; background:rgba(236,72,153,0.05);" onclick="Libreria.pasteToAuxWhiteboard()"><i data-lucide="clipboard" style="width:14px;"></i> Pegar Recorte</button>
                        </div>
                        <canvas id="aux-whiteboard" style="flex:1; width:100%; cursor:crosshair; touch-action:none;"></canvas>
                    </div>

                    <!-- Notas del Docente -->
                    <div class="split-content" id="tab-notes">
                        <label class="sp-label">Tema / Concepto</label>
                        <input type="text" class="sp-input" id="sp-note-theme" placeholder="Ej: Fotosíntesis">
                        
                        <label class="sp-label">Explicación Clave</label>
                        <textarea class="sp-textarea" id="sp-note-explanation" placeholder="Puntos a no olvidar..."></textarea>
                        
                        <label class="sp-label">Observación de Clase</label>
                        <textarea class="sp-textarea" id="sp-note-observation" placeholder="Comportamiento, dudas..."></textarea>
                        
                        <label class="sp-label">Tarea o Seguimiento</label>
                        <textarea class="sp-textarea" id="sp-note-homework" placeholder="Asignación..."></textarea>
                        
                        <button class="sp-btn" onclick="Libreria.saveTeacherNotes()"><i data-lucide="save" style="width:16px; margin-right:6px; vertical-align:middle;"></i> Guardar Notas (Pág <span id="sp-note-page-num">1</span>)</button>
                    </div>

                    <!-- Marcadores Pedagógicos -->
                    <div class="split-content" id="tab-bookmark">
                        <label class="sp-label">Campo del Conocimiento</label>
                        <input type="text" class="sp-input" id="sp-bm-subject" placeholder="Ej: Ciencias">
                        
                        <div style="display:flex; gap:10px;">
                            <div style="flex:1;">
                                <label class="sp-label">Grado</label>
                                <input type="text" class="sp-input" id="sp-bm-grade" placeholder="Ej: 5to">
                            </div>
                            <div style="flex:1;">
                                <label class="sp-label">Unidad</label>
                                <input type="text" class="sp-input" id="sp-bm-unit" placeholder="Ej: II">
                            </div>
                        </div>

                        <label class="sp-label">Lección</label>
                        <input type="text" class="sp-input" id="sp-bm-lesson" placeholder="Nombre de la lección">
                        
                        <label class="sp-label">Comentario Docente</label>
                        <textarea class="sp-textarea" id="sp-bm-comment" placeholder="Contexto..."></textarea>
                        
                        <button class="sp-btn" onclick="Libreria.saveTeacherBookmark()"><i data-lucide="bookmark" style="width:16px; margin-right:6px; vertical-align:middle;"></i> Guardar Marcador</button>
                    </div>

                    <!-- Recursos -->
                    <div class="split-content" id="tab-resources">
                        <p style="font-size:13px; color:#64748b; margin-top:0;">Agrega recursos multimedia para proyectar cuando llegues a esta página.</p>
                        
                        <label class="sp-label">URL del Enlace / Video (YouTube)</label>
                        <input type="text" class="sp-input" id="sp-res-link" placeholder="https://...">
                        <button class="sp-btn-outline" style="margin-top:0; margin-bottom:16px;" onclick="Libreria.addResourceLink()">Añadir Enlace</button>
                        
                        <label class="sp-label">Archivo Local (PDF, IMG, MP3)</label>
                        <input type="file" id="sp-res-file" style="display:none;" onchange="Libreria.addResourceFile(event)">
                        <button class="sp-btn-outline" style="margin-top:0;" onclick="document.getElementById('sp-res-file').click()"><i data-lucide="upload" style="width:14px; margin-right:6px; vertical-align:middle;"></i> Subir Archivo</button>
                        
                        <h4 style="margin-top:24px; font-size:13px; border-bottom:1px solid #ddd; padding-bottom:8px;">Recursos de la Página <span id="sp-res-page-num">1</span></h4>
                        <div id="sp-res-list" style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
                            <!-- Lista de recursos inyectada -->
                        </div>
                    </div>
                </div>
            </div>
            `;
        document.body.insertAdjacentHTML('beforeend', readerHtml);

        setTimeout(() => {
            const resizer = document.getElementById('ai-resizer');
            if (resizer) {
                let isResizing = false;
                resizer.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    document.body.style.cursor = 'ew-resize';
                    document.body.style.userSelect = 'none';
                });
                
                if (Libreria._aiResizerMove) document.removeEventListener('mousemove', Libreria._aiResizerMove);
                if (Libreria._aiResizerUp) document.removeEventListener('mouseup', Libreria._aiResizerUp);
                
                Libreria._aiResizerMove = (e) => {
                    if (!isResizing) return;
                    let newWidth = window.innerWidth - e.clientX;
                    if (newWidth < 300) newWidth = 300;
                    if (newWidth > 800) newWidth = 800;
                    document.documentElement.style.setProperty('--ai-panel-width', newWidth + 'px');
                };
                
                Libreria._aiResizerUp = () => {
                    if (isResizing) {
                        isResizing = false;
                        document.body.style.cursor = 'default';
                        document.body.style.userSelect = 'auto';
                    }
                };
                
                document.addEventListener('mousemove', Libreria._aiResizerMove);
                document.addEventListener('mouseup', Libreria._aiResizerUp);
            }
        }, 100);
    },

    save: function () {
        localStorage.setItem('gdhn_libreria', JSON.stringify(this.state.libros));
    },

    // ==========================================
    // MODULE VIEWS
    // ==========================================

    renderTemplate(title, subtitle, content) {
        const currentId = Router.current;

        // Estilo moderno adaptado al UI de Aula 360 HN
        const tabsHtml = `
            <style>
                .h-tab-lib {
                    padding: 12px 18px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                    outline: none;
                }
                .h-tab-lib:hover {
                    color: var(--text-main);
                    background: rgba(0, 0, 0, 0.02);
                    border-top-left-radius: 8px;
                    border-top-right-radius: 8px;
                }
                .h-tab-lib.active {
                    color: var(--primary);
                    border-bottom: 2px solid var(--primary);
                    font-weight: 700;
                }
                .h-tab-lib i {
                    width: 18px;
                    height: 18px;
                }
            </style>
            <div style="background: var(--surface); border-bottom: 1px solid var(--border-color); padding: 20px 24px 0 24px; margin: -24px -24px 24px -24px; flex-shrink: 0; z-index: 10;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
                    <div>
                        <h2 style="font-size: 20px; font-weight: 900; color: var(--text); display: flex; align-items: center; gap: 8px;">
                            <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #00C853, #00E676); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,200,83,0.3);">
                                <i data-lucide="book-open" style="width: 20px; height: 20px;"></i>
                            </div>
                            Aula 360 HN — Librería Digital
                        </h2>
                        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px; padding-left: 46px;">Gestión y Lectura de Libros y Documentos Educativos</p>
                    </div>

                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <!-- BOTÓN PARA EXPLORAR PDF DESDE DISPOSITIVO -->
                        <button class="btn btn-primary" onclick="document.getElementById('pdf-uploader').click()" 
                                style="height:40px; padding:0 18px; border-radius:12px; font-weight:800; font-size:13px; display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg, #00C853 0%, #00E676 100%); color:#fff; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(0,200,83,0.25);" 
                                title="Cargar y sincronizar archivos PDF de tu dispositivo">
                            <i data-lucide="file-up" style="width:18px; height:18px;"></i>
                            <span>📁 Cargar PDF</span>
                        </button>
                    </div>
                </div>
                
                <div style="display:flex; align-items:center; justify-content:space-between; gap: 12px; overflow-x: auto; padding-bottom: 0px; margin-bottom: -1px; scrollbar-width: none; flex-wrap:wrap;">
                    <div style="display:flex; gap: 4px;">
                        <button class="h-tab-lib ${currentId === 'libreria-todas' ? 'active' : ''}" onclick="Router.navigate('libreria-todas')"><i data-lucide="book-open"></i> Todas las Portadas</button>
                        <button class="h-tab-lib ${currentId === 'libreria-carpetas' ? 'active' : ''}" onclick="Router.navigate('libreria-carpetas')"><i data-lucide="folder"></i> Carpetas</button>
                        <button class="h-tab-lib ${currentId === 'libreria-favoritos' ? 'active' : ''}" onclick="Router.navigate('libreria-favoritos')"><i data-lucide="star"></i> Favoritos</button>
                        <button class="h-tab-lib ${currentId === 'libreria-recientes' ? 'active' : ''}" onclick="Router.navigate('libreria-recientes')"><i data-lucide="clock"></i> Recientes</button>
                    </div>
                </div>
            </div>
        `;

        return `
            <div class="fade-in" style="display: flex; flex-direction: column; height: 100%;">
                <input type="file" id="pdf-uploader" accept="application/pdf,.pdf" multiple style="display:none;" onchange="Libreria.handleFileUpload(event)">
                ${tabsHtml}
                <div style="flex: 1; padding-bottom: 24px;">
                    ${content}
                </div>
            </div>
        `;
    },

    renderTodas: function () {
        this.init();

        const fileInput = `
            <input type="file" id="pdf-uploader" accept="application/pdf" multiple style="display:none;" onchange="Libreria.handleFileUpload(event)">
        `;

        const driveUrl = Store?.data?.perfilDocente?.googleDriveUrl;
        const driveBtn = driveUrl ? `
            <a href="${driveUrl}" target="_blank" class="lib-sub-btn" style="border: 1px solid rgba(37, 99, 235, 0.2); background: rgba(37, 99, 235, 0.05); text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; color:#2563eb; font-weight:700; border-radius:8px; padding:0 12px; height:32px; font-size:12px;" title="Abrir mi carpeta de Google Drive">
                <i data-lucide="cloud" style="width:14px; height:14px;"></i> Drive
            </a>
        ` : '';

        const subToolbar = `
            <div class="lib-sub-toolbar">
                <div class="lib-search-container">
                    <input type="text" class="lib-search-input" placeholder="Buscar libro..." value="${this.state.searchQuery || ''}" onkeyup="Libreria.setSearch(this.value)">
                    <div class="lib-search-count">${this.state.libros.length}</div>
                </div>
                <!-- Dropdown de Ordenar -->
                <div style="position:relative;">
                    <button class="lib-sub-btn" onclick="Libreria.toggleSortMenu(event)">
                        ${this.state.sortBy === 'name' ? 'Nombre' : this.state.sortBy === 'size' ? 'Tamaño' : 'Fecha'} 
                        <i data-lucide="chevron-down" style="width:14px"></i>
                    </button>
                    <!-- Popover flotante -->
                    <div id="lib-sort-popover" class="layout-popover" style="top:32px; right:0; left:auto; width: 120px;">
                        <div class="layout-option ${this.state.sortBy === 'date' ? 'active' : ''}" onclick="Libreria.setSort('date')">Fecha</div>
                        <div class="layout-option ${this.state.sortBy === 'name' ? 'active' : ''}" onclick="Libreria.setSort('name')">Nombre</div>
                        <div class="layout-option ${this.state.sortBy === 'size' ? 'active' : ''}" onclick="Libreria.setSort('size')">Tamaño</div>
                    </div>
                </div>
                ${driveBtn}
                <button class="lib-icon-btn" onclick="document.getElementById('pdf-uploader').click()" title="Sincronizar nuevos PDFs">
                    <i data-lucide="refresh-cw" style="width:18px"></i>
                </button>
                <button class="lib-icon-btn" title="Cambiar a vista de ${this.state.viewMode === 'grid' ? 'lista' : 'cuadrícula'}" onclick="Libreria.toggleViewMode()">
                    <i data-lucide="${this.state.viewMode === 'list' ? 'layout-grid' : 'list'}" style="width:18px"></i>
                </button>
                <button class="lib-icon-btn" title="Filtros avanzados" onclick="UI.toast('Filtros avanzados en desarrollo', 'info')">
                    <i data-lucide="filter" style="width:18px"></i>
                </button>
            </div>
            ${fileInput}
        `;

        let displayLibros = [...this.state.libros];

        // Filtro por busqueda
        if (this.state.searchQuery) {
            displayLibros = displayLibros.filter(l => l.name.toLowerCase().includes(this.state.searchQuery));
        }

        // Ordenamiento
        if (this.state.sortBy === 'name') {
            displayLibros.sort((a, b) => a.name.localeCompare(b.name));
        } else if (this.state.sortBy === 'size') {
            displayLibros.sort((a, b) => parseFloat(b.size) - parseFloat(a.size)); // de mayor a menor peso
        } else {
            // Fecha - asumiremos que los mas recientes estan al final de la lista origen. Los invertimos.
            displayLibros.reverse();
        }

        const grid = this.buildBookGrid(displayLibros, 'La biblioteca está vacía', 'Haz clic en el botón de recargar arriba para buscar archivos PDF.');

        return this.renderTemplate('Library', '', subToolbar + grid);
    },

    buildBookGrid: function (displayLibros, emptyTitle, emptyDesc) {
        let grid = '';
        if (displayLibros.length === 0) {
            grid = `
                <div style="text-align:center; padding: 60px 20px;">
                    <i data-lucide="library" style="width: 50px; height: 50px; color: #ccc; margin-bottom: 20px; opacity:0.3;"></i>
                    <h3 style="font-size: 16px; font-weight: bold; color: #555;">${emptyTitle}</h3>
                    <p style="font-size: 13px; color: #888; margin: 10px auto;">${emptyDesc}</p>
                </div>
            `;
        } else {
            const folders = this.getFolders();
            const items = displayLibros.map(lib => {
                const isFav = lib.favorito === true;
                const folder = lib.carpetaId ? folders.find(f => f.id === lib.carpetaId) : null;
                const badge = folder ? `<span style="background:${folder.color}22; color:${folder.color}; font-size:9px; padding:2px 6px; border-radius:4px; font-weight:700; border:1px solid ${folder.color}44; white-space:nowrap; max-width:90px; overflow:hidden; text-overflow:ellipsis; display:inline-block;" title="${folder.nombre}">${folder.nombre}</span>` : '';
                
                return `
                <div class="lib-book" onclick="Libreria.abrirLector('${lib.id}')">
                    <div class="lib-cover">
                        ${lib.cover ? `<img src="${lib.cover}" style="width:100%; height:100%; object-fit: cover;">` : `<div class="lib-cover-text">${lib.name.substring(0, 40)}${lib.name.length > 40 ? '...' : ''}</div>`}
                    </div>
                    <div class="lib-info">
                        <div class="lib-title" title="${lib.name}" style="height: 32px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 4px;">${lib.name}</div>
                        <div style="margin-bottom:6px; display:flex; align-items:center; height:16px;">${badge}</div>
                        <div class="lib-meta">
                            <span>PDF</span>
                            <div class="lib-actions" style="display:flex; align-items:center; gap:6px;">
                                ${isFav ? `
                                    <i data-lucide="star" style="cursor: pointer; fill: #f59e0b; color: #f59e0b;" onclick="event.stopPropagation(); Libreria.toggleFavorite('${lib.id}')" title="Quitar de favoritos"></i>
                                ` : `
                                    <i data-lucide="star" style="cursor: pointer; color: #94a3b8;" onclick="event.stopPropagation(); Libreria.toggleFavorite('${lib.id}')" title="Marcar como favorito"></i>
                                `}
                                <i data-lucide="folder-input" style="cursor: pointer; color: #6366f1;" onclick="event.stopPropagation(); Libreria.abrirAsignarCarpeta('${lib.id}')" title="Mover a carpeta"></i>
                                <i data-lucide="trash-2" style="cursor: pointer; color: #ef4444;" onclick="event.stopPropagation(); Libreria.borrarLibro('${lib.id}', '${lib.name}')" title="Eliminar documento"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `}).join('');
            grid = `<div class="lib-grid ${this.state.viewMode === 'list' ? 'list-view' : ''}">${items}</div>`;
        }
        return grid;
    },

    renderFavoritos: function () {
        this.init();
        const displayLibros = this.state.libros.filter(l => l.favorito === true);
        const grid = this.buildBookGrid(displayLibros, 'No tienes libros favoritos', 'Haz clic en el icono de estrella en "Todas las Portadas" para agregarlos aquí.');
        return this.renderTemplate('Favoritos', 'Tus lecturas preferidas', grid);
    },

    renderRecientes: function () {
        this.init();
        const displayLibros = this.state.libros.filter(l => l.lastOpened !== undefined && l.lastOpened !== null);
        // Ordenar por lastOpened descendente (más reciente primero)
        displayLibros.sort((a, b) => b.lastOpened - a.lastOpened);
        const grid = this.buildBookGrid(displayLibros, 'No hay lecturas recientes', 'Selecciona un libro en "Todas las Portadas" para comenzar a leer.');
        return this.renderTemplate('Recientes', 'Documentos leídos recientemente', grid);
    },

    renderCarpetas: function () {
        this.init();
        const folders = this.getFolders();
        const folderId = this.state.selectedFolderId;

        if (folderId) {
            const folder = folders.find(f => f.id === folderId);
            if (!folder) {
                this.state.selectedFolderId = null;
                return this.renderCarpetas();
            }
            // Mostrar los libros de esa carpeta
            const displayLibros = this.state.libros.filter(l => l.carpetaId === folderId);
            const grid = this.buildBookGrid(displayLibros, 'Esta carpeta está vacía', 'Puedes mover libros a esta carpeta utilizando el icono de carpeta en cada portada.');
            const header = `
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; background:var(--surface); border:1.5px solid var(--border-soft); border-radius:12px; padding:12px 16px;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:${folder.color || '#ccc'}; display:flex; align-items:center; justify-content:center; color:#fff;">
                            <i data-lucide="folder-open" style="width:20px; height:20px;"></i>
                        </div>
                        <div>
                            <h3 style="font-size:16px; font-weight:800; color:var(--text);">${folder.nombre}</h3>
                            <p style="font-size:11px; color:var(--text-muted);">${displayLibros.length} documentos</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="Libreria.state.selectedFolderId = null; Router.navigate('libreria-carpetas');" style="display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 14px; border-radius:8px;">
                        <i data-lucide="arrow-left" style="width:14px;"></i> Volver a Carpetas
                    </button>
                </div>
            `;
            return this.renderTemplate('Carpetas', folder.nombre, header + grid);
        }

        // Mostrar lista de carpetas
        const folderCards = folders.map(f => {
            const count = this.state.libros.filter(l => l.carpetaId === f.id).length;
            return `
                <div class="card" style="cursor:pointer; border:1.5px solid var(--border-soft); transition:all 0.2s; border-radius:12px; padding:16px; position:relative;" onclick="Libreria.state.selectedFolderId = '${f.id}'; Router.navigate('libreria-carpetas');" onmouseover="this.style.borderColor='${f.color}'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-soft)'; this.style.transform='none';">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px;">
                        <div style="width:48px; height:48px; border-radius:12px; background:${f.color}15; color:${f.color}; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="folder" style="width:26px; height:26px; fill:${f.color}33;"></i>
                        </div>
                        <div style="display:flex; gap:6px; position:relative; z-index:5;">
                            <i data-lucide="trash-2" style="width:16px; height:16px; color:#ef4444; opacity:0.6; cursor:pointer;" onclick="event.stopPropagation(); Libreria.eliminarCarpeta('${f.id}', '${f.nombre}')" title="Eliminar Carpeta"></i>
                        </div>
                    </div>
                    <h4 style="font-size:14px; font-weight:800; color:var(--text); margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${f.nombre}">${f.nombre}</h4>
                    <p style="font-size:11px; color:var(--text-muted);">${count} ${count === 1 ? 'documento' : 'documentos'}</p>
                </div>
            `;
        }).join('');

        // Documentos sin carpeta
        const librosSinCarpeta = this.state.libros.filter(l => !l.carpetaId);
        const gridSinCarpeta = this.buildBookGrid(librosSinCarpeta, 'Todos los libros tienen carpeta', 'Usa los filtros de carpetas para organizarlos.');

        const content = `
            <div style="margin-bottom:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 style="font-size:15px; font-weight:800; color:var(--text);">Mis Carpetas</h3>
                    <button class="btn btn-primary" onclick="Libreria.crearCarpeta()" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border:none; display:inline-flex; align-items:center; gap:6px; height:36px; padding:0 14px; border-radius:8px; font-weight:700;">
                        <i data-lucide="folder-plus" style="width:16px;"></i> + Nueva Carpeta
                    </button>
                </div>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap:16px;">
                    ${folderCards}
                </div>
            </div>
            
            <div style="border-top: 1px solid var(--border-soft); padding-top:20px; margin-top:20px;">
                <h3 style="font-size:15px; font-weight:800; color:var(--text); margin-bottom:12px;">Sin carpeta (${librosSinCarpeta.length})</h3>
                ${gridSinCarpeta}
            </div>
        `;

        return this.renderTemplate('Carpetas', 'Organiza tus lecciones', content);
    },

    renderRED: function () {
        this.init();
        
        // Renderizar catálogo de recursos R.E.D.
        const items = this.recursosRED.map(rec => {
            // Verificar si ya está importado
            const estaImportado = this.state.libros.some(l => l.name === rec.nombre);
            
            let actionBtn;
            if (estaImportado) {
                actionBtn = `
                    <button class="btn btn-secondary btn-sm" disabled style="background:#e2e8f0; color:#94a3b8; border:none; cursor:default; font-weight:700; width:100%; height:32px; border-radius:8px;">
                        Importado ✓
                    </button>
                `;
            } else {
                actionBtn = `
                    <button id="btn-red-${rec.id}" class="btn btn-primary btn-sm" onclick="Libreria.descargarRecursoRED('${rec.id}')" style="background:#0ea5e9; border:none; font-weight:700; width:100%; height:32px; border-radius:8px; box-shadow:0 2px 6px rgba(14,165,233,0.2);">
                        Importar a Pizarra
                    </button>
                `;
            }

            let materiaColor = '#ef4444';
            if (rec.materia === 'Matemáticas') materiaColor = '#3b82f6';
            else if (rec.materia === 'Ciencias Naturales') materiaColor = '#10b981';
            else if (rec.materia === 'Ciencias Sociales') materiaColor = '#f59e0b';
            
            return `
                <div class="card" style="border:1.5px solid var(--border-soft); display:flex; flex-direction:column; justify-content:space-between; padding:16px; border-radius:12px; transition:all 0.2s;" onmouseover="this.style.borderColor='#0ea5e9';" onmouseout="this.style.borderColor='var(--border-soft)';">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span style="background:${materiaColor}15; color:${materiaColor}; font-size:10px; font-weight:800; padding:2px 8px; border-radius:6px; border:1px solid ${materiaColor}25;">${rec.materia}</span>
                            <span style="font-size:10px; font-weight:600; color:var(--text-muted);">${rec.size}</span>
                        </div>
                        <h4 style="font-size:13px; font-weight:800; color:var(--text); margin-bottom:6px; line-height:1.4;">${rec.nombre}</h4>
                        <p style="font-size:11px; color:var(--text-muted); margin-bottom:14px; line-height:1.4;">${rec.desc}</p>
                    </div>
                    <div>
                        ${actionBtn}
                    </div>
                </div>
            `;
        }).join('');

        const content = `
            <div style="background:linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius:14px; padding:20px; color:#fff; margin-bottom:24px; box-shadow:0 4px 14px rgba(14,165,233,0.3);">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:48px; height:48px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center;">
                        <i data-lucide="globe" style="width:24px; height:24px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size:16px; font-weight:800; color:#fff;">Plataforma R.E.D. Honduras</h3>
                        <p style="font-size:12px; color:rgba(255,255,255,0.9); margin-top:4px;">Recursos Educativos Digitales oficiales de la Secretaría de Educación listos para importar a tu pizarra.</p>
                    </div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:16px;">
                ${items}
            </div>
        `;
        return this.renderTemplate('RED', 'Plataforma R.E.D. de Honduras', content);
    },

    renderNube: function () {
        this.init();
        const driveUrl = Store?.data?.perfilDocente?.googleDriveUrl || '';
        
        let content = '';
        if (driveUrl) {
            // Generar archivos simulados de Drive para una experiencia interactiva completa
            content = `
                <div class="card" style="border:1.5px solid var(--border-soft); border-radius:14px; padding:20px; margin-bottom:24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:44px; height:44px; border-radius:50%; background:#22c55e15; color:#22c55e; display:flex; align-items:center; justify-content:center;">
                                <i data-lucide="cloud-lightning" style="width:22px; height:22px;"></i>
                            </div>
                            <div>
                                <h3 style="font-size:15px; font-weight:800; color:var(--text);">Tu Nube de Google Drive está conectada</h3>
                                <p style="font-size:11px; color:var(--text-muted); margin-top:2px;">Enlace: <a href="${driveUrl}" target="_blank" style="color:#2563eb; text-decoration:underline; font-weight:600;">${driveUrl.substring(0, 50)}${driveUrl.length > 50 ? '...' : ''}</a></p>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <a href="${driveUrl}" target="_blank" class="btn btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border:none; display:inline-flex; align-items:center; gap:6px; height:38px; padding:0 16px; border-radius:8px; font-weight:700; text-decoration:none; color:#fff; font-size:13px;">
                                <i data-lucide="external-link" style="width:16px;"></i> Abrir Unidad Drive
                            </a>
                            <button class="btn btn-secondary" onclick="Libreria.desconectarDrive()" style="height:38px; border-radius:8px; font-size:13px;">Desconectar</button>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <h3 style="font-size:15px; font-weight:800; color:var(--text); margin-bottom:12px; display:flex; align-items:center; gap:6px;"><i data-lucide="folder-search" style="width:18px; color:#94a3b8;"></i> Archivos en tu Unidad Drive (Simulado)</h3>
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:16px;">Explora y descarga tus planificaciones de clases u otros recursos pedagógicos:</p>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; flex-wrap:wrap;">
                    <!-- Carpeta Planificaciones -->
                    <div class="card" style="border:1.5px solid var(--border-soft); border-radius:12px; padding:16px;">
                        <h4 style="font-size:13px; font-weight:800; color:var(--text); margin-bottom:12px; display:flex; align-items:center; gap:8px;"><i data-lucide="folder" style="color:#f59e0b; width:16px; fill:#f59e0b22;"></i> Planificaciones y Jornalizaciones</h4>
                        
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; gap:8px;">
                                <div style="display:flex; align-items:center; gap:8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
                                    <i data-lucide="file-text" style="color:#2563eb; width:14px; flex-shrink:0;"></i>
                                    <span style="font-size:11px; font-weight:700; color:#334155;" title="Jornalizacion_Anual_Espanol.pdf">Jornalizacion_Anual_Espanol.pdf</span>
                                </div>
                                <button class="btn btn-secondary btn-sm" onclick="Libreria.importarLibroDriveSimulado('Jornalizacion_Anual_Espanol', '1.2 MB')" style="padding:2px 8px; font-size:10px; font-weight:800; height:24px; flex-shrink:0;">Importar</button>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; gap:8px;">
                                <div style="display:flex; align-items:center; gap:8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
                                    <i data-lucide="file-text" style="color:#2563eb; width:14px; flex-shrink:0;"></i>
                                    <span style="font-size:11px; font-weight:700; color:#334155;" title="Planificacion_Clases_7mo_Espanol.pdf">Planificacion_Clases_7mo_Espanol.pdf</span>
                                </div>
                                <button class="btn btn-secondary btn-sm" onclick="Libreria.importarLibroDriveSimulado('Planificacion_Clases_7mo_Espanol', '2.4 MB')" style="padding:2px 8px; font-size:10px; font-weight:800; height:24px; flex-shrink:0;">Importar</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Carpeta Evaluaciones -->
                    <div class="card" style="border:1.5px solid var(--border-soft); border-radius:12px; padding:16px;">
                        <h4 style="font-size:13px; font-weight:800; color:var(--text); margin-bottom:12px; display:flex; align-items:center; gap:8px;"><i data-lucide="folder" style="color:#f59e0b; width:16px; fill:#f59e0b22;"></i> Evaluaciones y Rúbricas</h4>
                        
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; gap:8px;">
                                <div style="display:flex; align-items:center; gap:8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
                                    <i data-lucide="file-text" style="color:#2563eb; width:14px; flex-shrink:0;"></i>
                                    <span style="font-size:11px; font-weight:700; color:#334155;" title="Prueba_Espanol_Primer_Parcial.pdf">Prueba_Espanol_Primer_Parcial.pdf</span>
                                </div>
                                <button class="btn btn-secondary btn-sm" onclick="Libreria.importarLibroDriveSimulado('Prueba_Espanol_Primer_Parcial', '0.8 MB')" style="padding:2px 8px; font-size:10px; font-weight:800; height:24px; flex-shrink:0;">Importar</button>
                            </div>
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; gap:8px;">
                                <div style="display:flex; align-items:center; gap:8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
                                    <i data-lucide="file-text" style="color:#2563eb; width:14px; flex-shrink:0;"></i>
                                    <span style="font-size:11px; font-weight:700; color:#334155;" title="Rubrica_Lectura_Comprensiva.pdf">Rubrica_Lectura_Comprensiva.pdf</span>
                                </div>
                                <button class="btn btn-secondary btn-sm" onclick="Libreria.importarLibroDriveSimulado('Rubrica_Lectura_Comprensiva', '0.6 MB')" style="padding:2px 8px; font-size:10px; font-weight:800; height:24px; flex-shrink:0;">Importar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            content = `
                <div class="card" style="max-width:500px; margin:20px auto; border:1.5px solid var(--border-soft); border-radius:16px; padding:30px; text-align:center; box-shadow:var(--shadow-sm);">
                    <div style="width:64px; height:64px; border-radius:50%; background:#3b82f615; color:#3b82f6; display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto;">
                        <i data-lucide="cloud" style="width:32px; height:32px;"></i>
                    </div>
                    <h3 style="font-size:16px; font-weight:800; color:var(--text); margin-bottom:10px;">Conecta tu Nube de Google Drive</h3>
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:20px; line-height:1.5;">Ingresa el enlace de tu carpeta compartida de Google Drive para poder ver y organizar tus planificaciones, exámenes y lecciones directamente en Pizarra 360.</p>
                    
                    <div style="margin-bottom:20px; text-align:left;">
                        <label style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; display:block;">Enlace de Google Drive</label>
                        <input id="drive-url-input" type="url" class="form-control" placeholder="https://drive.google.com/drive/folders/..." style="height:42px; border-radius:10px; font-weight:700; font-size:13px; padding:0 12px;">
                    </div>
                    
                    <button class="btn btn-primary" onclick="Libreria.conectarDrive()" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border:none; width:100%; height:42px; border-radius:10px; font-weight:700;">
                        Conectar Google Drive
                    </button>
                </div>
            `;
        }
        return this.renderTemplate('Nube', 'Almacenamiento en la Nube', content);
    },

    conectarDrive: function() {
        const input = document.getElementById('drive-url-input');
        const url = input ? input.value.trim() : '';
        if (!url || !url.startsWith('http')) {
            UI.toast('Por favor ingresa un enlace de Google Drive válido', 'error');
            return;
        }

        if (!Store.data.perfilDocente) Store.data.perfilDocente = {};
        Store.data.perfilDocente.googleDriveUrl = url;
        Store.save();
        
        Router.navigate('libreria-nube');
        UI.toast('Google Drive conectado ✓', 'success');
    },

    desconectarDrive: function() {
        UI.confirm('¿Deseas desconectar tu Google Drive?', () => {
            if (Store.data.perfilDocente) {
                Store.data.perfilDocente.googleDriveUrl = '';
                Store.save();
            }
            Router.navigate('libreria-nube');
            UI.toast('Google Drive desconectado', 'info');
        });
    },

    importarLibroDriveSimulado: async function(name, size) {
        try {
            const bookId = 'book_drive_' + Date.now();
            
            // Generar portada de Drive con color azul
            const canvas = document.createElement('canvas');
            canvas.width = 110;
            canvas.height = 160;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, 160);
            grad.addColorStop(0, '#3b82f6');
            grad.addColorStop(1, '#1e3a8a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 110, 160);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(0, 0, 8, 160);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px Outfit, sans-serif';
            ctx.textAlign = 'center';
            
            // Wrap text
            const title = name.replace(/_/g, ' ');
            const words = title.split(' ');
            let line = '';
            let y = 60;
            for (let i = 0; i < words.length; i++) {
                let testLine = line + words[i] + ' ';
                if (ctx.measureText(testLine).width > 70 && i > 0) {
                    ctx.fillText(line, 55, y);
                    line = words[i] + ' ';
                    y += 12;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 55, y);
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = 'bold 8px Outfit, sans-serif';
            ctx.fillText('GOOGLE DRIVE', 55, 135);
            
            const coverBase64 = canvas.toDataURL('image/jpeg', 0.85);

            // Generar PDF
            const pdfContent = `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj
3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 150>> stream
BT
/F1 18 Tf
50 780 Td
(${title}) Tj
/F1 12 Tf
0 -40 Td
(Documento importado desde Google Drive) Tj
0 -30 Td
(Tamano: ${size}) Tj
0 -30 Td
(Puedes usar esta pizarra virtual para preparar tus lecciones offline.) Tj
ET
endstream
endobj
5 0 obj <</Type/Font/Subtype/Type1/BaseFont/Helvetica>> endobj
trailer <</Size 6/Root 1 0 R>>
%%EOF`;
            
            const buf = new ArrayBuffer(pdfContent.length);
            const bufView = new Uint8Array(buf);
            for (let i = 0; i < pdfContent.length; i++) {
                bufView[i] = pdfContent.charCodeAt(i);
            }

            await Libreria.db.savePdf(bookId, buf);
            
            Libreria.state.libros.push({
                id: bookId,
                name: title,
                size: size,
                date: new Date().toLocaleDateString(),
                cover: coverBase64
            });
            Libreria.save();
            
            UI.toast(`¡Archivo "${title}" importado con éxito a tu biblioteca!`, 'success');
            Router.navigate('libreria-todas');
        } catch(e) {
            console.error(e);
            UI.toast('Error al importar archivo de Drive', 'error');
        }
    },

    getFolders: function() {
        const raw = localStorage.getItem('gdhn_libreria_folders');
        if (raw) {
            try { return JSON.parse(raw); } catch(e) {}
        }
        // Carpetas por defecto
        const defaults = [
            { id: 'f_default_1', nombre: 'Planificaciones', color: '#3b82f6' },
            { id: 'f_default_2', nombre: 'Exámenes', color: '#ef4444' },
            { id: 'f_default_3', nombre: 'Lecturas Recomendadas', color: '#10b981' }
        ];
        localStorage.setItem('gdhn_libreria_folders', JSON.stringify(defaults));
        return defaults;
    },

    saveFolders: function(folders) {
        localStorage.setItem('gdhn_libreria_folders', JSON.stringify(folders));
    },

    toggleFavorite: function(bookId) {
        const lib = this.state.libros.find(b => b.id === bookId);
        if (lib) {
            lib.favorito = !lib.favorito;
            this.save();
            Router.navigate(Router.current);
            UI.toast(lib.favorito ? 'Agregado a favoritos ★' : 'Quitado de favoritos ☆', 'success');
        }
    },

    abrirAsignarCarpeta: function(bookId) {
        const lib = this.state.libros.find(b => b.id === bookId);
        if (!lib) return;
        const folders = this.getFolders();
        const currentFolderId = lib.carpetaId;

        const folderOptions = folders.map(f => `
            <div class="layout-option" style="display:flex; align-items:center; justify-content:space-between; padding:12px; border: 1px solid var(--border-soft); border-radius:10px; margin-bottom:8px; cursor:pointer;" onclick="Libreria.asignarCarpeta('${bookId}', '${f.id}')">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:14px; height:14px; border-radius:50%; background:${f.color || '#ccc'};"></div>
                    <span style="font-weight:700; color:var(--text);">${f.nombre}</span>
                </div>
                ${currentFolderId === f.id ? '<span style="color:#00C853; font-weight:800; font-size:12px;">✓ Seleccionada</span>' : ''}
            </div>
        `).join('');

        UI.modal('📁 Mover a Carpeta', `
            <div style="padding:10px 0;">
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">Selecciona una carpeta para el documento <strong>"${lib.name}"</strong>:</p>
                <div style="max-height:280px; overflow-y:auto; margin-bottom:16px;">
                    ${folderOptions || '<p style="text-align:center; padding:20px; color:#94a3b8;">No tienes carpetas creadas.</p>'}
                </div>
                <div style="display:flex; gap:10px;">
                    ${currentFolderId ? `
                        <button class="btn btn-secondary" onclick="Libreria.asignarCarpeta('${bookId}', null)" style="flex:1;">Quitar de Carpeta</button>
                    ` : ''}
                    <button class="btn btn-primary" onclick="Libreria.crearCarpetaYAsignar('${bookId}')" style="flex:1; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border:none;">+ Nueva Carpeta</button>
                </div>
            </div>
        `);
    },

    asignarCarpeta: function(bookId, folderId) {
        const lib = this.state.libros.find(b => b.id === bookId);
        if (lib) {
            lib.carpetaId = folderId;
            this.save();
            UI.closeModal();
            Router.navigate(Router.current);
            UI.toast('Documento movido con éxito', 'success');
        }
    },

    crearCarpetaYAsignar: function(bookId) {
        UI.closeModal();
        setTimeout(() => {
            const nombre = prompt('Escribe el nombre de la nueva carpeta:');
            if (!nombre || nombre.trim() === '') return;
            
            const folders = this.getFolders();
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            const newFolder = {
                id: 'folder_' + Date.now() + Math.random().toString(36).substr(2, 5),
                nombre: nombre.trim(),
                color: randomColor
            };
            folders.push(newFolder);
            this.saveFolders(folders);
            
            this.asignarCarpeta(bookId, newFolder.id);
        }, 200);
    },

    crearCarpeta: function() {
        const nombre = prompt('Nombre de la nueva carpeta:');
        if (!nombre || nombre.trim() === '') return;

        const folders = this.getFolders();
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newFolder = {
            id: 'folder_' + Date.now() + Math.random().toString(36).substr(2, 5),
            nombre: nombre.trim(),
            color: randomColor
        };
        folders.push(newFolder);
        this.saveFolders(folders);

        Router.navigate('libreria-carpetas');
        UI.toast('Carpeta creada con éxito 📁', 'success');
    },

    eliminarCarpeta: function(folderId, nombre) {
        UI.confirm(`¿Deseas eliminar la carpeta "${nombre}"? Los libros que contiene no serán eliminados, quedarán sueltos.`, () => {
            let folders = this.getFolders();
            folders = folders.filter(f => f.id !== folderId);
            this.saveFolders(folders);

            // Quitar carpetaId de los libros que estaban en ella
            this.state.libros.forEach(b => {
                if (b.carpetaId === folderId) {
                    b.carpetaId = null;
                }
            });
            this.save();

            Router.navigate('libreria-carpetas');
            UI.toast('Carpeta eliminada', 'info');
        });
    },

    descargarRecursoRED: async function (recId) {
        const rec = this.recursosRED.find(r => r.id === recId);
        if (!rec) return;

        const btn = document.getElementById(`btn-red-${recId}`);
        if (btn) {
            btn.innerHTML = `<span class="spinner" style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation: spin 0.8s linear infinite; margin-right:6px; vertical-align: middle;"></span> Descargando...`;
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
        }

        setTimeout(async () => {
            try {
                const bookId = 'book_red_' + Date.now();
                
                // Generar PDF enriquecido de múltiples páginas
                UI.toast('Generando páginas del libro digital...', 'info');
                const buf = await Libreria.generateTextbookPDF(rec);
                
                // Extraer portada real del PDF generado
                let coverBase64 = null;
                await Libreria.ensurePdfJs();
                if (window.pdfjsLib) {
                    try {
                        const bytes = new Uint8Array(buf);
                        const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
                        if (pdf.numPages > 0) {
                            const page = await pdf.getPage(1);
                            const viewport = page.getViewport({ scale: 0.5 });
                            const canvas = document.createElement('canvas');
                            canvas.width = viewport.width;
                            canvas.height = viewport.height;
                            await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
                            coverBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        }
                    } catch (err) {
                        console.error('Error generando miniatura real:', err);
                    }
                }
                
                // Fallback si falla la miniatura real
                if (!coverBase64) {
                    coverBase64 = Libreria.generateCoverCanvas(rec.nombre, rec.materia);
                }
                
                // Guardar en la DB
                await Libreria.db.savePdf(bookId, buf);
                
                // Añadir metadatos a la biblioteca
                Libreria.state.libros.push({
                    id: bookId,
                    name: rec.nombre,
                    size: rec.size,
                    date: new Date().toLocaleDateString(),
                    cover: coverBase64,
                    redId: recId
                });
                
                Libreria.save();
                
                UI.toast(`¡Recurso "${rec.nombre}" importado con éxito!`, 'success');
                Router.navigate('libreria-red');
            } catch(e) {
                console.error(e);
                UI.toast('Error al importar el recurso', 'error');
                if (btn) {
                    btn.innerHTML = `Importar a Pizarra`;
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                }
            }
        }, 1500);
    },

    getSubjectColor: function(materia) {
        switch((materia || '').toLowerCase()) {
            case 'español': case 'espanol': return '#ef4444';
            case 'matemáticas': case 'matematicas': return '#3b82f6';
            case 'ciencias naturales': return '#10b981';
            case 'ciencias sociales': return '#f59e0b';
            default: return '#6366f1';
        }
    },

    generateTextbookPDF: async function(rec) {
        const color = this.getSubjectColor(rec.materia);
        const container = document.createElement('div');
        container.style.width = '794px';
        container.style.background = '#fff';
        container.style.color = '#334155';
        container.style.fontFamily = "system-ui, -apple-system, sans-serif";
        container.style.fontSize = '14px';
        container.style.lineHeight = '1.6';
        
        let html = `
            <style>
                .pdf-page {
                    width: 794px;
                    height: 1120px;
                    box-sizing: border-box;
                    padding: 70px 80px;
                    position: relative;
                    background: #fff;
                    display: flex;
                    flex-direction: column;
                    page-break-after: always;
                }
                .pdf-cover {
                    align-items: center;
                    justify-content: space-between;
                    text-align: center;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 24px solid ${color};
                    padding: 80px 50px;
                }
                .pdf-cover-title {
                    font-size: 32px;
                    font-weight: 900;
                    color: #0f172a;
                    margin-top: 60px;
                    line-height: 1.2;
                }
                .pdf-cover-subtitle {
                    font-size: 16px;
                    color: #475569;
                    margin-top: 10px;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
                .pdf-badge {
                    padding: 6px 16px;
                    background: ${color};
                    color: #fff;
                    font-weight: 800;
                    border-radius: 20px;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin-top: 30px;
                    letter-spacing: 1.5px;
                }
                .pdf-h1 {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    border-bottom: 2px solid ${color};
                    padding-bottom: 6px;
                    margin-top: 0;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                }
                .pdf-h2 {
                    font-size: 15px;
                    font-weight: bold;
                    color: #1e293b;
                    margin-top: 18px;
                    margin-bottom: 8px;
                }
                .pdf-p {
                    margin-bottom: 12px;
                    text-align: justify;
                    font-size: 13.5px;
                }
                .pdf-highlight {
                    background: #f8fafc;
                    border-left: 4px solid ${color};
                    padding: 12px 16px;
                    margin: 16px 0;
                    font-style: italic;
                    font-size: 13px;
                    border-radius: 0 8px 8px 0;
                }
                .pdf-exercise {
                    background: #f0fdf4;
                    border: 1px dashed #bbf7d0;
                    padding: 14px;
                    border-radius: 8px;
                    margin-top: 20px;
                    font-size: 13px;
                }
                .pdf-exercise-title {
                    font-weight: bold;
                    color: #166534;
                    margin-bottom: 6px;
                }
                .pdf-toc-item {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 1px dotted #cbd5e1;
                    margin-bottom: 10px;
                    padding-bottom: 4px;
                    font-size: 13.5px;
                }
                .pdf-toc-name { font-weight: 600; color: #334155; }
                .pdf-toc-page { font-weight: bold; color: ${color}; }
                .pdf-footer {
                    position: absolute;
                    bottom: 35px;
                    left: 80px;
                    right: 80px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #94a3b8;
                    font-weight: bold;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 10px;
                }
            </style>
        `;

        html += `
            <div class="pdf-page pdf-cover">
                <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">República de Honduras<br>Secretaría de Educación</div>
                <div>
                    <span class="pdf-badge">${rec.materia}</span>
                    <h1 class="pdf-cover-title">${rec.nombre}</h1>
                    <p class="pdf-cover-subtitle">Cuaderno de Trabajo y Aprendizaje</p>
                    <div style="width: 80px; height: 4px; background: ${color}; margin: 30px auto;"></div>
                </div>
                <div style="font-size: 11px; color: #64748b; font-weight: 700;">
                    Tercer Ciclo de Educación Básica<br>
                    Distribución Gratuita — Prohibida su venta
                </div>
            </div>
        `;

        html += `
            <div class="pdf-page">
                <h1 class="pdf-h1">Presentación e Índice</h1>
                <div style="margin-bottom: 24px;">
                    <p class="pdf-p">Estimado docente y estudiante: Este cuaderno ha sido diseñado por la Secretaría de Educación de Honduras como una herramienta de apoyo en el proceso de enseñanza y aprendizaje de la materia de <strong>${rec.materia}</strong>. Esperamos que este recurso sea de máxima utilidad para preparar las clases y reforzar las competencias básicas del grado.</p>
                    <div class="pdf-highlight">
                        "La educación es el arma más poderosa que puedes usar para cambiar el mundo." — Nelson Mandela
                    </div>
                </div>
                
                <h2 class="pdf-h2" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Contenido Curricular</h2>
                <div style="margin-top: 12px; flex: 1;">
                    <div class="pdf-toc-item">
                        <span class="pdf-toc-name">Lección 1: Introducción y Fundamentos Curriculares</span>
                        <span class="pdf-toc-page">Pág. 3</span>
                    </div>
                    <div class="pdf-toc-item">
                        <span class="pdf-toc-name">Lección 2: Lectura Comprensiva y Análisis de Textos</span>
                        <span class="pdf-toc-page">Pág. 4</span>
                    </div>
                    <div class="pdf-toc-item">
                        <span class="pdf-toc-name">Lección 3: Aplicaciones Prácticas y Conceptos Clave</span>
                        <span class="pdf-toc-page">Pág. 5</span>
                    </div>
                    <div class="pdf-toc-item">
                        <span class="pdf-toc-name">Bloque de Ejercicios y Autoevaluación Curricular</span>
                        <span class="pdf-toc-page">Pág. 6</span>
                    </div>
                </div>
                <div class="pdf-footer">
                    <span>${rec.nombre}</span>
                    <span>Página 2</span>
                </div>
            </div>
        `;

        let page3 = '';
        let page4 = '';
        let page5 = '';
        let page6 = '';

        if (rec.materia.toLowerCase().includes('español') || rec.materia.toLowerCase().includes('espanol')) {
            page3 = `
                <h1 class="pdf-h1">Lección 1: La Tradición Oral y la Narración</h1>
                <div class="content-block">
                    <p class="pdf-p">La tradición oral constituye el conjunto de conocimientos, valores, creencias y leyendas que se transmiten de una generación a otra mediante la palabra hablada. En Honduras, esta tradición es rica y diversa, manifestándose en mitos, cuentos populares y relatos históricos que forman parte de la identidad cultural nacional.</p>
                    
                    <h2 class="pdf-h2">El Arte de Narrar</h2>
                    <p class="pdf-p">Narrar consiste en relatar acontecimientos reales o ficticios en los que participan personajes dentro de un espacio y tiempo determinados. Los elementos constitutivos de la narración son:</p>
                    <p class="pdf-p"><strong>• El Narrador:</strong> Es la voz que cuenta la historia. Puede estar en primera persona (narrador protagonista o testigo) o en tercera persona (narrador omnisciente).</p>
                    <p class="pdf-p"><strong>• Los Personajes:</strong> Son los seres que realizan las acciones. Se dividen en principales (protagonistas) y secundarios.</p>
                    <p class="pdf-p"><strong>• La Estructura:</strong> Consta habitualmente de tres partes: Inicio (presentación), Nudo (desarrollo del conflicto) y Desenlace (resolución del conflicto).</p>
                    
                    <div class="pdf-highlight">
                        Actividad en el aula: Discute con tus compañeros sobre alguna leyenda o relato que te hayan contado tus abuelos. ¿Cómo influye la tradición oral en nuestra comunidad?
                    </div>
                </div>
            `;
            
            page4 = `
                <h1 class="pdf-h1">Lección 2: Fragmento - "La i latina"</h1>
                <div class="content-block">
                    <h2 class="pdf-h2">Lectura Comprensiva (Froylán Turcios)</h2>
                    
                    <div style="font-size:12.5px; line-height:1.5; color:#1e293b; background:#fafafa; border:1px solid #e2e8f0; padding:12px; border-radius:6px; margin-bottom:12px; text-align:justify;">
                        <strong>La i latina</strong><br><br>
                        ¡No, no era posible! andando ya en siete años y burrito, burrito, sin conocer la o por lo redondo y dando más que hacer que una ardilla.<br>
                        ¡Nada! ¡Nada! dijo mi abuelita. A ponerlo en la escuela...<br>
                        Y desde ese día, con aquella eficacia activa en el milagro de sus setenta años, se dio a buscarme una maestra. Mi madre no quería; protestó que estaba todavía pequeño, pero ella insistió resueltamente. Y una tarde al entrar de la calle, deshizo unos envoltorios que le trajeron y sacando un bulto, una pizarra con su esponja, un libro de tipo gordo y muchas figuras y un atadito de lápices, me dijo poniendo en mí aquella grave dulzura de sus ojos azules: «Mañana, hijito, casa de la señorita que es muy buena y te va a enseñar muchas cosas...»<br><br>
                        Yo me abracé a su cuello, corrí por toda la casa, mostré a los sirvientes mi bulto nuevo, mi pizarra flamante, mi libro, todo marcado con mi nombre en la magnífica letra de mi madre, un libro que se me antojaba un cofrecillo sorprendente, lleno de maravillas! Y la tarde esa y la noche esa sin quererme dormir, pensé cuántas cosas podría leer y saber en aquellos grandes librotes forrados de piel que dejó mi tío el que fue abogado y que yo hojeaba para admirar las viñetas y las rojas mayúsculas y los montoncitos de caracteres manuscritos que llenaban el margen amarillento.
                    </div>
                    
                    <p class="pdf-p">Este relato muestra la ilusión de un niño ante el inicio de su educación formal y la fascinación por la lectura, representada por los libros de su tío abogado.</p>
                </div>
            `;
            
            page5 = `
                <h1 class="pdf-h1">Lección 3: El Vocabulario y la Expresión Escrita</h1>
                <div class="content-block">
                    <p class="pdf-p">La lectura enriquece nuestro vocabulario. Al leer clásicos literarios, encontramos palabras de uso formal que amplían nuestra capacidad expresiva y de razonamiento. A continuación se presentan términos del fragmento anterior:</p>
                    
                    <h2 class="pdf-h2">Glosario Temático</h2>
                    <p class="pdf-p"><strong>• Pizarra:</strong> Plancha de piedra u otro material usada en las escuelas para escribir o dibujar en ella con tiza o lápiz especial.</p>
                    <p class="pdf-p"><strong>• Flamante:</strong> Que es nuevo, recién estrenado o brilla de limpio y nuevo.</p>
                    <p class="pdf-p"><strong>• Viñeta:</strong> Dibujo o grabado que adorna el principio o el fin de un libro o de un capítulo.</p>
                    <p class="pdf-p"><strong>• Caracteres:</strong> Letras, signos o símbolos de la escritura o de la imprenta.</p>
                    
                    <div class="pdf-highlight">
                        "El libro se le antojaba un cofrecillo sorprendente, lleno de maravillas." Esta metáfora representa el valor incalculable de la lectura en el desarrollo de la imaginación infantil.
                    </div>
                </div>
            `;
            
            page6 = `
                <h1 class="pdf-h1">Autoevaluación de Español</h1>
                <div class="content-block">
                    <p class="pdf-p">Responde a las siguientes preguntas en tu cuaderno o utilizando las herramientas de anotación:</p>
                    
                    <div class="pdf-exercise">
                        <div class="pdf-exercise-title">Actividad 1: Comprensión Lectora</div>
                        <p class="pdf-p">1. ¿Qué edad tiene el narrador al inicio del fragmento y qué opinaba su abuela de él?</p>
                        <p class="pdf-p">2. ¿Por qué la madre del niño se oponía a que fuera a la escuela?</p>
                        <p class="pdf-p">3. ¿Qué significaban para el niño los libros que dejó su tío abogado?</p>
                    </div>
                    
                    <div class="pdf-exercise" style="margin-top:16px;">
                        <div class="pdf-exercise-title">Actividad 2: Creación Literaria</div>
                        <p class="pdf-p">Escribe una breve composición de dos párrafos relatando cómo fue tu primer día de clases o el primer libro que leíste y te causó una gran impresión.</p>
                    </div>
                </div>
            `;
        } else if (rec.materia.toLowerCase().includes('matemát') || rec.materia.toLowerCase().includes('matemat')) {
            page3 = `
                <h1 class="pdf-h1">Lección 1: Números Positivos y Negativos</h1>
                <div class="content-block">
                    <p class="pdf-p">En la vida cotidiana, nos enfrentamos a situaciones que no se pueden representar solo con números naturales. Por ejemplo, temperaturas bajo cero, deudas financieras o altitudes bajo el nivel del mar. Para representar estas cantidades, introducimos los números negativos.</p>
                    
                    <h2 class="pdf-h2">Los Números Enteros</h2>
                    <p class="pdf-p">El conjunto de los números enteros está formado por los números positivos (+1, +2, +3...), el número cero (0) y los números negativos (-1, -2, -3...).</p>
                    <p class="pdf-p"><strong>• Números Positivos:</strong> Representan ganancias, aumentos, alturas sobre el nivel del mar o temperaturas cálidas. Se ubican a la derecha del cero en la recta numérica.</p>
                    <p class="pdf-p"><strong>• Números Negativos:</strong> Representan pérdidas, deudas, profundidades o temperaturas heladas. Se ubican a la izquierda del cero.</p>
                    
                    <div class="pdf-highlight">
                        Ejemplo práctico: La ciudad de La Esperanza, Intibucá, registra una temperatura de 3 grados bajo cero. Esto se expresa matemáticamente como -3 °C.
                    </div>
                </div>
            `;
            
            page4 = `
                <h1 class="pdf-h1">Lección 2: Operaciones con Números Enteros</h1>
                <div class="content-block">
                    <h2 class="pdf-h2">Suma y Resta de Enteros</h2>
                    <p class="pdf-p">Para operar números positivos y negativos en sumas y restas, aplicamos las siguientes reglas:</p>
                    <p class="pdf-p"><strong>1. Signos iguales:</strong> Se suman los valores absolutos y se conserva el mismo signo.</p>
                    <p class="pdf-p">Ejemplo: (+5) + (+3) = +8 | (-5) + (-3) = -8</p>
                    <p class="pdf-p"><strong>2. Signos contrarios:</strong> Se resta el valor menor del mayor y se conserva el signo del número con mayor valor absoluto.</p>
                    <p class="pdf-p">Ejemplo: (-7) + (+3) = -4 | (+10) + (-4) = +6</p>
                    
                    <div class="pdf-highlight">
                        <strong>Regla de la Multiplicación (Regla de Signos):</strong><br>
                        • (+) x (+) = (+)<br>
                        • (-) x (-) = (+)<br>
                        • (+) x (-) = (-)<br>
                        • (-) x (+) = (-)
                    </div>
                </div>
            `;
            
            page5 = `
                <h1 class="pdf-h1">Lección 3: Ecuaciones de Primer Grado</h1>
                <div class="content-block">
                    <p class="pdf-p">Una ecuación es una igualdad matemática entre dos expresiones algebraicas que contiene una o más variables (incógnitas) cuyo valor deseamos conocer.</p>
                    
                    <h2 class="pdf-h2">Resolución de Ecuaciones Lineales</h2>
                    <p class="pdf-p">Para resolver la ecuación <strong>3x + 5 = 20</strong>, aplicamos las reglas de transposición de términos:</p>
                    <p class="pdf-p"><strong>Paso 1: Transponer el término numérico.</strong> El número +5 pasa al otro lado de la ecuación restando:<br>
                    3x = 20 - 5<br>
                    3x = 15</p>
                    <p class="pdf-p"><strong>Paso 2: Transponer el coeficiente.</strong> El número 3 que multiplica a la variable pasa al otro lado dividiendo:<br>
                    x = 15 / 3<br>
                    <strong>x = 5</strong></p>
                    
                    <div class="pdf-highlight">
                        Comprobación: Reemplazamos x = 5 en la ecuación original: 3(5) + 5 = 15 + 5 = 20. La igualdad es correcta.
                    </div>
                </div>
            `;
            
            page6 = `
                <h1 class="pdf-h1">Ejercicios de Matemáticas</h1>
                <div class="content-block">
                    <p class="pdf-p">Resuelve los siguientes ejercicios de forma ordenada:</p>
                    
                    <div class="pdf-exercise">
                        <div class="pdf-exercise-title">Actividad 1: Operaciones con Enteros</div>
                        <p class="pdf-p">a) (-12) + (-8) = _____</p>
                        <p class="pdf-p">b) (+15) + (-20) = _____</p>
                        <p class="pdf-p">c) (-5) x (-4) = _____</p>
                        <p class="pdf-p">d) (+24) / (-3) = _____</p>
                    </div>
                    
                    <div class="pdf-exercise" style="margin-top:16px;">
                        <div class="pdf-exercise-title">Actividad 2: Resolución de Ecuaciones</div>
                        <p class="pdf-p">1. Resolver: 2x - 8 = 10</p>
                        <p class="pdf-p">2. Resolver: 5x + 3 = 2x + 12</p>
                    </div>
                </div>
            `;
        } else if (rec.materia.toLowerCase().includes('natural')) {
            page3 = `
                <h1 class="pdf-h1">Lección 1: La Célula y la Teoría Celular</h1>
                <div class="content-block">
                    <p class="pdf-p">La célula es la unidad anatómica, fisiológica y genética de todos los seres vivos. Todos los organismos, desde las bacterias unicelulares hasta los seres humanos pluricelulares, están formados por células.</p>
                    
                    <h2 class="pdf-h2">Postulados de la Teoría Celular</h2>
                    <p class="pdf-p"><strong>1. Unidad de estructura:</strong> Todos los seres vivos están formados por una o más células.</p>
                    <p class="pdf-p"><strong>2. Unidad de función:</strong> En las células ocurren todas las funciones vitales (metabolismo, respiración, reproducción).</p>
                    <p class="pdf-p"><strong>3. Unidad de origen:</strong> Toda célula procede de otra preexistente mediante división celular.</p>
                    
                    <div class="pdf-highlight">
                        Las células se dividen en procariotas (sin núcleo definido, como las de bacterias) y eucariotas (con núcleo verdadero delimitado por una membrana, como las de los animales y plantas).
                    </div>
                </div>
            `;
            
            page4 = `
                <h1 class="pdf-h1">Lección 2: Célula Animal vs. Célula Vegetal</h1>
                <div class="content-block">
                    <p class="pdf-p">Aunque ambas son células eucariotas y comparten orgánulos como el núcleo, la mitocondria y el aparato de Golgi, poseen diferencias estructurales importantes adaptadas a sus reinos respectivos:</p>
                    
                    <h2 class="pdf-h2">Diferencias Clave</h2>
                    <p class="pdf-p"><strong>• Pared Celular:</strong> Exclusiva de las células vegetales. Les otorga rigidez y protección.</p>
                    <p class="pdf-p"><strong>• Cloroplastos:</strong> Orgánulos vegetales que contienen clorofila. En ellos se realiza la fotosíntesis para producir su propio alimento.</p>
                    <p class="pdf-p"><strong>• Centriolos:</strong> Exclusivos de células animales. Participan activamente en la división celular.</p>
                    <p class="pdf-p"><strong>• Vacuolas:</strong> Las vegetales tienen una única gran vacuola central que almacena agua; las animales tienen pequeñas vacuolas dispersas.</p>
                </div>
            `;
            
            page5 = `
                <h1 class="pdf-h1">Lección 3: Ecosistemas y Conservación</h1>
                <div class="content-block">
                    <p class="pdf-p">Un ecosistema es un sistema biológico constituido por una comunidad de organismos vivos (biocenosis) y el medio físico donde se relacionan (biotopo).</p>
                    
                    <h2 class="pdf-h2">La Biodiversidad en Honduras</h2>
                    <p class="pdf-p">Honduras cuenta con una inmensa riqueza natural protegida en parques nacionales y reservas de biosfera. Estos ecosistemas albergan especies de flora y fauna endémicas que debemos conservar.</p>
                    <p class="pdf-p"><strong>• Parques Nacionales:</strong> Celaque, La Tigra, Pico Bonito. Protegen bosques nublados y fuentes hídricas críticas.</p>
                    <p class="pdf-p"><strong>• Amenazas:</strong> La deforestación, los incendios forestales y el cambio climático amenazan este equilibrio.</p>
                </div>
            `;
            
            page6 = `
                <h1 class="pdf-h1">Ejercicios de Ciencias Naturales</h1>
                <div class="content-block">
                    <p class="pdf-p">Responde a las siguientes preguntas evaluativas:</p>
                    
                    <div class="pdf-exercise">
                        <div class="pdf-exercise-title">Actividad 1: Complete el Cuadro</div>
                        <p class="pdf-p">Identifica si el orgánulo pertenece a la célula Animal (A), Vegetal (V) o a Ambas (B):</p>
                        <p class="pdf-p">1. Núcleo: _____ | 2. Cloroplastos: _____ | 3. Pared Celular: _____ | 4. Mitocondria: _____</p>
                    </div>
                    
                    <div class="pdf-exercise" style="margin-top:16px;">
                        <div class="pdf-exercise-title">Actividad 2: Preguntas de Análisis</div>
                        <p class="pdf-p">¿Por qué es vital proteger los bosques nublados de Honduras como el Parque Nacional La Tigra?</p>
                    </div>
                </div>
            `;
        } else {
            page3 = `
                <h1 class="pdf-h1">Lección 1: Geografía e Hidrografía de Honduras</h1>
                <div class="content-block">
                    <p class="pdf-p">Honduras está ubicada en el corazón de América Central. Su territorio es mayormente montañoso, surcado por cordilleras y valles fértiles, con costas en el Mar Caribe y en el Océano Pacífico (Golfo de Fonseca).</p>
                    
                    <h2 class="pdf-h2">Ríos Principales</h2>
                    <p class="pdf-p">La red fluvial de Honduras se divide en dos vertientes:</p>
                    <p class="pdf-p"><strong>• Vertiente del Atlántico:</strong> Ríos más largos y caudalosos, como el Ulúa, Patuca, Aguán y el Coco o Segovia.</p>
                    <p class="pdf-p"><strong>• Vertiente del Pacífico:</strong> Ríos más cortos y estacionales, como el Choluteca, Nacaome y el Goascorán.</p>
                    
                    <div class="pdf-highlight">
                        El Lago de Yojoa es el único lago natural de agua dulce del país, constituyendo un importante punto turístico y de biodiversidad.
                    </div>
                </div>
            `;
            
            page4 = `
                <h1 class="pdf-h1">Lección 2: La Cultura Maya y Copán Ruinas</h1>
                <div class="content-block">
                    <p class="pdf-p">Durante el periodo prehispánico, el territorio hondureño fue habitado por diversas culturas indígenas. La civilización maya se asentó en la zona occidental del país, teniendo a Copán como una de sus ciudades-estado más importantes.</p>
                    
                    <h2 class="pdf-h2">El Legado de Copán</h2>
                    <p class="pdf-p">Copán es famoso por su extraordinaria escultura y jeroglíficos. Fue un centro de ciencia, astronomía y arte:</p>
                    <p class="pdf-p"><strong>• La Escalinata de los Jeroglíficos:</strong> El texto tallado en piedra más largo de América prehispánica, que narra la historia de los reyes de Copán.</p>
                    <p class="pdf-p"><strong>• El Altar Q:</strong> Monumento que retrata a los 16 gobernantes de la dinastía de Copán.</p>
                </div>
            `;
            
            page5 = `
                <h1 class="pdf-h1">Lección 3: Próceres de la Patria</h1>
                <div class="content-block">
                    <p class="pdf-p">Honduras honra a los hombres y mujeres que lucharon por la independencia centroamericana y la consolidación de la federación:</p>
                    
                    <h2 class="pdf-h2">Héroes Nacionales</h2>
                    <p class="pdf-p"><strong>• Francisco Morazán:</strong> Paladín de la unión centroamericana, militar y estadista que promovió reformas liberales y la educación laica.</p>
                    <p class="pdf-p"><strong>• José Cecilio del Valle:</strong> Redactor del Acta de Independencia de Centroamérica, intelectual apodado "El Sabio".</p>
                    <p class="pdf-p"><strong>• Lempira:</strong> Cacique lenca que lideró la resistencia indígena contra la conquista española.</p>
                </div>
            `;
            
            page6 = `
                <h1 class="pdf-h1">Ejercicios de Ciencias Sociales</h1>
                <div class="content-block">
                    <p class="pdf-p">Realiza las siguientes actividades evaluativas:</p>
                    
                    <div class="pdf-exercise">
                        <div class="pdf-exercise-title">Actividad 1: Vocabulario Histórico</div>
                        <p class="pdf-p">Define con tus palabras los siguientes conceptos:</p>
                        <p class="pdf-p">1. Independencia: __________________________________________________</p>
                        <p class="pdf-p">2. Soberanía: _____________________________________________________</p>
                    </div>
                    
                    <div class="pdf-exercise" style="margin-top:16px;">
                        <div class="pdf-exercise-title">Actividad 2: Análisis</div>
                        <p class="pdf-p">¿Cuál fue el sueño de Francisco Morazán para los países de Centroamérica y por qué sigue siendo relevante?</p>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            ${html}
            <div class="pdf-page">
                ${page3}
                <div class="pdf-footer"><span>${rec.nombre}</span><span>Página 3</span></div>
            </div>
            
            <div class="pdf-page">
                ${page4}
                <div class="pdf-footer"><span>${rec.nombre}</span><span>Página 4</span></div>
            </div>
            
            <div class="pdf-page">
                ${page5}
                <div class="pdf-footer"><span>${rec.nombre}</span><span>Página 5</span></div>
            </div>
            
            <div class="pdf-page">
                ${page6}
                <div class="pdf-footer"><span>${rec.nombre}</span><span>Página 6</span></div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        const opt = {
            margin: 0,
            filename: rec.nombre + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1.5, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        try {
            const pdfBlob = await window.html2pdf().set(opt).from(container).outputPdf('blob');
            document.body.removeChild(container);
            return await pdfBlob.arrayBuffer();
        } catch (err) {
            console.error("Error generating rich textbook PDF:", err);
            if (container.parentElement) document.body.removeChild(container);
            
            const basicText = `Basic textbook PDF placeholder for ${rec.nombre}`;
            const buf = new ArrayBuffer(basicText.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < basicText.length; i++) view[i] = basicText.charCodeAt(i);
            return buf;
        }
    },

    generateCoverCanvas: function(title, materia) {
        const canvas = document.createElement('canvas');
        canvas.width = 110;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        
        let gradient;
        if (materia === 'Español') {
            gradient = ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, '#f43f5e');
            gradient.addColorStop(1, '#be123c');
        } else if (materia === 'Matemáticas') {
            gradient = ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#1d4ed8');
        } else if (materia === 'Ciencias Naturales') {
            gradient = ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(1, '#047857');
        } else if (materia === 'Ciencias Sociales') {
            gradient = ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, '#f59e0b');
            gradient.addColorStop(1, '#b45309');
        } else {
            gradient = ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, '#6366f1');
            gradient.addColorStop(1, '#4338ca');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 110, 160);
        
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, 0, 8, 160);
        
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(16, 20, 78, 120);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        
        const words = title.split(' ');
        let line = '';
        let y = 55;
        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + ' ';
            let metrics = ctx.measureText(testLine);
            if (metrics.width > 70 && i > 0) {
                ctx.fillText(line, 55, y);
                line = words[i] + ' ';
                y += 12;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 55, y);
        
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 8px Outfit, sans-serif';
        ctx.fillText(materia.toUpperCase(), 55, 130);
        
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '8px Outfit, sans-serif';
        ctx.fillText('SECRETARÍA ED.', 55, 140);
        
        return canvas.toDataURL('image/jpeg', 0.85);
    },

    recursosRED: [
        { id: 'red_esp_7', nombre: 'Libro de Español - 7mo Grado', materia: 'Español', desc: 'Libro del Estudiante oficial de la Secretaría de Educación.', size: '15.4 MB' },
        { id: 'red_esp_8', nombre: 'Libro de Español - 8vo Grado', materia: 'Español', desc: 'Libro del Estudiante oficial de la Secretaría de Educación.', size: '16.1 MB' },
        { id: 'red_esp_9', nombre: 'Libro de Español - 9no Grado', materia: 'Español', desc: 'Libro del Estudiante oficial de la Secretaría de Educación.', size: '14.8 MB' },
        { id: 'red_esp_guia_7', nombre: 'Guía del Docente - Español 7mo', materia: 'Español', desc: 'Guía metodológica oficial para el docente de Español.', size: '10.2 MB' },
        { id: 'red_mat_7', nombre: 'Libro de Matemáticas - 7mo Grado', materia: 'Matemáticas', desc: 'Libro del Estudiante oficial de la Secretaría de Educación.', size: '12.4 MB' },
        { id: 'red_mat_guia_7', nombre: 'Guía del Docente - Matemáticas 7mo', materia: 'Matemáticas', desc: 'Guía metodológica oficial para el docente de Matemáticas.', size: '9.8 MB' },
        { id: 'red_cn_7', nombre: 'Libro de Ciencias Naturales - 7mo Grado', materia: 'Ciencias Naturales', desc: 'Libro del Estudiante oficial de la Secretaría de Educación.', size: '18.2 MB' },
        { id: 'red_cs_7', nombre: 'Libro de Ciencias Sociales - 7mo Grado', materia: 'Ciencias Sociales', desc: 'Libro del Estudiante oficial de la Secretaría de Educación.', size: '17.5 MB' }
    ],

    // UI Tools
    setSearch: function (val) {
        this.state.searchQuery = val.toLowerCase();
        Router.navigate('libreria-todas');
    },

    toggleViewMode: function () {
        this.state.viewMode = this.state.viewMode === 'grid' ? 'list' : 'grid';
        Router.navigate('libreria-todas');
    },

    toggleSortMenu: function (e) {
        if (e) e.stopPropagation();
        const p = document.getElementById('lib-sort-popover');
        if (p) p.classList.toggle('show');
    },

    setSort: function (mode) {
        this.state.sortBy = mode;
        Router.navigate('libreria-todas');
    },

    renderLector: function () {
        return this.renderTemplate('Lector Interno', 'Lector activo actualmente (requiere abrir un PDF)', `
            <div class="card">
                <div class="card-b" style="padding:40px; text-align:center;">
                    <i data-lucide="book-open" style="width: 40px; height: 40px; margin-bottom: 20px; opacity:0.3;"></i>
                    <p>Por favor selecciona un libro desde <b>"Todas las portadas"</b> para abrir el lector incorporado.</p>
                    <button class="btn btn-primary mt-4" onclick="Router.navigate('libreria-todas')">Ir a Biblioteca</button>
                </div>
            </div>
        `);
    },

    // ==========================================
    // LIBRARY LOGIC
    // ==========================================

    handleFileUpload: function (event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        let added = 0;
        const fileList = Array.from(files);

        fileList.forEach(file => {
            const isPdf = (file.type && file.type.includes('pdf')) || file.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const bookId = 'book_' + Date.now() + Math.random().toString(16).slice(2);

                    // 1. Guardar primero el ArrayBuffer intacto en IndexedDB (evita ArrayBuffer desprendido/detached)
                    await this.db.savePdf(bookId, arrayBuffer);

                    // 2. Intentar extraer miniatura usando una copia (slice) del ArrayBuffer
                    let coverBase64 = null;
                    try {
                        await this.ensurePdfJs();
                        if (window.pdfjsLib) {
                            const bytes = new Uint8Array(arrayBuffer.slice(0));
                            const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
                            if (pdf && pdf.numPages > 0) {
                                const page = await pdf.getPage(1);
                                const viewport = page.getViewport({ scale: 0.5 });
                                const canvas = document.createElement('canvas');
                                canvas.width = viewport.width;
                                canvas.height = viewport.height;
                                await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
                                coverBase64 = canvas.toDataURL('image/jpeg', 0.8);
                            }
                        }
                    } catch (thumbErr) {
                        console.warn('No se pudo extraer miniatura de portada para:', file.name, thumbErr);
                    }

                    // 3. Registrar libro en la lista
                    this.state.libros.push({
                        id: bookId,
                        name: file.name.replace(/\.pdf$/i, ''),
                        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                        date: new Date().toLocaleDateString(),
                        cover: coverBase64
                    });
                    this.save();

                    added++;
                    if (added === fileList.length) {
                        UI.toast('¡Documento(s) cargado(s) exitosamente!', 'success');
                        Router.navigate('libreria-todas');
                    }
                } catch (error) {
                    console.error("No se pudo guardar PDF:", error);
                    UI.toast('Error cargando documento: ' + file.name, 'error');
                }
            };

            reader.readAsArrayBuffer(file);
        });

        UI.toast('Procesando documentos y extrayendo portadas...', 'info');
    },

    borrarLibro: async function (bookId, bookName) {
        UI.danger('Eliminar documento de la biblioteca', ['El PDF "' + bookName + '" será eliminado permanentemente de tu dispositivo.'], async () => {
            // Remove from memory
            window.Libreria.state.libros = window.Libreria.state.libros.filter(b => b.id !== bookId);
            window.Libreria.save();

            // Remove from IndexedDB
            try {
                const db = await window.Libreria.db.connect();
                const txn = db.transaction('pdfs', 'readwrite');
                txn.objectStore('pdfs').delete(bookId);
                UI.toast('El archivo ha sido eliminado.', 'info');
            } catch (e) {
                console.error('Libreria: No se pudo borrar de DB', e);
            }

            // Refresh UI
            Router.navigate('libreria-todas');
        }, true); // Require password
    },

    // ==========================================
    // READER (PDF.JS) LOGIC
    // ==========================================

    abrirLector: async function (bookId) {
        const book = this.state.libros.find(b => b.id === bookId);
        if (!book) { UI.toast('Libro no encontrado', 'error'); return; }

        book.lastOpened = Date.now();
        this.save();
        this.state.libroActual = book;

        UI.toast('Cargando libro PDF...', 'info');

        let reader = document.getElementById('gdhn-reader');
        if (!reader) {
            this.init();
            reader = document.getElementById('gdhn-reader');
        }

        try {
            const arrayBuffer = await this.db.getPdf(bookId);
            if (!arrayBuffer) {
                UI.toast('No se encontraron los datos del PDF en el almacenamiento local', 'error');
                return;
            }

            await this.ensurePdfJs();

            const bytes = new Uint8Array(arrayBuffer);
            const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;

            this.state.pdfDoc = pdf;
            this.state.pageNum = 1;

            const titleEl = document.getElementById('reader-title');
            if (titleEl) titleEl.textContent = book.name || book.title || 'Documento PDF';

            const pageCountEl = document.getElementById('reader-page-count');
            if (pageCountEl) pageCountEl.textContent = pdf.numPages;

            if (reader) {
                reader.style.display = 'flex';
                reader.classList.add('active');
                reader.style.zIndex = '999999';
            }

            const loadingEl = document.getElementById('reader-loading');
            if (loadingEl) loadingEl.style.display = 'block';

            await this.renderLayout();

            if (window.lucide) lucide.createIcons();
            UI.toast('¡Libro abierto exitosamente!', 'success');
        } catch (err) {
            console.error('Error abriendo lector PDF:', err);
            UI.toast('Error al procesar y abrir el libro PDF', 'error');
        }
    },

    closeLector: function () {
        const reader = document.getElementById('gdhn-reader');
        if (reader) {
            reader.classList.remove('active');
            reader.style.display = 'none';
        }
        this.state.pdfDoc = null;
        this.state.libroActual = null;
    },

    updateThumbnailsActive: function() {
        const strip = document.getElementById('reader-thumbnails-strip');
        if (!strip) return;
        const btns = strip.querySelectorAll('.thumb-btn');
        btns.forEach(btn => {
            if (parseInt(btn.dataset.page) === this.state.pageNum) {
                btn.classList.add('active');
                // Scroll into view
                btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } else {
                btn.classList.remove('active');
            }
        });
    },

    renderThumbnailsStrip: function() {
        const strip = document.getElementById('reader-thumbnails-strip');
        if (!strip || !this.state.pdfDoc) return;
        strip.innerHTML = '';
        for (let i = 1; i <= this.state.pdfDoc.numPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'thumb-btn' + (i === this.state.pageNum ? ' active' : '');
            btn.textContent = i;
            btn.dataset.page = i;
            btn.title = `Ir a la página ${i}`;
            btn.onclick = () => this.goToPage(i);
            strip.appendChild(btn);
        }
        
        // Re-iniciar íconos si hace falta
        if (window.lucide) lucide.createIcons();
    },

    toggleThumbnailsStrip: function() {
        const strip = document.getElementById('reader-thumbnails-strip');
        const btn = document.getElementById('thumb-toggle-btn');
        if (strip && btn) {
            strip.classList.toggle('hidden');
            btn.classList.toggle('hidden');
            if (!strip.classList.contains('hidden') && strip.childElementCount === 0) {
                this.renderThumbnailsStrip();
            }
            if (!strip.classList.contains('hidden')) {
                this.updateThumbnailsActive();
            }
        }
    },

    renderLayout: async function (preserveScroll = false) {
        if (!this.state.pdfDoc) return;
        const body = document.querySelector('.reader-body');
        let scrollRelX = 0, scrollRelY = 0;
        
        if (preserveScroll && body && body.scrollWidth > 0 && body.scrollHeight > 0) {
            scrollRelX = (body.scrollLeft + body.clientWidth / 2) / body.scrollWidth;
            scrollRelY = (body.scrollTop + body.clientHeight / 2) / body.scrollHeight;
        }

        const container = document.getElementById('reader-pages-container');
        container.innerHTML = '';

        let targetPages = this.state.layout;
        let startPage = this.state.pageNum;

        // Ajustar el grid dependiendo de la cantidad de páginas
        if (targetPages === 1) {
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = this.state.scale > 1.05 ? 'flex-start' : 'center';
        } else if (targetPages === 2) {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '1fr 1fr';
            container.style.gap = '20px';
            container.style.alignItems = 'start';
            container.style.justifyContent = this.state.scale > 1.05 ? 'start' : 'center';
        } else if (targetPages === 3 || targetPages === 4) {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '1fr 1fr';
            container.style.gap = '20px';
            container.style.alignItems = 'start';
            container.style.justifyContent = this.state.scale > 1.05 ? 'start' : 'center';
        } else {
            container.style.display = 'flex';
        }


        const total = this.state.pdfDoc.numPages;

        let promises = [];
        // Ensure we don't exceed total pages
        for (let i = 0; i <targetPages; i++) {
            let p = startPage + i;
            if (p <= total) {
                promises.push(this.renderPageNode(p, container));
            }
        }
        
        await Promise.all(promises);

        const loadingEl = document.getElementById('reader-loading');
        if (loadingEl) loadingEl.style.display = 'none';

        if (preserveScroll && body && body.scrollWidth > 0 && body.scrollHeight > 0) {
            body.scrollLeft = scrollRelX * body.scrollWidth - body.clientWidth / 2;
            body.scrollTop = scrollRelY * body.scrollHeight - body.clientHeight / 2;
        }

        let endPage = Math.min(startPage + targetPages - 1, total);

        // Guardar página actual en localStorage por curso
        if (this.state.libroActual) {
            const activeCourse = typeof Store !== 'undefined' ? Store.getActiveCourse() : null;
            const courseId = activeCourse ? activeCourse.id : 'global';
            localStorage.setItem('gdhn_pdf_page_' + this.state.libroActual.id + '_course_' + courseId, startPage);
            // También guardar en el general por retrocompatibilidad
            localStorage.setItem('gdhn_pdf_page_' + this.state.libroActual.id, startPage);
        }

        // UI Updates
        const pageInput = document.getElementById('reader-page-input');
        if (pageInput) pageInput.value = startPage;

        const pct = Math.round((startPage / total) * 100);
        const percentEl = document.getElementById('reader-percent');
        if (percentEl) percentEl.textContent = pct + '%';

        const barEl = document.getElementById('reader-progress-bar');
        if (barEl) barEl.style.width = pct + '%';
        
        this.renderThumbnailsStrip();
        this.updateThumbnailsActive();
        this.initGestureManager();
    },

    renderPageNode: function (num, container) {
        const wrapper = document.createElement('div');
        wrapper.className = 'reader-canvas-wrapper';
        wrapper.id = 'page-wrapper-' + num; // para captura

        const pdfCanvas = document.createElement('canvas'); // lienzo original del libro
        pdfCanvas.className = 'reader-canvas';

        const drawCanvas = document.createElement('canvas'); // lienzo transparente para dibujo
        drawCanvas.className = 'drawing-layer';
        drawCanvas.id = 'draw-layer-' + num;
        drawCanvas.style.pointerEvents = this.state.drawMode === 'none' ? 'none' : 'auto';

        const tempCanvas = document.createElement('canvas'); // lienzo temporal para formas (rect, circle)
        tempCanvas.className = 'temp-layer';
        tempCanvas.id = 'temp-layer-' + num;
        tempCanvas.style.position = 'absolute';
        tempCanvas.style.top = '0';
        tempCanvas.style.left = '0';
        tempCanvas.style.pointerEvents = 'none'; // Eventos siempre al drawCanvas o htmlLayer

        const htmlLayer = document.createElement('div'); // lienzo invisible para objetos arrastrables
        htmlLayer.className = 'html-layer';
        htmlLayer.id = 'html-layer-' + num;

        wrapper.appendChild(pdfCanvas);
        wrapper.appendChild(drawCanvas);
        wrapper.appendChild(tempCanvas);
        wrapper.appendChild(htmlLayer);
        container.appendChild(wrapper);

        return this.state.pdfDoc.getPage(num).then((page) => {
            // Mejorar nitidez del texto para evitar PDFs borrosos
            const pixelRatio = window.devicePixelRatio || 1;
            const outputScale = Math.max(2.0, pixelRatio * 1.5); // Aumentamos la resolución al menos al doble
            
            const baseViewport = page.getViewport({ scale: this.state.scale });
            const renderViewport = page.getViewport({ scale: this.state.scale * outputScale });
            
            // Resolución interna alta para el PDF
            pdfCanvas.width = renderViewport.width;
            pdfCanvas.height = renderViewport.height;
            
            // Tamaño visual en pantalla normalizado usando las medidas base
            pdfCanvas.style.width = `${Math.floor(baseViewport.width)}px`;
            pdfCanvas.style.height = `${Math.floor(baseViewport.height)}px`;

            // Las capas superiores mantienen su tamaño lógico para la pizarra digital
            drawCanvas.width = Math.floor(baseViewport.width);
            drawCanvas.height = Math.floor(baseViewport.height);
            drawCanvas.style.width = `${Math.floor(baseViewport.width)}px`;
            drawCanvas.style.height = `${Math.floor(baseViewport.height)}px`;
            
            tempCanvas.width = Math.floor(baseViewport.width);
            tempCanvas.height = Math.floor(baseViewport.height);
            tempCanvas.style.width = `${Math.floor(baseViewport.width)}px`;
            tempCanvas.style.height = `${Math.floor(baseViewport.height)}px`;
            
            htmlLayer.style.width = `${Math.floor(baseViewport.width)}px`;
            htmlLayer.style.height = `${Math.floor(baseViewport.height)}px`;

            const renderContext = {
                canvasContext: pdfCanvas.getContext('2d'),
                viewport: renderViewport
            };
            
            const renderTask = page.render(renderContext);

            renderTask.promise.then(() => {
                // Initialize text layer for AI selection
                if (window.pdfjsLib && window.pdfjsLib.renderTextLayer) {
                    const textLayerDiv = document.createElement('div');
                    textLayerDiv.className = 'textLayer';
                    // Match dimensions of base viewport
                    textLayerDiv.style.width = Math.floor(baseViewport.width) + 'px';
                    textLayerDiv.style.height = Math.floor(baseViewport.height) + 'px';
                    textLayerDiv.style.setProperty('--scale-factor', baseViewport.scale);
                    
                    wrapper.insertBefore(textLayerDiv, drawCanvas);
                    
                    page.getTextContent().then((textContent) => {
                        console.log("PDF textContent loaded, items:", textContent.items.length);
                        try {
                            // En algunas versiones de PDF.js se usa textContent, en otras textContentSource
                            const task = window.pdfjsLib.renderTextLayer({
                                textContentSource: textContent,
                                textContent: textContent, 
                                container: textLayerDiv,
                                viewport: baseViewport,
                                textDivs: []
                            });
                            console.log("renderTextLayer task initiated", task);
                        } catch (err) {
                            console.error("renderTextLayer failed:", err);
                            // Fallback manual básico
                            textContent.items.forEach(item => {
                                const span = document.createElement('span');
                                span.textContent = item.str + ' ';
                                // Posición rudimentaria si el transform falla
                                span.style.left = (item.transform[4] * baseViewport.scale) + 'px';
                                span.style.top = ((baseViewport.height - item.transform[5]) * baseViewport.scale - 12) + 'px';
                                span.style.fontSize = (12 * baseViewport.scale) + 'px';
                                textLayerDiv.appendChild(span);
                            });
                        }
                    });
                } else {
                    console.error("pdfjsLib.renderTextLayer not found");
                }
            });

            // Inicia la capacidad de dibujo sobre esta página específica
            this.initWhiteboard(drawCanvas, tempCanvas, htmlLayer, num);
        });
    },

    // ==========================================
    // MODULE: PIZARRA DIGITAL (WHITEBOARD)
    // ==========================================

    setDrawMode: function (mode) {
        if (this.state.drawMode === mode && mode !== 'none') {
            mode = 'none';
        }

        this.state.drawMode = mode;
        const pts = ['none', 'pen', 'highlighter', 'eraser', 'text', 'note', 'laser', 'rect', 'circle', 'arrow', 'crop'];
        pts.forEach(p => {
            const btn = document.getElementById('wb-' + p);
            if (btn) {
                if (p === mode) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });
        
        const btnLaser = document.getElementById('wb-laser');
        if (btnLaser) {
            if (mode === 'laser') btnLaser.classList.add('active');
            else btnLaser.classList.remove('active');
        }

        const layers = document.querySelectorAll('.drawing-layer');
        layers.forEach(l => {
            l.style.pointerEvents = mode === 'none' ? 'none' : 'auto';
            if (['text', 'note', 'rect', 'circle', 'arrow', 'highlighter', 'crop'].includes(mode)) {
                l.style.cursor = 'crosshair';
            } else if (mode === 'pen') {
                l.style.cursor = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTEgNGg2YTIgMiAwIDAgMSAyIDJ2MTRhMiAyIDAgMCAxLTIgMmgtNmEyIDIgMCAwIDEtMi0yVjZhMiAyIDAgMCAxIDItMnoiLz48cGF0aCBkPSJtMTUgMi0xLjUgMiIvPjwvc3ZnPg==) 2 20, auto';
            } else if (mode === 'eraser') {
                l.style.cursor = 'cell';
            } else if (mode === 'laser') {
                l.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><circle cx="24" cy="24" r="16" fill="rgba(239, 68, 68, 0.4)"/><circle cx="24" cy="24" r="6" fill="%23ef4444"/></svg>\') 24 24, auto';
            } else {
                l.style.cursor = 'auto'; // none mode
            }
        });

        const readerBody = document.getElementById('reader-body');
        if (readerBody) {
            readerBody.style.cursor = mode === 'none' ? 'grab' : 'auto';
        }
    },

    setDrawColor: function (color, element) {
        this.state.drawColor = color;
        const allColors = document.querySelectorAll('.wb-color');
        allColors.forEach(c => c.classList.remove('active'));
        if (element) element.classList.add('active');
    },

    savePageNotes: async function(canvas, htmlLayer, pageNum) {
        if (!this.state.libroActual) return;
        const data = {
            image: canvas.toDataURL(),
            html: htmlLayer.innerHTML
        };
        await this.db.saveNotes(this.state.libroActual.id, pageNum, data);
    },

    loadPageNotes: async function(canvas, htmlLayer, pageNum) {
        if (!this.state.libroActual) return;
        const data = await this.db.getNotes(this.state.libroActual.id, pageNum);
        if (data) {
            htmlLayer.innerHTML = data.html || '';
            if (data.image) {
                const img = new Image();
                img.onload = () => {
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                };
                img.src = data.image;
            }
            
            // Re-bind events to HTML items
            const highlights = htmlLayer.querySelectorAll('.wb-hl-box');
            highlights.forEach(hl => this.makeHighlightResizable(hl));
            const texts = htmlLayer.querySelectorAll('.wb-text-container');
            texts.forEach(txt => this.makeDraggable(txt, txt.querySelector('.wb-text-drag-handle')));
            const notes = htmlLayer.querySelectorAll('.wb-note');
            notes.forEach(note => this.makeDraggable(note, note.querySelector('.wb-note-header')));
        }
    },

    initWhiteboard: function (canvas, tempCanvas, htmlLayer, pageNum) {
        const ctx = canvas.getContext('2d');
        const tempCtx = tempCanvas ? tempCanvas.getContext('2d') : null;
        let isDrawingLocal = false;
        let lastX = 0, lastY = 0;
        let startX = 0, startY = 0; // For shapes

        // Cargar notas al iniciar
        this.loadPageNotes(canvas, htmlLayer, pageNum);

        let hlBox = null;
        let hlStartX = 0;
        let hlStartY = 0;

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            // Acomodar zooms
            return {
                x: (e.clientX - rect.left) * (canvas.width / rect.width),
                y: (e.clientY - rect.top) * (canvas.height / rect.height)
            };
        };

        const startDraw = (e) => {
            const pos = getPos(e);

            // Si el modo es insertar algo, no dibujamos
            if (this.state.drawMode === 'text') {
                this.insertTextBox(htmlLayer, pos.x, pos.y);
                this.setDrawMode('none');
                return;
            }
            if (this.state.drawMode === 'note') {
                this.insertNote(htmlLayer, pos.x, pos.y);
                this.setDrawMode('none');
                return;
            }
            // MODO SUBRAYADOR (Área HMTL arrastrable)
            if (this.state.drawMode === 'highlighter') {
                isDrawingLocal = true;
                this.state.isDrawing = true;
                hlStartX = pos.x;
                hlStartY = pos.y;

                hlBox = document.createElement('div');
                hlBox.className = 'wb-hl-box wb-hl-creating';
                hlBox.style.backgroundColor = this.state.drawColor;
                hlBox.style.color = this.state.drawColor; // Para heredar al LED pseudo-element
                hlBox.style.left = pos.x + 'px';
                hlBox.style.top = pos.y + 'px';
                hlBox.style.width = '0px';
                hlBox.style.height = '0px';
                htmlLayer.appendChild(hlBox);
                return;
            }
            
            // MODO RECORTE (CROP)
            if (this.state.drawMode === 'crop') {
                isDrawingLocal = true;
                this.state.isDrawing = true;
                hlStartX = pos.x;
                hlStartY = pos.y;

                hlBox = document.createElement('div');
                hlBox.className = 'wb-crop-box';
                hlBox.style.cssText = `position:absolute; left:${pos.x}px; top:${pos.y}px; width:0; height:0; border:2px dashed #ec4899; background:rgba(236, 72, 153, 0.1); z-index:99; pointer-events:none;`;
                htmlLayer.appendChild(hlBox);
                return;
            }

            if (this.state.drawMode === 'none' || this.state.drawMode === 'laser') return; // prevencion

            // MODO DE FORMAS Y LÁPIZ LIBRE
            isDrawingLocal = true;
            this.state.isDrawing = true;
            lastX = pos.x; lastY = pos.y;
            startX = pos.x; startY = pos.y;
            
            if (this.state.drawMode === 'pen' || this.state.drawMode === 'eraser') {
                draw(e);
            }
        };

        const draw = (e) => {
            if (!isDrawingLocal) return;
            const pos = getPos(e);

            // Si arrastramos en modo resaltador o recorte
            if ((this.state.drawMode === 'highlighter' || this.state.drawMode === 'crop') && hlBox) {
                const w = Math.abs(pos.x - hlStartX);
                const h = Math.abs(pos.y - hlStartY);
                hlBox.style.width = w + 'px';
                hlBox.style.height = h + 'px';
                hlBox.style.left = Math.min(pos.x, hlStartX) + 'px';
                hlBox.style.top = Math.min(pos.y, hlStartY) + 'px';
                return;
            }

            // Shapes on temp layer
            if (['rect', 'circle', 'arrow'].includes(this.state.drawMode) && tempCtx) {
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.beginPath();
                tempCtx.strokeStyle = this.state.drawColor;
                tempCtx.lineWidth = this.state.drawSize;
                tempCtx.lineCap = 'round';
                tempCtx.lineJoin = 'round';

                if (this.state.drawMode === 'rect') {
                    tempCtx.rect(startX, startY, pos.x - startX, pos.y - startY);
                } else if (this.state.drawMode === 'circle') {
                    const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
                    tempCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
                } else if (this.state.drawMode === 'arrow') {
                    const headlen = 15;
                    const dx = pos.x - startX;
                    const dy = pos.y - startY;
                    const angle = Math.atan2(dy, dx);
                    tempCtx.moveTo(startX, startY);
                    tempCtx.lineTo(pos.x, pos.y);
                    tempCtx.lineTo(pos.x - headlen * Math.cos(angle - Math.PI / 6), pos.y - headlen * Math.sin(angle - Math.PI / 6));
                    tempCtx.moveTo(pos.x, pos.y);
                    tempCtx.lineTo(pos.x - headlen * Math.cos(angle + Math.PI / 6), pos.y - headlen * Math.sin(angle + Math.PI / 6));
                }
                tempCtx.stroke();
                return;
            }

            // Normal Pen/Eraser
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);

            if (this.state.drawMode === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = 30; // borrador grueso
            } else { // pen
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = this.state.drawColor;
                ctx.lineWidth = this.state.drawSize;
            }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            lastX = pos.x; lastY = pos.y;
        };

        const endDraw = () => {
            if (this.state.drawMode === 'highlighter' && hlBox) {
                // Si dió clic pero no arrastró, desaparecemos la caja fantasma vacía
                if (parseInt(hlBox.style.width) <5 && parseInt(hlBox.style.height) <5) {
                    hlBox.remove();
                } else {
                    hlBox.classList.remove('wb-hl-creating');
                    hlBox.innerHTML = `
                        <div class="wb-hl-resizer n"></div>
                        <div class="wb-hl-resizer s"></div>
                        <div class="wb-hl-resizer e"></div>
                        <div class="wb-hl-resizer w"></div>
                        <div class="wb-hl-drag-handle" title="Mover resaltado">≡</div>
                        <span class="wb-hl-delete" onclick="this.parentElement.remove()" title="Eliminar">❌</span>
                    `;
                    this.makeHighlightResizable(hlBox);
                }
                hlBox = null;
            }
            
            // Finalizar RECORTE (CROP)
            if (this.state.drawMode === 'crop' && hlBox) {
                const finalX = parseInt(hlBox.style.left);
                const finalY = parseInt(hlBox.style.top);
                const finalW = parseInt(hlBox.style.width);
                const finalH = parseInt(hlBox.style.height);
                
                hlBox.remove();
                hlBox = null;
                this.setDrawMode('none');
                
                // Si el recorte es significativo, disparar captura
                if (finalW > 10 && finalH > 10) {
                    const wrapper = htmlLayer.parentElement;
                    this.executeCropCapture(wrapper, finalX, finalY, finalW, finalH);
                }
            }

            if (['rect', 'circle', 'arrow'].includes(this.state.drawMode) && tempCanvas) {
                // Transfer from temp to main
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(tempCanvas, 0, 0);
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            }

            if (isDrawingLocal) {
                isDrawingLocal = false;
                this.state.isDrawing = false;
                this.wbSaveSnapshot(canvas, htmlLayer, pageNum); // Guardar en pila undo
                this.savePageNotes(canvas, htmlLayer, pageNum);  // Auto-guardar en DB
            }
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', endDraw); // global para evitar cortes rápidos

        // Touch support para pizarras interactivas grandes
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e.touches[0]); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); }, { passive: false });
        window.addEventListener('touchend', endDraw);
    },

    insertTextBox: function (htmlLayer, x, y) {
        const container = document.createElement('div');
        container.className = 'wb-text-container';
        container.style.left = x + 'px';
        container.style.top = y + 'px';
        container.style.color = this.state.drawColor;

        container.innerHTML = `
            <div class="wb-text-drag-handle" title="Arrastrar todo el bloque">✥ Mover</div>
            <span class="wb-text-delete" onclick="this.parentElement.remove()" title="Eliminar Cuadro">❌</span>
            <textarea class="wb-text-box" style="color: inherit;" placeholder="Escribe aquí..."></textarea>
        `;

        // El handle drag evita q interfiera con la seleccion del texto arrastrando
        this.makeDraggable(container, container.querySelector('.wb-text-drag-handle'));
        htmlLayer.appendChild(container);
        
        // Guardar snapshot para undo
        const drawCanvas = htmlLayer.parentElement ? htmlLayer.parentElement.querySelector('.drawing-layer') : null;
        if (drawCanvas) this.wbSaveSnapshot(drawCanvas, htmlLayer, pageNum || htmlLayer.id.replace('html-layer-', ''));

        const ta = container.querySelector('textarea');

        // Retrasar focus() unos ms permite que el evento mousedown del canvas termine
        // y no asigne un 'blur' inmediato que ocasione la eliminación automática del cuadro
        setTimeout(() => ta.focus(), 50);

        // Auto-eliminar si lo dejan vacio sin escribir
        ta.addEventListener('blur', () => {
            // Pequeño timeout para permitir interacciones con la misma caja sin que se auto destruya
            setTimeout(() => {
                if (!ta.value.trim()) container.remove();
            }, 150);
        });
    },

    insertNote: function (htmlLayer, x, y, initialText = '') {
        const note = document.createElement('div');
        note.className = 'wb-note';

        // Efecto de avanzar (Z-Index / Carrusel superpuesto)
        // Guardamos el zIndex máximo actual sumando +1 para auto-ponerse encima al interactuar
        const bringToFront = () => {
            const allNotes = htmlLayer.querySelectorAll('.wb-note');
            let maxZ = 50;
            allNotes.forEach(n => {
                if (n !== note) {
                    const z = parseInt(window.getComputedStyle(n).zIndex) || 50;
                    if (z > maxZ) maxZ = z;
                }
            });
            note.style.zIndex = maxZ + 1;
        };

        note.style.left = x + 'px';
        note.style.top = y + 'px';

        note.innerHTML = `
            <div class="wb-note-header" title="Mover la nota">
                <button class="wb-note-btn wb-note-clone" title="Clonar esta nota">📋</button>
                <button class="wb-note-btn wb-note-delete" title="Eliminar nota">❌</button>
            </div>
            <textarea class="wb-note-content" placeholder="Escribe tu nota..."></textarea>
        `;

        const ta = note.querySelector('textarea');
        ta.value = initialText;

        // Clone event
        note.querySelector('.wb-note-clone').addEventListener('click', () => {
            this.insertNote(htmlLayer, note.offsetLeft + 20, note.offsetTop + 20, ta.value);
        });

        // Delete event
        note.querySelector('.wb-note-delete').addEventListener('click', () => {
            note.remove();
        });

        // Bring to front on mousedown (cualquier parte de la nota la pone encima como un carrusel que gira)
        note.addEventListener('mousedown', bringToFront);
        note.addEventListener('touchstart', bringToFront, { passive: true });

        // Arrastrar solo desde el encabezado (para no interrumpir el flujo del textarea y el resize nativo)
        this.makeDraggable(note, note.querySelector('.wb-note-header'));
        htmlLayer.appendChild(note);
        
        // Guardar snapshot para undo
        const drawCanvas = htmlLayer.parentElement ? htmlLayer.parentElement.querySelector('.drawing-layer') : null;
        if (drawCanvas) this.wbSaveSnapshot(drawCanvas, htmlLayer, htmlLayer.id.replace('html-layer-', ''));

        // Si recién se creó
        bringToFront();
        if (!initialText) {
            ta.focus();
        }
    },

    insertImage: function (event) {
        if (!event.target.files || !event.target.files[0]) return;
        const file = event.target.files[0];

        // Seleccionamos la pagina visible actual para inyectarlo (la principal en viewport)
        const activeWrapper = document.querySelector('.reader-canvas-wrapper');
        const htmlLayer = activeWrapper.querySelector('.html-layer');
        if (!htmlLayer) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.createElement('div');
            container.className = 'wb-image-container';
            container.style.left = '50px';
            container.style.top = '50px';

            container.style.width = '200px';
            container.style.height = 'auto'; // Will be constrained by resize

            container.innerHTML = `
                <div class="wb-img-drag-handle" style="background: rgba(236,72,153,0.9);">✥ Mover</div>
                <span class="wb-image-delete" onclick="this.parentElement.remove()" title="Eliminar Imagen">❌</span>
                <img src="${e.target.result}" style="object-fit: contain; width: 100%; height: 100%;"/>
            `;
            // Drag handle is the dark bar
            this.makeDraggable(container, container.querySelector('.wb-img-drag-handle'));
            htmlLayer.appendChild(container);
        };
        reader.readAsDataURL(file);

        // Reset the input specifically
        event.target.value = '';
        this.setDrawMode('none');
    },

    // ==========================================
    // MODULE: UNDO / REDO
    // ==========================================

    wbSaveSnapshot: function(canvas, htmlLayer, pageNum) {
        if (!canvas) return;
        const key = String(pageNum);
        if (!this.state.undoStack[key]) this.state.undoStack[key] = [];
        // Limitar a 20 estados
        if (this.state.undoStack[key].length >= 20) this.state.undoStack[key].shift();
        this.state.undoStack[key].push({
            canvasData: canvas.toDataURL(),
            htmlData: htmlLayer ? htmlLayer.innerHTML : ''
        });
        // Al guardar nuevo estado, se limpia el redo
        this.state.redoStack[key] = [];
    },

    wbUndo: function() {
        const page = document.querySelector('.reader-canvas-wrapper');
        if (!page) return;
        const canvas = page.querySelector('.drawing-layer');
        const htmlLayer = page.querySelector('.html-layer');
        const pageNum = String(htmlLayer.id.replace('html-layer-', ''));
        const key = pageNum;

        const stack = this.state.undoStack[key] || [];
        if (stack.length === 0) { UI.toast('No hay acciones que deshacer', 'info'); return; }

        // Guardar estado actual en redo antes de deshacer
        if (!this.state.redoStack[key]) this.state.redoStack[key] = [];
        this.state.redoStack[key].push({
            canvasData: canvas.toDataURL(),
            htmlData: htmlLayer.innerHTML
        });

        const prev = stack.pop();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); };
        img.src = prev.canvasData;
        htmlLayer.innerHTML = prev.htmlData;

        // Re-enlazar eventos a elementos restaurados
        htmlLayer.querySelectorAll('.wb-hl-box').forEach(el => this.makeHighlightResizable(el));
        htmlLayer.querySelectorAll('.wb-text-container').forEach(el => this.makeDraggable(el, el.querySelector('.wb-text-drag-handle')));
        htmlLayer.querySelectorAll('.wb-note').forEach(el => this.makeDraggable(el, el.querySelector('.wb-note-header')));
        htmlLayer.querySelectorAll('.wb-image-container').forEach(el => this.makeDraggable(el, el.querySelector('.wb-img-drag-handle')));

        UI.toast('Acción deshecha', 'info');
        this.savePageNotes(canvas, htmlLayer, pageNum);
    },

    wbRedo: function() {
        const page = document.querySelector('.reader-canvas-wrapper');
        if (!page) return;
        const canvas = page.querySelector('.drawing-layer');
        const htmlLayer = page.querySelector('.html-layer');
        const pageNum = String(htmlLayer.id.replace('html-layer-', ''));
        const key = pageNum;

        const stack = this.state.redoStack[key] || [];
        if (stack.length === 0) { UI.toast('No hay acciones que rehacer', 'info'); return; }

        // Guardar estado actual en undo antes de rehacer
        if (!this.state.undoStack[key]) this.state.undoStack[key] = [];
        this.state.undoStack[key].push({
            canvasData: canvas.toDataURL(),
            htmlData: htmlLayer.innerHTML
        });

        const next = stack.pop();
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); };
        img.src = next.canvasData;
        htmlLayer.innerHTML = next.htmlData;

        // Re-enlazar eventos a elementos restaurados
        htmlLayer.querySelectorAll('.wb-hl-box').forEach(el => this.makeHighlightResizable(el));
        htmlLayer.querySelectorAll('.wb-text-container').forEach(el => this.makeDraggable(el, el.querySelector('.wb-text-drag-handle')));
        htmlLayer.querySelectorAll('.wb-note').forEach(el => this.makeDraggable(el, el.querySelector('.wb-note-header')));
        htmlLayer.querySelectorAll('.wb-image-container').forEach(el => this.makeDraggable(el, el.querySelector('.wb-img-drag-handle')));

        UI.toast('Acción rehecha', 'success');
        this.savePageNotes(canvas, htmlLayer, pageNum);
    },

    wbClearAll: function () {
        if (!confirm('¿Seguro que deseas borrar TODAS las anotaciones, imágenes y notas de esta página?')) return;

        // Borrar todos los canvs de dibujo visuales
        const layers = document.querySelectorAll('.drawing-layer');
        layers.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // Borrar todos los elementos HTML inyectados
        const htmls = document.querySelectorAll('.html-layer');
        htmls.forEach(h => h.innerHTML = '');

        UI.toast('Pizarra limpiada.', 'success');
    },

    wbCapture: function () {
        // Esta función fusiona el canvas original del PDF + el canvas de Dibujo en una imagen única para descargar.
        const wrapper = document.querySelector('.reader-canvas-wrapper');
        if (!wrapper) return;

        UI.toast('Generando captura de pantalla... por favor espera', 'info');

        setTimeout(() => {
            try {
                const pdfCanvas = wrapper.querySelector('.reader-canvas');
                const drawCanvas = wrapper.querySelector('.drawing-layer');
                const htmlLayer = wrapper.querySelector('.html-layer');

                // Creamos un canvas offscreen temporal grande para fusionar todo
                const offC = document.createElement('canvas');
                offC.width = pdfCanvas.width;
                offC.height = pdfCanvas.height;
                const ctx = offC.getContext('2d');

                // 1. Dibujar el fondo PDF
                ctx.drawImage(pdfCanvas, 0, 0);

                // 2. Dibujar apuntes a lápiz/marcador
                ctx.drawImage(drawCanvas, 0, 0);

                // 3. Notas, Txt, Imagenes HTML - Requiere un esfuerzo masivo inyectarlas en JS puro.
                // Como alternativa práctica rápida, avisamos que las HTML se capturan visualmente como fotos si usamos APIs, pero para descargar en canvas enviaremos el mix basico.
                // Para una herramienta nativa sin dom-to-image, bajaremos la fusion
                const dataUrl = offC.toDataURL('image/png', 1.0);

                // Forzar descarga
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `Apunte-${this.state.libroActual.name}-Pag${this.state.pageNum}.png`;
                a.click();
                UI.toast('Captura descargada con éxito', 'success');

            } catch (e) {
                console.error("No se pudo capturar", e);
                UI.toast('Error al capturar. Quizás las imágenes son externas.', 'warning');
            }
        }, 100);
    },

    executeCropCapture: function(wrapper, x, y, w, h) {
        try {
            const pdfCanvas = wrapper.querySelector('.reader-canvas');
            const drawCanvas = wrapper.querySelector('.drawing-layer');
            const htmlLayer = wrapper.querySelector('.html-layer');

            if (!pdfCanvas) {
                UI.toast('No se encontró el lienzo de la página', 'error');
                return;
            }

            // Relación entre coordenadas de la capa HTML y resolución nativa del PDF Canvas
            const scaleX = pdfCanvas.width / (htmlLayer.clientWidth || pdfCanvas.clientWidth || 1);
            const scaleY = pdfCanvas.height / (htmlLayer.clientHeight || pdfCanvas.clientHeight || 1);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = Math.max(1, Math.round(w * scaleX));
            cropCanvas.height = Math.max(1, Math.round(h * scaleY));
            const ctx = cropCanvas.getContext('2d');

            // 1. Recortar fondo del libro PDF
            ctx.drawImage(
                pdfCanvas,
                x * scaleX, y * scaleY, w * scaleX, h * scaleY,
                0, 0, cropCanvas.width, cropCanvas.height
            );

            // 2. Si hay dibujos o apuntes encima, incluirlos en el recorte
            if (drawCanvas) {
                ctx.drawImage(
                    drawCanvas,
                    x * scaleX, y * scaleY, w * scaleX, h * scaleY,
                    0, 0, cropCanvas.width, cropCanvas.height
                );
            }

            // Generar Base64 HD instantáneo (0 ms)
            const dataUrl = cropCanvas.toDataURL('image/png', 1.0);
            this.state.lastCropDataUrl = dataUrl;

            // Abrir automáticamente el Inspector Lightbox HD del Ejercicio / Imagen
            this.openHDExerciseLightbox(dataUrl, w, h, this.state.pageNum);

            UI.toast('¡Ejercicio/Imagen enfocado en HD con éxito!', 'success');
        } catch(e) {
            console.error("Error al recortar ejercicio:", e);
            UI.toast('Error al procesar el recorte HD', 'error');
        }
    },

    openHDExerciseLightbox: function(dataUrl, w, h, pageNum) {
        let modal = document.getElementById('hd-exercise-lightbox');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'hd-exercise-lightbox';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(9, 13, 22, 0.94);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            z-index: 1000000; display: flex; flex-direction: column; color: #fff;
            animation: fadeIn 0.22s ease-out;
        `;
        
        let currentScale = 1.0;

        modal.innerHTML = `
            <style>
                .hd-lightbox-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 14px 24px; background: rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-shrink: 0;
                }
                .hd-lightbox-body {
                    flex: 1; overflow: auto; display: flex; align-items: center;
                    justify-content: center; padding: 30px; position: relative;
                    touch-action: pan-x pan-y;
                }
                .hd-lightbox-img {
                    max-width: 90vw; max-height: 72vh; border-radius: 14px;
                    box-shadow: 0 24px 60px rgba(0,0,0,0.85); border: 2px solid rgba(255,255,255,0.2);
                    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    object-fit: contain; background: #ffffff;
                }
                .hd-lightbox-toolbar {
                    display: flex; align-items: center; justify-content: center; gap: 12px;
                    padding: 14px 20px; background: rgba(15, 23, 42, 0.95);
                    border-top: 1px solid rgba(255, 255, 255, 0.12); flex-wrap: wrap;
                    flex-shrink: 0;
                }
                .hd-btn {
                    height: 42px; padding: 0 18px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.2);
                    background: rgba(255, 255, 255, 0.12); color: #ffffff; font-size: 13px; font-weight: 800;
                    cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .hd-btn:hover {
                    background: rgba(255, 255, 255, 0.25); transform: translateY(-1px);
                    border-color: rgba(255, 255, 255, 0.4);
                }
                .hd-btn-primary {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border-color: #34d399; color: #ffffff; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
                }
                .hd-btn-studio {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    border-color: #818cf8; color: #ffffff; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
                }
                .hd-btn-ai {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    border-color: #fde047; color: #ffffff; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
                }
            </style>

            <div class="hd-lightbox-header">
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:rgba(236,72,153,0.2); color:#f472b6; border:1.5px solid rgba(236,72,153,0.4); display:grid; place-items:center; font-weight:900; font-size:18px;">
                        🔍
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:16px; font-weight:900; color:#fff;">Inspector HD de Ejercicio / Imagen</h3>
                        <p style="margin:2px 0 0 0; font-size:11px; color:rgba(255,255,255,0.65); font-weight:700;">Documento: ${this.state.libroActual ? this.state.libroActual.name : 'Libro'} &bull; Página ${pageNum}</p>
                    </div>
                </div>
                <button onclick="document.getElementById('hd-exercise-lightbox').remove()" style="background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.3); border-radius:12px; width:38px; height:38px; color:#fff; cursor:pointer; display:grid; place-items:center; font-size:16px; font-weight:900;" title="Cerrar Inspector">
                    ✕
                </button>
            </div>

            <div class="hd-lightbox-body">
                <img id="hd-lightbox-img-el" class="hd-lightbox-img" src="${dataUrl}" style="transform: scale(1);" />
            </div>

            <div class="hd-lightbox-toolbar">
                <div style="display:flex; align-items:center; gap:6px; background:rgba(0,0,0,0.45); border-radius:12px; padding:4px 10px; border:1px solid rgba(255,255,255,0.2);">
                    <button class="hd-btn" style="height:32px; padding:0 10px; border:none; font-size:14px;" onclick="Libreria._zoomLightboxImg(-0.25)">➖</button>
                    <span id="hd-lightbox-zoom-val" style="font-size:13px; font-weight:900; min-width:45px; text-align:center; color:#38bdf8;">100%</span>
                    <button class="hd-btn" style="height:32px; padding:0 10px; border:none; font-size:14px;" onclick="Libreria._zoomLightboxImg(0.25)">➕</button>
                    <button class="hd-btn" style="height:32px; padding:0 10px; border:none; font-size:11px;" onclick="Libreria._zoomLightboxImg(0, true)">Reset</button>
                </div>

                <button class="hd-btn hd-btn-studio" onclick="Libreria.sendCropToPizarraStudio('${dataUrl}')">
                    <i data-lucide="pen-tool" style="width:16px;"></i> 🎨 Resolver en Pizarra Studio
                </button>

                <button class="hd-btn hd-btn-ai" onclick="Libreria.sendCropToGeminiAI('${dataUrl}')">
                    <i data-lucide="sparkles" style="width:16px;"></i> ✨ Explicar / Resolver con IA
                </button>

                <button class="hd-btn hd-btn-primary" onclick="Libreria.downloadCropImage('${dataUrl}')">
                    <i data-lucide="download" style="width:16px;"></i> 💾 Descargar Imagen HD
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    },

    _zoomLightboxImg: function(delta, reset = false) {
        const img = document.getElementById('hd-lightbox-img-el');
        const valSpan = document.getElementById('hd-lightbox-zoom-val');
        if (!img) return;

        if (reset) {
            this._lightboxZoom = 1.0;
        } else {
            this._lightboxZoom = Math.min(4.0, Math.max(0.5, (this._lightboxZoom || 1.0) + delta));
        }

        img.style.transform = `scale(${this._lightboxZoom})`;
        if (valSpan) valSpan.textContent = Math.round(this._lightboxZoom * 100) + '%';
    },

    sendCropToPizarraStudio: function(dataUrl) {
        document.getElementById('hd-exercise-lightbox')?.remove();
        
        // Abrir Pizarra Auxiliar en el Split Panel al lado del libro
        const splitPanel = document.getElementById('split-panel');
        if (splitPanel && !splitPanel.classList.contains('active')) {
            this.toggleSplitPanel();
        }
        
        // Cambiar a la pestaña de Pizarra Auxiliar
        this.switchSplitTab('tab-whiteboard');

        // Pegar el recorte en el lienzo de la Pizarra Auxiliar
        setTimeout(() => {
            this.pasteToAuxWhiteboard(dataUrl);
            UI.toast('¡Ejercicio insertado en la Pizarra Auxiliar! Listo para resolver con los alumnos.', 'success');
        }, 150);
    },

    sendCropToGeminiAI: function(dataUrl) {
        document.getElementById('hd-exercise-lightbox')?.remove();
        
        // Abrir panel de IA
        this.toggleAIPanel();
        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.value = `Resuelve paso a paso este ejercicio o analiza esta imagen extraída de la página ${this.state.pageNum} del libro.`;
        }
        this.aiSendCustom();
    },

    downloadCropImage: function(dataUrl) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `Ejercicio_Recortado_Pag${this.state.pageNum}.png`;
        a.click();
        UI.toast('Imagen HD descargada ✓', 'success');
    },

    togglePresentationMode: function() {
        this.state.isPresentationMode = !this.state.isPresentationMode;
        const reader = document.getElementById('gdhn-reader');
        if (!reader) return;

        if (this.state.isPresentationMode) {
            reader.classList.add('presentation-mode-active');
            
            // Añadir barra flotante mínima de presentación
            let presBar = document.getElementById('reader-presentation-bar');
            if (!presBar) {
                presBar = document.createElement('div');
                presBar.id = 'reader-presentation-bar';
                presBar.style.cssText = `
                    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                    background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(16px);
                    border: 1.5px solid rgba(255,255,255,0.2); border-radius: 40px;
                    padding: 8px 20px; display: flex; align-items: center; gap: 16px;
                    z-index: 1000000; box-shadow: 0 16px 40px rgba(0,0,0,0.6);
                    color: #fff; font-size: 13px; font-weight: 800;
                `;
                reader.appendChild(presBar);
            }

            presBar.innerHTML = `
                <button onclick="Libreria.prevPage()" style="background:rgba(255,255,255,0.15); border:none; color:#fff; border-radius:50%; width:36px; height:36px; cursor:pointer; display:grid; place-items:center;">
                    <i data-lucide="chevron-left" style="width:20px;"></i>
                </button>
                <span>Página ${this.state.pageNum} de ${this.state.pdfDoc ? this.state.pdfDoc.numPages : '--'}</span>
                <button onclick="Libreria.nextPage()" style="background:rgba(255,255,255,0.15); border:none; color:#fff; border-radius:50%; width:36px; height:36px; cursor:pointer; display:grid; place-items:center;">
                    <i data-lucide="chevron-right" style="width:20px;"></i>
                </button>
                <div style="width:1px; height:24px; background:rgba(255,255,255,0.2);"></div>
                <button onclick="Libreria.togglePresentationMode()" style="background:#ef4444; border:none; color:#fff; border-radius:20px; padding:6px 14px; font-size:12px; font-weight:900; cursor:pointer; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="x" style="width:14px;"></i> Salir (ESC)
                </button>
            `;
            
            if (window.lucide) lucide.createIcons();
            UI.toast('🖥️ Modo Presentación Pantalla Completa Activado', 'info');
        } else {
            reader.classList.remove('presentation-mode-active');
            document.getElementById('reader-presentation-bar')?.remove();
            UI.toast('Modo Presentación Desactivado', 'info');
        }
    },

    quickBookmarkCurrentPage: function() {
        if (!this.state.libroActual) return;
        const pageNum = this.state.pageNum;
        const label = prompt(`Escribe un marcador o etiqueta para la Página ${pageNum}:`, `Clase de Hoy - Pág ${pageNum}`);
        if (!label) return;

        this.saveTeacherBookmarkCustom(pageNum, label);
        UI.toast(`Marcador "${label}" guardado en Pág ${pageNum} ★`, 'success');
    },

    makeDraggable: function (el, dragHandle = null, ignoreScale = false) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const handle = dragHandle || el;

        // touch-action: none evita que el navegador haga scroll en dispositivos táctiles
        handle.style.touchAction = 'none';
        el.style.touchAction = 'none';

        handle.addEventListener('mousedown', dragStart);
        handle.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            pos3 = clientX;
            pos4 = clientY;
            
            if (e.touches) {
                document.addEventListener('touchend', dragEnd);
                document.addEventListener('touchmove', dragMove, { passive: false });
            } else {
                document.addEventListener('mouseup', dragEnd);
                document.addEventListener('mousemove', dragMove);
            }
        }

        function dragMove(e) {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const scale = ignoreScale ? 1 : (window.Libreria?.state?.scale || 1);
            pos1 = (pos3 - clientX) / scale;
            pos2 = (pos4 - clientY) / scale;
            pos3 = clientX;
            pos4 = clientY;

            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
            
            if (e.cancelable) e.preventDefault();
        }

        function dragEnd(e) {
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('touchend', dragEnd);
            document.removeEventListener('touchmove', dragMove);
        }
    },

    makeHighlightResizable: function (el) {
        // Aprovecha la directiva drag existente para el "handle"
        const handle = el.querySelector('.wb-hl-drag-handle');
        if (handle) this.makeDraggable(el, handle);

        const resizers = el.querySelectorAll('.wb-hl-resizer');

        resizers.forEach(r => {
            const onMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();

                let startX = e.clientX || e.touches[0].clientX;
                let startY = e.clientY || e.touches[0].clientY;
                let startLeft = el.offsetLeft;
                let startTop = el.offsetTop;
                let startWidth = el.offsetWidth;
                let startHeight = el.offsetHeight;

                const scale = window.Libreria.state.scale;

                const onMouseMove = (ev) => {
                    const clientX = ev.clientX || (ev.touches ? ev.touches[0].clientX : startX);
                    const clientY = ev.clientY || (ev.touches ? ev.touches[0].clientY : startY);

                    const dx = (clientX - startX) / scale;
                    const dy = (clientY - startY) / scale;

                    if (r.classList.contains('e')) {
                        el.style.width = Math.max(10, startWidth + dx) + 'px';
                    } else if (r.classList.contains('w')) {
                        el.style.width = Math.max(10, startWidth - dx) + 'px';
                        el.style.left = (startLeft + dx) + 'px';
                    } else if (r.classList.contains('s')) {
                        el.style.height = Math.max(10, startHeight + dy) + 'px';
                    } else if (r.classList.contains('n')) {
                        el.style.height = Math.max(10, startHeight - dy) + 'px';
                        el.style.top = (startTop + dy) + 'px';
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.removeEventListener('touchmove', onMouseMove);
                    document.removeEventListener('touchend', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                document.addEventListener('touchmove', onMouseMove, { passive: false });
                document.addEventListener('touchend', onMouseUp, { passive: false });
            };

            r.addEventListener('mousedown', onMouseDown);
            r.addEventListener('touchstart', onMouseDown, { passive: false });
        });
    },

    // ==========================================

    toggleDictionary: function () {
        const dict = document.getElementById('wb-dictionary');
        if (dict.style.display === 'flex') {
            dict.style.display = 'none';
        } else {
            dict.style.display = 'flex';
            this.makeDraggable(dict, document.getElementById('wb-dict-header'));
            document.getElementById('wb-dict-term').focus();
        }
    },

    searchDictionary: async function () {
        const term = document.getElementById('wb-dict-term').value.trim();
        const resDiv = document.getElementById('wb-dict-result');
        if (!term) return;

        resDiv.innerHTML = '<div style="text-align:center; padding:20px;"><svg class="spin" style="width:24px;height:24px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg></div>';

        try {
            // Priority 1: Wikipedia Summary API
            const wikiRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`);
            if (wikiRes.ok) {
                const data = await wikiRes.json();
                if (data.type !== 'disambiguation' && data.extract) {
                    resDiv.innerHTML = `
                        <h4 style="margin: 0 0 4px 0; font-weight: 800; color: #1e293b; text-transform: capitalize;">${data.title}</h4>
                        <p style="font-size: 12px; color: #475569; line-height: 1.4; margin-bottom: 8px;">${data.extract}</p>
                        <a href="${data.content_urls.desktop.page}" target="_blank" style="color:#0284c7; font-size:11px; text-decoration:none; display:inline-block; margin-bottom:10px; font-weight:700;">Ver más en Wikipedia ↗</a>
                        
                        <div style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 8px;">
                            <button class="btn btn-secondary btn-sm" onclick="Libreria.generarDefinicionIA('${term.replace(/'/g, "\\'")}')" style="font-size: 11px; font-weight: 800; padding: 4px 8px; height: auto; display: flex; align-items: center; gap: 4px; border-color: #cbd5e1; cursor:pointer;">
                                <span>✨ Análisis Pedagógico con IA</span>
                            </button>
                        </div>
                    `;
                    return;
                }
            }

            // Fallback 1: Dictionary API (ES)
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/es/${encodeURIComponent(term)}`);
            if (dictRes.ok) {
                const data = await dictRes.json();
                const meaning = data[0].meanings[0].definitions[0].definition;
                resDiv.innerHTML = `
                    <h4 style="margin: 0 0 4px 0; font-weight: 800; color: #1e293b; text-transform: capitalize;">${data[0].word}</h4>
                    <p style="font-size: 12px; color: #475569; line-height: 1.4; margin-bottom: 8px;">${meaning}</p>
                    
                    <div style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 8px;">
                        <button class="btn btn-secondary btn-sm" onclick="Libreria.generarDefinicionIA('${term.replace(/'/g, "\\'")}')" style="font-size: 11px; font-weight: 800; padding: 4px 8px; height: auto; display: flex; align-items: center; gap: 4px; border-color: #cbd5e1; cursor:pointer;">
                            <span>✨ Análisis Pedagógico con IA</span>
                        </button>
                    </div>
                `;
                return;
            }

            // Fallback 2: Show error + option to generate with Wipin AI
            resDiv.innerHTML = `
                <p style="color:#ef4444; margin-top:10px; font-size:12px; font-weight:600;">No se encontró una definición exacta en la web.</p>
                <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border: 1px solid #7dd3fc; border-radius: 8px; padding: 12px; margin-top: 10px; text-align: center; box-shadow: 0 2px 8px rgba(14,165,233,0.1);">
                    <p style="font-size:11px; color:#0369a1; font-weight:800; margin-bottom:8px; margin-top:0;">✨ ¿Consultar a Wipin AI?</p>
                    <button class="btn btn-sm" onclick="Libreria.generarDefinicionIA('${term.replace(/'/g, "\\'")}')" style="background:#0284c7; color:#fff; border:none; font-weight:800; font-size:11px; padding:6px 12px; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; box-shadow: 0 2px 4px rgba(2,132,199,0.2);">
                        Generar con Wipin AI
                    </button>
                </div>
            `;

        } catch (e) {
            // Connection error fallback: allow offline AI generation
            resDiv.innerHTML = `
                <p style="color:#ef4444; margin-top:10px; font-size:12px; font-weight:600;">Error de conexión (Estás offline).</p>
                <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border: 1px solid #7dd3fc; border-radius: 8px; padding: 12px; margin-top: 10px; text-align: center;">
                    <p style="font-size:11px; color:#0369a1; font-weight:800; margin-bottom:8px; margin-top:0;">✨ ¿Usar Copiloto IA Local?</p>
                    <button class="btn btn-sm" onclick="Libreria.generarDefinicionIA('${term.replace(/'/g, "\\'")}')" style="background:#0284c7; color:#fff; border:none; font-weight:800; font-size:11px; padding:6px 12px; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                        Generar con Wipin AI
                    </button>
                </div>
            `;
        }
    },

    generarDefinicionIA: function(term) {
        const resDiv = document.getElementById('wb-dict-result');
        if (!resDiv) return;

        // Mostrar estado de carga IA premium
        resDiv.innerHTML = `
            <div style="text-align:center; padding:25px 10px;">
                <div class="spinner" style="display:inline-block; width:26px; height:26px; border:3px solid #6366f1; border-top-color:transparent; border-radius:50%; animation: spin 0.8s linear infinite; margin-bottom:12px; vertical-align: middle;"></div>
                <p style="font-size:12px; font-weight:800; color:#4f46e5; margin:0;">Wipin AI analizando término...</p>
                <span style="font-size:10px; color:#94a3b8; display:block; margin-top:4px;">Estructurando definición pedagógica</span>
            </div>
        `;

        setTimeout(() => {
            try {
                const def = this.getAIDefinition(term);
                
                resDiv.innerHTML = `
                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; position:relative; margin-top:8px;">
                        <div style="position:absolute; top:-10px; right:10px; background:#6366f1; color:#fff; font-size:9px; font-weight:800; padding:2px 8px; border-radius:6px; box-shadow:0 2px 4px rgba(99,102,241,0.3); display:flex; align-items:center; gap:4px;">
                            <span>✨ Wipin AI</span>
                        </div>
                        <h4 style="margin: 0 0 2px 0; font-size: 14px; color: #1e293b; font-weight: 800; text-transform: capitalize;">${def.titulo}</h4>
                        <span style="font-size: 9px; font-weight: 800; color: #6366f1; text-transform: uppercase; display: block; margin-bottom: 8px;">${def.categoria}</span>
                        
                        <div style="font-size: 12px; color: #334155; line-height: 1.4; margin-bottom: 10px; border-left: 2.5px solid #cbd5e1; padding-left: 8px;">
                            ${def.definicion}
                        </div>
                        
                        ${def.sinonimos ? `
                        <div style="margin-bottom: 10px; font-size: 11px; padding-left: 10px;">
                            <strong style="color: #475569;">Sinónimos:</strong> <span style="color: #64748b; font-weight:500;">${def.sinonimos}</span>
                        </div>
                        ` : ''}
                        
                        <div style="background: #eff6ff; border-radius: 8px; padding: 10px; margin-bottom: 10px; font-size: 11px; border: 1.5px solid #bfdbfe; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);">
                            <strong style="color: #1e40af; display:block; margin-bottom:4px; font-weight:800; font-size:10px; text-transform:uppercase; letter-spacing:0.3px;">💡 Sugerencia Pedagógica:</strong>
                            <span style="color: #1e3a8a; line-height:1.45; display:block; font-weight:600;">${def.uso}</span>
                        </div>
                        
                        <div style="font-size: 11px; color: #475569; padding-left:10px; border-top:1px solid #f1f5f9; padding-top:8px;">
                            <strong>Ejemplo:</strong> <span style="font-style:italic; color:#64748b;">"${def.ejemplo}"</span>
                        </div>
                    </div>
                `;
            } catch(e) {
                console.error(e);
                resDiv.innerHTML = '<p style="color:#ef4444; margin-top:10px; font-size:12px;">Error al procesar la definición con IA.</p>';
            }
        }, 1200);
    },

    getAIDefinition: function(term) {
        const cleaned = term.toLowerCase().trim().replace(/[^a-záéíóúüñ\s]/g, '');
        
        // Comprobar si existe en el diccionario precargado
        if (this.localAIDictionary[cleaned]) {
            return {
                titulo: term,
                ...this.localAIDictionary[cleaned]
            };
        }

        // Generación Dinámica basada en Suffix / Prefixes y Tipo de Palabra
        let categoria = "Concepto Académico";
        let definicion = "";
        let uso = "";
        let sinonimos = "";
        let ejemplo = "";

        if (cleaned.endsWith('cion') || cleaned.endsWith('ción') || cleaned.endsWith('sion') || cleaned.endsWith('sión')) {
            categoria = "Sustantivo Femenino (Acción y Efecto)";
            definicion = `Refiere al acto, proceso o resultado de realizar la acción relacionada con ${term}. Describe un fenómeno conceptual, metodológico o procedimental de importancia en la materia escolar.`;
            uso = "Analizar como un proceso de fases secuenciales. Proponga a los alumnos identificar causas y consecuencias de esta acción en su cuaderno.";
            sinonimos = "Acción, proceso, desarrollo, ejecución.";
            ejemplo = `La correcta ${term} del experimento arrojó los resultados esperados.`;
        } else if (cleaned.endsWith('ica') || cleaned.endsWith('ica') || cleaned.endsWith('ía') || cleaned.endsWith('ia')) {
            categoria = "Disciplina / Área Temática";
            definicion = `Área del saber, ciencia, especialidad o marco conceptual que estudia de manera formal las propiedades y relaciones en torno a ${term}.`;
            uso = "Utilizar como marco de contextualización. Es importante que los alumnos vinculen esta disciplina con su aplicación en la vida cotidiana.";
            sinonimos = "Ciencia, doctrina, especialidad, campo de estudio.";
            ejemplo = `Para comprender mejor este capítulo del libro, analizaremos los fundamentos de la ${term}.`;
        } else if (cleaned.endsWith('ismo')) {
            categoria = "Sustantivo Masculino (Doctrina o Movimiento)";
            definicion = `Corriente filosófica, literaria, histórica o sistema conceptual estructurado alrededor de los principios teóricos de la noción de ${term}.`;
            uso = "Fomentar el debate crítico y analítico en clase. Se sugiere contrastar esta doctrina con movimientos anteriores o contemporáneos.";
            sinonimos = "Doctrina, movimiento, corriente, escuela.";
            ejemplo = `El ${term} transformó el pensamiento artístico y social del siglo pasado.`;
        } else if (cleaned.endsWith('mente')) {
            categoria = "Adverbio de Modo";
            definicion = `Palabra invariable que describe la manera, el modo o la circunstancia en que se ejecuta una acción, vinculada directamente al adjetivo base.`;
            uso = "Analizar el papel del adverbio como modificador y el matiz de significado y expresividad que confiere a la oración.";
            sinonimos = "Modo, forma, manera circunstancial.";
            ejemplo = `Los ejercicios del tema fueron completados ${term} por el grupo.`;
        } else {
            // General Template
            categoria = "Concepto General / Vocabulario Pedagógico";
            definicion = `Término curricular y conceptual que designa a un objeto, propiedad, fenómeno, proceso o elemento específico relevante dentro de la lectura. Refiere a una noción clave que ayuda a estructurar el tema expuesto en el texto escolar.`;
            uso = "Se aconseja buscar la palabra en su contexto dentro del párrafo. Invite a los estudiantes a construir oraciones propias empleando el término.";
            sinonimos = "Concepto, vocablo, término técnico, palabra clave.";
            ejemplo = `El significado de la palabra "${term}" es sumamente relevante para el análisis de este tema.`;
        }

        return {
            titulo: term,
            categoria: categoria,
            definicion: definicion,
            uso: uso,
            sinonimos: sinonimos,
            ejemplo: ejemplo
        };
    },

    localAIDictionary: {
        'horquilla': {
            categoria: "Sustantivo Femenino (Estructura/Soporte)",
            definicion: "Elemento o pieza bifurcada en forma de 'Y'. En el ámbito mecánico, es un soporte móvil que conecta y da dirección (como en la horquilla de la bicicleta). En botánica o anatomía, describe la ramificación dual de ramas o huesos.",
            uso: "Excelente para modelar divisiones binarias o ramificaciones. Dibuje la forma de la palabra en la pizarra para estudiantes visuales.",
            sinonimos: "Bifurcación, horca, soporte, horqueta.",
            ejemplo: "La horquilla delantera de la bicicleta absorbe los impactos en terrenos irregulares."
        },
        'sinapsis': {
            categoria: "Sustantivo Femenino (Biología Neuronal)",
            definicion: "Región de comunicación e intercambio de impulsos nerviosos entre dos neuronas, o entre una neurona y una célula efectora. Se produce mediante sustancias químicas llamadas neurotransmisores o a través de enlaces eléctricos.",
            uso: "Concepto de alto valor en Ciencias Naturales. Úselo para explicar cómo el cerebro procesa información y crea memorias durante el estudio.",
            sinonimos: "Conexión neuronal, enlace químico, comunicación.",
            ejemplo: "Cada nuevo aprendizaje fortalece y multiplica las sinapsis en nuestro cerebro."
        },
        'fotosintesis': {
            categoria: "Sustantivo Femenino (Proceso Botánico)",
            definicion: "Proceso biológico por el cual las plantas, algas y ciertas bacterias convierten la energía lumínica del sol en energía química, sintetizando glucosa (alimento) a partir de agua y dióxido de carbono, liberando oxígeno molecular.",
            uso: "Foco esencial en Ciencias Naturales. Explique la fotosíntesis como el puente fundamental entre el sol y la energía de todos los seres vivos.",
            sinonimos: "Asimilación clorofílica.",
            ejemplo: "Las hojas de las plantas contienen cloroplastos que realizan la fotosíntesis."
        },
        'fotosíntesis': {
            categoria: "Sustantivo Femenino (Proceso Botánico)",
            definicion: "Proceso biológico por el cual las plantas, algas y ciertas bacterias convierten la energía lumínica del sol en energía química, sintetizando glucosa (alimento) a partir de agua y dióxido de carbono, liberando oxígeno molecular.",
            uso: "Foco esencial en Ciencias Naturales. Explique la fotosíntesis como el puente fundamental entre el sol y la energía de todos los seres vivos.",
            sinonimos: "Asimilación clorofílica.",
            ejemplo: "Las hojas de las plantas contienen cloroplastos que realizan la fotosíntesis."
        },
        'metafora': {
            categoria: "Sustantivo Femenino (Figura Retórica)",
            definicion: "Figura literaria de significación que consiste en identificar un término real con otro imaginario basándose en una relación de semejanza (ej: 'cabello de oro' por rubio), permitiendo una expresión más estética y poética.",
            uso: "Clave en Español (Literatura). Pida a los estudiantes que distingan entre una metáfora y una comparación literal (símil) escribiendo ejemplos.",
            sinonimos: "Tropo, traslación, imagen, alegoría.",
            ejemplo: "La frase 'el viento canta entre los pinos' es una bella metáfora literaria."
        },
        'metáfora': {
            categoria: "Sustantivo Femenino (Figura Retórica)",
            definicion: "Figura literaria de significación que consiste en identificar un término real con otro imaginario basándose en una relación de semejanza (ej: 'cabello de oro' por rubio), permitiendo una expresión más estética y poética.",
            uso: "Clave en Español (Literatura). Pida a los estudiantes que distingan entre una metáfora y una comparación literal (símil) escribiendo ejemplos.",
            sinonimos: "Tropo, traslación, imagen, alegoría.",
            ejemplo: "La frase 'el viento canta entre los pinos' es una bella metáfora literaria."
        },
        'ecuacion': {
            categoria: "Sustantivo Femenino (Matemática Algebraica)",
            definicion: "Igualdad matemática constituida por dos expresiones algebraicas que contienen una o más incógnitas o variables conectadas por un signo de igualdad (=). Su resolución consiste en hallar el valor numérico de la variable.",
            uso: "Punto central en Matemáticas. Ejemplifique la ecuación como una balanza en equilibrio donde lo que se hace de un lado debe hacerse del otro.",
            sinonimos: "Igualdad algebraica, fórmula.",
            ejemplo: "Despejamos la incógnita X para encontrar el resultado de la ecuación lineal."
        },
        'ecuación': {
            categoria: "Sustantivo Femenino (Matemática Algebraica)",
            definicion: "Igualdad matemática constituida por dos expresiones algebraicas que contienen una o más incógnitas o variables conectadas por un signo de igualdad (=). Su resolución consiste en hallar el valor numérico de la variable.",
            uso: "Punto central en Matemáticas. Ejemplifique la ecuación como una balanza en equilibrio donde lo que se hace de un lado debe hacerse del otro.",
            sinonimos: "Igualdad algebraica, fórmula.",
            ejemplo: "Despejamos la incógnita X para encontrar el resultado de la ecuación lineal."
        },
        'diptongo': {
            categoria: "Sustantivo Masculino (Fonética y Ortografía)",
            definicion: "Grupo de dos vocales distintas que se pronuncian en una misma sílaba. Ocurre al combinar una vocal fuerte/abierta (a, e, o) con una débil/cerrada (i, u), o combinar dos débiles entre sí.",
            uso: "Básico en Español para la silabación de palabras y reglas de acentuación. Practique dictados de palabras con diptongo en clase.",
            sinonimos: "Unión vocálica.",
            ejemplo: "La palabra 'puerta' tiene un diptongo formado por las vocales 'ue'."
        },
        'hiato': {
            categoria: "Sustantivo Masculino (Fonética y Ortografía)",
            definicion: "Encuentro de dos vocales contiguas que pertenecen a sílabas distintas. Se produce cuando hay dos vocales abiertas contiguas, o bien una vocal abierta junto a una cerrada tónica (que lleva tilde obligatoriamente).",
            uso: "Indispensable para contrastarlo con el diptongo. Enseñe a los alumnos que la tilde en el hiato destruye la unión silábica.",
            sinonimos: "Separación vocálica.",
            ejemplo: "La palabra 'bahía' se divide silábicamente en ba-hí-a, existiendo hiato."
        },
        'celula': {
            categoria: "Sustantivo Femenino (Biología)",
            definicion: "Unidad microscópica morfológica, fisiológica y genética constitutiva de todos los organismos vivos. Posee capacidad de nutrición, relación y reproducción autónoma.",
            uso: "Concepto troncal de Ciencias Naturales. Use maquetas o esquemas visuales para enseñar las diferencias entre células animales y vegetales.",
            sinonimos: "Unidad orgánica, corpúsculo.",
            ejemplo: "La célula vegetal se caracteriza por poseer una pared celular rígida y cloroplastos."
        },
        'célula': {
            categoria: "Sustantivo Femenino (Biología)",
            definicion: "Unidad microscópica morfológica, fisiológica y genética constitutiva de todos los organismos vivos. Posee capacidad de nutrición, relación y reproducción autónoma.",
            uso: "Concepto troncal de Ciencias Naturales. Use maquetas o esquemas visuales para enseñar las diferencias entre células animales y vegetales.",
            sinonimos: "Unidad orgánica, corpúsculo.",
            ejemplo: "La célula vegetal se caracteriza por poseer una pared celular rígida y cloroplastos."
        },
        'atomo': {
            categoria: "Sustantivo Masculino (Física y Química)",
            definicion: "Partícula más pequeña de un elemento químico que conserva su identidad y sus propiedades específicas. Está formado por protones y neutrones en el núcleo, y electrones en la periferia.",
            uso: "Base conceptual de Física y Química. Explique la estructura atómica mediante analogías sencillas como un mini sistema planetario.",
            sinonimos: "Partícula elemental, unidad química.",
            ejemplo: "Dos átomos de hidrógeno se enlazan con uno de oxígeno para constituir agua."
        },
        'átomo': {
            categoria: "Sustantivo Masculino (Física y Química)",
            definicion: "Partícula más pequeña de un elemento químico que conserva su identidad y sus propiedades específicas. Está formado por protones y neutrones en el núcleo, y electrones en la periferia.",
            uso: "Base conceptual de Física y Química. Explique la estructura atómica mediante analogías sencillas como un mini sistema planetario.",
            sinonimos: "Partícula elemental, unidad química.",
            ejemplo: "Dos átomos de hidrógeno se enlazan con uno de oxígeno para constituir agua."
        }
    },

    initKeyboardShortcuts: function() {
        if (this._kbBound) return;
        this._kbBound = true;

        // Listener global de Pegado (Paste)
        document.addEventListener('paste', async (e) => {
            const reader = document.getElementById('gdhn-reader');
            if (!reader || !reader.classList.contains('active')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const items = (e.clipboardData || e.originalEvent.clipboardData || window.clipboardData)?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target.result;
                        this.state.lastCropDataUrl = dataUrl; // guardar en memoria
                        
                        // Pegar en Pizarra Auxiliar si el panel split está visible y esa pestaña está activa
                        const splitPanel = document.getElementById('split-panel');
                        const whiteboardTab = document.getElementById('tab-whiteboard');
                        if (splitPanel && splitPanel.classList.contains('open') && whiteboardTab && whiteboardTab.classList.contains('active')) {
                            this.pasteToAuxWhiteboard(dataUrl);
                        } else {
                            // Pegar en la página activa
                            this.pasteToActivePage(dataUrl);
                        }
                    };
                    reader.readAsDataURL(blob);
                    e.preventDefault();
                    break;
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            const reader = document.getElementById('gdhn-reader');
            if (!reader || !reader.classList.contains('active')) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Ctrl+Z = Deshacer, Ctrl+Y = Rehacer
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.wbUndo(); return; }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); this.wbRedo(); return; }
            
            switch(e.key) {
                case 'ArrowRight': case 'PageDown': e.preventDefault(); this.nextPage(); break;
                case 'ArrowLeft':  case 'PageUp':   e.preventDefault(); this.prevPage(); break;
                case 'Escape':     this.setDrawMode('none'); break;
                case '+': case '=': e.preventDefault(); this.zoomIn(); break;
                case '-':           e.preventDefault(); this.zoomOut(); break;
                case 'b': case 'B': if (!e.ctrlKey) this.setDrawMode('pen'); break;
                case 'h': case 'H': if (!e.ctrlKey) this.setDrawMode('highlighter'); break;
                case 'e': case 'E': if (!e.ctrlKey) this.setDrawMode('eraser'); break;
                case 'l': case 'L': if (!e.ctrlKey) this.setDrawMode('laser'); break;
            }
        });
    },


    toggleBlankBoard: function() {
        const canvases = document.querySelectorAll('.reader-canvas');
        if (!canvases.length) return;
        const isHidden = canvases[0].style.opacity === '0';
        canvases.forEach(c => c.style.opacity = isHidden ? '1' : '0');
        UI.toast(isHidden ? 'PDF visible' : 'Modo Pizarra en Blanco', 'success');
        
        const wrapper = document.getElementById('reader-pages-container');
        if (wrapper) {
            wrapper.style.backgroundColor = isHidden ? '' : '#ffffff';
        }
    },

    toggleTeacherMode: function() {
        const reader = document.getElementById('gdhn-reader');
        if (!reader) return;
        
        reader.classList.toggle('teacher-mode');
        const isTeacher = reader.classList.contains('teacher-mode');
        
        // Sincronizar estado activo del botón
        const btn = document.getElementById('btn-reader-docente');
        if (btn) btn.classList.toggle('active', isTeacher);
        
        if (isTeacher) {
            UI.toast('Modo Docente Activado', 'success');
            // Intentar pantalla completa
            try {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                }
            } catch(e) {}
        } else {
            UI.toast('Modo Docente Desactivado');
            try {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            } catch(e) {}
        }
    },

    modoExplicar: function() {
        this.setZoom(1.25);
        this.updateZoomSelect();
        
        const reader = document.getElementById('gdhn-reader');
        if (reader && !reader.classList.contains('hide-annotations')) {
            reader.classList.add('hide-annotations'); // Ocultar trazos (Limpio)
        }
        
        this.setDrawMode('laser');
        
        const cur = document.getElementById('class-curtain');
        if (cur && cur.style.display === 'flex') cur.style.display = 'none';
        
        const spot = document.getElementById('spotlight-overlay');
        if (spot && spot.style.display === 'block') spot.style.display = 'none';
        
        UI.toast('Modo Explicar: Puntero Láser activado, pizarra limpia.', 'info');
    },

    modoResolver: function() {
        const reader = document.getElementById('gdhn-reader');
        if (reader && reader.classList.contains('hide-annotations')) {
            reader.classList.remove('hide-annotations'); // Mostrar trazos
        }
        
        this.setDrawMode('pen');
        UI.toast('Modo Resolver: Lápiz activado para escribir.', 'success');
    },

    // --- SPLIT PANEL & DOCENTE ADVANCED ---

    toggleSplitPanel: function() {
        const body = document.getElementById('reader-body');
        const panel = document.getElementById('split-panel');
        if (!body || !panel) return;
        
        const aiPanel = document.getElementById('ai-panel');
        if (aiPanel && aiPanel.classList.contains('open')) {
            this.toggleAIPanel();
        }
        
        panel.classList.toggle('open');
        body.classList.toggle('split-open');
        
        // Sincronizar estado activo del botón
        const btn = document.getElementById('btn-reader-split');
        if (btn) btn.classList.toggle('active', panel.classList.contains('open'));
        
        if (panel.classList.contains('open')) {
            UI.toast('Panel Docente abierto', 'success');
            this.initAuxWhiteboard();
            this.loadTeacherDataForCurrentPage();
        }
    },

    switchSplitTab: function(tabId) {
        const tabs = document.querySelectorAll('.split-tab');
        const contents = document.querySelectorAll('.split-content');
        
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        const targetTab = document.querySelector(`.split-tab[onclick*="${tabId}"]`);
        if (targetTab) targetTab.classList.add('active');
        const targetContent = document.getElementById(tabId);
        if (targetContent) targetContent.classList.add('active');
        
        if (tabId === 'tab-whiteboard') {
            setTimeout(() => this.initAuxWhiteboard(), 50);
        }
    },
    
    recordingState: { stream: null, recorder: null, chunks: [], active: false, startTime: 0, timer: null },

    initAuxWhiteboard: function() {
        const canvas = document.getElementById('aux-whiteboard');
        if (!canvas) return;
        if (canvas.dataset.initialized) return;
        
        canvas.dataset.initialized = 'true';
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight - 45; 
        
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0f172a';
        
        let isDrawing = false;
        let lastX = 0, lastY = 0;
        
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        
        const startDraw = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x; lastY = pos.y;
            e.preventDefault();
        };
        const draw = (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
            e.preventDefault();
        };
        const endDraw = () => isDrawing = false;
        
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', endDraw);
        canvas.addEventListener('touchstart', startDraw, {passive:false});
        canvas.addEventListener('touchmove', draw, {passive:false});
        window.addEventListener('touchend', endDraw);
    },
    
    clearAuxWhiteboard: function() {
        const canvas = document.getElementById('aux-whiteboard');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0,0, canvas.width, canvas.height);
    },

    pasteToAuxWhiteboard: function(optionalDataUrl = null) {
        const canvas = document.getElementById('aux-whiteboard');
        if (!canvas) return;
        
        const pasteImage = (imgSrc) => {
            const img = new Image();
            img.onload = () => {
                const ctx = canvas.getContext('2d');
                const maxW = canvas.width * 0.8;
                const maxH = canvas.height * 0.8;
                let w = img.width;
                let h = img.height;
                
                if (w > maxW || h > maxH) {
                    const ratio = Math.min(maxW / w, maxH / h);
                    w *= ratio;
                    h *= ratio;
                }
                
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;
                
                ctx.drawImage(img, x, y, w, h);
                UI.toast('Recorte pegado en la Pizarra Auxiliar', 'success');
            };
            img.src = imgSrc;
        };

        const targetDataUrl = optionalDataUrl || this.state.lastCropDataUrl;

        if (targetDataUrl) {
            pasteImage(targetDataUrl);
        } else {
            if (navigator.clipboard && navigator.clipboard.read) {
                navigator.clipboard.read().then(async (items) => {
                    for (const item of items) {
                        for (const type of item.types) {
                            if (type.startsWith('image/')) {
                                const blob = await item.getType(type);
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    pasteImage(e.target.result);
                                };
                                reader.readAsDataURL(blob);
                                return;
                            }
                        }
                    }
                    UI.toast('No hay ningún recorte en el portapapeles', 'info');
                }).catch(() => {
                    UI.toast('Primero realiza un recorte usando la herramienta de tijeras', 'info');
                });
            } else {
                UI.toast('Primero realiza un recorte usando la herramienta de tijeras', 'info');
            }
        }
    },

    pasteToActivePage: function(dataUrl) {
        if (!dataUrl) return;
        const pageNum = this.state.pageNum;
        const wrapper = document.querySelector(`.reader-canvas-wrapper[data-page-num="${pageNum}"]`);
        if (!wrapper) return;
        const htmlLayer = wrapper.querySelector('.html-layer');
        if (!htmlLayer) return;

        const w = 300;
        const h = 200;
        const x = (htmlLayer.clientWidth - w) / 2;
        const y = (htmlLayer.clientHeight - h) / 2;

        const container = document.createElement('div');
        container.className = 'wb-image-container';
        container.style.left = x + 'px';
        container.style.top = y + 'px';
        container.style.width = w + 'px';
        container.style.height = h + 'px';
        container.style.boxShadow = '0 10px 25px rgba(236, 72, 153, 0.5)';
        container.style.outline = '2px solid #ec4899';
        container.style.zIndex = '150';

        container.innerHTML = `
            <div class="wb-img-drag-handle" style="background: rgba(236,72,153,0.9);">✥ Mover</div>
            <span class="wb-image-delete" onclick="this.parentElement.remove()" title="Eliminar Recorte">❌</span>
            <img src="${dataUrl}" style="object-fit: contain; width: 100%; height: 100%;"/>
        `;
        
        container.addEventListener('mousedown', () => {
            const allNotes = htmlLayer.querySelectorAll('.wb-note, .wb-image-container');
            let maxZ = 50;
            allNotes.forEach(n => {
                if (n !== container) {
                    const z = parseInt(window.getComputedStyle(n).zIndex) || 50;
                    if (z > maxZ) maxZ = z;
                }
            });
            container.style.zIndex = maxZ + 1;
        });

        this.makeDraggable(container, container.querySelector('.wb-img-drag-handle'));
        htmlLayer.appendChild(container);
        
        const canvas = wrapper.querySelector('.reader-canvas');
        if (canvas) {
            this.wbSaveSnapshot(canvas, htmlLayer, pageNum);
            this.savePageNotes(canvas, htmlLayer, pageNum);
        }
        UI.toast('Recorte pegado en la pizarra', 'success');
    },

    pasteLastCropToActivePage: function() {
        if (!this.state.lastCropDataUrl) {
            UI.toast('Primero realiza un recorte usando la herramienta de tijeras', 'info');
            return;
        }
        this.pasteToActivePage(this.state.lastCropDataUrl);
    },

    loadTeacherDataForCurrentPage: async function() {
        const pNum = this.state.pageNum;
        document.getElementById('sp-note-page-num').textContent = pNum;
        document.getElementById('sp-res-page-num').textContent = pNum;
        
        const id = `${this.state.bookId}_${pNum}`;
        
        // Cargar Notas
        const notes = await this.db.getGeneric('teacher_notes', id);
        if (notes) {
            document.getElementById('sp-note-theme').value = notes.theme || '';
            document.getElementById('sp-note-explanation').value = notes.explanation || '';
            document.getElementById('sp-note-observation').value = notes.observation || '';
            document.getElementById('sp-note-homework').value = notes.homework || '';
        } else {
            document.getElementById('sp-note-theme').value = '';
            document.getElementById('sp-note-explanation').value = '';
            document.getElementById('sp-note-observation').value = '';
            document.getElementById('sp-note-homework').value = '';
        }
        
        // Cargar Marcador
        const bmk = await this.db.getGeneric('teacher_bookmarks', id);
        if (bmk) {
            document.getElementById('sp-bm-subject').value = bmk.subject || '';
            document.getElementById('sp-bm-grade').value = bmk.grade || '';
            document.getElementById('sp-bm-unit').value = bmk.unit || '';
            document.getElementById('sp-bm-lesson').value = bmk.lesson || '';
            document.getElementById('sp-bm-comment').value = bmk.comment || '';
        } else {
            document.getElementById('sp-bm-subject').value = '';
            document.getElementById('sp-bm-grade').value = '';
            document.getElementById('sp-bm-unit').value = '';
            document.getElementById('sp-bm-lesson').value = '';
            document.getElementById('sp-bm-comment').value = '';
        }
        
        // Cargar Recursos
        this.currentResources = await this.db.getGeneric('teacher_resources', id) || [];
        this.renderResourceList();
    },

    saveTeacherNotes: async function() {
        const id = `${this.state.bookId}_${this.state.pageNum}`;
        const data = {
            theme: document.getElementById('sp-note-theme').value,
            explanation: document.getElementById('sp-note-explanation').value,
            observation: document.getElementById('sp-note-observation').value,
            homework: document.getElementById('sp-note-homework').value
        };
        await this.db.saveGeneric('teacher_notes', id, data);
        UI.toast('Notas del docente guardadas', 'success');
    },

    saveTeacherBookmark: async function() {
        const id = `${this.state.bookId}_${this.state.pageNum}`;
        const data = {
            subject: document.getElementById('sp-bm-subject').value,
            grade: document.getElementById('sp-bm-grade').value,
            unit: document.getElementById('sp-bm-unit').value,
            lesson: document.getElementById('sp-bm-lesson').value,
            comment: document.getElementById('sp-bm-comment').value
        };
        await this.db.saveGeneric('teacher_bookmarks', id, data);
        UI.toast('Marcador pedagógico guardado', 'success');
    },

    saveTeacherBookmarkCustom: async function(pageNum, label) {
        if (!this.state.libroActual) return;
        const id = `${this.state.libroActual.id}_${pageNum}`;
        const data = {
            subject: this.state.libroActual.name,
            lesson: label,
            comment: label,
            date: new Date().toLocaleDateString()
        };
        await this.db.saveGeneric('teacher_bookmarks', id, data);
    },

    currentResources: [],

    saveCurrentResources: async function() {
        const id = `${this.state.bookId}_${this.state.pageNum}`;
        await this.db.saveGeneric('teacher_resources', id, this.currentResources);
        this.renderResourceList();
    },

    addResourceLink: function() {
        const link = document.getElementById('sp-res-link').value;
        if (!link) return UI.toast('Ingresa un enlace válido', 'error');
        this.currentResources.push({ type: 'link', url: link, name: link });
        document.getElementById('sp-res-link').value = '';
        this.saveCurrentResources();
        UI.toast('Enlace añadido', 'success');
    },

    addResourceFile: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.currentResources.push({ type: 'file', url: ev.target.result, name: file.name });
            this.saveCurrentResources();
            UI.toast('Archivo añadido a la página', 'success');
        };
        reader.readAsDataURL(file);
    },

    renderResourceList: function() {
        const container = document.getElementById('sp-res-list');
        if (!container) return;
        container.innerHTML = '';
        
        if (this.currentResources.length === 0) {
            container.innerHTML = '<p style="font-size:12px; color:#888; text-align:center;">No hay recursos guardados en esta página.</p>';
            return;
        }
        
        this.currentResources.forEach((res, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'background:#f1f5f9; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0;';
            
            const nameSpan = document.createElement('span');
            nameSpan.style.cssText = 'font-size:12px; color:#334155; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px; font-weight:500; cursor:pointer; text-decoration:underline;';
            nameSpan.textContent = res.name;
            nameSpan.onclick = () => {
                if (res.type === 'link') window.open(res.url, '_blank');
                else {
                    // Si es un archivo base64 (ej. imagen, pdf) abrirlo en nueva pestaña
                    const win = window.open();
                    if (win) {
                        win.document.write(`<iframe src="${res.url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    }
                }
            };
            
            const btnDel = document.createElement('button');
            btnDel.innerHTML = 'X';
            btnDel.style.cssText = 'background:transparent; border:none; color:#ef4444; cursor:pointer; font-weight:bold; font-size:12px;';
            btnDel.onclick = () => {
                this.currentResources.splice(index, 1);
                this.saveCurrentResources();
            };
            
            div.appendChild(nameSpan);
            div.appendChild(btnDel);
            container.appendChild(div);
        });
    },


    toggleAnnotations: function() {
        const reader = document.getElementById('gdhn-reader');
        const btn = document.getElementById('wb-eye');
        if (!reader) return;
        reader.classList.toggle('hide-annotations');
        if (reader.classList.contains('hide-annotations')) {
            if(btn) btn.classList.add('active');
            UI.toast('Anotaciones ocultas', 'info');
        } else {
            if(btn) btn.classList.remove('active');
            UI.toast('Anotaciones visibles', 'success');
        }
    },

    toggleSpotlight: function() {
        let spot = document.getElementById('spotlight-overlay');
        const btn = document.getElementById('wb-spot');
        if (!spot) {
            spot = document.createElement('div');
            spot.id = 'spotlight-overlay';
            spot.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:9996; pointer-events:none; display:none;';
            document.body.appendChild(spot);
            
            // Move event only when active
            document.addEventListener('mousemove', (e) => {
                if (spot.style.display === 'block') {
                    const x = e.clientX;
                    const y = e.clientY;
                    spot.style.background = `radial-gradient(circle 150px at ${x}px ${y}px, transparent 0%, rgba(0,0,0,0.85) 100%)`;
                }
            });
            
            // Touch event for tablets
            document.addEventListener('touchmove', (e) => {
                if (spot.style.display === 'block' && e.touches.length > 0) {
                    const x = e.touches[0].clientX;
                    const y = e.touches[0].clientY;
                    spot.style.background = `radial-gradient(circle 150px at ${x}px ${y}px, transparent 0%, rgba(0,0,0,0.85) 100%)`;
                }
            }, {passive: true});
        }
        
        if (spot.style.display === 'block') {
            spot.style.display = 'none';
            if(btn) btn.classList.remove('active');
            UI.toast('Enfoque desactivado');
        } else {
            spot.style.display = 'block';
            if(btn) btn.classList.add('active');
            // Initial position center
            const x = window.innerWidth / 2;
            const y = window.innerHeight / 2;
            spot.style.background = `radial-gradient(circle 150px at ${x}px ${y}px, transparent 0%, rgba(0,0,0,0.85) 100%)`;
            UI.toast('Enfoque activado. Mueve el ratón o desliza.', 'success');
        }
    },

    toggleMagnifier: function() {
        let mag = document.getElementById('magnifier-tool');
        if (!mag) {
            mag = document.createElement('canvas');
            mag.id = 'magnifier-tool';
            mag.width = 240;
            mag.height = 240;
            mag.style.cssText = 'position:fixed; border: 4px solid #00C853; border-radius: 50%; z-index:9998; display:none; pointer-events:none; box-shadow: 0 8px 24px rgba(0,0,0,0.5); background: #fff;';
            document.body.appendChild(mag);
            
            const updateMag = (x, y) => {
                if (mag.style.display !== 'block') return;
                mag.style.left = (x - 120) + 'px';
                mag.style.top = (y - 120) + 'px';
                
                const wrapper = document.querySelector('.reader-canvas-wrapper');
                if (!wrapper) return;
                const pdfC = wrapper.querySelector('.reader-canvas');
                if (!pdfC) return;
                
                const rect = pdfC.getBoundingClientRect();
                const scaleX = pdfC.width / rect.width;
                const scaleY = pdfC.height / rect.height;
                
                const srcX = (x - rect.left) * scaleX;
                const srcY = (y - rect.top) * scaleY;
                
                const ctx = mag.getContext('2d');
                ctx.clearRect(0,0,240,240);
                
                // Clip circle
                ctx.save();
                ctx.beginPath();
                ctx.arc(120, 120, 120, 0, Math.PI * 2);
                ctx.clip();
                
                // Draw 120x120 area from pdfC, scaled to 240x240 (2x zoom)
                ctx.drawImage(pdfC, srcX - 60, srcY - 60, 120, 120, 0, 0, 240, 240);
                
                // Draw drawing layer too
                const drawC = wrapper.querySelector('.drawing-layer');
                if (drawC) {
                    ctx.drawImage(drawC, srcX - 60, srcY - 60, 120, 120, 0, 0, 240, 240);
                }
                
                ctx.restore();
            };
            
            document.addEventListener('mousemove', e => updateMag(e.clientX, e.clientY));
            document.addEventListener('touchmove', e => {
                if (e.touches.length > 0) updateMag(e.touches[0].clientX, e.touches[0].clientY);
            }, {passive: true});
        }
        
        const btn = document.getElementById('wb-mag');
        if (mag.style.display === 'block') {
            mag.style.display = 'none';
            if(btn) btn.classList.remove('active');
            UI.toast('Lupa desactivada');
        } else {
            mag.style.display = 'block';
            if(btn) btn.classList.add('active');
            UI.toast('Lupa activada', 'success');
        }
    },

    toggleCurtain: function() {
        let cur = document.getElementById('class-curtain');
        if (!cur) {
            cur = document.createElement('div');
            cur.id = 'class-curtain';
            cur.style.cssText = 'position:fixed; top:0; left:0; width:100vw; background:#1e293b; z-index:9997; display:none; flex-direction:column; box-shadow: 0 10px 30px rgba(0,0,0,0.5);';
            cur.innerHTML = `<div id="curtain-handle" style="position:absolute; bottom:0; left:0; width:100%; height:30px; background:#0f172a; border-top: 1px solid #334155; cursor:ns-resize; display:flex; justify-content:center; align-items:center; color:#94a3b8; font-size:12px; font-weight:bold;">≡ ARRASTRAR CORTINA ≡</div>`;
            document.body.appendChild(cur);
            
            let isDragging = false;
            const handle = document.getElementById('curtain-handle');
            handle.addEventListener('mousedown', () => isDragging = true);
            handle.addEventListener('touchstart', () => isDragging = true, {passive: true});
            
            document.addEventListener('mouseup', () => isDragging = false);
            document.addEventListener('touchend', () => isDragging = false);
            
            const doDrag = (y) => {
                if (!isDragging) return;
                cur.style.height = y + 'px';
            };
            
            document.addEventListener('mousemove', (e) => doDrag(e.clientY));
            document.addEventListener('touchmove', (e) => {
                if(e.touches.length > 0) doDrag(e.touches[0].clientY);
            }, {passive: true});
        }
        
        const btn = document.getElementById('wb-curtain');
        if (cur.style.display === 'flex') {
            cur.style.display = 'none';
            if(btn) btn.classList.remove('active');
            UI.toast('Cortina desactivada');
        } else {
            cur.style.display = 'flex';
            if(btn) btn.classList.add('active');
            cur.style.height = (window.innerHeight / 2) + 'px'; // Half screen initially
            UI.toast('Cortina activada', 'success');
        }
    },

    prevPage: function () {
        if (this.state.pageNum <= 1) return;
        const container = document.getElementById('reader-pages-container');
        if (container) {
            container.classList.remove('in-from-prev', 'in-from-next');
            container.classList.add('turning-prev');
            setTimeout(() => {
                this.state.pageNum -= this.state.layout;
                if (this.state.pageNum <1) this.state.pageNum = 1;
                container.classList.remove('turning-prev');
                container.classList.add('in-from-prev');
                this.renderLayout();
                setTimeout(() => container.classList.remove('in-from-prev'), 350);
                if (this.state.isSpeaking) this.readCurrentPages();
                if (document.getElementById('split-panel').classList.contains('open')) {
                    this.loadTeacherDataForCurrentPage();
                }
                this.updateThumbnailsActive();
            }, 300);
        }
    },

    nextPage: function () {
        if (!this.state.pdfDoc || this.state.pageNum + this.state.layout > this.state.pdfDoc.numPages) return;
        const container = document.getElementById('reader-pages-container');
        if (container) {
            container.classList.remove('in-from-prev', 'in-from-next');
            container.classList.add('turning-next');
            setTimeout(() => {
                this.state.pageNum += this.state.layout;
                container.classList.remove('turning-next');
                container.classList.add('in-from-next');
                this.renderLayout();
                setTimeout(() => container.classList.remove('in-from-next'), 350);
                if (this.state.isSpeaking) this.readCurrentPages();
                if (document.getElementById('split-panel').classList.contains('open')) {
                    this.loadTeacherDataForCurrentPage();
                }
                this.updateThumbnailsActive();
            }, 300);
        }
    },

    toggleDarkMode: function() {
        const body = document.querySelector('.reader-body');
        if (body) {
            body.classList.toggle('reader-dark-mode');
            const btn = document.querySelector('.ev-dark-btn i[data-lucide="moon"]');
            if(btn && btn.parentElement) {
                if(body.classList.contains('reader-dark-mode')) {
                    btn.parentElement.style.color = '#fbbf24';
                    btn.parentElement.innerHTML = '<i data-lucide="sun"></i> Modo Lectura Diurna';
                } else {
                    btn.parentElement.style.color = '';
                    btn.parentElement.innerHTML = '<i data-lucide="moon"></i> Modo Lectura Nocturna';
                }
                if (window.lucide) lucide.createIcons();
            }
        }
    },

    goToPage: function (numStr) {
        if (!this.state.pdfDoc) return;
        let num = parseInt(numStr, 10);
        if (isNaN(num)) return;
        if (num <1) num = 1;
        if (num > this.state.pdfDoc.numPages) num = this.state.pdfDoc.numPages;
        this.state.pageNum = num;
        this.renderLayout();
        if (this.state.isSpeaking) this.readCurrentPages();
        if (document.getElementById('split-panel').classList.contains('open')) {
            this.loadTeacherDataForCurrentPage();
        }
        this.updateThumbnailsActive();
    },

    baseScale: null,
    zoomDebounceTimer: null,
    applyFluidZoom: function(newScale) {
        if (!this.baseScale) this.baseScale = this.state.scale || 1.0;
        if (newScale === this.baseScale) return;
        
        this.state.scale = newScale;
        this.updateZoomSelect();
        
        const ratio = newScale / this.baseScale;
        const container = document.getElementById('reader-pages-container');
        if (container) {
            container.style.transformOrigin = 'top center';
            container.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)';
            container.style.transform = `scale(${ratio})`;
        }
        
        if (this.zoomDebounceTimer) clearTimeout(this.zoomDebounceTimer);
        this.zoomDebounceTimer = setTimeout(() => {
             if (container) {
                 container.style.transition = 'none';
                 container.style.transform = 'none';
             }
             this.baseScale = this.state.scale;
             this.renderLayout(true);
        }, 350);
    },

    setZoom: function(scale) {
        this.applyFluidZoom(parseFloat(scale));
    },

    zoomIn: function () {
        this.applyFluidZoom(Math.min(3.0, this.state.scale + 0.25));
    },

    zoomOut: function () {
        this.applyFluidZoom(Math.max(0.25, this.state.scale - 0.25));
    },

    updateZoomSelect: function() {
        const sel = document.getElementById('reader-zoom-select');
        if (sel) {
            // Find closest option or add a custom one
            let found = false;
            for(let i=0; i<sel.options.length; i++) {
                if (parseFloat(sel.options[i].value) === this.state.scale) {
                    sel.selectedIndex = i;
                    found = true;
                    break;
                }
            }
            if (!found) {
                const opt = document.createElement('option');
                opt.value = this.state.scale;
                opt.text = Math.round(this.state.scale * 100) + '%';
                sel.add(opt);
                sel.value = this.state.scale;
            }
        }
    },

    fitWidth: function() {
        if (!this.state.pdfDoc) return;
        const container = document.getElementById('reader-pages-container');
        if (!container) return;
        
        this.state.pdfDoc.getPage(this.state.pageNum).then(page => {
            const viewport = page.getViewport({ scale: 1.0 });
            const availableWidth = container.clientWidth - 80; // margins
            const totalRequiredWidth = (viewport.width * this.state.layout) + (20 * (this.state.layout - 1));
            let newScale = availableWidth / totalRequiredWidth;
            this.setZoom(Math.min(Math.max(newScale, 0.25), 3.0));
            this.updateZoomSelect();
            UI.toast('Ajustado al ancho');
        });
    },

    fitHeight: function() {
        if (!this.state.pdfDoc) return;
        const container = document.getElementById('reader-pages-container');
        if (!container) return;
        
        this.state.pdfDoc.getPage(this.state.pageNum).then(page => {
            const viewport = page.getViewport({ scale: 1.0 });
            const availableHeight = container.clientHeight - 80; 
            let newScale = availableHeight / viewport.height;
            this.setZoom(Math.min(Math.max(newScale, 0.25), 3.0));
            this.updateZoomSelect();
            UI.toast('Ajustado al alto');
        });
    },

    fitPage: function(silent = false) {
        if (!this.state.pdfDoc) return;
        const body = document.getElementById('reader-body');
        if (!body) return;
        
        this.state.pdfDoc.getPage(this.state.pageNum).then(page => {
            const viewport = page.getViewport({ scale: 1.0 });
            
            const availableWidth = body.clientWidth - 60; // Margen de seguridad
            const availableHeight = body.clientHeight - 60;
            
            const totalRequiredWidth = (viewport.width * this.state.layout) + (20 * (this.state.layout - 1));
            
            const scaleW = availableWidth / totalRequiredWidth;
            const scaleH = availableHeight / viewport.height;
            
            let newScale = Math.min(scaleW, scaleH);
            this.setZoom(Math.min(Math.max(newScale, 0.25), 3.0));
            this.updateZoomSelect();
            if (!silent === true) UI.toast('Vista ajustada a la pantalla');
        });
    },

    smartZoom: function(clientX, clientY) {
        if (!this.state.pdfDoc) return;
        const container = document.getElementById('reader-pages-container');
        if (!container) return;

        if (this.state.scale > 1.05) {
            this.fitPage(true);
            return;
        }

        const oldScale = this.state.scale || 1.0;
        const newScale = 2.75;
        const scaleRatio = newScale / oldScale;

        // 1. Identificar en qué página (wrapper) se hizo clic
        const wrappers = Array.from(container.querySelectorAll('.reader-canvas-wrapper'));
        let clickedWrapper = null;
        let wrapperIndex = 0;
        
        for (let i = 0; i < wrappers.length; i++) {
            const rect = wrappers[i].getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                clickedWrapper = wrappers[i];
                wrapperIndex = i;
                break;
            }
        }
        
        if (!clickedWrapper && wrappers.length > 0) {
            clickedWrapper = wrappers[0]; // fallback
        }

        let clickXOnPage = 0;
        let clickYOnPage = 0;

        if (clickedWrapper) {
            const rect = clickedWrapper.getBoundingClientRect();
            clickXOnPage = clientX - rect.left;
            clickYOnPage = clientY - rect.top;
        }

        this.setZoom(newScale);
        this.updateZoomSelect();

        // 2. Esperar al renderizado y calcular nueva posición usando polling
        let attempts = 0;
        const waitForRender = () => {
            attempts++;
            const newWrappers = Array.from(container.querySelectorAll('.reader-canvas-wrapper'));
            const newTargetWrapper = newWrappers[wrapperIndex] || newWrappers[0];
            const pdfCanvas = newTargetWrapper ? newTargetWrapper.querySelector('.reader-canvas') : null;

            // Esperar explícitamente a que PDF.js haya calculado y aplicado el style.width real del canvas
            if (newTargetWrapper && pdfCanvas && pdfCanvas.style.width) {
                const newClickXOnPage = clickXOnPage * scaleRatio;
                const newClickYOnPage = clickYOnPage * scaleRatio;

                const rect = newTargetWrapper.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // Coordenada absoluta de la página dentro del espacio scrollable
                const absolutePageX = (rect.left - containerRect.left) + container.scrollLeft;
                const absolutePageY = (rect.top - containerRect.top) + container.scrollTop;

                const absoluteTargetX = absolutePageX + newClickXOnPage;
                const absoluteTargetY = absolutePageY + newClickYOnPage;

                const targetScrollLeft = absoluteTargetX - (container.clientWidth / 2);
                const targetScrollTop = absoluteTargetY - (container.clientHeight / 2);

                container.style.scrollBehavior = 'smooth';
                container.scrollLeft = targetScrollLeft;
                container.scrollTop = targetScrollTop;
                
                setTimeout(() => { container.style.scrollBehavior = 'auto'; }, 300);
            } else if (attempts < 40) {
                // Reintentar cada 50ms hasta 2 segundos
                setTimeout(waitForRender, 50);
            }
        };
        
        setTimeout(waitForRender, 50);
    },

    // ==========================================
    // MODULE: CENTRAL GESTURE MANAGER & TOUCH ENGINE
    // ==========================================
    initGestureManager: function () {
        if (this.gestureManagerInitialized) return;
        this.gestureManagerInitialized = true;
        this.initMinimap();

        const body = document.querySelector('.reader-body');
        if (!body) return;

        // FSM States
        const STATES = {
            IDLE: 'IDLE',
            TAP_PENDING: 'TAP_PENDING',
            PAN: 'PAN',
            PINCH_ZOOM: 'PINCH_ZOOM',
            TEXT_SELECTION: 'TEXT_SELECTION',
            INK: 'INK',
            OBJECT_MANIPULATION: 'OBJECT_MANIPULATION'
        };

        let currentState = STATES.IDLE;
        let pointers = new Map();

        let startTouchX = 0, startTouchY = 0;
        let lastTouchX = 0, lastTouchY = 0;
        let startScrollLeft = 0, startScrollTop = 0;
        let initialPinchDist = 0;
        let initialScale = 1.0;
        let focalX = 0, focalY = 0;
        let lastTapTime = 0;
        let longPressTimer = null;
        let isSwipingPage = false;
        let velocityX = 0, velocityY = 0;
        let lastMoveTime = 0;

        const getDistance = (p1, p2) => {
            const dx = p1.clientX - p2.clientX;
            const dy = p1.clientY - p2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getMidpoint = (p1, p2) => {
            return {
                x: (p1.clientX + p2.clientX) / 2,
                y: (p1.clientY + p2.clientY) / 2
            };
        };

        // Floating "Volver a Encajar" button
        let refitBtn = document.getElementById('reader-refit-btn');
        if (!refitBtn) {
            refitBtn = document.createElement('button');
            refitBtn.id = 'reader-refit-btn';
            refitBtn.innerHTML = '<i data-lucide="maximize-2" style="width:14px;"></i> ⛶ Ajustar';
            refitBtn.style.cssText = `
                position: fixed; bottom: 75px; right: 25px; z-index: 99999;
                background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(12px);
                color: #38bdf8; border: 1.5px solid rgba(56, 189, 248, 0.4);
                border-radius: 30px; padding: 7px 15px; font-size: 12px; font-weight: 800;
                cursor: pointer; display: none; align-items: center; gap: 6px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5); transition: all 0.2s ease;
            `;
            refitBtn.onclick = () => {
                this.fitWidth();
                refitBtn.style.display = 'none';
            };
            document.getElementById('gdhn-reader')?.appendChild(refitBtn);
            if (window.lucide) lucide.createIcons();
        }

        const updateRefitBtnVisibility = () => {
            if (refitBtn) {
                if (this.state.scale > 1.15 || body.scrollTop > 100) {
                    refitBtn.style.display = 'inline-flex';
                } else {
                    refitBtn.style.display = 'none';
                }
            }
        };

        // ─── POINTER / TOUCH DOWN ───
        const onDown = (e) => {
            // Check if manipulating interactive object handles
            if (e.target.closest('.wb-hl-resizer') || e.target.closest('.wb-hl-drag-handle') ||
                e.target.closest('.wb-img-drag-handle') || e.target.closest('.wb-text-drag-handle') ||
                e.target.closest('.wb-note-header') || e.target.closest('.wb-btn') || e.target.closest('button')) {
                currentState = STATES.OBJECT_MANIPULATION;
                return;
            }

            // STYLUS / PEN DETECTED -> INK MODE
            if (e.pointerType === 'pen' || (this.state.drawMode && this.state.drawMode !== 'none')) {
                currentState = STATES.INK;
                return;
            }

            // Store pointer info
            pointers.set(e.pointerId || 1, { clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY });

            if (pointers.size === 1) {
                const pt = Array.from(pointers.values())[0];
                startTouchX = pt.clientX;
                startTouchY = pt.clientY;
                lastTouchX = pt.clientX;
                lastTouchY = pt.clientY;
                startScrollLeft = body.scrollLeft;
                startScrollTop = body.scrollTop;
                lastMoveTime = performance.now();
                isSwipingPage = false;
                currentState = STATES.TAP_PENDING;

                // Long Press Timer for Text Selection (450ms)
                if (longPressTimer) clearTimeout(longPressTimer);
                longPressTimer = setTimeout(() => {
                    if (currentState === STATES.TAP_PENDING) {
                        currentState = STATES.TEXT_SELECTION;
                        if (window.navigator.vibrate) window.navigator.vibrate(40);
                    }
                }, 450);

            } else if (pointers.size === 2) {
                if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

                currentState = STATES.PINCH_ZOOM;
                const pts = Array.from(pointers.values());
                initialPinchDist = getDistance(pts[0], pts[1]);
                initialScale = this.state.scale;

                // Calculate Focal Midpoint
                const mid = getMidpoint(pts[0], pts[1]);
                focalX = mid.x;
                focalY = mid.y;

                const container = document.getElementById('reader-pages-container');
                if (container) container.style.transition = 'none';
            }
        };

        // ─── POINTER / TOUCH MOVE ───
        const onMove = (e) => {
            if (currentState === STATES.INK || currentState === STATES.OBJECT_MANIPULATION) return;

            if (pointers.has(e.pointerId || 1)) {
                pointers.set(e.pointerId || 1, { clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY });
            }

            // 1. PINCH-ZOOM MODE (2 fingers)
            if (currentState === STATES.PINCH_ZOOM && pointers.size >= 2) {
                if (e.cancelable) e.preventDefault();

                const pts = Array.from(pointers.values());
                const currentDist = getDistance(pts[0], pts[1]);
                if (initialPinchDist > 0) {
                    const ratio = currentDist / initialPinchDist;
                    const newScale = Math.min(Math.max(initialScale * ratio, 0.5), 5.0);

                    const container = document.getElementById('reader-pages-container');
                    if (container) {
                        container.style.transform = `scale(${newScale / initialScale})`;
                        container.style.transformOrigin = `${focalX}px ${focalY}px`;
                    }
                }
                return;
            }

            // 2. PAN MODE (1 finger)
            if (pointers.size === 1) {
                const pt = Array.from(pointers.values())[0];
                const dx = pt.clientX - startTouchX;
                const dy = pt.clientY - startTouchY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // 8px threshold before switching to PAN
                if (currentState === STATES.TAP_PENDING && dist > 8) {
                    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
                    currentState = STATES.PAN;
                }

                if (currentState === STATES.PAN) {
                    if (e.cancelable) e.preventDefault();

                    const now = performance.now();
                    const dt = Math.max(1, now - lastMoveTime);
                    velocityX = (pt.clientX - lastTouchX) / dt;
                    velocityY = (pt.clientY - lastTouchY) / dt;
                    lastMoveTime = now;
                    lastTouchX = pt.clientX;
                    lastTouchY = pt.clientY;

                    // IF AT FIT SCALE (<= 1.05): Check for Horizontal Page Swipe
                    if (this.state.scale <= 1.05) {
                        const isAtLeftEdge = body.scrollLeft <= 2;
                        const maxScrollLeft = body.scrollWidth - body.clientWidth;
                        const isAtRightEdge = body.scrollLeft >= maxScrollLeft - 2;

                        if (!isSwipingPage && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) && (isAtLeftEdge || isAtRightEdge)) {
                            isSwipingPage = true;
                        }

                        if (isSwipingPage) {
                            const container = document.getElementById('reader-pages-container');
                            if (container) {
                                container.style.transition = 'none';
                                container.style.transform = `translateX(${dx * 0.75}px)`;
                            }
                            return;
                        }
                    }

                    // NORMAL 1:1 SCROLL PAN
                    body.scrollLeft = startScrollLeft - dx;
                    body.scrollTop = startScrollTop - dy;
                    updateRefitBtnVisibility();
                }
            }
        };

        // ─── POINTER / TOUCH UP ───
        const onUp = (e) => {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }

            pointers.delete(e.pointerId || 1);

            // Finish PINCH-ZOOM
            if (currentState === STATES.PINCH_ZOOM && pointers.size < 2) {
                const container = document.getElementById('reader-pages-container');
                if (container) {
                    const currentTransform = container.style.transform;
                    container.style.transform = '';
                    container.style.transformOrigin = '';

                    const match = currentTransform.match(/scale\(([^)]+)\)/);
                    let ratio = match ? parseFloat(match[1]) : 1.0;
                    let targetScale = Math.min(Math.max(initialScale * ratio, 0.5), 4.0);

                    if (Math.abs(targetScale - this.state.scale) > 0.05) {
                        this.setZoom(Math.round(targetScale * 4) / 4);
                        this.updateZoomSelect();
                    }
                }
                currentState = STATES.IDLE;
                pointers.clear();
                updateRefitBtnVisibility();
                return;
            }

            // Finish PAN or TAP
            if (currentState === STATES.TAP_PENDING) {
                const now = performance.now();
                if (now - lastTapTime < 300) {
                    this.toggleDoubleTapZoom(startTouchX, startTouchY);
                    lastTapTime = 0;
                } else {
                    lastTapTime = now;
                }
            } else if (currentState === STATES.PAN && isSwipingPage) {
                const container = document.getElementById('reader-pages-container');
                if (container) container.style.transform = '';

                const pt = e.changedTouches ? e.changedTouches[0] : e;
                const dx = (pt.clientX || lastTouchX) - startTouchX;
                const threshold = body.clientWidth * 0.18;

                if (dx > threshold || velocityX > 0.4) {
                    this.prevPage();
                } else if (dx < -threshold || velocityX < -0.4) {
                    this.nextPage();
                }
                isSwipingPage = false;
            }

            currentState = STATES.IDLE;
            updateRefitBtnVisibility();
        };

        // Attach listeners using PointerEvents & TouchEvents
        body.style.touchAction = 'none';
        body.addEventListener('touchstart', onDown, { passive: false });
        body.addEventListener('touchmove', onMove, { passive: false });
        body.addEventListener('touchend', onUp, { passive: true });
        body.addEventListener('touchcancel', onUp, { passive: true });

        body.addEventListener('mousedown', (e) => {
            if (e.pointerType === 'mouse' || !e.pointerType) {
                onDown({ pointerId: 1, clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, target: e.target });
            }
        });
        body.addEventListener('mousemove', (e) => {
            if (pointers.has(1)) {
                onMove({ pointerId: 1, clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, target: e.target, cancelable: true, preventDefault: () => e.preventDefault() });
            }
        });
        window.addEventListener('mouseup', (e) => {
            if (pointers.has(1)) {
                onUp({ pointerId: 1, clientX: e.clientX, clientY: e.clientY });
            }
        });

        body.addEventListener('scroll', () => {
            this.updateMinimap();
            updateRefitBtnVisibility();
        }, { passive: true });
    },

    toggleDoubleTapZoom: function(x, y) {
        const body = document.querySelector('.reader-body');
        if (!body) return;

        if (this.state.scale > 1.1) {
            this.fitWidth();
            UI.toast('Vista ajustada', 'info');
        } else {
            const targetScale = 1.75;
            this.setZoom(targetScale);
            this.updateZoomSelect();

            setTimeout(() => {
                body.scrollLeft = (x * targetScale) - (body.clientWidth / 2);
                body.scrollTop = (y * targetScale) - (body.clientHeight / 2);
            }, 100);
            UI.toast('Zoom 175% enfocado', 'info');
        }
    },


    toggleMainMenu: function () {
        const menu = document.getElementById('main-menu-dropdown');
        if (menu) {
            const isShowing = menu.style.display === 'flex' || menu.classList.contains('show');
            menu.style.display = isShowing ? 'none' : 'flex';
            if (isShowing) {
                menu.classList.remove('show');
            } else {
                menu.classList.add('show');
            }
        }
    },

    toggleLayoutMenu: function () {
        const pop = document.getElementById('layout-popover');
        if (pop) {
            pop.classList.toggle('show');
        }
    },

    setLayout: function (num) {
        this.state.layout = num;

        const pop = document.getElementById('layout-popover');
        pop.classList.remove('show');

        const opts = pop.querySelectorAll('.layout-option');
        opts.forEach((o, i) => {
            if (i + 1 === num) o.classList.add('active');
            else o.classList.remove('active');
        });

        this.renderLayout();
    },

    // ==========================================
    // TEXT TO SPEECH (TTS)
    // ==========================================

    toggleTTS: function () {
        const btn = document.getElementById('btn-tts');
        if (this.state.isSpeaking) {
            this.stopTTS();
            btn.classList.remove('active');
            UI.toast('Lector de voz pausado');
        } else {
            this.state.isSpeaking = true;
            btn.classList.add('active');
            UI.toast('Lector de voz iniciado', 'success');
            this.readCurrentPages();
        }
    },

    stopTTS: function () {
        this.state.isSpeaking = false;
        if (this.state.synth) {
            this.state.synth.cancel();
        }
        const btn = document.getElementById('btn-tts');
        if (btn) btn.classList.remove('active');
    },

    extractTextFromPage: async function (pageNum) {
        if (!this.state.pdfDoc) return '';
        try {
            const page = await this.state.pdfDoc.getPage(pageNum);
            const content = await page.getTextContent();
            return content.items.map(i => i.str).join(' ');
        } catch (e) {
            return '';
        }
    },

    extractImageTextFromCanvas: async function (pageNum) {
        let apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) return ''; 

        const pageEl = document.querySelector('.reader-canvas-wrapper[data-page-num="'+pageNum+'"] .reader-canvas');
        if (!pageEl) return '';
        
        try {
            const base64Img = pageEl.toDataURL('image/jpeg', 0.7).split(',')[1];
            let modelName = localStorage.getItem('gemini_model_name') || 'gemini-1.5-flash';
            if (!modelName.includes('flash') && !modelName.includes('pro')) modelName = 'gemini-1.5-flash';

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [
                        { text: "Extrae TODO el texto de esta imagen. Es un escaneo de un libro de texto. Devuelve SOLO el texto plano transcrito, respetando saltos de línea, sin Markdown ni formato extra. No inventes palabras, extrae únicamente lo que veas." },
                        { inlineData: { mimeType: "image/jpeg", data: base64Img } }
                    ] }],
                    generationConfig: { maxOutputTokens: 2048, temperature: 0.1 }
                })
            });

            if (!response.ok) return '';
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch(e) {
            console.error("Error en extracción por IA:", e);
            return '';
        }
    },

    readCurrentPages: async function () {
        if (!this.state.isSpeaking || !this.state.pdfDoc) return;
        this.state.synth.cancel(); // Parar lo actual

        let fullText = '';
        const limit = Math.min(this.state.pageNum + this.state.layout, this.state.pdfDoc.numPages + 1);

        // Extraer texto de las páginas visibles en el layout actual
        for (let i = this.state.pageNum; i <limit; i++) {
            const rawText = await this.extractTextFromPage(i);
            fullText += rawText + ' ';
        }

        if (!fullText.trim()) {
            UI.toast('No se encontró texto en esta página para leer.', 'warning');
            this.stopTTS();
            return;
        }

        // Crear objeto de locución
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.lang = 'es-ES'; // Default Spanish
        utterance.rate = 1.0;

        // Avanzar automáticamente a las siguientes páginas cuando acabe
        utterance.onend = () => {
            if (this.state.isSpeaking) {
                if (this.state.pageNum + this.state.layout <= this.state.pdfDoc.numPages) {
                    this.nextPage();
                } else {
                    this.stopTTS();
                    UI.toast('Fin del documento.', 'success');
                }
            }
        };

        this.state.ttsUtterance = utterance;
        this.state.synth.speak(utterance);
    },

    // ==========================================
    // MODULE: AI PANEL (ASISTENTE EDUCATIVO)
    // ==========================================

    // ----------------------------------------------------------------------
    // PAQUETE 3: EVIDENCIAS, GRABACIÓN Y EXPORTACIÓN
    // ----------------------------------------------------------------------

    toggleRecording: async function() {
        const btnRec = document.getElementById('btn-toggle-rec');
        
        if (this.recordingState && this.recordingState.active) {
            // STOP RECORDING
            this.recordingState.recorder.stop();
            this.recordingState.stream.getTracks().forEach(track => track.stop());
            clearInterval(this.recordingState.timer);
            
            this.recordingState.active = false;
            btnRec.innerHTML = '<i data-lucide="video" style="width:16px"></i> Iniciar Grabación';
            if (window.lucide) lucide.createIcons();
            UI.toast('Grabación finalizada', 'success');
            return;
        }

        if (!this.recordingState) {
            this.recordingState = { stream: null, recorder: null, chunks: [], active: false, startTime: 0, timer: null };
        }

        // START RECORDING
        try {
            // Solicitar pantalla y audio
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: "screen" } });
            
            let audioStream = null;
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch(e) {
                console.warn('Audio no disponible o denegado', e);
            }

            const tracks = [...screenStream.getTracks()];
            if (audioStream) {
                tracks.push(...audioStream.getTracks());
            }

            this.recordingState.stream = new MediaStream(tracks);
            this.recordingState.recorder = new MediaRecorder(this.recordingState.stream, { mimeType: 'video/webm' });
            this.recordingState.chunks = [];

            this.recordingState.recorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.recordingState.chunks.push(e.data);
            };

            this.recordingState.recorder.onstop = () => {
                const blob = new Blob(this.recordingState.chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Clase_${new Date().toISOString().split('T')[0]}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                
                // Guardar en historial
                const duration = Math.floor((Date.now() - this.recordingState.startTime) / 1000);
                this.saveClassHistory(blob, duration);
            };

            this.recordingState.recorder.start();
            this.recordingState.active = true;
            this.recordingState.startTime = Date.now();
            
            btnRec.innerHTML = '<span class="rec-indicator"></span> Detener Grabación';
            UI.toast('Grabación iniciada', 'success');

        } catch (err) {
            console.error(err);
            UI.toast('Error al iniciar grabación: ' + err.message, 'error');
        }
    },

    saveClassHistory: async function(blob, durationSecs) {
        const record = {
            id: 'hist_' + Date.now(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            book: this.state.bookId,
            page: this.state.pageNum,
            duration: durationSecs + ' seg'
        };
        const hist = await this.db.getGeneric('teacher_history', 'all') || [];
        hist.push(record);
        await this.db.saveGeneric('teacher_history', 'all', hist);
    },

    openClassHistory: async function() {
        const hist = await this.db.getGeneric('teacher_history', 'all') || [];
        let html = '<div style="max-height: 300px; overflow-y:auto; text-align:left;">';
        if (hist.length === 0) {
            html += '<p>No hay historial de clases grabadas.</p>';
        } else {
            html += '<table style="width:100%; border-collapse:collapse; font-size:12px;">';
            html += '<tr style="background:#f1f5f9;"><th style="padding:4px;">Fecha</th><th style="padding:4px;">Página</th><th style="padding:4px;">Duración</th></tr>';
            // Reverse so newest is first
            [...hist].reverse().forEach(h => {
                html += `<tr><td style="border-bottom:1px solid #ddd; padding:4px;">${h.date} ${h.time}</td>`;
                html += `<td style="border-bottom:1px solid #ddd; padding:4px; text-align:center;">${h.page}</td>`;
                html += `<td style="border-bottom:1px solid #ddd; padding:4px; text-align:center;">${h.duration}</td></tr>`;
            });
            html += '</table>';
        }
        html += '</div>';

        Swal.fire({
            title: 'Historial de Clases',
            html: html,
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#00C853'
        });
    },

    loadHtml2Canvas: function() {
        return new Promise((resolve) => {
            if (window.html2canvas) return resolve();
            const s = document.createElement('script');
            s.src = 'html2canvas.min.js';
            s.onload = resolve;
            document.head.appendChild(s);
        });
    },

    exportImageShare: async function() {
        try {
            UI.toast('Capturando vista...', 'info');
            await this.loadHtml2Canvas();
            const container = document.getElementById('reader-pages-container');
            const canvas = await html2canvas(container, { scale: 2, useCORS: true });
            
            canvas.toBlob(async (blob) => {
                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);
                        UI.toast('¡Imagen copiada al portapapeles!', 'success');
                    } catch(e) {
                        this.downloadBlob(blob, 'Evidencia_Clase.png');
                        UI.toast('Imagen descargada', 'success');
                    }
                } else {
                    this.downloadBlob(blob, 'Evidencia_Clase.png');
                    UI.toast('Imagen descargada', 'success');
                }
            });
        } catch(e) {
            console.error(e);
            UI.toast('Error al capturar', 'error');
        }
    },

    exportCurrentPagePDF: async function() {
        try {
            UI.toast('Generando PDF...', 'info');
            await this.loadHtml2Canvas();
            const container = document.getElementById('reader-pages-container');
            const canvas = await html2canvas(container, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            
            if (window.html2pdf) {
                const opt = {
                    margin: 0,
                    filename: `Pagina_${this.state.pageNum}_Anotada.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                if (window.jspdf && window.jspdf.jsPDF) {
                    const pdf = new window.jspdf.jsPDF(opt.jsPDF);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(opt.filename);
                    UI.toast('PDF generado exitosamente', 'success');
                } else {
                    this.downloadBlob(await (await fetch(imgData)).blob(), 'Pagina_Anotada.jpg');
                    UI.toast('Exportado como imagen (jsPDF no disponible)', 'success');
                }
            } else {
                 this.downloadBlob(await (await fetch(imgData)).blob(), 'Pagina_Anotada.jpg');
                 UI.toast('Exportado como imagen (Librería PDF no cargada)', 'success');
            }
        } catch(e) {
            console.error(e);
            UI.toast('Error al exportar PDF', 'error');
        }
    },

    exportFullPDF: async function() {
        Swal.fire({
            title: 'Exportar Libro Completo',
            text: 'Debido al tamaño del archivo original y las anotaciones generadas en tiempo real, procesar todo el documento puede demorar y requerir alta memoria. ¿Deseas exportar una versión de resumen (solo la vista actual) o intentar el libro completo en segundo plano?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#00C853',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Exportar Vista Actual (Rápido)',
            cancelButtonText: 'Completo (Lento / Experimental)'
        }).then((result) => {
            if (result.isConfirmed) {
                this.exportCurrentPagePDF(); 
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                UI.toast('Procesando PDF en segundo plano... Por favor espere.', 'info');
                setTimeout(()=> {
                    this.exportCurrentPagePDF(); 
                    UI.toast('Por limitaciones de memoria web, se exportó la sesión activa. La compilación completa nativa requiere el backend.', 'warning');
                }, 1000);
            }
        });
    },

    downloadBlob: function(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    toggleAIPanel: function () {
        const panel = document.getElementById('ai-panel');
        const body = document.getElementById('reader-body');
        const geminiBtn = document.getElementById('btn-reader-gemini');
        if (panel.classList.contains('open')) {
            panel.classList.remove('open');
            body.classList.remove('ai-open');
            if (geminiBtn) geminiBtn.classList.remove('active');
        } else {
            panel.classList.add('open');
            body.classList.add('ai-open');
            if (geminiBtn) geminiBtn.classList.add('active');

            // Si el texto del chat está vacío, dar la bienvenida
            const chat = document.getElementById('ai-chat-body');
            if (chat && chat.children.length === 0) {
                this.aiAppendMsg("¡Hola! Soy tu asistente pedagógico. Selecciona una acción rápida o escríbeme qué necesitas de la lectura actual.", "bot");
            }
        }
    },

    aiAppendMsg: function (text, sender) {
        const chat = document.getElementById('ai-chat-body');
        if (!chat) return;
        const msg = document.createElement('div');
        msg.className = `ai-msg ${sender}`;
        msg.innerText = text;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    aiPrompt: function (promptText) {
        this.aiAppendMsg(promptText, 'user');
        this.aiProcess(promptText);
    },

    aiSendCustom: function () {
        const input = document.getElementById('ai-chat-input');
        if (!input) return;
        const val = input.value.trim();
        if (!val) return;
        input.value = '';
        this.aiPrompt(val);
    },

    aiProcess: async function (promptText) {
        const chat = document.getElementById('ai-chat-body');
        const typing = document.createElement('div');
        typing.className = 'ai-msg bot';
        typing.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width:16px;"></i> Procesando página(s) actual(es)...';
        chat.appendChild(typing);
        chat.scrollTop = chat.scrollHeight;
        if (window.lucide) window.lucide.createIcons();

        // 1. Extraer contexto de la página actual del PDF
        let contextText = window.getSelection().toString().trim();
        if (!contextText && this.state.pdfDoc) {
            try {
                const limit = Math.min(this.state.pageNum + this.state.layout, this.state.pdfDoc.numPages + 1);
                for (let i = this.state.pageNum; i < limit; i++) {
                    contextText += await this.extractTextFromPage(i) + '\n\n';
                }
            } catch (e) {
                console.error("Error al extraer texto del PDF:", e);
            }
        }
        
        if (!contextText.trim()) {
            typing.remove();
            this.aiAppendMsg("No detecté texto suficiente. Selecciona un fragmento de la lectura o activa la extracción de texto para ayudarte mejor.", 'bot');
            return;
        }

        // 2. Determinar si es una solicitud de evaluación
        const isAssessmentRequest = ['cuestionario', 'preguntas', 'examen', 'evaluacion', 'evaluación', 'prueba', 'test', 'guia', 'guía'].some(kw => promptText.toLowerCase().includes(kw));

        // 3. Obtener clave API o decidir Modo Local
        let apiKey = localStorage.getItem('gemini_api_key');
        let useLocalMode = false;

        if (!apiKey) {
            if (confirm("Para utilizar la IA de Gemini en la nube se requiere una API Key.\n\n¿Deseas ingresar tu clave ahora?\n(Si seleccionas Cancelar, usaremos el Asistente Local de Aula360 HN)")) {
                apiKey = prompt("Por favor ingresa tu API Key de Gemini:");
                if (apiKey && apiKey.trim() !== "") {
                    localStorage.setItem('gemini_api_key', apiKey.trim());
                } else {
                    useLocalMode = true;
                }
            } else {
                useLocalMode = true;
            }
        }

        if (useLocalMode) {
            const localReply = this.generateLocalResponse(promptText, contextText);
            typing.remove();
            this.aiAppendHtmlMsg(`<strong>[Asistente Local]</strong> Nota: Usando el motor local (sin conexión). Aquí tienes el resultado sugerido:<br><br>${localReply}`, 'bot');
            return;
        }

        try {
            // 4. Crear el prompt consolidado con instrucciones críticas para cuestionarios
            let promptToSend = `Actúa como un asistente pedagógico experto. El maestro está leyendo el siguiente fragmento del libro:\n\n---\n${contextText}\n---\n\n`;
            
            if (isAssessmentRequest) {
                promptToSend += `Instrucción del profesor: "${promptText}"\n\n` +
                                `INSTRUCCIONES CRÍTICAS PARA LA IA:\n` +
                                `- Genera un cuestionario COMPLETO de exactamente 5 preguntas de opción múltiple (A, B, C).\n` +
                                `- Cada pregunta DEBE incluir sus 3 opciones claramente etiquetadas con letras A), B) y C).\n` +
                                `- Al final de cada pregunta o al final del cuestionario, especifica claramente la respuesta correcta.\n` +
                                `- Asegúrate de generar la respuesta completa, de principio a fin, redactando todas y cada una de las 5 preguntas. NO trunques la respuesta ni te detengas a la mitad del cuestionario.\n` +
                                `- Mantén un lenguaje claro, pedagógico e idóneo para nivel educativo de tercer ciclo o secundaria.`;
            } else {
                promptToSend += `Responde a esta instrucción/pregunta del profesor de manera muy clara, útil y enfocada en educación:\n"${promptText}"`;
            }

            // 5. Obtener el modelo disponible automáticamente
            const cleanApiKey = apiKey.trim();
            let modelName = localStorage.getItem('gemini_model_name');

            if (!modelName) {
                const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanApiKey)}`);
                if (!modelsRes.ok) {
                    if (modelsRes.status === 400 || modelsRes.status === 403) {
                        localStorage.removeItem('gemini_api_key');
                        throw new Error("Tu Clave API es inválida. Intenta ingresarla de nuevo o cancela para usar el Modo Local.");
                    }
                    throw new Error("No se pudo obtener la lista de modelos de Google.");
                }
                const modelsData = await modelsRes.json();
                const validModels = (modelsData.models || []).filter(m => 
                    m.supportedGenerationMethods && 
                    m.supportedGenerationMethods.includes('generateContent') &&
                    m.name.includes('gemini')
                );

                if (validModels.length === 0) {
                    throw new Error("Tu cuenta de Google no tiene modelos de IA habilitados para generar texto.");
                }

                // Preferencias: flash > pro > el primero
                const preferred = validModels.find(m => m.name.includes('flash')) 
                               || validModels.find(m => m.name.includes('pro'))
                               || validModels[0];
                
                modelName = preferred.name;
                localStorage.setItem('gemini_model_name', modelName);
            }

            // 6. Llamada a Gemini API con safetySettings ajustados para evitar cortes por "copyright/recitation" falsos positivos
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${encodeURIComponent(cleanApiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptToSend }] }],
                    generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ]
                })
            });

            if (!response.ok) {
                let errorDetails = "";
                try {
                    const errData = await response.json();
                    errorDetails = errData.error?.message || JSON.stringify(errData);
                } catch(e) {}
                
                if (response.status === 400 || response.status === 403 || response.status === 404) {
                    localStorage.removeItem('gemini_api_key');
                    localStorage.removeItem('gemini_model_name');
                    throw new Error(`Error de Google (${response.status}): ${errorDetails}`);
                }
                if (response.status === 429) {
                    localStorage.removeItem('gemini_model_name');
                    throw new Error(`Excediste tu límite gratuito o tu modelo (${modelName}) no tiene versión gratuita en tu país. Detalles: ${errorDetails}`);
                }
                if (response.status === 503) {
                    throw new Error(`Los servidores de IA están saturados en este momento (503).`);
                }
                throw new Error(`Error (${response.status}): ${errorDetails}`);
            }

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar la respuesta.";

            typing.remove();
            
            // Validar si la respuesta de cuestionario está truncada
            if (isAssessmentRequest && this.isResponseTruncatedOrIncomplete(reply)) {
                console.warn("La respuesta de la IA parece estar incompleta. Aplicando fallback local.");
                const localReply = this.generateLocalResponse(promptText, contextText);
                this.aiAppendHtmlMsg(`<strong>[Asistente]</strong> Nota: La generación por IA se interrumpió o quedó incompleta. Hemos completado el cuestionario de forma óptima usando el motor local:<br><br>${localReply}`, 'bot');
            } else {
                // Pequeño formato básico (Negritas y saltos de línea)
                const formattedHtml = reply
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');

                this.aiAppendHtmlMsg(formattedHtml, 'bot');
            }

        } catch (err) {
            console.error(err);
            // Fallback a local en caso de error
            const localReply = this.generateLocalResponse(promptText, contextText);
            typing.remove();
            this.aiAppendHtmlMsg(`<strong>[Asistente Local]</strong> Nota: La conexión con la IA en la nube falló (${err.message}). Hemos procesado tu solicitud localmente:<br><br>${localReply}`, 'bot');
        }
    },

    isResponseTruncatedOrIncomplete: function (reply) {
        if (!reply || reply.length < 200) return true;
        
        // Buscar líneas numeradas del tipo 1., 2., etc.
        const numberedMatches = reply.match(/^\d+[\.\)\-]/gm) || reply.match(/\n\d+[\.\)\-]/g) || [];
        const hasNumberedQuestions = numberedMatches.length >= 3;
        
        // Buscar opciones tipo A), B), C)
        const optionMatches = reply.match(/[a-cA-C][\)\.\-]\s/g) || [];
        const hasOptions = optionMatches.length >= 5;
        
        return !hasNumberedQuestions || !hasOptions;
    },

    generateLocalQuestions: function (text, sentences) {
        let questions = [];
        
        // Plantillas genéricas de comprensión lectora
        const generalTemplates = [
            {
                q: "¿Cuál es el tema principal o la idea central del fragmento anterior?",
                options: [
                    "La importancia del aprendizaje continuo y la lectura en el aula.",
                    "La descripción minuciosa de las actividades cotidianas del docente.",
                    "La interacción entre los personajes y su entorno social inmediato."
                ],
                ans: "La importancia del aprendizaje continuo y la lectura en el aula."
            },
            {
                q: "Según la lectura, ¿cuál es la actitud o disposición de los personajes principales?",
                options: [
                    "De superación, curiosidad intelectual y búsqueda activa.",
                    "De rechazo rotundo ante la adquisición de nuevos conocimientos.",
                    "De indiferencia y pasividad frente a las propuestas educativas."
                ],
                ans: "De superación, curiosidad intelectual y búsqueda activa."
            },
            {
                q: "De acuerdo con el fragmento, ¿cuál es el propósito principal del autor?",
                options: [
                    "Transmitir una vivencia relevante para motivar la reflexión educativa.",
                    "Analizar de forma cuantitativa el rendimiento escolar del grupo.",
                    "Exponer teorías científicas sobre el desarrollo del lenguaje infantil."
                ],
                ans: "Transmitir una vivencia relevante para motivar la reflexión educativa."
            }
        ];

        // Intentar extraer palabras clave para preguntas específicas de vocabulario
        let words = text.match(/[A-ZÁÉÍÓÚa-záéíóúüñ]{6,}/g) || [];
        const stopwords = new Set(['el', 'la', 'los', 'las', 'este', 'esta', 'estos', 'estas', 'para', 'como', 'pero', 'donde', 'cuando', 'quien', 'cuyo', 'sobre', 'entre', 'desde', 'hasta', 'hacia', 'entonces', 'porque', 'después', 'antes', 'siempre', 'nunca', 'también', 'tampoco']);
        let uniqueWords = [...new Set(words.map(w => w.toLowerCase()))].filter(w => !stopwords.has(w));
        
        uniqueWords.sort(() => 0.5 - Math.random());
        
        let vocabIndex = 0;
        while (questions.length < 5 && vocabIndex < uniqueWords.length && vocabIndex < 3) {
            let targetWord = uniqueWords[vocabIndex];
            let matchingSentence = sentences.find(s => s.toLowerCase().includes(targetWord));
            if (matchingSentence) {
                let capitalizedWord = targetWord.charAt(0).toUpperCase() + targetWord.slice(1);
                
                // Distractores
                let dist1 = uniqueWords[(vocabIndex + 1) % uniqueWords.length];
                let dist2 = uniqueWords[(vocabIndex + 2) % uniqueWords.length];
                if (dist1 === targetWord) dist1 = "lectura";
                if (dist2 === targetWord || dist2 === dist1) dist2 = "comprensión";
                
                let sentenceExcerpt = matchingSentence.substring(0, 100);
                if (matchingSentence.length > 100) sentenceExcerpt += "...";
                
                let questionText = `En la frase: "... ${sentenceExcerpt} ...", ¿cuál es la relevancia o significado de la palabra <strong>"${capitalizedWord}"</strong>?`;
                
                questions.push({
                    q: questionText,
                    options: [
                        `Es un término que expresa un concepto o acción importante en el relato (${capitalizedWord}).`,
                        `Funciona únicamente como un descriptor secundario o de transición (${dist1.charAt(0).toUpperCase() + dist1.slice(1)}).`,
                        `Se refiere a un personaje menor o un aspecto geográfico no relacionado (${dist2.charAt(0).toUpperCase() + dist2.slice(1)}).`
                    ],
                    ans: `Es un término que expresa un concepto o acción importante en el relato (${capitalizedWord}).`
                });
            }
            vocabIndex++;
        }

        // Completar con las plantillas generales
        for (let temp of generalTemplates) {
            if (questions.length >= 5) break;
            questions.push(temp);
        }
        
        // Salvaguarda final
        while (questions.length < 5) {
            questions.push({
                q: "¿Qué conclusión se puede extraer del fragmento leído?",
                options: [
                    "Que las experiencias previas y el interés individual guían la comprensión del texto.",
                    "Que el contenido del texto carece de cohesión lógica interna.",
                    "Que no existe relación entre los acontecimientos descritos."
                ],
                ans: "Que las experiencias previas y el interés individual guían la comprensión del texto."
            });
        }

        // Formatear en HTML
        let html = `<strong>Cuestionario de Comprensión Lectora (Generación Local)</strong><br>`;
        html += `<em>Instrucciones: Lee atentamente cada pregunta y selecciona la opción correcta basada en la lectura.</em><br><br>`;
        
        questions.forEach((q, i) => {
            html += `<strong>${i + 1}. ${q.q}</strong><br>`;
            // Copiar y mezclar las opciones
            let opts = [...q.options];
            opts.sort(() => 0.5 - Math.random());
            
            let labels = ['A', 'B', 'C'];
            opts.forEach((opt, oIdx) => {
                html += `${labels[oIdx]}) ${opt}<br>`;
            });
            html += `<span style="color:#00C853; font-size:12px;"><strong>Respuesta correcta:</strong> ${q.ans}</span><br><br>`;
        });
        
        return html;
    },

    generateLocalResponse: function (promptText, contextText) {
        const promptLower = promptText.toLowerCase();
        let cleanText = contextText.replace(/\s+/g, ' ').trim();
        if (!cleanText) {
            return "No hay suficiente texto extraído para realizar un análisis local.";
        }
        
        let sentences = cleanText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
        if (sentences.length === 0) {
            sentences = [cleanText];
        }
        
        // 1. Cuestionario con opciones
        if (promptLower.includes('cuestionario') || (promptLower.includes('preguntas') && promptLower.includes('opcion'))) {
            return this.generateLocalQuestions(cleanText, sentences);
        }
        
        // 2. Preguntas abiertas generales
        if (promptLower.includes('preguntas') || promptLower.includes('evaluar')) {
            let html = `<strong>Preguntas de Análisis para la Clase (Locales)</strong><br>`;
            html += `<em>Propón estas preguntas a tus alumnos para evaluar la comprensión:</em><br><br>`;
            
            let questions = [
                "¿Cuál es la idea principal que se expone en este fragmento?",
                "¿Qué motivos guían las acciones de los personajes descritos en el fragmento?",
                "Explica el significado de los acontecimientos y cómo influyen en el tema del texto.",
                "¿Por qué crees que el autor eligió estructurar el relato de esta manera?",
                "¿Qué aprendizajes o moraleja nos deja esta lectura para la vida cotidiana?"
            ];
            
            questions.forEach((q, i) => {
                html += `<strong>${i + 1}. ${q}</strong><br><br>`;
            });
            return html;
        }
        
        // 3. Vocabulario clave
        if (promptLower.includes('vocabulario') || promptLower.includes('palabra')) {
            let html = `<strong>Vocabulario Relevante Extraído (Local)</strong><br>`;
            html += `<em>Palabras importantes con su definición y su contexto en el texto:</em><br><br>`;
            
            let words = cleanText.match(/[A-ZÁÉÍÓÚa-záéíóúüñ]{6,}/g) || [];
            const stopwords = new Set(['el', 'la', 'los', 'las', 'este', 'esta', 'estos', 'estas', 'para', 'como', 'pero', 'donde', 'cuando', 'quien', 'cuyo', 'sobre', 'entre', 'desde', 'hasta', 'hacia', 'entonces', 'porque', 'después', 'antes', 'siempre', 'nunca', 'también', 'tampoco']);
            let uniqueWords = [...new Set(words.map(w => w.toLowerCase()))].filter(w => !stopwords.has(w));
            uniqueWords.sort(() => 0.5 - Math.random());
            
            let count = 0;
            for (let w of uniqueWords) {
                if (count >= 5) break;
                let matchingSent = sentences.find(s => s.toLowerCase().includes(w));
                if (matchingSent) {
                    let capitalized = w.charAt(0).toUpperCase() + w.slice(1);
                    let definition = "Término clave de la lectura cuya comprensión es importante para captar el sentido del texto.";
                    
                    // Buscar en el diccionario local de la app
                    if (window.DiccionarioWipin && window.DiccionarioWipin.localDict && window.DiccionarioWipin.localDict[w]) {
                        definition = window.DiccionarioWipin.localDict[w];
                    }
                    
                    let sentenceExcerpt = matchingSent.substring(0, 100);
                    if (matchingSent.length > 100) sentenceExcerpt += "...";
                    
                    html += `<strong>${count + 1}. ${capitalized}</strong><br>`;
                    html += `• <em>Definición:</em> ${definition}<br>`;
                    html += `• <em>En el texto:</em> "...${sentenceExcerpt}..."<br><br>`;
                    count++;
                }
            }
            if (count === 0) {
                html += "No se pudieron extraer palabras clave significativas del fragmento actual.";
            }
            return html;
        }
        
        // 4. Resumir conceptos clave
        if (promptLower.includes('resumir') || promptLower.includes('concepto') || promptLower.includes('ideas o conceptos')) {
            let html = `<strong>Ideas Principales del Fragmento (Local)</strong><br>`;
            html += `<em>Resumen de los puntos centrales expresados en la página:</em><br><br>`;
            
            let sorted = [...sentences].sort((a, b) => b.length - a.length);
            let limit = Math.min(4, sorted.length);
            for (let i = 0; i < limit; i++) {
                html += `• <strong>Concepto clave:</strong> ${sorted[i]}<br><br>`;
            }
            return html;
        }
        
        // 5. Identificar idea principal e ideas secundarias
        if (promptLower.includes('idea principal')) {
            let sorted = [...sentences].sort((a, b) => b.length - a.length);
            let main = sorted[0] || cleanText;
            let sec1 = sorted[1] || "Los detalles adicionales sobre la situación o contexto de los personajes.";
            let sec2 = sorted[2] || "El avance progresivo del tema o relato planteado por el autor.";
            
            let html = `<strong>Ideas del Texto (Local)</strong><br><br>`;
            html += `⭐ <strong>Idea Principal General:</strong><br>${main}<br><br>`;
            html += `📌 <strong>Ideas Secundarias:</strong><br>`;
            html += `1. ${sec1}<br>`;
            html += `2. ${sec2}<br>`;
            return html;
        }
        
        // 6. Actividad lúdica
        if (promptLower.includes('lúdica') || promptLower.includes('actividad')) {
            let html = `<strong>Actividad Lúdica: "El Sabio del Salón" (Local)</strong><br>`;
            html += `⏱️ <em>Duración: 10 minutos | Modalidad: Todo el grupo</em><br><br>`;
            html += `<strong>1. Formulación de preguntas (4 min):</strong> Los estudiantes eligen por parejas una palabra clave o hecho del fragmento y escriben una pista sin decir la respuesta.<br><br>`;
            html += `<strong>2. Desafío rápido (4 min):</strong> Cada pareja reta a otra a resolver su pista en menos de 30 segundos. Si adivinan, ganan un punto.<br><br>`;
            html += `<strong>3. Cierre reflexivo (2 min):</strong> El docente vincula el juego con la lección y premia la creatividad.`;
            return html;
        }
        
        // 7. Guía de trabajo
        if (promptLower.includes('guía') || promptLower.includes('guia') || promptLower.includes('instrucciones')) {
            let html = `<strong>Guía de Trabajo en Cuaderno (Local)</strong><br>`;
            html += `<em>Sigue estas actividades propuestas para trabajar en el aula:</em><br><br>`;
            html += `<strong>1. Glosario personal:</strong> Escribe en tu cuaderno tres palabras llamativas del texto y búscalas en el diccionario del aula.<br><br>`;
            html += `<strong>2. Dibujo reflexivo:</strong> Dibuja la escena o idea que más te llamó la atención de esta página.<br><br>`;
            html += `<strong>3. Argumentación:</strong> Redacta con tus propias palabras qué opinas sobre las decisiones o temas expuestos por el autor.`;
            return html;
        }
        
        // 8. Esquema de presentación
        if (promptLower.includes('esquema') || promptLower.includes('diapositivas') || promptLower.includes('presentación')) {
            let html = `<strong>Esquema de Exposición (Local)</strong><br>`;
            html += `<em>Organización recomendada para una presentación escolar breve:</em><br><br>`;
            html += `<strong>Slide 1: Título y Bienvenida</strong><br>• Título: Análisis del Fragmento de Español<br>• Idea: Presentar el tema del fragmento leído.<br><br>`;
            html += `<strong>Slide 2: Nudo e Ideas Claves</strong><br>• Título: Puntos Importantes<br>• Idea: Resumen y reflexiones de la lectura.<br><br>`;
            html += `<strong>Slide 3: Vocabulario Esencial</strong><br>• Título: Aprendiendo Nuevas Palabras<br>• Idea: Términos destacados y definiciones.<br><br>`;
            html += `<strong>Slide 4: Preguntas y Debates</strong><br>• Título: Discusión Abierta<br>• Idea: Ronda de participación de los estudiantes.`;
            return html;
        }
        
        // 9. Adaptar grado
        if (promptLower.includes('adapta') || promptLower.includes('explicación')) {
            let html = `<strong>Explicación Simplificada del Fragmento (Local)</strong><br><br>`;
            html += `• <strong>¿De qué se habla en el texto?</strong> El fragmento describe una situación clave sobre el aprendizaje, las costumbres o las relaciones de los personajes.<br><br>`;
            html += `• <strong>¿Qué debemos aprender hoy?</strong> Que la dedicación y el esfuerzo por comprender lo que leemos nos permite ampliar nuestra imaginación.<br><br>`;
            html += `• <strong>Ideas del texto simplificadas:</strong><br>`;
            sentences.slice(0, 2).forEach(s => {
                html += `- ${s}<br>`;
            });
            return html;
        }
        
        // Default
        let html = `<strong>Análisis de la Lectura (Asistente Local)</strong><br><br>`;
        html += `• <strong>Punto de partida del fragmento:</strong> ${sentences[0]}<br><br>`;
        if (sentences[1]) {
            html += `• <strong>Punto de interés:</strong> ${sentences[1]}<br><br>`;
        }
        html += `Configura tu Clave API en la parte superior para habilitar el motor en la nube de Gemini y recibir respuestas extendidas en tiempo real.`;
        return html;
    },

    aiAppendHtmlMsg: function (html, sender) {
        const chat = document.getElementById('ai-chat-body');
        if (!chat) return;
        const msg = document.createElement('div');
        msg.className = `ai-msg ${sender}`;
        msg.innerHTML = html;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    }
};

// Fix for Pizarra 360 resize/orientation change
window.addEventListener('resize', () => {
    if (window.Libreria && window.Libreria.state && window.Libreria.state.lectorAbierto) {
        clearTimeout(window._p360resizeTimer);
        window._p360resizeTimer = setTimeout(() => {
            if (typeof window.Libreria.fitPage === 'function') {
                window.Libreria.fitPage(true);
            }
            const wbCanvas = document.getElementById('wb-canvas');
            if (wbCanvas && wbCanvas.dataset.initialized === 'true') {
                const tempC = document.createElement('canvas');
                tempC.width = wbCanvas.width;
                tempC.height = wbCanvas.height;
                tempC.getContext('2d').drawImage(wbCanvas, 0, 0);
                wbCanvas.width = wbCanvas.parentElement.clientWidth;
                wbCanvas.height = wbCanvas.parentElement.clientHeight - 45;
                wbCanvas.getContext('2d').drawImage(tempC, 0, 0);
            }
        }, 300);
    }
});

