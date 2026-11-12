# -*- coding: utf-8 -*-
import json, io, os

def E(id, cite, title, juris, kind, url, effect, excerpt, full=None, verified="verbatim",
      scope=None, note=None, geom=None):
    return dict(id=id, cite=cite, title=title, juris=juris, kind=kind, url=url,
                effect=effect, excerpt=excerpt, full=full, verified=verified,
                scope=scope, note=note, geom=geom)

L = []

# ---------------- FEDERAL ----------------
L.append(E("cfr-922-163","15 C.F.R. § 922.163(a)(12)","FKNMS — sanctuary-wide prohibitions","federal","cfr",
 "https://www.ecfr.gov/current/title-15/section-922.163",
 "Sanctuary-wide: no coral contact/take, no explosives, marine-life harvest only per FAC 68B-42. NOT a spearfishing ban by itself.",
 "Harvesting, possessing, or landing any marine life species, or part thereof, within the Sanctuary, except in accordance with rules 68B-42 of the Florida Administrative Code, and such rules shall apply mutatis mutandis (with necessary editorial changes) to all Federal and State waters within the Sanctuary.",
 note="The sanctuary-wide rule does not close the Keys to spearfishing. The closures are area-specific — see § 922.164."))

L.append(E("cfr-922-164-b1","15 C.F.R. § 922.164(b)(1)(iv)","FKNMS — Key Largo & Looe Key Existing Management Areas","federal","cfr",
 "https://www.ecfr.gov/current/title-15/section-922.164",
 "Carrying or possessing a speargun, pole spear, Hawaiian sling or sling is itself an offence unless in uninterrupted transit.",
 "Fishing with, carrying or possessing, except while passing through without interruption or for law enforcement purposes: pole spears, air rifles, bows and arrows, slings, Hawaiian slings, rubber powered arbaletes, pneumatic and spring-loaded guns or similar devices known as spearguns.",
 scope="Key Largo Management Area and Looe Key Management Area (boundaries at 15 C.F.R. pt. 922 subpt. P, app. II).",
 note="The strictest gear-possession rule anywhere in Florida. Stow the gun and keep moving."))

L.append(E("cfr-922-164-d","15 C.F.R. § 922.164(d)(1)(iii)","FKNMS — Sanctuary Preservation Areas & Ecological Reserves","federal","cfr",
 "https://www.ecfr.gov/current/title-15/section-922.164",
 "All 18 SPAs and both Ecological Reserves are absolute no-fishing zones. Spearfishing included.",
 "Except for catch and release fishing by trolling in the Conch Reef, Alligator Reef, Sombrero Reef, and Sand Key SPAs, fishing by any means.",
 scope="18 SPAs (app. V): Alligator Reef, Carysfort/South Carysfort, Cheeca Rocks, Coffins Patch, Conch Reef, Davis Reef, Dry Rocks, Grecian Rocks, Eastern Dry Rocks, The Elbow, French Reef, Hen and Chickens, Looe Key, Molasses Reef, Newfound Harbor Key, Rock Key, Sand Key, Sombrero Key. Ecological Reserves (app. IV): Western Sambo; Tortugas North and South.",
 note="THE KEYS ARE UNDER TWO DIFFERENT RULEBOOKS AT ONCE. The 2025 Restoration Blueprint took effect in FEDERAL sanctuary waters on 5 March 2025. Florida's Governor certified it unacceptable under NMSA \u00a7 304(b), so FLORIDA STATE WATERS remain on the 1997 zoning. On the federal side the catch-and-release trolling exception at Conch, Alligator, Sombrero and Sand Key is GONE. Compounding this, eCFR's \u2018current\u2019 text of \u00a7\u00a7 922.163 and 922.164 still renders the pre-2025 scheme — the \u00a7 922.164 source credit stops at 74 FR 38095 (31 July 2009) — so anyone reading eCFR is reading state-waters law only. This map's Keys layer is built from NOAA's own post-Blueprint GIS and every zone carries a state/federal flag. Confirm with FKNMS (305-809-4700) before relying on it."))

L.append(E("cfr-922-164-c","15 C.F.R. § 922.164(c)","FKNMS — Wildlife Management Areas","federal","cfr",
 "https://www.ecfr.gov/current/title-15/section-922.164",
 "Idle-speed, no-motor, no-access-buffer and closed zones. A no-access-buffer or closed WMA is a hard exclusion for a diver.",
 "Access to the following Wildlife Management Areas ... is restricted as follows ... idle speed only/no wake, no-motor, no access buffer, closed.",
 scope="Boundaries at 15 C.F.R. pt. 922 subpt. P, app. III."))

L.append(E("cfr-622-410","50 C.F.R. § 622.410","Tortugas marine reserves","federal","cfr",
 "https://www.ecfr.gov/current/title-50/section-622.410",
 "Fishing for any species prohibited; fishing vessels may not anchor.",
 "The following activities are prohibited within the Tortugas marine reserves: Fishing for any species and anchoring by fishing vessels.",
 scope="Tortugas North (EEZ portion): 24°40'N 83°06'W → 24°46'N 83°06'W → 24°46'N 83°00'W → thence along the seaward limit of Florida's waters. Tortugas South: 24°33'N 83°09'W, 24°33'N 83°05'W, 24°18'N 83°05'W, 24°18'N 83°09'W.",
 note="Mirrored by 15 C.F.R. § 922.164(d) app. IV and 50 C.F.R. § 622.74(b)."))

L.append(E("cfr-622-183","50 C.F.R. § 622.183(a)(1)","South Atlantic deepwater MPAs","federal","cfr",
 "https://www.ecfr.gov/current/title-50/section-622.183",
 "No fishing for or possession of South Atlantic snapper-grouper. Transit allowed with gear stowed.",
 "No person may fish for a South Atlantic snapper-grouper in an MPA, and no person may possess a South Atlantic snapper-grouper in an MPA.",
 scope="Eight MPAs; three lie off Florida — North Florida MPA, St. Lucie Hump MPA, East Hump MPA. Coordinates at § 622.183(a)(1)(i)(A)–(H).",
 note="Only THREE of the eight are off Florida — North Florida, St. Lucie Hump and East Hump. The other five are North Carolina, South Carolina and Georgia. All are deep water: this is a possession risk on the ride home more than a diving restriction."))

L.append(E("cfr-622-34","50 C.F.R. § 622.34(a)","Gulf reef fish reserves — Madison-Swanson, Steamboat Lumps, The Edges","federal","cfr",
 "https://www.ecfr.gov/current/title-50/section-622.34",
 "Madison-Swanson and Steamboat Lumps: year-round fishing and possession ban. The Edges: January–April closure.",
 "Fishing is prohibited year-round ... possession of Gulf reef fish is prohibited year-round ... possession of any non-Gulf reef fish species is prohibited year-round.",
 scope="Coordinates at § 622.34(a)(1)(i)–(iii)."))

