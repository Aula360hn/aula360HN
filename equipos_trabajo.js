/**
 * Módulo: Equipos de Trabajo & Plano de Clase
 * Soporta:
 * - Plano de clase interactivo con tarjetas arrastrables (Drag & Drop + Touch tap-to-swap)
 * - Pizarra del aula y Escritorio del Profesor
 * - Cuadrícula editable de pupitres (Filas x Columnas)
 * - Botones maestros: Distribuir, Alumnos, Vista y Ajustar
 * - Sorteo con ruleta y Registro de Participación
 */

Views.EquiposTrabajo = {
    students: [],
    excludedIds: new Set(),
    history: [],
    mode: 'equipos', // 'equipos' (Plano de clase), 'aleatorio' (Sorteo), 'participacion'
    rotation: 0,
    isSpinning: false,
    teams: [],
    currentTeamIdx: 0,
    participationData: {},

    // Estado del Plano de Clase
    seatingPlan: [],
    gridCols: 5, // 5 columnas/filas por defecto
    gridRows: 6, // 30 pupitres por defecto
    organizacionAula: 'clasica', // 'clasica' (5 filas), 'parejas', 'asamblea', 'microgrupos', 'tribuna', 'personalizada'
    planName: 'Plano 1',
    selectedDeskIndex: null,
    showAlumnosDrawer: false,
    alumnosSearch: '',
    viewOptions: {
        showPhotos: true,
        showLastname: true,
        viewStyle: 'grid', // 'grid' (filas) o 'mesas' (grupos)
        colorByTeam: true
    },

    sounds: {
        spin: 'https://www.soundjay.com/misc/sounds/bell-ring-01.mp3',
        win: 'https://www.soundjay.com/misc/sounds/success-fanfare-trumpets-10.mp3',
        click: 'https://www.soundjay.com/buttons/sounds/button-16.mp3'
    },

    play(soundName) {
        try {
            const audio = new Audio(this.sounds[soundName]);
            audio.volume = 0.35;
            audio.play().catch(() => {});
        } catch(e) {}
    },

    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],

    /**
     * Persistencia en Store
     */
    saveState() {
        const course = Store.getActiveCourse();
        if (!course) return;
        if (!Store.data.equiposState) Store.data.equiposState = {};

        Store.data.equiposState[course.id] = {
            excludedIds: Array.from(this.excludedIds),
            history: this.history,
            teams: this.teams,
            participationData: this.participationData,
            seatingPlan: this.seatingPlan,
            gridCols: this.gridCols,
            gridRows: this.gridRows,
            organizacionAula: this.organizacionAula,
            planName: this.planName,
            viewOptions: this.viewOptions,
            mode: this.mode
        };
        Store.save();
    },

    loadState(courseId) {
        const state = Store.data.equiposState?.[courseId] || {};
        this.excludedIds = new Set(state.excludedIds || []);
        this.history = state.history || [];
        this.teams = state.teams || [];
        this.participationData = state.participationData || {};
        this.gridCols = state.gridCols || 5;
        this.gridRows = state.gridRows || 6;
        this.organizacionAula = state.organizacionAula || 'clasica';
        this.planName = state.planName || 'Plano 1';
        this.viewOptions = Object.assign({
            showPhotos: true,
            showLastname: true,
            viewStyle: 'grid',
            colorByTeam: true
        }, state.viewOptions || {});

        const totalDesks = this.gridCols * this.gridRows;
        const courseStudents = Store.getStudentsByCourse(courseId) || [];
        this.students = courseStudents;

        if (Array.isArray(state.seatingPlan) && state.seatingPlan.length > 0) {
            this.seatingPlan = [...state.seatingPlan];
            // Asegurar tamaño exacto del plano
            while (this.seatingPlan.length < totalDesks) this.seatingPlan.push(null);
            if (this.seatingPlan.length > totalDesks) this.seatingPlan = this.seatingPlan.slice(0, totalDesks);
        } else {
            // Inicialización automática por defecto en pupitres ordenados
            this.seatingPlan = new Array(totalDesks).fill(null);
            courseStudents.forEach((s, idx) => {
                if (idx < totalDesks) this.seatingPlan[idx] = s.id;
            });
        }
    },

    /**
     * Renderizador Maestro
     */
    render() {
        const course = Store.getActiveCourse();
        if (!course) return this.renderEmptyState();

        this.loadState(course.id);

        return `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
                
                .eq-v4-root {
                    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    min-height: calc(100vh - 75px);
                    box-sizing: border-box;
                    background: #f8fafc;
                }

                /* Header Plano Naranja */
                .plano-header-banner {
                    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
                    color: white;
                    padding: 14px 20px 16px 20px;
                    box-shadow: 0 4px 15px rgba(234, 88, 12, 0.25);
                    position: sticky;
                    top: 0;
                    z-index: 40;
                }

                .plano-header-chips {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 10px;
                    flex-wrap: wrap;
                }

                .plano-chip {
                    background: rgba(0, 0, 0, 0.2);
                    backdrop-filter: blur(4px);
                    color: white;
                    padding: 4px 14px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border: 1px solid rgba(255,255,255,0.15);
                }

                /* Selector de las 6 Formas de Organización de Aula (Víctor Arufe) */
                .plano-org-selector-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    background: #ffffff;
                    border-bottom: 1.5px solid #e2e8f0;
                    overflow-x: auto;
                    width: 100%;
                    box-sizing: border-box;
                    scrollbar-width: none;
                    position: sticky;
                    top: 68px;
                    z-index: 35;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
                }
                .plano-org-selector-bar::-webkit-scrollbar {
                    display: none;
                }

                .plano-org-pill {
                    background: #f8fafc;
                    color: #475569;
                    border: 1.5px solid #e2e8f0;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 11.5px;
                    font-weight: 800;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
                    outline: none;
                }

                .plano-org-pill:hover {
                    border-color: #ea580c;
                    color: #ea580c;
                    background: #fff7ed;
                    transform: translateY(-1px);
                }

                .plano-org-pill.active {
                    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
                    color: #ffffff;
                    border-color: #ea580c;
                    box-shadow: 0 3px 10px rgba(234, 88, 12, 0.3);
                }

                /* Cuadrícula de papel milimetrado / plano arquitectónico */
                .plano-floor-canvas {
                    flex: 1;
                    width: 100%;
                    background-color: #f8fafc;
                    background-image: 
                        linear-gradient(#e2e8f0 1.2px, transparent 1.2px), 
                        linear-gradient(90deg, #e2e8f0 1.2px, transparent 1.2px);
                    background-size: 26px 26px;
                    padding: 24px 16px 100px 16px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    overflow-y: auto;
                    position: relative;
                }

                /* Pizarra */
                .plano-pizarra {
                    background: #78350f;
                    color: #ffffff;
                    border: 2px solid #5c2709;
                    border-radius: 9px;
                    padding: 6px 45px;
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    box-shadow: 0 4px 10px rgba(120, 53, 15, 0.35), inset 0 2px 4px rgba(255,255,255,0.15);
                    margin-bottom: 12px;
                    user-select: none;
                }

                /* Mesa del profesor */
                .plano-mesa-profe {
                    background: #ffffff;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 14px;
                    padding: 8px 20px;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
                    display: inline-flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    margin-bottom: 26px;
                    user-select: none;
                }

                /* Pupitre / Tarjeta Alumno */
                .plano-desk-card {
                    background: #ffffff;
                    border-radius: 22px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
                    border: 1.5px solid #e2e8f0;
                    width: 108px;
                    min-height: 118px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 8px;
                    cursor: grab;
                    user-select: none;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                    position: relative;
                    box-sizing: border-box;
                }

                .plano-desk-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.1);
                    border-color: #cbd5e1;
                }

                .plano-desk-card.dragging {
                    opacity: 0.45;
                    transform: scale(0.95);
                    cursor: grabbing;
                }

                .plano-desk-card.selected-tap {
                    border-color: #ea580c !important;
                    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.35), 0 8px 25px rgba(0,0,0,0.12) !important;
                    transform: scale(1.05);
                }

                .plano-desk-slot {
                    position: relative;
                }

                .plano-desk-empty {
                    background: rgba(255, 255, 255, 0.65);
                    border: 2px dashed #cbd5e1;
                    border-radius: 22px;
                    width: 108px;
                    min-height: 118px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-sizing: border-box;
                }

                .plano-desk-empty:hover {
                    border-color: #ea580c;
                    color: #ea580c;
                    background: rgba(254, 243, 199, 0.4);
                }

                .plano-desk-empty.drag-target {
                    border-color: #10b981;
                    background: rgba(209, 250, 229, 0.6);
                    transform: scale(1.04);
                }

                /* Barra de Acciones Inferior Fija */
                .plano-bottom-bar {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: #ffffff;
                    border-top: 1.5px solid #e2e8f0;
                    padding: 8px 16px 12px 16px;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
                    z-index: 50;
                }

                .plano-bar-btn {
                    background: none;
                    border: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                    color: #78350f;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    padding: 4px 16px;
                    border-radius: 12px;
                    transition: all 0.15s ease;
                    outline: none;
                }

                .plano-bar-btn:hover {
                    background: #fef3c7;
                    color: #c2410c;
                }

                .plano-bar-btn:active {
                    transform: scale(0.94);
                }

                /* Botón Flotante FAB */
                .plano-fab-btn {
                    position: fixed;
                    bottom: 84px;
                    right: 24px;
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    background: #ea580c;
                    color: white;
                    display: grid;
                    place-items: center;
                    box-shadow: 0 6px 20px rgba(234, 88, 12, 0.45);
                    cursor: pointer;
                    z-index: 55;
                    border: none;
                    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s;
                }

                .plano-fab-btn:hover {
                    background: #c2410c;
                    transform: scale(1.08);
                }

                .plano-fab-btn:active {
                    transform: scale(0.92);
                }

                /* Drawer lateral/inferior de alumnos */
                .plano-drawer-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(2px);
                    z-index: 60;
                    display: none;
                }

                .plano-drawer-overlay.open {
                    display: block;
                }

                .plano-drawer-card {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    max-height: 75vh;
                    background: #ffffff;
                    border-radius: 28px 28px 0 0;
                    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15);
                    z-index: 61;
                    display: flex;
                    flex-direction: column;
                    padding: 20px 24px;
                    box-sizing: border-box;
                    transform: translateY(100%);
                    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .plano-drawer-card.open {
                    transform: translateY(0);
                }
            </style>

            <div class="eq-v4-root">
                ${this.mode === 'equipos' ? this.renderPlanoHeader(course) : this.renderTraditionalHeader(course)}

                <div class="screen-container" id="eq-screen-container" style="flex:1; display:flex; flex-direction:column; padding:0; overflow:hidden;">
                    ${this.renderActiveScreen()}
                </div>
            </div>
        `;
    },

    getOrganizacionLabel() {
        switch(this.organizacionAula) {
            case 'parejas': return 'En Parejas';
            case 'asamblea': return 'Asamblea (En U)';
            case 'microgrupos': return 'Microgrupos (4-6)';
            case 'tribuna': return 'Tribuna / Pasillo';
            case 'personalizada': return 'Libre';
            case 'clasica':
            default: return '5 Filas Clásicas';
        }
    },

    setOrganizacionAula(tipo) {
        this.organizacionAula = tipo;
        if (tipo === 'clasica') {
            this.gridCols = 5;
        }
        this.saveState();
        this.refreshScreen();
        UI.toast('Organización cambiada a: ' + this.getOrganizacionLabel());
    },

    renderPlanoHeader(course) {
        return `
            <div class="plano-header-banner">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <button onclick="Router.navigate('panel')" style="background: rgba(0,0,0,0.15); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; cursor: pointer;">
                            <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                        </button>
                        <h1 style="font-size: 21px; font-weight: 900; margin: 0; letter-spacing: -0.01em;">Plano de clase</h1>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button class="nav-btn ${this.mode === 'aleatorio' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('aleatorio')" style="color:white; background:rgba(0,0,0,0.18); border-radius:8px; padding:5px 10px;">
                            <i data-lucide="shuffle" style="width:13px;"></i> Sorteo
                        </button>
                        <button class="nav-btn ${this.mode === 'participacion' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('participacion')" style="color:white; background:rgba(0,0,0,0.18); border-radius:8px; padding:5px 10px;">
                            <i data-lucide="clipboard-check" style="width:13px;"></i> Participación
                        </button>
                    </div>
                </div>

                <div class="plano-header-chips">
                    <span class="plano-chip">
                        <i data-lucide="book-open" style="width:13px; height:13px;"></i>
                        <span>${course.asignatura} - ${course.grado} "${course.seccion || 'A'}"</span>
                    </span>
                    <span class="plano-chip" onclick="Views.EquiposTrabajo.openAjustarModal()" style="cursor:pointer;" title="Clic para renombrar o ajustar">
                        <i data-lucide="layout" style="width:13px; height:13px;"></i>
                        <span>${this.planName || 'Plano 1'} • <strong>${this.getOrganizacionLabel()}</strong></span>
                    </span>
                </div>
            </div>

            <!-- Selector de Modelos Pedagógicos de Aula (Víctor Arufe) -->
            <div class="plano-org-selector-bar">
                <button class="plano-org-pill ${this.organizacionAula === 'clasica' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setOrganizacionAula('clasica')">
                    <span>🪑</span><span>5 Filas Clásicas</span>
                </button>
                <button class="plano-org-pill ${this.organizacionAula === 'parejas' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setOrganizacionAula('parejas')">
                    <span>👥</span><span>En Parejas</span>
                </button>
                <button class="plano-org-pill ${this.organizacionAula === 'asamblea' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setOrganizacionAula('asamblea')">
                    <span>🧲</span><span>Asamblea (En U)</span>
                </button>
                <button class="plano-org-pill ${this.organizacionAula === 'microgrupos' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setOrganizacionAula('microgrupos')">
                    <span>🧩</span><span>Microgrupos (4-6)</span>
                </button>
                <button class="plano-org-pill ${this.organizacionAula === 'tribuna' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setOrganizacionAula('tribuna')">
                    <span>🏛️</span><span>Tribuna / Pasillo</span>
                </button>
                <button class="plano-org-pill ${this.organizacionAula === 'personalizada' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setOrganizacionAula('personalizada')">
                    <span>✏️</span><span>Libre</span>
                </button>
            </div>
        `;
    },

    renderTraditionalHeader(course) {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: white; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button class="a360-btn a360-btn-secondary" onclick="Router.navigate('panel')" style="width:36px; height:36px; padding:0; border-radius:10px;">
                        <i data-lucide="arrow-left"></i>
                    </button>
                    <div style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; width:36px; height:36px; border-radius:10px; display:grid; place-items:center;">
                        <i data-lucide="users-2" style="width:18px;"></i>
                    </div>
                    <div>
                        <h1 style="font-size: 18px; font-weight: 900; margin:0; color:#0f172a;">Equipos & Dinámicas</h1>
                        <p style="font-size: 11px; margin:0; color:#64748b;">${course.asignatura} - ${course.grado}</p>
                    </div>
                </div>

                <div style="background: #f1f5f9; padding: 3px; border-radius: 11px; display: flex; gap: 3px;">
                    <button class="nav-btn ${this.mode === 'aleatorio' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('aleatorio')">
                        <i data-lucide="shuffle" style="width:14px;"></i> Sorteo
                    </button>
                    <button class="nav-btn ${this.mode === 'equipos' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('equipos')">
                        <i data-lucide="layout" style="width:14px;"></i> Plano de clase
                    </button>
                    <button class="nav-btn ${this.mode === 'participacion' ? 'active' : ''}" onclick="Views.EquiposTrabajo.setMode('participacion')">
                        <i data-lucide="clipboard-check" style="width:14px;"></i> Participación
                    </button>
                </div>
            </div>
        `;
    },

    renderActiveScreen() {
        switch(this.mode) {
            case 'equipos': return this.screenEquipos();
            case 'aleatorio': return this.screenSorteo();
            case 'participacion': return this.screenParticipacion();
            default: return this.screenEquipos();
        }
    },

    /**
     * PANTALLA PRINCIPAL: PLANO DE CLASE
     */
    screenEquipos() {
        const totalDesks = this.gridCols * this.gridRows;
        const studentMap = {};
        this.students.forEach(s => { studentMap[s.id] = s; });

        const seatedCount = this.seatingPlan.filter(id => Boolean(id && studentMap[id])).length;
        const unassignedCount = this.students.length - seatedCount;

        return `
            <div class="plano-floor-canvas" id="plano-floor-canvas" ondragover="Views.EquiposTrabajo.handleDragOver(event)">
                <!-- Pizarra Frontal -->
                <div class="plano-pizarra">PIZARRA</div>

                <!-- Escritorio del Profesor -->
                <div class="plano-mesa-profe">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 6h16"/>
                        <path d="M4 10h16"/>
                        <path d="M6 10v10"/>
                        <path d="M18 10v10"/>
                    </svg>
                    <span style="font-size: 10px; font-weight: 800; color: #78350f; text-transform: uppercase;">Mesa profe</span>
                </div>

                <!-- Disposición Dinámica según Modelo Pedagógico (Víctor Arufe) -->
                ${this.renderDesksLayout(studentMap)}

                <!-- Floating Action Button (FAB) -->
                <button class="plano-fab-btn" onclick="Views.EquiposTrabajo.quickParticipationPick()" title="Selección rápida / Participación en clase">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <polyline points="16 11 18 13 22 9"/>
                    </svg>
                </button>

                <!-- Barra de Navegación Inferior (4 Botones del Screenshot) -->
                <div class="plano-bottom-bar">
                    <button class="plano-bar-btn" onclick="Views.EquiposTrabajo.openDistribuirModal()">
                        <i data-lucide="sparkles" style="width: 22px; height: 22px;"></i>
                        <span>Distribuir</span>
                    </button>
                    <button class="plano-bar-btn" onclick="Views.EquiposTrabajo.toggleAlumnosDrawer()">
                        <div style="position: relative;">
                            <i data-lucide="users" style="width: 22px; height: 22px;"></i>
                            ${unassignedCount > 0 ? `
                                <span style="position:absolute; top:-4px; right:-8px; background:#ea580c; color:white; font-size:9px; font-weight:900; width:16px; height:16px; border-radius:50%; display:grid; place-items:center;">
                                    ${unassignedCount}
                                </span>
                            ` : ''}
                        </div>
                        <span>Alumnos</span>
                    </button>
                    <button class="plano-bar-btn" onclick="Views.EquiposTrabajo.openVistaModal()">
                        <i data-lucide="sliders-horizontal" style="width: 22px; height: 22px;"></i>
                        <span>Vista</span>
                    </button>
                    <button class="plano-bar-btn" onclick="Views.EquiposTrabajo.openAjustarModal()">
                        <i data-lucide="scan" style="width: 22px; height: 22px;"></i>
                        <span>Ajustar</span>
                    </button>
                </div>

                <!-- Drawer Banco de Alumnos -->
                <div class="plano-drawer-overlay ${this.showAlumnosDrawer ? 'open' : ''}" onclick="Views.EquiposTrabajo.toggleAlumnosDrawer(false)"></div>
                <div class="plano-drawer-card ${this.showAlumnosDrawer ? 'open' : ''}" ondragover="Views.EquiposTrabajo.handleDragOver(event)" ondrop="Views.EquiposTrabajo.handleDropOnDrawer(event)">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                        <div>
                            <h3 style="font-size: 17px; font-weight: 900; color: #0f172a; margin: 0;">Banco de Estudiantes</h3>
                            <p style="font-size: 11.5px; color: #64748b; margin: 2px 0 0 0;">
                                ${seatedCount} en pupitres • <strong style="color:${unassignedCount>0?'#ea580c':'#10b981'};">${unassignedCount} sin asignar</strong>
                            </p>
                        </div>
                        <button onclick="Views.EquiposTrabajo.toggleAlumnosDrawer(false)" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; font-weight: 900; cursor: pointer; color: #475569;">✕</button>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <input type="text" placeholder="Buscar estudiante por nombre..." class="form-control" style="height: 36px; border-radius: 10px; font-size: 12.5px; width:100%; box-sizing:border-box;" oninput="Views.EquiposTrabajo.filterAlumnosDrawer(this.value)">
                    </div>

                    <div id="plano-alumnos-drawer-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; overflow-y: auto; max-height: 48vh; padding-bottom: 10px;">
                        ${this.renderAlumnosDrawerItems()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Selector del Layout de Pupitres según Organización Pedagógica (Víctor Arufe)
     */
    renderDesksLayout(studentMap) {
        switch(this.organizacionAula) {
            case 'parejas':
                return this.renderDesksParejas(studentMap);
            case 'asamblea':
                return this.renderDesksAsamblea(studentMap);
            case 'microgrupos':
                return this.renderDesksMicrogrupos(studentMap);
            case 'tribuna':
                return this.renderDesksTribuna(studentMap);
            case 'personalizada':
            case 'clasica':
            default:
                return this.renderDesksClasica(studentMap);
        }
    },

    /**
     * Renderizador Individual de Pupitre (Tarjeta o Slot Libre)
     */
    renderDeskSlot(idx, studentMap) {
        const studentId = this.seatingPlan[idx];
        const student = studentId ? studentMap[studentId] : null;
        const isSelected = this.selectedDeskIndex === idx;

        // Color según equipo de trabajo si la opción está activa
        let teamBorderColor = '#e2e8f0';
        if (this.viewOptions.colorByTeam) {
            const teamIndex = Math.floor(idx / 4) % this.colors.length;
            teamBorderColor = this.colors[teamIndex];
        }

        if (student) {
            return `
                <div class="plano-desk-slot" data-index="${idx}">
                    <div class="plano-desk-card ${isSelected ? 'selected-tap' : ''}" 
                         style="${this.viewOptions.colorByTeam ? `border-top: 3.5px solid ${teamBorderColor};` : ''}"
                         draggable="true"
                         ondragstart="Views.EquiposTrabajo.handleDragStart(event, '${student.id}', ${idx})"
                         ondragover="Views.EquiposTrabajo.handleDragOver(event)"
                         ondrop="Views.EquiposTrabajo.handleDropOnDesk(event, ${idx})"
                         onclick="Views.EquiposTrabajo.handleDeskClick(${idx})"
                         title="${student.nombreCompleto} (Arrastra a otro pupitre o toca para mover)">
                        
                        <div style="font-size: 10.5px; font-weight: 800; color: #1e293b; text-align: center; line-height: 1.15; max-height: 28px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; width: 100%;">
                            ${this.formatStudentName(student.nombreCompleto)}
                        </div>

                        <div style="width: 48px; height: 48px; border-radius: 50%; background: #3b82f6; display: grid; place-items: center; color: white; margin-top: 4px; box-shadow: 0 2px 8px rgba(59,130,246,0.3); overflow: hidden; border: 2px solid white;">
                            ${student.foto && this.viewOptions.showPhotos ? `
                                <img src="${student.foto}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                <svg style="display:none; width: 24px; height: 24px;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                            ` : `
                                <svg style="width: 26px; height: 26px;" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            `}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="plano-desk-slot" data-index="${idx}">
                    <div class="plano-desk-empty ${isSelected ? 'selected-tap' : ''}" 
                         ondragover="Views.EquiposTrabajo.handleDragOver(event)"
                         ondrop="Views.EquiposTrabajo.handleDropOnDesk(event, ${idx})"
                         onclick="Views.EquiposTrabajo.handleDeskClick(${idx})"
                         title="Pupitre libre #${idx + 1} (Arrastra un alumno aquí o toca para asignar)">
                        <i data-lucide="plus" style="width: 18px; height: 18px; opacity: 0.6;"></i>
                        <span style="font-size: 9.5px; font-weight: 700;">Libre</span>
                    </div>
                </div>
            `;
        }
    },

    /**
     * 1. MODELO CLÁSICO: 5 FILAS / COLUMNAS MIRANDO AL FRENTE
     */
    renderDesksClasica(studentMap) {
        const cols = this.gridCols || 5;
        const totalDesks = cols * (this.gridRows || 6);

        return `
            <div style="display: grid; grid-template-columns: repeat(${cols}, minmax(105px, 120px)); gap: 14px; justify-content: center; width: 100%; max-width: ${cols * 138}px; margin: 0 auto;">
                ${Array.from({ length: totalDesks }).map((_, idx) => this.renderDeskSlot(idx, studentMap)).join('')}
            </div>
        `;
    },

    /**
     * 2. MODELO ACTUAL: EN PAREJAS (FILAS DOBLES CON PASILLOS)
     */
    renderDesksParejas(studentMap) {
        const totalDesks = (this.gridCols || 5) * (this.gridRows || 6);
        const desksPerRow = 4;
        const rowsCount = Math.ceil(totalDesks / desksPerRow);

        return `
            <div style="display: flex; flex-direction: column; gap: 16px; align-items: center; width: 100%; max-width: 600px; margin: 0 auto;">
                ${Array.from({ length: rowsCount }).map((_, rIdx) => {
                    const baseIdx = rIdx * desksPerRow;
                    const d0 = baseIdx;
                    const d1 = baseIdx + 1;
                    const d2 = baseIdx + 2;
                    const d3 = baseIdx + 3;

                    return `
                        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; width: 100%;">
                            <!-- Pareja Izquierda -->
                            <div style="display: flex; gap: 8px; background: rgba(255,255,255,0.5); padding: 5px; border-radius: 20px; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                                ${d0 < totalDesks ? this.renderDeskSlot(d0, studentMap) : ''}
                                ${d1 < totalDesks ? this.renderDeskSlot(d1, studentMap) : ''}
                            </div>

                            <!-- Pasillo Central de Circulación -->
                            <div style="width: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; font-weight: 900; user-select: none;">
                                <span>↕</span>
                            </div>

                            <!-- Pareja Derecha -->
                            <div style="display: flex; gap: 8px; background: rgba(255,255,255,0.5); padding: 5px; border-radius: 20px; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                                ${d2 < totalDesks ? this.renderDeskSlot(d2, studentMap) : ''}
                                ${d3 < totalDesks ? this.renderDeskSlot(d3, studentMap) : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * 3. MODELO ASAMBLEA: EN HERRADURA / FORMA DE U
     */
    renderDesksAsamblea(studentMap) {
        const totalDesks = (this.gridCols || 5) * (this.gridRows || 6);
        const wingSize = Math.max(3, Math.floor((totalDesks - 6) / 2));
        const baseSize = totalDesks - (wingSize * 2);

        const leftIndices = [];
        for (let i = 0; i < wingSize; i++) leftIndices.push(i);

        const baseIndices = [];
        for (let i = wingSize; i < wingSize + baseSize; i++) baseIndices.push(i);

        const rightIndices = [];
        for (let i = wingSize + baseSize; i < totalDesks; i++) rightIndices.push(i);

        return `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 900px; margin: 0 auto; gap: 16px;">
                <!-- Alas Laterales y Centro de Debate -->
                <div style="display: flex; justify-content: space-between; align-items: stretch; width: 100%; gap: 16px;">
                    <!-- Ala Izquierda -->
                    <div style="display: flex; flex-direction: column; gap: 12px; min-width: 110px;">
                        <div style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; text-align: center; background: #ffedd5; padding: 3px 8px; border-radius: 8px;">Ala Izquierda</div>
                        ${leftIndices.map(idx => this.renderDeskSlot(idx, studentMap)).join('')}
                    </div>

                    <!-- Espacio Abierto de Asamblea y Debate -->
                    <div style="flex: 1; margin: 0 10px; border: 2px dashed #cbd5e1; border-radius: 24px; background: rgba(255, 255, 255, 0.65); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 16px; text-align: center; min-height: 280px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);">
                        <div style="width: 52px; height: 52px; border-radius: 50%; background: #ffedd5; color: #ea580c; display: grid; place-items: center; font-size: 24px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(234,88,12,0.15);">
                            🧲
                        </div>
                        <div style="font-weight: 900; font-size: 14px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                            Asamblea en Herradura (U)
                        </div>
                        <div style="font-size: 11.5px; color: #64748b; margin-top: 4px; max-width: 250px; line-height: 1.45;">
                            Visión frontal directa hacia la Pizarra y contacto visual entre todos los estudiantes.
                        </div>
                    </div>

                    <!-- Ala Derecha -->
                    <div style="display: flex; flex-direction: column; gap: 12px; min-width: 110px;">
                        <div style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; text-align: center; background: #ffedd5; padding: 3px 8px; border-radius: 8px;">Ala Derecha</div>
                        ${rightIndices.map(idx => this.renderDeskSlot(idx, studentMap)).join('')}
                    </div>
                </div>

                <!-- Base del Fondo (Cierra la U) -->
                <div style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 6px;">
                    <div style="font-size: 10px; font-weight: 800; color: #ea580c; text-transform: uppercase; background: #ffedd5; padding: 3px 12px; border-radius: 8px;">Fila Posterior de Cierre</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;">
                        ${baseIndices.map(idx => this.renderDeskSlot(idx, studentMap)).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 4. MODELO MICROGRUPOS: MESAS COOPERATIVAS DE 4 A 6 ESTUDIANTES
     */
    renderDesksMicrogrupos(studentMap) {
        const totalDesks = (this.gridCols || 5) * (this.gridRows || 6);
        const mesaSize = 4;
        const totalMesas = Math.ceil(totalDesks / mesaSize);

        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; width: 100%; max-width: 950px; margin: 0 auto;">
                ${Array.from({ length: totalMesas }).map((_, mIdx) => {
                    const color = this.colors[mIdx % this.colors.length];
                    const startIdx = mIdx * mesaSize;
                    const mesaIndices = [];
                    let assignedCount = 0;
                    for (let i = 0; i < mesaSize && (startIdx + i) < totalDesks; i++) {
                        const idx = startIdx + i;
                        mesaIndices.push(idx);
                        if (this.seatingPlan[idx]) assignedCount++;
                    }

                    return `
                        <div style="background: #ffffff; border: 2px solid ${color}33; border-radius: 22px; padding: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; flex-direction: column; gap: 10px;">
                            <!-- Encabezado de la Isla -->
                            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 6px;">
                                <div style="display: flex; align-items: center; gap: 7px;">
                                    <div style="width: 22px; height: 22px; border-radius: 6px; background: ${color}; color: white; display: grid; place-items: center; font-size: 11px; font-weight: 900;">
                                        ${mIdx + 1}
                                    </div>
                                    <span style="font-size: 12px; font-weight: 900; color: #0f172a;">Mesa Cooperativa ${mIdx + 1}</span>
                                </div>
                                <span style="font-size: 10px; font-weight: 800; background: ${color}15; color: ${color}; padding: 2px 8px; border-radius: 12px;">
                                    ${assignedCount}/${mesaIndices.length} alumnos
                                </span>
                            </div>

                            <!-- Pupitres agrupados 2x2 enfrentados -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; justify-items: center;">
                                ${mesaIndices.map(idx => this.renderDeskSlot(idx, studentMap)).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * 5. MODELO TRIBUNA: DOS BLOQUES ENFRENTADOS CON PASILLO CENTRAL
     */
    renderDesksTribuna(studentMap) {
        const totalDesks = (this.gridCols || 5) * (this.gridRows || 6);
        const half = Math.ceil(totalDesks / 2);
        const leftIndices = [];
        for (let i = 0; i < half; i++) leftIndices.push(i);
        const rightIndices = [];
        for (let i = half; i < totalDesks; i++) rightIndices.push(i);

        return `
            <div style="display: flex; align-items: flex-start; justify-content: center; width: 100%; max-width: 920px; margin: 0 auto; gap: 16px;">
                <!-- Bloque Lateral Izquierdo -->
                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.45); padding: 12px; border-radius: 20px; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="font-size: 11px; font-weight: 900; color: #0369a1; text-transform: uppercase; text-align: center; background: #e0f2fe; padding: 4px; border-radius: 8px;">
                        🏛️ Bloque A (Izquierda)
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, minmax(105px, 120px)); gap: 10px; justify-content: center;">
                        ${leftIndices.map(idx => this.renderDeskSlot(idx, studentMap)).join('')}
                    </div>
                </div>

                <!-- Pasillo Central de Intervención -->
                <div style="width: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; color: #94a3b8; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; user-select: none;">
                    <div style="writing-mode: vertical-rl; transform: rotate(180deg); display: flex; align-items: center; gap: 8px;">
                        <span>◀</span>
                        <span>PASILLO CENTRAL</span>
                        <span>▶</span>
                    </div>
                </div>

                <!-- Bloque Lateral Derecho -->
                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.45); padding: 12px; border-radius: 20px; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="font-size: 11px; font-weight: 900; color: #7c3aed; text-transform: uppercase; text-align: center; background: #ede9fe; padding: 4px; border-radius: 8px;">
                        🏛️ Bloque B (Derecha)
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, minmax(105px, 120px)); gap: 10px; justify-content: center;">
                        ${rightIndices.map(idx => this.renderDeskSlot(idx, studentMap)).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    formatStudentName(fullName) {
        if (!fullName) return 'Estudiante';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return `${parts[0]}<br>${parts[1]}`;
        // Para nombres compuestos largos: Nombre 1 + Apellido 1
        return `${parts[0]}<br>${parts[2] || parts[1]}`;
    },

    renderAlumnosDrawerItems() {
        const query = (this.alumnosSearch || '').toLowerCase().trim();
        const filtered = this.students.filter(s => !query || s.nombreCompleto.toLowerCase().includes(query));

        return filtered.map(s => {
            const deskIdx = this.seatingPlan.indexOf(s.id);
            const isAssigned = deskIdx >= 0;

            return `
                <div style="background: ${isAssigned ? '#f8fafc' : '#ffffff'}; border: 1.5px solid ${isAssigned ? '#e2e8f0' : '#ea580c'}; border-radius: 14px; padding: 10px 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: grab; user-select: none; box-shadow: ${isAssigned ? 'none' : '0 2px 8px rgba(234,88,12,0.15)'};"
                     draggable="true"
                     ondragstart="Views.EquiposTrabajo.handleDragStart(event, '${s.id}', ${isAssigned ? deskIdx : -1})"
                     onclick="Views.EquiposTrabajo.assignStudentToFirstFreeDesk('${s.id}')">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; display: grid; place-items: center; color: white; font-weight: 800; font-size: 13px;">
                        ${s.nombreCompleto.charAt(0)}
                    </div>
                    <div style="font-size: 11px; font-weight: 800; color: #1e293b; text-align: center; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
                        ${s.nombreCompleto.split(' ')[0]} ${s.nombreCompleto.split(' ')[1] || ''}
                    </div>
                    <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 5px; ${isAssigned ? 'background:#e2e8f0; color:#64748b;' : 'background:#ffedd5; color:#ea580c;'}">
                        ${isAssigned ? `Pupitre #${deskIdx + 1}` : 'Sin Pupitre'}
                    </span>
                </div>
            `;
        }).join('');
    },

    filterAlumnosDrawer(val) {
        this.alumnosSearch = val;
        const el = document.getElementById('plano-alumnos-drawer-list');
        if (el) el.innerHTML = this.renderAlumnosDrawerItems();
    },

    toggleAlumnosDrawer(forceState) {
        this.showAlumnosDrawer = (forceState !== undefined) ? forceState : !this.showAlumnosDrawer;
        this.refreshScreen();
    },

    assignStudentToFirstFreeDesk(studentId) {
        const freeIndex = this.seatingPlan.indexOf(null);
        if (freeIndex === -1) {
            return UI.toast('No hay pupitres vacíos en el plano. Ajusta el tamaño para agregar más.', 'warning');
        }
        const prevIdx = this.seatingPlan.indexOf(studentId);
        if (prevIdx >= 0) this.seatingPlan[prevIdx] = null;

        this.seatingPlan[freeIndex] = studentId;
        this.saveState();
        this.refreshScreen();
        UI.toast('Estudiante asignado al pupitre #' + (freeIndex + 1));
    },

    /**
     * Drag & Drop Handlers
     */
    handleDragStart(e, studentId, fromIndex) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ studentId, fromIndex }));
        e.dataTransfer.effectAllowed = 'move';
        this.selectedDeskIndex = null;
    },

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    handleDropOnDesk(e, targetIndex) {
        e.preventDefault();
        e.stopPropagation();
        try {
            const raw = e.dataTransfer.getData('text/plain');
            if (!raw) return;
            const data = JSON.parse(raw);
            const { studentId, fromIndex } = data;

            if (fromIndex !== undefined && fromIndex !== null && fromIndex >= 0) {
                // Intercambiar (swap) pupitres
                const targetStudentId = this.seatingPlan[targetIndex];
                this.seatingPlan[targetIndex] = studentId;
                this.seatingPlan[fromIndex] = targetStudentId;
            } else {
                // Viene desde el banco de alumnos
                const prev = this.seatingPlan.indexOf(studentId);
                if (prev >= 0) this.seatingPlan[prev] = null;
                this.seatingPlan[targetIndex] = studentId;
            }

            this.saveState();
            this.refreshScreen();
            this.play('click');
            UI.toast('Ubicación actualizada');
        } catch(err) {
            console.error('Drop error:', err);
        }
    },

    handleDropOnDrawer(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
            const raw = e.dataTransfer.getData('text/plain');
            if (!raw) return;
            const data = JSON.parse(raw);
            const { fromIndex } = data;

            if (fromIndex !== undefined && fromIndex !== null && fromIndex >= 0) {
                this.seatingPlan[fromIndex] = null;
                this.saveState();
                this.refreshScreen();
                this.play('click');
                UI.toast('Estudiante devuelto al banco');
            }
        } catch(err) {
            console.error('Drawer drop error:', err);
        }
    },

    /**
     * Touch / Click Tap-to-Swap (para Tablets y Smartphones)
     */
    handleDeskClick(index) {
        if (this.selectedDeskIndex === null) {
            if (this.seatingPlan[index]) {
                this.selectedDeskIndex = index;
                this.refreshScreen();
                UI.toast('Seleccionado. Toca otro pupitre para intercambiar o mover.');
            }
        } else {
            if (this.selectedDeskIndex === index) {
                this.selectedDeskIndex = null;
                this.refreshScreen();
            } else {
                const sourceId = this.seatingPlan[this.selectedDeskIndex];
                const targetId = this.seatingPlan[index];
                this.seatingPlan[index] = sourceId;
                this.seatingPlan[this.selectedDeskIndex] = targetId;
                this.selectedDeskIndex = null;
                this.saveState();
                this.refreshScreen();
                this.play('click');
                UI.toast('Pupitres intercambiados');
            }
        }
    },

    /**
     * MODAL 1: DISTRIBUIR
     */
    openDistribuirModal() {
        UI.modal('✨ Distribuir Plano de Clase', `
            <div style="display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">
                <p style="font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 8px;">
                    Seleccione el método automático para organizar a los estudiantes en los pupitres:
                </p>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button onclick="Views.EquiposTrabajo.distribuir('azar')" class="a360-btn a360-btn-secondary" style="justify-content: flex-start; padding: 10px 14px; border-radius: 12px; height: auto;">
                        <div style="background: #fef3c7; color: #d97706; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; margin-right: 12px;">
                            <i data-lucide="shuffle"></i>
                        </div>
                        <div style="text-align: left;">
                            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">Distribución al Azar</div>
                            <div style="font-size: 10.5px; color: #64748b;">Mezcla aleatoriamente todos los alumnos en el plano</div>
                        </div>
                    </button>

                    <button onclick="Views.EquiposTrabajo.distribuir('alfabetico')" class="a360-btn a360-btn-secondary" style="justify-content: flex-start; padding: 10px 14px; border-radius: 12px; height: auto;">
                        <div style="background: #e0f2fe; color: #0284c7; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; margin-right: 12px;">
                            <i data-lucide="arrow-down-a-z"></i>
                        </div>
                        <div style="text-align: left;">
                            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">Por Orden Alfabético</div>
                            <div style="font-size: 10.5px; color: #64748b;">Ubica a los alumnos fila por fila según orden de lista</div>
                        </div>
                    </button>

                    <button onclick="Views.EquiposTrabajo.distribuir('genero')" class="a360-btn a360-btn-secondary" style="justify-content: flex-start; padding: 10px 14px; border-radius: 12px; height: auto;">
                        <div style="background: #fce7f3; color: #db2777; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; margin-right: 12px;">
                            <i data-lucide="scale"></i>
                        </div>
                        <div style="text-align: left;">
                            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">Equilibrado por Género</div>
                            <div style="font-size: 10.5px; color: #64748b;">Alterna estudiantes masculinos y femeninos por pupitre</div>
                        </div>
                    </button>

                    <button onclick="Views.EquiposTrabajo.distribuir('vaciar')" class="a360-btn a360-btn-secondary" style="justify-content: flex-start; padding: 10px 14px; border-radius: 12px; height: auto; border-color: #fecaca;">
                        <div style="background: #fee2e2; color: #dc2626; width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center; margin-right: 12px;">
                            <i data-lucide="trash-2"></i>
                        </div>
                        <div style="text-align: left;">
                            <div style="font-weight: 800; font-size: 13px; color: #dc2626;">Vaciar todos los pupitres</div>
                            <div style="font-size: 10.5px; color: #ef4444;">Mueve todos los alumnos al banco sin asignar</div>
                        </div>
                    </button>
                </div>

                <div style="font-size: 11px; font-weight: 900; color: #ea580c; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 10px; margin-bottom: 2px;">
                    Cambiar Forma de Organización del Aula
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button onclick="Views.EquiposTrabajo.setOrganizacionAula('clasica'); UI.closeModal();" class="a360-btn a360-btn-secondary" style="font-size: 11px; padding: 8px 10px; justify-content: flex-start; text-align: left; height: auto;">
                        🪑 5 Filas Clásicas
                    </button>
                    <button onclick="Views.EquiposTrabajo.setOrganizacionAula('parejas'); UI.closeModal();" class="a360-btn a360-btn-secondary" style="font-size: 11px; padding: 8px 10px; justify-content: flex-start; text-align: left; height: auto;">
                        👥 En Parejas
                    </button>
                    <button onclick="Views.EquiposTrabajo.setOrganizacionAula('asamblea'); UI.closeModal();" class="a360-btn a360-btn-secondary" style="font-size: 11px; padding: 8px 10px; justify-content: flex-start; text-align: left; height: auto;">
                        🧲 Asamblea en U
                    </button>
                    <button onclick="Views.EquiposTrabajo.setOrganizacionAula('microgrupos'); UI.closeModal();" class="a360-btn a360-btn-secondary" style="font-size: 11px; padding: 8px 10px; justify-content: flex-start; text-align: left; height: auto;">
                        🧩 Microgrupos (4-6)
                    </button>
                    <button onclick="Views.EquiposTrabajo.setOrganizacionAula('tribuna'); UI.closeModal();" class="a360-btn a360-btn-secondary" style="font-size: 11px; padding: 8px 10px; justify-content: flex-start; text-align: left; height: auto;">
                        🏛️ Tribuna (Pasillo)
                    </button>
                    <button onclick="Views.EquiposTrabajo.setOrganizacionAula('personalizada'); UI.closeModal();" class="a360-btn a360-btn-secondary" style="font-size: 11px; padding: 8px 10px; justify-content: flex-start; text-align: left; height: auto;">
                        ✏️ Libre / Custom
                    </button>
                </div>
            </div>
        `, '', { dialog: true });
    },

    distribuir(criterio) {
        const totalDesks = this.gridCols * this.gridRows;
        this.seatingPlan = new Array(totalDesks).fill(null);

        if (criterio === 'vaciar') {
            this.saveState();
            UI.closeModal();
            this.refreshScreen();
            return UI.toast('Plano vaciado');
        }

        let sorted = [...this.students];
        if (criterio === 'azar') {
            sorted = this.shuffle(sorted);
        } else if (criterio === 'alfabetico') {
            sorted.sort((a,b) => (a.nombreCompleto || '').localeCompare(b.nombreCompleto || ''));
        } else if (criterio === 'genero') {
            const m = sorted.filter(s => (s.genero || 'M').toUpperCase().startsWith('M'));
            const f = sorted.filter(s => (s.genero || '').toUpperCase().startsWith('F'));
            const alt = [];
            const maxL = Math.max(m.length, f.length);
            for (let i = 0; i < maxL; i++) {
                if (m[i]) alt.push(m[i]);
                if (f[i]) alt.push(f[i]);
            }
            sorted = alt;
        }

        sorted.forEach((s, idx) => {
            if (idx < totalDesks) this.seatingPlan[idx] = s.id;
        });

        this.saveState();
        UI.closeModal();
        this.refreshScreen();
        this.play('win');
        UI.toast('Plano redistribuido correctamente');
    },

    /**
     * MODAL 2: VISTA
     */
    openVistaModal() {
        UI.modal('👁️ Opciones de Vista del Plano', `
            <div style="display: flex; flex-direction: column; gap: 14px; padding: 10px 0;">
                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border-radius: 12px; cursor: pointer; border: 1px solid #e2e8f0;">
                    <div>
                        <div style="font-size: 13.5px; font-weight: 800; color: #0f172a;">Mostrar fotos de estudiantes</div>
                        <div style="font-size: 11px; color: #64748b;">Si está desactivado muestra el avatar vectorial</div>
                    </div>
                    <input type="checkbox" id="chk-vista-fotos" ${this.viewOptions.showPhotos ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #ea580c;">
                </label>

                <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border-radius: 12px; cursor: pointer; border: 1px solid #e2e8f0;">
                    <div>
                        <div style="font-size: 13.5px; font-weight: 800; color: #0f172a;">Colorear tarjetas por equipos</div>
                        <div style="font-size: 11px; color: #64748b;">Destaca los grupos de trabajo con bordes temáticos</div>
                    </div>
                    <input type="checkbox" id="chk-vista-colores" ${this.viewOptions.colorByTeam ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #ea580c;">
                </label>

                <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                    <button class="a360-btn a360-btn-primary" onclick="Views.EquiposTrabajo.saveVistaOptions()" style="background: #ea580c; border-radius: 10px;">Aplicar cambios</button>
                </div>
            </div>
        `, '', { dialog: true });
    },

    saveVistaOptions() {
        const chkPhotos = document.getElementById('chk-vista-fotos');
        const chkColors = document.getElementById('chk-vista-colores');
        if (chkPhotos) this.viewOptions.showPhotos = chkPhotos.checked;
        if (chkColors) this.viewOptions.colorByTeam = chkColors.checked;
        this.saveState();
        UI.closeModal();
        this.refreshScreen();
        UI.toast('Preferencias de vista guardadas');
    },

    /**
     * MODAL 3: AJUSTAR PLANO
     */
    openAjustarModal() {
        UI.modal('📐 Ajustar Dimensiones del Plano', `
            <div style="display: flex; flex-direction: column; gap: 14px; padding: 10px 0;">
                <div>
                    <label class="form-label" style="font-weight: 800; font-size: 11px; color: #64748b; text-transform: uppercase;">Nombre de la distribución</label>
                    <input type="text" id="ajuste-nombre-plano" class="form-control" value="${this.planName || 'Plano 1'}" style="height: 38px; border-radius: 10px;">
                </div>

                <div>
                    <label class="form-label" style="font-weight: 800; font-size: 11px; color: #64748b; text-transform: uppercase;">Forma de Organización (Víctor Arufe)</label>
                    <select id="ajuste-org" class="form-control" style="height: 38px; border-radius: 10px; font-weight: 700;">
                        <option value="clasica" ${this.organizacionAula === 'clasica' ? 'selected' : ''}>🪑 5 Filas Clásicas (Tradicional al frente)</option>
                        <option value="parejas" ${this.organizacionAula === 'parejas' ? 'selected' : ''}>👥 En Parejas (Filas dobles con pasillos)</option>
                        <option value="asamblea" ${this.organizacionAula === 'asamblea' ? 'selected' : ''}>🧲 Asamblea / Herradura (En U para debate)</option>
                        <option value="microgrupos" ${this.organizacionAula === 'microgrupos' ? 'selected' : ''}>🧩 Microgrupos (Mesas cooperativas de 4-6)</option>
                        <option value="tribuna" ${this.organizacionAula === 'tribuna' ? 'selected' : ''}>🏛️ Tribuna (Dos bloques con pasillo central)</option>
                        <option value="personalizada" ${this.organizacionAula === 'personalizada' ? 'selected' : ''}>✏️ Libre / Personalizada</option>
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <label class="form-label" style="font-weight: 800; font-size: 11px; color: #64748b; text-transform: uppercase;">Columnas de pupitres</label>
                        <select id="ajuste-cols" class="form-control" style="height: 38px; border-radius: 10px; font-weight: 700;">
                            <option value="3" ${this.gridCols === 3 ? 'selected' : ''}>3 Columnas</option>
                            <option value="4" ${this.gridCols === 4 ? 'selected' : ''}>4 Columnas</option>
                            <option value="5" ${this.gridCols === 5 || !this.gridCols ? 'selected' : ''}>5 Columnas (5 Filas - Estándar)</option>
                            <option value="6" ${this.gridCols === 6 ? 'selected' : ''}>6 Columnas</option>
                            <option value="7" ${this.gridCols === 7 ? 'selected' : ''}>7 Columnas</option>
                        </select>
                    </div>

                    <div>
                        <label class="form-label" style="font-weight: 800; font-size: 11px; color: #64748b; text-transform: uppercase;">Filas del aula</label>
                        <select id="ajuste-rows" class="form-control" style="height: 38px; border-radius: 10px; font-weight: 700;">
                            <option value="4" ${this.gridRows === 4 ? 'selected' : ''}>4 Filas</option>
                            <option value="5" ${this.gridRows === 5 ? 'selected' : ''}>5 Filas</option>
                            <option value="6" ${this.gridRows === 6 || !this.gridRows ? 'selected' : ''}>6 Filas (Estándar)</option>
                            <option value="7" ${this.gridRows === 7 ? 'selected' : ''}>7 Filas</option>
                            <option value="8" ${this.gridRows === 8 ? 'selected' : ''}>8 Filas</option>
                        </select>
                    </div>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-size: 12px; color: #475569;">
                    <strong style="color:#0f172a;">Capacidad total:</strong> <span id="ajuste-preview-capacidad">${(this.gridCols || 5) * (this.gridRows || 6)}</span> pupitres para ${this.students.length} estudiantes matriculados.
                </div>

                <div style="margin-top: 6px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="a360-btn a360-btn-secondary" onclick="UI.closeModal()" style="border-radius: 10px;">Cancelar</button>
                    <button class="a360-btn a360-btn-primary" onclick="Views.EquiposTrabajo.saveAjustarPlano()" style="background: #ea580c; border-radius: 10px;">Guardar plano</button>
                </div>
            </div>
        `, '', { dialog: true });
    },

    saveAjustarPlano() {
        const nameInp = document.getElementById('ajuste-nombre-plano');
        const orgSel = document.getElementById('ajuste-org');
        const colsSel = document.getElementById('ajuste-cols');
        const rowsSel = document.getElementById('ajuste-rows');

        if (nameInp && nameInp.value.trim()) this.planName = nameInp.value.trim();
        if (orgSel) this.organizacionAula = orgSel.value;
        const newCols = colsSel ? parseInt(colsSel.value) : this.gridCols;
        const newRows = rowsSel ? parseInt(rowsSel.value) : this.gridRows;

        this.gridCols = newCols;
        this.gridRows = newRows;
        const totalDesks = newCols * newRows;

        // Ajustar array conservando ubicaciones
        while (this.seatingPlan.length < totalDesks) this.seatingPlan.push(null);
        if (this.seatingPlan.length > totalDesks) this.seatingPlan = this.seatingPlan.slice(0, totalDesks);

        this.saveState();
        UI.closeModal();
        this.refreshScreen();
        UI.toast('Dimensiones y organización actualizadas');
    },

    /**
     * Selección rápida para participación (FAB)
     */
    quickParticipationPick() {
        const occupiedIndices = [];
        this.seatingPlan.forEach((id, idx) => {
            if (id) occupiedIndices.push(idx);
        });

        if (occupiedIndices.length === 0) {
            return UI.toast('Ubica primero a los alumnos en el plano para seleccionar.', 'info');
        }

        const pickedIndex = occupiedIndices[Math.floor(Math.random() * occupiedIndices.length)];
        const studentId = this.seatingPlan[pickedIndex];
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        this.selectedDeskIndex = pickedIndex;
        this.refreshScreen();
        this.play('win');

        // Scroll suave hacia el pupitre
        const deskEl = document.querySelector(`.plano-desk-slot[data-index="${pickedIndex}"]`);
        if (deskEl) deskEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        UI.modal('🎉 ¡Turno de Participación! 🎉', `
            <div style="text-align: center; padding: 24px 10px;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: #ea580c; color: white; display: grid; place-items: center; margin: 0 auto 16px auto; box-shadow: 0 4px 15px rgba(234,88,12,0.35);">
                    <i data-lucide="mic" style="width: 32px; height: 32px;"></i>
                </div>
                <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0;">${student.nombreCompleto}</h2>
                <p style="font-size: 13px; color: #ea580c; font-weight: 800; margin: 0 0 20px 0;">Pupitre #${pickedIndex + 1}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="a360-btn a360-btn-secondary" onclick="UI.closeModal()">Cerrar</button>
                    <button class="a360-btn a360-btn-primary" style="background: #10b981;" onclick="Views.EquiposTrabajo.addParticipation('${student.id}', 1); UI.closeModal();">
                        <i data-lucide="check"></i> Sumar Punto Participación
                    </button>
                </div>
            </div>
        `, '', { dialog: true });
    },

    /**
     * Refresca solo la pantalla actual sin resetear estado
     */
    refreshScreen() {
        const container = document.getElementById('eq-screen-container');
        if (container) {
            container.innerHTML = this.renderActiveScreen();
            if (window.lucide) window.lucide.createIcons();
        } else {
            Router.render();
        }
    },

    setMode(m) {
        this.mode = m;
        this.saveState();
        Router.render();
    },

    /**
     * PANTALLA 1: SORTEO RÁPIDO (RULETA)
     */
    screenSorteo() {
        const pool = this.students.filter(s => !this.excludedIds.has(s.id));
        return `
            <div class="sorteo-grid" style="display:grid; grid-template-columns: 1fr 280px; gap:16px; padding:16px; height:100%; box-sizing:border-box;">
                <div class="wheel-outer-box" style="background:white; border-radius:24px; padding:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:1px solid #e2e8f0; position:relative;">
                    <div class="wheel-wrap" style="position:relative; width:min(70vw, 420px); height:min(70vw, 420px); display:flex; align-items:center; justify-content:center;">
                        <svg style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); z-index: 10;" width="26" height="34" viewBox="0 0 50 60">
                            <path d="M25 60L50 0H0L25 60Z" fill="#1e293b" stroke="white" stroke-width="3"/>
                        </svg>
                        <canvas id="wheel-canvas" width="1000" height="1000" style="width: 100%; height: 100%; border-radius: 50%;"></canvas>
                        <button onclick="Views.EquiposTrabajo.spin()" style="position: absolute; width: 70px; height: 70px; border-radius: 50%; background: white; border: 4px solid var(--primary); font-weight: 900; font-size: 13px; color: var(--primary); cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">GIRAR</button>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div style="background: white; border-radius: 20px; padding: 16px; border: 1px solid #e2e8f0;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <h4 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin:0;">Historial</h4>
                            <button onclick="Views.EquiposTrabajo.resetPool()" style="background:none; border:none; color:var(--primary); font-size:9px; font-weight:900; cursor:pointer;">REINICIAR</button>
                        </div>
                        <div id="sorteo-history" style="max-height: 140px; overflow-y: auto;">${this.renderHistory()}</div>
                    </div>
                    <div style="background: white; border-radius: 20px; padding: 16px; border: 1px solid #e2e8f0; flex: 1;">
                        <h4 style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px;">Estudiantes Disponibles (${pool.length})</h4>
                        <div style="max-height: 240px; overflow-y: auto;">${this.renderSimpleList()}</div>
                    </div>
                </div>
            </div>
        `;
    },

    spin() {
        if (this.isSpinning) return;
        const pool = this.students.filter(s => !this.excludedIds.has(s.id));
        if (pool.length === 0) return UI.toast('¡Todos los estudiantes ya salieron! Reinicia para volver a empezar.');
        if (pool.length < 2) {
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
            this.excludedIds.add(winner.id);
            this.history.push(winner.nombreCompleto);
            this.play('win');
            this.saveState();
            Router.render();
        }

        UI.modal('🎉 ¡Ganador! 🎉', `
            <div style="text-align:center; padding:24px 10px;">
                <div style="width:80px; height:80px; background:#10b981; border-radius:50%; display:grid; place-items:center; margin:0 auto 16px auto; color:white;">
                    <i data-lucide="trophy" style="width:40px; height:40px;"></i>
                </div>
                <h2 style="font-size:26px; font-weight:900; margin:0 0 6px 0;">${winner.nombreCompleto}</h2>
                <p style="color:#64748b; font-size:12.5px; margin:0 0 20px 0;">Ha sido seleccionado en la ruleta.</p>
                <button class="a360-btn a360-btn-primary" style="width:100%; height:44px; border-radius:12px;" onclick="UI.closeModal()">Continuar</button>
            </div>
        `, '', { dialog: true });
    },

    resetPool() {
        this.excludedIds = new Set();
        this.history = [];
        this.saveState();
        Router.render();
        UI.toast('¡Ruleta reiniciada!');
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

    renderHistory() {
        if (!this.history.length) return '<div style="font-size:11px; color:#94a3b8; text-align:center; padding:10px;">Sin historial aún</div>';
        return this.history.slice(-5).reverse().map(n => `<div style="padding:8px 12px; background:#f8fafc; border-radius:10px; margin-bottom:6px; font-size:11.5px; font-weight:800; border-left:3px solid var(--primary);">${n}</div>`).join('');
    },

    renderSimpleList() {
        return this.students.map(s => `<div onclick="Views.EquiposTrabajo.toggleEx('${s.id}')" style="padding:7px 10px; background:#f8fafc; border-radius:8px; margin-bottom:5px; font-size:11px; font-weight:700; cursor:pointer; opacity:${this.excludedIds.has(s.id)?0.35:1};">${s.nombreCompleto}</div>`).join('');
    },

    toggleEx(id) { 
        if(this.excludedIds.has(id)) this.excludedIds.delete(id); else this.excludedIds.add(id); 
        this.saveState();
        Router.render(); 
    },

    /**
     * PANTALLA 3: PARTICIPACIÓN
     */
    screenParticipacion() {
        return `
            <div style="background: white; border-radius: 24px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin: 16px; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h2 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a;">Control de Participación</h2>
                        <p style="color:#64748b; font-size:12px; margin:2px 0 0 0;">Registro acumulativo de intervenciones en clase.</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="a360-btn a360-btn-secondary" onclick="Views.EquiposTrabajo.downloadReport()"><i data-lucide="download"></i> Reporte</button>
                        <button class="a360-btn a360-btn-primary" style="background:#ea580c;" onclick="Views.EquiposTrabajo.quickParticipationPick()"><i data-lucide="zap"></i> Al Azar</button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;">
                    ${this.students.map(s => {
                        const count = this.participationData[s.id] || 0;
                        return `
                            <div style="background: #f8fafc; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1.5px solid ${count > 0 ? '#10b981' : '#e2e8f0'};">
                                <div style="width:42px; height:42px; background:white; border-radius:12px; display:grid; place-items:center; font-weight:900; font-size:16px; color:#3b82f6; margin-bottom:8px; border:1px solid #e2e8f0;">
                                    ${s.nombreCompleto.charAt(0)}
                                </div>
                                <h5 style="font-size:12.5px; font-weight:800; margin:0; color:#1e293b; line-height:1.2; height:30px; overflow:hidden;">${s.nombreCompleto}</h5>
                                <div style="display:flex; gap:8px; margin-top:12px; align-items:center;">
                                    <button onclick="Views.EquiposTrabajo.addParticipation('${s.id}', -1)" style="width:28px; height:28px; border-radius:8px; border:1px solid #cbd5e1; background:white; cursor:pointer; font-weight:800;">-</button>
                                    <span style="font-size:18px; font-weight:900; color:#10b981; min-width:28px;">${count}</span>
                                    <button onclick="Views.EquiposTrabajo.addParticipation('${s.id}', 1)" style="width:28px; height:28px; border-radius:8px; border:none; background:#10b981; color:white; cursor:pointer; font-weight:800;">+</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    addParticipation(id, val) { 
        this.participationData[id] = Math.max(0, (this.participationData[id] || 0) + val); 
        this.play('click');
        this.saveState();
        this.refreshScreen();
    },

    shuffle(a) { 
        for(let i=a.length-1; i>0; i--){ 
            const j=Math.floor(Math.random()*(i+1)); 
            [a[i],a[j]]=[a[j],a[i]]; 
        } 
        return a; 
    },

    downloadReport() {
        const course = Store.getActiveCourse();
        let content = `REPORTE DE PLANO DE CLASE Y PARTICIPACIÓN\nCurso: ${course.asignatura || 'Sin Nombre'}\nFecha: ${new Date().toLocaleDateString()}\nPlano: ${this.planName || 'Plano 1'}\n\n`;
        
        content += "--- UBICACIÓN EN PUPITRES ---\n";
        this.seatingPlan.forEach((studentId, idx) => {
            const st = this.students.find(s => s.id === studentId);
            content += `Pupitre #${idx + 1}: ${st ? st.nombreCompleto : '(Vacío)'}\n`;
        });
        
        content += "\n--- REGISTRO DE PARTICIPACIÓN ---\n";
        this.students.forEach(s => {
            const count = this.participationData[s.id] || 0;
            content += `${s.nombreCompleto}: ${count} participación(es)\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Plano_Clase_${(course.asignatura || 'Curso').replace(/\s+/g, '_')}.txt`;
        a.click();
        UI.toast('Reporte descargado correctamente');
    },

    renderEmptyState() { 
        return `
            <div style="text-align:center; padding:80px; background:white; border-radius:30px; border: 1px solid var(--border-soft); box-shadow: var(--shadow-sm); margin:20px;">
                <div style="width:80px; height:80px; background:#fff7ed; color:#ea580c; border-radius:24px; display:grid; place-items:center; margin:0 auto 24px;">
                    <i data-lucide="layout" style="width:40px; height:40px;"></i>
                </div>
                <h2 style="font-weight:900; color:var(--text-main); margin-bottom:12px;">Selecciona un curso para ver el Plano de Clase</h2>
                <p style="color:var(--text-muted); margin-bottom:30px; max-width:320px; margin-left:auto; margin-right:auto;">Para organizar los pupitres y equipos, primero debes cargar los estudiantes de un curso.</p>
                <button class="a360-btn a360-btn-primary" style="background:#ea580c; padding:12px 35px; border-radius:16px; font-weight:800;" onclick="window.openCourseSelector('equipos-trabajo')">
                    <i data-lucide="external-link"></i> Cargar Curso
                </button>
            </div>
        `; 
    },

    onMount() { 
        if(window.lucide) window.lucide.createIcons(); 
        if(this.mode === 'aleatorio') setTimeout(() => this.draw(), 50); 
    },

    /* ==========================================================================
       HORARIO DE ASEO SEMANAL (ROLES Y COMISIONES DE LIMPIEZA)
       ========================================================================== */

    getStudentGender(student) {
        if (!student) return 'M';
        if (student.genero) {
            const g = student.genero.toString().toUpperCase().trim();
            if (g.startsWith('F')) return 'F';
            if (g.startsWith('M')) return 'M';
        }
        const cleanName = (student.nombreCompleto || '').trim().split(' ')[0].toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const femaleNames = new Set([
            'alexa', 'anyeli', 'aylin', 'aracey', 'maria', 'ana', 'carmen', 'laura', 'sofia', 
            'isabella', 'valeria', 'genesis', 'ashley', 'fatima', 'daniela', 'andrea', 'danna', 
            'abigail', 'stephanie', 'mia', 'zoe', 'ariana', 'gabriela', 'melanie', 'keyla', 
            'britany', 'katherine', 'cindy', 'nayeli', 'marjorie', 'emily', 'lucia', 'elena',
            'claudia', 'karla', 'miriam', 'glenda', 'rebeca', 'brenda', 'paola', 'diana',
            'wendy', 'johana', 'yosselyn', 'lesly', 'silvia', 'yulissa', 'sarahi', 'belen'
        ]);
        if (femaleNames.has(cleanName)) return 'F';
        if (cleanName.endsWith('a') && !['joshua', 'luca', 'elias', 'isaias', 'noah'].includes(cleanName)) return 'F';
        return 'M';
    },

    getInitials(name) {
        if (!name) return '??';
        const parts = String(name).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '??';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    },

    formatAseoStudentName(fullName) {
        if (!fullName) return 'Estudiante';
        const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
        if (parts.length <= 2) return parts.join(' ');
        return `${parts[0]} ${parts[2] || parts[1]}`;
    },

    getActiveAseoCourse() {
        return (typeof Store !== 'undefined' && Store.getActiveCourse) ? Store.getActiveCourse() : null;
    },

    initAseoCourse(courseId = null) {
        if (courseId && typeof Store !== 'undefined' && Store.setActiveCourse) {
            Store.setActiveCourse(courseId);
            Store.save();
            if (window.UI && UI.updateHeader) UI.updateHeader();
        }
        const course = this.getActiveAseoCourse();
        if (course && course.id) {
            const isGuia = (typeof Store !== 'undefined' && Store.isMaestroGuia) ? Store.isMaestroGuia(course.id) : false;
            if (isGuia) {
                this.students = (typeof Store !== 'undefined' && Store.getStudentsByCourse) ? (Store.getStudentsByCourse(course.id) || []) : [];
                this.loadAseoSchedule(course.id);

                const totalAsignados = Object.values(this.aseoSchedule.schedule).reduce((acc, d) => acc + (d.studentIds ? d.studentIds.length : 0), 0);
                if (totalAsignados === 0 && this.students && this.students.length > 0) {
                    this.distribuirAseoEquilibrado(false);
                }
            }
        }
    },

    switchAseoCourse(courseId) {
        this.initAseoCourse(courseId);
        this.renderAseoModalBody();
    },

    selectGuiaCourseAndOpenAseo(courseId) {
        this.initAseoCourse(courseId);
        this.renderAseoModalBody();
    },

    loadAseoSchedule(targetCourseId = null) {
        const courseId = targetCourseId || this.activeAseoCourseId || (Store.getActiveCourse() ? Store.getActiveCourse().id : 'default');
        const key = 'aseo_semanal_' + courseId;

        const defaultSchedule = {
            dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
            schedule: {
                lunes: { coordinadorId: null, studentIds: [] },
                martes: { coordinadorId: null, studentIds: [] },
                miercoles: { coordinadorId: null, studentIds: [] },
                jueves: { coordinadorId: null, studentIds: [] },
                viernes: { coordinadorId: null, studentIds: [] }
            },
            unassigned: []
        };

        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.schedule) {
                    this.aseoSchedule = parsed;
                    return;
                }
            }
        } catch (e) {
            console.warn('Error loading aseo schedule:', e);
        }

        this.aseoSchedule = defaultSchedule;
    },

    saveAseoSchedule() {
        const courseId = this.activeAseoCourseId || (Store.getActiveCourse() ? Store.getActiveCourse().id : 'default');
        const key = 'aseo_semanal_' + courseId;
        try {
            localStorage.setItem(key, JSON.stringify(this.aseoSchedule));
        } catch (e) {
            console.warn('Error saving aseo schedule:', e);
        }
    },

    distribuirAseoEquilibrado(showToast = true) {
        if (!this.students || this.students.length === 0) {
            const course = this.getActiveAseoCourse();
            if (course && course.id) {
                this.students = Store.getStudentsByCourse(course.id) || [];
            }
        }
        const students = [...(this.students || [])];
        if (students.length === 0) {
            if (showToast) UI.toast('No hay estudiantes en el curso para distribuir', 'warning');
            return;
        }

        const males = [];
        const females = [];

        students.forEach(s => {
            if (this.getStudentGender(s) === 'F') females.push(s);
            else males.push(s);
        });

        const shuffledM = this.shuffle([...males]);
        const shuffledF = this.shuffle([...females]);

        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        const schedule = {
            lunes: { coordinadorId: null, studentIds: [] },
            martes: { coordinadorId: null, studentIds: [] },
            miercoles: { coordinadorId: null, studentIds: [] },
            jueves: { coordinadorId: null, studentIds: [] },
            viernes: { coordinadorId: null, studentIds: [] }
        };

        // Distribuir varones en los 5 días
        shuffledM.forEach((s, idx) => {
            const dia = dias[idx % 5];
            schedule[dia].studentIds.push(s.id);
        });

        // Distribuir mujeres equilibrando por día
        shuffledF.forEach((s) => {
            const bestDay = [...dias].sort((a, b) => {
                const diffLen = schedule[a].studentIds.length - schedule[b].studentIds.length;
                if (diffLen !== 0) return diffLen;
                const fA = schedule[a].studentIds.filter(id => {
                    const st = students.find(x => x.id === id);
                    return this.getStudentGender(st) === 'F';
                }).length;
                const fB = schedule[b].studentIds.filter(id => {
                    const st = students.find(x => x.id === id);
                    return this.getStudentGender(st) === 'F';
                }).length;
                return fA - fB;
            })[0];
            schedule[bestDay].studentIds.push(s.id);
        });

        // Designar coordinador automático en cada día (primer estudiante)
        dias.forEach(d => {
            if (schedule[d].studentIds.length > 0) {
                schedule[d].coordinadorId = schedule[d].studentIds[0];
            }
        });

        this.aseoSchedule = { dias, schedule, unassigned: [] };
        this.saveAseoSchedule();
        this.renderAseoModalBody();
        if (showToast) {
            this.play('win');
            UI.toast('✨ Horario de Aseo equilibrado con éxito (5 días)');
        }
    },

    sortearCoordinadoresAseo() {
        if (!this.aseoSchedule || !this.aseoSchedule.schedule) return;
        const dias = this.aseoSchedule.dias;
        let count = 0;
        dias.forEach(d => {
            const ids = this.aseoSchedule.schedule[d].studentIds;
            if (ids && ids.length > 0) {
                const randomIdx = Math.floor(Math.random() * ids.length);
                this.aseoSchedule.schedule[d].coordinadorId = ids[randomIdx];
                count++;
            }
        });
        this.saveAseoSchedule();
        this.renderAseoModalBody();
        this.play('pop');
        UI.toast('🎲 ' + count + ' coordinadores seleccionados por sorteo');
    },

    toggleCoordinadorAseo(diaKey, studentId) {
        if (!this.aseoSchedule || !this.aseoSchedule.schedule[diaKey]) return;
        const dayObj = this.aseoSchedule.schedule[diaKey];
        if (dayObj.coordinadorId === studentId) {
            dayObj.coordinadorId = null;
            UI.toast('Coordinador desasignado');
        } else {
            dayObj.coordinadorId = studentId;
            const student = (this.students || []).find(s => s.id === studentId);
            this.play('ding');
            UI.toast('⭐ ' + (student ? student.nombreCompleto : 'Alumno') + ' nombrado Coordinador del ' + this.getDiaLabel(diaKey));
        }
        this.saveAseoSchedule();
        this.renderAseoModalBody();
    },

    moveAseoStudent(studentId, targetDia) {
        if (!this.aseoSchedule || !this.aseoSchedule.schedule) return;
        const dias = this.aseoSchedule.dias;

        // Remover de cualquier día o unassigned
        dias.forEach(d => {
            const list = this.aseoSchedule.schedule[d].studentIds;
            const idx = list.indexOf(studentId);
            if (idx > -1) list.splice(idx, 1);
            if (this.aseoSchedule.schedule[d].coordinadorId === studentId) {
                this.aseoSchedule.schedule[d].coordinadorId = list[0] || null;
            }
        });
        const unIdx = (this.aseoSchedule.unassigned || []).indexOf(studentId);
        if (unIdx > -1) this.aseoSchedule.unassigned.splice(unIdx, 1);

        // Añadir a target
        if (targetDia === 'unassigned') {
            if (!this.aseoSchedule.unassigned) this.aseoSchedule.unassigned = [];
            this.aseoSchedule.unassigned.push(studentId);
        } else if (this.aseoSchedule.schedule[targetDia]) {
            this.aseoSchedule.schedule[targetDia].studentIds.push(studentId);
            if (!this.aseoSchedule.schedule[targetDia].coordinadorId) {
                this.aseoSchedule.schedule[targetDia].coordinadorId = studentId;
            }
        }

        this.saveAseoSchedule();
        this.renderAseoModalBody();
    },

    limpiarAseoSchedule() {
        if (!confirm('¿Deseas reiniciar la distribución del horario de aseo semanal?')) return;
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        this.aseoSchedule = {
            dias,
            schedule: {
                lunes: { coordinadorId: null, studentIds: [] },
                martes: { coordinadorId: null, studentIds: [] },
                miercoles: { coordinadorId: null, studentIds: [] },
                jueves: { coordinadorId: null, studentIds: [] },
                viernes: { coordinadorId: null, studentIds: [] }
            },
            unassigned: (this.students || []).map(s => s.id)
        };
        this.saveAseoSchedule();
        this.renderAseoModalBody();
        UI.toast('Horario de aseo reiniciado');
    },

    getDiaLabel(diaKey) {
        const labels = {
            lunes: 'Lunes',
            martes: 'Martes',
            miercoles: 'Miércoles',
            jueves: 'Jueves',
            viernes: 'Viernes'
        };
        return labels[diaKey] || diaKey;
    },

    getDiaTheme(diaKey) {
        const themes = {
            lunes: { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', badge: '#0284c7', light: '#e0f2fe' },
            martes: { color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', badge: '#059669', light: '#dcfce7' },
            miercoles: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', badge: '#d97706', light: '#fef3c7' },
            jueves: { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', badge: '#7c3aed', light: '#ede9fe' },
            viernes: { color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', badge: '#db2777', light: '#fce7f3' }
        };
        return themes[diaKey] || { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', badge: '#ea580c', light: '#ffedd5' };
    },

    getAseoTask(index) {
        const tasks = [
            { icon: 'broom', label: 'Barrer aula y corredor', desc: 'Barrer minuciosamente el piso' },
            { icon: 'droplet', label: 'Trapear con desinfectante', desc: 'Aromatizar y secar superficie' },
            { icon: 'square-dashed', label: 'Pizarra y almohadilla', desc: 'Borrar y sacudir motas' },
            { icon: 'trash-2', label: 'Vaciar basureros', desc: 'Reemplazar bolsas de desechos' },
            { icon: 'armchair', label: 'Alinear pupitres', desc: 'Dejar filas uniformes y ordenadas' },
            { icon: 'sparkles', label: 'Ventanas y ventilación', desc: 'Cerrar ventanas y apagar luces' }
        ];
        return tasks[index % tasks.length];
    },

    activeAseoTab: 'todos',

    setAseoTab(tab) {
        this.activeAseoTab = tab;
        const grid = document.querySelector('.aseo-grid-wrap');
        if (grid) grid.dataset.activeTab = tab;
        this.renderAseoModalBody();
    },

    renderAseoView() {
        this.initAseoCourse();
        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 50);

        return `
            <div id="aseo-view-root">
                ${this.getAseoHtml()}
            </div>
        `;
    },

    openAseoModal(targetCourseId = null) {
        this.initAseoCourse(targetCourseId);

        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 40);

        UI.modal('✨ Horarios de Aseo Semanal', `
            <div id="aseo-modal-root" style="max-width: 1380px; margin: 0 auto; padding: 4px 0; font-family: 'Outfit', sans-serif;">
                ${this.getAseoHtml()}
            </div>
        `);
    },

    renderAseoModalBody() {
        const root = document.getElementById('aseo-modal-root') || document.getElementById('aseo-view-root');
        if (!root) return;
        root.innerHTML = this.getAseoHtml();
        if (window.lucide) window.lucide.createIcons();
    },

    getAseoHtml() {
        const course = this.getActiveAseoCourse();
        const activeCourse = (typeof Store !== 'undefined' && Store.getActiveCourse) ? Store.getActiveCourse() : course;
        const cursosGuia = (typeof Store !== 'undefined' && Store.getCursosGuia) ? Store.getCursosGuia() : [];
        const isGuia = (course && course.id && typeof Store !== 'undefined' && Store.isMaestroGuia) ? Store.isMaestroGuia(course.id) : false;

        // SI EL CURSO ACTUAL NO ES UN GRADO GUÍA: NOTIFICAR QUE NO ESTÁ DISPONIBLE
        if (!course || !isGuia) {
            return `
                <div class="fade-in" style="max-width: 820px; margin: 30px auto; padding: 20px; font-family: 'Outfit', sans-serif;">
                    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 24px; padding: 40px 32px; text-align: center; box-shadow: 0 10px 30px rgba(15,23,42,0.06);">
                        <div style="width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; display: grid; place-items: center; margin: 0 auto 20px auto; box-shadow: 0 6px 18px rgba(217,119,6,0.18);">
                            <i data-lucide="shield-alert" style="width: 36px; height: 36px;"></i>
                        </div>

                        <span style="font-size: 11px; font-weight: 800; background: #fef3c7; color: #b45309; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; margin-bottom: 12px;">
                            Módulo Exclusivo de Maestro(a) Guía
                        </span>
                        
                        <h2 style="font-size: 23px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.01em;">
                            Módulo no disponible para este curso y grado
                        </h2>
                        
                        <p style="font-size: 14.5px; color: #64748b; margin: 0 auto 24px auto; max-width: 580px; line-height: 1.6;">
                            El <strong>Rol de Aseo Semanal</strong> y la organización de comisiones de limpieza del aula son funciones vinculadas <strong>únicamente</strong> al grado y sección del cual usted es Maestro(a) Guía.
                        </p>

                        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px 20px; display: inline-flex; align-items: center; gap: 14px; margin-bottom: 28px; text-align: left; max-width: 90%;">
                            <div style="width: 38px; height: 38px; border-radius: 10px; background: #fee2e2; color: #dc2626; display: grid; place-items: center; flex-shrink: 0;">
                                <i data-lucide="lock" style="width: 20px; height: 20px;"></i>
                            </div>
                            <div>
                                <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Curso actual sin tutoría de guía:</div>
                                <div style="font-size: 14px; font-weight: 800; color: #1e293b;">
                                    ${activeCourse ? `${activeCourse.asignatura} (${activeCourse.grado} "${activeCourse.seccion || '1'}") · ${activeCourse.centroEducativo || 'Centro Educativo'}` : 'Sin curso seleccionado'}
                                </div>
                            </div>
                        </div>

                        ${cursosGuia.length === 0 ? `
                            <div style="border-top: 1.5px dashed #e2e8f0; padding-top: 24px; margin-bottom: 22px;">
                                <p style="font-size: 13.5px; color: #64748b; margin: 0 0 16px 0;">
                                    Aún no ha configurado de qué grado es Maestro(a) Guía en sus Ajustes Generales.
                                </p>
                                <button class="a360-btn" onclick="Router.navigate('config')" style="background: #0284c7; color: white; border: none; border-radius: 12px; padding: 12px 24px; font-size: 13.5px; font-weight: 800; cursor: pointer;">
                                    <i data-lucide="settings" style="width: 16px; height: 16px;"></i> Configurar Grados Guía en Ajustes
                                </button>
                            </div>
                        ` : ``}

                        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 16px; flex-wrap: wrap;">
                            <button class="a360-btn" onclick="Router.navigate('config')" style="background: #f8fafc; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 9px 18px; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                                <i data-lucide="settings" style="width: 15px; height: 15px;"></i> Ajustes Generales
                            </button>
                            <button class="a360-btn" onclick="Router.navigate('panel')" style="background: #f8fafc; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 9px 18px; font-size: 12.5px; font-weight: 700; cursor: pointer;">
                                <i data-lucide="home" style="width: 15px; height: 15px;"></i> Volver al Centro de Control
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        const students = this.students || [];
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s; });

        // Cálculos generales de género
        let totalM = 0;
        let totalF = 0;
        students.forEach(s => {
            if (this.getStudentGender(s) === 'F') totalF++;
            else totalM++;
        });

        const dias = (this.aseoSchedule && this.aseoSchedule.dias) ? this.aseoSchedule.dias : ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        const schedule = (this.aseoSchedule && this.aseoSchedule.schedule) ? this.aseoSchedule.schedule : {
            lunes: { coordinadorId: null, studentIds: [] },
            martes: { coordinadorId: null, studentIds: [] },
            miercoles: { coordinadorId: null, studentIds: [] },
            jueves: { coordinadorId: null, studentIds: [] },
            viernes: { coordinadorId: null, studentIds: [] }
        };

        const curTab = this.activeAseoTab || 'todos';

        // Header Banner & Acciones
        let html = `
            <style id="aseo-responsive-styles">
                #aseo-view-root, #aseo-modal-root {
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 2px 4px;
                    font-family: 'Outfit', sans-serif;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 80px);
                    max-height: calc(100vh - 80px);
                    overflow: hidden;
                }
                .aseo-banner-wrap {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border-radius: 12px;
                    padding: 6px 12px;
                    margin-bottom: 6px;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(15,23,42,0.18);
                }
                .aseo-mobile-day-tabs {
                    display: none;
                    gap: 4px;
                    margin-bottom: 6px;
                    overflow-x: auto;
                    padding-bottom: 2px;
                    flex-shrink: 0;
                    scrollbar-width: none;
                }
                .aseo-grid-wrap {
                    flex: 1;
                    min-height: 0;
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 6px;
                    height: 100%;
                    overflow: hidden;
                }
                .aseo-day-col {
                    background: #ffffff;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 0;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.03);
                    overflow: hidden;
                    border: 1.5px solid #e2e8f0;
                }
                .aseo-day-header {
                    padding: 4px 8px;
                    border-radius: 10px 10px 0 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }
                .aseo-coord-box {
                    padding: 4px 8px;
                    flex-shrink: 0;
                    border-bottom: 1px dashed #e2e8f0;
                }
                .aseo-cards-container {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    padding: 4px;
                    display: flex;
                    flex-direction: column;
                    gap: 3.5px;
                }
                .aseo-card-item {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 3.5px 6px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    cursor: grab;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }
                .aseo-card-item:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
                }

                /* TABLETS (Entre 641px y 1024px) */
                @media (max-width: 1024px) {
                    #aseo-view-root, #aseo-modal-root {
                        height: calc(100vh - 74px);
                        max-height: calc(100vh - 74px);
                        padding: 2px;
                    }
                    .aseo-banner-wrap {
                        padding: 6px 10px;
                        margin-bottom: 5px;
                    }
                    .aseo-grid-wrap {
                        gap: 5px;
                    }
                    .aseo-card-item {
                        padding: 3px 5px;
                    }
                }

                /* MÓVILES (<= 640px) */
                @media (max-width: 640px) {
                    #aseo-view-root, #aseo-modal-root {
                        height: auto;
                        max-height: none;
                        overflow-y: auto;
                        padding: 4px;
                    }
                    .aseo-banner-wrap {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 6px;
                        padding: 8px 10px;
                    }
                    .aseo-mobile-day-tabs {
                        display: flex;
                    }
                    .aseo-grid-wrap {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        height: auto;
                        overflow: visible;
                    }
                    .aseo-grid-wrap[data-active-tab="lunes"] .aseo-day-col:not([data-day="lunes"]) { display: none !important; }
                    .aseo-grid-wrap[data-active-tab="martes"] .aseo-day-col:not([data-day="martes"]) { display: none !important; }
                    .aseo-grid-wrap[data-active-tab="miercoles"] .aseo-day-col:not([data-day="miercoles"]) { display: none !important; }
                    .aseo-grid-wrap[data-active-tab="jueves"] .aseo-day-col:not([data-day="jueves"]) { display: none !important; }
                    .aseo-grid-wrap[data-active-tab="viernes"] .aseo-day-col:not([data-day="viernes"]) { display: none !important; }
                    .aseo-day-col {
                        height: auto;
                        min-height: auto;
                    }
                    .aseo-cards-container {
                        max-height: 480px;
                    }
                }
            </style>

            <div class="aseo-banner-wrap">
                <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                    <div style="width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); display: grid; place-items: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(2,132,199,0.35);">
                        <i data-lucide="sparkles" style="width: 17px; height: 17px; color: white;"></i>
                    </div>
                    <div style="min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <h2 style="font-size: 14.5px; font-weight: 900; margin: 0; letter-spacing: -0.01em; color: white;">Rol y Comisión de Aseo Semanal</h2>
                            <span style="font-size: 9.5px; background: rgba(2,132,199,0.3); border: 1px solid rgba(56,189,248,0.4); color: #38bdf8; padding: 1px 6px; border-radius: 10px; font-weight: 800;">5 Días</span>
                            <span style="font-size: 9.5px; background: rgba(245,158,11,0.25); border: 1px solid rgba(245,158,11,0.5); color: #fbbf24; padding: 1px 6px; border-radius: 10px; font-weight: 800;">⭐ Maestro(a) Guía</span>
                        </div>
                        <p style="font-size: 11px; opacity: 0.85; margin: 1px 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${course.grado ? `${course.grado} "${course.seccion || 'A'}" • ` : ''}${course.asignatura || 'Curso'} • ${course.centroEducativo || 'Centro Educativo'} • 
                            <strong>${students.length} Estudiantes</strong> (${totalM} Varones ♂ • ${totalF} Hembras ♀)
                        </p>
                    </div>
                </div>

                <!-- Botones de Acción -->
                <div style="display: flex; align-items: center; gap: 5px; flex-wrap: wrap; flex-shrink: 0;">
                    <button class="a360-btn" onclick="Views.EquiposTrabajo.distribuirAseoEquilibrado()" 
                            style="background: #ea580c; color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 800; padding: 5px 11px; box-shadow: 0 2px 6px rgba(234,88,12,0.3); cursor: pointer; display: flex; align-items: center; gap: 4px;" 
                            title="Distribuir automáticamente equilibrando varones y hembras por día">
                        <i data-lucide="scale" style="width: 12px; height: 12px;"></i>
                        <span>Auto-Equilibrar</span>
                    </button>

                    <button class="a360-btn" onclick="Views.EquiposTrabajo.sortearCoordinadoresAseo()" 
                            style="background: rgba(255,255,255,0.14); color: white; border: 1px solid rgba(255,255,255,0.22); border-radius: 8px; font-size: 11px; font-weight: 700; padding: 5px 9px; cursor: pointer; display: flex; align-items: center; gap: 4px;" 
                            title="Sortear un coordinador al azar para cada día">
                        <i data-lucide="dices" style="width: 12px; height: 12px;"></i>
                        <span>Sortear</span>
                    </button>

                    <button class="a360-btn" onclick="Views.EquiposTrabajo.imprimirRolAseo()" 
                            style="background: rgba(255,255,255,0.14); color: white; border: 1px solid rgba(255,255,255,0.22); border-radius: 8px; font-size: 11px; font-weight: 700; padding: 5px 9px; cursor: pointer; display: flex; align-items: center; gap: 4px;" 
                            title="Imprimir lámina mural para el aula escolar">
                        <i data-lucide="printer" style="width: 12px; height: 12px;"></i>
                        <span>Mural</span>
                    </button>

                    <button class="a360-btn" onclick="Views.EquiposTrabajo.limpiarAseoSchedule()" 
                            style="background: transparent; color: #f87171; border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; font-size: 11px; font-weight: 700; padding: 5px 7px; cursor: pointer; display: flex; align-items: center;" 
                            title="Reiniciar y vaciar tabla">
                        <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                    </button>
                </div>
            </div>

            <!-- Tabs para Pantallas Pequeñas / Teléfonos -->
            <div class="aseo-mobile-day-tabs">
                <span style="font-size: 11px; font-weight: 800; color: #64748b; margin-right: 2px; align-self: center;">Día:</span>
                ${dias.map(dKey => {
                    const theme = this.getDiaTheme(dKey);
                    const dayCount = (schedule[dKey]?.studentIds || []).length;
                    const isTabActive = curTab === dKey;
                    return `
                        <button type="button" onclick="Views.EquiposTrabajo.setAseoTab('${dKey}')" 
                                style="background: ${isTabActive ? theme.color : '#f1f5f9'}; color: ${isTabActive ? 'white' : '#475569'}; border: 1px solid ${isTabActive ? theme.color : '#e2e8f0'}; border-radius: 7px; padding: 3px 8px; font-size: 10.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 3px; white-space: nowrap;">
                            <span>${this.getDiaLabel(dKey).slice(0, 3)}</span>
                            <span style="opacity: 0.85; font-size: 9.5px;">(${dayCount})</span>
                        </button>
                    `;
                }).join('')}
                <button type="button" onclick="Views.EquiposTrabajo.setAseoTab('todos')" 
                        style="background: ${curTab === 'todos' ? '#0f172a' : '#f1f5f9'}; color: ${curTab === 'todos' ? 'white' : '#475569'}; border: 1px solid #cbd5e1; border-radius: 7px; padding: 3px 8px; font-size: 10.5px; font-weight: 800; cursor: pointer; white-space: nowrap;">
                    Ver los 5
                </button>
            </div>
        `;

        if (students.length === 0) {
            html += `
                <div style="background: #fff; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 36px 20px; text-align: center; margin-top: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: #f1f5f9; display: grid; place-items: center; margin: 0 auto 12px auto;">
                        <i data-lucide="users" style="width: 26px; height: 26px; color: #64748b;"></i>
                    </div>
                    <h3 style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 0 0 6px 0;">No hay alumnos matriculados en este curso</h3>
                    <p style="font-size: 12.5px; color: #64748b; margin: 0 auto 16px auto; max-width: 480px; line-height: 1.4;">
                        Para organizar el Rol de Aseo Semanal, puedes cambiar al grado deseado o registrar los estudiantes de este grupo.
                    </p>
                    <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                        <button class="a360-btn" onclick="Router.navigate('estudiantes')" style="background: #0284c7; color: white; border: none; border-radius: 10px; padding: 8px 16px; font-size: 12px; font-weight: 800; cursor: pointer;">
                            <i data-lucide="user-plus" style="width: 14px; height: 14px;"></i> Ir a Control de Matrícula
                        </button>
                    </div>
                </div>
            `;
            return html;
        }

        // TABLAS KANBAN DE LOS 5 DÍAS CON AUTOAJUSTE
        html += `<div class="aseo-grid-wrap" data-active-tab="${curTab}">`;

        dias.forEach(dKey => {
            const theme = this.getDiaTheme(dKey);
            const dayData = schedule[dKey] || { coordinadorId: null, studentIds: [] };
            const studentIds = dayData.studentIds || [];
            const coordinador = dayData.coordinadorId ? studentMap[dayData.coordinadorId] : null;

            let dayM = 0;
            let dayF = 0;
            studentIds.forEach(id => {
                const st = studentMap[id];
                if (st) {
                    if (this.getStudentGender(st) === 'F') dayF++;
                    else dayM++;
                }
            });

            html += `
                <div class="aseo-day-col" 
                     data-day="${dKey}"
                     ondragover="event.preventDefault(); this.style.borderColor='${theme.color}';"
                     ondragleave="this.style.borderColor='${theme.border}';"
                     ondrop="Views.EquiposTrabajo.handleAseoDrop(event, '${dKey}')"
                     style="border-color: ${theme.border};">
                    
                    <!-- Header del Día -->
                    <div class="aseo-day-header" style="background: ${theme.bg}; border-bottom: 1.5px solid ${theme.border};">
                        <span style="font-size: 11.5px; font-weight: 900; color: ${theme.color}; text-transform: uppercase; letter-spacing: 0.03em;">
                            ${this.getDiaLabel(dKey)}
                        </span>
                        <div style="display: flex; align-items: center; gap: 3px;">
                            <span style="background: ${theme.color}; color: white; font-size: 9.5px; font-weight: 900; padding: 1px 5px; border-radius: 8px;">
                                ${studentIds.length}
                            </span>
                            <span style="font-size: 9px; font-weight: 800; background: #e0f2fe; color: #0284c7; padding: 1px 4px; border-radius: 4px;">♂${dayM}</span>
                            <span style="font-size: 9px; font-weight: 800; background: #fce7f3; color: #db2777; padding: 1px 4px; border-radius: 4px;">♀${dayF}</span>
                        </div>
                    </div>

                    <!-- CAJA DEL COORDINADOR DEL DÍA -->
                    <div class="aseo-coord-box" style="background: ${coordinador ? '#fffbeb' : '#f8fafc'}; border-bottom-color: ${coordinador ? '#fde68a' : '#e2e8f0'};">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                            <div style="display: flex; align-items: center; gap: 5px; min-width: 0; flex: 1;">
                                <span style="font-size: 11px; flex-shrink: 0;">👑</span>
                                <div style="min-width: 0; flex: 1;">
                                    ${coordinador ? `
                                        <div style="font-size: 11px; font-weight: 800; color: #92400e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1;">
                                            ${this.formatAseoStudentName(coordinador.nombreCompleto)}
                                        </div>
                                        <div style="font-size: 8.5px; color: #b45309; font-weight: 600; line-height: 1;">Coordinador(a)</div>
                                    ` : `
                                        <div style="font-size: 9.5px; color: #94a3b8; font-style: italic;">Sin coordinador (toca ⭐)</div>
                                    `}
                                </div>
                            </div>
                            ${coordinador ? `
                                <button type="button" onclick="Views.EquiposTrabajo.toggleCoordinadorAseo('${dKey}', '${coordinador.id}')" style="background: none; border: none; font-size: 9px; color: #b45309; cursor: pointer; text-decoration: underline; flex-shrink: 0;" title="Quitar rol">Cambiar</button>
                            ` : ''}
                        </div>
                    </div>

                    <!-- LISTA DE ESTUDIANTES DEL DÍA (COMPACTA Y CON AUTOAJUSTE) -->
                    <div class="aseo-cards-container">
                        ${studentIds.length === 0 ? `
                            <div style="text-align: center; padding: 20px 8px; color: #94a3b8; font-size: 11px;">
                                <i data-lucide="inbox" style="width: 22px; height: 22px; opacity: 0.4; margin: 0 auto 4px auto; display: block;"></i>
                                Arrastra o asigna alumnos aquí
                            </div>
                        ` : ''}

                        ${studentIds.map((id, sIdx) => {
                            const st = studentMap[id];
                            if (!st) return '';
                            const isCoord = dayData.coordinadorId === id;
                            const gender = this.getStudentGender(st);
                            const initials = this.getInitials(st.nombreCompleto);
                            const task = this.getAseoTask(sIdx);

                            return `
                                <div class="aseo-card-item"
                                     draggable="true"
                                     ondragstart="Views.EquiposTrabajo.handleAseoDragStart(event, '${st.id}', '${dKey}')"
                                     style="background: ${isCoord ? '#fffdf5' : '#ffffff'}; border: 1.5px solid ${isCoord ? '#f59e0b' : '#e2e8f0'};">
                                    
                                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                                        <div style="display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0;">
                                            <div style="width: 20px; height: 20px; border-radius: 50%; background: ${gender === 'F' ? '#fce7f3' : '#e0f2fe'}; color: ${gender === 'F' ? '#db2777' : '#0284c7'}; display: grid; place-items: center; font-size: 9px; font-weight: 900; flex-shrink: 0; border: 1px solid ${gender === 'F' ? '#fbcfe8' : '#bae6fd'};">
                                                ${initials}
                                            </div>
                                            <div style="min-width: 0; flex: 1;">
                                                <div style="font-size: 11px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.15;">
                                                    ${this.formatAseoStudentName(st.nombreCompleto)}
                                                </div>
                                                <div style="display: flex; align-items: center; gap: 3px; font-size: 8.5px; color: #64748b; line-height: 1; margin-top: 1px;">
                                                    <span style="font-weight: 800; color: ${gender === 'F' ? '#db2777' : '#0284c7'};">
                                                        ${gender === 'F' ? '♀' : '♂'}
                                                    </span>
                                                    <span style="color: #cbd5e1;">•</span>
                                                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${task.label}">
                                                        ${task.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Botones de Acción en Tarjeta -->
                                        <div style="display: flex; align-items: center; gap: 2px; flex-shrink: 0;">
                                            <button type="button" 
                                                    onclick="Views.EquiposTrabajo.toggleCoordinadorAseo('${dKey}', '${st.id}')"
                                                    title="${isCoord ? 'Quitar coordinador' : 'Nombrar coordinador'}"
                                                    style="background: ${isCoord ? '#f59e0b' : '#f1f5f9'}; border: none; width: 20px; height: 20px; border-radius: 5px; color: ${isCoord ? '#ffffff' : '#94a3b8'}; cursor: pointer; display: grid; place-items: center; font-size: 10px; transition: transform 0.15s;">
                                                ⭐
                                            </button>

                                            <select onchange="Views.EquiposTrabajo.moveAseoStudent('${st.id}', this.value)" 
                                                    style="width: 18px; height: 20px; border-radius: 5px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 8px; cursor: pointer; outline: none; padding: 0; color: #64748b;" 
                                                    title="Mover a otro día">
                                                <option value="" disabled selected>⇄</option>
                                                <option value="lunes">Lunes</option>
                                                <option value="martes">Martes</option>
                                                <option value="miercoles">Miércoles</option>
                                                <option value="jueves">Jueves</option>
                                                <option value="viernes">Viernes</option>
                                                <option value="unassigned">Sin asignar</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        html += `</div>`;

        // SECCIÓN INFERIOR COMPACTA: ALUMNOS SIN ASIGNAR
        const unassigned = this.aseoSchedule.unassigned || [];
        if (unassigned.length > 0) {
            html += `
                <div style="margin-top: 5px; background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 8px; padding: 5px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-shrink: 0; font-size: 11px;">
                    <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                        <i data-lucide="alert-circle" style="width: 14px; height: 14px; color: #d97706; flex-shrink: 0;"></i>
                        <span style="color: #b45309; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${unassigned.length} alumnos sin día asignado
                        </span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                        <button type="button" onclick="Views.EquiposTrabajo.distribuirAseoEquilibrado()" style="font-size: 10px; font-weight: 800; color: #ea580c; background: none; border: none; cursor: pointer; text-decoration: underline;">
                            Distribuir automáticamente
                        </button>
                    </div>
                </div>
            `;
        }

        return html;
    },

    handleAseoDragStart(e, studentId, sourceDay) {
        if (!e.dataTransfer) return;
        e.dataTransfer.setData('text/plain', JSON.stringify({ studentId, sourceDay }));
    },

    handleAseoDrop(e, targetDay) {
        e.preventDefault();
        try {
            const raw = e.dataTransfer.getData('text/plain');
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data && data.studentId) {
                this.moveAseoStudent(data.studentId, targetDay);
                this.play('pop');
            }
        } catch (err) {
            console.warn('Error on Aseo drop:', err);
        }
    },

    imprimirRolAseo() {
        const course = this.getActiveAseoCourse();
        const students = this.students || [];
        const studentMap = {};
        students.forEach(s => { studentMap[s.id] = s; });

        const dias = this.aseoSchedule.dias;
        const schedule = this.aseoSchedule.schedule;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            UI.toast('Por favor permite ventanas emergentes para imprimir', 'warning');
            return;
        }

        let printHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Rol de Aseo Semanal - ${course.asignatura}</title>
                <style>
                    @page { size: letter landscape; margin: 12mm; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
                    .header-box { text-align: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
                    .header-title { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 0.02em; }
                    .header-sub { font-size: 13px; font-weight: 700; color: #475569; margin: 4px 0 0 0; }
                    .info-grid { display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; margin-bottom: 14px; background: #f8fafc; padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 8px; flex-wrap: wrap; gap: 8px; }
                    .table-days { width: 100%; border-collapse: collapse; table-layout: fixed; }
                    .table-days th { border: 1.5px solid #334155; padding: 8px 6px; font-size: 12.5px; font-weight: 900; text-transform: uppercase; background: #f1f5f9; text-align: center; }
                    .table-days td { border: 1.5px solid #cbd5e1; vertical-align: top; padding: 8px 6px; font-size: 11px; }
                    .coord-badge { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 4px 6px; border-radius: 6px; font-size: 10.5px; font-weight: 900; margin-bottom: 8px; text-align: center; }
                    .student-item { padding: 4px 0; border-bottom: 1px dashed #e2e8f0; line-height: 1.3; }
                    .student-item:last-child { border-bottom: none; }
                    .task-label { font-size: 9.5px; color: #64748b; font-weight: 600; display: block; }
                    .signatures { margin-top: 36px; display: flex; justify-content: space-around; text-align: center; }
                    .sign-line { width: 220px; border-top: 1.5px solid #0f172a; padding-top: 5px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div class="header-box">
                    <h1 class="header-title">ROL OFICIAL DE ASEO Y MANTENIMIENTO DEL AULA</h1>
                    <p class="header-sub">Comisión Escolar de Salud, Higiene y Convivencia Armónica</p>
                </div>

                <div class="info-grid">
                    <div><strong>CENTRO:</strong> ${course.centroEducativo || 'Centro Educativo'}</div>
                    <div><strong>GRADO / SECCIÓN:</strong> ${course.grado || ''} "${course.seccion || 'A'}"</div>
                    <div><strong>CAMPO DEL CONOCIMIENTO:</strong> ${course.asignatura || 'Sin Asignar'}</div>
                    <div><strong>JORNADA:</strong> ${course.jornadaP || (course.jornadaInicio >= '12:00' ? 'Vespertina' : 'Matutina')}</div>
                    <div><strong>CICLO ESCOLAR:</strong> 2026</div>
                </div>

                <table class="table-days">
                    <thead>
                        <tr>
                            <th style="color: #0284c7;">LUNES</th>
                            <th style="color: #059669;">MARTES</th>
                            <th style="color: #d97706;">MIÉRCOLES</th>
                            <th style="color: #7c3aed;">JUEVES</th>
                            <th style="color: #db2777;">VIERNES</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
        `;

        dias.forEach(dKey => {
            const dayData = schedule[dKey] || { coordinadorId: null, studentIds: [] };
            const studentIds = dayData.studentIds || [];
            const coordinador = dayData.coordinadorId ? studentMap[dayData.coordinadorId] : null;

            printHtml += `<td>`;

            if (coordinador) {
                printHtml += `
                    <div class="coord-badge">
                        ⭐ COORDINADOR(A):<br>
                        <strong>${coordinador.nombreCompleto}</strong>
                    </div>
                `;
            } else {
                printHtml += `
                    <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-bottom: 6px;">
                        (Sin coordinador)
                    </div>
                `;
            }

            studentIds.forEach((id, idx) => {
                const st = studentMap[id];
                if (!st) return;
                const task = this.getAseoTask(idx);
                const gender = this.getStudentGender(st);
                const isCoord = dayData.coordinadorId === id;

                printHtml += `
                    <div class="student-item">
                        <strong>${idx + 1}. ${st.nombreCompleto}</strong> (${gender})
                        ${isCoord ? ' 👑' : ''}
                        <span class="task-label">📌 ${task.label}</span>
                    </div>
                `;
            });

            printHtml += `</td>`;
        });

        printHtml += `
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 14px; font-size: 10px; color: #64748b; font-style: italic; text-align: center;">
                    * Los miembros de cada comisión deben presentarse 15 minutos antes o permanecer después de clase para verificar el aseo completo del aula.
                </div>

                <div class="signatures">
                    <div>
                        <div class="sign-line">Docente Titular / Guía</div>
                    </div>
                    <div>
                        <div class="sign-line">Coordinador(a) Estudiantil</div>
                    </div>
                    <div>
                        <div class="sign-line">Dirección del Centro Educativo</div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 400);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
    },

};
