# Client corrections — WhatsApp, 11 Sep 2026 13:26–13:39

The other half of [client-corrections-2026-09-11.md](client-corrections-2026-09-11.md).
That batch applied 78 changes and **held 10** where the client's caption either
contradicted itself, gave no season, or would have put two listings under one
name. Today the client went back through the chat and replied to each of those
original screenshots, and the owner then listed the 27 product urls explicitly.
That is what settles them.

Applied with `scripts/apply-client-corrections-0911b.mjs` +
`scripts/client-corrections-0911b.json`. **29 changes, 0 held.**

---

## How the corrections were read

Today's messages are **replies**, not new screenshots: the bubble quotes
yesterday's product-card screenshot and its caption, and the body is a bare
`.`. So the caption you read in today's thread is yesterday's caption, and the
photograph identifying the product is the quoted one. Clicking a quoted preview
jumps the conversation to the original at full size — that is how each of these
was pinned to a listing, not by matching titles.

Two things only today's thread could resolve:

- **Inter Miami.** Yesterday's captions read "2026" then "2025" on two
  consecutive pink shirts and the 10 Sep pass recorded them as contradictory.
  Opening both originals shows the card titles: the listing called
  **2025** Inter Miami Home Player is captioned **2026**, and the one called
  **2026** is captioned **2025**. It is a straight swap, not a contradiction.
- **Real Madrid.** "26/27 home" plus a separate line, *"player version this
  one"* — so it is a reclass, not only a reseason.

## The Manchester United rotation

Eight listings, two kits, one rotation. On a contact sheet (`.dupcheck/0911b/mu.png`)
they separate cleanly:

- the **cream** shirt with the maroon-and-black collar and no sponsor — five
  listings, currently filed as 2025/26 Away → all become **2026/27 Third**
- the **white Snapdragon** shirt with the navy stripes — three listings,
  currently 2024/25 Third → all become **2025/26 Away**

The client's captions agree with that split ("26/27 third kit" ×4 and "25/26
away" ×3; the eighth reads only "26/27", and the shirt says which 26/27 it is).

Two of the eight — `2025-26-manchester-united-away-player-version` and
`-away-kids-kit` — were **not** in the owner's list of urls and are marked
`inferred` in the manifest. They have to move anyway: the 2024/25 Third Player
becomes *2025/26 Manchester United Away Player Version*, which is a name those
two still hold. Half a rotation does not error in Shopify, it just leaves two
listings with one name.

## Four titles carry a parenthetical we wrote

In four cases the listing the client is moving onto a season is **not** the
shirt already selling under that name. Both are real, so both keep a listing and
one of them needed a distinguishing suffix. Each was checked on a contact sheet
(`.dupcheck/0911b/pairs.png`) rather than assumed:

| Listing | Becomes | Why the suffix |
|---|---|---|
| 2024/25 AC Milan Home Player | 2026/27 AC Milan Home Player Version **(Solid Stripes)** | the live 26/27 is the tonal-patterned stripe with the MS sleeve badge; this one is solid stripes with the scudetto star |
| 2024/25 AC Milan Home LS Player | …Long Sleeve… **(Solid Stripes)** | same pair, long sleeve |
| 2023/24 Juventus Away Player | 2026/27 Juventus Away Player Version **(Pink)** | the live 26/27 away is the black "Visit Detroit"; this is the pink kit |
| Real Madrid 2024/25 Third | 2026/27 Real Madrid Home Player Version **(Green Collar)** | it is the same white shirt with the teal collar and maroon shoulder stripes as the live *2026/27 Real Madrid Home Fan Version (Green Collar)*, so the suffix is its own sibling's, not invented |

The Juventus away long sleeve and kids kit take "(Pink)" too, so the three pieces
of one kit read together. They did not need it to stay unique.

## Everything applied

### National sides — "2026"
| Handle | → | Said |
|---|---|---|
| `brazil-2024-25-home-jersey` | Brazil 2026 Home Jersey | "2026 home" |
| `brazil-2024-25-away-jersey-jordan` | Brazil 2026 Away Jersey (Jordan) | "2026 away" |
| `brazil-2025-away-jersey-neymar-10-cwc` | Brazil 2026 Home Jersey - Neymar 10 | "2026 home" |
| `portugal-2024-25-home-jersey-ronaldo-7` | Portugal 2026 Home Jersey - Ronaldo 7 | "these are also 2026 home" |
| `portugal-2024-25-home-jersey` | Portugal 2026 Home Jersey | " |
| `netherlands-2024-25-away-jersey` | Netherlands 2026 Home Jersey | "this is 2026 home" |
| `england-2024-25-home-jersey` | England 2026 Home Jersey | "2026" |
| `south-africa-2024-25-home-jersey-safa` | South Africa 2026 Home Jersey (SAFA) Player Version | "2026" |
| `france-2024-25-away-jersey-mint` | France 2026 World Cup Away Jersey (mint) | "2026 worldcup away" |
| `italy-2023-24-away-jersey` | Italy 2026 Home Jersey | "this is 2026 home" |
| `argentina-2010-away-retro-jersey-filigree` | Argentina 2026 Away Jersey (filigree) — **Fan Version, R500** | "2026 as well away" |

