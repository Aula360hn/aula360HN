/**
 * ============================================================================
 * AULA 360 HN - MOTOR DE CUADRO CONTROLADOR INTERACTIVO CON DESPLEGABLES (v6.0)
 * ============================================================================
 * Pestaña 'CUADRO_CONTROLADOR_INTERACTIVO' que permite al docente seleccionar:
 * - GRADO, SECCIÓN, ASIGNATURA y PARCIAL desde listas desplegables.
 * Al cambiar cualquier opción, el cuadro se recalcula y visualiza en vivo.
 * ============================================================================
 */

const CONFIG = {
  API_KEY: "AULA360_SECRET_KEY_2026",
  TIMEZONE: "America/Tegucigalpa",
  DEFAULT_PASS_SCORE: 60
};

const SCHEMAS = {
  CENTROS_EDUCATIVOS: ["centro_id", "nombre", "codigo", "municipio", "departamento", "director", "telefono", "correo", "estado", "fecha_creacion"],
  DOCENTES: ["docente_id", "nombres", "apellidos", "correo", "telefono", "identidad", "centro_id", "especialidad", "google_drive_url", "estado", "fecha_creacion"],
  ESTUDIANTES: ["estudiante_id", "identidad", "nombres", "apellidos", "nombre_completo", "sexo", "genero", "fecha_nacimiento", "tutor", "telefono_tutor", "domicilio", "alergias", "codigo_sace", "estado", "fecha_creacion"],
  MATRICULAS: ["matricula_id", "estudiante_id", "centro_id", "curso_id", "grado", "seccion", "jornada", "modalidad", "ano_escolar", "estado", "fecha_matricula"],
  ASIGNATURAS: ["asignatura_id", "nombre", "codigo_asignatura", "grado", "modalidad", "estado"],
  PERIODOS_ACADEMICOS: ["periodo_id", "ano_escolar", "parcial", "fecha_inicio", "fecha_fin", "estado"],
  DIMENSIONES_EVALUACION: ["dimension_id", "nombre", "key_alias", "valor_maximo", "porcentaje", "estado"],
  ACTIVIDADES_EVALUACION: ["actividad_id", "curso_id", "docente_id", "asignatura_id", "grado", "seccion", "periodo_id", "dimension_id", "dimension_key", "nombre_actividad", "descripcion", "fecha", "valor_actividad", "tipo", "estado", "fecha_creacion"],
  CALIFICACIONES: ["calificacion_id", "actividad_id", "estudiante_id", "matricula_id", "curso_id", "parcial_id", "nota_obtenida", "porcentaje_obtenido", "estado", "observacion", "fecha_registro", "fecha_modificacion"],
  ASISTENCIA: ["asistencia_id", "estudiante_id", "matricula_id", "curso_id", "fecha", "estado_asistencia", "tardanza_minutos", "observacion", "docente_id", "fecha_registro"],
  CONDUCTA_PERSONALIDAD: ["personalidad_id", "estudiante_id", "matricula_id", "curso_id", "parcial_id", "puntualidad", "espiritu_trabajo", "orden", "sociabilidad", "moralidad", "observaciones", "fecha_registro"],
  BITACORA_Y_SART: ["bitacora_id", "estudiante_id", "matricula_id", "curso_id", "fecha", "categoria", "tipo_alerta", "nivel_riesgo", "observacion_descripcion", "accion_tomada", "docente_id"],
  PRUEBAS_FORMATIVAS_Y_DIAGNOSTICAS: ["prueba_id", "tipo_prueba", "estudiante_id", "curso_id", "parcial_id", "bloque_tema", "puntaje_obtenido", "puntaje_maximo", "nivel_logro", "fecha_evaluacion"],
  AGENDA_Y_EVENTOS: ["evento_id", "titulo", "fecha_inicio", "hora_inicio", "tipo_evento", "curso_id", "descripcion", "color_ref", "estado"],
  BANCO_RUBRICAS: ["rubrica_id", "titulo", "asignatura", "grado", "criterios_json", "niveles_json", "fecha_creacion"],
  CONFIGURACION_SISTEMA: ["clave", "valor", "fecha_actualizacion"],
  AUDITORIA: ["auditoria_id", "usuario", "accion", "tabla", "registro_id", "campo_modificado", "valor_anterior", "valor_nuevo", "fecha", "hora"]
};

function inicializarBaseDatos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("🚀 Inicializando Base de Datos con Cuadro Controlador Interactivo...");

  Object.keys(SCHEMAS).forEach(tableName => {
    let sheet = ss.getSheetByName(tableName);
    const headers = SCHEMAS[tableName];
    if (!sheet) sheet = ss.insertSheet(tableName);

    let existingHeaders = [];
    if (sheet.getLastRow() > 0) {
      existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
    if (existingHeaders.length === 0 || existingHeaders.join(",") !== headers.join(",")) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0F172A").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    if (!sheet.getFilter() && sheet.getLastRow() > 0) {
      sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), headers.length).createFilter();
    }
  });

  crearCuadroControladorInteractivo(ss);
  return buildResponse(true, "Base de datos configurada con Cuadro Controlador Interactivo.", { tablas: Object.keys(SCHEMAS) });
}

