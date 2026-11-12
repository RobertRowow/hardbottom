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

# Local rules already in the registry that had no map feature (found by checking every non-negative
# law id against the zone files and js/ on 12 Nov 2026). Markers only. Pier positions come from
# data/piers.json (FWC fishing pier inventory); town and city points are TIGERweb internal points;
# park positions were geocoded by name (Esri World Geocoder, point of interest matches) and checked
# on Esri World Imagery, except where the note says the position was read off imagery directly.
def mk(zid, n, law, pts, s, src, flag):
    Z.append(dict(id=zid, n=n, law=law, cat="local", kind="warn", r=[], line=[], pts=pts, active=None,
                  s=s, src=src, flag="GEOMETRY NOT MAPPED. " + flag))


TIGER = "Marker at the US Census TIGERweb internal point of the incorporated place. Not a boundary."
mk("loc-lighthousepoint-bridges", "Lighthouse Point: no fishing from or within 25 ft of any city bridge at night",
   ["lighthousepoint-54-8"], [[26.27856, -80.08570]],
   "<b>No fishing from any bridge in Lighthouse Point, or within 25 ft of one, from half an hour after sunset to half an hour after sunrise.</b>",
   TIGER, "Applies at every bridge in the city. Each is already inside the statewide 100 yd bridge buffer, so nothing more is closed to spearing; the rule matters for night dives near the canal bridges.")
mk("loc-redshores-standoff", "Redington Shores: no speargun within 200 ft of a swimmer or of a pier, dock or seawall being fished from",
   ["redshores-77-2"], [[27.83195, -82.83364]],
   "<b>Within town limits, firing a speargun is unlawful within 200 ft of any swimmer or bather, or within 200 ft of a pier, dock or seawall being fished from.</b>",
   TIGER, "These are moving buffers around people and cannot be drawn. Keep 200 ft from swimmers and from anyone fishing off a structure anywhere in the town.")
mk("loc-pbtown-beaches", "Town of Palm Beach: no spearfishing gear on five named beaches; dive rules off guarded beaches",
   ["pbtown-74-161", "pbtown-74-200", "pbtown-74-162"], [[26.70601, -80.03295], [26.63895, -80.03852]],
   "<b>Possession of spearfishing equipment is banned on Phipps Ocean Park, Midtown Beach, the Clarke Avenue beach, the Kreusler Park beach and the Palm Beach Inlet dock; on other Town beaches a speargun must be carried uncocked and unloaded.</b> Diving off lifeguarded Town beaches needs the buddy system, a certification card for scuba, a BC and a dive flag. Markers: Midtown Beach and Phipps Ocean Park.",
   "Midtown Beach position read off Esri World Imagery at the east end of Royal Palm Way; Phipps Ocean Park geocoded and checked on imagery.",
   "Only two of the five named beaches carry a marker. Clarke Avenue, Kreusler Park and the Palm Beach Inlet dock are covered too.")
mk("loc-tampa-parks-marinas", "Tampa: no spear or harpoon in city marinas and mooring fields, or in waters next to city park land",
   ["tampa-16-76", "tampa-16-41"], [[27.92881, -82.45343]],
   "<b>Using a spear or harpoon is unlawful in any City of Tampa marina or mooring field and on any adjacent pier, and fishing by any device is prohibited in waters next to Parks and Recreation Department land except where designated.</b> Marker: Davis Islands Park.",
   "Davis Islands Park geocoded and checked on imagery. Not a boundary.",
   "Every city marina, mooring field and waterfront park in Tampa is covered and none is drawn. 'Adjacent' waters have no stated width.")
mk("loc-hillsborough-parks", "Hillsborough County parks: no spear or gig fishing in park waters except where designated",
   ["hillsborough-38-25"], [[27.74811, -82.47073]],
   "<b>In Hillsborough County park waters, fresh or salt, all fishing including spear and gig is prohibited except at places the Parks Department designates.</b> Marker: E.G. Simmons Regional Park.",
   "E.G. Simmons Regional Park geocoded and checked on imagery. Not a boundary.",
   "Every county park with water is covered; 'park waters' has no stated seaward limit.")
