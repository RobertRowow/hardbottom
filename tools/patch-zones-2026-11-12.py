# -*- coding: utf-8 -*-
"""Zones for the marina, inlet, beach and citywide swimming and diving rules found in the second
local sweep of 12 Nov 2026. Run after tools/patch-zones-2026-11-11.py; idempotent (a zone whose id
already exists is replaced).

Positions were read on 12 Nov 2026 off Esri World Imagery in the author's Chrome (Leaflet page,
zoom 16 to 19), by converting the pixel position of each feature to latitude and longitude. They are
imagery readings, not surveys. No OpenStreetMap input.

  Marina envelopes: the four corners of a box drawn around every dock, breakwater and basin of the
  named marina as seen on imagery. Where the ordinance gives a distance ("within 500 feet"), the box
  is buffered by 125 per cent of it, the margin the statewide buffers use. Where the ordinance says
  "in the waters of" the marina, the box itself is drawn. Land inside a box is harmless: it closes
  nothing a diver uses.

  Citywide rules (Tampa channels and ramps, Callaway and Lynn Haven bridges, ramps, docks and boat
  basins, Marathon mini-season canals) are markers at the US Census TIGERweb internal point of the
  incorporated place (Places_CouSub_ConCity_SubMCD/MapServer/4, INTPTLAT and INTPTLON), not
  boundaries.
"""
import io, json, os
from shapely.geometry import Polygon
from pyproj import Transformer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SP = os.path.join(ROOT, "data", "zones-statewide.json")
FT = 0.3048
fwd = Transformer.from_crs("EPSG:4326", "EPSG:3086", always_xy=True).transform
inv = Transformer.from_crs("EPSG:3086", "EPSG:4326", always_xy=True).transform
LAW = {e["id"] for e in json.load(io.open(os.path.join(ROOT, "data", "law.json"), encoding="utf-8"))["entries"]}


def ring(latlons, buf_ft=0.0):
    p = Polygon([fwd(lo, la) for la, lo in latlons])
    if buf_ft:
        p = p.buffer(buf_ft * FT * 1.25, join_style=2)
    r = [[round(y, 5), round(x, 5)] for x, y in (inv(*c) for c in p.exterior.coords)]
    if r[0] != r[-1]:
        r.append(r[0])
    return [r]


def box4(n, s, w, e):
    return [[n, w], [n, e], [s, e], [s, w]]


Z = []
Z.append(dict(
    id="loc-staug-marina", n="St. Augustine: no swimming in or within 500 ft of the municipal marina",
    law=["stauguestine-7-55"], cat="local", kind="closed",
    r=ring(box4(29.89275, 29.89129, -81.31014, -81.30795), 500), line=[], pts=[], active=None,
    s="<b>No swimming, freediving included, in or within 500 ft of the St. Augustine Municipal Marina</b> on the Matanzas River just south of the Bridge of Lions.",
    src="Dock envelope read off Esri World Imagery (zoom 18) and buffered by 625 ft, 125 per cent of the stated 500 ft.",
    flag="The envelope covers the marina's docks south of the Bridge of Lions. The city also runs mooring fields north and south of the bridge; whether the code counts them as part of 'the municipal marina' is not stated, and they are not drawn."))
Z.append(dict(
    id="loc-panamacity-marinas", n="Panama City: no swimming within 300 ft of a city-owned marina",
    law=["panamacity-5-46"], cat="local", kind="closed",
    r=ring(box4(30.15374, 30.14970, -85.66723, -85.66139), 300) + ring(box4(30.16945, 30.16680, -85.70499, -85.70280), 300),
    line=[], pts=[], active=None,
    s="<b>No swimming within 300 ft of any city-owned marina or its appurtenances</b>: the downtown Panama City Marina and St. Andrews Marina.",
    src="Envelopes of each marina's docks, breakwaters and basin read off Esri World Imagery (zoom 17 and 18), buffered by 375 ft, 125 per cent of the stated 300 ft.",
    flag="The downtown marina was being rebuilt after Hurricane Michael when the imagery was taken; the envelope follows the breakwater and basin as they appear. Any other city-owned marina or dock the city treats as covered is not drawn."))
Z.append(dict(
    id="loc-miami-marinas", n="Miami: no swimming, diving or fishing in the Dinner Key, Miamarina or Watson Island marina waters",
    law=["miami-50-228"], cat="local", kind="closed",
    r=ring([[25.73378, -80.23611], [25.73378, -80.22881], [25.72363, -80.22872], [25.72363, -80.23923], [25.72862, -80.23923], [25.72862, -80.23611]])
      + ring(box4(25.78007, 25.77691, -80.18685, -80.18323))
      + ring(box4(25.78711, 25.78396, -80.18055, -80.17763)),
    line=[], pts=[], active=None,
    s="<b>Swimming, diving and fishing are unlawful in the waters of the Dinner Key yacht basin, Miamarina (Bayside) and the Watson Island marina.</b>",
    src="Basin envelopes read off Esri World Imagery (zoom 16 and 17). The ordinance says 'in the waters of', so no distance is added.",
    flag="The code names the basins without boundaries. Dinner Key is drawn from the north marina piers to the spoil islands and the basin west of the south piers; the mooring field outside the islands is not drawn. Watson Island is drawn at the marinas on the island's north side; the megayacht marina on the south side may also count and is not drawn."))
