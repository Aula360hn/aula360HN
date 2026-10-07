// =============================================================
//  NOTAS RÁPIDAS PRO v3.0 — Aula 360 HN
//  Professional Smart Contextual Capture System
//  Diseño: SaaS Premium | Notion Style
// =============================================================

(function patchNotasRapidas() {
    if (typeof Views === 'undefined') { setTimeout(patchNotasRapidas, 200); return; }

    const NR = {
        _activeNoteId: null,
        _activeFilter: 'todas',
        _activeContext: 'todos',
        _searchTerm: '',
        _rightPanelOpen: false,
        _leftPanelOpen: false,
        _quickMode: true, // Modo rápido por defecto

        // ─── PLANTILLAS PREDEFINIDAS ──────────────────────────────
        TEMPLATES: {
            'blank': { label: 'Nota en Blanco', icon: 'file-text', content: '' },
            'aportaciones': { 
                label: 'Aportaciones Económicas', icon: 'dollar-sign', 
                table: { columns: ['Alumno', 'Recibido (L.)', 'Saldo / Estado'], body: 'Control de aportaciones y pagos diversos.' },
                onGenerate: () => NR._generateStudentTable(['Alumno', 'Recibido (L.)', 'Saldo / Estado']),
                headerHtml: `
                    <div style="background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px; display:grid; grid-template-columns: 2fr 1fr; gap:16px;">
                        <div><label style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Concepto de la Aportación</label><div class="p-1 nr-global-concept" contenteditable="true" style="font-weight:700; color:#0f172a; border-bottom:1px solid #cbd5e1;">Ej. Excursión o Materiales</div></div>
                        <div><label style="font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase;">Monto Sugerido (L.)</label><div class="p-1 nr-global-monto" contenteditable="true" style="font-weight:700; color:#00C853; border-bottom:1px solid #cbd5e1;">0.00</div></div>
                    </div>
                `
            },
            'prestamos': { 
                label: 'Préstamo de Libros', icon: 'book-open', 
                table: { columns: ['Alumno', 'Libro / ID', 'Fecha Entrega', 'Firma/Observación'], body: 'Registro de material bibliográfico entregado.' },
                onGenerate: () => NR._generateStudentTable(['Alumno', 'Libro / ID', 'Fecha Entrega', 'Firma/Observación'])
            },
            'actividades': { 
                label: 'Actividades Coprogramáticas', icon: 'trophy', 
                table: { columns: ['Alumno', 'Actividad', 'Rol/Participación', 'Puntos'], body: 'Seguimiento de participación en eventos extra.' },
                onGenerate: () => NR._generateStudentTable(['Alumno', 'Actividad', 'Rol/Participación', 'Puntos'])
            },
            'incidentes': { 
                label: 'Reporte de Incidente', icon: 'alert-triangle', 
                content: '<h3>Detalles del Incidente</h3><p><strong>Lugar:</strong> ...</p><p><strong>Implicados:</strong> ...</p><p><strong>Descripción:</strong> ...</p><p><strong>Acuerdos:</strong> ...</p>' 
            }
        },
        
        _generateStudentTable(cols) {
            const alumnos = this._getAlumnosActuales();
            let header = `<tr style="background:#f1f5f9">${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
            let rows = alumnos.map(a => `<tr><td>${a.nombre}</td>${Array(cols.length-1).fill('<td></td>').join('')}</tr>`).join('');
            return `<table style="width:100%; border-collapse:collapse;" border="1"><thead>${header}</thead><tbody>${rows}</tbody></table>`;
        },

        CONTEXTS: {
            'clase':       { label: 'En Clase',    icon: 'presentation',  target: 'Bitácora',    color: '#00C853', bg: '#E8F8EF',
                             template: '<h3>Logros del Día</h3><ul><li></li></ul><h3>Observaciones / Incidentes</h3><p></p><h3>Pendientes / Tareas</h3><ul><li></li></ul>' },
            'seguimiento': { label: 'Seguimiento', icon: 'user-check',    target: 'Evaluación',  color: '#2979FF', bg: '#EAF2FF',
                             template: '<h3>Ficha de Seguimiento</h3><p><strong>Situación:</strong> </p><p><strong>Intervención:</strong> </p><p><strong>Compromisos:</strong> </p>' },
            'reunion':     { label: 'Reunión',     icon: 'users',         target: 'Bitácora',    color: '#6B21A8', bg: '#F4EAFE', 
                             subs: ['Director', 'Docente', 'Alumno', 'Padre', 'Consejo'],
                             template: '<h3>Minuta de Reunión</h3><p><strong>Agenda:</strong> </p><h3>Acuerdos Tomados</h3><ol><li></li></ol><p><strong>Próxima Reunión:</strong> </p>' },
            'planificacion':{ label: 'Planeación', icon: 'calendar-range',target: 'Jornalización',color: '#FF7A00', bg: '#FFF0E5',
                             template: '<h3>Planificación</h3><p><strong>Unidad / Tema:</strong> </p><p><strong>Objetivo de Aprendizaje:</strong> </p><p><strong>Recursos/Materiales:</strong> </p>' },
            'recordatorio':{ label: 'Recordatorio',icon: 'bell',          target: 'Agenda',      color: '#E53935', bg: '#FDECEC',
                             template: '<h3>⚠️ Recordatorio Importante</h3><p><strong>Acción a realizar:</strong> </p><p><strong>Fecha Límite:</strong> </p>' },
            'evidencia':   { label: 'Evidencia',   icon: 'image',         target: 'Evaluación',  color: '#00C853', bg: '#F0FDFA',
                             template: '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px; border:2px dashed #00C853; border-radius:16px; color:#00C853; cursor:pointer; background:rgba(0, 200, 83, 0.05);" onclick="NR._takePhoto()"><i data-lucide="camera" style="width:48px; height:48px; margin-bottom:12px;"></i><p style="font-weight:800; margin:0;">Haz clic para capturar evidencia física</p></div><br><h3>Registro de Evidencia</h3><p><strong>Descripción:</strong> </p>' },
            'general':     { label: 'Nota General',icon: 'sticky-note',   target: 'Archivo',     color: '#64748b', bg: '#F1F5F9',
                             template: '<p>Comienza a escribir aquí...</p>' },
        },

        FILTERS: [
            { id: 'todas',      icon: 'inbox', label: 'Todos los registros' },
            { id: 'fijadas',    icon: 'pin',   label: 'Notas fijadas' },
            { id: 'recientes',  icon: 'clock', label: 'Actividad reciente' },
        ],

        _getNotes() {
            if (!Store.data.notasRapidas) Store.data.notasRapidas = [];
            return Store.data.notasRapidas;
        },

        _getNote(id) { return this._getNotes().find(n => n.id === id); },
        _save() { Store.save(); },
        _newId() { return 'nr_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); },

        _getFilteredNotes() {
            let n = this._getNotes().filter(x => !x.eliminado);
            if (this._activeFilter === 'fijadas') n = n.filter(x => x.fijado);
            if (this._activeContext !== 'todos') n = n.filter(x => x.contexto === this._activeContext);
            if (this._searchTerm) {
                const s = this._searchTerm.toLowerCase();
                n = n.filter(x => (x.titulo||'').toLowerCase().includes(s) || (x.contenido||'').toLowerCase().includes(s));
            }
            n.sort((a,b) => new Date(b.fechaEdicion||b.fecha) - new Date(a.fechaEdicion||a.fecha));
            return n;
        },

        render() {
            if (this._getNotes().length === 0) this._seedDemoNotes();
            
            return `
${this._css()}
<div id="nr-module-wrap" style="max-width: 1100px; margin: 0 auto; padding: 20px 20px 0;">
    ${this._getInnerHTML()}
</div>`;
        },

        _getInnerHTML() {
            const filtered = this._getFilteredNotes();
            if (!this._activeNoteId && filtered.length > 0) this._activeNoteId = filtered[0].id;

            return `
    <div class="a360-header">
        <div class="a360-header-left">
            <div class="a360-header-icon" style="background:var(--primary-dim); color:var(--primary);">
                <i data-lucide="notebook-pen"></i>
            </div>
            <div>
                <h2 class="a360-header-title">Bloc de Notas</h2>
                <p class="a360-header-subtitle">Anotaciones Temporales y Recordatorios</p>
            </div>
        </div>
        <button class="btn btn-primary" style="display:flex; align-items:center; gap:8px; border-radius:12px; font-weight:800; padding:10px 20px; background:var(--primary); border-color:var(--primary);" onclick="NR._createNewNote()">
            <i data-lucide="plus" style="width:18px;height:18px;"></i>
            <span>Nuevo Registro</span>
        </button>
    </div>
    <div class="nr-app-shell ${this._leftPanelOpen ? '' : 'collapsed'}" id="nr-shell" style="border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 10px 25px rgba(0,0,0,0.05); height:calc(100vh - 190px);">
      <aside class="nr-sidebar-left ${this._leftPanelOpen ? '' : 'collapsed'}">
        ${this._renderSidebarLeft(filtered)}
      </aside>
      <main class="nr-main-editor">
        ${this._renderEditorCol()}
      </main>
    </div>`;
        },

        _renderSidebarLeft(filtered) {
            return `
<div class="nr-sl-header">
    <div class="nr-sl-brand">
        <div class="nr-logo-mark">A3</div>
        <span>Registros</span>
    </div>
    <button class="nr-icon-btn" onclick="NR._toggleLeftPanel()">
        <i data-lucide="chevrons-left"></i>
    </button>
</div>
<div class="nr-sl-history">
    <div class="nr-nav-label">Historial de Notas</div>
    <div class="nr-history-list">
        ${filtered.length > 0 ? filtered.map(n => {
            const ctx = this.CONTEXTS[n.contexto] || this.CONTEXTS.general;
            return `
            <div class="nr-hist-item ${this._activeNoteId===n.id?'active':''}" onclick="NR._openNote('${n.id}')">
                <div class="nr-hist-dot" style="background:${ctx.color}"></div>
                <div class="nr-hist-text">
                    <div class="nr-hist-title">${n.titulo || 'Sin título'}</div>
                    <div class="nr-hist-meta">${new Date(n.fecha).toLocaleDateString()}</div>
                </div>
                <button class="nr-hist-delete" onclick="event.stopPropagation(); NR._eliminar('${n.id}')" title="Eliminar registro">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>`;
        }).join('') : '<div class="p-8 text-center text-xs opacity-40">Sin registros</div>'}
    </div>
</div>`;
        },

        _renderEditorCol() {
            const note = this._getNote(this._activeNoteId);

            return `
<div class="nr-editor-container">
    <header class="nr-tabs-bar">
        <div class="nr-tabs-scroll">
            ${Object.entries(this.CONTEXTS).map(([id, ctx]) => {
                const isActive = this._activeContext === id;
                const style = isActive 
                    ? `background: ${ctx.bg}; color: ${ctx.color}; border-color: ${ctx.color};` 
                    : `background: #f8fafc; color: #64748b; border-color: #e2e8f0;`;
                return `
                <button class="nr-tab-btn ${isActive ? 'active' : ''}" style="${style}" onclick="NR._setContextFilter('${id}')">
                    <i data-lucide="${ctx.icon}" style="color:${ctx.color}"></i> ${ctx.label}
                </button>`;
            }).join('')}
        </div>
    </header>

    ${this._activeContext === 'todos' && !this._getNote(this._activeNoteId) ? this._renderDashboard() : ''}

    ${note ? `
    <header class="nr-editor-header">
        <div class="nr-editor-top-bar">
            <div style="display:flex; align-items:center; gap:12px;">
                ${!this._leftPanelOpen ? `<button class="nr-panel-toggle" onclick="NR._toggleLeftPanel()" title="Mostrar Historial"><i data-lucide="panel-left"></i></button>` : ''}
                <div class="nr-breadcrumb">
                    <span>Registro Actual</span> <i data-lucide="chevron-right"></i> <span class="active">${this.CONTEXTS[note.contexto]?.label || 'Nota'}</span>
                </div>
            </div>
            <div class="nr-editor-actions" style="gap: 8px;">
                ${Store.data.cursos ? `
                <select class="nr-header-select hide-mobile" onchange="NR._setCurso(this.value)">
                    <option value="">Curso...</option>
                    ${Store.data.cursos.map(c => `<option value="${c.id}" ${note.cursoId===c.id?'selected':''}>${c.asignatura} - ${c.grado}º ${c.seccion ? `(${c.seccion})` : ''}</option>`).join('')}
                </select>
                <select class="nr-header-select hide-mobile" onchange="NR._linkStudent(this.value)" ${!note.cursoId ? 'disabled' : ''}>
                    <option value="">Estudiante...</option>
                    ${!note.cursoId ? '' : this._getAlumnosActuales().map(a => `<option value="${a.nombreCompleto}" ${note.alumno===a.nombreCompleto?'selected':''}>${a.nombreCompleto}</option>`).join('')}
                </select>
                ` : ''}
                <div class="nr-status-pill"><div class="nr-pulse"></div> Auto-guardado</div>
            </div>
        </div>
    </header>
    <div class="nr-editor-content-wrapper">
        <!-- Barra de Formato Rápido -->
        <div class="nr-editor-toolbar">
            <button class="nr-tb-btn" onclick="NR._cmd('bold')" title="Negrita"><i data-lucide="bold"></i></button>
            <button class="nr-tb-btn" onclick="NR._cmd('italic')" title="Cursiva"><i data-lucide="italic"></i></button>
            <div class="nr-tb-sep"></div>
            <button class="nr-tb-btn" onclick="NR._cmd('insertUnorderedList')" title="Lista Viñetas"><i data-lucide="list"></i></button>
            <button class="nr-tb-btn" onclick="NR._cmd('insertOrderedList')" title="Lista Numerada"><i data-lucide="list-ordered"></i></button>
            <button class="nr-tb-btn" onclick="NR._insertChecklist()" title="Lista de Tareas"><i data-lucide="check-square"></i></button>
            <div class="nr-tb-sep"></div>
            <button class="nr-tb-btn" onclick="NR._cmd('justifyLeft')" title="Izquierda"><i data-lucide="align-left"></i></button>
            <button class="nr-tb-btn" onclick="NR._cmd('justifyCenter')" title="Centro"><i data-lucide="align-center"></i></button>
            <div class="nr-tb-sep"></div>
            <button class="nr-tb-btn" onclick="NR._cmd('removeFormat')" title="Limpiar Formato"><i data-lucide="eraser"></i></button>
            <div class="nr-tb-sep"></div>
            <button class="nr-tb-btn camera" onclick="NR._takePhoto()" title="Tomar Foto"><i data-lucide="camera"></i></button>
            <div style="flex:1; min-width: 10px;"></div>
            
            <button class="nr-tb-btn-text tpl" onclick="NR._showTemplates()" title="Insertar Formato">
                <i data-lucide="clipboard-list"></i> <span class="hide-mobile">Formato</span>
            </button>

            <div class="nr-tb-sep"></div>
            <button class="nr-tb-btn" onclick="NR._duplicar('${note.id}')" title="Duplicar"><i data-lucide="copy"></i></button>
            <button class="nr-tb-btn danger" onclick="NR._eliminar('${note.id}')" title="Eliminar"><i data-lucide="trash-2" style="color:#ef4444;"></i></button>
        </div>

        <div class="nr-editor-canvas">
            <input type="text" class="nr-main-title" id="nr-title" placeholder="Título..." value="${note.titulo || ''}" oninput="NR._onInput()">
            <div class="nr-editor-body" id="nr-editor-body" contenteditable="true" oninput="NR._onInput()">${note.contenido || ''}</div>
        </div>
    </div>
    ` : this._renderEmptyState()}
</div>`;
        },

        _renderDashboard() {
            const notes = this._getNotes().filter(n => !n.eliminado);
            const stats = Object.keys(this.CONTEXTS).reduce((acc, key) => {
                acc[key] = notes.filter(n => n.contexto === key).length;
                return acc;
            }, {});

            return `
<div class="nr-dashboard" style="position:relative;">
    ${!this._leftPanelOpen ? `<button class="nr-panel-toggle" style="position:absolute; top:20px; left:20px; z-index:10;" onclick="NR._toggleLeftPanel()" title="Mostrar Historial"><i data-lucide="panel-left"></i></button>` : ''}
    <div class="nr-db-welcome">
        <h2>Panel de Gestión Académica</h2>
        <p>Resumen de registros y actividad reciente en todos los cursos</p>
    </div>
    
    <div class="nr-db-stats">
        <div class="nr-db-stat-main">
            <div class="val">${notes.length}</div>
            <div class="lab">Total Registros</div>
        </div>
        <div class="nr-db-stat-grid">
            ${Object.entries(this.CONTEXTS).map(([id, ctx]) => `
                <div class="nr-db-stat-card" style="border-left-color:${ctx.color}">
                    <div class="val">${stats[id] || 0}</div>
                    <div class="lab">${ctx.label}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="nr-db-recent">
        <h3>Actividad Reciente</h3>
        <div class="nr-db-recent-list">
            ${notes.slice(0, 5).map(n => `
                <div class="nr-db-recent-item" onclick="NR._openNote('${n.id}')">
                    <i data-lucide="${this.CONTEXTS[n.contexto]?.icon || 'file-text'}"></i>
                    <div class="info">
                        <strong>${n.titulo || 'Nota sin título'}</strong>
                        <span>${new Date(n.fecha).toLocaleDateString()}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</div>`;
        },

        _renderEmptyState() { 
            return `
<div class="nr-empty-state">
    ${!this._leftPanelOpen ? `<button class="nr-panel-toggle" style="position:absolute; top:20px; left:20px;" onclick="NR._toggleLeftPanel()"><i data-lucide="panel-left"></i> Historial</button>` : ''}
    <i data-lucide="sticky-note"></i>
    <p>Selecciona un registro</p>
</div>`; 
        },

        _createNewNote(optContext = null) {
            const id = this._newId();
            const now = new Date().toISOString();
            const ctx = optContext || this._activeContext || 'general';
            const realCtx = ctx === 'todos' ? 'general' : ctx;
            const ctxObj = this.CONTEXTS[realCtx];
            
            // Auto-collapse sidebars on new note creation for better tablet focus
            this._leftPanelOpen = false;
            this._rightPanelOpen = false;

            this._getNotes().unshift({ 
                id, 
                titulo: '', 
                contenido: ctxObj ? (ctxObj.template || '') : '', 
                contexto: realCtx, 
                fecha: now, 
                fechaEdicion: now, 
                eliminado: false 
            });
            this._activeNoteId = id;
            // Vincular automáticamente el curso activo global a la nueva nota
            const note = this._getNote(id);
            if(note) note.cursoId = Store.data.activeCourseId;
            this._save(); this._refreshAll();
        },

        _onInput() {
            const t = document.getElementById('nr-title')?.value;
            const b = document.getElementById('nr-editor-body');
            const c = b?.innerHTML;
            const note = this._getNote(this._activeNoteId);
            if(note) { 
                note.titulo = t; 
                note.contenido = c; 
                note.fechaEdicion = new Date().toISOString(); 
                this._save(); 

                // Inteligencia Interna: Análisis de Intención (Sin cambio visual)
                this._analyzeIntent(b?.innerText || '');
                
                // Automatización Detallada de Tablas Económicas
                this._autoCalculateAportaciones(b);
            }
        },

        _autoCalculateAportaciones(editor) {
            if(!editor) return;
            const montoGlobalEl = editor.querySelector('.nr-global-monto');
            const montoGlobal = parseFloat(montoGlobalEl?.innerText || 0);
            if(isNaN(montoGlobal) || montoGlobal <= 0) return;

            const rows = editor.querySelectorAll('.nr-editor-table tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if(cells.length < 3) return;

                const recibido = parseFloat(cells[1].innerText || 0);
                const statusCell = cells[2];

                if(!isNaN(recibido) && recibido > 0) {
                    if(recibido >= montoGlobal) {
                        statusCell.innerHTML = '<span style="color:#00C853; font-weight:800;">PAGADO ✓</span>';
                        statusCell.style.background = '#f0fdf4';
                    } else {
                        const saldo = (montoGlobal - recibido).toFixed(2);
                        statusCell.innerHTML = `<span style="color:#ef4444; font-weight:700;">Debe: L. ${saldo}</span>`;
                        statusCell.style.background = '#fff1f2';
                    }
                } else {
                    statusCell.innerHTML = '';
                    statusCell.style.background = 'transparent';
                }
            });
        },

        _analyzeIntent(text) {
            const note = this._getNote(this._activeNoteId);
            if(!note || text.length < 5) return;

            const lower = text.toLowerCase();
            let changed = false;

            // 1. Detección Automática de Alumno
            if(!note.alumno) {
                const alumnos = this._getAlumnosActuales();
                const detectado = alumnos.find(a => lower.includes(a.nombreCompleto.toLowerCase()));
                if(detectado) {
                    note.alumno = detectado.nombreCompleto;
                    if(!note.titulo) note.titulo = `Seguimiento: ${detectado.nombreCompleto}`;
                    changed = true;
                    UI.toast(`Alumno vinculado: ${detectado.nombreCompleto}`, 'info');
                }
            }

            // 2. Detección Automática de Contexto
            if(note.contexto === 'general') {
                const map = {
                    'clase': ['clase', 'lección', 'tema', 'pizarra'],
                    'seguimiento': ['conducta', 'observación', 'atención', 'incidente'],
                    'reunion': ['reunión', 'padre', 'acta', 'acuerdo'],
                    'planificacion': ['plan', 'unidad', 'jornalización']
                };
                for(let [ctx, keys] of Object.entries(map)) {
                    if(keys.some(k => lower.includes(k))) {
                        note.contexto = ctx;
                        changed = true;
                        break;
                    }
                }
            }

            // 3. Detección de Intención de Tabla
            if(lower.includes('tabla') || lower.includes('lista alumnos')) {
                if(lower.includes('aportaciones')) this._applyTemplate('aportaciones');
                else if(lower.includes('prestamos')) this._applyTemplate('prestamos');
                else if(lower.includes('actividades')) this._applyTemplate('actividades');
            }

            if(changed) this._refreshAll();
        },

        _setQuickMode(val) {
            // Ya no se usa visualmente, mantenemos por compatibilidad interna de triggers
            this._quickMode = val;
        },

        _changeContext(ctxId) {
            const note = this._getNote(this._activeNoteId);
            if(note) { note.contexto = ctxId; this._save(); this._refreshAll(); }
        },

        _setSub(sub) {
            const note = this._getNote(this._activeNoteId);
            if(note) { note.subcontexto = sub; this._save(); this._refreshAll(); }
        },

        _setCurso(cid) {
            const note = this._getNote(this._activeNoteId);
            if(note) { 
                note.cursoId = cid; 
                this._save(); 
                this._refreshAll(); // REFRESH crucial para actualizar lista de alumnos vinculada
            }
        },

        _linkStudent(name) {
            const note = this._getNote(this._activeNoteId);
            if(note) {
                note.alumno = name;
                if(name && !note.titulo) {
                    note.titulo = `Seguimiento: ${name}`;
                }
                this._save(); this._refreshAll();
            }
        },

        _getAlumnosActuales() {
            // Prioridad: Curso vinculado a la nota unicamente para evitar data fantasma
            const currId = this._getNote(this._activeNoteId)?.cursoId;
            
            if(!currId) return []; // Si no hay curso en la nota, no hay lista de alumnos
            
            // Usar helper oficial para obtener matrícula 100% exacta
            return Store.getStudentsByCourse(currId) || [];
        },

        _setFilter(f) { this._activeFilter = f; this._refreshAll(); },
        _setContextFilter(c) { 
            this._activeFilter = 'todas';
            this._activeContext = c; 
            
            // Auto-collapse sidebars to focus on active note
            this._leftPanelOpen = false;
            this._rightPanelOpen = false;
            
            const filtered = this._getFilteredNotes();
            if (filtered.length > 0) {
                this._activeNoteId = filtered[0].id;
                this._refreshAll(); 
            } else {
                // If completely empty, auto-create a note for this context!
                // This prevents the user from being stuck with a closed sidebar and an empty state.
                this._createNewNote(c);
            }
        },
        _openNote(id) { 
            this._activeNoteId = id; 
            this._refreshAll(); 
        },
        _toggleLeftPanel() { this._leftPanelOpen = !this._leftPanelOpen; this._refreshAll(); },
        _toggleRightPanel() { this._rightPanelOpen = !this._rightPanelOpen; this._refreshAll(); },
        _syncNote() { UI.toast('Sincronizado correctamente ✓'); },

        _takePhoto() {
            UI.modal('Capturar Evidencia', `
                <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
                    <video id="nr-video" autoplay playsinline style="width:100%; border-radius:12px; background:#000; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);"></video>
                    <canvas id="nr-canvas" style="display:none;"></canvas>
                    <div style="display:flex; gap:12px;">
                        <button class="nr-btn-primary" onclick="NR._captureFrame()"><i data-lucide="camera"></i> Capturar</button>
                        <button class="nr-footer-btn" onclick="UI.closeModal()">Cancelar</button>
                    </div>
                </div>
            `, null);

            if(window.lucide) window.lucide.createIcons();

            const video = document.getElementById('nr-video');
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => { 
                    video.srcObject = stream;
                    this._cameraStream = stream;
                })
                .catch(err => {
                    UI.toast('No se pudo acceder a la cámara', 'error');
                    UI.closeModal();
                });
        },

        _captureFrame() {
            const video = document.getElementById('nr-video');
            const canvas = document.getElementById('nr-canvas');
            if(!video || !canvas) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            const dataUrl = canvas.toDataURL('image/jpeg');
            this._insertImageInEditor(dataUrl);

            // Detener cámara
            if(this._cameraStream) {
                this._cameraStream.getTracks().forEach(t => t.stop());
            }
            UI.closeModal();
        },

        _insertImageInEditor(src) {
            const editor = document.getElementById('nr-editor-body');
            if(!editor) return;
            editor.focus();
            const imgHtml = `<img src="${src}" style="max-width:100%; border-radius:12px; margin:20px 0; box-shadow:0 4px 6px rgba(0,0,0,0.1);">`;
            document.execCommand('insertHTML', false, imgHtml);
            this._onInput();
        },

        _cmd(name, val=null) {
            document.execCommand(name, false, val);
            document.getElementById('nr-editor-body')?.focus();
            this._onInput();
        },

        _insertChecklist() {
            const editor = document.getElementById('nr-editor-body');
            if(!editor) return;
            editor.focus();
            const html = `<div><input type="checkbox" style="margin-right:8px;"> Nueva Tarea</div>`;
            document.execCommand('insertHTML', false, html);
            this._onInput();
        },

        _eliminar(id) {
            UI.confirm('¿Deseas eliminar este registro?', () => {
                const n = this._getNote(id); if(n) n.eliminado = true; this._save();
                if(this._activeNoteId === id) this._activeNoteId = null;
                this._refreshAll();
                UI.toast('Registro eliminado', 'info');
            });
        },
        _duplicar(id) {
            const n = this._getNote(id); if(!n) return;
            const copy = { ...n, id: this._newId(), titulo: n.titulo + ' (copia)', fecha: new Date().toISOString() };
            this._getNotes().unshift(copy); this._save(); this._openNote(copy.id);
        },

        _aiOptimize() {
            const el = document.getElementById('nr-editor-body');
            if(!el) return;
            UI.toast('Analizando...', 'info');
            setTimeout(() => { el.innerHTML = el.innerHTML.replace(/acuerdo/gi, '<strong>🤝 ACUERDO:</strong>'); this._onInput(); UI.toast('Optimizado'); }, 600);
        },

        _showTemplates() {
            const items = Object.entries(this.TEMPLATES).map(([id, t]) => `
                <div class="nr-tpl-item" onclick="NR._applyTemplate('${id}')">
                    <div class="nr-tpl-icon"><i data-lucide="${t.icon}"></i></div>
                    <div class="nr-tpl-info">
                        <div class="nr-tpl-label">${t.label}</div>
                        <div class="nr-tpl-desc">${t.table ? 'Genera tabla con alumnos' : 'Formato de texto'}</div>
                    </div>
                </div>
            `).join('');

            UI.modal('Insertar Formato Especial', `
                <style>
                    .nr-tpl-item { display:flex; align-items:center; gap:12px; padding:12px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:8px; cursor:pointer; cursor:pointer; transition:0.2s; }
                    .nr-tpl-item:hover { border-color:#00C853; background:#f0fdf9; }
                    .nr-tpl-icon { width:32px; height:32px; border-radius:8px; background:#f1f5f9; display:grid; place-items:center; color:#00C853; }
                    .nr-tpl-label { font-size:13px; font-weight:700; color:#0f172a; }
                    .nr-tpl-desc { font-size:11px; color:#94a3b8; }
                </style>
                <div class="p-2">${items}</div>
            `, null);
            if(window.lucide) window.lucide.createIcons();
        },

        _applyTemplate(id) {
            const tpl = this.TEMPLATES[id];
            const note = this._getNote(this._activeNoteId);
            if(!note || !tpl) return;

            // Si es una tabla de alumnos y no hay curso seleccionado, pedir uno primero
            if(tpl.table && !note.cursoId) {
                const courses = Store.get('cursos');
                if(courses.length > 0) {
                    const options = courses.map(c => `<option value="${c.id}">${c.asignatura} - ${c.grado}º</option>`).join('');
                    UI.modal('Seleccionar Curso para la Tabla', `
                        <p class="mb-4 text-sm text-slate-500">Este formato requiere una lista de alumnos. Selecciona un curso para cargar la matrícula completa:</p>
                        <select id="nr-tmp-course" class="nr-prop-select">${options}</select>
                        <button class="btn btn-primary w-100 mt-4" onclick="NR._setAndGenerate('${id}', document.getElementById('nr-tmp-course').value)">Generar Tabla</button>
                    `);
                    return;
                }
            }

            this._processTemplateInjection(id);
        },

        _setAndGenerate(tplId, cursoId) {
            const note = this._getNote(this._activeNoteId);
            if(note) {
                note.cursoId = cursoId;
                this._save();
                UI.closeModal();
                this._processTemplateInjection(tplId);
                this._refreshAll();
            }
        },

        _processTemplateInjection(id) {
            const tpl = this.TEMPLATES[id];
            const note = this._getNote(this._activeNoteId);
            let content = tpl.content || '';
            
            if(tpl.table) {
                const alumnos = this._getAlumnosActuales();
                let tableHtml = `<h2 style="color:#0f172a; margin-bottom:15px; text-align:center;">${tpl.label}</h2>`;
                
                // Agregar encabezado especial si existe (para Concepto y Monto Global)
                if(tpl.headerHtml) tableHtml += tpl.headerHtml;
                else tableHtml += `<p style="color:#64748b; font-size:13px; text-align:center;">${tpl.table.body}</p>`;

                tableHtml += `<table class="nr-editor-table"><thead><tr>`;
                tpl.table.columns.forEach(col => { tableHtml += `<th>${col}</th>`; });
                tableHtml += `</tr></thead><tbody>`;
                
                if(alumnos.length > 0) {
                    alumnos.forEach(al => {
                        tableHtml += `<tr><td>${al.nombreCompleto || 'Estudiante'}</td>${Array(tpl.table.columns.length-1).fill('<td></td>').join('')}</tr>`;
                    });
                } else {
                    tableHtml += `<tr><td colspan="${tpl.table.columns.length}" style="color:#f43f5e; text-align:center; padding:20px;">⚠ No hay alumnos registrados en este curso</td></tr>`;
                }
                
                tableHtml += `</tbody></table><br><p></p>`;
                content = tableHtml;
            }

            const el = document.getElementById('nr-editor-body');
            if(el) {
                el.innerHTML = content;
                if(!note.titulo) note.titulo = tpl.label;
                
                // Auto-collapse sidebars when inserting format
                this._leftPanelOpen = false;
                this._rightPanelOpen = false;
                
                this._onInput();
                UI.closeModal(); // CERRAR MODAL al aplicar
                UI.toast('Formato cargado correctamente ✓');
                this._refreshAll(); // Refrescar para aplicar collapse
            }
        },

        _seedDemoNotes() {
            const now = new Date();
            const demos = [{ titulo: 'Nota Demo', contenido: 'Contenido...', contexto: 'general' }];
            demos.forEach(d => {
                const f = now.toISOString();
                this._getNotes().push({ id: this._newId(), fecha: f, fechaEdicion: f, eliminado: false, ...d });
            });
            this._save();
        },

        _refreshAll() { 
            const wrap = document.getElementById('nr-module-wrap'); 
            if (wrap) { 
                wrap.innerHTML = this._getInnerHTML(); 
                if (window.lucide) window.lucide.createIcons(); 
            } else {
                const shell = document.getElementById('nr-shell');
                if (shell) {
                    shell.outerHTML = this.render();
                    if (window.lucide) window.lucide.createIcons(); 
                }
            }
        },

        _css() { return `
<style>
.nr-app-shell { display: flex; height: calc(100vh - 60px); background: #fff; font-family: 'Inter', sans-serif; overflow: hidden; }
.nr-sidebar-left { width: 260px; background: #f8fafc; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; transition: 0.3s; }
.nr-sidebar-left.collapsed { margin-left: -260px; }
.nr-sl-header { padding: 16px; display: flex; align-items: center; justify-content: space-between; }
.nr-sl-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; color: #0f172a; font-size: 14px; }
.nr-logo-mark { background: #00C853; color: #fff; width: 24px; height: 24px; border-radius: 6px; display: grid; place-items: center; font-size: 10px; }
.nr-sl-actions { padding: 0 16px 16px; }
.nr-btn-primary { width: 100%; height: 38px; background: #00C853; color: #fff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
.nr-sl-nav { padding: 8px; flex: 1; overflow-y: auto; }
.nr-nav-group { margin-bottom: 24px; }
.nr-nav-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; padding: 0 12px 8px; letter-spacing: 0.05em; }
.nr-nav-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: none; background: none; border-radius: 8px; cursor: pointer; color: #475569; font-size: 13.5px; text-align: left; transition: 0.2s; }
.nr-nav-item:hover { background: #e2e8f0; }
.nr-nav-item.active { background: #fff; color: #00C853; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.nr-sl-history { border-top: 1px solid #e2e8f0; padding: 16px 8px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
.nr-hist-item { padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 2px; position: relative; }
.nr-hist-item:hover { background: #e2e8f0; }
.nr-hist-item.active { background: #fff; color: #00C853; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.nr-hist-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.nr-hist-text { flex: 1; min-width: 0; }
.nr-hist-title { font-size: 12.5px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nr-hist-meta { font-size: 10px; color: #94a3b8; }
.nr-hist-delete { 
    width: 24px; height: 24px; border-radius: 4px; border: none; background: transparent; 
    display: flex; align-items: center; justify-content: center; color: #94a3b8; opacity: 0; transition: 0.2s;
}
.nr-hist-delete:hover { background: #fee2e2; color: #ef4444; }
.nr-hist-delete i { width: 12px; height: 12px; }
.nr-hist-item:hover .nr-hist-delete { opacity: 1; }

.nr-main-editor { flex: 1; display: flex; flex-direction: column; background: #fff; overflow: hidden; }
.nr-editor-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* TABS SUPERIORES */
.nr-tabs-bar { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 12px 12px 0; }
.nr-tabs-scroll { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.nr-tab-btn { 
    display: flex; align-items: center; gap: 8px; white-space: nowrap; padding: 8px 14px; 
    border: 1px solid #e2e8f0; border-radius: 10px; 
    background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 8px;
}
.nr-tab-btn i { width: 14px; height: 14px; }
.nr-tab-btn:hover { background: #fff; color: #0f172a; border-color: #cbd5e1; box-shadow: 0 4px 10px rgba(0,0,0,0.06); }
.nr-tab-btn.active { border-width: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.nr-tabs-divider { width: 1px; height: 16px; background: #e2e8f0; margin: 0 4px; }

.nr-editor-header { height: 52px; border-bottom: 1px solid #e2e8f0; padding: 0 24px; display: flex; align-items: center; background: #fff; }
.nr-editor-top-bar { width: 100%; display: flex; align-items: center; justify-content: space-between; }
.nr-breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; font-weight: 600; }
.nr-editor-actions { display: flex; align-items: center; gap: 12px; }
.nr-header-select { max-width: 140px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; font-weight: 600; color: #475569; background: #fff; outline: none; transition: 0.2s; }
.nr-header-select:hover { border-color: #00C853; }
.nr-status-pill { font-size: 11px; font-weight: 700; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
.nr-pulse { width: 6px; height: 6px; background: #00C853; border-radius: 50%; animation: pulse 2s infinite; }

.nr-panel-toggle { 
    width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0; 
    background: #fff; color: #64748b; display: grid; place-items: center; cursor: pointer; transition: 0.2s;
}
.nr-panel-toggle:hover { background: #f1f5f9; color: #00C853; border-color: #00C853; }
.nr-panel-toggle i { width: 16px; height: 16px; }

/* TOOLBAR */
.nr-editor-toolbar { 
    max-width: 800px; margin: 0 auto 20px; padding: 4px 12px; 
    display: flex; align-items: center; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid #f1f5f9; 
    background: #fff; position: sticky; top: -40px; z-index: 10;
}
.nr-tb-btn { 
    width: 28px; height: 28px; border-radius: 4px; border: none; background: transparent; 
    display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s;
}
.nr-tb-btn:hover { background: #f1f5f9; color: #00C853; }
.nr-tb-btn.camera { background: #E8F8EF; color: #00C853; border: 1px solid #00C853; }
.nr-tb-btn.camera:hover { background: #00C853; color: #fff; }
.nr-tb-btn i { width: 14px; height: 14px; }
.nr-tb-sep { width: 1px; height: 16px; background: #e2e8f0; margin: 0 4px; }

.nr-tb-btn-text {
    padding: 0 8px; height: 28px; border-radius: 4px; border: none; background: transparent; 
    display: flex; align-items: center; justify-content: center; gap: 4px; color: #64748b; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s;
}
.nr-tb-btn-text:hover { background: #f1f5f9; color: #0f172a; }
.nr-tb-btn-text.tpl { color: #00C853; background: rgba(0, 200, 83, 0.08); border: 1px solid rgba(0, 200, 83, 0.3); }
.nr-tb-btn-text.tpl:hover { background: rgba(0, 200, 83, 0.15); border-color: #00C853; box-shadow: 0 4px 12px rgba(0, 200, 83, 0.1); }
.nr-tb-btn-text.ai { color: #6366f1; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.3); }
.nr-tb-btn-text.ai:hover { background: rgba(99, 102, 241, 0.15); border-color: #6366f1; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1); }
.nr-tb-btn-text i { width: 14px; height: 14px; }
@media (max-width: 600px) { .hide-mobile { display: none; } }

.nr-editor-content-wrapper { flex: 1; overflow-y: auto; padding: 20px 0; }
.nr-editor-canvas { max-width: 800px; margin: 0 auto; padding: 0 40px; }
.nr-main-title { width: 100%; font-size: 32px; font-weight: 800; color: #0f172a; border: none; outline: none; margin-bottom: 24px; }
.nr-editor-body { width: 100%; min-height: 500px; font-size: 16px; line-height: 1.8; color: #475569; outline: none; }

/* DASHBOARD */
.nr-dashboard { padding: 40px; max-width: 1000px; margin: 0 auto; width: 100%; overflow-y: auto; }
.nr-db-welcome h2 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.nr-db-welcome p { color: #64748b; margin-bottom: 40px; }
.nr-db-stats { display: flex; gap: 24px; margin-bottom: 40px; }
.nr-db-stat-main { background: #0f172a; color: #fff; padding: 30px; border-radius: 20px; min-width: 200px; display: flex; flex-direction: column; justify-content: center; }
.nr-db-stat-main .val { font-size: 48px; font-weight: 800; }
.nr-db-stat-main .lab { opacity: 0.6; font-size: 13px; font-weight: 700; text-transform: uppercase; }
.nr-db-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; flex: 1; }
.nr-db-stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #cbd5e1; padding: 20px; border-radius: 12px; }
.nr-db-stat-card .val { font-size: 20px; font-weight: 800; color: #0f172a; }
.nr-db-stat-card .lab { font-size: 11px; font-weight: 700; color: #64748b; }
.nr-db-recent h3 { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }
.nr-db-recent-list { display: flex; flex-direction: column; gap: 8px; }
.nr-db-recent-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; cursor: pointer; transition: 0.2s; }
.nr-db-recent-item:hover { background: #f1f5f9; border-color: #00C853; }
.nr-db-recent-item i { color: #00C853; width: 20px; height: 20px; }
.nr-db-recent-item .info { display: flex; flex-direction: column; }
.nr-db-recent-item .info strong { font-size: 14px; color: #1e293b; }
.nr-db-recent-item .info span { font-size: 11px; color: #94a3b8; }

.nr-editor-footer { height: 52px; border-top: 1px solid #e2e8f0; padding: 0 24px; display: flex; align-items: center; gap: 12px; }
.nr-footer-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
.nr-footer-btn.ai { border-color: #6366f1; color: #6366f1; background: #f5f3ff; }
.nr-footer-btn.danger { color: #ef4444; }

.nr-sidebar-right { width: 280px; background: #f8fafc; border-left: 1px solid #e2e8f0; transition: 0.3s; display: flex; flex-direction: column; overflow: hidden; }
.nr-sidebar-right.collapsed { margin-right: -280px; }
.nr-sr-header { height: 52px; border-bottom: 1px solid #e2e8f0; padding: 0 20px; display: flex; align-items: center; font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; flex-shrink: 0; }
.nr-sr-scroll { padding: 20px; padding-bottom: 100px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.nr-prop-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.nr-prop-label { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; display: block; }
.nr-ctx-pill-large { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 700; margin-bottom: 12px; }
.nr-ctx-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.nr-ctx-selector-btn { height: 36px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: grid; place-items: center; color: #94a3b8; }
.nr-ctx-selector-btn.active { background: #00C853; color: #fff; }
.nr-prop-row { display: flex; align-items: center; gap: 10px; }
.nr-prop-select { flex: 1; padding: 6px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; outline: none; }
.nr-sub-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.nr-sub-chip { padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; background: #fff; font-size: 11px; font-weight: 700; cursor: pointer; }
.nr-sub-chip.active { background: #0f172a; color: #fff; }
.nr-btn-sync { width: 100%; height: 38px; background: #E8F8EF; border: 1px solid #00C853; border-radius: 8px; color: #00C853; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.nr-btn-sync:hover { background: #00C853; color: #fff; box-shadow: 0 4px 6px rgba(0,200,83,0.2); }

.nr-icon-btn { width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; cursor: pointer; display: grid; place-items: center; color: #94a3b8; }

.nr-footer-btn.tpl { border-color: #00C853; color: #00C853; background: #E8F8EF; }

.nr-editor-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; border: 1px solid #e2e8f0; }
.nr-editor-table th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center; color: #0f172a; font-weight: 800; text-transform: uppercase; }
.nr-editor-table td { border: 1px solid #e2e8f0; padding: 8px 10px; color: #475569; }
.nr-editor-table tr:nth-child(even) { background: #fdfdfd; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

/* TABLET & MOBILE OVERLAY DRAWERS */
@media (max-width: 1024px) {
    .nr-app-shell { position: relative; }
    
    /* LEFT DRAWER WITH BACKDROP */
    .nr-sidebar-left { position: absolute; z-index: 100; height: 100%; top: 0; left: 0; box-shadow: 0 0 0 100vw rgba(15,23,42,0.4), 4px 0 15px rgba(0,0,0,0.1); }
    .nr-sidebar-left.collapsed { left: -260px; margin-left: 0; box-shadow: none; pointer-events: none; }
    
    .nr-editor-canvas { padding: 0 15px; }
    .nr-tabs-bar { overflow-x: auto; padding-right: 20px; }
    .nr-tabs-scroll { width: max-content; }
    /* Ajustes específicos para el Toolbar */
    .nr-editor-toolbar { top: 0; padding: 8px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    /* Mejorar wrapping de Dashboard en split-screen */
    .nr-db-stats { flex-direction: column; }
    .nr-db-stat-grid { grid-template-columns: 1fr 1fr; }
}
</style>`; }
    };
    
    window.NR = NR;
    Views.NotasRapidas = NR;
})();
