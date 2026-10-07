// =============================================================
//  MÓDULO: REPORTE DEL PARCIAL (Cuadro Controlador)
//  Aula 360 HN — Vista de Página de Word Tamaño Carta (Letter)
// =============================================================

Views.ReporteParcial = {
    state: {
        parcialId: null,
        orientation: 'portrait', // 'portrait' | 'landscape'
        zoom: 100
    },

    getData: function() {
        var c = Store.getActiveCourse();
        if (!c) return null;

        var students = Store.getStudentsByCourse(c.id).filter(s => s.estadoMatricula !== 'Traslado');
        var parciales = Store.getParcialByCourse(c.id);
        var dims = (Store.data.configAcademica && Store.data.configAcademica.dimensions) || [];
        var allActivities = (Store.get('actividades') || []).filter(a => a.cursoId === c.id);

        var currentParcialId = this.state.parcialId;
        if (!currentParcialId && parciales.length > 0) {
            currentParcialId = parciales[0].id;
            this.state.parcialId = currentParcialId;
        }

        var activities = allActivities.filter(a => a.parcialId === currentParcialId);

        return {
            course: c,
            students: students,
            parciales: parciales,
            dimensions: dims,
            activities: activities,
            currentParcialId: currentParcialId
        };
    },

    changeParcial: function(parcialId) {
        this.state.parcialId = parcialId;
        Router.navigate('reporte-parcial');
    },

    setOrientation: function(orient) {
        this.state.orientation = orient;
        Router.navigate('reporte-parcial');
    },

    setZoom: function(z) {
        this.state.zoom = Math.max(50, Math.min(150, z));
        var sheet = document.getElementById('word-document-sheet');
        var valEl = document.getElementById('word-zoom-val');
        if (sheet) {
            if (this.state.zoom === 100) {
                sheet.style.transform = 'none';
            } else {
                sheet.style.transform = 'scale(' + (this.state.zoom / 100) + ')';
                sheet.style.transformOrigin = 'top center';
            }
        }
        if (valEl) valEl.innerText = this.state.zoom + '%';
    },

    previewShare: function() {
        var data = this.getData();
        if (!data || !data.students || !data.students.length) {
            return typeof UI !== 'undefined' && UI.toast ? UI.toast('No hay datos para compartir', 'warning') : alert('No hay datos');
        }

        var c = data.course;
        var sysConfig = Store.data.configCentro || {};
        var centroEdu = c.centroEducativo || sysConfig.nombreCentro || 'CEBG. JUAN LINDO';
        var grado = c.grado || '';
        var seccion = c.seccion || '';
        var parcialNombre = (data.parciales.find(p => String(p.id) === String(data.currentParcialId)) || {}).nombre || 'I Parcial';
        var parcialId = data.currentParcialId;

        // Calcular estadísticas
        var stats = { excelente: 0, avanzado: 0, basico: 0, inicial: 0, total: 0 };
        var columns = [];
        data.dimensions.forEach(dim => {
            var dimActs = data.activities.filter(a => a.dimensionKey === dim.key);
            if (dimActs.length > 0) {
                columns.push({ dimension: dim, activities: dimActs });
            }
        });

        var extraSetting = Store.getExtraPointSettings(c.centroEducativo, Store.data.configAcademica?.anioLectivo, parcialId);
        var isExtraEnabled = extraSetting.enabled !== false;

        data.students.forEach(s => {
            var studentFinal = 0;
            var scores = (Store.get('calificaciones') || []).filter(sc => sc.estudianteId === s.id && sc.cursoId === c.id);

            columns.forEach(col => {
                var dimObtained = 0;
                var dimMax = 0;
                col.activities.forEach(act => {
                    var score = scores.find(sc => sc.actividadId === act.id);
                    var obt = score ? Number(score.puntajeObtenido) : 0;
                    var mx = Number(act.puntajeMax);
                    dimObtained += obt;
                    dimMax += mx;
                });

                var dimSub = dimMax > 0 ? ((dimObtained / dimMax) * col.dimension.porcentaje) : 0;
                studentFinal += dimSub;
            });

            var officialScore = Math.round(studentFinal);
            var extraPts = isExtraEnabled ? Store.getExtraPointsForStudent(s.id, c.id, parcialId) : 0;
            var totalAcum = officialScore + extraPts;
            var finalScore = extraSetting.final_score_mode === 'cap_reportable_at_100' ? Math.min(100, totalAcum) : totalAcum;
            var perf = Logic.getPerformance(finalScore);

            if (perf.color === 'success') stats.excelente++;
            else if (perf.color === 'primary') stats.avanzado++;
            else if (perf.color === 'warning') stats.basico++;
            else stats.inicial++;
            stats.total++;
        });

        var tot = stats.total || 1;
        var pE = Math.round(stats.excelente / tot * 100);
        var pA = Math.round(stats.avanzado / tot * 100);
        var pB = Math.round(stats.basico / tot * 100);
        var pI = Math.round(stats.inicial / tot * 100);

        var text = "📊 *Informe de Rendimiento Académico*\n";
        text += "🏫 Centro Educativo: " + centroEdu + "\n";
        var asigNombre = c.asignatura || c.materia || c.nombre || '';
        if (asigNombre) text += "📚 Asignatura: " + asigNombre + "\n";
        text += "🎓 Grado: " + grado + " - Sección " + seccion + "\n";
        text += "📅 Período: " + parcialNombre + "\n\n";
        text += "*Resumen de Desempeño (" + stats.total + " estudiantes):*\n\n";
        text += "🟢 Excelente (91-100%): " + stats.excelente + " alumnos (" + pE + "%)\n";
        text += "🔵 Avanzado (81-90%): " + stats.avanzado + " alumnos (" + pA + "%)\n";
        text += "🟡 Básico (70-80%): " + stats.basico + " alumnos (" + pB + "%)\n";
        text += "🔴 Inicial (<70%): " + stats.inicial + " alumnos (" + pI + "%)\n\n";
        text += "Generado desde Aula360 HN 📘";

        var modalHtml = '<div style="display:flex; flex-direction:column; gap:16px;">' +
            '<div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px; display:flex; align-items:center; gap:8px;"><i data-lucide="share-2" style="width:20px; color:#0ea5e9;"></i> Vista Previa del Reporte</div>' +
            '<div style="font-size:13px; color:#64748b; margin-bottom:8px;">Este es el resumen que se compartirá. Puedes editarlo antes de enviarlo.</div>' +
            '<textarea id="share-text-preview" style="width:100%; height:260px; padding:12px; font-family:monospace; font-size:13px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; color:#334155; resize:none;">' + text + '</textarea>' +
            '<div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">' +
                '<button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>' +
                '<button class="btn btn-primary" style="display:flex; align-items:center; gap:8px;" onclick="Views.ReporteParcial.executeShare()"><i data-lucide="send" style="width:16px; height:16px;"></i> Compartir ahora</button>' +
            '</div>' +
        '</div>';

        UI.modal('', modalHtml, { noHeader: true, maxWidth: '500px' });
        if (window.lucide) lucide.createIcons();
    },

    executeShare: function() {
        var text = document.getElementById('share-text-preview').value;
        if (navigator.share) {
            navigator.share({
                title: 'Reporte del Parcial',
                text: text
            }).then(function() {
                UI.closeModal();
                if (typeof UI !== 'undefined' && UI.toast) UI.toast('Reporte compartido', 'success');
            }).catch(function(err) {
                console.log('Error sharing', err);
            });
        } else {
            navigator.clipboard.writeText(text).then(function() {
                UI.closeModal();
                if (typeof UI !== 'undefined' && UI.toast) UI.toast('Texto copiado al portapapeles', 'success');
            });
        }
    },

    getBadgeStyles: function(color) {
        switch (color) {
            case 'success':
                return 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;';
            case 'primary':
                return 'background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
            case 'warning':
                return 'background: #fefce8; color: #854d0e; border: 1px solid #fef08a;';
            case 'danger':
                return 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';
            default:
                return 'background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;';
        }
    },

    render: function() {
        var data = this.getData();
        if (!data) {
            return '<div class="card"><div class="card-b c1-no-course"><i data-lucide="bar-chart-3" style="width:48px;height:48px;opacity:0.3;margin-bottom:12px;"></i><div style="font-size:15px;font-weight:700;">Selecciona un curso activo</div><div style="font-size:13px;margin-top:6px;">Necesitas tener un curso activo para ver el Reporte del Parcial</div></div></div>';
        }

        var c = data.course;
        var students = data.students;
        var parciales = data.parciales;
        var dims = data.dimensions;
        var activities = data.activities;
        var currentParcialId = data.currentParcialId;
        var isLandscape = this.state.orientation === 'landscape';

        if (students.length === 0) {
            return '<div class="card"><div class="card-b c1-no-course"><i data-lucide="users" style="width:48px;height:48px;opacity:0.3;margin-bottom:12px;"></i><div style="font-size:15px;font-weight:700;">No hay alumnos registrados</div><div style="font-size:13px;margin-top:6px;">Por favor, agrega alumnos en el módulo de Estudiantes</div></div></div>';
        }

        var sysConfig = Store.data.configCentro || {};
        var centroEdu = c.centroEducativo || sysConfig.nombreCentro || 'CEBG. JUAN LINDO';
        var municipio = c.municipio || sysConfig.municipio || 'Omoa';
        var aldea = c.comunidad || c.aldea || sysConfig.comunidad || sysConfig.aldea || c.lugar || c.direccionCentro || 'San Carlos';
        var grado = c.grado || '';
        var seccion = c.seccion || '';
        var asignatura = c.asignatura || c.materia || c.nombre || 'Asignatura';
        var anioLectivo = (Store.data.configAcademica && Store.data.configAcademica.anioLectivo) || new Date().getFullYear();
        var docente = c.docente 
            || sysConfig.docente 
            || sysConfig.nombreDocente 
            || (Store.data.perfilDocente && Store.data.perfilDocente.nombre) 
            || (Store.data.cursos && Store.data.cursos.find(cur => cur.docente)?.docente) 
            || 'Docente Titular';
        var director = c.director 
            || sysConfig.director 
            || sysConfig.nombreDirector 
            || (Store.data.centrosEducativos && Store.data.centrosEducativos.find(ce => ce.nombre === c.centroEducativo || ce.id === c.centroEducativoId)?.director)
            || (Store.data.centrosEducativos && Store.data.centrosEducativos.find(ce => ce.director)?.director)
            || (Store.data.cursos && Store.data.cursos.find(cur => cur.director)?.director)
            || '';

        // Obtener Logo del Centro Educativo
        var centroLogo = c.logo 
            || sysConfig.logo 
            || (Store.data && Store.data.configCentro && Store.data.configCentro.logo)
            || (Store.data && Array.isArray(Store.data.centrosEducativos) && (function() {
                var cleanStr = function(s) { return (s || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); };
                var m = Store.data.centrosEducativos.find(function(ce) {
                    return (c.centroEducativo && cleanStr(ce.nombre) === cleanStr(c.centroEducativo)) || (ce.id && c.centroEducativoId && ce.id === c.centroEducativoId);
                });
                if (m && m.logo) return m.logo;
                var any = Store.data.centrosEducativos.find(function(ce) { return !!ce.logo; });
                return any ? any.logo : '';
            })())
            || '';

        var centroLogoHtml = centroLogo 
            ? '<img src="' + centroLogo + '" alt="Logo Centro" style="max-width:58px; max-height:58px; width:auto; height:auto; object-fit:contain; border-radius:6px; background:#fff; padding:2px; border:1px solid #e2e8f0;" />'
            : '<svg width="54" height="54" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M 50 6 C 78 6 90 18 90 44 C 90 74 50 95 50 95 C 50 95 10 74 10 44 C 10 18 22 6 50 6 Z" fill="#0284c7" stroke="#0369a1" stroke-width="2"/>' +
                '<path d="M 50 12 C 74 12 84 22 84 45 C 84 69 50 88 50 88 C 50 88 16 69 16 45 C 16 22 26 12 50 12 Z" fill="#ffffff"/>' +
                '<circle cx="50" cy="50" r="28" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.5"/>' +
                '<polygon points="50,34 51.5,38 56,38 52.5,40.5 54,44.5 50,42 46,44.5 47.5,40.5 44,38 48.5,38" fill="#0284c7"/>' +
                '<polygon points="36,46 37.5,50 42,50 38.5,52.5 40,56.5 36,54 32,56.5 33.5,52.5 30,50 34.5,50" fill="#0284c7"/>' +
                '<polygon points="64,46 65.5,50 70,50 66.5,52.5 68,56.5 64,54 60,56.5 61.5,52.5 58,50 62.5,50" fill="#0284c7"/>' +
                '<polygon points="36,60 37.5,64 42,64 38.5,66.5 40,70.5 36,68 32,70.5 33.5,66.5 30,64 34.5,64" fill="#0284c7"/>' +
                '<polygon points="64,60 65.5,64 70,64 66.5,66.5 68,70.5 64,68 60,70.5 61.5,66.5 58,64 62.5,64" fill="#0284c7"/>' +
              '</svg>';

        var appLogoHtml = '<div style="width:58px; height:58px; display:flex; align-items:center; justify-content:center;">' +
            '<img src="logo.png" onerror="this.onerror=null; this.src=\'logo-192.png\'; if(!this.complete){this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';}" alt="Aula 360 HN" style="width:52px; height:52px; object-fit:contain; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.1); border:1px solid #e2e8f0; background:#fff; padding:2px;" />' +
            '<svg viewBox="0 0 200 200" style="display:none; width:52px; height:52px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.1);" xmlns="http://www.w3.org/2000/svg">' +
                '<defs>' +
                    '<linearGradient id="gradA360Word" x1="0%" y1="0%" x2="100%" y2="100%">' +
                        '<stop offset="0%" stop-color="#00C853" />' +
                        '<stop offset="100%" stop-color="#009624" />' +
                    '</linearGradient>' +
                '</defs>' +
                '<rect width="200" height="200" rx="44" fill="#0f172a"/>' +
                '<circle cx="100" cy="100" r="76" fill="none" stroke="url(#gradA360Word)" stroke-width="20" stroke-linecap="round" stroke-dasharray="385 100" />' +
                '<circle cx="158.2" cy="51.2" r="16" fill="#FF7A00" />' +
                '<path d="M 55 145 L 100 55 L 145 145" fill="none" stroke="#ffffff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />' +
                '<path d="M 70 112 L 130 112" fill="none" stroke="url(#gradA360Word)" stroke-width="24" stroke-linecap="round" />' +
            '</svg>' +
        '</div>';

        var currentParcialObj = data.parciales.find(p => String(p.id) === String(currentParcialId));
        var parcialNombre = currentParcialObj ? currentParcialObj.nombre : 'I Parcial';
        if (currentParcialObj && currentParcialObj.numero) {
            var labels = ['I', 'II', 'III', 'IV'];
            parcialNombre = (labels[currentParcialObj.numero - 1] || currentParcialObj.numero) + ' Parcial';
        }

        var parcialOptions = parciales.map(function(p) {
            var labels = ['I', 'II', 'III', 'IV'];
            var label = labels[p.numero - 1] || p.numero;
            return '<option value="' + p.id + '" ' + (String(currentParcialId) === String(p.id) ? 'selected' : '') + '>' + label + ' Parcial</option>';
        }).join('');

        var columns = [];
        dims.forEach(dim => {
            var dimActs = activities.filter(a => a.dimensionKey === dim.key);
            if (dimActs.length > 0) {
                columns.push({
                    dimension: dim,
                    activities: dimActs
                });
            }
        });

        // Calcular estudiantes y estadísticas de rendimiento
        var stats = { excelente: 0, avanzado: 0, basico: 0, inicial: 0, total: 0 };
        var extraSetting = Store.getExtraPointSettings(c.centroEducativo, Store.data.configAcademica?.anioLectivo, currentParcialId);
        var isExtraEnabled = extraSetting.enabled !== false;

        var dimStats = {};
        columns.forEach(col => {
            dimStats[col.dimension.key] = {
                name: col.dimension.nombre,
                porcentaje: col.dimension.porcentaje,
                totalObtained: 0,
                totalMax: 0
            };
        });

        var sumaPromedios = 0;

        var trows = students.map(function(s, idx) {
            var studentFinal = 0;
            var scores = (Store.get('calificaciones') || []).filter(sc => sc.estudianteId === s.id && sc.cursoId === c.id);

            columns.forEach(col => {
                var dimObtained = 0;
                var dimMax = 0;
                col.activities.forEach(act => {
                    var score = scores.find(sc => sc.actividadId === act.id);
                    var obt = score ? Number(score.puntajeObtenido) : 0;
                    var mx = Number(act.puntajeMax);
                    dimObtained += obt;
                    dimMax += mx;
                    
                    dimStats[col.dimension.key].totalObtained += obt;
                    dimStats[col.dimension.key].totalMax += mx;
                });

                var dimSub = dimMax > 0 ? ((dimObtained / dimMax) * col.dimension.porcentaje) : 0;
                studentFinal += dimSub;
            });

            var officialScore = Math.round(studentFinal);
            var extraPts = isExtraEnabled ? Store.getExtraPointsForStudent(s.id, c.id, currentParcialId) : 0;
            var totalAcum = officialScore + extraPts;
            var finalScore = extraSetting.final_score_mode === 'cap_reportable_at_100' ? Math.min(100, totalAcum) : totalAcum;
            sumaPromedios += finalScore;
            var perf = Logic.getPerformance(finalScore);

            if (perf.color === 'success') stats.excelente++;
            else if (perf.color === 'primary') stats.avanzado++;
            else if (perf.color === 'warning') stats.basico++;
            else stats.inicial++;
            stats.total++;

            var badgeStyle = Views.ReporteParcial.getBadgeStyles(perf.color);
            var bgRow = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

            return '<tr style="background:' + bgRow + '; border-bottom: 1px solid #e2e8f0;">' +
                '<td style="text-align:center; padding: 6px 4px; color:#475569; font-size:11.5px; border-right: 1px solid #cbd5e1; width:36px; font-weight:600;">' + (idx + 1) + '</td>' +
                '<td style="padding: 6px 12px; font-size:12px; color:#0f172a; font-weight:600; border-right: 1px solid #cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + (s.nombreCompleto || (s.nombres + ' ' + s.apellidos)) + '</td>' +
                '<td style="padding: 6px 8px; text-align:center; font-weight:800; font-size:13px; color:#0f172a; border-right: 1px solid #cbd5e1; width:75px;">' + finalScore + '%</td>' +
                '<td style="padding: 4px 6px; text-align:center; vertical-align:middle; width:100px;">' +
                    '<span style="display:inline-block; padding:2px 8px; font-size:10px; font-weight:700; border-radius:4px; text-transform:uppercase; letter-spacing:0.02em; ' + badgeStyle + '">' + perf.label + '</span>' +
                '</td>' +
            '</tr>';
        }).join('');

        var matriculaTotal = students.length;
        var promedioGeneral = matriculaTotal > 0 ? Math.round(sumaPromedios / matriculaTotal) : 0;
        var perfGeneral = Logic.getPerformance(promedioGeneral);

        var tot = stats.total || 1;
        var pE = Math.round(stats.excelente / tot * 100);
        var pA = Math.round(stats.avanzado / tot * 100);
        var pB = Math.round(stats.basico / tot * 100);
        var pI = Math.round(stats.inicial / tot * 100);

        var degE = (stats.excelente / tot) * 360;
        var degA = (stats.avanzado / tot) * 360;
        var degB = (stats.basico / tot) * 360;

        var c1 = degE;
        var c2 = c1 + degA;
        var c3 = c2 + degB;

        var pieGradient = 'conic-gradient(#16a34a 0deg ' + c1 + 'deg, #2563eb ' + c1 + 'deg ' + c2 + 'deg, #ca8a04 ' + c2 + 'deg ' + c3 + 'deg, #dc2626 ' + c3 + 'deg 360deg)';
        if (stats.total === 0) pieGradient = '#f1f5f9';

        var maxVal = Math.max(stats.excelente, stats.avanzado, stats.basico, stats.inicial, 4);

        // Análisis de Dimensiones
        var dimAnalysisRows = '';
        var dimKeys = Object.keys(dimStats);
        if (dimKeys.length > 0) {
            dimKeys.sort((a,b) => dimStats[a].avgPct - dimStats[b].avgPct).forEach(key => {
                var ds = dimStats[key];
                var avgPct = ds.totalMax > 0 ? Math.round((ds.totalObtained / ds.totalMax) * 100) : 0;
                var color = avgPct >= 90 ? '#166534' : avgPct >= 80 ? '#1e40af' : avgPct >= 70 ? '#854d0e' : '#991b1b';
                var barBg = avgPct >= 90 ? '#22c55e' : avgPct >= 80 ? '#3b82f6' : avgPct >= 70 ? '#eab308' : '#ef4444';

                dimAnalysisRows += '<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-size:11px;">' +
                    '<div style="width:110px; font-weight:600; color:#334155; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="' + ds.name + '">' + ds.name + '</div>' +
                    '<div style="flex:1; background:#f1f5f9; height:8px; border-radius:4px; overflow:hidden;">' +
                        '<div style="width:' + avgPct + '%; background:' + barBg + '; height:100%;"></div>' +
                    '</div>' +
                    '<div style="width:38px; text-align:right; font-weight:700; color:' + color + ';">' + avgPct + '%</div>' +
                '</div>';
            });
        } else {
            dimAnalysisRows = '<div style="font-size:11px; color:#94a3b8; text-align:center; padding:8px 0;">Sin actividades evaluadas en este período.</div>';
        }

        var fechaEmision = new Date().toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });

        return '<style>' +
            '/* WORD WORKSPACE STYLES */' +
            '.word-wrapper {' +
            '  background: #eaedf1;' +
            '  min-height: calc(100vh - 70px);' +
            '  padding-bottom: 60px;' +
            '  font-family: \'Segoe UI\', -apple-system, BlinkMacSystemFont, Arial, sans-serif;' +
            '}' +
            '/* Office 365 / Word Ribbon Top Toolbar */' +
            '.word-toolbar {' +
            '  background: #ffffff;' +
            '  border-bottom: 1px solid #cbd5e1;' +
            '  padding: 8px 18px;' +
            '  display: flex;' +
            '  align-items: center;' +
            '  justify-content: space-between;' +
            '  flex-wrap: wrap;' +
            '  gap: 12px;' +
            '  position: sticky;' +
            '  top: 0;' +
            '  z-index: 200;' +
            '  box-shadow: 0 2px 8px rgba(0,0,0,0.06);' +
            '}' +
            '.word-tool-group {' +
            '  display: flex;' +
            '  align-items: center;' +
            '  gap: 8px;' +
            '}' +
            '.word-btn {' +
            '  background: #ffffff;' +
            '  color: #334155;' +
            '  border: 1px solid #cbd5e1;' +
            '  border-radius: 6px;' +
            '  padding: 6px 12px;' +
            '  font-size: 12.5px;' +
            '  font-weight: 600;' +
            '  display: inline-flex;' +
            '  align-items: center;' +
            '  gap: 6px;' +
            '  cursor: pointer;' +
            '  transition: all 0.15s ease;' +
            '}' +
            '.word-btn:hover {' +
            '  background: #f8fafc;' +
            '  border-color: #94a3b8;' +
            '  color: #0f172a;' +
            '}' +
            '.word-btn-primary {' +
            '  background: #185abd;' +
            '  color: #ffffff;' +
            '  border: 1px solid #104899;' +
            '  border-radius: 6px;' +
            '  padding: 6px 14px;' +
            '  font-size: 12.5px;' +
            '  font-weight: 700;' +
            '  display: inline-flex;' +
            '  align-items: center;' +
            '  gap: 6px;' +
            '  cursor: pointer;' +
            '  box-shadow: 0 1px 3px rgba(24, 90, 189, 0.3);' +
            '  transition: all 0.15s ease;' +
            '}' +
            '.word-btn-primary:hover {' +
            '  background: #114ca1;' +
            '}' +
            '.word-toggle-btn {' +
            '  background: #f1f5f9;' +
            '  color: #475569;' +
            '  border: 1px solid #cbd5e1;' +
            '  padding: 5px 10px;' +
            '  font-size: 12px;' +
            '  font-weight: 600;' +
            '  display: inline-flex;' +
            '  align-items: center;' +
            '  gap: 4px;' +
            '  cursor: pointer;' +
            '}' +
            '.word-toggle-btn.active {' +
            '  background: #185abd;' +
            '  color: #ffffff;' +
            '  border-color: #104899;' +
            '  font-weight: 700;' +
            '}' +
            '.word-toggle-group {' +
            '  display: inline-flex;' +
            '  border-radius: 6px;' +
            '  overflow: hidden;' +
            '}' +
            '/* Word Sheet Canvas */' +
            '.word-canvas {' +
            '  display: flex;' +
            '  justify-content: center;' +
            '  padding: 24px 16px;' +
            '  overflow-x: auto;' +
            '}' +
            '/* Real Letter Page (Tamaño Carta) */' +
            '.word-sheet {' +
            '  background: #ffffff;' +
            '  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 16px 32px -4px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);' +
            '  border-radius: 2px;' +
            '  box-sizing: border-box;' +
            '  position: relative;' +
            '  transition: transform 0.2s ease;' +
            (isLandscape
                ? 'width: 279.4mm; min-height: 215.9mm; max-width: 100%; padding: 18mm 20mm;'
                : 'width: 215.9mm; min-height: 279.4mm; max-width: 100%; padding: 20mm 18mm;') +
            '}' +
            '/* Crop Marks / Word Margins Guide */' +
            '.word-sheet::before {' +
            '  content: "";' +
            '  position: absolute;' +
            '  top: 10px; left: 10px; width: 8px; height: 8px;' +
            '  border-top: 1px solid #cbd5e1; border-left: 1px solid #cbd5e1;' +
            '  pointer-events: none;' +
            '}' +
            '.word-sheet::after {' +
            '  content: "";' +
            '  position: absolute;' +
            '  top: 10px; right: 10px; width: 8px; height: 8px;' +
            '  border-top: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;' +
            '  pointer-events: none;' +
            '}' +
            '/* Print Rules */' +
            '@media print {' +
            '  @page {' +
            '    size: letter ' + (isLandscape ? 'landscape' : 'portrait') + ';' +
            '    margin: 10mm 12mm;' +
            '  }' +
            '  body, html, #app, .app-container, .gdhn-content, .main-content {' +
            '    background: #ffffff !important;' +
            '    padding: 0 !important; margin: 0 !important;' +
            '    overflow: visible !important; height: auto !important;' +
            '  }' +
            '  .word-toolbar, .gdhn-sidebar, .sidebar, .gdhn-header, .top-nav, .mobile-nav, #nav-back-pill, #fab-quick-nav {' +
            '    display: none !important;' +
            '  }' +
            '  .word-wrapper {' +
            '    background: transparent !important;' +
            '    padding: 0 !important;' +
            '  }' +
            '  .word-canvas {' +
            '    padding: 0 !important;' +
            '    display: block !important;' +
            '    overflow: visible !important;' +
            '  }' +
            '  .word-sheet {' +
            '    box-shadow: none !important;' +
            '    border: none !important;' +
            '    padding: 0 !important;' +
            '    width: 100% !important;' +
            '    min-height: auto !important;' +
            '    transform: none !important;' +
            '  }' +
            '  .word-sheet::before, .word-sheet::after { display: none !important; }' +
            '  table, tr { page-break-inside: avoid !important; }' +
            '  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
            '}' +
            '</style>' +
            '<div class="word-wrapper">' +
                '<!-- Top Ribbon / Word Toolbar -->' +
                '<div class="word-toolbar">' +
                    '<div class="word-tool-group">' +
                        '<button class="word-btn" onclick="Router.navigate(\'cuadro\')">' +
                            '<i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Volver al Cuadro' +
                        '</button>' +
                        '<div style="height:20px; width:1px; background:#e2e8f0; margin:0 4px;"></div>' +
                        '<div style="display:flex; align-items:center; gap:8px;">' +
                            '<div style="background:#185abd; color:#fff; width:26px; height:26px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px;">W</div>' +
                            '<div>' +
                                '<div style="font-size:13px; font-weight:700; color:#0f172a; line-height:1.2;">Reporte_Calificaciones.docx</div>' +
                                '<div style="font-size:10px; color:#64748b; font-weight:600;">DOCUMENTO OFICIAL DE CALIFICACIONES</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="word-tool-group">' +
                        '<div style="display:flex; align-items:center; gap:6px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px;">' +
                            '<span style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase;">Período:</span>' +
                            '<select style="font-size:12px; font-weight:700; color:#0f172a; border:none; background:transparent; cursor:pointer; outline:none;" onchange="Views.ReporteParcial.changeParcial(this.value)">' +
                                parcialOptions +
                            '</select>' +
                        '</div>' +
                        '<div class="word-toggle-group">' +
                            '<button class="word-toggle-btn ' + (!isLandscape ? 'active' : '') + '" onclick="Views.ReporteParcial.setOrientation(\'portrait\')" title="Orientación Vertical">' +
                                '<i data-lucide="file-text" style="width:14px;height:14px;"></i> Vertical' +
                            '</button>' +
                            '<button class="word-toggle-btn ' + (isLandscape ? 'active' : '') + '" onclick="Views.ReporteParcial.setOrientation(\'landscape\')" title="Orientación Horizontal">' +
                                '<i data-lucide="file-minus" style="width:14px;height:14px;"></i> Horizontal' +
                            '</button>' +
                        '</div>' +
                        '<div class="word-tool-group" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:2px 6px;">' +
                            '<button onclick="Views.ReporteParcial.setZoom(Views.ReporteParcial.state.zoom - 10)" style="border:none;background:transparent;cursor:pointer;font-weight:700;padding:2px 6px;color:#475569;" title="Reducir Zoom">-</button>' +
                            '<span id="word-zoom-val" style="font-size:11px; font-weight:700; color:#334155; min-width:34px; text-align:center;">' + this.state.zoom + '%</span>' +
                            '<button onclick="Views.ReporteParcial.setZoom(Views.ReporteParcial.state.zoom + 10)" style="border:none;background:transparent;cursor:pointer;font-weight:700;padding:2px 6px;color:#475569;" title="Aumentar Zoom">+</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="word-tool-group">' +
                        '<button class="word-btn" onclick="Views.ReporteParcial.previewShare()">' +
                            '<i data-lucide="share-2" style="width:15px;height:15px;color:#0284c7;"></i> Compartir' +
                        '</button>' +
                        '<button class="word-btn-primary" onclick="window.print()">' +
                            '<i data-lucide="printer" style="width:15px;height:15px;"></i> Imprimir / PDF' +
                        '</button>' +
                    '</div>' +
                '</div>' +

                '<!-- Word Canvas -->' +
                '<div class="word-canvas">' +
                    '<!-- The Letter Sheet -->' +
                    '<div id="word-document-sheet" class="word-sheet">' +
                        '<!-- Encabezado Institucional Oficial -->' +
                        '<div style="text-align:center; margin-bottom:14px; position:relative;">' +
                            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                                '<div style="width:62px; height:62px; display:flex; align-items:center; justify-content:center;">' +
                                    centroLogoHtml +
                                '</div>' +
                                '<div style="flex:1; padding: 0 12px; text-align:center;">' +
                                    '<div style="font-size:13px; font-weight:800; color:#1e293b; letter-spacing:0.04em;">REPÚBLICA DE HONDURAS</div>' +
                                    '<div style="font-size:11.5px; font-weight:700; color:#475569; letter-spacing:0.02em;">SECRETARÍA DE EDUCACIÓN PÚBLICA</div>' +
                                    '<div style="font-size:14px; font-weight:900; color:#0f172a; text-transform:uppercase; margin-top:2px;">' + centroEdu + '</div>' +
                                    '<div style="font-size:12.5px; font-weight:800; color:#1e40af; text-transform:uppercase; margin-top:3px; letter-spacing:0.01em;">CUADRO CONSOLIDADOR DE RENDIMIENTO ACADÉMICO</div>' +
                                    '<div style="font-size:11px; font-weight:700; color:#64748b; margin-top:1px;">' + parcialNombre + ' • AÑO LECTIVO ' + anioLectivo + '</div>' +
                                '</div>' +
                                '<div style="width:62px; height:62px; display:flex; align-items:center; justify-content:center;">' +
                                    appLogoHtml +
                                '</div>' +
                            '</div>' +
                            '<div style="border-bottom: 2px solid #0f172a; border-top: 1px solid #0f172a; height: 3px; margin: 10px 0 14px;"></div>' +
                        '</div>' +

                        '<!-- Ficha Técnica de Datos del Curso -->' +
                        '<div style="margin-bottom:16px; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; font-size:11px;">' +
                            '<div style="display:grid; grid-template-columns: repeat(' + (isLandscape ? '4' : '2') + ', 1fr); background:#f8fafc; border-bottom:1px solid #cbd5e1;">' +
                                '<div style="padding:6px 10px; border-right:1px solid #cbd5e1;"><span style="color:#64748b; font-weight:600;">CENTRO:</span> <strong style="color:#0f172a;">' + centroEdu + '</strong></div>' +
                                '<div style="padding:6px 10px; border-right:1px solid #cbd5e1;"><span style="color:#64748b; font-weight:600;">GRADO Y SECC:</span> <strong style="color:#0f172a;">' + grado + ' "' + seccion + '"</strong></div>' +
                                '<div style="padding:6px 10px; border-right:1px solid #cbd5e1;"><span style="color:#64748b; font-weight:600;">ASIGNATURA:</span> <strong style="color:#0f172a;">' + asignatura + '</strong></div>' +
                                '<div style="padding:6px 10px;"><span style="color:#64748b; font-weight:600;">ALDEA:</span> <strong style="color:#0f172a;">' + aldea + '</strong></div>' +
                            '</div>' +
                            '<div style="display:grid; grid-template-columns: repeat(' + (isLandscape ? '4' : '2') + ', 1fr); background:#ffffff;">' +
                                '<div style="padding:6px 10px; border-right:1px solid #cbd5e1;"><span style="color:#64748b; font-weight:600;">MUNICIPIO:</span> <strong style="color:#0f172a;">' + municipio + '</strong></div>' +
                                '<div style="padding:6px 10px; border-right:1px solid #cbd5e1;"><span style="color:#64748b; font-weight:600;">MATRÍCULA:</span> <strong style="color:#0f172a;">' + matriculaTotal + ' Educandos</strong></div>' +
                                '<div style="padding:6px 10px; border-right:1px solid #cbd5e1;"><span style="color:#64748b; font-weight:600;">PROMEDIO SECCIÓN:</span> <strong style="color:' + (perfGeneral.color === 'danger' ? '#dc2626' : '#16a34a') + ';">' + promedioGeneral + '% (' + perfGeneral.label + ')</strong></div>' +
                                '<div style="padding:6px 10px;"><span style="color:#64748b; font-weight:600;">DOCENTE:</span> <strong style="color:#0f172a;">' + docente + '</strong></div>' +
                            '</div>' +
                        '</div>' +

                        '<!-- Layout de Contenido -->' +
                        '<div style="display:flex; flex-direction:' + (isLandscape ? 'row' : 'column') + '; gap:16px;">' +
                            '<!-- Tabla Oficial de Calificaciones -->' +
                            '<div style="flex:' + (isLandscape ? '1.4' : '1') + ';">' +
                                '<div style="font-size:12px; font-weight:800; color:#1e293b; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:6px;">' +
                                    '<i data-lucide="table" style="width:14px;height:14px;color:#185abd;"></i> Registro Oficial de Calificaciones' +
                                '</div>' +
                                '<table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; font-size:11.5px;">' +
                                    '<thead>' +
                                        '<tr style="background:#1e293b; color:#ffffff;">' +
                                            '<th style="padding:8px 4px; text-align:center; font-size:10.5px; font-weight:700; width:36px; border-right:1px solid #334155;">No.</th>' +
                                            '<th style="padding:8px 12px; text-align:left; font-size:10.5px; font-weight:700; border-right:1px solid #334155;">Nombre Completo del Educando</th>' +
                                            '<th style="padding:8px 6px; text-align:center; font-size:10.5px; font-weight:700; width:75px; border-right:1px solid #334155;">Nota (%)</th>' +
                                            '<th style="padding:8px 6px; text-align:center; font-size:10.5px; font-weight:700; width:100px;">Desempeño</th>' +
                                        '</tr>' +
                                    '</thead>' +
                                    '<tbody>' +
                                        trows +
                                    '</tbody>' +
                                    '<tfoot>' +
                                        '<tr style="background:#f1f5f9; font-weight:800; border-top:2px solid #cbd5e1;">' +
                                            '<td colspan="2" style="padding:8px 12px; text-align:right; font-size:11px; color:#334155; border-right:1px solid #cbd5e1;">PROMEDIO GENERAL DE LA SECCIÓN:</td>' +
                                            '<td style="padding:8px 6px; text-align:center; font-size:13px; color:#0f172a; border-right:1px solid #cbd5e1;">' + promedioGeneral + '%</td>' +
                                            '<td style="padding:6px; text-align:center;"><span style="font-size:10px; font-weight:800; text-transform:uppercase;">' + perfGeneral.label + '</span></td>' +
                                        '</tr>' +
                                    '</tfoot>' +
                                '</table>' +
                            '</div>' +

                            '<!-- Anexo de Analíticas y Resumen Estadístico -->' +
                            '<div style="flex:' + (isLandscape ? '1' : '1') + '; display:flex; flex-direction:column; gap:14px;">' +
                                '<div style="font-size:12px; font-weight:800; color:#1e293b; text-transform:uppercase; display:flex; align-items:center; gap:6px;">' +
                                    '<i data-lucide="pie-chart" style="width:14px;height:14px;color:#185abd;"></i> Resumen Estadístico del Rendimiento' +
                                '</div>' +

                                '<!-- Tabla Resumen por Nivel -->' +
                                '<table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; font-size:11px; text-align:center;">' +
                                    '<thead>' +
                                        '<tr style="background:#f8fafc; border-bottom:1px solid #cbd5e1;">' +
                                            '<th style="padding:6px 10px; text-align:left; font-weight:700; color:#475569; border-right:1px solid #cbd5e1;">Nivel de Desempeño</th>' +
                                            '<th style="padding:6px 8px; font-weight:700; color:#475569; border-right:1px solid #cbd5e1; width:70px;">Educandos</th>' +
                                            '<th style="padding:6px 8px; font-weight:700; color:#475569; width:70px;">Porcentaje</th>' +
                                        '</tr>' +
                                    '</thead>' +
                                    '<tbody>' +
                                        '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 10px; text-align:left; font-weight:700; color:#166534; background:#f0fdf4; border-right:1px solid #cbd5e1;">Excelente (91-100%)</td><td style="border-right:1px solid #cbd5e1; font-weight:700;">' + stats.excelente + '</td><td style="font-weight:700;">' + pE + '%</td></tr>' +
                                        '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 10px; text-align:left; font-weight:700; color:#1e40af; background:#eff6ff; border-right:1px solid #cbd5e1;">Avanzado (81-90%)</td><td style="border-right:1px solid #cbd5e1; font-weight:700;">' + stats.avanzado + '</td><td style="font-weight:700;">' + pA + '%</td></tr>' +
                                        '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 10px; text-align:left; font-weight:700; color:#854d0e; background:#fefce8; border-right:1px solid #cbd5e1;">Básico (70-80%)</td><td style="border-right:1px solid #cbd5e1; font-weight:700;">' + stats.basico + '</td><td style="font-weight:700;">' + pB + '%</td></tr>' +
                                        '<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 10px; text-align:left; font-weight:700; color:#991b1b; background:#fef2f2; border-right:1px solid #cbd5e1;">Inicial (< 70%)</td><td style="border-right:1px solid #cbd5e1; font-weight:700;">' + stats.inicial + '</td><td style="font-weight:700;">' + pI + '%</td></tr>' +
                                        '<tr style="background:#f1f5f9; font-weight:800;"><td style="padding:6px 10px; text-align:left; color:#1e293b; border-right:1px solid #cbd5e1;">Total Matrícula</td><td style="border-right:1px solid #cbd5e1; color:#0f172a;">' + stats.total + '</td><td style="color:#185abd;">100%</td></tr>' +
                                    '</tbody>' +
                                '</table>' +

                                '<!-- Gráficos Integrados en la Hoja -->' +
                                '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; padding:12px;">' +
                                    '<!-- Dona -->' +
                                    '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">' +
                                        '<div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:8px; text-transform:uppercase;">Distribución (%)</div>' +
                                        '<div style="position:relative; width:80px; height:80px; border-radius:50%; background:' + pieGradient + '; border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center;">' +
                                            '<div style="width:44px; height:44px; border-radius:50%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center;">' +
                                                '<span style="font-size:13px; font-weight:900; color:#0f172a;">' + stats.total + '</span>' +
                                                '<span style="font-size:7px; font-weight:700; color:#64748b;">ALUMNOS</span>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                    '<!-- Barras -->' +
                                    '<div>' +
                                        '<div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:8px; text-align:center; text-transform:uppercase;">Alumnos por Nivel</div>' +
                                        '<div style="display:flex; align-items:flex-end; justify-content:space-around; height:75px; padding-bottom:4px; border-bottom:1px solid #cbd5e1;">' +
                                            '<div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><span style="font-size:9.5px;font-weight:700;color:#166534;">' + stats.excelente + '</span><div style="width:16px; background:#22c55e; border-radius:2px 2px 0 0; height:' + ((stats.excelente / maxVal) * 55) + 'px;"></div><span style="font-size:8.5px; color:#64748b; font-weight:700;">Exc</span></div>' +
                                            '<div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><span style="font-size:9.5px;font-weight:700;color:#1e40af;">' + stats.avanzado + '</span><div style="width:16px; background:#3b82f6; border-radius:2px 2px 0 0; height:' + ((stats.avanzado / maxVal) * 55) + 'px;"></div><span style="font-size:8.5px; color:#64748b; font-weight:700;">Ava</span></div>' +
                                            '<div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><span style="font-size:9.5px;font-weight:700;color:#854d0e;">' + stats.basico + '</span><div style="width:16px; background:#eab308; border-radius:2px 2px 0 0; height:' + ((stats.basico / maxVal) * 55) + 'px;"></div><span style="font-size:8.5px; color:#64748b; font-weight:700;">Bás</span></div>' +
                                            '<div style="display:flex; flex-direction:column; align-items:center; gap:2px;"><span style="font-size:9.5px;font-weight:700;color:#991b1b;">' + stats.inicial + '</span><div style="width:16px; background:#ef4444; border-radius:2px 2px 0 0; height:' + ((stats.inicial / maxVal) * 55) + 'px;"></div><span style="font-size:8.5px; color:#64748b; font-weight:700;">Ini</span></div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +

                                '<!-- Análisis de Dimensiones -->' +
                                '<div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:4px; padding:10px;">' +
                                    '<div style="font-size:10.5px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:8px;">Logro Promedio por Dimensión:</div>' +
                                    dimAnalysisRows +
                                '</div>' +
                            '</div>' +
                        '</div>' +

                        '<!-- Bloque Oficial de Firmas y Sello -->' +
                        '<div style="margin-top:40px; padding-top:14px; page-break-inside:avoid;">' +
                            '<div style="display:flex; justify-content:space-around; align-items:flex-end; text-align:center; gap:20px; flex-wrap:wrap;">' +
                                '<div style="min-width:180px;">' +
                                    '<div style="border-bottom:1px solid #0f172a; width:180px; margin:0 auto 6px;"></div>' +
                                    '<div style="font-size:11px; font-weight:700; color:#0f172a;">' + docente + '</div>' +
                                    '<div style="font-size:10px; color:#64748b;">Docente Titular / Guía</div>' +
                                '</div>' +
                                '<div style="min-width:140px; height:70px; border:1.5px dashed #94a3b8; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:10px; font-weight:700; letter-spacing:0.04em;">' +
                                    '[ SELLO OFICIAL ]' +
                                '</div>' +
                                '<div style="min-width:180px;">' +
                                    '<div style="border-bottom:1px solid #0f172a; width:180px; margin:0 auto 6px;"></div>' +
                                    '<div style="font-size:11px; font-weight:700; color:#0f172a;">' + (director || 'Director(a)') + '</div>' +
                                    '<div style="font-size:10px; color:#64748b;">Director(a) / Vo. Bo.</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +

                        '<!-- Pie de Página Oficial (Word Footer) -->' +
                        '<div style="margin-top:30px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:9.5px; color:#94a3b8;">' +
                            '<div>Aula 360 HN — Cuaderno Docente Digital Profesional</div>' +
                            '<div>Emisión: ' + fechaEmision + '</div>' +
                            '<div style="font-weight:700; color:#64748b;">Página 1 de 1</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }
};
