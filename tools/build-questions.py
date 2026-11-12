#!/usr/bin/env python3
"""Build questions.html, the public "Open questions" page, from the map data.

Two parts:
  1. The questions that need a person, from data/questions.json (hand-maintained; numbers match
     OPEN-QUESTIONS.md so references in the data and the research notes still line up).
  2. Every flagged map feature in data/zones-local.json and data/zones-statewide.json, grouped by
     layer, with its flag text and a link that opens the map on it (./?zone=<id>).

Citation chips link to ./?law=<id>, which opens the legal encyclopedia at that entry. A law id that
is not in data/law.json stops the build, so the page can never point at a citation that does not
exist. Run after tools/build-law.py and the zone builders:

    python3 tools/build-questions.py
"""
import html
import io
import json
import os
import sys
import urllib.parse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def load(name):
    return json.load(io.open(os.path.join(ROOT, "data", name + ".json"), encoding="utf-8"))


Q = load("questions")
LAW = {e["id"]: e for e in load("law")["entries"]}
ZONES = {}
for f in ("zones-local", "zones-statewide"):
    d = load(f)
    for z in (d.get("zones", d) if isinstance(d, dict) else d):
        ZONES[z["id"]] = (z, f)

bad = []
for q in Q["questions"]:
    bad += ["q%s law %s" % (q["n"], i) for i in q["law"] if i not in LAW]
    bad += ["q%s zone %s" % (q["n"], i) for i in q["zones"] if i not in ZONES]
if bad:
    sys.exit("questions.json points at ids that do not exist:\n  " + "\n  ".join(bad))

E = html.escape
STATUS = {"needs-person": "Needs a person", "partly": "Partly answered",
          "needs-source": "Needs a source read", "needs-geometry": "Needs a map source"}
CAT = {"local": "Local ordinances", "fed": "National parks and federal zones",
       "fedfish": "Federal fishery areas", "mil": "Coast Guard and military zones",
       "nwr": "National wildlife refuges", "stateareas": "State rule areas",
       "manatee": "Manatee zones"}
ISSUE = "https://github.com/Rowow1/hardbottom/issues/new?"


def law_chip(i):
    return '<a class="chip" href="./?law=%s">%s</a>' % (urllib.parse.quote(i), E(LAW[i]["cite"]))


def zone_link(i):
    z, _ = ZONES[i]
    return '<a class="maplink" href="./?zone=%s">%s</a>' % (urllib.parse.quote(i), E(z["n"]))


def issue_link(title, body):
    return ISSUE + urllib.parse.urlencode({"title": title, "body": body})


cards = []
for q in Q["questions"]:
    st = q["status"]
    body = ("Question %s: %s\n\nThe answer (who said it, and when):\n\n\nWhere it came from "
            "(a link, a document, or the office and the name of the person):\n" % (q["n"], q["title"]))
    parts = [
        '<article class="q" data-status="%s" data-region="%s" id="q%s">' % (E(st), E(q["region"]), q["n"]),
        '<div class="qhead"><span class="qn">Q%s</span><span class="badge %s">%s</span>'
        '<span class="reg">%s</span></div>' % (q["n"], E(st), E(STATUS[st]), E(q["region"])),
        "<h3>%s</h3>" % E(q["title"]),
        "<p>%s</p>" % E(q["why"]),
        '<p class="ask"><b>Question to put:</b> %s</p>' % E(q["q"]),
        '<p class="who"><b>Who can answer:</b> %s%s</p>' % (
            E(q["ask"]), (". " + E(q["contact"])) if q.get("contact") else ""),
    ]
    if q["zones"]:
        parts.append('<p class="links"><b>On the map:</b> %s</p>' % ", ".join(zone_link(i) for i in q["zones"]))
    if q["law"]:
        parts.append('<p class="links"><b>Law:</b> %s</p>' % " ".join(law_chip(i) for i in q["law"]))
    parts.append('<p class="answer"><a href="%s" target="_blank" rel="noopener">Know the answer? Send it</a></p>'
                 % E(issue_link("Answer to open question Q%s" % q["n"], body)))
    parts.append("</article>")
    cards.append("\n".join(parts))

groups = {}
for zid, (z, f) in ZONES.items():
    if z.get("flag"):
        groups.setdefault(z.get("cat") or "local", []).append(z)
flag_html = []
nflag = 0
for cat in ["local", "stateareas", "fed", "nwr", "fedfish", "mil", "manatee"]:
    zs = sorted(groups.get(cat, []), key=lambda z: z["n"])
    if not zs:
        continue
    nflag += len(zs)
    items = []
    for z in zs:
        items.append('<li><a class="maplink" href="./?zone=%s">%s</a><span class="fk">%s</span><br><span class="ft">%s</span></li>'
                     % (urllib.parse.quote(z["id"]), E(z["n"]), E({"closed": "drawn closed", "warn": "drawn amber",
                        "open": "drawn open", "line": "drawn as a line"}.get(z.get("kind"), "")), E(z["flag"])))
    flag_html.append('<details><summary>%s (%d)</summary><ul class="flags">%s</ul></details>'
                     % (E(CAT.get(cat, cat)), len(zs), "\n".join(items)))

regions = sorted({q["region"] for q in Q["questions"]})
counts = {s: sum(1 for q in Q["questions"] if q["status"] == s) for s in STATUS}

