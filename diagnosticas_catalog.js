/**
 * DiagnosticasCatalog - Banco y Catálogo Oficial de Pruebas Diagnósticas
 * SEDUC Honduras (Matemáticas y Español)
 * Aula 360 HN
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        var exp = factory();
        root.ESP_SHARED_7_11 = exp.ESP_SHARED_7_11;
        root.PRUEBA_DIAGNOSTICA_CATALOG = exp.PRUEBA_DIAGNOSTICA_CATALOG;
        root.ESCALA_DIAGNOSTICA = exp.ESCALA_DIAGNOSTICA;
        root._diagNivel = exp._diagNivel;
        root._diagNivelColor = exp._diagNivelColor;
        root._diagNivelBg = exp._diagNivelBg;
    }
}(typeof self !== 'undefined' ? self : this, function () {

const ESP_SHARED_7_11 = {
    nivel: 'III Ciclo y Media',
    totalItems: 22,
    totalPuntos: 26,
    componentes: [
        { nombre: 'Lectura y Gram\u00e1tica', items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], max: 20 },
        { nombre: 'Escritura', items: [21, 22], max: 6 }
    ],
    pauta: ['A', 'B', 'C', 'B', 'D', 'A', 'C', 'D', 'B', 'A', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'C', 'B', 'D'],
    estandares: [
        { bloque: 'Lectura', componente: 'Comprensi\u00f3n lectora', estandar: 'Demuestran comprensi\u00f3n de las ideas globales, principales, secundarias e inferenciales de un texto le\u00eddo, incluyendo la interpretaci\u00f3n de im\u00e1genes visuales.' },
        { bloque: 'Lectura', componente: 'Vocabulario', estandar: 'Reconocen y entienden en textos le\u00eddos una variedad de palabras conocidas. Interpretan palabras desconocidas utilizando diversas estrategias. Interpretan en textos le\u00eddos el significado de t\u00e9rminos t\u00e9cnicos.' },
        { bloque: 'Escritura', componente: 'La escritura como proceso', estandar: 'Escriben textos narrativos, descriptivos, expositivos y persuasivos. Aplican normas de la gram\u00e1tica, caligraf\u00eda y puntuaci\u00f3n. Utilizan una variedad de palabras en la producci\u00f3n de sus textos escritos.' }
    ],
    escalas: {
        lectura: [
            { label: 'Insatisfactorio', min: 0, max: 7, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { label: 'Debe mejorar', min: 8, max: 13, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
            { label: 'Satisfactorio', min: 14, max: 17, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Avanzado', min: 18, max: 20, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' }
        ],
        escritura: [
            { label: 'Insatisfactorio', min: 0, max: 1, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { label: 'Debe mejorar', min: 2, max: 3, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
            { label: 'Satisfactorio', min: 4, max: 5, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Avanzado', min: 6, max: 6, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' }
        ],
        general: [
            { label: 'Insatisfactorio', min: 0, max: 9, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { label: 'Debe mejorar', min: 10, max: 15, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
            { label: 'Satisfactorio', min: 16, max: 22, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
            { label: 'Avanzado', min: 23, max: 26, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' }
        ]
    }
};

const PRUEBA_DIAGNOSTICA_CATALOG = {
    matematicas: {
        '7': {
            nivel: 'Ciclo Com\u00fan',
            totalItems: 25,
            componentes: [
                { nombre: 'Posici\u00f3n', items: [1, 2, 3] },
                { nombre: 'Comparaci\u00f3n y Orden', items: [4, 5] },
                { nombre: 'M\u00faltiplos y Divisores', items: [6, 7, 8, 9, 10, 11] },
                { nombre: 'Adici\u00f3n y Sustracci\u00f3n', items: [12, 13, 14, 15] },
                { nombre: 'Multiplicaci\u00f3n y Divisi\u00f3n', items: [16, 17, 18, 19, 20, 21] },
                { nombre: '\u00c1ngulos', items: [22, 23, 24, 25] }
            ],
            pauta: ['D', 'B', 'D', 'A', 'A', 'B', 'C', 'D', 'D', 'C', 'C', 'A', 'B', 'B', 'A', 'A', 'C', 'A', 'D', 'C', 'B', 'A', 'C', 'B', 'A'],
            estandares: [
                { bloque: '\u00c1lgebra', componente: 'Posici\u00f3n', estandar: '1. Leen y ubican n\u00fameros racionales positivos en la recta num\u00e9rica.' },
                { bloque: '\u00c1lgebra', componente: 'Comparaci\u00f3n y orden', estandar: '2. Comparan y ordenan fracciones.' },
                { bloque: 'N\u00fameros y operaciones', componente: 'M\u00faltiplos y divisores', estandar: '3. Encuentran todos los divisores de un n\u00famero natural.' }
            ]
        },
        '8': {
            nivel: 'Ciclo Com\u00fan',
            totalItems: 25,
            componentes: [
                { nombre: 'Posici\u00f3n', items: [1, 2, 3] },
                { nombre: 'Comparaci\u00f3n y Orden', items: [4, 5] },
                { nombre: 'Adici\u00f3n y Sustracci\u00f3n', items: [6, 7, 8, 9] },
                { nombre: 'Multiplicaci\u00f3n', items: [10, 11] },
                { nombre: 'M\u00faltiplos', items: [12, 13, 14] },
                { nombre: 'Potenciaci\u00f3n', items: [15, 16, 17, 18, 19, 20] },
                { nombre: 'Expresiones Algebraicas', items: [21, 22, 23, 24, 25] }
            ],
            pauta: ['B', 'A', 'B', 'C', 'A', 'A', 'D', 'C', 'D', 'B', 'A', 'D', 'B', 'A', 'B', 'C', 'D', 'B', 'B', 'C', 'A', 'D', 'D', 'C', 'D'],
            estandares: [
                { bloque: '\u00c1lgebra', componente: 'Posici\u00f3n', estandar: '1. Representan n\u00fameros racionales.' },
                { bloque: 'N\u00fameros y operaciones', componente: 'Potenciaci\u00f3n', estandar: '7. Calculan potencias.' }
            ]
        },
        '9': {
            nivel: 'Ciclo Com\u00fan',
            totalItems: 25,
            componentes: [
                { nombre: 'Razones y proporciones', items: [1, 2, 3, 4] },
                { nombre: 'Intervalos reales', items: [5, 6, 7] },
                { nombre: 'Ecuaciones', items: [8, 9, 10] },
                { nombre: 'Suma y resta de Pol.', items: [11, 12, 13, 14] },
                { nombre: 'Plano cartesiano', items: [15, 16] },
                { nombre: 'Factorizaci\u00f3n', items: [17, 18, 19, 20] },
                { nombre: '\u00c1reas y per\u00edmetros', items: [21, 22, 23, 24, 25] }
            ],
            pauta: ['D', 'B', 'B', 'D', 'D', 'C', 'D', 'C', 'D', 'C', 'A', 'C', 'C', 'A', 'B', 'D', 'A', 'C', 'A', 'D', 'B', 'D', 'A', 'C', 'A'],
            estandares: [
                { bloque: '\u00c1lgebra', componente: 'Ecuaciones', estandar: '4. Resuelven ecuaciones lineales.' }
            ]
        }
    },
    espanol: {
        '7': ESP_SHARED_7_11,
        '8': ESP_SHARED_7_11,
        '9': ESP_SHARED_7_11,
        '10': ESP_SHARED_7_11,
        '11': ESP_SHARED_7_11
    }
};


const ESCALA_DIAGNOSTICA = [
    { label: 'Insatisfactorio', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', min: 0, max: 10 },
    { label: 'Debe Mejorar', color: '#f97316', bg: 'rgba(249,115,22,0.12)', min: 11, max: 16 },
    { label: 'Satisfactorio', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', min: 17, max: 22 },
    { label: 'Avanzado', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', min: 23, max: 25 }
];

function _diagNivel(total, escalas) {
    var esc = escalas || ESCALA_DIAGNOSTICA;
    var n = esc.find(function (x) { return total >= x.min && total <= x.max; });
    return n || { label: '?', color: '#64748b', bg: 'rgba(100,116,139,0.1)' };
}
function _diagNivelColor(total) { return _diagNivel(total).color; }
function _diagNivelBg(total) { return _diagNivel(total).bg; }

    return {
        ESP_SHARED_7_11: typeof ESP_SHARED_7_11 !== 'undefined' ? ESP_SHARED_7_11 : null,
        PRUEBA_DIAGNOSTICA_CATALOG: typeof PRUEBA_DIAGNOSTICA_CATALOG !== 'undefined' ? PRUEBA_DIAGNOSTICA_CATALOG : {},
        ESCALA_DIAGNOSTICA: typeof ESCALA_DIAGNOSTICA !== 'undefined' ? ESCALA_DIAGNOSTICA : [],
        _diagNivel: typeof _diagNivel === 'function' ? _diagNivel : null,
        _diagNivelColor: typeof _diagNivelColor === 'function' ? _diagNivelColor : null,
        _diagNivelBg: typeof _diagNivelBg === 'function' ? _diagNivelBg : null
    };
}));
