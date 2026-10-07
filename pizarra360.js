// ============================================================
//  PIZARRA 360 — Herramientas Interactivas Flotantes
//  Aula 360HN  |  v1.1  |  Integrado al Lector PDF
// ============================================================

Views.Pizarra360 = {

    render() {
        setTimeout(() => {
            if (window.PizarraStudio && PizarraStudio.initInContainer) {
                PizarraStudio.initInContainer('pizarra-360-container');
            }
        }, 50);

        return `
            <div id="pizarra-360-container" style="position:relative; width:calc(100% + 48px); height:calc(100vh - 70px); margin:-24px -24px -24px -24px; overflow:hidden;"></div>
        `;
    },

    // ─── ESTADO GLOBAL DE SESIÓN ─────────────────────────────
    state: {
        activeTool: null,
        ruleta: { ronda: [], historial: [] },
        equipos: { lista: [] },
        timer: { totalSecs: 300, remaining: 300, running: false, interval: null },
        participacion: {},
        semaforo: 'verde'
    },

    _getStudents() {
        const course = Store.getActiveCourse();
        if (!course) return Store.data.estudiantes || [];
        return Store.getStudentsByCourse(course.id);
    },

    _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    },

    // ─── CONTROL DE LA VENTANA FLOTANTE ──────────────────────
    openFloatingTool(tool) {
        this.state.activeTool = tool;
        this._renderFloatingWindow();
    },

    
    closeTool() {
        if (this.state.timer.running) this.timerPause();
        this.state.activeTool = null;
        const fw = document.getElementById('p360-floating-window');
        if (fw) fw.remove();
    },

    minimizeTool() {
        const fw = document.getElementById('p360-floating-window');
        if (!fw) return;
        const content = fw.querySelector('.p360-fw-content');
        if (content) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                fw.style.width = fw.dataset.oldWidth || '320px';
                fw.style.height = 'auto';
            } else {
                fw.dataset.oldWidth = fw.style.width;
                content.style.display = 'none';
                fw.style.width = 'auto';
                fw.style.height = 'auto';
            }
        }
    },

    maximizeTool() {
        const fw = document.getElementById('p360-floating-window');
        if (!fw) return;
        const isMax = fw.dataset.maximized === 'true';
        if (isMax) {
            fw.style.width = fw.dataset.oldWidth || '320px';
            fw.style.height = fw.dataset.oldHeight || 'auto';
            fw.style.top = fw.dataset.oldTop || '80px';
            fw.style.left = fw.dataset.oldLeft || 'auto';
            fw.style.right = fw.dataset.oldRight || '40px';
            fw.dataset.maximized = 'false';
        } else {
            fw.dataset.oldWidth = fw.style.width;
            fw.dataset.oldHeight = fw.style.height;
            fw.dataset.oldTop = fw.style.top;
            fw.dataset.oldLeft = fw.style.left;
            fw.dataset.oldRight = fw.style.right;
            
            fw.style.width = '90vw';
            fw.style.height = '80vh';
            fw.style.top = '10vh';
            fw.style.left = '5vw';
            fw.style.right = 'auto';
            fw.dataset.maximized = 'true';
            
            const content = fw.querySelector('.p360-fw-content');
            if (content) content.style.display = 'block';
        }
    },


    reRender() {
        if (this.state.activeTool) {
            this._renderFloatingWindow();
        }
    },

    _getToolTitle(tool) {
        const titles = {
            ruleta:        '🎲 Ruleta',
            equipos:       '👥 Equipos',
            timer:         '⏱ Temporizador',
            participacion: '✋ Participación',
            dado:          '🎲 Dado',
            semaforo:      '🚦 Semáforo',
            libreta:       '📓 Libreta de Clase',
            dibujo:        '🎨 Lienzo de Dibujo'
        };
        return titles[tool] || tool;
    },

    _renderFloatingWindow() {
        let fw = document.getElementById('p360-floating-window');
        if (!fw) {
            fw = document.createElement('div');
            fw.id = 'p360-floating-window';
            fw.className = 'p360-floating-window';
            // Posición inicial por defecto
            fw.style.top = '80px';
            fw.style.right = '40px';
            document.body.appendChild(fw);
            this._setupDraggable(fw);
        }

        const contentHtml = this._getToolContent();

        fw.innerHTML = `
            <style>${this._css()}</style>
            <div class="p360-fw-header" id="p360-fw-header">
                <div class="p360-fw-header-top">
                    <div class="p360-fw-title">${this._getToolTitle(this.state.activeTool)}</div>
                    <div class="p360-fw-winbtns">
                        <button class="p360-wbtn p360-wbtn-min" onclick="Views.Pizarra360.minimizeTool()" title="Minimizar">
                            <svg width="10" height="2" viewBox="0 0 10 2"><path d="M1 1 H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                        </button>
                        <button class="p360-wbtn p360-wbtn-max" onclick="Views.Pizarra360.maximizeTool()" title="Maximizar">
                            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
                        </button>
                        <button class="p360-wbtn p360-wbtn-close" onclick="Views.Pizarra360.closeTool()" title="Cerrar">
                            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                        </button>
                    </div>
                </div>
                <div class="p360-fw-tools-row">
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='libreta'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('libreta')" title="Libreta">📓</button>
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='dibujo'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('dibujo')" title="Dibujo">🎨</button>
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='ruleta'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('ruleta')" title="Ruleta">🎡</button>
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='equipos'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('equipos')" title="Equipos">👥</button>
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='timer'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('timer')" title="Temporizador">⏱</button>
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='participacion'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('participacion')" title="Participación">✋</button>
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='dado'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('dado')" title="Dado">🎲</button>
                    <button class="p360-fw-icon-btn ${this.state.activeTool==='semaforo'?'active':''}" onclick="Views.Pizarra360.openFloatingTool('semaforo')" title="Semáforo">🚦</button>
                </div>
            </div>
            <div class="p360-fw-content">
                ${contentHtml}
            </div>
        `;

        if (this.state.activeTool === 'ruleta') {
            setTimeout(() => this._initRuleta(), 50);
        } else if (this.state.activeTool === 'dibujo') {
            setTimeout(() => this._initDibujo(), 50);
        }
    },

    _getToolContent() {
        const methods = {
            ruleta:        () => this._renderRuleta(),
            equipos:       () => this._renderEquipos(),
            timer:         () => this._renderTimer(),
            participacion: () => this._renderParticipacion(),
            dado:          () => this._renderDado(),
            semaforo:      () => this._renderSemaforo(),
            libreta:       () => this._renderLibreta(),
            dibujo:        () => this._renderDibujo()
        };
        return methods[this.state.activeTool] ? methods[this.state.activeTool]() : '<p>Error</p>';
    },

    _setupDraggable(el) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        el.addEventListener("mousedown", dragStart);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", drag);

        function dragStart(e) {
            const header = document.getElementById('p360-fw-header');
            if (e.target === header || header.contains(e.target) && e.target.tagName !== 'BUTTON') {
                const rect = el.getBoundingClientRect();
                xOffset = e.clientX - rect.left;
                yOffset = e.clientY - rect.top;
                isDragging = true;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - xOffset;
                currentY = e.clientY - yOffset;
                
                // Boundaries
                const maxX = window.innerWidth - el.offsetWidth;
                const maxY = window.innerHeight - el.offsetHeight;
                currentX = Math.min(Math.max(0, currentX), maxX);
                currentY = Math.min(Math.max(0, currentY), maxY);

                el.style.left = currentX + "px";
                el.style.top = currentY + "px";
                el.style.right = 'auto'; // Disable right anchoring once dragged
            }
        }
    },

    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 1 — RULETA
    // ══════════════════════════════════════════════════════
    _renderRuleta() {
        const students = this._getStudents();
        if (!students.length) return this._emptyState('No hay estudiantes en este curso.');

        const st = this.state.ruleta;
        if (!st.ronda.length) st.ronda = students.map(s => s.id);

        const remaining = st.ronda.length;
        const total = students.length;
        const lastId = st.historial[st.historial.length - 1];
        const lastName = lastId ? (students.find(s => s.id === lastId)?.nombreCompleto || '') : null;

        return `
        <div class="p360-spinner-area">
            <div class="p360-wheel-container">
                <div class="p360-wheel-pointer"></div>
                <canvas id="p360-wheel-canvas" width="220" height="220"></canvas>
            </div>
            ${lastName ? `<div class="p360-result-badge" id="p360-spin-result">${lastName}</div>` : '<div id="p360-spin-result" style="display:none"></div>'}
            <div style="text-align:center;font-size:12px;color:var(--text-muted,#64748b);" id="p360-ronda-counter">
                Quedan <strong style="color:var(--text-primary,#1e293b)">${remaining}</strong> de ${total}
            </div>
            <div class="p360-btn-row">
                <button class="p360-spin-btn" id="p360-spin-btn" onclick="Views.Pizarra360.ruletaSpin()">🎡 ¡Girar!</button>
                <button class="p360-btn p360-btn-ghost" onclick="Views.Pizarra360.ruletaUndo()" title="Deshacer último giro">↶</button>
                <button class="p360-btn p360-btn-ghost" onclick="Views.Pizarra360.ruletaReset()" title="Reiniciar ronda">↺</button>
            </div>
        </div>`;
    },

    _initRuleta() {
        const students = this._getStudents();
        const canvas = document.getElementById('p360-wheel-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = 220, R = W/2;
        const palette = ['#f43f5e','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#8b5cf6','#ec4899','#14b8a6','#3b82f6'];
        
        window._p360DrawWheel = function(angle) {
            const n = students.length;
            const arc = Math.PI*2/n;
            ctx.clearRect(0,0,W,W);
            students.forEach((s,i) => {
                const start = angle + i*arc;
                ctx.beginPath(); ctx.moveTo(R,R); ctx.arc(R,R,R-2,start,start+arc); ctx.closePath();
                ctx.fillStyle = palette[i%palette.length]; ctx.fill();
                ctx.save(); ctx.translate(R,R); ctx.rotate(start+arc/2);
                ctx.textAlign='right'; ctx.fillStyle='#fff';
                ctx.font = 'bold ' + Math.min(11, 150/n) + 'px system-ui';
                const label = s.nombreCompleto.split(' ')[0]; ctx.fillText(label.length>10?label.substring(0,9)+'…':label, R-10, 4);
                ctx.restore();
            });
            ctx.beginPath(); ctx.arc(R,R,18,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
            ctx.beginPath(); ctx.arc(R,R,10,0,Math.PI*2); ctx.fillStyle='#f43f5e'; ctx.fill();
        };
        window._p360WheelAngle = window._p360WheelAngle || 0;
        window._p360DrawWheel(window._p360WheelAngle);
    },

    ruletaSpin() {
        const students = this._getStudents();
        const st = this.state.ruleta;
        if (!st.ronda.length) { UI.toast('¡Ronda completada! Reiniciando...', 'info'); this.ruletaReset(); return; }
        const btn = document.getElementById('p360-spin-btn');
        if (btn) btn.disabled = true;
        const randomIdx = Math.floor(Math.random() * st.ronda.length);
        const chosenId = st.ronda[randomIdx];
        const startAngle = window._p360WheelAngle || 0;
        const spins = 4 + Math.random() * 3;
        const targetAngle = startAngle + spins * Math.PI * 2;
        const duration = 2500;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const angle = startAngle + (targetAngle - startAngle) * ease;
            window._p360WheelAngle = angle;
            if (window._p360DrawWheel) window._p360DrawWheel(angle);
            if (progress < 1) { requestAnimationFrame(animate); return; }
            st.ronda.splice(randomIdx, 1);
            st.historial.push(chosenId);
            const name = students.find(s => s.id === chosenId)?.nombreCompleto || '—';
            const badge = document.getElementById('p360-spin-result');
            if (badge) {
                badge.textContent = name;
                badge.style.display = 'block';
                badge.className = 'p360-result-badge';
                badge.style.animation = 'none';
                requestAnimationFrame(() => { badge.style.animation = 'p360-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)'; });
            }
            const counter = document.getElementById('p360-ronda-counter');
            if (counter) counter.innerHTML = `Quedan <strong style="color:var(--text-primary,#1e293b)">${st.ronda.length}</strong> de ${students.length}`;
            if (btn) btn.disabled = false;
        };
        requestAnimationFrame(animate);
    },

    
    ruletaUndo() {
        const st = this.state.ruleta;
        if (st.historial.length === 0) {
            UI.toast('No hay giros para deshacer', 'info');
            return;
        }
        const lastId = st.historial.pop();
        if (!st.ronda.includes(lastId)) {
            st.ronda.push(lastId);
        }
        this.reRender();
        UI.toast('Giro deshecho', 'success');
    },

    ruletaReset() {
        const students = this._getStudents();
        this.state.ruleta.ronda = students.map(s => s.id);
        this.state.ruleta.historial = [];
        window._p360WheelAngle = 0;
        this.reRender();
    },

    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 2 — EQUIPOS
    // ══════════════════════════════════════════════════════
    _renderEquipos() {
        const students = this._getStudents();
        if (!students.length) return this._emptyState('No hay estudiantes en este curso.');
        const equipos = this.state.equipos.lista;
        const total = students.length;
        const teamThemes = this._teamThemes;
        return `
        <div class="p360-eq-config" style="justify-content:center;gap:8px;">
            <input type="number" id="p360-eq-num" min="2" max="${Math.max(2,Math.floor(total/2))}" value="4" style="width:50px;padding:6px;border-radius:8px;border:1px solid #e2e8f0;text-align:center">
            <button class="p360-btn p360-btn-primary" onclick="Views.Pizarra360.equiposByNum()">Grupos</button>
            <span style="color:#94a3b8">|</span>
            <input type="number" id="p360-eq-size" min="1" max="${total}" value="3" style="width:50px;padding:6px;border-radius:8px;border:1px solid #e2e8f0;text-align:center">
            <button class="p360-btn" style="background:rgba(139,92,246,0.12);color:#8b5cf6" onclick="Views.Pizarra360.equiposBySize()">Integ.</button>
        </div>
        ${equipos.length ? `
        <div class="p360-eq-cards">
            ${equipos.map((eq,i) => {
                const theme = teamThemes[i % teamThemes.length];
                const members = eq.integrantes;
                return `
                <div class="p360-eq-card-v2" style="border-top:4px solid ${theme.color};background:linear-gradient(135deg,${theme.bg1},${theme.bg2});">
                    <div class="p360-eq-card-header" style="background:${theme.color}18;">
                        <span class="p360-eq-avatar" style="color:${theme.color}">${theme.avatar}</span>
                        <div>
                            <div class="p360-eq-card-name" style="color:${theme.color}">T${i+1}: ${eq.nombre}</div>
                            <div class="p360-eq-card-count">${members.length} integrante${members.length!==1?'s':''}</div>
                        </div>
                    </div>
                    <div class="p360-eq-members-grid">
                        ${members.map(n => {
                            const parts = n.trim().split(' ');
                            const initials = (parts[0]?.[0]||'') + (parts[1]?.[0]||'');
                            const firstName = parts[0] || n;
                            return `<div class="p360-eq-member-chip" style="border-color:${theme.color}33;background:${theme.color}0d;">
                                <span class="p360-eq-chip-init" style="background:${theme.color};color:#fff">${initials.toUpperCase()}</span>
                                <span class="p360-eq-chip-name">${firstName}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>` : `<div class="p360-empty"><p style="font-size:13px;color:#64748b;margin:0">Configura y presiona un botón</p></div>`}`;
    },

    _teamThemes: [
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', color:'#ef4444', bg1:'#fff5f5', bg2:'#fee2e2' }, // Escudo
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', color:'#3b82f6', bg1:'#eff6ff', bg2:'#dbeafe' }, // Rayo
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', color:'#10b981', bg1:'#f0fdf4', bg2:'#d1fae5' }, // Estrella
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>', color:'#f59e0b', bg1:'#fffbeb', bg2:'#fef3c7' }, // Triángulo/Delta
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/></svg>', color:'#8b5cf6', bg1:'#f5f3ff', bg2:'#ede9fe' }, // Diamante
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>', color:'#0ea5e9', bg1:'#f0f9ff', bg2:'#e0f2fe' }, // Hexágono
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>', color:'#06b6d4', bg1:'#ecfeff', bg2:'#cffafe' }, // Brújula
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>', color:'#f97316', bg1:'#fff7ed', bg2:'#ffedd5' }, // Diana
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 22l10-10"/></svg>', color:'#6366f1', bg1:'#eef2ff', bg2:'#e0e7ff' }, // Hoja
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="2 20 22 20 20 8 16 13 12 4 8 13 4 8 2 20"/></svg>', color:'#64748b', bg1:'#f8fafc', bg2:'#f1f5f9' }, // Corona
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>', color:'#14b8a6', bg1:'#f0fdfa', bg2:'#ccfbf1' }, // Cohete
        { avatar:'<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>', color:'#dc2626', bg1:'#fef2f2', bg2:'#fee2e2' }, // Llama
    ],

    _teamNames: ['Alfa','Beta','Gamma','Delta','Épsilon','Zeta','Eta','Theta','Iota','Kappa','Lambda','Mu'],

    equiposByNum() {
        const students = this._getStudents();
        const n = Math.max(2, Math.min(parseInt(document.getElementById('p360-eq-num')?.value||'4'), Math.floor(students.length/2)));
        const shuffled = this._shuffle(students);
        const equipos = Array.from({length:n}, (_,i) => ({ nombre: this._teamNames[i]||`T${i+1}`, integrantes:[] }));
        shuffled.forEach((s,i) => equipos[i%n].integrantes.push(s.nombreCompleto));
        this.state.equipos.lista = equipos;
        this.reRender();
    },

    equiposBySize() {
        const students = this._getStudents();
        const size = Math.max(1, Math.min(parseInt(document.getElementById('p360-eq-size')?.value||'3'), students.length));
        const shuffled = this._shuffle(students);
        const equipos = [];
        for (let i = 0; i < shuffled.length; i+=size)
            equipos.push({ nombre: this._teamNames[equipos.length]||`T${equipos.length+1}`, integrantes: shuffled.slice(i,i+size).map(s=>s.nombreCompleto) });
        this.state.equipos.lista = equipos;
        this.reRender();
    },


    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 3 — TEMPORIZADOR
    // ══════════════════════════════════════════════════════
    _renderTimer() {
        const t = this.state.timer;
        const mins = Math.floor(t.remaining/60);
        const secs = t.remaining%60;
        const pct = t.totalSecs>0 ? t.remaining/t.totalSecs : 1;
        const CIRCUM = 2*Math.PI*50;
        const offset = CIRCUM*(1-pct);
        const ringColor = pct>0.5 ? '#10b981' : pct>0.2 ? '#f59e0b' : '#ef4444';
        const numColor  = pct>0.5 ? '#ffffff' : pct>0.2 ? '#f59e0b' : '#ef4444';
        const glowColor = pct>0.5 ? 'rgba(16,185,129,0.35)' : pct>0.2 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)';
        return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;">
                <svg width="130" height="130" style="transform:rotate(-90deg);filter:drop-shadow(0 0 8px ${glowColor})">
                    <circle cx="65" cy="65" r="50" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="9"/>
                    <circle id="p360-ring-circle" cx="65" cy="65" r="50" fill="none"
                        stroke="${ringColor}" stroke-width="9" stroke-linecap="round"
                        stroke-dasharray="${CIRCUM}" stroke-dashoffset="${offset}"
                        style="transition:stroke-dashoffset 0.9s linear,stroke 0.6s ease,filter 0.6s ease"/>
                </svg>
                <div style="position:absolute;display:flex;flex-direction:column;align-items:center;">
                    <div id="p360-timer-display" style="font-size:34px;font-weight:900;letter-spacing:-1px;font-variant-numeric:tabular-nums;color:${numColor};transition:color 0.6s;text-shadow:0 0 16px ${glowColor}">${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div>
                </div>
            </div>
            ${!t.running ? `
            <div style="display:flex;gap:8px">
                <button class="p360-btn" onclick="Views.Pizarra360.timerAdd(60)">+1m</button>
                <button class="p360-btn" onclick="Views.Pizarra360.timerAdd(-60)">-1m</button>
            </div>` : ''}
            <div class="p360-btn-row">
                ${!t.running?`<button class="p360-btn p360-btn-primary" onclick="Views.Pizarra360.timerStart()">▶</button>`:''}
                ${t.running?`<button class="p360-btn p360-btn-ghost" onclick="Views.Pizarra360.timerPause()">⏸</button>`:''}
                <button class="p360-btn p360-btn-ghost" onclick="Views.Pizarra360.timerReset()">↺</button>
                <button class="p360-btn p360-btn-fullscreen" onclick="Views.Pizarra360.timerFullscreen()">⛶</button>
            </div>
        </div>`;
    },

    timerAdd(secs) {
        const t = this.state.timer;
        t.totalSecs = Math.max(10, t.totalSecs + secs);
        t.remaining = t.totalSecs;
        this.reRender();
    },

    timerStart() {
        const t = this.state.timer;
        if (t.remaining===0) t.remaining=t.totalSecs;
        if (t.running) return;
        t.running = true;
        t.interval = setInterval(() => {
            t.remaining = Math.max(0, t.remaining-1);
            this._timerTick();
            if (t.remaining===0) { clearInterval(t.interval); t.running=false; this.reRender(); }
        }, 1000);
        this.reRender();
    },

    timerPause() {
        const t = this.state.timer;
        clearInterval(t.interval); t.running=false;
        this.reRender();
    },

    timerReset() {
        const t = this.state.timer;
        clearInterval(t.interval); t.running=false; t.remaining=t.totalSecs;
        this.reRender();
    },

    _timerTick() {
        const t = this.state.timer;
        const el = document.getElementById('p360-timer-display');
        const ring = document.getElementById('p360-ring-circle');
        if (!el) return;
        const mins = Math.floor(t.remaining/60), secs = t.remaining%60;
        el.textContent = String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');
        const pct = t.totalSecs>0 ? t.remaining/t.totalSecs : 0;
        const CIRCUM = 2*Math.PI*50;
        const ringColor = pct>0.5 ? '#10b981' : pct>0.2 ? '#f59e0b' : '#ef4444';
        const glowColor = pct>0.5 ? 'rgba(16,185,129,0.35)' : pct>0.2 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)';
        el.style.color = ringColor;
        el.style.textShadow = `0 0 16px ${glowColor}`;
        if (ring) {
            ring.style.strokeDashoffset = CIRCUM*(1-pct);
            ring.style.stroke = ringColor;
            const svg = ring.closest('svg');
            if (svg) svg.style.filter = `drop-shadow(0 0 8px ${glowColor})`;
        }
    },

    timerFullscreen() {
        const t = this.state.timer;
        const mins = Math.floor(t.remaining/60), secs = t.remaining%60;
        const w = window.open('','_blank','width=800,height=600');
        w.document.write(`<!DOCTYPE html><html><head><title>Temporizador 360</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;overflow:hidden}.ring-wrap{position:relative;display:flex;align-items:center;justify-content:center;width:min(80vw,80vh,500px);height:min(80vw,80vh,500px)}.ring-svg{position:absolute;top:0;left:0;width:100%;height:100%;transform:rotate(-90deg)}.ring-bg{fill:none;stroke:rgba(255,255,255,0.07);stroke-width:10}.ring-fg{fill:none;stroke:#10b981;stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset 0.8s linear,stroke 0.8s ease}.inner{display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:1}#d{font-size:clamp(48px,14vw,130px);font-weight:900;color:#fff;letter-spacing:-3px;font-variant-numeric:tabular-nums;line-height:1;transition:color 0.8s}#d.warn{color:#f59e0b}#d.danger{color:#ef4444;animation:blink 0.6s ease-in-out infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}.label{font-size:clamp(10px,2vw,14px);color:rgba(255,255,255,0.3);font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:6px}.done-msg{color:#ef4444;font-size:clamp(14px,3vw,24px);font-weight:800;margin-top:16px;text-align:center;animation:blink 0.6s ease-in-out infinite}.btns{display:flex;gap:10px;margin-top:clamp(16px,3vh,28px);flex-wrap:wrap;justify-content:center}.btn{padding:clamp(8px,1.5vw,12px) clamp(14px,2.5vw,22px);border:none;border-radius:12px;font-size:clamp(12px,1.8vw,15px);font-weight:700;cursor:pointer;background:rgba(255,255,255,0.1);color:#fff;transition:all 0.15s;touch-action:manipulation;border:1px solid rgba(255,255,255,0.1)}.btn:hover{transform:scale(1.06);background:rgba(255,255,255,0.18)}.btn-close{background:#ef4444;position:fixed;bottom:20px;right:20px;font-size:clamp(13px,2vw,15px);padding:clamp(10px,2vw,13px) clamp(16px,3vw,24px);border-radius:14px;box-shadow:0 4px 20px rgba(239,68,68,0.5);border:none;color:#fff;font-weight:700;cursor:pointer;touch-action:manipulation}</style></head><body><div class=ring-wrap><svg class=ring-svg viewBox="0 0 200 200"><circle class=ring-bg cx=100 cy=100 r=92/><circle class=ring-fg id=ring cx=100 cy=100 r=92/></svg><div class=inner><div id=d>${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div><div class=label>Temporizador</div></div></div><div class=btns><div class=btn onclick=startTimer()>▶ Iniciar</div><div class=btn onclick=pauseTimer()>⏸ Pausar</div><div class=btn onclick=resetTimer()>↺ Reiniciar</div></div><button class=btn-close onclick=window.close()>✖ Cerrar</button><script>let rem=${t.remaining},total=${t.totalSecs},iv=null;const el=document.getElementById('d'),ring=document.getElementById('ring');const CIRCUM=2*Math.PI*92;ring.style.strokeDasharray=CIRCUM;function fmt(n){return String(n).padStart(2,'0');}function updateRing(){const pct=total>0?rem/total:0;ring.style.strokeDashoffset=CIRCUM*(1-pct);const color=pct>0.5?'#10b981':pct>0.2?'#f59e0b':'#ef4444';ring.style.stroke=color;el.className=pct>0.5?'':pct>0.2?'warn':'danger';}function tick(){rem=Math.max(0,rem-1);el.textContent=fmt(Math.floor(rem/60))+':'+fmt(rem%60);updateRing();if(rem===0){clearInterval(iv);iv=null;document.body.insertAdjacentHTML('beforeend','<p class=done-msg>🔔 ¡Tiempo finalizado!</p>');}}function startTimer(){if(iv||rem===0)return;iv=setInterval(tick,1000);}function pauseTimer(){clearInterval(iv);iv=null;}function resetTimer(){clearInterval(iv);iv=null;rem=total;el.textContent=fmt(Math.floor(rem/60))+':'+fmt(rem%60);el.className='';updateRing();}updateRing();<\/script></body></html>`);
    },

    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 4 — PARTICIPACIÓN
    // ══════════════════════════════════════════════════════
    _renderParticipacion() {
        const students = this._getStudents();
        if (!students.length) return this._emptyState('No hay estudiantes en este curso.');
        const p = this.state.participacion;
        const sorted = [...students].sort((a,b)=>(p[b.id]||0)-(p[a.id]||0));
        return `
        <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
            <button class="p360-btn p360-btn-danger" style="padding:4px 8px;font-size:11px" onclick="Views.Pizarra360.participacionClear()">Limpiar</button>
        </div>
        <div class="p360-part-list">
            ${sorted.map(s => {
                const count = p[s.id]||0;
                return `<div class="p360-part-row" id="prow-${s.id}">
                    <span class="p360-part-name">${s.nombreCompleto.split(' ')[0]} ${s.nombreCompleto.split(' ')[1]||''}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="p360-part-count${count>0?' highlight':''}" id="pcount-${s.id}">${count}</span>
                        <button class="p360-part-btn" onclick="Views.Pizarra360.participacionMark('${s.id}')">+</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    },

    participacionMark(id) {
        this.state.participacion[id] = (this.state.participacion[id]||0)+1;
        const el = document.getElementById('pcount-'+id);
        if (el) {
            el.textContent = this.state.participacion[id];
            el.classList.add('highlight');
            el.style.animation='none';
            requestAnimationFrame(()=>{ el.style.animation='p360-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)'; });
        }
    },

    participacionClear() {
        this.state.participacion={};
        this.reRender();
    },

    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 5 — DADO VIRTUAL
    // ══════════════════════════════════════════════════════
    _dadoFaces: 6,
    _dadoResult: null,
    _dadoRolling: false,

    _renderDado() {
        const faces = this._dadoFaces;
        const result = this._dadoResult;
        return `
        <div class="p360-dice-area">
            <div class="p360-dice-selector">
                ${[6,10,20].map(f=>`<div class="p360-dice-face${faces===f?' active':''}" onclick="Views.Pizarra360.dadoSetFaces(${f})">d${f}</div>`).join('')}
            </div>
            <div class="p360-dice-result" id="p360-dice-result" style="font-size:${result!==null?'80px':'50px'};color:${result!==null?'var(--text-primary,#1e293b)':'#94a3b8'}">${result!==null?result:'?'}</div>
            <button class="p360-roll-btn" id="p360-roll-btn" onclick="Views.Pizarra360.dadoRoll()">🎲 Lanzar</button>
        </div>`;
    },

    dadoSetFaces(n) { this._dadoFaces=n; this._dadoResult=null; this.reRender(); },

    dadoRoll() {
        if (this._dadoRolling) return;
        this._dadoRolling=true;
        const btn=document.getElementById('p360-roll-btn');
        if(btn) btn.disabled=true;
        const el=document.getElementById('p360-dice-result');
        const faces=this._dadoFaces;
        let ticks=0;
        const iv=setInterval(()=>{
            ticks++;
            if(el){ el.textContent=Math.floor(Math.random()*faces)+1; el.style.fontSize='65px'; }
            if(ticks>=20){
                clearInterval(iv);
                const final=Math.floor(Math.random()*faces)+1;
                this._dadoResult=final;
                this._dadoRolling=false;
                if(el){
                    el.textContent=final;
                    el.style.fontSize='80px';
                    el.style.color='var(--text-primary,#1e293b)';
                    el.style.animation='none';
                    requestAnimationFrame(()=>{ el.style.animation='p360-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)'; });
                }
                if(btn) btn.disabled=false;
            }
        },55);
    },

    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 6 — SEMÁFORO
    // ══════════════════════════════════════════════════════
    _renderSemaforo() {
        const e = this.state.semaforo;
        const labels={verde:'✅ Continúen',amarillo:'⚠️ ¡Atención!',rojo:'🔴 Silencio'};
        const cls={verde:'semaforo-verde',amarillo:'semaforo-amarillo',rojo:'semaforo-rojo'};
        return `
        <div class="p360-semaforo-wrap">
            <div class="p360-semaforo-housing">
                <div class="p360-semaforo-light s-red${e==='rojo'?' active':''}"    onclick="Views.Pizarra360.semaforoSet('rojo')"></div>
                <div class="p360-semaforo-light s-yellow${e==='amarillo'?' active':''}" onclick="Views.Pizarra360.semaforoSet('amarillo')"></div>
                <div class="p360-semaforo-light s-green${e==='verde'?' active':''}"   onclick="Views.Pizarra360.semaforoSet('verde')"></div>
            </div>
            <div class="p360-semaforo-label ${cls[e]}" id="p360-sem-label">${labels[e]}</div>
            <button class="p360-btn p360-btn-fullscreen" onclick="Views.Pizarra360.semaforoFullscreen()">⛶ Expandir</button>
        </div>`;
    },

    semaforoSet(estado) {
        this.state.semaforo=estado;
        document.querySelectorAll('.p360-semaforo-light').forEach(l=>{
            l.classList.remove('active');
            if((estado==='rojo'&&l.classList.contains('s-red'))||(estado==='amarillo'&&l.classList.contains('s-yellow'))||(estado==='verde'&&l.classList.contains('s-green'))) l.classList.add('active');
        });
        const labels={verde:'✅ Continúen',amarillo:'⚠️ ¡Atención!',rojo:'🔴 Silencio'};
        const cls={verde:'semaforo-verde',amarillo:'semaforo-amarillo',rojo:'semaforo-rojo'};
        const lbl=document.getElementById('p360-sem-label');
        if(lbl){ lbl.className='p360-semaforo-label '+cls[estado]; lbl.textContent=labels[estado]; }
    },

    semaforoFullscreen() {
        const e=this.state.semaforo;
        const w=window.open('','_blank','width=800,height=600');
        w.document.write(`<!DOCTYPE html><html><head><title>Semáforo 360</title><style>*{box-sizing:border-box}body{margin:0;background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:system-ui;transition:background 0.4s}.housing{background:#1a1a1a;border-radius:40px;padding:24px;display:flex;flex-direction:column;gap:16px;box-shadow:0 20px 60px rgba(0,0,0,0.6)}.light{width:110px;height:110px;border-radius:50%;cursor:pointer;box-shadow:inset 0 4px 16px rgba(0,0,0,0.6);transition:all 0.3s}.label{font-size:44px;font-weight:900;margin-top:20px;transition:color 0.3s}.btns{display:flex;gap:12px;margin-top:16px}.btn{padding:12px 22px;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.15s}@keyframes semaforoBlink{0%,100%{opacity:1}50%{opacity:0.2}}.light.active{animation:semaforoBlink 1s ease-in-out infinite}</style></head><body><div class=housing><div class=light id=r onclick="set('rojo')"></div><div class=light id=y onclick="set('amarillo')"></div><div class=light id=g onclick="set('verde')"></div></div><div class=label id=lbl></div><div class=btns><div class=btn style="background:rgba(239,68,68,0.2);color:#ef4444" onclick="set('rojo')">⛔ Silencio</div><div class=btn style="background:rgba(245,158,11,0.2);color:#f59e0b" onclick="set('amarillo')">⚠️ Atención</div><div class=btn style="background:rgba(34,197,94,0.2);color:#22c55e" onclick="set('verde')">✅ Continuar</div><div class=btn style="background:rgba(255,255,255,0.1);color:#fff" onclick="window.close()">✖ Regresar</div></div><script>const C={verde:'#16a34a',amarillo:'#d97706',rojo:'#dc2626'};const L={verde:'✅ CONTINÚEN',amarillo:'⚠️ ATENCIÓN',rojo:'⛔ SILENCIO'};function set(e){document.body.style.background=C[e]+'18';document.getElementById('r').style.background=e==='rojo'?'radial-gradient(circle at 40% 35%,#ff6b6b,#ef4444 50%,#b91c1c)':'#2a0a0a';document.getElementById('y').style.background=e==='amarillo'?'radial-gradient(circle at 40% 35%,#fde68a,#f59e0b 50%,#b45309)':'#1a1200';document.getElementById('g').style.background=e==='verde'?'radial-gradient(circle at 40% 35%,#86efac,#22c55e 50%,#15803d)':'#0a1a0a';document.getElementById('r').className='light'+(e==='rojo'?' active':'');document.getElementById('y').className='light'+(e==='amarillo'?' active':'');document.getElementById('g').className='light'+(e==='verde'?' active':'');const lbl=document.getElementById('lbl');lbl.style.color=C[e];lbl.textContent=L[e];}set('${e}');<\/script></body></html>`);
    },

    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 7 — CAPTURA
    // ══════════════════════════════════════════════════════
    

    limpiarTexto() {
        const ta = document.getElementById('p360-texto-area');
        if (ta) ta.value = '';
    },

    copiarTexto() {
        const ta = document.getElementById('p360-texto-area');
        if (ta && ta.value) {
            navigator.clipboard.writeText(ta.value).then(() => {
                UI.toast('Texto copiado al portapapeles.', 'success');
            }).catch(() => {
                UI.toast('Error al copiar el texto.', 'error');
            });
        } else {
            UI.toast('No hay texto para copiar.', 'info');
        }
    },

    // ══════════════════════════════════════════════════════
    //  HELPER — EMPTY STATE
    // ══════════════════════════════════════════════════════
    _emptyState(msg) {
        return `<div class="p360-empty"><div class="p360-empty-icon">📋</div><p class="p360-empty-text">${msg}</p></div>`;
    },

    // ══════════════════════════════════════════════════════    // 🌟
    //  HERRAMIENTA 7 - LIBRETA DE CLASE
    // 🌟
    _renderLibreta() {
        const activeCourse = typeof Store !== 'undefined' ? Store.getActiveCourse() : null;
        const courseId = activeCourse ? activeCourse.id : 'global';
        const bookId = (window.Libreria && window.Libreria.state && window.Libreria.state.libroActual) ? window.Libreria.state.libroActual.id : 'default';
        const pageNum = (window.Libreria && window.Libreria.state) ? window.Libreria.state.pageNum : '?';

        // Intentar recuperar de la base de datos
        const noteId = `global_book_${bookId}_course_${courseId}`;
        let objText = '';
        let avisosText = '';
        let notesText = '';
        let aluText = '';
        let hwText = '';
        
        const cached = localStorage.getItem('p360_libreta_' + noteId);
        if (cached) {
            try {
                const p = JSON.parse(cached);
                objText = p.obj || '';
                avisosText = p.avisos || '';
                notesText = p.notes || '';
                aluText = p.alu || '';
                hwText = p.hw || '';
            } catch(e){}
        }

        setTimeout(async () => {
            if (window.Store && window.Store.db) {
                const n = await window.Store.db.getGeneric('teacher_global_notes', noteId);
                if (n && document.getElementById('p360-libreta-notes')) {
                    if(!cached) {
                        document.getElementById('p360-libreta-obj').value = n.obj || '';
                        document.getElementById('p360-libreta-avisos').value = n.avisos || '';
                        document.getElementById('p360-libreta-notes').value = n.notes || '';
                        document.getElementById('p360-libreta-alu').value = n.alu || '';
                        document.getElementById('p360-libreta-hw').value = n.hw || '';
                    }
                }
            }
        }, 100);

        this.state.currentLibretaSlide = 0;

        return `
        <div class="p360-libreta-wrap" style="padding:12px; display:flex; flex-direction:column; gap:10px; flex:1; overflow:hidden;">
            <div style="font-size:12px; color:#64748b; font-weight:600; display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span>Curso Activo: ${activeCourse ? activeCourse.grado + ' ' + activeCourse.seccion : 'Global'}</span>
                <span>Página Actual: <strong style="color:#0f172a">${pageNum}</strong></span>
            </div>

            <!-- Progress Dots -->
            <div style="display:flex; justify-content:center; gap:6px; margin-bottom:4px;">
                <div class="p360-dot active" id="p360-dot-0"></div>
                <div class="p360-dot" id="p360-dot-1"></div>
                <div class="p360-dot" id="p360-dot-2"></div>
                <div class="p360-dot" id="p360-dot-3"></div>
                <div class="p360-dot" id="p360-dot-4" style="background:#fbbf24;"></div>
            </div>

            <!-- Carousel Track -->
            <div style="flex:1; overflow:hidden; position:relative; min-height:180px;">
                <div id="p360-carousel-track" style="display:flex; height:100%; width:500%; transition:transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);">
                    
                    <!-- Slide 0: Plan -->
                    <div class="p360-slide" style="width:20%; display:flex; flex-direction:column; gap:8px; padding:0 4px; overflow-y:auto;">
                        <h4 style="margin:0; font-size:14px; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:4px; display:flex; align-items:center; gap:6px;">🎯 <span>Planificación</span></h4>
                        <label style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:-4px;">Objetivo de Hoy</label>
                        <input type="text" id="p360-libreta-obj" style="width:100%; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font-family:inherit; font-size:13px;" value="${objText}" oninput="Views.Pizarra360.saveLibreta('${noteId}')" placeholder="Ej: Que los alumnos comprendan las fracciones..." />

                        <label style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:-4px; margin-top:4px;">Avisos / Recordatorios</label>
                        <textarea id="p360-libreta-avisos" style="width:100%; flex:1; min-height:60px; resize:vertical; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-family:inherit; font-size:13px;" oninput="Views.Pizarra360.saveLibreta('${noteId}')" placeholder="Ej: Traer cartulina el viernes">${avisosText}</textarea>
                    </div>

                    <!-- Slide 1: Notas -->
                    <div class="p360-slide" style="width:20%; display:flex; flex-direction:column; gap:8px; padding:0 4px; overflow-y:auto;">
                        <h4 style="margin:0; font-size:14px; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:4px; display:flex; align-items:center; gap:6px;">📝 <span>Desarrollo de Clase</span></h4>
                        <textarea id="p360-libreta-notes" style="width:100%; flex:1; min-height:80px; resize:vertical; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-family:inherit; font-size:13px;" oninput="Views.Pizarra360.saveLibreta('${noteId}')" placeholder="Notas de clase o extracción de texto...">${notesText}</textarea>
                        <button class="p360-btn p360-btn-primary" style="margin-top:2px; flex-shrink:0; background:linear-gradient(135deg,#6366f1,#8b5cf6);" onclick="Views.Pizarra360.extractTextToLibreta(event)" title="Extraer texto de página">
                            ✨ Extraer Texto de Página
                        </button>
                    </div>

                    <!-- Slide 2: Alumnos -->
                    <div class="p360-slide" style="width:20%; display:flex; flex-direction:column; gap:8px; padding:0 4px; overflow-y:auto;">
                        <h4 style="margin:0; font-size:14px; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:4px; display:flex; align-items:center; gap:6px;">👥 <span>Seguimiento de Alumnos</span></h4>
                        <textarea id="p360-libreta-alu" style="width:100%; flex:1; min-height:80px; resize:vertical; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-family:inherit; font-size:13px;" oninput="Views.Pizarra360.saveLibreta('${noteId}')" placeholder="Ej: +Juan, -Pedro, Ana faltó">${aluText}</textarea>
                    </div>

                    <!-- Slide 3: Tareas -->
                    <div class="p360-slide" style="width:20%; display:flex; flex-direction:column; gap:8px; padding:0 4px; overflow-y:auto;">
                        <h4 style="margin:0; font-size:14px; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:4px; display:flex; align-items:center; gap:6px;">📚 <span>Asignaciones / Tareas</span></h4>
                        <textarea id="p360-libreta-hw" style="width:100%; flex:1; min-height:80px; resize:vertical; padding:8px; border:1px solid #cbd5e1; border-radius:6px; font-family:inherit; font-size:13px;" oninput="Views.Pizarra360.saveLibreta('${noteId}')" placeholder="Escribe la tarea aquí...">${hwText}</textarea>
                    </div>

                    <!-- Slide 4: Asistente IA -->
                    <div class="p360-slide" style="width:20%; display:flex; flex-direction:column; gap:8px; padding:0 4px; overflow-y:auto; position:relative;">
                        <h4 style="margin:0; font-size:14px; color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:6px;">🪄 <span style="color:#b45309;">Asistente IA</span></div>
                            <button onclick="Views.Pizarra360.toggleAIHistory()" style="background:transparent; border:none; color:#3b82f6; cursor:pointer; font-size:12px; font-weight:600;">Historial</button>
                        </h4>
                        
                        <div style="font-size:12px; font-weight:700; color:#1e293b; margin-bottom:-4px;">Selección activa:</div>
                        <div id="p360-ai-selection" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px; padding:6px; font-size:11px; font-style:italic; color:#64748b; min-height:30px; max-height:60px; overflow-y:auto; word-break:break-word;">
                            Selecciona un texto del libro para trabajar con IA.
                        </div>

                        <div style="font-size:12px; font-weight:700; color:#1e293b; margin-top:2px; margin-bottom:-4px;">Acción:</div>
                        <select id="p360-ai-action-category" style="padding:4px; border-radius:6px; font-size:12px; border:1px solid #cbd5e1; background:#f8fafc; cursor:pointer;" onchange="Views.Pizarra360.renderAIActions(this.value)">
                            <option value="comprension">Comprensión lectora</option>
                            <option value="ensenanza">Enseñanza</option>
                            <option value="evaluacion">Evaluación</option>
                            <option value="actividades">Actividades</option>
                            <option value="transformacion">Transformación del texto</option>
                        </select>
                        
                        <div id="p360-ai-actions-container" style="display:flex; flex-wrap:wrap; gap:4px;"></div>

                        <div style="font-size:12px; font-weight:700; color:#1e293b; margin-top:4px; margin-bottom:-4px; display:flex; justify-content:space-between; align-items:center;">
                            <span>Resultado IA:</span>
                            <button onclick="Views.Pizarra360.copyAIResult()" style="background:transparent; border:none; cursor:pointer; font-size:12px;" title="Copiar">📋</button>
                        </div>
                        <div id="p360-ai-result" style="flex:1; min-height:80px; background:#fff; border:1px solid #fde68a; border-radius:6px; padding:6px; font-size:11px; color:#0f172a; overflow-y:auto; word-break:break-word;">
                            Aquí aparecerá la respuesta de Gemini...
                        </div>
                        <div id="p360-ai-history-panel" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:#f8fafc; z-index:10; flex-direction:column; padding:4px;">
                            <h4 style="margin:0; font-size:14px; border-bottom:2px solid #e2e8f0; padding-bottom:4px; display:flex; justify-content:space-between;">
                                📜 Historial IA
                                <button onclick="Views.Pizarra360.toggleAIHistory()" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:12px;">Cerrar</button>
                            </h4>
                            <div id="p360-ai-history-list" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; margin-top:8px;"></div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Navigation Buttons -->
            <div style="display:flex; gap:8px; margin-top:4px;">
                <button class="p360-btn p360-btn-ghost" style="flex:1;" id="p360-btn-prev" onclick="Views.Pizarra360.goToLibretaSlide(-1)" disabled>
                    ❮ Anterior
                </button>
                <button class="p360-btn p360-btn-primary" style="flex:1; background:linear-gradient(135deg,#3b82f6,#2563eb);" id="p360-btn-next" onclick="Views.Pizarra360.goToLibretaSlide(1)">
                    Siguiente ❯
                </button>
            </div>

            <!-- Universal Buttons -->
            <div style="display:flex; gap:8px; margin-top:6px; flex-shrink:0; border-top:1px solid #e2e8f0; padding-top:12px;">
                <button class="p360-btn p360-btn-ghost" style="flex:1;" onclick="Views.Pizarra360.copyLibreta(event)" title="Copiar todo al portapapeles">
                    📋 Copiar
                </button>
                <button class="p360-btn p360-btn-danger" style="flex:1;" onclick="Views.Pizarra360.clearLibreta('${noteId}')" title="Limpiar libreta">
                    🗑️ Limpiar
                </button>
                <button class="p360-btn p360-btn-primary" style="flex:1; background:linear-gradient(135deg,#10b981,#059669);" onclick="Views.Pizarra360.pauseAndCloseClass('${noteId}')" title="Guarda y cierra la sesión de lectura">
                    ⏸️ Pausar Clase
                </button>
            </div>
        </div>`;
    },

    saveLibreta(noteId) {
        const obj = document.getElementById('p360-libreta-obj') ? document.getElementById('p360-libreta-obj').value : '';
        const avisos = document.getElementById('p360-libreta-avisos') ? document.getElementById('p360-libreta-avisos').value : '';
        const notes = document.getElementById('p360-libreta-notes') ? document.getElementById('p360-libreta-notes').value : '';
        const alu = document.getElementById('p360-libreta-alu') ? document.getElementById('p360-libreta-alu').value : '';
        const hw = document.getElementById('p360-libreta-hw') ? document.getElementById('p360-libreta-hw').value : '';

        const data = { obj, avisos, notes, alu, hw, updated: Date.now() };
        localStorage.setItem('p360_libreta_' + noteId, JSON.stringify(data));
        
        if (this._libretaTimeout) clearTimeout(this._libretaTimeout);
        this._libretaTimeout = setTimeout(() => {
            if (window.Store && window.Store.db) {
                window.Store.db.setGeneric('teacher_global_notes', noteId, data);
            }
        }, 1000);
    },

    async extractTextToLibreta(event) {
        if (window.Libreria) {
            const btn = event.currentTarget;
            btn.innerHTML = '⏳ Extrayendo...';
            try {
                const pageNum = window.Libreria.state.pageNum;
                let text = '';
                if(window.Libreria.extractTextFromPage) {
                   text = await window.Libreria.extractTextFromPage(pageNum);
                }
                
                // Fallback a IA si no hay texto (PDF escaneado)
                if ((!text || !text.trim()) && window.Libreria.extractImageTextFromCanvas) {
                    text = await window.Libreria.extractImageTextFromCanvas(pageNum);
                }

                if (text && text.trim()) {
                    const txtArea = document.getElementById('p360-libreta-notes');
                    txtArea.value += (txtArea.value ? '\n\n' : '') + '--- TEXTO PÁG ' + pageNum + ' ---\n' + text.trim();
                    const activeCourse = typeof Store !== 'undefined' ? Store.getActiveCourse() : null;
                    const courseId = activeCourse ? activeCourse.id : 'global';
                    const bookId = window.Libreria.state.libroActual.id;
                    this.saveLibreta(`global_book_${bookId}_course_${courseId}`);
                    btn.innerHTML = '✅ ¡Extraído!';
                } else {
                    btn.innerHTML = '⚠️ PDF Escaneado (Sin texto)';
                }
            } catch(e) {
                btn.innerHTML = '❌ Error';
            }
            setTimeout(() => { btn.innerHTML = '✨ Extraer'; }, 2500);
        }
    },

    clearLibreta(noteId) {
        if (confirm("¿Estás seguro de borrar todos los datos de este curso (Objetivo, Avisos, Notas, Alumnos y Tareas)?")) {
            if(document.getElementById('p360-libreta-obj')) document.getElementById('p360-libreta-obj').value = '';
            if(document.getElementById('p360-libreta-avisos')) document.getElementById('p360-libreta-avisos').value = '';
            if(document.getElementById('p360-libreta-notes')) document.getElementById('p360-libreta-notes').value = '';
            if(document.getElementById('p360-libreta-alu')) document.getElementById('p360-libreta-alu').value = '';
            if(document.getElementById('p360-libreta-hw')) document.getElementById('p360-libreta-hw').value = '';
            this.saveLibreta(noteId);
        }
    },

    copyLibreta(event) {
        const obj = document.getElementById('p360-libreta-obj') ? document.getElementById('p360-libreta-obj').value : '';
        const avisos = document.getElementById('p360-libreta-avisos') ? document.getElementById('p360-libreta-avisos').value : '';
        const notes = document.getElementById('p360-libreta-notes') ? document.getElementById('p360-libreta-notes').value : '';
        const alu = document.getElementById('p360-libreta-alu') ? document.getElementById('p360-libreta-alu').value : '';
        const hw = document.getElementById('p360-libreta-hw') ? document.getElementById('p360-libreta-hw').value : '';
        
        let final = "";
        const activeCourse = typeof Store !== 'undefined' ? Store.getActiveCourse() : null;
        if (activeCourse) {
            final += `📚 RESUMEN DE CLASE: ${activeCourse.grado} ${activeCourse.seccion}\n`;
            const date = new Date();
            final += `📅 Fecha: ${date.toLocaleDateString()}\n`;
            final += "--------------------------------------\n\n";
        }
        
        if (obj.trim()) final += "🎯 OBJETIVO DE LA CLASE:\n" + obj.trim() + "\n\n";
        if (notes.trim()) final += "📝 ÚLTIMA ACTIVIDAD / NOTAS:\n" + notes.trim() + "\n\n";
        if (alu.trim()) final += "👥 OBSERVACIONES DE ALUMNOS:\n" + alu.trim() + "\n\n";
        if (hw.trim()) final += "📚 TAREA ASIGNADA:\n" + hw.trim() + "\n\n";
        if (avisos.trim()) final += "📢 AVISOS IMPORTANTES:\n" + avisos.trim() + "\n\n";
        
        if (!final.trim()) return;

        navigator.clipboard.writeText(final.trim()).then(() => {
            const btn = event.currentTarget;
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copiado';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
        });
    },

    pauseAndCloseClass(noteId) {
        // Asegurar que se guarde el último cambio
        this.saveLibreta(noteId);
        
        // Mostrar mensaje rápido
        if(window.UI && window.UI.toast) {
            window.UI.toast("Punto de clase guardado. Cerrando...", 'success');
        }

        setTimeout(() => {
            // Cerrar herramienta
            this.closeTool();
            // Salir del lector si estamos en él
            if(window.Libreria && window.Libreria.cerrarLector) {
                window.Libreria.cerrarLector();
            }
        }, 500);
    },

    goToLibretaSlide(direction) {
        let newSlide = (this.state.currentLibretaSlide || 0) + direction;
        if(newSlide < 0) newSlide = 0;
        if(newSlide > 4) newSlide = 4;
        this.state.currentLibretaSlide = newSlide;

        const track = document.getElementById('p360-carousel-track');
        if(track) {
            track.style.transform = `translateX(-${newSlide * 20}%)`;
        }

        // Update dots
        for(let i=0; i<=4; i++) {
            const dot = document.getElementById('p360-dot-' + i);
            if(dot) {
                if(i === newSlide) dot.classList.add('active');
                else dot.classList.remove('active');
            }
        }

        // Update buttons
        const btnPrev = document.getElementById('p360-btn-prev');
        const btnNext = document.getElementById('p360-btn-next');
        if(btnPrev) btnPrev.disabled = (newSlide === 0);
        if(btnNext) btnNext.disabled = (newSlide === 4);

        if(newSlide === 4) {
            this.renderAIActions('comprension');
            this.startSelectionListener();
        } else {
            this.stopSelectionListener();
        }
    },

    // ══════════════════════════════════════════════════════
    //  IA SELECTION Y GEMINI
    // ══════════════════════════════════════════════════════
    
    startSelectionListener() {
        this.state.aiSelectedText = '';
        this._aiSelectionHandler = () => {
            const sel = window.getSelection().toString().trim();
            if(sel) {
                this.state.aiSelectedText = sel;
                const el = document.getElementById('p360-ai-selection');
                if(el) {
                    el.innerText = sel;
                    el.style.color = '#0f172a';
                    el.style.fontWeight = '500';
                }
            }
        };
        document.addEventListener('selectionchange', this._aiSelectionHandler);
        // Intentar leer de inmediato por si ya hay texto seleccionado
        this._aiSelectionHandler();
    },

    stopSelectionListener() {
        if(this._aiSelectionHandler) {
            document.removeEventListener('selectionchange', this._aiSelectionHandler);
        }
    },

    renderAIActions(category) {
        const container = document.getElementById('p360-ai-actions-container');
        if(!container) return;

        const categories = {
            comprension: [
                {id: 'c1', label: 'Preguntas Literales', prompt: 'Crea 3 preguntas literales sobre este fragmento con sus respuestas.'},
                {id: 'c2', label: 'Preguntas Inferenciales', prompt: 'Crea 3 preguntas inferenciales sobre este fragmento con sus respuestas.'},
                {id: 'c3', label: 'Preguntas Críticas', prompt: 'Crea 2 preguntas críticas o de opinión basadas en este texto.'},
                {id: 'c4', label: 'Idea Principal', prompt: 'Identifica la idea principal de este texto en una sola oración.'},
                {id: 'c5', label: 'Resumen', prompt: 'Crea un resumen breve y claro de este fragmento.'}
            ],
            ensenanza: [
                {id: 'e1', label: 'Explicar', prompt: 'Explica este fragmento de manera sencilla como si estuvieras hablando con los estudiantes.'},
                {id: 'e2', label: 'Simplificar', prompt: 'Reescribe este texto usando palabras más sencillas para estudiantes con dificultades.'},
                {id: 'e3', label: 'Ejemplos', prompt: 'Crea 2 ejemplos de la vida diaria para ilustrar lo que dice este fragmento.'},
                {id: 'e4', label: 'Vocabulario', prompt: 'Extrae hasta 5 palabras clave de este texto, con definición y ejemplo.'},
                {id: 'e5', label: 'Andamiaje', prompt: 'Crea un andamiaje didáctico (pasos previos) para introducir este tema.'}
            ],
            evaluacion: [
                {id: 'v1', label: 'Prueba Corta', prompt: 'Crea una prueba corta de 3 preguntas de opción múltiple basadas en este texto. Indica la respuesta correcta.'},
                {id: 'v2', label: 'Cotejo', prompt: 'Crea una lista de cotejo para evaluar si los alumnos comprendieron este tema.'},
                {id: 'v3', label: 'Rúbrica', prompt: 'Crea una rúbrica breve (3 criterios) para evaluar una exposición sobre este tema.'},
                {id: 'v4', label: 'Ticket Salida', prompt: 'Diseña un "Ticket de Salida" con 2 preguntas rápidas sobre este texto.'},
                {id: 'v5', label: 'Verdadero/Falso', prompt: 'Genera 4 afirmaciones de Verdadero o Falso sobre este fragmento.'}
            ],
            actividades: [
                {id: 'a1', label: 'Parejas', prompt: 'Crea una actividad para trabajar en parejas basada en este texto. Incluye propósito y tiempo.'},
                {id: 'a2', label: 'Grupal', prompt: 'Crea una actividad grupal interactiva sobre este texto. Indica instrucciones.'},
                {id: 'a3', label: 'Debate', prompt: 'Formula una pregunta controversial o tema de debate extraído de este texto.'},
                {id: 'a4', label: 'Lúdica', prompt: 'Propón una dinámica lúdica breve usando este tema.'},
                {id: 'a5', label: 'Tarea', prompt: 'Asigna una tarea sencilla para casa basada en este texto.'}
            ],
            transformacion: [
                {id: 't1', label: 'Guion Docente', prompt: 'Transforma este texto en un guion o discurso para leer en clase.'},
                {id: 't2', label: 'Diapositivas', prompt: 'Divide este texto en 3 viñetas clave ideales para una presentación de PowerPoint.'},
                {id: 't3', label: 'Cuadro Comp.', prompt: 'Si es aplicable, sugiere un cuadro comparativo basado en este texto.'},
                {id: 't4', label: 'Ampliar', prompt: 'Amplía la información de este texto con datos curiosos.'},
                {id: 't5', label: 'Esquema', prompt: 'Convierte este texto en un esquema o mapa conceptual en formato de lista.'}
            ]
        };

        const actions = categories[category] || [];
        container.innerHTML = `
            <div style="margin-bottom:8px; display:flex; justify-content:flex-end;">
                <button onclick="Views.Pizarra360.clearSelection()" style="background:transparent; border:none; color:#dc2626; font-size:11px; cursor:pointer; text-decoration:underline;">Limpiar selección</button>
            </div>
            ${actions.map(a => 
            `<button onclick="Views.Pizarra360.executeAIAction('${a.prompt.replace(/'/g, "\\'")}', '${a.label}')" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer; color:#334155; transition:background 0.2s;">${a.label}</button>`
            ).join('')}
        `;
    },

    async executeAIAction(promptText, actionLabel) {
        if(!this.state.aiSelectedText && !this.state.aiSelectedImage) {
            alert('Por favor selecciona un área gráfica o de texto en el PDF primero.');
            return;
        }

        const apiKey = localStorage.getItem('gemini_api_key');
        if(!apiKey) {
            alert('No hay una API Key de Gemini configurada. Abre el panel de IA original para configurarla.');
            return;
        }

        const resEl = document.getElementById('p360-ai-result');
        if(resEl) resEl.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%;"><div class="p360-spinner" style="width:20px;height:20px;border:3px solid #f3f3f3;border-top:3px solid #3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div></div>';

        // Recopilar contexto
        const activeCourse = typeof Store !== 'undefined' ? Store.getActiveCourse() : null;
        const ctxGrade = activeCourse ? activeCourse.grado : 'No especificado';
        const ctxSubject = activeCourse ? activeCourse.seccion : 'No especificada'; // 'seccion' suele usarse como materia en este app a veces, o 'clase'
        const pageNum = (window.Libreria && window.Libreria.state) ? window.Libreria.state.pageNum : '?';

        const systemInstruction = `Eres un asistente pedagógico experto en educación de Honduras. Usa ÚNICAMENTE el texto proporcionado.
Contexto de la clase:
- Grado: ${ctxGrade}
- Asignatura: ${ctxSubject}
- Página actual del libro: ${pageNum}

Texto seleccionado del PDF:
"${this.state.aiSelectedText}"

Reglas: No inventes información que no esté sustentada en el fragmento. Si necesitas ampliar, aclara que es una sugerencia didáctica. Escribe en tono claro, práctico y listo para usar en clase. Utiliza Markdown para dar formato.`;

        try {
            const modelName = localStorage.getItem('gemini_model_name') || 'gemini-1.5-flash';
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ role: "user", parts: [{ text: promptText }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
                })
            });

            if(!response.ok) throw new Error('Error en API de Gemini');
            const data = await response.json();
            const textResult = data.candidates[0].content.parts[0].text;
            
            // Format MD (simple bold and lists)
            const htmlResult = textResult
                .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                .replace(/\\n/g, '<br/>')
                .replace(/\\* /g, '• ');

            if(resEl) resEl.innerHTML = htmlResult;

            // Guardar en historial
            this.state.aiHistory = this.state.aiHistory || [];
            this.state.aiHistory.push({
                action: actionLabel,
                text: this.state.aiSelectedText,
                result: htmlResult,
                date: new Date().toLocaleTimeString()
            });

        } catch (e) {
            if(resEl) resEl.innerHTML = `<span style="color:#ef4444;">Error al conectar con Gemini: ${e.message}</span>`;
        }
    },

    toggleAIHistory() {
        const panel = document.getElementById('p360-ai-history-panel');
        if(!panel) return;
        
        if(panel.style.display === 'none') {
            const list = document.getElementById('p360-ai-history-list');
            if(list) {
                const hist = this.state.aiHistory || [];
                if(hist.length === 0) {
                    list.innerHTML = '<div style="color:#64748b; font-style:italic; padding:8px;">No hay historial en esta sesión.</div>';
                } else {
                    list.innerHTML = hist.slice().reverse().map(h => `
                        <div style="border:1px solid #e2e8f0; border-radius:4px; padding:6px; background:#fff;">
                            <div style="font-size:10px; color:#94a3b8; display:flex; justify-content:space-between;">
                                <span>${h.action}</span>
                                <span>${h.date}</span>
                            </div>
                            <div style="font-size:11px; margin-top:4px; max-height:40px; overflow:hidden; color:#64748b;">"${h.text.substring(0,60)}..."</div>
                        </div>
                    `).join('');
                }
            }
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
        }
    },

    // ══════════════════════════════════════════════════════
    //  HERRAMIENTA 8 — LIENZO DE DIBUJO
    // ══════════════════════════════════════════════════════
    dibujoColor: '#0f172a',
    dibujoSize: 3,
    dibujoIsEraser: false,

    _renderDibujo() {
        return `
        <div style="display:flex; flex-direction:column; gap:8px; height:100%;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; background:#fff; padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; flex-wrap:wrap;">
                <div style="display:flex; gap:6px; align-items:center;">
                    ${['#0f172a','#ef4444','#3b82f6','#10b981','#f59e0b','#ffffff'].map(c => `
                        <div onclick="Views.Pizarra360.setDibujoColor('${c}')" style="width:22px; height:22px; border-radius:50%; background:${c}; cursor:pointer; border:${this.dibujoColor===c&&!this.dibujoIsEraser?'2px solid #38bdf8':'1px solid #cbd5e1'}; box-shadow:0 1px 3px rgba(0,0,0,0.15);"></div>
                    `).join('')}
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <button class="p360-btn ${this.dibujoIsEraser?'p360-btn-primary':''}" style="padding:4px 8px; font-size:11px;" onclick="Views.Pizarra360.toggleBorrador()">${this.dibujoIsEraser?'✏️ Lápiz':'🧹 Borrador'}</button>
                    <select onchange="Views.Pizarra360.setDibujoSize(this.value)" style="padding:4px; font-size:11px; border-radius:6px; border:1px solid #cbd5e1; background:#f8fafc;">
                        <option value="2" ${this.dibujoSize==2?'selected':''}>Fino</option>
                        <option value="4" ${this.dibujoSize==4?'selected':''}>Medio</option>
                        <option value="8" ${this.dibujoSize==8?'selected':''}>Grueso</option>
                    </select>
                    <button class="p360-btn p360-btn-danger" style="padding:4px 8px; font-size:11px;" onclick="Views.Pizarra360.clearDibujo()" title="Limpiar lienzo">🗑️</button>
                </div>
            </div>
            <div style="flex:1; position:relative; min-height:220px; border:1px solid #cbd5e1; border-radius:8px; overflow:hidden; background:#ffffff;">
                <canvas id="p360-canvas-dibujo" style="width:100%; height:100%; touch-action:none; cursor:crosshair; display:block;"></canvas>
            </div>
        </div>`;
    },

    setDibujoColor(color) {
        this.dibujoColor = color;
        this.dibujoIsEraser = false;
        this.reRender();
    },

    setDibujoSize(size) {
        this.dibujoSize = parseInt(size);
    },

    toggleBorrador() {
        this.dibujoIsEraser = !this.dibujoIsEraser;
        this.reRender();
    },

    clearDibujo() {
        const cvs = document.getElementById('p360-canvas-dibujo');
        if (cvs) {
            const ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, cvs.width, cvs.height);
        }
    },

    _initDibujo() {
        const cvs = document.getElementById('p360-canvas-dibujo');
        if (!cvs) return;
        const rect = cvs.parentElement.getBoundingClientRect();
        cvs.width = rect.width || 300;
        cvs.height = rect.height || 220;

        const ctx = cvs.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let drawing = false;
        let lastX = 0;
        let lastY = 0;

        const getPos = (e) => {
            const r = cvs.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - r.left, y: clientY - r.top };
        };

        const startDraw = (e) => {
            drawing = true;
            const p = getPos(e);
            lastX = p.x;
            lastY = p.y;
        };

        const draw = (e) => {
            if (!drawing) return;
            e.preventDefault();
            const p = getPos(e);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(p.x, p.y);
            if (this.dibujoIsEraser) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = this.dibujoSize * 4;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = this.dibujoColor;
                ctx.lineWidth = this.dibujoSize;
            }
            ctx.stroke();

            lastX = p.x;
            lastY = p.y;
        };

        const stopDraw = () => { drawing = false; };

        cvs.onpointerdown = startDraw;
        cvs.onpointermove = draw;
        cvs.onpointerup = stopDraw;
        cvs.onpointercancel = stopDraw;
    },

    // ══════════════════════════════════════════════════════
    //  CSS EMBEBIDO (Ajustado para Ventana Flotante)
    // ══════════════════════════════════════════════════════
    _css() {
        return `
.p360-floating-window { position:fixed; width:340px; background:#fff; border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05); z-index:99999; display:flex; flex-direction:column; overflow:hidden; font-family:system-ui,-apple-system,sans-serif; transition:opacity 0.2s; animation:p360-dropIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes p360-dropIn { 0%{opacity:0;transform:translateY(-10px) scale(0.95)} 100%{opacity:1;transform:translateY(0) scale(1)} }
.p360-fw-header { background:linear-gradient(180deg, #1e293b, #0f172a); color:#fff; display:flex; flex-direction:column; cursor:move; user-select:none; border-radius:12px 12px 0 0; overflow:hidden; }
.p360-fw-header-top { display:flex; align-items:center; justify-content:space-between; padding:8px 12px 6px 12px; }
.p360-fw-title { font-size:13px; font-weight:700; pointer-events:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.p360-fw-winbtns { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.p360-fw-tools-row { display:flex; align-items:center; gap:2px; padding:4px 8px 6px 8px; border-top:1px solid rgba(255,255,255,0.06); background:rgba(0,0,0,0.2); }
.p360-fw-controls { display:flex; align-items:center; gap:2px; }
.p360-fw-icon-btn { background:transparent; border:none; color:rgba(255,255,255,0.6); border-radius:4px; padding:4px; cursor:pointer; font-size:14px; transition:all 0.15s; }
.p360-fw-icon-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }
.p360-fw-icon-btn.active { color:#38bdf8; background:rgba(56,189,248,0.15); }
.p360-wbtn{width:22px;height:22px;border-radius:50%;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0;}
.p360-wbtn-min{background:#fbbf24;color:#78350f;}
.p360-wbtn-min:hover{background:#f59e0b;transform:scale(1.12);}
.p360-wbtn-max{background:#34d399;color:#064e3b;}
.p360-wbtn-max:hover{background:#10b981;transform:scale(1.12);}
.p360-wbtn-close{background:#f87171;color:#7f1d1d;}
.p360-wbtn-close:hover{background:#ef4444;transform:scale(1.12);}
.p360-fw-content { flex: 1; padding:16px; background:#f8fafc; max-height:400px; overflow-y:auto; display:flex; flex-direction:column; }
.p360-floating-window[data-maximized="true"] .p360-fw-content { max-height:none; }

/* Carousel CSS */
.p360-dot { width:8px; height:8px; border-radius:50%; background:#cbd5e1; transition:all 0.3s; cursor:pointer; }
.p360-dot.active { background:#3b82f6; width:16px; border-radius:4px; }
.p360-slide::-webkit-scrollbar { width: 4px; }
.p360-slide::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.p360-spinner-area{display:flex;flex-direction:column;align-items:center;gap:12px;}
.p360-wheel-container{position:relative;}
.p360-wheel-pointer{position:absolute;top:-12px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:18px solid #f43f5e;filter:drop-shadow(0 2px 2px rgba(244,63,94,0.5));z-index:5}
.p360-result-badge{background:linear-gradient(135deg,#f43f5e,#fb923c);color:#fff;border-radius:12px;padding:8px 16px;font-size:15px;font-weight:800;text-align:center;min-width:140px;box-shadow:0 4px 12px rgba(244,63,94,0.3);animation:p360-pop 0.3s cubic-bezier(0.34,1.56,0.64,1)}
@keyframes p360-pop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
.p360-spin-btn{background:linear-gradient(135deg,#f43f5e,#fb923c);color:#fff;border:none;border-radius:10px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 12px rgba(244,63,94,0.3);transition:all 0.2s}
.p360-spin-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(244,63,94,0.4)}
.p360-spin-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}

.p360-eq-config{display:flex;flex-wrap:wrap;align-items:center;}
.p360-eq-cards{display:flex;flex-direction:column;gap:10px;margin-top:12px;}
.p360-eq-card-v2{border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid rgba(0,0,0,0.06);}
.p360-eq-card-header{display:flex;align-items:center;gap:10px;padding:10px 12px;}
.p360-eq-avatar{font-size:20px;font-weight:900;line-height:1;flex-shrink:0;width:38px;height:38px;background:#ffffff;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);}
.p360-eq-card-name{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;}
.p360-eq-card-count{font-size:11px;color:#64748b;margin-top:1px;}
.p360-eq-members-grid{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 12px;}
.p360-eq-member-chip{display:flex;align-items:center;gap:6px;border-radius:20px;border:1px solid;padding:3px 10px 3px 3px;font-size:12px;}
.p360-eq-chip-init{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0;}
.p360-eq-chip-name{font-weight:600;color:#1e293b;}

.p360-part-list{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;padding-right:4px;}
.p360-part-row{display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:8px;padding:8px 12px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.02)}
.p360-part-name{font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;}
.p360-part-count{background:rgba(245,158,11,0.1);color:#f59e0b;border-radius:12px;padding:2px 8px;font-size:12px;font-weight:800;min-width:24px;text-align:center;}
.p360-part-count.highlight{background:linear-gradient(135deg,#f59e0b,#fb923c);color:#fff;box-shadow:0 2px 8px rgba(245,158,11,0.3)}
.p360-part-btn{border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;font-weight:700;background:rgba(245,158,11,0.1);color:#f59e0b;}
.p360-part-btn:hover{background:#f59e0b;color:#fff}

.p360-dice-area{text-align:center;padding:10px 0;display:flex;flex-direction:column;align-items:center;gap:12px}
.p360-dice-selector{display:flex;gap:6px;}
.p360-dice-face{padding:6px 12px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:12px;font-weight:700;cursor:pointer;}
.p360-dice-face.active{background:#6366f1;color:#fff;border-color:#6366f1;}
.p360-roll-btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:10px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer;}

.p360-semaforo-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;}
.p360-semaforo-housing{background:#1a1a1a;border-radius:30px;padding:16px;display:flex;flex-direction:column;gap:12px;}
.p360-semaforo-light{width:60px;height:60px;border-radius:50%;cursor:pointer;box-shadow:inset 0 4px 8px rgba(0,0,0,0.5);}
.p360-semaforo-light.s-red{background:#2a0808}
.p360-semaforo-light.s-yellow{background:#1a1200}
.p360-semaforo-light.s-green{background:#082208}
@keyframes p360-semaforoBlink{0%,100%{opacity:1}50%{opacity:0.3}}
.p360-semaforo-light.s-red.active{background:radial-gradient(circle at 40% 35%,#ff6b6b,#ef4444 50%,#b91c1c);box-shadow:0 0 20px rgba(239,68,68,0.6);animation:p360-semaforoBlink 1s ease-in-out infinite;}
.p360-semaforo-light.s-yellow.active{background:radial-gradient(circle at 40% 35%,#fde68a,#f59e0b 50%,#b45309);box-shadow:0 0 20px rgba(245,158,11,0.6);animation:p360-semaforoBlink 1s ease-in-out infinite;}
.p360-semaforo-light.s-green.active{background:radial-gradient(circle at 40% 35%,#86efac,#22c55e 50%,#15803d);box-shadow:0 0 20px rgba(34,197,94,0.6);animation:p360-semaforoBlink 1s ease-in-out infinite;}
.p360-semaforo-label{font-size:18px;font-weight:800;text-align:center;}
.semaforo-verde{color:#22c55e}.semaforo-amarillo{color:#f59e0b}.semaforo-rojo{color:#ef4444}

.p360-btn-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.p360-btn{border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;}
.p360-btn-primary{background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;}
.p360-btn-ghost{background:#fff;border:1px solid #e2e8f0;color:#64748b}
.p360-btn-danger{background:rgba(239,68,68,0.1);color:#ef4444}
.p360-btn-fullscreen{background:rgba(99,102,241,0.1);color:#6366f1}
.p360-empty{text-align:center;padding:20px;color:#64748b}
`;
    }
};
