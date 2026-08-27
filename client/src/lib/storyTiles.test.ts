import { expect, it } from "vitest";
import { STORY_TILES } from "./storyTiles";

it("uses three supplied archive images for the Shop by Story section", () => {
  expect(STORY_TILES).toHaveLength(3);
  expect(STORY_TILES.map(tile => tile.image)).toEqual([
    "/manus-storage/story-club-football_40df61c4.jpg",
    "/manus-storage/story-national-colours_c271d1a7.jpg",
    "/manus-storage/story-retro-icons_435412c3.jpg",
  ]);
  expect(STORY_TILES.every(tile => tile.alt.length > 0 && tile.lines.length === 2)).toBe(true);
});