`(CWC)` came off the Brazil Neymar shirt with the season: it is a 2026 home kit
now, not a Club World Cup away.

### Clubs
| Handle | → | Said |
|---|---|---|
| `2025-inter-miami-home-player-version` | 2026 Inter Miami Home Player Version | "2026" |
| `2026-inter-miami-home-player-version` | 2025 Inter Miami Home Player Version | "2025" |
| `2024-25-ac-milan-home-player-version` | 2026/27 AC Milan Home Player Version (Solid Stripes) | "26/27 season" |
| `2024-25-ac-milan-home-long-sleeve-player-version` | 2026/27 AC Milan Home Long Sleeve Player Version (Solid Stripes) | " |
| `2023-24-juventus-away-player-version` | 2026/27 Juventus Away Player Version (Pink) | " |
| `2023-24-juventus-away-long-sleeve-player-version` | 2026/27 Juventus Away Long Sleeve Player Version (Pink) | " |
| `2023-24-juventus-away-kids-kit` | 2026/27 Juventus Away Kids Kit (Pink) | "26/27" |
| `real-madrid-2024-25-third-jersey` | 2026/27 Real Madrid Home Player Version (Green Collar) — **Player Version, R650** | "26/27 home" / "player version this one" |
| `fc-barcelona-2024-25-home-jersey-spotify` | FC Barcelona 2026/27 Home Jersey (Spotify) | "26/27 home" |
| `2025-26-nottingham-forest-home-fan-version` | 2026/27 Nottingham Forest Home Fan Version | "26/27 season" |

### Manchester United
| Handle | → | Said |
|---|---|---|
| `2025-26-manchester-united-away-long-sleeve-player-version` | 2026/27 MU Third Long Sleeve Player Version | "26/27" |
| `2025-26-manchester-united-away-fan-version` | 2026/27 MU Third Fan Version | "26/27 third kit" |
| `2025-26-manchester-united-away-long-sleeve-fan-version` | 2026/27 MU Third Long Sleeve Fan Version | " |
| `2025-26-manchester-united-away-player-version` *(inferred)* | 2026/27 MU Third Player Version | " |
| `2025-26-manchester-united-away-kids-kit` *(inferred)* | 2026/27 MU Third Kids Kit | " |
| `2024-25-manchester-united-third-long-sleeve-player-version` | 2025/26 MU Away Long Sleeve Player Version | "25/26 away" |
| `2024-25-manchester-united-third-player-version` | 2025/26 MU Away Player Version | "25/26 away jersey" |
| `2024-25-manchester-united-third-long-sleeve-fan-version` | 2025/26 MU Away Long Sleeve Fan Version | "25/26 away" |

---

## Also asked for on 11 Sep, and done

> "Also this, can you please remove the express option, and then can you make
> both email and phone number compulsory"

**Express shipping is gone.** It was never in this codebase — the cart drawer
prices a flat R100 and checkout is Shopify's, so the rate lived in the Shopify
delivery profile alone (`grep -ri express client/ shared/` finds nothing).
Removed with `scripts/remove-express-shipping.mjs`. Domestic now offers only
**Standard R100**.

The domestic zone also carries a second, *conditional* Standard rate at R0 — free
over a cart threshold. Left alone: it is still Standard, and it is a promotion,
not a stray option. Say if it should go too.

**Email and phone are both compulsory at checkout.** Settings → Checkout:
*Customer contact method* was already **Email** (which makes email required, as
opposed to "Phone number or email", where either satisfies it), and *Shipping
address phone number* moved **Optional → Required**. Both verified after a
reload. These are Shopify checkout settings with no Admin API surface, so they
were changed in the admin rather than scripted.

---

## Still open

- The **2023/24 Juventus Away Fan Version** (pink) was not in the list and keeps
  its old season while the rest of that kit moves to 2026/27. Worth asking.
- **Argentina (filigree)** dropped R700 → R500 with the retro tag. Its size run
  is still the adult/retro run rather than the fan run — confirm before the next
  `apply-client-sizing.mjs` sweep.
- Everything else from 10 Sep that the client has not spoken to is unchanged.

Related: [[stadium-supply-0911-corrections]], [[stadium-supply-shopify-store]].
