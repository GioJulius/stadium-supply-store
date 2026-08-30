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
    image: "/media/story-club-football.jpg",
    alt: "Juventus football jersey from the Stadium Supply archive",
  },
  {
    number: "02",
    lines: ["National", "colours"],
    image: "/media/story-national-colours.jpg",
    alt: "Portugal national team jersey from the Stadium Supply archive",
  },
  {
    number: "03",
    lines: ["Retro", "icons"],
    image: "/media/story-retro-icons.jpg",
    alt: "France Zidane retro jersey from the Stadium Supply archive",
  },
];
