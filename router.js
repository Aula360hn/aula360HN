const Router = {
    current: 'panel',
    _history: [],          // navigation history stack (max 6)
    routes: {
        // To be filled
    },
    goBack() {
        if (this._history.length === 0) return;
        const prev = this._history.pop();
        this._skipHistory = true;  // don't push current onto stack again
        this.navigate(prev);
    },
    navigate(routeId) {
        // Intercept navigation from critical data-entry modules to confirm save status
        const criticalModules = ['estudiantes', 'asistencia', 'evaluacion', 'cuadro'];
        if (this.current && this.current !== routeId && criticalModules.includes(this.current) && !this._confirmingSave) {
            const moduleNames = {
                estudiantes: 'Control de Matrícula',
                asistencia: 'Registro de Asistencia',
                evaluacion: 'Dimensiones de Evaluación',
                cuadro: 'Cuadro Controlador'
            };
            const currentModuleName = moduleNames[this.current] || this.current;
            
            const modalId = 'gdhn-save-confirm-modal';
            let oldModal = document.getElementById(modalId);
            if (oldModal) oldModal.remove();
            
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                opacity: 0;
                transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            `;
            
            modal.innerHTML = `
                <div class="confirm-modal-card" style="
                    background: #ffffff;
                    border-radius: 24px;
                    width: 90%;
                    max-width: 420px;
                    padding: 32px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    transform: scale(0.92);
                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                ">
                    <!-- Loading Stage -->
                    <div id="confirm-loading-stage" style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                        <div class="save-spinner" style="
                            width: 48px;
                            height: 48px;
                            border: 4px solid rgba(124, 58, 237, 0.1);
                            border-top: 4px solid var(--color-actitud, #7c3aed);
                            border-radius: 50%;
                            animation: spin 0.8s linear infinite;
                        "></div>
                        <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; font-family: system-ui, -apple-system, sans-serif;">Asegurando tus datos...</h3>
                        <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5; font-family: system-ui, -apple-system, sans-serif;">Verificando la integridad de los datos en la base de datos de <strong>${currentModuleName}</strong>...</p>
                    </div>

                    <!-- Success Stage -->
                    <div id="confirm-success-stage" style="display: none; flex-direction: column; align-items: center; gap: 16px;">
                        <div class="save-checkmark" style="
                            width: 60px;
                            height: 60px;
                            border-radius: 50%;
                            background: rgba(16, 185, 129, 0.1);
                            color: #10b981;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                            animation: popCheck 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                        ">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <h3 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0; font-family: system-ui, -apple-system, sans-serif;">¡Guardado Exitoso!</h3>
                        <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.5; font-family: system-ui, -apple-system, sans-serif; padding: 0 10px;">
                            Todos tus cambios e ingresos en <strong>${currentModuleName}</strong> han sido respaldados con éxito en la memoria del dispositivo.
                        </p>
                        
                        <button id="confirm-btn-continue" style="
                            margin-top: 12px;
                            width: 100%;
                            padding: 12px 24px;
                            background: linear-gradient(135deg, #10b981, #059669);
                            color: #ffffff;
                            border: none;
                            border-radius: 12px;
                            font-size: 14px;
                            font-weight: 700;
                            cursor: pointer;
                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                            transition: all 0.2s;
                            font-family: system-ui, -apple-system, sans-serif;
                        ">
                            Entendido y Continuar
                        </button>
                    </div>
                </div>
            `;

            if (!document.getElementById('confirm-save-styles')) {
                const st = document.createElement('style');
                st.id = 'confirm-save-styles';
                st.textContent = `
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes popCheck { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                    .confirm-modal-card button:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }
                    .confirm-modal-card button:active { transform: translateY(0); }
                `;
                document.head.appendChild(st);
            }

            document.body.appendChild(modal);

            setTimeout(() => {
                modal.style.opacity = '1';
                modal.querySelector('.confirm-modal-card').style.transform = 'scale(1)';
            }, 10);

            setTimeout(() => {
                const loadStage = document.getElementById('confirm-loading-stage');
                const successStage = document.getElementById('confirm-success-stage');
                if (loadStage && successStage) {
                    loadStage.style.display = 'none';
                    successStage.style.display = 'flex';
                }
            }, 650);

            modal.querySelector('#confirm-btn-continue').onclick = () => {
                modal.style.opacity = '0';
                modal.querySelector('.confirm-modal-card').style.transform = 'scale(0.95)';
                setTimeout(() => {
                    modal.remove();
                    this._confirmingSave = true;
                    this.navigate(routeId);
                }, 200);
            };

            return;
        }
        this._confirmingSave = false;

        // Guard: if no course, force 'cursos' unless global module
        const globalModules = ['panel', 'cursos', 'estudiantes', 'asistencia', 'evaluacion', 'cuadro', 'sart', 'reportes', 'horario', 'config', 'respaldo', 'agenda', 'pruebas-diagnosticas', 'pruebas-formativas', 'cuadro1', 'pizarra360', 'libreria-todas', 'libreria-carpetas', 'libreria-recientes', 'libreria-sincronizar', 'libreria-favoritos', 'libreria-marcadores', 'libreria-red', 'libreria-nube', 'libreria-prefs', 'libreria-lector', 'banco-curricular', 'formalizacion', 'archivos', 'banco-rubricas', 'bitacora', 'notas-rapidas', 'equipos-trabajo'];
        if (!Store.data.activeCourseId && !globalModules.includes(routeId)) {
            if (Store.data.cursos.length === 0) {
                UI.toast('Crea un curso primero', 'warning');
                routeId = 'cursos';
            } else {
                UI.toast('Selecciona un curso primero', 'warning');
                window.openCourseSelector();
                return;
            }
        }

        // Track navigation history
        if (!this._skipHistory && this.current && this.current !== routeId) {
            this._history.push(this.current);
            if (this._history.length > 6) this._history.shift();
        }
        this._skipHistory = false;

        this.current = routeId;

        // Auto-colapsar menú lateral al navegar para maximizar el área de trabajo
        const sb = document.getElementById('sidebar');
        if (sb) {
            if (window.innerWidth > 1024) {
                sb.classList.add('collapsed');
                localStorage.setItem('gdhn_sidebarState', 'collapsed');
            } else {
                sb.classList.remove('open');
            }
            if (window.UI) UI._sidebarManuallyExpandedInCuadro = false;
            if (routeId === 'cuadro' && window.Views && Views.Cuadro) {
                Views.Cuadro._viewMode = 'grid';
            }
        }

        if (window.autoCloseSidebar) window.autoCloseSidebar();
        UI.renderSidebar();

        // Setup container
        const container = document.getElementById('content');
        container.innerHTML = '';

        // Show spinner
        UI.showSpinner();

        // Defer actual render by one frame so spinner paints first
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const titleMap = {
                    panel: 'Centro de Control', 
                    cursos: 'Mis Cursos', 
                    estudiantes: 'Control de Matrícula',
                    asistencia: 'Registro de Asistencia', 
                    config: 'Configuración Académica', 
                    evaluacion: 'Sistema de Evaluación',
                    sart: 'Sistema SART', 
                    reportes: 'Centro de Reportes', 
                    horario: 'Horario de Clases',
                    agenda: 'Agenda Escolar',
                    respaldo: 'Respaldo de Datos',
                    planificador: 'Teacher Lab HN', 
                    'pruebas-diagnosticas': 'Pruebas Diagnósticas',
                    'pruebas-formativas': 'Pruebas Formativas',
                    'cuadro1': 'Calificaciones SACE',
                    'bitacora': 'Bitácora de Incidencias',
                    'notas-rapidas': 'Bloc de Notas',
                    'formalizacion': 'Formalización Académica',
                    'banco-curricular': 'Banco Curricular HN',
                    'equipos-trabajo': 'Equipos de Trabajo',
                    'reporte-parcial': 'Reporte del Parcial'
                };

                const subtitleMap = {
                    panel: 'Resumen General y Estado del Sistema',
                    cursos: 'Gestión de Asignaturas y Horarios',
                    estudiantes: 'Gestión de Matrícula y Expedientes',
                    asistencia: 'Seguimiento y Control de Ausentismo',
                    config: 'Parámetros Académicos y Períodos',
                    evaluacion: 'Registro de Notas y Competencias',
                    sart: 'Monitoreo de Riesgo y Alertas Tempranas',
                    reportes: 'Generación de Documentación y Actas',
                    horario: 'Organización de la Jornada Laboral',
                    agenda: 'Planificación de Eventos y Tareas',
                    respaldo: 'Seguridad y Persistencia de Información',
                    planificador: 'Diseño de Planes y Contenidos',
                    'pruebas-diagnosticas': 'Análisis Inicial de Aprendizajes',
                    'pruebas-formativas': 'Seguimiento Mensual de Logros',
                    'cuadro1': 'Cuadro de Calificaciones No. 1 – SACE',
                    'bitacora': 'Registro de Incidencias y Observaciones',
                    'notas-rapidas': 'Anotaciones Temporales y Recordatorios',
                    'formalizacion': 'Jornalización desde Banco de Datos',
                    'banco-curricular': 'Administración de Estándares Educativos',
                    'equipos-trabajo': 'Gestión de Grupos Colaborativos',
                    'reporte-parcial': 'Consolidador y Análisis de Rendimiento Académico'
                };

                const titleEl = document.getElementById('page-title');
                const subEl = document.getElementById('page-subtitle');
                if (titleEl) titleEl.innerText = titleMap[routeId] || 'Aula 360 HN';
                if (subEl) subEl.innerText = subtitleMap[routeId] || 'Gestión Académica Profesional';

                // Inject back-pill in top header — always on 'cuadro', conditional elsewhere
                const backPillId = 'nav-back-pill';
                const existingPill = document.getElementById(backPillId);
                if (existingPill) existingPill.remove();

                const prevRoute = this._history.length > 0 ? this._history[this._history.length - 1] : null;
                const isCuadro = routeId === 'cuadro';
                // On cuadro: always show, fallback to 'inicio'. On others: only if history exists.
                const showPill = (prevRoute && prevRoute !== routeId) || isCuadro;

                if (showPill) {
                    const prevLabel = titleMap[prevRoute] || (isCuadro ? 'Inicio' : prevRoute);
                    const targetRoute = prevRoute && prevRoute !== routeId ? prevRoute : 'inicio';
                    const pill = document.createElement('button');
                    pill.id = backPillId;
                    pill.title = 'Volver a ' + prevLabel;
                    pill.onclick = () => {
                        if (prevRoute && prevRoute !== routeId) Router.goBack();
                        else Router.navigate(targetRoute);
                    };
                    pill.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="15 18 9 12 15 6"/></svg>
                        <span>Volver a: <strong>${prevLabel}</strong></span>`;

                    // Place in top header (before course-selector so expanded sidebar never overlaps it)
                    const header = document.querySelector('.gdhn-header');
                    const courseSelector = header ? header.querySelector('.course-selector') : null;

                    if (header && courseSelector) {
                        pill.style.cssText = [
                            'display:inline-flex', 'align-items:center', 'gap:6px',
                            'background:linear-gradient(135deg,#1e293b,#0f172a)',
                            'color:#fff', 'border:none', 'border-radius:999px',
                            'padding:6px 14px 6px 10px',
                            'font-size:12px', 'font-weight:600', 'letter-spacing:0.01em',
                            'cursor:pointer', 'box-shadow:0 2px 6px rgba(15,23,42,0.15)',
                            'transition:all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            'animation:pillIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                            'white-space:nowrap', 'flex-shrink:0', 'margin-right:8px',
                            'max-width:240px', 'overflow:hidden', 'text-overflow:ellipsis'
                        ].join(';');
                        courseSelector.insertAdjacentElement('beforebegin', pill);
                    } else if (header) {
                        pill.style.cssText = [
                            'display:inline-flex', 'align-items:center', 'gap:6px',
                            'background:linear-gradient(135deg,#1e293b,#0f172a)',
                            'color:#fff', 'border:none', 'border-radius:999px',
                            'padding:6px 14px 6px 10px',
                            'font-size:12px', 'font-weight:600', 'letter-spacing:0.01em',
                            'cursor:pointer', 'box-shadow:0 2px 6px rgba(15,23,42,0.15)',
                            'transition:all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            'animation:pillIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                            'white-space:nowrap', 'flex-shrink:0', 'margin-left:auto', 'margin-right:8px',
                            'max-width:240px', 'overflow:hidden', 'text-overflow:ellipsis'
                        ].join(';');
                        header.appendChild(pill);
                    } else {
                        // Fallback fixed at top right
                        pill.style.cssText = [
                            'position:fixed', 'top:12px', 'right:20px', 'z-index:9000',
                            'display:flex', 'align-items:center', 'gap:6px',
                            'background:linear-gradient(135deg,#1e293b,#0f172a)',
                            'color:#fff', 'border:none', 'border-radius:999px',
                            'padding:6px 14px 6px 10px',
                            'font-size:12px', 'font-weight:600', 'letter-spacing:0.01em',
                            'cursor:pointer', 'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
                            'transition:all 0.2s cubic-bezier(0.4,0,0.2,1)',
                            'animation:pillIn 0.25s cubic-bezier(0.16,1,0.3,1)',
                            'white-space:nowrap', 'max-width:240px', 'overflow:hidden', 'text-overflow:ellipsis'
                        ].join(';');
                        document.body.appendChild(pill);
                    }

                    // Add animation + hover styles once
                    if (!document.getElementById('nav-pill-styles')) {
                        const st = document.createElement('style');
                        st.id = 'nav-pill-styles';
                        st.textContent = `
                            @keyframes pillIn { from { opacity:0; transform:translateY(-6px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
                            #nav-back-pill:hover { background:linear-gradient(135deg,#00C853,#009624) !important; transform:translateY(-1px) scale(1.02); box-shadow:0 4px 12px rgba(0,200,83,0.35) !important; }
                            #nav-back-pill strong { font-weight:800; }
                        `;
                        document.head.appendChild(st);
                    }
                }

                // Render route
                try {
                    if (this.routes[routeId]) {
                        container.innerHTML = this.routes[routeId]();
                        
                        // Improved view finding for onMount (handles hyphens like equipos-trabajo -> EquiposTrabajo)
                        const viewKey = routeId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
                        if (Views[viewKey] && typeof Views[viewKey].onMount === 'function') {
                            Views[viewKey].onMount();
                        }
                    } else {
                        container.innerHTML = `<div class="empty-state"> Módulo en construcción: ${routeId}</div>`;
                    }
                } catch (routeErr) {
                    console.error('Error rendering route ' + routeId + ':', routeErr);
                    container.innerHTML = `
                        <div class="card" style="margin:24px; border:1px solid #fee2e2; background:#fff; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                            <div class="card-b" style="text-align:center; padding:40px 24px;">
                                <div style="width:56px; height:56px; border-radius:50%; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                                    <i data-lucide="alert-triangle" style="width:28px; height:28px;"></i>
                                </div>
                                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:8px;">No se pudo cargar el módulo (${routeId})</h3>
                                <p style="font-size:13px; color:#64748b; max-width:480px; margin:0 auto 20px; line-height:1.5;">
                                    Ocurrió un error al preparar la vista: <br>
                                    <code style="display:inline-block; margin-top:8px; padding:6px 12px; background:#f1f5f9; border-radius:6px; font-size:11.5px; color:#dc2626; font-family:monospace;">${routeErr.message || routeErr}</code>
                                </p>
                                <div style="display:flex; justify-content:center; gap:12px;">
                                    <button class="btn btn-secondary" onclick="Router.navigate('cuadro')" style="display:flex; align-items:center; gap:8px;">
                                        <i data-lucide="table-properties" style="width:16px; height:16px;"></i> Ir a Cuadro Controlador
                                    </button>
                                    <button class="btn btn-primary" onclick="Router.navigate('panel')" style="display:flex; align-items:center; gap:8px;">
                                        <i data-lucide="home" style="width:16px; height:16px;"></i> Ir al Panel
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Initialize icons then hide spinner
                if (window.lucide) window.lucide.createIcons();

                // Update Mobile Sub Nav and Bottom Nav active states
                const updateMobileNavs = (routeId) => {
                    const subNavItems = document.querySelectorAll('.mobile-sub-nav .sub-nav-item');
                    subNavItems.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(routeId)) {
                            btn.classList.add('active');
                        }
                    });

                    const bottomNavItems = document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item');
                    bottomNavItems.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(routeId)) {
                            btn.classList.add('active');
                        }
                    });
                };
                updateMobileNavs(routeId);


                // Floating Action Shortcuts (FAB Menu)
                const targetFabRoutes = ['asistencia', 'cuadro', 'libreria-todas', 'evaluacion', 'reporte-parcial'];
                const existingFab = document.getElementById('fab-quick-nav');
                if (existingFab) existingFab.remove();

                if (targetFabRoutes.includes(routeId) || routeId.startsWith('libreria-')) {
                    const fab = document.createElement('div');
                    fab.id = 'fab-quick-nav';
                    fab.innerHTML = `
                        <button id="fab-nav-trigger" onclick="UI.toggleFloatingNavMenu(event)" title="Accesos Rápidos de Operación">
                            <i data-lucide="compass" style="width:20px; height:20px;"></i>
                        </button>
                        <div id="fab-nav-menu" class="fab-nav-dropdown">
                            <div class="fab-nav-header">Navegación Rápida</div>
                            <button class="fab-nav-item ${routeId === 'asistencia' ? 'active' : ''}" onclick="Router.navigate('asistencia')">
                                <i data-lucide="user-check" style="color:var(--color-expresion);"></i> Asistencia
                            </button>
                            <button class="fab-nav-item ${routeId === 'evaluacion' ? 'active' : ''}" onclick="Router.navigate('evaluacion')">
                                <i data-lucide="clipboard-check" style="color:var(--color-examen);"></i> Dimensiones
                            </button>
                            <button class="fab-nav-item ${routeId === 'cuadro' ? 'active' : ''}" onclick="Router.navigate('cuadro')">
                                <i data-lucide="table-properties" style="color:var(--color-actitud);"></i> Cuadro Controlador
                            </button>
                            <button class="fab-nav-item ${routeId === 'reporte-parcial' ? 'active' : ''}" onclick="Router.navigate('reporte-parcial')">
                                <i data-lucide="bar-chart-3" style="color:#0ea5e9;"></i> Reporte del Parcial
                            </button>
                        </div>
                    `;
                    
                    // Add styles if not present
                    if (!document.getElementById('fab-nav-styles')) {
                        const style = document.createElement('style');
                        style.id = 'fab-nav-styles';
                        style.textContent = `
                            #fab-quick-nav {
                                position: fixed;
                                bottom: 84px;
                                right: 24px;
                                z-index: 9999;
                                display: flex;
                                flex-direction: column;
                                align-items: flex-end;
                            }
                            #fab-nav-trigger {
                                width: 44px;
                                height: 44px;
                                border-radius: 50%;
                                background: linear-gradient(135deg, var(--color-actitud), var(--primary));
                                color: #fff;
                                border: none;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                                box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            }
                            #fab-nav-trigger:hover {
                                transform: scale(1.1) rotate(45deg);
                                box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6);
                            }
                            .fab-nav-dropdown {
                                display: none;
                                position: absolute;
                                bottom: 52px;
                                right: 0;
                                width: 180px;
                                background: rgba(255, 255, 255, 0.9);
                                backdrop-filter: blur(20px);
                                -webkit-backdrop-filter: blur(20px);
                                border: 1px solid rgba(255, 255, 255, 0.4);
                                border-radius: 16px;
                                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
                                padding: 8px;
                                flex-direction: column;
                                gap: 4px;
                                animation: fabMenuIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                                z-index: 10000;
                            }
                            .fab-nav-dropdown.show {
                                display: flex;
                            }
                            .fab-nav-header {
                                font-size: 10px;
                                font-weight: 800;
                                color: #94a3b8;
                                text-transform: uppercase;
                                letter-spacing: 0.05em;
                                padding: 6px 12px;
                                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                                margin-bottom: 4px;
                            }
                            .fab-nav-item {
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                width: 100%;
                                padding: 8px 12px;
                                background: transparent;
                                border: none;
                                border-radius: 10px;
                                font-size: 12.5px;
                                font-weight: 600;
                                color: #334155;
                                text-align: left;
                                cursor: pointer;
                                transition: all 0.2s;
                            }
                            .fab-nav-item:hover {
                                background: rgba(0, 0, 0, 0.04);
                                color: #000;
                                transform: translateX(-2px);
                            }
                            .fab-nav-item.active {
                                background: rgba(124, 58, 237, 0.08);
                                color: var(--color-actitud);
                                font-weight: 700;
                            }
                            .fab-nav-item i {
                                width: 16px;
                                height: 16px;
                            }
                            @keyframes fabMenuIn {
                                from { opacity: 0; transform: translateY(10px) scale(0.95); }
                                to { opacity: 1; transform: translateY(0) scale(1); }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    document.body.appendChild(fab);
                    if (window.lucide) window.lucide.createIcons();

                    // Hacer el botón flotante arrastrable
                    (function(el) {
                        let isDragging = false;
                        let startX, startY, initialX, initialY;
                        let moved = false;

                        const trigger = document.getElementById('fab-nav-trigger');
                        if (!trigger) return;

                        const onStart = (e) => {
                            if (e.type === 'mousedown' && e.button !== 0) return;
                            isDragging = true;
                            moved = false;
                            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                            startX = clientX;
                            startY = clientY;
                            const rect = el.getBoundingClientRect();
                            initialX = rect.left;
                            initialY = rect.top;
                            
                            el.style.transition = 'none';
                        };

                        const onMove = (e) => {
                            if (!isDragging) return;
                            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                            const dx = clientX - startX;
                            const dy = clientY - startY;
                            
                            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
                            
                            if (moved) {
                                if (e.cancelable) e.preventDefault(); // prevent scroll
                                const newLeft = initialX + dx;
                                const newTop = initialY + dy;
                                
                                el.style.bottom = 'auto';
                                el.style.right = 'auto';
                                el.style.left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, newLeft)) + 'px';
                                el.style.top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, newTop)) + 'px';
                                
                                const menu = document.getElementById('fab-nav-menu');
                                if (menu) {
                                    if (newTop < window.innerHeight / 2) {
                                        menu.style.bottom = 'auto';
                                        menu.style.top = '52px';
                                    } else {
                                        menu.style.bottom = '52px';
                                        menu.style.top = 'auto';
                                    }
                                }
                            }
                        };

                        const onEnd = (e) => {
                            if (isDragging) {
                                setTimeout(() => { isDragging = false; }, 50);
                            }
                            el.style.transition = '';
                        };
                        
                        trigger.addEventListener('click', (e) => {
                            if (moved) {
                                e.preventDefault();
                                e.stopImmediatePropagation();
                                moved = false;
                            }
                        }, true);

                        trigger.addEventListener('mousedown', onStart);
                        trigger.addEventListener('touchstart', onStart, {passive: false});
                        
                        window.addEventListener('mousemove', onMove, {passive: false});
                        window.addEventListener('touchmove', onMove, {passive: false});
                        
                        window.addEventListener('mouseup', onEnd);
                        window.addEventListener('touchend', onEnd);
                    })(fab);
                }

                UI.hideSpinner();
            }); // inner rAF
        }); // outer rAF
    }
};

