# -*- coding: utf-8 -*-
"""Apply the dated legal-review updates to the base citation registry.

build-law.py builds the August 2026 registry (53 entries). This module layers every later review
on top of it, from the JSON sources in tools/law-updates/<date>/. Each source file is an array of
law.json-shaped entries produced by a research pass, carrying an `axes` record of the four-axis
check. Entries whose id already exists in the registry are corrections: if they carry `replaces`,
only those fields change; otherwise every supplied field replaces the old one.

Decisions that a machine cannot make (duplicates between passes, conflicts, prose corrections that
came back as instructions rather than fields) are written out explicitly in MANUAL below, dated,
so the reasoning survives. Edit the sources or MANUAL, never data/law.json.

Order of application:
  1. the 30 Sep 2026 passes (PASSES_2026_09_30), MANUAL and the browser check;
  2. the 6 Oct 2026 release-wording overrides;
  3. every dated pass directory after 2026-10-06 (tools/law-updates/YYYY-MM-DD/), oldest first, in the
     file order given by its pass.json (see dated_passes);
  4. the dash sweep (sweep_dashes), last, so no pass can reintroduce an em or en dash into a title,
     effect, scope or citation label.
"""
import glob
import io
import json
import re
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FIELDS = ["id", "cite", "title", "juris", "kind", "url", "effect", "excerpt", "full",
          "verified", "scope", "note", "geom"]
JURIS = {"federal", "state", "county", "city", "district"}
KINDS = {"statute", "rule", "cfr", "ordinance", "specialact", "negative"}
VER = {"verbatim", "secondary", "unverified"}

# Order matters: later passes win on the same field unless MANUAL says otherwise.
PASSES_2026_09_30 = ["a1-currency", "a2-federal", "a3-uscg-mil", "a4-state", "a5-local", "a6-species",
                     "v1-verify"]

# ids proposed by one pass that duplicate a better-sourced entry from another pass
DROP = {
    # a4 proposed Hobe Sound and Pinellas NWR paragraphs under its own ids while a2 read the same
    # paragraphs verbatim as cfr-50-32-28-g and cfr-50-32-28-m. Keep a2's.
    "cfr-50-32-28-g4": "cfr-50-32-28-g",
    "cfr-50-32-28-m4": "cfr-50-32-28-m",
    # a1 found the Legare Anchorage box through a summarising fetch (secondary); a2 read the same
    # compendium paragraph verbatim as part of bnp-compendium-dive. Keep a2's.
    "bnp-legare": "bnp-compendium-dive",
}


# (pass, id) pairs where an earlier pass's version of a NEW id is kept
SKIP = {
    ("a6-species", "cfr-622-272"): "a2-federal read the same paragraph; its entry is kept",
}


def _append(e, field, text):
    old = e.get(field)
    e[field] = (old + " " + text) if old else text


