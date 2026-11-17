Views.PruebasFormativas = {
    state: {
        mes: 'all',
        rightOpen: false
    },

    isApplicableSubject: function(course) {
        if (!course) return false;
        var name = (course.asignatura || course.nombre || course.materia || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        var valid = [
            'espanol', 'lengua', 'literatura', 'lectura', 'comunicacion',
            'matematica', 'matematicas', 'aritmetica', 'algebra', 'geometria',
            'ciencias naturales', 'naturales', 'biologia', 'fisica', 'quimica',
            'ciencias sociales', 'sociales', 'estudios sociales', 'historia', 'geografia', 'civica'
        ];
        return valid.some(function(v) { return name.indexOf(v) !== -1; });
    },

    getSubjectCategory: function(course) {
        if (!course) return 'Asignatura';
        var name = (course.asignatura || course.nombre || course.materia || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (name.indexOf('espanol') !== -1 || name.indexOf('lengua') !== -1 || name.indexOf('literatura') !== -1 || name.indexOf('lectura') !== -1 || name.indexOf('comunicacion') !== -1) return 'Español';
        if (name.indexOf('matemat') !== -1 || name.indexOf('aritmet') !== -1 || name.indexOf('algebra') !== -1 || name.indexOf('geomet') !== -1) return 'Matemáticas';
        if (name.indexOf('natural') !== -1 || name.indexOf('biolog') !== -1 || name.indexOf('fisic') !== -1 || name.indexOf('quimic') !== -1) return 'Ciencias Naturales';
        if (name.indexOf('social') !== -1 || name.indexOf('historia') !== -1 || name.indexOf('geograf') !== -1 || name.indexOf('civic') !== -1) return 'Ciencias Sociales';
        return course.asignatura || course.nombre || 'Asignatura';
    },

    renderNonApplicable: function(course) {
        var allCourses = Store.data.cursos || [];
        var self = this;
        var applicableCourses = allCourses.filter(function(c) {
            return self.isApplicableSubject(c);
        });

        var coursesButtons = '';
        if (applicableCourses.length > 0) {
            coursesButtons = '<div style="margin-top: 24px;">' +
                '<div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.03em;">Cambiar a un curso aplicable:</div>' +
                '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">' +
                applicableCourses.map(function(c) {
                    var cat = self.getSubjectCategory(c);
                    return '<button onclick="Store.setActiveCourse(\'' + c.id + '\'); Router.navigate(\'pruebas-formativas\');" ' +
                        'class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:8px; font-weight:700; padding:10px 16px; border-radius:6px; background:#0284c7; border:1px solid #0369a1; box-shadow:0 2px 4px rgba(2,132,199,0.2);">' +
                        '<i data-lucide="book-open" style="width:16px; height:16px;"></i> ' + (c.asignatura || c.nombre) + ' (' + (c.grado || '') + ' ' + (c.seccion || '') + ') &bull; ' + cat +
                    '</button>';
                }).join('') +
                '</div></div>';
        } else {
            coursesButtons = '<div style="margin-top: 20px; font-size: 13px; color: #64748b; background:#f1f5f9; padding:12px; border-radius:6px; border:1px solid #cbd5e1;">No tienes cursos activos registrados en Español, Matemáticas, Ciencias Naturales o Ciencias Sociales.</div>';
        }

        return '<div class="c1-wrap" style="background:#f8fafc; min-height: 80vh; padding:40px 20px; font-family:\'Inter\', sans-serif;">' +
            '<div style="max-width: 640px; margin: 40px auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 36px 28px; text-align: center; box-shadow: 0 4px 12px rgba(15,23,42,0.06);">' +
                '<div style="width: 64px; height: 64px; background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 8px; display: grid; place-items: center; margin: 0 auto 18px; color: #dc2626;">' +
                    '<i data-lucide="alert-triangle" style="width:32px; height:32px;"></i>' +
                '</div>' +
                '<div style="font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Módulo No Aplicable para ' + (course.asignatura || course.nombre || 'este curso') + '</div>' +
                '<div style="font-size: 13.5px; color: #475569; line-height: 1.6; max-width: 520px; margin: 0 auto 18px;">' +
                    'De acuerdo con las directrices de la Secretaría de Educación (SEDUC), las <b>Pruebas Formativas</b> se aplican exclusivamente a las 4 áreas básicas:' +
                '</div>' +
                '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 24px;">' +
                    '<span style="background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 4px; border: 1px solid #bae6fd;">Español</span>' +
                    '<span style="background: #f0fdf4; color: #15803d; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 4px; border: 1px solid #bbf7d0;">Matemáticas</span>' +
                    '<span style="background: #fefce8; color: #a16207; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 4px; border: 1px solid #fef08a;">Ciencias Naturales</span>' +
                    '<span style="background: #faf5ff; color: #7e22ce; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 4px; border: 1px solid #e9d5ff;">Ciencias Sociales</span>' +
                '</div>' +
                coursesButtons +
            '</div>' +
        '</div>';
    },
    
    _key: function(mes, courseId) {
        var m = mes || this.state.mes || 'Febrero/Marzo';
        var cId = courseId || (Store.data && Store.data.activeCourseId) || 'none';
        return 'pruebas_formativas_' + cId + '_' + String(m).replace(/\//g, '-');
    },

    getData: function(mes, courseId) {
        var key = this._key(mes, courseId);
        // 1. Intentar desde Store.data.pruebasFormativas (Sincronizado con IndexedDB y Respaldos)
        if (Store.data && Store.data.pruebasFormativas && typeof Store.data.pruebasFormativas === 'object') {
            if (Store.data.pruebasFormativas[key]) {
                return Store.data.pruebasFormativas[key];
            }
        }
        // 2. Intentar desde localStorage (legacy)
        try {
            var raw = localStorage.getItem(key);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Store.data) {
                    if (!Store.data.pruebasFormativas || Array.isArray(Store.data.pruebasFormativas)) {
                        Store.data.pruebasFormativas = {};
                    }
                    Store.data.pruebasFormativas[key] = parsed;
                }
                return parsed;
            }
        } catch(e) {}
        return null;
    },

    saveData: function(data, mes, courseId) {
        var key = this._key(mes, courseId);
        // 1. Guardar en localStorage para compatibilidad
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch(e) {
            console.error('Error al guardar en localStorage pruebas_formativas:', e);
        }
        // 2. Guardar en Store.data para que forme parte del RESPALDO GLOBAL y de IndexedDB
        if (Store.data) {
            if (!Store.data.pruebasFormativas || Array.isArray(Store.data.pruebasFormativas)) {
                Store.data.pruebasFormativas = {};
            }
            Store.data.pruebasFormativas[key] = data;
            Store.save();
        }
    },

    // Escáner inteligente para recuperar datos huérfanos de pruebas formativas
    scanAndRecoverLostData: function() {
        var recoveredCount = 0;
        var foundKeys = [];
        var allCourses = Store.get('cursos') || [];

        for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf('pruebas_formativas_') === 0) {
                try {
                    var raw = localStorage.getItem(k);
                    if (!raw) continue;
                    var d = JSON.parse(raw);
                    if (d && d.filas && Array.isArray(d.filas)) {
                        var hasData = d.filas.some(function(f) {
                            return (f.lectura !== '' && f.lectura !== null && f.lectura !== undefined) ||
                                   (f.escritura !== '' && f.escritura !== null && f.escritura !== undefined);
                        });
                        if (hasData) {
                            foundKeys.push({ key: k, data: d });
                        }
                    }
                } catch(e) {}
            }
        }

        if (foundKeys.length === 0) {
            return {
                encontrados: 0,
                mensaje: 'No se encontraron registros huérfanos con calificaciones en este dispositivo.'
            };
        }

        if (!Store.data.pruebasFormativas || Array.isArray(Store.data.pruebasFormativas)) {
            Store.data.pruebasFormativas = {};
        }

        foundKeys.forEach(function(item) {
            var parts = item.key.split('_'); // ['pruebas', 'formativas', courseId, mes]
            var keyCourseId = parts[2];
            var keyMes = parts.slice(3).join('_');

            var courseExists = allCourses.some(function(c) { return c.id === keyCourseId; });
            if (!courseExists) {
                // Intentar emparejar con cursos actuales por coincidencia de estudiantes
                for (var ci = 0; ci < allCourses.length; ci++) {
                    var courseStudents = Store.getStudentsByCourse(allCourses[ci].id);
                    var matchCount = 0;
                    item.data.filas.forEach(function(f) {
                        if (courseStudents.some(function(cs) { return cs.id === f.estudianteId || cs.nombreCompleto === f.nombre; })) {
                            matchCount++;
                        }
                    });
                    if (matchCount > 0 && matchCount >= Math.min(courseStudents.length * 0.4, 2)) {
                        var remappedKey = 'pruebas_formativas_' + allCourses[ci].id + '_' + keyMes;
                        Store.data.pruebasFormativas[remappedKey] = item.data;
                        try { localStorage.setItem(remappedKey, JSON.stringify(item.data)); } catch(e){}
                        recoveredCount++;
                        return;
                    }
                }
            }

            Store.data.pruebasFormativas[item.key] = item.data;
            recoveredCount++;
        });

        Store.save();
        return {
            encontrados: foundKeys.length,
            recuperados: recoveredCount,
            mensaje: '¡Se recuperaron ' + recoveredCount + ' bloques de pruebas formativas con calificaciones!'
        };
    },

    runRecoveryUI: function() {
        var res = this.scanAndRecoverLostData();
        if (res.recuperados > 0) {
            UI.toast('🎉 ' + res.mensaje, 'success');
            setTimeout(function() {
                Router.navigate('pruebas-formativas');
            }, 1000);
        } else {
            UI.toast('ℹ️ ' + res.mensaje, 'info');
        }
    },

    buildDefault: function() {
        var c = Store.getActiveCourse();
        if (!c) return null;
        var students = Store.getStudentsByCourse(c.id);
        var filas = students.map(function(st) {
            return {
                estudianteId: st.id,
                nombre: st.nombreCompleto,
                lectura: '',
                escritura: ''
            };
        });
        return { filas: filas };
    },

    getLecturaNivel: function(score) {
        if (score === '' || score === null || score === undefined) return '';
        var s = parseFloat(score);
        if (isNaN(s)) return '';
        if (s >= 43) return 'A';
        if (s >= 34) return 'S';
        if (s >= 19) return 'DM';
        return 'I';
    },

    getEscrituraNivel: function(score) {
        if (score === '' || score === null || score === undefined) return '';
        var s = parseFloat(score);
        if (isNaN(s)) return '';
        if (s >= 17) return 'A';
        if (s >= 13) return 'S';
        if (s >= 9) return 'DM';
        return 'I';
    },

    getNivelStyles: function(nivel) {
        switch(nivel) {
            case 'A': return { bg: '#f3e8ff', color: '#9333ea' };
            case 'S': return { bg: '#dcfce7', color: '#16a34a' };
            case 'DM': return { bg: '#ffedd5', color: '#ea580c' };
            case 'I': return { bg: '#fee2e2', color: '#dc2626' };
            default: return { bg: 'transparent', color: 'inherit' };
        }
    },

    getTotalPuntos: function(lectura, escritura) {
        if (lectura === '' && escritura === '') return '';
        var l = lectura !== '' ? parseFloat(lectura) : 0;
        var e = escritura !== '' ? parseFloat(escritura) : 0;
        return l + e;
    },

    updateRowDOM: function(tr, rowIdx, fila) {
        var lvlL = this.getLecturaNivel(fila.lectura);
        var lvlE = this.getEscrituraNivel(fila.escritura);
        var total = this.getTotalPuntos(fila.lectura, fila.escritura);
        
        var self = this;
        ['I', 'DM', 'S', 'A'].forEach(function(lvl) {
            var tdL = tr.querySelector('.pf-ind-lectura-' + lvl);
            if (tdL) {
                if (lvlL === lvl) {
                    var style = self.getNivelStyles(lvl);
                    tdL.textContent = 'X';
                    tdL.style.background = style.bg;
                    tdL.style.color = style.color;
                } else {
                    tdL.textContent = '';
                    tdL.style.background = 'transparent';
                    tdL.style.color = 'inherit';
                }
            }
            
            var tdE = tr.querySelector('.pf-ind-escritura-' + lvl);
            if (tdE) {
                if (lvlE === lvl) {
                    var style = self.getNivelStyles(lvl);
                    tdE.textContent = 'X';
                    tdE.style.background = style.bg;
                    tdE.style.color = style.color;
                } else {
                    tdE.textContent = '';
                    tdE.style.background = 'transparent';
                    tdE.style.color = 'inherit';
                }
            }
        });
        
        var tdTotal = tr.querySelector('.pf-total-puntos');
        if (tdTotal) {
            tdTotal.textContent = total;
        }
    },

    updateChartsDOM: function() {
        var col = document.getElementById('pf-graphics-column');
        if (!col) return;
        
        var data = this.getData();
        if (!data) return;
        
        var self = this;
        var stats = {
            lectura: { A:0, S:0, DM:0, I:0, total:0 },
            escritura: { A:0, S:0, DM:0, I:0, total:0 }
        };
        
        data.filas.forEach(function(f) {
            var lvlL = self.getLecturaNivel(f.lectura);
            var lvlE = self.getEscrituraNivel(f.escritura);
            
            if (lvlL) { stats.lectura[lvlL]++; stats.lectura.total++; }
            if (lvlE) { stats.escritura[lvlE]++; stats.escritura.total++; }
        });
        
        var renderDashboardSection = function(title, area) {
            var st = stats[area];
            var tot = st.total || 0; 
            var pA = tot > 0 ? Math.round(st.A / tot * 100) : 0;
            var pS = tot > 0 ? Math.round(st.S / tot * 100) : 0;
            var pDM = tot > 0 ? Math.round(st.DM / tot * 100) : 0;
            var pI = tot > 0 ? Math.round(st.I / tot * 100) : 0;
            var isLectura = (area === 'lectura');
            var maxPts = isLectura ? 48 : 20;

            return '<div class="pf-chart" style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 16px;">' +
                '<div style="background:#f1f5f9; border-bottom:1px solid #cbd5e1; padding:10px 14px; font-weight:700; font-size:13px; color:#0f172a; display:flex; align-items:center; justify-content:space-between;">' +
                    '<span style="display:flex; align-items:center; gap:8px;"><i data-lucide="table" style="width:16px;height:16px;color:#0284c7;"></i> RESULTADOS: ' + title.toUpperCase() + ' (Máx. ' + maxPts + ' pts)</span>' +
                    '<span style="font-size:12px; font-weight:700; color:#475569;">Evaluados: ' + tot + '</span>' +
                '</div>' +
                '<div style="padding: 12px;">' +
                    '<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center; border: 1px solid #cbd5e1;">' +
                        '<thead>' +
                            '<tr style="background:#f8fafc; border-bottom:1px solid #cbd5e1;">' +
                                '<th style="padding:6px 8px; text-align:left; border-right:1px solid #cbd5e1; color:#334155; font-weight:700;">Nivel</th>' +
                                '<th style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#334155; font-weight:700; width:65px;">Rango</th>' +
                                '<th style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#334155; font-weight:700; width:55px;">Cant.</th>' +
                                '<th style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#334155; font-weight:700; width:55px;">%</th>' +
                                '<th style="padding:6px 8px; color:#334155; font-weight:700; text-align:left;">Distribución</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>' +
                            '<tr style="border-bottom:1px solid #e2e8f0; background:#f0fdf4;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#166534; border-right:1px solid #cbd5e1;">Avanzado (A)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#166534; font-weight:600; font-size:11px;">' + (isLectura ? '43-48' : '17-20') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#166534; border-right:1px solid #cbd5e1;">' + st.A + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#166534; border-right:1px solid #cbd5e1;">' + pA + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#dcfce7; border:1px solid #86efac; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#22c55e; height:100%; width:' + pA + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="border-bottom:1px solid #e2e8f0; background:#f7fee7;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#3f6212; border-right:1px solid #cbd5e1;">Satisfactorio (S)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#3f6212; font-weight:600; font-size:11px;">' + (isLectura ? '34-42' : '13-16') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#3f6212; border-right:1px solid #cbd5e1;">' + st.S + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#3f6212; border-right:1px solid #cbd5e1;">' + pS + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#ecfccb; border:1px solid #bef264; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#84cc16; height:100%; width:' + pS + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="border-bottom:1px solid #e2e8f0; background:#fefce8;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#854d0e; border-right:1px solid #cbd5e1;">Debe Mejorar (DM)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#854d0e; font-weight:600; font-size:11px;">' + (isLectura ? '19-33' : '9-12') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#854d0e; border-right:1px solid #cbd5e1;">' + st.DM + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#854d0e; border-right:1px solid #cbd5e1;">' + pDM + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#fef9c3; border:1px solid #fde047; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#eab308; height:100%; width:' + pDM + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="border-bottom:1px solid #cbd5e1; background:#fef2f2;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#991b1b; border-right:1px solid #cbd5e1;">Insatisfactorio (I)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#991b1b; font-weight:600; font-size:11px;">' + (isLectura ? '0-18' : '0-8') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#991b1b; border-right:1px solid #cbd5e1;">' + st.I + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#991b1b; border-right:1px solid #cbd5e1;">' + pI + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#fee2e2; border:1px solid #fca5a5; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#ef4444; height:100%; width:' + pI + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="background:#f8fafc; font-weight:800;">' +
                                '<td colspan="2" style="padding:6px 8px; text-align:left; color:#1e293b; border-right:1px solid #cbd5e1;">Total Evaluados</td>' +
                                '<td style="padding:6px 8px; color:#0284c7; border-right:1px solid #cbd5e1;">' + tot + '</td>' +
                                '<td style="padding:6px 8px; color:#0284c7; border-right:1px solid #cbd5e1;">100%</td>' +
                                '<td style="padding:6px 8px; color:#64748b; font-size:11px; text-align:left;">100% completado</td>' +
                            '</tr>' +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';
        };

        var c = Store.getActiveCourse() || {};
        var matriculaTotal = data.filas.length;
        
        var summaryTable = '<div class="pf-chart" style="background:#fff; border: 1px solid #cbd5e1; border-radius:4px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">' +
            '<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">' +
                '<thead>' +
                    '<tr><th colspan="3" style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; padding:10px 12px; color:#0f172a; font-weight:700; font-size:13px; text-align:center;">Resumen de Educandos por Nivel de Desempeño</th></tr>' +
                    '<tr><th rowspan="3" style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; padding:8px; color:#475569; font-weight:700;">Nivel de<br>Desempeño</th><th colspan="2" style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; padding:8px; color:#475569; font-weight:700;">Datos de la Sección:</th></tr>' +
                    '<tr><th style="background:#ffffff; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#64748b; font-weight:600;">Sección:</th><th style="border-bottom: 1px solid #cbd5e1; color:#0f172a; font-weight:700;">'+(c.seccion||'-')+'</th></tr>' +
                    '<tr><th style="background:#ffffff; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#64748b; font-weight:600;">Grado:</th><th style="border-bottom: 1px solid #cbd5e1; color:#0f172a; font-weight:700;">'+(c.grado||'-')+'</th></tr>' +
                    '<tr><th style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;"></th><th style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#166534; font-weight:700; padding:8px;">Lectura y Gramática</th><th style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; color:#7c3aed; font-weight:700; padding:8px;">Escritura</th></tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr><td style="background:#dcfce7; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#166534; padding:8px;">AVANZADO (A)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.A+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.A+'</td></tr>' +
                    '<tr><td style="background:#ecfccb; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#3f6212; padding:8px;">SATISFACTORIO (S)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.S+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.S+'</td></tr>' +
                    '<tr><td style="background:#fef9c3; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#854d0e; padding:8px;">DEBE MEJORAR (DM)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.DM+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.DM+'</td></tr>' +
                    '<tr><td style="background:#fee2e2; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#991b1b; padding:8px;">INSATISFACTORIO (I)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.I+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.I+'</td></tr>' +
                    '<tr><td style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:800; color:#334155; padding:8px;">Total Evaluados</td><td style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#0284c7; font-weight:800;">'+stats.lectura.total+'</td><td style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; color:#0284c7; font-weight:800;">'+stats.escritura.total+'</td></tr>' +
                    '<tr><td colspan="3" style="background:#f8fafc; padding:10px; font-weight:600; color:#475569;">Porcentaje Evaluados: <span style="font-weight:800; color:#0284c7;">'+ (matriculaTotal > 0 ? '100%' : '0%') +'</span></td></tr>' +
                '</tbody>' +
            '</table></div>';

        col.innerHTML = renderDashboardSection('Lectura y Gramática', 'lectura') +
                          renderDashboardSection('Escritura', 'escritura') +
                          summaryTable;
                          
        if (window.lucide) window.lucide.createIcons();
    },

    meses: ['Febrero/Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre/Noviembre'],
    mesesShort: ['Feb/Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct/Nov'],

    updateCell: function(rowIdx, campo, val) {
        var data = this.getData();
        if (!data || !data.filas[rowIdx]) return;
        
        var numVal = val === '' ? '' : parseFloat(val);
        if (isNaN(numVal)) numVal = '';
        
        data.filas[rowIdx][campo] = numVal;
        this.saveData(data);
        
        var tr = document.querySelector('tr[data-row-idx="' + rowIdx + '"]');
        if (tr) {
            this.updateRowDOM(tr, rowIdx, data.filas[rowIdx]);
        }
        
        this.updateChartsDOM();
    },

    handleInputKey: function(e, rowIdx, campo) {
        var key = e.key;
        if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Enter') return;
        
        var targetInput = null;
        
        if (key === 'ArrowDown' || key === 'Enter') {
            e.preventDefault();
            targetInput = document.querySelector('tr[data-row-idx="' + (rowIdx + 1) + '"] input[oninput*="' + campo + '"]');
        } else if (key === 'ArrowUp') {
            e.preventDefault();
            targetInput = document.querySelector('tr[data-row-idx="' + (rowIdx - 1) + '"] input[oninput*="' + campo + '"]');
        } else if (key === 'ArrowRight') {
            if (campo === 'lectura') {
                e.preventDefault();
                targetInput = document.querySelector('tr[data-row-idx="' + rowIdx + '"] input[oninput*="escritura"]');
            }
        } else if (key === 'ArrowLeft') {
            if (campo === 'escritura') {
                e.preventDefault();
                targetInput = document.querySelector('tr[data-row-idx="' + rowIdx + '"] input[oninput*="lectura"]');
            }
        }
        
        if (targetInput) {
            targetInput.focus();
            targetInput.select();
        }
    },

    changeMes: function(mes) {
        this.state.mes = mes;
        Router.navigate('pruebas-formativas');
    },

    toggleRight: function() {
        this.state.rightOpen = !this.state.rightOpen;
        try { localStorage.setItem("pf_rightOpen", this.state.rightOpen ? "1" : "0"); } catch(e){}
        var col = document.getElementById('pf-graphics-column');
        var btn = document.getElementById('pf-toggle-right-btn');
        if (col) {
            if (this.state.rightOpen) {
                col.classList.remove('collapsed');
                if (btn) btn.classList.add('active');
            } else {
                col.classList.add('collapsed');
                if (btn) btn.classList.remove('active');
            }
        }
    },

    prevMonth: function() {
        var meses = this.meses;
        var idx = meses.indexOf(this.state.mes);
        if (idx > 0) {
            this.changeMes(meses[idx - 1]);
        } else if (this.state.mes === 'all') {
            this.changeMes(meses[0]);
        }
    },

    nextMonth: function() {
        var meses = this.meses;
        var idx = meses.indexOf(this.state.mes);
        if (idx >= 0 && idx < meses.length - 1) {
            this.changeMes(meses[idx + 1]);
        }
    },

    onMount: function() {
        if (window.lucide) window.lucide.createIcons();
        try {
            const saved = localStorage.getItem("pf_rightOpen");
            if (saved !== null) this.state.rightOpen = (saved === "1");
        } catch(e){}
        var col = document.getElementById('pf-graphics-column');
        var btn = document.getElementById('pf-toggle-right-btn');
        if (col) {
            if (this.state.rightOpen) {
                col.classList.remove('collapsed');
                if (btn) btn.classList.add('active');
            } else {
                col.classList.add('collapsed');
                if (btn) btn.classList.remove('active');
            }
        }
        if (this.state.mes === 'all') {
            this.updateConsolidatedChartsDOM();
        }
    },

    previewShare: function() {
        var c = Store.getActiveCourse();
        if (!c) return;
        var sysConfig = Store.data.configCentro || {};
        var centroEdu = c.centroEducativo || sysConfig.nombreCentro || '';
        var grado = c.grado || '';
        var seccion = c.seccion || '';
        var mes = this.state.mes;

        if (mes === 'all') {
            // Compartir reporte consolidado anual
            var students = Store.getStudentsByCourse(c.id) || [];
            var text = "📊 *Pruebas Formativas - Consolidado Anual*\n";
            text += "🏫 Centro Educativo: " + centroEdu + "\n";
            text += "🎓 Grado: " + grado + " - Sección " + seccion + "\n";
            text += "👥 Matrícula: " + students.length + " alumnos\n\n";
            text += "Generado desde Aula360 HN 📘";

            var modalHtml = '<div style="display:flex; flex-direction:column; gap:16px;">' +
                '<div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px; display:flex; align-items:center; gap:8px;"><i data-lucide="share-2" style="width:20px; color:#0ea5e9;"></i> Vista Previa del Reporte Anual</div>' +
                '<div style="font-size:13px; color:#64748b; margin-bottom:8px;">Este es el resumen consolidado que se compartirá.</div>' +
                '<textarea id="share-text-preview" style="width:100%; height:280px; padding:12px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#334155; resize:none;">' + text + '</textarea>' +
                '<div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">' +
                    '<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>' +
                    '<button class="btn btn-primary" style="display:flex; align-items:center; gap:8px;" onclick="Views.PruebasFormativas.executeShare()"><i data-lucide="send" style="width:16px; height:16px;"></i> Compartir ahora</button>' +
                '</div>' +
            '</div>';

            UI.modal('', modalHtml, { noHeader: true, maxWidth: '500px' });
            if (window.lucide) lucide.createIcons();
            return;
        }

        var data = this.getData();
        if (!data || !data.filas || !data.filas.length) return typeof UI !== 'undefined' && UI.toast ? UI.toast('No hay datos para compartir', 'warning') : alert('No hay datos');
        
        var stats = {
            lectura: { A:0, S:0, DM:0, I:0, total:0 },
            escritura: { A:0, S:0, DM:0, I:0, total:0 }
        };

        var self = this;
        data.filas.forEach(function(f) {
            var lvlL = self.getLecturaNivel(f.lectura);
            var lvlE = self.getEscrituraNivel(f.escritura);
            if (lvlL) { stats.lectura[lvlL]++; stats.lectura.total++; }
            if (lvlE) { stats.escritura[lvlE]++; stats.escritura.total++; }
        });

        var text = "📊 *Pruebas Formativas - " + mes + "*\n";
        text += "🏫 Centro Educativo: " + centroEdu + "\n";
        text += "🎓 Grado: " + grado + " - Sección " + seccion + "\n\n";
        text += "*Resumen de Evaluados (" + data.filas.length + " alumnos):*\n\n";
        
        text += "📖 *Lectura y Gramática:* (Evaluados: "+stats.lectura.total+")\n";
        text += "Avanzado: " + stats.lectura.A + " | Satisfactorio: " + stats.lectura.S + " | Debe Mejorar: " + stats.lectura.DM + " | Insatisfactorio: " + stats.lectura.I + "\n\n";

        text += "✍️ *Escritura:* (Evaluados: "+stats.escritura.total+")\n";
        text += "Avanzado: " + stats.escritura.A + " | Satisfactorio: " + stats.escritura.S + " | Debe Mejorar: " + stats.escritura.DM + " | Insatisfactorio: " + stats.escritura.I + "\n\n";
        
        text += "Generado desde Aula360 HN 📘";

        var modalHtml = '<div style="display:flex; flex-direction:column; gap:16px;">' +
            '<div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px; display:flex; align-items:center; gap:8px;"><i data-lucide="share-2" style="width:20px; color:#0ea5e9;"></i> Vista Previa del Reporte</div>' +
            '<div style="font-size:13px; color:#64748b; margin-bottom:8px;">Este es el resumen que se compartirá. Puedes editarlo antes de enviarlo.</div>' +
            '<textarea id="share-text-preview" style="width:100%; height:280px; padding:12px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#334155; resize:none;">' + text + '</textarea>' +
            '<div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">' +
                '<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>' +
                '<button class="btn btn-primary" style="display:flex; align-items:center; gap:8px;" onclick="Views.PruebasFormativas.executeShare()"><i data-lucide="send" style="width:16px; height:16px;"></i> Compartir ahora</button>' +
            '</div>' +
        '</div>';

        UI.modal('', modalHtml, { noHeader: true, maxWidth: '500px' });
        if (window.lucide) lucide.createIcons();
    },

    executeShare: function() {
        var text = document.getElementById('share-text-preview').value;
        UI.shareData({
            title: 'Reporte de Pruebas Formativas',
            text: text
        });
    },

    openFastInputModal: function(studentIndex) {
        var c = Store.getActiveCourse();
        if (!c) return;
        var students = Store.getStudentsByCourse(c.id);
        if (studentIndex < 0 || studentIndex >= students.length) return;
        
        var student = students[studentIndex];
        var meses = this.meses;
        
        var self = this;
        var rowsHtml = meses.map(function(mes) {
            var data = self.getData(mes, c.id);
            var fila = { lectura: '', escritura: '' };
            if (data && data.filas) {
                var found = data.filas.find(function(f) { return f.estudianteId === student.id; });
                if (found) fila = found;
            }
            
            var lVal = fila.lectura !== undefined ? fila.lectura : '';
            var eVal = fila.escritura !== undefined ? fila.escritura : '';
            var tVal = self.getTotalPuntos(lVal, eVal);
            
            return '<tr style="border-bottom: 1px solid #cbd5e1;">' +
                '<td style="padding: 8px 10px; font-weight: 600; color: #334155; border-right: 1px solid #cbd5e1; font-size: 13px;">' + mes + '</td>' +
                '<td style="padding: 0; border-right: 1px solid #cbd5e1;">' +
                    '<input type="number" min="0" max="48" value="' + lVal + '" ' +
                           'class="pf-grid-input" ' +
                           'oninput="Views.PruebasFormativas.updateFastCell(\'' + student.id + '\', \'' + mes + '\', \'lectura\', this.value, this)" />' +
                '</td>' +
                '<td style="padding: 0; border-right: 1px solid #cbd5e1;">' +
                    '<input type="number" min="0" max="20" value="' + eVal + '" ' +
                           'class="pf-grid-input" ' +
                           'oninput="Views.PruebasFormativas.updateFastCell(\'' + student.id + '\', \'' + mes + '\', \'escritura\', this.value, this)" />' +
                '</td>' +
                '<td class="fast-total" style="padding: 8px 10px; text-align: center; font-weight: 800; font-size: 13px; color: #0f172a; background: #f8fafc;">' + tVal + '</td>' +
            '</tr>';
        }).join('');

        var modalHtml = '<div style="display:flex; flex-direction:column; gap:16px;">' +
            '<div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px; display:flex; align-items:center; justify-content:space-between;">' +
                '<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="activity" style="width:20px; color:#0ea5e9;"></i> Ingreso Rápido: ' + student.nombreCompleto + '</div>' +
                '<div style="font-size:12px; color:#64748b; font-weight:600; padding:4px 8px; background:#f1f5f9; border-radius:6px;">Estudiante ' + (studentIndex + 1) + ' de ' + students.length + '</div>' +
            '</div>' +
            '<div style="overflow-x:auto; border: 1px solid #e2e8f0; border-radius: 8px; max-height: 50vh; overflow-y: auto;">' +
                '<table style="width:100%; border-collapse:collapse; text-align:left;">' +
                    '<thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0; position: sticky; top: 0; z-index: 10;">' +
                        '<tr>' +
                            '<th style="padding:10px; font-size:12px; font-weight:700; color:#475569; border-right:1px solid #e2e8f0;">Mes</th>' +
                            '<th style="padding:10px; font-size:12px; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-align:center;">Lectura y Gramática (Máx 48)</th>' +
                            '<th style="padding:10px; font-size:12px; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-align:center;">Escritura (Máx 20)</th>' +
                            '<th style="padding:10px; font-size:12px; font-weight:700; color:#475569; text-align:center;">Total (68)</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                        rowsHtml +
                    '</tbody>' +
                '</table>' +
            '</div>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">' +
                '<button class="btn btn-secondary" onclick="Views.PruebasFormativas.openFastInputModal(' + (studentIndex - 1) + ')" ' + (studentIndex === 0 ? 'disabled style="opacity:0.5;"' : '') + '><i data-lucide="arrow-left" style="width:16px;"></i> Anterior</button>' +
                '<button class="btn btn-primary" style="background:#0f172a; border-color:#0f172a; margin-left: auto; margin-right: 8px;" onclick="UI.closeModal(); Router.navigate(\'pruebas-formativas\');">Cerrar y Actualizar</button>' +
                '<button class="btn btn-primary" onclick="Views.PruebasFormativas.openFastInputModal(' + (studentIndex + 1) + ')" ' + (studentIndex === students.length - 1 ? 'disabled style="opacity:0.5;"' : '') + '>Siguiente <i data-lucide="arrow-right" style="width:16px;"></i></button>' +
            '</div>' +
        '</div>';

        UI.modal('', modalHtml);
        if (window.lucide) lucide.createIcons();
    },

    updateFastCell: function(estId, mes, campo, val, inputElem) {
        var c = Store.getActiveCourse();
        if (!c) return;
        var data = this.getData(mes, c.id);
        
        if (!data || !data.filas) {
            var students = Store.getStudentsByCourse(c.id);
            var filas = students.map(function(st) {
                return {
                    estudianteId: st.id,
                    nombre: st.nombreCompleto || st.nombre || '',
                    lectura: '',
                    escritura: ''
                };
            });
            data = { filas: filas };
        }
        
        var fila = data.filas.find(function(f) { return f.estudianteId === estId; });
        if (!fila) {
            var student = Store.getStudentsByCourse(c.id).find(function(s) { return s.id === estId; });
            fila = { estudianteId: estId, nombre: student ? (student.nombreCompleto || student.nombre) : '', lectura: '', escritura: '' };
            data.filas.push(fila);
        }
        
        var numVal = val === '' ? '' : parseFloat(val);
        if (isNaN(numVal)) numVal = '';
        
        fila[campo] = numVal;
        this.saveData(data, mes, c.id);
        
        if (inputElem) {
            var tr = inputElem.closest('tr');
            if (tr) {
                var totalTd = tr.querySelector('.fast-total');
                if (totalTd) {
                    var lVal = tr.querySelector('input[oninput*="lectura"]').value;
                    var eVal = tr.querySelector('input[oninput*="escritura"]').value;
                    totalTd.textContent = this.getTotalPuntos(lVal, eVal);
                }
            }
        }
    },

    // ==========================================
    // MÉTODOS PARA LA VISTA CONSOLIDADA ANUAL
    // ==========================================
    updateConsolidatedCell: function(studentId, mes, campo, val, inputElem) {
        var c = Store.getActiveCourse();
        if (!c) return;
        var data = this.getData(mes, c.id);

        var students = Store.getStudentsByCourse(c.id) || [];
        if (!data || !data.filas) {
            data = {
                filas: students.map(function(st) {
                    return { estudianteId: st.id, nombre: st.nombreCompleto || st.nombre || '', lectura: '', escritura: '' };
                })
            };
        }

        var fila = data.filas.find(function(f) { return f.estudianteId === studentId; });
        if (!fila) {
            var st = students.find(function(s) { return s.id === studentId; });
            fila = { estudianteId: studentId, nombre: st ? (st.nombreCompleto || st.nombre) : '', lectura: '', escritura: '' };
            data.filas.push(fila);
        }

        var numVal = val === '' ? '' : parseFloat(val);
        if (isNaN(numVal)) numVal = '';
        fila[campo] = numVal;

        this.saveData(data, mes, c.id);

        if (inputElem) {
            var tr = inputElem.closest('tr');
            if (tr) {
                this.recalcConsolidatedRowDOM(tr, studentId);
            }
        }

        this.updateConsolidatedChartsDOM();
    },

    recalcConsolidatedRowDOM: function(tr, studentId) {
        var self = this;
        var c = Store.getActiveCourse();
        if (!c || !tr) return;

        var sumL = 0, countL = 0;
        var sumE = 0, countE = 0;
        var totAcum = 0;

        self.meses.forEach(function(m) {
            var lInp = tr.querySelector('input.pf-con-inp[data-mes="' + m + '"][data-campo="lectura"]');
            var eInp = tr.querySelector('input.pf-con-inp[data-mes="' + m + '"][data-campo="escritura"]');
            var subTotEl = tr.querySelector('.pf-con-subtot[data-mes="' + m + '"]');

            var lVal = lInp && lInp.value !== '' ? parseFloat(lInp.value) : '';
            var eVal = eInp && eInp.value !== '' ? parseFloat(eInp.value) : '';

            if (lVal !== '' && !isNaN(lVal)) { sumL += lVal; countL++; }
            if (eVal !== '' && !isNaN(eVal)) { sumE += eVal; countE++; }

            var mTot = self.getTotalPuntos(lVal, eVal);
            if (subTotEl) {
                subTotEl.textContent = mTot !== '' ? mTot : '—';
                if (mTot !== '') {
                    totAcum += Number(mTot);
                    subTotEl.style.color = '#0f172a';
                } else {
                    subTotEl.style.color = '#94a3b8';
                }
            }
        });

        var promL = countL > 0 ? (sumL / countL).toFixed(1) : '—';
        var promE = countE > 0 ? (sumE / countE).toFixed(1) : '—';
        var promLNum = countL > 0 ? (sumL / countL) : null;
        var promENum = countE > 0 ? (sumE / countE) : null;

        var promLEl = tr.querySelector('.pf-con-prom-l');
        var promEEl = tr.querySelector('.pf-con-prom-e');
        var totAcumEl = tr.querySelector('.pf-con-tot-acum');
        var nivelEl = tr.querySelector('.pf-con-nivel-badge');

        if (promLEl) promLEl.textContent = promL;
        if (promEEl) promEEl.textContent = promE;
        if (totAcumEl) totAcumEl.textContent = totAcum > 0 ? totAcum : '—';

        if (nivelEl) {
            if (promLNum !== null || promENum !== null) {
                var totalProm = (promLNum || 0) + (promENum || 0);
                var pct = Math.round((totalProm / 68) * 100);
                var nivel = 'I';
                if (pct >= 85) nivel = 'A';
                else if (pct >= 70) nivel = 'S';
                else if (pct >= 50) nivel = 'DM';

                var st = self.getNivelStyles(nivel);
                nivelEl.innerHTML = '<span style="display:inline-block; background:' + st.bg + '; color:' + st.color + '; font-weight:800; font-size:11px; padding:3px 6px; border-radius:0; border:1px solid ' + st.color + '40;">' + nivel + ' (' + pct + '%)</span>';
            } else {
                nivelEl.innerHTML = '<span style="color:#94a3b8; font-size:11px;">—</span>';
            }
        }
    },

    handleConsolidatedKey: function(e, rowIdx, mesIdx, campo) {
        var key = e.key;
        if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Enter') return;

        var target = null;
        if (key === 'ArrowDown' || key === 'Enter') {
            e.preventDefault();
            target = document.querySelector('tr[data-row-idx="' + (rowIdx + 1) + '"] input.pf-con-inp[data-mes-idx="' + mesIdx + '"][data-campo="' + campo + '"]');
        } else if (key === 'ArrowUp') {
            e.preventDefault();
            target = document.querySelector('tr[data-row-idx="' + (rowIdx - 1) + '"] input.pf-con-inp[data-mes-idx="' + mesIdx + '"][data-campo="' + campo + '"]');
        } else if (key === 'ArrowRight') {
            e.preventDefault();
            if (campo === 'lectura') {
                target = document.querySelector('tr[data-row-idx="' + rowIdx + '"] input.pf-con-inp[data-mes-idx="' + mesIdx + '"][data-campo="escritura"]');
            } else {
                target = document.querySelector('tr[data-row-idx="' + rowIdx + '"] input.pf-con-inp[data-mes-idx="' + (mesIdx + 1) + '"][data-campo="lectura"]');
            }
        } else if (key === 'ArrowLeft') {
            e.preventDefault();
            if (campo === 'escritura') {
                target = document.querySelector('tr[data-row-idx="' + rowIdx + '"] input.pf-con-inp[data-mes-idx="' + mesIdx + '"][data-campo="lectura"]');
            } else {
                target = document.querySelector('tr[data-row-idx="' + rowIdx + '"] input.pf-con-inp[data-mes-idx="' + (mesIdx - 1) + '"][data-campo="escritura"]');
            }
        }

        if (target) {
            target.focus();
            target.select();
        }
    },

    updateConsolidatedChartsDOM: function() {
        var col = document.getElementById('pf-graphics-column');
        if (!col || this.state.mes !== 'all') return;
        var c = Store.getActiveCourse();
        if (!c) return;

        var self = this;
        var monthStats = self.meses.map(function(m, idx) {
            var data = self.getData(m, c.id);
            var sumL = 0, countL = 0, sumE = 0, countE = 0;
            if (data && data.filas) {
                data.filas.forEach(function(f) {
                    var l = parseFloat(f.lectura);
                    var e = parseFloat(f.escritura);
                    if (!isNaN(l)) { sumL += l; countL++; }
                    if (!isNaN(e)) { sumE += e; countE++; }
                });
            }
            return {
                mes: m,
                short: self.mesesShort[idx],
                avgL: countL > 0 ? (sumL / countL).toFixed(1) : 0,
                avgE: countE > 0 ? (sumE / countE).toFixed(1) : 0,
                evaluados: Math.max(countL, countE)
            };
        });

        var maxAvg = 68;
        var chartBarsHtml = monthStats.map(function(st) {
            var tot = parseFloat(st.avgL) + parseFloat(st.avgE);
            var hPct = Math.min(100, Math.round((tot / maxAvg) * 100));
            var barColor = tot >= 47 ? '#22c55e' : (tot >= 34 ? '#84cc16' : (tot >= 20 ? '#eab308' : (tot > 0 ? '#ef4444' : '#cbd5e1')));
            return '<div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; min-width:28px;">' +
                '<div style="font-size:10px; font-weight:700; color:#475569;">' + (tot > 0 ? Math.round(tot) : '—') + '</div>' +
                '<div style="width:100%; max-width:22px; height:90px; background:#f1f5f9; border-radius:4px 4px 0 0; display:flex; align-items:flex-end; overflow:hidden;">' +
                    '<div style="width:100%; height:' + (tot > 0 ? Math.max(8, hPct) : 0) + '%; background:' + barColor + '; transition:height 0.4s ease;"></div>' +
                '</div>' +
                '<div style="font-size:9.5px; font-weight:700; color:#64748b; margin-top:2px;">' + st.short + '</div>' +
            '</div>';
        }).join('');

        var summaryRows = monthStats.map(function(st) {
            return '<tr style="border-bottom:1px solid #f1f5f9;">' +
                '<td style="padding:6px 8px; font-weight:600; color:#334155; text-align:left;">' + st.mes + '</td>' +
                '<td style="padding:6px 8px; text-align:center; font-weight:700; color:#0284c7;">' + st.evaluados + '</td>' +
                '<td style="padding:6px 8px; text-align:center; font-weight:700; color:#16a34a;">' + (st.avgL > 0 ? st.avgL + '/48' : '—') + '</td>' +
                '<td style="padding:6px 8px; text-align:center; font-weight:700; color:#9333ea;">' + (st.avgE > 0 ? st.avgE + '/20' : '—') + '</td>' +
            '</tr>';
        }).join('');

        col.innerHTML = '<div class="pf-chart" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">' +
            '<div style="background:#f0f9ff; border-bottom:1px solid #e0f2fe; padding:12px 16px; font-weight:700; font-size:13px; color:#0369a1; display:flex; align-items:center; gap:8px;"><i data-lucide="trending-up" style="width:16px;height:16px;"></i> EVOLUCIÓN ANUAL DEL GRUPO</div>' +
            '<div style="padding:16px;">' +
                '<div style="font-size:11px; color:#64748b; margin-bottom:12px; text-align:center; font-weight:600;">PROMEDIO TOTAL POR MES (MÁX 68 PTS)</div>' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-end; gap:6px; height:120px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">' +
                    chartBarsHtml +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="pf-chart" style="background:#fff; border: 1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">' +
            '<table style="width:100%; border-collapse:collapse; font-size:11.5px; text-align:center;">' +
                '<thead><tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;"><th style="padding:8px; text-align:left; color:#475569;">Mes</th><th style="padding:8px; color:#475569;">Evaluados</th><th style="padding:8px; color:#475569;">Lectura</th><th style="padding:8px; color:#475569;">Escritura</th></tr></thead>' +
                '<tbody>' + summaryRows + '</tbody>' +
            '</table>' +
        '</div>';

        if (window.lucide) window.lucide.createIcons();
    },

    render: function () {
        var c = Store.getActiveCourse();
        if (!c) {
            return '<div class="card"><div class="card-b c1-no-course"><i data-lucide="activity" style="width:48px;height:48px;opacity:0.3;margin-bottom:12px;"></i><div style="font-size:15px;font-weight:700;">Selecciona un curso activo</div><div style="font-size:13px;margin-top:6px;">Necesitas tener un curso activo para ingresar las Pruebas Formativas</div></div></div>';
        }

        if (!this.isApplicableSubject(c)) {
            return this.renderNonApplicable(c);
        }

        var sysConfig = Store.data.configCentro || {};
        var centroEdu = c.centroEducativo || sysConfig.nombreCentro || '';
        var municipio = c.municipio || sysConfig.municipio || 'Omoa';
        var comunidad = c.direccionCentro || sysConfig.comunidad || 'DOS CAMINOS';
        var grado = c.grado || '';
        var seccion = c.seccion || '';
        var self = this;

        var currentStudents = Store.getStudentsByCourse(c.id) || [];
        var matriculaTotal = currentStudents.length;
        var meses = self.meses;
        var isConsolidated = (self.state.mes === 'all');

        var mesOptions = '<option value="all" ' + (isConsolidated ? 'selected' : '') + '>📊 Todos los Meses (Consolidado Anual)</option>' +
            '<optgroup label="Ver Mes Individual">' +
            meses.map(function(m) {
                return '<option value="' + m + '" ' + (self.state.mes === m ? 'selected' : '') + '>' + m + '</option>';
            }).join('') +
            '</optgroup>';

        var prevDisabled = isConsolidated || self.state.mes === 'Febrero/Marzo';
        var nextDisabled = isConsolidated || self.state.mes === 'Octubre/Noviembre';

        // ==========================================
        // MODO 1: TODOS LOS MESES (VISTA CONSOLIDADA)
        // ==========================================
        if (isConsolidated) {
            var mesesData = {};
            meses.forEach(function(m) {
                var data = self.getData(m, c.id);
                if (!data || !data.filas) {
                    data = {
                        filas: currentStudents.map(function(st) {
                            return { estudianteId: st.id, nombre: st.nombreCompleto || st.nombre || '', lectura: '', escritura: '' };
                        })
                    };
                    self.saveData(data, m, c.id);
                }
                var map = {};
                data.filas.forEach(function(f) { map[f.estudianteId] = f; });
                mesesData[m] = map;
            });

            var conRows = currentStudents.map(function(st, sIdx) {
                var sumL = 0, countL = 0;
                var sumE = 0, countE = 0;
                var totAcum = 0;

                var monthCells = meses.map(function(m, mIdx) {
                    var fila = (mesesData[m] && mesesData[m][st.id]) || { lectura: '', escritura: '' };
                    var lVal = (fila.lectura !== undefined && fila.lectura !== null && fila.lectura !== '') ? fila.lectura : '';
                    var eVal = (fila.escritura !== undefined && fila.escritura !== null && fila.escritura !== '') ? fila.escritura : '';
                    var mTot = self.getTotalPuntos(lVal, eVal);

                    if (lVal !== '') { sumL += Number(lVal); countL++; }
                    if (eVal !== '') { sumE += Number(eVal); countE++; }
                    if (mTot !== '') { totAcum += Number(mTot); }

                    return '<td style="padding: 0; text-align:center; border-right: 1px solid #cbd5e1; width:38px; min-width:38px; background:#fff;' + (mIdx === 0 ? ' border-left: 2px solid #64748b;' : '') + '">' +
                        '<input type="number" min="0" max="48" class="pf-con-inp pf-grid-input" data-student-id="' + st.id + '" data-mes="' + m + '" data-mes-idx="' + mIdx + '" data-row-idx="' + sIdx + '" data-campo="lectura" value="' + lVal + '" ' +
                               'oninput="Views.PruebasFormativas.updateConsolidatedCell(\'' + st.id + '\', \'' + m + '\', \'lectura\', this.value, this)" ' +
                               'onkeydown="Views.PruebasFormativas.handleConsolidatedKey(event, ' + sIdx + ', ' + mIdx + ', \'lectura\')" />' +
                    '</td>' +
                    '<td style="padding: 0; text-align:center; border-right: 1px solid #cbd5e1; width:35px; min-width:35px; background:#fff;">' +
                        '<input type="number" min="0" max="20" class="pf-con-inp pf-grid-input" data-student-id="' + st.id + '" data-mes="' + m + '" data-mes-idx="' + mIdx + '" data-row-idx="' + sIdx + '" data-campo="escritura" value="' + eVal + '" ' +
                               'oninput="Views.PruebasFormativas.updateConsolidatedCell(\'' + st.id + '\', \'' + m + '\', \'escritura\', this.value, this)" ' +
                               'onkeydown="Views.PruebasFormativas.handleConsolidatedKey(event, ' + sIdx + ', ' + mIdx + ', \'escritura\')" />' +
                    '</td>' +
                    '<td style="padding: 4px 2px; text-align:center; border-right: 2px solid #94a3b8; width:35px; min-width:35px; background:#f8fafc;">' +
                        '<div class="pf-con-subtot" data-mes="' + m + '" style="font-size:11px; font-weight:800; color:' + (mTot !== '' ? '#0f172a' : '#94a3b8') + ';">' + (mTot !== '' ? mTot : '—') + '</div>' +
                    '</td>';
                }).join('');

                var promL = countL > 0 ? (sumL / countL).toFixed(1) : '—';
                var promE = countE > 0 ? (sumE / countE).toFixed(1) : '—';
                var promLNum = countL > 0 ? (sumL / countL) : null;
                var promENum = countE > 0 ? (sumE / countE) : null;

                var nivelHtml = '<span style="color:#94a3b8; font-size:11px;">—</span>';
                if (promLNum !== null || promENum !== null) {
                    var totalProm = (promLNum || 0) + (promENum || 0);
                    var pct = Math.round((totalProm / 68) * 100);
                    var nivel = 'I';
                    if (pct >= 85) nivel = 'A';
                    else if (pct >= 70) nivel = 'S';
                    else if (pct >= 50) nivel = 'DM';
                    var nst = self.getNivelStyles(nivel);
                    nivelHtml = '<span style="display:inline-block; background:' + nst.bg + '; color:' + nst.color + '; font-weight:800; font-size:11px; padding:3px 6px; border-radius:0; border:1px solid ' + nst.color + '40;">' + nivel + ' (' + pct + '%)</span>';
                }

                return '<tr data-row-idx="' + sIdx + '" style="border-bottom: 1px solid #cbd5e1;">' +
                    '<td style="text-align:center; padding: 6px 4px; color:#64748b; font-size:11.5px; border-right: 1px solid #cbd5e1; position:sticky; left:0; background:#fff; z-index:5; width:38px; min-width:38px; max-width:38px; box-sizing:border-box;">' + (sIdx + 1) + '</td>' +
                    '<td style="padding: 6px 8px; font-size:12px; color:#1e293b; font-weight:600; border-right: 2px solid #64748b; position:sticky; left:38px; background:#fff; z-index:5; width:195px; min-width:195px; max-width:195px; box-sizing:border-box; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                        '<span title="' + (st.nombreCompleto || st.nombre) + '">' + (st.nombreCompleto || st.nombre) + '</span>' +
                    '</td>' +
                    monthCells +
                    '<td class="pf-con-prom-l" style="padding: 6px 4px; text-align:center; font-weight:700; font-size:11.5px; color:#166534; border-right: 1px solid #cbd5e1; background:#f0fdf4;">' + promL + '</td>' +
                    '<td class="pf-con-prom-e" style="padding: 6px 4px; text-align:center; font-weight:700; font-size:11.5px; color:#7c3aed; border-right: 1px solid #cbd5e1; background:#f5f3ff;">' + promE + '</td>' +
                    '<td class="pf-con-tot-acum" style="padding: 6px 4px; text-align:center; font-weight:800; font-size:12px; color:#0f172a; border-right: 1px solid #cbd5e1; background:#f8fafc;">' + (totAcum > 0 ? totAcum : '—') + '</td>' +
                    '<td class="pf-con-nivel-badge" style="padding: 6px 4px; text-align:center; background:#f8fafc;">' + nivelHtml + '</td>' +
                '</tr>';
            }).join('');

            return '<style>' +
                '@media print {' +
                '  @page { margin: 0.8cm; size: landscape; }' +
                '  body, html, #app, .app-container, .gdhn-content, .main-content { height: auto !important; overflow: visible !important; position: static !important; background: #fff !important; }' +
                '  .gdhn-sidebar, .sidebar, .gdhn-header, .top-nav, .mobile-nav, .a360-header { display: none !important; }' +
                '  #pf-layout-container { display: block !important; }' +
                '  #pf-table-column { width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; }' +
                '  #pf-graphics-column { display: none !important; }' +
                '  .c1-wrap { padding: 0 !important; background: #fff !important; }' +
                '  tr { page-break-inside: avoid !important; }' +
                '  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
                '}' +
                '.pf-grid-input, input.pf-con-inp, input.pf-monthly-inp {' +
                '  width: 100% !important; height: 32px !important; border: none !important;' +
                '  border-radius: 0 !important; outline: none !important; box-shadow: none !important;' +
                '  background: transparent !important; text-align: center !important;' +
                '  font-weight: 700 !important; font-size: 12px !important; color: #0f172a !important;' +
                '  padding: 0 !important; margin: 0 !important; box-sizing: border-box !important;' +
                '}' +
                '.pf-grid-input:focus, input.pf-con-inp:focus, input.pf-monthly-inp:focus {' +
                '  background: #e0f2fe !important; box-shadow: inset 0 0 0 2px #0284c7 !important;' +
                '}' +
                '.pf-grid-input::-webkit-outer-spin-button, .pf-grid-input::-webkit-inner-spin-button,' +
                'input.pf-con-inp::-webkit-outer-spin-button, input.pf-con-inp::-webkit-inner-spin-button,' +
                'input.pf-monthly-inp::-webkit-outer-spin-button, input.pf-monthly-inp::-webkit-inner-spin-button {' +
                '  -webkit-appearance: none !important; margin: 0 !important;' +
                '}' +
                '.pf-grid-input[type=number], input.pf-con-inp[type=number], input.pf-monthly-inp[type=number] {' +
                '  -moz-appearance: textfield !important;' +
                '}' +
                '.pf-icon-btn {' +
                '  width: 36px; height: 36px; display: grid; place-items: center;' +
                '  border-radius: 10px; background: #ffffff; border: 1.5px solid #cbd5e1;' +
                '  color: #334155; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);' +
                '  cursor: pointer; transition: all 0.2s ease;' +
                '}' +
                '.pf-icon-btn:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-1px); }' +
                '.pf-icon-btn.active { background: rgba(0, 200, 83, 0.08) !important; border-color: rgba(0, 200, 83, 0.35) !important; color: #00C853 !important; }' +
                '.pf-mode-pill { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }' +
                '.pf-mode-pill.active { background: #0284c7; color: #fff; border-color: #0369a1; box-shadow: 0 2px 4px rgba(2,132,199,0.25); }' +
                '.pf-mode-pill:not(.active) { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }' +
                '.pf-mode-pill:not(.active):hover { background: #e2e8f0; color: #1e293b; }' +
                '#pf-graphics-column { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }' +
                '#pf-graphics-column.collapsed { flex: 0 0 0 !important; width: 0 !important; min-width: 0 !important; opacity: 0 !important; pointer-events: none !important; margin-left: -24px !important; }' +
                '</style>' +
                '<div class="c1-wrap" style="background:#f8fafc; padding-bottom:40px; font-family: \'Inter\', sans-serif;">' +
                
                '<!-- Toolbar Cabecera -->' +
                '<div class="a360-header" style="margin-bottom: 20px; background: #fff; padding: 12px 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">' +
                    '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' +
                        '<button onclick="window.toggleSidebar()" class="pf-icon-btn" title="Alternar menú lateral"><i data-lucide="layout-sidebar" stroke-width="2.5" style="width:18px;height:18px;"></i></button>' +
                        '<div style="border-left: 1px solid #e2e8f0; height: 24px; margin: 0 4px;"></div>' +
                        
                        '<div style="display:flex; align-items:center; gap:8px; font-weight:800; font-size:13px; color:#0f172a;">' +
                            '<span style="background:#e0f2fe; color:#0284c7; padding:4px 10px; border-radius:8px; display:inline-flex; align-items:center; gap:6px;"><i data-lucide="table-2" style="width:15px; height:15px;"></i> Sábana Anual Completa</span>' +
                        '</div>' +
                        '<div style="display:flex; align-items:center; background:rgba(2, 132, 199, 0.08); border:1.5px solid rgba(2, 132, 199, 0.25); padding:4px 12px; border-radius:99px; color:#0284c7; font-size:13px; font-weight:700; gap:6px;">' +
                            '<i data-lucide="layers" style="width:14px; height:14px; color:#0284c7;"></i>' +
                            '<select style="font-weight:700; color:#0284c7; border:none; background:transparent; cursor:pointer; outline:none; font-size:13px; padding-right: 4px;" onchange="Views.PruebasFormativas.changeMes(this.value)">' +
                                mesOptions +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' +
                        '<button onclick="Views.PruebasFormativas.runRecoveryUI()" class="btn btn-sm btn-outline" style="display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; border-radius:8px; border-color:#f59e0b; color:#b45309; background:#fffbeb;" title="Escanear y recuperar datos de pruebas formativas huérfanos o desvinculados"><i data-lucide="life-buoy" style="width:14px; height:14px;"></i> Rescatar Datos</button>' +
                        '<button onclick="window.print()" class="pf-icon-btn" title="Imprimir reporte anual"><i data-lucide="printer" stroke-width="2.2" style="width:16px;height:16px;"></i></button>' +
                        '<button onclick="Views.PruebasFormativas.previewShare()" class="pf-icon-btn" title="Compartir reporte" style="background:#0ea5e9; color:#fff; border-color:#0284c7;"><i data-lucide="share-2" stroke-width="2.2" style="width:16px;height:16px;color:#fff;"></i></button>' +
                        '<button id="pf-toggle-right-btn" onclick="Views.PruebasFormativas.toggleRight()" class="pf-icon-btn ' + (self.state.rightOpen ? 'active' : '') + '" title="Alternar panel de gráficos"><i data-lucide="panel-right" stroke-width="2.5" style="width:18px;height:18px;"></i></button>' +
                    '</div>' +
                '</div>' +

                '<div id="pf-layout-container" style="display:flex; gap:20px; flex-wrap:nowrap; align-items:flex-start; width:100%; transition: all 0.3s ease;">' +
                    '<!-- Columna Principal: Tabla Consolidada -->' +
                    '<div id="pf-table-column" style="width: 100%; max-width: 100%; flex: 1 1 100%; background:#fff; border-radius:16px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow:hidden; padding: 20px; transition: all 0.3s ease;">' +
                        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">' +
                            '<div>' +
                                '<div style="font-weight:900; font-size:16px; color:#0f172a; letter-spacing:-0.01em;">TABULACIÓN ANUAL CONSOLIDADA DE PRUEBAS FORMATIVAS</div>' +
                                '<div style="font-size:12px; color:#64748b; margin-top:2px;">Matriz completa de 9 períodos formativos (Español) &bull; Grado ' + grado + ' Sección ' + seccion + ' &bull; Matrícula: ' + matriculaTotal + '</div>' +
                            '</div>' +
                            '<div style="font-size:11px; background:#f0f9ff; border:1px solid #bae6fd; color:#0369a1; padding:4px 10px; border-radius:8px; font-weight:700;">' +
                                '⚡ Navega con flechas de teclado (← → ↑ ↓ o Enter)' +
                            '</div>' +
                        '</div>' +

                        '<div style="overflow-x:auto; border: 1px solid #cbd5e1; border-radius: 10px; max-height:80vh; overflow-y:auto;">' +
                            '<table style="width:100%; border-collapse:collapse; text-align:left; font-size:12px;">' +
                                '<thead style="position:sticky; top:0; z-index:10; background:#f8fafc;">' +
                                    '<tr style="border-bottom: 1px solid #cbd5e1;">' +
                                        '<th rowspan="2" style="padding: 8px 4px; font-size:11px; text-align:center; color:#475569; font-weight:800; border-right: 1px solid #cbd5e1; position:sticky; left:0; background:#f8fafc; z-index:12; width:38px; min-width:38px; max-width:38px; box-sizing:border-box;">N°</th>' +
                                        '<th rowspan="2" style="padding: 8px 8px; font-size:11px; text-align:left; color:#475569; font-weight:800; border-right: 2px solid #64748b; position:sticky; left:38px; background:#f8fafc; z-index:12; width:195px; min-width:195px; max-width:195px; box-sizing:border-box; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Nombre del Educando</th>' +
                                        meses.map(function(m, mIdx) {
                                            return '<th colspan="3" style="padding: 6px 4px; font-size:11px; text-align:center; color:#1e293b; font-weight:800; border-right: 2px solid #94a3b8; background:#f1f5f9; white-space:nowrap;' + (mIdx === 0 ? ' border-left: 2px solid #64748b;' : '') + '">' + m + '</th>';
                                        }).join('') +
                                        '<th colspan="4" style="padding: 6px 4px; font-size:11px; text-align:center; color:#1e293b; font-weight:800; background:#e2e8f0; white-space:nowrap;">Consolidado Anual</th>' +
                                    '</tr>' +
                                    '<tr style="border-bottom: 2px solid #64748b; background:#f8fafc;">' +
                                        meses.map(function(m, mIdx) {
                                            return '<th style="padding: 4px 2px; font-size:10px; text-align:center; color:#166534; font-weight:800; border-right: 1px solid #cbd5e1; width:38px; min-width:38px; white-space:nowrap;' + (mIdx === 0 ? ' border-left: 2px solid #64748b;' : '') + '" title="Lectura y Gramática (Máx 48 pts)">L (48)</th>' +
                                                   '<th style="padding: 4px 2px; font-size:10px; text-align:center; color:#7c3aed; font-weight:800; border-right: 1px solid #cbd5e1; width:35px; min-width:35px; white-space:nowrap;" title="Escritura (Máx 20 pts)">E (20)</th>' +
                                                   '<th style="padding: 4px 2px; font-size:10px; text-align:center; color:#0f172a; font-weight:800; border-right: 2px solid #94a3b8; width:35px; min-width:35px; background:#f1f5f9; white-space:nowrap;" title="Total del Mes (Máx 68 pts)">Tot</th>';
                                        }).join('') +
                                        '<th style="padding: 4px 4px; font-size:10px; text-align:center; color:#166534; font-weight:800; border-right: 1px solid #cbd5e1; width:48px; min-width:48px; background:#f0fdf4; white-space:nowrap;">Prom L</th>' +
                                        '<th style="padding: 4px 4px; font-size:10px; text-align:center; color:#7c3aed; font-weight:800; border-right: 1px solid #cbd5e1; width:48px; min-width:48px; background:#f5f3ff; white-space:nowrap;">Prom E</th>' +
                                        '<th style="padding: 4px 4px; font-size:10px; text-align:center; color:#0f172a; font-weight:800; border-right: 1px solid #cbd5e1; width:54px; min-width:54px; background:#f8fafc; white-space:nowrap;">Total</th>' +
                                        '<th style="padding: 4px 4px; font-size:10px; text-align:center; color:#0f172a; font-weight:800; width:65px; min-width:65px; background:#f8fafc; white-space:nowrap;">Nivel</th>' +
                                    '</tr>' +
                                '</thead>' +
                                '<tbody>' + conRows + '</tbody>' +
                            '</table>' +
                        '</div>' +
                    '</div>' +

                '</div>' +
            '</div>';
        }

        // ==========================================
        // MODO 2: VISTA MENSUAL INDIVIDUAL (ORIGINAL)
        // ==========================================
        var saved = self.getData();
        var data = saved || self.buildDefault();

        if (data && data.filas !== undefined) {
            var existingIds = {};
            data.filas.forEach(function(f) { existingIds[f.estudianteId] = true; });
            var synced = false;
            currentStudents.forEach(function(st) {
                if (!existingIds[st.id]) {
                    data.filas.push({ estudianteId: st.id, nombre: st.nombreCompleto || (st.nombre || ''), lectura: '', escritura: '' });
                    synced = true;
                }
            });
            var currentIds = {};
            currentStudents.forEach(function(st) { currentIds[st.id] = true; });
            var before = data.filas.length;
            data.filas = data.filas.filter(function(f) { return currentIds[f.estudianteId]; });
            if (data.filas.length !== before) synced = true;
            if (synced) self.saveData(data);
        }

        var cleaned = false;
        if (data && data.filas) {
            data.filas.forEach(function(f) {
                if (typeof f.lectura === 'string' && isNaN(parseFloat(f.lectura)) && f.lectura !== '') {
                    f.lectura = '';
                    cleaned = true;
                }
                if (typeof f.escritura === 'string' && isNaN(parseFloat(f.escritura)) && f.escritura !== '') {
                    f.escritura = '';
                    cleaned = true;
                }
            });
        }
        if (!saved || cleaned) this.saveData(data);

        var filas = data.filas || [];
        var stats = {
            lectura: { A:0, S:0, DM:0, I:0, total:0 },
            escritura: { A:0, S:0, DM:0, I:0, total:0 }
        };

        filas.forEach(function(f) {
            var lvlL = self.getLecturaNivel(f.lectura);
            var lvlE = self.getEscrituraNivel(f.escritura);
            if (lvlL) { stats.lectura[lvlL]++; stats.lectura.total++; }
            if (lvlE) { stats.escritura[lvlE]++; stats.escritura.total++; }
        });

        var trows = filas.map(function(fila, idx) {
            var lvlL = self.getLecturaNivel(fila.lectura);
            var lvlE = self.getEscrituraNivel(fila.escritura);
            var total = self.getTotalPuntos(fila.lectura, fila.escritura);

            var renderIndCells = function(lvlActive, targetLvl, fieldName) {
                if (lvlActive === targetLvl) {
                    var style = self.getNivelStyles(targetLvl);
                    return '<td class="pf-ind-' + fieldName + '-' + targetLvl + '" style="text-align:center; font-weight:800; font-size:13px; border-right: 1px solid #cbd5e1; width:30px; background:' + style.bg + '; color:' + style.color + ';">X</td>';
                }
                return '<td class="pf-ind-' + fieldName + '-' + targetLvl + '" style="text-align:center; font-weight:800; font-size:13px; border-right: 1px solid #cbd5e1; width:30px;"></td>';
            };

            return '<tr data-row-idx="' + idx + '" style="border-bottom: 1px solid #cbd5e1;">' +
                '<td style="text-align:center; padding: 8px 6px; color:#64748b; font-size:12px; border-right: 1px solid #cbd5e1;">' + (idx + 1) + '</td>' +
                '<td style="padding: 8px 12px; font-size:13px; color:#334155; font-weight:600; border-right: 1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center;">' + 
                    '<span>' + fila.nombre + '</span>' +
                    '' +
                '</td>' +
                
                // Lectura y Gramática input
                '<td style="padding: 0; text-align:center; border-right: 1px solid #cbd5e1; width: 90px;">' +
                    '<input type="number" min="0" max="48" value="' + (fila.lectura !== undefined ? fila.lectura : '') + '" ' +
                           'class="pf-monthly-inp pf-grid-input" ' +
                           'oninput="Views.PruebasFormativas.updateCell(' + idx + ', \'lectura\', this.value)" ' +
                           'onkeydown="Views.PruebasFormativas.handleInputKey(event, ' + idx + ', \'lectura\')" />' +
                '</td>' +
                
                // Desempeño Lectura (I, DM, S, A)
                renderIndCells(lvlL, 'I', 'lectura') +
                renderIndCells(lvlL, 'DM', 'lectura') +
                renderIndCells(lvlL, 'S', 'lectura') +
                renderIndCells(lvlL, 'A', 'lectura') +
                
                // Escritura input
                '<td style="padding: 0; text-align:center; border-right: 1px solid #cbd5e1; width: 90px;">' +
                    '<input type="number" min="0" max="20" value="' + (fila.escritura !== undefined ? fila.escritura : '') + '" ' +
                           'class="pf-monthly-inp pf-grid-input" ' +
                           'oninput="Views.PruebasFormativas.updateCell(' + idx + ', \'escritura\', this.value)" ' +
                           'onkeydown="Views.PruebasFormativas.handleInputKey(event, ' + idx + ', \'escritura\')" />' +
                '</td>' +
                
                // Desempeño Escritura (I, DM, S, A)
                renderIndCells(lvlE, 'I', 'escritura') +
                renderIndCells(lvlE, 'DM', 'escritura') +
                renderIndCells(lvlE, 'S', 'escritura') +
                renderIndCells(lvlE, 'A', 'escritura') +
                
                // Total
                '<td class="pf-total-puntos" style="text-align:center; font-weight:800; font-size:13px; color:#0f172a; background:#f8fafc; width: 90px;">' + total + '</td>' +
            '</tr>';
        }).join('');

        var renderDashboardSection = function(title, area) {
            var st = stats[area];
            var tot = st.total || 0;
            var pA = tot > 0 ? Math.round(st.A / tot * 100) : 0;
            var pS = tot > 0 ? Math.round(st.S / tot * 100) : 0;
            var pDM = tot > 0 ? Math.round(st.DM / tot * 100) : 0;
            var pI = tot > 0 ? Math.round(st.I / tot * 100) : 0;
            var isLectura = (area === 'lectura');
            var maxPts = isLectura ? 48 : 20;

            return '<div class="pf-chart" style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 16px;">' +
                '<div style="background:#f1f5f9; border-bottom:1px solid #cbd5e1; padding:10px 14px; font-weight:700; font-size:13px; color:#0f172a; display:flex; align-items:center; justify-content:space-between;">' +
                    '<span style="display:flex; align-items:center; gap:8px;"><i data-lucide="table" style="width:16px;height:16px;color:#0284c7;"></i> RESULTADOS: ' + title.toUpperCase() + ' (Máx. ' + maxPts + ' pts)</span>' +
                    '<span style="font-size:12px; font-weight:700; color:#475569;">Evaluados: ' + tot + '</span>' +
                '</div>' +
                '<div style="padding: 12px;">' +
                    '<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center; border: 1px solid #cbd5e1;">' +
                        '<thead>' +
                            '<tr style="background:#f8fafc; border-bottom:1px solid #cbd5e1;">' +
                                '<th style="padding:6px 8px; text-align:left; border-right:1px solid #cbd5e1; color:#334155; font-weight:700;">Nivel</th>' +
                                '<th style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#334155; font-weight:700; width:65px;">Rango</th>' +
                                '<th style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#334155; font-weight:700; width:55px;">Cant.</th>' +
                                '<th style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#334155; font-weight:700; width:55px;">%</th>' +
                                '<th style="padding:6px 8px; color:#334155; font-weight:700; text-align:left;">Distribución</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>' +
                            '<tr style="border-bottom:1px solid #e2e8f0; background:#f0fdf4;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#166534; border-right:1px solid #cbd5e1;">Avanzado (A)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#166534; font-weight:600; font-size:11px;">' + (isLectura ? '43-48' : '17-20') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#166534; border-right:1px solid #cbd5e1;">' + st.A + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#166534; border-right:1px solid #cbd5e1;">' + pA + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#dcfce7; border:1px solid #86efac; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#22c55e; height:100%; width:' + pA + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="border-bottom:1px solid #e2e8f0; background:#f7fee7;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#3f6212; border-right:1px solid #cbd5e1;">Satisfactorio (S)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#3f6212; font-weight:600; font-size:11px;">' + (isLectura ? '34-42' : '13-16') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#3f6212; border-right:1px solid #cbd5e1;">' + st.S + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#3f6212; border-right:1px solid #cbd5e1;">' + pS + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#ecfccb; border:1px solid #bef264; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#84cc16; height:100%; width:' + pS + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="border-bottom:1px solid #e2e8f0; background:#fefce8;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#854d0e; border-right:1px solid #cbd5e1;">Debe Mejorar (DM)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#854d0e; font-weight:600; font-size:11px;">' + (isLectura ? '19-33' : '9-12') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#854d0e; border-right:1px solid #cbd5e1;">' + st.DM + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#854d0e; border-right:1px solid #cbd5e1;">' + pDM + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#fef9c3; border:1px solid #fde047; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#eab308; height:100%; width:' + pDM + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="border-bottom:1px solid #cbd5e1; background:#fef2f2;">' +
                                '<td style="padding:6px 8px; text-align:left; font-weight:700; color:#991b1b; border-right:1px solid #cbd5e1;">Insatisfactorio (I)</td>' +
                                '<td style="padding:6px 8px; border-right:1px solid #cbd5e1; color:#991b1b; font-weight:600; font-size:11px;">' + (isLectura ? '0-18' : '0-8') + '</td>' +
                                '<td style="padding:6px 8px; font-weight:800; color:#991b1b; border-right:1px solid #cbd5e1;">' + st.I + '</td>' +
                                '<td style="padding:6px 8px; font-weight:700; color:#991b1b; border-right:1px solid #cbd5e1;">' + pI + '%</td>' +
                                '<td style="padding:6px 8px; text-align:left;">' +
                                    '<div style="background:#fee2e2; border:1px solid #fca5a5; height:12px; width:100%; border-radius:2px; overflow:hidden;">' +
                                        '<div style="background:#ef4444; height:100%; width:' + pI + '%;"></div>' +
                                    '</div>' +
                                '</td>' +
                            '</tr>' +
                            '<tr style="background:#f8fafc; font-weight:800;">' +
                                '<td colspan="2" style="padding:6px 8px; text-align:left; color:#1e293b; border-right:1px solid #cbd5e1;">Total Evaluados</td>' +
                                '<td style="padding:6px 8px; color:#0284c7; border-right:1px solid #cbd5e1;">' + tot + '</td>' +
                                '<td style="padding:6px 8px; color:#0284c7; border-right:1px solid #cbd5e1;">100%</td>' +
                                '<td style="padding:6px 8px; color:#64748b; font-size:11px; text-align:left;">100% completado</td>' +
                            '</tr>' +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';
        };

        var summaryTable = '<div class="pf-chart" style="background:#fff; border: 1px solid #cbd5e1; border-radius:4px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">' +
            '<table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center;">' +
                '<thead>' +
                    '<tr><th colspan="3" style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; padding:10px 12px; color:#0f172a; font-weight:700; font-size:13px; text-align:center;">Resumen de Educandos por Nivel de Desempeño</th></tr>' +
                    '<tr><th rowspan="3" style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; padding:8px; color:#475569; font-weight:700;">Nivel de<br>Desempeño</th><th colspan="2" style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; padding:8px; color:#475569; font-weight:700;">Datos de la Sección:</th></tr>' +
                    '<tr><th style="background:#ffffff; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#64748b; font-weight:600;">Sección:</th><th style="border-bottom: 1px solid #cbd5e1; color:#0f172a; font-weight:700;">'+(c.seccion||'-')+'</th></tr>' +
                    '<tr><th style="background:#ffffff; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#64748b; font-weight:600;">Grado:</th><th style="border-bottom: 1px solid #cbd5e1; color:#0f172a; font-weight:700;">'+(c.grado||'-')+'</th></tr>' +
                    '<tr><th style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;"></th><th style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#166534; font-weight:700; padding:8px;">Lectura y Gramática</th><th style="background:#f8fafc; border-bottom: 1px solid #cbd5e1; color:#7c3aed; font-weight:700; padding:8px;">Escritura</th></tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr><td style="background:#dcfce7; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#166534; padding:8px;">AVANZADO (A)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.A+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.A+'</td></tr>' +
                    '<tr><td style="background:#ecfccb; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#3f6212; padding:8px;">SATISFACTORIO (S)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.S+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.S+'</td></tr>' +
                    '<tr><td style="background:#fef9c3; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#854d0e; padding:8px;">DEBE MEJORAR (DM)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.DM+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.DM+'</td></tr>' +
                    '<tr><td style="background:#fee2e2; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:700; color:#991b1b; padding:8px;">INSATISFACTORIO (I)</td><td style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.lectura.I+'</td><td style="border-bottom: 1px solid #cbd5e1; color:#1e293b; font-weight:700;">'+stats.escritura.I+'</td></tr>' +
                    '<tr><td style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-weight:800; color:#334155; padding:8px;">Total Evaluados</td><td style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; color:#0284c7; font-weight:800;">'+stats.lectura.total+'</td><td style="background:#f1f5f9; border-bottom: 1px solid #cbd5e1; color:#0284c7; font-weight:800;">'+stats.escritura.total+'</td></tr>' +
                    '<tr><td colspan="3" style="background:#f8fafc; padding:10px; font-weight:600; color:#475569;">Porcentaje Evaluados: <span style="font-weight:800; color:#0284c7;">'+ (matriculaTotal > 0 ? '100%' : '0%') +'</span></td></tr>' +
                '</tbody>' +
            '</table></div>';

        return '<style>' +
            '@media print {' +
            '  @page { margin: 1cm; }' +
            '  body, html, #app, .app-container, .gdhn-content, .main-content { height: auto !important; overflow: visible !important; position: static !important; background: #fff !important; }' +
            '  .gdhn-sidebar, .sidebar, .gdhn-header, .top-nav, .mobile-nav, .a360-header { display: none !important; }' +
            '  #pf-layout-container { display: block !important; }' +
            '  #pf-table-column, #pf-graphics-column { width: 100% !important; display: block !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin-bottom: 24px !important; opacity: 1 !important; height: auto !important; pointer-events: auto !important; }' +
            '  .c1-wrap { padding: 0 !important; background: #fff !important; }' +
            '  #pf-layout-container > div, table, .pf-chart { page-break-inside: auto !important; }' +
            '  tr { page-break-inside: avoid !important; page-break-after: auto !important; }' +
            '  .pf-pie-container { display: flex !important; flex-wrap: wrap !important; page-break-inside: avoid !important; }' +
            '  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
            '  ::-webkit-scrollbar { display: none !important; }' +
            '}' +
            '.pf-grid-input, input.pf-con-inp, input.pf-monthly-inp {' +
            '  width: 100% !important; height: 32px !important; border: none !important;' +
            '  border-radius: 0 !important; outline: none !important; box-shadow: none !important;' +
            '  background: transparent !important; text-align: center !important;' +
            '  font-weight: 700 !important; font-size: 12px !important; color: #0f172a !important;' +
            '  padding: 0 !important; margin: 0 !important; box-sizing: border-box !important;' +
            '}' +
            '.pf-grid-input:focus, input.pf-con-inp:focus, input.pf-monthly-inp:focus {' +
            '  background: #e0f2fe !important; box-shadow: inset 0 0 0 2px #0284c7 !important;' +
            '}' +
            '.pf-grid-input::-webkit-outer-spin-button, .pf-grid-input::-webkit-inner-spin-button,' +
            'input.pf-con-inp::-webkit-outer-spin-button, input.pf-con-inp::-webkit-inner-spin-button,' +
            'input.pf-monthly-inp::-webkit-outer-spin-button, input.pf-monthly-inp::-webkit-inner-spin-button {' +
            '  -webkit-appearance: none !important; margin: 0 !important;' +
            '}' +
            '.pf-grid-input[type=number], input.pf-con-inp[type=number], input.pf-monthly-inp[type=number] {' +
            '  -moz-appearance: textfield !important;' +
            '}' +
            '.pf-icon-btn {' +
            '  width: 36px; height: 36px; display: grid; place-items: center;' +
            '  border-radius: 10px; background: #ffffff; border: 1.5px solid #cbd5e1;' +
            '  color: #334155; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);' +
            '  cursor: pointer; transition: all 0.2s ease;' +
            '}' +
            '.pf-icon-btn:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; transform: translateY(-1px); }' +
            '.pf-icon-btn.active { background: rgba(0, 200, 83, 0.08) !important; border-color: rgba(0, 200, 83, 0.35) !important; color: #00C853 !important; }' +
            '.pf-mode-pill { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }' +
            '.pf-mode-pill.active { background: #00C853; color: #fff; border-color: #00a846; box-shadow: 0 2px 4px rgba(0,200,83,0.25); }' +
            '.pf-mode-pill:not(.active) { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }' +
            '.pf-mode-pill:not(.active):hover { background: #e2e8f0; color: #1e293b; }' +
            '#pf-graphics-column { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }' +
            '#pf-graphics-column.collapsed { flex: 0 0 0 !important; width: 0 !important; min-width: 0 !important; opacity: 0 !important; pointer-events: none !important; margin-left: -24px !important; }' +
            '</style>' +
            '<div class="c1-wrap" style="background:#f8fafc; padding-bottom:40px; font-family: \'Inter\', sans-serif;">' +
            
            '<!-- Toolbar Cabecera -->' +
            '<div class="a360-header" style="margin-bottom: 24px; background: #fff; padding: 12px 20px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">' +
                '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' +
                    '<button onclick="window.toggleSidebar()" class="pf-icon-btn" title="Alternar menú lateral"><i data-lucide="layout-sidebar" stroke-width="2.5" style="width:18px;height:18px;"></i></button>' +
                    '<div style="border-left: 1px solid #e2e8f0; height: 24px; margin: 0 4px;"></div>' +
                    
                    '<!-- Switchers de Modo -->' +
                    '<button onclick="Views.PruebasFormativas.changeMes(\'Febrero/Marzo\')" class="pf-mode-pill active" title="Ver un solo mes con detalle de casillas">' +
                        '<i data-lucide="calendar" style="width:14px; height:14px;"></i> Vista por Mes' +
                    '</button>' +
                    '<button onclick="Views.PruebasFormativas.changeMes(\'all\')" class="pf-mode-pill" title="Ver y llenar todos los meses juntos">' +
                        '<i data-lucide="table-2" style="width:14px; height:14px;"></i> Todos los Meses (Sábana Anual)' +
                    '</button>' +

                    '<div style="border-left: 1px solid #e2e8f0; height: 24px; margin: 0 4px;"></div>' +
                    '<button onclick="Views.PruebasFormativas.prevMonth()" class="pf-icon-btn" title="Mes Anterior" style="'+(prevDisabled ? 'opacity:0.3; pointer-events:none; cursor:not-allowed;' : '')+'" '+(prevDisabled ? 'disabled' : '')+'><i data-lucide="arrow-left" stroke-width="2.5" style="width:18px;height:18px;"></i></button>' +
                    '<div style="display:flex; align-items:center; background:rgba(0, 200, 83, 0.08); border:1.5px solid rgba(0, 200, 83, 0.25); padding:4px 12px; border-radius:99px; color:#00C853; font-size:13px; font-weight:700; gap:6px;">' +
                        '<i data-lucide="calendar" style="width:14px; height:14px; color:#00C853;"></i>' +
                        '<select style="font-weight:700; color:#00C853; border:none; background:transparent; cursor:pointer; outline:none; font-size:13px; padding-right: 4px;" onchange="Views.PruebasFormativas.changeMes(this.value)">' +
                            mesOptions +
                        '</select>' +
                    '</div>' +
                    '<button onclick="Views.PruebasFormativas.nextMonth()" class="pf-icon-btn" title="Mes Siguiente" style="'+(nextDisabled ? 'opacity:0.3; pointer-events:none; cursor:not-allowed;' : '')+'" '+(nextDisabled ? 'disabled' : '')+'><i data-lucide="arrow-right" stroke-width="2.5" style="width:18px;height:18px;"></i></button>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">' +
                    '<button onclick="Views.PruebasFormativas.runRecoveryUI()" class="btn btn-sm btn-outline" style="display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; border-radius:8px; border-color:#f59e0b; color:#b45309; background:#fffbeb;" title="Escanear y recuperar datos de pruebas formativas huérfanos o desvinculados"><i data-lucide="life-buoy" style="width:14px; height:14px;"></i> Rescatar Datos</button>' +
                    '<button onclick="window.print()" class="pf-icon-btn" title="Imprimir reporte"><i data-lucide="printer" stroke-width="2.2" style="width:16px;height:16px;"></i></button>' +
                    '<button onclick="Views.PruebasFormativas.previewShare()" class="pf-icon-btn" title="Compartir reporte" style="background:#0ea5e9; color:#fff; border-color:#0284c7;"><i data-lucide="share-2" stroke-width="2.2" style="width:16px;height:16px;color:#fff;"></i></button>' +
                    '<button onclick="Views.PruebasFormativas.openGroupAnalysisModal()" class="pf-icon-btn" title="Análisis Grupal de Escritura" style="background:linear-gradient(135deg, #0ea5e9, #3b82f6); color:#fff; border:none; box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);"><i data-lucide="sparkles" stroke-width="2.2" style="width:16px;height:16px;color:#fff;"></i></button>' +
                    '<div style="border-left: 1px solid #e2e8f0; height: 24px; margin: 0 4px;"></div>' +
                    '<button id="pf-toggle-right-btn" onclick="Views.PruebasFormativas.toggleRight()" class="pf-icon-btn '+(self.state.rightOpen ? 'active' : '')+'" title="Alternar panel de gráficos"><i data-lucide="panel-right" stroke-width="2.5" style="width:18px;height:18px;"></i></button>' +
                '</div>' +
            '</div>' +

            '<div id="pf-layout-container" style="display:flex; gap:24px; flex-wrap:nowrap; align-items:flex-start; width:100%; transition: all 0.3s ease;">' +
                '<!-- Left Column: Table -->' +
                '<div id="pf-table-column" style="flex: 1.6; min-width: 320px; background:#fff; border-radius:16px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow:hidden; padding: 24px; transition: all 0.3s ease;">' +
                    '<div style="text-align:center; font-weight:800; font-size:15px; color:#0f172a; margin-bottom: 24px; letter-spacing:-0.01em;">TABULACIÓN DE PRUEBAS FORMATIVAS DE ESPAÑOL (' + self.state.mes.toUpperCase() + ')</div>' +
                    
                    '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom: 24px; background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">' +
                        '<div style="display:flex; flex-direction:column; gap:12px;">' +
                            '<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:6px;">' +
                                '<span style="font-size:11px; color:#64748b; font-weight:600; letter-spacing:0.02em;">GRADO</span> <span style="font-size:13px; font-weight:700; color:#1e293b;">'+grado+'</span>' +
                            '</div>' +
                            '<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:6px;">' +
                                '<span style="font-size:11px; color:#64748b; font-weight:600; letter-spacing:0.02em;">CENTRO EDUCATIVO</span> <span style="font-size:12px; font-weight:700; color:#1e293b; text-transform:uppercase; text-align:right;">'+centroEdu+'</span>' +
                            '</div>' +
                            '<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:6px;">' +
                                '<span style="font-size:11px; color:#64748b; font-weight:600; letter-spacing:0.02em;">MUNICIPIO</span> <span style="font-size:12px; font-weight:700; color:#1e293b; text-transform:uppercase;">'+municipio+'</span>' +
                            '</div>' +
                        '</div>' +
                        '<div style="display:flex; flex-direction:column; gap:12px;">' +
                            '<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:6px;">' +
                                '<span style="font-size:11px; color:#64748b; font-weight:600; letter-spacing:0.02em;">SECCIÓN</span> <span style="font-size:13px; font-weight:700; color:#1e293b;">'+seccion+'</span>' +
                            '</div>' +
                            '<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:6px;">' +
                                '<span style="font-size:11px; color:#64748b; font-weight:600; letter-spacing:0.02em;">LUGAR / COLONIA</span> <span style="font-size:12px; font-weight:700; color:#1e293b; text-transform:uppercase; text-align:right;">'+comunidad+'</span>' +
                            '</div>' +
                            '<div style="display:flex; justify-content:space-between; border-bottom:1px dashed #cbd5e1; padding-bottom:6px;">' +
                                '<span style="font-size:11px; color:#64748b; font-weight:600; letter-spacing:0.02em;">MATRÍCULA TOTAL</span> <span style="font-size:14px; font-weight:800; color:#0284c7;">'+matriculaTotal+'</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<div style="display:flex; flex-wrap:wrap; font-size:11px; font-weight:600; gap:10px; color:#475569; margin-bottom: 20px;">' +
                        '<div style="padding: 6px 12px; display:flex; align-items:center; background:#f1f5f9; border-radius:8px; color:#334155; font-weight:700;">Simbología:</div>' +
                        '<div style="background:#dcfce7; color:#166534; padding: 6px 14px; border-radius:8px; text-align:center; border:1px solid #bbf7d0;">Avanzado (A)</div>' +
                        '<div style="background:#ecfccb; color:#3f6212; padding: 6px 14px; border-radius:8px; text-align:center; border:1px solid #d9f99d;">Satisfactorio (S)</div>' +
                        '<div style="background:#fef9c3; color:#854d0e; padding: 6px 14px; border-radius:8px; text-align:center; border:1px solid #fef08a;">Debe Mejorar (DM)</div>' +
                        '<div style="background:#fee2e2; color:#991b1b; padding: 6px 14px; border-radius:8px; text-align:center; border:1px solid #fecaca;">Insatisfactorio (I)</div>' +
                    '</div>' +
                    
                    '<div style="overflow-x:auto; border: 1px solid #cbd5e1; border-radius: 12px;">' +
                        '<table style="width:100%; border-collapse:collapse; text-align:left;">' +
                            '<thead>' +
                                '<tr style="background:#f8fafc; border-bottom: 1px solid #cbd5e1;">' +
                                    '<th rowspan="2" style="padding: 10px 6px; font-size:11px; text-align:center; color:#475569; font-weight:700; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">N°</th>' +
                                    '<th rowspan="2" style="padding: 10px 12px; font-size:11px; text-align:left; color:#475569; font-weight:700; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">Nombre del estudiante</th>' +
                                    '<th rowspan="2" style="padding: 10px 6px; font-size:11px; text-align:center; color:#475569; font-weight:700; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 90px;">Lectura y Gramática</th>' +
                                    '<th colspan="4" style="background:#f1f5f9; padding: 6px; font-size:11px; text-align:center; color:#475569; font-weight:700; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">Desempeño Lectura y Gramática</th>' +
                                    '<th rowspan="2" style="padding: 10px 6px; font-size:11px; text-align:center; color:#475569; font-weight:700; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 90px;">Escritura</th>' +
                                    '<th colspan="4" style="background:#f1f5f9; padding: 6px; font-size:11px; text-align:center; color:#475569; font-weight:700; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">Desempeño Escritura</th>' +
                                    '<th rowspan="2" style="padding: 10px 6px; font-size:11px; text-align:center; color:#475569; font-weight:700; border-bottom: 1px solid #cbd5e1; width: 90px;">Total de puntos</th>' +
                                '</tr>' +
                                '<tr style="background:#f8fafc; border-bottom: 1px solid #cbd5e1;">' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">I</th>' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">DM</th>' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">S</th>' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">A</th>' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">I</th>' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">DM</th>' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">S</th>' +
                                    '<th style="padding: 6px 4px; font-size:10px; text-align:center; color:#64748b; font-weight:600; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; width: 30px;">A</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' +
                                trows +
                            '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>' +
                
                '<!-- Right Column: Dashboard -->' +
                '<div id="pf-graphics-column" class="'+(self.state.rightOpen ? '' : 'collapsed')+'" style="flex: 1; min-width: 300px; display:flex; flex-direction:column; gap:24px;">' +
                    renderDashboardSection('Lectura y Gramática', 'lectura') +
                    renderDashboardSection('Escritura', 'escritura') +
                    summaryTable +
                '</div>' +
            '</div>' +
        '</div>';
    }
};

