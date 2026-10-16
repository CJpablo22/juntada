# Juntada

Web app para **guardar y decidir planes en grupo**: pareja, amigos, hermanos o estudio.

Catálogo para no olvidar, bandeja Pronto para decidir, votos secretos, azar, valoraciones públicas en Descubrir y gastos en **EUR**.

> Nombre provisional de trabajo. El nombre final se define después.

## Lanzamiento (gratis → público)

Leé **[`LAUNCH.md`](./LAUNCH.md)**: qué va **gratis ahora** (Vercel + Supabase + correo con link mágico), qué queda **pendiente de pago** (SMS, Apple/iCloud, WhatsApp, push), y cómo desplegar sin perder datos al abrir al público.

Sin variables de Supabase, la app corre en **modo local** (`localStorage` + usuarios demo) solo para desarrollo.

## Qué incluye este MVP

- Login: correo (magic link en cloud) / teléfono y Apple (UI lista; cloud = pendientes de coste)
- Grupos + código invite
- **Catálogo** vs **Pronto**
- Ideas: película / serie / visitar / comer / plan + lugares
- Voto secreto, reveal, azar, gastos, Descubrir, puntos
- Diseño único «Mesa puesta»; catálogo de provincias/localidades para ubicación
- Dirección con búsqueda + CP + piso/puerta; guardar solo al confirmar
- Privacidad de ubicación por grupo
- **PWA**: instalable en el móvil (manifest + service worker + aviso en app/Perfil)
- Foto opcional al marcar un plan como hecho (comprimida en el dispositivo)
- Privilegio del Capitán (#1): romper empates en Pronto 1×/semana
- Ritual semanal «¿qué hacemos?» con mood y finalistas de Pronto
- Digest semanal in-app (hechos, gastos, ranking) en Hechas
- Importar idea pegando link (Maps / Netflix / Letterboxd / IG)
- Álbum de recuerdos del grupo + juego presencial «El impostor»
- Descubrir ordenable; aviso «Falta tu voto»; preview clara de privacidad por grupo

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Dev: `localStorage` v2
- Prod (free): Supabase (Postgres + Auth) + Vercel

## Correr en local

```bash
npm install
cp .env.example .env.local   # opcional: rellenar Supabase
npm run dev -- --port 3456 --hostname 127.0.0.1
```

Abrí [http://127.0.0.1:3456](http://127.0.0.1:3456).

### Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint

## Cómo probar rápido (modo local)

1. Entrá con Lucía / Mateo / Sofía / Valentina
2. Perfil → ubicación → Guardar
3. Grupo → votá / sorteá / gastos

Visión de producto: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md).
