# Plan de Implementación: Logger de Flujo de Eventos Reactivo y Endurecimiento de Seguridad

Refactorizar Antigravity Observer para usar una arquitectura de flujo de eventos reactivos para los logs del sistema y el rendimiento, mientras se endurece la seguridad con coincidencia de patrones en tiempo real.

## Revisión del Usuario Requerida

> [!IMPORTANT]
> Esta refactorización cambiará significativamente cómo se maneja la lógica de "Sincronización del Espacio de Trabajo", moviendo la "fuente de verdad" de los logs de un bucle de secuencia local a un flujo de eventos asíncronos.

## Cambios Propuestos

### Lógica Central y Estado

#### [MODIFICAR] [popup.js](file:///c:/Users/wilfr/.gemini/antigravity/scratch/antgr-observer/scripts/popup.js)
- Implementar una clase `EventBus` para manejar la mensajería interna.
- Refactorizar `MissionLogger` para suscribirse al `EventBus`.
- Actualizar `runWorkspaceSync` para publicar eventos en lugar de manipular directamente el `Logger`.
- Añadir un generador de eventos de "Flujo de Bytes" simulado cuando esté inactivo para mantener el terminal vivo.

#### [MODIFICAR] [background.js](file:///c:/Users/wilfr/.gemini/antigravity/scratch/antgr-observer/scripts/background.js)
- Mejorar la lógica de `monitorProgress` para emitir actualizaciones de estado que el popup pueda consumir.

### Endurecimiento de Seguridad

#### [MODIFICAR] [popup.js](file:///c:/Users/wilfr/.gemini/antigravity/scratch/antgr-observer/scripts/popup.js)
- Integrar una clase `SecurityScanner` con patrones regex para:
    - Claves API genéricas (`[a-zA-Z0-9]{32,}`)
    - Claves Privadas (`-----BEGIN RSA PRIVATE KEY-----`)
    - Tokens de Slack/GitHub.

---

### UI y Estética

#### [MODIFICAR] [popup.html](file:///c:/Users/wilfr/.gemini/antigravity/scratch/antgr-observer/popup.html)
- Añadir una nueva subsección de "Detalles de Seguridad" en el panel de insights.
- Asegurar que el encabezado "ANTIGRAVITY" permanezca fijo y premium.

---

## Plan de Verificación

### Pruebas Automatizadas
- No hay un framework de pruebas automatizadas configurado actualmente. Realizaré una verificación manual de los disparadores del flujo de eventos.

### Verificación Manual
1.  **Carga del Flujo de Eventos**: Iniciar la "Sincronización del Espacio de Trabajo" y verificar que los logs aparezcan de forma incremental, asegurando que la lógica FIFO/Prioridad funcione.
2.  **Disparador de Seguridad**: Simular una "fuga de credenciales" y verificar que la `Puntuación de Seguridad` baje y el panel de métricas resalte el riesgo.
3.  **Persistencia**: Actualizar el popup durante una sincronización y asegurar que el estado recuperado refleje el progreso actual a través de `chrome.storage`.
