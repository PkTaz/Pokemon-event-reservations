import type { Artist } from "../types";

export const ARTISTS: Artist[] = [
  {
    id: "madi",
    name: "Madi",
    imageUrl: "/Madi.png",
    portraitPosition: "48% 45%",
    party: [
      { name: "Azumarill", imageUrl: "/azumaril - m.png" },
      { name: "Chikorita", imageUrl: "/chikorita - m.png" },
      { name: "Jolteon", imageUrl: "/jolteon - m.png" },
      { name: "Mawile", imageUrl: "/Mawile - m.png" },
      { name: "Pawniard", imageUrl: "/pawniard - m.png" },
      { name: "Riolu", imageUrl: "/riolu - m.png" },
    ],
  },
  {
    id: "jeremy",
    name: "Jeremy",
    imageUrl: "/Jeremy.png",
    portraitPosition: "34% 50%",
    party: [
      { name: "Arbok", imageUrl: "/ARBOK.png" },
      { name: "Arcanine", imageUrl: "/ARCANINE-J.png" },
      { name: "Heracross", imageUrl: "/Heracross - J.png" },
      { name: "Nidoking", imageUrl: "/NIDOKING - J.png" },
      { name: "Raichu", imageUrl: "/RAICHU - J.png" },
      { name: "Totodile", imageUrl: "/TOTODILE - J.png" },
    ],
  },
  {
    id: "keagan",
    name: "Keagan",
    imageUrl: "/Keagan.png",
    party: [
      { name: "Dragonite", imageUrl: "/dragonite - k.png" },
      { name: "Flygon", imageUrl: "/flygon-k.png" },
      { name: "Gengar", imageUrl: "/Gengar - k.png" },
      { name: "Treecko", imageUrl: "/treecko - k.png" },
      { name: "Umbreon", imageUrl: "/umbreon-k.png" },
      { name: "Zorua", imageUrl: "/zorua - k.png" },
    ],
  },
];

export function getArtistById(id: string): Artist | undefined {
  return ARTISTS.find((artist) => artist.id === id);
}
