/**
 * The supplier's own measurement tables, transcribed.
 *
 * Every listing ships with a size-chart image in its gallery, and until now that
 * chart was the ONLY place these numbers existed — as a picture, unreadable to
 * a screen reader, unindexable by Google, and unreadable on a phone without
 * pinching. Worse, the chart was often the FIRST image, so the shop card led on
 * a table instead of the garment.
 *
 * Transcribing them here fixes all of that at once: the numbers become real
 * text on /size-guide, the charts stay in the galleries where they belong, and
 * the returns policy can point at a page rather than an image.
 *
 * Source: the supplier's EZjersey charts as shipped with the listings —
 * fan version and kids from the Italy/Netherlands galleries, player version from
 * the Tottenham 2024/25 authentic gallery. The supplier's own tolerance note is
 * carried through: allow about 1–2 cm of error.
 *
 * The kids table is trimmed to the five sizes the store actually sells
 * (2–3 through 10–11). The supplier chart also lists 12–13; we do not stock it,
 * and printing a size nobody can buy only invites a message asking for it.
 */

export type SizeChart = {
  id: string;
  title: string;
  blurb: string;
  /** Column headings, first cell is the row-label column. */
  columns: string[];
  rows: { label: string; values: string[] }[];
};

export const FAN_CHART: SizeChart = {
  id: "fan",
  title: "Fan version",
  blurb:
    "The standard replica cut, and the one most kits on the site are. Measure a shirt you already like flat across the chest and compare — half chest means seam to seam with the shirt lying flat, not around your body.",
  columns: ["Size", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  rows: [
    { label: "½ chest (cm)", values: ["49–51", "51–53", "53–55", "55–57", "58–60", "60–62", "62–64"] },
    { label: "Length (cm)", values: ["67–69", "69–71", "71–73", "73–76", "77–79", "80–82", "82–84"] },
    { label: "Suits height (cm)", values: ["165–170", "170–175", "175–180", "180–185", "185–190", "190–195", "195–200"] },
  ],
};

export const PLAYER_CHART: SizeChart = {
  id: "player",
  title: "Player version",
  blurb:
    "The squad's own cut — tighter through the chest and shorter in the body than the fan version at the same letter. If you are between sizes, or you want it to sit loose, take the next size up.",
  columns: ["Size", "S", "M", "L", "XL", "2XL"],
  rows: [
    { label: "½ chest (cm)", values: ["46", "48", "50", "52", "54"] },
    { label: "Length (cm)", values: ["70", "72", "74", "76", "78"] },
    { label: "Shoulder (cm)", values: ["40.5", "41.9", "43.3", "44.7", "46.1"] },
    { label: "Sleeve (cm)", values: ["24", "24.8", "25.6", "26.4", "27.2"] },
    { label: "Suits height (cm)", values: ["160–165", "165–170", "170–175", "175–180", "180–185"] },
  ],
};

export const KIDS_CHART: SizeChart = {
  id: "kids",
  title: "Kids kits",
  blurb:
    "Sized by age, and true to it. Every kids listing is a full kit — shirt and shorts together — so the waist and pant length below are the shorts that come with it.",
  columns: ["Age", "2–3", "4–5", "6–7", "8–9", "10–11"],
  rows: [
    { label: "Fits height (cm)", values: ["95–105", "115–125", "125–135", "135–145", "145–155"] },
    { label: "Shirt length (cm)", values: ["43", "50", "53", "56", "59"] },
    { label: "½ chest (cm)", values: ["32", "36", "38", "40", "42"] },
    { label: "Waist (cm)", values: ["20–37", "22–41", "23–42", "24–44", "25–47"] },
    { label: "Pant length (cm)", values: ["32", "36", "38", "39", "40"] },
  ],
};

export const SIZE_CHARTS = [FAN_CHART, PLAYER_CHART, KIDS_CHART];

/** The supplier's own tolerance, stated rather than buried in the chart image. */
export const CHART_TOLERANCE = "Measurements are taken flat and by hand, so allow about 1–2 cm either way.";
