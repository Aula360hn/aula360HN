/**
 * MÓDULO: CUADRO #1 - Calificaciones SACE (Versión Profesional)
 * Cuadro oficial de calificaciones del sistema SACE con auto-sincronización en vivo desde Evaluación y Cuadro Controlador.
 */

Views.Cuadro1 = {
    // Key en localStorage para guardar datos del cuadro1
    _key: function () { 
        var courseId = (Store.data && Store.data.activeCourseId) ? Store.data.activeCourseId : 'none';
        return 'cuadro1_' + courseId; 
    },

    getData: function () {
        var raw = localStorage.getItem(this._key());
        if (raw) {
            try { return JSON.parse(raw); } catch (e) { return null; }
        }
        return null;
    },

    saveData: function (data) {
        try {
            localStorage.setItem(this._key(), JSON.stringify(data));
        } catch (e) {
            console.error('Error al guardar cuadro1:', e);
        }
    },

    // Obtiene los 4 parciales oficiales del curso activo
    getCourseParciales: function (courseId) {
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
                { id: 'p1', numero: 1, nombre: 'Primer Parcial' },
                { id: 'p2', numero: 2, nombre: 'Segundo Parcial' },
                { id: 'p3', numero: 3, nombre: 'Tercer Parcial' },
                { id: 'p4', numero: 4, nombre: 'Cuarto Parcial' }
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
                fechaInicio: p.fechaInicio || '',
                fechaFin: p.fechaFin || ''
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
    computeStudentGrade: function (studentId, courseId, parcialRef, parcialIndex) {
        var activities = this.getActivitiesForParcial(courseId, parcialRef, parcialIndex);
        if (activities.length === 0) return '';

        var allCalifs = Store.get('calificaciones') || [];
        var scores = allCalifs.filter(function (sc) {
            return sc.estudianteId === studentId && (sc.cursoId === courseId || sc.courseId === courseId || !sc.cursoId);
        });

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
                var score = scores.find(function (sc) { return sc.actividadId === act.id; });
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

            var dimSub = dimMax > 0 ? Math.min((dimObtained / dimMax) * dim.porcentaje, dim.porcentaje) : 0;
            studentFinal += dimSub;
        });

        // Actividades que no coinciden con las dimensiones configuradas (suma directa)
        var extraActs = activities.filter(function (a) { return !matchedActs.has(a.id); });
        if (extraActs.length > 0) {
            extraActs.forEach(function (act) {
                var score = scores.find(function (sc) { return sc.actividadId === act.id; });
                if (score && score.puntajeObtenido !== undefined && score.puntajeObtenido !== '' && score.puntajeObtenido !== null) {
                    hasScores = true;
                    studentFinal += Number(score.puntajeObtenido);
                }
            });
        }

        var realParcialId = (typeof parcialRef === 'object' && parcialRef.id) ? parcialRef.id : parcialRef;
        var extraPoints = 0;
        if (typeof Store.getStudentExtraordinaryPoints === 'function') {
            extraPoints = Store.getStudentExtraordinaryPoints(studentId, courseId, realParcialId) || 0;
        } else if (typeof Store.getExtraPointsForStudent === 'function') {
            extraPoints = Store.getExtraPointsForStudent(studentId, courseId, realParcialId) || 0;
        }

        var total = Math.round(studentFinal + extraPoints);
        if (total > 100) total = 100;
        return (hasScores || total > 0) ? total : '';
    },

    // Obtiene las inasistencias en el rango de fechas del parcial
    computeStudentAbsences: function (studentId, courseId, parcialRef, parcialIndex) {
        var courseParciales = this.getCourseParciales(courseId);
        var p = (typeof parcialRef === 'object' && parcialRef) ? parcialRef : courseParciales.find(function (cp) {
            return String(cp.id) === String(parcialRef);
        });
        if (!p && typeof parcialIndex === 'number') p = courseParciales[parcialIndex];

        if (!p || !p.fechaInicio || !p.fechaFin) return '';
        var list = (Store.data.asistencia || []).filter(function (a) {
            return a.estudianteId === studentId &&
                   (a.cursoId === courseId || a.courseId === courseId) &&
                   a.estado === 'A' &&
                   a.fecha >= p.fechaInicio &&
                   a.fecha <= p.fechaFin;
        });
        return list.length > 0 ? list.length : '';
    },

    // Construye la estructura base inicial
    buildDefault: function () {
        var c = Store.getActiveCourse();
        if (!c) return null;
        var students = Store.getStudentsByCourse(c.id).filter(function (s) { return s.estadoMatricula !== 'Traslado'; });
        var parciales = this.getCourseParciales(c.id);

        var self = this;
        var filas = students.map(function (st) {
            var pData = {};
            parciales.forEach(function (p, pIdx) {
                var autoGrade = self.computeStudentGrade(st.id, c.id, p, pIdx);
                var autoAbs = self.computeStudentAbsences(st.id, c.id, p, pIdx);
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

        return { 
            parciales: parciales, 
            filas: filas 
        };
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
    getStudentAnnualAnalysis: function (studentId, courseId) {
        var c = courseId ? (Store.get('cursos') || []).find(function(cur){ return cur.id === courseId; }) || Store.getActiveCourse() : Store.getActiveCourse();
        if (!c) return null;
        var parciales = this.getCourseParciales(c.id);
        var data = this.getData() || this.buildDefault();
        var row = (data && data.filas) ? data.filas.find(function(f){ return f.estudianteId === studentId; }) : null;
        var student = (Store.getStudentsByCourse(c.id) || []).find(function(s){ return s.id === studentId; });

        var self = this;
        var parcialBreakdown = [];
        var totalPoints = 0;
        var countGraded = 0;

        parciales.forEach(function (p, pIdx) {
            var pd = row && row.parciales && (row.parciales[p.id] || row.parciales[String(p.numero)] || row.parciales['p' + p.numero]);
            var nf = pd ? parseFloat(pd.nf) : NaN;
            if (isNaN(nf)) {
                var autoGrade = self.computeStudentGrade(studentId, c.id, p, pIdx);
                if (autoGrade !== '' && !isNaN(Number(autoGrade))) {
                    nf = Number(autoGrade);
                }
            }
            var hasGrade = !isNaN(nf);
            var scoreVal = hasGrade ? nf : 0;
            if (hasGrade) {
                totalPoints += scoreVal;
                countGraded++;
            }
            parcialBreakdown.push({
                parcial: p,
                score: hasGrade ? scoreVal : null,
                hasGrade: hasGrade,
                isPassing: hasGrade ? scoreVal >= 70 : false
            });
        });

        var promedioAnual = countGraded > 0 ? Math.round(totalPoints / countGraded) : 0;
        // Regla oficial SACE: 4 parciales x 100 = 400 pts. Umbral mínimo de aprobación = 280 pts (70%)
        var isFailing280 = totalPoints < 280;
        var pointsDeficit = Math.max(0, 280 - totalPoints);

        // Búsqueda inteligente de actividades deficientes (< 70% de su valor) a lo largo del año
        var allActs = (Store.get('actividades') || []).filter(function(a){ return a.cursoId === c.id; });
        var allScores = (Store.get('calificaciones') || []).filter(function(sc){ return sc.estudianteId === studentId && (sc.cursoId === c.id || !sc.cursoId); });
        var deficientActivities = [];

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

    // Resumen consolidado del grupo para el proceso de recuperación
    getRecoveryAnalysis: function (courseId) {
        var c = courseId ? (Store.get('cursos') || []).find(function(cur){ return cur.id === courseId; }) || Store.getActiveCourse() : Store.getActiveCourse();
        if (!c) return { failingStudents: [], exemptStudents: [], totalStudents: 0, reprobadosCount: 0, aprobadosCount: 0 };
        var activeStudents = Store.getStudentsByCourse(c.id).filter(function(s){ return s.estadoMatricula !== 'Traslado'; });
        var self = this;
        var failing = [];
        var exempt = [];

        activeStudents.forEach(function (st) {
            var analysis = self.getStudentAnnualAnalysis(st.id, c.id);
            if (analysis) {
                if (analysis.isFailing280) {
                    failing.push(analysis);
                } else {
                    exempt.push(analysis);
                }
            }
        });

        return {
            failingStudents: failing,
            exemptStudents: exempt,
            totalStudents: activeStudents.length,
            reprobadosCount: failing.length,
            aprobadosCount: exempt.length
        };
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
        var obs = this.getObs(promAnual, val);
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

        var asig = cleanText(c.asignatura || 'ASIGNATURA');
        var grado = cleanText(c.grado || '');
        var anio = c.anio || (new Date().getFullYear());
        var seccion = cleanText(c.seccion || '1');
        var jornada = cleanText(c.jornada || 'MATUTINA');
        var docente = cleanText((Store.data.configAcademica && Store.data.configAcademica.docente) || c.docente || '—');
        var modalidad = cleanText(c.modalidad || 'EDUCACIÓN BÁSICA');
        var centro = cleanText((Store.data.configAcademica && Store.data.configAcademica.centro) || c.centroEducativo || 'CENTRO EDUCATIVO');

        var courseParciales = this.getCourseParciales(c.id);
        var saved = this.getData();
        var data = saved || this.buildDefault();
        var self = this;

        if (!data || !data.filas) {
            data = this.buildDefault();
        }

        data.parciales = courseParciales;

        // Auto-sincronizar estudiantes activos y calcular notas en vivo
        var activeStudents = Store.getStudentsByCourse(c.id).filter(function (s) { return s.estadoMatricula !== 'Traslado'; });
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
                if (currentPData.in === '' || currentPData.in === undefined || currentPData.in === null) {
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

        var trows = filas.map(function (fila, idx) {
            var pfCalc = self.calcPromedio(fila, parciales);
            var obsCalc = fila.observaciones || self.getObs(pfCalc, fila.recuperacion);
            var pfDisplay = fila.recuperacion ? fila.recuperacion : (pfCalc !== '' ? pfCalc : '');

            var an = self.getStudentAnnualAnalysis(fila.estudianteId, c.id);
            var isFailing = an ? an.isFailing280 : false;
            var deficit = an ? an.pointsDeficit : 0;
            var totPts = an ? an.totalPoints : 0;

            var tdParciales = parciales.map(function (p, pIdx) {
                var pd = (fila.parciales && (fila.parciales[p.id] || fila.parciales[String(p.numero)] || fila.parciales['p' + p.numero])) || { in: '', nt: '', nf: '' };
                
                var autoGrade = self.computeStudentGrade(fila.estudianteId, c.id, p, pIdx);
                var autoAbs = self.computeStudentAbsences(fila.estudianteId, c.id, p, pIdx);

                var vIn = (pd.in !== undefined && pd.in !== '' && pd.in !== null) ? pd.in : (autoAbs !== '' ? autoAbs : '');
                var vNt = (pd.nt !== undefined && pd.nt !== '' && pd.nt !== null) ? pd.nt : (autoGrade !== '' ? autoGrade : '');
                var vNf = (pd.nf !== undefined && pd.nf !== '' && pd.nf !== null) ? pd.nf : (vNt !== '' ? vNt : '');

                return `
                    <td class="c1-in" style="background:#fef2f2; border:1px solid #e2e8f0; padding:0; text-align:center;">
                        <input class="c1-inp" type="number" min="0" value="${vIn}" 
                               onchange="Views.Cuadro1.updateCell('${fila.estudianteId}','${p.id}','in',this.value)" 
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:700; font-size:12px; height:36px; outline:none;" />
                    </td>
                    <td class="c1-nt" style="background:#f0f9ff; border:1px solid #e2e8f0; padding:0; text-align:center;">
                        <input class="c1-inp" type="number" min="0" max="100" value="${vNt}" 
                               onchange="Views.Cuadro1.updateCell('${fila.estudianteId}','${p.id}','nt',this.value)" 
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:800; font-size:12.5px; color:#0369a1; height:36px; outline:none;" />
                    </td>
                    <td class="c1-nf" style="background:#f0fdf4; border:1px solid #e2e8f0; padding:0; text-align:center;">
                        <input class="c1-inp" type="number" min="0" max="100" value="${vNf}" 
                               onchange="Views.Cuadro1.updateCell('${fila.estudianteId}','${p.id}','nf',this.value)" 
                               style="width:100%; border:none; background:transparent; text-align:center; font-weight:900; font-size:12.5px; color:#15803d; height:36px; outline:none;" />
                    </td>`;
            }).join('');

            var recCellBg = isFailing ? '#faf5ff' : '#f8fafc';
            var recCellBorder = isFailing ? '2px solid #c084fc' : '1px solid #e2e8f0';

            return `
                <tr style="border-bottom:1px solid #e2e8f0; transition:background 0.15s; ${isFailing ? 'background:rgba(239,68,68,0.02);' : ''}" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='${isFailing ? 'rgba(239,68,68,0.02)' : 'white'}'">
                    <td class="c1-num" style="text-align:center; font-weight:800; font-size:12px; color:#64748b; border:1px solid #e2e8f0; padding:8px 4px;">${idx + 1}</td>
                    <td class="c1-nombre" style="font-weight:700; font-size:12.5px; color:#0f172a; border:1px solid #e2e8f0; padding:8px 12px; text-align:left; min-width:200px;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                            <span>${fila.nombre}</span>
                            ${isFailing ? `<span class="badge" style="background:#fee2e2; color:#991b1b; font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:4px; flex-shrink:0;" title="Acumuló ${totPts}/400 pts. Faltan ${deficit} pts para 280.">Recup. (${totPts}/400)</span>` : ''}
                        </div>
                    </td>
                    <td class="c1-id" style="font-size:11.5px; color:#64748b; border:1px solid #e2e8f0; padding:8px 6px; text-align:center; min-width:130px;">${fila.identidad || '—'}</td>
                    ${tdParciales}
                    <td class="c1-rec" style="background:${recCellBg}; border:${recCellBorder}; padding:0; text-align:center; width:68px; position:relative;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:2px; padding:0 2px;">
                            <input class="c1-inp" type="number" min="0" max="100" value="${fila.recuperacion || ''}" 
                                   placeholder="${isFailing ? '0-100' : '—'}"
                                   title="${isFailing ? 'Faltan ' + deficit + ' pts para 280. Ingrese nota de recuperación.' : 'Aprobado exento (' + totPts + ' pts)'}"
                                   onchange="Views.Cuadro1.updateRec('${fila.estudianteId}',this.value)" 
                                   style="width:40px; border:none; background:transparent; text-align:center; font-weight:800; font-size:12.5px; color:#7c3aed; height:36px; outline:none;" />
                            <button type="button" onclick="Views.Cuadro1.openSmartRecoveryModal('${fila.estudianteId}')" 
                                    title="Abrir Diagnóstico Inteligente de Recuperación (${fila.nombre})"
                                    style="width:20px; height:20px; border-radius:50%; border:none; background:${isFailing ? '#7c3aed' : '#e2e8f0'}; color:${isFailing ? '#fff' : '#64748b'}; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:0; font-size:10px; font-weight:900; flex-shrink:0;">
                                ⚡
                            </button>
                        </div>
                    </td>
                    <td class="c1-pf" style="text-align:center; font-weight:900; font-size:13px; color:#0f172a; background:#f8fafc; border:1px solid #e2e8f0; padding:8px 4px; min-width:65px;">
                        ${pfDisplay !== '' ? pfDisplay + '%' : '—'}
                    </td>
                    <td class="c1-obs" style="font-size:11px; font-weight:700; color:#475569; border:1px solid #e2e8f0; padding:8px 8px; text-align:center; min-width:140px;">
                        <span style="display:inline-block; padding:3px 8px; border-radius:6px; font-weight:800; background:${obsCalc.includes('RECUPERACIÓN') ? '#dcfce7; color:#15803d;' : obsCalc.includes('EXCELENTE') ? '#dcfce7; color:#15803d;' : obsCalc.includes('AVANZADO') ? '#e0f2fe; color:#0369a1;' : obsCalc.includes('SATISFACTORIO') ? '#fef9c3; color:#854d0e;' : obsCalc ? '#fee2e2; color:#b91c1c;' : 'transparent;'}">
                            ${obsCalc || '—'}
                        </span>
                    </td>
                </tr>`;
        }).join('');

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
                        <div style="color:#64748b; font-weight:700; grid-column:1/-1;">CENTRO: <span style="color:#0f172a; font-weight:800;">${centro.toUpperCase()}</span></div>
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
                    </div>
                    <div class="c1-legend" style="display:flex; align-items:center; gap:14px; font-size:11.5px; font-weight:700; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:5px;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#fee2e2; color:#991b1b; font-size:10px; font-weight:800;">IN</span> Inasistencias</div>
                        <div style="display:flex; align-items:center; gap:5px;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#e0f2fe; color:#0369a1; font-size:10px; font-weight:800;">NT</span> Nota del Parcial</div>
                        <div style="display:flex; align-items:center; gap:5px;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#dcfce7; color:#15803d; font-size:10px; font-weight:800;">NF</span> Nota Final</div>
                        <div style="display:flex; align-items:center; gap:5px;"><span style="display:inline-block; padding:2px 6px; border-radius:4px; background:#fdf4ff; color:#7c3aed; font-size:10px; font-weight:800;">⚡</span> Modal Recuperación</div>
                    </div>
                </div>

                <!-- Tabla SACE Scrollable -->
                <div class="c1-scroll-outer" style="overflow-x:auto; background:#ffffff; border-radius:14px; border:1px solid #cbd5e1; box-shadow:0 4px 16px rgba(0,0,0,0.03);">
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

    updateCell: function (studentId, parId, campo, val) {
        var data = this.getData() || this.buildDefault();
        if (!data || !data.filas) return;
        var row = data.filas.find(function (f) { return f.estudianteId === studentId; });
        if (!row) return;
        if (!row.parciales) row.parciales = {};
        if (!row.parciales[parId]) row.parciales[parId] = { in: '', nt: '', nf: '' };
        
        row.parciales[parId][campo] = val;
        
        // Auto-calcular NF = NT si se edita NT y NF estaba vacío
        if (campo === 'nt' && (row.parciales[parId].nf === '' || row.parciales[parId].nf === undefined)) {
            row.parciales[parId].nf = val;
        }
        
        this.saveData(data);
        Router.navigate('cuadro1');
    },

    updateRec: function (studentId, val) {
        var data = this.getData() || this.buildDefault();
        if (!data || !data.filas) return;
        var row = data.filas.find(function (f) { return f.estudianteId === studentId; });
        if (!row) return;
        row.recuperacion = val;
        this.saveData(data);
        Router.navigate('cuadro1');
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
    }
};

// Interoperabilidad global
if (typeof window !== 'undefined') {
    window.Views.CuadroSACE = Views.Cuadro1;
}

