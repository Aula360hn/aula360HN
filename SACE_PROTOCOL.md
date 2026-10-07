# MANIFESTO Y PROTOCOLO OFICIAL INTEGRACIÓN SACE
## Sistema de Administración del Centro Educativo (Secretaría de Educación de Honduras)

---

## 1. ¿Qué es SACE?

El **SACE** (*Sistema de Administración del Centro Educativo*) es la plataforma oficial gubernamental de la **Secretaría de Educación de Honduras** (`sace.se.gob.hn`). Es el sistema centralizado donde los docentes de los 18 departamentos de Honduras registran:
- Matrícula escolar e identidades (DNI) de los alumnos.
- Calificaciones y notas finales por parcial (I, II, III y IV Parcial + Recuperación).
- Inasistencias (faltas) acumuladas por parcial.
- Evaluación del comportamiento y conducta (Rasgos de Personalidad).

---

## 2. Estructura Exacta de las "Macros SACE" (Plantillas Excel Oficiales)

El portal SACE descarga archivos Excel binarios en formato `.xls` (BIFF8) o `.xlsx` personalizados para cada docente, centro educativo, sección y asignatura. 

### A. Plantilla de Calificaciones e Inasistencias (`SACE_NOTAS`)
Cada plantilla oficial de notas tiene una estructura fija de **encabezados, metadatos y código único de pestaña**:

| Fila Excel | Celda Principal | Contenido / Metadato Oficial de SACE | Ejemplo |
| :--- | :--- | :--- | :--- |
| **Fila 1 (R1)** | `A1` | Código de Centro Educativo + Nombre de Institución | `050300022B09 \| JOSE CECILIO DEL VALLE` |
| **Fila 2 (R2)** | `A2` | Modalidad Escolar | `MODALIDAD: NO APLICA` |
| **Fila 3 (R3)** | `A3` | Grado y Sección | `SÉPTIMO GRADO SECCIÓN 1` |
| **Fila 4 (R4)** | `A4` | Jornada de Estudio | `JORNADA VESPERTINA` |
| **Fila 5 (R5)** | `A5` | **ASIGNATURA OFICIAL DE SACE** | `ESPAÑOL (COMUNICACIÓN)` |
| **Fila 6 (R6)** | `A6:L6` | Encabezados de Documento, Identidad, Nombre y Parciales (I, II, III, IV, Recuperación) |
| **Fila 7 (R7)** | `D7:K7` | Sub-encabezados: `INASISTENCIAS` y `NOTA TOTAL` por cada parcial |
| **Filas 8+** | `A8:C8...` | **Datos Alumno**: Col A: `HND`, Col B: Identidad DNI (13 dígitos), Col C: Nombre Completo |
| **Filas 8+** | `D8:K8...` | **Celdas Editables**: Col D: Faltas P1, Col E: Nota Total P1, Col F: Faltas P2, Col G: Nota Total P2, etc. |

### B. Plantilla de Personalidad / Conducta (`SACE_PERSONALIDAD`)
- **Filas 1-5**: Escala de evaluación oficial (`4:Sobresaliente`, `3:Muy Bueno`, `2:Bueno`, `1:Debe Mejorar`) y datos del Centro, Curso y Sección (`E2:E5`).
- **Fila 7**: Encabezado del Parcial activo (`PERSONALIDAD (PARCIAL I)`).
- **Fila 8**: Encabezados de rasgos (`PUNTUALIDAD`, `ESPÍRITU DE TRABAJO`, `ORDEN Y PRESENTACIÓN`, `SOCIABILIDAD`, `MORALIDAD`).
- **Filas 9+**: Datos del estudiante (Col A: No, Col B: Tipo ID, Col C: DNI, Col D: Nombre) y los 5 aspectos editables (Cols E a I).

---

## 3. Protocolo Estricto de Validaciones de Seguridad (Pre-Inyección)

Para evitar la corrupción de datos, alterar notas de asignaturas equivocadas o causar rechazo en el servidor de SACE, la aplicación **DEBE EJECUTAR OBLIGATORIAMENTE** la siguiente matriz de validación antes de permitir inyectar o descargar el archivo:

### Matriz de Validación Previa:
1. **Validación de Asignatura (Fila 5 / Celda A5):**
   - El sistema extrae el valor de la celda `A5` de la plantilla.
   - Normaliza la asignatura oficial (removiendo acentos, caracteres especiales y mayúsculas) y la compara con la asignatura del curso activo seleccionado en Aula 360 HN.
   - 🔴 **REGLA CRÍTICA:** Si las asignaturas no coinciden (ej. se subió la plantilla de *Matemáticas* para un curso de *Español*), el sistema **BLOQUEA COMPLETAMENTE** el proceso con la alerta:
     `⛔ ASIGNATURA INCOMPATIBLE: El archivo cargado es de "${asigPlantilla}", pero el curso activo es "${asigCurso}". Cargue la plantilla correcta.`

2. **Validación de Grado y Sección (Fila 3 / Celda A3):**
   - Valida que el grado y número de sección de la plantilla correspondan al curso seleccionado.

3. **Validación de Centro Educativo (Fila 1 / Celda A1):**
   - Valida el código de centro educativo de 12 dígitos (ej. `050300022B09`).

4. **Validación de Nombre Único de Pestaña (SheetName):**
   - Cada macro SACE tiene una pestaña única (ej. `21480926~1~1123`).
   - 🔴 **REGLA CRÍTICA:** **NUNCA** renombrar la pestaña Excel ni generar una hoja nueva sintética con nombre genérico `"1"`. Se debe conservar la hoja original leída.

---

## 4. Reglas Inmutables de Preservación de Formato

1. **Modificación Binaria In-Situ (In-Place Edit):**
   - La aplicación no debe "recrear" el libro desde cero. Debe tomar el objeto `workbook` leído mediante SheetJS, modificar **únicamente los valores numéricos (`ws[ref].v`)** de las celdas de calificaciones/faltas correspondientes al parcial, y exportarlo con `XLSX.write(workbook, { bookType: 'biff8', ... })`.
2. **Preservación de Metadatos de Celdas:**
   - Mantener las propiedades de combinación (`!merges`), referencia (`!ref`) y formato original.
3. **Cálculo de Inasistencias por Fecha de Parcial:**
   - Las inasistencias de cada parcial se filtran estrictamente por la ventana de fechas:
     $$\text{Inasistencias} = \sum \text{Asistencias con estado 'Ausente'} \quad \text{donde } \text{fechaInicio} \le \text{fecha} \le \text{fechaFin}$$

---

## 5. Resumen de Flujo de Trabajo en Aula 360 HN

1. **Selección del Curso Activo y Parcial** (I, II, III, IV o Anual).
2. **Subida de la Macro Oficial SACE** descargada previamente de `sace.se.gob.hn`.
3. **Validación Estricta de Seguridad** (Asignatura, Grado, Sección, Centro y Vinculación de Alumnos por DNI/Nombre).
4. **Inyección In-Situ y Descarga** de la plantilla conservando el 100% de la macro original para su subida exitosa al portal gubernamental SACE.
