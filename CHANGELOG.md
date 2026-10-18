# Changelog

Changes to what the map says about the law are listed here with the date they were made, so anyone
who relied on an earlier version can see what changed. Code-only changes are summarised.

## 17 October 2026: contact dialog

No rule changed.

- **Contact dialog.** A Contact button in the header opens a short dialog on how to report a posted
  sign the map shows differently, a missing rule, or a suggestion, and the About page gains a Support
  section. A link to `bottomtruth.com/#contact` opens the dialog directly.
- **Email address withdrawn the same evening.** contact@bottomtruth.com was published briefly but
  has no mailbox behind it; mail sent to it did not arrive. Reports go through GitHub issues until a
  working address replaces it. Once an address is set, the dialog also opens once by itself, after
  about three minutes on the map or five clicks on it, then not again for 60 days, and its email
  button fills in the current map view.
- **Tips.** A tip paragraph and button stay switched off until a tip page exists (`TIP_URL` in
  `js/support.js`). No third-party script or frame is loaded either way.

## 8 October 2026 (later): beach buffer statewide, rebuild without OpenStreetMap

No rule changed. What changed is where three of the statewide buffers of r. 68B-20.003(2) are drawn.

- **Beach buffer drawn statewide.** The 100 yd buffer of r. 68B-20.003(2)(a) is now drawn at 150 yd
  seaward of the charted shore along 121 stretches of open-coast sandy beach, about 1,160 km in 28
  counties, chained from FDEP's coastal range monuments. 93 stretches on R-series monuments are drawn
  closed; 28 on V-series (supplementary) monuments are amber. Beaches on bays and lagoons, the Keys and
  173 single-monument stretches are not drawn (OPEN-QUESTIONS.md question 34).
- **Jetties rebuilt from the NOAA chart.** The 46 jetty outlines that came from OpenStreetMap now come
  from NOAA ENC shoreline construction, drawn 10 m wider than the 150 ft line. Where the imagery shows
  structure the chart does not carry, a circle sized to the stretch stands in (39 circles at 18
  structures). The St. Marys south long-jetty stretch is now drawn as intended.
- **Bridge decks rebuilt from the NOAA chart and the Census road map.** 1,105 coastal and tidal
  bridges carry the 125 yd buffer along the deck (was 1,441 from OpenStreetMap), 316 have a deck
  inside the circle, and 1,086 keep the circle only. The total bridge buffer is 138.4 km² (was 143.4).
  Most of the difference is OpenStreetMap deck over land; about 1.5 km² over mapped water is no longer
  drawn, mostly at causeway ends, and is listed in question 33. Fort Hamer Road and Crosstown Parkway
  have no deck in any public source; treat them as buffered end to end.
- **Licence.** `jetties.json` and the bridge deck fields are CC BY 4.0 again; the 39 stand-in positions
  are an insubstantial OpenStreetMap extract and are credited (LICENSE-DATA.md).

## 8 October 2026: second review, jetties and bridge spans

Rules current as of 8 Oct 2026. A second pass over the same days, done in parallel with the 7 October
pass below; where both found the same rule, the map keeps one entry. Every new excerpt was read word
for word at the primary source (`tools/law-updates/2026-10-07/reads.md`).

- **Jetties are traced, not circled.** 75 jetties, groins and breakwaters from St. Marys to Pickens
  and the Keys were read one at a time on USGS NAIP imagery. Each is drawn as its own outline with
  the 100 ft buffer of r. 68B-20.003(2)(d) at 150 ft. Groins and breakwaters that may count as a jetty
  are amber. At St. Marys south and St. Johns north, which run more than 1,500 yd out, the last
  400 yd are drawn amber for the long-jetty exception.
- **Bridge buffers follow the deck.** 1,441 coastal and tidal bridges now carry the 125 yd buffer
  along the whole bridge as traced, not only around the inventory point (the Gandy Bridge buffer
  now runs 4 km). 558 records with no matching deck keep the circle and say so in the popup.