// ── PESTAÑA 'CUADRO_CONTROLADOR_INTERACTIVO' CON DESPLEGABLES ────────────────
function crearCuadroControladorInteractivo(ss) {
  let sheet = ss.getSheetByName("CUADRO_CONTROLADOR_INTERACTIVO");
  if (!sheet) {
    sheet = ss.insertSheet("CUADRO_CONTROLADOR_INTERACTIVO", 0);
  }

  // Si ya existe la estructura básica, solo actualizamos listas desplegables
  if (sheet.getRange("A1").getValue().indexOf("CUADRO CONTROLADOR INTERACTIVO") !== -1) {
    actualizarListasDesplegables(ss, sheet);
    return;
  }

  sheet.clear();

  // 1. TÍTULO Y BANNER DE FILTROS
  sheet.getRange("A1:N1").merge()
    .setValue("📊 AULA 360 HN — CUADRO CONTROLADOR INTERACTIVO")
    .setBackground("#0F172A").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(14).setHorizontalAlignment("center");

  sheet.getRange("A2:N2").merge()
    .setValue("Seleccione el Grado, Sección, Asignatura y Parcial en los desplegables de abajo para consultar el Cuadro de Notas al instante:")
    .setBackground("#1E293B").setFontColor("#38BDF8").setFontSize(10).setHorizontalAlignment("center");

  // 2. PANEL DE FILTROS DESPLEGABLES (FILAS 3 y 4)
  sheet.getRange("A3").setValue("GRADO:").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange("B3").setValue("7°").setBackground("#FEF08A").setFontWeight("bold").setHorizontalAlignment("center");

  sheet.getRange("C3").setValue("SECCIÓN:").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange("D3").setValue("1").setBackground("#FEF08A").setFontWeight("bold").setHorizontalAlignment("center");

  sheet.getRange("E3").setValue("ASIGNATURA:").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange("F3").setValue("Español").setBackground("#FEF08A").setFontWeight("bold").setHorizontalAlignment("center");

  sheet.getRange("G3").setValue("PARCIAL:").setFontWeight("bold").setHorizontalAlignment("right");
  sheet.getRange("H3").setValue("I Parcial").setBackground("#FEF08A").setFontWeight("bold").setHorizontalAlignment("center");

  sheet.getRange("I3:N3").merge()
    .setValue("💡 Cambie cualquier opción arriba para filtrar en vivo")
    .setFontStyle("italic").setFontColor("#64748B").setHorizontalAlignment("center");

  // Configurar Listas Desplegables de Validación
  actualizarListasDesplegables(ss, sheet);

  // 3. ENCABEZADOS DEL CUADRO MATRIZ DE NOTAS
  const headers = [
    "No.", "DNI / IDENTIDAD", "NOMBRE COMPLETO",
    "ACT AULA (25%)", "EXTRA AULA (10%)", "VALORES (10%)", "EXPRESIONES (5%)", "EXÁMENES (50%)",
    "TOTAL PARCIAL", "INASISTENCIAS", "ESTADO PARCIAL", "RECUPERACIÓN", "NOTA FINAL", "DESEMPEÑO SACE"
  ];

  sheet.getRange(5, 1, 1, headers.length).setValues([headers]);
  const headerRange = sheet.getRange(5, 1, 1, headers.length);
  headerRange.setBackground("#0F172A").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");

  sheet.setFrozenRows(5);
  sheet.autoResizeColumns(1, headers.length);

  // Ejecutar primera renderización de datos
  renderizarCuadroInteractivo(ss, sheet);
}

function actualizarListasDesplegables(ss, sheet) {
  try {
    const grados = ["1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "9°", "10°", "11°", "12°"];
    const secciones = ["1", "2", "3", "4", "A", "B", "C"];
    const parciales = ["I Parcial", "II Parcial", "III Parcial", "IV Parcial"];

    // Obtener asignaturas registradas
    const sheetAsig = ss.getSheetByName("ASIGNATURAS");
    let asignaturas = ["Español", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Inglés", "Educación Física"];
    if (sheetAsig && sheetAsig.getLastRow() > 1) {
      const vals = sheetAsig.getRange(2, 2, sheetAsig.getLastRow() - 1, 1).getValues().map(r => r[0]).filter(Boolean);
      if (vals.length > 0) asignaturas = Array.from(new Set(vals));
    }

    const makeRule = list => SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(true).build();

    sheet.getRange("B3").setDataValidation(makeRule(grados));
    sheet.getRange("D3").setDataValidation(makeRule(secciones));
    sheet.getRange("F3").setDataValidation(makeRule(asignaturas));
    sheet.getRange("H3").setDataValidation(makeRule(parciales));
  } catch (err) {}
}

// ── DISPARADOR AUTOMÁTICO AL CAMBIAR UN DESPLEGABLE EN GOOGLE SHEETS ─────────
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== "CUADRO_CONTROLADOR_INTERACTIVO") return;

  const row = e.range.getRow();
  if (row === 3) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    renderizarCuadroInteractivo(ss, sheet);
  }
}

