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
    alt: "Players from clubs across Europe and South America grouped together in their club kits",
  },
  {
    number: "02",
    lines: ["National", "colours"],
    image: "/media/story-national-colours.jpg",
    alt: "A national team lifting the World Cup trophy in their home colours",
  },
  {
    number: "03",
    lines: ["Retro", "icons"],
    image: "/media/story-retro-icons.jpg",
    alt: "A collage of football icons across the eras in their era-defining shirts",
  },
];
