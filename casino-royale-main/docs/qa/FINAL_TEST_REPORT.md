# Informe QA — Implementación final

Fecha de ejecución: 2026-07-11

## Resultado

| Capa | Suite | Resultado |
| --- | --- | --- |
| Frontend | Vitest, 21 archivos | 124/124 aprobadas |
| Backend | xUnit + WebApplicationFactory | 3/3 aprobadas |
| Integración | API + SQLite aislada | Aprobada |
| Smoke E2E | Frontend + API + SQLite + reportes en Docker | Aprobado |
| Build frontend | TypeScript + Vite | Aprobado |
| Build backend | .NET 8 Release | Aprobado |
| Auditoria npm | Produccion y desarrollo | 0 vulnerabilidades |
| Reconstruccion sin cache | Docker Compose | Aprobada |

## Flujos cubiertos

- Login, JWT, rotación de refresh token y logout.
- Denegación RBAC de reportes al Cajero.
- Creación y consulta de prospecto KYC.
- Enmascaramiento documental y evidencia relacionada.
- Buy-in sujeto a RTE.
- Aprobación y envío RTE con acuse simulado.
- Creación de borrador y envío ROS con acuse simulado.
- Cierre de alerta y actualización de transacción.
- Disponibilidad del frontend y resumen de cumplimiento.

## Comandos reproducibles

```powershell
docker compose build
docker compose up -d
npm run test:e2e
```

Los Dockerfiles ejecutan las pruebas unitarias y de integración antes de publicar las imágenes finales.

## Observaciones no bloqueantes

- Vitest muestra advertencias de futuras opciones de React Router.
- Recharts advierte dimensiones cero en JSDOM; no afecta la ejecución en navegador.
- El bundle principal supera 500 kB y puede dividirse en una optimización posterior.

## Certificacion final Docker

- Frontend HTTP 200 en puerto 8080.
- API/Swagger HTTP 200 en puerto 5067.
- Cajero, Supervisor, Oficial y Administrador autentican correctamente.
- Dealer eliminado y rechazado con HTTP 401.
- Persistencia SQLite preservada tras reconstrucción y recreación.
- Reportes e integraciones disponibles para roles autorizados.