// ── RENDERIZADO DINÁMICO DE LA MATRIZ DE NOTAS ──────────────────────────────
function renderizarCuadroInteractivo(ss, sheet) {
  const gradoSel = String(sheet.getRange("B3").getValue() || "7°").replace("°", "").trim();
  const seccionSel = String(sheet.getRange("D3").getValue() || "1").trim();
  const asigSel = String(sheet.getRange("F3").getValue() || "Español").trim();
  const parcialSel = String(sheet.getRange("H3").getValue() || "I Parcial").trim();

  // Limpiar filas anteriores (de la fila 6 hacia abajo)
  if (sheet.getLastRow() >= 6) {
    sheet.getRange(6, 1, Math.max(sheet.getLastRow() - 5, 1), 14).clear();
  }

  // Leer datos de tablas relacionales
  const estudiantes = readSheetAsObjects(ss, "ESTUDIANTES");
  const matriculas = readSheetAsObjects(ss, "MATRICULAS");
  const actividades = readSheetAsObjects(ss, "ACTIVIDADES_EVALUACION");
  const calificaciones = readSheetAsObjects(ss, "CALIFICACIONES");
  const asistencia = readSheetAsObjects(ss, "ASISTENCIA");

  // Filtrar matrículas activas por Grado y Sección
  const matFiltradas = matriculas.filter(m => {
    let match = (m.estado === "ACTIVO" || !m.estado);
    if (gradoSel) match = match && String(m.grado || "").replace("°", "").trim() === gradoSel;
    if (seccionSel) match = match && String(m.seccion || "1").trim() === seccionSel;
    return match;
  });

  const estIds = new Set(matFiltradas.map(m => m.estudiante_id));
  const alumnosMatriculados = estudiantes.filter(e => estIds.has(e.estudiante_id));

  if (alumnosMatriculados.length === 0) {
    sheet.getRange("A6:N6").merge()
      .setValue(`⚠️ No hay alumnos matriculados para ${gradoSel}° Sección ${seccionSel}`)
      .setFontStyle("italic").setFontColor("#94A3B8").setHorizontalAlignment("center");
    return;
  }

  // Filtrar actividades por asignatura y parcial
  const actsFiltradas = actividades.filter(a => {
    let match = a.estado !== "INACTIVO";
    if (asigSel) match = match && String(a.asignatura_id || a.asignatura || "").toLowerCase().includes(asigSel.toLowerCase());
    return match;
  });

  // Generar Filas Dinámicas del Cuadro
  const rows = alumnosMatriculados.map((st, idx) => {
    const stCalifs = calificaciones.filter(c => c.estudiante_id === st.estudiante_id);
    const stAsis = asistencia.filter(a => a.estudiante_id === st.estudiante_id);

    let notaAula = 0, notaExtra = 0, notaValores = 0, notaExp = 0, notaExamen = 0;

    actsFiltradas.forEach(act => {
      const cal = stCalifs.find(c => String(c.actividad_id || c.actividadId).trim() === String(act.actividad_id).trim());
      const score = cal && cal.nota_obtenida !== "" && cal.nota_obtenida !== undefined ? Number(cal.nota_obtenida) : 0;
      
      const dimKey = (act.dimension_key || act.dimension_id || "").toLowerCase();
      if (dimKey.includes("aula")) notaAula += score;
      else if (dimKey.includes("extra")) notaExtra += score;
      else if (dimKey.includes("actitud") || dimKey.includes("valor")) notaValores += score;
      else if (dimKey.includes("expresion") || dimKey.includes("arte")) notaExp += score;
      else if (dimKey.includes("examen") || dimKey.includes("prueba")) notaExamen += score;
      else notaAula += score;
    });

    const totalParcial = Math.min(100, Math.round(notaAula + notaExtra + notaValores + notaExp + notaExamen));
    const inasistencias = stAsis.filter(a => a.estado_asistencia === "Ausente").length;
    const estado = totalParcial >= CONFIG.DEFAULT_PASS_SCORE ? "APROBADO" : "REPROBADO";
    const recuperacion = st.recuperacion || "";
    const notaFinal = recuperacion !== "" ? Number(recuperacion) : totalParcial;

    let desempeno = "Avanzado (91-100%)";
    if (notaFinal < 60) desempeno = "Insuficiente (0-59%)";
    else if (notaFinal <= 69) desempeno = "Básico (60-69%)";
    else if (notaFinal <= 80) desempeno = "Satisfactorio (70-80%)";
    else if (notaFinal <= 90) desempeno = "Muy Satisfactorio (81-90%)";

    return [
      idx + 1,
      st.identidad || "",
      (st.nombre_completo || `${st.nombres} ${st.apellidos}`).toUpperCase(),
      notaAula || 0,
      notaExtra || 0,
      notaValores || 0,
      notaExp || 0,
      notaExamen || 0,
      totalParcial,
      inasistencias,
      estado,
      recuperacion,
      notaFinal,
      desempeno
    ];
  });

  sheet.getRange(6, 1, rows.length, 14).setValues(rows);

  // Formato Visual de Totales y Semáforos
  const rangeNota = sheet.getRange(6, 9, rows.length, 1);
  rangeNota.setBackground("#EFF6FF").setFontWeight("bold").setFontColor("#1D4ED8").setHorizontalAlignment("center");

  const rangeEstado = sheet.getRange(6, 11, rows.length, 1);
  const ruleAprobado = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("APROBADO").setBackground("#DCFCE7").setFontColor("#15803D").setBold(true).setRanges([rangeEstado]).build();
  const ruleReprobado = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("REPROBADO").setBackground("#FEE2E2").setFontColor("#B91C1C").setBold(true).setRanges([rangeEstado]).build();
  sheet.setConditionalFormatRules([ruleAprobado, ruleReprobado]);

  sheet.autoResizeColumns(1, 14);
}