mk("loc-manatee-beachparks", "Manatee County beach parks: no fishing where swimming is permitted; no swimming under or diving from the groins and piers",
   ["manatee-2-24-6"], [[27.49712, -82.71245], [27.46158, -82.69755]],
   "<b>At Manatee County beach parks, fishing (spearing included) is barred where swimming is permitted, scuba is barred inside marked swim areas, and nobody may enter, dive from or swim under the three groins or any pier.</b> Markers: Manatee Public Beach and Coquina Beach, where the three groins are.",
   "Both parks geocoded and checked on imagery; the three groins are visible off Coquina Beach.",
   "The swim areas are where posted and the groins are not drawn. Cortez Beach is covered too.")
mk("loc-brevard-parks", "Brevard County parks: no diving, scuba or fishing except in designated areas",
   ["brevard-78-112"], [[28.34187, -80.60693]],
   "<b>In any Brevard County park, recreational facility or department-managed land, diving, scuba and fishing (spearing included) are unlawful unless the area is designated for them.</b> Marker: Lori Wilson Park.",
   "Lori Wilson Park geocoded and checked on imagery (the point falls about 70 m inland of the beach). Not a boundary.",
   "Every county beach park and waterfront park in Brevard is covered, with no stated seaward limit.")
mk("loc-irc-parks", "Indian River County parks: no diving, scuba or fishing except in designated areas",
   ["indianrivercounty-205-03"], [[27.76349, -80.39705]],
   "<b>In Indian River County parks, diving, scuba and fishing are prohibited except in designated areas.</b> Marker: Wabasso Beach Park.",
   "Wabasso Beach Park geocoded. Not a boundary.",
   "Every county park with water is covered.")
mk("loc-ihb-parks", "Indian Harbour Beach parks: no diving, scuba or fishing except in designated areas",
   ["indianharbourbeach-12-36"], [[28.15767, -80.60030]], "<b>In Indian Harbour Beach city parks, diving, scuba and fishing are prohibited except in designated areas.</b>",
   TIGER, "Every city park with water is covered.")
mk("loc-goldenbeach-parks", "Golden Beach parks: no diving, scuba or fishing except in designated areas",
   ["goldenbeach-22-61"], [[25.96327, -80.12215]], "<b>In Golden Beach town parks, diving, scuba and fishing are prohibited except in designated areas.</b>",
   TIGER, "Every town park with water is covered, the beach park included.")
mk("loc-ormond-parks", "Ormond Beach: no spear guns in city park waters; no skin or scuba diving in parks except where designated",
   ["ormond-15-6"], [[29.27094, -81.02939]],
   "<b>Spear guns are prohibited for taking fish in Ormond Beach city park waters, and skin or scuba diving in city parks is prohibited except where the director designates.</b> Marker: Andy Romano Beachfront Park.",
   "Andy Romano Beachfront Park geocoded. Not a boundary.", "Every city park with water is covered, river parks included.")
mk("loc-wakulla-parks", "Wakulla County parks and facilities: no spear gun discharge",
   ["wakulla-23-005"], [[29.97340, -84.34065]],
   "<b>Discharging a spear gun in a Wakulla County park or county facility is unlawful unless authorized.</b> Marker: Mashes Sands Park.",
   "Mashes Sands Park geocoded. Not a boundary.", "Every county park and facility is covered, boat ramps and docks included.")
mk("loc-navarre-bathing", "Navarre Beach: spearfishing may be barred in posted bathing areas, 1 Mar to 31 Oct",
   ["santarosa-14-52"], [[30.38001, -86.86374]],
   "<b>From 1 March to 31 October, fishing with a spear may be prohibited in public bathing areas at Navarre Beach that the county designates and posts.</b> Marker: Navarre Beach Fishing Pier.",
   "Pier position from the FWC fishing pier inventory (data/piers.json).", "The bathing areas are where posted and are not drawn.")
mk("loc-escambia-beaches", "Escambia County beaches: lifeguards may order spearfishers away from bathers",
   ["escambia-74-36-18"], [[30.33085, -87.14269]],
   "<b>On Escambia County beaches, disobeying a lifeguard's reasonable command to stop spear fishing too close to bathers is unlawful.</b> Marker: Pensacola Beach Fishing Pier at Casino Beach.",
   "Pier position from the FWC fishing pier inventory (data/piers.json).", "Applies on every county beach; no distance is stated.")
