# 📅 Sistema Unificado de Gestión de Turnos

## 🎯 Descripción General

El sistema unificado combina las mejores características de **Schedule Builder** y **Shifts** en una sola interfaz potente y flexible.

---

## ✨ Nuevas Funcionalidades

### 1. **📊 Tres Vistas Integradas**

| Vista | Descripción | Mejor Para |
|-------|-------------|------------|
| **Matriz** | Tabla semanal (empleados × días) | Edición rápida día por día |
| **Calendario** | Panel de asignación masiva | Asignar turnos con patrones |
| **Lista** | Lista detallada de turnos | Revisión y auditoría |

---

### 2. **🔄 Asignación Masiva Avanzada**

**Patrones de Repetición:**
- 🔹 **Solo este día**: Asignación única
- 🔹 **Diario**: Todos los días hasta fecha fin
- 🔹 **Semanal**: Cada 7 días (mismo día de semana)
- 🔹 **Personalizado**: Días específicos (Lun, Mié, Vie)

**Características:**
- ✅ Selección múltiple de empleados con checkboxes
- ✅ Configuración de tipo de turno (Matutino, Vespertino, Nocturno, Mixto)
- ✅ Horarios personalizados
- ✅ Vista previa del resumen

---

### 3. **🏢 Filtros Avanzados**

**Filtrar por:**
- 📍 **Sucursal**: Ver empleados de una ubicación específica
- 👔 **Rol**: Cocinero, Mesero, Cajero, Limpieza, Seguridad
- 🔍 **Búsqueda**: Buscar por nombre o rol

**Indicadores:**
- 🚨 **Contador de conflictos**: Muestra advertencias en tiempo real

---

### 4. **📋 Plantillas de Turnos**

**Plantillas Predefinidas:**

| Plantilla | Turnos Incluídos |
|-----------|-------------------|
| **Restaurante Completo** | 2 Cocineros, 2 Meseros, 1 Cajero, 1 Limpieza |
| **Turno Mañana** | 1 Cocinero, 1 Mesero, 1 Cajero (7:00-15:00) |
| **Turno Tarde** | 1 Cocinero, 1 Mesero, 1 Cajero (15:00-23:00) |
| **Fin de Semana** | Personal reducido con seguridad |

**Características:**
- ✅ Aplicar plantilla con un clic
- ✅ Vista previa de turnos incluidos
- ✅ Crear plantillas personalizadas (se guardan en localStorage)
- ✅ Fecha de aplicación flexible

---

### 5. **📋 Copiar Semana Anterior**

**Funcionalidad:**
- 📅 Seleccionar semana de origen
- 🔄 Copiar todos los turnos automáticamente
- ⏭️ Ajuste automático de fechas

**Casos de Uso:**
- Rotaciones semanales fijas
- Horarios recurrentes
- Ahorrar tiempo en planificación

---

### 6. **📤 Exportación de Horarios**

**Formatos Disponibles:**

| Formato | Uso | Características |
|---------|-----|-----------------|
| **Excel (.xlsx)** | Edición posterior | Formato estructurado, fórmulas |
| **CSV** | Importar a otros sistemas | Compatible con cualquier software |
| **PDF** | Imprimir/Compartir | Formato final, listo para publicar |

**Datos Exportados:**
- Empleado
- Rol
- Fecha
- Hora inicio/fin
- Estado (Borrador/Publicado)
- Notas

---

### 7. **⚠️ Detección de Conflictos**

**Tipos de Conflictos:**

| Tipo | Descripción | Acción |
|------|-------------|--------|
| 🔴 **Error** | Turnos superpuestos | Eliminar o ajustar uno |
| 🟡 **Advertencia** | Turno > 12 horas | Revisar cumplimiento legal |

**Detección Automática:**
- ✅ Superposición de horarios para mismo empleado
- ✅ Turnos que exceden 12 horas (límite legal NOM-035)
- ✅ Indicadores visuales en la interfaz

**Indicadores Visuales:**
- 🚨 Icono de alerta en turnos con conflicto
- 🔴 Borde rojo para errores críticos
- 🟡 Borde amarillo para advertencias

---

### 8. **⚡ Turnos Rápidos Predefinidos**

**Botones de Acceso Rápido:**

| Turno | Horario | Color |
|-------|---------|-------|
| **Matutino** | 07:00 - 15:00 | 🔵 Azul |
| **Vespertino** | 15:00 - 23:00 | 🟠 Naranja |
| **Nocturno** | 23:00 - 07:00 | 🟣 Morado |
| **Mixto** | 10:00 - 18:00 | 🟢 Verde |

---

### 9. **📝 Gestión de Turnos Individuales**

**Desde la Vista Matriz:**
- ➕ **Añadir**: Click en celda vacía
- ✏️ **Editar**: Click en turno existente
- 🗑️ **Eliminar**: Botón en hover
- 👁️ **Ver detalles**: Badge con horario

**Desde la Vista Lista:**
- 📋 Todos los turnos ordenados por fecha/hora
- 🔍 Información completa de cada turno
- ⚡ Acciones rápidas (editar, eliminar)

---

### 10. **💾 Guardar y Publicar**

