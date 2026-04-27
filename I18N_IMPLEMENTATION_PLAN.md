# Plan de Implementación i18n - Pulso HORECA

## Estado del Proyecto

**Objetivo:** Migrar toda la aplicación al español usando next-intl
**Locale objetivo:** es (Español para México - Restaurantes HORECA)
**Fecha inicio:** Abril 2026
**Estado actual:** Fases 1-2 Completadas

---

## ✅ FASES COMPLETADAS

### Fase 1: Configuración Base i18n ✅
**Estado:** COMPLETADA

**Archivos creados/modificados:**
- ✅ `messages/es.json` - Archivo de traducciones completo (~800 claves)
- ✅ `i18n/routing.ts` - Configuración de rutas i18n
- ✅ `i18n/config.ts` - Configuración de next-intl
- ✅ `middleware.ts` → integrado en `proxy.ts` - Middleware i18n
- ✅ `next.config.ts` - Configuración actualizada con next-intl plugin
- ✅ `app/layout.tsx` - Layout raíz con NextIntlClientProvider

**Decisiones técnicas:**
- Locale único: 'es' (español)
- Sin prefijo de locale en URLs (`localePrefix: 'never'`)
- HTML lang="es"
- Middleware integrado en proxy.ts existente (no archivo separado)

---

### Fase 2: Páginas de Autenticación y Validaciones ✅
**Estado:** COMPLETADA

**Archivos migrados:**
- ✅ `app/sign-in/page.tsx` - Usa `useTranslations('auth.signIn')`
- ✅ `app/sign-up/page.tsx` - Usa `useTranslations('auth.signUp')`

**Validaciones Zod traducidas:**
- ✅ `lib/validations/user.ts`
- ✅ `lib/validations/branch.ts`
- ✅ `lib/validations/workflow-scheduling.ts`

**Componentes parcialmente migrados:**
- ✅ `components/employees/professional-dialog.tsx` - Completamente traducido

---

## 📋 FASES PENDIENTES

### Fase 3: Migrar Componentes Principales del Dashboard
**Prioridad:** ALTA
**Estado:** ✅ COMPLETADA

#### Componentes migrados:

1. **✅ Sidebar y Navegación**
   - ✅ `components/nav-main.tsx` - Label "Platform" migrado a i18n
   - ✅ `components/nav-company.tsx` - "Select Branch", "Add branch", toast messages migrados
   - ✅ `components/nav-user.tsx` - "Upgrade to Pro", "Account", "Billing", "Notifications", "Log out" migrados

2. **✅ Dashboard Principal**
   - ✅ `app/dashboard/page.tsx` - Título, subtítulo, "Actividad Reciente", tipo de comunicación migrados

3. **✅ Tablas y Listados**
   - ✅ `components/workflow/workflow-history-table.tsx` - Placeholders, filtros, estados, columnas, botones migrados
   - ✅ `components/labor/weekly-shift-planner.tsx` - Toast messages, labels migrados (parcial)

4. **Formularios de Equipos** (Pendientes para Fase 4)
   - ⏳ `components/equipment/equipment-form.tsx`
   - ⏳ `components/equipment/equipment-catalog-form.tsx`
   - ⏳ `components/equipment/maintenance-form.tsx`
   - ⏳ `components/equipment/compliance-service-form.tsx`
   - ⏳ `components/equipment/service-provider-form.tsx`

#### Traducciones agregadas a messages/es.json:
- `navigation.platform` - "Plataforma"
- `navigation.selectBranch` - "Seleccionar Sucursal"
- `navigation.addBranch` - "Agregar Sucursal"
- `navigation.upgradeToPro` - "Actualizar a Pro"
- `navigation.account` - "Cuenta"
- `navigation.billing` - "Facturación"
- `navigation.notifications` - "Notificaciones"
- `dashboard.executive.title`, `subtitle`, `recentActivity`
- `dashboard.executive.announcement`, `notification`, `message`
- `dashboard.executive.noName`, `unassigned`
- `workflows.history.status.pending`, `inProgress`, `completed`, `blocked`, `failed`, `cancelled`
- Extensión de `common.*` con más de 50 claves nuevas

#### Ejemplo de migración para componentes:

```typescript
// ANTES (hardcoded español)
export function MiComponente() {
  return (
    <div>
      <h1>Dashboard Ejecutivo</h1>
      <p>Control operativo y cumplimiento</p>
      <Button>Guardar</Button>
    </div>
  );
}

// DESPUÉS (con i18n)
"use client";
import { useTranslations } from "next-intl";

export function MiComponente() {
  const t = useTranslations("dashboard.executive");
  const tCommon = useTranslations("common");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <Button>{tCommon("save")}</Button>
    </div>
  );
}
```

---

### Fase 4: Migrar Formularios de Empleados y Laboral
**Prioridad:** ALTA
**Estado:** PENDIENTE

#### Archivos a migrar:

