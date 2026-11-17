/**
 * SACELogic - Motor de Cálculo Oficial SACE Honduras
 * Aula 360 HN
 * 
 * Reglas de evaluación normativa:
 * - 4 Parciales ordinarios de 100% (Total: 400 puntos).
 * - Umbral mínimo de aprobación anual ordinaria: 280 puntos (Promedio 70.0%).
 * - Escala cualitativa oficial:
 *     >= 91%: EXCELENTE
 *     >= 80%: AVANZADO
 *     >= 70%: SATISFACTORIO
 *     <  70%: NECESITA MEJORAR
 * - Recuperación: Calificación >= 70% otorga 'SATISFACTORIO [RECUPERACIÓN]'.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.SACELogic = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const UMBRAL_APROBACION_ANUAL = 280; // 4 parciales x 70%
    const NOTA_MINIMA_APROBATORIA = 70;
    const TOTAL_PARCIALES = 4;

    const SACELogic = {
        UMBRAL_APROBACION_ANUAL,
        NOTA_MINIMA_APROBATORIA,
        TOTAL_PARCIALES,

        /**
         * Calcula el déficit de puntos faltantes para alcanzar los 280 puntos.
         * @param {number} accumulatedPoints Suma de puntos acumulados en parciales cursados
         * @returns {number} Puntos que faltan (>= 0)
         */
        calcPointsDeficit(accumulatedPoints) {
            const accum = Number(accumulatedPoints) || 0;
            return Math.max(0, UMBRAL_APROBACION_ANUAL - accum);
        },

        /**
         * Verifica si el acumulado actual ya alcanzó o superó los 280 puntos.
         * @param {number} accumulatedPoints
         * @returns {boolean}
         */
        isPassing280(accumulatedPoints) {
            return (Number(accumulatedPoints) || 0) >= UMBRAL_APROBACION_ANUAL;
        },

        /**
         * Calcula el promedio requerido por parcial para los períodos restantes.
         * @param {number} deficit Puntos faltantes
         * @param {number} remainingParciales Cantidad de parciales que faltan por cursar
         * @returns {number}
         */
        calcRequiredAverage(deficit, remainingParciales) {
            const rem = Number(remainingParciales) || 0;
            if (rem <= 0) return 0;
            return Math.ceil((Number(deficit) || 0) / rem);
        },

        /**
         * Determina la observación cualitativa oficial según escala SACE.
         * @param {number|string} score Promedio o nota final ordinaria
         * @param {number|string} [recoveryScore] Nota de recuperación (si existe)
         * @returns {string} 'EXCELENTE' | 'AVANZADO' | 'SATISFACTORIO' | 'SATISFACTORIO [RECUPERACIÓN]' | 'NECESITA MEJORAR' | ''
         */
        getObservation(score, recoveryScore) {
            const pf = parseFloat(score);
            const rec = parseFloat(recoveryScore);
            if (isNaN(pf) && isNaN(rec)) return '';

            // Si tiene nota de recuperación válida
            if (!isNaN(rec) && rec >= NOTA_MINIMA_APROBATORIA) {
                return 'SATISFACTORIO [RECUPERACIÓN]';
            }

            const finalScore = !isNaN(rec) ? rec : pf;
            if (isNaN(finalScore)) return '';

            if (finalScore >= 91) return 'EXCELENTE';
            if (finalScore >= 80) return 'AVANZADO';
            if (finalScore >= NOTA_MINIMA_APROBATORIA) return 'SATISFACTORIO';
            return 'NECESITA MEJORAR';
        },

        /**
         * Análisis consolidado anual a partir de un arreglo de 4 parciales.
         * @param {Array<number|null>} grades Notas de los 4 parciales (ej: [75, 80, 65, 90])
         * @param {number|null} [recoveryGrade]
         * @returns {Object} Resumen con totalPoints, promedioAnual, deficit, isFailing280, observation
         */
        analyzeAnnualGrades(grades, recoveryGrade) {
            const validGrades = (grades || []).map(g => (g !== null && g !== undefined && g !== '' && !isNaN(Number(g))) ? Number(g) : null);
            let totalPoints = 0;
            let countGraded = 0;

            validGrades.forEach(g => {
                if (g !== null) {
                    totalPoints += g;
                    countGraded++;
                }
            });

            const promedioAnual = countGraded > 0 ? Math.round(totalPoints / countGraded) : 0;
            const pointsDeficit = Math.max(0, UMBRAL_APROBACION_ANUAL - totalPoints);
            const remainingParciales = Math.max(0, TOTAL_PARCIALES - countGraded);
            const hasFourthParcial = validGrades.length >= 4 && validGrades[3] !== null;
            const isFailing280 = countGraded > 0 && (
                (hasFourthParcial || countGraded >= 4)
                    ? (totalPoints < UMBRAL_APROBACION_ANUAL)
                    : (pointsDeficit > remainingParciales * 100)
            );

            return {
                totalPoints,
                countGraded,
                promedioAnual,
                pointsDeficit,
                remainingParciales,
                isFailing280,
                isPassing: totalPoints >= UMBRAL_APROBACION_ANUAL,
                observation: this.getObservation(promedioAnual, recoveryGrade)
            };
        },

        /**
         * Calcula el progreso y formateo visual de la columna "Faltan para 280 / Observaciones" del Cuadro Controlador.
         * Integra la lectura de notas ordinarias, notas de emergencia y Cuadro #1.
         */
        getPointsNeededFor280(studentId, courseId, currentParcialId, currentParcialIndex, studentCurrentFinal, optPriorGradesMap) {
            if (currentParcialId === 'recuperacion' || currentParcialId === 'all') return null;

            const courseParciales = (typeof Views !== 'undefined' && Views.Cuadro1 && typeof Views.Cuadro1.getCourseParciales === 'function')
                ? Views.Cuadro1.getCourseParciales(courseId)
                : ((typeof Store !== 'undefined' && Store.getParcialByCourse) ? Store.getParcialByCourse(courseId) : []);

            let pIdx = currentParcialIndex;
            if (typeof pIdx !== 'number' || pIdx < 0) {
                pIdx = courseParciales.findIndex(p => String(p.id) === String(currentParcialId));
            }
            if (pIdx < 0) pIdx = 0;

            let accum = 0;
            let anyScoreFound = false;

            for (let i = 0; i <= pIdx; i++) {
                const p = courseParciales[i];
                if (!p) continue;
                if (i === pIdx && studentCurrentFinal !== undefined && studentCurrentFinal !== null && studentCurrentFinal !== '') {
                    const curNum = Number(studentCurrentFinal);
                    if (curNum > 0 || (typeof Store !== 'undefined' && typeof Store.getEmergencyGrade === 'function' && Store.getEmergencyGrade(courseId, p, studentId, i) !== null)) {
                        accum += curNum;
                        anyScoreFound = true;
                    }
                } else {
                    let foundGrade = null;
                    if (typeof Views !== 'undefined' && Views.Cuadro1 && typeof Views.Cuadro1.computeStudentGrade === 'function') {
                        const gr = Views.Cuadro1.computeStudentGrade(studentId, courseId, p, i);
                        if (gr !== '' && !isNaN(Number(gr))) foundGrade = Number(gr);
                    }
                    if (foundGrade === null && typeof Store !== 'undefined' && typeof Store.getEmergencyGrade === 'function') {
                        const emg = Store.getEmergencyGrade(courseId, p, studentId, i);
                        if (emg !== null && !isNaN(Number(emg))) foundGrade = Number(emg);
                    }
                    if (foundGrade === null && optPriorGradesMap && (optPriorGradesMap[studentId + '_' + p.id] !== undefined || optPriorGradesMap[studentId + '_' + p.numero] !== undefined)) {
                        const gr = optPriorGradesMap[studentId + '_' + p.id] !== undefined ? optPriorGradesMap[studentId + '_' + p.id] : optPriorGradesMap[studentId + '_' + p.numero];
                        if (gr !== '' && !isNaN(Number(gr))) foundGrade = Number(gr);
                    }
                    if (foundGrade !== null) {
                        accum += foundGrade;
                        anyScoreFound = true;
                    }
                }
            }

            if (!anyScoreFound && accum === 0) {
                return {
                    number: '280',
                    displayHtml: '280',
                    raw: 280,
                    accum: 0,
                    isFinal: false,
                    tooltip: 'Sin calificaciones registradas aún (Meta: 280 pts)'
                };
            }

            const faltan = Math.max(0, UMBRAL_APROBACION_ANUAL - accum);
            const remainingQuarters = Math.max(0, 3 - pIdx);
            const promReq = remainingQuarters > 0 ? Math.ceil(faltan / remainingQuarters) : 0;
            const isLast = (pIdx === 3 || (courseParciales.length > 0 && pIdx === courseParciales.length - 1));

            if (isLast) {
                // IV Parcial (Cierre Anual Oficial)
                const isPassed = (accum >= UMBRAL_APROBACION_ANUAL);
                const badgeHtml = isPassed
                    ? `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:800; font-size:11px; padding:3px 8px; border-radius:6px; border:1px solid #bbf7d0;">Aprobado</span>`
                    : `<span class="badge" style="background:#fee2e2; color:#b91c1c; font-weight:800; font-size:11px; padding:3px 8px; border-radius:6px; border:1px solid #fecaca;" title="Faltaron ${faltan} pts para 280">Reprobado</span>`;
                return {
                    number: isPassed ? 'Aprobado' : 'Reprobado',
                    displayHtml: badgeHtml,
                    raw: isPassed ? 0 : faltan,
                    accum: accum,
                    isPassed: isPassed,
                    isFinal: true,
                    tooltip: isPassed
                        ? `¡Aprobado! Acumuló ${accum}/400 pts en los 4 parciales (Superó los 280 pts requeridos).`
                        : `Reprobado en período ordinario. Acumuló ${accum}/400 pts (Faltaron ${faltan} pts para 280). Pasa a Recuperación.`
                };
            } else {
                // I, II y III Parcial (Progreso hacia los 280)
                const isEarlyPassed = (accum >= UMBRAL_APROBACION_ANUAL);
                let tooltip = '';
                if (isEarlyPassed) {
                    tooltip = `¡Meta 280 alcanzada anticipadamente! Acumula ${accum} pts.`;
                } else if (pIdx === 2) {
                    tooltip = `Acumulado: ${accum} pts. Requiere ${faltan} puntos en el IV Parcial para aprobar el año.`;
                } else {
                    tooltip = `Acumulado: ${accum} pts. Faltan ${faltan} pts en ${remainingQuarters} parciales restantes (promedio de ${promReq} pts/parcial).`;
                }

                const displayHtml = isEarlyPassed
                    ? `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:800; font-size:11px; padding:2px 7px; border-radius:6px; border:1px solid #bbf7d0;">Aprobado</span>`
                    : `<span style="font-weight:800; font-size:13px; color:${faltan > 100 && pIdx >= 2 ? '#b91c1c' : '#0f172a'};">${faltan}</span>`;

                return {
                    number: isEarlyPassed ? 'Aprobado' : String(faltan),
                    displayHtml: displayHtml,
                    raw: isEarlyPassed ? 0 : faltan,
                    accum: accum,
                    promReq: promReq,
                    isEarlyPassed: isEarlyPassed,
                    isFinal: false,
                    tooltip: tooltip
                };
            }
        }
    };

    return SACELogic;
}));
