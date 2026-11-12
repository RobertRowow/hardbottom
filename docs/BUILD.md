# Building and deploying

How the data in `data/` was made, how to rebuild it, and how the website is published.

## Layout

| Path | What |
|---|---|
| `index.html`, `about.html`, `404.html`, `favicon.svg`, `css/`, `js/`, `vendor/leaflet/` | The website |
| `data/` | The map's data files; sources and licences in `DATA-SOURCES.md` and `LICENSE-DATA.md` |
| `build-standalone.py` | Builds the two offline single-file copies |
| `tools/` | Derivation scripts, dated legal review passes, curated sources and parsed geometry |
| `test/smoke-test.js` | Boots the page in jsdom and checks the notice, legend, search and panels |
| `docs/` | This file, field formats (`SCHEMA.md`), the procedure for adding a rule (`ADDING-A-ZONE.md`) and the backlog |
| `.github/workflows/` | `ci.yml` runs the checks on every push; `deploy.yml` builds the `site` branch |
| `robots.txt`, `.htaccess` | Web server settings for the Hostinger deployment |

## Publishing

1. A push to `main` runs `deploy.yml`. It repeats the checks, copies the website files into `dist/`,
   builds `bottom-truth-offline.html` and `bottom-truth-offline-lite.html` into it, and commits the
   result to the `site` branch on top of the previous site commit.
2. Hostinger's Git deployment for bottomtruth.com pulls the `site` branch into `public_html`, either
   automatically through its webhook or with the Deploy button in hPanel.
3. Pushing a tag such as `v2026.10.06` also publishes the two offline copies as a GitHub release.

The offline copies are never committed to `main`. The `site` branch does carry them, so it grows by
about 21 MB each time the data changes. If it becomes large it can be reset to a single commit; the
Hostinger deployment then needs one manual redeploy.

**Launched 7 October 2026.** The site is public without a password, `robots.txt` admits crawlers
(except the two large offline files) and points at `sitemap.xml`, and the GitHub repository is public
so the About page's links resolve. Hostinger redeploys the `site` branch on each push.

## Rebuilding the data

The raw GIS pulls (about 60 MB) are not in the repository. They are listed with their service URLs
and SHA-256 hashes in `tools/src-2026-09-30/raw-manifest.json` and, for the 7 Oct 2026 ENC, NHD and
TIGER pulls, `tools/geometry/2026-10-07/raw-manifest.json`; the scripts that need them read
`raw/<date>/`. The geometry scripts need shapely and pyproj.

```bash
python3 tools/build-law.py                        # data/law.json: base registry plus the dated passes
python3 tools/patch-zones-local-2026-09-30.py     # zones-local.json: legal review text and law ids
python3 tools/patch-zones-local-2026-10-06.py     # zones-local.json: release text and kinds
python3 tools/patch-zones-local-2026-10-07.py     # zones-local.json: 7 Oct 2026 legal currency pass text
python3 tools/patch-zones-local-geometry-2026-10-07.py  # zones-local.json: NHD canals, TIGER and NAIP positions (run after the text patch)
python3 tools/extract-enc-2026-10-07.py           # tools/geometry/2026-10-07/enc-palmbeach.json from raw/2026-10-07/ (ENC pulls)
python3 tools/build-zones-palmbeach.py            # data/zones-palmbeach.json from the ENC extract ('osm' argument rebuilds the old file)
python3 tools/recompute-sites-ref-2026-10-07.py   # sites.json ref and edge against the rebuilt refuges
python3 tools/build-zones-statewide.py            # data/zones-statewide.json (needs raw/; applies the 7 Oct patch)
python3 tools/patch-zones-statewide-2026-10-07.py # without raw/: the same 7 Oct edits on the committed JSON
python3 tools/build-layers-2026.py                # ENC, seabed, contours, habitat, buoys, stations, spots, species (needs raw/)
python3 tools/patch-2026-10-07.py                 # regs.json, coverage.json, both species files: 7 Oct seasons and sweeps
python3 tools/patch-2026-10-07-drawn.py           # regs.json, coverage.json: Hollywood and inlet zones now drawn
python3 tools/patch-zones-2026-10-07.py           # zones-local, zones-statewide: Clearwater, Mexico Beach, Ponce, Steinhatchee
python3 tools/patch-regs-species-2026-10-07.py    # regs.json, species.json: the 8 Oct second review (run after the two above)
python3 tools/build-jetties.py                    # data/jetties.json from tools/jetties-2026-10-07/ and -2026-10-08/ (NOAA ENC, NAIP traces, stand-ins)
python3 tools/build-bridge-spans.py               # bridges.json: rv, ds, dk and sp from tools/bridges-2026-10-08/decks.txt
python3 tools/build-beaches.py                    # data/beaches.json from tools/beaches-2026-10-08/waterline.txt
python3 tools/patch-2026-10-08-buffers.py         # regs.json: statewide buffer text for the three layers above
python3 tools/patch-zones-2026-11-11.py           # zones-statewide.json: 11 and 12 Nov sweep (TIGER places, Riviera Beach, markers)
python3 tools/patch-zones-2026-11-12.py           # zones-statewide.json: marina, inlet, beach and citywide swim and dive rules
python3 tools/patch-regs-species-2026-11-11.py    # regs.json, species.json: Atlantic and Keys gag and black grouper
python3 tools/build-questions.py                  # questions.html from data/questions.json and the flagged zones
python3 tools/check-text.py                       # no dashes, no permissive wording in the map's own text
python3 tools/test-data.py
NODE_PATH=<jsdom>/node_modules node test/smoke-test.js
python3 build-standalone.py [--out DIR]
```