L.append(E("cfr-622-224","50 C.F.R. § 622.224(b)–(c)","Oculina Bank HAPC and Deepwater Coral HAPCs","federal","cfr",
 "https://www.ecfr.gov/current/title-50/section-622.224",
 "NOT a spearfishing closure. Bottom gear, anchoring and rock shrimp only — but a dive boat may not anchor, which is what actually bites.",
 "(A) Use a bottom longline, bottom trawl, dredge, pot, or trap; (B) If aboard a fishing vessel, anchor, use an anchor and chain, or use a grapple and chain; (C) Fish for or possess rock shrimp.",
 scope="Oculina Bank HAPC: 31-point boundary at § 622.224(b)(1), origin 29°43'29.82\"N 80°14'48.06\"W. Experimental Oculina Research Reserve: 27°53'N to 27°30'N, 79°56'W to 80°00'W. Deepwater Coral HAPCs incl. Stetson-Miami Terrace, Pourtales Terrace, Blake Ridge Diapir.",
 note="The anchoring prohibition is what actually bites a dive boat here."))

L.append(E("cfr-36-2-3","36 C.F.R. § 2.3(e)","National Park Service — fishing baseline","federal","cfr",
 "https://www.ecfr.gov/current/title-36/section-2.3",
 "In NPS salt waters, state law governs spearfishing unless a park-specific rule says otherwise.",
 "Except as otherwise designated, fishing with a net, spear, or weapon in the salt waters of park areas shall be in accordance with State law."))

L.append(E("cfr-36-7-27","36 C.F.R. § 7.27(b)(4)(ii)","Dry Tortugas National Park","federal","cfr",
 "https://www.ecfr.gov/current/title-36/section-7.27",
 "Spearfishing expressly prohibited by every gear name. Hook-and-line only.",
 "Taking fish by pole spear, Hawaiian sling, rubber powered, pneumatic, or spring loaded gun or similar device known as a speargun, air rifles, bows and arrows, powerheads, or explosive powered guns. Only the following may be legally taken: Fin fish by closely attended hook-and-line; Bait fish by closely attended hook and line, dip net, or cast net and limited to 5 gallons per vessel per day; and Shrimp may be taken by dip net or cast net."))

L.append(E("cfr-36-7-45","36 C.F.R. § 7.45(d)(6)","Everglades National Park","federal","cfr",
 "https://www.ecfr.gov/current/title-36/section-7.45",
 "Effectively a spearfishing ban — gear is listed exclusively and a spear is not on the list.",
 "Except as provided in this section, only a closely attended hook and line may be used for fishing activities within the park. The taking, possession, or disturbance of any fresh or saltwater aquatic life is prohibited [except as specified].",
 note="Waters near Royal Palm and Shark Valley are closed to fishing entirely."))

L.append(E("bnp-status","36 C.F.R. pt. 7 (no BNP section); Fla. Admin. Code ch. 68B-7","Biscayne National Park","federal","cfr",
 "https://www.nps.gov/bisc/planyourvisit/fishing.htm",
 "No park-specific federal fishing rule exists, so 36 C.F.R. § 2.3(e) sends you to state law: spearfishing is lawful subject to ch. 68B-20.",
 "[No 36 C.F.R. part 7 section for Biscayne National Park.]",
 verified="secondary",
 scope="Superintendent's Compendium (approved 17 Sep 2025) closes fishing at six named spots: Boca Chita Key Harbor; Elliott Key Harbor (except the maintenance dock south of the main harbor); the NPS boat basin at Convoy Point; the entrance road at Convoy Point; the north side of the Adams Key dock; and the north end of the Convoy Point picnic area. SEPARATELY — LEGARE ANCHORAGE IS CLOSED TO SCUBA, SNORKELING, SWIMMING AND UNDERWATER VIEWING DEVICES (hook-and-line drift fishing is allowed).",
 note="The 2015 General Management Plan proposed a marine reserve zone. It was NEVER implemented as a spearfishing closure — a 2014 NPS plan and a 2019 FWC rulemaking each proposed one and neither was adopted. Confirm current compendium at 786-335-3620."))

L.append(E("cfr-50-17-108","50 C.F.R. § 17.108(c)(14)(ii)(A)","Kings Bay Manatee Refuge — Three Sisters Springs area","federal","cfr",
 "https://www.ecfr.gov/current/title-50/section-17.108",
 "Inside the Kings Bay refuge, the Three Sisters area bans scuba diving and fishing by spear — seasonally, 15 Nov through 31 Mar.",
 "Scuba diving and fishing (including but not limited to fishing by hook and line, by cast net, and by spear) are also prohibited in this specific area from November 15 through March 31.",
 scope="Kings Bay Manatee Refuge: all waters of Kings Bay including tributaries upstream of the confluence of Kings Bay and Crystal River. Manatee sanctuaries generally: all waterborne activities prohibited 15 Nov – 31 Mar."))

L.append(E("cfr-50-32-28","50 C.F.R. § 32.28","National Wildlife Refuges in Florida","federal","cfr",
 "https://www.ecfr.gov/current/title-50/section-32.28",
 "A refuge is CLOSED to fishing unless part 32 opens it. Ten Thousand Islands NWR expressly bans spears in its fresh/brackish marsh.",
 "We prohibit the use of trotlines, gigs, spears, bush hooks, and snatch hooks in the freshwater and brackish marsh area. [Ten Thousand Islands NWR]",
 scope="Sixteen Florida refuges opened to sport fishing. Key West NWR, Great White Heron NWR and Crystal River NWR are NOT listed.",
 verified="secondary",
 note="UNVERIFIED: the precise status of spearfishing in Key West NWR and Great White Heron NWR waters. In practice they are treated as open to FWC-regulated fishing and are separately regulated as FKNMS Existing Management Areas. Resolve against each refuge's own regs and 50 C.F.R. pt. 26 before relying on this."))

L.append(E("cfr-33-165-760","33 C.F.R. §§ 165.759–.761, .785","Coast Guard security zones","federal","cfr",
 "https://www.ecfr.gov/current/title-33/part-165/subpart-F",
 "Entry prohibited without Captain of the Port authorization. Moving 100-yard zones around passenger and hazardous-cargo vessels.",
 "Entry into these zones is prohibited, except as authorized by the Captain of the Port of Miami or a designated representative.",
 scope="§ 165.760 Port of Palm Beach, Port Everglades, Port of Miami · § 165.761 Port of Key West · § 165.759 Jacksonville, Fernandina, Canaveral · § 165.785 Presidential Security Zone, Palm Beach · § 165.701 Kennedy Space Center.",
 note="Moving zones activate at Lake Worth Lighted Buoy LW (26°46'22\"N 80°00'37\"W), Port Everglades PE (26°05'30\"N 80°04'46\"W) and Miami Lighted Buoy M (25°46'05\"N 80°05'01\"W). COTP Miami 305-535-4472, VHF 16."))

