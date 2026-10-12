# Juntada

Web app para **decidir planes en grupo**: pareja, amigos, hermanos o estudio.

Proponés ideas (pelis, sitios, comida, planes), votás en secreto, revelás, sorteás con azar entre finalistas, marcás lo hecho y liquidás gastos en **EUR**.

> Nombre provisional de trabajo. El nombre final se define después.

## Qué incluye este MVP

- Usuarios locales (demo en el navegador) con ciudad/barrio
- Grupos + código invite
- Ideas por tipo + tags + dirección con enlace a Google Maps
- Voto secreto, reveal, “ahora no”, elegir plan
- Botón **Que decida el azar** (top finalistas)
- Recuerdo post-plan (rating + nota)
- Gastos del grupo (sueltos o asociados) y quién le debe a quién
- Puntos + badges por grupo
- Diseño responsive, tono divertido ES con toque rioplatense en el copy

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Persistencia local (`localStorage`) para arrancar sin backend

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