function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || "ping";
    if (params.apiKey && params.apiKey !== CONFIG.API_KEY) return buildResponse(false, "Clave de API no válida.", null);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    switch (action) {
      case "ping": return buildResponse(true, "API Aula 360 HN 6.0 activa.", { version: "6.0.0", timestamp: getTimestamp() });
      case "get_data": case "sync_get": return handleGetData(ss);
      case "obtener_cuadro_controlador": return handleObtenerCuadroControlador(ss, params);
      case "obtener_expediente": return handleObtenerExpedienteEstudiante(ss, params.estudiante_id);
      case "buscar_por_id": return handleBuscarPorId(ss, params.tabla, params.id);
      case "filtrar": return handleFiltrarRegistros(ss, params.tabla, params);
      default:
        if (SCHEMAS[action.toUpperCase()]) return handleFiltrarRegistros(ss, action.toUpperCase(), params);
        return buildResponse(false, `Acción GET '${action}' no reconocida.`, null);
    }
  } catch (err) { return buildResponse(false, "Error interno: " + err.toString(), null); }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return buildResponse(false, "No se recibieron datos.", null);
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const apiKey = payload.apiKey || payload.api_key;
    if (apiKey && apiKey !== CONFIG.API_KEY) return buildResponse(false, "Clave de API no válida.", null);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    switch (action) {
      case "sync_all": return handleSyncAll(ss, payload.data);
      case "crear_registro": return handleCrearRegistro(ss, payload.tabla, payload.data, payload.usuario);
      case "actualizar_registro": return handleActualizarRegistro(ss, payload.tabla, payload.id, payload.data, payload.usuario);
      case "eliminar_registro": return handleEliminarRegistro(ss, payload.tabla, payload.id, payload.usuario);
      case "crear_estudiante": return handleCrearEstudiante(ss, payload.data, payload.usuario);
      case "crear_matricula": return handleCrearMatricula(ss, payload.data, payload.usuario);
      case "crear_actividad": return handleCrearActividad(ss, payload.data, payload.usuario);
      case "guardar_calificacion": return handleGuardarCalificacion(ss, payload.data, payload.usuario);
      case "guardar_asistencia": return handleGuardarAsistencia(ss, payload.data, payload.usuario);
      default: return buildResponse(false, `Acción POST '${action}' no reconocida.`, null);
    }
  } catch (err) { return buildResponse(false, "Error procesando POST: " + err.toString(), null); }
}

function handleCrearRegistro(ss, tableName, data, usuario = "Sistema") {
  const table = (tableName || "").toUpperCase();
  if (!SCHEMAS[table]) return buildResponse(false, `Tabla '${tableName}' no existe.`, null);
  const sheet = ss.getSheetByName(table);
  const headers = SCHEMAS[table];
  const pkField = headers[0];
  if (!data[pkField]) data[pkField] = generateId(table.substring(0, 3));
  if (headers.includes("fecha_creacion") && !data.fecha_creacion) data.fecha_creacion = getTimestamp();
  if (headers.includes("fecha_registro") && !data.fecha_registro) data.fecha_registro = getTimestamp();
  if (headers.includes("estado") && !data.estado) data.estado = "ACTIVO";
  const row = headers.map(h => data[h] !== undefined && data[h] !== null ? data[h] : "");
  sheet.appendRow(row);
  registrarAuditoria(ss, usuario, "CREAR", table, data[pkField], "", "", JSON.stringify(data));
  return buildResponse(true, `Registro creado en ${table}.`, data);
}