L.append(E("cfr-33-334","33 C.F.R. pt. 334","Military danger zones and restricted areas","federal","cfr",
 "https://www.ecfr.gov/current/title-33/part-334",
 "38 Florida sections. Entry is restricted or prohibited, often on a schedule.",
 "[Per-area restrictions; see the individual section for each area.]",
 scope="Diver-relevant: § 334.580 Atlantic Ocean near Port Everglades · § 334.610 Key West Harbor Naval Base · § 334.620 Straits of Florida and Florida Bay near Key West (NAS Key West training/gunnery/bombing) · §§ 334.525/.590/.595 Atlantic off Cape Canaveral · §§ 334.540/.560/.570 Banana River · §§ 334.630/.635 Tampa/Hillsborough Bay (MacDill) · §§ 334.640–.780 Panhandle (Tyndall, Eglin, NSA Panama City, NAS Pensacola)."))

# ---------------- STATE ----------------
L.append(E("fs-379-2425","Fla. Stat. § 379.2425","Spearfishing — statutory closures","state","statute",
 "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0379/Sections/0379.2425.html",
 "Closes John Pennekamp Coral Reef State Park, the waters of Collier County, and the Upper Keys. Possession of a spear in the water there is prima facie evidence of a violation.",
 "Except as otherwise provided by commission rule or order, spearfishing is prohibited within the boundaries of the John Pennekamp Coral Reef State Park, the waters of Collier County, and the area in Monroe County known as Upper Keys, which includes all salt waters under the jurisdiction of the commission beginning at the county line between Miami-Dade and Monroe Counties and running south, including all of the keys down to and including Long Key.",
 full="(1) For the purposes of this section, 'spearfishing' means the taking of any saltwater fish through the instrumentality of a spear, gig, or lance operated by a person swimming at or below the surface of the water.\n\n(2)(b) ... the possession in the water of a spear, gig, or lance by a person swimming at or below the surface of the water in a prohibited area is prima facie evidence of a violation ...\n\n(3) The commission may create additional restricted areas following investigation, application by local governing bodies, publication in local newspapers, and a local agreement to post and maintain notices.\n\n(4) A person who violates this section commits a Level Two violation under s. 379.401.",
 note="IMPORTANT: FWC has REOPENED Collier County by rule — see 68B-20.003(1)(a). The statute's Collier closure is superseded. The Monroe/Upper Keys closure stands: Miami-Dade county line south through and including Long Key."))

L.append(E("fac-68b-20-002","Fla. Admin. Code r. 68B-20.002","Definitions — spearing, spearfishing, gigging, bow hunting","state","rule",
 "http://flrules.elaws.us/fac/68B-20.002",
 "Gigging (at or above the surface) and spearfishing (in the water) are legally distinct categories.",
 "'Gigging' means the catching or taking of a fish through the instrumentality of a single or multi-pronged gig or spear, barbed or barbless, deployed at or above the surface of the water. 'Spearfishing' means the catching or taking of a fish through the instrumentality of a hand or mechanically propelled, single or multi-pronged spear or lance [operated by a person in the water]. 'Spearing' means the catching or taking of a fish by bow hunting, gigging, spearfishing, or by any device used to capture a fish by piercing its body [excluding hook-and-line and snagging].",
 note="This distinction matters: a rule that says 'spearing' catches gigging too; a rule that says 'spearfishing' does not."))

L.append(E("fac-68b-20-003-1","Fla. Admin. Code r. 68B-20.003(1)","Spearing lawful statewide — and Collier reopened","state","rule",
 "http://flrules.elaws.us/fac/68B-20.003",
 "The default is YES. Spearing is lawful in all Florida salt waters except where a rule closes it. Collier County is expressly reopened.",
 "Spearing is lawful in all salt waters and salt tributaries located in the State of Florida except: (a) As provided in Section 379.2425, F.S. Notwithstanding the prohibition contained in that section, spearfishing is allowed in state waters off Collier County except as prohibited in this chapter and elsewhere in Division 68B, F.A.C.; and, (b) As prohibited in this chapter, and elsewhere in Division 68B, F.A.C.",
 note="This subsection is the single most commonly missed rule in Florida spearfishing. Collier County is OPEN despite what the statute says."))

L.append(E("fac-68b-20-003-2","Fla. Admin. Code r. 68B-20.003(2)","The four statewide buffers","state","rule",
 "http://flrules.elaws.us/fac/68B-20.003",
 "100 yd from bathing beaches, fishing piers and fishable bridges; 100 ft from jetties; all state park waters.",
 "Spearfishing is prohibited: (a) Within 100 yards of all public bathing beaches; (b) Within 100 yards of all commercial or public fishing piers; (c) Within 100 yards of that portion of any bridge where public fishing is legally permitted; (d) Within 100 feet of the unsubmerged portion of any jetty, except that spearfishing shall be allowed along the last 500 yards of any jetty that extends more than 1,500 yards from the shoreline; (e) In or on any body of water under the jurisdiction of the Division of Recreation and Parks of the Department of Environmental Protection. Possession of spearing equipment in or on any body of water under the jurisdiction of the Division of Recreation and Parks is prohibited except when such equipment is not loaded and is properly stored upon watercraft passing nonstop through such marine waters.",
 note="THE JETTY BUFFER IS 100 FEET, NOT 100 YARDS — the other three are 100 yards. That unit change is the single most dangerous thing in this rule. The list ENDS at (e); there is no (f). The chapeau reads 'Except as provided in Rule 68B-20.004, F.A.C., SPEARFISHING is hereby prohibited' — the operative word is spearfishing, not spearing, so gigging deployed at or above the surface is NOT caught by (a)-(d). Only (e) reaches the broader term 'spearing equipment'. Every buffer is feature-relative; FWC publishes no authoritative geometry, so every buffer on this map is digitized and approximate. Buffer (c) attaches only to bridge portions 'where public fishing is legally permitted' — see § 316.1305."))

L.append(E("fac-68b-20-003-7","Fla. Admin. Code rr. 68B-20.003(7), 68B-4.012","Powerheads, bangsticks, rebreathers, freshwater","state","rule",
 "http://flrules.elaws.us/fac/68B-4.012",
 "No powerheads or bangsticks to harvest. No harvest on a rebreather except lionfish. No spearing marine species in fresh water.",
 "No person shall use any powerhead to harvest any fish in state waters. Powerheads may be possessed while diving in state waters for the purpose of personal protection. Except for persons harvesting lionfish (genus Pterois), no person diving in state waters by means of a rebreather shall harvest any marine species.",
 note="Possession aboard a vessel of any non-lionfish taken by powerhead or rebreather is itself a violation. Also prohibits harvesting marine species with a hand- or mechanically-propelled spear while diving in fresh water."))

L.append(E("fac-68b-20-005","Fla. Admin. Code r. 68B-20.005","Species that may never be taken by spear","state","rule",
 "http://flrules.elaws.us/fac/68B-20.005",
 "28 species and family groups. Broader than FWC's public digest.",
 "The spearing of the following species and species groups is prohibited: billfish (Xiphias, Istiophorus, Makaira, Tetrapturus); sturgeon; tarpon; bonefish; goliath grouper; Nassau grouper; permit; pompano; African pompano; sharks (as defined in r. 68B-44.002); spotted eagle ray; manta ray; snook; red drum; spotted seatrout; weakfish; tripletail; surgeonfish; trumpetfish; angelfish and butterflyfish; porcupinefish; cornetfish; squirrelfish; trunkfish; damselfish; parrotfish; pipefish and seahorse; puffers.",
 note="This rule has NEVER been amended since 1 January 1998 — it still reads 'Jewfish (Epinephelus itajara)', the pre-1999 name for goliath grouper. The 2023 limited goliath harvest did not touch it, so goliath remains prohibited by spear; Nassau grouper likewise. Spiny lobster is separately protected: r. 68B-24.006 bans any device that could puncture, penetrate or crush the shell or flesh."))

