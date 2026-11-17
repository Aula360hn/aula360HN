/**
 * MÓDULO: CUADRO #1 - Calificaciones SACE (Versión Profesional)
 * Cuadro oficial de calificaciones del sistema SACE con auto-sincronización en vivo desde Evaluación y Cuadro Controlador.
 */

Views.Cuadro1 = {
    // Key en localStorage para guardar datos del cuadro1
    _key: function (courseId) { 
        var cId = courseId || ((Store.data && Store.data.activeCourseId) ? Store.data.activeCourseId : 'none');
        return 'cuadro1_' + cId; 
    },

    getData: function (courseId) {
        var raw = localStorage.getItem(this._key(courseId));
        if (raw) {
            try { return JSON.parse(raw); } catch (e) { return null; }
        }
        return null;
    },

    saveData: function (data, courseId) {
        try {
            localStorage.setItem(this._key(courseId), JSON.stringify(data));
            this.invalidateCache();
        } catch (e) {
            console.error('Error al guardar cuadro1:', e);
        }
    },

    _cachedDefault: null,
    _cachedDefaultCourseId: null,
    _cachedRecoveryAnalysis: null,
    _cachedRecCourseId: null,

    invalidateCache: function () {
        this._cachedDefault = null;
        this._cachedDefaultCourseId = null;
        this._cachedRecoveryAnalysis = null;
        this._cachedRecCourseId = null;
        if (window.Views && window.Views.Cuadro) {
            window.Views.Cuadro._cachedRecAnalysis = null;
            window.Views.Cuadro._cachedCourseId = null;
            window.Views.Cuadro._cachedPriorGrades = null;
        }
    },

    // Obtiene los 4 parciales oficiales del curso activo con rangos de fecha SACE garantizados
    getCourseParciales: function (courseId) {
        var cObj = (Store.get('cursos') || []).find(function (cur) { return cur.id === courseId; }) || Store.getActiveCourse();
        var anio = (cObj && cObj.anio) || (Store.data && Store.data.configAcademica && Store.data.configAcademica.anio) || 2026;
        var defaultStarts = [anio + '-02-01', anio + '-04-16', anio + '-07-01', anio + '-09-16'];
        var defaultEnds   = [anio + '-04-15', anio + '-06-30', anio + '-09-15', anio + '-11-30'];

        var cParciales = [];
        if (typeof Store.getParcialByCourse === 'function') {
            cParciales = Store.getParcialByCourse(courseId) || [];
        }
        if (!cParciales || cParciales.length === 0) {
            cParciales = (Store.data.parciales || []).filter(function (p) {
                return (p.cursoId === courseId || p.courseId === courseId);
            });
        }
        if (!cParciales || cParciales.length === 0) {
            cParciales = [
                { id: 'p1', numero: 1, nombre: 'Primer Parcial', fechaInicio: defaultStarts[0], fechaFin: defaultEnds[0] },
                { id: 'p2', numero: 2, nombre: 'Segundo Parcial', fechaInicio: defaultStarts[1], fechaFin: defaultEnds[1] },
                { id: 'p3', numero: 3, nombre: 'Tercer Parcial', fechaInicio: defaultStarts[2], fechaFin: defaultEnds[2] },
                { id: 'p4', numero: 4, nombre: 'Cuarto Parcial', fechaInicio: defaultStarts[3], fechaFin: defaultEnds[3] }
            ];
        }

        // Ordenar por número
        cParciales.sort(function (a, b) { return (Number(a.numero) || 0) - (Number(b.numero) || 0); });

        var defaultNames = ['Primer Parcial', 'Segundo Parcial', 'Tercer Parcial', 'Cuarto Parcial'];
        return cParciales.slice(0, 4).map(function (p, idx) {
            return {
                id: p.id || ('p' + (idx + 1)),
                numero: p.numero || (idx + 1),
                nombre: p.nombre || defaultNames[idx],
                fechaInicio: p.fechaInicio || defaultStarts[idx],
                fechaFin: p.fechaFin || defaultEnds[idx]
            };
        });
    },

    // Obtiene las actividades del curso correspondientes a un parcial de manera tolerante
    getActivitiesForParcial: function (courseId, parcialRef, parcialIndex) {
        var courseParciales = this.getCourseParciales(courseId);
        var targetParcial = null;

        if (parcialRef && typeof parcialRef === 'object') {
            targetParcial = courseParciales.find(function (cp) {
                return String(cp.id) === String(parcialRef.id) || Number(cp.numero) === Number(parcialRef.numero);
            }) || parcialRef;
        } else if (parcialRef) {
            targetParcial = courseParciales.find(function (cp) {
                return String(cp.id) === String(parcialRef) || Number(cp.numero) === Number(parcialRef);
            });
        }

        if (!targetParcial && typeof parcialIndex === 'number' && courseParciales[parcialIndex]) {
            targetParcial = courseParciales[parcialIndex];
        }

        var matchIds = new Set();
        if (targetParcial) {
            if (targetParcial.id) matchIds.add(String(targetParcial.id));
            if (targetParcial.numero) {
                matchIds.add(String(targetParcial.numero));
                matchIds.add('p' + targetParcial.numero);
            }
        }
        if (parcialRef) {
            if (typeof parcialRef === 'object') {
                if (parcialRef.id) matchIds.add(String(parcialRef.id));
                if (parcialRef.numero) {
                    matchIds.add(String(parcialRef.numero));
                    matchIds.add('p' + parcialRef.numero);
                }
            } else {
                matchIds.add(String(parcialRef));
            }
        }

        return (Store.get('actividades') || []).filter(function (a) {
            var cMatch = (a.cursoId === courseId || a.courseId === courseId);
            if (!cMatch) return false;
            var aParcId = String(a.parcialId !== undefined ? a.parcialId : (a.parcial || ''));
            return matchIds.has(aParcId);
        });
    },

    // Calcula la nota real ponderada del estudiante en un parcial dado
    computeStudentGrade: function (studentId, courseId, parcialRef, parcialIndex, optScoresMap, optActivities, optExtraPointsMap) {
        var realParcialId = (typeof parcialRef === 'object' && parcialRef && parcialRef.id) ? parcialRef.id : parcialRef;
        var isRecupMode = (parcialRef === 'recuperacion' || realParcialId === 'recuperacion');
        var extraPoints = 0;
        if (!isRecupMode) {
            if (optExtraPointsMap) {
                extraPoints = optExtraPointsMap.get(studentId + '_' + realParcialId) || 0;
            } else if (typeof Store.getStudentExtraordinaryPoints === 'function') {
                extraPoints = Store.getStudentExtraordinaryPoints(studentId, courseId, realParcialId) || 0;
            } else if (typeof Store.getExtraPointsForStudent === 'function') {
                extraPoints = Store.getExtraPointsForStudent(studentId, courseId, realParcialId) || 0;
            }
        }

        var activities = optActivities || this.getActivitiesForParcial(courseId, parcialRef, parcialIndex);
        if (!activities || activities.length === 0) {
            var emgDirect = (typeof Store.getEmergencyGrade === 'function') ? Store.getEmergencyGrade(courseId, parcialRef, studentId, parcialIndex) : null;
            if (emgDirect !== null && emgDirect !== '') {
                var totEmg = Math.round(Number(emgDirect) + extraPoints);
                return totEmg > 100 ? 100 : totEmg;
            }
            return '';
        }

        var scores = null;
        if (!optScoresMap) {
            var allCalifs = Store.get('calificaciones') || [];
            scores = allCalifs.filter(function (sc) {
                return sc.estudianteId === studentId && (sc.cursoId === courseId || sc.courseId === courseId || !sc.cursoId);
            });
        }

        var isRecup = (parcialRef === 'recuperacion' || (typeof parcialRef === 'object' && parcialRef && parcialRef.id === 'recuperacion'));
        var dims = isRecup ? [
            { key: 'aula', nombre: 'Guía / Acumulativo de Reforzamiento', porcentaje: 40 },
            { key: 'examenes', nombre: 'Examen de Recuperación', porcentaje: 60 }
        ] : ((Store.data.configAcademica && Store.data.configAcademica.dimensions) || [
            { key: 'extraAula', nombre: 'Actividades Extra-Aula', porcentaje: 10 },
            { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 25 },
            { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10 },
            { key: 'expresiones', nombre: 'Expresiones Artísticas', porcentaje: 5 },
            { key: 'examenes', nombre: 'Examen Escrito o Práctico', porcentaje: 50 }
        ]);

        var studentFinal = 0;
        var hasScores = false;
        var matchedActs = new Set();

        dims.forEach(function (dim) {
            var dimActs = activities.filter(function (a) {
                var dKey = a.dimensionKey || a.dimension || '';
                return dKey === dim.key || 
                       (dim.key === 'aula' && (dKey === 'actividadesAula' || dKey === 'aula')) ||
                       (dim.key === 'extraAula' && (dKey === 'actividadesExtraAula' || dKey === 'extraAula')) ||
                       (dim.key === 'actitudes' && (dKey === 'valores' || dKey === 'actitudes')) ||
                       (dim.key === 'expresiones' && (dKey === 'artisticas' || dKey === 'expresiones')) ||
                       (dim.key === 'examenes' && (dKey === 'examen' || dKey === 'examenes'));
            });

            if (dimActs.length === 0) return;

            var dimObtained = 0;
            var dimMax = 0;

            dimActs.forEach(function (act) {
                matchedActs.add(act.id);
                var score = optScoresMap ? optScoresMap.get(studentId + '_' + act.id) : (scores ? scores.find(function (sc) { return sc.actividadId === act.id; }) : null);
                var obt = score ? (score.puntajeObtenido !== undefined && score.puntajeObtenido !== null && score.puntajeObtenido !== ''
                    ? Number(score.puntajeObtenido)
                    : Number(score.nota || 0)) : 0;
                var mx = Number(act.puntajeMax || 0);

                if (score && score.puntajeObtenido !== undefined && score.puntajeObtenido !== '' && score.puntajeObtenido !== null) {
                    hasScores = true;
                }
                dimObtained += obt;
                dimMax += mx;
            });

            var dimSub = isRecup
                ? Math.min(dimObtained, dim.porcentaje)
                : (dimMax > 0 ? Math.min((dimObtained / dimMax) * dim.porcentaje, dim.porcentaje) : 0);
            studentFinal += dimSub;
        });

        // Actividades que no coinciden con las dimensiones configuradas (suma directa)
        var extraActs = activities.filter(function (a) { return !matchedActs.has(a.id); });
        if (extraActs.length > 0) {
            extraActs.forEach(function (act) {
                var score = optScoresMap ? optScoresMap.get(studentId + '_' + act.id) : (scores ? scores.find(function (sc) { return sc.actividadId === act.id; }) : null);
                if (score && score.puntajeObtenido !== undefined && score.puntajeObtenido !== '' && score.puntajeObtenido !== null) {
                    hasScores = true;
                    studentFinal += Number(score.puntajeObtenido);
                }
            });
        }

        if (!hasScores && !isRecup && typeof Store.getEmergencyGrade === 'function') {
            var emgFallback = Store.getEmergencyGrade(courseId, parcialRef, studentId, parcialIndex);
            if (emgFallback !== null && emgFallback !== '') {
                studentFinal = Number(emgFallback);
                hasScores = true;
            }
        }

        var total = Math.round(studentFinal + extraPoints);
        var maxCap = isRecup ? 70 : 100;
        if (total > maxCap) total = maxCap;
        return (hasScores || total > 0) ? total : '';
    },

    // Obtiene la nota oficial de recuperación del estudiante (topada a máximo 70%)
    getEffectiveRecoveryGrade: function (studentId, courseId) {
        var c1Data = this.getData(courseId) || (Store.data && Store.data['cuadro1_' + courseId]);
        if (c1Data && Array.isArray(c1Data.filas)) {
            var fRow = c1Data.filas.find(function (f) { return f.estudianteId === studentId; });
            if (fRow && fRow.recuperacion !== '' && fRow.recuperacion !== null && fRow.recuperacion !== undefined && !isNaN(Number(fRow.recuperacion))) {
                var saved = Math.round(Number(fRow.recuperacion));
                return saved > 70 ? 70 : saved;
            }
        }
        var computed = this.computeStudentGrade(studentId, courseId, 'recuperacion');
        if (computed !== '' && computed !== null && computed !== undefined && !isNaN(Number(computed))) {
            var compNum = Math.round(Number(computed));
            return compNum > 70 ? 70 : compNum;
        }
        return null;
    },

    // Verifica si una fecha cae dentro del rango de un parcial (con soporte de mes-día por si cambia el año)
    _isDateInParcial: function (fechaStr, p) {
        if (!fechaStr || !p || !p.fechaInicio || !p.fechaFin) return false;
        var f = String(fechaStr).trim().slice(0, 10);
        var ini = String(p.fechaInicio).trim().slice(0, 10);
        var fin = String(p.fechaFin).trim().slice(0, 10);
        if (f >= ini && f <= fin) return true;
        // Respaldo por mes-día (MM-DD) por si los años difieren entre la configuración y la fecha registrada
        if (f.length === 10 && ini.length === 10 && fin.length === 10) {
            var md = f.slice(5);
            var mdIni = ini.slice(5);
            var mdFin = fin.slice(5);
            if (md >= mdIni && md <= mdFin) return true;
        }
        return false;
    },

    // Obtiene los IDs del curso actual y sus cursos paralelos de la misma sección
    _getCourseAndParallelIds: function (courseId) {
        var ids = [courseId];
        if (typeof Logic !== 'undefined' && typeof Logic.getParallelCourses === 'function') {
            var pIds = Logic.getParallelCourses(courseId) || [];
            pIds.forEach(function (id) {
                if (id && ids.indexOf(id) === -1) ids.push(id);
            });
        }
        return ids;
    },

    // Obtiene las inasistencias en el rango de fechas del parcial
    computeStudentAbsences: function (studentId, courseId, parcialRef, parcialIndex, optAbsMap) {
        if (optAbsMap) {
            var realPId = (typeof parcialRef === 'object' && parcialRef && parcialRef.id) ? parcialRef.id : parcialRef;
            return optAbsMap[studentId + '_' + realPId] || '';
        }
        var courseParciales = this.getCourseParciales(courseId);
        var p = (typeof parcialRef === 'object' && parcialRef) ? parcialRef : courseParciales.find(function (cp) {
            return String(cp.id) === String(parcialRef) || String(cp.numero) === String(parcialRef);
        });
        if (!p && typeof parcialIndex === 'number') p = courseParciales[parcialIndex];
        if (p && (!p.fechaInicio || !p.fechaFin) && typeof parcialIndex === 'number' && courseParciales[parcialIndex]) {
            p = courseParciales[parcialIndex];
        }

        if (!p || !p.fechaInicio || !p.fechaFin) return '';
        var self = this;
        var validCourseIds = this._getCourseAndParallelIds(courseId);
        var seenDates = {};
        var count = 0;

        (Store.get('asistencia') || []).forEach(function (a) {
            if (!a || a.estudianteId !== studentId) return;
            var aCid = a.cursoId || a.courseId;
            if (validCourseIds.indexOf(aCid) === -1) return;
            if (String(a.estado || '').toUpperCase() !== 'A') return;
            var fKey = String(a.fecha || '').trim().slice(0, 10);
            if (!fKey || seenDates[fKey]) return;
            if (self._isDateInParcial(fKey, p)) {
                seenDates[fKey] = true;
                count++;
            }
        });
        return count > 0 ? count : '';
    },

    // Construye la estructura base inicial con pre-indexación de alto rendimiento O(N)
    buildDefault: function (courseId) {
        var c = courseId ? (Store.get('cursos') || []).find(function(cur){ return cur.id === courseId; }) || Store.getActiveCourse() : Store.getActiveCourse();
        if (!c) return null;
        if (this._cachedDefault && this._cachedDefaultCourseId === c.id) {
            return this._cachedDefault;
        }

        var self = this;
        var students = Store.getStudentsByCourse(c.id).filter(function (s) { return s.estadoMatricula !== 'Traslado'; });
        var parciales = this.getCourseParciales(c.id);
        var validCourseIds = this._getCourseAndParallelIds(c.id);

        // Pre-indexar inasistencias en una única pasada O(N), deduplicadas por estudiante + fecha
        var absMap = {};
        var seenStudentDate = {};
        var courseAsist = (Store.get('asistencia') || []).filter(function (a) {
            var aCid = a && (a.cursoId || a.courseId);
            return a && validCourseIds.indexOf(aCid) !== -1 && String(a.estado || '').toUpperCase() === 'A';
        });
        courseAsist.forEach(function (a) {
            var fKey = String(a.fecha || '').trim().slice(0, 10);
            var sdKey = a.estudianteId + '_' + fKey;
            if (!fKey || seenStudentDate[sdKey]) return;
            seenStudentDate[sdKey] = true;
            parciales.forEach(function (p) {
                if (self._isDateInParcial(fKey, p)) {
                    var k = a.estudianteId + '_' + p.id;
                    absMap[k] = (absMap[k] || 0) + 1;
                }
            });
        });

        // Pre-indexar calificaciones en Map O(1)
        var optScoresMap = new Map();
        var allCourseScores = (Store.get('calificaciones') || []).filter(function (sc) {
            return sc.cursoId === c.id || sc.courseId === c.id || !sc.cursoId;
        });
        allCourseScores.forEach(function (sc) {
            if (sc.estudianteId && sc.actividadId) {
                optScoresMap.set(sc.estudianteId + '_' + sc.actividadId, sc);
            }
        });

        // Pre-indexar puntos extraordinarios
        var optExtraPointsMap = new Map();
        if (Store.data.extraordinary_activities && Store.data.activity_bonus_records) {
            var courseExtraActs = Store.data.extraordinary_activities.filter(function (a) {
                return (a.course_id === c.id || a.cursoId === c.id);
            });
            var extraActParcialMap = {};
            courseExtraActs.forEach(function (a) {
                extraActParcialMap[a.id] = a.partial_id || a.parcialId;
            });
            Store.data.activity_bonus_records.forEach(function (r) {
                var pId = extraActParcialMap[r.extraordinary_activity_id];
                if (pId && r.participated !== false) {
                    var k = r.student_id + '_' + pId;
                    var pts = Number(r.points_awarded) || 0;
                    optExtraPointsMap.set(k, (optExtraPointsMap.get(k) || 0) + pts);
                }
            });
        }

        // Pre-cargar actividades por parcial para evitar filtros repetitivos
        var self = this;
        var actsByParcial = {};
        parciales.forEach(function (p, pIdx) {
            actsByParcial[p.id] = self.getActivitiesForParcial(c.id, p, pIdx);
        });

        var filas = students.map(function (st) {
            var pData = {};
            parciales.forEach(function (p, pIdx) {
                var autoGrade = self.computeStudentGrade(st.id, c.id, p, pIdx, optScoresMap, actsByParcial[p.id], optExtraPointsMap);
                var autoAbs = absMap[st.id + '_' + p.id] || '';
                pData[p.id] = {
                    in: autoAbs,
                    nt: autoGrade,
                    nf: autoGrade
                };
            });
            return {
                estudianteId: st.id,
                nombre: st.nombreCompleto,
                identidad: st.identidad || '',
                parciales: pData,
                recuperacion: '',
                observaciones: ''
            };
        });

        var res = { 
            parciales: parciales, 
            filas: filas 
        };
        this._cachedDefault = res;
        this._cachedDefaultCourseId = c.id;
        return res;
    },

    // Calcula la nota final promedio de los parciales NF
    calcPromedio: function (fila, parciales) {
        var sum = 0, count = 0;
        parciales.forEach(function (p) {
            var pd = fila.parciales && (fila.parciales[p.id] || fila.parciales[String(p.numero)] || fila.parciales['p' + p.numero]);
            var nf = parseFloat(pd && pd.nf);
            if (!isNaN(nf)) { sum += nf; count++; }
        });
        if (count === 0) return '';
        return Math.round(sum / count);
    },

    // Análisis Anual y Aplicación de la Regla de 280 Puntos (SACE Honduras)
    getStudentAnnualAnalysis: function (studentId, courseId, preloadedData, skipDeficiencies) {
        var c = courseId ? (Store.get('cursos') || []).find(function(cur){ return cur.id === courseId; }) || Store.getActiveCourse() : Store.getActiveCourse();
        if (!c) return null;
        var parciales = this.getCourseParciales(c.id);
        var data = preloadedData || this.getData(c.id) || this.buildDefault(c.id);
        var row = (data && data.filas) ? data.filas.find(function(f){ return f.estudianteId === studentId; }) : null;
        var student = (Store.getStudentsByCourse(c.id) || []).find(function(s){ return s.id === studentId; });

        var self = this;
        var parcialBreakdown = [];
        var totalPoints = 0;
        var countGraded = 0;
        var hasFourthParcial = false;

        parciales.forEach(function (p, pIdx) {
            var pd = row && row.parciales && (row.parciales[p.id] || row.parciales[String(p.numero)] || row.parciales['p' + p.numero]);
            var autoGrade = self.computeStudentGrade(studentId, c.id, p, pIdx);
            var nf = (autoGrade !== '' && !isNaN(Number(autoGrade))) ? Number(autoGrade) : (pd ? parseFloat(pd.nf) : NaN);
            var hasGrade = !isNaN(nf);
            var scoreVal = hasGrade ? nf : 0;
            if (hasGrade) {
                totalPoints += scoreVal;
                countGraded++;
                if (pIdx === 3 || Number(p.numero) === 4) hasFourthParcial = true;
            }
            parcialBreakdown.push({
                parcial: p,
                score: hasGrade ? scoreVal : null,
                hasGrade: hasGrade,
                isPassing: hasGrade ? scoreVal >= 70 : false
            });
        });

        var promedioAnual = countGraded > 0 ? Math.round(totalPoints / countGraded) : 0;
        var pointsDeficit = Math.max(0, 280 - totalPoints);
        var remainingParciales = Math.max(0, 4 - countGraded);
        // Regla oficial SACE: 4 parciales x 100 = 400 pts. Umbral mínimo de aprobación = 280 pts (70%)
        var isFailing280 = (countGraded > 0) && ((hasFourthParcial || countGraded >= 4) ? (totalPoints < 280) : (pointsDeficit > remainingParciales * 100));

        // Búsqueda inteligente de actividades deficientes (< 70% de su valor) a lo largo del año
        var deficientActivities = [];
        if (!skipDeficiencies) {
            var allActs = (Store.get('actividades') || []).filter(function(a){ return a.cursoId === c.id; });
            var allScores = (Store.get('calificaciones') || []).filter(function(sc){ return sc.estudianteId === studentId && (sc.cursoId === c.id || !sc.cursoId); });

            allActs.forEach(function (act) {
                var maxPts = Number(act.puntajeMax || 0);
                if (maxPts <= 0) return;
                var sc = allScores.find(function(s){ return s.actividadId === act.id; });
                var obt = sc ? Number(sc.puntajeObtenido || 0) : 0;
                var pct = (obt / maxPts) * 100;
                if (pct < 70) {
                    var pFound = parciales.find(function(p){ return String(p.id) === String(act.parcialId) || String(p.numero) === String(act.parcialId); });
                    deficientActivities.push({
                        actId: act.id,
                        nombre: act.nombre,
                        dimension: act.dimensionKey || act.dimension || '',
                        parcialNombre: pFound ? pFound.nombre : 'Parcial',
                        puntajeObtenido: obt,
                        puntajeMax: maxPts,
                        porcentaje: Math.round(pct)
                    });
                }
            });
        }

        var recVal = row ? (row.recuperacion !== undefined ? row.recuperacion : '') : '';

        return {
            studentId: studentId,
            nombreCompleto: student ? student.nombreCompleto : (row ? row.nombre : 'Estudiante'),
            identidad: student ? (student.identidad || '') : (row ? row.identidad : ''),
            parciales: parcialBreakdown,
            totalPoints: totalPoints,
            promedioAnual: promedioAnual,
            countGraded: countGraded,
            isFailing280: isFailing280,
            pointsDeficit: pointsDeficit,
            deficientActivities: deficientActivities,
            recuperacion: recVal
        };
    },

    // Resumen consolidado del grupo para el proceso de recuperación (Instantáneo con caché O(N))
    getRecoveryAnalysis: function (courseId) {
        var c = courseId ? (Store.get('cursos') || []).find(function(cur){ return cur.id === courseId; }) || Store.getActiveCourse() : Store.getActiveCourse();
        if (!c) return { failingStudents: [], exemptStudents: [], totalStudents: 0, reprobadosCount: 0, aprobadosCount: 0 };

        if (this._cachedRecoveryAnalysis && this._cachedRecCourseId === c.id) {
            return this._cachedRecoveryAnalysis;
        }

        var activeStudents = Store.getStudentsByCourse(c.id).filter(function(s){ return s.estadoMatricula !== 'Traslado'; });
        var self = this;
        var failing = [];
        var exempt = [];

        // Genera o lee los datos una ÚNICA VEZ para todo el curso
        var data = this.getData(c.id) || this.buildDefault(c.id);

        activeStudents.forEach(function (st) {
            var analysis = self.getStudentAnnualAnalysis(st.id, c.id, data, true);
            if (analysis) {
                if (analysis.isFailing280) {
                    failing.push(analysis);
                } else {
                    exempt.push(analysis);
                }
            }
        });

        var res = {
            failingStudents: failing,
            exemptStudents: exempt,
            totalStudents: activeStudents.length,
            reprobadosCount: failing.length,
            aprobadosCount: exempt.length
        };
        this._cachedRecoveryAnalysis = res;
        this._cachedRecCourseId = c.id;
        return res;
    },

    // Modal Inteligente de Recuperación Anual (Diagnóstico y Calificación)
    openSmartRecoveryModal: function (studentId) {
        var c = Store.getActiveCourse();
        if (!c) return;
        var an = this.getStudentAnnualAnalysis(studentId, c.id);
        if (!an) return;

        var recVal = an.recuperacion || '';
        var obsPreview = this.getObs(an.promedioAnual, recVal);

        var pPills = an.parciales.map(function (pObj, idx) {
            var sc = pObj.hasGrade ? pObj.score + '%' : '—';
            var bg = pObj.hasGrade ? (pObj.score >= 70 ? '#dcfce7' : '#fee2e2') : '#f1f5f9';
            var fg = pObj.hasGrade ? (pObj.score >= 70 ? '#15803d' : '#b91c1c') : '#64748b';
            var border = pObj.hasGrade ? (pObj.score >= 70 ? '#86efac' : '#fca5a5') : '#cbd5e1';
            var roman = ['I', 'II', 'III', 'IV'][idx] || (idx + 1);
            return `
                <div style="background:${bg}; color:${fg}; border:1px solid ${border}; border-radius:10px; padding:8px 12px; text-align:center; min-width:70px; flex:1;">
                    <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">${roman} Parcial</div>
                    <div style="font-size:16px; font-weight:900; margin-top:2px;">${sc}</div>
                </div>
            `;
        }).join('');

        var defHtml = '';
        if (an.deficientActivities.length > 0) {
            defHtml = `
                <div style="max-height:180px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:10px; padding:8px 12px; background:#fff;">
                    <div style="font-size:11px; font-weight:800; color:#b45309; text-transform:uppercase; margin-bottom:6px; display:flex; align-items:center; gap:5px;">
                        <i data-lucide="alert-triangle" style="width:13px; height:13px;"></i> Temas y Actividades del Año con rendimiento < 70% (${an.deficientActivities.length})
                    </div>
                    <div style="display:grid; grid-template-columns:1fr; gap:6px;">
                        ${an.deficientActivities.map(function(act, idx) {
                            return `
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11.5px; padding:4px 6px; background:#fef2f2; border-radius:6px; border:1px solid #fee2e2;">
                                    <div style="font-weight:700; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                        <span style="font-weight:800; color:#64748b; margin-right:4px;">${act.parcialNombre}:</span> ${act.nombre}
                                    </div>
                                    <div style="font-weight:900; color:#b91c1c; white-space:nowrap;">
                                        ${act.puntajeObtenido} / ${act.puntajeMax} pts (${act.porcentaje}%)
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            defHtml = `
                <div style="padding:10px 14px; background:#f8fafc; border-radius:10px; border:1px dashed #cbd5e1; font-size:12px; color:#64748b; text-align:center;">
                    No se registran actividades individuales con déficit crítico menor al 70%.
                </div>
            `;
        }

        var statusBg = an.isFailing280 ? '#fee2e2' : '#dcfce7';
        var statusFg = an.isFailing280 ? '#991b1b' : '#15803d';
        var statusBorder = an.isFailing280 ? '#f87171' : '#86efac';
        var statusText = an.isFailing280 ? `⚠️ REPROBADO ANUAL &bull; Faltan ${an.pointsDeficit} puntos para alcanzar los 280 pts reglamentarios` : `✅ APROBADO EXENTO &bull; Acumuló ${an.totalPoints} pts (>= 280 pts)`;

        var modalHtml = `
            <div style="padding:4px 6px; font-family:system-ui, -apple-system, sans-serif;">
                <!-- Header del Alumno -->
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #e2e8f0;">
                    <div style="background:linear-gradient(135deg, #7c3aed, #4f46e5); color:#fff; width:44px; height:44px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; font-size:18px; font-weight:900; box-shadow:0 4px 10px rgba(124,58,237,0.25);">
                        <i data-lucide="sparkles" style="width:22px; height:22px;"></i>
                    </div>
                    <div>
                        <div style="font-size:16px; font-weight:900; color:#0f172a; line-height:1.2;">${an.nombreCompleto}</div>
                        <div style="font-size:12px; font-weight:700; color:#64748b; margin-top:2px;">
                            ${an.identidad ? 'ID: ' + an.identidad + ' &bull; ' : ''}${c.asignatura || 'Curso'} &bull; ${c.grado ? c.grado + '°' : ''} &ldquo;${c.seccion || '1'}&rdquo;
                        </div>
                    </div>
                </div>

                <!-- Tarjeta Diagnóstica Regla 280 Puntos -->
                <div style="background:${statusBg}; color:${statusFg}; border:1px solid ${statusBorder}; border-radius:12px; padding:12px 14px; margin-bottom:16px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div style="font-size:12px; font-weight:900; letter-spacing:0.02em;">
                            ${statusText}
                        </div>
                        <div style="font-size:13px; font-weight:900; background:rgba(255,255,255,0.7); padding:3px 10px; border-radius:20px; border:1px solid rgba(0,0,0,0.06);">
                            Total: <b>${an.totalPoints} / 400 pts</b> (${an.promedioAnual}%)
                        </div>
                    </div>
                </div>

                <!-- Desglose por Parcial -->
                <div style="margin-bottom:16px;">
                    <div style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:6px;">Calificaciones por Parcial:</div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${pPills}
                    </div>
                </div>

                <!-- Diagnóstico de Temas Clave -->
                <div style="margin-bottom:18px;">
                    ${defHtml}
                </div>

                <!-- Panel de Calificación de Recuperación SACE -->
                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:14px; padding:16px; margin-bottom:16px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
                        <div>
                            <div style="font-size:13px; font-weight:900; color:#0f172a;">Calificación del Proceso de Recuperación</div>
                            <div style="font-size:11px; color:#64748b; font-weight:600;">(Guías de reforzamiento de los 10 temas + Examen de Recuperación)</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:12px; font-weight:800; color:#475569;">Nota Oficial:</span>
                            <input id="smart-rec-input" type="number" min="0" max="100" value="${recVal}" 
                                   placeholder="0 - 100" 
                                   oninput="Views.Cuadro1.previewRecStatus(this.value, ${an.promedioAnual})" 
                                   style="width:85px; height:38px; border:2px solid #7c3aed; border-radius:8px; text-align:center; font-size:16px; font-weight:900; color:#7c3aed; background:#fff; outline:none;" />
                            <span style="font-size:14px; font-weight:800; color:#7c3aed;">%</span>
                        </div>
                    </div>

                    <!-- Vista Previa de Resolución Oficial -->
                    <div id="smart-rec-preview" style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:12px; font-weight:700; color:#334155; display:flex; align-items:center; justify-content:space-between;">
                        <span>Resolución Oficial SACE:</span>
                        <span id="smart-rec-badge" style="padding:3px 10px; border-radius:6px; font-weight:900; font-size:11.5px; background:${obsPreview.includes('RECUPERACIÓN') ? '#dcfce7; color:#15803d;' : obsPreview.includes('SATISFACTORIO') ? '#fef9c3; color:#854d0e;' : '#fee2e2; color:#b91c1c;'}">
                            ${obsPreview || 'PENDIENTE'}
                        </span>
                    </div>
                </div>

                <!-- Botones de Acción -->
                <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-top:8px;">
                    <button class="btn btn-sm btn-secondary" onclick="UI.closeModal(); if (Router.current !== 'cuadro') { Router.navigate('cuadro'); } Views.Cuadro.render('recuperacion');" style="font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="table-2" style="width:14px;"></i> Ir a Plan de Recuperación
                    </button>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button class="btn btn-secondary btn-sm" onclick="UI.closeModal();" style="font-weight:700;">Cancelar</button>
                        <button class="btn btn-primary btn-sm" onclick="Views.Cuadro1.saveSmartRec('${studentId}', document.getElementById('smart-rec-input').value)" style="background:#7c3aed; border-color:#7c3aed; font-weight:900; font-size:12px; display:inline-flex; align-items:center; gap:6px; padding:8px 16px; box-shadow:0 2px 8px rgba(124,58,237,0.3);">
                            <i data-lucide="check" style="width:15px; height:15px;"></i> Guardar Calificación
                        </button>
                    </div>
                </div>
            </div>
        `;

        UI.modal('⚡ Diagnóstico Inteligente de Recuperación (Regla 280 Pts)', modalHtml, 'max-width: 650px; padding: 20px;');
        setTimeout(function () { if (window.lucide) window.lucide.createIcons(); }, 80);
    },

    previewRecStatus: function (val, promAnual) {
        var badge = document.getElementById('smart-rec-badge');
        if (!badge) return;
        var numVal = parseFloat(val);
        var cappedVal = (!isNaN(numVal) && numVal > 70) ? 70 : val;
        var obs = this.getObs(promAnual, cappedVal);
        badge.innerText = obs || 'PENDIENTE';
        if (obs.includes('RECUPERACIÓN')) {
            badge.style.background = '#dcfce7';
            badge.style.color = '#15803d';
        } else if (obs.includes('SATISFACTORIO') || obs.includes('AVANZADO') || obs.includes('EXCELENTE')) {
            badge.style.background = '#e0f2fe';
            badge.style.color = '#0369a1';
        } else if (obs.includes('MEJORAR')) {
            badge.style.background = '#fee2e2';
            badge.style.color = '#b91c1c';
        } else {
            badge.style.background = '#f1f5f9';
            badge.style.color = '#64748b';
        }
    },

    saveSmartRec: function (studentId, val) {
        this.updateRec(studentId, val);
        UI.closeModal();
        UI.toast('✅ Calificación de recuperación guardada y sincronizada con éxito', 'success');
    },

    // Determina la observación según escala oficial SACE
    getObs: function (pf, rec) {
        if (typeof SACELogic !== 'undefined' && typeof SACELogic.getObservation === 'function') {
            return SACELogic.getObservation(pf, rec);
        }
        var score = parseFloat(pf);
        var recScore = parseFloat(rec);
        if (isNaN(score) && isNaN(recScore)) return '';
        
        var finalScore = !isNaN(recScore) ? recScore : score;
        if (!isNaN(recScore) && recScore >= 70) return 'SATISFACTORIO [RECUPERACIÓN]';
        
        if (finalScore >= 91) return 'EXCELENTE';
        if (finalScore >= 80) return 'AVANZADO';
        if (finalScore >= 70) return 'SATISFACTORIO';
        return 'NECESITA MEJORAR';
    },

    // Resolución inteligente y unificada de los datos institucionales del Centro (Código SACE, Director, Municipio, Depto)
    getCenterMetadata: function (c) {
        var sysConfig = (Store.data && (Store.data.configCentro || Store.data.configAcademica)) || {};
        var centros = (Store.data && Store.data.centrosEducativos) || [];

        var _normCE = function (s) {
            return String(s || '').trim().toUpperCase().normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/CENTRO DE EDUCACION BASICA GUBERNAMENTAL|CENTRO DE EDUCACION BASICA|ESCUELA DE EDUCACION BASICA|CENTRO ESCOLAR|ESCUELA|INSTITUTO|C\.E\.B\.G\.|C\.E\.B\.G|CEBG|C\.E\.B\.|C\.E\.B|CEB/g, '')
                .replace(/[^A-Z0-9]/g, '');
        };

        var rawCourseCentro = (c && (c.centroEducativo || c.centro || c.nombreCentro)) || '';
        var nombreCentro = rawCourseCentro
            || sysConfig.nombreCentro 
            || sysConfig.centroEducativo 
            || sysConfig.nombre 
            || (centros[0] && centros[0].nombre) 
            || 'CENTRO EDUCATIVO';

        // 1. Buscar coincidencia en Store.data.centrosEducativos
        var matchedCE = centros.find(function (x) {
            if (!x) return false;
            if (c && c.centroId && x.id === c.centroId) return true;
            if (c && c.centroEducativoId && x.id === c.centroEducativoId) return true;
            if (x.nombre && rawCourseCentro && _normCE(x.nombre) === _normCE(rawCourseCentro)) return true;
            if (x.nombre && nombreCentro && _normCE(x.nombre) === _normCE(nombreCentro)) return true;
            return false;
        });

        // Coincidencia parcial si no hay coincidencia exacta
        if (!matchedCE && centros.length === 1) {
            matchedCE = centros[0];
        } else if (!matchedCE && centros.length > 0) {
            var normTarget = _normCE(nombreCentro) || _normCE(rawCourseCentro);
            matchedCE = centros.find(function (x) {
                var n = _normCE(x.nombre);
                return n && normTarget && (n.includes(normTarget) || normTarget.includes(n));
            }) || centros[0];
        }

        // Auto-detectar código SACE de todas las fuentes posibles
        var codigoCentro = (c && (c.codigoCentro || c.codigoSace || c.codigo))
            || (matchedCE && (matchedCE.codigoCentro || matchedCE.codigo || matchedCE.codigoSace))
            || sysConfig.codigoCentro
            || sysConfig.codigoSace
            || sysConfig.codigo
            || (centros[0] && (centros[0].codigoCentro || centros[0].codigo || centros[0].codigoSace))
            || '';

        // Auto-sincronizar el curso activo si no tenía asignado el código
        if (c && !c.codigoCentro && codigoCentro) {
            c.codigoCentro = codigoCentro;
        }

        var director = (c && c.director && c.director.trim())
            || (matchedCE && matchedCE.director && matchedCE.director.trim())
            || (sysConfig.director && sysConfig.director.trim())
            || (sysConfig.nombreDirector && sysConfig.nombreDirector.trim())
            || (centros[0] && centros[0].director && centros[0].director.trim())
            || '';

        var departamento = (matchedCE && matchedCE.departamento)
            || (c && c.departamento)
            || sysConfig.departamento
            || (centros[0] && centros[0].departamento)
            || 'CORTÉS';

        var municipio = (matchedCE && matchedCE.municipio)
            || (c && c.municipio)
            || sysConfig.municipio
            || (centros[0] && centros[0].municipio)
            || 'OMOA';

        var docente = (Store.data && Store.data.perfilDocente && Store.data.perfilDocente.nombre && Store.data.perfilDocente.nombre.trim())
            || (c && c.docente && c.docente.trim())
            || (sysConfig.docente && sysConfig.docente.trim())
            || (sysConfig.nombreDocente && sysConfig.nombreDocente.trim())
            || '—';

        return {
            nombre: (matchedCE && matchedCE.nombre) || nombreCentro,
            codigoCentro: String(codigoCentro || '').trim() || '—',
            director: String(director || '').trim() || '—',
            departamento: String(departamento || '').trim() || 'CORTÉS',
            municipio: String(municipio || '').trim() || 'OMOA',
            docente: String(docente || '').trim() || '—'
        };
    },

    render: function () {
        var c = Store.getActiveCourse();
        if (!c) {
            return `
                <div class="card" style="padding:48px; text-align:center; margin:20px; background:#fff; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                    <i data-lucide="file-spreadsheet" style="width:56px; height:56px; margin:0 auto 16px; opacity:0.3; color:#1e293b;"></i>
                    <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin-bottom:8px;">Selecciona un curso activo</h3>
                    <p style="color:var(--text-muted); font-size:13px; max-width:400px; margin:0 auto;">Necesitas tener un curso activo para visualizar y gestionar el Cuadro #1 de Calificaciones SACE.</p>
                </div>`;
        }

        var cleanText = function (str) {
            if (!str) return '';
            return String(str)
                .replace(/Í"/g, 'Ó')
                .replace(/Ó"/g, 'Ó')
                .replace(/Ã“/g, 'Ó')
                .replace(/Ã³/g, 'Ó')
                .replace(/A!O/g, 'AÑO')
                .replace(/A¿O/g, 'AÑO')
                .replace(/EDUCACIÍ"N/g, 'EDUCACIÓN')
                .replace(/SECCIÍ"N/g, 'SECCIÓN');
        };

        var meta = this.getCenterMetadata(c);
        var asig = cleanText(c.asignatura || 'CAMPO DEL CONOCIMIENTO');
        var grado = cleanText(c.grado || '');
        var anio = c.anio || (new Date().getFullYear());
        var seccion = cleanText(c.seccion || '1');
        var jornada = cleanText(c.jornada || 'MATUTINA');
        var docente = cleanText(meta.docente);
        var modalidad = cleanText(c.modalidad || 'EDUCACIÓN BÁSICA');
        var centro = cleanText(meta.nombre);
        var codigoCentro = meta.codigoCentro;

        var courseParciales = this.getCourseParciales(c.id);
        var saved = this.getData();
        var data = saved || this.buildDefault();
        var self = this;

        if (!data || !data.filas) {
            data = this.buildDefault();
        }

        data.parciales = courseParciales;

        // Auto-sincronizar estudiantes activos y calcular notas en vivo
        var activeStudents = Store.getStudentsByCourse(c.id);
        var activeStudentIds = {};
        activeStudents.forEach(function (st) { activeStudentIds[st.id] = true; });

        // Filtrar traslados
        data.filas = (data.filas || []).filter(function (f) { return activeStudentIds[f.estudianteId]; });

        // Agregar estudiantes nuevos que falten
        activeStudents.forEach(function (st) {
            var exists = data.filas.find(function (f) { return f.estudianteId === st.id; });
            if (!exists) {
                var pData = {};
                courseParciales.forEach(function (p, pIdx) {
                    var autoGrade = self.computeStudentGrade(st.id, c.id, p, pIdx);
                    var autoAbs = self.computeStudentAbsences(st.id, c.id, p, pIdx);
                    pData[p.id] = { in: autoAbs, nt: autoGrade, nf: autoGrade };
                });
                data.filas.push({
                    estudianteId: st.id,
                    nombre: st.nombreCompleto,
                    identidad: st.identidad || '',
                    parciales: pData,
                    recuperacion: '',
                    observaciones: ''
                });
            }
        });

        // Auto-hidratar cada celda: si el usuario no tiene una nota guardada manualmente pero hay nota en Evaluación, traerla inmediatamente
        courseParciales.forEach(function (p, pIdx) {
            data.filas.forEach(function (f) {
                if (!f.parciales) f.parciales = {};
                
                // Resolver posibles claves de parciales (id, numero, o 'p' + numero)
                var currentPData = f.parciales[p.id] || f.parciales[String(p.numero)] || f.parciales['p' + p.numero] || { in: '', nt: '', nf: '' };
                f.parciales[p.id] = currentPData;

                var autoGrade = self.computeStudentGrade(f.estudianteId, c.id, p, pIdx);
                var autoAbs = self.computeStudentAbsences(f.estudianteId, c.id, p, pIdx);

                // Si NT está vacío o no definido, rellenar automáticamente con la nota calculada
                if (currentPData.nt === '' || currentPData.nt === undefined || currentPData.nt === null) {
                    if (autoGrade !== '') {
                        currentPData.nt = autoGrade;
                        if (currentPData.nf === '' || currentPData.nf === undefined || currentPData.nf === null) {
                            currentPData.nf = autoGrade;
                        }
                    }
                }
                if (currentPData.in === '' || currentPData.in === undefined || currentPData.in === null || Number(currentPData.in) === 0) {
                    if (autoAbs !== '') currentPData.in = autoAbs;
                }
            });
        });

        this.saveData(data);

        var parciales = data.parciales || [];
        var filas = data.filas || [];

        // Encabezados de Parciales con formato SACE
        var thParciales = parciales.map(function (p) { 
            return `<th colspan="3" style="border:1px solid #cbd5e1; background:#f8fafc; font-weight:800; font-size:11.5px; text-transform:uppercase; letter-spacing:0.04em; color:#1e293b; padding:10px 4px;">${(p.nombre || 'PARCIAL').toUpperCase()}</th>`; 
        }).join('');

        var thSubParciales = parciales.map(function () { 
            return `
                <th class="c1-in" style="background:#fee2e2; color:#991b1b; font-size:10px; font-weight:800; padding:6px 2px; border:1px solid #cbd5e1; width:36px; min-width:36px;" title="Inasistencias">IN</th>
                <th class="c1-nt" style="background:#e0f2fe; color:#0369a1; font-size:10px; font-weight:800; padding:6px 2px; border:1px solid #cbd5e1; width:44px; min-width:44px;" title="Nota del Parcial">NT</th>
                <th class="c1-nf" style="background:#dcfce7; color:#15803d; font-size:10px; font-weight:800; padding:6px 2px; border:1px solid #cbd5e1; width:44px; min-width:44px;" title="Nota Final del Parcial">NF</th>
            `; 
        }).join('');

        var recAnalysis = this.getRecoveryAnalysis(c.id);

        var isInactiveStudent = function (stObj) {
            if (!stObj) return false;
            var est = String(stObj.estadoMatricula || '').trim();
            return est === 'Desertor' || est === 'Traslado' || est === 'Inactivo';
        };
        var activeEntries = [];
        var inactiveEntries = [];
        filas.forEach(function (fila) {
            var stObj = activeStudents.find(function (s) { return s.id === fila.estudianteId; }) || {};
            if (isInactiveStudent(stObj)) inactiveEntries.push({ fila: fila, stObj: stObj });
            else activeEntries.push({ fila: fila, stObj: stObj });
        });

        var totalCols = 6 + (parciales.length * 3);
        var renderInteractiveRow = function (entry, displayNum, isInactive) {
            var fila = entry.fila;
            var stObj = entry.stObj;
            var pfCalc = isInactive ? '' : self.calcPromedio(fila, parciales);
            var obsCalc = isInactive
                ? (stObj.estadoMatricula === 'Traslado' ? 'TRASLADO' : 'MATRÍCULA CANCELADA')
                : (fila.observaciones || self.getObs(pfCalc, fila.recuperacion));
            var pfDisplay = isInactive ? '0' : (fila.recuperacion ? fila.recuperacion : (pfCalc !== '' ? pfCalc : ''));

            var tdParciales = parciales.map(function (p, pIdx) {
                if (isInactive) {
                    return `
                    <td class="c1-in" style="background:#e2e8f0; border:1px solid #cbd5e1; padding:0; text-align:center;">
                        <input class="c1-inp" type="text" disabled readonly value=""
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:700; font-size:12px; height:36px; outline:none; color:#64748b; cursor:not-allowed;" title="Estudiante ${stObj.estadoMatricula || 'Inactivo'}" />
                    </td>
                    <td class="c1-nt" style="background:#e2e8f0; border:1px solid #cbd5e1; padding:0; text-align:center;">
                        <input class="c1-inp" type="text" disabled readonly value=""
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:800; font-size:12px; color:#64748b; height:36px; outline:none; cursor:not-allowed;" title="Estudiante ${stObj.estadoMatricula || 'Inactivo'}" />
                    </td>
                    <td class="c1-nf" style="background:#e2e8f0; border:1px solid #cbd5e1; padding:0; text-align:center;">
                        <input class="c1-inp" type="text" disabled readonly value=""
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:900; font-size:12px; color:#64748b; height:36px; outline:none; cursor:not-allowed;" title="Estudiante ${stObj.estadoMatricula || 'Inactivo'}" />
                    </td>`;
                }

                var pd = (fila.parciales && (fila.parciales[p.id] || fila.parciales[String(p.numero)] || fila.parciales['p' + p.numero])) || { in: '', nt: '', nf: '' };

                var autoGrade = self.computeStudentGrade(fila.estudianteId, c.id, p, pIdx);
                var autoAbs = self.computeStudentAbsences(fila.estudianteId, c.id, p, pIdx);

                var vIn = (pd.in !== undefined && pd.in !== '' && pd.in !== null && Number(pd.in) > 0) ? pd.in : (autoAbs !== '' ? autoAbs : '');
                var vNt = (pd.nt !== undefined && pd.nt !== '' && pd.nt !== null) ? pd.nt : (autoGrade !== '' ? autoGrade : '');
                var vNf = (pd.nf !== undefined && pd.nf !== '' && pd.nf !== null) ? pd.nf : (vNt !== '' ? vNt : '');

                return `
                    <td class="c1-in" style="background:#fef2f2; border:1px solid #e2e8f0; padding:0; text-align:center;">
                        <input class="c1-inp" type="number" min="0" value="${vIn}"
                               onchange="Views.Cuadro1.updateCell('${fila.estudianteId}','${p.id}','in',this.value,this)"
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:700; font-size:12px; height:36px; outline:none;" />
                    </td>
                    <td class="c1-nt" style="background:#f0f9ff; border:1px solid #e2e8f0; padding:0; text-align:center;">
                        <input class="c1-inp" type="number" min="0" max="100" value="${vNt}"
                               onchange="Views.Cuadro1.updateCell('${fila.estudianteId}','${p.id}','nt',this.value,this)"
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:800; font-size:12.5px; color:#0369a1; height:36px; outline:none;" />
                    </td>
                    <td class="c1-nf" style="background:#f0fdf4; border:1px solid #e2e8f0; padding:0; text-align:center;">
                        <input class="c1-inp" type="number" min="0" max="100" value="${vNf}"
                               onchange="Views.Cuadro1.updateCell('${fila.estudianteId}','${p.id}','nf',this.value,this)"
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:900; font-size:12.5px; color:#15803d; height:36px; outline:none;" />
                    </td>`;
            }).join('');

            var recCell = isInactive ? `
                <td class="c1-rec" style="background:#e2e8f0; border:1px solid #cbd5e1; padding:0; text-align:center; width:60px;">
                    <input class="c1-inp" type="text" disabled readonly value=""
                           style="width:100%; border:none; background:transparent; text-align:center; font-weight:700; font-size:12px; color:#64748b; height:36px; outline:none; cursor:not-allowed;" />
                </td>
            ` : `
                <td class="c1-rec" style="background:#f8fafc; border:1px solid #e2e8f0; padding:0; text-align:center; width:60px;">
                    <input class="c1-inp" type="number" min="0" max="100" value="${fila.recuperacion || ''}"
                           onchange="Views.Cuadro1.updateRec('${fila.estudianteId}',this.value,this)"
                           style="width:100%; border:none; background:transparent; text-align:center; font-weight:800; font-size:12.5px; color:#7c3aed; height:36px; outline:none;" />
                </td>
            `;

            return `
                <tr data-student-id="${fila.estudianteId}" style="border-bottom:1px solid #e2e8f0; transition:background 0.15s; ${isInactive ? 'background:#f8fafc;' : ''}" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='${isInactive ? '#f8fafc' : 'white'}'">
                    <td class="c1-num" style="text-align:center; font-weight:800; font-size:12px; color:#64748b; border:1px solid #e2e8f0; padding:8px 4px;">${displayNum}</td>
                    <td class="c1-nombre" style="font-weight:700; font-size:12.5px; color:${isInactive ? '#334155' : '#0f172a'}; border:1px solid #e2e8f0; padding:8px 12px; text-align:left; min-width:200px;">
                        ${fila.nombre}
                    </td>
                    <td class="c1-id" style="font-size:11.5px; color:#64748b; border:1px solid #e2e8f0; padding:8px 6px; text-align:center; min-width:130px;">${fila.identidad || '—'}</td>
                    ${tdParciales}
                    ${recCell}
                    <td class="c1-pf" style="text-align:center; font-weight:900; font-size:13px; color:#0f172a; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 4px; min-width:65px;">
                        ${pfDisplay !== '' ? pfDisplay + '%' : '—'}
                    </td>
                    <td class="c1-obs" style="font-size:11px; font-weight:700; color:#475569; border:1px solid #e2e8f0; padding:8px 8px; text-align:center; min-width:140px;">
                        <span style="display:inline-block; padding:3px 8px; border-radius:6px; font-weight:800; background:${isInactive ? 'transparent; color:#334155;' : (obsCalc.includes('RECUPERACIÓN') ? '#dcfce7; color:#15803d;' : obsCalc.includes('EXCELENTE') ? '#dcfce7; color:#15803d;' : obsCalc.includes('AVANZADO') ? '#e0f2fe; color:#0369a1;' : obsCalc.includes('SATISFACTORIO') ? '#fef9c3; color:#854d0e;' : obsCalc ? '#fee2e2; color:#b91c1c;' : 'transparent;')}">
                            ${obsCalc || '—'}
                        </span>
                    </td>
                </tr>`;
        };

        var trows = activeEntries.map(function (entry, idx) {
            return renderInteractiveRow(entry, idx + 1, false);
        }).join('');

        if (inactiveEntries.length > 0) {
            trows += `
                <tr class="c1-cancelled-separator">
                    <td colspan="${totalCols}" style="background:#f1f5f9; border:1px solid #cbd5e1; padding:8px 12px; text-align:center; font-size:11px; font-weight:900; letter-spacing:0.06em; text-transform:uppercase; color:#1e293b;">
                        MATRÍCULAS CANCELADAS, TRASLADADAS O EN TRASLADO
                    </td>
                </tr>`;
            trows += inactiveEntries.map(function (entry, idx) {
                return renderInteractiveRow(entry, activeEntries.length + idx + 1, true);
            }).join('');
        }

        return `
            <div class="c1-wrap fade-in" style="max-width:100%; margin:0 auto; padding-bottom:40px;">
                <!-- Header Institucional -->
                <div class="c1-header-block" style="background:#0f172a; color:#fff; padding:24px 20px; border-radius:18px 18px 0 0; text-align:center; box-shadow:0 4px 16px rgba(15,23,42,0.15);">
                    <p style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; opacity:0.85; margin:0 0 3px 0;">República de Honduras · Secretaría de Educación</p>
                    <p style="font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; opacity:0.75; margin:0 0 10px 0;">Dirección Departamental de Educación</p>
                    <h2 style="font-size:20px; font-weight:900; letter-spacing:0.02em; margin:0 0 6px 0; color:#ffffff;">CUADRO DE CALIFICACIONES No. 1</h2>
                    <p style="font-size:13px; font-weight:800; color:#38bdf8; margin:0; text-transform:uppercase; letter-spacing:0.06em;">${asig} &bull; ${grado ? grado + '°' : ''} &ldquo;${seccion}&rdquo;</p>
                </div>
                
                <!-- Metadatos del Curso -->
                <div class="c1-meta" style="background:#ffffff; border:1px solid #e2e8f0; border-top:none; padding:16px 20px; margin-bottom:14px; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:12px;">
                        <div style="color:#64748b; font-weight:700;">AÑO: <span style="color:#0f172a; font-weight:800;">PERÍODO ${anio}</span></div>
                        <div style="color:#64748b; font-weight:700;">MODALIDAD: <span style="color:#0f172a; font-weight:800;">${modalidad.toUpperCase()}</span></div>
                        <div style="color:#64748b; font-weight:700;">CURSO: <span style="color:#0f172a; font-weight:800;">${grado ? grado + 'MO' : '—'}</span></div>
                        <div style="color:#64748b; font-weight:700;">JORNADA: <span style="color:#0f172a; font-weight:800;">${jornada.toUpperCase()}</span></div>
                        <div style="color:#64748b; font-weight:700;">DOCENTE: <span style="color:#0f172a; font-weight:800;">${docente.toUpperCase()}</span></div>
                        <div style="color:#64748b; font-weight:700;">SECCIÓN: <span style="color:#0f172a; font-weight:800;">${seccion}</span></div>
                        <div style="color:#64748b; font-weight:700;">CÓDIGO SACE: <span style="color:#1d4ed8; font-weight:900;">${codigoCentro}</span></div>
                        <div style="color:#64748b; font-weight:700;">CENTRO: <span style="color:#0f172a; font-weight:800;">${centro.toUpperCase()}</span></div>
                    </div>
                </div>

                <!-- Resumen de Diagnóstico Anual / Regla de 280 Puntos SACE -->
                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:14px; padding:12px 18px; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                        <div style="background:linear-gradient(135deg, #4f46e5, #7c3aed); color:#fff; width:36px; height:36px; border-radius:10px; display:grid; place-items:center; flex-shrink:0;">
                            <i data-lucide="award" style="width:18px; height:18px;"></i>
                        </div>
                        <div>
                            <div style="font-size:12.5px; font-weight:900; color:#0f172a;">Regla Oficial de Aprobación SACE (280 Puntos / 70%)</div>
                            <div style="font-size:11.5px; font-weight:600; color:#64748b;">
                                Total Matrícula: <b>${recAnalysis.totalStudents}</b> &bull; 
                                <span style="color:#15803d; font-weight:800;">Aprobados Ordinarios: ${recAnalysis.aprobadosCount}</span> &bull; 
                                <span style="color:${recAnalysis.reprobadosCount > 0 ? '#b91c1c' : '#64748b'}; font-weight:800;">En Recuperación (&lt; 280 pts): ${recAnalysis.reprobadosCount}</span>
                            </div>
                        </div>
                    </div>
                    ${recAnalysis.reprobadosCount > 0 ? `
                        <button class="btn btn-sm" onclick="Router.navigate('cuadro'); setTimeout(function(){ document.getElementById('content').innerHTML = Views.Cuadro.render('recuperacion'); if(window.lucide) window.lucide.createIcons(); }, 100);" style="background:#7c3aed; color:#fff; font-weight:800; font-size:11.5px; border-radius:8px; display:inline-flex; align-items:center; gap:6px; border:none; padding:7px 14px; box-shadow:0 2px 6px rgba(124,58,237,0.25);">
                            <i data-lucide="table-2" style="width:14px; height:14px;"></i> Parcial Extra de Recuperación (${recAnalysis.reprobadosCount})
                        </button>
                    ` : ''}
                </div>

                <!-- Barra de Acciones y Leyenda -->
                <div class="c1-actions" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; background:#ffffff; padding:12px 18px; border-radius:14px; border:1px solid #e2e8f0;">
                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <button class="btn btn-primary btn-sm" onclick="Views.Cuadro1.importFromEvaluacion()" style="background:#00C853; border-color:#00C853; color:#ffffff; font-weight:800; font-size:12px; border-radius:10px; display:inline-flex; align-items:center; gap:6px; padding:8px 16px; box-shadow:0 2px 6px rgba(0,200,83,0.25);">
                            <i data-lucide="download" style="width:15px; height:15px;"></i> Importar notas desde Evaluación
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="Views.Cuadro1.openPrintModal()" style="background:#1e40af; border-color:#1d4ed8; color:#ffffff; font-weight:800; font-size:12px; border-radius:10px; display:inline-flex; align-items:center; gap:6px; padding:8px 16px; box-shadow:0 2px 6px rgba(30,64,175,0.25); cursor:pointer;">
                            <i data-lucide="printer" style="width:15px; height:15px;"></i> Imprimir / Reporte Oficial
                        </button>
                        <button class="btn btn-sm" onclick="Views.Reportes.openReportShortcut('acta_final', 'evaluacion')" style="background:#eef2ff; border:1px solid #c7d2fe; color:#4338ca; font-weight:800; font-size:12px; border-radius:10px; display:inline-flex; align-items:center; gap:6px; padding:8px 16px; box-shadow:0 1px 3px rgba(99,102,241,0.08); cursor:pointer;" title="Abrir Acta de Calificaciones Final en Centro de Reportes">
                            <i data-lucide="award" style="width:15px; height:15px; color:#6366f1;"></i> Acta Final
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="Views.Cuadro1.shareReport()" style="background:#0284c7; border-color:#0284c7; color:#ffffff; font-weight:800; font-size:12px; border-radius:10px; display:inline-flex; align-items:center; gap:6px; padding:8px 16px; box-shadow:0 2px 6px rgba(2,132,199,0.25); cursor:pointer;">
                            <i data-lucide="share-2" style="width:15px; height:15px;"></i> Compartir
                        </button>
                        ${typeof UI !== 'undefined' && UI.renderReportZoomControls ? UI.renderReportZoomControls('c1-zoom-target', 'c1-zoom-label') : ''}
                    </div>
                    <div class="c1-legend" style="display:flex; align-items:center; gap:14px; font-size:11.5px; font-weight:700; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:5px;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#fee2e2; color:#991b1b; font-size:10px; font-weight:800;">IN</span> Inasistencias</div>
                        <div style="display:flex; align-items:center; gap:5px;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#e0f2fe; color:#0369a1; font-size:10px; font-weight:800;">NT</span> Nota del Parcial</div>
                        <div style="display:flex; align-items:center; gap:5px;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#dcfce7; color:#15803d; font-size:10px; font-weight:800;">NF</span> Nota Final</div>
                    </div>
                </div>

                <!-- Tabla SACE Scrollable -->
                <div id="c1-zoom-target" class="c1-scroll-outer" style="overflow-x:auto; background:#ffffff; border-radius:14px; border:1px solid #cbd5e1; box-shadow:0 4px 16px rgba(0,0,0,0.03); zoom: ${((typeof UI !== 'undefined' && UI._reportZoomMap && UI._reportZoomMap['c1-zoom-target']) || 100) / 100};">
                    <table class="c1-table" style="width:100%; border-collapse:collapse; text-align:center; font-family:system-ui, -apple-system, sans-serif;">
                        <thead>
                            <tr>
                                <th rowspan="2" class="c1-num" style="background:#f1f5f9; border:1px solid #cbd5e1; font-size:11px; font-weight:800; color:#475569; width:38px; min-width:38px; padding:10px 4px;">#</th>
                                <th rowspan="2" class="c1-nombre" style="background:#f1f5f9; border:1px solid #cbd5e1; font-size:12px; font-weight:800; color:#1e293b; text-align:left; padding:10px 12px; min-width:200px;">NOMBRE</th>
                                <th rowspan="2" class="c1-id" style="background:#f1f5f9; border:1px solid #cbd5e1; font-size:11px; font-weight:800; color:#475569; padding:10px 6px; min-width:130px;">IDENTIDAD</th>
                                ${thParciales}
                                <th rowspan="2" class="c1-rec" style="background:#f1f5f9; border:1px solid #cbd5e1; font-size:11px; font-weight:800; color:#475569; padding:10px 4px; width:68px;" title="Nota de Recuperación">RECUP.</th>
                                <th rowspan="2" class="c1-pf" style="background:#e2e8f0; border:1px solid #cbd5e1; font-size:11px; font-weight:900; color:#0f172a; padding:10px 6px; min-width:65px;">PROM.<br>FINAL</th>
                                <th rowspan="2" class="c1-obs" style="background:#f1f5f9; border:1px solid #cbd5e1; font-size:11px; font-weight:800; color:#475569; padding:10px 8px; min-width:140px;">OBSERVACIONES</th>
                            </tr>
                            <tr>${thSubParciales}</tr>
                        </thead>
                        <tbody>${trows}</tbody>
                    </table>
                </div>
            </div>`;
    },

    updateCell: function (studentId, parId, campo, val, inputEl) {
        var data = this.getData() || this.buildDefault();
        if (!data || !data.filas) return;
        var row = data.filas.find(function (f) { return f.estudianteId === studentId; });
        if (!row) return;
        if (!row.parciales) row.parciales = {};
        if (!row.parciales[parId]) row.parciales[parId] = { in: '', nt: '', nf: '' };
        
        row.parciales[parId][campo] = val;
        
        // Auto-calcular NF = NT si se edita NT y NF estaba vacío
        var autoSyncedNF = false;
        if (campo === 'nt' && (row.parciales[parId].nf === '' || row.parciales[parId].nf === undefined)) {
            row.parciales[parId].nf = val;
            autoSyncedNF = true;
        }
        
        this.saveData(data);
        this.updateRowGranular(studentId, row, parId, autoSyncedNF ? val : null, inputEl);
    },

    updateRec: function (studentId, val, inputEl) {
        var data = this.getData() || this.buildDefault();
        if (!data || !data.filas) return;
        var row = data.filas.find(function (f) { return f.estudianteId === studentId; });
        if (!row) return;
        var cleanVal = val;
        if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) {
            var numVal = Math.round(Number(val));
            if (numVal > 70) numVal = 70;
            if (numVal < 0) numVal = 0;
            cleanVal = numVal;
            if (inputEl && Number(inputEl.value) !== numVal) {
                inputEl.value = numVal;
            }
        }
        row.recuperacion = cleanVal;
        this.saveData(data);
        this.updateRowGranular(studentId, row, null, null, inputEl);
    },

    updateRowGranular: function (studentId, row, parId, autoSyncedNfVal, inputEl) {
        var tr = (inputEl && inputEl.closest) ? inputEl.closest('tr') : document.querySelector('tr[data-student-id="' + studentId + '"]');
        if (!tr) {
            Router.navigate('cuadro1');
            return;
        }

        var c = Store.getActiveCourse();
        if (!c) return;
        var parciales = this.getCourseParciales(c.id);

        if (autoSyncedNfVal !== null && parId) {
            var nfInp = tr.querySelector('input.c1-inp[onchange*="\'' + parId + '\',\'nf\'"]');
            if (nfInp && (nfInp.value === '' || nfInp.value === undefined)) {
                nfInp.value = autoSyncedNfVal;
            }
        }

        var pfCalc = this.calcPromedio(row, parciales);
        var obsCalc = row.observaciones || this.getObs(pfCalc, row.recuperacion);
        var pfDisplay = row.recuperacion ? row.recuperacion : (pfCalc !== '' ? pfCalc : '');

        var pfTd = tr.querySelector('.c1-pf');
        if (pfTd) {
            pfTd.innerText = pfDisplay !== '' ? pfDisplay + '%' : '—';
        }

        var obsTd = tr.querySelector('.c1-obs');
        if (obsTd) {
            var obsColor = (obsCalc.includes('RECUPERACIÓN') ? '#dcfce7; color:#15803d;' : obsCalc.includes('EXCELENTE') ? '#dcfce7; color:#15803d;' : obsCalc.includes('AVANZADO') ? '#e0f2fe; color:#0369a1;' : obsCalc.includes('SATISFACTORIO') ? '#fef9c3; color:#854d0e;' : obsCalc ? '#fee2e2; color:#b91c1c;' : 'transparent;');
            obsTd.innerHTML = '<span style="display:inline-block; padding:3px 8px; border-radius:6px; font-weight:800; background:' + obsColor + '">' + (obsCalc || '—') + '</span>';
        }
    },

    importFromEvaluacion: function () {
        var c = Store.getActiveCourse();
        if (!c) { UI.toast('Sin curso activo', 'warning'); return; }

        var self = this;
        var parciales = this.getCourseParciales(c.id);
        var students = Store.getStudentsByCourse(c.id).filter(function (s) { return s.estadoMatricula !== 'Traslado'; });
        var totalImportados = 0;

        var filas = students.map(function (st) {
            var pData = {};
            parciales.forEach(function (p, pIdx) {
                var autoGrade = self.computeStudentGrade(st.id, c.id, p, pIdx);
                var autoAbs = self.computeStudentAbsences(st.id, c.id, p, pIdx);
                if (autoGrade !== '') totalImportados++;
                pData[p.id] = {
                    in: autoAbs,
                    nt: autoGrade,
                    nf: autoGrade
                };
            });
            return {
                estudianteId: st.id,
                nombre: st.nombreCompleto,
                identidad: st.identidad || '',
                parciales: pData,
                recuperacion: '',
                observaciones: ''
            };
        });

        var data = {
            parciales: parciales,
            filas: filas
        };

        this.saveData(data);
        Router.navigate('cuadro1');

        if (totalImportados > 0) {
            UI.toast(`✅ Se sincronizaron exitosamente ${totalImportados} notas e inasistencias desde Evaluación`, 'success');
        } else {
            UI.toast('ℹ️ No se detectaron calificaciones registradas en el Cuadro Controlador para este curso.', 'info');
        }
    },

    resetData: function () {
        var self = this;
        UI.confirm('¿Deseas reconstruir el Cuadro #1 y sincronizarlo nuevamente desde el Cuadro Controlador?', function () {
            localStorage.removeItem(self._key());
            self.importFromEvaluacion();
        });
    },

    // Modal de Impresión Oficial y Limpia del Cuadro #1
    openPrintModal: function () {
        var c = Store.getActiveCourse();
        if (!c) {
            UI.toast('Selecciona un curso activo para generar el reporte', 'warning');
            return;
        }

        var data = this.getData(c.id) || this.buildDefault(c.id);
        if (!data || !data.filas || data.filas.length === 0) {
            data = this.buildDefault(c.id);
        }

        var parciales = data.parciales || this.getCourseParciales(c.id);
        var filas = data.filas || [];
        var totalStudents = filas.length;
        var aprobados = 0;
        var reprobados = 0;
        var enRecuperacion = 0;

        var self = this;
        filas.forEach(function (f) {
            var pf = self.calcPromedio(f, parciales);
            var rec = parseFloat(f.recuperacion);
            var finalGrade = !isNaN(rec) ? rec : parseFloat(pf);
            if (!isNaN(finalGrade)) {
                if (finalGrade >= 70) aprobados++;
                else reprobados++;
            }
            if (!isNaN(rec) && rec > 0) enRecuperacion++;
        });

        var stats = {
            total: totalStudents,
            aprobados: aprobados,
            reprobados: reprobados,
            enRecuperacion: enRecuperacion
        };

        var printableDocHtml = this._buildPrintableDocumentHtml(c, data, stats);

        var modalHtml = `
            <div class="c1-print-modal-container" style="display:flex; flex-direction:column; gap:16px;">
                <!-- Barra Superior de Acciones (SOLO VISIBLE EN EL MODAL / NO-PRINT) -->
                <div class="no-print c1-modal-toolbar" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:12px 18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="background:#1e40af; color:#ffffff; width:38px; height:38px; border-radius:10px; display:grid; place-items:center;">
                            <i data-lucide="printer" style="width:20px; height:20px;"></i>
                        </div>
                        <div>
                            <div style="font-size:14px; font-weight:900; color:#0f172a;">Vista Previa de Impresión Oficial · Cuadro #1 SACE</div>
                            <div style="font-size:11.5px; font-weight:600; color:#64748b;">Ajustado para formato horizontal (Landscape) &bull; Solo se imprime el cuadro oficial</div>
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="Views.Cuadro1.shareReport()" style="background:#0284c7; border-color:#0284c7; color:#ffffff; font-weight:800; font-size:12px; border-radius:10px; display:inline-flex; align-items:center; gap:6px; padding:8px 16px; cursor:pointer;">
                            <i data-lucide="share-2" style="width:15px; height:15px;"></i> Compartir
                        </button>
                        <button type="button" class="btn btn-primary btn-sm" onclick="Views.Cuadro1.printModalDocument()" style="background:#16a34a; border-color:#16a34a; color:#ffffff; font-weight:900; font-size:12px; border-radius:10px; display:inline-flex; align-items:center; gap:6px; padding:8px 18px; box-shadow:0 3px 8px rgba(22,163,74,0.3); cursor:pointer;">
                            <i data-lucide="printer" style="width:15px; height:15px;"></i> Imprimir / Guardar en PDF
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="UI.closeModal()" style="font-weight:700; font-size:12px; border-radius:10px; padding:8px 14px; cursor:pointer;">
                            ✕ Cerrar
                        </button>
                    </div>
                </div>

                <!-- Hoja de Impresión Limpia (ÁREA OFICIAL) -->
                <div id="c1-print-wrapper" style="overflow-x:auto; background:#cbd5e1; padding:20px; border-radius:14px; display:flex; justify-content:center;">
                    ${printableDocHtml}
                </div>
            </div>

            <style>
                @media screen {
                    .c1-print-sheet {
                        width: 100%;
                        max-width: 1220px;
                        background: #ffffff;
                        color: #0f172a;
                        padding: 28px 34px;
                        border-radius: 12px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.12);
                        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        margin: 0 auto;
                    }
                }

                @media print {
                    /* Ocultar absolutamente toda la interfaz gráfica de la aplicación y botones */
                    body * {
                        visibility: hidden !important;
                    }
                    #sidebar, #top-navbar, #header, nav,
                    .modal-header, .modal-footer, .modal-close,
                    .no-print, .c1-modal-toolbar, button {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    #modal-overlay {
                        position: static !important;
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        inset: auto !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    .modal, .modal-fullscreen, .modal-body, .modal-body-fullscreen, #c1-print-wrapper {
                        position: static !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        height: auto !important;
                        min-height: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        background: transparent !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    #c1-printable-sheet, #c1-printable-sheet * {
                        visibility: visible !important;
                    }
                    #c1-printable-sheet {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 6mm 4mm !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: landscape;
                        margin: 6mm 6mm;
                    }
                    table.c1-official-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto;
                    }
                    table.c1-official-table th, table.c1-official-table td {
                        border: 1px solid #000000 !important;
                        color: #000000 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    table.c1-official-table tr {
                        page-break-inside: avoid !important;
                    }
                    .c1-official-signatures {
                        page-break-inside: avoid !important;
                    }
                }
            </style>
        `;

        UI.modal('Imprimir Cuadro #1 - Calificaciones SACE', modalHtml, '', { fullscreen: true });
        setTimeout(function () {
            if (window.lucide && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        }, 60);
    },

    printModalDocument: function () {
        window.print();
    },

    // Genera el blob del documento PDF oficial del Cuadro #1 (Landscape)
    generateOfficialPdfBlob: async function () {
        var c = Store.getActiveCourse();
        if (!c) throw new Error('Sin curso activo');

        var data = this.getData(c.id) || this.buildDefault(c.id);
        var parciales = data.parciales || this.getCourseParciales(c.id);
        var filas = data.filas || [];
        var totalStudents = filas.length;
        var aprobados = 0;
        var reprobados = 0;
        var enRecuperacion = 0;
        var self = this;

        filas.forEach(function (f) {
            var pf = self.calcPromedio(f, parciales);
            var rec = parseFloat(f.recuperacion);
            var finalGrade = !isNaN(rec) ? rec : parseFloat(pf);
            if (!isNaN(finalGrade)) {
                if (finalGrade >= 70) aprobados++;
                else reprobados++;
            }
            if (!isNaN(rec) && rec > 0) enRecuperacion++;
        });

        var stats = {
            total: totalStudents,
            aprobados: aprobados,
            reprobados: reprobados,
            enRecuperacion: enRecuperacion
        };

        // Si ya hay un elemento imprimible en el modal abierto, usarlo; de lo contrario construirlo temporalmente
        var existingSheet = document.getElementById('c1-printable-sheet');
        var tempContainer = null;
        var targetElement = existingSheet;

        if (!targetElement) {
            tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '1220px';
            tempContainer.style.background = '#ffffff';
            tempContainer.innerHTML = this._buildPrintableDocumentHtml(c, data, stats);
            document.body.appendChild(tempContainer);
            targetElement = tempContainer.querySelector('#c1-printable-sheet') || tempContainer;
        }

        var fileName = `Cuadro1_SACE_${(c.asignatura || 'Clase').replace(/\s+/g, '_')}_${c.grado ? c.grado + 'G' : ''}_Sec${c.seccion || '1'}.pdf`;
        var opt = {
            margin: [4, 4, 4, 4],
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' }
        };

        try {
            if (typeof html2pdf === 'undefined') {
                throw new Error('Motor de generación PDF no disponible');
            }
            var blob = await html2pdf().set(opt).from(targetElement).output('blob');
            return { blob: blob, fileName: fileName, opt: opt, targetElement: targetElement };
        } finally {
            if (tempContainer && tempContainer.parentNode) {
                tempContainer.parentNode.removeChild(tempContainer);
            }
        }
    },

    // Comparte el documento PDF oficial del cuadro #1 por medios digitales (WhatsApp, etc.)
    shareReport: async function () {
        var c = Store.getActiveCourse();
        if (!c) { UI.toast('Sin curso activo', 'warning'); return; }

        UI.toast('Generando documento PDF oficial...', 'info');

        try {
            var pdfInfo = await this.generateOfficialPdfBlob();
            var title = `Cuadro #1 SACE - ${c.asignatura || 'Clase'} (${c.grado ? c.grado + '°' : ''} "${c.seccion || '1'}")`;

            // Compartir el archivo PDF mediante UI.shareData (Capacitor Share con archivo / Web Share con File)
            var shared = await UI.shareData({
                title: title,
                text: `Cuadro de Calificaciones No. 1 (SACE) - ${c.asignatura || 'Clase'}`,
                blob: pdfInfo.blob,
                fileName: pdfInfo.fileName
            });

            if (shared && shared !== 'modal_opened') {
                UI.toast('Documento PDF compartido ✅', 'success');
            } else if (!shared) {
                this._showShareOptionsModal(title, pdfInfo);
            }
        } catch (err) {
            console.error('Error generando PDF para compartir:', err);
            this._showShareOptionsModal(`Cuadro #1 SACE - ${c.asignatura || 'Clase'}`);
        }
    },

    _showShareOptionsModal: function (title, pdfInfo) {
        UI.showShareModal({
            title: title || 'Compartir Cuadro #1 SACE',
            text: title || 'Cuadro #1 SACE Oficial',
            blob: pdfInfo && pdfInfo.blob,
            fileName: pdfInfo && pdfInfo.fileName
        });
    },

    downloadOfficialPdf: async function () {
        UI.toast('Descargando archivo PDF...', 'info');
        try {
            var pdfInfo = await this.generateOfficialPdfBlob();
            if (typeof html2pdf !== 'undefined' && pdfInfo.opt && pdfInfo.targetElement) {
                await html2pdf().set(pdfInfo.opt).from(pdfInfo.targetElement).save();
                UI.toast('PDF descargado correctamente ✅', 'success');
            } else {
                var url = URL.createObjectURL(pdfInfo.blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = pdfInfo.fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
                UI.toast('PDF descargado correctamente ✅', 'success');
            }
        } catch (e) {
            console.error('Error al descargar PDF:', e);
            UI.toast('Error al descargar PDF: ' + (e.message || ''), 'error');
        }
    },

    _copyShareTextToClipboard: function () {
        var text = this._pendingShareText;
        if (!text) {
            var previewEl = document.getElementById('c1-share-text-preview');
            text = previewEl ? previewEl.innerText : '';
        }
        if (!text) return;

        var cap = window.Capacitor?.Plugins?.Clipboard;
        if (cap && typeof cap.write === 'function') {
            cap.write({ string: text }).then(function () {
                UI.toast('¡Resumen copiado al portapapeles! 📋', 'success');
            }).catch(function () {
                fallbackCopy(text);
            });
            return;
        }

        fallbackCopy(text);

        function fallbackCopy(str) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(str).then(function () {
                    UI.toast('¡Resumen copiado al portapapeles! 📋', 'success');
                }).catch(function () {
                    promptCopy(str);
                });
            } else {
                promptCopy(str);
            }
        }

        function promptCopy(str) {
            var t = document.createElement('textarea');
            t.value = str;
            t.style.position = 'fixed';
            t.style.opacity = '0';
            document.body.appendChild(t);
            t.select();
            try {
                document.execCommand('copy');
                UI.toast('¡Resumen copiado al portapapeles! 📋', 'success');
            } catch (e) {
                UI.toast('No se pudo copiar automáticamente', 'warning');
            }
            document.body.removeChild(t);
        }
    },

    _buildPrintableDocumentHtml: function (c, data, stats) {
        var cleanText = function (str) {
            if (!str) return '';
            return String(str)
                .replace(/Í"/g, 'Ó')
                .replace(/Ó"/g, 'Ó')
                .replace(/Ã“/g, 'Ó')
                .replace(/Ã³/g, 'Ó')
                .replace(/A!O/g, 'AÑO')
                .replace(/A¿O/g, 'AÑO')
                .replace(/EDUCACIÍ"N/g, 'EDUCACIÓN')
                .replace(/SECCIÍ"N/g, 'SECCIÓN');
        };

        var meta = this.getCenterMetadata(c);
        var asig = cleanText(c.asignatura || 'CAMPO DEL CONOCIMIENTO');
        var grado = cleanText(c.grado || '');
        var anio = c.anio || (new Date().getFullYear());
        var seccion = cleanText(c.seccion || '1');
        var jornada = cleanText(c.jornada || 'MATUTINA');
        var docente = cleanText(meta.docente);
        var director = cleanText(meta.director);
        var centro = cleanText(meta.nombre);
        var codigoCentro = meta.codigoCentro;
        var depto = cleanText(meta.departamento);
        var muni = cleanText(meta.municipio);

        var parciales = data.parciales || this.getCourseParciales(c.id);
        var filas = data.filas || [];
        var self = this;

        var thParciales = parciales.map(function (p) {
            return `<th colspan="3" style="border:1.5px solid #000; background:#f1f5f9; font-weight:900; font-size:10.5px; text-transform:uppercase; padding:6px 2px; text-align:center;">${(p.nombre || 'PARCIAL').toUpperCase()}</th>`;
        }).join('');

        var thSubParciales = parciales.map(function () {
            return `
                <th style="border:1px solid #000; background:#ffffff; font-size:9.5px; font-weight:800; padding:4px 2px; text-align:center; width:30px;">IN</th>
                <th style="border:1px solid #000; background:#ffffff; font-size:9.5px; font-weight:800; padding:4px 2px; text-align:center; width:34px;">NT</th>
                <th style="border:1px solid #000; background:#f1f5f9; font-size:9.5px; font-weight:900; padding:4px 2px; text-align:center; width:34px;">NF</th>
            `;
        }).join('');

        var allStudents = (typeof Store !== 'undefined' && Store.getStudentsByCourse) ? (Store.getStudentsByCourse(c.id) || []) : [];
        var activePrintEntries = [];
        var inactivePrintEntries = [];
        filas.forEach(function (f) {
            var stObj = allStudents.find(function (s) { return s.id === f.estudianteId; }) || {};
            var est = String(stObj.estadoMatricula || '').trim();
            if (est === 'Desertor' || est === 'Traslado' || est === 'Inactivo') {
                inactivePrintEntries.push({ f: f, stObj: stObj });
            } else {
                activePrintEntries.push({ f: f, stObj: stObj });
            }
        });

        var totalPrintCols = 6 + (parciales.length * 3);
        var renderPrintRow = function (entry, displayNum, isInactive) {
            var f = entry.f;
            var stObj = entry.stObj;
            var pfCalc = isInactive ? '' : self.calcPromedio(f, parciales);
            var obsCalc = isInactive
                ? (stObj.estadoMatricula === 'Traslado' ? 'TRASLADO' : 'MATRÍCULA CANCELADA')
                : (f.observaciones || self.getObs(pfCalc, f.recuperacion));
            var pfDisplay = isInactive ? '0' : (f.recuperacion ? f.recuperacion : (pfCalc !== '' ? pfCalc : '—'));

            var tdParciales = parciales.map(function (p) {
                if (isInactive) {
                    return `
                        <td style="border:1px solid #000; background:#e2e8f0; padding:4px 2px;"></td>
                        <td style="border:1px solid #000; background:#e2e8f0; padding:4px 2px;"></td>
                        <td style="border:1px solid #000; background:#e2e8f0; padding:4px 2px;"></td>
                    `;
                }
                var pd = (f.parciales && (f.parciales[p.id] || f.parciales[String(p.numero)] || f.parciales['p' + p.numero])) || { in: '', nt: '', nf: '' };
                var vIn = (pd.in !== undefined && pd.in !== '' && pd.in !== null) ? pd.in : '0';
                var vNt = (pd.nt !== undefined && pd.nt !== '' && pd.nt !== null) ? pd.nt : '—';
                var vNf = (pd.nf !== undefined && pd.nf !== '' && pd.nf !== null) ? pd.nf : vNt;
                return `
                    <td style="border:1px solid #000; font-size:10px; font-weight:600; text-align:center; padding:4px 2px;">${vIn}</td>
                    <td style="border:1px solid #000; font-size:10.5px; font-weight:700; text-align:center; padding:4px 2px;">${vNt}</td>
                    <td style="border:1px solid #000; font-size:10.5px; font-weight:900; text-align:center; padding:4px 2px; background:#f8fafc;">${vNf}</td>
                `;
            }).join('');

            return `
                <tr style="page-break-inside:avoid;">
                    <td style="border:1px solid #000; font-size:10px; font-weight:800; text-align:center; padding:5px 2px;">${displayNum}</td>
                    <td style="border:1px solid #000; font-size:11px; font-weight:700; text-align:left; padding:5px 8px; text-transform:uppercase; white-space:nowrap;">${f.nombre}</td>
                    <td style="border:1px solid #000; font-size:10px; font-weight:600; text-align:center; padding:5px 4px; white-space:nowrap;">${f.identidad || '—'}</td>
                    ${tdParciales}
                    <td style="border:1px solid #000; font-size:10.5px; font-weight:800; text-align:center; padding:5px 2px; ${isInactive ? 'background:#e2e8f0;' : ''}">${isInactive ? '' : (f.recuperacion || '—')}</td>
                    <td style="border:1.5px solid #000; font-size:11px; font-weight:900; text-align:center; padding:5px 4px; background:#f1f5f9;">${pfDisplay !== '—' ? pfDisplay + '%' : '—'}</td>
                    <td style="border:1px solid #000; font-size:9.5px; font-weight:800; text-align:center; padding:5px 6px;">${obsCalc || '—'}</td>
                </tr>
            `;
        };

        var rowsHtml = activePrintEntries.map(function (entry, idx) {
            return renderPrintRow(entry, idx + 1, false);
        }).join('');

        if (inactivePrintEntries.length > 0) {
            rowsHtml += `
                <tr style="page-break-inside:avoid;">
                    <td colspan="${totalPrintCols}" style="border:1px solid #000; background:#f8fafc; font-size:10px; font-weight:900; text-align:center; padding:6px 8px; letter-spacing:0.04em; text-transform:uppercase;">MATRÍCULAS CANCELADAS, TRASLADADAS O EN TRASLADO</td>
                </tr>
            `;
            rowsHtml += inactivePrintEntries.map(function (entry, idx) {
                return renderPrintRow(entry, activePrintEntries.length + idx + 1, true);
            }).join('');
        }

        return `
            <div id="c1-printable-sheet" class="c1-print-sheet">
                <!-- Encabezado Institucional de la República de Honduras -->
                <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:10px;">
                    <div style="font-size:11px; font-weight:900; letter-spacing:0.12em; text-transform:uppercase; color:#000;">República de Honduras · Secretaría de Educación</div>
                    <div style="font-size:10.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#1e293b; margin-top:2px;">Dirección Departamental de Educación de ${depto.toUpperCase()}</div>
                    <h1 style="font-size:16px; font-weight:900; letter-spacing:0.04em; margin:6px 0 2px 0; text-transform:uppercase; color:#000;">CUADRO DE CALIFICACIONES No. 1 (SACE)</h1>
                    <div style="font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:#334155;">Evaluación del Rendimiento Académico Oficial del Educando</div>
                </div>

                <!-- Tabla de Metadatos del Curso y Centro -->
                <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:10px; border:1px solid #000;">
                    <tr>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc; width:15%;">CENTRO EDUCATIVO:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:900; width:35%;">${centro.toUpperCase()}</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc; width:15%;">CÓDIGO SACE:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:900; width:35%;">${codigoCentro}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc;">ASIGNATURA:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:900;">${asig.toUpperCase()}</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc;">GRADO Y SECCIÓN:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:900;">${grado ? grado + '°' : '—'} "${seccion}"</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc;">JORNADA:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:700;">${jornada.toUpperCase()}</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc;">AÑO LECTIVO:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:900;">${anio}</td>
                    </tr>
                    <tr>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc;">DOCENTE TITULAR:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:700;">${docente.toUpperCase()}</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:800; background:#f8fafc;">MUNICIPIO / DEPTO:</td>
                        <td style="border:1px solid #000; padding:4px 6px; font-weight:700;">${muni.toUpperCase()}, ${depto.toUpperCase()}</td>
                    </tr>
                </table>

                <!-- Tabla de Calificaciones Oficial SACE -->
                <table class="c1-official-table" style="width:100%; border-collapse:collapse; text-align:center; font-family:system-ui, -apple-system, sans-serif; margin-bottom:12px;">
                    <thead>
                        <tr>
                            <th rowspan="2" style="border:1.5px solid #000; background:#f1f5f9; font-size:10px; font-weight:900; width:30px; padding:6px 2px;">#</th>
                            <th rowspan="2" style="border:1.5px solid #000; background:#f1f5f9; font-size:11px; font-weight:900; text-align:left; padding:6px 8px; min-width:180px;">NOMBRE COMPLETO DEL ESTUDIANTE</th>
                            <th rowspan="2" style="border:1.5px solid #000; background:#f1f5f9; font-size:10px; font-weight:900; padding:6px 4px; min-width:110px;">IDENTIDAD</th>
                            ${thParciales}
                            <th rowspan="2" style="border:1.5px solid #000; background:#f1f5f9; font-size:10px; font-weight:900; padding:6px 2px; width:45px;">REC.</th>
                            <th rowspan="2" style="border:1.5px solid #000; background:#e2e8f0; font-size:10px; font-weight:900; padding:6px 4px; width:55px;">PROM.<br>FINAL</th>
                            <th rowspan="2" style="border:1.5px solid #000; background:#f1f5f9; font-size:10px; font-weight:900; padding:6px 6px; min-width:110px;">OBSERVACIONES</th>
                        </tr>
                        <tr>${thSubParciales}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>

                <!-- Resumen Estadístico y Leyenda -->
                <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #000; padding:6px 12px; margin-bottom:20px; font-size:9.5px; background:#f8fafc;">
                    <div>
                        <b>ESTADÍSTICAS DEL CURSO:</b> &nbsp;
                        Total Matrícula: <b>${stats.total}</b> &nbsp;|&nbsp;
                        Aprobados: <b>${stats.aprobados}</b> &nbsp;|&nbsp;
                        En Recuperación: <b>${stats.enRecuperacion}</b> &nbsp;|&nbsp;
                        Reprobados: <b>${stats.reprobados}</b>
                    </div>
                    <div>
                        <b>LEYENDA:</b> IN = Inasistencias &nbsp;|&nbsp; NT = Nota Parcial &nbsp;|&nbsp; NF = Nota Final &nbsp;|&nbsp; REC = Recuperación
                    </div>
                </div>

                <!-- Bloque de Firmas Oficiales y Sello -->
                <div class="c1-official-signatures" style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:35px; padding:0 30px;">
                    <div style="text-align:center; width:260px;">
                        <div style="border-bottom:1.5px solid #000; margin-bottom:6px; height:35px;"></div>
                        <div style="font-size:11px; font-weight:900; text-transform:uppercase;">${docente.toUpperCase()}</div>
                        <div style="font-size:9.5px; font-weight:700; color:#475569;">Docente Titular</div>
                    </div>

                    <div style="text-align:center; width:180px;">
                        <div style="width:70px; height:70px; border:1.5px dashed #94a3b8; border-radius:50%; margin:0 auto 4px auto; display:flex; align-items:center; justify-content:center; font-size:8.5px; color:#64748b; font-weight:800; text-transform:uppercase; text-align:center;">
                            Sello<br>Institucional
                        </div>
                    </div>

                    <div style="text-align:center; width:260px;">
                        <div style="border-bottom:1.5px solid #000; margin-bottom:6px; height:35px;"></div>
                        <div style="font-size:11px; font-weight:900; text-transform:uppercase;">${director.toUpperCase()}</div>
                        <div style="font-size:9.5px; font-weight:700; color:#475569;">Director(a) del Centro Educativo</div>
                    </div>
                </div>

                <div style="text-align:center; margin-top:20px; font-size:8.5px; color:#64748b;">
                    Documento Oficial generado por el Sistema Aula 360 HN &bull; Secretaría de Educación &bull; ${new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                ${(typeof window !== 'undefined' && window.AuthService && !window.AuthService.getLicenseStatus().canExportClean)
                    ? `<div style="margin-top:10px; padding:6px 10px; border:1px dashed #d97706; background:#fffbeb; color:#92400e; border-radius:6px; font-size:9.5px; font-weight:800; text-align:center; letter-spacing:0.04em; -webkit-print-color-adjust:exact; print-color-adjust:exact;">VERSIÓN DE PRUEBA &mdash; AULA 360 HN &bull; Activa tu Plan Pro para exportar cuadros oficiales sin esta marca</div>`
                    : ''}
            </div>
        `;
    }
};

// Interoperabilidad global
if (typeof window !== 'undefined') {
    Views.CuadroSACE = Views.Cuadro1;
}

