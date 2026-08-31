/**
 * The shop menu, expressed as the catalogue actually is rather than as a
 * football org chart. Every leaf carries the free-text term the archive is
 * searched on (`filterAndSortProducts`'s `q` mode, which reads title, product
 * type and tags together), because club identity reaches the catalogue through
 * all three depending on which import lineage a listing came from — the older
 * mapped batch tags the club, the Instagram batch only ever says it in the
 * title.
 *
 * Only clubs and competitions that had stock when the menu was written are
 * listed. The tally beside each one is counted from the live catalogue at
 * render time rather than stored here, so it can never drift from what the
 * shopper will actually find, and a club that sells out shows `00` instead of
 * a stale promise.
 */

export type NavLeaf = { label: string; q: string };
export type NavGroup = { label: string; children: (NavLeaf | NavGroup)[] };
export type NavNode = NavLeaf | NavGroup;
export type NavSection = { label: string; href?: string; children?: NavNode[] };

export function isGroup(node: NavNode): node is NavGroup {
  return "children" in node;
}

export const SHOP_MENU: NavSection[] = [
  { label: "Home", href: "/" },
  { label: "2026–2027 Season", href: "/shop?q=2026&label=2026%E2%80%932027%20Season" },
  {
    label: "Club Team",
    children: [
      {
        label: "Premier League",
        children: [
          { label: "Manchester United", q: "manchester united" },
          { label: "Liverpool", q: "liverpool" },
          { label: "Arsenal", q: "arsenal" },
          { label: "Chelsea", q: "chelsea" },
          { label: "Manchester City", q: "manchester city" },
          { label: "Nottingham Forest", q: "nottingham" },
        ],
      },
      {
        label: "LaLiga",
        children: [
          { label: "Real Madrid", q: "real madrid" },
          { label: "FC Barcelona", q: "barcelona" },
        ],
      },
      { label: "Ligue 1", children: [{ label: "Paris Saint-Germain", q: "paris saint-germain" }] },
      {
        label: "Serie A",
        children: [
          { label: "Juventus", q: "juventus" },
          { label: "AC Milan", q: "ac milan" },
        ],
      },
      { label: "Bundesliga", children: [{ label: "Bayern Munich", q: "bayern" }] },
      {
        label: "Rest of the world",
        children: [
          { label: "Inter Miami", q: "inter miami" },
          { label: "Club Brugge", q: "brugge" },
          { label: "Galatasaray", q: "galatasaray" },
          { label: "Orlando Pirates", q: "orlando pirates" },
        ],
      },
    ],
  },
  {
    label: "National Colours",
    children: [
      { label: "France", q: "france" },
      { label: "South Africa", q: "south africa" },
      { label: "Brazil", q: "brazil" },
      { label: "Germany", q: "germany" },
      { label: "Spain", q: "spain" },
      { label: "Portugal", q: "portugal" },
      { label: "Argentina", q: "argentina" },
      { label: "England", q: "england" },
      { label: "Italy", q: "italy" },
      { label: "Netherlands", q: "netherlands" },
      { label: "World Cup", q: "world cup" },
    ],
  },
  {
    label: "Retro & Rugby",
    children: [
      { label: "Retro icons", q: "retro" },
      { label: "Rugby", q: "rugby" },
      { label: "Formula 1", q: "f1" },
    ],
  },
  {
    label: "Training & Outerwear",
    children: [
      { label: "Training", q: "training" },
      { label: "Jackets", q: "jacket" },
      { label: "Windbreakers", q: "windbreaker" },
      { label: "Hoodies", q: "hoodie" },
      { label: "Tracksuits", q: "tracksuit" },
    ],
  },
  { label: "Kids", href: "/shop?q=kids&label=Kids" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Shop all", href: "/shop" },
];

export function leafHref(leaf: NavLeaf): string {
  return `/shop?q=${encodeURIComponent(leaf.q)}&label=${encodeURIComponent(leaf.label)}`;
}
