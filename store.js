// --- 0. VERSION & LOG ---
const APP_VERSION_TAG = '2026.05.16.13';
console.log('%c[Aula 360] %cInicializando versión: ' + APP_VERSION_TAG, 'color: #00C853; font-weight: bold;', 'color: #64748b;');

// --- 1. CONFIG & UTILS ---
const APP_KEY = 'gdhndata_v1';
const CONFIG = {
    appName: 'GDHN',
    version: '1.2.0',
    yearDefault: 2026,
    attendanceStates: ['P', 'A', 'E', 'T', 'PM'],
    months: ['Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'], // Feb-Nov logic
    dimensions: [
        { key: 'extraAula', nombre: 'Actividades Extra-Aula', porcentaje: 10, max: 5 },
        { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 25, max: 5 },
        { key: 'actitudes', nombre: 'Actitudes y Valores', porcentaje: 10, max: 5 },
        { key: 'expresiones', nombre: 'Expresiones Artísticas', porcentaje: 5, max: 5 },
        { key: 'examenes', nombre: 'Examen Escrito o Práctico', porcentaje: 50, max: 5 }
    ],
    courseColors: {
        teal: { start: '#00C853', end: '#0F766E' },
        blue: { start: '#2563EB', end: '#1D4ED8' },
        indigo: { start: '#4F46E5', end: '#4338CA' },
        purple: { start: '#7C3AED', end: '#6D28D9' },
        rose: { start: '#E11D48', end: '#BE123C' },
        amber: { start: '#F59E0B', end: '#D97706' },
        emerald: { start: '#10B981', end: '#059669' },
        mint: { start: '#99F6E4', end: '#4ADE80' },
        lavender: { start: '#E9D5FF', end: '#C084FC' },
        softpink: { start: '#FCE7F3', end: '#F472B6' },
        peach: { start: '#FFEDD5', end: '#FB923C' },
        softblue: { start: '#DBEAFE', end: '#60A5FA' }
    }
};

const Utils = {
    id: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: () => new Date().toISOString(),
    formatDate: (iso) => new Date(iso).toLocaleDateString(),
    cls: (...classes) => classes.filter(Boolean).join(' '),
    safeGet: (obj, path, def) => path.split('.').reduce((o, i) => o ? o[i] : undefined, obj) || def,
    getDimensionTheme(name, index) {
        const colors = [
            { bg: '#EFF6FF', border: '#DBEAFE', text: '#1D4ED8', icon: '#3B82F6', badge: '#DBEAFE', badgeText: '#1E40AF' },
            { bg: '#ECFDF5', border: '#D1FAE5', text: '#047857', icon: '#10B981', badge: '#D1FAE5', badgeText: '#065F46' },
            { bg: '#F5F3FF', border: '#EDE9FE', text: '#6D28D9', icon: '#8B5CF6', badge: '#EDE9FE', badgeText: '#4C1D95' },
            { bg: '#FFFBEB', border: '#FEF3C7', text: '#B45309', icon: '#F59E0B', badge: '#FEF3C7', badgeText: '#92400E' },
            { bg: '#FDF2F8', border: '#FCE7F3', text: '#BE185D', icon: '#EC4899', badge: '#FCE7F3', badgeText: '#9D174D' }
        ];

        let iconName = 'layers';
        const lowerName = (name || '').toLowerCase();
        if (lowerName.includes('extra')) iconName = 'backpack';
        else if (lowerName.includes('aula')) iconName = 'book-open';
        else if (lowerName.includes('valores') || lowerName.includes('actitud')) iconName = 'heart-handshake';
        else if (lowerName.includes('artística') || lowerName.includes('expresiones')) iconName = 'palette';
        else if (lowerName.includes('examen') || lowerName.includes('prueba')) iconName = 'file-check-2';
        else if (lowerName.includes('asistencia')) iconName = 'calendar-check';

        const theme = colors[index % colors.length];
        return { ...theme, iconName };
    }
};

// --- 1.1 SECURITY MODULE (Cifrado Militar AES) ---
const Security = {
    _key: "Aula360_MasterKey_V1", // Internal key to prevent plain text reading of sensitive PII
    encrypt(dataObj) {
        try {
            if (!window.CryptoJS) return JSON.stringify(dataObj);
            return CryptoJS.AES.encrypt(JSON.stringify(dataObj), this._key).toString();
        } catch(e) {
            console.error("Encryption error", e);
            return JSON.stringify(dataObj); // Fallback a plano si falla la libreria
        }
    },
    decrypt(ciphertext) {
        try {
            // Si el archivo empieza con "{" es texto plano (respaldo antiguo), no desencriptar
            if (ciphertext.trim().startsWith('{')) {
                return JSON.parse(ciphertext);
            }
            if (!window.CryptoJS) return JSON.parse(ciphertext);
            
            const bytes = CryptoJS.AES.decrypt(ciphertext, this._key);
            const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedStr) throw new Error("Decryption returned empty string");
            return JSON.parse(decryptedStr);
        } catch(e) {
            console.error("Decryption error", e);
            throw new Error("Archivo de respaldo dañado o contraseña incorrecta.");
        }
    }
};

// --- 1.2 MIGRATIONS ENGINE (Actualización Segura de Estructuras) ---
const Migrations = {
    // Definimos las reglas de migración secuenciales
    rules: {
        "1.2.0": function(data) {
            console.log("[Migrations] Ejecutando parche de datos para v1.2.0...");
            // Ejemplo real: Inyectar campo alergias en estudiantes si no existe
            if (data.estudiantes && Array.isArray(data.estudiantes)) {
                data.estudiantes.forEach(est => {
                    if (est.alergias === undefined) {
                        est.alergias = "";
                    }
                });
            }
            return data;
        }
    },
    
    // Motor que compara versiones y aplica los parches que faltan
    run(data) {
        if (!data) return data;
        
        let dataVersion = data.version || "1.0.0";
        const currentVersion = CONFIG.version;
        
        if (this._compareVersions(dataVersion, currentVersion) >= 0) {
            return data; // Ya está actualizado
        }

        console.log(`[Migrations] App actualizada: v${dataVersion} -> v${currentVersion}. Preparando adaptación de datos...`);

        const versionsToRun = Object.keys(this.rules).filter(ver => {
            return this._compareVersions(ver, dataVersion) > 0 && 
                   this._compareVersions(ver, currentVersion) <= 0;
        }).sort(this._compareVersions);

        versionsToRun.forEach(ver => {
            try {
                data = this.rules[ver](data);
                dataVersion = ver;
            } catch(e) {
                console.error(`[Migrations] Error crítico aplicando parche de datos v${ver}`, e);
            }
        });

        data.version = currentVersion;
        console.log(`[Migrations] Base de datos blindada y actualizada a v${currentVersion}`);
        return data;
    },

    _compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const maxLen = Math.max(parts1.length, parts2.length);
        
        for (let i = 0; i < maxLen; i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }
};

// --- 1.5 AULA STORAGE (IndexedDB & Persistencia Segura) ---
const DB_VERSION = 1;
const DB_NAME = 'Aula360HN_DB';
const STORE_NAME = 'AppData';

class AulaStorage {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn("IndexedDB no soportado en este navegador, se dependerá de localStorage");
                resolve();
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                const oldVersion = event.oldVersion;
                
