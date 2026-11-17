// --- 3. UI KERNEL ---
const UI = {
    playSound(type = 'success') {
        if (typeof document !== 'undefined' && document.hidden) return;
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
            // Liberar hardware de audio inmediatamente después del tono para evitar WakeLock de batería en tablets/móviles
            setTimeout(() => {
                try {
                    if (ctx && ctx.state !== 'closed' && typeof ctx.close === 'function') {
                        ctx.close();
                    }
                } catch (e) {}
            }, 650);
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
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
    },
    _currentShareData: null,
    async shareData(options) {
        options = options || {};

        // En dispositivos móviles (Android / iOS / Capacitor), usar la hoja nativa del celular
        const isMobile = this.isMobileDevice();
        if (isMobile && !options.forceModal) {
            try {
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share) {
                    const canShare = await window.Capacitor.Plugins.Share.canShare();
                    if (canShare.value) {
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
                
                // En navegador móvil web
                if (navigator.share && navigator.canShare) {
                    let shareOpts = { title: options.title, text: options.text, url: options.url };
                    if (options.blob && options.fileName) {
                        const file = new File([options.blob], options.fileName, { type: options.blob.type || 'application/pdf', lastModified: Date.now() });
                        if (navigator.canShare({ files: [file] })) {
                            shareOpts.files = [file];
                        }
                    }
                    await navigator.share(shareOpts);
                    return true;
                }
            } catch (e) {
                console.error('Mobile Share Error:', e);
                if (e.name === 'AbortError' || e.message === 'Share canceled') {
                    return false;
                }
                // Si falla en móvil, abrir modal de la app
                return this.showShareModal(options);
            }
        }

        // En PC / Escritorio (Windows / Mac / Web desktop):
        // Mostrar el modal elegante, moderno y propio de la aplicación en lugar del diálogo tosco del sistema
        return this.showShareModal(options);
    },
    showShareModal(options) {
        options = options || {};
        this._currentShareData = options;

        const title = options.title || 'Compartir';
        const fileName = options.fileName || (options.blob ? 'documento.pdf' : '');
        const isPdf = Boolean(fileName.toLowerCase().endsWith('.pdf') || (options.blob && options.blob.type && options.blob.type.includes('pdf')));

        let sizeText = '';
        if (options.blob && options.blob.size) {
            const bytes = options.blob.size;
            if (bytes < 1024) sizeText = bytes + ' B';
            else if (bytes < 1048576) sizeText = (bytes / 1024).toFixed(1) + ' KB';
            else sizeText = (bytes / 1048576).toFixed(1) + ' MB';
        }

        const hasBlob = Boolean(options.blob);
        const hasText = Boolean(options.text || options.url);
        const canNativeShare = Boolean(navigator.share);

        const modalHtml = `
            <div class="modern-share-modal" style="display:flex; flex-direction:column; gap:14px; font-family:inherit;">
                <!-- Tarjeta del archivo / elemento -->
                ${fileName ? `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:12px 14px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                    <div style="width:42px; height:42px; border-radius:12px; background:${isPdf ? '#fee2e2' : '#e0f2fe'}; color:${isPdf ? '#ef4444' : '#0284c7'}; display:grid; place-items:center; flex-shrink:0;">
                        <i data-lucide="${isPdf ? 'file-text' : 'file'}" style="width:22px; height:22px;"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:13px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${fileName}">
                            ${fileName}
                        </div>
                        <div style="font-size:11.5px; color:#64748b; font-weight:600; display:flex; align-items:center; gap:6px; margin-top:2px;">
                            ${sizeText ? `<span>${sizeText}</span><span>&bull;</span>` : ''}
                            <span style="color:#16a34a; font-weight:700;">Documento listo</span>
                        </div>
                    </div>
                </div>
                ` : `
                <div style="font-size:12.5px; color:#64748b; line-height:1.4;">
                    Selecciona cómo deseas compartir o exportar este contenido:
                </div>
                `}

                <!-- Acciones Principales -->
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${hasBlob && canNativeShare ? `
                    <!-- Opción 1: Enviar el archivo PDF REAL directo a WhatsApp usando la integración de Windows -->
                    <button type="button" onclick="UI.triggerNativeShare()" style="background:linear-gradient(135deg, #15803d, #22c55e); color:#ffffff; border:none; border-radius:12px; padding:12px 16px; display:flex; align-items:center; gap:14px; cursor:pointer; text-align:left; box-shadow:0 3px 10px rgba(34,197,94,0.3); transition:all 0.15s;" onmouseover="this.style.boxShadow='0 6px 16px rgba(34,197,94,0.45)'" onmouseout="this.style.boxShadow='0 3px 10px rgba(34,197,94,0.3)'">
                        <div style="width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.22); display:grid; place-items:center; flex-shrink:0;">
                            <svg style="width:20px; height:20px; fill:currentColor;" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.174.232-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.394-10.416c-5.521 0-10 4.478-10 10 0 1.772.463 3.437 1.271 4.886l-1.35 4.93 5.048-1.324c1.405.768 3.011 1.208 4.717 1.208 5.522 0 10-4.478 10-10 0-5.521-4.478-10-9.686-10z"/></svg>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13.5px; font-weight:800; line-height:1.2; display:flex; align-items:center; gap:6px;">
                                <span>Enviar Archivo PDF a WhatsApp (Directo)</span>
                                <span style="font-size:10px; font-weight:700; background:rgba(255,255,255,0.25); padding:1px 6px; border-radius:6px;">Adjunto Real</span>
                            </div>
                            <div style="font-size:11px; opacity:0.92; font-weight:500; margin-top:2px;">Transfiere el archivo PDF real y completo directamente a WhatsApp</div>
                        </div>
                    </button>
                    ` : ''}

                    ${hasBlob ? `
                    <!-- Opción 2: Descargar archivo localmente -->
                    <button type="button" onclick="UI.downloadSharedFile()" style="background:linear-gradient(135deg, #1e40af, #2563eb); color:#ffffff; border:none; border-radius:12px; padding:12px 16px; display:flex; align-items:center; gap:14px; cursor:pointer; text-align:left; box-shadow:0 3px 10px rgba(37,99,235,0.25); transition:all 0.15s;" onmouseover="this.style.boxShadow='0 6px 16px rgba(37,99,235,0.35)'" onmouseout="this.style.boxShadow='0 3px 10px rgba(37,99,235,0.25)'">
                        <div style="width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.2); display:grid; place-items:center; flex-shrink:0;">
                            <i data-lucide="download" style="width:20px; height:20px;"></i>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13.5px; font-weight:800; line-height:1.2;">Descargar Archivo en PC</div>
                            <div style="font-size:11px; opacity:0.9; font-weight:500; margin-top:2px;">Guarda el PDF en Descargas para adjuntarlo con el clip 📎 o imprimirlo</div>
                        </div>
                    </button>
                    ` : ''}

                    <!-- Opción 3: Abrir app de WhatsApp para enviar texto -->
                    <button type="button" onclick="UI.shareViaWhatsApp('app')" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#0f172a; border-radius:12px; padding:10px 16px; display:flex; align-items:center; gap:14px; cursor:pointer; text-align:left; transition:all 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                        <div style="width:36px; height:36px; border-radius:10px; background:#dcfce7; color:#16a34a; display:grid; place-items:center; flex-shrink:0;">
                            <svg style="width:19px; height:19px; fill:currentColor;" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.044c.101-.116.433-.506.549-.68.116-.174.232-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.394-10.416c-5.521 0-10 4.478-10 10 0 1.772.463 3.437 1.271 4.886l-1.35 4.93 5.048-1.324c1.405.768 3.011 1.208 4.717 1.208 5.522 0 10-4.478 10-10 0-5.521-4.478-10-9.686-10z"/></svg>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13px; font-weight:800; line-height:1.2;">Abrir Chat de WhatsApp (con texto)</div>
                            <div style="font-size:11px; color:#64748b; font-weight:500; margin-top:2px;">Descarga el PDF y abre la app para que lo arrastres al chat</div>
                        </div>
                    </button>

                    ${hasBlob && isPdf ? `
                    <!-- Opción 4: Abrir en pestaña / Vista Previa -->
                    <button type="button" onclick="UI.openSharedBlobTab()" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#0f172a; border-radius:12px; padding:10px 16px; display:flex; align-items:center; gap:14px; cursor:pointer; text-align:left; transition:all 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                        <div style="width:36px; height:36px; border-radius:10px; background:#eff6ff; color:#2563eb; display:grid; place-items:center; flex-shrink:0;">
                            <i data-lucide="external-link" style="width:19px; height:19px;"></i>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13px; font-weight:800; line-height:1.2;">Abrir Vista Previa en Pestaña</div>
                            <div style="font-size:11px; color:#64748b; font-weight:500; margin-top:2px;">Visualiza o imprime directamente en el visor de tu navegador</div>
                        </div>
                    </button>
                    ` : ''}

                    ${hasText ? `
                    <!-- Opción 5: Copiar información al portapapeles -->
                    <button type="button" onclick="UI.copySharedText()" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#0f172a; border-radius:12px; padding:10px 16px; display:flex; align-items:center; gap:14px; cursor:pointer; text-align:left; transition:all 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                        <div style="width:36px; height:36px; border-radius:10px; background:#f1f5f9; color:#475569; display:grid; place-items:center; flex-shrink:0;">
                            <i data-lucide="copy" style="width:19px; height:19px;"></i>
                        </div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:13px; font-weight:800; line-height:1.2;">Copiar Información</div>
                            <div style="font-size:11px; color:#64748b; font-weight:500; margin-top:2px;">Copia el texto al portapapeles para pegarlo donde gustes</div>
                        </div>
                    </button>
                    ` : ''}
                </div>

                ${canNativeShare ? `
                <!-- Fallback discreto a la ventana nativa del sistema si el usuario lo prefiere -->
                <div style="text-align:center; padding-top:6px; border-top:1px dashed #e2e8f0; margin-top:2px;">
                    <button type="button" onclick="UI.triggerNativeShare()" style="background:none; border:none; color:#64748b; font-size:11.5px; font-weight:600; text-decoration:underline; cursor:pointer; display:inline-flex; align-items:center; gap:5px; padding:4px 8px;" title="Abrir la ventana de compartir nativa de Windows">
                        <span>O usar la ventana del sistema operativo Windows</span>
                        <i data-lucide="share" style="width:11px; height:11px;"></i>
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        const footerHtml = `
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal()" style="border-radius:10px; font-weight:700; font-size:13px; padding:8px 20px; width:100%;">
                Cerrar
            </button>
        `;

        this.modal(title, modalHtml, footerHtml, { dialog: true });
        return 'modal_opened';
    },

    downloadSharedFile() {
        if (!this._currentShareData || !this._currentShareData.blob) {
            this.toast('No hay archivo disponible para descargar', 'warning');
            return;
        }
        const { blob, fileName } = this._currentShareData;
        const name = fileName || 'documento.pdf';

        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1500);
            this.toast('Archivo descargado correctamente ✅', 'success');
        } catch (e) {
            console.error('Error al descargar:', e);
            this.toast('Error al descargar archivo', 'error');
        }
    },

    shareViaWhatsApp(target = 'app') {
        if (!this._currentShareData) return;
        const { blob, fileName, text, url } = this._currentShareData;

        let shareMsg = (text || '').trim();
        if (fileName && !shareMsg.includes(fileName)) {
            shareMsg = shareMsg ? `${shareMsg}\n(Documento oficial: ${fileName})` : `(Documento oficial: ${fileName})`;
        }
        if (url && !shareMsg.includes(url)) {
            shareMsg = shareMsg ? `${shareMsg}\n${url}` : url;
        }

        if (blob) {
            // Descarga el archivo para que el usuario lo tenga en Descargas listo para adjuntar
            this.downloadSharedFile();
        }

        if (target === 'app') {
            // Disparar la aplicación de escritorio de WhatsApp instalada en Windows
            const waAppUri = shareMsg 
                ? `whatsapp://send?text=${encodeURIComponent(shareMsg)}` 
                : 'whatsapp://';

            this.toast(blob ? 'PDF descargado. En WhatsApp, adjúntalo con el clip 📎 o arrastra el archivo' : 'Abriendo app de WhatsApp...', 'info');

            const a = document.createElement('a');
            a.href = waAppUri;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                if (a.parentNode) a.parentNode.removeChild(a);
            }, 600);
        } else {
            // Abrir WhatsApp Web en el navegador
            const waWebUrl = shareMsg 
                ? `https://web.whatsapp.com/send?text=${encodeURIComponent(shareMsg)}` 
                : 'https://web.whatsapp.com';

            this.toast(blob ? 'PDF descargado. En WhatsApp Web, adjúntalo con el clip 📎' : 'Abriendo WhatsApp Web...', 'info');
            setTimeout(() => {
                window.open(waWebUrl, '_blank');
            }, 400);
        }
    },

    openSharedBlobTab() {
        if (!this._currentShareData || !this._currentShareData.blob) {
            this.toast('No hay vista previa disponible', 'warning');
            return;
        }
        try {
            const url = URL.createObjectURL(this._currentShareData.blob);
            window.open(url, '_blank');
        } catch (e) {
            console.error('Error abriendo vista previa:', e);
            this.toast('No se pudo abrir la vista previa', 'error');
        }
    },

    copySharedText() {
        if (!this._currentShareData) return;
        const { text, url, fileName } = this._currentShareData;
        const content = [text, url, fileName].filter(Boolean).join('\n');
        if (content) {
            this.copyText(content, 'Información copiada al portapapeles ✅');
        }
    },

    async triggerNativeShare() {
        if (!this._currentShareData || !navigator.share) return;
        const options = this._currentShareData;
        this.closeModal();

        try {
            let shareOpts = { title: options.title, text: options.text, url: options.url };
            if (options.blob && options.fileName) {
                const file = new File([options.blob], options.fileName, { type: options.blob.type || 'application/pdf', lastModified: Date.now() });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    shareOpts.files = [file];
                }
            }
            await navigator.share(shareOpts);
            this.toast('Compartido exitosamente', 'success');
        } catch (e) {
            if (e.name !== 'AbortError' && e.message !== 'Share canceled') {
                console.error('Native share error:', e);
            }
        }
    },
    toast(msg, type = 'success') {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<span>${msg}</span>`;
        document.getElementById('toast-container').appendChild(el);
        setTimeout(() => el.remove(), 3000);
        this.playSound(type);
        if (type === 'success' && typeof Tutor360 !== 'undefined' && typeof Tutor360.react === 'function') {
            Tutor360.react('success', 3000);
        }
    },
    showSpinner() {
        if (typeof Tutor360 !== 'undefined' && typeof Tutor360.setState === 'function') {
            Tutor360.setState('thinking');
        }
        const sp = document.getElementById('gdhn-route-spinner');
        if (!sp) return;
        sp.style.display = 'flex';
        // Force reflow so the CSS transition fires
        void sp.offsetWidth;
        sp.classList.add('visible');
    },
    hideSpinner() {
        if (typeof Tutor360 !== 'undefined' && typeof Tutor360.setState === 'function' && Tutor360.getState() === 'thinking') {
            Tutor360.setState('idle');
        }
        const sp = document.getElementById('gdhn-route-spinner');
        if (!sp) return;
        sp.classList.remove('visible');
        setTimeout(() => { sp.style.display = 'none'; }, 200);
    },
    modal(title, contentHtml, footerHtml = '', options = {}) {
        // Hide virtual keyboard on mobile devices when opening a modal
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        
        // Auto-colapsar menú lateral al abrir cualquier modal para dar máxima amplitud a la pantalla
        const sb = document.getElementById('sidebar');
        if (sb) {
            if (window.innerWidth > 1024) {
                if (!sb.classList.contains('collapsed')) {
                    this._sidebarWasExpandedBeforeModal = true;
                    sb.classList.add('collapsed');
                }
            } else {
                sb.classList.remove('open');
            }
        }

        const overlay = document.getElementById('modal-overlay');
        
        // REQUERIMIENTO: TODOS los modales cubren toda la pantalla (100% Pantalla Completa)
        // para visualizar todos los elementos cómodamente sin cajas recortadas ni barras de scroll internas estrechas.
        // Solo diálogos pequeños de confirmación específicos (UI.confirm) usan dialog: true.
        const isDialog = Boolean(
            (options && options.dialog) ||
            (options && options.fullscreen === false) ||
            (typeof footerHtml === 'object' && footerHtml && footerHtml.dialog) ||
            (typeof contentHtml === 'string' && contentHtml.includes('modal-dialog-confirm'))
        );
        const isFullscreen = !isDialog;

        const actualFooter = (typeof footerHtml === 'string') ? footerHtml : (options.footer || '');
        const hasHeader = Boolean(title && String(title).trim() && String(title).trim() !== 'null' && String(title).trim() !== 'undefined');

        if (isFullscreen) {
            overlay.classList.add('modal-overlay-fullscreen');
            overlay.classList.remove('modal-overlay-dialog');
            overlay.style.cssText = 'position:fixed !important; inset:0 !important; top:0 !important; left:0 !important; right:0 !important; bottom:0 !important; width:100% !important; height:100% !important; height:100dvh !important; padding:0 !important; margin:0 !important; background:#f8fafc !important; z-index:10001 !important; display:flex !important; flex-direction:column !important; align-items:stretch !important; justify-content:stretch !important; overflow:hidden !important; overflow-x:hidden !important;';
            
            const isFullBleedContent = typeof contentHtml === 'string' && (contentHtml.includes('data-fullscreen="true"') || contentHtml.includes('-fullscreen'));
            const isMobileScreen = window.innerWidth <= 768;
            const bodyPadding = isFullBleedContent ? '0 !important' : (isMobileScreen ? '10px 8px 30px 8px !important' : '20px 24px 80px 24px !important');

            overlay.innerHTML = `
                <div class="modal modal-fullscreen" style="position:fixed !important; inset:0 !important; top:0 !important; left:0 !important; width:100% !important; max-width:100% !important; min-width:100% !important; height:100% !important; height:100dvh !important; max-height:100% !important; max-height:100dvh !important; min-height:0 !important; margin:0 !important; padding:0 !important; border-radius:0 !important; border:none !important; box-shadow:none !important; background:#f8fafc !important; z-index:10002 !important; display:flex !important; flex-direction:column !important; overflow-x:hidden !important;">
                    ${hasHeader ? `
                    <div class="modal-header" style="padding:${isMobileScreen ? '10px 14px' : '14px 28px'} !important; background:#ffffff !important; border-bottom:1.5px solid #e2e8f0 !important; display:flex !important; align-items:center !important; justify-content:space-between !important; flex-shrink:0 !important; box-shadow:0 1px 4px rgba(0,0,0,0.04) !important; width:100% !important; box-sizing:border-box !important; overflow-x:hidden !important;">
                        <div class="text-xl font-bold" style="font-size:${isMobileScreen ? '15px' : '18px'} !important; font-weight:900 !important; color:#0f172a !important; display:flex !important; align-items:center !important; gap:8px !important; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${title}</div>
                        <button class="modal-close" onclick="UI.closeModal()" title="Cerrar (Esc)">✕</button>
                    </div>
                    ` : ''}
                    <div class="modal-body modal-body-fullscreen" style="flex:1 1 auto !important; min-height:0 !important; height:auto !important; max-height:100% !important; width:100% !important; max-width:100% !important; padding:${bodyPadding}; margin:0 auto !important; overflow-y:auto !important; overflow-x:hidden !important; -webkit-overflow-scrolling:touch !important; box-sizing:border-box !important; background:#f8fafc !important;">
                        <div style="max-width:1280px; margin:0 auto; width:100%; box-sizing:border-box; overflow-x:hidden !important;">
                            ${contentHtml}
                        </div>
                    </div>
                    ${actualFooter ? `
                    <div class="modal-footer" style="padding:${isMobileScreen ? '10px 14px' : '12px 28px'} !important; background:#ffffff !important; border-top:1.5px solid #e2e8f0 !important; display:flex !important; align-items:center !important; justify-content:flex-end !important; gap:10px !important; flex-shrink:0 !important; box-shadow:0 -2px 8px rgba(0,0,0,0.03) !important; width:100% !important; box-sizing:border-box !important; flex-wrap:wrap !important; overflow-x:hidden !important;">
                        <div style="max-width:1280px; margin:0 auto; width:100%; display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap; box-sizing:border-box; overflow-x:hidden !important;">
                            ${actualFooter}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        } else {
            overlay.classList.remove('modal-overlay-fullscreen');
            overlay.classList.add('modal-overlay-dialog');
            overlay.style.cssText = 'position:fixed !important; inset:0 !important; background:rgba(15,23,42,0.65) !important; backdrop-filter:blur(6px) !important; -webkit-backdrop-filter:blur(6px) !important; display:flex !important; align-items:center !important; justify-content:center !important; padding:16px !important; z-index:10001 !important;';
            
            const dialogMaxWidth = (options && options.maxWidth) || '480px';
            const dialogBodyPadding = (options && options.bodyPadding !== undefined) ? options.bodyPadding : '16px 18px';

            overlay.innerHTML = `
                <div class="modal modal-dialog" style="background:#ffffff; width:95%; max-width:${dialogMaxWidth}; border-radius:20px; box-shadow:0 25px 60px rgba(0,0,0,0.3); display:flex; flex-direction:column; overflow:hidden;">
                    ${hasHeader ? `
                    <div class="modal-header" style="padding:16px 20px; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
                        <div class="text-xl font-bold" style="font-size:17px; font-weight:800; color:#0f172a;">${title}</div>
                        <button class="modal-close" onclick="UI.closeModal()" title="Cerrar modal (Esc)">✕</button>
                    </div>
                    ` : ''}
                    <div class="modal-body" style="padding:${dialogBodyPadding}; color:#475569; overflow-y:auto; overflow-x:hidden !important; box-sizing:border-box !important;">
                        ${contentHtml}
                    </div>
                    ${actualFooter ? `<div class="modal-footer" style="padding:12px 20px 16px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:10px;">${actualFooter}</div>` : ''}
                </div>
            `;
        }
        overlay.classList.add('open');
        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e){}
        }

        // Esc listener
        if (!window._modalEscListenerAdded) {
            window._modalEscListenerAdded = true;
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && UI.isModalOpen()) {
                    UI.closeModal();
                }
            });
        }
    },
    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.remove('open');
            overlay.classList.remove('modal-overlay-fullscreen');
            overlay.style.cssText = '';
        }

        // Restaurar estado del menú lateral si fue auto-colapsado por el modal (y no estamos en cuadro)
        if (this._sidebarWasExpandedBeforeModal) {
            this._sidebarWasExpandedBeforeModal = false;
            const isCuadro = (window.Router && Router.current === 'cuadro');
            const savedState = localStorage.getItem('gdhn_sidebarState');
            if (!isCuadro && savedState !== 'collapsed') {
                const sb = document.getElementById('sidebar');
                if (sb && window.innerWidth > 1024) {
                    sb.classList.remove('collapsed');
                }
            }
        }
    },
    isModalOpen() {
        const overlay = document.getElementById('modal-overlay');
        return overlay ? overlay.classList.contains('open') : false;
    },
    toggleFloatingNavMenu(e) {
        if (e) e.stopPropagation();
        const fab = document.getElementById('fab-quick-nav');
        if (!fab) return;
        const rect = fab.getBoundingClientRect();
        fab.classList.toggle('open-right', rect.left < window.innerWidth / 2);
        fab.classList.toggle('open');

        if (!window._fabOutsideClickBound) {
            window._fabOutsideClickBound = true;
            document.addEventListener('click', (evt) => {
                const currentFab = document.getElementById('fab-quick-nav');
                if (currentFab && currentFab.classList.contains('open') && !currentFab.contains(evt.target)) {
                    currentFab.classList.remove('open');
                }
            });
        }
    },
    
    openFloatingReportsMenu(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        this.closeFloatingRadialMenu();
        Router.navigate('reportes');
    },

    closeFloatingRadialMenu() {
        const fab = document.getElementById('fab-quick-nav');
        if (fab) fab.classList.remove('open');
        const el = document.getElementById('gdhn-fab-radial-overlay');
        if (el) el.remove();
    },
    makeDraggable(el, handle) {
        if (!el || !handle) return;
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (el._dragX === undefined) {
            el._dragX = 0;
            el._dragY = 0;
        }
        handle.style.cursor = 'move';
        handle.style.touchAction = 'none';
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
            
            el._dragX -= pos1;
            el._dragY -= pos2;
            
            el.style.transform = `translate(${el._dragX}px, ${el._dragY}px)`;
        }
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
        }
    },
    confirm(msg, subtitleOrOnConfirm, maybeOnConfirm) {
        let messageHtml = '';
        let onConfirm = null;
        if (typeof subtitleOrOnConfirm === 'function') {
            messageHtml = `<p style="font-size: 16px; margin: 10px 0; color: #1e293b;">${msg}</p>`;
            onConfirm = subtitleOrOnConfirm;
        } else if (typeof maybeOnConfirm === 'function') {
            messageHtml = `
                <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">${msg}</div>
                <p style="font-size: 13.5px; color: #64748b; margin: 0 0 10px 0; line-height: 1.45;">${subtitleOrOnConfirm}</p>
            `;
            onConfirm = maybeOnConfirm;
        } else {
            messageHtml = `<p style="font-size: 16px; margin: 10px 0; color: #1e293b;">${msg}</p>`;
            onConfirm = () => {};
        }

        this.modal('Confirmar', messageHtml, `
            <div style="display: flex; gap: 10px; width: 100%;">
                <button class="btn btn-secondary" onclick="UI.closeModal()" style="background:#64748b; color:white; border:none; flex: 1; border-radius: 12px; height: 48px; font-weight: 600;">Cancelar</button>
                <button class="btn btn-primary" id="confirm-yes" style="flex: 1; border-radius: 12px; height: 48px; font-weight: 700;">Confirmar</button>
            </div>
        `);
        setTimeout(() => {
            const btn = document.getElementById('confirm-yes');
            if (btn && onConfirm) {
                btn.onclick = () => { onConfirm(); UI.closeModal(); };
            }
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

        this.modal('', overlayHtml, '', { dialog: true });
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

    toggleSubmenu(btn, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const wrapper = btn ? btn.closest('.sidebar-submenu-wrapper') : null;
        if (!wrapper) return;
        const items = wrapper.querySelector('.sidebar-submenu-items');
        const chevron = btn.querySelector('.submenu-chevron') || btn.querySelector('svg');
        const isCurrentlyOpen = items && (items.classList.contains('open') || items.style.display === 'flex');

        // Cerrar todos los demás submenús abiertos para visualizar la nueva opción sin necesidad de escrolear
        if (typeof Store === 'undefined' || Store.data?.configPreferencias?.acordeonMenuLateral !== false) {
            document.querySelectorAll('.sidebar-submenu-wrapper').forEach(w => {
                if (w !== wrapper) {
                    const otherItems = w.querySelector('.sidebar-submenu-items');
                    const otherChevron = w.querySelector('.submenu-chevron') || w.querySelector('svg');
                    const otherBtn = w.querySelector('.submenu-parent-btn');
                    if (otherItems) {
                        otherItems.classList.remove('open');
                        otherItems.style.setProperty('display', 'none', 'important');
                    }
                    if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
                    if (otherBtn) otherBtn.classList.remove('open');
                }
            });
        }

        // Alternar este submenú directamente
        if (items) {
            if (isCurrentlyOpen) {
                items.classList.remove('open');
                items.style.setProperty('display', 'none', 'important');
                btn.classList.remove('open');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            } else {
                items.classList.add('open');
                items.style.setProperty('display', 'flex', 'important');
                btn.classList.add('open');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
        }
    },

    getStarGavelSvg(active = false) {
        const starStroke = active ? '#ffffff' : '#10b981';
        const gavelStroke = active ? '#ffffff' : '#f59e0b';
        return `<span class="custom-gavel-icon-wrap" style="display:inline-flex; align-items:center; justify-content:center; gap:2px; vertical-align:middle; line-height:1; flex-shrink:0;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" style="width:14px !important; height:14px !important; min-width:14px !important; flex-shrink:0;">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="${starStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg viewBox="8 5 104 75" width="20" height="20" fill="none" style="width:20px !important; height:20px !important; min-width:20px !important; flex-shrink:0; overflow:visible;">
                <path d="M 16 75 L 68 75 C 68 67, 63 63, 56 63 L 28 63 C 21 63, 16 67, 16 75 Z" fill="none" stroke="${gavelStroke}" stroke-width="5.5" stroke-linejoin="round"/>
                <rect x="23" y="57.5" width="38" height="5.5" rx="2" fill="none" stroke="${gavelStroke}" stroke-width="5"/>
                <g transform="translate(46, 36) rotate(24)" stroke="${gavelStroke}">
                    <path d="M 12 -4 L 68 -5.5 C 73 -5.5, 76 -3, 76 0 C 76 3, 73 5.5, 68 5.5 L 12 4" fill="none" stroke-width="5.5" stroke-linejoin="round"/>
                    <rect x="-12" y="-17" width="24" height="34" rx="2" fill="none" stroke-width="5.5"/>
                    <rect x="-15.5" y="-23" width="31" height="6" rx="3" fill="none" stroke-width="5.5"/>
                    <rect x="-15.5" y="17" width="31" height="6" rx="3" fill="none" stroke-width="5.5"/>
                </g>
            </svg>
        </span>`;
    },
    getModuleIconHtml(routeId, active = false, size = 15) {
        if (routeId === 'conducta') return this.getStarGavelSvg(active);
        const map = {
            panel: { icon: 'layout-dashboard', color: '#38bdf8' },
            asistencia: { icon: 'user-check', color: '#10b981' },
            cuadro: { icon: 'sheet', color: '#06b6d4' },
            agenda: { icon: 'calendar', color: '#0284c7' },
            evaluacion: { icon: 'pie-chart', color: '#a855f7' },
            cuadro1: { icon: 'table', color: '#10b981' },
            sace: { icon: 'server', color: '#0ea5e9' },
            'pruebas-formativas': { icon: 'file-text', color: '#3b82f6' },
            'equipos-trabajo': { icon: 'users', color: '#14b8a6' },
            cursos: { icon: 'book-open', color: '#818cf8' },
            estudiantes: { icon: 'users', color: '#38bdf8' },
            reportes: { icon: 'file-bar-chart', color: '#f43f5e' },
            'banco-rubricas': { icon: 'folder-check', color: '#06b6d4' }
        };
        const m = map[routeId];
        if (!m) return '';
        return `<i data-lucide="${m.icon}" style="width:${size}px;height:${size}px;color:${active ? '#ffffff' : m.color};" class="icon"></i>`;
    },
    renderSidebar() {
        const menu = document.getElementById('side-menu');
        const course = Store.getActiveCourse();
        const configValid = Logic.isConfigValid();

        const isProUser = (typeof window !== 'undefined' && window.AuthService) ? window.AuthService.getLicenseStatus().isPro : false;
        const groups = [
            {
                label: 'CUENTA Y LICENCIA',
                items: [
                    { id: 'plan-pro', icon: 'shopping-cart', label: isProUser ? 'Plan Pro Activo' : 'Hazte Pro', color: '#f59e0b', locked: false }
                ]
            },
            {
                label: 'NÚCLEO OPERATIVO',
                items: [
                    { id: 'panel', icon: 'layout-dashboard', label: 'Centro de Control', color: '#38bdf8', locked: !course },
                    { id: 'personalidad-menu', icon: 'heart-handshake', label: 'Personalidad', color: '#10b981', locked: !course,
                        subItems: [
                            { id: 'asistencia', label: 'Asistencia', icon: 'user-check', color: '#10b981' },
                            { id: 'conducta', label: 'Conducta', icon: 'gavel', customIcon: 'stargavel', color: '#f59e0b' }
                        ]
                    },
                    { id: 'evaluacion-menu', icon: 'clipboard-check', label: 'Evaluación', color: '#f59e0b', locked: !course,
                        subItems: [
                            { id: 'cuadro', label: 'Cuadro Controlador', icon: 'sheet', color: '#06b6d4' },
                            { id: 'evaluacion', label: 'Dimensiones', icon: 'pie-chart', color: '#a855f7' },
                            { id: 'cuadro1', label: 'Cuadro #1', icon: 'table', color: '#10b981' },
                            { id: 'sace', label: 'Módulo SACE', icon: 'server', color: '#0ea5e9' },
                            { id: 'pruebas-formativas', label: 'Pruebas Formativas', icon: 'file-text', color: '#3b82f6' },
                            { id: 'pruebas-diagnosticas', label: 'Diagnósticas', icon: 'microscope', color: '#ec4899' }
                        ]
                    },
                    { id: 'clase-menu', icon: 'presentation', label: 'Gestión de Clase', color: '#f97316', locked: false,
                        subItems: [
                            { id: 'agenda', label: 'Agenda Escolar', icon: 'calendar', color: '#0284c7' },
                            { id: 'equipos-trabajo', label: 'Equipos de Trabajo', icon: 'users', color: '#14b8a6' },
                            { id: 'horario-aseo', label: 'Rol de Aseo', icon: 'sparkles', color: '#06b6d4' },
                            { id: 'organizacion-grado', label: 'Organización de Grado', icon: 'shield-check', color: '#8b5cf6' },
                            { id: 'libreria-todas', label: 'Librería Digital', icon: 'book-open', color: '#8b5cf6' }
                        ]
                    }
                ]
            },
            {
                label: 'GESTIÓN ACADÉMICA',
                items: [
                    { id: 'cursos-menu', icon: 'users', label: 'Cursos y Matrícula', color: '#818cf8', locked: false,
                        subItems: [
                            { id: 'cursos', label: 'Mis Cursos', icon: 'book-open', color: '#818cf8' },
                            { id: 'estudiantes', label: 'Control de Matrícula', icon: 'users', color: '#38bdf8' },
                            { id: 'horario', label: 'Horario', icon: 'clock', color: '#fb923c' }
                        ]
                    },
                    { id: 'reportes', icon: 'file-bar-chart', label: 'Reportes y Estadísticas', color: '#f43f5e', locked: !course },
                    { id: 'sart', icon: 'alert-triangle', label: 'Alertas SART', color: '#ef4444', locked: !course },
                    { id: 'bitacora', icon: 'book', label: 'Bitácora', color: '#10b981', locked: !course }
                ]
            },
            {
                label: 'SISTEMA Y HERRAMIENTAS',
                items: [
                    { id: 'onboarding', icon: 'sparkles', label: 'Asistente de Inicio', color: '#10b981', locked: false },
                    { id: 'banco-rubricas', icon: 'folder-check', label: 'Banco de Rúbricas', color: '#06b6d4', locked: false },
                    { id: 'respaldo', icon: 'database-backup', label: 'Respaldo de Datos', color: '#c084fc', locked: false },
                    { id: 'redes-sociales', icon: 'share-2', label: 'Redes Sociales', color: '#ec4899', locked: false },
                    { id: 'config', icon: 'settings', label: 'Ajustes Generales', color: '#94a3b8', locked: false }
                ]
            }
        ];

        // Filtrado no destructivo de módulos opcionales según Preferencias del Usuario
        const modVis = (typeof Store !== 'undefined' && Store.data?.configPreferencias?.modulosVisibles) || {};
        const hiddenRoutes = new Set();
        if (modVis.conducta === false) { hiddenRoutes.add('conducta'); hiddenRoutes.add('reporte-conducta'); }
        if (modVis.sace === false) { hiddenRoutes.add('cuadro1'); hiddenRoutes.add('sace'); hiddenRoutes.add('estadistica-condensado'); hiddenRoutes.add('parte-mensual'); }
        if (modVis.pruebas === false) { hiddenRoutes.add('pruebas-formativas'); hiddenRoutes.add('pruebas-diagnosticas'); }
        if (modVis.sartBitacora === false) { hiddenRoutes.add('sart'); hiddenRoutes.add('bitacora'); }
        if (modVis.maestroGuia === false) { hiddenRoutes.add('equipos-trabajo'); hiddenRoutes.add('horario-aseo'); hiddenRoutes.add('organizacion-grado'); }
        if (modVis.complementarios === false) { hiddenRoutes.add('agenda'); hiddenRoutes.add('libreria-todas'); hiddenRoutes.add('notas-rapidas'); hiddenRoutes.add('banco-rubricas'); }

        if (hiddenRoutes.size > 0) {
            groups.forEach(g => {
                g.items = g.items.filter(item => {
                    if (hiddenRoutes.has(item.id)) return false;
                    if (item.subItems) {
                        item.subItems = item.subItems.filter(sub => !hiddenRoutes.has(sub.id));
                        return item.subItems.length > 0;
                    }
                    return true;
                });
            });
        }

        let html = '';

        groups.forEach((g, gIndex) => {
            html += `<div class="nav-group-label">${g.label}</div>`;

            g.items.forEach(i => {
                const isLibreriaRoute = Router.current.startsWith('libreria-') && i.id === 'libreria-todas';
                const isSubActive = i.subItems ? i.subItems.some(sub => {
                    if (sub.reportId) {
                        return (Router.current === 'reportes' || Router.current === sub.id) && typeof Views !== 'undefined' && Views.Reportes && Views.Reportes._state.selectedReport === sub.reportId;
                    }
                    return Router.current === sub.id;
                }) || Router.current === i.id || (i.id === 'reportes-menu' && Router.current === 'reportes') : false;
                const isActive = Router.current === i.id || isLibreriaRoute || isSubActive;

                const iconHtml = i.imgIcon
                    ? `<img src="${i.imgIcon}" class="icon" style="width:18px;height:18px;border-radius:4px;object-fit:cover; filter: ${isActive ? 'none' : 'grayscale(100%) opacity(0.8)'};">`
                    : `<i data-lucide="${i.icon}" class="icon" style="color: ${isActive ? '#ffffff' : i.color}"></i>`;

                if (i.subItems) {
                    const curRoute = Router.current || 'panel';
                    const isDefaultPanel = curRoute === 'panel' || curRoute === '';
                    const isPersonalidadRoute = ['asistencia', 'conducta'].includes(curRoute);
                    const isEvaluacionRoute = ['cuadro', 'evaluacion', 'cuadro1', 'sace', 'pruebas-formativas', 'pruebas-diagnosticas'].includes(curRoute);

                    // Por defecto Personalidad y Evaluación están desplegados en el Centro de Control o en sus propias opciones.
                    // Al cambiar a otra opción de menú (Gestión de Clase, Cursos, Reportes, Ajustes, etc.), estos se contraen automáticamente para ver la nueva opción sin escrolear.
                    let isOpen = false;
                    if (isDefaultPanel || isPersonalidadRoute || isEvaluacionRoute) {
                        isOpen = (i.id === 'personalidad-menu' || i.id === 'evaluacion-menu');
                    } else {
                        isOpen = isSubActive;
                    }

                    html += `
                            <div class="sidebar-submenu-wrapper w-full relative" data-group-id="${i.id}">
                                <button onclick="UI.toggleSubmenu(this, event)" 
                                    data-tooltip="${i.label}"
                                    data-label="${i.label}"
                                    title="${i.label}"
                                    class="gdhn-nav-item submenu-parent-btn ${isActive ? 'active' : ''} ${isSubActive ? 'active-route' : ''} ${isOpen ? 'open' : ''} ${i.locked ? 'disabled' : ''} flex justify-between items-center w-full">
                                    <div class="flex items-center gap-[10px] submenu-parent-icon-wrap">
                                        ${iconHtml}
                                        <span class="label">${i.label}</span>
                                    </div>
                                    <i data-lucide="chevron-down" class="w-4 h-4 opacity-60 submenu-chevron" style="margin-left:auto; transition:transform 0.25s ease; ${isOpen ? 'transform:rotate(180deg);' : ''}"></i>
                                </button>
                                <div class="sidebar-submenu-items ${isOpen ? 'open' : ''}" style="${isOpen ? 'display:flex !important;' : 'display:none !important;'}">
                                     ${i.subItems.map(sub => {
                        const subActive = sub.reportId
                            ? ((Router.current === 'reportes' || Router.current === sub.id) && typeof Views !== 'undefined' && Views.Reportes && Views.Reportes._state.selectedReport === sub.reportId)
                            : (Router.current === sub.id);
                        const subColor = sub.color || '#94a3b8';
                        const subIconHtml = sub.customIcon === 'stargavel'
                            ? `<span class="custom-gavel-icon-wrap" style="display:inline-flex; align-items:center; justify-content:center; gap:2px; vertical-align:middle; line-height:1; flex-shrink:0;">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" style="width:14px !important; height:14px !important; min-width:14px !important; flex-shrink:0;">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="${subActive ? '#ffffff' : '#10b981'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                <svg viewBox="8 5 104 75" width="20" height="20" fill="none" style="width:20px !important; height:20px !important; min-width:20px !important; flex-shrink:0; overflow:visible;">

                                    <path d="M 16 75 L 68 75 C 68 67, 63 63, 56 63 L 28 63 C 21 63, 16 67, 16 75 Z" fill="none" stroke="${subActive ? '#ffffff' : '#f59e0b'}" stroke-width="5.5" stroke-linejoin="round"/>

                                    <rect x="23" y="57.5" width="38" height="5.5" rx="2" fill="none" stroke="${subActive ? '#ffffff' : '#f59e0b'}" stroke-width="5"/>
                                    <g transform="translate(46, 36) rotate(24)" stroke="${subActive ? '#ffffff' : '#f59e0b'}">
                                        <path d="M 12 -4 L 68 -5.5 C 73 -5.5, 76 -3, 76 0 C 76 3, 73 5.5, 68 5.5 L 12 4" fill="none" stroke-width="5.5" stroke-linejoin="round"/>
                                        <rect x="-12" y="-17" width="24" height="34" rx="2" fill="none" stroke-width="5.5"/>
                                        <rect x="-15.5" y="-23" width="31" height="6" rx="3" fill="none" stroke-width="5.5"/>
                                        <rect x="-15.5" y="17" width="31" height="6" rx="3" fill="none" stroke-width="5.5"/>













                                    </g>
                                </svg>
                               </span>`
                            : (sub.icon 
                                ? `<i data-lucide="${sub.icon}" style="width:15px;height:15px;color:${subActive ? '#ffffff' : subColor};" class="icon"></i>`
                                : `<div style="width:6px;height:6px;border-radius:50%;background:${subActive ? '#ffffff' : subColor};margin:0 auto;"></div>`);
                        const clickAction = sub.reportId
                            ? `window.autoCloseSidebar(); Views.Reportes.selectReport('${sub.reportId}')`
                            : `window.autoCloseSidebar(); Router.navigate('${sub.id}')`;
                        return `
                                        <button onclick="${clickAction}" 
                                             data-tooltip="${sub.label}"
                                             data-label="${sub.label}"
                                             title="${sub.label}"
                                             class="gdhn-nav-item submenu-child-btn ${subActive ? 'active' : ''}">
                                             ${subIconHtml}
                                             <span class="label" style="font-size:12.5px;">${sub.label}</span>
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
        this.updateTeacherProfile();
        this.applyPreferences();
        this.initRetractableSidebar();
        if (window.lucide) window.lucide.createIcons();

        // Initialize sidebar global state safely
        setTimeout(() => {
            const sb = document.getElementById('sidebar');
            if (!sb) return;
            const st = localStorage.getItem('gdhn_sidebarState');
            if (window.innerWidth > 1024) {
                const autoCollapse = (typeof Store === 'undefined' || Store.data?.configPreferencias?.autoColapsarMenu !== false);
                if (!autoCollapse && st === 'open') {
                    sb.classList.remove('collapsed');
                } else if (UI._sidebarManuallyExpandedInCuadro) {
                    sb.classList.remove('collapsed');
                } else if (st === 'open' && window.Router && Router.current !== 'cuadro') {
                    sb.classList.remove('collapsed');
                } else if (autoCollapse) {
                    sb.classList.add('collapsed');
                }
                sb.classList.remove('open');
            }
        }, 10);
    },
    updateTeacherProfile() {
        const sData = (typeof Store !== 'undefined' && Store.data) ? Store.data : {};
        const c = (typeof Store !== 'undefined' && Store.getActiveCourse) ? Store.getActiveCourse() : null;
        
        // Prioridad 1: Perfil del Docente ingresado en Ajustes (Imagen 2)
        // Prioridad 2: Docente asignado al curso activo
        // Prioridad 3: Configuración de Centro / Académica
        let docenteRaw = (sData.perfilDocente && sData.perfilDocente.nombre && sData.perfilDocente.nombre.trim())
            || (c && c.docente && c.docente.trim())
            || (sData.configCentro && sData.configCentro.docente && sData.configCentro.docente.trim())
            || (sData.configAcademica && sData.configAcademica.docente && sData.configAcademica.docente.trim())
            || 'Docente';

        // Formatear en Tipo Título (minúsculas con solo mayúsculas al inicio)
        const formatTitleCase = (str) => {
            if (!str) return 'Docente';
            const trimmed = str.trim();
            if (!trimmed) return 'Docente';
            return trimmed.split(/\s+/).map(word => {
                if (!word) return '';
                const lower = word.toLowerCase();
                return lower.charAt(0).toUpperCase() + lower.slice(1);
            }).join(' ');
        };

        const docenteFormatted = formatTitleCase(docenteRaw);
        
        const nameEl = document.getElementById('sidebar-user-name');
        const roleEl = document.getElementById('sidebar-user-role');
        const avatarEl = document.getElementById('sidebar-user-avatar');
        const cardEl = document.getElementById('sidebar-user-card');
        
        if (nameEl) {
            nameEl.textContent = docenteFormatted;
            nameEl.title = docenteFormatted;
        }
        if (roleEl) roleEl.textContent = 'DOCENTE';
        if (cardEl) {
            const email = sData.perfilDocente?.correo || '';
            const phone = sData.perfilDocente?.telefono || '';
            let tip = `${docenteFormatted} (Docente)`;
            if (email) tip += `\nCorreo: ${email}`;
            if (phone) tip += `\nTeléfono: ${phone}`;
            tip += '\nClic para configurar perfil';
            cardEl.title = tip;
        }
        
        const foto = sData.perfilDocente?.foto || '';
        if (avatarEl) {
            if (foto) {
                avatarEl.innerHTML = `<img src="${foto}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                avatarEl.innerHTML = `<i data-lucide="user" style="width:24px;height:24px;color:#64748b;"></i>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    },
    initRetractableSidebar() {
        const sb = document.getElementById('sidebar');
        if (sb && !sb._hasHoverListeners) {
            sb._hasHoverListeners = true;
            let hoverTimer = null;

            sb.addEventListener('mouseenter', () => {
                if (window.innerWidth > 1024 && sb.classList.contains('collapsed')) {
                    clearTimeout(hoverTimer);
                    sb.classList.add('hover-expanded');
                }
            });

            sb.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
                hoverTimer = setTimeout(() => {
                    sb.classList.remove('hover-expanded');
                }, 80);
            });
        }

        // Permitir que al pinchar el logo el menú se despliegue o contraiga
        const brand = document.querySelector('.gdhn-brand');
        if (brand && !brand._hasToggleListener) {
            brand._hasToggleListener = true;
            brand.style.cursor = 'pointer';
            brand.title = 'Mostrar / Ocultar Menú Lateral';
            brand.onclick = (e) => {
                e.stopPropagation();
                window.toggleSidebar(e);
            };
        }
    },
    applyPreferences() {
        const prefs = (typeof Store !== 'undefined' && Store.data?.configPreferencias) || {};
        const showTutor = prefs.mostrarTutorHeader !== false;
        const tutorNav = document.getElementById('navbar-tutor360-container');
        if (tutorNav) tutorNav.style.display = showTutor ? '' : 'none';
        const aiBtn = document.getElementById('ai-assistant-btn');
        if (aiBtn) aiBtn.style.display = showTutor ? '' : 'none';

        if (prefs.fabRadialMenu === false) {
            const fab = document.getElementById('fab-quick-nav');
            if (fab) fab.remove();
            const fabOverlay = document.getElementById('gdhn-fab-radial-overlay');
            if (fabOverlay) fabOverlay.remove();
        }
        if (prefs.pildoraVolver === false) {
            const pill = document.getElementById('nav-back-pill');
            if (pill) pill.remove();
        }

        // Asegurar y sincronizar el botón de engranaje de Ajustes Generales en la esquina superior izquierda
        let gearBtn = document.getElementById('header-settings-btn');
        if (!gearBtn) {
            const toggleBtn = document.querySelector('.gdhn-header .sidebar-toggle-btn');
            if (toggleBtn) {
                toggleBtn.style.setProperty('margin-right', '-6px', 'important');
                gearBtn = document.createElement('button');
                gearBtn.id = 'header-settings-btn';
                gearBtn.className = 'sidebar-toggle-btn';
                gearBtn.title = 'Ajustes Generales y Configuración';
                gearBtn.setAttribute('aria-label', 'Ajustes Generales');
                gearBtn.style.setProperty('margin-right', '4px', 'important');
                gearBtn.onclick = () => Router.navigate('config');
                gearBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block; flex-shrink:0; transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1);" onmouseover="this.style.transform='rotate(45deg)'; this.style.stroke='#059669';" onmouseout="this.style.transform='none'; this.style.stroke=(window.Router&&Router.current==='config')?'#059669':'#1e293b';"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                toggleBtn.insertAdjacentElement('afterend', gearBtn);
            }
        }
        if (gearBtn) {
            const isConfigActive = (typeof Router !== 'undefined' && Router.current === 'config');
            gearBtn.style.setProperty('background', isConfigActive ? '#ecfdf5' : '#ffffff', 'important');
            gearBtn.style.setProperty('border-color', isConfigActive ? '#a7f3d0' : '#d9e2ec', 'important');
            const svg = gearBtn.querySelector('svg');
            if (svg) svg.style.setProperty('stroke', isConfigActive ? '#059669' : '#1e293b', 'important');
        }
    },
    updateHeader() {
        this.updateTeacherProfile();
        this.applyPreferences();
        const c = Store.getActiveCourse();
        const btn = document.getElementById('active-course-btn');
        if (!btn) return;
        const currentRoute = (typeof Router !== 'undefined' && Router.current) ? Router.current : 'panel';
        const globalRoutes = new Set([
            'reportes', 'cursos', 'estudiantes', 'horario', 'agenda',
            'libreria-todas', 'banco-rubricas', 'respaldo', 'redes-sociales',
            'config', 'plan-pro', 'onboarding'
        ]);
        if (globalRoutes.has(currentRoute)) {
            btn.style.display = 'none';
            return;
        }
        if (c) {
            const centroLabel = c.centroEducativo ? ` - ${c.centroEducativo}` : '';
            btn.textContent = `${c.asignatura} (${c.grado} ${c.seccion}º)${centroLabel}`;
            btn.title = `${c.asignatura} (${c.grado} ${c.seccion}º) - ${c.centroEducativo || 'Sin Centro'}`;
            btn.style.borderColor = 'rgba(16, 185, 129, 0.32)';
            btn.style.background = '#ECFDF5';
            btn.style.color = '#059669';
            btn.style.whiteSpace = 'nowrap';
            btn.style.overflow = 'hidden';
            btn.style.textOverflow = 'ellipsis';
            btn.style.display = 'block';
            btn.style.maxWidth = '250px';
        } else {
            btn.textContent = 'Seleccionar Curso';
            btn.title = 'Seleccionar Curso Activo';
            btn.style.display = 'block';
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'var(--text-muted)';
            btn.style.maxWidth = 'none';
        }
    }
};

// Global functions for inline handlers
window.UI = UI;
window.closeModal = UI.closeModal;
window.openAssistant = function(mod, tab) {
    if (window.Views && window.Views.Assistant && typeof window.Views.Assistant.open === 'function') {
        window.Views.Assistant.open(mod, tab);
    } else if (typeof AppGreeting !== 'undefined' && typeof AppGreeting.showGreetingModal === 'function') {
        AppGreeting.showGreetingModal(true);
    }
};

window.autoCloseSidebar = () => {
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    
    // Si estamos en movil o tablet (<= 1024px), cerrar drawer
    if (window.innerWidth <= 1024) {
        sb.classList.remove('open');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.classList.remove('active');
    } else {
        // En escritorio (> 1024px), contraer menú lateral al elegir cualquier opción (si está habilitado en preferencias)
        if (typeof Store === 'undefined' || Store.data?.configPreferencias?.autoColapsarMenu !== false) {
            sb.classList.add('collapsed');
            localStorage.setItem('gdhn_sidebarState', 'collapsed');
        }
        sb.classList.remove('hover-expanded');
    }

    if (window.UI) {
        UI._sidebarManuallyExpandedInCuadro = false;
        UI._sidebarWasExpandedBeforeModal = false;
    }
};

window.toggleSidebar = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    sb.classList.remove('hover-expanded');

    if (window.innerWidth <= 1024) {
        sb.classList.toggle('open');
        let backdrop = document.getElementById('sidebar-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'sidebar-backdrop';
            backdrop.className = 'sidebar-backdrop';
            backdrop.onclick = () => window.autoCloseSidebar();
            document.body.appendChild(backdrop);
        }
        if (sb.classList.contains('open')) {
            backdrop.classList.add('active');
        } else {
            backdrop.classList.remove('active');
        }
    } else {
        const willBeCollapsed = !sb.classList.contains('collapsed');
        sb.classList.toggle('collapsed');

        localStorage.setItem('gdhn_sidebarState', willBeCollapsed ? 'collapsed' : 'open');
        if (window.UI) {
            UI._sidebarManuallyExpandedInCuadro = !willBeCollapsed;
            UI._sidebarWasExpandedBeforeModal = false;
        }
    }
};

