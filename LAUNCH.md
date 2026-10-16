# Lanzamiento de Juntada (producto real, coste 0 al inicio)

Este doc fija **qué usamos gratis ahora**, **qué queda pendiente** (cuando haya presupuesto o sea imprescindible) y **cómo desplegar** sin tirar datos al abrir al público.

---

## Decisión actual (2026-10-13)

- Producto **real** (no demo de feria): cuentas + base de datos compartida.
- Uso inicial: **&lt;10 personas** (amigos + pareja).
- **Sin costes** en esta fase.
- URL **gratis** del hosting (`*.vercel.app`).
- Login obligatorio para usar `/app`, grupos, etc.

Cuando crezca el público, **no se migra de un juguete**: ya estaremos en Postgres + Auth reales. Solo se activan canales de pago y se sube de plan si hace falta.

---

## Ahora (100 % gratis)

| Pieza | Servicio | Notas |
|--------|----------|--------|
| Web | **Vercel** Hobby | URL tipo `https://juntada-xxx.vercel.app` |
| DB + Auth | **Supabase** Free | Postgres + login por correo (link mágico) |
| Correo de login | Supabase Auth (built-in) | Límite diario en free; sobra para &lt;10 |
| Avisos por correo | Supabase o **Resend** Free | Eventos: invite, voto, resultados, gasto… |
| Calles / CP | Nominatim (OSM) vía `/api/address-search` | Sin API key |

### Login ahora
- **Registro / login obligatorio**: usuario único + correo + contraseña.
- Al registrarte **sí llega un mail de confirmación** (uno por persona, a su correo). Eso no es aviso de la app.
- Tras confirmar: onboarding con **dirección obligatoria**; teléfono / Instagram / TikTok opcionales.
- En cada grupo elegís si ven tu **@usuario** o tu **nombre real**.
- Teléfono SMS y Apple / iCloud: UI lista, activación pendiente (pago).

### Notificaciones ahora
- **Solo in-app** (apartado Avisos). **No se mandan mails** de eventos del grupo (ideas, votos, gastos…).
- La misma cola servirá luego para email / WhatsApp / push si los activamos.

---

## Pendiente (cuando haya coste o cuentas de pago)

Marcado a propósito para no olvidarlo. **No bloquea** el lanzamiento entre vosotros.

### Auth (canales de pago)
- [ ] **Teléfono / SMS** (OTP real) — proveedor tipo Twilio; coste por SMS.
- [ ] **Sign in with Apple / iCloud** — Apple Developer (~99 USD/año) + config en Supabase.
- [ ] **Google** (OAuth) — gratis de configurar, opcional; no es iCloud.

### Notificaciones
- [ ] **WhatsApp** (Meta Business + plantillas + proveedor) — no es free real.
- [x] **Web Push PWA** (gratis, iOS + Android) — hecho 2026-10-16; VAPID + migración `016`.
- [ ] Push nativo de App Store / Play — opcional; la PWA ya cubre avisos.

### Producto / ops
- [ ] Dominio propio (`juntada.com`) + email `noreply@…` bonito.
- [ ] Subir plan Vercel/Supabase si el free se queda corto.
- [ ] Backups automáticos / monitoreo más serio.
- [x] **PWA instalable** (manifest + SW + prompt) — hecho 2026-10-16; sigue siendo web.
- [ ] App nativa en stores (iOS/Android) — opcional más adelante; la PWA cubre el día a día.

### Producto (visión, no infra)
Ver también `PRODUCT_VISION.md`: más juegos de reunión, temporadas/badges.  
Backlog free producto 1 (PWA→polish + Web Push): **hecho**. En Supabase corré `014`, `015` y **`016_push_subscriptions.sql`**. En Vercel: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (`npm run vapid` para generar el par).

---

## Qué tenés que crear vos (cuentas gratis)

1. [ ] Cuenta en [supabase.com](https://supabase.com) → New project.  
2. [ ] SQL Editor: `001_init.sql`. Si el proyecto ya existía, también `002`, `003` y **`004_accounts_inapp_notifications.sql`**.  
3. [ ] Auth → Providers → Email: Enabled. **Confirm email = ON** (mail de registro sí; avisos de la app no).  
4. [ ] Auth → URL configuration: Site URL = tu URL de Vercel. Redirect URLs: `https://tu-app.vercel.app/auth/confirm**` y local si hace falta.  
4b. [ ] Auth → Emails → **Confirm signup**: el enlace debe ir a  
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/app/onboarding`
5. [ ] Copiar **Project URL** y **anon public key** → variables de entorno.  
6. [ ] Cuenta en [vercel.com](https://vercel.com) → Importar este repo → mismas env vars → Deploy.

### Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

Sin `NEXT_PUBLIC_SUPABASE_URL`, la app sigue en **modo local** (`localStorage`) solo para desarrollo. En producción **hay que** configurar Supabase.

---

## Garantía “no se pierde nada al abrir al público”

- Usuarios y datos viven en **Postgres (Supabase)** desde el día 1 del modo cloud.
- Ampliar a SMS/Apple/Google = **añadir proveedores** sobre las mismas cuentas/`profiles`.
- Ampliar notificaciones = nuevos **canales** sobre la misma tabla `notification_events`.

---

## Checklist de go-live (&lt;10 personas)

1. [ ] Migración SQL aplicada.  
2. [ ] Env en Vercel configuradas.  
3. [ ] Deploy OK; entrar con tu correo real.  
4. [ ] Crear un grupo, invitar con código, votar entre dos cuentas.  
5. [ ] Confirmar que el look/ubicación se guarda en perfil.  
6. [ ] Pasar el link solo al grupo (sin marketing).