PAGE = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Open questions | Bottom Truth</title>
<meta name="description" content="Questions about Florida spearfishing rules that public sources cannot settle, who can answer each one, and where it shows on the map.">
<link rel="canonical" href="https://bottomtruth.com/questions.html">
<meta name="theme-color" content="#0b0e13">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<style>
:root{--bg:#0b0e13;--panel:#141920;--line:#2a3139;--txt:#e6edf3;--dim:#94a3b1;--acc:#5aa9e6;--warn:#facc15;--red:#f87171;--grn:#4ade80}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:820px;margin:0 auto;padding:28px 16px 64px}
a{color:var(--acc)}
h1{font-size:28px;margin:0 0 4px}
h1+p{color:var(--dim);margin-top:0}
h2{font-size:19px;margin:34px 0 8px;border-top:1px solid var(--line);padding-top:22px}
.notice{background:var(--panel);border:1px solid var(--warn);border-radius:8px;padding:14px 16px;margin:20px 0}
.notice b{color:var(--warn)}
.back{display:inline-block;margin-bottom:18px}
.filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:16px 0}
.filters select{background:var(--panel);color:var(--txt);border:1px solid var(--line);border-radius:6px;padding:6px 8px;font:inherit}
.q{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin:12px 0}
.q h3{font-size:17px;margin:6px 0 8px;line-height:1.35}
.q p{margin:6px 0}
.qhead{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13px}
.qn{font-weight:700;color:var(--dim)}
.badge{border:1px solid currentColor;border-radius:999px;padding:1px 8px;font-weight:600}
.badge.needs-person{color:var(--red)}
.badge.partly{color:var(--warn)}
.badge.needs-source,.badge.needs-geometry{color:var(--acc)}
.reg{color:var(--dim)}
.chip{display:inline-block;font-size:13px;border:1px solid var(--line);border-radius:6px;padding:1px 7px;margin:2px 2px 2px 0;text-decoration:none}
.chip:hover,.maplink:hover{text-decoration:underline}
.answer a{font-weight:600}
details{background:var(--panel);border:1px solid var(--line);border-radius:8px;margin:8px 0;padding:6px 14px}
summary{cursor:pointer;font-weight:600;padding:4px 0}
ul.flags{padding-left:18px;font-size:14px}
ul.flags li{margin:10px 0}
.fk{color:var(--dim);font-size:12px;margin-left:8px}
.ft{color:var(--dim)}
footer{color:var(--dim);font-size:13px;margin-top:40px;border-top:1px solid var(--line);padding-top:16px}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#f7f8fa;--panel:#fff;--line:#d5dbe1;--txt:#14181d;--dim:#55606b;--acc:#0b63a8;--warn:#8a6200;--red:#b42318;--grn:#1f7a3d}}
</style>
</head><body><main>
<a class="back" href="./">&larr; Back to the map</a>
<h1>Open questions</h1>
<p>What the map cannot settle from public text, and who can.</p>

<div class="notice" role="note">
<p><b>Not legal advice. Not official. Not for navigation.</b></p>
<p>%(intro)s Posted signs on site control over anything here. An answer sent in is checked
against a primary source or the office that gave it before the map changes.</p>
</div>

<p>%(nq)d questions: %(np)d need a person, %(npa)d are partly answered. Last updated %(ver)s.</p>

<div class="filters" role="group" aria-label="Filter the questions">
<label>Region <select id="fr"><option value="">All</option>%(ropts)s</select></label>
<label>Status <select id="fs"><option value="">All</option>%(sopts)s</select></label>
</div>

<h2>Questions that need an answer</h2>
<p>Each card says why the question matters on the map, the question to put, and who can answer it.
A phone number appears only where it was read from that office's own published page.</p>
%(cards)s

<h2>Map features drawn with a known gap (%(nflag)d)</h2>
<p>These features carry a warning mark and a dashed outline on the map. Each note says how the drawing
differs from the law and which reading was drawn. Most can only be fixed with a boundary that no public
dataset carries yet.</p>
%(flags)s

<h2>Status terms</h2>
<ul>%(sdefs)s</ul>

<footer>Generated from <code>data/questions.json</code> and the zone files by
<code>tools/build-questions.py</code>. The full working list, with the research history behind each
question, is <a href="https://github.com/Rowow1/hardbottom/blob/main/OPEN-QUESTIONS.md">OPEN-QUESTIONS.md</a>.</footer>
</main>
<script>
(function(){
  var fr=document.getElementById('fr'),fs=document.getElementById('fs');
  function apply(){
    var r=fr.value,s=fs.value;
    document.querySelectorAll('article.q').forEach(function(a){
      a.hidden=!!((r&&a.dataset.region!==r)||(s&&a.dataset.status!==s));
    });
  }
  fr.onchange=apply; fs.onchange=apply;
})();
</script>
</body></html>
"""

out = PAGE % {
    "intro": E(Q["intro"]),
    "nq": len(Q["questions"]), "np": counts["needs-person"], "npa": counts["partly"],
    "ver": E(Q["version"]),
    "ropts": "".join('<option>%s</option>' % E(r) for r in regions),
    "sopts": "".join('<option value="%s">%s</option>' % (k, E(v)) for k, v in STATUS.items() if counts[k]),
    "cards": "\n".join(cards),
    "nflag": nflag,
    "flags": "\n".join(flag_html),
    "sdefs": "".join("<li><b>%s.</b> %s</li>" % (E(STATUS[k]), E(v)) for k, v in Q["status_def"].items()),
}
io.open(os.path.join(ROOT, "questions.html"), "w", encoding="utf-8").write(out)
print("questions.html: %d questions, %d flagged features" % (len(Q["questions"]), nflag))