def manual(reg):
    """Explicit, dated edits. Each one names its source pass."""
    g = reg.get

    # --- a2-federal corrections.json (field-level instructions) -----------------------------
    e = g("cfr-622-183")
    if e:
        e["cite"] = "50 C.F.R. § 622.183(a)(1)(i)"
        e["full"] = ("No person may fish for a South Atlantic snapper-grouper in an MPA, and no person "
                     "may possess a South Atlantic snapper-grouper in an MPA. However, the prohibition on "
                     "possession does not apply to a person aboard a vessel that is in transit with fishing "
                     "gear appropriately stowed as specified in paragraph (a)(1)(ii) of this section. In "
                     "addition to these restrictions, see § 635.21(d)(1)(iii) of this chapter regarding "
                     "restrictions applicable within these MPAs for any vessel issued a permit under part "
                     "635 of this chapter that has longline gear on board.")
        _append(e, "note", "CORRECTED 30 Sep 2026: the quoted sentence sits in (a)(1)(i); (a)(1) is only "
                "the heading. Transit (a)(1)(ii): direct, non-stop progression through the MPA.")
    e = g("cfr-622-34")
    if e:
        e["cite"] = "50 C.F.R. § 622.34(a)(1) to (a)(3)"
        e["excerpt"] = ("Within the Madison and Swanson sites and Steamboat Lumps: Fishing is prohibited "
                        "year-round; possession of Gulf reef fish is prohibited year-round except when such "
                        "possession is on a vessel that has been issued a valid Federal commercial permit for "
                        "Gulf reef fish, has an operating satellite-based VMS unit, and is in transit with "
                        "fishing gear stowed as specified in paragraph (a)(4) of this section; and possession "
                        "of any non-Gulf reef fish species is prohibited year-round, except for such possession "
                        "on a vessel in transit with fishing gear stowed as specified in paragraph (a)(4) of "
                        "this section. Within the Edges during January through April each year, all fishing is "
                        "prohibited and the possession of any fish species is prohibited, except for such "
                        "possession on a vessel in transit with fishing gear appropriately stowed as specified "
                        "in paragraph (a)(4) of this section.")
        _append(e, "note", "CORRECTED 30 Sep 2026: ellipsis-joined excerpt replaced with (a)(2) and (a)(3) "
                "verbatim.")
    e = g("cfr-622-224")
    if e:
        e["cite"] = "50 C.F.R. § 622.224(b)(1), (c)"
        _append(e, "note", "CORRECTED 30 Sep 2026: paragraph (b)(2), the experimental closed area, IS a "
                "snapper-grouper closure for all gear including spear and is now a separate entry, "
                "cfr-622-224-b2. The (b)(1) coordinate table has two printing defects: its opening origin "
                "(80°14′48.06″W) and closing origin (80°14′55.27″W) differ, and point 21 is printed "
                "'79°54″' (read as 79°54′).")
    e = g("cfr-622-410")
    if e:
        _append(e, "note", "§ 622.410(a) cites NOAA chart 11438 for the state-waters edge of Tortugas North; "
                "§ 622.74(b)(1) cites chart 11434. Both texts checked 30 Sep 2026.")
    e = g("cfr-36-7-27")
    if e:
        e["cite"] = "36 C.F.R. § 7.27(b)(2), (b)(4)(ii)"
        _append(e, "excerpt", "Operators of vessels within the park must break down and store all weapons "
                "described in this paragraph so that they are not available for immediate use.")
        _append(e, "note", "CORRECTED 30 Sep 2026: the 'Only the following may be legally taken' half of "
                "the excerpt is paragraph (b)(2). The Research Natural Area is entry cfr-36-7-27-rna.")
    e = g("cfr-36-7-45")
    if e:
        e["cite"] = "36 C.F.R. § 7.45(d)(5), (d)(6)"
        e["excerpt"] = ("Except for taking finfish, shrimp, bait, crabs, and oysters, as provided in this "
                        "section or as modified under 36 CFR 1.5, the taking, possession, or disturbance of any "
                        "fresh or saltwater aquatic life is prohibited. [(d)(5)] Except as provided in this "
                        "section, only a closely attended hook and line may be used for fishing activities "
                        "within the park. [(d)(6)]")
        _append(e, "note", "CORRECTED 30 Sep 2026: the old excerpt paraphrased (d)(5) and attributed it to "
                "(d)(6). Closed waters: (d)(3)(i) Royal Palm and (d)(3)(ii) Shark Valley. The 2026 "
                "compendium (secondary) adds no fishing at Flamingo and Gulf Coast marinas and ramps, "
                "Mrazek Pond and Eco Pond.")
    e = g("bnp-status")
    if e:
        _append(e, "note", "30 Sep 2026: the Superintendent's Compendium (approved 17 Sep 2025) also closes "
                "swimming, wading, snorkeling and underwater diving within 100 feet of all marked "
                "navigational channels, in Boca Chita Key, Elliott Key and Convoy Point harbors, and at the "
                "harbor mouths, plus the Legare Anchorage box (entry bnp-compendium-dive). State rule "
                "68B-7.008 adds lobster reef closures and a seasonal bonefish closure (entries "
                "fac-68b-7-008-1, fac-68b-7-008-5).")

    # --- a3-uscg-mil proposed changes to the general entries --------------------------------
    e = g("cfr-33-334")
    if e:
        e["effect"] = ("42 Florida danger zones and restricted areas (§§ 334.500 to 334.780). Each one that "
                       "matters to a diver has its own entry and its own drawn zone; read that entry.")
        _append(e, "note", "CORRECTED 30 Sep 2026: the count is 42, not 38. § 334.580 off Port Everglades "
                "bans anchoring and attaching anything to the bottom, not diving or passage.")
    e = g("cfr-33-165-785")
    if e:
        e["url"] = ("https://www.ecfr.gov/current/title-33/chapter-I/subchapter-P/part-165/subpart-F/"
                    "section-165.785")
        _append(e, "note", "History: USCG-2025-0319, 90 FR 42814, effective 5 Sep 2025. The printed East "
                "zone Point 2 reads 80°20′9″W, a typo for 80°02′09″W; the map uses 80°02′09″W.")
    e = g("cfr-33-165-760")
    if e:
        _append(e, "note", "30 Sep 2026: § 165.760 has coordinate-bounded fixed zones only at Miami and Port "
                "Everglades; Palm Beach has moving zones and zones around moored vessels. Kennedy Space "
                "Center (§ 165.701) and the Jacksonville, Fernandina and Canaveral moving zones (§ 165.759) "
                "have their own entries.")

    # --- a4-state ---------------------------------------------------------------------------
    e = g("fac-68c-22")
    if e:
        e["effect"] = ("Mostly vessel-speed zones, but the No Entry zones bar swimmers and divers too: "
                       "see fac-68c-22-002-11.")
    e = g("cfr-50-17-108")
    if e:
        _append(e, "note", "30 Sep 2026: § 17.108(a) names 11 manatee sanctuaries where all waterborne "
                "activity is prohibited 15 Nov to 31 Mar, not only Three Sisters: see cfr-50-17-108-a.")

    # --- a5-local ---------------------------------------------------------------------------
    e = g("neg-misc")
    if e:
        _append(e, "note", "UPDATED 30 Sep 2026: Miami Beach is no longer a probable negative; its code "
                "restricts spear fishing at bridges, the 29th to 33rd Street jetty area and swim areas "
                "(miamibeach-82-441). Lee County ch. 30 still has no rule, but Lee County park waters "
                "(beaches, piers and adjacent littoral waters) ban spears at all times (lee-20-25). Key "
                "West, Cape Coral, Fort Lauderdale, Destin, Escambia and Indian River re-checked 30 Sep "
                "2026 by whole-code search.")
    e = g("kcb-5-11")
    if e:
        _append(e, "note", "See also kcb-12-9 (no swimming or snorkeling from city park property).")

    # --- a1 vs a4 conflict ------------------------------------------------------------------
    e = g("neg-uap")
    if e and "San Pedro" not in (e.get("note") or ""):
        _append(e, "note", "EXCEPTION: San Pedro Underwater Archaeological Preserve lies inside a state "
                "park, so it is closed to spearfishing by r. 62D-2.014(9)(d) and r. 68B-20.003(2)(e).")