function handleActualizarRegistro(ss, tableName, idValue, data, usuario = "Sistema") {
  const table = (tableName || "").toUpperCase();
  if (!SCHEMAS[table]) return buildResponse(false, `Tabla '${tableName}' no existe.`, null);
  const sheet = ss.getSheetByName(table);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return buildResponse(false, "Tabla vacía.", null);
  const headers = rows[0];
  let targetRowIdx = -1;
  for (let r = 1; r < rows.length; r++) {
    if (String(rows[r][0]).trim() === String(idValue).trim()) { targetRowIdx = r + 1; break; }
  }
  if (targetRowIdx === -1) return buildResponse(false, `ID '${idValue}' no encontrado en ${table}.`, null);
  if (headers.includes("fecha_modificacion")) data.fecha_modificacion = getTimestamp();
  const oldValues = rows[targetRowIdx - 1];
  const updatedRow = headers.map((h, cIdx) => {
    if (data[h] !== undefined) {
      if (String(oldValues[cIdx]) !== String(data[h])) {
        registrarAuditoria(ss, usuario, "ACTUALIZAR", table, idValue, h, oldValues[cIdx], data[h]);
      }
      return data[h];
    }
    return oldValues[cIdx];
  });
  sheet.getRange(targetRowIdx, 1, 1, headers.length).setValues([updatedRow]);
  return buildResponse(true, `Registro '${idValue}' actualizado en ${table}.`, data);
}

function handleEliminarRegistro(ss, tableName, idValue, usuario = "Sistema") {
  const table = (tableName || "").toUpperCase();
  if (!SCHEMAS[table]) return buildResponse(false, `Tabla '${tableName}' no existe.`, null);
  const sheet = ss.getSheetByName(table);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const estadoColIdx = headers.indexOf("estado");
  for (let r = 1; r < rows.length; r++) {
    if (String(rows[r][0]).trim() === String(idValue).trim()) {
      if (estadoColIdx !== -1) {
        sheet.getRange(r + 1, estadoColIdx + 1).setValue("INACTIVO");
        registrarAuditoria(ss, usuario, "ELIMINAR_LOGICO", table, idValue, "estado", rows[r][estadoColIdx], "INACTIVO");
        return buildResponse(true, `Registro '${idValue}' deshabilitado.`, { id: idValue });
      } else {
        sheet.deleteRow(r + 1);
        registrarAuditoria(ss, usuario, "ELIMINAR_FISICO", table, idValue, "FILA", JSON.stringify(rows[r]), "");
        return buildResponse(true, `Registro '${idValue}' eliminado físicamente.`, { id: idValue });
      }
    }
  }
  return buildResponse(false, `Registro '${idValue}' no encontrado.`, null);
}

function handleCrearEstudiante(ss, data, usuario) {
  if (!data.nombres || !data.apellidos) return buildResponse(false, "Nombres y apellidos requeridos.", null);
  data.estudiante_id = data.estudiante_id || data.id || generateId("EST");
  data.nombre_completo = data.nombre_completo || `${data.nombres} ${data.apellidos}`.toUpperCase();
  return handleCrearRegistro(ss, "ESTUDIANTES", data, usuario);
}

function handleCrearMatricula(ss, data, usuario) {
  if (!data.estudiante_id || !data.grado || !data.seccion || !data.ano_escolar) return buildResponse(false, "Faltan campos de matrícula.", null);
  const rows = readSheetAsObjects(ss, "MATRICULAS");
  const existe = rows.find(m => m.estudiante_id === data.estudiante_id && String(m.ano_escolar) === String(data.ano_escolar) && m.estado === "ACTIVO");
  if (existe) return buildResponse(false, `Estudiante ya matriculado en ${data.ano_escolar}.`, existe);
  data.matricula_id = data.matricula_id || generateId("MAT");
  data.fecha_matricula = data.fecha_matricula || getTimestamp();
  return handleCrearRegistro(ss, "MATRICULAS", data, usuario);
}

function handleCrearActividad(ss, data, usuario) {
  if (!data.asignatura_id || !data.periodo_id || !data.dimension_id || !data.nombre_actividad) return buildResponse(false, "Faltan datos de la actividad.", null);
  data.actividad_id = data.actividad_id || generateId("ACT");
  data.valor_actividad = Number(data.valor_actividad || 0);
  return handleCrearRegistro(ss, "ACTIVIDADES_EVALUACION", data, usuario);
}

