# Juntada

Web app para **guardar y decidir planes en grupo**: pareja, amigos, hermanos o estudio.

Catálogo para no olvidar, bandeja Pronto para decidir, votos secretos, azar, valoraciones públicas en Descubrir y gastos en **EUR**.

> Nombre provisional de trabajo. El nombre final se define después.

## Qué incluye este MVP

- Login demo: correo / teléfono / Apple-iCloud (+ usuarios demo)
- Grupos + código invite
- **Catálogo** (guardar para no olvidar) vs **Pronto** (decidir / este finde)
- Ideas por tipo (película / serie / visitar / comer / plan) + tags
- Lugares con nombre + dirección obligatorios en visitar/comer/plan (varios en un plan) → Maps
- Película: cine o casa; en lugares podés elegir la casa de alguien del grupo
- Voto secreto, reveal, “ahora no”, elegir (en Pronto)
- **Que decida el azar** entre finalistas de Pronto
- Valoración + comentario al terminar (opción pública)
- **Descubrir**: opiniones públicas abiertas
- Gastos del grupo y saldos (EUR)
- Puntos + badges por grupo
- Look regional fuerte: tipografía, botones y fondo cambian por país (ES/AR) y provincia
- País / provincia / ciudad / barrio solo desde listas reales
- Privacidad de ubicación **por grupo**: solo país, provincia, barrio o dirección completa
- Amigos de experiencia (solo si completaron algo juntos)
- Diseño responsive, tono cercano ES con toque rioplatense

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Persistencia local (`localStorage` v2) para arrancar sin backend

Pensado para crecer: mercado España primero, i18n/monedas después, PWA/app móvil más adelante. La visión completa está en [`PRODUCT_VISION.md`](./PRODUCT_VISION.md).

## Correr en local

```bash
npm install
npm run dev -- --port 3456 --hostname 127.0.0.1
```

Abrí [http://127.0.0.1:3456](http://127.0.0.1:3456).

### Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint

## Cómo probar rápido

1. Entrá con Lucía (Madrid), Mateo (Sevilla), Sofía (Barcelona) o Valentina (Buenos Aires) — el look cambia al instante
2. En Perfil, cambiá país/provincia para previsualizar tipografía, botones y fondo
3. Abrí un grupo → proponé / votá / revelá / sorteá
4. Probá gastos y mirá saldos

Los datos viven en este navegador. “Resetear demo local” en el perfil vuelve al seed.
