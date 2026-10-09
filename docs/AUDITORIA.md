# Auditoría del proyecto — 2026-10-08 (actualizada 2026-10-09)

Revisión de seguridad, calidad de código y QA funcional del proyecto Alchemica (Next.js 16 + Supabase).

**Estado:** ningún hallazgo de este documento está corregido todavía. Los cambios hechos hasta ahora fueron el módulo Deliverables, el pulido de la portada y el entorno local.

## Cómo se hizo

- Herramientas automáticas: `eslint`, `tsc --noEmit`, `vitest run`, `npm audit --omit=dev`.
- Revisión manual de autenticación, políticas RLS (`supabase/migrations/`), Server Actions y rutas de API.
- Pruebas en navegador (escritorio y móvil 375×812) del sitio público.
- **Segunda ronda (2026-10-09):** con un Supabase local y datos de prueba se recorrieron todos los módulos del admin y del portal del cliente, con los roles admin, dueño del cliente y colaborador, más pruebas directas de permisos contra la base de datos. Sus hallazgos están en la **Parte 3**.

Cada hallazgo indica cómo se comprobó:

- ✅ **Probado**: reproducido en la aplicación o directamente contra la base de datos local.
- 📄 **Código**: deducido leyendo el código y las migraciones. Si la base de datos de producción tiene políticas que no están en las migraciones, alguno podría no ocurrir.
- ➖ **No verificable**: depende de claves externas (Resend, Documenso) o de eventos que la herramienta de pruebas no genera.

## Resumen

| Herramienta | Resultado |
| --- | --- |
| `tsc --noEmit` | Sin errores |
| `vitest run` | 28/28 tests pasan (4 archivos) |
| `eslint` | 4 errores (calendario, dashboard, login y tablero) |
| `npm audit` | 6 vulnerabilidades (1 crítica, 4 altas, 1 moderada) |

### Prioridades

1. **SEC-01**: escalada a administrador por la política de `profiles` (confirmado).
2. **SEC-02**: actualizar `next` a 16.4.0.
3. **QA-02 a QA-06 y QA-20**: errores de facturación y borradores visibles al cliente.
4. **QA-17**: archivos con `#`, `?` o `%` en el nombre quedan inaccesibles.
5. **SEC-07**: un evento tardío del webhook degrada un contrato firmado.

---

# Parte 1 — Malas prácticas

## 🔴 Críticas

### SEC-01 · Cualquier usuario puede hacerse administrador ✅

- **Confirmado (2026-10-09):** reproducido en una base local: el usuario cliente `owner@cliente.test` cambió su propio `platform_role` a `axel_admin` con un UPDATE bajo RLS.

- **Dónde:** [supabase/migrations/0001_init.sql:336](../supabase/migrations/0001_init.sql)
  ```sql
  create policy "users update own profile" on profiles for update using (id = auth.uid());
  ```
- **Problema:** la política deja que cada usuario edite su propio perfil, pero no limita las columnas. Eso incluye `platform_role`.
- **Explotación:** un cliente con sesión iniciada ejecuta desde la consola del navegador, con la anon key pública:
  ```js
  supabase.from('profiles').update({ platform_role: 'axel_admin' }).eq('id', miId)
  ```
  A partir de ahí `is_axel_admin()` devuelve `true` y ve todos los clientes, facturas, contratos y archivos.
- **Arreglo:** quitar el permiso de UPDATE sobre esa columna, o añadir un trigger que lo bloquee para quien no sea `service_role`:
  ```sql
  revoke update (platform_role) on profiles from authenticated, anon;
  ```

### SEC-02 · Next.js 16.2.10 tiene vulnerabilidades críticas

- **Dónde:** `package.json`
- **Problema:** `npm audit` reporta, entre otras:
  - **Ejecución remota de código en `next/og` `ImageResponse`:** el proyecto lo usa en `src/app/opengraph-image.tsx`.
  - **Ejecución remota de código en servidores Windows.**
  - **Bypass de Middleware/Proxy con Turbopack:** `proxy.ts` es la primera barrera de `/admin` y `/portal`.
  - **SSRF:** varios, en Image Optimization, rewrites y Server Actions.
  - **Envenenamiento de caché:** en SSG/ISR.
  - **Dependencias:** `sharp`, `postcss`, `nanoid` y `source-map-js` también están afectados.
