/**
 * Tour360 Framework - Aula 360 HN
 * Sistema de Tutoriales Guiados (PWA Offline)
 * Arquitectura: Clean Architecture & Component Driven Design
 */

(function (global) {
    'use strict';

    // ---------------------------------------------------------
    // 1. STORAGE: Persistencia de progreso (Compatible Offline)
    // ---------------------------------------------------------
    const Storage = {
        key: 'tour360_progress',
        _load() {
            try {
                const data = localStorage.getItem(this.key);
                return data ? JSON.parse(data) : {};
            } catch (e) {
                console.error("Tour360 Storage Error:", e);
                return {};
            }
        },
        _save(data) {
            try {
                localStorage.setItem(this.key, JSON.stringify(data));
            } catch (e) {
                console.error("Tour360 Storage Error:", e);
            }
        },
        getProgress(tutorialId) {
            return this._load()[tutorialId] || { completed: false, currentStep: 0, lastSeen: null };
        },
        updateProgress(tutorialId, data) {
            const all = this._load();
            all[tutorialId] = { ...this.getProgress(tutorialId), ...data, lastSeen: new Date().toISOString() };
            this._save(all);
        },
        markCompleted(tutorialId) {
            this.updateProgress(tutorialId, { completed: true });
        },
        reset(tutorialId) {
            const all = this._load();
            if (all[tutorialId]) {
                delete all[tutorialId];
                this._save(all);
            }
        }
    };

    // ---------------------------------------------------------
    // 2. REGISTRY: Catálogo Centralizado de Tutoriales
    // ---------------------------------------------------------
    const Registry = {
        _tutorials: new Map(),
        
        register(tutorialObj) {
            if (!tutorialObj.id || !tutorialObj.pasos) {
                console.warn("Tour360: Tutorial inválido. Requiere 'id' y 'pasos'.");
                return;
            }
            this._tutorials.set(tutorialObj.id, tutorialObj);
        },
        
        get(tutorialId) {
            return this._tutorials.get(tutorialId);
        },
        
        getAll() {
            return Array.from(this._tutorials.values());
        }
    };

    // ---------------------------------------------------------
    // 3. POSITIONING: Motor de Cálculo Espacial
    // ---------------------------------------------------------
    const Positioning = {
        getCoords(targetSelector, placement = 'auto', tooltipRect) {
            const el = document.querySelector(targetSelector);
            if (!el) return null;
            
            const rect = el.getBoundingClientRect();
            const padding = 6; // Espacio alrededor del elemento para la máscara
            
            const highlight = {
                top: rect.top - padding,
                left: rect.left - padding,
                width: rect.width + (padding * 2),
                height: rect.height + (padding * 2),
                borderRadius: window.getComputedStyle(el).borderRadius
            };
            
            // Si el borderRadius es 0px o muy pequeño, usamos un estilo tipo pastilla o círculo
            if (highlight.borderRadius === '0px' && highlight.width === highlight.height) {
                highlight.borderRadius = '50%';
            } else if (highlight.borderRadius === '0px') {
                highlight.borderRadius = '8px';
            }

            let ttTop = 0;
            let ttLeft = 0;
            const margin = 12; // Distancia entre highlight y tooltip

            if (placement === 'auto') {
                // Decidir bottom o top dependiendo del espacio
                if (rect.bottom + tooltipRect.height + margin < window.innerHeight) {
                    placement = 'bottom';
                } else {
                    placement = 'top';
                }
            }

            switch(placement) {
                case 'bottom':
                    ttTop = highlight.top + highlight.height + margin;
                    ttLeft = highlight.left + (highlight.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'top':
                    ttTop = highlight.top - tooltipRect.height - margin;
                    ttLeft = highlight.left + (highlight.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    ttTop = highlight.top + (highlight.height / 2) - (tooltipRect.height / 2);
                    ttLeft = highlight.left - tooltipRect.width - margin;
                    break;
                case 'right':
                    ttTop = highlight.top + (highlight.height / 2) - (tooltipRect.height / 2);
                    ttLeft = highlight.left + highlight.width + margin;
                    break;
            }

            // Evitar que el tooltip se salga de la pantalla verticalmente
            if (ttTop < margin) ttTop = margin;
            if (ttTop + tooltipRect.height > window.innerHeight - margin) {
                ttTop = window.innerHeight - tooltipRect.height - margin;
            }

            // Evitar que el tooltip se salga de la pantalla horizontalmente
            if (ttLeft < margin) ttLeft = margin;
            if (ttLeft + tooltipRect.width > window.innerWidth - margin) {
                ttLeft = window.innerWidth - tooltipRect.width - margin;
            }
            
            // Flecha (Puntero del tooltip)
            let arrowTop = 0;
            let arrowLeft = 0;
            
            if (placement === 'bottom' || placement === 'top') {
                arrowLeft = (highlight.left + highlight.width / 2) - ttLeft;
                if (arrowLeft < 20) arrowLeft = 20;
                if (arrowLeft > tooltipRect.width - 20) arrowLeft = tooltipRect.width - 20;
            } else {
                arrowTop = (highlight.top + highlight.height / 2) - ttTop;
                if (arrowTop < 20) arrowTop = 20;
                if (arrowTop > tooltipRect.height - 20) arrowTop = tooltipRect.height - 20;
            }

            return { highlight, tooltip: { top: ttTop, left: ttLeft, arrowLeft, arrowTop, placement } };
        }
    };

    // ---------------------------------------------------------
    // 4. RENDERER: Interfaz Visual (Overlays y Tooltips)
    // ---------------------------------------------------------
    const Renderer = {
        _overlayId: 'tour360-overlay',
        _tooltipId: 'tour360-tooltip',
        _isActive: false,
        
        _injectStyles() {
            if (document.getElementById('tour360-styles')) return;
            const style = document.createElement('style');
            style.id = 'tour360-styles';
            style.innerHTML = `
                /* Máscara con "Agujero" usando un box-shadow colosal */
                .tour360-mask {
                    position: fixed;
                    z-index: 999998;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 0 3px rgba(255,255,255,0.9);
                    pointer-events: none; /* Dejar pasar clics si queremos, o bloquearlos */
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* Tooltip emergente */
                .tour360-popup {
                    position: fixed;
                    z-index: 999999;
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 20px;
                    width: 320px;
                    max-width: 90vw;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                    opacity: 0;
                    transform: translateY(10px);
                    transition: opacity 0.3s ease, transform 0.3s ease, top 0.3s ease, left 0.3s ease;
                    font-family: inherit;
                }
                .tour360-popup.active {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                /* Flecha del Tooltip */
                .tour360-arrow {
                    position: absolute;
                    width: 0;
                    height: 0;
                    border-style: solid;
                    transition: left 0.3s ease;
                }
                .tour360-popup.placement-bottom .tour360-arrow {
                    top: -10px;
                    border-width: 0 10px 10px 10px;
                    border-color: transparent transparent #ffffff transparent;
                }
                .tour360-popup.placement-top .tour360-arrow {
                    bottom: -10px;
                    border-width: 10px 10px 0 10px;
                    border-color: #ffffff transparent transparent transparent;
                }
                .tour360-popup.placement-left .tour360-arrow {
                    right: -10px;
                    border-width: 10px 0 10px 10px;
                    border-color: transparent transparent transparent #ffffff;
                }
                .tour360-popup.placement-right .tour360-arrow {
                    left: -10px;
                    border-width: 10px 10px 10px 0;
                    border-color: transparent #ffffff transparent transparent;
                }
                
                /* Contenidos */
                .tour360-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .tour360-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: #0f766e; /* Color corporativo primario */
                    margin: 0;
                }
                .tour360-content {
                    font-size: 15px;
                    line-height: 1.5;
                    color: #334155;
                    margin-bottom: 24px;
                }
                
                /* Botonera */
                .tour360-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .tour360-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex: 1;
                }
                .tour360-btn {
                    background: transparent;
                    border: none;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 6px;
                }
                .tour360-btn-skip {
                    color: #94a3b8;
                    margin-right: auto;
                }
                .tour360-btn-prev {
                    color: #64748b;
                }
                .tour360-btn-next {
                    color: #0f766e;
                    font-weight: 800;
                }
            `;
            document.head.appendChild(style);
        },

        init() {
            this._injectStyles();
            
            // Mask
            if (!document.getElementById(this._overlayId)) {
                const mask = document.createElement('div');
                mask.id = this._overlayId;
                mask.className = 'tour360-mask';
                mask.style.display = 'none';
                document.body.appendChild(mask);
            }
            
            // Tooltip
            if (!document.getElementById(this._tooltipId)) {
                const tt = document.createElement('div');
                tt.id = this._tooltipId;
                tt.className = 'tour360-popup';
                tt.style.display = 'none';
                tt.innerHTML = `
                    <div class="tour360-arrow" id="tour360-arrow"></div>
                    <div class="tour360-header">
                        <h3 class="tour360-title" id="tour360-title"></h3>
                    </div>
                    <div class="tour360-content" id="tour360-content"></div>
                    <div class="tour360-footer">
                        <div class="tour360-actions">
                            <button class="tour360-btn tour360-btn-skip" id="tour360-skip">Saltar</button>
                            <button class="tour360-btn tour360-btn-prev" id="tour360-prev">Atrás</button>
                            <button class="tour360-btn tour360-btn-next" id="tour360-next">Siguiente</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(tt);
                
                // Eventos de botones
                document.getElementById('tour360-skip').onclick = () => Engine.end(false);
                document.getElementById('tour360-prev').onclick = () => Engine.prev();
                document.getElementById('tour360-next').onclick = () => Engine.next();
            }
        },

        showStep(step, stepIndex, totalSteps) {
            this._isActive = true;
            const mask = document.getElementById(this._overlayId);
            const tt = document.getElementById(this._tooltipId);
            
            // Temporarily show tooltip to get its dimensions invisibly
            tt.style.display = 'block';
            tt.classList.remove('active');
            
            // Configurar textos
            document.getElementById('tour360-title').innerHTML = step.title || 'Información';
            document.getElementById('tour360-content').innerHTML = step.content || '';
            
            const btnPrev = document.getElementById('tour360-prev');
            const btnNext = document.getElementById('tour360-next');
            
            btnPrev.style.visibility = stepIndex === 0 ? 'hidden' : 'visible';
            btnNext.innerText = stepIndex === totalSteps - 1 ? 'Finalizar' : 'Siguiente';
            
            // Retraso para calcular posición (permite que la UI de la app termine de renderizar)
            setTimeout(() => {
                const ttRect = tt.getBoundingClientRect();
                const coords = Positioning.getCoords(step.target, step.placement, ttRect);
                
                if (!coords) {
                    console.warn("Tour360: Target no encontrado ->", step.target);
                    // Si no se encuentra, mostrar en el centro (fallback)
                    mask.style.display = 'none';
                    tt.style.top = '50%';
                    tt.style.left = '50%';
                    tt.style.transform = 'translate(-50%, -50%)';
                    tt.classList.add('active');
                    document.getElementById('tour360-arrow').style.display = 'none';
                    return;
                }

                // Aplicar máscara
                mask.style.display = 'block';
                mask.style.top = coords.highlight.top + 'px';
                mask.style.left = coords.highlight.left + 'px';
                mask.style.width = coords.highlight.width + 'px';
                mask.style.height = coords.highlight.height + 'px';
                mask.style.borderRadius = coords.highlight.borderRadius;

                // Aplicar tooltip
                tt.className = 'tour360-popup active placement-' + coords.tooltip.placement;
                tt.style.top = coords.tooltip.top + 'px';
                tt.style.left = coords.tooltip.left + 'px';
                tt.style.transform = 'none'; // Quitar fallback de transform
                
                // Aplicar flecha
                const arrow = document.getElementById('tour360-arrow');
                arrow.style.display = 'block';
                
                if (coords.tooltip.placement === 'bottom' || coords.tooltip.placement === 'top') {
                    arrow.style.left = (coords.tooltip.arrowLeft - 10) + 'px';
                    arrow.style.top = '';
                } else {
                    arrow.style.top = (coords.tooltip.arrowTop - 10) + 'px';
                    arrow.style.left = '';
                }

                // Scroll suave al elemento si está fuera de pantalla
                const el = document.querySelector(step.target);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                }

            }, 100); // 100ms permite que el DOM del framework original se estabilice
        },

        hide() {
            this._isActive = false;
            const mask = document.getElementById(this._overlayId);
            const tt = document.getElementById(this._tooltipId);
            if (mask) mask.style.display = 'none';
            if (tt) {
                tt.classList.remove('active');
                setTimeout(() => {
                    if (!this._isActive) tt.style.display = 'none';
                }, 300);
            }
        }
    };

    // ---------------------------------------------------------
    // 5. ENGINE: Lógica del Tutorial y Navegación
    // ---------------------------------------------------------
    const Engine = {
        _currentTutorial: null,
        _currentIndex: 0,
        _resizeListener: null,

        start(tutorialId, forceRestart = false) {
            const tut = Registry.get(tutorialId);
            if (!tut) {
                console.error("Tour360: Tutorial no registrado ->", tutorialId);
                return;
            }

            // Evaluar condiciones
            if (tut.condiciones && typeof tut.condiciones === 'function' && !tut.condiciones()) {
                console.log("Tour360: Condiciones no cumplidas para iniciar ->", tutorialId);
                return;
            }

            const progress = Storage.getProgress(tutorialId);
            if (progress.completed && !forceRestart) {
                console.log("Tour360: Tutorial ya completado previamente ->", tutorialId);
                return;
            }

            Renderer.init();
            this._currentTutorial = tut;
            this._currentIndex = (forceRestart || progress.currentStep >= tut.pasos.length) ? 0 : progress.currentStep || 0;
            
            this._bindResize();
            this._renderCurrentStep();
        },

        next() {
            if (!this._currentTutorial) return;
            
            // Ejecutar hook de salida si existe
            const currentStepDef = this._currentTutorial.pasos[this._currentIndex];
            if (currentStepDef.onAfterExit) currentStepDef.onAfterExit();

            this._currentIndex++;
            Storage.updateProgress(this._currentTutorial.id, { currentStep: this._currentIndex });

            if (this._currentIndex >= this._currentTutorial.pasos.length) {
                this.end(true);
            } else {
                this._renderCurrentStep();
            }
        },

        prev() {
            if (!this._currentTutorial || this._currentIndex <= 0) return;
            this._currentIndex--;
            Storage.updateProgress(this._currentTutorial.id, { currentStep: this._currentIndex });
            this._renderCurrentStep();
        },

        end(completed = false) {
            if (!this._currentTutorial) return;
            
            if (completed) {
                Storage.markCompleted(this._currentTutorial.id);
            } else {
                // Si saltó, guardar el paso en el que se quedó para retomarlo
                Storage.updateProgress(this._currentTutorial.id, { currentStep: this._currentIndex });
            }

            Renderer.hide();
            this._unbindResize();
            this._currentTutorial = null;
        },

        _renderCurrentStep() {
            if (!this._currentTutorial) return;
            const step = this._currentTutorial.pasos[this._currentIndex];
            
            // Ejecutar hook de entrada si existe
            if (step.onBeforeEnter) step.onBeforeEnter();
            
            Renderer.showStep(step, this._currentIndex, this._currentTutorial.pasos.length);
        },

        _bindResize() {
            if (this._resizeListener) return;
            this._resizeListener = () => {
                if (this._currentTutorial) {
                    // Recalcular posiciones
                    this._renderCurrentStep();
                }
            };
            window.addEventListener('resize', this._resizeListener);
            // También escuchar orientacion
            window.addEventListener('orientationchange', () => setTimeout(this._resizeListener, 300));
        },

        _unbindResize() {
            if (this._resizeListener) {
                window.removeEventListener('resize', this._resizeListener);
                this._resizeListener = null;
            }
        }
    };

    // Exponer API Pública del Framework
    global.Tour360 = {
        Registry,
        Engine,
        Storage,
        
        // Atajos útiles
        start: (id, force) => Engine.start(id, force),
        register: (obj) => Registry.register(obj),
        reset: (id) => Storage.reset(id)
    };

    // ==========================================
    // TUTORIAL OFICIAL: BIENVENIDA (INICIO)
    // ==========================================
    global.Tour360.register({
        id: "tour-inicio",
        nombre: "Bienvenido a Aula 360 HN",
        categoria: "global",
        version: "1.0",
        pasos: [
            {
                target: ".a360-header", 
                title: "Centro de Control",
                content: "Te damos la bienvenida a tu Cuadro de Mando. Aquí verás el resumen y las alertas más importantes de tu día a día.",
                placement: "bottom"
            },
            {
                target: "#active-course-btn", 
                title: "Selector Global de Curso",
                content: "Todo en Aula 360 HN funciona por curso. Asegúrate de tener seleccionado aquí el grado y sección que vas a gestionar antes de entrar a los módulos.",
                placement: "bottom"
            },
            {
                target: "div.stat-card[onclick*='asistencia']", 
                title: "Registro de Asistencia",
                content: "El núcleo de tu día. Aquí podrás pasar lista rápidamente y el sistema calculará el porcentaje de ausentismo automáticamente.",
                placement: "bottom"
            },
            {
                target: "div.stat-card[onclick*='evaluacion']", 
                title: "Gestión de Notas",
                content: "Desde aquí puedes crear tus dimensiones (Trabajo en Clase, Tareas, Examen, etc.) y registrar las calificaciones de cada actividad.",
                placement: "bottom"
            },
            {
                target: "div.stat-card[onclick*='estudiantes']", 
                title: "Control de Matrícula",
                content: "Visualiza, agrega o edita los estudiantes matriculados en este curso. Incluso puedes importarlos masivamente desde Excel.",
                placement: "top"
            },
            {
                target: "div.stat-card[onclick*='sart']", 
                title: "Sistema Preventivo SART",
                content: "La inteligencia de Aula 360 detectará automáticamente a los alumnos en riesgo de reprobar por bajas notas o ausencias, y te sugerirá acciones.",
                placement: "top"
            },
            {
                target: "button[onclick*='bitacora']", 
                title: "Accesos Rápidos (Bitácora)",
                content: "Utiliza estos botones rápidos para acciones que requieren inmediatez, como anotar una incidencia disciplinaria en la bitácora.",
                placement: "bottom"
            },
            {
                target: "#gdhn-sidebar", 
                title: "Explora Todo el Sistema",
                content: "¡Esto es solo una fracción de Aula 360 HN! Explora el menú lateral para descubrir el Cuadro Controlador, Reportes, Planeaciones y mucho más.",
                placement: "right"
            }
        ]
    });

})(window);
