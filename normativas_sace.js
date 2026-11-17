/**
 * NormativasSACE - Normativas Oficiales de Evaluación SACE Honduras
 * SEDUC Honduras (Básica I, II, III Ciclo y Media BCH/BTP)
 * Aula 360 HN
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.NormativasSACE = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const NormativasSACE = {
        'basica_1_ciclo': {
            id: 'basica_1_ciclo',
            categoria: 'basica',
            nombre: 'Básica I Ciclo (1°, 2° y 3°)',
            grados: '1°, 2° y 3° Grado',
            icono: 'smile',
            descripcion: 'Centros Normales: 70 pts Acumulativo (Aula 45, Extra 10, Valores 10, Artísticas/Dep. 5) + 30 pts Exámenes.',
            resumenAcumulado: 'Acumulativo 70% + Exámenes 30%',
            gradosSugeridos: ['1° Grado', '2° Grado', '3° Grado'],
            dimensions: [
                { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 45, max: 5 },
                { key: 'extraAula', nombre: 'Actividades Extra Aula', porcentaje: 10, max: 5 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10, max: 5 },
                { key: 'expresiones', nombre: 'Expresiones Artísticas, Deportivas y Humanísticas', porcentaje: 5, max: 5 },
                { key: 'examenes', nombre: 'Exámenes Escritos / Prácticos', porcentaje: 30, max: 5 }
            ]
        },
        'basica_2_ciclo': {
            id: 'basica_2_ciclo',
            categoria: 'basica',
            nombre: 'Básica II Ciclo (4°, 5° y 6°)',
            grados: '4°, 5° y 6° Grado',
            icono: 'book-open',
            descripcion: 'Centros Normales: 60 pts Acumulativo (Aula 35, Extra 10, Valores 10, Artísticas/Dep. 5) + 40 pts Exámenes.',
            resumenAcumulado: 'Acumulativo 60% + Exámenes 40%',
            gradosSugeridos: ['4° Grado', '5° Grado', '6° Grado'],
            dimensions: [
                { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 35, max: 5 },
                { key: 'extraAula', nombre: 'Actividades Extra Aula', porcentaje: 10, max: 5 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10, max: 5 },
                { key: 'expresiones', nombre: 'Expresiones Artísticas, Deportivas y Humanísticas', porcentaje: 5, max: 5 },
                { key: 'examenes', nombre: 'Exámenes Escritos / Prácticos', porcentaje: 40, max: 5 }
            ]
        },
        'basica_3_ciclo': {
            id: 'basica_3_ciclo',
            categoria: 'basica',
            nombre: 'Básica III Ciclo (7°, 8° y 9°)',
            grados: '7°, 8° y 9° Grado',
            icono: 'backpack',
            descripcion: 'Centros Normales: 50 pts Acumulativo (Aula 25, Extra 10, Valores 10, Artísticas/Dep. 5) + 50 pts Exámenes.',
            resumenAcumulado: 'Acumulativo 50% + Exámenes 50%',
            gradosSugeridos: ['7° Grado', '8° Grado', '9° Grado'],
            dimensions: [
                { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 25, max: 5 },
                { key: 'extraAula', nombre: 'Actividades Extra Aula', porcentaje: 10, max: 5 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10, max: 5 },
                { key: 'expresiones', nombre: 'Expresiones Artísticas, Deportivas y Humanísticas', porcentaje: 5, max: 5 },
                { key: 'examenes', nombre: 'Exámenes Escritos / Prácticos', porcentaje: 50, max: 5 }
            ]
        },
        'tecnica_talleres': {
            id: 'tecnica_talleres',
            categoria: 'tecnica',
            nombre: 'III Ciclo Técnico / Talleres y Tecnología',
            grados: '7°, 8° y 9° Orientación Técnica',
            icono: 'wrench',
            descripcion: 'Talleres Vocacionales y Tecnología: 50 pts Acumulativo (Taller/Lab 30, Extra 10, Valores 10) + 50 pts Exámenes.',
            resumenAcumulado: 'Acumulativo 50% + Examen 50%',
            gradosSugeridos: ['7° Grado Técnico', '8° Grado Técnico', '9° Grado Técnico'],
            dimensions: [
                { key: 'aula', nombre: 'Actividades de Taller / Laboratorio', porcentaje: 30, max: 5 },
                { key: 'extraAula', nombre: 'Actividades Extra Aula', porcentaje: 10, max: 5 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10, max: 5 },
                { key: 'examenes', nombre: 'Examen Escrito / Práctico', porcentaje: 50, max: 5 }
            ]
        },
        'media_bch': {
            id: 'media_bch',
            categoria: 'media',
            nombre: 'Media BCH 10° y 11° (Fundamentación y Orientación)',
            grados: '10° (Fundamentación) y 11° (Orientación) BCH',
            icono: 'graduation-cap',
            descripcion: 'Bachillerato en Ciencias y Humanidades: 50 pts Acumulativo (Aula 35, Extra 10, Valores 5) + 50 pts Exámenes.',
            resumenAcumulado: 'Acumulativo 50% + Examen 50%',
            gradosSugeridos: ['10° BCH', '11° BCH'],
            dimensions: [
                { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 35, max: 5 },
                { key: 'extraAula', nombre: 'Actividades Extra Aula', porcentaje: 10, max: 5 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 5, max: 5 },
                { key: 'examenes', nombre: 'Examen Escrito / Práctico', porcentaje: 50, max: 5 }
            ]
        },
        'media_btp_especializacion': {
            id: 'media_btp_especializacion',
            categoria: 'media',
            nombre: 'Media BTP 12° Grado (Año de Especialización)',
            grados: '12° Grado Bachillerato Técnico Profesional',
            icono: 'award',
            descripcion: 'BTP 12° Especialización: 80 pts Acumulativo (Taller/Laboratorio 60, Extra 10, Valores 10) + 20 pts Exámenes.',
            resumenAcumulado: 'Acumulativo 80% + Examen 20%',
            gradosSugeridos: ['12° BTP Informática', '12° BTP Contaduría', '12° BTP Electricidad', '12° BTP Mecánica', '12° BTP'],
            dimensions: [
                { key: 'aula', nombre: 'Actividades de Taller / Laboratorio', porcentaje: 60, max: 5 },
                { key: 'extraAula', nombre: 'Actividades Extra Aula', porcentaje: 10, max: 5 },
                { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10, max: 5 },
                { key: 'examenes', nombre: 'Examen Escrito / Práctico', porcentaje: 20, max: 5 }
            ]
        }
    };

    return NormativasSACE;
}));
