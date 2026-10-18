# Bottom Truth

Bottom Truth is a map of Florida waters that have been researched as closed or restricted to
spearfishing, with the statute, rule or ordinance behind every closure one click away. It also
shows the structure divers plan around: reefs, wrecks, hardbottom, depth contours, bottom type and
boat ramps.

**Not legal advice. Not official. Not for navigation.** The map shows what the project's research
found to be closed. Unshaded water is not shown as open, because many rules (the 100 yd and 100 ft
buffers around beaches, piers, bridges and jetties in particular) are not drawn everywhere. Rules
change. Check with FWC, NOAA and the local county before every dive, and obey posted signs.

Live site: <https://bottomtruth.com> · Offline copies: see [Releases](../../releases)

## What the map contains

Counts are from the data files as of 6 October 2026.

| Layer | Source | Records |
|---|---|---|
| Citation registry (statutes, rules, federal regulations, ordinances, confirmed negatives) | Online Sunshine, FLRules, eCFR, Municode and county codes | 326 |
| Statewide legal zones | CFR and FAC coordinate tables, Coast Guard and USACE zones, FWC manatee No Entry zones, wildlife refuges, local ordinances | 208 |
| Local, park and federal zones | County and city codes, NPS, Coast Guard | 18 |
| Palm Beach County zones | County code, state rule buffers, Coast Guard | 17 |
| Keys sanctuary zones | NOAA FKNMS boundaries (April 2026) | 76 (50 prohibit fishing) |
| Statutory closures | Fla. Stat. § 379.2425 | Upper Keys and John Pennekamp |
| State park waters | FDEP park boundaries | 120 parks |
| Fishing piers, jetties and fishing bridges, with buffers | FWC inventory | 646 |
| Bridges, classified for the bridge buffer | FHWA National Bridge Inventory | 7,822 (1,105 with the buffer drawn along the deck) |
| Jetty buffers, structure by structure | NOAA ENC shoreline construction, lines traced on USGS NAIP | 75 structures |
| Beach buffers along the sandy coast | FDEP range monuments, NOAA ENC coastline | 121 stretches, about 1,160 km |
| State and federal waters boundary | BOEM Submerged Lands Act boundary | 3 nm Atlantic, 9 nm Gulf |
| Reef and wreck sites | FWC artificial reef inventory and Palm Beach County | 3,609 |
| Curated dive spots with photo and video links | FWC, FKNMS, NPS, FPAN and others | 283 |
| Charted wrecks, obstructions, rocks, fish havens | NOAA ENC | 10,770 points, 952 areas |
| Depth contours | NOAA ENC | 6,415 lines at 12, 18, 30, 60, 100 and 120 ft |
| Charted bottom type | NOAA ENC | about 14,000 samples |
| Natural hardbottom | FWRI Unified Reef Map, FWC statewide compilation, West Florida Shelf | 9,035 polygons |
| Species: spear status and limits | FWC and federal rules | 91 species |
| Boat ramps (saltwater, with lanes) | FWC Boat Ramp Inventory | 613 |

Every source, licence and derivation is listed in [DATA-SOURCES.md](DATA-SOURCES.md).

## How complete the legal layer is

| Area | What is drawn |
|---|---|
| Palm Beach County | The most complete: the county refuge areas, all four buffers of Fla. Admin. Code r. 68B-20.003(2), the inlet rules, diver-flag zones, Coast Guard security zones and the 3 nm line. |
| Statewide | Federal fishery closures and special management zones, Coast Guard and military zones, manatee No Entry zones, wildlife refuges, state park waters, the Keys sanctuary, the statutory closures, and local ordinances found in a 211-jurisdiction coastal sweep (30 September 2026). |
| Outside Palm Beach County | Of the r. 68B-20.003(2) buffers, jetties are drawn structure by structure statewide (75 structures), coastal and tidal bridge buffers run along each deck that the NOAA chart or the Census road map shows, FWC-listed piers get a circle, and the beach buffer runs along the open-coast sandy beaches that FDEP's range monuments mark (about 1,160 km). Beaches on bays and lagoons, and short beaches with a single monument, are not drawn. Assume a buffer applies wherever there is a beach, pier, fishing bridge or jetty. |

The map's research-coverage layer shows these tiers. Open items, including every zone whose
boundary could not be drawn from published geometry, are in [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md).

## How boundaries are drawn

- **No invented geometry.** Where the law defines a boundary that no public dataset carries, the
  zone is drawn from the nearest published geometry that contains it, with a flag saying how the
  drawing differs, or it is shown as a marker.
- **Conservative margin.** Buffers are drawn wider than the rule: 125 yd where a rule says 100 yd,
  150 ft where it says 100 ft. Where a rule is ambiguous, the reading that closes more water is
  drawn, and the flag says which reading was used.
- **Every zone traces back.** Each zone carries its citation ids, which open the legal encyclopedia
  (the **Law** button) with the verbatim text, its verification status and a link to the official
  source.

### Bridges