- **New closures drawn:** Clearwater citywide (projectile weapon ban, as at Treasure Island); the
  Mexico Beach canal channel (marker); 300 ft around the Ponce Inlet jetties (Volusia beach code);
  the Steinhatchee River (fresh water by statute). Crystal River NWR changed from amber to closed.
  Boynton Inlet also cites the county's § 18-1 swimming and sand-plant rules.
- **Federal:** a loaded speargun in any vessel is prohibited in national parks (36 C.F.R. § 2.4(c));
  spears prohibited on wildlife refuges unless authorized (§ 27.43); one scamp or yellowmouth within
  the South Atlantic grouper bag and no more than 10 of any one snapper-grouper species; fish landed
  with head and fins in federal waters; Everglades transit passes; fresh water in parks hook and line only.
- **State:** fishing preemption is Fla. Stat. § 379.2412, not § 790.33; no diving from a public bridge
  (§ 316.130(17)); speargun possession on fresh water prohibited (r. 68A-23.002(7), correcting an
  earlier note); reef fish landed whole; descending device aboard; snook and tarpon rules; permit and
  African pompano federal-water gear rule; divers-down flag sizes and slow-down distances.
- **Local text added:** Cape Coral, Sanibel, Naples, Collier, Brevard and Satellite Beach canal gear
  rules; Clearwater; St. Petersburg bridges and pier district (§ 7-5); Pinellas County parks (§ 90-7);
  Bradenton Beach parks; Broward County's 1921 inside-waters act (status open); Boynton § 18-1.

## 7 October 2026: legal currency pass

Three research passes (federal, state and local) re-read the open questions and every dated season
statement against primary sources. The map now shows "Rules current as of 7 Oct 2026". The citation
registry grew from 278 to 295 entries; the entries and the four-axis check behind each are in
`tools/law-updates/2026-10-07/`.

Changes to what the map says about the law:

- **OpenStreetMap removed from the map data.** The Palm Beach County zones are rebuilt from the NOAA
  ENC chart coastline, jetties and bridge spans; the Lower Keys canal layer now uses USGS NHD canals
  (508 lines, about 81 km, against 122 OpenStreetMap lines); Treasure Island's 127th Avenue comes from
  Census TIGER. These files are now CC BY 4.0. To keep a chart line that sits above the waterline
  from shrinking a closure, the Palm Beach beach buffer is drawn at 150 yd for the 100 yd rule (was
  125 yd) and the refuge inner edge at 725 yd for the 750 yd rule. Reef-site refuge membership was
  recomputed: no site changed.
- **Positions re-read from public-domain USGS NAIP imagery** instead of Esri imagery: the Three
  Sisters Springs circle moved 264 m south onto the spring pool; the John's Pass corridor now covers
  the strip along the Madeira Beach shore that the August outline missed; both ends of 127th Avenue
  are at the waterline.
- **Gulf federal shallow-water grouper closure beyond 20 fathoms removed.** The 1 February to
  31 March recreational closure seaward of the 20-fathom line (50 C.F.R. § 622.34(d)) was removed
  and reserved by Gulf Reef Fish Amendment 62, 91 FR 63502, effective 2 October 2026. The species
  panel, the seasons notes and the registry no longer state it. The Edges closure (1 January to
  30 April) is unchanged, and from 1 January 2027 black grouper, scamp, yellowfin and yellowmouth
  grouper are closed in Gulf federal waters 1 January to 30 June (91 FR 36545, now read from the
  Federal Register).
- **Vero Beach manatee No Entry zone gone.** The adopted r. 68C-22.007 (effective 30 June 2026) has no
  No Entry zone; the Vero Beach power-plant canals are Idle Speed all year, which does not bar
  divers. The zone (`man-66`) is no longer drawn. The manatee layer now has 20 No Entry polygons in
  9 counties, down from 21 in 10.