mk("loc-yankeetown-basin", "Yankeetown: no swimming, diving, snorkeling or scuba at the Yacht Basin Boat Ramp and Yacht Basin Park",
   ["yankeetown-22-3"], [[29.03078, -82.71296]],
   "<b>No swimming, diving, snorkeling or scuba within or from the shoreline or structures of the Yacht Basin Boat Ramp and Yacht Basin Park, including the fishing pier.</b>",
   "Ramp position from the FWC boat ramp inventory (data/ramps.json, 'Yankeetown Yacht Basin Park').",
   "The water the rule reaches from the shoreline and structures is not stated.")
mk("loc-titusville-pier", "Titusville: no spear or gig within 100 ft of the Titusville Pier",
   ["titusville-12-7"], [[28.61949, -80.80048]],
   "<b>No fishing with a gig or spear within 100 ft of the Titusville Pier, the remaining part of the old bridge.</b> The statewide 100 yd pier buffer already closes this water.",
   "Pier position from the FWC fishing pier inventory (data/piers.json, 'Titusville Veteran's Memorial Fishing Pier').",
   "Nothing beyond the statewide pier buffer.")
mk("loc-flaglerbeach-pier", "Flagler Beach: no swimming within 150 ft either side of the municipal pier",
   ["flaglerbeach-6-3"], [[29.47984, -81.12649]],
   "<b>No swimming within 150 ft on either side of the Flagler Beach municipal pier</b>; lifeguards may expand the area. Inside the statewide 100 yd pier buffer.",
   "Pier position from the FWC fishing pier inventory (data/piers.json).", "Nothing beyond the statewide pier buffer unless a lifeguard expands the area.")
mk("loc-mexicobeach-pier", "Mexico Beach: no diving from the city pier, no swimming within 50 ft of it or in buoyed rental lanes",
   ["mexicobeach-95-02", "mexicobeach-95-20"], [[29.94310, -85.41111]],
   "<b>No diving from the Mexico Beach city pier and no swimming or otherwise occupying the water within 50 ft of it.</b> No swimming inside the buoyed channels that beach watercraft-rental locations must mark (§ 95.20).",
   "Marker on the beach where the geocoder places the pier; no pier structure is visible there on Esri World Imagery.",
   "The pier was destroyed by Hurricane Michael in 2018 and its rebuild was not confirmed; the FWC pier inventory has no Mexico Beach entry. Where a pier stands, the statewide 100 yd pier buffer applies as well.")
mk("loc-palmcoast-marinas", "Palm Coast: no swimming, diving or skin diving inside a marina area",
   ["palmcoast-4-16"], [[29.57690, -81.19330]],
   "<b>Swimming, diving, water-skiing and skin diving are prohibited within a marina area in Palm Coast.</b> Marker: Palm Coast Marina.",
   "Palm Coast Marina geocoded. Not a boundary.", "Every marina area in the city is covered.")
mk("loc-gulfport-posted", "Gulfport: no fishing of any kind, spear included, in posted no-fishing areas",
   ["gulfport-17-22"], [[27.74644, -82.70994]],
   "<b>Fishing by any method, spear and gig included, is banned in areas the city designates and posts as no-fishing areas.</b>",
   TIGER, "The posted areas are not listed in the code and are not drawn.")

mk("loc-cutlerbay-parks", "Cutler Bay parks: no spear or gig fishing in park waters except where prescribed",
   ["cutlerbay-22-109"], [[25.57615, -80.33401]],
   "<b>Fishing in Cutler Bay park waters, fresh or salt, by spear, gig or any other device is prohibited except where prescribed.</b>",
   TIGER, "Every town park with water is covered, bayfront parks included; 'park waters' has no stated seaward limit.")
mk("loc-palmettobay-parks", "Palmetto Bay parks: no spear or gig fishing in park waters except where prescribed",
   ["palmettobay-20-62"], [[25.62170, -80.31891]],
   "<b>Fishing in Palmetto Bay park property waters, fresh or salt, by spear, gig or any other device is prohibited except where prescribed.</b>",
   TIGER, "Every village park with water is covered, the Biscayne Bay parks included; no seaward limit is stated.")
mk("loc-pbgardens-parks", "Palm Beach Gardens parks: no spear guns in a park",
   ["pbgardens-46-37"], [[26.84879, -80.16712]],
   "<b>Carrying, using or possessing a spear gun on or in any Palm Beach Gardens park area or property is prohibited.</b>",
   TIGER, "Every city park is covered; whether a park's water counts as 'park area' is not stated.")
