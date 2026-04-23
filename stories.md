# Historias de Usuario - Pulso System

## Índice
1. [Gestión de Workflows](#gestión-de-workflows)
2. [Gestión de Inventario](#gestión-de-inventario)
3. [Gestión Laboral](#gestión-laboral)
4. [Integración WhatsApp](#integración-whatsapp)
5. [Reportes y Analytics](#reportes-y-analytics)
6. [Gestión de Usuarios y Roles](#gestión-de-usuarios-y-roles)

---

## Gestión de Workflows

### US-WF-001: Crear Workflow desde Plantilla
**Como** gerente de restaurante  
**Quiero** crear un workflow de apertura desde una plantilla predefinida  
**Para** estandarizar las operaciones de apertura en todas mis sucursales

**Criterios de Aceptación:**
- Puedo ver una lista de plantillas disponibles categorizadas
- Puedo previsualizar los pasos de una plantilla antes de usarla
- Puedo personalizar el nombre y descripción del workflow
- Puedo asignar el workflow a una sucursal específica
- Puedo configurar la frecuencia de ejecución (diaria, semanal, etc.)
- El sistema crea automáticamente las instancias según la programación

**Tareas Técnicas:**
- [ ] GET /api/workflows/templates - Listar plantillas
- [ ] GET /api/workflows/templates/:id - Obtener detalles de plantilla
- [ ] POST /api/workflows - Crear workflow desde plantilla
- [ ] UI: Galería de plantillas con filtros y búsqueda
- [ ] UI: Modal de configuración de workflow

**Estimación:** 5 puntos  
**Prioridad:** Alta  
**Dependencias:** Sistema de plantillas implementado

---

### US-WF-002: Ejecutar Workflow Paso a Paso
**Como** empleado de cocina  
**Quiero** ejecutar el checklist de apertura paso a paso  
**Para** asegurarme de no olvidar ninguna tarea importante

**Criterios de Aceptación:**
- Recibo una notificación cuando tengo un workflow asignado
- Puedo ver claramente qué paso estoy ejecutando
- Puedo tomar fotos como evidencia de cada paso
- El sistema valida automáticamente las fotos con IA cuando está configurado
- Puedo ver mi progreso (ej: "Paso 3 de 10")
- Puedo volver a un paso anterior si cometí un error
- El sistema guarda mi progreso automáticamente

**Criterios Adicionales:**
- Si un paso requiere verificación IA:
  - El sistema muestra feedback inmediato (✓ Verificado / ✗ Requiere revisión)
  - Si la confianza es baja (<85%), el sistema solicita revisar la foto
  - Puedo tomar otra foto si la primera no fue aceptada
- Si un paso tiene validaciones numéricas:
  - El sistema muestra rangos aceptables (ej: "Temperatura: 0-4°C")
  - Muestra advertencia si el valor está fuera de rango
  - Genera alerta automática si es crítico

**Tareas Técnicas:**
- [ ] GET /api/workflows/instances/:id - Obtener instancia con pasos
- [ ] POST /api/workflows/instances/:id/steps/:stepId/complete - Completar paso
- [ ] POST /api/workflows/instances/:id/steps/:stepId/evidence - Subir evidencia
- [ ] POST /api/ai/verify - Endpoint de verificación IA
- [ ] UI: Componente WorkflowExecutor con navegación entre pasos
- [ ] UI: Captura de foto con preview
- [ ] UI: Indicador de progreso visual
- [ ] Servicio: Auto-save cada 30 segundos

**Estimación:** 8 puntos  
**Prioridad:** Crítica  
**Dependencias:** Sistema de evidencias, Integración IA

---

### US-WF-003: Revisar Workflows Completados
**Como** supervisor  
**Quiero** revisar los workflows completados por mi equipo  
**Para** verificar que se cumplieron todos los estándares de calidad

**Criterios de Aceptación:**
- Puedo ver una lista de workflows completados filtrada por fecha y empleado
- Puedo ver todas las evidencias fotográficas de cada paso
- Puedo ver los resultados de verificación IA de cada foto
- Puedo aprobar o rechazar un workflow completado
- Si rechazo, puedo especificar la razón y qué pasos deben repetirse
- El empleado recibe notificación si su workflow fue rechazado

**Tareas Técnicas:**
- [ ] GET /api/workflows/instances?status=completed&branchId=X
- [ ] GET /api/workflows/instances/:id/review - Obtener datos para revisión
- [ ] POST /api/workflows/instances/:id/approve - Aprobar workflow
- [ ] POST /api/workflows/instances/:id/reject - Rechazar workflow
- [ ] UI: Vista de revisión con galería de evidencias
- [ ] UI: Modal de rechazo con selección de pasos
- [ ] Servicio: Notificaciones de aprobación/rechazo

**Estimación:** 5 puntos  
**Prioridad:** Media  
**Dependencias:** Sistema de notificaciones

---

### US-WF-004: Crear Workflow Personalizado
**Como** gerente general  
**Quiero** crear un workflow personalizado para un proceso específico de mi empresa  
**Para** adaptarlo a nuestras necesidades particulares

**Criterios de Aceptación:**
- Puedo usar un constructor visual drag-and-drop
- Puedo agregar diferentes tipos de pasos:
  - Pregunta de texto libre
  - Pregunta numérica con validación
  - Pregunta sí/no
  - Opción múltiple
  - Captura de foto (con o sin IA)
  - Firma digital
  - Checklist de items
- Puedo configurar cada paso:
  - Título y descripción
  - Si es obligatorio u opcional
  - Reglas de validación
  - Configuración de IA (tipo, confianza mínima)
- Puedo previsualizar el workflow antes de guardarlo
- Puedo guardar como borrador o publicar inmediatamente

**Tareas Técnicas:**
- [ ] POST /api/workflows/templates - Crear plantilla personalizada
- [ ] PUT /api/workflows/templates/:id - Actualizar plantilla
- [ ] POST /api/workflows/templates/:id/publish - Publicar plantilla
- [ ] UI: WorkflowBuilder con drag-and-drop
- [ ] UI: Formularios de configuración por tipo de paso
- [ ] UI: Panel de preview del workflow
- [ ] Validación: Schema Zod para estructura de workflow

**Estimación:** 13 puntos  
**Prioridad:** Media  
**Dependencias:** Ninguna

---

## Gestión de Inventario

### US-INV-001: Registrar Entrada de Mercancía
**Como** encargado de almacén  
**Quiero** registrar la mercancía que recibo del proveedor  
**Para** mantener actualizado el inventario y trazabilidad

**Criterios de Aceptación:**
- Puedo escanear el código de barras del producto para identificarlo
- Si el producto no existe, puedo crearlo rápidamente
- Puedo ingresar:
  - Cantidad recibida
  - Número de lote
  - Fecha de caducidad
  - Proveedor
  - Número de factura
- El sistema actualiza automáticamente el stock disponible
- Se genera un registro de movimiento de inventario
- Puedo tomar foto de la mercancía y factura como evidencia

**Tareas Técnicas:**
- [ ] POST /api/inventory/items - Crear producto
- [ ] POST /api/inventory/movements - Registrar movimiento
- [ ] POST /api/inventory/batches - Crear lote
- [ ] PUT /api/inventory/items/:id/quantity - Actualizar stock
- [ ] UI: Formulario de recepción con scanner
- [ ] UI: Búsqueda de productos existentes
- [ ] Servicio: Cálculo automático de nuevo stock

**Estimación:** 8 puntos  
**Prioridad:** Alta  
**Dependencias:** Sistema de productos base

---

### US-INV-002: Alertas de Stock Bajo
**Como** gerente de sucursal  
**Quiero** recibir alertas cuando un producto está por agotarse  
**Para** realizar pedidos a tiempo y evitar desabasto

**Criterios de Aceptación:**
- Puedo configurar el nivel mínimo de stock por producto
- Recibo alertas cuando el stock actual < stock mínimo:
  - Notificación en dashboard
  - Email (configurable)
  - WhatsApp (configurable)
- La alerta incluye:
  - Nombre del producto
  - Stock actual vs stock mínimo
  - Consumo promedio diario
  - Días estimados hasta agotamiento
- Puedo marcar la alerta como "vista" o "en proceso"
- Puedo generar orden de compra directamente desde la alerta

**Tareas Técnicas:**
- [ ] Servicio: Job scheduler para verificar stocks cada hora
- [ ] POST /api/inventory/alerts - Crear alerta
- [ ] GET /api/inventory/alerts?branchId=X - Listar alertas
- [ ] PUT /api/inventory/alerts/:id/acknowledge - Marcar como vista
- [ ] Servicio: Cálculo de consumo promedio
- [ ] Servicio: Envío de notificaciones multi-canal
- [ ] UI: Panel de alertas en dashboard
- [ ] UI: Modal de detalle de alerta

**Estimación:** 8 puntos  
**Prioridad:** Alta  
**Dependencias:** Sistema de notificaciones

---

### US-INV-003: Gestión de Lotes y FIFO
**Como** encargado de almacén  
**Quiero** que el sistema me indique qué lote usar primero  
**Para** cumplir con PEPS (primero en entrar, primero en salir) y evitar caducidades

**Criterios de Aceptación:**
- Cuando registro una salida de inventario, el sistema:
  - Sugiere automáticamente el lote más antiguo disponible
  - Muestra la fecha de caducidad del lote
  - Calcula cuántos días faltan para caducar
- Si el lote sugerido está próximo a caducar (<7 días):
  - Muestra advertencia visual
  - Genera alerta para gerente
- Puedo ver reporte de productos próximos a caducar
- Puedo registrar mermas por caducidad

**Tareas Técnicas:**
- [ ] GET /api/inventory/items/:id/batches?sort=fifo - Obtener lotes FIFO
- [ ] GET /api/inventory/expiring?days=7 - Productos por caducar
- [ ] POST /api/inventory/movements (type=waste) - Registrar merma
- [ ] Servicio: Algoritmo FIFO para sugerencia de lotes
- [ ] Servicio: Job para detectar productos próximos a caducar
- [ ] UI: Selector de lote con indicadores visuales
- [ ] UI: Reporte de próximos vencimientos

**Estimación:** 8 puntos  
**Prioridad:** Media  
**Dependencias:** Sistema de lotes implementado

---

### US-INV-004: Transferencia entre Sucursales
**Como** gerente regional  
**Quiero** transferir productos entre sucursales  
**Para** balancear el inventario y evitar desabasto

**Criterios de Aceptación:**
- Puedo crear una solicitud de transferencia:
  - Sucursal origen
  - Sucursal destino
  - Lista de productos con cantidades
  - Fecha estimada de entrega
- La sucursal origen recibe notificación para preparar el envío
- Al confirmar envío:
  - Se descuenta del inventario de origen
  - Se marca como "en tránsito"
- Al confirmar recepción:
  - Se suma al inventario de destino
  - Se marca como "completada"
- Puedo ver histórico de transferencias
- Se mantiene trazabilidad completa (quién solicitó, aprobó, envió, recibió)

**Tareas Técnicas:**
- [ ] POST /api/inventory/transfers - Crear transferencia
- [ ] PUT /api/inventory/transfers/:id/ship - Confirmar envío
- [ ] PUT /api/inventory/transfers/:id/receive - Confirmar recepción
- [ ] GET /api/inventory/transfers?branchId=X - Listar transferencias
- [ ] POST /api/inventory/movements (type=transfer_out/in)
- [ ] UI: Formulario de solicitud de transferencia
- [ ] UI: Vista de tracking de transferencia
- [ ] Servicio: Notificaciones de cambios de estado

**Estimación:** 13 puntos  
**Prioridad:** Baja  
**Dependencias:** Sistema de notificaciones, múltiples sucursales

---

## Gestión Laboral

### US-LAB-001: Registrar Entrada/Salida (Clock In/Out)
**Como** empleado  
**Quiero** registrar mi entrada y salida del trabajo desde mi teléfono  
**Para** llevar control preciso de mis horas trabajadas

**Criterios de Aceptación:**
- Puedo registrar mi entrada al llegar:
  - Con un botón en la app
  - Mediante mensaje de WhatsApp ("entrada" o "clock in")
- El sistema captura automáticamente:
  - Hora exacta
  - Ubicación GPS (para validar que estoy en la sucursal)
- Recibo confirmación inmediata del registro
- Puedo ver mi hora de entrada registrada
- Puedo registrar mi salida con el mismo proceso
- El sistema calcula automáticamente:
  - Horas trabajadas
  - Tiempo de pausas
  - Horas extras si aplica

**Tareas Técnicas:**
- [ ] POST /api/labor/time-punch - Registrar entrada/salida
- [ ] GET /api/labor/time-punch/current - Obtener registro activo
- [ ] Servicio: Validación de geolocalización
- [ ] Servicio: Cálculo de horas trabajadas
- [ ] Integración WhatsApp: Comando "entrada"/"salida"
- [ ] UI: Botón de clock in/out con estado visual
- [ ] UI: Resumen de horas del día

**Estimación:** 8 puntos  
**Prioridad:** Alta  
**Dependencias:** Integración WhatsApp básica

---

### US-LAB-002: Gestión de Pausas/Breaks
**Como** empleado  
**Quiero** registrar mis pausas obligatorias  
**Para** cumplir con la ley laboral y tener un descanso apropiado

**Criterios de Aceptación:**
- El sistema me recuerda cuando debo tomar una pausa (según horas trabajadas):
  - 30 min para jornadas de 8 horas
  - 15 min para jornadas de 4-6 horas
- Puedo registrar inicio y fin de pausa:
  - Con botón en la app
  - Mediante WhatsApp ("pausa" / "fin pausa")
- El sistema me alerta si:
  - Llevo más de 4 horas sin tomar pausa
  - Mi pausa excede el tiempo permitido
- Puedo ver historial de mis pausas del día
- Las pausas NO cuentan como tiempo trabajado

**Tareas Técnicas:**
- [ ] POST /api/labor/breaks - Registrar pausa
- [ ] GET /api/labor/breaks/active - Obtener pausa activa
- [ ] Servicio: Recordatorios de pausas obligatorias
- [ ] Servicio: Validación de duración de pausas
- [ ] Integración WhatsApp: Comandos de pausa
- [ ] UI: Botón de inicio/fin de pausa
- [ ] UI: Timer de pausa activa

**Estimación:** 5 puntos  
**Prioridad:** Alta  
**Dependencias:** US-LAB-001

---

### US-LAB-003: Asignación de Turnos
**Como** gerente de sucursal  
**Quiero** asignar turnos semanales a mis empleados  
**Para** organizar la operación y cumplir con requerimientos de personal

**Criterios de Aceptación:**
- Puedo ver un calendario semanal con todos mis empleados
- Puedo arrastrar y soltar empleados en los turnos del día
- Puedo crear diferentes tipos de turno:
  - Matutino (ej: 6am-2pm)
  - Vespertino (ej: 2pm-10pm)
  - Nocturno (ej: 10pm-6am)
  - Personalizado
- El sistema valida:
  - No asignar más de 6 días consecutivos sin descanso
  - Mínimo 11 horas entre turnos
  - No exceder 48 horas semanales regulares
- Cada empleado recibe notificación de sus turnos asignados
- Puedo exportar el calendario a PDF

**Tareas Técnicas:**
- [ ] POST /api/labor/shifts - Crear turno
- [ ] POST /api/labor/assignments - Asignar empleado a turno
- [ ] GET /api/labor/assignments/calendar - Obtener calendario
- [ ] Servicio: Validación de ley laboral mexicana
- [ ] Servicio: Notificaciones de asignación
- [ ] UI: Calendario drag-and-drop
- [ ] UI: Validación visual de conflictos
- [ ] Servicio: Generación de PDF

**Estimación:** 13 puntos  
**Prioridad:** Media  
**Dependencias:** Sistema de notificaciones

---

### US-LAB-004: Control de Horas Extras
**Como** gerente de sucursal  
**Quiero** que el sistema detecte y calcule automáticamente las horas extras  
**Para** cumplir con la ley y pagar correctamente a mis empleados

**Criterios de Aceptación:**
- El sistema detecta automáticamente cuando un empleado:
  - Trabaja más de 8 horas en un día
  - Trabaja más de 48 horas en una semana
- Calcula correctamente según ley mexicana:
  - Primeras 9 horas extras semanales: pago doble
  - Horas 10+: pago triple
- Me alerta si se exceden límites legales:
  - Más de 3 horas extras en un día
  - Más de 3 días con horas extras en una semana
- Genero reporte de horas extras por empleado y período
- Puedo aprobar o rechazar horas extras registradas

**Tareas Técnicas:**
- [ ] Servicio: Cálculo automático de horas extras
- [ ] Servicio: Validación de límites legales
- [ ] GET /api/labor/overtime?period=week - Reporte de horas extras
- [ ] POST /api/labor/overtime/:id/approve - Aprobar horas extras
- [ ] UI: Dashboard de horas extras
- [ ] UI: Alertas visuales de excesos
- [ ] Servicio: Alertas automáticas a gerentes

**Estimación:** 8 puntos  
**Prioridad:** Alta  
**Dependencias:** US-LAB-001, Sistema de cálculo implementado

---

### US-LAB-005: Expediente Laboral Digital
**Como** gerente de RH  
**Quiero** mantener los documentos de cada empleado digitalizados  
**Para** cumplir con auditorías laborales y tener acceso rápido

**Criterios de Aceptación:**
- Puedo subir documentos por empleado:
  - Acta de nacimiento
  - INE
  - RFC
  - NSS
  - Comprobante de domicilio
  - Contrato laboral
  - Constancias de capacitación
- El sistema me indica qué documentos faltan por empleado
- Me alerta cuando un documento está por vencer
- Puedo ver todos los documentos de un empleado en una vista
- Puedo descargar documentos individuales o el expediente completo
- El sistema mantiene log de quién subió/accedió cada documento

**Tareas Técnicas:**
- [ ] POST /api/labor/documents - Subir documento
- [ ] GET /api/labor/documents?userId=X - Listar documentos
- [ ] GET /api/labor/documents/:id/download - Descargar documento
- [ ] DELETE /api/labor/documents/:id - Eliminar documento
- [ ] Servicio: Validación de documentos faltantes
- [ ] Servicio: Alertas de vencimiento
- [ ] UI: Gestor de documentos por empleado
- [ ] UI: Indicadores de completitud
- [ ] Servicio: Almacenamiento seguro en R2

**Estimación:** 8 puntos  
**Prioridad:** Media  
**Dependencias:** Sistema de almacenamiento configurado

---

## Integración WhatsApp

### US-WA-001: Registro de Usuario vía WhatsApp
**Como** nuevo empleado  
**Quiero** registrarme en Pulso desde WhatsApp  
**Para** comenzar a usar el sistema sin descargar otra app

**Criterios de Aceptación:**
- Puedo iniciar conversación con el número de Pulso
- El bot me guía paso a paso:
  1. Solicita código de empresa
  2. Valida el código
  3. Solicita mi nombre completo
  4. Confirma mi información
- Recibo un enlace para completar mi perfil
- Mi número queda vinculado a mi cuenta
- Puedo usar comandos sin necesidad de login

**Tareas Técnicas:**
- [ ] POST /api/whatsapp/webhook - Recibir mensajes
- [ ] Servicio: Flujo de conversación de registro
- [ ] POST /api/whatsapp/users - Vincular usuario
- [ ] Servicio: Generación de tokens de verificación
- [ ] Servicio: Envío de mensajes de bienvenida
- [ ] UI: Página de completar perfil
- [ ] Base de datos: Tabla whatsapp_users

**Estimación:** 8 puntos  
**Prioridad:** Alta  
**Dependencias:** Integración WasenderAPI configurada

---

### US-WA-002: Ejecución de Workflow por WhatsApp
**Como** empleado  
**Quiero** completar mi checklist de apertura desde WhatsApp  
**Para** no tener que usar otra aplicación

**Criterios de Aceptación:**
- Recibo mensaje cuando tengo workflow asignado:
  ```
  🌅 Tienes un nuevo checklist: Apertura de Turno
  Toca aquí para empezar: [enlace]
  ```
- Al tocar el enlace, el bot me guía:
  1. Muestra instrucciones del paso
  2. Solicita evidencia (foto, texto, etc.)
  3. Valida mi respuesta
  4. Me indica si todo está correcto
  5. Pasa al siguiente paso
- Puedo pausar y retomar después
- Recibo confirmación cuando completo todo:
  ```
  ✅ Checklist completado. ¡Buen trabajo!
  ```

**Tareas Técnicas:**
- [ ] Servicio: Generación de deep links para workflows
- [ ] Servicio: Gestor de sesiones de conversación
- [ ] Servicio: Parser de respuestas en lenguaje natural
- [ ] Integración: Subida de fotos desde WhatsApp
- [ ] Servicio: Validación de respuestas
- [ ] UI: Landing page para enlaces de workflows
- [ ] Servicio: Manejo de estado de conversación

**Estimación:** 13 puntos  
**Prioridad:** Alta  
**Dependencias:** US-WA-001, Sistema de workflows

---

### US-WA-003: Comandos Laborales por WhatsApp
**Como** empleado  
**Quiero** registrar mi entrada, salida y pausas por WhatsApp  
**Para** tener una forma rápida y accesible de marcar asistencia

**Criterios de Aceptación:**
- Puedo enviar comandos simples:
  - "entrada" o "clock in" → registra entrada
  - "salida" o "clock out" → registra salida
  - "pausa" o "break" → inicia pausa
  - "fin pausa" o "end break" → termina pausa
  - "horas" o "status" → muestra resumen del día
- El bot responde inmediatamente con confirmación:
  ```
  ✅ Entrada registrada a las 8:02 AM
  Sucursal: Centro
  ```
- Si hay algún problema (ej: ya registré entrada), me lo indica:
  ```
  ⚠️ Ya tienes una entrada registrada hoy a las 8:02 AM
  ```
- Puedo ver mi resumen del día:
  ```
  📊 Resumen de hoy:
  ⏰ Entrada: 8:02 AM
  ☕ Pausa: 12:00 PM - 12:30 PM
  ⏰ Salida: Pendiente
  ⏱️ Horas trabajadas: 3h 58m
  ```

**Tareas Técnicas:**
- [ ] Servicio: Parser de comandos laborales
- [ ] Servicio: Validación de comandos duplicados
- [ ] Servicio: Generación de respuestas contextuales
- [ ] Integración: Llamadas a API de labor
- [ ] Servicio: Formateo de mensajes de resumen
- [ ] Servicio: Manejo de errores y validaciones

**Estimación:** 8 puntos  
**Prioridad:** Alta  
**Dependencias:** US-WA-001, US-LAB-001

---

### US-WA-004: Notificaciones Automáticas
**Como** empleado  
**Quiero** recibir recordatorios de mis tareas pendientes por WhatsApp  
**Para** no olvidar completar mis responsabilidades

**Criterios de Aceptación:**
- Recibo notificaciones automáticas:
  - Nueva asignación de workflow
  - Recordatorio 30 min antes de vencimiento
  - Alerta de workflow vencido
  - Confirmación de aprobación/rechazo
- Las notificaciones incluyen:
  - Emoji relevante
  - Descripción clara
  - Enlace rápido de acción
- Puedo configurar mis preferencias:
  - Horario de notificaciones
  - Tipos de notificaciones
  - Canales (WhatsApp + email o solo WhatsApp)
- No recibo notificaciones fuera de mi horario laboral

**Tareas Técnicas:**
- [ ] Servicio: Sistema de cola de notificaciones
- [ ] Servicio: Programador de recordatorios
- [ ] POST /api/notifications/preferences - Guardar preferencias
- [ ] Servicio: Filtrado por horario laboral
- [ ] Servicio: Envío batch de notificaciones
- [ ] Servicio: Tracking de estado de entrega
- [ ] UI: Panel de preferencias de notificaciones

**Estimación:** 8 puntos  
**Prioridad:** Media  
**Dependencias:** US-WA-001

---

## Reportes y Analytics

### US-REP-001: Dashboard Ejecutivo en Tiempo Real
**Como** dueño de cadena de restaurantes  
**Quiero** ver el estado de todas mis sucursales en un dashboard  
**Para** tomar decisiones informadas rápidamente

**Criterios de Aceptación:**
- Veo KPIs principales en tarjetas:
  - Workflows completados hoy (% del total)
  - Alertas activas por prioridad
  - Stock crítico (#productos)
  - Horas trabajadas hoy
  - Costo de operación del día
- Puedo filtrar por:
  - Período (hoy, semana, mes, custom)
  - Sucursal específica o todas
- Veo gráficas de tendencias:
  - Completitud de workflows (línea temporal)
  - Distribución de alertas (pie chart)
  - Comparativo entre sucursales (barras)
- Los datos se actualizan automáticamente cada 5 minutos
- Puedo exportar el dashboard a PDF

**Tareas Técnicas:**
- [ ] GET /api/analytics/executive-dashboard
- [ ] Servicio: Agregación de métricas en tiempo real
- [ ] Servicio: Cache de métricas (Redis)
- [ ] UI: Componentes de KPI cards
- [ ] UI: Gráficas con Recharts
- [ ] UI: Filtros de período y sucursal
- [ ] Servicio: Auto-refresh con polling
- [ ] Servicio: Generación de PDF

**Estimación:** 13 puntos  
**Prioridad:** Alta  
**Dependencias:** Datos de workflows, inventario, labor

---

### US-REP-002: Reporte de Cumplimiento Laboral
**Como** gerente de RH  
**Quiero** generar un reporte de cumplimiento laboral mensual  
**Para** auditorías y asegurar que cumplimos con la ley

**Criterios de Aceptación:**
- Puedo generar reporte por período (semanal, mensual, trimestral)
- El reporte incluye:
  - Horas trabajadas por empleado
  - Horas extras (detalladas por tipo)
  - Días de descanso
  - Pausas tomadas
  - Incidencias (retardos, faltas)
  - Documentos faltantes o vencidos
- Identifica violaciones:
  - Jornadas >48 horas semanales
  - Menos de 1 día de descanso por semana
  - Horas extras excesivas
  - Documentos faltantes
- Puedo exportar en:
  - PDF para imprimir
  - Excel para análisis
  - CSV para integración
- El reporte muestra % de cumplimiento general

**Tareas Técnicas:**
- [ ] GET /api/reports/labor-compliance
- [ ] Servicio: Cálculo de métricas de cumplimiento
- [ ] Servicio: Detección de violaciones
- [ ] Servicio: Generación de PDF con formato
- [ ] Servicio: Exportación a Excel/CSV
- [ ] UI: Formulario de generación de reporte
- [ ] UI: Vista previa de reporte
- [ ] UI: Indic