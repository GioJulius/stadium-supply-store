export type StoryTile = {
  number: string;
  lines: [string, string];
  image: string;
  alt: string;
};

export const STORY_TILES: StoryTile[] = [
  {
    number: "01",
    lines: ["Club", "football"],
    image: "/manus-storage/story-club-football_40df61c4.jpg",
    alt: "Juventus football jersey from the Stadium Supply archive",
  },
  {
    number: "02",
    lines: ["National", "colours"],
    image: "/manus-storage/story-national-colours_c271d1a7.jpg",
    alt: "Portugal national team jersey from the Stadium Supply archive",
  },
  {
    number: "03",
    lines: ["Retro", "icons"],
    image: "/manus-storage/story-retro-icons_435412c3.jpg",
    alt: "France Zidane retro jersey from the Stadium Supply archive",
  },
];
