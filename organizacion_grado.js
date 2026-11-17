/**
 * Aula360 HN - Módulo Organización de Grado
 * Directiva de Grado (Estudiantes) y Directiva de Padres de Familia
 * Módulo exclusivo para Maestro(a) Guía
 */

window.Views = window.Views || {};

Views.OrganizacionGrado = {
    activeTab: 'grado', // 'grado' | 'padres'
    cargos: [
        'Presidente',
        'Vice-Presidente',
        'Secretario',
        'Tesorero',
        'Fiscal',
        'Vocal 1',
        'Vocal 2',
        'Vocal 3'
    ],

    getActiveCourse() {
        if (typeof Store !== 'undefined' && Store.getActiveCourse) {
            return Store.getActiveCourse();
        }
        return null;
    },

    getStorageKey(courseId) {
        return `gdhn_organizacion_grado_${courseId}`;
    },

    getData(courseId) {
        if (!courseId) return this.getDefaultData();
        try {
            const raw = localStorage.getItem(this.getStorageKey(courseId));
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.grado) && Array.isArray(parsed.padres)) {
                    parsed.grado = this.cargos.map((cargo, idx) => {
                        const existing = parsed.grado[idx] || {};
                        return {
                            orden: idx + 1,
                            cargo,
                            nombre: existing.nombre || '',
                            dni: existing.dni || '',
                            telefono: existing.telefono || '',
                            direccion: existing.direccion || '',
                            studentId: existing.studentId || ''
                        };
                    });
                    parsed.padres = this.cargos.map((cargo, idx) => {
                        const existing = parsed.padres[idx] || {};
                        return {
                            orden: idx + 1,
                            cargo,
                            nombre: existing.nombre || '',
                            dni: existing.dni || '',
                            telefono: existing.telefono || '',
                            direccion: existing.direccion || '',
                            studentId: existing.studentId || ''
                        };
                    });
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Error al cargar datos de organización de grado:', e);
        }
        return this.getDefaultData();
    },

    getDefaultData() {
        return {
            grado: this.cargos.map((cargo, idx) => ({
                orden: idx + 1,
                cargo,
                nombre: '',
                dni: '',
                telefono: '',
                direccion: '',
                studentId: ''
            })),
            padres: this.cargos.map((cargo, idx) => ({
                orden: idx + 1,
                cargo,
                nombre: '',
                dni: '',
                telefono: '',
                direccion: '',
                studentId: ''
            }))
        };
    },

    saveData(courseId, data) {
        if (!courseId) return;
        try {
            localStorage.setItem(this.getStorageKey(courseId), JSON.stringify(data));
        } catch (e) {
            console.error('Error guardando organización de grado:', e);
        }
    },

    setTab(tab) {
        this.activeTab = tab;
        this.render();
    },

    selectGuiaCourseAndOpen(courseId) {
        if (typeof Store !== 'undefined' && Store.setActiveCourse) {
            Store.setActiveCourse(courseId);
            Store.save();
            if (window.UI && UI.updateHeader) UI.updateHeader();
        }
        if (window.Router && Router.navigate) {
            Router.navigate('organizacion-grado');
        } else {
            this.render();
        }
    },

    getCargoBadge(cargo) {
        const styles = {
            'Presidente': { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', icon: 'crown' },
            'Vice-Presidente': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', icon: 'award' },
            'Secretario': { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', icon: 'file-text' },
            'Tesorero': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', icon: 'coins' },
            'Fiscal': { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff', icon: 'scale' },
            'Vocal 1': { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', icon: 'user-check' },
            'Vocal 2': { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', icon: 'user-check' },
            'Vocal 3': { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', icon: 'user-check' }
        };
        const s = styles[cargo] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', icon: 'user' };
        return `
            <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 7px; font-size: 11.5px; font-weight: 800; background: ${s.bg}; color: ${s.text}; border: 1px solid ${s.border}; white-space: nowrap;">
                <i data-lucide="${s.icon}" style="width: 13px; height: 13px; flex-shrink: 0;"></i>
                <span>${cargo}</span>
            </span>
        `;
    },

    render() {
        const course = this.getActiveCourse();
        const activeCourse = (typeof Store !== 'undefined' && Store.getActiveCourse) ? Store.getActiveCourse() : course;
        const cursosGuia = (typeof Store !== 'undefined' && Store.getCursosGuia) ? Store.getCursosGuia() : [];
        const isGuia = (course && course.id && typeof Store !== 'undefined' && Store.isMaestroGuia) ? Store.isMaestroGuia(course.id) : false;

        let html = '';

        // GUARD: Si el usuario no es maestro guía para este curso
        if (!course || !isGuia) {
            html = this.getNonGuiaHtml(activeCourse, cursosGuia);
        } else {
            const data = this.getData(course.id);
            const students = (typeof Store !== 'undefined' && Store.getStudentsByCourse) ? (Store.getStudentsByCourse(course.id) || []) : [];
            const isGradoTab = this.activeTab === 'grado';
            const currentList = isGradoTab ? data.grado : data.padres;
            const asignadosCount = currentList.filter(r => (r.nombre || '').trim().length > 0).length;

            html = `
                <style>
                    .org-grado-wrap {
                        width: 100%;
                        max-width: 100%;
                        margin: 0 auto;
                        padding: 2px 4px;
                        font-family: 'Outfit', sans-serif;
                        box-sizing: border-box;
                    }
                    .org-input {
                        width: 100%;
                        border: 1px solid #cbd5e1;
                        border-radius: 7px;
                        padding: 4px 10px;
                        font-size: 12.5px;
                        font-weight: 600;
                        color: #0f172a;
                        background: #ffffff;
                        box-sizing: border-box;
                        transition: border-color 0.15s, box-shadow 0.15s;
                        height: 31px;
                    }
                    .org-input:focus {
                        outline: none;
                        border-color: #4f46e5;
                        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
                    }
                    .org-select-single {
                        width: 100%;
                        font-size: 12.5px;
                        font-weight: 700;
                        color: #0f172a;
                        background: #ffffff;
                        border: 1px solid #cbd5e1;
                        border-radius: 7px;
                        padding: 4px 10px;
                        cursor: pointer;
                        height: 31px;
                        box-sizing: border-box;
                        transition: all 0.15s;
                    }
                    .org-select-single.is-assigned {
                        background: #f5f3ff;
                        border-color: #c4b5fd;
                        color: #1e1b4b;
                    }
                    .org-select-single:hover {
                        border-color: #818cf8;
                    }
                    .org-select-single:focus {
                        outline: none;
                        border-color: #4f46e5;
                        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
                    }
                    .org-table th {
                        padding: 7px 10px;
                        font-size: 11px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.04em;
                        color: #475569;
                        background: #f8fafc;
                        border-bottom: 1.5px solid #e2e8f0;
                        white-space: nowrap;
                    }
                    .org-table td {
                        padding: 5px 8px;
                        vertical-align: middle;
                        border-bottom: 1px solid #f1f5f9;
                    }
                </style>

                <div class="org-grado-wrap fade-in">
                    <!-- BARRA SUPERIOR COMPACTA CON PESTAÑAS INTEGRADAS -->
                    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%); border-radius: 14px; padding: 10px 16px; color: white; box-shadow: 0 6px 18px rgba(30, 27, 75, 0.16); margin-bottom: 8px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;">
                        
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.15); display: grid; place-items: center; border: 1px solid rgba(255,255,255,0.25); flex-shrink: 0;">
                                <i data-lucide="shield-check" style="width: 20px; height: 20px; color: #a5b4fc;"></i>
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <h1 style="font-size: 16.5px; font-weight: 800; margin: 0; letter-spacing: -0.01em; color: #ffffff;">Organización de Grado</h1>
                                    <span style="background: rgba(245, 158, 11, 0.25); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.45); padding: 2px 8px; border-radius: 12px; font-size: 10.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
                                        <i data-lucide="award" style="width: 11px; height: 11px;"></i> Maestro(a) Guía
                                    </span>
                                    <span style="background: rgba(255, 255, 255, 0.14); color: #e0e7ff; padding: 2px 8px; border-radius: 12px; font-size: 10.5px; font-weight: 700;">
                                        ${asignadosCount}/8 Cargos
                                    </span>
                                </div>
                                <div style="font-size: 11.5px; color: #c7d2fe; margin-top: 1px;">
                                    <strong>${course.grado || ''} "${course.seccion || '1'}"</strong> · ${course.asignatura || ''} · ${course.centroEducativo || 'Centro Educativo'} · <strong>${students.length} Alumnos en Matrícula</strong>
                                </div>
                            </div>
                        </div>

                        <!-- SELECTOR DE DIRECTIVA (TABS INTEGRADOS) + ACCIONES -->
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <div style="background: rgba(15, 23, 42, 0.35); padding: 3px; border-radius: 10px; display: inline-flex; gap: 4px; border: 1px solid rgba(255,255,255,0.15);">
                                <button class="a360-btn" onclick="Views.OrganizacionGrado.setTab('grado')"
                                        style="background: ${isGradoTab ? '#ffffff' : 'transparent'}; color: ${isGradoTab ? '#1e1b4b' : '#cbd5e1'}; border: none; border-radius: 7px; padding: 6px 12px; font-size: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; box-shadow: ${isGradoTab ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'};">
                                    <i data-lucide="graduation-cap" style="width: 14px; height: 14px; color: ${isGradoTab ? '#4f46e5' : '#94a3b8'};"></i>
                                    <span>Directiva de Grado</span>
                                </button>
                                <button class="a360-btn" onclick="Views.OrganizacionGrado.setTab('padres')"
                                        style="background: ${!isGradoTab ? '#ffffff' : 'transparent'}; color: ${!isGradoTab ? '#1e1b4b' : '#cbd5e1'}; border: none; border-radius: 7px; padding: 6px 12px; font-size: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; box-shadow: ${!isGradoTab ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'};">
                                    <i data-lucide="users" style="width: 14px; height: 14px; color: ${!isGradoTab ? '#4f46e5' : '#94a3b8'};"></i>
                                    <span>Directiva de Padres de Familia</span>
                                </button>
                            </div>

                            <button class="a360-btn" onclick="Views.OrganizacionGrado.imprimirActa()"
                                    title="Imprimir Acta y Nómina Oficial"
                                    style="background: rgba(255,255,255,0.14); color: white; border: 1px solid rgba(255,255,255,0.28); border-radius: 8px; padding: 6px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                                <i data-lucide="printer" style="width: 14px; height: 14px;"></i>
                                <span>Imprimir Acta</span>
                            </button>

                            <button class="a360-btn" onclick="Views.OrganizacionGrado.guardarManual()"
                                    style="background: #10b981; color: white; border: none; border-radius: 8px; padding: 6px 12px; font-size: 11.5px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);">
                                <i data-lucide="save" style="width: 14px; height: 14px;"></i>
                                <span>Guardar</span>
                            </button>

                            <button class="a360-btn" onclick="Views.OrganizacionGrado.limpiarTodo('${course.id}', '${this.activeTab}')"
                                    title="Restablecer esta tabla"
                                    style="background: rgba(239,68,68,0.2); color: #fecaca; border: 1px solid rgba(239,68,68,0.35); border-radius: 8px; padding: 6px 9px; font-size: 11.5px; cursor: pointer; display: inline-flex; align-items: center;">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </div>

                    <!-- CONTENEDOR DE LA TABLA -->
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(15,23,42,0.03);">
                        
                        <!-- SUB-ENCABEZADO INFORMATIVO COMPACTO -->
                        <div style="background: #f8fafc; padding: 6px 14px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isGradoTab ? '#4f46e5' : '#059669'};"></span>
                                <span style="font-size: 12.5px; font-weight: 800; color: #0f172a;">
                                    ${isGradoTab ? 'Directiva de Grado (Estudiantes)' : 'Directiva de Padres de Familia (Padres / Tutores de Matrícula)'}
                                </span>
                                <span style="font-size: 11.5px; color: #64748b;">
                                    — ${isGradoTab 
                                        ? 'Selecciona al estudiante desde la matrícula del grado para autocompletar sus datos.' 
                                        : 'Selecciona al padre/madre o encargado desde los datos de la matrícula del grado.'}
                                </span>
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: #4338ca; display: inline-flex; align-items: center; gap: 4px;">
                                <i data-lucide="check-circle-2" style="width: 13px; height: 13px; color: #10b981;"></i>
                                <span>Autoguardado activo</span>
                            </div>
                        </div>

                        <!-- TABLA OFICIAL: N°, Nombre (Alumno o Padre), DNI, Cargo, Teléfono, Dirección -->
                        <div style="overflow-x: auto;">
                            <table class="org-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                                <thead>
                                    <tr>
                                        <th style="width: 38px; text-align: center;">N°</th>
                                        <th style="min-width: 280px;">Nombre (${isGradoTab ? 'Alumno Matriculado' : 'Padre / Madre / Encargado'})</th>
                                        <th style="width: 145px;">DNI</th>
                                        <th style="width: 145px;">Cargo</th>
                                        <th style="width: 125px;">Teléfono</th>
                                        <th style="min-width: 180px;">Dirección</th>
                                        <th style="width: 44px; text-align: center;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${currentList.map((item, index) => this.renderTableRow(item, index, isGradoTab, students, course.id)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }

        const container = document.getElementById('content');
        if (container) {
            container.innerHTML = html;
        }
        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 20);

        return html;
    },

    renderTableRow(item, index, isGradoTab, students, courseId) {
        const rowBg = index % 2 === 0 ? '#ffffff' : '#fcfcfd';
        const hasAssigned = Boolean((item.nombre || '').trim() || item.studentId);

        // Construir opciones para UN SOLO CAMPO selector alimentado de la matrícula del grado
        let selectorOptionsHtml = '';
        const matchedStudent = students.find(s => s.id === item.studentId);

        if (isGradoTab) {
            // Si hay un nombre guardado manualmente que no coincide con un studentId, mostrarlo como opción seleccionada
            const customOption = (!matchedStudent && (item.nombre || '').trim())
                ? `<option value="__custom__" selected>${this.escapeHtml(item.nombre)}</option>`
                : '';

            selectorOptionsHtml = `
                <option value="">-- Seleccionar alumno de la matrícula (${students.length}) --</option>
                ${customOption}
                ${students.map(s => `
                    <option value="${s.id}" ${item.studentId === s.id ? 'selected' : ''}>
                        ${this.escapeHtml(s.nombreCompleto || 'Sin nombre')}
                    </option>
                `).join('')}
            `;
        } else {
            // Directiva de Padres: selector único con los nombres de los padres de los datos de matrícula del grado
            const customOption = (!matchedStudent && (item.nombre || '').trim())
                ? `<option value="__custom__" selected>${this.escapeHtml(item.nombre)}</option>`
                : '';

            selectorOptionsHtml = `
                <option value="">-- Seleccionar padre/encargado de la matrícula (${students.length}) --</option>
                ${customOption}
                ${students.map(s => {
                    const padreNombre = (s.datosPadre || s.contactoResponsable || '').trim();
                    const tienePadre = padreNombre && padreNombre !== '-';
                    const isSelected = item.studentId === s.id;
                    // Si está seleccionado y tiene un nombre personalizado guardado, mostrarlo
                    const displayLabel = isSelected && (item.nombre || '').trim()
                        ? `${item.nombre} (${s.nombreCompleto})`
                        : (tienePadre ? `${padreNombre} (${s.nombreCompleto})` : `Encargado(a) de ${s.nombreCompleto}`);
                    return `
                        <option value="${s.id}" ${isSelected ? 'selected' : ''}>
                            ${this.escapeHtml(displayLabel)}
                        </option>
                    `;
                }).join('')}
            `;
        }

        return `
            <tr style="background: ${rowBg}; transition: background 0.12s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='${rowBg}'">
                <!-- 1. N° (de orden) -->
                <td style="text-align: center; font-weight: 800; font-size: 12px; color: #64748b;">
                    ${item.orden || (index + 1)}
                </td>

                <!-- 2. Nombre (Alumno o Padre): UN SOLO CAMPO SELECTOR -->
                <td>
                    <select class="org-select-single ${hasAssigned ? 'is-assigned' : ''}"
                            onchange="Views.OrganizacionGrado.onSelectFromMatricula('${courseId}', '${this.activeTab}', ${index}, this.value)">
                        ${selectorOptionsHtml}
                    </select>
                </td>

                <!-- 3. DNI -->
                <td>
                    <input type="text" 
                           class="org-input" 
                           value="${this.escapeHtml(item.dni || '')}" 
                           placeholder="0801-1990-00000"
                           oninput="Views.OrganizacionGrado.onFieldChange('${courseId}', '${this.activeTab}', ${index}, 'dni', this.value)"
                           style="font-family: monospace; font-size: 12px;" />
                </td>

                <!-- 4. Cargo -->
                <td>
                    ${this.getCargoBadge(item.cargo)}
                </td>

                <!-- 5. Teléfono -->
                <td>
                    <input type="text" 
                           class="org-input" 
                           value="${this.escapeHtml(item.telefono || '')}" 
                           placeholder="9999-9999"
                           oninput="Views.OrganizacionGrado.onFieldChange('${courseId}', '${this.activeTab}', ${index}, 'telefono', this.value)" />
                </td>

                <!-- 6. Dirección -->
                <td>
                    <input type="text" 
                           class="org-input" 
                           value="${this.escapeHtml(item.direccion || '')}" 
                           placeholder="Barrio / Colonia / Aldea"
                           oninput="Views.OrganizacionGrado.onFieldChange('${courseId}', '${this.activeTab}', ${index}, 'direccion', this.value)" />
                </td>

                <!-- Acciones -->
                <td style="text-align: center;">
                    <button class="a360-btn" title="Limpiar este cargo"
                            onclick="Views.OrganizacionGrado.limpiarFila('${courseId}', '${this.activeTab}', ${index})"
                            style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 6px; font-size: 11px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                        <i data-lucide="eraser" style="width: 13px; height: 13px;"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    onFieldChange(courseId, tab, index, field, value) {
        const data = this.getData(courseId);
        if (data[tab] && data[tab][index]) {
            data[tab][index][field] = value;
            const studentId = data[tab][index].studentId;

            // Sincronizar con el registro de matrícula del estudiante si está vinculado
            if (studentId && typeof Store !== 'undefined' && Store.update) {
                if (tab === 'padres') {
                    if (field === 'dni') {
                        Store.update('estudiantes', studentId, { dniPadre: value.trim() });
                    } else if (field === 'telefono' && value.trim()) {
                        Store.update('estudiantes', studentId, { telefono: value.trim() });
                    } else if (field === 'direccion' && value.trim()) {
                        Store.update('estudiantes', studentId, { domicilio: value.trim(), direccion: value.trim() });
                    }
                } else if (tab === 'grado') {
                    if (field === 'dni' && value.trim()) {
                        Store.update('estudiantes', studentId, { identidad: value.trim() });
                    } else if (field === 'telefono' && value.trim()) {
                        Store.update('estudiantes', studentId, { telefono: value.trim() });
                    } else if (field === 'direccion' && value.trim()) {
                        Store.update('estudiantes', studentId, { domicilio: value.trim(), direccion: value.trim() });
                    }
                }
            }

            this.saveData(courseId, data);
        }
    },

    onSelectFromMatricula(courseId, tab, index, studentId) {
        const data = this.getData(courseId);
        const students = (typeof Store !== 'undefined' && Store.getStudentsByCourse) ? Store.getStudentsByCourse(courseId) : [];
        const student = students.find(s => s.id === studentId);

        if (!data[tab] || !data[tab][index]) return;

        if (student) {
            data[tab][index].studentId = student.id;

            if (tab === 'grado') {
                data[tab][index].nombre = student.nombreCompleto || '';
                data[tab][index].dni = student.identidad || student.dni || '';
                data[tab][index].telefono = student.telefono || student.telefonoTutor || '';
                data[tab][index].direccion = student.domicilio || student.direccion || '';
            } else {
                // Directiva de Padres de Familia: tomar nombre del padre/encargado de la matrícula
                const padreNombre = (student.datosPadre || student.contactoResponsable || '').trim();
                const tienePadre = padreNombre && padreNombre !== '-';
                data[tab][index].nombre = tienePadre ? padreNombre : `Encargado(a) de ${student.nombreCompleto}`;
                data[tab][index].dni = student.dniPadre || student.identidadPadre || '';
                data[tab][index].telefono = student.telefono || student.telefonoTutor || '';
                data[tab][index].direccion = student.domicilio || student.direccion || '';
            }

            this.saveData(courseId, data);
            this.render();

            if (window.UI && UI.toast) {
                UI.toast(`Asignado a ${data[tab][index].cargo}: ${data[tab][index].nombre}`, 'info');
            }
        } else {
            data[tab][index].studentId = '';
            data[tab][index].nombre = '';
            data[tab][index].dni = '';
            data[tab][index].telefono = '';
            data[tab][index].direccion = '';
            this.saveData(courseId, data);
            this.render();
        }
    },

    limpiarFila(courseId, tab, index) {
        const data = this.getData(courseId);
        if (data[tab] && data[tab][index]) {
            data[tab][index].nombre = '';
            data[tab][index].dni = '';
            data[tab][index].telefono = '';
            data[tab][index].direccion = '';
            data[tab][index].studentId = '';
            this.saveData(courseId, data);
            this.render();
            if (window.UI && UI.toast) UI.toast('Cargo limpiado', 'info');
        }
    },

    limpiarTodo(courseId, tab) {
        if (confirm(`¿Estás seguro de restablecer todos los cargos de la ${tab === 'grado' ? 'Directiva de Grado' : 'Directiva de Padres de Familia'}?`)) {
            const data = this.getData(courseId);
            data[tab] = this.cargos.map((cargo, idx) => ({
                orden: idx + 1,
                cargo,
                nombre: '',
                dni: '',
                telefono: '',
                direccion: '',
                studentId: ''
            }));
            this.saveData(courseId, data);
            this.render();
            if (window.UI && UI.toast) UI.toast('Tabla restablecida', 'warning');
        }
    },

    guardarManual() {
        const course = this.getActiveCourse();
        if (course) {
            if (typeof Store !== 'undefined' && Store.save) Store.save();
            if (window.UI && UI.toast) {
                UI.toast('Organización de Grado guardada exitosamente', 'success');
                if (UI.playSound) UI.playSound('success');
            }
        }
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    getNonGuiaHtml(activeCourse, cursosGuia) {
        return `
            <div class="fade-in" style="max-width: 820px; margin: 24px auto; padding: 16px; font-family: 'Outfit', sans-serif;">
                <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 24px; padding: 36px 28px; text-align: center; box-shadow: 0 10px 30px rgba(15,23,42,0.06);">
                    <div style="width: 68px; height: 68px; border-radius: 20px; background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); color: #6d28d9; display: grid; place-items: center; margin: 0 auto 16px auto; box-shadow: 0 6px 18px rgba(109,40,217,0.18);">
                        <i data-lucide="shield-alert" style="width: 34px; height: 34px;"></i>
                    </div>

                    <span style="font-size: 11px; font-weight: 800; background: #ede9fe; color: #6d28d9; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 10px;">
                        Módulo Exclusivo de Maestro(a) Guía
                    </span>
                    
                    <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.01em;">
                        Organización de Grado no disponible para este curso
                    </h2>
                    
                    <p style="font-size: 14px; color: #64748b; margin: 0 auto 20px auto; max-width: 580px; line-height: 1.55;">
                        La conformación y registro de la <strong>Directiva de Grado</strong> y la <strong>Directiva de Padres de Familia</strong> son funciones vinculadas <strong>únicamente</strong> al grado y sección del cual usted es Maestro(a) Guía.
                    </p>

                    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 18px; display: inline-flex; align-items: center; gap: 12px; margin-bottom: 24px; text-align: left; max-width: 90%;">
                        <div style="width: 36px; height: 36px; border-radius: 10px; background: #fee2e2; color: #dc2626; display: grid; place-items: center; flex-shrink: 0;">
                            <i data-lucide="lock" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <div style="font-size: 10.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Curso actual sin tutoría de guía:</div>
                            <div style="font-size: 13.5px; font-weight: 800; color: #1e293b;">
                                ${activeCourse ? `${activeCourse.asignatura} (${activeCourse.grado} "${activeCourse.seccion || '1'}") · ${activeCourse.centroEducativo || 'Centro Educativo'}` : 'Sin curso seleccionado'}
                            </div>
                        </div>
                    </div>

                    ${cursosGuia.length === 0 ? `
                        <div style="border-top: 1.5px dashed #e2e8f0; padding-top: 20px; margin-bottom: 18px;">
                            <p style="font-size: 13px; color: #64748b; margin: 0 0 14px 0;">
                                Aún no ha configurado de qué grado es Maestro(a) Guía en sus Ajustes Generales.
                            </p>
                            <button class="a360-btn" onclick="Router.navigate('config')" style="background: #4f46e5; color: white; border: none; border-radius: 12px; padding: 11px 22px; font-size: 13px; font-weight: 800; cursor: pointer;">
                                <i data-lucide="settings" style="width: 15px; height: 15px;"></i> Configurar Grados Guía en Ajustes
                            </button>
                        </div>
                    ` : ``}

                    <div style="display: flex; justify-content: center; gap: 10px; margin-top: 12px; flex-wrap: wrap;">
                        <button class="a360-btn" onclick="Router.navigate('config')" style="background: #f8fafc; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer;">
                            <i data-lucide="settings" style="width: 14px; height: 14px;"></i> Ajustes Generales
                        </button>
                        <button class="a360-btn" onclick="Router.navigate('panel')" style="background: #f8fafc; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer;">
                            <i data-lucide="home" style="width: 14px; height: 14px;"></i> Centro de Control
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    imprimirActa() {
        const course = this.getActiveCourse();
        if (!course) return;

        const data = this.getData(course.id);
        const docente = (typeof Store !== 'undefined' && Store.data && Store.data.perfilDocente) ? Store.data.perfilDocente : {};
        const year = (typeof Store !== 'undefined' && Store.data && Store.data.anioLectivo) ? Store.data.anioLectivo : new Date().getFullYear();

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor permite ventanas emergentes para imprimir la nómina.');
            return;
        }

        const buildTable = (title, list, personLabel) => `
            <div style="margin-bottom: 26px;">
                <h3 style="font-size: 14px; font-weight: 800; color: #1e1b4b; border-bottom: 2px solid #4338ca; padding-bottom: 4px; margin: 0 0 8px 0; text-transform: uppercase;">
                    ${title}
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="border: 1px solid #94a3b8; padding: 6px; width: 28px; text-align: center;">N°</th>
                            <th style="border: 1px solid #94a3b8; padding: 6px; text-align: left;">Nombre (${personLabel})</th>
                            <th style="border: 1px solid #94a3b8; padding: 6px; width: 115px; text-align: center;">DNI</th>
                            <th style="border: 1px solid #94a3b8; padding: 6px; width: 115px; text-align: left;">Cargo</th>
                            <th style="border: 1px solid #94a3b8; padding: 6px; width: 95px; text-align: center;">Teléfono</th>
                            <th style="border: 1px solid #94a3b8; padding: 6px; text-align: left;">Dirección</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.map((item, idx) => `
                            <tr>
                                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-weight: bold;">${item.orden || (idx + 1)}</td>
                                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: 600;">${item.nombre || '------------------------------------'}</td>
                                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; font-family: monospace;">${item.dni || '-------------'}</td>
                                <td style="border: 1px solid #cbd5e1; padding: 6px; font-weight: bold; color: #1e293b;">${item.cargo}</td>
                                <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${item.telefono || '---------'}</td>
                                <td style="border: 1px solid #cbd5e1; padding: 6px;">${item.direccion || '---------------------------------'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Organización de Grado - ${course.grado} "${course.seccion || '1'}"</title>
                <style>
                    @page { size: letter portrait; margin: 14mm; }
                    body { font-family: 'Arial', sans-serif; color: #0f172a; margin: 0; padding: 0; }
                    .header { text-align: center; margin-bottom: 18px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
                    .signatures { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                    .sign-box { width: 30%; text-align: center; font-size: 11px; }
                    .sign-line { border-top: 1.5px solid #000; margin-top: 38px; margin-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin: 0; font-size: 16px; text-transform: uppercase;">República de Honduras · Secretaría de Educación</h2>
                    <h1 style="margin: 4px 0; font-size: 18px; color: #1e1b4b;">${course.centroEducativo || 'CENTRO EDUCATIVO'}</h1>
                    <div style="font-size: 12.5px; font-weight: bold; color: #334155; margin-top: 4px;">
                        ACTA DE ORGANIZACIÓN DE GRADO · AÑO LECTIVO ${year}
                    </div>
                    <div style="font-size: 11.5px; color: #475569; margin-top: 3px;">
                        Grado: <strong>${course.grado}</strong> &nbsp;|&nbsp; Sección: <strong>"${course.seccion || '1'}"</strong> &nbsp;|&nbsp; Jornada: <strong>${course.jornada || 'Matutina'}</strong> &nbsp;|&nbsp; Maestro(a) Guía: <strong>${docente.nombre || 'Docente Titular'}</strong>
                    </div>
                </div>

                ${buildTable('1. Directiva de Grado (Estudiantes)', data.grado, 'Alumno')}
                ${buildTable('2. Directiva de Padres de Familia', data.padres, 'Padre / Madre / Encargado')}

                <div class="signatures">
                    <div class="sign-box">
                        <div class="sign-line"></div>
                        <strong>${data.grado[0].nombre || 'Presidente(a) de Grado'}</strong><br>
                        Presidente(a) Directiva de Grado
                    </div>
                    <div class="sign-box">
                        <div class="sign-line"></div>
                        <strong>${data.padres[0].nombre || 'Presidente(a) APF de Sección'}</strong><br>
                        Presidente(a) Directiva de Padres
                    </div>
                    <div class="sign-box">
                        <div class="sign-line"></div>
                        <strong>${docente.nombre || 'Maestro(a) Guía'}</strong><br>
                        Maestro(a) Guía / V° B°
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
};