**Estados de Turno:**

| Estado | Descripción | Color |
|--------|-------------|-------|
| **Borrador** | En planificación, editable | Gris |
| **Publicado** | Confirmado, notificado a empleados | Verde |

**Flujo Recomendado:**
1. Crear turnos en modo **Borrador**
2. Revisar conflictos y ajustes
3. **Guardar** cambios localmente
4. **Publicar** cuando esté confirmado

---

## 🎨 Interfaz de Usuario

### **Barra de Herramientas Superior**

```
┌─────────────────────────────────────────────────────────────────┐
│  [◀] 15-21 Ene, 2025 [▶]  [Matriz] [Calendario] [Lista]       │
│                                                                  │
│  [📋 Plantilla] [📋 Copiar] [📤 Exportar] [🔄 Masivo]          │
│  [💾 Guardar] [👁 Publicar]                                     │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Filtros: [Sucursal ▼] [Rol ▼] [Buscar...]  🚨 2 conflictos│
└─────────────────────────────────────────────────────────────────┘
```

### **Vista Matriz**

```
┌────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────┐
│ Empleado   │ Lun  │ Mar  │ Mié  │ Jue  │ Vie  │ Sáb  │ Dom      │
├────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│ 👤 Juan    │ 07-15│ 07-15│      │ 07-15│      │      │          │
│  COCINERO  │ ✏️🗑️ │ ✏️🗑️ │ ➕   │ ✏️🗑️ │ ➕   │ ➕   │ ➕       │
├────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│ 👤 María   │      │ 15-23│ 15-23│      │ 15-23│      │          │
│  MESERO    │ ➕   │ ✏️🗑️ │ ✏️🗑️ │ ➕   │ ✏️🗑️ │ ➕   │ ➕       │
└────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────────┘
```

### **Vista Lista**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Lista de Turnos (12 turnos)                                  │
├─────────────────────────────────────────────────────────────────┤
│ 👤 Juan Pérez                                                   │
│    [COCINERO] 📅 Lunes 15 de Enero 🕐 07:00 - 15:00            │
│    [Borrador] 🗑️                                                │
├─────────────────────────────────────────────────────────────────┤
│ 👤 María García                                                 │
│    [MESERO] 📅 Martes 16 de Enero 🕐 15:00 - 23:00             │
│    [Publicado] ⚠️ Conflicto 🗑️                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuración y Personalización

### **Crear Plantilla Personalizada**

```javascript
// Se guardan en localStorage
const customTemplate = {
    id: "mi-plantilla",
    name: "Turno Especial",
    shifts: [
        { role: "COCINERO", startTime: "06:00", endTime: "14:00" },
        { role: "MESERO", startTime: "08:00", endTime: "16:00" },
    ]
}
localStorage.setItem("shift-templates", JSON.stringify([
    ...DEFAULT_TEMPLATES,
    customTemplate
]))
```

### **Colores por Turno**

Editables en `SHIFT_TYPES` dentro del componente:

```typescript
const SHIFT_TYPES = {
    MATUTINO: { 
        label: "Matutino", 
        start: "07:00", 
        end: "15:00", 
        color: "bg-blue-500" 
    },
    // ... más tipos
}
```

---

## 📊 Flujo de Trabajo Recomendado

### **Planificación Semanal Típica**

1. **Lunes**: Revisar semana entrante
2. **Martes**: Usar plantilla "Restaurante Completo"
3. **Miércoles**: Ajustes individuales (ausencias, eventos)
4. **Jueves**: Revisar conflictos
5. **Viernes**: Publicar horarios
6. **Sábado**: Exportar PDF para imprimir

### **Atajos de Teclado** (Próximamente)

| Tecla | Acción |
|-------|--------|
| `Ctrl + S` | Guardar |
| `Ctrl + P` | Publicar |
| `Ctrl + F` | Buscar empleado |
| `Esc` | Cerrar dialogos |

---

## 🚀 Próximas Funcionalidades

- [ ] Notificaciones automáticas a empleados (WhatsApp/Email)
- [ ] Intercambio de turnos entre empleados
- [ ] Aprobación de cambios por gerente
- [ ] Historial de cambios (audit log)
- [ ] Estadísticas de horas trabajadas
- [ ] Integración con nómina
- [ ] Vista móvil optimizada
- [ ] Turnos extras / horas extra
- [ ] Vacaciones y ausencias
- [ ] Reportes de cumplimiento NOM-035

---

## 🛠️ Soporte Técnico

### **Problemas Comunes**

| Problema | Solución |
|----------|----------|
| No carga empleados | Verificar conexión API `/api/users` |
| Conflictos no detectados | Recargar página (F5) |
| Exportación falla | Verificar permisos de descarga |
| Plantillas no guardan | Limpiar localStorage |

### **Requisitos del Sistema**

- ✅ Next.js 16.1.6+
- ✅ React 18+
- ✅ Navegador moderno (Chrome, Firefox, Edge)
- ✅ JavaScript habilitado
- ✅ LocalStorage disponible

---

## 📞 Contacto

Para reportar bugs o solicitar funcionalidades, contactar al equipo de desarrollo.
