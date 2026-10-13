# Product Vision — App de planes, grupos y conexión

Documento vivo del brainstorming.  
Cuando se pida: resumir **ideas aplicadas hasta ahora** vs **ideas para futuro**.

Última actualización: 2026-10-13

**Producto en construcción ahora:** producto **#1** (grupos + catálogo + decisión) con un primer slice de **Descubrir** (valoraciones públicas).  
Producto #2 completo (red social) y #3 (marketplace skills) siguen en backlog.

**Nombre provisional de trabajo:** Juntada (final pendiente).

---

## 0. Estado de implementación (actualizar en cada iteración)

### Hecho en el MVP web local
- [x] Scaffold Next.js + TypeScript + Tailwind + shadcn/ui
- [x] Persistencia local (`localStorage` v2) + seed demo (Lucía / Mateo / Sofía)
- [x] Landing + entrar
- [x] Login UI: correo / teléfono / Apple-iCloud (demo local; auth real pendiente de backend)
- [x] Grupos: crear, unirse por código, multi-grupo
- [x] Ideas: peli / visitar / comer / plan + tags + dirección → Maps
- [x] **Catálogo vs Pronto**: guardar para no olvidar ≠ decidir este finde
- [x] Voto secreto / reveal / “ahora no” / elegir (solo bandeja Pronto)
- [x] Azar entre finalistas de Pronto
- [x] Marcar hecho + valoración + comentario (+ opción pública)
- [x] **Descubrir**: catálogo público de cosas hechas con ratings/comentarios
- [x] Gastos EUR sueltos + saldos + “quién le debe a quién”
- [x] Puntos + ranking + badges en grupo/perfil
- [x] Diseño responsive con personalidad
- [x] README + vision doc vivos
- [x] Smoke Playwright de flujos core
- [x] Preparado para crecer: `es-ES`, EUR, PWA/móvil más adelante

### Falta / siguiente en el producto 1
- [ ] Nombre final de la marca
- [ ] Auth real (OAuth Apple, SMS/OTP, verificación email) + backend
- [ ] Unificar títulos iguales en Descubrir (hoy es por idea/grupo)
- [ ] Gasto ligado a una idea desde UI (modelo ya lo permite)
- [ ] Foto en recuerdos
- [ ] Beneficio jugable real del #1 (romper empate con acción)
- [ ] PWA / instalación móvil

### Explícitamente futuro (no construir aún)
- Red social completa / match por intereses, estudios, cercanía
- Marketplace de skills (arreglar PC, etc.)
- Chat, mapa embebido, IA, multi-moneda

---

## 1. Propuesta de valor (núcleo)

App divertida y amistosa para **parejas, amigos, hermanos y grupos chicos** que ayuda a:

> Guardar catálogo (para no olvidar) → pasar a Pronto → votar en secreto → decidir (ranking o azar) → hacerlo → valorar/comentar (opcional público) → liquidar gastos.

Posicionamiento corto:

> La app para no olvidar planes y decidirlos en grupo sin 40 mensajes de WhatsApp.

Mercado inicial: **España**, moneda **EUR**.  
Tono: divertido, amistoso, cercano; con toque argentino en el copy (vos/tú adaptable por locale más adelante).

---

## 2. Respuestas de producto cerradas

| Tema | Decisión |
|---|---|
| Audience principal | Pareja como foco emocional, pero grupos de todo tipo (2–8) |
| Votos | Secretos hasta revelar |
| Empates / decisión | Ranking + botón divertido de **azar** (también usable sin empate) |
| Historial | Importa: hechos, ratings, notas, recuerdos |
| Tono | Divertido / amistoso; ES-ES primero, toque AR en personalidad |
| Nombre | Pendiente |
| Multi-grupo | Sí: un usuario en varios grupos |
| Gastos | Dentro de un plan **y** sueltos |
| Sorteo | Botón divertido siempre disponible (no solo empates) |
| Moneda v1 | Solo EUR (España) |
| Home | Lo más interactivo y divertido posible (“¿qué hacemos?”) |
| Chat | Casi nada al inicio |
| Alcance ahora | **Básico primero**; lo social/marketplace después |

---

## 3. Ideas aplicadas al MVP (lo básico a construir primero)

### 3.1 Cuentas y perfil
- Usuario con nombre / nick
- Localidad aproximada (ciudad / barrio) — no pin exacto de casa
- Perfil con puntuación / badges visibles del buen rol en grupos

### 3.2 Grupos
- Crear grupo (pareja, amigos, hermanos, estudio, etc.)
- Invite por link
- Varios grupos por usuario
- Feed / home orientado a acción: proponer, votar, sortear, ver pendientes

### 3.3 Ideas / planes (tipos)
- Películas / series
- Lugares para visitar
- Sitios para comer
- Planes generales

Campos útiles v1:
- título, notas, tipo
- quién propuso
- dirección opcional + botón “Abrir en Maps” (sin mapa embebido aún)
- estado: pendiente → elegido → hecho → archivado
- tags simples (barato, cerca, noche, lluvia, etc.) si no complica

### 3.4 Decisión
- Voto secreto por miembro
- Reveal colectivo
- Ranking por puntuación
- Botón **“Que decida el azar”** entre finalistas (top / no vetados / no recientes)

### 3.5 Memoria
- Marcar como hecho
- Rating post-experiencia
- Nota corta / recuerdo
- (Foto opcional si sale barato; si no, fase 2)