// ============================================================
// Mí“DULO: CUADRO #1 — Cuadro de Calificaciones No. 1 (SACE)
// ============================================================
// Legacy desactivado: la implementacion oficial vive en cuadro_sace.js
Views._Cuadro1Legacy = {
    // Key en localStorage para guardar datos del cuadro1
    _key: function () { return 'cuadro1_' + (Store.data.activeCourseId || 'none'); },

    getData: function () {
        var raw = localStorage.getItem(this._key());
        return raw ? JSON.parse(raw) : null;
    },

    saveData: function (data) {
        localStorage.setItem(this._key(), JSON.stringify(data));
    },

    // Construye la estructura base a partir de los parciales y estudiantes del curso activo
    buildDefault: function () {
        var c = Store.getActiveCourse();
        if (!c) return null;
        var students = Store.getStudentsByCourse(c.id);
        var parciales = (Store.data.parciales || []).filter(function (p) { return p.cursoId === c.id; });
        // Si no hay parciales definidos, crear 4 por defecto
        if (parciales.length === 0) {
            parciales = [
                { id: 'p1', nombre: 'Parcial I' },
                { id: 'p2', nombre: 'Parcial II' },
                { id: 'p3', nombre: 'Parcial III' },
                { id: 'p4', nombre: 'Parcial IV' }
            ];
        } else {
            // Asegurar máximo 4
            parciales = parciales.slice(0, 4);
        }

        var filas = students.map(function (st) {
            var pData = {};
            parciales.forEach(function (p) {
                pData[p.id] = { in: '', nt: '', nf: '' };
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

        return { parciales: parciales.map(function (p) { return { id: p.id, nombre: p.nombre || ('Parcial ' + p.id) }; }), filas: filas };
    },

    // Calcula la nota final promedio de los parciales NF
    calcPromedio: function (fila, parciales) {
        var sum = 0, count = 0;
        parciales.forEach(function (p) {
            var nf = parseFloat(fila.parciales[p.id] && fila.parciales[p.id].nf);
            if (!isNaN(nf)) { sum += nf; count++; }
        });
        if (count === 0) return '';
        return Math.round(sum / count);
    },

    // Determina la observación según promedio final
    getObs: function (pf, rec) {
        var score = parseFloat(pf);
        var recScore = parseFloat(rec);
        if (isNaN(score) && isNaN(recScore)) return '';
        var finalScore = isNaN(score) ? recScore : score;
        if (!isNaN(recScore) && recScore >= 60) return 'BÁSICO [APROBADO EN RECUPERACIí“N]';
        if (finalScore >= 91) return 'EXCELENTE';
        if (finalScore >= 81) return 'AVANZADO';
        if (finalScore >= 70) return 'BÁSICO';
        return 'INICIAL';
    },

    render: function () {
        var c = Store.getActiveCourse();
        if (!c) {
            return '<div class="card"><div class="card-b c1-no-course"><i data-lucide="file-spreadsheet" style="width:48px;height:48px;opacity:0.3;margin-bottom:12px;"></i><div style="font-size:15px;font-weight:700;">Selecciona un curso activo</div><div style="font-size:13px;margin-top:6px;">Necesitas tener un curso activo para generar el Cuadro #1</div></div></div>';
        }

        var saved = this.getData();
        var data = saved || this.buildDefault();
        if (!saved) this.saveData(data);

        var parciales = data.parciales || [];
        var filas = data.filas || [];
        var self = this;

        // â”€â”€ Encabezado de la tabla â”€â”€
        var thParciales = parciales.map(function (p) {
            return '<th colspan="3">' + p.nombre.toUpperCase() + '</th>';
        }).join('');
        var thSubParciales = parciales.map(function () {
            return '<th class="c1-in">IN</th><th class="c1-nt">NT</th><th class="c1-nf">NF</th>';
        }).join('');

        // â”€â”€ Filas de datos â”€â”€
        var trows = filas.map(function (fila, idx) {
            var pfCalc = self.calcPromedio(fila, parciales);
            var obsCalc = fila.observaciones || self.getObs(pfCalc, fila.recuperacion);
            var pfDisplay = fila.recuperacion ? fila.recuperacion : (pfCalc !== '' ? pfCalc : '');

            var tdParciales = parciales.map(function (p) {
                var pd = fila.parciales[p.id] || { in: '', nt: '', nf: '' };
                return '<td class="c1-in"><input class="c1-inp" type="number" min="0" max="100" value="' + (pd.in || '') + '" onchange="Views.Cuadro1.updateCell(' + idx + ',\'' + p.id + '\',\'in\',this.value)" /></td>'
                    + '<td class="c1-nt"><input class="c1-inp" type="number" min="0" max="100" value="' + (pd.nt || '') + '" onchange="Views.Cuadro1.updateCell(' + idx + ',\'' + p.id + '\',\'nt\',this.value)" /></td>'
                    + '<td class="c1-nf"><input class="c1-inp" type="number" min="0" max="100" value="' + (pd.nf || '') + '" onchange="Views.Cuadro1.updateCell(' + idx + ',\'' + p.id + '\',\'nf\',this.value)" /></td>';
            }).join('');

            return '<tr>'
                + '<td class="c1-num">' + (idx + 1) + '</td>'
                + '<td class="c1-nombre">' + fila.nombre + '</td>'
                + '<td class="c1-id">' + (fila.identidad || '') + '</td>'
                + tdParciales
                + '<td class="c1-rec"><input class="c1-inp" type="number" min="0" max="100" value="' + (fila.recuperacion || '') + '" onchange="Views.Cuadro1.updateRec(' + idx + ',this.value)" /></td>'
                + '<td class="c1-pf">' + (pfDisplay !== '' ? pfDisplay + '%' : '') + '</td>'
                + '<td class="c1-obs">' + obsCalc + '</td>'
                + '</tr>';
        }).join('');

        var asig = c.asignatura || '';
        var grado = c.grado || '';
        var anio = c.anio || (new Date().getFullYear());
        var seccion = c.seccion || '1';
        var jornada = c.jornada || 'MATUTINA';
        var docente = c.docente || (Store.data.configAcademica && Store.data.configAcademica.docente) || '—';
        var modalidad = c.modalidad || 'EDUCACIí“N BÁSICA';
        var centro = c.centro || '—';
        var codigo = c.codigoCentro || '—';

        return '<div class="c1-wrap">'
            + '<div class="c1-header-block">'
            + '<p class="c1-inst">República de Honduras · Secretaría de Educación</p>'
            + '<p class="c1-inst">Dirección Departamental de Educación</p>'
            + '<p class="c1-title">CUADRO DE CALIFICACIONES No. 1</p>'
            + '<p style="font-size:13px;margin-top:6px;opacity:0.80;">' + asig.toUpperCase() + '</p>'
            + '</div>'
            + '<div class="c1-meta">'
            + '<div class="c1-meta-grid">'
            + '<div class="c1-meta-row">Aí‘O: <span>PERÍODO ' + anio + '</span></div>'
            + '<div class="c1-meta-row">MODALIDAD: <span>' + modalidad.toUpperCase() + '</span></div>'
            + '<div class="c1-meta-row">CURSO: <span>' + grado.toUpperCase() + '</span></div>'
            + '<div class="c1-meta-row">JORNADA: <span>' + jornada.toUpperCase() + '</span></div>'
            + '<div class="c1-meta-row">CATEDRÁTICO/A: <span>' + docente.toUpperCase() + '</span></div>'
            + '<div class="c1-meta-row">SECCIí“N: <span>' + seccion + '</span></div>'
            + '</div>'
            + '</div>'
            + '<div class="c1-actions">'
            + '<button class="btn btn-primary btn-sm" onclick="Views.Cuadro1.importFromEvaluacion()"><i data-lucide="download" style="width:14px"></i> Importar notas desde Evaluación</button>'
            + '<button class="btn btn-secondary btn-sm" onclick="Views.Cuadro1.resetData()"><i data-lucide="refresh-cw" style="width:13px"></i> Reconstruir</button>'
            + '<div class="c1-legend">'
            + '<div class="c1-legend-item"><span class="c1-badge-in">IN</span> Inasistencias</div>'
            + '<div class="c1-legend-item"><span class="c1-badge-nt">NT</span> Nota del Parcial</div>'
            + '<div class="c1-legend-item"><span class="c1-badge-nf">NF</span> Nota Final</div>'
            + '</div>'
            + '</div>'
            + '<div class="c1-scroll-outer">'
            + '<table class="c1-table">'
            + '<thead>'
            + '<tr><th rowspan="2" class="c1-num">#</th><th rowspan="2" class="c1-nombre">NOMBRE</th><th rowspan="2" class="c1-id">IDENTIDAD</th>'
            + thParciales
            + '<th rowspan="2" class="c1-rec">RECUP.</th><th rowspan="2" class="c1-pf">PROM. FINAL</th><th rowspan="2" class="c1-obs">OBSERVACIONES</th></tr>'
            + '<tr>' + thSubParciales + '</tr>'
            + '</thead>'
            + '<tbody>' + trows + '</tbody>'
            + '</table>'
            + '</div>'
            + '</div>';
    },

    updateCell: function (rowIdx, parId, campo, val) {
        var data = this.getData();
        if (!data || !data.filas[rowIdx]) return;
        if (!data.filas[rowIdx].parciales[parId]) data.filas[rowIdx].parciales[parId] = { in: '', nt: '', nf: '' };
        data.filas[rowIdx].parciales[parId][campo] = val;
        // Auto-calcular NF = NT si se edita NT y NF estaba vacío
        if (campo === 'nt' && data.filas[rowIdx].parciales[parId].nf === '') {
            data.filas[rowIdx].parciales[parId].nf = val;
        }
        this.saveData(data);
        Router.navigate('cuadro1');
    },

    updateRec: function (rowIdx, val) {
        var data = this.getData();
        if (!data || !data.filas[rowIdx]) return;
        data.filas[rowIdx].recuperacion = val;
        this.saveData(data);
        Router.navigate('cuadro1');
    },

    importFromEvaluacion: function () {
        var c = Store.getActiveCourse();
        if (!c) { UI.toast('Sin curso activo', 'warning'); return; }
        var data = this.getData() || this.buildDefault();
        var parciales = (Store.data.parciales || []).filter(function (p) { return p.cursoId === c.id; }).slice(0, 4);
        var dataParIds = data.parciales.map(function (p) { return p.id; });

        data.filas.forEach(function (fila) {
            // Importar inasistencias por parcial
            dataParIds.forEach(function (parId, pIdx) {
                var reParc = parciales[pIdx];
                if (!reParc) return;
                // Contar inasistencias en el rango del parcial
                var inasistencias = (Store.data.asistencia || []).filter(function (a) {
                    if (a.estudianteId !== fila.estudianteId) return false;
                    if (a.cursoId !== c.id) return false;
                    if (a.estado !== 'A') return false;
                    if (reParc.fechaInicio && reParc.fechaFin) {
                        return a.fecha >= reParc.fechaInicio && a.fecha <= reParc.fechaFin;
                    }
                    return false;
                }).length;
                if (!fila.parciales[parId]) fila.parciales[parId] = { in: '', nt: '', nf: '' };
                fila.parciales[parId].in = inasistencias || '';
            });
        });

        this.saveData(data);
        Router.navigate('cuadro1');
        UI.toast('Datos importados desde Evaluación y Asistencia', 'success');
    },

    resetData: function () {
        UI.confirm('¿Reconstruir el Cuadro #1? Se perderán los datos ingresados.', function () {
            var key = Views.Cuadro1._key();
            localStorage.removeItem(key);
            Router.navigate('cuadro1');
            UI.toast('Cuadro #1 reconstruido', 'success');
        });
    }
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  BANCO CURRICULAR — Views.BancoCurricular
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•