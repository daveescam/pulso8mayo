# CHANGELOG

All notable changes to the Pulso HORECA (MVP) project will be documented in this file.

## [v1.0.0-MVP] - 2026-04-14

### Añadido (Sprint 1)
- **Compliance Engine & NOM Reports**: Reportes automáticos en PDF para auditorías NOM-251 y NOM-035 con la firma digital encriptada basada en los Checklists completados.
- **WhatsApp Webhooks Handler**: Comunicación de dos vías. Reacción a comandos `opt-in`, encuestas y enrutador inteligente manejado en memoria caché (Upstash) hacia API de WaSender.
- **AI Smartlinks**: Analizador AI para comprobaciones manuales con verificación cruzada enviada a WhatsApp y el perfil de Compliance.
- **Compliance Dashboard**: Métricas de salud empresarial en un vistazo (`/dashboard/compliance`).

### Añadido (Sprint 2)
- **Inventory Engine**: Flujos transaccionales de Recepción y Transferencias visualizados en sus respectivas paginaciones en App.
- **Low Stock Check & Alerts**: Arquitectura Cronjob que analiza el límite mínimo diario del stock. Retorna sugerencias e interactúa con Alertas de Severidad Alta/Crítica visualizadas globalmente en el dashboard de Inventario.
- **Supplier Directory UI**: Tabla CRUD en UI administrando provedores locales para los restaurantes.
- **Rate Limitings + Token Rotation**: Seguridad Middleware endureciendo solicitudes concurrentes API (limitando bots) junto a rotación periódica JWT.

### Añadido (Sprint 3)
- **Labor Core Analytics / Asistencia**: Visualización de turnos contra tiempo real del check-in, para automatizar conteos de Horas Extras semanales o diarias.
- **Schedule Drag-n-Drop Builder**: Integración masiva que facilita llenar turnos semanalmente en la interfaz, con una opción rápida atada a los endpoins bulk API.
- **Geolocation Radio Rules**: Implementación en frontend capturando longitud/latitud para condicionar la validez de los relojes checadores a menos de X metros.
- **QStash Asynchronous Retries Dispatcher**: Embutimiento robusto del queue model local (fallback memory) contra el entorno de Vercel/Qstash en producción garantizando entrega remota (SMS, Email o WA) sin frenar front-end.

### Añadido (Sprint 4)
- **Analytics KPIs Builders**: Tablero personalizable. Soporta sintaxis custom (JSON schemas) en el editor de Fórmulas y detecta alertas cruzando Umbrales (Targets) programados por el Mánager. KPIs base de inventario y RH ya cargados.
- **Documentación Completa**: Guías de Administradores, Usuarios e integraciones de la API Reference generadas en Markdowns.
- **Data Mocks MVP & E2E Testing**: Suite de siembras aleatorias por Drizzle y Testing en Playwright cubriendo integraciones sólidas.