def load_pass(path):
    p = json.load(io.open(path, encoding="utf-8"))
    if isinstance(p, dict):
        p = p.get("entries") or p.get("proposed") or []
    return p


def apply(L, date="2026-09-30"):
    reg = {e["id"]: e for e in L}
    order = [e["id"] for e in L]
    src = os.path.join(HERE, "law-updates", date)
    audit = []
    for name in PASSES_2026_09_30:
        for e in load_pass(os.path.join(src, name + ".json")):
            i = e["id"]
            if (name, i) in SKIP:
                audit.append((name, i, "skipped: " + SKIP[(name, i)]))
                continue
            if i in DROP:
                audit.append((name, i, "dropped, duplicate of " + DROP[i]))
                continue
            if i in reg:
                cur = reg[i]
                fields = e.get("replaces") or [f for f in FIELDS if f in e and f != "id"]
                for f in fields:
                    if f == "note" and cur.get("note") and e.get("note") and e["note"] not in cur["note"]:
                        cur["note"] = cur["note"] + " " + e["note"]
                    elif f in e:
                        cur[f] = e[f]
                audit.append((name, i, "updated " + ",".join(fields)))
            else:
                n = {f: e.get(f) for f in FIELDS}
                reg[i] = n
                order.append(i)
                audit.append((name, i, "added"))
    manual(reg)
    browser_check(reg, os.path.join(src, "browser-check.json"))
    release_wording(reg, audit)
    dated_passes(reg, order, audit)
    sweep_dashes(reg)
    out = [reg[i] for i in order if i in reg]
    # validation
    for e in out:
        assert e.get("juris") in JURIS, (e["id"], e.get("juris"))
        assert e.get("kind") in KINDS, (e["id"], e.get("kind"))
        if e.get("verified") not in VER:
            e["verified"] = "unverified"
        if not e.get("excerpt"):
            # The rule's text has not been read word for word (image-only PDF, unread FR notice).
            # Say so in the excerpt field rather than leave it blank; never downgrade silently.
            e["excerpt"] = "[Operative text not yet read from the primary source. The effect line comes from the source named in the note.]"
            if e.get("verified") == "verbatim":
                e["verified"] = "secondary"
        for f in ("cite", "title", "url", "effect", "excerpt"):
            assert e.get(f), (e["id"], "missing " + f)
    ids = [e["id"] for e in out]
    assert len(ids) == len(set(ids)), "duplicate ids"
    return out, audit


