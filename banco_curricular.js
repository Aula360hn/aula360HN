Views.BancoCurricular = {
    screen: 'home',   // 'home' | 'edit' | 'import' | 'validate'
    editingKey: null, // key of lesson being edited

    // Taxonomy
    SUBJECTS: [
        { id: 'MAT', name: 'Matem\u00e1ticas' },
        { id: 'ESP', name: 'Espa\u00f1ol' },
        { id: 'ING', name: 'Ingl\u00e9s' },
        { id: 'CN', name: 'Ciencias Naturales' },
        { id: 'SS', name: 'Estudios Sociales' }
    ],
    GRADES: ['7', '8', '9'],
    TERMS: ['P1', 'P2', 'P3', 'P4'],

    // â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    getLessons() { return Store.data.bcLessons || []; },
    saveLessons(arr) { Store.data.bcLessons = arr; Store.save(); },
    getPacks() { return Store.data.bcPacks || []; },
    savePacks(arr) { Store.data.bcPacks = arr; Store.save(); },

    makeKey(subjectId, grade, term, unitIndex, lessonIndex) {
        return `${subjectId}|${grade}|${term}|U${unitIndex}|L${lessonIndex}`;
    },

    // â”€â”€â”€ main render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    render() {
        switch (this.screen) {
            case 'edit': return this.renderEdit();
            case 'import': return this.renderImport();
            case 'validate': return this.renderValidate();
            default: return this.renderHome();
        }
    },

    // â”€â”€â”€ HOME â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    renderHome() {
        const lessons = this.getLessons();
        const subjectId = this._filterSubject || '';
        const grade = this._filterGrade || '';
        const term = this._filterTerm || '';

        const filtered = lessons.filter(l =>
            (!subjectId || l.subjectId === subjectId) &&
            (!grade || l.grade === grade) &&
            (!term || l.term === term)
        );

        const subjOpts = this.SUBJECTS.map(s =>
            `<option value="${s.id}" ${subjectId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
        const gradeOpts = this.GRADES.map(g =>
            `<option value="${g}" ${grade === g ? 'selected' : ''}>Grado ${g}</option>`).join('');
        const termOpts = this.TERMS.map(t =>
            `<option value="${t}" ${term === t ? 'selected' : ''}>${t}</option>`).join('');

        const hasBadLessons = lessons.some(l => !l.subjectId || !l.grade || !l.term);
        const repairBanner = hasBadLessons ? `
                    <div class="flex items-center gap-3 p-3 mb-4 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-800">
                        <i data-lucide="triangle-alert" class="w-5 h-5 text-amber-500 flex-shrink-0"></i>
                        <span class="flex-1"><b>${lessons.filter(l => !l.subjectId || !l.grade || !l.term).length} lección(es)</b> tienen campos vacíos (Asignatura/Grado/Parcial = undefined). Esto ocurre cuando el JSON importado usa nombres de campo diferentes.</span>
                        <button class="btn btn-primary text-xs px-3 py-1.5 bg-amber-500 hover:bg-amber-600 border-0" onclick="Views.BancoCurricular.repairAll()">
                            <i data-lucide="wrench" class="w-3 h-3 mr-1"></i> Reparar campos
                        </button>
                    </div>` : '';

        const rows = filtered.length === 0
            ? `<tr><td colspan="6" class="text-center py-10 text-muted text-sm">No hay lecciones para este filtro.</td></tr>`
            : filtered.map((l, idx) => `
                        <tr class="hover:bg-violet-50/40 transition-colors group">
                            <td class="py-2 px-3 text-[11px] font-bold text-violet-700">${this.SUBJECTS.find(s => s.id === l.subjectId)?.name || l.subjectId}</td>
                            <td class="py-2 px-3 text-[11px] text-center">${l.grade || '—'}°</td>
                            <td class="py-2 px-3 text-[11px] text-center font-mono">${l.term}</td>
                            <td class="py-2 px-3 text-[11px]">
                                <span class="font-semibold text-gray-800">${l.unitTitle || '—'}</span>
                                ${l.lessonTitle ? `<span class="text-muted"> &mdash; ${l.lessonTitle}</span>` : ''}
                            </td>
                            <td class="py-2 px-3 text-center">
                                <span class="inline-flex gap-2 text-[10px]">
                                    <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">${(l.standards || []).length} Est.</span>
                                    <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">${(l.contents || []).length} Cont.</span>
                                </span>
                            </td>
                            <td class="py-2 px-3 text-right">
                                <button class="btn btn-secondary text-xs py-1 px-2" onclick="Views.BancoCurricular.openEdit('${l.id}')">
                                    <i data-lucide="pencil" class="w-3 h-3"></i> Editar
                                </button>
                                <button class="btn btn-secondary text-xs py-1 px-2 ml-1 text-red-500" onclick="Views.BancoCurricular.deleteLesson('${l.id}')">
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                            </td>
                        </tr>`);

        return `
                <div class="space-y-5">
                    <!-- header -->
                    <div class="card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-violet-500">
                        <div>
                            <h2 class="text-xl font-black text-main flex items-center gap-2">
                                <i data-lucide="database" class="w-6 h-6 text-violet-500"></i>
                                Banco Curricular
                            </h2>
                            <p class="text-xs text-muted mt-1">Administra est\u00e1ndares y contenidos por asignatura, grado y parcial. Solo gestiona el banco \u2014 no genera planificaciones.</p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-secondary" onclick="Views.BancoCurricular.openImport()">
                                <i data-lucide="upload" class="w-4 h-4"></i> Importar JSON
                            </button>
                            <button class="btn btn-secondary" onclick="Views.BancoCurricular.exportAll()">
                                <i data-lucide="download" class="w-4 h-4"></i> Exportar
                            </button>
                            <button class="btn btn-secondary" onclick="Views.BancoCurricular.openValidate()">
                                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-500"></i> Validar
                            </button>
                            <button class="btn btn-primary" onclick="Views.BancoCurricular.openEdit(null)">
                                <i data-lucide="plus" class="w-4 h-4"></i> Nueva Lecci\u00f3n
                            </button>
                        </div>
                    </div>

                    <!-- filters -->
                    <div class="card p-4 flex flex-wrap gap-3 items-center bg-violet-50/30">
                        <label class="text-xs font-semibold text-muted uppercase tracking-wider">Filtrar:</label>
                        <select id="bc-filter-sub" class="form-control text-sm h-9 w-44" onchange="Views.BancoCurricular._filterSubject=this.value; Router.navigate('banco-curricular')">
                            <option value="">— Asignatura —</option>${subjOpts}
                        </select>
                        <select id="bc-filter-grade" class="form-control text-sm h-9 w-32" onchange="Views.BancoCurricular._filterGrade=this.value; Router.navigate('banco-curricular')">
                            <option value="">— Grado —</option>${gradeOpts}
                        </select>
                        <select id="bc-filter-term" class="form-control text-sm h-9 w-28" onchange="Views.BancoCurricular._filterTerm=this.value; Router.navigate('banco-curricular')">
                            <option value="">— Parcial —</option>${termOpts}
                        </select>
                        ${(subjectId || grade || term) ? `<button class="btn btn-secondary text-xs" onclick="Views.BancoCurricular._filterSubject='';Views.BancoCurricular._filterGrade='';Views.BancoCurricular._filterTerm='';Router.navigate('banco-curricular')"><i data-lucide="x" class="w-3 h-3"></i> Limpiar</button>` : ''}
                        <span class="ml-auto text-xs text-muted">${filtered.length} de ${lessons.length} lecci${lessons.length === 1 ? '\u00f3n' : 'ones'}</span>
                    </div>

                    <!-- packs banner -->
                    ${this.getPacks().length > 0 ? `
                    <div class="card p-3 bg-amber-50 border border-amber-200 flex items-center gap-3">
                        <i data-lucide="package" class="w-4 h-4 text-amber-600"></i>
                        <span class="text-xs text-amber-800 font-medium">${this.getPacks().length} paquete(s) ensamblado(s) en el banco.</span>
                    </div>` : ''}

                    <!-- table -->
                    ${repairBanner}
                    <div class="card p-0 overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-violet-600 text-white text-[11px] uppercase tracking-wide">
                                    <tr>
                                        <th class="py-3 px-3">Asignatura</th>
                                        <th class="py-3 px-3 text-center">Grado</th>
                                        <th class="py-3 px-3 text-center">Parcial</th>
                                        <th class="py-3 px-3">Unidad / Lecci\u00f3n</th>
                                        <th class="py-3 px-3 text-center">Cobertura</th>
                                        <th class="py-3 px-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    ${rows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>`;
    },

    // â”€â”€â”€ EDIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    openEdit(id) {
        this.editingKey = id;
        this.screen = 'edit';
        Router.navigate('banco-curricular');
    },

    renderEdit() {
        const id = this.editingKey;
        const all = this.getLessons();
        const lesson = id ? (all.find(l => l.id === id) || {}) : {};
        const pn = lesson.planNotes || {};

        const subjOpts = this.SUBJECTS.map(s =>
            `<option value="${s.id}" ${(lesson.subjectId === s.id) ? 'selected' : ''}>${s.name}</option>`).join('');
        const gradeOpts = this.GRADES.map(g =>
            `<option value="${g}" ${(lesson.grade === g) ? 'selected' : ''}>Grado ${g}</option>`).join('');
        const termOpts = this.TERMS.map(t =>
            `<option value="${t}" ${(lesson.term === t) ? 'selected' : ''}>${t}</option>`).join('');

        // Helper: lista editable (standards, expectations, contents, references)
        const listEditorHTML = (label, field, items, icon, colorClass, placeholder) => `
                    <div class="form-group">
                        <label class="form-label flex items-center gap-2">
                            <i data-lucide="${icon}" class="w-4 h-4 ${colorClass}"></i> ${label}
                        </label>
                        <div id="bc-list-${field}" class="space-y-2 mb-2">
                            ${(items || []).map((v, i) => `
                            <div class="flex gap-2" id="bc-li-${field}-${i}">
                                <input type="text" class="form-control text-sm" value="${(v || '').replace(/"/g, '&quot;')}" id="bc-${field}-${i}" placeholder="${placeholder || ''}">
                                <button class="btn btn-secondary text-xs text-red-500 px-2" onclick="document.getElementById('bc-li-${field}-${i}').remove()">
                                    <i data-lucide="x" class="w-3 h-3"></i>
                                </button>
                            </div>`).join('')}
                        </div>
                        <button class="btn btn-secondary text-xs" onclick="Views.BancoCurricular.addListItem('${field}')">
                            <i data-lucide="plus" class="w-3 h-3"></i> Agregar
                        </button>
                    </div>`;

        // Helper: textarea simple
        const textareaHTML = (label, fieldId, value, placeholder, rows, icon, colorClass) => `
                    <div class="form-group">
                        <label class="form-label flex items-center gap-2">
                            <i data-lucide="${icon}" class="w-4 h-4 ${colorClass}"></i> ${label}
                        </label>
                        <textarea id="${fieldId}" class="form-control font-sans text-sm" rows="${rows || 3}"
                            placeholder="${placeholder}">${(value || '').replace(/</g, '&lt;')}</textarea>
                    </div>`;

        return `
                <div class="space-y-5">
                    <div class="card p-4 flex items-center justify-between border-l-4 border-violet-500">
                        <h2 class="font-bold text-main flex items-center gap-2">
                            <i data-lucide="file-edit" class="w-5 h-5 text-violet-500"></i>
                            ${id ? 'Editar Lección' : 'Nueva Lección'}
                        </h2>
                        <button class="btn btn-secondary text-xs" onclick="Views.BancoCurricular.screen='home';Router.navigate('banco-curricular')">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Volver
                        </button>
                    </div>

                    <!-- â‘  IDENTIFICADORES -->
                    <div class="card p-6 space-y-4">
                        <h3 class="text-sm font-bold text-violet-700 flex items-center gap-2 pb-2 border-b border-violet-100">
                            <i data-lucide="tag" class="w-4 h-4"></i> Identificación
                        </h3>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="form-group">
                                <label class="form-label">Asignatura <span class="text-red-400">*</span></label>
                                <select id="bc-edit-subjectId" class="form-control">
                                    <option value="">Seleccione...</option>${subjOpts}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Grado <span class="text-red-400">*</span></label>
                                <select id="bc-edit-grade" class="form-control">
                                    <option value="">Seleccione...</option>${gradeOpts}
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Parcial <span class="text-red-400">*</span></label>
                                <select id="bc-edit-term" class="form-control">
                                    <option value="">Seleccione...</option>${termOpts}
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Unidad / Título <span class="text-red-400">*</span></label>
                                <input type="text" id="bc-edit-unitTitle" class="form-control"
                                    value="${(lesson.unitTitle || '').replace(/"/g, '&quot;')}"
                                    placeholder="Ej: Unidad 1 — La comunicación oral">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Lección (tema de la semana)</label>
                                <input type="text" id="bc-edit-lessonTitle" class="form-control"
                                    value="${(lesson.lessonTitle || '').replace(/"/g, '&quot;')}"
                                    placeholder="Ej: Lección 1: Valoro la tradición oral">
                            </div>
                        </div>
                        <div class="form-group w-32">
                            <label class="form-label">Semanas sugeridas</label>
                            <input type="number" id="bc-edit-suggestedWeeks" class="form-control"
                                min="1" max="20" value="${lesson.suggestedWeeks || 1}">
                        </div>
                    </div>

                    <!-- â‘¡ POR QUí‰: ESTÁNDARES Y EXPECTATIVAS -->
                    <div class="card p-6 space-y-4">
                        <h3 class="text-sm font-bold text-amber-700 flex items-center gap-2 pb-2 border-b border-amber-100">
                            <i data-lucide="award" class="w-4 h-4"></i> ¿Por qué? — Estándares y Expectativas de Logro
                        </h3>
                        ${listEditorHTML('Estándar(es) CNB — copia el texto literal <span class="text-red-400">*</span>', 'standards', lesson.standards, 'star', 'text-amber-500', 'Estándar completo y literal del CNB...')}
                        ${listEditorHTML('Expectativa(s) de Logro — comienzan con "El estudiante..." <span class="text-red-400">*</span>', 'expectations', lesson.expectations, 'target', 'text-orange-500', 'El estudiante lee comprensivamente...')}
                    </div>

                    <!-- â‘¢ QUí‰: CONTENIDOS Y REFERENCIAS -->
                    <div class="card p-6 space-y-4">
                        <h3 class="text-sm font-bold text-blue-700 flex items-center gap-2 pb-2 border-b border-blue-100">
                            <i data-lucide="book-open" class="w-4 h-4"></i> ¿Qué? — Contenidos
                        </h3>
                        ${listEditorHTML('Contenidos Conceptuales y Actitudinales <span class="text-red-400">*</span>', 'contents', lesson.contents, 'list-ordered', 'text-blue-500', 'Ej: La narración oral: características')}
                        ${listEditorHTML('Referencias (páginas del libro/guía)', 'references', lesson.references, 'book-marked', 'text-emerald-500', 'Ej: Libro Español 7°, pág. 12-18')}
                    </div>

                    <!-- â‘£ Cí“MO: TRES MOMENTOS DE LA CLASE -->
                    <div class="card p-6 space-y-4">
                        <h3 class="text-sm font-bold text-teal-700 flex items-center gap-2 pb-2 border-b border-teal-100">
                            <i data-lucide="layout-list" class="w-4 h-4"></i> ¿Cómo enseñar? — Tres Momentos de la Clase
                        </h3>
                        <div class="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700 mb-2">
                            Estos tres momentos se trasladan automáticamente a la columna <b>Descripción</b> de la Jornalización y a la Planificación de Clases.
                        </div>
                        ${textareaHTML('ðŸŸ¢ INICIO — Activación de conocimientos previos (5-10 min)', 'bc-edit-inicio', pn.inicio, 'Ej: Pregunta generadora: ¿Qué cuentos o leyendas conocen de su región?', 3, 'play-circle', 'text-green-500')}
                        ${textareaHTML('ðŸ”µ DESARROLLO — Actividad principal de aprendizaje (25-35 min)', 'bc-edit-desarrollo', pn.desarrollo, 'Ej: Lectura compartida de cuento hondureño. Análisis de elementos narrativos en grupos.', 4, 'activity', 'text-blue-500')}
                        ${textareaHTML('ðŸ”´ CIERRE — Evaluación formativa / reflexión (5-10 min)', 'bc-edit-cierre', pn.cierre, 'Ej: Ticket de salida: ¿Por qué es importante preservar la tradición oral?', 3, 'flag', 'text-red-500')}
                    </div>

                    <!-- â‘¤ EVALUACIí“N -->
                    <div class="card p-6 space-y-4">
                        <h3 class="text-sm font-bold text-purple-700 flex items-center gap-2 pb-2 border-b border-purple-100">
                            <i data-lucide="clipboard-check" class="w-4 h-4"></i> ¿Cómo evaluar? — Estrategia de Evaluación
                        </h3>
                        <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700 mb-2">
                            Opcional. Si no se define aquí, el docente lo completa directamente en la Jornalización.
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Tipo de Evaluación</label>
                                <select id="bc-edit-evalType" class="form-control">
                                    <option value="">-- Sin definir --</option>
                                    <option value="Formativa" ${lesson.evalType === 'Formativa' ? 'selected' : ''}>Formativa</option>
                                    <option value="Sumativa" ${lesson.evalType === 'Sumativa' ? 'selected' : ''}>Sumativa</option>
                                    <option value="Formativa y Sumativa" ${lesson.evalType === 'Formativa y Sumativa' ? 'selected' : ''}>Formativa y Sumativa</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Dimensión</label>
                                <select id="bc-edit-evalDimension" class="form-control">
                                    <option value="">-- Sin definir --</option>
                                    <option value="T. Aula" ${lesson.evalDimension === 'T. Aula' ? 'selected' : ''}>T. Aula</option>
                                    <option value="T. Casa" ${lesson.evalDimension === 'T. Casa' ? 'selected' : ''}>T. Casa</option>
                                    <option value="Examen" ${lesson.evalDimension === 'Examen' ? 'selected' : ''}>Examen</option>
                                </select>
                            </div>
                        </div>
                        ${textareaHTML('Descripción de la actividad evaluativa (opcional)', 'bc-edit-evalDesc', lesson.evalDescription, 'Ej: Exposición oral individual sobre un cuento tradicional de su comunidad', 2, 'pencil-line', 'text-purple-400')}
                    </div>

                    <!-- GUARDAR -->
                    <div class="card p-4 flex justify-end gap-3">
                        <button class="btn btn-secondary" onclick="Views.BancoCurricular.screen='home';Router.navigate('banco-curricular')">Cancelar</button>
                        <button class="btn btn-primary" onclick="Views.BancoCurricular.saveEdit('${id || ''}')">
                            <i data-lucide="save" class="w-4 h-4"></i> Guardar Lección
                        </button>
                    </div>
                </div>`;
    },

    addListItem(field) {
        const container = document.getElementById('bc-list-' + field);
        if (!container) return;
        const idx = container.children.length;
        const div = document.createElement('div');
        div.className = 'flex gap-2';
        div.id = `bc-li-${field}-${idx}`;
        div.innerHTML = `<input type="text" class="form-control text-sm" id="bc-${field}-${idx}">
                    <button class="btn btn-secondary text-xs text-red-500 px-2" onclick="this.parentElement.remove()">
                        <i data-lucide="x" class="w-3 h-3"></i></button>`;
        container.appendChild(div);
        if (window.lucide) window.lucide.createIcons();
        div.querySelector('input').focus();
    },

    collectList(field) {
        const items = [];
        document.querySelectorAll(`#bc-list-${field} input[type="text"]`).forEach(inp => {
            const v = (inp.value || '').trim();
            if (v) items.push(v);
        });
        return items;
    },

    saveEdit(id) {
        const subjectId = document.getElementById('bc-edit-subjectId')?.value || '';
        const grade = document.getElementById('bc-edit-grade')?.value || '';
        const term = document.getElementById('bc-edit-term')?.value || '';
        const unitTitle = document.getElementById('bc-edit-unitTitle')?.value?.trim() || '';
        const lessonTitle = document.getElementById('bc-edit-lessonTitle')?.value?.trim() || '';
        const suggestedWeeks = parseInt(document.getElementById('bc-edit-suggestedWeeks')?.value) || 1;

        if (!subjectId || !grade || !term || !unitTitle) {
            UI.toast('Complete Asignatura, Grado, Parcial y Unidad.', 'error'); return;
        }

        // Listas
        const standards = this.collectList('standards');
        const expectations = this.collectList('expectations');
        const contents = this.collectList('contents');
        const references = this.collectList('references');

        if (standards.length === 0) {
            UI.toast('Agrega al menos un Estándar.', 'error'); return;
        }
        if (expectations.length === 0) {
            UI.toast('Agrega al menos una Expectativa de Logro.', 'error'); return;
        }
        if (contents.length === 0) {
            UI.toast('Agrega al menos un Contenido.', 'error'); return;
        }

        // Tres momentos
        const planNotes = {
            inicio: document.getElementById('bc-edit-inicio')?.value?.trim() || '',
            desarrollo: document.getElementById('bc-edit-desarrollo')?.value?.trim() || '',
            cierre: document.getElementById('bc-edit-cierre')?.value?.trim() || '',
        };

        // Evaluación
        const evalType = document.getElementById('bc-edit-evalType')?.value || '';
        const evalDimension = document.getElementById('bc-edit-evalDimension')?.value || '';
        const evalDescription = document.getElementById('bc-edit-evalDesc')?.value?.trim() || '';

        const lessonData = {
            subjectId, grade, term,
            unitTitle, lessonTitle,
            suggestedWeeks,
            standards, expectations, contents, references,
            planNotes,
            evalType, evalDimension, evalDescription,
        };

        const all = this.getLessons();
        if (id) {
            const idx = all.findIndex(l => l.id === id);
            if (idx >= 0) {
                all[idx] = { ...all[idx], ...lessonData, updatedAt: Date.now() };
            }
        } else {
            all.push({ id: Utils.id(), ...lessonData, createdAt: Date.now() });
        }
        this.saveLessons(all);
        UI.toast('Lección guardada.', 'success');
        this.screen = 'home';
        Router.navigate('banco-curricular');
    },


    deleteLesson(id) {
        UI.confirm('\u00bfEliminar esta lecci\u00f3n del banco?', () => {
            this.saveLessons(this.getLessons().filter(l => l.id !== id));
            Router.navigate('banco-curricular');
        });
    },

    // â”€â”€â”€ IMPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    openImport() { this.screen = 'import'; Router.navigate('banco-curricular'); },

    renderImport() {
        const packs = this.getPacks();
        return `
                <div class="space-y-5">
                    <div class="card p-4 flex items-center justify-between border-l-4 border-violet-500">
                        <h2 class="font-bold text-main flex items-center gap-2">
                            <i data-lucide="upload" class="w-5 h-5 text-violet-500"></i>
                            Importar Paquete JSON
                        </h2>
                        <button class="btn btn-secondary text-xs" onclick="Views.BancoCurricular.screen='home';Router.navigate('banco-curricular')">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Volver
                        </button>
                    </div>

                    <div class="card p-6 space-y-5">
                        <div class="p-4 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-800">
                            <b>Formato de paquete:</b> Array JSON con objetos que tengan los campos:
                            <code class="block mt-2 bg-white p-2 rounded text-xs text-gray-700">[ { subjectId, grade, term, unitTitle, lessonTitle, standards[], contents[], references[], suggestedWeeks } ]</code>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Subir archivo .json</label>
                            <input type="file" id="bc-import-file" accept=".json" class="form-control" onchange="Views.BancoCurricular.importFile(this)">
                        </div>

                        <div class="form-group">
                            <label class="form-label">O pegar JSON directamente</label>
                            <textarea id="bc-import-raw" class="form-control font-mono text-xs" rows="8" placeholder='[{"subjectId":"MAT", ...}]'></textarea>
                        </div>

                        <div class="flex gap-3">
                            <button class="btn btn-primary" onclick="Views.BancoCurricular.importPaste()">
                                <i data-lucide="upload" class="w-4 h-4"></i> Importar JSON pegado
                            </button>
                        </div>

                        ${packs.length > 0 ? `
                        <div class="border-t border-soft pt-4">
                            <h4 class="font-semibold text-sm mb-3 flex items-center gap-2">
                                <i data-lucide="package" class="w-4 h-4 text-amber-500"></i>
                                Paquetes activos (${packs.length})
                            </h4>
                            <div class="space-y-2">
                                ${packs.map(p => `
                                <div class="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div><span class="font-semibold text-sm">${p.name}</span>
                                    <span class="text-xs text-muted ml-2">${p.lessonCount} lecci${p.lessonCount === 1 ? '\u00f3n' : 'ones'} &mdash; ${new Date(p.importedAt).toLocaleDateString('es-HN')}</span></div>
                                    <button class="btn btn-secondary text-xs text-red-500" onclick="Views.BancoCurricular.removePack('${p.id}')">
                                        <i data-lucide="trash-2" class="w-3 h-3"></i> Quitar
                                    </button>
                                </div>`).join('')}
                            </div>
                        </div>` : ''}
                    </div>
                </div>`;
    },

    importFile(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bc-import-raw').value = e.target.result;
            UI.toast('Archivo cargado. Presiona Importar para confirmar.');
        };
        reader.readAsText(file);
    },

    // â”€â”€â”€ CAMPO NORMALIZER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Convierte cualquier nombre de campo a los nombres internos del sistema.
    _normalizeLesson(raw) {
        // Mapa de sinónimos: [camposAlternativos] -> campoInterno
        const pick = (obj, ...keys) => {
            for (const k of keys) {
                if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
            }
            return undefined;
        };
        const toArr = v => {
            if (!v) return [];
            if (Array.isArray(v)) return v.map(String).filter(Boolean);
            if (typeof v === 'string') return v.split(/[;\n]+/).map(s => s.trim()).filter(Boolean);
            return [String(v)];
        };

        // subjectId: aceptar nombre completo o código
        const subjectRaw = pick(raw,
            'subjectId', 'subject', 'asignatura', 'materia', 'area',
            'subject_id', 'area_conocimiento', 'disciplina');
        const subjectNorm = (() => {
            if (!subjectRaw) return undefined;
            const s = String(subjectRaw).trim();
            // Si ya es un código corto (<=5 letras mayúsculas), usarlo
            if (/^[A-Z]{2,5}$/.test(s)) return s;
            // Mapeo de nombre completo a código
            const map = {
                'español': 'ESP', 'espanol': 'ESP', 'español (comunicación)': 'ESP',
                'matemáticas': 'MAT', 'matematicas': 'MAT', 'matematica': 'MAT', 'math': 'MAT',
                'ciencias naturales': 'CN', 'ciencias': 'CN', 'biología': 'CN', 'biologia': 'CN',
                'ciencias sociales': 'SS', 'estudios sociales': 'SS', 'historia': 'SS',
                'inglés': 'ING', 'ingles': 'ING', 'english': 'ING',
                'educación física': 'EF', 'educacion fisica': 'EF',
                'arte': 'ART', 'artes': 'ART',
                'tecnología': 'TEC', 'tecnologia': 'TEC',
                'formación humana': 'FH', 'formacion humana': 'FH',
            };
            return map[s.toLowerCase()] || s.toUpperCase().slice(0, 5);
        })();

        // grade: aceptar "7", "7°", "Séptimo", "7mo"
        const gradeRaw = pick(raw,
            'grade', 'grado', 'gradoEscolar', 'nivel', 'year', 'curso');
        const gradeNorm = (() => {
            if (!gradeRaw) return undefined;
            const g = String(gradeRaw).trim();
            const m = g.match(/\d+/);
            if (m) return m[0];
            const words = {
                'primero': '1', 'segundo': '2', 'tercero': '3', 'cuarto': '4',
                'quinto': '5', 'sexto': '6', 'séptimo': '7', 'septimo': '7',
'octavo': '8', 'noveno': '9', 'décimo': '10', 'decimo': '10'
            };
            return words[g.toLowerCase()] || g;
        })();

        // term: aceptar "P1","Parcial 1","Primer Parcial","1"
        const termRaw = pick(raw,
            'term', 'parcial', 'periodo', 'trimestre', 'bimestre',
            'quarter', 'term_id', 'bloque');
        const termNorm = (() => {
            if (!termRaw) return undefined;
            const t = String(termRaw).trim();
            const m = t.match(/\d+/);
            if (m) return 'P' + m[0];
            const words = {
                'primero': 'P1', 'primer': 'P1', 'first': 'P1',
                'segundo': 'P2', 'segunda': 'P2', 'second': 'P2',
                'tercero': 'P3', 'tercer': 'P3', 'third': 'P3',
                'cuarto': 'P4', 'cuarta': 'P4', 'fourth': 'P4',
            };
            return words[t.toLowerCase()] || t;
        })();

        // Títulos
        const unitTitle = pick(raw, 'unitTitle', 'unidad', 'unit', 'unidad_nombre', 'unidadTitulo', 'unit_name') || '';
        const lessonTitle = pick(raw, 'lessonTitle', 'leccion', 'lección', 'lesson', 'titulo', 'título', 'tema', 'nombre') || '';

        // Arrays de contenido
        const standards = toArr(pick(raw,
            'standards', 'estandares', 'estándares', 'standard',
            'estandar', 'estándar', 'competencias', 'logros'));
        const contents = toArr(pick(raw,
            'contents', 'contenidos', 'contenido', 'content',
            'temas', 'tema', 'topics', 'aprendizajes'));
        const references = toArr(pick(raw,
            'references', 'referencias', 'referencia', 'reference',
            'páginas', 'paginas', 'libro', 'libros', 'pages'));

        // Expectativas de Logro — campo obligatorio en nuevo schema
        const expectations = toArr(pick(raw,
            'expectations', 'expectativas', 'expectativa',
            'expectativasDeLogro', 'logros', 'indicadores',
            'cnbExpectations', 'expectedOutcomes'));

        const suggestedWeeks = pick(raw,
            'suggestedWeeks', 'semanas', 'semanaSugerida', 'semanasSugeridas', 'weeks') || 1;

        // Tres momentos de la clase — nuevo schema
        const rawPN = raw.planNotes || raw.momentos || raw.moments || {};
        const planNotes = {
            inicio: String(rawPN.inicio || rawPN.start || rawPN.opening || raw.inicio || '').trim(),
            desarrollo: String(rawPN.desarrollo || rawPN.development || rawPN.main || raw.desarrollo || '').trim(),
            cierre: String(rawPN.cierre || rawPN.closure || rawPN.closing || raw.cierre || '').trim(),
        };

        // Evaluación — opcional
        const evalType = pick(raw, 'evalType', 'tipoEvaluacion', 'tipo_evaluacion', 'tipo') || '';
        const evalDimension = pick(raw, 'evalDimension', 'dimension', 'dimensionEvaluacion') || '';
        const evalDescription = pick(raw, 'evalDescription', 'descripcionEvaluacion', 'actividadEvaluativa') || '';

        return {
            ...(raw.id ? { id: raw.id } : {}),
            subjectId: subjectNorm,
            grade: gradeNorm,
            term: termNorm,
            unitTitle,
            lessonTitle,
            suggestedWeeks: Number(suggestedWeeks) || 1,
            standards,
            expectations,
            contents,
            references,
            planNotes,
            evalType,
            evalDimension,
            evalDescription,
            importedAt: raw.importedAt || Date.now(),
        };
    },

    // â”€â”€â”€ REPARAR datos ya guardados con undefined â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    repairAll() {
        const lessons = this.getLessons();
        const bad = lessons.filter(l => !l.subjectId || !l.grade || !l.term);
        if (bad.length === 0) {
            UI.toast('No hay lecciones con datos incompletos.', 'success');
            return;
        }
        const fixed = lessons.map(l => {
            if (!l.subjectId || !l.grade || !l.term) {
                return { ...this._normalizeLesson(l), id: l.id };
            }
            return l;
        });
        this.saveLessons(fixed);
        UI.toast(`${bad.length} lecciones reparadas.`, 'success');
        Router.navigate('banco-curricular');
    },

    importPaste() {
        const raw = document.getElementById('bc-import-raw')?.value?.trim();
        if (!raw) { UI.toast('El campo JSON está vacío.', 'error'); return; }

        let parsed;
        try { parsed = JSON.parse(raw); } catch (e) {
            UI.toast('JSON inválido: ' + e.message, 'error'); return;
        }

        // Accept array or {pack:{...}, lessons:[]}
        let lessonsData = [];
        let packName = 'Paquete importado ' + new Date().toLocaleDateString('es-HN');
        if (Array.isArray(parsed)) {
            lessonsData = parsed;
        } else if (parsed.lessons && Array.isArray(parsed.lessons)) {
            lessonsData = parsed.lessons;
            packName = parsed.name || parsed.pack?.name || packName;
        } else if (parsed.pack && parsed.pack.lessons) {
            lessonsData = parsed.pack.lessons;
            packName = parsed.pack.name || packName;
        } else if (typeof parsed === 'object') {
            // Maybe it's a single lesson object
            lessonsData = [parsed];
        } else {
            UI.toast('El JSON debe ser un array o tener propiedad "lessons".', 'error'); return;
        }

        if (lessonsData.length === 0) { UI.toast('No se encontraron lecciones.', 'error'); return; }

        // NORMALIZAR cada lección antes de guardar
        lessonsData = lessonsData.map(l => this._normalizeLesson(l));

        // Merge into bcLessons (skip exact duplicates by title+subjectId+grade+term)
        const all = this.getLessons();
        let added = 0;
        lessonsData.forEach(l => {
            const dup = all.find(x =>
                x.subjectId === l.subjectId &&
                x.grade === l.grade &&
                x.term === l.term &&
                x.unitTitle === l.unitTitle &&
                x.lessonTitle === l.lessonTitle
            );
            if (!dup) {
                all.push({ ...l, id: l.id || Utils.id(), importedAt: Date.now() });
                added++;
            }
        });
        this.saveLessons(all);

        // Register pack
        const packs = this.getPacks();
        packs.push({ id: Utils.id(), name: packName, lessonCount: lessonsData.length, added, importedAt: Date.now() });
        this.savePacks(packs);

        UI.toast(`${added} lección(es) importada(s). ${lessonsData.length - added} duplicadas omitidas.`, 'success');
        this.screen = 'home';
        Router.navigate('banco-curricular');
    },


    removePack(packId) {
        UI.confirm('\u00bfQuitar este paquete del registro? (Las lecciones permanecen en el banco)', () => {
            this.savePacks(this.getPacks().filter(p => p.id !== packId));
            Router.navigate('banco-curricular');
        });
    },

    // â”€â”€â”€ EXPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    exportAll() {
        const lessons = this.getLessons();
        if (lessons.length === 0) { UI.toast('No hay lecciones para exportar.', 'warning'); return; }

        const payload = JSON.stringify({ name: 'Banco Curricular Completo', exportedAt: new Date().toISOString(), lessons }, null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `banco-curricular-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast(`Exportadas ${lessons.length} lecciones.`, 'success');
    },

    // â”€â”€â”€ VALIDATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    openValidate() { this.screen = 'validate'; Router.navigate('banco-curricular'); },

    renderValidate() {
        const lessons = this.getLessons();
        const issues = [];

        lessons.forEach((l, idx) => {
            const ref = `#${idx + 1} &mdash; ${l.subjectId}/${l.grade}/${l.term}: ${l.unitTitle}`;
            if (!l.subjectId) issues.push({ type: 'error', msg: `${ref}: Asignatura vac\u00eda.` });
            if (!l.grade) issues.push({ type: 'error', msg: `${ref}: Grado vac\u00edo.` });
            if (!l.term) issues.push({ type: 'error', msg: `${ref}: Parcial vac\u00edo.` });
            if (!l.unitTitle) issues.push({ type: 'error', msg: `${ref}: T\u00edtulo de unidad vac\u00edo.` });
            if (!l.standards || l.standards.length === 0) issues.push({ type: 'warning', msg: `${ref}: Sin est\u00e1ndares.` });
            if (!l.contents || l.contents.length === 0) issues.push({ type: 'warning', msg: `${ref}: Sin contenidos.` });
        });

        // Duplicates
        const keys = lessons.map(l => `${l.subjectId}|${l.grade}|${l.term}|${l.unitTitle}|${l.lessonTitle}`);
        keys.forEach((k, i) => {
            if (keys.indexOf(k) !== i) issues.push({ type: 'warning', msg: `Posible duplicado: ${k}` });
        });

        const errCount = issues.filter(x => x.type === 'error').length;
        const warnCount = issues.filter(x => x.type === 'warning').length;

        return `
                <div class="space-y-5">
                    <div class="card p-4 flex items-center justify-between border-l-4 border-${issues.length === 0 ? 'emerald' : 'amber'}-500">
                        <h2 class="font-bold text-main flex items-center gap-2">
                            <i data-lucide="shield-check" class="w-5 h-5 text-${issues.length === 0 ? 'emerald' : 'amber'}-500"></i>
                            Validaci\u00f3n del Banco
                        </h2>
                        <button class="btn btn-secondary text-xs" onclick="Views.BancoCurricular.screen='home';Router.navigate('banco-curricular')">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Volver
                        </button>
                    </div>

                    <div class="card p-6 space-y-4">
                        <div class="flex gap-4">
                            <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-center min-w-[80px]">
                                <div class="text-2xl font-black text-red-600">${errCount}</div>
                                <div class="text-xs text-red-500">Errores</div>
                            </div>
                            <div class="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-center min-w-[80px]">
                                <div class="text-2xl font-black text-amber-600">${warnCount}</div>
                                <div class="text-xs text-amber-500">Advertencias</div>
                            </div>
                            <div class="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center min-w-[80px]">
                                <div class="text-2xl font-black text-emerald-600">${lessons.length}</div>
                                <div class="text-xs text-emerald-500">Lecciones</div>
                            </div>
                        </div>

                        ${issues.length === 0
                ? `<div class="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                                <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                                <span class="font-semibold">\u00a1Banco v\u00e1lido! No se encontraron problemas.</span>
                               </div>`
                : `<div class="space-y-2">
                                ${issues.map(issue => `
                                <div class="flex items-start gap-3 p-3 rounded-lg ${issue.type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}">
                                    <i data-lucide="${issue.type === 'error' ? 'alert-circle' : 'alert-triangle'}" class="w-4 h-4 mt-0.5 ${issue.type === 'error' ? 'text-red-500' : 'text-amber-500'} flex-shrink-0"></i>
                                    <span class="text-xs ${issue.type === 'error' ? 'text-red-700' : 'text-amber-700'}">${issue.msg}</span>
                                </div>`).join('')}
                               </div>`
            }
                    </div>
                </div>`;
    }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  FORMALIZACIí“N Y JORNALIZACIí“N (FORM) — Views.Formalizacion
//  Integra el Banco Curricular con los datos del curso activo para
//  generar una matriz de jornalización formal, editable e imprimible.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•