mk("loc-irshores-parks", "Indian River Shores parks: no swimming, diving, scuba or fishing except in designated areas",
   ["irshores-95-03"], [[27.70900, -80.38938]],
   "<b>In any Indian River Shores park or recreational area, swimming, diving, scuba and fishing are prohibited unless the area is designated for them.</b>",
   TIGER, "Every town park and recreational area is covered, beach accesses included where the town treats them as parks.")

mk("loc-hernando-parks", "Hernando County parks: no spear guns unless authorized",
   ["hernando-22-20"], [[28.56851, -82.65583]],
   "<b>Unless the parks department authorizes it, no one may carry, use or possess a spear gun on Hernando County park property.</b> Marker: Alfred McKethan Pine Island Park.",
   "Pine Island Park geocoded. Not a boundary.", "Every county park is covered; whether park water counts as park property is not stated.")
mk("loc-largo-parks", "Largo parks: no spear or gig fishing in park waters except where designated",
   ["largo-17-12"], [[27.90767, -82.77394]],
   "<b>Fishing in Largo park waters, fresh or salt, by spear, gig or any other device is prohibited except where designated.</b>",
   TIGER, "Most of the city's park water is fresh; any saltwater park frontage is covered too.")
mk("loc-pinellaspark-parks", "Pinellas Park parks: no spear or gig fishing in park waters except where designated",
   ["pinellaspark-2-1007"], [[27.85888, -82.70821]],
   "<b>Fishing in Pinellas Park park waters by spear, gig or any other device is prohibited except where designated.</b>",
   TIGER, "Every city park with water is covered.")

Z.append(dict(
    id="loc-belleairbeach-marina", n="Belleair Beach: no swimming or diving in the city marina",
    law=["belleairbeach-30-195"], cat="local", kind="closed",
    r=ring(box4(27.93698, 27.93563, -82.83942, -82.83900)),
    line=[], pts=[], active=None,
    s="<b>All swimming and diving are prohibited within the Belleair Beach city marina</b>, on the Intracoastal at 3505 Gulf Boulevard.",
    src="Location from the city's marina page; the slips along the seawall boxed on Esri World Imagery (zoom 19). No distance added.",
    flag="The code does not define the marina's water. The box covers the slips along the seawall only."))

mk("loc-marcoisland-swim", "Marco Island beaches: no swimming within 150 ft of a pier, jetty or breakwater",
   ["marcoisland-54-36"], [[25.93202, -81.70484]],
   "<b>Off Marco Island's beaches, no swimming within 150 ft of any pier, jetty or breakwater</b>, wider than the statewide 100 ft jetty buffer.",
   TIGER, "The beach jetties and breakwaters are not buffered at 150 ft; the statewide 100 ft jetty buffer is drawn where the jetty layer has them.")
mk("loc-sanibel-ramp", "Sanibel public boat ramp: no fishing within 100 ft, no swimming or diving within 50 ft",
   ["sanibel-74-96-98"], [[26.45346, -82.03601]],
   "<b>No fishing of any kind within 100 ft of the Sanibel public boat ramp facility, and no swimming, diving or floating within 50 ft.</b>",
   "Ramp position from the FWC boat ramp inventory (data/ramps.json, 'Sanibel Island Public').",
   "The facility's extent (ramp lanes, docks and basin) is not drawn; the 100 ft runs from every part of it.")

# Port authority tariff rules. Port Canaveral's Rule 380 defines its area in words ("all water east of
# the Barge Canal Lock through the Jetties to the Atlantic Ocean"), so it is drawn: the USGS NHD
# CanalDitch area that fills the harbor and canal east of the lock (pulled 12 Nov 2026, see
# tools/law-updates/2026-11-11/geom/pulled.txt line CPA), joined to the hull of the two Canaveral jetty
# lines in data/jetties.json (NOAA ENC) and the canal outline points east of 80.5925 W, which closes the
# entrance between the jetties out to their tips.
G = os.path.join(ROOT, "tools", "law-updates", "2026-11-11", "geom")
lines = io.open(os.path.join(G, "pulled.txt"), encoding="utf-8").read().split("\n")
cpa = next(lines[i + 1][5:] for i, ln in enumerate(lines) if ln.startswith("CPA\t"))
canal = cpa.split("#")[0].split("|")[0]          # outer ring only; the 5-point hole is filled
pts, a, o = [], 0, 0
for k, p in enumerate(canal.split(";")):
    x, y = map(int, p.split(","))
    a, o = (x, y) if k == 0 else (a + x, o + y)
    pts.append(fwd(a / 1e5, o / 1e5))