- Never edit `data/law.json` by hand. Add a dated pass under `tools/law-updates/<date>/` or an entry
  in the manual block of `tools/law_updates.py`. Pass directories dated after 2026-10-06 are applied
  automatically, oldest first, in the file order of their `pass.json`; set the `version` in
  `tools/build-law.py` to the date of the latest currency check.
- `zones-local.json` cannot be rebuilt from `tools/build-zones-local.py`, because its August inputs
  were not kept. The two patch scripts change text, kinds and law ids only, never coordinates.
- `data/regs.json` and `data/coverage.json` are edited by hand, except for the dated scripted edits in
  `tools/patch-2026-10-07.py`, which assert the old text before replacing it and are safe to rerun.
- The 7 Oct 2026 patches must run after the builds they patch: `build-zones-statewide.py` and
  `build-layers-2026.py` rewrite the files they touch. `build-bridge-spans.py` refuses to run if
  `bridges.json` no longer has the 2,509 coastal and tidal records the decks were pulled for.
- The 8 Oct 2026 pulls for the jetty, bridge and beach layers were made in the author's Chrome
  (fetch() in a page on encdirect.noaa.gov, which also reached TIGERweb, the USGS NHD service and the
  FDEP open-data service), reduced in the page, and transcribed with a 32-bit rolling hash check. The
  reduced files are committed: `tools/jetties-2026-10-08/enc-jetties.txt`,
  `tools/bridges-2026-10-08/decks.txt` and `tools/beaches-2026-10-08/waterline.txt`; each script header
  gives the endpoints, layer ids and the selection rule. The raw responses were not kept.
- Traps found on 8 Oct 2026: NOAA ENC charts most Florida inlet jetties as shoreline construction with
  CATSLC "pier" (S-57 "pier (jetty)"), not "breakwater"; ENC bridge features cover the charted spans
  over navigable water and often not the trestle approaches, so the bridge layer joins the ENC deck with
  the TIGER road over mapped water; the USGS NHD Waterbody layer answers in several seconds per query
  and was dropped part-way through the road search.

## Endpoints and traps

The 30 September layers, with layer ids, counts, licences and traps, are documented in
`DATA-SOURCES.md` and `tools/src-2026-09-30/layers-research.json`. The August sources:

| Layer | Source |
|---|---|
| Municipal boundaries | `tigerweb.geo.census.gov/.../Places_CouSub_ConCity_SubMCD/MapServer/4`, filter `STATE='12'` |
| Navigation channels | `services7.arcgis.com/n1YM8pTrFmm7L4hs/.../National_Channel_Framework/FeatureServer/1`; the Intracoastal is named `IWW`, `GIWW` or `AIWW` |
| NPS park boundaries | `services1.arcgis.com/fBc8EJBxQRMcHlei/.../NPS_Land_Resources_Division_Boundary_and_Tract_Data_Service/FeatureServer/2`, filter on `UNIT_CODE` |
| FKNMS zones | `services2.arcgis.com/C8EMgrsFcRFL6LrL/.../FKNMS_Zone_Boundaries_With_Attributes_04282026/FeatureServer/1` |
| FWC Critical Wildlife Areas | `gis.myfwc.com/hosting/.../Critical_Wildlife_Areas_in_Florida/MapServer/7` |
| Florida state parks | `ca.dep.state.fl.us/arcgis/rest/services/OpenData/PARKS_BOUNDARIES/MapServer/0`; the `SUBMERGED` acreage decides whether a park has water |
| County boundaries | `gis.fdot.gov/arcgis/.../Admin_Boundaries/FeatureServer/5` |

Traps:
- NOAA Chart Display Service tiles are numbered two zoom levels below web-mercator; Leaflet needs
  `zoomOffset: -2`.
- Florida ENC has no 10 or 20 ft contours. US charts carry 12, 18, 30, 60, 100 and 120 ft lines.
- Fish havens are ENC obstructions (OBSTRN with CATOBS "fish haven"), not FSHFAC.
- ENC Direct returns bottom type (NATSUR) as text and does not expose RESTRN, so a charted
  restricted area does not say what is restricted.
- The same ENC feature appears once per usage band; deduplicate and keep the most detailed band.

Dead ends already checked: `mapservices.nps.gov/.../LandResourcesDivisionTractAndBoundaryService`
(404), `ocean.floridamarine.org/.../TRGIS_BaseLayers` (500), `atoll.floridamarine.org/.../OpenData_Boating`
(gone), `FKNMS_existingzones/FeatureServer/0` (needs a token), any statewide FDEP Class III-Marine
versus Class III-Fresh layer (does not exist), and `tileservice.charts.noaa.gov` (retired 2021).
