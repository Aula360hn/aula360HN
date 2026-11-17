/**
 * ============================================================================
 * AULA 360 HN - GOOGLE SHEETS CLOUD DATABASE CLIENT API (VERSIÓN 5.0 ULTIMATE)
 * ============================================================================
 * Genera y transmite el 100% de la información de Aula 360 HN incluyendo
 * Cuadros Controladores 1:1 por Asignatura idénticos a los del Cuadro #1.
 * ============================================================================
 */

const GoogleSheetsSync = {
    URL_KEY: 'a360_gsheets_url',
    API_KEY_STORAGE: 'a360_gsheets_api_key',
    LAST_SYNC_KEY: 'a360_gsheets_last_sync',
    DEFAULT_API_KEY: 'AULA360_SECRET_KEY_2026',
    syncTimer: null,
    isSyncing: false,

    getUrl() {
        return localStorage.getItem(this.URL_KEY) || '';
    },

    setUrl(url) {
        if (url) {
            localStorage.setItem(this.URL_KEY, url.trim());
        } else {
            localStorage.removeItem(this.URL_KEY);
        }
    },

    getApiKey() {
        return localStorage.getItem(this.API_KEY_STORAGE) || this.DEFAULT_API_KEY;
    },

    setApiKey(key) {
        if (key) localStorage.setItem(this.API_KEY_STORAGE, key.trim());
        else localStorage.removeItem(this.API_KEY_STORAGE);
    },

    getLastSyncTime() {
        const iso = localStorage.getItem(this.LAST_SYNC_KEY);
        if (!iso) return 'Nunca';
        try {
            return new Date(iso).toLocaleString('es-HN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch(e) {
            return iso;
        }
    },

    isConfigured() {
        return !!this.getUrl();
    },

    async _request(action, method = 'POST', payloadData = {}, queryParams = {}) {
        const url = this.getUrl();
        if (!url) {
            throw new Error('URL de Google Apps Script no configurada. Configure la URL en Ajustes.');
        }

        const apiKey = this.getApiKey();

        if (method === 'GET') {
            const params = new URLSearchParams({ action, apiKey, ...queryParams });
            const fullUrl = url.includes('?') ? `${url}&${params.toString()}` : `${url}?${params.toString()}`;
            
            const response = await fetch(fullUrl, { method: 'GET', mode: 'cors' });
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            return await response.json();
        } else {
            const postBody = JSON.stringify({
                action,
                apiKey,
                ...payloadData
            });

            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: postBody
            });

            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            return await response.json();
        }
    },

    // ── MAPEO DE CUADROS CONTROLADORES 1:1 FIELES ──────────────────────────────
    buildCuadrosControladoresPayload() {
        const d = Store.data || {};
        const config = d.configAcademica || {};
        const cursos = d.cursos || [];
        const estudiantes = d.estudiantes || [];
        const matriculas = d.matriculas || [];
        const calificaciones = d.calificaciones || [];
        const asistencia = d.asistencia || [];

        return cursos.map(curso => {
            const matCurso = matriculas.filter(m => m.cursoId === curso.id && m.estado !== 'INACTIVO');
            const estIds = new Set(matCurso.map(m => m.estudianteId));
            const alumnosCurso = estudiantes.filter(e => estIds.has(e.id));

            const alumnosFilas = alumnosCurso.map(st => {
                const califs = calificaciones.filter(c => c.estudianteId === st.id && c.cursoId === curso.id);
                const asis = asistencia.filter(a => a.estudianteId === st.id && a.cursoId === curso.id);

                // Cálculo por parciales
                const p1_cal = califs.filter(c => c.parcialId === 'P1' || c.parcialId === 'PER-2026-P1');
                const p2_cal = califs.filter(c => c.parcialId === 'P2' || c.parcialId === 'PER-2026-P2');
                const p3_cal = califs.filter(c => c.parcialId === 'P3' || c.parcialId === 'PER-2026-P3');
                const p4_cal = califs.filter(c => c.parcialId === 'P4' || c.parcialId === 'PER-2026-P4');

                const p1_nt = p1_cal.reduce((acc, c) => acc + Number(c.puntajeObtenido || c.nota || 0), 0);
                const p2_nt = p2_cal.reduce((acc, c) => acc + Number(c.puntajeObtenido || c.nota || 0), 0);
                const p3_nt = p3_cal.reduce((acc, c) => acc + Number(c.puntajeObtenido || c.nota || 0), 0);
                const p4_nt = p4_cal.reduce((acc, c) => acc + Number(c.puntajeObtenido || c.nota || 0), 0);

                const p1_in = asis.filter(a => a.estado === 'A' || a.estado === 'Ausente').length;
                const p2_in = 0;
                const p3_in = 0;
                const p4_in = 0;

                const notasValidas = [p1_nt, p2_nt, p3_nt, p4_nt].filter(n => n > 0);
                const promAnual = notasValidas.length > 0 ? Math.round(notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length) : p1_nt;
                const rec = st.recuperacion || "";
                const notaFinal = rec !== "" ? Number(rec) : promAnual;

                let des = "Avanzado (91-100%)";
                if (notaFinal < 60) des = "Insuficiente (0-59%)";
                else if (notaFinal <= 69) des = "Básico (60-69%)";
                else if (notaFinal <= 80) des = "Satisfactorio (70-80%)";
                else if (notaFinal <= 90) des = "Muy Satisfactorio (81-90%)";

                return {
                    identidad: st.identidad || st.dni || '',
                    nombreCompleto: (st.nombreCompleto || `${st.nombres} ${st.apellidos}`).toUpperCase(),
                    p1_in: p1_in || '',
                    p1_nt: p1_nt > 0 ? p1_nt : '',
                    p2_in: p2_in || '',
                    p2_nt: p2_nt > 0 ? p2_nt : '',
                    p3_in: p3_in || '',
                    p3_nt: p3_nt > 0 ? p3_nt : '',
                    p4_in: p4_in || '',
                    p4_nt: p4_nt > 0 ? p4_nt : '',
                    promedioAnual: promAnual > 0 ? promAnual : '',
                    recuperacion: rec,
                    notaFinal: notaFinal > 0 ? notaFinal : '',
                    desempeno: des
                };
            });

            return {
                centroEducativo: config.nombreCentro || curso.centroEducativo || 'CENTRO EDUCATIVO',
                codigoCentro: config.codigoCentro || curso.codigoCentro || '050300022B09',
                anioLectivo: config.anioLectivo || curso.anioLectivo || 2026,
                asignatura: curso.asignatura || 'ESPAÑOL',
                grado: curso.grado || '7',
                seccion: curso.seccion || '1',
                jornada: curso.jornada || 'VESPERTINA',
                estudiantes: alumnosFiltradas = alumnosFilas
            };
        });
    },

    buildFullDataPayload() {
        const d = Store.data || {};
        const config = d.configAcademica || {};

        const estudiantes = (d.estudiantes || []).map(st => {
            const parts = (st.nombreCompleto || '').trim().split(' ');
            const nombres = parts.length > 1 ? parts.slice(0, Math.ceil(parts.length / 2)).join(' ') : (st.nombreCompleto || '');
            const apellidos = parts.length > 1 ? parts.slice(Math.ceil(parts.length / 2)).join(' ') : '';
            return {
                estudiante_id: st.id,
                identidad: st.identidad || st.dni || '',
                nombres: st.nombres || nombres,
                apellidos: st.apellidos || apellidos,
                nombre_completo: (st.nombreCompleto || '').toUpperCase(),
                sexo: st.genero === 'FEMENINO' ? 'F' : 'M',
                genero: st.genero || 'MASCULINO',
                fecha_nacimiento: st.fechaNacimiento || '',
                tutor: st.tutor || st.nombreTutor || '',
                telefono_tutor: st.telefono || st.telefonoTutor || '',
                domicilio: st.domicilio || '',
                alergias: st.alergias || '',
                codigo_sace: st.codigo_sace || st.codigoSace || '',
                estado: st.estado || 'ACTIVO',
                fecha_creacion: st.creadoEn || new Date().toISOString()
            };
        });

        const matriculas = (d.matriculas || []).map(m => {
            const course = (d.cursos || []).find(c => c.id === m.cursoId) || {};
            return {
                matricula_id: m.id,
                estudiante_id: m.estudianteId,
                centro_id: course.codigoCentro || config.codigoCentro || 'CEN-MAIN',
                curso_id: m.cursoId,
                grado: course.grado || m.grado || '',
                seccion: course.seccion || m.seccion || '1',
                jornada: course.jornada || 'VESPERTINA',
                modalidad: course.modalidad || 'BÁSICA',
                ano_escolar: course.anioLectivo || config.anioLectivo || 2026,
                estado: m.estado || 'ACTIVO',
                fecha_matricula: m.creadoEn || new Date().toISOString()
            };
        });

        const actividades = (d.actividades || []).map(a => {
            const course = (d.cursos || []).find(c => c.id === a.cursoId) || {};
            return {
                actividad_id: a.id,
                curso_id: a.cursoId,
                docente_id: d.perfilDocente?.id || 'DOC-MAIN',
                asignatura_id: course.asignatura || 'ESPAÑOL',
                grado: course.grado || '',
                seccion: course.seccion || '1',
                periodo_id: a.parcialId || 'PER-2026-P1',
                dimension_id: a.dimensionId || a.dimensionKey || '',
                dimension_key: a.dimensionKey || '',
                nombre_actividad: a.titulo || a.nombre || '',
                descripcion: a.descripcion || '',
                fecha: a.fecha || new Date().toISOString().substring(0, 10),
                valor_actividad: a.valor || a.puntaje || 0,
                tipo: a.tipo || 'TAREA',
                estado: a.estado || 'ACTIVO',
                fecha_creacion: a.creadoEn || new Date().toISOString()
            };
        });

        const calificaciones = (d.calificaciones || []).map(c => {
            return {
                calificacion_id: c.id,
                actividad_id: c.actividadId,
                estudiante_id: c.estudianteId,
                matricula_id: c.matriculaId || '',
                curso_id: c.cursoId,
                parcial_id: c.parcialId || 'PER-2026-P1',
                nota_obtenida: c.puntajeObtenido !== undefined ? c.puntajeObtenido : c.nota,
                porcentaje_obtenido: c.porcentajeObtenido || 0,
                estado: c.estado || 'CALIFICADO',
                observacion: c.observacion || '',
                fecha_registro: c.creadoEn || new Date().toISOString(),
                fecha_modificacion: new Date().toISOString()
            };
        });

        const asistencia = (d.asistencia || []).map(a => {
            return {
                asistencia_id: a.id,
                estudiante_id: a.estudianteId,
                matricula_id: a.matriculaId || '',
                curso_id: a.cursoId,
                fecha: a.fecha,
                estado_asistencia: a.estado === 'P' ? 'Presente' : (a.estado === 'A' ? 'Ausente' : (a.estado === 'T' ? 'Tarde' : 'Justificada')),
                tardanza_minutos: a.tardanza || 0,
                observacion: a.observacion || '',
                docente_id: d.perfilDocente?.id || 'DOC-MAIN',
                fecha_registro: a.creadoEn || new Date().toISOString()
            };
        });

        const conducta_personalidad = (d.estudiantes || []).flatMap(st => {
            const traits = d.personality_traits || {};
            return ['p1', 'p2', 'p3', 'p4'].map(p => {
                const item = traits[`${st.id}_${p}`];
                if (!item) return null;
                return {
                    personalidad_id: `per_${st.id}_${p}`,
                    estudiante_id: st.id,
                    matricula_id: '',
                    curso_id: d.activeCourseId || '',
                    parcial_id: p.toUpperCase(),
                    puntualidad: item.puntualidad || 4,
                    espiritu_trabajo: item.espiritu || 4,
                    orden: item.orden || 4,
                    sociabilidad: item.sociabilidad || 4,
                    moralidad: item.moralidad || 4,
                    observaciones: item.observaciones || '',
                    fecha_registro: new Date().toISOString()
                };
            }).filter(Boolean);
        });

        const bitacora_y_sart = [
            ...(d.bitacora || []).map(b => ({
                bitacora_id: b.id,
                estudiante_id: b.estudianteId,
                matricula_id: '',
                curso_id: b.cursoId || '',
                fecha: b.fecha || new Date().toISOString().substring(0, 10),
                categoria: b.categoria || 'GENERAL',
                tipo_alerta: 'BITACORA',
                nivel_riesgo: 'NORMAL',
                observacion_descripcion: b.observacion || '',
                accion_tomada: b.accionTomada || '',
                docente_id: d.perfilDocente?.id || 'DOC-MAIN'
            })),
            ...(d.sartAlertas || []).map(sa => ({
                bitacora_id: sa.id,
                estudiante_id: sa.estudianteId,
                matricula_id: '',
                curso_id: sa.cursoId || '',
                fecha: sa.fecha || new Date().toISOString().substring(0, 10),
                categoria: 'SART',
                tipo_alerta: sa.tipoAlerta || 'ACADÉMICA',
                nivel_riesgo: sa.severidad || 'MEDIO',
                observacion_descripcion: sa.descripcion || '',
                accion_tomada: sa.estado || 'PENDIENTE',
                docente_id: d.perfilDocente?.id || 'DOC-MAIN'
            }))
        ];

        const pruebas_formativas_y_diagnosticas = [
            ...(d.pruebasDiagnosticas || []).map(pd => ({
                prueba_id: pd.id,
                tipo_prueba: 'DIAGNÓSTICA',
                estudiante_id: pd.estudianteId,
                curso_id: pd.cursoId || '',
                parcial_id: 'INICIAL',
                bloque_tema: pd.asignatura || 'ESPAÑOL/MATEMÁTICAS',
                puntaje_obtenido: pd.puntaje || 0,
                puntaje_maximo: pd.maximo || 100,
                nivel_logro: pd.nivel || 'INICIAL',
                fecha_evaluacion: pd.fecha || new Date().toISOString().substring(0, 10)
            })),
            ...(Array.isArray(d.pruebasFormativas) ? d.pruebasFormativas : Object.values(d.pruebasFormativas || {})).map(pf => ({
                prueba_id: pf.id,
                tipo_prueba: 'FORMATIVA',
                estudiante_id: pf.estudianteId,
                curso_id: pf.cursoId || '',
                parcial_id: pf.parcialId || 'P1',
                bloque_tema: `Bloque ${pf.bloque} - Lección ${pf.leccion}`,
                puntaje_obtenido: pf.nota || 0,
                puntaje_maximo: pf.maximo || 100,
                nivel_logro: pf.nota >= 60 ? 'SATISFACTORIO' : 'INSATISFACTORIO',
                fecha_evaluacion: pf.fecha || new Date().toISOString().substring(0, 10)
            }))
        ];

        const agenda_y_eventos = (d.agendaEventos || []).map(ev => ({
            evento_id: ev.id,
            titulo: ev.title || ev.titulo || '',
            fecha_inicio: ev.start || ev.fecha || '',
            hora_inicio: ev.timeStart || ev.hora || '',
            tipo_evento: ev.type || 'MANUAL',
            curso_id: ev.courseId || '',
            descripcion: ev.description || '',
            color_ref: ev.color || '#2563eb',
            estado: 'PROGRAMADO'
        }));

        const banco_rubricas = (d.rubricas || []).map(r => ({
            rubrica_id: r.id,
            titulo: r.titulo || r.nombre || '',
            asignatura: r.asignatura || 'GENERAL',
            grado: r.grado || 'TODOS',
            criterios_json: JSON.stringify(r.criterios || []),
            niveles_json: JSON.stringify(r.niveles || []),
            fecha_creacion: r.creadoEn || new Date().toISOString()
        }));

        const cuadrosControladores = this.buildCuadrosControladoresPayload();

        return {
            estudiantes,
            matriculas,
            actividades_evaluacion: actividades,
            calificaciones,
            asistencia,
            conducta_personalidad,
            bitacora_y_sart,
            pruebas_formativas_y_diagnosticas,
            agenda_y_eventos,
            banco_rubricas,
            cuadrosControladores
        };
    },

    async uploadToSheets(silent = false) {
        if (!this.isConfigured()) {
            if (!silent) UI.toast('Por favor pegue la URL de su Web App de Google Sheets.', 'warning');
            return false;
        }

        this.isSyncing = true;
        if (!silent) UI.toast('📤 Generando Cuadros Controladores Fieles 1:1 en Google Sheets...', 'info');

        try {
            const payloadData = this.buildFullDataPayload();
            const result = await this._request('sync_all', 'POST', { data: payloadData });

            if (result.success || result.status === 'success') {
                localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
                this.isSyncing = false;
                if (!silent) UI.toast('✅ Cuadros Controladores 1:1 respaldados en Google Sheets', 'success');
                this.updateUIStatus();
                return true;
            } else {
                throw new Error(result.message || 'Error en Google Sheets');
            }
        } catch (err) {
            console.error('[GoogleSheetsSync] Error en la subida:', err);
            this.isSyncing = false;
            if (!silent) UI.toast('⚠️ No se pudo conectar a Google Sheets: ' + err.message, 'error');
            this.updateUIStatus();
            return false;
        }
    },

    async downloadFromSheets(silent = false) {
        if (!this.isConfigured()) {
            if (!silent) UI.toast('Por favor pegue la URL de su Web App de Google Sheets.', 'warning');
            return false;
        }

        this.isSyncing = true;
        if (!silent) UI.toast('📥 Descargando datos desde Google Sheets...', 'info');

        try {
            const result = await this._request('get_data', 'GET');

            if ((result.success || result.status === 'success') && result.data) {
                const cloudData = result.data;
                
                if (cloudData.estudiantes && cloudData.estudiantes.length > 0) {
                    Store.data.estudiantes = cloudData.estudiantes.map(e => ({
                        id: e.estudiante_id || e.id,
                        identidad: e.identidad || e.dni || '',
                        nombres: e.nombres || '',
                        apellidos: e.apellidos || '',
                        nombreCompleto: e.nombre_completo || `${e.nombres || ''} ${e.apellidos || ''}`.trim(),
                        genero: e.genero || (e.sexo === 'F' ? 'FEMENINO' : 'MASCULINO'),
                        fechaNacimiento: e.fecha_nacimiento || '',
                        tutor: e.tutor || '',
                        telefono: e.telefono_tutor || '',
                        domicilio: e.domicilio || '',
                        alergias: e.alergias || '',
                        codigo_sace: e.codigo_sace || ''
                    }));
                }

                if (cloudData.calificaciones && cloudData.calificaciones.length > 0) {
                    Store.data.calificaciones = cloudData.calificaciones.map(c => ({
                        id: c.calificacion_id || c.id,
                        actividadId: c.actividad_id || c.actividadId,
                        estudianteId: c.estudiante_id || c.estudianteId,
                        cursoId: c.curso_id || c.cursoId,
                        puntajeObtenido: c.nota_obtenida !== undefined ? c.nota_obtenida : c.nota,
                        porcentajeObtenido: c.porcentaje_obtenido || 0,
                        observacion: c.observacion || '',
                        estado: c.estado || 'CALIFICADO'
                    }));
                }

                await Store.save();
                localStorage.setItem(this.LAST_SYNC_KEY, new Date().toISOString());
                this.isSyncing = false;

                if (!silent) UI.toast('🎉 ¡Datos importados correctamente desde Google Sheets!', 'success');
                if (window.Router && window.Router.render) Router.render();
                return true;
            } else {
                throw new Error(result.message || 'Sin datos');
            }
        } catch (err) {
            console.error('[GoogleSheetsSync] Error en la descarga:', err);
            this.isSyncing = false;
            if (!silent) UI.toast('Error descargando de Google Sheets: ' + err.message, 'error');
            this.updateUIStatus();
            return false;
        }
    },

    updateUIStatus() {
        const badgeEl = document.getElementById('gsheets-status-badge');
        const lastSyncEl = document.getElementById('gsheets-last-sync-time');
        if (badgeEl) {
            if (this.isSyncing) {
                badgeEl.className = 'badge badge-warning';
                badgeEl.innerHTML = '<i data-lucide="refresh-cw" class="animate-spin" style="width:12px;"></i> Sincronizando...';
            } else if (this.isConfigured()) {
                badgeEl.className = 'badge badge-success';
                badgeEl.innerHTML = '🟢 Conectado';
            } else {
                badgeEl.className = 'badge badge-secondary';
                badgeEl.innerHTML = '⚪ Desconectado';
            }
        }
        if (lastSyncEl) {
            lastSyncEl.textContent = this.getLastSyncTime();
        }
        if (window.lucide) lucide.createIcons();
    }
};

window.GoogleSheetsSync = GoogleSheetsSync;
window.GoogleSheetsApi = GoogleSheetsSync;
