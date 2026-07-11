# CasinoDesk v3

El resumen completo de las ocho fases de implementacion se encuentra en
[`docs/IMPLEMENTATION_PHASES_REPORT.md`](docs/IMPLEMENTATION_PHASES_REPORT.md).

Migracion del prototipo original a una base full-stack con:

- `apps/frontend`: React + TypeScript + Vite
- `apps/backend/CasinoDesk.Api`: ASP.NET Core Web API

## Estado actual

- El prototipo original se mantiene intacto en la raiz como referencia visual y funcional.
- El frontend nuevo ya implementa:
  - login con usuario y contrasena,
  - restauracion de sesion,
  - proteccion de rutas por rol,
  - dashboard operador,
  - buy-in y cash-out,
  - screening AML/PEP mock,
  - semaforo de riesgo,
  - alertas,
  - RTE,
  - ROS,
  - auditoria y sesion del cliente,
  - reportes KYC, RTE y ROS exportables a CSV o vista imprimible/PDF,
  - panel de integraciones publicas referenciales y proveedores simulados claramente identificados,
  - tema claro basado en tokens.
- El backend nuevo deja listos:
- autenticacion JWT con contrasenas PBKDF2,
- access tokens de 30 minutos, refresh token rotatorio, logout e invalidacion de sesion,
- rate limiting por direccion IP y encabezados de seguridad en API/Nginx,
  - RBAC,
  - contratos principales,
  - endpoints del plan,
  - servicios mock de AML/PEP,
  - hashing de identificadores,
  - fraccionamiento,
- prospectos, expedientes KYC, evidencias, transacciones, RTE, ROS y auditoria persistentes en SQLite.

## Credenciales de demostracion

La contrasena para todas las cuentas es `demo`.

- `cajero`
- `oficial`
- `supervisor`
- `admin`

## Escaneo de cedula para la demo

El flujo de Buy-in permite abrir la camara desde el paso KYC y leer codigos QR
o PDF417 mediante ZXing. Tambien acepta lectores USB/Bluetooth que funcionen
como teclado.

La cedula de prueba `8-958-2038` esta incluida en una lista AML local de
demostracion mediante su hash. Al escanearla y continuar, la operacion queda
bloqueada y genera una alerta roja. La aplicacion no almacena una fotografia
del documento.

## Ejecutar frontend

```bash
npm install
npm run dev
```

## Ejecutar backend

```bash
dotnet run --project .\apps\backend\CasinoDesk.Api
```

o usando el script:

```bash
npm run dev:api
```

Ese script fuerza la API en `http://localhost:5067`.

## Build frontend

```bash
npm run build
```

## Docker

Con Docker Desktop abierto, otra persona puede levantar todo con:

```bash
docker compose up --build
```

La base SQLite queda guardada en el volumen Docker `casino-royale-main_casinodesk-data`,
por lo que sobreviven reinicios y recreaciones de los contenedores.

Puertos esperados:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5067`
- Swagger: `http://localhost:5067/swagger`

Si algo falla en compilacion o arranque, Docker mostrara el error directamente en consola durante `build` o `up`.

## Verificaciones realizadas

- `dotnet build .\apps\backend\CasinoDesk.Api -c Debug`
- `npm run build`
- autenticacion correcta e incorrecta
- autorizacion por rol (`403`)
- creacion persistente de transacciones y RTE
- rechazo de aprobaciones RTE duplicadas (`409`)
- 124 pruebas automatizadas del frontend
- 3 pruebas backend/integracion para autenticacion, RBAC, KYC, RTE y ROS
- smoke E2E reproducible con `npm run test:e2e`

## Backend

El backend corre por defecto en `http://localhost:5067`. El frontend se conecta
mediante `/api` y muestra un aviso visible si pierde la conexion. En ese estado
puede continuar en modo local, pero advierte que los nuevos cambios no seran
persistentes.

Nota: `GET /` devuelve `404` y eso es normal. Usa `http://localhost:5067/swagger` o los endpoints `/auth`, `/transactions`, `/alerts`, etc.

```bash
dotnet run --project apps/backend/CasinoDesk.Api
```