### 3.6 Gastos (simple)
- Gasto ligado a plan o suelto
- Quién pagó, monto en EUR
- Partes iguales o custom básico
- Saldos: quién le debe a quién dentro del grupo

### 3.7 Gamificación ligera
Puntos por acciones útiles (anti-spam):
- proponer idea (+bajo)
- idea elegida / hecha con buen rating (+alto)
- votar a tiempo
- cerrar gasto / recuerdo
- MVP de la salida (voto del grupo)

Beneficios simbólicos del #1 del grupo:
- badge / título en perfil y en el grupo
- privilegios divertidos ligeros (romper empate, elegir mood, etc.)

### 3.8 UX / personalidad
- Copy divertido (ES), con espacio para variant AR
- Home interactivo: “¿qué hacemos?”, sorteo, revelar votos, ranking vivo
- Sin chat pesado
- Sin red social pública en v1

---

## 4. Ideas para futuro (guardar, no construir aún)

### 4.1 Capa social / descubrimiento
- Red social ligera sin mucho chat
- Descubrir gente por intereses, cercanía, carrera universitaria, estudios
- Conectar por hobbies: fútbol, anime, etc.
- Grupos públicos o semi-públicos por interés
- Perfiles más ricos (intereses, universidad, zona)

### 4.2 Contenido público y opiniones
- [x] Primer slice: Descubrir con valoraciones/comentarios públicos post-hecho
- Rankings comunitarios más ricos (“mejores cenas en X”, “pelis para finde”)
- Merge de la misma peli/serie entre grupos
- Que gente externa pueda opinar sin estar en el grupo original

### 4.3 Inteligencia de planes
- Mood filters avanzados
- Ritual semanal “¿qué hacemos?”
- Import por link (Maps, Netflix, Letterboxd, IG)
- Mapa embebido con pins del grupo
- Sugerencias smart / IA
- PWA y luego app móvil nativa

### 4.4 Marketplace local de habilidades / servicios
Ejemplo del usuario: alguien sabe arreglar PCs; un vecino busca ayuda barata y de confianza cerca.

Idea general:
- Perfil con skills verificadas / autodeclaradas + nivel
- Búsqueda por skill + distancia + reputación en ese ámbito
- Pedidos tipo “necesito X”
- Ratings post-servicio
- (Más adelante) mensajería mínima, pagos, disputas

**Nota de riesgo:** esto es casi otro producto (confianza, legal, pagos, seguridad). Mantenerlo en fase lejana.

### 4.5 Otras ideas aportadas en brainstorm
- Wishlist vs “este finde”
- Digest semanal (planes, gastos, ranking)
- Privacidad fuerte por grupo (cuando haya backend real)
- Temporadas / badges temáticos
- Álbum de recuerdos del grupo
- Nota: “ahora no” (veto suave) ya entró al MVP web

---

## 5. Ideas extra tipo “conectar gente / skills” (aportadas)

Solo backlog futuro; no MVP:

1. **Trueque de favores del barrio** — no solo pagos: “te ayudo con la bici / me ayudas con inglés”.
2. **Buddy de intereses** — match 1:1 para ir a ver algo juntos (partido, expo, anime meetup) con rating de puntualidad/buena onda.
3. **Grupos temporales por evento** — “partido el domingo”, “quedada manga”, se disuelven después.
4. **Study pods** — grupos de estudio con sesiones y accountability (encaja con universidad).
5. **Plan abierto con cupos** — un usuario publica “sobran 2 sitios para X”; gente cercana con mismo interés puede pedir unirse (con aprobación).

---

## 6. Fases recomendadas

### Fase 0 — Definición
- [x] Cerrar foco del MVP (producto 1)
- [x] Definir pantallas y flujos base
- [ ] Elegir nombre final

### Fase 1 — MVP web (privado, útil, divertido) — EN CURSO
Grupos + ideas + votos secretos + azar + hechos/ratings + Maps link + gastos EUR + puntos básicos.
Estado: **slice usable en local** (ver sección 0).

### Fase 2 — Más juego y retención
Mood, ritual semanal, import links, mejor historial, PWA, más badges.

### Fase 3 — Social ligero
Descubrimiento por intereses/cercanía/estudios, contenido público puntuable, grupos por hobby.

### Fase 4 — Marketplace de skills locales
Oferta/demanda de skills, reputación por ámbito, cercanía, confianza.

---

## 7. Opinión de producto (síntesis)

- **El núcleo (grupos privados + decisión de planes + gastos + puntos)** está muy bien: claro, diferenciable, construible.
- **La visión social + ratings públicos + marketplace** es potente, pero es **ambiciosa**: son 2–3 productos encima del primero.
- Estrategia sana: que v1 sea excelente en “decidir planes en mi grupo”. Si eso engancha, la red y los skills tienen base real (confianza + localidad + reputación).

---

## 8. Pendientes de decisión

- [ ] Nombre final de la app (hoy: Juntada provisional)
- [x] Stack / scaffold del MVP web (Next.js)
- [x] Pantallas base del MVP
- [x] Reglas iniciales de puntos y badges (iterables)
- [ ] Si la foto en recuerdos entra ya o en fase 2
- [x] Copy base ES con pinceladas AR (seguir puliendo)
- [ ] Cuándo pasar de localStorage a backend real

---

## 9. Cómo usar este doc

Cuando el usuario pida:

> “hazme un resumen de ideas aplicadas hasta ahora e ideas que dejamos para futuro”

Responder desde **sección 0 (estado)**, **3 (MVP)** y **4–5 (futuro)**, y actualizar este archivo si hubo cambios.
