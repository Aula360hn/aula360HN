/**
 * Tutor 360 - Copiloto del Aula (Aula 360 HN)
 * Mantiene la identidad visual del Avatar 3D original con Sistema de Estados Reactivos
 * 
 * Estados operacionales:
 * 1. 'idle': Inactivo / Esperando (Ojos sonrientes, mirada despierta, halo verde institucional)
 * 2. 'thinking': Pensando / Procesando (Foco visor concentrado, pulso de datos en visor, halo azul/turquesa)
 * 3. 'searching': Buscando (Ojo curioso + lente/radar holográfico, escaneo lateral)
 * 4. 'success': Guardado exitoso / Listo (Ojos arqueados felices ^ ^, sonrisa celebratoria, destellos dorados)
 */

(function(window) {
    'use strict';

    const Tutor360 = {
        name: 'Tutor 360',
        app: 'Aula 360 HN',
        currentState: 'idle',
        subscribers: [],
        reactionTimeout: null,
        _searchListenerAttached: false,

        getState() {
            return this.currentState;
        },

        /**
         * Cambiar estado reactivo con animación en tiempo real sobre el avatar 3D
         * @param {'idle'|'thinking'|'searching'|'success'} stateId 
         * @param {Object} options - { duration: ms, message: string }
         */
        setState(stateId, options = {}) {
            const validStates = ['idle', 'thinking', 'searching', 'success'];
            if (!validStates.includes(stateId)) stateId = 'idle';

            this.currentState = stateId;

            if (this.reactionTimeout) {
                clearTimeout(this.reactionTimeout);
                this.reactionTimeout = null;
            }

            // Actualizar todos los visores y círculos del avatar en el DOM
            document.querySelectorAll('.copilot-avatar-circle, .tutor360-reactive-avatar').forEach(circle => {
                circle.setAttribute('data-state', stateId);
                circle.className = circle.className.replace(/\bstate-[a-z]+\b/g, '').trim() + ` state-${stateId}`;

                // Actualizar ojos del visor
                const eyesContainer = circle.querySelector('.copilot-eyes-container');
                if (eyesContainer) {
                    eyesContainer.innerHTML = this.getVisorSvg(stateId);
                    if (stateId === 'idle') {
                        eyesContainer.classList.add('is-idle-gaze');
                    } else {
                        eyesContainer.classList.remove('is-idle-gaze');
                    }
                }

                // Decoraciones extra (destellos de éxito)
                let extraContainer = circle.querySelector('.tutor360-extra-fx');
                if (!extraContainer) {
                    extraContainer = document.createElement('div');
                    extraContainer.className = 'tutor360-extra-fx';
                    extraContainer.style.cssText = 'position:absolute; inset:0; pointer-events:none; z-index:6; overflow:visible;';
                    const frontFace = circle.querySelector('.copilot-face-front') || circle;
                    frontFace.appendChild(extraContainer);
                }
                extraContainer.innerHTML = this.getExtraFx(stateId);

                // Actualizar estilo visual del círculo según estado
                if (stateId === 'thinking') {
                    circle.style.borderColor = '#38bdf8';
                    circle.style.boxShadow = '0 0 22px rgba(56, 189, 248, 0.75), 0 2px 8px rgba(0, 0, 0, 0.25)';
                } else if (stateId === 'searching') {
                    circle.style.borderColor = '#06b6d4';
                    circle.style.boxShadow = '0 0 22px rgba(6, 182, 212, 0.75), 0 2px 8px rgba(0, 0, 0, 0.25)';
                } else if (stateId === 'success') {
                    circle.style.borderColor = '#facc15';
                    circle.style.boxShadow = '0 0 26px rgba(250, 204, 21, 0.85), 0 0 16px rgba(16, 185, 129, 0.6)';
                } else {
                    circle.style.borderColor = '#10b981';
                    circle.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.55), 0 2px 8px rgba(0, 0, 0, 0.25)';
                }

                // Actualizar beacon
                const parent = circle.closest('.copilot-avatar-trigger') || circle.parentElement;
                if (parent) {
                    const beacon = parent.querySelector('.copilot-beacon, .tutor360-status-beacon');
                    if (beacon) {
                        beacon.className = beacon.className.replace(/\bbeacon-[a-z]+\b/g, '').trim() + ` beacon-${stateId}`;
                        beacon.setAttribute('title', `Tutor 360: ${stateId}`);
                        if (stateId === 'thinking') {
                            beacon.style.background = '#38bdf8';
                            beacon.style.boxShadow = '0 0 8px #38bdf8';
                        } else if (stateId === 'searching') {
                            beacon.style.background = '#06b6d4';
                            beacon.style.boxShadow = '0 0 8px #06b6d4';
                        } else if (stateId === 'success') {
                            beacon.style.background = '#facc15';
                            beacon.style.boxShadow = '0 0 10px #facc15';
                        } else {
                            beacon.style.background = '#10b981';
                            beacon.style.boxShadow = '0 0 6px rgba(16, 185, 129, 0.8)';
                        }
                    }
                }
            });

            // Si tiene duración, retornar a idle
            if (options.duration && options.duration > 0) {
                this.reactionTimeout = setTimeout(() => {
                    this.setState('idle');
                }, options.duration);
            }

            this.subscribers.forEach(fn => {
                try { fn(stateId, options); } catch(e) { console.error('Tutor360 subscriber error:', e); }
            });
        },

        subscribe(fn) {
            if (typeof fn === 'function') {
                this.subscribers.push(fn);
            }
        },

        react(stateId, duration = 2800) {
            this.setState(stateId, { duration });
        },

        /**
         * Renderizar HTML del componente con el Avatar 3D real
         */
        render(cfg = {}) {
            const size = cfg.size || 42;
            const state = cfg.state || this.currentState || 'idle';
            const showBadge = cfg.showBadge !== false;
            const idAttr = cfg.id ? `id="${cfg.id}"` : '';
            const onClickAttr = cfg.onClick ? `onclick="${cfg.onClick}"` : '';
            const customClass = cfg.className || '';

            return `
                <div ${idAttr} class="copilot-avatar-trigger tutor360-widget-container ${customClass}" ${onClickAttr} title="Tutor 360 - Copiloto Académico" style="cursor:pointer; width:${size}px; height:${size}px; display:inline-flex; align-items:center; justify-content:center; position:relative;">
                    <div class="copilot-avatar-circle tutor360-reactive-avatar state-${state}" data-size="${size}" data-state="${state}" style="width:${size}px; height:${size}px;"><div class="copilot-face copilot-face-front"><img src="assistant_avatar_head.png" alt="Tutor 360" class="copilot-avatar-standalone" /></div><div class="copilot-face copilot-face-back"><img src="assistant_avatar_head_wink.png" alt="Tutor 360 - Guiño" class="copilot-avatar-standalone" /></div></div>
                    ${showBadge ? `
                        <span class="copilot-beacon tutor360-status-beacon beacon-${state}" title="En línea"></span>
                    ` : ''}
                </div>
            `;
        },

        /**
         * SVG reactivo dentro del visor oscuro del robot 3D
         */
        getVisorSvg(state) {
            switch(state) {
                case 'thinking':
                    return `
                        <svg class="copilot-eyes-svg" viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg">
                            <!-- Ojos Concentrados / Foco de Procesamiento -->
                            <rect x="22" y="27" width="18" height="5" rx="2.5" fill="#38BDF8">
                                <animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite" />
                            </rect>
                            <rect x="60" y="27" width="18" height="5" rx="2.5" fill="#38BDF8">
                                <animate attributeName="opacity" values="1;0.35;1" dur="0.9s" repeatCount="indefinite" />
                            </rect>
                            <!-- Puntos de sinapsis y cálculo pedagógico -->
                            <circle cx="43" cy="43" r="2.5" fill="#34D399"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.75s" repeatCount="indefinite" /></circle>
                            <circle cx="50" cy="43" r="2.5" fill="#34D399"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.75s" begin="0.25s" repeatCount="indefinite" /></circle>
                            <circle cx="57" cy="43" r="2.5" fill="#34D399"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.75s" begin="0.5s" repeatCount="indefinite" /></circle>
                        </svg>
                    `;

                case 'searching':
                    return `
                        <svg class="copilot-eyes-svg" viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg">
                            <!-- Ojo izquierdo curioso mirando de lado a lado -->
                            <circle cx="28" cy="30" r="5" fill="#34D399">
                                <animate attributeName="cx" values="24;32;24" dur="1.8s" repeatCount="indefinite" />
                            </circle>
                            <!-- Lente radar holográfica en ojo derecho -->
                            <g transform="translate(68, 30)">
                                <circle cx="0" cy="0" r="9" fill="none" stroke="#38BDF8" stroke-width="2">
                                    <animate attributeName="r" values="7;11;7" dur="1.3s" repeatCount="indefinite" />
                                </circle>
                                <line x1="-6" y1="0" x2="6" y2="0" stroke="#38BDF8" stroke-width="1.5" />
                                <line x1="0" y1="-6" x2="0" y2="6" stroke="#38BDF8" stroke-width="1.5" />
                                <circle cx="0" cy="0" r="3.5" fill="#34D399" />
                            </g>
                            <path d="M 44 45 Q 50 49 56 45" fill="none" stroke="#34D399" stroke-width="2.5" stroke-linecap="round" />
                        </svg>
                    `;

                case 'success':
                    return `
                        <svg class="copilot-eyes-svg" viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg">
                            <!-- Ojos arqueados super felices (^ ^) -->
                            <path d="M 20 32 Q 29 18 38 32" fill="none" stroke="#FDE047" stroke-width="4.5" stroke-linecap="round" />
                            <path d="M 62 32 Q 71 18 80 32" fill="none" stroke="#FDE047" stroke-width="4.5" stroke-linecap="round" />
                            <!-- Gran Sonrisa Abierta y Radiante -->
                            <path d="M 38 43 Q 50 56 62 43" fill="none" stroke="#34D399" stroke-width="3.5" stroke-linecap="round" />
                        </svg>
                    `;

                case 'idle':
                default:
                    return `
                        <svg class="copilot-eyes-svg" viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg">
                            <path class="copilot-eye-left" d="M 22 30 C 22 18, 38 18, 38 30" fill="none" stroke="#34d399" stroke-width="4.5" stroke-linecap="round" />
                            <path class="copilot-eye-right" d="M 62 30 C 62 18, 78 18, 78 30" fill="none" stroke="#34d399" stroke-width="4.5" stroke-linecap="round" />
                            <path class="copilot-mouth" d="M 40 46 C 45 56, 55 56, 60 46" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round" />
                        </svg>
                    `;
            }
        },

        getExtraFx(state) {
            if (state === 'success') {
                return `
                    <svg viewBox="0 0 100 100" style="position:absolute; inset:0; width:100%; height:100%; overflow:visible;">
                        <!-- Destellos de Éxito / Estrellitas doradas -->
                        <path d="M 12 18 L 14 13 L 16 18 L 21 20 L 16 22 L 14 27 L 12 22 L 7 20 Z" fill="#FACC15">
                            <animateTransform attributeName="transform" type="rotate" from="0 14 20" to="360 14 20" dur="3s" repeatCount="indefinite"/>
                        </path>
                        <path d="M 84 18 L 86 13 L 88 18 L 93 20 L 88 22 L 86 27 L 84 22 L 79 20 Z" fill="#FACC15">
                            <animateTransform attributeName="transform" type="rotate" from="360 86 20" to="0 86 20" dur="3s" repeatCount="indefinite"/>
                        </path>
                    </svg>
                `;
            }
            return '';
        },

        init() {
            // Renderizar avatar en el contenedor de navegación si existe y está vacío
            const navContainer = document.getElementById('navbar-tutor360-container');
            if (navContainer && !navContainer.querySelector('.copilot-avatar-circle')) {
                navContainer.innerHTML = this.render({ size: 42, state: this.currentState, showBadge: true });
            }

            // Escuchar inputs de búsqueda o filtros para activar estado searching automáticamente
            if (!this._searchListenerAttached && typeof document !== 'undefined') {
                this._searchListenerAttached = true;
                document.addEventListener('input', (e) => {
                    const target = e.target;
                    if (!target) return;
                    const isSearch = target.type === 'search' || 
                        target.id === 'search-input' ||
                        target.id === 'aseo-student-search' ||
                        (target.placeholder && /buscar|filtrar|filtro/i.test(target.placeholder)) ||
                        (target.className && typeof target.className === 'string' && /search|filter/i.test(target.className));
                    
                    if (isSearch && target.value && target.value.trim().length > 0) {
                        if (this.currentState !== 'searching') {
                            this.react('searching', 2200);
                        }
                    }
                }, true);
            }
        }
    };

    window.Tutor360 = Tutor360;

    // Auto-inicialización en carga del DOM
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => Tutor360.init());
        } else {
            Tutor360.init();
        }
    }
})(window);