from shapely.geometry import MultiPoint
from shapely.ops import unary_union
JET = {j["id"]: j for j in json.load(io.open(os.path.join(ROOT, "data", "jetties.json"), encoding="utf-8"))["zones"]}
jp = [fwd(lo, la) for jid in ("jetty-canaveral-n", "jetty-canaveral-s") for part in JET[jid]["line"] for la, lo in part]
east = [q for q in pts if inv(*q)[0] > -80.5925]   # canal outline points in the entrance reach
harbor = unary_union([Polygon(pts).buffer(0), MultiPoint(jp + east).convex_hull]).buffer(0)
hr = [[round(y, 5), round(x, 5)] for x, y in (inv(*c) for c in harbor.simplify(1.0).exterior.coords)]
Z.append(dict(
    id="loc-portcanaveral-diving", n="Port Canaveral: underwater diving prohibited east of the Barge Canal lock through the jetties",
    law=["cpa-tariff-380"], cat="local", kind="closed", r=[hr], line=[], pts=[], active=None,
    s="<b>Underwater diving is prohibited within the confines of Port Canaveral, defined as all water east of the Barge Canal lock through the jetties to the Atlantic, except dive operations the Harbormaster authorizes.</b> Navy, Army Corps and Coast Guard waters are outside the rule but are closed by their own security and restricted-area rules.",
    src="USGS National Hydrography Dataset (high resolution) canal area east of the lock, joined to the hull of the two jetties as charted by NOAA ENC (data/jetties.json).",
    flag="The rule is written for dive operations; the map reads it as covering any diving, the reading that closes more water. NHD's canal area ends at the shoreline, so berths and slips cut into the bank after NHD was drawn may be missing from the outline."))
mk("loc-portpalmbeach-diving", "Port of Palm Beach: underwater diving prohibited within the port unless authorized",
   ["ppb-tariff-546"], [[26.76806, -80.04865]],
   "<b>Underwater diving is prohibited within the confines of the Port of Palm Beach except when authorized by the Director of Operations.</b>",
   "Marker in the port turning basin read off Esri World Imagery. Not a boundary.",
   "The tariff does not define 'the confines of the port'. Treat the slips, berths and turning basin as closed; parts are also inside the fixed Coast Guard security zones.")

# Guana River WMA, r. 68A-15.065(13) item 14: spear guns prohibited in Lake Ponte Vedra. USGS NHD
# waterbody 'Lake Ponte Vedra' (the head of the impoundment) and the unnamed NHD area that fills Guana
# Lake south to the dam, pulled 12 Nov 2026 (pulled.txt line GUA). The two do not meet: the river reach
# between them is not in either feature and is not drawn.
gua = next(lines[i + 1][5:] for i, ln in enumerate(lines) if ln.startswith("GUA\t"))
grings = []
for part in gua.split("#"):
    pts2, a2, o2 = [], 0, 0
    for k, p in enumerate(part.split(";")):
        x, y = map(int, p.split(","))
        a2, o2 = (x, y) if k == 0 else (a2 + x, o2 + y)
        pts2.append((a2 / 1e5, o2 / 1e5))
    poly = Polygon([fwd(lo, la) for lo, la in pts2]).buffer(0)
    grings.append([[round(y, 5), round(x, 5)] for x, y in (inv(*c) for c in poly.exterior.coords)])
Z.append(dict(
    id="st-guana-lakepontevedra", n="Guana River WMA: spear guns prohibited in Lake Ponte Vedra (Guana Lake)",
    law=["fac-68a-15-065-guana"], cat="stateareas", kind="closed", r=grings, line=[], pts=[], active=None,
    s="<b>Possessing or using a spear gun in Lake Ponte Vedra (Guana Lake) is prohibited</b>, r. 68A-15.065(13). Gigs are barred too except for frogs, and cast nets and gigs within 50 yd of the Guana Dam structure.",
    src="USGS National Hydrography Dataset (high resolution): the waterbody named Lake Ponte Vedra and the unnamed area that fills the lake south to the Guana Dam.",
    flag="NHD names only the head of the impoundment 'Lake Ponte Vedra'; the map reads the name as the whole impoundment above the Guana Dam, which closes more water. The river reach joining the two NHD features is not drawn."))

