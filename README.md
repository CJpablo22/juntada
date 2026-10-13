# Juntada

Web app para **guardar y decidir planes en grupo**: pareja, amigos, hermanos o estudio.

Catálogo para no olvidar, bandeja Pronto para decidir, votos secretos, azar, valoraciones públicas en Descubrir y gastos en **EUR**.

> Nombre provisional de trabajo. El nombre final se define después.

## Qué incluye este MVP

- Login demo: correo / teléfono / Apple-iCloud (+ usuarios demo)
- Grupos + código invite
- **Catálogo** (guardar para no olvidar) vs **Pronto** (decidir / este finde)
- Ideas por tipo + tags + dirección → Google Maps
- Voto secreto, reveal, “ahora no”, elegir (en Pronto)
- **Que decida el azar** entre finalistas de Pronto
- Valoración + comentario al terminar (opción pública)
- **Descubrir**: opiniones públicas abiertas
- Gastos del grupo y saldos (EUR)
- Puntos + badges por grupo
- Diseño responsive, tono divertido ES con toque rioplatense

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

1. Entrá con Lucía, Mateo o Sofía (usuarios demo) o creá el tuyo
2. Abrí un grupo → proponé / votá / revelá / sorteá
3. Probá gastos y mirá saldos
4. Revisá tu perfil y badges

Los datos viven en este navegador. “Resetear demo local” en el perfil vuelve al seed.
