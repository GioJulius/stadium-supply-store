/**
 * Every team the store stocks, and what sport it plays.
 *
 * This exists because sport cannot be read off `productType`. The canonical
 * categories are about the GARMENT — a Ferrari hoodie is typed `Hoodie` and the
 * Springboks kids kit is a `Kids Kit` — so a filter built on product type alone
 * files both under football. Sport comes from the team, and once the team is
 * known, country and sport both fall out for free.
 *
 * It is a superset of the team leaves in `navigation.ts`. Those 40 terms resolve
 * about 94% of the catalogue; the rest is the rugby unions and F1 constructors
 * the menu never lists by name, because Rugby and Formula 1 are single links
 * rather than club lists. The nav leaves carry a `team` slug pointing here so
 * the two lists cannot drift apart.
 *
 * MATCHING IS BY SUBSTRING over the title, productType and tags together,
 * longest term first, so "Manchester City" cannot be answered by "Manchester
 * United"'s entry. A listing that matches nothing returns null rather than
 * inventing a team — about 2% of the catalogue is plain adidas/Nike stock that
 * genuinely belongs to no club.
 */

export type Sport = "football" | "rugby" | "f1";

export type TeamEntry = {
  /** URL-safe identity — this is what a `?team=` link carries. */
  slug: string;
  label: string;
  /** A club side, or a national one. Drives the "country" reading of a team. */
  kind: "club" | "country";
  /**
   * Declared only where the team plays one sport and always will: a Super Rugby
   * franchise, an F1 constructor. National sides are deliberately left open —
   * Ireland and Scotland are rugby in this catalogue today and could be football
   * tomorrow — so `sportOf` falls through to the garment and the wording for
   * those instead of hardcoding an answer that will age badly.
   */
  sport?: Sport;
  /** Lowercase substrings that identify this team. */
  terms: string[];
  /** Disqualifying substrings — checked before `terms` are accepted. */
  not?: string[];
};

export const SPORT_LABELS: Record<Sport, string> = {
  football: "Football",
  rugby: "Rugby",
  f1: "Formula 1",
};

