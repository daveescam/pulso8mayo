# Estado de Migración: WasenderAPI → WAHA NOWEB

## Resumen

Migración en progreso del motor de WhatsApp de WasenderAPI a WAHA con el motor NOWEB.

## Fases Completadas

### ✅ Fase 1: Infraestructura WAHA
- [x] `docker-compose.waha.yml` - Configuración Docker con motor NOWEB
- [x] Variables de entorno en `.env` (WAHA_API_URL, WAHA_WEBHOOK_SECRET, etc.)
- [x] `config/waha-config.ts` - Configuración centralizada y tipos

### ✅ Fase 2: Cliente WAHA
- [x] `lib/whatsapp/waha-client.ts` - Cliente completo con todas las funciones
- [x] Interfaz compatible con `wasender-client.ts`
- [x] Rate limiting, manejo de errores, retries
- [x] Soporte para: mensajes, imágenes, documentos, sesiones, QR

### ✅ Fase 3: Webhooks
- [x] `app/api/whatsapp/webhook/route.ts` - Soporte dual (Wasender + WAHA)
- [x] Detección automática del formato de payload
- [x] Normalización de eventos: message, message.ack, session.status
- [x] Manejo de opt-in/opt-out con ambos clientes

### ✅ Fase 4: Gestión de Sesiones
- [x] `lib/whatsapp/session-manager.ts` - Cliente dinámico con feature flag
- [x] Mapeo de estados: STARTING → DISCONNECTED, SCAN_QR → CONNECTING, WORKING → CONNECTED
- [x] Funciones auxiliares para refrescar QR, eliminar sesiones

### ✅ Fase 5: Store y Persistencia (Opcional)
- [x] `lib/whatsapp/waha-history-service.ts` - Servicio de historial
- [x] Funciones: getMessageHistory, getAllChats, searchMessages, exportChatHistory
- [x] Nota: Requiere `WHATSAPP_STORE_ENABLED=true` en WAHA

### ✅ Fase 6: Integración con Servicios
- [x] `lib/whatsapp/client-factory.ts` - Factory con feature flag USE_WAHA
- [x] `lib/whatsapp/notification-dispatcher.ts` - Actualizado para usar client-factory
- [x] `lib/services/whatsapp-notification-service.ts` - Async/await para cliente dinámico

## Archivos Modificados

| Archivo | Acción | Estado |
|---------|--------|--------|
| `docker-compose.waha.yml` | Crear | ✅ |
| `.env` | Actualizar | ✅ |
| `config/waha-config.ts` | Crear | ✅ |
| `lib/whatsapp/waha-client.ts` | Crear | ✅ |
| `lib/whatsapp/waha-history-service.ts` | Crear | ✅ |
| `lib/whatsapp/client-factory.ts` | Crear | ✅ |
| `app/api/whatsapp/webhook/route.ts` | Modificar | ✅ |
| `lib/whatsapp/session-manager.ts` | Modificar | ✅ |
| `lib/whatsapp/notification-dispatcher.ts` | Modificar | ✅ |
| `lib/services/whatsapp-notification-service.ts` | Modificar | ✅ |

## Feature Flag

Para activar WAHA, establecer en `.env`:

```bash
USE_WAHA=true
```

Para volver a WasenderAPI:

```bash
USE_WAHA=false
```

## Instrucciones de Uso

### 1. Iniciar WAHA Server

```bash
# Usando Docker Compose
docker-compose -f docker-compose.waha.yml up -d

# O Docker directo
docker run -d \
  --name waha-server \
  -p 3001:3001 \
  -e "WHATSAPP_DEFAULT_ENGINE=NOWEB" \
  -e "WHATSAPP_STORE_ENABLED=true" \
  -e "WEBHOOK_URL=http://host.docker.internal:3000/api/whatsapp/webhook" \
  -v ./.sessions:/app/.sessions \
  --restart unless-stopped \
  devlikeapro/waha:latest
```

### 2. Verificar Conexión

```bash
curl http://localhost:3001/api/ping
```

### 3. Acceder a Documentación

- **Swagger UI**: http://localhost:3001/swagger
- **Dashboard**: http://localhost:3001/dashboard

### 4. Scripts de Prueba

```bash
# Primera vez - crear sesión y obtener QR
bash scripts/test-waha.sh

# Después de conectar - enviar mensajes
bash scripts/test-waha-send.sh
```

## Próximos Pasos (Fases Pendientes)

### Fase 7: Pruebas y Validación
- [ ] Tests unitarios del cliente WAHA
- [ ] Tests de integración end-to-end
- [ ] Verificar envío de mensajes, imágenes, documentos
- [ ] Verificar recepción de webhooks
- [ ] Verificar SmartLinks
- [ ] Verificación de fotos con AI (Moondream)

### Fase 8: Deployment
- [ ] Configurar monitoreo
- [ ] Probar plan de rollback
- [ ] Migrar sesiones de producción

## Notas Importantes

### Diferencias Clave

| Aspecto | WasenderAPI | WAHA NOWEB |
|---------|-------------|------------|
| Motor | Chromium | WebSocket directo |
| Memoria | ~300-500MB | ~50-100MB |
| API | Propietaria | REST + Swagger |
| Webhooks | HMAC | Configurable |
| QR | En webhook | GET /api/sessions/{id}/auth/qr |

### Estados de Sesión

| WasenderAPI | WAHA | Significado |
|-------------|------|-------------|
| DISCONNECTED | STARTING | Iniciando |
| CONNECTING | SCAN_QR | Esperando QR |
| CONNECTED | WORKING | Conectado y funcionando |
| FAILED | FAILED | Error |

### Webhooks WAHA

```json
{
  "event": "message",
  "session": "default",
  "payload": {
    "id": "...",
    "timestamp": 1714312800,
    "from": "5215512345678@c.us",
    "fromMe": false,
    "body": "Hola",
    "type": "chat",
    "hasMedia": false
  }
}
```

## Recursos

- **Documentación WAHA**: https://waha.devlike.pro/docs/
- **Motor NOWEB**: https://waha.devlike.pro/docs/engines/noweb/
- **Docker Hub**: https://hub.docker.com/r/devlikeapro/waha

## Contacto y Soporte

Para problemas con la migración:
1. Verificar logs de WAHA: `docker logs waha-server`
2. Verificar conectividad: `curl http://localhost:3001/api/ping`
3. Revisar feature flag: `echo $USE_WAHA`
