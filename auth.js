/**
 * AuthService — Módulo de Registro, Autenticación, Verificación y Licencias (Aula 360 HN)
 * Diseñado mobile-first para Web + APK Android.
 * Soporta Firebase Auth + Cloud Firestore (Plan Spark $0) y Modo Local/Demo mientras se configura Firebase.
 */
(function (global) {
    'use strict';

    const STORAGE_KEY_SESSION = 'aula360_auth_session_v1';
    const STORAGE_KEY_USERS_LOCAL = 'aula360_local_accounts_v1';

    const AuthService = {
        CONFIG: {
            appName: 'Aula 360 HN',
            supportEmail: 'aula360.hn@gmail.com',
            supportWhatsapp: '50433398700',
            socialLinks: {
                facebook: 'https://www.facebook.com/profile.php?id=61596617130853',
                tiktok: 'https://www.tiktok.com/@aula360.hn',
                instagram: '',
                youtube: ''
            },
            trialDays: 14,
            maxTrialCourses: 2,
            maxTrialCenters: 1,
            // Pega aquí tu configuración de Firebase Web App (Plan Spark $0) para activar Auth + Firestore en la nube:
            firebaseConfig: {
                apiKey: 'AIzaSyC2Luwj5sAdqCI8mwqyXY7pJ7gkwaYy-Hw',
                authDomain: 'aula-360-hn-fa572.firebaseapp.com',
                projectId: 'aula-360-hn-fa572',
                storageBucket: 'aula-360-hn-fa572.firebasestorage.app',
                messagingSenderId: '146827021171',
                appId: '1:146827021171:web:58e1f8793a63552be41306',
                measurementId: 'G-W4JR42EKRH'
            },
            // URL de Google Apps Script (/exec) vinculada a aula360.hn@gmail.com para recibir avisos y guardar registros en Sheets
            leadWebhookUrl: 'https://script.google.com/macros/s/AKfycbw7Iq6NwAUysWDthGTn1H1HXkDaAwwfAJGt1KSqJzDMrCIpRPvy7Y8Tum6kxJtrwA/exec',
            // Si es true, toda instalación nueva (sin sesión ni cursos previos) arranca automáticamente en Registro
            requireAuthOnFreshInstall: true,
            // Planes mostrados en el módulo visible "Hazte Pro" (puedes ajustar precios y etiquetas aquí)
            plans: [
                { id: 'mensual', name: 'Mensual', price: 'L 120', period: '/ mes', badge: '', note: 'Flexible mes a mes' },
                { id: 'trimestral', name: 'Trimestral', price: 'L 300', period: '/ 3 meses', badge: 'Ahorra 17%', note: 'Ideal para un parcial o trimestre' },
                { id: 'anual', name: 'Anual', price: 'L 990', period: '/ año', badge: 'Más popular', note: 'Equivale a L 82.50 al mes' },
                { id: 'vitalicio', name: 'Para siempre', price: 'L 1,990', period: 'pago único', badge: 'Mejor valor', note: 'Acceso permanente sin renovaciones' }
            ]
        },

        _state: {
            mode: 'register', // 'register' | 'login' | 'verify' | 'reset'
            user: null,
            firebaseReady: false,
            locked: false,
            selectedPlanId: 'anual'
        },

        isFirebaseConfigured() {
            const fc = this.CONFIG.firebaseConfig || {};
            return Boolean(fc.apiKey && fc.projectId && fc.authDomain);
        },

        init() {
            this._loadSession();
            // Detectar regreso desde enlace de verificación en URL (?verified=1 o mode=verifyEmail)
            try {
                const params = new URLSearchParams(global.location.search || '');
                if (params.get('verified') === '1' || params.get('mode') === 'verifyEmail') {
                    if (this._state.user) {
                        this._state.user.emailVerified = true;
                        this._saveSession(this._state.user);
                        if (!this._state.user.onboardingCompleted && global.Views && Views.Onboarding) {
                            setTimeout(() => Views.Onboarding.start(1), 400);
                        }
                    }
                }
            } catch (_) {}

            if (this.isFirebaseConfigured()) {
                this._initFirebaseSDK();
            }

            // Esperar a que termine el splash inicial y Store/UI estén listos
            setTimeout(() => this.checkStartupGate(), 1650);
        },

        _isDemoMode() {
            try {
                const params = new URLSearchParams(global.location ? global.location.search : '');
                return params.get('demo') === '1' || params.get('demo') === 'true';
            } catch (_) {
                return false;
            }
        },

        _seedDemoDataIfEmpty() {
            if (!global.Store || !Store.data) return;
            if (Array.isArray(Store.data.cursos) && Store.data.cursos.length > 0) return;

            const c1Id = 'demo_esp_8_1';
            const c2Id = 'demo_ing_8_1';
            const centro = 'CEBG José Cecilio del Valle';
            const anio = 2026;

            Store.data.configAcademica = Store.data.configAcademica || {};
            Store.data.configAcademica.anioLectivo = anio;
            Store.data.configAcademica.nombreCentro = centro;
            Store.data.configAcademica.docente = 'Lic. Docente Demo';
            Store.data.configAcademica.director = 'Lic. Dirección Académica';
            Store.data.configAcademica.dimensions = [
                { key: 'extraAula', nombre: 'Actividades Extra-Aula', porcentaje: 10, max: 5 },
                { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 25, max: 5 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10, max: 5 },
                { key: 'expresiones', nombre: 'Expresiones Artísticas', porcentaje: 5, max: 5 },
                { key: 'examenes', nombre: 'Examen Escrito o Práctico', porcentaje: 50, max: 5 }
            ];

            Store.data.centrosEducativos = [
                { id: 'demo_centro_1', nombre: centro, departamento: 'Cortés', municipio: 'Omoa', codigoSace: '050600123B01' }
            ];

            Store.data.cursos = [
                {
                    id: c1Id, asignatura: 'Español', grado: '8vo', seccion: '1',
                    centroEducativo: centro, centroId: 'demo_centro_1', jornadaP: 'vespertina',
                    anio: anio, estado: 'ACTIVO', color: 'emerald'
                },
                {
                    id: c2Id, asignatura: 'Inglés', grado: '8vo', seccion: '1',
                    centroEducativo: centro, centroId: 'demo_centro_1', jornadaP: 'vespertina',
                    anio: anio, estado: 'ACTIVO', color: 'blue'
                }
            ];
            Store.data.activeCourseId = c1Id;

            Store.data.parciales = [
                { id: 'demo_p1', cursoId: c1Id, numero: 1, nombre: 'I Parcial', fechaInicio: '2026-02-02', fechaFin: '2026-04-17' },
                { id: 'demo_p2', cursoId: c1Id, numero: 2, nombre: 'II Parcial', fechaInicio: '2026-04-20', fechaFin: '2026-06-26' },
                { id: 'demo_p3', cursoId: c1Id, numero: 3, nombre: 'III Parcial', fechaInicio: '2026-06-29', fechaFin: '2026-09-04' },
                { id: 'demo_p4', cursoId: c1Id, numero: 4, nombre: 'IV Parcial', fechaInicio: '2026-09-07', fechaFin: '2026-11-13' },
                { id: 'demo_p1_ing', cursoId: c2Id, numero: 1, nombre: 'I Parcial', fechaInicio: '2026-02-02', fechaFin: '2026-04-17' },
                { id: 'demo_p2_ing', cursoId: c2Id, numero: 2, nombre: 'II Parcial', fechaInicio: '2026-04-20', fechaFin: '2026-06-26' },
                { id: 'demo_p3_ing', cursoId: c2Id, numero: 3, nombre: 'III Parcial', fechaInicio: '2026-06-29', fechaFin: '2026-09-04' },
                { id: 'demo_p4_ing', cursoId: c2Id, numero: 4, nombre: 'IV Parcial', fechaInicio: '2026-09-07', fechaFin: '2026-11-13' }
            ];

            const demoStudents = [
                { id: 'demo_s1', nombreCompleto: 'Sofía Valentina Castro Mejía', genero: 'F', fechaNacimiento: '2012-03-14', identidad: '0506-2012-00112' },
                { id: 'demo_s2', nombreCompleto: 'Carlos Eduardo Hernández Paz', genero: 'M', fechaNacimiento: '2012-07-22', identidad: '0506-2012-00234' },
                { id: 'demo_s3', nombreCompleto: 'Valeria Nicolle Zelaya Ramos', genero: 'F', fechaNacimiento: '2013-01-19', identidad: '0506-2013-00345' },
                { id: 'demo_s4', nombreCompleto: 'Mateo Alejandro Flores Reyes', genero: 'M', fechaNacimiento: '2012-11-05', identidad: '0506-2012-00456' },
                { id: 'demo_s5', nombreCompleto: 'María Victoria Alas Zamora', genero: 'F', fechaNacimiento: '2012-05-30', identidad: '0506-2012-00567' },
                { id: 'demo_s6', nombreCompleto: 'Julio César Madrid Herrera', genero: 'M', fechaNacimiento: '2011-09-12', identidad: '0506-2011-00678' }
            ];
            Store.data.estudiantes = demoStudents.map(s => ({ ...s, cursoId: c1Id, estadoMatricula: 'Activo' }));
            Store.data.matriculas = [];
            demoStudents.forEach(s => {
                Store.data.matriculas.push({ id: 'mat_1_' + s.id, estudianteId: s.id, cursoId: c1Id, estadoMatricula: 'Activo' });
                Store.data.matriculas.push({ id: 'mat_2_' + s.id, estudianteId: s.id, cursoId: c2Id, estadoMatricula: 'Activo' });
            });

            const acts = [];
            const califs = [];
            const pIds = ['demo_p1', 'demo_p2', 'demo_p3', 'demo_p4'];
            const dimDefs = [
                { key: 'extraAula', nombre: 'Tarea en Casa', max: 10 },
                { key: 'aula', nombre: 'Trabajo en Clase', max: 25 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', max: 10 },
                { key: 'expresiones', nombre: 'Expresión Artística', max: 5 },
                { key: 'examenes', nombre: 'Examen Escrito', max: 50 }
            ];
            const scoreProfiles = {
                demo_s1: [0.95, 0.92, 0.96, 0.94],
                demo_s2: [0.85, 0.88, 0.82, 0.86],
                demo_s3: [0.76, 0.78, 0.74, 0.80],
                demo_s4: [0.72, 0.75, 0.70, 0.74],
                demo_s5: [0.68, 0.65, 0.62, 0.69], // En recuperación
                demo_s6: [0.58, 0.60, 0.55, 0.62]  // En recuperación
            };

            pIds.forEach((pId, pIdx) => {
                dimDefs.forEach(d => {
                    const actId = `demo_act_${pId}_${d.key}`;
                    acts.push({ id: actId, cursoId: c1Id, parcialId: pId, dimensionKey: d.key, nombre: d.nombre, puntajeMax: d.max, fecha: '2026-10-15' });
                    demoStudents.forEach(s => {
                        const factor = scoreProfiles[s.id][pIdx];
                        const pts = Math.round(d.max * factor);
                        califs.push({ id: `cal_${actId}_${s.id}`, actividadId: actId, estudianteId: s.id, cursoId: c1Id, puntajeObtenido: pts });
                    });
                });
            });

            // Actividades de recuperación para demo_s5 (aprobada con 70%) y demo_s6
            acts.push({ id: 'demo_rec_guia', cursoId: c1Id, parcialId: 'recuperacion', dimensionKey: 'aula', nombre: 'Guía de Reforzamiento', puntajeMax: 40, fecha: '2026-11-15' });
            acts.push({ id: 'demo_rec_exam', cursoId: c1Id, parcialId: 'recuperacion', dimensionKey: 'examenes', nombre: 'Examen de Recuperación', puntajeMax: 60, fecha: '2026-11-15' });
            califs.push({ id: 'cal_rec_1', actividadId: 'demo_rec_guia', estudianteId: 'demo_s5', cursoId: c1Id, puntajeObtenido: 40 });
            califs.push({ id: 'cal_rec_2', actividadId: 'demo_rec_exam', estudianteId: 'demo_s5', cursoId: c1Id, puntajeObtenido: 60 });

            Store.data.actividades = acts;
            Store.data.calificaciones = califs;

            const today = new Date().toISOString().split('T')[0];
            Store.data.asistencia = demoStudents.map((s, idx) => ({
                id: 'demo_asis_' + s.id,
                cursoId: c1Id,
                estudianteId: s.id,
                fecha: today,
                estado: idx === 5 ? 'T' : 'P'
            }));

            if (typeof Store.save === 'function') Store.save();
            try { localStorage.setItem('aula360_onboarding_completed', 'true'); } catch (_) {}
            if (global.UI && typeof UI.updateHeader === 'function') UI.updateHeader();
            if (global.UI && typeof UI.renderSidebar === 'function') UI.renderSidebar();
            if (global.Router && typeof Router.navigate === 'function') {
                Router.navigate(Router.current || 'panel');
            }
        },

        checkStartupGate() {
            if (this._isDemoMode()) {
                this._seedDemoDataIfEmpty();
                return;
            }
            if (!this.CONFIG.requireAuthOnFreshInstall) return;
            const u = this.getCurrentUser();
            const hasCourses = Boolean(global.Store && Store.data && Array.isArray(Store.data.cursos) && Store.data.cursos.length > 0);
            const onboardingDone = localStorage.getItem('aula360_onboarding_completed') === 'true';

            if (!u) {
                if (!hasCourses && !onboardingDone) {
                    this.openAuthModal('register', { locked: true });
                }
                return;
            }
            if (!u.emailVerified) {
                this.openAuthModal('verify', { locked: true });
                return;
            }
            if (!u.onboardingCompleted && !hasCourses && !onboardingDone && global.Views && Views.Onboarding) {
                Views.Onboarding.start(1);
            }
        },

        _initFirebaseSDK() {
            // Carga perezosa de Firebase Compat SDK si hay credenciales configuradas
            if (global.firebase && global.firebase.apps && global.firebase.apps.length > 0) {
                this._state.firebaseReady = true;
                this._bindFirebaseAuthListener();
                return;
            }
            const loadScript = (src) => new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = src;
                s.async = true;
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
            loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js')
                .then(() => loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js'))
                .then(() => loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'))
                .then(() => {
                    if (!global.firebase.apps.length) {
                        global.firebase.initializeApp(this.CONFIG.firebaseConfig);
                    }
                    this._state.firebaseReady = true;
                    this._bindFirebaseAuthListener();
                })
                .catch(() => {
                    // Sin conexión: continúa con la sesión en caché local (tolerancia offline)
                    this._state.firebaseReady = false;
                });
        },

        _bindFirebaseAuthListener() {
            if (!global.firebase || !global.firebase.auth) return;
            global.firebase.auth().onAuthStateChanged(async (fbUser) => {
                if (!fbUser) return;
                const existing = this._state.user || {};
                const synced = {
                    uid: fbUser.uid,
                    name: fbUser.displayName || existing.name || 'Docente',
                    email: fbUser.email || existing.email || '',
                    emailVerified: Boolean(fbUser.emailVerified),
                    provider: (fbUser.providerData && fbUser.providerData[0] && fbUser.providerData[0].providerId) || 'password',
                    plan: existing.plan || 'trial',
                    trialStartedAt: existing.trialStartedAt || new Date().toISOString(),
                    trialEndsAt: existing.trialEndsAt || this._addDaysIso(this.CONFIG.trialDays),
                    onboardingCompleted: Boolean(existing.onboardingCompleted || localStorage.getItem('aula360_onboarding_completed') === 'true'),
                    lastValidatedAt: new Date().toISOString()
                };
                // Intentar sincronizar licencia desde Firestore si existe
                if (global.firebase.firestore) {
                    try {
                        const docRef = global.firebase.firestore().collection('teachers').doc(fbUser.uid);
                        const snap = await docRef.get();
                        if (snap.exists) {
                            const data = snap.data() || {};
                            synced.plan = data.plan || synced.plan;
                            synced.trialStartedAt = data.trialStartedAt || synced.trialStartedAt;
                            synced.trialEndsAt = data.trialEndsAt || synced.trialEndsAt;
                            synced.proExpiresAt = data.proExpiresAt || null;
                            synced.onboardingCompleted = Boolean(data.onboardingCompleted || synced.onboardingCompleted);
                            if (data.name) synced.name = data.name;
                        } else {
                            await docRef.set(synced, { merge: true });
                        }
                    } catch (_) {}
                }
                this._saveSession(synced);
            });
        },

        _addDaysIso(days) {
            const d = new Date();
            d.setDate(d.getDate() + Number(days || 14));
            return d.toISOString();
        },

        _loadSession() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY_SESSION);
                if (raw) {
                    this._state.user = JSON.parse(raw);
                }
            } catch (_) {
                this._state.user = null;
            }
        },

        _saveSession(user) {
            this._state.user = user;
            try {
                if (user) {
                    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
                } else {
                    localStorage.removeItem(STORAGE_KEY_SESSION);
                }
            } catch (_) {}
        },

        getCurrentUser() {
            if (!this._state.user) this._loadSession();
            return this._state.user;
        },

        getLicenseStatus() {
            const u = this.getCurrentUser();
            if (!u) {
                return {
                    authenticated: false,
                    plan: 'guest',
                    isPro: false,
                    isTrialActive: true,
                    daysLeft: this.CONFIG.trialDays,
                    canExportClean: false,
                    maxCourses: this.CONFIG.maxTrialCourses,
                    maxCenters: this.CONFIG.maxTrialCenters,
                    label: 'Sin cuenta vinculada'
                };
            }
            const now = Date.now();
            if (u.plan === 'pro') {
                const expMs = u.proExpiresAt ? new Date(u.proExpiresAt).getTime() : null;
                const active = !expMs || expMs > now;
                if (active) {
                    return {
                        authenticated: true,
                        plan: 'pro',
                        isPro: true,
                        isTrialActive: false,
                        daysLeft: expMs ? Math.max(0, Math.ceil((expMs - now) / 86400000)) : 365,
                        canExportClean: true,
                        maxCourses: 999,
                        maxCenters: 999,
                        label: 'Plan Pro Activo'
                    };
                }
            }
            const trialEndMs = u.trialEndsAt ? new Date(u.trialEndsAt).getTime() : (now + this.CONFIG.trialDays * 86400000);
            const diffDays = Math.ceil((trialEndMs - now) / 86400000);
            const isTrialActive = diffDays > 0;
            return {
                authenticated: true,
                plan: isTrialActive ? 'trial' : 'expired',
                isPro: false,
                isTrialActive,
                daysLeft: Math.max(0, diffDays),
                canExportClean: false,
                maxCourses: isTrialActive ? this.CONFIG.maxTrialCourses : 1,
                maxCenters: this.CONFIG.maxTrialCenters,
                label: isTrialActive ? `Prueba Gratis (${diffDays} días)` : 'Prueba Finalizada (Modo Lectura)'
            };
        },

        validatePassword(pwd) {
            const p = String(pwd || '');
            return {
                minLen: p.length >= 8,
                hasUpper: /[A-ZÁÉÍÓÚÑ]/.test(p),
                hasLower: /[a-záéíóúñ]/.test(p),
                hasNumber: /\d/.test(p),
                get valid() {
                    return this.minLen && this.hasUpper && this.hasLower && this.hasNumber;
                }
            };
        },

        _getEmailActionSettings() {
            const proto = (global.location && global.location.protocol) || '';
            if (proto === 'http:' || proto === 'https:') {
                return {
                    url: `${global.location.origin}${global.location.pathname}?verified=1`,
                    handleCodeInApp: false
                };
            }
            return undefined;
        },

        async registerWithEmail({ firstName, lastName, email, password, acceptedTerms }) {
            const fullName = `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();
            const cleanEmail = (email || '').trim().toLowerCase();
            if (!fullName) return { ok: false, error: 'Ingresa tu nombre y apellido.' };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: 'Ingresa un correo electrónico válido.' };
            const pwdCheck = this.validatePassword(password);
            if (!pwdCheck.valid) return { ok: false, error: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.' };
            if (!acceptedTerms) return { ok: false, error: 'Debes aceptar los términos y condiciones.' };

            if (this._state.firebaseReady && global.firebase && global.firebase.auth) {
                try {
                    const cred = await global.firebase.auth().createUserWithEmailAndPassword(cleanEmail, password);
                    if (cred.user) {
                        await cred.user.updateProfile({ displayName: fullName });
                        const actionSettings = this._getEmailActionSettings();
                        await cred.user.sendEmailVerification(actionSettings);
                        const userObj = {
                            uid: cred.user.uid,
                            name: fullName,
                            email: cleanEmail,
                            emailVerified: false,
                            provider: 'password',
                            plan: 'trial',
                            trialStartedAt: new Date().toISOString(),
                            trialEndsAt: this._addDaysIso(this.CONFIG.trialDays),
                            onboardingCompleted: false
                        };
                        this._saveSession(userObj);
                        this._notifyLeadRegistration(userObj);
                        return { ok: true, needsVerification: true, user: userObj };
                    }
                } catch (err) {
                    return { ok: false, error: this._mapFirebaseError(err) };
                }
            }

            // Modo Local / Pre-configuración Firebase
            const accounts = this._getLocalAccounts();
            if (accounts.some(a => a.email === cleanEmail)) {
                return { ok: false, error: 'Este correo ya está registrado. Inicia sesión.' };
            }
            const userObj = {
                uid: 'local_' + Date.now(),
                name: fullName,
                email: cleanEmail,
                passwordHash: this._simpleHash(password),
                emailVerified: false,
                provider: 'password',
                plan: 'trial',
                trialStartedAt: new Date().toISOString(),
                trialEndsAt: this._addDaysIso(this.CONFIG.trialDays),
                onboardingCompleted: false
            };
            accounts.push(userObj);
            this._saveLocalAccounts(accounts);
            this._saveSession(userObj);
            this._notifyLeadRegistration(userObj);
            return { ok: true, needsVerification: true, user: userObj, localMode: true };
        },

        async loginWithEmail({ email, password }) {
            const cleanEmail = (email || '').trim().toLowerCase();
            if (!cleanEmail || !password) return { ok: false, error: 'Completa correo y contraseña.' };

            if (this._state.firebaseReady && global.firebase && global.firebase.auth) {
                try {
                    const cred = await global.firebase.auth().signInWithEmailAndPassword(cleanEmail, password);
                    const fbUser = cred.user;
                    const userObj = {
                        uid: fbUser.uid,
                        name: fbUser.displayName || 'Docente',
                        email: fbUser.email,
                        emailVerified: Boolean(fbUser.emailVerified),
                        provider: 'password',
                        plan: 'trial',
                        trialStartedAt: new Date().toISOString(),
                        trialEndsAt: this._addDaysIso(this.CONFIG.trialDays),
                        onboardingCompleted: localStorage.getItem('aula360_onboarding_completed') === 'true'
                    };
                    this._saveSession(userObj);
                    return { ok: true, needsVerification: !fbUser.emailVerified, user: userObj };
                } catch (err) {
                    return { ok: false, error: this._mapFirebaseError(err) };
                }
            }

            const accounts = this._getLocalAccounts();
            const found = accounts.find(a => a.email === cleanEmail && a.passwordHash === this._simpleHash(password));
            if (!found) {
                return { ok: false, error: 'Correo o contraseña incorrectos.' };
            }
            this._saveSession(found);
            return { ok: true, needsVerification: !found.emailVerified, user: found, localMode: true };
        },

        async loginWithGoogle() {
            if (global.location && global.location.protocol === 'file:') {
                return {
                    ok: false,
                    error: 'El inicio con Google requiere abrir la app en servidor web (http://localhost o dominio web), no como archivo local file://. Aquí puedes probar el registro con Correo y Contraseña.'
                };
            }
            if (this._state.firebaseReady && global.firebase && global.firebase.auth) {
                try {
                    const provider = new global.firebase.auth.GoogleAuthProvider();
                    const cred = await global.firebase.auth().signInWithPopup(provider);
                    const fbUser = cred.user;
                    const userObj = {
                        uid: fbUser.uid,
                        name: fbUser.displayName || 'Docente',
                        email: fbUser.email,
                        emailVerified: true,
                        provider: 'google.com',
                        plan: 'trial',
                        trialStartedAt: new Date().toISOString(),
                        trialEndsAt: this._addDaysIso(this.CONFIG.trialDays),
                        onboardingCompleted: localStorage.getItem('aula360_onboarding_completed') === 'true'
                    };
                    this._saveSession(userObj);
                    this._notifyLeadRegistration(userObj);
                    return { ok: true, needsVerification: false, user: userObj };
                } catch (err) {
                    return { ok: false, error: this._mapFirebaseError(err) };
                }
            }
            return {
                ok: false,
                error: 'Para activar "Continuar con Google" en producción, pega tus credenciales de Firebase Plan Spark ($0) en auth.js. Por ahora puedes probar creando cuenta con correo.'
            };
        },

        async confirmVerificationAndContinue() {
            const u = this.getCurrentUser();
            if (!u) return { ok: false, error: 'No hay sesión activa.' };

            if (this._state.firebaseReady && global.firebase && global.firebase.auth && global.firebase.auth().currentUser) {
                try {
                    await global.firebase.auth().currentUser.reload();
                    const verified = global.firebase.auth().currentUser.emailVerified;
                    if (!verified) {
                        return { ok: false, error: 'Tu correo aún aparece sin confirmar. Abre el enlace que enviamos a ' + u.email + ' y vuelve a tocar este botón.' };
                    }
                    u.emailVerified = true;
                    this._saveSession(u);
                } catch (err) {
                    return { ok: false, error: this._mapFirebaseError(err) };
                }
            } else {
                // Modo local de prueba: marca como verificado para probar el flujo hacia Onboarding
                u.emailVerified = true;
                const accounts = this._getLocalAccounts().map(a => a.email === u.email ? { ...a, emailVerified: true } : a);
                this._saveLocalAccounts(accounts);
                this._saveSession(u);
            }

            this._state.locked = false;
            if (global.UI && UI.closeModal) UI.closeModal();
            if (!u.onboardingCompleted && global.Views && Views.Onboarding) {
                Views.Onboarding.start(1);
            } else if (global.Router) {
                Router.navigate('panel');
            }
            return { ok: true, user: u };
        },

        async resendVerificationEmail() {
            if (this._state.firebaseReady && global.firebase && global.firebase.auth && global.firebase.auth().currentUser) {
                try {
                    await global.firebase.auth().currentUser.sendEmailVerification(this._getEmailActionSettings());
                    return { ok: true };
                } catch (err) {
                    return { ok: false, error: this._mapFirebaseError(err) };
                }
            }
            return { ok: true, localMode: true };
        },

        async completeOnboarding(onboardingData) {
            const u = this.getCurrentUser();
            if (!u) return;
            u.onboardingCompleted = true;
            u.name = (onboardingData && onboardingData.docente && onboardingData.docente.nombre) || u.name;
            u.centroSace = (onboardingData && onboardingData.centro && onboardingData.centro.codigoCentro) || '';
            u.centroNombre = (onboardingData && onboardingData.centro && onboardingData.centro.nombre) || '';
            u.tipoDocente = (onboardingData && onboardingData.tipoDocente) || 'especialidad';
            this._saveSession(u);

            if (this._state.firebaseReady && global.firebase && global.firebase.firestore) {
                try {
                    await global.firebase.firestore().collection('teachers').doc(u.uid).set({
                        ...u,
                        onboardingCompleted: true,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                } catch (_) {}
            }
            this._notifyLeadRegistration({ ...u, event: 'onboarding_completed' });
        },

        logout() {
            if (this._state.firebaseReady && global.firebase && global.firebase.auth) {
                try { global.firebase.auth().signOut(); } catch (_) {}
            }
            this._saveSession(null);
            if (global.UI && UI.toast) UI.toast('Sesión cerrada', 'info');
            this.openAuthModal('login');
        },

        _notifyLeadRegistration(payload) {
            const url = (this.CONFIG.leadWebhookUrl || '').trim();
            if (!url) return;
            try {
                fetch(url, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        supportEmail: this.CONFIG.supportEmail,
                        timestamp: new Date().toISOString(),
                        uid: payload.uid,
                        name: payload.name,
                        email: payload.email,
                        provider: payload.provider,
                        plan: payload.plan,
                        centroSace: payload.centroSace || '',
                        centroNombre: payload.centroNombre || '',
                        tipoDocente: payload.tipoDocente || '',
                        event: payload.event || 'user_registered'
                    })
                }).catch(() => {});
            } catch (_) {}
        },

        _getLocalAccounts() {
            try { return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS_LOCAL) || '[]'); } catch (_) { return []; }
        },

        _saveLocalAccounts(arr) {
            try { localStorage.setItem(STORAGE_KEY_USERS_LOCAL, JSON.stringify(arr || [])); } catch (_) {}
        },

        _simpleHash(str) {
            if (global.CryptoJS && global.CryptoJS.SHA256) {
                return global.CryptoJS.SHA256(String(str)).toString();
            }
            let h = 0;
            for (let i = 0; i < str.length; i++) {
                h = ((h << 5) - h) + str.charCodeAt(i);
                h |= 0;
            }
            return 'h_' + h;
        },

        _mapFirebaseError(err) {
            const code = (err && err.code) || '';
            const map = {
                'auth/email-already-in-use': 'Este correo ya está registrado. Prueba iniciar sesión.',
                'auth/invalid-email': 'El correo electrónico no es válido.',
                'auth/weak-password': 'La contraseña es muy débil (usa mínimo 8 caracteres).',
                'auth/user-not-found': 'No existe una cuenta con ese correo.',
                'auth/wrong-password': 'Contraseña incorrecta.',
                'auth/invalid-credential': 'Correo o contraseña incorrectos.',
                'auth/network-request-failed': 'Sin conexión a internet. Verifica tu red.',
                'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.'
            };
            return map[code] || (err && err.message) || 'Error de autenticación.';
        },

        // --- INTERFAZ MOBILE-FIRST DE REGISTRO / LOGIN / VERIFICACIÓN ---
        openAuthModal(mode = 'register', opts = null) {
            this._state.mode = mode;
            if (opts && typeof opts.locked === 'boolean') {
                this._state.locked = opts.locked;
            } else if (opts === null && !this._state.locked) {
                this._state.locked = false;
            }
            const user = this.getCurrentUser();
            if (user && !user.emailVerified && mode !== 'login' && mode !== 'register') {
                this._state.mode = 'verify';
            }
            this._renderAuthModal();
        },

        _setFeedback(msg, isError = true) {
            const box = document.getElementById('a360-auth-feedback');
            if (!box) return;
            if (!msg) {
                box.style.display = 'none';
                box.textContent = '';
                return;
            }
            box.style.display = 'block';
            box.style.background = isError ? '#fef2f2' : '#ecfdf5';
            box.style.color = isError ? '#b91c1c' : '#047857';
            box.style.borderColor = isError ? '#fecaca' : '#a7f3d0';
            box.textContent = msg;
        },

        _updatePasswordChecklist(val) {
            const c = this.validatePassword(val);
            const setItem = (id, ok) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.style.color = ok ? '#047857' : '#64748b';
                el.style.fontWeight = ok ? '800' : '600';
                const dot = el.querySelector('.a360-pwd-dot');
                if (dot) dot.textContent = ok ? '✓' : '•';
            };
            setItem('pwd-req-len', c.minLen);
            setItem('pwd-req-upper', c.hasUpper);
            setItem('pwd-req-lower', c.hasLower);
            setItem('pwd-req-num', c.hasNumber);
        },

        async changeUnverifiedEmail() {
            const u = this.getCurrentUser();
            if (u && !u.emailVerified && this._state.firebaseReady && global.firebase && global.firebase.auth) {
                const fbUser = global.firebase.auth().currentUser;
                if (fbUser && !fbUser.emailVerified) {
                    try { await fbUser.delete(); } catch (_) {
                        try { await global.firebase.auth().signOut(); } catch (__) {}
                    }
                }
            }
            this._saveSession(null);
            this.openAuthModal('register');
        },

        async handleRegisterSubmit(e) {
            if (e) e.preventDefault();
            const firstName = document.getElementById('auth-first-name')?.value || '';
            const lastName = document.getElementById('auth-last-name')?.value || '';
            const email = document.getElementById('auth-reg-email')?.value || '';
            const emailConfirm = document.getElementById('auth-reg-email-confirm')?.value || '';
            const password = document.getElementById('auth-reg-pwd')?.value || '';
            const acceptedTerms = Boolean(document.getElementById('auth-terms')?.checked);

            this._setFeedback('');
            if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
                this._setFeedback('Los correos electrónicos no coinciden. Verifica cómo lo escribiste.', true);
                return;
            }
            const res = await this.registerWithEmail({ firstName, lastName, email, password, acceptedTerms });
            if (!res.ok) {
                this._setFeedback(res.error, true);
                return;
            }
            this._state.mode = 'verify';
            this._renderAuthModal();
        },

        async handleLoginSubmit(e) {
            if (e) e.preventDefault();
            const email = document.getElementById('auth-login-email')?.value || '';
            const password = document.getElementById('auth-login-pwd')?.value || '';
            this._setFeedback('');
            const res = await this.loginWithEmail({ email, password });
            if (!res.ok) {
                this._setFeedback(res.error, true);
                return;
            }
            if (res.needsVerification) {
                this._state.mode = 'verify';
                this._renderAuthModal();
                return;
            }
            this._state.locked = false;
            if (global.UI && UI.closeModal) UI.closeModal();
            if (!res.user.onboardingCompleted && global.Views && Views.Onboarding) {
                Views.Onboarding.start(1);
            } else {
                if (global.UI && UI.toast) UI.toast(`Bienvenido(a), ${res.user.name}`, 'success');
                if (global.Router) Router.navigate('panel');
            }
        },

        async handleGoogleClick() {
            this._setFeedback('');
            const res = await this.loginWithGoogle();
            if (!res.ok) {
                this._setFeedback(res.error, true);
                return;
            }
            this._state.locked = false;
            if (global.UI && UI.closeModal) UI.closeModal();
            if (!res.user.onboardingCompleted && global.Views && Views.Onboarding) {
                Views.Onboarding.start(1);
            } else if (global.Router) {
                Router.navigate('panel');
            }
        },

        _renderAuthModal() {
            const mode = this._state.mode;
            const u = this.getCurrentUser();
            const isFirebase = this.isFirebaseConfigured();

            let bodyHtml = '';
            if (mode === 'verify' && u) {
                bodyHtml = `
                    <div style="text-align:center; padding:8px 4px;">
                        <div style="width:60px; height:60px; border-radius:18px; background:#ecfdf5; color:#047857; display:grid; place-items:center; margin:0 auto 14px;">
                            <i data-lucide="mail-check" style="width:30px; height:30px;"></i>
                        </div>
                        <h3 style="font-size:19px; font-weight:900; color:#0f172a; margin:0 0 8px;">Revisa tu correo</h3>
                        <p style="font-size:13.5px; color:#475569; line-height:1.5; margin:0 0 14px;">
                            Enviamos un enlace de confirmación a <strong style="color:#0f172a;">${u.email}</strong> desde <strong>${this.CONFIG.supportEmail}</strong>. Ábrelo y haz clic en <em>Confirmar mi correo</em> para continuar con la configuración de tu cuenta.
                        </p>
                        ${!isFirebase ? `
                            <div style="background:#fffbeb; border:1px solid #fde68a; color:#92400e; font-size:12px; padding:10px 12px; border-radius:10px; text-align:left; margin-bottom:14px;">
                                <strong>Modo de prueba local activo:</strong> aún no has conectado Firebase, así que puedes pulsar <strong>"Confirmar y continuar"</strong> para probar el salto directo al Asistente de 5 Pasos.
                            </div>
                        ` : ''}
                        <div id="a360-auth-feedback" style="display:none; border:1px solid; border-radius:10px; padding:10px 12px; font-size:12.5px; font-weight:700; margin-bottom:12px; text-align:left;"></div>
                        <button type="button" onclick="AuthService.confirmVerificationAndContinue()" style="width:100%; height:46px; border-radius:12px; border:none; background:#047857; color:#ffffff; font-size:14px; font-weight:800; cursor:pointer; margin-bottom:10px;">
                            ${isFirebase ? 'Ya confirmé mi correo → Continuar' : 'Simular confirmación → Ir al Asistente'}
                        </button>
                        <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:6px;">
                            <button type="button" onclick="AuthService.resendVerificationEmail().then(r => AuthService._setFeedback(r.ok ? 'Correo reenviado a ${u.email}.' : r.error, !r.ok))" style="background:transparent; border:1px solid #cbd5e1; color:#334155; padding:8px 14px; border-radius:10px; font-size:12.5px; font-weight:700; cursor:pointer;">
                                Reenviar correo
                            </button>
                            <button type="button" onclick="AuthService.changeUnverifiedEmail()" style="background:transparent; border:1px solid #cbd5e1; color:#334155; padding:8px 14px; border-radius:10px; font-size:12.5px; font-weight:700; cursor:pointer;">
                                Corregir correo
                            </button>
                        </div>
                    </div>
                `;
            } else if (mode === 'login') {
                bodyHtml = `
                    <form onsubmit="AuthService.handleLoginSubmit(event)" style="display:flex; flex-direction:column; gap:12px;">
                        <button type="button" onclick="AuthService.handleGoogleClick()" style="width:100%; height:44px; border-radius:12px; border:1.5px solid #cbd5e1; background:#ffffff; color:#0f172a; font-size:13.5px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer;">
                            <i data-lucide="chrome" style="width:18px; height:18px; color:#2563eb;"></i> Continuar con Google
                        </button>
                        <div style="display:flex; align-items:center; gap:10px; color:#94a3b8; font-size:11.5px; font-weight:700;">
                            <span style="flex:1; height:1px; background:#e2e8f0;"></span> o con tu correo <span style="flex:1; height:1px; background:#e2e8f0;"></span>
                        </div>
                        <div id="a360-auth-feedback" style="display:none; border:1px solid; border-radius:10px; padding:10px 12px; font-size:12.5px; font-weight:700;"></div>
                        <div>
                            <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:4px;">Correo electrónico</label>
                            <input id="auth-login-email" type="email" required placeholder="tu.correo@gmail.com" style="width:100%; height:42px; border-radius:10px; border:1.5px solid #cbd5e1; padding:0 12px; font-size:14px; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:4px;">Contraseña</label>
                            <input id="auth-login-pwd" type="password" required placeholder="••••••••" style="width:100%; height:42px; border-radius:10px; border:1.5px solid #cbd5e1; padding:0 12px; font-size:14px; box-sizing:border-box;">
                        </div>
                        <button type="submit" style="width:100%; height:46px; border-radius:12px; border:none; background:#047857; color:#ffffff; font-size:14px; font-weight:800; cursor:pointer;">
                            Iniciar sesión
                        </button>
                        <div style="text-align:center; font-size:13px; color:#475569; margin-top:4px;">
                            ¿Aún no tienes cuenta? <button type="button" onclick="AuthService.openAuthModal('register')" style="background:none; border:none; color:#047857; font-weight:800; cursor:pointer; padding:0;">Crear cuenta gratis</button>
                        </div>
                    </form>
                `;
            } else {
                bodyHtml = `
                    <form onsubmit="AuthService.handleRegisterSubmit(event)" style="display:flex; flex-direction:column; gap:11px;">
                        <button type="button" onclick="AuthService.handleGoogleClick()" style="width:100%; height:44px; border-radius:12px; border:1.5px solid #cbd5e1; background:#ffffff; color:#0f172a; font-size:13.5px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer;">
                            <i data-lucide="chrome" style="width:18px; height:18px; color:#2563eb;"></i> Continuar con Google
                        </button>
                        <div style="display:flex; align-items:center; gap:10px; color:#94a3b8; font-size:11.5px; font-weight:700;">
                            <span style="flex:1; height:1px; background:#e2e8f0;"></span> o regístrate con tu correo <span style="flex:1; height:1px; background:#e2e8f0;"></span>
                        </div>
                        <div id="a360-auth-feedback" style="display:none; border:1px solid; border-radius:10px; padding:10px 12px; font-size:12.5px; font-weight:700;"></div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
                            <div>
                                <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:4px;">Nombre</label>
                                <input id="auth-first-name" type="text" required placeholder="Ej. Alexis" style="width:100%; height:40px; border-radius:10px; border:1.5px solid #cbd5e1; padding:0 12px; font-size:14px; box-sizing:border-box;">
                            </div>
                            <div>
                                <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:4px;">Apellido</label>
                                <input id="auth-last-name" type="text" required placeholder="Ej. Hernández" style="width:100%; height:40px; border-radius:10px; border:1.5px solid #cbd5e1; padding:0 12px; font-size:14px; box-sizing:border-box;">
                            </div>
                        </div>
                        <div>
                            <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:4px;">Correo electrónico</label>
                            <input id="auth-reg-email" type="email" required placeholder="profe@gmail.com" style="width:100%; height:40px; border-radius:10px; border:1.5px solid #cbd5e1; padding:0 12px; font-size:14px; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:4px;">Confirmar correo electrónico</label>
                            <input id="auth-reg-email-confirm" type="email" required placeholder="Repite tu correo para evitar errores" style="width:100%; height:40px; border-radius:10px; border:1.5px solid #cbd5e1; padding:0 12px; font-size:14px; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:12px; font-weight:800; color:#334155; margin-bottom:4px;">Contraseña</label>
                            <input id="auth-reg-pwd" type="password" required oninput="AuthService._updatePasswordChecklist(this.value)" placeholder="Mínimo 8 caracteres" style="width:100%; height:40px; border-radius:10px; border:1.5px solid #cbd5e1; padding:0 12px; font-size:14px; box-sizing:border-box;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 10px; margin-top:6px; font-size:11.5px; color:#64748b; font-weight:600;">
                                <span id="pwd-req-len"><span class="a360-pwd-dot">•</span> Mínimo 8 caracteres</span>
                                <span id="pwd-req-upper"><span class="a360-pwd-dot">•</span> Una mayúscula</span>
                                <span id="pwd-req-lower"><span class="a360-pwd-dot">•</span> Una minúscula</span>
                                <span id="pwd-req-num"><span class="a360-pwd-dot">•</span> Un número</span>
                            </div>
                        </div>
                        <label style="display:flex; align-items:flex-start; gap:8px; font-size:12px; color:#475569; cursor:pointer; line-height:1.4;">
                            <input id="auth-terms" type="checkbox" style="margin-top:2px; width:16px; height:16px;">
                            <span>Acepto los términos de uso de <strong>Aula 360 HN</strong> y la creación de mi prueba gratuita de ${this.CONFIG.trialDays} días.</span>
                        </label>
                        <button type="submit" style="width:100%; height:46px; border-radius:12px; border:none; background:#047857; color:#ffffff; font-size:14px; font-weight:800; cursor:pointer;">
                            Crear mi cuenta gratis
                        </button>
                        <div style="text-align:center; font-size:13px; color:#475569;">
                            ¿Ya tienes cuenta? <button type="button" onclick="AuthService.openAuthModal('login')" style="background:none; border:none; color:#047857; font-weight:800; cursor:pointer; padding:0;">Iniciar sesión</button>
                        </div>
                    </form>
                `;
            }

            const html = `
                <div style="max-width:440px; margin:0 auto; padding:4px 2px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:36px; height:36px; border-radius:10px; background:#047857; color:#ffffff; display:grid; place-items:center; font-weight:900;">
                                <i data-lucide="shield-check" style="width:18px; height:18px;"></i>
                            </div>
                            <div>
                                <div style="font-size:15px; font-weight:900; color:#0f172a;">Aula 360 HN</div>
                                <div style="font-size:11.5px; font-weight:600; color:#64748b;">Cuenta Docente · ${this.CONFIG.trialDays} días de prueba</div>
                            </div>
                        </div>
                        ${this._state.locked ? '' : '<button type="button" onclick="UI.closeModal()" style="width:32px; height:32px; border-radius:8px; border:1px solid #cbd5e1; background:#f8fafc; color:#334155; font-weight:800; cursor:pointer;">✕</button>'}
                    </div>
                    ${bodyHtml}
                    <div style="margin-top:14px; padding-top:10px; border-top:1px solid #e2e8f0; text-align:center; font-size:11px; color:#64748b;">
                        Soporte y activación de licencias: <strong>${this.CONFIG.supportEmail}</strong>
                    </div>
                </div>
            `;

            if (global.UI && UI.modal) {
                UI.modal('', html);
                if (this._state.locked) {
                    const overlay = document.getElementById('modal-overlay');
                    if (overlay) {
                        overlay.onclick = (ev) => {
                            if (ev.target === overlay && this._state.locked) {
                                ev.stopImmediatePropagation();
                            }
                        };
                    }
                }
                if (global.lucide) setTimeout(() => global.lucide.createIcons(), 30);
            }
        },

        _escapeHtml(str) {
            return String(str == null ? '' : str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        _toast(msg, type = 'info') {
            if (global.UI && typeof global.UI.toast === 'function') {
                global.UI.toast(msg, type);
            } else {
                console.log(`[AuthService ${type}]`, msg);
            }
        },

        openAccountOrLicense() {
            const u = this.getCurrentUser();
            if (u && (u.uid || u.email)) {
                this.openLicenseModal();
            } else {
                this.openAuthModal('register');
            }
        },

        canCreateCourse(proposedCenterName = '') {
            const lic = this.getLicenseStatus();
            if (lic.isPro) return { allowed: true, license: lic };

            const cursos = (global.Store && global.Store.get) ? (global.Store.get('cursos') || []) : [];
            if (cursos.length >= lic.maxCourses) {
                return {
                    allowed: false,
                    reason: 'courses',
                    limit: lic.maxCourses,
                    current: cursos.length,
                    license: lic
                };
            }

            const norm = (s) => String(s || '').trim().toUpperCase();
            const centers = new Set(cursos.map(c => norm(c.centroEducativo || c.centro)).filter(Boolean));
            const targetCenter = norm(proposedCenterName);
            if (targetCenter && !centers.has(targetCenter) && centers.size >= lic.maxCenters) {
                return {
                    allowed: false,
                    reason: 'centers',
                    limit: lic.maxCenters,
                    current: centers.size,
                    license: lic
                };
            }
            return { allowed: true, license: lic };
        },

        async refreshLicenseFromCloud() {
            const u = this.getCurrentUser();
            if (!u || !u.uid) {
                this.openAuthModal('login');
                return;
            }
            if (!global.firebase || !global.firebase.firestore) {
                this._toast('Sin conexión con el servidor de licencias.', 'warning');
                return;
            }
            try {
                const docRef = global.firebase.firestore().collection('teachers').doc(u.uid);
                const snap = await docRef.get();
                if (snap.exists) {
                    const data = snap.data() || {};
                    const updated = Object.assign({}, u, {
                        plan: data.plan || u.plan,
                        trialStartedAt: data.trialStartedAt || u.trialStartedAt,
                        trialEndsAt: data.trialEndsAt || u.trialEndsAt,
                        proExpiresAt: data.proExpiresAt || null,
                        lastValidatedAt: new Date().toISOString()
                    });
                    this._saveSession(updated);
                    const lic = this.getLicenseStatus();
                    this._toast(lic.isPro ? '¡Plan Pro activado correctamente!' : `Estado actualizado: ${lic.label}`, lic.isPro ? 'success' : 'info');
                } else {
                    this._toast('Aún no se encontró registro en la nube.', 'info');
                }
            } catch (e) {
                this._toast('No se pudo verificar en línea. Revisa tu conexión.', 'warning');
            }
            if (global.Router && global.Router.current === 'plan-pro') {
                global.Router.navigate('plan-pro');
            } else {
                this.openLicenseModal();
            }
        },

        selectPlan(planId) {
            this._state.selectedPlanId = planId;
            if (global.Router && global.Router.current === 'plan-pro') {
                const container = document.getElementById('content');
                if (container) {
                    container.innerHTML = this.renderPlanProView();
                    if (global.lucide) setTimeout(() => global.lucide.createIcons(), 20);
                }
            }
        },

        renderPlanProView() {
            const u = this.getCurrentUser();
            const lic = this.getLicenseStatus();
            const cursos = (global.Store && global.Store.get) ? (global.Store.get('cursos') || []) : [];
            const centersCount = new Set(cursos.map(c => String(c.centroEducativo || c.centro || '').trim().toUpperCase()).filter(Boolean)).size;
            const plans = this.CONFIG.plans || [];
            const selectedPlan = plans.find(p => p.id === this._state.selectedPlanId) || plans[2] || plans[0];

            const badgeBg = lic.isPro ? '#ecfdf5' : (lic.isTrialActive ? '#eff6ff' : '#fef2f2');
            const badgeBorder = lic.isPro ? '#6ee7b7' : (lic.isTrialActive ? '#bfdbfe' : '#fecaca');
            const badgeColor = lic.isPro ? '#047857' : (lic.isTrialActive ? '#1d4ed8' : '#b91c1c');

            const features = [
                'Cursos y secciones ilimitados para todas tus asignaturas',
                'Múltiples Centros Educativos en una sola cuenta docente',
                'Reportes oficiales y Cuadro #1 SACE sin marca de prueba',
                'Respaldo en la nube y verificación instantánea de licencia',
                'Soporte prioritario directo por WhatsApp y correo'
            ];

            const waMsg = `Hola, quiero activar el Plan Pro (${selectedPlan ? selectedPlan.name + ' - ' + selectedPlan.price : 'Plan Pro'}) de Aula 360 HN.\nNombre: ${(u && u.name) || 'Docente'}\nCorreo: ${(u && u.email) || 'Sin sesión aún'}\nID: ${(u && u.uid) || 'N/A'}`;
            const waUrl = `https://wa.me/${this.CONFIG.supportWhatsapp}?text=${encodeURIComponent(waMsg)}`;

            return `
                <div class="fade-in" style="max-width:920px; margin:0 auto; padding:8px 4px 28px; display:flex; flex-direction:column; gap:18px;">
                    <!-- Hero Banner -->
                    <div style="background:linear-gradient(135deg, #064e3b 0%, #047857 55%, #0d9488 100%); color:#ffffff; border-radius:20px; padding:24px 22px; box-shadow:0 12px 30px rgba(4,120,87,0.22); position:relative; overflow:hidden;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:48px; height:48px; border-radius:14px; background:rgba(255,255,255,0.16); display:grid; place-items:center; flex-shrink:0;">
                                    <i data-lucide="shopping-cart" style="width:24px; height:24px; color:#fde68a;"></i>
                                </div>
                                <div>
                                    <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#a7f3d0;">Aula 360 HN · Plan Pro</div>
                                    <h2 style="margin:2px 0 0; font-size:22px; font-weight:900; color:#ffffff; line-height:1.2;">
                                        ${lic.isPro ? '¡Tu Plan Pro está Activo!' : 'Hazte Pro y desbloquea todo el potencial'}
                                    </h2>
                                </div>
                            </div>
                            <span style="padding:6px 14px; border-radius:999px; background:${badgeBg}; border:1px solid ${badgeBorder}; color:${badgeColor}; font-size:12px; font-weight:800;">
                                ${this._escapeHtml(lic.label)}
                            </span>
                        </div>
                        <p style="margin:14px 0 0; font-size:14px; line-height:1.55; color:#ecfdf5; max-width:720px;">
                            Ahorra tiempo y simplifica tu trabajo docente, organiza tu clase evaluando al alumnado y lleva toda la información del aula en un solo lugar.
                        </p>
                    </div>

                    <!-- Estado de cuenta actual -->
                    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:16px 18px; display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap;">
                        ${u ? `
                            <div>
                                <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#64748b;">Cuenta Conectada</div>
                                <div style="font-size:15px; font-weight:900; color:#0f172a; margin-top:2px;">${this._escapeHtml(u.name || 'Docente')} <span style="font-weight:600; color:#475569; font-size:13px;">(${this._escapeHtml(u.email || '')})</span></div>
                                <div style="font-size:12px; color:#64748b; margin-top:4px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                    <span>Cursos: <b>${lic.isPro ? cursos.length + ' / Ilimitados' : cursos.length + ' / ' + lic.maxCourses}</b></span>
                                    <span>&bull;</span>
                                    <span>Centros: <b>${lic.isPro ? centersCount + ' / Ilimitados' : centersCount + ' / ' + lic.maxCenters}</b></span>
                                    ${u.uid ? `<span>&bull;</span><span>ID: <code style="background:#f1f5f9; padding:1px 6px; border-radius:4px;">${this._escapeHtml(u.uid)}</code></span>
                                    <button type="button" onclick="navigator.clipboard && navigator.clipboard.writeText('${this._escapeHtml(u.uid)}'); UI && UI.toast && UI.toast('ID copiado', 'success');" style="border:none; background:none; color:#047857; font-weight:800; font-size:12px; cursor:pointer; padding:0;">Copiar ID</button>` : ''}
                                </div>
                            </div>
                            <button type="button" onclick="AuthService.logout().then(() => { Router && Router.navigate && Router.navigate('plan-pro'); })" style="padding:8px 14px; border-radius:10px; border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; font-size:12.5px; font-weight:800; cursor:pointer;">
                                Cerrar sesión
                            </button>
                        ` : `
                            <div>
                                <div style="font-size:14px; font-weight:800; color:#0f172a;">Aún no has iniciado sesión en este dispositivo</div>
                                <div style="font-size:12.5px; color:#64748b; margin-top:2px;">Crea tu cuenta gratis en 1 minuto para activar tu prueba de ${this.CONFIG.trialDays} días o vincular tu Plan Pro.</div>
                            </div>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <button type="button" onclick="AuthService.openAuthModal('register')" style="padding:10px 16px; border-radius:10px; border:none; background:#047857; color:#ffffff; font-size:13px; font-weight:800; cursor:pointer;">
                                    Probar ${this.CONFIG.trialDays} días gratis sin tarjeta
                                </button>
                                <button type="button" onclick="AuthService.openAuthModal('login')" style="padding:10px 14px; border-radius:10px; border:1px solid #cbd5e1; background:#f8fafc; color:#0f172a; font-size:13px; font-weight:700; cursor:pointer;">
                                    Iniciar sesión
                                </button>
                            </div>
                        `}
                    </div>

                    <!-- Checklist de beneficios -->
                    <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:18px 20px;">
                        <div style="font-size:14px; font-weight:900; color:#0f172a; margin-bottom:12px;">¿Qué incluye Aula 360 HN Pro?</div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:10px;">
                            ${features.map(f => `
                                <div style="display:flex; align-items:flex-start; gap:10px; font-size:13px; color:#334155; font-weight:600;">
                                    <span style="width:20px; height:20px; border-radius:999px; background:#dcfce7; color:#15803d; display:grid; place-items:center; flex-shrink:0; font-size:12px; font-weight:900;">✓</span>
                                    <span>${f}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${!lic.isPro ? `
                    <!-- Planes disponibles -->
                    <div>
                        <div style="font-size:14px; font-weight:900; color:#0f172a; margin-bottom:10px;">Elige el plan que mejor se adapte a tu año escolar:</div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(195px, 1fr)); gap:12px;">
                            ${plans.map(p => {
                                const isSel = selectedPlan && selectedPlan.id === p.id;
                                return `
                                <button type="button" onclick="AuthService.selectPlan('${p.id}')" style="text-align:left; padding:16px; border-radius:16px; border:${isSel ? '2px solid #047857' : '1.5px solid #e2e8f0'}; background:${isSel ? '#ecfdf5' : '#ffffff'}; cursor:pointer; position:relative; transition:all 0.15s; box-shadow:${isSel ? '0 8px 20px rgba(4,120,87,0.12)' : 'none'};">
                                    ${p.badge ? `<span style="display:inline-block; margin-bottom:8px; padding:3px 8px; border-radius:999px; background:${p.id === 'vitalicio' ? '#fef3c7' : '#d1fae5'}; color:${p.id === 'vitalicio' ? '#92400e' : '#065f46'}; font-size:10.5px; font-weight:800; text-transform:uppercase;">${p.badge}</span>` : '<div style="height:24px;"></div>'}
                                    <div style="font-size:15px; font-weight:900; color:#0f172a;">${p.name}</div>
                                    <div style="margin-top:6px; display:flex; align-items:baseline; gap:4px;">
                                        <span style="font-size:22px; font-weight:900; color:#047857;">${p.price}</span>
                                        <span style="font-size:12px; font-weight:700; color:#64748b;">${p.period}</span>
                                    </div>
                                    <div style="margin-top:6px; font-size:11.5px; color:#475569; line-height:1.35;">${p.note}</div>
                                </button>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Botón principal de activación -->
                    <div style="display:flex; flex-direction:column; gap:10px; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:18px;">
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="width:100%; max-width:440px; height:48px; border-radius:14px; background:#16a34a; color:#ffffff; font-size:15px; font-weight:900; display:flex; align-items:center; justify-content:center; gap:10px; text-decoration:none; box-shadow:0 8px 20px rgba(22,163,74,0.25);">
                            <i data-lucide="message-circle" style="width:20px; height:20px;"></i>
                            <span>Activar ${selectedPlan ? selectedPlan.name + ' (' + selectedPlan.price + ')' : 'Plan Pro'} por WhatsApp</span>
                        </a>
                        ${!u ? `
                        <button type="button" onclick="AuthService.openAuthModal('register')" style="width:100%; max-width:440px; height:44px; border-radius:12px; border:1.5px solid #047857; background:#ffffff; color:#047857; font-size:13.5px; font-weight:800; cursor:pointer;">
                            Probar ${this.CONFIG.trialDays} días gratis sin tarjeta
                        </button>` : ''}
                        <div style="font-size:12px; color:#64748b; text-align:center;">
                            También puedes escribirnos a <strong>${this.CONFIG.supportEmail}</strong> · Activación rápida sin perder tus datos.
                        </div>
                    </div>
                    ` : ''}

                    <!-- Restaurar / Verificar licencia -->
                    <div style="text-align:center; padding:8px 0;">
                        <div style="font-size:13px; font-weight:700; color:#475569; margin-bottom:8px;">¿Ya eres usuario Pro o ya realizaste tu activación?</div>
                        <button type="button" onclick="AuthService.refreshLicenseFromCloud()" style="padding:10px 20px; border-radius:12px; border:1.5px solid #cbd5e1; background:#ffffff; color:#0f172a; font-size:13px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:8px;">
                            <i data-lucide="refresh-cw" style="width:15px; height:15px;"></i>
                            <span>Restaurar / Verificar licencia en la nube</span>
                        </button>
                    </div>
                </div>
            `;
        },

        openLicenseModal() {
            const u = this.getCurrentUser();
            if (!u) {
                this.openAuthModal('register');
                return;
            }
            const lic = this.getLicenseStatus();
            const cursos = (global.Store && global.Store.get) ? (global.Store.get('cursos') || []) : [];
            const centersCount = new Set(cursos.map(c => String(c.centroEducativo || c.centro || '').trim().toUpperCase()).filter(Boolean)).size;

            const badgeBg = lic.isPro ? '#ecfdf5' : (lic.isTrialActive ? '#eff6ff' : '#fef2f2');
            const badgeBorder = lic.isPro ? '#6ee7b7' : (lic.isTrialActive ? '#bfdbfe' : '#fecaca');
            const badgeColor = lic.isPro ? '#047857' : (lic.isTrialActive ? '#1d4ed8' : '#b91c1c');
            const limitCoursesText = lic.isPro ? `${cursos.length} / Ilimitados` : `${cursos.length} / ${lic.maxCourses}`;
            const limitCentersText = lic.isPro ? `${centersCount} / Ilimitados` : `${centersCount} / ${lic.maxCenters}`;
            const exportText = lic.canExportClean ? 'Oficial sin marca de agua' : 'Con marca de prueba';

            const html = `
                <div style="max-width:440px; margin:0 auto; padding:4px 2px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:36px; height:36px; border-radius:10px; background:#047857; color:#ffffff; display:grid; place-items:center;">
                                <i data-lucide="award" style="width:18px; height:18px;"></i>
                            </div>
                            <div>
                                <div style="font-size:15px; font-weight:900; color:#0f172a;">Cuenta y Licencia</div>
                                <div style="font-size:11.5px; font-weight:600; color:#64748b;">Aula 360 HN</div>
                            </div>
                        </div>
                        <button type="button" onclick="UI.closeModal()" style="width:32px; height:32px; border-radius:8px; border:1px solid #cbd5e1; background:#f8fafc; color:#334155; font-weight:800; cursor:pointer;">✕</button>
                    </div>

                    <div style="padding:14px; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                            <div style="font-size:14px; font-weight:800; color:#0f172a;">${this._escapeHtml(u.name || 'Docente')}</div>
                            <span style="padding:4px 10px; border-radius:999px; background:${badgeBg}; border:1px solid ${badgeBorder}; color:${badgeColor}; font-size:11.5px; font-weight:800;">
                                ${this._escapeHtml(lic.label)}
                            </span>
                        </div>
                        <div style="font-size:12.5px; color:#475569; word-break:break-all;">${this._escapeHtml(u.email || '')}</div>
                        ${u.uid ? `<div style="margin-top:6px; font-size:11px; color:#64748b; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <span>ID: <code style="background:#e2e8f0; padding:1px 5px; border-radius:4px;">${this._escapeHtml(u.uid)}</code></span>
                            <button type="button" onclick="navigator.clipboard && navigator.clipboard.writeText('${this._escapeHtml(u.uid)}'); UI && UI.toast && UI.toast('ID copiado', 'success');" style="border:none; background:none; color:#047857; font-weight:700; font-size:11px; cursor:pointer; padding:0;">Copiar ID</button>
                        </div>` : ''}
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                        <div style="padding:10px 12px; border-radius:12px; background:#ffffff; border:1px solid #e2e8f0;">
                            <div style="font-size:11px; font-weight:700; color:#64748b;">Cursos</div>
                            <div style="font-size:14px; font-weight:900; color:#0f172a; margin-top:2px;">${limitCoursesText}</div>
                        </div>
                        <div style="padding:10px 12px; border-radius:12px; background:#ffffff; border:1px solid #e2e8f0;">
                            <div style="font-size:11px; font-weight:700; color:#64748b;">Centros Educativos</div>
                            <div style="font-size:14px; font-weight:900; color:#0f172a; margin-top:2px;">${limitCentersText}</div>
                        </div>
                    </div>
                    <div style="padding:10px 12px; border-radius:12px; background:#ffffff; border:1px solid #e2e8f0; margin-bottom:12px;">
                        <div style="font-size:11px; font-weight:700; color:#64748b;">Reportes y Cuadro #1 SACE</div>
                        <div style="font-size:13px; font-weight:800; color:#0f172a; margin-top:2px;">${exportText}</div>
                    </div>

                    ${!lic.isPro ? (() => {
                        const waMsg = `Hola, quiero activar el Plan Pro de Aula 360 HN.\nNombre: ${u.name || 'Docente'}\nCorreo: ${u.email || ''}\nID: ${u.uid || ''}`;
                        const waUrl = `https://wa.me/${this.CONFIG.supportWhatsapp}?text=${encodeURIComponent(waMsg)}`;
                        return `
                    <div style="padding:12px 14px; border-radius:12px; background:#fffbeb; border:1px solid #fde68a; margin-bottom:14px; font-size:12.5px; color:#78350f; line-height:1.45;">
                        <strong>¿Quieres activar el Plan Pro?</strong><br>
                        Habilita cursos ilimitados, múltiples centros y exportación oficial sin marca de prueba escribiendo por WhatsApp o a <strong>${this.CONFIG.supportEmail}</strong>.
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="width:100%; height:44px; border-radius:12px; border:none; background:#16a34a; color:#ffffff; font-size:13.5px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; box-sizing:border-box;">
                            <i data-lucide="message-circle" style="width:17px; height:17px;"></i>
                            <span>Solicitar Plan Pro por WhatsApp</span>
                        </a>`;
                    })() : '<div style="display:flex; flex-direction:column; gap:8px;">'}
                        <button type="button" onclick="AuthService.refreshLicenseFromCloud()" style="width:100%; height:44px; border-radius:12px; border:none; background:#047857; color:#ffffff; font-size:13.5px; font-weight:800; cursor:pointer;">
                            Verificar activación en la nube
                        </button>
                        <button type="button" onclick="AuthService.logout().then(() => { UI && UI.closeModal && UI.closeModal(); })" style="width:100%; height:42px; border-radius:12px; border:1px solid #fecaca; background:#fef2f2; color:#b91c1c; font-size:13px; font-weight:800; cursor:pointer;">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            `;

            if (global.UI && UI.modal) {
                UI.modal('', html);
                if (global.lucide) setTimeout(() => global.lucide.createIcons(), 30);
            }
        },

        renderSocialView() {
            const links = this.CONFIG.socialLinks || {};
            const waUrl = `https://wa.me/${this.CONFIG.supportWhatsapp}?text=${encodeURIComponent('Hola, vengo desde la app Aula 360 HN.')}`;
            const mailUrl = `mailto:${this.CONFIG.supportEmail}?subject=${encodeURIComponent('Consulta desde Aula 360 HN')}`;

            const brandSvgs = {
                facebook: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg>',
                tiktok: '<svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.76 1.52V6.79a4.85 4.85 0 0 1-1-.1z"/></svg>',
                instagram: '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
                youtube: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
                whatsapp: '<svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.79 14.12c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.27-.29.58-.36.77-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.15.12.32.02.51-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.3-.13.59.17.29.74 1.22 1.59 1.98 1.09.97 2.01 1.27 2.3 1.41.29.15.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.39-.24.65-.14.27.1 1.69.8 1.98.94.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>',
                mail: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'
            };

            const cards = [
                {
                    name: 'Facebook',
                    handle: 'Aula 360 HN',
                    desc: 'Novedades, guías rápidas, lanzamientos y comunidad docente en Honduras.',
                    url: links.facebook || '',
                    svg: brandSvgs.facebook,
                    bg: 'linear-gradient(135deg, #1877f2 0%, #0d5bd9 100%)',
                    btnText: 'Seguir en Facebook'
                },
                {
                    name: 'TikTok',
                    handle: '@aula360.hn',
                    desc: 'Tips rápidos, tutoriales cortos y trucos diarios para ahorrar tiempo en el aula.',
                    url: links.tiktok || '',
                    svg: brandSvgs.tiktok,
                    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #e11d48 100%)',
                    btnText: 'Seguir en TikTok'
                },
                {
                    name: 'Instagram',
                    handle: '@aula360hn',
                    desc: 'Consejos visuales, historias del aula y novedades en formato corto.',
                    url: links.instagram || '',
                    svg: brandSvgs.instagram,
                    bg: 'linear-gradient(135deg, #f58529 0%, #dd2a7b 55%, #8134af 100%)',
                    btnText: 'Seguir en Instagram'
                },
                {
                    name: 'YouTube',
                    handle: 'Aula 360 HN',
                    desc: 'Tutoriales de uso de los módulos de la aplicación para explotar todo su potencial.',
                    url: links.youtube || '',
                    svg: brandSvgs.youtube,
                    bg: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    btnText: 'Ver canal en YouTube'
                },
                {
                    name: 'WhatsApp Oficial',
                    handle: `+${this.CONFIG.supportWhatsapp}`,
                    desc: 'Canal directo para activar tu Plan Pro y consultar planes disponibles.',
                    url: waUrl,
                    svg: brandSvgs.whatsapp,
                    bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                    btnText: 'Escribir por WhatsApp'
                },
                {
                    name: 'Correo de Soporte',
                    handle: this.CONFIG.supportEmail,
                    desc: 'Atención técnica personalizada, sugerencias y soporte de cuentas.',
                    url: mailUrl,
                    svg: brandSvgs.mail,
                    bg: 'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)',
                    btnText: 'Enviar correo'
                }
            ];

            return `
                <div class="fade-in" style="width:100%; max-width:100%; margin:0; padding:8px 4px 28px; box-sizing:border-box; display:flex; flex-direction:column; gap:18px;">
                    <div style="width:100%; box-sizing:border-box; background:linear-gradient(135deg, #064e3b 0%, #047857 55%, #0d9488 100%); color:#ffffff; border-radius:20px; padding:24px 22px; box-shadow:0 12px 30px rgba(4,120,87,0.2);">
                        <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#a7f3d0;">Comunidad Docente</div>
                        <h2 style="margin:4px 0 6px; font-size:22px; font-weight:900; color:#ffffff; line-height:1.2;">Conecta con Aula 360 HN</h2>
                        <p style="margin:0; font-size:13.5px; line-height:1.55; color:#ecfdf5;">
                            Ahorra tiempo en tu labor docente. Síguenos en nuestras redes oficiales para ver tutoriales, actualizaciones y novedades pensadas para maestros por un maestro.
                        </p>
                    </div>

                    <div style="width:100%; display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px;">
                        ${cards.map(c => {
                            const hasUrl = Boolean(c.url);
                            return `
                            <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; gap:14px; box-shadow:0 4px 14px rgba(15,23,42,0.04);">
                                <div>
                                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px;">
                                        <div style="display:flex; align-items:center; gap:12px;">
                                            <div style="width:44px; height:44px; border-radius:12px; background:${c.bg}; color:#ffffff; display:grid; place-items:center; flex-shrink:0;">
                                                ${c.svg}
                                            </div>
                                            <div>
                                                <div style="font-size:15px; font-weight:900; color:#0f172a;">${c.name}</div>
                                                <div style="font-size:12px; font-weight:700; color:#64748b;">${this._escapeHtml(c.handle)}</div>
                                            </div>
                                        </div>
                                        ${!hasUrl ? '<span style="padding:3px 8px; border-radius:999px; background:#f1f5f9; color:#64748b; font-size:10.5px; font-weight:800;">Próximamente</span>' : ''}
                                    </div>
                                    <p style="margin:0; font-size:13px; color:#475569; line-height:1.45;">${c.desc}</p>
                                </div>
                                ${hasUrl ? `
                                    <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="height:40px; border-radius:11px; background:${c.bg}; color:#ffffff; font-size:13px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:8px; text-decoration:none;">
                                        <span>${c.btnText}</span>
                                        <i data-lucide="external-link" style="width:15px; height:15px;"></i>
                                    </a>
                                ` : `
                                    <button type="button" onclick="UI && UI.toast && UI.toast('Muy pronto estará disponible nuestro canal de ${c.name}', 'info')" style="height:40px; border-radius:11px; border:1px solid #cbd5e1; background:#f8fafc; color:#64748b; font-size:13px; font-weight:700; cursor:pointer;">
                                        Próximamente
                                    </button>
                                `}
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }
    };

    global.AuthService = AuthService;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AuthService.init());
    } else {
        AuthService.init();
    }
})(window);
