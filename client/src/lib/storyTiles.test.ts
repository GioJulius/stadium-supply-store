import { expect, it } from "vitest";
import { STORY_TILES } from "./storyTiles";

it("uses three supplied archive images for the Shop by Story section", () => {
  expect(STORY_TILES).toHaveLength(3);
  expect(STORY_TILES.map(tile => tile.image)).toEqual([
    "/media/story-club-football.jpg",
    "/media/story-national-colours.jpg",
    "/media/story-retro-icons.jpg",
  ]);
  expect(STORY_TILES.every(tile => tile.alt.length > 0 && tile.lines.length === 2)).toBe(true);
});