L.append(E("fac-68b-20-004","Fla. Admin. Code r. 68B-20.004","Non-native / lionfish tournament exception","state","rule",
 "https://regulations.justia.com/states/florida/68/68b/chapter-68b-20/section-68b-20-004/",
 "FWC's Executive Director may permit spearing of non-native species in otherwise-closed areas for a tournament of 10+ registered participants, up to one week.",
 "Exception to Statewide Spearing Prohibitions.",
 note="It cannot authorize activity in FKNMS, federal parks, or state parks without those agencies' own permits."))

L.append(E("fac-62d-2-014","Fla. Admin. Code r. 62D-2.014(9)","State parks — spearfishing prohibited in all of them","state","rule",
 "http://flrules.elaws.us/fac/62D-2.014",
 "Flat, unqualified ban across every Florida state park's waters.",
 "(9)(a) Fishing is allowed in park waters, by any legal method, except where prohibited by the Division and under the provisions of this chapter. ... (9)(d) Spearfishing is prohibited in all state parks.",
 scope="Every Florida state park, without exception. There is no per-park list to compile.",
 note="CORRECTED 22 Aug 2026. The 400-foot figure in (9)(b) has NOTHING to do with spearfishing — it authorises commercial food and bait fishing on sovereign submerged lands within 400 ft of the mean high water line inside a park's riparian lines. Earlier project research treated it as a spearfishing buffer. It is not. (9)(d) is unqualified, and r. 68B-20.003(2)(e) independently reaches the whole jurisdiction of the DEP Division of Recreation and Parks. Map the surveyed park water boundary. Divers' highest-traffic conflicts: John Pennekamp (also closed by statute), Bahia Honda, Long Key, Curry Hammock, St. Lucie Inlet Preserve, Sebastian Inlet, Fort Zachary Taylor, Anclote Key Preserve."))

L.append(E("fac-68a-19-005","Fla. Admin. Code r. 68A-19.005(1)(b)","Critical Wildlife Areas","state","rule",
 "http://flrules.elaws.us/fac/68A-19.005",
 "Take of fish prohibited in any posted CWA. Some are additionally closed to all public access.",
 "The take of fish and wildlife is prohibited within any area posted as a critical wildlife area, except as authorized in the order establishing the critical wildlife area. ... Areas in which regulations are to be enforced shall be posted as a 'Critical Wildlife Area' to provide due notice as to the identity and status of the area.",
 verified="verbatim",
 note="Two tiers: take prohibited in every posted CWA; public access additionally prohibited only where posted 'Closed to Public Access'. Most CWAs are small mangrove and spoil-island rookeries in the Indian River Lagoon, Tampa Bay, Florida Bay and the Keys. GEOMETRY NOT YET ON THIS MAP — FWC's CWA GIS layer has not been retrieved."))

L.append(E("fac-68b-3-008","Fla. Admin. Code r. 68B-3.008(3)(a)","Volusia County — inland salt waters","state","rule",
 "http://flrules.elaws.us/fac/68B-3.008",
 "Spearing prohibited in Volusia's inland salt waters, except legal-size flounder and sheepshead with a barbed spear of three prongs or fewer.",
 "Legal size flounders and sheepshead may be taken by the means of a barbed spear, with not more than three (3) prongs.",
 scope="Volusia County inland salt waters — which includes the Mosquito Lagoon side of Canaveral National Seashore.",
 note="UNVERIFIED BOUNDARY: the rule does not define 'inland salt waters'. Treat the whole Halifax River / Mosquito Lagoon system as covered."))

L.append(E("fac-68b-3-038","Fla. Admin. Code r. 68B-3.038","Palm Beach County special acts — partial repeal","state","rule",
 "http://flrules.elaws.us/fac/68B-3.038",
 "FWC repealed three Palm Beach fisheries special acts and expressly did NOT repeal the two spearfishing refuge acts.",
 "Repeal of Palm Beach County Special Acts of Local Application. [Repeals Sections 2 and 3 of Chapter 8796, Laws of Florida (1921), as amended by Chapter 11005 and Chapter 15301; Sections 2 and 3 of Chapter 20045, Laws of Florida (1939); and Section 4 of Chapter 31137, Laws of Florida (1955).]",
 note="Chapters 59-1699 and 59-1702 — the spearfishing refuge acts behind PBC Code App. G ch. 13 art. II — are NOT in this list. FWC worked through this county's fisheries acts and left those two standing. That is a deliberate-looking omission and it guts the implied-preemption argument. Plan as though the refuges bind you."))

L.append(E("pbc-13-55","Palm Beach County Code, App. G, ch. 13, art. II, div. 2, §§ 13-54 to 13-59","Palm Beach spearfishing refuge areas (Laws of Fla. chs. 59-1699, 59-1702)","county","specialact",
 "https://library.municode.com/fl/palm_beach_county/codes/code_of_ordinances?nodeId=VOII_APXGLOLA_CH13FI_ARTIISPFI",
 "Two latitude-bounded refuges off Palm Beach where spearfishing on underwater breathing apparatus is prohibited. Freediving is NOT restricted by this division.",
 "§ 13-56: No person may engage in spear fishing within any of the above described refuge areas while using underwater breathing apparatus.",
 full="§ 13-55 — Area No. 1 is bounded on the South by Latitude 26° 44' 51\" N and on the North by Latitude 26° 45' 48\" N. Area No. 2 is bounded on the South by Latitude 26° 46' 38\" N and on the North by Latitude 26° 47' 38\" N. Excluding however, from the above defined refuge areas those waters of a depth of less than thirty (30) feet at mean low water and those waters lying less than seven hundred fifty (750) yards from the mean high water line of the shoreline of the Atlantic Ocean.\n\n§ 13-54(d) defines 'underwater breathing apparatus' broadly — self-contained or surface-supplied, any gas, any apparatus letting a submerged person breathe without surfacing.\n\n§ 13-57 makes possession of scuba plus a spear inside a refuge prima facie evidence — EXCEPT when in a boat or conveyance used to transport them. Transiting with tanks and a gun aboard is expressly fine. Barbless knives and lances carried purely for protection are carved out.\n\n§ 13-59 makes violation of Division 2 a misdemeanour.",
 scope="Area No. 1: 26.747500 N to 26.763333 N. Area No. 2: 26.777222 N to 26.793889 N. The 0.83 nm gap between them (26.763333–26.777222 N) is unrestricted, and the north jetty tip at 26.773512 N sits inside it.",
 note="SCUBA ONLY. A breath-hold diver is outside § 13-56's operative prohibition. The 1959 prose landmarks are expressly 'approximate' — the latitudes control. The 750 yd and 30 ft carve-outs rescue no offshore site. Read verbatim from Municode 21 Aug 2026."))

