# Shopify-to-Supplied-Media Reconciliation

This automated reconciliation compares a representative image from every supplied media group against each Shopify product lead image using a deterministic difference-hash method. Matches at a Hamming distance of 8 or below are considered near-identical and safe for provisional mapping review; larger distances remain explicitly unmapped.

| Shopify product | Handle | Matched media group | Match status | Hash distance | Required action |
|---|---|---|---|---:|---|
| `Manchester United Away 26/27` | `manchester-united-away-26-27` | `—` | No reliable match | 101 | Do not relabel; manually match a supplied group before editing the product. |
| `Stadium Supply Fan Jersey — Drop 01` | `stadium-supply-fan-jersey-drop-01` | `1787265257` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Player Jersey — Drop 02` | `stadium-supply-player-jersey-drop-02` | `—` | No reliable match | 89 | Do not relabel; manually match a supplied group before editing the product. |
| `Stadium Supply Retro Jersey — Drop 03` | `stadium-supply-retro-jersey-drop-03` | `—` | No reliable match | 101 | Do not relabel; manually match a supplied group before editing the product. |
| `Mbeumo 19 Black Kit` | `mbeumo-19-black-kit` | `1778617784` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 04` | `stadium-supply-fan-jersey-drop-04` | `—` | No reliable match | 91 | Do not relabel; manually match a supplied group before editing the product. |
| `Stadium Supply Player Jersey — Drop 05` | `stadium-supply-player-jersey-drop-05` | `—` | No reliable match | 97 | Do not relabel; manually match a supplied group before editing the product. |
| `Stadium Supply Retro Jersey — Drop 06` | `stadium-supply-retro-jersey-drop-06` | `—` | No reliable match | 85 | Do not relabel; manually match a supplied group before editing the product. |
| `Stadium Supply Fan Jersey — Drop 07` | `stadium-supply-fan-jersey-drop-07` | `1778609838` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 08` | `stadium-supply-fan-jersey-drop-08` | `1778609888` | Exact/near-exact match | 5 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 09` | `stadium-supply-fan-jersey-drop-09` | `1778610197` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 10` | `stadium-supply-fan-jersey-drop-10` | `1778612126` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 11` | `stadium-supply-fan-jersey-drop-11` | `1778612159` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 12` | `stadium-supply-fan-jersey-drop-12` | `1778612202` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 13` | `stadium-supply-fan-jersey-drop-13` | `1778612267` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 14` | `stadium-supply-fan-jersey-drop-14` | `1778612288` | Exact/near-exact match | 2 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 15` | `stadium-supply-fan-jersey-drop-15` | `1778612775` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 16` | `stadium-supply-fan-jersey-drop-16` | `1778612818` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 17` | `stadium-supply-fan-jersey-drop-17` | `1778612913` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 18` | `stadium-supply-fan-jersey-drop-18` | `1778613045` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 19` | `stadium-supply-fan-jersey-drop-19` | `1778612468` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 20` | `stadium-supply-fan-jersey-drop-20` | `1778612469` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 21` | `stadium-supply-fan-jersey-drop-21` | `1778613000` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 22` | `stadium-supply-fan-jersey-drop-22` | `1778613131` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 23` | `stadium-supply-fan-jersey-drop-23` | `1778613338` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 24` | `stadium-supply-fan-jersey-drop-24` | `1778613513` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 25` | `stadium-supply-fan-jersey-drop-25` | `1778613624` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 26` | `stadium-supply-fan-jersey-drop-26` | `1778613658` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 27` | `stadium-supply-fan-jersey-drop-27` | `1778614059` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 28` | `stadium-supply-fan-jersey-drop-28` | `1778614154` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 29` | `stadium-supply-fan-jersey-drop-29` | `1778614289` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 30` | `stadium-supply-fan-jersey-drop-30` | `1778614390` | Exact/near-exact match | 3 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 31` | `stadium-supply-fan-jersey-drop-31` | `1778614617` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 32` | `stadium-supply-fan-jersey-drop-32` | `1778614655` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 33` | `stadium-supply-fan-jersey-drop-33` | `1778614734` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 34` | `stadium-supply-fan-jersey-drop-34` | `1778614814` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 35` | `stadium-supply-fan-jersey-drop-35` | `1778614892` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 36` | `stadium-supply-fan-jersey-drop-36` | `1778615990` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 37` | `stadium-supply-fan-jersey-drop-37` | `1778616077` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 38` | `stadium-supply-fan-jersey-drop-38` | `1778616448` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 39` | `stadium-supply-fan-jersey-drop-39` | `1778616524` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 40` | `stadium-supply-fan-jersey-drop-40` | `1778616604` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 41` | `stadium-supply-fan-jersey-drop-41` | `1778616728` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 42` | `stadium-supply-fan-jersey-drop-42` | `1778616861` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 43` | `stadium-supply-fan-jersey-drop-43` | `1778617016` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 44` | `stadium-supply-fan-jersey-drop-44` | `1778617340` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 45` | `stadium-supply-fan-jersey-drop-45` | `1778617473` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 46` | `stadium-supply-fan-jersey-drop-46` | `1778618509` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 47` | `stadium-supply-fan-jersey-drop-47` | `1778618714` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 48` | `stadium-supply-fan-jersey-drop-48` | `1778618830` | Exact/near-exact match | 1 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 49` | `stadium-supply-fan-jersey-drop-49` | `1778618937` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 50` | `stadium-supply-fan-jersey-drop-50` | `1778619028` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 51` | `stadium-supply-fan-jersey-drop-51` | `1778619148` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 52` | `stadium-supply-fan-jersey-drop-52` | `1778619185` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 53` | `stadium-supply-fan-jersey-drop-53` | `1778619295` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 54` | `stadium-supply-fan-jersey-drop-54` | `1778619398` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 55` | `stadium-supply-fan-jersey-drop-55` | `1778619608` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 56` | `stadium-supply-fan-jersey-drop-56` | `1778619691` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 57` | `stadium-supply-fan-jersey-drop-57` | `1778619724` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 58` | `stadium-supply-fan-jersey-drop-58` | `1778620106` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 59` | `stadium-supply-fan-jersey-drop-59` | `1778620107` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 60` | `stadium-supply-fan-jersey-drop-60` | `1778620156` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 61` | `stadium-supply-fan-jersey-drop-61` | `1778620328` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 62` | `stadium-supply-fan-jersey-drop-62` | `1778620892` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 63` | `stadium-supply-fan-jersey-drop-63` | `1787264076` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 64` | `stadium-supply-fan-jersey-drop-64` | `1787264134` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 65` | `stadium-supply-fan-jersey-drop-65` | `1787264190` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 66` | `stadium-supply-fan-jersey-drop-66` | `1787264234` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 67` | `stadium-supply-fan-jersey-drop-67` | `1787264273` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 68` | `stadium-supply-fan-jersey-drop-68` | `1787264447` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 69` | `stadium-supply-fan-jersey-drop-69` | `1787264493` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |
| `Stadium Supply Fan Jersey — Drop 70` | `stadium-supply-fan-jersey-drop-70` | `1787264582` | Exact/near-exact match | 0 | Review identity and price tier, then rename the existing record. |

## Unmatched supplied media groups

The following groups require direct merchant identification before being connected to a catalog record:

`1778609983`, `1778612079`, `1778612379`, `1778612880`, `1778617602`, `1778617695`, `1787264683`, `1787264789`, `1787264834`, `1787264886`, `1787264937`, `1787265008`, `1787265071`, `1787265142`, `1787265182`, `1787265223`, `1787265293`, `1787265337`, `1787265359`, `1787265410`, `1787265472`, `1787265621`, `1787265933`, `1787265975`, `1787266021`, `1787266093`, `1787266121`, `1787266163`, `1787266231`, `1787266263`, `1787266305`, `1787266556`
