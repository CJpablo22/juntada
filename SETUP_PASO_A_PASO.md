# Paso a paso al milímetro — poner Juntada online (gratis)

Tiempo estimado: 30–45 minutos la primera vez.  
Necesitás: navegador, tu correo, y (recomendado) una cuenta de **GitHub**.

> **Importante:** hoy el código vive en el git de Cursor. Vercel se conecta mejor a **GitHub**. Por eso el paso 0 es publicar el repo en GitHub.  
> **También importante:** cuando termines estos pasos, avisame. Todavía hay que terminar de migrar grupos/ideas/votos a la base de datos antes de invitar a los amigos (si no, cada uno vería datos distintos en su navegador).

Marcá con `[x]` lo que vayas haciendo.

---

## Paso 0 — Tener el código en GitHub

### 0.1 Crear cuenta GitHub (si no tenés)
1. Andá a https://github.com/signup  
2. Creá la cuenta con tu correo.  
3. Confirmá el correo si te lo pide.

### 0.2 Crear el repositorio en GitHub
1. Entrá a https://github.com/new  
2. **Repository name:** `juntada` (o el que quieras).  
3. **Public** o **Private** (Private está bien).  
4. **NO** marques “Add a README” (el repo ya tiene código).  
5. Click **Create repository**.  
6. Dejá esa pestaña abierta: vas a ver una URL tipo  
   `https://github.com/TU_USUARIO/juntada.git`

### 0.3 Subir el código desde Cursor
En Cursor, si todavía no creaste el repo del proyecto:
1. Usá el botón / pill **Create repo** del agente/proyecto si te aparece, y conectalo a GitHub.  
2. O pedime: *“conectá este proyecto a GitHub en la URL …”* y lo empujamos juntos.

Comprobación: en GitHub, abriendo el repo, tenés que ver archivos como `README.md`, `LAUNCH.md`, `src/`, `supabase/migrations/001_init.sql`.

---

## Paso 1 — Crear proyecto en Supabase (base de datos + login)

### 1.1 Cuenta
1. Andá a https://supabase.com  
2. Click **Start your project** / **Sign up**.  
3. Entrá con **GitHub** (lo más simple) o con correo.  
4. Si te pide organización, creá una personal (nombre da igual).

### 1.2 Nuevo proyecto
1. En el dashboard: **New project**.  
2. Completá:
   - **Name:** `juntada`  
   - **Database password:** generá una fuerte y **guardala en un gestor/notas** (la vas a necesitar pocas veces; no la pegues en el chat público).  
   - **Region:** la más cercana (ej. `Frankfurt` / `eu-central-1` si estás en España).  
   - **Plan:** **Free**.  
3. Click **Create new project**.  
4. Esperá 1–2 minutos hasta que el proyecto quede **Ready** (deja de decir “Setting up”).

### 1.3 Ejecutar el SQL (crear tablas)
1. En el menú izquierdo: **SQL** → **SQL Editor**.  
2. Click **New query**.  
3. Abrí en el repo el archivo:  
   `supabase/migrations/001_init.sql`  
4. **Seleccioná TODO el contenido** (Ctrl+A) y copialo.  
5. Pegalo en el editor SQL de Supabase.  
6. Click **Run** (o Ctrl+Enter).  
7. Abajo debería decir algo como **Success**. Si hay error en rojo, copiá el mensaje y mandámelo.  
8. **Si ya habías corrido el 001 antes** (proyecto ya creado): abrí también  
   `supabase/migrations/002_profile_identity.sql`, pegalo en una **nueva query** y **Run**.  
   Eso guarda en el perfil el correo / teléfono / Apple con el que entrás.  
9. Corré también `003`–`015`, **`016`–`019`**, **`020_fix_group_members_rls_recursion.sql`** (corta el error *infinite recursion* en `group_members`; sin esto ideas/gastos no se ven entre dispositivos), **`021_plan_options.sql`** y **`022_plan_option_title.sql`** (alternativas de qué/dónde/cuándo dentro de la misma idea).  
10. En Vercel agregá **`SUPABASE_SERVICE_ROLE_KEY`** (solo server, sin `NEXT_PUBLIC_`) para login con @usuario **y** para enviar push al grupo.  
10b. Web Push (gratis): en la máquina corré `npm run vapid` y pegá en Vercel  
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y opcional `VAPID_SUBJECT=mailto:avisos@juntada.app`.  
    En el móvil: Perfil → **Activar avisos push** (en iPhone, primero «Añadir a pantalla de inicio»).  
