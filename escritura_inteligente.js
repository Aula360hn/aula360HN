// escritura_inteligente.js - Extensión para Pruebas Formativas

// Constantes y diccionarios para el Sistema Experto
const ESCRITURA_RUBRICA = [
    { id: "textType", label: "Adecuación al texto", max: 3 },
    { id: "ideas", label: "Desarrollo de ideas", max: 4 },
    { id: "organization", label: "Organización y coherencia", max: 3 },
    { id: "vocabulary", label: "Vocabulario", max: 2 },
    { id: "grammar", label: "Gramática", max: 3 },
    { id: "spelling", label: "Ortografía", max: 3 },
    { id: "punctuation", label: "Puntuación y presentación", max: 2 }
];

const ESCRITURA_ERRORES = {
    "Ortografía": ["Tildes", "Mayúsculas", "Omite letras", "Agrega letras", "Sustituye letras", "Invierte letras", "Uso incorrecto de b/v", "Uso incorrecto de c/s/z", "Uso incorrecto de g/j", "Uso incorrecto de ll/y"],
    "Segmentación": ["Une palabras", "Separa palabras"],
    "Puntuación": ["Punto final", "Punto y seguido", "Coma", "Interrogación", "Exclamación"],
    "Gramática": ["Concordancia", "Tiempos verbales", "Oraciones incompletas", "Ideas confusas", "Conectores", "Repetición de palabras", "Vocabulario limitado"],
    "Presentación": ["Letra poco legible", "Muchos tachones", "Márgenes", "Orden del escrito"]
};

const ESCRITURA_FORTALEZAS = [
    "Buenas ideas", "Buen vocabulario", "Creatividad", "Excelente organización", 
    "Buena ortografía", "Buena presentación", "Cumple el tipo de texto", 
    "Argumenta correctamente", "Usa conectores", "Mejora evidente", "Escritura fluida"
];

const ESTADOS_CHIP = [
    { id: "off", color: "#f1f5f9", text: "#64748b", label: "" },
    { id: "leve", color: "#fef08a", text: "#854d0e", label: "Leve" },
    { id: "frecuente", color: "#fed7aa", text: "#9a3412", label: "Frec." },
    { id: "persistente", color: "#fecaca", text: "#991b1b", label: "Persist." }
];

