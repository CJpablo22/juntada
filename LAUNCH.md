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
- **Correo con link mágico** (cualquier Gmail, Outlook, etc.).
- Sin contraseña: te llega un mail → tocás el enlace → entras.
- **Obligatorio** estar logueado para usar la app.

### Notificaciones ahora
- **Solo correo** (gratis).
- Misma cola de eventos servirá luego para WhatsApp / push.

---

## Pendiente (cuando haya coste o cuentas de pago)

Marcado a propósito para no olvidarlo. **No bloquea** el lanzamiento entre vosotros.

### Auth (canales de pago)
- [ ] **Teléfono / SMS** (OTP real) — proveedor tipo Twilio; coste por SMS.
- [ ] **Sign in with Apple / iCloud** — Apple Developer (~99 USD/año) + config en Supabase.
- [ ] **Google** (OAuth) — gratis de configurar, opcional; no es iCloud.

### Notificaciones
- [ ] **WhatsApp** (Meta Business + plantillas + proveedor) — no es free real.
- [ ] **Push nativo** cuando exista la app iOS/Android (mismo backend de eventos).

### Producto / ops
- [ ] Dominio propio (`juntada.com`) + email `noreply@…` bonito.
- [ ] Subir plan Vercel/Supabase si el free se queda corto.
- [ ] Backups automáticos / monitoreo más serio.
- [ ] App nativa (PWA o store) — la web responsive cubre el día 1.

### Producto (visión, no infra)
Ver también `PRODUCT_VISION.md`: juegos de reunión, Descubrir unificado, fotos, etc.

---

## Qué tenés que crear vos (cuentas gratis)

1. [ ] Cuenta en [supabase.com](https://supabase.com) → New project.  
2. [ ] En el SQL Editor, pegar y ejecutar `supabase/migrations/001_init.sql`. Si el proyecto ya existía, ejecutá también `002_profile_identity.sql` (guarda mail/teléfono/Apple en el perfil).  
3. [ ] Auth → URL configuration: Site URL = tu URL de Vercel (y `http://127.0.0.1:3456` en local).  
4. [ ] Auth → Email templates → Magic Link: usar  
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app`  
5. [ ] Copiar **Project URL** y **anon public key** → variables de entorno.  
6. [ ] Cuenta en [vercel.com](https://vercel.com) → Importar este repo → mismas env vars → Deploy.  
7. [ ] (Opcional avisos) Cuenta [resend.com](https://resend.com) free + `RESEND_API_KEY`.

### Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
# Opcional (avisos por correo más adelante / Resend)
RESEND_API_KEY=
RESEND_FROM=Juntada <onboarding@resend.dev>
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
