/** Palabras para el juego del impostor (presencial). */
export const IMPOSTOR_WORDS = [
  "Paella",
  "Metro",
  "Playa",
  "Cine",
  "Ramen",
  "Fútbol",
  "Brunch",
  "Picnic",
  "Karaoke",
  "Escape room",
  "Sushi",
  "Terraza",
  "Mercadillo",
  "Biblia de series",
  "Afterwork",
  "Senderismo",
  "Museo",
  "Churros",
  "Bingo",
  "Noche de juegos",
  "Cumpleaños",
  "Viaje en tren",
  "Piscina",
  "Asado",
  "Café con leche",
];

export type ImpostorDeal = {
  word: string;
  impostorId: string;
  playerIds: string[];
};

export function dealImpostor(playerIds: string[]): ImpostorDeal | null {
  if (playerIds.length < 3) return null;
  const impostorId =
    playerIds[Math.floor(Math.random() * playerIds.length)]!;
  const word =
    IMPOSTOR_WORDS[Math.floor(Math.random() * IMPOSTOR_WORDS.length)]!;
  return { word, impostorId, playerIds: [...playerIds] };
}
