# -*- coding: utf-8 -*-
"""Zones from the statewide sweep of 11 and 12 Nov 2026. Run after the earlier dated zone patches;
idempotent (a zone whose id already exists is replaced, a citation already listed is not added twice).

Geometry, all pulled or read in the author's Chrome on 12 Nov 2026 (no OpenStreetMap input):
  tools/law-updates/2026-11-11/geom/pulled.txt
      NPR, SEM  US Census TIGERweb incorporated places 'New Port Richey city' (GEOID 1248500) and
                'Seminole city' (GEOID 1264975), MapServer/4, outer rings only (enclave holes are
                filled, which closes more water), Douglas-Peucker 0.00006 degree, parcels under
                0.0000002 square degree dropped. Encoding as in 2026-10-07: parts separated by '|',
                first pair absolute and later pairs deltas, x = lon and y = lat in 1e-5 degree; the
                two places are separated by '#'. Transfer checked by length and a rolling hash.
  Riviera Beach, Phil Foster Park and Blue Heron Bridge positions below were read off USGS National
  Map imagery (USGSImageryOnly, public domain) at zoom 16 and checked against Esri World Imagery at
  zoom 17; the two agree to within about 10 m, which the 125 per cent margin absorbs.
  Marker positions (Phil Foster Park, Peanut Island, Haulover Park, Crandon Park, St. Marks) were
  placed on the same imagery and are markers, not boundaries.

Distances stated in an ordinance are drawn at 125 per cent, the margin the statewide buffers use.
"""
import io, json, math, os
from shapely.geometry import LineString, Polygon, box
from shapely.ops import unary_union
from pyproj import Transformer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
G = os.path.join(ROOT, "tools", "law-updates", "2026-11-11", "geom")
SP = os.path.join(ROOT, "data", "zones-statewide.json")
FT = 0.3048
fwd = Transformer.from_crs("EPSG:4326", "EPSG:3086", always_xy=True).transform
inv = Transformer.from_crs("EPSG:3086", "EPSG:4326", always_xy=True).transform
LAW = {e["id"] for e in json.load(io.open(os.path.join(ROOT, "data", "law.json"), encoding="utf-8"))["entries"]}


def dec(s):
    out = []
    for part in s.split("|"):
        pts, a, o = [], 0, 0
        for k, p in enumerate(part.split(";")):
            x, y = map(int, p.split(","))
            a, o = (x, y) if k == 0 else (a + x, o + y)
            pts.append([round(o / 1e5, 5), round(a / 1e5, 5)])
        if pts[0] != pts[-1]:
            pts.append(pts[0])
        out.append(pts)
    return out


def proj(latlons):
    return [fwd(lo, la) for la, lo in latlons]


def rings_ll(geom, tol=0.5):
    geom = geom.simplify(tol) if tol else geom
    polys = [geom] if geom.geom_type == "Polygon" else list(geom.geoms)
    out = []
    for p in polys:
        r = [[round(y, 5), round(x, 5)] for x, y in (inv(*c) for c in p.exterior.coords)]
        if r[0] != r[-1]:
            r.append(r[0])
        out.append(r)
    return out


data = {}
for ln in io.open(os.path.join(G, "pulled.txt"), encoding="utf-8").read().split("\n"):
    if ln.startswith("DATA\t") and not data:   # the first DATA line; later lines belong to later patches
        npr, sem = ln[5:].split("#")
        for k, v in (("NPR", npr), ("SEM", sem)):
            # simplification left a few rings touching themselves; buffer(0) repairs them without
            # moving any edge, and enclaves stay filled because only exterior rings are kept
            fixed = unary_union([Polygon(proj(r)).buffer(0) for r in dec(v)])
            data[k] = rings_ll(fixed, tol=0)

# Riviera Beach, Code § 13-31(a)(2): Lake Worth north of SR 703 and Phil Foster Park, east to the Singer
# Island shore, west to a line 1,000 ft west of that shore, north to a line 1,000 ft north of SR 703.
SINGER_LON = -80.03980          # Singer Island west shore by the causeway (26.78363, -80.03982 and 26.78618, -80.03976)
SR703_LAT = 26.78350            # SR 703 causeway centre line east of the bridge
d = 1000 * FT * 1.25
x0, y0 = fwd(SINGER_LON, SR703_LAT)
area2 = box(x0 - d, y0, x0 + 15, y0 + d)          # 15 m past the shore line to take in its docks
# Within 150 ft of the southern shoreline of Phil Foster Memorial Park (the beach south of the causeway)
beach = LineString(proj([[26.78330, -80.04403], [26.78330, -80.04077]])).buffer(150 * FT * 1.25)
# § 13-31(a)(3): within 75 ft of any dock, wharf or bridge; only the Blue Heron Bridge is drawn
bridge = LineString(proj([[26.78328, -80.04954], [26.78349, -80.04219]])).buffer(75 * FT * 1.25)
riviera = unary_union([area2, beach, bridge])

