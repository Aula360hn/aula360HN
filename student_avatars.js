/**
 * StudentAvatars - Generador Oficial de Avatares e Insignias Escolares
 * Aula 360 HN
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.StudentAvatars = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

var StudentAvatars = {
    GIRL_IDS: ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'],
    BOY_IDS: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'],

    hash: function(str) {
        var h = 0;
        var s = String(str || 'estudiante');
        for (var i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h);
    },

    getGender: function(s) {
        if (!s) return 'M';
        var g = (s.genero || s.sexo || '').toString().trim().toUpperCase();
        if (g === 'F' || g === 'FEMENINO' || g === 'MUJER') return 'F';
        if (g === 'M' || g === 'MASCULINO' || g === 'HOMBRE') return 'M';
        var first = (s.nombreCompleto || s.nombre || '').trim().split(/\s+/)[0].toLowerCase();
        var fNames = ['carmen', 'maria', 'maría', 'ana', 'lucia', 'lucía', 'sofia', 'sofía', 'genesis', 'génesis', 
                      'valeria', 'ashley', 'alison', 'andrea', 'camila', 'daniela', 'emily', 'fernanda', 'gabriela', 
                      'isabella', 'jennifer', 'katherine', 'kimberly', 'leslie', 'meylin', 'natalia', 'olga', 
                      'paola', 'rosa', 'sandy', 'stephanie', 'wendy', 'yosselin', 'zoe', 'dayana', 'fatima', 'fátima',
                      'mariely', 'nayeli', 'karla', 'diana', 'alejandra', 'ximena', 'melany', 'ariana', 'abril'];
        if (fNames.indexOf(first) !== -1 || (first.endsWith('a') && ['joshua', 'luca', 'ezra'].indexOf(first) === -1)) return 'F';
        return 'M';
    },

    getDefaultAvatarId: function(s) {
        var isF = this.getGender(s) === 'F';
        var list = isF ? this.GIRL_IDS : this.BOY_IDS;
        var h = this.hash((s && (s.id || s.nombreCompleto)) || 'alumno');
        return list[h % list.length];
    },

    getAvatarId: function(s) {
        if (s && s.avatarId && this.BANK[s.avatarId]) {
            return s.avatarId;
        }
        return 'default';
    },

    getDefaultProfileIconSvg: function(size) {
        size = size || 24;
        return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" style="width:' + size + 'px; height:' + size + 'px; border-radius:50%; display:inline-block; vertical-align:middle; flex-shrink:0; box-shadow:0 1px 4px rgba(15,23,42,0.12); background:#ffffff;" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="50" cy="50" r="49" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>' +
            '<circle cx="50" cy="30.5" r="14.5" fill="#0044b5"/>' +
            '<path d="M 22 73 C 22 57, 32 50, 45 50 L 49 50 C 58 50, 64 56, 64 66 L 64 75 C 64 78.5, 61.5 80.5, 58 80.5 L 27.5 80.5 C 24 80.5, 22 78.5, 22 75 Z" fill="#7da7f7"/>' +
            '<path d="M 51 50 L 55 50 C 68 50, 78 57, 78 73 L 78 75 C 78 78.5, 76 80.5, 72.5 80.5 L 42 80.5 C 38.5 80.5, 36 78.5, 36 75 L 36 66 C 36 56, 42 50, 51 50 Z" fill="#477ef2"/>' +
            '<path d="M 48.5 50 L 51.5 50 C 59 50, 64 56, 64 66 L 64 75 C 64 78.5, 61.5 80.5, 58 80.5 L 42 80.5 C 38.5 80.5, 36 78.5, 36 75 L 36 66 C 36 56, 41 50, 48.5 50 Z" fill="#0044b5"/>' +
        '</svg>';
    },

    getAvatarSvg: function(s, size) {
        size = size || 24;
        if (typeof s === 'string') {
            if (s === 'default' || !this.BANK[s]) {
                return this.getDefaultProfileIconSvg(size);
            }
            var avById = this.BANK[s];
            return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" style="width:' + size + 'px; height:' + size + 'px; border-radius:50%; display:inline-block; vertical-align:middle; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.12); background:' + avById.bg + ';" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="50" cy="50" r="49" fill="' + avById.bg + '"/>' +
                avById.render(avById.skin, avById.hair, avById.bg) +
            '</svg>';
        }
        if (s && s.avatarId && this.BANK[s.avatarId]) {
            var av = this.BANK[s.avatarId];
            return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" style="width:' + size + 'px; height:' + size + 'px; border-radius:50%; display:inline-block; vertical-align:middle; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.12); background:' + av.bg + ';" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="50" cy="50" r="49" fill="' + av.bg + '"/>' +
                av.render(av.skin, av.hair, av.bg) +
            '</svg>';
        }
        return this.getDefaultProfileIconSvg(size);
    },

    getAvatarHtml: function(s, size) {
        size = size || 24;
        if (!s) return this.getDefaultProfileIconSvg(size);
        // 1. Si tiene fotografía y no está forzando un avatar de colección, mostrar fotografía
        var photo = s.fotoDataUrl || s.foto;
        if (photo && (!s.avatarId || s.avatarId === 'photo')) {
            return '<img src="' + photo + '" alt="' + (s.nombreCompleto || 'Alumno') + '" style="width:' + size + 'px; height:' + size + 'px; border-radius:50%; object-fit:cover; display:inline-block; vertical-align:middle; flex-shrink:0; box-shadow:0 1px 3px rgba(0,0,0,0.15); background:#ffffff;">';
        }
        // 2. Si tiene un avatar personalizado de la colección, mostrar avatar
        if (s.avatarId && this.BANK[s.avatarId]) {
            return this.getAvatarSvg(s.avatarId, size);
        }
        // 3. Por defecto, mostrar el icono formal azul de perfil del alumno
        return this.getDefaultProfileIconSvg(size);
    },

    openPicker: function(studentId, onSelect) {
        var s = (typeof Store !== 'undefined' && Store.get) ? Store.get('estudiantes').find(function(e) { return e.id === studentId; }) : null;
        if (!s) return;

        var isF = this.getGender(s) === 'F';
        var defaultSuggestedId = this.getDefaultAvatarId(s);
        var hasPhoto = Boolean((s.fotoDataUrl || s.foto) && (!s.avatarId || s.avatarId === 'photo'));
        var hasCustomAvatar = Boolean(s.avatarId && this.BANK[s.avatarId]);
        var isDefaultFormal = !hasPhoto && !hasCustomAvatar;
        var currentId = hasCustomAvatar ? s.avatarId : null;

        var statusLabel = '<span style="color:#0044b5; font-weight:700;">Icono Formal por Defecto</span>';
        if (hasPhoto) statusLabel = '<span style="color:#059669; font-weight:700;">Fotografía del Alumno</span>';
        else if (hasCustomAvatar) statusLabel = '<span style="color:#2563eb; font-weight:700;">Avatar Personalizado</span>';

        var modalHtml = '<div style="padding:4px 0 2px;">' +
            '<!-- Header con info del estudiante y opciones rápidas de Perfil -->' +
            '<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius:14px; border:1px solid #e2e8f0; margin-bottom:12px; flex-wrap:wrap;">' +
                '<div style="display:flex; align-items:center; gap:10px; min-width:0;">' +
                    '<div style="width:48px; height:48px; border-radius:50%; display:grid; place-items:center; flex-shrink:0; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1); background:#ffffff;">' +
                        this.getAvatarHtml(s, 48) +
                    '</div>' +
                    '<div style="min-width:0;">' +
                        '<div style="font-size:13.5px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + s.nombreCompleto + '</div>' +
                        '<div style="font-size:11px; color:#64748b; font-weight:600; margin-top:2px;">' +
                            'Sexo: <b>' + (isF ? 'Femenino' : 'Masculino') + '</b> &bull; ' + statusLabel +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">' +
                    '<button type="button" class="btn btn-sm" onclick="StudentAvatars.triggerPhotoUpload(' + String.fromCharCode(39) + studentId + String.fromCharCode(39) + ')" style="background:#0044b5; color:#ffffff; border:1.5px solid #0044b5; font-size:11px; font-weight:800; padding:6px 12px; border-radius:10px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,68,181,0.2);">' +
                        '<i data-lucide="camera" style="width:13px; height:13px;"></i> Subir Fotografía' +
                    '</button>' +
                    '<button type="button" class="btn btn-sm" onclick="StudentAvatars.suggestByGender(' + String.fromCharCode(39) + studentId + String.fromCharCode(39) + ')" style="background:#ffffff; color:#059669; border:1.5px solid #a7f3d0; font-size:11px; font-weight:800; padding:6px 11px; border-radius:10px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;">' +
                        '<i data-lucide="sparkles" style="width:13px; height:13px;"></i> Sugerir Avatar' +
                    '</button>' +
                    '<button type="button" class="btn btn-sm" onclick="StudentAvatars.resetToDefault(' + String.fromCharCode(39) + studentId + String.fromCharCode(39) + ')" style="background:#ffffff; color:#334155; border:1.5px solid #cbd5e1; font-size:11px; font-weight:800; padding:6px 11px; border-radius:10px; cursor:pointer; display:inline-flex; align-items:center; gap:5px; white-space:nowrap;" title="Usar el icono formal por defecto">' +
                        '<i data-lucide="user-check" style="width:13px; height:13px;"></i> Icono por Defecto' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<input type="file" id="student-avatar-photo-input" accept="image/*" style="display:none;" onchange="StudentAvatars.handlePhotoInputChange(this, ' + String.fromCharCode(39) + studentId + String.fromCharCode(39) + ')">' +

            '<!-- Tarjeta de Icono Formal por Defecto + Fotografía Actual -->' +
            '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-bottom:14px;">' +
                '<div onclick="StudentAvatars.resetToDefault(' + String.fromCharCode(39) + studentId + String.fromCharCode(39) + ')" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:#ffffff; border:' + (isDefaultFormal ? '2px solid #0044b5' : '1.5px solid #e2e8f0') + '; border-radius:12px; cursor:pointer; position:relative; box-shadow:' + (isDefaultFormal ? '0 3px 10px rgba(0,68,181,0.12)' : 'none') + ';">' +
                    this.getDefaultProfileIconSvg(40) +
                    '<div style="min-width:0; flex:1;">' +
                        '<div style="font-size:12px; font-weight:800; color:#0f172a;">Icono Formal por Defecto</div>' +
                        '<div style="font-size:10.5px; color:#64748b; font-weight:600;">Perfil institucional estándar</div>' +
                    '</div>' +
                    (isDefaultFormal ? '<span style="font-size:10px; font-weight:900; background:#dbeafe; color:#0044b5; padding:2px 7px; border-radius:999px;">Activo</span>' : '') +
                '</div>' +
                '<div onclick="StudentAvatars.triggerPhotoUpload(' + String.fromCharCode(39) + studentId + String.fromCharCode(39) + ')" style="display:flex; align-items:center; gap:10px; padding:10px 12px; background:#ffffff; border:' + (hasPhoto ? '2px solid #059669' : '1.5px dashed #cbd5e1') + '; border-radius:12px; cursor:pointer; position:relative; box-shadow:' + (hasPhoto ? '0 3px 10px rgba(5,150,105,0.12)' : 'none') + ';">' +
                    (hasPhoto ? '<img src="' + (s.fotoDataUrl || s.foto) + '" style="width:40px; height:40px; border-radius:50%; object-fit:cover; flex-shrink:0; border:1px solid #cbd5e1;">' : '<div style="width:40px; height:40px; border-radius:50%; background:#f1f5f9; color:#0044b5; display:grid; place-items:center; flex-shrink:0;"><i data-lucide="camera" style="width:18px; height:18px;"></i></div>') +
                    '<div style="min-width:0; flex:1;">' +
                        '<div style="font-size:12px; font-weight:800; color:#0f172a;">' + (hasPhoto ? 'Cambiar Fotografía' : 'Usar Fotografía') + '</div>' +
                        '<div style="font-size:10.5px; color:#64748b; font-weight:600;">Subir desde galería o cámara</div>' +
                    '</div>' +
                    (hasPhoto ? '<span style="font-size:10px; font-weight:900; background:#dcfce7; color:#15803d; padding:2px 7px; border-radius:999px;">Activa</span>' : '') +
                '</div>' +
            '</div>' +

            '<!-- Filtros de Categorías de Avatares -->' +
            '<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; flex-wrap:wrap;">' +
                '<div style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.04em;">O elige un avatar de la colección:</div>' +
                '<div style="display:flex; align-items:center; gap:6px;">' +
                    '<button type="button" id="av-filter-all" onclick="StudentAvatars.filterGrid(' + String.fromCharCode(39) + 'all' + String.fromCharCode(39) + ')" style="background:#2563eb; color:#ffffff; border:none; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:800; cursor:pointer;">Todos (16)</button>' +
                    '<button type="button" id="av-filter-girls" onclick="StudentAvatars.filterGrid(' + String.fromCharCode(39) + 'girls' + String.fromCharCode(39) + ')" style="background:#f1f5f9; color:#475569; border:none; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; cursor:pointer;">Femenino (8)</button>' +
                    '<button type="button" id="av-filter-boys" onclick="StudentAvatars.filterGrid(' + String.fromCharCode(39) + 'boys' + String.fromCharCode(39) + ')" style="background:#f1f5f9; color:#475569; border:none; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; cursor:pointer;">Masculino (8)</button>' +
                '</div>' +
            '</div>' +

            '<!-- Grid del Banco de Avatares -->' +
            '<div id="av-grid-container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(96px, 1fr)); gap:10px; max-height:310px; overflow-y:auto; padding:4px 2px;">';

        var allIds = this.GIRL_IDS.concat(this.BOY_IDS);
        for (var i = 0; i < allIds.length; i++) {
            var aid = allIds[i];
            var av = this.BANK[aid];
            var isSelected = (aid === currentId);
            var isSuggested = (aid === defaultSuggestedId);
            var isGirl = (av.gender === 'F');

            modalHtml += '<div class="av-picker-item av-gender-' + (isGirl ? 'girl' : 'boy') + '" data-gender="' + av.gender + '" onclick="StudentAvatars.selectAvatar(' + String.fromCharCode(39) + studentId + String.fromCharCode(39) + ', ' + String.fromCharCode(39) + aid + String.fromCharCode(39) + ')" ' +
                'style="background:#ffffff; border:' + (isSelected ? '2.5px solid #2563eb' : '1.5px solid #e2e8f0') + '; border-radius:14px; padding:10px 6px; text-align:center; display:flex; flex-direction:column; align-items:center; cursor:pointer; position:relative; transition:all 0.18s; box-shadow:' + (isSelected ? '0 4px 12px rgba(37,99,235,0.18)' : '0 1px 3px rgba(0,0,0,0.02)') + ';" ' +
                'onmouseover="if(!' + isSelected + '){this.style.borderColor=\'#93c5fd\'; this.style.transform=\'translateY(-2px)\';}" ' +
                'onmouseout="if(!' + isSelected + '){this.style.borderColor=\'#e2e8f0\'; this.style.transform=\'none\';}">' +
                
                (isSelected ? '<div style="position:absolute; top:4px; right:4px; width:18px; height:18px; border-radius:50%; background:#2563eb; color:#fff; display:grid; place-items:center; font-size:10px; font-weight:900;">✓</div>' : '') +
                (!isSelected && isSuggested ? '<div style="position:absolute; top:4px; right:4px; font-size:9px; background:#dcfce7; color:#15803d; font-weight:800; padding:1px 5px; border-radius:999px;">Sugerido</div>' : '') +

                '<div style="margin-top:2px;">' + this.getAvatarSvg(aid, 50) + '</div>' +
                '<div style="font-size:11.5px; font-weight:800; color:#0f172a; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">' + av.name + '</div>' +
                '<div style="font-size:9.5px; color:' + (isGirl ? '#db2777' : '#0284c7') + '; font-weight:700; margin-top:2px;">' + (isGirl ? 'Femenino' : 'Masculino') + '</div>' +
            '</div>';
        }

        modalHtml += '</div>' +
            '<div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid #f1f5f9;">' +
                '<div style="font-size:11px; color:#64748b; font-weight:600;">' +
                    '<i data-lucide="info" style="width:12px; height:12px; vertical-align:-1px; margin-right:3px;"></i> Puedes usar el icono formal por defecto, subir una foto o elegir un avatar.' +
                '</div>' +
                '<button type="button" class="btn btn-secondary btn-sm" onclick="UI.closeModal()" style="border-radius:10px; padding:6px 16px; font-weight:700;">Cerrar</button>' +
            '</div>' +
        '</div>';

        UI.modal('<i data-lucide="user-circle" style="width:18px; margin-right:6px; vertical-align:-2px; color:#0044b5;"></i> Imagen de Perfil del Estudiante', modalHtml);
        if (window.lucide) window.lucide.createIcons();
    },

    filterGrid: function(filter) {
        var items = document.querySelectorAll('.av-picker-item');
        items.forEach(function(el) {
            var g = el.getAttribute('data-gender');
            if (filter === 'all') {
                el.style.display = 'flex';
            } else if (filter === 'girls') {
                el.style.display = (g === 'F') ? 'flex' : 'none';
            } else if (filter === 'boys') {
                el.style.display = (g === 'M') ? 'flex' : 'none';
            }
        });
        var bAll = document.getElementById('av-filter-all');
        var bGirls = document.getElementById('av-filter-girls');
        var bBoys = document.getElementById('av-filter-boys');
        if (bAll) {
            bAll.style.background = (filter === 'all') ? '#2563eb' : '#f1f5f9';
            bAll.style.color = (filter === 'all') ? '#ffffff' : '#475569';
        }
        if (bGirls) {
            bGirls.style.background = (filter === 'girls') ? '#db2777' : '#f1f5f9';
            bGirls.style.color = (filter === 'girls') ? '#ffffff' : '#475569';
        }
        if (bBoys) {
            bBoys.style.background = (filter === 'boys') ? '#0284c7' : '#f1f5f9';
            bBoys.style.color = (filter === 'boys') ? '#ffffff' : '#475569';
        }
    },

    selectAvatar: function(studentId, avatarId) {
        if (typeof Store !== 'undefined' && Store.update) {
            Store.update('estudiantes', studentId, { avatarId: avatarId });
            Store.save();
        }
        if (typeof UI !== 'undefined' && UI.toast) {
            var av = this.BANK[avatarId];
            UI.toast('Avatar "' + (av ? av.name : avatarId) + '" asignado con éxito', 'success');
        }
        if (typeof UI !== 'undefined' && UI.closeModal) {
            UI.closeModal();
        }
        this.refreshActiveViews(studentId);
    },

    suggestByGender: function(studentId) {
        var s = (typeof Store !== 'undefined' && Store.get) ? Store.get('estudiantes').find(function(e) { return e.id === studentId; }) : null;
        if (!s) return;
        var suggestedId = this.getDefaultAvatarId(s);
        this.selectAvatar(studentId, suggestedId);
    },

    resetToDefault: function(studentId) {
        if (typeof Store !== 'undefined' && Store.update) {
            var s = Store.get('estudiantes').find(function(e) { return e.id === studentId; });
            if (s) {
                delete s.avatarId;
                delete s.fotoDataUrl;
                delete s.foto;
                Store.update('estudiantes', studentId, { avatarId: null, fotoDataUrl: '', foto: '' });
                Store.save();
            }
        }
        if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast('Se restableció el icono formal por defecto', 'info');
        }
        if (typeof UI !== 'undefined' && UI.closeModal) {
            UI.closeModal();
        }
        this.refreshActiveViews(studentId);
    },

    triggerPhotoUpload: async function(studentId) {
        var self = this;
        try {
            if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                var Camera = window.Capacitor.Plugins && window.Capacitor.Plugins.Camera;
                if (Camera) {
                    var image = await Camera.getPhoto({
                        quality: 85,
                        allowEditing: false,
                        resultType: 'dataUrl',
                        source: 'PROMPT'
                    });
                    if (image && image.dataUrl) {
                        self.savePhotoDataUrl(studentId, image.dataUrl);
                        return;
                    }
                }
            }
        } catch (err) {
            if (err && err.message && err.message.indexOf('cancelled') !== -1) return;
        }
        var input = document.getElementById('student-avatar-photo-input') || document.getElementById('ficha-photo-input');
        if (input) {
            input.click();
        }
    },

    handlePhotoInputChange: function(input, studentId) {
        var self = this;
        var file = input && input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            var rawDataUrl = e.target.result;
            // Comprimir/redimensionar imagen a máx 360x360 para proteger el almacenamiento local
            var img = new Image();
            img.onload = function() {
                var canvas = document.createElement('canvas');
                var maxDim = 360;
                var w = img.width;
                var h = img.height;
                if (w > h && w > maxDim) {
                    h = Math.round(h * (maxDim / w));
                    w = maxDim;
                } else if (h >= w && h > maxDim) {
                    w = Math.round(w * (maxDim / h));
                    h = maxDim;
                }
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                var compressed = canvas.toDataURL('image/jpeg', 0.85);
                self.savePhotoDataUrl(studentId, compressed);
            };
            img.onerror = function() {
                self.savePhotoDataUrl(studentId, rawDataUrl);
            };
            img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
    },

    savePhotoDataUrl: function(studentId, dataUrl) {
        if (typeof Store !== 'undefined' && Store.update) {
            var s = Store.get('estudiantes').find(function(e) { return e.id === studentId; });
            if (s) delete s.avatarId;
            Store.update('estudiantes', studentId, { fotoDataUrl: dataUrl, foto: dataUrl, avatarId: null });
            Store.save();
        }
        if (typeof UI !== 'undefined' && UI.toast) {
            UI.toast('Fotografía del estudiante guardada correctamente', 'success');
        }
        if (typeof UI !== 'undefined' && UI.closeModal) {
            UI.closeModal();
        }
        this.refreshActiveViews(studentId);
    },

    refreshActiveViews: function(studentId) {
        // Si la ficha integral está abierta en pantalla, actualizarla
        if (document.getElementById('ficha-screen') && typeof Views !== 'undefined' && Views.Estudiantes && Views.Estudiantes.showFicha) {
            Views.Estudiantes.showFicha(studentId, window._gdhnNavList);
        }
        // Si estamos en la tabla del directorio de estudiantes
        if (document.querySelector('.e-table') && typeof Views !== 'undefined' && Views.Estudiantes && Views.Estudiantes.render) {
            Views.Estudiantes.render();
        }
        // Si estamos en cuadro de calificaciones
        if (document.getElementById('cuadro-container') && typeof Views !== 'undefined' && Views.Cuadro && Views.Cuadro.render) {
            Views.Cuadro.render();
        }
        // Si estamos en el módulo de conducta
        if (document.getElementById('conducta-students-grid') && typeof Views !== 'undefined' && Views.Conducta && Views.Conducta.render) {
            Views.Conducta.render();
        }
    },

    BANK: {
    // 8 GIRLS (Top Row)
    g1: {
        id: 'g1',
        gender: 'F',
        name: 'Camila',
        desc: 'Rubia con diadema floral y polo verde',
        bg: '#f0fdf4',
        skin: '#fed7aa',
        hair: '#eab308',
        render: function(skin, hair, bg) {
            return `
                <!-- Background hair -->
                <path d="M22 34 C18 55, 18 80, 26 95 C34 98, 42 96, 44 88 C40 70, 36 50, 36 34 Z" fill="${hair}"/>
                <path d="M20 40 C14 55, 16 75, 23 88 C20 72, 22 55, 28 42 Z" fill="#ca8a04" opacity="0.3"/>
                <!-- Torso / Polo verde -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#4ade80"/>
                <path d="M42 74 L52 88 L46 74 Z" fill="#22c55e"/>
                <path d="M62 74 L52 88 L58 74 Z" fill="#22c55e"/>
                <circle cx="52" cy="92" r="1.5" fill="#15803d"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.38"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#a16207" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#a16207" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <!-- Front Hair -->
                <path d="M38 28 C44 18, 62 16, 68 24 C62 20, 52 21, 46 27 C42 33, 40 40, 38 42 Z" fill="${hair}"/>
                <path d="M34 26 C42 16, 60 16, 70 24 C72 26, 65 33, 62 33 C56 26, 44 26, 36 34 Z" fill="${hair}"/>
                <!-- Floral Headband -->
                <path d="M36 30 C42 21, 56 19, 68 24" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <circle cx="45" cy="23" r="2.2" fill="#c084fc"/>
                <circle cx="45" cy="23" r="0.8" fill="#facc15"/>
                <circle cx="55" cy="20" r="2.2" fill="#c084fc"/>
                <circle cx="55" cy="20" r="0.8" fill="#facc15"/>
                <circle cx="64" cy="22" r="2.2" fill="#c084fc"/>
                <circle cx="64" cy="22" r="0.8" fill="#facc15"/>
            `;
        }
    },

    g2: {
        id: 'g2',
        gender: 'F',
        name: 'Valeria',
        desc: 'Afro rizado con bandana naranja y lazo',
        bg: '#fff7ed',
        skin: '#d97706',
        hair: '#292524',
        render: function(skin, hair, bg) {
            return `
                <!-- Background Afro Puffs -->
                <circle cx="28" cy="30" r="10" fill="${hair}"/>
                <circle cx="24" cy="42" r="10" fill="${hair}"/>
                <circle cx="28" cy="54" r="9" fill="${hair}"/>
                <circle cx="36" cy="22" r="10" fill="${hair}"/>
                <circle cx="46" cy="18" r="9" fill="${hair}"/>
                <!-- Torso / Orange sweater -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#ea580c"/>
                <path d="M44 74 Q52 79 60 74" fill="none" stroke="#c2410c" stroke-width="2.5" stroke-linecap="round"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.12"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#fb7185" opacity="0.45"/>
                <path d="M60 41 Q62 43 60 44" stroke="#78350f" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#7f1d1d" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#1c1917" stroke-width="1.4" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#1c1917" stroke-width="1.4" stroke-linecap="round" fill="none"/>
                <!-- Front hairline & texture -->
                <path d="M38 34 C44 26, 52 24, 60 26 C64 27, 65 32, 60 32 C54 28, 46 29, 40 36 Z" fill="${hair}"/>
                <!-- Orange Bandana with Bunny Knot -->
                <path d="M38 33 C44 23, 56 22, 66 26" stroke="#f59e0b" stroke-width="4.5" stroke-linecap="round" fill="none"/>
                <!-- Bandana Bow Ears -->
                <path d="M54 20 C52 14, 46 13, 49 19 Z" fill="#f59e0b"/>
                <path d="M57 19 C61 13, 67 14, 62 20 Z" fill="#f59e0b"/>
                <circle cx="55" cy="20" r="2.2" fill="#d97706"/>
            `;
        }
    },

    g3: {
        id: 'g3',
        gender: 'F',
        name: 'Sofía',
        desc: 'Chongo alto castaño y camiseta amarilla',
        bg: '#fefce8',
        skin: '#fed7aa',
        hair: '#9a3412',
        render: function(skin, hair, bg) {
            return `
                <!-- Top High Bun -->
                <circle cx="34" cy="18" r="9" fill="${hair}"/>
                <circle cx="32" cy="16" r="7.5" fill="#7c2d12" opacity="0.3"/>
                <!-- Torso / Yellow tee -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#facc15"/>
                <path d="M44 74 Q52 79 60 74" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.38"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#7c2d12" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#7c2d12" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <!-- Hair pulled up into bun with side swept bangs -->
                <path d="M36 38 C34 22, 54 18, 68 26 C62 24, 48 24, 38 34 Z" fill="${hair}"/>
                <path d="M38 28 C46 22, 58 22, 68 28 C64 33, 56 34, 46 32 C40 31, 38 36, 36 40 Z" fill="${hair}"/>
                <path d="M34 26 Q36 21 38 18" stroke="#7c2d12" stroke-width="2" fill="none"/>
            `;
        }
    },

    g4: {
        id: 'g4',
        gender: 'F',
        name: 'Mía',
        desc: 'Dos chonguitos turquesa y suéter morado',
        bg: '#fdf4ff',
        skin: '#fed7aa',
        hair: '#06b6d4',
        render: function(skin, hair, bg) {
            return `
                <!-- Twin Space Buns (Turquoise) -->
                <circle cx="28" cy="22" r="8" fill="${hair}"/>
                <circle cx="56" cy="18" r="8" fill="${hair}"/>
                <circle cx="28" cy="22" r="6" fill="#0891b2" opacity="0.3"/>
                <circle cx="56" cy="18" r="6" fill="#0891b2" opacity="0.3"/>
                <!-- Torso / Purple striped sweater -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#9333ea"/>
                <path d="M28 82 Q52 86 76 82" stroke="#e879f9" stroke-width="2.5" fill="none"/>
                <path d="M25 90 Q52 94 79 90" stroke="#e879f9" stroke-width="2.5" fill="none"/>
                <path d="M22 98 Q52 102 82 98" stroke="#e879f9" stroke-width="2.5" fill="none"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.38"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#0891b2" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#0891b2" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <!-- Front Hair / Bangs (Mint/Turquoise) -->
                <path d="M36 32 C38 20, 52 18, 66 26 C60 22, 50 22, 44 26 C40 28, 36 34, 34 38 Z" fill="#67e8f9"/>
                <path d="M44 24 C52 22, 60 24, 68 30 C64 34, 58 35, 50 32 Z" fill="${hair}"/>
            `;
        }
    },

    g5: {
        id: 'g5',
        gender: 'F',
        name: 'Emma',
        desc: 'Pelirroja con trenza de lado y cuello Peter Pan',
        bg: '#fff1f2',
        skin: '#fed7aa',
        hair: '#ea580c',
        render: function(skin, hair, bg) {
            return `
                <!-- Side Braid draped over shoulder -->
                <path d="M36 48 C34 60, 32 75, 30 88 C32 92, 36 92, 38 88 C38 75, 40 60, 42 50 Z" fill="${hair}"/>
                <circle cx="34" cy="62" r="3" fill="#c2410c" opacity="0.3"/>
                <circle cx="33" cy="72" r="3" fill="#c2410c" opacity="0.3"/>
                <circle cx="31" cy="82" r="2.5" fill="#c2410c" opacity="0.3"/>
                <circle cx="30" cy="88" r="3" fill="#ec4899"/>
                <!-- Torso / Coral red blouse with Peter Pan collar -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#ef4444"/>
                <!-- Peter Pan Collar (White) -->
                <path d="M44 74 C42 80, 48 83, 52 83 C52 78, 50 74, 44 74 Z" fill="#ffffff"/>
                <path d="M60 74 C62 80, 56 83, 52 83 C52 78, 54 74, 60 74 Z" fill="#ffffff"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.38"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#c2410c" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#c2410c" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <!-- Straight bangs & Bob back -->
                <path d="M36 34 C36 18, 54 16, 68 24 C72 32, 68 38, 64 36 C58 32, 54 32, 46 32 C40 32, 38 36, 36 34 Z" fill="${hair}"/>
                <path d="M38 24 C44 20, 56 20, 64 24" stroke="#c2410c" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            `;
        }
    },

    g6: {
        id: 'g6',
        gender: 'F',
        name: 'Lucía',
        desc: 'Chongo castaño oscuro y top azul de lunares',
        bg: '#eff6ff',
        skin: '#fed7aa',
        hair: '#3b2219',
        render: function(skin, hair, bg) {
            return `
                <!-- Neat High Bun with Pink Ribbon -->
                <circle cx="33" cy="20" r="9" fill="${hair}"/>
                <path d="M35 22 Q40 18 43 25" stroke="#ec4899" stroke-width="3" stroke-linecap="round" fill="none"/>
                <!-- Torso / Blue polka dot top -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#2563eb"/>
                <circle cx="34" cy="84" r="1.5" fill="#ffffff"/>
                <circle cx="48" cy="82" r="1.5" fill="#ffffff"/>
                <circle cx="62" cy="82" r="1.5" fill="#ffffff"/>
                <circle cx="72" cy="86" r="1.5" fill="#ffffff"/>
                <circle cx="40" cy="92" r="1.5" fill="#ffffff"/>
                <circle cx="56" cy="92" r="1.5" fill="#ffffff"/>
                <circle cx="68" cy="94" r="1.5" fill="#ffffff"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.38"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#29150d" stroke-width="1.4" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#29150d" stroke-width="1.4" stroke-linecap="round" fill="none"/>
                <!-- Straight bangs across forehead -->
                <path d="M36 36 C34 22, 54 18, 68 26 C64 34, 58 35, 48 35 C42 35, 38 37, 36 36 Z" fill="${hair}"/>
                <line x1="46" y1="26" x2="46" y2="34" stroke="#1f100a" stroke-width="1" opacity="0.4"/>
                <line x1="56" y1="26" x2="56" y2="34" stroke="#1f100a" stroke-width="1" opacity="0.4"/>
            `;
        }
    },

    g7: {
        id: 'g7',
        gender: 'F',
        name: 'Zoe',
        desc: 'Dos coletas con lazos azules y overol',
        bg: '#ecfeff',
        skin: '#fed7aa',
        hair: '#b45309',
        render: function(skin, hair, bg) {
            return `
                <!-- Twin Pigtails with Blue Bows -->
                <circle cx="28" cy="22" r="7.5" fill="${hair}"/>
                <path d="M28 20 C23 20, 21 26, 26 28 C30 28, 30 22, 28 20 Z" fill="#38bdf8"/>
                <circle cx="56" cy="18" r="7.5" fill="${hair}"/>
                <path d="M56 16 C51 16, 49 22, 54 24 C58 24, 58 18, 56 16 Z" fill="#38bdf8"/>
                <!-- Torso / Yellow tee with Blue Overalls -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#facc15"/>
                <!-- Denim Dungarees / Overalls -->
                <path d="M34 100 L34 85 L44 85 L44 100 Z" fill="#0284c7"/>
                <path d="M60 100 L60 85 L70 85 L70 100 Z" fill="#0284c7"/>
                <rect x="38" y="90" width="28" height="10" rx="3" fill="#0284c7"/>
                <circle cx="39" cy="87" r="1.5" fill="#fde047"/>
                <circle cx="65" cy="87" r="1.5" fill="#fde047"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.38"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#92400e" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#92400e" stroke-width="1.3" stroke-linecap="round" fill="none"/>
                <!-- Front hairline parted in middle -->
                <path d="M36 34 C36 20, 50 18, 66 26 C62 31, 54 32, 48 30 C44 32, 38 36, 36 34 Z" fill="${hair}"/>
            `;
        }
    },

    g8: {
        id: 'g8',
        gender: 'F',
        name: 'Abril',
        desc: 'Afro rosa con lazo azul y top de lunares',
        bg: '#fdf2f8',
        skin: '#fcd34d',
        hair: '#db2777',
        render: function(skin, hair, bg) {
            return `
                <!-- Big Pink Afro Cloud -->
                <circle cx="26" cy="28" r="11" fill="${hair}"/>
                <circle cx="20" cy="40" r="11" fill="${hair}"/>
                <circle cx="24" cy="52" r="10" fill="${hair}"/>
                <circle cx="34" cy="18" r="10" fill="${hair}"/>
                <circle cx="48" cy="14" r="10" fill="${hair}"/>
                <circle cx="60" cy="18" r="9" fill="${hair}"/>
                <!-- Torso / Yellow dotted top -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#facc15"/>
                <circle cx="34" cy="84" r="1.5" fill="#ea580c"/>
                <circle cx="48" cy="82" r="1.5" fill="#ea580c"/>
                <circle cx="62" cy="82" r="1.5" fill="#ea580c"/>
                <circle cx="72" cy="86" r="1.5" fill="#ea580c"/>
                <circle cx="40" cy="92" r="1.5" fill="#ea580c"/>
                <circle cx="56" cy="92" r="1.5" fill="#ea580c"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.45"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes & Lashes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <path d="M51 35.5 L53.5 34" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M65 33.5 L68 32" stroke="#1c1917" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M66 35 L68.5 34.5" stroke="#1c1917" stroke-width="1" stroke-linecap="round"/>
                <path d="M47 32 Q51 29 55 31" stroke="#9d174d" stroke-width="1.4" stroke-linecap="round" fill="none"/>
                <path d="M61 30 Q65 27 68 29" stroke="#9d174d" stroke-width="1.4" stroke-linecap="round" fill="none"/>
                <!-- Front hairline & Blue Headband -->
                <path d="M38 34 C44 26, 52 24, 60 26 C64 27, 65 32, 60 32 C54 28, 46 29, 40 36 Z" fill="${hair}"/>
                <path d="M36 31 C42 21, 56 19, 66 25" stroke="#0284c7" stroke-width="4" stroke-linecap="round" fill="none"/>
                <path d="M54 18 C52 13, 46 12, 49 17 Z" fill="#0284c7"/>
                <path d="M57 17 C61 12, 67 13, 62 18 Z" fill="#0284c7"/>
            `;
        }
    },

    // 8 BOYS (Bottom Row)
    b1: {
        id: 'b1',
        gender: 'M',
        name: 'Mateo',
        desc: 'Fade lateral con flequillo texturizado y rayas rojas',
        bg: '#fee2e2',
        skin: '#fed7aa',
        hair: '#451a03',
        render: function(skin, hair, bg) {
            return `
                <!-- Side buzz fade with texture dots -->
                <path d="M36 44 C34 32, 40 24, 48 22 L46 36 Z" fill="#fed7aa"/>
                <circle cx="38" cy="34" r="0.9" fill="${hair}" opacity="0.6"/>
                <circle cx="41" cy="31" r="0.9" fill="${hair}" opacity="0.6"/>
                <circle cx="44" cy="28" r="0.9" fill="${hair}" opacity="0.6"/>
                <circle cx="39" cy="38" r="0.9" fill="${hair}" opacity="0.6"/>
                <circle cx="42" cy="35" r="0.9" fill="${hair}" opacity="0.6"/>
                <!-- Torso / Red & White striped tee -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#ef4444"/>
                <path d="M28 82 Q52 86 76 82" stroke="#ffffff" stroke-width="2.5" fill="none"/>
                <path d="M25 90 Q52 94 79 90" stroke="#ffffff" stroke-width="2.5" fill="none"/>
                <path d="M22 98 Q52 102 82 98" stroke="#ffffff" stroke-width="2.5" fill="none"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.35"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 55 64 48 Z" fill="#991b1b"/>
                <path d="M56 48.5 Q59 51 62 48.5" fill="#ffffff"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Spiky Swept Hair on Top -->
                <path d="M44 26 C46 14, 58 12, 68 22 C64 21, 56 22, 52 24 C62 17, 68 18, 72 26 C68 28, 62 30, 56 30 C50 30, 46 28, 44 26 Z" fill="${hair}"/>
                <path d="M48 22 L52 16 L56 20 L60 14 L64 20 L68 16 L72 24 Z" fill="${hair}"/>
            `;
        }
    },

    b2: {
        id: 'b2',
        gender: 'M',
        name: 'Lucas',
        desc: 'Degradado con tupé castaño y chaqueta azul',
        bg: '#eff6ff',
        skin: '#fed7aa',
        hair: '#78350f',
        render: function(skin, hair, bg) {
            return `
                <!-- Side buzz fade -->
                <circle cx="39" cy="34" r="0.9" fill="${hair}" opacity="0.6"/>
                <circle cx="42" cy="31" r="0.9" fill="${hair}" opacity="0.6"/>
                <circle cx="45" cy="28" r="0.9" fill="${hair}" opacity="0.6"/>
                <circle cx="40" cy="38" r="0.9" fill="${hair}" opacity="0.6"/>
                <!-- Torso / Blue jacket over yellow tee -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#2563eb"/>
                <path d="M44 74 L52 86 L60 74 Z" fill="#facc15"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.35"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Swept chestnut quiff -->
                <path d="M42 26 C44 14, 58 12, 70 20 C74 24, 68 28, 62 26 C54 24, 48 26, 42 26 Z" fill="${hair}"/>
                <path d="M46 22 C52 16, 62 16, 72 22 C66 24, 58 24, 52 24 Z" fill="#92400e"/>
            `;
        }
    },

    b3: {
        id: 'b3',
        gender: 'M',
        name: 'Santiago',
        desc: 'Castaño peinado hacia atrás con camisa y overol',
        bg: '#fefce8',
        skin: '#fed7aa',
        hair: '#292524',
        render: function(skin, hair, bg) {
            return `
                <!-- Torso / Yellow shirt with blue dungarees -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#facc15"/>
                <!-- White collar -->
                <path d="M44 74 L52 82 L48 74 Z" fill="#ffffff"/>
                <path d="M60 74 L52 82 L56 74 Z" fill="#ffffff"/>
                <!-- Blue Suspender Straps -->
                <path d="M34 100 L34 82 L42 82 L42 100 Z" fill="#2563eb"/>
                <path d="M62 100 L62 82 L70 82 L70 100 Z" fill="#2563eb"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.35"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Slicked back styled hair -->
                <path d="M36 34 C36 18, 54 12, 68 20 C72 26, 68 30, 60 28 C50 26, 42 28, 36 34 Z" fill="${hair}"/>
                <path d="M46 16 L50 10 L54 15 L58 11 L62 16 Z" fill="${hair}"/>
            `;
        }
    },

    b4: {
        id: 'b4',
        gender: 'M',
        name: 'Leo',
        desc: 'Rubio rizado con camiseta verde a rayas',
        bg: '#f0fdf4',
        skin: '#fed7aa',
        hair: '#facc15',
        render: function(skin, hair, bg) {
            return `
                <!-- Curly Mop of Hair (Golden Blonde) -->
                <circle cx="34" cy="22" r="7.5" fill="${hair}"/>
                <circle cx="44" cy="18" r="8" fill="${hair}"/>
                <circle cx="56" cy="17" r="8" fill="${hair}"/>
                <circle cx="66" cy="22" r="7.5" fill="${hair}"/>
                <circle cx="30" cy="32" r="7" fill="${hair}"/>
                <circle cx="28" cy="42" r="6.5" fill="${hair}"/>
                <!-- Torso / Green striped tee -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#84cc16"/>
                <path d="M28 82 Q52 86 76 82" stroke="#bef264" stroke-width="2.5" fill="none"/>
                <path d="M25 90 Q52 94 79 90" stroke="#bef264" stroke-width="2.5" fill="none"/>
                <path d="M22 98 Q52 102 82 98" stroke="#bef264" stroke-width="2.5" fill="none"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.35"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="#a16207" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="#a16207" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Front Curly Fringe -->
                <circle cx="40" cy="28" r="5" fill="${hair}"/>
                <circle cx="50" cy="26" r="5.5" fill="${hair}"/>
                <circle cx="60" cy="27" r="5" fill="${hair}"/>
                <circle cx="67" cy="32" r="4.5" fill="${hair}"/>
            `;
        }
    },

    b5: {
        id: 'b5',
        gender: 'M',
        name: 'Sebastián',
        desc: 'Castaño texturizado con suéter morado de confeti',
        bg: '#faf5ff',
        skin: '#fed7aa',
        hair: '#1c1917',
        render: function(skin, hair, bg) {
            return `
                <!-- Torso / Purple confetti sweater -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#7c3aed"/>
                <circle cx="34" cy="84" r="1.3" fill="#f472b6"/>
                <circle cx="46" cy="82" r="1.3" fill="#38bdf8"/>
                <circle cx="58" cy="82" r="1.3" fill="#fde047"/>
                <circle cx="70" cy="86" r="1.3" fill="#f472b6"/>
                <circle cx="38" cy="92" r="1.3" fill="#38bdf8"/>
                <circle cx="52" cy="92" r="1.3" fill="#fde047"/>
                <circle cx="66" cy="92" r="1.3" fill="#f472b6"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.35"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Short Messy Textured Hair -->
                <path d="M34 36 C34 20, 52 16, 68 24 C72 30, 68 34, 62 32 C54 30, 48 30, 42 34 Z" fill="${hair}"/>
                <path d="M38 24 L42 16 L46 22 L52 14 L58 20 L64 16 L68 24 Z" fill="${hair}"/>
            `;
        }
    },

    b6: {
        id: 'b6',
        gender: 'M',
        name: 'Daniel',
        desc: 'Pelirrojo con peinado lateral y peto celeste',
        bg: '#f0fdfa',
        skin: '#fed7aa',
        hair: '#ea580c',
        render: function(skin, hair, bg) {
            return `
                <!-- Torso / Mint shirt with blue overalls -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#2dd4bf"/>
                <!-- Denim Dungarees -->
                <path d="M34 100 L34 85 L44 85 L44 100 Z" fill="#0284c7"/>
                <path d="M60 100 L60 85 L70 85 L70 100 Z" fill="#0284c7"/>
                <rect x="38" y="90" width="28" height="10" rx="3" fill="#0284c7"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.35"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="#c2410c" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="#c2410c" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Copper/Ginger Hair swept forward -->
                <path d="M36 34 C36 18, 54 14, 70 20 C76 26, 72 32, 62 26 C52 24, 44 26, 36 34 Z" fill="${hair}"/>
                <path d="M58 20 C64 16, 74 18, 76 26 C70 26, 64 24, 58 20 Z" fill="#c2410c"/>
            `;
        }
    },

    b7: {
        id: 'b7',
        gender: 'M',
        name: 'Alejandro',
        desc: 'Tupé castaño con camiseta a rayas rojas y blancas',
        bg: '#fee2e2',
        skin: '#fed7aa',
        hair: '#9a3412',
        render: function(skin, hair, bg) {
            return `
                <!-- Torso / Coral red & white striped tee -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#f87171"/>
                <path d="M28 82 Q52 86 76 82" stroke="#ffffff" stroke-width="2.5" fill="none"/>
                <path d="M25 90 Q52 94 79 90" stroke="#ffffff" stroke-width="2.5" fill="none"/>
                <path d="M22 98 Q52 102 82 98" stroke="#ffffff" stroke-width="2.5" fill="none"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.08"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#f43f5e" opacity="0.35"/>
                <path d="M60 41 Q62 43 60 44" stroke="#c2410c" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 55 64 48 Z" fill="#991b1b"/>
                <path d="M56 48.5 Q59 51 62 48.5" fill="#ffffff"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Brown swept-up textured quiff -->
                <path d="M38 30 C42 16, 56 12, 70 18 C74 22, 70 26, 62 25 C54 24, 46 26, 38 30 Z" fill="${hair}"/>
                <path d="M52 14 C58 8, 66 10, 72 16 C68 18, 62 16, 56 16 Z" fill="${hair}"/>
            `;
        }
    },

    b8: {
        id: 'b8',
        gender: 'M',
        name: 'Gabriel',
        desc: 'Afro rizado oscuro con camiseta amarilla',
        bg: '#fefce8',
        skin: '#c68642',
        hair: '#171717',
        render: function(skin, hair, bg) {
            return `
                <!-- Voluminous Afro Puff (Dark) -->
                <circle cx="32" cy="24" r="8.5" fill="${hair}"/>
                <circle cx="44" cy="18" r="9" fill="${hair}"/>
                <circle cx="56" cy="17" r="9" fill="${hair}"/>
                <circle cx="66" cy="22" r="8" fill="${hair}"/>
                <circle cx="28" cy="34" r="8" fill="${hair}"/>
                <circle cx="26" cy="44" r="7.5" fill="${hair}"/>
                <!-- Torso / Yellow crewneck tee -->
                <path d="M22 100 C20 84, 32 74, 52 74 C72 74, 82 84, 82 100 Z" fill="#facc15"/>
                <path d="M44 74 Q52 79 60 74" fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round"/>
                <!-- Neck -->
                <path d="M46 52 C46 64, 48 74, 48 76 L58 74 C58 64, 57 52, 57 50 Z" fill="${skin}"/>
                <path d="M47 54 C52 59, 58 55, 58 52 L58 57 C53 62, 47 57, 47 54 Z" fill="#000000" opacity="0.14"/>
                <!-- Ear -->
                <path d="M36 43 C33 43, 32 49, 36 52 C38 54, 40 50, 39 45 Z" fill="${skin}"/>
                <!-- Face -->
                <path d="M38 34 C37 20, 56 17, 66 26 C72 32, 75 42, 72 49 C69 57, 58 60, 50 59 C40 58, 38 48, 38 34 Z" fill="${skin}"/>
                <!-- Face features -->
                <ellipse cx="65" cy="45" rx="4.5" ry="2.6" fill="#fb7185" opacity="0.4"/>
                <path d="M60 41 Q62 43 60 44" stroke="#78350f" stroke-width="1.1" stroke-linecap="round" fill="none"/>
                <path d="M54 48 Q59 54 64 48" stroke="#7f1d1d" stroke-width="1.6" stroke-linecap="round" fill="none"/>
                <!-- Eyes -->
                <ellipse cx="50" cy="38" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="49" cy="36.5" r="1" fill="#ffffff"/>
                <ellipse cx="64" cy="36" rx="2.5" ry="3.2" fill="#1c1917"/>
                <circle cx="63" cy="34.5" r="1" fill="#ffffff"/>
                <path d="M47 31 Q51 28 55 30" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <path d="M61 29 Q65 26 68 28" stroke="${hair}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                <!-- Front Afro Curls -->
                <circle cx="38" cy="28" r="5" fill="${hair}"/>
                <circle cx="48" cy="26" r="5.5" fill="${hair}"/>
                <circle cx="58" cy="27" r="5" fill="${hair}"/>
                <circle cx="66" cy="30" r="4.5" fill="${hair}"/>
            `;
        }
    }
}
};

if (typeof window !== 'undefined') {
    window.StudentAvatars = StudentAvatars;
}

    return StudentAvatars;
}));
