# Auditoría del proyecto — 2026-10-08

Revisión de seguridad, calidad de código y QA funcional del proyecto Alchemica (Next.js 16 + Supabase).

## Cómo se hizo

- Herramientas automáticas: `eslint`, `tsc --noEmit`, `vitest run`, `npm audit --omit=dev`.
- Revisión manual de autenticación, políticas RLS (`supabase/migrations/`), Server Actions y rutas de API.
- Pruebas en navegador (escritorio y móvil 375×812) del sitio público.
- El portal y el admin **no se probaron en navegador** porque no había `.env.local` con Supabase.

Cada hallazgo indica cómo se comprobó:

- ✅ **Probado**: reproducido en el navegador.
- 📄 **Código**: deducido leyendo el código y las migraciones. Hay que confirmarlo con Supabase conectado: si la base de datos de producción tiene políticas que no están en las migraciones, alguno podría no ocurrir.

## Resumen

| Herramienta | Resultado |
| --- | --- |
| `tsc --noEmit` | Sin errores |
| `vitest run` | 19/19 tests pasan (3 archivos) |
| `eslint` | 5 errores |
| `npm audit` | 6 vulnerabilidades (1 crítica, 4 altas, 1 moderada) |

### Prioridades

1. **SEC-01**: escalada a administrador por la política de `profiles`.
2. **SEC-02**: actualizar `next` a 16.4.0.
3. **QA-01 a QA-06**: tablero del portal y errores de facturación.

---

# Parte 1 — Malas prácticas

## 🔴 Críticas

### SEC-01 · Cualquier usuario puede hacerse administrador

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

### SEC-03 · Se pueden mandar notificaciones falsas a cualquier usuario

- **Dónde:** [supabase/migrations/0014_notifications.sql](../supabase/migrations/0014_notifications.sql), política `"members create notifications on own project"`.
- **Problema:** solo comprueba `actor_id = auth.uid()`. Con `project_id = null`, cualquier usuario puede insertar una notificación con cualquier texto para cualquier `recipient_id`, incluido el admin. Sirve para phishing dentro de la app.
- **Arreglo:** exigir `project_id not null` y que el destinatario sea miembro de esa organización (o admin).

### SEC-04 · Se puede subir un archivo a nombre de otra persona

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

### QA-01 · Los clientes no pueden editar el tablero, aunque la interfaz se lo permite 📄

- **Pasos:** entrar al portal como cliente → Board → arrastrar una tarjeta, o cambiarle el título, la fecha, la descripción o las etiquetas.
- **Esperado:** el cambio se guarda, o la interfaz no ofrece esa acción.
- **Actual:** el cambio se ve en pantalla y, tras la revalidación, se revierte sin ningún error. Crear una tarjeta falla con un error genérico. Adjuntar un archivo a una tarjeta también falla, porque `board_card_files` solo permite insertar al admin.
- **Causa:** `/portal/board` usa el mismo `BoardView` que el admin, pero `board_cards` solo permite INSERT, UPDATE y DELETE al admin (`0001_init.sql:369-371`). Un UPDATE bloqueado por RLS devuelve 0 filas sin error, así que la action lo da por bueno.
- **Decisión pendiente:** definir si los clientes pueden editar el tablero. Si pueden, añadir las políticas. Si no, ocultar los controles en el portal.

### QA-02 · El descuento en facturas calcula mal el IVA 📄

- **Pasos:** crear una factura doméstica de 1.000 DKK con 25 % de IVA y 200 DKK de descuento.
- **Esperado:** (1.000 − 200) × 1,25 = **1.000 DKK**.
- **Actual:** 1.000 + 250 − 200 = **1.050 DKK**. El IVA se calcula sobre el importe sin descontar.
- **Dónde:** `src/lib/invoice-totals.ts` y `src/lib/actions/invoices.ts:65`. La misma fórmula está duplicada en los dos sitios.

### QA-03 · Una factura puede quedar con total negativo 📄

- **Pasos:** poner un descuento mayor que el subtotal.
- **Actual:** se guarda una factura con `amount_cents` negativo. El input tiene `min={0}` pero no tiene máximo, y el servidor no valida nada.

### QA-04 · Se pueden repetir números de factura 📄

- `invoices.invoice_number` no tiene restricción `unique`.
- En Dinamarca la numeración de facturas tiene que ser única y correlativa.

### QA-05 · Los clientes ven las facturas en borrador, y además marcadas como "Overdue" 📄

- **Pasos:** el admin guarda una factura como borrador con vencimiento pasado → el dueño del cliente entra en Portal → Invoices.
- **Actual:** el cliente ve un borrador que no se le ha enviado, con la etiqueta "Overdue".
- **Causa:** ni la consulta de `/portal/invoices` ni la política RLS de `invoices` filtran por `status <> 'draft'`.

### QA-06 · Las mismas horas se pueden facturar dos veces 📄

- **Pasos:** abrir el creador de facturas en dos pestañas, importar las mismas horas en ambas y guardar las dos.
- **Actual:** dos facturas cobran las mismas horas.
- **Causa:** el update de `hours_entries` no filtra `.is("invoice_id", null)` (`src/lib/actions/invoices.ts:95`).

## 🟠 Medios

### QA-07 · Una factura aparece como "Overdue" el mismo día de su vencimiento 📄

- `deriveInvoiceStatus` compara `new Date("YYYY-MM-DD")`, que es medianoche UTC, con la hora actual.
- Una factura que vence hoy ya sale como vencida desde la madrugada. Los tests no cubren este caso.

### QA-08 · Las horas de las reuniones salen en UTC, no en hora danesa 📄

- `meetings-view.tsx` y `admin/calendar/page.tsx` formatean las horas en el servidor, que en Vercel está en UTC.
- Una reunión a las 14:00 en Copenhague se muestra con 1 o 2 horas de diferencia.
- El cambio de "próxima" a "pasada" también ocurre a la hora equivocada.
- Al crear una reunión, `new Date(datetime-local)` también se interpreta en la zona horaria del servidor.

### QA-09 · Las fechas sin hora se desplazan un día en zonas horarias negativas 📄

- Horas trabajadas, decisiones, vencimientos y líneas de factura usan `new Date("YYYY-MM-DD")`.
- Para un usuario en América aparecen un día antes.
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

## Pendiente

- Confirmar los hallazgos 📄 con Supabase conectado (`.env.local`), usando un usuario cliente de prueba.