function handleGuardarCalificacion(ss, data, usuario = "Docente") {
  if (!data.actividad_id || !data.estudiante_id) return buildResponse(false, "actividad_id y estudiante_id obligatorios.", null);
  const sheet = ss.getSheetByName("CALIFICACIONES");
  const rows = sheet.getDataRange().getValues();
  const headers = SCHEMAS.CALIFICACIONES;
  const actIdx = headers.indexOf("actividad_id");
  const estIdx = headers.indexOf("estudiante_id");
  const notaIdx = headers.indexOf("nota_obtenida");
  let targetRowIdx = -1;
  let oldNota = "";

  for (let r = 1; r < rows.length; r++) {
    if (String(rows[r][actIdx]).trim() === String(data.actividad_id).trim() && String(rows[r][estIdx]).trim() === String(data.estudiante_id).trim()) {
      targetRowIdx = r + 1;
      oldNota = rows[r][notaIdx];
      break;
    }
  }

  data.nota_obtenida = data.nota_obtenida !== undefined && data.nota_obtenida !== "" ? Number(data.nota_obtenida) : "";
  data.fecha_modificacion = getTimestamp();

  if (targetRowIdx !== -1) {
    const califId = rows[targetRowIdx - 1][headers.indexOf("calificacion_id")];
    data.calificacion_id = califId;
    sheet.getRange(targetRowIdx, notaIdx + 1).setValue(data.nota_obtenida);
    sheet.getRange(targetRowIdx, headers.indexOf("estado") + 1).setValue(data.estado || "CALIFICADO");
    sheet.getRange(targetRowIdx, headers.indexOf("fecha_modificacion") + 1).setValue(data.fecha_modificacion);
    registrarAuditoria(ss, usuario, "MODIFICAR_CALIFICACION", "CALIFICACIONES", califId, "nota_obtenida", oldNota, data.nota_obtenida);
    return buildResponse(true, "Calificación actualizada.", data);
  } else {
    data.calificacion_id = data.calificacion_id || generateId("CAL");
    data.fecha_registro = getTimestamp();
    data.estado = data.estado || "CALIFICADO";
    return handleCrearRegistro(ss, "CALIFICACIONES", data, usuario);
  }
}

function handleGuardarAsistencia(ss, data, usuario) {
  if (!data.estudiante_id || !data.fecha || !data.estado_asistencia) return buildResponse(false, "Faltan datos de asistencia.", null);
  data.asistencia_id = data.asistencia_id || generateId("ASI");
  return handleCrearRegistro(ss, "ASISTENCIA", data, usuario);
}