def _sub(e, field, old, new):
    if e and e.get(field) and old in e[field]:
        e[field] = e[field].replace(old, new)


def browser_check(reg, path):
    """Apply the 30 Sep 2026 browser pass: every excerpt was string-matched against the page text at
    the primary host (eCFR renderer API, Online Sunshine, Cornell LII for FAC rules, rendered
    Municode and American Legal pages, federalregister.gov). Results are in browser-check.json."""
    if not os.path.exists(path):
        return
    res = {r["id"]: r for r in json.load(io.open(path, encoding="utf-8"))}
    for i, r in res.items():
        e = reg.get(i)
        if not e:
            continue
        cls = r.get("class")
        st = r.get("status")
        if r.get("corrected_url"):
            e["url"] = r["corrected_url"]
        if cls in ("real", "typo") and r.get("corrected_excerpt"):
            e["excerpt"] = r["corrected_excerpt"]
            _append(e, "note", "CORRECTED 30 Sep 2026 by browser word-for-word check: the previous excerpt "
                    + ("paraphrased the rule." if cls == "real" else "carried a one-word typo."))
        elif cls == "minor-unmarked-omission":
            _append(e, "note", "Browser check 30 Sep 2026: verbatim except one short clause omitted without "
                    "an ellipsis (" + (r.get("diagnosis") or "")[:200] + ").")
        elif cls == "unverifiable-on-mirror":
            e["verified"] = "secondary"
            _append(e, "note", "Browser check 30 Sep 2026: the only readable copy of this rule predates the "
                    "subsection quoted, so the text could not be matched. Read the flrules.org .doc or the "
                    "Florida Administrative Register notice before relying on the exact words.")
        elif st == "confirmed" and cls not in ("stale-law",):
            _append(e, "note", "Browser check 30 Sep 2026: excerpt matched word for word at the source.")
        elif cls == "trivial":
            _append(e, "note", "Browser check 30 Sep 2026: matched apart from paragraph labels or typography.")

    # stale prose found during the review
    e = reg.get("fac-68c-22")
    if e:
        e["note"] = ("Most zones are boat-operation constraints, but zones designated No Entry bar all persons, "
                     "swimming, diving, wading or fishing (r. 68C-22.002(11), entry fac-68c-22-002-11). The federal "
                     "manatee rule separately closes 11 sanctuaries to all waterborne activity 15 Nov to 31 Mar "
                     "(cfr-50-17-108-a) and bans scuba and spear fishing at Three Sisters Springs. Checked 29 Sep "
                     "2026: r. 68C-22.011 amended effective 27 Apr 2025; r. 68C-22.007 (Indian River County) "
                     "amended effective 30 Jun 2026.")
    _sub(reg.get("neg-misc"), "note", "Miami Beach is a PROBABLE negative — the well-publicized South Beach "
         "snook-spearing case was charged entirely under state law with no city code count. ", "")
    _sub(reg.get("cfr-50-32-28"), "note", "UNVERIFIED: the precise status of spearfishing in Key West NWR and "
         "Great White Heron NWR waters. In practice they are treated as open to FWC-regulated fishing and are "
         "separately regulated as FKNMS Existing Management Areas. Resolve against each refuge's own regs and "
         "50 C.F.R. pt. 26 before relying on this. ", "Key West and Great White Heron NWR: see cfr-50-27-21. ")
    _sub(reg.get("fs-379-354"), "note", "The free SHORELINE licence is 'not valid when fishing from a vessel'. "
         "Whether it covers a shore-entry diver is UNVERIFIED — treat yourself as needing the full licence. ", "")
    _sub(reg.get("fac-68b-14-009"), "note", "CURRENCY WARNING: this rule is amended effective 1 September 2026. "
         "Re-verify the species list after that date. ", "")
    e = reg.get("guis-compendium")
    if e:
        e["title"] = ("Gulf Islands NS: the 2021 compendium banned projectile fishing gear; the current "
                      "compendium does not repeat it")
        e["effect"] = ("The 2021 compendium banned spear guns, pole spears and Hawaiian slings in all Seashore "
                       "waters. The compendium updated 1 Sep 2026 contains no such provision and the park's fishing "
                       "page now refers spearfishing questions to FWC. Whether the ban was rescinded or lost in a "
                       "page migration is unconfirmed: call the park (850-934-2600) before spearing inside the "
                       "Seashore boundary.")
        e["verified"] = "secondary"
        e["scope"] = ("Water boundary, verbatim from the NPS 'Fishing in Florida' page: In the Perdido Key, Fort "
                      "Pickens, and Santa Rosa Areas the national seashore boundary extends on the north to the Gulf "
                      "Intracoastal Waterway and on the south one mile from the low tide line of the island. At "
                      "Naval Live Oaks the national seashore boundary extends 100 yards from the low tide line.")
        _append(e, "note", "BROWSER CHECK 30 Sep 2026: all 151,606 characters of the expanded current compendium "
                "(last updated 1 Sep 2026) were searched; there is no spear, speargun, Hawaiian sling or projectile "
                "provision. The quoted sentence survives only in the 1 Mar 2021 news release.")
    e = reg.get("marathon-canal")
    if e:
        e["title"] = "Marathon speargun ban in manmade canals (superseded entry: see marathon-18-27)"
        _append(e, "note", "SUPERSEDED 30 Sep 2026: the section is City of Marathon Code § 18-27, read verbatim on "
                "the city's own code site (entry marathon-18-27).")
    e = reg.get("neg-species-gear")
    if e and not e["excerpt"].startswith("["):
        e["excerpt"] = "[" + e["excerpt"].rstrip(".") + ".]"