L.append(E("fs-327-331","Fla. Stat. § 327.331","Divers-down device","state","statute",
 "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0327/Sections/0327.331.html",
 "Flag or buoy required. 100 ft stay-near in rivers, inlets and navigation channels; 300 ft everywhere else.",
 "A divers-down buoy may not be used or displayed onboard a vessel. ... [In rivers, inlets and navigation channels] divers shall make reasonable efforts to stay within 100 feet [and vessels shall] maintain a distance of at least 100 feet. [In all other waters, 300 feet.]",
 full="Flag: square or rectangular, symbol on each face; at least 12 in × 12 in displayed from the water; at least 20 in × 24 in displayed from a vessel, with a wire stiffener. Symbol: rectangular or square red symbol with a white diagonal stripe. Buoy: symbol on at least three sides. Vessels forced closer must proceed no faster than is necessary to maintain headway and steerageway. The device must be removed when diving ceases.",
 note="A mask and snorkel makes you a diver — freediving counts."))

L.append(E("fs-316-1305","Fla. Stat. § 316.1305","Fishing from state road bridges","state","statute",
 "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0316/Sections/0316.1305.html",
 "Bridge fishing is lawful UNLESS FDOT investigates, finds it dangerous, and posts signs. All three steps required.",
 "(1) [FDOT] may investigate whether fishing from a bridge endangers traffic safety or human life; upon such a finding it shall post signs prohibiting fishing. (2) Fishing on a posted bridge is a noncriminal traffic infraction, punishable as a pedestrian violation as provided in chapter 318. (3) This section supplements and does not repeal special laws on bridge fishing.",
 note="NEGATIVE FINDING: there is no statewide register or GIS layer of posted bridges. Postings are made district-by-district by FDOT and are not published. Because 68B-20.003(2)(c) attaches its 100-yd buffer only to bridges 'where public fishing is legally permitted', a posted bridge arguably carries NO spearfishing buffer — but since postings cannot be enumerated, this map buffers every bridge with a fishing catwalk. Verify on site."))

L.append(E("fs-379-354","Fla. Stat. §§ 379.354, 379.353(2)","Recreational saltwater fishing licence","state","statute",
 "https://myfwc.com/license/recreational/saltwater-fishing/",
 "Required to take any saltwater organism, and to land saltwater species in Florida regardless of where caught. Spearfishing is fishing.",
 "[A licence is required] to take or attempt to take saltwater fish, crabs, clams, marine plants or other saltwater organisms [and] to land saltwater species in Florida regardless of where they are caught.",
 full="Resident annual $17; non-resident annual $47. Exemptions under § 379.353(2): under 16; own/spouse's/minor child's homestead; Armed Forces on leave ≤30 days; residents fishing in their county of residence with live or natural bait on poles or lines without a retrieval mechanism (does not apply to spearfishing); private ponds ≤20 acres; developmental disabilities; low-income with DCF/Medicaid card; fishing from a licensed vessel or with a licensed operator; valid commercial licence holders; residents 65+; FWC employees on duty; permitted disabled-veteran and active-duty events.",
 note="The free SHORELINE licence is 'not valid when fishing from a vessel'. Whether it covers a shore-entry diver is UNVERIFIED — treat yourself as needing the full licence."))

L.append(E("fac-68b-14-009","Fla. Admin. Code r. 68B-14.009 (\u201cReporting Requirement\u201d)","State Reef Fish Survey — the angler/diver designation","state","rule",
 "https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-68B-14-009",
 "Free, annual, separate from your licence. Required of divers as well as anglers from a private vessel. Proof must be on your person.",
 "Recreational harvesters are required to report their intention to harvest or attempt to harvest certain reef fish species annually. ... Proof of submission of the report required in subsection (1), must be in the personal possession of the recreational harvester.",
 scope="Almaco jack, banded rudderfish, greater amberjack, lesser amberjack, gray triggerfish, black grouper, gag grouper, red grouper, hogfish, mutton snapper, red snapper, vermilion snapper, yellowtail snapper.",
 note="The 65-and-over licence exemption does NOT exempt you from this — seniors must still obtain it every year. CURRENCY WARNING: this rule is amended effective 1 September 2026. Re-verify the species list after that date."))

L.append(E("fac-68b-42-0036","Fla. Admin. Code r. 68B-42.0036(3)(a)","Blue Heron Bridge Special Marine Life Area","state","rule",
 "http://flrules.elaws.us/fac/68B-42.0036",
 "Ornamental marine life may not be harvested or possessed. This is NOT a spearfishing closure — food fish are unaffected.",
 "A person may not harvest or possess any tropical ornamental marine life species or any tropical ornamental marine plant [within the area].",
 scope="Phil Foster County Park, Palm Beach County. Corners: 26°46.917'N 80°02.713'W · 26°46.917'N 80°02.388'W · 26°47.161'N 80°02.382'W · 26°47.161'N 80°02.713'W.",
 note="The only Special Marine Life Area in the entire Florida Administrative Code. Continuous-transit exception and a landing exception at the Phil Foster ramp and docks."))

L.append(E("fac-18-20-012","Fla. Admin. Code r. 18-20.012; Fla. Stat. ch. 258 pt. II","Aquatic preserves — NOT a spearfishing closure","state","rule",
 "http://flrules.elaws.us/fac/18-20.012",
 "Aquatic preserves do not restrict recreational spearfishing. Public fishing rights are expressly preserved.",
 "Members of the public may exercise their rights to fish, so long as not contrary to other statutory and regulatory provisions controlling such activities. The taking of indigenous life forms for sale or commercial use is prohibited, except that this prohibition shall not extend to the commercial taking of fin fish, crustacea or mollusks.",
 note="Deliberately NOT mapped. The aquatic-preserve polygon set is enormous (Lake Worth Lagoon, Biscayne Bay, Indian River, Loxahatchee River, Estero Bay) and drawing it as a closure would be actively misleading."))

L.append(E("fac-68c-22","Fla. Admin. Code ch. 68C-22","Manatee protection zones","state","rule",
 "https://www.flrules.org/gateway/ChapterHome.asp?Chapter=68C-22",
 "Vessel-speed regulation only. No spearfishing or diving prohibition.",
 "[Per-county vessel speed zones.]",
 note="Map these as boat-operation constraints, not closures. The federal manatee rule (50 C.F.R. § 17.108) is the one that actually bans diving and spearing, and only at Three Sisters Springs."))

L.append(E("fs-267-13","Fla. Stat. § 267.13","Submerged archaeological sites","state","statute",
 "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0200-0299/0267/Sections/0267.13.html",
 "Look, don't take. Disturbing an archaeological site on state land without a permit is a first-degree misdemeanor; excavation is a third-degree felony.",
 "[Non-excavation investigation of or alteration to an archaeological site located on state land without a permit is a misdemeanor of the first degree; excavation-based violations are a felony of the third degree, with potential forfeiture of vehicles and equipment.]",
 note="No direct effect on spearfishing. Florida's twelve Underwater Archaeological Preserves are open dive trails, not closed areas. Administrative fines to $500/day; restitution for archaeological value, commercial value and restoration costs."))

