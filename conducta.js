// ==========================================================================
// AULA 360 - MÓDULO PERSONALIDAD & CONTROL DE CONDUCTA ESCOLAR
// Basado en el estándar de Cuaderno del Profesorado (Méritos e Incidencias)
// ==========================================================================

const Views_Conducta = {
    _activeTab: 'positiva', // 'positiva' | 'incidencia'
    _selectedType: null,
    _currentStudentId: null,
    _selectedDate: null,
    _selectedTime: null,
    _multiSelectMode: false,
    _selectedStudentIds: new Set(),
    _editorActiveTab: 'positivas', // 'positivas' | 'incidencias'
    _selectedParcialNum: null,     // 1 | 2 | 3 | 4
    _saceReportFormat: 'texto',    // 'texto' | 'combinado' | 'numero'

    // =========================================================================
    // CATÁLOGO OFICIAL SACE: 5 ASPECTOS OBSERVABLES DE LA PERSONALIDAD
    // =========================================================================
    SACE_ASPECTOS: [
        { key: 'puntualidad',        label: 'PUNTUALIDAD',          shortLabel: 'Puntualidad',          color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd', icon: 'clock' },
        { key: 'espiritu_trabajo',   label: 'ESPÍRITU DE TRABAJO',  shortLabel: 'Espíritu de Trabajo',  color: '#059669', bg: '#dcfce7', border: '#a7f3d0', icon: 'zap' },
        { key: 'orden_presentacion', label: 'ORDEN Y PRESENTACIÓN', shortLabel: 'Orden y Presentación', color: '#7c3aed', bg: '#f3e8ff', border: '#ddd6fe', icon: 'sparkles' },
        { key: 'sociabilidad',       label: 'SOCIABILIDAD',         shortLabel: 'Sociabilidad',         color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: 'users' },
        { key: 'moralidad',          label: 'MORALIDAD',            shortLabel: 'Moralidad',            color: '#0f766e', bg: '#ccfbf1', border: '#99f6e4', icon: 'shield-check' }
    ],

    getSaceScoreMeta(score) {
        const n = Math.max(2, Math.min(4, Math.round(Number(score) || 3)));
        if (n === 4) return { score: 4, label: 'SOBRESALIENTE', short: 'Sobresaliente', color: '#15803d', bg: '#dcfce7', border: '#86efac' };
        if (n === 3) return { score: 3, label: 'MUY BUENO',     short: 'Muy Bueno',     color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' };
        return              { score: 2, label: 'BUENO',         short: 'Bueno',         color: '#b45309', bg: '#fef3c7', border: '#fcd34d' };
    },

    getAspectMeta(key) {
        return this.SACE_ASPECTOS.find(a => a.key === key) || this.SACE_ASPECTOS[1];
    },

    renderAspectPillsHtml(aspectKeys, compact = true) {
        const keys = Array.isArray(aspectKeys) && aspectKeys.length > 0 ? aspectKeys : ['espiritu_trabajo'];
        return `<div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:3px; margin-top:${compact ? '3px' : '4px'};">
            ${keys.map(k => {
                const m = this.getAspectMeta(k);
                return `<span style="background:${m.bg}; color:${m.color}; border:1px solid ${m.border}; font-size:${compact ? '8.5px' : '9.5px'}; font-weight:800; padding:1px 5px; border-radius:999px; line-height:1.2; white-space:nowrap;">${m.shortLabel}</span>`;
            }).join('')}
        </div>`;
    },

    _getActiveParcialObj(courseId, parcialNumOverride = null) {
        const courseParciales = (typeof Store.getParcialByCourse === 'function')
            ? Store.getParcialByCourse(courseId)
            : (Store.get('parciales') || []).filter(p => p.cursoId === courseId);

        let targetNum = parcialNumOverride || this._selectedParcialNum;
        if (!targetNum) {
            const activeStr = String(Store.data?.configAcademica?.parcialActivo || '1');
            if (activeStr.includes('IV') || activeStr.includes('4') || activeStr.toLowerCase().includes('cuarto')) targetNum = 4;
            else if (activeStr.includes('III') || activeStr.includes('3') || activeStr.toLowerCase().includes('tercer')) targetNum = 3;
            else if (activeStr.includes('II') || activeStr.includes('2') || activeStr.toLowerCase().includes('segundo')) targetNum = 2;
            else targetNum = 1;
            this._selectedParcialNum = targetNum;
        }

        let found = courseParciales.find(p => Number(p.numero) === Number(targetNum));
        if (!found) {
            const anio = (Store.getActiveCourse()?.anio) || new Date().getFullYear() || 2026;
            const fallbackRanges = {
                1: { numero: 1, nombre: 'Primer Parcial',  romano: 'I',   fechaInicio: `${anio}-02-01`, fechaFin: `${anio}-04-15` },
                2: { numero: 2, nombre: 'Segundo Parcial', romano: 'II',  fechaInicio: `${anio}-04-16`, fechaFin: `${anio}-06-30` },
                3: { numero: 3, nombre: 'Tercer Parcial',  romano: 'III', fechaInicio: `${anio}-07-01`, fechaFin: `${anio}-09-15` },
                4: { numero: 4, nombre: 'Cuarto Parcial',  romano: 'IV',  fechaInicio: `${anio}-09-16`, fechaFin: `${anio}-11-30` }
            };
            found = fallbackRanges[targetNum] || fallbackRanges[1];
        } else {
            const romMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
            found = { ...found, romano: romMap[found.numero] || 'I' };
        }
        return found;
    },

    _getWeekKey(dateStr) {
        if (!dateStr) return 'W0';
        const d = new Date(dateStr + 'T12:00:00');
        if (isNaN(d.getTime())) return 'W0';
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d - jan1) / 86400000);
        const week = Math.ceil((days + jan1.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
    },

    _pctToSaceBase(pct, defaultBase = 2.65) {
        if (pct === null || pct === undefined || isNaN(pct)) return defaultBase;
        const p = Math.max(0, Math.min(100, Number(pct)));
        // Escala SACE oficial de 3 niveles (2 = Bueno, 3 = Muy Bueno, 4 = Sobresaliente)
        if (p >= 90) return 3.45 + ((p - 90) / 10) * 0.40; // 3.45 a 3.85 -> Sobresaliente
        if (p >= 75) return 2.70 + ((p - 75) / 15) * 0.70; // 2.70 a 3.40 -> Muy Bueno
        if (p >= 50) return 2.20 + ((p - 50) / 25) * 0.50; // 2.20 a 2.70 -> Bueno
        return Math.max(2.00, 2.00 + (p / 50) * 0.20);     // 2.00 a 2.20 -> Bueno (piso absoluto 2.00)
    },

    // =========================================================================
    // MOTOR DE PONDERACIÓN INTEGRAL DE PERSONALIDAD SACE (SEMANAL + AUTOMÁTICO)
    // =========================================================================
    evaluateStudentPersonality(courseId, studentId, parcialNumOverride = null) {
        const parcial = this._getActiveParcialObj(courseId, parcialNumOverride);
        const pNum = Number(parcial.numero) || 1;
        const fInicio = parcial.fechaInicio || '2026-01-01';
        const fFin = parcial.fechaFin || '2026-12-31';

        const typesCatalog = Store.getConductTypes();
        const typeAspectMap = new Map();
        (typesCatalog.positivas || []).forEach(t => typeAspectMap.set(t.id, Array.isArray(t.aspectos) && t.aspectos.length ? t.aspectos : ['espiritu_trabajo']));
        (typesCatalog.incidencias || []).forEach(t => typeAspectMap.set(t.id, Array.isArray(t.aspectos) && t.aspectos.length ? t.aspectos : ['moralidad']));

        // 1. ASISTENCIA AUTOMÁTICA EN EL PARCIAL
        const allAsist = (Store.get('asistencia') || []).filter(a =>
            a.cursoId === courseId &&
            a.estudianteId === studentId &&
            (!a.fecha || (a.fecha >= fInicio && a.fecha <= fFin))
        );
        const totalAsistDays = allAsist.length;
        let presentes = 0, tardanzas = 0, injustificadas = 0, excusas = 0;
        allAsist.forEach(a => {
            const st = String(a.estado || '').toUpperCase();
            if (st === 'P') presentes++;
            else if (st === 'T') tardanzas++;
            else if (st === 'E' || st === 'J') excusas++;
            else if (st === 'A' || st === 'I' || st === 'F') injustificadas++;
        });
        const puntualidadAsistPct = totalAsistDays > 0
            ? Math.max(0, Math.min(100, ((presentes + excusas + (tardanzas * 0.45)) / totalAsistDays) * 100))
            : null;
        const asistenciaEfectivaPct = totalAsistDays > 0
            ? Math.max(0, Math.min(100, ((presentes + excusas + (tardanzas * 0.75)) / totalAsistDays) * 100))
            : null;

        // 2. ACTIVIDADES Y CALIFICACIONES AUTOMÁTICAS DEL PARCIAL
        const allCourseParciales = Store.getParcialByCourse ? Store.getParcialByCourse(courseId) : [];
        const matchParcialIds = new Set(allCourseParciales.filter(p => Number(p.numero) === pNum).map(p => p.id));
        if (parcial.id) matchParcialIds.add(parcial.id);

        const courseActs = (Store.get('actividades') || []).filter(a => {
            if (a.cursoId !== courseId) return false;
            if (a.parcialId && matchParcialIds.size > 0) return matchParcialIds.has(a.parcialId);
            if (a.fecha) return a.fecha >= fInicio && a.fecha <= fFin;
            return pNum === 1;
        });

        const studentGrades = (Store.get('calificaciones') || []).filter(g => g.cursoId === courseId && g.estudianteId === studentId);
        const gradeByAct = new Map(studentGrades.map(g => [g.actividadId, g]));

        // Determinar qué actividades ya fueron evaluadas en el grupo (para no penalizar tareas futuras no calificadas aún)
        const allCourseGrades = (Store.get('calificaciones') || []).filter(g => g.cursoId === courseId && Number(g.puntajeObtenido) > 0);
        const gradedActIdsInCourse = new Set(allCourseGrades.map(g => g.actividadId));
        const activeActs = courseActs.filter(a => gradedActIdsInCourse.has(a.id));

        let deliveredCount = 0;
        let sumPctAll = 0, countPctAll = 0;
        let sumPctTrabajos = 0, countPctTrabajos = 0; // Aula + ExtraAula (Orden, presentación y esfuerzo)
        let sumPctValores = 0, countPctValores = 0;   // Actitudes y Expresiones

        activeActs.forEach(act => {
            const max = Number(act.puntajeMax) || 0;
            if (max <= 0) return;
            const g = gradeByAct.get(act.id);
            const obt = g && g.puntajeObtenido !== undefined && g.puntajeObtenido !== '' ? Number(g.puntajeObtenido) : 0;
            const pct = Math.max(0, Math.min(100, (obt / max) * 100));

            if (obt > 0) deliveredCount++;
            sumPctAll += pct;
            countPctAll++;

            const dim = String(act.dimensionKey || '');
            if (dim === 'aula' || dim === 'extraAula' || dim === 'extra') {
                sumPctTrabajos += pct;
                countPctTrabajos++;
            } else if (dim === 'actitudes' || dim === 'expresiones') {
                sumPctValores += pct;
                countPctValores++;
            }
        });

        const taskCompletionPct = activeActs.length > 0 ? (deliveredCount / activeActs.length) * 100 : null;
        const avgAcademicPct = countPctAll > 0 ? (sumPctAll / countPctAll) : null;
        const avgTrabajosPct = countPctTrabajos > 0 ? (sumPctTrabajos / countPctTrabajos) : avgAcademicPct;
        const avgValoresPct = countPctValores > 0 ? (sumPctValores / countPctValores) : avgAcademicPct;

        // Puntos extra / Actividades extraordinarias y Equipos de trabajo
        const extraPoints = (typeof Store.getStudentExtraordinaryPoints === 'function')
            ? Store.getStudentExtraordinaryPoints(studentId, courseId, parcial.id)
            : 0;
        const equiposCourse = Store.data?.equiposState?.[courseId];
        let hasTeamRole = false;
        if (equiposCourse && Array.isArray(equiposCourse.teams)) {
            equiposCourse.teams.forEach(t => {
                if (Array.isArray(t.members) && t.members.some(m => (m.id || m) === studentId)) {
                    hasTeamRole = true;
                }
            });
        }

        // 3. REGISTROS DE CONDUCTA AGRUPADOS POR SEMANA Y POR ASPECTO (REGLA ANTI-INFLACIÓN)
        const conductRecords = Store.getConductRecords(courseId, studentId).filter(r => {
            if (!r.fecha) return true;
            return r.fecha >= fInicio && r.fecha <= fFin;
        });

        const aspectStats = {};
        this.SACE_ASPECTOS.forEach(a => {
            aspectStats[a.key] = {
                posCount: 0,
                leveCount: 0,
                graveCount: 0,
                muyGraveCount: 0,
                posWeeks: new Set(),
                negWeeks: new Set(),
                records: []
            };
        });

        conductRecords.forEach(rec => {
            let aspects = rec.aspectos;
            if (!Array.isArray(aspects) || aspects.length === 0) {
                aspects = typeAspectMap.get(rec.tipoId) || (rec.tipo === 'positiva' ? ['espiritu_trabajo'] : ['moralidad']);
            }
            const wk = this._getWeekKey(rec.fecha);
            aspects.forEach(aspKey => {
                const st = aspectStats[aspKey];
                if (!st) return;
                st.records.push(rec);
                if (rec.tipo === 'positiva') {
                    st.posCount++;
                    st.posWeeks.add(wk);
                } else {
                    st.negWeeks.add(wk);
                    if (rec.tipo === 'leve') st.leveCount++;
                    else if (rec.tipo === 'grave') st.graveCount++;
                    else st.muyGraveCount++;
                }
            });
        });

        // Función que calcula el ajuste conductual estabilizado por semana:
        // - No permite que 1 a 4 registros en un solo día inflen artificialmente la nota a 4 (Sobresaliente).
        // - Cada semana distinta con conducta positiva aporta +0.18 pts (hasta 4 semanas = +0.72), más un pequeño residuo (+0.03) por registro adicional.
        // - Las incidencias restan según su gravedad (-0.22 leve, -0.48 grave, -0.85 muy grave).
        const calcConductDelta = (st) => {
            const uniquePosWeeks = st.posWeeks.size;
            const extraLogsSameWeek = Math.max(0, st.posCount - uniquePosWeeks);
            const posBoost = Math.min(0.85, (uniquePosWeeks * 0.18) + Math.min(0.15, extraLogsSameWeek * 0.03));
            const negPenalty = (st.leveCount * 0.22) + (st.graveCount * 0.48) + (st.muyGraveCount * 0.85);
            return {
                delta: posBoost - negPenalty,
                posBoost,
                negPenalty,
                uniquePosWeeks
            };
        };

        // 4. CÁLCULO DE CADA UNO DE LOS 5 ASPECTOS (Escala Continua 1.00 - 4.00)
        // A) PUNTUALIDAD: Asistencia puntual (65%) + Entrega oportuna de tareas (35%) + Conductas de puntualidad por semana
        const basePuntualidadPct = (puntualidadAsistPct !== null && taskCompletionPct !== null)
            ? (puntualidadAsistPct * 0.65 + taskCompletionPct * 0.35)
            : (puntualidadAsistPct !== null ? puntualidadAsistPct : taskCompletionPct);
        const autoPuntualidad = this._pctToSaceBase(basePuntualidadPct, 2.75);
        const condPuntualidad = calcConductDelta(aspectStats.puntualidad);
        // Si no hay evidencia suficiente (ni asistencia ni >=3 semanas de mérito), limitar tope automático a 3.35 (Muy Bueno) para evitar falsos Sobresalientes
        const hasStrongPuntualidadEvidence = (totalAsistDays >= 5 || activeActs.length >= 2 || condPuntualidad.uniquePosWeeks >= 3);
        let rawPuntualidad = autoPuntualidad + condPuntualidad.delta;
        if (!hasStrongPuntualidadEvidence && rawPuntualidad > 3.35) rawPuntualidad = 3.35;

        // B) ESPÍRITU DE TRABAJO: Cumplimiento de tareas (50%) + Promedio de logro académico (50%) + Extraordinarias + Conductas semanales
        const baseEspirituPct = (taskCompletionPct !== null && avgAcademicPct !== null)
            ? (taskCompletionPct * 0.50 + avgAcademicPct * 0.50)
            : (taskCompletionPct !== null ? taskCompletionPct : avgAcademicPct);
        const extraBoost = extraPoints > 0 ? Math.min(0.22, extraPoints * 0.04) : 0;
        const autoEspiritu = this._pctToSaceBase(baseEspirituPct, 2.70) + extraBoost;
        const condEspiritu = calcConductDelta(aspectStats.espiritu_trabajo);
        const hasStrongEspirituEvidence = (activeActs.length >= 2 || condEspiritu.uniquePosWeeks >= 3);
        let rawEspiritu = autoEspiritu + condEspiritu.delta;
        if (!hasStrongEspirituEvidence && rawEspiritu > 3.35) rawEspiritu = 3.35;

        // C) ORDEN Y PRESENTACIÓN: Calidad en Trabajos de Aula/Extra-Aula (65%) + Tareas completas (35%) + Conductas de orden/material
        const baseOrdenPct = (avgTrabajosPct !== null && taskCompletionPct !== null)
            ? (avgTrabajosPct * 0.65 + taskCompletionPct * 0.35)
            : (avgTrabajosPct !== null ? avgTrabajosPct : taskCompletionPct);
        const autoOrden = this._pctToSaceBase(baseOrdenPct, 2.75);
        const condOrden = calcConductDelta(aspectStats.orden_presentacion);
        const hasStrongOrdenEvidence = (countPctTrabajos >= 1 || condOrden.uniquePosWeeks >= 3);
        let rawOrden = autoOrden + condOrden.delta;
        if (!hasStrongOrdenEvidence && rawOrden > 3.35) rawOrden = 3.35;

        // D) SOCIABILIDAD: Dimensión Actitudes/Valores (60%) + Asistencia/Convivencia (40%) + Rol en Equipo + Conductas de sociabilidad
        const baseSocPct = (avgValoresPct !== null && asistenciaEfectivaPct !== null)
            ? (avgValoresPct * 0.60 + asistenciaEfectivaPct * 0.40)
            : (avgValoresPct !== null ? avgValoresPct : asistenciaEfectivaPct);
        const teamBoost = hasTeamRole ? 0.12 : 0;
        const autoSoc = this._pctToSaceBase(baseSocPct, 2.80) + teamBoost;
        const condSoc = calcConductDelta(aspectStats.sociabilidad);
        const hasStrongSocEvidence = (countPctValores >= 1 || totalAsistDays >= 5 || condSoc.uniquePosWeeks >= 3);
        let rawSoc = autoSoc + condSoc.delta;
        if (!hasStrongSocEvidence && rawSoc > 3.35) rawSoc = 3.35;

        // E) MORALIDAD: Base ética de integridad (Actitudes/Valores + Asistencia sin faltas graves) + Conductas de moralidad
        const totalGravesGlobal = conductRecords.filter(r => r.tipo === 'grave' || r.tipo === 'muy_grave').length;
        const baseMoralPct = (avgValoresPct !== null && puntualidadAsistPct !== null)
            ? (avgValoresPct * 0.55 + puntualidadAsistPct * 0.45)
            : (avgValoresPct !== null ? avgValoresPct : puntualidadAsistPct);
        const cleanSheetBonus = (totalGravesGlobal === 0 && (totalAsistDays >= 5 || activeActs.length >= 2)) ? 0.15 : 0;
        const autoMoral = this._pctToSaceBase(baseMoralPct, 2.85) + cleanSheetBonus;
        const condMoral = calcConductDelta(aspectStats.moralidad);
        const hasStrongMoralEvidence = (totalAsistDays >= 5 || activeActs.length >= 2 || condMoral.uniquePosWeeks >= 3);
        let rawMoral = autoMoral + condMoral.delta;
        if (!hasStrongMoralEvidence && rawMoral > 3.35) rawMoral = 3.35;

        const rawMap = {
            puntualidad:        Math.max(2.0, Math.min(4.0, rawPuntualidad)),
            espiritu_trabajo:   Math.max(2.0, Math.min(4.0, rawEspiritu)),
            orden_presentacion: Math.max(2.0, Math.min(4.0, rawOrden)),
            sociabilidad:       Math.max(2.0, Math.min(4.0, rawSoc)),
            moralidad:          Math.max(2.0, Math.min(4.0, rawMoral))
        };

        const autoHintMap = {
            puntualidad: totalAsistDays > 0
                ? `Asistencia puntual ${Math.round(puntualidadAsistPct)}% (${presentes}P, ${tardanzas}T, ${injustificadas}I)`
                : (activeActs.length > 0 ? `Entregas a tiempo: ${deliveredCount}/${activeActs.length}` : 'Sin asistencia registrada aún en este parcial'),
            espiritu_trabajo: activeActs.length > 0
                ? `Tareas entregadas: ${deliveredCount}/${activeActs.length} (${Math.round(taskCompletionPct)}%) · Logro: ${Math.round(avgAcademicPct || 0)}%`
                : 'A la espera de actividades evaluadas en el parcial',
            orden_presentacion: countPctTrabajos > 0
                ? `Calidad en Aula/Extra-Aula: ${Math.round(avgTrabajosPct)}% (${countPctTrabajos} act.)`
                : 'Calculado según entregas y cuidado de material',
            sociabilidad: `${countPctValores > 0 ? `Valores/Actitudes: ${Math.round(avgValoresPct)}%` : 'Convivencia escolar'}${hasTeamRole ? ' · Miembro activo de Equipo' : ''}`,
            moralidad: `${totalGravesGlobal === 0 ? 'Sin faltas graves de conducta' : `${totalGravesGlobal} falta(s) grave(s)/muy grave(s)`} · Integridad y respeto`
        };

        const overrides = (typeof Store.getPersonalityOverride === 'function')
            ? (Store.getPersonalityOverride(courseId, `P${pNum}`, studentId) || {})
            : {};

        const aspectsResult = {};
        let sumFinalScores = 0;

        this.SACE_ASPECTOS.forEach(asp => {
            const k = asp.key;
            const rawVal = rawMap[k];
            // Escala Oficial SACE de 3 niveles: 4 (Sobresaliente >= 3.45), 3 (Muy Bueno >= 2.50), 2 (Bueno < 2.50)
            const autoScore = rawVal >= 3.45 ? 4 : (rawVal >= 2.50 ? 3 : 2);
            const manualScore = overrides[k] ? Number(overrides[k]) : null;
            const finalScore = (manualScore >= 2 && manualScore <= 4) ? manualScore : autoScore;
            const meta = this.getSaceScoreMeta(finalScore);
            const st = aspectStats[k];

            aspectsResult[k] = {
                key: k,
                aspectLabel: asp.label,
                shortLabel: asp.shortLabel,
                rawScore: Number(rawVal.toFixed(2)),
                autoScore,
                manualScore,
                isManual: manualScore !== null,
                score: finalScore,
                label: meta.label,
                short: meta.short,
                color: meta.color,
                bg: meta.bg,
                border: meta.border,
                posCount: st.posCount,
                posWeeksCount: st.posWeeks.size,
                incCount: st.leveCount + st.graveCount + st.muyGraveCount,
                leveCount: st.leveCount,
                graveCount: st.graveCount,
                muyGraveCount: st.muyGraveCount,
                autoSummary: autoHintMap[k],
                records: st.records
            };
            sumFinalScores += finalScore;
        });

        const avgScore = Number((sumFinalScores / 5).toFixed(2));
        const overallMeta = this.getSaceScoreMeta(Math.round(avgScore));

        return {
            courseId,
            studentId,
            parcialNum: pNum,
            parcialNombre: parcial.nombre || `Parcial ${pNum}`,
            parcialRomano: parcial.romano || 'I',
            fechaInicio: fInicio,
            fechaFin: fFin,
            aspects: aspectsResult,
            avgScore,
            overallRounded: overallMeta.score,
            overallLabel: overallMeta.label,
            overallShort: overallMeta.short,
            overallColor: overallMeta.color,
            overallBg: overallMeta.bg,
            overallBorder: overallMeta.border,
            metrics: {
                totalAsistDays,
                presentes,
                tardanzas,
                injustificadas,
                excusas,
                puntualidadAsistPct: puntualidadAsistPct !== null ? Math.round(puntualidadAsistPct) : null,
                totalActs: activeActs.length,
                deliveredCount,
                taskCompletionPct: taskCompletionPct !== null ? Math.round(taskCompletionPct) : null,
                avgAcademicPct: avgAcademicPct !== null ? Math.round(avgAcademicPct) : null,
                avgTrabajosPct: avgTrabajosPct !== null ? Math.round(avgTrabajosPct) : null,
                extraPoints,
                hasTeamRole,
                totalConductRecords: conductRecords.length
            }
        };
    },

    // Icono oficial de Mazo de Juez (SVG de contorno sin relleno)
    getJudgeGavelImg(size = 20, color = '#f59e0b') {
        return `<svg viewBox="8 5 104 75" width="${size}" height="${size}" fill="none" style="width:${size}px; height:${size}px; vertical-align:middle; display:inline-block; flex-shrink:0; overflow:visible;">
            <path d="M 16 75 L 68 75 C 68 67, 63 63, 56 63 L 28 63 C 21 63, 16 67, 16 75 Z" fill="none" stroke="${color}" stroke-width="5.5" stroke-linejoin="round"/>
            <rect x="23" y="57.5" width="38" height="5.5" rx="2" fill="none" stroke="${color}" stroke-width="5"/>
            <g transform="translate(46, 36) rotate(24)" stroke="${color}">
                <path d="M 12 -4 L 68 -5.5 C 73 -5.5, 76 -3, 76 0 C 76 3, 73 5.5, 68 5.5 L 12 4" fill="none" stroke-width="5.5" stroke-linejoin="round"/>
                <rect x="-12" y="-17" width="24" height="34" rx="2" fill="none" stroke-width="5.5"/>
                <rect x="-15.5" y="-23" width="31" height="6" rx="3" fill="none" stroke-width="5.5"/>
                <rect x="-15.5" y="17" width="31" height="6" rx="3" fill="none" stroke-width="5.5"/>
            </g>
        </svg>`;
    },

    // Icono formal de Estrella para Conducta Positiva (Vector geométrico limpio y ejecutivo, sin emoji infantil)
    getPositiveIconSvg(size = 16, color = '#16a34a', fill = '#dcfce7') {
        return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="width:${size}px; height:${size}px; vertical-align:middle; display:inline-block; flex-shrink:0;">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${fill}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
        </svg>`;
    },

    // Estrella formal sólida para insignias compactas dentro del círculo perfecto
    getFormalStarSvg(size = 10, color = '#15803d') {
        return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="width:${size}px; height:${size}px; vertical-align:middle; display:inline-block; flex-shrink:0;">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${color}" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>`;
    },

    // Indicador formal geométrico de nivel de severidad (1 = Leve, 2 = Grave, 3 = Muy Grave)
    getSeverityIndicatorSvg(level = 1) {
        const c1 = level >= 1 ? '#dc2626' : '#e2e8f0';
        const c2 = level >= 2 ? '#dc2626' : '#e2e8f0';
        const c3 = level >= 3 ? '#dc2626' : '#e2e8f0';
        const b1 = level >= 1 ? '#991b1b' : '#cbd5e1';
        const b2 = level >= 2 ? '#991b1b' : '#cbd5e1';
        const b3 = level >= 3 ? '#991b1b' : '#cbd5e1';
        return `<svg viewBox="0 0 32 10" width="32" height="10" style="width:32px; height:10px; vertical-align:middle; display:inline-block; flex-shrink:0;">
            <circle cx="5" cy="5" r="4" fill="${c1}" stroke="${b1}" stroke-width="1.2"/>
            <circle cx="16" cy="5" r="4" fill="${c2}" stroke="${b2}" stroke-width="1.2"/>
            <circle cx="27" cy="5" r="4" fill="${c3}" stroke="${b3}" stroke-width="1.2"/>
        </svg>`;
    },

    // Icono oficial combinado: Estrella + Mazo de Juez sin relleno (solo contorno)
    getStarGavelSvg(size = 22) {
        const starSize = Math.round(size * 0.72);
        const gavelSize = Math.round(size * 1.0);
        return `<span style="display:inline-flex; align-items:center; justify-content:center; gap:3px; vertical-align:middle; line-height:1;">
            <svg viewBox="0 0 24 24" width="${starSize}" height="${starSize}" fill="none" style="width:${starSize}px; height:${starSize}px; flex-shrink:0;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${this.getJudgeGavelImg(gavelSize, '#f59e0b')}
        </span>`;
    },

    isConductShownInTable() {
        try {
            const v = localStorage.getItem('conducta_mostrar_en_tabla');
            return v !== '0'; // Por defecto ON
        } catch (e) {
            return true;
        }
    },

    toggleConductInTable(checked) {
        if (typeof checked !== 'boolean') {
            checked = !this.isConductShownInTable();
        }
        try {
            localStorage.setItem('conducta_mostrar_en_tabla', checked ? '1' : '0');
        } catch (e) {}

        // Actualizar visualmente el interruptor naranja en el DOM de inmediato
        const chk = document.getElementById('conducta-table-toggle');
        const track = document.getElementById('conducta-toggle-track');
        const thumb = document.getElementById('conducta-toggle-thumb');
        if (chk) chk.checked = checked;
        if (track) track.style.background = checked ? '#10b981' : '#cbd5e1';
        if (thumb) thumb.style.left = checked ? '22px' : '3px';

        // Si el Cuadro Controlador está abierto en el DOM, mostrar u ocultar el botón y contadores junto a cada nombre
        const btns = document.querySelectorAll('.cuadro-conducta-row-btn');
        btns.forEach(btn => {
            btn.style.display = checked ? 'inline-flex' : 'none';
            const sid = btn.getAttribute('data-student-id');
            if (checked && sid && Views.Conducta) {
                btn.innerHTML = Views.Conducta.getStudentConductBadgeHtml(sid);
            }
        });

        if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast(checked ? 'Conducta visible en la tabla de notas' : 'Conducta oculta en la tabla de notas (Modo Proyector)', 'info');
        } else if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast(checked ? 'Visible en tabla de notas' : 'Oculto en tabla de notas (Modo Proyector)', 'info');
        }
    },

    // Helper: Obtener curso seguro
    _getCourse(courseId) {
        if (courseId) {
            const list = (typeof Store !== 'undefined' && Store.get) ? (Store.get('cursos') || []) : [];
            const found = list.find(x => String(x.id) === String(courseId));
            if (found) return found;
        }
        if (typeof Store !== 'undefined' && Store.getActiveCourse) {
            const active = Store.getActiveCourse();
            if (active) return active;
        }
        if (typeof Store !== 'undefined' && Store.get) {
            const list = Store.get('cursos') || [];
            if (list.length > 0) return list[0];
        }
        return null;
    },

    // Helper: Título descriptivo del curso
    _getCourseTitle(course) {
        if (!course) return 'Curso';
        const asig = course.asignatura || course.nombre || course.name || 'Curso';
        const extra = [course.grado ? `${course.grado}°` : '', course.seccion ? `Sec. ${course.seccion}` : ''].filter(Boolean).join(' ');
        return extra ? `${asig} (${extra})` : asig;
    },

    // Helper: Obtener estudiantes matriculados en el curso
    _getCourseStudents(course) {
        if (!course) course = this._getCourse();
        if (!course) return [];
        let list = [];
        if (typeof Store !== 'undefined' && Store.getStudentsByCourse) {
            try {
                list = Store.getStudentsByCourse(course.id) || [];
            } catch (e) {
                list = [];
            }
        }
        if (!list || list.length === 0) {
            const matriculas = (typeof Store !== 'undefined' && Store.get) ? (Store.get('matriculas') || Store.get('enrollments') || []) : [];
            const enrolledIds = new Set(matriculas.filter(m => String(m.cursoId) === String(course.id)).map(m => String(m.estudianteId)));
            if (course.alumnos && Array.isArray(course.alumnos)) {
                course.alumnos.forEach(id => enrolledIds.add(String(id)));
            }
            const all = (typeof Store !== 'undefined' && Store.get) ? (Store.get('estudiantes') || Store.get('bancoEstudiantes') || []) : [];
            if (enrolledIds.size > 0) {
                list = all.filter(e => enrolledIds.has(String(e.id)));
            } else {
                list = all.filter(e => String(e.courseId) === String(course.id) || (e.cursos && e.cursos.map(String).includes(String(course.id))));
                if (list.length === 0 && all.length > 0) {
                    list = all;
                }
            }
        }
        return (list || []).filter(Boolean)
            .sort((a, b) => {
                const gA = a.genero || 'Z';
                const gB = b.genero || 'Z';
                if (gA !== gB) return gA.localeCompare(gB);
                return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '');
            });
    },

    // Helper: Obtener estudiante por ID
    _getStudent(studentId) {
        if (!studentId) return null;
        if (typeof Store !== 'undefined' && Store.get) {
            const all = Store.get('estudiantes') || [];
            const found = all.find(e => String(e.id) === String(studentId));
            if (found) return found;
        }
        const course = this._getCourse();
        if (course) {
            const list = this._getCourseStudents(course);
            const found = list.find(s => String(s.id) === String(studentId));
            if (found) return found;
        }
        return null;
    },

    // Genera el badge circular perfecto para cada fila de estudiante en la tabla de notas
    getStudentConductBadgeHtml(studentId, courseId) {
        if (!courseId) {
            const c = this._getCourse();
            courseId = c ? c.id : null;
        }
        const showCounters = this.isConductShownInTable();
        const neutralCircleStyle = 'width:26px; height:26px; min-width:26px; min-height:26px; max-width:26px; max-height:26px; aspect-ratio:1/1; border-radius:50%; background:#f8fafc; border:1px solid #cbd5e1; display:inline-flex; align-items:center; justify-content:center; padding:0; box-sizing:border-box; transition:all 0.15s ease;';

        if (!showCounters) {
            return `<span title="Registrar Conducta" style="${neutralCircleStyle}">${this.getJudgeGavelImg(15)}</span>`;
        }

        const summary = Store.getConductSummary(courseId, studentId);
        if (summary.total === 0) {
            return `<span title="Sin anotaciones de conducta (Toca para registrar)" style="${neutralCircleStyle}">${this.getJudgeGavelImg(15)}</span>`;
        }

        let badges = '';
        if (summary.positivasCount > 0) {
            badges += `<span style="width:26px; height:26px; min-width:26px; min-height:26px; max-width:26px; max-height:26px; aspect-ratio:1/1; border-radius:50%; background:#dcfce7; color:#15803d; border:1.5px solid #22c55e; padding:0; font-size:9px; font-weight:800; letter-spacing:-0.4px; line-height:1; display:inline-flex; align-items:center; justify-content:center; gap:1px; box-sizing:border-box; box-shadow:0 1px 2px rgba(22,163,74,0.14);" title="${summary.positivasCount} conducta(s) positiva(s)">${this.getFormalStarSvg(8, '#15803d')}<span>+${summary.positivasCount}</span></span>`;
        }
        if (summary.incidenciasCount > 0) {
            badges += `<span style="width:26px; height:26px; min-width:26px; min-height:26px; max-width:26px; max-height:26px; aspect-ratio:1/1; border-radius:50%; background:#fee2e2; color:#b91c1c; border:1.5px solid #ef4444; padding:0; font-size:9.5px; font-weight:800; letter-spacing:-0.3px; line-height:1; display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; box-shadow:0 1px 2px rgba(220,38,38,0.14);" title="${summary.incidenciasCount} incidencia(s) disciplinaria(s)">-${summary.incidenciasCount}</span>`;
        }

        return `<div style="display:inline-flex; align-items:center; gap:3px;">${badges}</div>`;
    },

    // =========================================================================
    // VISTA PRINCIPAL: Renderizado de página completa (Ruta /conducta)
    // =========================================================================
    render(courseId) {
        // Forzar en el DOM que #content ocupe el 100% real de extremo a extremo sin márgenes laterales ni límites
        setTimeout(() => {
            const cont = document.getElementById('content');
            if (cont) {
                cont.style.setProperty('max-width', '100%', 'important');
                cont.style.setProperty('width', '100%', 'important');
                cont.style.setProperty('margin', '0', 'important');
                cont.style.setProperty('padding', '8px 10px', 'important');
                cont.style.setProperty('box-sizing', 'border-box', 'important');
            }
        }, 0);

        const c = this._getCourse(courseId);
        if (!c) {
            return `
            <div class="card" style="max-width:600px; margin:40px auto; text-align:center; padding:32px 20px;">
                <div style="margin-bottom:14px; display:flex; align-items:center; justify-content:center; gap:10px;">
                    ${this.getPositiveIconSvg(34)}
                    ${this.getJudgeGavelImg(38)}
                </div>
                <h3 style="font-size:20px; font-weight:800; margin-bottom:8px;">Control de Conducta Escolar</h3>
                <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Selecciona un curso activo para registrar méritos e incidencias de tus alumnos.</p>
                <button class="btn btn-primary" onclick="window.openCourseSelector()" style="margin:0 auto;">Seleccionar Curso</button>
            </div>`;
        }

        return this._getGridHtml(c, false);
    },

    onMount() {
        const cont = document.getElementById('content');
        if (cont) {
            cont.style.setProperty('max-width', '100%', 'important');
            cont.style.setProperty('width', '100%', 'important');
            cont.style.setProperty('margin', '0', 'important');
            cont.style.setProperty('padding', '8px 10px', 'important');
            cont.style.setProperty('box-sizing', 'border-box', 'important');
        }
    },

    // =========================================================================
    // MODAL 1: Selector de Alumnos / Vista General (Imagen 4)
    // =========================================================================
    openGridModal(courseId) {
        const c = this._getCourse(courseId);
        if (!c) {
            UI.toast('Selecciona un curso primero', 'warning');
            return;
        }
        this._multiSelectMode = false;
        this._selectedStudentIds.clear();

        const content = this._getGridHtml(c, true);
        UI.modal(null, content, '', { fullscreen: true });
        if (window.lucide) window.lucide.createIcons();
    },

    _getGridHtml(course, isModal = false) {
        if (!course) course = this._getCourse();
        const students = this._getCourseStudents(course);
        const courseTitle = this._getCourseTitle(course);
        const showInTable = this.isConductShownInTable();
        const activeParcial = this._getActiveParcialObj(course ? course.id : null);
        const pNum = activeParcial.numero || 1;

        return `
        <style>
            #content:has(.conducta-grid-container),
            .gdhn-content:has(.conducta-grid-container) {
                padding: 8px 10px !important;
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
            .conducta-grid-container,
            .conducta-grid-container > div {
                width: 100% !important;
                max-width: 100% !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
                box-sizing: border-box !important;
            }
            #conducta-students-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)) !important;
                gap: 12px !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }
        </style>
        <div class="conducta-grid-container" data-fullscreen="${isModal ? 'true' : 'false'}" style="padding:${isModal ? '12px 14px 80px' : '4px 4px 24px'}; width:100% !important; max-width:100% !important; margin:0 !important; box-sizing:border-box !important; min-height:${isModal ? '100vh' : 'auto'}; background:${isModal ? '#f8fafc' : 'transparent'};">
            <!-- Cabecera Superior Armonizada (Tarjeta flotante con acento Esmeralda, Morado y Rosa discretos) -->
            <div style="background:#ffffff; color:#0f172a; border:1px solid #e2e8f0; border-left:4px solid #10b981; border-radius:${isModal ? '16px' : '18px'}; padding:14px 20px; margin-bottom:14px; box-shadow:0 6px 24px -4px rgba(15,23,42,0.05), 0 2px 6px -1px rgba(15,23,42,0.03); display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; width:100%; box-sizing:border-box;">
                <div style="display:flex; align-items:center; gap:12px;">
                    ${isModal ? `
                    <button type="button" onclick="UI.closeModal()" title="Cerrar modal (Esc)" class="modal-close">✕</button>
                    ` : ''}
                    <div>
                        <div style="display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#059669; background:#ecfdf5; border:1px solid #d1fae5; padding:2px 9px; border-radius:999px; margin-bottom:4px;">
                            <span style="width:6px; height:6px; border-radius:50%; background:#10b981;"></span>
                            Módulo de Personalidad SACE &bull; Parcial ${activeParcial.romano || pNum}
                        </div>
                        <h2 style="font-size:17.5px; font-weight:900; color:#0f172a; margin:0; line-height:1.2; display:flex; align-items:center; gap:10px;">
                            ${this.getStarGavelSvg(24)}
                            <span>Conducta y Personalidad &middot; <span style="color:#475569; font-weight:700;">${courseTitle}</span></span>
                        </h2>
                    </div>
                </div>

                <!-- Atajos directos a Reporte SACE, Parcial, Asistencia y Cuadro -->
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <select onchange="Views.Conducta.changeParcialFilter(this.value, ${isModal})" style="background:#f8fafc; color:#0f172a; border:1px solid #e2e8f0; font-weight:800; font-size:11.5px; border-radius:10px; padding:6px 12px; cursor:pointer; outline:none;">
                        <option value="1" ${pNum === 1 ? 'selected' : ''} style="color:#0f172a;">I Parcial</option>
                        <option value="2" ${pNum === 2 ? 'selected' : ''} style="color:#0f172a;">II Parcial</option>
                        <option value="3" ${pNum === 3 ? 'selected' : ''} style="color:#0f172a;">III Parcial</option>
                        <option value="4" ${pNum === 4 ? 'selected' : ''} style="color:#0f172a;">IV Parcial</option>
                    </select>
                    <button type="button" onclick="Views.Conducta.openSacePersonalityReportModal('${course ? course.id : ''}', ${pNum})" class="btn btn-sm" style="background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; font-weight:800; font-size:11.5px; border-radius:10px; padding:7px 14px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 2px 6px rgba(139,92,246,0.08);">
                        <i data-lucide="file-spreadsheet" style="width:14px; height:14px; color:#8b5cf6;"></i> Reporte Oficial SACE
                    </button>
                    <button type="button" onclick="${isModal ? 'UI.closeModal();' : ''} Views.Reportes.openReportShortcut('reporte_conducta', 'conducta');" class="btn btn-sm" style="background:#fffbeb; color:#b45309; border:1.5px solid #fde68a; font-weight:800; font-size:11.5px; border-radius:10px; padding:7px 14px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; box-shadow:0 1px 3px rgba(217,119,6,0.1);" title="Ver Documento Oficial: Reporte de Conducta (PDF / Imprimir)">
                        <i data-lucide="award" style="width:14px; height:14px; color:#d97706;"></i> Reporte de Conducta
                    </button>
                    <button type="button" onclick="${isModal ? 'UI.closeModal();' : ''} Router.navigate('asistencia');" class="btn btn-sm" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:800; font-size:11.5px; border-radius:10px; padding:7px 14px; display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
                        <i data-lucide="user-check" style="width:14px; height:14px; color:#10b981;"></i> Asistencia
                    </button>
                    <button type="button" onclick="${isModal ? 'UI.closeModal();' : ''} Router.navigate('cuadro');" class="btn btn-sm" style="background:#ffffff; color:#334155; border:1px solid #e2e8f0; font-weight:800; font-size:11.5px; border-radius:10px; padding:7px 14px; display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
                        <i data-lucide="sheet" style="width:14px; height:14px; color:#64748b;"></i> Cuadro de Notas
                    </button>
                </div>
            </div>

            <!-- Fila de Configuración: Interruptor "Mostrar en tabla de notas" + Botón "Seleccionar varios" -->
            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:12px 18px; margin-bottom:16px; box-shadow:0 4px 16px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02); display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; width:100%; box-sizing:border-box;">
                <div style="flex:1; min-width:240px; display:flex; align-items:center; justify-content:space-between; gap:14px;">
                    <div>
                        <div style="font-size:13.5px; font-weight:800; color:#0f172a;">Mostrar la conducta en la tabla de notas</div>
                        <div style="font-size:11.5px; color:#64748b; line-height:1.3; margin-top:2px;">
                            El botón y los contadores junto a cada nombre. Apágalo si proyectas la tabla en clase.
                        </div>
                    </div>
                    <!-- Switch Toggle -->
                    <button type="button" role="switch" aria-checked="${showInTable ? 'true' : 'false'}" onclick="Views.Conducta.toggleConductInTable()" style="position:relative; display:inline-block; width:46px; height:26px; flex-shrink:0; cursor:pointer; border:none; background:transparent; padding:0; outline:none;" title="Activar o desactivar visualización de conducta en la tabla de notas">
                        <input type="checkbox" id="conducta-table-toggle" ${showInTable ? 'checked' : ''} style="opacity:0; width:0; height:0; position:absolute; pointer-events:none;">
                        <span id="conducta-toggle-track" style="position:absolute; cursor:pointer; inset:0; background:${showInTable ? '#10b981' : '#cbd5e1'}; transition:background 0.25s ease; border-radius:26px; display:block;">
                            <span id="conducta-toggle-thumb" style="position:absolute; height:20px; width:20px; left:${showInTable ? '22px' : '3px'}; bottom:3px; background:#fff; transition:left 0.25s cubic-bezier(0.4, 0, 0.2, 1); border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.25); display:block;"></span>
                        </span>
                    </button>
                </div>

                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <button type="button" onclick="Views.Conducta.openSacePersonalityReportModal('${course ? course.id : ''}', ${pNum})" style="background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-weight:800; font-size:12px; border-radius:10px; padding:7px 14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;" title="Ver cuadro de Personalidad SACE por Parcial">
                        <i data-lucide="award" style="width:15px; height:15px; color:#10b981;"></i>
                        <span>Cuadro SACE Personalidad</span>
                    </button>
                    <button type="button" id="conducta-multiselect-btn" onclick="Views.Conducta.toggleMultiSelectMode()" style="background:#ffffff; color:#059669; border:1px solid #a7f3d0; font-weight:800; font-size:12px; border-radius:10px; padding:7px 14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s ease;" onmouseover="this.style.background='#ecfdf5'" onmouseout="this.style.background='#ffffff'">
                        <i data-lucide="check-square" style="width:15px; height:15px; color:#10b981;"></i>
                        <span id="conducta-multiselect-label">Seleccionar varios</span>
                    </button>
                    <button type="button" onclick="Views.Conducta.openTypesEditor()" title="Configurar y editar tipos de conducta" style="background:#fdf2f8; color:#be185d; border:1px solid #fbcfe8; font-weight:800; font-size:12px; border-radius:10px; padding:7px 12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                        <i data-lucide="sliders" style="width:14px; height:14px; color:#ec4899;"></i>
                        <span class="hidden sm:inline">Tipos</span>
                    </button>
                </div>
            </div>

            <!-- Subtítulo e Indicación -->
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; padding:0 4px; width:100%; box-sizing:border-box; flex-wrap:wrap; gap:8px;">
                <div style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.04em;">
                    Toca un alumno para anotar conducta o auditar sus 5 aspectos de Personalidad SACE
                </div>
                <div style="font-size:11.5px; color:#64748b; font-weight:700;">
                    Escala Oficial SACE: <span style="color:#15803d; font-weight:800;">4 Sobresaliente</span> &middot; <span style="color:#0369a1; font-weight:800;">3 Muy Bueno</span> &middot; <span style="color:#b45309; font-weight:800;">2 Bueno</span>
                </div>
            </div>

            <!-- Cuadrícula 100% Pantalla de Alumnos (Sin límites de ancho) -->
            <div id="conducta-students-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:14px; width:100%; box-sizing:border-box;">
                ${students.length === 0 ? `
                    <div style="grid-column:1/-1; text-align:center; padding:30px; background:#fff; border-radius:12px; color:#94a3b8;">
                        No hay estudiantes matriculados en este curso.
                    </div>
                ` : students.map(s => {
                    const isInactive = s.estadoMatricula === 'Desertor' || s.estadoMatricula === 'Traslado' || s.estadoMatricula === 'Inactivo';
                    const sum = isInactive ? { total: 0, balance: 0, positiveCount: 0, negativeCount: 0 } : Store.getConductSummary(course ? course.id : null, s.id);
                    const evalPers = (!isInactive && course) ? this.evaluateStudentPersonality(course.id, s.id, pNum) : null;
                    const initials = (typeof Utils !== 'undefined' && Utils.getInitials) ? Utils.getInitials(s.nombreCompleto) : (s.nombreCompleto || 'SS').substring(0, 2).toUpperCase();
                    const avatarHtml = (typeof StudentAvatars !== 'undefined' && StudentAvatars.getAvatarHtml)
                        ? StudentAvatars.getAvatarHtml(s, 46)
                        : initials;
                    const stBadge = isInactive ? `<span class="badge" style="font-size:9.5px; font-weight:800; background:${s.estadoMatricula === 'Desertor' ? '#fee2e2' : '#fef3c7'}; color:${s.estadoMatricula === 'Desertor' ? '#b91c1c' : '#b45309'}; border:1px solid currentColor; border-radius:6px; padding:1px 6px; margin-bottom:4px; display:inline-block;">${s.estadoMatricula}</span>` : '';

                    return `
                    <div class="conducta-student-card" 
                         data-student-id="${s.id}"
                         onclick="${isInactive ? `UI.toast('El estudiante está en condición de ${s.estadoMatricula || 'Inactivo'}. No acepta registros de conducta o personalidad.', 'warning');` : `Views.Conducta.handleStudentCardClick('${s.id}')`}"
                         style="background:${isInactive ? '#f8fafc' : '#ffffff'}; border:1px solid #e2e8f0; border-radius:16px; padding:16px 12px 14px; text-align:center; cursor:${isInactive ? 'not-allowed' : 'pointer'}; opacity:${isInactive ? '0.65' : '1'}; transition:all 0.22s cubic-bezier(0.16,1,0.3,1); position:relative; display:flex; flex-direction:column; align-items:center; box-shadow:0 4px 16px -2px rgba(15,23,42,0.04), 0 2px 4px -1px rgba(15,23,42,0.02);"
                         onmouseover="${isInactive ? '' : `this.style.borderColor='#a7f3d0'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 24px -4px rgba(16,185,129,0.12), 0 4px 8px -2px rgba(15,23,42,0.04)';`}"
                         onmouseout="${isInactive ? '' : `this.style.borderColor='#e2e8f0'; this.style.transform='none'; this.style.boxShadow='0 4px 16px -2px rgba(15,23,42,0.04), 0 2px 4px -1px rgba(15,23,42,0.02)';`}">
                        
                        <!-- Checkbox para modo multiselección -->
                        <div class="conducta-card-checkbox" style="display:none; position:absolute; top:6px; left:6px; z-index:5;">
                            ${!isInactive ? `<input type="checkbox" data-student-id="${s.id}" onclick="event.stopPropagation(); Views.Conducta.toggleStudentSelection('${s.id}')" style="width:18px; height:18px; cursor:pointer; accent-color:#047857;">` : ''}
                        </div>

                        <!-- Botón directo a desglose SACE en esquina superior derecha -->
                        ${evalPers ? `
                        <button type="button" onclick="event.stopPropagation(); Views.Conducta.openStudentPersonalityAuditModal('${s.id}', '${course.id}', ${pNum})" title="Ver ponderación de Personalidad SACE (${evalPers.avgScore} - ${evalPers.overallShort})" style="position:absolute; top:6px; right:6px; background:${evalPers.overallBg}; color:${evalPers.overallColor}; border:1px solid ${evalPers.overallBorder}; border-radius:999px; font-size:9.5px; font-weight:900; padding:2px 6px; cursor:pointer; line-height:1.1; z-index:4;">
                            ${evalPers.avgScore} &bull; ${evalPers.overallRounded}
                        </button>
                        ` : ''}

                        <!-- Círculo de Avatar -->
                        <div style="width:50px; height:50px; border-radius:50%; background:#ffffff; color:#ffffff; display:grid; place-items:center; font-weight:900; font-size:16px; margin-bottom:8px; box-shadow:0 2px 6px rgba(15,23,42,0.10); flex-shrink:0; overflow:hidden; ${isInactive ? 'filter:grayscale(100%);' : ''}">
                            ${avatarHtml}
                        </div>

                        <!-- Nombre del Estudiante -->
                        <div style="font-size:12.5px; font-weight:800; color:${isInactive ? '#64748b' : '#0f172a'}; ${isInactive ? 'text-decoration:line-through;' : ''} line-height:1.25; max-height:32px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin-bottom:4px; width:100%;">
                            ${s.nombreCompleto || 'Estudiante'}
                        </div>
                        ${stBadge}

                        <!-- Píldora de Calificación SACE Personalidad -->
                        ${evalPers ? `
                        <div style="font-size:9.5px; font-weight:800; background:${evalPers.overallBg}; color:${evalPers.overallColor}; border:1px solid ${evalPers.overallBorder}; border-radius:6px; padding:2px 7px; margin-bottom:6px; letter-spacing:0.02em;">
                            ${evalPers.overallLabel}
                        </div>
                        ` : ''}

                        <!-- Resumen / Indicador de Conducta (Círculos perfectos formales: Verde Positiva con Estrella / Rojo Negativa) -->
                        <div style="margin-top:auto; font-size:11px; font-weight:800; color:#64748b;">
                            ${sum.total > 0 ? `
                                <div style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                                    ${sum.positivasCount > 0 ? `<span style="width:28px; height:28px; min-width:28px; min-height:28px; max-width:28px; max-height:28px; aspect-ratio:1/1; border-radius:50%; background:#dcfce7; color:#15803d; border:1.5px solid #22c55e; font-size:9.5px; font-weight:800; letter-spacing:-0.3px; line-height:1; display:inline-flex; align-items:center; justify-content:center; gap:1px; box-sizing:border-box; box-shadow:0 1px 2px rgba(22,163,74,0.14);" title="${sum.positivasCount} conducta(s) positiva(s)">${this.getFormalStarSvg(9, '#15803d')}<span>+${sum.positivasCount}</span></span>` : ''}
                                    ${sum.incidenciasCount > 0 ? `<span style="width:28px; height:28px; min-width:28px; min-height:28px; max-width:28px; max-height:28px; aspect-ratio:1/1; border-radius:50%; background:#fee2e2; color:#b91c1c; border:1.5px solid #ef4444; font-size:10px; font-weight:800; letter-spacing:-0.3px; line-height:1; display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; box-shadow:0 1px 2px rgba(220,38,38,0.14);" title="${sum.incidenciasCount} incidencia(s) disciplinaria(s)">-${sum.incidenciasCount}</span>` : ''}
                                </div>
                            ` : `<span style="opacity:0.4;">&mdash;</span>`}
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <!-- Barra flotante de acciones para Selección Múltiple -->
            <div id="conducta-batch-bar" style="display:none; position:sticky; bottom:16px; background:#047857; color:#fff; border-radius:14px; padding:10px 18px; margin-top:16px; box-shadow:0 10px 25px rgba(4,120,87,0.3); align-items:center; justify-content:space-between; gap:12px; z-index:20;">
                <div style="font-size:13px; font-weight:800;">
                    <span id="conducta-batch-count">0</span> alumnos seleccionados
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button type="button" onclick="Views.Conducta.selectAllStudents(true)" style="background:rgba(255,255,255,0.2); border:none; color:#fff; font-size:11px; font-weight:800; padding:6px 12px; border-radius:8px; cursor:pointer;">Seleccionar Todos</button>
                    <button type="button" onclick="Views.Conducta.openBatchRecordModal()" style="background:#ffffff; color:#047857; border:none; font-size:12px; font-weight:900; padding:7px 16px; border-radius:8px; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                        Anotar Conducta &rarr;
                    </button>
                </div>
            </div>
        </div>
        `;
    },

    changeParcialFilter(newParcialNum, isModal = false) {
        this._selectedParcialNum = Number(newParcialNum) || 1;
        const c = this._getCourse();
        if (isModal && c) {
            this.openGridModal(c.id);
        } else {
            const cont = document.getElementById('content');
            if (cont && c) {
                cont.innerHTML = this._getGridHtml(c, false);
                if (window.lucide) window.lucide.createIcons();
            }
        }
    },

    toggleMultiSelectMode() {
        this._multiSelectMode = !this._multiSelectMode;
        const btn = document.getElementById('conducta-multiselect-btn');
        const label = document.getElementById('conducta-multiselect-label');
        const boxes = document.querySelectorAll('.conducta-card-checkbox');
        const batchBar = document.getElementById('conducta-batch-bar');

        if (this._multiSelectMode) {
            btn.style.background = '#047857';
            btn.style.color = '#ffffff';
            label.textContent = 'Cancelar selección';
            boxes.forEach(b => b.style.display = 'block');
            batchBar.style.display = 'flex';
        } else {
            btn.style.background = '#ffffff';
            btn.style.color = '#047857';
            label.textContent = 'Seleccionar varios';
            boxes.forEach(b => {
                b.style.display = 'none';
                const chk = b.querySelector('input');
                if (chk) chk.checked = false;
            });
            batchBar.style.display = 'none';
            this._selectedStudentIds.clear();
        }
    },

    toggleStudentSelection(studentId) {
        if (this._selectedStudentIds.has(studentId)) {
            this._selectedStudentIds.delete(studentId);
        } else {
            this._selectedStudentIds.add(studentId);
        }
        this._updateBatchCount();
    },

    selectAllStudents(selectAll) {
        const c = this._getCourse();
        if (!c) return;
        const students = this._getCourseStudents(c);
        const chks = document.querySelectorAll('.conducta-card-checkbox input');

        if (selectAll) {
            students.filter(s => s.estadoMatricula !== 'Traslado' && s.estadoMatricula !== 'Desertor' && s.estadoMatricula !== 'Inactivo').forEach(s => this._selectedStudentIds.add(s.id));
            chks.forEach(chk => chk.checked = true);
        } else {
            this._selectedStudentIds.clear();
            chks.forEach(chk => chk.checked = false);
        }
        this._updateBatchCount();
    },

    _updateBatchCount() {
        const el = document.getElementById('conducta-batch-count');
        if (el) el.textContent = this._selectedStudentIds.size;
    },

    handleStudentCardClick(studentId) {
        const student = this._getStudent(studentId);
        if (student && (student.estadoMatricula === 'Desertor' || student.estadoMatricula === 'Traslado' || student.estadoMatricula === 'Inactivo')) {
            UI.toast(`El estudiante está en condición de ${student.estadoMatricula || 'Inactivo'}. No acepta registros de conducta o personalidad.`, 'warning');
            return;
        }
        if (this._multiSelectMode) {
            this.toggleStudentSelection(studentId);
            const card = document.querySelector(`.conducta-student-card[data-student-id="${studentId}"]`);
            if (card) {
                const chk = card.querySelector('input[type="checkbox"]');
                if (chk) chk.checked = this._selectedStudentIds.has(studentId);
            }
        } else {
            this.openStudentModal(studentId);
        }
    },

    // =========================================================================
    // MODAL 2: Registro de Conducta por Alumno (Imágenes 3 y 5)
    // =========================================================================
    openStudentModal(studentId, defaultDate, defaultTime) {
        const student = this._getStudent(studentId);
        if (!student) {
            UI.toast('Estudiante no encontrado', 'error');
            return;
        }

        const course = this._getCourse();
        this._currentStudentId = student.id;
        this._selectedType = null;

        // Fecha y hora actual
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        this._selectedDate = defaultDate || todayStr;
        this._selectedTime = defaultTime || timeStr;

        this._renderStudentModalContent(student, course);
    },

    _renderStudentModalContent(student, course) {
        const types = Store.getConductTypes();
        const dateRecords = Store.getConductRecords(course ? course.id : null, student.id, this._selectedDate);
        const evalPers = course ? this.evaluateStudentPersonality(course.id, student.id) : null;

        // Formato amigable de fecha: "Hoy, 22/10/26" o "22/10/26"
        const now = new Date();
        const nowYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = this._selectedDate === nowYMD;
        const [y, m, d] = (this._selectedDate || nowYMD).split('-');
        const dateFriendly = `${isToday ? 'Hoy, ' : ''}${d}/${m}/${y.substring(2)}`;

        const isPositiva = this._activeTab === 'positiva';
        const courseTitle = this._getCourseTitle(course);
        const initials = (typeof Utils !== 'undefined' && Utils.getInitials) ? Utils.getInitials(student.nombreCompleto) : (student.nombreCompleto || 'SS').substring(0, 2).toUpperCase();
        const avatarHtml = (typeof StudentAvatars !== 'undefined' && StudentAvatars.getAvatarHtml)
            ? StudentAvatars.getAvatarHtml(student, 30)
            : initials;

        const content = `
        <div class="conducta-student-modal-fullscreen" data-fullscreen="true" style="display:flex; flex-direction:column; height:100vh; max-height:100vh; width:100%; max-width:100%; box-sizing:border-box; overflow-x:hidden; background:#f8fafc; color:#0f172a; overflow:hidden;">
            <!-- BARRA SUPERIOR STICKY ULTRA COMPACTA (RESPONSIVE PC/TABLET/MÓVIL) -->
            <header class="conducta-modal-header" style="background:#ffffff; border-bottom:1.5px solid #e2e8f0; padding:6px 14px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-shrink:0; box-shadow:0 1px 3px rgba(0,0,0,0.03); z-index:10;">
                <div class="conducta-modal-header-left" style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                    <button type="button" onclick="UI.closeModal()" title="Volver" class="btn btn-sm btn-conducta-back" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; font-weight:800; font-size:11px; border-radius:7px; padding:4px 10px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; flex-shrink:0; transition:all 0.15s ease;">
                        <i data-lucide="arrow-left" style="width:13px; height:13px;"></i>
                        <span>Volver</span>
                    </button>
                    <div style="width:30px; height:30px; border-radius:50%; overflow:hidden; flex-shrink:0; display:grid; place-items:center; background:#ffffff; color:#fff; font-weight:900; font-size:12px; box-shadow:0 1px 3px rgba(15,23,42,0.10);">
                        ${avatarHtml}
                    </div>
                    <div style="min-width:0; flex:1;">
                        <div style="font-size:9.5px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.04em; line-height:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            Personalidad SACE &bull; ${courseTitle}
                        </div>
                        <h2 style="font-size:13.5px; font-weight:900; color:#0f172a; margin:0; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${student.nombreCompleto}
                        </h2>
                    </div>
                    <button type="button" onclick="UI.closeModal()" title="Cerrar modal" class="conducta-close-mobile" style="display:none; background:#fee2e2; border:none; width:26px; height:26px; border-radius:50%; align-items:center; justify-content:center; cursor:pointer; color:#b91c1c; font-weight:900; font-size:15px; line-height:1; flex-shrink:0;">
                        &times;
                    </button>
                </div>

                <!-- Selector de Fecha, Hora y Auditoría SACE en Header -->
                <div class="conducta-modal-header-right" style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    ${evalPers ? `
                    <button type="button" onclick="Views.Conducta.openStudentPersonalityAuditModal('${student.id}', '${course.id}', ${evalPers.parcialNum})" class="conducta-eval-btn" style="background:${evalPers.overallBg}; color:${evalPers.overallColor}; border:1.5px solid ${evalPers.overallBorder}; border-radius:7px; padding:3px 8px; font-size:10.5px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;">
                        <i data-lucide="award" style="width:12px; height:12px;"></i>
                        <span>Personalidad (${evalPers.parcialRomano}): ${evalPers.avgScore} &middot; ${evalPers.overallLabel}</span>
                    </button>
                    ` : ''}
                    <div class="conducta-date-time-row" style="display:inline-flex; align-items:center; gap:6px;">
                        <div class="conducta-date-box" style="display:inline-flex; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; border-radius:7px; padding:3px 6px; gap:4px; font-size:10.5px; font-weight:800; color:#334155; flex-shrink:0;">
                            <i data-lucide="calendar" style="width:12px; height:12px; color:#059669;"></i>
                            <input type="date" value="${this._selectedDate}" onchange="Views.Conducta._onDateChange('${student.id}', this.value)" style="border:none; background:transparent; font-size:10.5px; font-weight:800; color:#334155; outline:none; cursor:pointer;">
                        </div>
                        <div class="conducta-time-box" style="display:inline-flex; align-items:center; background:#f8fafc; border:1px solid #cbd5e1; border-radius:7px; padding:3px 6px; gap:4px; font-size:10.5px; font-weight:800; color:#334155; flex-shrink:0;">
                            <i data-lucide="clock" style="width:12px; height:12px; color:#0284c7;"></i>
                            <input type="time" value="${this._selectedTime}" onchange="Views.Conducta._selectedTime = this.value" style="border:none; background:transparent; font-size:10.5px; font-weight:800; color:#334155; outline:none; cursor:pointer;">
                        </div>
                    </div>
                    <button type="button" onclick="UI.closeModal()" title="Cerrar modal" class="conducta-close-desktop" style="background:#fee2e2; border:none; width:26px; height:26px; border-radius:50%; display:grid; place-items:center; cursor:pointer; color:#b91c1c; font-weight:900; font-size:15px; line-height:1; flex-shrink:0; transition:all 0.15s ease;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#fee2e2'">
                        &times;
                    </button>
                </div>
            </header>

            <!-- CUERPO PRINCIPAL ADAPTADO AL 100% PARA EVITAR SCROLL INNECESARIO -->
            <div style="flex:1 1 auto; overflow-y:auto; overflow-x:hidden; padding:6px 10px; width:100% !important; max-width:100% !important; margin:0 !important; box-sizing:border-box !important; -webkit-overflow-scrolling:touch;">
                
                <!-- BARRA EJECUTIVA DE LOS 5 ASPECTOS DE LA PERSONALIDAD SACE (COMPACTA) -->
                ${evalPers ? `
                <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:4px 10px; margin-bottom:5px; box-shadow:0 1px 2px rgba(15,23,42,0.02);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:3px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:5px;">
                            <span style="font-size:9.5px; font-weight:900; color:#0f172a; text-transform:uppercase; letter-spacing:0.04em;">
                                Evaluación SACE &bull; Parcial ${evalPers.parcialRomano}
                            </span>
                            <span style="font-size:9px; color:#64748b; font-weight:600;">
                                (Asistencia, Tareas, Calidad de Trabajos y Constancia)
                            </span>
                        </div>
                        <button type="button" onclick="Views.Conducta.openStudentPersonalityAuditModal('${student.id}', '${course.id}', ${evalPers.parcialNum})" style="background:#0f172a; color:#ffffff; border:none; border-radius:5px; padding:2px 7px; font-size:9.5px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:3px;">
                            <i data-lucide="sliders" style="width:10px; height:10px;"></i> Ver Desglose / Ajustar Nota
                        </button>
                    </div>
                    <div class="conducta-sace-aspects-grid" style="display:grid; grid-template-columns:repeat(5, 1fr); gap:5px;">
                        ${this.SACE_ASPECTOS.map(asp => {
                            const item = evalPers.aspects[asp.key];
                            return `
                            <div onclick="Views.Conducta.openStudentPersonalityAuditModal('${student.id}', '${course.id}', ${evalPers.parcialNum})" style="background:${item.bg}; border:1px solid ${item.border}; border-radius:6px; padding:3px 6px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:4px;">
                                <div style="min-width:0;">
                                    <div style="font-size:8.5px; font-weight:900; color:#334155; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${asp.shortLabel}</div>
                                    <div style="font-size:9.5px; font-weight:900; color:${item.color};">${item.score} &middot; ${item.label}</div>
                                    <div style="font-size:7.5px; color:#475569; font-weight:600;">Base: ${item.rawScore} | +${item.posCount}/-${item.incCount}</div>
                                </div>
                                <div style="width:20px; height:20px; border-radius:5px; background:#ffffff; color:${item.color}; border:1px solid ${item.border}; display:grid; place-items:center; font-size:10.5px; font-weight:900; flex-shrink:0;">
                                    ${item.score}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Banner de Historial de Hoy + Pestañas combinadas en una sola franja compacta -->
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:5px; flex-wrap:wrap;">
                    <!-- Pestañas de Segmento: Positiva / Incidencia -->
                    <div style="display:inline-flex; gap:6px; flex:1; min-width:0;">
                        <button type="button" 
                                onclick="Views.Conducta._switchTab('${student.id}', 'positiva')"
                                style="flex:1; padding:5px 10px; border-radius:8px; font-size:11.5px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s;
                                       ${isPositiva ? 'background:#f0fdf4; color:#15803d; border:1.5px solid #22c55e; box-shadow:0 1px 4px rgba(34,197,94,0.15);' : 'background:#ffffff; color:#64748b; border:1px solid #cbd5e1;'}">
                            <span style="display:inline-flex; align-items:center;">${this.getPositiveIconSvg(14)}</span>
                            <span>Conductas Positivas</span>
                            <span style="background:${isPositiva ? '#16a34a' : '#e2e8f0'}; color:${isPositiva ? '#ffffff' : '#475569'}; font-size:9.5px; font-weight:800; border-radius:6px; padding:1px 5px;">${types.positivas.length}</span>
                        </button>

                        <button type="button" 
                                onclick="Views.Conducta._switchTab('${student.id}', 'incidencia')"
                                style="flex:1; padding:5px 10px; border-radius:8px; font-size:11.5px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s;
                                       ${!isPositiva ? 'background:#fef2f2; color:#b91c1c; border:1.5px solid #ef4444; box-shadow:0 1px 4px rgba(239,68,68,0.15);' : 'background:#ffffff; color:#64748b; border:1px solid #cbd5e1;'}">
                            <span style="display:inline-flex; align-items:center;">${this.getJudgeGavelImg(15)}</span>
                            <span>Incidencias Disciplinarias</span>
                            <span style="background:${!isPositiva ? '#dc2626' : '#e2e8f0'}; color:${!isPositiva ? '#ffffff' : '#475569'}; font-size:9.5px; font-weight:800; border-radius:6px; padding:1px 5px;">${types.incidencias.length}</span>
                        </button>
                    </div>

                    <!-- Banner de Historial de Hoy -->
                    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:3px 10px; min-height:26px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
                        ${dateRecords.length === 0 ? `
                            <span style="display:inline-flex; align-items:center; gap:4px; color:#059669; font-size:10.5px; font-weight:800;">
                                <i data-lucide="check-circle" style="width:12px; height:12px; color:#10b981;"></i>
                                <span>Nada registrado para ${dateFriendly}</span>
                            </span>
                        ` : `
                            <span style="font-size:9.5px; font-weight:800; color:#64748b; text-transform:uppercase;">Hoy (${dateFriendly}):</span>
                            ${dateRecords.map(r => `
                                <span style="background:${r.tipo === 'positiva' ? '#dcfce7' : '#fee2e2'}; color:${r.tipo === 'positiva' ? '#15803d' : '#b91c1c'}; border:1px solid ${r.tipo === 'positiva' ? '#86efac' : '#fca5a5'}; padding:1px 6px; border-radius:999px; font-size:9.5px; font-weight:800; display:inline-flex; align-items:center; gap:3px;">
                                    ${r.nombre}
                                    <button type="button" onclick="Views.Conducta._deleteRecord('${r.id}', '${student.id}')" title="Eliminar registro" style="background:none; border:none; cursor:pointer; color:inherit; padding:0; line-height:1; font-size:12px; font-weight:900;">&times;</button>
                                </span>
                            `).join('')}
                        `}
                    </div>
                </div>

                <!-- Cuadrícula Compacta de Opciones (Permite ver filas completas sin scroll) -->
                <div id="conducta-options-container" style="margin-bottom:5px;">
                    ${isPositiva ? this._renderPositivasCards(types.positivas) : this._renderIncidenciasCards(types.incidencias)}
                </div>

                <!-- Campo Comentario (Compacto) -->
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:7px; padding:4px 10px; margin-bottom:4px; box-shadow:0 1px 2px rgba(0,0,0,0.02); display:flex; align-items:center; gap:8px;">
                    <label style="font-size:10px; font-weight:800; color:#475569; white-space:nowrap;">
                        Comentario (opcional):
                    </label>
                    <input type="text" 
                           id="conducta-comentario-input" 
                           placeholder="Describe detalles, notificaciones al padre, acuerdos..." 
                           style="flex:1; border:1px solid #cbd5e1; border-radius:5px; padding:3px 8px; font-size:11px; font-family:inherit; outline:none; transition:border-color 0.15s;"
                           onfocus="this.style.borderColor='#059669'"
                           onblur="this.style.borderColor='#cbd5e1'">
                </div>
            </div>

            <!-- BARRA INFERIOR STICKY (Acciones compactas siempre a la vista) -->
            <footer style="background:#ffffff; border-top:1.5px solid #e2e8f0; padding:6px 14px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-shrink:0; box-shadow:0 -1px 4px rgba(0,0,0,0.03); z-index:10; flex-wrap:wrap;">
                <button type="button" onclick="Views.Conducta.openTypesEditor()" style="background:none; border:none; color:#047857; font-size:11px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:4px; padding:2px 0;">
                    <i data-lucide="sliders" style="width:13px; height:13px;"></i>
                    <span>Configurar tipos de conducta y aspectos SACE</span>
                </button>

                <div style="display:flex; align-items:center; gap:8px;">
                    <button type="button" onclick="UI.closeModal()" class="btn" style="background:#f1f5f9; color:#475569; border:none; font-weight:800; font-size:11px; padding:6px 16px; border-radius:7px; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                        CANCELAR
                    </button>
                    <button type="button" onclick="Views.Conducta._saveRecord('${student.id}')" class="btn btn-primary" style="background:linear-gradient(135deg, #059669 0%, #047857 100%); color:#ffffff; border:none; font-weight:900; font-size:11px; padding:6px 20px; border-radius:7px; cursor:pointer; box-shadow:0 2px 6px rgba(5,150,105,0.25); transition:transform 0.12s, box-shadow 0.12s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 10px rgba(5,150,105,0.35)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 2px 6px rgba(5,150,105,0.25)';">
                        GUARDAR ANOTACIÓN
                    </button>
                </div>
            </footer>
        </div>
        `;

        UI.modal(null, content, '', { fullscreen: true });
        if (window.lucide) window.lucide.createIcons();
    },

    _switchTab(studentId, tabName) {
        this._activeTab = tabName;
        this._selectedType = null;
        const student = this._getStudent(studentId);
        const course = this._getCourse();
        if (student) this._renderStudentModalContent(student, course);
    },

    _onDateChange(studentId, newDate) {
        this._selectedDate = newDate;
        const student = this._getStudent(studentId);
        const course = this._getCourse();
        if (student) this._renderStudentModalContent(student, course);
    },

    // Renderizado de las tarjetas de conductas positivas con sus aspectos de personalidad SACE
    _renderPositivasCards(items) {
        return `
        <div class="conducta-cards-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:6px;">
            ${items.map(item => {
                const isSelected = this._selectedType && this._selectedType.id === item.id;
                return `
                <div class="conducta-type-card ${isSelected ? 'is-selected' : ''}"
                     onclick="Views.Conducta._selectType('${item.id}', 'positiva')"
                     style="background:#ffffff; border:${isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0'}; border-radius:9px; padding:6px 6px; text-align:center; cursor:pointer; transition:all 0.15s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; align-items:center; position:relative; box-shadow:${isSelected ? '0 4px 12px rgba(22,163,74,0.18)' : '0 1px 3px rgba(0,0,0,0.02)'}; min-height:56px; justify-content:center;"
                     onmouseover="if(!this.classList.contains('is-selected')){ this.style.borderColor='#86efac'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.05)'; }"
                     onmouseout="if(!this.classList.contains('is-selected')){ this.style.borderColor='#e2e8f0'; this.style.transform='none'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)'; }">
                    
                    ${isSelected ? `<div style="position:absolute; top:3px; right:3px; width:16px; height:16px; border-radius:50%; background:#16a34a; color:#fff; display:grid; place-items:center; font-size:10px; font-weight:900;">✓</div>` : ''}

                    <div style="width:24px; height:24px; border-radius:50%; background:#dcfce7; color:#15803d; display:grid; place-items:center; margin-bottom:2px; flex-shrink:0;">
                        <i data-lucide="${item.icono || 'check'}" style="width:13px; height:13px; stroke-width:2.2;"></i>
                    </div>
                    <div style="font-size:11px; font-weight:800; color:#0f172a; line-height:1.15; text-align:center; margin-bottom:2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                        ${item.nombre}
                    </div>
                    ${this.renderAspectPillsHtml(item.aspectos, true)}
                </div>`;
            }).join('')}
        </div>`;
    },

    // Renderizado de las incidencias agrupadas por Leve, Grave y Muy Grave con sus aspectos SACE
    _renderIncidenciasCards(items) {
        const leves = items.filter(i => i.categoria === 'leve');
        const graves = items.filter(i => i.categoria === 'grave');
        const muyGraves = items.filter(i => i.categoria === 'muy_grave');

        const renderGroup = (title, iconPrefix, list, colorHex, bgHex, borderHex) => {
            if (list.length === 0) return '';
            return `
            <div style="background:#ffffff; border:1px solid ${borderHex}; border-radius:10px; padding:8px 12px 10px; margin-bottom:8px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                <div style="font-size:10.5px; font-weight:900; color:${colorHex}; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:12px;">${iconPrefix}</span>
                    <span>${title}</span>
                    <span style="background:${bgHex}; color:${colorHex}; font-size:9.5px; font-weight:900; border-radius:999px; padding:1px 6px; margin-left:auto;">${list.length}</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:6px;">
                    ${list.map(item => {
                        const isSelected = this._selectedType && this._selectedType.id === item.id;
                        return `
                        <div class="conducta-type-card ${isSelected ? 'is-selected' : ''}"
                             onclick="Views.Conducta._selectType('${item.id}', 'incidencia')"
                             style="background:#ffffff; border:${isSelected ? '2px solid #dc2626' : '1px solid #e2e8f0'}; border-radius:9px; padding:6px 6px; text-align:center; cursor:pointer; transition:all 0.15s cubic-bezier(0.4,0,0.2,1); display:flex; flex-direction:column; align-items:center; position:relative; box-shadow:${isSelected ? '0 4px 12px rgba(220,38,38,0.18)' : '0 1px 3px rgba(0,0,0,0.02)'}; min-height:56px; justify-content:center;"
                             onmouseover="if(!this.classList.contains('is-selected')){ this.style.borderColor='#fca5a5'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 3px 8px rgba(0,0,0,0.05)'; }"
                             onmouseout="if(!this.classList.contains('is-selected')){ this.style.borderColor='#e2e8f0'; this.style.transform='none'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.02)'; }">
                            
                            ${isSelected ? `<div style="position:absolute; top:3px; right:3px; width:16px; height:16px; border-radius:50%; background:#dc2626; color:#fff; display:grid; place-items:center; font-size:10px; font-weight:900;">✓</div>` : ''}

                            <div style="width:24px; height:24px; border-radius:50%; background:#fee2e2; color:#b91c1c; display:grid; place-items:center; margin-bottom:2px; flex-shrink:0;">
                                <i data-lucide="${item.icono || 'alert-triangle'}" style="width:13px; height:13px; stroke-width:2.2;"></i>
                            </div>
                            <div style="font-size:11px; font-weight:800; color:#0f172a; line-height:1.15; text-align:center; margin-bottom:2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                                ${item.nombre}
                            </div>
                            ${this.renderAspectPillsHtml(item.aspectos, true)}
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        };

        return `
            ${renderGroup('LEVE · Olvidos y conductas que no impiden la clase', this.getSeverityIndicatorSvg(1), leves, '#b91c1c', '#fee2e2', '#fecaca')}
            ${renderGroup('GRAVE · Interrumpe la clase o falta al respeto', this.getSeverityIndicatorSvg(2), graves, '#991b1b', '#fee2e2', '#fca5a5')}
            ${renderGroup('MUY GRAVE · Agresiones, daños o situaciones serias', this.getSeverityIndicatorSvg(3), muyGraves, '#7f1d1d', '#fee2e2', '#f87171')}
        `;
    },

    _selectType(typeId, category) {
        const types = Store.getConductTypes();
        const list = category === 'positiva' ? types.positivas : types.incidencias;
        this._selectedType = list.find(t => t.id === typeId) || null;

        // Actualizar visualmente la selección sin re-renderizar todo
        const cards = document.querySelectorAll('.conducta-type-card');
        cards.forEach(card => {
            card.classList.remove('is-selected');
            card.style.borderColor = '#e2e8f0';
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
            const check = card.querySelector('div[style*="border-radius:50%"][style*="right:5px"], div[style*="border-radius:50%"][style*="right:8px"], div[style*="border-radius:50%"][style*="right:3px"]');
            if (check) check.remove();
        });

        // Buscar la tarjeta seleccionada y marcarla
        const activeCard = Array.from(cards).find(c => c.getAttribute('onclick') && c.getAttribute('onclick').includes(`'${typeId}'`));
        if (activeCard) {
            activeCard.classList.add('is-selected');
            const isPos = category === 'positiva';
            activeCard.style.borderColor = isPos ? '#16a34a' : '#dc2626';
            activeCard.style.boxShadow = isPos ? '0 4px 12px rgba(22,163,74,0.18)' : '0 4px 12px rgba(220,38,38,0.18)';
            const checkDiv = document.createElement('div');
            checkDiv.style.cssText = `position:absolute; top:3px; right:3px; width:16px; height:16px; border-radius:50%; background:${isPos ? '#16a34a' : '#dc2626'}; color:#fff; display:grid; place-items:center; font-size:10px; font-weight:900;`;
            checkDiv.textContent = '✓';
            activeCard.appendChild(checkDiv);
        }
    },

    _saveRecord(studentId) {
        if (!this._selectedType) {
            UI.toast('Por favor selecciona un tipo de conducta', 'warning');
            return;
        }

        const course = this._getCourse();
        const comentarioInput = document.getElementById('conducta-comentario-input');
        const comentario = comentarioInput ? comentarioInput.value.trim() : '';

        const record = {
            cursoId: course ? course.id : null,
            estudianteId: studentId,
            fecha: this._selectedDate,
            hora: this._selectedTime,
            tipo: this._selectedType.categoria, // 'positiva' | 'leve' | 'grave' | 'muy_grave'
            tipoId: this._selectedType.id,
            nombre: this._selectedType.nombre,
            icono: this._selectedType.icono,
            puntos: this._selectedType.puntos || (this._selectedType.categoria === 'positiva' ? 1 : -1),
            aspectos: Array.isArray(this._selectedType.aspectos) ? [...this._selectedType.aspectos] : ['espiritu_trabajo'],
            comentario: comentario
        };

        Store.saveConductRecord(record);

        if (typeof UI !== 'undefined' && UI.playSound) {
            UI.playSound(record.tipo === 'positiva' ? 'success' : 'warning');
        }

        UI.toast(record.tipo === 'positiva' ? 'Conducta positiva registrada y ponderada' : 'Incidencia disciplinaria registrada y ponderada', 'success');

        // Refrescar el modal del estudiante para ver la nueva anotación y ponderación SACE en tiempo real
        const student = this._getStudent(studentId);
        this._selectedType = null;
        if (student) this._renderStudentModalContent(student, course);

        // Si el Cuadro Controlador está abierto en el fondo, refrescar badges
        const tableWrap = document.querySelector('.cuadro-scroll-outer');
        if (tableWrap) {
            const btn = tableWrap.querySelector(`.cuadro-conducta-row-btn[data-student-id="${studentId}"]`);
            if (btn) btn.innerHTML = this.getStudentConductBadgeHtml(studentId, course ? course.id : null);
        }
    },

    _deleteRecord(recordId, studentId) {
        Store.deleteConductRecord(recordId);
        UI.toast('Anotación eliminada', 'info');
        const student = this._getStudent(studentId);
        const course = this._getCourse();
        if (student) this._renderStudentModalContent(student, course);
    },

    // =========================================================================
    // MODAL 3: Editor de Tipos de Conducta y Relación con Aspectos SACE
    // =========================================================================
    openTypesEditor() {
        const types = Store.getConductTypes();
        const isPositivas = this._editorActiveTab === 'positivas';

        const content = `
        <div class="conducta-types-editor-fullscreen" data-fullscreen="true" style="display:flex; flex-direction:column; height:100vh; max-height:100vh; width:100%; max-width:100%; box-sizing:border-box; overflow-x:hidden; background:#f8fafc; color:#0f172a; overflow:hidden;">
            <!-- Header Sticky -->
            <header style="background:#ffffff; border-bottom:1.5px solid #e2e8f0; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.03); z-index:10; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <button type="button" onclick="UI.closeModal()" title="Volver" class="btn btn-sm" style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; font-weight:800; font-size:12.5px; border-radius:10px; padding:7px 14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="arrow-left" style="width:16px; height:16px;"></i>
                        <span>Volver</span>
                    </button>
                    <div>
                        <h3 style="font-size:18px; font-weight:900; color:#0f172a; margin:0 0 2px 0;">Catálogo de Conductas y Relación con Personalidad SACE</h3>
                        <p style="font-size:12px; color:#64748b; margin:0;">
                            Configura los comportamientos, su severidad y qué aspectos observables de la personalidad (Puntualidad, Espíritu de Trabajo, Orden, Sociabilidad, Moralidad) impactan.
                        </p>
                    </div>
                </div>
                <button type="button" onclick="UI.closeModal()" style="background:#fee2e2; border:none; width:34px; height:34px; border-radius:50%; display:grid; place-items:center; cursor:pointer; color:#b91c1c; font-weight:900; font-size:17px; line-height:1;">
                    &times;
                </button>
            </header>

            <!-- Body Scrollable 100% Ancho sin restricción -->
            <div style="flex:1 1 auto; overflow-y:auto; padding:20px 24px; width:100% !important; max-width:100% !important; margin:0 !important; box-sizing:border-box !important;">
                <!-- Segmented Tabs -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px;">
                    <button type="button" 
                            onclick="Views.Conducta._switchEditorTab('positivas')"
                            style="padding:12px 16px; border-radius:12px; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.15s;
                                   ${isPositivas ? 'background:#f0fdf4; color:#15803d; border:2.5px solid #22c55e;' : 'background:#ffffff; color:#64748b; border:1.5px solid #cbd5e1;'}">
                        <span style="display:inline-flex; align-items:center; gap:6px;">${this.getPositiveIconSvg(18)} Conductas Positivas &middot; ${types.positivas.length}</span>
                    </button>
                    <button type="button" 
                            onclick="Views.Conducta._switchEditorTab('incidencias')"
                            style="padding:12px 16px; border-radius:12px; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.15s;
                                   ${!isPositivas ? 'background:#fef2f2; color:#b91c1c; border:2.5px solid #ef4444;' : 'background:#ffffff; color:#64748b; border:1.5px solid #cbd5e1;'}">
                        <span style="display:inline-flex; align-items:center; gap:6px;">${this.getJudgeGavelImg(22)} Incidencias Disciplinarias &middot; ${types.incidencias.length}</span>
                    </button>
                </div>

                <!-- Lista de items -->
                <div style="margin-bottom:24px;">
                    ${isPositivas ? this._renderTypesList(types.positivas, 'positiva') : this._renderTypesIncidenciasList(types.incidencias)}
                </div>
            </div>

            <!-- Footer Sticky -->
            <footer style="background:#ffffff; border-top:1.5px solid #e2e8f0; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-shrink:0; box-shadow:0 -2px 10px rgba(0,0,0,0.04); z-index:10; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:16px;">
                    <button type="button" onclick="Views.Conducta._promptNewType()" style="background:#047857; color:#fff; border:none; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:10px; box-shadow:0 2px 6px rgba(4,120,87,0.25);">
                        <i data-lucide="plus-circle" style="width:16px; height:16px;"></i>
                        <span>Nuevo tipo</span>
                    </button>
                    <button type="button" onclick="Views.Conducta._confirmRestoreDefaults()" style="background:none; border:none; color:#64748b; font-size:12.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; padding:6px 0;">
                        <i data-lucide="rotate-ccw" style="width:15px; height:15px;"></i>
                        <span>Restaurar catálogo SACE por defecto</span>
                    </button>
                </div>

                <button type="button" onclick="UI.closeModal()" class="btn btn-primary" style="background:#047857; color:#fff; border:none; font-weight:900; font-size:13px; padding:10px 24px; border-radius:10px; cursor:pointer;">
                    ACEPTAR
                </button>
            </footer>
        </div>`;

        UI.modal(null, content, '', { fullscreen: true });
        if (window.lucide) window.lucide.createIcons();
    },

    _switchEditorTab(tab) {
        this._editorActiveTab = tab;
        this.openTypesEditor();
    },

    _renderTypesList(items, category) {
        return items.map(item => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 12px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:6px; gap:10px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                    <div style="width:30px; height:30px; border-radius:50%; background:#dcfce7; color:#15803d; display:grid; place-items:center; flex-shrink:0;">
                        <i data-lucide="${item.icono || 'check'}" style="width:15px; height:15px;"></i>
                    </div>
                    <div style="min-width:0;">
                        <div style="font-size:12.5px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.nombre}</div>
                        <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; margin-top:3px;">
                            ${(item.aspectos || ['espiritu_trabajo']).map(k => {
                                const m = this.getAspectMeta(k);
                                return `<span style="background:${m.bg}; color:${m.color}; border:1px solid ${m.border}; font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:999px;">${m.shortLabel}</span>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div style="display:inline-flex; align-items:center; gap:4px; flex-shrink:0;">
                    <button type="button" onclick="Views.Conducta._promptEditType('${item.id}', '${category}')" style="background:none; border:none; color:#64748b; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center;" title="Editar nombre y aspectos SACE">
                        <i data-lucide="edit-2" style="width:14px; height:14px;"></i>
                    </button>
                    <button type="button" onclick="Views.Conducta._deleteType('${item.id}', '${category}')" style="background:none; border:none; color:#ef4444; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center;" title="Eliminar">
                        <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    _renderTypesIncidenciasList(items) {
        const leves = items.filter(i => i.categoria === 'leve');
        const graves = items.filter(i => i.categoria === 'grave');
        const muyGraves = items.filter(i => i.categoria === 'muy_grave');

        const renderSection = (title, iconPrefix, list) => {
            if (list.length === 0) return '';
            return `
            <div style="margin-bottom:12px;">
                <div style="font-size:10.5px; font-weight:900; color:#991b1b; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; display:flex; align-items:center; gap:5px;">
                    <span>${iconPrefix}</span>
                    <span>${title}</span>
                </div>
                ${list.map(item => `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 12px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:6px; gap:10px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                            <div style="width:30px; height:30px; border-radius:50%; background:#fee2e2; color:#b91c1c; display:grid; place-items:center; flex-shrink:0;">
                                <i data-lucide="${item.icono || 'alert-triangle'}" style="width:15px; height:15px;"></i>
                            </div>
                            <div style="min-width:0;">
                                <div style="font-size:12.5px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.nombre}</div>
                                <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; margin-top:3px;">
                                    ${(item.aspectos || ['moralidad']).map(k => {
                                        const m = this.getAspectMeta(k);
                                        return `<span style="background:${m.bg}; color:${m.color}; border:1px solid ${m.border}; font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:999px;">${m.shortLabel}</span>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                        <div style="display:inline-flex; align-items:center; gap:4px; flex-shrink:0;">
                            <button type="button" onclick="Views.Conducta._promptEditType('${item.id}', 'incidencia')" style="background:none; border:none; color:#64748b; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center;" title="Editar nombre y aspectos SACE">
                                <i data-lucide="edit-2" style="width:14px; height:14px;"></i>
                            </button>
                            <button type="button" onclick="Views.Conducta._deleteType('${item.id}', 'incidencia')" style="background:none; border:none; color:#ef4444; cursor:pointer; width:28px; height:28px; border-radius:6px; display:grid; place-items:center;" title="Eliminar">
                                <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        };

        return `
            ${renderSection('LEVE · Olvidos y conductas que no impiden la clase', this.getSeverityIndicatorSvg(1), leves)}
            ${renderSection('GRAVE · Interrumpe la clase o falta al respeto', this.getSeverityIndicatorSvg(2), graves)}
            ${renderSection('MUY GRAVE · Agresiones, daños o situaciones serias', this.getSeverityIndicatorSvg(3), muyGraves)}
        `;
    },

    _promptNewType(editItem = null, editCategory = null) {
        const isPos = editCategory ? (editCategory === 'positiva') : (this._editorActiveTab === 'positivas');
        const selectedAspects = new Set(editItem && Array.isArray(editItem.aspectos) ? editItem.aspectos : [isPos ? 'espiritu_trabajo' : 'moralidad']);

        let html = `
        <div style="padding:10px 4px;">
            <h4 style="font-size:16px; font-weight:800; margin-bottom:12px;">${editItem ? 'Editar' : 'Nuevo'} tipo de conducta (${isPos ? 'Positiva' : 'Incidencia'})</h4>
            <div style="margin-bottom:12px;">
                <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">Nombre del comportamiento</label>
                <input type="text" id="new-type-nombre" value="${editItem ? editItem.nombre.replace(/"/g, '&quot;') : ''}" placeholder="Ej: Participa activamente en clase" style="width:100%; padding:8px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13px; box-sizing:border-box;">
            </div>
            ${!isPos ? `
            <div style="margin-bottom:14px;">
                <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:4px;">Severidad de la incidencia</label>
                <select id="new-type-severidad" style="width:100%; padding:8px 12px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13px; box-sizing:border-box;">
                    <option value="leve" ${editItem && editItem.categoria === 'leve' ? 'selected' : ''}>[Nivel 1] LEVE (Olvidos)</option>
                    <option value="grave" ${(!editItem || editItem.categoria === 'grave') ? 'selected' : ''}>[Nivel 2] GRAVE (Interrupción / Falta de respeto)</option>
                    <option value="muy_grave" ${editItem && editItem.categoria === 'muy_grave' ? 'selected' : ''}>[Nivel 3] MUY GRAVE (Agresiones / Daños)</option>
                </select>
            </div>
            ` : ''}
            <div style="margin-bottom:14px;">
                <label style="display:block; font-size:11px; font-weight:800; color:#475569; margin-bottom:6px;">Aspectos de la Personalidad SACE con los que se relaciona</label>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                    ${this.SACE_ASPECTOS.map(a => `
                        <label style="display:flex; align-items:center; gap:6px; padding:7px 10px; background:${a.bg}; border:1px solid ${a.border}; border-radius:8px; font-size:11.5px; font-weight:800; color:${a.color}; cursor:pointer;">
                            <input type="checkbox" class="new-type-aspect-chk" value="${a.key}" ${selectedAspects.has(a.key) ? 'checked' : ''} style="accent-color:${a.color}; width:15px; height:15px;">
                            <span>${a.shortLabel}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="Views.Conducta.openTypesEditor()">Volver</button>
                <button type="button" class="btn btn-sm btn-primary" onclick="Views.Conducta._saveNewTypeSubmit('${isPos ? 'positiva' : 'incidencia'}', '${editItem ? editItem.id : ''}')">${editItem ? 'Guardar Cambios' : 'Crear Tipo'}</button>
            </div>
        </div>`;
        UI.modal(editItem ? 'Editar Tipo de Conducta' : 'Nuevo Tipo de Conducta', html);
    },

    _saveNewTypeSubmit(category, existingId = '') {
        const nameInput = document.getElementById('new-type-nombre');
        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
            UI.toast('Escribe un nombre para el comportamiento', 'warning');
            return;
        }

        const checkedAspects = Array.from(document.querySelectorAll('.new-type-aspect-chk:checked')).map(el => el.value);
        if (checkedAspects.length === 0) {
            checkedAspects.push(category === 'positiva' ? 'espiritu_trabajo' : 'moralidad');
        }

        let cat = category;
        let nivel = 1;
        let puntos = 1;
        if (category !== 'positiva') {
            const sevInput = document.getElementById('new-type-severidad');
            cat = sevInput ? sevInput.value : 'grave';
            nivel = cat === 'leve' ? 1 : (cat === 'grave' ? 2 : 3);
            puntos = -nivel;
        }

        const newObj = {
            id: existingId || undefined,
            nombre: name,
            categoria: cat,
            icono: category === 'positiva' ? 'check' : 'alert-triangle',
            nivel: nivel,
            puntos: puntos,
            aspectos: checkedAspects
        };

        Store.saveConductType(newObj);
        UI.toast(existingId ? 'Tipo de conducta actualizado' : 'Tipo de conducta creado', 'success');
        this.openTypesEditor();
    },

    _promptEditType(typeId, category) {
        const types = Store.getConductTypes();
        const list = category === 'positiva' ? types.positivas : types.incidencias;
        const item = list.find(t => t.id === typeId);
        if (!item) return;
        this._promptNewType(item, category);
    },

    _deleteType(typeId, category) {
        if (!confirm('¿Deseas eliminar este tipo de conducta de la lista?')) return;
        Store.deleteConductType(typeId, category);
        UI.toast('Tipo eliminado', 'info');
        this.openTypesEditor();
    },

    _confirmRestoreDefaults() {
        if (!confirm('¿Restaurar los tipos positivos e incidencias con sus relaciones SACE por defecto?')) return;
        Store.resetConductTypes();
        UI.toast('Tipos restaurados a valores de fábrica', 'success');
        this.openTypesEditor();
    },

    // =========================================================================
    // REGISTRO EN LOTE (Multi-Selección de Alumnos)
    // =========================================================================
    openBatchRecordModal() {
        if (this._selectedStudentIds.size === 0) {
            UI.toast('No has seleccionado ningún alumno', 'warning');
            return;
        }

        const types = Store.getConductTypes();
        const count = this._selectedStudentIds.size;

        const content = `
        <div class="conducta-batch-modal-fullscreen" data-fullscreen="true" style="display:flex; flex-direction:column; height:100vh; max-height:100vh; width:100%; max-width:100%; box-sizing:border-box; overflow-x:hidden; background:#f8fafc; color:#0f172a; overflow:hidden;">
            <header style="background:#ffffff; border-bottom:1.5px solid #e2e8f0; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.03);">
                <div style="display:flex; align-items:center; gap:14px;">
                    <button type="button" onclick="UI.closeModal()" class="btn btn-sm btn-secondary" style="height:36px; padding:0 14px; font-weight:800; font-size:12px; border-radius:9px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="arrow-left" style="width:15px; height:15px;"></i> Volver
                    </button>
                    <div>
                        <span class="badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-weight:800; font-size:10px; padding:2px 8px; border-radius:6px; text-transform:uppercase;">Acción Grupal</span>
                        <h3 style="font-size:16px; font-weight:900; margin:2px 0 0 0; color:#0f172a;">Anotar Conducta Masiva a ${count} Alumnos Seleccionados</h3>
                    </div>
                </div>
                <button type="button" onclick="UI.closeModal()" title="Cerrar ventana" style="background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0; width:34px; height:34px; border-radius:9px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;">
                    <i data-lucide="x" style="width:16px; height:16px;"></i>
                </button>
            </header>

            <div style="flex:1 1 auto; overflow-y:auto; padding:24px 28px; max-width:820px; margin:0 auto; width:100%; box-sizing:border-box;">
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; box-shadow:0 1px 3px rgba(0,0,0,0.02); margin-bottom:16px;">
                    <p style="font-size:13px; color:#475569; margin:0 0 16px 0;">
                        Selecciona el tipo de conducta que se registrará simultáneamente en el expediente de los <b>${count} alumnos</b> elegidos.
                    </p>

                    <div style="margin-bottom:18px;">
                        <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:6px;">Tipo de Conducta Oficial</label>
                        <select id="batch-conduct-type-select" style="width:100%; padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:13px; font-weight:800; background:#ffffff; color:#0f172a;">
                            <optgroup label="Conductas Positivas (${types.positivas.length})">
                                ${types.positivas.map(p => `<option value="pos_${p.id}">[+] ${p.nombre}</option>`).join('')}
                            </optgroup>
                            <optgroup label="Incidencias Disciplinarias (${types.incidencias.length})">
                                ${types.incidencias.map(i => `<option value="inc_${i.id}">[-] [${i.categoria.toUpperCase()}] ${i.nombre}</option>`).join('')}
                            </optgroup>
                        </select>
                    </div>

                    <div style="margin-bottom:16px;">
                        <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:6px;">Comentario u Observación adicional (opcional)</label>
                        <textarea id="batch-conduct-comentario" rows="3" placeholder="Detalle de la actividad, acuerdo o situación grupal..." style="width:100%; padding:10px 14px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:12.5px; box-sizing:border-box; outline:none; font-family:inherit;"></textarea>
                    </div>
                </div>
            </div>

            <footer style="background:#ffffff; border-top:1.5px solid #e2e8f0; padding:12px 28px; display:flex; align-items:center; justify-content:flex-end; gap:12px; flex-shrink:0;">
                <button type="button" class="btn btn-sm" onclick="UI.closeModal()" style="height:36px; padding:0 18px; font-weight:800; border-radius:9px; background:#f1f5f9; color:#475569; border:none; cursor:pointer;">Cancelar</button>
                <button type="button" class="btn btn-sm btn-primary" onclick="Views.Conducta._executeBatchSubmit()" style="height:36px; padding:0 22px; font-weight:900; border-radius:9px; background:#047857; color:#fff; border:none; cursor:pointer;">
                    Guardar para ${count} Alumnos
                </button>
            </footer>
        </div>`;

        UI.modal(null, content, '', { fullscreen: true });
        if (window.lucide) window.lucide.createIcons();
    },

    _executeBatchSubmit() {
        const select = document.getElementById('batch-conduct-type-select');
        if (!select) return;
        const val = select.value;
        const types = Store.getConductTypes();

        let chosen = null;
        if (val.startsWith('pos_')) {
            const tid = val.replace('pos_', '');
            chosen = types.positivas.find(t => t.id === tid);
        } else {
            const tid = val.replace('inc_', '');
            chosen = types.incidencias.find(t => t.id === tid);
        }

        if (!chosen) return;

        const course = this._getCourse();
        const comEl = document.getElementById('batch-conduct-comentario');
        const comentario = comEl ? comEl.value.trim() : '';
        const now = new Date();
        const fecha = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        this._selectedStudentIds.forEach(studentId => {
            Store.saveConductRecord({
                cursoId: course ? course.id : null,
                estudianteId: studentId,
                fecha: fecha,
                hora: hora,
                tipo: chosen.categoria,
                tipoId: chosen.id,
                nombre: chosen.nombre,
                icono: chosen.icono,
                puntos: chosen.puntos || (chosen.categoria === 'positiva' ? 1 : -1),
                aspectos: Array.isArray(chosen.aspectos) ? [...chosen.aspectos] : ['espiritu_trabajo'],
                comentario: comentario
            });
        });

        UI.toast(`Conducta registrada para ${this._selectedStudentIds.size} alumnos`, 'success');
        if (typeof UI !== 'undefined' && UI.playSound) UI.playSound('success');

        this.toggleMultiSelectMode();
        if (course) this.openGridModal(course.id);
    },

    // =========================================================================
    // MODAL 4: REPORTE OFICIAL SACE DE PERSONALIDAD POR PARCIAL (IMAGEN 1)
    // =========================================================================
    _getInstitutionalSaceMeta(course) {
        const centro = course?.centroEducativo || Store.data?.configAcademica?.centroEducativo || 'CENTRO DE EDUCACIÓN BÁSICA / MEDIA';
        const gradoRaw = String(course?.grado || '').toUpperCase();
        let cursoNombre = gradoRaw || 'SEPTIMO GRADO';
        if (gradoRaw.includes('7')) cursoNombre = 'SEPTIMO GRADO';
        else if (gradoRaw.includes('8')) cursoNombre = 'OCTAVO GRADO';
        else if (gradoRaw.includes('9')) cursoNombre = 'NOVENO GRADO';
        else if (gradoRaw.includes('10')) cursoNombre = 'DECIMO GRADO';
        else if (gradoRaw.includes('11')) cursoNombre = 'UNDECIMO GRADO';
        else if (gradoRaw.includes('12')) cursoNombre = 'DUODECIMO GRADO';

        const modalidad = course?.modalidad || ((gradoRaw.includes('10') || gradoRaw.includes('11') || gradoRaw.includes('12')) ? 'EDUCACION MEDIA' : 'EDUCACION BASICA');
        const seccion = course?.seccion || '1';
        return { centro: String(centro).toUpperCase(), modalidad: String(modalidad).toUpperCase(), cursoNombre, seccion: String(seccion) };
    },

    openSacePersonalityReportModal(courseId, parcialNumOverride = null) {
        const course = this._getCourse(courseId);
        if (!course) {
            UI.toast('Selecciona un curso primero', 'warning');
            return;
        }
        if (parcialNumOverride) this._selectedParcialNum = Number(parcialNumOverride);
        const parcial = this._getActiveParcialObj(course.id, this._selectedParcialNum);
        const pNum = parcial.numero || 1;
        const students = this._getCourseStudents(course);
        const inst = this._getInstitutionalSaceMeta(course);
        const fmt = this._saceReportFormat || 'numero';

        const rowsData = students.map((s, idx) => {
            const ev = this.evaluateStudentPersonality(course.id, s.id, pNum);
            return { student: s, index: idx + 1, eval: ev };
        });

        const formatCell = (item) => {
            if (fmt === 'numero') return `${item.score}`;
            if (fmt === 'combinado') return `${item.score} - ${item.label}`;
            return item.label; // 'SOBRESALIENTE' | 'MUY BUENO' | 'BUENO'
        };

        const content = `
        <div class="sace-personalidad-modal-fullscreen" data-fullscreen="true" style="display:flex; flex-direction:column; height:100vh; max-height:100vh; width:100%; max-width:100%; box-sizing:border-box; overflow-x:hidden; background:#f8fafc; color:#0f172a; overflow:hidden;">
            <!-- Barra de Herramientas Ejecutiva (Diseño Integrado Aula 360) -->
            <header style="background:#ffffff; color:#0f172a; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; flex-wrap:wrap; border-bottom:1px solid #e2e8f0; box-shadow:0 1px 4px rgba(0,0,0,0.03); z-index:10;">
                
                <!-- Lado Izquierdo: Volver y Título Oficial -->
                <div style="display:flex; align-items:center; gap:14px;">
                    <button type="button" onclick="UI.closeModal()" class="btn btn-sm" style="height:36px; padding:0 14px; font-weight:800; font-size:12px; border-radius:9px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                        <i data-lucide="arrow-left" style="width:15px; height:15px;"></i> Volver
                    </button>
                    <div>
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                            <span class="badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-weight:800; font-size:10px; padding:1px 7px; border-radius:6px; text-transform:uppercase; letter-spacing:0.04em;">Formato Oficial SACE</span>
                            <span style="font-size:11px; color:#64748b; font-weight:600;">Secretaría de Educación de Honduras</span>
                        </div>
                        <h3 style="font-size:16px; font-weight:900; margin:0; color:#0f172a; line-height:1.2; letter-spacing:-0.01em;">
                            Cuadro de Personalidad &middot; <span style="color:#4f46e5;">${parcial.nombre.toUpperCase()}</span> &middot; <span style="font-weight:700; color:#475569;">${this._getCourseTitle(course)}</span>
                        </h3>
                    </div>
                </div>

                <!-- Lado Derecho: Controles Segmentados y Acciones -->
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                    
                    <!-- Selector Segmentado de Parcial (Idéntico a Cuadro Controlador y Asistencia) -->
                    <div style="display:inline-flex; align-items:center; gap:3px; background:#f1f5f9; padding:3px; border-radius:10px; border:1px solid #e2e8f0;">
                        ${[1, 2, 3, 4].map(num => {
                            const isSel = pNum === num;
                            const label = ['I Parcial', 'II Parcial', 'III Parcial', 'IV Parcial'][num - 1];
                            return `
                            <button type="button" onclick="Views.Conducta.openSacePersonalityReportModal('${course.id}', ${num})"
                                    style="border:none; border-radius:7px; padding:5px 12px; font-size:11.5px; font-weight:800; cursor:pointer; transition:all 0.15s;
                                           ${isSel ? 'background:#4f46e5; color:#ffffff; box-shadow:0 2px 5px rgba(79,70,229,0.25);' : 'background:transparent; color:#64748b;'}"
                                    onmouseover="if (!${isSel}) this.style.background='rgba(0,0,0,0.05)';"
                                    onmouseout="if (!${isSel}) this.style.background='transparent';">
                                ${label}
                            </button>`;
                        }).join('')}
                    </div>

                    <!-- Selector Segmentado de Formato (Números / Texto SACE / Combinado) -->
                    <div style="display:inline-flex; align-items:center; gap:3px; background:#f1f5f9; padding:3px; border-radius:10px; border:1px solid #e2e8f0;" title="Cambiar formato de visualización en la tabla">
                        <button type="button" onclick="Views.Conducta._saceReportFormat = 'numero'; Views.Conducta.openSacePersonalityReportModal('${course.id}', ${pNum});"
                                style="border:none; border-radius:7px; padding:5px 11px; font-size:11.5px; font-weight:800; cursor:pointer; transition:all 0.15s;
                                       ${fmt === 'numero' ? 'background:#0f172a; color:#ffffff; box-shadow:0 2px 5px rgba(15,23,42,0.2);' : 'background:transparent; color:#64748b;'}"
                                onmouseover="if ('${fmt}' !== 'numero') this.style.background='rgba(0,0,0,0.05)';"
                                onmouseout="if ('${fmt}' !== 'numero') this.style.background='transparent';">
                            🔢 Números (2, 3, 4)
                        </button>
                        <button type="button" onclick="Views.Conducta._saceReportFormat = 'texto'; Views.Conducta.openSacePersonalityReportModal('${course.id}', ${pNum});"
                                style="border:none; border-radius:7px; padding:5px 11px; font-size:11.5px; font-weight:800; cursor:pointer; transition:all 0.15s;
                                       ${fmt === 'texto' ? 'background:#0f172a; color:#ffffff; box-shadow:0 2px 5px rgba(15,23,42,0.2);' : 'background:transparent; color:#64748b;'}"
                                onmouseover="if ('${fmt}' !== 'texto') this.style.background='rgba(0,0,0,0.05)';"
                                onmouseout="if ('${fmt}' !== 'texto') this.style.background='transparent';">
                            📝 Texto Oficial SACE
                        </button>
                        <button type="button" onclick="Views.Conducta._saceReportFormat = 'combinado'; Views.Conducta.openSacePersonalityReportModal('${course.id}', ${pNum});"
                                style="border:none; border-radius:7px; padding:5px 11px; font-size:11.5px; font-weight:800; cursor:pointer; transition:all 0.15s;
                                       ${fmt === 'combinado' ? 'background:#0f172a; color:#ffffff; box-shadow:0 2px 5px rgba(15,23,42,0.2);' : 'background:transparent; color:#64748b;'}"
                                onmouseover="if ('${fmt}' !== 'combinado') this.style.background='rgba(0,0,0,0.05)';"
                                onmouseout="if ('${fmt}' !== 'combinado') this.style.background='transparent';">
                            🔤 Combinado
                        </button>
                    </div>

                    ${typeof UI !== 'undefined' && UI.renderReportZoomControls ? UI.renderReportZoomControls('sace-personality-sheet-printable', 'sace-pers-zoom-label') : ''}
                    <!-- Copiar para Macro SACE -->
                    <button type="button" onclick="Views.Conducta.copySacePersonalityMacro('${course.id}', ${pNum})" title="Copiar las 5 columnas de personalidad en formato TSV para pegar directamente en Excel con Ctrl+V" style="height:36px; padding:0 14px; font-weight:800; font-size:12px; border-radius:9px; background:#4f46e5; border:1px solid #4338ca; color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(79,70,229,0.25); transition:all 0.15s;" onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
                        <i data-lucide="copy" style="width:14px; height:14px;"></i> Copiar Macro SACE
                    </button>

                    <!-- Exportar a Excel SACE -->
                    <button type="button" onclick="Views.Conducta.exportSacePersonalityExcel('${course.id}', ${pNum})" title="Descargar archivo Excel oficial" style="height:36px; padding:0 14px; font-weight:800; font-size:12px; border-radius:9px; background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.background='#d1fae5'" onmouseout="this.style.background='#ecfdf5'">
                        <i data-lucide="file-spreadsheet" style="width:14px; height:14px;"></i> Excel (.xlsx)
                    </button>

                    <!-- Imprimir -->
                    <button type="button" onclick="Views.Conducta.printSacePersonalityReport('${course.id}', ${pNum})" title="Imprimir cuadro oficial" style="height:36px; padding:0 14px; font-weight:800; font-size:12px; border-radius:9px; background:#ffffff; color:#334155; border:1px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
                        <i data-lucide="printer" style="width:14px; height:14px;"></i> Imprimir
                    </button>

                    <!-- Botón de Cerrar Modal -->
                    <button type="button" onclick="UI.closeModal()" title="Cerrar ventana" style="background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0; width:34px; height:34px; border-radius:9px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:all 0.15s;" onmouseover="this.style.background='#fee2e2'; this.style.color='#b91c1c'; this.style.borderColor='#fca5a5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#64748b'; this.style.borderColor='#e2e8f0';">
                        <i data-lucide="x" style="width:16px; height:16px;"></i>
                    </button>
                </div>
            </header>

            <!-- Cuerpo del Reporte -->
            <div style="flex:1 1 auto; overflow-y:auto; padding:20px 24px 44px; box-sizing:border-box;">
                
                <!-- Banner Ejecutivo de Ponderación Inteligente Oficial (Escala SACE: 2, 3, 4) -->
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:12px 18px; margin-bottom:16px; box-shadow:0 1px 3px rgba(0,0,0,0.03); display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; background:#eff6ff; color:#2563eb; flex-shrink:0;">
                            <i data-lucide="shield-check" style="width:17px; height:17px;"></i>
                        </span>
                        <div style="font-size:12px;">
                            <strong style="color:#0f172a;">Ponderación Integral Oficial SACE:</strong>
                            <span style="color:#64748b; margin-left:4px;">Asistencia, Cumplimiento de Tareas, Calidad de Trabajos y Conductas Semanales. Clic en un alumno para auditar o ajustar.</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; font-weight:800; font-size:11px;">
                        <span style="background:#dcfce7; color:#15803d; padding:3px 10px; border-radius:6px; border:1px solid #86efac;">4 = SOBRESALIENTE</span>
                        <span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:6px; border:1px solid #7dd3fc;">3 = MUY BUENO</span>
                        <span style="background:#fef3c7; color:#b45309; padding:3px 10px; border-radius:6px; border:1px solid #fcd34d;">2 = BUENO</span>
                    </div>
                </div>

                <!-- Contenedor Hoja Blanca SACE -->
                <div id="sace-personality-sheet-printable" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:12px; padding:24px; box-shadow:0 4px 12px rgba(15,23,42,0.04); overflow-x:auto;">
                    
                    <!-- Recuadro Superior INFORMACIÓN (Idéntico a Formato Oficial SACE) -->
                    <table style="border-collapse:collapse; width:100%; max-width:680px; margin-bottom:20px; font-family:Arial, sans-serif; font-size:12px; color:#000;">
                        <thead>
                            <tr>
                                <th colspan="2" style="border:1.5px solid #000; padding:6px 10px; text-align:center; font-weight:900; background:#f8fafc; letter-spacing:0.04em;">
                                    INFORMACIÓN
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border:1px solid #000; padding:5px 10px; font-weight:700; width:140px; background:#f8fafc;">CENTRO</td>
                                <td style="border:1px solid #000; padding:5px 10px;">${inst.centro}</td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #000; padding:5px 10px; font-weight:700; background:#f8fafc;">MODALIDAD</td>
                                <td style="border:1px solid #000; padding:5px 10px;">${inst.modalidad}</td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #000; padding:5px 10px; font-weight:700; background:#f8fafc;">CURSO</td>
                                <td style="border:1px solid #000; padding:5px 10px;">${inst.cursoNombre}</td>
                            </tr>
                            <tr>
                                <td style="border:1px solid #000; padding:5px 10px; font-weight:700; background:#f8fafc;">SECCIÓN</td>
                                <td style="border:1px solid #000; padding:5px 10px;">${inst.seccion}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Tabla Principal INFORMACIÓN DEL ALUMNO + PERSONALIDAD (PARCIAL X) -->
                    <table style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; font-size:11.5px; color:#000;">
                        <thead>
                            <tr>
                                <th colspan="4" style="border:1.5px solid #000; padding:7px 8px; text-align:center; font-weight:900; background:#f1f5f9;">
                                    INFORMACIÓN DEL ALUMNO
                                </th>
                                <th colspan="5" style="border:1.5px solid #000; padding:7px 8px; text-align:center; font-weight:900; background:#f1f5f9;">
                                    PERSONALIDAD (PARCIAL ${parcial.romano || pNum})
                                </th>
                                <th rowspan="2" class="no-print" style="border:1.5px solid #000; padding:7px 8px; text-align:center; font-weight:900; background:#ecfdf5; color:#065f46; width:95px;">
                                    PROMEDIO<br>(2-4)
                                </th>
                            </tr>
                            <tr style="background:#f8fafc;">
                                <th style="border:1.5px solid #000; padding:6px 6px; text-align:center; font-weight:800; width:36px;">No</th>
                                <th style="border:1.5px solid #000; padding:6px 6px; text-align:center; font-weight:800; width:64px;">TIPO ID</th>
                                <th style="border:1.5px solid #000; padding:6px 8px; text-align:center; font-weight:800; width:125px;">IDENTIDAD</th>
                                <th style="border:1.5px solid #000; padding:6px 10px; text-align:left; font-weight:800; min-width:280px; white-space:nowrap;">NOMBRE</th>
                                <th style="border:1.5px solid #000; padding:6px 6px; text-align:center; font-weight:800; width:135px;">
                                    <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                                        <span>PUNTUALIDAD</span>
                                        <button type="button" class="no-print" onclick="event.stopPropagation(); Views.Conducta.copySacePersonalityMacro('${course.id}', ${pNum}, 'puntualidad')" title="Copiar columna Puntualidad para Macro SACE" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:5px; padding:2px 6px; cursor:pointer; color:#475569; display:inline-flex; align-items:center; transition:all 0.15s;" onmouseover="this.style.background='#4f46e5'; this.style.color='#ffffff'; this.style.borderColor='#4f46e5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#475569'; this.style.borderColor='#cbd5e1';">
                                            <i data-lucide="copy" style="width:11px; height:11px;"></i>
                                        </button>
                                    </div>
                                </th>
                                <th style="border:1.5px solid #000; padding:6px 6px; text-align:center; font-weight:800; width:155px;">
                                    <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                                        <span>ESPÍRITU DE TRABAJO</span>
                                        <button type="button" class="no-print" onclick="event.stopPropagation(); Views.Conducta.copySacePersonalityMacro('${course.id}', ${pNum}, 'espiritu_trabajo')" title="Copiar columna Espíritu de Trabajo para Macro SACE" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:5px; padding:2px 6px; cursor:pointer; color:#475569; display:inline-flex; align-items:center; transition:all 0.15s;" onmouseover="this.style.background='#4f46e5'; this.style.color='#ffffff'; this.style.borderColor='#4f46e5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#475569'; this.style.borderColor='#cbd5e1';">
                                            <i data-lucide="copy" style="width:11px; height:11px;"></i>
                                        </button>
                                    </div>
                                </th>
                                <th style="border:1.5px solid #000; padding:6px 6px; text-align:center; font-weight:800; width:165px;">
                                    <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                                        <span>ORDEN Y PRESENTACIÓN</span>
                                        <button type="button" class="no-print" onclick="event.stopPropagation(); Views.Conducta.copySacePersonalityMacro('${course.id}', ${pNum}, 'orden_presentacion')" title="Copiar columna Orden y Presentación para Macro SACE" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:5px; padding:2px 6px; cursor:pointer; color:#475569; display:inline-flex; align-items:center; transition:all 0.15s;" onmouseover="this.style.background='#4f46e5'; this.style.color='#ffffff'; this.style.borderColor='#4f46e5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#475569'; this.style.borderColor='#cbd5e1';">
                                            <i data-lucide="copy" style="width:11px; height:11px;"></i>
                                        </button>
                                    </div>
                                </th>
                                <th style="border:1.5px solid #000; padding:6px 6px; text-align:center; font-weight:800; width:135px;">
                                    <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                                        <span>SOCIABILIDAD</span>
                                        <button type="button" class="no-print" onclick="event.stopPropagation(); Views.Conducta.copySacePersonalityMacro('${course.id}', ${pNum}, 'sociabilidad')" title="Copiar columna Sociabilidad para Macro SACE" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:5px; padding:2px 6px; cursor:pointer; color:#475569; display:inline-flex; align-items:center; transition:all 0.15s;" onmouseover="this.style.background='#4f46e5'; this.style.color='#ffffff'; this.style.borderColor='#4f46e5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#475569'; this.style.borderColor='#cbd5e1';">
                                            <i data-lucide="copy" style="width:11px; height:11px;"></i>
                                        </button>
                                    </div>
                                </th>
                                <th style="border:1.5px solid #000; padding:6px 6px; text-align:center; font-weight:800; width:135px;">
                                    <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                                        <span>MORALIDAD</span>
                                        <button type="button" class="no-print" onclick="event.stopPropagation(); Views.Conducta.copySacePersonalityMacro('${course.id}', ${pNum}, 'moralidad')" title="Copiar columna Moralidad para Macro SACE" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:5px; padding:2px 6px; cursor:pointer; color:#475569; display:inline-flex; align-items:center; transition:all 0.15s;" onmouseover="this.style.background='#4f46e5'; this.style.color='#ffffff'; this.style.borderColor='#4f46e5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#475569'; this.style.borderColor='#cbd5e1';">
                                            <i data-lucide="copy" style="width:11px; height:11px;"></i>
                                        </button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsData.length === 0 ? `
                                <tr>
                                    <td colspan="10" style="border:1px solid #000; padding:20px; text-align:center; color:#64748b;">
                                        No hay alumnos matriculados en este curso.
                                    </td>
                                </tr>
                            ` : rowsData.map(row => {
                                const s = row.student;
                                const isInactive = s.estadoMatricula === 'Desertor' || s.estadoMatricula === 'Traslado' || s.estadoMatricula === 'Inactivo';
                                const ev = isInactive ? null : row.eval;
                                const aPunt = ev ? ev.aspects.puntualidad : null;
                                const aEsp  = ev ? ev.aspects.espiritu_trabajo : null;
                                const aOrd  = ev ? ev.aspects.orden_presentacion : null;
                                const aSoc  = ev ? ev.aspects.sociabilidad : null;
                                const aMor  = ev ? ev.aspects.moralidad : null;

                                const renderCell = (aspObj) => {
                                    if (isInactive || !aspObj) {
                                        return `<td style="border:1px solid #000; padding:5px 8px; text-align:center; color:#94a3b8; font-weight:700; background:#f8fafc; cursor:not-allowed;">—</td>`;
                                    }
                                    return `
                                    <td onclick="Views.Conducta.openStudentPersonalityAuditModal('${s.id}', '${course.id}', ${pNum})"
                                        title="Clic para auditar o ajustar (${aspObj.shortLabel}: ${aspObj.rawScore} -> ${aspObj.score} ${aspObj.label})"
                                        style="border:1px solid #000; padding:5px 8px; text-align:center; font-weight:${aspObj.score === 4 ? '800' : '600'}; cursor:pointer; background:${aspObj.isManual ? '#fefce8' : '#ffffff'}; color:#000000; transition:background 0.12s;"
                                        onmouseover="this.style.background='#f0fdf4'"
                                        onmouseout="this.style.background='${aspObj.isManual ? '#fefce8' : '#ffffff'}'">
                                        ${formatCell(aspObj)}${aspObj.isManual ? ' *' : ''}
                                    </td>`;
                                };

                                const stBadge = isInactive ? ` <span style="font-size:9px; font-weight:800; color:${s.estadoMatricula === 'Desertor' ? '#b91c1c' : '#b45309'}; border:1px solid currentColor; padding:1px 4px; border-radius:4px;">${s.estadoMatricula}</span>` : '';
                                const overallCell = isInactive ? `
                                    <td class="no-print" style="border:1px solid #000; padding:5px 8px; text-align:center; font-weight:900; background:#f8fafc; color:${s.estadoMatricula === 'Desertor' ? '#b91c1c' : '#b45309'};">
                                        ${s.estadoMatricula ? s.estadoMatricula.toUpperCase() : 'INACTIVO'}
                                    </td>
                                ` : `
                                    <td class="no-print" onclick="Views.Conducta.openStudentPersonalityAuditModal('${s.id}', '${course.id}', ${pNum})" style="border:1px solid #000; padding:5px 8px; text-align:center; font-weight:900; cursor:pointer; background:${ev.overallBg}; color:${ev.overallColor};">
                                        ${ev.avgScore} (${ev.overallRounded})
                                    </td>
                                `;

                                return `
                                <tr style="background:#ffffff; ${isInactive ? 'opacity:0.75;' : ''}">
                                    <td style="border:1px solid #000; padding:5px 6px; text-align:center;">${row.index}</td>
                                    <td style="border:1px solid #000; padding:5px 6px; text-align:center;">${s.tipoId || 'HND'}</td>
                                    <td style="border:1px solid #000; padding:5px 8px; text-align:center; font-family:monospace; font-size:11.5px;">${s.identidad || ''}</td>
                                    <td ${isInactive ? '' : `onclick="Views.Conducta.openStudentPersonalityAuditModal('${s.id}', '${course.id}', ${pNum})"`} style="border:1px solid #000; padding:5px 10px; font-weight:700; cursor:${isInactive ? 'not-allowed' : 'pointer'}; color:#0f172a; text-transform:uppercase; white-space:nowrap;" title="${s.nombreCompleto}">
                                        <span style="${isInactive ? 'text-decoration:line-through; color:#64748b;' : ''}">${s.nombreCompleto || ''}</span>${stBadge}
                                    </td>
                                    ${renderCell(aPunt)}
                                    ${renderCell(aEsp)}
                                    ${renderCell(aOrd)}
                                    ${renderCell(aSoc)}
                                    ${renderCell(aMor)}
                                    ${overallCell}
                                </tr>`;}).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        UI.modal(null, content, '', { fullscreen: true });
        if (window.lucide) window.lucide.createIcons();
    },

    // =========================================================================
    // MODAL 5: AUDITORÍA Y PONDERACIÓN DETALLADA POR ALUMNO (SEMANAL + AUTOMÁTICA)
    // =========================================================================
    openStudentPersonalityAuditModal(studentId, courseId, parcialNumOverride = null) {
        const course = this._getCourse(courseId);
        const student = this._getStudent(studentId);
        if (!course || !student) return;

        const ev = this.evaluateStudentPersonality(course.id, student.id, parcialNumOverride);
        const m = ev.metrics;

        // Historial completo de conductas del alumno
        const allStudentConduct = (typeof Store.getConductRecords === 'function')
            ? Store.getConductRecords(course.id, student.id)
            : [];
        const parcialConduct = allStudentConduct.filter(r => {
            if (!r.fecha) return true;
            return r.fecha >= ev.fechaInicio && r.fecha <= ev.fechaFin;
        });

        const content = `
        <div class="sace-auditoria-modal-fullscreen" data-fullscreen="true" style="display:flex; flex-direction:column; height:100vh; max-height:100vh; width:100%; max-width:100%; box-sizing:border-box; overflow-x:hidden; background:#f8fafc; color:#0f172a; overflow:hidden;">
            <!-- Header Sticky Ejecutivo Integrado Aula 360 -->
            <header style="background:#ffffff; border-bottom:1.5px solid #e2e8f0; padding:12px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.03); z-index:10; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <button type="button" onclick="UI.closeModal()" class="btn btn-sm" style="height:36px; padding:0 14px; font-weight:800; font-size:12px; border-radius:9px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="arrow-left" style="width:15px; height:15px;"></i> Volver
                    </button>
                    <div>
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                            <span class="badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-weight:800; font-size:10px; padding:1px 7px; border-radius:6px; text-transform:uppercase;">Auditoría y Desglose SACE</span>
                            <span style="font-size:11px; color:#64748b; font-weight:600;">Parcial ${ev.parcialRomano} (${ev.fechaInicio} a ${ev.fechaFin})</span>
                        </div>
                        <h3 style="font-size:17px; font-weight:900; margin:0; color:#0f172a; line-height:1.2;">
                            ${student.nombreCompleto} &middot; <span style="font-weight:700; color:#475569;">${this._getCourseTitle(course)}</span>
                        </h3>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <!-- Badge Calificación Actual -->
                    <div style="background:${ev.overallBg}; color:${ev.overallColor}; border:1.5px solid ${ev.overallBorder}; border-radius:10px; padding:6px 14px; text-align:center; display:inline-flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; font-weight:800; text-transform:uppercase;">Calificación Actual:</span>
                        <span style="font-size:15px; font-weight:900;">${ev.avgScore} / 4.00 &rarr; ${ev.overallRounded} (${ev.overallLabel})</span>
                    </div>

                    <button type="button" onclick="Views.Conducta.openStudentModal('${student.id}')" class="btn btn-sm" style="height:36px; padding:0 14px; font-weight:800; font-size:12px; border-radius:9px; background:#f0fdf4; color:#15803d; border:1px solid #86efac; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="plus" style="width:14px; height:14px;"></i> Anotar Conducta
                    </button>

                    <button type="button" onclick="UI.closeModal()" title="Cerrar ventana" style="background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0; width:34px; height:34px; border-radius:9px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:all 0.15s;" onmouseover="this.style.background='#fee2e2'; this.style.color='#b91c1c'; this.style.borderColor='#fca5a5';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#64748b'; this.style.borderColor='#e2e8f0';">
                        <i data-lucide="x" style="width:16px; height:16px;"></i>
                    </button>
                </div>
            </header>

            <!-- Cuerpo Principal Fullscreen con Scroll -->
            <div style="flex:1 1 auto; overflow-y:auto; padding:22px 28px 48px; width:100% !important; max-width:1280px !important; margin:0 auto !important; box-sizing:border-box !important;">
                
                <!-- SECCIÓN 1: FACTORES EVALUADOS AUTOMÁTICAMENTE -->
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:16px 20px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:8px; background:#eff6ff; color:#2563eb; flex-shrink:0;">
                                <i data-lucide="cpu" style="width:16px; height:16px;"></i>
                            </span>
                            <div>
                                <div style="font-size:13px; font-weight:900; color:#0f172a; text-transform:uppercase; letter-spacing:0.04em;">
                                    1. Factores Evaluados Automáticamente por el Sistema en el Parcial ${ev.parcialRomano}
                                </div>
                                <div style="font-size:11.5px; color:#64748b;">
                                    El sistema cruza en tiempo real asistencia, cumplimiento de tareas, notas de aula y convivencia para calcular las notas base.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:12px; font-size:12px;">
                        <!-- Tarjeta Asistencia -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                <span style="font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase;">Asistencia y Puntualidad</span>
                                <i data-lucide="clock" style="width:14px; height:14px; color:#0284c7;"></i>
                            </div>
                            <div style="font-size:18px; font-weight:900; color:#0284c7; margin-bottom:4px;">
                                ${m.puntualidadAsistPct !== null ? `${m.puntualidadAsistPct}%` : 'Sin registros'}
                            </div>
                            <div style="font-size:11px; color:#475569;">
                                <b>${m.totalAsistDays}</b> días evaluados: ${m.presentes} presentes, ${m.tardanzas} tardanzas, ${m.excusas} excusas, ${m.injustificadas} ausencias injustificadas.
                            </div>
                        </div>

                        <!-- Tarjeta Cumplimiento -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                <span style="font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase;">Cumplimiento de Tareas</span>
                                <i data-lucide="check-square" style="width:14px; height:14px; color:#059669;"></i>
                            </div>
                            <div style="font-size:18px; font-weight:900; color:#059669; margin-bottom:4px;">
                                ${m.taskCompletionPct !== null ? `${m.taskCompletionPct}%` : 'Sin tareas'}
                            </div>
                            <div style="font-size:11px; color:#475569;">
                                <b>${m.deliveredCount}</b> de <b>${m.totalActs}</b> actividades evaluadas en el curso fueron entregadas puntualmente.
                            </div>
                        </div>

                        <!-- Tarjeta Calidad de Trabajos -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                <span style="font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase;">Calidad y Nota Académica</span>
                                <i data-lucide="award" style="width:14px; height:14px; color:#7c3aed;"></i>
                            </div>
                            <div style="font-size:18px; font-weight:900; color:#7c3aed; margin-bottom:4px;">
                                ${m.avgTrabajosPct !== null ? `${m.avgTrabajosPct}%` : 'En progreso'}
                            </div>
                            <div style="font-size:11px; color:#475569;">
                                Rendimiento ponderado obtenido en trabajos de Aula y Extra-Aula para Orden y Presentación.
                            </div>
                        </div>

                        <!-- Tarjeta Convivencia / Actitudes -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px;">
                                <span style="font-size:11px; color:#64748b; font-weight:800; text-transform:uppercase;">Actitudes y Trabajo en Equipo</span>
                                <i data-lucide="users" style="width:14px; height:14px; color:#d97706;"></i>
                            </div>
                            <div style="font-size:18px; font-weight:900; color:#d97706; margin-bottom:4px;">
                                ${m.avgValoresPct !== null ? `${m.avgValoresPct}%` : 'Estándar'}
                            </div>
                            <div style="font-size:11px; color:#475569;">
                                ${m.hasTeamRole ? 'Miembro activo en equipo colaborativo (+0.12 pts)' : 'Convivencia áulica ordinaria'} &middot; Puntos extra: +${m.extraPoints} pts.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 2: HISTORIAL DE CONDUCTAS REGISTRADAS POR EL DOCENTE -->
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:16px 20px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:8px; background:#ecfdf5; color:#047857; flex-shrink:0;">
                                <i data-lucide="clipboard-list" style="width:16px; height:16px;"></i>
                            </span>
                            <div>
                                <div style="font-size:13px; font-weight:900; color:#0f172a; text-transform:uppercase; letter-spacing:0.04em;">
                                    2. Historial de Anotaciones Conductuales del Docente en este Parcial (${parcialConduct.length})
                                </div>
                                <div style="font-size:11.5px; color:#64748b;">
                                    Registro de observaciones pedagógicas y disciplinarias acumuladas por el alumno en el período.
                                </div>
                            </div>
                        </div>

                        <button type="button" onclick="Views.Conducta.openStudentModal('${student.id}')" class="btn btn-sm" style="background:#f0fdf4; color:#15803d; border:1px solid #86efac; font-weight:800; font-size:11.5px; border-radius:8px; padding:5px 12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                            <i data-lucide="plus" style="width:13px; height:13px;"></i> Nueva Anotación
                        </button>
                    </div>

                    ${parcialConduct.length === 0 ? `
                        <div style="background:#f8fafc; border:1.5px dashed #cbd5e1; border-radius:12px; padding:24px 20px; text-align:center;">
                            <div style="width:42px; height:42px; border-radius:50%; background:#e0f2fe; color:#0369a1; display:grid; place-items:center; margin:0 auto 10px;">
                                <i data-lucide="info" style="width:22px; height:22px;"></i>
                            </div>
                            <div style="font-size:13.5px; font-weight:800; color:#0f172a; margin-bottom:4px;">
                                No hay anotaciones conductuales registradas en este parcial (+0 / -0)
                            </div>
                            <div style="font-size:12px; color:#64748b; max-width:580px; margin:0 auto 14px;">
                                El alumno no cuenta con incidencias disciplinarias ni conductas positivas anotadas por el docente para el Parcial ${ev.parcialRomano}. La calificación de Personalidad actual se genera a partir de la asistencia y el desempeño académico en tareas.
                            </div>
                            <button type="button" onclick="Views.Conducta.openStudentModal('${student.id}')" class="btn btn-sm btn-primary" style="background:#059669; border:none; font-weight:800; border-radius:8px; padding:7px 16px; cursor:pointer;">
                                + Registrar Conducta a ${student.nombreCompleto}
                            </button>
                        </div>
                    ` : `
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${parcialConduct.map(rec => {
                                const isPos = rec.tipo === 'positiva';
                                const typeLabel = isPos ? 'CONDUCTA POSITIVA' : `INCIDENCIA (${(rec.tipo || '').toUpperCase()})`;
                                const badgeBg = isPos ? '#dcfce7' : (rec.tipo === 'leve' ? '#fef3c7' : '#fee2e2');
                                const badgeColor = isPos ? '#15803d' : (rec.tipo === 'leve' ? '#b45309' : '#b91c1c');
                                const badgeBorder = isPos ? '#86efac' : (rec.tipo === 'leve' ? '#fcd34d' : '#fca5a5');
                                const aspects = Array.isArray(rec.aspectos) && rec.aspectos.length ? rec.aspectos : ['moralidad'];

                                return `
                                <div style="background:#ffffff; border:1px solid #e2e8f0; border-left:4px solid ${isPos ? '#22c55e' : '#ef4444'}; border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                                    <div style="flex:1; min-width:240px;">
                                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:3px;">
                                            <span style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-size:10px; font-weight:900; padding:1px 7px; border-radius:6px;">
                                                ${typeLabel}
                                            </span>
                                            <strong style="font-size:13px; color:#0f172a;">${rec.nombre || 'Conducta'}</strong>
                                            <span style="font-size:11px; color:#64748b;">(${rec.fecha || 'Sin fecha'}${rec.hora ? ` · ${rec.hora}` : ''})</span>
                                        </div>
                                        ${rec.comentario ? `
                                            <div style="font-size:11.5px; color:#475569; margin-top:2px; font-style:italic; background:#f8fafc; padding:4px 8px; border-radius:6px;">
                                                &ldquo;${rec.comentario}&rdquo;
                                            </div>
                                        ` : ''}
                                        <div style="display:flex; align-items:center; gap:5px; margin-top:4px;">
                                            <span style="font-size:10.5px; color:#64748b; font-weight:700;">Aspectos SACE vinculados:</span>
                                            ${aspects.map(k => {
                                                const aspMeta = this.getAspectMeta(k);
                                                return `<span style="background:${aspMeta.bg}; color:${aspMeta.color}; border:1px solid ${aspMeta.border}; font-size:9.5px; font-weight:800; padding:1px 6px; border-radius:999px;">${aspMeta.shortLabel}</span>`;
                                            }).join('')}
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <button type="button" onclick="Views.Conducta._deleteRecordAndRefreshAudit('${rec.id}', '${student.id}', '${course.id}', ${ev.parcialNum})" title="Eliminar anotación" style="background:#fee2e2; border:1px solid #fecaca; color:#b91c1c; border-radius:8px; padding:5px 9px; cursor:pointer; font-size:11.5px; font-weight:800; display:inline-flex; align-items:center; gap:4px; transition:all 0.15s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#fee2e2'">
                                            <i data-lucide="trash-2" style="width:13px; height:13px;"></i> Eliminar
                                        </button>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- SECCIÓN 3: DESGLOSE POR CADA UNO DE LOS 5 ASPECTOS OBSERVABLES SACE -->
                <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:16px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; flex-wrap:wrap;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:8px; background:#fdf4ff; color:#a21caf; flex-shrink:0;">
                                <i data-lucide="sparkles" style="width:16px; height:16px;"></i>
                            </span>
                            <div>
                                <div style="font-size:13px; font-weight:900; color:#0f172a; text-transform:uppercase; letter-spacing:0.04em;">
                                    3. Desglose y Calificación de los 5 Aspectos de Personalidad SACE
                                </div>
                                <div style="font-size:11.5px; color:#64748b;">
                                    Escala Oficial: <b>4 = SOBRESALIENTE</b> &middot; <b>3 = MUY BUENO</b> &middot; <b>2 = BUENO</b>. Puedes dejar el cálculo automático o ajustar manualmente.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:12px;">
                        ${this.SACE_ASPECTOS.map(asp => {
                            const a = ev.aspects[asp.key];
                            const recordsForAspect = a.records || [];

                            return `
                            <div style="background:#ffffff; border:1.5px solid ${a.border}; border-radius:12px; padding:14px 18px; box-shadow:0 1px 4px rgba(0,0,0,0.02);">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <span style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; background:${asp.bg}; color:${asp.color}; font-weight:900;">
                                            <i data-lucide="${asp.icon}" style="width:16px; height:16px;"></i>
                                        </span>
                                        <div>
                                            <div style="font-size:14px; font-weight:900; color:#0f172a;">${asp.label}</div>
                                            <div style="font-size:11px; color:#64748b;">Aspecto Oficial Observable en Formato SACE</div>
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                        <span style="background:${a.bg}; color:${a.color}; border:1px solid ${a.border}; font-size:11.5px; font-weight:900; padding:3px 10px; border-radius:999px;">
                                            Nota Calculada: ${a.rawScore} &rarr; ${a.autoScore} (${a.label})
                                        </span>
                                        <div style="display:inline-flex; align-items:center; gap:6px;">
                                            <label style="font-size:11px; font-weight:800; color:#475569;">Ajuste Docente:</label>
                                            <select class="sace-manual-override-select" data-aspect="${asp.key}" style="padding:6px 12px; border-radius:8px; border:1.5px solid #cbd5e1; font-size:12px; font-weight:800; background:${a.isManual ? '#fefce8' : '#ffffff'}; color:#0f172a; cursor:pointer;">
                                                <option value="auto" ${!a.isManual ? 'selected' : ''}>Automático (${a.autoScore} - ${this.getSaceScoreMeta(a.autoScore).label})</option>
                                                <option value="4" ${a.isManual && a.manualScore === 4 ? 'selected' : ''}>4 - SOBRESALIENTE (Manual)</option>
                                                <option value="3" ${a.isManual && a.manualScore === 3 ? 'selected' : ''}>3 - MUY BUENO (Manual)</option>
                                                <option value="2" ${a.isManual && a.manualScore === 2 ? 'selected' : ''}>2 - BUENO (Manual)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <!-- Detalle del Cálculo -->
                                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:11.5px; color:#475569; display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:8px;">
                                    <div>
                                        <strong style="color:#0f172a;">Factores Automáticos:</strong> ${a.autoSummary}
                                    </div>
                                    <div>
                                        <strong style="color:#0f172a;">Impacto de Conductas:</strong> +${a.posCount} positivas (${a.posWeeksCount} sem. distintas de constancia) / -${a.incCount} incidencias (${a.leveCount}L, ${a.graveCount}G, ${a.muyGraveCount}MG).
                                    </div>
                                </div>

                                ${recordsForAspect.length > 0 ? `
                                    <div style="margin-top:8px; padding-top:6px; border-top:1px dashed #e2e8f0; font-size:11px;">
                                        <span style="font-weight:800; color:#334155;">Conductas registradas vinculadas a este aspecto:</span>
                                        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:3px;">
                                            ${recordsForAspect.map(r => `
                                                <span style="background:${r.tipo === 'positiva' ? '#dcfce7' : '#fee2e2'}; color:${r.tipo === 'positiva' ? '#15803d' : '#b91c1c'}; border:1px solid ${r.tipo === 'positiva' ? '#86efac' : '#fca5a5'}; padding:1px 7px; border-radius:6px; font-weight:700;">
                                                    ${r.tipo === 'positiva' ? '+' : '-'} ${r.nombre} (${r.fecha})
                                                </span>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- FOOTER STICKY (Acciones Siempre Visibles) -->
            <footer style="background:#ffffff; border-top:1.5px solid #e2e8f0; padding:12px 28px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; box-shadow:0 -2px 10px rgba(0,0,0,0.04); z-index:10; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <button type="button" class="btn btn-sm" onclick="Views.Conducta.openStudentModal('${student.id}')" style="height:36px; padding:0 16px; font-weight:800; font-size:12px; border-radius:9px; background:#f0fdf4; color:#15803d; border:1px solid #86efac; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="plus" style="width:14px; height:14px;"></i> Anotar Conducta a este Alumno
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="Views.Conducta.openSacePersonalityReportModal('${course.id}', ${ev.parcialNum})" style="height:36px; padding:0 16px; font-weight:800; font-size:12px; border-radius:9px; background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                        <i data-lucide="table" style="width:14px; height:14px;"></i> Ver Cuadro SACE Completo
                    </button>
                </div>

                <div style="display:flex; align-items:center; gap:10px;">
                    <button type="button" class="btn btn-sm" onclick="UI.closeModal()" style="height:36px; padding:0 18px; font-weight:800; font-size:12.5px; border-radius:9px; background:#f1f5f9; color:#475569; border:none; cursor:pointer;">
                        Cerrar
                    </button>
                    <button type="button" class="btn btn-sm btn-primary" onclick="Views.Conducta._saveManualOverridesFromModal('${course.id}', ${ev.parcialNum}, '${student.id}')" style="height:36px; padding:0 24px; font-weight:900; font-size:13px; border-radius:9px; background:#047857; color:#ffffff; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(4,120,87,0.3);">
                        <i data-lucide="check" style="width:15px; height:15px;"></i> Guardar Calificación
                    </button>
                </div>
            </footer>
        </div>`;

        UI.modal(null, content, '', { fullscreen: true });
        if (window.lucide) window.lucide.createIcons();
    },

    _deleteRecordAndRefreshAudit(recordId, studentId, courseId, parcialNum) {
        if (!confirm('¿Deseas eliminar este registro de conducta?')) return;
        Store.deleteConductRecord(recordId);
        UI.toast('Anotación eliminada', 'info');
        this.openStudentPersonalityAuditModal(studentId, courseId, parcialNum);
    },

    _saveManualOverridesFromModal(courseId, parcialNum, studentId) {
        const selects = document.querySelectorAll('.sace-manual-override-select');
        const overrides = {};
        selects.forEach(sel => {
            const asp = sel.getAttribute('data-aspect');
            const val = sel.value;
            if (asp && val !== 'auto') {
                overrides[asp] = Number(val);
            }
        });
        if (typeof Store.savePersonalityOverride === 'function') {
            Store.savePersonalityOverride(courseId, `P${parcialNum}`, studentId, overrides);
        }
        UI.toast('Calificación de personalidad actualizada', 'success');
        this.openSacePersonalityReportModal(courseId, parcialNum);
    },

    // =========================================================================
    // COPIAR PARA MACROS DE SACE (TAB-SEPARATED VALUES / EXCEL DIRECT PASTE)
    // =========================================================================
    copySacePersonalityMacro(courseId, parcialNumOverride = null, aspectKey = null) {
        const course = this._getCourse(courseId);
        if (!course) return;
        const parcial = this._getActiveParcialObj(course.id, parcialNumOverride);
        const pNum = parcial.numero || 1;
        const students = this._getCourseStudents(course);
        const fmt = this._saceReportFormat || 'numero';

        if (!students || students.length === 0) {
            UI.toast('No hay estudiantes para copiar', 'warning');
            return;
        }

        const formatVal = (aspObj) => {
            if (!aspObj) return '';
            if (fmt === 'numero') return String(aspObj.score);
            if (fmt === 'combinado') return `${aspObj.score} - ${aspObj.label}`;
            return aspObj.label;
        };

        const lines = [];
        students.forEach(s => {
            const ev = this.evaluateStudentPersonality(course.id, s.id, pNum);
            if (aspectKey) {
                const aspObj = ev.aspects[aspectKey];
                lines.push(aspObj ? formatVal(aspObj) : '');
            } else {
                const row = [
                    formatVal(ev.aspects.puntualidad),
                    formatVal(ev.aspects.espiritu_trabajo),
                    formatVal(ev.aspects.orden_presentacion),
                    formatVal(ev.aspects.sociabilidad),
                    formatVal(ev.aspects.moralidad)
                ];
                lines.push(row.join('\t'));
            }
        });

        const textToCopy = lines.join('\r\n');

        const doCopy = () => {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(textToCopy);
            }
            return new Promise((resolve, reject) => {
                const ta = document.createElement('textarea');
                ta.value = textToCopy;
                ta.style.position = 'fixed';
                ta.style.left = '-999999px';
                ta.style.top = '-999999px';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                try {
                    const success = document.execCommand('copy');
                    document.body.removeChild(ta);
                    if (success) resolve();
                    else reject(new Error('execCommand copy failed'));
                } catch (e) {
                    document.body.removeChild(ta);
                    reject(e);
                }
            });
        };

        doCopy().then(() => {
            const aspectMeta = aspectKey ? this.getAspectMeta(aspectKey) : null;
            const aspectName = aspectMeta ? aspectMeta.shortLabel : 'las 5 columnas de Personalidad';
            const fmtName = fmt === 'numero' ? 'Números (2, 3, 4)' : (fmt === 'combinado' ? 'Combinado' : 'Texto Oficial SACE');
            UI.toast(`¡Copiado para Macro SACE (${aspectName})! Formato: ${fmtName}. ${students.length} filas listas para pegar (Ctrl+V)`, 'success');
        }).catch(err => {
            console.error('Error al copiar macro SACE:', err);
            UI.toast('No se pudo copiar automáticamente. Permita acceso al portapapeles.', 'error');
        });
    },

    // =========================================================================
    // EXPORTAR EXCEL OFICIAL SACE (.XLSX) E IMPRIMIR REPORTE (IMAGEN 1)
    // =========================================================================
    exportSacePersonalityExcel(courseId, parcialNumOverride = null) {
        const course = this._getCourse(courseId);
        if (!course) return;
        const parcial = this._getActiveParcialObj(course.id, parcialNumOverride);
        const pNum = parcial.numero || 1;
        const students = this._getCourseStudents(course);
        const inst = this._getInstitutionalSaceMeta(course);
        const fmt = this._saceReportFormat || 'numero';

        const formatVal = (aspObj) => {
            if (fmt === 'numero') return aspObj.score;
            if (fmt === 'combinado') return `${aspObj.score} - ${aspObj.label}`;
            return aspObj.label;
        };

        const aoa = [
            ['', 'INFORMACIÓN', '', ''],
            ['', 'CENTRO', inst.centro, ''],
            ['', 'MODALIDAD', inst.modalidad, ''],
            ['', 'CURSO', inst.cursoNombre, ''],
            ['', 'SECCIÓN', inst.seccion, ''],
            [],
            ['INFORMACIÓN DEL ALUMNO', '', '', '', `PERSONALIDAD (PARCIAL ${parcial.romano || pNum})`, '', '', '', ''],
            ['No', 'TIPO ID', 'IDENTIDAD', 'NOMBRE', 'PUNTUALIDAD', 'ESPÍRITU DE TRABAJO', 'ORDEN Y PRESENTACIÓN', 'SOCIABILIDAD', 'MORALIDAD']
        ];

        students.forEach((s, idx) => {
            const ev = this.evaluateStudentPersonality(course.id, s.id, pNum);
            aoa.push([
                idx + 1,
                s.tipoId || 'HND',
                s.identidad || '',
                (s.nombreCompleto || '').toUpperCase(),
                formatVal(ev.aspects.puntualidad),
                formatVal(ev.aspects.espiritu_trabajo),
                formatVal(ev.aspects.orden_presentacion),
                formatVal(ev.aspects.sociabilidad),
                formatVal(ev.aspects.moralidad)
            ]);
        });

        if (typeof XLSX !== 'undefined') {
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            ws['!merges'] = [
                { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }, // INFORMACIÓN
                { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } }, // INFORMACIÓN DEL ALUMNO
                { s: { r: 6, c: 4 }, e: { r: 6, c: 8 } }  // PERSONALIDAD (PARCIAL X)
            ];
            ws['!cols'] = [
                { wch: 6 },  // No
                { wch: 9 },  // TIPO ID
                { wch: 16 }, // IDENTIDAD
                { wch: 38 }, // NOMBRE
                { wch: 18 }, // PUNTUALIDAD
                { wch: 22 }, // ESPÍRITU DE TRABAJO
                { wch: 24 }, // ORDEN Y PRESENTACIÓN
                { wch: 18 }, // SOCIABILIDAD
                { wch: 18 }  // MORALIDAD
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, `PERSONALIDAD_PARCIAL_${parcial.romano || pNum}`);
            const safeCourse = `${course.grado || 'Curso'}_${course.seccion || '1'}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            XLSX.writeFile(wb, `SACE_Personalidad_Parcial_${parcial.romano || pNum}_${safeCourse}.xlsx`);
            UI.toast('Archivo Excel SACE exportado correctamente', 'success');
        } else {
            UI.toast('Librería Excel no disponible en este momento', 'error');
        }
    },

    printSacePersonalityReport(courseId, parcialNumOverride = null) {
        const sheet = document.getElementById('sace-personality-sheet-printable');
        if (!sheet) return;
        const win = window.open('', '_blank');
        if (!win) {
            window.print();
            return;
        }
        win.document.write(`
            <html>
            <head>
                <title>Reporte Oficial SACE - Personalidad</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; }
                    .no-print { display: none !important; }
                    @media print {
                        @page { size: landscape; margin: 12mm; }
                    }
                </style>
            </head>
            <body>
                ${sheet.innerHTML}
                <script>window.onload = function(){ window.print(); setTimeout(()=>window.close(), 400); };<\/script>
            </body>
            </html>
        `);
        win.document.close();
    }
};

// Exponer globalmente
window.Views = window.Views || {};
window.Views.Conducta = Views_Conducta;
window.Conducta = Views_Conducta;
