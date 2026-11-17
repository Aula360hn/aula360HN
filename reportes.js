/**
 * Aula 360 - Módulo de Reportes Oficiales SACE y Actas
 * Modularizado desde app.js para optimización de rendimiento y mantenibilidad
 */
window.Views = window.Views || {};
const ReportesModule = {
    _state: { selectedReport: 'asistencia_mensual', previewVisible: true },

    _getReportTypes() {
        return [
            { id:'cuadro_controlador', name:'Cuadro Controlador', desc:'Notas por parcial, subtotales y nivel de desempeño oficial', icon:'table-2', cat:'evaluacion', catLabel:'Evaluación', color:'#2563EB', bg:'#EFF6FF' },
            { id:'reporte_parcial_detallado', name:'Reporte de Parcial', desc:'Acta detallada de notas por dimensión para un parcial', icon:'file-text', cat:'evaluacion', catLabel:'Evaluación', color:'#0284C7', bg:'#F0F9FF' },
            { id:'acta_final', name:'Acta de Calificaciones Final', desc:'Calificaciones finales por parcial, definitiva y nivel', icon:'award', cat:'evaluacion', catLabel:'Evaluación', color:'#4F46E5', bg:'#EEF2FF' },
            { id:'tabulacion_formativas', name:'Pruebas Formativas', desc:'Resultados y estadísticas por prueba formativa', icon:'bar-chart-2', cat:'evaluacion', catLabel:'Evaluación', color:'#7C3AED', bg:'#F5F3FF' },
            { id:'tabulacion_mensual', name:'Tabulación Mensual', desc:'Actividades evaluadas en el mes y promedios', icon:'layout-list', cat:'evaluacion', catLabel:'Evaluación', color:'#2563EB', bg:'#EFF6FF' },
            { id:'asistencia_mensual', name:'Asistencia e Inasistencias', desc:'Registro mensual, Inasistencias del Parcial (por fecha de inicio y cierre) e Inasistencias Anuales', icon:'calendar-check', cat:'asistencia', catLabel:'Asistencia', color:'#059669', bg:'#ECFDF5' },
            { id:'parte_mensual', name:'Parte Mensual', desc:'Resumen mensual institucional del curso', icon:'clipboard-list', cat:'asistencia', catLabel:'Asistencia', color:'#10B981', bg:'#ECFDF5' },
            { id:'consolidado_asistencia', name:'Consolidado de Asistencia', desc:'Resumen anual e inasistencias por parcial y mes', icon:'calendar', cat:'asistencia', catLabel:'Asistencia', color:'#0D9488', bg:'#F0FDFA' },
            { id:'reporte_conducta', name:'Reporte de Conducta', desc:'Cuadro oficial SACE de personalidad por parcial (escala 2, 3, 4)', icon:'award', cat:'conducta', catLabel:'Conducta SACE', color:'#D97706', bg:'#FEF3C7' },
            { id:'informe_sart', name:'Informe SART', desc:'Seguimiento e informe de alertas de estudiantes', icon:'alert-triangle', cat:'conducta', catLabel:'Alertas SART', color:'#DC2626', bg:'#FEF2F2' },
            { id:'ficha_estudiante', name:'Ficha Individual', desc:'Resumen integral de notas y asistencia por estudiante', icon:'user', cat:'conducta', catLabel:'Conducta', color:'#D97706', bg:'#FEF3C7' },
            { id:'estudiantes_riesgo', name:'Estudiantes en Riesgo', desc:'Cruces de rendimiento, asistencia y alertas SART', icon:'user-x', cat:'conducta', catLabel:'Conducta', color:'#DC2626', bg:'#FEF2F2' },
            { id:'estadistica_condensado', name:'Estadística Oficial (Condensado)', desc:'Matrícula inicial/final, evaluados, niveles (Inicial/Básico/Avanzado/Excelente) y Ordinarios', icon:'pie-chart', cat:'estadistica', catLabel:'Estadística Oficial', color:'#9333EA', bg:'#FAF5FF' },
            { id:'comparativo_parciales', name:'Comparativo entre Parciales', desc:'Evolución de promedios grupales a lo largo del año', icon:'trending-up', cat:'estadistica', catLabel:'Estadística', color:'#7C3AED', bg:'#F5F3FF' }
        ];
    },

    openCircularMenu(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        Router.navigate('reportes');
    },

    _updateHubHover(title, cat, id) {
        const hubTitle = document.getElementById('radial-hub-title');
        const hubCat = document.getElementById('radial-hub-cat');
        if (hubTitle) hubTitle.textContent = title;
        if (hubCat) hubCat.textContent = cat;
    },

    closeCircularMenu() {
        const overlay = document.getElementById('radial-report-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            setTimeout(() => overlay.remove(), 200);
        }
    },

    toggleGridCatalog() {
        this._state.showGridCatalog = !this._state.showGridCatalog;
        Router.navigate('reportes');
    },


    _docWatermark() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isClean = (typeof window !== 'undefined' && window.AuthService) ? window.AuthService.getLicenseStatus().canExportClean : true;
        const trialBanner = isClean ? '' : `
            <div style="margin-top: 8px; padding: 6px 10px; border: 1px dashed #d97706; background: #fffbeb; color: #92400e; border-radius: 6px; font-size: 9.5px; font-weight: 800; text-align: center; letter-spacing: 0.04em; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                VERSIÓN DE PRUEBA &mdash; AULA 360 HN &bull; Activa tu Plan Pro para exportar documentos oficiales sin esta marca
            </div>`;
        return `<div class="doc-watermark" style="margin-top: 24px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; font-family: sans-serif; user-select: none; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
            <span>Generado desde <strong>Aula 360 HN</strong> &bull; <em>Tecnología de Vanguardia y Control Académico Total</em></span>
            <span>Fecha y Hora: <b>${dateStr} ${timeStr}</b></span>
        </div>${trialBanner}`;
    },

    render() {
        const allCourses = (Store.get('cursos') || []).filter(cr => cr.estado !== 'FINALIZADO' && cr.estado !== 'ARCHIVADO');
        let c = Store.getActiveCourse();
        if (c && (c.estado === 'FINALIZADO' || c.estado === 'ARCHIVADO')) {
            c = null;
        }
        if (!c && allCourses.length > 0) {
            c = allCourses[0];
            Store.data.activeCourseId = c.id;
        }
        const parciales = c ? Store.getParcialByCourse(c.id) : [];
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

        const reportTypes = this._getReportTypes();
        const cfg = this._getConfig();
        const monthOpts = monthNames.map((m,i) => `<option value="${i}" ${cfg.mes===i?'selected':''}>${m}</option>`).join('');

        const sel = this._state.selectedReport || 'asistencia_mensual';
        this._state.selectedReport = sel;
        const selInfo = reportTypes.find(r => r.id === sel) || reportTypes[0];

        // Construir lista de Centros Educativos y Cursos filtrados por Centro
        const normCE = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const centrosMap = new Map();
        (Store.data.centrosEducativos || []).forEach(ce => {
            if (ce && ce.nombre) {
                const k = normCE(ce.nombre);
                if (k && !centrosMap.has(k)) centrosMap.set(k, ce.nombre.trim());
            }
        });
        allCourses.forEach(cr => {
            const name = (cr && cr.centroEducativo ? cr.centroEducativo : 'Centro Educativo Principal').trim();
            const k = normCE(name);
            if (k && !centrosMap.has(k)) centrosMap.set(k, name);
        });
        if (centrosMap.size === 0) centrosMap.set('DEFAULT', 'Centro Educativo Principal');

        const activeCentroName = (c && c.centroEducativo ? c.centroEducativo : Array.from(centrosMap.values())[0]).trim();
        const activeCentroKey = normCE(activeCentroName);
        const centroOpts = Array.from(centrosMap.entries()).map(([k, label]) =>
            `<option value="${k}" ${k === activeCentroKey ? 'selected' : ''}>${label}</option>`
        ).join('');

        const coursesForCentro = allCourses.filter(cr => normCE(cr.centroEducativo || 'Centro Educativo Principal') === activeCentroKey);
        const effectiveCourses = coursesForCentro.length > 0 ? coursesForCentro : allCourses;
        const cursoOpts = effectiveCourses.map(cr =>
            `<option value="${cr.id}" ${c && cr.id === c.id ? 'selected' : ''}>${cr.grado} "${cr.seccion}" — ${cr.asignatura}</option>`
        ).join('');

        // Construir Opciones del Reporte según el reporte seleccionado
        let reportOptionsHTML = '';
        if (sel === 'asistencia_mensual') {
            const asisModo = cfg.asisModo || 'mensual';
            const pWithDates = c ? this._getCourseParcialesWithDates(c) : [];
            const activeParcialObj = pWithDates.find(p => String(p.id) === String(cfg.asisParcialId)) || pWithDates[0] || { id: 'p1', nombre: 'Primer Parcial', fechaInicio: `${cfg.anio}-02-01`, fechaFin: `${cfg.anio}-04-15` };
            const fmtShort = (dStr) => {
                if (!dStr || dStr.length < 10) return dStr || '';
                const pts = dStr.slice(0, 10).split('-');
                return pts.length === 3 ? `${pts[2]}/${pts[1]}/${pts[0]}` : dStr;
            };
            const asisParcialOpts = pWithDates.map(p => `<option value="${p.id}" ${String(activeParcialObj.id) === String(p.id) ? 'selected' : ''}>${p.nombre} (${fmtShort(p.fechaInicio)} al ${fmtShort(p.fechaFin)})</option>`).join('');

            let modeSpecificInputs = '';
            if (asisModo === 'mensual') {
                modeSpecificInputs = `
                <div class="config-field-group" style="min-width:140px;">
                    <label class="config-field-label">Mes</label>
                    <select class="config-select" id="rpt-mes" onchange="Views.Reportes.updatePreview()">${monthOpts}</select>
                </div>
                <div class="config-field-group" style="width:95px;">
                    <label class="config-field-label">Año</label>
                    <input class="config-input" id="rpt-anio" type="number" value="${cfg.anio}" min="2020" max="2035" oninput="Views.Reportes.updatePreview()">
                </div>`;
            } else if (asisModo === 'parcial') {
                modeSpecificInputs = `
                <div class="config-field-group" style="min-width:210px;">
                    <label class="config-field-label">Parcial</label>
                    <select class="config-select" id="rpt-asis-parcial" onchange="Views.Reportes.onAsisParcialChange(this.value)">${asisParcialOpts}</select>
                </div>
                <div class="config-field-group" style="min-width:130px;">
                    <label class="config-field-label">Inicio Parcial</label>
                    <input class="config-input" id="rpt-asis-ini" type="date" value="${cfg.asisFechaInicio || activeParcialObj.fechaInicio}" onchange="Views.Reportes.onAsisDateChange()">
                </div>
                <div class="config-field-group" style="min-width:130px;">
                    <label class="config-field-label">Cierre Parcial</label>
                    <input class="config-input" id="rpt-asis-fin" type="date" value="${cfg.asisFechaFin || activeParcialObj.fechaFin}" onchange="Views.Reportes.onAsisDateChange()">
                </div>`;
            } else {
                modeSpecificInputs = `
                <div class="config-field-group" style="width:105px;">
                    <label class="config-field-label">Año</label>
                    <input class="config-input" id="rpt-anio" type="number" value="${cfg.anio}" min="2020" max="2035" oninput="Views.Reportes.updatePreview()">
                </div>`;
            }

            reportOptionsHTML = `
                <div class="config-field-group" style="min-width:230px;">
                    <label class="config-field-label">Opciones del Reporte</label>
                    <div style="display:inline-flex; background:#F1F5F9; padding:3px; border-radius:10px; border:1px solid #CBD5E1; gap:3px; height:38px; box-sizing:border-box; align-items:center;">
                        <button type="button" onclick="Views.Reportes.onAsisModoChange('mensual')" style="flex:1; height:30px; padding:0 12px; border-radius:7px; border:none; background:${asisModo === 'mensual' ? '#059669' : 'transparent'}; color:${asisModo === 'mensual' ? '#FFFFFF' : '#334155'}; font-weight:800; font-size:12px; cursor:pointer; transition:all 0.15s;">Mes</button>
                        <button type="button" onclick="Views.Reportes.onAsisModoChange('parcial')" style="flex:1; height:30px; padding:0 12px; border-radius:7px; border:none; background:${asisModo === 'parcial' ? '#2563EB' : 'transparent'}; color:${asisModo === 'parcial' ? '#FFFFFF' : '#334155'}; font-weight:800; font-size:12px; cursor:pointer; transition:all 0.15s;">Parcial</button>
                        <button type="button" onclick="Views.Reportes.onAsisModoChange('anual')" style="flex:1; height:30px; padding:0 12px; border-radius:7px; border:none; background:${asisModo === 'anual' ? '#7C3AED' : 'transparent'}; color:${asisModo === 'anual' ? '#FFFFFF' : '#334155'}; font-weight:800; font-size:12px; cursor:pointer; transition:all 0.15s;">Anual</button>
                    </div>
                    <input type="hidden" id="rpt-asis-modo" value="${asisModo}">
                </div>
                ${modeSpecificInputs}
            `;
        } else if (['parte_mensual','tabulacion_mensual'].includes(sel)) {
            reportOptionsHTML = `
                <div class="config-field-group">
                    <label class="config-field-label">Mes</label>
                    <select class="config-select" id="rpt-mes" onchange="Views.Reportes.updatePreview()">${monthOpts}</select>
                </div>
                <div class="config-field-group" style="width:95px;">
                    <label class="config-field-label">Año</label>
                    <input class="config-input" id="rpt-anio" type="number" value="${cfg.anio}" min="2020" max="2035" oninput="Views.Reportes.updatePreview()">
                </div>`;
        } else if (sel === 'cuadro_controlador' || sel === 'reporte_parcial_detallado' || sel === 'reporte_conducta' || sel === 'estadistica_condensado') {
            const allLabel = sel === 'estadistica_condensado' ? 'Consolidado Anual (Promedios + Recuperación)' : 'Todos los parciales';
            const pOpts = (sel === 'reporte_conducta' ? '' : `<option value="">${allLabel}</option>`) + parciales.map(p => '<option value="' + p.id + '"' + (String(cfg.parcialId) === String(p.id) ? ' selected' : '') + '>' + p.nombre + '</option>').join('');
            reportOptionsHTML = `
                <div class="config-field-group">
                    <label class="config-field-label">Parcial</label>
                    <select class="config-select" id="rpt-parcial" onchange="Views.Reportes.updatePreview()">${pOpts}</select>
                </div>`;
        } else if (sel === 'tabulacion_formativas') {
            const pfMonths = ['Febrero/Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre/Noviembre'];
            const selectedMes = cfg.mesPF || 'Febrero/Marzo';
            const mesOpts = pfMonths.map(m => `<option value="${m}" ${selectedMes === m ? 'selected' : ''}>${m}</option>`).join('');
            reportOptionsHTML = `
                <div class="config-field-group">
                    <label class="config-field-label">Mes</label>
                    <select class="config-select" id="rpt-mes-pf" onchange="Views.Reportes.updatePreview()">${mesOpts}</select>
                </div>`;
        } else if (sel === 'ficha_estudiante') {
            const students = c ? Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado') : [];
            const selectedStudentId = cfg.estudianteId || (students.length > 0 ? students[0].id : '');
            const sOpts = students.map(s => '<option value="' + s.id + '"' + (selectedStudentId === s.id ? ' selected' : '') + '>' + s.nombreCompleto + '</option>').join('');
            reportOptionsHTML = `
                <div class="config-field-group" style="min-width:220px;">
                    <label class="config-field-label">Estudiante</label>
                    <select class="config-select" id="rpt-estudiante" onchange="Views.Reportes.updatePreview()">${sOpts}</select>
                </div>`;
        } else if (sel === 'informe_sart') {
            const selectedEstado = cfg.sartEstado || 'Todas';
            const estados = ['Todas', 'Abiertas', 'En seguimiento', 'Cerradas'];
            const estOpts = estados.map(e => `<option value="${e}" ${selectedEstado === e ? 'selected' : ''}>${e}</option>`).join('');
            reportOptionsHTML = `
                <div class="config-field-group">
                    <label class="config-field-label">Estado de Alerta</label>
                    <select class="config-select" id="rpt-sart-estado" onchange="Views.Reportes.updatePreview()">${estOpts}</select>
                </div>`;
        }

        const configPanelHTML = `
        <div class="reportes-config-panel" id="rpt-config-panel" style="margin-top:0; margin-bottom:14px; padding:14px 18px;">
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #E2E8F0;">
                <div class="config-panel-title" style="margin:0; font-size:14px;"><i data-lucide="${selInfo.icon || 'file-text'}"></i> ${selInfo.name}</div>
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    ${typeof UI !== 'undefined' && UI.renderReportZoomControls ? UI.renderReportZoomControls('rpt-doc-content', 'rpt-zoom-label') : ''}
                    <button class="btn-dl-word" onclick="Views.Reportes.downloadWord()" style="padding:6px 12px; font-size:12px;"><i data-lucide="file-type-2"></i> Word</button>
                    <button class="btn-dl-pdf" onclick="Views.Reportes.generateReport()" style="padding:6px 12px; font-size:12px;"><i data-lucide="printer"></i> Imprimir / PDF</button>
                </div>
            </div>
            <div class="config-fields-grid" style="display:flex; flex-wrap:wrap; align-items:flex-end; gap:12px;">
                <div class="config-field-group" style="flex:1.2; min-width:240px;">
                    <label class="config-field-label">Tipo de Reporte</label>
                    <select class="config-select" id="rpt-tipo-reporte" onchange="Views.Reportes.selectReport(this.value)" style="font-weight:700;">
                        ${reportTypes.map(r => `<option value="${r.id}" ${sel === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                    </select>
                </div>
                <div class="config-field-group" style="flex:1; min-width:210px;">
                    <label class="config-field-label">Centro Educativo</label>
                    <select class="config-select" id="rpt-centro" onchange="Views.Reportes.onCentroChange(this.value)">${centroOpts}</select>
                </div>
                <div class="config-field-group" style="flex:1; min-width:210px;">
                    <label class="config-field-label">Curso</label>
                    <select class="config-select" id="rpt-curso" onchange="Views.Reportes.onCursoChange(this.value)">${cursoOpts}</select>
                </div>
                ${reportOptionsHTML}
                <div class="config-field-group" style="flex:0 0 auto; min-width:182px;">
                    <label class="config-field-label">Orientación</label>
                    <select class="config-select" id="rpt-orient" onchange="Views.Reportes.updatePreview()">
                        <option value="portrait" ${cfg.orientation === 'portrait' ? 'selected' : ''}>Vertical (Carta)</option>
                        <option value="landscape" ${cfg.orientation === 'landscape' ? 'selected' : ''}>Horizontal (Carta)</option>
                    </select>
                </div>
            </div>
        </div>`;

        // Build preview section (siempre visible inmediatamente debajo de las opciones)
        let previewHTML = '';
        if (sel && c) {
            const previewContent = this._buildPreviewContent(sel, c);
            previewHTML = `
            <div class="reportes-preview-section" id="rpt-preview-area" style="margin-top:0;">
                <div class="doc-paper ${cfg.orientation === 'landscape' ? 'landscape' : ''}" id="rpt-doc-content" style="zoom: ${((typeof UI !== 'undefined' && UI._reportZoomMap && UI._reportZoomMap['rpt-doc-content']) || 100) / 100};">
                    ${previewContent}
                    ${this._docWatermark()}
                </div>
            </div>`;
        }

        return `<div class="reportes-wrapper" id="reportes-main-view">
  ${c ? configPanelHTML : `<div style="text-align:center;padding:30px;color:#94A3B8;font-size:13px;background:white;border-radius:14px;border:1px solid #E2E8F0;">Selecciona o crea un curso en la sección de Cursos para generar reportes.</div>`}
  ${previewHTML}
</div>`;
    },

    onCentroChange(centroKey) {
        const allCourses = (Store.get('cursos') || []).filter(cr => cr.estado !== 'FINALIZADO' && cr.estado !== 'ARCHIVADO');
        const normCE = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const match = allCourses.find(cr => normCE(cr.centroEducativo || 'Centro Educativo Principal') === centroKey);
        if (match) {
            Store.data.activeCourseId = match.id;
            if (typeof Store.save === 'function') Store.save();
            if (typeof UI !== 'undefined' && typeof UI.updateHeader === 'function') UI.updateHeader();
            if (this._state.lastConfig) {
                this._state.lastConfig.cursoId = match.id;
                delete this._state.lastConfig.parcialId;
                delete this._state.lastConfig.asisParcialId;
                delete this._state.lastConfig.estudianteId;
            }
        }
        Router.navigate('reportes');
    },

    onCursoChange(cursoId) {
        if (!cursoId) return;
        Store.data.activeCourseId = cursoId;
        if (typeof Store.save === 'function') Store.save();
        if (typeof UI !== 'undefined' && typeof UI.updateHeader === 'function') UI.updateHeader();
        if (this._state.lastConfig) {
            this._state.lastConfig.cursoId = cursoId;
            delete this._state.lastConfig.parcialId;
            delete this._state.lastConfig.asisParcialId;
            delete this._state.lastConfig.estudianteId;
        }
        Router.navigate('reportes');
    },

    openReportShortcut(reportId, category = null) {
        if (!reportId) return;
        this._state.selectedReport = reportId;
        this._state.previewVisible = true;
        if (reportId === 'estadistica_condensado' && this._state.lastConfig) {
            this._state.lastConfig.parcialId = '';
        }
        if (category) {
            this._state.categoryFilter = category;
        } else {
            const rep = this._getReportTypes().find(r => r.id === reportId);
            if (rep) this._state.categoryFilter = rep.cat;
        }
        this._state.scrollTarget = 'preview';
        Router.navigate('reportes');
        setTimeout(() => {
            const el = document.getElementById('rpt-preview-area');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    },

    selectReport(id) {
        this._state.selectedReport = id;
        this._state.previewVisible = true;
        const rep = this._getReportTypes().find(r => r.id === id);
        if (rep && this._state.categoryFilter !== 'todas' && this._state.categoryFilter !== rep.cat) {
            this._state.categoryFilter = rep.cat;
        }
        this._state.scrollTarget = 'config';
        if (this._state.lastConfig) {
            delete this._state.lastConfig.parcialId;
            delete this._state.lastConfig.estudianteId;
            if (id === 'estadistica_condensado') {
                this._state.lastConfig.parcialId = '';
            }
        }
        Router.navigate('reportes');
    },

    _closePreview() {
        this._state.previewVisible = false;
        Router.navigate('reportes');
    },

    showPreview() {
        if(this.saveConfig) this.saveConfig();
        this._state.previewVisible = true;
        Router.navigate('reportes');
        setTimeout(() => {
            const el = document.getElementById('rpt-preview-area');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
    },

    updatePreview() {
        this.saveConfig();
        const sel = this._state.selectedReport;
        const c = Store.getActiveCourse();
        if (!sel || !c) return;

        // Fast local DOM update of the document content
        const docContent = document.getElementById('rpt-doc-content');
        if (docContent) {
            const previewContent = this._buildPreviewContent(sel, c);
            docContent.innerHTML = previewContent + this._docWatermark();
            
            // Update orientation class
            const cfg = this._getConfig();
            if (cfg.orientation === 'landscape') {
                docContent.classList.add('landscape');
            } else {
                docContent.classList.remove('landscape');
            }
            
            // Re-render lucide icons
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        // Fallback to full route navigation if the preview DOM is not present
        Router.navigate('reportes');
    },

    onMount() {
        if (this._state.scrollTarget === 'config') {
            const el = document.getElementById('rpt-config-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (typeof this._state.scrollTarget === 'number') {
            window.scrollTo(0, this._state.scrollTarget);
        }
        this._state.scrollTarget = null;
    },

    _getCourseParcialesWithDates(c) {
        if (!c) return [];
        if (typeof Views !== 'undefined' && Views.Cuadro1 && typeof Views.Cuadro1.getCourseParciales === 'function') {
            return Views.Cuadro1.getCourseParciales(c.id);
        }
        const anio = (c && c.anio) || (Store.data && Store.data.configAcademica && Store.data.configAcademica.anio) || new Date().getFullYear();
        const defaultStarts = [`${anio}-02-01`, `${anio}-04-16`, `${anio}-07-01`, `${anio}-09-16`];
        const defaultEnds   = [`${anio}-04-15`, `${anio}-06-30`, `${anio}-09-15`, `${anio}-11-30`];
        const defaultNames  = ['Primer Parcial', 'Segundo Parcial', 'Tercer Parcial', 'Cuarto Parcial'];
        let cParciales = Store.getParcialByCourse ? (Store.getParcialByCourse(c.id) || []) : [];
        if (!cParciales.length) {
            cParciales = [1, 2, 3, 4].map((num, idx) => ({
                id: 'p' + num,
                numero: num,
                nombre: defaultNames[idx],
                fechaInicio: defaultStarts[idx],
                fechaFin: defaultEnds[idx]
            }));
        }
        return cParciales.slice(0, 4).map((p, idx) => ({
            id: p.id || ('p' + (idx + 1)),
            numero: p.numero || (idx + 1),
            nombre: p.nombre || defaultNames[idx],
            fechaInicio: p.fechaInicio || defaultStarts[idx],
            fechaFin: p.fechaFin || defaultEnds[idx]
        }));
    },

    _isDateInParcialRange(fechaStr, fechaInicio, fechaFin) {
        if (!fechaStr || !fechaInicio || !fechaFin) return false;
        const f = String(fechaStr).trim().slice(0, 10);
        const ini = String(fechaInicio).trim().slice(0, 10);
        const fin = String(fechaFin).trim().slice(0, 10);
        if (f >= ini && f <= fin) return true;
        if (f.length === 10 && ini.length === 10 && fin.length === 10) {
            const md = f.slice(5);
            const mdIni = ini.slice(5);
            const mdFin = fin.slice(5);
            if (md >= mdIni && md <= mdFin) return true;
        }
        return false;
    },

    _getDeduplicatedCourseAttendance(c) {
        if (!c) return [];
        const validCourseIds = [c.id];
        if (typeof Logic !== 'undefined' && typeof Logic.getParallelCourses === 'function') {
            (Logic.getParallelCourses(c.id) || []).forEach(id => {
                if (id && !validCourseIds.includes(id)) validCourseIds.push(id);
            });
        }
        const allAtt = Store.get('asistencia') || [];
        const byStudentDate = new Map();
        // First pass: parallel courses; second pass: active course (so active course always takes priority on the same date)
        allAtt.forEach(a => {
            if (!a || !a.estudianteId || !a.fecha) return;
            const cid = a.cursoId || a.courseId;
            if (!validCourseIds.includes(cid)) return;
            const fKey = String(a.fecha).trim().slice(0, 10);
            const mapKey = `${a.estudianteId}_${fKey}`;
            const existing = byStudentDate.get(mapKey);
            if (!existing || cid === c.id) {
                byStudentDate.set(mapKey, { ...a, fecha: fKey });
            }
        });
        return Array.from(byStudentDate.values());
    },

    onAsisModoChange(modo) {
        const cfg = this._getConfig();
        cfg.asisModo = modo;
        this._state.lastConfig = cfg;
        this._state.previewVisible = true;
        this._state.scrollTarget = 'config';
        Router.navigate('reportes');
    },

    onAsisParcialChange(parcialId) {
        const c = Store.getActiveCourse();
        const pList = this._getCourseParcialesWithDates(c);
        const pObj = pList.find(p => String(p.id) === String(parcialId)) || pList[0];
        const iniEl = document.getElementById('rpt-asis-ini');
        const finEl = document.getElementById('rpt-asis-fin');
        if (pObj) {
            if (iniEl) iniEl.value = pObj.fechaInicio || '';
            if (finEl) finEl.value = pObj.fechaFin || '';
        }
        this.updatePreview();
    },

    onAsisDateChange() {
        const c = Store.getActiveCourse();
        const pSel = document.getElementById('rpt-asis-parcial');
        const iniEl = document.getElementById('rpt-asis-ini');
        const finEl = document.getElementById('rpt-asis-fin');
        if (c && pSel && iniEl && finEl && iniEl.value && finEl.value) {
            const pId = pSel.value;
            if (Store.data && Array.isArray(Store.data.parciales)) {
                const storeP = Store.data.parciales.find(p => String(p.id) === String(pId) && (p.cursoId === c.id || p.courseId === c.id));
                if (storeP) {
                    storeP.fechaInicio = iniEl.value;
                    storeP.fechaFin = finEl.value;
                    if (typeof Store.save === 'function') Store.save();
                }
            }
        }
        this.updatePreview();
    },

    saveConfig() {
        this._state.lastConfig = this._getConfig();
    },

    _getConfig() {
        const mes = document.getElementById('rpt-mes');
        const mesPF = document.getElementById('rpt-mes-pf');
        const anio = document.getElementById('rpt-anio');
        const parcial = document.getElementById('rpt-parcial');
        const orient = document.getElementById('rpt-orient');
        const curso = document.getElementById('rpt-curso');
        const estudiante = document.getElementById('rpt-estudiante');
        const sartEstado = document.getElementById('rpt-sart-estado');
        const asisModoEl = document.getElementById('rpt-asis-modo');
        const asisParcialEl = document.getElementById('rpt-asis-parcial');
        const asisIniEl = document.getElementById('rpt-asis-ini');
        const asisFinEl = document.getElementById('rpt-asis-fin');
        
        const last = this._state.lastConfig || {};
        const sel = this._state.selectedReport;
        
        const c = Store.getActiveCourse();
        const parciales = c ? Store.getParcialByCourse(c.id) : [];
        const pWithDates = c ? this._getCourseParcialesWithDates(c) : [];
        const todayStr = new Date().toISOString().split('T')[0];
        const currentParcialObj = pWithDates.find(p => this._isDateInParcialRange(todayStr, p.fechaInicio, p.fechaFin))
            || (pWithDates.length > 0 && todayStr > String(pWithDates[pWithDates.length - 1].fechaFin || '') ? pWithDates[pWithDates.length - 1] : null);
        const matchedCurrentParcial = currentParcialObj
            ? (parciales.find(p => String(p.id) === String(currentParcialObj.id) || (p.numero && p.numero === currentParcialObj.numero)) || currentParcialObj)
            : null;
        const defaultParcialId = matchedCurrentParcial ? matchedCurrentParcial.id : (parciales.length > 0 ? parciales[0].id : '');
        const defaultOrient = ['parte_mensual', 'ficha_estudiante', 'informe_sart', 'estudiantes_riesgo'].includes(sel) ? 'portrait' : 'landscape';

        const curMonthVal = mes ? parseInt(mes.value) : (last.mes !== undefined ? last.mes : new Date().getMonth());
        const curYearVal = anio ? parseInt(anio.value) : (last.anio || new Date().getFullYear());
        const midMonthDate = `${curYearVal}-${String(curMonthVal + 1).padStart(2, '0')}-15`;
        const matchedParcialByMonth = pWithDates.find(p => this._isDateInParcialRange(midMonthDate, p.fechaInicio, p.fechaFin)) || pWithDates[pWithDates.length - 1] || pWithDates[0];
        const chosenAsisParcialId = asisParcialEl ? asisParcialEl.value : (last.asisParcialId || (matchedParcialByMonth ? matchedParcialByMonth.id : defaultParcialId));
        const chosenParcialObj = pWithDates.find(p => String(p.id) === String(chosenAsisParcialId)) || matchedParcialByMonth || { fechaInicio: `${curYearVal}-02-01`, fechaFin: `${curYearVal}-04-15` };

        const students = c ? Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado') : [];
        const defaultStudentId = students.length > 0 ? students[0].id : '';

        const fallbackParcialId = (sel === 'estadistica_condensado') ? '' : defaultParcialId;

        return {
            cursoId: curso ? curso.value : (last.cursoId || (c ? c.id : null)),
            mes: curMonthVal,
            mesPF: mesPF ? mesPF.value : (last.mesPF || 'Febrero/Marzo'),
            anio: curYearVal,
            parcialId: parcial ? parcial.value : (last.parcialId !== undefined ? last.parcialId : fallbackParcialId),
            asisModo: asisModoEl ? asisModoEl.value : (last.asisModo || 'mensual'),
            asisParcialId: chosenAsisParcialId,
            asisFechaInicio: asisIniEl ? asisIniEl.value : (last.asisParcialId === chosenAsisParcialId && last.asisFechaInicio ? last.asisFechaInicio : chosenParcialObj.fechaInicio),
            asisFechaFin: asisFinEl ? asisFinEl.value : (last.asisParcialId === chosenAsisParcialId && last.asisFechaFin ? last.asisFechaFin : chosenParcialObj.fechaFin),
            orientation: orient ? orient.value : (last.orientation || defaultOrient),
            estudianteId: estudiante ? estudiante.value : (last.estudianteId || defaultStudentId),
            sartEstado: sartEstado ? sartEstado.value : (last.sartEstado || 'Todas')
        };
    },

    _getDirector(c) {
        const sysConfig = Store.data.configCentro || Store.data.configAcademica || {};
        let d = (c && c.director && c.director.trim())
            || (sysConfig.director && sysConfig.director.trim())
            || (sysConfig.nombreDirector && sysConfig.nombreDirector.trim())
            || (Store.data.configCentro?.director && Store.data.configCentro.director.trim())
            || (Store.data.configAcademica?.director && Store.data.configAcademica.director.trim());
        if (!d && Store.data.centrosEducativos && Store.data.centrosEducativos.length > 0) {
            const ce = Store.data.centrosEducativos.find(x => (c && (x.nombre === c.centroEducativo || x.codigoCentro === c.codigoCentro || x.codigo === c.codigoCentro)));
            if (ce && ce.director) d = ce.director.trim();
            else if (Store.data.centrosEducativos[0].director) d = Store.data.centrosEducativos[0].director.trim();
        }
        if (!d && Store.data.cursos) {
            const cur = Store.data.cursos.find(x => x.director && x.director.trim());
            if (cur) d = cur.director.trim();
        }
        return d || '';
    },

    _getDocente(c) {
        const sysConfig = Store.data.configCentro || Store.data.configAcademica || {};
        return (Store.data.perfilDocente?.nombre && Store.data.perfilDocente.nombre.trim())
            || (c && c.docente && c.docente.trim())
            || (sysConfig.docente && sysConfig.docente.trim())
            || (sysConfig.nombreDocente && sysConfig.nombreDocente.trim())
            || '';
    },

    _buildPreviewContent(reportId, c) {
        const cfg = this._getConfig();
        if (cfg.cursoId && reportId === 'tabulacion_formativas') {
            const overrideCourse = Store.get('cursos').find(x => x.id === cfg.cursoId);
            if (overrideCourse) c = overrideCourse;
        }
        switch(reportId) {
            case 'asistencia_mensual': return this._buildAsistenciaMensual(c);
            case 'parte_mensual': return this._buildParteMensual(c);
            case 'cuadro_controlador': return this._buildCuadroControlador(c);
            case 'tabulacion_formativas': return this._buildTabulacionFormativas(c);
            case 'tabulacion_mensual': return this._buildTabulacionMensual(c);
            case 'acta_final': return this._buildActaCalificaciones(c);
            case 'informe_sart': return this._buildInformeSART(c);
            case 'consolidado_asistencia': return this._buildConsolidadoAsistencia(c);
            case 'reporte_parcial_detallado': return this._buildReporteParcialDetallado(c);
            case 'ficha_estudiante': return this._buildFichaEstudiante(c);
            case 'comparativo_parciales': return this._buildComparativoParciales(c);
            case 'estudiantes_riesgo': return this._buildEstudiantesRiesgo(c);
            case 'reporte_conducta': return this._buildReporteConducta(c);
            case 'estadistica_condensado': return this._buildEstadisticaCondensado(c);
            default: return '<p>Selecciona un tipo de reporte.</p>';
        }
    },

    _docHeader(c, title, subtitle) {
        const _normCE2 = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/CENTRO DE EDUCACION BASICA GUBERNAMENTAL|CENTRO DE EDUCACION BASICA|ESCUELA DE EDUCACION BASICA|CENTRO ESCOLAR|ESCUELA|INSTITUTO|C\.E\.B\.G\.|C\.E\.B\.G|CEBG|C\.E\.B\.|C\.E\.B|CEB/g, '').replace(/[^A-Z0-9]/g, '');
        const matchedCE2 = (Store.data.centrosEducativos || []).find(x => (c.centroId && x.id === c.centroId) || (_normCE2(x.nombre) && _normCE2(x.nombre) === _normCE2(c.centroEducativo)));
        if (matchedCE2) {
            if (matchedCE2.comunidad) c.comunidad = matchedCE2.comunidad;
            if (matchedCE2.codigoCentro) c.codigoCentro = matchedCE2.codigoCentro;
            if (matchedCE2.municipio) c.municipio = matchedCE2.municipio;
            if (matchedCE2.departamento) c.departamento = matchedCE2.departamento;
            if (matchedCE2.zona) c.zona = matchedCE2.zona;
            if (matchedCE2.director) c.director = matchedCE2.director;
        }

        let rawSchool = (matchedCE2 && matchedCE2.nombre ? matchedCE2.nombre : (c.centroEducativo || 'Centro Educativo')).trim();
        let cleanBaseName = rawSchool
            .replace(/^(C\.?E\.?B\.?G\.?|CEBG|C\.?E\.?B\.?|CEB|CENTRO DE EDUCACI[ÓO]N B[ÁA]SICA GUBERNAMENTAL|CENTRO DE EDUCACI[ÓO]N B[ÁA]SICA)\s+/i, '')
            .replace(/^["“”']+|["“”']+$/g, '')
            .trim();
        const schoolName = cleanBaseName ? `Centro de Educación Básica "${cleanBaseName}"` : 'Centro de Educación Básica';

        const locationParts = [];
        if (c.comunidad) locationParts.push(c.comunidad.trim());
        if (c.municipio) locationParts.push(c.municipio.trim());
        if (c.departamento) locationParts.push(c.departamento.trim());
        const locationText = locationParts.join(', ');

        let logo = (matchedCE2 && matchedCE2.logo) || (c && c.logo) || (Store.data.configCentro && Store.data.configCentro.logo) || '';
        if (!logo && Store.data.centrosEducativos && Store.data.centrosEducativos.length > 0) {
            const withLogo = Store.data.centrosEducativos.find(x => x && x.logo);
            if (withLogo) logo = withLogo.logo;
        }

        const logoElementHtml = logo ? `
            <img src="${logo}" alt="Logo" style="width: 68px; height: 68px; object-fit: contain; border-radius: 6px; border: 1px solid #cbd5e1; padding: 3px; background: #ffffff; flex-shrink: 0;" />
        ` : `
            <div style="width: 66px; height: 66px; border-radius: 8px; border: 1.5px solid #1e293b; background: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; color: #0f172a; font-family: Georgia, serif; padding: 4px; text-align: center;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M8 11h8"/>
                    <path d="M12 7v8"/>
                </svg>
                <span style="font-size: 7.5px; font-weight: 800; letter-spacing: 0.04em; margin-top: 2px;">SEDUC HN</span>
            </div>
        `;

        const directorNombre = this._getDirector(c);
        const docenteNombre = this._getDocente(c);

        const isParcialSub = subtitle && String(subtitle).toLowerCase().includes('parcial');
        const parcialText = isParcialSub ? subtitle : '';
        const displayedSubtitle = isParcialSub ? '' : subtitle;

        return `<div class="doc-header-inst" style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 10px; border-bottom: 1px solid #cbd5e1;">
                ${logoElementHtml}
                <div style="flex: 1; text-align: center;">
                    <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #0f172a; font-family: 'Times New Roman', Georgia, serif;">Secretaría de Educación</div>
                    <div class="doc-inst-name" style="margin: 2px 0; font-size: 15.5px; font-weight: 900; text-transform: uppercase; color: #0f172a; font-family: 'Times New Roman', Georgia, serif;">${schoolName}</div>
                    ${locationText ? `<div style="font-size: 11px; color: #334155; font-family: Arial, sans-serif; font-weight: 600;">${locationText}</div>` : ''}
                    <div class="doc-report-title" style="margin-top: 6px; font-size: 13.5px; font-weight: 900; text-transform: uppercase; color: #065f46; letter-spacing: 0.04em;">${title}</div>
                    ${displayedSubtitle ? `<div style="font-size: 11px; color: #475569; margin-top: 2px; font-family: Arial, sans-serif; font-weight: 700;">${displayedSubtitle}</div>` : ''}
                </div>
                <div style="width: 66px; flex-shrink: 0;"></div>
            </div>
            <div class="doc-meta-row" style="margin-top: 8px; padding-top: 0; border-top: none; font-size: 11px; font-family: Arial, sans-serif; color: #334155; display: flex; justify-content: center; align-items: center; gap: 24px; flex-wrap: wrap;">
                <span style="font-family: Arial, sans-serif; font-size: 11px; color: #334155;">Campo del Conocimiento: <b style="color: #0f172a; font-family: Arial, sans-serif; font-size: 11px;">${c.asignatura || ''}</b></span>
                <span style="font-family: Arial, sans-serif; font-size: 11px; color: #334155;">Grado: <b style="color: #0f172a; font-family: Arial, sans-serif; font-size: 11px;">${c.grado || ''} &ldquo;${c.seccion || ''}&rdquo;</b></span>
                ${parcialText ? `<span style="font-family: Arial, sans-serif; font-size: 11px; color: #334155;">Parcial: <b style="color: #0f172a; font-family: Arial, sans-serif; font-size: 11px;">${parcialText}</b></span>` : ''}
            </div>
        </div>`;
    },

    _buildAsistenciaMensual(c) {
        const cfg = this._getConfig();
        const asisModo = cfg.asisModo || 'mensual';
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const month = cfg.mes;
        const year = cfg.anio;
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const attendance = this._getDeduplicatedCourseAttendance(c);
        const pWithDates = this._getCourseParcialesWithDates(c);
        const activeParcial = pWithDates.find(p => String(p.id) === String(cfg.asisParcialId)) || pWithDates[0] || { id: 'p1', numero: 1, nombre: 'Primer Parcial', fechaInicio: `${year}-02-01`, fechaFin: `${year}-04-15` };
        const pIni = cfg.asisFechaInicio || activeParcial.fechaInicio;
        const pFin = cfg.asisFechaFin || activeParcial.fechaFin;

        const fmtFull = (dStr) => {
            if (!dStr || dStr.length < 10) return dStr || '';
            const pts = dStr.slice(0, 10).split('-');
            return pts.length === 3 ? `${pts[2]}/${pts[1]}/${pts[0]}` : dStr;
        };
        const fmtShort = (dStr) => {
            if (!dStr || dStr.length < 10) return dStr || '';
            const pts = dStr.slice(0, 10).split('-');
            return pts.length === 3 ? `${pts[2]}/${pts[1]}` : dStr;
        };

        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);
        const bdr = 'border:1px solid #94a3b8;';

        // MODO 2: INASISTENCIAS DEL PARCIAL (SEGÚN FECHA DE INICIO Y CIERRE DEL PARCIAL, DESGLOSADO POR LOS MESES DEL PARCIAL)
        if (asisModo === 'parcial') {
            const iniParts = String(pIni).slice(0, 10).split('-').map(Number);
            const finParts = String(pFin).slice(0, 10).split('-').map(Number);
            const startY = iniParts[0] || year, startM = (iniParts[1] || 2) - 1, startD = iniParts[2] || 1;
            const endY = finParts[0] || year, endM = (finParts[1] || 4) - 1, endD = finParts[2] || 30;

            const monthPalette = ['#BBF7D0', '#BAE6FD', '#FDE68A', '#CBD5E1', '#E9D5FF'];
            const parcialMonths = [];
            let curY = startY, curM = startM;
            let safety = 0;
            while ((curY < endY || (curY === endY && curM <= endM)) && safety < 14) {
                const daysInCurM = new Date(curY, curM + 1, 0).getDate();
                const dFrom = (curY === startY && curM === startM) ? startD : 1;
                const dTo = (curY === endY && curM === endM) ? endD : daysInCurM;
                const mIni = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(dFrom).padStart(2, '0')}`;
                const mFin = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(dTo).padStart(2, '0')}`;
                parcialMonths.push({
                    monthIndex: curM,
                    monthName: monthNames[curM] || 'Mes',
                    rangeLabel: `${String(dFrom).padStart(2, '0')}/${String(curM + 1).padStart(2, '0')} - ${String(dTo).padStart(2, '0')}/${String(curM + 1).padStart(2, '0')}`,
                    ini: mIni,
                    fin: mFin,
                    color: monthPalette[parcialMonths.length % monthPalette.length],
                    totalJ: 0,
                    totalI: 0
                });
                curM++;
                if (curM > 11) { curM = 0; curY++; }
                safety++;
            }

            let grandTotalI = 0, grandTotalJ = 0;

            const rows = students.map((s, idx) => {
                const stParcialRecords = attendance.filter(a => a.estudianteId === s.id && this._isDateInParcialRange(a.fecha, pIni, pFin));
                let stI = 0, stJ = 0;

                const monthCells = parcialMonths.map(pm => {
                    const mRecs = stParcialRecords.filter(a => this._isDateInParcialRange(a.fecha, pm.ini, pm.fin));
                    const mJ = mRecs.filter(a => ['J', 'E', 'PM'].includes(String(a.estado || '').toUpperCase())).length;
                    const mI = mRecs.filter(a => String(a.estado || '').toUpperCase() === 'A').length;
                    const mTot = mJ + mI;
                    pm.totalJ += mJ;
                    pm.totalI += mI;
                    stJ += mJ;
                    stI += mI;
                    return `<td style="${bdr} text-align:center; padding:4px 3px; font-weight:${mJ > 0 ? '700' : '400'}; color:${mJ > 0 ? '#1D4ED8' : '#64748B'};">${mJ}</td>
                            <td style="${bdr} text-align:center; padding:4px 3px; font-weight:${mI > 0 ? '800' : '400'}; color:${mI > 0 ? '#DC2626' : '#64748B'};">${mI}</td>
                            <td style="${bdr} text-align:center; padding:4px 3px; font-weight:700; background:#F8FAFC; color:#0F172A;">${mTot}</td>`;
                }).join('');

                grandTotalJ += stJ;
                grandTotalI += stI;
                const stTotal = stJ + stI;

                return `<tr>
                    <td style="${bdr} text-align:center; width:30px; font-weight:700; padding:4px 2px;">${idx + 1}</td>
                    <td style="${bdr} text-align:left; padding:4px 8px; font-weight:600; white-space:nowrap;">${s.nombreCompleto}</td>
                    ${monthCells}
                    <td style="${bdr} text-align:center; width:34px; font-weight:700; color:#1D4ED8;">${stJ}</td>
                    <td style="${bdr} text-align:center; width:34px; font-weight:800; color:${stI > 0 ? '#DC2626' : '#0F172A'};">${stI}</td>
                    <td style="${bdr} text-align:center; width:44px; font-weight:900; background:#FFF1F2; color:#9F1239;">${stTotal}</td>
                </tr>`;
            }).join('');

            const monthGroupHeaders = parcialMonths.map(pm => `
                <th colspan="3" style="${bdr} text-align:center; background:${pm.color}; color:#0F172A; padding:5px 4px; font-size:10.5px; font-weight:800;">
                    <div>${pm.monthName}</div>
                    <div style="font-size:8.5px; font-weight:600; color:#334155;">(${pm.rangeLabel})</div>
                </th>`).join('');

            const monthSubHeaders = parcialMonths.map(() => `
                <th style="${bdr} text-align:center; background:#F8FAFC; color:#0F172A; width:30px; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Justificadas">J</th>
                <th style="${bdr} text-align:center; background:#F8FAFC; color:#0F172A; width:30px; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Injustificadas">I</th>
                <th style="${bdr} text-align:center; background:#F1F5F9; color:#0F172A; width:36px; padding:3px 2px; font-size:9px; font-weight:800;">Total</th>
            `).join('');

            const footerMonthTotals = parcialMonths.map(pm => `
                <td style="${bdr} text-align:center; font-weight:800; background:#F8FAFC;">${pm.totalJ}</td>
                <td style="${bdr} text-align:center; font-weight:800; background:#F8FAFC; color:#DC2626;">${pm.totalI}</td>
                <td style="${bdr} text-align:center; font-weight:900; background:#E2E8F0;">${pm.totalJ + pm.totalI}</td>
            `).join('');

            return `${this._docHeader(c, 'Registro de Inasistencias del Parcial', `${activeParcial.nombre} (${fmtFull(pIni)} al ${fmtFull(pFin)})`)}
            <table class="doc-table" style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; font-size:10.5px; color:#0F172A; margin-top:8px;">
                <thead>
                    <tr>
                        <th rowspan="2" style="${bdr} width:30px; background:#F8FAFC; color:#0F172A; text-align:center; vertical-align:middle; font-weight:800; padding:5px 2px;">N.L.</th>
                        <th rowspan="2" style="${bdr} min-width:190px; background:#F8FAFC; color:#0F172A; text-align:center; vertical-align:middle; font-weight:800; padding:5px 8px;">Alumno/a</th>
                        ${monthGroupHeaders}
                        <th colspan="3" style="${bdr} text-align:center; background:#FDA4AF; color:#0F172A; padding:5px 4px; font-size:10.5px; font-weight:800;">Faltas del Parcial</th>
                    </tr>
                    <tr>
                        ${monthSubHeaders}
                        <th style="${bdr} text-align:center; background:#F8FAFC; color:#0F172A; width:34px; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Justificadas">J</th>
                        <th style="${bdr} text-align:center; background:#F8FAFC; color:#0F172A; width:34px; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Injustificadas">I</th>
                        <th style="${bdr} text-align:center; background:#FFE4E6; color:#9F1239; width:44px; padding:3px 2px; font-size:9.5px; font-weight:900;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="background:#F1F5F9; font-weight:800;">
                        <td colspan="2" style="${bdr} text-align:right; padding:5px 10px; font-weight:900;">TOTALES:</td>
                        ${footerMonthTotals}
                        <td style="${bdr} text-align:center; font-weight:800;">${grandTotalJ}</td>
                        <td style="${bdr} text-align:center; font-weight:900; color:#DC2626;">${grandTotalI}</td>
                        <td style="${bdr} text-align:center; font-weight:900; background:#FFE4E6; color:#9F1239;">${grandTotalJ + grandTotalI}</td>
                    </tr>
                </tbody>
            </table>
            <div class="doc-footer-sign" style="margin-top:34px;">
                <div class="sign-block">
                    <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                    <div class="sign-line">Firma del Docente</div>
                </div>
                <div class="sign-block">
                    <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                    <div class="sign-line">Firma del Director(a)</div>
                </div>
            </div>`;
        }

        // MODO 3: INASISTENCIAS ANUALES (UNA COLUMNA PARA CADA MES DEL AÑO LECTIVO + FALTAS J / I / TOTAL)
        if (asisModo === 'anual') {
            const schoolMonthIndices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Febrero (1) a Noviembre (10)
            const monthTotals = schoolMonthIndices.map(() => 0);
            let grandAnualI = 0, grandAnualJ = 0;

            const rows = students.map((s, idx) => {
                const stRecords = attendance.filter(a => a.estudianteId === s.id);
                let stI = 0, stJ = 0;
                stRecords.forEach(a => {
                    const st = String(a.estado || '').toUpperCase();
                    if (st === 'A') stI++;
                    else if (st === 'J' || st === 'E' || st === 'PM') stJ++;
                });

                const monthCells = schoolMonthIndices.map((mIdx, colPos) => {
                    const mStr = String(mIdx + 1).padStart(2, '0');
                    const mAbs = stRecords.filter(a => {
                        if (String(a.estado || '').toUpperCase() !== 'A') return false;
                        const pts = String(a.fecha || '').slice(0, 10).split('-');
                        return pts.length >= 2 && pts[1] === mStr;
                    }).length;
                    monthTotals[colPos] += mAbs;
                    return `<td style="${bdr} text-align:center; padding:4px 3px; font-weight:${mAbs > 0 ? '800' : '400'}; color:${mAbs > 0 ? '#DC2626' : '#475569'};">${mAbs}</td>`;
                }).join('');

                grandAnualI += stI;
                grandAnualJ += stJ;
                const stTot = stJ + stI;

                return `<tr>
                    <td style="${bdr} text-align:center; width:30px; font-weight:700; padding:4px 2px;">${idx + 1}</td>
                    <td style="${bdr} text-align:left; padding:4px 8px; font-weight:600; white-space:nowrap;">${s.nombreCompleto}</td>
                    ${monthCells}
                    <td style="${bdr} text-align:center; width:34px; font-weight:700; color:#1D4ED8;">${stJ}</td>
                    <td style="${bdr} text-align:center; width:34px; font-weight:800; color:${stI > 0 ? '#DC2626' : '#0F172A'};">${stI}</td>
                    <td style="${bdr} text-align:center; width:44px; font-weight:900; background:#FFF1F2; color:#9F1239;">${stTot}</td>
                </tr>`;
            }).join('');

            const monthHeaders = schoolMonthIndices.map(mIdx =>
                `<th style="${bdr} text-align:center; background:#F8FAFC; color:#0F172A; font-size:9.5px; font-weight:800; padding:4px 4px; width:54px;">${monthNames[mIdx]}</th>`
            ).join('');
            const footerMonthCells = monthTotals.map(t =>
                `<td style="${bdr} text-align:center; font-weight:800; background:#F8FAFC; color:${t > 0 ? '#DC2626' : '#0F172A'};">${t}</td>`
            ).join('');

            return `${this._docHeader(c, 'Registro de Inasistencias Anuales', `Año Lectivo ${year}`)}
            <table class="doc-table" style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; font-size:10.5px; color:#0F172A; margin-top:8px;">
                <thead>
                    <tr>
                        <th rowspan="2" style="${bdr} width:30px; background:#F8FAFC; color:#0F172A; text-align:center; vertical-align:middle; font-weight:800; padding:5px 2px;">N.L.</th>
                        <th rowspan="2" style="${bdr} min-width:185px; background:#F8FAFC; color:#0F172A; text-align:center; vertical-align:middle; font-weight:800; padding:5px 8px;">Alumno/a</th>
                        <th colspan="3" style="${bdr} text-align:center; background:#BBF7D0; color:#0F172A; font-size:10px; font-weight:800; padding:5px;">I Parcial</th>
                        <th colspan="2" style="${bdr} text-align:center; background:#BAE6FD; color:#0F172A; font-size:10px; font-weight:800; padding:5px;">II Parcial</th>
                        <th colspan="3" style="${bdr} text-align:center; background:#FDE68A; color:#0F172A; font-size:10px; font-weight:800; padding:5px;">III Parcial</th>
                        <th colspan="2" style="${bdr} text-align:center; background:#CBD5E1; color:#0F172A; font-size:10px; font-weight:800; padding:5px;">IV Parcial</th>
                        <th colspan="3" style="${bdr} text-align:center; background:#FDA4AF; color:#0F172A; font-size:10px; font-weight:800; padding:5px;">Faltas Anuales</th>
                    </tr>
                    <tr>
                        ${monthHeaders}
                        <th style="${bdr} text-align:center; background:#F8FAFC; color:#0F172A; width:34px; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Justificadas">J</th>
                        <th style="${bdr} text-align:center; background:#F8FAFC; color:#0F172A; width:34px; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Injustificadas">I</th>
                        <th style="${bdr} text-align:center; background:#FFE4E6; color:#9F1239; width:44px; padding:3px 2px; font-size:9.5px; font-weight:900;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    <tr style="background:#F1F5F9; font-weight:800;">
                        <td colspan="2" style="${bdr} text-align:right; padding:5px 10px; font-weight:900;">TOTALES ANUALES:</td>
                        ${footerMonthCells}
                        <td style="${bdr} text-align:center; font-weight:800;">${grandAnualJ}</td>
                        <td style="${bdr} text-align:center; font-weight:900; color:#DC2626;">${grandAnualI}</td>
                        <td style="${bdr} text-align:center; font-weight:900; background:#FFE4E6; color:#9F1239;">${grandAnualJ + grandAnualI}</td>
                    </tr>
                </tbody>
            </table>
            <div class="doc-footer-sign" style="margin-top:34px;">
                <div class="sign-block">
                    <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                    <div class="sign-line">Firma del Docente</div>
                </div>
                <div class="sign-block">
                    <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                    <div class="sign-line">Firma del Director(a)</div>
                </div>
            </div>`;
        }

        // MODO 1: REGISTRO DE ASISTENCIA MENSUAL (FORMATO SEMANA 1, SEMANA 2, SEMANA 3, SEMANA 4 [L M M J V] + FALTAS [J | I])
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weekLetters = ['L', 'M', 'M', 'J', 'V'];
        const weekColors = ['#BBF7D0', '#BAE6FD', '#FDE68A', '#CBD5E1', '#E9D5FF'];

        // Construir bloques semanales Lunes a Viernes del mes seleccionado
        const weeks = [];
        let currentWeek = [null, null, null, null, null];
        for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, month, d);
            const dow = dt.getDay(); // 0=Dom, 1=Lun .. 5=Vie, 6=Sab
            if (dow >= 1 && dow <= 5) {
                const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                currentWeek[dow - 1] = { d, ds, letter: weekLetters[dow - 1] };
                if (dow === 5) {
                    weeks.push(currentWeek);
                    currentWeek = [null, null, null, null, null];
                }
            }
        }
        if (currentWeek.some(Boolean)) {
            weeks.push(currentWeek);
        }
        while (weeks.length < 4) {
            weeks.push([null, null, null, null, null]);
        }

        const weekGroupHeaders = weeks.map((wk, wIdx) => {
            const bg = weekColors[wIdx % weekColors.length];
            return `<th colspan="5" style="${bdr} text-align:center; background:${bg}; color:#0F172A; font-size:10.5px; font-weight:800; padding:5px 2px;">Semana ${wIdx + 1}</th>`;
        }).join('');

        const daySubHeaders = weeks.map(wk =>
            wk.map((slot, dIdx) => {
                const ltr = weekLetters[dIdx];
                const dayNum = slot ? `<div style="font-size:7.5px; font-weight:600; color:#64748B; line-height:1;">${slot.d}</div>` : '';
                return `<th style="${bdr} width:22px; min-width:22px; text-align:center; background:#F8FAFC; color:#0F172A; padding:2px 1px; font-size:9.5px; font-weight:800;"><div>${ltr}</div>${dayNum}</th>`;
            }).join('')
        ).join('');

        const rows = students.map((s, idx) => {
            let countJ = 0;
            let countI = 0;

            const cells = weeks.map(wk =>
                wk.map(slot => {
                    if (!slot) {
                        return `<td style="${bdr} width:22px; height:20px; background:#F8FAFC; padding:2px 1px;"></td>`;
                    }
                    const att = attendance.find(a => a.estudianteId === s.id && a.fecha === slot.ds);
                    const rawSt = att ? String(att.estado || '').toUpperCase() : '';
                    let disp = rawSt;
                    let color = '#0F172A';
                    if (rawSt === 'A') {
                        countI++;
                        color = '#DC2626';
                    } else if (rawSt === 'J' || rawSt === 'E' || rawSt === 'PM') {
                        countJ++;
                        disp = 'J';
                        color = '#1D4ED8';
                    } else if (rawSt === 'P') {
                        color = '#15803D';
                    } else if (rawSt === 'T') {
                        color = '#D97706';
                    }
                    return `<td style="${bdr} width:22px; height:20px; text-align:center; font-size:9.5px; font-weight:700; color:${color}; padding:2px 1px;">${disp}</td>`;
                }).join('')
            ).join('');

            return `<tr>
                <td style="${bdr} text-align:center; width:28px; font-weight:700; padding:3px 2px;">${idx + 1}</td>
                <td style="${bdr} text-align:left; padding:3px 8px; font-weight:600; white-space:nowrap;">${s.nombreCompleto}</td>
                ${cells}
                <td style="${bdr} text-align:center; width:26px; font-weight:700; color:${countJ > 0 ? '#1D4ED8' : '#64748B'}; padding:3px 2px;">${countJ || ''}</td>
                <td style="${bdr} text-align:center; width:26px; font-weight:800; color:${countI > 0 ? '#DC2626' : '#64748B'}; padding:3px 2px;">${countI || ''}</td>
            </tr>`;
        }).join('');

        return `${this._docHeader(c, 'Registro de Asistencia', `Mes de ${monthNames[month]} ${year}`)}
        <table class="doc-table" style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; font-size:10.5px; color:#0F172A; margin-top:8px;">
            <thead>
                <tr>
                    <th rowspan="2" style="${bdr} width:28px; background:#F8FAFC; color:#0F172A; text-align:center; vertical-align:middle; font-weight:800; padding:4px 2px;">N.L.</th>
                    <th rowspan="2" style="${bdr} min-width:180px; background:#F8FAFC; color:#0F172A; text-align:center; vertical-align:middle; font-weight:800; padding:4px 8px;">Alumno/a</th>
                    ${weekGroupHeaders}
                    <th colspan="2" style="${bdr} text-align:center; background:#FDA4AF; color:#0F172A; font-size:10.5px; font-weight:800; padding:5px 2px;">Faltas</th>
                </tr>
                <tr>
                    ${daySubHeaders}
                    <th style="${bdr} width:26px; text-align:center; background:#F8FAFC; color:#0F172A; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Justificadas">J</th>
                    <th style="${bdr} width:26px; text-align:center; background:#F8FAFC; color:#0F172A; padding:3px 2px; font-size:9.5px; font-weight:800;" title="Injustificadas">I</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="doc-footer-sign" style="margin-top:34px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Firma del Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Firma del Director(a)</div>
            </div>
        </div>`;
    },

    _buildParteMensual(c) {
        return Views.ParteMensual.render(true);
    },

    _buildCuadroControlador(c) {
        const cfg = this._getConfig();
        const parcialId = cfg.parcialId;
        const configDim = Store.data.configAcademica?.dimensions || [];
        let activities = Store.get('actividades').filter(a => a.cursoId === c.id);
        let titleSuffix = 'Todos los Parciales';
        if (parcialId) {
            activities = activities.filter(a => a.parcialId === parcialId);
            const p = Store.get('parciales').find(par => String(par.id) === String(parcialId));
            if (p) titleSuffix = p.nombre;
        }
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const scores = Store.get('calificaciones');

        const columns = [];
        configDim.forEach(dim => {
            const dimActs = activities.filter(a => a.dimensionKey === dim.key);
            if (dimActs.length > 0) columns.push({ dimension: dim, activities: dimActs });
        });

        if (columns.length === 0) {
            return `${this._docHeader(c, 'Cuadro Controlador', titleSuffix)}<p style="text-align:center;color:#94A3B8;padding:20px;">Sin actividades registradas para esta selección.</p>`;
        }

        // Configuración de Actividades Extraordinarias / Puntos Extra
        const extraSetting = (typeof Store.getExtraActivitiesSetting === 'function')
            ? Store.getExtraActivitiesSetting()
            : { enabled: true, allow_above_100: false, visible_in_cuadro: true };
        const isExtraEnabled = extraSetting.enabled !== false;
        const allowAbove100 = extraSetting.allow_above_100 === true;

        const extraActivitiesList = isExtraEnabled
            ? (parcialId
                ? (typeof Store.getExtraordinaryActivities === 'function' ? Store.getExtraordinaryActivities(c.id, parcialId) : [])
                : ((Store.data.extraordinary_activities || []).filter(a => a.course_id === c.id)))
            : [];
        const extraPointsMap = new Map();
        if (isExtraEnabled && extraActivitiesList.length > 0 && Store.data.activity_bonus_records) {
            const extraActIds = new Set(extraActivitiesList.map(a => a.id));
            Store.data.activity_bonus_records.forEach(r => {
                if (extraActIds.has(r.extraordinary_activity_id) && r.participated !== false) {
                    const pts = Number(r.points_awarded) || 0;
                    extraPointsMap.set(r.student_id, (extraPointsMap.get(r.student_id) || 0) + pts);
                }
            });
        }

        const courseParciales = Store.getParcialByCourse(c.id) || [];
        const currentParcIdx = courseParciales.findIndex(p => String(p.id) === String(parcialId));
        const isLastParc = (currentParcIdx === 3 || (courseParciales.length > 0 && currentParcIdx === courseParciales.length - 1));

        const vHead = (txt, wrap = false) => `<div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:${wrap ? 'normal' : 'nowrap'}; display:inline-block; margin:0 auto; line-height:1.15;${wrap ? ' max-height:165px; text-align:left;' : ''}">${txt}</div>`;

        const lastColHeader = isLastParc
            ? `<th rowspan="2" style="width:72px; min-width:68px; text-align:center; vertical-align:middle; font-size:9.5px; font-weight:900; background:#f1f5f9; border:1px solid #94a3b8; color:#0f172a; padding:8px 3px; text-transform:uppercase; letter-spacing:0.03em;">${vHead('OBSERVACIONES')}</th>`
            : `<th rowspan="2" style="width:52px; min-width:48px; text-align:center; vertical-align:middle; font-size:9px; font-weight:900; background:#f1f5f9; border:1px solid #94a3b8; color:#0f172a; padding:8px 2px; text-transform:uppercase;">${vHead('FALTAN PARA 280 <span style="font-size:7.5px; font-weight:600; color:#475569;">(META ANUAL)</span>', true)}</th>`;

        const summaryTh1 = parcialId ? `
            <th rowspan="2" style="width:40px; min-width:36px; text-align:center; vertical-align:middle; font-size:9px; font-weight:900; background:#f1f5f9; border:1px solid #94a3b8; color:#0f172a; padding:8px 2px; text-transform:uppercase;">${vHead('SUB-TOTAL')}</th>
            ${isExtraEnabled ? `<th rowspan="2" style="width:38px; min-width:34px; text-align:center; vertical-align:middle; font-size:9px; font-weight:900; background:#f5f3ff; border:1px solid #94a3b8; color:#4338ca; padding:8px 2px; text-transform:uppercase;">${vHead('ACT. EXTRA')}</th>` : ''}
            <th rowspan="2" style="width:42px; min-width:38px; text-align:center; vertical-align:middle; font-size:9px; font-weight:900; background:#ecfdf5; border:1px solid #94a3b8; color:#065f46; padding:8px 2px; text-transform:uppercase;">${vHead('NOTA REPORTABLE')}</th>
            <th rowspan="2" style="width:60px; min-width:56px; text-align:center; vertical-align:middle; font-size:9.5px; font-weight:900; background:#f1f5f9; border:1px solid #94a3b8; color:#0f172a; padding:8px 3px; text-transform:uppercase;">${vHead('NIVEL')}</th>
            ${lastColHeader}
        ` : `<th rowspan="2" style="width:44px; min-width:40px; max-width:48px; text-align:center; vertical-align:middle; font-size:9.5px; font-weight:900; background:#f0fdf4; border:1px solid #94a3b8; color:#15803d; padding:8px 2px; text-transform:uppercase;">${vHead('Nota Final')}</th>`;

        const th1 = columns.map(col =>
            `<th colspan="${col.activities.length+1}" style="text-align:center; font-size:9.5px; font-weight:800; border: 1px solid #94a3b8; background: #e2e8f0; padding: 6px 4px; text-transform:uppercase; line-height:1.2; vertical-align:middle; color:#0f172a;">${col.dimension.nombre}<br><span style="font-weight:600; color:#475569; font-size:8.5px;">(${col.dimension.porcentaje}%)</span></th>`
        ).join('') + summaryTh1;

        const th2 = columns.map(col =>
            col.activities.map(act => `
                <th style="height:175px; width:38px; min-width:36px; max-width:44px; vertical-align:bottom; padding:8px 3px 6px; background:#ffffff; border:1px solid #94a3b8; color:#0f172a; text-align:center; position:relative; overflow:hidden;" title="${act.nombre}">
                    <div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:normal; display:inline-block; font-size:9.5px; font-weight:700; color:#0f172a; letter-spacing:0.01em; line-height:1.15; max-height:142px; overflow:hidden; text-overflow:ellipsis; text-align:left; margin:0 auto;" title="${act.nombre}">
                        ${act.nombre}
                    </div>
                    <div style="font-weight:700; color:#475569; font-size:8.5px; margin-top:5px; border-top:1px solid #94a3b8; padding-top:4px;">
                        /${act.puntajeMax}
                    </div>
                </th>
            `).join('') + `
                <th style="height:175px; width:38px; min-width:36px; max-width:42px; background:#e0f2fe; border:1px solid #94a3b8; color:#0369a1; text-align:center; vertical-align:bottom; padding:8px 3px 6px;">
                    <div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:nowrap; display:inline-block; font-size:10px; font-weight:800; text-transform:uppercase; color:#0369a1; margin:0 auto; letter-spacing:0.04em;">
                        SUBTOTAL
                    </div>
                    <div style="font-weight:700; color:#0284c7; font-size:8.5px; margin-top:5px; border-top:1px solid #94a3b8; padding-top:4px;">
                        /${col.dimension.porcentaje}
                    </div>
                </th>
            `
        ).join('');

        const rows = students.map((s, idx) => {
            let studentFinal = 0;
            let hasStudentDimScore = false;

            const cells = columns.map(col => {
                let dimObtained = 0;
                let dimMax = 0;
                const actCells = col.activities.map(act => {
                    const sc = scores.find(x => x.actividadId === act.id && x.estudianteId === s.id);
                    const hasVal = sc && sc.puntajeObtenido !== undefined && sc.puntajeObtenido !== null && sc.puntajeObtenido !== '';
                    const val = hasVal ? Number(sc.puntajeObtenido) : 0;
                    if (hasVal) {
                        dimObtained += val;
                        hasStudentDimScore = true;
                    }
                    dimMax += Number(act.puntajeMax) || 0;
                    return `<td style="text-align:center; font-size:10.5px; border:1px solid #94a3b8; padding:4px 2px;">${hasVal ? val : ''}</td>`;
                }).join('');

                const dimSub = dimMax > 0 ? Math.min(((dimObtained / dimMax) * col.dimension.porcentaje), col.dimension.porcentaje) : 0;
                studentFinal += dimSub;
                const roundedSub = Math.round(dimSub);

                return `${actCells}<td class="td-subtotal" style="text-align:center; font-weight:800; font-size:11px; background:#f8fafc; color:#1e293b; border:1px solid #94a3b8; padding:4px 2px;">${roundedSub}</td>`;
            }).join('');

            const emgGradeVal = (typeof Store.getEmergencyGrade === 'function' && parcialId)
                ? Store.getEmergencyGrade(c.id, parcialId, s.id, currentParcIdx)
                : null;
            const useEmgGrade = (emgGradeVal !== null && !hasStudentDimScore);

            const finalInt = useEmgGrade ? Math.round(Number(emgGradeVal)) : Math.round(studentFinal);
            const studentExtra = isExtraEnabled ? (extraPointsMap.get(s.id) || 0) : 0;
            const studentTotalAcum = finalInt + studentExtra;
            const studentReportable = allowAbove100 ? studentTotalAcum : Math.min(100, studentTotalAcum);

            const perf = Logic.getPerformance(isExtraEnabled ? studentReportable : finalInt);
            const isInactive = s.estadoMatricula === 'Desertor' || s.estadoMatricula === 'Traslado';
            const rowOpac = isInactive ? 'opacity:0.6;' : '';
            const stDecor = isInactive ? 'text-decoration:line-through;' : '';
            const stBadge = s.estadoMatricula === 'Desertor' ? ' <span style="font-size:8px; color:#b91c1c; font-weight:800;">(Des.)</span>' : (s.estadoMatricula === 'Traslado' ? ' <span style="font-size:8px; color:#b45309; font-weight:800;">(Tras.)</span>' : '');

            const ptsNeededData = (typeof Views.Cuadro !== 'undefined' && Views.Cuadro.getPointsNeededFor280 && parcialId)
                ? Views.Cuadro.getPointsNeededFor280(s.id, c.id, parcialId, currentParcIdx, Math.min(100, studentTotalAcum))
                : null;

            const lastColCell = isLastParc
                ? `<td style="text-align:center; font-weight:900; font-size:11px; border:1px solid #94a3b8; background:#ffffff;">${
                    ptsNeededData
                        ? (ptsNeededData.isPassed !== undefined
                            ? (ptsNeededData.isPassed
                                ? '<span style="color:#15803d; font-weight:900;">Aprobado</span>'
                                : '<span style="color:#b91c1c; font-weight:900;">Reprobado</span>')
                            : (ptsNeededData.number || '—'))
                        : '—'
                }</td>`
                : `<td style="text-align:center; font-weight:900; font-size:11px; border:1px solid #94a3b8; background:#ffffff; color:#0f172a;">${ptsNeededData ? ptsNeededData.number : '—'}</td>`;

            const summaryRowCells = parcialId ? `
                <td style="text-align:center; font-weight:800; font-size:11px; background:#f8fafc; border:1px solid #94a3b8; color:#0f172a;">${finalInt}%</td>
                ${isExtraEnabled ? `<td style="text-align:center; font-weight:700; font-size:10.5px; background:#f5f3ff; color:#4338ca; border:1px solid #94a3b8;">${studentExtra > 0 ? '+' + studentExtra + '%' : '0'}</td>` : ''}
                <td style="text-align:center; font-weight:900; font-size:11.5px; background:#ecfdf5; color:#047857; border:1px solid #94a3b8;">${studentReportable}%</td>
                <td style="text-align:center; font-size:10px; font-weight:800; border:1px solid #94a3b8;">${
                    isInactive
                        ? (s.estadoMatricula === 'Desertor' ? '<span style="color:#b91c1c; font-weight:900;">Desertor</span>' : '<span style="color:#b45309; font-weight:900;">Traslado</span>')
                        : `<span style="font-weight:900;">${perf.label}</span>`
                }</td>
                ${lastColCell}
            ` : `<td class="td-nota" style="text-align:center; font-weight:900;">${Logic.calculateGrade(s.id, c.id)}</td>`;

            return `<tr style="${rowOpac}">
                <td style="text-align:center; font-weight:700; font-size:10.5px; border:1px solid #94a3b8; color:#64748b; padding:4px 2px;">${idx + 1}</td>
                <td class="td-name" style="text-align:left; font-weight:700; border:1px solid #94a3b8; padding:5px 8px; white-space:nowrap;"><span style="${stDecor}">${s.nombreCompleto}</span>${stBadge}</td>
                ${cells}
                ${summaryRowCells}
            </tr>`;
        }).join('');

        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);

        return `${this._docHeader(c, 'Cuadro Controlador de Calificaciones', titleSuffix)}
        <table class="doc-table" style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif;">
            <thead>
                <tr>
                    <th class="th-center" rowspan="2" style="width:34px; min-width:32px; font-size:10px; font-weight:800; background:#f1f5f9; color:#0f172a; border:1px solid #94a3b8; text-align:center; vertical-align:middle;">N°</th>
                    <th class="th-left" rowspan="2" style="min-width:180px; font-size:11px; font-weight:800; background:#f1f5f9; color:#0f172a; border:1px solid #94a3b8; padding:12px 10px; vertical-align:middle; text-align:left; white-space:nowrap;">Estudiante</th>
                    ${th1}
                </tr>
                <tr>${th2}</tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="doc-footer-sign">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Director(a)</div>
            </div>
        </div>`;
    },

    _buildTabulacionFormativas(c) {
        const cfg = this._getConfig();
        const mes = cfg.mesPF || 'Febrero/Marzo';
        
        // Fetch the formative tests data from localStorage
        const key = 'pruebas_formativas_' + (c.id || 'none') + '_' + mes.replace(/\//g, '-');
        const raw = localStorage.getItem(key);
        let data = null;
        if (raw) {
            try { data = JSON.parse(raw); } catch (e) { console.error('Corrupted local data', e); }
        }
        
        // Get the students in the course
        const students = (Store.getStudentsByCourse(c.id) || []).filter(s => s.estadoMatricula !== 'Traslado');
        
        // If there's no data or it needs syncing, build/sync it
        if (!data) {
            const filas = students.map(st => ({
                estudianteId: st.id,
                nombre: st.nombreCompleto || st.nombre || '',
                lectura: '',
                escritura: ''
            }));
            data = { filas: filas };
        } else {
            // Sync with current students
            const existingIds = {};
            data.filas.forEach(f => { existingIds[f.estudianteId] = true; });
            let synced = false;
            students.forEach(st => {
                if (!existingIds[st.id]) {
                    data.filas.push({
                        estudianteId: st.id,
                        nombre: st.nombreCompleto || st.nombre || '',
                        lectura: '',
                        escritura: ''
                    });
                    synced = true;
                }
            });
            // Remove students no longer in the course
            const currentIds = {};
            students.forEach(st => { currentIds[st.id] = true; });
            const before = data.filas.length;
            data.filas = data.filas.filter(f => currentIds[f.estudianteId]);
            if (data.filas.length !== before) synced = true;
            if (synced) {
                try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error('Local storage quota exceeded', e); }
            }
        }
        
        const filas = data.filas || [];
        
        // Compute stats for the summary table and charts
        const stats = {
            lectura: { A:0, S:0, DM:0, I:0, total:0 },
            escritura: { A:0, S:0, DM:0, I:0, total:0 }
        };
        
        const getLecturaNivel = function(score) {
            if (score === '' || score === null || score === undefined) return '';
            var s = parseFloat(score);
            if (isNaN(s)) return '';
            if (s >= 18) return 'A';
            if (s >= 14) return 'S';
            if (s >= 8) return 'DM';
            return 'I';
        };

        const getEscrituraNivel = function(score) {
            if (score === '' || score === null || score === undefined) return '';
            var s = parseFloat(score);
            if (isNaN(s)) return '';
            if (s >= 6) return 'A';
            if (s >= 4) return 'S';
            if (s >= 2) return 'DM';
            return 'I';
        };
        
        const getNivelStyles = function(nivel) {
            switch(nivel) {
                case 'A': return { bg: '#f3e8ff', color: '#9333ea', name: 'Avanzado' };
                case 'S': return { bg: '#dcfce7', color: '#16a34a', name: 'Satisfactorio' };
                case 'DM': return { bg: '#ffedd5', color: '#ea580c', name: 'Debe Mejorar' };
                case 'I': return { bg: '#fee2e2', color: '#dc2626', name: 'Insatisfactorio' };
                default: return { bg: 'transparent', color: 'inherit', name: '' };
            }
        };

        const getTotalPuntos = function(lectura, escritura) {
            if (lectura === '' && escritura === '') return '';
            var l = lectura !== '' ? parseFloat(lectura) : 0;
            var e = escritura !== '' ? parseFloat(escritura) : 0;
            return l + e;
        };

        filas.forEach(f => {
            const lvlL = getLecturaNivel(f.lectura);
            const lvlE = getEscrituraNivel(f.escritura);
            if (lvlL) { stats.lectura[lvlL]++; stats.lectura.total++; }
            if (lvlE) { stats.escritura[lvlE]++; stats.escritura.total++; }
        });

        // Message if no students (but still continue to render charts below)
        const noStudentsMsg = students.length === 0
            ? `<p style="text-align:center;color:#94A3B8;padding:16px;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1;margin-bottom:12px;">No hay estudiantes matriculados en este curso.</p>`
            : '';




        // Rich chart renderer - matches pruebas_formativas.js style with larger 110px pie
        const renderPFChart = function(title, area) {
            const st = stats[area];
            const tot = st.total || 1;
            const pA  = Math.round(st.A  / tot * 100);
            const pS  = Math.round(st.S  / tot * 100);
            const pDM = Math.round(st.DM / tot * 100);
            const pI  = Math.round(st.I  / tot * 100);

            const c1 = (st.A  / tot) * 360;
            const c2 = c1 + (st.S  / tot) * 360;
            const c3 = c2 + (st.DM / tot) * 360;

            let pieGradient = `conic-gradient(#22c55e 0deg ${c1}deg, #84cc16 ${c1}deg ${c2}deg, #eab308 ${c2}deg ${c3}deg, #ef4444 ${c3}deg 360deg)`;
            if (st.total === 0) pieGradient = '#e2e8f0';

            const maxVal = Math.max(st.A, st.S, st.DM, st.I, 1);
            const bA  = Math.max(4, Math.round((st.A  / maxVal) * 80));
            const bS  = Math.max(4, Math.round((st.S  / maxVal) * 80));
            const bDM = Math.max(4, Math.round((st.DM / maxVal) * 80));
            const bI  = Math.max(4, Math.round((st.I  / maxVal) * 80));
            const noDataNote = st.total === 0 ? `<div style="text-align:center;color:#94a3b8;font-size:9px;padding:4px 0 8px;font-style:italic;">Sin datos registrados</div>` : '';

            return `
            <div style="flex:1; min-width:260px; border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.07);">
                <div style="background:#f0f9ff; border-bottom:1.5px solid #e0f2fe; padding:10px 14px; font-weight:700; font-size:11px; color:#0369a1; text-transform:uppercase; letter-spacing:0.04em;">
                    &#x1F4CA; RESULTADOS: ${title}
                </div>
                ${noDataNote}
                <div style="display:flex; flex-wrap:wrap;">
                    <div style="flex:1; min-width:150px; padding:14px 10px; display:flex; flex-direction:column; align-items:center; gap:10px; border-right:1px solid #f1f5f9;">
                        <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">Porcentaje por nivel</div>
                        <div style="width:110px; height:110px; border-radius:50%; background:${pieGradient}; box-shadow:0 2px 8px rgba(0,0,0,0.08); border:4px solid #fff; flex-shrink:0;"></div>
                        <div style="font-size:10px; display:flex; flex-direction:column; gap:5px; color:#475569; width:100%; max-width:145px;">
                            <div style="display:flex;align-items:center;justify-content:space-between;"><span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#22c55e;margin-right:5px;"></span>Avanzado</span><span style="font-weight:700;color:#166534;">${pA}%</span></div>
                            <div style="display:flex;align-items:center;justify-content:space-between;"><span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#84cc16;margin-right:5px;"></span>Satisfactorio</span><span style="font-weight:700;color:#3f6212;">${pS}%</span></div>
                            <div style="display:flex;align-items:center;justify-content:space-between;"><span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#eab308;margin-right:5px;"></span>Debe Mejorar</span><span style="font-weight:700;color:#854d0e;">${pDM}%</span></div>
                            <div style="display:flex;align-items:center;justify-content:space-between;"><span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#ef4444;margin-right:5px;"></span>Insatisfact.</span><span style="font-weight:700;color:#991b1b;">${pI}%</span></div>
                        </div>
                    </div>
                    <div style="flex:1; min-width:150px; padding:14px 10px; display:flex; flex-direction:column; gap:6px;">
                        <div style="font-size:9px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; text-align:center;">Cantidad de educandos</div>
                        <div style="display:flex; align-items:flex-end; justify-content:space-around; height:95px; padding-bottom:6px; border-bottom:1px solid #f1f5f9; margin-top:4px;">
                            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span style="font-size:10px;font-weight:700;color:#334155;">${st.A}</span><div style="width:24px;background:#dcfce7;border:1px solid #86efac;border-radius:4px 4px 0 0;height:${bA}px;"></div><span style="font-size:9px;color:#64748b;font-weight:600;">A</span></div>
                            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span style="font-size:10px;font-weight:700;color:#334155;">${st.S}</span><div style="width:24px;background:#ecfccb;border:1px solid #bef264;border-radius:4px 4px 0 0;height:${bS}px;"></div><span style="font-size:9px;color:#64748b;font-weight:600;">S</span></div>
                            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span style="font-size:10px;font-weight:700;color:#334155;">${st.DM}</span><div style="width:24px;background:#fef9c3;border:1px solid #fde047;border-radius:4px 4px 0 0;height:${bDM}px;"></div><span style="font-size:9px;color:#64748b;font-weight:600;">DM</span></div>
                            <div style="display:flex;flex-direction:column;align-items:center;gap:3px;"><span style="font-size:10px;font-weight:700;color:#334155;">${st.I}</span><div style="width:24px;background:#fee2e2;border:1px solid #fca5a5;border-radius:4px 4px 0 0;height:${bI}px;"></div><span style="font-size:9px;color:#64748b;font-weight:600;">I</span></div>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:9px;color:#64748b;padding-top:4px;">Total evaluados: <span style="font-weight:700;color:#0f172a;">${st.total}</span></div>
                    </div>
                </div>
            </div>`;
        };

        const chartsHTML = `
        <div style="margin:14px 0; page-break-inside:avoid;">
            <div style="font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.05em; padding:6px 0; border-bottom:1px solid #e2e8f0; margin-bottom:12px;">Gr&#xe1;ficos de desempe&#xf1;o</div>
            <div style="display:flex; gap:14px; flex-wrap:wrap;">
                ${renderPFChart('Lectura y Gram&#xe1;tica', 'lectura')}
                ${renderPFChart('Escritura', 'escritura')}
            </div>
        </div>`;

        // Generate statistics and summary table
        const matriculaTotal = filas.length;
        const summaryTable = `
        <div style="margin-top: 24px; page-break-inside: avoid;">
            <table class="doc-table" style="width: 100%; max-width: 650px; margin: 14px auto 0 auto;">
                <thead>
                    <tr>
                        <th colspan="3" style="background:#f8fafc; color:#334155; border: 1px solid #94a3b8; padding:8px; font-weight:700; font-size:12px;">Resumen de educandos en cada nivel de desempeño</th>
                    </tr>
                    <tr style="background:#f1f5f9; color:#475569; font-weight:600; font-size:10px;">
                        <th style="border: 1px solid #94a3b8; padding:6px; width:40%;">Nivel de desempeño</th>
                        <th style="border: 1px solid #94a3b8; padding:6px; width:30%;">Lectura y Gramática</th>
                        <th style="border: 1px solid #94a3b8; padding:6px; width:30%;">Escritura</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="background:#dcfce7; font-weight:600; color:#166534; text-align:left; border: 1px solid #94a3b8; padding:6px;">AVANZADO (A)</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.lectura.A}</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.escritura.A}</td>
                    </tr>
                    <tr>
                        <td style="background:#ecfccb; font-weight:600; color:#3f6212; text-align:left; border: 1px solid #94a3b8; padding:6px;">SATISFACTORIO (S)</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.lectura.S}</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.escritura.S}</td>
                    </tr>
                    <tr>
                        <td style="background:#fef9c3; font-weight:600; color:#854d0e; text-align:left; border: 1px solid #94a3b8; padding:6px;">DEBE MEJORAR (DM)</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.lectura.DM}</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.escritura.DM}</td>
                    </tr>
                    <tr>
                        <td style="background:#fee2e2; font-weight:600; color:#991b1b; text-align:left; border: 1px solid #94a3b8; padding:6px;">INSATISFACTORIO (I)</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.lectura.I}</td>
                        <td style="border: 1px solid #94a3b8; padding:6px; font-weight:bold;">${stats.escritura.I}</td>
                    </tr>
                    <tr style="background:#f8fafc; font-weight:bold;">
                        <td style="border: 1px solid #94a3b8; padding:8px; text-align:left;">Total evaluados</td>
                        <td style="border: 1px solid #94a3b8; padding:8px; color:#1e293b;">${stats.lectura.total}</td>
                        <td style="border: 1px solid #94a3b8; padding:8px; color:#1e293b;">${stats.escritura.total}</td>
                    </tr>
                    <tr style="background:#f8fafc; font-size:10px;">
                        <td colspan="3" style="border: 1px solid #94a3b8; padding:8px; text-align:center; color:#64748b; font-weight:500;">
                            Porcentaje de evaluados: <span style="font-weight:700; color:#0ea5e9;">${matriculaTotal > 0 ? '100%' : '0%'}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>`;

        // Generate student table rows
        const rows = filas.map((fila, idx) => {
            const lvlL = getLecturaNivel(fila.lectura);
            const lvlE = getEscrituraNivel(fila.escritura);
            const total = getTotalPuntos(fila.lectura, fila.escritura);
            const styleL = getNivelStyles(lvlL);
            const styleE = getNivelStyles(lvlE);
            const tdLStyle = lvlL ? `background:${styleL.bg}; color:${styleL.color}; font-weight:bold;` : '';
            const tdEStyle = lvlE ? `background:${styleE.bg}; color:${styleE.color}; font-weight:bold;` : '';
            return `<tr>
                <td>${idx + 1}</td>
                <td class="td-name">${fila.nombre}</td>
                <td>${fila.lectura !== '' && fila.lectura !== undefined ? fila.lectura : '-'}</td>
                <td style="${tdLStyle}">${lvlL ? styleL.name.toUpperCase() : '-'}</td>
                <td>${fila.escritura !== '' && fila.escritura !== undefined ? fila.escritura : '-'}</td>
                <td style="${tdEStyle}">${lvlE ? styleE.name.toUpperCase() : '-'}</td>
                <td class="td-subtotal">${total !== '' ? total : '-'}</td>
            </tr>`;
        }).join('');

        const tableHTML = students.length > 0 ? `
        <table class="doc-table" style="page-break-inside:auto;">
            <thead style="display:table-header-group;">
                <tr>
                    <th style="width:40px;">#</th>
                    <th class="th-left">Estudiante</th>
                    <th style="width:100px;">Lectura /20</th>
                    <th style="width:140px;">Desempe&#xf1;o Lectura</th>
                    <th style="width:100px;">Escritura /6</th>
                    <th style="width:140px;">Desempe&#xf1;o Escritura</th>
                    <th style="width:100px;">Total Puntos</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>` : '';

        // Page 1: charts + summary (always together, no page break)
        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);

        const page1HTML = `
        <div style="page-break-inside:avoid;">
            ${chartsHTML}
            ${summaryTable}
            <div class="doc-footer-sign" style="margin-top:24px;">
                <div class="sign-block">
                    <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                    <div class="sign-line">Docente</div>
                </div>
                <div class="sign-block">
                    <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                    <div class="sign-line">Director(a)</div>
                </div>
            </div>
        </div>`;

        // Page 2+: student roster (starts on a new page when printing)
        const compactSubheader = students.length > 0 ? `
        <div style="page-break-before:always; padding-top:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0F172A; padding-bottom:6px; margin-bottom:10px;">
                <div>
                    <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:#0F172A;">${c.centroEducativo || 'Centro Educativo'}</div>
                    <div style="font-size:10px; color:#475569; margin-top:2px;">Tabulaci&#xf3;n de Pruebas Formativas &mdash; Mes: ${mes}</div>
                </div>
                <div style="font-size:10px; color:#475569; text-align:right;">
                    <div>${c.grado} &ldquo;${c.seccion}&rdquo;</div>
                    <div>Docente: <b>${docenteNombre || '___________'}</b></div>
                </div>
            </div>
            <div style="font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:8px;">Listado de educandos (${students.length} estudiantes)</div>
            ${tableHTML}
        </div>` : '';

        return `${this._docHeader(c, 'Tabulaci&#xf3;n de Pruebas Formativas', 'Mes: ' + mes)}
        ${noStudentsMsg}
        ${page1HTML}
        ${compactSubheader}`;
    },
    _buildTabulacionMensual(c) {
        const cfg = this._getConfig();
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const month = cfg.mes; const year = cfg.anio;
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const scores = Store.get('calificaciones');
        const parciales = Store.getParcialByCourse(c.id);

        // Filter activities in month
        let activities = Store.get('actividades').filter(a => a.cursoId === c.id);
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month+1, 0);
        activities = activities.filter(a => {
            if (!a.parcialId) return true;
            const p = parciales.find(pr => pr.id === a.parcialId);
            if (!p) return false;
            const pStart = new Date(p.fechaInicio);
            const pEnd = new Date(p.fechaFin);
            return pStart <= monthEnd && pEnd >= monthStart;
        });

        if (activities.length === 0) {
            return `${this._docHeader(c, 'Tabulación Mensual', monthNames[month]+' '+year)}<p style="text-align:center;color:#94A3B8;padding:20px;">Sin actividades registradas para este mes.</p>`;
        }

        const actHeaders = activities.map(a => `
            <th style="height:120px; width:30px; min-width:30px; max-width:30px; vertical-align:bottom; padding:8px 2px 6px; background:#2b394e; border:1px solid #94a3b8; color:white; text-align:center; position:relative;">
                <div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:nowrap; display:inline-block; font-size:9.5px; font-weight:700; letter-spacing:0.02em; text-transform:uppercase; max-height:95px; overflow:hidden; text-overflow:ellipsis; margin:0 auto;">
                    ${a.nombre}
                </div>
                <div style="font-weight:500; opacity:0.85; font-size:8px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.35); padding-top:4px;">
                    /${a.puntajeMax||100}
                </div>
            </th>
        `).join('');
        const rows = students.map(s => {
            let sum = 0; let n = 0;
            const cells = activities.map(a => {
                const sc = scores.find(x => x.actividadId===a.id && x.estudianteId===s.id);
                const val = sc ? Number(sc.puntajeObtenido) : null;
                if (val !== null) { sum += val; n++; }
                return `<td>${val !== null ? val : ''}</td>`;
            }).join('');
            const avg = n > 0 ? (sum/n).toFixed(1) : '';
            return `<tr><td class="td-name">${s.nombreCompleto}</td>${cells}<td class="td-nota">${avg}</td></tr>`;
        }).join('');

        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);

        return `${this._docHeader(c, 'Tabulación Mensual de Actividades', monthNames[month]+' '+year)}
        <table class="doc-table">
            <thead><tr>
                <th class="th-left" style="min-width:150px; font-size:11px; font-weight:800; background:#1e293b; color:white; border:1px solid #94a3b8; padding:12px 10px; vertical-align:middle; text-align:left;">Estudiante</th>
                ${actHeaders}
                <th style="height:120px; width:32px; min-width:32px; max-width:32px; vertical-align:bottom; padding:8px 2px 6px; background:#15803d; border:1px solid #94a3b8; color:white; text-align:center; position:relative;">
                    <div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:nowrap; display:inline-block; font-size:9.5px; font-weight:800; letter-spacing:0.04em; text-transform:uppercase; max-height:95px; overflow:hidden; text-overflow:ellipsis; margin:0 auto;">
                        Promedio
                    </div>
                    <div style="font-weight:500; opacity:0; font-size:8px; margin-top:4px; border-top:1px dashed transparent; padding-top:4px; user-select:none;">
                        /0
                    </div>
                </th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="doc-obs-box">Observaciones: __________________________________________</div>
        <div class="doc-footer-sign">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Director(a)</div>
            </div>
        </div>`;
    },

    _calculateStudentParcialGrade(studentId, courseId, parcialId) {
        const acts = Store.get('actividades').filter(a => a.cursoId === courseId && a.parcialId === parcialId);
        const scores = Store.get('calificaciones').filter(c => c.estudianteId === studentId && c.cursoId === courseId);
        let finalScore = 0;
        const dims = Store.data.configAcademica?.dimensions || [
            { key: 'cotidiana', nombre: 'Actividades Cotidianas', porcentaje: 35 },
            { key: 'extra', nombre: 'Actividades Extraclase', porcentaje: 15 },
            { key: 'prueba', nombre: 'Prueba Escrita', porcentaje: 35 },
            { key: 'valores', nombre: 'Valores', porcentaje: 15 }
        ];
        dims.forEach(dim => {
            const dimActs = acts.filter(a => a.dimensionKey === dim.key);
            if (dimActs.length === 0) return;
            let totalObtained = 0;
            let totalMax = 0;
            dimActs.forEach(act => {
                const score = scores.find(s => s.actividadId === act.id);
                totalMax += Number(act.puntajeMax);
                if (score) totalObtained += Number(score.puntajeObtenido);
            });
            if (totalMax > 0) {
                const dimScore = (totalObtained / totalMax) * dim.porcentaje;
                finalScore += dimScore;
            }
        });
        return Math.round(finalScore);
    },

    _getNivelDesempeno(score) {
        if (score >= 91) return 'E';
        if (score >= 81) return 'A';
        if (score >= 70) return 'B';
        return 'I';
    },

    _getNivelLabel(score) {
        if (score >= 91) return 'Excelente (E)';
        if (score >= 81) return 'Avanzado (A)';
        if (score >= 70) return 'Básico (B)';
        return 'Inicial (I)';
    },

    _buildActaCalificaciones(c) {
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const parciales = Store.getParcialByCourse(c.id);
        
        const stats = { E: 0, A: 0, B: 0, I: 0 };
        const rows = students.map((s, idx) => {
            let totalSum = 0;
            let count = 0;
            const cells = parciales.map(p => {
                const grade = this._calculateStudentParcialGrade(s.id, c.id, p.id);
                totalSum += grade;
                count++;
                return `<td>${grade}%</td>`;
            }).join('');
            
            const finalGrade = count > 0 ? Math.round(totalSum / count) : 0;
            const level = this._getNivelDesempeno(finalGrade);
            stats[level]++;
            
            return `<tr>
                <td style="text-align:center;">${idx+1}</td>
                <td class="td-name">${s.nombreCompleto}</td>
                ${cells}
                <td class="td-nota" style="font-weight:bold;">${finalGrade}%</td>
                <td style="font-weight:bold; text-align:center;">${level}</td>
            </tr>`;
        }).join('');
        
        const totalStudents = students.length || 1;
        const statsHtml = `
        <div class="doc-stats-row" style="margin-top:15px; margin-bottom:15px;">
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#10B981;">${stats.E}</div><div class="doc-stat-lbl">Excelente (E)<br>${Math.round((stats.E/totalStudents)*100)}%</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#3B82F6;">${stats.A}</div><div class="doc-stat-lbl">Avanzado (A)<br>${Math.round((stats.A/totalStudents)*100)}%</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#F59E0B;">${stats.B}</div><div class="doc-stat-lbl">Básico (B)<br>${Math.round((stats.B/totalStudents)*100)}%</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#EF4444;">${stats.I}</div><div class="doc-stat-lbl">Inicial (I)<br>${Math.round((stats.I/totalStudents)*100)}%</div></div>
        </div>`;
        
        const parcialHeaders = parciales.map(p => `<th>${p.nombre}</th>`).join('');
        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);
        
        return `${this._docHeader(c, 'Acta de Calificaciones Final', 'Resumen Académico Anual')}
        ${statsHtml}
        <table class="doc-table">
            <thead>
                <tr>
                    <th style="width:40px;">#</th>
                    <th class="th-left">Estudiante</th>
                    ${parcialHeaders}
                    <th>Definitiva</th>
                    <th>Nivel</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div class="doc-footer-sign" style="margin-top:40px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Firma del Director(a)</div>
            </div>
        </div>`;
    },

    _buildInformeSART(c) {
        const cfg = this._getConfig();
        const stateFilter = cfg.sartEstado || 'Todas';
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const alertsAll = Store.get('sartAlertas') || [];
        
        const studentIds = students.map(s => s.id);
        let alerts = alertsAll.filter(a => studentIds.includes(a.estudianteId));
        
        if (stateFilter !== 'Todas') {
            alerts = alerts.filter(a => a.estado === stateFilter);
        }
        
        const counts = { Leve: 0, Moderada: 0, Grave: 0, Abierta: 0, 'En seguimiento': 0, Cerrada: 0 };
        alerts.forEach(a => {
            if (counts[a.nivel] !== undefined) counts[a.nivel]++;
            if (counts[a.estado] !== undefined) counts[a.estado]++;
        });
        
        const rows = alerts.map((a, idx) => {
            const student = students.find(s => s.id === a.estudianteId);
            const name = student ? student.nombreCompleto : 'Estudiante no encontrado';
            let colorLevel = '#10B981';
            if (a.nivel === 'Moderada') colorLevel = '#F59E0B';
            if (a.nivel === 'Grave') colorLevel = '#EF4444';
            
            return `<tr>
                <td style="text-align:center;">${idx+1}</td>
                <td class="td-name">${name}</td>
                <td style="font-weight:bold; color:${colorLevel}; text-align:center;">${a.nivel || 'Leve'}</td>
                <td>${a.categoria || ''}</td>
                <td style="text-align:left;">${a.descripcion || ''}</td>
                <td style="font-weight:bold; text-align:center;">${a.estado || 'Abierta'}</td>
                <td style="text-align:left; font-size:10px; color:#475569;">${a.seguimiento || 'Sin observaciones'}</td>
            </tr>`;
        }).join('');
        
        const noAlertsHtml = `<p style="text-align:center; color:#64748B; padding:20px; border:1px dashed #CBD5E1; margin-top:15px; border-radius:8px;">No se encontraron alertas registradas para este curso con el filtro seleccionado.</p>`;
        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);
        
        return `${this._docHeader(c, 'Informe del Sistema de Alertas y Rendimiento Temprano (SART)', `Estado de Alertas: ${stateFilter}`)}
        <div class="doc-stats-row" style="margin-top:15px; margin-bottom:15px;">
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#10B981;">${counts.Leve}</div><div class="doc-stat-lbl">Alertas Leves</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#F59E0B;">${counts.Moderada}</div><div class="doc-stat-lbl">Alertas Moderadas</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#EF4444;">${counts.Grave}</div><div class="doc-stat-lbl">Alertas Graves</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#3B82F6;">${alerts.length}</div><div class="doc-stat-lbl">Total de Alertas</div></div>
        </div>
        ${alerts.length === 0 ? noAlertsHtml : `
        <table class="doc-table">
            <thead>
                <tr>
                    <th style="width:30px;">#</th>
                    <th class="th-left" style="min-width:130px;">Estudiante</th>
                    <th style="width:80px;">Nivel</th>
                    <th style="width:100px;">Tipo</th>
                    <th class="th-left" style="min-width:180px;">Descripción</th>
                    <th style="width:90px;">Estado</th>
                    <th class="th-left" style="min-width:150px;">Seguimiento</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>`}
        <div class="doc-footer-sign" style="margin-top:40px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente Orientador / Consejero</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Firma del Director(a)</div>
            </div>
        </div>`;
    },

    _buildReporteConducta(c) {
        const cfg = this._getConfig();
        const parciales = Store.getParcialByCourse(c.id) || [];
        let pObj = parciales.find(p => String(p.id) === String(cfg.parcialId)) || parciales[0] || { id: '1', numero: 1, nombre: 'I Parcial' };
        const pIdx = parciales.indexOf(pObj);
        const pNum = pObj.numero || (pIdx >= 0 ? pIdx + 1 : 1);
        const romano = ['I', 'II', 'III', 'IV'][pNum - 1] || pNum;
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const inst = (window.Views && Views.Conducta && typeof Views.Conducta._getInstitutionalSaceMeta === 'function')
            ? Views.Conducta._getInstitutionalSaceMeta(c)
            : {
                centro: String(c.centroEducativo || 'CENTRO EDUCATIVO').toUpperCase(),
                modalidad: 'EDUCACION BASICA',
                cursoNombre: String(c.grado || '').toUpperCase(),
                seccion: String(c.seccion || '1')
            };

        const rows = students.map((s, idx) => {
            const ev = (window.Views && Views.Conducta && typeof Views.Conducta.evaluateStudentPersonality === 'function')
                ? Views.Conducta.evaluateStudentPersonality(c.id, s.id, pNum)
                : null;
            const p1 = ev && ev.aspects && ev.aspects.puntualidad ? ev.aspects.puntualidad.score : 4;
            const p2 = ev && ev.aspects && ev.aspects.espiritu_trabajo ? ev.aspects.espiritu_trabajo.score : 4;
            const p3 = ev && ev.aspects && ev.aspects.orden_presentacion ? ev.aspects.orden_presentacion.score : 4;
            const p4 = ev && ev.aspects && ev.aspects.sociabilidad ? ev.aspects.sociabilidad.score : 4;
            const p5 = ev && ev.aspects && ev.aspects.moralidad ? ev.aspects.moralidad.score : 4;
            const avg = ev && ev.notaRedondeada ? ev.notaRedondeada : Math.round((p1 + p2 + p3 + p4 + p5) / 5);
            const rawId = String(s.identidad || s.rne || '').replace(/\D/g, '');
            const fmtId = rawId.length === 13 ? `${rawId.slice(0, 4)}-${rawId.slice(4, 8)}-${rawId.slice(8)}` : (s.identidad || s.rne || '');
            return `<tr>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center;">${idx + 1}</td>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center;">HND</td>
                <td style="border:1px solid #94a3b8; padding:5px 8px; text-align:center; font-family:monospace;">${fmtId}</td>
                <td style="border:1px solid #94a3b8; padding:5px 10px; text-align:left; font-weight:700; text-transform:uppercase; white-space:nowrap;">${s.nombreCompleto || ''}</td>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800;">${p1}</td>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800;">${p2}</td>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800;">${p3}</td>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800;">${p4}</td>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800;">${p5}</td>
                <td style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:900; background:#f8fafc;">${avg}</td>
            </tr>`;
        }).join('');

        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);

        return `${this._docHeader(c, 'Cuadro Oficial de Personalidad SACE', 'Evaluación de Conducta y Personalidad — Parcial ' + romano)}
        <table class="doc-table" style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; font-size:11px; color:#000;">
            <thead>
                <tr>
                    <th colspan="4" style="border:1px solid #94a3b8; padding:6px 8px; text-align:center; font-weight:900; background:#f1f5f9;">INFORMACIÓN DEL ALUMNO</th>
                    <th colspan="5" style="border:1px solid #94a3b8; padding:6px 8px; text-align:center; font-weight:900; background:#f1f5f9;">PERSONALIDAD (PARCIAL ${romano})</th>
                    <th rowspan="2" style="border:1px solid #94a3b8; padding:6px 8px; text-align:center; font-weight:900; background:#f1f5f9; width:75px;">PROMEDIO<br>(2-4)</th>
                </tr>
                <tr style="background:#f8fafc;">
                    <th style="border:1px solid #94a3b8; padding:5px 4px; text-align:center; font-weight:800; width:34px;">NO</th>
                    <th style="border:1px solid #94a3b8; padding:5px 4px; text-align:center; font-weight:800; width:56px;">TIPO ID</th>
                    <th style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800; width:115px;">IDENTIDAD</th>
                    <th style="border:1px solid #94a3b8; padding:5px 8px; text-align:left; font-weight:800; min-width:260px; white-space:nowrap;">NOMBRE</th>
                    <th style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800; width:95px;">PUNTUALIDAD</th>
                    <th style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800; width:110px;">ESPÍRITU DE TRABAJO</th>
                    <th style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800; width:115px;">ORDEN Y PRESENTACIÓN</th>
                    <th style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800; width:95px;">SOCIABILIDAD</th>
                    <th style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-weight:800; width:95px;">MORALIDAD</th>
                </tr>
            </thead>
            <tbody>
                ${rows || '<tr><td colspan="10" style="border:1px solid #94a3b8; padding:16px; text-align:center;">No hay estudiantes registrados en este curso.</td></tr>'}
            </tbody>
        </table>
        <div style="margin-top:8px; font-size:10px; color:#475569; font-family:Arial, sans-serif; font-weight:600;">Escala Oficial SACE: 4 = Sobresaliente &bull; 3 = Muy Bueno &bull; 2 = Bueno</div>
        <div class="doc-footer-sign" style="margin-top:40px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Firma del Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Firma del Director(a)</div>
            </div>
        </div>`;
    },

    _buildEstadisticaCondensado(c) {
        const cfg = this._getConfig();
        const selParcialId = cfg.parcialId || null;
        const parciales = Store.getParcialByCourse(c.id) || [];
        const selectedParcialObj = cfg.parcialId ? parciales.find(p => String(p.id) === String(cfg.parcialId)) : null;
        const selectedParcialIdx = selectedParcialObj ? parciales.indexOf(selectedParcialObj) : -1;
        const selectedParcialNum = selectedParcialObj ? (selectedParcialObj.numero || (selectedParcialIdx + 1)) : null;
        const periodoLabel = selectedParcialObj ? (selectedParcialObj.nombre || `Parcial ${selectedParcialNum}`) : 'Consolidado Anual (Todos los Parciales)';

        const countGender = (arr) => {
            const list = Array.isArray(arr) ? arr : [];
            const n = list.filter(s => (s.genero === 'F' || s.sexo === 'F' || s.sexo === 'f')).length;
            const v = list.filter(s => (s.genero === 'M' || s.sexo === 'M' || s.sexo === 'm' || (s.genero !== 'F' && s.sexo !== 'F'))).length;
            return { N: n, V: v, T: n + v };
        };

        // Helper para calcular estadísticas completas de cualquier curso (N, V, T)
        const computeCourseCondensado = (courseObj) => {
            const allSt = Store.getStudentsByCourse(courseObj.id) || [];
            const initSt = allSt.filter(s => s.estadoMatricula !== 'Ingreso');
            const finalSt = allSt.filter(s => s.estadoMatricula !== 'Traslado' && s.estadoMatricula !== 'Desertor');

            const matIni = countGender(initSt.length > 0 ? initSt : allSt);
            const matFin = countGender(finalSt);

            const cParciales = (typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.getCourseParciales)
                ? Views.CuadroSACE.getCourseParciales(courseObj.id)
                : (Store.getParcialByCourse(courseObj.id) || []);

            const evalStudents = [];
            const inicialArr = [];   // 0 - 69%
            const basicoArr = [];    // 70 - 79%
            const avanzadoArr = [];  // 80 - 90%
            const excelenteArr = []; // 91 - 100%

            // También contabilizar Examen Escrito/Práctico específicamente (para cuadros de Exámenes Ordinarios)
            let examA = 0, examNA = 0, examT = 0;
            const allActs = (Store.get('actividades') || []).filter(a => a.cursoId === courseObj.id && !a.esExtra);
            const allCalifs = Store.get('calificaciones') || [];

            finalSt.forEach(s => {
                let score = null;
                if (selectedParcialNum) {
                    const targetP = cParciales.find((p, idx) => (p.numero || (idx + 1)) === selectedParcialNum) || cParciales[selectedParcialNum - 1];
                    const targetIdx = targetP ? cParciales.indexOf(targetP) : (selectedParcialNum - 1);
                    if (targetP && typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.computeStudentGrade) {
                        const raw = Views.CuadroSACE.computeStudentGrade(s.id, courseObj.id, targetP, targetIdx);
                        if (raw !== '' && raw !== null && raw !== undefined && !isNaN(Number(raw))) {
                            score = Math.round(Number(raw));
                        }
                    }
                    // Examen del parcial seleccionado
                    if (targetP) {
                        const examActs = allActs.filter(a => String(a.parcialId) === String(targetP.id) && (a.categoria === 'examen' || /examen/i.test(a.nombre || '')));
                        if (examActs.length > 0) {
                            let obt = 0, max = 0, hasEx = false;
                            examActs.forEach(ea => {
                                max += Number(ea.puntajeMax) || 0;
                                const sc = allCalifs.find(cal => cal.estudianteId === s.id && cal.actividadId === ea.id);
                                if (sc && sc.puntajeObtenido !== '' && sc.puntajeObtenido !== null && sc.puntajeObtenido !== undefined) {
                                    obt += Number(sc.puntajeObtenido) || 0;
                                    hasEx = true;
                                }
                            });
                            if (hasEx && max > 0) {
                                examT++;
                                const exPct = (obt / max) * 100;
                                if (exPct >= 70) examA++; else examNA++;
                            }
                        }
                    }
                } else {
                    // Consolidado Anual Oficial SACE: Promedio estricto de los 4 parciales (Sumatoria / 4) y regla de 280 puntos
                    let sum = 0, cnt = 0;
                    cParciales.forEach((p, idx) => {
                        if (typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.computeStudentGrade) {
                            const raw = Views.CuadroSACE.computeStudentGrade(s.id, courseObj.id, p, idx);
                            if (raw !== '' && raw !== null && raw !== undefined && !isNaN(Number(raw))) {
                                sum += Number(raw);
                                cnt++;
                            }
                        }
                    });
                    if (cnt > 0) {
                        const totalParcialesOficial = Math.max(cParciales.length, 4);
                        score = Math.round(sum / totalParcialesOficial);
                        // Si el estudiante pasó a recuperación y tiene nota de recuperación, esta sustituye al promedio ordinario en estadísticas
                        const recHelper = (typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.getEffectiveRecoveryGrade)
                            ? Views.CuadroSACE
                            : ((typeof Views.Cuadro1 !== 'undefined' && Views.Cuadro1.getEffectiveRecoveryGrade) ? Views.Cuadro1 : null);
                        if (recHelper) {
                            const recGrade = recHelper.getEffectiveRecoveryGrade(s.id, courseObj.id);
                            if (recGrade !== null && recGrade !== undefined && !isNaN(recGrade)) {
                                score = Math.min(70, Math.round(Number(recGrade)));
                            }
                        }
                    }
                }

                if (score !== null && !isNaN(score)) {
                    evalStudents.push(s);
                    if (score < 70) inicialArr.push(s);
                    else if (score <= 79) basicoArr.push(s);
                    else if (score <= 90) avanzadoArr.push(s);
                    else excelenteArr.push(s);
                }
            });

            const evaluados = countGender(evalStudents);
            const inicial = countGender(inicialArr);
            const basico = countGender(basicoArr);
            const avanzado = countGender(avanzadoArr);
            const excelente = countGender(excelenteArr);
            const aprobados = {
                N: basico.N + avanzado.N + excelente.N,
                V: basico.V + avanzado.V + excelente.V,
                T: basico.T + avanzado.T + excelente.T
            };
            const reprobados = { ...inicial };

            // Si no hubo actividad de categoría examen por separado (ej. nota de emergencia), usar Aprobados/Reprobados de la nota del curso
            const ordA = examT > 0 ? examA : aprobados.T;
            const ordNA = examT > 0 ? examNA : reprobados.T;
            const ordT = examT > 0 ? examT : evaluados.T;

            return {
                course: courseObj,
                matIni, matFin, evaluados,
                inicial, basico, avanzado, excelente,
                aprobados, reprobados,
                ordA, ordNA, ordT,
                hasSpecificExam: examT > 0
            };
        };

        const activeStats = computeCourseCondensado(c);

        // Cursos del mismo Centro Educativo para consolidar por grado y materia
        const normCE = (s) => String(s || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/CENTRO DE EDUCACION BASICA GUBERNAMENTAL|CENTRO DE EDUCACION BASICA|ESCUELA DE EDUCACION BASICA|CENTRO ESCOLAR|ESCUELA|INSTITUTO|C\.E\.B\.G\.|C\.E\.B\.G|CEBG|C\.E\.B\.|C\.E\.B|CEB/g, '').replace(/[^A-Z0-9]/g, '');
        const activeCenterNorm = normCE(c.centroEducativo);
        const sameCenterCourses = (Store.get('cursos') || []).filter(cr => {
            if (cr.estado === 'FINALIZADO' || cr.estado === 'ARCHIVADO') return false;
            if (cr.id === c.id) return true;
            if (c.centroId && cr.centroId === c.centroId) return true;
            return activeCenterNorm && normCE(cr.centroEducativo) === activeCenterNorm;
        });

        const allCenterStats = sameCenterCourses.map(cr => cr.id === c.id ? activeStats : computeCourseCondensado(cr));

        const tdNum = (val, bold = false, bg = '') => `<td style="border:1px solid #94a3b8; padding:4px 3px; text-align:center; font-size:10px; ${bold ? 'font-weight:800;' : ''} ${bg ? 'background:' + bg + ';' : ''}">${val}</td>`;
        const thSubNVT = () => `
            <th style="border:1px solid #94a3b8; padding:3px 2px; text-align:center; font-size:8.5px; background:#e2e8f0; width:22px;">N</th>
            <th style="border:1px solid #94a3b8; padding:3px 2px; text-align:center; font-size:8.5px; background:#e2e8f0; width:22px;">V</th>
            <th style="border:1px solid #94a3b8; padding:3px 2px; text-align:center; font-size:8.5px; background:#cbd5e1; font-weight:900; width:24px;">T</th>`;

        const thSubNVTTable2 = () => `
            <th style="border:1px solid #94a3b8; padding:4px 3px; text-align:center; font-size:9.5px; background:#e2e8f0; width:6%;">N</th>
            <th style="border:1px solid #94a3b8; padding:4px 3px; text-align:center; font-size:9.5px; background:#e2e8f0; width:6%;">V</th>
            <th style="border:1px solid #94a3b8; padding:4px 3px; text-align:center; font-size:9.5px; background:#cbd5e1; font-weight:900; width:7%;">T</th>`;

        // 1. Filas para CUADRO 1: INFORMACIÓN ESTADÍSTICA (Formato Imagen 1)
        const sumStatsList = (list) => {
            const zeroNVT = () => ({ N: 0, V: 0, T: 0 });
            const acc = { 
                matIni: zeroNVT(), 
                matFin: zeroNVT(), 
                evaluados: zeroNVT(), 
                inicial: zeroNVT(), 
                basico: zeroNVT(), 
                avanzado: zeroNVT(), 
                excelente: zeroNVT(), 
                aprobados: zeroNVT(), 
                reprobados: zeroNVT(),
                ordA: 0,
                ordNA: 0,
                ordT: 0
            };
            list.forEach(st => {
                ['matIni', 'matFin', 'evaluados', 'inicial', 'basico', 'avanzado', 'excelente', 'aprobados', 'reprobados'].forEach(k => {
                    if (st[k]) {
                        acc[k].N += (st[k].N || 0);
                        acc[k].V += (st[k].V || 0);
                        acc[k].T += (st[k].T || 0);
                    }
                });
                acc.ordA += (st.ordA !== undefined ? st.ordA : (st.aprobados ? st.aprobados.T : 0));
                acc.ordNA += (st.ordNA !== undefined ? st.ordNA : (st.reprobados ? st.reprobados.T : 0));
                acc.ordT += (st.ordT !== undefined ? st.ordT : (st.evaluados ? st.evaluados.T : 0));
            });
            return acc;
        };

        const renderInfoEstadisticaRow = (gradeLabel, subjectLabel, st, isHighlight = false, isTotal = false, gradeRowspan = 1, showGradeCell = true) => {
            const bg = isTotal ? '#e2e8f0' : (isHighlight ? '#ecfdf5' : '#ffffff');
            const fw = (isTotal || isHighlight) ? 'font-weight:800;' : 'font-weight:700;';
            return `<tr>
                ${isTotal 
                    ? `<td colspan="2" style="border:1px solid #94a3b8; padding:5px 8px; text-align:left; font-size:10px; font-weight:900; background:${bg}; white-space:nowrap;">${gradeLabel}</td>`
                    : (showGradeCell 
                        ? `<td rowspan="${gradeRowspan}" style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-size:10px; font-weight:900; background:#f8fafc; vertical-align:middle; width:75px; min-width:75px; white-space:nowrap;">${gradeLabel}</td>`
                        : '') +
                      `<td style="border:1px solid #94a3b8; padding:4px 8px; text-align:left; font-size:9.5px; ${fw} background:${bg}; white-space:nowrap; width:220px; min-width:210px;">${subjectLabel}</td>`
                }
                ${tdNum(st.matIni.N, isTotal, bg)}${tdNum(st.matIni.V, isTotal, bg)}${tdNum(st.matIni.T, true, bg)}
                ${tdNum(st.matFin.N, isTotal, bg)}${tdNum(st.matFin.V, isTotal, bg)}${tdNum(st.matFin.T, true, bg)}
                ${tdNum(st.evaluados.N, isTotal, bg)}${tdNum(st.evaluados.V, isTotal, bg)}${tdNum(st.evaluados.T, true, bg)}
                ${tdNum(st.inicial.N, isTotal, bg)}${tdNum(st.inicial.V, isTotal, bg)}${tdNum(st.inicial.T, true, bg)}
                ${tdNum(st.basico.N, isTotal, bg)}${tdNum(st.basico.V, isTotal, bg)}${tdNum(st.basico.T, true, bg)}
                ${tdNum(st.avanzado.N, isTotal, bg)}${tdNum(st.avanzado.V, isTotal, bg)}${tdNum(st.avanzado.T, true, bg)}
                ${tdNum(st.excelente.N, isTotal, bg)}${tdNum(st.excelente.V, isTotal, bg)}${tdNum(st.excelente.T, true, bg)}
                ${tdNum(st.evaluados.N, isTotal, bg)}${tdNum(st.evaluados.V, isTotal, bg)}${tdNum(st.evaluados.T, true, bg)}
            </tr>`;
        };

        // Normalización canónica de Grado y Sección para agrupar coherentemente cursos del mismo grado real
        const normalizeGradeSec = (course) => {
            let rawG = String(course.grado || '').trim();
            let rawS = String(course.seccion !== undefined && course.seccion !== null ? course.seccion : '').trim();

            // Limpieza de caracteres invisibles, saltos y espacios no separables
            rawG = rawG.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00A0/g, ' ').trim();
            rawS = rawS.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\u00A0/g, ' ').replace(/["'”]/g, '').trim();

            // Quitar comillas y palabra "GRADO"
            let cleanG = rawG.replace(/["'”]/g, '').replace(/\bGRADO\b/gi, '').trim();

            // Detectar si la sección vino pegada al grado (ej. "8VO 1", "8VO-1", "8VO_1", "8VO \"1\"")
            const mSec = cleanG.match(/^(.*?)[-_/\s]+([0-9]+|[A-Za-z])$/);
            if (mSec) {
                const potentialG = mSec[1].trim();
                const potentialS = mSec[2].trim();
                if (!rawS || rawS === potentialS || rawS === '1') {
                    cleanG = potentialG;
                    rawS = potentialS;
                }
            }
            if (!rawS) rawS = '1';

            const up = cleanG.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            let baseGrade = up || 'GENERAL';
            let order = 99;

            if (/^(1|1RO|1ER|PRIMER|PRIMERO|1[°º]?)$/.test(up)) { baseGrade = '1RO'; order = 1; }
            else if (/^(2|2DO|SEGUNDO|2[°º]?)$/.test(up)) { baseGrade = '2DO'; order = 2; }
            else if (/^(3|3RO|3ER|TERCER|TERCERO|3[°º]?)$/.test(up)) { baseGrade = '3RO'; order = 3; }
            else if (/^(4|4TO|CUARTO|4[°º]?)$/.test(up)) { baseGrade = '4TO'; order = 4; }
            else if (/^(5|5TO|QUINTO|5[°º]?)$/.test(up)) { baseGrade = '5TO'; order = 5; }
            else if (/^(6|6TO|SEXTO|6[°º]?)$/.test(up)) { baseGrade = '6TO'; order = 6; }
            else if (/^(7|7MO|SEPTIMO|7[°º]?)$/.test(up)) { baseGrade = '7MO'; order = 7; }
            else if (/^(8|8VO|OCTAVO|8[°º]?)$/.test(up)) { baseGrade = '8VO'; order = 8; }
            else if (/^(9|9NO|NOVENO|9[°º]?)$/.test(up)) { baseGrade = '9NO'; order = 9; }
            else if (/^(10|10MO|DECIMO|10[°º]?)$/.test(up)) { baseGrade = '10MO'; order = 10; }
            else if (/^(11|11VO|UNDECIMO|ONCEAVO|11[°º]?)$/.test(up)) { baseGrade = '11VO'; order = 11; }
            else if (/^(12|12VO|DUODECIMO|DOCEAVO|12[°º]?)$/.test(up)) { baseGrade = '12VO'; order = 12; }

            const padOrder = String(order).padStart(2, '0');
            const groupKey = `${padOrder}_${baseGrade}_SEC_${rawS.toUpperCase()}`;
            const displayLabel = `${baseGrade} "${rawS}"`;

            return {
                groupKey,
                order,
                baseGrade,
                seccion: rawS,
                displayLabel
            };
        };

        // Agrupar cursos por Grado canónico y Sección para combinar la celda de Grado en una sola (rowspan)
        const groupsByGrade = {};
        allCenterStats.forEach(st => {
            const norm = normalizeGradeSec(st.course);
            st._norm = norm;
            if (!groupsByGrade[norm.groupKey]) {
                groupsByGrade[norm.groupKey] = {
                    key: norm.groupKey,
                    order: norm.order,
                    displayLabel: norm.displayLabel,
                    list: []
                };
            }
            groupsByGrade[norm.groupKey].list.push(st);
        });

        // Orden natural de grados (1ro -> 2do ... -> 7mo -> 8vo -> 9no)
        const sortedGradeKeys = Object.keys(groupsByGrade).sort((a, b) => {
            return groupsByGrade[a].order - groupsByGrade[b].order || a.localeCompare(b);
        });

        // Resumen institucional por Grado (sin duplicar matrícula por materias del mismo grado)
        // El total del centro es estrictamente la suma de los grados reales, nunca de cursos repetidos
        const gradeSummaries = {};
        sortedGradeKeys.forEach(gKey => {
            const grp = groupsByGrade[gKey];
            const list = grp.list;

            // Unificar estudiantes del grado evitando duplicados entre materias
            const studentsMap = new Map();
            list.forEach(st => {
                const cStudents = Store.getStudentsByCourse(st.course.id) || [];
                cStudents.forEach(s => {
                    const sKey = String(s.identidad || s.id || (s.nombre + '_' + (s.apellidos || ''))).trim();
                    if (!studentsMap.has(sKey)) {
                        studentsMap.set(sKey, s);
                    }
                });
            });
            const allGradeStudents = Array.from(studentsMap.values());
            const initSt = allGradeStudents.filter(s => s.estadoMatricula !== 'Ingreso');
            const finalSt = allGradeStudents.filter(s => s.estadoMatricula !== 'Traslado' && s.estadoMatricula !== 'Desertor');

            const matIni = countGender(initSt.length > 0 ? initSt : allGradeStudents);
            const matFin = countGender(finalSt);

            const evalStudents = [];
            const inicialArr = [], basicoArr = [], avanzadoArr = [], excelenteArr = [];
            const aprobadosArr = [], reprobadosArr = [];

            const ageBuckets = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16+'];
            const edades = {};
            ageBuckets.forEach(b => { edades[b] = { N: 0, V: 0, T: 0 }; });
            const edadesTotal = { N: 0, V: 0, T: 0 };

            finalSt.forEach(s => {
                let ageVal = null;
                if (s.fechaNacimiento) {
                    if (typeof Logic !== 'undefined' && typeof Logic.calculateAge === 'function') {
                        ageVal = Logic.calculateAge(s.fechaNacimiento);
                    } else if (typeof Logic !== 'undefined' && typeof Logic.calcAge === 'function') {
                        ageVal = Logic.calcAge(s.fechaNacimiento);
                    } else {
                        const dob = new Date(s.fechaNacimiento);
                        if (!isNaN(dob.getTime())) {
                            ageVal = (cfg.anio || new Date().getFullYear()) - dob.getFullYear();
                        }
                    }
                } else if (s.edad !== undefined && s.edad !== null && s.edad !== '' && !isNaN(Number(s.edad))) {
                    ageVal = parseInt(s.edad, 10);
                }
                if (ageVal !== null && !isNaN(ageVal)) {
                    const bKey = ageVal >= 16 ? '16+' : (ageVal <= 5 ? '5' : String(ageVal));
                    const isGirl = (s.genero === 'F' || s.sexo === 'F' || s.sexo === 'f');
                    if (isGirl) {
                        edades[bKey].N++;
                        edadesTotal.N++;
                    } else {
                        edades[bKey].V++;
                        edadesTotal.V++;
                    }
                    edades[bKey].T++;
                    edadesTotal.T++;
                }

                let sumScores = 0, countScores = 0, hasReprobada = false;
                list.forEach(st => {
                    const cObj = st.course;
                    const cParciales = (typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.getCourseParciales)
                        ? Views.CuadroSACE.getCourseParciales(cObj.id)
                        : (Store.getParcialByCourse(cObj.id) || []);
                    let score = null;
                    if (selectedParcialNum) {
                        const targetP = cParciales.find((p, idx) => (p.numero || (idx + 1)) === selectedParcialNum) || cParciales[selectedParcialNum - 1];
                        const targetIdx = targetP ? cParciales.indexOf(targetP) : (selectedParcialNum - 1);
                        if (targetP && typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.computeStudentGrade) {
                            const raw = Views.CuadroSACE.computeStudentGrade(s.id, cObj.id, targetP, targetIdx);
                            if (raw !== '' && raw !== null && raw !== undefined && !isNaN(Number(raw))) {
                                score = Math.round(Number(raw));
                            }
                        }
                    } else {
                        let pSum = 0, pCnt = 0;
                        cParciales.forEach((p, idx) => {
                            if (typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.computeStudentGrade) {
                                const raw = Views.CuadroSACE.computeStudentGrade(s.id, cObj.id, p, idx);
                                if (raw !== '' && raw !== null && raw !== undefined && !isNaN(Number(raw))) {
                                    pSum += Number(raw);
                                    pCnt++;
                                }
                            }
                        });
                        if (pCnt > 0) {
                            score = Math.round(pSum / Math.max(cParciales.length, 4));
                            // Si el estudiante tiene nota de recuperación, esta sustituye al promedio ordinario en estadísticas
                            const recHelper = (typeof Views.CuadroSACE !== 'undefined' && Views.CuadroSACE.getEffectiveRecoveryGrade)
                                ? Views.CuadroSACE
                                : ((typeof Views.Cuadro1 !== 'undefined' && Views.Cuadro1.getEffectiveRecoveryGrade) ? Views.Cuadro1 : null);
                            if (recHelper) {
                                const recGrade = recHelper.getEffectiveRecoveryGrade(s.id, cObj.id);
                                if (recGrade !== null && recGrade !== undefined && !isNaN(recGrade)) {
                                    score = Math.min(70, Math.round(Number(recGrade)));
                                }
                            }
                        }
                    }
                    if (score !== null && !isNaN(score)) {
                        sumScores += score;
                        countScores++;
                        if (score < 70) hasReprobada = true;
                    }
                });

                if (countScores > 0) {
                    evalStudents.push(s);
                    const avg = Math.round(sumScores / countScores);
                    if (avg < 70) inicialArr.push(s);
                    else if (avg <= 79) basicoArr.push(s);
                    else if (avg <= 90) avanzadoArr.push(s);
                    else excelenteArr.push(s);

                    if (avg >= 70 && !hasReprobada) {
                        aprobadosArr.push(s);
                    } else {
                        reprobadosArr.push(s);
                    }
                }
            });

            const evaluados = countGender(evalStudents);
            const inicial = countGender(inicialArr);
            const basico = countGender(basicoArr);
            const avanzado = countGender(avanzadoArr);
            const excelente = countGender(excelenteArr);
            const aprobados = countGender(aprobadosArr);
            const reprobados = countGender(reprobadosArr);

            gradeSummaries[gKey] = {
                matIni, matFin, evaluados,
                inicial, basico, avanzado, excelente,
                aprobados, reprobados,
                edades, edadesTotal,
                ordA: aprobados.T,
                ordNA: reprobados.T,
                ordT: evaluados.T
            };
        });

        // TOTAL GENERAL DEL CENTRO = SUMA DE TODOS LOS GRADOS (NUNCA DE CURSOS DUPLICADOS)
        const totalCenterAcc = sumStatsList(Object.values(gradeSummaries));

        let cuadro1Rows = '';
        sortedGradeKeys.forEach(gKey => {
            const grp = groupsByGrade[gKey];
            const list = grp.list;
            list.forEach((st, idx) => {
                const cr = st.course;
                const isAct = cr.id === c.id;
                const gradeLabel = grp.displayLabel;
                const subjectLabel = `${(cr.asignatura || '').toUpperCase()}${isAct ? ' ★' : ''}`;
                cuadro1Rows += renderInfoEstadisticaRow(gradeLabel, subjectLabel, st, isAct, false, list.length, idx === 0);
            });
        });
        if (allCenterStats.length > 1) {
            cuadro1Rows += renderInfoEstadisticaRow('TOTAL GENERAL (SUMA DE GRADOS)', '', totalCenterAcc, false, true);
        }

        // 2. Filas para CUADRO 2: EVALUADOS, APROBADOS Y REPROBADOS POR ASIGNATURA (Formato Imagen 4)
        const renderEvalAprobReprobRow = (gradeLabel, subjectLabel, st, isHighlight = false, isTotal = false, gradeRowspan = 1, showGradeCell = true) => {
            const bg = isTotal ? '#e2e8f0' : (isHighlight ? '#ecfdf5' : '#ffffff');
            return `<tr>
                ${isTotal 
                    ? `<td colspan="2" style="border:1px solid #94a3b8; padding:6px 10px; text-align:left; font-size:10.5px; font-weight:900; background:${bg}; white-space:nowrap;">${gradeLabel}</td>`
                    : (showGradeCell 
                        ? `<td rowspan="${gradeRowspan}" style="border:1px solid #94a3b8; padding:6px 6px; text-align:center; font-size:10px; font-weight:900; background:#f8fafc; vertical-align:middle; width:10%; min-width:75px; white-space:nowrap;">${gradeLabel}</td>`
                        : '') +
                      `<td style="border:1px solid #94a3b8; padding:6px 10px; text-align:left; font-size:10px; font-weight:800; background:${bg}; width:36%; min-width:230px; white-space:nowrap;">${subjectLabel}</td>`
                }
                ${tdNum(st.evaluados.N, isTotal, bg)}${tdNum(st.evaluados.V, isTotal, bg)}${tdNum(st.evaluados.T, true, bg)}
                ${tdNum(st.aprobados.N, isTotal, bg)}${tdNum(st.aprobados.V, isTotal, bg)}${tdNum(st.aprobados.T, true, bg)}
                ${tdNum(st.reprobados.N, isTotal, bg)}${tdNum(st.reprobados.V, isTotal, bg)}${tdNum(st.reprobados.T, true, bg)}
            </tr>`;
        };

        let cuadro4Rows = '';
        sortedGradeKeys.forEach(gKey => {
            const grp = groupsByGrade[gKey];
            const list = grp.list;
            list.forEach((st, idx) => {
                const cr = st.course;
                const isAct = cr.id === c.id;
                const gradeLabel = grp.displayLabel;
                const subjectLabel = `${(cr.asignatura || '').toUpperCase()}${isAct ? ' ★' : ''}`;
                cuadro4Rows += renderEvalAprobReprobRow(gradeLabel, subjectLabel, st, isAct, false, list.length, idx === 0);
            });
        });
        if (allCenterStats.length > 1) {
            cuadro4Rows += renderEvalAprobReprobRow('TOTAL GENERAL (SUMA DE GRADOS)', '', totalCenterAcc, false, true);
        }

        // 3. Filas para CUADRO 3: MATRÍCULA FINAL POR EDADES (5 a 16+ años, N / V / T + TOTALES)
        const anioLectivoNum = parseInt((Store.data && Store.data.configAcademica && Store.data.configAcademica.anioLectivo) || cfg.anio || new Date().getFullYear(), 10) || new Date().getFullYear();
        const ageCols = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16+'];
        const thSubNVTEdad = (isTotalCol = false) => `
            <th style="border:1px solid #cbd5e1; padding:3px 1px; text-align:center; font-size:7.5px; font-weight:800; color:#475569; background:${isTotalCol ? '#f8fafc' : '#ffffff'};">N</th>
            <th style="border:1px solid #cbd5e1; padding:3px 1px; text-align:center; font-size:7.5px; font-weight:800; color:#475569; background:${isTotalCol ? '#f8fafc' : '#ffffff'};">V</th>
            <th style="border:1px solid #cbd5e1; padding:3px 1px; text-align:center; font-size:7.5px; font-weight:900; color:#0f172a; background:${isTotalCol ? '#e2e8f0' : '#f1f5f9'};">T</th>
        `;
        const tdEdad = (val, isBold, bg, color = '#0f172a') => `<td style="border:1px solid #cbd5e1; padding:5px 1px; text-align:center; font-size:8.5px; font-weight:${isBold ? '900' : '600'}; color:${color}; background:${bg};">${val}</td>`;

        const edadTotalAcc = {};
        ageCols.forEach(b => { edadTotalAcc[b] = { N: 0, V: 0, T: 0 }; });
        const edadGrandTotal = { N: 0, V: 0, T: 0 };

        let cuadroEdadesRows = '';
        sortedGradeKeys.forEach(gKey => {
            const grp = groupsByGrade[gKey];
            const gs = gradeSummaries[gKey];
            const isActGrade = grp.list.some(st => st.course.id === c.id);
            const rowBg = isActGrade ? '#f0fdf4' : '#ffffff';
            const tBg = isActGrade ? '#dcfce7' : '#f8fafc';

            let ageCells = '';
            ageCols.forEach(b => {
                const cell = (gs.edades && gs.edades[b]) ? gs.edades[b] : { N: 0, V: 0, T: 0 };
                edadTotalAcc[b].N += cell.N;
                edadTotalAcc[b].V += cell.V;
                edadTotalAcc[b].T += cell.T;
                ageCells += tdEdad(cell.N, false, rowBg) + tdEdad(cell.V, false, rowBg) + tdEdad(cell.T, true, tBg);
            });
            const gTot = gs.edadesTotal || { N: 0, V: 0, T: 0 };
            edadGrandTotal.N += gTot.N;
            edadGrandTotal.V += gTot.V;
            edadGrandTotal.T += gTot.T;

            cuadroEdadesRows += `<tr style="background:${rowBg};">
                <td style="border:1px solid #cbd5e1; padding:5px 6px; text-align:center; font-size:9px; font-weight:900; background:#f8fafc; color:#0f172a; white-space:nowrap;">${grp.displayLabel}</td>
                ${ageCells}
                ${tdEdad(gTot.N, true, rowBg, '#db2777')}${tdEdad(gTot.V, true, rowBg, '#2563eb')}${tdEdad(gTot.T, true, '#f1f5f9', '#0f172a')}
            </tr>`;
        });
        if (sortedGradeKeys.length > 1) {
            let totAgeCells = '';
            ageCols.forEach(b => {
                const cell = edadTotalAcc[b];
                totAgeCells += tdEdad(cell.N, true, '#f8fafc') + tdEdad(cell.V, true, '#f8fafc') + tdEdad(cell.T, true, '#e2e8f0');
            });
            cuadroEdadesRows += `<tr style="background:#f1f5f9;">
                <td style="border:1px solid #cbd5e1; padding:5px 6px; text-align:center; font-size:8.5px; font-weight:900; background:#e2e8f0; color:#0f172a; white-space:nowrap;">TOTAL</td>
                ${totAgeCells}
                ${tdEdad(edadGrandTotal.N, true, '#f1f5f9', '#db2777')}${tdEdad(edadGrandTotal.V, true, '#f1f5f9', '#2563eb')}${tdEdad(edadGrandTotal.T, true, '#cbd5e1', '#0f172a')}
            </tr>`;
        }

        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);

        return `${this._docHeader(c, 'Resultados de Evaluación Final', periodoLabel)}

        <!-- 1. REPORTE SOBRE LOS RESULTADOS DE LA EVALUACIÓN POR ÁREAS DEL CONOCIMIENTO SEGÚN GRADOS -->
        <div style="margin-top:12px; margin-bottom:18px;">
            <div style="background:#fef3c7; border:1px solid #94a3b8; border-bottom:none; padding:5px 10px; text-align:center; font-family:Arial, sans-serif; font-weight:900; font-size:11px; color:#000; letter-spacing:0.04em;">
                1. REPORTE SOBRE LOS RESULTADOS DE LA EVALUACIÓN POR ÁREAS DEL CONOCIMIENTO SEGÚN GRADOS (${periodoLabel.toUpperCase()})
            </div>
            <table class="doc-table" style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; color:#000;">
                <thead>
                    <tr style="background:#e2e8f0;">
                        <th rowspan="2" style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-size:9.5px; font-weight:900; width:75px; min-width:75px; white-space:nowrap;">GRADO</th>
                        <th rowspan="2" style="border:1px solid #94a3b8; padding:5px 8px; text-align:left; font-size:9.5px; font-weight:900; width:220px; min-width:210px; white-space:nowrap;">CAMPO DEL CONOCIMIENTO</th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;">MATRÍCULA INICIAL</th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;">MATRÍCULA FINAL</th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;">EVALUADOS</th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;" title="0% - 69%">INICIAL<br><span style="font-size:7.5px; font-weight:700;">(0-69%)</span></th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;" title="70% - 79%">BÁSICO<br><span style="font-size:7.5px; font-weight:700;">(70-79%)</span></th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;" title="80% - 90%">AVANZADO<br><span style="font-size:7.5px; font-weight:700;">(80-90%)</span></th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;" title="91% - 100%">EXCELENTE<br><span style="font-size:7.5px; font-weight:700;">(91-100%)</span></th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:4px 2px; text-align:center; font-size:8.5px; font-weight:900;">TOTAL</th>
                    </tr>
                    <tr>
                        ${thSubNVT()}${thSubNVT()}${thSubNVT()}${thSubNVT()}${thSubNVT()}${thSubNVT()}${thSubNVT()}${thSubNVT()}
                    </tr>
                </thead>
                <tbody>
                    ${cuadro1Rows}
                </tbody>
            </table>
        </div>

        <!-- 2. REPORTE DE APROBADOS Y NO APROBADOS POR ÁREA DE RENDIMIENTO ACADÉMICO -->
        <div style="margin-bottom:18px;">
            <div style="background:#fef3c7; border:1px solid #94a3b8; border-bottom:none; padding:5px 10px; text-align:center; font-family:Arial, sans-serif; font-weight:900; font-size:11px; color:#000; letter-spacing:0.04em;">
                2. REPORTE DE APROBADOS Y NO APROBADOS POR ÁREA DE RENDIMIENTO ACADÉMICO
            </div>
            <table class="doc-table" style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; color:#000;">
                <thead>
                    <tr style="background:#e2e8f0;">
                        <th rowspan="2" style="border:1px solid #94a3b8; padding:6px 6px; text-align:center; font-size:10px; font-weight:900; width:10%; min-width:75px; white-space:nowrap;">GRADO</th>
                        <th rowspan="2" style="border:1px solid #94a3b8; padding:6px 10px; text-align:left; font-size:10px; font-weight:900; width:36%; min-width:230px; white-space:nowrap;">CAMPO DEL CONOCIMIENTO</th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-size:9.5px; font-weight:900; width:18%;">EVALUADOS</th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-size:9.5px; font-weight:900; background:#dcfce7; width:18%;">APROBADOS (≥ 70%)</th>
                        <th colspan="3" style="border:1px solid #94a3b8; padding:5px 6px; text-align:center; font-size:9.5px; font-weight:900; background:#fee2e2; width:18%;">REPROBADOS (&lt; 70%)</th>
                    </tr>
                    <tr>
                        ${thSubNVTTable2()}${thSubNVTTable2()}${thSubNVTTable2()}
                    </tr>
                </thead>
                <tbody>
                    ${cuadro4Rows}
                </tbody>
            </table>
        </div>

        <!-- 3. MATRÍCULA FINAL POR EDADES -->
        <div style="margin-bottom:18px;">
            <div style="background:#fef3c7; border:1px solid #cbd5e1; border-bottom:none; padding:5px 10px; text-align:center; font-family:Arial, sans-serif; font-weight:900; font-size:11px; color:#000; letter-spacing:0.04em;">
                3. MATRÍCULA FINAL POR EDADES (${anioLectivoNum})
            </div>
            <table class="doc-table" style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; color:#000; table-layout:fixed;">
                <thead>
                    <tr style="background:#ffffff;">
                        <th rowspan="2" style="border:1px solid #cbd5e1; padding:4px 4px; text-align:center; font-size:8px; font-weight:900; color:#334155; background:#f8fafc; width:64px;">GRADO</th>
                        ${ageCols.map(b => `<th colspan="3" style="border:1px solid #cbd5e1; padding:4px 1px; text-align:center; font-size:7.5px; font-weight:800; color:#334155;">${b === '16+' ? '16+ AÑOS' : b + ' AÑOS'}</th>`).join('')}
                        <th colspan="3" style="border:1px solid #cbd5e1; padding:4px 1px; text-align:center; font-size:8px; font-weight:900; color:#0f172a; background:#f1f5f9;">TOTALES</th>
                    </tr>
                    <tr>
                        ${ageCols.map(() => thSubNVTEdad(false)).join('')}${thSubNVTEdad(true)}
                    </tr>
                </thead>
                <tbody>
                    ${cuadroEdadesRows}
                </tbody>
            </table>
            <div style="margin-top:5px; font-size:9.5px; color:#475569; font-family:Arial, sans-serif;">
                <b>Referencia Oficial SACE:</b> <b>N</b> = Niñas (Femenino) &bull; <b>V</b> = Varones (Masculino) &bull; <b>T</b> = Total.
            </div>
        </div>

        <div class="doc-footer-sign" style="margin-top:34px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Firma del Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Firma del Director(a)</div>
            </div>
        </div>`;
    },

    _buildConsolidadoAsistencia(c) {
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const studentIds = new Set(students.map(s => s.id));
        const attendance = this._getDeduplicatedCourseAttendance(c).filter(a => studentIds.has(a.estudianteId));
        const pWithDates = this._getCourseParcialesWithDates(c);
        const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const fmtShort = (dStr) => {
            if (!dStr || dStr.length < 10) return dStr || '';
            const pts = dStr.slice(0, 10).split('-');
            return pts.length === 3 ? `${pts[2]}/${pts[1]}` : dStr;
        };
        
        const rows = students.map((s, idx) => {
            const studentAtt = attendance.filter(a => a.estudianteId === s.id);
            const counts = { P: 0, A: 0, T: 0, J: 0 };
            
            const monthCells = monthNames.map((m, mIdx) => {
                const monthAlerts = studentAtt.filter(a => {
                    const parts = a.fecha.split('-');
                    if (parts.length < 2) return false;
                    const monthVal = parseInt(parts[1]) - 1;
                    return monthVal === mIdx;
                });
                
                let attended = 0;
                let totalDays = monthAlerts.length;
                monthAlerts.forEach(a => {
                    const st = String(a.estado || '').toUpperCase();
                    if (st === 'P' || st === 'J' || st === 'E' || st === 'PM') attended++;
                    if (st === 'P') counts.P++;
                    else if (st === 'A') counts.A++;
                    else if (st === 'T') counts.T++;
                    else if (st === 'J' || st === 'E' || st === 'PM') counts.J++;
                });
                
                const pct = totalDays > 0 ? Math.round((attended / totalDays) * 100) : null;
                return `<td>${pct !== null ? pct + '%' : '-'}</td>`;
            }).join('');

            const parcialAbsCells = pWithDates.map(p => {
                const pAbs = studentAtt.filter(a => String(a.estado || '').toUpperCase() === 'A' && this._isDateInParcialRange(a.fecha, p.fechaInicio, p.fechaFin)).length;
                return `<td style="text-align:center; font-weight:${pAbs > 0 ? '800' : '500'}; color:${pAbs > 0 ? '#DC2626' : '#64748B'}; background:${pAbs > 0 ? '#FEF2F2' : 'transparent'};">${pAbs}</td>`;
            }).join('');
            
            const totalRecords = counts.P + counts.A + counts.T + counts.J;
            const overallPct = totalRecords > 0 ? Math.round(((counts.P + counts.J) / totalRecords) * 100) : 100;
            let pctColor = '#15803D';
            if (overallPct < 85) pctColor = '#D97706';
            if (overallPct < 80) pctColor = '#DC2626';
            
            return `<tr>
                <td style="text-align:center;">${idx+1}</td>
                <td class="td-name">${s.nombreCompleto}</td>
                ${monthCells}
                ${parcialAbsCells}
                <td class="td-p">${counts.P}</td>
                <td class="td-a" style="color:#DC2626; font-weight:900; background:#FEE2E2;">${counts.A}</td>
                <td class="td-t" style="color:#D97706;">${counts.T}</td>
                <td class="td-j" style="color:#2563EB;">${counts.J}</td>
                <td style="font-weight:bold; color:${pctColor};">${overallPct}%</td>
            </tr>`;
        }).join('');
        
        const totalP = attendance.filter(a => String(a.estado || '').toUpperCase() === 'P').length;
        const totalA = attendance.filter(a => String(a.estado || '').toUpperCase() === 'A').length;
        const totalT = attendance.filter(a => String(a.estado || '').toUpperCase() === 'T').length;
        const totalJ = attendance.filter(a => ['J','E','PM'].includes(String(a.estado || '').toUpperCase())).length;
        const totalDaysAll = attendance.length;
        const globalPct = totalDaysAll > 0 ? Math.round(((totalP + totalJ) / totalDaysAll) * 100) : 100;
        
        const monthHeaders = monthNames.map(m => `<th style="font-size:8.5px; padding:4px 2px;">${m}</th>`).join('');
        const parcialHeaders = pWithDates.map((p, idx) => `<th style="font-size:8.5px; padding:4px 3px; background:#991B1B; color:#fff;" title="Inasistencias ${p.nombre} (${fmtShort(p.fechaInicio)} al ${fmtShort(p.fechaFin)})">${['I P','II P','III P','IV P'][idx]}<br><span style="font-size:7px; font-weight:500;">${fmtShort(p.fechaInicio)}-${fmtShort(p.fechaFin)}</span></th>`).join('');
        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);
        
        return `${this._docHeader(c, 'Consolidado de Asistencia e Inasistencias Anuales', 'Historial Mensual, Inasistencias por Parcial e Inasistencias Anuales')}
        <table class="doc-table" style="font-size:9.5px; margin-top:10px;">
            <thead>
                <tr>
                    <th style="width:26px;">#</th>
                    <th class="th-left" style="min-width:120px;">Estudiante</th>
                    ${monthHeaders}
                    ${parcialHeaders}
                    <th style="width:30px;" title="Asistido">P</th>
                    <th style="width:48px; background:#7F1D1D; color:#fff;" title="Inasistencias Anuales">Inas.<br>Anual</th>
                    <th style="width:30px;" title="Tardanza">T</th>
                    <th style="width:30px;" title="Justificada">J</th>
                    <th style="width:42px;">Total %</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div class="doc-obs-box">Observaciones: __________________________________________</div>
        <div class="doc-footer-sign" style="margin-top:40px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Firma del Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Firma del Director(a)</div>
            </div>
        </div>`;
    },

    _buildReporteParcialDetallado(c) {
        const cfg = this._getConfig();
        const parciales = Store.getParcialByCourse(c.id);
        const parcialId = cfg.parcialId || (parciales.length > 0 ? parciales[0].id : '');
        const pObj = parciales.find(p => p.id === parcialId);
        const parcialName = pObj ? pObj.nombre : 'Parcial Seleccionado';
        
        const configDim = Store.data.configAcademica?.dimensions || [
            { key: 'cotidiana', nombre: 'Actividades Cotidianas', porcentaje: 35 },
            { key: 'extra', nombre: 'Actividades Extraclase', porcentaje: 15 },
            { key: 'prueba', nombre: 'Prueba Escrita', porcentaje: 35 },
            { key: 'valores', nombre: 'Valores', porcentaje: 15 }
        ];
        
        let activities = Store.get('actividades').filter(a => a.cursoId === c.id && a.parcialId === parcialId);
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const scores = Store.get('calificaciones');
        
        const columns = [];
        configDim.forEach(dim => {
            const dimActs = activities.filter(a => a.dimensionKey === dim.key);
            if (dimActs.length > 0) columns.push({ dimension: dim, activities: dimActs });
        });
        
        if (columns.length === 0) {
            return `${this._docHeader(c, 'Reporte de Parcial Detallado', parcialName)}<p style="text-align:center;color:#94A3B8;padding:20px;">Sin actividades registradas para este parcial.</p>`;
        }
        
        const vHeadDet = (txt) => `<div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:nowrap; display:inline-block; margin:0 auto; line-height:1.15;">${txt}</div>`;
        const th1 = columns.map(col =>
            `<th colspan="${col.activities.length+1}" style="text-align:center; font-size:9.5px; font-weight:800; border: 1px solid #94a3b8; background: #e2e8f0; padding: 6px 4px; text-transform:uppercase; line-height:1.2; vertical-align:middle; color:#0f172a;">${col.dimension.nombre}<br><span style="font-weight:600; color:#475569; font-size:8.5px;">(${col.dimension.porcentaje}%)</span></th>`
        ).join('') + `<th rowspan="2" style="width:42px; min-width:38px; max-width:48px; text-align:center; vertical-align:middle; font-size:9.5px; font-weight:900; background:#ecfdf5; border:1px solid #94a3b8; color:#065f46; padding:8px 2px; text-transform:uppercase;">${vHeadDet('Total Parcial')}</th><th rowspan="2" style="width:48px; min-width:44px; max-width:52px; text-align:center; vertical-align:middle; font-size:9.5px; font-weight:900; background:#f1f5f9; border:1px solid #94a3b8; color:#0f172a; padding:8px 2px; text-transform:uppercase;">${vHeadDet('Nivel')}</th>`;
        
        const th2 = columns.map(col =>
            col.activities.map(act => `
                <th style="height:175px; width:38px; min-width:36px; max-width:44px; vertical-align:bottom; padding:8px 3px 6px; background:#ffffff; border:1px solid #94a3b8; color:#0f172a; text-align:center; position:relative; overflow:hidden;" title="${act.nombre}">
                    <div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:normal; display:inline-block; font-size:9.5px; font-weight:700; color:#0f172a; letter-spacing:0.01em; line-height:1.15; max-height:142px; overflow:hidden; text-overflow:ellipsis; text-align:left; margin:0 auto;" title="${act.nombre}">
                        ${act.nombre}
                    </div>
                    <div style="font-weight:700; color:#475569; font-size:8.5px; margin-top:5px; border-top:1px solid #94a3b8; padding-top:4px;">
                        /${act.puntajeMax}
                    </div>
                </th>
            `).join('') + `
                <th style="height:175px; width:38px; min-width:36px; max-width:42px; background:#e0f2fe; border:1px solid #94a3b8; color:#0369a1; text-align:center; vertical-align:bottom; padding:8px 3px 6px;">
                    <div style="writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl; transform:rotate(180deg); -webkit-transform:rotate(180deg); white-space:nowrap; display:inline-block; font-size:10px; font-weight:800; text-transform:uppercase; color:#0369a1; margin:0 auto; letter-spacing:0.04em;">
                        SUBTOTAL
                    </div>
                    <div style="font-weight:700; color:#0284c7; font-size:8.5px; margin-top:5px; border-top:1px solid #94a3b8; padding-top:4px;">
                        /${col.dimension.porcentaje}
                    </div>
                </th>
            `
        ).join('');
        
        const gradeStats = { E: 0, A: 0, B: 0, I: 0 };
        let groupSum = 0;
        
        const rows = students.map((s, idx) => {
            let finalRowGrade = 0;
            const cells = columns.map(col => {
                let obtSum = 0;
                let maxSum = 0;
                const actCells = col.activities.map(act => {
                    const sc = scores.find(x => x.actividadId === act.id && x.estudianteId === s.id);
                    const val = sc ? Number(sc.puntajeObtenido) : 0;
                    obtSum += val;
                    maxSum += Number(act.puntajeMax);
                    return `<td>${sc ? val : ''}</td>`;
                }).join('');
                
                const subGrade = maxSum > 0 ? (obtSum / maxSum) * col.dimension.porcentaje : 0;
                finalRowGrade += subGrade;
                
                return `${actCells}<td class="td-subtotal" style="font-weight:bold;">${Math.round(subGrade)}</td>`;
            }).join('');
            
            const roundedGrade = Math.round(finalRowGrade);
            groupSum += roundedGrade;
            const perf = this._getNivelDesempeno(roundedGrade);
            gradeStats[perf]++;
            
            return `<tr>
                <td style="text-align:center;">${idx+1}</td>
                <td class="td-name">${s.nombreCompleto}</td>
                ${cells}
                <td class="td-nota" style="font-weight:bold; font-size:11px;">${roundedGrade}%</td>
                <td style="font-weight:bold; text-align:center;">${perf}</td>
            </tr>`;
        }).join('');
        
        const groupAvg = students.length > 0 ? Math.round(groupSum / students.length) : 0;
        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);
        
        return `${this._docHeader(c, `Reporte Detallado de Notas — ${parcialName}`, 'Calificaciones por Dimensión')}
        <div class="doc-stats-row" style="margin-top:15px; margin-bottom:15px;">
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#0ea5e9;">${groupAvg}%</div><div class="doc-stat-lbl">Promedio del Grupo</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#10B981;">${gradeStats.E}</div><div class="doc-stat-lbl">Excelente (E)</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#3B82F6;">${gradeStats.A}</div><div class="doc-stat-lbl">Avanzado (A)</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#F59E0B;">${gradeStats.B}</div><div class="doc-stat-lbl">Básico (B)</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#EF4444;">${gradeStats.I}</div><div class="doc-stat-lbl">Inicial (I)</div></div>
        </div>
        <table class="doc-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width:30px; font-size:11px; font-weight:800; background:#1e293b; color:white; border:1px solid #94a3b8; text-align:center; vertical-align:middle;">#</th>
                    <th class="th-left" rowspan="2" style="min-width:150px; font-size:11px; font-weight:800; background:#1e293b; color:white; border:1px solid #94a3b8; padding:12px 10px; vertical-align:middle; text-align:left;">Estudiante</th>
                    ${th1}
                </tr>
                <tr>${th2}</tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div class="doc-footer-sign" style="margin-top:40px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Director(a)</div>
            </div>
        </div>`;
    },

    _buildFichaEstudiante(c) {
        const cfg = this._getConfig();
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const estudianteId = cfg.estudianteId || (students.length > 0 ? students[0].id : '');
        const s = students.find(x => x.id === estudianteId);
        
        if (!s) {
            return `<p style="text-align:center;color:#94A3B8;padding:20px;">Estudiante no seleccionado o no encontrado.</p>`;
        }
        
        const parciales = Store.getParcialByCourse(c.id);
        
        let totalSum = 0;
        let countParciales = 0;
        const parcialGrades = parciales.map(p => {
            const grade = this._calculateStudentParcialGrade(s.id, c.id, p.id);
            totalSum += grade;
            countParciales++;
            return { name: p.nombre, grade, level: this._getNivelDesempeno(grade) };
        });
        const finalGrade = countParciales > 0 ? Math.round(totalSum / countParciales) : 0;
        const finalLevel = this._getNivelLabel(finalGrade);
        
        const attendance = Store.get('asistencia').filter(a => a.cursoId === c.id && a.estudianteId === s.id);
        const counts = { P: 0, A: 0, T: 0, J: 0 };
        attendance.forEach(a => {
            if (counts[a.estado] !== undefined) counts[a.estado]++;
        });
        const totalAttDays = attendance.length;
        const attendancePct = totalAttDays > 0 ? Math.round(((counts.P + counts.J) / totalAttDays) * 100) : 100;
        
        const alerts = (Store.get('sartAlertas') || []).filter(a => a.estudianteId === s.id);
        const activeAlerts = alerts.filter(a => a.estado !== 'Cerrada');
        
        let alertsHtml = '';
        if (activeAlerts.length === 0) {
            alertsHtml = `<p style="color:#15803D; font-weight:bold; font-size:11px; margin: 5px 0 0 0;">Sin alertas activas.</p>`;
        } else {
            alertsHtml = activeAlerts.map(a => {
                let lvlColor = '#EF4444';
                if (a.nivel === 'Moderada') lvlColor = '#F59E0B';
                if (a.nivel === 'Leve') lvlColor = '#10B981';
                return `<div style="border-left: 3px solid ${lvlColor}; padding-left: 8px; margin-bottom: 8px; font-size:10px;">
                    <b>${a.nivel}</b> [${a.categoria}]: ${a.descripcion} <span style="font-style:italic;color:#64748B;">(${a.estado})</span>
                </div>`;
            }).join('');
        }
        
        const gradesRows = parcialGrades.map(pg => {
            return `<tr>
                <td style="text-align:left; font-weight:bold;">${pg.name}</td>
                <td style="font-size:12px; font-weight:bold; color:#1E293B;">${pg.grade}%</td>
                <td>${pg.level}</td>
            </tr>`;
        }).join('');
        const docenteNombre = this._getDocente(c);
        
        return `${this._docHeader(c, 'Ficha Individual del Estudiante', 'Expediente y Rendimiento Escolar')}
        
        <div style="border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px; background: #F8FAFC; margin-top: 15px; display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; border-right: 1px solid #CBD5E1; padding-right:20px;">
                <div style="width:90px; height:90px; border-radius:50%; background:#CBD5E1; display:flex; align-items:center; justify-content:center; color:#475569; font-size:36px; font-weight:bold; margin-bottom:10px; border:2px solid var(--primary);">
                    ${s.nombreCompleto.split(' ').map(n => n[0]).slice(0,2).join('')}
                </div>
                <div style="font-size:14px; font-weight:bold; text-align:center; color:#1E293B;">${s.nombreCompleto}</div>
                <div style="font-size:11px; color:#64748B; margin-top:3px;">ID: ${s.identidad || 'No Registrada'}</div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:10px;">
                <h4 style="margin:0 0 5px 0; color:var(--primary); font-size:12px; border-bottom: 1px solid #E2E8F0; padding-bottom:3px;">Datos Académicos y Resumen</h4>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:11px;">
                    <div><b>Rendimiento Final:</b> <span style="font-weight:bold; color:#15803D;">${finalGrade}% (${finalLevel})</span></div>
                    <div><b>Asistencia General:</b> <span style="font-weight:bold; color:#2563EB;">${attendancePct}%</span></div>
                    <div><b>Faltas / Tardanzas:</b> <span>${counts.A} Inasistencias / ${counts.T} Tardanzas</span></div>
                    <div><b>Total Alertas SART:</b> <span>${alerts.length} registradas (${activeAlerts.length} activas)</span></div>
                </div>
            </div>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px;">
            <div>
                <h4 style="margin:0 0 8px 0; font-size:12px; color:#1E293B; border-bottom:1px solid #CBD5E1; padding-bottom:4px;">Calificaciones por Parcial</h4>
                <table class="doc-table" style="margin-top:0;">
                    <thead>
                        <tr>
                            <th class="th-left">Parcial</th>
                            <th style="width:60px;">Nota</th>
                            <th style="width:60px;">Nivel</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gradesRows}
                        <tr style="background:#F1F5F9; font-weight:bold;">
                            <td style="text-align:left;">Promedio Definitivo</td>
                            <td style="font-size:13px; color:#15803D; font-weight:900;">${finalGrade}%</td>
                            <td>${this._getNivelDesempeno(finalGrade)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div style="border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; background: white; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <h4 style="margin:0 0 8px 0; font-size:12px; color:#1E293B; border-bottom:1px solid #CBD5E1; padding-bottom:4px;">Alertas de Rendimiento / Conducta (SART)</h4>
                    ${alertsHtml}
                </div>
                <div style="margin-top:15px; font-size:10px; color:#64748B; font-style:italic; background:#F8FAFC; padding:8px; border-radius:6px; border:1px solid #E2E8F0;">
                    <b>Criterio del Docente:</b> Estudiante con asistencia de ${attendancePct}% y promedio general de ${finalGrade}%. 
                    ${finalGrade < 70 ? 'Requiere plan de recuperación y tutoría inmediata.' : 'Mantiene rendimiento satisfactorio.'}
                </div>
            </div>
        </div>
        
        <div class="doc-footer-sign" style="margin-top:45px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente de Aula / Campo del Conocimiento</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">&nbsp;</div>
                <div class="sign-line">Consejero(a) / Orientador(a)</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">&nbsp;</div>
                <div class="sign-line">Padre / Tutor Legal</div>
            </div>
        </div>`;
    },

    _buildComparativoParciales(c) {
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const parciales = Store.getParcialByCourse(c.id);
        
        if (parciales.length === 0) {
            return `${this._docHeader(c, 'Comparativo entre Parciales', '')}<p style="text-align:center;color:#94A3B8;padding:20px;">No hay parciales configurados en este curso.</p>`;
        }
        
        const parcialAverages = parciales.map(() => 0);
        
        const rows = students.map((s, idx) => {
            const grades = parciales.map((p, pIdx) => {
                const grade = this._calculateStudentParcialGrade(s.id, c.id, p.id);
                parcialAverages[pIdx] += grade;
                return grade;
            });
            
            let tendency = '&mdash;';
            if (grades.length > 1) {
                const first = grades[0];
                const last = grades[grades.length - 1];
                const diff = last - first;
                if (diff > 5) tendency = `<span style="color:#10B981;font-weight:bold;">↑ Mejoría (+${diff})</span>`;
                else if (diff < -5) tendency = `<span style="color:#EF4444;font-weight:bold;">↓ Descenso (${diff})</span>`;
                else tendency = `<span style="color:#64748B;">= Estable</span>`;
            }
            
            const gradeCells = grades.map(g => `<td>${g}%</td>`).join('');
            
            return `<tr>
                <td style="text-align:center;">${idx+1}</td>
                <td class="td-name">${s.nombreCompleto}</td>
                ${gradeCells}
                <td style="text-align:center;">${tendency}</td>
            </tr>`;
        }).join('');
        
        const totalStudents = students.length || 1;
        const groupAverages = parcialAverages.map(sum => Math.round(sum / totalStudents));
        
        const chartBlocks = groupAverages.map((avg, idx) => {
            const label = parciales[idx]?.nombre || `P${idx+1}`;
            return `<div style="flex:1; display:flex; flex-direction:column; align-items:center; background:#F8FAFC; border:1px solid #E2E8F0; padding:10px; border-radius:6px;">
                <div style="font-weight:bold; color:#64748B; font-size:10px; text-transform:uppercase; margin-bottom:5px;">${label}</div>
                <div style="font-size:18px; font-weight:900; color:#3B82F6; margin-bottom:5px;">${avg}%</div>
                <div style="width:100%; height:12px; background:#E2E8F0; border-radius:4px; overflow:hidden;">
                    <div style="width:${avg}%; height:100%; background:linear-gradient(to right, #3B82F6, #10B981); border-radius:4px;"></div>
                </div>
            </div>`;
        }).join('');
        
        const tableHeaders = parciales.map(p => `<th>${p.nombre}</th>`).join('');
        const averageCells = groupAverages.map(avg => `<td style="font-weight:bold; color:#3B82F6; font-size:11px;">${avg}%</td>`).join('');
        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);
        
        return `${this._docHeader(c, 'Comparativo de Rendimiento Académico entre Parciales', 'Análisis Evolutivo de Calificaciones')}
        
        <div style="margin-top:15px; margin-bottom:15px; display:flex; gap:12px; justify-content:space-between;">
            ${chartBlocks}
        </div>
        
        <table class="doc-table">
            <thead>
                <tr>
                    <th style="width:30px;">#</th>
                    <th class="th-left">Estudiante</th>
                    ${tableHeaders}
                    <th style="width:140px;">Tendencia General</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr style="background:#EEF2F6; font-weight:bold;">
                    <td colspan="2" style="text-align:right; font-weight:bold; font-size:11px;">PROMEDIO GENERAL DEL CURSO</td>
                    ${averageCells}
                    <td style="text-align:center; color:#3B82F6;">
                        ${groupAverages.length > 1 ? (groupAverages[groupAverages.length-1] - groupAverages[0] >= 0 ? '↗ Ascendente' : '↘ Descendente') : '&mdash;'}
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="doc-footer-sign" style="margin-top:40px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Director(a)</div>
            </div>
        </div>`;
    },

    _buildEstudiantesRiesgo(c) {
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        const parciales = Store.getParcialByCourse(c.id);
        const attendanceAll = Store.get('asistencia').filter(a => a.cursoId === c.id);
        const alertsAll = Store.get('sartAlertas') || [];
        
        const riskStudents = [];
        
        students.forEach(s => {
            let totalSum = 0;
            let countParciales = 0;
            parciales.forEach(p => {
                totalSum += this._calculateStudentParcialGrade(s.id, c.id, p.id);
                countParciales++;
            });
            const avgGrade = countParciales > 0 ? Math.round(totalSum / countParciales) : 100;
            
            const studentAtt = attendanceAll.filter(a => a.estudianteId === s.id);
            const counts = { P: 0, A: 0, T: 0, J: 0 };
            studentAtt.forEach(a => {
                if (counts[a.estado] !== undefined) counts[a.estado]++;
            });
            const totalAttDays = studentAtt.length;
            const attendancePct = totalAttDays > 0 ? Math.round(((counts.P + counts.J) / totalAttDays) * 100) : 100;
            
            const studentAlerts = alertsAll.filter(a => a.estudianteId === s.id && a.estado !== 'Cerrada');
            
            const hasLowGrade = avgGrade < 70;
            const hasLowAttendance = attendancePct < 85;
            const hasAlerts = studentAlerts.length > 0;
            
            if (hasLowGrade || hasLowAttendance || hasAlerts) {
                let riskScore = 0;
                if (hasLowGrade) riskScore += (70 - avgGrade) * 1.5;
                if (hasLowAttendance) riskScore += (85 - attendancePct) * 1.2;
                riskScore += studentAlerts.length * 10;
                
                let riskLabel = 'Bajo';
                let riskColor = '#10B981';
                if (riskScore > 35 || avgGrade < 60 || attendancePct < 75) {
                    riskLabel = 'Crítico';
                    riskColor = '#EF4444';
                } else if (riskScore > 15 || avgGrade < 70 || attendancePct < 85) {
                    riskLabel = 'Moderado';
                    riskColor = '#F59E0B';
                }
                
                riskStudents.push({
                    student: s,
                    avgGrade,
                    attendancePct,
                    alertsCount: studentAlerts.length,
                    riskScore,
                    riskLabel,
                    riskColor
                });
            }
        });
        
        riskStudents.sort((a, b) => b.riskScore - a.riskScore);
        
        const rows = riskStudents.map((rs, idx) => {
            return `<tr>
                <td style="text-align:center;">${idx+1}</td>
                <td class="td-name">${rs.student.nombreCompleto}</td>
                <td style="font-weight:bold; color:${rs.avgGrade < 70 ? '#EF4444' : '#1e293b'}">${rs.avgGrade}%</td>
                <td style="font-weight:bold; color:${rs.attendancePct < 85 ? '#EF4444' : '#1e293b'}">${rs.attendancePct}%</td>
                <td style="text-align:center;">${rs.alertsCount} alertas activas</td>
                <td style="font-weight:bold; color:${rs.riskColor}; text-align:center;">
                    ${rs.riskLabel === 'Crítico' ? '🔴 Crítico' : rs.riskLabel === 'Moderado' ? '🟡 Moderado' : '🟢 Bajo'}
                </td>
            </tr>`;
        }).join('');
        
        const countsSummary = { Critical: 0, Moderate: 0, Low: 0 };
        riskStudents.forEach(rs => {
            if (rs.riskLabel === 'Crítico') countsSummary.Critical++;
            if (rs.riskLabel === 'Moderado') countsSummary.Moderate++;
            if (rs.riskLabel === 'Bajo') countsSummary.Low++;
        });
        
        const emptyHtml = `<p style="text-align:center; color:#15803D; font-weight:bold; padding:25px; border: 1px solid #CBD5E1; border-radius:8px; margin-top:15px; background:#F0FDF4;">
            🎉 ¡Excelente! No se detectaron estudiantes con factores de riesgo académico o de asistencia en este curso.
        </p>`;
        const docenteNombre = this._getDocente(c);
        const directorNombre = this._getDirector(c);
        
        return `${this._docHeader(c, 'Reporte de Estudiantes en Riesgo Académico y de Asistencia', 'Detección Temprana y Prevención de Deserción')}
        
        <div class="doc-stats-row" style="margin-top:15px; margin-bottom:15px;">
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#EF4444;">${countsSummary.Critical}</div><div class="doc-stat-lbl">Riesgo Crítico</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#F59E0B;">${countsSummary.Moderate}</div><div class="doc-stat-lbl">Riesgo Moderado</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#10B981;">${countsSummary.Low}</div><div class="doc-stat-lbl">Riesgo Bajo</div></div>
            <div class="doc-stat-box"><div class="doc-stat-num" style="color:#3B82F6;">${riskStudents.length}</div><div class="doc-stat-lbl">Total en Riesgo</div></div>
        </div>
        
        ${riskStudents.length === 0 ? emptyHtml : `
        <table class="doc-table">
            <thead>
                <tr>
                    <th style="width:30px;">#</th>
                    <th class="th-left">Estudiante</th>
                    <th style="width:100px;">Promedio Notas</th>
                    <th style="width:120px;">% Asistencia</th>
                    <th style="width:130px;">Alertas Activas</th>
                    <th style="width:120px;">Nivel de Riesgo</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>`}
        <div class="doc-footer-sign" style="margin-top:40px;">
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${docenteNombre}</div>
                <div class="sign-line">Docente Orientador / Consejero</div>
            </div>
            <div class="sign-block">
                <div style="font-weight:700; font-size:11px; color:#1e293b; margin-bottom:4px; min-height:16px;">${directorNombre}</div>
                <div class="sign-line">Director(a)</div>
            </div>
        </div>`;
    },

    generateReport() {
        let c = Store.getActiveCourse();
        if (!c || !this._state.selectedReport) { UI.toast('Selecciona un reporte y curso', 'warning'); return; }
        const cfg = this._getConfig();
        if (cfg.cursoId && this._state.selectedReport === 'tabulacion_formativas') {
            c = Store.get('cursos').find(x => x.id === cfg.cursoId) || c;
        }
        const orient = document.getElementById('rpt-orient');
        const isLandscape = orient && orient.value === 'landscape';
        const content = this._buildPreviewContent(this._state.selectedReport, c) + this._docWatermark();
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Reporte Académico</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; margin: 0; }
            @media print { @page { size: ${isLandscape?'landscape':'portrait'} letter; margin: 0.7in; } body { padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
            .doc-header-inst { text-align:center; padding-bottom:12px; border-bottom:2px solid #0F172A; margin-bottom:12px; }
            .doc-inst-name { font-size:15px; font-weight:700; text-transform:uppercase; font-family:Georgia,serif; margin:0 0 2px; }
            .doc-report-title { font-size:13px; font-weight:700; text-transform:uppercase; color:#065f46; font-family:Georgia,serif; }
            .doc-meta-row { font-size:11px; color:#334155; display:flex; justify-content:center; gap:24px; flex-wrap:wrap; margin-top:6px; font-family:Arial,sans-serif; }
            .doc-table { width:100%; border-collapse:collapse !important; font-size:11px; margin-top:14px; border:1px solid #94A3B8 !important; }
            .doc-table th { background:#1E293B; color:white; padding:5px 7px; text-align:center; font-size:10px; font-weight:700; }
            .doc-table th.th-left { text-align:left; }
            .doc-table th, .doc-table td { border:1px solid #94A3B8 !important; }
            .doc-table td { border:1px solid #94A3B8 !important; padding:4px 6px; text-align:center; vertical-align:middle; }
            .doc-table td.td-name { text-align:left; font-weight:600; }
            .doc-table tr:nth-child(even) td { background:#F8FAFC; }
            .td-p { color:#15803D; font-weight:800; } .td-a { color:#DC2626; font-weight:800; }
            .td-t { color:#D97706; font-weight:800; } .td-j { color:#2563EB; font-weight:800; }
            .td-subtotal { background:#E0F2FE !important; font-weight:800; color:#0369A1; }
            .td-nota { background:#F0FDF4 !important; font-weight:900; color:#15803D; }
            .doc-footer-sign { margin-top:34px; display:flex; justify-content:space-around; flex-wrap:wrap; gap:16px; }
            .sign-block { text-align:center; min-width:130px; }
            .sign-line { border-top:1px solid #0F172A; padding-top:4px; font-size:10px; color:#475569; }
            .doc-obs-box { margin-top:12px; border:1px solid #CBD5E1; padding:8px 12px; min-height:42px; font-size:11px; color:#94A3B8; font-style:italic; }
            .doc-stats-row { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
            .doc-stat-box { flex:1; min-width:80px; border:1px solid #E2E8F0; padding:8px; text-align:center; background:#F8FAFC; }
            .doc-stat-num { font-size:20px; font-weight:900; color:#10B981; }
            .doc-stat-lbl { font-size:10px; color:#64748B; margin-top:2px; }
            .vertical-header-th {
                height: 165px !important;
                width: 36px !important;
                min-width: 34px !important;
                max-width: 42px !important;
                vertical-align: bottom !important;
                padding: 8px 3px 6px !important;
                background: #ffffff !important;
                border: 1px solid #94a3b8 !important;
                color: #0f172a !important;
                text-align: center !important;
                position: relative !important;
            }
            .vertical-header-text-div {
                writing-mode: vertical-rl !important;
                -webkit-writing-mode: vertical-rl !important;
                transform: rotate(180deg) !important;
                -webkit-transform: rotate(180deg) !important;
                white-space: nowrap !important;
                display: inline-block !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                color: #0f172a !important;
                letter-spacing: 0.01em !important;
                max-height: 138px !important;
                overflow: visible !important;
                margin: 0 auto !important;
            }
        </style></head>
        <body>${content}<script>window.onload=function(){window.print();}</script></body></html>`;
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    },

    downloadWord() {
        let c = Store.getActiveCourse();
        if (!c || !this._state.selectedReport) { UI.toast('Genera la vista previa primero', 'warning'); return; }
        const cfg = this._getConfig();
        if (cfg.cursoId && this._state.selectedReport === 'tabulacion_formativas') {
            c = Store.get('cursos').find(x => x.id === cfg.cursoId) || c;
        }
        const orient = document.getElementById('rpt-orient');
        const isLandscape = orient && orient.value === 'landscape';
        const content = this._buildPreviewContent(this._state.selectedReport, c) + this._docWatermark();
        const wordDoc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Reporte</title>
        <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
        <style>
            @page { size: letter ${isLandscape?'landscape':'portrait'}; margin: 0.8in; }
            body { font-family: 'Calibri', Arial, sans-serif; font-size: 12px; }
            .doc-header-inst { text-align:center; padding-bottom:10px; border-bottom:2px solid #000; margin-bottom:10px; }
            .doc-inst-name { font-size:14px; font-weight:bold; text-transform:uppercase; }
            .doc-report-title { font-size:12px; font-weight:bold; text-transform:uppercase; color:#10B981; }
            .doc-meta-row { font-size:10px; color:#333; text-align:center; }
            .doc-table { width:100%; border-collapse:collapse; font-size:10px; margin-top:12px; border:1px solid #94A3B8; }
            .doc-table th, .doc-table td { border:1px solid #94A3B8; }
            .doc-table th { background:#1E293B; color:white; padding:5px; text-align:center; font-size:9px; font-weight:bold; }
            .doc-table th.th-left { text-align:left; }
            .doc-table td { border:1px solid #94A3B8; padding:4px; text-align:center; vertical-align:middle; }
            .doc-table td.td-name { text-align:left; font-weight:bold; }
            .td-p { color:green; font-weight:bold; } .td-a { color:red; font-weight:bold; }
            .td-t { color:#D97706; font-weight:bold; } .td-j { color:blue; font-weight:bold; }
            .td-subtotal { background:#d0e8f0; font-weight:bold; color:#005; }
            .td-nota { background:#d0f0da; font-weight:bold; color:#080; }
            .doc-footer-sign { margin-top:30px; display:flex; justify-content:space-around; }
            .sign-block { text-align:center; }
            .sign-line { border-top:1px solid #000; padding-top:4px; font-size:9px; }
            .doc-obs-box { margin-top:10px; border:1px solid #999; padding:8px; min-height:40px; font-size:10px; }
            .doc-stats-row { display:flex; gap:8px; margin-top:10px; }
            .doc-stat-box { flex:1; border:1px solid #ccc; padding:8px; text-align:center; }
            .doc-stat-num { font-size:18px; font-weight:bold; color:#10B981; }
            .doc-stat-lbl { font-size:9px; color:#555; }
            .vertical-header-th {
                height: 120px !important;
                width: 32px !important;
                min-width: 32px !important;
                max-width: 32px !important;
                vertical-align: bottom !important;
                padding: 8px 2px 6px !important;
                background: #2b394e !important;
                border: 1px solid #94a3b8 !important;
                color: white !important;
                text-align: center !important;
                position: relative !important;
            }
            .vertical-header-text-div {
                writing-mode: vertical-rl !important;
                -webkit-writing-mode: vertical-rl !important;
                transform: rotate(180deg) !important;
                -webkit-transform: rotate(180deg) !important;
                white-space: nowrap !important;
                display: inline-block !important;
                font-size: 9px !important;
                font-weight: 700 !important;
                letter-spacing: 0.02em !important;
                text-transform: uppercase !important;
                max-height: 90px !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                margin: 0 auto !important;
            }
        </style></head><body>${content}</body></html>`;
        const blob = new Blob(['\ufeff', wordDoc], { type: 'application/msword' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const rptNames = { 
            asistencia_mensual:'Asistencia_Mensual', 
            parte_mensual:'Parte_Mensual', 
            cuadro_controlador:'Cuadro_Controlador', 
            tabulacion_formativas:'Tabulacion_Formativas', 
            tabulacion_mensual:'Tabulacion_Mensual',
            acta_final:'Acta_Calificaciones_Final',
            informe_sart:'Informe_SART',
            consolidado_asistencia:'Consolidado_Asistencia',
            reporte_parcial_detallado:'Reporte_Parcial_Detallado',
            ficha_estudiante:'Ficha_Individual_Estudiante',
            comparativo_parciales:'Comparativo_Parciales',
            estudiantes_riesgo:'Estudiantes_en_Riesgo'
        };
        a.download = `${rptNames[this._state.selectedReport]||'Reporte'}_${c.grado}_${c.seccion}.doc`;
        a.click();
        UI.toast('Documento Word generado', 'success');
    },

    // Legacy methods kept for backward compatibility
    downloadCSV() {
        const c = Store.getActiveCourse();
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        let csv = `Centro Educativo: ${c.centroEducativo||''}\nDocente: ${c.docente||''}\nCurso: ${c.asignatura} ${c.grado} ${c.seccion}"\n\nNombre,Identidad,Nota Final\n`;
        students.forEach(s => {
            const grade = Logic.calculateGrade(s.id, c.id);
            csv += `${s.nombreCompleto}",${s.identidad||''}",${grade}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Reporte.csv`; a.click();
    },
    downloadExcel() {
        const c = Store.getActiveCourse();
        const students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        let html = `<table border="1"><tr><td colspan="3" align="center"><b>${c.centroEducativo||''}</b></td></tr><tr><td colspan="3" align="center">Curso: ${c.asignatura} ${c.grado} ${c.seccion}"</td></tr><thead><tr><th>Nombre</th><th>Identidad</th><th>Nota Final</th></tr></thead><tbody>`;
        students.forEach(s => { html += `<tr><td>${s.nombreCompleto}</td><td>${s.identidad||''}</td><td>${Logic.calculateGrade(s.id, c.id)}</td></tr>`; });
        html += `</tbody></table>`;
        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Reporte.xls`; a.click();
    },
    printControlador() {
        this._state.selectedReport = 'cuadro_controlador';
        this._state.previewVisible = false;
        Router.navigate('reportes');
    }
};

window.Views.Reportes = ReportesModule;
window.Views._reportesInstance = ReportesModule;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportesModule;
}
