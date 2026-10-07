Views.PruebasDiagnosticas = {
    state: { grado: '8', asignatura: 'matematicas', anio: 2026, cursoId: null },

    // --- Helpers de datos ---
    _matchCurso: function (curso, grado, asignatura) {
        var g = String(curso.grado || '').replace(/[°oO]/g, '').trim();
        var a = (curso.asignatura || '').toLowerCase();
        var gradoOk = g === String(grado);
        var asigOk = asignatura === 'matematicas'
            ? (a.includes('mat'))
            : (a.includes('esp') || a.includes('espa') || a.includes('\u00f1ol'));
        return gradoOk && asigOk;
    },
    _getCursos: function (grado, asignatura) {
        return (Store.get('cursos') || []).filter(function (c) {
            return Views.PruebasDiagnosticas._matchCurso(c, grado, asignatura);
        });
    },
    _getStudentsForCurso: function (cursoId) {
        var matriculas = (Store.get('matriculas') || []).filter(function (m) { return m.cursoId === cursoId; });
        var estudiantes = Store.get('estudiantes') || [];
        var result = [];
        matriculas.forEach(function (m) {
            var est = estudiantes.find(function (e) { return e.id === m.estudianteId; });
            if (est) result.push({ estudianteId: est.id, nombre: est.nombreCompleto });
        });
        result.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
        return result;
    },
    _syncStudents: function (pruebaKey, cursoId) {
        var enrolados = this._getStudentsForCurso(cursoId);
        var prueba = this.getPrueba(pruebaKey);
        var asignatura = this.state.asignatura;
        var grado = this.state.grado;
        var catalog = (PRUEBA_DIAGNOSTICA_CATALOG[asignatura] || {})[grado];
        var totalItems = catalog ? (catalog.totalItems || 25) : 25;
        var filas = prueba ? prueba.filas.slice() : [];
        var changed = false;
        enrolados.forEach(function (est) {
            var ya = filas.find(function (f) { return f.estudianteId === est.estudianteId; });
            if (!ya) {
                var items = [];
                for (var i = 0; i < totalItems; i++) items.push(0);
                filas.push({ estudianteId: est.estudianteId, nombre: est.nombre, items: items });
                changed = true;
            }
        });
        if (changed) {
            if (prueba) Store.update('pruebasDiagnosticas', prueba.id, { filas: filas });
            else Store.add('pruebasDiagnosticas', { key: pruebaKey, cursoId: cursoId, filas: filas, analisis: {} });
            Store.save();
        }
        return (Store.get('pruebasDiagnosticas') || []).find(function (p) { return p.key === pruebaKey; });
    },

    selectCurso: function (cursoId) {
        this.state.cursoId = cursoId;
        Router.navigate('pruebas-diagnosticas');
    },

    render: function () {
        var self = this;
        var grado = this.state.grado;
        var asignatura = this.state.asignatura;
        var anio = this.state.anio;
        var cursoId = this.state.cursoId;
        var catalog = (PRUEBA_DIAGNOSTICA_CATALOG[asignatura] || {})[grado];
        var asigLabel = asignatura === 'matematicas' ? 'Matem\u00e1ticas' : 'Espa\u00f1ol';
        var gradoLabel = grado + '\u00b0';

        var cursosMatch = this._getCursos(grado, asignatura);
        var cursoActivo = cursoId ? cursosMatch.find(function (c) { return c.id === cursoId; }) : null;

        var gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map(function (g) {
            return '<option value="' + g + '"' + (g === grado ? ' selected' : '') + '>' + g + '\u00b0</option>';
        }).join('');
        var yearOptions = [2025, 2026, 2027].map(function (y) {
            return '<option value="' + y + '"' + (y === anio ? ' selected' : '') + '>' + y + '</option>';
        }).join('');

        var html = '<style>'
            + '.diag-table{border-collapse:collapse;font-size:13px;width:100%;}'
            + '.diag-table th,.diag-table td{border:1px solid var(--border-soft);padding:3px 5px;text-align:center;white-space:nowrap;}'
            + '.diag-table thead th{background:var(--bg-soft);font-weight:700;font-size:10px;}'
            + '.diag-table td.name-col{text-align:left;min-width:170px;max-width:220px;overflow:hidden;text-overflow:ellipsis;font-weight:600;padding-left:8px;}'
            + '.diag-item-cell{cursor:pointer;font-weight:700;transition:background 0.12s,box-shadow 0.12s;min-width:22px;user-select:none;outline:none;}'
            + '.diag-item-cell:focus{box-shadow:0 0 0 2.5px #00C853 inset;position:relative;z-index:2;}'
            + '.diag-item-cell.correct{background:rgba(34,197,94,0.18);color:#15803d;}'
            + '.diag-item-cell.incorrect{background:rgba(239,68,68,0.10);color:#dc2626;}'
            + '.diag-total-row td{background:rgba(0,200,83,0.10);font-weight:800;color:var(--primary);}'
            + '.diag-pct-row td{background:rgba(139,92,246,0.09);font-weight:700;color:#8B5CF6;}'
            + '.diag-sec-title{font-size:13px;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.06em;padding:10px 14px 4px;}'
            + '.diag-std-table{width:100%;border-collapse:collapse;font-size:12px;}'
            + '.diag-std-table th,.diag-std-table td{border:1px solid var(--border-soft);padding:6px 10px;}'
            + '.diag-std-table th{background:var(--bg-soft);font-weight:700;font-size:13px;}'
            + '.curso-card{border:2px solid var(--border-soft);border-radius:12px;padding:18px 20px;cursor:pointer;transition:all 0.18s;background:var(--bg-card);}'
            + '.curso-card:hover{border-color:var(--primary);box-shadow:0 0 0 3px rgba(0,200,83,0.12);transform:translateY(-2px);}'
            + '.curso-card.active{border-color:var(--primary);background:rgba(0,200,83,0.07);}'
            + '</style>';

        html += '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h" style="flex-wrap:wrap;gap:10px;">'
            + '<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:200px;">'
            + '<div style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:10px;width:40px;height:40px;display:grid;place-items:center;flex-shrink:0;">'
            + '<i data-lucide="stethoscope" style="width:20px;height:20px;color:#fff;"></i></div>'
            + '<div><div class="title" style="font-size:15px;">Prueba Diagn\u00f3stica &mdash; ' + asigLabel + ' ' + gradoLabel + '</div>'
            + '<div style="font-size:12px;color:var(--text-muted);">Tabulaci\u00f3n y An\u00e1lisis &bull; A\u00f1o ' + anio + (cursoActivo ? ' &bull; ' + (cursoActivo.seccion || cursoActivo.nombre || '') : '') + '</div></div></div>'
            + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">'
            + '<select onchange="Views.PruebasDiagnosticas.state.asignatura=this.value;Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="border:1px solid var(--border-soft);border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;color:var(--primary);background:var(--bg-soft);">'
            + '<option value="matematicas"' + (asignatura === 'matematicas' ? ' selected' : '') + '>Matem\u00e1ticas</option>'
            + '<option value="espanol"' + (asignatura === 'espanol' ? ' selected' : '') + '>Espa\u00f1ol</option>'
            + '</select>'
            + '<select onchange="Views.PruebasDiagnosticas.state.grado=this.value;Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="border:1px solid var(--border-soft);border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;color:var(--primary);background:var(--bg-soft);">'
            + gradeOptions + '</select>'
            + '<select onchange="Views.PruebasDiagnosticas.state.anio=parseInt(this.value);Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="border:1px solid var(--border-soft);border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;color:var(--primary);background:var(--bg-soft);">'
            + yearOptions + '</select>'
            + (cursoActivo ? '<button class="btn btn-sm btn-secondary" onclick="Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="font-size:13px;"><i data-lucide="arrow-left" style="width:12px;"></i> Cursos</button>' : '')
            + '</div></div></div>';

        if (!cursoActivo) {
            html += '<div class="card" style="margin-bottom:18px;">'
                + '<div class="card-h"><div class="title"><i data-lucide="book-open" style="width:16px;vertical-align:-3px;margin-right:6px;"></i>Seleccionar Curso</div></div>'
                + '<div class="card-b">';

            if (cursosMatch.length === 0) {
                html += '<div style="text-align:center;padding:48px 20px;color:var(--text-muted);">'
                    + '<i data-lucide="alert-circle" style="width:48px;height:48px;opacity:0.3;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;"></i>'
                    + '<div style="font-size:15px;font-weight:600;margin-bottom:6px;">No hay cursos de ' + asigLabel + ' en ' + gradoLabel + ' grado</div>'
                    + '<div style="font-size:13px;">Crea un curso en el m\u00f3dulo <b>Cursos</b> con la asignatura y grado correspondiente.</div></div>';
            } else {
                html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;">';
                cursosMatch.forEach(function (c) {
                    var numAlumnos = (Store.get('matriculas') || []).filter(function (m) { return m.cursoId === c.id; }).length;
                    var pruebaKey = anio + '-' + c.id;
                    var tieneDatos = !!(Store.get('pruebasDiagnosticas') || []).find(function (p) { return p.key === pruebaKey; });
                    html += '<div class="curso-card" onclick="Views.PruebasDiagnosticas.selectCurso(\'' + c.id + '\')">'
                        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
                        + '<span style="font-size:13px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.06em;">' + (c.asignatura || '') + '</span>'
                        + (tieneDatos ? '<span style="font-size:10px;background:rgba(34,197,94,0.15);color:#15803d;border-radius:99px;padding:2px 8px;font-weight:700;">Con datos</span>' : '<span style="font-size:10px;background:var(--bg-soft);color:var(--text-muted);border-radius:99px;padding:2px 8px;">Nuevo</span>')
                        + '</div>'
                        + '<div style="font-size:17px;font-weight:800;margin-bottom:4px;">' + grado + '\u00b0 &mdash; ' + (c.seccion || c.nombre || 'Secci\u00f3n') + '</div>'
                        + '<div style="font-size:12px;color:var(--text-muted);">'
                        + '<i data-lucide="users" style="width:12px;vertical-align:-2px;margin-right:4px;"></i>' + numAlumnos + ' alumno' + (numAlumnos !== 1 ? 's' : '') + ' matriculados</div>'
                        + '</div>';
                });
                html += '</div>';
            }
            html += '</div></div>';

            if (catalog && catalog.componentes.length > 0) {
                html += this._renderStandards(catalog, asigLabel, gradoLabel);
            }
            return html;
        }

        var pruebaKey = anio + '-' + cursoActivo.id;
        var prueba = this._syncStudents(pruebaKey, cursoActivo.id);
        var seccionLabel = cursoActivo.seccion || cursoActivo.nombre || '';
        var tituloTabla = 'VIII. Tabulaci\u00f3n y An\u00e1lisis de ' + asigLabel + ' ' + gradoLabel + (seccionLabel ? ' &mdash; ' + seccionLabel : '');
        var hasCatalog = catalog && catalog.componentes && catalog.componentes.length > 0;

        if (!hasCatalog) {
            html += '<div class="card"><div class="card-b" style="text-align:center;padding:40px;color:var(--text-muted);">'
                + '<i data-lucide="file-question" style="width:48px;height:48px;opacity:0.3;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;"></i>'
                + '<div style="font-size:15px;font-weight:600;">Pauta no configurada para ' + asigLabel + ' ' + gradoLabel + '</div>'
                + '<div style="font-size:13px;margin-top:6px;">Los est\u00e1ndares para este grado se agregar\u00e1n pr\u00f3ximamente.</div>'
                + '</div></div>';
            return html;
        }

        html += this._renderStandards(catalog, asigLabel, gradoLabel);

        html += '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h" style="flex-wrap:wrap;gap:8px;">'
            + '<div><div class="title" style="font-size:13px;">' + tituloTabla + '</div>'
            + '<div style="font-size:12px;color:var(--text-muted);">Tabulaci\u00f3n manual e inteligente.</div></div>'
            + '<div style="display:flex;gap:8px;align-items:center;">'
            + '<button class="btn btn-sm btn-secondary" onclick="Views.PruebasDiagnosticas.syncManual(\'' + pruebaKey + '\',\'' + cursoActivo.id + '\')"><i data-lucide="refresh-cw" style="width:12px;"></i> Sincronizar</button>'
            + '<button class="btn btn-sm" onclick="Views.PruebasDiagnosticas.generarSARTMasivo(\'' + pruebaKey + '\')" style="background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;border:none;"><i data-lucide="zap" style="width:12px;"></i> SART</button>'
            + '</div></div>'
            + '<div class="card-b" style="padding:0;overflow-x:auto;">'
            + this.renderTabla(pruebaKey, catalog, prueba)
            + '</div></div>';

        html += '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h"><div class="title">Resumen de Niveles de Desempe\u00f1o</div></div>'
            + '<div class="card-b">' + this.renderAnalisisGlobal(catalog, prueba) + '</div></div>';

        html += this.renderAnalisisDocente(pruebaKey, prueba);

        return html;
    },

    syncManual: function (pruebaKey, cursoId) {
        this._syncStudents(pruebaKey, cursoId);
        Router.navigate('pruebas-diagnosticas');
        UI.toast('Lista de alumnos sincronizada', 'success');
    },

    _renderStandards: function (catalog, asigLabel, gradoLabel) {
        var stdRows = catalog.estandares.map(function (e) {
            return '<tr>'
                + '<td style="font-weight:600;color:var(--primary);">' + e.bloque + '</td>'
                + '<td style="font-weight:600;">' + e.componente + '</td>'
                + '<td style="text-align:left;color:var(--text-main);">' + e.estandar + '</td>'
                + '</tr>';
        }).join('');
        var pautaHeaders = catalog.componentes.map(function (comp) {
            return comp.items.map(function (i) {
                return '<th style="min-width:22px;color:var(--primary);">' + i + '</th>';
            }).join('');
        }).join('');
        var pautaVals = catalog.componentes.map(function (comp) {
            return comp.items.map(function (i) {
                var pVal = catalog.pauta[i - 1] || '---';
                return '<td style="font-weight:800;color:#8B5CF6;">' + pVal + '</td>';
            }).join('');
        }).join('');
        var compHeaders = catalog.componentes.map(function (comp) {
            return '<th colspan="' + comp.items.length + '" style="color:var(--primary);background:rgba(0,200,83,0.07);">' + comp.nombre + '</th>';
        }).join('');

        return '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h">'
            + '<div class="title">Est\u00e1ndares Evaluados &mdash; ' + asigLabel + ' ' + gradoLabel + '</div>'
            + '<span class="badge" style="background:rgba(139,92,246,0.15);color:#8B5CF6;">' + (catalog.nivel || '') + '</span>'
            + '</div>'
            + '<div class="card-b">'
            + '<table class="diag-std-table"><thead><tr>'
            + '<th style="width:120px;">Bloque</th><th style="width:150px;">Componente</th><th>Est\u00e1ndar evaluado</th>'
            + '</tr></thead><tbody>' + stdRows + '</tbody></table>'
            + '<div style="margin-top:16px;">'
            + '<div style="font-size:13px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Pauta de respuestas correctas</div>'
            + '<div style="overflow-x:auto;"><table class="diag-table" style="width:auto;">'
            + '<thead><tr><th style="width:90px;text-align:left;">Componente</th>' + compHeaders + '</tr>'
            + '<tr><th style="text-align:left;color:var(--text-muted);">N\u00b0 \u00cdtem</th>' + pautaHeaders + '</tr></thead>'
            + '<tbody><tr><td style="font-weight:700;text-align:left;padding-left:6px;">Pauta</td>' + pautaVals + '</tr></tbody>'
            + '</table></div></div></div></div>';
    },

    renderTabla: function (pruebaKey, catalog, prueba) {
        var filas = prueba ? prueba.filas : [];
        if (filas.length === 0) return '<div style="padding:40px;text-align:center;">No hay alumnos matriculados.</div>';
        
        var totalItems = catalog.totalItems || 22;
        var isEsp = this.state.asignatura === 'espanol';
        var escGral = catalog.escalas ? catalog.escalas.general : ESCALA_DIAGNOSTICA;

        var th1 = '<th rowspan="2" style="width:30px;">N\u00b0</th><th rowspan="2" style="text-align:left;min-width:180px;">Estudiante</th>';
        catalog.componentes.forEach(function (comp) {
            th1 += '<th colspan="' + comp.items.length + '" style="background:rgba(0,200,83,0.08);">' + comp.nombre + '</th>';
            if (isEsp) th1 += '<th rowspan="2" style="background:rgba(0,200,83,0.15);font-size:9px;">Subt.</th><th rowspan="2" style="background:rgba(0,200,83,0.15);font-size:9px;">Desem.</th>';
        });
        th1 += '<th rowspan="2" style="min-width:44px;">Total</th><th rowspan="2">Desempe\u00f1o Gral.</th>';

        var th2 = '';
        catalog.componentes.forEach(function (comp) {
            comp.items.forEach(function (i) { th2 += '<th style="font-size:9px;color:var(--text-muted);">' + i + '</th>'; });
        });

        var tbody = filas.map(function (fila, rowIdx) {
            var total = fila.items.reduce(function (s, v) { return s + v; }, 0);
            var nGral = _diagNivel(total, escGral);
            
            var cells = '';
            catalog.componentes.forEach(function (comp, cIdx) {
                var subt = 0;
                comp.items.forEach(function (itemNum) {
                    var val = fila.items[itemNum - 1] || 0;
                    subt += val;
                    var maxVal = (isEsp && itemNum >= 21) ? 3 : 1;
                    cells += '<td class="diag-item-cell ' + (val > 0 ? 'correct' : 'incorrect') + '"'
                        + ' tabindex="0" data-key="' + pruebaKey + '" data-row="' + rowIdx + '" data-col="' + (itemNum - 1) + '" data-max="' + maxVal + '"'
                        + ' onclick="Views.PruebasDiagnosticas.focusCell(this)" onkeydown="Views.PruebasDiagnosticas.handleCellKey(event,this)">' + val + '</td>';
                });
                if (isEsp) {
                    var keyEsc = cIdx === 0 ? 'lectura' : 'escritura';
                    var nComp = _diagNivel(subt, catalog.escalas[keyEsc]);
                    cells += '<td style="font-weight:700;background:rgba(0,200,83,0.05);">' + subt + '</td>'
                        + '<td style="font-size:10px;font-weight:700;background:' + nComp.bg + ';color:' + nComp.color + ';">' + nComp.label.substring(0, 4) + '.</td>';
                }
            });

            return '<tr><td>' + (rowIdx + 1) + '</td><td class="name-col">' + fila.nombre + '</td>' + cells 
                + '<td style="font-weight:800;background:rgba(0,200,83,0.05);">' + total + '</td>'
                + '<td style="font-size:11px;font-weight:700;color:' + nGral.color + ';background:' + nGral.bg + ';">' + nGral.label + '</td></tr>';
        }).join('');

        return '<table class="diag-table"><thead><tr>' + th1 + '</tr><tr>' + th2 + '</tr></thead><tbody>' + tbody + '</tbody></table>';
    },

    renderAnalisisGlobal: function (catalog, prueba) {
        var filas = prueba ? prueba.filas : [];
        var total_alumnos = filas.length;
        var escalas = catalog.escalas ? catalog.escalas.general : ESCALA_DIAGNOSTICA;
        
        var headerCells = escalas.map(function (n) { return '<th style="background:' + n.bg + ';color:' + n.color + ';">' + n.label + '</th>'; }).join('');
        var scaleCells = escalas.map(function (n) { return '<td style="font-weight:700;color:' + n.color + ';">' + n.min + '\u2013' + n.max + '</td>'; }).join('');
        var counts = escalas.map(function (n) {
            return filas.filter(function (f) { var t = f.items.reduce(function (s, v) { return s + v; }, 0); return t >= n.min && t <= n.max; }).length;
        });
        var countCells = counts.map(function (count, i) {
            var n = escalas[i];
            var pct = total_alumnos > 0 ? ((count / total_alumnos) * 100).toFixed(1) : '0.0';
            return '<td><div style="font-size:18px;font-weight:800;color:' + n.color + ';">' + count + '</div><div style="font-size:11px;color:var(--text-muted);">' + pct + '%</div></td>';
        }).join('');

        return '<div style="overflow-x:auto;"><table class="diag-table">'
            + '<thead><tr><th style="text-align:left;background:var(--bg-soft);">Concepto</th>' + headerCells + '</tr></thead>'
            + '<tbody><tr><td style="text-align:left;font-weight:600;">Escala</td>' + scaleCells + '</tr>'
            + '<tr><td style="text-align:left;font-weight:600;">Cant. Alumnos</td>' + countCells + '</tr></tbody></table></div>';
    },

    renderAnalisisDocente: function (pruebaKey, prueba) {
        var pValues = (prueba && prueba.analisis) ? prueba.analisis : {};
        var questions = [
            { id: 'apreciacion', q: '\u00bfCu\u00e1l es su apreciaci\u00f3n sobre los resultados?' },
            { id: 'explicacion', q: '\u00bfC\u00f3mo explica los resultados?' },
            { id: 'aspectos', q: '\u00bfQu\u00e9 aspectos influyeron?' },
            { id: 'retroalimentacion', q: '\u00bfQu\u00e9 bloque necesita mayor reforzamiento?' },
            { id: 'estrategias', q: '\u00bfQu\u00e9 estrategias utilizar\u00e1 para nivelar?' }
        ];
        var fields = questions.map(function (q) {
            return '<div style="margin-bottom:15px;">'
                + '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px;border-left:3px solid var(--primary);padding-left:4px;">' + q.q + '</label>'
                + '<textarea onchange="Views.PruebasDiagnosticas.saveAnalisis(\'' + pruebaKey + '\', \'' + q.id + '\', this.value)" '
                + 'style="width:100%;border:1px solid var(--border-soft);border-radius:10px;padding:10px;font-size:13px;background:var(--bg-soft);min-height:70px;">' + (pValues[q.id] || '') + '</textarea>'
                + '</div>';
        }).join('');

        return '<div class="card" style="margin-top:18px;">'
            + '<div class="card-h"><div class="title"><i data-lucide="message-square" style="width:16px;vertical-align:-3px;margin-right:6px;"></i>An\u00e1lisis Docente</div></div>'
            + '<div class="card-b" style="padding:20px;">' + fields + '</div></div>';
    },

    saveAnalisis: function (pruebaKey, field, val) {
        var p = this.getPrueba(pruebaKey);
        if (!p) return;
        if (!p.analisis) p.analisis = {};
        p.analisis[field] = val;
        Store.update('pruebasDiagnosticas', p.id, { analisis: p.analisis });
        Store.save();
    },

    getPrueba: function (key) {
        return (Store.get('pruebasDiagnosticas') || []).find(function (p) { return p.key === key; });
    },

    focusCell: function (td) { td.focus(); },

    checkAndGenerateSART: function (pruebaKey, fila) {
        var asig = this.state.asignatura;
        var grad = this.state.grado;
        var cursoId = this.state.cursoId;
        var catalog = (PRUEBA_DIAGNOSTICA_CATALOG[asig] || {})[grad];
        if (!catalog || !fila) return;

        var total = fila.items.reduce(function (s, v) { return s + v; }, 0);
        var escalas = catalog.escalas ? catalog.escalas.general : ESCALA_DIAGNOSTICA;
        var nivelObj = _diagNivel(total, escalas);
        
        if (nivelObj.label === 'Satisfactorio' || nivelObj.label === 'Avanzado') return;

        var desc = '[Diagn\u00f3stico ' + asig + ' ' + grad + '\u00b0] Puntaje: ' + total + '/' + (catalog.totalPuntos || 25) + '. Nivel: ' + nivelObj.label + '.';

        var startMatches = Store.get('sartAlertas').filter(function (a) {
            return a.estudianteId === fila.estudianteId && a.cursoId === cursoId && a.estado !== 'Cerrada' && a._fuente === 'diagnostico';
        });

        if (startMatches.length > 0) {
            Store.update('sartAlertas', startMatches[0].id, { descripcion: desc, nivel: (total < 10 ? 'Grave' : 'Moderado') });
        } else {
            Store.add('sartAlertas', {
                cursoId: cursoId, estudianteId: fila.estudianteId, categoria: 'Fracaso Escolar',
                nivel: (total < 10 ? 'Grave' : 'Moderado'), descripcion: desc, fecha: Utils.timestamp(),
                accionSugerida: 'Reforzamiento inmediato.', estado: 'Abierta', _fuente: 'diagnostico'
            });
        }
        Store.save();
    },

    generarSARTMasivo: function (pruebaKey) {
        var prueba = this.getPrueba(pruebaKey);
        if (!prueba || !prueba.filas) return;
        var self = this;
        prueba.filas.forEach(function (f) { self.checkAndGenerateSART(pruebaKey, f); });
        UI.toast('SART procesado', 'success');
    },

    handleCellKey: function (e, td) {
        var key = e.key;
        var maxVal = parseInt(td.dataset.max || 1);
        var isNum = /^[0-9]$/.test(key);
        if (!isNum && key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'ArrowRight' && key !== 'ArrowLeft') return;
        e.preventDefault();
        
        var pruebaKey = td.dataset.key;
        var rowIdx = parseInt(td.dataset.row);
        var itemIdx = parseInt(td.dataset.col);

        if (isNum) {
            var val = parseInt(key);
            if (val > maxVal) val = maxVal;
            var prueba = this.getPrueba(pruebaKey);
            if (!prueba) return;
            prueba.filas[rowIdx].items[itemIdx] = val;
            Store.update('pruebasDiagnosticas', prueba.id, { filas: prueba.filas });
            Store.save();
            td.textContent = val;
            td.className = 'diag-item-cell ' + (val > 0 ? 'correct' : 'incorrect');
            this.checkAndGenerateSART(pruebaKey, prueba.filas[rowIdx]);
        }

        var table = td.closest('table');
        if (key === 'ArrowDown' || isNum) {
            var next = table.querySelector('[data-row="' + (rowIdx + 1) + '"][data-col="' + itemIdx + '"]');
            if (next) next.focus();
        } else if (key === 'ArrowUp') {
            var prev = table.querySelector('[data-row="' + (rowIdx - 1) + '"][data-col="' + itemIdx + '"]');
            if (prev) prev.focus();
        } else if (key === 'ArrowRight') {
            var right = table.querySelector('[data-row="' + rowIdx + '"][data-col="' + (itemIdx + 1) + '"]');
            if (right) right.focus();
        } else if (key === 'ArrowLeft') {
            var left = table.querySelector('[data-row="' + rowIdx + '"][data-col="' + (itemIdx - 1) + '"]');
            if (left) left.focus();
        }
    },

    toggleItem: function (key, rowIdx, itemIdx) {
        var p = this.getPrueba(key);
        if (!p) return;
        p.filas[rowIdx].items[itemIdx] = p.filas[rowIdx].items[itemIdx] > 0 ? 0 : 1;
        Store.update('pruebasDiagnosticas', p.id, { filas: p.filas });
        Store.save();
        Router.navigate('pruebas-diagnosticas');
    },
    state: { grado: '8', asignatura: 'matematicas', anio: 2026, cursoId: null },

    // --- Helpers de datos ---
    _matchCurso: function (curso, grado, asignatura) {
        var g = String(curso.grado || '').replace(/[°oO]/g, '').trim();
        var a = (curso.asignatura || '').toLowerCase();
        var gradoOk = g === String(grado);
        var asigOk = asignatura === 'matematicas'
            ? (a.includes('mat'))
            : (a.includes('esp') || a.includes('espa') || a.includes('\u00f1ol'));
        return gradoOk && asigOk;
    },
    _getCursos: function (grado, asignatura) {
        return (Store.get('cursos') || []).filter(function (c) {
            return Views.PruebasDiagnosticas._matchCurso(c, grado, asignatura);
        });
    },
    _getStudentsForCurso: function (cursoId) {
        var matriculas = (Store.get('matriculas') || []).filter(function (m) { return m.cursoId === cursoId; });
        var estudiantes = Store.get('estudiantes') || [];
        var result = [];
        matriculas.forEach(function (m) {
            var est = estudiantes.find(function (e) { return e.id === m.estudianteId; });
            if (est) result.push({ estudianteId: est.id, nombre: est.nombreCompleto });
        });
        result.sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
        return result;
    },
    _syncStudents: function (pruebaKey, cursoId) {
        var enrolados = this._getStudentsForCurso(cursoId);
        var prueba = this.getPrueba(pruebaKey);
        var asignatura = this.state.asignatura;
        var grado = this.state.grado;
        var catalog = (PRUEBA_DIAGNOSTICA_CATALOG[asignatura] || {})[grado];
        var totalItems = catalog ? (catalog.totalItems || 25) : 25;
        var filas = prueba ? prueba.filas.slice() : [];
        var changed = false;
        enrolados.forEach(function (est) {
            var ya = filas.find(function (f) { return f.estudianteId === est.estudianteId; });
            if (!ya) {
                var items = [];
                for (var i = 0; i < totalItems; i++) items.push(0);
                filas.push({ estudianteId: est.estudianteId, nombre: est.nombre, items: items });
                changed = true;
            }
        });
        if (changed) {
            if (prueba) Store.update('pruebasDiagnosticas', prueba.id, { filas: filas });
            else Store.add('pruebasDiagnosticas', { key: pruebaKey, cursoId: cursoId, filas: filas, analisis: {} });
            Store.save();
        }
        return (Store.get('pruebasDiagnosticas') || []).find(function (p) { return p.key === pruebaKey; });
    },


    selectCurso: function (cursoId) {
        this.state.cursoId = cursoId;
        Router.navigate('pruebas-diagnosticas');
    },

    render: function () {
        var self = this;
        var grado = this.state.grado;
        var asignatura = this.state.asignatura;
        var anio = this.state.anio;
        var cursoId = this.state.cursoId;
        var catalog = (PRUEBA_DIAGNOSTICA_CATALOG[asignatura] || {})[grado];
        var asigLabel = asignatura === 'matematicas' ? 'Matem\u00e1ticas' : 'Espa\u00f1ol';
        var gradoLabel = grado + '\u00b0';

        // Find matching courses
        var cursosMatch = this._getCursos(grado, asignatura);

        // If cursoId is set, verify it's still valid
        var cursoActivo = cursoId ? cursosMatch.find(function (c) { return c.id === cursoId; }) : null;

        var gradeOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'].map(function (g) {
            return '<option value="' + g + '"' + (g === grado ? ' selected' : '') + '>' + g + '\u00b0</option>';
        }).join('');
        var yearOptions = [2025, 2026, 2027].map(function (y) {
            return '<option value="' + y + '"' + (y === anio ? ' selected' : '') + '>' + y + '</option>';
        }).join('');

        var html = '<style>'
            + '.diag-table{border-collapse:collapse;font-size:13px;width:100%;}'
            + '.diag-table th,.diag-table td{border:1px solid var(--border-soft);padding:3px 5px;text-align:center;white-space:nowrap;}'
            + '.diag-table thead th{background:var(--bg-soft);font-weight:700;font-size:10px;}'
            + '.diag-table td.name-col{text-align:left;min-width:170px;max-width:220px;overflow:hidden;text-overflow:ellipsis;font-weight:600;padding-left:8px;}'
            + '.diag-item-cell{cursor:pointer;font-weight:700;transition:background 0.12s,box-shadow 0.12s;min-width:22px;user-select:none;outline:none;}'
            + '.diag-item-cell:focus{box-shadow:0 0 0 2.5px #00C853 inset;position:relative;z-index:2;}'
            + '.diag-item-cell.correct{background:rgba(34,197,94,0.18);color:#15803d;}'
            + '.diag-item-cell.incorrect{background:rgba(239,68,68,0.10);color:#dc2626;}'
            + '.diag-total-row td{background:rgba(0,200,83,0.10);font-weight:800;color:var(--primary);}'
            + '.diag-pct-row td{background:rgba(139,92,246,0.09);font-weight:700;color:#8B5CF6;}'
            + '.diag-sec-title{font-size:13px;font-weight:800;color:var(--primary);text-transform:uppercase;letter-spacing:0.06em;padding:10px 14px 4px;}'
            + '.diag-std-table{width:100%;border-collapse:collapse;font-size:12px;}'
            + '.diag-std-table th,.diag-std-table td{border:1px solid var(--border-soft);padding:6px 10px;}'
            + '.diag-std-table th{background:var(--bg-soft);font-weight:700;font-size:13px;}'
            + '.curso-card{border:2px solid var(--border-soft);border-radius:12px;padding:18px 20px;cursor:pointer;transition:all 0.18s;background:var(--bg-card);}'
            + '.curso-card:hover{border-color:var(--primary);box-shadow:0 0 0 3px rgba(0,200,83,0.12);transform:translateY(-2px);}'
            + '.curso-card.active{border-color:var(--primary);background:rgba(0,200,83,0.07);}'
            + '</style>';

        // â”€â”€ HEADER â”€â”€
        html += '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h" style="flex-wrap:wrap;gap:10px;">'
            + '<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:200px;">'
            + '<div style="background:linear-gradient(135deg,#8B5CF6,#7C3AED);border-radius:10px;width:40px;height:40px;display:grid;place-items:center;flex-shrink:0;">'
            + '<i data-lucide="stethoscope" style="width:20px;height:20px;color:#fff;"></i></div>'
            + '<div><div class="title" style="font-size:15px;">Prueba Diagn\u00f3stica &mdash; ' + asigLabel + ' ' + gradoLabel + '</div>'
            + '<div style="font-size:12px;color:var(--text-muted);">Tabulaci\u00f3n y An\u00e1lisis &bull; A\u00f1o ' + anio + (cursoActivo ? ' &bull; ' + (cursoActivo.seccion || cursoActivo.nombre || '') : '') + '</div></div></div>'
            + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">'
            + '<select onchange="Views.PruebasDiagnosticas.state.asignatura=this.value;Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="border:1px solid var(--border-soft);border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;color:var(--primary);background:var(--bg-soft);">'
            + '<option value="matematicas"' + (asignatura === 'matematicas' ? ' selected' : '') + '>Matem\u00e1ticas</option>'
            + '<option value="espanol"' + (asignatura === 'espanol' ? ' selected' : '') + '>Espa\u00f1ol</option>'
            + '</select>'
            + '<select onchange="Views.PruebasDiagnosticas.state.grado=this.value;Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="border:1px solid var(--border-soft);border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;color:var(--primary);background:var(--bg-soft);">'
            + gradeOptions + '</select>'
            + '<select onchange="Views.PruebasDiagnosticas.state.anio=parseInt(this.value);Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="border:1px solid var(--border-soft);border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;color:var(--primary);background:var(--bg-soft);">'
            + yearOptions + '</select>'
            + (cursoActivo ? '<button class="btn btn-sm btn-secondary" onclick="Views.PruebasDiagnosticas.state.cursoId=null;Router.navigate(\'pruebas-diagnosticas\')" style="font-size:13px;"><i data-lucide="arrow-left" style="width:12px;"></i> Cursos</button>' : '')
            + '</div></div></div>';

        // â”€â”€ SELECTOR DE CURSOS (si no hay curso activo) â”€â”€
        if (!cursoActivo) {
            html += '<div class="card" style="margin-bottom:18px;">'
                + '<div class="card-h"><div class="title"><i data-lucide="book-open" style="width:16px;vertical-align:-3px;margin-right:6px;"></i>Seleccionar Curso</div></div>'
                + '<div class="card-b">';

            if (cursosMatch.length === 0) {
                html += '<div style="text-align:center;padding:48px 20px;color:var(--text-muted);">'
                    + '<i data-lucide="alert-circle" style="width:48px;height:48px;opacity:0.3;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;"></i>'
                    + '<div style="font-size:15px;font-weight:600;margin-bottom:6px;">No hay cursos de ' + asigLabel + ' en ' + gradoLabel + ' grado</div>'
                    + '<div style="font-size:13px;">Crea un curso en el m\u00f3dulo <b>Cursos</b> con la asignatura y grado correspondiente.</div></div>';
            } else {
                html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;">';
                cursosMatch.forEach(function (c) {
                    var numAlumnos = (Store.get('matriculas') || []).filter(function (m) { return m.cursoId === c.id; }).length;
                    var pruebaKey = anio + '-' + c.id;
                    var tieneDatos = !!(Store.get('pruebasDiagnosticas') || []).find(function (p) { return p.key === pruebaKey; });
                    html += '<div class="curso-card" onclick="Views.PruebasDiagnosticas.selectCurso(\'' + c.id + '\')">'
                        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
                        + '<span style="font-size:13px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.06em;">' + (c.asignatura || '') + '</span>'
                        + (tieneDatos ? '<span style="font-size:10px;background:rgba(34,197,94,0.15);color:#15803d;border-radius:99px;padding:2px 8px;font-weight:700;">Con datos</span>' : '<span style="font-size:10px;background:var(--bg-soft);color:var(--text-muted);border-radius:99px;padding:2px 8px;">Nuevo</span>')
                        + '</div>'
                        + '<div style="font-size:17px;font-weight:800;margin-bottom:4px;">' + grado + '\u00b0 &mdash; ' + (c.seccion || c.nombre || 'Secci\u00f3n') + '</div>'
                        + '<div style="font-size:12px;color:var(--text-muted);">'
                        + '<i data-lucide="users" style="width:12px;vertical-align:-2px;margin-right:4px;"></i>' + numAlumnos + ' alumno' + (numAlumnos !== 1 ? 's' : '') + ' matriculados</div>'
                        + '</div>';
                });
                html += '</div>';
            }
            html += '</div></div>';

            // Pauta global (informativa, sin curso seleccionado)
            if (catalog && catalog.componentes.length > 0) {
                html += this._renderStandards(catalog, asigLabel, gradoLabel);
            }
            return html;
        }

        // â”€â”€ CURSO SELECCIONADO â”€â”€
        var pruebaKey = anio + '-' + cursoActivo.id;
        // Auto-sync students from enrollments
        var prueba = this._syncStudents(pruebaKey, cursoActivo.id);

        var seccionLabel = cursoActivo.seccion || cursoActivo.nombre || '';
        var tituloTabla = 'VIII. Tabulaci\u00f3n y An\u00e1lisis en la Prueba Diagn\u00f3stica de ' + asigLabel + ' ' + gradoLabel + (seccionLabel ? ' &mdash; ' + seccionLabel : '');

        var hasCatalog = catalog && catalog.componentes && catalog.componentes.length > 0;

        if (!hasCatalog) {
            html += '<div class="card"><div class="card-b" style="text-align:center;padding:40px;color:var(--text-muted);">'
                + '<i data-lucide="file-question" style="width:48px;height:48px;opacity:0.3;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;"></i>'
                + '<div style="font-size:15px;font-weight:600;">Pauta no configurada para ' + asigLabel + ' ' + gradoLabel + '</div>'
                + '<div style="font-size:13px;margin-top:6px;">Los est\u00e1ndares para este grado se agregar\u00e1n pr\u00f3ximamente.</div>'
                + '</div></div>';
            return html;
        }

        // Sección 1: Est\u00e1ndares y Pauta
        html += this._renderStandards(catalog, asigLabel, gradoLabel);

        // Sección 2: Tabulaci\u00f3n
        html += '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h" style="flex-wrap:wrap;gap:8px;">'
            + '<div><div class="title" style="font-size:13px;">' + tituloTabla + '</div>'
            + '<div style="font-size:12px;color:var(--text-muted);">Usa las teclas â†‘â†“â†â†’ para navegar. Al registrar se calculan niveles y alertas SART autom\u00e1ticamente.</div></div>'
            + '<div style="display:flex;gap:8px;align-items:center;">'
            + '<button class="btn btn-sm btn-secondary" onclick="Views.PruebasDiagnosticas.syncManual(\'' + pruebaKey + '\',\'' + cursoActivo.id + '\')"><i data-lucide="refresh-cw" style="width:12px;"></i> Sincronizar</button>'
            + '<button class="btn btn-sm" onclick="Views.PruebasDiagnosticas.generarSARTMasivo(\'' + pruebaKey + '\')" style="background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;border:none;"><i data-lucide="zap" style="width:12px;"></i> SART</button>'
            + '</div></div>'
            + '<div class="card-b" style="padding:0;overflow-x:auto;">'
            + this.renderTabla(pruebaKey, catalog, prueba)
            + '</div></div>';

        // Sección 3: Análisis Global
        html += '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h"><div class="title">Resumen de Niveles de Desempe\u00f1o</div></div>'
            + '<div class="card-b">' + this.renderAnalisisGlobal(catalog, prueba) + '</div></div>';

        // Sección 4: Análisis Docente
        html += this.renderAnalisisDocente(pruebaKey, prueba);

        return html;
    },

    syncManual: function (pruebaKey, cursoId) {
        this._syncStudents(pruebaKey, cursoId);
        Router.navigate('pruebas-diagnosticas');
        UI.toast('Lista de alumnos sincronizada', 'success');
    },

    _renderStandards: function (catalog, asigLabel, gradoLabel) {
        var stdRows = catalog.estandares.map(function (e) {
            return '<tr>'
                + '<td style="font-weight:600;color:var(--primary);">' + e.bloque + '</td>'
                + '<td style="font-weight:600;">' + e.componente + '</td>'
                + '<td style="text-align:left;color:var(--text-main);">' + e.estandar + '</td>'
                + '</tr>';
        }).join('');
        var pautaHeaders = catalog.componentes.map(function (comp) {
            return comp.items.map(function (i) {
                return '<th style="min-width:22px;color:var(--primary);">' + i + '</th>';
            }).join('');
        }).join('');
        var pautaVals = catalog.componentes.map(function (comp) {
            return comp.items.map(function (i) {
                var pVal = catalog.pauta[i - 1] || '---';
                return '<td style="font-weight:800;color:#8B5CF6;">' + pVal + '</td>';
            }).join('');
        }).join('');
        var compHeaders = catalog.componentes.map(function (comp) {
            return '<th colspan="' + comp.items.length + '" style="color:var(--primary);background:rgba(0,200,83,0.07);">' + comp.nombre + '</th>';
        }).join('');

        return '<div class="card" style="margin-bottom:18px;">'
            + '<div class="card-h">'
            + '<div class="title">Est\u00e1ndares Evaluados &mdash; ' + asigLabel + ' ' + gradoLabel + '</div>'
            + '<span class="badge" style="background:rgba(139,92,246,0.15);color:#8B5CF6;">' + (catalog.nivel || '') + '</span>'
            + '</div>'
            + '<div class="card-b">'
            + '<table class="diag-std-table"><thead><tr>'
            + '<th style="width:120px;">Bloque</th><th style="width:150px;">Componente</th><th>Est\u00e1ndar evaluado</th>'
            + '</tr></thead><tbody>' + stdRows + '</tbody></table>'
            + '<div style="margin-top:16px;">'
            + '<div style="font-size:13px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Pauta de respuestas correctas</div>'
            + '<div style="overflow-x:auto;"><table class="diag-table" style="width:auto;">'
            + '<thead><tr><th style="width:90px;text-align:left;">Componente</th>' + compHeaders + '</tr>'
            + '<tr><th style="text-align:left;color:var(--text-muted);">N\u00b0 \u00cdtem</th>' + pautaHeaders + '</tr></thead>'
            + '<tbody><tr><td style="font-weight:700;text-align:left;padding-left:6px;">Pauta</td>' + pautaVals + '</tr></tbody>'
            + '</table></div></div></div></div>';
    },

    renderTabla: function (pruebaKey, catalog, prueba) {
        var filas = prueba ? prueba.filas : [];
        if (filas.length === 0) return '<div style="padding:40px;text-align:center;">No hay alumnos matriculados.</div>';
        
        var totalItems = catalog.totalItems || 25;
        var sumaItems = Array(totalItems).fill(0);
        filas.forEach(function (f) { f.items.forEach(function (v, i) { sumaItems[i] += v; }); });
        
        var isEsp = this.state.asignatura === 'espanol';
        var escGral = catalog.escalas ? catalog.escalas.general : ESCALA_DIAGNOSTICA;

        var th1 = '<th rowspan="2" style="width:30px;">N\u00b0</th><th rowspan="2" style="text-align:left;min-width:180px;">Estudiante</th>';
        catalog.componentes.forEach(function (comp) {
            th1 += '<th colspan="' + comp.items.length + '" style="background:rgba(0,200,83,0.08);">' + comp.nombre + '</th>';
            if (isEsp) th1 += '<th rowspan="2" style="background:rgba(0,200,83,0.15);font-size:9px;">Subt.</th><th rowspan="2" style="background:rgba(0,200,83,0.15);font-size:9px;">Desem.</th>';
        });
        th1 += '<th rowspan="2" style="min-width:44px;">Total</th><th rowspan="2">Desempe\u00f1o Gral.</th>';

        var th2 = '';
        catalog.componentes.forEach(function (comp) {
            comp.items.forEach(function (i) { th2 += '<th style="font-size:9px;color:var(--text-muted);">' + i + '</th>'; });
        });

        var tbody = filas.map(function (fila, rowIdx) {
            var total = fila.items.reduce(function (s, v) { return s + v; }, 0);
            var nGral = _diagNivel(total, escGral);
            
            var cells = '';
            catalog.componentes.forEach(function (comp, cIdx) {
                var subt = 0;
                comp.items.forEach(function (itemNum) {
                    var val = fila.items[itemNum - 1] || 0;
                    subt += val;
                    var maxVal = (isEsp && itemNum >= 21) ? 3 : 1;
                    cells += '<td class="diag-item-cell ' + (val > 0 ? 'correct' : 'incorrect') + '"'
                        + ' tabindex="0" data-key="' + pruebaKey + '" data-row="' + rowIdx + '" data-col="' + (itemNum - 1) + '" data-max="' + maxVal + '"'
                        + ' onclick="Views.PruebasDiagnosticas.focusCell(this)" onkeydown="Views.PruebasDiagnosticas.handleCellKey(event,this)">' + val + '</td>';
                });
                if (isEsp) {
                    var keyEsc = cIdx === 0 ? 'lectura' : 'escritura';
                    var nComp = _diagNivel(subt, catalog.escalas[keyEsc]);
                    cells += '<td style="font-weight:700;background:rgba(0,200,83,0.05);">' + subt + '</td>'
                        + '<td style="font-size:10px;font-weight:700;background:' + nComp.bg + ';color:' + nComp.color + ';">' + nComp.label.substring(0, 4) + '.</td>';
                }
            });

            return '<tr><td>' + (rowIdx + 1) + '</td><td class="name-col">' + fila.nombre + '</td>' + cells 
                + '<td style="font-weight:800;background:rgba(0,200,83,0.05);">' + total + '</td>'
                + '<td style="font-size:11px;font-weight:700;color:' + nGral.color + ';background:' + nGral.bg + ';">' + nGral.label + '</td></tr>';
        }).join('');

        return '<table class="diag-table"><thead><tr>' + th1 + '</tr><tr>' + th2 + '</tr></thead><tbody>' + tbody + '</tbody></table>';
    },

    renderAnalisisGlobal: function (catalog, prueba) {
        var filas = prueba ? prueba.filas : [];
        var total_alumnos = filas.length;
        var escalas = catalog.escalas ? catalog.escalas.general : ESCALA_DIAGNOSTICA;
        
        var headerCells = escalas.map(function (n) { return '<th style="background:' + n.bg + ';color:' + n.color + ';">' + n.label + '</th>'; }).join('');
        var scaleCells = escalas.map(function (n) { return '<td style="font-weight:700;color:' + n.color + ';">' + n.min + '\u2013' + n.max + '</td>'; }).join('');
        var counts = escalas.map(function (n) {
            return filas.filter(function (f) { var t = f.items.reduce(function (s, v) { return s + v; }, 0); return t >= n.min && t <= n.max; }).length;
        });
        var countCells = counts.map(function (count, i) {
            var n = escalas[i];
            var pct = total_alumnos > 0 ? ((count / total_alumnos) * 100).toFixed(1) : '0.0';
            return '<td><div style="font-size:18px;font-weight:800;color:' + n.color + ';">' + count + '</div><div style="font-size:11px;color:var(--text-muted);">' + pct + '%</div></td>';
        }).join('');

        return '<div style="overflow-x:auto;"><table class="diag-table">'
            + '<thead><tr><th style="text-align:left;background:var(--bg-soft);">Concepto</th>' + headerCells + '</tr></thead>'
            + '<tbody><tr><td style="text-align:left;font-weight:600;">Escala</td>' + scaleCells + '</tr>'
            + '<tr><td style="text-align:left;font-weight:600;">Cant. Alumnos</td>' + countCells + '</tr></tbody></table></div>';
    },

    renderAnalisisDocente: function (pruebaKey, prueba) {
        var pValues = (prueba && prueba.analisis) ? prueba.analisis : {};
        var questions = [
            { id: 'apreciacion', q: '\u00bfCu\u00e1l es su apreciaci\u00f3n sobre los resultados de la Prueba Diagn\u00f3stica?' },
            { id: 'explicacion', q: '\u00bfC\u00f3mo explica los resultados?' },
            { id: 'aspectos', q: '\u00bfQu\u00e9 aspectos influyeron?' },
            { id: 'retroalimentacion', q: '\u00bfQu\u00e9 bloque de Espa\u00f1ol necesita mayor retroalimentaci\u00f3n?' },
            { id: 'estrategias', q: '\u00bfQu\u00e9 estrategias utilizar\u00e1 para nivelar a los estudiantes ubicados en Insatisfactorio y Debe mejorar?' }
        ];
        var fields = questions.map(function (q) {
            return '<div style="margin-bottom:15px;">'
                + '<label style="display:block;font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px;padding-left:4px;border-left:3px solid var(--primary);">' + q.q + '</label>'
                + '<textarea onchange="Views.PruebasDiagnosticas.saveAnalisis(\'' + pruebaKey + '\', \'' + q.id + '\', this.value)" '
                + 'style="width:100%;border:1px solid var(--border-soft);border-radius:10px;padding:12px;font-size:13px;background:var(--bg-soft);color:var(--text-main);min-height:80px;resize:vertical;" '
                + 'placeholder="Escriba aqu\u00ed su reflexi\u00f3n...">' + (pValues[q.id] || '') + '</textarea>'
                + '</div>';
        }).join('');

        return '<div class="card" style="margin-top:18px;">'
            + '<div class="card-h"><div class="title"><i data-lucide="message-square" style="width:16px;vertical-align:-3px;margin-right:6px;"></i>An\u00e1lisis Docente (Reflexividad)</div></div>'
            + '<div class="card-b" style="padding:20px;">' + fields + '</div></div>';
    },

    saveAnalisis: function (pruebaKey, field, val) {
        var p = this.getPrueba(pruebaKey);
        if (!p) return;
        if (!p.analisis) p.analisis = {};
        p.analisis[field] = val;
        Store.update('pruebasDiagnosticas', p.id, { analisis: p.analisis });
        Store.save();
    },

    getPrueba: function (key) {
        return (Store.get('pruebasDiagnosticas') || []).find(function (p) { return p.key === key; });
    },
    savePrueba: function (key, filas, cursoId) {
        var existing = this.getPrueba(key);
        if (existing) {
            Store.update('pruebasDiagnosticas', existing.id, { filas: filas });
        } else {
            Store.add('pruebasDiagnosticas', { key: key, cursoId: cursoId || null, filas: filas, analisis: {} });
        }
        Store.save();
    },
    focusCell: function (td) {
        td.focus();
    },

    checkAndGenerateSART: function (pruebaKey, fila) {
        var asig = this.state.asignatura;
        var grad = this.state.grado;
        var cursoId = this.state.cursoId;
        var catalog = (PRUEBA_DIAGNOSTICA_CATALOG[asig] || {})[grad];
        if (!catalog || !fila) return;

        var total = fila.items.reduce(function (s, v) { return s + v; }, 0);
        var escalas = catalog.escalas ? catalog.escalas.general : ESCALA_DIAGNOSTICA;
        var nivelObj = _diagNivel(total, escalas);
        
        if (nivelObj.label === 'Satisfactorio' || nivelObj.label === 'Avanzado') return;

        var desc = '[Diagn\u00f3stico ' + (asig === 'matematicas' ? 'Matem\u00e1ticas' : 'Espa\u00f1ol') + ' ' + grad + '\u00b0] '
            + 'Puntaje: ' + total + '/' + (catalog.totalPuntos || 25) + '. Nivel: ' + nivelObj.label + '.';

        var startMatches = Store.get('sartAlertas').filter(function (a) {
            return a.estudianteId === fila.estudianteId && a.cursoId === cursoId && a.estado !== 'Cerrada' && a._fuente === 'diagnostico';
        });

        if (startMatches.length > 0) {
            Store.update('sartAlertas', startMatches[0].id, { descripcion: desc, nivel: (total < 10 ? 'Grave' : 'Moderado') });
        } else {
            Store.add('sartAlertas', {
                cursoId: cursoId, estudianteId: fila.estudianteId, categoria: 'Fracaso Escolar',
                nivel: (total < 10 ? 'Grave' : 'Moderado'), descripcion: desc, fecha: Utils.timestamp(),
                accionSugerida: 'Plan de reforzamiento inmediato.', estado: 'Abierta', _fuente: 'diagnostico'
            });
        }
        Store.save();
    },

    generarSARTMasivo: function (pruebaKey) {
        var prueba = this.getPrueba(pruebaKey);
        if (!prueba || !prueba.filas) return;
        var self = this;
        prueba.filas.forEach(function (f) { self.checkAndGenerateSART(pruebaKey, f); });
        UI.toast('SART procesado para el curso', 'success');
    },


    handleCellKey: function (e, td) {
        var key = e.key;
        if (key !== '0' && key !== '1' && key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'ArrowRight' && key !== 'ArrowLeft') return;
        e.preventDefault();
        var pruebaKey = td.dataset.key;
        var rowIdx = parseInt(td.dataset.row);
        var itemIdx = parseInt(td.dataset.col);
        var nrows = parseInt(td.dataset.nrows);

        // Solo actualizar dato si se presionó 0 o 1
        if (key === '0' || key === '1') {
            var val = parseInt(key);
            var prueba = this.getPrueba(pruebaKey);
            if (!prueba) return;
            prueba.filas[rowIdx].items[itemIdx] = val;
            Store.update('pruebasDiagnosticas', prueba.id, { filas: prueba.filas });
            Store.save();

            // Actualizar celda en el DOM sin recargar
            td.textContent = val;
            td.className = 'diag-item-cell ' + (val === 1 ? 'correct' : 'incorrect');

            // Actualizar total de la fila en el DOM
            var totalNuevo = prueba.filas[rowIdx].items.reduce(function (s, v) { return s + v; }, 0);
            var totalTd = td.closest('tr').querySelector('.diag-total-cell');
            if (totalTd) {
                totalTd.textContent = totalNuevo;
                totalTd.style.color = _diagNivelColor(totalNuevo);
                totalTd.style.background = _diagNivelBg(totalNuevo);
            }

            // â”€â”€ Generar / actualizar alerta SART basada en componentes diagnósticos â”€â”€
            Views.PruebasDiagnosticas.checkAndGenerateSART(pruebaKey, prueba.filas[rowIdx]);
        }

        // Navegar con las flechas
        var table = td.closest('table');
        var ncols = parseInt(td.dataset.ncols || 25);
        if (key === 'ArrowDown' || key === '0' || key === '1') {
            var nr = rowIdx + 1;
            if (nr <nrows) {
                var next = table.querySelector('[data-row="' + nr + '"][data-col="' + itemIdx + '"]');
                if (next) next.focus();
            }
        } else if (key === 'ArrowUp') {
            var pr = rowIdx - 1;
            if (pr >= 0) {
                var prev = table.querySelector('[data-row="' + pr + '"][data-col="' + itemIdx + '"]');
                if (prev) prev.focus();
            }
        } else if (key === 'ArrowRight') {
            var nc = itemIdx + 1;
            if (nc <ncols) {
                var right = table.querySelector('[data-row="' + rowIdx + '"][data-col="' + nc + '"]');
                if (right) right.focus();
            }
        } else if (key === 'ArrowLeft') {
            var lc = itemIdx - 1;
            if (lc >= 0) {
                var left = table.querySelector('[data-row="' + rowIdx + '"][data-col="' + lc + '"]');
                if (left) left.focus();
            }
        }
    },
    toggleItem: function (key, rowIdx, itemIdx) {
        var prueba = this.getPrueba(key);
        if (!prueba) return;
        prueba.filas[rowIdx].items[itemIdx] = prueba.filas[rowIdx].items[itemIdx] === 1 ? 0 : 1;
        Store.update('pruebasDiagnosticas', prueba.id, { filas: prueba.filas });
        Store.save();
        Router.navigate('pruebas-diagnosticas');
    }
};