- **Arreglo:** `npm install next@16.4.0` (versión menor) y `npm audit fix`.

## 🟠 Altas

### SEC-03 · Se pueden mandar notificaciones falsas a cualquier usuario ✅

- **Confirmado (2026-10-09):** como `owner@cliente.test` se insertó en `notifications` un mensaje falso dirigido al admin, sin proyecto, y la base lo aceptó.

- **Dónde:** [supabase/migrations/0014_notifications.sql](../supabase/migrations/0014_notifications.sql), política `"members create notifications on own project"`.
- **Problema:** solo comprueba `actor_id = auth.uid()`. Con `project_id = null`, cualquier usuario puede insertar una notificación con cualquier texto para cualquier `recipient_id`, incluido el admin. Sirve para phishing dentro de la app.
- **Arreglo:** exigir `project_id not null` y que el destinatario sea miembro de esa organización (o admin).

### SEC-04 · Se puede subir un archivo a nombre de otra persona ✅

- **Confirmado (2026-10-09):** como cliente se insertó un registro de archivo con `uploaded_by` apuntando al admin, y la base lo aceptó.

- **Dónde:** `0001_init.sql:391`, política `"members upload files into own project"`.
- **Problema:** no exige `uploaded_by = auth.uid()`, así que un miembro puede atribuir un archivo a otra persona. Tampoco valida que `folder_id` pertenezca al mismo proyecto.
- **Arreglo:** añadir `uploaded_by = auth.uid()` al `with check`.

### SEC-05 · Las Server Actions aceptan datos del navegador sin validarlos

- **`paths: string[]`:** está en 8 archivos de `src/lib/actions/`. El navegador decide qué rutas se revalidan, así que cualquiera puede invalidar la caché de rutas arbitrarias.
- **`deleteFile(fileId, storagePath)`** en [src/lib/actions/files.ts:88](../src/lib/actions/files.ts): borra el blob que indica el navegador, no el del registro `fileId`. El archivo y su registro pueden quedar desincronizados. El mismo patrón está en `deleteInvoice(invoiceId, pdfStoragePath)`.
- **Arreglo:** calcular en el servidor las rutas a revalidar y leer `storage_path` desde la base de datos a partir del id.

### SEC-06 · El formulario de contacto no tiene límite de envíos ni anti-spam

- **Dónde:** [src/app/api/contact/route.ts](../src/app/api/contact/route.ts)
- **Problema:** un bot puede mandar miles de correos, gastar la cuota de Resend y dañar la reputación del dominio `alchemica.dk`.
- **Arreglo:** rate limit por IP, un campo honeypot y límites de longitud (ver QA-11).

## 🟡 Medias

### CODE-01 · Hay errores que se ignoran

- `inviteMember` ([src/app/(admin)/admin/clients/[orgId]/actions.ts:88-92](../src/app/(admin)/admin/clients/[orgId]/actions.ts)) no revisa el error del `update`/`insert`. Puede responder "Invite sent" aunque no se haya guardado nada.
- `deleteOrganization` y `deleteProject` ignoran los errores de `storage.remove`.
- `src/lib/dal.ts` ignora los errores de consulta. Un fallo de red se trata como "no autorizado".

### CODE-02 · El manejo de errores es inconsistente y los mensajes no llegan al usuario

- Unas actions devuelven `{ success, message }`, otras lanzan `throw new Error(...)` y `updateOrganization` hace `return` sin avisar nada.
- **Problema:** en producción Next.js oculta el mensaje de los errores lanzados en Server Actions, así que el usuario solo ve un error genérico. En desarrollo, en cambio, se muestran mensajes internos de Postgres (`error.message` aparece 65 veces).
- **Arreglo:** que todas las actions devuelvan un resultado tipado y registren el error real solo en el servidor.

### CODE-03 · Las operaciones de varios pasos no usan transacciones