Z.append(dict(
    id="loc-annamaria-inlet", n="Anna Maria: no swimming in Lake LaVista Inlet",
    law=["annamaria-66-44"], cat="local", kind="warn", r=[], line=[], pts=[[27.53365, -82.73285]], active=None,
    s="<b>Swimming in Lake LaVista Inlet is prohibited.</b> The inlet runs from the Lake La Vista canals to Tampa Bay beside a rock jetty, just west of the Anna Maria City Pier.",
    src="Marker at the channel mouth read off Esri World Imagery (zoom 18). Not a boundary.",
    flag="GEOMETRY NOT MAPPED. The code does not locate the inlet and no federal names dataset carries Lake La Vista; the marker follows local reporting that places the inlet and its jetty west of the City Pier. The water by the jetty is also inside the statewide 100 ft jetty buffer."))
Z.append(dict(
    id="loc-carrabelle-docks", n="Carrabelle: no swimming from or within 50 ft of the municipal docks",
    law=["carrabelle-74-66"], cat="local", kind="warn", r=[], line=[], pts=[[29.85232, -84.66810]], active=None,
    s="<b>No swimming from or within 50 ft of the city's municipal docking facilities</b> on the Carrabelle River waterfront.",
    src="Marker on the Carrabelle River waterfront read off Esri World Imagery (zoom 17). Not a boundary.",
    flag="GEOMETRY NOT MAPPED. The waterfront has city and private docks side by side and the code does not list which are municipal. Treat 50 ft around any dock on the downtown waterfront as closed."))
Z.append(dict(
    id="loc-pompano-beach", n="Pompano Beach: no spearguns, gigs or slings on the beach or in the waters of the public beach",
    law=["pompano-98-02"], cat="local", kind="warn", r=[], line=[], pts=[[26.23577, -80.08879]], active=None,
    s="<b>Using an underwater spearfishing gun, gig, sling, bow or similar gun on the beach or in the waters of the public beach is unlawful</b>, and scuba diving within 50 yd of the high tide line of all public beach areas is unlawful except when entering or leaving the water. The marker is the Pompano Beach Fishing Pier, whose statewide 100 yd buffer is drawn separately.",
    src="Marker at the Pompano Beach Fishing Pier, read off imagery. Not a boundary.",
    flag="GEOMETRY NOT MAPPED. The code does not say how far 'the waters of the public beach' reach. Read conservatively, no spearing from shore along the city's public beach and no loaded speargun carried through the swimming area."))
CITY = [
    ("loc-tampa-channels", "Tampa: no swimming in boat channels or boating zones, or within 200 ft of a boat ramp", "tampa-14-203",
     [27.96788, -82.47459], "<b>No swimming or wading in any boat channel or boating zone in the City of Tampa, or within 200 ft of any boat ramp.</b> A freediver in a marked channel is swimming in it.",
     "Applies everywhere in city waters: every marked channel and every public or private boat ramp. Not drawn; the marker is the city's census internal point."),
    ("loc-callaway-swim", "Callaway: no swimming within 100 ft of a public bridge, boat ramp or dock", "callaway-10-5-18",
     [30.13040, -85.54860], "<b>No swimming within 100 ft of any public bridge, boat ramp or dock in Callaway.</b>",
     "Applies to every public bridge, ramp and dock in the city. Bridges are already inside the statewide 100 yd buffer; ramps and docks are not drawn."),
    ("loc-lynnhaven-swim", "Lynn Haven: no swimming within 100 ft of a public bridge, or in a boat basin or its channel", "lynnhaven-42-19-20",
     [30.23357, -85.63692], "<b>No swimming within 100 ft of a public bridge in Lynn Haven, and none in or out of any boat basin or the channel linking it to the bay.</b>",
     "Boat basins and their channels are not drawn; the marker is the city's census internal point."),
    ("loc-marathon-miniseason", "Marathon: no diving or snorkeling in canals, marinas or within 300 ft of improved shoreline during lobster mini-season", "marathon-36-177",
     [24.73234, -81.02512], "<b>During the two-day lobster mini-season, no diving or snorkeling in any navigable canal or marina, or within 300 ft of improved residential or commercial shoreline, in the City of Marathon.</b>",
     "The city keeps the map of covered water at City Hall; it is not public online and is not drawn. Treat every canal and 300 ft off any developed shore in Marathon as closed during mini-season."),
]
for zid, n, law, pt, s, flag in CITY:
    Z.append(dict(id=zid, n=n, law=[law], cat="local", kind="warn", r=[], line=[], pts=[pt], active=None,
                  s=s, src="Marker at the US Census TIGERweb internal point of the incorporated place. Not a boundary.",
                  flag="GEOMETRY NOT MAPPED. " + flag))

ds = json.load(io.open(SP, encoding="utf-8"))
zs = ds["zones"]
for z in Z:
    assert all(i in LAW for i in z["law"]), z["id"]
    zs[:] = [x for x in zs if x["id"] != z["id"]]
    zs.append(z)
ds["version"] = "2026-11-12"
io.open(SP, "w", encoding="utf-8").write(json.dumps(ds, ensure_ascii=False, separators=(",", ":")))
for z in Z:
    print("%-26s rings=%d pts=%d" % (z["id"], len(z["r"]), len(z["pts"])))