function handleObtenerCuadroControlador(ss, params) {
  const grado = params.grado;
  const seccion = params.seccion || "1";
  const asignaturaId = params.asignatura_id || params.asignatura;
  const periodoId = params.periodo_id || params.periodo || params.parcial;

  const estudiantes = readSheetAsObjects(ss, "ESTUDIANTES");
  const matriculas = readSheetAsObjects(ss, "MATRICULAS");
  const actividades = readSheetAsObjects(ss, "ACTIVIDADES_EVALUACION");
  const calificaciones = readSheetAsObjects(ss, "CALIFICACIONES");
  const dimensiones = readSheetAsObjects(ss, "DIMENSIONES_EVALUACION");

  const matriculasFiltradas = matriculas.filter(m => {
    let match = m.estado === "ACTIVO";
    if (grado) match = match && String(m.grado).trim() === String(grado).trim();
    if (seccion) match = match && String(m.seccion).trim() === String(seccion).trim();
    return match;
  });

  const estudianteIds = new Set(matriculasFiltradas.map(m => m.estudiante_id));
  const alumnosMatriculados = estudiantes.filter(e => estudianteIds.has(e.estudiante_id));

  const actividadesFiltradas = actividades.filter(a => {
    let match = a.estado !== "INACTIVO";
    if (periodoId) match = match && (a.periodo_id === periodoId || a.periodo === periodoId);
    if (asignaturaId) match = match && (a.asignatura_id === asignaturaId || a.asignatura === asignaturaId);
    if (grado) match = match && String(a.grado).trim() === String(grado).trim();
    return match;
  });

  const cuadroDimensiones = dimensiones.map(dim => {
    const dimActs = actividadesFiltradas.filter(a => a.dimension_id === dim.dimension_id || a.dimension === dim.nombre);
    return {
      dimension_id: dim.dimension_id,
      nombre: dim.nombre,
      valor_maximo: Number(dim.valor_maximo || 0),
      actividades: dimActs.map(a => ({
        actividad_id: a.actividad_id,
        nombre: a.nombre_actividad,
        valor: Number(a.valor_actividad || 0),
        fecha: a.fecha
      }))
    };
  });

  let totalPromedioGrado = 0;
  let notaMaximaGrado = 0;
  let notaMinimaGrado = 100;
  let aprobadosCount = 0;
  let reprobadosCount = 0;

  const filasAlumnos = alumnosMatriculados.map(st => {
    const mat = matriculasFiltradas.find(m => m.estudiante_id === st.estudiante_id);
    let totalParcial = 0;
    let actividadesPendientes = 0;
    let actividadesEvaluadas = 0;

    const resumenDimensiones = cuadroDimensiones.map(dim => {
      let acumuladoDim = 0;
      const celdasActividades = dim.actividades.map(act => {
        const cal = calificaciones.find(c => c.actividadId === act.actividad_id || (c.actividad_id === act.actividad_id && c.estudiante_id === st.estudiante_id));
        const valScore = cal ? cal.nota_obtenida : null;
        let estadoCelda = "Pendiente";
        if (valScore !== null && valScore !== "" && !isNaN(Number(valScore))) {
          estadoCelda = "Calificado";
          acumuladoDim += Number(valScore);
          actividadesEvaluadas++;
        } else if (cal && cal.estado) {
          estadoCelda = cal.estado;
        } else {
          actividadesPendientes++;
        }
        return {
          actividad_id: act.actividad_id,
          nombre_actividad: act.nombre,
          nota: valScore !== null && valScore !== "" ? Number(valScore) : "",
          estado: estadoCelda
        };
      });

      totalParcial += acumuladoDim;
      return {
        dimension_id: dim.dimension_id,
        nombre: dim.nombre,
        valor_maximo_dimension: dim.valor_maximo,
        acumulado_dimension: Math.round(acumuladoDim * 100) / 100,
        porcentaje_dimension: dim.valor_maximo > 0 ? Math.round((acumuladoDim / dim.valor_maximo) * 100) : 0,
        celdas: celdasActividades
      };
    });

    const totalNotaParcial = Math.round(totalParcial);
    if (totalNotaParcial >= CONFIG.DEFAULT_PASS_SCORE) aprobadosCount++;
    else reprobadosCount++;

    totalPromedioGrado += totalNotaParcial;
    if (totalNotaParcial > notaMaximaGrado) notaMaximaGrado = totalNotaParcial;
    if (totalNotaParcial < notaMinimaGrado) notaMinimaGrado = totalNotaParcial;

    return {
      estudiante_id: st.estudiante_id,
      matricula_id: mat ? mat.matricula_id : "",
      nombre_completo: (st.nombre_completo || `${st.nombres} ${st.apellidos}`).toUpperCase(),
      identidad: st.identidad || "",
      tutor: st.tutor || "",
      telefono_tutor: st.telefono_tutor || "",
      dimensiones: resumenDimensiones,
      total_parcial: totalNotaParcial,
      actividades_evaluadas: actividadesEvaluadas,
      actividades_pendientes: actividadesPendientes,
      estado_parcial: totalNotaParcial >= CONFIG.DEFAULT_PASS_SCORE ? "APROBADO" : "REPROBADO"
    };
  });

  const totalAlumnos = alumnosMatriculados.length;
  const promedioGeneralGrado = totalAlumnos > 0 ? Math.round(totalPromedioGrado / totalAlumnos) : 0;

  return buildResponse(true, "Cuadro Controlador generado exitosamente.", {
    parametros: { grado, seccion, asignatura_id: asignaturaId, periodo_id: periodoId },
    estadisticas: {
      total_alumnos: totalAlumnos,
      promedio_grado: promedioGeneralGrado,
      nota_maxima: totalAlumnos > 0 ? notaMaximaGrado : 0,
      nota_minima: totalAlumnos > 0 ? notaMinimaGrado : 0,
      aprobados: aprobadosCount,
      reprobados: reprobadosCount,
      total_actividades_registradas: actividadesFiltradas.length
    },
    esquema_dimensiones: cuadroDimensiones,
    filas: filasAlumnos
  });
}

function handleObtenerExpedienteEstudiante(ss, estudianteId) {
  if (!estudianteId) return buildResponse(false, "Parámetro 'estudiante_id' es requerido.", null);
  const estudiantes = readSheetAsObjects(ss, "ESTUDIANTES");
  const alumno = estudiantes.find(e => e.estudiante_id === estudianteId || String(e.identidad) === String(estudianteId));
  if (!alumno) return buildResponse(false, `Estudiante con ID '${estudianteId}' no fue encontrado.`, null);

  const realId = alumno.estudiante_id;
  const matriculas = readSheetAsObjects(ss, "MATRICULAS").filter(m => m.estudiante_id === realId);
  const calificaciones = readSheetAsObjects(ss, "CALIFICACIONES").filter(c => c.estudiante_id === realId);
  const asistencia = readSheetAsObjects(ss, "ASISTENCIA").filter(a => a.estudiante_id === realId);
  const personalidad = readSheetAsObjects(ss, "CONDUCTA_PERSONALIDAD").filter(p => p.estudiante_id === realId);
  const bitacora = readSheetAsObjects(ss, "BITACORA_Y_SART").filter(b => b.estudiante_id === realId);

  const totalAsistencias = asistencia.length;
  const ausencias = asistencia.filter(a => a.estado_asistencia === "Ausente").length;
  const tardanzas = asistencia.filter(a => a.estado_asistencia === "Tarde").length;

  return buildResponse(true, "Expediente de estudiante recuperado con éxito.", {
    estudiante: alumno,
    historial_matriculas: matriculas,
    calificaciones: calificaciones,
    conducta_personalidad: personalidad,
    bitacora_sart: bitacora,
    resumen_asistencia: {
      total_registros: totalAsistencias,
      ausencias: ausencias,
      tardanzas: tardanzas,
      porcentaje_asistencia: totalAsistencias > 0 ? Math.round(((totalAsistencias - ausencias) / totalAsistencias) * 100) : 100
    }
  });
}

