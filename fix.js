const fs = require('fs');
let text = fs.readFileSync('app.js', 'utf8');

const t1 = '<option value=${s.id}"';
const r1 = '<option value="${s.id}"';
text = text.replace(t1, r1);

const t2 = "const st2 = students.find(s => s.id === a.estudianteId);";
const r2 = "const cleanId = (a.estudianteId || '').replace(/\"/g, '');\n                    const st2 = students.find(s => s.id === cleanId);";
text = text.replace(t2, r2);

const t3_start = "edit(id) {";
const t3_end = "            });\n},"; 

// Let's just manually replace the edit function with substring
const idxStart = text.indexOf("edit(id) {\n    const alert = Store.get('sartAlertas').find(a => a.id === id);");
if (idxStart !== -1) {
    const endStr = "            `);\n},";
    const idxEnd = text.indexOf(endStr, idxStart);
    if (idxEnd !== -1) {
        const fullLen = idxEnd + endStr.length;
        const newCode = `edit(id) {
    const alert = Store.get('sartAlertas').find(a => a.id === id);
    if (!alert) return;
    const c = Store.getActiveCourse();
    const students = Store.getStudentsByCourse(c.id);
    const studentId = (alert.estudianteId || '').replace(/"/g, '');
    
    UI.modal('Editar Alerta / Seguimiento', \`
            <form id="sart-update" onsubmit="event.preventDefault(); Views.SART.update('\${id}')">
                            <div class="form-group">
                                <label class="form-label">Estudiante</label>
                                <select name="estudianteId" class="form-control">
                                    \${students.map(s => \`<option value="\${s.id}" \${s.id === studentId ? 'selected' : ''}>\${s.nombreCompleto}</option>\`).join('')}
                                </select>
                            </div>
                            <div class="grid grid-2">
                                <div class="form-group">
                                    <label class="form-label">Categoría</label>
                                    <select name="categoria" class="form-control">
                                        <option \${alert.categoria === 'Abandono/Ausentismo' ? 'selected' : ''}>Abandono/Ausentismo</option>
                                        <option \${alert.categoria === 'Fracaso Escolar' ? 'selected' : ''}>Fracaso Escolar</option>
                                        <option \${alert.categoria === 'Conducta' ? 'selected' : ''}>Conducta</option>
                                        <option \${alert.categoria === 'Otras' ? 'selected' : ''}>Otras</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Nivel</label>
                                    <select name="nivel" class="form-control">
                                        <option \${alert.nivel === 'Leve' ? 'selected' : ''}>Leve</option>
                                        <option \${alert.nivel === 'Moderado' ? 'selected' : ''}>Moderado</option>
                                        <option \${alert.nivel === 'Grave' ? 'selected' : ''}>Grave</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group"><label class="form-label">Descripción / Acción tomada inicial</label><textarea name="descripcion" class="form-control" rows="3" required>\${alert.descripcion || ''}</textarea></div>
                            <div class="form-group"><label class="form-label">Nota de seguimiento</label><textarea name="seguimiento" class="form-control" rows="4" placeholder="Acciones tomadas, compromisos, observaciones...">\${alert.seguimiento || ''}</textarea></div>
                            <div class="form-group"><label class="form-label">Estado</label><select name="estado" class="form-control"><option \${alert.estado === 'Abierta' ? 'selected' : ''}>Abierta</option><option \${alert.estado === 'En seguimiento' ? 'selected' : ''}>En seguimiento</option><option \${alert.estado === 'Cerrada' ? 'selected' : ''}>Cerrada</option></select></div>
                            <div class="flex justify-end gap-2 mt-4">
                                <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Actualizar</button>
                            </div>
                        </form>
            \`);
},`;
        text = text.substring(0, idxStart) + newCode + text.substring(fullLen);
    }
}
fs.writeFileSync('app.js', text, 'utf8');
console.log("Done");