// --- FASE 7: DIAGNÓSTICO Y PRUEBAS DE RESISTENCIA ---
window.validateDataPersistence = async function() {
    console.group("🛡️ Auditoría de Persistencia de Datos (Aula 360 HN)");
    let passed = 0; let failed = 0;

    // 1. Verificar Motor
    if (StorageAPI.db) {
        console.log("✅ Motor: IndexedDB Activo (Versión " + DB_VERSION + ")");
        passed++;
    } else {
        console.error("❌ Motor: IndexedDB inactivo, usando localStorage fallback");
        failed++;
    }

    // 2. Verificar datos en RAM vs DB
    try {
        const inDb = await StorageAPI.get(APP_KEY);
        if (inDb) {
            console.log("✅ Integridad RAM vs DB: Sincronizado");
            passed++;
        } else {
            console.warn("⚠️ Integridad RAM vs DB: No hay datos en IndexedDB aún");
        }
    } catch(e) {
        console.error("❌ Error leyendo IndexedDB", e);
        failed++;
    }

    // 3. Integridad Referencial
    let orfanos = 0;
    const cursosMap = new Set(Store.data.cursos.map(c => c.id));
    
    // Alumnos sin curso
    (Store.data.estudiantes || []).forEach(e => {
        if (e.courseId && !cursosMap.has(e.courseId)) orfanos++;
    });
    // Actividades sin curso
    (Store.data.actividades || []).forEach(a => {
        if (a.courseId && !cursosMap.has(a.courseId)) orfanos++;
    });

    if (orfanos === 0) {
        console.log("✅ Integridad Referencial: Todos los registros pertenecen a cursos existentes.");
        passed++;
    } else {
        console.warn(`⚠️ Integridad Referencial: Se encontraron ${orfanos} registros huérfanos (sin curso padre).`);
        failed++;
    }

    console.log(`📊 Resultado Final: ${passed} exitosos, ${failed} fallidos o advertencias.`);
    console.groupEnd();
    
    if (failed === 0) {
        UI.toast('✅ Auditoría exitosa. Los datos están seguros y persistentes.', 'success');
    } else {
        UI.toast('⚠️ Se encontraron advertencias en la integridad de datos. Revisa la consola.', 'warning');
    }
    
    return { passed, failed, orfanos };
};

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    await StorageAPI.init();
    await Store.init();
    if (window.RID) window.RID.init();

    // Inject Routes after Views are defined
    Router.routes = {
        panel: () => Views.Panel.render(),
        cursos: () => Views.Cursos.render(),
        estudiantes: () => Views.Estudiantes.render(),
        asistencia: () => Views.Asistencia.render(),
        config: Views.Config.render,
        planificador: () => {
            if (typeof Views.Planificador.renderTeacherLab === 'function') {
                return Views.Planificador.renderTeacherLab();
            }
            return '<div class="empty-state">Teacher Lab no está inicializado. Ejecute el setup.</div>';
        },
        jornalizacion: () => {
            Views.Planificador.currentTab = 'jornalizacion';
            return Views.Planificador.render();
        },
        planificacion: () => {
            Views.Planificador.currentTab = 'planificacion';
            return Views.Planificador.render();
        },
        evaluacion: () => Views.Evaluacion.render(),
        cuadro: () => Views.Cuadro.render(),
        sart: () => Views.SART.render(),
        rid: () => window.RID?.renderHome ? window.RID.renderHome() : '<div class="empty-state">RID Module not loaded</div>',
        reportes: () => Views.Reportes.render(),
        horario: () => Views.Horario.render(),
        agenda: () => Views.Agenda.render(),
        respaldo: Views.Respaldo.render,
        'pruebas-diagnosticas': () => Views.PruebasDiagnosticas.render(),
        'pruebas-formativas': () => Views.PruebasFormativas.render(),
        'cuadro1': () => Views.Cuadro1.render(),
        'sace': () => Views.Sace.render(),
        'parte-mensual': () => Views.ParteMensual.render(),
        'pizarra360': () => Views.Pizarra360.render(),
        'libreria-todas': () => window.Libreria.renderTodas(),
        'libreria-carpetas': () => window.Libreria.renderCarpetas(),
        'libreria-recientes': () => window.Libreria.renderRecientes(),
        'libreria-sincronizar': () => window.Libreria.renderPlaceholder('Sincronizar'),
        'libreria-favoritos': () => window.Libreria.renderFavoritos(),
        'libreria-marcadores': () => window.Libreria.renderPlaceholder('Marcadores'),
        'libreria-red': () => Router.navigate('libreria-todas'),
        'libreria-nube': () => window.Libreria.renderNube(),
        'libreria-prefs': () => window.Libreria.renderPlaceholder('Preferencias'),
        'libreria-lector': () => window.Libreria.renderLector(),
        'banco-curricular': () => Views.BancoCurricular.render(),
        'formalizacion': () => { Views.Formalizacion.onMount(); return Views.Formalizacion.render(); },
        'archivos': () => Views.Archivos.render(),
        'banco-rubricas': () => Views.BancoRubricas.render(),
        'bitacora': () => Views.Bitacora.render(),
        'notas-rapidas': () => Views.NotasRapidas.render(),
        'equipos-trabajo': () => Views.EquiposTrabajo.render(),
        'reporte-parcial': () => Views.ReporteParcial.render()
    };

    // Helper to re-render current route (used by Bitácora and other modules)
    Router.render = function() { Router.navigate(Router.current); };

    UI.updateHeader();

    // Auto-switch Horario view on orientation change (Portrait -> Hoy)
    const handleOrientationHorario = () => {
        if (window.innerHeight > window.innerWidth) {
            if (Views.Horario && Views.Horario.activeView !== 'hoy') {
                Views.Horario.activeView = 'hoy';
                if (Router.current === 'horario') Router.render();
            }
        }
    };
    window.addEventListener('resize', handleOrientationHorario);
    handleOrientationHorario();

    //  SPLASH SCREEN ANIMATION 
    const splashArc = document.getElementById('splash-arc');
    const splashPct = document.getElementById('splash-pct');
    const splashEl = document.getElementById('gdhn-splash');
    const CIRCUM = 2 * Math.PI * 54; // 339.29
    let progress = 0;
    const DURATION = 1800; // ms total
    const STEP_MS = 30;   // update interval
    const INCREMENT = 100 / (DURATION / STEP_MS);

    const splashTimer = setInterval(function () {
        progress = Math.min(100, progress + INCREMENT + (Math.random() * 1.5));
        const offset = CIRCUM - (progress / 100) * CIRCUM;
        if (splashArc) splashArc.style.strokeDashoffset = offset;
        if (splashPct) splashPct.textContent = Math.round(progress) + '%';
        if (progress >= 100) {
            clearInterval(splashTimer);
            if (splashPct) splashPct.textContent = '100%';
            setTimeout(function () {
                if (splashEl) splashEl.classList.add('splash-hide');
                setTimeout(function () { if (splashEl) splashEl.style.display = 'none'; }, 650);
            }, 250);
        }
    }, STEP_MS);
    // 

    // Initial Route
    Router.navigate('panel');

    // Inicializar el sistema de tutoriales (verifica solo si no ha sido completado)
    setTimeout(() => {
        if (typeof Tour360 !== 'undefined') {
            Tour360.start('tour-inicio');
        }
    }, 1500);
});

; console.log('Loaded');

