# Documentación Técnica - Biblioteca de Plantillas Pulso

## Estructura del Código

### Directorio de Plantillas
```
templates/
├── index.ts                 # Exportación principal y funciones de acceso
├── README.md               # Documentación general
├── user-guide.md           # Guía de usuario
├── operaciones_diarias/    # Plantillas para operaciones diarias
├── control_calidad/        # Plantillas para control de calidad
├── mantenimiento/          # Plantillas para mantenimiento
└── seguridad/              # Plantillas para seguridad
```

### Estructura de una Plantilla
Cada plantilla sigue la siguiente estructura:

```typescript
interface Template {
  id: string;                    // ID único de la plantilla
  nombre: string;               // Nombre descriptivo
  descripcion: string;          // Descripción detallada
  tipo: string;                 // Categoría funcional (APERTURA_CIERRE, INSPECCION, etc.)
  categoria: string;            // Categoría de agrupación
  icon: string;                 // Icono visualizador
  duracionEstimada: string;     // Tiempo estimado de ejecución
  frecuencia: string;           // Frecuencia de uso
  cumplimientoNormativo: string[]; // Normas que cumple
  tags: string[];               // Etiquetas para búsqueda
  version: number;              // Versión de la plantilla
  activo: boolean;              // Estado de la plantilla
  requiereIA: boolean;          // Indica si requiere IA
  aiConfig?: AIConfig;          // Configuración de IA (opcional)
  alertConfig?: AlertConfig;    // Configuración de alertas (opcional)
  pasos: Paso[];                // Array de pasos del workflow
  onComplete?: OnCompleteConfig; // Configuración post-completado (opcional)
}
```

### Tipos de Campos Soportados
- TextField: Campo de texto simple
- NumberField: Campo numérico
- SelectField: Selección de opciones
- CheckboxField: Casilla de verificación
- PhotoField: Campo para fotografías
- DateTimeField: Fecha y hora
- TitleField: Título de sección
- ParagraphField: Párrafo de texto
- SubTitleField: Subtítulo
- SeparatorField: Separador visual
- DateField: Solo fecha
- TextareaField: Área de texto largo
- SignatureField: Firma digital

## Funciones de Acceso a Plantillas

### Funciones Disponibles
```typescript
// Obtiene una plantilla por ID
getTemplateById(id: string): Template | undefined

// Obtiene todas las plantillas
getAllTemplates(): Template[]

// Obtiene plantillas por categoría
getTemplatesByCategory(category: string): Template[]

// Obtiene plantillas por tipo
getTemplatesByType(type: string): Template[]
```

## Implementación en la Interfaz de Usuario

### Componente de Selección de Plantillas
El componente `TemplateSelector` permite a los usuarios buscar, filtrar y seleccionar plantillas:

```tsx
<TemplateSelector onSelectTemplate={(template) => {
  // Manejar la selección de la plantilla
}} />
```

### Personalización de Plantillas
El componente `TemplateCustomization` permite a los usuarios personalizar plantillas existentes:

```tsx
<TemplateCustomization 
  template={selectedTemplate} 
  onSave={handleSaveCustomizedTemplate} 
/>
```

## Integración con el Sistema de Workflows

### Flujo de Trabajo
1. El usuario selecciona una plantilla
2. La plantilla se carga en el constructor de workflows
3. Se pueden hacer modificaciones si es necesario
4. El workflow se ejecuta en el canal apropiado (WhatsApp, web, etc.)

### Configuración de IA
Las plantillas pueden incluir configuración de IA:

```typescript
aiVerification?: {
  enabled: boolean;
  type: 'OCR' | 'ANALISIS_CALIDAD' | 'OTRO';
  provider: 'moondream' | 'openai' | 'hybrid';
  prompt: string;
  autoFillField?: string;
  confidence_threshold: number;
}
```

## Validaciones y Reglas

### Estructura de Validación
```typescript
validation?: {
  type?: string;
  min?: number;
  max?: number;
  rules: ValidationRule[];
}

interface ValidationRule {
  condition: string;    // Condición en formato de código (ej. "value > 4")
  result: 'PASS' | 'WARNING' | 'CRITICAL';
  message: string;
  action?: string;
  alertConfig?: AlertConfig;
}
```

## Configuración de Alertas

### Tipos de Alertas
- `onCriticalTemperature`: Para alertas de temperatura
- `onHighWaste`: Para alertas de mermas
- `onQualityIssue`: Para alertas de calidad
- `onEquipmentFailure`: Para alertas de equipo

### Configuración de Alertas
```typescript
alertConfig?: {
  onCriticalTemperature?: {
    priority: string;
    notifyRoles: string[];
    channels: string[];
    escalateAfterMinutes: number;
  };
  // Otros tipos de alertas...
}
```

## API y Endpoints

### Endpoints Principales
- `GET /api/templates` - Obtener lista de plantillas
- `GET /api/templates/:id` - Obtener una plantilla específica
- `POST /api/templates/customize` - Guardar plantilla personalizada
- `GET /api/templates/categories` - Obtener categorías disponibles

## Consideraciones de Seguridad

### Validación de Datos
- Todos los datos de entrada deben ser validados
- Se debe implementar sanitización de entradas
- Verificación de permisos por rol de usuario

### Gestión de Acceso
- Control de acceso basado en roles (RBAC)
- Filtrado de plantillas por tenant en sistemas multi-sucursal
- Auditoría de cambios en plantillas

## Pruebas y Calidad

### Tipos de Pruebas
- Pruebas unitarias para funciones de acceso a plantillas
- Pruebas de integración para el sistema de workflows
- Pruebas de UI para componentes de selección y personalización
- Pruebas de carga para sistemas multi-tenant

## Despliegue y Mantenimiento

### Actualización de Plantillas
- Las plantillas se pueden actualizar sin interrupciones
- Se mantiene historial de versiones
- Se notifica a usuarios sobre actualizaciones importantes

### Monitorización
- Seguimiento de uso de plantillas
- Métricas de completitud de workflows
- Monitoreo de fallos en verificaciones por IA
- Reportes de cumplimiento normativo

## Extensiones y Personalización

### Crear Nuevas Plantillas
Para crear nuevas plantillas, seguir estos pasos:

1. Crear archivo JSON en directorio correspondiente
2. Seguir estructura estándar de plantilla
3. Añadir a `templates/index.ts`
4. Probar en ambiente de desarrollo
5. Desplegar a producción

### Personalización por Cliente
- Las plantillas base se mantienen inmutables
- Se crean copias personalizadas por cliente
- Se permite herencia de plantillas base

## Errores Comunes y Soluciones

### Error: Plantilla no encontrada
**Causa:** ID de plantilla incorrecto o plantilla eliminada
**Solución:** Verificar ID y lista de plantillas disponibles

### Error: Fallo en verificación por IA
**Causa:** Problemas de conexión o baja calidad de imagen
**Solución:** Reintentar y verificar calidad de imagen

### Error: Validación incorrecta
**Causa:** Reglas de validación mal configuradas
**Solución:** Revisar condiciones en la configuración de validación

---

*Documentación actualizada el: 08/12/2025*
*Versión: 1.0*