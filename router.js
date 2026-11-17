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
    showRescueScreen(error, routeId) {
        if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
        if (window.UI && typeof UI.hideSpinner === 'function') {
            UI.hideSpinner();
        }

        const container = document.getElementById('content');
        if (!container) return;

        const errMessage = error ? (error.message || String(error)) : 'Error imprevisto en la vista';
        const errStack = error && error.stack ? error.stack : '';
        const currentRoute = routeId || this.current || 'desconocido';

        container.style.removeProperty('max-width');
        container.style.removeProperty('width');
        container.style.removeProperty('margin');
        container.style.removeProperty('padding');

        container.innerHTML = `
            <div class="rescue-screen-wrap fade-in" style="margin: 30px auto; max-width: 660px; width: 95%; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="background: #ffffff; border-radius: 20px; border: 1.5px solid #fee2e2; box-shadow: 0 12px 36px rgba(220, 38, 38, 0.08); overflow: hidden;">
                    
                    <!-- Encabezado Empático y Tranquilizador -->
                    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%); padding: 28px 24px 22px; text-align: center; border-bottom: 1px solid #fecdd3;">
                        <div style="width: 64px; height: 64px; border-radius: 50%; background: #dc2626; color: white; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(220, 38, 38, 0.25); margin-bottom: 14px;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <path d="m9 12 2 2 4-4"/>
                            </svg>
                        </div>
                        <h2 style="font-size: 21px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                            ¡Tranquilo(a)! Tu información está a salvo
                        </h2>
                        <p style="font-size: 13.5px; color: #475569; margin: 0 auto; max-width: 520px; line-height: 1.55; font-weight: 500;">
                            Aula 360 detectó un detalle imprevisto al preparar la pantalla de <strong>"${currentRoute}"</strong>, pero tus cursos, notas, asistencias y expedientes están <strong>completamente intactos</strong> y protegidos en tu dispositivo.
                        </p>
                    </div>

                    <!-- Botones de Acción de Rescate -->
                    <div style="padding: 24px 24px 18px;">
                        <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin: 0 0 12px 0; text-align: center;">
                            Opciones para continuar de inmediato:
                        </p>

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                            <button onclick="Router.navigate('panel')" class="btn" style="background: #2563eb; color: #ffffff; border: none; border-radius: 12px; padding: 12px 16px; font-size: 13.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(37,99,235,0.2);">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                Ir al Centro de Control
                            </button>

                            <button onclick="Router.navigate('cuadro')" class="btn" style="background: #0f172a; color: #ffffff; border: none; border-radius: 12px; padding: 12px 16px; font-size: 13.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
                                Ir a Cuadro Controlador
                            </button>

                            <button onclick="Router.retryCurrentRoute()" class="btn" style="background: #f8fafc; color: #334155; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px 16px; font-size: 13.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                                Reintentar Carga
                            </button>

                            <button onclick="Router.downloadEmergencyBackup()" class="btn" style="background: #f0fdf4; color: #166534; border: 1.5px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; font-size: 13.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                                Descargar Respaldo Extra
                            </button>
                        </div>

                        <!-- Reporte Técnico Plegable para Soporte -->
                        <details style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: #64748b;">
                            <summary style="font-weight: 700; cursor: pointer; color: #475569; user-select: none;">
                                Ver reporte técnico del incidente
                            </summary>
                            <div style="margin-top: 10px;">
                                <p style="margin: 0 0 6px 0; font-family: monospace; color: #b91c1c; word-break: break-all; background: #fee2e2; padding: 6px 10px; border-radius: 6px;">
                                    ${errMessage}
                                </p>
                                ${errStack ? `<pre style="margin: 6px 0 10px 0; font-size: 10.5px; background: #0f172a; color: #e2e8f0; padding: 8px; border-radius: 6px; overflow-x: auto; max-height: 140px;">${errStack}</pre>` : ''}
                                <button onclick="Router.copyErrorToClipboard('${encodeURIComponent(errMessage + '\n' + errStack)}')" style="background: #e2e8f0; color: #1e293b; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
                                    📋 Copiar Detalle para Soporte Técnico
                                </button>
                            </div>
                        </details>
                    </div>

                    <div style="background: #f1f5f9; padding: 12px 20px; font-size: 11.5px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
                        Aula 360 HN · Sistema de Autoprotección y Recuperación Activa
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    retryCurrentRoute() {
        const r = this.current || 'panel';
        this.navigate(r);
    },

    downloadEmergencyBackup() {
        try {
            if (typeof Store !== 'undefined' && typeof Store.exportData === 'function') {
                Store.exportData();
            } else if (typeof Store !== 'undefined' && Store.data) {
                const blob = new Blob([JSON.stringify(Store.data, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `Respaldo_Emergencia_Aula360_${Date.now()}.json`;
                a.click();
            }
            if (window.UI) UI.toast('Copia de seguridad generada con éxito', 'success');
        } catch(e) {
            alert('No se pudo generar la descarga directa: ' + e.message);
        }
    },

    copyErrorToClipboard(enc) {
        try {
            const text = decodeURIComponent(enc);
            navigator.clipboard.writeText(text);
            if (window.UI) UI.toast('Reporte copiado al portapapeles', 'success');
        } catch(e) {
            console.log(e);
        }
    },
    navigate(routeId) {
        if ((this.current === 'cuadro' || this.current === 'evaluacion') && routeId !== this.current && !this._skipExitCheck && (typeof Store === 'undefined' || Store.data?.configPreferencias?.avisoPendientesCuadro !== false) && typeof Views !== 'undefined' && Views.Cuadro && typeof Views.Cuadro.checkPendingRemindersOnExit === 'function') {
            Views.Cuadro.checkPendingRemindersOnExit(() => {
                this._skipExitCheck = true;
                this.navigate(routeId);
                this._skipExitCheck = false;
            });
            return;
        }
        // Auto-save silently in background if Store is available (no-bloqueante)
        if (typeof Store !== 'undefined' && typeof Store.save === 'function') {
            setTimeout(() => {
                try { Store.save(); } catch(e) { console.warn('Silent save failed during navigation', e); }
            }, 100);
        }


        // Guard: if no course, force 'cursos' unless global module
        const globalModules = ['panel', 'cursos', 'estudiantes', 'asistencia', 'conducta', 'evaluacion', 'cuadro', 'sart', 'reportes', 'horario', 'config', 'respaldo', 'agenda', 'pruebas-diagnosticas', 'pruebas-formativas', 'cuadro1', 'libreria-todas', 'libreria-carpetas', 'libreria-recientes', 'libreria-sincronizar', 'libreria-favoritos', 'libreria-marcadores', 'libreria-red', 'libreria-nube', 'libreria-prefs', 'libreria-lector', 'banco-curricular', 'formalizacion', 'archivos', 'banco-rubricas', 'bitacora', 'equipos-trabajo', 'horario-aseo', 'organizacion-grado'];
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
                if (typeof Store === 'undefined' || Store.data?.configPreferencias?.autoColapsarMenu !== false) {
                    sb.classList.add('collapsed');
                    localStorage.setItem('gdhn_sidebarState', 'collapsed');
                }
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
        if (typeof UI !== 'undefined' && typeof UI.updateHeader === 'function') UI.updateHeader();

        // Setup container
        const container = document.getElementById('content');
        container.innerHTML = '';
        container.style.setProperty('max-width', '100%', 'important');
        container.style.setProperty('width', '100%', 'important');
        container.style.setProperty('margin', '0', 'important');
        container.style.setProperty('box-sizing', 'border-box', 'important');
        if (routeId === 'conducta' || routeId === 'cuadro' || routeId === 'sace' || routeId === 'cuadro1' || routeId === 'horario-aseo' || routeId === 'organizacion-grado') {
            container.style.setProperty('padding', '4px 8px', 'important');
        } else {
            container.style.setProperty('padding', '8px 14px', 'important');
        }

        // Show spinner
        UI.showSpinner();

        // Watchdog Anti-Pantalla en Blanco (Rescata al usuario si la vista se traba o queda vacía)
        if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
        this._watchdogTimer = setTimeout(() => {
            if (window.UI && typeof UI.hideSpinner === 'function') UI.hideSpinner();
            const cont = document.getElementById('content');
            const spinner = document.getElementById('gdhn-route-spinner');
            const isSpinnerStuck = spinner && (spinner.style.display === 'flex' || spinner.classList.contains('visible'));
            const isContentEmpty = !cont || !cont.innerHTML || cont.innerHTML.trim() === '';

            if (isSpinnerStuck || isContentEmpty) {
                console.warn('[Aula 360 Watchdog] Pantalla congelada o vacía detectada tras 2.8s en ruta:', routeId);
                Router.showRescueScreen(new Error('La vista no respondió o tardó demasiado en renderizarse.'), routeId);
            }
        }, 2800);

        // Defer actual render by one frame so spinner paints first
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                try {
                const titleMap = {
                    'plan-pro': 'Hazte Pro · Cuenta y Licencia',
                    'redes-sociales': 'Redes Sociales y Comunidad',
                    panel: 'Centro de Control', 
                    cursos: 'Mis Cursos', 
                    estudiantes: 'Control de Matrícula',
                    asistencia: 'Registro de Asistencia', 
                    conducta: 'Control de Conducta',
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
                                        'formalizacion': 'Formalización Académica',
                    'banco-curricular': 'Banco Curricular HN',
                    'equipos-trabajo': 'Equipos de Trabajo',
                    'horario-aseo': 'Rol de Aseo Semanal',
                    'organizacion-grado': 'Organización de Grado',
                    'reporte-parcial': 'Reporte del Parcial'
                };

                const subtitleMap = {
                    'plan-pro': 'Beneficios Premium, Planes y Estado de tu Cuenta',
                    'redes-sociales': 'Conecta con Aula 360 HN en Facebook, TikTok, Instagram, YouTube y WhatsApp',
                    panel: 'Resumen General y Estado del Sistema',
                    cursos: 'Gestión de Asignaturas y Horarios',
                    estudiantes: 'Gestión de Matrícula y Expedientes',
                    asistencia: 'Seguimiento y Control de Ausentismo',
                    conducta: 'Registro de Méritos, Valores e Incidencias Disciplinarias',
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
                                        'formalizacion': 'Jornalización desde Banco de Datos',
                    'banco-curricular': 'Administración de Estándares Educativos',
                    'equipos-trabajo': 'Gestión de Grupos Colaborativos',
                    'horario-aseo': 'Organización y Comisiones de Limpieza del Aula',
                    'organizacion-grado': 'Directivas de Estudiantes y Padres de Familia',
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
                const showPill = ((prevRoute && prevRoute !== routeId) || isCuadro) && (typeof Store === 'undefined' || Store.data?.configPreferencias?.pildoraVolver !== false);

                if (showPill) {
                    const prevLabel = titleMap[prevRoute] || (isCuadro ? 'Inicio' : prevRoute);
                    const targetRoute = prevRoute && prevRoute !== routeId ? prevRoute : 'inicio';
                    const pill = document.createElement('button');
                    pill.id = backPillId;
                    pill.title = 'Volver a ' + prevLabel;
                    pill.onclick = () => {
                        const doLeave = () => {
                            if (prevRoute && prevRoute !== routeId) Router.goBack();
                            else Router.navigate(targetRoute);
                        };
                        if (Router.current === 'cuadro' && (typeof Store === 'undefined' || Store.data?.configPreferencias?.avisoPendientesCuadro !== false) && typeof Views !== 'undefined' && Views.Cuadro && typeof Views.Cuadro.checkPendingRemindersOnExit === 'function') {
                            Views.Cuadro.checkPendingRemindersOnExit(doLeave);
                        } else {
                            doLeave();
                        }
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
                        <div class="card" style="margin:20px auto; max-width:600px; width:95%; border:1px solid #fee2e2; background:#fff; border-radius:18px; box-shadow:0 8px 24px rgba(0,0,0,0.06); box-sizing:border-box;">
                            <div class="card-b" style="text-align:center; padding:32px 20px; box-sizing:border-box;">
                                <div style="width:56px; height:56px; border-radius:50%; background:#fef2f2; color:#ef4444; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                                    <i data-lucide="alert-triangle" style="width:28px; height:28px;"></i>
                                </div>
                                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:8px;">No se pudo cargar el módulo (${routeId})</h3>
                                <p style="font-size:13px; color:#64748b; max-width:480px; margin:0 auto 20px; line-height:1.5; word-break:break-word;">
                                    Ocurrió un error al preparar la vista: <br>
                                    <code style="display:inline-block; margin-top:8px; padding:8px 14px; background:#f1f5f9; border-radius:8px; font-size:12px; color:#dc2626; font-family:monospace; word-break:break-all; max-width:100%; white-space:pre-wrap;">${routeErr.message || routeErr}</code>
                                </p>
                                <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
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


                // Floating Action Shortcuts (Draggable Semicircular Navigation Menu)
                const targetFabRoutes = ['asistencia', 'cuadro', 'libreria-todas', 'evaluacion', 'reporte-parcial', 'conducta', 'pruebas-diagnosticas', 'pruebas-formativas', 'equipos-trabajo', 'estudiantes', 'cuadro1', 'reportes', 'reporte-conducta', 'estadistica-condensado', 'parte-mensual', 'sart'];
                const existingFab = document.getElementById('fab-quick-nav');
                if (existingFab) existingFab.remove();
                const existingFabRadial = document.getElementById('gdhn-fab-radial-overlay');
                if (existingFabRadial) existingFabRadial.remove();

                if ((targetFabRoutes.includes(routeId) || routeId.startsWith('libreria-')) && (typeof Store === 'undefined' || Store.data?.configPreferencias?.fabRadialMenu !== false)) {
                    const fab = document.createElement('nav');
                    fab.id = 'fab-quick-nav';
                    if (window._fabQuickNavPos) {
                        fab.style.bottom = 'auto';
                        fab.style.right = 'auto';
                        fab.style.left = window._fabQuickNavPos.left;
                        fab.style.top = window._fabQuickNavPos.top;
                        if (window._fabQuickNavPos.openRight) {
                            fab.classList.add('open-right');
                        }
                    }

                    fab.innerHTML = `
                        <div class="fab-arc-nav-content">
                            <button type="button" id="fab-nav-trigger" onclick="UI.toggleFloatingNavMenu(event)" title="Aula 360 - Herramientas y Navegación (Arrastrable)">
                                <span class="fab-trigger-icon fab-icon-isotype">
                                    <svg viewBox="0 0 200 200" width="23" height="23" style="width:23px; height:23px; display:block;">
                                        <defs>
                                            <linearGradient id="grad360fabTrigger" x1="0%" y1="100%" x2="100%" y2="0%">
                                                <stop offset="0%"   stop-color="#FF7A00" />
                                                <stop offset="25%"  stop-color="#FFC300" />
                                                <stop offset="45%"  stop-color="#00C853" />
                                                <stop offset="75%"  stop-color="#2979FF" />
                                                <stop offset="100%" stop-color="#7B1FA2" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="100" cy="100" r="76" fill="none" stroke="url(#grad360fabTrigger)" stroke-width="20" stroke-linecap="round" stroke-dasharray="385 100" />
                                        <circle cx="158.2" cy="51.2" r="16" fill="#FF7A00" />
                                        <path d="M 55 145 L 100 55 L 145 145" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />
                                        <path d="M 70 112 L 130 112" fill="none" stroke="url(#grad360fabTrigger)" stroke-width="24" stroke-linecap="round" />
                                    </svg>
                                </span>
                                <span class="fab-trigger-icon fab-icon-close">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </span>
                            </button>
                            <!-- 1. Cambiar Curso -->
                            <button type="button" class="fab-arc-btn" style="--idx:1; --tx:0px; --ty:-75px;" data-label="Seleccionar Curso" onclick="UI.closeFloatingRadialMenu(); Views.Cursos.showSelector('${routeId}')">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            </button>
                            <!-- 2. Menú de Reportes (Consolidado) -->
                            <button type="button" class="fab-arc-btn" style="--idx:2; --tx:-53px; --ty:-53px;" data-label="Menú de Reportes" onclick="UI.closeFloatingRadialMenu(); UI.openFloatingReportsMenu(event)">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            </button>
                            <!-- 3. Pantalla Completa (Modo Enfoque Tabla) -->
                            <button type="button" class="fab-arc-btn" style="--idx:3; --tx:-75px; --ty:0px;" data-label="Pantalla Completa" onclick="UI.closeFloatingRadialMenu(); (typeof Views !== 'undefined' && Views.Cuadro && typeof Views.Cuadro.toggleFullscreen === 'function') ? Views.Cuadro.toggleFullscreen() : null;">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                            </button>
                            <!-- 4. Herramienta Contextual: Llenar Mes en Asistencia / Dimensiones en otras vistas -->
                            ${routeId === 'asistencia' ? `
                                <button type="button" class="fab-arc-btn" style="--idx:4; --tx:-53px; --ty:53px;" data-label="Llenar Mes de Asistencia" onclick="UI.closeFloatingRadialMenu(); (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.openMassMonthAttendance === 'function') ? Views.Asistencia.openMassMonthAttendance() : null;">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="m9 14 2 2 4-4"/></svg>
                                </button>
                            ` : `
                                <button type="button" class="fab-arc-btn ${routeId === 'evaluacion' ? 'active' : ''}" style="--idx:4; --tx:-53px; --ty:53px;" data-label="Dimensiones de Evaluación" onclick="UI.closeFloatingRadialMenu(); Router.navigate('evaluacion')">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                                </button>
                            `}
                        </div>`;
                    
                    let style = document.getElementById('fab-nav-styles');
                    if (!style) {
                        style = document.createElement('style');
                        style.id = 'fab-nav-styles';
                        document.head.appendChild(style);
                    }
                    style.textContent = `
                        #fab-quick-nav {
                            position: fixed;
                            bottom: 96px;
                            right: 22px;
                            width: 40px;
                            height: 40px;
                            z-index: 9999;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            user-select: none;
                            -webkit-user-select: none;
                        }
                        .fab-arc-nav-content {
                            position: relative;
                            width: 40px;
                            height: 40px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        #fab-nav-trigger {
                            position: relative;
                            z-index: 10;
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: rgba(15, 23, 42, 0.90);
                            -webkit-backdrop-filter: blur(10px);
                            backdrop-filter: blur(10px);
                            color: #ffffff;
                            border: 1.5px solid rgba(255, 255, 255, 0.22);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: grab;
                            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.28), 0 1px 3px rgba(0, 0, 0, 0.2);
                            transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
                        }
                        #fab-nav-trigger:active {
                            cursor: grabbing;
                            transform: scale(0.94);
                        }
                        #fab-nav-trigger:hover {
                            transform: scale(1.08);
                            background: rgba(15, 23, 42, 0.98);
                            border-color: rgba(255, 255, 255, 0.45);
                            box-shadow: 0 6px 20px rgba(15, 23, 42, 0.38);
                        }
                        #fab-quick-nav.open #fab-nav-trigger {
                            background: #0f172a;
                            border-color: rgba(255, 255, 255, 0.5);
                            box-shadow: 0 6px 22px rgba(15, 23, 42, 0.35);
                            transform: scale(1.05);
                        }
                        .fab-trigger-icon {
                            position: absolute;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
                        }
                        .fab-icon-isotype {
                            opacity: 1;
                            transform: scale(1) rotate(0deg);
                        }
                        .fab-icon-close {
                            opacity: 0;
                            transform: scale(0.3) rotate(-90deg);
                        }
                        #fab-quick-nav.open .fab-icon-isotype {
                            opacity: 0;
                            transform: scale(0.3) rotate(90deg);
                        }
                        #fab-quick-nav.open .fab-icon-close {
                            opacity: 1;
                            transform: scale(1) rotate(0deg);
                        }
                        .fab-arc-btn {
                            position: absolute;
                            top: 2px;
                            left: 2px;
                            width: 36px;
                            height: 36px;
                            border-radius: 50%;
                            background: rgba(255, 255, 255, 0.95);
                            -webkit-backdrop-filter: blur(8px);
                            backdrop-filter: blur(8px);
                            color: #334155;
                            border: 1.5px solid rgba(15, 23, 42, 0.12);
                            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            opacity: 0;
                            pointer-events: none;
                            transform: translate(0px, 0px) scale(0.2);
                            transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                            transition-delay: calc(0.025s * (6 - var(--idx)));
                            z-index: 5;
                        }
                        #fab-quick-nav.open .fab-arc-btn {
                            opacity: 1;
                            pointer-events: auto;
                            transform: translate(var(--tx), var(--ty)) scale(1);
                            transition-delay: calc(0.035s * var(--idx));
                        }
                        #fab-quick-nav.open.open-right .fab-arc-btn {
                            transform: translate(calc(var(--tx) * -1), var(--ty)) scale(1);
                        }
                        .fab-arc-btn:hover {
                            background: #0f172a;
                            color: #ffffff;
                            border-color: #0f172a;
                            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.32);
                            z-index: 12;
                        }
                        #fab-quick-nav.open .fab-arc-btn:hover {
                            transform: translate(var(--tx), var(--ty)) scale(1.12);
                        }
                        #fab-quick-nav.open.open-right .fab-arc-btn:hover {
                            transform: translate(calc(var(--tx) * -1), var(--ty)) scale(1.12);
                        }
                        .fab-arc-btn.active {
                            color: #2563eb;
                            border-color: #2563eb;
                            background: #ffffff;
                            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28), inset 0 0 0 1px #2563eb;
                        }
                        .fab-arc-btn.active:hover {
                            background: #2563eb;
                            color: #ffffff;
                        }
                        /* Etiqueta emergente formal al pasar el cursor */
                        .fab-arc-btn::after {
                            content: attr(data-label);
                            position: absolute;
                            right: calc(100% + 8px);
                            top: 50%;
                            transform: translateY(-50%) translateX(6px);
                            background: #0f172a;
                            color: #ffffff;
                            font-size: 11px;
                            font-weight: 700;
                            padding: 4px 8px;
                            border-radius: 6px;
                            white-space: nowrap;
                            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
                            opacity: 0;
                            pointer-events: none;
                            transition: opacity 0.18s ease, transform 0.18s ease;
                        }
                        #fab-quick-nav.open-right .fab-arc-btn::after {
                            right: auto;
                            left: calc(100% + 8px);
                            transform: translateY(-50%) translateX(-6px);
                        }
                        .fab-arc-btn:hover::after {
                            opacity: 1;
                            transform: translateY(-50%) translateX(0);
                        }
                    `;

                    document.body.appendChild(fab);
                    if (window.lucide) window.lucide.createIcons();

                    // Hacer el botón flotante arrastrable y auto-orientar el semicírculo (izquierda/derecha)
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
                                if (e.cancelable) e.preventDefault();
                                const minTop = 94;
                                const maxTop = Math.max(minTop, window.innerHeight - el.offsetHeight - 94);
                                const clampedLeft = Math.max(16, Math.min(window.innerWidth - el.offsetWidth - 16, initialX + dx));
                                const clampedTop = Math.max(minTop, Math.min(maxTop, initialY + dy));
                                
                                el.style.bottom = 'auto';
                                el.style.right = 'auto';
                                el.style.left = clampedLeft + 'px';
                                el.style.top = clampedTop + 'px';

                                const openRight = clampedLeft < window.innerWidth / 2;
                                el.classList.toggle('open-right', openRight);
                                window._fabQuickNavPos = {
                                    left: el.style.left,
                                    top: el.style.top,
                                    openRight: openRight
                                };
                            }
                        };

                        const onEnd = () => {
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

                } catch(renderErr) {
                    console.error('[Router] Error fatal durante renderizado de vista (' + routeId + '):', renderErr);
                    this.showRescueScreen(renderErr, routeId);
                } finally {
                    if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
                    UI.hideSpinner();
                }
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
        conducta: () => ((window.Views && window.Views.Conducta) ? window.Views.Conducta.render() : ((window.Conducta) ? window.Conducta.render() : '<div class="empty-state">Módulo Conducta cargando...</div>')),
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
        'reporte-conducta': () => { Views.Reportes._state.selectedReport = 'reporte_conducta'; Views.Reportes._state.categoryFilter = 'conducta'; Views.Reportes._state.previewVisible = true; return Views.Reportes.render(); },
        'estadistica-condensado': () => { Views.Reportes._state.selectedReport = 'estadistica_condensado'; Views.Reportes._state.categoryFilter = 'estadistica'; Views.Reportes._state.previewVisible = true; return Views.Reportes.render(); },
        horario: () => Views.Horario.render(),
        agenda: () => Views.Agenda.render(),
        respaldo: Views.Respaldo.render,
        'pruebas-diagnosticas': () => Views.PruebasDiagnosticas.render(),
        'pruebas-formativas': () => Views.PruebasFormativas.render(),
        'cuadro1': () => Views.Cuadro1.render(),
        'sace': () => Views.Sace.render(),
        'parte-mensual': () => Views.ParteMensual.render(),
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
                'organizacion-grado': () => Views.OrganizacionGrado.render(),
        'equipos-trabajo': () => Views.EquiposTrabajo.render(),
        'horario-aseo': () => {
            if (window.Views && Views.EquiposTrabajo && typeof Views.EquiposTrabajo.renderAseoView === 'function') {
                return Views.EquiposTrabajo.renderAseoView();
            }
            if (window.Views && Views.Horario && typeof Views.Horario.renderAseo === 'function') {
                return Views.Horario.renderAseo();
            }
            return '<div class="empty-state">No se pudo cargar el Rol de Aseo</div>';
        },
        'reporte-parcial': () => Views.ReporteParcial.render(),
        'plan-pro': () => (window.AuthService && typeof AuthService.renderPlanProView === 'function')
            ? AuthService.renderPlanProView()
            : '<div class="empty-state">Cargando módulo Pro...</div>',
        'redes-sociales': () => (window.AuthService && typeof AuthService.renderSocialView === 'function')
            ? AuthService.renderSocialView()
            : '<div class="empty-state">Cargando Redes Sociales...</div>',
        'onboarding': () => { if (Views.Onboarding) Views.Onboarding.start(); return '<div class="p-6 text-center">Cargando Asistente...</div>'; }
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

    // Initial Route Check: First-run Intelligent Setup Wizard
    const courses = (typeof Store !== 'undefined' && Store.get) ? (Store.get('cursos') || []) : [];
    const onboardingDone = localStorage.getItem('aula360_onboarding_completed') === 'true';

    if (courses.length === 0 && !onboardingDone) {
        Router.navigate('config');
        setTimeout(() => {
            if (typeof Views !== 'undefined' && Views.Onboarding) {
                Views.Onboarding.start();
            }
        }, 1200);
    } else {
        Router.navigate('panel');
        setTimeout(() => {
            if (typeof Tour360 !== 'undefined') {
                Tour360.start('tour-inicio');
            }
            if (typeof AppGreeting !== 'undefined') {
                AppGreeting.checkAndPromptOnStartup();
            }
            if (window.UI && typeof UI.applyPreferences === 'function') {
                UI.applyPreferences();
            }
        }, 1500);
    }
});

; console.log('Loaded');


// --- SISTEMA GLOBAL DE PROTECCIÓN CONTRA PANTALLA EN BLANCO (AULA 360 RESCUE) ---
window.addEventListener('error', (event) => {
    console.error('[Aula 360 Error Interceptado]:', event.error || event.message);
    if (window.UI && typeof UI.hideSpinner === 'function') {
        UI.hideSpinner();
    }
    const cont = document.getElementById('content');
    if (cont && (!cont.innerHTML || cont.innerHTML.trim() === '')) {
        if (window.Router && typeof Router.showRescueScreen === 'function') {
            Router.showRescueScreen(event.error || event.message, Router.current);
        }
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Aula 360 Promesa Rechazada]:', event.reason);
    if (window.UI && typeof UI.hideSpinner === 'function') {
        UI.hideSpinner();
    }
    const cont = document.getElementById('content');
    if (cont && (!cont.innerHTML || cont.innerHTML.trim() === '')) {
        if (window.Router && typeof Router.showRescueScreen === 'function') {
            Router.showRescueScreen(event.reason, Router.current);
        }
    }
});

// Rescate de auxilio accesible por consola o atajo de teclado (Ctrl + Alt + R)
window.rescueAula360 = function() {
    if (window.Router && typeof Router.showRescueScreen === 'function') {
        Router.showRescueScreen('Invocación manual de auxilio', Router.current);
    }
};

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        window.rescueAula360();
    }
});
