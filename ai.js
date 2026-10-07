const Aula360AIObservations = {
    generate(studentId, courseId) {
        if (!studentId || !courseId) return "Error: Datos insuficientes para generar la observación.";

        const student = Store.data.estudiantes.find(s => s.id === studentId);
        if (!student) return "Estudiante no encontrado.";

        // 1. Recopilar datos de Asistencia
        const records = Store.get('asistencia') || [];
        const studentAsist = records.filter(a => a.cursoId === courseId);
        let ausencias = 0;
        let tardanzas = 0;
        studentAsist.forEach(r => {
            const list = r.lista || [];
            const rec = list.find(l => l.estudianteId === studentId);
            if (rec) {
                if (rec.estado === 'A' || rec.estado === 'E') ausencias++;
                if (rec.estado === 'T') tardanzas++;
            }
        });

        // 2. Recopilar datos de SART (Comportamiento)
        const sart = Store.get('sart') || [];
        const studentAlerts = sart.filter(s => s.cursoId === courseId && s.estudianteId === studentId);
        const hasActiveAlerts = studentAlerts.some(a => a.estado !== 'Resuelta');

        // Construcción del Párrafo usando reglas NLP
        let paragraph = `${student.nombreCompleto.split(' ')[0]} `;

        // Condicionales pedagógicos
        if (ausencias === 0 && !hasActiveAlerts) {
            paragraph += "ha demostrado un excelente compromiso durante el período. Su asistencia perfecta y comportamiento ejemplar son fundamentales para su buen desempeño. Se recomienda continuar fomentando estos hábitos de estudio y disciplina para su éxito continuo.";
        } else if (ausencias > 3 && hasActiveAlerts) {
            paragraph += `presenta un alto índice de ausentismo (${ausencias} faltas registradas), lo cual está afectando directamente su proceso de aprendizaje continuo. Además, se requiere mayor acompañamiento en casa respecto a las directrices de aula. Es vital establecer una comunicación más constante entre familia y escuela.`;
        } else if (ausencias > 2) {
            paragraph += `tiene un potencial notable, sin embargo, el registro de ${ausencias} inasistencias genera interrupciones en su secuencia de aprendizaje. Se recomienda encarecidamente mejorar la puntualidad y regularidad para consolidar sus competencias académicas este año.`;
        } else if (hasActiveAlerts) {
            paragraph += "muestra capacidades adecuadas para el aprendizaje, pero es necesario reforzar el seguimiento actitudinal y conductual. Mantener el enfoque en las actividades del aula y mejorar el respeto a las normativas le permitirá alcanzar los objetivos propuestos de manera óptima.";
        } else {
            paragraph += "mantiene un progreso estable en el aula. Muestra disposición para el trabajo escolar y se adapta positivamente a las dinámicas grupales. Se sugiere seguir estimulando su participación activa en casa para potenciar aún más su desarrollo integral.";
        }

        return paragraph;
    }
};
