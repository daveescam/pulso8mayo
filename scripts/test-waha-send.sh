#!/bin/bash
# Script de prueba para enviar mensajes con WAHA
# Requiere que WAHA esté conectado (estado WORKING)

if [ -f .waha-test.env ]; then
    source .waha-test.env
fi

WAHA_URL=${WAHA_URL:-"http://localhost:3001"}
SESSION=${SESSION:-"test-session"}
PHONE=${PHONE:-"5215512345678"}  # Cambiar a número de prueba

echo "=== Envío de mensajes de prueba ==="
echo "URL: $WAHA_URL"
echo "Sesión: $SESSION"
echo "Teléfono destino: $PHONE"
echo ""

# Verificar estado
echo "1. Verificando estado de sesión..."
STATUS=$(curl -s $WAHA_URL/api/sessions/$SESSION | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
echo "Estado: $STATUS"

if [ "$STATUS" != "WORKING" ]; then
    echo "ERROR: La sesión no está conectada. Estado actual: $STATUS"
    echo "Por favor, conecte primero la sesión escaneando el QR."
    exit 1
fi
echo ""

# Enviar mensaje de texto
echo "2. Enviando mensaje de texto..."
curl -s -X POST $WAHA_URL/api/sendText \
  -H "Content-Type: application/json" \
  -d "{\"chatId\": \"${PHONE}@c.us\", \"text\": \"✅ Prueba desde WAHA NOWEB - Mensaje de texto\", \"session\": \"$SESSION\"}"
echo ""
echo ""

# Enviar imagen
echo "3. Enviando imagen..."
curl -s -X POST $WAHA_URL/api/sendImage \
  -H "Content-Type: application/json" \
  -d "{\"chatId\": \"${PHONE}@c.us\", \"file\": {\"url\": \"https://via.placeholder.com/400x300.png?text=WAHA+Test\"}, \"caption\": \"🖼️ Prueba de imagen desde WAHA\", \"session\": \"$SESSION\"}"
echo ""
echo ""

# Obtener chats (si store está habilitado)
echo "4. Obteniendo lista de chats (requiere store habilitado)..."
curl -s $WAHA_URL/api/$SESSION/chats?limit=5
echo ""
echo ""

echo "=== Pruebas completadas ==="
echo ""
echo "Para ver la documentación completa:"
echo "  Swagger UI: http://localhost:3001/swagger"
echo "  Dashboard: http://localhost:3001/dashboard"