E = lambda s: s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
Z = []
Z.append(dict(
    id="loc-nprichey", n="New Port Richey: underwater spear gun discharge banned citywide", law=["newportrichey-14-3"],
    cat="local", kind="closed", r=data["NPR"], line=[], pts=[], active=None,
    s="<b>Discharging an underwater spear gun anywhere in the City of New Port Richey is unlawful, except on a range the police department designates.</b> No range may be in a residential zone.",
    src="Boundary: US Census TIGERweb incorporated place 'New Port Richey city' (GEOID 1248500), outer rings only.",
    flag="The ordinance applies citywide and names no water boundary. The whole incorporated area is drawn, which over-states the closure on land; enclaves inside the city outline are drawn closed too, which closes more water than the city limits do. The city's water is mainly the tidal Pithlachascotee River. No designated range was found."))
Z.append(dict(
    id="loc-seminole", n="Seminole: spring, gas or air weapon shooting banned citywide, spearfishing excepted only where designated",
    law=["seminole-38-2"], cat="local", kind="closed", r=data["SEM"], line=[], pts=[], active=None,
    s="<b>Shooting at any animal in the City of Seminole with an air or gas gun, bow, slingshot or other weapon dangerous to wildlife is unlawful.</b> Spearfishing is excepted only in an area designated as permissible by the city, the state or the United States; none was found.",
    src="Boundary: US Census TIGERweb incorporated place 'Seminole city' (GEOID 1264975), outer rings only.",
    flag="Same wording and same open question as Treasure Island § 22-2 and Clearwater § 8.08: whether the city treats water where state law allows spearing as designated. The whole incorporated area is drawn, including Lake Seminole (fresh water, where spearguns are barred by state rule anyway) and enclaves inside the outline. The offshore edge on Long Bayou and Boca Ciega Bay is soft."))
Z.append(dict(
    id="loc-riviera-philfoster", n="Riviera Beach: no spearfishing by Phil Foster Park and the Blue Heron Bridge",
    law=["rivierabeach-13-32", "rivierabeach-13-26", "pbc-21-27"], cat="local", kind="closed",
    r=rings_ll(riviera), line=[], pts=[], active=None,
    s="<b>Spearfishing is unlawful in Lake Worth north of SR 703 and Phil Foster Park within 1,000 ft west of the Singer Island shore and 1,000 ft north of SR 703, within 150 ft of the southern shoreline of Phil Foster Park, and within 75 ft of any dock, wharf or bridge in Riviera Beach.</b> Palm Beach County separately bans spears on all county park property, Phil Foster Park included.",
    src="Drawn at 125 per cent of each stated distance: the § 13-31(a)(2) area from the Singer Island west shore and the SR 703 causeway, a buffer along the park's south beach, and a buffer along the Blue Heron Bridge deck. Positions read off USGS National Map imagery (public domain) and checked against Esri World Imagery.",
    flag="Only the Blue Heron Bridge is buffered for the 75 ft dock, wharf and bridge rule; every other dock, wharf and bridge in the city carries the same 75 ft closure and is not drawn. The south beach line and the shore line were read from imagery, not from a survey. Which bridge is the 'Riviera Beach Memorial Bridge' of § 13-26 (150 ft spear and gig ban) is not stated in the code."))
Z.append(dict(
    id="loc-pbc-parks", n="Palm Beach County parks: spear fishing banned on park property, park water included",
    law=["pbc-21-27"], cat="local", kind="warn", r=[], line=[], pts=[[26.7842, -80.0430], [26.7742, -80.0463]], active=None,
    s="<b>Using a spear for fishing is prohibited within Palm Beach County park property</b>, which the code defines to include park water on the Intracoastal Waterway, Lake Worth Lagoon and the Atlantic, and beaches. Markers: Phil Foster Park and Peanut Island.",
    src="Markers placed on USGS imagery at Phil Foster Park and Peanut Island. Not boundaries.",
    flag="GEOMETRY NOT MAPPED. How far 'park property' runs into the water is not stated, and every county beach and waterfront park is covered, not only the two marked. Treat the water off any Palm Beach County park as closed to spearing."))
