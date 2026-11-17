/**
 * AppGreeting - Asistente Virtual, Orientación Horaria y Saludos Dinámicos
 * Aula 360 HN
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AppGreeting = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

var AppGreeting = window.AppGreeting = {
    _watcherInterval: null,
    _notifiedReminders: {},
    _notifiedClassStarts: {},
    _notifiedAutoAttendance: {},
    _notifiedOmittedAttendance: {},
    _currentGreetingSlotKey: null,

    // Normalizador de días: reconoce 'L', 'Lunes', 'lunes', 'Mié', 'Miercoles', '1', etc.
    isDayMatch(keyOrName, targetDayIdx) {
        if (keyOrName === undefined || keyOrName === null) return false;
        const str = String(keyOrName).trim().toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const patterns = {
            0: ['d', 'dom', 'domingo', '0', '7', 'sun', 'sunday'],
            1: ['l', 'lun', 'lunes', '1', 'mon', 'monday'],
            2: ['ma', 'mar', 'martes', '2', 'tue', 'tuesday'],
            3: ['mi', 'mie', 'miercoles', '3', 'wed', 'wednesday'],
            4: ['j', 'jue', 'jueves', '4', 'thu', 'thursday'],
            5: ['v', 'vie', 'viernes', '5', 'fri', 'friday'],
            6: ['s', 'sab', 'sabado', '6', 'sat', 'saturday']
        };

        const valid = patterns[targetDayIdx] || [];
        return valid.includes(str);
    },

    timeToMin(tStr) {
        if (!tStr) return 0;
        if (typeof tStr === 'number') return tStr;
        const str = String(tStr).trim();
        const isPM = /pm|p\.\s*m\./i.test(str);
        const isAM = /am|a\.\s*m\./i.test(str);
        const match = str.match(/(\d{1,2}):(\d{2})/);
        if (!match) return 0;
        let h = parseInt(match[1], 10);
        let m = parseInt(match[2], 10);
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 60 + m;
    },

    formatTimeStr(tStr) {
        if (!tStr) return '';
        const m = this.timeToMin(tStr);
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        return hh + ':' + mm;
    },

    getCourseScheduleForDay(c, dayIdx) {
        if (!c) return null;
        const hObj = c.horario || {};
        for (const k of Object.keys(hObj)) {
            if (this.isDayMatch(k, dayIdx)) {
                return hObj[k];
            }
        }
        if (typeof Store !== 'undefined' && Store && Store.data && Array.isArray(Store.data.cargasDocentes)) {
            const cd = Store.data.cargasDocentes.find(x => x.cursoId === c.id);
            if (cd && cd.horario) {
                for (const k of Object.keys(cd.horario)) {
                    if (this.isDayMatch(k, dayIdx)) {
                        return cd.horario[k];
                    }
                }
            }
        }
        return null;
    },

    courseHasDay(c, dayIdx) {
        if (!c) return false;
        if (this.getCourseScheduleForDay(c, dayIdx)) return true;
        if (c.diasClase && Array.isArray(c.diasClase)) {
            return c.diasClase.some(d => this.isDayMatch(d, dayIdx));
        }
        return false;
    },

    extractSlots(daySchedule, course, dayIdx) {
        const rawSlots = [];
        if (daySchedule) {
            if (Array.isArray(daySchedule)) {
                daySchedule.forEach(item => {
                    const s = item.inicio || item.start;
                    const e = item.fin || item.end;
                    if (s && e) {
                        rawSlots.push({
                            start: this.timeToMin(s),
                            end: this.timeToMin(e),
                            inicioStr: this.formatTimeStr(s),
                            finStr: this.formatTimeStr(e)
                        });
                    }
                });
            } else if (typeof daySchedule === 'object') {
                const pairs = [
                    [daySchedule.inicio || daySchedule.start, daySchedule.fin || daySchedule.end],
                    [daySchedule.inicio2 || daySchedule.start2, daySchedule.fin2 || daySchedule.end2],
                    [daySchedule.inicio3 || daySchedule.start3, daySchedule.fin3 || daySchedule.end3]
                ];
                pairs.forEach(([s, e]) => {
                    if (s && e) {
                        rawSlots.push({
                            start: this.timeToMin(s),
                            end: this.timeToMin(e),
                            inicioStr: this.formatTimeStr(s),
                            finStr: this.formatTimeStr(e)
                        });
                    }
                });
            }
        }

        if (rawSlots.length === 0 && course && this.courseHasDay(course, dayIdx)) {
            if (course.jornadaInicio && course.jornadaFin) {
                rawSlots.push({
                    start: this.timeToMin(course.jornadaInicio),
                    end: this.timeToMin(course.jornadaFin),
                    inicioStr: this.formatTimeStr(course.jornadaInicio),
                    finStr: this.formatTimeStr(course.jornadaFin)
                });
            }
        }

        return this.mergeConsecutiveSlots(rawSlots);
    },

    mergeConsecutiveSlots(slots) {
        if (!slots || slots.length <= 1) return slots || [];
        slots.sort((a, b) => a.start - b.start);
        const merged = [];
        let curr = { ...slots[0] };

        for (let i = 1; i < slots.length; i++) {
            const next = slots[i];
            if (next.start <= curr.end + 5 && next.end > curr.end) {
                curr.end = Math.max(curr.end, next.end);
                curr.finStr = next.finStr;
            } else if (next.start > curr.end + 5) {
                merged.push(curr);
                curr = { ...next };
            }
        }
        merged.push(curr);
        return merged;
    },

    getTodaysClasses(customDate = null) {
        const now = customDate || new Date();
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const dayIdx = now.getDay();
        const allCourses = typeof Store !== 'undefined' ? (Store.get('cursos') || []) : [];
        const activeCourse = typeof Store !== 'undefined' && Store.getActiveCourse ? Store.getActiveCourse() : null;
        const todaysClasses = [];

        allCourses.forEach(c => {
            // Cursos Finalizados, Archivados o Suspendidos no ocupan horario
            if (c.estado && String(c.estado).toUpperCase() !== 'ACTIVO') {
                return;
            }

            const daySchedule = this.getCourseScheduleForDay(c, dayIdx);
            const hasDay = this.courseHasDay(c, dayIdx);

            if (daySchedule || hasDay) {
                const slots = this.extractSlots(daySchedule, c, dayIdx);
                slots.forEach(s => {
                    todaysClasses.push({
                        course: c,
                        slot: s,
                        isCurrent: (currentMin >= s.start && currentMin < s.end),
                        isUpcoming: (s.start > currentMin),
                        isPast: (s.end <= currentMin),
                        diffMinutes: s.start - currentMin,
                        remainingMinutes: s.end - currentMin
                    });
                });
            }
        });

        todaysClasses.sort((a, b) => a.slot.start - b.slot.start);
        return todaysClasses;
    },

    getTodaysAgendaReminders(courseId) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const reminders = [];

        try {
            const inst = typeof Store !== 'undefined' ? (Store.get('agendaEventosInstitucionales') || []) : [];
            inst.forEach(e => {
                const d = (e.date || e.fecha || '').replace(/\//g, '-');
                if (d && d.includes(todayStr)) {
                    reminders.push({ tipo: 'Institucional', titulo: e.title || e.titulo || 'Evento Institucional' });
                }
            });
        } catch(e) {}

        try {
            const manuales = typeof Store !== 'undefined' ? (Store.get('agendaEventos') || []) : [];
            manuales.forEach(e => {
                const d = (e.date || e.fecha || '').replace(/\//g, '-');
                if (d && d.includes(todayStr)) {
                    if (!e.cursoId || e.cursoId === courseId || !courseId) {
                        reminders.push({ tipo: 'Agenda', titulo: e.title || e.titulo || 'Compromiso agendado' });
                    }
                }
            });
        } catch(e) {}

        try {
            if (courseId && typeof Store !== 'undefined') {
                const acts = Store.get('actividades') || [];
                acts.forEach(a => {
                    if (a.cursoId === courseId) {
                        const f = (a.fechaEntrega || a.fechaLimite || a.fecha || '').replace(/\//g, '-');
                        if (f && f.includes(todayStr)) {
                            reminders.push({ tipo: 'Tarea/Evaluación', titulo: 'Entrega: ' + (a.nombre || a.titulo) });
                        }
                    }
                });
            }
        } catch(e) {}

        return reminders;
    },

    getGreetingData() {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const currentMin = hour * 60 + min;
        const dayIdx = now.getDay();
        const todayStr = now.toISOString().split('T')[0];

        let saludo = '¡Buenas noches!';
        let iconoSaludo = '🌙';
        let bgGradient = 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)';
        let themeColor = '#4338CA';
        
        if (hour >= 5 && hour < 12) {
            saludo = '¡Buenos días!';
            iconoSaludo = '☀️';
            bgGradient = 'linear-gradient(135deg, #0F172A 0%, #064E3B 60%, #0D9488 100%)';
            themeColor = '#0D9488';
        } else if (hour >= 12 && hour < 19) {
            saludo = '¡Buenas tardes!';
            iconoSaludo = '🌤️';
            bgGradient = 'linear-gradient(135deg, #0F172A 0%, #7C2D12 60%, #EA580C 100%)';
            themeColor = '#EA580C';
        }

        const rawDocente = (typeof Store !== 'undefined' && Store.data ? (Store.data?.perfilDocente?.nombre || Store.data?.configDocente?.nombre || '') : '').trim();
        let nombreLimpio = rawDocente ? rawDocente.replace(/^(Lic\.|Prof\.|Ing\.|Msc\.|Dr\.)\s*/i, '').split(' ')[0] : '';
        const nombreSaludo = nombreLimpio ? ', Prof. ' + nombreLimpio : (rawDocente ? ', ' + rawDocente : '');
        const saludoCompleto = saludo + nombreSaludo;

        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = dayNames[dayIdx];
        const isWeekend = (dayIdx === 0 || dayIdx === 6);

        if (isWeekend) {
            const reminders = this.getTodaysAgendaReminders(null);
            return {
                isWeekend: true,
                saludo,
                saludoCompleto,
                iconoSaludo: '☕',
                dayName,
                tipo: 'fin_de_semana',
                slotKey: todayStr + '_weekend',
                bgGradient: 'linear-gradient(135deg, #0F172A 0%, #312E81 60%, #6366F1 100%)',
                themeColor: '#4F46E5',
                titulo: saludoCompleto,
                subtituloHorario: 'Fin de Semana (' + dayName + ') • Planificación y Rúbricas',
                badgeTexto: 'FIN DE SEMANA (' + dayName.toUpperCase() + ')',
                mensajeAsistente: '¡Hola! Soy tu <b>Asistente de Aula 360</b>. Hoy es ' + dayName + ', un momento ideal para organizar tu <b>Agenda Pedagógica</b>, planificar lecciones y preparar tus rúbricas con anticipación.',
                agendaReminders: reminders,
                accionTexto: 'Organizar Agenda Escolar',
                accionIcono: 'calendar-plus',
                accionTipo: 'agenda',
                accionRuta: 'agenda'
            };
        }

        const todaysClasses = this.getTodaysClasses(now);
        const activeCourse = typeof Store !== 'undefined' && Store.getActiveCourse ? Store.getActiveCourse() : null;

        // Caso A: Clase en curso en este momento (e.g. 8:20 a 9:40)
        let currentClass = todaysClasses.find(cl => cl.isCurrent);
        if (!currentClass && activeCourse) {
            const activeClassInToday = todaysClasses.find(cl => cl.course.id === activeCourse.id && cl.isCurrent);
            if (activeClassInToday) currentClass = activeClassInToday;
        }

        if (currentClass) {
            const c = currentClass.course;
            const s = currentClass.slot;
            const nombreCurso = c.asignatura || c.nombre || 'Curso';
            const seccion = c.seccion ? 'Secc. ' + c.seccion : '';
            const grado = c.grado || '';
            const isAlreadyActive = (activeCourse && activeCourse.id === c.id);
            const slotKey = todayStr + '_' + c.id + '_' + s.start + '_' + s.end;
            const minsLeft = Math.max(0, s.end - currentMin);

            const nextClassAfterCurrent = todaysClasses.find(cl => cl.slot.start >= s.end);
            let detalleProxima = '';
            if (nextClassAfterCurrent) {
                const nc = nextClassAfterCurrent.course;
                detalleProxima = ' Tu siguiente clase será <b>' + (nc.asignatura || nc.nombre) + '</b> (' + (nc.grado || '') + (nc.seccion ? ' ' + nc.seccion : '') + ') a las <b>' + nextClassAfterCurrent.slot.inicioStr + '</b>.';
            }

            const agendaReminders = this.getTodaysAgendaReminders(c.id);

            return {
                isWeekend: false,
                saludo,
                saludoCompleto,
                iconoSaludo: '✨',
                dayName,
                tipo: 'clase_actual',
                slotKey: slotKey,
                bgGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0284C7 100%)',
                themeColor: '#0284C7',
                curso: c,
                cursoId: c.id,
                slot: s,
                proximaClase: nextClassAfterCurrent,
                titulo: saludoCompleto,
                subtituloHorario: dayName + ' • ' + nombreCurso + ' (' + grado + (seccion ? ' ' + seccion : '') + ') • ' + s.inicioStr + ' a ' + s.finStr,
                badgeTexto: 'EN CLASE AHORA (' + s.inicioStr + ' - ' + s.finStr + ')',
                minsRestantes: minsLeft,
                mensajeAsistente: '¡Hola! Soy <b>Tutor 360</b>, tu copiloto del aula. Te doy la bienvenida a tu sesión de <b>' + nombreCurso + '</b> con <b>' + grado + (seccion ? ' ' + seccion : '') + '</b>. Te restan <b>' + minsLeft + ' minutos</b> de clase pedagógica.' + detalleProxima,
                agendaReminders: agendaReminders,
                accionTexto: isAlreadyActive ? 'Continuar en ' + nombreCurso : 'Entrar a ' + nombreCurso,
                accionIcono: 'book-open',
                accionTipo: 'curso'
            };
        }

        // Caso B: Próxima clase de hoy
        const upcomingClass = todaysClasses.find(cl => cl.isUpcoming);
        if (upcomingClass) {
            const c = upcomingClass.course;
            const s = upcomingClass.slot;
            const nombreCurso = c.asignatura || c.nombre || 'Curso';
            const seccion = c.seccion ? 'Secc. ' + c.seccion : '';
            const grado = c.grado || '';
            const slotKey = todayStr + '_upcoming_' + c.id + '_' + s.start;
            const tiempoMsg = upcomingClass.diffMinutes <= 60 
                ? 'inicia en ' + upcomingClass.diffMinutes + ' minuto(s)' 
                : 'programada para las ' + s.inicioStr;

            const agendaReminders = this.getTodaysAgendaReminders(c.id);

            return {
                isWeekend: false,
                saludo,
                saludoCompleto,
                iconoSaludo: '⏰',
                dayName,
                tipo: 'clase_proxima',
                slotKey: slotKey,
                bgGradient: 'linear-gradient(135deg, #0F172A 0%, #0369A1 60%, #0284C7 100%)',
                themeColor: '#0284C7',
                curso: c,
                cursoId: c.id,
                slot: s,
                titulo: saludoCompleto,
                subtituloHorario: dayName + ' • Próxima clase: ' + nombreCurso + ' (' + s.inicioStr + ' a ' + s.finStr + ')',
                badgeTexto: 'PRÓXIMA CLASE (' + s.inicioStr + ' - ' + s.finStr + ')',
                mensajeAsistente: '¡Hola! Soy <b>Tutor 360</b>. Tu próxima clase de hoy es <b>' + nombreCurso + '</b> (' + grado + (seccion ? ' ' + seccion : '') + '), la cual ' + tiempoMsg + '. Te sugiero preparar el material, la lista de asistencia y revisar tus compromisos de agenda:',
                agendaReminders: agendaReminders,
                accionTexto: 'Preparar ' + nombreCurso,
                accionIcono: 'book-open',
                accionTipo: 'curso'
            };
        }

        // Caso C: Clases de hoy finalizadas
        if (todaysClasses.length > 0) {
            const reminders = this.getTodaysAgendaReminders(null);
            return {
                isWeekend: false,
                saludo,
                saludoCompleto,
                iconoSaludo: '🌟',
                dayName,
                tipo: 'clases_finalizadas',
                slotKey: todayStr + '_ended',
                bgGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #475569 100%)',
                themeColor: '#475569',
                titulo: saludoCompleto,
                subtituloHorario: dayName + ' • Jornada de Clases Concluida',
                badgeTexto: 'JORNADA CONCLUIDA (' + dayName.toUpperCase() + ')',
                mensajeAsistente: '¡Excelente trabajo! Has completado tus ' + todaysClasses.length + ' clase(s) programadas para hoy ' + dayName + '. ¿Deseas revisar el Centro de Control o actualizar pendientes en la Agenda Escolar?',
                agendaReminders: reminders,
                accionTexto: 'Ver Centro de Control',
                accionIcono: 'layout-dashboard',
                accionTipo: 'panel',
                accionRuta: 'panel'
            };
        }

        // Caso D: Sin horario configurado para hoy
        const activeC = typeof Store !== 'undefined' && Store.getActiveCourse ? Store.getActiveCourse() : null;
        const reminders = this.getTodaysAgendaReminders(activeC ? activeC.id : null);
        return {
            isWeekend: false,
            saludo,
            saludoCompleto,
            iconoSaludo: '👋',
            dayName,
            tipo: 'sin_horario_hoy',
            slotKey: todayStr + '_nosched',
            bgGradient: bgGradient,
            themeColor: themeColor,
            titulo: saludoCompleto,
            subtituloHorario: dayName + ' • Día Lectivo General',
            badgeTexto: 'DÍA LECTIVO (' + dayName.toUpperCase() + ')',
            mensajeAsistente: activeC 
                ? 'Hoy ' + dayName + ' estás gestionando <b>' + (activeC.nombre || 'tu curso activo') + '</b>. Aquí tienes tus herramientas directas de gestión docente y agenda:'
                : 'Hoy es ' + dayName + '. Puedes acceder a tus cursos, consultar la agenda escolar o configurar tus horarios semanales:',
            curso: activeC,
            cursoId: activeC ? activeC.id : null,
            agendaReminders: reminders,
            accionTexto: activeC ? 'Continuar en ' + activeC.nombre : 'Ver Mis Cursos',
            accionIcono: 'book-open',
            accionTipo: activeC ? 'curso' : 'cursos',
            accionRuta: activeC ? 'panel' : 'cursos'
        };
    },

    openAction(route, courseId) {
        this.closeModal();
        this.closeReminder();
        if (courseId && typeof Store !== 'undefined' && Store.setActiveCourse) {
            Store.setActiveCourse(courseId, route);
        } else if (typeof Router !== 'undefined' && Router.navigate) {
            Router.navigate(route);
        }
    },

    openCourse(courseId) {
        this.openAction('panel', courseId);
    },

    openAgenda() {
        this.openAction('agenda', null);
    },

    closeModal() {
        if (this._currentGreetingSlotKey && this._notifiedClassStarts) {
            this._notifiedClassStarts[this._currentGreetingSlotKey] = true;
        }
        try {
            sessionStorage.removeItem('aula360_dismissed_slot');
            sessionStorage.removeItem('aula360_greeting_closed');
        } catch(e){}
        const el = document.getElementById('app-greeting-modal-backdrop');
        if (el) {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.2s ease';
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
        }
    },

    closeReminder() {
        const el = document.getElementById('app-class-change-reminder-card');
        if (el) {
            el.style.transform = 'translateY(20px)';
            el.style.opacity = '0';
            el.style.transition = 'all 0.25s ease';
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
        }
    },

    showGreetingModal(force = false) {
        if (!force && (typeof Store === 'undefined' || Store.data?.configPreferencias?.saludoOrientacionHoraria !== true)) {
            return;
        }
        const data = this.getGreetingData();
        const slotKey = data.slotKey || ('general_' + new Date().toISOString().split('T')[0]);
        this._currentGreetingSlotKey = slotKey;

        if (!force) {
            if (this._notifiedClassStarts && this._notifiedClassStarts[slotKey]) {
                return;
            }
        }
        if (!this._notifiedClassStarts) this._notifiedClassStarts = {};
        this._notifiedClassStarts[slotKey] = true;

        const existing = document.getElementById('app-greeting-modal-backdrop');
        if (existing) existing.remove();

        const fallbackCourse = (typeof Store !== 'undefined' && Store.getActiveCourse) ? Store.getActiveCourse() : null;
        const effectiveCourse = data.curso || fallbackCourse;
        const cId = data.cursoId || (effectiveCourse ? effectiveCourse.id : '');
        const hasCourse = !!data.cursoId;
        const nombreCurso = effectiveCourse ? (effectiveCourse.asignatura || effectiveCourse.nombre || 'Curso') : 'Curso';
        const now = new Date();
        const horaStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Agenda Reminders Box
        let agendaHtml = '';
        if (data.agendaReminders && data.agendaReminders.length > 0) {
            agendaHtml = '<div style="background:#EEF2FF; border:1.5px solid #C7D2FE; border-radius:14px; padding:12px 16px; margin-bottom:12px;">' +
                '<div style="font-size:11.5px; font-weight:800; color:#3730A3; display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">' +
                    '<span style="display:flex; align-items:center; gap:6px;"><span>📌</span><span>Compromisos de Agenda para Hoy</span></span>' +
                    '<button type="button" onclick="AppGreeting.openAction(\'agenda\', \'' + cId + '\')" style="background:none; border:none; color:#4F46E5; font-size:11px; font-weight:700; cursor:pointer; text-decoration:underline;">Ver Todo</button>' +
                '</div>' +
                '<div style="display:flex; flex-direction:column; gap:6px;">' +
                    data.agendaReminders.map(r => 
                        '<div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#1E1B4B; background:#FFFFFF; padding:6px 10px; border-radius:8px; border:1px solid #E0E7FF;">' +
                            '<span style="font-size:9.5px; font-weight:800; background:#E0E7FF; color:#4338CA; padding:2px 6px; border-radius:5px; text-transform:uppercase;">' + r.tipo + '</span>' +
                            '<span style="font-weight:600; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + r.titulo + '</span>' +
                        '</div>'
                    ).join('') +
                '</div>' +
            '</div>';
        } else {
            agendaHtml = '<div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:10px 14px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">' +
                '<div style="font-size:11.5px; color:#64748B; display:flex; align-items:center; gap:7px;">' +
                    '<span style="font-size:15px;">📅</span>' +
                    '<span><b>Agenda al día:</b> Sin compromisos ni entregas pendientes registradas para hoy.</span>' +
                '</div>' +
                '<button type="button" onclick="AppGreeting.openAction(\'agenda\', \'' + cId + '\')" style="background:#ECFDF5; border:1px solid #A7F3D0; color:#059669; font-size:11px; font-weight:700; padding:5px 12px; border-radius:8px; cursor:pointer; transition:all 0.15s;">Abrir Agenda</button>' +
            '</div>';
        }

        // 3 Acciones Más Comunes: Asistencia, Conducta y Cuadro Controlador (Siempre disponibles a 1 clic)
        const actionsGridHtml = 
            '<div style="margin-bottom:12px;">' +
                '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">' +
                    '<span style="font-size:10.5px; font-weight:800; color:#475569; letter-spacing:0.06em; text-transform:uppercase; display:flex; align-items:center; gap:6px;">' +
                        '<span>⚡</span><span>Acciones Frecuentes del Aula</span>' +
                    '</span>' +
                    '<span style="font-size:10px; color:#059669; font-weight:700; background:#ECFDF5; padding:2px 9px; border-radius:10px; border:1px solid #A7F3D0;">Acceso directo 1 clic</span>' +
                '</div>' +
                '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">' +
                    '<!-- 1. ASISTENCIA (Verde Esmeralda Fresco) -->' +
                    '<div onclick="AppGreeting.openAction(\'asistencia\', \'' + cId + '\')" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px; padding:12px 10px; cursor:pointer; transition:all 0.22s cubic-bezier(0.16,1,0.3,1); box-shadow:0 4px 14px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02); display:flex; flex-direction:column; align-items:center; text-align:center; gap:7px;" onmouseover="this.style.borderColor=\'#A7F3D0\'; this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 10px 22px -4px rgba(16,185,129,0.14)\';" onmouseout="this.style.borderColor=\'#E2E8F0\'; this.style.transform=\'none\'; this.style.boxShadow=\'0 4px 14px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02)\';">' +
                        '<div style="width:38px; height:38px; border-radius:12px; background:#ECFDF5; border:1px solid #A7F3D0; color:#059669; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' +
                            '<i data-lucide="user-check" style="width:19px; height:19px; stroke-width:2.2;"></i>' +
                        '</div>' +
                        '<div style="min-width:0; width:100%;">' +
                            '<div style="font-size:12px; font-weight:800; color:#0F172A; line-height:1.2;">Asistencia</div>' +
                            '<div style="font-size:9.5px; color:#64748B; font-weight:600; margin-top:2px;">Pase de lista</div>' +
                        '</div>' +
                    '</div>' +
                    '<!-- 2. CONDUCTA (Rosa Discreto) -->' +
                    '<div onclick="AppGreeting.openAction(\'conducta\', \'' + cId + '\')" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px; padding:12px 10px; cursor:pointer; transition:all 0.22s cubic-bezier(0.16,1,0.3,1); box-shadow:0 4px 14px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02); display:flex; flex-direction:column; align-items:center; text-align:center; gap:7px;" onmouseover="this.style.borderColor=\'#FBCFE8\'; this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 10px 22px -4px rgba(236,72,153,0.14)\';" onmouseout="this.style.borderColor=\'#E2E8F0\'; this.style.transform=\'none\'; this.style.boxShadow=\'0 4px 14px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02)\';">' +
                        '<div style="width:38px; height:38px; border-radius:12px; background:#FDF2F8; border:1px solid #FBCFE8; color:#DB2777; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' +
                            '<div style="display:flex; align-items:center; justify-content:center; gap:2px;">' +
                                '<i data-lucide="star" style="width:13px; height:13px; fill:#EC4899; color:#EC4899; stroke-width:1.5;"></i>' +
                                '<img src="mazo_juez.png" style="width:15px; height:15px; object-fit:contain;" onerror="this.style.display=\'none\'">' +
                            '</div>' +
                        '</div>' +
                        '<div style="min-width:0; width:100%;">' +
                            '<div style="font-size:12px; font-weight:800; color:#0F172A; line-height:1.2;">Conducta</div>' +
                            '<div style="font-size:9.5px; color:#64748B; font-weight:600; margin-top:2px;">Méritos y faltas</div>' +
                        '</div>' +
                    '</div>' +
                    '<!-- 3. CUADRO CONTROLADOR (Morado Discreto) -->' +
                    '<div onclick="AppGreeting.openAction(\'cuadro\', \'' + cId + '\')" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px; padding:12px 10px; cursor:pointer; transition:all 0.22s cubic-bezier(0.16,1,0.3,1); box-shadow:0 4px 14px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02); display:flex; flex-direction:column; align-items:center; text-align:center; gap:7px;" onmouseover="this.style.borderColor=\'#DDD6FE\'; this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 10px 22px -4px rgba(139,92,246,0.14)\';" onmouseout="this.style.borderColor=\'#E2E8F0\'; this.style.transform=\'none\'; this.style.boxShadow=\'0 4px 14px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.02)\';">' +
                        '<div style="width:38px; height:38px; border-radius:12px; background:#F5F3FF; border:1px solid #DDD6FE; color:#7C3AED; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' +
                            '<i data-lucide="layout-grid" style="width:19px; height:19px; stroke-width:2.2;"></i>' +
                        '</div>' +
                        '<div style="min-width:0; width:100%;">' +
                            '<div style="font-size:12px; font-weight:800; color:#0F172A; line-height:1.2;">Cuadro Controlador</div>' +
                            '<div style="font-size:9.5px; color:#64748B; font-weight:600; margin-top:2px;">Notas y actividades</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        const modalDiv = document.createElement('div');
        modalDiv.id = 'app-greeting-modal-backdrop';
        modalDiv.style.cssText = 'position:fixed; inset:0; z-index:9999999; background:rgba(15, 23, 42, 0.45); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeIn 0.25s ease;';
        
        modalDiv.innerHTML = '<div id="app-greeting-modal-card" style="background:#FFFFFF; border-radius:24px; box-shadow:0 28px 64px -12px rgba(15, 23, 42, 0.22), 0 0 0 1px #E2E8F0; max-width:560px; width:100%; max-height:calc(100vh - 40px); overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(148,163,184,0.3) transparent; border:none; font-family:\'Inter\',system-ui,sans-serif; text-align:left; animation:premiumIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);">' +
            '<!-- HERO HEADER CON TUTOR 360 (JERARQUÍA VERDE ESMERALDA FRESCO) -->' +
            '<div style="background:linear-gradient(135deg, #065F46 0%, #059669 52%, #10B981 100%); color:#ffffff; padding:16px 20px; position:relative; overflow:hidden;">' +
                '<!-- Top Meta Bar -->' +
                '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">' +
                    '<div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.14); backdrop-filter:blur(8px); padding:3px 10px; border-radius:20px; font-size:10px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; color:#ECFDF5; border:1px solid rgba(167,243,208,0.35);">' +
                        '<span style="width:6px; height:6px; border-radius:50%; background:#6EE7B7; box-shadow:0 0 8px #6EE7B7;"></span>' +
                        'TUTOR 360 &bull; COPILOTO DEL AULA' +
                    '</div>' +
                    '<div style="display:flex; align-items:center; gap:8px;">' +
                        '<div style="font-size:10.5px; font-weight:700; color:#ECFDF5; background:rgba(255,255,255,0.14); padding:3px 8px; border-radius:8px;">' +
                            '🕐 ' + horaStr +
                        '</div>' +
                        '<button type="button" onclick="AppGreeting.closeModal()" title="Cerrar modal" style="background:rgba(255,255,255,0.16); border:1px solid rgba(255,255,255,0.26); border-radius:50%; width:30px; height:30px; color:#ffffff; font-size:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.28)\';" onmouseout="this.style.background=\'rgba(255,255,255,0.16)\';">' +
                            '✕' +
                        '</button>' +
                    '</div>' +
                '</div>' +

                '<!-- Avatar & Saludo Principal -->' +
                '<div style="display:flex; align-items:center; gap:14px;">' +
                    '<div class="copilot-avatar-trigger" style="cursor:pointer; flex-shrink:0;" title="Tutor 360 - Copiloto del Aula" onclick="if(window.Tutor360) Tutor360.react(\'success\', 1800);">' +
                        '<div class="copilot-avatar-circle tutor360-reactive-avatar state-idle" style="width:52px; height:52px;"><div class="copilot-face copilot-face-front"><img src="assistant_avatar_head.png" alt="Tutor 360" class="copilot-avatar-standalone" /></div><div class="copilot-face copilot-face-back"><img src="assistant_avatar_head_wink.png" alt="Tutor 360" class="copilot-avatar-standalone" /></div></div><span class="copilot-beacon" title="En línea"></span>' +
                    '</div>' +

                    '<div style="flex:1; min-width:0;">' +
                        '<h3 style="font-size:20px; font-weight:900; line-height:1.25; margin:0; color:#FFFFFF; letter-spacing:-0.03em;">' +
                            data.titulo +
                        '</h3>' +
                        '<div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255, 255, 255, 0.15); border:1px solid rgba(167, 243, 208, 0.38); padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; color:#ECFDF5; margin-top:6px;">' +
                            '<span>📍</span><span>' + (data.subtituloHorario || data.badgeTexto) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            '<!-- CUERPO PRINCIPAL -->' +
            '<div style="padding:14px 20px 10px;">' +
                '<!-- Briefing Card del Copiloto -->' +
                '<div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:10px 14px; margin-bottom:12px; display:flex; gap:10px; align-items:flex-start; box-shadow:0 2px 6px rgba(15,23,42,0.02);">' +
                    '<div style="width:28px; height:28px; border-radius:8px; background:#ECFDF5; border:1px solid #D1FAE5; color:#059669; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">' +
                        '<i data-lucide="sparkles" style="width:15px; height:15px;"></i>' +
                    '</div>' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:10px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:2px;">' +
                            'Orientación Pedagógica del Copiloto' +
                        '</div>' +
                        '<div style="font-size:12px; color:#1E293B; line-height:1.45; font-weight:500;">' +
                            (data.mensajeAsistente || data.pregunta) +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<!-- Grid de 3 Acciones Frecuentes -->' +
                actionsGridHtml +

                '<!-- Recordatorios de Agenda -->' +
                agendaHtml +
            '</div>' +

            '<!-- FOOTER BAR CON BOTONES VIP -->' +
            '<div style="padding:10px 20px 16px; background:#F8FAFC; border-top:1px solid #E2E8F0; display:flex; flex-direction:column; gap:6px;">' +
                '<button type="button" onclick="AppGreeting.closeModal(); window.openAssistant();" style="background:#F5F3FF; border:1px solid #DDD6FE; color:#6D28D9; font-weight:800; font-size:12px; padding:9px 14px; border-radius:12px; width:100%; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 1px 3px rgba(139,92,246,0.06); transition:all 0.15s;">' +
                    '<span>🎓 Abrir Centro de Tutorías y Guías de Aula</span>' +
                '</button>' +
                (hasCourse ? 
                    '<button type="button" onclick="AppGreeting.openCourse(\'' + cId + '\')" style="background:linear-gradient(135deg, #059669 0%, #10B981 100%); color:#ffffff; font-weight:800; font-size:13px; padding:11px 18px; border-radius:12px; border:none; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.25); transition:all 0.18s;" onmouseover="this.style.transform=\'translateY(-1.5px)\'; this.style.boxShadow=\'0 6px 18px rgba(16,185,129,0.34)\';" onmouseout="this.style.transform=\'none\'; this.style.boxShadow=\'0 4px 14px rgba(16,185,129,0.25)\';">' +
                        '<span>Ingresar y Gestionar ' + nombreCurso + '</span>' +
                        '<span style="font-size:15px;">→</span>' +
                    '</button>'
                    :
                    '<button type="button" onclick="AppGreeting.closeModal()" style="background:linear-gradient(135deg, #059669 0%, #10B981 100%); color:#ffffff; font-weight:800; font-size:13px; padding:11px 18px; border-radius:12px; border:none; width:100%; display:flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.25); transition:all 0.18s;" onmouseover="this.style.transform=\'translateY(-1.5px)\'; this.style.boxShadow=\'0 6px 18px rgba(16,185,129,0.34)\';" onmouseout="this.style.transform=\'none\'; this.style.boxShadow=\'0 4px 14px rgba(16,185,129,0.25)\';">' +
                        '<span>Ir al Centro de Control</span>' +
                        '<span style="font-size:15px;">→</span>' +
                    '</button>'
                ) +
                '<div style="display:flex; align-items:center; justify-content:center; gap:4px; margin-top:6px; padding-top:8px; border-top:1px dashed #E2E8F0;">' +
                    '<button type="button" onclick="AppGreeting.openGreetingSettings()" title="Ir a Configuración" style="background:transparent; border:none; color:#64748B; font-weight:600; font-size:11.5px; padding:6px 10px; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.background=\'#F1F5F9\'; this.style.color=\'#0F172A\';" onmouseout="this.style.background=\'transparent\'; this.style.color=\'#64748B\';">' +
                        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
                        '<span>Ajustes</span>' +
                    '</button>' +
                    '<span style="width:3px; height:3px; border-radius:50%; background:#CBD5E1;"></span>' +
                    '<button type="button" onclick="AppGreeting.disableGreetingModal()" title="No abrir el Tutor 360 automáticamente al iniciar" style="background:transparent; border:none; color:#64748B; font-weight:600; font-size:11.5px; padding:6px 10px; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.background=\'#F1F5F9\'; this.style.color=\'#0F172A\';" onmouseout="this.style.background=\'transparent\'; this.style.color=\'#64748B\';">' +
                        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
                        '<span>No mostrar al iniciar</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';

        modalDiv.onclick = function(e) {
            if (e.target === modalDiv) AppGreeting.closeModal();
        };

        const onEsc = function(e) {
            if (e.key === 'Escape') {
                AppGreeting.closeModal();
                document.removeEventListener('keydown', onEsc);
            }
        };
        document.addEventListener('keydown', onEsc);

        document.body.appendChild(modalDiv);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons({ root: modalDiv }); } catch(e) {}
        }
    },

    showClassChangeReminder(currentClass, nextClass, minsRemaining) {
        if (typeof Store !== 'undefined' && Store.data?.configPreferencias?.recordatorioCambioClase === false) {
            return;
        }
        const curCourse = currentClass.course;
        const curSlot = currentClass.slot;
        const nombreActual = curCourse.asignatura || curCourse.nombre || 'Curso actual';
        const gradoActual = (curCourse.grado || '') + (curCourse.seccion ? ' Secc. ' + curCourse.seccion : '');
        
        let proximaInfoHtml = '';
        let accionBtnHtml = '';

        if (nextClass) {
            const nextCourse = nextClass.course;
            const nextSlot = nextClass.slot;
            const nombreProx = nextCourse.asignatura || nextCourse.nombre || 'Próximo curso';
            const gradoProx = (nextCourse.grado || '') + (nextCourse.seccion ? ' Secc. ' + nextCourse.seccion : '');
            
            proximaInfoHtml = '<div style="margin-top:10px; padding:9px 12px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; font-size:12px; color:#1E40AF; line-height:1.45; display:flex; align-items:center; gap:8px;">' +
                '<span style="font-size:16px;">📚</span>' +
                '<div><b>Próxima clase:</b> A las <b>' + nextSlot.inicioStr + '</b> corresponde impartir <b>' + nombreProx + '</b> (' + gradoProx + ').</div>' +
            '</div>';

            accionBtnHtml = '<button type="button" onclick="AppGreeting.openCourse(\'' + nextCourse.id + '\')" style="background:linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color:#FFFFFF; border:none; font-weight:800; font-size:12.5px; padding:10px 14px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(2,132,199,0.3);">' +
                '<span>Preparar ' + nombreProx + ' (' + (nextCourse.grado || '') + ')</span>' +
                '<span>→</span>' +
            '</button>';
        }

        if (typeof UI !== 'undefined' && UI.playSound) {
            UI.playSound('info');
        }

        try {
            if (window.Notification && Notification.permission === 'granted') {
                const notifBody = nextClass 
                    ? `En ${minsRemaining} min (${curSlot.finStr}) finaliza ${nombreActual}. Próxima clase: ${nextClass.course.asignatura} a las ${nextClass.slot.inicioStr}. Efectúa el cierre pedagógico.`
                    : `En ${minsRemaining} min (${curSlot.finStr}) finaliza ${nombreActual}. Efectúa el cierre de actividades pedagógicas.`;
                new Notification('⏰ Aula 360 · Cambio de Clase en ' + minsRemaining + ' min', {
                    body: notifBody,
                    icon: 'logo-192.png'
                });
            }
        } catch (e) {}

        const existingCard = document.getElementById('app-class-change-reminder-card');
        if (existingCard) existingCard.remove();

        const card = document.createElement('div');
        card.id = 'app-class-change-reminder-card';
        card.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999999; max-width:440px; width:calc(100% - 32px); background:#FFFFFF; border-radius:16px; box-shadow:0 20px 45px -10px rgba(15,23,42,0.35); border:1.5px solid #FCD34D; overflow:hidden; font-family:Inter,system-ui,sans-serif; animation:reminderSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);';

        card.innerHTML = 
            '<!-- HEADER ALERTA PEDAGÓGICA (TUTOR 360) -->' +
            '<div style="background:linear-gradient(135deg, #1E1B4B 0%, #312E81 52%, #3B82F6 100%); color:#FFFFFF; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; gap:10px;">' +
                '<div style="display:flex; align-items:center; gap:10px;">' +
                    '<div style="flex-shrink:0;">' +
                        '<div class="copilot-avatar-circle tutor360-reactive-avatar state-idle" style="width:36px; height:36px;"><div class="copilot-face copilot-face-front"><img src="assistant_avatar_head.png" alt="Tutor 360" class="copilot-avatar-standalone" /></div><div class="copilot-face copilot-face-back"><img src="assistant_avatar_head_wink.png" alt="Tutor 360" class="copilot-avatar-standalone" /></div></div>' +
                    '</div>' +
                    '<div>' +
                        '<div style="font-size:11px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; color:#A7F3D0;">Tutor 360 &bull; Cierre Pedagógico</div>' +
                        '<div style="font-size:13.5px; font-weight:800; line-height:1.2;">Cambio de Curso en ' + minsRemaining + ' min (' + curSlot.finStr + ')</div>' +
                    '</div>' +
                '</div>' +
                '<button type="button" onclick="AppGreeting.closeReminder()" title="Descartar" style="background:rgba(255,255,255,0.2); border:none; border-radius:50%; width:28px; height:28px; color:#FFFFFF; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center;">' +
                    '✕' +
                '</button>' +
            '</div>' +

            '<!-- CUERPO DE RECOMENDACIÓN PEDAGÓGICA -->' +
            '<div style="padding:16px 18px 14px;">' +
                '<div style="font-size:13px; color:#1E293B; line-height:1.5; font-weight:500;">' +
                    'Profesor(a), restan <b>' + minsRemaining + ' minutos</b> para finalizar la clase de <b>' + nombreActual + '</b>' + (gradoActual ? ' (' + gradoActual + ')' : '') + '.' +
                '</div>' +
                '<div style="margin-top:10px; padding:10px 12px; background:#FEF3C7; border:1px solid #FDE68A; border-radius:10px; font-size:12px; color:#92400E; line-height:1.45;">' +
                    '💡 <b>Sugerencia:</b> Proceda a efectuar el <b>cierre de actividades</b>, aclarar dudas de los estudiantes y asegurar el registro de asistencias o acumulativos de esta sesión.' +
                '</div>' +
                proximaInfoHtml +
            '</div>' +

            '<!-- BOTONES DE ACCIÓN -->' +
            '<div style="padding:10px 18px 14px; background:#F8FAFC; border-top:1px solid #F1F5F9; display:flex; flex-direction:column; gap:8px;">' +
                accionBtnHtml +
                '<button type="button" onclick="AppGreeting.closeReminder()" style="background:none; border:none; color:#64748B; font-weight:700; font-size:11.5px; padding:6px; cursor:pointer; text-align:center;">' +
                    'Entendido, cerrando sesión con el curso actual' +
                '</button>' +
            '</div>';

        document.body.appendChild(card);
    },

    getOmittedClassesToday(dateStr) {
        const now = new Date();
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const targetDate = dateStr || now.toISOString().split('T')[0];
        const todaysClasses = this.getTodaysClasses(now);
        if (!todaysClasses || todaysClasses.length === 0) return [];

        const allAttendance = (typeof Store !== 'undefined' ? Store.get('asistencia') : []) || [];
        const omittedMap = new Map();

        todaysClasses.forEach(cl => {
            const s = cl.slot;
            // Si la clase ya terminó o faltan 5 minutos o menos para su fin
            if (currentMin >= (s.end - 5)) {
                const course = cl.course;
                if (!course || !course.id) return;

                const records = allAttendance.filter(a => a.cursoId === course.id && a.fecha === targetDate);
                if (records.length === 0) {
                    if (!omittedMap.has(course.id)) {
                        omittedMap.set(course.id, {
                            course: course,
                            slots: [s],
                            dateStr: targetDate
                        });
                    } else {
                        omittedMap.get(course.id).slots.push(s);
                    }
                }
            }
        });

        return Array.from(omittedMap.values());
    },

    showAttendanceOmissionAlert(dateStr) {
        const omittedList = this.getOmittedClassesToday(dateStr);
        if (!omittedList || omittedList.length === 0) {
            this.closeOmissionAlert();
            return;
        }

        const existingAlert = document.getElementById('app-attendance-omission-alert');
        if (existingAlert) existingAlert.remove();

        if (typeof UI !== 'undefined' && UI.playSound) {
            UI.playSound('warning');
        }

        const totalPendientes = omittedList.length;

        try {
            if (window.Notification && Notification.permission === 'granted') {
                new Notification('⚠️ Control de Asistencia Pendiente (Falta Leve)', {
                    body: `Tiene ${totalPendientes} clase(s) de hoy que concluyeron sin registrar asistencia según normativa SEDUC.`,
                    icon: 'logo-192.png'
                });
            }
        } catch(e) {}

        const card = document.createElement('div');
        card.id = 'app-attendance-omission-alert';
        card.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:99999999; max-width:480px; width:calc(100% - 32px); background:#FFFFFF; border-radius:18px; box-shadow:0 22px 50px -10px rgba(185,28,28,0.35), 0 0 0 1px rgba(239,68,68,0.25); border:2px solid #EF4444; overflow:hidden; font-family:Inter,system-ui,sans-serif; animation:reminderSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);';

        let coursesListHtml = '';
        omittedList.forEach((item) => {
            const curCourse = item.course;
            const cId = curCourse.id;
            const nombreCurso = curCourse.asignatura || curCourse.nombre || 'Curso';
            const gradoSec = (curCourse.grado || '') + (curCourse.seccion ? ' · Secc. ' + curCourse.seccion : '');
            
            let horarioStr = '';
            if (item.slots && item.slots.length > 0) {
                const firstSlot = item.slots[0];
                const lastSlot = item.slots[item.slots.length - 1];
                horarioStr = `${firstSlot.inicioStr || ''} - ${lastSlot.finStr || ''}`;
            }

            coursesListHtml += `
                <div id="omission-course-row-${cId}" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; background:#FEF2F2; border:1px solid #FECACA; border-radius:10px; margin-bottom:8px; transition:all 0.25s ease;">
                    <div style="min-width:0; flex:1;">
                        <div style="font-size:12.5px; font-weight:800; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${nombreCurso} <span style="font-size:11.5px; font-weight:600; color:#64748B;">(${gradoSec})</span>
                        </div>
                        <div style="font-size:11px; font-weight:700; color:#DC2626; display:flex; align-items:center; gap:4px; margin-top:2px;">
                            <span>🕐 ${horarioStr || 'Horario de hoy'}</span>
                            <span style="font-size:9.5px; background:#FEE2E2; color:#991B1B; padding:1px 5px; border-radius:4px; font-weight:800;">Sin lista</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button type="button" onclick="AppGreeting.resolveOmissionPassList('${cId}', '${item.dateStr}')" title="Abrir y pasar lista" style="background:#FFFFFF; color:#0F172A; border:1px solid #CBD5E1; font-weight:800; font-size:11px; padding:6px 9px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 1px 2px rgba(0,0,0,0.04);">
                            <span>📋 Pasar Lista</span>
                        </button>
                        <button type="button" onclick="AppGreeting.resolveOmissionAllPresent('${cId}', '${item.dateStr}')" title="Marcar todos los alumnos como presentes en esta clase" style="background:#10B981; color:#FFFFFF; border:none; font-weight:800; font-size:11px; padding:6px 9px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:4px; box-shadow:0 2px 6px rgba(16,185,129,0.3);">
                            <span>⚡ Presentes</span>
                        </button>
                    </div>
                </div>
            `;
        });

        let bulkActionsHtml = '';
        if (totalPendientes > 1) {
            bulkActionsHtml = `
                <button type="button" onclick="AppGreeting.resolveAllOmissionsAllPresent('${dateStr}')" style="background:linear-gradient(135deg, #10B981 0%, #059669 100%); color:#FFFFFF; border:none; font-weight:800; font-size:12px; padding:11px 14px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 3px 10px rgba(16,185,129,0.35); width:100%;">
                    <span>⚡ Marcar Todos Presentes en las ${totalPendientes} Clases</span>
                </button>
            `;
        }

        card.innerHTML = 
            '<!-- HEADER ALERTA OFICIAL SEDUC -->' +
            '<div style="background:linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #DC2626 100%); color:#FFFFFF; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; gap:10px;">' +
                '<div style="display:flex; align-items:center; gap:10px;">' +
                    '<div style="width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px;">' +
                        '⚖️' +
                    '</div>' +
                    '<div>' +
                        '<div style="font-size:10.5px; font-weight:800; letter-spacing:0.6px; text-transform:uppercase; color:#FCA5A5;">Aviso Normativo SEDUC &bull; Estatuto Docente</div>' +
                        '<div style="font-size:13.5px; font-weight:900; line-height:1.2; color:#FFFFFF; display:flex; align-items:center; gap:6px;">' +
                            '<span>Asistencia Pendiente (Falta Leve)</span>' +
                            '<span id="omission-badge-count" style="font-size:11px; background:#EF4444; border:1px solid rgba(255,255,255,0.4); padding:1px 6px; border-radius:10px;">' + totalPendientes + ' ' + (totalPendientes === 1 ? 'curso' : 'cursos') + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<button type="button" onclick="AppGreeting.closeOmissionAlert()" title="Descartar" style="background:rgba(255,255,255,0.2); border:none; border-radius:50%; width:28px; height:28px; color:#FFFFFF; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center;">' +
                    '✕' +
                '</button>' +
            '</div>' +

            '<!-- CUERPO DE LA ADVERTENCIA -->' +
            '<div style="padding:14px 16px 10px;">' +
                '<div style="font-size:12.5px; color:#0F172A; line-height:1.45; font-weight:600; margin-bottom:10px;">' +
                    'Profesor(a), los siguientes cursos <b>concluyeron su jornada de hoy sin registrar asistencia</b> de los estudiantes:' +
                '</div>' +
                '<div style="max-height:220px; overflow-y:auto; padding-right:2px; margin-bottom:10px;" id="omission-courses-container">' +
                    coursesListHtml +
                '</div>' +
                '<div style="padding:8px 10px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; font-size:11px; color:#92400E; line-height:1.4;">' +
                    '⚠️ <b>Obligación Formal:</b> Omitir el pase de lista está catalogado como <b>falta leve</b> en el régimen disciplinario docente hondureño. Registre la asistencia para evitar requerimientos.' +
                '</div>' +
            '</div>' +

            '<!-- BOTONES DE ACCIÓN RÁPIDA -->' +
            '<div style="padding:10px 16px 14px; background:#F8FAFC; border-top:1px solid #F1F5F9; display:flex; flex-direction:column; gap:8px;">' +
                bulkActionsHtml +
                '<button type="button" onclick="AppGreeting.closeOmissionAlert()" style="background:#FFFFFF; border:1px solid #E2E8F0; color:#334155; font-weight:700; font-size:12px; padding:9px 14px; border-radius:10px; cursor:pointer; width:100%; transition:all 0.15s;" onmouseover="this.style.background=\'#F1F5F9\';" onmouseout="this.style.background=\'#FFFFFF\';">' +
                    'Recordarme más tarde' +
                '</button>' +
                '<div style="display:flex; align-items:center; justify-content:center; gap:4px; padding-top:6px; border-top:1px dashed #E2E8F0;">' +
                    '<button type="button" onclick="AppGreeting.openOmissionSettings()" title="Abrir la configuración de la regla de asistencia" style="background:transparent; border:none; color:#64748B; font-weight:600; font-size:11.5px; padding:6px 10px; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.background=\'#F1F5F9\'; this.style.color=\'#0F172A\';" onmouseout="this.style.background=\'transparent\'; this.style.color=\'#64748B\';">' +
                        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
                        '<span>Ajustes</span>' +
                    '</button>' +
                    '<span style="width:3px; height:3px; border-radius:50%; background:#CBD5E1;"></span>' +
                    '<button type="button" onclick="AppGreeting.disableOmissionAlerts()" title="Dejar de mostrar este aviso (puede reactivarlo en Asistencia → Regla de Asistencia)" style="background:transparent; border:none; color:#64748B; font-weight:600; font-size:11.5px; padding:6px 10px; border-radius:8px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.background=\'#F1F5F9\'; this.style.color=\'#0F172A\';" onmouseout="this.style.background=\'transparent\'; this.style.color=\'#64748B\';">' +
                        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
                        '<span>Desactivar aviso</span>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(card);
    },

    closeOmissionAlert() {
        const el = document.getElementById('app-attendance-omission-alert');
        if (el) {
            el.style.transform = 'translateY(20px)';
            el.style.opacity = '0';
            el.style.transition = 'all 0.25s ease';
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
        }
    },

    openOmissionSettings() {
        this.closeOmissionAlert();
        setTimeout(() => {
            if (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.promptAttendanceRuleModal === 'function') {
                Views.Asistencia.promptAttendanceRuleModal(true);
            }
        }, 260);
    },

    disableOmissionAlerts() {
        const apply = () => {
            if (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.saveConfig === 'function') {
                Views.Asistencia.saveConfig({ alertarOmision: false });
            }
            this.closeOmissionAlert();
            if (typeof UI !== 'undefined' && UI.toast) {
                UI.toast('Aviso de asistencia pendiente desactivado. Puede reactivarlo en Asistencia → Regla de Asistencia.', 'success');
            }
        };
        const msg = '¿Desea dejar de recibir el aviso de <b>Asistencia Pendiente</b>?<br><br><span style="color:#64748B; font-size:12.5px;">Podrá reactivarlo cuando quiera desde <b>Asistencia → Regla de Asistencia</b>.</span>';
        this.closeOmissionAlert();
        setTimeout(() => {
            if (typeof UI !== 'undefined' && typeof UI.confirm === 'function') UI.confirm(msg, apply);
            else if (window.confirm('¿Desea dejar de recibir el aviso de Asistencia Pendiente?')) apply();
        }, 260);
    },

    disableGreetingModal() {
        const apply = () => {
            if (typeof Store !== 'undefined' && Store.data) {
                if (!Store.data.configPreferencias) Store.data.configPreferencias = {};
                Store.data.configPreferencias.saludoOrientacionHoraria = false;
                if (typeof Store.save === 'function') Store.save();
            }
            if (typeof UI !== 'undefined' && UI.toast) {
                UI.toast('El Tutor 360 ya no se abrirá automáticamente al iniciar.', 'success');
            }
        };
        const msg = '¿Desea que el <b>Tutor 360</b> ya no aparezca automáticamente al abrir la aplicación?<br><br><span style="color:#64748B; font-size:12.5px;">Podrá seguir abriéndolo desde su botón y reactivarlo en <b>Configuración → Automatización Inteligente</b>.</span>';
        this.closeModal();
        setTimeout(() => {
            if (typeof UI !== 'undefined' && typeof UI.confirm === 'function') UI.confirm(msg, apply);
            else if (window.confirm('¿Desea que el Tutor 360 ya no aparezca al iniciar?')) apply();
        }, 260);
    },

    openGreetingSettings() {
        this.closeModal();
        setTimeout(() => {
            if (typeof Router !== 'undefined' && Router.navigate) Router.navigate('config');
        }, 200);
    },

    resolveOmissionPassList(courseId, dateStr) {
        this.closeOmissionAlert();
        if (typeof Store !== 'undefined' && Store.setActiveCourse) {
            Store.setActiveCourse(courseId, 'asistencia');
        } else if (typeof Router !== 'undefined' && Router.navigate) {
            Router.navigate('asistencia');
        }
        setTimeout(() => {
            if (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.openDailyAttendance === 'function') {
                Views.Asistencia.openDailyAttendance(dateStr);
            }
        }, 300);
    },

    resolveOmissionAllPresent(courseId, dateStr) {
        if (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.executeAutoAttendanceForCourse === 'function') {
            Views.Asistencia.executeAutoAttendanceForCourse(courseId, dateStr);
        }

        const row = document.getElementById('omission-course-row-' + courseId);
        if (row) {
            row.style.opacity = '0';
            row.style.transform = 'translateX(20px)';
            setTimeout(() => {
                if (row.parentNode) row.parentNode.removeChild(row);
                const remaining = this.getOmittedClassesToday(dateStr);
                const badge = document.getElementById('omission-badge-count');
                if (badge) {
                    badge.textContent = remaining.length + ' ' + (remaining.length === 1 ? 'curso' : 'cursos');
                }
                if (remaining.length === 0) {
                    if (typeof UI !== 'undefined' && UI.toast) {
                        UI.toast('¡Excelente! Todas las asistencias del día han sido registradas.', 'success');
                    }
                    this.closeOmissionAlert();
                }
            }, 250);
        } else {
            const remaining = this.getOmittedClassesToday(dateStr);
            if (remaining.length === 0) {
                this.closeOmissionAlert();
            }
        }
    },

    resolveAllOmissionsAllPresent(dateStr) {
        const remaining = this.getOmittedClassesToday(dateStr);
        if (!remaining || remaining.length === 0) {
            this.closeOmissionAlert();
            return;
        }

        let totalCourses = 0;
        remaining.forEach(item => {
            if (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.executeAutoAttendanceForCourse === 'function') {
                Views.Asistencia.executeAutoAttendanceForCourse(item.course.id, item.dateStr || dateStr);
                totalCourses++;
            }
        });

        if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast(`¡Excelente! Se registró asistencia completa en los ${totalCourses} cursos pendientes.`, 'success');
        }
        this.closeOmissionAlert();
    },

    checkClassTransitions() {
        if (typeof document !== 'undefined' && document.hidden) return;
        const now = new Date();
        const currentMin = now.getHours() * 60 + now.getMinutes();
        const todayStr = now.toISOString().split('T')[0];
        const todaysClasses = this.getTodaysClasses(now);

        if (!todaysClasses || todaysClasses.length === 0) return;

        const configAsistencia = (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.getConfig === 'function')
            ? Views.Asistencia.getConfig()
            : (Store.data && Store.data.configAsistencia ? Store.data.configAsistencia : { autoPresente: false, alertarOmision: true });

        // 0. Si aún no se ha presentado la regla al docente, invocar la consulta de forma no intrusiva
        if (!configAsistencia.promptShown && typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.promptAttendanceRuleModal === 'function') {
            const modalOpen = document.getElementById('modal-overlay')?.classList.contains('open') || document.getElementById('app-greeting-modal-backdrop');
            if (!modalOpen && !this._attendancePromptTimer) {
                this._attendancePromptTimer = setTimeout(() => {
                    Views.Asistencia.promptAttendanceRuleModal(false);
                }, 1200);
            }
        }

        // 1. Detección automática al iniciar una nueva clase activa
        const currentClass = todaysClasses.find(cl => cl.isCurrent);
        if (currentClass) {
            const slotKey = todayStr + '_' + currentClass.course.id + '_' + currentClass.slot.start + '_' + currentClass.slot.end;
            if (!this._notifiedClassStarts[slotKey]) {
                this._notifiedClassStarts[slotKey] = true;
                this.showGreetingModal(false);
            }

            // Regla de Asistencia Automática Inteligente por Horario
            if (configAsistencia.autoPresente === true) {
                if (!this._notifiedAutoAttendance) this._notifiedAutoAttendance = {};
                const autoKey = 'auto_' + todayStr + '_' + currentClass.course.id;
                if (!this._notifiedAutoAttendance[autoKey]) {
                    const existingAtt = (Store.get('asistencia') || []).filter(a => a.cursoId === currentClass.course.id && a.fecha === todayStr);
                    if (existingAtt.length === 0) {
                        this._notifiedAutoAttendance[autoKey] = true;
                        if (typeof Views !== 'undefined' && Views.Asistencia && typeof Views.Asistencia.executeAutoAttendanceForCourse === 'function') {
                            Views.Asistencia.executeAutoAttendanceForCourse(currentClass.course.id, todayStr);
                        }
                    }
                }
            }
        }

        // 2. Alerta 5 minutos antes del final de la clase (cierre pedagógico)
        todaysClasses.forEach(cl => {
            const s = cl.slot;
            const minsRemaining = s.end - currentMin;
            if (currentMin >= s.start && minsRemaining <= 5 && minsRemaining > 0) {
                const reminderKey = todayStr + '_' + cl.course.id + '_' + s.end;
                if (!this._notifiedReminders[reminderKey]) {
                    this._notifiedReminders[reminderKey] = true;
                    const nextClass = todaysClasses.find(other => other.slot.start >= s.end);
                    this.showClassChangeReminder(cl, nextClass, minsRemaining);
                }
            }
        });

        // 3. Alerta Normativa SEDUC (Falta Leve): Cursos atendidos que terminaron sin pasar asistencia
        if (configAsistencia.alertarOmision !== false) {
            const omitted = this.getOmittedClassesToday(todayStr);
            if (omitted && omitted.length > 0) {
                if (!this._notifiedOmittedAttendance) this._notifiedOmittedAttendance = {};
                const omitSignature = todayStr + '_' + omitted.map(o => o.course.id).sort().join('_');
                const lastNotified = this._notifiedOmittedAttendance[omitSignature];
                // Recordar si es la primera vez o cada 15 minutos si persiste
                if (!lastNotified || (Date.now() - lastNotified > 15 * 60 * 1000)) {
                    this._notifiedOmittedAttendance[omitSignature] = Date.now();
                    this.showAttendanceOmissionAlert(todayStr);
                }
            } else {
                const existing = document.getElementById('app-attendance-omission-alert');
                if (existing) this.closeOmissionAlert();
            }
        }
    },

    initScheduleWatcher() {
        if (this._watcherInterval) return;
        setTimeout(() => {
            if (!document.hidden) this.checkClassTransitions();
        }, 1500);
        // Revisar cada 60 segundos únicamente cuando la pantalla está encendida y activa
        this._watcherInterval = setInterval(() => {
            if (!document.hidden) this.checkClassTransitions();
        }, 60000);

        if (!this._visibilityWatcherBound && typeof document !== 'undefined') {
            this._visibilityWatcherBound = true;
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    // Detener por completo el temporizador al bloquear la pantalla o minimizar la app (0% consumo de batería)
                    if (this._watcherInterval) {
                        clearInterval(this._watcherInterval);
                        this._watcherInterval = null;
                    }
                } else {
                    // Al encender la pantalla o volver a la app, verificar estado actual y reanudar ciclo de 60s
                    this.checkClassTransitions();
                    if (!this._watcherInterval) {
                        this._watcherInterval = setInterval(() => {
                            if (!document.hidden) this.checkClassTransitions();
                        }, 60000);
                    }
                }
            });
        }
    },

    checkAndPromptOnStartup() {
        try {
            /* Notification permission requested only on explicit user action */
        } catch (e) {}

        this.initScheduleWatcher();
        if (typeof Store === 'undefined' || Store.data?.configPreferencias?.saludoOrientacionHoraria !== false) {
            this.showGreetingModal(false);
        }
    }
};

    if (typeof window !== 'undefined') {
        window.AppGreeting = AppGreeting;
        try {
            AppGreeting.initScheduleWatcher();
        } catch(e) {}
    }

    return AppGreeting;
}));