L.append(E("fs-379-101-33","Fla. Stat. § 379.101(33); Fla. Admin. Code r. 62-302.200(30)","Fresh water vs. salt water — where the line falls","state","statute",
 "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0379/Sections/0379.101.html",
 "Florida's legal test for salt water is a TASTE test, not a salinity number. There is no statewide per-river line and no FWC GIS layer.",
 "\u2018Salt water,\u2019 except where otherwise provided by law, shall be all of the territorial waters of Florida excluding all lakes, rivers, canals, and other waterways of Florida from such point or points where the fresh and salt waters commingle to such an extent as to become unpalatable because of the saline content, or from such point or points as may be fixed for conservation purposes by the Department of Environmental Protection and the Fish and Wildlife Conservation Commission, with the consent and advice of the board of county commissioners of the county or counties to be affected.",
 full="The fresh/salt line matters because it decides which licence you need, which bag limits apply, and whether 68B-4.012's freshwater spearing ban bites.\n\nThe operative words are 'unpalatable and unfit for human consumption because of the saline content'. There is NO salinity number anywhere in Florida fisheries law. Closest associated numbers, none of them binding here:\n\n• 1,000 mg/L total dissolved solids — the WHO drinking-water palatability threshold and the USGS fresh/saline divide. This is the best textual match to 'unpalatable', but it is not Florida law and not a fisheries standard.\n\n• 1,500 mg/L chloride, or 4,580 µmhos/cm specific conductance, measured in the bottom half of the water column — Fla. Admin. Code r. 62-302.200(30), the definition of 'predominantly marine waters'. This is the ONLY enforceable numeric salinity line in Florida law, but it belongs to DEP water-quality classification, not to FWC fisheries licensing.\n\n• Only the Steinhatchee River has a designated statutory fresh/salt boundary. FWC publishes no per-river list and no GIS layer. Verified negative.\n\nNovel argument worth knowing: § 379.101(33) drops the words 'and unfit for human consumption' that appear elsewhere, so on its face it triggers on UNPALATABILITY ALONE — a materially lower threshold.\n\nOther states do NOT help: Mississippi, South Carolina and Louisiana all draw geographic lines (I-10, US 17, the Intracoastal Waterway), not salinity lines. Louisiana's legislature expressly rejected salinity as 'insusceptible of precise location by reason of the changes in water salinity caused by winds, tides, and rains.'",
 verified="verbatim",
 note="Practical upshot: in brackish water you cannot know which regime you are in from a meter. Carry both licences, and treat the strictest applicable rule as controlling. This map's inland/tidal/coastal classification is a PLANNING heuristic built from FWC's own ramp labels — it has no legal force."))

# ---------------- COUNTY / CITY ----------------
L.append(E("monroe-26-5","Monroe County Code § 26-5","Spearguns — manmade canals","county","ordinance",
 "https://library.municode.com/fl/monroe_county/codes/code_of_ordinances?nodeId=CH26WA_ARTIINGE",
 "Discharging a speargun in any manmade canal in unincorporated Monroe County is unlawful. Conviction forfeits the gun to the Sheriff for destruction.",
 "(a) Prohibited activity. It is unlawful for any person to use, fire or discharge any speargun, as defined in this section, on or below the surface of any manmade canal in the unincorporated areas of the county.\n\n(b) Penalties. Any person convicted of a violation of this section shall be penalized in accordance with section 1-8. In addition, any person convicted of a violation of this section shall forfeit the speargun used by such person in committing such offense to the county sheriff for destruction in the same manner as forfeited firearms are disposed of by the sheriff.",
 full="§ 26-1 definition: 'Speargun means any device whether commercially manufactured or hand-made, that is designed and constructed so as to be capable of forcefully discharging at great velocity any spear or any similar projectile in a direction determined by the user thereof for a distance greater than two feet (24 inches) whether or not such spear or projectile is tethered to the firing apparatus or otherwise limited in its range. No distinction shall be made as to the mechanical construction or physical means used in such devices to create the potential energy necessary to eject or fire such spear or similar projectiles.'\n\n§ 26-1 also defines: 'Manmade water body means a water body that was created by excavation by mechanical means under human control and shall include a canal, cut basin, or channel where its edges or margins have subsequently been modified by natural forces.'\n\nHistory: Code 1979, § 13-5; Ord. No. 23-1984, § 1. Monroe code current through Ordinance No. 022-2026, Supp. No. 33 Update 2, 6 Aug 2026.",
 scope="Manmade canals in UNINCORPORATED Monroe County. The Monroe County State Attorney's Office also lists the City of Marathon as covered.",
 note="THE 24-INCH RULE MATTERS: the definition catches any device that can propel a projectile more than two feet, tethered or not, regardless of power source. A pole spear longer than 24 inches of travel, a Hawaiian sling, and a band gun are all caught. Note this is a DISCHARGE ban, not a possession ban — transiting a canal with a stowed gun is not within the operative words.\n\nAlso note: most of the Keys above Long Key is already closed by Fla. Stat. § 379.2425 anyway. Read verbatim from Municode 22 Aug 2026."))

L.append(E("marathon-canal","City of Marathon — section number not located","Marathon speargun ban in manmade canals","city","ordinance",
 "https://www.keyssao.org/192/Prohibited-Areas",
 "The Monroe County State Attorney lists Marathon's manmade canals alongside unincorporated Monroe as prohibited to spearguns.",
 "[Prohibited:] any manmade canal in the unincorporated areas of Monroe County or the city of Marathon.",
 verified="secondary",
 note="UNCITED. The exact Marathon code section could not be located — the city's Municode client is unreachable and its other code hosts return errors. The source is the office that actually prosecutes these cases, so treat the restriction as real, but the citation is outstanding. Marathon incorporated in 1999 and most likely carried Monroe County Code § 26-5 forward by adoption ordinance. Confirm with the Marathon City Clerk."))

L.append(E("spb-54-4","City of St. Pete Beach Code § 54-4","Discharge of spear guns — entire city","city","ordinance",
 "https://library.municode.com/fl/st._pete_beach/codes/code_of_ordinances?nodeId=PTIICOOR_CH54MIOF_S54-4DISPGU",
 "Discharging a speargun anywhere within the St. Pete Beach city limits is unlawful, on land or in water.",
 "It shall be unlawful for any person to use, discharge or cause to be discharged any spear or harpoon by or with a spring gun, mechanic gun, power gun or any mechanic device whatsoever within the corporate limits except for firearms which the City has the authority to regulate pursuant to F.S. § 790.33, including amendments thereto enacted by Laws of Florida Chapter 2011-109.",
 scope="The entire corporate limits of the City of St. Pete Beach.",
 note="This bans the DEVICE, not 'spearfishing', so it is not limited to saltwater fish. A pole spear or Hawaiian sling arguably falls outside 'spring gun, mechanic gun, power gun or any mechanic device'. History: Code 1960 § 16-15; Code 1983 § 12-7; Ord. No. 11-29 (2011). The code's own state-law reference points to the REPEALED § 370.172, dating the substance to before 1998. PREEMPTION RISK: Fla. Stat. § 379.2425(3) vests closure power in FWC, and FAC ch. 68B-3 shows FWC stripping local marine-fisheries authority. Untested. Plan around it anyway."))

