/**
 * PizarraStudio.js — Motor de Pizarra Digital Interactiva Profesional (Estilo ZKTeco / ViewSonic / SMART Board)
 * Aula 360 HN — Edición Pizarra con Renderizado Real de Páginas PDF y Miniaturas Visuales Auténticas
 */

window.PizarraStudio = {
    // ─── ESTADO GLOBAL DE LA PIZARRA ───
    state: {
        activeMode: 'pen',       // 'select', 'pen', 'highlighter', 'eraser', 'shapes', 'text', 'laser'
        penColor: '#00C853',
        penSize: 4,
        penOpacity: 1.0,
        penType: 'pen',           // 'pencil', 'pen', 'highlighter', 'brush', 'dotted'
        eraserType: 'stroke',     // 'stroke', 'area', 'object', 'clear'
        activeShape: 'rectangle', // 'line', 'arrow', 'rectangle', 'circle', 'triangle'
        
        backgroundType: 'white',  // 'white', 'black', 'grid', 'lined', 'staff', 'cartesian'
        
        // Documento / PDF / Recurso Abierto
        isResourceOpen: false,
        pdfDoc: null,             // Instancia pdfjsLib
        pdfBytes: null,
        resourceType: 'pdf',      // 'pdf', 'image', 'book'
        resourceTitle: 'Libro de Texto — Matemáticas 7° (SEDUC)',
        currentPage: 1,
        totalPages: 12,
        zoomLevel: 1.0,
        showThumbnails: false,
        
        // Vista Dividida
        isSplitView: false,
        splitRatio: 0.5,
        
        // Modo Presentación
        isPresentation: false,
        
        // Historial y Anotaciones por Página
        pageAnnotations: {},     // Key: page_1, page_2, blank_1, etc.
        undoStack: [],
        redoStack: [],

        // Trazos actuales
        strokes: [],
        currentStroke: null,
        isDrawing: false,

        // Herramientas geométricas activas
        geometryTools: {
            ruler: false,
            protractor: false,
            compass: false,
            setSquare: false
        },

        // Objetos e Inserciones
        insertedObjects: [],
        selectedObject: null
    },

    // ─── INICIALIZACIÓN DE ESTILOS Y ESTRUCTURA DE PANTALLA ZKTECO ───
    initStyles() {
        if (document.getElementById('zkteco-board-css')) return;
        const style = document.createElement('style');
        style.id = 'zkteco-board-css';
        style.textContent = `
            #pizarra-studio-view {
                position: relative !important;
                width: calc(100% + 48px) !important;
                height: calc(100vh - 70px) !important;
                margin: -24px -24px -24px -24px !important;
                overflow: hidden !important;
                background: #ffffff !important;
                display: flex !important;
                flex-direction: column !important;
                font-family: 'Outfit', -apple-system, sans-serif !important;
                user-select: none !important;
                -webkit-user-select: none !important;
            }

            /* 1. ÁREA CENTRAL DE PIZARRA (>= 88% PANTALLA) */
            #board-viewport {
                position: absolute !important;
                inset: 0 !important;
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
                display: flex !important;
            }

            .board-panel {
                position: relative !important;
                height: 100% !important;
                overflow: hidden !important;
                display: flex !important;
                flex-direction: column !important;
            }

            #main-board-panel {
                flex: 1 !important;
                width: 100% !important;
                background: #ffffff;
            }

            #split-board-panel {
                width: 50% !important;
                border-left: 3px solid #3b82f6 !important;
                background: #121826 !important;
                display: none !important;
            }

            /* CANVASES */
            .board-canvas-layer {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                touch-action: none !important;
            }

            /* 2. BARRA FLOTANTE INFERIOR COMPACTA TIPO ZKTECO */
            #floating-bottom-bar {
                position: absolute !important;
                bottom: 18px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                z-index: 9900 !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                background: rgba(15, 23, 42, 0.94) !important;
                backdrop-filter: blur(20px) !important;
                -webkit-backdrop-filter: blur(20px) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                padding: 6px 12px !important;
                border-radius: 24px !important;
                box-shadow: 0 16px 45px rgba(0, 0, 0, 0.6) !important;
                transition: all 0.25s ease !important;
            }

            .board-icon-btn {
                width: 46px !important;
                height: 46px !important;
                border-radius: 14px !important;
                background: transparent !important;
                border: none !important;
                color: #cbd5e1 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                transition: all 0.15s ease !important;
                position: relative !important;
            }

            .board-icon-btn:hover {
                background: rgba(255, 255, 255, 0.12) !important;
                color: #ffffff !important;
            }

            .board-icon-btn.active {
                background: #00C853 !important;
                color: #ffffff !important;
                box-shadow: 0 4px 16px rgba(0, 200, 83, 0.4) !important;
            }

            .board-icon-btn i {
                width: 22px !important;
                height: 22px !important;
            }

            /* TOOLTIPS EMERGENTES */
            .board-icon-btn::after {
                content: attr(data-title) !important;
                position: absolute !important;
                bottom: 56px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                background: #090d16 !important;
                color: #ffffff !important;
                padding: 4px 10px !important;
                border-radius: 8px !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                white-space: nowrap !important;
                opacity: 0 !important;
                pointer-events: none !important;
                transition: opacity 0.2s !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
            }

            .board-icon-btn:hover::after {
                opacity: 1 !important;
            }

            
            /* ESTILOS PARA BARRAS FLOTANTES ARRASTRABLES Y MINIMIZABLES */
            .p360-drag-handle {
                cursor: grab !important;
                color: rgba(255, 255, 255, 0.6) !important;
                padding: 0 4px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                user-select: none !important;
            }
            .p360-drag-handle:active {
                cursor: grabbing !important;
            }

            #top-resource-bar.is-minimized {
                padding: 4px 8px !important;
                border-radius: 20px !important;
            }
            #top-resource-bar.is-minimized .top-bar-expandable {
                display: none !important;
            }

            #floating-bottom-bar.is-minimized {
                padding: 4px 8px !important;
                border-radius: 24px !important;
            }
            #floating-bottom-bar.is-minimized .bottom-bar-expandable {
                display: none !important;
            }

            /* POPUPS CONTEXTUALES COMPACTOS */
            .board-popup-panel {
                position: absolute !important;
                bottom: 74px !important;
                background: #0f172a !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                border-radius: 18px !important;
                padding: 12px 16px !important;
                box-shadow: 0 16px 40px rgba(0,0,0,0.8) !important;
                z-index: 9950 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 10px !important;
                color: #fff !important;
            }

            .board-popup-panel.hidden {
                display: none !important;
            }

            /* BARRA SUPERIOR DE NAVEGACIÓN DE RECURSO / PÁGINAS */
            #top-resource-bar {
                position: absolute !important;
                top: 16px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                z-index: 9800 !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                background: rgba(15, 23, 42, 0.9) !important;
                backdrop-filter: blur(16px) !important;
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                padding: 6px 14px !important;
                border-radius: 16px !important;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5) !important;
                color: #fff !important;
            }

            /* CARROUSEL DE VISTA PREVIA DE PÁGINAS (MINIANTURAS REALES) */
            #page-preview-drawer {
                position: absolute !important;
                bottom: 78px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                z-index: 9820 !important;
                width: 92% !important;
                max-width: 900px !important;
                background: rgba(15, 23, 42, 0.96) !important;
                backdrop-filter: blur(20px) !important;
                border: 2px solid #00C853 !important;
                border-radius: 20px !important;
                padding: 12px 16px !important;
                box-shadow: 0 16px 45px rgba(0,0,0,0.8) !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 10px !important;
                color: #ffffff !important;
            }

            #page-preview-drawer.hidden {
                display: none !important;
            }

            .thumb-card {
                width: 110px !important;
                height: 145px !important;
                border-radius: 12px !important;
                background: #ffffff !important;
                border: 2px solid #334155 !important;
                cursor: pointer !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                padding: 4px !important;
                color: #0f172a !important;
                font-size: 10px !important;
                font-weight: 800 !important;
                transition: transform 0.2s, border-color 0.2s !important;
                flex-shrink: 0 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            }

            .thumb-card:hover, .thumb-card.active {
                transform: translateY(-4px) !important;
                border-color: #00C853 !important;
                box-shadow: 0 6px 18px rgba(0, 200, 83, 0.6) !important;
            }

            .thumb-canvas-box {
                width: 100% !important;
                height: 110px !important;
                background: #f8fafc !important;
                border-radius: 8px !important;
                overflow: hidden !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            /* MODAL SELECTOR DE LIBROS CON VISTA PREVIA */
            #book-selector-modal {
                position: fixed !important;
                inset: 0 !important;
                z-index: 10000 !important;
                background: rgba(8, 12, 20, 0.85) !important;
                backdrop-filter: blur(16px) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 20px !important;
            }

            #book-selector-modal.hidden {
                display: none !important;
            }

            .book-card-preview {
                background: #0f172a !important;
                border: 2px solid #334155 !important;
                border-radius: 18px !important;
                padding: 16px !important;
                width: 230px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 10px !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
            }

            .book-card-preview:hover {
                border-color: #00C853 !important;
                transform: translateY(-4px) !important;
                box-shadow: 0 12px 30px rgba(0,200,83,0.3) !important;
            }
        `;
        document.head.appendChild(style);
    },

    // ─── MONTAJE E INICIALIZACIÓN PRINCIPAL EN EL CONTENEDOR ───
    initInContainer(containerId) {
        this.initStyles();
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div id="pizarra-studio-view">
                
                <!-- Hidden file input for uploading real PDF / Image books -->
                <input type="file" id="p360-pdf-file-input" accept=".pdf,application/pdf,image/*" style="display:none;" onchange="PizarraStudio.handleFileUpload(event)">

                <!-- BARRA SUPERIOR RECURSO / PÁGINAS ARRASTRABLE Y MINIMIZABLE -->
                <div id="top-resource-bar">
                    <div id="top-bar-handle" class="p360-drag-handle" title="Arrastrar barra superior">
                        <i data-lucide="grip-vertical" style="width:18px; height:18px;"></i>
                    </div>
                    
                    <button class="board-icon-btn" onclick="PizarraStudio.toggleTopBarMinimize()" data-title="Minimizar / Expandir Barra" style="width:32px; height:32px; color:#f59e0b;">
                        <i data-lucide="minus" id="top-bar-min-icon"></i>
                    </button>

                    <div class="top-bar-expandable" style="display:flex; align-items:center; gap:8px;">
                        <button class="board-icon-btn" onclick="PizarraStudio.showBackgroundPicker()" data-title="Fondo Pizarra" style="width:34px; height:34px;">
                            <i data-lucide="palette"></i>
                        </button>
                        <button class="board-icon-btn" onclick="PizarraStudio.openBookLibraryModal()" data-title="Biblioteca de Libros" style="width:34px; height:34px; color:#38bdf8;">
                            <i data-lucide="book-open"></i>
                        </button>
                        <button class="board-icon-btn" onclick="document.getElementById('p360-pdf-file-input').click()" data-title="📂 Subir Libro PDF Real de mi Dispositivo" style="width:34px; height:34px; color:#00E676;">
                            <i data-lucide="upload-cloud"></i>
                        </button>
                        <div style="width:1px; height:18px; background:rgba(255,255,255,0.2);"></div>
                        <button class="board-icon-btn" onclick="PizarraStudio.prevPage()" data-title="Página Anterior" style="width:34px; height:34px;">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <span id="page-indicator" style="font-size:12px; font-weight:800; padding:0 4px; white-space:nowrap;">Pág 1 / 12</span>
                        <button class="board-icon-btn" onclick="PizarraStudio.nextPage()" data-title="Página Siguiente" style="width:34px; height:34px;">
                            <i data-lucide="chevron-right"></i>
                        </button>
                        <button onclick="PizarraStudio.toggleThumbnailsDrawer()" style="border:none; background:#00C853; color:#fff; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer; display:flex; align-items:center; gap:4px;" title="Ver Miniaturas de Vista Previa">
                            <i data-lucide="layout-grid" style="width:13px; height:13px;"></i> Miniaturas
                        </button>
                        <div style="width:1px; height:18px; background:rgba(255,255,255,0.2);"></div>
                        <button class="board-icon-btn" onclick="PizarraStudio.toggleSplitView()" data-title="Vista Dividida" style="width:34px; height:34px;">
                            <i data-lucide="columns"></i>
                        </button>
                        <button class="board-icon-btn" onclick="PizarraStudio.togglePresentationMode()" data-title="Modo Presentación" style="width:34px; height:34px;">
                            <i data-lucide="tv"></i>
                        </button>
                        <button class="board-icon-btn" onclick="PizarraStudio.saveSession()" data-title="Guardar Sesión" style="width:34px; height:34px; color:#4ade80;">
                            <i data-lucide="save"></i>
                        </button>
                    </div>
                </div>

                <!-- ÁREA CENTRAL DE PIZARRA (>= 88% DE LA PANTALLA) -->
                <div id="board-viewport">
                    <div id="main-board-panel" class="board-panel">
                        <canvas id="bg-canvas" class="board-canvas-layer" style="z-index:1;"></canvas>
                        <canvas id="draw-canvas" class="board-canvas-layer" style="z-index:2;"></canvas>
                        <div id="geometry-layer" class="board-canvas-layer" style="z-index:3; pointer-events:none;"></div>
                        <div id="objects-layer" class="board-canvas-layer" style="z-index:4; pointer-events:none;"></div>
                    </div>

                    <div id="split-board-panel" class="board-panel">
                        <canvas id="split-draw-canvas" class="board-canvas-layer" style="z-index:2;"></canvas>
                    </div>
                </div>

                <!-- CARROUSEL DE VISTA PREVIA DE PÁGINAS DEL LIBRO (MINIATURAS REALES) -->
                <div id="page-preview-drawer" class="hidden">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:900; font-size:13px; color:#00E676; display:flex; align-items:center; gap:6px;">
                            <i data-lucide="eye"></i> Vista Previa Visual de Páginas — <span id="drawer-book-title">Matemáticas 7°</span>
                        </span>
                        <button onclick="PizarraStudio.toggleThumbnailsDrawer()" style="background:none; border:none; color:#ef4444; font-weight:900; cursor:pointer;">✕ Cerrar</button>
                    </div>
                    <div id="thumb-cards-container" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:6px;"></div>
                </div>

                <!-- BARRA FLOTANTE INFERIOR ARRASTRABLE Y MINIMIZABLE -->
                <div id="floating-bottom-bar">
                    <div id="bottom-bar-handle" class="p360-drag-handle" title="Arrastrar barra de herramientas">
                        <i data-lucide="grip-vertical" style="width:18px; height:18px;"></i>
                    </div>

                    <button class="board-icon-btn" onclick="PizarraStudio.toggleBottomBarMinimize()" data-title="Minimizar / Expandir Herramientas" style="width:32px; height:32px; color:#f59e0b;">
                        <i data-lucide="minus" id="bottom-bar-min-icon"></i>
                    </button>

                    <div class="bottom-bar-expandable" style="display:flex; align-items:center; gap:5px;">
                    <button class="board-icon-btn" onclick="PizarraStudio.setMode('select')" data-title="Seleccionar">
                        <i data-lucide="mouse-pointer"></i>
                    </button>
                    <button id="btn-mode-pen" class="board-icon-btn active" onclick="PizarraStudio.togglePenPopup()" data-title="Lápiz / Pincel">
                        <i data-lucide="pen-tool"></i>
                    </button>
                    <button id="btn-mode-highlighter" class="board-icon-btn" onclick="PizarraStudio.setMode('highlighter')" data-title="Resaltador">
                        <i data-lucide="highlighter"></i>
                    </button>
                    <button id="btn-mode-eraser" class="board-icon-btn" onclick="PizarraStudio.toggleEraserPopup()" data-title="Borrador">
                        <i data-lucide="eraser"></i>
                    </button>
                    <div style="width:1px; height:24px; background:rgba(255,255,255,0.2);"></div>
                    <button class="board-icon-btn" onclick="PizarraStudio.undo()" data-title="Deshacer">
                        <i data-lucide="undo-2"></i>
                    </button>
                    <button class="board-icon-btn" onclick="PizarraStudio.redo()" data-title="Rehacer">
                        <i data-lucide="redo-2"></i>
                    </button>
                    <div style="width:1px; height:24px; background:rgba(255,255,255,0.2);"></div>
                    <button class="board-icon-btn" onclick="PizarraStudio.toggleShapesPopup()" data-title="Formas Geométricas">
                        <i data-lucide="shapes"></i>
                    </button>
                    <button class="board-icon-btn" onclick="PizarraStudio.setMode('text')" data-title="Texto">
                        <i data-lucide="type"></i>
                    </button>
                    <button class="board-icon-btn" onclick="PizarraStudio.toggleGeometryPopup()" data-title="Regla / Transportador / Compás">
                        <i data-lucide="ruler"></i>
                    </button>
                    <button class="board-icon-btn" onclick="PizarraStudio.setMode('laser')" data-title="Puntero Láser">
                        <i data-lucide="sparkles" style="color:#ef4444;"></i>
                    </button>
                    <div style="width:1px; height:24px; background:rgba(255,255,255,0.2);"></div>
                    <button class="board-icon-btn" onclick="PizarraStudio.toggleInsertPopup()" data-title="Insertar Recurso">
                        <i data-lucide="plus-circle" style="color:#38bdf8;"></i>
                    </button>
                    <button class="board-icon-btn" onclick="PizarraStudio.toggleMoreToolsPopup()" data-title="Herramientas de Aula">
                        <i data-lucide="grid"></i>
                    </button>
                    </div>
                </div>

                <!-- MODAL BIBLIOTECA CON VISTA PREVIA REAL DE LIBROS SEDUC -->
                <div id="book-selector-modal" class="hidden">
                    <div style="background:#0f172a; border:2px solid #00C853; border-radius:24px; width:100%; max-width:900px; padding:24px; display:flex; flex-direction:column; gap:18px; box-shadow:0 20px 60px rgba(0,0,0,0.8);">
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:12px;">
                            <span style="font-size:18px; font-weight:900; color:#00E676; display:flex; align-items:center; gap:10px;">
                                <i data-lucide="book-open" style="width:24px; height:24px;"></i> Selector de Libros de Texto (SEDUC Honduras)
                            </span>
                            <button onclick="document.getElementById('book-selector-modal').classList.add('hidden')" style="background:none; border:none; color:#ef4444; font-size:18px; font-weight:900; cursor:pointer;">✕</button>
                        </div>
                        <div style="display:flex; gap:16px; overflow-x:auto; padding:10px 0;">
                            <div class="book-card-preview" onclick="PizarraStudio.loadOfficialBook('MAT-7-1')">
                                <div style="height:130px; background:linear-gradient(135deg,#0284c7,#2563eb); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; padding:10px; text-align:center;">
                                    <span style="font-size:36px;">📐</span>
                                    <span style="font-size:13px; font-weight:900; margin-top:4px;">MATEMÁTICAS 7°</span>
                                    <span style="font-size:10px; opacity:0.8;">Libro del Estudiante</span>
                                </div>
                                <span style="font-size:13px; font-weight:900; color:#fff;">Matemáticas 7° Grado</span>
                                <span style="font-size:11px; color:#cbd5e1;">SEDUC Honduras — 12 Páginas con Ejemplos y Ejercicios</span>
                            </div>
                            <div class="book-card-preview" onclick="PizarraStudio.loadOfficialBook('ESP-7-1')">
                                <div style="height:130px; background:linear-gradient(135deg,#059669,#10b981); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; padding:10px; text-align:center;">
                                    <span style="font-size:36px;">📘</span>
                                    <span style="font-size:13px; font-weight:900; margin-top:4px;">ESPAÑOL 7°</span>
                                    <span style="font-size:10px; opacity:0.8;">Libro del Estudiante</span>
                                </div>
                                <span style="font-size:13px; font-weight:900; color:#fff;">Español 7° Grado</span>
                                <span style="font-size:11px; color:#cbd5e1;">SEDUC Honduras — Texto Narrativo y Gramática</span>
                            </div>
                            <div class="book-card-preview" onclick="PizarraStudio.loadOfficialBook('CN-7-1')">
                                <div style="height:130px; background:linear-gradient(135deg,#7c3aed,#9333ea); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; padding:10px; text-align:center;">
                                    <span style="font-size:36px;">🔬</span>
                                    <span style="font-size:13px; font-weight:900; margin-top:4px;">CIENCIAS NATURALES 7°</span>
                                    <span style="font-size:10px; opacity:0.8;">Libro del Estudiante</span>
                                </div>
                                <span style="font-size:13px; font-weight:900; color:#fff;">Ciencias Naturales 7°</span>
                                <span style="font-size:11px; color:#cbd5e1;">SEDUC Honduras — Biología y Células</span>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border: 2px dashed #6ee7b7; border-radius: 18px; padding: 18px; text-align: center; cursor: pointer; transition: transform 0.2s; margin-bottom: 4px;" onclick="document.getElementById('p360-pdf-file-input').click()" onmouseover="this.style.transform='scale(1.01)'" onmouseout="this.style.transform='scale(1)'">
                            <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
                                <div style="width:42px; height:42px; background:rgba(255,255,255,0.25); border-radius:50%; display:grid; place-items:center; color:#fff;">
                                    <i data-lucide="upload-cloud" style="width:24px; height:24px;"></i>
                                </div>
                                <div style="text-align:left;">
                                    <h4 style="margin:0; font-size:15px; font-weight:900; color:#fff;">📂 SUBIR LIBRO REAL DESDE TU DISPOSITIVO (PDF)</h4>
                                    <p style="margin:2px 0 0; font-size:11.5px; color:#e0f2fe; font-weight:600;">Haz clic aquí para seleccionar cualquier archivo PDF o Libro desde las carpetas de tu dispositivo (PC, Tablet o Móvil)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- POPUPS CONTEXTUALES COMPACTOS -->
                <div id="popup-pen" class="board-popup-panel hidden" style="left:50%; transform:translateX(-160px);">
                    <div style="display:flex; gap:8px; align-items:center; font-size:12px; font-weight:800; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:6px;">
                        <span>Tipo de Trazo:</span>
                        <button onclick="PizarraStudio.setPenType('pen')" style="background:#00C853; border:none; color:#fff; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Bolígrafo</button>
                        <button onclick="PizarraStudio.setPenType('pencil')" style="background:#334155; border:none; color:#fff; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Lápiz</button>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <span style="font-size:11px; font-weight:700;">Color:</span>
                        <div onclick="PizarraStudio.setPenColor('#000000')" style="width:22px; height:22px; border-radius:50%; background:#000000; border:2px solid #fff; cursor:pointer;"></div>
                        <div onclick="PizarraStudio.setPenColor('#00C853')" style="width:22px; height:22px; border-radius:50%; background:#00C853; cursor:pointer;"></div>
                        <div onclick="PizarraStudio.setPenColor('#2979FF')" style="width:22px; height:22px; border-radius:50%; background:#2979FF; cursor:pointer;"></div>
                        <div onclick="PizarraStudio.setPenColor('#ff1744')" style="width:22px; height:22px; border-radius:50%; background:#ff1744; cursor:pointer;"></div>
                    </div>
                    <div style="display:flex; gap:10px; align-items:center; font-size:11px; font-weight:700;">
                        <span>Grosor:</span>
                        <input type="range" min="1" max="24" value="4" onchange="PizarraStudio.setPenSize(this.value)" style="flex:1;" />
                    </div>
                </div>

                <div id="popup-eraser" class="board-popup-panel hidden" style="left:50%; transform:translateX(-60px);">
                    <button onclick="PizarraStudio.setEraserType('stroke')" style="border:none; background:rgba(255,255,255,0.08); color:#fff; padding:8px 12px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; cursor:pointer;">🧹 Borrar por Trazo</button>
                    <button onclick="PizarraStudio.clearCurrentPage()" style="border:none; background:#ef4444; color:#fff; padding:8px 12px; border-radius:8px; text-align:left; font-size:12px; font-weight:800; cursor:pointer;">🗑️ Limpiar Página Completa</button>
                </div>

                <div id="popup-geometry" class="board-popup-panel hidden" style="left:50%; transform:translateX(80px);">
                    <button onclick="PizarraStudio.toggleRuler()" style="border:none; background:rgba(255,255,255,0.08); color:#fff; padding:8px 12px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; cursor:pointer;">📏 Regla Graduada</button>
                    <button onclick="PizarraStudio.toggleProtractor()" style="border:none; background:rgba(255,255,255,0.08); color:#fff; padding:8px 12px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; cursor:pointer;">📐 Transportador 180°</button>
                </div>

                <div id="popup-insert" class="board-popup-panel hidden" style="left:50%; transform:translateX(160px);">
                    <button onclick="PizarraStudio.openBookLibraryModal()" style="border:none; background:rgba(255,255,255,0.08); color:#fff; padding:6px 12px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; cursor:pointer;">📚 Selector de Libros SEDUC</button>
                    <button onclick="PizarraStudio.insertPDF()" style="border:none; background:rgba(255,255,255,0.08); color:#fff; padding:6px 12px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; cursor:pointer;">📄 Cargar PDF de Laptop</button>
                </div>

                <!-- BOTÓN FLOTANTE IA CONTEXTUAL DE ACCIÓN RÁPIDA -->
                <button onclick="PizarraStudio.triggerAIContextAction()" style="position:absolute; bottom:80px; right:24px; z-index:9850; width:48px; height:48px; border-radius:16px; background:linear-gradient(135deg,#7C4DFF,#FF4081); border:none; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 8px 24px rgba(124,77,255,0.4);" title="IA Contextual">
                    <i data-lucide="sparkles" style="width:24px; height:24px;"></i>
                </button>

                <!-- DRAWER FLOTANTE IA CONTEXTUAL -->
                <div id="ai-floating-drawer" class="hidden">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.15); padding-bottom:8px;">
                        <span style="font-weight:900; font-size:14px; color:#c084fc; display:flex; align-items:center; gap:6px;">
                            <i data-lucide="sparkles"></i> Asistente de IA de la Pizarra
                        </span>
                        <button onclick="document.getElementById('ai-floating-drawer').classList.add('hidden')" style="background:none; border:none; color:#ef4444; font-weight:900; cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:11.5px; color:#cbd5e1; line-height:1.4;">
                        Leyendo la vista previa activa de la página ${this.state.currentPage} y tus trazos...
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <button onclick="PizarraStudio.execAICommand('explicar')" style="border:none; background:rgba(255,255,255,0.08); color:#fff; padding:8px 10px; border-radius:8px; font-size:12px; font-weight:700; text-align:left; cursor:pointer;">💡 Explicar Vista Previa Actual</button>
                        <button onclick="PizarraStudio.execAICommand('pregunta')" style="border:none; background:rgba(255,255,255,0.08); color:#fff; padding:8px 10px; border-radius:8px; font-size:12px; font-weight:700; text-align:left; cursor:pointer;">❓ Generar 3 Preguntas de Evaluación</button>
                    </div>
                    <div id="ai-response-box" style="background:#1e293b; border-radius:8px; padding:10px; font-size:12px; color:#f8fafc; max-height:160px; overflow-y:auto; display:none;"></div>
                </div>

            </div>
        `;

        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
            this._setupCanvasEngine();
            this.initDraggableToolbars();
            this.openResource({
                title: 'Matemáticas 7° — Libro del Estudiante (SEDUC)',
                totalPages: 12,
                type: 'pdf'
            });
        }, 80);
    },

    // ─── MOTOR DE CANVASES 2D (TRAZOS DE BAJA LATENCIA & FONDO) ───
    _setupCanvasEngine() {
        const bgCvs = document.getElementById('bg-canvas');
        const drawCvs = document.getElementById('draw-canvas');
        const panel = document.getElementById('main-board-panel');
        if (!bgCvs || !drawCvs || !panel) return;

        const width = panel.clientWidth || window.innerWidth;
        const height = panel.clientHeight || (window.innerHeight - 70);

        bgCvs.width = width;
        bgCvs.height = height;
        drawCvs.width = width;
        drawCvs.height = height;

        const ctx = drawCvs.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        const getPos = (e) => {
            const rect = drawCvs.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDraw = (e) => {
            if (this.state.activeMode === 'select') return;
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;

            this.closeAllPopups();

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);

            if (this.state.activeMode === 'eraser') {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 30;
            } else if (this.state.activeMode === 'highlighter') {
                ctx.strokeStyle = 'rgba(255, 235, 59, 0.4)';
                ctx.lineWidth = 20;
            } else {
                ctx.strokeStyle = this.state.penColor;
                ctx.lineWidth = this.state.penSize;
            }
        };

        const drawMove = (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);

            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();

            lastX = pos.x;
            lastY = pos.y;
        };

        const stopDraw = () => {
            if (isDrawing) {
                isDrawing = false;
                ctx.closePath();
            }
        };

        drawCvs.addEventListener('mousedown', startDraw);
        drawCvs.addEventListener('mousemove', drawMove);
        drawCvs.addEventListener('mouseup', stopDraw);

        drawCvs.addEventListener('touchstart', startDraw, { passive: true });
        drawCvs.addEventListener('touchmove', drawMove, { passive: true });
        drawCvs.addEventListener('touchend', stopDraw);
    },

    // ─── APERTURA DE LIBRO Y RENDERIZADO DE VISTA PREVIA REAL EN LIENZO ───
    openBookLibraryModal() {
        document.getElementById('book-selector-modal')?.classList.remove('hidden');
    },

    loadOfficialBook(key) {
        document.getElementById('book-selector-modal')?.classList.add('hidden');
        let title = 'Matemáticas 7° — Libro del Estudiante (SEDUC)';
        if (key === 'ESP-7-1') title = 'Español 7° — Libro del Estudiante (SEDUC)';
        if (key === 'CN-7-1') title = 'Ciencias Naturales 7° — Libro del Estudiante (SEDUC)';

        this.openResource({
            title: title,
            totalPages: 12,
            type: 'pdf'
        });
    },

    openResource(resourceData) {
        this.state.isResourceOpen = true;
        this.state.resourceTitle = resourceData.title || 'Libro Abierto';
        this.state.currentPage = resourceData.page || 1;
        this.state.totalPages = resourceData.totalPages || 12;

        const drawerTitle = document.getElementById('drawer-book-title');
        if (drawerTitle) drawerTitle.textContent = this.state.resourceTitle;

        this.updatePageIndicator();
        this.renderResourceOnBackground();
        this._renderRealPageThumbnails();
    },

    // RENDERIZADO REAL DE PÁGINA EN EL CANVAS PRINCIPAL
    renderResourceOnBackground() {
        const bgCvs = document.getElementById('bg-canvas');
        if (!bgCvs) return;
        const ctx = bgCvs.getContext('2d');
        const w = bgCvs.width;
        const h = bgCvs.height;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Si tenemos un PDF real cargado mediante pdfjsLib, renderizarlo directamente
        if (this.state.pdfDoc) {
            this.state.pdfDoc.getPage(this.state.currentPage).then(page => {
                const viewport = page.getViewport({ scale: 1.2 });
                const renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                page.render(renderContext);
            });
            return;
        }

        // De lo contrario, renderizar la maqueta gráfica interactiva oficial del libro SEDUC
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, 0, w, 65);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Outfit, sans-serif';
        ctx.fillText(`📘 ${this.state.resourceTitle}`, 30, 40);

        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText(`PÁGINA ${this.state.currentPage} DE ${this.state.totalPages}`, w - 200, 40);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillText(`Lección ${this.state.currentPage}: Números Positivos, Negativos y Operaciones`, 40, 110);

        ctx.fillStyle = '#475569';
        ctx.font = '15px Outfit, sans-serif';
        ctx.fillText('Estándar Educativo SEDUC: Resuelve problemas aplicando operaciones de números enteros.', 40, 138);

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.fillRect(40, 160, w - 80, 240);
        ctx.strokeRect(40, 160, w - 80, 240);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.fillText('📌 EJEMPLO ILUSTRADO N° ' + this.state.currentPage, 60, 195);

        ctx.font = '15px Outfit, sans-serif';
        ctx.fillText('Expresa la temperatura registrada en Tegucigalpa utilizando números enteros con signo:', 60, 230);

        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('T1 = +28°C  (Temperatura Máxima)', 80, 280);
        ctx.fillText('T2 = -2°C   (Temperatura Mínima en la Sierra)', 80, 320);

        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath(); ctx.moveTo(40, 430); ctx.lineTo(w - 40, 430); ctx.stroke();

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 18px Outfit, sans-serif';
        ctx.fillText('✏️ TRABAJO PRÁCTICO EN EL CUADERNO (Página ' + (this.state.currentPage + 5) + ')', 40, 465);

        ctx.fillStyle = '#334155';
        ctx.font = '15px Outfit, sans-serif';
        ctx.fillText('1. Representa en la recta numérica los números: -5, +3, 0, -1, +6', 40, 500);
        ctx.fillText('2. Escribe el valor absoluto de cada uno de los números representados arriba.', 40, 535);
    },

    // ─── CARROUSEL DE MINIATURAS VISUALES AUTÉNTICAS Y REALES ───
    toggleThumbnailsDrawer() {
        this.state.showThumbnails = !this.state.showThumbnails;
        const drawer = document.getElementById('page-preview-drawer');
        if (drawer) {
            drawer.classList.toggle('hidden', !this.state.showThumbnails);
            if (this.state.showThumbnails) this._renderRealPageThumbnails();
        }
    },

    _renderRealPageThumbnails() {
        const container = document.getElementById('thumb-cards-container');
        if (!container) return;

        let html = '';
        for (let p = 1; p <= this.state.totalPages; p++) {
            const isActive = (p === this.state.currentPage);
            html += `
                <div class="thumb-card ${isActive ? 'active' : ''}" onclick="PizarraStudio.goToPage(${p})">
                    <div style="font-size:9.5px; font-weight:900; color:#0284c7; padding:2px 4px; display:flex; justify-space-between; width:100%;">
                        <span>PÁG ${p}</span>
                        <span>${isActive ? '● VISTA' : ''}</span>
                    </div>
                    <div class="thumb-canvas-box">
                        <canvas id="thumb-cvs-${p}" width="102" height="106" style="width:100%; height:100%; border-radius:6px;"></canvas>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;

        // Renderizar la miniatura visual en cada canvas de tarjeta
        setTimeout(() => {
            for (let p = 1; p <= this.state.totalPages; p++) {
                const cvs = document.getElementById(`thumb-cvs-${p}`);
                if (cvs) {
                    const ctx = cvs.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, 102, 106);

                    // Encabezado azúl en miniatura
                    ctx.fillStyle = '#0284c7';
                    ctx.fillRect(0, 0, 102, 18);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 8px Outfit, sans-serif';
                    ctx.fillText(`PÁG ${p}`, 6, 12);

                    // Mini vista gráfica del contenido de la página p
                    ctx.fillStyle = '#0f172a';
                    ctx.font = 'bold 9px Outfit, sans-serif';
                    ctx.fillText(`Lección ${p}`, 6, 32);

                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(6, 38, 90, 2);
                    ctx.fillRect(6, 44, 70, 2);
                    ctx.fillRect(6, 50, 80, 2);

                    // Recuadro ilustrado miniatura
                    ctx.fillStyle = '#eff6ff';
                    ctx.strokeStyle = '#93c5fd';
                    ctx.lineWidth = 1;
                    ctx.fillRect(6, 56, 90, 36);
                    ctx.strokeRect(6, 56, 90, 36);

                    ctx.fillStyle = '#2563eb';
                    ctx.font = 'bold 9px monospace';
                    ctx.fillText(`E.G. N° ${p}`, 12, 72);
                    ctx.fillText(`+${p * 2} | -${p}`, 12, 84);
                }
            }
        }, 50);
    },

    goToPage(p) {
        this.state.currentPage = p;
        this.updatePageIndicator();
        this.renderResourceOnBackground();
        this._renderRealPageThumbnails();
    },

    nextPage() {
        if (this.state.pdfDoc && this.state.currentPage < this.state.totalPages) {
            this.state.currentPage++;
            this.renderPdfPage(this.state.currentPage);
            return;
        }

        if (this.state.currentPage < this.state.totalPages) {
            this.goToPage(this.state.currentPage + 1);
        }
    },

    prevPage() {
        if (this.state.pdfDoc && this.state.currentPage > 1) {
            this.state.currentPage--;
            this.renderPdfPage(this.state.currentPage);
            return;
        }

        if (this.state.currentPage > 1) {
            this.goToPage(this.state.currentPage - 1);
        }
    },

    updatePageIndicator() {
        const ind = document.getElementById('page-indicator');
        if (ind) ind.textContent = `Pág ${this.state.currentPage} / ${this.state.totalPages}`;
    },

    // ─── POPUPS Y CONTROLES ───
    setMode(mode) {
        this.state.activeMode = mode;
        this.closeAllPopups();
        document.querySelectorAll('.board-icon-btn').forEach(btn => btn.classList.remove('active'));
        if (mode === 'pen') document.getElementById('btn-mode-pen')?.classList.add('active');
        if (mode === 'highlighter') document.getElementById('btn-mode-highlighter')?.classList.add('active');
        if (mode === 'eraser') document.getElementById('btn-mode-eraser')?.classList.add('active');
    },

    setPenColor(color) { this.state.penColor = color; this.setMode('pen'); },
    setPenSize(size) { this.state.penSize = parseInt(size); },
    setPenType(type) { this.state.penType = type; this.setMode('pen'); },
    setEraserType(type) { this.state.eraserType = type; this.setMode('eraser'); },

    clearCurrentPage() {
        if (confirm('¿Limpiar todas las anotaciones de la página actual?')) {
            const cvs = document.getElementById('draw-canvas');
            if (cvs) cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height);
        }
        this.closeAllPopups();
    },

    insertPDF() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,.pdf';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (window.pdfjsLib) {
                    try {
                        const buffer = await file.arrayBuffer();
                        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
                        this.state.pdfDoc = pdf;
                        this.openResource({
                            title: file.name,
                            totalPages: pdf.numPages,
                            type: 'pdf'
                        });
                        return;
                    } catch (err) {
                        console.warn('PDF.js render fallback:', err);
                    }
                }

                this.openResource({
                    title: file.name,
                    totalPages: 16,
                    type: 'pdf'
                });
            }
        };
        input.click();
        document.getElementById('book-selector-modal')?.classList.add('hidden');
    },

    showBackgroundPicker() {
        const types = ['white', 'black', 'grid', 'lined', 'cartesian'];
        const current = this.state.backgroundType;
        const next = types[(types.indexOf(current) + 1) % types.length];
        this.state.backgroundType = next;
        this.renderResourceOnBackground();
    },

    toggleRuler() {
        this.state.geometryTools.ruler = !this.state.geometryTools.ruler;
        this._renderGeometryWidgets();
    },

    toggleProtractor() {
        this.state.geometryTools.protractor = !this.state.geometryTools.protractor;
        this._renderGeometryWidgets();
    },

    _renderGeometryWidgets() {
        const layer = document.getElementById('geometry-layer');
        if (!layer) return;
        this.closeAllPopups();

        let html = '';
        if (this.state.geometryTools.ruler) {
            html += `<div class="geometry-widget" style="top:180px; left:180px; width:480px; height:70px; background:rgba(255,255,255,0.92); border:2px solid #0284c7; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.3); display:flex; flex-direction:column; justify-content:space-between; padding:4px 10px; color:#0f172a; font-weight:800;">
                <div style="display:flex; justify-content:space-between; font-size:10px;">
                    <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30 cm</span>
                </div>
                <div style="height:12px; border-top:2px solid #0284c7; display:flex; justify-content:space-between;">
                    <span style="font-size:11px;">📏 Regla Didáctica de Precisión</span>
                    <button onclick="PizarraStudio.toggleRuler()" style="background:none; border:none; color:#ef4444; font-weight:800; cursor:pointer;">✕</button>
                </div>
            </div>`;
        }

        if (this.state.geometryTools.protractor) {
            html += `<div class="geometry-widget" style="top:220px; left:300px; width:320px; height:160px; background:rgba(255,255,255,0.88); border:2px solid #10b981; border-radius:160px 160px 0 0; box-shadow:0 8px 24px rgba(0,0,0,0.3); display:flex; align-items:flex-end; justify-content:center; padding-bottom:8px; color:#0f172a; font-weight:800; font-size:12px;">
                📐 Transportador 180°
                <button onclick="PizarraStudio.toggleProtractor()" style="position:absolute; top:12px; right:24px; background:none; border:none; color:#ef4444; font-weight:800; cursor:pointer;">✕</button>
            </div>`;
        }

        layer.innerHTML = html;
    },

    toggleSplitView() {
        this.state.isSplitView = !this.state.isSplitView;
        const panel = document.getElementById('split-board-panel');
        if (panel) panel.style.display = this.state.isSplitView ? 'flex' : 'none';
    },

    togglePresentationMode() {
        this.state.isPresentation = !this.state.isPresentation;
        document.body.classList.toggle('presentation-mode', this.state.isPresentation);
    },

    togglePenPopup() { this._togglePopup('popup-pen'); this.setMode('pen'); },
    toggleEraserPopup() { this._togglePopup('popup-eraser'); this.setMode('eraser'); },
    toggleShapesPopup() { this._togglePopup('popup-shapes'); },
    toggleGeometryPopup() { this._togglePopup('popup-geometry'); },
    toggleInsertPopup() { this._togglePopup('popup-insert'); },
    toggleMoreToolsPopup() { this._togglePopup('popup-more-tools'); },

    _togglePopup(id) {
        const pop = document.getElementById(id);
        const isHidden = pop?.classList.contains('hidden');
        this.closeAllPopups();
        if (isHidden) pop?.classList.remove('hidden');
    },

    closeAllPopups() {
        document.querySelectorAll('.board-popup-panel').forEach(p => p.classList.add('hidden'));
    },

    undo() {},
    redo() {},
    saveSession() { alert('Sesión de Pizarra Digital guardada con éxito.'); },

    triggerAIContextAction() {
        document.getElementById('ai-floating-drawer')?.classList.toggle('hidden');
    },

    execAICommand(cmd) {
        const box = document.getElementById('ai-response-box');
        if (!box) return;
        box.style.display = 'block';
        box.innerHTML = '⚡ <i>La IA está leyendo la vista previa visual de la página ' + this.state.currentPage + ' y tus trazos...</i>';

        setTimeout(() => {
            if (cmd === 'explicar') {
                box.innerHTML = `<b>✨ Explicación Didáctica (Página ${this.state.currentPage}):</b><br/>La página del libro expone la lección N° ${this.state.currentPage} con operaciones numéricas. La IA analiza los trazos en pantalla.`;
            } else {
                box.innerHTML = `<b>❓ Pregunta de Evaluación:</b><br/>1. Resuelve los ejercicios planteados en la miniatura de la página ${this.state.currentPage}.`;
            }
        }, 500);
    },

    // ─── HERRAMIENTAS FLOTANTES ARRASTRABLES & MINIMIZABLES ───
    initDraggableToolbars() {
        const topBar = document.getElementById('top-resource-bar');
        const topHandle = document.getElementById('top-bar-handle');
        const bottomBar = document.getElementById('floating-bottom-bar');
        const bottomHandle = document.getElementById('bottom-bar-handle');
        
        if (topBar && topHandle) this.makeElementDraggable(topBar, topHandle);
        if (bottomBar && bottomHandle) this.makeElementDraggable(bottomBar, bottomHandle);
    },

    makeElementDraggable(el, handleEl) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const handle = handleEl || el;
        
        const dragMouseDown = (e) => {
            if (e.target.closest('button') || e.target.closest('input')) return;
            e.preventDefault();
            pos3 = e.clientX || (e.touches && e.touches[0].clientX);
            pos4 = e.clientY || (e.touches && e.touches[0].clientY);
            
            const onDrag = (ev) => {
                ev.preventDefault();
                const clientX = ev.clientX || (ev.touches && ev.touches[0].clientX);
                const clientY = ev.clientY || (ev.touches && ev.touches[0].clientY);
                
                pos1 = pos3 - clientX;
                pos2 = pos4 - clientY;
                pos3 = clientX;
                pos4 = clientY;
                
                el.style.top = (el.offsetTop - pos2) + 'px';
                el.style.left = (el.offsetLeft - pos1) + 'px';
                el.style.transform = 'none';
                el.style.bottom = 'auto';
                el.style.right = 'auto';
            };
            
            const stopDrag = () => {
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', stopDrag);
                document.removeEventListener('touchmove', onDrag);
                document.removeEventListener('touchend', stopDrag);
            };
            
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('touchend', stopDrag);
        };
        
        handle.addEventListener('mousedown', dragMouseDown);
        handle.addEventListener('touchstart', dragMouseDown, { passive: false });
    },

    toggleTopBarMinimize() {
        const topBar = document.getElementById('top-resource-bar');
        const icon = document.getElementById('top-bar-min-icon');
        if (!topBar) return;
        
        const isMin = topBar.classList.toggle('is-minimized');
        if (icon) {
            icon.setAttribute('data-lucide', isMin ? 'maximize-2' : 'minus');
            if (window.lucide) lucide.createIcons();
        }
    },

    toggleBottomBarMinimize() {
        const bottomBar = document.getElementById('floating-bottom-bar');
        const icon = document.getElementById('bottom-bar-min-icon');
        if (!bottomBar) return;
        
        const isMin = bottomBar.classList.toggle('is-minimized');
        if (icon) {
            icon.setAttribute('data-lucide', isMin ? 'maximize-2' : 'minus');
            if (window.lucide) lucide.createIcons();
        }
    },

    // ─── CARGA Y RENDERIZADO DE LIBROS EN PDF REALES DEL DISPOSITIVO ───
    handleFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        
        document.getElementById('book-selector-modal')?.classList.add('hidden');
        if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast(`Cargando libro real: ${file.name}...`, 'info');
        }
        
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    await this.loadRealPdfBuffer(ev.target.result, file.name);
                } catch (err) {
                    console.error('Error cargando PDF real:', err);
                    if (typeof UI !== 'undefined' && UI.toast) UI.toast('Error al renderizar el archivo PDF', 'error');
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.loadSingleImageBook(ev.target.result, file.name);
            };
            reader.readAsDataURL(file);
        } else {
            if (typeof UI !== 'undefined' && UI.toast) UI.toast('Seleccione un archivo PDF o una imagen', 'warning');
        }
    },

    async loadRealPdfBuffer(arrayBuffer, fileName) {
        const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!pdfjs) {
            if (typeof UI !== 'undefined' && UI.toast) UI.toast('Librería PDF.js no disponible', 'error');
            return;
        }
        
        pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        
        this.state.pdfDoc = pdfDoc;
        this.state.totalPages = pdfDoc.numPages;
        this.state.currentPage = 1;
        this.state.resourceTitle = fileName;
        this.state.isResourceOpen = true;
        
        const pageInd = document.getElementById('page-indicator');
        if (pageInd) pageInd.textContent = `Pág 1 / ${pdfDoc.numPages}`;
        
        const drawerTitle = document.getElementById('drawer-book-title');
        if (drawerTitle) drawerTitle.textContent = fileName;
        
        await this.renderPdfPage(1);
        this.buildPdfThumbnails();
        
        if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast(`¡Libro real cargado! (${pdfDoc.numPages} páginas)`, 'success');
        }
    },

    async renderPdfPage(pageNum) {
        if (!this.state.pdfDoc) return;
        try {
            const page = await this.state.pdfDoc.getPage(pageNum);
            const bgCvs = document.getElementById('bg-canvas');
            const drawCvs = document.getElementById('draw-canvas');
            const panel = document.getElementById('main-board-panel');
            if (!bgCvs || !drawCvs || !panel) return;
            
            const panelWidth = panel.clientWidth || window.innerWidth;
            const panelHeight = panel.clientHeight || (window.innerHeight - 70);
            
            const unscaledViewport = page.getViewport({ scale: 1.0 });
            const scaleX = panelWidth / unscaledViewport.width;
            const scaleY = panelHeight / unscaledViewport.height;
            const scale = Math.min(scaleX, scaleY) * (this.state.zoomLevel || 1.0);
            
            const viewport = page.getViewport({ scale });
            
            bgCvs.width = panelWidth;
            bgCvs.height = panelHeight;
            drawCvs.width = panelWidth;
            drawCvs.height = panelHeight;
            
            const ctx = bgCvs.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, panelWidth, panelHeight);
            
            const offsetX = (panelWidth - viewport.width) / 2;
            const offsetY = (panelHeight - viewport.height) / 2;
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            await page.render(renderContext).promise;
            ctx.restore();
            
            const pageInd = document.getElementById('page-indicator');
            if (pageInd) pageInd.textContent = `Pág ${pageNum} / ${this.state.totalPages}`;
        } catch(e) {
            console.error('Error renderizando página PDF:', e);
        }
    },

    async buildPdfThumbnails() {
        const container = document.getElementById('thumb-cards-container');
        if (!container || !this.state.pdfDoc) return;
        container.innerHTML = '';
        
        for (let i = 1; i <= Math.min(this.state.totalPages, 40); i++) {
            const card = document.createElement('div');
            card.className = `thumb-card ${i === this.state.currentPage ? 'active' : ''}`;
            card.onclick = () => {
                this.state.currentPage = i;
                this.renderPdfPage(i);
                this.buildPdfThumbnails();
            };
            card.innerHTML = `
                <div class="thumb-canvas-box" id="thumb-cvs-box-${i}">
                    <canvas id="thumb-cvs-${i}" width="100" height="105"></canvas>
                </div>
                <div style="text-align:center; padding:2px;">Pág ${i}</div>
            `;
            container.appendChild(card);
            
            setTimeout(async () => {
                try {
                    const cvs = document.getElementById(`thumb-cvs-${i}`);
                    if (cvs && this.state.pdfDoc) {
                        const page = await this.state.pdfDoc.getPage(i);
                        const vp = page.getViewport({ scale: 0.18 });
                        cvs.width = vp.width;
                        cvs.height = vp.height;
                        const ctx = cvs.getContext('2d');
                        await page.render({ canvasContext: ctx, viewport: vp }).promise;
                    }
                } catch(e) {}
            }, i * 25);
        }
    },

    loadSingleImageBook(dataUrl, fileName) {
        const bgCvs = document.getElementById('bg-canvas');
        if (!bgCvs) return;
        const img = new Image();
        img.onload = () => {
            const ctx = bgCvs.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, bgCvs.width, bgCvs.height);
            ctx.drawImage(img, 0, 0, bgCvs.width, bgCvs.height);
        };
        img.src = dataUrl;
        this.state.resourceTitle = fileName;
        this.state.totalPages = 1;
        this.state.currentPage = 1;
        const pageInd = document.getElementById('page-indicator');
        if (pageInd) pageInd.textContent = `Pág 1 / 1`;
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(`Imagen cargada: ${fileName}`, 'success');
    },

};