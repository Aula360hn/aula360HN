// ============================================================
//  SEED DE RÚBRICAS — Aula 360 HN (v2.1)
//  Carga automática del Banco oficial Aula 360
//  Ejecuta una sola vez; no duplica si ya existen.
// ============================================================

(function seedRubricas() {
    const SEED_VERSION = '2.3';
    const SEED_KEY = 'aula360_rubricas_seed_v' + SEED_VERSION;

    if (typeof Store === 'undefined' || !Store.data) {
        setTimeout(seedRubricas, 200);
        return;
    }

    if (localStorage.getItem(SEED_KEY) === 'done' && Store.data.rubricas && Store.data.rubricas.length > 5) {
        return;
    }

    const NIVELES = [
        { id: 'lvl_inicial',   nombre: 'Inicial',   order: 1 },
        { id: 'lvl_basico',    nombre: 'Básico',    order: 2 },
        { id: 'lvl_avanzado',  nombre: 'Avanzado',  order: 3 },
        { id: 'lvl_excelente', nombre: 'Excelente', order: 4 }
    ];

    function adaptarCriterios(criteriosJSON) {
        return criteriosJSON.map(c => {
            const niveles = c.levels.map(lv => {
                const nivelDef = NIVELES.find(n => n.id === lv.levelId);
                return {
                    id: lv.levelId,
                    nombre: nivelDef ? nivelDef.nombre : lv.levelId,
                    valor: lv.points,
                    descriptor: lv.descriptor || ''
                };
            });

            const descripciones = {};
            c.levels.forEach(lv => { descripciones[lv.levelId] = lv.descriptor || ''; });

            return {
                id: c.id,
                nombre: c.name,
                peso: c.maxPoints,
                niveles,
                descripciones
            };
        });
    }

    const BANCO_OFICIAL = [
        {
            id: 'rubrica_diario_lectura_v2',
            nombre: 'Rúbrica: Diario de Lectura',
            descripcion: 'Evaluación integral del diario de lectura. Criterios suman exactamente 10 pts: Contenido = 5 pts (50%) + 5 criterios × 1 pt cada uno.',
            categoria: 'Proyecto',
            asignatura: 'Español',
            puntajeTotal: 10,
            criteria: [
                { id: 'dl_c1', name: 'Portada', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Sin portada o no incluye datos básicos.' },
                    { levelId: 'lvl_basico', points: 0.25, descriptor: 'Faltan varios datos institucionales o personales.' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'Incluye la mayoría de datos, pero con errores de formato.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'Portada completa con todos los datos institucionales y personales.' }
                ]},
                { id: 'dl_c2', name: 'Biografía del autor', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No incluye biografía del autor.' },
                    { levelId: 'lvl_basico', points: 0.25, descriptor: 'Biografía muy breve y con datos incompletos.' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'Biografía correcta con datos relevantes del autor.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'Biografía detallada, precisa y bien redactada.' }
                ]},
                { id: 'dl_c3', name: 'Contenido: Diario de lectura', maxPoints: 5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Registro insuficiente de las sesiones de lectura.' },
                    { levelId: 'lvl_basico', points: 2, descriptor: 'Registro parcial con reflexiones muy breves o literales.' },
                    { levelId: 'lvl_avanzado', points: 4, descriptor: 'Registro constante con buenas reflexiones sobre lo leído.' },
                    { levelId: 'lvl_excelente', points: 5, descriptor: 'Registro exhaustivo con reflexiones profundas y análisis de la lectura.' }
                ]},
                { id: 'dl_c4', name: 'Descripción y análisis de personajes', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No incluye descripción de personajes.' },
                    { levelId: 'lvl_basico', points: 0.25, descriptor: 'Menciona nombres pero sin describirlos física o psicológicamente.' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'Describe de forma clara a los personajes principales.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'Describe detalladamente a personajes principales y secundarios (física y psicológicamente).' }
                ]},
                { id: 'dl_c5', name: 'Ficha bibliográfica', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No incluye ficha bibliográfica.' },
                    { levelId: 'lvl_basico', points: 0.25, descriptor: 'Datos incompletos (falta editorial, año o autor).' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'Datos correctos pero con errores menores de puntuación/estilo.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'Ficha bibliográfica completa con formato técnico correcto.' }
                ]},
                { id: 'dl_c6', name: 'Preguntas de reflexión crítica', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No responde a las preguntas de reflexión.' },
                    { levelId: 'lvl_basico', points: 0.25, descriptor: 'Respuestas literales sin evidencia de pensamiento crítico.' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'Respuestas adecuadas con conexión personal a la lectura.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'Análisis crítico profundo con argumentos sólidos y juicios propios.' }
                ]},
                { id: 'dl_c7', name: 'Glosario de términos', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No incluye glosario.' },
                    { levelId: 'lvl_basico', points: 0.25, descriptor: 'Menos de 5 términos con significados poco claros.' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'De 5 a 9 términos con definiciones correctas.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'Más de 10 términos nuevos con definiciones claras extraídas del contexto.' }
                ]}
            ]
        },
        {
            id: 'rubrica_produccion_escrita',
            nombre: 'Producción escrita',
            descripcion: 'Evalúa textos escritos producidos por el estudiante.',
            categoria: 'Producción escrita',
            asignatura: 'Español',
            puntajeTotal: 10,
            criteria: [
                { id: 'pe_c1', name: 'Coherencia del contenido', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Presenta ideas confusas, contradictorias o sin relación clara con el tema.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Presenta ideas comprensibles, pero con conexiones débiles o parciales.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Presenta ideas claras y relacionadas con el tema de manera adecuada.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Presenta ideas claras, coherentes y bien articuladas con profundidad.' }
                ]},
                { id: 'pe_c2', name: 'Organización del texto', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No se aprecia estructura u orden en el texto.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Tiene organización parcial, pero con desorden en algunas partes.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Organiza adecuadamente introducción, desarrollo y cierre.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Organiza el texto con claridad, secuencia lógica y buena estructura.' }
                ]},
                { id: 'pe_c3', name: 'Desarrollo de ideas', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Desarrolla muy poco las ideas o se limita a enunciarlas.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Desarrolla algunas ideas, pero de forma superficial.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Desarrolla las ideas con ejemplos o explicaciones suficientes.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Desarrolla las ideas con amplitud, precisión y pertinencia.' }
                ]},
                { id: 'pe_c4', name: 'Uso del lenguaje escrito', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'El uso del lenguaje dificulta la comprensión del texto.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Usa lenguaje simple con algunos errores que no impiden totalmente la comprensión.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Usa lenguaje adecuado con pocos errores y vocabulario pertinente.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Usa lenguaje claro, pertinente y bien ajustado al propósito comunicativo.' }
                ]}
            ]
        },
        {
            id: 'rubrica_comprension_textual',
            nombre: 'Comprensión textual',
            descripcion: 'Evalúa comprensión, interpretación y argumentación a partir de un texto o material.',
            categoria: 'Comprensión',
            asignatura: 'Español',
            puntajeTotal: 10,
            criteria: [
                { id: 'ct_c1', name: 'Identificación de información', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No identifica la información básica del texto.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Identifica solo parte de la información explícita.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Identifica adecuadamente la información principal.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Identifica con precisión información principal y secundaria relevante.' }
                ]},
                { id: 'ct_c2', name: 'Interpretación del contenido', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No logra interpretar el sentido del texto.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Interpreta parcialmente el contenido con dificultades.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Interpreta correctamente el contenido y su sentido general.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Interpreta con claridad el contenido, su intención y matices relevantes.' }
                ]},
                { id: 'ct_c3', name: 'Relación de ideas', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No relaciona ideas o lo hace incorrectamente.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Relaciona algunas ideas, aunque con debilidad.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Relaciona adecuadamente ideas del texto.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Relaciona ideas con precisión y establece conexiones significativas.' }
                ]},
                { id: 'ct_c4', name: 'Argumentación de respuestas', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Responde sin justificar o con argumentos irrelevantes.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Justifica de forma limitada o poco precisa.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Justifica sus respuestas con argumentos adecuados.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Sustenta sus respuestas con argumentos claros, pertinentes y bien construidos.' }
                ]}
            ]
        },
        {
            id: 'rubrica_organizacion_informacion',
            nombre: 'Organización de información',
            descripcion: 'Evalúa productos organizadores de información.',
            categoria: 'Organización',
            asignatura: 'General',
            puntajeTotal: 5,
            criteria: [
                { id: 'oi_c1', name: 'Organización de la información', maxPoints: 1.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'La información aparece desordenada o incompleta.' },
                    { levelId: 'lvl_basico', points: 0.5, descriptor: 'Organiza parcialmente la información.' },
                    { levelId: 'lvl_avanzado', points: 1, descriptor: 'Organiza adecuadamente la información esencial.' },
                    { levelId: 'lvl_excelente', points: 1.5, descriptor: 'Organiza la información con claridad, orden y sentido.' }
                ]},
                { id: 'oi_c2', name: 'Jerarquía de ideas', maxPoints: 1.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No diferencia ideas principales y secundarias.' },
                    { levelId: 'lvl_basico', points: 0.5, descriptor: 'Diferencia algunas ideas, pero con errores.' },
                    { levelId: 'lvl_avanzado', points: 1, descriptor: 'Distingue adecuadamente ideas principales y secundarias.' },
                    { levelId: 'lvl_excelente', points: 1.5, descriptor: 'Jerarquiza con precisión y coherencia las ideas del contenido.' }
                ]},
                { id: 'oi_c3', name: 'Claridad visual o estructural', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'La presentación dificulta leer o entender la información.' },
                    { levelId: 'lvl_basico', points: 0.5, descriptor: 'La presentación es parcialmente clara.' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'La presentación facilita la lectura y comprensión.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'La estructura visual es clara, ordenada y funcional.' }
                ]},
                { id: 'oi_c4', name: 'Relación entre conceptos o datos', maxPoints: 1, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No establece relaciones correctas entre los elementos.' },
                    { levelId: 'lvl_basico', points: 0.5, descriptor: 'Establece algunas relaciones, pero con debilidad.' },
                    { levelId: 'lvl_avanzado', points: 0.75, descriptor: 'Relaciona correctamente la mayoría de conceptos o datos.' },
                    { levelId: 'lvl_excelente', points: 1, descriptor: 'Relaciona con precisión y coherencia todos los elementos relevantes.' }
                ]}
            ]
        },
        {
            id: 'rubrica_resolucion_problemas',
            nombre: 'Resolución de problemas',
            descripcion: 'Evalúa la resolución razonada de problemas o ejercicios.',
            categoria: 'Aplicación',
            asignatura: 'Matemáticas',
            puntajeTotal: 10,
            criteria: [
                { id: 'rp_c1', name: 'Comprensión del problema', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No comprende la situación planteada.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Comprende parcialmente el problema.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Comprende adecuadamente el problema.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Comprende con claridad el problema y sus datos esenciales.' }
                ]},
                { id: 'rp_c2', name: 'Procedimiento empleado', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No aplica un procedimiento adecuado.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Aplica un procedimiento parcial o con errores.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Aplica un procedimiento adecuado con pocos errores.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Aplica un procedimiento correcto, lógico y completo.' }
                ]},
                { id: 'rp_c3', name: 'Exactitud del resultado', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'El resultado es incorrecto o inexistente.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'El resultado presenta errores parciales.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'El resultado es mayormente correcto.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'El resultado es correcto y consistente con el procedimiento.' }
                ]},
                { id: 'rp_c4', name: 'Explicación del proceso', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No explica el proceso realizado.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Explica de forma limitada o poco clara.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Explica adecuadamente el proceso seguido.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Explica con claridad, orden y fundamento cada paso realizado.' }
                ]}
            ]
        },
        {
            id: 'rubrica_experimental',
            nombre: 'Trabajo experimental',
            descripcion: 'Evalúa actividades experimentales y de laboratorio.',
            categoria: 'Laboratorio',
            asignatura: 'Ciencias Naturales',
            puntajeTotal: 10,
            criteria: [
                { id: 'exp_c1', name: 'Ejecución del procedimiento', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No sigue el procedimiento o lo hace de manera incorrecta.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Sigue parcialmente el procedimiento con apoyo frecuente.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Ejecuta el procedimiento de forma adecuada con pocas dificultades.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Ejecuta correctamente y con orden todo el procedimiento.' }
                ]},
                { id: 'exp_c2', name: 'Registro de datos u observaciones', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No registra datos u observaciones relevantes.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Registra datos de forma parcial o poco clara.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Registra adecuadamente los datos principales.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Registra con claridad, orden y precisión los datos u observaciones.' }
                ]},
                { id: 'exp_c3', name: 'Análisis de resultados', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No analiza los resultados obtenidos.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Analiza parcialmente los resultados.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Analiza adecuadamente los resultados y su relación con la práctica.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Analiza con claridad, precisión y sentido científico los resultados.' }
                ]},
                { id: 'exp_c4', name: 'Conclusiones', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No formula conclusiones pertinentes.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Formula conclusiones simples o poco vinculadas con la práctica.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Formula conclusiones pertinentes a partir de los resultados.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Formula conclusiones claras, pertinentes y sustentadas en la evidencia.' }
                ]}
            ]
        },
        {
            id: 'rubrica_produccion_oral',
            nombre: 'Producción oral',
            descripcion: 'Evalúa presentaciones orales, exposiciones y actividades habladas.',
            categoria: 'Exposición',
            asignatura: 'General',
            puntajeTotal: 10,
            criteria: [
                { id: 'po_c1', name: 'Claridad al expresarse', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Se expresa de forma poco clara o difícil de comprender.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Se expresa con claridad parcial.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Se expresa de manera clara y comprensible.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Se expresa con mucha claridad, seguridad y fluidez.' }
                ]},
                { id: 'po_c2', name: 'Dominio del tema', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Demuestra escaso conocimiento del tema.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Demuestra conocimiento limitado del tema.' },
                    { levelId: 'lvl_avanzado', points: 2, descriptor: 'Demuestra buen dominio del tema.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Demuestra dominio sólido, preciso y seguro del tema.' }
                ]},
                { id: 'po_c3', name: 'Organización de ideas', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Presenta ideas desordenadas.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Presenta cierta organización, aunque limitada.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Presenta ideas organizadas y comprensibles.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Presenta ideas bien organizadas, coherentes y secuenciadas.' }
                ]},
                { id: 'po_c4', name: 'Interacción con la audiencia', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No establece interacción con la audiencia o interlocutor.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Establece interacción limitada.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Interactúa de forma adecuada con la audiencia o interlocutor.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Interactúa con seguridad, pertinencia y buena conexión con la audiencia.' }
                ]}
            ]
        },
        {
            id: 'rubrica_participacion_actitud',
            nombre: 'Participación y actitud',
            descripcion: 'Evalúa participación, responsabilidad y trabajo colaborativo.',
            categoria: 'Actitudes',
            asignatura: 'General',
            puntajeTotal: 5,
            criteria: [
                { id: 'pa_c1', name: 'Participación', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Participa muy poco o no participa.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Participa de manera ocasional.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Participa activamente la mayor parte del tiempo.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Participa activamente, con iniciativa y pertinencia.' }
                ]},
                { id: 'pa_c2', name: 'Responsabilidad', maxPoints: 1.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No cumple con lo asignado.' },
                    { levelId: 'lvl_basico', points: 0.5, descriptor: 'Cumple parcialmente con lo asignado.' },
                    { levelId: 'lvl_avanzado', points: 1, descriptor: 'Cumple adecuadamente con lo asignado.' },
                    { levelId: 'lvl_excelente', points: 1.5, descriptor: 'Cumple de manera responsable y constante con lo asignado.' }
                ]},
                { id: 'pa_c3', name: 'Trabajo en equipo', maxPoints: 1.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No colabora con el equipo.' },
                    { levelId: 'lvl_basico', points: 0.5, descriptor: 'Colabora poco o con dificultad.' },
                    { levelId: 'lvl_avanzado', points: 1, descriptor: 'Colabora adecuadamente con el equipo.' },
                    { levelId: 'lvl_excelente', points: 1.5, descriptor: 'Colabora de forma activa, respetuosa y constructiva con el equipo.' }
                ]}
            ]
        },
        {
            id: 'rubrica_cartografia_mapas',
            nombre: 'Cartografía y Mapas Geográficos',
            descripcion: 'Evalúa la elaboración, rotulación, precisión geográfica y simbología de mapas y álbumes cartográficos.',
            categoria: 'Cartografía y Mapas',
            asignatura: 'Ciencias Sociales',
            puntajeTotal: 10,
            criteria: [
                { id: 'cm_c1', name: 'Precisión geográfica y ubicación', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Ubicación errónea de los elementos geográficos principales.' },
                    { levelId: 'lvl_basico', points: 1.5, descriptor: 'Ubica de forma aproximada o con imprecisiones notables los elementos geográficos.' },
                    { levelId: 'lvl_avanzado', points: 2.25, descriptor: 'Ubica correctamente la mayoría de elementos, límites y coordenadas.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Precisión exacta y rigurosa en límites, coordenadas y accidentes geográficos.' }
                ]},
                { id: 'cm_c2', name: 'Simbología, leyenda y rosa náutica', maxPoints: 2.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Carece de leyenda, escala o rosa náutica.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Presenta símbolos incompletos o sin correspondencia clara con la leyenda.' },
                    { levelId: 'lvl_avanzado', points: 1.75, descriptor: 'Incluye leyenda clara y orientación cardinal adecuada.' },
                    { levelId: 'lvl_excelente', points: 2.5, descriptor: 'Simbología cartográfica estándar impecable, escala y orientación correctas.' }
                ]},
                { id: 'cm_c3', name: 'Rotulación, toponimia y legibilidad', maxPoints: 2.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Letra ilegible, faltas ortográficas en topónimos o nombres borrosos.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Rotulación descuidada o con varios errores ortográficos en nombres geográficos.' },
                    { levelId: 'lvl_avanzado', points: 1.75, descriptor: 'Nombres geográficos claros, legibles y bien distribuidos.' },
                    { levelId: 'lvl_excelente', points: 2.5, descriptor: 'Rotulación técnica impecable, excelente caligrafía, ortografía y estética cartográfica.' }
                ]},
                { id: 'cm_c4', name: 'Limpieza, coloreado y presentación', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Presentación manchada, coloreado fuera de límites o descuidado.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Coloreado parcial o sin respetar convenciones cartográficas elementales.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Buen uso de colores geográficos (hidrografía, relieve) y orden general.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Presentación artística y técnica sobresaliente con respeto riguroso de convenciones.' }
                ]}
            ]
        },
        {
            id: 'rubrica_analisis_historico',
            nombre: 'Análisis Histórico y Líneas de Tiempo',
            descripcion: 'Evalúa cronología, causas-consecuencias, contexto de eventos y análisis de fuentes históricas.',
            categoria: 'Análisis Histórico y Fuentes',
            asignatura: 'Ciencias Sociales',
            puntajeTotal: 10,
            criteria: [
                { id: 'ah_c1', name: 'Secuencia cronológica y fechas', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Orden cronológico incorrecto o desarticulado.' },
                    { levelId: 'lvl_basico', points: 1.5, descriptor: 'Sitúa algunos periodos pero con confusiones temporales.' },
                    { levelId: 'lvl_avanzado', points: 2.25, descriptor: 'Secuencia histórica coherente y fechas clave bien situadas.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Precisión cronológica ejemplar con periodización clara y fundamentada.' }
                ]},
                { id: 'ah_c2', name: 'Comprensión de causas y consecuencias', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Se limita a memorizar o no explica el origen de los hechos.' },
                    { levelId: 'lvl_basico', points: 1.5, descriptor: 'Menciona hechos aislados sin relacionar causas con sus efectos.' },
                    { levelId: 'lvl_avanzado', points: 2.25, descriptor: 'Explica adecuadamente las relaciones de causa y efecto de los procesos.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Profundidad crítica para articular factores económicos, sociales y políticos.' }
                ]},
                { id: 'ah_c3', name: 'Uso de fuentes y biografías', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Sin fuentes o con datos erróneos de personajes y próceres.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Fuentes mínimas sin contrastar información.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Cita y utiliza información pertinente sobre los personajes y sucesos.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Excelente contextualización crítica de personajes y fuentes históricas.' }
                ]},
                { id: 'ah_c4', name: 'Claridad expositiva y síntesis', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Texto confuso, copia textual excesiva o desorden visual.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Síntesis incompleta con dificultades de redacción.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Buena capacidad de síntesis, lenguaje histórico adecuado y orden.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Excelente claridad argumentativa, dominio del vocabulario social y diseño pulcro.' }
                ]}
            ]
        },
        {
            id: 'rubrica_investigacion_informe',
            nombre: 'Investigación e Informe Escolar',
            descripcion: 'Evalúa la estructura de informes, recopilación de información, conclusiones y citas bibliográficas.',
            categoria: 'Investigación e Informe Social',
            asignatura: 'General',
            puntajeTotal: 10,
            criteria: [
                { id: 'ii_c1', name: 'Estructura del informe (Introducción, Desarrollo, Conclusión)', maxPoints: 2.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Faltan secciones fundamentales del informe.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Estructura incompleta o con secciones poco desarrolladas.' },
                    { levelId: 'lvl_avanzado', points: 1.75, descriptor: 'Cumple con portada, introducción, cuerpo y conclusiones.' },
                    { levelId: 'lvl_excelente', points: 2.5, descriptor: 'Estructura académica formal perfecta con articulación lógica impecable.' }
                ]},
                { id: 'ii_c2', name: 'Calidad y profundidad del contenido', maxPoints: 3.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Contenido superficial, no responde al tema investigado.' },
                    { levelId: 'lvl_basico', points: 1.5, descriptor: 'Aborda el tema con datos básicos sin profundizar.' },
                    { levelId: 'lvl_avanzado', points: 2.5, descriptor: 'Información pertinente, suficiente y bien explicada.' },
                    { levelId: 'lvl_excelente', points: 3.5, descriptor: 'Investigación rigurosa, enriquecedora y con aportes analíticos propios.' }
                ]},
                { id: 'ii_c3', name: 'Conclusiones y reflexión crítica', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Sin conclusiones o copia del desarrollo.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Conclusiones generales sin postura analítica.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Conclusiones claras que responden a los objetivos planteados.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Reflexión crítica madura, propositiva y bien sustentada.' }
                ]},
                { id: 'ii_c4', name: 'Bibliografía, fuentes y presentación', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Sin fuentes citadas, presentación descuidada.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Fuentes mínimas citadas de forma incorrecta.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Cita fuentes consultadas con pulcritud en la entrega.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Fuentes confiables debidamente referenciadas y presentación profesional.' }
                ]}
            ]
        },
        {
            id: 'rubrica_practica_tecnologica',
            nombre: 'Práctica Digital / Proyecto Tecnológico',
            descripcion: 'Evalúa desarrollo de documentos digitales, presentaciones, uso de herramientas tecnológicas y diseño funcional.',
            categoria: 'Práctica en Computadora / Software',
            asignatura: 'Tecnología',
            puntajeTotal: 10,
            criteria: [
                { id: 'pt_c1', name: 'Aplicación de herramientas del software', maxPoints: 3, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'No utiliza las funciones solicitadas en el programa.' },
                    { levelId: 'lvl_basico', points: 1.5, descriptor: 'Uso básico o con dificultad de las herramientas informáticas.' },
                    { levelId: 'lvl_avanzado', points: 2.25, descriptor: 'Aplica correctamente las herramientas y formatos indicados.' },
                    { levelId: 'lvl_excelente', points: 3, descriptor: 'Dominio fluido y eficiente de funciones avanzadas del software.' }
                ]},
                { id: 'pt_c2', name: 'Diseño, formato y estética digital', maxPoints: 2.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Formato desordenado, fuentes ilegibles o mala diagramación.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Formato plano sin jerarquía visual clara.' },
                    { levelId: 'lvl_avanzado', points: 1.75, descriptor: 'Buena combinación tipográfica, colores y distribución armónica.' },
                    { levelId: 'lvl_excelente', points: 2.5, descriptor: 'Diseño visual profesional, atractivo y funcionalmente óptimo.' }
                ]},
                { id: 'pt_c3', name: 'Cumplimiento de especificaciones y datos', maxPoints: 2.5, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'El producto digital no cumple los requisitos solicitados.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Cumple parcialmente con las consignas técnicas.' },
                    { levelId: 'lvl_avanzado', points: 1.75, descriptor: 'Cumple con todas las consignas y contenidos requeridos.' },
                    { levelId: 'lvl_excelente', points: 2.5, descriptor: 'Supera las expectativas cumpliendo con exactitud técnica cada requerimiento.' }
                ]},
                { id: 'pt_c4', name: 'Organización de archivos y entrega digital', maxPoints: 2, levels: [
                    { levelId: 'lvl_inicial', points: 0, descriptor: 'Archivo dañado, formato incorrecto o sin nombre identificable.' },
                    { levelId: 'lvl_basico', points: 1, descriptor: 'Entrega con retraso o nomenclatura imprecisa.' },
                    { levelId: 'lvl_avanzado', points: 1.5, descriptor: 'Archivo en formato correcto y debidamente nombrado.' },
                    { levelId: 'lvl_excelente', points: 2, descriptor: 'Gestión impecable del archivo digital, entrega puntual y orden digital ejemplar.' }
                ]}
            ]
        }
    ];

    window.BancoRubricasOficial = BANCO_OFICIAL;

    if (!Store.data.rubricas) Store.data.rubricas = [];
    const existentes = Store.data.rubricas;
    const existentesIds = new Set(existentes.map(r => r.id));
    let sembradas = 0;

    BANCO_OFICIAL.forEach(rJSON => {
        // Siempre reemplazar las rúbricas del banco oficial para mantenerlas actualizadas
        const index = existentes.findIndex(x => x.id === rJSON.id);
        if (index !== -1) {
            existentes.splice(index, 1);
        }

        const rubrica = {
            id: rJSON.id,
            nombre: rJSON.nombre,
            descripcion: rJSON.descripcion,
            categoria: rJSON.categoria,
            asignatura: rJSON.asignatura,
            tipoRubrica: 'analitica',
            puntajeTotal: rJSON.puntajeTotal,
            metodoCalculo: 'suma_directa',
            estado: 'Activa',
            isTemplate: true,
            criterios: adaptarCriterios(rJSON.criteria),
            niveles: NIVELES.map(n => ({ id: n.id, nombre: n.nombre, puntos: 0 }))
        };

        Store.add('rubricas', rubrica, true);
        sembradas++;
    });

    Store.save();
    localStorage.setItem(SEED_KEY, 'done');
    console.log(`[SeedRubricas] ✅ ${sembradas} rúbricas sembradas o actualizadas.`);
    window._rubricasSembradasTotal = sembradas;
})();
