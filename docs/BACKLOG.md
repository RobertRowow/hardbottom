# Application backlog

Distinct from `OPEN-QUESTIONS.md`, which is the legal research queue. This is what to build. Ranked.
Last reviewed 8 October 2026.

## Done at launch (7 October 2026)

- Site public at bottomtruth.com; repository public; search engines admitted with a sitemap.
- Phone layout checked at 360, 390 and 820 px wide (headless Chromium) and fixed: compact header,
  wrapping notice bar, smaller attribution.
- OpenStreetMap-derived geometry rebuilt from NOAA ENC, USGS NHD and TIGER; the three files are now
  CC BY 4.0. The `ti58` and `3sis` positions re-read from USGS NAIP.

## Next

5. **A reporting channel that does not need GitHub.** Done 17 Oct 2026 in code: contact@bottomtruth.com
   on the About page and in the Contact dialog. The Hostinger forwarder must exist before this is
   pushed. Open: a Ko-fi page, then set `TIP_URL` in `js/support.js` and add `.github/FUNDING.yml`.
6. **Season dates expire.** `regs.json`, `species.json` and several `law.json` lines carry 2026
   dates. The re-check calendar from the 7 Oct 2026 pass: 9, 12, 14, 15, 23 and 28 Oct 2026; 1 Nov
   and 1 Dec 2026; 1 and 5 Jan 2027 (the main sweep, when the 2026 executive orders and temporary
   rules lapse); then each FWC and NMFS season announcement through 2027.

## High value

5. **The two ERDDAP overlays.** Sea temperature and Kd490 water clarity failed or took more than 20 s
   on 30 Sep. Try the CoastWatch central node (`coastwatch.noaa.gov/erddap`) or NOAA Coral Reef Watch,
   or drop them.
6. **Wikimedia Commons photos for the spots.** 229 of 283 spots have no media; Commons was unreachable
   from the research tools. `tools/src-2026-09-30/commons-candidates.json` holds 10 files to check.
7. **The 100 ft Biscayne channel dive closure** needs a channel or aids-to-navigation layer for the park.
8. **Buffers statewide, the remainder.** Jetties (75), bridge decks (1,105) and open-coast beaches
   (121 stretches) are now drawn statewide. Still to draw: bay, sound and lagoon beaches; the 173
   single-monument beach stretches and the Keys; pier lengths (only the inventory point is buffered);
   OPEN-QUESTIONS.md questions 33 to 35.
9. **Madeira Beach and Treasure Island lines** at 127th and 128th Avenues need street geometry; St. Pete
   Beach § 94-1 now has a charted "Blind Pass" polygon in ENC named sea areas worth checking against
   the ordinance.
10. **Printable boat sheet, statewide**, regenerated from `regs.json` and `species.json`.

## Worth doing

11. **Offline tiles** for the boat: a low-zoom coastal pack of the NOAA chart.
12. **Sweep app prose against `law.json` automatically.** `tools/test-data.py` now checks law ids; it
    does not yet diff citation text in `regs.json` and popups against the registry.
13. **Split the full offline build** further or lazy-load per region; 15 MB is heavy on LTE.
14. **Trip mode** (launch, date, species → closures that apply). Read the UPL section of the
    publishing plan first.
15. **Bridge ground-truth loop** for the 6,041 presumed-buffered bridges.

## Known debt

- `jurisdiction.json`: the `gom` array repeats all 230 `atl` paths. The app drops the repeats at load;
  fix the file at the source.
- `piers.json`: Fort Pickens pier filed under Santa Rosa (it is Escambia); "Ft. Pierce Jetty Park"
  operator reads "City of Fort Worth".
- `sites.json`: "Ft. Lauderdale, C-1 Reef (Sheridan Express)" depth of 25 ft looks wrong.
- `zones-palmbeach.json` predates the zones schema; migrate it.
- `zones-local.json` cannot be rebuilt from source because its August raw pulls are not kept.
- Existing popup strings still contain em dashes; new strings do not.

## Added 8 Oct 2026 (second review)

- Done later on 8 Oct 2026: `jetties.json` and the `dk`/`sp` bridge fields rebuilt from NOAA ENC and
  Census TIGER, so they left the ODbL group (LICENSE-DATA.md section 2a).
- Retrace the 39 jetty stand-in stretches on NAIP (question 35) and the causeway ends listed in
  question 33; add the spans to `tools/bridges-2026-10-08/decks.txt`.
- Find a deck source for Fort Hamer Road and Crosstown Parkway, the two long bridges no public
  dataset carries (FDOT plans or a NAIP trace).
- Draw the canal gear rules (Pinellas County, Cape Coral, Sanibel, Naples, Collier, Brevard, Satellite
  Beach) from USGS NHD canal flowlines, as `mon26` is drawn.
- Read Melbourne Beach § 40-33 and Cocoa Beach § 5-56 verbatim, the Naples ch. 90-469 canal table and
  Collier § 210-67 Exhibit A in full, and r. 68B-35.004(5).