// Extender Views.PruebasFormativas
Object.assign(Views.PruebasFormativas, {
    _escrituraKey: function() {
        return 'escritura_diag_' + (Store.data.activeCourseId || 'none');
    },

    getEscrituraData: function() {
        var raw = localStorage.getItem(this._escrituraKey());
        return raw ? JSON.parse(raw) : {};
    },

    saveEscrituraData: function(data) {
        localStorage.setItem(this._escrituraKey(), JSON.stringify(data));
    },

    openLightningMenu: function(studentIndex) {
        var c = Store.getActiveCourse();
        if (!c) return;
        var students = Store.getStudentsByCourse(c.id);
        var student = students[studentIndex];
        var mes = this.state.mes;

        var html = '<div style="display:flex; flex-direction:column; gap:12px; padding: 10px;">' +
            '<button class="btn btn-primary" onclick="UI.closeModal(); Views.PruebasFormativas.openWritingCorrectionModal(' + studentIndex + ', \'' + mes + '\')" style="height:54px; font-size:15px; display:flex; align-items:center; gap:12px; background:linear-gradient(135deg, #0ea5e9, #3b82f6); border:none; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);"><i data-lucide="pen-tool" style="width:20px;"></i> <span>Corrección Inteligente <strong style="opacity:0.8">(' + mes + ')</strong></span></button>' +
            '<button class="btn btn-secondary" onclick="UI.closeModal(); Views.PruebasFormativas.openFastInputModal(' + studentIndex + ')" style="height:54px; font-size:15px; display:flex; align-items:center; gap:12px;"><i data-lucide="list" style="width:20px;"></i> Ingreso Rápido (Todos los meses)</button>' +
        '</div>';
        UI.modal('Opciones para ' + student.nombreCompleto, html);
        if (window.lucide) lucide.createIcons();
    },

    // Estado temporal del modal actual
    _currentWritingCtx: null,

    openWritingCorrectionModal: function(studentIndex, mes) {
        var c = Store.getActiveCourse();
        if (!c) return;
        var students = Store.getStudentsByCourse(c.id);
        var student = students[studentIndex];

        // Cargar datos existentes si los hay
        var allData = this.getEscrituraData();
        var key = student.id + '_' + mes.replace(/\//g, '-');
        var diag = allData[key] || {
            nota: '',
            rubrica: {},
            errores: {},
            fortalezas: {},
            comentario: '',
            recomendacion: '',
            planAccion: {
                estado: 'Pendiente',
                tipo: 'Individual',
                objetivo: '',
                actividad: '',
                tiempo: '',
                estrategia: '',
                seguimiento: ''
            },
            usarRubrica: true
        };
        // Ensure existing data has planAccion
        if (!diag.planAccion) {
            diag.planAccion = { estado: 'Pendiente', tipo: 'Individual', objetivo: '', actividad: '', tiempo: '', estrategia: '', seguimiento: '' };
        }
        if (!diag.planAccion.estado) diag.planAccion.estado = 'Pendiente';
        if (!diag.planAccion.tipo) diag.planAccion.tipo = 'Individual';

        this._currentWritingCtx = {
            studentIndex: studentIndex,
            student: student,
            mes: mes,
            diag: JSON.parse(JSON.stringify(diag)) // clonar
        };

        this._renderWritingModal();
    },

    _renderWritingModal: function() {
        var ctx = this._currentWritingCtx;
        var diag = ctx.diag;
        var c = Store.getActiveCourse();
        var students = Store.getStudentsByCourse(c.id);

        // Calcular nota total si usa rúbrica
        var totalRubrica = 0;
        if (diag.usarRubrica) {
            ESCRITURA_RUBRICA.forEach(r => {
                totalRubrica += (diag.rubrica[r.id] || 0);
            });
            diag.nota = totalRubrica;
        }

        var nivel = this.getEscrituraNivel(diag.nota);
        var style = this.getNivelStyles(nivel);
        var nivelText = nivel === 'A' ? 'Avanzado' : (nivel === 'S' ? 'Satisfactorio' : (nivel === 'DM' ? 'Debe mejorar' : (nivel === 'I' ? 'Insatisfactorio' : 'Sin Nivel')));

        // Construir Rúbrica UI
        var rubricaHtml = '<div style="display:flex; flex-direction:column; gap:4px;">';
        if (diag.usarRubrica) {
            ESCRITURA_RUBRICA.forEach(r => {
                var btnHtml = '';
                for (var i = 0; i <= r.max; i++) {
                    var isSel = (diag.rubrica[r.id] || 0) === i;
                    btnHtml += '<button onclick="Views.PruebasFormativas._setRubricaVal(\'' + r.id + '\', ' + i + ')" style="flex:1; padding:2px; border:1px solid ' + (isSel ? '#0ea5e9' : '#cbd5e1') + '; background:' + (isSel ? '#e0f2fe' : '#fff') + '; color:' + (isSel ? '#0369a1' : '#475569') + '; font-weight:' + (isSel ? '700' : '500') + '; border-radius:4px; cursor:pointer; font-size:12px; height:24px;">' + i + '</button>';
                }
                rubricaHtml += '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; background:#f8fafc; padding:4px 8px; border-radius:6px;"><div style="font-size:12px; font-weight:600; color:#334155; width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + r.label + '</div><div style="display:flex; gap:2px; flex:1;">' + btnHtml + '</div></div>';
            });
        }
        rubricaHtml += '</div>';

        // Construir Errores y Fortalezas
        var erroresHtml = this._getErroresHtml();
        var fortalezasHtml = this._getFortalezasHtml();
        var modalHtml = `
            <div style="display:flex; flex-direction:column; height: calc(100vh - 64px); background:#f8fafc; margin:-24px -32px; overflow:hidden;">
                <!-- HEADER COMPACTO -->
                <div style="padding:10px 16px; background:#fff; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button onclick="Views.PruebasFormativas._closeFullscreenWriting()" style="background:#f1f5f9; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:700; color:#475569; display:flex; align-items:center; gap:6px; font-size:13px;"><i data-lucide="arrow-left" style="width:14px;"></i> Volver</button>
                        <div style="font-size:18px; font-weight:800; color:#0f172a; margin-left:4px;">${ctx.student.nombreCompleto}</div>
                        <div style="font-size:12px; font-weight:600; color:#64748b; background:#f1f5f9; padding:3px 8px; border-radius:6px;">Mes: ${ctx.mes} &nbsp;•&nbsp; ${ctx.studentIndex + 1} de ${students.length}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-right:4px;">Nota:</div>
                        ${diag.usarRubrica 
                            ? `<div style="font-size:24px; font-weight:900; color:#0f172a;">${diag.nota || 0}<span style="font-size:14px; color:#94a3b8;">/20</span></div>`
                            : `<input type="number" min="0" max="20" value="${diag.nota}" oninput="Views.PruebasFormativas._setManualNota(this.value)" style="width:60px; height:32px; text-align:center; font-size:18px; font-weight:800; border:2px solid #cbd5e1; border-radius:6px;">`
                        }
                        <div style="padding:4px 10px; border-radius:6px; font-weight:700; font-size:12px; background:${style.bg}; color:${style.color}; margin-left:4px;">${nivelText}</div>
                    </div>
                </div>

                <!-- BODY: CARRUSEL -->
                <div style="flex:1; display:flex; flex-direction:column; background:#f8fafc; position:relative; overflow:hidden;">
                    
                    <!-- Tabs de Navegación del Carrusel -->
                    <div style="display:flex; justify-content:center; gap:8px; padding:12px 16px; background:#fff; border-bottom:1px solid #e2e8f0; z-index:10; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <button onclick="document.getElementById('carrusel-escritura').scrollBy({left:-window.innerWidth/2, behavior:'smooth'})" class="btn btn-sm" style="border:1px solid #cbd5e1; background:#fff; border-radius:50%; width:32px; height:32px; padding:0; display:flex; justify-content:center; align-items:center; cursor:pointer;"><i data-lucide="chevron-left" style="width:18px;"></i></button>
                        
                        <div style="display:flex; gap:8px; overflow-x:auto;" class="hide-scrollbar">
                           <button onclick="Views.PruebasFormativas._scrollToCard('card-rubrica', this)" style="border:none; background:#e0f2fe; color:#0369a1; font-weight:700; border-radius:16px; padding:6px 16px; cursor:pointer; font-size:13px; white-space:nowrap;">1. Rúbrica</button>
                           <button onclick="Views.PruebasFormativas._scrollToCard('card-fortalezas', this)" style="border:none; background:#f1f5f9; color:#475569; font-weight:600; border-radius:16px; padding:6px 16px; cursor:pointer; font-size:13px; white-space:nowrap;">2. Fortalezas</button>
                           <button onclick="Views.PruebasFormativas._scrollToCard('card-dificultades', this)" style="border:none; background:#f1f5f9; color:#475569; font-weight:600; border-radius:16px; padding:6px 16px; cursor:pointer; font-size:13px; white-space:nowrap;">3. Dificultades</button>
                           <button onclick="Views.PruebasFormativas._scrollToCard('card-analisis', this)" style="border:none; background:#f1f5f9; color:#475569; font-weight:600; border-radius:16px; padding:6px 16px; cursor:pointer; font-size:13px; white-space:nowrap;">4. Análisis IA</button>
                           <button onclick="Views.PruebasFormativas._scrollToCard('card-plan', this)" style="border:none; background:#f5f3ff; color:#7c3aed; font-weight:700; border-radius:16px; padding:6px 16px; cursor:pointer; font-size:13px; white-space:nowrap;">5. Plan de Acción</button>
                        </div>

                        <button onclick="document.getElementById('carrusel-escritura').scrollBy({left:window.innerWidth/2, behavior:'smooth'})" class="btn btn-sm" style="border:1px solid #cbd5e1; background:#fff; border-radius:50%; width:32px; height:32px; padding:0; display:flex; justify-content:center; align-items:center; cursor:pointer;"><i data-lucide="chevron-right" style="width:18px;"></i></button>
                    </div>

                    <!-- Contenedor del Carrusel -->
                    <div id="carrusel-escritura" style="flex:1; overflow-x:auto; overflow-y:hidden; display:flex; gap:16px; padding:16px; scroll-snap-type: x mandatory; scroll-behavior: smooth; align-items:stretch; background:#f1f5f9;">
                        
                        <!-- Card 1: Rubrica -->
                        <div id="card-rubrica" style="min-width: min(100%, 500px); max-width: 500px; scroll-snap-align: center; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; overflow-y:auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display:flex; flex-direction:column;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                                <div style="font-size:16px; font-weight:800; color:#0f172a;">Rúbrica Oficial (20 pts)</div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <label style="font-size:13px; font-weight:600; color:#64748b; cursor:pointer;"><input type="checkbox" ${diag.usarRubrica ? 'checked' : ''} onchange="Views.PruebasFormativas._toggleUsarRubrica(this.checked)" style="margin-right:4px;"> Usar Rúbrica</label>
                                </div>
                            </div>
                            <div style="flex:1;">
                                ${rubricaHtml}
                                ${!diag.usarRubrica ? '<div style="padding:16px; text-align:center; color:#94a3b8; font-size:13px; font-weight:500; background:#f8fafc; border-radius:8px; margin-top:16px;">Rúbrica desactivada. Ingrese la nota manualmente arriba.</div>' : ''}
                            </div>
                        </div>

                        <!-- Card 2: Fortalezas -->
                        <div id="card-fortalezas" style="min-width: min(100%, 500px); max-width: 500px; scroll-snap-align: center; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; overflow-y:auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display:flex; flex-direction:column;">
                            <div style="font-size:16px; font-weight:800; color:#166534; margin-bottom:16px; display:flex; align-items:center; gap:6px;"><i data-lucide="trending-up" style="width:18px;"></i> Fortalezas Observadas</div>
                            <div style="flex:1;" id="fortalezas-container">
                                ${fortalezasHtml}
                            </div>
                        </div>

                        <!-- Card 3: Errores -->
                        <div id="card-dificultades" style="min-width: min(100%, 600px); max-width: 600px; scroll-snap-align: center; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; overflow-y:auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display:flex; flex-direction:column;">
                            <div style="font-size:16px; font-weight:800; color:#991b1b; margin-bottom:4px; display:flex; align-items:center; gap:6px;"><i data-lucide="alert-circle" style="width:18px;"></i> Dificultades Observadas</div>
                            <div style="font-size:12px; color:#64748b; margin-bottom:16px;">Haz clic varias veces en un chip para cambiar su nivel: <span style="color:#854d0e; font-weight:700;">Leve</span> → <span style="color:#9a3412; font-weight:700;">Frecuente</span> → <span style="color:#991b1b; font-weight:700;">Persistente</span></div>
                            <div style="flex:1;" id="errores-container">
                                ${erroresHtml}
                            </div>
                        </div>

                        <!-- Card 4: Análisis IA -->
                        <div id="card-analisis" style="min-width: min(100%, 500px); max-width: 500px; scroll-snap-align: center; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; overflow-y:auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display:flex; flex-direction:column;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                                <div style="font-size:16px; font-weight:800; color:#0ea5e9; display:flex; align-items:center; gap:6px;"><i data-lucide="bot" style="width:18px;"></i> Análisis Automático</div>
                                <button onclick="Views.PruebasFormativas._generateIA()" class="btn btn-sm btn-secondary" style="font-size:12px; padding:6px 10px; display:flex; align-items:center; gap:4px; border-radius:8px;"><i data-lucide="refresh-cw" style="width:14px;"></i> Auto-Generar</button>
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
                                <textarea id="diag-comentario" style="flex:1; min-height:100px; border:1px solid #cbd5e1; border-radius:8px; padding:12px; font-size:13px; color:#334155; resize:none;" placeholder="Comentario pedagógico...">${diag.comentario}</textarea>
                                <textarea id="diag-recomendacion" style="flex:1; min-height:80px; border:1px solid #cbd5e1; border-radius:8px; padding:12px; font-size:13px; color:#334155; resize:none; background:#f0f9ff;" placeholder="Recomendación para el hogar...">${diag.recomendacion}</textarea>
                            </div>
                        </div>

                        <!-- Card 5: Plan de Acción -->
                        <div id="card-plan" style="min-width: min(100%, 550px); max-width: 550px; scroll-snap-align: center; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; overflow-y:auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display:flex; flex-direction:column;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                                <div style="font-size:16px; font-weight:800; color:#7c3aed; display:flex; align-items:center; gap:6px;"><i data-lucide="target" style="width:18px;"></i> Plan de Acción (IA)</div>
                                <div style="display:flex; gap:8px;">
                                    <button onclick="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.estado='Aplicado'; Views.PruebasFormativas._renderWritingModal(); UI.toast('Plan marcado como Aplicado', 'success');" class="btn btn-sm" style="font-size:12px; padding:6px 10px; background:#dcfce7; color:#166534; border:1px solid #bbf7d0; border-radius:8px;"><i data-lucide="check-circle" style="width:14px; margin-right:4px;"></i> Aplicado</button>
                                    <button onclick="Views.PruebasFormativas._generatePlanIA()" class="btn btn-sm btn-secondary" style="font-size:12px; padding:6px 10px; display:flex; align-items:center; gap:4px; border-radius:8px; color:#7c3aed; border-color:#ddd6fe; background:#f5f3ff;"><i data-lucide="zap" style="width:14px;"></i> Generar Plan</button>
                                </div>
                            </div>
                            <div style="display:flex; gap:12px; margin-bottom:12px;">
                                <div style="flex:1;">
                                    <label style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Tipo de Plan</label>
                                    <select style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:6px 10px; font-size:13px; color:#334155; background:#fff;" onchange="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.tipo=this.value">
                                        <option value="Individual" ${diag.planAccion.tipo==='Individual'?'selected':''}>Plan individual</option>
                                        <option value="Grupal" ${diag.planAccion.tipo==='Grupal'?'selected':''}>Plan grupal</option>
                                        <option value="Seguimiento" ${diag.planAccion.tipo==='Seguimiento'?'selected':''}>Plan de seguimiento</option>
                                    </select>
                                </div>
                                <div style="flex:1;">
                                    <label style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Estado</label>
                                    <select style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:6px 10px; font-size:13px; color:#334155; background:${diag.planAccion.estado==='Aplicado'?'#dcfce7':'#fff'};" onchange="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.estado=this.value">
                                        <option value="Pendiente" ${diag.planAccion.estado==='Pendiente'?'selected':''}>Pendiente</option>
                                        <option value="En proceso" ${diag.planAccion.estado==='En proceso'?'selected':''}>En proceso</option>
                                        <option value="Aplicado" ${diag.planAccion.estado==='Aplicado'?'selected':''}>Aplicado</option>
                                        <option value="Requiere seguimiento" ${diag.planAccion.estado==='Requiere seguimiento'?'selected':''}>Requiere seguimiento</option>
                                    </select>
                                </div>
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
                                <div>
                                    <label style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Objetivo de Mejora</label>
                                    <textarea id="plan-objetivo" style="width:100%; min-height:40px; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px; color:#334155; resize:none;" onchange="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.objetivo=this.value">${diag.planAccion.objetivo}</textarea>
                                </div>
                                <div>
                                    <label style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Actividad Sugerida</label>
                                    <textarea id="plan-actividad" style="width:100%; min-height:50px; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px; color:#334155; resize:none;" onchange="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.actividad=this.value">${diag.planAccion.actividad}</textarea>
                                </div>
                                <div>
                                    <label style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Tiempo Estimado</label>
                                    <input type="text" id="plan-tiempo" style="width:100%; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px; color:#334155;" value="${diag.planAccion.tiempo}" onchange="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.tiempo=this.value">
                                </div>
                                <div>
                                    <label style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Estrategia de Apoyo</label>
                                    <textarea id="plan-estrategia" style="width:100%; min-height:50px; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px; color:#334155; resize:none;" onchange="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.estrategia=this.value">${diag.planAccion.estrategia}</textarea>
                                </div>
                                <div>
                                    <label style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Seguimiento</label>
                                    <textarea id="plan-seguimiento" style="width:100%; min-height:40px; border:1px solid #cbd5e1; border-radius:8px; padding:8px 12px; font-size:13px; color:#334155; resize:none;" onchange="Views.PruebasFormativas._currentWritingCtx.diag.planAccion.seguimiento=this.value">${diag.planAccion.seguimiento}</textarea>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- FOOTER -->
                <div style="padding:12px 24px; background:#fff; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                    <button class="btn btn-secondary" onclick="Views.PruebasFormativas._closeFullscreenWriting()" style="font-weight:700;">Cancelar</button>
                    <div style="display:flex; gap:12px;">
                        <button class="btn btn-secondary" onclick="Views.PruebasFormativas._saveWritingAnd(false)" style="font-weight:700; color:#0f172a;"><i data-lucide="save" style="width:16px; margin-right:6px;"></i> Guardar y Volver</button>
                        <button class="btn btn-primary" onclick="Views.PruebasFormativas._saveWritingAnd(true)" style="font-weight:700; background:#0ea5e9; border-color:#0ea5e9;"><i data-lucide="arrow-right" style="width:16px; margin-right:6px;"></i> Guardar y Siguiente</button>
                    </div>
                </div>
            </div>
        `;

        // Render directly into the main content div like gradeActivity does
        const cont = document.getElementById('content');
        if (cont) {
            // Guardar posición del scroll
            var carrusel = document.getElementById('carrusel-escritura');
            var scrollLeft = carrusel ? carrusel.scrollLeft : 0;
            var nav = document.querySelector('.hide-scrollbar');
            var navScrollLeft = nav ? nav.scrollLeft : 0;

            cont.innerHTML = modalHtml;
            if (window.lucide) window.lucide.createIcons();
            UI.closeModal(); // in case a modal was open

            // Restaurar posición del scroll
            var newCarrusel = document.getElementById('carrusel-escritura');
            if (newCarrusel) newCarrusel.scrollLeft = scrollLeft;
            var newNav = document.querySelector('.hide-scrollbar');
            if (newNav) newNav.scrollLeft = navScrollLeft;

            // Ocultar el FAB global "Volver a:" para que no se superponga con los botones del modal
            var fab = document.getElementById('nav-back-pill');
            if (fab) fab.style.display = 'none';
        }
    },

    _closeFullscreenWriting: function() {
        var pfHtml = this.render();
        var cont = document.getElementById('content');
        if (cont) {
            cont.innerHTML = pfHtml;
            if (window.lucide) window.lucide.createIcons();

            // Restaurar el FAB global "Volver a:"
            var fab = document.getElementById('nav-back-pill');
            if (fab) fab.style.display = 'flex';
        }
    },

    _setRubricaVal: function(id, val) {
        this._currentWritingCtx.diag.rubrica[id] = val;
        this._renderWritingModal();
    },

    _toggleUsarRubrica: function(val) {
        this._currentWritingCtx.diag.usarRubrica = val;
        this._renderWritingModal();
    },

    _setManualNota: function(val) {
        var n = parseFloat(val);
        if (isNaN(n) || n < 0) n = '';
        if (n > 20) n = 20;
        this._currentWritingCtx.diag.nota = n;
        this._renderWritingModal();
    },

    _cycleChip: function(errId) {
        var current = this._currentWritingCtx.diag.errores[errId] || 0;
        current = (current + 1) % 4;
        if (current === 0) delete this._currentWritingCtx.diag.errores[errId];
        else this._currentWritingCtx.diag.errores[errId] = current;
        
        var container = document.getElementById('errores-container');
        if (container) container.innerHTML = this._getErroresHtml();
    },

    _toggleFortaleza: function(fId) {
        if (this._currentWritingCtx.diag.fortalezas[fId]) {
            delete this._currentWritingCtx.diag.fortalezas[fId];
        } else {
            this._currentWritingCtx.diag.fortalezas[fId] = true;
        }
        
        var container = document.getElementById('fortalezas-container');
        if (container) container.innerHTML = this._getFortalezasHtml();
    },

    _getErroresHtml: function() {
        var diag = this._currentWritingCtx.diag;
        var html = '';
        Object.keys(ESCRITURA_ERRORES).forEach(cat => {
            html += '<div style="margin-bottom:6px;"><div style="font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; margin-bottom:2px;">' + cat + '</div><div style="display:flex; flex-wrap:wrap; gap:4px;">';
            ESCRITURA_ERRORES[cat].forEach(err => {
                var val = diag.errores[err] || 0;
                var state = ESTADOS_CHIP[val];
                html += '<div onclick="Views.PruebasFormativas._cycleChip(\'' + err + '\')" style="padding:4px 8px; border-radius:12px; background:' + state.color + '; color:' + state.text + '; font-size:11px; font-weight:600; cursor:pointer; user-select:none; display:flex; align-items:center; gap:4px; border:1px solid rgba(0,0,0,0.05); transition:all 0.15s;">' + err + (val > 0 ? '<span style="font-size:9px; background:rgba(255,255,255,0.5); padding:1px 4px; border-radius:8px; margin-left:2px;">' + state.label + '</span>' : '') + '</div>';
            });
            html += '</div></div>';
        });
        return html;
    },

    _getFortalezasHtml: function() {
        var diag = this._currentWritingCtx.diag;
        var html = '<div style="display:flex; flex-wrap:wrap; gap:4px;">';
        ESCRITURA_FORTALEZAS.forEach(f => {
            var isOn = !!diag.fortalezas[f];
            html += '<div onclick="Views.PruebasFormativas._toggleFortaleza(\'' + f + '\')" style="padding:4px 8px; border-radius:12px; background:' + (isOn ? '#dcfce7' : '#f1f5f9') + '; color:' + (isOn ? '#166534' : '#64748b') + '; font-size:11px; font-weight:600; cursor:pointer; user-select:none; border:1px solid rgba(0,0,0,0.05); transition:all 0.15s;">' + f + '</div>';
        });
        html += '</div>';
        return html;
    },

    _scrollToCard: function(cardId, btnEl) {
        var card = document.getElementById(cardId);
        if (card) {
            card.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
        }
        if (btnEl) {
            btnEl.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
        }
    },

    _generateIA: function() {
        var diag = this._currentWritingCtx.diag;
        
        var persistentes = [];
        var frecuentes = [];
        var leves = [];
        
        Object.keys(diag.errores).forEach(err => {
            if (diag.errores[err] === 3) persistentes.push(err);
            if (diag.errores[err] === 2) frecuentes.push(err);
            if (diag.errores[err] === 1) leves.push(err);
        });

        var forta = [];
        Object.keys(diag.fortalezas).forEach(f => {
            if (diag.fortalezas[f]) forta.push(f.toLowerCase());
        });

        var nivelText = this.getEscrituraNivel(diag.nota);
        var nivelStr = nivelText === 'A' ? 'avanzado' : (nivelText === 'S' ? 'satisfactorio' : (nivelText === 'DM' ? 'que debe mejorar' : 'insatisfactorio'));

        var text = 'El estudiante alcanza un nivel ' + nivelStr + ' en escritura.';
        
        if (forta.length > 0) {
            text += ' Se observan como fortalezas: ' + forta.join(', ') + '.';
        }

        var mejorar = [];
        if (persistentes.length > 0) mejorar.push('urgentemente: ' + persistentes.join(', '));
        if (frecuentes.length > 0) mejorar.push('frecuentemente: ' + frecuentes.join(', '));
        
        if (mejorar.length > 0) {
            text += ' Debe reforzar ' + mejorar.join(' y ') + '.';
        } else if (leves.length > 0) {
            text += ' Presenta ligeros errores en: ' + leves.join(', ') + '.';
        }

        diag.comentario = text;

        var rec = 'Revisar el texto antes de entregarlo.';
        if (persistentes.includes('Tildes') || frecuentes.includes('Tildes')) {
            rec = 'Practicar reglas generales de acentuación.';
        } else if (persistentes.includes('Une palabras') || frecuentes.includes('Une palabras')) {
            rec = 'Ejercicios de segmentación y lectura en voz alta.';
        }
        diag.recomendacion = rec;

        this._renderWritingModal();
        UI.toast('Análisis IA generado', 'success');
    },

    _generatePlanIA: function() {
        var diag = this._currentWritingCtx.diag;
        
        var persistentes = [];
        var frecuentes = [];
        Object.keys(diag.errores).forEach(err => {
            if (diag.errores[err] === 3) persistentes.push(err);
            if (diag.errores[err] === 2) frecuentes.push(err);
        });
        
        // Seleccionar máximo 3 prioridades (primero persistentes, luego frecuentes)
        var prioridades = persistentes.concat(frecuentes).slice(0, 3);
        
        var obj = "Mejorar la producción escrita general.";
        var act = "Realizar ejercicios prácticos de redacción y lectura comprensiva.";
        var tiempo = "15 minutos";
        var est = "Revisión guiada antes de entregar los textos.";
        var seg = "Verificar progreso en la próxima evaluación de escritura.";
        var tipo = prioridades.length > 0 && persistentes.length > 0 ? "Seguimiento" : "Individual";

        if (prioridades.length > 0) {
            var prioridadesText = prioridades.map(p => p.toLowerCase()).join(", ");
            obj = "Mejorar: " + prioridadesText + " en producciones escritas.";
            
            var pLower = prioridades.join(" ").toLowerCase();
            
            if (pLower.includes("tilde") || pLower.includes("mayúscula")) {
                act = "Dictado breve enfocado en reglas de acentuación y ortografía básica.";
                tiempo = "10 minutos";
                est = "Apoyo visual con tabla de reglas ortográficas al escribir.";
            } else if (pLower.includes("palabra")) {
                act = "Lectura en voz alta señalando espacios. Ejercicios de segmentación de oraciones cortas.";
                tiempo = "10 minutos";
                est = "Marcar pausas y espacios con colores al redactar borradores.";
            } else if (pLower.includes("coma") || pLower.includes("punto") || pLower.includes("signo")) {
                act = "Lectura dramatizada respetando pausas para identificar puntuación faltante.";
                tiempo = "15 minutos";
                est = "Subrayar verbos principales para ubicar los puntos y seguidos correctamente.";
            } else if (pLower.includes("letra") || pLower.includes("tachones") || pLower.includes("legible")) {
                act = "Ejercicios de caligrafía y grafomotricidad breve.";
                tiempo = "10 minutos diarios";
                est = "Usar cuadernos de doble línea para los primeros borradores.";
            } else {
                act = "Práctica específica enfocada en corregir " + prioridades[0].toLowerCase() + ".";
                tiempo = "15 minutos";
            }
            seg = "Evaluar la reducción de estos errores en el próximo texto que entregue.";
        }

        diag.planAccion.objetivo = obj;
        diag.planAccion.actividad = act;
        diag.planAccion.tiempo = tiempo;
        diag.planAccion.estrategia = est;
        diag.planAccion.seguimiento = seg;
        diag.planAccion.tipo = tipo;
        diag.planAccion.estado = 'Pendiente';

        this._renderWritingModal();
        UI.toast('Plan de Acción generado automáticamente', 'success');
    },

    _saveWritingAnd: function(next) {
        var ctx = this._currentWritingCtx;
        
        // Update texts from textareas
        var tc = document.getElementById('diag-comentario');
        var tr = document.getElementById('diag-recomendacion');
        if (tc) ctx.diag.comentario = tc.value;
        if (tr) ctx.diag.recomendacion = tr.value;
        ctx.diag.fecha = Utils.timestamp();

        // 1. Guardar en Diagnosticos
        var allData = this.getEscrituraData();
        var key = ctx.student.id + '_' + ctx.mes.replace(/\//g, '-');
        allData[key] = ctx.diag;
        this.saveEscrituraData(allData);

        // 2. Sincronizar con Pruebas Formativas (tabla principal)
        var pfKey = this._key();
        var rawPf = localStorage.getItem(pfKey);
        var pfData = rawPf ? JSON.parse(rawPf) : { filas: [] };
        
        var fila = pfData.filas.find(f => f.estudianteId === ctx.student.id);
        if (!fila) {
            fila = { estudianteId: ctx.student.id, nombre: ctx.student.nombreCompleto, lectura: '', escritura: '' };
            pfData.filas.push(fila);
        }
        fila.escritura = ctx.diag.nota !== '' ? ctx.diag.nota : '';
        this.saveData(pfData);

        // Refrescar tabla de pruebas formativas
        this.render();

        if (next) {
            var c = Store.getActiveCourse();
            var students = Store.getStudentsByCourse(c.id);
            if (ctx.studentIndex < students.length - 1) {
                this.openWritingCorrectionModal(ctx.studentIndex + 1, ctx.mes);
            } else {
                UI.toast('Haz llegado al final de la lista', 'info');
                this._closeFullscreenWriting();
            }
        } else {
            this._closeFullscreenWriting();
        }
        UI.toast('Evaluación de escritura guardada', 'success');
    },

    openGroupAnalysisModal: function() {
        var c = Store.getActiveCourse();
        if (!c) return;
        var students = Store.getStudentsByCourse(c.id);
        var mes = this.state.mes;
        var allData = this.getEscrituraData();
        
        var total = 0;
        var stats = { A: 0, S: 0, DM: 0, I: 0 };
        var errorCounts = {};
        
        students.forEach(st => {
            var diag = allData[st.id + '_' + mes.replace(/\//g, '-')];
            if (diag && diag.nota !== '') {
                total++;
                var nivel = this.getEscrituraNivel(diag.nota);
                stats[nivel]++;
                
                if (diag.errores) {
                    Object.keys(diag.errores).forEach(e => {
                        errorCounts[e] = (errorCounts[e] || 0) + 1;
                    });
                }
            }
        });
        
        var topErrors = Object.keys(errorCounts).map(k => ({ err: k, count: errorCounts[k] })).sort((a,b) => b.count - a.count).slice(0, 5);
        
        var html = '<div style="padding:10px;">';
        if (total === 0) {
            html += '<div style="text-align:center; padding:30px; color:#64748b;">No hay evaluaciones de escritura para ' + mes + '</div>';
        } else {
            html += '<div style="display:flex; gap:16px; margin-bottom:24px;">';
            html += '<div style="flex:1; background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #e2e8f0; text-align:center;"><div style="font-size:24px; font-weight:800; color:#0f172a;">' + total + '</div><div style="font-size:12px; color:#64748b; font-weight:600;">Evaluados</div></div>';
            html += '<div style="flex:1; background:#f0fdf4; padding:16px; border-radius:12px; border:1px solid #bbf7d0; text-align:center;"><div style="font-size:24px; font-weight:800; color:#166534;">' + stats.A + '</div><div style="font-size:12px; color:#64748b; font-weight:600;">Avanzado</div></div>';
            html += '<div style="flex:1; background:#fefce8; padding:16px; border-radius:12px; border:1px solid #fef08a; text-align:center;"><div style="font-size:24px; font-weight:800; color:#854d0e;">' + (stats.S + stats.DM) + '</div><div style="font-size:12px; color:#64748b; font-weight:600;">En Proceso</div></div>';
            html += '<div style="flex:1; background:#fef2f2; padding:16px; border-radius:12px; border:1px solid #fecaca; text-align:center;"><div style="font-size:24px; font-weight:800; color:#991b1b;">' + stats.I + '</div><div style="font-size:12px; color:#64748b; font-weight:600;">Insatisfactorio</div></div>';
            html += '</div>';
            
            html += '<div style="font-size:14px; font-weight:800; margin-bottom:12px; color:#334155;"><i data-lucide="alert-triangle" style="width:14px;"></i> Errores más frecuentes del grupo</div>';
            if (topErrors.length === 0) {
                html += '<div style="font-size:13px; color:#64748b;">No se registraron errores frecuentes.</div>';
            } else {
                html += '<div style="display:flex; flex-direction:column; gap:8px;">';
                topErrors.forEach(t => {
                    var pct = Math.round((t.count / total) * 100);
                    html += '<div style="display:flex; align-items:center; gap:12px;">';
                    html += '<div style="width:120px; font-size:13px; font-weight:600; color:#475569;">' + t.err + '</div>';
                    html += '<div style="flex:1; height:12px; background:#f1f5f9; border-radius:6px; overflow:hidden;"><div style="height:100%; width:' + pct + '%; background:#ef4444;"></div></div>';
                    html += '<div style="width:40px; text-align:right; font-size:12px; font-weight:700; color:#ef4444;">' + pct + '%</div>';
                    html += '</div>';
                });
                html += '</div>';
            }
        }
        html += '<div style="margin-top:24px; text-align:right;"><button class="btn btn-primary" onclick="UI.closeModal()">Cerrar</button></div>';
        html += '</div>';
        
        UI.modal('Análisis de Escritura: ' + mes, html);
        if (window.lucide) lucide.createIcons();
    }
});
