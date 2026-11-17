/**
 * Aula 360 HN - Módulo: Banco de Rúbricas
 * Permite la gestión centralizada de rúbricas reutilizables.
 */

Views.BancoRubricas = {
    filters: {
        search: '',
        category: 'Todas'
    },

    render() {
        const rubricas = Store.get('rubricas') || [];
        const filtered = rubricas.filter(r => {
            const matchesSearch = r.nombre.toLowerCase().includes(this.filters.search.toLowerCase()) || 
                                 (r.descripcion || '').toLowerCase().includes(this.filters.search.toLowerCase());
            const matchesCat = this.filters.category === 'Todas' || r.categoria === this.filters.category;
            return matchesSearch && matchesCat;
        });

        const categories = ['Todas', ...new Set(rubricas.map(r => r.categoria).filter(Boolean))];

        return `
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-h" style="flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 300px;">
                        <div class="stat-icon" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9; width: 40px; height: 40px;">
                            <i data-lucide="layout-list"></i>
                        </div>
                        <div>
                            <div class="title">Banco de Rúbricas</div>
                            <div class="text-xs text-muted font-bold">${rubricas.length} Rúbricas disponibles</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="Views.BancoRubricas.exportAll()">
                            <i data-lucide="download" style="width:16px"></i> Exportar
                        </button>
                        <button class="btn btn-primary" onclick="Views.BancoRubricas.showForm()">
                            <i data-lucide="plus" style="width:16px"></i> Nueva Rúbrica
                        </button>
                    </div>
                </div>
                <div class="card-b">
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <div style="position: relative; flex: 1; min-width: 200px;">
                                <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: var(--text-muted);"></i>
                                <input type="text" class="form-control" placeholder="Buscar rúbrica..." style="padding-left: 40px;" 
                                    value="${this.filters.search}" oninput="Views.BancoRubricas.handleFilter('search', this.value)">
                            </div>
                            <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; max-width: 100%;">
                                ${categories.map(cat => `
                                    <button class="gdhn-pill ${this.filters.category === cat ? 'active' : ''}" 
                                        onclick="Views.BancoRubricas.handleFilter('category', '${cat}')"
                                        style="white-space: nowrap; ${this.filters.category === cat ? 'background: #0ea5e9; color: white;' : ''}">
                                        ${cat}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        ${filtered.length === 0 ? `
                            <div class="empty-state" style="padding: 60px 20px;">
                                <div class="stat-icon" style="width: 64px; height: 64px; margin-bottom: 16px; opacity: 0.3;">
                                    <i data-lucide="file-question" style="width: 32px; height: 32px;"></i>
                                </div>
                                <div class="font-bold text-lg">No se encontraron rúbricas</div>
                                <p class="text-muted">Intenta cambiar los filtros o crea una nueva rúbrica técnica.</p>
                            </div>
                        ` : `
                            <div class="grid grid-3" style="gap: 16px;">
                                ${filtered.map(r => this.renderRubricCard(r)).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    renderRubricCard(r) {
        const typeLabel = r.tipoRubrica === 'analitica' ? 'Analítica' : 'Escala Simple';
        const color = r.tipoRubrica === 'analitica' ? '#8b5cf6' : '#10b981';
        
        return `
            <div class="stat-card" style="display: flex; flex-direction: column; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;" onclick="Views.BancoRubricas.showDetail('${r.id}')">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <span class="badge" style="background: ${color}1A; color: ${color}; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${typeLabel}
                    </span>
                    <div class="dropdown" style="position: relative;">
                        <button class="btn-icon" onclick="event.stopPropagation(); Views.BancoRubricas.toggleMenu(event, '${r.id}')">
                            <i data-lucide="more-vertical" style="width:16px"></i>
                        </button>
                        <div id="drop-rubric-${r.id}" class="course-dropdown" style="right: 0; top: 30px; z-index: 100;">
                            <button onclick="event.stopPropagation(); Views.BancoRubricas.showForm('${r.id}')">
                                <i data-lucide="pencil" style="width:14px"></i> Editar
                            </button>
                            <button onclick="event.stopPropagation(); Views.BancoRubricas.duplicate('${r.id}')">
                                <i data-lucide="copy" style="width:14px"></i> Duplicar
                            </button>
                            ${!r.isTemplate ? `
                                <div style="height: 1px; background: #f1f5f9; margin: 4px 0;"></div>
                                <button class="delete" onclick="event.stopPropagation(); Views.BancoRubricas.delete('${r.id}')">
                                    <i data-lucide="trash-2" style="width:14px"></i> Eliminar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div style="flex: 1;">
                    <div class="font-bold text-lg mb-1 leading-tight">${r.nombre}</div>
                    <div class="text-xs text-muted mb-3 line-clamp-2">${r.descripcion || 'Sin descripción'}</div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="target" style="width:14px; color: var(--primary);"></i>
                        <span class="text-sm font-black">${r.puntajeTotal} pts</span>
                    </div>
                    <div class="text-[10px] font-bold text-muted uppercase">${r.categoria || 'Gral'}</div>
                </div>
            </div>
        `;
    },

    handleFilter(key, value) {
        this.filters[key] = value;
        const container = document.getElementById('content');
        container.innerHTML = this.render();
        if (window.lucide) window.lucide.createIcons();
    },

    toggleMenu(e, id) {
        e.stopPropagation();
        const drop = document.getElementById(`drop-rubric-${id}`);
        const wasOpen = drop.classList.contains('open');
        document.querySelectorAll('.course-dropdown').forEach(d => d.classList.remove('open'));
        if (!wasOpen) drop.classList.add('open');
        
        const close = () => {
            drop.classList.remove('open');
            document.removeEventListener('click', close);
        };
        setTimeout(() => document.addEventListener('click', close), 10);
    },

    showDetail(id) {
        const r = Store.get('rubricas').find(x => x.id === id);
        if (!r) return;

        UI.modal(r.nombre, `
            <div style="max-height: 80vh; overflow-y: auto; padding-right: 8px;">
                <div class="mb-4">
                    <p class="text-muted text-sm">${r.descripcion || ''}</p>
                    <div style="display: flex; gap: 12px; margin-top: 8px;">
                        <span class="badge badge-blue">${r.tipoRubrica === 'analitica' ? 'Matriz Analítica' : 'Escala Lineal'}</span>
                        <span class="badge badge-orange">${r.metodoCalculo === 'suma_directa' ? 'Suma Directa' : 'Conversión %'}</span>
                        <span class="badge badge-green">${r.puntajeTotal} Puntos Reales</span>
                    </div>
                </div>

                <div class="table-responsive" style="border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                    <table class="table" style="margin: 0;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="width: 30%;">Criterio / Indicador</th>
                                ${r.tipoRubrica === 'analitica' ? '<th style="text-align: center;">Niveles de Desempeño</th>' : '<th style="text-align: center;">Valoración</th>'}
                                <th style="width: 15%; text-align: center;">Peso</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${r.criterios.map(c => `
                                <tr>
                                    <td>
                                        <div class="font-bold">${c.nombre}</div>
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
                                            ${c.niveles.map(n => `
                                                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; flex: 1; min-width: 80px; text-align: center;">
                                                    <div class="text-[10px] font-black uppercase text-muted mb-1">${n.nombre}</div>
                                                    <div class="font-bold text-sm" style="color: var(--primary);">${n.valor} pts</div>
                                                    ${n.descriptor ? `<div class="text-[10px] text-light mt-1 leading-tight">${n.descriptor}</div>` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </td>
                                    <td style="text-align: center;">
                                        <div class="badge badge-purple" style="font-size: 11px;">${c.peso} pts</div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot style="background: #f1f5f9;">
                            <tr>
                                <td colspan="2" class="text-right font-bold">Total Máximo Seleccionable:</td>
                                <td class="text-center font-black" style="color: var(--primary); font-size: 16px;">${r.puntajeTotal} pts</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 24px;">
                    <button class="btn btn-secondary" style="flex: 1;" onclick="UI.closeModal()">Cerrar</button>
                    <button class="btn btn-primary" style="flex: 1;" onclick="Views.BancoRubricas.showForm('${r.id}')">
                        <i data-lucide="pencil" style="width:16px"></i> Editar Rúbrica
                    </button>
                </div>
            </div>
        `);
        if (window.lucide) window.lucide.createIcons();
    },

    showForm(id = null) {
        const rubricas = Store.get('rubricas');
        const r = id ? JSON.parse(JSON.stringify(rubricas.find(x => x.id === id))) : {
            id: 'rub_' + Date.now(),
            nombre: '',
            descripcion: '',
            asignatura: 'General',
            categoria: 'Tarea',
            tipoRubrica: 'analitica',
            puntajeTotal: 10,
            metodoCalculo: 'suma_directa',
            estado: 'Activa',
            criterios: [
                {
                    id: 'crit_' + Date.now() + '_1',
                    nombre: 'Criterio 1',
                    peso: 5,
                    niveles: [
                        { id: 'niv_1', nombre: 'Excelente', valor: 5, descriptor: '' },
                        { id: 'niv_2', nombre: 'Básico', valor: 2.5, descriptor: '' }
                    ]
                }
            ]
        };

        const categories = ['Tarea', 'Exposición', 'Proyecto', 'Ensayo', 'Maqueta', 'Cuaderno de práctica', 'Huerto escolar', 'Producción escrita', 'Laboratorio'];

        UI.modal(id ? 'Editar Rúbrica' : 'Crear Nueva Rúbrica', `
            <form id="rubric-form" style="max-height: 80vh; overflow-y: auto; padding: 4px;">
                <div class="grid grid-2" style="gap: 12px;">
                    <div class="form-group" style="grid-column: span 2">
                        <label class="form-label">Nombre de la Rúbrica</label>
                        <input type="text" name="nombre" class="form-control" required value="${r.nombre}" placeholder="Ej: Evaluación de Maqueta de Sistema Solar">
                    </div>
                    <div class="form-group" style="grid-column: span 2">
                        <label class="form-label">Descripción / Objetivo</label>
                        <textarea name="descripcion" class="form-control" rows="2" placeholder="Explica de qué trata esta rúbrica...">${r.descripcion || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Campo del Conocimiento</label>
                        <input type="text" name="asignatura" class="form-control" value="${r.asignatura}" list="list-asig">
                        <datalist id="list-asig">
                            ${Store.get('cursos').map(c => `<option value="${c.asignatura}">`).join('')}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select name="categoria" class="form-control">
                            ${categories.map(cat => `<option ${r.categoria === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo de Rúbrica</label>
                        <select name="tipoRubrica" class="form-control" onchange="Views.BancoRubricas.refreshFormUI(this.value)">
                            <option value="analitica" ${r.tipoRubrica === 'analitica' ? 'selected' : ''}>Analítica (Con descriptores)</option>
                            <option value="escala_simple" ${r.tipoRubrica === 'escala_simple' ? 'selected' : ''}>Escala Simple (Sin descriptores)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Puntaje Máximo</label>
                        <input type="number" name="puntajeTotal" class="form-control" value="${r.puntajeTotal}" step="any" required>
                    </div>
                </div>

                <div style="margin-top: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div class="font-bold">Criterios e Indicadores</div>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="Views.BancoRubricas.addCriterion()">
                            <i data-lucide="plus" style="width:14px"></i> Añadir Criterio
                        </button>
                    </div>
                    <div id="criteria-container" style="display: flex; flex-direction: column; gap: 16px;">
                        ${r.criterios.map((c, idx) => this.renderCriterionForm(c, idx, r.tipoRubrica)).join('')}
                    </div>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 32px; position: sticky; bottom: 0; background: white; padding: 12px 0; border-top: 1px solid #f1f5f9; z-index: 10;">
                    <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="UI.closeModal()">Cancelar</button>
                    <button type="button" class="btn btn-primary" style="flex: 1;" onclick="Views.BancoRubricas.save('${r.id}')">Guardar Rúbrica</button>
                </div>
            </form>
        `);
        if (window.lucide) window.lucide.createIcons();
    },

    renderCriterionForm(c, idx, type) {
        return `
            <div class="criterion-item card" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;" data-id="${c.id}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px;">
                    <div style="flex: 1">
                        <label class="text-[10px] font-black text-muted uppercase">Nombre del Criterio</label>
                        <input type="text" class="form-control crit-name" value="${c.nombre}" placeholder="Ej: Contenido" required>
                    </div>
                    <div style="width: 80px;">
                        <label class="text-[10px] font-black text-muted uppercase">Peso Max</label>
                        <input type="number" class="form-control crit-weight" value="${c.peso}" step="any" required>
                    </div>
                    <button type="button" class="btn-icon delete" style="margin-top: 20px;" onclick="this.closest('.criterion-item').remove()">
                        <i data-lucide="trash-2" style="width:16px"></i>
                    </button>
                </div>
                
                <div class="levels-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
                    ${c.niveles.map((n, nidx) => `
                        <div class="level-box" style="background: white; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <input type="text" class="form-control level-name" value="${n.nombre}" placeholder="Nivel" style="font-size: 11px; height: 24px; padding: 2px 8px; font-weight: bold; border-color: transparent; background: #f1f5f9;">
                                <button type="button" class="btn-icon" style="color: #ef4444; width: 20px; height: 20px;" onclick="if(this.closest('.levels-container').children.length > 2) this.closest('.level-box').remove()">
                                    <i data-lucide="x" style="width:12px"></i>
                                </button>
                            </div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-[10px] font-bold">Valor:</span>
                                <input type="number" class="form-control level-value" value="${n.valor}" step="any" required style="font-size: 11px; height: 24px; padding: 2px 8px;">
                            </div>
                            ${type === 'analitica' ? `
                                <textarea class="form-control level-desc" placeholder="Descriptor..." style="font-size: 10px; min-height: 40px; padding: 4px;">${n.descriptor || ''}</textarea>
                            ` : ''}
                        </div>
                    `).join('')}
                    <button type="button" class="btn bg-white border-dashed border-2 flex flex-col items-center justify-center p-2 rounded-lg opacity-60 hover:opacity-100" onclick="Views.BancoRubricas.addLevel(this)">
                        <i data-lucide="plus-circle" style="width:20px; color: var(--primary);"></i>
                        <span class="text-[9px] font-bold mt-1">Nuevo Nivel</span>
                    </button>
                </div>
            </div>
        `;
    },

    addCriterion() {
        const container = document.getElementById('criteria-container');
        const type = document.querySelector('[name="tipoRubrica"]').value;
        const idx = container.querySelectorAll('.criterion-item').length;
        const id = 'crit_' + Date.now();
        const dummy = {
            id,
            nombre: 'Nuevo Criterio',
            peso: 5,
            niveles: [
                { id: 'niv_1', nombre: 'Excelente', valor: 5, descriptor: '' },
                { id: 'niv_2', nombre: 'Necesita mejorar', valor: 1, descriptor: '' }
            ]
        };
        const temp = document.createElement('div');
        temp.innerHTML = this.renderCriterionForm(dummy, idx, type);
        container.appendChild(temp.firstElementChild);
        if (window.lucide) window.lucide.createIcons();
    },

    addLevel(btn) {
        const container = btn.closest('.levels-container');
        const type = document.querySelector('[name="tipoRubrica"]').value;
        const temp = document.createElement('div');
        temp.className = 'level-box';
        temp.style = 'background: white; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px;';
        temp.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <input type="text" class="form-control level-name" value="Nuevo" placeholder="Nivel" style="font-size: 11px; height: 24px; padding: 2px 8px; font-weight: bold; border-color: transparent; background: #f1f5f9;">
                <button type="button" class="btn-icon" style="color: #ef4444; width: 20px; height: 20px;" onclick="this.closest('.level-box').remove()">
                    <i data-lucide="x" style="width:12px"></i>
                </button>
            </div>
            <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] font-bold">Valor:</span>
                <input type="number" class="form-control level-value" value="0" step="any" required style="font-size: 11px; height: 24px; padding: 2px 8px;">
            </div>
            ${type === 'analitica' ? `
                <textarea class="form-control level-desc" placeholder="Descriptor..." style="font-size: 10px; min-height: 40px; padding: 4px;"></textarea>
            ` : ''}
        `;
        container.insertBefore(temp, btn);
        if (window.lucide) window.lucide.createIcons();
    },

    refreshFormUI(type) {
        // Redraw criteria with new type (show/hide descriptors)
        const items = document.querySelectorAll('.criterion-item');
        items.forEach((item, idx) => {
            const data = {
                id: item.dataset.id,
                nombre: item.querySelector('.crit-name').value,
                peso: item.querySelector('.crit-weight').value,
                niveles: Array.from(item.querySelectorAll('.level-box')).map(lb => ({
                    id: 'n_' + Math.random(),
                    nombre: lb.querySelector('.level-name').value,
                    valor: lb.querySelector('.level-value').value,
                    descriptor: lb.querySelector('.level-desc')?.value || ''
                }))
            };
            item.outerHTML = this.renderCriterionForm(data, idx, type);
        });
        if (window.lucide) window.lucide.createIcons();
    },

    save(id) {
        try {
            const form = document.getElementById('rubric-form');
            if (!form) return;

            if (!form.checkValidity()) {
                UI.toast('Por favor, completa correctamente todos los campos obligatorios.', 'error');
                form.reportValidity();
                return;
            }

            const fd = new FormData(form);
            
            const rubrica = {
                id,
                nombre: fd.get('nombre'),
                descripcion: fd.get('descripcion'),
                asignatura: fd.get('asignatura'),
                categoria: fd.get('categoria'),
                tipoRubrica: fd.get('tipoRubrica'),
                puntajeTotal: parseFloat(fd.get('puntajeTotal')),
                metodoCalculo: 'suma_directa',
                estado: 'Activa',
                criterios: []
            };

            const critNodes = document.querySelectorAll('.criterion-item');
            critNodes.forEach(node => {
                const crit = {
                    id: node.dataset.id || 'crit_' + Date.now() + Math.random(),
                    nombre: (node.querySelector('.crit-name').value || '').trim(),
                    peso: parseFloat(node.querySelector('.crit-weight').value) || 0,
                    niveles: []
                };

                const levelNodes = node.querySelectorAll('.level-box');
                levelNodes.forEach(lnode => {
                    crit.niveles.push({
                        id: 'niv_' + Math.random(),
                        nombre: (lnode.querySelector('.level-name').value || '').trim(),
                        valor: parseFloat(lnode.querySelector('.level-value').value) || 0,
                        descriptor: lnode.querySelector('.level-desc')?.value || ''
                    });
                });
                rubrica.criterios.push(crit);
            });

            if (rubrica.criterios.length === 0) {
                UI.toast('La rúbrica debe tener al menos un criterio.', 'error');
                return;
            }

            const sumWeights = Math.round(rubrica.criterios.reduce((acc, c) => acc + c.peso, 0) * 100) / 100;
            const totalDeclarado = rubrica.puntajeTotal;
            if (Math.abs(sumWeights - totalDeclarado) > 0.01) {
                const diff = Math.round((sumWeights - totalDeclarado) * 100) / 100;
                const msg = diff > 0
                    ? `Los criterios suman ${sumWeights} pts, pero el total declarado es ${totalDeclarado} pts. Hay ${diff} pts de más. Ajusta los pesos para que sumen exactamente ${totalDeclarado} pts.`
                    : `Los criterios suman ${sumWeights} pts, pero el total declarado es ${totalDeclarado} pts. Faltan ${Math.abs(diff)} pts. Ajusta los pesos para que sumen exactamente ${totalDeclarado} pts.`;
                UI.toast(msg, 'error');
                return;
            }

            let rawData = Store.get('rubricas');
            let data = Array.isArray(rawData) ? rawData : [];
            const idx = data.findIndex(x => x.id === id);
            if (idx > -1) {
                data[idx] = rubrica;
            } else {
                data.push(rubrica);
            }

            Store.data.rubricas = data;
            Store.save();
            UI.closeModal();
            UI.toast('Rúbrica guardada correctamente.', 'success');
            Router.navigate('banco-rubricas');
        } catch (e) {
            console.error(e);
            UI.toast('Ups, ocurrió un error: ' + e.message, 'error');
        }
    },

    duplicate(id) {
        const data = Store.get('rubricas');
        const original = data.find(x => x.id === id);
        if (!original) return;

        const copy = JSON.parse(JSON.stringify(original));
        copy.id = 'rub_' + Date.now();
        copy.nombre = copy.nombre + ' (Copia)';
        copy.isTemplate = false;

        data.push(copy);
        Store.data.rubricas = data;
        Store.save();
        UI.toast('Rúbrica duplicada con éxito.', 'success');
        Router.navigate('banco-rubricas');
    },

    delete(id) {
        if (!confirm('¿Estás seguro de eliminar esta rúbrica? Esta acción no se puede deshacer.')) return;
        const data = Store.get('rubricas');
        const filtered = data.filter(x => x.id !== id);
        Store.data.rubricas = filtered;
        Store.save();
        UI.toast('Rúbrica eliminada.', 'success');
        Router.navigate('banco-rubricas');
    },

    exportAll() {
        const data = Store.get('rubricas');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `banco-rubricas-aula360-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