L.append(E("spb-94-1","City of St. Pete Beach Code § 94-1","Swimming, skin diving and wading prohibited — Blind Pass","city","ordinance",
 "https://library.municode.com/fl/st._pete_beach/codes/code_of_ordinances?nodeId=PTIICOOR_CH94WA",
 "You may not swim, skin dive or wade in Blind Pass south of the 75th Avenue centerline extension.",
 "No person shall swim, skin dive or wade in any of the following places: (1) The waters of Blind Pass within the city limits lying south of an extension of the centerline of 75th Avenue.",
 note="Chapter 94 also bans diving or jumping from any public bridge (§ 94-2) and restricts fishing in specified areas (§ 94-3)."))

L.append(E("ti-58-34","City of Treasure Island Code § 58-34","Spearfishing prohibited — John's Pass and 1,500 ft either side","city","ordinance",
 "https://library.municode.com/fl/treasure_island/codes/code_of_ordinances?nodeId=PTIICOOR_CH58WA",
 "Express spearfishing ban in John's Pass and 1,500 ft into the Gulf and Boca Ciega Bay from the 127th Avenue termini.",
 "It shall be unlawful for any person to swim, dive, jump in, bathe, float or to engage in spearfishing or skin diving in the waters contained within the city commonly known as John's Pass…",
 scope="(1) The waters of John's Pass; (2) Gulf of Mexico waters extending 1,500 feet west of the mean high water mark at the western terminus of 127th Avenue; (3) Boca Ciega Bay waters extending 1,500 feet east of the eastern terminus of 127th Avenue. Subsection (b) bans jumping, diving and swimming from any bridge or bridge abutment citywide.",
 verified="secondary",
 note="Opening clause read verbatim; the geography was paraphrased by the extraction. Source note: Code 1985 § 20-19. This is the most direct § 379.2425 preemption question of any ordinance in the state — it regulates the taking of saltwater fish by name. Untested."))

L.append(E("sarasota-130-33","Sarasota County Code § 130-33(j)","Spearfishing in marked navigable channels","county","ordinance",
 "https://library.municode.com/fl/sarasota_county/codes/code_of_ordinances?nodeId=PTIICOOR_CH130WA",
 "No skin diving, scuba diving or spearfishing inside any marked navigable channel in Sarasota County without law-enforcement permission.",
 "Except as otherwise provided by State law, it shall be unlawful for any Person to skin dive, scuba dive or spearfish within the bounds of any marked navigable channel unless permission is obtained from an appropriate law enforcement agency.",
 note="Current text — amended by Ord. 2025-043, effective 1 January 2026. The full clause ends '...unless permission is obtained from an appropriate law enforcement agency by showing some necessity for diving in such channel.' The 'Except as otherwise provided by State law' preamble is a deliberate savings clause — this is the only one of the municipal rules drafted to survive preemption. Companion § 130-33(i) bars fishing or operating a motorboat within 100 feet of a displayed diver's flag."))

L.append(E("kcb-5-11","City of Key Colony Beach Code § 5-11","Seasonal diving and snorkeling ban — NOT a spearfishing rule","city","ordinance",
 "https://library.municode.com/fl/key_colony_beach/codes/code_of_ordinances?nodeId=PTIICOOR_CH5BOBOTRMAFAWA",
 "During the lobster window, diving or snorkeling in KCB canals, marinas, or within 300 ft of improved shoreline is a public nuisance. $250 per violation.",
 "It is a public nuisance and unlawful for any person to dive or snorkel in any navigable canal, marina, or within three hundred (300) feet of an improved residential or commercial shoreline [during the period from 4 days before lobster mini-season through 10 days after the commercial lobster season opens].",
 verified="secondary",
 scope="City of Key Colony Beach. Seasonal: 4 days before mini-season through 10 days after the commercial season opens.",
 note="CORRECTED 22 Aug 2026. This is a lobster-season diving and snorkeling ban, NOT a spearfishing ordinance — Key Colony Beach Chapter 5 contains no spearfishing provision at all. An earlier project note cited § 5-7(c) as a related exception; § 5-7(c) is actually MARINE SANITATION (holding tanks) and was cited in error. KCB sits inside the § 379.2425 Upper Keys closure regardless, where spearfishing is already prohibited."))

L.append(E("layton-50-1","City of Layton Code § 50-1","Lobster & stone crab sanctuary — NOT a spearfishing rule","city","ordinance",
 "https://library.municode.com/fl/layton/codes/code_of_ordinances?nodeId=SPAGEOR_CH50WA",
 "No taking spiny lobster or stone crab by any means, including diving and spearing, in any water within the Layton city limits.",
 "No person shall remove by any means, whether by trap, diving, spearing or otherwise, any Florida Spiny Lobster or Stone Crabs from any waters within the city limits of the City of Layton, Florida.",
 scope="All waters within the City of Layton city limits (Long Key).",
 note="CORRECTED 22 Aug 2026. Spearing appears here only as one prohibited METHOD of taking lobster and stone crab — finfish spearfishing is not addressed by this ordinance. Penalty $25-$250 per offence, per day (Ord. 2013-07-02). Still a municipal marine-fisheries closure and a prime preemption candidate under § 379.2425 and FAC chs. 68B-3 / 68B-24. Untested. And Layton is inside the § 379.2425 Upper Keys closure anyway."))

L.append(E("fs-790-33","Fla. Stat. § 790.33; Fla. Stat. § 379.2425(3); Fla. Admin. Code ch. 68B-3","Preemption — can a city regulate spearfishing at all?","state","statute",
 "https://www.flrules.org/gateway/ChapterHome.asp?Chapter=68B-3",
 "One real preemption vector, not two. Every municipal spearfishing ordinance is on contested ground, and none has been tested in court.",
 "[Fla. Stat. § 379.2425(3):] The commission may create additional restricted areas following investigation, application by local governing bodies, and publication in local newspapers.",
 full="VECTOR 1 — fisheries. § 379.2425(3) says the lawful route for a local government is to PETITION FWC, not to legislate directly. FAC ch. 68B-3 is a systematic FWC repeal of county fisheries special acts across 30+ counties, and r. 68B-20.003(8) repeals the spearing special acts of Brevard, Citrus, Collier, Hernando, Hillsborough, Pasco and Sarasota outright. That is a strong implied-preemption story.\n\nVECTOR 2 — weapons — IS WEAKER THAN THIS PROJECT PREVIOUSLY CLAIMED. Verified 22 Aug 2026: § 790.33 preempts the field of FIREARMS AND AMMUNITION only. It says nothing about spearguns. St. Pete Beach's § 54-4 carves firearms out of its own speargun ban precisely because § 790.33 does not reach the speargun half — that carve-out is evidence the city understood the limit, not evidence the ordinance is vulnerable. Do not rely on § 790.33 against a local speargun rule.\n\nBUT — the counter-argument is strong where FWC declined to repeal. FWC repealed three Palm Beach fisheries special acts in r. 68B-3.038 and left chs. 59-1699 and 59-1702 standing. It is very hard to argue FWC impliedly preempted acts it expressly declined to repeal while repealing their neighbours in the same rule.\n\nNO CASE LAW construes any of this. Do not plan a dive around a preemption argument.",
 verified="verbatim",
 note="This map treats every local ordinance as live and enforceable. That is the conservative-with-margin posture the project was built on."))