// Cerrar menu al hacer clic fuera (en movil) y ocultar menu flotante de navegación
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
        const sb = document.getElementById('sidebar');
        const toggle = document.querySelector('.sidebar-toggle-btn') || document.querySelector('.mobile-toggle');
        if (sb && sb.classList.contains('open') && !sb.contains(e.target) && (!toggle || !toggle.contains(e.target))) {
            window.autoCloseSidebar();
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
    fixConfig(nivel = null) {
        const lvl = nivel || Store.data.configAcademica?.nivelEducativo || 'basica_3_ciclo';
        const norm = (window.NormativasSACE && window.NormativasSACE[lvl]) || (window.NormativasSACE && window.NormativasSACE['basica_3_ciclo']);
        if (norm && norm.dimensions) {
            Store.data.configAcademica.dimensions = JSON.parse(JSON.stringify(norm.dimensions));
            Store.data.configAcademica.nivelEducativo = lvl;
        } else {
            Store.data.configAcademica.dimensions = JSON.parse(JSON.stringify(CONFIG.dimensions));
        }
        Store.save();
        UI.toast('Configuración restaurada a valores estándar oficiales (' + (norm?.nombre || 'SACE') + ')', 'success');
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
        const sourceCentro = normalize(source.centroEducativo || source.institucion || source.colegio || source.escuela || source.centro);
        const sourceJornada = normalize(source.jornada || source.jornadaP);

        return Store.get('cursos').filter(c => {
            if (c.id === courseId) return false;
            // Mismo grado
            if (normalize(c.grado) !== normalize(source.grado)) return false;
            // Misma sección
            if (normalize(c.seccion) !== normalize(source.seccion)) return false;
            
            // Comparar jornada si existe
            const cJornada = normalize(c.jornada || c.jornadaP);
            if (sourceJornada && cJornada && cJornada !== sourceJornada) return false;

            // Comparar centro educativo si existe
            const cCentro = normalize(c.centroEducativo || c.institucion || c.colegio || c.escuela || c.centro);
            if (sourceCentro && cCentro && cCentro !== sourceCentro) return false;

            // Mismo año lectivo si existe
            if (source.anio && c.anio && String(source.anio) !== String(c.anio)) return false;

            return true;
        }).map(c => c.id);
    },
    syncAttendance(studentId, date, newState, sourceCourseId, tardanzaData = null, skipSave = false) {
        if (typeof Views !== 'undefined' && Views.Cuadro1 && typeof Views.Cuadro1.invalidateCache === 'function') Views.Cuadro1.invalidateCache();
        if (typeof Store !== 'undefined' && Store.data?.configPreferencias?.sincronizarCursosParalelos === false) return;
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
                // Sincronizar si el alumno está matriculado en el curso paralelo o está en la lista del curso
                const isEnrolled = Store.get('matriculas').some(m => m.cursoId === targetCourseId && m.estudianteId === studentId) ||
                                   Store.getStudentsByCourse(targetCourseId).some(s => s.id === studentId);
                if (isEnrolled) {
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
        let birth = null;
        if (typeof birthDate === 'number') {
            birth = new Date(Math.round((birthDate - 25569) * 86400 * 1000));
        } else if (typeof birthDate === 'string') {
            const s = birthDate.trim();
            const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
            if (ymd) {
                birth = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
            } else {
                const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (dmy) {
                    birth = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
                } else {
                    birth = new Date(s);
                }
            }
        } else {
            birth = new Date(birthDate);
        }
        if (!birth || isNaN(birth.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return (age >= 0 && age < 120) ? age : null;
    },
    calcAge(birthDate) {
        return this.calculateAge(birthDate);
    },
    formatDate(iso) {
        if (typeof Utils !== 'undefined' && Utils.formatDate) {
            return Utils.formatDate(iso);
        }
        return iso || '';
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
            <div style="margin-bottom: 24px; padding: 12px 16px; border-radius: var(--radius-sm); border-left: 3px solid var(--primary); background: linear-gradient(to right, rgba(16, 185, 129, 0.04), transparent); border-top: 1px solid var(--border-soft); border-right: 1px solid var(--border-soft); border-bottom: 1px solid var(--border-soft); display: flex; align-items: start; gap: 12px;">
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
    },

    // ─── CALENDARIO Y SELECTOR DE FECHAS MODERNO AULA 360 ──────────────────
    formatDateEs(dateStr) {
        if (!dateStr) return 'Seleccionar fecha...';
        const d = new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const dNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const mNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${dNames[d.getDay()]}, ${d.getDate()} de ${mNames[d.getMonth()]} de ${d.getFullYear()}`;
    },

    openDatePicker(targetInput, options = {}) {
        if (typeof targetInput === 'string') {
            targetInput = document.getElementById(targetInput);
        }
        if (!targetInput) return;

        // Eliminar selector previo si estuviera abierto
        const existing = document.getElementById('a360-datepicker-overlay');
        if (existing) existing.remove();

        const initialVal = targetInput.value || options.value || new Date().toISOString().split('T')[0];
        let selectedDate = new Date(initialVal.length === 10 ? initialVal + 'T12:00:00' : initialVal);
        if (isNaN(selectedDate.getTime())) selectedDate = new Date();

        let viewYear = selectedDate.getFullYear();
        let viewMonth = selectedDate.getMonth(); // 0 a 11

        const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const daysEsShort = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

        const overlay = document.createElement('div');
        overlay.id = 'a360-datepicker-overlay';
        overlay.className = 'a360-dp-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            opacity: 0;
            transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        const self = this;

        function renderCalendar() {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
            const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;

            const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 es Domingo
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
            const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

            let daysHtml = '';

            // Días de relleno del mes anterior
            for (let i = firstDayOfMonth - 1; i >= 0; i--) {
                const dayNum = daysInPrevMonth - i;
                const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
                const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
                const dateStr = `${pYear}-${String(pMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
                daysHtml += `
                    <button type="button" class="a360-dp-day out-month" data-date="${dateStr}" style="height: 38px; border: none; background: transparent; color: #94a3b8; font-size: 13px; font-weight: 500; border-radius: 10px; cursor: pointer; transition: 0.15s; display: flex; align-items: center; justify-content: center;">
                        ${dayNum}
                    </button>
                `;
            }

            // Días del mes actual
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedStr;
                const dayOfWeek = (firstDayOfMonth + d - 1) % 7;
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

                let bgStyle = 'background: transparent;';
                let textStyle = `color: ${isWeekend ? '#e11d48' : '#1e293b'}; font-weight: 600;`;
                let shadowStyle = '';
                let borderStyle = 'border: 1.5px solid transparent;';

                if (isSelected) {
                    bgStyle = 'background: linear-gradient(135deg, #10B981 0%, #34D399 100%);';
                    textStyle = 'color: #ffffff; font-weight: 800;';
                    shadowStyle = 'box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35); transform: scale(1.05);';
                } else if (isToday) {
                    borderStyle = 'border: 1.5px solid #10B981;';
                    bgStyle = 'background: rgba(16, 185, 129, 0.08);';
                    textStyle = 'color: #10B981; font-weight: 800;';
                }

                daysHtml += `
                    <button type="button" class="a360-dp-day current-month ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}" style="height: 38px; ${borderStyle} ${bgStyle} ${textStyle} font-size: 13px; border-radius: 10px; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; ${shadowStyle}">
                        <span>${d}</span>
                        ${isToday && !isSelected ? '<span style="width: 4px; height: 4px; background: #10B981; border-radius: 50%; margin-top: -2px;"></span>' : ''}
                    </button>
                `;
            }

            // Días de relleno del mes siguiente (completar cuadrícula de 35 o 42 celdas)
            const totalRendered = firstDayOfMonth + daysInMonth;
            const nextMonthDays = totalRendered <= 35 ? (35 - totalRendered) : (42 - totalRendered);
            for (let d = 1; d <= nextMonthDays; d++) {
                const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;
                const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
                const dateStr = `${nYear}-${String(nMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                daysHtml += `
                    <button type="button" class="a360-dp-day out-month" data-date="${dateStr}" style="height: 38px; border: none; background: transparent; color: #94a3b8; font-size: 13px; font-weight: 500; border-radius: 10px; cursor: pointer; transition: 0.15s; display: flex; align-items: center; justify-content: center;">
                        ${d}
                    </button>
                `;
            }

            const yearsRange = [];
            const curY = new Date().getFullYear();
            for (let y = curY - 3; y <= curY + 3; y++) yearsRange.push(y);

            overlay.innerHTML = `
                <div class="a360-dp-card" style="background: #ffffff; width: 100%; max-width: 360px; border-radius: 20px; box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08); overflow: hidden; display: flex; flex-direction: column; transform: translateY(0); transition: transform 0.2s ease;">
                    
                    <!-- HEADER CON GRADIENTE ELEGANTE -->
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 18px 20px; color: #ffffff; display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #34D399; display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="calendar" style="width: 14px; height: 14px;"></i> Calendario Aula 360
                            </span>
                            <button type="button" id="a360-dp-btn-close" style="background: rgba(255,255,255,0.12); border: none; color: #ffffff; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.15s;">
                                <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                            </button>
                        </div>
                        <div style="font-size: 17px; font-weight: 800; color: #f8fafc; line-height: 1.2;">
                            ${self.formatDateEs(selectedStr)}
                        </div>
                    </div>

                    <!-- SELECTOR DE MES Y AÑO -->
                    <div style="padding: 12px 18px 8px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <select id="a360-dp-sel-month" style="font-size: 13.5px; font-weight: 800; color: #0f172a; border: 1px solid #e2e8f0; background: #f8fafc; padding: 6px 10px; border-radius: 8px; cursor: pointer; outline: none;">
                                ${monthsEs.map((m, idx) => `<option value="${idx}" ${idx === viewMonth ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                            <select id="a360-dp-sel-year" style="font-size: 13.5px; font-weight: 800; color: #0f172a; border: 1px solid #e2e8f0; background: #f8fafc; padding: 6px 10px; border-radius: 8px; cursor: pointer; outline: none;">
                                ${yearsRange.map(y => `<option value="${y}" ${y === viewYear ? 'selected' : ''}>${y}</option>`).join('')}
                            </select>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button type="button" id="a360-dp-prev-month" title="Mes Anterior" style="background: #f8fafc; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #334155; transition: 0.15s;">
                                <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i>
                            </button>
                            <button type="button" id="a360-dp-next-month" title="Mes Siguiente" style="background: #f8fafc; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #334155; transition: 0.15s;">
                                <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
                            </button>
                        </div>
                    </div>

                    <!-- BOTONES DE ACCIÓN RÁPIDA (PRESETS) -->
                    <div style="padding: 8px 18px 4px; display: flex; gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                        <button type="button" class="a360-dp-preset" data-offset="0" style="white-space: nowrap; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; background: rgba(16, 185, 129, 0.12); color: #047857; border: 1px solid rgba(16, 185, 129, 0.3); cursor: pointer;">
                            Hoy
                        </button>
                        <button type="button" class="a360-dp-preset" data-offset="1" style="white-space: nowrap; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; cursor: pointer;">
                            Mañana
                        </button>
                        <button type="button" class="a360-dp-preset" data-offset="7" style="white-space: nowrap; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; cursor: pointer;">
                            +7 Días
                        </button>
                        <button type="button" class="a360-dp-preset" data-offset="-1" style="white-space: nowrap; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; cursor: pointer;">
                            Ayer
                        </button>
                    </div>

                    <!-- MATRIZ DE DÍAS -->
                    <div style="padding: 10px 18px 14px;">
                        <!-- Cabecera de días de la semana -->
                        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 6px; text-align: center;">
                            ${daysEsShort.map((d, i) => `
                                <div style="font-size: 11px; font-weight: 800; color: ${i === 0 || i === 6 ? '#e11d48' : '#64748b'}; text-transform: uppercase;">
                                    ${d}
                                </div>
                            `).join('')}
                        </div>

                        <!-- Cuadrícula de números -->
                        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
                            ${daysHtml}
                        </div>
                    </div>

                    <!-- FOOTER -->
                    <div style="padding: 12px 18px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <button type="button" id="a360-dp-btn-clear" style="font-size: 12px; font-weight: 700; color: #64748b; background: transparent; border: none; cursor: pointer; padding: 6px 10px; border-radius: 8px;">
                            Borrar
                        </button>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" id="a360-dp-btn-cancel" style="font-size: 12px; font-weight: 700; color: #334155; background: #ffffff; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 8px; cursor: pointer;">
                                Cancelar
                            </button>
                            <button type="button" id="a360-dp-btn-confirm" style="font-size: 12px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #10B981 0%, #34D399 100%); border: none; padding: 6px 18px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);">
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();

            // Eventos
            overlay.querySelector('#a360-dp-btn-close').onclick = () => closePicker();
            overlay.querySelector('#a360-dp-btn-cancel').onclick = () => closePicker();
            
            overlay.querySelector('#a360-dp-prev-month').onclick = () => {
                if (viewMonth === 0) { viewMonth = 11; viewYear--; }
                else { viewMonth--; }
                renderCalendar();
            };

            overlay.querySelector('#a360-dp-next-month').onclick = () => {
                if (viewMonth === 11) { viewMonth = 0; viewYear++; }
                else { viewMonth++; }
                renderCalendar();
            };

            overlay.querySelector('#a360-dp-sel-month').onchange = (e) => {
                viewMonth = parseInt(e.target.value);
                renderCalendar();
            };

            overlay.querySelector('#a360-dp-sel-year').onchange = (e) => {
                viewYear = parseInt(e.target.value);
                renderCalendar();
            };

            // Presets
            overlay.querySelectorAll('.a360-dp-preset').forEach(btn => {
                btn.onclick = () => {
                    const offset = parseInt(btn.getAttribute('data-offset') || '0');
                    const t = new Date();
                    t.setDate(t.getDate() + offset);
                    selectedDate = t;
                    viewYear = t.getFullYear();
                    viewMonth = t.getMonth();
                    renderCalendar();
                };
            });

            // Clicks en días
            overlay.querySelectorAll('.a360-dp-day').forEach(btn => {
                btn.onclick = () => {
                    const dStr = btn.getAttribute('data-date');
                    if (dStr) {
                        selectedDate = new Date(dStr + 'T12:00:00');
                        viewYear = selectedDate.getFullYear();
                        viewMonth = selectedDate.getMonth();
                        renderCalendar();
                    }
                };
                btn.ondblclick = () => {
                    const dStr = btn.getAttribute('data-date');
                    if (dStr) {
                        confirmSelection(dStr);
                    }
                };
            });

            // Limpiar fecha
            overlay.querySelector('#a360-dp-btn-clear').onclick = () => {
                targetInput.value = '';
                targetInput.dispatchEvent(new Event('change'));
                targetInput.dispatchEvent(new Event('input'));
                const lbl = document.getElementById('lbl-fecha-act') || document.querySelector(`[data-dp-label="${targetInput.id}"]`);
                if (lbl) lbl.textContent = 'Seleccionar fecha...';
                if (options.onSelect) options.onSelect('');
                closePicker();
            };

            // Confirmar selección
            overlay.querySelector('#a360-dp-btn-confirm').onclick = () => {
                const finalStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
                confirmSelection(finalStr);
            };
        }

        function confirmSelection(dStr) {
            targetInput.value = dStr;
            targetInput.dispatchEvent(new Event('change'));
            targetInput.dispatchEvent(new Event('input'));
            
            const lbl = document.getElementById('lbl-fecha-act') || document.querySelector(`[data-dp-label="${targetInput.id}"]`);
            if (lbl) {
                lbl.textContent = self.formatDateEs(dStr);
            }
            if (options.onSelect) options.onSelect(dStr);
            closePicker();
        }

        function closePicker() {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) closePicker();
        };

        document.body.appendChild(overlay);
        renderCalendar();
        setTimeout(() => { overlay.style.opacity = '1'; }, 10);
    }
};

// Exponer el selector de fechas en UI (el modal de actividades usa UI.formatDateEs / UI.openDatePicker)
UI.formatDateEs = Aula360Intelligence.formatDateEs;
UI.openDatePicker = Aula360Intelligence.openDatePicker;

// Desactivar autocompletado e historial emergente del navegador en todos los formularios e inputs del sistema
document.addEventListener('focusin', function(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'FORM')) {
        e.target.setAttribute('autocomplete', 'off');
        e.target.setAttribute('autocorrect', 'off');
        e.target.setAttribute('autocapitalize', 'off');
        e.target.setAttribute('spellcheck', 'false');
    }
}, true);

// ============================================================
// COPILOTO 360: ANIMACIÓN DE OJOS (REPOSO Y SEGUIMIENTO) + GIRO 180°
// ============================================================
(function() {
    function initCopilotAvatar() {
        var idleCheckTimer = null;

        function updateEyesGaze(clientX, clientY) {
            var triggers = document.querySelectorAll('.copilot-avatar-trigger');
            if (!triggers.length) return;

            triggers.forEach(function(trigger) {
                var container = trigger.querySelector('.copilot-eyes-container');
                if (!container) return;

                var rect = trigger.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return;

                var centerX = rect.left + rect.width / 2;
                var centerY = rect.top + rect.height / 2;

                var dx = clientX - centerX;
                var dy = clientY - centerY;
                var dist = Math.hypot(dx, dy) || 1;

                // Rango de movimiento sutil y natural dentro del visor (máximo ~3.2px)
                var maxDistance = Math.max(window.innerWidth || 800, window.innerHeight || 600) * 0.65;
                var factor = Math.min(dist / maxDistance, 1);
                var maxOffset = rect.width > 50 ? 5.2 : 3.2;

                var eyeX = (dx / dist) * maxOffset * factor;
                var eyeY = (dy / dist) * (maxOffset * 0.72) * factor;

                container.classList.remove('is-idle-gaze');
                container.style.transform = 'translate(' + eyeX.toFixed(2) + 'px, ' + eyeY.toFixed(2) + 'px)';
            });
        }

        // Seguimiento suave del mouse por toda la pantalla (solo cuando la pantalla está activa)
        window.addEventListener('mousemove', function(e) {
            if (document.hidden) return;
            updateEyesGaze(e.clientX, e.clientY);

            clearTimeout(idleCheckTimer);
            idleCheckTimer = setTimeout(function() {
                if (document.hidden) return;
                // Activa la animación autónoma en reposo tras 2 segundos sin mover el cursor
                document.querySelectorAll('.copilot-eyes-container').forEach(function(c) {
                    c.classList.add('is-idle-gaze');
                    c.style.transform = '';
                });
            }, 2000);
        }, { passive: true });

        // Pausar todas las animaciones CSS e hilos visuales cuando la pantalla de la tablet se apaga o pasa a segundo plano
        if (!document.getElementById('a360-battery-saver-style')) {
            var bsStyle = document.createElement('style');
            bsStyle.id = 'a360-battery-saver-style';
            bsStyle.textContent = 'body.a360-bg-sleep *, body.a360-bg-sleep *::before, body.a360-bg-sleep *::after { animation-play-state: paused !important; transition: none !important; }';
            document.head.appendChild(bsStyle);
        }
        document.addEventListener('visibilitychange', function() {
            if (document.body) {
                document.body.classList.toggle('a360-bg-sleep', document.hidden);
            }
            if (document.hidden && idleCheckTimer) {
                clearTimeout(idleCheckTimer);
                idleCheckTimer = null;
            }
        });

        // Activar animación en reposo al inicio
        document.querySelectorAll('.copilot-eyes-container').forEach(function(c) {
            c.classList.add('is-idle-gaze');
        });

        // Soporte Touch en dispositivos móviles y tablets: Giro 180° horizontal
        document.addEventListener('touchstart', function(e) {
            var trigger = e.target.closest && e.target.closest('.copilot-avatar-trigger');
            if (trigger) {
                trigger.classList.add('is-flipped');
            }
        }, { passive: true });

        document.addEventListener('touchend', function(e) {
            var trigger = e.target.closest && e.target.closest('.copilot-avatar-trigger');
            if (trigger) {
                setTimeout(function() {
                    trigger.classList.remove('is-flipped');
                }, 750);
            }
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCopilotAvatar);
    } else {
        initCopilotAvatar();
    }
})();

// Controles universales de Lupa (+) (-) para vistas de Reportes
UI._reportZoomMap = UI._reportZoomMap || {};

UI.renderReportZoomControls = function(targetId, labelId, initialZoom) {
    var z = initialZoom || (UI._reportZoomMap && UI._reportZoomMap[targetId]) || 100;
    return '<div class="report-zoom-controls no-print" style="display:inline-flex; align-items:center; gap:2px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:9px; padding:3px 5px; height:34px; box-sizing:border-box; flex-shrink:0;">' +
        '<i data-lucide="search" style="width:13px; height:13px; color:#059669; margin:0 3px;"></i>' +
        '<button type="button" onclick="UI.adjustReportZoom(\'' + targetId + '\', \'' + labelId + '\', -10)" title="Alejar vista (-)" style="width:25px; height:25px; border:1px solid #e2e8f0; background:#ffffff; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#334155; font-weight:900; font-size:14px; line-height:1; padding:0; transition:all 0.15s;" onmouseover="this.style.background=\'#ecfdf5\'; this.style.color=\'#047857\'; this.style.borderColor=\'#a7f3d0\';" onmouseout="this.style.background=\'#ffffff\'; this.style.color=\'#334155\'; this.style.borderColor=\'#e2e8f0\';">&minus;</button>' +
        '<button type="button" id="' + labelId + '" onclick="UI.adjustReportZoom(\'' + targetId + '\', \'' + labelId + '\', 0)" title="Clic para restablecer a 100%" style="min-width:44px; height:25px; border:none; background:transparent; cursor:pointer; font-size:11.5px; font-weight:800; color:#0f172a; padding:0 4px; text-align:center;">' + z + '%</button>' +
        '<button type="button" onclick="UI.adjustReportZoom(\'' + targetId + '\', \'' + labelId + '\', 10)" title="Acercar vista (+)" style="width:25px; height:25px; border:1px solid #e2e8f0; background:#ffffff; border-radius:6px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#334155; font-weight:900; font-size:14px; line-height:1; padding:0; transition:all 0.15s;" onmouseover="this.style.background=\'#ecfdf5\'; this.style.color=\'#047857\'; this.style.borderColor=\'#a7f3d0\';" onmouseout="this.style.background=\'#ffffff\'; this.style.color=\'#334155\'; this.style.borderColor=\'#e2e8f0\';">+</button>' +
    '</div>';
};

UI.adjustReportZoom = function(targetId, labelId, delta) {
    UI._reportZoomMap = UI._reportZoomMap || {};
    var current = UI._reportZoomMap[targetId] || 100;
    var next = delta === 0 ? 100 : Math.max(50, Math.min(160, current + delta));
    UI._reportZoomMap[targetId] = next;
    var el = document.getElementById(targetId);
    if (el) {
        el.style.zoom = (next / 100);
    }
    var lbl = document.getElementById(labelId);
    if (lbl) {
        lbl.textContent = next + '%';
    }
};

