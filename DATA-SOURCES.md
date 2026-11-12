# Data sources

Every file in `data/`, every remote map service the page loads, and the vendored code, with its
source, how it was derived, its size and its terms. Record counts were computed from the files on
6 October 2026. Licences for the project's own files are set out in `LICENSE-DATA.md`.

All agency data was pulled from the agencies' own public GIS services, mostly in August and
September 2026. Coordinates are `[lat, lon]` rounded to 5 decimal places (about 1 m). The raw pulls
are not in the repository because they total about 60 MB; `tools/src-2026-09-30/raw-manifest.json`
lists them with their service URLs, layer ids and SHA-256 hashes. The 7 October 2026 pulls (NOAA ENC
harbour band, USGS NHD, TIGERweb, NAIP readings) are in `raw/2026-10-07/`, listed the same way in
`tools/geometry/2026-10-07/raw-manifest.json`; the reduced public-domain geometry the builders read is
committed beside it.

## Legal layers

| File | Contents | Source | Derivation | Records | Licence |
|---|---|---|---|---|---|
| `law.json` | Citation registry: citation, title, effect, verbatim excerpt, URL, verification status | Online Sunshine (statutes), FLRules (administrative code), eCFR (federal), Municode and county codes (local) | Built by `tools/build-law.py` plus the dated review passes in `tools/law-updates/` | 326 entries (8 Oct 2026): 134 federal regulation, 78 state rule, 67 ordinance, 26 confirmed negative, 14 statute, 7 special act. 302 verbatim, 24 secondary. | CC BY 4.0; quoted law is free |
| `zones-statewide.json` | Statewide legal zones: federal fishery closures, Coast Guard and military zones, manatee No Entry zones, state areas, wildlife refuges, local ordinances | Coordinate text in the CFR and the Florida Administrative Code; FWC State Manatee Protection Zones (MapServer/9); USFWS NWR boundaries; NOAA ENC named sea areas; Census TIGERweb places; `piers.json`, `bridges.json` | `tools/build-zones-statewide.py`. Structure buffers drawn at 125 per cent of the stated distance. Boundaries the law gives only in words are drawn from the nearest published geometry with a flag, or shown as a marker. | 208 zones: 94 military and Coast Guard, 33 local, 27 manatee, 21 federal fishery, 16 state areas, 15 refuges, 2 other federal | CC BY 4.0 |
| `zones-local.json` | Local, park and federal zones | TIGER 2025 places; USGS National Hydrography Dataset high resolution (Lower Keys canal centrelines, `mon26`); TIGER/Line roads (127th Avenue for `ti58`, the Blind Pass Road intersection for `spb94`); USGS NAIP imagery (the `ti58` termini and John's Pass edge, the `3sis` centre); USACE National Channel Framework; NPS land resources boundaries; 33 C.F.R. § 165.785 coordinates | `tools/build-zones-local.py` (August inputs not kept), the text patches `tools/patch-zones-local-2026-09-30.py`, `-2026-10-06.py` and `-2026-10-07.py`, then the geometry patch `tools/patch-zones-local-geometry-2026-10-07.py`, which asserts the old coordinates it replaces | 18 zones; the Lower Keys canal zone holds 508 polylines (about 81 km; the OpenStreetMap set it replaced held 122, about 35 km) | CC BY 4.0 (ODbL 1.0 before 7 Oct 2026) |
| `zones-palmbeach.json` | Palm Beach County refuges and carve-outs, beach, jetty, groin, bridge and park buffers, inlet readings, COLREGS line, 3 nm line | NOAA ENC harbour band (cells US5FL6AN, US5PABBA, US5PABCA, US5FL6DN): Atlantic-facing coastline, 576 points from 26.66 to 26.90 N; jetty rip rap, groin and jetty tips (SLCONS); Blue Heron Bridge spans (BRIDGE areas); Peanut Island east shore. PBC Code App. G latitudes; 33 C.F.R. § 80.727 | `tools/extract-enc-2026-10-07.py` then `tools/build-zones-palmbeach.py` (`osm` argument rebuilds the August version for comparison). Beach buffer drawn at 150 yd for a 100 yd rule, refuge inner edge at 725 yd for a 750 yd rule, jetties at 150 ft for a 100 ft rule, bridge and swim areas at 125 yd for 100 yd. | 17 features | CC BY 4.0 (ODbL 1.0 before 7 Oct 2026) |
| `closures.json` | Fla. Stat. § 379.2425 closures: Upper Keys and John Pennekamp | Hand-built Upper Keys box through Long Key; FDEP park boundary for Pennekamp | `tools/build-layers.py` | 2 polygons | CC BY 4.0 |
| `fknms.json` | Florida Keys National Marine Sanctuary zones with regulation text | NOAA ONMS, `FKNMS_Zone_Boundaries_With_Attributes_04282026/FeatureServer/1` | Passed through from the August pull | 76 zones; 50 prohibit fishing; 47 in state waters | US government work |
| `cwa.json` | FWC Critical Wildlife Areas | `gis.myfwc.com/.../Critical_Wildlife_Areas_in_Florida/MapServer/7` | Fields reduced | 37 | Florida public record |
| `parkwaters.json` | State parks with submerged acreage | FDEP `PARKS_BOUNDARIES/MapServer/0` | Vertex thinning at 0.0006 deg | 120 parks, 1,798 rings | Florida public record |
| `jurisdiction.json` | State and federal waters boundary: 3 nm Atlantic, 9 nm Gulf | BOEM Submerged Lands Act boundary | Passed through; 230 Gulf paths repeat Atlantic paths and are dropped at load | 270 Atlantic and 600 Gulf paths | US government work |
| `regs.json` | Sidebar reference text by topic and county | The project's own | Hand-maintained | 92 entries in 8 sections | CC BY 4.0 |
| `species.json` | Spear status and limits per species, with citations | The project's own research | `tools/build-layers-2026.py` from `tools/src-2026-09-30/species.json` | 91 species | CC BY 4.0 |
| `coverage.json` | Research coverage tiers shown on the map | The project's own | Hand-drawn outlines, deliberately coarse | 3 regions | CC BY 4.0 |

Second review of 8 Oct 2026: `tools/patch-zones-2026-10-07.py` adds `clw2106` (Clearwater, TIGERweb place), `mxb9503` (Mexico Beach marker on the west jetty traced on NAIP) and `vol20121` (300 ft around the Ponce Inlet jetties as charted in NOAA ENC cell US5FL7GL) to `zones-local.json`, and `st-steinhatchee` (USGS NHD flowline) to `zones-statewide.json`; it also closes `nwr-cry` and adds § 18-1 to `loc-inlet-boynton`. Its inputs are in `tools/law-updates/2026-10-07/geom/`. No OpenStreetMap input.

Statewide sweep of 11 and 12 Nov 2026: `tools/patch-zones-2026-11-11.py` adds New Port Richey and Seminole (TIGERweb incorporated places, outer rings), the Riviera Beach Phil Foster Park and Blue Heron Bridge closure (positions read off USGS National Map and Esri World Imagery), and markers for county park water, St. Marks and the Naples canal entrances (the act's own coordinates). `tools/patch-zones-2026-11-12.py` adds the St. Augustine, Panama City and Miami marina closures (dock envelopes read off Esri World Imagery, buffered by 125 per cent of any stated distance) and markers for Anna Maria, Carrabelle, Pompano Beach, Tampa, Callaway, Lynn Haven and Marathon (imagery readings or TIGERweb internal points), plus 24 markers for local rules that had no map feature (FWC pier and ramp inventory positions, TIGERweb internal points, and park names geocoded with the Esri World Geocoder and checked on imagery), the Port Canaveral harbor and Lake Ponte Vedra from USGS NHD, and the Melbourne Beach, Satellite Beach and Cocoa Beach canal areas from USGS NHD clipped to TIGERweb city boundaries. Both write `zones-statewide.json`. No OpenStreetMap input.

## Structure and access

| File | Contents | Source | Derivation | Records | Licence |
|---|---|---|---|---|---|
| `sites.json` | Artificial reefs and natural sites | FWC Artificial Reef Locations (MapServer/12, 4,548 records); Palm Beach County ERM reef sites (252) | `tools/fetch-statewide.py`: merged within 60 m; `closed` from `closures.json`; `iw` from the inland classifier. `ref` and `edge` recomputed on 7 Oct 2026 by `tools/recompute-sites-ref-2026-10-07.py` against the NOAA ENC coastline the Palm Beach zones use (no value changed; the nearest offshore site is 205 yd from the refuge edge, and `edge` tests latitude only) | 3,609 (3,548 artificial, 61 natural) | Positions public record; `ref`, `edge`, `closed`, `iw` CC BY 4.0 (ODbL 1.0 before 7 Oct 2026) |
| `spots.json` | Curated dive spots with descriptions and media links | Positions from `sites.json`, FKNMS and FDEP buoy lists, `piers.json`, FPAN, NPS and other agency pages; text is the project's own | `tools/build-layers-2026.py` from `tools/src-2026-09-30/spots.json` | 283 spots, 481 links (352 pages, 66 photos, 61 videos, 2 galleries) | CC BY 4.0 for text and curation; media keep their own licences |
| `ramps.json` | Saltwater boat ramps | FWC Florida Boat Ramp Inventory (MapServer/4) | Filtered to saltwater ramps with lanes | 613 | Florida public record |
| `piers.json` | Fishing piers, jetties and fishing bridges | FWC Fishing Piers, Jetties and Bridges inventory | Inland/tidal/coastal tag added; buffer circles drawn by the page | 646 | Public record; tags CC BY 4.0 |
| `bridges.json` | Bridges with a three-way fishing-buffer status | FHWA National Bridge Inventory; decks from NOAA ENC bridges (enc_harbour 87 and 141, enc_approach 91 and 146) and US Census TIGER/Line roads over TIGERweb Areal Hydrography and USGS NHD water areas, pulled 8 Oct 2026 | `tools/build-layers.py`: limited-access classes excluded under § 316.130(18), FWC fishing structures confirmed, the rest presumed buffered; inland/tidal/coastal class from `tools/classify-inland.py`. `tools/build-bridge-spans.py` adds the deck fields from `tools/bridges-2026-10-08/decks.txt` | 7,822: 211 confirmed, 6,041 presumed, 1,570 excluded; 2,561 coastal, 303 tidal, 4,958 inland. Of the 2,509 coastal and tidal records the map buffers, 1,105 carry a deck and span buffer, 316 have a deck inside the circle, 1,086 have none found, 2 are ferries | Positions public domain; classification, deck and span fields CC BY 4.0 (deck and span fields ODbL 1.0 in the versions of 7 and 8 Oct 2026 drawn from OpenStreetMap) |
| `jetties.json` | Jetty buffers, r. 68B-20.003(2)(d), structure by structure | NOAA ENC shoreline construction (SLCONS, enc_harbour/approach/coastal); lines traced on USGS NAIP imagery where the chart does not carry the structure; 39 stand-in points from OpenStreetMap (an insubstantial extract, see `LICENSE-DATA.md`) | `tools/build-jetties.py` from `tools/jetties-2026-10-07/review.py` and `tools/jetties-2026-10-08/` (one record per structure, written while reading the imagery). 100 ft rule drawn at 150 ft, 10 m more where the outline comes from the chart; the long-jetty exception drawn 400 yd of the 500 yd and only where the jetty clears 1,500 yd by 300 yd | 75 zones: 55 closed, 20 warn; 18 use stand-in circles | CC BY 4.0; stand-in positions © OpenStreetMap contributors, ODbL 1.0 (insubstantial) |
| `beaches.json` | Beach buffer, r. 68B-20.003(2)(a), along Florida's sandy coast | FDEP Coastal Range Monuments (COASTAL_ENV_PERM MapServer/10); NOAA ENC coastline (enc_harbour 84, enc_approach 88), pulled 8 Oct 2026 | `tools/build-beaches.py` from `tools/beaches-2026-10-08/waterline.txt`: the open-water shore nearest each monument, chained by county and series, buffered 150 yd seaward | 121 stretches, about 1,160 km: 93 closed (R-series), 28 warn (V-series); 173 single-monument stretches not drawn | CC BY 4.0 |
| `buoys.json` | FKNMS mooring, spar and boundary buoys | NOAA ONMS `PubFKNMSBuoy2025/FeatureServer/0` | Fields reduced | 807 | US government work |
| `stations.json` | Tide, current and NDBC buoy stations | NOAA CO-OPS metadata API; NDBC active stations | Current stations deduplicated | 913: 625 tide, 178 current, 110 buoy | US government work |

## Habitat, depth and bottom

| File | Contents | Source | Derivation | Records | Licence |
|---|---|---|---|---|---|
| `contours.json` | Depth contours at 12, 18, 30, 60, 100 and 120 ft | NOAA ENC Direct DEPCNT, coastal and approach bands | Converted to feet, simplified at 0.00005 deg | 6,415 lines | CC0 |
| `enc.json` | Wrecks, obstructions, fish-haven points, rocks | NOAA ENC Direct WRECKS, OBSTRN, UWTROC, all three usage bands | Duplicates merged, most detailed band kept | 10,770: 5,940 obstructions, 2,499 rocks, 2,219 wrecks, 112 fish havens | CC0 |
| `enc-areas.json` | Charted fish-haven and wreck areas | NOAA ENC Direct OBSTRN and WRECKS areas | Duplicates merged, simplified | 952: 918 fish havens, 34 wreck areas | CC0 |
| `seabed.json` | Charted bottom type (S-57 NATSUR) | NOAA ENC Direct SBDARE points and areas | Deduplicated across bands | 14,038 points, 266 areas, 87 classes | CC0 |
| `hardbottom.json` | Natural hardbottom, southeast Atlantic | FWRI Unified Reef Map v2.2 | Fields reduced | 2,913 polygons | FWRI; use constraints not located |
| `hardbottom-sw.json` | Hardbottom outside the Unified Reef Map, West Florida Shelf pavement, worm reef | FWC Coral and Hard Bottom Habitats Statewide (MapServer/18), West Florida Shelf Benthic Habitats (MapServer/13), Worm Reef Habitats (MapServer/14) | Filtered to sources outside the Unified Reef Map; pavement only; simplified | 6,122: 4,958 West Florida Shelf, 1,144 FWC statewide, 20 worm reef | FWC statewide part public domain; the other two not located |

## Reference only (off by default, not in the offline builds)

| File | Contents | Source | Records | Licence |
|---|---|---|---|---|
| `enc-restricted.json` | Charted restricted and military practice areas | NOAA ENC Direct RESARE and MIPARE, deduplicated across bands | 532 | CC0 |
| `mpa.json` | NOAA MPA Inventory, Florida sites | NOAA MPA Inventory 2023 | 219 | Public domain; "not legal documents" |

The ENC restricted-area layer does not say what is restricted, because ENC Direct does not expose
the S-57 RESTRN attribute. The law comes from the CFR entries and the drawn zones.

## Remote map services

These load in the browser at run time. None needs a key except the two marked as optional.

| Service | Used for | Terms | Attribution shown |
|---|---|---|---|
| NOAA Chart Display Service | Default base map (nautical chart) | US government work | NOAA Office of Coast Survey. Not for navigation. |
| USGS The National Map, imagery | Satellite base map | Public domain | USGS The National Map, USDA NAIP |
| EOX Sentinel-2 cloudless 2016 | Satellite base map, 2016 | CC BY 4.0 (later years are non-commercial only) | Sentinel-2 cloudless by EOX IT Services GmbH, modified Copernicus Sentinel data 2016 and 2017 |
| USGS The National Map, topographic | Topographic base map | Public domain | USGS The National Map |
| OpenStreetMap tiles | Street base map | ODbL data; OSMF tile usage policy (light use) | © OpenStreetMap contributors, ODbL |
| Esri World Imagery (optional) | Imagery, only with an owner-supplied key | Esri terms | © Esri, Maxar, Earthstar Geographics |
| CARTO Dark Matter (optional) | Dark base map, only with an owner-supplied key | CARTO terms | © OpenStreetMap contributors, © CARTO |
| NOAA NCEI Coastal Relief Model and CUDEM hillshade | Seafloor relief overlays | US government work | NOAA NCEI. Not for navigation. |
| NOAA NCEI DEM Global Mosaic | Colour relief overlay | US government work | NOAA NCEI. Not for navigation. |
| GEBCO WMS | Ocean relief overlay | Public domain; not for navigation | GEBCO Compilation Group. Not for navigation. |
| FWC seagrass, coral and hardbottom, Unified Reef Tract, West Florida Shelf exports | Habitat overlays | FWC; the reef tract and shelf constraints not located | FWC Fish and Wildlife Research Institute and partners |
| NOAA CoastWatch ERDDAP (MUR SST, VIIRS Kd490) | Water temperature and clarity overlays | Free to use; not intended for legal use | NASA JPL and NOAA CoastWatch |
| NOAA NWS reference map | Marine forecast zones | US government work | NOAA National Weather Service |
| MarineCadastre danger zones | 33 C.F.R. part 334 areas as of July 2022 | Federal data | MarineCadastre.gov (NOAA and BOEM). Not for navigation. |
| Wikimedia Commons | Spot photo thumbnails | Per file | Each photo's credit and licence, shown under it |

## Vendored code

| Path | Version | Licence |
|---|---|---|
| `vendor/leaflet/` | Leaflet 1.9.4 | BSD 2-Clause, `vendor/leaflet/LICENSE` |

## Open questions about sources

- **Aerial-imagery positions (settled 7 Oct 2026).** The John's Pass corridor in `ti58` and the Three
  Sisters circle in `3sis` had been read from Esri World Imagery. Both were re-read from USGS NAIP
  imagery (public domain). The corridor's north-west edge was moved onto the Madeira Beach shoreline,
  where the August outline left part of the pass out; its other vertices sit on the channel and were
  kept. The Three Sisters centre moved 264 m south, from the pond in the middle of the property to the
  spring pool. The `ti58` termini are now read on the TIGER/Line street at the Gulf and bay waterlines.
  Screenshots and the endpoints used are listed in `tools/geometry/2026-10-07/raw-manifest.json`.
- **NOAA chart coastline against the waterline.** On USGS NAIP imagery (service refreshed June 2024) the ENC coastline runs along the
  upper beach at Singer Island (26.83 N), about 15 to 30 m landward of the waterline, and at the
  waterline on north Palm Beach (26.76 N). The Palm Beach beach buffer is drawn at 150 yd and the
  refuge inner edge at 725 yd so that neither closure shrinks below the rule on that evidence.
- **Use constraints not located** for the FWRI Unified Reef Map v2.2, the West Florida Shelf benthic
  layer (Nova Southeastern University and FWRI) and the worm reef layer (TNC and FWRI).
- **August service URLs not kept** for the bridge inventory, the FWC pier inventory, the BOEM
  boundary, the FDEP parks pull and the FKNMS zones. Source names come from the build notes.
