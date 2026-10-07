# Aula 360 - Cuaderno Docente Digital 📚✨

Sistema integral de gestión académica, control de asistencia, evaluación continua y reportes oficiales para docentes y centros educativos de Educación Básica y Media en Honduras.

---

## 🚀 Características Principales

- **📊 Gestión de Matrícula y Estudiantes:** Registro completo de educandos, datos personales, tutores y estados de matrícula (Activo, Desertor, Traslado).
- **📅 Control de Asistencia Diario y Mensual:** Registro táctil y rápido de asistencia (Presente, Ausente, Tardanza, Justificada) con cálculo automático de porcentajes y días lectivos.
- **📝 Cuadro Controlador y Calificaciones:** Evaluación por dimensiones pedagógicas configurables (Actividades Cotidianas, Extraclase, Valores, Pruebas) con ponderaciones automáticas por parcial.
- **📈 Pruebas Formativas Mensuales:** Tabulación de resultados en Lectura y Escritura con gráficos estadísticos de desempeño y clasificación ministerial (Avanzado, Satisfactorio, Debe Mejorar, Insatisfactorio).
- **📋 Parte Mensual y Reportes Oficiales:** Generación automática e instantánea de Parte Mensual, Cuadros de Control, Actas Finales, Fichas de Estudiantes y Estadísticas listos para imprimir o exportar a PDF con membrete y firmas institucionales.
- **🚨 Sistema SART (Alertas Tempranas):** Detección y seguimiento oportuno de educandos en riesgo académico o de deserción escolar.
- **🔒 Respaldo Seguro y Sincronización:**
  - Almacenamiento local ultrarrápido y offline (IndexedDB + LocalStorage).
  - Respaldo y restauración en archivos JSON locales.
  - Sincronización en la nube con Google Drive / Google Sheets.
  - Compatibilidad multiplataforma (Web y Android APK con Capacitor).

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5 semántico, CSS3 moderno con variables dinámicas, JavaScript Vanilla (SPA de alto rendimiento sin frameworks pesados).
- **Almacenamiento Local:** IndexedDB + LocalStorage para funcionamiento 100% offline.
- **Exportación & Gráficos:** HTML5 Canvas, KaTeX, Conic Gradients, Print CSS optimizado para hojas estándar Carta/Oficio.
- **Móvil:** Apache Cordova / Capacitor para empaquetado nativo en Android.
- **Nube:** Google Apps Script Webhooks / Google Drive API para respaldos remotos.

---

## 📂 Estructura del Proyecto

```text
├── index.html           # Punto de entrada principal
├── app.js               # Lógica central del sistema y módulos de vista
├── style.css            # Estilos globales, diseño responsivo y temas
├── store.js             # Gestor de base de datos local y almacenamiento
├── logic.js             # Cálculos académicos y algoritmos de evaluación
├── drive_backup.js      # Módulo de integración y sincronización con Google Drive
├── pruebas_formativas.js# Tabulación y gráficas de pruebas formativas
├── www/                 # Versión compilada para distribución y móviles
└── README.md            # Documentación del proyecto
```

---

## 📄 Licencia y Créditos

Desarrollado para la optimización y modernización de la labor docente.
© 2026 **Aula 360 / WIPIN**. Todos los derechos reservados.
