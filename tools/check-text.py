#!/usr/bin/env python3
"""Check the map's own text against two release rules.

1. No em or en dashes in visible text: the HTML pages and every string in data/*.json, except the
   fields that quote the law (law.json excerpt, full and note).
2. No permissive wording in the map's own voice: phrases that say water or gear is lawful, legal,
   allowed or open for spearing. Quoted law is exempt for the same reason as above.

Exit status 1 lists every hit as file, field and a short excerpt.
"""
import glob
import io
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
DASH = re.compile("[–—]")
PERMISSIVE = re.compile(
    r"\b(spear(ing|fishing)?|spearguns?|gig(ging)?)\s+(is\s+|are\s+)?(allowed|legal|lawful|permitted|ok)\b"
    r"|\blegal gear\b|\bIS legal\b|\bopen to spear(ing|fishing)\b|\bmay spear\b|\byou may (spear|dive)\b",
    re.I)
QUOTED = {("law.json", "excerpt"), ("law.json", "full"), ("law.json", "note")}

hits = []


def walk(fname, obj, key=None):
    if isinstance(obj, dict):
        for k, v in obj.items():
            walk(fname, v, k)
    elif isinstance(obj, list):
        for v in obj:
            walk(fname, v, key)
    elif isinstance(obj, str):
        if (fname, key) in QUOTED or key in ("url", "href", "u", "thumb"):
            return
        for rx, why in ((DASH, "dash"), (PERMISSIVE, "permissive")):
            m = rx.search(obj)
            if m:
                a = max(0, m.start() - 40)
                hits.append("%s [%s] %s: ...%s..." % (fname, key, why, obj[a:m.end() + 40].replace("\n", " ")))


for p in sorted(glob.glob(os.path.join(ROOT, "data", "*.json"))):
    walk(os.path.basename(p), json.load(io.open(p, encoding="utf-8")))

for page in ("index.html", "about.html", "questions.html", "404.html"):
    for n, line in enumerate(io.open(os.path.join(ROOT, page), encoding="utf-8"), 1):
        if DASH.search(line):
            hits.append("%s:%d dash" % (page, n))
        if PERMISSIVE.search(line):
            hits.append("%s:%d permissive" % (page, n))

if hits:
    print("\n".join(hits[:200]))
    print("%d problem(s)" % len(hits))
    sys.exit(1)
print("map text checks passed")
