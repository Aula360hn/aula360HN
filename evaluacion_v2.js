// =============================================================
//  EVALUACION V2 — Aula 360 HN
//  Modal Inteligente Híbrido, Rúbricas y Cuadro Controlador
// =============================================================

// ----------------------------------------------------------------
//  BANCO DE ACTIVIDADES INTELIGENTE SEGÚN ESPACIO CURRICULAR (CNB HN)
// ----------------------------------------------------------------
const BancoCurricularInteligente = {
    detectSubject(course) {
        if (!course) return 'general';
        const txt = `${course.asignatura || ''} ${course.materia || ''} ${course.nombre || ''}`.toLowerCase();
        if (/ingl[eé]s|english|idioma|foreign|lengua extranjera/i.test(txt)) return 'ingles';
        if (/matem[aá]t|geometr|algebra|álgebra|aritmet|c[aá]lculo/i.test(txt)) return 'matematicas';
        if (/espa[nñ]ol|lectura|redacci|literatura|lenguaje|comunicaci/i.test(txt)) return 'espanol';
        if (/educaci[oó]n\s+f[ií]sica|deport|recreac|atletis/i.test(txt)) return 'educacion_fisica';
        if (/naturales|ciencias nat|f[ií]sica|qu[ií]mica|biolog|ambiente|ecolog/i.test(txt)) return 'ciencias_naturales';
        if (/sociales|historia|geograf|c[ií]vica|ciudadan|sociolog|filosof/i.test(txt)) return 'ciencias_sociales';
        if (/tecnolog|computac|inform[aá]t|rob[oó]tic|ofim[aá]t|programac/i.test(txt)) return 'tecnologia';
        if (/art[ií]stic|m[uú]sica|pl[aá]stic|teatro|danza|dibujo/i.test(txt)) return 'artistica';
        if (/valor|actitud|orientac|convivenc|religi/i.test(txt)) return 'valores';
        return 'general';
    },

    getSubjectConfig(course) {
        const key = this.detectSubject(course);
        const configs = {
            ingles: {
                label: 'Inglés / Lengua Extranjera',
                badge: 'Inglés',
                icon: 'languages',
                tipos: [
                    'Speaking & Pronunciation',
                    'Listening Comprehension',
                    'Reading & Vocabulary',
                    'Writing & Grammar',
                    'Roleplay & Dialogue',
                    'Project & Presentation',
                    'Language Workshop / Games',
                    'Quiz / Evaluation',
                    'General'
                ],
                sugerencias: [
                    { id: 'en_sp1', tipo: 'Speaking & Pronunciation', nombre: 'Oral Presentation / Short Speech', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'en_sp2', tipo: 'Speaking & Pronunciation', nombre: 'Pronunciation Drill & Reading Aloud', dimension: 'aula', puntajeMax: 5, tipoEval: 'directa' },
                    { id: 'en_sp3', tipo: 'Speaking & Pronunciation', nombre: 'Picture Description & Vocabulary Drill', dimension: 'aula', puntajeMax: 5, tipoEval: 'directa' },
                    
                    { id: 'en_li1', tipo: 'Listening Comprehension', nombre: 'Listening Worksheet & Fill-in-the-Blanks', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'en_li2', tipo: 'Listening Comprehension', nombre: 'Audio Story / Podcast Comprehension', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'en_li3', tipo: 'Listening Comprehension', nombre: 'Song Lyrics & Grammar Analysis', dimension: 'extraAula', puntajeMax: 5, tipoEval: 'directa' },
                    
                    { id: 'en_re1', tipo: 'Reading & Vocabulary', nombre: 'Reading Comprehension & Questions', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'en_re2', tipo: 'Reading & Vocabulary', nombre: 'Vocabulary Flashcards & Definitions', dimension: 'extraAula', puntajeMax: 5, tipoEval: 'directa' },
                    { id: 'en_re3', tipo: 'Reading & Vocabulary', nombre: 'Short Story Summary & Glossary', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'en_wr1', tipo: 'Writing & Grammar', nombre: 'Descriptive Paragraph / Essay Writing', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'en_wr2', tipo: 'Writing & Grammar', nombre: 'Guided Dialogue Script Writing', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'en_wr3', tipo: 'Writing & Grammar', nombre: 'Grammar Exercises & Sentence Building', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'en_wr4', tipo: 'Writing & Grammar', nombre: 'Creative Writing Journal (Diario en Inglés)', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'en_ro1', tipo: 'Roleplay & Dialogue', nombre: 'Pair Dialogue & Roleplay in Context', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'en_ro2', tipo: 'Roleplay & Dialogue', nombre: 'Interactive Interview & Simulation', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'en_pr1', tipo: 'Project & Presentation', nombre: 'Visual English Poster & Exhibition', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'en_pr2', tipo: 'Project & Presentation', nombre: 'Cuaderno de Práctica - Inglés', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'en_pr3', tipo: 'Project & Presentation', nombre: 'Thematic Portfolio & Scrapbook', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'en_pr4', tipo: 'Project & Presentation', nombre: 'Illustrated Picture Dictionary', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'en_ws1', tipo: 'Language Workshop / Games', nombre: 'Spelling Bee Contest & Review', dimension: 'aula', puntajeMax: 5, tipoEval: 'directa' },
                    { id: 'en_ws2', tipo: 'Language Workshop / Games', nombre: 'Board Games & Vocabulary Trivia', dimension: 'aula', puntajeMax: 5, tipoEval: 'directa' },
                    
                    { id: 'en_qz1', tipo: 'Quiz / Evaluation', nombre: 'Grammar & Vocabulary Progress Quiz', dimension: 'examenes', puntajeMax: 20, tipoEval: 'directa' },
                    { id: 'en_qz2', tipo: 'Quiz / Evaluation', nombre: 'English Term Exam', dimension: 'examenes', puntajeMax: 50, tipoEval: 'directa' },
                    
                    { id: 'en_gn1', tipo: 'General', nombre: 'Actividad General de Inglés', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            matematicas: {
                label: 'Matemáticas',
                badge: 'Matemáticas',
                icon: 'calculator',
                tipos: [
                    'Resolución de Problemas',
                    'Ejercicios y Práctica',
                    'Razonamiento Lógico',
                    'Modelación y Gráficas',
                    'Geometría y Construcciones',
                    'Proyecto y Taller',
                    'Prueba / Evaluación',
                    'General'
                ],
                sugerencias: [
                    { id: 'mat_rp1', tipo: 'Resolución de Problemas', nombre: 'Guía de problemas de aplicación contextual', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'mat_rp2', tipo: 'Resolución de Problemas', nombre: 'Resolución de problemas en equipo colaborativo', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'mat_ej1', tipo: 'Ejercicios y Práctica', nombre: 'Taller de ejercicios y algoritmos', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'mat_ej2', tipo: 'Ejercicios y Práctica', nombre: 'Cuaderno de Práctica - Matemáticas', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'mat_ej3', tipo: 'Ejercicios y Práctica', nombre: 'Guía de trabajo extra-clase', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'directa' },
                    
                    { id: 'mat_rl1', tipo: 'Razonamiento Lógico', nombre: 'Desafío de cálculo mental y rapidez', dimension: 'aula', puntajeMax: 5, tipoEval: 'directa' },
                    { id: 'mat_rl2', tipo: 'Razonamiento Lógico', nombre: 'Acertijos y demostraciones lógicas', dimension: 'aula', puntajeMax: 5, tipoEval: 'directa' },
                    
                    { id: 'mat_mg1', tipo: 'Modelación y Gráficas', nombre: 'Análisis de datos estadísticos y gráficas', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'mat_mg2', tipo: 'Modelación y Gráficas', nombre: 'Tablas de frecuencias e histogramas', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'mat_gm1', tipo: 'Geometría y Construcciones', nombre: 'Trazos geométricos con regla y compás', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'mat_gm2', tipo: 'Geometría y Construcciones', nombre: 'Cálculo de áreas, perímetros y volúmenes', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'mat_gm3', tipo: 'Geometría y Construcciones', nombre: 'Maqueta de cuerpos geométricos', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    
                    { id: 'mat_py1', tipo: 'Proyecto y Taller', nombre: 'Proyecto de presupuesto financiero / cotizaciones', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'mat_py2', tipo: 'Proyecto y Taller', nombre: 'Portafolio de ejercicios matemáticos', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'mat_ev1', tipo: 'Prueba / Evaluación', nombre: 'Prueba formativa de matemáticas', dimension: 'examenes', puntajeMax: 20, tipoEval: 'directa' },
                    { id: 'mat_ev2', tipo: 'Prueba / Evaluación', nombre: 'Examen de parcial escrito', dimension: 'examenes', puntajeMax: 50, tipoEval: 'directa' },
                    
                    { id: 'mat_gn1', tipo: 'General', nombre: 'Actividad General de Matemáticas', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            espanol: {
                label: 'Español / Lengua y Literatura',
                badge: 'Español',
                icon: 'book-open',
                tipos: [
                    'Comprensión Lectora',
                    'Producción Textual y Redacción',
                    'Expresión Oral y Declamación',
                    'Ortografía y Gramática',
                    'Dramatización y Debate',
                    'Proyecto y Portafolio Literario',
                    'Prueba / Evaluación',
                    'General'
                ],
                sugerencias: [
                    { id: 'esp_cl1', tipo: 'Comprensión Lectora', nombre: 'Diario de lectura guiado', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'esp_cl2', tipo: 'Comprensión Lectora', nombre: 'Análisis de texto narrativo / lírico', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'esp_cl3', tipo: 'Comprensión Lectora', nombre: 'Ficha de lectura y comentario crítico', dimension: 'aula', puntajeMax: 5, tipoEval: 'rubrica' },
                    
                    { id: 'esp_pt1', tipo: 'Producción Textual y Redacción', nombre: 'Redacción de texto narrativo (Cuento / Fábula)', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'esp_pt2', tipo: 'Producción Textual y Redacción', nombre: 'Ensayo argumentativo sobre tema actual', dimension: 'aula', puntajeMax: 15, tipoEval: 'rubrica' },
                    { id: 'esp_pt3', tipo: 'Producción Textual y Redacción', nombre: 'Informe de investigación documental', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'esp_eo1', tipo: 'Expresión Oral y Declamación', nombre: 'Exposición oral individual o grupal', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'esp_eo2', tipo: 'Expresión Oral y Declamación', nombre: 'Declamación poética / Discurso', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    
                    { id: 'esp_og1', tipo: 'Ortografía y Gramática', nombre: 'Taller de ortografía, acentuación y puntuación', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'esp_og2', tipo: 'Ortografía y Gramática', nombre: 'Análisis sintáctico y categorías gramaticales', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    
                    { id: 'esp_dd1', tipo: 'Dramatización y Debate', nombre: 'Debate estructurado en aula', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'esp_dd2', tipo: 'Dramatización y Debate', nombre: 'Representación teatral / Sociodrama', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    
                    { id: 'esp_py1', tipo: 'Proyecto y Portafolio Literario', nombre: 'Proyecto Integrador de Español', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'esp_py2', tipo: 'Proyecto y Portafolio Literario', nombre: 'Antología de textos y portafolio de evidencias', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'esp_py3', tipo: 'Proyecto y Portafolio Literario', nombre: 'Mural literario / Periódico escolar', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    
                    { id: 'esp_ev1', tipo: 'Prueba / Evaluación', nombre: 'Prueba Formativa Mensual', dimension: 'examenes', puntajeMax: 20, tipoEval: 'pruebas_formativas_acumulativo' },
                    { id: 'esp_ev2', tipo: 'Prueba / Evaluación', nombre: 'Examen de Parcial de Español', dimension: 'examenes', puntajeMax: 50, tipoEval: 'directa' },
                    
                    { id: 'esp_gn1', tipo: 'General', nombre: 'Actividad General de Español', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            ciencias_naturales: {
                label: 'Ciencias Naturales / Biología / Química / Física',
                badge: 'Ciencias Naturales',
                icon: 'flask-conical',
                tipos: [
                    'Laboratorio y Experimentación',
                    'Informe Científico y Método',
                    'Modelos, Maquetas y Esquemas',
                    'Investigación y Campo',
                    'Proyecto Ecológico / Huerto',
                    'Prueba / Evaluación',
                    'General'
                ],
                sugerencias: [
                    { id: 'cn_lb1', tipo: 'Laboratorio y Experimentación', nombre: 'Práctica experimental de laboratorio', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'cn_lb2', tipo: 'Laboratorio y Experimentación', nombre: 'Experimento casero con materiales reciclados', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cn_ic1', tipo: 'Informe Científico y Método', nombre: 'Informe de práctica de laboratorio con método científico', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'cn_ic2', tipo: 'Informe Científico y Método', nombre: 'Registro de observaciones y bitácora científica', dimension: 'aula', puntajeMax: 5, tipoEval: 'rubrica' },
                    
                    { id: 'cn_mm1', tipo: 'Modelos, Maquetas y Esquemas', nombre: 'Maqueta de estructura celular / anatómica', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'cn_mm2', tipo: 'Modelos, Maquetas y Esquemas', nombre: 'Esquema ilustrado de ciclos biogeoquímicos', dimension: 'aula', puntajeMax: 5, tipoEval: 'directa' },
                    
                    { id: 'cn_in1', tipo: 'Investigación y Campo', nombre: 'Álbum botánico / Herbario escolar', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'cn_in2', tipo: 'Investigación y Campo', nombre: 'Investigación sobre conservación ambiental y recursos', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cn_py1', tipo: 'Proyecto Ecológico / Huerto', nombre: 'Huerto Escolar y Cuidado de Plantas', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'cn_py2', tipo: 'Proyecto Ecológico / Huerto', nombre: 'Campaña escolar de reciclaje y sustentabilidad', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cn_ev1', tipo: 'Prueba / Evaluación', nombre: 'Prueba formativa de ciencias', dimension: 'examenes', puntajeMax: 20, tipoEval: 'directa' },
                    { id: 'cn_ev2', tipo: 'Prueba / Evaluación', nombre: 'Examen de parcial de ciencias', dimension: 'examenes', puntajeMax: 50, tipoEval: 'directa' },
                    
                    { id: 'cn_gn1', tipo: 'General', nombre: 'Actividad General de Ciencias', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            ciencias_sociales: {
                label: 'Ciencias Sociales / Historia / Geografía / Cívica',
                badge: 'Ciencias Sociales',
                icon: 'globe',
                tipos: [
                    'Cartografía y Mapas',
                    'Análisis Histórico y Fuentes',
                    'Debate y Foro Ciudadano',
                    'Líneas de Tiempo e Infografías',
                    'Proyecto Cívico y Comunitario',
                    'Investigación e Informe Social',
                    'Prueba / Evaluación',
                    'General'
                ],
                sugerencias: [
                    { id: 'cs_mp1', tipo: 'Cartografía y Mapas', nombre: 'Elaboración y rotulación de mapa geográfico / temático', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'cs_mp2', tipo: 'Cartografía y Mapas', nombre: 'Álbum cartográfico de Honduras y el mundo', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cs_ah1', tipo: 'Análisis Histórico y Fuentes', nombre: 'Análisis de texto histórico y fuentes primarias', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'cs_ah2', tipo: 'Análisis Histórico y Fuentes', nombre: 'Álbum ilustrado de próceres y símbolos patrios', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cs_db1', tipo: 'Debate y Foro Ciudadano', nombre: 'Debate de derechos humanos y ciudadanía', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'cs_db2', tipo: 'Debate y Foro Ciudadano', nombre: 'Mesa redonda sobre problemáticas comunitarias', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cs_lt1', tipo: 'Líneas de Tiempo e Infografías', nombre: 'Línea de tiempo ilustrada de periodos históricos', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'cs_lt2', tipo: 'Líneas de Tiempo e Infografías', nombre: 'Infografía sobre culturas prehispánicas de Honduras', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cs_py1', tipo: 'Proyecto Cívico y Comunitario', nombre: 'Mural histórico y cívico', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'cs_py2', tipo: 'Proyecto Cívico y Comunitario', nombre: 'Investigación de historia y patrimonio local', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'cs_ev1', tipo: 'Prueba / Evaluación', nombre: 'Prueba formativa de ciencias sociales', dimension: 'examenes', puntajeMax: 20, tipoEval: 'directa' },
                    { id: 'cs_ev2', tipo: 'Prueba / Evaluación', nombre: 'Examen de parcial de ciencias sociales', dimension: 'examenes', puntajeMax: 50, tipoEval: 'directa' },
                    
                    { id: 'cs_gn1', tipo: 'General', nombre: 'Actividad General de Ciencias Sociales', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            tecnologia: {
                label: 'Tecnología / Informática / Computación',
                badge: 'Tecnología',
                icon: 'cpu',
                tipos: [
                    'Práctica en Computadora / Software',
                    'Ofimática y Documentos Digitales',
                    'Proyectos Tecnológicos y Diseño',
                    'Algoritmos y Lógica de Programación',
                    'Portafolio Digital',
                    'Prueba / Evaluación',
                    'General'
                ],
                sugerencias: [
                    { id: 'tec_pc1', tipo: 'Práctica en Computadora / Software', nombre: 'Práctica guiada en procesador de textos / hojas de cálculo', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'tec_pc2', tipo: 'Práctica en Computadora / Software', nombre: 'Creación de presentación multimedia interactiva', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'tec_of1', tipo: 'Ofimática y Documentos Digitales', nombre: 'Elaboración de documento formal formateado', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'tec_of2', tipo: 'Ofimática y Documentos Digitales', nombre: 'Tabla de datos con fórmulas y gráficos', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    
                    { id: 'tec_ds1', tipo: 'Proyectos Tecnológicos y Diseño', nombre: 'Construcción de prototipo tecnológico con material reciclado', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'tec_ds2', tipo: 'Proyectos Tecnológicos y Diseño', nombre: 'Diseño de diagrama de procesos e infografía digital', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'tec_al1', tipo: 'Algoritmos y Lógica de Programación', nombre: 'Diagramas de flujo y pseudocódigo paso a paso', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'tec_al2', tipo: 'Algoritmos y Lógica de Programación', nombre: 'Práctica de programación en bloques / lógica computacional', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'tec_pd1', tipo: 'Portafolio Digital', nombre: 'Portafolio digital de evidencias tecnológicas', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'tec_ev1', tipo: 'Prueba / Evaluación', nombre: 'Prueba teórico-práctica de tecnología', dimension: 'examenes', puntajeMax: 20, tipoEval: 'directa' },
                    { id: 'tec_ev2', tipo: 'Prueba / Evaluación', nombre: 'Examen de parcial de tecnología', dimension: 'examenes', puntajeMax: 50, tipoEval: 'directa' },
                    
                    { id: 'tec_gn1', tipo: 'General', nombre: 'Actividad General de Tecnología', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            artistica: {
                label: 'Educación Artística / Música / Plástica',
                badge: 'Artística',
                icon: 'palette',
                tipos: [
                    'Expresión Plástica y Dibujo',
                    'Apreciación y Ejecución Musical',
                    'Expresión Corporal y Teatro',
                    'Manualidades y Modelado',
                    'Galería y Portafolio Artístico',
                    'General'
                ],
                sugerencias: [
                    { id: 'art_pl1', tipo: 'Expresión Plástica y Dibujo', nombre: 'Composición pictórica con técnica de témperas/acuarelas', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'art_pl2', tipo: 'Expresión Plástica y Dibujo', nombre: 'Dibujo con cuadrícula y perspectiva', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'art_mu1', tipo: 'Apreciación y Ejecución Musical', nombre: 'Ejecución rítmica con flauta / percusión', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'art_mu2', tipo: 'Apreciación y Ejecución Musical', nombre: 'Canto coral e himno nacional', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'art_te1', tipo: 'Expresión Corporal y Teatro', nombre: 'Dramatización y expresión corporal en grupo', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    
                    { id: 'art_mn1', tipo: 'Manualidades y Modelado', nombre: 'Modelado en plastilina / arcilla / papel maché', dimension: 'expresiones', puntajeMax: 5, tipoEval: 'rubrica' },
                    { id: 'art_mn2', tipo: 'Manualidades y Modelado', nombre: 'Collage creativo con texturas naturales', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    
                    { id: 'art_gl1', tipo: 'Galería y Portafolio Artístico', nombre: 'Portafolio / Álbum de obras artísticas', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'art_gn1', tipo: 'General', nombre: 'Actividad General de Artística', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            educacion_fisica: {
                label: 'Educación Física / Deportes',
                badge: 'Ed. Física',
                icon: 'activity',
                tipos: [
                    'Acondicionamiento Físico',
                    'Fundamentos Técnicos Deportivos',
                    'Juegos Motores y Cooperativos',
                    'Salud, Higiene y Nutrición',
                    'Test y Circuitos de Habilidades',
                    'General'
                ],
                sugerencias: [
                    { id: 'ef_ac1', tipo: 'Acondicionamiento Físico', nombre: 'Circuito de resistencia y flexibilidad', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'ef_ft1', tipo: 'Fundamentos Técnicos Deportivos', nombre: 'Práctica de fundamentos de fútbol / básquetbol / vóleibol', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'ef_jm1', tipo: 'Juegos Motores y Cooperativos', nombre: 'Dinámicas grupales de trabajo en equipo y juego limpio', dimension: 'actitudes', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'ef_sh1', tipo: 'Salud, Higiene y Nutrición', nombre: 'Ficha de registro de hábitos de vida saludable', dimension: 'extraAula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'ef_ts1', tipo: 'Test y Circuitos de Habilidades', nombre: 'Test de valoración motriz y aptitud física', dimension: 'examenes', puntajeMax: 20, tipoEval: 'directa' },
                    { id: 'ef_gn1', tipo: 'General', nombre: 'Actividad General de Ed. Física', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            valores: {
                label: 'Valores / Orientación y Convivencia',
                badge: 'Valores',
                icon: 'heart-handshake',
                tipos: [
                    'Cuaderno de Valores y Reflexión',
                    'Acción Solidaria y Convivencia',
                    'Dilemas Morales y Diálogo',
                    'Autoevaluación de Hábitos y Puntualidad',
                    'General'
                ],
                sugerencias: [
                    { id: 'val_cv1', tipo: 'Cuaderno de Valores y Reflexión', nombre: 'Cuaderno de Valores mensual', dimension: 'actitudes', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'val_as1', tipo: 'Acción Solidaria y Convivencia', nombre: 'Campaña comunitaria / Escolar de respeto y empatía', dimension: 'actitudes', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'val_dm1', tipo: 'Dilemas Morales y Diálogo', nombre: 'Análisis y debate de dilemas éticos cotidianos', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'val_ae1', tipo: 'Autoevaluación de Hábitos y Puntualidad', nombre: 'Ficha de seguimiento de hábitos, puntualidad y disciplina', dimension: 'actitudes', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'val_gn1', tipo: 'General', nombre: 'Actividad General de Valores', dimension: 'actitudes', puntajeMax: 10, tipoEval: 'directa' }
                ]
            },
            general: {
                label: 'General / Tronco Común',
                badge: 'General',
                icon: 'layers',
                tipos: [
                    'Comprensión',
                    'Producción',
                    'Aplicación',
                    'Proyecto',
                    'Experimental',
                    'Interacción',
                    'Investigación',
                    'Prueba / Evaluación',
                    'General'
                ],
                sugerencias: [
                    { id: 'gen_cp1', tipo: 'Comprensión', nombre: 'Análisis e interpretación de texto / documento', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'gen_pd1', tipo: 'Producción', nombre: 'Redacción de síntesis o informe', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'gen_ap1', tipo: 'Aplicación', nombre: 'Guía práctica de ejercicios', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' },
                    { id: 'gen_py1', tipo: 'Proyecto', nombre: 'Proyecto formativo integrador', dimension: 'aula', puntajeMax: 15, tipoEval: 'rubrica' },
                    { id: 'gen_in1', tipo: 'Interacción', nombre: 'Exposición y sustentación oral', dimension: 'aula', puntajeMax: 10, tipoEval: 'rubrica' },
                    { id: 'gen_ex1', tipo: 'Prueba / Evaluación', nombre: 'Evaluación formativa', dimension: 'examenes', puntajeMax: 20, tipoEval: 'directa' },
                    { id: 'gen_ex2', tipo: 'Prueba / Evaluación', nombre: 'Examen de parcial', dimension: 'examenes', puntajeMax: 50, tipoEval: 'directa' },
                    { id: 'gen_gn1', tipo: 'General', nombre: 'Actividad General', dimension: 'aula', puntajeMax: 10, tipoEval: 'directa' }
                ]
            }
        };

        return configs[key] || configs.general;
    }
};

const TiposActividad = ['Comprensión', 'Producción', 'Aplicación', 'Proyecto', 'Experimental', 'Interacción', 'General'];

const BancoActividadesInteligente = BancoCurricularInteligente.getSubjectConfig(null).sugerencias;

window.EvalSmartSettings = {
    currentSuggestionId: '',
    selectedTipoActividad: ''
};



window.BancoRubricasProyectos = [
    {
        id: "diario_lectura", name: "Diario de Lectura", totalPoints: 10,
        criteria: [
            { name: "Portada", maxPoints: 1 },
            { name: "Biografía del autor", maxPoints: 1 },
            { name: "Diario de lectura", maxPoints: 4 }, // Ajustado a 4 para sumar 10
            { name: "Personajes", maxPoints: 1 },
            { name: "Ficha bibliográfica", maxPoints: 1 },
            { name: "Reflexión crítica", maxPoints: 1 },
            { name: "Glosario", maxPoints: 1 }
        ]
    },
    {
        id: "cuaderno_valores", name: "Cuaderno de Valores", totalPoints: 10,
        criteria: [
            { name: "Portada y datos generales", maxPoints: 1 },
            { name: "Presentación artística del valor", maxPoints: 1 },
            { name: "Definición del valor", maxPoints: 1 },
            { name: "Imagen representativa", maxPoints: 1 },
            { name: "Análisis y aplicación del valor", maxPoints: 6 }
        ]
    },
    {
        id: "huerto_escolar", name: "Huerto Escolar", totalPoints: 10,
        criteria: [
            { name: "Portada y datos generales", maxPoints: 1 },
            { name: "Preparación de camas de cultivo", maxPoints: 1.5 },
            { name: "Siembra y rotulación de plantas", maxPoints: 1.5 },
            { name: "Riego, abono y fumigación", maxPoints: 2 },
            { name: "Eliminación de hierbas o malezas", maxPoints: 1.5 },
            { name: "Trípticos informativos de las plantas", maxPoints: 1.5 },
            { name: "Participación y responsabilidad individual", maxPoints: 1 }
        ]
    },
    {
        id: "portafolio_evidencias", name: "Portafolio de Evidencias / Cuaderno de Trabajo", totalPoints: 10,
        criteria: [
            { name: "Portada y datos generales", maxPoints: 1 },
            { name: "Lecciones completas", maxPoints: 5 },
            { name: "Actividades desarrolladas correctamente", maxPoints: 2 },
            { name: "Orden y organización", maxPoints: 1 },
            { name: "Entrega y actualización permanente", maxPoints: 1 }
        ]
    },
    {
        id: "proyecto_integrador_espanol", name: "Proyecto Integrador de Español", totalPoints: 10,
        criteria: [
            { name: "Portada y organización del proyecto", maxPoints: 1 },
            { name: "Aportes de las lecciones", maxPoints: 4 },
            { name: "Calidad de los contenidos", maxPoints: 2 },
            { name: "Creatividad e integración de elementos", maxPoints: 1 },
            { name: "Presentación final del proyecto", maxPoints: 2 }
        ]
    },
    {
        id: "cuaderno_practica_ingles", name: "Cuaderno de Práctica - Inglés", totalPoints: 10,
        criteria: [
            { name: "Portada y datos generales", maxPoints: 1 },
            { name: "Registro completo del vocabulario", maxPoints: 3 },
            { name: "Escritura correcta de palabras", maxPoints: 2 },
            { name: "Asociación palabra-imagen", maxPoints: 2 },
            { name: "Orden y presentación", maxPoints: 1 },
            { name: "Práctica constante durante el parcial", maxPoints: 1 }
        ]
    },
    {
        id: "cuaderno_practica_matematicas", name: "Cuaderno de Práctica - Matemáticas", totalPoints: 10,
        criteria: [
            { name: "Portada y datos generales", maxPoints: 1 },
            { name: "Ejemplos desarrollados", maxPoints: 3 },
            { name: "Ejercicios completados", maxPoints: 3 },
            { name: "Procedimientos matemáticos correctos", maxPoints: 2 },
            { name: "Orden y presentación", maxPoints: 1 }
        ]
    },
    {
        id: "rubrica_personalizada", name: "Rúbrica personalizada", totalPoints: 10,
        criteria: []
    }
];

window.NivelesRubrica = [
    { id: 'lvl_inicial', nombre: 'Inicial' },
    { id: 'lvl_basico', nombre: 'Básico' },
    { id: 'lvl_avanzado', nombre: 'Avanzado' },
    { id: 'lvl_excelente', nombre: 'Excelente' }
];

window._buildCriteriosRubrica = function(items, totalMaxPts) {
    const safeTotal = Math.max(0.5, parseFloat(totalMaxPts) || 10);
    let list = Array.isArray(items) && items.length > 0
        ? items
        : [{ name: 'Criterio 1', weight: 1, desc: {} }];

    const sumW = list.reduce((acc, c) => acc + (parseFloat(c.weight ?? c.maxPoints) || 0), 0) || 1;
    const factor = safeTotal / sumW;

    const pesos = list.map(c => Math.round(((parseFloat(c.weight ?? c.maxPoints) || 0) * factor) * 10) / 10);
    const sumPesos = Math.round(pesos.reduce((a, b) => a + b, 0) * 10) / 10;
    const diff = Math.round((safeTotal - sumPesos) * 10) / 10;
    if (diff !== 0 && pesos.length > 0) {
        pesos[0] = Math.max(0.1, Math.round((pesos[0] + diff) * 10) / 10);
    }

    const now = Date.now();
    return list.map((c, i) => {
        const pts = pesos[i];
        const p3 = pts;
        const p2 = Math.round((pts * 0.75) * 10) / 10;
        const p1 = Math.round((pts * 0.5) * 10) / 10;
        const desc = c.desc || {};
        const d0 = desc.inicial || 'No evidencia el criterio o requiere apoyo completo';
        const d1 = desc.basico || 'Cumple parcialmente con errores notorios';
        const d2 = desc.avanzado || 'Cumple satisfactoriamente con detalles menores';
        const d3 = desc.excelente || 'Cumple con excelencia y dominio completo';

        return {
            id: 'crit_' + i + '_' + now,
            nombre: c.name || c.nombre || ('Criterio ' + (i + 1)),
            peso: pts,
            niveles: [
                { id: 'lvl_inicial', nombre: 'Inicial', valor: 0, descriptor: d0 },
                { id: 'lvl_basico', nombre: 'Básico', valor: p1, descriptor: d1 },
                { id: 'lvl_avanzado', nombre: 'Avanzado', valor: p2, descriptor: d2 },
                { id: 'lvl_excelente', nombre: 'Excelente', valor: p3, descriptor: d3 }
            ],
            descripciones: {
                'lvl_inicial': d0,
                'lvl_basico': d1,
                'lvl_avanzado': d2,
                'lvl_excelente': d3
            }
        };
    });
};

window.generarRubricaDesdePlantilla = function(templateId, totalMaxPts) {
    const tpl = window.BancoRubricasProyectos.find(t => t.id === templateId);
    if (!tpl) return null;

    return {
        id: 'usr_rub_' + Date.now(),
        nombre: tpl.name,
        tipoRubrica: 'analitica',
        puntajeTotal: totalMaxPts,
        criterios: window._buildCriteriosRubrica(tpl.criteria, totalMaxPts),
        niveles: window.NivelesRubrica.map(n => ({ id: n.id, nombre: n.nombre, puntos: 0 }))
    };
};

window.generarRubricaAsistida = function(course, tipoActividad, nombreActividad, totalMaxPts) {
    const subjKey = (typeof BancoCurricularInteligente !== 'undefined')
        ? BancoCurricularInteligente.detectSubject(course)
        : 'general';
    const texto = `${tipoActividad || ''} ${nombreActividad || ''}`.toLowerCase();

    let modalidad = 'general';
    if (/speaking|oral|exposi|debate|roleplay|dialogue|presenta|poster|exhibi|discurso|dramat/i.test(texto)) {
        modalidad = 'oral';
    } else if (/writing|escrit|ensayo|redac|diario|lectura|reading|resumen|cuento|comprens/i.test(texto)) {
        modalidad = 'escrita';
    } else if (/laborat|experim|huerto|pr[aá]ctica|taller|circuito|maqueta|producto|dibujo|obra/i.test(texto)) {
        modalidad = 'practica';
    } else if (/ejercic|problema|gu[ií]a|c[aá]lculo|ecuaci|resoluci|worksheet/i.test(texto)) {
        modalidad = 'problemas';
    } else if (/portafolio|cuaderno|carpeta|[aá]lbum/i.test(texto)) {
        modalidad = 'portafolio';
    }

    const matrices = {
        lenguas_oral: [
            { name: 'Uso del idioma y vocabulario pertinente', weight: 35 },
            { name: 'Contenido y claridad del mensaje', weight: 30 },
            { name: 'Pronunciación, tono y fluidez oral', weight: 25 },
            { name: 'Apoyo visual y presentación', weight: 10 }
        ],
        lenguas_escrita: [
            { name: 'Comprensión y desarrollo de ideas', weight: 35 },
            { name: 'Coherencia y estructura textual', weight: 30 },
            { name: 'Ortografía, gramática y vocabulario', weight: 25 },
            { name: 'Presentación y puntualidad', weight: 10 }
        ],
        lenguas_portafolio: [
            { name: 'Evidencias y actividades completas', weight: 45 },
            { name: 'Corrección y dominio del contenido', weight: 30 },
            { name: 'Orden y organización', weight: 15 },
            { name: 'Actualización y entrega puntual', weight: 10 }
        ],
        matematicas_problemas: [
            { name: 'Procedimiento lógico y operaciones', weight: 45 },
            { name: 'Planteamiento del problema y datos', weight: 25 },
            { name: 'Resultado correcto y unidades', weight: 20 },
            { name: 'Orden y legibilidad', weight: 10 }
        ],
        matematicas_oral: [
            { name: 'Fundamentación matemática del modelo', weight: 35 },
            { name: 'Exactitud en cálculos y demostración', weight: 35 },
            { name: 'Claridad al explicar el proceso', weight: 20 },
            { name: 'Presentación de recursos', weight: 10 }
        ],
        ciencias_practica: [
            { name: 'Ejecución del procedimiento y seguridad', weight: 35 },
            { name: 'Registro de datos y observaciones', weight: 25 },
            { name: 'Fundamento teórico / Hipótesis', weight: 20 },
            { name: 'Conclusiones científicas', weight: 20 }
        ],
        ciencias_teorica: [
            { name: 'Rigor y precisión científica', weight: 40 },
            { name: 'Explicación de fenómenos y evidencias', weight: 30 },
            { name: 'Uso de vocabulario científico', weight: 20 },
            { name: 'Presentación y fuentes', weight: 10 }
        ],
        sociales: [
            { name: 'Rigor de datos y fuentes consultadas', weight: 35 },
            { name: 'Análisis crítico y contextualización', weight: 35 },
            { name: 'Argumentación y postura fundamentada', weight: 20 },
            { name: 'Organización y presentación', weight: 10 }
        ],
        tecnologia: [
            { name: 'Dominio técnico y uso de herramienta', weight: 40 },
            { name: 'Funcionalidad y acabado del producto', weight: 30 },
            { name: 'Solución creativa al problema', weight: 20 },
            { name: 'Seguridad, orden y entrega', weight: 10 }
        ],
        artistica: [
            { name: 'Aplicación de la técnica', weight: 40 },
            { name: 'Expresión y creatividad', weight: 35 },
            { name: 'Acabado y limpieza', weight: 15 },
            { name: 'Participación en aula', weight: 10 }
        ],
        educacion_fisica: [
            { name: 'Ejecución motriz y técnica', weight: 40 },
            { name: 'Esfuerzo y participación activa', weight: 30 },
            { name: 'Juego limpio y trabajo en equipo', weight: 20 },
            { name: 'Indumentaria e higiene', weight: 10 }
        ],
        general: [
            { name: 'Dominio y desarrollo del contenido', weight: 40 },
            { name: 'Calidad y rigor del trabajo', weight: 30 },
            { name: 'Organización y claridad', weight: 20 },
            { name: 'Puntualidad y presentación', weight: 10 }
        ]
    };

    let selectedKey = 'general';
    if (subjKey === 'ingles' || subjKey === 'espanol') {
        if (modalidad === 'oral') selectedKey = 'lenguas_oral';
        else if (modalidad === 'portafolio') selectedKey = 'lenguas_portafolio';
        else selectedKey = 'lenguas_escrita';
    } else if (subjKey === 'matematicas') {
        selectedKey = (modalidad === 'oral' || modalidad === 'practica') ? 'matematicas_oral' : 'matematicas_problemas';
    } else if (subjKey === 'ciencias_naturales') {
        selectedKey = (modalidad === 'escrita' || modalidad === 'oral') ? 'ciencias_teorica' : 'ciencias_practica';
    } else if (subjKey === 'ciencias_sociales' || subjKey === 'valores') {
        selectedKey = 'sociales';
    } else if (matrices[subjKey]) {
        selectedKey = subjKey;
    }

    const safeTotal = Math.max(0.5, parseFloat(totalMaxPts) || 10);
    return {
        id: 'usr_rub_' + Date.now(),
        nombre: (nombreActividad || tipoActividad || 'Rúbrica de Actividad').trim(),
        tipoRubrica: 'analitica',
        puntajeTotal: safeTotal,
        criterios: window._buildCriteriosRubrica(matrices[selectedKey], safeTotal),
        niveles: window.NivelesRubrica.map(n => ({ id: n.id, nombre: n.nombre, puntos: 0 }))
    };
};

// ----------------------------------------------------------------
//  OVERRIDE DE LA VISTA DE CREACIÓN/EDICIÓN
// ----------------------------------------------------------------
(function patchEvaluacion() {
    if (typeof Views === 'undefined' || !Views.Evaluacion) {
        setTimeout(patchEvaluacion, 200);
        return;
    }

    // 1. Hook para la creación inteligente
    Views.Evaluacion.createActivity = function(dimKey, preSelectedParcialId = null) {
        const c = Store.getActiveCourse();
        if (!c) { UI.toast('Selecciona un curso primero', 'warning'); return; }
        const parciales = Store.getParcialByCourse(c.id);
        if (parciales.length === 0) {
            UI.toast('No hay parciales configurados. Ve a Configuración Académica.', 'error');
            return;
        }
        
        EvalSmartSettings.currentSuggestionId = '';
        EvalSmartSettings.selectedTipoActividad = '';
        
        renderSmartModal(dimKey, preSelectedParcialId, null);
    };

    // 2. Hook para editar
    Views.Evaluacion.editActivity = function(actId) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act) return;

        EvalSmartSettings.currentSuggestionId = '';
        EvalSmartSettings.selectedTipoActividad = '';

        renderSmartModal(act.dimensionKey, act.parcialId, act);
    };

    // 3. Hook para calificar con rúbrica
    Views.Evaluacion._gradeActivityDirect = Views.Evaluacion.gradeActivity;
    Views.Evaluacion.gradeActivity = function(actId) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act) return;
        if (act.tipoEval === 'rubrica' && (act.rubricaId || act.rubricaPersonalizada)) {
            EvalGrader.openRubricaGrading(actId);
        } else if (act.tipoEval === 'proyecto_acumulativo' || act.tipoEval === 'pruebas_formativas_acumulativo') {
            Views.Evaluacion.gradeFollowupActivity(actId, true);
        } else {
            Views.Evaluacion._gradeActivityDirect(actId);
            // Inyectar el select en el card-h en caliente
            const cardH = document.querySelector('#content .card-h');
            if (cardH) {
                const dims = (Store.data.configAcademica && Store.data.configAcademica.dimensions) || [];
                const dimIdx = dims.findIndex(d => d.key === act.dimensionKey);
                const theme = Utils.getDimensionTheme(dims[dimIdx]?.nombre, dimIdx);
                const rubricas = (Store.get('rubricas') || []).filter(r => r.estado !== 'archivada');
                
                cardH.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 16px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="background: ${theme.text}; color: #fff; width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; box-shadow: 0 4px 12px ${theme.text}44;">
                                <i data-lucide="check-square" style="width: 24px; height: 24px;"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; color: ${theme.text}; font-size: 18px; font-weight: 800;">${act.nombre}</h3>
                                <hr style="border: 0; border-top: 1px solid rgba(0, 0, 0, 0.08); margin: 6px 0;">
                                <p style="margin: 4px 0 0; font-size: 13px; color: ${theme.text}; opacity: 0.7;">Puntaje Máximo: <strong>${act.puntajeMax} puntos</strong></p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 11px; font-weight: 800; color: ${theme.text}; opacity: 0.8; text-transform: uppercase;">Método de Calificación:</span>
                            <select onchange="Views.Evaluacion.switchGradingMethod('${act.id}', this.value)" style="height: 38px; border-radius: 10px; border: 1.5px solid ${theme.border}; background: #fff; padding: 0 12px; font-size: 13px; font-weight: 700; color: #334155; cursor: pointer; box-shadow: var(--shadow-sm);">
                                <option value="directa" ${act.tipoEval === 'directa' ? 'selected' : ''}>✏️ Calificación Directa</option>
                                <option value="proyecto_acumulativo" ${act.tipoEval === 'proyecto_acumulativo' ? 'selected' : ''}>📈 Proyecto Acumulativo</option>
                                ${rubricas.map(r => `<option value="${r.id}" ${act.tipoEval === 'rubrica' && act.rubricaId === r.id ? 'selected' : ''}>🧩 Rúbrica: ${r.nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        }
    };

    // Función para conmutar dinámicamente el método de calificación
    Views.Evaluacion.switchGradingMethod = function(actId, value) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act) return;

        const PF_MESES = ['Febrero/Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre/Noviembre'];

        if (value === 'directa') {
            act.tipoEval = 'directa';
            act.rubricaId = '';
        } else if (value === 'proyecto_acumulativo') {
            act.tipoEval = 'proyecto_acumulativo';
            act.rubricaId = '';
            // Reinicializar seguimientos genéricos o desde plantilla de valores
            const maxPts = parseFloat(act.puntajeMax || 0);
            const isValores = act.nombre && act.nombre.toLowerCase().includes('valores');
            const globalTplKey = 'valoresTemplate_' + act.parcialId;
            const globalTpl = (Store.data.config && Store.data.config[globalTplKey]) ? Store.data.config[globalTplKey] : null;

            act.customFollowups = [];
            if (isValores && globalTpl && globalTpl.length > 0) {
                const tplSum = globalTpl.reduce((s, t) => s + (parseFloat(t.puntaje) || 0), 0) || 1;
                const factor = maxPts / tplSum;
                globalTpl.forEach((t, i) => {
                    act.customFollowups.push({
                        id: 'f' + (i + 1),
                        nombre: t.nombre,
                        puntaje: Math.round((t.puntaje * factor) * 10) / 10,
                        fecha: '',
                        criterio: ''
                    });
                });
            } else {
                const defPts = Math.round((maxPts / 8) * 10) / 10;
                for (let i = 1; i <= 8; i++) {
                    act.customFollowups.push({ id: 'f' + i, nombre: 'Seguimiento ' + i, puntaje: defPts, fecha: '', criterio: '' });
                }
            }
            let diff = maxPts - act.customFollowups.reduce((s, f) => s + f.puntaje, 0);
            if (Math.abs(diff) > 0.01 && act.customFollowups.length > 0) {
                act.customFollowups[act.customFollowups.length - 1].puntaje = Math.round((act.customFollowups[act.customFollowups.length - 1].puntaje + diff) * 10) / 10;
            }
        } else if (value === 'pruebas_formativas_acumulativo') {
            act.tipoEval = 'pruebas_formativas_acumulativo';
            act.rubricaId = '';
            // SIEMPRE reinicializar con los meses correctos para que la sincronización funcione
            const maxPts = parseFloat(act.puntajeMax || 0);
            const defPts = Math.round((maxPts / PF_MESES.length) * 10) / 10;
            act.customFollowups = PF_MESES.map(function(mes, i) {
                return { id: 'pf_mes_' + i, nombre: mes, puntaje: defPts, fecha: '', criterio: 'Prueba Formativa de ' + mes };
            });
            let diff = maxPts - act.customFollowups.reduce((s, f) => s + f.puntaje, 0);
            if (Math.abs(diff) > 0.01 && act.customFollowups.length > 0) {
                act.customFollowups[act.customFollowups.length - 1].puntaje = Math.round((act.customFollowups[act.customFollowups.length - 1].puntaje + diff) * 10) / 10;
            }
        } else {
            act.tipoEval = 'rubrica';
            act.rubricaId = value;
        }

        Store.save();
        UI.toast('Método de calificación actualizado', 'success');
        Views.Evaluacion.gradeActivity(actId);
    };

    // --- PROYECTO CON SEGUIMIENTO ACUMULATIVO ---
    
    Views.Evaluacion.gradeFollowupActivity = function(actId, isInitialRender) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act) return;
        
        const dims = (Store.data.configAcademica && Store.data.configAcademica.dimensions) || [];
        const dim = dims.find(d => d.key === act.dimensionKey || d.key === 'actitudes');
        const dimPct = dim ? parseFloat(dim.porcentaje) : 10;
        const isCuadernoValores = (act.dimensionKey === 'actitudes') || (act.nombre && act.nombre.toLowerCase().includes('valores'));

        let maxPts = parseFloat(act.puntajeMax || 0);

        // Inicializar si no existen seguimientos por defecto
        const PF_MESES = ['Febrero/Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre/Noviembre'];
        const esPFAcumulativo = act.tipoEval === 'pruebas_formativas_acumulativo';
        if (!act.customFollowups || !Array.isArray(act.customFollowups) || act.customFollowups.length === 0) {
            act.customFollowups = [];
            maxPts = parseFloat(act.puntajeMax || 0);
            if (esPFAcumulativo) {
                // 9 seguimientos, uno por mes
                const defaultPoints = Math.round((maxPts / PF_MESES.length) * 10) / 10;
                PF_MESES.forEach(function(mes, i) {
                    act.customFollowups.push({
                        id: 'pf_mes_' + i,
                        nombre: mes,
                        puntaje: defaultPoints,
                        fecha: '',
                        criterio: 'Prueba Formativa de ' + mes
                    });
                });
            } else {
                const globalTplKey = 'valoresTemplate_' + act.parcialId;
                const globalTpl = (Store.data.config && Store.data.config[globalTplKey]) ? Store.data.config[globalTplKey] : null;
                
                if (isCuadernoValores && globalTpl && globalTpl.length > 0) {
                    const tplSum = globalTpl.reduce((s, t) => s + (parseFloat(t.puntaje) || 0), 0) || 1;
                    const factor = maxPts / tplSum;
                    globalTpl.forEach((t, i) => {
                        act.customFollowups.push({
                            id: 'f' + (i + 1),
                            nombre: t.nombre,
                            puntaje: Math.round((t.puntaje * factor) * 10) / 10,
                            fecha: '',
                            criterio: ''
                        });
                    });
                } else {
                    const defaultPoints = Math.round((maxPts / 8) * 10) / 10;
                    for (let i = 1; i <= 8; i++) {
                        act.customFollowups.push({
                            id: 'f' + i,
                            nombre: `Seguimiento ${i}`,
                            puntaje: defaultPoints,
                            fecha: '',
                            criterio: ''
                        });
                    }
                }
            }
            let currentSum = act.customFollowups.reduce((sum, f) => sum + f.puntaje, 0);
            let diff = maxPts - currentSum;
            if (Math.abs(diff) > 0.01 && act.customFollowups.length > 0) {
                act.customFollowups[act.customFollowups.length - 1].puntaje = Math.round((act.customFollowups[act.customFollowups.length - 1].puntaje + diff) * 10) / 10;
            }
            Store.save();
        } else if (!esPFAcumulativo) {
            // Verificar si los seguimientos existentes suman diferente a act.puntajeMax
            let currentSum = act.customFollowups.reduce((sum, f) => sum + (parseFloat(f.puntaje) || 0), 0);
            if (Math.abs(maxPts - currentSum) > 0.05 && currentSum > 0) {
                const scaleFactor = maxPts / currentSum;
                act.customFollowups.forEach(f => {
                    f.puntaje = Math.round((f.puntaje * scaleFactor) * 10) / 10;
                });
                let newSum = act.customFollowups.reduce((sum, f) => sum + f.puntaje, 0);
                let diff = maxPts - newSum;
                if (Math.abs(diff) > 0.01 && act.customFollowups.length > 0) {
                    act.customFollowups[act.customFollowups.length - 1].puntaje = Math.round((act.customFollowups[act.customFollowups.length - 1].puntaje + diff) * 10) / 10;
                }
                Store.save();
            }
        }

        const course = Store.getActiveCourse();
        if (!course) return;
        const students = (Store.getStudentsByCourse(course.id) || []).filter(s => s.estadoMatricula !== 'Traslado' && s.estadoMatricula !== 'Desertor' && s.estadoMatricula !== 'Inactivo');
        const dimIdx = dims.findIndex(d => d.key === act.dimensionKey);
        const theme = Utils.getDimensionTheme(dims[dimIdx]?.nombre, dimIdx);

        const content = document.getElementById('content');
        
                let html = `
<style>
    /* Responsive Styling para la Planilla de Seguimientos y Proyecto Acumulativo */
    .eval-followup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 20px;
    }
    .eval-followup-header-left {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 240px;
    }
    .eval-followup-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }
    .eval-table-container {
        background: #fff;
        border: 1px solid var(--border-soft);
        border-radius: 16px;
        padding: 0;
        box-shadow: var(--shadow-sm);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        position: relative;
        max-width: 100%;
    }
    .eval-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        font-size: 13px;
        min-width: 650px;
    }
    .eval-sticky-num {
        position: sticky;
        left: 0;
        background: #f8fafc;
        z-index: 10;
        border-right: 1px solid #e2e8f0;
        width: 44px;
        min-width: 44px;
        max-width: 44px;
        text-align: center;
    }
    td.eval-sticky-num {
        background: #ffffff;
    }
    .eval-sticky-student {
        position: sticky;
        left: 44px;
        background: #f8fafc;
        z-index: 10;
        border-right: 2px solid #e2e8f0;
        min-width: 160px;
        max-width: 220px;
        box-shadow: 2px 0 5px rgba(0,0,0,0.03);
    }
    td.eval-sticky-student {
        background: #ffffff;
    }
    .eval-sticky-auto {
        position: sticky;
        left: 204px;
        background: #fefce8;
        z-index: 9;
        border-right: 1.5px solid #fef08a;
    }
    td.eval-sticky-auto {
        background: #fffbeb;
    }
    .eval-sticky-total {
        position: sticky;
        right: 0;
        background: #f5f3ff;
        z-index: 10;
        border-left: 2px solid #ddd6fe;
        box-shadow: -2px 0 5px rgba(0,0,0,0.03);
    }
    td.eval-sticky-total {
        background: #faf5ff;
    }
    /* Ocultar flechas (spinners) de inputs numéricos en Chrome, Safari, Edge, Opera y Firefox */
    .eval-quick-fill-input::-webkit-outer-spin-button,
    .eval-quick-fill-input::-webkit-inner-spin-button,
    .followup-input::-webkit-outer-spin-button,
    .followup-input::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0 !important;
    }
    .eval-quick-fill-input,
    .followup-input {
        -moz-appearance: textfield !important;
        appearance: textfield !important;
    }
    @media (max-width: 768px) {
        .eval-followup-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
        }
        .eval-followup-actions {
            width: 100%;
            justify-content: flex-start;
        }
        .eval-followup-actions > * {
            flex: 1 1 auto;
        }
        .eval-sticky-student {
            min-width: 130px;
            max-width: 150px;
            padding: 6px 8px !important;
        }
    }
</style>

<div class="a360-header eval-followup-header">
    <div class="eval-followup-header-left">
        <div class="a360-header-icon" style="background:${theme.bg}; color:${theme.text}; border-radius:16px;">
            <i data-lucide="layers"></i>
        </div>
        <div>
            <h2 class="a360-header-title" style="margin: 0; font-size: 19px;">${act.nombre}</h2>
            <p class="a360-header-subtitle" style="margin: 2px 0 0 0;">
                <span style="color:${theme.text}; font-weight:800;">${act.puntajeMax} pts (Acumulativo)</span> &bull; 
                <span>Seguimientos activos: ${act.customFollowups.length}</span>
            </p>
        </div>
    </div>
    <div class="eval-followup-actions">
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Método:</span>
            <select onchange="Views.Evaluacion.switchGradingMethod('${act.id}', this.value)" style="height: 40px; border-radius: 12px; border: 1.5px solid var(--border-soft); background: #fff; padding: 0 10px; font-size: 13px; font-weight: 700; color: #334155; cursor: pointer; box-shadow: var(--shadow-sm);">
                <option value="directa">✏️ Calificación Directa</option>
                <option value="proyecto_acumulativo" ${act.tipoEval === 'proyecto_acumulativo' ? 'selected' : ''}>📈 Proyecto Acumulativo</option>
                <option value="pruebas_formativas_acumulativo" ${act.tipoEval === 'pruebas_formativas_acumulativo' ? 'selected' : ''}>📊 Pruebas Formativas (Español)</option>
                ${(Store.get('rubricas') || []).filter(r => r.estado !== 'archivada').map(r => `<option value="${r.id}">🧩 Rúbrica: ${r.nombre}</option>`).join('')}
            </select>
        </div>
        ${esPFAcumulativo ? `
        <button class="btn btn-primary" onclick="Views.Evaluacion.sincronizarPruebasFormativas('${actId}')" style="display:flex; align-items:center; gap:8px; border-radius:12px; font-weight:800; height:40px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border:none; box-shadow: 0 4px 12px rgba(14,165,233,0.35);">
            <i data-lucide="refresh-cw" style="width:16px;"></i>
            <span>Sincronizar Pruebas Formativas</span>
        </button>
        ` : `
        <button class="btn btn-secondary" onclick="Views.Evaluacion.checkSharedActivityAutofill('${actId}', true)" title="Comprobar y autocompletar si ya calificaste esta actividad en otra materia de la misma sección" style="display:flex; align-items:center; gap:6px; border-radius:12px; font-weight:800; height:40px; background:#f8fafc; border:1.5px solid var(--border-soft); color:#2563eb;">
            <i data-lucide="copy" style="width:15px;"></i>
            <span>Importar Notas</span>
        </button>
        <button class="btn btn-primary" onclick="Views.Evaluacion.openFollowupConfigModal('${actId}')" style="display:flex; align-items:center; gap:6px; border-radius:12px; font-weight:800; height:40px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border:none; box-shadow: 0 4px 12px rgba(124,58,237,0.3);">
            <i data-lucide="settings" style="width:16px;"></i>
            <span>Configurar</span>
        </button>
        `}
        <button class="btn" onclick="Views.Evaluacion.volverDeCalificar('${act.parcialId}','${act.dimensionKey}')" title="Guardar cambios y regresar al módulo anterior" style="display:flex; align-items:center; gap:8px; border-radius:12px; font-weight:800; height:40px; padding:0 18px; background:linear-gradient(135deg, #f97316 0%, #ea580c 100%); color:#ffffff; border:none; box-shadow:0 4px 12px rgba(234, 88, 12, 0.35); cursor:pointer; transition:all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(234, 88, 12, 0.45)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(234, 88, 12, 0.35)';">
            <i data-lucide="check-circle-2" style="width:16px; height:16px; color:#ffffff;"></i>
            <span>Guardar y Volver</span>
        </button>
    </div>
</div>

<!-- Planilla de seguimientos con Scroll Responsivo y Columnas Fijas -->
<div class="eval-table-container">
    <table class="eval-table">
        <thead>
            <tr style="background:#f8fafc;">
                <th class="eval-sticky-num" style="padding:10px 4px; font-weight:800; color:#475569; border-bottom:2px solid #e2e8f0;">#</th>
                <th class="eval-sticky-student" style="padding:10px 12px; font-weight:800; color:#475569; text-align:left; border-bottom:2px solid #e2e8f0;">Estudiante</th>
                ${!esPFAcumulativo ? `
                <th class="eval-sticky-auto" style="padding: 6px 4px; font-weight:800; color:#d97706; text-align:center; border-bottom:2px solid #e2e8f0; width:52px; min-width:52px; cursor:pointer;" onclick="Views.Evaluacion.quickFillAll('${actId}', '${act.puntajeMax}')" title="Clic aquí para autocompletar para TODOS los alumnos">
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;">
                        <div style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:5px; background:#fef08a; color:#b45309; box-shadow:0 1px 2px rgba(217,119,6,0.15);">
                            <i data-lucide="zap" style="width:12px; height:12px; fill:#f59e0b; color:#d97706;"></i>
                        </div>
                        <span style="font-size:8px; font-weight:900; color:#b45309; letter-spacing:0.02em;">AUTO</span>
                    </div>
                </th>
                ` : ''}
                ${act.customFollowups.map((f, i) => {
                    const isActivo = f.activo !== false;
                    return `
                <th style="padding: 8px 4px; font-weight:800; color:#475569; text-align:center; border-bottom:2px solid #e2e8f0; min-width:${esPFAcumulativo ? '70px' : '106px'}; max-width:${esPFAcumulativo ? '75px' : '130px'}; ${!isActivo ? 'opacity: 0.5; background: #f8fafc;' : ''}" ${f.criterio ? `title="Criterio: ${f.criterio.replace(/"/g, '&quot;')}"` : ''}>
                    <div style="font-size:11px; color:#0f172a; font-weight:900; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;">
                        ${esPFAcumulativo ? `
                            <input type="checkbox" 
                                   ${isActivo ? 'checked' : ''} 
                                   onchange="Views.Evaluacion.toggleMonthActive('${actId}', '${f.id}', this.checked)" 
                                   style="width: 14px; height: 14px; cursor: pointer; margin-bottom: 2px;"
                                   title="Incluir/Excluir en promedio">
                        ` : ''}
                        <span style="font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;" title="${f.nombre}">${f.nombre}</span>
                        ${f.criterio && !esPFAcumulativo ? `<i data-lucide="help-circle" style="width:12px; color:#94a3b8;"></i>` : ''}
                    </div>
                    <div style="font-size: 9px; color:#64748b; font-weight:700; margin-top:2px;">${esPFAcumulativo ? 68 : f.puntaje} pts</div>
                    ${f.fecha && !esPFAcumulativo ? `<div style="font-size:9px; color:#94a3b8; font-weight:500; margin-top:1px;">📅 ${f.fecha}</div>` : ''}
                </th>
                    `;
                }).join('')}
                <th class="eval-sticky-total" style="padding:10px 8px; font-weight:900; color:#7c3aed; text-align:center; border-bottom:2px solid #e2e8f0; width:70px; min-width:70px;">Total</th>
            </tr>
        </thead>
        <tbody>
            ${students.map((s, idx) => {
                const calif = (Store.get('calificaciones') || []).find(c => c.actividadId === actId && c.estudianteId === s.id) || { nota: 0, followups: {} };
                const followupsGrades = calif.followups || {};
                
                let completedCount = 0;
                if (!esPFAcumulativo && act.customFollowups) {
                    act.customFollowups.forEach(f => {
                        const fg = followupsGrades[f.id];
                        if (fg && fg.nota !== undefined && fg.nota !== '' && parseFloat(fg.nota) > 0) completedCount++;
                    });
                }
                
                return `
            <tr style="border-bottom:1px solid #f1f5f9;" onmouseover="this.querySelectorAll('td').forEach(t=>t.style.backgroundColor='#f8fafc');" onmouseout="this.querySelectorAll('td').forEach(t=>t.style.backgroundColor='');">
                <td class="eval-sticky-num" style="padding:10px 4px; color:#64748b; font-weight:700; border-bottom:1px solid #f1f5f9;">${idx + 1}</td>
                <td class="eval-sticky-student" style="padding: 6px 10px; border-bottom:1px solid #f1f5f9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <div style="font-weight:800; color:#0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px;" title="${s.nombreCompleto}">${s.nombreCompleto}</div>
                    <div style="font-size:10px; color:#64748b;">ID: ${s.identidad || 'N/A'}</div>
                </td>
                ${!esPFAcumulativo ? `
                <td class="eval-sticky-auto" style="padding: 3px; text-align:center; border-bottom:1px solid #f1f5f9; vertical-align:middle;">
                    <input type="number" 
                           id="quick-fill-${s.id}" 
                           class="eval-quick-fill-input"
                           data-row-idx="${idx}"
                           min="0" 
                           max="${act.customFollowups.length}" 
                           step="1" 
                           inputmode="numeric"
                           pattern="[0-9]*"
                           value="${completedCount > 0 ? completedCount : ''}" 
                           placeholder="⚡" 
                           title="Ingresa cantidad (0 a ${act.customFollowups.length}) y presiona Enter para avanzar" 
                           oninput="Views.Evaluacion.autocompleteFollowups('${actId}', '${s.id}', this.value, '${act.puntajeMax}')" 
                           onkeydown="Views.Evaluacion.handleQuickFillKey(event, ${idx})"
                           style="width: 36px; height: 30px; text-align: center; border-radius: 7px; border: 1.5px solid #fde68a; background: #ffffff; font-weight: 800; font-size: 12px; color: #b45309; outline: none; transition: all 0.2s; box-shadow: 0 1px 2px rgba(245,158,11,0.08); -webkit-appearance: none; -moz-appearance: textfield; margin: 0;" 
                           onfocus="this.style.borderColor='#f59e0b'; this.style.boxShadow='0 0 0 3px rgba(245,158,11,0.2)';" 
                           onblur="this.style.borderColor='#fde68a'; this.style.boxShadow='0 1px 2px rgba(245,158,11,0.08)';">
                </td>
                ` : ''}
                ${act.customFollowups.map(f => {
                    const isActivo = f.activo !== false;
                    const fVal = (followupsGrades[f.id] && followupsGrades[f.id].nota !== undefined) ? followupsGrades[f.id].nota : '';
                    const fNum = parseFloat(fVal);
                    const isMax = !isNaN(fNum) && fNum >= parseFloat(f.puntaje) && parseFloat(f.puntaje) > 0;
                    return `
                <td style="padding: 4px; text-align:center; border-bottom:1px solid #f1f5f9; ${!isActivo ? 'opacity: 0.5; background: #f8fafc;' : ''}">
                    ${esPFAcumulativo ? `
                      <input type="number" 
                             class="followup-input"
                             data-student-id="${s.id}" 
                             data-followup-id="${f.id}" 
                             data-max="68" 
                             value="${fVal}" 
                             placeholder="-"
                             min="0"
                             max="68"
                             step="1"
                             ${!isActivo ? 'disabled' : ''}
                             onchange="Views.Evaluacion.saveFollowupGrade('${actId}', '${s.id}', '${f.id}', this.value, '${act.puntajeMax}')"
                             style="width:48px; height:30px; text-align:center; border-radius:6px; border:1.5px solid ${!isActivo ? '#e2e8f0' : '#cbd5e1'}; font-weight:800; font-size:12px; color:${!isActivo ? '#94a3b8' : '#0f172a'}; background:${!isActivo ? '#f1f5f9' : '#fff'}; transition:all 0.2s; padding: 0; outline: none;"
                             onfocus="this.style.borderColor='#7c3aed'; this.style.boxShadow='0 0 0 3px rgba(124,58,237,0.15)';"
                             onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none';">
                    ` : `
                      <div style="display:inline-flex; align-items:center; justify-content:center; gap:4px; padding:1px 0;">
                          <!-- Opción 1: Marca como Logrado (asigna el 100% de puntos del seguimiento) -->
                          <button type="button" 
                                  class="followup-cell-btn ${isMax ? 'active' : ''}" 
                                  data-student-id="${s.id}" 
                                  data-followup-id="${f.id}" 
                                  onclick="Views.Evaluacion.toggleFollowupCell(this, '${actId}', '${s.id}', '${f.id}', ${f.puntaje}, '${act.puntajeMax}')"
                                  title="${isMax ? `Logrado (${f.puntaje} pts completos). Clic para desmarcar` : `Marcar como logrado (asigna ${f.puntaje} pts)`}"
                                  ${!isActivo ? 'disabled' : ''}
                                  style="width:28px; height:28px; min-width:28px; border-radius:6px; border:1.5px solid ${isMax ? '#16a34a' : '#cbd5e1'}; background:${isMax ? '#22c55e' : '#f8fafc'}; color:${isMax ? '#ffffff' : '#94a3b8'}; cursor:${!isActivo ? 'not-allowed' : 'pointer'}; display:inline-flex; align-items:center; justify-content:center; padding:0; transition:all 0.15s; flex-shrink:0;">
                              <i data-lucide="check" style="width:14px; height:14px; stroke-width:3.2px;"></i>
                          </button>
                          <!-- Opción 2: Ingreso Manual de Calificación (no mayor a la configurada) -->
                          <input type="number" 
                                 inputmode="decimal"
                                 class="followup-input"
                                 data-student-id="${s.id}" 
                                 data-followup-id="${f.id}" 
                                 data-max="${f.puntaje}" 
                                 value="${fVal !== '' && fVal !== null && fVal !== undefined ? fVal : ''}" 
                                 placeholder="-"
                                 min="0"
                                 max="${f.puntaje}"
                                 step="any"
                                 ${!isActivo ? 'disabled' : ''}
                                 oninput="Views.Evaluacion.handleFollowupManualInput(this, '${actId}', '${s.id}', '${f.id}', ${f.puntaje}, '${act.puntajeMax}')"
                                 onchange="Views.Evaluacion.saveFollowupGrade('${actId}', '${s.id}', '${f.id}', this.value, '${act.puntajeMax}')"
                                 style="width:48px; height:28px; min-width:44px; text-align:center; border-radius:6px; border:1.5px solid ${!isActivo ? '#e2e8f0' : (isMax ? '#86efac' : '#cbd5e1')}; font-weight:800; font-size:12px; color:${!isActivo ? '#94a3b8' : '#0f172a'}; background:${!isActivo ? '#f1f5f9' : '#ffffff'}; transition:all 0.2s; padding:0 2px; outline:none; -moz-appearance:textfield;"
                                 onfocus="this.select(); this.style.borderColor='#7c3aed'; this.style.boxShadow='0 0 0 2px rgba(124,58,237,0.18)';"
                                 onblur="this.style.borderColor='${isMax ? '#86efac' : '#cbd5e1'}'; this.style.boxShadow='none';"
                                 title="Ingreso manual: 0 a ${f.puntaje} pts">
                      </div>
                    `}
                </td>
                    `;
                }).join('')}
                <td class="eval-sticky-total" style="padding:8px 6px; text-align:center; font-weight:900; font-size:15px; color:#00C853; border-bottom:1px solid #f1f5f9;" id="total-${s.id}">
                    ${calif.puntajeObtenido !== undefined ? calif.puntajeObtenido : (calif.nota || 0)}
                </td>
            </tr>
                `;
            }).join('')}
        </tbody>
    </table>
</div>
        `;
        content.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Auto-sincronizar al abrir si es tipo pruebas formativas acumulativo
        if (esPFAcumulativo && isInitialRender) {
            setTimeout(function() {
                Views.Evaluacion.sincronizarPruebasFormativas(actId, true);
            }, 300);
        }
        
        // Sugerencia de autocompletado si existen calificaciones en cursos hermanos
        if (isInitialRender) {
            setTimeout(() => Views.Evaluacion.checkSharedActivityAutofill(actId), 500);
        }
    };

    Views.Evaluacion.toggleFollowupCell = function(btn, actId, studentId, followupId, fPuntaje, actPuntajeMax) {
        const input = document.querySelector(`input.followup-input[data-student-id="${studentId}"][data-followup-id="${followupId}"]`);
        const maxLimit = parseFloat(fPuntaje || 0);
        const currentVal = input && input.value !== '' ? parseFloat(input.value) : (btn.classList.contains('active') ? maxLimit : 0);
        const isCurrentlyMax = !isNaN(currentVal) && currentVal >= maxLimit && maxLimit > 0;
        
        let newVal;
        if (isCurrentlyMax) {
            // Desmarcar: pasar a vacío
            newVal = '';
            btn.classList.remove('active');
            btn.style.background = '#f8fafc';
            btn.style.borderColor = '#cbd5e1';
            btn.style.color = '#94a3b8';
            btn.title = `Marcar como logrado (asigna ${maxLimit} pts)`;
            if (input) {
                input.value = '';
                input.style.borderColor = '#cbd5e1';
            }
        } else {
            // Marcar como logrado: el sistema detecta esta marca como que el alumno tiene todos los puntos asignados
            newVal = maxLimit;
            btn.classList.add('active');
            btn.style.background = '#22c55e';
            btn.style.borderColor = '#16a34a';
            btn.style.color = '#ffffff';
            btn.title = `Logrado (puntaje completo: ${maxLimit} pts). Clic para desmarcar`;
            if (input) {
                input.value = maxLimit;
                input.style.borderColor = '#86efac';
            }
        }

        Views.Evaluacion.saveFollowupGrade(actId, studentId, followupId, newVal, actPuntajeMax);
        
        const calif = (Store.get('calificaciones') || []).find(c => c.actividadId === actId && c.estudianteId === studentId);
        if(calif) {
            const totalEl = document.getElementById(`total-${studentId}`);
            if(totalEl) totalEl.innerText = calif.puntajeObtenido !== undefined ? calif.puntajeObtenido : (calif.nota || 0);

            const act = (Store.get('actividades') || []).find(a => a.id === actId);
            if (act && act.customFollowups) {
                let completedCount = 0;
                act.customFollowups.forEach(f => {
                    const fg = calif.followups && calif.followups[f.id];
                    if (fg && fg.nota !== undefined && fg.nota !== '' && parseFloat(fg.nota) > 0) completedCount++;
                });
                const quickFill = document.getElementById(`quick-fill-${studentId}`);
                if (quickFill) quickFill.value = completedCount > 0 ? completedCount : '';
            }
        }
    };

    Views.Evaluacion.handleFollowupManualInput = function(input, actId, studentId, followupId, fPuntaje, actPuntajeMax) {
        const maxLimit = parseFloat(fPuntaje || input.dataset.max || 0);
        let val = input.value;
        const btn = document.querySelector(`button.followup-cell-btn[data-student-id="${studentId}"][data-followup-id="${followupId}"]`);
        
        if (val === '' || val === null || val === undefined) {
            if (btn) {
                btn.classList.remove('active');
                btn.style.background = '#f8fafc';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#94a3b8';
                btn.title = `Marcar como logrado (asigna ${maxLimit} pts)`;
            }
            return;
        }

        let parsedVal = parseFloat(val);
        if (isNaN(parsedVal)) return;

        // Validación estricta: la nota no debe ser mayor a la configurada
        if (parsedVal > maxLimit && maxLimit > 0) {
            parsedVal = maxLimit;
            input.value = maxLimit;
            input.style.borderColor = '#ef4444';
            input.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.25)';
            if (window.UI && typeof UI.toast === 'function') {
                UI.toast(`⚠️ La calificación manual no puede superar el máximo configurado (${maxLimit} pts).`, 'warning');
            }
            setTimeout(() => {
                input.style.borderColor = '#86efac';
                input.style.boxShadow = 'none';
            }, 1800);
        } else if (parsedVal < 0) {
            parsedVal = 0;
            input.value = 0;
        }

        // Sincronización inmediata con el botón de logro
        if (btn) {
            const isFull = parsedVal >= maxLimit && maxLimit > 0;
            if (isFull) {
                btn.classList.add('active');
                btn.style.background = '#22c55e';
                btn.style.borderColor = '#16a34a';
                btn.style.color = '#ffffff';
                btn.title = `Logrado (puntaje completo: ${maxLimit} pts). Clic para desmarcar`;
            } else {
                btn.classList.remove('active');
                btn.style.background = '#f8fafc';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#94a3b8';
                btn.title = `Marcar como logrado (asigna ${maxLimit} pts)`;
            }
        }
    };

    Views.Evaluacion.autocompleteFollowups = function(actId, studentId, countStr, actPuntajeMax) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act || !act.customFollowups) return;
        
        let count = parseInt(countStr, 10);
        if (isNaN(count) || count < 0) {
            count = 0;
        }
        if (count > act.customFollowups.length) {
            count = act.customFollowups.length;
            const inputEl = document.getElementById(`quick-fill-${studentId}`);
            if (inputEl) inputEl.value = count;
        }

        const isCuadernoValores = (act.dimensionKey === 'actitudes') || (act.nombre && act.nombre.toLowerCase().includes('valores'));

        const califs = Store.get('calificaciones') || [];
        let calif = califs.find(c => c.actividadId === actId && c.estudianteId === studentId);
        if (!calif) {
            calif = {
                id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                cursoId: Store.data.activeCourseId,
                actividadId: actId,
                estudianteId: studentId,
                puntajeObtenido: 0,
                porcentajeObtenido: 0,
                nota: 0,
                followups: {}
            };
            califs.push(calif);
        }
        if (!calif.followups) calif.followups = {};

        let sum = 0;
        act.customFollowups.forEach((f, idx) => {
            const shouldBeActive = idx < count;
            const val = shouldBeActive ? f.puntaje : '';
            calif.followups[f.id] = {
                nota: val,
                fecha: shouldBeActive ? (new Date().toISOString().split('T')[0]) : ''
            };
            if (shouldBeActive) {
                sum += parseFloat(f.puntaje || 0);
            }

            if (isCuadernoValores) {
                const btn = document.querySelector(`button[data-student-id="${studentId}"][data-followup-id="${f.id}"]`);
                if (btn) {
                    if (shouldBeActive) {
                        btn.classList.add('active');
                        btn.style.background = '#22c55e';
                        btn.style.borderColor = '#16a34a';
                        btn.style.color = '#fff';
                    } else {
                        btn.classList.remove('active');
                        btn.style.background = '#f8fafc';
                        btn.style.borderColor = '#e2e8f0';
                        btn.style.color = '#cbd5e1';
                    }
                }
            } else {
                const input = document.querySelector(`input[data-student-id="${studentId}"][data-followup-id="${f.id}"]`);
                if (input) {
                    input.value = shouldBeActive ? f.puntaje : '';
                }
            }
        });

        const total = Math.round(sum * 10) / 10;
        calif.nota = total;
        calif.puntajeObtenido = total;
        calif.porcentajeObtenido = (total / parseFloat(actPuntajeMax)) * 100;

        Views.Evaluacion.saveGrade(actId, studentId, total, parseFloat(actPuntajeMax));

        const totalCell = document.getElementById(`total-${studentId}`);
        if (totalCell) {
            totalCell.textContent = total;
        }

        Store.save();
    };

    Views.Evaluacion.quickFillAll = function(actId, actPuntajeMax) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act || !act.customFollowups) return;
        const maxFollowups = act.customFollowups.length;
        
        const res = prompt(`¿Cuántos seguimientos deseas autocompletar para TODOS los alumnos? (0 a ${maxFollowups}):`, maxFollowups);
        if (res === null) return;
        let count = parseInt(res, 10);
        if (isNaN(count)) return;
        if (count < 0) count = 0;
        if (count > maxFollowups) count = maxFollowups;

        const course = Store.getActiveCourse();
        if (!course) return;
        const students = Store.getStudentsByCourse(course.id) || [];
        
        students.forEach(s => {
            Views.Evaluacion.autocompleteFollowups(actId, s.id, count, actPuntajeMax);
            const qf = document.getElementById(`quick-fill-${s.id}`);
            if (qf) qf.value = count > 0 ? count : '';
        });
        UI.toast(`Autocompletados ${count} seguimientos para ${students.length} alumnos ✓`, 'success');
    };

    Views.Evaluacion.handleQuickFillKey = function(e, currentIdx) {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            const allInputs = Array.from(document.querySelectorAll('.eval-quick-fill-input'));
            if (!allInputs.length) return;
            const nextIdx = currentIdx + 1;
            if (nextIdx < allInputs.length) {
                allInputs[nextIdx].focus();
                allInputs[nextIdx].select();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const allInputs = Array.from(document.querySelectorAll('.eval-quick-fill-input'));
            if (!allInputs.length) return;
            const prevIdx = currentIdx - 1;
            if (prevIdx >= 0) {
                allInputs[prevIdx].focus();
                allInputs[prevIdx].select();
            }
        }
    };

    Views.Evaluacion.isMatchingCourse = function(c1, c2) {
        if (!c1 || !c2 || c1.id === c2.id) return false;
        const norm = (str) => (str || '').toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cleanSec = (str) => (str || '').toString().toLowerCase().trim().replace(/["'“”\s]/g, '');
        const cleanGrado = (str) => (str || '').toString().toLowerCase().trim().replace(/[^0-9a-z]/g, '');

        const centro1 = norm(c1.centroEducativo || c1.centro || '');
        const centro2 = norm(c2.centroEducativo || c2.centro || '');
        if (centro1 && centro2 && centro1 !== centro2) return false;

        const grado1 = cleanGrado(c1.grado);
        const grado2 = cleanGrado(c2.grado);
        if (grado1 !== grado2) return false;

        const sec1 = cleanSec(c1.seccion);
        const sec2 = cleanSec(c2.seccion);
        if (sec1 !== sec2) return false;

        return true;
    };

    Views.Evaluacion.isMatchingActivity = function(act1, act2) {
        if (!act1 || !act2 || act1.id === act2.id) return false;

        // Validar coincidencia de Parcial por número
        const parciales = Store.get('parciales') || [];
        const p1 = parciales.find(p => p.id === act1.parcialId);
        const p2 = parciales.find(p => p.id === act2.parcialId);
        if (p1 && p2) {
            if (p1.numero !== p2.numero) return false;
        } else if (act1.parcialId !== act2.parcialId) {
            return false;
        }

        const norm = (str) => (str || '').toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const n1 = norm(act1.nombre);
        const n2 = norm(act2.nombre);

        // 1. Coincidencia por "valores" (Cuaderno de Valores, etc.)
        if (n1.includes('valores') && n2.includes('valores')) return true;

        // 2. Coincidencia en dimensión actitudes o actitud
        if ((act1.dimensionKey === 'actitudes' || n1.includes('actitud')) && 
            (act2.dimensionKey === 'actitudes' || n2.includes('actitud'))) {
            return true;
        }

        // 3. Mismo nombre en Proyectos Acumulativos
        if (n1 === n2 && (act1.tipoEval === 'proyecto_acumulativo' || act2.tipoEval === 'proyecto_acumulativo')) {
            return true;
        }

        // 4. Mismo nombre no genérico
        const genericPatterns = /^(tarea|examen|prueba|actividad|trabajo|evaluacion|guia|laboratorio)\s*(\d+)?$/i;
        if (n1 === n2 && !genericPatterns.test(n1) && n1.length > 3) {
            return true;
        }

        return false;
    };

    Views.Evaluacion.findMatchingStudent = function(student, targetStudents) {
        if (!student || !targetStudents || !targetStudents.length) return null;
        let found = targetStudents.find(s => s.id === student.id);
        if (found) return found;

        const idNum = (student.identidad || '').toString().trim();
        if (idNum && idNum.toLowerCase() !== 'n/a' && idNum !== '') {
            found = targetStudents.find(s => (s.identidad || '').toString().trim() === idNum);
            if (found) return found;
        }

        const normName = (str) => (str || '').toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
        const sName = normName(student.nombreCompleto);
        if (sName) {
            found = targetStudents.find(s => normName(s.nombreCompleto) === sName);
            if (found) return found;
        }

        return null;
    };

    Views.Evaluacion.syncSingleGradeAcrossCourses = function(sourceActId, studentId, gradeVal, actMax, followupsData = null) {
        if (!Store.data) return;
        const allActs = Store.get('actividades') || [];
        const act1 = allActs.find(a => a.id === sourceActId);
        if (!act1) return;

        const allCourses = Store.get('cursos') || [];
        const c1 = allCourses.find(c => c.id === act1.cursoId);
        if (!c1) return;

        const allStudents = Store.get('estudiantes') || [];
        const s1 = allStudents.find(e => e.id === studentId);
        if (!s1) return;

        const matchingCourses = allCourses.filter(c2 => Views.Evaluacion.isMatchingCourse(c1, c2));
        if (!matchingCourses.length) return;

        let anyUpdated = false;
        const allCalifs = Store.get('calificaciones') || [];

        matchingCourses.forEach(c2 => {
            const matchingActs = allActs.filter(a => a.cursoId === c2.id && Views.Evaluacion.isMatchingActivity(act1, a));
            if (!matchingActs.length) return;

            const c2Students = Store.getStudentsByCourse(c2.id) || [];
            const s2 = Views.Evaluacion.findMatchingStudent(s1, c2Students);
            if (!s2) return;

            matchingActs.forEach(act2 => {
                if (act1.customFollowups && act1.customFollowups.length > 0) {
                    if (!act2.customFollowups || act2.customFollowups.length === 0) {
                        act2.customFollowups = JSON.parse(JSON.stringify(act1.customFollowups));
                        act2.tipoEval = act1.tipoEval || 'proyecto_acumulativo';
                    }
                }

                let targetScore = '';
                if (gradeVal !== '' && gradeVal !== null && gradeVal !== undefined) {
                    const parsed = parseFloat(gradeVal);
                    if (!isNaN(parsed)) {
                        const m1 = parseFloat(act1.puntajeMax || actMax || 10);
                        const m2 = parseFloat(act2.puntajeMax || 10);
                        targetScore = (m1 > 0 && m2 > 0 && m1 !== m2) ? Math.round(((parsed / m1) * m2) * 10) / 10 : parsed;
                    }
                }

                let cal2 = allCalifs.find(c => c.actividadId === act2.id && c.estudianteId === s2.id);
                if (!cal2) {
                    if (targetScore !== '') {
                        cal2 = {
                            id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                            cursoId: c2.id,
                            actividadId: act2.id,
                            estudianteId: s2.id,
                            puntajeObtenido: targetScore,
                            nota: targetScore,
                            porcentajeObtenido: (targetScore / (parseFloat(act2.puntajeMax) || 10)) * 100,
                            followups: {}
                        };
                        allCalifs.push(cal2);
                        anyUpdated = true;
                    }
                } else {
                    cal2.puntajeObtenido = targetScore;
                    cal2.nota = targetScore;
                    cal2.porcentajeObtenido = targetScore !== '' ? (targetScore / (parseFloat(act2.puntajeMax) || 10)) * 100 : 0;
                    anyUpdated = true;
                }

                if (cal2 && followupsData && act1.customFollowups && act2.customFollowups) {
                    if (!cal2.followups) cal2.followups = {};
                    act1.customFollowups.forEach((f1, idx) => {
                        const f2 = act2.customFollowups[idx] || act2.customFollowups.find(x => x.id === f1.id);
                        if (f2 && followupsData[f1.id]) {
                            cal2.followups[f2.id] = JSON.parse(JSON.stringify(followupsData[f1.id]));
                        }
                    });
                    anyUpdated = true;
                }
            });
        });

        if (anyUpdated) {
            Store.save();
        }
    };

    Views.Evaluacion.syncAllSharedActivities = function(targetCourseId = null, targetParcialId = null) {
        if (!Store.data) return 0;
        const allCourses = Store.get('cursos') || [];
        const allActs = Store.get('actividades') || [];
        const allCalifs = Store.get('calificaciones') || [];

        let totalSynced = 0;
        const coursesToProcess = targetCourseId ? allCourses.filter(c => c.id === targetCourseId) : allCourses;

        coursesToProcess.forEach(c1 => {
            const matchingCourses = allCourses.filter(c2 => Views.Evaluacion.isMatchingCourse(c1, c2));
            if (!matchingCourses.length) return;

            let c1Acts = allActs.filter(a => a.cursoId === c1.id);
            if (targetParcialId && targetParcialId !== 'all') {
                c1Acts = c1Acts.filter(a => a.parcialId === targetParcialId);
            }

            c1Acts.forEach(act1 => {
                matchingCourses.forEach(c2 => {
                    const matchingActs = allActs.filter(a => a.cursoId === c2.id && Views.Evaluacion.isMatchingActivity(act1, a));
                    matchingActs.forEach(act2 => {
                        const c1Students = Store.getStudentsByCourse(c1.id) || [];
                        const c2Students = Store.getStudentsByCourse(c2.id) || [];

                        c1Students.forEach(s1 => {
                            const s2 = Views.Evaluacion.findMatchingStudent(s1, c2Students);
                            if (!s2) return;

                            const cal1 = allCalifs.find(c => c.actividadId === act1.id && c.estudianteId === s1.id);
                            const cal2 = allCalifs.find(c => c.actividadId === act2.id && c.estudianteId === s2.id);

                            const has1 = cal1 && cal1.puntajeObtenido !== undefined && cal1.puntajeObtenido !== '' && cal1.puntajeObtenido !== null;
                            const has2 = cal2 && cal2.puntajeObtenido !== undefined && cal2.puntajeObtenido !== '' && cal2.puntajeObtenido !== null;

                            if (has1 && !has2) {
                                if (act1.customFollowups && act1.customFollowups.length > 0 && (!act2.customFollowups || act2.customFollowups.length === 0)) {
                                    act2.customFollowups = JSON.parse(JSON.stringify(act1.customFollowups));
                                    act2.tipoEval = act1.tipoEval || 'proyecto_acumulativo';
                                }

                                const raw1 = parseFloat(cal1.puntajeObtenido) || 0;
                                const m1 = parseFloat(act1.puntajeMax || 10);
                                const m2 = parseFloat(act2.puntajeMax || 10);
                                const val2 = (m1 > 0 && m2 > 0 && m1 !== m2) ? Math.round(((raw1 / m1) * m2) * 10) / 10 : raw1;

                                let mappedFollowups = {};
                                if (cal1.followups && act1.customFollowups && act2.customFollowups) {
                                    act1.customFollowups.forEach((f1, idx) => {
                                        const f2 = act2.customFollowups[idx] || act2.customFollowups.find(x => x.id === f1.id);
                                        if (f2 && cal1.followups[f1.id]) {
                                            mappedFollowups[f2.id] = JSON.parse(JSON.stringify(cal1.followups[f1.id]));
                                        }
                                    });
                                }

                                if (!cal2) {
                                    allCalifs.push({
                                        id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                        cursoId: c2.id,
                                        actividadId: act2.id,
                                        estudianteId: s2.id,
                                        puntajeObtenido: val2,
                                        nota: val2,
                                        porcentajeObtenido: (val2 / m2) * 100,
                                        followups: mappedFollowups
                                    });
                                } else {
                                    cal2.puntajeObtenido = val2;
                                    cal2.nota = val2;
                                    cal2.porcentajeObtenido = (val2 / m2) * 100;
                                    cal2.followups = mappedFollowups;
                                }
                                totalSynced++;
                            } else if (!has1 && has2) {
                                if (act2.customFollowups && act2.customFollowups.length > 0 && (!act1.customFollowups || act1.customFollowups.length === 0)) {
                                    act1.customFollowups = JSON.parse(JSON.stringify(act2.customFollowups));
                                    act1.tipoEval = act2.tipoEval || 'proyecto_acumulativo';
                                }

                                const raw2 = parseFloat(cal2.puntajeObtenido) || 0;
                                const m1 = parseFloat(act1.puntajeMax || 10);
                                const m2 = parseFloat(act2.puntajeMax || 10);
                                const val1 = (m1 > 0 && m2 > 0 && m1 !== m2) ? Math.round(((raw2 / m2) * m1) * 10) / 10 : raw2;

                                let mappedFollowups = {};
                                if (cal2.followups && act2.customFollowups && act1.customFollowups) {
                                    act2.customFollowups.forEach((f2, idx) => {
                                        const f1 = act1.customFollowups[idx] || act1.customFollowups.find(x => x.id === f2.id);
                                        if (f1 && cal2.followups[f2.id]) {
                                            mappedFollowups[f1.id] = JSON.parse(JSON.stringify(cal2.followups[f2.id]));
                                        }
                                    });
                                }

                                if (!cal1) {
                                    allCalifs.push({
                                        id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                                        cursoId: c1.id,
                                        actividadId: act1.id,
                                        estudianteId: s1.id,
                                        puntajeObtenido: val1,
                                        nota: val1,
                                        porcentajeObtenido: (val1 / m1) * 100,
                                        followups: mappedFollowups
                                    });
                                } else {
                                    cal1.puntajeObtenido = val1;
                                    cal1.nota = val1;
                                    cal1.porcentajeObtenido = (val1 / m1) * 100;
                                    cal1.followups = mappedFollowups;
                                }
                                totalSynced++;
                            }
                        });
                    });
                });
            });
        });

        if (totalSynced > 0) {
            Store.save();
        }
        return totalSynced;
    };

    Views.Evaluacion.checkSharedActivityAutofill = function(currentActId, isManualTrigger = false) {
        if (!Store.data) return;
        const allActs = Store.get('actividades') || [];
        const act = allActs.find(a => a.id === currentActId);
        if (!act) return;

        const allCourses = Store.get('cursos') || [];
        const currentCourse = allCourses.find(c => c.id === act.cursoId);
        if (!currentCourse) return;

        // Verificar cuántas notas ya tiene la actividad actual
        const allCalifs = Store.get('calificaciones') || [];
        const currentStudents = Store.getStudentsByCourse(currentCourse.id) || [];
        const existingGradesCount = allCalifs.filter(c => c.actividadId === act.id && c.puntajeObtenido !== undefined && c.puntajeObtenido !== '' && c.puntajeObtenido !== null).length;

        // Si la mayoría ya tiene nota registrada y no es manual, no interrumpir con aviso
        if (!isManualTrigger && currentStudents.length > 0 && existingGradesCount >= currentStudents.length) {
            return;
        }

        // Buscar cursos hermanos (mismo centro, grado y sección)
        const matchingCourses = allCourses.filter(c2 => Views.Evaluacion.isMatchingCourse(currentCourse, c2));
        if (!matchingCourses.length) {
            if (isManualTrigger) {
                UI.toast('No se encontraron otras secciones o materias hermanas con este mismo grado y sección.', 'info');
            }
            return;
        }

        // Buscar actividades coincidentes con calificaciones existentes
        let candidate = null;
        for (const c2 of matchingCourses) {
            const c2Acts = allActs.filter(a => a.cursoId === c2.id && Views.Evaluacion.isMatchingActivity(act, a));
            for (const a2 of c2Acts) {
                const a2Califs = allCalifs.filter(c => c.actividadId === a2.id && c.puntajeObtenido !== undefined && c.puntajeObtenido !== '' && c.puntajeObtenido !== null);
                if (a2Califs.length > 0) {
                    candidate = {
                        sourceCourse: c2,
                        sourceAct: a2,
                        gradesCount: a2Califs.length
                    };
                    break;
                }
            }
            if (candidate) break;
        }

        if (!candidate) {
            if (isManualTrigger) {
                UI.toast('No se encontraron calificaciones registradas para esta actividad en otras materias.', 'info');
            }
            return;
        }

        // Mostrar modal amigable de confirmación al usuario
        const html = `
            <div style="padding: 18px 20px;">
                <div style="display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(37,99,235,0.15);">
                        <i data-lucide="layers" style="width: 24px; height: 24px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0 0 4px 0;">Calificaciones detectadas en otro curso</h3>
                        <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.5;">
                            El sistema detectó <strong>${candidate.gradesCount} calificaciones</strong> registradas para esta misma actividad en:
                        </p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin-top: 10px; font-size: 12px; color: #334155;">
                            <div>📚 <strong>Curso origen:</strong> ${candidate.sourceCourse.materia || candidate.sourceCourse.nombre} (${candidate.sourceCourse.grado || ''} "${candidate.sourceCourse.seccion || ''}")</div>
                            <div style="margin-top: 4px;">🎯 <strong>Actividad:</strong> ${candidate.sourceAct.nombre} (${candidate.sourceAct.puntajeMax} pts)</div>
                        </div>
                    </div>
                </div>

                <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 10px 14px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 12px; color: #b45309; line-height: 1.4;">
                        ¿Deseas autocompletar las notas de esta actividad con las calificaciones de <strong>${candidate.sourceCourse.materia || candidate.sourceCourse.nombre}</strong>?
                    </p>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="btn btn-secondary" onclick="UI.closeModal()" style="border-radius: 10px; font-weight: 700; font-size: 13px; height: 38px; padding: 0 16px;">
                        No, calificaré por separado
                    </button>
                    <button class="btn btn-primary" onclick="Views.Evaluacion.importSharedActivityGrades('${candidate.sourceAct.id}', '${act.id}'); UI.closeModal();" style="border-radius: 10px; font-weight: 800; font-size: 13px; height: 38px; padding: 0 18px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border: none; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
                        ⚡ Sí, autocompletar
                    </button>
                </div>
            </div>
        `;

        UI.modal('Sugerencia de Autocompletado', html);
        if (window.lucide) window.lucide.createIcons();
    };

    Views.Evaluacion.importSharedActivityGrades = function(sourceActId, targetActId) {
        if (!Store.data) return;
        const allActs = Store.get('actividades') || [];
        const actSource = allActs.find(a => a.id === sourceActId);
        const actTarget = allActs.find(a => a.id === targetActId);
        if (!actSource || !actTarget) return;

        const allCourses = Store.get('cursos') || [];
        const cSource = allCourses.find(c => c.id === actSource.cursoId);
        const cTarget = allCourses.find(c => c.id === actTarget.cursoId);
        if (!cSource || !cTarget) return;

        const sourceStudents = Store.getStudentsByCourse(cSource.id) || [];
        const targetStudents = Store.getStudentsByCourse(cTarget.id) || [];
        const allCalifs = Store.get('calificaciones') || [];

        // Si el target no tiene seguimientos configurados y el source sí, heredarlos
        if (actSource.customFollowups && actSource.customFollowups.length > 0 && (!actTarget.customFollowups || actTarget.customFollowups.length === 0)) {
            actTarget.customFollowups = JSON.parse(JSON.stringify(actSource.customFollowups));
            actTarget.tipoEval = actSource.tipoEval || 'proyecto_acumulativo';
        }

        let copiedCount = 0;
        const mSource = parseFloat(actSource.puntajeMax || 10);
        const mTarget = parseFloat(actTarget.puntajeMax || 10);

        targetStudents.forEach(tStudent => {
            const sStudent = Views.Evaluacion.findMatchingStudent(tStudent, sourceStudents);
            if (!sStudent) return;

            const sCalif = allCalifs.find(c => c.actividadId === actSource.id && c.estudianteId === sStudent.id);
            if (!sCalif || sCalif.puntajeObtenido === undefined || sCalif.puntajeObtenido === '' || sCalif.puntajeObtenido === null) return;

            const rawVal = parseFloat(sCalif.puntajeObtenido) || 0;
            const targetScore = (mSource > 0 && mTarget > 0 && mSource !== mTarget) 
                ? Math.round(((rawVal / mSource) * mTarget) * 10) / 10 
                : rawVal;

            let mappedFollowups = {};
            if (sCalif.followups && actSource.customFollowups && actTarget.customFollowups) {
                actTarget.customFollowups.forEach((tf, idx) => {
                    const sf = actSource.customFollowups[idx] || actSource.customFollowups.find(x => x.id === tf.id);
                    if (sf && sCalif.followups[sf.id]) {
                        mappedFollowups[tf.id] = JSON.parse(JSON.stringify(sCalif.followups[sf.id]));
                    }
                });
            }

            let tCalif = allCalifs.find(c => c.actividadId === actTarget.id && c.estudianteId === tStudent.id);
            if (!tCalif) {
                tCalif = {
                    id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    cursoId: cTarget.id,
                    actividadId: actTarget.id,
                    estudianteId: tStudent.id,
                    puntajeObtenido: targetScore,
                    nota: targetScore,
                    porcentajeObtenido: (targetScore / mTarget) * 100,
                    followups: mappedFollowups
                };
                allCalifs.push(tCalif);
            } else {
                tCalif.puntajeObtenido = targetScore;
                tCalif.nota = targetScore;
                tCalif.porcentajeObtenido = (targetScore / mTarget) * 100;
                tCalif.followups = mappedFollowups;
            }
            copiedCount++;
        });

        Store.save();
        UI.toast(`¡Se autocompletaron las calificaciones de ${copiedCount} estudiantes! ✓`, 'success');

        // Refrescar la vista actual de evaluación
        if (actTarget.tipoEval === 'proyecto_acumulativo' || actTarget.tipoEval === 'pruebas_formativas_acumulativo') {
            Views.Evaluacion.gradeFollowupActivity(actTarget.id, false);
        } else {
            Views.Evaluacion.gradeActivity(actTarget.id);
        }
    };

    Views.Evaluacion.checkValoresAutofill = function(currentActId) {
        Views.Evaluacion.checkSharedActivityAutofill(currentActId);
    };

    Views.Evaluacion.copyValoresGrades = function(sourceActId, targetActId, sourceFollowups, targetFollowups) {
        Views.Evaluacion.importSharedActivityGrades(sourceActId, targetActId);
    };

    Views.Evaluacion.openFollowupTemplateModal = function(actId, customFollowupsList) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act) return;

        const fList = customFollowupsList || act.customFollowups;
        if (!fList || fList.length === 0) {
            UI.toast('No hay seguimientos para guardar como plantilla', 'warning');
            return;
        }

        Store.data.config = Store.data.config || {};
        const parciales = Store.getCourseParciales ? Store.getCourseParciales(act.cursoId) : (Store.get('parciales') || []).filter(p => p.cursoId === act.cursoId);
        let optionsHtml = '';
        parciales.sort((a, b) => a.numero - b.numero).forEach(p => {
            optionsHtml += `<option value="${p.id}" ${p.id === act.parcialId ? 'selected' : ''}>Parcial ${p.numero}</option>`;
        });

        const previewItems = fList.map((f, i) => `<span style="display:inline-block; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:3px 8px; font-size:11px; font-weight:700; color:#334155; margin:2px;">${f.nombre} (${f.puntaje} pts)</span>`).join('');

        const html = `
            <div style="padding:16px;">
                <div style="background:#eef2ff; border:1px solid #c7d2fe; border-radius:10px; padding:12px; margin-bottom:16px;">
                    <div style="font-weight:800; font-size:13px; color:#3730a3; margin-bottom:4px;">📌 Estructura a guardar como plantilla:</div>
                    <div style="display:flex; flex-wrap:wrap; gap:4px; max-height:100px; overflow-y:auto; margin-top:6px;">
                        ${previewItems}
                    </div>
                </div>

                <p style="margin-bottom:10px; font-size:13px; color:#475569;">Selecciona el parcial para el cual deseas establecer esta plantilla general:</p>
                <select id="modal-parcial-tpl" class="form-control" style="margin-bottom:14px; height:38px; border-radius:8px;">
                    ${optionsHtml}
                </select>

                <div style="margin-bottom:18px;">
                    <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:#334155; cursor:pointer;">
                        <input type="checkbox" id="modal-tpl-apply-existing" checked style="width:16px; height:16px;">
                        <span>Aplicar también esta estructura a las demás actividades similares en este parcial</span>
                    </label>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="Views.Evaluacion.executeSaveValoresTemplate('${act.id}')" style="background:#4338ca; border-color:#4338ca; font-weight:800;">
                        Guardar Plantilla Global
                    </button>
                </div>
            </div>
        `;
        UI.modal('Guardar Plantilla Global de Seguimientos', html);
    };

    Views.Evaluacion.saveValoresTemplate = function(actId) {
        Views.Evaluacion.openFollowupTemplateModal(actId);
    };

    Views.Evaluacion.executeSaveValoresTemplate = function(actId) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act || !act.customFollowups) return;
        
        const selParcialId = document.getElementById('modal-parcial-tpl').value;
        const applyToOthers = document.getElementById('modal-tpl-apply-existing')?.checked;
        const key = 'valoresTemplate_' + selParcialId;
        const keyGlobal = 'followupTemplate_' + selParcialId;
        
        const newTpl = act.customFollowups.map(f => ({ nombre: f.nombre, puntaje: f.puntaje }));
        Store.data.config[key] = newTpl;
        Store.data.config[keyGlobal] = newTpl;
        
        let actsActualizadas = 1;
        if (applyToOthers) {
            const actividades = Store.get('actividades') || [];
            actividades.forEach(a => {
                if (a.id === actId) return;
                const isMatching = (a.dimensionKey === act.dimensionKey) || (a.tipoEval === 'proyecto_acumulativo') || (a.nombre && a.nombre.toLowerCase().includes('valores'));
                if (isMatching && a.parcialId === selParcialId) {
                    const aMax = parseFloat(a.puntajeMax || 10);
                    const tplSum = newTpl.reduce((s, t) => s + (parseFloat(t.puntaje) || 0), 0) || 1;
                    const factor = aMax / tplSum;
                    a.customFollowups = newTpl.map((t, i) => {
                        const oldF = (a.customFollowups || []).find(of => of.id === 'f' + (i + 1));
                        return {
                            id: 'f' + (i + 1),
                            nombre: t.nombre,
                            puntaje: Math.round((t.puntaje * factor) * 10) / 10,
                            fecha: oldF ? oldF.fecha : '',
                            criterio: oldF ? oldF.criterio : ''
                        };
                    });
                    let cSum = a.customFollowups.reduce((s, f) => s + f.puntaje, 0);
                    let diff = aMax - cSum;
                    if (Math.abs(diff) > 0.01 && a.customFollowups.length > 0) {
                        a.customFollowups[a.customFollowups.length - 1].puntaje = Math.round((a.customFollowups[a.customFollowups.length - 1].puntaje + diff) * 10) / 10;
                    }
                    actsActualizadas++;
                }
            });
        }
        
        Store.save();
        UI.closeModal();
        UI.toast(`Plantilla global aplicada a ${actsActualizadas} actividades de Valores en el parcial seleccionado.`, 'success');
    };

    Views.Evaluacion.saveFollowupGrade = function(actId, studentId, followupId, val, actPuntajeMax) {
        const input = document.querySelector(`input.followup-input[data-student-id="${studentId}"][data-followup-id="${followupId}"]`);
        
        let maxLimit = parseFloat(input ? input.dataset.max : 0);
        if (!input || !maxLimit) {
            const act = (Store.get('actividades') || []).find(a => a.id === actId);
            if (act && act.customFollowups) {
                const f = act.customFollowups.find(x => x.id === followupId);
                if (f) maxLimit = parseFloat(f.puntaje || 0);
            }
        }
        
        let finalVal;
        if (val === '' || val === null || val === undefined) {
            finalVal = '';
        } else {
            const parsedVal = parseFloat(val);
            if (isNaN(parsedVal)) {
                finalVal = '';
            } else {
                finalVal = parsedVal;
                if (finalVal < 0) finalVal = 0;
                // Si la nota manual es mayor a la configurada, se ajusta al límite configurado
                if (finalVal > maxLimit && maxLimit > 0) {
                    finalVal = maxLimit;
                    if (window.UI && typeof UI.toast === 'function') {
                        UI.toast(`⚠️ La calificación no puede superar el valor configurado (${maxLimit} pts). Se ajustó a ${maxLimit}.`, 'warning');
                    }
                }
            }
        }
        
        if (input) {
            input.value = finalVal;
            input.style.borderColor = (finalVal !== '' && parseFloat(finalVal) >= maxLimit && maxLimit > 0) ? '#86efac' : '#cbd5e1';
        }

        // Sincronizar estado del botón de logrado
        const btn = document.querySelector(`button.followup-cell-btn[data-student-id="${studentId}"][data-followup-id="${followupId}"]`);
        if (btn) {
            const isFull = (finalVal !== '' && parseFloat(finalVal) >= maxLimit && maxLimit > 0);
            if (isFull) {
                btn.classList.add('active');
                btn.style.background = '#22c55e';
                btn.style.borderColor = '#16a34a';
                btn.style.color = '#ffffff';
                btn.title = `Logrado (puntaje completo: ${maxLimit} pts). Clic para desmarcar`;
            } else {
                btn.classList.remove('active');
                btn.style.background = '#f8fafc';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#94a3b8';
                btn.title = `Marcar como logrado (asigna ${maxLimit} pts)`;
            }
        }

        const califs = Store.get('calificaciones') || [];
        let calif = califs.find(c => c.actividadId === actId && c.estudianteId === studentId);
        
        if (!calif) {
            calif = {
                id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                cursoId: Store.data.activeCourseId,
                actividadId: actId,
                estudianteId: studentId,
                puntajeObtenido: 0,
                porcentajeObtenido: 0,
                nota: 0,
                followups: {}
            };
            califs.push(calif);
        }
        
        if (!calif.followups) calif.followups = {};
        
        calif.followups[followupId] = {
            nota: finalVal,
            fecha: new Date().toISOString().split('T')[0]
        };

        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        const esPFAcumulativo = act && act.tipoEval === 'pruebas_formativas_acumulativo';
        
        let total = 0;
        if (act && act.customFollowups) {
            if (esPFAcumulativo) {
                let sum = 0;
                let count = 0;
                act.customFollowups.forEach(f => {
                    if (f.activo !== false) {
                        const fg = calif.followups && calif.followups[f.id];
                        if (fg && fg.nota !== undefined && fg.nota !== '' && fg.nota !== null) {
                            sum += parseFloat(fg.nota);
                            count++;
                        }
                    }
                });
                if (count > 0) {
                    const promedio = sum / count;
                    total = (promedio / 68) * parseFloat(actPuntajeMax);
                    total = Math.round(total * 100) / 100;
                } else {
                    total = 0;
                }
            } else {
                let sum = 0;
                act.customFollowups.forEach(f => {
                    const grade = (calif.followups[f.id] && calif.followups[f.id].nota !== undefined) ? calif.followups[f.id].nota : 0;
                    sum += parseFloat(grade || 0);
                });
                total = Math.round(sum * 10) / 10;
            }
        }
        
        calif.nota = total;
        calif.puntajeObtenido = total;
        calif.porcentajeObtenido = (total / parseFloat(actPuntajeMax)) * 100;
        
        Views.Evaluacion.saveGrade(actId, studentId, total, parseFloat(actPuntajeMax));
        
        const totalCell = document.getElementById(`total-${studentId}`);
        if (totalCell) {
            totalCell.textContent = total;
        }

        const quickFill = document.getElementById(`quick-fill-${studentId}`);
        if (quickFill && act && act.customFollowups && !esPFAcumulativo) {
            let completedCount = 0;
            act.customFollowups.forEach(f => {
                const fg = calif.followups && calif.followups[f.id];
                if (fg && fg.nota !== undefined && fg.nota !== '' && parseFloat(fg.nota) > 0) completedCount++;
            });
            quickFill.value = completedCount > 0 ? completedCount : '';
        }
        
        Store.save();
    };

    Views.Evaluacion.toggleMonthActive = function(actId, followupId, active) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act) return;

        const followup = act.customFollowups.find(f => f.id === followupId);
        if (followup) {
            followup.activo = active;
        }

        const course = Store.getActiveCourse();
        if (!course) return;
        const students = Store.getStudentsByCourse(course.id) || [];
        const califs = Store.get('calificaciones') || [];
        const followups = act.customFollowups || [];

        students.forEach(function(student) {
            let calif = califs.find(c => c.actividadId === actId && c.estudianteId === student.id);
            if (!calif) return;

            let sum = 0;
            let count = 0;
            followups.forEach(function(f) {
                if (f.activo !== false) {
                    const fg = calif.followups && calif.followups[f.id];
                    if (fg && fg.nota !== undefined && fg.nota !== '' && fg.nota !== null) {
                        sum += parseFloat(fg.nota);
                        count++;
                    }
                }
            });

            let total = 0;
            if (count > 0) {
                const promedio = sum / count;
                total = (promedio / 68) * parseFloat(act.puntajeMax);
                total = Math.round(total * 100) / 100;
            }

            calif.nota = total;
            calif.puntajeObtenido = total;
            calif.porcentajeObtenido = Math.round((total / parseFloat(act.puntajeMax)) * 10000) / 100;
            Views.Evaluacion.saveGrade(actId, student.id, total, parseFloat(act.puntajeMax));
        });

        Store.save();
        
        Views.Evaluacion.gradeFollowupActivity(actId);
        UI.toast(active ? 'Mes incluido en el cálculo' : 'Mes excluido del cálculo', 'success');
    };

    Views.Evaluacion.openFollowupConfigModal = function(actId) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act) return;

        const followups = JSON.parse(JSON.stringify(act.customFollowups || []));

        // Extrae del DOM en vivo los valores actuales para que nunca se pierda nada
        function syncDOMToFollowups() {
            const listContainer = document.getElementById('followup-config-list');
            if (!listContainer) return;
            const rows = listContainer.querySelectorAll('[data-index]');
            rows.forEach(r => {
                const idx = parseInt(r.getAttribute('data-index'), 10);
                if (isNaN(idx) || !followups[idx]) return;
                const nameInp = r.querySelector('input[data-field="nombre"]');
                const ptsInp = r.querySelector('input[data-field="puntaje"]');
                const dateInp = r.querySelector('input[data-field="fecha"]');
                if (nameInp) {
                    const val = nameInp.value.trim();
                    followups[idx].nombre = val || `Seguimiento ${idx + 1}`;
                }
                if (ptsInp) {
                    followups[idx].puntaje = Math.round((parseFloat(ptsInp.value) || 0) * 10) / 10;
                }
                if (dateInp) {
                    followups[idx].fecha = dateInp.value;
                }
            });
        }

        function updateTotalPointsDisplay() {
            let totalPoints = followups.reduce((sum, f) => sum + (parseFloat(f.puntaje) || 0), 0);
            totalPoints = Math.round(totalPoints * 10) / 10;
            const totalDisplay = document.getElementById('followup-total-points-display');
            if (totalDisplay) {
                totalDisplay.innerHTML = `Suma actual: <strong style="color: ${Math.abs(totalPoints - parseFloat(act.puntajeMax)) < 0.01 ? '#00C853' : '#ef4444'}; font-size:14px;">${totalPoints} / ${act.puntajeMax} pts</strong>`;
            }
        }

        function renderConfigList() {
            const listContainer = document.getElementById('followup-config-list');
            if (!listContainer) return;

            updateTotalPointsDisplay();

            listContainer.innerHTML = followups.map((f, index) => `
<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px; margin-bottom:10px; display:grid; grid-template-columns: 2fr 1fr 1.5fr 1fr; gap:10px; align-items:center;" data-index="${index}">
    <div>
        <label style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase;">Nombre / Rótulo</label>
        <input type="text" 
               class="form-control" 
               data-field="nombre"
               value="${(f.nombre || '').replace(/"/g, '&quot;')}" 
               placeholder="Ej: Portada"
               oninput="Views.Evaluacion.onFollowupFieldInput(${index}, 'nombre', this.value)"
               style="height:36px; border-radius:8px; font-weight:700; font-size:13px; padding: 0 10px;">
    </div>
    <div>
        <label style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase;">Puntaje</label>
        <input type="number" 
               class="form-control" 
               data-field="puntaje"
               value="${f.puntaje}" 
               placeholder="0"
               min="0"
               max="${act.puntajeMax}"
               step="0.1"
               oninput="Views.Evaluacion.onFollowupFieldInput(${index}, 'puntaje', this.value)"
               style="height:36px; border-radius:8px; font-weight:700; text-align:center; font-size:13px; padding: 0 5px;">
    </div>
    <div>
        <label style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase;">Fecha (Opcional)</label>
        <input type="date" 
               class="form-control" 
               data-field="fecha"
               value="${f.fecha || ''}" 
               onchange="Views.Evaluacion.onFollowupFieldInput(${index}, 'fecha', this.value)"
               style="height:36px; border-radius:8px; font-size:12px; padding: 0 6px;">
    </div>
    <div style="display:flex; align-items:center; gap:8px; margin-top: 14px;">
        <button type="button" 
                class="btn btn-secondary" 
                title="Criterio de revisión"
                onclick="Views.Evaluacion.openFollowupDetailsLocal('${actId}', ${index})"
                style="height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex:1; padding:0;">
            <i data-lucide="info" style="width:16px;"></i>
        </button>
        <button type="button" 
                class="btn btn-secondary" 
                style="height:36px; border-radius:8px; background:#fee2e2; color:#ef4444; border:none; display:flex; align-items:center; justify-content:center; flex:1; padding:0;"
                onclick="Views.Evaluacion.deleteFollowupLocal('${actId}', ${index})">
            <i data-lucide="trash-2" style="width:16px;"></i>
        </button>
    </div>
</div>
            `).join('');

            const addBtn = document.getElementById('btn-add-followup');
            if (addBtn) {
                if (followups.length >= 20) {
                    addBtn.style.opacity = '0.5';
                } else {
                    addBtn.style.opacity = '1';
                }
            }

            if (window.lucide) window.lucide.createIcons();
        }

        // Actualización fluida sin destruir el DOM
        Views.Evaluacion.onFollowupFieldInput = function(idx, field, val) {
            if (!followups[idx]) return;
            if (field === 'puntaje') {
                followups[idx].puntaje = Math.round((parseFloat(val) || 0) * 10) / 10;
                updateTotalPointsDisplay();
            } else if (field === 'nombre') {
                followups[idx].nombre = val;
            } else {
                followups[idx][field] = val;
            }
        };

        Views.Evaluacion.deleteFollowupLocal = function(aId, idx) {
            syncDOMToFollowups();
            followups.splice(idx, 1);
            renderConfigList();
        };

        Views.Evaluacion.addFollowupLocal = function() {
            syncDOMToFollowups();
            if (followups.length >= 20) {
                UI.toast('Límite de 20 seguimientos alcanzado', 'warning');
                return;
            }
            followups.push({
                id: 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                nombre: `Seguimiento ${followups.length + 1}`,
                puntaje: 0,
                fecha: '',
                criterio: ''
            });
            renderConfigList();
        };

        Views.Evaluacion.recalculateEquitableLocal = function() {
            syncDOMToFollowups();
            const count = followups.length;
            if (count === 0) return;
            const maxPts = parseFloat(act.puntajeMax || 0);
            const defaultPoints = Math.round((maxPts / count) * 10) / 10;
            followups.forEach(f => {
                f.puntaje = defaultPoints;
            });
            let currentSum = followups.reduce((sum, f) => sum + f.puntaje, 0);
            let diff = maxPts - currentSum;
            if (Math.abs(diff) > 0.01) {
                followups[followups.length - 1].puntaje = Math.round((followups[followups.length - 1].puntaje + diff) * 10) / 10;
            }
            renderConfigList();
        };

        Views.Evaluacion.openFollowupDetailsLocal = function(aId, idx) {
            syncDOMToFollowups();
            const item = followups[idx];
            let prevDisplay = document.querySelector('.modal') ? document.querySelector('.modal').style.display : '';
            if (document.querySelector('.modal')) {
                document.querySelector('.modal').style.display = 'none';
            }

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay open';
            overlay.style.zIndex = '99999';

            overlay.innerHTML = `
<div class="modal" style="max-width:500px;">
    <div class="modal-header">
        <h3 style="margin:0; font-size:16px;">📝 Criterios: ${item.nombre}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); document.querySelector('.modal').style.display='${prevDisplay}'">×</button>
    </div>
    <div class="modal-body">
        <div class="form-group">
            <label class="form-label">Criterio de revisión / Observación guía</label>
            <textarea id="temp-crit-textarea" class="form-control" style="height:120px; border-radius:8px; padding: 10px;">${item.criterio || ''}</textarea>
        </div>
    </div>
    <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:10px;">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove(); document.querySelector('.modal').style.display='${prevDisplay}'">Cancelar</button>
        <button class="btn btn-primary" onclick="Views.Evaluacion.saveFollowupDetailsLocal(${idx}); this.closest('.modal-overlay').remove(); document.querySelector('.modal').style.display='${prevDisplay}'" style="background:#7c3aed; border-color:#7c3aed;">Aceptar</button>
    </div>
</div>
            `;
            document.body.appendChild(overlay);

            Views.Evaluacion.saveFollowupDetailsLocal = function(itemIdx) {
                const text = document.getElementById('temp-crit-textarea').value;
                followups[itemIdx].criterio = text;
            };
        };

        // ACCIÓN 1: Guardar configuración EXCLUSIVAMENTE para la actividad actual
        Views.Evaluacion.saveFollowupConfig = function() {
            syncDOMToFollowups();
            let totalPoints = followups.reduce((sum, f) => sum + (parseFloat(f.puntaje) || 0), 0);
            totalPoints = Math.round(totalPoints * 10) / 10;
            const maxPts = parseFloat(act.puntajeMax);

            if (totalPoints > maxPts) {
                UI.toast(`¡Error! La suma de los puntos (${totalPoints} pts) excede el puntaje máximo de la actividad (${maxPts} pts)`, 'error');
                return;
            }

            const persistConfig = () => {
                const cleanFollowups = JSON.parse(JSON.stringify(followups));
                
                // Actualizar en el Store global de actividades
                const actividades = Store.get('actividades') || [];
                const storeAct = actividades.find(a => a.id === actId);
                if (storeAct) {
                    storeAct.customFollowups = cleanFollowups;
                }
                act.customFollowups = cleanFollowups;
                
                let califs = Store.get('calificaciones') || [];
                califs.forEach(calif => {
                    if (calif.actividadId === actId) {
                        if (!calif.followups) calif.followups = {};
                        
                        let sum = 0;
                        cleanFollowups.forEach(f => {
                            let grade = (calif.followups[f.id] && calif.followups[f.id].nota !== undefined) ? calif.followups[f.id].nota : 0;
                            if (grade > f.puntaje) {
                                grade = f.puntaje;
                                calif.followups[f.id].nota = grade;
                            }
                            sum += grade;
                        });
                        
                        sum = Math.round(sum * 10) / 10;
                        calif.nota = sum;
                        calif.puntajeObtenido = sum;
                        calif.porcentajeObtenido = (sum / maxPts) * 100;
                        
                        Views.Evaluacion.saveGrade(actId, calif.estudianteId, sum, maxPts);
                    }
                });

                Store.save();
                UI.closeModal();
                UI.toast('Configuración guardada para esta actividad ✓', 'success');
                // Re-renderizar planilla con los nombres actualizados
                Views.Evaluacion.gradeFollowupActivity(actId);
            };

            if (totalPoints < maxPts) {
                UI.confirm(`La suma de los seguimientos (${totalPoints} pts) es menor al total de la actividad (${maxPts} pts). ¿Deseas guardar de todas formas?`, () => {
                    persistConfig();
                });
            } else {
                persistConfig();
            }
        };

        // ACCIÓN 2: Guardar como Plantilla General/Global opcionalmente
        Views.Evaluacion.saveFollowupAsGlobalTemplate = function() {
            syncDOMToFollowups();
            const cleanFollowups = JSON.parse(JSON.stringify(followups));
            
            // Primero aseguramos que la actividad actual tenga estos datos
            const actividades = Store.get('actividades') || [];
            const storeAct = actividades.find(a => a.id === actId);
            if (storeAct) {
                storeAct.customFollowups = cleanFollowups;
            }
            act.customFollowups = cleanFollowups;
            Store.save();

            // Abrir selector de parcial para guardar la plantilla
            Views.Evaluacion.openFollowupTemplateModal(actId, cleanFollowups);
        };

        UI.modal(`📈 Configurar Seguimientos: ${act.nombre}`, `
<div style="height: 480px; display:flex; flex-direction:column; overflow:hidden;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-shrink:0;">
        <span id="followup-total-points-display" style="font-size:12px; color:#475569;">Suma actual: <strong>0 / ${act.puntajeMax} pts</strong></span>
        <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-secondary" onclick="Views.Evaluacion.recalculateEquitableLocal()" style="height:32px; font-size:11px; border-radius:8px; display:flex; align-items:center; gap:4px; padding: 0 10px;">
                <i data-lucide="divide" style="width:14px;"></i> Distribución Equitativa
            </button>
            <button type="button" id="btn-add-followup" class="btn btn-secondary" onclick="Views.Evaluacion.addFollowupLocal()" style="height:32px; font-size:11px; border-radius:8px; display:flex; align-items:center; gap:4px; background:#f0fdf4; color:#16a34a; border-color:#bbf7d0; padding: 0 10px;">
                <i data-lucide="plus" style="width:14px;"></i> Agregar Seguimiento
            </button>
        </div>
    </div>
    
    <div id="followup-config-list" style="flex:1; overflow-y:auto; padding-right:4px;">
        <!-- Config rows loaded dynamically -->
    </div>
    
    <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px; padding-top:10px; border-top:1.5px dashed #e2e8f0; flex-shrink:0; height: 50px;">
        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()" style="height:36px; border-radius:8px;">Cancelar</button>
        <button type="button" class="btn btn-secondary" onclick="Views.Evaluacion.saveFollowupAsGlobalTemplate()" title="Guardar estos nombres y ponderaciones como plantilla general reutilizable" style="height:36px; border-radius:8px; display:flex; align-items:center; gap:6px; font-weight:700; color:#4338ca; background:#eef2ff; border-color:#c7d2fe;">
            <i data-lucide="bookmark" style="width:16px;"></i> Guardar Plantilla Global
        </button>
        <button type="button" class="btn btn-primary" onclick="Views.Evaluacion.saveFollowupConfig()" style="height:36px; border-radius:8px; background:#7c3aed; border-color:#7c3aed; font-weight:800; display:flex; align-items:center; gap:6px;">
            <i data-lucide="save" style="width:16px;"></i> Guardar Configuración
        </button>
    </div>
</div>
        `, '');

        setTimeout(() => {
            let initialSum = followups.reduce((sum, f) => sum + (parseFloat(f.puntaje) || 0), 0);
            if (followups.length > 0 && Math.abs(initialSum - parseFloat(act.puntajeMax)) > 0.01) {
                Views.Evaluacion.recalculateEquitableLocal();
            } else {
                renderConfigList();
            }
        }, 100);
    };

    // Función interna para renderizar el modal
    function renderSmartModal(dimKey, parcialId, actToEdit = null) {
        const c = Store.getActiveCourse();
        const subjConfig = BancoCurricularInteligente.getSubjectConfig(c);
        const parciales = c ? Store.getParcialByCourse(c.id) : [];
        const dims = (Store.data.configAcademica && Store.data.configAcademica.dimensions) || [];
        const rubricas = (Store.get('rubricas') || []).filter(r => r.estado !== 'archivada');

        const isEdit = !!actToEdit;
        const title = isEdit ? 'Editar Actividad' : 'Nueva Actividad';
        
        // Datos por defecto
        let n = isEdit ? actToEdit.nombre : '';
        let pm = isEdit ? actToEdit.puntajeMax : (dimKey === 'actitudes' ? (dims.find(d => d.key === 'actitudes')?.porcentaje || 10) : '');
        let f = isEdit ? actToEdit.fecha : new Date().toISOString().split('T')[0];
        let dKey = isEdit ? actToEdit.dimensionKey : dimKey;
        let pId = isEdit ? actToEdit.parcialId : (parcialId || '');
        let tEval = isEdit ? actToEdit.tipoEval : 'directa';
        let rId = isEdit ? (actToEdit.rubricaId || '') : '';

        let tipoAct = isEdit ? (actToEdit.tipo || '') : '';
        if (isEdit && !tipoAct && actToEdit.nombre) {
            const banco = (Views.Evaluacion && Views.Evaluacion.getBancoDinamico) ? Views.Evaluacion.getBancoDinamico() : subjConfig.sugerencias;
            const match = banco.find(b => (b.nombre || '').trim().toLowerCase() === actToEdit.nombre.trim().toLowerCase());
            if (match) {
                tipoAct = match.tipo;
            }
        }

        const tiposDisponibles = subjConfig.tipos || TiposActividad;

        // UI Builder
        UI.modal(title, `
            <form id="smart-act-form" onsubmit="event.preventDefault(); Views.Evaluacion.saveSmartActivity('${isEdit ? actToEdit.id : ''}', this)">
                
                <!-- BOTONES SUPERIORES -->
                <div style="margin-bottom:12px; padding-bottom:10px; border-bottom:1.5px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        ${isEdit
                            ? `<button type="button" class="btn btn-secondary" onclick="UI.closeModal(); Views.Evaluacion.deleteActivity('${actToEdit.id}', '${dKey}');" style="background:#fee2e2; border:1.5px solid #ef4444; color:#991b1b; font-size:12px; font-weight:700; border-radius:10px; height:36px; padding:0 13px; display:inline-flex; align-items:center; gap:6px; cursor:pointer;" title="Eliminar esta actividad y sus notas"><i data-lucide="trash-2" style="width:14px;"></i> Eliminar</button>`
                            : `<button type="button" class="btn btn-secondary" onclick="Views.Evaluacion.resetForm()" style="background:#ffffff; border:1.5px solid #64748b; color:#0f172a; font-size:12px; font-weight:700; border-radius:10px; height:36px; padding:0 13px; display:inline-flex; align-items:center; gap:6px; cursor:pointer;" title="Limpiar todos los campos"><i data-lucide="rotate-ccw" style="width:14px;"></i> Limpiar</button>`}
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()" style="background:#ffffff; border:1.5px solid #64748b; color:#0f172a; border-radius:10px; height:36px; padding:0 16px; font-weight:700; font-size:12.5px; cursor:pointer;">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="Views.Evaluacion.saveSmartActivity('${isEdit ? actToEdit.id : ''}')" style="background:#047857; border:1.5px solid #065f46; color:#ffffff; border-radius:10px; height:36px; padding:0 16px; font-weight:800; font-size:12.5px; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(4,120,87,0.22); cursor:pointer;">
                             <i data-lucide="save" style="width:16px;"></i> ${isEdit ? 'Actualizar' : 'Crear'} Actividad
                        </button>
                    </div>
                </div>

                <!-- SECCIÓN 1: INTELIGENCIA SEGÚN ESPACIO CURRICULAR -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="background: #00C853; border-radius: 8px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,200,83,0.28);">
                                <i data-lucide="brain-circuit" style="width: 16px; color: #fff;"></i>
                            </div>
                            <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
                                <span style="font-size: 12.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">Inteligencia Aula 360</span>
                                <span style="font-size: 11px; color: #64748b;">Currículo Nacional Básico Adaptativo</span>
                            </div>
                        </div>
                        <span style="background: rgba(0, 200, 83, 0.12); color: #007E33; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 8px; border: 1px solid rgba(0, 200, 83, 0.25); display: inline-flex; align-items: center; gap: 5px;">
                            <i data-lucide="${subjConfig.icon || 'sparkles'}" style="width: 13px; height: 13px;"></i> ${subjConfig.badge || subjConfig.label}
                        </span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px;">
                        <div class="form-group" style="margin: 0;">
                            <label class="form-label" style="font-size: 10.5px; color: #64748b; font-weight: 700; margin-bottom:4px;">TIPO DE ACTIVIDAD (${subjConfig.badge || 'ÁREA'})</label>
                            <select id="sel-tipo-act" class="form-control" onchange="Views.Evaluacion.onTipoChanged(this.value)" style="height: 38px; border-radius: 9px; font-weight: 600; font-size:13px;">
                                <option value="">Selecciona tipo...</option>
                                ${tiposDisponibles.map(t => `<option value="${t}" ${tipoAct === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin: 0;">
                            <label class="form-label" style="font-size: 10.5px; color: #64748b; font-weight: 700; margin-bottom:4px;">SUGERENCIA INTELIGENTE</label>
                            <select id="sel-sug-act" class="form-control" ${!tipoAct ? 'disabled' : ''} onchange="Views.Evaluacion.onSugChanged(this.value)" style="height: 38px; border-radius: 9px; font-weight: 600; font-size:13px;">
                                <option value="">${tipoAct ? 'Elige una actividad...' : 'Primero elige un tipo...'}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 2: DATOS -->
                <div style="display:grid; gap:10px;">
                    <div style="display:flex; flex-wrap:wrap; gap:10px;">
                        <div class="form-group" style="margin:0; flex:2 1 240px; min-width:0;">
                            <label class="form-label" style="font-size:11.5px; margin-bottom:4px;">Nombre de la actividad</label>
                            <input id="inp-nombre" name="nombre" class="form-control" required value="${n}" placeholder="Ej: Redacción de texto" style="height:38px; font-size:13px;">
                        </div>
                        <div class="form-group" style="margin:0; flex:1 1 130px; min-width:0;">
                            <label class="form-label" style="font-size:11.5px; margin-bottom:4px;">Puntaje Máximo</label>
                            <input id="inp-max" type="number" name="puntajeMax" class="form-control" required max="100" min="1" value="${pm}" style="height:38px; font-size:13px;">
                        </div>
                    </div>

                    <input type="hidden" id="inp-dim" name="dimensionKey" value="${dKey}">

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(175px, 1fr)); gap:10px;">
                        <!-- SELECTOR DE FECHA ESTÉTICO Y MODERNO AULA 360 -->
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; margin-bottom:4px;">
                                <span>Fecha</span>
                                <span style="font-size:10.5px; color:#00C853; font-weight:700;"><i data-lucide="calendar" style="width:11px; height:11px; display:inline;"></i> Calendario</span>
                            </label>
                            <div class="a360-date-trigger-box" onclick="UI.openDatePicker(document.getElementById('inp-fecha-act'))" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; height:38px; padding:0 10px; background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:9px; transition:all 0.2s ease;">
                                <div style="display:flex; align-items:center; gap:6px; overflow:hidden;">
                                    <i data-lucide="calendar-days" style="width:15px; height:15px; color:#00C853; flex-shrink:0;"></i>
                                    <span id="lbl-fecha-act" style="font-size:12px; font-weight:700; color:#1e293b; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${UI.formatDateEs(f)}</span>
                                </div>
                                <input type="hidden" id="inp-fecha-act" name="fecha" value="${f}">
                                <i data-lucide="chevron-down" style="width:13px; height:13px; color:#94a3b8; flex-shrink:0;"></i>
                            </div>
                        </div>

                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:11.5px; margin-bottom:4px;">Parcial</label>
                            <select id="inp-parcial" name="parcialId" class="form-control" required style="height:38px; font-size:13px;">
                                <option value="">Seleccionar...</option>
                                ${parciales.map(p => `<option value="${p.id}" ${pId===p.id ? 'selected' : ''}>${p.nombre}</option>`).join('')}
                                <option value="recuperacion" ${pId==='recuperacion' ? 'selected' : ''}>Recuperación</option>
                            </select>
                        </div>

                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:11.5px; margin-bottom:4px;">Tipo de evaluación</label>
                            <select id="inp-tipo-eval" name="tipoEval" class="form-control" onchange="Views.Evaluacion.toggleRubricaField()" style="height:38px; font-size:13px;">
                                <option value="directa" ${tEval==='directa'?'selected':''}>Calificación Directa</option>
                                <option value="proyecto_acumulativo" ${tEval==='proyecto_acumulativo'?'selected':''}>Proyecto Acumulativo</option>
                                ${(function(){
                                    const _c = Store.getActiveCourse();
                                    const _materia = (_c && (_c.materia||_c.nombre||_c.asignatura||''));
                                    const _isEsp = /espa[nñ]ol/i.test(_materia);
                                    const _isExam = /examen/i.test(dKey||'');
                                    return (_isEsp && _isExam) ? `<option value="pruebas_formativas_acumulativo" ${tEval==='pruebas_formativas_acumulativo'?'selected':''}>Pruebas Formativas (Acumulativo)</option>` : '';
                                })()}
                                <option value="rubrica" ${tEval==='rubrica'?'selected':''}>Con Rúbrica</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 3: RÚBRICA (Condicional) -->
                <div id="sec-rubrica" style="margin-top:12px; padding:16px; background:#f5f3ff; border:1px solid #ddd6fe; border-radius:12px; display:${tEval==='rubrica'?'block':'none'};">
                    <div id="container-rubrica-global" style="display:${(isEdit ? actToEdit.tipo : (document.getElementById('sel-tipo-act')?.value)) === 'Proyecto' ? 'none' : 'block'};">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="color:#6d28d9; display:flex; justify-content:space-between; align-items:center;">
                                <span>Rúbrica de Evaluación</span>
                                <span style="font-size:11px; font-weight:700; color:#7c3aed;">
                                    <i data-lucide="sparkles" style="width:12px; height:12px; display:inline;"></i> Asistente por Campo del Conocimiento
                                </span>
                            </label>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <select id="inp-rubrica" name="rubricaId" class="form-control" style="flex:1; min-width:200px;">
                                    <!-- Las opciones se inyectan y actualizan dinámicamente con getRubricasOpcionesHtml -->
                                </select>
                                <button type="button" class="btn btn-secondary" onclick="Views.Evaluacion.previewRubricaBtn()" title="Ver Rúbrica" style="padding:0 12px;">
                                    <i data-lucide="eye" style="width:16px;"></i>
                                </button>
                                <button type="button" class="btn btn-primary" onclick="Views.Evaluacion.activarAsistenteRubrica()" style="padding:0 14px; background:#7c3aed; border-color:#7c3aed; white-space:nowrap;">
                                    ✨ Crear con Asistente
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="container-rubrica-proyecto" style="display:${(isEdit ? actToEdit.tipo : (document.getElementById('sel-tipo-act')?.value)) === 'Proyecto' ? 'block' : 'none'};">
                        <div class="form-group" style="margin-bottom:12px;">
                            <label class="form-label" style="color:#6d28d9;">Plantilla de Rúbrica para Proyecto</label>
                            <select id="inp-rubrica-plantilla" class="form-control" onchange="Views.Evaluacion.onPlantillaProyectoChange(this.value)">
                                <option value="">Seleccione una plantilla...</option>
                                ${window.BancoRubricasProyectos.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="rubrica-proyecto-editor" style="display:none; margin-top:10px; background:#fff; padding:12px; border-radius:8px; border:1px solid #ddd6fe;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
                            <strong style="color:#5b21b6;">Criterios de Evaluación</strong>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span id="rubrica-proyecto-suma" style="font-size:12px; font-weight:bold;">Suma: 0 / 0</span>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="Views.Evaluacion.reajustarPesosRubrica()" title="Recalcular pesos proporcionalmente al puntaje máximo">⚖️ Ajustar pesos</button>
                                <button type="button" id="btn-volver-banco-rubrica" class="btn btn-secondary btn-sm" onclick="Views.Evaluacion.cancelarAsistenteRubrica()" style="display:none;">← Usar banco</button>
                            </div>
                        </div>
                        <div id="rubrica-proyecto-criterios" style="max-height:250px; overflow-y:auto; margin-bottom:8px;">
                            <!-- Criterios inyectados dinámicamente -->
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="Views.Evaluacion.addCriterioProyecto()">+ Añadir Criterio</button>
                            <label style="font-size:12px; color:#475569; display:flex; align-items:center; gap:6px; margin:0; cursor:pointer;">
                                <input type="checkbox" id="chk-guardar-rubrica-banco">
                                Guardar también en mi banco personal
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        `);
        setTimeout(() => { 
            if (window.lucide) window.lucide.createIcons();
            const inpMaxEl = document.getElementById('inp-max');
            if (inpMaxEl) {
                inpMaxEl.addEventListener('input', () => {
                    const val = parseFloat(inpMaxEl.value) || 0;
                    const total = currentUsed + val;
                    const box = document.getElementById('dim-limit-box');
                    const sumVal = document.getElementById('dim-sum-val');
                    const excesoMsg = document.getElementById('dim-exceso-msg');
                    const excesoPts = document.getElementById('dim-exceso-pts');
                    const dispTxt = document.getElementById('dim-disp-txt');
                    
                    if (sumVal) sumVal.innerText = total + ' pts';
                    if (total > dimMaxAllowed) {
                        const diff = Math.round((total - dimMaxAllowed) * 10) / 10;
                        if (box) {
                            box.style.background = '#fef2f2';
                            box.style.borderColor = '#fecaca';
                            box.style.color = '#b91c1c';
                        }
                        inpMaxEl.style.borderColor = '#dc2626';
                        inpMaxEl.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.15)';
                        if (dispTxt) dispTxt.innerHTML = '<span style="color:#dc2626;">Exceso: +' + diff + ' pts</span>';
                        if (excesoMsg) {
                            excesoMsg.style.display = 'block';
                            if (excesoPts) excesoPts.innerText = diff;
                        }
                    } else {
                        if (box) {
                            box.style.background = '#f0fdf4';
                            box.style.borderColor = '#bbf7d0';
                            box.style.color = '#166534';
                        }
                        inpMaxEl.style.borderColor = '';
                        inpMaxEl.style.boxShadow = '';
                        if (dispTxt) dispTxt.innerText = 'Disponible: ' + Math.round((dimMaxAllowed - total) * 10) / 10 + ' pts';
                        if (excesoMsg) excesoMsg.style.display = 'none';
                    }
                });
            }
            if (tipoAct) {
                Views.Evaluacion.onTipoChanged(tipoAct);
                const banco = (Views.Evaluacion && Views.Evaluacion.getBancoDinamico) ? Views.Evaluacion.getBancoDinamico() : subjConfig.sugerencias;
                const match = banco.find(b => b.tipo === tipoAct && (b.nombre || '').trim().toLowerCase() === (actToEdit?.nombre || '').trim().toLowerCase());
                const selSug = document.getElementById('sel-sug-act');
                if (selSug && match) {
                    selSug.value = match.id;
                }
            }

            // Poblar las opciones de rúbrica contextualizadas desde el inicio
            const selRub = document.getElementById('inp-rubrica');
            if (selRub) {
                selRub.innerHTML = Views.Evaluacion.getRubricasOpcionesHtml(rId, tipoAct, n);
            }
        }, 100);
        
        // Al abrir para editar una actividad con rúbrica integrada (Proyecto o Asistente)
        if (actToEdit && actToEdit.tipoEval === 'rubrica' && actToEdit.rubricaPersonalizada) {
            Views.Evaluacion.currentProyectoRubrica = JSON.parse(JSON.stringify(actToEdit.rubricaPersonalizada));
            setTimeout(() => {
                Views.Evaluacion.toggleRubricaField();
                Views.Evaluacion.renderRubricaProyectoEditor();
            }, 200);
        } else {
            Views.Evaluacion.currentProyectoRubrica = null;
        }
    }

    // Banco dinámico (combina el banco del espacio curricular con los aprendidos del usuario)
    Views.Evaluacion.getBancoDinamico = function() {
        const c = Store.getActiveCourse();
        const subjConfig = BancoCurricularInteligente.getSubjectConfig(c);
        const base = (subjConfig && subjConfig.sugerencias) ? subjConfig.sugerencias : BancoActividadesInteligente;
        
        const guardados = [];
        try {
            const extra = localStorage.getItem('aula360_banco_personalizado');
            if (extra) guardados.push(...JSON.parse(extra));
        } catch (e) {}
        return [...base, ...guardados];
    };

    Views.Evaluacion.aprenderActividad = function(data) {
        if (!data.tipoEval || !data.nombre) return;
        
        const elTipo = document.getElementById('sel-tipo-act');
        let tipoAsignado = elTipo ? elTipo.value : 'General';
        if (!tipoAsignado) tipoAsignado = 'General';

        const banco = this.getBancoDinamico();
        // Si el nombre ya existe en el sugerido (case insensitive), no lo duplicamos
        const existe = banco.some(a => (a.nombre || "").trim().toLowerCase() === (data.nombre || "").trim().toLowerCase());
        
        if (!existe) {
            const nueva = {
                id: 'usr_' + Date.now(),
                tipo: tipoAsignado,
                nombre: data.nombre.trim(),
                dimension: data.dimensionKey || 'aula',
                puntajeMax: data.puntajeMax || 10,
                tipoEval: data.tipoEval
            };
            
            let extra = [];
            try {
                const stored = localStorage.getItem('aula360_banco_personalizado');
                if (stored) extra = JSON.parse(stored);
            } catch(e) {}
            
            extra.push(nueva);
            localStorage.setItem('aula360_banco_personalizado', JSON.stringify(extra));
        }
    };

    // Generador de opciones de rúbrica con categorización inteligente por materia y tipo
    Views.Evaluacion.getRubricasOpcionesHtml = function(selectedRubricaId = '', tipoActividad = '', nombreActividad = '') {
        const c = Store.getActiveCourse();
        const detectedSubjKey = BancoCurricularInteligente.detectSubject(c);
        const subjConfig = BancoCurricularInteligente.getSubjectConfig(c);
        let allRubricas = (Store.get('rubricas') || []).filter(r => r.estado !== 'archivada');
        if (allRubricas.length === 0 && window.BancoRubricasOficial && window.BancoRubricasOficial.length > 0) {
            allRubricas = window.BancoRubricasOficial.map(r => ({
                id: r.id,
                nombre: r.nombre,
                categoria: r.categoria,
                asignatura: r.asignatura,
                puntajeTotal: r.puntajeTotal
            }));
        }

        if (allRubricas.length === 0) {
            return `<option value="">No hay rúbricas en el banco</option>`;
        }

        // Mapeo amigable de asignatura detectada a nombres comunes de asignatura
        const subjMatchRegex = {
            ciencias_sociales: /social|historia|geograf|c[ií]vic|ciudadan/i,
            ciencias_naturales: /natural|ciencias nat|f[ií]sic|qu[ií]mic|biolog/i,
            matematicas: /matem|geometr|[aá]lgebra|c[aá]lcul/i,
            espanol: /espa[nñ]ol|lengua|literatura|lectura|redacc/i,
            ingles: /ingl[eé]s|english|foreign/i,
            tecnologia: /tecnolog|computac|inform[aá]t/i,
            artistica: /art[ií]stic|m[uú]sic|pl[aá]stic/i,
            educacion_fisica: /f[ií]sic|deport/i,
            valores: /valor|actitud|orientac/i
        }[detectedSubjKey] || null;

        const normalizar = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normTipo = normalizar(tipoActividad);
        const normNom = normalizar(nombreActividad);

        // Clasificar rúbricas
        const recomendadas = [];
        const deMateria = [];
        const otrasOpciones = [];

        allRubricas.forEach(r => {
            const rAsig = r.asignatura || 'General';
            const rCat = r.categoria || '';
            const rNom = r.nombre || '';
            const normRCat = normalizar(rCat);
            const normRNom = normalizar(rNom);

            // ¿Pertenece a la materia actual?
            const esMateria = (subjMatchRegex && subjMatchRegex.test(rAsig)) || 
                              (subjConfig && subjConfig.badge && normalizar(subjConfig.badge).includes(normalizar(rAsig)));

            // ¿Coincide específicamente con el tipo de actividad o nombre de la actividad?
            let esMatchActividad = false;
            if (normTipo && (normRCat.includes(normTipo) || normTipo.includes(normRCat) || normRNom.includes(normTipo))) {
                esMatchActividad = true;
            }
            if (normNom && (normRNom.includes(normNom) || normNom.includes(normRNom))) {
                esMatchActividad = true;
            }

            if (esMatchActividad) {
                recomendadas.push(r);
            } else if (esMateria) {
                deMateria.push(r);
            } else {
                otrasOpciones.push(r);
            }
        });

        let html = `<option value="">Seleccione una rúbrica de su banco...</option>`;

        if (recomendadas.length > 0) {
            html += `<optgroup label="⭐ Recomendadas para esta actividad (${recomendadas.length})">`;
            recomendadas.forEach(r => {
                const sel = (String(r.id) === String(selectedRubricaId)) ? 'selected' : '';
                html += `<option value="${r.id}" ${sel}>⭐ ${r.nombre} (${r.asignatura || 'General'})</option>`;
            });
            html += `</optgroup>`;
        }

        if (deMateria.length > 0) {
            html += `<optgroup label="📚 ${subjConfig.badge || 'Materia Actual'} (${deMateria.length})">`;
            deMateria.forEach(r => {
                const sel = (String(r.id) === String(selectedRubricaId)) ? 'selected' : '';
                html += `<option value="${r.id}" ${sel}>${r.nombre}</option>`;
            });
            html += `</optgroup>`;
        }

        if (otrasOpciones.length > 0) {
            html += `<optgroup label="🌐 Otras Asignaturas y Generales (${otrasOpciones.length})">`;
            otrasOpciones.forEach(r => {
                const sel = (String(r.id) === String(selectedRubricaId)) ? 'selected' : '';
                html += `<option value="${r.id}" ${sel}>${r.nombre} (${r.asignatura || 'General'})</option>`;
            });
            html += `</optgroup>`;
        }

        return html;
    };

    // Funciones dinámicas del modal
    Views.Evaluacion.onTipoChanged = function(tipo) {
        EvalSmartSettings.selectedTipoActividad = tipo;
        const banco = this.getBancoDinamico();
        const sugerencias = banco.filter(a => a.tipo === tipo);
        const selSug = document.getElementById('sel-sug-act');
        
        if (selSug) {
            if (sugerencias.length > 0) {
                selSug.disabled = false;
                selSug.innerHTML = `<option value="">Elige una actividad (${sugerencias.length} disponibles)...</option>` + 
                                   sugerencias.map(a => `<option value="${a.id}">${a.nombre} (${a.puntajeMax} pts)</option>`).join('');
            } else {
                selSug.disabled = true;
                selSug.innerHTML = `<option value="">Sin sugerencias predeterminadas</option>`;
            }
        }

        // Actualizar selector de rúbricas priorizando el tipo seleccionado
        const selRub = document.getElementById('inp-rubrica');
        if (selRub) {
            const currentVal = selRub.value;
            const inpNom = document.getElementById('inp-nombre');
            selRub.innerHTML = this.getRubricasOpcionesHtml(currentVal, tipo, inpNom ? inpNom.value : '');
        }
    };

    Views.Evaluacion.onSugChanged = function(actId) {
        if (!actId) return;
        const banco = this.getBancoDinamico();
        const act = banco.find(a => a.id === actId);
        if (!act) return;

        EvalSmartSettings.currentSuggestionId = actId;

        // Autocompletar
        const inpNom = document.getElementById('inp-nombre');
        if (inpNom) inpNom.value = act.nombre;
        
        const inpMax = document.getElementById('inp-max');
        if (inpMax) {
            inpMax.value = act.puntajeMax;
            inpMax.dispatchEvent(new Event('input'));
        }
        
        // Tipo de eval
        const evalSelect = document.getElementById('inp-tipo-eval');
        if (evalSelect && act.tipoEval) {
            evalSelect.value = act.tipoEval;
        }
        
        // Actualizar opciones de rúbrica alineadas a la sugerencia y auto-seleccionar si es adecuada
        const selRub = document.getElementById('inp-rubrica');
        if (selRub) {
            const rubricas = Store.get('rubricas') || [];
            let sugeridaId = '';
            
            // Buscar rúbrica más afín por nombre o categoría
            const matchExacto = rubricas.find(r => r.nombre.toLowerCase().includes(act.nombre.toLowerCase()) || 
                                                  (act.nombre && r.nombre && act.nombre.toLowerCase().includes(r.nombre.toLowerCase())));
            if (matchExacto) {
                sugeridaId = matchExacto.id;
            } else {
                const matchCat = rubricas.find(r => r.categoria && act.tipo && (r.categoria.toLowerCase().includes(act.tipo.toLowerCase()) || act.tipo.toLowerCase().includes(r.categoria.toLowerCase())));
                if (matchCat) sugeridaId = matchCat.id;
            }

            selRub.innerHTML = this.getRubricasOpcionesHtml(sugeridaId, act.tipo, act.nombre);
            if (sugeridaId) {
                selRub.value = sugeridaId;
            }
        }

        this.toggleRubricaField();
    };

    
    Views.Evaluacion.currentProyectoRubrica = null;

    Views.Evaluacion.onPlantillaProyectoChange = function(tplId) {
        if (!tplId) {
            document.getElementById('rubrica-proyecto-editor').style.display = 'none';
            Views.Evaluacion.currentProyectoRubrica = null;
            return;
        }
        const maxPts = parseFloat(document.getElementById('inp-max').value) || 10;
        Views.Evaluacion.currentProyectoRubrica = window.generarRubricaDesdePlantilla(tplId, maxPts);
        Views.Evaluacion.renderRubricaProyectoEditor();
    };

    Views.Evaluacion.renderRubricaProyectoEditor = function() {
        const editor = document.getElementById('rubrica-proyecto-editor');
        const list = document.getElementById('rubrica-proyecto-criterios');
        const sumaLabel = document.getElementById('rubrica-proyecto-suma');
        const maxPts = parseFloat(document.getElementById('inp-max').value) || 10;
        
        if (!Views.Evaluacion.currentProyectoRubrica) {
            editor.style.display = 'none';
            return;
        }
        
        editor.style.display = 'block';
        let html = '';
        let suma = 0;
        Views.Evaluacion.currentProyectoRubrica.criterios.forEach((c, idx) => {
            suma += parseFloat(c.peso) || 0;
            html += `
            <div style="border:1px solid #e2e8f0; padding:8px; border-radius:6px; margin-bottom:8px; background:#f8fafc;">
                <div style="display:flex; gap:8px; margin-bottom:8px;">
                    <input type="text" class="form-control" style="flex:1" value="${c.nombre}" onchange="Views.Evaluacion.updateCriterioProyecto(${idx}, 'nombre', this.value)" placeholder="Nombre del criterio">
                    <input type="number" class="form-control" style="width:80px" value="${c.peso}" step="0.1" onchange="Views.Evaluacion.updateCriterioProyecto(${idx}, 'peso', this.value)" placeholder="Pts">
                    <button type="button" class="btn btn-secondary" style="padding:0 8px; color:red;" onclick="Views.Evaluacion.deleteCriterioProyecto(${idx})">X</button>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:4px;">
                    ${c.niveles.map((n, ni) => `
                        <div style="font-size:10px;">
                            <strong>${n.nombre}</strong> (${n.valor}pts)
                            <textarea class="form-control" style="height:40px; font-size:10px; padding:4px;" onchange="Views.Evaluacion.updateCriterioNivelProyecto(${idx}, '${n.id}', this.value)">${n.descriptor || ''}</textarea>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        });
        
        list.innerHTML = html;
        sumaLabel.innerText = `Suma: ${Math.round(suma*10)/10} / ${maxPts}`;
        sumaLabel.style.color = (Math.round(suma*10)/10 === maxPts) ? 'green' : 'red';
    };

    Views.Evaluacion.updateCriterioProyecto = function(idx, field, val) {
        if (field === 'peso') {
            const peso = parseFloat(val) || 0;
            Views.Evaluacion.currentProyectoRubrica.criterios[idx].peso = peso;
            // recalcular niveles
            const n = Views.Evaluacion.currentProyectoRubrica.criterios[idx].niveles;
            n.find(x => x.id === 'lvl_inicial').valor = 0;
            n.find(x => x.id === 'lvl_basico').valor = Math.round(peso * 0.5 * 10)/10;
            n.find(x => x.id === 'lvl_avanzado').valor = Math.round(peso * 0.75 * 10)/10;
            n.find(x => x.id === 'lvl_excelente').valor = peso;
        } else {
            Views.Evaluacion.currentProyectoRubrica.criterios[idx][field] = val;
        }
        Views.Evaluacion.renderRubricaProyectoEditor();
    };

    Views.Evaluacion.updateCriterioNivelProyecto = function(idx, nivelId, desc) {
        const nivel = Views.Evaluacion.currentProyectoRubrica.criterios[idx].niveles.find(n => n.id === nivelId);
        if (nivel) nivel.descriptor = desc;
        Views.Evaluacion.currentProyectoRubrica.criterios[idx].descripciones[nivelId] = desc;
    };

    Views.Evaluacion.deleteCriterioProyecto = function(idx) {
        Views.Evaluacion.currentProyectoRubrica.criterios.splice(idx, 1);
        Views.Evaluacion.renderRubricaProyectoEditor();
    };

    Views.Evaluacion.addCriterioProyecto = function() {
        const maxPts = parseFloat(document.getElementById('inp-max').value) || 10;
        let suma = Views.Evaluacion.currentProyectoRubrica.criterios.reduce((s, c) => s + parseFloat(c.peso||0), 0);
        let rem = maxPts - suma;
        if (rem < 0) rem = 1;
        
        Views.Evaluacion.currentProyectoRubrica.criterios.push({
            id: 'crit_' + Date.now(),
            nombre: 'Nuevo Criterio',
            peso: Math.round(rem*10)/10,
            niveles: [
                { id: 'lvl_inicial', nombre: 'Inicial', valor: 0, descriptor: '' },
                { id: 'lvl_basico', nombre: 'Básico', valor: Math.round(rem*0.5*10)/10, descriptor: '' },
                { id: 'lvl_avanzado', nombre: 'Avanzado', valor: Math.round(rem*0.75*10)/10, descriptor: '' },
                { id: 'lvl_excelente', nombre: 'Excelente', valor: Math.round(rem*10)/10, descriptor: '' }
            ],
            descripciones: {
                'lvl_inicial': '', 'lvl_basico': '', 'lvl_avanzado': '', 'lvl_excelente': ''
            }
        });
        Views.Evaluacion.renderRubricaProyectoEditor();
    };
    
    Views.Evaluacion.activarAsistenteRubrica = function() {
        const course = Store.getActiveCourse();
        const tipo = document.getElementById('sel-tipo-act')?.value || '';
        const nombre = document.getElementById('inp-nombre')?.value || '';
        const maxPts = parseFloat(document.getElementById('inp-max')?.value) || 10;

        Views.Evaluacion.currentProyectoRubrica = window.generarRubricaAsistida(course, tipo, nombre, maxPts);
        Views.Evaluacion.toggleRubricaField();
        Views.Evaluacion.renderRubricaProyectoEditor();
    };

    Views.Evaluacion.cancelarAsistenteRubrica = function() {
        Views.Evaluacion.currentProyectoRubrica = null;
        Views.Evaluacion.toggleRubricaField();
    };

    Views.Evaluacion.reajustarPesosRubrica = function() {
        const rub = Views.Evaluacion.currentProyectoRubrica;
        if (!rub || !Array.isArray(rub.criterios) || rub.criterios.length === 0) return;
        const maxPts = Math.max(0.5, parseFloat(document.getElementById('inp-max')?.value) || 10);
        const items = rub.criterios.map(c => ({
            name: c.nombre,
            weight: parseFloat(c.peso) || 1,
            desc: {
                inicial: c.descripciones?.lvl_inicial,
                basico: c.descripciones?.lvl_basico,
                avanzado: c.descripciones?.lvl_avanzado,
                excelente: c.descripciones?.lvl_excelente
            }
        }));
        rub.puntajeTotal = maxPts;
        rub.criterios = window._buildCriteriosRubrica(items, maxPts);
        Views.Evaluacion.renderRubricaProyectoEditor();
    };

    // Toggle hook
    const _oldToggle = Views.Evaluacion.toggleRubricaField;
Views.Evaluacion.toggleRubricaField = function() {
        const t = document.getElementById('inp-tipo-eval').value;
        const sec = document.getElementById('sec-rubrica');
        const sel = document.getElementById('inp-rubrica');
        const cGlobal = document.getElementById('container-rubrica-global');
        const cProy = document.getElementById('container-rubrica-proyecto');
        const editor = document.getElementById('rubrica-proyecto-editor');
        const btnVolver = document.getElementById('btn-volver-banco-rubrica');

        if (t === 'rubrica') {
            sec.style.display = 'block';
            const esProyecto = document.getElementById('sel-tipo-act') ? document.getElementById('sel-tipo-act').value === 'Proyecto' : false;
            if (esProyecto) {
                if (cGlobal) cGlobal.style.display = 'none';
                if (cProy) cProy.style.display = 'block';
                if (btnVolver) btnVolver.style.display = 'none';
                if (editor) editor.style.display = Views.Evaluacion.currentProyectoRubrica ? 'block' : 'none';
                sel.required = false;
            } else if (Views.Evaluacion.currentProyectoRubrica) {
                if (cGlobal) cGlobal.style.display = 'none';
                if (cProy) cProy.style.display = 'none';
                if (btnVolver) btnVolver.style.display = 'inline-flex';
                if (editor) editor.style.display = 'block';
                sel.required = false;
            } else {
                if (cGlobal) cGlobal.style.display = 'block';
                if (cProy) cProy.style.display = 'none';
                if (btnVolver) btnVolver.style.display = 'none';
                if (editor) editor.style.display = 'none';
                sel.required = true;
            }
        } else {
            sec.style.display = 'none';
            sel.required = false;
            sel.value = '';
        }
    };

    Views.Evaluacion.resetForm = function() {
        document.getElementById('smart-act-form').reset();
        document.getElementById('sel-sug-act').disabled = true;
        document.getElementById('sel-sug-act').innerHTML = `<option value="">Primero elige un tipo...</option>`;
        this.toggleRubricaField();
    };

    Views.Evaluacion.previewRubricaBtn = function() {
        const id = document.getElementById('inp-rubrica').value;
        if (!id) { UI.toast('Selecciona una rúbrica primero', 'warning'); return; }
        EvalGrader.verRubricaSoloLectura(id);
    };

    
    // Diálogo elegante en interfaz para límite de dimensión excedido
    Views.Evaluacion.mostrarAlertaExceso = function({ dimensionNombre, maxPermitido, puntosOtras, nuevoMax, totalResultante, exceso, disponible }) {
        const prev = document.getElementById('dialog-exceso-overlay');
        if (prev) prev.remove();

        const overlay = document.createElement('div');
        overlay.id = 'dialog-exceso-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: rgba(15, 23, 42, 0.68);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            animation: fadeIn 0.2s ease-out;
        `;

        overlay.innerHTML = `
            <div style="background: #ffffff; border-radius: 24px; max-width: 440px; width: 100%; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.4); overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                <!-- Header con degradado coral/rojo premium -->
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 24px 20px 18px; text-align: center; color: white;">
                    <div style="width: 52px; height: 52px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
                        <i data-lucide="alert-octagon" style="width: 28px; height: 28px; stroke-width: 2.5; color: #ffffff;"></i>
                    </div>
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.9;">Límite de Dimensión Excedido</div>
                    <div style="font-size: 18px; font-weight: 800; margin-top: 4px; line-height: 1.25;">${dimensionNombre}</div>
                </div>

                <!-- Cuerpo con desglose visual claro -->
                <div style="padding: 22px 24px;">
                    <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 14px; padding: 14px 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; color: #475569;">
                            <span>Límite máximo permitido:</span>
                            <strong style="color: #0f172a; font-weight: 800;">${maxPermitido}%</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; color: #475569;">
                            <span>Puntos en otras actividades:</span>
                            <strong style="color: #0f172a; font-weight: 800;">${puntosOtras} pts</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; color: #475569;">
                            <span>Puntaje que deseas asignar:</span>
                            <strong style="color: #dc2626; font-weight: 800;">${nuevoMax} pts</strong>
                        </div>
                        <div style="border-top: 1px dashed #fca5a5; margin: 8px 0;"></div>
                        <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 900; color: #b91c1c;">
                            <span>Suma total resultante:</span>
                            <span>${totalResultante} pts <span style="font-size:11px; font-weight:700;">(+${exceso} exceso)</span></span>
                        </div>
                    </div>

                    <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px; text-align: center;">
                        ${disponible > 0 
                            ? `En esta dimensión solo puedes asignar hasta <strong style="color:#0f172a;">${disponible} pts</strong> a esta actividad.`
                            : `Esta dimensión <strong style="color:#b91c1c;">ya tiene todos sus puntos asignados</strong> en otras actividades. Debes reducir los puntos de las otras actividades antes de agregar más.`}
                    </p>

                    <!-- Botones de Acción -->
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${disponible > 0 ? `
                        <button type="button" id="btn-fix-limit-auto" class="btn btn-primary" style="height: 44px; border-radius: 12px; font-weight: 800; font-size: 13px; background: linear-gradient(135deg, #00C853 0%, #00E676 100%); border: none; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(0,200,83,0.3); cursor: pointer;">
                            <i data-lucide="check" style="width: 17px; height: 17px; stroke-width: 2.5;"></i> Ajustar automáticamente a ${disponible} pts
                        </button>
                        ` : ''}
                        <button type="button" id="btn-close-dialog-exceso" class="btn btn-secondary" style="height: 44px; border-radius: 12px; font-weight: 700; font-size: 13px; background: #f8fafc; color: #475569; border: 1.5px solid #e2e8f0; cursor: pointer;">
                            Entendido, voy a corregir
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const btnAuto = overlay.querySelector('#btn-fix-limit-auto');
        if (btnAuto) {
            btnAuto.onclick = () => {
                const inpMax = document.getElementById('inp-max');
                if (inpMax) {
                    inpMax.value = disponible;
                    inpMax.dispatchEvent(new Event('input'));
                }
                overlay.remove();
            };
        }

        const btnClose = overlay.querySelector('#btn-close-dialog-exceso');
        if (btnClose) {
            btnClose.onclick = () => {
                overlay.remove();
                const inpMax = document.getElementById('inp-max');
                if (inpMax) {
                    inpMax.focus();
                    inpMax.select();
                }
            };
        }
    };

    Views.Evaluacion.saveSmartActivity = function(actId) {
        try {
        console.log("Iniciando saveSmartActivity con actId:", actId);
        const form = document.getElementById('smart-act-form');
        if (!form) { 
            alert('Error crítico: El formulario no se encontró en la página.');
            return; 
        }

        // Recoger datos del formulario manualmente para mayor compatibilidad
        const data = {};
        data.nombre = (form.querySelector('#inp-nombre') || {}).value || '';
        data.puntajeMax = (form.querySelector('#inp-max') || {}).value || '';
        data.fecha = (form.querySelector('[name="fecha"]') || {}).value || '';
        data.dimensionKey = (form.querySelector('#inp-dim') || {}).value || '';
        data.parcialId = (form.querySelector('#inp-parcial') || {}).value || '';
        data.tipoEval = (form.querySelector('#inp-tipo-eval') || {}).value || 'directa';
        data.rubricaId = (form.querySelector('#inp-rubrica') || {}).value || '';
        // Capturar el tipo de actividad (puede no existir en modo edición)
        const selTipoAct = form.querySelector('#sel-tipo-act');
        if (selTipoAct && selTipoAct.value) data.tipo = selTipoAct.value;
        
        // Forma segura de obtener el ID del curso
        const activeCourse = Store.getActiveCourse();
        if (!activeCourse) {
            alert('Error: No hay un curso activo seleccionado.');
            return;
        }
        data.cursoId = activeCourse.id;

        // Validación visual de campos requeridos
        let hayErrores = false;
        const camposRequeridos = [
            { id: '#inp-nombre', val: data.nombre, msg: 'El nombre de la actividad es requerido' },
            { id: '#inp-max', val: data.puntajeMax, msg: 'El puntaje máximo es requerido' },
            { id: '#inp-parcial', val: data.parcialId, msg: 'Debes seleccionar un parcial' }
        ];
        
        camposRequeridos.forEach(function(campo) {
            const el = form.querySelector(campo.id);
            if (!campo.val) {
                hayErrores = true;
                if (el) {
                    el.style.borderColor = '#ef4444';
                    el.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)';
                    el.addEventListener('input', function onFix() {
                        el.style.borderColor = '';
                        el.style.boxShadow = '';
                        el.removeEventListener('input', onFix);
                    }, { once: true });
                }
            }
        });
        if (hayErrores) {
            UI.toast('Por favor completa los campos en rojo (Nombre, Puntaje y Parcial)', 'warning');
            return;
        }

        // VALIDACIÓN ESTRICTA: No permitir exceder el límite máximo de la dimensión
        const isRecupParcial = (data.parcialId === 'recuperacion');
        const currentDimsList = isRecupParcial ? [
            { key: 'aula', nombre: 'Guía / Acumulativo de Reforzamiento', porcentaje: 40, max: 40 },
            { key: 'examenes', nombre: 'Examen de Recuperación', porcentaje: 60, max: 60 }
        ] : ((Store.data.configAcademica && Store.data.configAcademica.dimensions) || [
            { key: 'extraAula', nombre: 'Actividades Extra-Aula', porcentaje: 10 },
            { key: 'aula', nombre: 'Actividades de Aula', porcentaje: 25 },
            { key: 'actitudes', nombre: 'Valores y Actitudes', porcentaje: 10 },
            { key: 'expresiones', nombre: 'Expresiones Artísticas', porcentaje: 5 },
            { key: 'examenes', nombre: 'Examen Escrito', porcentaje: 50 }
        ]);
        const currentDim = currentDimsList.find(d => d.key === data.dimensionKey);
        const maxPermitidoDim = currentDim ? parseFloat(currentDim.porcentaje) : 100;
        const otrasActividades = (Store.get('actividades') || []).filter(a => 
            a.cursoId === data.cursoId && 
            a.parcialId === data.parcialId && 
            a.dimensionKey === data.dimensionKey && 
            (!actId || a.id !== actId)
        );
        const puntosOtras = otrasActividades.reduce((s, a) => s + (parseFloat(a.puntajeMax) || 0), 0);
        const nuevoMaximo = parseFloat(data.puntajeMax) || 0;
        const totalResultante = puntosOtras + nuevoMaximo;

        if (totalResultante > maxPermitidoDim) {
            const exceso = Math.round((totalResultante - maxPermitidoDim) * 10) / 10;
            const disponible = Math.max(0, Math.round((maxPermitidoDim - puntosOtras) * 10) / 10);
            
            const elMaxInp = form.querySelector('#inp-max');
            if (elMaxInp) {
                elMaxInp.style.borderColor = '#dc2626';
                elMaxInp.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.25)';
                elMaxInp.focus();
            }

            Views.Evaluacion.mostrarAlertaExceso({
                dimensionNombre: currentDim ? currentDim.nombre : data.dimensionKey,
                maxPermitido: maxPermitidoDim,
                puntosOtras: puntosOtras,
                nuevoMax: nuevoMaximo,
                totalResultante: totalResultante,
                exceso: exceso,
                disponible: disponible
            });
            return;
        }

        // Validaciones puntuales
        const elTipoAct = form.querySelector('#sel-tipo-act');
        const esProyecto = (elTipoAct ? elTipoAct.value : (actId ? (Store.get('actividades') || []).find(a=>a.id===actId).tipo : '')) === 'Proyecto';
        if (data.tipoEval === 'rubrica') {
            if (Views.Evaluacion.currentProyectoRubrica) {
                const maxPts = parseFloat(data.puntajeMax);
                const suma = Views.Evaluacion.currentProyectoRubrica.criterios.reduce((s, c) => s + parseFloat(c.peso||0), 0);
                if (Math.abs(suma - maxPts) > 0.1) {
                    UI.toast(`La suma de los criterios (${Math.round(suma*10)/10}) no coincide con el máximo de la actividad (${maxPts})`, 'error');
                    return;
                }
                Views.Evaluacion.currentProyectoRubrica.nombre = (data.nombre || Views.Evaluacion.currentProyectoRubrica.nombre || 'Rúbrica de Actividad').trim();
                Views.Evaluacion.currentProyectoRubrica.puntajeTotal = maxPts;
                data.rubricaPersonalizada = Views.Evaluacion.currentProyectoRubrica;
                data.rubricaId = ''; // Usa rúbrica incrustada en la actividad

                const chkGuardarBanco = form.querySelector('#chk-guardar-rubrica-banco');
                if (chkGuardarBanco && chkGuardarBanco.checked && typeof Store !== 'undefined') {
                    const cAct = Store.getActiveCourse();
                    const subjCfg = (typeof BancoCurricularInteligente !== 'undefined')
                        ? BancoCurricularInteligente.getSubjectConfig(cAct)
                        : null;
                    const rubCopia = JSON.parse(JSON.stringify(Views.Evaluacion.currentProyectoRubrica));
                    rubCopia.id = 'rub_' + Date.now();
                    rubCopia.asignatura = (cAct && (cAct.asignatura || cAct.materia)) || (subjCfg && subjCfg.label) || 'General';
                    rubCopia.categoria = elTipoAct ? elTipoAct.value : 'General';
                    Store.add('rubricas', rubCopia);
                }
            } else if (esProyecto) {
                UI.toast('Debes configurar la rúbrica del proyecto', 'error');
                return;
            } else if (!data.rubricaId) {
                UI.toast('Debes seleccionar una rúbrica o crearla con el Asistente', 'error');
                return;
            }
        }

        if (actId) {
            // Editar
            const d = Store.get('actividades');
            const idx = d.findIndex(a => a.id === actId);
            if (idx >= 0) {
                const prevAct = d[idx];
                let customFollowups = prevAct.customFollowups;
                if (data.tipoEval === 'proyecto_acumulativo' || data.tipoEval === 'pruebas_formativas_acumulativo') {
                    const maxPts = parseFloat(data.puntajeMax || 0);
                    const oldMaxPts = parseFloat(prevAct.puntajeMax || 0);
                    if (!customFollowups || !Array.isArray(customFollowups) || customFollowups.length === 0) {
                        customFollowups = [];
                        if (data.tipoEval === 'pruebas_formativas_acumulativo') {
                            const _pfMeses2 = ['Febrero/Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre/Noviembre'];
                            const defPts2 = Math.round((maxPts / _pfMeses2.length) * 10) / 10;
                            _pfMeses2.forEach(function(mes, i) {
                                customFollowups.push({ id: 'pf_mes_' + i, nombre: mes, puntaje: defPts2, fecha: '', criterio: 'Prueba Formativa de ' + mes });
                            });
                        } else {
                            const isValores = (data.dimensionKey === 'actitudes') || (data.nombre && data.nombre.toLowerCase().includes('valores'));
                            const globalTplKey = 'valoresTemplate_' + data.parcialId;
                            const globalTpl = (Store.data.config && Store.data.config[globalTplKey]) ? Store.data.config[globalTplKey] : null;
                            
                            if (isValores && globalTpl && globalTpl.length > 0) {
                                const tplSum = globalTpl.reduce((s, t) => s + (parseFloat(t.puntaje) || 0), 0) || 1;
                                const factor = maxPts / tplSum;
                                globalTpl.forEach((t, i) => {
                                    customFollowups.push({
                                        id: 'f' + (i + 1),
                                        nombre: t.nombre,
                                        puntaje: Math.round((t.puntaje * factor) * 10) / 10,
                                        fecha: '',
                                        criterio: ''
                                    });
                                });
                            } else {
                                const defaultPoints = Math.round((maxPts / 8) * 10) / 10;
                                for (let i = 1; i <= 8; i++) {
                                    customFollowups.push({
                                        id: 'f' + i,
                                        nombre: `Seguimiento ${i}`,
                                        puntaje: defaultPoints,
                                        fecha: '',
                                        criterio: ''
                                    });
                                }
                            }
                        }
                        let currentSum = customFollowups.reduce((sum, f) => sum + f.puntaje, 0);
                        let diff = maxPts - currentSum;
                        if (Math.abs(diff) > 0.01 && customFollowups.length > 0) {
                            customFollowups[customFollowups.length - 1].puntaje = Math.round((customFollowups[customFollowups.length - 1].puntaje + diff) * 10) / 10;
                        }
                    } else if (oldMaxPts > 0 && Math.abs(maxPts - oldMaxPts) > 0.05) {
                        // Puntaje máximo modificado al editar: reescalar proporcionalmente
                        const scaleFactor = maxPts / oldMaxPts;
                        customFollowups.forEach(f => {
                            f.puntaje = Math.round((f.puntaje * scaleFactor) * 10) / 10;
                        });
                        let currentSum = customFollowups.reduce((sum, f) => sum + f.puntaje, 0);
                        let diff = maxPts - currentSum;
                        if (Math.abs(diff) > 0.01 && customFollowups.length > 0) {
                            customFollowups[customFollowups.length - 1].puntaje = Math.round((customFollowups[customFollowups.length - 1].puntaje + diff) * 10) / 10;
                        }
                    }
                }
                d[idx] = { ...prevAct, ...data, customFollowups };

                // Si es Pruebas Formativas (Acumulativo), recalcular calificaciones con el nuevo puntajeMax
                if (data.tipoEval === 'pruebas_formativas_acumulativo') {
                    const califs = Store.get('calificaciones') || [];
                    const courseStudents = Store.getStudentsByCourse(data.cursoId) || [];
                    const followupsList = customFollowups || [];
                    courseStudents.forEach(function(student) {
                        let calif = califs.find(c => c.actividadId === actId && c.estudianteId === student.id);
                        if (!calif) return;
                        let sum = 0;
                        let count = 0;
                        followupsList.forEach(function(f) {
                            if (f.activo !== false) {
                                const fg = calif.followups && calif.followups[f.id];
                                if (fg && fg.nota !== undefined && fg.nota !== '' && fg.nota !== null) {
                                    sum += parseFloat(fg.nota);
                                    count++;
                                }
                            }
                        });
                        let total = 0;
                        if (count > 0) {
                            const promedio = sum / count;
                            total = (promedio / 68) * parseFloat(data.puntajeMax);
                            total = Math.round(total * 100) / 100;
                        }
                        calif.nota = total;
                        calif.puntajeObtenido = total;
                        calif.porcentajeObtenido = Math.round((total / parseFloat(data.puntajeMax)) * 10000) / 100;
                        Views.Evaluacion.saveGrade(actId, student.id, total, parseFloat(data.puntajeMax));
                    });
                }

                Store.save();
            }
        } else {
            // Check max limit
            const dim = currentDimsList.find(d => d.key === data.dimensionKey);
            const currentCount = (Store.get('actividades') || []).filter(a => a.cursoId === data.cursoId && a.dimensionKey === data.dimensionKey && a.parcialId === data.parcialId).length;
            if (!isRecupParcial && dim && dim.max && currentCount >= dim.max) {
                alert(`⚠️ Has alcanzado el límite máximo de ${dim.max} actividades en esta dimensión para el parcial seleccionado.`);
                return;
            }

            // Crear
            if (data.tipoEval === 'proyecto_acumulativo' || data.tipoEval === 'pruebas_formativas_acumulativo') {
                data.customFollowups = [];
                const maxPts = parseFloat(data.puntajeMax || 0);
                if (data.tipoEval === 'pruebas_formativas_acumulativo') {
                    const _pfMeses = ['Febrero/Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre/Noviembre'];
                    const defPts = Math.round((maxPts / _pfMeses.length) * 10) / 10;
                    _pfMeses.forEach(function(mes, i) {
                        data.customFollowups.push({ id: 'pf_mes_' + i, nombre: mes, puntaje: defPts, fecha: '', criterio: 'Prueba Formativa de ' + mes });
                    });
                } else {
                    const isValores = (data.dimensionKey === 'actitudes') || (data.nombre && data.nombre.toLowerCase().includes('valores'));
                    const globalTplKey = 'valoresTemplate_' + data.parcialId;
                    const globalTpl = (Store.data.config && Store.data.config[globalTplKey]) ? Store.data.config[globalTplKey] : null;
                    
                    if (isValores && globalTpl && globalTpl.length > 0) {
                        const tplSum = globalTpl.reduce((s, t) => s + (parseFloat(t.puntaje) || 0), 0) || 1;
                        const factor = maxPts / tplSum;
                        globalTpl.forEach((t, i) => {
                            data.customFollowups.push({
                                id: 'f' + (i + 1),
                                nombre: t.nombre,
                                puntaje: Math.round((t.puntaje * factor) * 10) / 10,
                                fecha: '',
                                criterio: ''
                            });
                        });
                    } else {
                        const defaultPoints = Math.round((maxPts / 8) * 10) / 10;
                        for (let i = 1; i <= 8; i++) {
                            data.customFollowups.push({
                                id: 'f' + i,
                                nombre: `Seguimiento ${i}`,
                                puntaje: defaultPoints,
                                fecha: '',
                                criterio: ''
                            });
                        }
                    }
                }
                let currentSum = data.customFollowups.reduce((sum, f) => sum + f.puntaje, 0);
                let diff = maxPts - currentSum;
                if (Math.abs(diff) > 0.01 && data.customFollowups.length > 0) {
                    data.customFollowups[data.customFollowups.length - 1].puntaje = Math.round((data.customFollowups[data.customFollowups.length - 1].puntaje + diff) * 10) / 10;
                }
            }
            Store.add('actividades', data);
        }

        // --- SISTEMA DE APRENDIZAJE ---
        // Se ejecuta para memorizar nuevas actividades a futuro
        Views.Evaluacion.aprenderActividad(data);

        UI.closeModal();
        UI.toast(actId ? 'Actividad actualizada' : 'Actividad creada', 'success');

        // Refrescar vista
        if (Router.current === 'cuadro') {
            const cont = document.getElementById('content');
            if (cont) {
                cont.innerHTML = Views.Cuadro.render(data.parcialId || undefined);
                if (window.lucide) window.lucide.createIcons();
            }
        } else if (data.parcialId) {
            this.renderParcialDimension(data.parcialId, data.dimensionKey);
        } else {
            this.renderDimension(data.dimensionKey);
        }
        } catch(e) {
            UI.toast('Error al guardar: ' + e.message, 'error');
            console.error('[EvalSmart] saveSmartActivity error:', e);
        }
    };
    // ---------------------------------------------------------------
    //  SINCRONIZACIÓN DE PRUEBAS FORMATIVAS → EXÁMENES
    // ---------------------------------------------------------------
    Views.Evaluacion.sincronizarPruebasFormativas = function(actId, silencioso) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act || act.tipoEval !== 'pruebas_formativas_acumulativo') return;

        const course = Store.getActiveCourse();
        if (!course) return;
        const courseId = course.id;
        const students = Store.getStudentsByCourse(courseId) || [];

        // Máximo total de una prueba formativa (48 lectura + 20 escritura = 68)
        const PF_MAX_TOTAL = 68;
        const followups = act.customFollowups || [];

        let sincronizados = 0;
        let sinDatos = [];

        followups.forEach(function(f) {
            // El nombre del seguimiento es el mes (ej: "Febrero/Marzo")
            const mes = f.nombre;
            const mesKey = mes.replace(/\//g, '-');
            const pfKey = 'pruebas_formativas_' + courseId + '_' + mesKey;
            let pfData = null;
            try {
                const raw = localStorage.getItem(pfKey);
                if (raw) pfData = JSON.parse(raw);
            } catch(e) {}

            if (!pfData || !pfData.filas || pfData.filas.length === 0) {
                sinDatos.push(mes);
                return;
            }

            students.forEach(function(student) {
                // Buscar fila del estudiante en pruebas formativas
                const fila = pfData.filas.find(function(row) {
                    return row.estudianteId === student.id;
                });

                const lectura = fila && fila.lectura !== '' && fila.lectura !== null && fila.lectura !== undefined ? parseFloat(fila.lectura) : null;
                const escritura = fila && fila.escritura !== '' && fila.escritura !== null && fila.escritura !== undefined ? parseFloat(fila.escritura) : null;

                if (lectura === null && escritura === null) return;

                const totalPF = (isNaN(lectura) ? 0 : lectura) + (isNaN(escritura) ? 0 : escritura);
                const notaFinal = Math.min(totalPF, PF_MAX_TOTAL); // No superar el máximo de 68

                // Guardar en calificaciones
                let califs = Store.get('calificaciones') || [];
                let calif = califs.find(c => c.actividadId === actId && c.estudianteId === student.id);
                if (!calif) {
                    calif = {
                        id: 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        cursoId: courseId,
                        actividadId: actId,
                        estudianteId: student.id,
                        puntajeObtenido: 0,
                        porcentajeObtenido: 0,
                        nota: 0,
                        followups: {}
                    };
                    califs.push(calif);
                }
                if (!calif.followups) calif.followups = {};
                calif.followups[f.id] = {
                    nota: notaFinal, // Almacenar sobre 68
                    fecha: new Date().toISOString().split('T')[0],
                    syncedFrom: 'pruebas_formativas',
                    pfLectura: lectura,
                    pfEscritura: escritura
                };
                sincronizados++;
            });
        });

        // Recalcular totales de cada estudiante
        let califs = Store.get('calificaciones') || [];
        students.forEach(function(student) {
            let calif = califs.find(c => c.actividadId === actId && c.estudianteId === student.id);
            if (!calif) return;
            let sum = 0;
            let count = 0;
            followups.forEach(function(f) {
                if (f.activo !== false) {
                    const fg = calif.followups && calif.followups[f.id];
                    if (fg && fg.nota !== undefined && fg.nota !== '' && fg.nota !== null) {
                        sum += parseFloat(fg.nota);
                        count++;
                    }
                }
            });
            let total = 0;
            if (count > 0) {
                const promedio = sum / count;
                total = (promedio / PF_MAX_TOTAL) * parseFloat(act.puntajeMax);
                total = Math.round(total * 100) / 100;
            }
            calif.nota = total;
            calif.puntajeObtenido = total;
            calif.porcentajeObtenido = Math.round((total / parseFloat(act.puntajeMax)) * 10000) / 100;
            Views.Evaluacion.saveGrade(actId, student.id, total, parseFloat(act.puntajeMax));
        });

        Store.save();

        if (!silencioso) {
            if (sinDatos.length > 0) {
                UI.toast('Sincronizado. Sin datos en: ' + sinDatos.join(', '), 'warning');
            } else {
                UI.toast('✅ Notas sincronizadas desde Pruebas Formativas (' + sincronizados + ' registros)', 'success');
            }
        }

        // Refrescar la vista
        Views.Evaluacion.gradeFollowupActivity(actId);
    };

    console.log('[EvalSmart] Modal Híbrido montado correctamente ✓');
})();


// ----------------------------------------------------------------
//  GRADER — Calificación por rúbrica (por alumno)
// ----------------------------------------------------------------
window.EvalGrader = {

    openRubricaGrading(actId) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (!act || (!act.rubricaId && !act.rubricaPersonalizada)) return;
        let rubrica = act.rubricaPersonalizada;
        if (!rubrica) rubrica = (Store.get('rubricas') || []).find(r => r.id === act.rubricaId);
        if (!rubrica) { UI.toast('Rúbrica no encontrada', 'error'); return; }
        const course = Store.getActiveCourse();
        if (!course) return;
        const students = Store.getStudentsByCourse(course.id);

        const dims = (Store.data.configAcademica && Store.data.configAcademica.dimensions) || [];
        const dimIdx = dims.findIndex(d => d.key === act.dimensionKey);
        const theme = Utils.getDimensionTheme(dims[dimIdx]?.nombre, dimIdx);
        const rubricas = (Store.get('rubricas') || []).filter(r => r.estado !== 'archivada');

        const content = document.getElementById('content');
        
        // CUADRO CONTROLADOR INTELIGENTE (Lista de estudiantes con estatus de rúbrica)
        content.innerHTML = `
<div class="a360-header">
    <div class="a360-header-left">
        <div class="a360-header-icon" style="background:${theme.bg}; color:${theme.text}; border-radius:16px;">
            <i data-lucide="puzzle"></i>
        </div>
        <div>
            <h2 class="a360-header-title">${act.nombre}</h2>
            <p class="a360-header-subtitle">
                <span style="color:${theme.text}; font-weight:800;">${act.puntajeMax} pts</span> &bull; 
                <span style="text-decoration:underline; cursor:pointer;" onclick="EvalGrader.verRubricaSoloLectura('${rubrica.id || ''}', '${act.id}')">Rúbrica: ${rubrica.nombre}</span>
            </p>
        </div>
    </div>
    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Método:</span>
            <select onchange="Views.Evaluacion.switchGradingMethod('${act.id}', this.value)" style="height: 42px; border-radius: 12px; border: 1.5px solid var(--border-soft); background: #fff; padding: 0 12px; font-size: 13px; font-weight: 700; color: #334155; cursor: pointer; box-shadow: var(--shadow-sm);">
                <option value="directa" ${act.tipoEval === 'directa' ? 'selected' : ''}>✏️ Calificación Directa</option>
                <option value="proyecto_acumulativo" ${act.tipoEval === 'proyecto_acumulativo' ? 'selected' : ''}>📈 Proyecto Acumulativo</option>
                ${rubricas.map(r => `<option value="${r.id}" ${act.tipoEval === 'rubrica' && act.rubricaId === r.id ? 'selected' : ''}>🧩 Rúbrica: ${r.nombre}</option>`).join('')}
            </select>
        </div>
        <button class="btn" onclick="Views.Evaluacion.volverDeCalificar('${act.parcialId}','${act.dimensionKey}')" style="display:flex; align-items:center; gap:8px; border-radius:12px; font-weight:800; height:42px; padding:0 18px; background:linear-gradient(135deg, #f97316 0%, #ea580c 100%); color:#ffffff; border:none; box-shadow:0 4px 12px rgba(234, 88, 12, 0.35); cursor:pointer; transition:all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(234, 88, 12, 0.45)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(234, 88, 12, 0.35)';">
            <i data-lucide="check-circle-2" style="width:16px; height:16px; color:#ffffff;"></i>
            <span>Guardar y Volver</span>
        </button>
    </div>
</div>

        <!-- Lista estudiantes -->
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${students.map((s, i) => {
              const applied = EvalGrader._getApplied(actId, s.id);
              return `
              <div style="background:#fff; border:1px solid var(--border-soft); border-radius:16px; transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: var(--shadow-sm); overflow: hidden;"
                   onmouseover="this.style.borderColor='${theme.border}'; this.style.transform='translateX(4px)'; this.style.boxShadow='var(--shadow-hover)';" 
                   onmouseout="this.style.borderColor='var(--border-soft)'; this.style.transform='translateX(0)'; this.style.boxShadow='var(--shadow-sm)';">
                <div style="padding:18px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #64748b; font-size: 14px;">
                        ${i+1}
                    </div>
                    <div>
                        <div style="font-weight:800; color:#0f172a; font-size: 15px;">${s.nombreCompleto}</div>
                        <div style="font-size:12px; color:#64748b; margin-top: 2px; font-weight: 500;">ID: ${s.identidad || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div style="display:flex; align-items:center; gap:20px">
                    ${applied ? `
                        <div style="text-align:right;">
                            <div style="font-size:20px; font-weight:900; color:#00C853; line-height: 1;">${applied.total} <span style="font-size:12px; color:#94a3b8; font-weight:600">/ ${act.puntajeMax}</span></div>
                            <div style="font-size:10px; color:#16a34a; font-weight:800; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px;">✓ Evaluación Completa</div>
                        </div>
                    ` : `
                        <div style="font-size:12px; font-weight:700; color:#94a3b8; padding:6px 14px; background:#f8fafc; border-radius:12px; border: 1px solid #e2e8f0;">Pendiente</div>
                    `}
                    
                    <div style="display:flex; gap:10px">
                      ${applied ? `
                      <button onclick="EvalGrader.verDetalle('${actId}','${s.id}')" title="Ver detalle" style="width: 40px; height: 40px; border: 1.5px solid #e2e8f0; border-radius:12px; background:#f8fafc; cursor:pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s;">
                        <i data-lucide="eye" style="width:18px;"></i>
                      </button>` : ''}
                      <button onclick="EvalGrader.openAlumno('${actId}','${s.id}','${act.rubricaId}')" 
                        style="height: 40px; padding:0 20px; border:none; border-radius:12px; background:${applied?'#0f172a':'var(--primary)'}; color:#fff; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow: 0 4px 10px ${applied ? 'rgba(15,23,42,0.15)' : 'rgba(0,200,83,0.3)'}; transition: all 0.2s;">
                        <i data-lucide="${applied ? 'edit-2' : 'check-square'}" style="width:16px; stroke-width: 2.5px;"></i>
                        ${applied ? 'Editar' : 'Calificar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    _getApplied(actId, estudianteId) {
        // Obtenemos los datos persistidos en localStorage, para el cruce de criterios
        const key = `rubapp_${actId}_${estudianteId}`;
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },

    _saveApplied(actId, estudianteId, data) {
        const key = `rubapp_${actId}_${estudianteId}`;
        localStorage.setItem(key, JSON.stringify(data));
    },

    openAlumno(actId, estudianteId, rubricaId) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        let rubrica = act.rubricaPersonalizada;
        if (!rubrica) rubrica = (Store.get('rubricas') || []).find(r => r.id === rubricaId);
        const student = (Store.get('estudiantes') || []).find(s => s.id === estudianteId);
        if (!act || !rubrica || !student) return;

        // Buscar lista de alumnos del curso actual para navegación
        const course = Store.getActiveCourse();
        let prevStudent = null;
        let nextStudent = null;
        let currentIndex = -1;
        let studentsList = [];
        if (course) {
            studentsList = Store.getStudentsByCourse(course.id) || [];
            currentIndex = studentsList.findIndex(s => s.id === estudianteId);
            if (currentIndex > 0) {
                prevStudent = studentsList[currentIndex - 1];
            }
            if (currentIndex >= 0 && currentIndex < studentsList.length - 1) {
                nextStudent = studentsList[currentIndex + 1];
            }
        }

        const prevStudentId = prevStudent ? prevStudent.id : '';
        const nextStudentId = nextStudent ? nextStudent.id : '';

        // Registrar información de navegación en caliente
        EvalGrader.currentNavigation = {
            actId,
            estudianteId,
            rubricaId,
            prevStudentId,
            nextStudentId,
            maxPts: act.puntajeMax
        };

        const criterios = rubrica.criterios || [];
        const niveles = (criterios[0]?.niveles || rubrica.niveles || []).map((n, idx) => ({
            id: n.id || n.levelId,
            nombre: n.nombre
        }));
        const existing = this._getApplied(actId, estudianteId);
        const prevSel = existing ? existing.criterios : {};

        // Extraer iniciales del estudiante para avatar
        const parts = (student.nombreCompleto || '').trim().split(' ');
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'ST');

        // Nombre corto para botones de navegación
        const getFirstName = (st) => st ? (st.nombreCompleto || '').split(' ')[0] : '';
        const prevFirstName = getFirstName(prevStudent);
        const nextFirstName = getFirstName(nextStudent);

        const totalStudentsCount = studentsList.length || 1;
        const progressPct = Math.round(((currentIndex + 1) / totalStudentsCount) * 100);

        UI.modal(`Rúbrica: ${act.nombre}`, `
            <div id="rubrica-matrix-modal-wrap" class="pro-rubric-container">
              <style>
                #nav-back-pill, .nav-back-pill {
                    display: none !important;
                }
                #modal-overlay.open {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 8px !important;
                    overflow: hidden !important;
                }
                #modal-overlay.open .modal {
                    width: 98vw !important;
                    max-width: 1380px !important;
                    height: 96vh !important;
                    max-height: 740px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    margin: 0 !important;
                    border-radius: 20px !important;
                    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.35) !important;
                    overflow: hidden !important;
                    background: #f8fafc !important;
                    border: 1px solid rgba(226, 232, 240, 0.8) !important;
                }
                #modal-overlay.open .modal-body {
                    flex: 1 !important;
                    overflow: hidden !important;
                    padding: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                }
                #modal-overlay.open .modal-header {
                    display: none !important;
                }

                .pro-rubric-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    height: 100%;
                    background: #f8fafc;
                }

                /* PRO Header Banner Sticky at Top */
                .pro-rubric-header {
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%);
                    color: white;
                    padding: 12px 18px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
                    position: relative;
                    z-index: 10;
                    flex-shrink: 0;
                }
                .pro-student-badge {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }
                .pro-student-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(8px);
                    border: 1.5px solid rgba(255, 255, 255, 0.25);
                    display: grid;
                    place-items: center;
                    font-weight: 900;
                    font-size: 15px;
                    color: #fff;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                    flex-shrink: 0;
                }
                .pro-student-name {
                    font-size: 15px;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: -0.01em;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .pro-student-meta {
                    font-size: 11px;
                    color: rgba(224, 231, 255, 0.85);
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 2px;
                }
                .pro-meta-pill {
                    background: rgba(255, 255, 255, 0.14);
                    padding: 2px 8px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .pro-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }
                .pro-btn-nav-header {
                    height: 38px;
                    padding: 0 16px;
                    border-radius: 10px;
                    border: 1.5px solid #ffffff;
                    background: #ffffff;
                    color: #1e1b4b;
                    font-size: 13px;
                    font-weight: 900;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .pro-btn-nav-header:hover:not(:disabled) {
                    background: #f8fafc;
                    color: #4338ca;
                    border-color: #ffffff;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
                }
                .pro-btn-nav-header:disabled {
                    background: rgba(255, 255, 255, 0.15);
                    color: rgba(255, 255, 255, 0.55);
                    border: 1.5px dashed rgba(255, 255, 255, 0.3);
                    box-shadow: none;
                    cursor: not-allowed;
                }
                .pro-score-header-box {
                    background: #022c22;
                    border: 2px solid #10b981;
                    border-radius: 12px;
                    padding: 4px 14px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-width: 115px;
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
                }
                .pro-btn-save-header {
                    height: 38px;
                    padding: 0 18px;
                    border-radius: 10px;
                    border: 1.5px solid #34d399;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 900;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .pro-btn-save-header:hover {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
                }

                /* Content Grid / Table Area */
                .pro-rubric-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 20px;
                    background: #f8fafc;
                }

                /* Widescreen Matrix Table */
                .pro-matrix-table-wrap {
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
                    overflow: hidden;
                    margin-bottom: 12px;
                }
                .pro-matrix-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                }
                .pro-matrix-table th {
                    background: #0f172a;
                    color: #f8fafc;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 12px 14px;
                    text-align: center;
                    border-bottom: 2px solid #334155;
                    position: sticky;
                    top: 0;
                    z-index: 5;
                }
                .pro-matrix-table td {
                    border-bottom: 1px solid #f1f5f9;
                    border-right: 1px solid #f1f5f9;
                    padding: 8px;
                    vertical-align: stretch;
                }
                .pro-crit-title-cell {
                    background: #f8fafc;
                    padding: 12px 14px !important;
                    min-width: 160px;
                    max-width: 220px;
                }
                .pro-crit-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    border-radius: 6px;
                    background: #4338ca;
                    color: #fff;
                    font-size: 11px;
                    font-weight: 900;
                    margin-right: 8px;
                }
                .pro-crit-name {
                    font-size: 13px;
                    font-weight: 800;
                    color: #1e293b;
                    line-height: 1.3;
                }

                /* Cell & Touch Cards */
                .pro-cell-card {
                    height: 100%;
                    min-height: 64px;
                    background: #ffffff;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 10px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    user-select: none;
                }
                .pro-cell-card:hover:not(.selected) {
                    border-color: #6366f1;
                    background: #f5f3ff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
                }
                .pro-cell-card.selected {
                    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%) !important;
                    border-color: #4338ca !important;
                    box-shadow: 0 6px 16px rgba(67, 56, 202, 0.3) !important;
                    color: #ffffff !important;
                }
                .pro-cell-pts {
                    align-self: flex-end;
                    font-size: 11px;
                    font-weight: 900;
                    padding: 2px 8px;
                    border-radius: 10px;
                    background: #f1f5f9;
                    color: #475569;
                    transition: all 0.2s;
                }
                .pro-cell-card.selected .pro-cell-pts {
                    background: rgba(255, 255, 255, 0.25) !important;
                    color: #ffffff !important;
                }
                .pro-cell-desc {
                    font-size: 11.5px;
                    line-height: 1.35;
                    font-weight: 600;
                    color: #334155;
                    margin-top: 6px;
                }
                .pro-cell-card.selected .pro-cell-desc {
                    color: rgba(255, 255, 255, 0.95) !important;
                }

                /* PRO Mobile / Touch Layout */
                .pro-mobile-cards-wrap {
                    display: none;
                    flex-direction: column;
                    gap: 16px;
                }
                .pro-mobile-card {
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
                }
                .pro-mobile-card-title {
                    font-size: 14px;
                    font-weight: 900;
                    color: #0f172a;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .pro-mobile-levels-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    gap: 10px;
                }

                @media (max-width: 850px) {
                    .pro-matrix-table-wrap { display: none !important; }
                    .pro-mobile-cards-wrap { display: flex !important; }
                    .pro-rubric-header { flex-direction: column; align-items: stretch; gap: 10px; padding: 10px 14px; }
                    .pro-header-actions { justify-content: space-between; }
                    .pro-student-name { font-size: 14px; }
                }

                /* PRO Sub-Bar Footer (Progress & Status) */
                .pro-rubric-subfooter {
                    background: #ffffff;
                    border-top: 1px solid #e2e8f0;
                    padding: 10px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                    box-shadow: 0 -2px 10px rgba(15, 23, 42, 0.04);
                    flex-shrink: 0;
                }
                .pro-progress-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .pro-progress-bar-bg {
                    width: 120px;
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .pro-progress-bar-fill {
                    height: 100%;
                    background: #10b981;
                    border-radius: 10px;
                    transition: width 0.3s ease;
                }
                .pro-score-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    background: #e0e7ff;
                    color: #3730a3;
                }
              </style>

              <!-- Header Pro (Arriba y Visible Todo el Tiempo) -->
              <div class="pro-rubric-header">
                  <div class="pro-student-badge">
                      <div class="pro-student-avatar">${initials}</div>
                      <div>
                          <div class="pro-student-name">${student.nombreCompleto}</div>
                          <div class="pro-student-meta">
                              <span>ID: ${student.identidad || 'N/A'}</span>
                              <span class="pro-meta-pill">Alumno ${currentIndex + 1} de ${totalStudentsCount}</span>
                              <span class="pro-meta-pill">${act.nombre} (${act.puntajeMax} pts)</span>
                          </div>
                      </div>
                  </div>

                  <!-- Botones de Navegación Superiores Fijos -->
                  <div class="pro-header-actions">
                      <button type="button" 
                              class="pro-btn-nav-header" 
                              ${prevStudentId ? `onclick="EvalGrader.navigateRubricaStudent('${actId}', '${estudianteId}', '${prevStudentId}', '${rubricaId}', ${act.puntajeMax})"` : 'disabled'}>
                          <i data-lucide="chevron-left" style="width:16px;"></i>
                          <span>Anterior ${prevFirstName ? `(${prevFirstName})` : ''}</span>
                      </button>

                      <button type="button" 
                              class="pro-btn-nav-header" 
                              ${nextStudentId ? `onclick="EvalGrader.navigateRubricaStudent('${actId}', '${estudianteId}', '${nextStudentId}', '${rubricaId}', ${act.puntajeMax})"` : 'disabled'}>
                          <span>Siguiente ${nextFirstName ? `(${nextFirstName})` : ''}</span>
                          <i data-lucide="chevron-right" style="width:16px;"></i>
                      </button>

                      <div class="pro-score-header-box" style="background:rgba(0,0,0,0.35); border:1.5px solid rgba(16,185,129,0.4); border-radius:12px; padding:4px 14px; text-align:center; min-width:110px;">
                          <div style="font-size:9px; text-transform:uppercase; color:#10b981; font-weight:900; letter-spacing:0.05em;">Nota Acumulada</div>
                          <div id="rubrica-total-display" style="font-size:17px; font-weight:900; color:#ffffff; line-height:1.1;">0 / ${act.puntajeMax} pts</div>
                          <div id="rubrica-raw-display" style="font-size:9.5px; color:rgba(224,231,255,0.8); font-weight:700;">(0 / 0 pts brutos)</div>
                      </div>

                      <button type="button" 
                              onclick="EvalGrader._saveRubricaGrade('${actId}','${estudianteId}','${rubricaId}',${act.puntajeMax})" 
                              class="pro-btn-save-header">
                          <i data-lucide="check-circle-2" style="width:16px;"></i>
                          <span>Guardar y Salir</span>
                      </button>

                      <button onclick="UI.closeModal()" style="background:rgba(255,255,255,0.15); border:none; border-radius:10px; width:34px; height:34px; color:#fff; cursor:pointer; display:grid; place-items:center; transition:all 0.2s;" title="Cerrar ventana">
                          <i data-lucide="x" style="width:18px;"></i>
                      </button>
                  </div>
              </div>

              <!-- Body: Widescreen Matrix Table + Mobile Touch Cards -->
              <div class="pro-rubric-body">
                  
                  <!-- Desktop/Tablet Matrix Table -->
                  <div class="pro-matrix-table-wrap">
                      <table class="pro-matrix-table">
                          <thead>
                              <tr>
                                  <th style="width: 200px; text-align: left; padding-left: 16px;">Criterio Evaluado</th>
                                  ${niveles.map(n => `<th>${n.nombre}</th>`).join('')}
                              </tr>
                          </thead>
                          <tbody>
                              ${criterios.map((c, ci) => `
                              <tr>
                                  <td class="pro-crit-title-cell">
                                      <div style="display:flex; align-items:center;">
                                          <span class="pro-crit-badge">${ci + 1}</span>
                                          <span class="pro-crit-name">${c.nombre}</span>
                                      </div>
                                  </td>
                                  ${niveles.map((n, ni) => {
                                      const levelObj = c.niveles?.find(l => l.id === n.id || l.nombre === n.nombre) || c.niveles?.[ni];
                                      const desc = levelObj?.descriptor || (c.descripciones || {})[n.id] || '';
                                      const puntos = levelObj ? parseFloat(levelObj.valor || 0) : 0;
                                      const checked = prevSel[c.id] === n.id || prevSel[c.id] === levelObj?.id;
                                      return `
                                      <td>
                                          <div class="pro-cell-card ${checked ? 'selected' : ''}" 
                                               data-act-id="${act.id}"
                                               onclick="EvalGrader.selectCell(this, '${c.id}', '${n.id}')">
                                              <input type="radio" name="crit_${c.id}" value="${n.id}" data-puntos="${puntos}" data-crit="${c.id}" ${checked ? 'checked' : ''} style="display:none;">
                                              <div class="pro-cell-pts">${puntos} pts</div>
                                              <div class="pro-cell-desc">${desc || '<span style="opacity:0.5; font-style:italic;">Sin descripción</span>'}</div>
                                          </div>
                                      </td>`;
                                  }).join('')}
                              </tr>`).join('')}
                          </tbody>
                      </table>
                  </div>

                  <!-- Mobile Touch Cards -->
                  <div class="pro-mobile-cards-wrap">
                      ${criterios.map((c, ci) => `
                      <div class="pro-mobile-card">
                          <div class="pro-mobile-card-title">
                              <span class="pro-crit-badge">${ci + 1}</span>
                              <span>${c.nombre}</span>
                          </div>
                          <div class="pro-mobile-levels-grid">
                              ${niveles.map((n, ni) => {
                                  const levelObj = c.niveles?.find(l => l.id === n.id || l.nombre === n.nombre) || c.niveles?.[ni];
                                  const desc = levelObj?.descriptor || (c.descripciones || {})[n.id] || '';
                                  const puntos = levelObj ? parseFloat(levelObj.valor || 0) : 0;
                                  const checked = prevSel[c.id] === n.id || prevSel[c.id] === levelObj?.id;
                                  return `
                                  <div class="pro-cell-card ${checked ? 'selected' : ''}" 
                                       data-act-id="${act.id}"
                                       onclick="EvalGrader.selectCell(this, '${c.id}', '${n.id}')">
                                      <input type="radio" name="crit_${c.id}" value="${n.id}" data-puntos="${puntos}" data-crit="${c.id}" ${checked ? 'checked' : ''} style="display:none;">
                                      <div style="font-size:12px; font-weight:800;">${n.nombre}</div>
                                      <div class="pro-cell-pts" style="margin-top:4px;">${puntos} pts</div>
                                      ${desc ? `<div class="pro-cell-desc" style="font-size:11px;">${desc}</div>` : ''}
                                  </div>`;
                              }).join('')}
                          </div>
                      </div>`).join('')}
                  </div>

              </div>

              <!-- Subfooter Inferior Limpio (Progreso de la sección y Desempeño) -->
              <div class="pro-rubric-subfooter">
                  <div class="pro-progress-group">
                      <span style="font-size:11px; font-weight:800; color:#64748b;">Progreso sección: ${progressPct}%</span>
                      <div class="pro-progress-bar-bg">
                          <div class="pro-progress-bar-fill" style="width:${progressPct}%;"></div>
                      </div>
                  </div>
                  <div id="rubrica-perf-badge" class="pro-score-badge">Evaluando...</div>
              </div>
            </div>
        `);

        setTimeout(() => {
            if(window.lucide) window.lucide.createIcons();
            this._recalcTotal(act.puntajeMax);
        }, 100);
    },

    selectCell(cellElement, critId, levelId) {
        const radio = cellElement.querySelector('input[type="radio"]');
        if (radio) {
            radio.checked = true;
            
            // Remove 'selected' class from sibling cells in same criterion container
            const container = cellElement.closest('tr') || cellElement.closest('.pro-mobile-levels-grid');
            if (container) {
                container.querySelectorAll('.pro-cell-card').forEach(cell => cell.classList.remove('selected'));
            }
            
            // Add 'selected' class to current cell
            cellElement.classList.add('selected');
            
            // Recalculate total score
            const actId = cellElement.getAttribute('data-act-id');
            const act = (Store.get('actividades') || []).find(a => a.id === actId);
            if (act) {
                this._recalcTotal(act.puntajeMax);
            }

            // Auto-save silently for the CURRENT student so no data is ever lost
            const nav = EvalGrader.currentNavigation;
            if (nav && nav.estudianteId) {
                EvalGrader._saveRubricaGradeSilent(nav.actId, nav.estudianteId, nav.rubricaId, nav.maxPts);
            }
        }
    },

    _recalcTotal(maxPts) {
        const radios = document.querySelectorAll('input[type=radio]:checked');
        let sum = 0;
        radios.forEach(r => { sum += parseFloat(r.dataset.puntos || 0); });
        
        let rubricaMax = 0;
        const criterioNames = new Set();
        document.querySelectorAll('input[type=radio]').forEach(r => {
            if (!criterioNames.has(r.name)) {
                criterioNames.add(r.name);
                const opts = document.querySelectorAll(`input[name="${r.name}"]`);
                let maxCrit = 0;
                opts.forEach(o => { maxCrit = Math.max(maxCrit, parseFloat(o.dataset.puntos || 0)); });
                rubricaMax += maxCrit;
            }
        });
        const scaled = rubricaMax > 0 ? Math.round((sum / rubricaMax) * maxPts * 10) / 10 : 0;
        const display = document.getElementById('rubrica-total-display');
        if (display) display.innerHTML = `${scaled} <span style="font-size:11px; opacity:0.85; font-weight:700;">/ ${maxPts} pts</span>`;

        const rawDisplay = document.getElementById('rubrica-raw-display');
        if (rawDisplay) rawDisplay.textContent = `(${sum} / ${rubricaMax} pts brutos)`;

        const badge = document.getElementById('rubrica-perf-badge');
        if (badge) {
            const pct = maxPts > 0 ? (scaled / maxPts) * 100 : 0;
            if (pct >= 90) {
                badge.textContent = '🌟 Excelente (' + Math.round(pct) + '%)';
                badge.style.background = '#dcfce7';
                badge.style.color = '#15803d';
            } else if (pct >= 80) {
                badge.textContent = '👏 Muy Bueno (' + Math.round(pct) + '%)';
                badge.style.background = '#e0e7ff';
                badge.style.color = '#3730a3';
            } else if (pct >= 70) {
                badge.textContent = '👍 Satisfactorio (' + Math.round(pct) + '%)';
                badge.style.background = '#fef9c3';
                badge.style.color = '#a16207';
            } else {
                badge.textContent = '⚠️ Necesita Mejorar (' + Math.round(pct) + '%)';
                badge.style.background = '#fee2e2';
                badge.style.color = '#b91c1c';
            }
        }
        return { sum, rubricaMax, scaled };
    },

    _saveRubricaGrade(actId, estudianteId, rubricaId, maxPts) {
        const { sum, rubricaMax, scaled } = this._recalcTotal(maxPts);

        const criteriosSel = {};
        document.querySelectorAll('input[type=radio]:checked').forEach(r => {
            criteriosSel[r.dataset.crit] = r.value;
        });

        const detalle = {
            actId, estudianteId, rubricaId,
            criterios: criteriosSel,
            sumaBruta: sum, rubricaMax,
            total: scaled,
            fecha: new Date().toISOString(),
        };
        this._saveApplied(actId, estudianteId, detalle);

        // Guardar el puntaje final transparente en Store.calificaciones
        Views.Evaluacion.saveGrade(actId, estudianteId, scaled, parseFloat(maxPts));

        UI.closeModal();
        UI.toast(`✅ Calificado: ${scaled} / ${maxPts}`, 'success');

        // Refresh The View Behind
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (act) EvalGrader.openRubricaGrading(actId);
    },

    navigateRubricaStudent(actId, currentStudentId, targetStudentId, rubricaId, maxPts) {
        // Guardamos el actual silenciosamente
        this._saveRubricaGradeSilent(actId, currentStudentId, rubricaId, maxPts);
        
        // Abrimos el siguiente alumno
        this.openAlumno(actId, targetStudentId, rubricaId);
        
        // Mostramos un mini aviso o feedback visual
        // UI.toast('Guardado automático ✓', 'success'); // Removed to avoid spamming the user
    },

    _saveRubricaGradeSilent(actId, estudianteId, rubricaId, maxPts) {
        const { sum, rubricaMax, scaled } = this._recalcTotal(maxPts);

        const criteriosSel = {};
        document.querySelectorAll('input[type=radio]:checked').forEach(r => {
            criteriosSel[r.dataset.crit] = r.value;
        });

        const detalle = {
            actId, estudianteId, rubricaId,
            criterios: criteriosSel,
            sumaBruta: sum, rubricaMax,
            total: scaled,
            fecha: new Date().toISOString(),
        };
        this._saveApplied(actId, estudianteId, detalle);

        // Guardar el puntaje final transparente en Store.calificaciones
        Views.Evaluacion.saveGrade(actId, estudianteId, scaled, parseFloat(maxPts));

        // Refrescamos la vista de fondo silenciosamente
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        if (act) {
            EvalGrader.openRubricaGrading(actId);
        }
    },

    verDetalle(actId, estudianteId) {
        const act = (Store.get('actividades') || []).find(a => a.id === actId);
        const applied = this._getApplied(actId, estudianteId);
        if (!applied) return;
        let rubrica = act.rubricaPersonalizada;
        if (!rubrica) rubrica = (Store.get('rubricas') || []).find(r => r.id === applied.rubricaId);
        const student = (Store.get('estudiantes') || []).find(s => s.id === estudianteId);
        if (!rubrica) return;

        const criterios = rubrica.criterios || [];

        UI.modal(`📊 Resultado de Evaluación`, `
            <div style="padding: 10px 0;">
              <div style="display:flex; align-items:center; gap:16px; margin-bottom:24px; background:#f8fafc; padding:16px; border-radius:16px; border: 1.5px solid #e2e8f0;">
                <div style="width:48px; height:48px; border-radius:50%; background: #0f172a; display: grid; place-items: center; font-weight: 900; color: #fff; font-size: 20px;">
                    ${student.nombreCompleto.charAt(0)}
                </div>
                <div>
                  <div style="font-size:16px; font-weight:900; color:#0f172a;">${student.nombreCompleto}</div>
                  <div style="font-size:12px; color:#64748b; font-weight:600;">Evaluación detallada por rúbrica</div>
                </div>
              </div>

              <table style="width:100%; border-collapse:separate; border-spacing: 0; font-size:13px; margin-bottom:24px;">
                <thead>
                  <tr>
                    <th style="padding:12px 16px; text-align:left; border-bottom:2px solid #e2e8f0; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">Criterio</th>
                    <th style="padding:12px 16px; text-align:left; border-bottom:2px solid #e2e8f0; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">Nivel Alcanzado</th>
                    <th style="padding:12px 16px; text-align:right; border-bottom:2px solid #e2e8f0; color:#64748b; font-weight:800; text-transform:uppercase; letter-spacing:0.04em;">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  ${criterios.map(c => {
                      const nivelId = (applied.criterios || {})[c.id];
                      const levelObj = c.niveles?.find(n => n.id === nivelId);
                      return `<tr>
                        <td style="padding:16px; border-bottom:1px solid #f1f5f9; font-weight:800; color:#0f172a;">${c.nombre}</td>
                        <td style="padding:16px; border-bottom:1px solid #f1f5f9;">
                          <span style="display:inline-block; padding:4px 12px; border-radius:8px; background:rgba(124,58,237,0.08); color:#7c3aed; font-weight:800; font-size:12px;">
                            ${levelObj?.nombre || 'No evaluado'}
                          </span>
                        </td>
                        <td style="padding:16px; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:900; color:#0f172a; font-size:15px;">
                          ${levelObj?.valor ?? '-'}
                        </td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>

              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:24px; border-radius:20px; color:#fff; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 10px 20px -5px rgba(15,23,42,0.3);">
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span style="font-weight:800; font-size:12px; opacity:0.7; text-transform:uppercase; letter-spacing:0.08em;">Total Final Escala</span>
                    <span style="font-size:13px; font-weight:600; opacity:0.6;">Conversión automática de rúbrica</span>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-weight:900; font-size:36px; color:#00C853;">${applied.total}</span>
                    <span style="font-size:16px; opacity:0.5; font-weight:700;">pts</span>
                  </div>
              </div>
            </div>
        `);
    },

    verRubricaSoloLectura(rubricaId, actId) {
        let r;
        if (actId) {
            const act = (Store.get('actividades') || []).find(a => a.id === actId);
            if (act && act.rubricaPersonalizada) r = act.rubricaPersonalizada;
        }
        if (!r) r = (Store.get('rubricas') || []).find(x => x.id === rubricaId);
        if (!r) return;
        const criterios = r.criterios || [];
        const niveles = (criterios[0]?.niveles || r.niveles || []).map((n, idx) => ({
            id: n.id || n.levelId,
            nombre: n.nombre
        }));
        
        let previousModal = document.querySelector('.modal');
        let prevDisplay = previousModal ? previousModal.style.display : '';
        if(previousModal) previousModal.style.display = 'none';

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay open';
        overlay.style.zIndex = '99999'; 
        
        overlay.innerHTML = `
            <div class="modal" style="max-width:900px;">
                <div class="modal-header">
                    <h3 style="margin:0; font-size:16px;">🧩 ${r.nombre}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove(); document.querySelector('.modal').style.display='${prevDisplay}'">×</button>
                </div>
                <div class="modal-body" style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;font-size:12px">
                        <thead>
                          <tr style="background:#f8fafc">
                            <th style="padding:10px;text-align:left;border:1px solid #e2e8f0;font-weight:800;width:150px;">Criterio</th>
                            ${niveles.map(n => `<th style="padding:10px;border:1px solid #e2e8f0;font-weight:800;text-align:center">${n.nombre}</th>`).join('')}
                          </tr>
                        </thead>
                        <tbody>
                          ${criterios.map(c => `<tr>
                            <td style="padding:10px;border:1px solid #e2e8f0;font-weight:700">${c.nombre} <br><span style="font-size:10px;color:#7c3aed;font-weight:800;">(Máx: ${c.peso} pts)</span></td>
                            ${niveles.map((n, ni) => {
                                const levelObj = c.niveles?.find(l => l.id === n.id || l.nombre === n.nombre) || c.niveles?.[ni];
                                const desc = levelObj?.descriptor || (c.descripciones || {})[n.id] || '';
                                const puntos = levelObj ? parseFloat(levelObj.valor || 0) : 0;
                                return `<td style="padding:10px;border:1px solid #e2e8f0;color:#475569;line-height:1.4">
                                    <div style="font-weight:800;font-size:11px;color:#7c3aed;margin-bottom:4px;">${puntos} pts</div>
                                    <div>${desc}</div>
                                </td>`;
                            }).join('')}
                          </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove(); document.querySelector('.modal').style.display='${prevDisplay}'">Aceptar</button>
                    <button class="btn btn-primary" onclick="CompartirRubrica.abrir('${r.id}'); this.closest('.modal-overlay').remove();">Compartir</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
};

// ----------------------------------------------------------------
//  COMPARTIR RÚBRICA
// ----------------------------------------------------------------
window.CompartirRubrica = {
    abrir(rubricaId) {
        const r = (Store.get('rubricas') || []).find(x => x.id === rubricaId);
        if (!r) return;
        const criterios = (r.criterios || []).map(c => `  • ${c.nombre}`).join('\n');
        const texto = `📘 *Rúbrica: ${r.nombre}*\n\nPuntaje total: ${r.maxPuntos || '?'} puntos\n\n*Criterios:*\n${criterios}\n\n_Instrucción: Revise esta rúbrica antes de entregar su trabajo._`;
        
        UI.modal('Compartir Rúbrica', `
            <div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px; padding:14px;font-family:monospace;font-size:12px;white-space:pre-wrap;color:#334155;margin-bottom:16px;max-height:200px;overflow-y:auto">${texto}</div>
              <div style="display:flex;gap:10px">
                <button onclick="CompartirRubrica._copiar()" class="btn btn-secondary" style="flex:1">📋 Copiar texto</button>
                <button onclick="CompartirRubrica._whatsapp('${encodeURIComponent(texto)}')" style="flex:1;padding:10px 16px;border:none;border-radius:8px;background:#25D366;color:#fff;font-weight:800;cursor:pointer;font-size:13px">📲 WhatsApp</button>
              </div>
            </div>
        `);
        this._textoActual = texto;
    },
    _textoActual: '',
    _copiar() {
        navigator.clipboard.writeText(this._textoActual).then(() => UI.toast('Copiado al portapapeles', 'success'));
    },
    _whatsapp(encoded) {
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
};

console.log('[EvalSmart] Módulo Inteligente Cargado ✅');

// =============================================================
//  ACTIVIDADES EXTRAORDINARIAS (MÓDULO COMPLEMENTARIO)
// =============================================================
(function patchActividadesExtraordinarias() {
    if (typeof Views === 'undefined' || !Views.Evaluacion) {
        setTimeout(patchActividadesExtraordinarias, 200);
        return;
    }

    // Hook Views.Evaluacion.render to attach ACTIVIDADES EXTRAORDINARIAS section
    const _origRender = Views.Evaluacion.render;
    Views.Evaluacion.render = function() {
        let html = _origRender.call(this);
        const c = Store.getActiveCourse();
        if (!c) return html;

        const parciales = Store.getParcialByCourse(c.id);
        parciales.forEach(parcial => {
            const extraSetting = Store.getExtraordinarySettings(c.centroEducativo, Store.data.configAcademica?.anioLectivo, parcial.id);
            if (extraSetting.enabled === false) return;

            const extraActs = Store.getExtraordinaryActivities(c.id, parcial.id);
            const totalExtraActs = extraActs.length;

            // Calculate auto-updated stats
            const allRecords = (Store.data.activity_bonus_records || []).filter(r => {
                const act = extraActs.find(a => a.id === r.extraordinary_activity_id);
                return !!act && r.participated !== false;
            });

            const totalPointsAwarded = allRecords.reduce((sum, r) => sum + (Number(r.points_awarded) || 0), 0);
            const benefitedStudentIds = new Set(allRecords.filter(r => (Number(r.points_awarded) || 0) > 0).map(r => r.student_id));
            const benefitedStudentsCount = benefitedStudentIds.size;

            const extraSection = `
                <!-- Tarjeta de Actividades Extraordinarias con Estilo de Dimensión de Evaluación -->
                <div class="card hover-lift" style="background: #f5f3ff; border: 1.5px solid #c7d2fe; border-radius: 18px; margin-bottom: 0; cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 8px rgba(0,0,0,0.03);" 
                     onclick="Views.Evaluacion.renderParcialActividadesExtraordinarias('${parcial.id}')"
                     onmouseover="this.style.boxShadow='0 8px 24px rgba(79, 70, 229, 0.28)'; this.style.transform='translateY(-3px)'; var b=this.querySelector('.dim-icon-badge'); if(b) b.style.transform='scale(1.1) rotate(4deg)';"
                     onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.03)'; this.style.transform='translateY(0)'; var b=this.querySelector('.dim-icon-badge'); if(b) b.style.transform='scale(1) rotate(0deg)';">
                    <div class="card-b" style="padding: 18px 18px 16px 18px; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; text-align: center;">
                        
                        <!-- Fila Superior: Badge Puntos Extras e Icono Insignia Moderno y Definido -->
                        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 6px;">
                            <span style="background: #e0e7ff; color: #3730a3; font-size: 10px; font-weight: 850; padding: 3px 10px; border-radius: 20px; border: 1px solid #c7d2fe; letter-spacing: 0.02em;">
                                Puntos Extras
                            </span>
                            <div class="dim-icon-badge" style="width: 44px; height: 44px; border-radius: 13px; background: #ffffff; border: 1.5px solid #c7d2fe; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.22), 0 1px 3px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: center; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
                                <i data-lucide="award" style="width: 22px; height: 22px; color: #4f46e5; stroke-width: 2.3;"></i>
                            </div>
                        </div>
                        
                        <div style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; width: 100%;">
                            <h5 style="color: #3730a3; font-size: 15.5px; font-weight: 850; margin: 4px 0 12px; line-height: 1.25; min-height: 38px; display: flex; align-items: center; justify-content: center;">
                                Actividades Extraordinarias
                            </h5>
                            
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%;">
                                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.85); padding: 4px 12px; border-radius: 20px; border: 1px solid #c7d2fe; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                                    <i data-lucide="clipboard-list" style="width: 13px; height: 13px; color: #4f46e5;"></i>
                                    <span style="font-size: 12.5px; font-weight: 700; color: #3730a3;">${totalExtraActs} <span style="font-size: 9.5px; color: #6366f1; font-weight: 500;">act.</span></span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 800; color: #4f46e5; margin-top: 2px;">
                                    <span>Gestionar</span>
                                    <i data-lucide="arrow-right" style="width: 13px; height: 13px;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const targetStr = `id="dims-${parcial.id}"`;
            const targetIdx = html.indexOf(targetStr);
            if (targetIdx !== -1) {
                const gridEndStr = '</div>\n                                        </div>';
                const endGridIdx = html.indexOf(gridEndStr, targetIdx);
                if (endGridIdx !== -1) {
                    html = html.substring(0, endGridIdx) + extraSection + html.substring(endGridIdx);
                } else {
                    const fallbackIdx = html.indexOf('</div>', targetIdx + targetStr.length);
                    if (fallbackIdx !== -1) {
                        html = html.substring(0, fallbackIdx) + extraSection + html.substring(fallbackIdx);
                    }
                }
            }
        });

        return html;
    };

    Views.Evaluacion.ensureDefaultExtraordinaryActivities = function(courseId, parcialId) {
        return Store.getExtraordinaryActivities(courseId, parcialId);
    };

    Views.Evaluacion.clearAllExtraordinaryActivities = function(parcialId) {
        UI.confirm('¿Vaciar todas las actividades extraordinarias de este parcial?', 'Se eliminarán todas las actividades extraordinarias creadas para este parcial y los puntos asignados. Esta acción no se puede deshacer.', () => {
            const c = Store.getActiveCourse();
            if (!c) return;
            const acts = Store.getExtraordinaryActivities(c.id, parcialId);
            acts.forEach(a => Store.deleteExtraordinaryActivity(a.id));
            Store.save();
            UI.toast('Actividades extraordinarias vaciadas correctamente', 'info');
            Views.Evaluacion.renderParcialActividadesExtraordinarias(parcialId);
        });
    };

    // Navegación de retorno desde Actividades Extraordinarias a Cuadro Controlador con guardado seguro
    Views.Evaluacion.volverDeActividadesExtraordinarias = function(parcialId) {
        try {
            Store.save();
            if (window.UI && UI.toast) {
                UI.toast('Actividades extraordinarias guardadas con éxito ✓ Regresando...', 'success');
            }
        } catch(e) {
            console.error('[volverDeActividadesExtraordinarias] Error al guardar:', e);
        }
        Router.navigate('cuadro');
    };

    // Pantalla Principal: Planilla Acumulativa de Actividades Extraordinarias por Parcial
    Views.Evaluacion.renderParcialActividadesExtraordinarias = function(parcialId) {
        const c = Store.getActiveCourse();
        if (!c) return;
        const parcial = Store.get('parciales').find(p => p.id === parcialId);
        if (!parcial) {
            UI.toast('Parcial no encontrado', 'error');
            Router.navigate('cuadro');
            return;
        }

        // El usuario requiere iniciar 100% sin sugerencias ni columnas precreadas.
        // Se limpian todas las actividades que no hayan sido creadas explícitamente por el usuario.
        if (Store.data.extraordinary_activities && Array.isArray(Store.data.extraordinary_activities)) {
            const initialLen = Store.data.extraordinary_activities.length;
            Store.data.extraordinary_activities = Store.data.extraordinary_activities.filter(a => a.isUserCreated === true);
            if (Store.data.extraordinary_activities.length !== initialLen) {
                Store.save();
            }
        }

        const extraActs = Store.getExtraordinaryActivities(c.id, parcialId);
        const students = Store.getStudentsByCourse(c.id) || [];

        const allRecords = (Store.data.activity_bonus_records || []).filter(r => {
            const act = extraActs.find(a => a.id === r.extraordinary_activity_id);
            return !!act && r.participated !== false;
        });

        const totalPointsAwarded = allRecords.reduce((sum, r) => sum + (Number(r.points_awarded) || 0), 0);
        const benefitedStudentIds = new Set(allRecords.filter(r => (Number(r.points_awarded) || 0) > 0).map(r => r.student_id));
        const benefitedStudentsCount = benefitedStudentIds.size;

        const html = `
            <!-- Navegación y Acciones Superiores -->
            <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <button class="btn btn-sm" onclick="Views.Evaluacion.volverDeActividadesExtraordinarias('${parcialId}')" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 800; border-radius: 10px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; border: none; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35); padding: 8px 16px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(234, 88, 12, 0.45)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 12px rgba(234, 88, 12, 0.35)';">
                        <i data-lucide="check-circle-2" style="width: 15px; height: 15px; color: #ffffff;"></i>
                        <span>Guardar y Volver a Cuadro Controlador</span>
                    </button>
                    <div style="width: 1px; height: 16px; background: var(--border-soft);" class="hide-mobile"></div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 13px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">${parcial.nombre}</span>
                        <i data-lucide="chevron-right" style="width: 12px; height: 12px; color: var(--text-muted);"></i>
                        <span style="font-size: 13px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">ACTIVIDADES EXTRAORDINARIAS (ACUMULATIVO)</span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="btn" style="background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; font-weight: 800; box-shadow: 0 4px 14px rgba(79,70,229,0.3); display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px;" onclick="Views.Evaluacion.openExtraordinaryItemModal('${parcialId}')">
                        <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i> Agregar Actividad / Seguimiento
                    </button>
                </div>
            </div>

            <!-- Encabezado Institucional con Tarjeta Resumen -->
            <div class="card" style="background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%); border: 1.5px solid #c7d2fe; border-radius: var(--radius-lg); margin-bottom: 20px;">
                <div class="card-b" style="padding: 20px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="background: #4f46e5; color: white; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; box-shadow: 0 6px 16px rgba(79,70,229,0.35);">
                                <i data-lucide="layers" style="width: 24px; height: 24px;"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; color: #3730a3; font-size: 19px; font-weight: 900;">ACTIVIDADES EXTRAORDINARIAS</h3>
                                <p style="margin: 2px 0 0; font-size: 12.5px; color: #4338ca; font-weight: 500;">
                                    Registro acumulativo de actividades institucionales. Puede editar nombres, modificar puntajes máximos o eliminar opciones.
                                </p>
                            </div>
                        </div>

                        <div style="background: white; padding: 6px 14px; border-radius: 20px; border: 1px solid #c7d2fe; font-size: 11.5px; font-weight: 800; color: #3730a3;">
                            ${c.centroEducativo || 'Centro Educativo'} &bull; ${c.asignatura} (${c.grado} "${c.seccion}")
                        </div>
                    </div>

                    <!-- Indicadores en Encabezado -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
                        <div style="background: white; padding: 12px 16px; border-radius: 12px; border: 1px solid #c7d2fe; display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #e0e7ff; color: #4338ca; display: grid; place-items: center;">
                                <i data-lucide="clipboard-list" style="width: 16px; height: 16px;"></i>
                            </div>
                            <div>
                                <div style="font-size: 10px; font-weight: 800; color: #6366f1; text-transform: uppercase;">Actividades activas</div>
                                <div style="font-size: 16px; font-weight: 900; color: #3730a3;">${extraActs.length} opciones</div>
                            </div>
                        </div>

                        <div style="background: white; padding: 12px 16px; border-radius: 12px; border: 1px solid #c7d2fe; display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #e0e7ff; color: #4338ca; display: grid; place-items: center;">
                                <i data-lucide="award" style="width: 16px; height: 16px;"></i>
                            </div>
                            <div>
                                <div style="font-size: 10px; font-weight: 800; color: #6366f1; text-transform: uppercase;">Puntos otorgados</div>
                                <div style="font-size: 16px; font-weight: 900; color: #3730a3;">+${totalPointsAwarded} pts</div>
                            </div>
                        </div>

                        <div style="background: white; padding: 12px 16px; border-radius: 12px; border: 1px solid #c7d2fe; display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; border-radius: 8px; background: #e0e7ff; color: #4338ca; display: grid; place-items: center;">
                                <i data-lucide="users" style="width: 16px; height: 16px;"></i>
                            </div>
                            <div>
                                <div style="font-size: 10px; font-weight: 800; color: #6366f1; text-transform: uppercase;">Estudiantes beneficiados</div>
                                <div style="font-size: 16px; font-weight: 900; color: #3730a3;">${benefitedStudentsCount} alumnos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- PLANILLA ACUMULATIVA DE REGISTRO (MATRIZ INTERACTIVA) -->
            <div class="card">
                <div class="card-h" style="padding: 14px 20px; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="table" style="width: 16px; color: #4f46e5;"></i> MATRIZ ACUMULATIVA DE REGISTRO
                    </div>
                    ${extraActs.length > 0 ? `
                        <button class="btn btn-sm" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-weight: 700; padding: 6px 14px; border-radius: 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;" title="Vaciar todas las actividades extraordinarias de este parcial" onclick="Views.Evaluacion.clearAllExtraordinaryActivities('${parcialId}')">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Vaciar Todo
                        </button>
                    ` : ''}
                </div>
                    ${extraActs.length === 0 ? `
                        <div style="padding: 40px 20px; text-align: center; background: white; border: 2px dashed #c7d2fe; border-radius: 16px;">
                            <div style="width: 56px; height: 56px; background: #e0e7ff; color: #4f46e5; border-radius: 16px; display: grid; place-items: center; margin: 0 auto 16px;">
                                <i data-lucide="plus-circle" style="width: 28px; height: 28px;"></i>
                            </div>
                            <h4 style="font-size: 17px; font-weight: 800; color: #3730a3; margin: 0 0 8px;">No hay actividades extraordinarias creadas</h4>
                            <p style="font-size: 13px; color: #64748b; margin: 0 0 20px; max-width: 480px; margin-left: auto; margin-right: auto; line-height: 1.5;">Crea y personaliza tus actividades extraordinarias (visitas a museos, cine, incentivos, etc.) para asignar puntos extras sobre 100 a tus estudiantes.</p>
                            <button class="btn" style="background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; font-weight: 800; padding: 10px 22px; border-radius: 12px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(79,70,229,0.3);" onclick="Views.Evaluacion.openExtraordinaryItemModal('${parcialId}')">
                                <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i> Agregar Actividad / Seguimiento
                            </button>
                        </div>
                    ` : `
                    <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; position: relative;">
                    <table style="width: 100%; min-width: ${Math.max(680, 280 + extraActs.length * 150 + 110)}px; border-collapse: separate; border-spacing: 0; font-size: 13px;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="position: sticky; left: 0; z-index: 10; background: #f8fafc; padding: 12px 6px; font-weight: 800; color: #475569; text-align: center; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; width: 44px; min-width: 44px;">N°</th>
                                <th style="position: sticky; left: 44px; z-index: 10; background: #f8fafc; padding: 12px 14px; font-weight: 800; color: #475569; text-align: left; border-bottom: 2px solid #e2e8f0; border-right: 2px solid #e2e8f0; width: 220px; min-width: 200px; max-width: 240px; box-shadow: 2px 0 5px rgba(0,0,0,0.03);">Nombre del Estudiante</th>
                                ${extraActs.map(act => `
                                    <th style="padding: 10px 8px; font-weight: 800; color: #3730a3; text-align: center; border-bottom: 2px solid #c7d2fe; min-width: 140px; background: #f5f3ff;">
                                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                            <span style="font-size: 12px; font-weight: 900; color: #1e1b4b; line-height: 1.2; white-space: normal; word-break: break-word;" title="${act.name}">${act.name}</span>
                                            <span style="font-size: 10px; font-weight: 800; color: #4f46e5; background: #e0e7ff; padding: 1px 8px; border-radius: 12px;">Máx: ${act.maximum_points} pts</span>
                                            
                                            <!-- Acciones en Encabezado de Columna: Asignar Todo, Editar y Eliminar -->
                                            <div style="display: flex; gap: 3px; margin-top: 4px; flex-wrap: wrap; justify-content: center;">
                                                <button class="btn btn-sm" style="padding: 2px 6px; border-radius: 6px; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; font-size: 10px; font-weight: 800; white-space: nowrap;" title="Asignar la misma nota a todo el grupo" onclick="Views.Evaluacion.applyMassScoreToActivity('${parcialId}', '${act.id}', ${act.maximum_points})">
                                                    👥 Todo el Grupo
                                                </button>
                                                <button class="btn btn-sm" style="padding: 2px 6px; border-radius: 6px; background: white; color: #4f46e5; border: 1px solid #c7d2fe; font-size: 10px;" title="Editar Actividad / Puntaje" onclick="Views.Evaluacion.openExtraordinaryItemModal('${parcialId}', '${act.id}')">
                                                    ✏️
                                                </button>
                                                <button class="btn btn-sm" style="padding: 2px 6px; border-radius: 6px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; font-size: 10px;" title="Eliminar Opción" onclick="Views.Evaluacion.deleteExtraordinaryActivity('${act.id}', '${parcialId}')">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </th>
                                `).join('')}
                                <th style="position: sticky; right: 0; z-index: 10; padding: 12px 10px; font-weight: 900; color: #fff; text-align: center; border-bottom: 2px solid #4338ca; border-left: 2px solid #818cf8; width: 110px; min-width: 110px; background: #4f46e5; box-shadow: -2px 0 5px rgba(0,0,0,0.05);">TOTAL EXTRAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map((s, idx) => {
                                let studentTotalExtra = 0;
                                const cellsHtml = extraActs.map(act => {
                                    const rec = (Store.data.activity_bonus_records || []).find(r => r.extraordinary_activity_id === act.id && r.student_id === s.id);
                                    const pts = rec && rec.participated !== false ? (Number(rec.points_awarded) || 0) : '';
                                    if (pts !== '') studentTotalExtra += Number(pts);

                                    return `
                                        <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; text-align: center; vertical-align: middle; background: ${pts > 0 ? '#f5f3ff' : 'transparent'};">
                                            <input type="number" 
                                                   value="${pts}"
                                                   min="0"
                                                   max="${act.maximum_points}"
                                                   step="any"
                                                   placeholder="-"
                                                   class="followup-input"
                                                   style="width: 70px; height: 32px; text-align: center; font-weight: 800; font-size: 13px; color: #3730a3; border: 1.5px solid ${pts > 0 ? '#818cf8' : '#cbd5e1'}; border-radius: 8px; outline: none; background: white;"
                                                   onfocus="this.select(); this.style.borderColor='#4f46e5';"
                                                   onblur="this.style.borderColor='${pts > 0 ? '#818cf8' : '#cbd5e1'}';"
                                                   onchange="Views.Evaluacion.saveExtraordinaryScore('${act.id}', '${s.id}', this.value, ${act.maximum_points}, '${parcialId}')">
                                        </td>
                                    `;
                                }).join('');

                                return `
                                    <tr style="transition: background 0.15s;" onmouseover="this.querySelectorAll('td').forEach(t=>t.style.backgroundColor='#f8fafc');" onmouseout="this.querySelectorAll('td').forEach(t=>t.style.backgroundColor='');">
                                        <td style="position: sticky; left: 0; z-index: 5; background: #ffffff; padding: 8px 6px; text-align: center; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b;">${idx + 1}</td>
                                        <td style="position: sticky; left: 44px; z-index: 5; background: #ffffff; padding: 8px 14px; border-bottom: 1px solid #e2e8f0; border-right: 2px solid #e2e8f0; font-weight: 800; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; box-shadow: 2px 0 5px rgba(0,0,0,0.03);" title="${s.nombreCompleto}">${s.nombreCompleto}</td>
                                        ${cellsHtml}
                                        <td style="position: sticky; right: 0; z-index: 5; padding: 8px 10px; text-align: center; border-bottom: 1px solid #c7d2fe; border-left: 2px solid #c7d2fe; font-weight: 900; font-size: 14px; color: #3730a3; background: #e0e7ff; box-shadow: -2px 0 5px rgba(0,0,0,0.05);" id="extra-total-${s.id}">
                                            +${studentTotalExtra} pts
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    </div>
                    `}
                    <div style="padding: 14px 20px; background: #f8fafc; border-top: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-bottom-left-radius: var(--radius-lg); border-bottom-right-radius: var(--radius-lg);">
                        <div style="font-size: 12.5px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="shield-check" style="width: 16px; height: 16px; color: #16a34a;"></i>
                            <span>Los puntajes ingresados se sincronizan automáticamente con el Cuadro Controlador.</span>
                        </div>
                        <button class="btn" onclick="Views.Evaluacion.volverDeActividadesExtraordinarias('${parcialId}')" style="background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 800; padding: 9px 18px; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(16,185,129,0.25); font-size: 13px; border: none; cursor: pointer;">
                            <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i>
                            Guardar y Volver a Cuadro Controlador
                        </button>
                    </div>
                </div>
            </div>
        `;

        const contEl = document.getElementById('content');
        if (contEl) {
            contEl.innerHTML = html;
            if (window.lucide) window.lucide.createIcons();
        }
    };

    // Guardar puntaje directo en la celda de la planilla acumulativa
    Views.Evaluacion.saveExtraordinaryScore = function(actId, studentId, value, maxPts, parcialId) {
        const val = parseFloat(value);
        if (value !== '' && (isNaN(val) || val < 0 || val > maxPts)) {
            UI.toast(`El puntaje debe ser entre 0 y ${maxPts}`, 'error');
            Views.Evaluacion.renderParcialActividadesExtraordinarias(parcialId);
            return;
        }

        const ptsAwarded = value === '' ? 0 : val;
        const recordObj = {
            extraordinary_activity_id: actId,
            student_id: studentId,
            points_awarded: ptsAwarded,
            participated: value !== '' && ptsAwarded > 0,
            observation: ''
        };

        Store.saveActivityBonusRecord(recordObj);

        // Actualizar total en la fila
        const c = Store.getActiveCourse();
        if (c) {
            const newTotal = Store.getStudentExtraordinaryPoints(studentId, c.id, parcialId);
            const totalEl = document.getElementById(`extra-total-${studentId}`);
            if (totalEl) {
                totalEl.textContent = `+${newTotal} pts`;
            }
        }
    };

    // Modal para Editar una opción existente o Agregar una nueva actividad/seguimiento
    Views.Evaluacion.openExtraordinaryItemModal = function(parcialId, actId = null) {
        const c = Store.getActiveCourse();
        if (!c) return;
        const extraActs = Store.getExtraordinaryActivities(c.id, parcialId);
        const actToEdit = actId ? extraActs.find(a => a.id === actId) : null;
        const isEdit = !!actToEdit;

        const html = `
            <form id="extraordinary-item-form" autocomplete="off" onsubmit="event.preventDefault(); Views.Evaluacion.saveExtraordinaryItemForm('${parcialId}', '${actId || ''}')">
                <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px;">
                    <div class="form-group">
                        <label class="form-label" style="font-weight: 800; color: #0f172a;">Nombre de la Actividad / Opción *</label>
                        <input type="text" name="name" class="form-control" required value="${actToEdit?.name || ''}" placeholder="Ej.: Visita al Museo, Concurso de Oratoria, etc." autocomplete="off" style="border-radius: 8px; font-weight: 700;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                        <div class="form-group">
                            <label class="form-label" style="font-weight: 800; color: #0f172a;">Puntaje Máximo *</label>
                            <input type="number" name="maximum_points" class="form-control" required min="0.5" max="50" step="0.5" value="${actToEdit?.maximum_points || 5}" autocomplete="off" style="font-weight: 800; color: #4f46e5; border-radius: 8px;">
                        </div>

                        <div class="form-group">
                            <label class="form-label" style="font-weight: 800; color: #0f172a;">Fecha</label>
                            <input type="date" name="activity_date" class="form-control" value="${actToEdit?.activity_date || new Date().toISOString().split('T')[0]}" autocomplete="off" style="border-radius: 8px;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" style="font-weight: 800; color: #0f172a;">Descripción / Observación</label>
                        <input type="text" name="description" class="form-control" value="${actToEdit?.description || ''}" placeholder="Detalles pedagógicos u observaciones..." autocomplete="off" style="border-radius: 8px;">
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
                        <button type="button" class="btn btn-secondary" onclick="UI.closeModal()">Cancelar</button>
                        <button type="submit" class="btn" style="background: #4f46e5; color: white; font-weight: 900; padding: 10px 22px; border-radius: 10px; box-shadow: 0 4px 14px rgba(79,70,229,0.3);">
                            <i data-lucide="check-circle" style="width: 16px; margin-right: 6px;"></i> Guardar Cambios
                        </button>
                    </div>
                </div>
            </form>
        `;

        UI.modal(isEdit ? 'Editar Actividad / Opción' : 'Agregar Nueva Actividad / Seguimiento', html);
        if (window.lucide) window.lucide.createIcons();
    };

    Views.Evaluacion.saveExtraordinaryItemForm = function(parcialId, actId) {
        const c = Store.getActiveCourse();
        if (!c) return;
        const form = document.getElementById('extraordinary-item-form');
        if (!form) return;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (!data.name || !data.maximum_points) {
            return UI.toast('Por favor completa todos los campos requeridos', 'error');
        }

        const maxPts = parseFloat(data.maximum_points);
        if (isNaN(maxPts) || maxPts <= 0) {
            return UI.toast('El puntaje máximo debe ser mayor que 0', 'error');
        }

        const actObj = {
            id: actId || ('act_extra_' + parcialId + '_' + Utils.id()),
            center_id: c.centroEducativo || 'default_center',
            academic_year: Store.data.configAcademica?.anioLectivo || new Date().getFullYear(),
            partial_id: parcialId,
            course_id: c.id,
            subject_id: c.asignatura,
            teacher_id: Store.data.perfilDocente?.nombre || 'Docente',
            name: data.name,
            category: 'Institucional',
            activity_date: data.activity_date || '',
            maximum_points: maxPts,
            eval_type: 'directa',
            assignment_mode: 'group',
            description: data.description || '',
            general_observation: '',
            status: 'ACTIVA',
            isUserCreated: true
        };

        Store.saveExtraordinaryActivity(actObj);
        UI.closeModal();
        UI.toast(actId ? 'Actividad actualizada' : 'Actividad agregada exitosamente', 'success');

        Views.Evaluacion.renderParcialActividadesExtraordinarias(parcialId);
    };

    // Confirmación y Eliminación de una opción
    Views.Evaluacion.deleteExtraordinaryActivity = function(actId, parcialId) {
        UI.confirm('¿Eliminar esta actividad extraordinaria?', 'Se eliminarán los puntos asignados a los estudiantes en esta actividad. Esta acción no se puede deshacer.', () => {
            Store.deleteExtraordinaryActivity(actId);
            Store.save();
            UI.toast('Actividad extraordinaria eliminada', 'info');
            Views.Evaluacion.renderParcialActividadesExtraordinarias(parcialId);
        });
    };

    // PANTALLA: ASIGNACIÓN DE PUNTOS
    Views.Evaluacion.renderAsignacionPuntos = function(parcialId, activityId) {
        const c = Store.getActiveCourse();
        if (!c) return;
        const act = (Store.data.extraordinary_activities || []).find(a => a.id === activityId);
        if (!act) {
            UI.toast('Actividad no encontrada', 'error');
            Views.Evaluacion.renderParcialActividadesExtraordinarias(parcialId);
            return;
        }

        const students = Store.getStudentsByCourse(c.id);
        const records = Store.getActivityBonusRecords(activityId);

        const html = `
            <!-- Encabezado de Navegación -->
            <div style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button class="btn btn-sm btn-secondary" onclick="Views.Evaluacion.renderParcialActividadesExtraordinarias('${parcialId}')">
                        <i data-lucide="arrow-left" style="width:14px"></i> Volver a Actividades
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="Views.Evaluacion.volverDeActividadesExtraordinarias('${parcialId}')" title="Guardar y volver a Cuadro Controlador">
                        <i data-lucide="layout-grid" style="width:14px; color:#2563eb;"></i> Cuadro Controlador
                    </button>
                    <div style="width: 1px; height: 16px; background: var(--border-soft);"></div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 13px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">ASIGNACIÓN DE PUNTOS</span>
                        <i data-lucide="chevron-right" style="width: 12px; height: 12px; color: var(--text-muted);"></i>
                        <span style="font-size: 13px; font-weight: 900; color: #4f46e5;">${act.name}</span>
                    </div>
                </div>
            </div>

            <!-- Banner Resumen de la Actividad -->
            <div class="card" style="background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%); border: 1.5px solid #c7d2fe; border-radius: var(--radius-lg); margin-bottom: 24px;">
                <div class="card-b" style="padding: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="background: #4f46e5; color: white; width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center;">
                            <i data-lucide="check-square" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #3730a3; font-size: 18px; font-weight: 900;">${act.name}</h3>
                            <p style="margin: 3px 0 0; font-size: 12px; color: #4338ca; font-weight: 600;">
                                Categoría: <strong>${act.category}</strong> &bull; Fecha: <strong>${act.activity_date}</strong> &bull; Puntaje Máximo: <strong>${act.maximum_points} pts</strong>
                            </p>
                        </div>
                    </div>

                    <div style="display: flex; items-center; gap: 10px;">
                        <span style="background: white; color: #3730a3; border: 1px solid #c7d2fe; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 20px;">
                            Matrícula: ${students.length} estudiantes
                        </span>
                    </div>
                </div>
            </div>

            <!-- Barra de Acciones Masivas y Tabla de Matrícula -->
            <div class="card">
                <div class="card-h" style="padding: 16px 20px; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="font-size: 13px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="sliders" style="width: 16px; color: #4f46e5;"></i> Acciones Masivas:
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-secondary" onclick="Views.Evaluacion.batchSelectAllExtraordinary(true)">
                            <i data-lucide="check-circle-2" style="width: 13px;"></i> Seleccionar todos
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="Views.Evaluacion.batchSelectAllExtraordinary(false)">
                            <i data-lucide="circle" style="width: 13px;"></i> Deseleccionar todos
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="Views.Evaluacion.batchApplyScoreExtraordinary(${act.maximum_points})">
                            <i data-lucide="copy" style="width: 13px;"></i> Aplicar mismo puntaje (${act.maximum_points} pts)
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="Views.Evaluacion.batchClearScoreExtraordinary()">
                            <i data-lucide="eraser" style="width: 13px;"></i> Limpiar puntajes
                        </button>
                    </div>
                </div>

                <div class="card-b" style="padding: 0;">
                    <form id="extraordinary-assignment-form" onsubmit="event.preventDefault(); Views.Evaluacion.saveAsignacionPuntosSubmit('${parcialId}', '${activityId}')">
                        <div style="max-height: 520px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <thead>
                                    <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left; position: sticky; top: 0; z-index: 5;">
                                        <th style="padding: 12px 14px; width: 50px; text-align: center;">N°</th>
                                        <th style="padding: 12px 14px;">Nombre del Estudiante</th>
                                        <th style="padding: 12px 14px; width: 100px; text-align: center;">Participó</th>
                                        <th style="padding: 12px 14px; width: 150px; text-align: center;">Puntaje Obtenido (Max ${act.maximum_points})</th>
                                        <th style="padding: 12px 14px;">Observación</th>
                                        <th style="padding: 12px 14px; width: 80px; text-align: center;">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${students.map((st, idx) => {
                                        const rec = records.find(r => r.student_id === st.id);
                                        const participated = rec ? rec.participated !== false : (act.assignment_mode === 'group');
                                        const pts = rec ? rec.points_awarded : (participated ? act.maximum_points : '');
                                        const obs = rec ? rec.individual_observation || '' : '';

                                        return `
                                            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                                                <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
                                                <td style="padding: 10px 14px; font-weight: 800; color: #0f172a;">${st.nombreCompleto}</td>
                                                <td style="padding: 10px 14px; text-align: center;">
                                                    <input type="checkbox" class="extra-part-check" data-sid="${st.id}" ${participated ? 'checked' : ''} onchange="Views.Evaluacion.handlePartCheckChange(this, ${act.maximum_points})" style="width: 18px; height: 18px; cursor: pointer; accent-color: #4f46e5;">
                                                </td>
                                                <td style="padding: 10px 14px; text-align: center;">
                                                    <input type="number" class="form-control extra-pts-input" data-sid="${st.id}" min="0" max="${act.maximum_points}" step="0.5" value="${pts}" placeholder="0" onchange="Views.Evaluacion.validateExtraScoreInput(this, ${act.maximum_points})" style="text-align: center; font-weight: 900; color: #4f46e5; height: 36px; border-radius: 8px;">
                                                </td>
                                                <td style="padding: 10px 14px;">
                                                    <input type="text" class="form-control extra-obs-input" data-sid="${st.id}" value="${obs}" placeholder="Observación individual opcional..." style="height: 36px; font-size: 12px; border-radius: 8px;">
                                                </td>
                                                <td style="padding: 10px 14px; text-align: center;">
                                                    <button type="button" class="btn btn-sm" style="padding: 4px 8px; background: #f1f5f9; color: #64748b;" title="Limpiar fila" onclick="Views.Evaluacion.clearRowExtraordinary('${st.id}')">
                                                        <i data-lucide="x" style="width: 14px;"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Pie de Guardar -->
                        <div style="padding: 16px 24px; background: #f8fafc; border-top: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                            <div style="font-size: 12px; color: #64748b; font-weight: 600;">
                                <i data-lucide="shield-check" style="width: 14px; display: inline; vertical-align: -2px; color: #10b981;"></i> Los cambios quedan guardados con registro de auditoría (usuario, fecha y hora).
                            </div>
                            
                            <div style="display: flex; gap: 12px;">
                                <button type="button" class="btn btn-secondary" onclick="Views.Evaluacion.renderParcialActividadesExtraordinarias('${parcialId}')">Cancelar</button>
                                <button type="submit" class="btn" style="background: linear-gradient(135deg, #4f46e5, #4338ca); color: white; font-weight: 900; padding: 10px 24px; border-radius: 12px; box-shadow: 0 4px 14px rgba(79,70,229,0.3); font-size: 14px;">
                                    <i data-lucide="save" style="width: 16px; margin-right: 6px;"></i> Guardar Puntos Asignados
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const contEl = document.getElementById('content');
        if (contEl) {
            contEl.innerHTML = html;
            if (window.lucide) window.lucide.createIcons();
        }
    };

    // Manejo de cambio en checkbox "Participó"
    Views.Evaluacion.handlePartCheckChange = function(chk, maxPts) {
        const sId = chk.dataset.sid;
        const ptsInp = document.querySelector(`.extra-pts-input[data-sid="${sId}"]`);
        if (ptsInp) {
            if (chk.checked) {
                if (!ptsInp.value || parseFloat(ptsInp.value) === 0) ptsInp.value = maxPts;
            } else {
                ptsInp.value = '0';
            }
        }
    };

    // Validación estricta de puntaje (No negativo, No mayor al máximo)
    Views.Evaluacion.validateExtraScoreInput = function(inp, maxPts) {
        let val = parseFloat(inp.value);
        if (isNaN(val) || val < 0) {
            UI.toast('No se permiten puntajes negativos', 'warning');
            inp.value = 0;
            val = 0;
        }
        if (val > maxPts) {
            UI.toast(`El puntaje no puede superar el máximo de ${maxPts} pts`, 'warning');
            inp.value = maxPts;
        }
    };

    // Acciones Masivas
    Views.Evaluacion.batchSelectAllExtraordinary = function(select) {
        document.querySelectorAll('.extra-part-check').forEach(chk => {
            chk.checked = select;
            chk.dispatchEvent(new Event('change'));
        });
    };

    Views.Evaluacion.batchApplyScoreExtraordinary = function(defaultMax) {
        const valStr = prompt(`Ingrese el puntaje a aplicar masivamente a los seleccionados (Max: ${defaultMax}):`, defaultMax);
        if (valStr === null) return;
        const val = parseFloat(valStr);
        if (isNaN(val) || val < 0 || val > defaultMax) {
            return UI.toast(`Puntaje inválido. Debe estar entre 0 y ${defaultMax}`, 'error');
        }

        document.querySelectorAll('.extra-part-check').forEach(chk => {
            if (chk.checked) {
                const sId = chk.dataset.sid;
                const ptsInp = document.querySelector(`.extra-pts-input[data-sid="${sId}"]`);
                if (ptsInp) ptsInp.value = val;
            }
        });
        UI.toast(`Puntaje ${val} aplicado masivamente`, 'info');
    };

    Views.Evaluacion.batchClearScoreExtraordinary = function() {
        document.querySelectorAll('.extra-pts-input').forEach(inp => inp.value = '');
        document.querySelectorAll('.extra-obs-input').forEach(inp => inp.value = '');
    };

    Views.Evaluacion.clearRowExtraordinary = function(studentId) {
        const chk = document.querySelector(`.extra-part-check[data-sid="${studentId}"]`);
        const pts = document.querySelector(`.extra-pts-input[data-sid="${studentId}"]`);
        const obs = document.querySelector(`.extra-obs-input[data-sid="${studentId}"]`);
        if (chk) chk.checked = false;
        if (pts) pts.value = '';
        if (obs) obs.value = '';
    };

    // Guardar Asignación de Puntos con Historial de Cambios / Auditoría
    Views.Evaluacion.saveAsignacionPuntosSubmit = function(parcialId, activityId) {
        const act = (Store.data.extraordinary_activities || []).find(a => a.id === activityId);
        if (!act) return;

        const chks = document.querySelectorAll('.extra-part-check');
        const ptsInps = document.querySelectorAll('.extra-pts-input');
        const obsInps = document.querySelectorAll('.extra-obs-input');

        const recordsToSave = [];

        chks.forEach(chk => {
            const sId = chk.dataset.sid;
            const ptsInp = Array.from(ptsInps).find(p => p.dataset.sid === sId);
            const obsInp = Array.from(obsInps).find(o => o.dataset.sid === sId);

            const isParticipated = chk.checked;
            const ptsVal = ptsInp ? parseFloat(ptsInp.value) || 0 : 0;
            const cappedPts = Math.min(Math.max(0, ptsVal), act.maximum_points);
            const obsVal = obsInp ? obsInp.value.trim() : '';

            recordsToSave.push({
                extraordinary_activity_id: activityId,
                student_id: sId,
                course_id: act.course_id,
                partial_id: parcialId,
                participated: isParticipated,
                points_awarded: isParticipated ? cappedPts : 0,
                individual_observation: obsVal
            });
        });

        Store.saveBatchActivityBonusRecords(activityId, recordsToSave);
        UI.toast('Puntos asignados y registrados con éxito', 'success');
        Views.Evaluacion.renderParcialActividadesExtraordinarias(parcialId);
    };

    // Guardar calificación directa desde la celda del Cuadro Controlador
    Views.Evaluacion.saveExtraordinaryScoreDirect = function(studentId, courseId, partialId, valInput) {
        let pts = parseFloat(valInput);
        if (isNaN(pts) || pts < 0) pts = 0;

        let acts = Store.getExtraordinaryActivities(courseId, partialId);
        if (!acts || acts.length === 0) {
            if (pts === 0) return;
            const actName = prompt('Ingrese el nombre de la actividad extraordinaria a crear:', 'Puntos Extras');
            if (!actName || !actName.trim()) return;

            const c = Store.getActiveCourse();
            const now = new Date().toISOString().split('T')[0];
            const newAct = {
                id: 'act_extra_' + partialId + '_' + Utils.id(),
                center_id: c ? c.centroEducativo : 'default_center',
                academic_year: Store.data.configAcademica?.anioLectivo || new Date().getFullYear(),
                partial_id: partialId,
                course_id: courseId,
                subject_id: c ? c.asignatura : 'General',
                teacher_id: Store.data.perfilDocente?.nombre || 'Docente',
                name: actName.trim(),
                category: 'Institucional',
                activity_date: now,
                maximum_points: Math.max(10, Math.ceil(pts)),
                eval_type: 'directa',
                assignment_mode: 'group',
                description: 'Actividad personalizada acumulativa de puntos extras',
                general_observation: '',
                status: 'ACTIVA'
            };
            Store.saveExtraordinaryActivity(newAct);
            acts = [newAct];
        }
        const primaryAct = acts[0];
        if (!primaryAct) return;

        const maxAllowed = Number(primaryAct.maximum_points) || 100;
        const cappedPts = Math.min(pts, maxAllowed);

        const recordObj = {
            extraordinary_activity_id: primaryAct.id,
            student_id: studentId,
            course_id: courseId,
            partial_id: partialId,
            participated: cappedPts > 0,
            points_awarded: cappedPts,
            individual_observation: ''
        };

        Store.saveActivityBonusRecord(recordObj);
    };

    // Asignar misma nota a todo el grupo en una actividad específica
    Views.Evaluacion.applyMassScoreToActivity = function(parcialId, actId, maxPts) {
        const valStr = prompt(`Ingrese la nota a asignar a TODO EL GRUPO para esta actividad (Máx: ${maxPts} pts):`, maxPts);
        if (valStr === null) return;
        const val = parseFloat(valStr);
        if (isNaN(val) || val < 0) {
            return UI.toast('Por favor ingrese un puntaje válido.', 'error');
        }
        const capped = Math.min(val, maxPts);
        const c = Store.getActiveCourse();
        if (!c) return;
        const students = Store.getStudentsByCourse(c.id) || [];

        const records = students.map(s => ({
            extraordinary_activity_id: actId,
            student_id: s.id,
            course_id: c.id,
            partial_id: parcialId,
            participated: capped > 0,
            points_awarded: capped,
            individual_observation: ''
        }));

        Store.saveBatchActivityBonusRecords(actId, records);
        UI.toast(`Se asignaron +${capped} pts a todos los ${students.length} estudiantes del grupo`, 'success');
        Views.Evaluacion.renderParcialActividadesExtraordinarias(parcialId);
    };

    // Modal de Historial de Auditoría
    Views.Evaluacion.openAuditHistoryModal = function(activityId) {
        const act = (Store.data.extraordinary_activities || []).find(a => a.id === activityId);
        if (!act) return;

        const history = act.audit_history || [];

        const html = `
            <div style="padding: 6px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; background: #f5f3ff; border: 1px solid #c7d2fe; padding: 12px 16px; border-radius: 12px;">
                    <div style="width: 40px; height: 40px; background: #4f46e5; color: white; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;">
                        <i data-lucide="history" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 15px; font-weight: 900; color: #3730a3;">Historial de Auditoría &bull; ${act.name}</h4>
                        <p style="margin: 2px 0 0; font-size: 11.5px; color: #4338ca;">Registro de modificaciones e interacciones del módulo</p>
                    </div>
                </div>

                ${history.length === 0 ? `
                    <p style="text-align: center; color: #64748b; font-size: 12px; padding: 20px 0;">No se registran eventos de auditoría adicionales.</p>
                ` : `
                    <div style="max-height: 320px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; text-align: left;">
                                    <th style="padding: 10px;">Acción</th>
                                    <th style="padding: 10px;">Usuario</th>
                                    <th style="padding: 10px;">Fecha</th>
                                    <th style="padding: 10px;">Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(h => `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 8px 10px; font-weight: 800; color: #4f46e5;">${h.action}</td>
                                        <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">${h.user}</td>
                                        <td style="padding: 8px 10px; color: #64748b;">${h.date}</td>
                                        <td style="padding: 8px 10px; color: #64748b;">${h.time}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}

                <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                    <button class="btn btn-secondary" onclick="UI.closeModal()">Cerrar</button>
                </div>
            </div>
        `;

        UI.modal('Historial de Auditoría', html);
        if (window.lucide) window.lucide.createIcons();
    };

    // Modal de Detalle para el Cuadro Controlador
    Views.Evaluacion.openExtraordinaryDetailModal = function(studentId, courseId, partialId) {
        const student = Store.data.estudiantes.find(e => e.id === studentId);
        if (!student) return;
        const details = Store.getStudentExtraordinaryRecords(studentId, courseId, partialId);
        const total = details.reduce((sum, d) => sum + d.points, 0);

        const html = `
            <div style="padding: 6px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; background: #f5f3ff; border: 1px solid #c7d2fe; padding: 12px 16px; border-radius: 12px;">
                    <div style="width: 40px; height: 40px; background: #4f46e5; color: white; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;">
                        <i data-lucide="calendar-check" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 15px; font-weight: 900; color: #3730a3;">${student.nombreCompleto}</h4>
                        <p style="margin: 2px 0 0; font-size: 11.5px; color: #4338ca;">Detalle de Actividades Extraordinarias &bull; Total Acumulado: <strong>+${total} pts</strong></p>
                    </div>
                </div>

                ${details.length === 0 ? `
                    <p style="text-align: center; color: #64748b; font-size: 12px; padding: 20px 0;">No registra puntos en actividades extraordinarias para este período.</p>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 10px; max-height: 340px; overflow-y: auto;">
                        ${details.map(d => `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${d.activity.name}</div>
                                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                                        Categoría: <strong>${d.activity.category}</strong> &bull; Fecha: ${d.activity.activity_date}
                                    </div>
                                    ${d.record && d.record.individual_observation ? `<div style="font-size: 11px; color: #4f46e5; margin-top: 4px; font-style: italic;">Obs: "${d.record.individual_observation}"</div>` : ''}
                                </div>
                                <div style="font-size: 15px; font-weight: 900; color: #4f46e5; background: #e0e7ff; border: 1px solid #c7d2fe; padding: 4px 12px; border-radius: 8px;">
                                    +${d.points} pts
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}

                <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                    <button class="btn btn-secondary" onclick="UI.closeModal()">Cerrar</button>
                </div>
            </div>
        `;

        UI.modal('Detalle de Actividades Extraordinarias', html);
        if (window.lucide) window.lucide.createIcons();
    };
})();