function handleGetData(ss) {
  const data = {};
  Object.keys(SCHEMAS).forEach(t => { data[t.toLowerCase()] = readSheetAsObjects(ss, t); });
  return buildResponse(true, "Base de Datos recuperada exitosamente.", data);
}

function handleBuscarPorId(ss, tableName, idValue) {
  const table = (tableName || "").toUpperCase();
  if (!SCHEMAS[table]) return buildResponse(false, `Tabla '${tableName}' no existe.`, null);
  const records = readSheetAsObjects(ss, table);
  const record = records.find(r => String(r[SCHEMAS[table][0]]).trim() === String(idValue).trim());
  if (record) return buildResponse(true, `Registro encontrado en ${table}.`, record);
  return buildResponse(false, `Registro '${idValue}' no encontrado en ${table}.`, null);
}

function handleFiltrarRegistros(ss, tableName, params) {
  const table = (tableName || "").toUpperCase();
  if (!SCHEMAS[table]) return buildResponse(false, `Tabla '${tableName}' no existe.`, null);
  let records = readSheetAsObjects(ss, table);
  const filterKeys = Object.keys(params).filter(k => k !== "action" && k !== "tabla" && k !== "apiKey");
  if (filterKeys.length > 0) {
    records = records.filter(r => filterKeys.every(key => r[key] !== undefined && String(r[key]).toLowerCase() === String(params[key]).toLowerCase()));
  }
  return buildResponse(true, `Filtro aplicado sobre ${table}.`, records);
}

function handleSyncAll(ss, dataToSync) {
  if (!dataToSync) return buildResponse(false, "Objeto 'data' no proporcionado.", null);
  
  Object.keys(dataToSync).forEach(key => {
    const tableName = key.toUpperCase();
    if (SCHEMAS[tableName] && Array.isArray(dataToSync[key])) {
      writeObjectsToSheet(ss, tableName, SCHEMAS[tableName], dataToSync[key]);
    }
  });

  try {
    crearCuadroControladorInteractivo(ss);
  } catch (err) {}

  return buildResponse(true, "Sincronización completa ejecutada exitosamente.", { timestamp: getTimestamp() });
}

function registrarAuditoria(ss, usuario, accion, tabla, registroId, campoModificado, valorAnterior, valorNuevo) {
  try {
    const sheet = ss.getSheetByName("AUDITORIA");
    if (!sheet) return;
    const fechaActual = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
    const horaActual = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "HH:mm:ss");
    sheet.appendRow([generateId("AUD"), usuario || "Anonimo", accion, tabla, registroId || "", campoModificado || "", String(valorAnterior || ""), String(valorNuevo || ""), fechaActual, horaActual]);
  } catch (err) {}
}

function readSheetAsObjects(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      if (val instanceof Date) val = Utilities.formatDate(val, CONFIG.TIMEZONE, "yyyy-MM-dd");
      if (val !== "" && val !== null && val !== undefined) hasValue = true;
      obj[headers[j]] = val;
    }
    if (hasValue) result.push(obj);
  }
  return result;
}

function writeObjectsToSheet(ss, sheetName, headers, objectsList) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  else sheet.clearContents();

  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#0F172A").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");

  if (!objectsList || !Array.isArray(objectsList) || objectsList.length === 0) return;
  const rows = objectsList.map(obj => headers.map(h => obj[h] !== undefined && obj[h] !== null ? obj[h] : ""));
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);

  try {
    if (!sheet.getFilter()) {
      sheet.getRange(1, 1, Math.max(rows.length + 1, 2), headers.length).createFilter();
    }
  } catch(e) {}
}

function generateId(prefix = "ID") {
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const ts = new Date().getTime().toString().substring(7);
  return `${prefix}-${ts}${rand}`;
}

function getTimestamp() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

function buildResponse(success, message, data) {
  return ContentService.createTextOutput(JSON.stringify({ success, message, data }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

,Description:
