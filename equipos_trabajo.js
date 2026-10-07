
/**
 * Módulo: Equipos de Trabajo (Versión MULTI-PANTALLA ELITE + AUTO-EXCLUIR)
 * Estructuras dedicadas para Sorteo (con eliminación automática), Equipos y Participación.
 */

Views.EquiposTrabajo = {
    students: [],
    excludedIds: new Set(),
    history: [],
    mode: 'aleatorio', 
    rotation: 0,
    isSpinning: false,
    teams: [],
    currentTeamIdx: 0, 
    participationData: {},

    sounds: {
        spin: 'https://www.soundjay.com/misc/sounds/bell-ring-01.mp3',
        win: 'https://www.soundjay.com/misc/sounds/success-fanfare-trumpets-10.mp3',
        click: 'https://www.soundjay.com/buttons/sounds/button-16.mp3'
    },

    play(soundName) {
        try {
            const audio = new Audio(this.sounds[soundName]);
            audio.volume = 0.4;
            audio.play().catch(() => {});
        } catch(e) {}
    },

    colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],

    /**
     * Persistencia
     */
    saveState() {
        const course = Store.getActiveCourse();
        if (!course) return;
        if (!Store.data.equiposState) Store.data.equiposState = {};
        
        Store.data.equiposState[course.id] = {
            excludedIds: Array.from(this.excludedIds),
            history: this.history,
            teams: this.teams,
            participationData: this.participationData
        };
        Store.save();
    },

    loadState(courseId) {
        if (!Store.data.equiposState || !Store.data.equiposState[courseId]) {
            this.excludedIds = new Set();
            this.history = [];
            this.teams = [];
            this.participationData = {};
            return;
        }
        const state = Store.data.equiposState[courseId];
        this.excludedIds = new Set(state.excludedIds || []);
        this.history = state.history || [];
        this.teams = state.teams || [];
        this.participationData = state.participationData || {};
    },

    /**
     * Renderizador Maestro
     */
    render() {
        const course = Store.getActiveCourse();
        if (!course) return this.renderEmptyState();

        this.loadState(course.id);
        this.students = Store.getStudentsByCourse(course.id);
        
        return `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                .eq-v4-root {
                    --primary: #10b981;
                    --accent: #6366f1;
                    --bg: #f8fafc;
                    --card: #ffffff;
                    font-family: 'Outfit', sans-serif;
                    padding: 0;
                    width: 100%;
                    max-width: 1600px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 80px); /* Tighter for landscape */
                    overflow: hidden;
                }
                .eq-header-area {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 20px;
                    background: white;
                    border-radius: 18px;
                    margin-bottom: 12px;
                    border: 1px solid var(--border-soft);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                    flex-shrink: 0;
                }
                .eq-v4-nav {
                    background: #f1f5f9;
                    padding: 3px;
                    border-radius: 11px;
                    display: flex;
                    gap: 3px;
                }
                .nav-btn {
                    padding: 5px 12px;
                    border-radius: 8px;
                    font-weight: 700;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex; align-items: center; gap: 5px;
                    font-size: 11px;
                    white-space: nowrap;
                }
                .nav-btn.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                }
                .screen-container { 
                    animation: fadeIn 0.4s ease; 
                    flex: 1;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    padding: 0 5px 10px 5px;
                }
                
                .wheel-outer-box {
                    background: white; border-radius: 25px; padding: 15px; 
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
                    width: 100%; height: 100%;
                    border: 1px solid var(--border-soft);
                    position: relative;
                }
                .wheel-wrap {
                    position: relative; 
                    height: 100%;
                    aspect-ratio: 1/1;
                    max-height: calc(100vh - 220px);
                    display: flex; align-items: center; justify-content: center;
                }
                
                .sorteo-grid {
                    display: grid; 
                    grid-template-columns: 1fr 260px; 
                    gap: 15px; 
                    height: 100%;
                }
                
                /* Landscape Optimization for Tablet */
                @media (orientation: landscape) and (min-height: 500px) {
                    .eq-v4-root { height: calc(100vh - 60px); }
                    .wheel-wrap { max-height: calc(100vh - 180px); }
                    .sorteo-grid { grid-template-columns: 1fr 240px; }
                }

                @media (max-width: 900px) and (orientation: portrait) {
                    .sorteo-grid {
                        grid-template-columns: 1fr;
                        grid-template-rows: auto 1fr;
                        overflow-y: auto;
                    }
                    .wheel-wrap {
                        width: min(80vw, 400px);
                        height: min(80vw, 400px);
                    }
                    .eq-v4-root { height: auto; overflow: visible; }
                }

                .carousel-container { display: flex; align-items: center; justify-content: center; gap: 15px; padding: 10px 0; width: 100%; flex: 1; }
                .carousel-card { 
                    width: 100%; max-width: 480px; background: white; border-radius: 25px; 
                    padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); 
                    border: 1px solid #f1f5f9; animation: cardFadeIn 0.3s ease-out; 
                }
                .carousel-nav-btn { 
                    width: 50px; height: 50px; border-radius: 50%; background: white; 
                    border: 1px solid #f1f5f9; display: flex; align-items: center; 
                    justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.03); 
                    transition: all 0.3s; color: #94a3b8; flex-shrink: 0;
                }
                .carousel-nav-btn:hover:not(:disabled) { background: var(--primary); color: white; }
                .carousel-nav-btn:disabled { opacity: 0.1; cursor: not-allowed; }

                @keyframes cardFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            </style>

            <div class="eq-v4-root">
                <div class="eq-header-area">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button class="a360-btn a360-btn-secondary" onclick="Router.navigate('panel')" style="width:36px; height:36px; padding:0; border-radius:10px;">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div class="a360-header-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; width:36px; height:36px; border-radius:10px;">
                            <i data-lucide="users-2" style="width:18px;"></i>
                        </div>
                        <div>
                            <h1 class="a360-header-title" style="font-size: 18px; margin:0;">Equipos de Trabajo</h1>
                            <p class="a360-header-subtitle" style="font-size: 11px;">
                                <i data-lucide="book-open" style="width:11px;"></i> ${course.asignatura} - ${course.grado}
                            </p>
                        </div>
                    </div>

                    <nav class="eq-v4-nav">
                        <button class="nav-btn ${this.mode === 'aleatorio' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('aleatorio')">
                            <i data-lucide="shuffle" style="width:14px;"></i> Sorteo
                        </button>
                        <button class="nav-btn ${this.mode === 'equipos' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('equipos')">
                            <i data-lucide="users" style="width:14px;"></i> Equipos
                        </button>
                        <button class="nav-btn ${this.mode === 'participacion' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('participacion')">
                            <i data-lucide="clipboard-check" style="width:14px;"></i> Participación
                        </button>
                    </nav>
                </div>

                <div class="screen-container" id="eq-screen-container">
                    ${this.renderActiveScreen()}
                </div>
            </div>
        `;
    },

    renderActiveScreen() {
        switch(this.mode) {
            case 'aleatorio': return this.screenSorteo();
            case 'equipos': return this.screenEquipos();
            case 'participacion': return this.screenParticipacion();
            default: return this.screenSorteo();
        }
    },

    /**
     * PANTALLA 1: SORTEO RÁPIDO
     */
    screenSorteo() {
        const pool = this.students.filter(s => !this.excludedIds.has(s.id));
        return `
            <div class="sorteo-grid">
                <div class="wheel-outer-box">
                    <div class="wheel-wrap">
                        <svg style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); z-index: 10;" width="30" height="40" viewBox="0 0 50 60">
                            <path d="M25 60L50 0H0L25 60Z" fill="#1e293b" stroke="white" stroke-width="3"/>
                        </svg>
                        <canvas id="wheel-canvas" width="1100" height="1100" style="width: 100%; height: 100%; border-radius: 50%;"></canvas>
                        <div onclick="Views.EquiposTrabajo.spin()" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,0.15); border: 3px solid #f8fafc;">
                            <span style="font-size: 8px; font-weight: 900; color: #94a3b8; letter-spacing: 0.5px;">GIRAR</span>
                            <i data-lucide="play" style="color: var(--primary); fill: var(--primary); width: 18px; height: 18px;"></i>
                        </div>
                    </div>
                    <p style="margin-top:20px; color:#94a3b8; font-weight:700; font-size:12px;">${pool.length} estudiantes restantes</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 15px; overflow-y: auto; padding-right: 5px;">
                    <div style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border: 1px solid var(--border-soft);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                            <h4 style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin:0;">Historial</h4>
                            <button onclick="Views.EquiposTrabajo.resetPool()" style="background:none; border:none; color:var(--primary); font-size:9px; font-weight:900; cursor:pointer;">REINICIAR</button>
                        </div>
                        <div id="sorteo-history" style="max-height: 150px; overflow-y: auto;">${this.renderHistory()}</div>
                    </div>
                    <div style="background: #f1f5f9; border-radius: 20px; padding: 20px; flex: 1;">
                        <h4 style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 15px;">Lista Completa</h4>
                        <div style="max-height: 250px; overflow-y: auto;">${this.renderSimpleList()}</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * PANTALLA 2: FORMAR EQUIPOS
     */
    screenEquipos() {
        const currentTeam = this.teams[this.currentTeamIdx];
        return `
            <div style="background: #f8fafc; border-radius: 30px; padding: 30px; flex: 1; display: flex; flex-direction: column; align-items: center; overflow-y: auto;">
                <div style="background: white; padding: 10px 20px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); display: flex; gap: 15px; align-items: center; margin-bottom: 30px; border: 1px solid #f1f5f9; flex-wrap: wrap; justify-content: center;">
                    <div style="display:flex; flex-direction:column; gap:2px;"><span style="font-size:9px; font-weight:900; color:#94a3b8; letter-spacing:1px;">ORGANIZAR</span><select id="e-team-mode" style="border:none; background:transparent; font-weight:900; font-size:14px; color:#1e293b; cursor:pointer;"><option value="cantidad">Número de Equipos</option><option value="tamano">Alumnos por Equipo</option></select></div>
                    <div style="width:1px; height:30px; background:#f1f5f9;" class="hide-mobile"></div>
                    <div style="display:flex; flex-direction:column; gap:2px;"><span style="font-size:9px; font-weight:900; color:#94a3b8; letter-spacing:1px;">CANTIDAD</span><input type="number" id="e-team-val" value="4" min="2" style="border:none; background:transparent; font-weight:900; font-size:16px; width:50px; color:var(--primary);"></div>
                    <button class="a360-btn a360-btn-primary" style="height:44px; padding:0 25px; border-radius:12px; font-size:14px; font-weight:900;" onclick="Views.EquiposTrabajo.makeTeams()">Generar</button>
                </div>
                ${this.teams.length > 0 ? `
                    <div class="carousel-container">
                        <button class="carousel-nav-btn" onclick="Views.EquiposTrabajo.moveCarousel(-1)" ${this.currentTeamIdx === 0 ? 'disabled' : ''}><i data-lucide="chevron-left" style="width:24px; height:24px;"></i></button>
                        <div class="carousel-card">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                <div style="display:flex; align-items:center; gap:12px;"><div style="width:40px; height:40px; border-radius:12px; background:${this.colors[this.currentTeamIdx % this.colors.length]}; display:grid; place-items:center; color:white;"><i data-lucide="users-2" style="width:20px;"></i></div><div><h3 style="font-size:18px; font-weight:900; margin:0; color:#1e293b;">Equipo ${this.currentTeamIdx + 1}</h3><p style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; margin:0; letter-spacing:1px;">${currentTeam.length} Estudiantes</p></div></div>
                                <div style="font-size:12px; font-weight:900; color:#cbd5e1;">${this.currentTeamIdx + 1} / ${this.teams.length}</div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:8px;">${currentTeam.map((s, i) => `<div style="background:#f8fafc; padding:12px 18px; border-radius:15px; display:flex; align-items:center; gap:12px; border:1px solid #f1f5f9;"><div style="width:24px; height:24px; background:white; border-radius:6px; display:grid; place-items:center; font-size:10px; font-weight:900; color:#94a3b8; border:1px solid #e2e8f0;">${i+1}</div><span style="font-size:14px; font-weight:700; color:#475569;">${s.nombreCompleto}</span></div>`).join('')}</div>
                        </div>
                        <button class="carousel-nav-btn" onclick="Views.EquiposTrabajo.moveCarousel(1)" ${this.currentTeamIdx === this.teams.length - 1 ? 'disabled' : ''}><i data-lucide="chevron-right" style="width:24px; height:24px;"></i></button>
                    </div>
                    <div style="display:flex; gap:8px; margin-top:20px;">${this.teams.map((_, i) => `<div style="width:${i === this.currentTeamIdx ? '20px' : '8px'}; height:8px; border-radius:8px; background:${i === this.currentTeamIdx ? 'var(--primary)' : '#e2e8f0'}; transition:all 0.3s;"></div>`).join('')}</div>
                ` : `<div style="opacity:0.3; text-align:center; padding:50px;"><i data-lucide="users" style="width:64px; height:64px; margin-bottom:15px;"></i><p>Genera los equipos para ver el carrusel</p></div>`}
            </div>
        `;
    },

    /**
     * PANTALLA 3: PARTICIPACIÓN
     */
    screenParticipacion() {
        return `
            <div style="background: white; border-radius: 40px; padding: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
                    <div><h2 style="font-size: 28px; font-weight: 900; margin: 0;">Participación</h2><p style="color:#64748b; font-weight:700;">Seguimiento activo en clase.</p></div>
                    <div style="display: flex; gap: 10px;">
                        <button class="nav-btn" style="border: 1px solid #e2e8f0;" onclick="Views.EquiposTrabajo.downloadReport()"><i data-lucide="download"></i> Reporte</button>
                        <button class="a360-btn a360-btn-primary" style="padding:15px 35px; border-radius:20px; font-weight:900;" onclick="Views.EquiposTrabajo.pickParticipant()"><i data-lucide="zap"></i> Al Azar</button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
                    ${this.students.map(s => {
                        const count = this.participationData[s.id] || 0;
                        return `<div style="background: #f8fafc; border-radius: 25px; padding: 25px; display: flex; flex-direction: column; align-items: center; text-align: center; border: 2px solid ${count > 0 ? 'var(--primary)' : 'transparent'}; position:relative;">
                            <div style="width:55px; height:55px; background:white; border-radius:18px; display:grid; place-items:center; font-weight:900; font-size:20px; color:#cbd5e1; margin-bottom:15px;">${s.nombreCompleto.charAt(0)}</div>
                            <h5 style="font-size:14px; font-weight:800; margin:0; color:#1e293b;">${s.nombreCompleto}</h5>
                            <div style="display:flex; gap:12px; margin-top:18px; align-items:center;">
                                <button onclick="Views.EquiposTrabajo.addParticipation('${s.id}', -1)" style="width:34px; height:34px; border-radius:12px; border:1px solid #e2e8f0; background:white; cursor:pointer;">-</button>
                                <span style="font-size:22px; font-weight:900; color:var(--primary); min-width:35px;">${count}</span>
                                <button onclick="Views.EquiposTrabajo.addParticipation('${s.id}', 1)" style="width:34px; height:34px; border-radius:12px; border:none; background:var(--primary); color:white; cursor:pointer;">+</button>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Lógica de Sorteo (CON ELIMINACIÓN AUTOMÁTICA)
     */
    spin() {
        if (this.isSpinning) return;
        const pool = this.students.filter(s => !this.excludedIds.has(s.id));
        if (pool.length === 0) return UI.toast('¡Todos los estudiantes ya salieron! Reinicia para volver a empezar.');
        if (pool.length < 2) {
            // Caso especial: Solo queda uno, no hace falta girar
            const winner = pool[0];
            this.excludedIds.add(winner.id);
            this.history.push(winner.nombreCompleto);
            Router.render();
            this.onWin([winner], true);
            return;
        }

        this.isSpinning = true;
        this.play('spin');
        let speed = 0.6 + Math.random() * 0.4;
        const friction = 0.988;
        const loop = () => {
            this.rotation += speed; this.draw(); speed *= friction;
            if (speed > 0.0015) requestAnimationFrame(loop);
            else { this.isSpinning = false; this.onWin(pool); }
        };
        loop();
    },

    onWin(pool, direct = false) {
        let winner;
        if (direct) {
            winner = pool[0];
        } else {
            const slice = (Math.PI * 2) / pool.length;
            const winAngle = ((-Math.PI/2 - this.rotation) % (Math.PI*2) + (Math.PI*2)) % (Math.PI*2);
            winner = pool[Math.floor(winAngle / slice) % pool.length];
            this.excludedIds.add(winner.id); // ELIMINAR AUTOMÁTICAMENTE
            this.history.push(winner.nombreCompleto);
            this.play('win');
            this.saveState();
            Router.render();
        }

        UI.modal('🎉 ¡Sorteo! 🎉', `
            <div style="text-align:center; padding:30px;">
                <div style="width:100px; height:100px; background:var(--primary); border-radius:30px; display:grid; place-items:center; margin:0 auto 20px; color:white;">
                    <i data-lucide="trophy" style="width:50px; height:50px;"></i>
                </div>
                <h2 style="font-size:32px; font-weight:900;">${winner.nombreCompleto}</h2>
                <p style="color:#94a3b8; font-weight:700; margin-top:10px;">Ha sido seleccionado y removido de la ruleta.</p>
                <button class="a360-btn a360-btn-primary" style="margin-top:30px; width: 100%; height: 50px; border-radius: 15px;" onclick="UI.closeModal()">Continuar</button>
            </div>
        `);
    },

    resetPool() {
        this.excludedIds = new Set();
        this.history = [];
        this.saveState();
        Router.render();
        UI.toast('¡Ruleta reiniciada!');
    },

    /**
     * Lógica General
     */
    moveCarousel(dir) {
        const next = this.currentTeamIdx + dir;
        if (next >= 0 && next < this.teams.length) {
            this.currentTeamIdx = next;
            const container = document.getElementById('eq-screen-container');
            if (container) { container.innerHTML = this.screenEquipos(); if (window.lucide) window.lucide.createIcons(); }
        }
    },
    makeTeams() {
        const m = document.getElementById('e-team-mode').value;
        const v = parseInt(document.getElementById('e-team-val').value) || 2;
        const pool = this.shuffle([...this.students]);
        let res = [];
        if (m === 'cantidad') { const n = Math.min(v, pool.length); for(let i=0; i<n; i++) res.push([]); pool.forEach((s, i) => res[i % n].push(s)); }
        else { const size = Math.max(2, v); const n = Math.floor(pool.length / size); for(let i=0; i<n; i++) res.push(pool.slice(i*size, (i+1)*size)); }
        this.teams = res; this.currentTeamIdx = 0; 
        this.saveState();
        Router.render();
    },
    setMode(m) { this.mode = m; Router.render(); },
    addParticipation(id, val) { 
        this.participationData[id] = Math.max(0, (this.participationData[id] || 0) + val); 
        this.play('click');
        this.saveState();
        Router.render(); 
    },
    pickParticipant() {
        const winner = this.students[Math.floor(Math.random() * this.students.length)];
        this.addParticipation(winner.id, 1);
        this.play('win');
        UI.modal('🌟 Participación 🌟', `<div style="text-align: center; padding: 40px;"><div style="width: 100px; height: 100px; background: var(--primary); border-radius: 30px; display: grid; place-items: center; margin: 0 auto 20px; color: white;"><i data-lucide="mic" style="width: 50px; height: 50px;"></i></div><h2 style="font-size: 32px; font-weight: 900;">${winner.nombreCompleto}</h2><button class="a360-btn a360-btn-primary" style="margin-top: 30px; width: 100%; height: 50px; border-radius: 15px;" onclick="UI.closeModal()">Listo</button></div>`);
    },
    draw() {
        const canvas = document.getElementById('wheel-canvas'); if (!canvas) return;
        const ctx = canvas.getContext('2d'), pool = this.students.filter(s => !this.excludedIds.has(s.id));
        const W = canvas.width, CX = W/2, CY = W/2, R = W/2 - 40;
        ctx.clearRect(0,0,W,W); if(pool.length===0) return;
        const slice = (Math.PI*2)/pool.length;
        pool.forEach((s,i) => {
            const a = i*slice + this.rotation; ctx.fillStyle = this.colors[i%this.colors.length];
            ctx.beginPath(); ctx.moveTo(CX,CY); ctx.arc(CX,CY,R,a,a+slice); ctx.fill();
            ctx.save(); ctx.translate(CX,CY); ctx.rotate(a+slice/2); ctx.textAlign="right"; ctx.fillStyle="white"; ctx.font="bold 28px Outfit";
            ctx.fillText(s.nombreCompleto.split(' ')[0], R-60, 10); ctx.restore();
            ctx.strokeStyle="rgba(255,255,255,0.1)"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(CX,CY); ctx.lineTo(CX+Math.cos(a)*R, CY+Math.sin(a)*R); ctx.stroke();
        });
        ctx.fillStyle="white"; ctx.beginPath(); ctx.arc(CX,CY,40,0,Math.PI*2); ctx.fill();
    },
    renderHistory() { return this.history.slice(-5).reverse().map(n => `<div style="padding:12px; background:#f8fafc; border-radius:12px; margin-bottom:8px; font-size:12px; font-weight:800; border-left:4px solid var(--primary);">${n}</div>`).join(''); },
    renderSimpleList() { return this.students.map(s => `<div onclick="Views.EquiposTrabajo.toggleEx('${s.id}')" style="padding:10px; background:white; border-radius:12px; margin-bottom:6px; font-size:11px; font-weight:700; cursor:pointer; opacity:${this.excludedIds.has(s.id)?0.4:1};">${s.nombreCompleto}</div>`).join(''); },
    toggleEx(id) { 
        if(this.excludedIds.has(id)) this.excludedIds.delete(id); else this.excludedIds.add(id); 
        this.saveState();
        Router.render(); 
    },
    renderEmptyState() { return `
        <div class="a360-header" style="margin-bottom: 20px;">
            <div class="a360-header-left">
                <button class="a360-btn a360-btn-secondary" onclick="Router.navigate('panel')" style="width:42px; height:42px; padding:0; border-radius:12px;">
                    <i data-lucide="arrow-left"></i>
                </button>
                <div class="a360-header-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; width:42px; height:42px; border-radius:12px;">
                    <i data-lucide="users-2"></i>
                </div>
                <div>
                    <h1 class="a360-header-title" style="font-size: 22px;">Equipos de Trabajo</h1>
                    <p class="a360-header-subtitle">Gestión de Grupos Colaborativos</p>
                </div>
            </div>
        </div>
        <div style="text-align:center; padding:80px; background:white; border-radius:40px; border: 1px solid var(--border-soft); box-shadow: var(--shadow-sm);">
            <div style="width:80px; height:80px; background:var(--bg-soft); border-radius:24px; display:grid; place-items:center; margin:0 auto 24px; color:var(--text-muted);">
                <i data-lucide="users" style="width:40px; height:40px;"></i>
            </div>
            <h2 style="font-weight:900; color:var(--text-main); margin-bottom:12px;">Selecciona un curso para continuar</h2>
            <p style="color:var(--text-muted); margin-bottom:30px; max-width:300px; margin-left:auto; margin-right:auto;">Para gestionar equipos y sorteos, primero debes cargar los estudiantes de un curso.</p>
            <button class="a360-btn a360-btn-primary" style="padding:15px 40px; border-radius:20px; font-weight:800;" onclick="window.openCourseSelector('equipos-trabajo')">
                <i data-lucide="external-link"></i> Cargar Curso
            </button>
        </div>
    `; },
    shuffle(a) { for(let i=a.length-1; i>0; i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; },
    downloadReport() {
        const course = Store.getActiveCourse();
        let content = `REPORTE DE EQUIPOS Y PARTICIPACIÓN\nCurso: ${course.asignatura || 'Sin Nombre'}\nFecha: ${new Date().toLocaleDateString()}\n\n`;
        
        if (this.teams.length > 0) {
            content += "--- EQUIPOS ---\n";
            this.teams.forEach((team, idx) => {
                content += `Equipo ${idx + 1}:\n`;
                team.forEach(s => content += ` - ${s.nombreCompleto}\n`);
                content += "\n";
            });
        }
        
        content += "--- PARTICIPACIÓN ---\n";
        this.students.forEach(s => {
            const count = this.participationData[s.id] || 0;
            content += `${s.nombreCompleto}: ${count} participaciones\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Equipos_${(course.asignatura || 'Curso').replace(/\s+/g, '_')}.txt`;
        a.click();
        UI.toast('Reporte descargado');
    },

    onMount() { if(window.lucide) window.lucide.createIcons(); if(this.mode === 'aleatorio') setTimeout(() => this.draw(), 50); }
};