11. Auth → Providers → Email: activá Email y **dejá Confirm email ON** (mail de registro sí).  
    Los avisos del grupo **no** van por mail: solo in-app.  
12. Auth → Emails → **Confirm signup** — Subject: `Confirmá tu cuenta en Juntada`. Body con enlace:
```html
<h2>Confirmá tu cuenta</h2>
<p>Tocá el enlace para activar Juntada:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/app/onboarding">
    Confirmar correo
  </a>
</p>
```

Comprobación:
1. Menú izquierdo → **Table Editor**.  
2. Tenés que ver tablas: `profiles`, `groups`, `group_members`, `ideas`, `reviews`, `expenses`, `point_events`, `notification_events`.  
3. En `profiles` las columnas `email`, `phone` y `auth_provider` se rellenan al hacer login.

### 1.4 Copiar las claves del proyecto
1. Menú izquierdo → **Project Settings** (engranaje).  
2. **API**.  
3. Anotá en un bloc (sin compartirlas en público):
   - **Project URL** → algo como `https://abcdefgh.supabase.co`  
   - **anon public** key → un JWT largo que empieza por `eyJ...`  
4. **NO uses** la `service_role` key en el front ni en Vercel como pública.

---

## Paso 2 — Configurar el login por correo (link mágico)

### 2.1 URLs de Auth (provisional con local + luego Vercel)
1. Menú izquierdo → **Authentication**.  
2. **URL Configuration** (o *Authentication → Settings → URL Configuration*).  
3. **Site URL:** por ahora poné  
   `http://127.0.0.1:3456`  
   (luego la cambiaremos a la de Vercel).  
4. **Redirect URLs** → **Add URL**, agregá **estas dos** (una por una):
   - `http://127.0.0.1:3456/auth/confirm`  
   - `http://127.0.0.1:3456/**`  
5. Guardá (**Save**).

> Cuando tengas la URL de Vercel (paso 4), volvé acá y agregá también:  
> - Site URL = `https://TU-APP.vercel.app`  
> - Redirect: `https://TU-APP.vercel.app/auth/confirm`  
> - Redirect: `https://TU-APP.vercel.app/**`

### 2.2 SMTP gratis + plantilla Magic Link

En el plan Free, Supabase muestra *“Set up custom SMTP to edit templates”* y **bloquea** editar el mail.  
Sin cambiar la plantilla, el login de Juntada (SSR) no queda bien. Solución gratis: **Resend** como SMTP.

#### 2.2.a Cuenta Resend
1. https://resend.com/signup → creá cuenta (GitHub o correo).  
2. Confirmá el email si te lo pide.

#### 2.2.b API Key
1. Resend → **API Keys** → **Create API Key**.  
2. Name: `juntada-smtp` · Permission: **Sending access**.  
3. **Add** → copiá `re_...` y guardala (solo se ve una vez).

#### 2.2.c Dominio (para mandar a los amigos)
1. Resend → **Domains** → **Add Domain** si tenés dominio.  
2. Si **no** tenés dominio todavía:
   - Podés probar el login **solo a tu propio correo** con el sender de prueba.
   - Para los 10 amigos hará falta un dominio barato verificado en Resend (más adelante; documentado en `LAUNCH.md`).

#### 2.2.d Activar SMTP en Supabase
1. En la pantalla del Magic Link, click **Set up SMTP**  
   (o **Project Settings** → **Authentication** → Custom SMTP).  
2. Activá **Enable custom SMTP**.  
3. Completá:

| Campo | Valor |
|--------|--------|
| Sender email | Con dominio verificado: `noreply@tudominio.com`. Sin dominio: el que Resend te indique para tests (a menudo ligado a tu cuenta). |
| Sender name | `Juntada` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | tu API key `re_...` |

4. **Save**.  
5. Volvé a **Authentication** → **Emails** → **Magic link or OTP**.  
6. El aviso amarillo debería desaparecer y Subject/Body se pueden editar.

#### 2.2.e Editar la plantilla
1. Desactivá solo **Preview** si hace falta, para ver el HTML/Source.  
2. **Subject:** `Entrá a Juntada`  
3. **Body** (el `href` tiene que llevar `token_hash`):

```html
<h2>Entrá a Juntada</h2>
<p>Tocá el enlace para entrar (caduca en unos minutos):</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app">
    Entrar a Juntada
  </a>
</p>
```

4. **Save changes**.

