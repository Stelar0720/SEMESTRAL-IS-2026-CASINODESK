# CasinoDesk — Guía de entrega final

## Arquitectura

- Frontend: React, TypeScript, Vite y Nginx.
- Backend: ASP.NET Core 8 Web API.
- Persistencia: SQLite en el volumen Docker `casinodesk-data`.
- Autenticación: JWT de 30 minutos, refresh token rotatorio y RBAC.
- Despliegue: Docker Compose en puertos 8080 y 5067.

## Roles finales

- Cajero: buy-in/cash-out de caja, KYC y alertas manuales.
- Supervisor: buy-in de mesa, KYC, monitoreo y alertas discretas.
- Oficial: expedientes, alertas, aprobación/envío RTE y creación/envío ROS.
- Administrador: consulta técnica y configuración, sin decisiones de cumplimiento.

El rol Dealer fue eliminado. Sus tareas de mesa fueron transferidas al Supervisor.

## Flujos para la presentación

1. Iniciar sesión como `cajero` o `supervisor` con contraseña `demo`.
2. Abrir un buy-in igual o superior a USD 2,000.
3. Escanear o cargar la cédula de prueba y completar el perfil económico.
4. Mostrar el expediente KYC, evidencia y semáforo.
5. Para AML rojo usar `8-958-2038`; la operación se bloquea y genera alerta.
6. Para RTE usar efectivo igual o superior a USD 10,000 y confirmar la firma.
7. Entrar como `oficial`, aprobar y enviar el RTE; mostrar su acuse.
8. Crear un borrador ROS desde una alerta, enviarlo y mostrar el cierre y acuse.
9. Exportar KYC/RTE/ROS como CSV o vista imprimible/Guardar como PDF.

## Integraciones

- ONU y OFAC: fuentes públicas referenciales preparadas para sincronización futura.
- PEP, Interpol, Tribunal Electoral y UAF: simulaciones funcionales y rotuladas.
- Ningún dato se transmite a una institución gubernamental real.

## Verificación

```powershell
docker compose build
docker compose up -d
node scripts/e2e-smoke.mjs
```

La construcción ejecuta automáticamente:

- 124 pruebas frontend con Vitest.
- 3 pruebas backend/integración con xUnit.
- Compilación TypeScript/Vite.
- Publicación .NET Release.

## Persistencia y reinicio

Los datos sobreviven a recreaciones de contenedores. Para una demostración limpia debe eliminarse expresamente el volumen, operación que también borra todos los expedientes de prueba.
