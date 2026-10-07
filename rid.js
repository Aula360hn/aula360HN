/**
 * Repositorio Institucional Docente (RID)
 * Aula 360 HN - Offline First PWA Addon
 */

window.RID = (function () {

    const DB_SETTINGS = 'GDHN_RID_SETTINGS';
    const DB_DRAFTS = 'GDHN_RID_DRAFTS';
    const DB_HISTORY = 'GDHN_RID_HISTORY';

    let state = {
        settings: {},
        drafts: [],
        history: [],
        currentDoc: null,
        ui: { filter: 'all', search: '' }
    };

    const SEQUENCES = {
        "RID_CIRCULAR": { "prefix": "CIR", "pad": 3, "pattern": "{{prefix}}-{{seq}}-{{center.sace}}-{{year}}-DCE" },
        "RID_CONVOCATORIA": { "prefix": "CONVC", "pad": 3, "pattern": "{{prefix}}-{{seq}}-{{center.sace}}-{{year}}-DCE" },
        "RID_OFICIO": { "prefix": "OF", "pad": 3, "pattern": "{{prefix}}-{{seq}}-{{center.sace}}-{{year}}-DCE" },
        "RID_PERMISO": { "prefix": "PERM", "pad": 3, "pattern": "{{prefix}}-{{seq}}-{{center.sace}}-{{year}}" },
        "RID_SOLICITUD": { "prefix": "SO", "pad": 3, "pattern": "{{prefix}}-{{seq}}-{{center.sace}}-{{year}}" },
        "RID_REVERSION": { "prefix": "SOLC", "pad": 5, "pattern": "{{prefix}}-{{seq}}-{{centerOrDdeCode}}-{{year}}" },
        "RID_ACTA_REUNION": { "prefix": "ACTA", "pad": 3, "pattern": "{{prefix}}-{{seq}}-{{center.sace}}-{{year}}" },
        "RID_TOMP_DME": { "prefix": "TOMP", "pad": 4, "pattern": "{{prefix}}-{{seq}}-{{dme.code}}-{{year}}" },
        "RID_TOMP_CE": { "prefix": "TOMP", "pad": 3, "pattern": "{{prefix}}-{{seq}}-{{center.sace}}-{{year}}" }
    };

    const TEMPLATES = [
        {
            id: "RID_CIRCULAR",
            name: "Circular (Centro Educativo)",
            category: "Comunicaciones",
            icon: "megaphone",
            sequenceRef: "RID_CIRCULAR",
            fields: [
                { key: "placeFull", label: "Lugar", type: "text", required: true, autofill: "center.placeFull" },
                { key: "dateLong", label: "Fecha", type: "text", required: true, autofill: "now.dateLong" },
                { key: "code", label: "Correlativo", type: "readonly", required: true, autogenerate: "RID_CIRCULAR" },
                { key: "subject", label: "ASUNTO", type: "text", required: true },
                { key: "to", label: "Dirigido a", type: "text", required: true, default: "Personal Docente y Administrativo" },
                { key: "greeting", label: "Saludo", type: "text", required: true, default: "Estimados compañeros:" },
                { key: "body", label: "Cuerpo", type: "textarea", required: true, default: "Por este medio me dirijo a ustedes con el propósito de informarles sobre las nuevas directrices y actividades correspondientes al presente período en nuestro amado centro educativo. Solicitamos su valiosa colaboración para el cumplimiento de las metas institucionales trazadas." },
                { key: "closing", label: "Cierre", type: "text", required: true, default: "Sin otro particular, agradeciendo de antemano su incansable atención y colaboración." },
                { key: "directorName", label: "Firma (Nombre)", type: "text", required: true, autofill: "center.directorName" },
                { key: "directorRoleLine", label: "Cargo (línea)", type: "text", required: true, default: "Director (a) {{center.name}}" },
                { key: "anexos", label: "ANEXOS", type: "textarea", required: false, placeholder: "Separados por salto de linea" },
                { key: "cc", label: "Cc", type: "text", required: true, default: "Archivo" }
            ],
            textTemplate: "{{placeFull}}; {{dateLong}}\nASUNTO: {{subject}}\n{{to}}\n{{greeting}}\n{{body}}\n{{closing}}\nAtentamente,\n________\n*{{directorName}}*\n*{{directorRoleLine}}*\nDirección\n{{anexosListHtml}}\nCc: {{cc}}",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_CONVOCATORIA",
            name: "Convocatoria",
            category: "Comunicaciones",
            icon: "users",
            sequenceRef: "RID_CONVOCATORIA",
            fields: [
                { key: "code", label: "Correlativo", type: "readonly", required: true, autogenerate: "RID_CONVOCATORIA" },
                { key: "dateLong", label: "Fecha", type: "text", required: true, autofill: "now.dateLong" },
                { key: "placeFull", label: "Lugar", type: "text", required: true, autofill: "center.placeFull" },
                { key: "to", label: "Dirigido a", type: "text", required: true, default: "A los padres de familia:" },
                {
                    key: "intro", label: "Introducción", type: "select", required: true,
                    options: [
                        { value: "Estimado padre/madre de familia:\nAl iniciar el presente período académico, el centro educativo ha establecido metas, lineamientos de trabajo y criterios de evaluación que orientarán el desempeño del grado durante el año. Consideramos fundamental que las familias conozcan estos aspectos, ya que el acompañamiento desde el hogar fortalece significativamente el proceso formativo de sus hijos(as).\nPor tal razón, se le convoca a una reunión donde se socializará esta información y se establecerán acuerdos que permitan trabajar de manera coordinada y responsable.", label: "Inicio de período académico" },
                        { value: "Estimado padre/madre de familia:\nConcluido el proceso de evaluación correspondiente, es necesario revisar el rendimiento académico del grado y analizar los avances y dificultades identificadas. La participación de la familia en este momento es clave para reforzar logros y atender oportunamente las áreas que requieren mejora.\nSe le convoca a una reunión donde se presentarán los resultados y se definirán acciones conjuntas de acompañamiento.", label: "Entrega y análisis de calificaciones" },
                        { value: "Estimado padre/madre de familia:\nDurante el desarrollo de los contenidos se han identificado dificultades en algunos aprendizajes esenciales. Con el propósito de prevenir rezagos mayores y fortalecer el desempeño académico, el centro educativo ha planificado estrategias de recuperación que requieren apoyo familiar.\nSe le convoca a una reunión para explicar el plan de trabajo y establecer compromisos que favorezcan el progreso del estudiante.", label: "Recuperación académica" },
                        { value: "Estimado padre/madre de familia:\nLa asistencia constante y la puntualidad son factores determinantes en el éxito académico y en la formación de hábitos de responsabilidad. En el transcurso del período se ha observado irregularidad en la asistencia de algunos estudiantes, lo cual impacta directamente en su rendimiento.\nPor ello, se le convoca a una reunión para dialogar sobre esta situación y acordar medidas que garanticen mayor compromiso y continuidad en el proceso educativo.", label: "Asistencia y puntualidad" },
                        { value: "Estimado padre/madre de familia:\nEn las últimas semanas se han presentado situaciones que requieren reforzar valores como el respeto, la responsabilidad y la sana convivencia dentro del grupo. El centro educativo considera necesario abordar estos aspectos de manera preventiva y formativa.\nSe le convoca a una reunión donde se analizarán los antecedentes y se establecerán acuerdos que contribuyan a un ambiente de aprendizaje más armonioso.", label: "Convivencia y disciplina" },
                        { value: "Nos preparamos para participar en una actividad institucional que requiere coordinación y apoyo familiar. En esta reunión definiremos tareas, tiempos y responsabilidades para asegurar una participación organizada y exitosa.", label: "Proyecto o actividad institucional – Enfoque organizativo" },
                        { value: "Las actividades cívicas y culturales fortalecen la identidad y el sentido de pertenencia. Les invitamos a coordinar aspectos logísticos y participación estudiantil, de manera que el grado represente dignamente a nuestra institución.", label: "Actividades cívicas y culturales – Enfoque formativo" },
                        { value: "Previo a la salida pedagógica programada, es necesario reunirnos para explicar objetivos formativos, medidas de seguridad y responsabilidades, asegurando una experiencia organizada y segura para todos.", label: "Gira pedagógica – Enfoque informativo y seguro" },
                        { value: "Conscientes de la importancia del bienestar estudiantil, realizaremos una reunión para compartir orientaciones preventivas y coordinar acciones que fortalezcan la salud del grupo.", label: "Salud y prevención – Enfoque comunitario" },
                        { value: "Para mantener orden y coherencia con el reglamento institucional, sostendremos una reunión donde recordaremos lineamientos sobre presentación personal y resolveremos inquietudes al respecto.", label: "Presentación personal y normativa – Enfoque institucional" }
                    ],
                    default: "Estimado padre/madre de familia:\nAl iniciar el presente período académico, el centro educativo ha establecido metas, lineamientos de trabajo y criterios de evaluación que orientarán el desempeño del grado durante el año. Consideramos fundamental que las familias conozcan estos aspectos, ya que el acompañamiento desde el hogar fortalece significativamente el proceso formativo de sus hijos(as).\nPor tal razón, se le convoca a una reunión donde se socializará esta información y se establecerán acuerdos que permitan trabajar de manera coordinada y responsable."
                },
                { key: "eventPlace", label: "Lugar (evento)", type: "text", required: true, autofill: "center.placeFull" },
                { key: "eventLocal", label: "Local", type: "text", required: true, autofill: "center.name" },
                { key: "eventDateText", label: "Fecha (texto)", type: "text", required: true },
                { key: "eventTimeText", label: "Hora (texto)", "type": "text", required: true },
                { key: "closing", label: "Cierre", type: "text", required: true, default: "Esperando contar con su presencia." },
                { key: "directorName", label: "Firma (Nombre)", type: "text", required: true, autofill: "center.directorName" },
                { key: "directorRoleLine", label: "Cargo (línea)", type: "text", required: true, default: "Director (a) {{center.name}}" },
                { key: "cc", label: "Cc", type: "text", required: true, default: "Archivo" }
            ],
            textTemplate: "CONVOCATORIA\n{{dateLong}}, {{placeFull}}\n{{to}}\n{{intro}}\nLugar:     {{eventPlace}}\nLocal:     {{eventLocal}}\nFecha:   {{eventDateText}}\nHora:      {{eventTimeText}}\n{{closing}}\nAtentamente,\n{{directorName}}\n{{directorRoleLine}}\nDirección\nCc: {{cc}}",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_OFICIO",
            name: "Oficio",
            category: "Gestión Administrativa",
            icon: "file-text",
            sequenceRef: "RID_OFICIO",
            fields: [
                { key: "placeFull", label: "Lugar", type: "text", required: true, autofill: "center.placeFull" },
                { key: "dateLong", label: "Fecha", type: "text", required: true, autofill: "now.dateLong" },
                { key: "code", label: "Correlativo", type: "readonly", required: true, autogenerate: "RID_OFICIO" },
                { key: "subject", label: "ASUNTO", type: "text", required: true },
                { key: "recipientName", label: "Destinatario (Nombre)", type: "text", required: true },
                { key: "recipientRole", label: "Destinatario (Cargo)", type: "text", required: true },
                { key: "greeting", label: "Saludo", type: "text", required: true, default: "Estimado licenciado:" },
                { key: "body", label: "Cuerpo", type: "textarea", required: true, default: "Sirva la presente comunicación para saludarle y desearle el mayor de los éxitos en el desempeño de sus loables labores diarias. El motivo de este oficio es comunicarle cordialmente las recientes determinaciones tomadas por nuestra dirección, las cuales se implementarán en favor de toda nuestra comunidad educativa." },
                { key: "closing", label: "Cierre", type: "text", required: true, default: "Sin otro particular de momento, agradeciendo siempre su deferente y pronta atención." },
                { key: "directorName", label: "Firma (Nombre)", type: "text", required: true, autofill: "center.directorName" },
                { key: "directorRoleLine", label: "Cargo (línea)", type: "text", required: true, default: "Director (a) {{center.name}}" },
                { key: "anexos", label: "ANEXOS", type: "textarea", required: false, placeholder: "Separados por salto de linea" },
                { key: "cc", label: "Cc", type: "text", required: true, default: "Archivo" }
            ],
            textTemplate: "{{placeFull}}; {{dateLong}}\n*ASUNTO: {{subject}}*\n\n*{{recipientName}}*\n*{{recipientRole}}*\n\n{{greeting}}\n{{body}}\n{{closing}}\nAtentamente,\n________\n*{{directorName}}*\n*{{directorRoleLine}}*\nDirección\n{{anexosListHtml}}\nCc: {{cc}}",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_PERMISO",
            name: "Permiso (Director a DME)",
            category: "Gestión Administrativa",
            icon: "clock",
            sequenceRef: "RID_PERMISO",
            fields: [
                { key: "placeFull", label: "Lugar", type: "text", required: true, autofill: "center.placeFull" },
                { key: "dateLong", label: "Fecha", type: "text", required: true, autofill: "now.dateLong" },
                { key: "code", label: "Correlativo", type: "readonly", required: true, autogenerate: "RID_PERMISO" },
                { key: "centerName", label: "Centro Educativo", type: "readonly", required: true, autofill: "center.name" },
                { key: "subject", label: "ASUNTO", type: "text", required: true, default: "Solicitud de permiso por asuntos personales" },
                { key: "authorityName", label: "Autoridad (Nombre)", type: "text", required: true, autofill: "dme.directorName" },
                { key: "authorityRole", label: "Autoridad (Cargo)", type: "text", required: true, default: "Directora Municipal de Educación" },
                { key: "authorityOffice", label: "Dependencia", type: "text", required: true, default: "Dirección Municipal de Educación" },
                { key: "authorityPlace", label: "Lugar autoridad", type: "text", required: true, autofill: "center.municipioDepto" },
                { key: "greeting", label: "Saludo", type: "text", required: true, default: "Estimada licenciada:" },
                { key: "requestedDayText", label: "Día solicitado (texto)", type: "text", required: true, placeholder: "ej. 05 de mayo" },
                { key: "reason", "label": "Motivo", "type": "text", "required": true, default: "atender asuntos personales ineludibles y de carácter urgente" },
                { key: "directorName", "label": "Solicitante (Nombre)", "type": "text", "required": true, "autofill": "center.directorName" },
                { key: "directorRole", "label": "Cargo solicitante", "type": "text", "required": true, "default": "Director (a) de Centro Educativo" },
                { key: "vbName", "label": "V°. B° (Nombre)", "type": "text", "required": false, "autofill": "dme.directorName" },
                { key: "vbRole", "label": "V°. B° (Cargo)", "type": "text", "required": false, "default": "Directora Municipal de Educación" },
                { key: "cc", label: "Cc", type: "text", required: true, default: "Archivo" }
            ],
            textTemplate: "{{placeFull}}; {{dateLong}}\n*{{centerName}}*\n*ASUNTO: {{subject}}*\n\n*{{authorityName}}*\n*{{authorityRole}}*\n*{{authorityOffice}}*\n*{{authorityPlace}}*\n\n{{greeting}}\nA través del presente documento oficial, me dirijo a usted con el mayor de los respetos para solicitarle, de la manera más atenta, se me pueda conceder el permiso respectivo para ausentarme de mis labores el día {{requestedDayText}} del presente año. El motivo fundamental por el cual tramito esta petición es para {{reason}}.\nAgradeciendo de antemano su amable comprensión, gestión inmediata y aprobación favorable a nuestra solicitud.\nAtentamente,\n________\n*{{directorName}}*\n*{{directorRole}}*\nDirección\n\n________\n*V°. B° {{vbName}}*\n*{{vbRole}}*\n\nCc: {{cc}}",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_OFICIO_MATRICULA",
            name: "Oficio (Solicitud Matrícula)",
            category: "Comunicaciones",
            icon: "file-box",
            sequenceRef: "RID_OFICIO",
            fields: [
                { key: "placeFull", label: "Lugar", type: "text", required: true, autofill: "center.placeFull" },
                { key: "dateLong", label: "Fecha", type: "text", required: true, "autofill": "now.dateLong" },
                { key: "code", label: "Correlativo", type: "readonly", required: true, autogenerate: "RID_OFICIO" },
                { key: "subject", label: "ASUNTO", type: "text", required: true, default: "Solicitud de matrícula de grado" },
                { key: "teacherName", label: "Destinatario Completo", type: "text", required: true },
                { key: "teacherLastName", label: "Apellido para Saludo", type: "text", required: true },
                { key: "cycleOrGrade", label: "Grado/Ciclo", type: "text", required: true, default: "Tercer Ciclo" },
                { key: "deliveryDateText", label: "Día de entrega", type: "text", required: true, placeholder: "ej. martes 10 de febrero" },
                { key: "directorName", label: "Firma (Nombre)", type: "text", required: true, autofill: "center.directorName" },
                { key: "directorRoleLine", label: "Cargo (línea)", type: "text", required: true, default: "Director (a) {{center.name}}" },
                { key: "cc", label: "Cc", type: "text", required: true, default: "Archivo" }
            ],
            textTemplate: "{{placeFull}}; {{dateLong}}\n\n*ASUNTO: {{subject}}*\n\n*Lic. {{teacherName}}*\n*Docente {{cycleOrGrade}}*\n\nEstimado licenciado {{teacherLastName}}:\n\nCon el objetivo de brindar el informe de matrícula inicial del centro educativo, del correspondiente año, a la Dirección Municipal de Educación, le solicito la matrícula del {{cycleOrGrade}}, en el formato adjunto, misma que deberá entregar a la dirección de este centro educativo el día {{deliveryDateText}}.\n\nSin otro particular, agradeciendo su atención a la presente.\n\nAtentamente,\n\n________\n*{{directorName}}*\n*{{directorRoleLine}}*\nDirección\n\n*ANEXOS:*\n1. Formato de Matrícula\n\n*Cc: {{cc}}*",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_SOLICITUD",
            name: "Solicitud (General)",
            category: "Gestión Administrativa",
            icon: "send",
            sequenceRef: "RID_SOLICITUD",
            fields: [
                { key: "placeFull", label: "Lugar", type: "text", required: true, autofill: "center.placeFull" },
                { key: "dateLong", label: "Fecha", type: "text", required: true, autofill: "now.dateLong" },
                { key: "code", label: "Correlativo", type: "readonly", required: true, autogenerate: "RID_SOLICITUD" },
                { key: "centerName", label: "Centro Educativo", "type": "readonly", required: true, autofill: "center.name" },
                { key: "subject", label: "ASUNTO", type: "text", required: true },
                { key: "recipientName", label: "Destinatario (Nombre)", type: "text", required: true },
                { key: "recipientRole", label: "Cargo", type: "text", required: true },
                { key: "recipientOrg", "label": "Institución", type: "text", required: true },
                { key: "recipientPlace", "label": "Lugar institución", type: "text", required: true },
                { key: "greeting", label: "Saludo", type: "text", required: true, default: "Estimado señor(a):" },
                { key: "body", label: "Cuerpo", type: "textarea", required: true, default: "Reciba un cordial y afectuoso saludo desde nuestro centro educativo, deseándole el mayor de los éxitos en sus delicadas y dignas funciones diarias. El motivo central de la presente comunicación es acudir a sus competentes y reconocidos buenos oficios para solicitar amablemente su valiosa colaboración, misma que resultará de inmenso beneficio para todos los participantes de nuestra comunidad escolar y facilitará en gran medida nuestros procesos." },
                { key: "closing", label: "Cierre", type: "text", required: true, default: "Sin otro particular al cual hacer referencia, agradeciendo grandemente su voluntad, gestión y pronta respuesta favorable a nuestra solicitud." },
                { key: "directorName", label: "Firma (Nombre)", type: "text", required: true, autofill: "center.directorName" },
                { key: "directorRole", label: "Cargo", type: "text", required: true, default: "Director (a) de Centro Educativo" },
                { key: "anexos", label: "ANEXOS", type: "textarea", required: false },
                { key: "cc", label: "Cc", type: "text", required: true, default: "Archivo" }
            ],
            textTemplate: "{{placeFull}}; {{dateLong}}\n*{{centerName}}*\n*ASUNTO: {{subject}}*\n\n*{{recipientName}}*\n*{{recipientRole}}*\n*{{recipientOrg}}*\n*{{recipientPlace}}*\n\n{{greeting}}\n{{body}}\n{{closing}}\nAtentamente,\n________\n*{{directorName}}*\n*{{directorRole}}*\nDirección\n{{anexosListHtml}}\nCc: {{cc}}",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_REVERSION",
            name: "Solicitud de reversión de periodo",
            category: "Gestión Administrativa",
            icon: "rotate-ccw",
            sequenceRef: "RID_REVERSION",
            fields: [
                { key: "placeShort", label: "Lugar", type: "text", required: true, autofill: "center.community" },
                { key: "dateShort", label: "Fecha (ej. 16 de febrero 2021)", type: "text", required: true, autofill: "now.dateLong" },
                { key: "subject", label: "Asunto", type: "text", required: true, default: "Solicitud de reversión de periodo SACE" },
                { key: "code", label: "Código", type: "readonly", required: true, autogenerate: "RID_REVERSION" },
                { key: "toName", label: "Para (Nombre)", type: "text", required: true },
                { key: "toRole", label: "Cargo", type: "text", required: true, default: "Coordinadora UDTI-DDEL" },
                { key: "fromName", label: "De (Nombre)", type: "text", required: true, autofill: "center.directorName" },
                { key: "fromRole", label: "Cargo", type: "text", required: true, default: "Director(a) C.E." },
                { key: "centerDisplay", "label": "Centro educativo (texto)", type: "text", required: true, autofill: "center.name" },
                { key: "centerCode", "label": "Código centro", "type": "text", required: true, autofill: "center.sace" },
                { key: "year", label: "Año a revertir", "type": "number", required: true, autofill: "now.year" }
            ],
            textTemplate: "{{placeShort}}; {{dateShort}}\n*ASUNTO: {{subject}}*\n\nPARA: {{toName}}\n{{toRole}}\n\nDE: {{fromName}}\n{{fromRole}} del centro educativo {{centerDisplay}}\n\nSaludos cordiales:\nPor medio de la presente, me dirijo a usted deseándole gran éxito en el desarrollo de sus importantes labores gerenciales. El propósito fundamental e imperioso de esta comunicación es solicitar de forma muy respetuosa que se proceda lo más pronto posible a revertir el periodo académico {{year}} en la plataforma virtual para el centro educativo {{centerDisplay}} con matrícula estatal bajo el código SACE {{centerCode}}, esto con la finalidad ineludible de poder completar oportunamente diversos procesos administrativos y académicos trascendentales que quedaron inconclusos temporalmente.\nTotalmente seguro de contar con el nivel de profesionalismo de su jefatura, agradezco sobradamente la suprema atención brindada a nuestro caso.\nRespetuosamente,\n\n________\n*Director del C.E.*\n\n________\n*V°B° Dirección Municipal*",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_CAMBIO_USUARIO_SACE",
            name: "Solicitud cambio de usuario SACE",
            category: "Gestión Administrativa",
            icon: "user-cog",
            sequenceRef: "RID_SOLICITUD",
            fields: [
                { key: "placeFull", label: "Lugar", type: "text", required: true, autofill: "center.placeFull" },
                { key: "dateLong", label: "Fecha", type: "text", required: true, autofill: "now.dateLong" },
                { key: "code", label: "Correlativo", type: "readonly", required: true, autogenerate: "RID_SOLICITUD" },
                { key: "centerName", label: "Centro Educativo", "type": "readonly", required: true, autofill: "center.name" },
                { key: "subject", label: "ASUNTO", type: "text", required: true, default: "Solicitud para cambio de usuario SACE" },
                { key: "recipientName", label: "Destinatario", type: "text", required: true },
                { key: "recipientRole", label: "Cargo", type: "text", required: true, default: "Coordinadora de Infotecnología" },
                { key: "recipientOrg", "label": "Institución", "type": "text", required: true, default: "Dirección Departamental de Educación" },
                { key: "recipientPlace", "label": "Lugar", "type": "text", required: true, autofill: "center.municipioDepto" },
                { key: "officeLine", label: "Su Oficina", "type": "text", required: true, default: "Su Oficina" },
                { key: "body", label: "Cuerpo", type: "textarea", required: true, default: "El motivo de la presente es para solicitarle el cambio de usuario y contraseña del {{centerName}} con código {{center.sace}}, de la comunidad de {{center.community}}, municipio de {{center.municipio}}, departamento de {{center.departamento}}, ya que por ley es necesario actualizarlo a mi nombre, como director(a) del centro educativo." },
                { key: "closing", label: "Cierre", type: "text", required: true, default: "Sin otro particular, agradeciendo su atención a la presente." },
                { key: "directorName", label: "Firma (Nombre)", type: "text", required: true, autofill: "center.directorName" },
                { key: "directorRole", label: "Cargo", type: "text", required: true, default: "Director (a) de Centro Educativo" },
                { key: "anexos", label: "ANEXOS", type: "textarea", required: false, default: "Constancia de Trabajo\nDocumentos personales\nAcuerdo de nombramiento" },
                { key: "cc", label: "Cc", type: "text", required: true, default: "Archivo" }
            ],
            textTemplate: "SOLICITUD\n{{placeFull}}; {{dateLong}}\n{{centerName}}\nASUNTO: {{subject}}\n{{recipientName}}\n{{recipientRole}}\n{{recipientOrg}}\n{{recipientPlace}}\n{{officeLine}}\nEstimado(a) licenciado(a):\n{{body}}\n{{closing}}\nAtentamente,\n{{directorName}}\n{{directorRole}}\nDirección\n{{anexosListHtml}}\nCc: {{cc}}",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_TOMP_DME",
            name: "Toma de posesión (DME)",
            category: "Actas y Registros",
            icon: "file-signature",
            sequenceRef: "RID_TOMP_DME",
            fields: [
                { key: "code", label: "Código", type: "readonly", required: true, autogenerate: "RID_TOMP_DME" },
                { key: "dmeName", label: "DME (Nombre)", "type": "text", required: true, default: "DIRECCIÓN MUNICIPAL DE EDUCACIÓN" },
                { key: "authorityRoleLine", label: "Línea autoridad", "type": "textarea", required: true, default: "La suscrita Directora Municipal de Educación del municipio de {{center.municipio}}, departamento de {{center.departamento}} en uso de las facultades que las leyes del ramo le confiere, a solicitud de parte interesada:" },
                { key: "teacherName", label: "Docente", "type": "text", required: true },
                { key: "teacherId", "label": "Identidad", "type": "text", "required": true },
                { key: "position", "label": "Cargo que asume", "type": "text", required: true },
                { key: "startEnd", "label": "Rango de fechas (texto)", "type": "text", "required": true, default: "del 01 DE FEBRERO AL 30 DE NOVIEMBRE" },
                { key: "year", "label": "Año", "type": "number", required: true, autofill: "now.year" },
                { key: "status", label: "Condición", "type": "text", required: true, default: "INTERINA" },
                { key: "issueText", "label": "Lugar y fecha de emisión (texto)", "type": "text", required: true, default: "en la ciudad de X a los Y días..." },
                { key: "authorityName", "label": "Nombre autoridad firma", "type": "text", required: true },
                { key: "authorityRole", "label": "Cargo firma", "type": "text", "required": true, default: "Directora Municipal de Educación" }
            ],
            textTemplate: "TOMA DE POSESIÓN\n{{dmeName}}\n{{authorityRoleLine}}\n\nHACE CONSTAR QUE:\nEl (la) docente, {{teacherName}}, con identidad {{teacherId}}, tomó posesión en el cargo de {{position}}, a partir del {{startEnd}}, de {{year}} en forma {{status}}.\nY para los fines que el (la) interesado (a) estime conveniente, se extiende la presente {{issueText}}.\n\nAtentamente,\n{{authorityName}}\n{{authorityRole}}\nDirección\nCc: Archivo",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_TOMP_CE",
            name: "Toma de posesión (Centro Educativo)",
            category: "Actas y Registros",
            icon: "file-signature",
            sequenceRef: "RID_TOMP_CE",
            fields: [
                { key: "code", label: "Código", "type": "readonly", required: true, autogenerate: "RID_TOMP_CE" },
                { key: "centerName", label: "Centro Educativo", "type": "readonly", required: true, autofill: "center.name" },
                { key: "authorityLine", label: "Línea autoridad", "type": "textarea", required: true, default: "El suscrito (a) Director (a) del Centro Educativo {{center.name}} de la comunidad de {{center.community}}, municipio de {{center.municipio}}, departamento de {{center.departamento}} en uso de las facultades que las leyes del ramo le confieren, a solicitud de parte interesada:" },
                { key: "teacherName", label: "Docente", "type": "text", required: true },
                { key: "teacherId", "label": "Identidad", "type": "text", "required": true },
                { key: "position", "label": "Cargo que asume", "type": "text", required: true },
                { key: "startEnd", "label": "Rango de fechas (texto)", "type": "text", "required": true, default: "del 01 DE FEBRERO AL 30 DE NOVIEMBRE" },
                { key: "year", "label": "Año", "type": "number", required: true, autofill: "now.year" },
                { key: "status", "label": "Condición", "type": "text", required: true, default: "INTERINA" },
                { key: "issueText", "label": "Lugar y fecha de emisión (texto)", "type": "text", required: true, default: "en la ciudad de X a los Y días..." },
                { key: "directorName", "label": "Nombre autoridad firma", "type": "text", required: true, autofill: "center.directorName" },
                { key: "directorRole", "label": "Cargo firma", "type": "text", required: true, default: "Director (a) de Centro Educativo" }
            ],
            textTemplate: "TOMA DE POSESIÓN\n{{centerName}}\n{{authorityLine}}\n\nHACE CONSTAR QUE:\nEl (la) docente, {{teacherName}}, con identidad {{teacherId}}, tomó posesión en el cargo de {{position}}, a partir del {{startEnd}}, de {{year}} en forma {{status}}.\nY para los fines que el (la) interesado (a) estime conveniente, se extiende la presente {{issueText}}.\n\nAtentamente,\n{{directorName}}\n{{directorRole}}\nDirección\nCc: Archivo",
            pdfTemplate: { format: "LETTER", htmlBind: "textTemplateToHtml", css: "defaultInstitutional" }
        },
        {
            id: "RID_ACTA_REUNION",
            name: "Acta de Reunión de Padres",
            category: "Actas y Registros",
            icon: "users",
            sequenceRef: "RID_ACTA_REUNION",
            hasTable: true,
            fields: [
                { key: "code", label: "Código", type: "readonly", required: true, autogenerate: "RID_ACTA_REUNION" },
                { key: "centerName", label: "Centro Educativo", type: "text", required: true, autofill: "center.name" },
                { key: "community", label: "Comunidad", type: "text", required: true, autofill: "center.community" },
                { key: "municipio", label: "Municipio", type: "text", required: true, autofill: "center.municipio" },
                { key: "departamento", label: "Departamento", type: "text", required: true, autofill: "center.departamento" },
                { key: "dateLong", label: "Fecha (texto)", type: "text", required: true, autofill: "now.dateLong" },
                { key: "startTime", label: "Hora de inicio", type: "text", required: true, default: "08:00 a.m." },
                { key: "endTime", label: "Hora de finalización", type: "text", required: true, default: "10:00 a.m." },
                { key: "gradeName", label: "Grado/Sección", type: "text", required: true, default: "Séptimo Grado" },
                { key: "yearText", label: "Año lectivo", type: "text", required: true, autofill: "now.year" },
                { key: "teacherName", label: "Nombre del Docente", type: "text", required: true, autofill: "center.directorName" }
            ],
            table: {
                schema: [
                    { key: "cargo", label: "CARGO", type: "text" },
                    { key: "name", label: "NOMBRE", type: "text" },
                    { key: "dni", label: "DNI", type: "text" },
                    { key: "phone", label: "TELÉFONO", type: "text" }
                ],
                defaultRows: [
                    { cargo: "Presidente(a):", name: "", dni: "", phone: "" },
                    { cargo: "Vicepresidente(a):", name: "", dni: "", phone: "" },
                    { cargo: "Secretario(a):", name: "", dni: "", phone: "" },
                    { cargo: "Tesorero(a):", name: "", dni: "", phone: "" },
                    { cargo: "Fiscal:", name: "", dni: "", phone: "" },
                    { cargo: "Vocal 1:", name: "", dni: "", phone: "" },
                    { cargo: "Vocal 2:", name: "", dni: "", phone: "" }
                ]
            },
            textTemplate: "ACTA DE REUNIÓN DE PADRES DE FAMILIA\nReunidos en el Centro Educativo {{centerName}}, ubicado en la comunidad de {{community}}, municipio de {{municipio}}, departamento de {{departamento}}, el día {{dateLong}}, siendo las {{startTime}}, se llevó a cabo la reunión de padres y madres de familia de {{gradeName}} correspondiente al año lectivo {{yearText}}, la cual se desarrolló en un ambiente de respeto y participación activa, finalizando a las {{endTime}}, dejando constancia del compromiso y disposición de los asistentes en favor del proceso educativo de sus hijos y en la cual se desarrolló la siguiente agenda:\n\n*AGENDA*\n1. Invocación a Dios\n2. Lectura y aprobación del acta anterior\n3. Lectura y aprobación de la agenda del día\n4. Recomendaciones generales para el año lectivo {{yearText}}\n5. Informe Económico {{yearText}}\n6. Organización del Comité de Apoyo del Grado\n7. Puntos varios\n8. Cierre\n\n1. Invocación a Dios\nLa reunión inició con una invocación a Dios, solicitando sabiduría, armonía y compromiso para el desarrollo del presente año escolar.\n\n2. Lectura y aprobación del acta anterior\nSe procedió a la lectura del acta anterior, la cual fue aprobada por unanimidad / mayoría, según constancia.\n\n3. Lectura y aprobación de la agenda\nSe dio lectura a la agenda propuesta, la cual fue aprobada por los presentes.\n\n4. Recomendaciones generales\nSe brindaron orientaciones sobre puntualidad, asistencia, disciplina, acompañamiento familiar, cumplimiento de tareas, uso responsable de dispositivos electrónicos y normas de convivencia.\n\n5. Informe Económico {{yearText}}\nSe presentó el informe económico correspondiente al inicio del año lectivo {{yearText}}, detallando ingresos, egresos y proyecciones para actividades académicas.\n\n6. Organización del Comité de Apoyo del Grado\nQuedando integrado de la siguiente manera:\n{{TABLE_MARKER}}\n\n7. Puntos varios\nSe abordaron inquietudes relacionadas con actividades del calendario escolar y organización del grado.\n\n8. Cierre\nNo habiendo más puntos que tratar, se dio por finalizada la reunión a las {{endTime}}, agradeciendo la presencia y compromiso de los padres de familia.\n\nFirman para constancia:\n{{SIGNATURES_ACTA}}",
            pdfTemplate: { format: "LETTER", htmlBind: "actaHtmlWithTable", css: "defaultInstitutional" }
        },
        {
            id: "RID_ASISTENCIA",
            name: "Listado de asistencia",
            category: "Actas y Registros",
            icon: "list-ordered",
            hasTable: true,
            fields: [
                { key: "header", label: "Encabezado", "type": "text", required: true, default: "LISTADO DE ASISTENCIA" },
                { key: "event", "label": "Evento", "type": "text", required: true },
                { key: "eventPlace", "label": "Lugar del evento", "type": "text", required: true, autofill: "center.name" },
                { key: "date", "label": "Fecha", "type": "text", required: true, autofill: "now.dateShort" }
            ],
            table: {
                schema: [
                    { key: "no", label: "No", type: "autoindex" },
                    { key: "name", label: "Nombre", type: "text" },
                    { key: "id", label: "No de identidad", type: "text" },
                    { key: "center", label: "Centro educativo", type: "text" },
                    { key: "phone", label: "Teléfono", "type": "text" }
                ]
            },
            textTemplate: "{{header}}\nListado de asistencia\nEvento: {{event}}    Lugar del evento: {{eventPlace}}   Fecha: {{date}}\n(La vista impresa contiene la tabla autogenerada para firmas)",
            pdfTemplate: { format: "LETTER", htmlBind: "attendanceHtmlWithTable", css: "attendanceTableLetter" }
        },
        {
            id: "RID_CONTROL_PERMISOS_DOCENTES",
            name: "Control de permisos docentes",
            category: "Actas y Registros",
            icon: "layout-grid",
            hasTable: true,
            fields: [
                { key: "title", label: "Título", type: "readonly", required: true, default: "CONTROL DE PERMISOS DOCENTES" },
                { key: "departamento", label: "DEPARTAMENTO", "type": "text", required: true, autofill: "center.departamento" },
                { key: "municipio", "label": "MUNICIPIO", "type": "text", required: true, autofill: "center.municipio" },
                { key: "centerName", label: "CENTRO EDUCATIVO", "type": "text", required: true, autofill: "center.name" },
                { key: "lugar", "label": "LUGAR", "type": "text", required: true, autofill: "center.community" },
                { key: "yearText", "label": "Año (texto)", "type": "text", required: true, autofill: "now.year" }
            ],
            table: {
                schema: [
                    { key: "no", label: "No", type: "autoindex" },
                    { key: "teacher", label: "NOMBRE DEL DOCENTE", "type": "text" },
                    { key: "observaciones", label: "Observaciones de Permisos", "type": "text" }
                ]
            },
            textTemplate: "CONTROL DE PERMISOS DOCENTES\nDEPARTAMENTO: {{departamento}}   MUNICIPIO: {{municipio}}\nCENTRO EDUCATIVO: {{centerName}}   LUGAR: {{lugar}}\nAño: {{yearText}}\n(La vista impresa contiene la matriz para el control)",
            pdfTemplate: { format: "LETTER", htmlBind: "matrixHtmlWithTable", css: "matrixTableLetter" }
        }
    ];

    function init() {
        const _s = localStorage.getItem(DB_SETTINGS);
        if (_s) state.settings = JSON.parse(_s);
        else {
            state.settings = { sequence: {} };
            for (let k in SEQUENCES) state.settings.sequence[k] = { next: 1 };
            saveSettings();
        }

        const _d = localStorage.getItem(DB_DRAFTS);
        if (_d) state.drafts = JSON.parse(_d);

        const _h = localStorage.getItem(DB_HISTORY);
        if (_h) state.history = JSON.parse(_h);
    }

    function saveSettings() { localStorage.setItem(DB_SETTINGS, JSON.stringify(state.settings)); }
    function saveHistory() { localStorage.setItem(DB_HISTORY, JSON.stringify(state.history)); }

    function resolveAutofill(path) {
        if (!path) return '';
        const c = Store?.data?.configCentro || {};
        const p = Store?.data?.configPerfil || {};
        const ac = Store?.getActiveCourse?.() || {};

        const d = new Date();
        const textM = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

        switch (path) {
            case 'center.name': return ac.centroEducativo || c.nombreCentro || '';
            case 'center.sace': return c.codigoSace || '0000000';
            case 'center.community': return ac.direccionCentro || c.comunidad || '';
            case 'center.municipio': return c.municipio || '';
            case 'center.departamento': return c.departamento || '';
            case 'center.municipioUpper': return (c.municipio || '').toUpperCase();
            case 'center.departamentoUpper': return (c.departamento || '').toUpperCase();
            case 'center.placeFull': return ac.direccionCentro || (`${c.comunidad || ''}, ${c.municipio || ''}, ${c.departamento || ''}`).replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',');
            case 'center.municipioDepto': return (`${c.municipio || ''}, ${c.departamento || ''}`).replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',');
            case 'center.directorName': return ac.director || c.nombreDirector || 'Nombre del Director';
            case 'now.dateLong': return `${d.getDate()} de ${textM[d.getMonth()]} del ${d.getFullYear()}`;
            case 'now.dateShort': return d.toLocaleDateString('es-HN');
            case 'now.year': return d.getFullYear();
            case 'dme.nameLine': return `DIRECCIÓN MUNICIPAL DE EDUCACIÓN ${(c.municipio || '').toUpperCase()}`;
            default: return '';
        }
    }

    function getNextCode(sequenceRef) {
        const seqDef = SEQUENCES[sequenceRef];
        if (!seqDef) return 'DOC-XXX';

        let localSeq = state.settings.sequence[sequenceRef] || { next: 1 };
        const c = Store?.data?.configCentro || {};

        const prefix = seqDef.prefix;
        const seqNum = String(localSeq.next).padStart(seqDef.pad, '0');
        const sace = c.codigoSace || '00000';
        const year = new Date().getFullYear();
        const centerOrDdeCode = sace;
        const dmeCode = c.municipio ? c.municipio.substring(0, 4).toUpperCase() : '0000';

        let pattern = seqDef.pattern;
        pattern = pattern.replace('{{prefix}}', prefix);
        pattern = pattern.replace('{{seq}}', seqNum);
        pattern = pattern.replace('{{center.sace}}', sace);
        pattern = pattern.replace('{{year}}', year);
        pattern = pattern.replace('{{centerOrDdeCode}}', centerOrDdeCode);
        pattern = pattern.replace('{{dme.code}}', dmeCode);
        return pattern;
    }

    function incrementCode(sequenceRef) {
        if (state.settings.sequence[sequenceRef]) {
            state.settings.sequence[sequenceRef].next++;
            saveSettings();
        }
    }

    // === RENDER ENGINE UI ===
    function setHTML(html) {
        const container = document.getElementById('content');
        if (container) {
            container.innerHTML = html;
            setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 10);
        }
        return html;
    }

    // === CATEGORY CONFIG ===
    const CATEGORIES = [
        { id: 'all',            label: 'Todos',           icon: 'layout-grid' },
        { id: 'Comunicaciones', label: 'Comunicaciones',  icon: 'megaphone' },
        { id: 'Gestión Administrativa', label: 'Administrativos', icon: 'briefcase' },
        { id: 'Actas y Registros', label: 'Actas',        icon: 'book-open' },
        { id: 'frecuentes',     label: 'Frecuentes',      icon: 'star' }
    ];

    const CAT_COLORS = {
        'Comunicaciones'       : { bg: 'rgba(37,99,235,0.08)',  color: '#2563EB' },
        'Gestión Administrativa': { bg: 'rgba(0,200,83,0.08)', color: '#00C853' },
        'Actas y Registros'    : { bg: 'rgba(124,58,237,0.08)', color: '#7C3AED' },
        'default'              : { bg: 'rgba(99,102,241,0.08)', color: '#6366F1' }
    };

    function getCatStyle(category) {
        return CAT_COLORS[category] || CAT_COLORS['default'];
    }

    function ridFilterSet(f) { state.ui.filter = f; renderHome(); }
    function ridSearchSet(v) { state.ui.search = v; renderHome(); }

    function renderHome() {
        const f = state.ui.filter;
        const q = (state.ui.search || '').toLowerCase().trim();

        const filtered = TEMPLATES.filter(tpl => {
            const matchCat  = f === 'all' || f === 'frecuentes'
                ? (f === 'frecuentes' ? ['RID_CIRCULAR','RID_CONVOCATORIA','RID_OFICIO','RID_SOLICITUD'].includes(tpl.id) : true)
                : tpl.category === f;
            const matchQ = !q || tpl.name.toLowerCase().includes(q) || (tpl.category||'').toLowerCase().includes(q);
            return matchCat && matchQ;
        });

        const filterBtns = CATEGORIES.map(cat => {
            const active = f === cat.id;
            return `<button onclick="RID.ridFilterSet('${cat.id}')" style="
                display:inline-flex; align-items:center; gap:6px;
                padding:6px 16px; border-radius:12px; border:none;
                font-size:12px; font-weight:700; cursor:pointer;
                transition:all 0.2s;
                background:${active ? 'var(--primary)' : 'var(--bg-soft)'};
                color:${active ? '#fff' : 'var(--text-soft)'};
                box-shadow:${active ? '0 4px 12px rgba(0,200,83,0.25)' : 'none'};
            "><i data-lucide="${cat.icon}" style="width:12px;height:12px;"></i>${cat.label}</button>`;
        }).join('');

        const cards = filtered.map(tpl => {
            const cs = getCatStyle(tpl.category);
            const catLabel = tpl.category || 'General';
            return `
            <div class="rid-tpl-card" onclick="RID.openEditor('${tpl.id}')" title="Abrir ${tpl.name}">
                <div class="rid-card-icon" style="background:${cs.bg}; color:${cs.color};">
                    <i data-lucide="${tpl.icon || 'file-text'}" style="width:22px;height:22px;"></i>
                </div>
                <div class="rid-card-body">
                    <div class="rid-card-name">${tpl.name}</div>
                    <div class="rid-card-cat" style="color:${cs.color}; background:${cs.bg};">${catLabel}</div>
                </div>
                <div class="rid-card-actions">
                    <button class="rid-btn-use" onclick="event.stopPropagation(); RID.openEditor('${tpl.id}')">
                        <i data-lucide="edit-3" style="width:13px;height:13px;"></i> Usar plantilla
                    </button>
                </div>
            </div>`;
        }).join('');

        const emptyState = filtered.length === 0 ? `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--text-muted);">
                <i data-lucide="search" style="width:40px;height:40px;opacity:0.25;margin-bottom:12px;"></i>
                <div style="font-weight:700; margin-bottom:4px;">Sin resultados</div>
                <div style="font-size:12px;">Prueba con otro filtro o búsqueda</div>
            </div>` : '';

        const histCount = state.history.length;

        const html = `
        <style>
            .rid-module-header {
                background: linear-gradient(135deg, #fff 0%, #F0F4FF 100%);
                border: 1px solid var(--border-soft);
                border-radius: 20px;
                padding: 24px 28px;
                margin-bottom: 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                flex-wrap: wrap;
            }
            .rid-header-left { display:flex; align-items:center; gap:18px; }
            .rid-header-icon {
                width:56px; height:56px;
                background: linear-gradient(135deg, #00C853, #2979FF);
                border-radius:16px;
                display:flex; align-items:center; justify-content:center;
                color:#fff;
                box-shadow: 0 8px 20px rgba(0,200,83,0.3);
                flex-shrink:0;
            }
            .rid-header-title { font-size:20px; font-weight:800; color:var(--text-main); letter-spacing:-0.5px; }
            .rid-header-sub { font-size:12px; color:var(--text-muted); margin-top:3px; font-weight:500; }
            .rid-header-actions { display:flex; gap:10px; align-items:center; }
            .rid-search-wrap {
                position:relative;
                display:flex; align-items:center;
            }
            .rid-search-wrap i { position:absolute; left:12px; color:var(--text-muted); width:15px; height:15px; pointer-events:none; }
            .rid-search-input {
                padding: 8px 12px 8px 36px;
                border: 1.5px solid var(--border-soft);
                border-radius: 12px;
                font-size: 13px;
                font-family: inherit;
                background: var(--bg-card);
                color: var(--text-main);
                width: 220px;
                transition: border-color 0.2s;
                outline: none;
            }
            .rid-search-input:focus { border-color: var(--primary); }
            .rid-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
            .rid-catalog { display:grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap:16px; }
            .rid-tpl-card {
                background: var(--bg-card);
                border: 1px solid var(--border-soft);
                border-radius: 16px;
                padding: 18px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .rid-tpl-card:hover {
                border-color: var(--primary);
                box-shadow: 0 8px 24px rgba(0,200,83,0.12);
                transform: translateY(-2px);
            }
            .rid-card-icon {
                width:48px; height:48px;
                border-radius:14px;
                display:flex; align-items:center; justify-content:center;
                flex-shrink:0;
            }
            .rid-card-body { flex:1; }
            .rid-card-name { font-size:14px; font-weight:700; color:var(--text-main); line-height:1.3; margin-bottom:8px; }
            .rid-card-cat {
                display:inline-flex; align-items:center;
                font-size:10px; font-weight:800;
                padding:3px 10px; border-radius:8px;
                letter-spacing:0.3px;
            }
            .rid-card-actions { border-top:1px solid var(--border-soft); padding-top:12px; }
            .rid-btn-use {
                display:inline-flex; align-items:center; gap:6px;
                padding:7px 16px; border-radius:10px; border:none;
                background: linear-gradient(135deg, #00C853, #2979FF);
                color:#fff; font-size:12px; font-weight:700;
                cursor:pointer; transition:all 0.2s;
                box-shadow: 0 4px 12px rgba(0,200,83,0.2);
                width:100%;
                justify-content:center;
            }
            .rid-btn-use:hover { transform:translateY(-1px); box-shadow:0 8px 20px rgba(0,200,83,0.35); }
            .rid-section-label {
                font-size:11px; font-weight:800; text-transform:uppercase;
                letter-spacing:0.12em; color:var(--text-muted);
                margin-bottom:14px;
                display:flex; align-items:center; gap:8px;
            }
            .rid-section-label::after { content:''; flex:1; height:1px; background:var(--border-soft); }
        </style>

        <div class="rid-module-header">
            <div class="rid-header-left">
                <div class="rid-header-icon"><i data-lucide="library" style="width:26px;height:26px;"></i></div>
                <div>
                    <div class="rid-header-title">Repositorio Institucional Docente</div>
                    <div class="rid-header-sub">Formatos institucionales autogenerables, editables y listos para imprimir</div>
                </div>
            </div>
            <div class="rid-header-actions">
                <div class="rid-search-wrap">
                    <i data-lucide="search"></i>
                    <input class="rid-search-input" type="text" placeholder="Buscar formato..."
                        value="${state.ui.search || ''}"
                        oninput="RID.ridSearchSet(this.value)"
                    >
                </div>
                <button class="btn btn-outline" onclick="RID.renderHistory()" style="position:relative;">
                    <i data-lucide="history" style="width:15px;"></i>
                    Historial
                    ${histCount > 0 ? `<span style="position:absolute;top:-6px;right:-6px;background:var(--primary);color:#fff;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;">${histCount}</span>` : ''}
                </button>
            </div>
        </div>

        <div class="rid-filters">${filterBtns}</div>

        <div class="rid-section-label"><i data-lucide="layout-grid" style="width:13px;height:13px;"></i> Catálogo de Formatos (${filtered.length})</div>
        <div class="rid-catalog">${cards}${emptyState}</div>
        `;

        return setHTML(html);
    }

    function openEditor(templateId) {
        const tpl = TEMPLATES.find(t => t.id === templateId);
        if (!tpl) return;

        state.currentDoc = {
            id: 'doc_' + Date.now(),
            templateId: tpl.id,
            sequenceRef: tpl.sequenceRef,
            data: {},
            tableRows: []
        };

        // Inject Config Centro replacements immediately for defaults
        const c = Store?.data?.configCentro || {};
        const ac = Store?.getActiveCourse?.() || {};
        const cName = ac.centroEducativo || c.nombreCentro || '';
        const cMuni = c.municipio || '';
        const cDepto = c.departamento || '';

        tpl.fields.forEach(f => {
            if (f.autogenerate) {
                state.currentDoc.data[f.key] = getNextCode(f.autogenerate);
            } else {
                let val = resolveAutofill(f.autofill);
                if (!val && f.default) {
                    val = f.default
                        .replace('{{center.name}}', cName)
                        .replace('{{center.municipio}}', cMuni)
                        .replace('{{center.departamento}}', cDepto);
                }
                state.currentDoc.data[f.key] = val;
            }
        });

        if (tpl.hasTable) {
            if (tpl.table.defaultRows) {
                state.currentDoc.tableRows = JSON.parse(JSON.stringify(tpl.table.defaultRows));
            } else {
                state.currentDoc.tableRows = Array(12).fill().map((_, i) => {
                    let row = { no: i + 1 };
                    tpl.table.schema.forEach(col => { if (col.key !== 'no') row[col.key] = ''; });
                    return row;
                });
            }
        }

        renderEditor(tpl);
    }

    function renderEditor(tpl) {
        // Build form fields HTML
        let formFields = '';

        tpl.fields.forEach(f => {
            const val = (state.currentDoc.data[f.key] || '').toString().replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const readOl = (f.type === 'readonly') ? 'readonly style="opacity:0.6;cursor:not-allowed;"' : '';
            if (f.autogenerate) return; // hide auto-generated code fields (shown in preview)

            if (f.type === 'textarea') {
                formFields += `
                <div class="rid-field-group" style="grid-column:1/-1;">
                    <label class="rid-field-label">${f.label}${f.required ? ' <span style="color:var(--danger);">*</span>' : ''}</label>
                    <textarea class="rid-field-ctrl" rows="${f.rows||3}" id="rid_f_${f.key}"
                        placeholder="${f.placeholder||''}"
                        oninput="RID.updateField('${f.key}', this.value)"
                        ${f.required?'required':''} ${readOl}>${val}</textarea>
                </div>`;
            } else if (f.type === 'select') {
                formFields += `
                <div class="rid-field-group" style="grid-column:1/-1;">
                    <label class="rid-field-label">${f.label}${f.required ? ' <span style="color:var(--danger);">*</span>' : ''}</label>
                    <select class="rid-field-ctrl" id="rid_f_${f.key}"
                        onchange="RID.updateField('${f.key}', this.value)"
                        ${f.required?'required':''} ${readOl}>`;
                if (f.options) {
                    f.options.forEach(opt => {
                        const isSelected = state.currentDoc.data[f.key] === opt.value ? 'selected' : '';
                        formFields += `<option value="${opt.value.replace(/"/g,'&quot;')}" ${isSelected}>${opt.label}</option>`;
                    });
                }
                formFields += `</select></div>`;
            } else {
                formFields += `
                <div class="rid-field-group">
                    <label class="rid-field-label">${f.label}${f.required ? ' <span style="color:var(--danger);">*</span>' : ''}</label>
                    <input type="${f.type === 'readonly' ? 'text' : f.type}" class="rid-field-ctrl"
                        id="rid_f_${f.key}" value="${val}"
                        placeholder="${f.placeholder||''}"
                        oninput="RID.updateField('${f.key}', this.value)"
                        ${f.required?'required':''} ${readOl}>
                </div>`;
            }
        });

        // Table rows editor
        let tableSection = '';
        if (tpl.hasTable) {
            let tHead = tpl.table.schema.map(col =>
                `<th style="padding:6px 8px; color:var(--text-soft); font-weight:700; font-size:10.5px; text-transform:uppercase; white-space:nowrap; border-bottom:2px solid var(--border-soft);">${col.label}</th>`
            ).join('');
            let tRows = state.currentDoc.tableRows.map((row, idx) => {
                let cells = tpl.table.schema.map(col => {
                    if (col.key === 'no' || col.type === 'autoindex') {
                        return `<td style="padding:4px 8px; text-align:center; font-weight:700; color:var(--text-muted); font-size:12px;">${row[col.key]||idx+1}</td>`;
                    }
                    const sv = (row[col.key]||'').toString().replace(/"/g,'&quot;');
                    return `<td style="padding:3px;"><input class="rid-field-ctrl" style="border-radius:8px; font-size:12px; height:32px; padding:0 10px;" value="${sv}" placeholder="—" oninput="RID.updateTable(${idx},'${col.key}',this.value)"></td>`;
                }).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            tableSection = `
            <div class="rid-table-section">
                <div class="rid-section-head"><i data-lucide="table-2" style="width:14px;height:14px;"></i> Datos de tabla</div>
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; min-width:600px;">
                        <thead><tr>${tHead}</tr></thead>
                        <tbody>${tRows}</tbody>
                    </table>
                </div>
            </div>`;
        }

        const catStyle = getCatStyle(tpl.category||'');
        const codeVal = state.currentDoc.data.code || '';

        const html = `
        <style>
            .rid-editor-wrap {
                display:grid;
                grid-template-columns: 380px 1fr;
                gap: 20px;
                align-items: start;
            }
            @media(max-width:1100px) { .rid-editor-wrap { grid-template-columns:1fr; } }

            .rid-editor-panel {
                background: var(--bg-card);
                border: 1px solid var(--border-soft);
                border-radius: 20px;
                overflow: hidden;
                position: sticky;
                top: 20px;
            }
            .rid-editor-head {
                padding: 18px 20px;
                border-bottom: 1px solid var(--border-soft);
                background: linear-gradient(135deg, var(--bg-soft), white);
                display: flex;
                align-items: center;
                gap: 14px;
            }
            .rid-editor-head-icon {
                width:42px; height:42px;
                border-radius:12px;
                display:flex; align-items:center; justify-content:center;
                background:${catStyle.bg}; color:${catStyle.color};
                flex-shrink:0;
            }
            .rid-editor-title { font-size:15px; font-weight:800; color:var(--text-main); line-height:1.2; }
            .rid-editor-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
            .rid-form-scroll { padding:20px; display:flex; flex-direction:column; gap:14px; max-height:620px; overflow-y:auto; }

            .rid-field-group { display:flex; flex-direction:column; gap:5px; }
            .rid-field-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-muted); }
            .rid-field-ctrl {
                width:100%;
                padding: 9px 12px;
                border: 1.5px solid var(--border-soft);
                border-radius: 10px;
                font-size: 13px;
                font-family: inherit;
                color: var(--text-main);
                background: var(--bg-soft);
                transition: border-color 0.2s, box-shadow 0.2s;
                outline: none;
                box-sizing: border-box;
            }
            .rid-field-ctrl:focus { border-color: var(--primary); background:#fff; box-shadow:0 0 0 3px rgba(0,200,83,0.08); }
            textarea.rid-field-ctrl { resize:vertical; min-height:80px; line-height:1.5; }

            .rid-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

            .rid-form-actions {
                padding:14px 20px;
                border-top:1px solid var(--border-soft);
                display:flex; flex-direction:column; gap:8px;
            }
            .rid-btn-primary {
                display:flex; align-items:center; justify-content:center; gap:8px;
                padding:12px 20px; border-radius:12px; border:none;
                background:linear-gradient(135deg,#00C853,#2979FF);
                color:#fff; font-size:13px; font-weight:700;
                cursor:pointer; transition:all 0.2s;
                box-shadow:0 8px 20px rgba(0,200,83,0.25);
            }
            .rid-btn-primary:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(0,200,83,0.4); }
            .rid-btn-secondary {
                display:flex; align-items:center; justify-content:center; gap:8px;
                padding:10px 20px; border-radius:12px;
                border:1.5px solid var(--border-soft);
                background:var(--bg-soft); color:var(--text-soft);
                font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s;
            }
            .rid-btn-secondary:hover { border-color:var(--primary); color:var(--primary); background:#fff; }
            .rid-btn-ghost {
                display:flex; align-items:center; justify-content:center; gap:8px;
                padding:9px 14px; border-radius:10px; border:none;
                background:transparent; color:var(--text-muted);
                font-size:12px; font-weight:600; cursor:pointer;
            }
            .rid-btn-ghost:hover { background:var(--bg-soft); color:var(--text-main); }

            /* Preview panel */
            .rid-preview-panel {
                background:var(--bg-card);
                border:1px solid var(--border-soft);
                border-radius:20px;
                overflow:hidden;
            }
            .rid-preview-head {
                padding:14px 20px;
                border-bottom:1px solid var(--border-soft);
                display:flex; align-items:center; justify-content:space-between;
                background:var(--bg-soft);
            }
            .rid-preview-label { font-size:12px; font-weight:700; color:var(--text-muted); display:flex; align-items:center; gap:8px; }
            .rid-preview-dot { width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow:0 0 8px #10b981; }
            .rid-preview-body {
                background:#e8ecf0;
                padding:24px;
                min-height:750px;
                display:flex;
                justify-content:center;
                align-items:flex-start;
                overflow-y:auto;
            }
            #rid-pdf-canvas {
                width:100%; max-width:8.5in;
                min-height:11in;
                background:#fff;
                box-shadow:0 10px 40px rgba(0,0,0,0.18);
                border-radius:2px;
            }

            .rid-table-section {
                margin-top:20px;
                padding-top:18px;
                border-top:1px solid var(--border-soft);
            }
            .rid-section-head {
                font-size:11px; font-weight:800; text-transform:uppercase;
                letter-spacing:0.1em; color:var(--text-muted);
                display:flex; align-items:center; gap:6px;
                margin-bottom:12px;
            }

            .rid-code-badge {
                display:inline-flex; align-items:center; gap:6px;
                padding:4px 12px; border-radius:8px;
                background:rgba(0,200,83,0.08); color:var(--primary);
                font-size:11px; font-weight:800; font-family:monospace;
                border:1px solid rgba(0,200,83,0.2);
            }

            .rid-back-row {
                display:flex; align-items:center; gap:12px;
                margin-bottom:20px;
            }
            .rid-back-btn {
                display:flex; align-items:center; gap:6px;
                padding:7px 14px; border-radius:10px; border:1.5px solid var(--border-soft);
                background:var(--bg-card); color:var(--text-soft);
                font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s;
            }
            .rid-back-btn:hover { border-color:var(--primary); color:var(--primary); }
        </style>

        <div class="rid-back-row">
            <button class="rid-back-btn" onclick="RID.renderHome()">
                <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Catálogo
            </button>
            <div style="flex:1"></div>
            ${codeVal ? `<span class="rid-code-badge"><i data-lucide="hash" style="width:11px;height:11px;"></i>${codeVal}</span>` : ''}
            <button class="rid-btn-ghost" onclick="RID.shareWhatsApp()" title="Compartir por WhatsApp">
                <i data-lucide="message-circle" style="color:#25D366; width:16px;height:16px;"></i> WhatsApp
            </button>
        </div>

        <div class="rid-editor-wrap">

            <!-- LEFT: Form Panel -->
            <div class="rid-editor-panel">
                <div class="rid-editor-head">
                    <div class="rid-editor-head-icon">
                        <i data-lucide="${tpl.icon||'file-text'}" style="width:20px;height:20px;"></i>
                    </div>
                    <div>
                        <div class="rid-editor-title">${tpl.name}</div>
                        <div class="rid-editor-sub">Complete los campos del formulario</div>
                    </div>
                </div>

                <div class="rid-form-scroll">
                    <div class="rid-form-grid">
                        ${formFields}
                    </div>
                    ${tableSection}
                </div>

                <div class="rid-form-actions">
                    <button class="rid-btn-primary" onclick="RID.saveFinal()">
                        <i data-lucide="check-circle" style="width:16px;height:16px;"></i>
                        Finalizar y Archivar
                    </button>
                    <div style="display:flex; gap:8px;">
                        <button class="rid-btn-secondary" style="flex:1;" onclick="RID.generateAndSharePDF()">
                            <i data-lucide="file-down" style="width:14px;height:14px;"></i> Exportar PDF
                        </button>
                        <button class="rid-btn-secondary" style="flex:1;" onclick="RID.shareWhatsApp()">
                            <i data-lucide="share-2" style="width:14px;height:14px;"></i> Compartir
                        </button>
                    </div>
                    <button class="rid-btn-ghost" onclick="RID.renderHome()">
                        <i data-lucide="x" style="width:13px;height:13px;"></i> Cancelar
                    </button>
                </div>
            </div>

            <!-- RIGHT: Live Preview -->
            <div class="rid-preview-panel">
                <div class="rid-preview-head">
                    <div class="rid-preview-label">
                        <span class="rid-preview-dot"></span>
                        Vista previa en tiempo real
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="rid-btn-secondary" style="padding:6px 14px; height:auto;" onclick="RID.generateAndSharePDF()">
                            <i data-lucide="download" style="width:13px;height:13px;"></i> Generar PDF
                        </button>
                        <button class="rid-btn-secondary" style="padding:6px 14px; height:auto;" onclick="window.print()">
                            <i data-lucide="printer" style="width:13px;height:13px;"></i> Imprimir
                        </button>
                    </div>
                </div>
                <div class="rid-preview-body">
                    <div id="rid-pdf-canvas"></div>
                </div>
            </div>

        </div>
        `;

        setHTML(html);
        updateLivePreview();
    }

    function toggleView(mode) {
        // In the new split-view layout this is a no-op — both panels are always visible.
        // Kept for backward compatibility from legacy hist openHistoryItem calls.
        updateLivePreview();
        window.scrollTo(0, 0);
    }

    function updateLivePreview() {
        if (!state.currentDoc) return;
        const tpl = TEMPLATES.find(t => t.id === state.currentDoc.templateId);
        if (!tpl) return;
        const finalTxt = engineParseText(tpl.textTemplate, tpl);
        state.currentDoc.generatedText = finalTxt;
        let finalPdfHtml = '';
        if (tpl.pdfTemplate.htmlBind === 'textTemplateToHtml') finalPdfHtml = textTemplateToHtml(finalTxt, tpl.name);
        else if (tpl.pdfTemplate.htmlBind === 'attendanceHtmlWithTable') finalPdfHtml = attendanceHtmlWithTable(finalTxt, tpl);
        else if (tpl.pdfTemplate.htmlBind === 'matrixHtmlWithTable') finalPdfHtml = matrixHtmlWithTable(finalTxt, tpl);
        else if (tpl.pdfTemplate.htmlBind === 'actaHtmlWithTable') finalPdfHtml = actaHtmlWithTable(finalTxt, tpl);
        state.currentDoc.generatedPdfHtml = finalPdfHtml;
        const canvas = document.getElementById('rid-pdf-canvas');
        if (canvas) canvas.innerHTML = finalPdfHtml;
    }

    function updateField(key, val) {
        if (state.currentDoc) {
            state.currentDoc.data[key] = val;
            updateLivePreview();
        }
    }
    function updateTable(idx, key, val) {
        if (state.currentDoc) {
            state.currentDoc.tableRows[idx][key] = val;
            updateLivePreview();
        }
    }


    // === ENGINE PARSERS ===

    function engineParseText(templateString, tplConfig) {
        let res = templateString;
        const allData = { ...state.currentDoc.data };

        // Handle specific logic like anexos array -> anexosListHtml
        if (res.includes('{{anexosListHtml}}')) {
            if (allData.anexos && allData.anexos.trim() !== '') {
                const lines = allData.anexos.split('\n');
                let txt = "ANEXOS:\n" + lines.map(l => "- " + l.trim()).filter(l => l !== '- ').join('\n');
                res = res.replace('{{anexosListHtml}}', txt);
            } else {
                res = res.replace('{{anexosListHtml}}', ''); // empty
            }
        }

        for (let key in allData) {
            let val = allData[key];
            const safeKey = key.replace('.', '\\.');
            res = res.replace(new RegExp('\\{\\{' + safeKey + '\\}\\}', 'g'), val || '');
        }

        // Remove empty lines generated by empty variables (like missing anexos)
        res = res.split('\n').filter(line => line.trim() !== '' || line === '').join('\n');
        return res;
    }

    function textTemplateToHtml(textString, docTitle) {
        let lines = textString.split('\n');
        let htmlLines = lines.map((line, index) => {
            let tl = line.trim();
            if (!tl) return '<div style="height: 10px;"></div>';

            if (tl === '{{TABLE_MARKER}}') return '{{TABLE_MARKER}}';
            if (tl === '{{SIGNATURES_ACTA}}') return '{{SIGNATURES_ACTA}}';

            // Reemplazar Markdown *bold* por HTML <b>
            tl = tl.replace(/\*(.*?)\*/g, "<b>$1</b>");

            if (tl.match(/^(CIRCULAR|CONVOCATORIA|OFICIO|PERMISO|SOLICITUD|TOMA DE POSESIÓN|CONTROL DE PERMISOS DOCENTES|REVERSIÓN|PERMISO)/i) && index <3) {
                return `<h2 style="text-align:center; margin-bottom:15px; font-weight:bold;">${tl}</h2>`;
            }

            if ((index === 0 || index === 1) && (tl.includes(';') || tl.includes(',')) && tl.match(/\d{4}/)) {
                return `<div style="text-align:right; margin-bottom:20px;">${tl}</div>`;
            }
            if (tl.match(/^(OF|CIR|CONVC|PERM|SO|SOLC|TOMP)-/)) {
                return `<div style="text-align:right; font-weight:bold; margin-bottom:5px;">${tl}</div>`;
            }
            if (tl.match(/^<b>ASUNTO:/i)) {
                return `<div style="text-align:right; margin-bottom:30px;">${tl}</div>`;
            }
            if (tl.match(/^(Para|De|Lugar|Local|Fecha|Hora):/i)) {
                let parts = tl.split(':');
                return `<div style="margin-bottom: 5px;"><b>${parts[0]}:</b> ${parts.slice(1).join(':')}</div>`;
            }
            if (tl.match(/^(Atentamente,|Saludos cordiales|Respetuosamente\.|V°\.? ?B°\.?|HACE CONSTAR QUE:)/i)) {
                return `<div style="margin-top:20px; margin-bottom:40px;">${tl}</div>`;
            }
            if (tl.startsWith('1. ') || tl.startsWith('- ')) {
                return `<div style="margin-left: 30px; margin-bottom: 3px; font-size:12px;">${tl.replace('- ', '1. ')}</div>`;
            }
            if (tl.includes('________')) {
                return `<div style="margin-top:50px; text-align:center; font-weight:bold; white-space: pre-wrap;">${tl}</div>`;
            }
            if (tl.startsWith('Oficio No')) {
                return `<div style="margin-top:30px; text-align:right; font-size:10px;">${tl} <br> 1/1</div>`;
            }

            if (tl.startsWith('Estimado') || tl.startsWith('A través ') || tl.startsWith('Por medio ') || tl.startsWith('Con el ') || tl.toLowerCase().includes('solicito') || tl.toLowerCase().includes('agradeciendo') || tl.startsWith('Sin otro') || tl.startsWith('El (la) docente') || tl.startsWith('Y para los fines') || tl.startsWith('El motivo de ')) {
                return `<div style="margin-bottom: 12px; text-align: justify;">${tl}</div>`;
            }

            if (tl.startsWith('Dirección') && !tl.includes('Municipal')) {
                return `<div>${tl}</div>`;
            }

            return `<div style="margin-bottom: 5px; text-align: justify;">${tl}</div>`;
        });

        return `<div class="rid-pdf" style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #000; padding: 0.8in; background:#fff; text-align: left;">
            ${htmlLines.join('')}
        </div>`;
    }

    function attendanceHtmlWithTable(textString, tplConfig) {
        let topHtml = textTemplateToHtml(textString, 'Listado');
        // generate table
        let tb = `<table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:11px;"><thead><tr>`;
        tplConfig.table.schema.forEach(col => { tb += `<th style="border:1px solid #000; padding:6px; background:#f0f0f0">${col.label}</th>`; });
        tb += `</tr></thead><tbody>`;
        state.currentDoc.tableRows.forEach(row => {
            tb += `<tr>`;
            tplConfig.table.schema.forEach(col => {
                let text = row[col.key] || (col.key === 'signature' ? '' : '');
                tb += `<td style="border:1px solid #000; padding:6px; height: 24px;">${text}</td>`;
            });
            tb += `</tr>`;
        });
        tb += `</tbody></table>`;
        return topHtml.replace('</div>', tb + '</div>');
    }

    function matrixHtmlWithTable(textString, tplConfig) {
        let topHtml = textTemplateToHtml(textString, 'Matriz');
        let tb = `<table style="width:100%; border-collapse:collapse; margin-top:20px; font-size:10px;"><thead><tr>`;
        tplConfig.table.schema.forEach(col => { tb += `<th style="border:1px solid #000; padding:4px; background:#f0f0f0">${col.label}</th>`; });
        tb += `</tr></thead><tbody>`;
        state.currentDoc.tableRows.forEach(row => {
            tb += `<tr>`;
            tplConfig.table.schema.forEach(col => { tb += `<td style="border:1px solid #000; padding:4px; height: 20px;">${row[col.key] || ''}</td>`; });
            tb += `</tr>`;
        });
        tb += `</tbody></table>`;
        return topHtml.replace('</div>', tb + '</div>');
    }

    function actaHtmlWithTable(textString, tplConfig) {
        let textWithHtml = textTemplateToHtml(textString, tplConfig.name);

        let tb = `<table style="width:100%; border-collapse:collapse; margin:15px 0; font-size:11px; text-align:left;"><thead><tr>`;
        tplConfig.table.schema.forEach(col => { tb += `<th style="border:1px solid #000; padding:4px 6px; background:#f0f0f0; font-weight:bold;">${col.label}</th>`; });
        tb += `</tr></thead><tbody>`;
        state.currentDoc.tableRows.forEach(row => {
            tb += `<tr>`;
            tplConfig.table.schema.forEach(col => {
                tb += `<td style="border:1px solid #000; padding:4px 6px; height: 18px;">${row[col.key] || ''}</td>`;
            });
            tb += `</tr>`;
        });
        tb += `</tbody></table>`;

        let sigs = `<div style="margin-top:30px; display:flex; flex-direction:column; align-items:center; gap:40px; text-align:center; font-size:12px;">
            <div>_________________________________<br><b>${state.currentDoc.data.teacherName || 'Docente'}</b><br>Docente del Grado</div>
            <div>_________________________________<br>Presidente(a) Comité de Apoyo</div>
            <div>_________________________________<br>Secretario(a)</div>
            <div>_________________________________<br>Padre/Madre de Familia</div>
        </div>`;

        return textWithHtml.replace('{{TABLE_MARKER}}', tb).replace('{{SIGNATURES_ACTA}}', sigs);
    }

    function previewDoc() {
        // Obsolete: Now handled directly by toggleView('preview') and the main render system.
        // Left here in case of legacy calls from openHistoryItem, simply forces renderEditor.
        const tpl = TEMPLATES.find(t => t.id === state.currentDoc.templateId);
        if (tpl) renderEditor(tpl);
    }

    function shareWhatsApp() {
        if (!state.currentDoc || !state.currentDoc.generatedText) return;
        const msg = encodeURIComponent(state.currentDoc.generatedText);
        window.open('https://wa.me/?text=' + msg, '_blank');
    }

    function generateAndSharePDF() {
        if (typeof html2pdf === 'undefined') {
            UI.toast('El motor de generación PDF (html2pdf) está cargando...', 'warning');
            return;
        }

        const element = document.getElementById('rid-pdf-canvas');
        if (!element) return;

        UI.toast('Exportando lienzo PDF formal, por favor espera...', 'info');

        const code = state.currentDoc.data.code || `Documento_${Date.now()}`;
        const opt = {
            margin: 0,
            filename: code + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).output('blob').then(function (blob) {
            const fileName = code + '.pdf';
            const file = new File([blob], fileName, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    title: `Documento ${code}`,
                    text: 'Te comparto el documento generado desde el Repositorio Institucional.',
                    files: [file]
                }).then(() => UI.toast('Compartido con éxito.', 'success'))
                    .catch((err) => console.log('Cancelado / Error', err));
            } else {
                UI.toast('Descargando PDF localmente...', 'success');
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
            }
        });
    }

    function saveFinal() {
        if (!state.currentDoc) return;
        if (state.currentDoc.sequenceRef) { incrementCode(state.currentDoc.sequenceRef); }
        state.currentDoc.timestamp = Date.now();
        state.history.unshift(state.currentDoc);
        saveHistory();
        UI.toast('Documento indexado con éxito.', 'success');
        renderHistory();
    }

    function renderHistory() {
        const rows = state.history.map((h, i) => {
            const tplDef = TEMPLATES.find(t => t.id === h.templateId);
            const cs = getCatStyle(tplDef?.category || '');
            const code = h.data?.code || '—';
            const name = tplDef?.name || 'Documento';
            const ds = new Date(h.timestamp).toLocaleString('es-HN');
            return `
            <div class="rid-hist-row" onclick="RID.openHistoryItem(${i})">
                <div class="rid-hist-icon" style="background:${cs.bg}; color:${cs.color};">
                    <i data-lucide="${tplDef?.icon||'file-text'}" style="width:18px;height:18px;"></i>
                </div>
                <div class="rid-hist-info">
                    <div class="rid-hist-name">${name}</div>
                    <div class="rid-hist-date">${ds}</div>
                </div>
                <span class="rid-code-badge" style="margin-left:auto; flex-shrink:0;">${code}</span>
                <button class="rid-btn-ghost" style="padding:6px 10px; flex-shrink:0;" title="Ver documento">
                    <i data-lucide="eye" style="width:14px;height:14px;"></i>
                </button>
            </div>`;
        }).join('');

        const empty = `
            <div style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                <i data-lucide="file-clock" style="width:48px;height:48px;opacity:0.2;margin-bottom:14px;"></i>
                <div style="font-weight:700; margin-bottom:6px;">Historial vacío</div>
                <div style="font-size:12px;">Genera y archiva documentos para verlos aquí.</div>
            </div>`;

        const html = `
        <style>
            .rid-hist-row {
                display:flex; align-items:center; gap:14px;
                padding:14px 20px;
                border-bottom:1px solid var(--border-soft);
                cursor:pointer; transition:background 0.15s;
            }
            .rid-hist-row:last-child { border-bottom:none; }
            .rid-hist-row:hover { background:var(--bg-soft); }
            .rid-hist-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
            .rid-hist-name { font-size:13px; font-weight:700; color:var(--text-main); }
            .rid-hist-date { font-size:11px; color:var(--text-muted); margin-top:2px; }
        </style>

        <div class="rid-back-row" style="margin-bottom:20px;">
            <button class="rid-back-btn" onclick="RID.renderHome()">
                <i data-lucide="arrow-left" style="width:14px;height:14px;"></i> Catálogo
            </button>
            <div style="font-size:18px; font-weight:800; color:var(--text-main); margin-left:8px;">
                Historial de Documentos
            </div>
            <div style="flex:1;"></div>
            <span style="font-size:12px; color:var(--text-muted);">${state.history.length} documento${state.history.length!==1?'s':''}</span>
        </div>

        <div class="card" style="padding:0; overflow:hidden;">
            ${state.history.length > 0 ? rows : empty}
        </div>
        `;
        return setHTML(html);
    }

    function openHistoryItem(idx) {
        state.currentDoc = Object.assign({}, state.history[idx]);
        previewDoc();
    }

    return {
        init: init,
        renderHome: renderHome,
        openEditor: openEditor,
        updateField: updateField,
        updateTable: updateTable,
        previewDoc: previewDoc,
        shareWhatsApp: shareWhatsApp,
        generateAndSharePDF: generateAndSharePDF,
        saveFinal: saveFinal,
        renderHistory: renderHistory,
        openHistoryItem: openHistoryItem,
        toggleView: toggleView,
        ridFilterSet: ridFilterSet,
        ridSearchSet: ridSearchSet
    };
})();