export const TEAM_REGISTRY: TeamEntry[] = [
  // --- Premier League ---
  { slug: "manchester-united", label: "Manchester United", kind: "club", terms: ["manchester united"] },
  { slug: "manchester-city", label: "Manchester City", kind: "club", terms: ["manchester city"] },
  { slug: "liverpool", label: "Liverpool", kind: "club", terms: ["liverpool"] },
  { slug: "arsenal", label: "Arsenal", kind: "club", terms: ["arsenal"] },
  { slug: "chelsea", label: "Chelsea", kind: "club", terms: ["chelsea"] },
  { slug: "tottenham-hotspur", label: "Tottenham Hotspur", kind: "club", terms: ["tottenham"] },
  { slug: "aston-villa", label: "Aston Villa", kind: "club", terms: ["aston villa"] },
  { slug: "brighton", label: "Brighton", kind: "club", terms: ["brighton"] },
  { slug: "crystal-palace", label: "Crystal Palace", kind: "club", terms: ["crystal palace"] },
  { slug: "nottingham-forest", label: "Nottingham Forest", kind: "club", terms: ["nottingham"] },
  { slug: "newcastle-united", label: "Newcastle United", kind: "club", terms: ["newcastle"] },
  { slug: "leeds-united", label: "Leeds United", kind: "club", terms: ["leeds"] },

  // --- LaLiga ---
  { slug: "real-madrid", label: "Real Madrid", kind: "club", terms: ["real madrid"] },
  { slug: "fc-barcelona", label: "FC Barcelona", kind: "club", terms: ["barcelona"] },
  // "atletico" alone is safe here — no other side in the catalogue carries it.
  { slug: "atletico-madrid", label: "Atlético Madrid", kind: "club", terms: ["atletico madrid", "atlético madrid", "atletico"] },

  // --- Serie A ---
  // "Inter Milan" in full, never bare "inter" — that would sweep in Inter Miami.
  { slug: "inter-milan", label: "Inter Milan", kind: "club", terms: ["inter milan"] },
  { slug: "juventus", label: "Juventus", kind: "club", terms: ["juventus"] },
  { slug: "ac-milan", label: "AC Milan", kind: "club", terms: ["ac milan"] },

  // --- Elsewhere in Europe ---
  { slug: "paris-saint-germain", label: "Paris Saint-Germain", kind: "club", terms: ["paris saint-germain", "psg"] },
  { slug: "bayern-munich", label: "Bayern Munich", kind: "club", terms: ["bayern"] },
  { slug: "borussia-dortmund", label: "Borussia Dortmund", kind: "club", terms: ["borussia dortmund", "dortmund"] },
  { slug: "ajax", label: "Ajax", kind: "club", terms: ["ajax"] },
  { slug: "celtic", label: "Celtic", kind: "club", terms: ["celtic"] },
  { slug: "sporting-cp", label: "Sporting CP", kind: "club", terms: ["sporting cp"] },
  { slug: "club-brugge", label: "Club Brugge", kind: "club", terms: ["brugge"] },
  { slug: "galatasaray", label: "Galatasaray", kind: "club", terms: ["galatasaray"] },

  // --- Rest of the world ---
  { slug: "inter-miami", label: "Inter Miami", kind: "club", terms: ["inter miami"] },
  { slug: "orlando-pirates", label: "Orlando Pirates", kind: "club", terms: ["orlando pirates"] },
  // Two sides are called Chiefs and the store carries both. The football one is
  // Kaizer Chiefs, listed without its first name; the rugby one always says so.
  // Football is checked first and refuses anything that mentions rugby, so the
  // Super Rugby franchise below picks up the rest.
  { slug: "kaizer-chiefs", label: "Kaizer Chiefs", kind: "club", sport: "football", terms: ["kaizer chiefs", "chiefs"], not: ["rugby"] },
  { slug: "sao-paulo", label: "São Paulo", kind: "club", terms: ["sao paulo", "são paulo"] },
  { slug: "al-nassr", label: "Al-Nassr", kind: "club", terms: ["al-nassr", "al nassr"] },

  // --- National sides ---
  { slug: "france", label: "France", kind: "country", terms: ["france"] },
  { slug: "south-africa", label: "South Africa", kind: "country", terms: ["south africa", "springboks"] },
  { slug: "brazil", label: "Brazil", kind: "country", terms: ["brazil"] },
  { slug: "germany", label: "Germany", kind: "country", terms: ["germany"] },
  { slug: "spain", label: "Spain", kind: "country", terms: ["spain"] },
  { slug: "portugal", label: "Portugal", kind: "country", terms: ["portugal"] },
  { slug: "argentina", label: "Argentina", kind: "country", terms: ["argentina"] },
  { slug: "england", label: "England", kind: "country", terms: ["england"] },
  { slug: "italy", label: "Italy", kind: "country", terms: ["italy"] },
  { slug: "netherlands", label: "Netherlands", kind: "country", terms: ["netherlands"] },
  { slug: "ireland", label: "Ireland", kind: "country", terms: ["ireland"] },
  { slug: "scotland", label: "Scotland", kind: "country", terms: ["scotland"] },
  { slug: "australia", label: "Australia", kind: "country", terms: ["australia", "wallabies"] },
  { slug: "new-zealand", label: "New Zealand", kind: "country", terms: ["new zealand", "all blacks"] },
  { slug: "fiji", label: "Fiji", kind: "country", sport: "rugby", terms: ["fiji"] },

  // --- Super Rugby / club rugby ---
  { slug: "crusaders", label: "Crusaders", kind: "club", sport: "rugby", terms: ["crusaders"] },
  { slug: "chiefs-rugby", label: "Chiefs", kind: "club", sport: "rugby", terms: ["chiefs"] },
  { slug: "blues", label: "Blues", kind: "club", sport: "rugby", terms: ["blues"] },
  { slug: "hurricanes", label: "Hurricanes", kind: "club", sport: "rugby", terms: ["hurricanes"] },
  { slug: "stade-toulousain", label: "Stade Toulousain", kind: "club", sport: "rugby", terms: ["stade toulousain", "toulousain"] },

  // --- Formula 1 constructors ---
  // A constructor is a team, not a country, whatever its licence says.
  { slug: "ferrari", label: "Scuderia Ferrari", kind: "club", sport: "f1", terms: ["ferrari"] },
  { slug: "mclaren", label: "McLaren", kind: "club", sport: "f1", terms: ["mclaren", "mc laren"] },
  { slug: "mercedes-amg", label: "Mercedes-AMG Petronas", kind: "club", sport: "f1", terms: ["mercedes"] },
  { slug: "red-bull-racing", label: "Red Bull Racing", kind: "club", sport: "f1", terms: ["red bull"] },
  // "aston martin" in full — "aston" alone would answer Aston Villa.
  { slug: "aston-martin-f1", label: "Aston Martin", kind: "club", sport: "f1", terms: ["aston martin"] },
  { slug: "williams-racing", label: "Williams Racing", kind: "club", sport: "f1", terms: ["williams racing", "williams"] },
  { slug: "haas-f1", label: "Haas", kind: "club", sport: "f1", terms: ["haas"] },
  { slug: "audi-f1", label: "Audi", kind: "club", sport: "f1", terms: ["audi"] },
  { slug: "cadillac-f1", label: "Cadillac", kind: "club", sport: "f1", terms: ["cadillac"] },
  // Raced as BMW Sauber 2006-2009. "bmw sauber" in full: the vintage jackets
  // carry Petronas, which is also Mercedes-AMG's sponsor and its longer term
  // would otherwise win the scan.
  { slug: "bmw-sauber", label: "BMW Sauber", kind: "club", sport: "f1", terms: ["bmw sauber", "bmw"] },
  // Porsche is sports-car racing, not Formula 1. It sits here because the store
  // sells its one listing inside the F1 jacket range and the sport facet has no
  // other home for a single motorsport garment.
  { slug: "porsche", label: "Porsche", kind: "club", sport: "f1", terms: ["porsche"] },
];

/**
 * Longest term first, so a specific name always beats a shorter one that is a
 * substring of it. Sorting here rather than at each call keeps `teamOf` a plain
 * scan.
 */
export const TEAM_ENTRIES_BY_TERM_LENGTH: Array<{ term: string; entry: TeamEntry }> = TEAM_REGISTRY
  .flatMap(entry => entry.terms.map(term => ({ term, entry })))
  .sort((a, b) => b.term.length - a.term.length);

export const TEAMS_BY_SLUG = new Map(TEAM_REGISTRY.map(entry => [entry.slug, entry]));