# ---------------- NEGATIVE FINDINGS ----------------
L.append(E("neg-miamidade","Miami-Dade County Code ch. 7 — NEGATIVE","No Miami or Miami-Dade spearfishing ordinance","county","negative",
 "https://library.municode.com/fl/miami_-_dade_county/codes/code_of_ordinances",
 "There is no Miami-Dade canal spearfishing ban. The widely repeated 'Miami canal rule' is actually Monroe County § 26-5.",
 "[Chapter 7 'Boats, Docks and Waterways' read in full — 72,160 characters — with zero occurrences of spear, speargun or spearfish.]",
 verified="verbatim",
 note="Read in a real browser 22 Aug 2026. Miami-Dade's fisheries special acts were separately repealed by FAC r. 68B-3.034. If someone tells you Miami bans spearfishing in canals, they are thinking of the Keys."))

L.append(E("neg-keywest","City of Key West Code chs. 82, 42, 26 — NEGATIVE","No Key West spearfishing ordinance","city","negative",
 "https://library.municode.com/fl/key_west/codes/code_of_ordinances",
 "Key West has no municipal spearfishing, speargun or diving restriction.",
 "[Ch. 82 Waterways (arts. I–III), ch. 42 Misc. Offenses (§§ 42-1 to 42-18), and ch. 26 Environment incl. Use of Beaches and Use of Parks all read; no spear, speargun or diving provision.]",
 verified="verbatim",
 note="The only fish-adjacent rule is § 26-67, cleaning fish on city beaches. The binding rules in Key West waters are federal (FKNMS) and state."))

L.append(E("neg-misc","Clearwater ch. 33 · Cape Coral ch. 10 · Indian River County · Fort Lauderdale chs. 8, 16 · Lee County ch. 30 · Escambia ch. 102 · Destin ch. 5 — NEGATIVE","Jurisdictions checked with no spearfishing ordinance","city","negative",
 "https://library.municode.com/fl/",
 "Seven jurisdictions commonly rumoured to restrict spearfishing do not.",
 "[Chapters read in full; no spearfishing provision found in any of them.]",
 verified="verbatim",
 note="Clearwater § 33.117 is 'Permitted vessels and operations' — vessel regulation, not spearfishing; the rumour is wrong. Indian River County ch. 300 is 'Alcoholic Beverages'; Title III has no waterways or fishing chapter. Cape Coral § 10-22 covers only signed swimming-only and vessel-exclusion zones. Lee County § 30-22 is enabling language with no standing closure. Miami Beach is a PROBABLE negative — the well-publicized South Beach snook-spearing case was charged entirely under state law with no city code count."))

L.append(E("neg-bridgeregister","Fla. Stat. § 316.1305 — NEGATIVE","No statewide register of posted no-fishing bridges","state","negative",
 "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0316/Sections/0316.1305.html",
 "FDOT has a posting duty but no registry duty. No published statewide list or GIS layer exists.",
 "[Negative finding — searched FDOT district sources and statewide GIS catalogs.]",
 verified="verbatim",
 note="This is why the bridge layer on this map is split into confirmed / presumed / excluded rather than a simple yes-no."))

L.append(E("neg-freshsalt","Fla. Stat. § 379.101(33) — NEGATIVE","No per-river fresh/salt boundary list or GIS layer","state","negative",
 "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0379/Sections/0379.101.html",
 "Only the Steinhatchee River has a designated statutory fresh/salt boundary. FWC publishes no list and no map.",
 "[Negative finding — verified against FWC rule chapters and GIS catalogs.]",
 verified="verbatim",
 note="See the fresh/salt entry for the full analysis and the salinity numbers that come closest."))

L.append(E("neg-aquatic","Fla. Admin. Code ch. 18-20 — NEGATIVE","Aquatic preserves do not close to spearfishing","state","negative",
 "http://flrules.elaws.us/fac/18-20.012",
 "Deliberately excluded from this map to avoid a large, misleading closure layer.",
 "Members of the public may exercise their rights to fish…",
 verified="verbatim"))


L.append(E("cfr-33-165-785","33 C.F.R. § 165.785","Presidential Security Zone, Palm Beach","federal","cfr",
 "https://www.ecfr.gov/current/title-33/chapter-I/subchapter-D/part-165/subpart-F/section-165.785",
 "Three fixed zones across Lake Worth Lagoon and the adjacent Atlantic at Mar-a-Lago. Center zone: entry prohibited without COTP authorization.",
 "Entry into the Center Zone is prohibited unless authorized by the Captain of the Port Miami or a designated representative.",
 scope="CENTER (Lake Worth Lagoon): 26°41'21\"N 80°02'39\"W · 26°41'21\"N 80°02'13\"W · 26°39'58\"N 80°02'20\"W · 26°39'58\"N 80°02'38\"W. WEST (Lake Worth Lagoon): 26°41'21\"N 80°02'39\"W · 26°41'21\"N 80°03'00\"W · 26°39'58\"N 80°02'55\"W · 26°39'58\"N 80°02'38\"W. EAST (Atlantic): 26°41'21\"N 80°02'01\"W · 26°39'57\"N 80°02'09\"W · 26°39'57\"N 80°01'36\"W · 26°41'22\"N 80°01'29\"W.",
 note="Enforced when the President, First Family or other Secret Service protectees are present or expected. West zone: transit with escort at steady speed. East zone: transit at steady speed, notify if stopping. COTP Miami (305) 535-4472, VHF 16. CORRECTION to earlier project research: Palm Beach has FIXED security zones, not only moving ones."))

# Later reviews are layered on by tools/law_updates.py from tools/law-updates/<date>/.
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from law_updates import apply
L, AUDIT = apply(L, "2026-09-30")

data = {"version": "2026-11-11", "entries": L}  # date of the last legal currency check, shown as "Rules current as of"

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "law.json")
with io.open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
# Audit lines go to the pass directory that produced them: "<date>/<file>" tags to tools/law-updates/<date>/,
# everything else (the 30 Sep passes and the 6 Oct release wording) to tools/law-updates/2026-09-30/.
_aud = {}
for a in AUDIT:
    d = a[0].split("/")[0] if "/" in a[0] else "2026-09-30"
    _aud.setdefault(d, []).append(a)
for d, rows in _aud.items():
    with io.open(os.path.join(os.path.dirname(OUT), "..", "tools", "law-updates", d, "AUDIT.txt"),
                 "w", encoding="utf-8") as f:
        for a in rows:
            f.write(" | ".join(a) + "\n")
print("entries:", len(L), "bytes:", os.path.getsize(OUT))
ids = [e["id"] for e in L]
assert len(ids) == len(set(ids)), "dup ids"
