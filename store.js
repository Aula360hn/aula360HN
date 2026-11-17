// --- 0. VERSION & LOG ---
const APP_VERSION_TAG = '2026.05.16.13';
console.log('%c[Aula 360] %cInicializando versión: ' + APP_VERSION_TAG, 'color: #10B981; font-weight: bold;', 'color: #64748b;');

// --- 1. CONFIG & UTILS ---
const APP_KEY = 'gdhndata_v1';
const CONFIG = {
    appName: 'GDHN',
    version: '1.2.0',
    yearDefault: 2026,
    attendanceStates: ['P', 'A', 'E', 'T', 'PM'],
    months: ['Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'], // Feb-Nov logic
    dimensions: [
        { key: 'aula', nombre: 'Trabajo de Aula', porcentaje: 35, max: 5 },
        { key: 'extraAula', nombre: 'Trabajo Extra-Aula', porcentaje: 20, max: 5 },
        { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10, max: 5 },
        { key: 'expresiones', nombre: 'Expresiones Artísticas / Deportivas', porcentaje: 5, max: 5 },
        { key: 'examenes', nombre: 'Examen Escrito o Práctico', porcentaje: 30, max: 5 }
    ],
    courseColors: {
        teal: { start: '#10B981', end: '#0F766E' },
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

// --- DATOS GEOGRÁFICOS Y NORMATIVOS SACE (MODULARIZADOS) ---
// Catálogo territorial y ponderaciones cargados desde honduras_geo.js y normativas_sace.js
const GeoHN = (typeof window !== 'undefined' && window.GeoHN) 
    ? window.GeoHN 
    : (typeof require === 'function' ? require('./honduras_geo.js') : (typeof GeoHN !== 'undefined' ? GeoHN : {}));
if (typeof window !== 'undefined' && !window.GeoHN) window.GeoHN = GeoHN;

const NormativasSACE = (typeof window !== 'undefined' && window.NormativasSACE) 
    ? window.NormativasSACE 
    : (typeof require === 'function' ? require('./normativas_sace.js') : (typeof NormativasSACE !== 'undefined' ? NormativasSACE : {}));
if (typeof window !== 'undefined' && !window.NormativasSACE) window.NormativasSACE = NormativasSACE;

const Utils = {
    id: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: () => new Date().toISOString(),
    formatDate: (iso) => {
        if (!iso) return '';
        if (typeof iso === 'number') {
            const d = new Date(Math.round((iso - 25569) * 86400 * 1000));
            if (!isNaN(d.getTime())) return d.toLocaleDateString();
        }
        const s = String(iso).trim();
        const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmy) {
            return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
        }
        const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (ymd) {
            const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
            if (!isNaN(d.getTime())) return d.toLocaleDateString();
        }
        try {
            const d = new Date(s);
            return isNaN(d.getTime()) ? s : d.toLocaleDateString();
        } catch(e) {
            return s;
        }
    },
    cls: (...classes) => classes.filter(Boolean).join(' '),
    safeGet: (obj, path, def) => path.split('.').reduce((o, i) => o ? o[i] : undefined, obj) || def,
    getDimensionTheme(name, index) {
        const colors = [
            { bg: '#F0FDF4', border: '#D1FAE5', text: '#059669', icon: '#10B981', badge: '#ECFDF5', badgeText: '#047857' },
            { bg: '#F5F3FF', border: '#EDE9FE', text: '#7C3AED', icon: '#8B5CF6', badge: '#F3E8FF', badgeText: '#6D28D9' },
            { bg: '#FDF2F8', border: '#FCE7F3', text: '#DB2777', icon: '#EC4899', badge: '#FCE7F3', badgeText: '#BE185D' },
            { bg: '#EFF6FF', border: '#DBEAFE', text: '#2563EB', icon: '#3B82F6', badge: '#DBEAFE', badgeText: '#1D4ED8' },
            { bg: '#FFFBEB', border: '#FEF3C7', text: '#D97706', icon: '#F59E0B', badge: '#FEF3C7', badgeText: '#B45309' }
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

// --- 1.1 SECURITY MODULE (Cifrado Militar AES & Multi-Formato) ---
const Security = {
    _key: "Aula360_MasterKey_V1",
    encrypt(dataObj) {
        try {
            if (!window.CryptoJS || !window.CryptoJS.AES) return JSON.stringify(dataObj);
            return CryptoJS.AES.encrypt(JSON.stringify(dataObj), this._key).toString();
        } catch(e) {
            console.error("Encryption error", e);
            return JSON.stringify(dataObj);
        }
    },
    decrypt(ciphertext) {
        try {
            if (typeof ciphertext !== 'string') return ciphertext;
            // Limpiar posibles espacios en blanco y Byte Order Mark (BOM) UTF-8
            const clean = ciphertext.replace(/^\uFEFF/, '').trim();
            
            // Si es texto plano JSON (empieza con { o [), parsear directamente
            if (clean.startsWith('{') || clean.startsWith('[')) {
                return JSON.parse(clean);
            }
            
            // Si viene encriptado en AES Base64
            if (window.CryptoJS && window.CryptoJS.AES) {
                const bytes = CryptoJS.AES.decrypt(clean, this._key);
                const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
                if (decryptedStr) return JSON.parse(decryptedStr);
            }
            
            return JSON.parse(clean);
        } catch(e) {
            console.error("Decryption error", e);
            throw new Error("Archivo de respaldo dañado o formato no reconocido: " + (e.message || ''));
        }
    }
};
if (typeof window !== 'undefined') window.Security = Security;

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
        this._initPromise = null;
    }

    async init() {
        if (this._initPromise) return this._initPromise;
        this._initPromise = new Promise((resolve) => {
            if (!window.indexedDB) {
                console.warn("[AulaStorage] IndexedDB no soportado en este entorno, se usará localStorage");
                resolve(null);
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
                    console.log(`[AulaStorage] Migrando BD desde versión ${oldVersion} a ${DB_VERSION}`);
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                if (navigator.storage && navigator.storage.persist) {
                    try {
                        const isPersisted = await navigator.storage.persist();
                        if (isPersisted) {
                            console.log("[Aula 360] Almacenamiento persistente activado con éxito.");
                        }
                    } catch (e) {}
                }
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("[AulaStorage] Error inicializando IndexedDB", event);
                resolve(null);
            };
        });
        return this._initPromise;
    }

    async ensureDB() {
        if (this.db) return this.db;
        return await this.init();
    }

    async get(key) {
        await this.ensureDB();
        return new Promise((resolve) => {
            if (!this.db) return resolve(null);
            try {
                const transaction = this.db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);
                request.onsuccess = () => {
                    if (!request.result) return resolve(null);
                    if (request.result.value !== undefined) return resolve(request.result.value);
                    return resolve(request.result);
                };
                request.onerror = (err) => {
                    console.error("[AulaStorage] Error en lectura get:", err);
                    resolve(null);
                };
            } catch(e) {
                console.error("[AulaStorage] Excepción en lectura get:", e);
                resolve(null);
            }
        });
    }

    async set(key, value) {
        await this.ensureDB();
        return new Promise((resolve) => {
            if (!this.db) return resolve();
            try {
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put({ id: key, value: value });
                request.onsuccess = () => resolve();
                request.onerror = (err) => {
                    console.error("[AulaStorage] Error en guardado set:", err);
                    resolve();
                };
            } catch(e) {
                console.error("[AulaStorage] Excepción en guardado set:", e);
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
        conducta_records: [],
        conducta_tipos: null,
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
        configAsistencia: { autoPresente: false, alertarOmision: true, promptShown: false },
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
        
        // Fase 2: Paracaídas Invisible y Motor de Respaldo Rotativo Atómico
        if (!idbSaved && !lsSaved) {
            if (typeof AutoBackup !== 'undefined' && typeof AutoBackup.recoverLatest === 'function') {
                try {
                    console.log("[Store.init] Buscando respaldo en Motor de Respaldo Rotativo...");
                    const recovered = await AutoBackup.recoverLatest();
                    if (recovered) {
                        idbSaved = recovered;
                        await StorageAPI.set(APP_KEY, idbSaved);
                        try { localStorage.setItem(APP_KEY, JSON.stringify(idbSaved)); } catch(q) {}
                        console.log("[Store.init] ¡Datos recuperados exitosamente desde AutoBackup!");
                    }
                } catch(e) {
                    console.warn('[Store.init] Error en auto-recuperación:', e);
                }
            }
        }
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
                    try { localStorage.setItem(APP_KEY, result.data); } catch(quotaErr) { console.warn('[Aula 360] localStorage quota exceeded on native restore:', quotaErr); }
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
        if (!this.data.configAsistencia) {
            this.data.configAsistencia = { autoPresente: false, alertarOmision: true, promptShown: false };
        }
        if (!this.data.configPreferencias) {
            this.data.configPreferencias = { sonidosHabilitados: true };
        }
        if (!this.data.perfilDocente) {
            this.data.perfilDocente = {
                nombre: '', correo: '', telefono: '', googleDriveUrl: '',
                guias: []
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

        // Recordatorio preventivo no intrusivo en Web/PWA si hay notas y no hay respaldo reciente
        if (!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem)) {
            setTimeout(() => {
                try {
                    const totalNotas = Array.isArray(this.data?.calificaciones) ? this.data.calificaciones.length : 0;
                    if (totalNotas < 10) return;
                    const lastRemind = parseInt(localStorage.getItem('aula360_last_backup_remind') || '0', 10);
                    const lastManual = this.data?.configRespaldo?.lastBackupTime || 0;
                    const now = Date.now();
                    const dias14 = 14 * 24 * 60 * 60 * 1000;
                    const dias7 = 7 * 24 * 60 * 60 * 1000;
                    if ((now - lastManual > dias14) && (now - lastRemind > dias7)) {
                        localStorage.setItem('aula360_last_backup_remind', String(now));
                        if (window.UI && typeof UI.toast === 'function') {
                            UI.toast('Tienes notas guardadas sin respaldo reciente. Exporta una copia en Ajustes → Respaldo.', 'info');
                        }
                    }
                } catch (e) {}
            }, 6000);
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
                    if (typeof AutoBackup !== 'undefined' && typeof AutoBackup.saveDailySnapshot === 'function') {
                        AutoBackup.saveDailySnapshot(this.data);
                    }
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
    reset(skipSave = true) {
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
        if (!skipSave) this.save();
    },
    save(collection) {
        if (collection) {
            this._dirtyCollections = this._dirtyCollections || new Set();
            this._dirtyCollections.add(collection);
        }
        this._hasPendingSave = true;
        
        // Debounce optimizado a 350ms para no saturar CPU en ráfagas de notas o asistencias
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            this.saveNow();
        }, 350);
    },

    saveNow() {
        if (!this.data) return;
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = null;
        }
        this._hasPendingSave = false;

        // 1. Guardado asíncrono no-bloqueante en IndexedDB
        StorageAPI.set(APP_KEY, this.data).catch(e => console.error('[Store.saveNow] Error IndexedDB:', e));

        // 2. Serialización protegida para localStorage y Paracaídas Nativo
        try {
            const strData = JSON.stringify(this.data);
            
            // Fallback redundante en localStorage (blindado contra límite de 5MB)
            try {
                localStorage.setItem(APP_KEY, strData);
            } catch(quotaErr) {
                console.warn("[Aula 360] Cuota de localStorage excedida (5MB). IndexedDB mantiene los datos completos de forma segura:", quotaErr);
            }
            
            if (window.GoogleSheetsSync && typeof window.GoogleSheetsSync.debouncedSync === 'function') {
                window.GoogleSheetsSync.debouncedSync();
            }
            
            // Fase 2: Motor de Respaldo Rotativo Atómico (Slot A / Slot B) y Paracaídas
            if (typeof AutoBackup !== 'undefined' && typeof AutoBackup.saveAtomic === 'function') {
                AutoBackup.saveAtomic(this.data).catch(e => console.warn('[Store.saveNow] Error AutoBackup:', e));
            } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
                window.Capacitor.Plugins.Filesystem.writeFile({
                    path: 'Aula360_Native_Backup.json',
                    data: strData,
                    directory: 'DATA',
                    encoding: 'utf8'
                }).catch(e => console.log("Error silencioso en backup nativo:", e));
            }
        } catch(e) {
            console.error('[Store.saveNow] Error serializando datos:', e);
        }
    },
    get(collection) {
        const val = this.data ? this.data[collection] : null;
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'object') return Object.values(val);
        return [];
    },
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
    getMaestroGuias() {
        const perfil = this.data.perfilDocente || (this.data.perfilDocente = {});
        if (!Array.isArray(perfil.guias)) {
            perfil.guias = [];
            // Migración desde el formato anterior (una sola guía)
            if (perfil.gradoGuia || perfil.cursoGuiaId) {
                perfil.guias.push({
                    id: 'guia_' + Date.now(),
                    cursoId: perfil.cursoGuiaId || '',
                    grado: perfil.gradoGuia || '',
                    seccion: perfil.seccionGuia || '',
                    jornada: perfil.jornadaGuia || '',
                    centro: ''
                });
            }
        }
        return perfil.guias;
    },
    _normGuia(v) {
        return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    },
    _normGrado(v) {
        if (!v) return '';
        const s = String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const numMatch = s.match(/\d+/);
        if (numMatch) return numMatch[0];
        if (s.includes('primer')) return '1';
        if (s.includes('segund')) return '2';
        if (s.includes('tercer')) return '3';
        if (s.includes('cuart')) return '4';
        if (s.includes('quint')) return '5';
        if (s.includes('sext')) return '6';
        if (s.includes('septim')) return '7';
        if (s.includes('octav')) return '8';
        if (s.includes('noven')) return '9';
        if (s.includes('decim')) return '10';
        if (s.includes('once')) return '11';
        if (s.includes('doce')) return '12';
        return s.replace(/[^a-z0-9]/g, '');
    },
    _normSeccion(v) {
        if (!v) return '';
        const s = String(v).toLowerCase().trim();
        const numMatch = s.match(/\d+/);
        if (numMatch) return numMatch[0];
        return s.replace(/[^a-z0-9]/g, '');
    },
    _cursoJornada(c) {
        return c.jornadaP || c.jornada || (c.jornadaInicio ? (c.jornadaInicio >= '12:00' ? 'vespertina' : 'matutina') : '');
    },
    guiaMatchesCurso(g, c) {
        if (!g || !c) return false;
        if (g.cursoId && g.cursoId === c.id) return true;
        if (g.grado && c.grado && this._normGrado(g.grado) !== this._normGrado(c.grado)) return false;
        if (g.seccion && c.seccion && this._normSeccion(g.seccion) !== this._normSeccion(c.seccion)) return false;
        const cj = this._cursoJornada(c);
        if (g.jornada && cj) {
            const gjNorm = this._normGuia(g.jornada);
            const cjNorm = this._normGuia(cj);
            if (gjNorm && cjNorm && !gjNorm.includes(cjNorm) && !cjNorm.includes(gjNorm)) {
                return false;
            }
        }
        if (g.centro && c.centroEducativo) {
            const gcNorm = this._normGuia(g.centro);
            const ccNorm = this._normGuia(c.centroEducativo);
            if (gcNorm && ccNorm && !gcNorm.includes(ccNorm) && !ccNorm.includes(gcNorm)) {
                return false;
            }
        }
        return true;
    },
    getGuiaForCurso(courseId) {
        const c = (this.data.cursos || []).find(x => x.id === courseId);
        if (!c) return null;
        return this.getMaestroGuias().find(g => this.guiaMatchesCurso(g, c)) || null;
    },
    getCursosGuia() {
        return (this.data.cursos || []).filter(c => this.getMaestroGuias().some(g => this.guiaMatchesCurso(g, c)));
    },
    getMaestroGuiaInfo(courseId = null) {
        const guias = this.getMaestroGuias();
        const cursosGuia = this.getCursosGuia();
        const activeId = courseId || this.data.activeCourseId;
        const curso = cursosGuia.find(c => c.id === activeId) || cursosGuia[0] || null;
        const g = curso ? this.getGuiaForCurso(curso.id) : (guias[0] || null);
        return {
            grado: g?.grado || curso?.grado || '',
            seccion: g?.seccion || curso?.seccion || '',
            jornada: g?.jornada || (curso ? this._cursoJornada(curso) : '') || '',
            centro: g?.centro || curso?.centroEducativo || '',
            curso,
            cursoId: curso?.id || null,
            guias,
            cursosGuia,
            hasGuia: guias.length > 0
        };
    },
    isMaestroGuia(courseId) {
        if (!courseId) return false;
        return !!this.getGuiaForCurso(courseId);
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
    isInactiveStudent(s) {
        if (!s) return false;
        const est = String(s.estadoMatricula || '').trim().toLowerCase();
        return est === 'traslado' || est === 'desertor' || est === 'inactivo';
    },
    isActiveStudent(s) {
        return !this.isInactiveStudent(s);
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
    getActivitiesByCourse(courseId) {
        if (!this.data || !Array.isArray(this.data.actividades)) return [];
        return this.data.actividades.filter(a => a.cursoId === courseId);
    },
    getActivitiesByCourseAndParcial(courseId, parcialId) {
        if (!this.data || !Array.isArray(this.data.actividades)) return [];
        return this.data.actividades.filter(a => a.cursoId === courseId && (!parcialId || parcialId === 'all' || a.parcialId === parcialId));
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
    },

    // ==========================================
    // MÓDULO PERSONALIDAD & CONDUCTA ESCOLAR
    // ==========================================
    getConductDefaultTypes() {
        return {
            positivas: [
                { id: 'pos_1', nombre: 'Entrega los trabajos cuando corresponde', icono: 'clipboard-check', categoria: 'positiva', puntos: 1, aspectos: ['puntualidad', 'espiritu_trabajo'] },
                { id: 'pos_2', nombre: 'Ha hecho los deberes', icono: 'badge-check', categoria: 'positiva', puntos: 1, aspectos: ['espiritu_trabajo', 'orden_presentacion'] },
                { id: 'pos_3', nombre: 'Ha mejorado su rendimiento', icono: 'trending-up', categoria: 'positiva', puntos: 1, aspectos: ['espiritu_trabajo'] },
                { id: 'pos_4', nombre: 'Ha mejorado su trabajo', icono: 'line-chart', categoria: 'positiva', puntos: 1, aspectos: ['espiritu_trabajo', 'orden_presentacion'] },
                { id: 'pos_5', nombre: 'Reconocimiento positivo', icono: 'star', categoria: 'positiva', puntos: 1, aspectos: ['espiritu_trabajo', 'moralidad'] },
                { id: 'pos_6', nombre: 'Se esfuerza y participa', icono: 'hand', categoria: 'positiva', puntos: 1, aspectos: ['espiritu_trabajo', 'sociabilidad'] },
                { id: 'pos_7', nombre: 'Trabaja en clase', icono: 'pencil', categoria: 'positiva', puntos: 1, aspectos: ['espiritu_trabajo', 'orden_presentacion'] },
                { id: 'pos_8', nombre: 'Ayuda a un compañero', icono: 'heart-handshake', categoria: 'positiva', puntos: 1, aspectos: ['sociabilidad', 'moralidad'] },
                { id: 'pos_9', nombre: 'Buen trabajo en equipo', icono: 'users', categoria: 'positiva', puntos: 1, aspectos: ['sociabilidad', 'espiritu_trabajo'] },
                { id: 'pos_10', nombre: 'Respeta el turno de palabra', icono: 'message-square', categoria: 'positiva', puntos: 1, aspectos: ['sociabilidad', 'moralidad', 'orden_presentacion'] },
                { id: 'pos_11', nombre: 'Actitud ejemplar', icono: 'medal', categoria: 'positiva', puntos: 1, aspectos: ['moralidad', 'sociabilidad', 'orden_presentacion'] },
                { id: 'pos_12', nombre: 'Llega puntual y preparado a la clase', icono: 'clock', categoria: 'positiva', puntos: 1, aspectos: ['puntualidad', 'orden_presentacion'] },
                { id: 'pos_13', nombre: 'Excelente orden, aseo y presentación personal', icono: 'sparkles', categoria: 'positiva', puntos: 1, aspectos: ['orden_presentacion'] }
            ],
            incidencias: [
                // LEVE (8 tipos) - Olvidos y conductas que no impiden la clase
                { id: 'inc_l1', nombre: 'No entrega los trabajos', icono: 'file-x', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['puntualidad', 'espiritu_trabajo'] },
                { id: 'inc_l2', nombre: 'No hace los deberes', icono: 'pencil-off', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['espiritu_trabajo', 'orden_presentacion'] },
                { id: 'inc_l3', nombre: 'No se presenta a un examen', icono: 'calendar-x', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['puntualidad', 'espiritu_trabajo'] },
                { id: 'inc_l4', nombre: 'No trabaja en clase', icono: 'moon', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['espiritu_trabajo'] },
                { id: 'inc_l5', nombre: 'No trae el material a clase', icono: 'package-x', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['orden_presentacion', 'espiritu_trabajo'] },
                { id: 'inc_l6', nombre: 'Come en clase', icono: 'cup-soda', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['orden_presentacion'] },
                { id: 'inc_l7', nombre: 'Llega tarde a clase sin justificación', icono: 'clock', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['puntualidad'] },
                { id: 'inc_l8', nombre: 'Descuido en el orden, cuaderno o presentación personal', icono: 'shirt', categoria: 'leve', nivel: 1, puntos: -1, aspectos: ['orden_presentacion'] },

                // GRAVE (15 tipos) - Interrumpe la clase o falta al respeto
                { id: 'inc_g1', nombre: 'Abandona la clase sin permiso', icono: 'door-open', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['puntualidad', 'moralidad'] },
                { id: 'inc_g2', nombre: 'Coge materiales que no son suyos', icono: 'hand', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['moralidad', 'sociabilidad'] },
                { id: 'inc_g3', nombre: 'Distrae a los compañeros', icono: 'megaphone', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['sociabilidad', 'espiritu_trabajo'] },
                { id: 'inc_g4', nombre: 'Falta el respeto a los compañeros', icono: 'frown', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['sociabilidad', 'moralidad'] },
                { id: 'inc_g5', nombre: 'Falta el respeto al profesor', icono: 'user-x', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['moralidad', 'sociabilidad'] },
                { id: 'inc_g6', nombre: 'Habla, molesta e interrumpe', icono: 'message-circle-x', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['sociabilidad', 'orden_presentacion'] },
                { id: 'inc_g7', nombre: 'Incita a no cumplir las normas', icono: 'users', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['sociabilidad', 'moralidad'] },
                { id: 'inc_g8', nombre: 'Maltrata el material del aula', icono: 'trash-2', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['orden_presentacion', 'moralidad'] },
                { id: 'inc_g9', nombre: 'Molesta durante un examen', icono: 'file-warning', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['moralidad', 'sociabilidad'] },
                { id: 'inc_g10', nombre: 'No comunica la información del centro a la familia, de forma intencionada', icono: 'mail-x', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['moralidad'] },
                { id: 'inc_g11', nombre: 'No cumple las normas del centro', icono: 'alert-triangle', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['moralidad', 'orden_presentacion'] },
                { id: 'inc_g12', nombre: 'Se niega a cumplir las medidas correctoras propuestas', icono: 'ban', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['moralidad', 'sociabilidad'] },
                { id: 'inc_g13', nombre: 'Utiliza el móvil y/o aparatos electrónicos cuando no corresponde', icono: 'smartphone', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['orden_presentacion', 'espiritu_trabajo'] },
                { id: 'inc_g14', nombre: 'Utiliza inadecuadamente las TIC', icono: 'monitor-x', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['orden_presentacion', 'moralidad'] },
                { id: 'inc_g15', nombre: 'Copia en un examen', icono: 'copy', categoria: 'grave', nivel: 2, puntos: -2, aspectos: ['moralidad'] },

                // MUY GRAVE (5 tipos) - Agresiones, daños o situaciones serias
                { id: 'inc_mg1', nombre: 'Altera y/o modifica las informaciones del centro', icono: 'alert-octagon', categoria: 'muy_grave', nivel: 3, puntos: -3, aspectos: ['moralidad'] },
                { id: 'inc_mg2', nombre: 'Daña el mobiliario y/o material del centro', icono: 'hammer', categoria: 'muy_grave', nivel: 3, puntos: -3, aspectos: ['orden_presentacion', 'moralidad'] },
                { id: 'inc_mg3', nombre: 'Introduce sustancias perjudiciales para la salud', icono: 'shield-alert', categoria: 'muy_grave', nivel: 3, puntos: -3, aspectos: ['moralidad'] },
                { id: 'inc_mg4', nombre: 'Suplanta la personalidad de un compañero', icono: 'user-check', categoria: 'muy_grave', nivel: 3, puntos: -3, aspectos: ['moralidad'] },
                { id: 'inc_mg5', nombre: 'Agresión o pelea', icono: 'shield-x', categoria: 'muy_grave', nivel: 3, puntos: -3, aspectos: ['sociabilidad', 'moralidad'] }
            ]
        };
    },

    getConductTypes() {
        const defaults = this.getConductDefaultTypes();
        if (!this.data.conducta_tipos || !Array.isArray(this.data.conducta_tipos.positivas) || !Array.isArray(this.data.conducta_tipos.incidencias)) {
            this.data.conducta_tipos = defaults;
            this.save();
            return this.data.conducta_tipos;
        }
        let changed = false;
        const defaultPosMap = new Map(defaults.positivas.map(p => [p.id, p]));
        const defaultIncMap = new Map(defaults.incidencias.map(i => [i.id, i]));

        this.data.conducta_tipos.positivas.forEach(p => {
            if (!Array.isArray(p.aspectos) || p.aspectos.length === 0) {
                const def = defaultPosMap.get(p.id);
                p.aspectos = def ? [...def.aspectos] : ['espiritu_trabajo'];
                changed = true;
            }
        });
        defaults.positivas.forEach(def => {
            if (!this.data.conducta_tipos.positivas.some(p => p.id === def.id)) {
                this.data.conducta_tipos.positivas.push({ ...def });
                changed = true;
            }
        });

        this.data.conducta_tipos.incidencias.forEach(i => {
            if (!Array.isArray(i.aspectos) || i.aspectos.length === 0) {
                const def = defaultIncMap.get(i.id);
                i.aspectos = def ? [...def.aspectos] : ['moralidad'];
                changed = true;
            }
        });
        defaults.incidencias.forEach(def => {
            if (!this.data.conducta_tipos.incidencias.some(i => i.id === def.id)) {
                this.data.conducta_tipos.incidencias.push({ ...def });
                changed = true;
            }
        });

        if (changed) this.save();
        return this.data.conducta_tipos;
    },

    getPersonalityOverride(courseId, partialId, studentId) {
        if (!this.data.personalidad_overrides) return null;
        return this.data.personalidad_overrides[`${courseId}_${partialId}_${studentId}`] || null;
    },

    savePersonalityOverride(courseId, partialId, studentId, overridesObj) {
        if (!this.data.personalidad_overrides) this.data.personalidad_overrides = {};
        const key = `${courseId}_${partialId}_${studentId}`;
        if (!overridesObj || Object.keys(overridesObj).length === 0) {
            delete this.data.personalidad_overrides[key];
        } else {
            this.data.personalidad_overrides[key] = {
                ...overridesObj,
                updatedAt: new Date().toISOString()
            };
        }
        this.save();
    },

    // ==========================================
    // MÓDULO CALIFICACIONES DE EMERGENCIA (I - IV PARCIAL)
    // ==========================================
    _resolveParcialMeta(courseId, partialRef, partialIndex) {
        let pId = '';
        let pNum = null;
        if (partialRef && typeof partialRef === 'object') {
            pId = String(partialRef.id || '');
            pNum = Number(partialRef.numero) || null;
        } else if (partialRef !== undefined && partialRef !== null) {
            pId = String(partialRef);
        }
        if (!pNum && typeof partialIndex === 'number' && partialIndex >= 0 && partialIndex < 4) {
            pNum = partialIndex + 1;
        }
        const courseParciales = (this.getParcialByCourse ? this.getParcialByCourse(courseId) : (this.data.parciales || []).filter(p => p.cursoId === courseId || p.courseId === courseId)) || [];
        if (pId && !pNum) {
            const found = courseParciales.find(p => String(p.id) === pId || String(p.numero) === pId || ('p' + p.numero) === pId);
            if (found && found.numero) pNum = Number(found.numero);
            else if (/^[1-4]$/.test(pId)) pNum = Number(pId);
            else if (/^p([1-4])$/i.test(pId)) pNum = Number(pId.replace(/\D/g, ''));
        }
        if (pNum && (!pId || /^[1-4]$/.test(pId) || /^p[1-4]$/i.test(pId))) {
            const foundByNum = courseParciales.find(p => Number(p.numero) === pNum);
            if (foundByNum && foundByNum.id) pId = String(foundByNum.id);
        }
        return { pId, pNum };
    },

    isEmergencyBypassed(courseId, partialRef, partialIndex) {
        if (!this.data || !this.data.notas_emergencia_bypass) return false;
        const { pId, pNum } = this._resolveParcialMeta(courseId, partialRef, partialIndex);
        if (pId && this.data.notas_emergencia_bypass[`${courseId}_${pId}`]) return true;
        if (pNum && this.data.notas_emergencia_bypass[`${courseId}_num${pNum}`]) return true;
        return false;
    },

    setEmergencyBypass(courseId, partialRef, bypass, partialIndex) {
        if (!this.data.notas_emergencia_bypass) this.data.notas_emergencia_bypass = {};
        const { pId, pNum } = this._resolveParcialMeta(courseId, partialRef, partialIndex);
        if (pId) {
            if (bypass) this.data.notas_emergencia_bypass[`${courseId}_${pId}`] = true;
            else delete this.data.notas_emergencia_bypass[`${courseId}_${pId}`];
        }
        if (pNum) {
            if (bypass) this.data.notas_emergencia_bypass[`${courseId}_num${pNum}`] = true;
            else delete this.data.notas_emergencia_bypass[`${courseId}_num${pNum}`];
        }
        this.save();
    },

    getEmergencyGrade(courseId, partialRef, studentId, partialIndex) {
        if (!this.data || !this.data.notas_emergencia || !courseId || !studentId) return null;
        if (partialRef === 'recuperacion' || (partialRef && partialRef.id === 'recuperacion')) return null;
        if (this.isEmergencyBypassed(courseId, partialRef, partialIndex)) return null;

        const { pId, pNum } = this._resolveParcialMeta(courseId, partialRef, partialIndex);
        let raw = undefined;
        if (pId && this.data.notas_emergencia[`${courseId}_${pId}_${studentId}`] !== undefined) {
            raw = this.data.notas_emergencia[`${courseId}_${pId}_${studentId}`];
        } else if (pNum && this.data.notas_emergencia[`${courseId}_num${pNum}_${studentId}`] !== undefined) {
            raw = this.data.notas_emergencia[`${courseId}_num${pNum}_${studentId}`];
        }
        if (raw === undefined || raw === null || raw === '') return null;
        const num = Number(raw);
        return isNaN(num) ? null : Math.max(0, Math.min(100, Math.round(num)));
    },

    getRawEmergencyGrade(courseId, partialRef, studentId, partialIndex) {
        if (!this.data || !this.data.notas_emergencia || !courseId || !studentId) return null;
        const { pId, pNum } = this._resolveParcialMeta(courseId, partialRef, partialIndex);
        let raw = undefined;
        if (pId && this.data.notas_emergencia[`${courseId}_${pId}_${studentId}`] !== undefined) {
            raw = this.data.notas_emergencia[`${courseId}_${pId}_${studentId}`];
        } else if (pNum && this.data.notas_emergencia[`${courseId}_num${pNum}_${studentId}`] !== undefined) {
            raw = this.data.notas_emergencia[`${courseId}_num${pNum}_${studentId}`];
        }
        if (raw === undefined || raw === null || raw === '') return null;
        const num = Number(raw);
        return isNaN(num) ? null : Math.max(0, Math.min(100, Math.round(num)));
    },

    saveEmergencyGrade(courseId, partialRef, studentId, gradeVal, partialIndex, skipSave = false) {
        if (!this.data.notas_emergencia) this.data.notas_emergencia = {};
        const { pId, pNum } = this._resolveParcialMeta(courseId, partialRef, partialIndex);
        const isEmpty = (gradeVal === '' || gradeVal === null || gradeVal === undefined || isNaN(Number(gradeVal)));
        if (isEmpty) {
            if (pId) delete this.data.notas_emergencia[`${courseId}_${pId}_${studentId}`];
            if (pNum) delete this.data.notas_emergencia[`${courseId}_num${pNum}_${studentId}`];
        } else {
            const cleanVal = Math.max(0, Math.min(100, Math.round(Number(gradeVal))));
            if (pId) this.data.notas_emergencia[`${courseId}_${pId}_${studentId}`] = cleanVal;
            if (pNum) this.data.notas_emergencia[`${courseId}_num${pNum}_${studentId}`] = cleanVal;
        }
        if (!skipSave) this.save();
    },

    countEmergencyGradesForParcial(courseId, partialRef, partialIndex) {
        if (!this.data || !this.data.notas_emergencia || !courseId) return 0;
        const students = (this.getStudentsByCourse ? this.getStudentsByCourse(courseId) : []).filter(s => s.estadoMatricula !== 'Traslado');
        let count = 0;
        students.forEach(s => {
            if (this.getRawEmergencyGrade(courseId, partialRef, s.id, partialIndex) !== null) count++;
        });
        return count;
    },

    resetConductTypes() {
        this.data.conducta_tipos = this.getConductDefaultTypes();
        this.save();
        return this.data.conducta_tipos;
    },

    saveConductType(typeObj) {
        const types = this.getConductTypes();
        const list = typeObj.categoria === 'positiva' ? types.positivas : types.incidencias;
        if (!typeObj.id) {
            typeObj.id = (typeObj.categoria === 'positiva' ? 'pos_c_' : 'inc_c_') + Date.now();
            list.push(typeObj);
        } else {
            const idx = list.findIndex(t => t.id === typeObj.id);
            if (idx >= 0) {
                list[idx] = { ...list[idx], ...typeObj };
            } else {
                list.push(typeObj);
            }
        }
        this.save();
        return typeObj;
    },

    deleteConductType(typeId, categoria) {
        const types = this.getConductTypes();
        if (categoria === 'positiva') {
            types.positivas = types.positivas.filter(t => t.id !== typeId);
        } else {
            types.incidencias = types.incidencias.filter(t => t.id !== typeId);
        }
        this.save();
    },

    getConductRecords(courseId, studentId, date) {
        let list = this.data.conducta_records || [];
        if (courseId) list = list.filter(r => r.cursoId === courseId);
        if (studentId) list = list.filter(r => r.estudianteId === studentId);
        if (date) list = list.filter(r => r.fecha === date);
        return list;
    },

    saveConductRecord(record) {
        if (!this.data.conducta_records) this.data.conducta_records = [];
        if (!record.id) {
            record.id = 'cond_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        }
        if (!record.createdAt) {
            record.createdAt = new Date().toISOString();
        }
        this.data.conducta_records.push(record);
        this.save();
        return record;
    },

    deleteConductRecord(id) {
        if (!this.data.conducta_records) return;
        this.data.conducta_records = this.data.conducta_records.filter(r => r.id !== id);
        this.save();
    },

    getConductSummary(courseId, studentId, date) {
        const records = this.getConductRecords(courseId, studentId, date);
        const pos = records.filter(r => r.tipo === 'positiva').length;
        const inc = records.filter(r => r.tipo !== 'positiva').length;
        return {
            total: records.length,
            positivasCount: pos,
            incidenciasCount: inc,
            records: records
        };
    }
};

