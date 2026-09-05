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

export type NavLeaf = {
  label: string;
  q: string;
  /** Term that disqualifies a match — "Retro" means retro football, not retro rugby. */
  not?: string;
};
export type NavGroup = { label: string; children: (NavLeaf | NavGroup)[] };
export type NavNode = NavLeaf | NavGroup;
export type NavSection = {
  label: string;
  href?: string;
  children?: NavNode[];
  /** Leaves the site — rendered as a plain anchor rather than through the router. */
  external?: boolean;
};

export function isGroup(node: NavNode): node is NavGroup {
  return "children" in node;
}

export const SHOP_MENU: NavSection[] = [
  // The whole archive, first in the list — it is the thing most visitors
  // actually want and it was previously buried under every club and
  // competition, at the very bottom of the panel.
  { label: "Shop all", href: "/shop" },
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
          { label: "Tottenham Hotspur", q: "tottenham" },
          { label: "Manchester City", q: "manchester city" },
          { label: "Aston Villa", q: "aston villa" },
          { label: "Brighton", q: "brighton" },
          { label: "Crystal Palace", q: "crystal palace" },
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
          // "Inter Milan" in full, never bare "inter" — that would sweep in
          // Inter Miami, which lives under Rest of the world.
          { label: "Inter Milan", q: "inter milan" },
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
  // The client asked for retro football and rugby to be separate destinations
  // with their own links rather than one shared drawer. Retro excludes rugby so
  // the retro rugby shirts stay with the rest of the rugby.
  { label: "Retro Football", href: "/shop?q=retro&not=rugby&label=Retro%20Football" },
  { label: "Rugby", href: "/shop?q=rugby&label=Rugby" },
  { label: "Formula 1", href: "/shop?q=f1&label=Formula%201" },
  {
    label: "Training & Outerwear",
    children: [
      { label: "Training", q: "training" },
      { label: "Half-zip sets", q: "half-zip" },
      { label: "Jackets", q: "jacket" },
      { label: "Windbreakers", q: "windbreaker" },
      { label: "Hoodies", q: "hoodie" },
      { label: "Sweatshirts", q: "sweatshirt" },
      { label: "Tracksuits", q: "tracksuit" },
    ],
  },
  // The client sells each shirt in several cuts, and shoppers ask for them by
  // name — long sleeve and goalkeeper most often — so each is its own link
  // rather than something to be found by typing into search.
  {
    label: "Shirt Types",
    children: [
      { label: "Fan version", q: "fan version" },
      { label: "Player version", q: "player version" },
      { label: "Long sleeve", q: "long sleeve" },
      { label: "Goalkeeper", q: "goalkeeper" },
    ],
  },
  { label: "Kids", href: "/shop?q=kids&label=Kids" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Shipping", href: "/shipping" },
  { label: "Contact", href: "/contact" },
  { label: "Reviews", href: "/reviews" },
];

export function leafHref(leaf: NavLeaf): string {
  const not = leaf.not ? `&not=${encodeURIComponent(leaf.not)}` : "";
  return `/shop?q=${encodeURIComponent(leaf.q)}${not}&label=${encodeURIComponent(leaf.label)}`;
}
