# -*- coding: utf-8 -*-
"""Statewide sweep of 11 Nov 2026: bring data/regs.json and data/species.json in line with the
registry pass in tools/law-updates/2026-11-11/.

Every change below is a literal replacement or an append, keyed by item title or species id, and
names the registry entry it rests on. The script is idempotent: a change whose new text is already
present is skipped, and a replacement whose old text is missing stops the run, so silent drift is
impossible. Never touches law ids that are not in data/law.json (tools/test-data.py checks).
"""
import io, json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RP = os.path.join(ROOT, "data", "regs.json")
SP = os.path.join(ROOT, "data", "species.json")
R = json.load(io.open(RP, encoding="utf-8"))
S = json.load(io.open(SP, encoding="utf-8"))
done = []


def sub(text, old, new, where):
    if new in text:
        return text
    if old not in text:
        sys.exit("%s: expected text not found: %r" % (where, old[:80]))
    done.append(where)
    return text.replace(old, new)


def app(text, new, where):
    if new.strip() in text:
        return text
    done.append(where)
    return text.rstrip() + " " + new


def item(sec, title):
    for it in R[sec]:
        if it[0] == title:
            return it
    sys.exit("regs.json: no item %r in %s" % (title, sec))


def upd(sec, title, fn):
    it = item(sec, title)
    it[1] = fn(it[1], "regs %s/%s" % (sec, title))



def spf(sid, region, field, fn):
    for s in S["species"]:
        if s["id"] == sid:
            v = s["regions"][region]
            v[field] = fn(v.get(field) or "", "species %s/%s/%s" % (sid, region, field))
            s["checked"] = "2026-11-11"
            return
    sys.exit("species.json: no species %r" % sid)


def setf(sid, region, field, new):
    spf(sid, region, field, lambda t, w: t if t == new else (done.append(w) or new))


# r. 68B-14.0036(2)(b)1., effective 28 Oct 2026 (fac-68b-14-0036, read 11 Nov 2026)
ST = ("1 gag or black grouper per person per day; no more than 2 gag or black grouper in any combination "
      "aboard any vessel at any time, charters included (r. 68B-14.0036(2)(b)1., from 28 Oct 2026)")
FED = ("Private vessel: 2 gag and black grouper combined per day. Charter or headboat: 2 combined per trip "
       "(622.187(b)(2)(i)(A), (B), from 28 Oct 2026)")
for sid in ("gag", "black-grouper"):
    setf(sid, "atlantic", "vessel", ST)
    setf(sid, "keys", "vessel", ST)
    setf(sid, "eez_sa", "vessel", FED)


spf("lane-snapper", "gulf", "notes", lambda t, w: sub(t, "Rule text of the 2026 version not read.",
    "Rule text read 11 Nov 2026: r. 68B-14.0036(1)(e), 20 per day in Gulf state waters, outside the snapper aggregate.", w))

# regs.json seasons item for gag
for it in R["seasons"]:
    if "From 28 Oct 2026</b> the South Atlantic federal private vessel limit" in it[1]:
        it[1] = sub(it[1], "FWC proposed the same change for Atlantic state waters on 5 Oct 2026 (not in force).",
                    "<b>Atlantic state waters and all of Monroe, from 28 Oct 2026: 1 gag or black grouper per person, and no more than 2 gag or black grouper combined aboard any vessel at any time</b>, charters included (r. 68B-14.0036(2)(b)1.).",
                    "regs seasons/gag")

S["version"] = "2026-11-11"
io.open(SP, "w", encoding="utf-8").write(json.dumps(S, ensure_ascii=False, separators=(",", ":")))
io.open(RP, "w", encoding="utf-8").write(json.dumps(R, ensure_ascii=False, indent=1))
print("changed:", len(done)); [print(" ", d) for d in done]