- `createProject`: tres inserts seguidos. Si falla el segundo, queda un proyecto sin tablero ni carpetas.
- `deleteOrganization` y `deleteProject`: borran los blobs antes de borrar la fila. Si el borrado de la fila falla, se pierden los archivos y los registros siguen vivos.
- `reorderCards`: N updates en paralelo. Si falla uno, el orden queda a medias.
- **Arreglo:** mover esa lógica a funciones de Postgres (RPC), que se ejecutan como una sola transacción.

### CODE-04 · No hay tipos generados de Supabase

- Hay 23 `as unknown as` para forzar los tipos de los resultados.
- Si se renombra una columna, TypeScript no avisa y el fallo aparece en producción.
- **Arreglo:** `supabase gen types typescript` y pasar el tipo `Database` a `createClient`.

### CODE-05 · No se validan las entradas con un esquema

- Todo se valida a mano con `String(formData.get(...))`. Los `status` llegan sin validar y solo los frena el `check` de la base de datos.
- En las subidas no se valida el tipo, el tamaño ni el nombre del archivo, y `file.name` se usa sin limpiar dentro de la ruta de Storage.
- **Arreglo:** usar zod, o un equivalente, en cada action.

### CODE-06 · El lint falla con 5 errores

| Archivo | Regla |
| --- | --- |
| `src/app/(admin)/admin/calendar/page.tsx:29` | `Date.now()` en render (función impura) |
| `src/app/login/login-form.tsx:32` | `setState` dentro de `useEffect` |
| `src/components/board/board-view.tsx:135` | `setState` dentro de `useEffect` |
| `src/components/cookie-notice.tsx:12` | `setState` dentro de `useEffect` |
| `src/components/shared/dashboard-hero.tsx:20` | `setState` dentro de `useEffect` |

- **Por qué importa:** provocan renders extra y diferencias entre lo que pinta el servidor y lo que pinta el navegador.

### CODE-07 · Cada action hace llamadas repetidas a Supabase

- `requireAxelAdmin` llama a `getUser()` dos veces y luego hace una consulta más, en cada action. `uploadFile` vuelve a llamar a `isAxelAdmin()`.
- **Arreglo:** envolver `getSessionUser` e `isAxelAdmin` con `cache()` de React.

## 🟢 Bajas

### CODE-08 · Hay valores fijos y duplicados

- El cliente de Resend se crea en 3 archivos.
- `hello@alchemica.dk` aparece 22 veces en el código.
- Hay 91 referencias a "Axel" en roles y funciones (`axel_admin`, `notifyAxel`, `requireAxelAdmin`). La lógica queda atada a una persona en lugar de a un rol.

### CODE-09 · Casi no hay tests

- Solo hay 3 archivos de test, todos de utilidades puras (`csv`, `invoice-status`, `invoice-totals`).
- No hay ninguno de permisos, RLS ni Server Actions. Un test de RLS habría detectado SEC-01.

### CODE-10 · Hay componentes demasiado grandes

- `card-detail-modal.tsx` tiene 785 líneas, `board-view.tsx` 535, `invoice-builder.tsx` 400 y `files-view.tsx` 392.

### CODE-11 · Detalles menores

- `notifyAxel` espera a que salga el correo antes de responder al usuario. `after()` lo mandaría en segundo plano.
- No hay cabeceras de seguridad (CSP, `X-Frame-Options`, etc.) en `next.config.ts`.
- El webhook de Documenso no protege contra reenvíos (replay) y `request.json()` no está en un `try`.
- `0001_init.sql:2` incluye una ruta de un ordenador personal (`/Users/axelrosenvinge/...`).

### Lo que está bien hecho

- Hay RLS activado en todas las tablas.
- `server-only` protege las claves.
- El redirect después del login está validado (no permite open redirect).
- El webhook compara el secreto con `timingSafeEqual`.
- El login con magic link resiste el escáner de Outlook Safe Links.

---

# Parte 2 — QA funcional

## 🔴 Graves

### ~~QA-01 · Los clientes no pueden editar el tablero~~ — descartado

- **Corrección:** este hallazgo era incorrecto. `0003_client_collaboration.sql` añade políticas que permiten a los miembros crear y editar tarjetas, y `0012_kanban_upgrade.sql` les permite adjuntar y quitar archivos. Solo el borrado de tarjetas queda reservado al admin, y la interfaz ya oculta ese botón con `canDelete`.
- **Origen del error:** la revisión inicial buscó las políticas línea a línea y no detectó las que están escritas en varias líneas. Los demás hallazgos de RLS se volvieron a comprobar y se mantienen.