### 2.3 Proveedor Email activado
1. **Authentication** → **Providers**.  
2. **Email** → que esté **Enabled**.  
3. **Save** si cambiaste algo.

---

## Paso 3 — Misma key de Resend para avisos de la app (opcional)

El login ya usa Resend vía SMTP.  
Más adelante, en Vercel, podés poner la misma `re_...` como `RESEND_API_KEY` para avisos (“te invitaron”, “hay que votar”). No hace falta otra cuenta.

Si preferís, **salteá Resend** y lo hacemos después.

---

## Paso 4 — Vercel (la web pública)

### 4.1 Cuenta Vercel
1. https://vercel.com/signup  
2. **Continue with GitHub**.  
3. Autorizá a Vercel a ver tus repos (al menos el de `juntada`).

### 4.2 Importar el proyecto
1. Dashboard → **Add New…** → **Project**.  
2. En la lista, elegí el repo `juntada` → **Import**.  
3. Framework Preset: debería detectar **Next.js**. No lo cambies.  
4. **Root Directory:** dejalo vacío / `.`  
5. **Antes de Deploy**, abrí **Environment Variables** y agregá:

| Name | Value | Environments |
|------|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | tu Project URL de Supabase | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key `eyJ...` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | dejalá vacía un momento **o** poné un placeholder; la corregimos tras el primer deploy | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (Project Settings → API) — **nunca** pública | Production, Preview, Development |

6. Click **Deploy**.  
7. Esperá a que diga **Ready** (2–3 minutos).  
8. Copiá la URL que te da, tipo:  
   `https://juntada-xxxx.vercel.app`

### 4.3 Fijar la URL definitiva
1. En Vercel → tu proyecto → **Settings** → **Environment Variables**.  
2. Editá / creá `NEXT_PUBLIC_APP_URL` = `https://juntada-xxxx.vercel.app` (la tuya, sin barra final).  
3. **Settings** → **Deployments** → en el último deployment → menú **⋯** → **Redeploy** (para que tome la variable).

### 4.4 Volver a Supabase con la URL real
1. Supabase → **Authentication** → **URL Configuration**.  
2. **Site URL:** `https://juntada-xxxx.vercel.app`  
3. En Redirect URLs agregá:
   - `https://juntada-xxxx.vercel.app/auth/confirm`  
   - `https://juntada-xxxx.vercel.app/**`  
4. Podés dejar también las de `127.0.0.1` si vas a probar en local.  
5. **Save**.

---

## Paso 5 — Probar que el login funciona

1. Abrí en el móvil o PC: `https://juntada-xxxx.vercel.app/enter`  
2. Tab **Correo**.  
3. Poné tu nombre (opcional) y tu email real.  
4. Click **Enviarme el enlace**.  
5. Abrí el correo (también spam).  
6. Tocá **Entrar a Juntada**.  
7. Deberías terminar en `/app`.

Si falla:
- Enlace inválido → revisá plantilla Magic Link (paso 2.2) y Redirect URLs (paso 4.4).  
- No llega mail → Authentication → Users / Logs en Supabase; en free hay límite diario de mails.  
- Página en blanco → Vercel → Deployments → Logs; copiá el error y mandámelo.

---

## Paso 6 — Avisarme (bloqueante antes de invitar amigos)

Escribime algo como:

> Ya tengo Supabase + Vercel. URL: `https://….vercel.app`. El login por correo funciona.

Entonces yo:
1. Termino de conectar grupos / ideas / votos / gastos a la base (para que los 10 vean lo mismo).  
2. Te digo el checklist final de “invitar a la pareja y amigos”.

**No invites al resto todavía** hasta ese punto: el login cloud puede estar, pero la lógica de grupos aún parte del modo local hasta que cerremos esa migración.

---

## Resumen ultra corto

| # | Qué | Dónde |
|---|-----|--------|
| 0 | Repo en GitHub | github.com |
| 1 | Proyecto Free + SQL `001_init.sql` | supabase.com |
| 2 | Magic Link + URLs | Supabase → Authentication |
| 3 | (Opcional) Resend | resend.com |
| 4 | Import repo + env vars + Deploy | vercel.com |
| 5 | Probar `/enter` con tu mail | tu URL `.vercel.app` |
| 6 | Avisarme | chat |

---

## Lo que NO hagas todavía (para no gastar)

- No actives SMS / Twilio.  
- No configures Sign in with Apple.  
- No configures WhatsApp Business.  
- No compres dominio (salvo que quieras).  

Eso está listado en `LAUNCH.md` como pendiente.
