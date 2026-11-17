/**
 * AutoBackup - Motor de Respaldo Local Rotativo y Protección Anti-Corrupción
 * Aula 360 HN
 * 
 * Estrategia de seguridad:
 * 1. Doble Slot Atómico (Slot A / Slot B): Evita corrupción si el dispositivo se apaga o la app se cierra durante la escritura.
 * 2. Rotación Diaria Inteligente: Mantiene snapshots diarios (máximo 5) eliminando los más viejos para proteger el almacenamiento.
 * 3. Compatibilidad Híbrida: Funciona tanto en Android nativo (@capacitor/filesystem) como en navegador web (IndexedDB/LocalStorage).
 * 4. Auto-recuperación de emergencia: Restaura el slot más reciente si la base de datos principal se corrompe o se limpia.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.AutoBackup = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const SLOT_A = 'Aula360_Backup_SlotA.json';
    const SLOT_B = 'Aula360_Backup_SlotB.json';
    const META_FILE = 'Aula360_Backup_Meta.json';
    const MAX_DAILY_BACKUPS = 5;

    const AutoBackup = {
        SLOT_A,
        SLOT_B,
        META_FILE,
        MAX_DAILY_BACKUPS,

        _lastSavedSlot: 'A',
        _isSaving: false,

        /**
         * Verifica si el entorno es Capacitor nativo con plugin Filesystem
         */
        isNativeFsAvailable() {
            return !!(
                typeof window !== 'undefined' &&
                window.Capacitor &&
                window.Capacitor.Plugins &&
                window.Capacitor.Plugins.Filesystem
            );
        },

        /**
         * Guarda de forma atómica alternando entre Slot A y Slot B.
         * Si un guardado falla a medio camino, el slot anterior queda 100% intacto.
         * @param {Object} dataObj Objeto Store.data completo
         * @returns {Promise<{success: boolean, slot: string, timestamp: number}>}
         */
        async saveAtomic(dataObj) {
            if (!dataObj) return { success: false, error: 'Datos no proporcionados' };

            let jsonString = '';
            try {
                jsonString = JSON.stringify(dataObj);
                if (jsonString.length < 50) {
                    return { success: false, error: 'Datos sospechosamente pequeños, guardado abortado por seguridad.' };
                }
            } catch (e) {
                console.error('[AutoBackup] Error serializando JSON:', e);
                return { success: false, error: e.message };
            }

            const now = Date.now();
            const targetSlot = this._lastSavedSlot === 'A' ? SLOT_B : SLOT_A;
            const slotName = this._lastSavedSlot === 'A' ? 'B' : 'A';

            // 1. Guardado en Android Nativo (Capacitor Filesystem)
            if (this.isNativeFsAvailable()) {
                const fs = window.Capacitor.Plugins.Filesystem;
                try {
                    // Escribir en el slot alterno
                    await fs.writeFile({
                        path: targetSlot,
                        data: jsonString,
                        directory: 'DATA',
                        encoding: 'utf8'
                    });

                    // Actualizar metadatos del slot activo
                    const meta = {
                        activeSlot: slotName,
                        activeFile: targetSlot,
                        timestamp: now,
                        sizeBytes: jsonString.length,
                        dateIso: new Date(now).toISOString()
                    };

                    await fs.writeFile({
                        path: META_FILE,
                        data: JSON.stringify(meta),
                        directory: 'DATA',
                        encoding: 'utf8'
                    });

                    // Actualizar también el archivo legado por retrocompatibilidad
                    fs.writeFile({
                        path: 'Aula360_Native_Backup.json',
                        data: jsonString,
                        directory: 'DATA',
                        encoding: 'utf8'
                    }).catch(() => {});

                    this._lastSavedSlot = slotName;
                    return { success: true, slot: slotName, timestamp: now };
                } catch (err) {
                    console.warn('[AutoBackup] Error en guardado nativo Filesystem:', err);
                }
            }

            // 2. Guardado en Navegador Web / IndexedDB Redundante
            if (typeof window !== 'undefined' && window.StorageAPI) {
                try {
                    await window.StorageAPI.set(`gdhndata_slot_${slotName}`, dataObj);
                    await window.StorageAPI.set('gdhndata_backup_meta', {
                        activeSlot: slotName,
                        timestamp: now
                    });
                    this._lastSavedSlot = slotName;
                    return { success: true, slot: slotName, timestamp: now };
                } catch (idbErr) {
                    console.warn('[AutoBackup] Error en guardado secundario IndexedDB:', idbErr);
                }
            }

            return { success: false, error: 'No storage engine available' };
        },

        /**
         * Genera un snapshot diario fechado y purga automáticamente respaldos viejos si exceden MAX_DAILY_BACKUPS.
         * @param {Object} dataObj
         * @returns {Promise<{success: boolean, fileName: string}>}
         */
        async saveDailySnapshot(dataObj) {
            if (!this.isNativeFsAvailable() || !dataObj) return { success: false };

            const fs = window.Capacitor.Plugins.Filesystem;
            const now = new Date();
            const pad = n => n.toString().padStart(2, '0');
            const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
            const fileName = `Respaldo_Diario_${dateStr}.json`;

            try {
                let dataToSave = '';
                if (typeof window !== 'undefined' && window.Security && typeof window.Security.encrypt === 'function') {
                    dataToSave = window.Security.encrypt(dataObj);
                } else {
                    dataToSave = JSON.stringify(dataObj);
                }

                await fs.writeFile({
                    path: fileName,
                    data: dataToSave,
                    directory: 'DATA',
                    encoding: 'utf8'
                });

                // Rotar y purgar respaldos que excedan el límite
                await this.rotateDailyBackups(MAX_DAILY_BACKUPS);

                return { success: true, fileName };
            } catch (e) {
                console.error('[AutoBackup] Error creando snapshot diario:', e);
                return { success: false, error: e.message };
            }
        },

        /**
         * Inspecciona el directorio DATA y elimina los respaldos diarios más antiguos si superan el límite configurado.
         * @param {number} maxAllowed Cantidad máxima de respaldos diarios a conservar (por defecto 5)
         */
        async rotateDailyBackups(maxAllowed = MAX_DAILY_BACKUPS) {
            if (!this.isNativeFsAvailable()) return;
            const fs = window.Capacitor.Plugins.Filesystem;

            try {
                const res = await fs.readdir({ path: '', directory: 'DATA' });
                if (!res || !res.files) return;

                // Filtrar solo los diarios
                const dailyFiles = res.files.filter(f => f.name && f.name.startsWith('Respaldo_Diario_') && f.name.endsWith('.json'));

                if (dailyFiles.length > maxAllowed) {
                    // Ordenar de más viejo a más nuevo
                    dailyFiles.sort((a, b) => a.name.localeCompare(b.name));
                    const filesToDelete = dailyFiles.slice(0, dailyFiles.length - maxAllowed);

                    for (const f of filesToDelete) {
                        try {
                            await fs.deleteFile({ path: f.name, directory: 'DATA' });
                            console.log(`[AutoBackup] Rotación: eliminado respaldo antiguo ${f.name}`);
                        } catch (delErr) {
                            console.warn(`[AutoBackup] No se pudo eliminar ${f.name}:`, delErr);
                        }
                    }
                }
            } catch (err) {
                console.warn('[AutoBackup] Error en rotación de archivos:', err);
            }
        },

        /**
         * Intenta recuperar la versión válida más reciente en caso de pérdida total en memoria/IndexedDB.
         * Inspecciona Slot A, Slot B, meta y respaldos diarios.
         * @returns {Promise<Object|null>} Objeto de datos recuperado o null
         */
        async recoverLatest() {
            // 1. Android Nativo
            if (this.isNativeFsAvailable()) {
                const fs = window.Capacitor.Plugins.Filesystem;

                // Intentar leer metadatos
                let preferredSlot = null;
                try {
                    const metaRes = await fs.readFile({ path: META_FILE, directory: 'DATA', encoding: 'utf8' });
                    if (metaRes && metaRes.data) {
                        const meta = JSON.parse(metaRes.data);
                        preferredSlot = meta.activeFile;
                    }
                } catch (e) {}

                const candidateFiles = preferredSlot 
                    ? [preferredSlot, SLOT_A, SLOT_B, 'Aula360_Native_Backup.json']
                    : [SLOT_A, SLOT_B, 'Aula360_Native_Backup.json'];

                for (const file of candidateFiles) {
                    try {
                        const fileRes = await fs.readFile({ path: file, directory: 'DATA', encoding: 'utf8' });
                        if (fileRes && fileRes.data) {
                            let parsed = null;
                            if (typeof window !== 'undefined' && window.Security) {
                                parsed = window.Security.decrypt(fileRes.data);
                            } else {
                                parsed = JSON.parse(fileRes.data);
                            }
                            const validData = parsed.datos || parsed;
                            if (validData && (validData.cursos || validData.estudiantes)) {
                                console.log(`[AutoBackup] Datos recuperados exitosamente desde ${file}`);
                                return validData;
                            }
                        }
                    } catch (e) {
                        // Continuar con el siguiente candidato
                    }
                }
            }

            // 2. Web / IndexedDB Fallback
            if (typeof window !== 'undefined' && window.StorageAPI) {
                try {
                    for (const slotKey of ['gdhndata_slot_A', 'gdhndata_slot_B']) {
                        const data = await window.StorageAPI.get(slotKey);
                        if (data && (data.cursos || data.estudiantes)) {
                            return data;
                        }
                    }
                } catch (e) {}
            }

            return null;
        }
    };

    return AutoBackup;
}));