- **Monroe County ch. 26 art. IV corrected and read verbatim.** The lobster-season ban is §§ 26-96
  to 26-99: no diving or snorkeling in any manmade water body or marina (wider than "canals"), or
  within 300 ft of improved residential or commercial shoreline, from three days before the
  mini-season through the first five days of the commercial lobster season (not the "regular
  season"), and it applies in the cities as well as unincorporated Monroe unless a city ordinance
  conflicts. It is cited on the Lower Keys canal layer as text; improved shoreline is not drawn. No
  county bridge diving ban is codified.
- **Laws of Fla. ch. 59-1702 is the Palm Beach County night and inlet ban, not a refuge act.** Read
  from the 1959 session laws: it bans underwater spearfishing, freediving included, in all county
  salt waters from one hour after sunset to one hour before sunrise, at all times within any inlet
  in the county, and within 150 ft of an anchored boat with people fishing. New entry `pbc-13-32`;
  Palm Beach reef sites now cite it. The inlet ban is now drawn at Jupiter Inlet and South Lake
  Worth (Boynton) Inlet as well as Lake Worth Inlet, from the NOAA chart, broad reading. Ch. 59-1699 is the act behind the two scuba refuges.
- **New local rules in the registry:** Hollywood § 99.03(F) (no spearfishing within 100 yards of the
  public beach; drawn 175 yards from the chart coastline, Hallandale line to the state park), Pinellas County § 14-97 (spearing excluded in every manmade saltwater canal), Naples
  § 42-3 (no swimming within 100 ft of a public bridge), Town of Palm Beach §§ 74-162(e) and 74-197
  (no fishing off or within 50 yards of a guarded beach; no swimming beyond 300 ft of one), Deerfield
  Beach § 50-112(b) and (p) (no swimming beyond 50 yards of the city beach without lifeguard
  permission; no fishing off the beach 8 a.m. to dusk, drawn as a marker) and St. Petersburg § 21-44
  (no fishing in park waters unless signed). Only Deerfield Beach is on the map so far; the rest are
  listed in `OPEN-QUESTIONS.md` question 26 until published geometry is found.
- **Gulf Islands National Seashore.** The 1 September 2026 compendium was read in full: it has no
  spearfishing or projectile rule, and the water boundary (one mile from the low tide line at Perdido
  Key, Fort Pickens and Santa Rosa; 100 yards at Naval Live Oaks) is confirmed from the park's own
  page. The fishing and diving closures it does contain are listed. The Seashore stays amber because
  two nps.gov pages still print the 2021 projectile ban and the park has not confirmed it was
  rescinded.
- **Season statements reworded to state closures.** Gag (Atlantic and Monroe closed 2 August 2026 to
  30 April 2027; Gulf closed 1 October 2026 to 31 August 2027), red snapper (Atlantic closed outside
  9 to 22 October; the Gulf closed days listed), hogfish, greater amberjack (Gulf closed from
  14 October 2026; the federal citation is now the temporary rule 91 FR 32360, and the state order
  expires 1 November with the rule closure continuing), snowy grouper, red porgy and the other
  seasonal entries now say when the fish is closed rather than when it is open. Season cells that only
  repeated the closure as an open season are now empty.
- **Upgraded to verbatim:** the Gag executive orders EO 26-10 and EO 26-26, Fort Pierce §§ 28-4 and
  28-31(18), Lake Park § 76-89, Deerfield Beach § 50-112, 50 C.F.R. § 600.725(v) and r. 68B-24.0065
  (all 35 Pennekamp lobster-zone corners match the adopted rule).
- **Other entries added:** the FKNMS Restoration Blueprint final rule (French Reef and Rock Key SPAs
  and the Looe Key Research Only Area eliminated where the Blueprint applies; no effective-date notice
  published), 36 C.F.R. §§ 1.4 and 2.4(b) (a speargun is a weapon in a national park), Executive
  Order 14430 (no agency proposal yet), r. 68C-22.004 (manatee zone marking), South Atlantic
  Regulatory Amendment 36 (gag and black grouper vessel limit from 28 October 2026) and a record of
  confirmed negatives (Martin County, St. Petersburg's repealed spear rule, Santa Rosa County beyond
  § 14-52, the Santa Rosa Island Authority, Treasure Island designations, a Monroe bridge ban).
- **Flags updated** on the Hobe Sound, Pinellas and Passage Key refuges (Fish and Wildlife Service
  wording), Fort Pierce, Lake Park, the Deerfield Beach pier, Hillsboro Inlet, Sunny Isles Beach and
  Hallandale Beach. The Boca Raton Inlet closure also cites the county inlet ban.
- Re-read: r. 68B-14.009 (State Reef Fish Survey) after its 1 September 2026 amendment;
  the species list did not change.

## 7 October 2026

- Offshore, where the USGS imagery stops, the satellite base now shows the 2016 Sentinel-2 mosaic
  beneath it instead of blank water.
- Phone layout: a compact header and shorter side panel give the map most of the screen, and the
  notice bar wraps instead of running off the edge.
- Search engines may now index the site; a sitemap lists the map and the About page.
- The map opens on satellite imagery (USGS NAIP) instead of the NOAA nautical chart. The chart is
  one click away in the base map control, or open the map with `?base=chart`. No legal content changed.

## 6 October 2026: first public release as Bottom Truth

- Renamed from "Florida Spearfishing Map" to Bottom Truth.
- Map text reworded so that it only states what the law closes or restricts, never that water or
  gear is lawful. Examples:
  - The Biscayne National Park zone, previously named "spearfishing IS legal" and drawn green, is
    now "Biscayne National Park: closures inside the park" and drawn amber. Its citation entry now
    lists the channel, harbor, Legare Anchorage and bonefish-area closures.
  - The Ft. Pierce Offshore Reef zone, previously named "(spearfishing allowed)", now names the
    gear the rule restricts.
  - Species and citation entries that read "spearing allowed" or "spearing is lawful" now say the
    rule "does not exclude spear as gear". The species panel's "Legal gear" label is now "Not
    excluded".
- Pier, jetty and bridge buffers are now shown when the map first loads.
- Em and en dashes removed from the map's own text; quoted law is unchanged.
- Removed stale claims that local ordinances outside Palm Beach County had not been read, and
  marked the City of Marathon canal rule (§ 18-27) as read.
- Licences set per file (MIT for code, CC BY 4.0 for the project's research, ODbL 1.0 for the three
  files derived from OpenStreetMap), with a full source list in `DATA-SOURCES.md`.
- Offline builds renamed `bottom-truth-offline.html` and `bottom-truth-offline-lite.html` and moved
  out of the repository into releases.

## 30 September 2026: statewide legal review

The full review, with every citation and the browser check of each excerpt, is in the project's
research notes and in `tools/law-updates/2026-09-30/`.

- Citation registry grew from 53 to 278 entries. A browser check compared 230 excerpts word for word
  with the primary source: 208 matched, 16 had trivial differences, 6 were corrected. After the review
  the registry held 246 entries verified word for word, 31 marked secondary (taken from a source other
  than the primary text, or not yet matched to it) and 1 unverified.
- Added 208 statewide zones: federal fishery closures and special management zones, Coast Guard and
  military zones, manatee No Entry zones, wildlife refuges and local ordinances.
- New closures found, among others: Biscayne National Park's seasonal bonefish closure and its 100 ft
  dive closure along marked channels; Mar-a-Lago east security zone changed to no entry (September
  2025); Old Tampa Bay north of the Gandy Bridge and Turkey and Crane Creeks closed to spears by gear
  rules; manatee No Entry zones closed to swimmers and divers; Western Dry Rocks closed to all
  fishing 1 April to 31 July; spearfishing gear banned in the Ft. Pierce Inshore and Key Biscayne
  AR-H special management zones; area-wide speargun or spearfishing bans in Venice, Cedar Key, Bal
  Harbour, Lauderdale-by-the-Sea, Treasure Island, Dania Beach and Sunny Isles Beach.
- Gulf Islands National Seashore: the 2021 projectile-gear ban is not in the compendium updated
  1 September 2026. Its status is unresolved and the Seashore is drawn amber.

## August 2026: first versions

- 22 August: first map, for the southeast Atlantic coast, expanded statewide the same day, with the Palm Beach County refuge areas and the state rule buffers.
- Late August: first citation verification pass (53 citations, 16 defects fixed).
