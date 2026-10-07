// --- 3. UI KERNEL ---
const UI = {
    playSound(type = 'success') {
        if (!Store.data.configPreferencias || !Store.data.configPreferencias.sonidosHabilitados) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            if (type === 'success') {
                // Arpegio brillante (Alegre)
                [1046.50, 1318.51, 1567.98].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    const startTime = ctx.currentTime + (i * 0.08);
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
                    osc.start(startTime);
                    osc.stop(startTime + 0.2);
                });
            } else if (type === 'error') {
                // Dos zumbidos graves (Error)
                [150, 140].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.value = freq;
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    const startTime = ctx.currentTime + (i * 0.15);
                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
                    osc.start(startTime);
                    osc.stop(startTime + 0.15);
                });
            } else if (type === 'warning') {
                // Tono vibrante de alerta
                [440, 523.25, 659.25].forEach((freq) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.3);
                });
            } else if (type === 'info') {
                // Campana suave
                [800, 1600].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(i === 0 ? 0.2 : 0.05, ctx.currentTime + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.5);
                });
            } else if (type === 'pop') {
                // Burbuja
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
            } else {
                // Click neutral corto
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = 800;
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.005);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.02);
            }
        } catch(e) { /* Audio not supported or blocked */ }
    },
    async copyText(text, successMessage = 'Copiado al portapapeles') {
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Clipboard) {
                await window.Capacitor.Plugins.Clipboard.write({ string: text });
                this.toast(successMessage, 'success');
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                this.toast(successMessage, 'success');
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    this.toast(successMessage, 'success');
                } catch (err) {
                    this.toast('Error al copiar al portapapeles', 'error');
                }
                document.body.removeChild(textArea);
            }
        } catch (e) {
            console.error('Copy Error:', e);
            this.toast('Error al copiar al portapapeles', 'error');
        }
    },
    async shareData(options) {
        try {
            if (window.Capacitor && window.Capacitor.Plugins.Share) {
                const canShare = await window.Capacitor.Plugins.Share.canShare();
                if (canShare.value) {
                    // Handle blobs on Capacitor
                    if (options.blob && options.fileName && window.Capacitor.Plugins.Filesystem) {
                        try {
                            const reader = new FileReader();
                            const base64Data = await new Promise((resolve) => {
                                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                                reader.readAsDataURL(options.blob);
                            });
                            
                            const result = await window.Capacitor.Plugins.Filesystem.writeFile({
                                path: options.fileName,
                                data: base64Data,
                                directory: 'CACHE'
                            });
                            
                            await window.Capacitor.Plugins.Share.share({
                                title: options.title || 'Compartir',
                                text: options.text || '',
                                url: result.uri,
                                dialogTitle: 'Compartir'
                            });
                            return true;
                        } catch (e) { console.error('Share blob error:', e); }
                    } else {
                        await window.Capacitor.Plugins.Share.share(options);
                        return true;
                    }
                }
            } 
            
            // Web fallback
            if (navigator.share && navigator.canShare) {
                let shareOpts = { title: options.title, text: options.text, url: options.url };
                if (options.blob && options.fileName) {
                    const file = new File([options.blob], options.fileName, { type: options.blob.type, lastModified: Date.now() });
                    if (navigator.canShare({ files: [file] })) {
                        shareOpts.files = [file];
                    }
                }
                await navigator.share(shareOpts);
                return true;
            }
            
            if (options.text) {
                await this.copyText(options.text, 'Información copiada al portapapeles (compartir no disponible)');
                return true;
            }
            this.toast('Tu dispositivo no soporta compartir este contenido', 'warning');
            return false;
        } catch (e) {
            console.error('Share Error:', e);
            if (e.name !== 'AbortError' && e.message !== 'Share canceled') {
                this.toast('Error al compartir', 'info');
            }
            return false;
        }
    },
    toast(msg, type = 'success') {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<span>${msg}</span>`;
        document.getElementById('toast-container').appendChild(el);
        setTimeout(() => el.remove(), 3000);
        this.playSound(type);
    },
    showSpinner() {
        const sp = document.getElementById('gdhn-route-spinner');
        if (!sp) return;
        sp.style.display = 'flex';
        // Force reflow so the CSS transition fires
        void sp.offsetWidth;
        sp.classList.add('visible');
    },
    hideSpinner() {
        const sp = document.getElementById('gdhn-route-spinner');
        if (!sp) return;
        sp.classList.remove('visible');
        setTimeout(() => { sp.style.display = 'none'; }, 200);
    },
    modal(title, contentHtml, footerHtml = '') {
        // Hide virtual keyboard on mobile devices when opening a modal
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        
        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = `
                    <div class="modal">
                        <div class="modal-header">
                            <div class="text-xl font-bold">${title}</div>
                            <button class="modal-close" onclick="UI.closeModal()">&times;</button>
                        </div>
                        <div class="modal-body">${contentHtml}</div>
                        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
                    </div>
                `;
        overlay.classList.add('open');
    },
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('open');
    },
    toggleFloatingNavMenu(e) {
        if (e) e.stopPropagation();
        const menu = document.getElementById('fab-nav-menu');
        if (menu) {
            menu.classList.toggle('show');
        }
    },
    makeDraggable(el, handle) {
        if (!el || !handle) return;
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.style.cursor = 'move';
        handle.onmousedown = dragMouseDown;
        handle.ontouchstart = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            pos3 = clientX;
            pos4 = clientY;
            document.onmouseup = closeDragElement;
            document.ontouchend = closeDragElement;
            document.onmousemove = elementDrag;
            document.ontouchmove = elementDrag;
        }
        function elementDrag(e) {
            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;
            el.style.position = 'absolute';
            el.style.margin = '0';
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
        }
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
        }
    },
    confirm(msg, onConfirm) {
        this.modal('Confirmar', `<p style="font-size: 16px; margin: 10px 0;">${msg}</p>`, `
            <div style="display: flex; gap: 10px; width: 100%;">
                <button class="btn btn-secondary" onclick="UI.closeModal()" style="background:#64748b; color:white; border:none; flex: 1; border-radius: 12px; height: 48px; font-weight: 600;">Cancelar</button>
                <button class="btn btn-primary" id="confirm-yes" style="flex: 1; border-radius: 12px; height: 48px; font-weight: 700;">Confirmar</button>
            </div>
        `);
        setTimeout(() => {
            const btn = document.getElementById('confirm-yes');
            if (btn) { btn.onclick = () => { onConfirm(); UI.closeModal(); }; }
        }, 10);
    },

    // ─── ALERTA DE ACCIÓN DESTRUCTIVA ─────────────────────────────────────────
    // Úsalo para cualquier operación que borre datos irrecuperables.
    // impacts: array de strings describiendo qué se perderá (ej: ['300 estudiantes', 'Asistencias'])
    // requireTyped: si true, el usuario debe escribir "ELIMINAR" para confirmar
    danger(msg, impacts, onConfirm, requireTyped = false) {
        // 1. Sonido de alarma via Web Audio API (sin archivos externos)
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const playBeep = (freq, start, dur, vol = 0.6) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                    gain.gain.setValueAtTime(0, ctx.currentTime + start);
                    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
                    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
                    osc.start(ctx.currentTime + start);
                    osc.stop(ctx.currentTime + start + dur + 0.05);
                };
                // Tres pulsos de alarma descendentes
                playBeep(880, 0.0, 0.18);
                playBeep(660, 0.22, 0.18);
                playBeep(440, 0.44, 0.28);
            }
        } catch(e) { /* silencioso si no hay soporte */ }

        const impactHtml = impacts && impacts.length > 0
            ? `<div style="margin:16px 0; background:#fff1f2; border:1px solid #fecdd3; border-radius:10px; padding:12px 14px;">
                <div style="font-size:10px; font-weight:800; color:#be123c; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">⚠ Datos que se perderán para siempre:</div>
                ${impacts.map(i => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;color:#9f1239;font-weight:600;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    ${i}
                </div>`).join('')}
               </div>`
            : '';

        const typedHtml = requireTyped
            ? `<div style="margin-top:14px;">
                <label style="font-size:11px;font-weight:800;color:#be123c;text-transform:uppercase;letter-spacing:0.06em;display:block;margin-bottom:6px;">🔒 Ingresa la contraseña de seguridad:</label>
                <div style="position:relative;">
                    <input id="danger-typed" type="password" autocomplete="off" placeholder="Contraseña de seguridad"
                        style="width:100%;padding:10px 44px 10px 14px;border:2px solid #fecdd3;border-radius:10px;font-size:14px;font-weight:700;color:#be123c;background:#fff1f2;outline:none;box-sizing:border-box;"
                        oninput="(function(el){const b=document.getElementById('danger-confirm-btn');const pwd=Store.data.securityPassword||'Aula360';if(b)b.disabled=el.value!==pwd;})(this)">
                    <button type="button" onclick="(function(btn){const inp=document.getElementById('danger-typed');inp.type=inp.type==='password'?'text':'password';btn.innerHTML=inp.type==='password'?'👁️':'🙈';})(this)"
                        style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:0;">👁️</button>
                </div>
                <div style="font-size:10px;color:#94a3b8;margin-top:4px;">La contraseña de seguridad se configura en Ajustes.</div>
               </div>`
            : '';

        const overlayHtml = `
            <div id="danger-modal-wrap" style="font-family:'Inter',system-ui,sans-serif;">
                <style>
                    @keyframes dangerShake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-6px)} 30%{transform:translateX(6px)} 45%{transform:translateX(-5px)} 60%{transform:translateX(5px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)} }
                    @keyframes dangerIn { from{opacity:0;transform:scale(0.93) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
                    #danger-modal-wrap .danger-box { animation: dangerIn 0.25s cubic-bezier(0.16,1,0.3,1), dangerShake 0.5s 0.1s cubic-bezier(0.36,0.07,0.19,0.97); }
                    #danger-confirm-btn:not(:disabled):hover { filter:brightness(1.1); transform:scale(1.02); }
                    #danger-confirm-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
                    #danger-typed:focus { border-color:#e11d48 !important; box-shadow:0 0 0 3px rgba(225,29,72,0.15); }
                </style>
                <div class="danger-box" style="background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 0 0 3px #fecdd3, 0 25px 50px -12px rgba(0,0,0,0.3); max-width:480px; margin:0 auto;">
                    <!-- Red header stripe -->
                    <div style="background:linear-gradient(135deg,#dc2626,#be123c); padding:24px; text-align:center;">
                        <div style="width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <div style="font-size:11px;font-weight:800;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">⚠ ACCIÓN IRREVERSIBLE</div>
                        <div style="font-size:17px;font-weight:900;color:#fff;line-height:1.3;">${msg}</div>
                    </div>
                    <!-- Body -->
                    <div style="padding:20px 24px;">
                        <div style="font-size:13px;color:#64748b;text-align:center;line-height:1.5;margin-bottom:4px;">Esta acción <strong style="color:#dc2626;">no se puede deshacer</strong>. Los datos eliminados no podrán recuperarse.</div>
                        ${impactHtml}
                        ${typedHtml}
                        <div style="display:flex;gap:10px;margin-top:18px;">
                            <button onclick="UI.closeModal()" style="flex:1;padding:13px;border-radius:12px;border:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                                Cancelar — mantener datos
                            </button>
                            <button id="danger-confirm-btn" ${requireTyped ? 'disabled' : ''}
                                style="flex:1;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#dc2626,#be123c);color:#fff;font-size:13px;font-weight:800;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 14px rgba(220,38,38,0.35);">
                                Sí, eliminar permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

        this.modal('', overlayHtml);
        // Hide default modal chrome
        setTimeout(() => {
            const overlay = document.getElementById('modal-overlay');
            if (overlay) {
                const header = overlay.querySelector('.modal-header');
                if (header) header.style.display = 'none';
                const body = overlay.querySelector('.modal-body');
                if (body) body.style.padding = '0';
                const modal = overlay.querySelector('.modal');
                if (modal) { modal.style.background = 'transparent'; modal.style.boxShadow = 'none'; }
                overlay.style.background = 'rgba(15,23,42,0.6)';
                overlay.style.backdropFilter = 'blur(6px)';
            }
            const btn = document.getElementById('danger-confirm-btn');
            if (btn) {
                btn.onclick = () => { onConfirm(); UI.closeModal(); };
            }
        }, 30);
    },

    renderSidebar() {
        const menu = document.getElementById('side-menu');
        const course = Store.getActiveCourse();
        const configValid = Logic.isConfigValid();

        const groups = [
            {
                label: 'NÚCLEO OPERATIVO',
                items: [
                    { id: 'agenda', icon: 'calendar', label: 'Agenda Escolar', color: 'var(--primary)', locked: false },
                    { id: 'asistencia', icon: 'user-check', label: 'Asistencia', color: 'var(--color-expresion)', locked: !course },
                    { id: 'cuadro', icon: 'table-properties', label: 'Cuadro Controlador', color: 'var(--color-actitud)', locked: !course },
                    { id: 'libreria-todas', icon: 'library', label: 'Pizarra 360', color: '#f43f5e', locked: false },
                    { id: 'panel', icon: 'layout-dashboard', label: 'Centro de Control', color: '#0369a1', locked: !course },
                    { id: 'notas-rapidas', icon: 'notebook-pen', label: 'Bloc de Notas', color: '#facc15', locked: false }
                ]
            },
            {
                label: 'GESTIÓN ACADÉMICA',
                items: [
                    { id: 'cursos', icon: 'book-open', label: 'Mis Cursos', color: 'var(--text-muted)', locked: false },
                    { id: 'estudiantes', icon: 'users', label: 'Control de Matrícula', color: 'var(--color-actitud)', locked: false },
                    { id: 'horario', icon: 'clock-3', label: 'Horario', color: '#ec4899', locked: false },
                    { id: 'equipos-trabajo', icon: 'users-2', label: 'Equipos de Trabajo', color: '#f59e0b', locked: false },
                    { id: 'config', icon: 'sliders-horizontal', label: 'Ajustes', color: 'var(--text-muted)', locked: false }
                ]
            },
            {
                label: 'EVALUACIÓN Y SEGUIMIENTO',
                items: [
                    { id: 'evaluacion', icon: 'clipboard-check', label: 'Dimensiones de Evaluación', color: 'var(--color-examen)', locked: !course },
                    { id: 'bitacora', icon: 'file-text', label: 'Bitácora', color: '#f97316', locked: false },
                    { id: 'banco-rubricas', icon: 'folder-check', label: 'Rúbricas', color: '#0ea5e9', locked: false }
                ]
            },
            {
                label: 'ANÁLISIS Y CONTROL',
                items: [
                    { id: 'sart', icon: 'triangle-alert', label: 'Alertas (SART)', color: 'var(--color-alerta)', locked: !course },
                    { id: 'reportes', icon: 'file-bar-chart', label: 'Reportes', color: 'var(--color-extra)', locked: !course },
                    { id: 'parte-mensual', icon: 'file-calendar', label: 'Parte Mensual', color: '#6366f1', locked: !course },
                    { id: 'respaldo', icon: 'database-backup', label: 'Respaldo', color: 'var(--text-muted)', locked: false }
                ]
            },
            {
                label: 'PRUEBAS Y CALIFICACIÓN OFICIAL',
                items: [
                    { id: 'pruebas-diagnosticas', icon: 'search-check', label: 'Diagnósticas', color: '#8B5CF6', locked: false },
                    { id: 'pruebas-formativas', icon: 'activity', label: 'Formativas', color: '#0EA5E9', locked: false },
                    { id: 'cuadro1', icon: 'sheet', label: 'Cuadro #1', color: '#059669', locked: !course },
                    { id: 'sace', icon: 'file-spreadsheet', label: 'Módulo SACE', color: '#10B981', locked: !course }
                ]
            }
        ];
            /* --- MODULOS EN PAUSA O HEREDADOS (Mantenidos por seguridad de rutas e IDs) ---
            ,{
                label: 'Biblioteca y Recursos',
                items: [
                    { id: 'libreria-todas', icon: 'library', label: 'Pizarra 360', color: '#f43f5e', locked: false },
                    { id: 'rid', icon: 'briefcase', label: 'Repositorio Institucional', color: '#6366f1', locked: false },
                    { id: 'archivos', icon: 'folder-open', label: 'Centro de Recursos', color: '#0f172a', locked: false },
                    { id: 'planificador', icon: 'flask-conical', label: 'Teacher Lab', color: '#00C853', locked: !course },
                    { id: 'jornalizacion', icon: 'calendar', label: 'Jornalización', color: '#0ea5e9', locked: !course },
                    { id: 'planificacion', icon: 'layout-list', label: 'Planificación', color: '#f59e0b', locked: !course },
                    { id: 'banco-curricular', icon: 'database', label: 'Banco Curricular', color: '#7c3aed', locked: false }
                ]
            }
            */

        let html = '';

        groups.forEach((g, gIndex) => {
            html += `<div class="nav-group-label">${g.label}</div>`;

            g.items.forEach(i => {
                const isLibreriaRoute = Router.current.startsWith('libreria-') && i.id === 'libreria-todas';
                const isSubActive = i.subItems ? i.subItems.some(sub => Router.current === sub.id) || Router.current === i.id : false;
                const isActive = Router.current === i.id || isLibreriaRoute || isSubActive;

                const iconHtml = i.imgIcon
                    ? `<img src="${i.imgIcon}" class="icon" style="width:18px;height:18px;border-radius:4px;object-fit:cover; filter: ${isActive ? 'none' : 'grayscale(100%) opacity(0.8)'};">`
                    : `<i data-lucide="${i.icon}" class="icon" style="color: ${isActive ? 'var(--primary)' : i.color}"></i>`;

                if (i.subItems) {
                    html += `
                            <div class="sidebar-submenu-wrapper w-full relative">
                                <button onclick="this.nextElementSibling.classList.toggle('hidden');" 
                                    data-tooltip="${i.label}"
                                    class="gdhn-nav-item ${isActive ? 'active' : ''} ${i.locked ? 'disabled' : ''} flex justify-between items-center w-full">
                                    <div class="flex items-center gap-[10px]">
                                        ${iconHtml}
                                        <span class="label">${i.label}</span>
                                    </div>
                                    <i data-lucide="chevron-down" class="w-4 h-4 opacity-50" style="margin-left:auto;"></i>
                                </button>
                                <div class="pl-[38px] pt-1 pb-1 flex flex-col gap-1 ${isActive ? '' : 'hidden'}">
                                     ${i.subItems.map(sub => {
                        const subActive = Router.current === sub.id;
                        return `
                                        <button onclick="window.autoCloseSidebar(); Router.navigate('${sub.id}')" 
                                            class="gdhn-nav-item flex items-center gap-2 py-1.5 px-3 rounded-md !text-xs w-full transition-colors ${subActive ? 'active bg-teal-500/10 !text-teal-400 font-bold' : 'hover:bg-white/5'}">
                                            <div class="w-1.5 h-1.5 rounded-full ${subActive ? 'bg-teal-400' : 'bg-white/20'}"></div>
                                            ${sub.label}
                                        </button>`;
                    }).join('')}
                                </div>
                            </div>
                            `;
                } else {
                    html += `
                            <button onclick="window.autoCloseSidebar(); Router.navigate('${i.id}')" 
                                data-route="${i.id}"
                                data-tooltip="${i.label}"
                                class="gdhn-nav-item ${isActive ? 'active' : ''} ${i.locked ? 'disabled' : ''}">
                                ${iconHtml}
                                <span class="label">${i.label}</span>
                            </button>
                            `;
                }
            });
        });

        menu.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Initialize sidebar global state safely
        setTimeout(() => {
            const sb = document.getElementById('sidebar');
            const st = localStorage.getItem('gdhn_sidebarState');
            if (window.innerWidth > 1024) {
                if (st === 'collapsed') sb.classList.add('collapsed');
                else sb.classList.remove('collapsed');
                sb.classList.remove('open');
            }
        }, 10);
    },
    updateHeader() {
        const c = Store.getActiveCourse();
        const btn = document.getElementById('active-course-btn');
        if (c) {
            const centroLabel = c.centroEducativo ? ` - ${c.centroEducativo}` : '';
            btn.textContent = `${c.asignatura} (${c.grado} ${c.seccion}º)${centroLabel}`;
            btn.title = `${c.asignatura} (${c.grado} ${c.seccion}º) - ${c.centroEducativo || 'Sin Centro'}`;
            btn.style.borderColor = 'var(--primary)';
            btn.style.background = 'rgba(56, 189, 248, 0.15)';
            btn.style.whiteSpace = 'nowrap';
            btn.style.overflow = 'hidden';
            btn.style.textOverflow = 'ellipsis';
            btn.style.display = 'block';
            btn.style.maxWidth = '250px';
        } else {
            btn.textContent = 'Seleccionar Curso';
            btn.title = 'Seleccionar Curso Activo';
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-muted)';
            btn.style.maxWidth = 'none';
        }
    }
};

// Global functions for inline handlers
window.closeModal = UI.closeModal;

window.autoCloseSidebar = () => {
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    
    // Si estamos en movil, cerramos el menu removiendo "open"
    if (window.innerWidth <= 1024) {
        sb.classList.remove('open');
    }
};

window.toggleSidebar = () => {
    const sb = document.getElementById('sidebar');
    if (!sb) return;

    if (window.innerWidth <= 1024) {
        sb.classList.toggle('open');
    } else {
        sb.classList.toggle('collapsed');
        localStorage.setItem('gdhn_sidebarState', sb.classList.contains('collapsed') ? 'collapsed' : 'open');
    }
};

// Cerrar menu al hacer clic fuera (en movil) y ocultar menu flotante de navegación
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        const sb = document.getElementById('sidebar');
        const toggle = document.querySelector('.mobile-toggle');
        if (sb && sb.classList.contains('open') && !sb.contains(e.target) && !toggle.contains(e.target)) {
            sb.classList.remove('open');
        }
    }
    const fabMenu = document.getElementById('fab-nav-menu');
    const fabTrigger = document.getElementById('fab-nav-trigger');
    if (fabMenu && fabMenu.classList.contains('show') && !fabMenu.contains(e.target) && (!fabTrigger || !fabTrigger.contains(e.target))) {
        fabMenu.classList.remove('show');
    }
});

window.openCourseSelector = (route = null) => Views.Cursos.showSelector(route || Router.current || 'panel');

// --- 4a. MATRICULA SECURITY & VALIDATION LAYER ---
const MatriculaSecurity = {
    normalizarNombre(nombre) {
        if (!nombre) return '';
        return nombre.trim()
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents/diacritics
    },

    isSameStudent(s1, s2) {
        if (!s1 || !s2) return false;
        
        // Priority identifiers
        const keys = ['codigo_estudiante', 'codigo_sace', 'dni', 'identidad'];
        for (const key of keys) {
            const val1 = (s1[key] || '').toString().replace(/[^0-9a-zA-Z]/g, '').trim();
            const val2 = (s2[key] || '').toString().replace(/[^0-9a-zA-Z]/g, '').trim();
            if (val1 && val2 && val1 === val2) {
                return true;
            }
        }
        
        // Fallback: compare normalized full name
        const n1 = this.normalizarNombre(s1.nombreCompleto);
        const n2 = this.normalizarNombre(s2.nombreCompleto);
        return n1 && n2 && n1 === n2;
    },

    // Check if student is already matriculated in any course of the same academic group
    getGroupEnrollment(student, courseId) {
        const course = Store.get('cursos').find(c => c.id === courseId);
        if (!course) return null;

        const parallelIds = [courseId, ...Logic.getParallelCourses(courseId)];
        const matriculas = Store.get('matriculas');
        const estudiantes = Store.get('estudiantes');

        for (const m of matriculas) {
            if (parallelIds.includes(m.cursoId)) {
                const ext = estudiantes.find(e => e.id === m.estudianteId);
                if (ext && this.isSameStudent(student, ext)) {
                    return { student: ext, enrollment: m };
                }
            }
        }
        return null;
    },

    // Global Interactive Duplicate Repair Engine
    repararDuplicadosMatricula(dryRun = false) {
        const estudiantes = Store.get('estudiantes');
        if (estudiantes.length === 0) return { totalReviewed: 0, groupsFound: 0, mergedCount: 0, details: [] };

        // Group students
        const groups = {};
        (estudiantes || []).forEach(s => {
            let groupKey = '';
            const keys = ['codigo_estudiante', 'codigo_sace', 'dni', 'identidad'];
            for (const key of keys) {
                const val = (s[key] || '').toString().replace(/[^0-9a-zA-Z]/g, '').trim().toLowerCase();
                if (val) {
                    groupKey = `id_${key}_${val}`;
                    break;
                }
            }
            if (!groupKey) {
                groupKey = `name_${this.normalizarNombre(s.nombreCompleto)}`;
            }

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(s);
        });

        let totalReviewed = estudiantes.length;
        let groupsFound = 0;
        let mergedCount = 0;
        const details = [];

        for (const key in groups) {
            const list = groups[key];
            if (list.length <= 1) continue;

            groupsFound++;
            
            let principal = list[0];
            let maxScore = -1;

            list.forEach(st => {
                let score = 0;
                if (st.identidad) score += 10;
                if (st.telefono) score += 5;
                if (st.domicilio) score += 5;
                if (st.datosPadre) score += 5;
                if (st.fechaNacimiento) score += 5;
                if (st.fotoDataUrl) score += 10;

                const nMats = Store.get('matriculas').filter(m => m.estudianteId === st.id).length;
                const nAsis = Store.get('asistencia').filter(a => a.estudianteId === st.id).length;
                const nCal = Store.get('calificaciones').filter(c => c.estudianteId === st.id).length;
                score += (nMats * 2) + nAsis + nCal;

                if (score > maxScore) {
                    maxScore = score;
                    principal = st;
                }
            });

            const duplicates = list.filter(st => st.id !== principal.id);
            const duplicateNames = duplicates.map(st => st.nombreCompleto).join(', ');

            details.push({
                principalName: principal.nombreCompleto,
                principalId: principal.id,
                duplicateCount: duplicates.length,
                duplicateNames: duplicateNames
            });

            if (!dryRun) {
                duplicates.forEach(secondary => {
                    mergedCount++;

                    // 1. Merge Matriculas: keep one per courseId.
                    const principalMats = Store.get('matriculas').filter(m => m.estudianteId === principal.id);
                    const secondaryMats = Store.get('matriculas').filter(m => m.estudianteId === secondary.id);

                    secondaryMats.forEach(secMat => {
                        const existsInPrincipal = principalMats.some(priMat => priMat.cursoId === secMat.cursoId);
                        if (!existsInPrincipal) {
                            Store.update('matriculas', secMat.id, { estudianteId: principal.id });
                        } else {
                            Store.delete('matriculas', secMat.id);
                        }
                    });

                    // 2. Merge Asistencias: keep one per courseId + fecha. If collision, keep active 'P' or 'T' over 'A' or 'F' (Falta).
                    const principalAsis = Store.get('asistencia').filter(a => a.estudianteId === principal.id);
                    const secondaryAsis = Store.get('asistencia').filter(a => a.estudianteId === secondary.id);

                    secondaryAsis.forEach(secAsis => {
                        const collision = principalAsis.find(priAsis => 
                            priAsis.cursoId === secAsis.cursoId && priAsis.fecha === secAsis.fecha
                        );
                        if (!collision) {
                            Store.update('asistencia', secAsis.id, { estudianteId: principal.id });
                        } else {
                            const priority = { 'P': 4, 'T': 3, 'J': 2, 'A': 1 };
                            const scoreSec = priority[secAsis.estado] || 0;
                            const scorePri = priority[collision.estado] || 0;

                            if (scoreSec > scorePri) {
                                Store.update('asistencia', collision.id, { 
                                    estado: secAsis.estado,
                                    tardanza: secAsis.tardanza
                                });
                            }
                            Store.delete('asistencia', secAsis.id);
                        }
                    });

                    // 3. Merge Calificaciones: keep one per cursoId + actividadId. Keep highest score in case of collision.
                    const principalCal = Store.get('calificaciones').filter(c => c.estudianteId === principal.id);
                    const secondaryCal = Store.get('calificaciones').filter(c => c.estudianteId === secondary.id);

                    secondaryCal.forEach(secCal => {
                        const collision = principalCal.find(priCal => 
                            priCal.cursoId === secCal.cursoId && priCal.actividadId === secCal.actividadId
                        );
                        if (!collision) {
                            Store.update('calificaciones', secCal.id, { estudianteId: principal.id });
                        } else {
                            const pScore = Number(collision.puntajeObtenido || 0);
                            const sScore = Number(secCal.puntajeObtenido || 0);
                            if (sScore > pScore) {
                                Store.update('calificaciones', collision.id, {
                                    puntajeObtenido: secCal.puntajeObtenido,
                                    porcentajeObtenido: secCal.porcentajeObtenido
                                });
                            }
                            Store.delete('calificaciones', secCal.id);
                        }
                    });

                    // 4. Merge other relational collections
                    const collectionsToUpdate = ['bitacora', 'sartAlertas', 'sart', 'notasRapidas'];
                    collectionsToUpdate.forEach(coll => {
                        const items = Store.get(coll);
                        if (Array.isArray(items)) {
                            items.forEach(item => {
                                if (item.estudianteId === secondary.id) {
                                    Store.update(coll, item.id, { estudianteId: principal.id });
                                }
                            });
                        }
                    });

                    // 5. Delete duplicate student record
                    Store.delete('estudiantes', secondary.id);
                });
            } else {
                mergedCount += duplicates.length;
            }
        }

        if (!dryRun && mergedCount > 0) {
            Store.save();
        }

        return { totalReviewed, groupsFound, mergedCount, details };
    }
};

// --- 4. LOGIC ENGINE ---
const Logic = {
    isConfigValid() {
        if (!Store.data.configAcademica) return false;
        const total = Store.data.configAcademica.dimensions.reduce((s, d) => s + Number(d.porcentaje), 0);
        return total === 100;
    },
    fixConfig() {
        Store.data.configAcademica.dimensions = JSON.parse(JSON.stringify(CONFIG.dimensions));
        Store.save();
        UI.toast('Configuración restaurada a valores estándar', 'success');
        Router.navigate('config');
    },
    calculateGrade(studentId, courseId) {
        // Calculate final grade based on dimensions
        const acts = (Store.data.actividades || []).filter(a => a.cursoId === courseId);
        const scores = (Store.data.calificaciones || []).filter(c => c.estudianteId === studentId && c.cursoId === courseId);

        let finalScore = 0;

        const dims = Store.data.configAcademica?.dimensions || CONFIG.dimensions;
        dims.forEach(dim => {
            const dimActs = acts.filter(a => a.dimensionKey === dim.key);
            if (dimActs.length === 0) return;

            // Simple average of percentages or Sum of points?
            // User said: "Subtotal por dimensión (promedio o suma ponderada según porcentaje)".
            // Strategy: Sum points obtained in dimension / Sum max points in dimension * Dimension Percentage

            let totalObtained = 0;
            let totalMax = 0;

            dimActs.forEach(act => {
                const score = scores.find(s => s.actividadId === act.id);
                totalMax += Number(act.puntajeMax);
                if (score) totalObtained += Number(score.puntajeObtenido);
            });

            if (totalMax > 0) {
                const dimScore = (totalObtained / totalMax) * dim.porcentaje;
                finalScore += dimScore;
            }
        });

        return Math.round(finalScore);
    },
    getPerformance(score) {
        if (score >= 91) return { label: 'Excelente', color: 'success' };
        if (score >= 81) return { label: 'Avanzado', color: 'primary' };
        if (score >= 70) return { label: 'Básico', color: 'warning' };
        return { label: 'Inicial', color: 'danger' };
    },
    getParallelCourses(courseId) {
        const source = Store.get('cursos').find(c => c.id === courseId);
        if (!source) return [];

        const normalize = s => (s || '').trim().toLowerCase();
        const sourceCentro = normalize(source.centroEducativo);

        return Store.get('cursos').filter(c => 
            c.id !== courseId &&
            c.grado === source.grado &&
            normalize(c.seccion) === normalize(source.seccion) &&
            normalize(c.jornadaP) === normalize(source.jornadaP) &&
            String(c.anio || '') === String(source.anio || '') &&
            sourceCentro !== '' &&
            normalize(c.centroEducativo) !== '' &&
            normalize(c.centroEducativo) === sourceCentro
        ).map(c => c.id);
    },
    syncAttendance(studentId, date, newState, sourceCourseId, tardanzaData = null, skipSave = false) {
        const parallelIds = this.getParallelCourses(sourceCourseId);
        parallelIds.forEach(targetCourseId => {
            const collection = Store.get('asistencia');
            const existing = collection.find(a => a.cursoId === targetCourseId && a.fecha === date && a.estudianteId === studentId);
            
            if (existing) {
                if (!newState) {
                    Store.delete('asistencia', existing.id, skipSave);
                } else {
                    existing.estado = newState;
                    if (newState === 'T' && tardanzaData) existing.tardanza = tardanzaData;
                    else delete existing.tardanza;
                    if (!skipSave) Store.save();
                }
            } else if (newState) {
                // Solo sincronizar si el alumno está matriculado en el curso paralelo
                const enrollment = Store.get('matriculas').find(m => m.cursoId === targetCourseId && m.estudianteId === studentId);
                if (enrollment) {
                    Store.add('asistencia', {
                        cursoId: targetCourseId,
                        estudianteId: studentId,
                        fecha: date,
                        estado: newState,
                        tardanza: tardanzaData
                    }, skipSave);
                }
            }
        });
    },
    syncEnrollment(studentId, sourceCourseId, action = 'enroll') {
        const parallelIds = this.getParallelCourses(sourceCourseId);
        parallelIds.forEach(targetCourseId => {
            const collection = Store.get('matriculas');
            const existing = collection.find(m => m.cursoId === targetCourseId && m.estudianteId === studentId);
            
            if (action === 'enroll' && !existing) {
                Store.add('matriculas', { cursoId: targetCourseId, estudianteId: studentId });
            } else if (action === 'unenroll' && existing) {
                Store.delete('matriculas', existing.id);
            }
        });
    },
    calculateAge(birthDate) {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    },
    getEnrollmentSummary(courseId) {
        const students = Store.getStudentsByCourse(courseId);
        const manual = (Store.data.resumenMatriculaManual && Store.data.resumenMatriculaManual[courseId]) || {};
        const summary = {};
        
        if (!Store.data.configEdades) Store.data.configEdades = { min: 6, max: 16 };
        const minAge = parseInt(Store.data.configEdades.min) || 6;
        const maxAge = parseInt(Store.data.configEdades.max) || 16;
        
        const ages = [];
        for (let i = minAge; i <= maxAge; i++) {
            ages.push(i === maxAge ? i + '+' : i);
        }
        
        ages.forEach(ageKey => {
            summary[ageKey] = { F: 0, M: 0, T: 0 };
            
            if (manual[ageKey]) {
                summary[ageKey].F = manual[ageKey].F !== undefined ? Number(manual[ageKey].F) : 0;
                summary[ageKey].M = manual[ageKey].M !== undefined ? Number(manual[ageKey].M) : 0;
            } else {
                students.forEach(s => {
                    if (s.estadoMatricula === 'Desertor' || s.estadoMatricula === 'Traslado') return;
                    let sAge = this.calculateAge(s.fechaNacimiento);
                    if (sAge === null) return;
                    
                    const gender = s.genero === 'F' ? 'F' : 'M';
                    
                    if (ageKey === String(maxAge) + '+') {
                        if (sAge >= maxAge) summary[ageKey][gender]++;
                    } else if (sAge === Number(ageKey)) {
                        summary[ageKey][gender]++;
                    } else if (ageKey === minAge && sAge < minAge) {
                        summary[ageKey][gender]++;
                    }
                });
            }
            summary[ageKey].T = summary[ageKey].F + summary[ageKey].M;
        });
        
        return summary;
    }
};

// --- 4.5. TEACHER INTELLIGENCE LAYER ---
const Aula360Intelligence = {
    analyzeCourse(courseId) {
        if (!courseId) return null;
        
        const suggestions = [];
        const priorities = [];
        let score = 100;
        
        const students = Store.getStudentsByCourse(courseId);
        
        if (students.length === 0) {
            suggestions.push({ type: 'warning', text: 'No hay estudiantes matriculados en este curso.', icon: 'users' });
            priorities.push('Matricular estudiantes');
            return { suggestions, priorities, healthScore: 0 };
        }

        // 1. Asistencia
        const records = Store.get('asistencia') || [];
        const courseRecords = records.filter(a => a.cursoId === courseId);
        const dateObj = new Date();
        const todayStr = dateObj.getFullYear() + '-' + String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
        
        const todayRecords = courseRecords.filter(r => r.fecha === todayStr);
        if (todayRecords.length === 0) {
            suggestions.push({ type: 'info', text: 'No has tomado la asistencia de hoy.', icon: 'clipboard-list' });
            priorities.push('Registrar asistencia del día');
            score -= 10;
        } else {
            const absentToday = todayRecords.filter(r => r.estado === 'A').length;
            if (absentToday > 2) {
                suggestions.push({ type: 'warning', text: `Tienes ${absentToday} alumnos con inasistencia registrada hoy.`, icon: 'user-minus' });
                score -= (absentToday * 2);
            }
        }
        
        // 2. Evaluación
        const evals = Store.get('evaluaciones') || [];
        const courseEvals = evals.filter(e => e.cursoId === courseId);
        if (courseEvals.length === 0) {
            suggestions.push({ type: 'info', text: 'Aún no has configurado evaluaciones para este bloque.', icon: 'clipboard-check' });
            if (priorities.length < 2) priorities.push('Crear perfil de evaluación');
        }
        
        // 3. SART Alertas
        const sart = Store.get('sart') || [];
        const activeAlerts = sart.filter(s => s.cursoId === courseId && s.estado !== 'Resuelta');
        if (activeAlerts.length > 0) {
            suggestions.push({ type: 'alert', text: `Existen ${activeAlerts.length} alertas preventivas (SART) abiertas.`, icon: 'triangle-alert' });
            priorities.unshift('Revisar módulo SART');
            score -= (activeAlerts.length * 5);
        }
        
        return {
            suggestions: suggestions.slice(0, 3) || [],
            priorities: priorities.slice(0, 2) || [],
            healthScore: Math.max(0, score)
        };
    },
    
    renderBanner(courseId) {
        const intel = this.analyzeCourse(courseId);
        if (!intel || intel.suggestions.length === 0) return '';
        
        return `
            <div style="margin-bottom: 24px; padding: 12px 16px; border-radius: var(--radius-sm); border-left: 3px solid var(--primary); background: linear-gradient(to right, rgba(0, 200, 83, 0.04), transparent); border-top: 1px solid var(--border-soft); border-right: 1px solid var(--border-soft); border-bottom: 1px solid var(--border-soft); display: flex; align-items: start; gap: 12px;">
                <div style="color: var(--primary); flex-shrink: 0; padding-top: 2px;">
                    <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i>
                </div>
                <div style="flex: 1; display:flex; flex-direction:column; gap:4px; min-width:0;">
                    <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">Recomendaciones Automáticas</div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${intel.suggestions.map(s => {
                            let color = '#6B7280';
                            if (s.type === 'alert') color = '#EF4444';
                            if (s.type === 'warning') color = '#F59E0B';
                            if (s.type === 'info') color = '#3B82F6';
                            return `
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-soft);">
                                    <i data-lucide="${s.icon || 'arrow-right'}" style="width: 12px; height: 12px; color: ${color};"></i>
                                    <span>${s.text}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ${intel.priorities.length > 0 ? `
                <div style="padding-left: 12px; border-left: 1px solid var(--border-soft); min-width: 130px; flex-shrink:0;">
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 800; margin-bottom: 4px;">Prioridad</div>
                    <div style="display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--text-main); font-weight: 600;">
                        ${intel.priorities.map(p => `<div><i data-lucide="chevron-right" style="width:10px; height:10px; color:var(--text-muted)"></i> ${p}</div>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
};

