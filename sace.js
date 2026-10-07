/**
 * MÓDULO: INTEGRACIÓN SACE (Secretaría de Educación de Honduras)
 * Versión 2.3 (Offline Safe Export - Auto-vincular por Nombre, Padding Fijo y Completo)
 * Este módulo gestiona de manera offline y segura la lectura, vinculación por identidad,
 * verificación de datos y exportación de plantillas Excel oficiales de SACE.
 */

Views.Sace = {
    activeStep: 1, // Pasos: 1: Descargar, 2: Importar, 3: Vincular alumnos, 4: Verificar datos, 5: Revisar, 6: Exportar
    selectedFile: null,
    workbook: null,
    sheetName: null,
    fileType: null, // 'notas' | 'personalidad' | 'unknown'
    detectedSubject: '',
    detectedSection: '',
    detectedGrade: '',
    detectedCenter: '',
    
    // Selectores del formulario
    selectedCourseId: '',
    selectedParcialId: 'p1', // 'p1' | 'p2' | 'p3' | 'p4'
    
    // Vinculación de alumnos
    matchedStudents: [],
    unmatchedSaceStudents: [],
    unmatchedLocalStudents: [],
    duplicateSaceStudents: [],
    emptyIdentitySaceStudents: [],
    manualLinks: {}, // saceIdentidad -> localId
    
    // Datos editables de personalidad (Persistencia local)
    personalityData: {}, // studentId -> { p1: { puntualidad, espiritu, orden, sociabilidad, moralidad }, p2: ... }

    init() {
        this.activeStep = 1;
        this.selectedFile = null;
        this.workbook = null;
        this.sheetName = null;
        this.fileType = null;
        this.hasAttendance = false;
        this.columnMap = null;
        this.detectedSubject = '';
        this.detectedSection = '';
        this.detectedGrade = '';
        this.detectedCenter = '';
        this.subjectMismatch = false;
        this.subjectMismatchError = '';
        this.gradeMismatchWarning = '';
        this.selectedCourseId = Store.data.activeCourseId || '';
        this.selectedParcialId = 'p1';
        this.matchedStudents = [];
        this.unmatchedSaceStudents = [];
        this.unmatchedLocalStudents = [];
        this.duplicateSaceStudents = [];
        this.emptyIdentitySaceStudents = [];
        this.manualLinks = {};
        this.personalityData = {};
        
        if (this.selectedCourseId) {
            this.loadPersonalityData();
        }
    },

    cleanID(id) {
        const cleaned = String(id || '').replace(/[^\d]/g, '').trim();
        if (!cleaned) return '';
        if (cleaned.length > 0 && cleaned.length < 13) {
            return cleaned.padStart(13, '0');
        }
        return cleaned;
    },

    getSimilarityScore(nameA, nameB) {
        const normalize = (str) => {
            return String(str || '')
                .toLowerCase()
                .replace(/á/g, 'a')
                .replace(/é/g, 'e')
                .replace(/í/g, 'i')
                .replace(/ó/g, 'o')
                .replace(/ú/g, 'u')
                .replace(/ñ/g, 'n')
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const strA = normalize(nameA);
        const strB = normalize(nameB);

        if (strA === strB) return 1.0;

        const wordsA = strA.split(' ').filter(w => w.length > 1).sort();
        const wordsB = strB.split(' ').filter(w => w.length > 1).sort();

        if (wordsA.length === 0 || wordsB.length === 0) return 0;

        // Si el conjunto de palabras es idéntico (nombres invertidos ej: "Castillo Rodríguez Alexa" vs "Alexa Castillo Rodríguez")
        if (wordsA.join(' ') === wordsB.join(' ')) return 1.0;

        const setB = new Set(wordsB);
        const intersection = wordsA.filter(w => setB.has(w));
        if (intersection.length === 0) return 0;

        const minLen = Math.min(wordsA.length, wordsB.length);
        const maxLen = Math.max(wordsA.length, wordsB.length);

        const minOverlap = intersection.length / minLen;
        const maxOverlap = intersection.length / maxLen;

        return (minOverlap * 0.7) + (maxOverlap * 0.3);
    },

    getHistory() {
        const raw = localStorage.getItem('sace_export_history');
        return raw ? JSON.parse(raw) : [];
    },

    saveHistory(entry) {
        const history = this.getHistory();
        history.unshift(entry);
        localStorage.setItem('sace_export_history', JSON.stringify(history.slice(0, 15))); // Guardar últimas 15
    },

    loadPersonalityData() {
        if (!this.selectedCourseId) return;
        const key = `sace_personality_v2_${this.selectedCourseId}`;
        const raw = localStorage.getItem(key);
        this.personalityData = raw ? JSON.parse(raw) : {};
    },

    savePersonalityData() {
        if (!this.selectedCourseId) return;
        const key = `sace_personality_v2_${this.selectedCourseId}`;
        localStorage.setItem(key, JSON.stringify(this.personalityData));
    },

    getPersonalityTraits(studentId, parcialId) {
        if (!this.personalityData[studentId]) {
            this.personalityData[studentId] = {};
        }
        if (!this.personalityData[studentId][parcialId]) {
            // Valores por defecto
            this.personalityData[studentId][parcialId] = {
                puntualidad: 4,
                espiritu: 4,
                orden: 4,
                sociabilidad: 4,
                moralidad: 4
            };
        }
        return this.personalityData[studentId][parcialId];
    },

    updatePersonalityTrait(studentId, parcialId, field, value) {
        const traits = this.getPersonalityTraits(studentId, parcialId);
        traits[field] = parseInt(value, 10);
        this.savePersonalityData();
    },

    render() {
        const contentHtml = this.renderStep1();
        return `
            <div class="sace-wrap fade-in" style="max-width: 1000px; margin: 0 auto; padding: 20px; font-family: var(--font-main);">
                <div id="sace-step-container">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    onMount() {
        if (window.lucide) window.lucide.createIcons();
        this.setupEventListeners();
    },

    setupEventListeners() {
        const dropzone = document.getElementById('sace-dropzone');
        const fileInput = document.getElementById('sace-file-input');

        if (dropzone && fileInput) {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--primary)';
                dropzone.style.background = 'rgba(0, 200, 83, 0.03)';
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.style.borderColor = '#cbd5e1';
                dropzone.style.background = 'transparent';
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.style.borderColor = '#cbd5e1';
                dropzone.style.background = 'transparent';
                
                if (e.dataTransfer.files.length) {
                    this.handleFileSelection(e.dataTransfer.files[0]);
                }
            });

            dropzone.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    this.handleFileSelection(e.target.files[0]);
                }
            });
        }
    },

    // ────────────────────────────────────────────────────────────────────────
    // PASO 1: Descargar
    // ────────────────────────────────────────────────────────────────────────
    generateDirectSaceFile(courseId, parcialId, macroType) {
        if (!courseId) {
            UI.toast('Por favor, seleccione un curso.', 'warning');
            return;
        }

        const course = Store.get('cursos').find(c => c.id === courseId);
        if (!course) {
            UI.toast('Curso local no encontrado.', 'error');
            return;
        }

        const students = Store.getStudentsByCourse(course.id) || [];
        if (students.length === 0) {
            UI.toast('El curso seleccionado no tiene alumnos matriculados.', 'warning');
            return;
        }

        UI.toast('Generando plantilla oficial SACE en 1 Clic...', 'info');

        try {
            const config = Store.data.configAcademica || {};
            const centerName = (course.centroEducativo || config.centro || 'CENTRO EDUCATIVO').toUpperCase();
            const centerCode = (course.codigoCentro || '050300022B09').toUpperCase();
            const gradoStr = `${course.grado || '7'} GRADO`.toUpperCase();
            const seccionStr = String(course.seccion || '1');
            const jornadaStr = (course.jornada || 'VESPERTINA').toUpperCase();
            const asignaturaStr = (course.asignatura || 'ESPAÑOL (COMUNICACIÓN)').toUpperCase();

            const parcialStrMap = { p1: 'PARCIAL I', p2: 'PARCIAL II', p3: 'PARCIAL III', p4: 'PARCIAL IV', all: 'PARCIAL I' };
            const pLabel = parcialStrMap[parcialId] || 'PARCIAL I';

            const wb = XLSX.utils.book_new();
            const sheetData = [];

            if (macroType === 'personalidad') {
                sheetData.push(['Por favor llene las celdas de personalidad de los alumnos siguiendo la Escala:', null, null, null, 'INFORMACIÓN']);
                sheetData.push(['4:Sobresaliente', null, null, null, `CENTRO: ( ${centerCode} ) - ${centerName}`]);
                sheetData.push(['3:Muy Bueno', null, null, null, 'MODALIDAD: 0 | NO APLICA']);
                sheetData.push(['2:Bueno', null, null, null, `CURSO: ${gradoStr}`]);
                sheetData.push(['Nota: La opción "No Satisfactorio" ha dejado de utilizarse.', null, null, null, `SECCIÓN: ${seccionStr}`]);
                sheetData.push([]);
                sheetData.push(['INFORMACIÓN DEL ALUMNO', null, null, null, `PERSONALIDAD (${pLabel})`]);
                sheetData.push(['No', 'TIPO ID', 'IDENTIDAD', 'NOMBRE', 'PUNTUALIDAD', 'ESPÍRITU DE TRABAJO', 'ORDEN Y PRESENTACIÓN', 'SOCIABILIDAD', 'MORALIDAD']);

                students.forEach((st, idx) => {
                    const traits = this.getPersonalityTraits(st.id, parcialId);
                    sheetData.push([
                        idx + 1,
                        'HND',
                        this.cleanID(st.identidad) || st.identidad || '',
                        (st.nombreCompleto || '').toUpperCase(),
                        Number(traits.puntualidad || 4),
                        Number(traits.espiritu || 4),
                        Number(traits.orden || 4),
                        Number(traits.sociabilidad || 4),
                        Number(traits.moralidad || 4)
                    ]);
                });
            } else if (macroType === 'notas_solas') {
                sheetData.push([`${centerCode} | ${centerName}`]);
                sheetData.push(['MODALIDAD: NO APLICA']);
                sheetData.push([`${gradoStr} SECCIÓN ${seccionStr}`]);
                sheetData.push([`JORNADA ${jornadaStr}`]);
                sheetData.push([`${asignaturaStr}`]);
                sheetData.push(['DOCUMENTO', 'IDENTIDAD', 'NOMBRE', 'PARCIAL I', 'PARCIAL II', 'PARCIAL III', 'PARCIAL IV', 'RECUPERACIÓN']);
                sheetData.push([null, null, null, 'NOTA TOTAL', 'NOTA TOTAL', 'NOTA TOTAL', 'NOTA TOTAL', null]);

                students.forEach(st => {
                    const gr = this.calculateStudentGrades(st.id, course.id);
                    sheetData.push([
                        'HND',
                        this.cleanID(st.identidad) || st.identidad || '',
                        (st.nombreCompleto || '').toUpperCase(),
                        gr.p1_nt !== '' ? Number(gr.p1_nt) : '',
                        gr.p2_nt !== '' ? Number(gr.p2_nt) : '',
                        gr.p3_nt !== '' ? Number(gr.p3_nt) : '',
                        gr.p4_nt !== '' ? Number(gr.p4_nt) : '',
                        gr.recuperacion !== '' ? Number(gr.recuperacion) : ''
                    ]);
                });
            } else {
                sheetData.push([`${centerCode} | ${centerName}`]);
                sheetData.push(['MODALIDAD: NO APLICA']);
                sheetData.push([`${gradoStr} SECCIÓN ${seccionStr}`]);
                sheetData.push([`JORNADA ${jornadaStr}`]);
                sheetData.push([`${asignaturaStr}`]);
                sheetData.push(['DOCUMENTO', 'IDENTIDAD', 'NOMBRE', 'PARCIAL I', null, 'PARCIAL II', null, 'PARCIAL III', null, 'PARCIAL IV', null, 'RECUPERACIÓN']);
                sheetData.push([null, null, null, 'INASISTENCIAS', 'NOTA TOTAL', 'INASISTENCIAS', 'NOTA TOTAL', 'INASISTENCIAS', 'NOTA TOTAL', 'INASISTENCIAS', 'NOTA TOTAL', null]);

                students.forEach(st => {
                    const gr = this.calculateStudentGrades(st.id, course.id);
                    sheetData.push([
                        'HND',
                        this.cleanID(st.identidad) || st.identidad || '',
                        (st.nombreCompleto || '').toUpperCase(),
                        gr.p1_in !== '' ? Number(gr.p1_in) : '',
                        gr.p1_nt !== '' ? Number(gr.p1_nt) : '',
                        gr.p2_in !== '' ? Number(gr.p2_in) : '',
                        gr.p2_nt !== '' ? Number(gr.p2_nt) : '',
                        gr.p3_in !== '' ? Number(gr.p3_in) : '',
                        gr.p3_nt !== '' ? Number(gr.p3_nt) : '',
                        gr.p4_in !== '' ? Number(gr.p4_in) : '',
                        gr.p4_nt !== '' ? Number(gr.p4_nt) : '',
                        gr.recuperacion !== '' ? Number(gr.recuperacion) : ''
                    ]);
                });
            }

            const sheet = XLSX.utils.aoa_to_sheet(sheetData);

            const merges = [];
            if (macroType === 'personalidad') {
                merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: 8 } });
                merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, { s: { r: 1, c: 4 }, e: { r: 1, c: 8 } });
                merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, { s: { r: 2, c: 4 }, e: { r: 2, c: 8 } });
                merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, { s: { r: 3, c: 4 }, e: { r: 3, c: 8 } });
                merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 8 } });
                merges.push({ s: { r: 5, c: 0 }, e: { r: 5, c: 8 } });
                merges.push({ s: { r: 6, c: 0 }, e: { r: 6, c: 3 } }, { s: { r: 6, c: 4 }, e: { r: 6, c: 8 } });
            } else if (macroType === 'notas_solas') {
                merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });
                merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 7 } });
                merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 7 } });
                merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 7 } });
                merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 7 } });
                merges.push({ s: { r: 5, c: 0 }, e: { r: 6, c: 0 } });
                merges.push({ s: { r: 5, c: 1 }, e: { r: 6, c: 1 } });
                merges.push({ s: { r: 5, c: 2 }, e: { r: 6, c: 2 } });
                merges.push({ s: { r: 5, c: 7 }, e: { r: 6, c: 7 } });
            } else {
                merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } });
                merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 11 } });
                merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 11 } });
                merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: 11 } });
                merges.push({ s: { r: 4, c: 0 }, e: { r: 4, c: 11 } });
                merges.push({ s: { r: 5, c: 3 }, e: { r: 5, c: 4 } });
                merges.push({ s: { r: 5, c: 5 }, e: { r: 5, c: 6 } });
                merges.push({ s: { r: 5, c: 7 }, e: { r: 5, c: 8 } });
                merges.push({ s: { r: 5, c: 9 }, e: { r: 5, c: 10 } });
                merges.push({ s: { r: 5, c: 0 }, e: { r: 6, c: 0 } });
                merges.push({ s: { r: 5, c: 1 }, e: { r: 6, c: 1 } });
                merges.push({ s: { r: 5, c: 2 }, e: { r: 6, c: 2 } });
                merges.push({ s: { r: 5, c: 11 }, e: { r: 6, c: 11 } });
            }
            sheet['!merges'] = merges;

            const sheetName = '1';
            XLSX.utils.book_append_sheet(wb, sheet, sheetName);

            const outBuffer = XLSX.write(wb, { bookType: 'biff8', type: 'array' });
            const typeSlug = macroType === 'personalidad' ? 'PERSONALIDAD' : (macroType === 'notas_solas' ? 'NOTAS_SOLAS' : 'NOTAS_INASISTENCIAS');
            const filename = `SACE_${typeSlug}_${(course.grado || 'Grado').replace(/\s+/g, '_')}_SEC_${course.seccion}_${parcialId.toUpperCase()}.xls`;

            if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
                const blob = new Blob([outBuffer], { type: 'application/vnd.ms-excel' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            this.saveHistory({
                fecha: new Date().toISOString(),
                tipo: macroType.includes('notas') ? 'notas' : 'personalidad',
                curso: `${course.grado}° - Sec. ${course.seccion}`,
                parcial: parcialId,
                alumnosProcesados: students.length,
                nombreArchivo: filename
            });

            UI.toast(`¡Plantilla SACE generada exitosamente! ${filename}`, 'success');
        } catch (err) {
            console.error(err);
            UI.toast('Error al generar la plantilla SACE: ' + err.message, 'error');
        }
    },

    // ────────────────────────────────────────────────────────────────────────
    // MÉTODOS DE COPIADO INTELIGENTE AL PORTAPAPELES (0% MODIFICACIÓN BINARIA)
    // ────────────────────────────────────────────────────────────────────────
    copyToClipboard(text, successMsg) {
        if (!text) {
            UI.toast('No hay datos para copiar.', 'warning');
            return;
        }

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                UI.toast(successMsg, 'success');
            }).catch(err => {
                this.fallbackCopyToClipboard(text, successMsg);
            });
        } else {
            this.fallbackCopyToClipboard(text, successMsg);
        }
    },

    fallbackCopyToClipboard(text, successMsg) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            UI.toast(successMsg, 'success');
        } catch (err) {
            UI.toast('No se pudo copiar automáticamente. Por favor seleccione y copie los datos.', 'error');
        }
        document.body.removeChild(textarea);
    },

    getCourseStudentList() {
        if (!this.selectedCourseId) return [];
        const course = Store.get('cursos').find(c => c.id === this.selectedCourseId);
        if (!course) return [];

        const students = Store.getStudentsByCourse(course.id) || [];
        // Ordenar alfabéticamente por nombre completo (estándar SACE)
        return students.sort((a, b) => (a.nombreCompleto || '').localeCompare(b.nombreCompleto || ''));
    },

    copyBothColumns() {
        const students = this.getCourseStudentList();
        if (students.length === 0) {
            UI.toast('No hay estudiantes matriculados en el curso seleccionado.', 'warning');
            return;
        }

        const lines = students.map(st => {
            const gr = this.calculateStudentGrades(st.id, this.selectedCourseId);
            let inas = '';
            let nota = '';

            if (this.selectedParcialId === 'p1') { inas = gr.p1_in; nota = gr.p1_nt; }
            else if (this.selectedParcialId === 'p2') { inas = gr.p2_in; nota = gr.p2_nt; }
            else if (this.selectedParcialId === 'p3') { inas = gr.p3_in; nota = gr.p3_nt; }
            else if (this.selectedParcialId === 'p4') { inas = gr.p4_in; nota = gr.p4_nt; }
            else { inas = gr.p1_in; nota = gr.p1_nt; }

            const inasVal = inas !== '' && inas !== undefined ? inas : '';
            const notaVal = nota !== '' && nota !== undefined ? nota : '';
            return `${inasVal}\t${notaVal}`;
        });

        const tsvText = lines.join('\n');
        this.copyToClipboard(tsvText, `📋 ¡Faltas y Notas de ${students.length} alumnos copiadas! Ubícate en la celda D8 en Excel y presiona Ctrl + V.`);
    },

    copyGradesOnly() {
        const students = this.getCourseStudentList();
        if (students.length === 0) {
            UI.toast('No hay estudiantes matriculados en el curso seleccionado.', 'warning');
            return;
        }

        const lines = students.map(st => {
            const gr = this.calculateStudentGrades(st.id, this.selectedCourseId);
            let nota = '';

            if (this.selectedParcialId === 'p1') nota = gr.p1_nt;
            else if (this.selectedParcialId === 'p2') nota = gr.p2_nt;
            else if (this.selectedParcialId === 'p3') nota = gr.p3_nt;
            else if (this.selectedParcialId === 'p4') nota = gr.p4_nt;
            else nota = gr.p1_nt;

            return `${nota !== '' && nota !== undefined ? nota : ''}`;
        });

        const tsvText = lines.join('\n');
        this.copyToClipboard(tsvText, `📝 ¡Calificaciones de ${students.length} alumnos copiadas! Ubícate en la celda E8 en Excel y presiona Ctrl + V.`);
    },

    copyAbsencesOnly() {
        const students = this.getCourseStudentList();
        if (students.length === 0) {
            UI.toast('No hay estudiantes matriculados en el curso seleccionado.', 'warning');
            return;
        }

        const lines = students.map(st => {
            const gr = this.calculateStudentGrades(st.id, this.selectedCourseId);
            let inas = '';

            if (this.selectedParcialId === 'p1') inas = gr.p1_in;
            else if (this.selectedParcialId === 'p2') inas = gr.p2_in;
            else if (this.selectedParcialId === 'p3') inas = gr.p3_in;
            else if (this.selectedParcialId === 'p4') inas = gr.p4_in;
            else inas = gr.p1_in;

            return `${inas !== '' && inas !== undefined ? inas : ''}`;
        });

        const tsvText = lines.join('\n');
        this.copyToClipboard(tsvText, `🗓️ ¡Inasistencias por fecha de ${students.length} alumnos copiadas! Ubícate en la celda D8 en Excel y presiona Ctrl + V.`);
    },

    copyPersonalityTraits() {
        const students = this.getCourseStudentList();
        if (students.length === 0) {
            UI.toast('No hay estudiantes matriculados en el curso seleccionado.', 'warning');
            return;
        }

        const parcialId = this.selectedParcialId === 'all' ? 'p1' : this.selectedParcialId;
        const lines = students.map(st => {
            const p = this.getPersonalityTraits(st.id, parcialId);
            return `${p.puntualidad || 4}\t${p.espiritu || 4}\t${p.orden || 4}\t${p.sociabilidad || 4}\t${p.moralidad || 4}`;
        });

        const tsvText = lines.join('\n');
        this.copyToClipboard(tsvText, `🌟 ¡Conducta/Personalidad (5 columnas) copiada! Ubícate en la celda E9 en Excel y presiona Ctrl + V.`);
    },

    renderCourseOptions(selectedId = null) {
        const courses = Store.get('cursos') || [];
        const centers = {};
        let distinctCenters = 0;

        courses.forEach(c => {
            const centerName = c.centroEducativo ? c.centroEducativo.trim() : '';
            if (centerName) {
                if (!centers[centerName]) {
                    centers[centerName] = [];
                    distinctCenters++;
                }
                centers[centerName].push(c);
            }
        });

        if (distinctCenters > 1) {
            return Object.keys(centers).map(center => `
                <optgroup label="🏫 ${center}">
                    ${centers[center].map(c => {
                        const cleanGrado = String(c.grado || '').replace(/[°º]/g, '').trim();
                        const isSelected = selectedId === c.id ? 'selected' : '';
                        return `<option value="${c.id}" ${isSelected}>${c.asignatura} (${cleanGrado}° - Sec. ${c.seccion})</option>`;
                    }).join('')}
                </optgroup>
            `).join('');
        }

        return courses.map(c => {
            const cleanGrado = String(c.grado || '').replace(/[°º]/g, '').trim();
            const centerInfo = c.centroEducativo ? ` - [${c.centroEducativo}]` : '';
            const isSelected = selectedId === c.id ? 'selected' : '';
            return `<option value="${c.id}" ${isSelected}>${c.asignatura} (${cleanGrado}° - Sec. ${c.seccion})${centerInfo}</option>`;
        }).join('');
    },

    renderStep1() {
        const courses = Store.get('cursos') || [];
        
        if (!this.selectedCourseId && Store.data.activeCourseId) {
            this.selectedCourseId = Store.data.activeCourseId;
            this.loadPersonalityData();
        } else if (!this.selectedCourseId && courses.length > 0) {
            this.selectedCourseId = courses[0].id;
            this.loadPersonalityData();
        }

        const activeCourse = courses.find(c => c.id === this.selectedCourseId);
        const courseOptionsHtml = this.renderCourseOptions(this.selectedCourseId);
        
        const realParciales = this.selectedCourseId ? Store.getParcialByCourse(this.selectedCourseId) : [];
        const activeParcialObj = realParciales.find(p => p.id === this.selectedParcialId);
        
        let dateRangeStr = '';
        if (activeParcialObj && activeParcialObj.fechaInicio && activeParcialObj.fechaFin) {
            dateRangeStr = `📅 Rango de fechas del parcial: <strong>${activeParcialObj.fechaInicio}</strong> al <strong>${activeParcialObj.fechaFin}</strong> (las inasistencias se contabilizan automáticamente en este período)`;
        } else if (this.selectedParcialId === 'all') {
            dateRangeStr = '📅 Llenado anual: calcula inasistencias en el rango de fechas individual de cada parcial.';
        } else {
            dateRangeStr = '💡 En la Configuración Académica puedes definir las fechas de inicio y fin de cada parcial para filtrar automáticamente las faltas de asistencia por período.';
        }

        const students = this.getCourseStudentList();
        const totalStudents = students.length;

        // Renderizar filas de la tabla previa en pantalla
        const tableRows = students.map((st, idx) => {
            const gr = this.calculateStudentGrades(st.id, this.selectedCourseId);
            let inas = '';
            let nota = '';

            if (this.selectedParcialId === 'p1') { inas = gr.p1_in; nota = gr.p1_nt; }
            else if (this.selectedParcialId === 'p2') { inas = gr.p2_in; nota = gr.p2_nt; }
            else if (this.selectedParcialId === 'p3') { inas = gr.p3_in; nota = gr.p3_nt; }
            else if (this.selectedParcialId === 'p4') { inas = gr.p4_in; nota = gr.p4_nt; }
            else { inas = gr.p1_in; nota = gr.p1_nt; }

            const gradeDisplay = nota !== '' && nota !== undefined ? nota : '—';
            const inasDisplay = inas !== '' && inas !== undefined && inas > 0 ? inas : '0';

            let desempeno = 'Avanzado (91-100%)';
            let badgeColor = 'var(--primary)';
            let badgeBg = 'rgba(0, 200, 83, 0.08)';

            const nNum = Number(nota);
            if (isNaN(nNum) || nota === '') {
                desempeno = 'Sin Calificación';
                badgeColor = '#64748b';
                badgeBg = '#f1f5f9';
            } else if (nNum < 60) {
                desempeno = 'Insuficiente (0-59%)';
                badgeColor = '#dc2626';
                badgeBg = 'rgba(220, 38, 38, 0.08)';
            } else if (nNum <= 69) {
                desempeno = 'Básico (60-69%)';
                badgeColor = '#f59e0b';
                badgeBg = 'rgba(245, 158, 11, 0.08)';
            } else if (nNum <= 80) {
                desempeno = 'Satisfactorio (70-80%)';
                badgeColor = 'var(--info)';
                badgeBg = 'rgba(41, 121, 255, 0.08)';
            } else if (nNum <= 90) {
                desempeno = 'Muy Satisfactorio (81-90%)';
                badgeColor = 'var(--brand-purple)';
                badgeBg = 'rgba(123, 31, 162, 0.08)';
            }

            return `
                <tr style="border-bottom: 1px solid var(--border-soft); background: var(--surface);">
                    <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: var(--text-muted); width: 40px;">${idx + 1}</td>
                    <td style="padding: 10px 14px; font-weight: 700; font-family: monospace; color: var(--text-main);">${st.identidad || 'SIN DNI'}</td>
                    <td style="padding: 10px 14px; font-weight: 600; color: var(--text-main);">${(st.nombreCompleto || '').toUpperCase()}</td>
                    <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: var(--text-main); font-size: 13px;">${inasDisplay}</td>
                    <td style="padding: 10px 14px; text-align: center; font-weight: 800; color: var(--primary); font-size: 14px;">${gradeDisplay}</td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; color: ${badgeColor}; background: ${badgeBg}; display: inline-block;">${desempeno}</span>
                    </td>
                </tr>
            `;
        }).join('');

        const isFileLoaded = !!this.selectedFile;
        const isUnknown = this.fileType === 'unknown';
        const totalLocalStudents = activeCourse ? (Store.getStudentsByCourse(activeCourse.id) || []).length : 0;
        const matchedCount = this.matchedStudents.length;

        let fileStatusCard = '';
        if (isFileLoaded) {
            if (isUnknown) {
                fileStatusCard = `
                    <div style="background: rgba(229, 57, 73, 0.05); border: 1px solid rgba(229, 57, 73, 0.2); border-radius: var(--radius-md); padding: 18px; display: flex; align-items: center; gap: 14px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(229, 57, 73, 0.1); color: var(--danger); display: grid; place-items: center; flex-shrink: 0;">
                            <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--text-main);">Archivo no reconocido</h4>
                            <p style="margin: 3px 0 0; font-size: 12px; color: var(--text-muted);">
                                El archivo subido no coincide con una plantilla oficial SACE de calificaciones o personalidad. Por favor suba un archivo oficial descargado del portal SACE.
                            </p>
                        </div>
                    </div>
                `;
            } else if (this.subjectMismatch) {
                fileStatusCard = `
                    <div style="background: rgba(220, 38, 38, 0.05); border: 1.5px solid rgba(220, 38, 38, 0.35); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 14px;">
                        <div style="display: flex; align-items: flex-start; gap: 14px;">
                            <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(220, 38, 38, 0.1); color: #dc2626; display: grid; place-items: center; flex-shrink: 0;">
                                <i data-lucide="shield-alert" style="width: 22px; height: 22px;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #dc2626;">⛔ BLOQUEO DE SEGURIDAD SACE: ASIGNATURA INCOMPATIBLE</h4>
                                <p style="margin: 4px 0 0; font-size: 12.5px; color: var(--text-main); line-height: 1.5;">
                                    ${this.subjectMismatchError}
                                </p>
                                <p style="margin: 8px 0 0; font-size: 11.5px; font-weight: 700; color: #b91c1c;">
                                    💡 Solución: Seleccione arriba el curso correspondiente a <strong>${this.detectedSubject}</strong> o suba la plantilla descargada para <strong>${activeCourse ? activeCourse.asignatura : ''}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const typeLabel = this.fileType === 'notas' ? '📊 Plantilla SACE: Notas e Inasistencias' : '🌟 Plantilla SACE: Conducta / Personalidad';
                const typeBadgeBg = this.fileType === 'notas' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(123, 31, 162, 0.1)';
                const typeBadgeColor = this.fileType === 'notas' ? 'var(--primary)' : '#7b1fa2';
                
                const parcialText = this.selectedParcialId === 'p1' ? 'I Parcial' :
                                    this.selectedParcialId === 'p2' ? 'II Parcial' :
                                    this.selectedParcialId === 'p3' ? 'III Parcial' :
                                    this.selectedParcialId === 'p4' ? 'IV Parcial' : 'Todos los Parciales (Anual)';

                fileStatusCard = `
                    <div style="background: rgba(0, 200, 83, 0.04); border: 1.5px solid rgba(0, 200, 83, 0.3); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                            <div>
                                <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing:0.04em;">Plantilla Cargada y Vinculada</span>
                                <div style="font-size: 14px; font-weight: 800; color: var(--text-main); font-family: monospace; margin-top: 2px;">
                                    ${this.selectedFile.name}
                                </div>
                            </div>
                            <span style="font-size: 11px; padding: 4px 12px; background: ${typeBadgeBg}; border: 1px solid ${typeBadgeColor}; border-radius: 99px; color: ${typeBadgeColor}; font-weight: 800;">
                                ${typeLabel}
                            </span>
                        </div>

                        ${this.gradeMismatchWarning ? `
                            <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 11.5px; color: #b45309; display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="alert-triangle" style="width: 14px; flex-shrink: 0;"></i>
                                <span>${this.gradeMismatchWarning}</span>
                            </div>
                        ` : ''}

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; background: #ffffff; padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-soft); font-size: 12.5px;">
                            <div>👥 <strong>Vinculación:</strong> <span style="color: var(--primary); font-weight: 800;">${matchedCount} / ${totalLocalStudents} alumnos</span></div>
                            <div>📋 <strong>Período:</strong> <span style="color: var(--text-main); font-weight: 700;">${parcialText}</span></div>
                            <div>🗓️ <strong>Inasistencias:</strong> <span style="color: var(--text-main); font-weight: 600;">Filtradas por fecha</span></div>
                        </div>

                        <!-- Botón Principal de Acción 1-Clic -->
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px;">
                            <button onclick="Views.Sace.generateFilledFile()" class="btn btn-primary" style="flex: 1; min-width: 240px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 14px 20px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 14px rgba(0, 200, 83, 0.3);">
                                <i data-lucide="zap" style="width: 18px; height: 18px;"></i> ⚡ Llenar y Descargar Plantilla SACE (.xls)
                            </button>
                        </div>
                    </div>
                `;
            }
        }

        return `
            <div class="card" style="border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-soft); padding: 32px; display: flex; flex-direction: column; gap: 24px;">
                <!-- Encabezado Principal -->
                <div style="text-align: center; max-width: 720px; margin: 0 auto;">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(0, 200, 83, 0.08); color: var(--primary); display: grid; place-items: center; margin: 0 auto 16px;">
                        <i data-lucide="shield-check" style="width: 28px; height: 28px;"></i>
                    </div>
                    <h2 class="text-xl font-bold" style="color: var(--text-main); margin: 0;">Módulo de Integración SACE</h2>
                    <p class="text-muted text-sm mt-2" style="line-height: 1.5;">
                        Transfiere inasistencias y notas a tu plantilla oficial descargada de SACE con <strong>0% modificación de propiedades o formato binario de la macro</strong>.
                    </p>
                </div>

                <!-- Selección de Curso Activo y Parcial -->
                <div style="background: var(--bg-muted); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 22px; display: flex; flex-direction: column; gap: 18px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div style="grid-column: span 2;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label class="font-bold text-xs uppercase tracking-wider text-muted" style="margin:0;">🏫 Curso Activo:</label>
                                <span style="font-size: 11px; font-weight: 700; color: var(--primary);">
                                    ${totalStudents} alumnos en sistema
                                </span>
                            </div>
                            <select id="sace-active-course" class="a360-input" style="width: 100%; font-size: 13.5px; height: 40px; font-weight: 600;" onchange="Views.Sace.selectedCourseId = this.value; Views.Sace.loadPersonalityData(); if (Views.Sace.workbook) Views.Sace.recalculateMatches(); Router.render();">
                                ${courseOptionsHtml}
                            </select>
                        </div>

                        <div style="grid-column: span 2;">
                            <label class="font-bold text-xs uppercase tracking-wider text-muted" style="display: block; margin-bottom: 6px;">
                                📅 Parcial a Exportar:
                            </label>
                            <select id="sace-parcial-select" class="a360-input" style="width: 100%; font-size: 13px; height: 38px;" onchange="Views.Sace.selectedParcialId = this.value; Router.render();">
                                <option value="p1" ${this.selectedParcialId === 'p1' ? 'selected' : ''}>I Parcial</option>
                                <option value="p2" ${this.selectedParcialId === 'p2' ? 'selected' : ''}>II Parcial</option>
                                <option value="p3" ${this.selectedParcialId === 'p3' ? 'selected' : ''}>III Parcial</option>
                                <option value="p4" ${this.selectedParcialId === 'p4' ? 'selected' : ''}>IV Parcial</option>
                                <option value="all" ${this.selectedParcialId === 'all' ? 'selected' : ''}>✨ Todos los Parciales (Llenado Anual Completo + Recuperación)</option>
                            </select>
                            <p style="font-size: 11.5px; color: var(--text-muted); margin: 6px 0 0; line-height: 1.4;">
                                ${dateRangeStr}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- MÉTODO RECOMENDADO Y 100% FIEL A SACE: COPIADO AL PORTAPAPELES -->
                <div style="background: rgba(0, 200, 83, 0.04); border: 2px solid rgba(0, 200, 83, 0.35); border-radius: var(--radius-md); padding: 24px; display: flex; flex-direction: column; gap: 18px; box-shadow: 0 4px 16px rgba(0, 200, 83, 0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div style="font-weight: 800; font-size: 15px; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="check-circle-2" style="width: 20px; height: 20px;"></i>
                            Método 100% Seguro: Pegado Directo al Excel Oficial (Ctrl + V)
                        </div>
                        <span style="font-size: 10.5px; font-weight: 800; padding: 4px 10px; background: rgba(0, 200, 83, 0.15); color: var(--primary); border-radius: 99px; border: 1px solid rgba(0, 200, 83, 0.4);">
                            ⭐ Recomendado (0% Modificación de Propiedades)
                        </span>
                    </div>

                    <p style="margin: 0; font-size: 12.5px; color: var(--text-main); line-height: 1.5;">
                        Haz clic en un botón para copiar los datos en orden alfabético SACE, abre tu archivo descargado en Excel, selecciona la celda de inicio y presiona <strong>Ctrl + V</strong>. Tu archivo mantendrá el 100% de sus propiedades y formato original.
                    </p>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
                        <button onclick="Views.Sace.copyBothColumns()" class="btn btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; font-weight: 800; font-size: 13.5px; box-shadow: 0 4px 14px rgba(0, 200, 83, 0.3);">
                            <i data-lucide="copy" style="width: 18px;"></i> 📋 Copiar Faltas + Notas (Pegar en D8)
                        </button>

                        <button onclick="Views.Sace.copyGradesOnly()" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; font-weight: 700; font-size: 13px;">
                            <i data-lucide="file-text" style="width: 16px;"></i> 📝 Copiar Solo Notas (Pegar en E8)
                        </button>

                        <button onclick="Views.Sace.copyAbsencesOnly()" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; font-weight: 700; font-size: 13px;">
                            <i data-lucide="calendar-check" style="width: 16px;"></i> 🗓️ Copiar Solo Faltas (Pegar en D8)
                        </button>

                        <button onclick="Views.Sace.copyPersonalityTraits()" class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 16px; font-weight: 700; font-size: 13px; color: #7b1fa2; border-color: rgba(123, 31, 162, 0.3);">
                            <i data-lucide="smile" style="width: 16px;"></i> 🌟 Copiar Conducta (Pegar en E9)
                        </button>
                    </div>

                    <!-- Paso a Paso Visual -->
                    <div style="background: #ffffff; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); padding: 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 11px; flex-shrink: 0;">1</span>
                            <span>Abre tu macro <strong>.xls</strong> descargada de SACE en Excel.</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 11px; flex-shrink: 0;">2</span>
                            <span>Haz clic en un botón de arriba y selecciona la celda <strong>D8</strong> o <strong>E8</strong>.</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 11px; flex-shrink: 0;">3</span>
                            <span>Presiona <strong>Ctrl + V</strong>. Guarda en Excel y sube a SACE.</span>
                        </div>
                    </div>
                </div>

                <!-- MÉTODO OPCIONAL DE LLENADO DIRECTO DE ARCHIVO (DROPZONE) -->
                <div style="background: var(--bg-muted); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; gap: 14px;">
                    <div style="font-weight: 700; font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="file-up" style="width: 16px;"></i> Opción B: Inyección Directa en Archivo por Navegador
                    </div>

                    <div style="border: 2px dashed #cbd5e1; border-radius: var(--radius-md); padding: 24px 20px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 10px; background: ${isFileLoaded ? 'rgba(0, 200, 83, 0.02)' : '#ffffff'};" id="sace-dropzone">
                        <input type="file" id="sace-file-input" accept=".xls,.xlsx" style="display: none;" />
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: #f8fafc; border: 1px solid #e2e8f0; display: grid; place-items: center; color: var(--primary);">
                            <i data-lucide="upload-cloud" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-sm" style="margin: 0; color: var(--text-main);">
                                ${isFileLoaded ? 'Cambiar plantilla Excel cargada' : 'Arrastre aquí la macro Excel (.xls) descargada de SACE'}
                            </h4>
                            <p class="text-xs text-muted mt-1">O haga clic para seleccionarla desde su computadora</p>
                        </div>
                    </div>

                    ${fileStatusCard}
                </div>

                <!-- Matriz de Verificación de Datos en Pantalla -->
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h4 style="margin: 0; font-size: 13.5px; font-weight: 800; color: var(--text-main);">
                            📊 Vista Previa de Alumnos y Datos Calculados (${totalStudents})
                        </h4>
                        <span style="font-size: 11px; color: var(--text-muted);">
                            Orden alfabético exacto según norma SACE
                        </span>
                    </div>

                    <div style="overflow-x: auto; border: 1px solid var(--border-soft); border-radius: var(--radius-md); max-height: 380px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                            <thead style="background: var(--bg-muted); border-bottom: 2px solid var(--border-soft); position: sticky; top: 0; z-index: 10;">
                                <tr>
                                    <th style="padding: 10px 14px; color: var(--text-muted); font-weight: 700; width: 40px; text-align: center;">No.</th>
                                    <th style="padding: 10px 14px; color: var(--text-muted); font-weight: 700;">Identidad (DNI)</th>
                                    <th style="padding: 10px 14px; color: var(--text-muted); font-weight: 700;">Nombre del Estudiante</th>
                                    <th style="padding: 10px 14px; text-align: center; color: var(--text-muted); font-weight: 700;">Faltas (Parcial)</th>
                                    <th style="padding: 10px 14px; text-align: center; color: var(--text-muted); font-weight: 700;">Nota Total</th>
                                    <th style="padding: 10px 14px; text-align: center; color: var(--text-muted); font-weight: 700;">Desempeño</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows.length > 0 ? tableRows : `
                                    <tr>
                                        <td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted); font-style: italic;">
                                            No hay alumnos matriculados en el curso seleccionado.
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Enlace al portal SACE -->
                <div style="border-top: 1px solid var(--border-soft); padding-top: 20px; text-align: right;">
                    <a href="https://sace.se.gob.hn" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
                        Abrir Portal SACE (sace.se.gob.hn) <i data-lucide="external-link" style="width: 14px;"></i>
                    </a>
                </div>
            </div>
        `;
    },

    // ────────────────────────────────────────────────────────────────────────
    // PASO 2: Importar
    // ────────────────────────────────────────────────────────────────────────
    renderStep2() {
        const courses = Store.get('cursos') || [];
        const isFileLoaded = !!this.selectedFile;
        const isUnknown = this.fileType === 'unknown';
        
        let fileStatusCard = '';
        if (isFileLoaded) {
            if (isUnknown) {
                fileStatusCard = `
                    <div style="background: rgba(229, 57, 73, 0.05); border: 1px solid rgba(229, 57, 73, 0.2); border-radius: var(--radius-md); padding: 16px; display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(229, 57, 73, 0.1); color: var(--danger); display: grid; place-items: center; flex-shrink: 0;">
                            <i data-lucide="alert-triangle" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 13.5px; font-weight: 700; color: var(--text-main);">Archivo no reconocido</h4>
                            <p style="margin: 3px 0 0; font-size: 12px; color: var(--text-muted);">
                                El archivo subido no coincide con las plantillas de calificaciones ni de conducta de SACE. Por favor, suba un archivo oficial descargado del portal.
                            </p>
                        </div>
                    </div>
                `;
            } else {
                const badgeColor = this.fileType === 'notas' ? 'var(--primary)' : 'var(--brand-purple)';
                const badgeBg = this.fileType === 'notas' ? 'rgba(0,200,83,0.08)' : 'rgba(123,31,162,0.08)';
                const typeLabel = this.fileType === 'notas' ? 'Notas e inasistencias' : 'Personalidad / Conducta';
                
                fileStatusCard = `
                    <div style="background: var(--bg-muted); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; letter-spacing:0.03em;">Archivo Cargado</span>
                                <strong style="font-size: 13px; color: var(--text-main); font-family: monospace;">${this.selectedFile.name}</strong>
                            </div>
                            <span style="font-size: 11px; padding: 4px 10px; background: ${badgeBg}; border: 1px solid ${badgeColor}; border-radius: 99px; color: ${badgeColor}; font-weight: 700;">
                                ${typeLabel}
                            </span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; border-top: 1px solid var(--border-soft); padding-top: 10px;">
                            <div>🏫 <strong>Centro:</strong> <span style="color: var(--text-main); font-weight: 600;">${this.detectedCenter || 'No especificado'}</span></div>
                            <div>🎓 <strong>Grado / Sección:</strong> <span style="color: var(--text-main); font-weight: 600;">${this.detectedGrade || 'No especificado'} ${this.detectedSection ? `- Sec. ${this.detectedSection}` : ''}</span></div>
                            <div style="grid-column: span 2;">📖 <strong>Asignatura SACE:</strong> <span style="color: var(--text-main); font-weight: 600;">${this.detectedSubject || 'No especificado'}</span></div>
                        </div>
                    </div>

                    <!-- Configuración del curso y parcial a inyectar -->
                    <div class="border-t" style="border-color: var(--border-soft); padding-top: 16px; display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <label class="font-bold text-xs uppercase tracking-wider text-muted" style="margin: 0;">Curso Equivalente en Aula 360 HN:</label>
                                ${this.autoMatchedCourse ? `
                                    <span style="font-size: 10px; font-weight: 800; color: var(--primary); background: rgba(0, 200, 83, 0.08); padding: 2px 8px; border-radius: 99px; border: 1px solid rgba(0, 200, 83, 0.2); display: inline-flex; align-items: center; gap: 4px;">
                                        <i data-lucide="sparkles" style="width: 12px;"></i> Auto-detectado
                                    </span>
                                ` : ''}
                            </div>
                            <select id="sace-course-select" class="a360-input" style="width: 100%; font-size: 13px; height: 38px;" onchange="Views.Sace.selectedCourseId = this.value; Views.Sace.autoMatchedCourse = false; Views.Sace.loadPersonalityData(); Router.render();">
                                <option value="">-- Seleccionar curso registrado --</option>
                                ${this.renderCourseOptions(this.selectedCourseId)}
                            </select>
                        </div>

                        <div>
                            <label class="font-bold text-xs uppercase tracking-wider text-muted" style="display: block; margin-bottom: 6px;">Seleccionar Parcial a Llenar:</label>
                            <select id="sace-parcial-select" class="a360-input" style="width: 100%; font-size: 13px; height: 38px;" onchange="Views.Sace.selectedParcialId = this.value; Router.render();">
                                <option value="p1" ${this.selectedParcialId === 'p1' ? 'selected' : ''}>I Parcial</option>
                                <option value="p2" ${this.selectedParcialId === 'p2' ? 'selected' : ''}>II Parcial</option>
                                <option value="p3" ${this.selectedParcialId === 'p3' ? 'selected' : ''}>III Parcial</option>
                                <option value="p4" ${this.selectedParcialId === 'p4' ? 'selected' : ''}>IV Parcial</option>
                                ${this.fileType === 'notas' ? `<option value="all" ${this.selectedParcialId === 'all' ? 'selected' : ''}>✨ Todos los Parciales (Llenado Anual Completo + Recuperación)</option>` : ''}
                            </select>
                        </div>
                    </div>
                `;
            }
        }

        const isNextEnabled = isFileLoaded && !isUnknown && this.selectedCourseId !== '';

        return `
            <div class="card" style="border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-soft); padding: 32px; display: flex; flex-direction: column; gap: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="text-lg font-bold" style="margin: 0; color: var(--text-main);">Importar archivo descargado</h3>
                    <button onclick="Views.Sace.goToStep(1)" class="btn btn-sm" style="background: transparent; border: none; color: var(--text-muted); display: flex; align-items: center; gap: 6px; padding: 0;">
                        <i data-lucide="chevron-left" style="width: 16px;"></i> Atrás
                    </button>
                </div>

                <!-- Zona de Dropzone -->
                <div id="sace-dropzone" style="border: 2px dashed #cbd5e1; border-radius: var(--radius-md); padding: 36px 20px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 12px; background: ${isFileLoaded ? 'rgba(0, 200, 83, 0.01)' : 'transparent'};">
                    <input type="file" id="sace-file-input" accept=".xls,.xlsx" style="display: none;" />
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: #f8fafc; border: 1px solid #e2e8f0; display: grid; place-items: center; color: #64748b;">
                        <i data-lucide="upload-cloud" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm" style="margin: 0; color: var(--text-main);">
                            ${isFileLoaded ? 'Cambiar archivo Excel cargado' : 'Arrastre la plantilla Excel aquí'}
                        </h4>
                        <p class="text-xs text-muted mt-1">O haga clic para seleccionarla desde su dispositivo</p>
                    </div>
                    <span style="font-size: 10px; padding: 4px 10px; background: #f1f5f9; border-radius: 99px; font-weight: 700; color: #64748b; border: 1px solid #e2e8f0;">Soporta formatos .xls y .xlsx</span>
                </div>

                <!-- Tarjeta de Estado del archivo -->
                ${fileStatusCard}

                <!-- Botones de Navegación -->
                <div style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid var(--border-soft); padding-top: 20px;">
                    <button onclick="Views.Sace.goToStep(1)" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="arrow-left" style="width: 16px;"></i> Inicio
                    </button>
                    
                    <button onclick="Views.Sace.executeConciliation()" class="btn btn-primary" ${!isNextEnabled ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="display: inline-flex; align-items: center; gap: 6px;">
                        Siguiente: Vincular alumnos <i data-lucide="arrow-right" style="width: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // ────────────────────────────────────────────────────────────────────────
    // PASO 3: Vincular alumnos (Coincidencia de DNI + Auto-vincular por Nombre)
    // ────────────────────────────────────────────────────────────────────────
    renderStep3() {
        const totalSace = this.matchedStudents.length + this.unmatchedSaceStudents.length;
        const totalMatches = this.matchedStudents.filter(m => !m.warning && !m.matchedByName).length;
        const totalNameMatches = this.matchedStudents.filter(m => m.matchedByName).length;
        const totalWarnings = this.matchedStudents.filter(m => m.warning && !m.matchedByName).length;
        const totalUnmatchedSace = this.unmatchedSaceStudents.length;
        const totalDuplicates = this.duplicateSaceStudents.length;

        const linkedLocalIds = new Set(this.matchedStudents.map(m => m.localId));
        const availableLocalStudents = this.unmatchedLocalStudents.filter(st => !linkedLocalIds.has(st.id));

        return `
            <div class="card" style="border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-soft); padding: 32px; display: flex; flex-direction: column; gap: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 class="text-lg font-bold" style="margin: 0; color: var(--text-main);">Vincular alumnos</h3>
                        <p style="font-size:12px; color: var(--text-muted); margin: 3px 0 0;">Relacione a los alumnos del archivo SACE con sus registros locales usando su identidad.</p>
                    </div>
                    <button onclick="Views.Sace.goToStep(2)" class="btn btn-sm" style="background: transparent; border: none; color: var(--text-muted); display: flex; align-items: center; gap: 6px; padding:0;">
                        <i data-lucide="chevron-left" style="width: 16px;"></i> Atrás
                    </button>
                </div>

                <!-- Tarjetas de Estado (KPIs) -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr) !important; gap: 12px;" class="md:grid-cols-4">
                    <div style="background: #f8fafc; border: 1px solid var(--border-soft); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: var(--text-main);">${totalSace}</div>
                        <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-top:2px;">En plantilla SACE</div>
                    </div>
                    <div style="background: rgba(0, 200, 83, 0.04); border: 1px solid rgba(0, 200, 83, 0.15); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: var(--primary);">${totalMatches + totalNameMatches}</div>
                        <div style="font-size: 10px; color: var(--primary); text-transform: uppercase; font-weight: 700; margin-top:2px;">Vinculados (${totalNameMatches} por Nombre)</div>
                    </div>
                    <div style="background: rgba(245, 158, 11, 0.04); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">${totalWarnings}</div>
                        <div style="font-size: 10px; color: #f59e0b; text-transform: uppercase; font-weight: 700; margin-top:2px;">Diferente Nombre</div>
                    </div>
                    <div style="background: rgba(220, 38, 38, 0.04); border: 1px solid rgba(220, 38, 38, 0.15); border-radius: var(--radius-sm); padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: 800; color: #dc2626;">${totalUnmatchedSace}</div>
                        <div style="font-size: 10px; color: #dc2626; text-transform: uppercase; font-weight: 700; margin-top:2px;">No Vinculados</div>
                    </div>
                </div>

                ${totalDuplicates > 0 ? `
                    <div style="background: rgba(220, 38, 38, 0.04); border: 1px solid rgba(220, 38, 38, 0.15); border-radius: var(--radius-md); padding: 12px 16px; font-size: 12px; color: #dc2626; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="alert-octagon" style="width: 16px; flex-shrink: 0;"></i>
                        <span><strong>¡Atención!</strong> Se detectaron <strong>${totalDuplicates} identidades duplicadas</strong> en el Excel. Se recomienda verificar el archivo.</span>
                    </div>
                ` : ''}

                <!-- Mensaje aclaratorio de migración automática -->
                ${totalNameMatches > 0 ? `
                    <div style="background: rgba(123, 31, 162, 0.04); border: 1px solid rgba(123, 31, 162, 0.15); border-radius: var(--radius-md); padding: 12px 16px; font-size: 12px; color: #7b1fa2; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="sparkles" style="width: 16px; flex-shrink: 0; color: #7b1fa2;"></i>
                        <span>Se han auto-vinculado <strong>${totalNameMatches} alumnos por coincidencia de nombre</strong>. Aula 360 HN ha guardado sus números de identidad (DNI) para futuras exportaciones automáticas.</span>
                    </div>
                ` : ''}

                <!-- Tabla de Vinculación -->
                <div style="overflow-x: auto; border: 1px solid var(--border-soft); border-radius: var(--radius-md); max-height: 380px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
                        <thead style="background: var(--bg-muted); border-bottom: 2px solid var(--border-soft); position: sticky; top: 0; z-index: 10;">
                            <tr>
                                <th style="padding: 10px 16px; color: var(--text-muted); font-weight: 700;">Identidad (DNI)</th>
                                <th style="padding: 10px 16px; color: var(--text-muted); font-weight: 700;">Nombre en Plantilla SACE</th>
                                <th style="padding: 10px 16px; color: var(--text-muted); font-weight: 700;">Alumno en Aula 360 HN</th>
                                <th style="padding: 10px 16px; text-align: center; color: var(--text-muted); font-weight: 700; width: 140px;">Vinculación</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Vinculados Exitosamente (Automático por DNI, por Nombre o Manual) -->
                            ${this.matchedStudents.map(m => {
                                const badgeColor = m.warning ? '#f59e0b' : 'var(--primary)';
                                const badgeBg = m.warning ? 'rgba(245,158,11,0.06)' : 'rgba(0,200,83,0.06)';
                                const badgeBorder = m.warning ? 'rgba(245,158,11,0.2)' : 'rgba(0,200,83,0.2)';
                                const label = m.warning ? 'Alerta Nombre' : 'Vinculado';
                                
                                return `
                                    <tr style="border-bottom: 1px solid var(--border-soft); background: var(--surface);">
                                        <td style="padding: 10px 16px; font-weight: 700; color: var(--text-main); font-family: monospace;">${m.saceIdentidad}</td>
                                        <td style="padding: 10px 16px; color: var(--text-main);">${m.saceNombre}</td>
                                        <td style="padding: 10px 16px; color: var(--text-main); font-weight: 600;">
                                            ${m.localNombre}
                                            ${m.matchedByName ? ' <span style="font-size: 9px; font-weight: 700; color: #7b1fa2; background: rgba(123,31,162,0.08); padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(123,31,162,0.2);">Por Nombre</span>' : ''}
                                            ${m.manualLink ? ' <span style="font-size: 9px; font-weight: 700; color: var(--info); background: rgba(41,121,255,0.08); padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(41,121,255,0.2);">Manual</span>' : ''}
                                        </td>
                                        <td style="padding: 10px 16px; text-align: center;">
                                            <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; color: ${badgeColor}; background: ${badgeBg}; border: 1px solid ${badgeBorder}; display: inline-block; width: 100px;">${label}</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}

                            <!-- No Vinculados de SACE -->
                            ${this.unmatchedSaceStudents.map(u => {
                                const optionsHtml = availableLocalStudents.map(st => `
                                    <option value="${st.id}">${st.nombreCompleto}</option>
                                `).join('');
                                
                                return `
                                    <tr style="border-bottom: 1px solid var(--border-soft); background: rgba(220, 38, 38, 0.01);">
                                        <td style="padding: 10px 16px; font-weight: 700; color: var(--text-muted); font-family: monospace;">${u.identidad || 'Sin identidad'}</td>
                                        <td style="padding: 10px 16px; color: var(--text-main);">${u.nombre}</td>
                                        <td style="padding: 6px 16px;">
                                            <select class="a360-input" style="width: 100%; font-size: 11px; padding: 4px 8px; height: 28px; border-color: rgba(220,38,38,0.25);" onchange="Views.Sace.linkStudentManually('${u.identidad}', this.value)">
                                                <option value="">-- Vincular manualmente --</option>
                                                ${optionsHtml}
                                            </select>
                                        </td>
                                        <td style="padding: 10px 16px; text-align: center;">
                                            <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; color: #dc2626; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); display: inline-block; width: 100px;">No Vinculado</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Alumnos locales que no están en la plantilla -->
                ${this.unmatchedLocalStudents.length > 0 ? `
                    <div style="background: rgba(2, 132, 199, 0.04); border: 1px solid rgba(2, 132, 199, 0.15); border-radius: var(--radius-md); padding: 14px 18px; font-size: 12px; color: var(--text-soft); display: flex; flex-direction: column; gap: 6px;">
                        <span style="font-weight: 700; color: var(--info); display: flex; align-items: center; gap: 6px; margin:0;"><i data-lucide="info" style="width:14px;"></i> Alumnos en Aula 360 HN que no figuran en la plantilla Excel SACE:</span>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                            ${this.unmatchedLocalStudents.map(st => `
                                <span style="background: #ffffff; padding: 3px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-weight: 600; font-size: 11px;">${st.nombreCompleto}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Botones de Navegación -->
                <div style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid var(--border-soft); padding-top: 20px;">
                    <button onclick="Views.Sace.goToStep(2)" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="arrow-left" style="width: 16px;"></i> Cambiar plantilla
                    </button>
                    
                    <button onclick="Views.Sace.goToStep(4)" class="btn btn-primary" ${this.matchedStudents.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="display: inline-flex; align-items: center; gap: 6px;">
                        Siguiente: Verificar datos <i data-lucide="arrow-right" style="width: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // ────────────────────────────────────────────────────────────────────────
    // PASO 4: Verificar datos
    // ────────────────────────────────────────────────────────────────────────
    renderStep4() {
        const isNotas = this.fileType === 'notas';
        const parcialLabel = this.selectedParcialId === 'p1' ? 'I Parcial' :
                             this.selectedParcialId === 'p2' ? 'II Parcial' :
                             this.selectedParcialId === 'p3' ? 'III Parcial' :
                             this.selectedParcialId === 'p4' ? 'IV Parcial' : 'Todos los Parciales (Anual Completo)';
        
        let tableHeader = '';
        let tableRows = '';

        if (isNotas) {
            tableHeader = `
                <tr>
                    <th style="padding: 10px 16px; color: var(--text-muted); font-weight: 700;">Estudiante</th>
                    <th style="padding: 10px 16px; text-align: center; color: var(--text-muted); font-weight: 700; width: 25%;">Calificación Local</th>
                    <th style="padding: 10px 16px; text-align: center; color: var(--text-muted); font-weight: 700; width: 25%;">Inasistencias Locales</th>
                    <th style="padding: 10px 16px; text-align: center; color: var(--text-muted); font-weight: 700; width: 20%;">Validación</th>
                </tr>
            `;

            tableRows = this.matchedStudents.map(m => {
                const gr = m.gradesData || {};
                let gradeVal = '';
                let absVal = '';
                
                if (this.selectedParcialId === 'p1') { gradeVal = gr.p1_nt; absVal = gr.p1_in; }
                else if (this.selectedParcialId === 'p2') { gradeVal = gr.p2_nt; absVal = gr.p2_in; }
                else if (this.selectedParcialId === 'p3') { gradeVal = gr.p3_nt; absVal = gr.p3_in; }
                else if (this.selectedParcialId === 'p4') { gradeVal = gr.p4_nt; absVal = gr.p4_in; }
                else if (this.selectedParcialId === 'all') {
                    const gList = [gr.p1_nt, gr.p2_nt, gr.p3_nt, gr.p4_nt].filter(v => v !== '' && v !== undefined);
                    gradeVal = gList.length > 0 ? gList.join(' | ') : '';
                    const aList = [gr.p1_in, gr.p2_in, gr.p3_in, gr.p4_in].filter(v => v !== '' && v !== undefined && v > 0);
                    absVal = aList.length > 0 ? aList.reduce((sum, n) => sum + Number(n), 0) : 0;
                }

                const gradeDisplay = gradeVal !== '' && gradeVal !== undefined ? gradeVal : '—';
                const absDisplay = absVal !== '' && absVal !== undefined && absVal > 0 ? absVal : '0';

                let hasError = false;
                let validationLabel = 'Válido';
                let badgeColor = 'var(--primary)';
                let badgeBg = 'rgba(0,200,83,0.06)';
                
                if (gradeVal === '' || gradeVal === undefined) {
                    validationLabel = 'Sin Calificación';
                    badgeColor = '#f59e0b';
                    badgeBg = 'rgba(245,158,11,0.06)';
                } else if (this.selectedParcialId !== 'all' && (isNaN(Number(gradeVal)) || Number(gradeVal) < 0 || Number(gradeVal) > 100)) {
                    validationLabel = 'Calificación Inválida';
                    badgeColor = '#dc2626';
                    badgeBg = 'rgba(220,38,38,0.06)';
                    hasError = true;
                } else if (absVal !== '' && (isNaN(Number(absVal)) || Number(absVal) < 0)) {
                    validationLabel = 'Inasistencias Inválidas';
                    badgeColor = '#dc2626';
                    badgeBg = 'rgba(220,38,38,0.06)';
                    hasError = true;
                }

                return `
                    <tr style="border-bottom: 1px solid var(--border-soft); background: var(--surface);">
                        <td style="padding: 10px 16px;">
                            <div style="font-weight: bold; color: var(--text-main);">${m.saceNombre}</div>
                            <div style="font-size: 10px; color: var(--text-muted); font-family: monospace;">ID: ${m.saceIdentidad}</div>
                        </td>
                        <td style="padding: 10px 16px; text-align: center; font-size: 13px; font-weight: 700; color: var(--text-main);">${gradeDisplay}</td>
                        <td style="padding: 10px 16px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-main);">${absDisplay}</td>
                        <td style="padding: 10px 16px; text-align: center;">
                            <span style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; color: ${badgeColor}; background: ${badgeBg}; display: inline-block;">${validationLabel}</span>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tableHeader = `
                <tr>
                    <th style="padding: 10px 16px; color: var(--text-muted); font-weight: 700; width: 25%;">Estudiante</th>
                    <th style="padding: 10px 10px; text-align: center; color: var(--text-muted); font-weight: 700; font-size:11px;">Puntualidad</th>
                    <th style="padding: 10px 10px; text-align: center; color: var(--text-muted); font-weight: 700; font-size:11px;">Espíritu Trabajo</th>
                    <th style="padding: 10px 10px; text-align: center; color: var(--text-muted); font-weight: 700; font-size:11px;">Orden y Present.</th>
                    <th style="padding: 10px 10px; text-align: center; color: var(--text-muted); font-weight: 700; font-size:11px;">Sociabilidad</th>
                    <th style="padding: 10px 10px; text-align: center; color: var(--text-muted); font-weight: 700; font-size:11px;">Moralidad</th>
                </tr>
            `;

            tableRows = this.matchedStudents.map(m => {
                const sId = m.localId;
                const p = this.getPersonalityTraits(sId, this.selectedParcialId);

                const selectHtml = (field, currentVal) => `
                    <select class="a360-input" style="padding: 3px 6px; font-size: 11px; height: 28px; text-align: center; width: 100%; min-width: 90px;" onchange="Views.Sace.updatePersonalityTrait('${sId}', '${this.selectedParcialId}', '${field}', this.value)">
                        <option value="4" ${currentVal === 4 ? 'selected' : ''}>4 - Sobresaliente</option>
                        <option value="3" ${currentVal === 3 ? 'selected' : ''}>3 - Muy Bueno</option>
                        <option value="2" ${currentVal === 2 ? 'selected' : ''}>2 - Bueno</option>
                        <option value="1" ${currentVal === 1 ? 'selected' : ''}>1 - Debe Mejorar</option>
                    </select>
                `;

                return `
                    <tr style="border-bottom: 1px solid var(--border-soft); background: var(--surface);">
                        <td style="padding: 10px 16px;">
                            <div style="font-weight: bold; color: var(--text-main);">${m.saceNombre}</div>
                            <div style="font-size: 10px; color: var(--text-muted); font-family: monospace;">ID: ${m.saceIdentidad}</div>
                        </td>
                        <td style="padding: 6px 8px; text-align: center;">${selectHtml('puntualidad', p.puntualidad)}</td>
                        <td style="padding: 6px 8px; text-align: center;">${selectHtml('espiritu', p.espiritu)}</td>
                        <td style="padding: 6px 8px; text-align: center;">${selectHtml('orden', p.orden)}</td>
                        <td style="padding: 6px 8px; text-align: center;">${selectHtml('sociabilidad', p.sociabilidad)}</td>
                        <td style="padding: 6px 8px; text-align: center;">${selectHtml('moralidad', p.moralidad)}</td>
                    </tr>
                `;
            }).join('');
        }

        const noticeText = isNotas ?
            `Se inyectará la información de calificaciones e inasistencias únicamente en las columnas correspondientes al **${parcialLabel}** (Columnas del parcial seleccionado). El resto de los parciales y los datos identificativos permanecerán intactos.` :
            `Se llenarán únicamente los campos correspondientes a aspectos de conducta del **${parcialLabel}**. Todas las notas de personalidad han sido validadas en el rango permitido por SACE [1 a 4].`;

        return `
            <div class="card" style="border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-soft); padding: 32px; display: flex; flex-direction: column; gap: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 class="text-lg font-bold" style="margin: 0; color: var(--text-main);">Verificar datos a exportar</h3>
                        <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0 0;">
                            Revise los valores para el <strong>${parcialLabel}</strong> que se inyectarán en la plantilla.
                        </p>
                    </div>
                    <button onclick="Views.Sace.goToStep(3)" class="btn btn-sm" style="background: transparent; border: none; color: var(--text-muted); display: flex; align-items: center; gap: 6px; padding:0;">
                        <i data-lucide="chevron-left" style="width: 16px;"></i> Atrás
                    </button>
                </div>

                <!-- Tabla de Datos -->
                <div style="overflow-x: auto; border: 1px solid var(--border-soft); border-radius: var(--radius-md); max-height: 380px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                        <thead style="background: var(--bg-muted); border-bottom: 2px solid var(--border-soft); position: sticky; top: 0; z-index: 10;">
                            ${tableHeader}
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>

                <!-- Advertencia de Llenado Segmentado -->
                <div style="background: rgba(0, 200, 83, 0.04); border: 1px solid rgba(0, 200, 83, 0.15); border-radius: var(--radius-md); padding: 14px 18px; font-size: 12.5px; color: var(--text-soft); display: flex; align-items: flex-start; gap: 10px;">
                    <div style="width: 22px; height: 22px; border-radius: 50%; background: rgba(0,200,83,0.1); color: var(--primary); display: grid; place-items: center; flex-shrink: 0; margin-top:2px;">
                        <i data-lucide="check" style="width: 12px; height: 12px;"></i>
                    </div>
                    <span style="line-height: 1.5;">${noticeText}</span>
                </div>

                <!-- Botones de Navegación -->
                <div style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid var(--border-soft); padding-top: 20px;">
                    <button onclick="Views.Sace.goToStep(3)" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="arrow-left" style="width: 16px;"></i> Vincular alumnos
                    </button>
                    
                    <button onclick="Views.Sace.goToStep(5)" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
                        Siguiente: Revisar <i data-lucide="arrow-right" style="width: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // ────────────────────────────────────────────────────────────────────────
    // PASO 5: Revisar (Semáforo y Resumen)
    // ────────────────────────────────────────────────────────────────────────
    renderStep5() {
        const isNotas = this.fileType === 'notas';
        const parcialLabel = this.selectedParcialId === 'p1' ? 'I Parcial' :
                             this.selectedParcialId === 'p2' ? 'II Parcial' :
                             this.selectedParcialId === 'p3' ? 'III Parcial' :
                             this.selectedParcialId === 'p4' ? 'IV Parcial' : 'Todos los Parciales (Anual Completo)';
        
        const totalSace = this.matchedStudents.length + this.unmatchedSaceStudents.length;
        const linkedCount = this.matchedStudents.length;
        const unmatchedCount = this.unmatchedSaceStudents.length;
        const duplicatesCount = this.duplicateSaceStudents.length;

        let errorCount = 0;
        let warningCount = 0;
        const alertsList = [];

        // 1. Alertas de Vincular
        if (unmatchedCount > 0) {
            warningCount++;
            alertsList.push(`Hay ${unmatchedCount} alumnos en el archivo SACE que no se han vinculado con Aula 360 HN.`);
        }
        if (this.unmatchedLocalStudents.length > 0) {
            warningCount++;
            alertsList.push(`Hay ${this.unmatchedLocalStudents.length} alumnos locales que no aparecen en el archivo SACE.`);
        }
        if (duplicatesCount > 0) {
            errorCount++;
            alertsList.push(`El archivo SACE contiene ${duplicatesCount} identidades duplicadas.`);
        }
        if (this.emptyIdentitySaceStudents.length > 0) {
            warningCount++;
            alertsList.push(`Se detectaron ${this.emptyIdentitySaceStudents.length} alumnos con identidad vacía en el Excel.`);
        }

        const nameMismatches = this.matchedStudents.filter(m => m.warning).length;
        if (nameMismatches > 0) {
            warningCount++;
            alertsList.push(`Se detectaron ${nameMismatches} diferencias ortográficas leves en los nombres entre SACE y local.`);
        }

        let emptyGrades = 0;
        let invalidGrades = 0;
        let negativeAbsences = 0;
        let emptyPersonality = 0;
        let invalidPersonality = 0;

        this.matchedStudents.forEach(m => {
            if (isNotas) {
                const gr = m.gradesData || {};
                const checkParcials = this.selectedParcialId === 'all' ? ['p1', 'p2', 'p3', 'p4'] : [this.selectedParcialId];
                
                checkParcials.forEach(pId => {
                    const gradeVal = gr[`${pId}_nt`];
                    const absVal = gr[`${pId}_in`];

                    if (gradeVal === '' || gradeVal === undefined) {
                        emptyGrades++;
                    } else if (isNaN(Number(gradeVal)) || Number(gradeVal) < 0 || Number(gradeVal) > 100) {
                        invalidGrades++;
                    }

                    if (absVal !== '' && absVal !== undefined && Number(absVal) < 0) {
                        negativeAbsences++;
                    }
                });
            } else {
                const p = this.getPersonalityTraits(m.localId, this.selectedParcialId);
                const fields = ['puntualidad', 'espiritu', 'orden', 'sociabilidad', 'moralidad'];
                fields.forEach(f => {
                    const val = p[f];
                    if (val === undefined || val === '') {
                        emptyPersonality++;
                    } else if (isNaN(Number(val)) || Number(val) < 1 || Number(val) > 4) {
                        invalidPersonality++;
                    }
                });
            }
        });

        if (emptyGrades > 0) {
            warningCount++;
            alertsList.push(`Hay ${emptyGrades} estudiantes vinculados con calificaciones vacías para este parcial.`);
        }
        if (invalidGrades > 0) {
            errorCount++;
            alertsList.push(`Hay ${invalidGrades} calificaciones con valores fuera de escala (deben estar entre 0 y 100).`);
        }
        if (negativeAbsences > 0) {
            errorCount++;
            alertsList.push(`Hay ${negativeAbsences} registros con inasistencias negativas.`);
        }
        if (emptyPersonality > 0) {
            errorCount++;
            alertsList.push(`Hay ${emptyPersonality} valores de conducta sin ingresar.`);
        }
        if (invalidPersonality > 0) {
            errorCount++;
            alertsList.push(`Hay ${invalidPersonality} valores de rasgos fuera de la escala permitida (1 a 4).`);
        }

        let status = 'listo';
        let statusColor = 'var(--primary)';
        let statusBg = 'rgba(0, 200, 83, 0.05)';
        let statusBorder = 'rgba(0, 200, 83, 0.2)';
        let statusTitle = 'Listo para Exportar';
        let statusDesc = 'Todos los datos pasaron las validaciones de formato de SACE y el archivo se encuentra listo para su descarga.';
        let statusIcon = 'check-circle-2';

        if (linkedCount === 0 || errorCount > 0) {
            status = 'bloqueado';
            statusColor = '#dc2626';
            statusBg = 'rgba(220, 38, 38, 0.05)';
            statusBorder = 'rgba(220, 38, 38, 0.2)';
            statusTitle = 'Exportación Bloqueada';
            statusDesc = 'Se han encontrado errores críticos o no hay alumnos vinculados en la plantilla. Debe resolver estos problemas antes de generar el archivo.';
            statusIcon = 'alert-octagon';
        } else if (warningCount > 0) {
            status = 'revisar';
            statusColor = '#f59e0b';
            statusBg = 'rgba(245, 158, 11, 0.05)';
            statusBorder = 'rgba(245, 158, 11, 0.2)';
            statusTitle = 'Revisión Necesaria';
            statusDesc = 'El archivo contiene advertencias o datos incompletos. Le recomendamos verificar los detalles de abajo antes de descargar, pero puede proceder.';
            statusIcon = 'alert-triangle';
        }

        return `
            <div class="card" style="border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-soft); padding: 32px; display: flex; flex-direction: column; gap: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="text-lg font-bold" style="margin: 0; color: var(--text-main); margin: 0;">Revisión antes de exportar</h3>
                    <button onclick="Views.Sace.goToStep(4)" class="btn btn-sm" style="background: transparent; border: none; color: var(--text-muted); display: flex; align-items: center; gap: 6px; padding:0;">
                        <i data-lucide="chevron-left" style="width: 16px;"></i> Atrás
                    </button>
                </div>

                <!-- Semáforo de Estado -->
                <div style="background: ${statusBg}; border: 1px solid ${statusBorder}; border-radius: var(--radius-md); padding: 18px; display: flex; gap: 14px; align-items: flex-start; transition: all 0.3s ease;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #ffffff; color: ${statusColor}; display: grid; place-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); flex-shrink: 0;">
                        <i data-lucide="${statusIcon}" style="width: 22px; height: 22px;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: ${statusColor};">${statusTitle}</h4>
                        <p style="margin: 4px 0 0; font-size: 12.5px; color: var(--text-soft); line-height: 1.5;">${statusDesc}</p>
                    </div>
                </div>

                <!-- Resumen de Controles -->
                <div style="background: var(--bg-muted); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 18px;">
                    <h4 class="font-bold text-xs uppercase tracking-wider text-muted mb-4" style="margin-top:0;">Resumen General del Archivo:</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; font-size: 13px;">
                        <div>📂 <strong>Tipo de Archivo:</strong> <span style="color: var(--text-main); font-weight: 600;">${isNotas ? 'Notas e inasistencias' : 'Personalidad / Conducta'}</span></div>
                        <div>📋 <strong>Parcial Seleccionado:</strong> <span style="color: var(--text-main); font-weight: 600;">${parcialLabel}</span></div>
                        <div>👥 <strong>Total Alumnos en Plantilla SACE:</strong> <span style="color: var(--text-main); font-weight: 600;">${totalSace}</span></div>
                        <div>🔗 <strong>Alumnos Vinculados:</strong> <span style="color: var(--primary); font-weight: 700;">${linkedCount} / ${totalSace}</span></div>
                        <div>⚠️ <strong>Errores Críticos:</strong> <span style="color: #dc2626; font-weight: 700;">${errorCount}</span></div>
                        <div>💡 <strong>Advertencias:</strong> <span style="color: #f59e0b; font-weight: 700;">${warningCount}</span></div>
                    </div>
                </div>

                <!-- Listado de Advertencias y Errores -->
                ${alertsList.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <h4 class="font-bold text-xs uppercase tracking-wider text-muted mb-1" style="margin:0;">Mensajes y Observaciones encontradas:</h4>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${alertsList.map(alert => `
                                <div style="display: flex; gap: 8px; font-size: 12px; color: var(--text-soft); background: var(--bg-muted); padding: 8px 12px; border-radius: 8px; border-left: 3px solid ${alert.includes('duplicadas') || alert.includes('fuera de') || alert.includes('negativas') || alert.includes('sin ingresar') ? '#dc2626' : '#f59e0b'};">
                                    <i data-lucide="info" style="width: 14px; margin-top:2px; flex-shrink: 0; color: ${alert.includes('duplicadas') || alert.includes('fuera de') || alert.includes('negativas') || alert.includes('sin ingresar') ? '#dc2626' : '#f59e0b'};"></i>
                                    <span>${alert}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 12px; font-size:13px; color: var(--primary); background: rgba(0, 200, 83, 0.03); border: 1px dashed rgba(0, 200, 83, 0.2); border-radius: 8px;">
                        🎉 No se detectaron discrepancias ortográficas, inasistencias negativas ni valores vacíos. ¡El archivo está óptimo!
                    </div>
                `}

                <!-- Botones de Navegación -->
                <div style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid var(--border-soft); padding-top: 20px;">
                    <button onclick="Views.Sace.goToStep(4)" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="arrow-left" style="width: 16px;"></i> Verificar datos
                    </button>
                    
                    <button onclick="Views.Sace.generateFilledFile()" class="btn btn-primary" ${status === 'bloqueado' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} style="display: inline-flex; align-items: center; gap: 6px; background: var(--primary);">
                        Llenar y Generar Plantilla <i data-lucide="file-check" style="width: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // ────────────────────────────────────────────────────────────────────────
    // PASO 6: Exportar
    // ────────────────────────────────────────────────────────────────────────
    renderStep6() {
        return `
            <div class="card" style="border-radius: var(--radius-lg); background: var(--bg-card); border: 1px solid var(--border-soft); padding: 32px; display: flex; flex-direction: column; gap: 24px; text-align: center;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(0, 200, 83, 0.08); color: var(--primary); display: grid; place-items: center; margin: 0 auto;">
                    <i data-lucide="check-circle-2" style="width: 32px; height: 32px;"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold" style="margin: 0; color: var(--text-main);">Archivo Excel Generado</h3>
                    <p class="text-sm text-muted mt-2" style="line-height: 1.5; max-width: 500px; margin: 8px auto 0;">
                        Se ha completado una copia de la plantilla SACE inyectando la información correspondiente. Se conservaron todos los estilos, fórmulas e integridad de la macro original.
                    </p>
                </div>

                <div style="background: var(--bg-muted); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 18px; max-width: 480px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 12px; text-align: left; font-size:12.5px;">
                    <div>📂 <strong>Nombre del Archivo:</strong> <span style="font-family: monospace; color: var(--text-main); font-size:11px; font-weight: 700;">${this.outputFilename || 'SACE_EXPORT.xls'}</span></div>
                    <div>🎯 <strong>Total Alumnos Procesados:</strong> <span style="color: var(--text-main); font-weight: 700;">${this.matchedStudents.length} vinculados</span></div>
                    <div>📋 <strong>Periodo inyectado:</strong> <span style="color: var(--text-main); font-weight: 700;">${this.selectedParcialId === 'p1' ? 'I Parcial' : this.selectedParcialId === 'p2' ? 'II Parcial' : this.selectedParcialId === 'p3' ? 'III Parcial' : 'IV Parcial'}</span></div>
                </div>

                <div style="background: rgba(245, 158, 11, 0.04); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: var(--radius-md); padding: 14px; max-width: 480px; margin: 0 auto; font-size: 12px; color: var(--text-soft); display: flex; gap: 8px; text-align: left; line-height:1.5;">
                    <i data-lucide="alert-triangle" style="width: 16px; color: #f59e0b; flex-shrink: 0; margin-top:2px;"></i>
                    <span><strong>Nota de subida:</strong> Deberá ingresar manualmente a la plataforma SACE y subir este archivo generado. Ningún software de terceros tiene permitido automatizar la subida directa a los servidores gubernamentales de SACE.</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px; margin: 20px auto 0; width: 100%;">
                    <button onclick="Views.Sace.triggerDownload()" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-weight: 700; box-shadow: 0 4px 12px rgba(0, 200, 83, 0.2);">
                        <i data-lucide="download" style="width: 18px;"></i> Descargar Archivo Excel
                    </button>
                    
                    <button onclick="Views.Sace.restartWizard()" class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
                        <i data-lucide="rotate-ccw" style="width: 16px;"></i> Llenar Otro Archivo
                    </button>
                </div>
            </div>
        `;
    },

    // ────────────────────────────────────────────────────────────────────────
    // ACCIONES Y LÓGICA DE CONTROL
    // ────────────────────────────────────────────────────────────────────────
    goToStep(step) {
        this.activeStep = step;
        Router.render();
    },

    restartWizard() {
        this.init();
        Router.render();
    },

    linkStudentManually(saceIdentidad, localId) {
        if (!localId) {
            delete this.manualLinks[saceIdentidad];
        } else {
            this.manualLinks[saceIdentidad] = localId;
        }
        
        this.recalculateMatches();
        Router.render();
    },

    handleFileSelection(file) {
        this.selectedFile = file;
        this.manualLinks = {};
        
        UI.toast('Leyendo archivo Excel...', 'info');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                if (typeof XLSX === 'undefined') {
                    throw new Error('La librería SheetJS/XLSX no se encuentra cargada en la aplicación.');
                }
                const workbook = XLSX.read(data, { type: 'array', cellStyles: true, cellFormulas: true });
                this.workbook = workbook;
                this.sheetName = workbook.SheetNames[0];
                
                this.identifyTemplateAndHeaders();

                if (this.selectedCourseId && this.fileType !== 'unknown') {
                    this.recalculateMatches();
                }
                
                Router.render();
                
                if (this.fileType === 'unknown') {
                    UI.toast('El archivo subido no se pudo reconocer.', 'warning');
                } else {
                    UI.toast(`Plantilla de SACE leída exitosamente. ${this.matchedStudents.length} alumnos vinculados.`, 'success');
                }
            } catch (err) {
                console.error(err);
                UI.toast('Error al leer el archivo: ' + err.message, 'error');
            }
        };
        reader.onerror = () => {
            UI.toast('No se pudo leer el archivo de la computadora.', 'error');
        };
        reader.readAsArrayBuffer(file);
    },

    normalizeGradeNumber(str) {
        if (!str) return '';
        const s = String(str).toLowerCase()
            .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
        
        if (s.includes('primer') || s.includes('1er') || s.includes('1°') || s.includes(' 1 ') || s === '1' || s.includes('primero')) return '1';
        if (s.includes('segund') || s.includes('2do') || s.includes('2°') || s.includes(' 2 ') || s === '2') return '2';
        if (s.includes('tercer') || s.includes('3er') || s.includes('3°') || s.includes(' 3 ') || s === '3') return '3';
        if (s.includes('cuart') || s.includes('4to') || s.includes('4°') || s.includes(' 4 ') || s === '4') return '4';
        if (s.includes('quint') || s.includes('5to') || s.includes('5°') || s.includes(' 5 ') || s === '5') return '5';
        if (s.includes('sext') || s.includes('6to') || s.includes('6°') || s.includes(' 6 ') || s === '6') return '6';
        if (s.includes('septim') || s.includes('7mo') || s.includes('7°') || s.includes(' 7 ') || s === '7') return '7';
        if (s.includes('octav') || s.includes('8vo') || s.includes('8°') || s.includes(' 8 ') || s === '8') return '8';
        if (s.includes('noven') || s.includes('9no') || s.includes('9°') || s.includes(' 9 ') || s === '9') return '9';
        if (s.includes('decim') && !s.includes('undecim') && !s.includes('duodecim') || s.includes('10mo') || s.includes('10°') || s === '10') return '10';
        if (s.includes('undecim') || s.includes('11mo') || s.includes('11°') || s === '11') return '11';
        if (s.includes('duodecim') || s.includes('12mo') || s.includes('12°') || s === '12') return '12';

        const digits = s.replace(/[^\d]/g, '');
        return digits || s;
    },

    normalizeSection(str) {
        if (!str) return '';
        const digits = String(str).replace(/[^\d]/g, '').trim();
        if (digits) return digits;
        return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
    },

    isSubjectMatching(detectedSubject, courseAsignatura) {
        if (!detectedSubject || !courseAsignatura) return true;
        
        const clean = str => String(str || '')
            .toLowerCase()
            .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const normDet = clean(detectedSubject);
        const normCourse = clean(courseAsignatura);

        if (normDet.includes(normCourse) || normCourse.includes(normDet)) return true;

        const detWords = normDet.split(' ').filter(w => w.length > 2 && isNaN(w));
        const courseWords = normCourse.split(' ').filter(w => w.length > 2 && isNaN(w));

        if (detWords.length === 0 || courseWords.length === 0) return true;

        return detWords.some(w => courseWords.includes(w) || courseWords.some(cw => cw.includes(w) || w.includes(cw)));
    },

    identifyTemplateAndHeaders() {
        if (!this.workbook || !this.sheetName) return;
        const sheet = this.workbook.Sheets[this.sheetName];
        
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:O50');
        const metadataRows = [];
        for (let r = 0; r < Math.min(15, range.e.r); r++) {
            const row = [];
            for (let c = 0; c <= Math.min(12, range.e.c); c++) {
                const cell = sheet[XLSX.utils.encode_cell({r, c})];
                row.push(cell ? String(cell.v).trim() : '');
            }
            metadataRows.push(row);
        }

        let isPersonality = false;
        let isGrades = false;
        let hasAttendance = false;

        metadataRows.forEach(row => {
            const rowStr = row.join(' ').toUpperCase();
            if (rowStr.includes('PUNTUALIDAD') || rowStr.includes('ESPÍRITU') || rowStr.includes('ESPIRITU') || rowStr.includes('SOCIABILIDAD') || rowStr.includes('MORALIDAD')) {
                isPersonality = true;
            }
            if (rowStr.includes('PARCIAL I') || rowStr.includes('PARCIAL II') || rowStr.includes('PARCIAL III') || rowStr.includes('PARCIAL IV') || rowStr.includes('NOTA TOTAL')) {
                isGrades = true;
            }
            if (rowStr.includes('INASISTENCIAS') || rowStr.includes('INASISTENCIA') || rowStr.includes('INAS.')) {
                hasAttendance = true;
            }
        });

        if (isPersonality) {
            this.fileType = 'personalidad';
        } else if (isGrades) {
            this.fileType = 'notas';
        } else {
            this.fileType = 'unknown';
        }

        this.hasAttendance = hasAttendance;

        // ── MAPEO DINÁMICO Y DETECCIÓN DE ENCABEZADOS ──
        this.detectedHeaderRow = -1;
        this.detectedStartRow = -1;
        this.detectedIdCol = -1;
        this.detectedNameCol = -1;

        for (let r = 0; r < metadataRows.length; r++) {
            const row = metadataRows[r];
            const rowStr = row.join(' | ').toUpperCase();
            if (rowStr.includes('IDENTIDAD') && (rowStr.includes('NOMBRE') || rowStr.includes('ALUMNO'))) {
                this.detectedHeaderRow = r;
                row.forEach((cellVal, cIdx) => {
                    const cUpper = String(cellVal).toUpperCase();
                    if (cUpper.includes('IDENTIDAD')) this.detectedIdCol = cIdx;
                    if (cUpper.includes('NOMBRE')) this.detectedNameCol = cIdx;
                });
                
                if (r + 1 < metadataRows.length) {
                    const nextRowStr = metadataRows[r + 1].join(' | ').toUpperCase();
                    if (nextRowStr.includes('INASISTENCIA') || nextRowStr.includes('NOTA TOTAL') || nextRowStr.includes('INAS.')) {
                        this.detectedStartRow = r + 2;
                    } else {
                        this.detectedStartRow = r + 1;
                    }
                } else {
                    this.detectedStartRow = r + 1;
                }
                break;
            }
        }

        if (this.fileType === 'notas') {
            if (this.hasAttendance) {
                this.columnMap = {
                    p1_in: 3, p1_nt: 4,
                    p2_in: 5, p2_nt: 6,
                    p3_in: 7, p3_nt: 8,
                    p4_in: 9, p4_nt: 10,
                    recuperacion: 11
                };
            } else {
                this.columnMap = {
                    p1_in: null, p1_nt: 3,
                    p2_in: null, p2_nt: 4,
                    p3_in: null, p3_nt: 5,
                    p4_in: null, p4_nt: 6,
                    recuperacion: 7
                };
            }

            metadataRows.forEach(row => {
                row.forEach((cellText, colIdx) => {
                    if (String(cellText).toUpperCase().includes('RECUPERAC')) {
                        this.columnMap.recuperacion = colIdx;
                    }
                });
            });
        }

        for (let r = 0; r < metadataRows.length; r++) {
            const rowStr = metadataRows[r].join(' | ');
            
            if (rowStr.includes('0503') || rowStr.toUpperCase().includes('CENTRO')) {
                const centerMatch = rowStr.match(/(?:CENTRO:\s*\()?([0-9A-Z]+)\)?\s*-\s*([^|]+)/i);
                if (centerMatch) {
                    this.detectedCenter = `${centerMatch[1]} - ${centerMatch[2].trim()}`;
                } else {
                    this.detectedCenter = metadataRows[r][0] || metadataRows[r][4] || this.detectedCenter;
                }
            }

            if (rowStr.toUpperCase().includes('GRADO') || rowStr.toUpperCase().includes('SECCIÓN') || rowStr.toUpperCase().includes('SECCION')) {
                const gradeMatch = rowStr.match(/([a-zA-Z\x00-\xff\s]+GRADO)(?:\s+SECCI[ÓO]N\s+(\d+))?/i);
                if (gradeMatch) {
                    this.detectedGrade = gradeMatch[1].trim();
                    if (gradeMatch[2]) this.detectedSection = gradeMatch[2].trim();
                }
                
                metadataRows[r].forEach(c => {
                    if (c.toUpperCase().includes('SECCIÓN:') || c.toUpperCase().includes('SECCION:')) {
                        const secParts = c.split(':');
                        if (secParts[1]) this.detectedSection = secParts[1].trim();
                    }
                    if (c.toUpperCase().includes('CURSO:')) {
                        const grParts = c.split(':');
                        if (grParts[1]) this.detectedGrade = grParts[1].trim();
                    }
                });
            }

            if (this.fileType === 'notas' && r === 4) {
                this.detectedSubject = (metadataRows[r][0] || '').trim();
            }
        }
        
        if (this.fileType === 'personalidad') {
            this.detectedSubject = 'Aspectos de Conducta / Personalidad';
        }

        // ── AUTO-DETECCIÓN DE PARCIAL Y VINCULACIÓN INTELIGENTE DE CURSO ──
        let detectedParcialId = '';
        metadataRows.forEach(row => {
            const rowStr = row.join(' ').toUpperCase();
            if (rowStr.includes('PARCIAL I') || rowStr.includes('PARCIAL 1') || rowStr.includes('1ER PARCIAL') || rowStr.includes('PRIMER PARCIAL')) {
                if (!rowStr.includes('PARCIAL II') && !rowStr.includes('PARCIAL III') && !rowStr.includes('PARCIAL IV')) {
                    detectedParcialId = 'p1';
                }
            } else if (rowStr.includes('PARCIAL II') || rowStr.includes('PARCIAL 2') || rowStr.includes('2DO PARCIAL') || rowStr.includes('SEGUNDO PARCIAL')) {
                detectedParcialId = 'p2';
            } else if (rowStr.includes('PARCIAL III') || rowStr.includes('PARCIAL 3') || rowStr.includes('3ER PARCIAL') || rowStr.includes('TERCER PARCIAL')) {
                detectedParcialId = 'p3';
            } else if (rowStr.includes('PARCIAL IV') || rowStr.includes('PARCIAL 4') || rowStr.includes('4TO PARCIAL') || rowStr.includes('CUARTO PARCIAL')) {
                detectedParcialId = 'p4';
            }
        });
        if (detectedParcialId) {
            this.selectedParcialId = detectedParcialId;
        }

        // Buscar coincidencia entre los cursos registrados
        const courses = Store.get('cursos') || [];
        this.autoMatchedCourse = false;

        const cleanNormalize = str => String(str || '').toLowerCase().replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n').replace(/[^a-z0-9]/g, '');

        const normCenter = cleanNormalize(this.detectedCenter);
        const normGradeNum = this.normalizeGradeNumber(this.detectedGrade);
        const normSecNum = this.normalizeSection(this.detectedSection);

        let bestCourse = null;
        let bestScore = 0;

        courses.forEach(c => {
            let score = 0;
            const cCenter = cleanNormalize(c.centroEducativo || '');
            const cGradeNum = this.normalizeGradeNumber(c.grado || '');
            const cSecNum = this.normalizeSection(c.seccion || '');

            if (normCenter && cCenter && (normCenter.includes(cCenter) || cCenter.includes(normCenter))) {
                score += 3;
            }
            if (normGradeNum && cGradeNum && normGradeNum === cGradeNum) {
                score += 4;
            }
            if (normSecNum && cSecNum && normSecNum === cSecNum) {
                score += 3;
            }
            if (this.fileType === 'notas' && this.isSubjectMatching(this.detectedSubject, c.asignatura)) {
                score += 4;
            }

            if (score > bestScore) {
                bestScore = score;
                bestCourse = c;
            }
        });

        if (bestCourse && bestScore >= 4) {
            this.selectedCourseId = bestCourse.id;
            this.autoMatchedCourse = true;
            this.loadPersonalityData();
        }

        this.validateTemplateCompatibility();
    },

    validateTemplateCompatibility() {
        this.subjectMismatch = false;
        this.subjectMismatchError = '';
        this.gradeMismatchWarning = '';

        if (!this.selectedCourseId) return;
        const course = Store.get('cursos').find(c => c.id === this.selectedCourseId);
        if (!course) return;

        // 1. Validar Asignatura (solo para plantillas de notas)
        if (this.fileType === 'notas' && this.detectedSubject) {
            const isMatch = this.isSubjectMatching(this.detectedSubject, course.asignatura);

            if (!isMatch) {
                this.subjectMismatch = true;
                this.subjectMismatchError = `La plantilla SACE subida pertenece a "${this.detectedSubject.toUpperCase()}", pero el curso seleccionado es "${course.asignatura.toUpperCase()}". Para evitar alterar notas de otra materia, el sistema requiere seleccionar el curso correspondiente.`;
            }
        }

        // 2. Validar Grado y Sección
        if (this.detectedGrade || this.detectedSection) {
            const normDetGrade = this.normalizeGradeNumber(this.detectedGrade);
            const normCourseGrade = this.normalizeGradeNumber(course.grado);
            
            if (normDetGrade && normCourseGrade && normDetGrade !== normCourseGrade) {
                this.gradeMismatchWarning = `Advertencia de Grado: La plantilla indica "${this.detectedGrade}", mientras que el curso seleccionado en la app es "${course.grado}".`;
            }
        }
    },

    executeConciliation() {
        if (!this.selectedCourseId) {
            UI.toast('Por favor, seleccione el curso equivalente local.', 'warning');
            return;
        }

        const course = Store.get('cursos').find(c => c.id === this.selectedCourseId);
        if (!course) {
            UI.toast('Curso local no encontrado.', 'error');
            return;
        }

        const localStudents = Store.getStudentsByCourse(course.id) || [];
        if (localStudents.length === 0) {
            UI.toast('El curso seleccionado no tiene alumnos matriculados.', 'warning');
            return;
        }

        this.recalculateMatches();
        this.goToStep(3);
    },

    recalculateMatches() {
        this.validateTemplateCompatibility();

        const course = Store.get('cursos').find(c => c.id === this.selectedCourseId);
        const localStudents = Store.getStudentsByCourse(course ? course.id : '') || [];

        if (!this.workbook || !this.sheetName) return;

        const sheet = this.workbook.Sheets[this.sheetName];
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:O50');
        
        this.matchedStudents = [];
        this.unmatchedSaceStudents = [];
        this.duplicateSaceStudents = [];
        this.emptyIdentitySaceStudents = [];
        this.unmatchedLocalStudents = [...localStudents];

        const startRow = this.detectedStartRow > 0 ? this.detectedStartRow : (this.fileType === 'personalidad' ? 8 : 7);
        const idColIndex = this.detectedIdCol >= 0 ? this.detectedIdCol : (this.fileType === 'personalidad' ? 2 : 1);
        const nameColIndex = this.detectedNameCol >= 0 ? this.detectedNameCol : (this.fileType === 'personalidad' ? 3 : 2);

        // 1. Detección previa de duplicados en la plantilla SACE y recolección de filas
        const idCounts = {};
        const saceRows = [];

        for (let r = startRow; r <= range.e.r; r++) {
            const idCell = sheet[XLSX.utils.encode_cell({ r, c: idColIndex })];
            const nameCell = sheet[XLSX.utils.encode_cell({ r, c: nameColIndex })];
            if (!nameCell || !nameCell.v) continue;
            
            const saceId = idCell ? String(idCell.v).trim() : '';
            const saceName = String(nameCell.v).trim();
            const cleanSaceId = this.cleanID(saceId);
            
            if (cleanSaceId) {
                idCounts[cleanSaceId] = (idCounts[cleanSaceId] || 0) + 1;
            }
            
            saceRows.push({
                rowIndex: r,
                saceId,
                saceName,
                cleanSaceId
            });
        }

        // 2. Primera pasada: Vincular por identidad (DNI) y por enlace manual
        const matchedLocalIds = new Set();
        const unmatchedSaceRows = [];

        saceRows.forEach(row => {
            const { rowIndex, saceId, saceName, cleanSaceId } = row;

            if (!cleanSaceId) {
                this.emptyIdentitySaceStudents.push({ rowIndex, nombre: saceName });
            }
            if (cleanSaceId && idCounts[cleanSaceId] > 1) {
                this.duplicateSaceStudents.push({ rowIndex, identidad: saceId, nombre: saceName });
            }

            let localStudent = null;
            let isManual = false;

            // Enlace manual
            if (this.manualLinks[saceId]) {
                localStudent = localStudents.find(st => st.id === this.manualLinks[saceId]);
                isManual = true;
            }

            // Enlace por identidad (DNI)
            if (!localStudent && cleanSaceId) {
                localStudent = localStudents.find(st => this.cleanID(st.identidad) === cleanSaceId);
            }

            if (localStudent) {
                matchedLocalIds.add(localStudent.id);
                
                const normSace = saceName.toLowerCase().replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n').trim();
                const normLocal = (localStudent.nombreCompleto || '').toLowerCase().replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n').trim();
                const nameWarning = normLocal !== normSace;

                this.matchedStudents.push({
                    rowIndex,
                    saceIdentidad: saceId || 'SIN ID',
                    saceNombre: saceName,
                    localNombre: localStudent.nombreCompleto,
                    localId: localStudent.id,
                    warning: nameWarning,
                    manualLink: isManual,
                    matchedByName: false,
                    gradesData: this.calculateStudentGrades(localStudent.id, course.id)
                });
            } else {
                unmatchedSaceRows.push(row);
            }
        });

        // 3. Segunda pasada: Auto-vincular por nombre exacto o tokens para estudiantes locales sin identidad cargada
        let dbUpdated = false;
        let updatedDniCount = 0;
        const stillUnmatchedSaceRows = [];
        
        unmatchedSaceRows.forEach(row => {
            const { rowIndex, saceId, saceName, cleanSaceId } = row;
            
            // Buscar en estudiantes locales que NO han sido vinculados aún y tienen coincidencia de nombres 100%
            const candidate = localStudents.find(st => {
                if (matchedLocalIds.has(st.id)) return false;
                return this.getSimilarityScore(saceName, st.nombreCompleto) >= 0.95;
            });

            if (candidate) {
                // Vincular y además actualizar el DNI localmente si estaba vacío!
                matchedLocalIds.add(candidate.id);
                
                if (cleanSaceId && !candidate.identidad) {
                    const dbStudentIndex = Store.data.estudiantes.findIndex(e => e.id === candidate.id);
                    if (dbStudentIndex !== -1) {
                        Store.data.estudiantes[dbStudentIndex].identidad = saceId;
                        dbUpdated = true;
                        updatedDniCount++;
                    }
                }

                this.matchedStudents.push({
                    rowIndex,
                    saceIdentidad: saceId || 'SIN ID',
                    saceNombre: saceName,
                    localNombre: candidate.nombreCompleto,
                    localId: candidate.id,
                    warning: false,
                    manualLink: false,
                    matchedByName: true,
                    gradesData: this.calculateStudentGrades(candidate.id, course.id)
                });
            } else {
                stillUnmatchedSaceRows.push(row);
            }
        });

        // 3.5 Tercera pasada: Auto-vincular usando Token matching inteligente (para nombres parciales o con ligeras diferencias)
        const candidatesPairs = [];
        stillUnmatchedSaceRows.forEach(row => {
            localStudents.forEach(st => {
                if (matchedLocalIds.has(st.id)) return;
                
                const score = this.getSimilarityScore(row.saceName, st.nombreCompleto);
                if (score >= 0.58) {
                    candidatesPairs.push({
                        row,
                        student: st,
                        score
                    });
                }
            });
        });

        // Ordenar candidatos por puntuación de similitud descendente
        candidatesPairs.sort((a, b) => b.score - a.score);

        // Vincular de forma codiciosa (greedy) los de mayor coincidencia
        candidatesPairs.forEach(pair => {
            const { row, student } = pair;
            const { rowIndex, saceId, saceName, cleanSaceId } = row;

            if (matchedLocalIds.has(student.id)) return;
            
            const saceRowAlreadyMatched = this.matchedStudents.some(m => m.rowIndex === rowIndex);
            if (saceRowAlreadyMatched) return;

            matchedLocalIds.add(student.id);

            // Actualizar identidad localmente si estaba vacía
            if (cleanSaceId && !student.identidad) {
                const dbStudentIndex = Store.data.estudiantes.findIndex(e => e.id === student.id);
                if (dbStudentIndex !== -1) {
                    Store.data.estudiantes[dbStudentIndex].identidad = saceId;
                    dbUpdated = true;
                    updatedDniCount++;
                }
            }

            this.matchedStudents.push({
                rowIndex,
                saceIdentidad: saceId || 'SIN ID',
                saceNombre: saceName,
                localNombre: student.nombreCompleto,
                localId: student.id,
                warning: true, // mostrar alerta visual porque difiere levemente
                manualLink: false,
                matchedByName: true, // marcado por coincidencia de nombre
                gradesData: this.calculateStudentGrades(student.id, course.id)
            });
        });

        // Las filas que quedaron sin vincular definitivamente se agregan a unmatchedSaceStudents
        stillUnmatchedSaceRows.forEach(row => {
            const { rowIndex, saceId, saceName } = row;
            const isMatched = this.matchedStudents.some(m => m.rowIndex === rowIndex);
            if (!isMatched) {
                this.unmatchedSaceStudents.push({
                    rowIndex,
                    identidad: saceId,
                    nombre: saceName
                });
            }
        });

        if (dbUpdated) {
            Store.save();
            if (typeof UI !== 'undefined' && UI.toast) {
                UI.toast(`🎉 ¡Se auto-completó el número de Identidad (DNI) de ${updatedDniCount} alumnos en la matrícula de Aula 360 HN!`, 'success');
            }
        }

        // 4. Actualizar lista de alumnos locales no vinculados
        this.unmatchedLocalStudents = localStudents.filter(st => !matchedLocalIds.has(st.id));
    },

    calculateStudentGrades(studentId, courseId) {
        const cuadroKey = 'cuadro1_' + courseId;
        const savedCuadro = localStorage.getItem(cuadroKey);
        
        if (savedCuadro) {
            try {
                const parsed = JSON.parse(savedCuadro);
                if (parsed && Array.isArray(parsed.filas)) {
                    const fila = parsed.filas.find(f => f.estudianteId === studentId);
                    if (fila && fila.parciales) {
                        const getPGrade = (pObj) => {
                            if (!pObj) return '';
                            if (pObj.nf !== undefined && pObj.nf !== null && pObj.nf !== '') return pObj.nf;
                            if (pObj.nt !== undefined && pObj.nt !== null && pObj.nt !== '') return pObj.nt;
                            return '';
                        };
                        return {
                            p1_nt: getPGrade(fila.parciales.p1),
                            p1_in: fila.parciales.p1 ? fila.parciales.p1.in : '',
                            p2_nt: getPGrade(fila.parciales.p2),
                            p2_in: fila.parciales.p2 ? fila.parciales.p2.in : '',
                            p3_nt: getPGrade(fila.parciales.p3),
                            p3_in: fila.parciales.p3 ? fila.parciales.p3.in : '',
                            p4_nt: getPGrade(fila.parciales.p4),
                            p4_in: fila.parciales.p4 ? fila.parciales.p4.in : '',
                            recuperacion: fila.recuperacion || ''
                        };
                    }
                }
            } catch(e) { console.error('Error al analizar caché del Cuadro #1', e); }
        }

        const realParciales = Store.getParcialByCourse(courseId);
        const allActivities = Store.get('actividades').filter(a => a.cursoId === courseId);
        const allCalificaciones = Store.get('calificaciones') || [];
        const dims = (Store.data.configAcademica && Store.data.configAcademica.dimensions) || (typeof CONFIG !== 'undefined' && CONFIG ? CONFIG.dimensions : []) || [];

        const studentScores = allCalificaciones.filter(sc => sc.estudianteId === studentId && sc.cursoId === courseId);
        const result = { p1_nt: '', p1_in: '', p2_nt: '', p2_in: '', p3_nt: '', p3_in: '', p4_nt: '', p4_in: '', recuperacion: '' };

        const pIds = ['p1', 'p2', 'p3', 'p4'];
        pIds.forEach((pId, pIdx) => {
            const reParc = realParciales.find(p => p.id === pId) || realParciales[pIdx];
            if (!reParc) return;

            const parcialActivities = allActivities.filter(a => a.parcialId === reParc.id);
            const columns = [];
            
            dims.forEach(dim => {
                const dimActs = parcialActivities.filter(a => a.dimensionKey === dim.key || a.dimension === dim.key);
                if (dimActs.length > 0) {
                    columns.push({ dimension: dim, activities: dimActs });
                }
            });

            let studentFinal = 0;
            columns.forEach(col => {
                let dimObtained = 0;
                let dimMax = 0;
                col.activities.forEach(act => {
                    const score = studentScores.find(sc => sc.actividadId === act.id);
                    const obt = score ? (score.puntajeObtenido !== undefined && score.puntajeObtenido !== null ? Number(score.puntajeObtenido) : Number(score.nota || 0)) : 0;
                    const mx = Number(act.puntajeMax || 0);
                    if (!isNaN(obt)) dimObtained += obt;
                    if (!isNaN(mx))  dimMax      += mx;
                });
                const dimSub = dimMax > 0 ? ((dimObtained / dimMax) * col.dimension.porcentaje) : 0;
                studentFinal += dimSub;
            });

            if (columns.length > 0) {
                result[`${pId}_nt`] = Math.round(studentFinal);
            }

            // Contabilizar inasistencias por parcial (filtrado estricto por fechaInicio y fechaFin del parcial)
            const inasistencias = (Store.data.asistencia || []).filter(a => {
                if (a.estudianteId !== studentId || a.cursoId !== courseId) return false;
                if (a.estado !== 'A' && a.estado !== 'Ausente') return false;
                if (reParc.fechaInicio && reParc.fechaFin) {
                    return a.fecha >= reParc.fechaInicio && a.fecha <= reParc.fechaFin;
                }
                return a.parcialId === reParc.id || a.parcial === reParc.id;
            }).length;
            
            if (inasistencias > 0) result[`${pId}_in`] = inasistencias;
        });

        return result;
    },

    generateFilledFile() {
        if (this.subjectMismatch) {
            UI.toast(this.subjectMismatchError, 'error');
            return;
        }

        if (!this.workbook || !this.sheetName) {
            UI.toast('No hay plantilla Excel SACE cargada para inyectar datos.', 'warning');
            return;
        }

        UI.toast('Inyectando datos en la plantilla...', 'info');
        
        try {
            const sheet = this.workbook.Sheets[this.sheetName];
            
            if (this.fileType === 'notas') {
                const cmap = this.columnMap || {
                    p1_in: 3, p1_nt: 4,
                    p2_in: 5, p2_nt: 6,
                    p3_in: 7, p3_nt: 8,
                    p4_in: 9, p4_nt: 10,
                    recuperacion: 11
                };

                this.matchedStudents.forEach(m => {
                    const r = m.rowIndex;
                    const gr = m.gradesData;
                    
                    const writeCell = (colIdx, val) => {
                        if (colIdx === null || colIdx === undefined) return;
                        const cellRef = XLSX.utils.encode_cell({ r, c: colIdx });
                        if (val !== undefined && val !== null && val !== '') {
                            if (!sheet[cellRef]) {
                                sheet[cellRef] = { t: 'n', v: Number(val), ixfe: 25, s: { patternType: 'none' } };
                            } else {
                                sheet[cellRef].v = Number(val);
                                sheet[cellRef].t = 'n';
                                if (!sheet[cellRef].ixfe) sheet[cellRef].ixfe = 25;
                                delete sheet[cellRef].w;
                            }
                        } else if (sheet[cellRef]) {
                            delete sheet[cellRef].v;
                            delete sheet[cellRef].w;
                        }
                    };

                    if (this.selectedParcialId === 'p1') {
                        if (cmap.p1_in !== null) writeCell(cmap.p1_in, gr.p1_in);
                        writeCell(cmap.p1_nt, gr.p1_nt);
                    } else if (this.selectedParcialId === 'p2') {
                        if (cmap.p2_in !== null) writeCell(cmap.p2_in, gr.p2_in);
                        writeCell(cmap.p2_nt, gr.p2_nt);
                    } else if (this.selectedParcialId === 'p3') {
                        if (cmap.p3_in !== null) writeCell(cmap.p3_in, gr.p3_in);
                        writeCell(cmap.p3_nt, gr.p3_nt);
                    } else if (this.selectedParcialId === 'p4') {
                        if (cmap.p4_in !== null) writeCell(cmap.p4_in, gr.p4_in);
                        writeCell(cmap.p4_nt, gr.p4_nt);
                        if (gr.recuperacion && cmap.recuperacion !== null) writeCell(cmap.recuperacion, gr.recuperacion);
                    } else if (this.selectedParcialId === 'all') {
                        if (cmap.p1_in !== null) writeCell(cmap.p1_in, gr.p1_in);
                        writeCell(cmap.p1_nt, gr.p1_nt);
                        if (cmap.p2_in !== null) writeCell(cmap.p2_in, gr.p2_in);
                        writeCell(cmap.p2_nt, gr.p2_nt);
                        if (cmap.p3_in !== null) writeCell(cmap.p3_in, gr.p3_in);
                        writeCell(cmap.p3_nt, gr.p3_nt);
                        if (cmap.p4_in !== null) writeCell(cmap.p4_in, gr.p4_in);
                        writeCell(cmap.p4_nt, gr.p4_nt);
                        if (gr.recuperacion && cmap.recuperacion !== null) writeCell(cmap.recuperacion, gr.recuperacion);
                    }
                });

            } else {
                this.matchedStudents.forEach(m => {
                    const r = m.rowIndex;
                    const p = this.getPersonalityTraits(m.localId, this.selectedParcialId);
                    
                    const writeCell = (colIdx, val) => {
                        const cellRef = XLSX.utils.encode_cell({ r, c: colIdx });
                        if (!sheet[cellRef]) {
                            sheet[cellRef] = { t: 'n', v: Number(val), ixfe: 25, s: { patternType: 'none' } };
                        } else {
                            sheet[cellRef].v = Number(val);
                            sheet[cellRef].t = 'n';
                            if (!sheet[cellRef].ixfe) sheet[cellRef].ixfe = 25;
                            delete sheet[cellRef].w;
                        }
                    };

                    writeCell(4, p.puntualidad);
                    writeCell(5, p.espiritu);
                    writeCell(6, p.orden);
                    writeCell(7, p.sociabilidad);
                    writeCell(8, p.moralidad);
                });
            }

            // Detectar el formato original para mantener la misma extensión y compatibilidad
            const isXlsx = this.selectedFile.name.endsWith('.xlsx');
            const bookType = isXlsx ? 'xlsx' : 'biff8';
            const outBuffer = XLSX.write(this.workbook, { bookType: bookType, type: 'array', cellStyles: true, cellFormulas: true, keepVBA: true });
            this.outputBuffer = outBuffer;

            const course = Store.get('cursos').find(c => c.id === this.selectedCourseId);
            const grado = (course.grado || 'Grado').replace(/\s+/g, '_');
            const seccion = String(course.seccion || '1');
            const pUpper = this.selectedParcialId.toUpperCase();
            
            const ext = isXlsx ? 'xlsx' : 'xls';
            if (this.fileType === 'notas') {
                this.outputFilename = `SACE_NOTAS_INASISTENCIAS_${grado}_SEC_${seccion}_P${pUpper}.${ext}`;
            } else {
                this.outputFilename = `SACE_PERSONALIDAD_${grado}_SEC_${seccion}_P${pUpper}.${ext}`;
            }

            this.saveHistory({
                fecha: new Date().toISOString(),
                tipo: this.fileType,
                curso: `${course.grado}° - Sec. ${course.seccion}`,
                parcial: this.selectedParcialId,
                alumnosProcesados: this.matchedStudents.length,
                nombreArchivo: this.outputFilename
            });

            this.triggerDownload();
            UI.toast('¡Plantilla SACE llenada y descargada exitosamente en 1 Clic!', 'success');
        } catch (err) {
            console.error(err);
            UI.toast('No se pudo inyectar la información: ' + err.message, 'error');
        }
    },

    triggerDownload() {
        if (!this.outputBuffer || !this.outputFilename) {
            UI.toast('No hay archivo generado para descargar.', 'warning');
            return;
        }
        
        try {
            const mimeType = this.outputFilename.endsWith('.xlsx') ? 
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                'application/vnd.ms-excel';
                
            const blob = new Blob([this.outputBuffer], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.outputFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            UI.toast('Descarga iniciada.', 'success');
        } catch (err) {
            UI.toast('Error al descargar archivo: ' + err.message, 'error');
        }
    }
};