### QA-02 · El descuento en facturas calcula mal el IVA ✅

- **Confirmado (2026-10-09):** en el creador de facturas, 9.500 DKK de horas con 25 % de IVA y 3.000 DKK de descuento dieron un total de **8.875 DKK** (guardado así en la base de datos). Lo correcto es (9.500 − 3.000) × 1,25 = **8.125 DKK**: 750 DKK de más.
- **Pasos:** crear una factura doméstica de 1.000 DKK con 25 % de IVA y 200 DKK de descuento.
- **Esperado:** (1.000 − 200) × 1,25 = **1.000 DKK**.
- **Actual:** 1.000 + 250 − 200 = **1.050 DKK**. El IVA se calcula sobre el importe sin descontar.
- **Dónde:** `src/lib/invoice-totals.ts` y `src/lib/actions/invoices.ts:65`. La misma fórmula está duplicada en los dos sitios.

### QA-03 · Una factura puede quedar con total negativo ✅

- **Confirmado (2026-10-09):** una línea de 100 DKK con 5.000 DKK de descuento se guardó como borrador con `amount_cents = -487500` (−4.875 DKK).
- **Pasos:** poner un descuento mayor que el subtotal.
- **Actual:** se guarda una factura con `amount_cents` negativo. El input tiene `min={0}` pero no tiene máximo, y el servidor no valida nada.

### QA-04 · Se pueden repetir números de factura ✅

- **Confirmado (2026-10-09):** se creó una segunda factura con el número `2026-001`, que ya existía, y el sistema la aceptó.
- `invoices.invoice_number` no tiene restricción `unique`.
- En Dinamarca la numeración de facturas tiene que ser única y correlativa.

### QA-05 · Los clientes ven las facturas en borrador, y además marcadas como "Overdue" ✅

- **Confirmado (2026-10-09):** con el seed local, `owner@cliente.test` ve la factura en borrador 2026-003 como "OVERDUE" en /portal/invoices.

- **Pasos:** el admin guarda una factura como borrador con vencimiento pasado → el dueño del cliente entra en Portal → Invoices.
- **Actual:** el cliente ve un borrador que no se le ha enviado, con la etiqueta "Overdue".
- **Causa:** ni la consulta de `/portal/invoices` ni la política RLS de `invoices` filtran por `status <> 'draft'`.

### QA-06 · Las mismas horas se pueden facturar dos veces 📄

- **Pasos:** abrir el creador de facturas en dos pestañas, importar las mismas horas en ambas y guardar las dos.
- **Actual:** dos facturas cobran las mismas horas.
- **Causa:** el update de `hours_entries` no filtra `.is("invoice_id", null)` (`src/lib/actions/invoices.ts:95`).

## 🟠 Medios

### QA-07 · Una factura aparece como "Overdue" el mismo día de su vencimiento ✅

- **Confirmado (2026-10-09):** la factura 2026-002, que vence hoy, aparece como "OVERDUE".

- `deriveInvoiceStatus` compara `new Date("YYYY-MM-DD")`, que es medianoche UTC, con la hora actual.
- Una factura que vence hoy ya sale como vencida desde la madrugada. Los tests no cubren este caso.

### QA-08 · Las horas de las reuniones salen en UTC, no en hora danesa ✅

- **Confirmado (2026-10-09):** al programar una reunión a las 14:00 desde un equipo en UTC-6, se guardó como `20:00 UTC`. La hora escrita se interpreta con la zona horaria **del servidor**, no con la de quien la escribe. En Vercel (UTC) una reunión a las 14:00 en Copenhague se guardaría como 14:00 UTC, es decir, dos horas tarde.

- `meetings-view.tsx` y `admin/calendar/page.tsx` formatean las horas en el servidor, que en Vercel está en UTC.
- Una reunión a las 14:00 en Copenhague se muestra con 1 o 2 horas de diferencia.
- El cambio de "próxima" a "pasada" también ocurre a la hora equivocada.
- Al crear una reunión, `new Date(datetime-local)` también se interpreta en la zona horaria del servidor.

### QA-09 · Las fechas sin hora se desplazan un día cuando el servidor está en una zona horaria negativa ✅

- **Confirmado (2026-10-09):** con el servidor en UTC-6 (el equipo de desarrollo), una factura con `due_date = 2026-10-09` se muestra como "Due 08/10/2026", y una decisión guardada correctamente el 9 de octubre aparece con fecha 08/10. Las horas trabajadas y las líneas de factura sufren lo mismo.
- **Matiz:** el desfase lo causa la zona horaria del **servidor**, porque las fechas se formatean allí. En Vercel (UTC) estas fechas simples se verían bien; el fallo real en producción son las horas de reuniones (QA-08). Conviene corregirlo igualmente para que no dependa de dónde se ejecute.
- Horas trabajadas, decisiones, vencimientos y líneas de factura usan `new Date("YYYY-MM-DD")`.
- El tablero sí usa `parseLocalDate`, así que el comportamiento es inconsistente dentro de la propia app.

### QA-10 · El formulario de contacto acepta un email y luego lo rechaza ✅

- **Pasos:** escribir `ana@empresa` (sin punto en el dominio) y enviar.
- **Actual:** el navegador lo da por válido y el servidor responde *"Please fill in your name, a valid email, and a message."*. El usuario no sabe qué campo está mal.

### QA-11 · El formulario de contacto no tiene límite de longitud ✅

- El servidor aceptó un nombre de 5.000 caracteres y un mensaje de 200.000.
- El nombre va directo al asunto del correo.

### QA-12 · El formulario de contacto puede mostrar un error técnico al usuario 📄

- Si la respuesta no es JSON (un 500, un 413 o un timeout del proxy), `res.json()` falla.
- El usuario vería algo como `Unexpected token '<'…` en lugar de un mensaje legible.

### QA-13 · Los enlaces de descarga de facturas caducan sin aviso 📄

- Las URLs firmadas duran 1 hora. Si la página lleva más tiempo abierta, el botón de descarga da error.

## 🟡 Bajos (interfaz y accesibilidad)

### QA-14 · El título principal se lee sin espacios ✅

- El texto del `<h1>` de la portada es literalmente `Fewerfailedbatches.Sharpernextexperiments.`
- Afecta a lectores de pantalla, SEO y copiar y pegar. Lo causa la animación palabra por palabra en `src/components/hero.tsx:151`.

### QA-15 · La cabecera tapa el título de cada sección ✅

- Al navegar a `#about`, `#work`, etc., la cabecera fija (85 px) tapa la etiqueta de la sección.
- Las secciones tienen `scroll-margin-top: 0`.

### QA-16 · Problemas del menú móvil y del aviso de cookies ✅

- En móvil, el aviso de cookies tapa el botón "See how we work" de la portada.
- El menú móvil no se cierra con Escape y el botón no tiene `aria-controls`.
- Los enlaces del pie de página miden 16-20 px de alto. El mínimo recomendado para tocar con el dedo es 24 px, y lo ideal 44.

### Lo que funciona bien ✅

- No hay errores en la consola.
- No hay scroll horizontal en móvil.
- Todos los enlaces internos llevan a su sección.
- El 404 funciona.
- `sitemap.xml`, `robots.txt` y `opengraph-image` responden 200.

---

# Parte 3 — Hallazgos de la ronda por módulos (2026-10-09)

Se recorrió cada módulo con los tres roles contra un Supabase local. Todo lo marcado ✅ se reprodujo; los datos de prueba están en `supabase/seed.sql` y `supabase/seed-demo.sql`.

## 🔴 Seguridad e integridad

### SEC-07 · Un evento tardío del webhook degrada un contrato firmado ✅

- **Dónde:** [src/app/api/webhooks/documenso/route.ts](../src/app/api/webhooks/documenso/route.ts), rama `DOCUMENT_SENT`.
- **Prueba:** con el secreto configurado, se envió `DOCUMENT_SENT` para un contrato en estado `signed`. Respuesta 200 y el contrato quedó en **`sent`**.
- **Problema:** los webhooks se reintentan y pueden llegar desordenados. La rama `DOCUMENT_SENT` actualiza sin condición (solo la rama de firma parcial tiene `.neq("signing_status", "signed")`), así que un evento repetido o tardío borra el estado firmado.
- **Arreglo:** que el estado solo avance (`draft → sent → partially_signed → signed`) y nunca retroceda; y registrar el id del evento para ignorar repeticiones.

### SEC-08 · El enlace de reunión acepta cualquier esquema, incluido `javascript:` ✅

- **Dónde:** `createMeeting` y `updateMeeting` (`src/lib/actions/meetings.ts`), campo `zoom_url`.
- **Prueba:** se guardó `javascript:alert(document.domain)` como enlace de Zoom. React 19 lo neutraliza al pintar el botón "Join" (lo sustituye por un error), así que **hoy no es explotable**, pero el dato malo queda guardado y el botón no funciona.
- **Arreglo:** aceptar solo `http:` y `https:`. (Los enlaces del tablero ya lo hacen bien: añaden `https://` a lo que no empiece por http.)

### SEC-09 · El webhook responde 500 ante un cuerpo que no es JSON ✅

- Un `POST` con JSON roto devuelve 500 en lugar de 400 porque `request.json()` no está dentro de un `try`. Con el secreto correcto es solo ruido en los logs, pero conviene validarlo.

## 🔴 Graves (funcionales)

### QA-17 · Los archivos con `#`, `?` o `%` en el nombre quedan inaccesibles ✅

- **Prueba:** se subió `c#?%.txt`. La base de datos guardó la ruta `.../92fc…-c#?%.txt`, pero en Storage el objeto quedó como `.../92fc…-c` (cortado en el `#`). El archivo aparece listado pero **no se puede descargar** (ni siquiera se genera el enlace).
- **Causa:** `src/lib/actions/files.ts:33` construye la ruta con `file.name` sin limpiar.
- **Arreglo:** generar la ruta de Storage con un nombre saneado (por ejemplo solo `[A-Za-z0-9._-]`) y guardar el nombre original aparte en `filename`, que ya existe.

### QA-20 · El cliente ve contratos en borrador ✅

- **Prueba:** `owner@cliente.test` ve en `/portal/contracts` el contrato "Statement of work — phase 2" en estado `draft`, que aún no se le ha enviado. Es el mismo problema que QA-05 con las facturas.
- **Causa:** ni la consulta del portal ni la política RLS de `contracts` filtran por `signing_status`.
- **Arreglo:** política RLS `signing_status <> 'draft'` para los miembros del cliente (como se hizo con los entregables).

### QA-21 · Firma electrónica: solo verificado el caso sin configurar ➖

- Sin `DOCUMENSO_API_KEY`, "Send for e-signature" falla con el mensaje claro `DOCUMENSO_API_KEY is not configured.` y no deja datos a medias (el contrato sigue en `draft`).
- El envío real, la firma y la descarga del PDF firmado no se pudieron verificar.

## 🟠 Medios

### QA-18 · Se aceptan más de 24 horas en un día ✅

- Se registraron **30 horas** en una sola entrada sin ningún aviso. `hours_entries.hours` es `numeric(5,2)`, así que solo falla a partir de 1.000.
- **Arreglo:** validar `0 < horas ≤ 24` en el servidor y con `max` en el formulario.

### QA-19 · Las tarjetas nuevas no guardan quién las creó ✅

- `createCard` (`src/lib/actions/board.ts:74`) llama a `requireSessionUser()` pero descarta el usuario, y el `insert` no incluye `created_by`. Una tarjeta creada por un cliente queda con `created_by = null`.
- **Efecto:** las notificaciones de comentarios avisan "a los asignados y al creador", así que el creador nunca recibe aviso en tarjetas nuevas.

### QA-22 · "Cobrado este mes" usa la fecha de emisión, no la de pago ✅

- `src/app/(admin)/admin/reports/page.tsx:64` filtra las facturas pagadas por `issued_at`. No existe una columna de fecha de pago (`paid_at`), así que una factura emitida en septiembre y pagada en octubre no cuenta como cobrada en octubre.
- Además `h.entry_date >= monthStart` compara una fecha (`2026-10-01`) con un texto ISO (`2026-10-01T06:00:00.000Z`) y excluye las horas del día 1 de cada mes.