DASH = re.compile(r"\s*\u2014\s*")


def release_wording(reg, audit):
    """6 Oct 2026 release pass (tools/law-updates/2026-10-06/release-wording.json).

    Titles and effects written in the registry's own voice say what the law closes or restricts, never
    that water or gear is lawful. Excerpts, full text and notes (which quote the law) are untouched,
    except where a note override is listed explicitly. The dash clean-up that used to run here is now
    sweep_dashes(), called after the later dated passes.
    """
    p = os.path.join(HERE, "law-updates", "2026-10-06", "release-wording.json")
    for i, fields in json.load(io.open(p, encoding="utf-8"))["entries"].items():
        if i in reg:
            reg[i].update(fields)
            audit.append(("release-wording", i, "updated " + ",".join(fields)))


def sweep_dashes(reg):
    """Em dashes become colons and en dashes in ranges become "to" in the title, effect, scope and cite
    fields. Run last, after every pass. Excerpts, full text and notes quote the law and are untouched."""
    for e in reg.values():
        for f in ("title", "effect", "scope", "cite"):
            v = e.get(f)
            if v and re.search("[\u2013\u2014]", v):
                v = DASH.sub(": ", v)
                v = re.sub(r"(?<=\S)\u2013(?=\S)", " to ", v)
                v = v.replace(" \u2013 ", " to ")
                e[f] = v


DATED = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def dated_passes(reg, order, audit, after="2026-10-06"):
    """Apply every pass directory tools/law-updates/YYYY-MM-DD/ dated after `after`, oldest first.

    Each directory holds law.json-shaped entry files and a pass.json whose "order" lists them (without
    .json); without pass.json the files are applied in name order. A new id is added whole and must carry
    every required field. For an existing id, each field in "replaces" (or, if "replaces" is absent, each
    supplied field not listed in "append") replaces the old value, and each field in "append" is added to
    the end of the old value unless it is already there. Other keys ("axes", "src") are records of the
    research and are not copied. Audit lines are tagged "<date>/<file>".
    """
    base = os.path.join(HERE, "law-updates")
    for d in sorted(x for x in os.listdir(base) if DATED.match(x) and x > after):
        folder = os.path.join(base, d)
        man = os.path.join(folder, "pass.json")
        if os.path.exists(man):
            names = json.load(io.open(man, encoding="utf-8"))["order"]
        else:
            names = sorted(os.path.splitext(os.path.basename(f))[0]
                           for f in glob.glob(os.path.join(folder, "*.json")))
        for name in names:
            tag = d + "/" + name
            for e in load_pass(os.path.join(folder, name + ".json")):
                i = e["id"]
                app = [f for f in (e.get("append") or []) if f in FIELDS]
                if i in reg:
                    cur = reg[i]
                    rep = e.get("replaces") or [f for f in FIELDS if f in e and f != "id" and f not in app]
                    for f in rep:
                        cur[f] = e.get(f)
                    for f in app:
                        if e.get(f) and e[f] not in (cur.get(f) or ""):
                            _append(cur, f, e[f])
                    audit.append((tag, i, "updated " + ",".join(rep) +
                                  ((" appended " + ",".join(app)) if app else "")))
                else:
                    missing = [f for f in ("cite", "title", "juris", "kind", "url", "effect", "excerpt",
                                           "verified") if not e.get(f)]
                    assert not missing, (tag, i, "new entry missing " + ",".join(missing))
                    reg[i] = {f: e.get(f) for f in FIELDS}
                    order.append(i)
                    audit.append((tag, i, "added"))