1. **Empleados - Información Personal**
   - `components/employees/personal-info-form.tsx` - Placeholders en inglés:
     - `"Select gender"` → `"Seleccionar género"`
     - `"Select status"` → `"Seleccionar estado"`
     - `"Select blood type"` → `"Seleccionar tipo de sangre"`
     - `"Social Security Number"` → `"Número de Seguro Social"`
     - `"Select bank"` → `"Seleccionar banco"`
     - `"Select method"` → `"Seleccionar método"`
   - Labels en inglés: "Employee Number", "Position", "Department", etc.

2. **Empleados - Información Profesional**
   - `components/employees/contract-dialog.tsx` - Placeholders:
     - `"Select contract type"`
     - `"Select work regime"`
     - `"Additional benefits or notes..."`
     - `"Specific terms and conditions..."`

3. **Laboral**
   - `components/labor/schedule-builder.tsx`
   - `components/labor/leave-request-form.tsx` - `"Select leave type"`
   - `components/labor/shift-change-request-list.tsx`
   - `components/labor/unified-shift-scheduler.tsx`

#### Mensajes Zod en validaciones de empleados:
Verificar si existen archivos de validación para empleados y traducirlos.

---

### Fase 5: Migrar Constructor de Workflows (Builder)
**Prioridad:** MEDIA
**Estado:** PENDIENTE

#### Archivos a migrar:

1. **Componentes del Builder**
   - `components/builder/property-editor.tsx` - Placeholders:
     - `"Placeholder text..."`
     - `"Default value..."`
     - `"Value out of range"`
     - `"Time out of range"`
   - `components/builder/builder-header.tsx`
   - `components/builder/workflow-settings-modal.tsx` - `"Add custom tag..."`, `"Add completion action..."`
   - `components/builder/logic-rule-card.tsx` - `"Temperature exceeds safe limit"`, etc.

2. **Ejecución de Workflows**
   - `components/execution/workflow-stepper.tsx` - Placeholders:
     - `"Escribe aquí..."` (ya está en español, verificar otros)
     - `"Selecciona una opción..."`
     - `"Escribe tu nombre completo"`
     - `"Audio URL"`

---

### Fase 6: Migrar Servicios y Mensajes Toast
**Prioridad:** ALTA
**Estado:** PENDIENTE

#### Archivos a revisar en `lib/services/`:

Buscar mensajes toast y console.log en inglés:

```bash
# Comando para buscar mensajes en inglés en servicios
grep -r "toast.error\|toast.success\|console.log\|console.error" lib/services/ --include="*.ts"
```

**Patrones comunes a buscar:**
- `toast.error("Error loading...")`
- `toast.success("Saved successfully")`
- `toast.info("Exporting...")`
- `console.error("Failed to fetch...")`

**Ejemplo de migración:**
```typescript
// ANTES
import { toast } from "sonner";

try {
  await saveData();
  toast.success("Saved successfully");
} catch (error) {
  toast.error("Error saving data");
}

// DESPUÉS
"use client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

function MiComponente() {
  const t = useTranslations("success");
  const tErrors = useTranslations("errors");
  
  try {
    await saveData();
    toast.success(t("saved"));
  } catch (error) {
    toast.error(tErrors("saving"));
  }
}
```

---

### Fase 7: Migrar Componentes de Inventario
**Prioridad:** MEDIA
**Estado:** PENDIENTE

#### Archivos a migrar:

- `components/inventory/waste-form.tsx` - Placeholders: `"Selecciona un producto"` (ya ES), verificar otros
- `components/inventory/stock-manager.tsx`

---

### Fase 8: Migrar Analíticas y Reportes
**Prioridad:** MEDIA
**Estado:** PENDIENTE

#### Archivos a migrar:

- `components/analytics/kpi-form.tsx` - Placeholders:
  - `"Describe what this KPI measures..."`
  - `"Select type"`
  - `"Select category"`
  - `"Select threshold type"`
  - `"Select frequency"`

---

### Fase 9: Migrar Componentes de Incidentes y Cumplimiento
**Prioridad:** BAJA
**Estado:** PENDIENTE

#### Archivos a migrar:

- `components/incidents/incident-list.tsx` - Placeholders: `"Filter by severity"`, `"Filter by status"`
- `components/compliance/payroll-export.tsx`
- `components/compliance/compliance-tagger.tsx`

---

### Fase 10: Revisión Final y Verificación
**Prioridad:** ALTA
**Estado:** PENDIENTE

#### Tareas:

1. **Verificar build:**
   ```bash
   pnpm run build
   ```

2. **Buscar textos restantes en inglés:**
   ```bash
   # Buscar placeholders comunes
   grep -r 'placeholder="[A-Z]' --include="*.tsx" app/ components/
   
   # Buscar labels en inglés
   grep -r 'label="[A-Z]' --include="*.tsx" app/ components/
   
   # Buscar títulos en inglés
   grep -r 'title="[A-Z]' --include="*.tsx" app/ components/
   
   # Buscar toast messages en inglés
   grep -r 'toast\.(error|success|info)\("[A-Z]' --include="*.tsx" app/ components/
   ```

3. **Pruebas manuales:**
   - Verificar flujo de login/registro
   - Verificar dashboard principal
   - Verificar formularios de empleados
   - Verificar constructor de workflows
   - Verificar mensajes de error

