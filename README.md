# Planificador de ruta — máquinas expendedoras (Tenerife)

App web para planificar rutas multiparada con **TomTom** (tráfico, incidencias, predicción por hora de salida) y mapa **Leaflet**.

## Requisitos

- Node.js 18+
- Clave API TomTom (Routing + Traffic)

## Arranque

```bash
npm install
cp .env.example .env
# Edita .env y asigna VITE_TOMTOM_API_KEY=tu_clave

npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`).

## Uso (prioridad: ver la ruta en el mapa)

1. **Origen**: pulsa «Confirmar mi ubicación actual» (GPS) o elige una máquina en «Inicio de ruta».
2. **Paradas**: marca máquinas en la lista lateral.
3. La ruta se calcula sola; también puedes usar **Calcular ruta óptima**.
4. Opcional: **Salida (predicción de tráfico)** — fecha/hora para `departAt` en TomTom.
5. Panel **Tráfico** en el resumen: tramos rojos / amarillos / verdes tras calcular.

## GPS en local

- `localhost` y `127.0.0.1` suelen permitir geolocalización.
- En red local sin HTTPS el navegador puede bloquear el GPS; usa localhost o HTTPS.

## Estructura

| Ruta | Rol |
|------|-----|
| `src/js/app.js` | Motor de ruta TomTom multiparada (no sustituir el flujo principal) |
| `src/js/tomtom-routing.js` | API calculateRoute, pintado por secciones |
| `src/js/tomtom-traffic.js` | Capas flujo + incidencias en ruta |
| `src/components/` | UI React (sidebar, mapa, lista, resumen) |
| `src/context/PlanificadorContext.jsx` | Estado UI + bridge |
| `src/js/planificador-ui-bridge.js` | Sincronización motor ↔ React |

## Build

```bash
npm run build
npm run preview
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_TOMTOM_API_KEY` | Clave TomTom (obligatoria para rutas) |

No subas `.env` al repositorio.