Fla. Admin. Code r. 68B-20.003(2)(c) buffers "any bridge where public fishing is legally
permitted". Florida law makes bridge fishing lawful unless the Department of Transportation finds a
bridge dangerous and posts signs (§ 316.1305), and it bars pedestrians from limited-access highways
(§ 316.130(18)). No statewide register of posted bridges exists. The map therefore sorts bridges
into three legend rows:

| Class | Count | Buffer drawn | Meaning |
|---|---|---|---|
| Confirmed fishing | 211 | Yes | In FWC's fishing-structure inventory |
| Unposted, presume buffered | 6,041 | Yes | No sign is known, so fishing is presumed lawful and the buffer presumed to attach |
| Limited access | 1,570 | No | Pedestrians are barred, so the bridge buffer does not attach |

### Fresh and salt water

Florida prohibits spearfishing in fresh water, and its legal test for where salt water ends is
whether the water is "unpalatable because of the saline content" (Fla. Stat. § 379.101(33)). There
is no salinity threshold, no per-river list and no official map. The **Inland waters** toggle hides
structures classified as inland, using FWC's own fresh and salt labels on 2,627 boat ramps and
water-body names (95.1 per cent agreement in leave-one-out testing). That classification has no
legal force; every popup says which class a feature landed in and why.

## Using it

The legend is the filter: click a row to show or hide it. **What's here?** lists every drawn legal
layer at a clicked point. **Law** opens the citation encyclopedia, **Species** shows spear status
and limits, and the search box finds spots, wrecks, rules, species and coordinates. **GPX** and
**CSV** export the categories currently switched on.

### Offline copies

Each release attaches two single-file builds that work without a server:

| File | Size | Left out |
|---|---|---|
| `bottom-truth-offline.html` | about 15 MB | the two reference-only layers |
| `bottom-truth-offline-lite.html` | about 6 MB | also depth contours, hardbottom, bottom type and charted fish-haven areas |

Base maps and overlays are remote tiles in every build, so they need a connection.

### URL parameters

| Parameter | Example | Effect |
|---|---|---|
| `embed` | `embed=1` | Hide the sidebar |
| `mode` | `mode=free` | `scuba` (default) or `free` (freediving) |
| `cats` | `cats=natural,wreck` | Only these categories on (ids from `CATS` in `js/app.js`) |
| `ramp` | `ramp=Phil%20Foster` | Measure distances from this launch |
| `lat`, `lon`, `zoom` | `lat=26.77&lon=-80.03&zoom=14` | Starting view |
| `spot` | `spot=uss-oriskany` | Open a curated dive spot |
| `base` | `base=chart` | `sat` (default), `chart`, `s2`, `topo`, `street` |

`window.FLSpearMap` exposes the same controls to scripts on the same origin: `setMode`,
`setCategories`, `setLaunch`, `flyTo`, `search`, `whatsHere`, `queryPoint`, `openSpot`,
`exportGpx` and `exportCsv`.

## Running and building

The site is static: `index.html`, `css/`, `js/`, `data/` and vendored Leaflet. Serve the directory
with any web server, for example `python3 -m http.server 8000`. Opening `index.html` from disk does
not work because browsers block `fetch()` on `file://`; use an offline build instead.

```sh
python3 tools/test-data.py                     # citation ids resolve, coordinates in range, rings closed
for f in js/*.js; do node --check "$f"; done
python3 build-standalone.py [--out DIR]         # the two offline builds
NODE_PATH=<dir>/node_modules node test/smoke-test.js [--standalone | --lite]   # needs jsdom
```

GitHub Actions runs these checks on every push that changes code or data, together with `tools/check-text.py` (no dashes or permissive wording in the map's own text). On `main` it also builds the site, including the
offline copies, onto the `site` branch, which the web host deploys. How the data was built, and how
to rebuild it, is in [docs/BUILD.md](docs/BUILD.md); field-by-field formats are in
[docs/SCHEMA.md](docs/SCHEMA.md).

## Reporting an error

Corrections are the most valuable contribution. Open an issue, or email contact@bottomtruth.com if
you have no GitHub account, with the location, what the map shows, and what the posted sign or the
law says, ideally with a photo of the sign or a link to the
official text. [CONTRIBUTING.md](CONTRIBUTING.md) sets out the evidence standard for changes, and
[CHANGELOG.md](CHANGELOG.md) records every correction made.

## Licences

- Code: MIT, see [LICENSE](LICENSE).
- Data: per file, see [LICENSE-DATA.md](LICENSE-DATA.md). The project's own research is CC BY 4.0;
  earlier versions of five files derived from OpenStreetMap (three before 7 Oct 2026, and the jetty
  file and bridge decks of 8 Oct 2026 before their rebuild) are ODbL 1.0; redistributed agency data
  keeps its upstream public status.
- Leaflet: BSD 2-Clause, see `vendor/leaflet/LICENSE`.

Agency names appear as plain-text credits only. Bottom Truth is not affiliated with or endorsed by
FWC, NOAA, the Coast Guard, the National Park Service or any county or city.

© 2026 Robert Karas