4. **Documentación:**
   - Actualizar este documento con archivos completados
   - Verificar que todas las claves de messages/es.json se usan

---

## 📁 ESTRUCTURA DE TRADUCCIONES

El archivo `messages/es.json` está organizado así:

```json
{
  "metadata": { "title": "...", "description": "..." },
  "auth": {
    "signIn": { "title": "...", "email": "...", ... },
    "signUp": { ... },
    "forgotPassword": { ... }
  },
  "navigation": { "dashboard": "...", "workflows": "...", ... },
  "common": { "save": "...", "cancel": "...", ... },
  "validation": { "required": "...", "invalidEmail": "...", ... },
  "dashboard": { "executive": { ... }, "operations": { ... } },
  "workflows": { "title": "...", "builder": { ... }, ... },
  "inventory": { ... },
  "equipment": { ... },
  "labor": { ... },
  "compliance": { ... },
  "company": { ... },
  "analytics": { ... },
  "notifications": { ... },
  "whatsapp": { ... },
  "ai": { ... },
  "errors": { ... },
  "success": { ... },
  "roles": { ... },
  "permissions": { ... }
}
```

---

## 🎯 INSTRUCCIONES PARA AGENTES

### Cuando migres un componente:

1. **Agregar "use client"** si no está presente (useTranslations requiere cliente)

2. **Importar useTranslations:**
   ```typescript
   import { useTranslations } from "next-intl";
   ```

3. **Inicializar el hook:**
   ```typescript
   const t = useTranslations("namespace.subnamespace");
   ```

4. **Reemplazar textos:**
   - `"Texto hardcoded"` → `{t("clave")}`
   - `placeholder="Texto"` → `placeholder={t("clave")}`
   - `label="Texto"` → `label={t("clave")}`

5. **Para interpolaciones:**
   ```typescript
   t("clave", { nombre: valor })  // messages: "Hola {nombre}"
   ```

6. **Para textos comunes reutilizados:**
   ```typescript
   const tCommon = useTranslations("common");
   ```

### Para componentes Server:

```typescript
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("dashboard");
  return <h1>{t("executive.title")}</h1>;
}
```

### Para mensajes de error dinámicos:

Si el mensaje de error viene del servidor, considera mantenerlo en español en el backend o crear un mapper de errores.

---

## 📊 LISTA DE VERIFICACIÓN POR FASE

### Fase 3 - Dashboard:
- [ ] Sidebar y navegación migrados
- [ ] Dashboard principal migrado
- [ ] Tablas y listados migrados
- [ ] Formularios de equipos migrados

### Fase 4 - Empleados:
- [ ] personal-info-form.tsx migrado
- [ ] professional-dialog.tsx ✅ (ya está)
- [ ] contract-dialog.tsx migrado
- [ ] Componentes laborales migrados

### Fase 5 - Builder:
- [ ] property-editor.tsx migrado
- [ ] builder-header.tsx migrado
- [ ] workflow-settings-modal.tsx migrado
- [ ] logic-rule-card.tsx migrado
- [ ] workflow-stepper.tsx migrado

### Fase 6 - Servicios:
- [ ] Todos los toast messages en español
- [ ] Todos los console messages revisados
- [ ] Mensajes de error traducidos

### Fase 7-9 - Inventario/Analytics/Incidentes:
- [ ] Componentes inventario migrados
- [ ] Componentes analytics migrados
- [ ] Componentes incidentes migrados

### Fase 10 - Final:
- [ ] Build exitoso
- [ ] Sin textos en inglés restantes
- [ ] Pruebas manuales completadas
- [ ] Documentación actualizada

---

## 🔍 COMANDOS ÚTILES

```bash
# Instalar dependencias
pnpm install

# Correr en desarrollo
pnpm run dev

# Verificar build
pnpm run build

# Buscar textos en inglés (ejemplos)
grep -r "placeholder=\"[A-Z]" --include="*.tsx" components/ app/
grep -r "label=\"[A-Z]" --include="*.tsx" components/ app/
grep -r "title=\"[A-Z]" --include="*.tsx" components/ app/
grep -r "toast\.(success|error|info)" --include="*.tsx" components/ app/
```

---

## 📞 NOTAS IMPORTANTES

1. **La mayoría de la navegación ya está en español** (hardcoded en `app-sidebar.tsx`). Esto es aceptable pero idealmente debería usar i18n.

2. **Los mensajes de validación Zod** ya están traducidos en los archivos de `lib/validations/`.

3. **El sistema solo soporta español** por ahora. Si en el futuro se necesita soporte multi-idioma, el sistema ya está preparado.

4. **Mantener consistencia:** Usar el mismo estilo de traducciones en todos los componentes.

5. **No traducir:**
   - Nombres de variables, funciones, clases
   - Keys de objetos
   - IDs y códigos técnicos
   - Nombres de marcas (Pulso, WhatsApp, etc.)

---

**Última actualización:** Abril 2026
**Documento creado por:** OpenCode Agent
**Próximo paso recomendado:** Continuar con Fase 3 - Componentes del Dashboard