### QA-23 · Subir más de 4 MB da un mensaje técnico ✅

- Un archivo de 5 MB falla con `Body exceeded 4mb limit`. Para datos de laboratorio (espectros, hojas de especificación) 4 MB es poco. Conviene un mensaje legible y, si es necesario, subida directa a Storage con URL firmada.

### QA-24 · El valor estimado de un prospecto solo admite enteros ✅

- El campo no tiene `step="0.01"`, así que el navegador rechaza `1234.56` aunque el servidor guarda céntimos.

### QA-25 · Asignar a alguien en el tablero no le notifica ✅

- `toggleCardAssignee` no crea notificación. Solo los comentarios notifican.

### QA-26 · Funciones a medias: Onboarding, Feedback y Riesgos ✅

- Las tablas `onboarding_checklist_items`, `feedback_threads`, `feedback_messages` y `risks` existen con sus permisos, pero **ningún código las usa** (0 referencias en `src`). Un cliente convertido desde un prospecto queda con 0 pasos de onboarding.

## 🟡 Menores

### QA-27 · Detalles de interfaz ✅

- El detalle de tarjeta muestra **"IN IN PROGRESS"** (el "in" se duplica).
- Las reuniones pasadas siguen mostrando el botón **"Join"**.
- Guardar el CVR y la dirección en Team no muestra ninguna confirmación.
- El formulario de horas se limpia sin avisar de que se guardó.
- Los botones "Delete project" tienen todos el mismo nombre accesible.
- Decisiones y actualizaciones no se pueden editar, solo borrar.
- El cliente no puede invitar a su equipo desde el portal (la política RLS lo permite, pero no hay pantalla).
- La factura no muestra la dirección del vendedor (`BUSINESS_INFO.address` está vacío): obligatoria en una factura danesa.

### QA-28 · El CSV no lleva BOM 📄

- `/api/export/hours` y `/api/export/invoices` devuelven UTF-8 sin BOM. Excel suele mostrar mal æ, ø y å. Las fechas salen en formato técnico (`2026-10-09T00:00:00+00:00`).

### QA-29 · Las páginas legales no identifican a la empresa 📄

- `privacy` y `terms` no indican el responsable del tratamiento (nombre legal, CVR, dirección) ni la ley y jurisdicción aplicables. Es un tema de contenido, no de código: conviene revisarlo con un asesor.

## Lo que funciona bien ✅

- **Acceso:** login con magic link para admin, dueño y colaborador; el invitado queda vinculado a su organización la primera vez que entra; las rutas protegidas redirigen.
- **Admin:** dashboard, clientes (crear, editar, borrar), invitaciones, proyectos (editar con validación, borrar), tablero (asignar, etiquetas, enlaces seguros, borrar sin huérfanos), archivos (carpetas, mover, descargar), reuniones, actualizaciones (HTML escapado), horas (crear, editar, borrar), facturas (importar horas, cambiar estado, duplicar, borrar), contratos (crear con PDF), prospectos (convertir a cliente), búsqueda en todas las entidades, notificaciones y exportaciones.
- **Portal:** resumen, tablero (crear, comentar), archivos (subir y descargar), reuniones, decisiones, actualizaciones, horas, equipo (editar CVR) y facturas.
- **Módulo Deliverables (nuevo):** el cliente no puede modificar, borrar ni crear entregables; su única escritura es `review_deliverable()`, que exige ser el dueño del workspace y que el entregable esté en revisión. Verificado como dueño, colaborador, otro cliente, admin y anónimo. Los borradores no son visibles para el cliente ni a través de sus archivos.

## No verificable en esta ronda ➖

- **Arrastrar tarjetas entre columnas:** la herramienta de pruebas no genera los eventos de puntero de la librería de arrastre.
- **Firma electrónica real y envío de correos:** faltan las claves de Documenso y Resend.
- **Cómo se ve el CSV en Excel.**

---

## Pendiente

- Corregir los hallazgos, empezando por SEC-01 y SEC-02.
- Confirmar con un cliente real si los hallazgos de permisos (SEC-03, SEC-04) se comportan igual en producción, por si allí hay políticas que no están en las migraciones.
