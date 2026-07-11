# CasinoDesk — Reporte de implementación por fases

Fecha de cierre: 11 de julio de 2026

## Propósito

Este documento resume el trabajo realizado para convertir la demostración de CasinoDesk en una implementación final funcional. Incluye las ocho fases ejecutadas, los cambios principales y las validaciones realizadas.

El proyecto quedó preparado para que el resto del equipo continúe con la presentación, documentación académica y cualquier mejora adicional.

## Estado final

- Frontend React + TypeScript desplegado con Nginx.
- Backend ASP.NET Core 8.
- Persistencia SQLite dentro de un volumen Docker.
- Autenticación JWT, refresh token, logout y RBAC.
- Expedientes KYC, screening, alertas, RTE y ROS funcionales.
- Integraciones restringidas reemplazadas por simulaciones académicas identificadas.
- Reportes exportables e imprimibles.
- Pruebas frontend, backend, integración y smoke E2E.
- Docker reconstruido y validado desde la ubicación definitiva.

---

## Fase 1 — Roles y permisos

### Objetivo

Aplicar el feedback de la profesora sobre la eliminación del rol Dealer y reorganizar sus responsabilidades.

### Logros

- Se eliminó Dealer del backend y frontend.
- Se eliminó su cuenta, enum, ruta, dashboard, navegación, permisos, mocks y pruebas.
- Las funciones de mesa fueron transferidas al Supervisor.
- El Supervisor puede realizar buy-in de mesa, KYC y alertas manuales.
- Se consolidaron cuatro roles finales:
  - Cajero.
  - Supervisor.
  - Oficial.
  - Administrador.
- Se alinearon las capacidades del frontend con las políticas del backend.

### Validación

- Supervisor autentica y accede a las funciones de mesa.
- Dealer devuelve HTTP 401.
- Frontend y backend compilan sin referencias activas al rol eliminado.

---

## Fase 2 — SQLite y expediente persistente

### Objetivo

Reemplazar la persistencia JSON por una base estructurada y crear el modelo del prospecto jugador.

### Logros

- Se sustituyó el repositorio JSON por SQLite.
- La base se guarda como `data/casinodesk.db` dentro del volumen Docker.
- Se crearon tablas para:
  - Usuarios.
  - Prospectos.
  - Evidencias KYC.
  - Transacciones.
  - Alertas.
  - RTE.
  - ROS.
  - Auditoría.
  - Lista AML académica.
- Se agregó una relación mediante clave foránea entre prospectos y evidencias.
- Se añadieron índices por riesgo, estado y expediente.
- Se implementaron endpoints para crear, actualizar y consultar prospectos.
- El documento se almacena como hash y se muestra parcialmente enmascarado.
- Se agregaron validaciones de mayoría de edad, vigencia documental, correo, PEP y score.

### Validación

- Se creó un prospecto con evidencia.
- El backend fue reiniciado.
- El expediente y su evidencia continuaron disponibles después del reinicio.

---

## Fase 3 — Formulario KYC y escaneo ampliado

### Objetivo

Solicitar y mostrar más información al escanear la cédula, de acuerdo con el feedback docente y la debida diligencia.

### Logros

El formulario del prospecto ahora captura:

- Tipo y número de documento.
- País emisor.
- Fecha de emisión y vencimiento.
- Nombre completo.
- Fecha y lugar de nacimiento.
- Sexo.
- Nacionalidad y país de residencia.
- Dirección, teléfono y correo.
- Ocupación, empleador y actividad económica.
- Rango de ingresos.
- Monto y frecuencia esperada de juego.
- Propósito de la relación.
- Origen de fondos.
- Condición PEP y detalle de la relación o cargo.

El escáner PDF417/QR completa automáticamente:

- Documento.
- Nombre.
- Sexo.
- País.
- Fecha de nacimiento.
- Nacionalidad.
- Fecha de emisión.
- Fecha de vencimiento.

El flujo guarda el expediente y la evidencia antes de registrar la transacción.

### Validación

- Expediente ampliado creado desde Supervisor.
- Evidencia vinculada.
- Buy-in completado.
- Oficial pudo consultar perfil económico y datos persistidos.

---

## Fase 4 — Transacciones, alertas, RTE y ROS

### Objetivo

Unificar reglas y estados para que los flujos regulatorios tuvieran consecuencias reales y trazables.

### Logros

Estados RTE implementados:

- `PENDIENTE_FIRMA`.
- `PENDIENTE_APROBACION`.
- `APROBADO`.
- `ENVIADO`.

Reglas principales:

- La firma del cliente ya no se presume.
- Un RTE sin firma no puede aprobarse.
- Solo el Oficial puede aprobar y enviar el RTE.
- El envío genera un acuse UAF simulado.
- La transacción cambia a completada después del envío del RTE.

Flujo ROS:

- El ROS se crea inicialmente como borrador.
- La alerta pasa a revisión.
- El Oficial envía el ROS.
- Se genera un acuse UAF simulado.
- La alerta se cierra únicamente después del envío.

Alertas:

- Cierre con justificación obligatoria.
- Responsable de revisión.
- Nota y fecha de cierre.
- Auditoría de transiciones.

### Validación

- RTE firmado, aprobado y enviado.
- Transacción actualizada de pendiente a completada.
- ROS creado, enviado y asociado al cierre de alerta.
- Intento de aprobar RTE sin firma rechazado con HTTP 409.

---

## Fase 5 — Integraciones y reportes

### Objetivo

Implementar simulaciones académicas demostrables y mejorar los reportes de debida diligencia.

### Logros

Integraciones configuradas:

- ONU: pública referencial.
- OFAC: pública referencial.
- PEP Panamá: simulada.
- Interpol: simulada.
- Tribunal Electoral: simulada.
- UAF en Línea: simulada.

Cada fuente muestra su modo, estado y explicación. Ninguna simulación se presenta como una conexión gubernamental real.

Reportes implementados:

- Expediente KYC.
- RTE.
- ROS confidencial.
- Resumen de cumplimiento de 30 días.
- Exportación CSV.
- Vista HTML imprimible.
- Opción de imprimir o guardar como PDF.
- Acuses UAF simulados.

Indicadores del resumen:

- Prospectos.
- Transacciones y volumen.
- Operaciones bloqueadas.
- Alertas abiertas y críticas.
- RTE pendientes y enviados.
- ROS borradores y enviados.
- Distribución por riesgo.

### Validación

- Reportes HTML y CSV responden HTTP 200.
- RTE y ROS incluyen sus acuses.
- Cajero no puede consultar reportes privados: HTTP 403.

---

## Fase 6 — Seguridad, errores, CSS y accesibilidad

### Objetivo

Endurecer la aplicación y mejorar su comportamiento visual y operativo.

### Logros de seguridad

- Se retiró la clave JWT de `appsettings.json`.
- El secreto se configura mediante variable de entorno.
- Access tokens de 30 minutos.
- Refresh tokens criptográficos y rotatorios.
- Logout con invalidación.
- Rate limiting por dirección IP.
- CORS configurable.
- Encabezados CSP, X-Frame-Options, nosniff y Referrer-Policy.
- Política de cámara limitada a la propia aplicación.

### Manejo de errores

- Errores 400, 401, 403 y 409 no activan incorrectamente el modo offline.
- El fallback local queda reservado para fallos de red o servidor.
- Una sesión expirada se elimina correctamente.
- Mensajes de éxito/error y botones bloqueados durante operaciones.

### Accesibilidad y CSS

- Modales con semántica de diálogo.
- Etiquetas ARIA.
- Foco inicial, trampa de foco y restauración al cerrar.
- Mensajes con `aria-live`.
- Indicadores de foco visibles.
- Tablas con desplazamiento horizontal.
- Formularios y grids adaptables.
- Modales móviles de pantalla completa.
- Navegación y tarjetas responsive.

### Validación

- Refresh rotado correctamente.
- Token anterior y token invalidado por logout devuelven HTTP 401.
- Rate limiting devuelve HTTP 429.
- Encabezados de seguridad presentes.

---

## Fase 7 — Pruebas y documentación

### Objetivo

Crear evidencia automatizada y documentación reproducible para el equipo.

### Logros

- 124 pruebas frontend con Vitest.
- Proyecto backend xUnit.
- 3 pruebas backend/integración con SQLite aislada.
- Smoke E2E contra los contenedores reales.
- Pruebas integradas dentro de los Dockerfiles.
- Una imagen no se publica si falla una prueba.

Flujos automatizados:

- Login, refresh, logout y RBAC.
- Prospecto KYC y evidencia.
- Buy-in y RTE.
- Borrador y envío ROS.
- Cierre de alertas.
- Reportes y disponibilidad del frontend.

Documentación añadida:

- `README.md` actualizado.
- `docs/FINAL_DELIVERY.md`.
- `docs/qa/FINAL_TEST_REPORT.md`.
- `scripts/e2e-smoke.mjs`.

### Validación

```text
Frontend: 124/124
Backend/integración: 3/3
Smoke E2E: aprobado
```

---

## Fase 8 — Reconstrucción y certificación final

### Objetivo

Reconstruir todo desde cero y certificar el entorno final sin borrar los datos del volumen.

### Logros

- Reconstrucción Docker completa sin caché.
- Reinstalación limpia de dependencias.
- Ejecución automática de todas las pruebas.
- Actualización de React Router y Vite.
- Auditoría npm corregida hasta cero vulnerabilidades.
- Recreación final de contenedores.
- Persistencia SQLite preservada.

### Certificación

```text
Frontend: HTTP 200 en puerto 8080
Backend/Swagger: HTTP 200 en puerto 5067
Cajero: activo
Supervisor: activo
Oficial: activo
Administrador: activo
Dealer: eliminado, HTTP 401
Integraciones: 6
Pruebas frontend: 124 aprobadas
Pruebas backend: 3 aprobadas
Auditoría npm: 0 vulnerabilidades
Smoke E2E: aprobado
```

---

## Comandos para el equipo

Construir y levantar:

```powershell
docker compose build
docker compose up -d
```

Ejecutar smoke E2E:

```powershell
npm run test:e2e
```

Direcciones:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5067`
- Swagger: `http://localhost:5067/swagger`

Credenciales de demostración:

```text
cajero / demo
supervisor / demo
oficial / demo
admin / demo
```

## Pendientes para el resto del equipo

- Preparar las diapositivas y distribución de exposición.
- Revisar textos finales solicitados por la universidad.
- Seleccionar los escenarios que se mostrarán durante la presentación.
- Decidir si se conserva o reinicia el volumen antes de la demostración.
- Preparar respaldo del repositorio y verificar Docker en la computadora de exposición.
- Evitar subir secretos reales al repositorio público.
- Configurar `JWT_SIGNING_KEY` con un valor privado fuera del código si se despliega fuera del entorno académico.

## Conclusión

CasinoDesk pasó de una demostración funcional a una aplicación full-stack persistente, trazable y comprobable. El feedback principal fue incorporado: expediente ampliado del prospecto, eliminación de Dealer, transferencia de funciones al Supervisor y reportes de debida diligencia mejor definidos.

Las ocho fases quedaron completadas y verificadas. El proyecto está listo para que el equipo continúe con la entrega académica y la presentación final.