# Canal gear rules drawn from USGS NHD canal areas (pulled 12 Nov 2026, pulled.txt lines MBC, SAT and
# COC). Melbourne Beach's five canals are one NHD canal polygon between Driftwood Avenue and Riverview
# Lane, checked against TIGER street lines for the five streets the section names. For Satellite Beach
# and Cocoa Beach the sections list canals by street bounds; every NHD canal area inside each city's
# TIGERweb boundary is drawn, which covers the listed canals and closes any unlisted ones too.
def dec_parts(key):
    s = next(lines[i + 1][5:] for i, ln in enumerate(lines) if ln.startswith(key + "\t"))
    out = []
    for part in s.split("|"):
        pts3, a3, o3 = [], 0, 0
        for k, p in enumerate(part.split(";")):
            x, y = map(int, p.split(","))
            a3, o3 = (x, y) if k == 0 else (a3 + x, o3 + y)
            pts3.append(fwd(a3 / 1e5, o3 / 1e5))
        if len(pts3) >= 4:
            out.append(Polygon(pts3).buffer(0))
    g = unary_union(out)
    polys = [g] if g.geom_type == "Polygon" else list(g.geoms)
    return [[[round(y, 5), round(x, 5)] for x, y in (inv(*c) for c in q.exterior.coords)] for q in polys if q.area > 1]


Z.append(dict(
    id="loc-melbournebeach-canals", n="Melbourne Beach: hook and line or hand-thrown cast net only in five named residential canals",
    law=["melbournebeach-40-33"], cat="local", kind="closed", r=dec_parts("MBC"), line=[], pts=[], active=None,
    s="<b>Catching fish by any means other than hook and line or a hand-thrown cast net is banned in the dredged canals between Driftwood Avenue and Riverview Lane</b>, around Pelican Key, Sandy Key and Anchor Key. Spearing is not an allowed method.",
    src="USGS National Hydrography Dataset (high resolution) canal area, checked against the TIGER street lines the section names.",
    flag="NHD's canal polygon follows the seawalls as mapped; docks and boat lifts over the water are inside it."))
Z.append(dict(
    id="loc-satellitebeach-canals", n="Satellite Beach: hook and line or hand-thrown cast net only in the listed residential canals",
    law=["satellitebeach-66-1"], cat="local", kind="closed", r=dec_parts("SAT"), line=[], pts=[], active=None,
    s="<b>Taking fish from the fourteen manmade residential canals § 66-1 lists, the Grand Canal included, by any means other than hook and line or a hand-thrown cast net is prohibited.</b> Spearing is not an allowed method.",
    src="USGS National Hydrography Dataset (high resolution) canal areas inside the TIGERweb city boundary.",
    flag="Every NHD canal area inside the city is drawn, a superset of the fourteen listed canals."))
Z.append(dict(
    id="loc-cocoabeach-canals", n="Cocoa Beach: hook and line or hand-thrown cast net only in the listed residential canals",
    law=["cocoabeach-5-56"], cat="local", kind="closed", r=dec_parts("COC"), line=[], pts=[], active=None,
    s="<b>Taking fish by any means other than hook and line or a hand-thrown cast net is banned in the residential saltwater canals listed in § 5-56(a)</b>, the city's canal subdivisions on the Banana River side. Spearing is not an allowed method.",
    src="USGS National Hydrography Dataset (high resolution) canal areas inside the TIGERweb city boundary.",
    flag="Every NHD canal area inside the city is drawn, a superset of the listed canals; the list after item (12) was not read."))

ds = json.load(io.open(SP, encoding="utf-8"))
zs = ds["zones"]
ADD = {"loc-venice": "venice-46-64", "usace-334-580-porteverglades": "pev-tariff-280"}
for x in zs:
    if ADD.get(x["id"]) and ADD[x["id"]] not in x["law"]:
        x["law"].append(ADD[x["id"]])
for z in Z:
    assert all(i in LAW for i in z["law"]), z["id"]
    zs[:] = [x for x in zs if x["id"] != z["id"]]
    zs.append(z)
ds["version"] = "2026-11-12"
io.open(SP, "w", encoding="utf-8").write(json.dumps(ds, ensure_ascii=False, separators=(",", ":")))
for z in Z:
    print("%-26s rings=%d pts=%d" % (z["id"], len(z["r"]), len(z["pts"])))
