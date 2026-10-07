Views.Bitacora = {
    // â”€â”€ Estado local â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _filter: { tipo: 'todos', busqueda: '', cursoId: 'todos' },
    _showKpis: false,

    // â”€â”€ Catálogos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _tipos: [
        { key: 'conducta',      label: 'Conducta',           icon: 'shield-alert',      color: '#DC2626', bg: 'rgba(220,38,38,0.10)' },
        { key: 'academico',     label: 'Académico',          icon: 'book-open',         color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
        { key: 'asistencia',    label: 'Asistencia',         icon: 'calendar-x',        color: '#D97706', bg: 'rgba(217,119,6,0.10)' },
        { key: 'salud',         label: 'Salud / Bienestar',  icon: 'heart-pulse',       color: '#00C853', bg: 'rgba(5,150,105,0.10)' },
        { key: 'social',        label: 'Social / Emocional', icon: 'users',             color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
        { key: 'logro',         label: 'Logro / Destacado',  icon: 'star',              color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
        { key: 'otro',          label: 'Otro',               icon: 'circle-ellipsis',   color: '#64748B', bg: 'rgba(100,116,139,0.10)' }
    ],

    _severidades: [
        { key: 'info',     label: 'Informativo', color: '#2563EB' },
        { key: 'leve',     label: 'Leve',        color: '#D97706' },
        { key: 'moderado', label: 'Moderado',    color: '#EA580C' },
        { key: 'grave',    label: 'Grave',       color: '#DC2626' }
    ],

    // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _getTipo(key) { return this._tipos.find(t => t.key === key) || this._tipos[this._tipos.length - 1]; },
    _getSev(key)  { return this._severidades.find(s => s.key === key) || this._severidades[0]; },

    _getStudentName(estudianteId) {
        const st = Store.data.estudiantes.find(e => e.id === estudianteId);
        if (st) return st.nombreCompleto;
        // Fallback: Si no se encuentra, mostrar el ID truncado para depuración
        return `Estudiante (${estudianteId ? estudianteId.substring(0,8) : '?'})`;
    },
    _getCourseName(cursoId) {
        const c = Store.data.cursos.find(x => x.id === cursoId);
        return c ? `${c.asignatura} ${c.grado}°${c.seccion}` : '';
    },

    // â”€â”€ Render principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    render() {
        const allEntries = Store.get('bitacora').sort((a, b) => b.fecha.localeCompare(a.fecha));
        const cursos     = Store.get('cursos');
        const totalHoy   = allEntries.filter(e => e.fecha === new Date().toISOString().split('T')[0]).length;
        const totalGrave = allEntries.filter(e => e.severidad === 'grave').length;
        const tipos      = this._tipos;

        // Conteo por tipo
        const tipoCounts = {};
        tipos.forEach(t => { tipoCounts[t.key] = allEntries.filter(e => e.tipo === t.key).length; });

        return `
<style>
/* â”€â”€ Bitácora styles â”€â”€ */
.bita-page { max-width: 1100px; margin: 0 auto; padding-bottom: 60px; }

.bita-hero {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 12px 18px;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
}
.bita-hero::before {
    content: '';
    position: absolute;
    right: -40px; top: -40px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
}
.bita-hero-icon { width: 54px; height: 54px; opacity: 0.92; flex-shrink: 0; }
.bita-hero-title { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; margin: 0 0 2px; }
.bita-hero-sub   { font-size: 13px; opacity: 0.80; margin: 0; }

.bita-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 14px;
    margin-bottom: 24px;
}
.bita-kpi {
    background: #fff;
    border: 1px solid var(--border-soft);
    border-radius: 12px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-bottom: 3px solid transparent;
}
.bita-kpi:hover { 
    transform: translateY(-4px); 
    box-shadow: var(--shadow-hover);
    border-bottom-color: #f97316;
}
.bita-kpi .kpi-num { font-size: 22px; font-weight: 800; line-height: 1; color: var(--text-main); letter-spacing: -0.02em; }
.bita-kpi .kpi-lbl { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.bita-kpi .kpi-icon { margin-bottom: 10px; }
.bita-kpi-grid.hidden { display: none; }

.btn-toggle-kpis {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748B;
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    transition: all 0.2s;
}
.btn-toggle-kpis:hover { background: #E2E8F0; color: #1E293B; }
.btn-toggle-kpis i { width: 14px; height: 14px; }

.bita-toolbar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 24px;
    background: #fff;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid var(--border-soft);
}
.bita-search {
    flex: 1; min-width: 200px;
    height: 42px;
    padding: 0 14px 0 42px;
    border: 1.5px solid var(--border-soft);
    border-radius: 12px;
    font-size: 14px;
    background: var(--bg-muted) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='M21 21l-4.35-4.35'/%3E%3C/svg%3E") 14px center no-repeat;
    color: var(--text-main);
    transition: all 0.15s;
    font-family: var(--font-main);
}
.bita-search:focus { outline: none; border-color: #f97316; background: #fff; box-shadow: 0 0 0 4px rgba(249,115,22,0.1); }

.bita-filter-sel {
    height: 42px; padding: 0 12px;
    border: 1.5px solid var(--border-soft);
    border-radius: 12px;
    font-size: 13px; font-family: var(--font-main);
    background: var(--bg-muted); color: var(--text-main);
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 600;
}
.bita-filter-sel:focus { outline: none; border-color: #f97316; background: #fff; }

.bita-entries { display: flex; flex-direction: column; gap: 16px; }

.bita-entry {
    background: #fff;
    border: 1px solid var(--border-soft);
    border-radius: 18px;
    padding: 14px 18px;
    display: flex;
    gap: 20px;
    align-items: flex-start;
    box-shadow: var(--shadow-sm);
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    animation: bita-in 0.4s ease-out;
}
@keyframes bita-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.bita-entry:hover { 
    box-shadow: var(--shadow-hover); 
    border-color: rgba(249,115,22,0.3);
    transform: translateX(4px);
}

.bita-entry-type-badge {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
.bita-entry-type-badge i { width: 20px; height: 20px; }

.bita-entry-body { flex: 1; min-width: 0; }
.bita-entry-top  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.bita-entry-student { font-weight: 800; font-size: 16px; color: var(--text-main); letter-spacing: -0.01em; }
.bita-entry-course  { font-size: 12px; color: var(--text-muted); font-weight: 600; }

.bita-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 800;
    padding: 4px 10px; border-radius: 8px;
    text-transform: uppercase; letter-spacing: 0.06em;
}

.bita-entry-desc { font-size: 14px; color: var(--text-soft); line-height: 1.6; margin: 8px 0 0; }
.bita-entry-footer { display: flex; align-items: center; gap: 12px; margin-top: 10px; flex-wrap: wrap; }
.bita-entry-date { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.bita-entry-date i { width: 12px; height: 12px; }

.bita-sev-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    display: inline-block;
}

.bita-entry-actions { margin-left: auto; display: flex; gap: 6px; }
.bita-action-btn {
    width: 30px; height: 30px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--border-soft);
    background: transparent; cursor: pointer;
    color: var(--text-muted); transition: all 0.15s;
}
.bita-action-btn:hover { background: var(--bg-soft); color: var(--text-main); }
.bita-action-btn.danger:hover { background: rgba(220,38,38,0.08); border-color: rgba(220,38,38,0.3); color: #DC2626; }

.bita-empty {
    text-align: center; padding: 60px 20px;
    color: var(--text-muted);
}
.bita-empty i { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.4; }
.bita-empty p { font-size: 15px; font-weight: 600; margin: 0 0 6px; }
.bita-empty span { font-size: 13px; }

/* Modal form */
.bita-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .bita-form-grid { grid-template-columns: 1fr; } }
.bita-form-group { display: flex; flex-direction: column; gap: 6px; }
.bita-form-group.span2 { grid-column: 1 / -1; }
.bita-form-label { font-size: 12px; font-weight: 700; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.06em; }
.bita-form-input, .bita-form-select, .bita-form-textarea {
    height: 42px; padding: 0 12px;
    border: 1.5px solid var(--border-soft); border-radius: 10px;
    font-size: 13px; font-family: var(--font-main); color: var(--text-main);
    background: #fff; transition: border-color 0.15s;
}
.bita-form-input:focus, .bita-form-select:focus, .bita-form-textarea:focus {
    outline: none; border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
}
.bita-form-textarea { height: 90px; padding: 10px 12px; resize: vertical; }

.bita-tipo-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;
}
.bita-tipo-card {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 10px 6px; border-radius: 10px; border: 1.5px solid var(--border-soft);
    cursor: pointer; transition: all 0.15s; background: #fff; font-size: 11px;
    font-weight: 700; color: var(--text-muted); text-align: center;
}
.bita-tipo-card:hover { border-color: #f97316; color: var(--text-main); }
.bita-tipo-card.selected { border-color: #f97316; background: rgba(249,115,22,0.08); color: #ea580c; }
.bita-tipo-card i { width: 20px; height: 20px; }

.bita-sev-row { display: flex; gap: 8px; flex-wrap: wrap; }
.bita-sev-btn {
    flex: 1; min-width: 80px; padding: 8px 10px; border-radius: 8px;
    border: 1.5px solid var(--border-soft); background: #fff; cursor: pointer;
    font-size: 12px; font-weight: 700; color: var(--text-muted);
    transition: all 0.15s; font-family: var(--font-main); text-align: center;
}
.bita-sev-btn.selected { color: #fff; border-color: transparent; }

.bita-seguimiento-list { display: flex; flex-direction: column; gap: 8px; }
.bita-seg-item {
    background: #F8FAFC; border-radius: 8px; padding: 10px 14px;
    font-size: 12px; color: var(--text-soft); border-left: 3px solid #f97316;
}
.bita-seg-date { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
</style>

<div class="bita-page fade-in">

    <div class="a360-header">
        <div class="a360-header-left">
            <div class="a360-header-icon" style="background: rgba(249,115,22,0.1); color: #f97316;"><i data-lucide="notebook-pen"></i></div>
            <div>
                <h2 class="a360-header-title">Bitácora</h2>
                <p class="a360-header-subtitle">Seguimiento de Incidencias y Observaciones</p>
            </div>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
            <button onclick="Views.Bitacora.toggleMetrics()" class="a360-toggle-pill ${Store.data.uiState.metricsOpen.bitacora ? 'active' : ''}" title="Mostrar/Ocultar Resumen">
                <i data-lucide="${Store.data.uiState.metricsOpen.bitacora ? 'layout-dashboard' : 'layout-grid'}"></i>
                <span>Panel</span>
            </button>
            <button class="btn btn-primary" onclick="Views.Bitacora.openForm()" style="padding: 8px 18px; font-size: 0.85rem; border-radius: 12px; display: flex; align-items: center; gap: 8px; font-weight: 800; background: #f97316; border-color: #f97316; color: #fff; box-shadow: 0 4px 12px rgba(249,115,22,0.2);">
                <i data-lucide="plus" style="width:16px;"></i>
                <span>Nueva Entrada</span>
            </button>
        </div>
    </div>

    <!-- KPIs -->
    <div class="bita-kpi-grid" id="bita-kpis" style="display:${Store.data.uiState.metricsOpen.bitacora ? 'grid' : 'none'}">
        ${this._renderKpis(allEntries)}
    </div>

    <!-- Barra de herramientas -->
    <div class="bita-toolbar">
        <input type="text" class="bita-search" id="bita-search-input"
            placeholder="Buscar por estudiante, descripción…"
            oninput="Views.Bitacora._filter.busqueda=this.value; Views.Bitacora._applyFilters()">
        <select class="bita-filter-sel" id="bita-filter-tipo"
            onchange="Views.Bitacora._filter.tipo=this.value; Views.Bitacora._applyFilters()">
            <option value="todos">Todos los tipos</option>
            ${tipos.map(t => `<option value="${t.key}">${t.label}</option>`).join('')}
        </select>
        <select class="bita-filter-sel" id="bita-filter-curso"
            onchange="Views.Bitacora._filter.cursoId=this.value; Views.Bitacora._applyFilters()">
            <option value="todos">Todos los cursos</option>
            ${cursos.map(c => `<option value="${c.id}">${c.asignatura} ${c.grado}°${c.seccion}</option>`).join('')}
        </select>
        <select class="bita-filter-sel" id="bita-filter-sev"
            onchange="Views.Bitacora._filter.severidad=this.value; Views.Bitacora._applyFilters()">
            <option value="todos">Toda severidad</option>
            ${this._severidades.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
        </select>
        <button class="btn btn-outline btn-sm" onclick="Views.Bitacora._exportarPDF()" title="Exportar a PDF">
            <i data-lucide="file-text" style="width:14px;height:14px;"></i> PDF
        </button>
    </div>

    <!-- Lista de entradas -->
    <div class="bita-entries" id="bita-entries-list">
        ${this._renderEntries(allEntries)}
    </div>
</div>`;
    },

    // â”€â”€ Helpers render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _renderKpis(entries) {
        const hoy = new Date().toISOString().split('T')[0];
        const totalHoy   = entries.filter(e => e.fecha === hoy).length;
        const totalGrave = entries.filter(e => e.severidad === 'grave').length;
        const totalLogro = entries.filter(e => e.tipo === 'logro').length;
        const totalMes   = entries.filter(e => e.fecha && e.fecha.startsWith(hoy.substring(0,7))).length;

        return `
        <div class="bita-kpi">
            <i data-lucide="notebook-pen" class="kpi-icon" style="width:22px;height:22px;color:#f97316;"></i>
            <span class="kpi-num">${entries.length}</span>
            <span class="kpi-lbl">Total registros</span>
        </div>
        <div class="bita-kpi">
            <i data-lucide="calendar" class="kpi-icon" style="width:22px;height:22px;color:#2563EB;"></i>
            <span class="kpi-num">${totalHoy}</span>
            <span class="kpi-lbl">Hoy</span>
        </div>
        <div class="bita-kpi">
            <i data-lucide="calendar-days" class="kpi-icon" style="width:22px;height:22px;color:#7C3AED;"></i>
            <span class="kpi-num">${totalMes}</span>
            <span class="kpi-lbl">Este mes</span>
        </div>
        <div class="bita-kpi">
            <i data-lucide="shield-alert" class="kpi-icon" style="width:22px;height:22px;color:#DC2626;"></i>
            <span class="kpi-num">${totalGrave}</span>
            <span class="kpi-lbl">Graves</span>
        </div>
        <div class="bita-kpi">
            <i data-lucide="star" class="kpi-icon" style="width:22px;height:22px;color:#F59E0B;"></i>
            <span class="kpi-num">${totalLogro}</span>
            <span class="kpi-lbl">Logros</span>
        </div>`;
    },

    _renderEntries(entries) {
        if (!entries || entries.length === 0) {
            return `<div class="bita-empty">
                <i data-lucide="notebook-pen"></i>
                <p>No hay entradas registradas</p>
                <span>Usa el botón "Nueva Entrada" para registrar una incidencia o logro.</span>
            </div>`;
        }

        return entries.map(e => {
            const tipo = this._getTipo(e.tipo);
            const sev  = this._getSev(e.severidad);
            const nombre  = this._getStudentName(e.estudianteId);
            const curso   = e.cursoId ? this._getCourseName(e.cursoId) : '';
            const seguimientos = e.seguimientos || [];

            return `
            <div class="bita-entry" id="bita-entry-${e.id}">
                <div class="bita-entry-type-badge" style="background:${tipo.bg};">
                    <i data-lucide="${tipo.icon}" style="color:${tipo.color};"></i>
                </div>
                <div class="bita-entry-body">
                    <div class="bita-entry-top">
                        <span class="bita-entry-student">${nombre}</span>
                        ${curso ? `<span class="bita-entry-course">· ${curso}</span>` : ''}
                        <span class="bita-chip" style="background:${tipo.bg};color:${tipo.color};">${tipo.label}</span>
                        <span class="bita-chip" style="background:${sev.color}18;color:${sev.color};">
                            <span class="bita-sev-dot" style="background:${sev.color};"></span>
                            ${sev.label}
                        </span>
                        ${e.notificacion ? `<span class="bita-chip" style="background:rgba(99,102,241,0.10);color:#6366f1;"><i data-lucide="bell" style="width:10px;height:10px;"></i> Notificado</span>` : ''}
                    </div>
                    ${e.titulo ? `<div style="font-size:13px;font-weight:700;color:var(--text-main);margin-bottom:2px;">${e.titulo}</div>` : ''}
                    <div class="bita-entry-desc">${e.descripcion || ''}</div>
                    ${seguimientos.length > 0 ? `
                    <div style="margin-top:10px;">
                        <div style="font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Seguimiento (${seguimientos.length})</div>
                        <div class="bita-seguimiento-list">
                            ${seguimientos.map(s => `<div class="bita-seg-item">${s.nota}<div class="bita-seg-date">${Utils.formatDate(s.fecha)}</div></div>`).join('')}
                        </div>
                    </div>` : ''}
                    <div class="bita-entry-footer">
                        <span class="bita-entry-date">
                            <i data-lucide="clock"></i>
                            ${Utils.formatDate(e.fecha + 'T00:00:00')}
                        </span>
                        ${e.accionTomada ? `<span class="bita-entry-date"><i data-lucide="check-circle-2"></i> ${e.accionTomada}</span>` : ''}
                        <div class="bita-entry-actions">
                            <button class="bita-action-btn" title="Compartir vía WhatsApp"
                                onclick="Views.Bitacora.shareWhatsApp('${e.id}')" style="color:#22c55e;">
                                <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="bita-action-btn" title="Agregar seguimiento"
                                onclick="Views.Bitacora.openSeguimiento('${e.id}')">
                                <i data-lucide="message-square-plus" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="bita-action-btn" title="Editar"
                                onclick="Views.Bitacora.openForm('${e.id}')">
                                <i data-lucide="pencil" style="width:14px;height:14px;"></i>
                            </button>
                            <button class="bita-action-btn danger" title="Eliminar"
                                onclick="Views.Bitacora._eliminar('${e.id}')">
                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    toggleMetrics() {
        Store.data.uiState.metricsOpen.bitacora = !Store.data.uiState.metricsOpen.bitacora;
        Store.save();
        Router.render();
    },

    // â”€â”€ Filtros en tiempo real â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _applyFilters() {
        const f = this._filter;
        let entries = Store.get('bitacora').sort((a, b) => b.fecha.localeCompare(a.fecha));

        if (f.tipo && f.tipo !== 'todos') {
            entries = entries.filter(e => e.tipo === f.tipo);
        }
        if (f.cursoId && f.cursoId !== 'todos') {
            entries = entries.filter(e => e.cursoId === f.cursoId);
        }
        if (f.severidad && f.severidad !== 'todos') {
            entries = entries.filter(e => e.severidad === f.severidad);
        }
        if (f.busqueda && f.busqueda.trim()) {
            const q = f.busqueda.toLowerCase().trim();
            entries = entries.filter(e => {
                const nombre = this._getStudentName(e.estudianteId).toLowerCase();
                const desc   = (e.descripcion || '').toLowerCase();
                const titulo = (e.titulo || '').toLowerCase();
                return nombre.includes(q) || desc.includes(q) || titulo.includes(q);
            });
        }

        const list = document.getElementById('bita-entries-list');
        if (list) {
            list.innerHTML = this._renderEntries(entries);
            if (window.lucide) window.lucide.createIcons();
        }
    },

    // â”€â”€ Formulario Nueva / Editar entrada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    openForm(editId = null) {
        const cursos      = Store.get('cursos');
        const estudiantes = Store.get('estudiantes');
        const tipos       = this._tipos;
        const sevs        = this._severidades;
        const isEdit      = !!editId;
        const existing    = isEdit ? Store.get('bitacora').find(e => e.id === editId) : null;

        const cursosOpts = cursos.map(c =>
            `<option value="${c.id}" ${existing?.cursoId === c.id ? 'selected' : ''}>${c.asignatura} ${c.grado}°${c.seccion}</option>`
        ).join('');

        // Estudiantes dinámicos (se actualizan al cambiar curso)
        const estudiantesOpts = estudiantes.map(s =>
            `<option value="${s.id}" ${existing?.estudianteId === s.id ? 'selected' : ''}>${s.nombreCompleto}</option>`
        ).join('');

        const tipoCards = tipos.map(t => `
            <div class="bita-tipo-card ${existing?.tipo === t.key ? 'selected' : ''}"
                data-tipo="${t.key}"
                onclick="document.querySelectorAll('.bita-tipo-card').forEach(x=>x.classList.remove('selected')); this.classList.add('selected'); document.getElementById('bita-tipo-val').value=this.dataset.tipo; Views.Bitacora._updateSugerencias(this.dataset.tipo);">
                <i data-lucide="${t.icon}" style="color:${t.color};width:18px;height:18px;"></i>
                ${t.label}
            </div>`).join('');

        const sevBtns = sevs.map(s => `
            <button type="button" class="bita-sev-btn ${existing?.severidad === s.key || (!existing && s.key === 'leve') ? 'selected' : ''}"
                data-sev="${s.key}"
                style="${existing?.severidad === s.key || (!existing && s.key === 'leve') ? `background:${s.color};border-color:${s.color};` : ''}"
                onclick="document.querySelectorAll('.bita-sev-btn').forEach(x=>{x.classList.remove('selected');x.style.background='';x.style.borderColor='';x.style.color=''}); this.classList.add('selected'); this.style.background='${s.color}'; this.style.borderColor='${s.color}'; this.style.color='#fff'; document.getElementById('bita-sev-val').value=this.dataset.sev;">
                ${s.label}
            </button>`).join('');

        const formHtml = `
        <div style="max-height:85vh; overflow-y:auto; padding:2px 4px;">
        <input type="hidden" id="bita-tipo-val" value="${existing?.tipo || 'conducta'}">
        <input type="hidden" id="bita-sev-val"  value="${existing?.severidad || 'leve'}">

        <div style="margin-bottom:18px;">
            <div class="bita-form-label" style="margin-bottom:10px;">Tipo de Incidencia</div>
            <div class="bita-tipo-grid">${tipoCards}</div>
        </div>

        <div class="bita-form-grid">
            <div class="bita-form-group span2">
                <label class="bita-form-label">Curso</label>
                <select class="bita-form-select" id="bita-f-curso" onchange="Views.Bitacora._updateEstudiantes(this.value)">
                    <option value="">— Sin curso específico —</option>
                    ${cursosOpts}
                </select>
            </div>
            <div class="bita-form-group span2">
                <label class="bita-form-label">Estudiante *</label>
                <select class="bita-form-select" id="bita-f-estudiante" required>
                    <option value="">— Seleccionar —</option>
                    ${estudiantesOpts}
                </select>
            </div>
            <div class="bita-form-group">
                <label class="bita-form-label">Fecha *</label>
                <input type="date" class="bita-form-input" id="bita-f-fecha"
                    value="${existing?.fecha || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="bita-form-group span2">
                <label class="bita-form-label">Título / Resumen *</label>
                <input type="text" class="bita-form-input" id="bita-f-titulo"
                    placeholder="Ej: Conflicto durante el receso…"
                    value="${existing?.titulo || ''}">
                <div id="bita-sugerencias-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;"></div>
            </div>
            <div class="bita-form-group span2">
                <label class="bita-form-label">Descripción detallada *</label>
                <textarea class="bita-form-textarea" id="bita-f-desc"
                    placeholder="Describe la incidencia con el mayor detalle posible...">${existing?.descripcion || ''}</textarea>
            </div>
            <div class="bita-form-group span2">
                <label class="bita-form-label">Severidad</label>
                <div class="bita-sev-row">${sevBtns}</div>
            </div>
            <div class="bita-form-group">
                <label class="bita-form-label">Acción tomada</label>
                <input type="text" class="bita-form-input" id="bita-f-accion"
                    placeholder="Ej: Llamada a padres, citación…"
                    value="${existing?.accionTomada || ''}">
            </div>
            <div class="bita-form-group" style="justify-content:flex-end; flex-direction:row; align-items:center; gap:10px; padding-top:20px;">
                <label style="font-size:13px;font-weight:600;color:var(--text-soft);display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" id="bita-f-notif" ${existing?.notificacion ? 'checked' : ''}
                        style="width:16px;height:16px;accent-color:#f97316;">
                    Notificado a padres/directivos
                </label>
            </div>
        </div>
        </div>`;

        const footerHtml = `
        <div style="display:flex;gap:10px;width:100%;">
            <button class="btn btn-secondary" onclick="UI.closeModal()" style="flex:1;">Cancelar</button>
            <button class="btn btn-primary" onclick="Views.Bitacora._guardar('${editId || ''}')"
                style="flex:2;background:linear-gradient(135deg,#ea580c,#f97316);">
                <i data-lucide="save" style="width:15px;height:15px;"></i>
                ${isEdit ? 'Actualizar' : 'Registrar'} Entrada
            </button>
        </div>`;

        UI.modal(isEdit ? 'Editar Entrada' : 'Nueva Entrada en Bitácora', formHtml, footerHtml);

        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
            // If editing and has course, filter students
            if (existing?.cursoId) this._updateEstudiantes(existing.cursoId, existing.estudianteId);
            // Load initial suggestions
            this._updateSugerencias(existing?.tipo || 'conducta');
        }, 50);
    },

    SUGERENCIAS: {
        conducta: ["Interrupción en clase", "Uso del celular", "Falta de respeto", "Vocabulario inapropiado", "Agresión física/verbal"],
        academico: ["No presentó tareas", "No trajo materiales", "Bajo rendimiento", "Distracción constante", "No trabaja en clase"],
        asistencia: ["Fuga de clase", "Retiro temprano", "Llegada tardía reiterada"],
        salud: ["Malestar general", "Dolor de estómago/cabeza", "Accidente leve"],
        social: ["Aislamiento", "Problema emocional", "Conflicto con compañeros"],
        logro: ["Excelente participación", "Mejora notable", "Ayudó a un compañero", "Trabajo sobresaliente"],
        otro: ["Daño a mobiliario", "Objeto perdido"]
    },

    _updateSugerencias(tipo) {
        const container = document.getElementById('bita-sugerencias-chips');
        if (!container) return;
        const sugerencias = this.SUGERENCIAS[tipo] || [];
        if (sugerencias.length === 0) {
            container.innerHTML = '';
            return;
        }
        // Cuando el usuario haga click en el chip, rellenar el título
        container.innerHTML = sugerencias.map(s => 
            `<div style="font-size:11px; padding:3px 8px; background:#fff7ed; border:1px solid #fed7aa; border-radius:12px; color:#c2410c; cursor:pointer; transition:all 0.2s;" 
                  onmouseover="this.style.background='#ffedd5'; this.style.borderColor='#fdba74';" 
                  onmouseout="this.style.background='#fff7ed'; this.style.borderColor='#fed7aa';"
                  onclick="const tit = document.getElementById('bita-f-titulo'); tit.value = '${s}'; tit.focus();">
                ${s}
            </div>`
        ).join('');
    },

    _updateEstudiantes(cursoId, selectedId = null) {
        const sel = document.getElementById('bita-f-estudiante');
        if (!sel) return;
        let students;
        if (cursoId) {
            students = Store.getStudentsByCourse(cursoId);
        } else {
            students = Store.get('estudiantes');
        }
        sel.innerHTML = `<option value="">— Seleccionar —</option>` +
            students.map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${s.nombreCompleto}</option>`).join('');
    },

    _guardar(editId) {
        const tipo       = document.getElementById('bita-tipo-val')?.value;
        const severidad  = document.getElementById('bita-sev-val')?.value;
        const cursoId    = document.getElementById('bita-f-curso')?.value || null;
        const estudId    = document.getElementById('bita-f-estudiante')?.value;
        const fecha      = document.getElementById('bita-f-fecha')?.value;
        const titulo     = document.getElementById('bita-f-titulo')?.value.trim();
        const desc       = document.getElementById('bita-f-desc')?.value.trim();
        const accion     = document.getElementById('bita-f-accion')?.value.trim();
        const notif      = document.getElementById('bita-f-notif')?.checked || false;

        if (!estudId)    { UI.toast('Selecciona un estudiante', 'warning'); return; }
        if (!titulo)     { UI.toast('Escribe un título', 'warning'); return; }
        if (!desc)       { UI.toast('Escribe la descripción', 'warning'); return; }
        if (!fecha)      { UI.toast('Selecciona la fecha', 'warning'); return; }

        const entry = { tipo, severidad, cursoId, estudianteId: estudId, fecha, titulo, descripcion: desc, accionTomada: accion || null, notificacion: notif };

        if (editId) {
            const existing = Store.get('bitacora').find(e => e.id === editId);
            Store.update('bitacora', editId, { ...entry, seguimientos: existing?.seguimientos || [] });
            UI.toast('Entrada actualizada', 'success');
        } else {
            Store.add('bitacora', { ...entry, seguimientos: [] });
            UI.toast('Entrada registrada en Bitácora', 'success');
        }

        UI.closeModal();
        Router.render();
    },

    // â”€â”€ Seguimiento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    openSeguimiento(entryId) {
        const entry = Store.get('bitacora').find(e => e.id === entryId);
        if (!entry) return;

        const formHtml = `
        <p style="font-size:13px;color:var(--text-soft);margin:0 0 14px;">
            Agregar nota de seguimiento a: <strong>${this._getStudentName(entry.estudianteId)}</strong><br>
            <em style="font-size:12px;">${entry.titulo || ''}</em>
        </p>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <label class="bita-form-label">Nota de seguimiento</label>
            <textarea class="bita-form-textarea" id="bita-seg-nota" placeholder="Describe la acción de seguimiento…" style="height:80px;"></textarea>
        </div>`;

        const footerHtml = `
        <div style="display:flex;gap:10px;width:100%;">
            <button class="btn btn-secondary" onclick="UI.closeModal()" style="flex:1;">Cancelar</button>
            <button class="btn btn-primary" onclick="Views.Bitacora._guardarSeguimiento('${entryId}')"
                style="flex:2;background:linear-gradient(135deg,#ea580c,#f97316);">
                <i data-lucide="message-square-plus" style="width:15px;height:15px;"></i> Agregar Seguimiento
            </button>
        </div>`;

        UI.modal('💬 Agregar Seguimiento', formHtml, footerHtml);
    },

    _guardarSeguimiento(entryId) {
        const nota = document.getElementById('bita-seg-nota')?.value.trim();
        if (!nota) { UI.toast('Escribe la nota', 'warning'); return; }

        const entry = Store.get('bitacora').find(e => e.id === entryId);
        if (!entry) return;

        const seguimientos = [...(entry.seguimientos || []), { id: Utils.id(), nota, fecha: Utils.timestamp() }];
        Store.update('bitacora', entryId, { seguimientos });
        UI.closeModal();
        UI.toast('Seguimiento agregado', 'success');
        Router.render();
    },

    // â”€â”€ Eliminar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    shareWhatsApp(id) {
        const entry = Store.data.bitacora?.find(e => e.id === id);
        if (!entry) return;
        const nombre = this._getStudentName(entry.estudianteId);
        const tipo = this._getTipo(entry.tipo).label;
        const sev = this._getSev(entry.severidad).label;
        const fecha = Utils.formatDate(entry.fecha + 'T00:00:00');
        
        let msg = `*Reporte de Bitácora - Aula 360*\n\n`;
        msg += `*Estudiante:* ${nombre}\n`;
        msg += `*Fecha:* ${fecha}\n`;
        msg += `*Tipo:* ${tipo} (${sev})\n`;
        if (entry.titulo) msg += `*Reporte:* ${entry.titulo}\n`;
        if (entry.descripcion) msg += `*Detalles:* ${entry.descripcion}\n`;
        if (entry.accionTomada) msg += `*Acción:* ${entry.accionTomada}\n`;
        msg += `\n_Generado desde Aula 360_`;
        
        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    },

    _eliminar(id) {
        UI.confirm('¿Eliminar esta entrada de la bitácora?', () => {
            Store.delete('bitacora', id);
            UI.toast('Entrada eliminada', 'success');
            const el = document.getElementById(`bita-entry-${id}`);
            if (el) { el.style.transition = 'opacity 0.3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
            // Update KPIs
            const kpis = document.getElementById('bita-kpis');
            if (kpis) { kpis.innerHTML = this._renderKpis(Store.get('bitacora')); if (window.lucide) window.lucide.createIcons(); }
        });
    },

    // â”€â”€ Exportar PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    _exportarPDF() {
        const entries   = Store.get('bitacora').sort((a, b) => b.fecha.localeCompare(a.fecha));
        const hoy       = new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
        const docente   = Store.getActiveCourse() ? `Curso activo: ${this._getCourseName(Store.data.activeCourseId)}` : 'Todos los cursos';

        const rows = entries.map(e => {
            const tipo = this._getTipo(e.tipo);
            const sev  = this._getSev(e.severidad);
            return `<tr>
                <td style="padding:8px;border-bottom:1px solid #E2E5EF;font-size:12px;">${Utils.formatDate(e.fecha+'T00:00:00')}</td>
                <td style="padding:8px;border-bottom:1px solid #E2E5EF;font-size:12px;font-weight:600;">${this._getStudentName(e.estudianteId)}</td>
                <td style="padding:8px;border-bottom:1px solid #E2E5EF;font-size:12px;">${tipo.label}</td>
                <td style="padding:8px;border-bottom:1px solid #E2E5EF;font-size:12px;">
                    <span style="color:${sev.color};font-weight:700;">${sev.label}</span>
                </td>
                <td style="padding:8px;border-bottom:1px solid #E2E5EF;font-size:12px;">${e.titulo || ''}</td>
                <td style="padding:8px;border-bottom:1px solid #E2E5EF;font-size:12px;max-width:200px;">${e.descripcion || ''}</td>
                <td style="padding:8px;border-bottom:1px solid #E2E5EF;font-size:12px;">${e.accionTomada || '—'}</td>
            </tr>`;
        }).join('');

        const printContent = `
        <html><head><meta charset="UTF-8">
        <style>
            body { font-family: 'Arial', sans-serif; margin: 40px; color: #1e293b; background: #fff; }
            h1 { font-size: 24px; color: #0f172a; margin: 0 0 8px; border-bottom: 2px solid #f97316; padding-bottom: 12px; }
            .sub { font-size: 13px; color: #64748b; margin: 0 0 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { border-bottom: 2px solid #e2e8f0; color: #475569; padding: 12px 8px; font-size: 11px; text-align: left; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: top; }
            .sev-grave { color: #dc2626; font-weight: 700; }
            @media print { h1 { border-bottom-color: #f97316 !important; -webkit-print-color-adjust: exact; } }
        </style></head><body>
        <h1>Bitácora de Incidencias — Aula 360</h1>
        <p class="sub">Reporte institucional generado el ${hoy} <br> ${docente} · <strong>${entries.length} registros totales</strong></p>
        <table>
            <thead><tr>
                <th>Fecha</th><th>Estudiante</th><th>Tipo</th><th>Severidad</th>
                <th>Título</th><th>Descripción</th><th>Acción Tomada</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
            Este documento es un reporte oficial del sistema Aula 360 HN.
        </div>
        </body></html>`;

        const win = window.open('', '_blank');
        if (!win) { UI.toast('Permite las ventanas emergentes para exportar', 'warning'); return; }
        win.document.write(printContent);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    }
};

// Re-register component for Router
if (typeof Views !== 'undefined') {
    Views.Bitacora = Views.Bitacora;
} 