Z.append(dict(
    id="loc-miamidade-parks", n="Miami-Dade County parks: no spear or gig fishing in park waters except where prescribed",
    law=["miamidade-26-1-r17"], cat="local", kind="warn", r=[], line=[], pts=[[25.9030, -80.1223], [25.7150, -80.1530]], active=None,
    s="<b>Fishing in Miami-Dade County park waters, fresh or salt, by spear, gig or any other device is prohibited except at places prescribed for it.</b> Markers: Haulover Park and Crandon Park.",
    src="Markers placed on USGS imagery at Haulover Park and Crandon Park. Not boundaries.",
    flag="GEOMETRY NOT MAPPED. The rule reaches every county park with water (Haulover, Crandon, Matheson Hammock, Black Point, Homestead Bayfront and others), and 'park waters' has no stated seaward limit. Treat the water off any county park as closed to spearing."))
Z.append(dict(
    id="loc-stmarks", n="St. Marks: skin diving and scuba banned from Magnolia Street to 2nd Street",
    law=["stmarks-78-1"], cat="local", kind="warn", r=[], line=[], pts=[[30.16244, -84.20827]], active=None,
    s="<b>Skin diving and scuba diving are unlawful from the west side of Magnolia Street to the south side of 2nd Street</b>; diving gear on the water or the river banks there is prima facie evidence of a violation.",
    src="Marker at the centroid of the TIGER incorporated place 'St. Marks city'. Not a boundary.",
    flag="GEOMETRY NOT MAPPED. The section does not name the river, and the city sits where the St. Marks and Wakulla rivers meet. Treat both rivers inside the city as covered."))

# Naples Special Acts art. 2 § 1 (Laws of Fla. ch. 90-469 as amended by ch. 92-258): canal entrance
# points from the act's own table, degrees-minutes-seconds converted to decimal degrees
NAPLES = [[float(a), float(b)] for a, b in (p.split(",") for p in "26.10389,-81.78833;26.10083,-81.78889;26.10083,-81.79667;26.10167,-81.79778;26.09611,-81.79889;26.11917,-81.79306;26.12250,-81.79333;26.12667,-81.79167;26.12750,-81.79389;26.12833,-81.79556;26.12944,-81.79583;26.12056,-81.78556;26.11944,-81.78694;26.11778,-81.78917;26.12639,-81.78806;26.12722,-81.78778;26.13056,-81.78722;26.13111,-81.78778;26.13250,-81.78861;26.13444,-81.78750;26.13556,-81.78778;26.13667,-81.78778;26.13778,-81.78750;26.17444,-81.81444".split(";"))]
Z.append(dict(
    id="loc-naples-canals", n="Naples: hook and line, cast net or crab trap only in the listed residential canals (no spearing)",
    law=["naples-90-469"], cat="local", kind="warn", r=[], line=[], pts=NAPLES, active=None,
    s="<b>Taking saltwater fish in the residential man-made canals of Naples listed in the 1990 special act is limited to hook and line, hand-held cast nets and up to five crab traps, for the full length and width of each canal from its entrance point.</b> The markers are the act's own entrance points for the Port Royal, Aqualane Shores, East Naples Bay and Moorings Bay canals.",
    src="Markers: the 24 distinct entrance coordinates printed in the act's canal table (degrees, minutes, seconds; datum not stated). Checked on imagery: they sit at canal mouths on Naples Bay and Moorings Bay.",
    flag="Only the entrance points are drawn. Every canal behind each point, for its full length and width, is covered and is not drawn. The coordinates are printed to the whole second, about 30 m."))

ds = json.load(io.open(SP, encoding="utf-8"))
zs = ds["zones"]
for z in Z:
    assert all(i in LAW for i in z["law"]), z["id"]
    zs[:] = [x for x in zs if x["id"] != z["id"]]
    zs.append(z)
ADD = {"clw2106": "clearwater-8-08", "loc-venice": "venice-46-134", "loc-sib": "sunnyisles-201-6",
       "loc-boca-inlet": "bocaraton-11-81", "loc-deerfield-beach": "deerfield-74-31"}
for x in zs:
    if x["id"] in ADD and ADD[x["id"]] not in x["law"]:
        x["law"].append(ADD[x["id"]])
ds["version"] = "2026-11-11"
io.open(SP, "w", encoding="utf-8").write(json.dumps(ds, ensure_ascii=False, separators=(",", ":")))
for z in Z:
    print("%-24s rings=%d pts=%d" % (z["id"], len(z["r"]), len(z["pts"])))
