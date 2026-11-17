Views.Formalizacion = {
    screen: 'home',   // 'home' | 'matrix'
    _parcialId: null,
    _subjectId: null,
    _grade: null,
    _term: null,

    // ---- helpers ------------------------------------------------
    bcLessons() { return Store.data.bcLessons || []; },

    parciales() {
        return (Store.get('parciales') || []).filter(p =>
            !p.cursoId || p.cursoId === Store.getActiveCourse()?.id
        );
    },

    termForParcial(parcial) {
        // heuristic: match by name P1..P4
        if (!parcial) return '';
        const n = parcial.nombre || '';
        const m = n.match(/P([1-4])/i);
        return m ? 'P' + m[1] : '';
    },

    subjectMap() {
        return { MAT: 'Matem\u00e1ticas', ESP: 'Espa\u00f1ol', ING: 'Ingl\u00e9s', CN: 'Ciencias Naturales', SS: 'Estudios Sociales' };
    },

    subjectIdForCourse(course) {
        const a = (course?.asignatura || '').toLowerCase();
        if (a.includes('mat')) return 'MAT';
        if (a.includes('esp') || a.includes('spa')) return 'ESP';
        if (a.includes('ing') || a.includes('engl')) return 'ING';
        if (a.includes('cien') || a.includes('nat')) return 'CN';
        if (a.includes('soc') || a.includes('hist')) return 'SS';
        return '';
    },

    gradeForCourse(course) {
        const g = String(course?.grado || '');
        const m = g.match(/([789])/);
        return m ? m[1] : '';
    },

    // ---- render entry point ------------------------------------
    render() {
        if (this.screen === 'matrix') return this.renderMatrix();
        return this.renderHome();
    },

    // ================================================================
    // HOME: selector de parcial + opciones de asignatura/grado/parcial BC
    // ================================================================
    renderHome() {
        const course = Store.getActiveCourse();
        const parciales = this.parciales();

        // Auto-detect from active course
        const autoSubjectId = course ? this.subjectIdForCourse(course) : (this._subjectId || '');
        const autoGrade = course ? this.gradeForCourse(course) : (this._grade || '');
        const subMap = this.subjectMap();

        const parcialesOpts = parciales.map(p =>
            `<option value="${p.id}" ${this._parcialId === p.id ? 'selected' : ''}>${p.nombre}</option>`
        ).join('');

        const SUBJECTS = Object.entries(subMap).map(([id, name]) =>
            `<option value="${id}" ${(this._subjectId || autoSubjectId) === id ? 'selected' : ''}>${name}</option>`
        ).join('');
        const GRADES = ['7', '8', '9'].map(g =>
            `<option value="${g}" ${(this._grade || autoGrade) === g ? 'selected' : ''}>Grado ${g}°</option>`
        ).join('');
        const TERMS = ['P1', 'P2', 'P3', 'P4'].map(t =>
            `<option value="${t}" ${this._term === t ? 'selected' : ''}>${t}</option>`
        ).join('');

        // Count matching lessons
        const sid = this._subjectId || autoSubjectId;
        const grade = this._grade || autoGrade;
        const term = this._term || '';
        const matching = this.bcLessons().filter(l =>
            (!sid || l.subjectId === sid) &&
            (!grade || l.grade === grade) &&
            (!term || l.term === term)
        ).length;

        return `
                <div class="space-y-5">
                    <!-- header -->
                    <div class="card p-5 border-l-4 border-teal-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 class="text-xl font-black text-main flex items-center gap-2">
                                <i data-lucide="file-text" class="w-6 h-6 text-teal-500"></i>
                                Jornalización desde Banco Curricular
                            </h2>
                            <p class="text-xs text-muted mt-1">Genera la matriz oficial de jornalización usando los contenidos del Banco Curricular — editable e imprimible.</p>
                        </div>
                        <button class="btn btn-secondary text-xs" onclick="Router.navigate('banco-curricular')">
                            <i data-lucide="database" class="w-4 h-4 text-violet-500"></i> Gestionar Banco Curricular
                        </button>
                    </div>

                    <!-- config card -->
                    <div class="card p-6 space-y-5">
                        <h3 class="font-bold text-sm uppercase tracking-wider text-muted">Configuración de la Jornalización</h3>

                        ${!course ? `<div class="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-sm text-amber-800">
                            <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-500 flex-shrink-0"></i>
                            Selecciona un curso activo para que los campos se auto-detecten.
                        </div>` : `<div class="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-3 text-sm text-teal-800">
                            <i data-lucide="check-circle" class="w-5 h-5 text-teal-500 flex-shrink-0"></i>
                            Curso activo: <b>${course.asignatura} — Grado ${course.grado}° â€¢ Sección ${course.seccion}</b>
                        </div>`}

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Parcial del Curso</label>
                                <select id="form-parcial" class="form-control" onchange="Views.Formalizacion._parcialId=this.value; const p=Views.Formalizacion.parciales().find(x=>x.id===this.value); const t=Views.Formalizacion.termForParcial(p); Views.Formalizacion._term=t||Views.Formalizacion._term; document.getElementById('form-term').value=Views.Formalizacion._term;">
                                    <option value="">-- Seleccione Parcial --</option>
                                    ${parcialesOpts}
                                </select>
                                ${parciales.length === 0 ? `<p class="text-xs text-amber-600 mt-1">âš  No hay parciales configurados. Ve a <b>Conf. Académica</b>.</p>` : ''}
                            </div>

                            <div class="form-group">
                                <label class="form-label">Término BC (Parcial en el Banco)</label>
                                <select id="form-term" class="form-control" onchange="Views.Formalizacion._term=this.value">
                                    <option value="">-- Seleccione --</option>
                                    ${TERMS}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Asignatura (Banco Curricular)</label>
                                <select id="form-subject" class="form-control" onchange="Views.Formalizacion._subjectId=this.value">
                                    <option value="">-- Seleccione --</option>
                                    ${SUBJECTS}
                                </select>
                                ${course && !autoSubjectId ? `<p class="text-xs text-amber-600 mt-1">âš  No pudo detectarse la asignatura automáticamente.</p>` : ''}
                            </div>

                            <div class="form-group">
                                <label class="form-label">Grado</label>
                                <select id="form-grade" class="form-control" onchange="Views.Formalizacion._grade=this.value">
                                    <option value="">-- Seleccione --</option>
                                    ${GRADES}
                                </select>
                            </div>
                        </div>

                        <!-- BC status badge -->
                        <div class="flex items-center gap-3 p-3 rounded-xl ${matching> 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}">
                            <i data-lucide="${matching> 0 ? 'database' : 'alert-circle'}" class="w-5 h-5 ${matching > 0 ? 'text-emerald-500' : 'text-red-400'} flex-shrink-0"></i>
                            <span class="text-sm ${matching> 0 ? 'text-emerald-700' : 'text-red-600'}">
                                ${matching > 0
                ? `<b>${matching} lección(es)</b> encontrada(s) en el Banco Curricular para este filtro.`
                : `No hay lecciones en el Banco Curricular con ese filtro. <a href="#" onclick="Router.navigate('banco-curricular');return false;" class="underline font-semibold">Importar ahora</a>.`
            }
                            </span>
                        </div>

                        <div class="flex justify-end gap-3 pt-2 border-t border-soft">
                            <button class="btn btn-secondary" onclick="Views.Formalizacion._generateEmpty()">
                                <i data-lucide="table" class="w-4 h-4"></i> Matriz en blanco
                            </button>
                            <button class="btn btn-primary" onclick="Views.Formalizacion._generateFromBC()">
                                <i data-lucide="wand-2" class="w-4 h-4"></i> Generar desde Banco Curricular
                            </button>
                        </div>
                    </div>

                    <!-- quick guide -->
                    <div class="card p-5 bg-slate-50/60 border border-dashed border-slate-300">
                        <h4 class="font-semibold text-sm mb-3 flex items-center gap-2"><i data-lucide="info" class="w-4 h-4 text-blue-400"></i> ¿Cómo funciona?</h4>
                        <ol class="text-xs text-muted space-y-1.5 list-decimal list-inside">
                            <li>Selecciona el <b>Parcial del curso</b> y el <b>Término BC</b> correspondiente (ej. P1).</li>
                            <li>Selecciona el <b>Campo del Conocimiento</b> y el <b>Grado</b> para buscar en el Banco Curricular.</li>
                            <li>Presiona <b>Generar desde Banco Curricular</b> para crear la matriz prellenada con estándares y contenidos reales.</li>
                            <li>Edita las celdas directamente, agrega filas y <b>Guarda / Imprime</b>.</li>
                            <li>Si el banco está vacío usa <b>Matriz en blanco</b> y llena manualmente.</li>
                        </ol>
                    </div>
                </div>`;
    },

    // ================================================================
    // Generar desde Banco Curricular
    // ================================================================
    _generateFromBC() {
        const sid = document.getElementById('form-subject')?.value || this._subjectId || '';
        const grade = document.getElementById('form-grade')?.value || this._grade || '';
        const term = document.getElementById('form-term')?.value || this._term || '';

        this._subjectId = sid;
        this._grade = grade;
        this._term = term;
        this._parcialId = document.getElementById('form-parcial')?.value || this._parcialId;

        if (!sid || !grade || !term) {
            UI.toast('Selecciona Asignatura, Grado y Término BC.', 'error'); return;
        }

        const lessons = this.bcLessons().filter(l =>
            l.subjectId === sid && l.grade === grade && l.term === term
        );

        if (lessons.length === 0) {
            if (!confirm('No hay lecciones en el BC para ese filtro.\n\u00bfDeseas abrir una matriz en blanco?')) return;
            this._rows = [];
        } else {
            // ============================================================
            // Formato JL 2026: 3 filas por lección (Oral | Lectura | Escritura)
            // Usa campos pre-organizados del JSON si existen, sino fallback
            // Sesiones: 1-2 (H/C:2) | 3-4 (H/C:2) | 5 (H/C:1)
            // ============================================================
            this._rows = [];

            lessons.forEach((l, lessonIdx) => {
                const standards = l.standards || [];
                const contents = l.contents || [];

                // â”€â”€ Usar campos por bloque si el JSON los tiene â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                let sOral = l.standardsOral || l.standards || null;
                let sLect = l.standardsLect || l.standards || null;
                let sEscr = l.standardsEscr || l.standards || null;
                let cOral = l.contentsOral || l.contents || null;
                let cLect = l.contentsLect || l.contents || null;
                let cEscr = l.contentsEscr || l.contents || null;
                // Support both expectativasOral and expectationsOral
                let eOral = l.expectativasOral || l.expectationsOral || null;
                let eLect = l.expectativasLect || l.expectationsLect || null;
                let eEscr = l.expectativasEscr || l.expectationsEscr || null;

                // â”€â”€ Fallback: detectar por palabras clave â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                if (sOral === l.standards) {
                    const kO = ['oral', 'expresan', 'crean e inter', 'habilidades en el uso', 'intercambio', 'discurso', 'asamblea', 'foro'];
                    const kL = ['leen', 'comprensión', 'comprend', 'interpretan', 'reconocen', 'textos literarios', 'textos inform', 'fluidamente'];
                    const tag = s => { const sl = s.toLowerCase(); return kO.some(k => sl.includes(k)) ? 'o' : kL.some(k => sl.includes(k)) ? 'l' : 'e'; };
                    sOral = standards.filter(s => tag(s) === 'o'); sLect = standards.filter(s => tag(s) === 'l'); sEscr = standards.filter(s => tag(s) === 'e');
                    if (!sOral.length && !sLect.length && !sEscr.length) {
                        const t = Math.ceil(standards.length / 3);
                        sOral = standards.slice(0, t); sLect = standards.slice(t, t * 2); sEscr = standards.slice(t * 2);
                    } else if (!sOral.length) sOral = [sLect.shift() || ''];
                    else if (!sLect.length) sLect = [sEscr.shift() || ''];
                    const kCO = c => { const cl = c.toLowerCase(); return cl.includes('oral') || cl.includes('intercambio') || cl.includes('tipos de texto') || cl.includes('discurso'); };
                    const kCL = c => { const cl = c.toLowerCase(); return cl.includes('comprensión') || cl.includes('vocabulario') || cl.includes('lectura') || cl.includes('polisemia'); };
                    cOral = contents.filter(kCO); cLect = contents.filter(kCL); cEscr = contents.filter(c => !kCO(c) && !kCL(c));
                    if (!cOral.length && !cLect.length && !cEscr.length) {
                        const t = Math.ceil(contents.length / 3); cOral = contents.slice(0, t); cLect = contents.slice(t, t * 2); cEscr = contents.slice(t * 2);
                    }
                }

                // Fallback para expectativas
                if (!eOral && !eLect && !eEscr) {
                    let allE = l.expectativas || l.expectations || [];
                    if (!Array.isArray(allE)) allE = [allE];
                    const t = Math.ceil(allE.length / 3);
                    eOral = allE.slice(0, t);
                    eLect = allE.slice(t, t * 2);
                    eEscr = allE.slice(t * 2);
                }
                // Normalizar arrays
                sOral = Array.isArray(sOral) ? sOral : [sOral].filter(Boolean);
                sLect = Array.isArray(sLect) ? sLect : [sLect].filter(Boolean);
                sEscr = Array.isArray(sEscr) ? sEscr : [sEscr].filter(Boolean);
                cOral = Array.isArray(cOral) ? cOral : [cOral].filter(Boolean);
                cLect = Array.isArray(cLect) ? cLect : [cLect].filter(Boolean);
                cEscr = Array.isArray(cEscr) ? cEscr : [cEscr].filter(Boolean);
                eOral = Array.isArray(eOral) ? eOral : [eOral].filter(Boolean);
                eLect = Array.isArray(eLect) ? eLect : [eLect].filter(Boolean);
                eEscr = Array.isArray(eEscr) ? eEscr : [eEscr].filter(Boolean);

                // â”€â”€ Descripción de la actividad de evaluación por bloque â”€â”€
                // Columna "Descripción" = qué se evalúa, si json tiene cierre usarlo
                const evalOral = l.evalDescOral || l.cierreOral ||
                    `Observación: participación oral activa relacionada con ${lessonShortTitle.toLowerCase()}.`;
                const evalLect = l.evalDescLect || l.cierreLect ||
                    `Comprensión lectora: preguntas sobre "${lecturaLabel || lessonShortTitle}".`;
                const evalEscr = l.evalDescEscr || l.cierreEscr ||
                    `Lista de cotejo: producción de texto con revisión y versión final.`;

                // Extraer páginas de references
                let pOral = '1-2', pLect = '3-4', pEscr = '5';
                if (l.references && Array.isArray(l.references)) {
                    let m = l.references.join(' ').match(/p(?:ág|p)?\.?\s*([\d-]+)/i);
                    if (m) {
                        pOral = m[1]; pLect = m[1]; pEscr = m[1];
                    }
                }

                // â”€â”€ Metadatos de la lección â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                const lessonShortTitle = (l.lessonTitle || '').replace(/^Lección \d+:\s*/i, '').trim();
                const lessonNum = l.lessonNum || (lessonIdx + 1);
                const lecturaLabel = l.readingTitle || '';
                const weekLabel = l.weekRange || lessonShortTitle;

                // â”€â”€ Fila de encabezado de lección (colspan total) â”€â”€â”€â”€â”€â”€â”€â”€
                this._rows.push({
                    _isHeader: true,
                    _headerText: `LECCIí“N ${lessonNum}: ${lessonShortTitle.toUpperCase()}` +
                        (lecturaLabel ? ` &nbsp;|&nbsp; LECTURA: ${lecturaLabel}` : '') +
                        ` &nbsp;|&nbsp; ${weekLabel}`
                });

                // â”€â”€ Parsear weekRange â†’ Mes y Fecha â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                const _wr = (l.weekRange || '');
                let lessonMes = '', lessonFecha = '';
                const _wrMatch = _wr.match(/(\d+(?:\s+al\s+\d+)?)\s+de\s+([a-zA-Z]+)/i);
                if (_wrMatch) {
                    lessonFecha = _wrMatch[1];
                    lessonMes = _wrMatch[2].charAt(0).toUpperCase() + _wrMatch[2].slice(1);
                } else {
                    lessonFecha = _wr.replace(/^semana\s*/i, ''); // Fallback
                }

                // â”€â”€ Fila 1: Bloque Lengua Oral (Sesiones 1-2, H/C: 2) â”€â”€â”€â”€
                this._rows.push({
                    estandar: sOral.join('\n\n'),
expectativa: eOral.join('\n\n'),
contenido: cOral.join('\n\n'),
                    pag: pOral, mes: lessonMes, fecha: lessonFecha, hc: '2',
                    descripcion: evalOral,
                    tipoEval: l.evalType || 'Formativa',
                    evaluacion: l.evalDimension || 'T. Aula'
                });

                // â”€â”€ Fila 2: Bloque Lectura (Sesiones 3-4, H/C: 2) â”€â”€â”€â”€â”€â”€â”€â”€
                this._rows.push({
                    estandar: sLect.join('\n\n'),
expectativa: eLect.join('\n\n'),
contenido: cLect.join('\n\n'),
                    pag: pLect, mes: lessonMes, fecha: lessonFecha, hc: '2',
                    descripcion: evalLect,
                    tipoEval: l.evalType || 'Formativa',
                    evaluacion: l.evalDimension || 'T. Aula'
                });

                // â”€â”€ Fila 3: Bloque Escritura (Sesión 5, H/C: 1) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                // Planificación y organización — SIEMPRE juntos en 1 H/C
                this._rows.push({
                    estandar: sEscr.join('\n\n'),
expectativa: eEscr.join('\n\n'),
contenido: cEscr.join('\n\n'),
                    pag: pEscr, mes: lessonMes, fecha: lessonFecha, hc: '1',
                    descripcion: evalEscr,
                    tipoEval: l.evalType || 'Formativa',
                    evaluacion: l.evalDimension || 'T. Aula'
                });

            });
        } // end else

        this._fromBC = lessons.length > 0;
        this.screen = 'matrix';
        Router.navigate('formalizacion');
    },

    _generateEmpty() {
        this._parcialId = document.getElementById('form-parcial')?.value || this._parcialId;
        this._rows = [];
        this._fromBC = false;
        this.screen = 'matrix';
        Router.navigate('formalizacion');
    },

    // ================================================================
    // MATRIX: la pantalla real de la jornalización formal
    // ================================================================
    renderMatrix() {
        const course = Store.getActiveCourse() || {};
        const parciales = this.parciales();
        const parcial = parciales.find(p => p.id === this._parcialId);
        const rows = this._rows || [];

        const sid = this._subjectId || this.subjectIdForCourse(course);
        const subMap = this.subjectMap();

        // Report header data
        const sysConfig = Store.data.configCentro || {};
        const sysProfile = Store.data.configPerfil || {};
        const centro = course.centroEducativo || sysConfig.nombreCentro || 'Nombre del Centro Educativo';
        const docente = course.docente || sysProfile.nombre || 'Nombre del Docente';
        const director = course.director || sysConfig.nombreDirector || 'Nombre del Director';
        const lugar = course.direccionCentro || sysConfig.municipio || 'Lugar';
        const jornada = (course.jornadaInicio && course.jornadaInicio >= '12:00') ? 'Vespertina' : 'Matutina';
        const parcialPeriod = parcial ? `${parcial.fechaInicio || ''} al ${parcial.fechaFin || ''}` : '_________________';

        const tbodyRows = (() => {
            const rows = this._rows || [];
            if (!rows.length) return '';
            const CELL_STYLE = 'border:1px solid #000;padding:5px;';
            const CELL_EDIT = 'contenteditable="true" class="align-top outline-none text-[10px]"';

            // â”€â”€ Calcular rowspans automáticos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            // Columnas que se fusionan si tienen el mismo valor consecutivo:
            // 0=estandar, 3=pag, 4=mes, 5=fecha, 6=hc
            const MERGE_COLS = [3, 4, 5, 6]; // pag, mes, fecha, hc
            const fields = ['estandar', 'expectativa', 'contenido', 'pag', 'mes', 'fecha', 'hc', 'descripcion', 'tipoEval', 'evaluacion'];
            const rspan = rows.map(() => fields.map(() => 1));
            const skip = rows.map(() => fields.map(() => false));

            MERGE_COLS.forEach(ci => {
                let i = 0;
                while (i <rows.length) {
                    const val = (rows[i][fields[ci]] || '').trim();
                    if (!val) { i++; continue; }
                    let j = i + 1;
                    while (j <rows.length && (rows[j][fields[ci]] || '').trim() === val) j++;
                    if (j > i + 1) {
                        rspan[i][ci] = j - i;
                        for (let k = i + 1; k <j; k++) skip[k][ci] = true;
                    }
                    i = j;
                }
            });

            // â”€â”€ Detectar "lección header" rows (marcados con _isHeader) â”€â”€
            const cell = (idx, ci, content, extra = '') => {
                if (skip[idx][ci]) return '';
                const rs = rspan[idx][ci] > 1 ? ` rowspan="${rspan[idx][ci]}"` : '';
                return `<td ${CELL_EDIT} style="${CELL_STYLE}${extra}"${rs}>${content}</td>`;
            };

            return rows.map((r, idx) => {
                // Lesson header row (spans all 10 columns)
                if (r._isHeader) {
                    return `<tr>
                                <td colspan="10" style="${CELL_STYLE}background:#f0f4ff;font-weight:bold;font-size:10px;text-align:left;padding:6px 8px;">
                                    ${r._headerText || ''}
                                </td>
                            </tr>`;
                }
                return `<tr id="form-row-${idx}">
                            ${cell(idx, 0, r.estandar || '', 'min-height:80px;')}
                            ${cell(idx, 1, r.expectativa || '')}
                            <td class="align-top text-[10px]" style="${CELL_STYLE}">
                                <div contenteditable="true" class="outline-none min-h-[60px]">${r.contenido || ''}</div>
                            </td>
                            ${cell(idx, 3, r.pag || '', 'text-align:center;')}
                            ${cell(idx, 4, r.mes || '', 'text-align:center;')}
                            ${cell(idx, 5, r.fecha || '', 'text-align:center;')}
                            ${cell(idx, 6, r.hc || '', 'text-align:center;')}
                            ${cell(idx, 7, r.descripcion || '')}
                            ${cell(idx, 8, r.tipoEval || '', 'text-align:center;')}
                            ${cell(idx, 9, r.evaluacion || '', 'text-align:center;')}
                        </tr>`;
            }).join('');
        })();

        return `
                <div class="space-y-4">
                    <!-- toolbar -->
                    <div class="card p-4 flex flex-wrap justify-between items-center gap-3 print:hidden">
                        <div class="flex items-center gap-2">
                            <button class="btn btn-secondary text-xs" onclick="Views.Formalizacion.screen='home'; Router.navigate('formalizacion')">
                                <i data-lucide="arrow-left" class="w-4 h-4"></i> Volver
                            </button>
                            <span class="font-bold text-sm text-teal-700 flex items-center gap-1">
                                <i data-lucide="file-text" class="w-4 h-4"></i>
                                Jornalización Formal
                                ${parcial ? `<span class="ml-2 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-mono">${parcial.nombre}</span>` : ''}
                                ${sid ? `<span class="ml-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px]">${subMap[sid] || sid} — ${this._grade || '?'}° â€¢ ${this._term || '?'}</span>` : ''}
                            </span>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button class="btn btn-secondary text-xs" onclick="Views.Formalizacion._addRow()">
                                <i data-lucide="plus" class="w-4 h-4"></i> Añadir fila
                            </button>
                            <button class="btn btn-secondary text-xs" onclick="Views.Formalizacion._saveToStorage()">
                                <i data-lucide="save" class="w-4 h-4 text-teal-500"></i> Guardar
                            </button>
                            <button class="btn btn-secondary text-xs" onclick="Views.Formalizacion._exportJSON()">
                                <i data-lucide="download" class="w-4 h-4"></i> Exportar JSON
                            </button>
                            <button class="btn btn-primary text-xs" onclick="window.print()">
                                <i data-lucide="printer" class="w-4 h-4"></i> Imprimir / PDF
                            </button>
                        </div>
                    </div>

                    ${this._fromBC ? `<div class="card p-3 bg-violet-50 border border-violet-200 flex items-center gap-2 text-xs text-violet-700 print:hidden">
                        <i data-lucide="database" class="w-4 h-4"></i>
                        <span>Generado desde el <b>Banco Curricular</b>: ${rows.length} fila(s). Edita directamente las celdas.</span>
                    </div>` : ''}

                    <!-- printable document -->
                    <div class="bg-white p-8 rounded-xl border border-soft shadow-sm overflow-x-auto print:border-none print:shadow-none print:p-0 print:rounded-none" id="form-doc">
                        <!-- report header -->
                        <div class="border-b-2 border-slate-800 pb-4 mb-6">
                            <h2 class="font-bold text-center text-xl uppercase tracking-wider">${centro}</h2>
                            <h3 class="font-bold text-center text-lg text-slate-700 mt-1 uppercase">Jornalización del Parcial</h3>
                            <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mt-6">
                                <div><span class="font-bold">Campo del Conocimiento:</span> ${course.asignatura || '____________________'}</div>
                                <div><span class="font-bold">Grado:</span> ${course.grado || '_____'}° — <span class="font-bold">Sección:</span> ${course.seccion || '_____'}</div>
                                <div><span class="font-bold">Jornada:</span> ${jornada}</div>
                                <div><span class="font-bold">Docente:</span> ${docente}</div>
                                <div><span class="font-bold">Periodo del Parcial:</span> ${parcialPeriod}</div>
                                <div><span class="font-bold">Lugar y Fecha:</span> ${lugar}, ${new Date().toLocaleDateString('es-HN')}</div>
                            </div>
                        </div>

                        <!-- jornalizacion table -->
                        <table class="w-full" style="font-family:Arial,sans-serif;font-size:10px;border-collapse:collapse;width:100%;color:#000;">
                            <thead>
                                <tr>
                                    <th rowspan="2" style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:18%;">Est\u00e1ndares</th>
                                    <th rowspan="2" style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:22%;">Expectativas de Logro</th>
                                    <th rowspan="2" style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:21%;">Contenidos<br>Conceptuales y<br>Actitudinales</th>
                                    <th rowspan="2" style="border:1px solid #000;padding:5px;text-align:center;font-size:9px;width:5%;">N\u00b0<br>P\u00e1g.</th>
                                    <th colspan="2" style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:11%;">Tiempo</th>
                                    <th colspan="2" style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:20%;">Estrategias de Evaluaci\u00f3n</th>
                                </tr>
                                <tr>
                                    <th style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:5%;">Fecha</th>
                                    <th style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:6%;">Horas Clase</th>
                                    <th style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:10%;">Tipo</th>
                                    <th style="border:1px solid #000;padding:5px;text-align:center;font-size:10px;width:10%;">Dimensi\u00f3n</th>
                                </tr>
                            </thead>
                            <tbody id="form-tbody">
                                ${tbodyRows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#888;">Agrega filas o genera desde el Banco Curricular.</td></tr>'}
                            </tbody>
                        </table>

                        <!-- report footer -->
                        <div class="flex justify-between items-end mt-16 pt-8 text-sm text-center" style="border-top:none;">
                            <div style="width:220px;">
                                <div style="border-top:1px solid #000;padding-top:6px;font-weight:bold;">${docente}</div>
                                <div style="color:#555;font-size:13px;text-transform:uppercase;margin-top:3px;">Firma del Docente</div>
                            </div>
                            <div style="width:220px;">
                                <div style="border-top:1px solid #000;padding-top:6px;font-weight:bold;">${director}</div>
                                <div style="color:#555;font-size:13px;text-transform:uppercase;margin-top:3px;">Firma del Director(a) / Vo. Bo.</div>
                            </div>
                        </div>
                    </div>
                </div>`;
    },

    // ---- actions --------------------------------------------------
    _addRow() {
        const tbody = document.getElementById('form-tbody');
        if (!tbody) return;
        const idx = tbody.rows.length;
        const tr = document.createElement('tr');
        tr.id = 'form-row-' + idx;
        tr.innerHTML = Array(8).fill(0).map((_, i) =>
            `<td contenteditable="true" class="p-2 align-top outline-none text-[10px]" style="border:1px solid #000;min-height:50px;"></td>`
        ).join('');
        tbody.appendChild(tr);
        tr.cells[0].focus();
    },

    _collectRows() {
        const tbody = document.getElementById('form-tbody');
        if (!tbody) return [];
        return Array.from(tbody.rows).map(tr => ({
            estandar: tr.cells[0]?.innerText || '',
            expectativa: tr.cells[1]?.innerText || '',
            contenido: tr.cells[2]?.querySelector('div')?.innerText || tr.cells[2]?.innerText || '',
            pag: tr.cells[3]?.innerText || '',
            fecha: tr.cells[4]?.innerText || '',
            hc: tr.cells[5]?.innerText || '',
            tipoEval: tr.cells[6]?.innerText || '',
            evaluacion: tr.cells[7]?.innerText || ''
        }));
    },

    _saveToStorage() {
        const rows = this._collectRows();
        const key = `FORM_${this._parcialId || 'noParc'}_${this._subjectId || ''}_${this._grade || ''}_${this._term || ''}`;
        localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), rows }));
        this._rows = rows;
        UI.toast('Jornalización guardada localmente.', 'success');
    },

    _exportJSON() {
        const rows = this._collectRows();
        const payload = JSON.stringify({ parcialId: this._parcialId, subjectId: this._subjectId, grade: this._grade, term: this._term, exportedAt: new Date().toISOString(), rows }, null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jornalizacion-${this._subjectId || 'X'}-${this._grade || 'X'}-${this._term || 'X'}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('Jornalización exportada exitosamente.', 'success');
    },

    onMount() {
        // Try to restore saved rows for current key
        if (this.screen === 'matrix') {
            const key = `FORM_${this._parcialId || 'noParc'}_${this._subjectId || ''}_${this._grade || ''}_${this._term || ''}`;
            const saved = localStorage.getItem(key);
            if (saved && (!this._rows || this._rows.length === 0)) {
                try {
                    const data = JSON.parse(saved);
                    this._rows = data.rows || [];
                } catch (e) { }
            }
        }
    }
};