                // Sistema de Migraciones Seguras (Fase 3)
                if (!this.db.objectStoreNames.contains(STORE_NAME)) {
                    this.db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
                
                if (oldVersion > 0 && oldVersion < DB_VERSION) {
                    console.log(`Migrando BD desde versión ${oldVersion} a ${DB_VERSION}`);
                    // Aquí se aplicarían cambios estructurales futuros
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onerror = (event) => {
                console.error("Error inicializando IndexedDB", event);
                resolve(); // Fallback to localStorage logic if IDB completely fails
            };
        });
    }

    async get(key) {
        return new Promise((resolve) => {
            if (!this.db) return resolve(null);
            try {
                const transaction = this.db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result ? request.result.value : null);
                request.onerror = () => resolve(null);
            } catch(e) {
                resolve(null);
            }
        });
    }

    async set(key, value) {
        return new Promise((resolve) => {
            if (!this.db) return resolve();
            try {
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put({ id: key, value: value });
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
            } catch(e) {
                resolve();
            }
        });
    }

    // Abstracción para futura sincronización (Fase 11)
    async syncWithCloud() {
        console.log("Cloud sync structure ready for Future Implementation (Firebase/Supabase)");
        return true;
    }
}

const StorageAPI = new AulaStorage();

// --- 2. STORE (Memoria & Persistencia Dual) ---
const Store = {
    data: {
        cursos: [],
        estudiantes: [], // Global bank
        matriculas: [],
        configAcademica: null,
        actividades: [],
        calificaciones: [],
        asistencia: [],
        sartAlertas: [],
        agendaEventos: [],
        agendaEventosInstitucionales: [],
        agendaSettings: {},
        rubricas: [],
        extraordinary_activities: [],
        activity_bonus_records: [],
        extraordinary_activity_settings: [],
        custom_extraordinary_categories: [],
        diasNoLectivos: [],
        pruebasDiagnosticas: [],
        activeCourseId: null
    },
    async init() {
        const lsSaved = localStorage.getItem(APP_KEY);
        let idbSaved = await StorageAPI.get(APP_KEY);

        if (!idbSaved && lsSaved) {
            // Migración segura desde localStorage a IndexedDB
            console.log("Realizando migración automática de localStorage a IndexedDB...");
            try {
                idbSaved = JSON.parse(lsSaved);
                await StorageAPI.set(APP_KEY, idbSaved);
            } catch(e) {
                console.error("Error parseando localStorage", e);
            }
        }
        
        // Fase 2: Paracaídas Invisible (Capacitor Native Restore)
        if (!idbSaved && !lsSaved && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
            try {
                console.log("Buscando respaldo nativo (Paracaídas Invisible)...");
                const result = await window.Capacitor.Plugins.Filesystem.readFile({
                    path: 'Aula360_Native_Backup.json',
                    directory: 'DATA',
                    encoding: 'utf8'
                });
                if (result && result.data) {
                    console.log("¡Respaldo nativo encontrado! Restaurando datos...");
                    idbSaved = JSON.parse(result.data);
                    await StorageAPI.set(APP_KEY, idbSaved);
                    localStorage.setItem(APP_KEY, result.data);
                }
            } catch(e) {
                console.log("No se encontró respaldo nativo o hubo un error al leerlo.");
            }
        }

        let savedData = idbSaved || (lsSaved ? JSON.parse(lsSaved) : null);

        if (savedData) {
            try {
                this.data = savedData;
            } catch (e) {
                console.error('Data loading error, using empty state', e);
                // No llamamos a this.reset() destructivo para evitar pérdida, cargamos estado vacío
                // El usuario puede usar "Restaurar Respaldo" si los datos fallaron.
            }
        } else {
            this.reset();
        }

        // GESTIÓN DE ESTRUCTURA Y COMPATIBILIDAD
        if (!this.data.extraordinary_activities) {
            this.data.extraordinary_activities = this.data.extraPointActivities || [];
        }
        if (!this.data.activity_bonus_records) {
            this.data.activity_bonus_records = this.data.extraPointRecords || [];
        }
        if (!this.data.extraordinary_activity_settings) {
            this.data.extraordinary_activity_settings = this.data.extraPointSettings || [];
        }
        if (!this.data.custom_extraordinary_categories) {
            this.data.custom_extraordinary_categories = [];
        }

        // --- MOTOR DE MIGRACIONES ---
        // Verifica si la estructura cargada necesita ser parcheada
        if (this.data && Migrations) {
            this.data = Migrations.run(this.data);
        }

        // Ensure new properties exist (data migration)
        if (!this.data.parciales) {
            this.data.parciales = [];
        }
        if (!this.data.diasNoLectivos) {
            this.data.diasNoLectivos = [];
        }
        if (!this.data.agendaEventos) {
            this.data.agendaEventos = [];
            this.data.agendaSettings = {};
        }
        if (!this.data.agendaEventosInstitucionales) {
            this.data.agendaEventosInstitucionales = [];
        }
        if (!this.data.archivos) {
            this.data.archivos = [];
        }
        if (!this.data.pruebasDiagnosticas) {
            this.data.pruebasDiagnosticas = [];
        }
        if (!this.data.pruebasFormativas) {
            this.data.pruebasFormativas = [];
        }
        if (!this.data.bitacora) {
            this.data.bitacora = [];
        }
        if (!this.data.notasRapidas) {
            this.data.notasRapidas = [];
        }
        if (!this.data.bcPacks) {
            this.data.bcPacks = [];
        }
        if (!this.data.bcLessons) {
            this.data.bcLessons = [];
        }
        if (!this.data.configPreferencias) {
            this.data.configPreferencias = { sonidosHabilitados: true };
        }
        if (!this.data.perfilDocente) {
            this.data.perfilDocente = {
                nombre: '', correo: '', telefono: '', googleDriveUrl: ''
            };
        }
        if (!this.data.securityPassword) {
            this.data.securityPassword = 'Aula360';
        }
        if (!this.data.cargasDocentes) {
            this.data.cargasDocentes = [];
        }

        // MIGRACIÓN AUTOMÁTICA DE ESTADO DE CURSOS Y CARGAS DOCENTES
        if (Array.isArray(this.data.cursos)) {
            let stateMigrated = false;
            this.data.cursos.forEach(c => {
                if (!c.estado) {
                    c.estado = 'ACTIVO'; // Estado por defecto para cursos existentes
                    stateMigrated = true;
                }
                if (c.horario && Object.keys(c.horario).length > 0) {
                    const existingCarga = this.data.cargasDocentes.find(cg => cg.cursoId === c.id);
                    if (!existingCarga) {
                        this.data.cargasDocentes.push({
                            id: 'carga_' + c.id + '_' + Date.now(),
                            docenteId: this.data.perfilDocente?.id || 'docente_default',
                            centroEducativoId: this.data.configAcademica?.centroEducativo || 'centro_default',
                            anioLectivo: this.data.configAcademica?.anioLectivo || new Date().getFullYear(),
                            parcialId: this.data.configAcademica?.parcialActivo || 'I Parcial',
                            cursoId: c.id,
                            asignatura: c.asignatura,
                            horario: c.horario,
                            estado: c.estado || 'ACTIVO'
                        });
                        stateMigrated = true;
                    }
                }
            });
            if (stateMigrated) this.save();
        }

        if (!this.data.planificaciones) {
            this.data.planificaciones = [];
        }
        if (!this.data.jornalizaciones) {
            this.data.jornalizaciones = [];
        }
        if (!this.data.rubricas) {
            this.data.rubricas = [];
            // seedRubricas() removed to prevent destructive auto-creation on corrupted state.
        }
        if (!this.data.equiposState) {
            this.data.equiposState = {};
        }
        if (!this.data.centrosEducativos) {
            this.data.centrosEducativos = [];
        }
        if (!this.data.extraPointSettings) {
            this.data.extraPointSettings = [];
        }
        if (!this.data.extraPointActivities) {
            this.data.extraPointActivities = [];
        }
        if (!this.data.extraPointRecords) {
            this.data.extraPointRecords = [];
        }
        if (!this.data.uiState) {
            this.data.uiState = {
                metricsOpen: { horario: false, estudiantes: false, bitacora: false },
                activeModuleTabs: { horario: 'clases' }
            };
            this.data.resumenMatriculaManual = {};
        } else {
            if (!this.data.uiState.metricsOpen) this.data.uiState.metricsOpen = {};
            if (this.data.uiState.metricsOpen.estudiantes === undefined) this.data.uiState.metricsOpen.estudiantes = false;
            if (!this.data.resumenMatriculaManual) this.data.resumenMatriculaManual = {};
        }

        // Ensure Config Exists and Matches Standards
        if (this.data.configAcademica && this.data.configAcademica.dimensions) {
            this.data.configAcademica.dimensions = this.data.configAcademica.dimensions.map(d => {
                if (d.key === 'extra') return { ...d, key: 'extraAula', nombre: 'Actividades Extra-Aula' };
                if (d.key === 'examen') return { ...d, key: 'examenes', nombre: 'Examen Escrito o Práctico' };
                return d;
            });
            
            const exam = this.data.configAcademica.dimensions.find(d => d.key === 'examenes');
            const needsUpdate = !exam || (exam.porcentaje !== 50) || (exam.max !== 5) || this.data.configAcademica.dimensions.length !== CONFIG.dimensions.length;

            if (needsUpdate) {
                this.data.configAcademica.dimensions = JSON.parse(JSON.stringify(CONFIG.dimensions));
                this.save();
            }
        } else {
            this.data.configAcademica = { dimensions: JSON.parse(JSON.stringify(CONFIG.dimensions)) };
            this.save();
        }

        if (this.data.actividades) {
            this.data.actividades.forEach(a => {
                if (a.dimensionKey === 'extra') a.dimensionKey = 'extraAula';
                if (a.dimensionKey === 'examen') a.dimensionKey = 'examenes';
                const isVal = (a.dimensionKey === 'actitudes') || (a.nombre && a.nombre.toLowerCase().includes('valores'));
                if (isVal && (Number(a.puntajeMax) === 5 || !a.puntajeMax)) {
                    a.puntajeMax = 10;
                    if (a.customFollowups && a.customFollowups.length > 0) {
                        const sumF = a.customFollowups.reduce((s, f) => s + (parseFloat(f.puntaje) || 0), 0) || 1;
                        if (sumF < 10) {
                            const scale = 10 / sumF;
                            a.customFollowups.forEach(f => {
                                f.puntaje = Math.round((f.puntaje * scale) * 10) / 10;
                            });
                            const newSum = a.customFollowups.reduce((s, f) => s + (parseFloat(f.puntaje) || 0), 0);
                            const diff = 10 - newSum;
                            if (Math.abs(diff) > 0.01) {
                                a.customFollowups[a.customFollowups.length - 1].puntaje = Math.round((a.customFollowups[a.customFollowups.length - 1].puntaje + diff) * 10) / 10;
                            }
                        }
                    }
                }
            });
        }

        if (this.data.rubricas) {
            const tVal = this.data.rubricas.find(r => r.id === 'template_valores');
            if (tVal && tVal.puntajeTotal === 5) {
                tVal.puntajeTotal = 10;
                if (tVal.criterios) {
                    tVal.criterios.forEach(c => {
                        c.peso = 5;
                        if (c.niveles && c.niveles[0]) c.niveles[0].valor = 5;
                    });
                }
            }
        }
        
        // El usuario pidió "no echar a perder nada". Si no hay cursos, NO inyectamos datos demo destructivos.
        // if (!this.data.cursos || this.data.cursos.length === 0) {
        //     this.seedData();
        // }

        if (!this.data.configRespaldo) {
            this.data.configRespaldo = { backupAlAbrir: true, backupSemanal: false, lastBackupTime: 0, lastBackupVersion: '' };
        }

        // Ejecutar Motor de Respaldos Automáticos
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
            setTimeout(() => {
                const now = new Date().getTime();
                const version = typeof CONFIG !== 'undefined' && CONFIG.version ? CONFIG.version : "1.0";
                const cnf = this.data.configRespaldo;
                const hrs24 = 24 * 60 * 60 * 1000;
                
                let triggerBackup = false;
                let fileName = "";
                
                // Backup Pre-actualización
                if (cnf.lastBackupVersion && cnf.lastBackupVersion !== version) {
                    triggerBackup = true;
                    fileName = `Respaldo_Pre_Actualizacion_v${version}.json`;
                }
                // Backup Diario al abrir
                else if (cnf.backupAlAbrir && (!cnf.lastBackupTime || (now - cnf.lastBackupTime > hrs24))) {
                    triggerBackup = true;
                    const d = new Date();
                    const pad = n => n.toString().padStart(2,'0');
                    fileName = `Respaldo_Diario_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}.json`;
                }

                if (triggerBackup) {
                    window.Capacitor.Plugins.Filesystem.writeFile({
                        path: fileName,
                        data: Security.encrypt(this.data),
                        directory: 'DATA',
                        encoding: 'utf8'
                    }).then(() => {
                        cnf.lastBackupTime = now;
                        cnf.lastBackupVersion = version;
                        StorageAPI.set(APP_KEY, this.data);
                        try { localStorage.setItem(APP_KEY, JSON.stringify(this.data)); } catch(e){}
                        console.log("Respaldo automático generado:", fileName);
                    }).catch(e => console.error("Error al crear auto-backup:", e));
                }
            }, 3000); // Esperar 3 seg para no bloquear el inicio
        }
    },
    reset() {
        this.data = {
            cursos: [],
            estudiantes: [],
            matriculas: [],
            configAcademica: null,
            actividades: [],
            calificaciones: [],
            asistencia: [],
            parciales: [],
            diasNoLectivos: [],
            sartAlertas: [],
            agendaEventos: [],
            agendaEventosInstitucionales: [],
            agendaSettings: {},
            planificaciones: [],
            jornalizaciones: [],
            activeCourseId: null
        };
        this.save();
    },
    save() {
        // Guardado asíncrono en IndexedDB (no bloquea UI)
        StorageAPI.set(APP_KEY, this.data).catch(e => console.error(e));
        
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            try {
                const strData = JSON.stringify(this.data);
                
                // Fallback redundante en localStorage
                localStorage.setItem(APP_KEY, strData);
                
                if (window.GoogleSheetsSync && typeof window.GoogleSheetsSync.debouncedSync === 'function') {
                    window.GoogleSheetsSync.debouncedSync();
                }
                
                // Fase 2: Paracaídas Invisible (Capacitor Native Backup)
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
                    window.Capacitor.Plugins.Filesystem.writeFile({
                        path: 'Aula360_Native_Backup.json',
                        data: strData,
                        directory: 'DATA',
                        encoding: 'utf8'
                    }).catch(e => console.log("Error silencioso en backup nativo:", e));
                }
            } catch(e) {}
        }, 500);
    },
    get(collection) { return this.data[collection] || []; },
    set(collection, data) {
        this.data[collection] = data;
        this.save();
    },
    add(collection, item, skipSave = false) {
        if (!item.id) item.id = Utils.id();
        item.creadoEn = Utils.timestamp();
        this.data[collection].push(item);
        if (!skipSave) this.save();
        return item;
    },
    update(collection, id, updates, skipSave = false) {
        const idx = this.data[collection].findIndex(x => x.id === id);
        if (idx === -1) return null;
        this.data[collection][idx] = { ...this.data[collection][idx], ...updates };
        if (!skipSave) this.save();
        return this.data[collection][idx];
    },
    delete(collection, id, skipSave = false) {
        this.data[collection] = this.data[collection].filter(x => x.id !== id);
        if (!skipSave) this.save();
    },
    // Specific Helpers
    getActiveCourse() {
        return this.data.cursos.find(c => c.id === this.data.activeCourseId);
    },
    getCargasDocentes() {
        return this.data.cargasDocentes || [];
    },
    getCargaDocenteByCurso(cursoId) {
        return (this.data.cargasDocentes || []).find(cg => cg.cursoId === cursoId);
    },
    saveCargaDocente(carga) {
        if (!this.data.cargasDocentes) this.data.cargasDocentes = [];
        const idx = this.data.cargasDocentes.findIndex(cg => cg.id === carga.id || (cg.cursoId === carga.cursoId && cg.parcialId === carga.parcialId));
        if (idx !== -1) {
            this.data.cargasDocentes[idx] = carga;
        } else {
            this.data.cargasDocentes.push(carga);
        }
        this.save();
    },
    updateCursoEstado(cursoId, nuevoEstado) {
        const c = this.data.cursos.find(x => x.id === cursoId);
        if (c) {
            c.estado = nuevoEstado;
            if (this.data.cargasDocentes) {
                const cg = this.data.cargasDocentes.find(x => x.cursoId === cursoId);
                if (cg) cg.estado = nuevoEstado;
            }
            this.save();
            return true;
        }
        return false;
    },
    getExtraPointSettings(centerId, academicYear, partialId) {
        if (!this.data.extraPointSettings) this.data.extraPointSettings = [];
        const s = this.data.extraPointSettings.find(x => 
            (x.center_id === centerId || !x.center_id) &&
            (x.academic_year === academicYear || !x.academic_year) &&
            (x.partial_id === partialId || !x.partial_id)
        );
        return s || { enabled: true, final_score_mode: 'cap_reportable_at_100', reportable_score_cap: 100 };
    },
    saveExtraPointSettings(setting) {
        if (!this.data.extraPointSettings) this.data.extraPointSettings = [];
        const idx = this.data.extraPointSettings.findIndex(x => x.id === setting.id || (x.center_id === setting.center_id && x.partial_id === setting.partial_id));
        if (idx !== -1) {
            this.data.extraPointSettings[idx] = { ...this.data.extraPointSettings[idx], ...setting, updated_at: Utils.timestamp() };
        } else {
            if (!setting.id) setting.id = 'eps_' + Utils.id();
            setting.created_at = Utils.timestamp();
            this.data.extraPointSettings.push(setting);
        }
        this.save();
    },
    getExtraPointActivities(courseId, partialId) {
        return this.getExtraordinaryActivities(courseId, partialId);
    },
    saveExtraPointActivity(act) {
        if (!this.data.extraPointActivities) this.data.extraPointActivities = [];
        const idx = this.data.extraPointActivities.findIndex(a => a.id === act.id);
        if (idx !== -1) {
            this.data.extraPointActivities[idx] = { ...this.data.extraPointActivities[idx], ...act, updated_at: Utils.timestamp() };
        } else {
            if (!act.id) act.id = 'epa_' + Utils.id();
            act.created_at = Utils.timestamp();
            this.data.extraPointActivities.push(act);
        }
        this.save();
        return act;
    },
    deleteExtraPointActivity(actId) {
        if (this.data.extraPointActivities) {
            this.data.extraPointActivities = this.data.extraPointActivities.filter(a => a.id !== actId);
        }
        if (this.data.extraPointRecords) {
            this.data.extraPointRecords = this.data.extraPointRecords.filter(r => r.extra_activity_id !== actId);
        }
        this.save();
    },
    getExtraPointRecords(activityId) {
        const list = this.data.extraPointRecords || [];
        return list.filter(r => r.extra_activity_id === activityId);
    },
    saveExtraPointRecord(record) {
        if (!this.data.extraPointRecords) this.data.extraPointRecords = [];
        const idx = this.data.extraPointRecords.findIndex(r => r.extra_activity_id === record.extra_activity_id && r.student_id === record.student_id);
        if (idx !== -1) {
            this.data.extraPointRecords[idx] = { ...this.data.extraPointRecords[idx], ...record, updated_at: Utils.timestamp() };
        } else {
            if (!record.id) record.id = 'epr_' + Utils.id();
            record.created_at = Utils.timestamp();
            this.data.extraPointRecords.push(record);
        }
        this.save();
    },
    getExtraPointsForStudent(studentId, courseId, partialId) {
        return this.getStudentExtraordinaryPoints(studentId, courseId, partialId);
    },
    setActiveCourse(id, route = null) {
        this.data.activeCourseId = id;
        this.save();
        UI.updateHeader();
        
        // Determinar la ruta de destino: 
        // 1. Si se provee una ruta explícita, usarla.
        // 2. Si no, intentar usar la ruta actual (Router.current).
        // 3. Como último recurso, ir al panel.
        const targetRoute = route || Router.current || 'panel';
        Router.navigate(targetRoute);
    },
    getStudentsByCourse(courseId) {
        const enrollment = this.data.matriculas.filter(m => m.cursoId === courseId);
        return enrollment.map(m => {
            const st = this.data.estudiantes.find(e => e.id === m.estudianteId);
            if (!st) return null;
            return { ...st, enrollmentId: m.id };
        }).filter(Boolean).sort((a, b) => {
            const gA = a.genero || 'Z';
            const gB = b.genero || 'Z';
            if (gA !== gB) return gA.localeCompare(gB);
            return (a.nombreCompleto || '').localeCompare(b.nombreCompleto || '');
        });
    },
    getParcialByCourse(courseId) {
        if (!this.data || !Array.isArray(this.data.parciales)) return [];
        return this.data.parciales.filter(p => p.cursoId === courseId).sort((a, b) => a.numero - b.numero);
    },
    createDefaultParciales(courseId, anio = 2026) {
        // Clear existing parciales for this course
        this.data.parciales = this.data.parciales.filter(p => p.cursoId !== courseId);

        const parcialConfig = [
            { numero: 1, nombre: "Primer Parcial", inicio: `${anio}-02-01`, fin: `${anio}-04-15`, meses: [1, 2, 3] },
            { numero: 2, nombre: "Segundo Parcial", inicio: `${anio}-04-16`, fin: `${anio}-06-30`, meses: [3, 4, 5] },
            { numero: 3, nombre: "Tercer Parcial", inicio: `${anio}-07-01`, fin: `${anio}-09-15`, meses: [6, 7, 8] },
            { numero: 4, nombre: "Cuarto Parcial", inicio: `${anio}-09-16`, fin: `${anio}-11-30`, meses: [8, 9, 10] }
        ];

        parcialConfig.forEach(config => {
            this.add('parciales', {
                cursoId: courseId,
                numero: config.numero,
                nombre: config.nombre,
                fechaInicio: config.inicio,
                fechaFin: config.fin,
                meses: config.meses
            });
        });
        UI.toast('Parciales creados correctamente');
        return this.getParcialByCourse(courseId);
    },
    isDiaNoLectivo(fecha, cursoId) {
        return this.data.diasNoLectivos.some(d =>
            d.fecha === fecha && (d.cursoId === cursoId || d.alcance === 'global')
        );
    },
    createCalendarioEscolarHonduras(cursoId, anio = 2026) {
        // Clear existing non-school days for this course
        this.data.diasNoLectivos = this.data.diasNoLectivos.filter(d => d.cursoId !== cursoId);

        const diasNoLectivos = [
            // Enero - Inicio de matrícula
            { fecha: `${anio}-01-01`, razon: 'Año Nuevo', alcance: 'global' },

            // Febrero - Evaluación del Desempeño Académico
            { fecha: `${anio}-02-09`, razon: 'Evaluación Español y Matemáticas', alcance: 'curso' },
            { fecha: `${anio}-02-10`, razon: 'Evaluación Español y Matemáticas', alcance: 'curso' },
            { fecha: `${anio}-02-11`, razon: 'Evaluación Español y Matemáticas', alcance: 'curso' },
            { fecha: `${anio}-02-12`, razon: 'Evaluación Español y Matemáticas', alcance: 'curso' },
            { fecha: `${anio}-02-13`, razon: 'Evaluación Español y Matemáticas', alcance: 'curso' },

            // Marzo - Entrega de informes
            { fecha: `${anio}-03-02`, razon: 'Entrega de Informe de Logros', alcance: 'curso' },
            { fecha: `${anio}-03-03`, razon: 'Entrega de Informe de Logros', alcance: 'curso' },
            { fecha: `${anio}-03-04`, razon: 'Entrega de Informe de Logros', alcance: 'curso' },
            { fecha: `${anio}-03-05`, razon: 'Entrega de Informe de Logros', alcance: 'curso' },
            { fecha: `${anio}-03-06`, razon: 'Entrega de Informe de Logros', alcance: 'curso' },

            // Abril - Semana Santa (ajustado a 2026)
            { fecha: `${anio}-04-02`, razon: 'Jueves Santo', alcance: 'global' },
            { fecha: `${anio}-04-03`, razon: 'Viernes Santo', alcance: 'global' },
            { fecha: `${anio}-04-04`, razon: 'Sábado de Gloria', alcance: 'global' },
            { fecha: `${anio}-04-14`, razon: 'Día de las Américas', alcance: 'global' },

            // Mayo
            { fecha: `${anio}-05-01`, razon: 'Día del Trabajo', alcance: 'global' },

            // Junio - Día del Estudiante y finalización primer semestre
            { fecha: `${anio}-06-26`, razon: 'Entrega de Notas Primer Semestre', alcance: 'curso' },
            { fecha: `${anio}-06-30`, razon: 'Día del Estudiante', alcance: 'global' },

            // Julio - Vacaciones de medio año
            { fecha: `${anio}-07-20`, razon: 'Inicio Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-21`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-22`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-23`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-24`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-27`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-28`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-29`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-30`, razon: 'Vacaciones Medio Año', alcance: 'curso' },
            { fecha: `${anio}-07-31`, razon: 'Vacaciones Medio Año', alcance: 'curso' },

            // Septiembre - Fiestas Patrias y Semana del Receso Académico
            { fecha: `${anio}-09-15`, razon: 'Día de la Independencia', alcance: 'global' },
            { fecha: `${anio}-09-21`, razon: 'Semana del Receso Académico', alcance: 'curso' },
            { fecha: `${anio}-09-22`, razon: 'Semana del Receso Académico', alcance: 'curso' },
            { fecha: `${anio}-09-23`, razon: 'Semana del Receso Académico', alcance: 'curso' },
            { fecha: `${anio}-09-24`, razon: 'Semana del Receso Académico', alcance: 'curso' },
            { fecha: `${anio}-09-25`, razon: 'Semana del Receso Académico', alcance: 'curso' },

            // Octubre - Continuación Receso y Día de la Raza
            { fecha: `${anio}-10-05`, razon: 'Día del Maestro', alcance: 'global' },
            { fecha: `${anio}-10-12`, razon: 'Día de la Raza', alcance: 'global' },
            { fecha: `${anio}-10-21`, razon: 'Día de las Fuerzas Armadas', alcance: 'global' },

            // Diciembre - Finalización año escolar
            { fecha: `${anio}-12-14`, razon: 'Entrega de Notas Finales', alcance: 'curso' },
            { fecha: `${anio}-12-15`, razon: 'Finalización Año Escolar', alcance: 'curso' },
            { fecha: `${anio}-12-16`, razon: 'Finalización Año Escolar', alcance: 'curso' },
            { fecha: `${anio}-12-17`, razon: 'Finalización Año Escolar', alcance: 'curso' },
            { fecha: `${anio}-12-18`, razon: 'Finalización Año Escolar', alcance: 'curso' },
            { fecha: `${anio}-12-25`, razon: 'Navidad', alcance: 'global' }
        ];

        diasNoLectivos.forEach(dia => {
            this.add('diasNoLectivos', {
                cursoId: dia.alcance === 'global' ? null : cursoId,
                fecha: dia.fecha,
                razon: dia.razon,
                alcance: dia.alcance
            });
        });

        UI.toast(`${diasNoLectivos.length} días no lectivos agregados al calendario 2026`);
        return diasNoLectivos;
    },
    seedData() {
        // 1. Create Course
        const course = this.add('cursos', { asignatura: 'Español', grado: '7°', seccion: 1, anio: 2026, jornadaInicio: '07:00', jornadaFin: '12:00' });
        this.setActiveCourse(course.id);

        // 2. Create Students
        const students = [
            'Juan Pérez', 'María López', 'Carlos Rodríguez', 'Ana García', 'Luis Martínez',
'Sofía Hernández', 'Pedro Sánchez', 'Lucía Díaz', 'Miguel Flores', 'Elena Torres'
        ];
        students.forEach((name, i) => {
            const s = this.add('estudiantes', {
                nombreCompleto: name, identidad: `0801-${1990 + i}-${10000 + i}`,
                telefono: `99${i}0-00${i}0`, datosPadre: `Padre de ${name.split(' ')[0]}`,
                domicilio: 'Tegucigalpa'
            });
            this.add('matriculas', { cursoId: course.id, estudianteId: s.id });
        });

        // 3. Create Activities
        // Aula (25%): 1 Act = 25% value
        this.add('actividades', { cursoId: course.id, dimensionKey: 'aula', nombre: 'Actividades del Libro de Texto', puntajeMax: 25, fecha: Utils.timestamp().split('T')[0] });

        // Extra-Aula (10%): 2 Acts. 5 + 5 = 10% value
        this.add('actividades', { cursoId: course.id, dimensionKey: 'extraAula', nombre: 'Diario de Lectura', puntajeMax: 5, fecha: Utils.timestamp().split('T')[0] });
        this.add('actividades', { cursoId: course.id, dimensionKey: 'extraAula', nombre: 'Redacción de Textos', puntajeMax: 5, fecha: Utils.timestamp().split('T')[0] });

        // Valores (10%): 1 Act = 10% value
        this.add('actividades', { cursoId: course.id, dimensionKey: 'actitudes', nombre: 'Asistencia y Aseo del aula', puntajeMax: 10, fecha: Utils.timestamp().split('T')[0] });

        // Expresiones (5%): 1 Act = 5% value
        this.add('actividades', { cursoId: course.id, dimensionKey: 'expresiones', nombre: 'Participación Cívica', puntajeMax: 5, fecha: Utils.timestamp().split('T')[0] });

        // Examenes (50%): 20 + 20 + 10 = 50% value
        this.add('actividades', { cursoId: course.id, dimensionKey: 'examenes', nombre: 'Examen 1', puntajeMax: 20, fecha: Utils.timestamp().split('T')[0] });
        this.add('actividades', { cursoId: course.id, dimensionKey: 'examenes', nombre: 'Examen 2', puntajeMax: 20, fecha: Utils.timestamp().split('T')[0] });
        this.add('actividades', { cursoId: course.id, dimensionKey: 'examenes', nombre: 'Prueba Formativa Mensual', puntajeMax: 10, fecha: Utils.timestamp().split('T')[0] });

        // 4. Random Grades & Attendance
        const allStudents = this.getStudentsByCourse(course.id);
        const allActivities = this.get('actividades').filter(a => a.cursoId === course.id);

        allStudents.forEach(st => {
            // Grades
            allActivities.forEach(act => {
                const max = Number(act.puntajeMax);
                const obtained = Math.floor(Math.random() * (max - (max * 0.6) + 1)) + (max * 0.6); // Random between 60% and 100%
                this.add('calificaciones', { cursoId: course.id, actividadId: act.id, estudianteId: st.id, puntajeObtenido: obtained, porcentajeObtenido: (obtained / max) * 100 });
            });

            // Attendance (Last 10 days)
            for (let d = 0; d <10; d++) {
                const date = new Date();
                date.setDate(date.getDate() - d);
                if (date.getDay() === 0) continue;
                const dateStr = date.toISOString().split('T')[0];
                const status = Math.random() > 0.1 ? 'P' : (Math.random() > 0.5 ? 'A' : 'T');
                this.add('asistencia', { cursoId: course.id, fecha: dateStr, estudianteId: st.id, estado: status });
            }
        });

        // 5. Create Parciales
        this.createDefaultParciales(course.id, 2026);

        // 6. Create Calendario Escolar (días no lectivos)
        this.createCalendarioEscolarHonduras(course.id, 2026);

        UI.toast('Curso de prueba generado con éxito');
        Router.navigate('panel');
    },
    seedRubricas() {
        const templates = [
            {
                id: 'template_reading',
                nombre: 'Diario de Lectura',
                descripcion: 'Evaluación integral del proceso de lectura mensual.',
                asignatura: 'Español',
                gradoSugerido: 'General',
                categoria: 'Proyecto',
                tipoRubrica: 'analitica',
                puntajeTotal: 15,
                metodoCalculo: 'suma_directa',
                estado: 'Activa',
                criterios: [
                    { id: 'c1', nombre: 'Comprensión Lectora', peso: 5, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 5, descriptor: 'Identifica ideas principales y detalles.' },
                        { id: 'n2', nombre: 'Básico', valor: 3, descriptor: 'Identifica solo ideas principales.' },
                        { id: 'n3', nombre: 'Necesita mejorar', valor: 1, descriptor: 'Dificultad para comprender el texto.' }
                    ]},
                    { id: 'c2', nombre: 'Calidad del Resumen', peso: 5, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 5, descriptor: 'Sintetiza correctamente lo leído.' },
                        { id: 'n2', nombre: 'Básico', valor: 3, descriptor: 'Resumen parcial.' },
                        { id: 'n3', nombre: 'Necesita mejorar', valor: 1, descriptor: 'No sintetiza ideas.' }
                    ]},
                    { id: 'c3', nombre: 'Ortografía y Caligrafía', peso: 5, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 5, descriptor: 'Sin errores y letra legible.' },
                        { id: 'n2', nombre: 'Básico', valor: 3, descriptor: 'Pocos errores.' },
                        { id: 'n3', nombre: 'Necesita mejorar', valor: 1, descriptor: 'Muchos errores.' }
                    ]}
                ],
                isTemplate: true
            },
            {
                id: 'template_writing',
                nombre: 'Producción Escrita',
                descripcion: 'Evaluación de textos narrativos, descriptivos y expositivos.',
                asignatura: 'Español',
                gradoSugerido: 'General',
                categoria: 'Producción escrita',
                tipoRubrica: 'analitica',
                puntajeTotal: 10,
                metodoCalculo: 'suma_directa',
                estado: 'Activa',
                criterios: [
                    { id: 'c1', nombre: 'Coherencia y Cohesión', peso: 4, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 4, descriptor: 'Ideas lógicas y conectadas.' },
                        { id: 'n2', nombre: 'Básico', valor: 2, descriptor: 'Se entiende pero falta conexión.' }
                    ]},
                    { id: 'c2', nombre: 'Vocabulario', peso: 3, niveles: [
                        { id: 'n1', nombre: 'Varias palabras', valor: 3, descriptor: 'Uso de sinónimos.' },
                        { id: 'n2', nombre: 'Limitado', valor: 1.5, descriptor: 'Repetición de palabras.' }
                    ]},
                    { id: 'c3', nombre: 'Puntuación', peso: 3, niveles: [
                        { id: 'n1', nombre: 'Correcto', valor: 3, descriptor: 'Uso adecuado de puntos y comas.' },
                        { id: 'n2', nombre: 'Incorrecto', valor: 1, descriptor: 'Texto sin pausas.' }
                    ]}
                ],
                isTemplate: true
            },
            {
                id: 'template_oral',
                nombre: 'Exposición Oral',
                descripcion: 'Evaluación de presentaciones y defensa de temas.',
                asignatura: 'General',
                gradoSugerido: 'General',
                categoria: 'Exposición',
                tipoRubrica: 'analitica',
                puntajeTotal: 10,
                metodoCalculo: 'suma_directa',
                estado: 'Activa',
                criterios: [
                    { id: 'c1', nombre: 'Dominio del Tema', peso: 4, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 4, descriptor: 'Explica con seguridad sin leer.' },
                        { id: 'n2', nombre: 'Aceptable', valor: 2, descriptor: 'Lee ocasionalmente.' }
                    ]},
                    { id: 'c2', nombre: 'Material de Apoyo', peso: 3, niveles: [
                        { id: 'n1', nombre: 'Creativo', valor: 3, descriptor: 'Llamativo y útil.' },
                        { id: 'n2', nombre: 'Simple', valor: 1.5, descriptor: 'Solo texto, poco apoyo.' }
                    ]},
                    { id: 'c3', nombre: 'Voz y Postura', peso: 3, niveles: [
                        { id: 'n1', nombre: 'Profesional', valor: 3, descriptor: 'Buen volumen y contacto visual.' },
                        { id: 'n2', nombre: 'Tímido', valor: 1, descriptor: 'Voz baja, sin mirada.' }
                    ]}
                ],
                isTemplate: true
            },
            {
                id: 'template_notebook',
                nombre: 'Cuaderno de Práctica',
                descripcion: 'Revisión periódica de ejercicios y tareas.',
                asignatura: 'General',
                gradoSugerido: 'General',
                categoria: 'Cuaderno de práctica',
                tipoRubrica: 'escala_simple',
                puntajeTotal: 5,
                metodoCalculo: 'suma_directa',
                estado: 'Activa',
                criterios: [
                    { id: 'c1', nombre: 'Completitud', peso: 3, niveles: [
                        { id: 'n1', nombre: 'Completo', valor: 3 },
                        { id: 'n2', nombre: 'Incompleto', valor: 1 }
                    ]},
                    { id: 'c2', nombre: 'Orden', peso: 2, niveles: [
                        { id: 'n1', nombre: 'Limpio', valor: 2 },
                        { id: 'n2', nombre: 'Descuidado', valor: 0.5 }
                    ]}
                ],
                isTemplate: true
            },
            {
                id: 'template_valores',
                nombre: 'Cuaderno de Valores',
                descripcion: 'Evaluación de actitudes, puntualidad, compañerismo y respeto.',
                asignatura: 'General',
                gradoSugerido: 'General',
                categoria: 'Cuaderno de valores',
                tipoRubrica: 'escala_simple',
                puntajeTotal: 10,
                metodoCalculo: 'suma_directa',
                estado: 'Activa',
                criterios: [
                    { id: 'c1', nombre: 'Comportamiento y Actitud', peso: 5, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 5, descriptor: 'Muestra respeto y empatía.' },
                        { id: 'n2', nombre: 'Bajo', valor: 1, descriptor: 'Falta al respeto o interrumpe.' }
                    ]},
                    { id: 'c2', nombre: 'Puntualidad y Responsabilidad', peso: 5, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 5, descriptor: 'Entrega tareas a tiempo y asiste puntual.' },
                        { id: 'n2', nombre: 'Bajo', valor: 1, descriptor: 'Impuntual o entregas tardías.' }
                    ]}
                ],
                isTemplate: true
            },
            {
                id: 'template_garden',
                nombre: 'Huerto Escolar',
                descripcion: 'Evaluación de actividades prácticas en el huerto.',
                asignatura: 'Ciencias Naturales',
                gradoSugerido: 'General',
                categoria: 'Huerto escolar',
                tipoRubrica: 'analitica',
                puntajeTotal: 20,
                metodoCalculo: 'suma_directa',
                estado: 'Activa',
                criterios: [
                    { id: 'c1', nombre: 'Uso de herramientas', peso: 10, niveles: [
                        { id: 'n1', nombre: 'Correcto', valor: 10, descriptor: 'Sigue normas de seguridad.' },
                        { id: 'n2', nombre: 'Incorrecto', valor: 4, descriptor: 'Pone en riesgo seguridad.' }
                    ]},
                    { id: 'c2', nombre: 'Cuidado de plantas', peso: 10, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 10, descriptor: 'Siembra y riega con técnica.' },
                        { id: 'n2', nombre: 'Deficiente', valor: 3, descriptor: 'Daña las plantas.' }
                    ]}
                ],
                isTemplate: true
            },
            {
                id: 'template_project',
                nombre: 'Proyecto General',
                descripcion: 'Base para cualquier proyecto de investigación o práctico.',
                asignatura: 'General',
                gradoSugerido: 'General',
                categoria: 'Proyecto',
                tipoRubrica: 'analitica',
                puntajeTotal: 100,
                metodoCalculo: 'conversion_porcentual',
                estado: 'Activa',
                criterios: [
                    { id: 'c1', nombre: 'Planteamiento', peso: 20, niveles: [
                        { id: 'n1', nombre: 'Muy claro', valor: 20 },
                        { id: 'n2', nombre: 'Confuso', valor: 5 }
                    ]},
                    { id: 'c2', nombre: 'Investigación', peso: 40, niveles: [
                        { id: 'n1', nombre: 'Profunda', valor: 40 },
                        { id: 'n2', nombre: 'Superficial', valor: 10 }
                    ]},
                    { id: 'c3', nombre: 'Conclusiones', peso: 20, niveles: [
                        { id: 'n1', nombre: 'Válidas', valor: 20 },
                        { id: 'n2', nombre: 'Inexistentes', valor: 0 }
                    ]},
                    { id: 'c4', nombre: 'Presentación', peso: 20, niveles: [
                        { id: 'n1', nombre: 'Excelente', valor: 20 },
                        { id: 'n2', nombre: 'Pobre', valor: 5 }
                    ]}
                ],
                isTemplate: true
            }
        ];
        templates.forEach(t => {
            if (!this.data.rubricas.find(r => r.id === t.id)) {
                this.data.rubricas.push(t);
            }
        });
        this.save();
    },

    // ─── ACTIVIDADES EXTRAORDINARIAS (MÓDULO COMPLEMENTARIO) ─────────
    getMatchingCourses(courseId) {
        if (!this.data.cursos || !Array.isArray(this.data.cursos)) return [];
        const target = this.data.cursos.find(c => c.id === courseId);
        if (!target) return [];

        const norm = s => (s || '').toString().trim().toLowerCase();
        const targetCentro = norm(target.centroEducativo);
        const targetGrado = norm(target.grado);
        const targetJornada = norm(target.jornadaP || target.jornada);
        const targetSeccion = norm(target.seccion);
        const targetAnio = target.anio ? String(target.anio) : '';

        return this.data.cursos.filter(c => {
            if (c.id === target.id) return true;
            if (norm(c.grado) !== targetGrado) return false;

            const cJornada = norm(c.jornadaP || c.jornada);
            if (cJornada !== targetJornada) return false;

            if (targetCentro && norm(c.centroEducativo) !== targetCentro) return false;

            if (targetSeccion && norm(c.seccion) !== targetSeccion) return false;

            if (targetAnio && c.anio && String(c.anio) !== targetAnio) return false;

            return true;
        });
    },

    getExtraordinaryActivities(courseId, partialId) {
        if (!this.data.extraordinary_activities) this.data.extraordinary_activities = [];

        const matchingCourses = this.getMatchingCourses(courseId);
        const matchingCourseIds = matchingCourses.length > 0 ? matchingCourses.map(c => c.id) : [courseId];

        let targetParcialNumber = null;
        if (partialId && this.data.parciales) {
            const targetParcial = this.data.parciales.find(p => p.id === partialId);
            if (targetParcial) {
                targetParcialNumber = targetParcial.numero;
            }
        }

        const matchingParcialIds = new Set();
        if (targetParcialNumber !== null && this.data.parciales) {
            this.data.parciales.forEach(p => {
                if (matchingCourseIds.includes(p.cursoId) && p.numero === targetParcialNumber) {
                    matchingParcialIds.add(p.id);
                }
            });
        }
        if (partialId) {
            matchingParcialIds.add(partialId);
        }

        const activities = this.data.extraordinary_activities.filter(a => {
            if (a.status === 'DELETED') return false;
            const matchesCourse = matchingCourseIds.includes(a.course_id);
            if (!matchesCourse) return false;

            if (!partialId) return true;

            return matchingParcialIds.has(a.partial_id);
        });

        const seenIds = new Set();
        const uniqueActs = [];
        for (const a of activities) {
            if (!seenIds.has(a.id)) {
                seenIds.add(a.id);
                uniqueActs.push(a);
            }
        }
        return uniqueActs;
    },

    saveExtraordinaryActivity(activityObj) {
        if (!this.data.extraordinary_activities) this.data.extraordinary_activities = [];
        const idx = this.data.extraordinary_activities.findIndex(a => a.id === activityObj.id);
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const userStr = this.data.perfilDocente?.nombre || 'Docente';

        if (!activityObj.audit_history) activityObj.audit_history = [];
        activityObj.audit_history.push({
            action: idx >= 0 ? 'UPDATED' : 'CREATED',
            user: userStr,
            date: dateStr,
            time: timeStr
        });

        if (idx >= 0) {
            this.data.extraordinary_activities[idx] = { ...this.data.extraordinary_activities[idx], ...activityObj };
        } else {
            this.data.extraordinary_activities.push(activityObj);
        }
        this.save();
        return activityObj;
    },

    deleteExtraordinaryActivity(activityId) {
        if (!this.data.extraordinary_activities) return;
        this.data.extraordinary_activities = this.data.extraordinary_activities.filter(a => a.id !== activityId);
        if (this.data.activity_bonus_records) {
            this.data.activity_bonus_records = this.data.activity_bonus_records.filter(r => r.extraordinary_activity_id !== activityId);
        }
        this.save();
    },

    getActivityBonusRecords(activityId) {
        if (!this.data.activity_bonus_records) this.data.activity_bonus_records = [];
        return this.data.activity_bonus_records.filter(r => r.extraordinary_activity_id === activityId);
    },

    saveActivityBonusRecord(recordObj) {
        if (!this.data.activity_bonus_records) this.data.activity_bonus_records = [];
        const idx = this.data.activity_bonus_records.findIndex(r => 
            r.extraordinary_activity_id === recordObj.extraordinary_activity_id && 
            r.student_id === recordObj.student_id
        );

        const now = new Date();
        recordObj.updated_at = now.toISOString();
        recordObj.updated_by = this.data.perfilDocente?.nombre || 'Docente';

        if (idx >= 0) {
            this.data.activity_bonus_records[idx] = { ...this.data.activity_bonus_records[idx], ...recordObj };
        } else {
            this.data.activity_bonus_records.push(recordObj);
        }
        this.save();
    },

    saveBatchActivityBonusRecords(activityId, recordsArray) {
        if (!this.data.activity_bonus_records) this.data.activity_bonus_records = [];
        const now = new Date();
        const updatedBy = this.data.perfilDocente?.nombre || 'Docente';

        recordsArray.forEach(rec => {
            const idx = this.data.activity_bonus_records.findIndex(r => 
                r.extraordinary_activity_id === activityId && 
                r.student_id === rec.student_id
            );
            rec.extraordinary_activity_id = activityId;
            rec.updated_at = now.toISOString();
            rec.updated_by = updatedBy;

            if (idx >= 0) {
                this.data.activity_bonus_records[idx] = { ...this.data.activity_bonus_records[idx], ...rec };
            } else {
                this.data.activity_bonus_records.push(rec);
            }
        });
        this.save();
    },

    getStudentExtraordinaryPoints(studentId, courseId, partialId) {
        if (!this.data.activity_bonus_records) return 0;
        const activities = this.getExtraordinaryActivities(courseId, partialId);
        const actIds = new Set(activities.map(a => a.id));

        return this.data.activity_bonus_records
            .filter(r => r.student_id === studentId && actIds.has(r.extraordinary_activity_id) && r.participated !== false)
            .reduce((sum, r) => sum + (Number(r.points_awarded) || 0), 0);
    },

    getStudentExtraordinaryRecords(studentId, courseId, partialId) {
        const activities = this.getExtraordinaryActivities(courseId, partialId);
        if (!this.data.activity_bonus_records) return [];
        
        return activities.map(act => {
            const rec = this.data.activity_bonus_records.find(r => r.extraordinary_activity_id === act.id && r.student_id === studentId);
            return {
                activity: act,
                record: rec || null,
                points: rec && rec.participated !== false ? (Number(rec.points_awarded) || 0) : 0
            };
        }).filter(item => item.points > 0 || (item.record && item.record.participated));
    },

    getExtraordinarySettings(centerId, academicYear, partialId) {
        if (!this.data.extraordinary_activity_settings) this.data.extraordinary_activity_settings = [];
        const settingsList = Array.isArray(this.data.extraordinary_activity_settings) 
            ? this.data.extraordinary_activity_settings 
            : [this.data.extraordinary_activity_settings];
        
        const key = `${centerId}_${academicYear}_${partialId}`;
        const found = settingsList.find(s => s.id === key || (s.center_id === centerId && s.academic_year == academicYear && s.partial_id === partialId));

        if (found) return found;

        const refParcial = (this.data.parciales || []).find(p => p.id === partialId);
        if (refParcial) {
            const matchByNum = settingsList.find(s => {
                const p = (this.data.parciales || []).find(px => px.id === s.partial_id);
                return (s.center_id === centerId || !s.center_id) && 
                       (s.academic_year == academicYear || !s.academic_year) && 
                       p && p.numero === refParcial.numero;
            });
            if (matchByNum) return matchByNum;
        }

        return {
            id: key,
            center_id: centerId,
            academic_year: academicYear,
            partial_id: partialId,
            enabled: true,
            allow_above_100: false
        };
    },

    saveExtraordinarySettings(settingObj) {
        if (!this.data.extraordinary_activity_settings || !Array.isArray(this.data.extraordinary_activity_settings)) {
            this.data.extraordinary_activity_settings = [];
        }
        const key = settingObj.id || `${settingObj.center_id}_${settingObj.academic_year}_${settingObj.partial_id}`;
        settingObj.id = key;

        const idx = this.data.extraordinary_activity_settings.findIndex(s => s.id === key);
        if (idx >= 0) {
            this.data.extraordinary_activity_settings[idx] = { ...this.data.extraordinary_activity_settings[idx], ...settingObj };
        } else {
            this.data.extraordinary_activity_settings.push(settingObj);
        }
        this.save();
    },

    getExtraordinaryCategories() {
        const baseCategories = [
            'Excursión', 'Participación especial', 'Actividad económica', 'Evento cultural',
            'Actividad institucional', 'Representación académica', 'Representación deportiva',
            'Proyecto comunitario', 'Incentivo lector', 'Otra'
        ];
        const custom = this.data.custom_extraordinary_categories || [];
        return Array.from(new Set([...baseCategories, ...custom]));
    },

    addCustomExtraordinaryCategory(catName) {
        if (!catName || !catName.trim()) return;
        const clean = catName.trim();
        if (!this.data.custom_extraordinary_categories) this.data.custom_extraordinary_categories = [];
        if (!this.data.custom_extraordinary_categories.includes(clean)) {
            this.data.custom_extraordinary_categories.push(clean);
            this.save();
        }
    }
};

