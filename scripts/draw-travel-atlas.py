"""Wuhan transit as a spacious, layered river panorama; not a navigation map.

The four official route colours remain recognisable. All moving light paths
follow their corresponding route; the portrait has an explicit quiet area.
"""
from pathlib import Path
import json
from travel_city_engraving import city_engraving

root = Path(__file__).resolve().parents[1]
source = json.loads((root / 'public/assets/travel-atlas-sources.json').read_text(encoding='utf-8'))
colours = {int(x['name'].replace('号线', '')): x['color'] for x in source['lines']}

DEFS = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" fill="none">
<title>水陆之间：武汉地铁与江上轮渡</title><desc>武汉地铁真实线路色与艺术化线路构图。非用于导航的线路地图。</desc>
<defs>
 <linearGradient id="map-wash" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#163f44"/><stop offset="1" stop-color="#163638"/></linearGradient>
 <linearGradient id="water" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#37656a" stop-opacity=".8"/><stop offset=".5" stop-color="#143940"/><stop offset="1" stop-color="#0c2832"/></linearGradient>
 <linearGradient id="gold"><stop stop-color="#5f998d"/><stop offset=".45" stop-color="#d6c38c"/><stop offset="1" stop-color="#8fc4bd" stop-opacity=".2"/></linearGradient>
 <linearGradient id="train" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e3e4d5"/><stop offset=".15" stop-color="#9bb2b0"/><stop offset=".5" stop-color="#d7e1d8"/><stop offset=".68" stop-color="#688e8b"/><stop offset="1" stop-color="#325c60"/></linearGradient>
 <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4d8c93"/><stop offset=".45" stop-color="#163943"/><stop offset="1" stop-color="#0c2735"/></linearGradient>
 <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#cdc7a3"/><stop offset=".25" stop-color="#a4b8a8"/><stop offset="1" stop-color="#244f57"/></linearGradient>
 <linearGradient id="wake"><stop stop-color="#a9d0c4" stop-opacity="0"/><stop offset=".7" stop-color="#acd4c9" stop-opacity=".45"/><stop offset="1" stop-color="#d4dfc7" stop-opacity=".6"/></linearGradient>
 <linearGradient id="quay-stone" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#9ba994"/><stop offset=".42" stop-color="#586f64"/><stop offset="1" stop-color="#2b5455"/></linearGradient>
 <linearGradient id="quay-roof" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c8c6a0"/><stop offset=".4" stop-color="#88a49a"/><stop offset="1" stop-color="#365f61"/></linearGradient>
 <linearGradient id="quay-windows" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b9bb8a" stop-opacity=".7"/><stop offset=".2" stop-color="#608c85"/><stop offset="1" stop-color="#163e48"/></linearGradient>
 <linearGradient id="quay-deck" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#89a394"/><stop offset="1" stop-color="#30595c"/></linearGradient>
 <radialGradient id="quay-lamplight"><stop stop-color="#f3dca2" stop-opacity=".32"/><stop offset="1" stop-color="#d5c893" stop-opacity="0"/></radialGradient>
 <radialGradient id="red-glow"><stop stop-color="#ff9a95" stop-opacity=".7"/><stop offset="1" stop-color="#ff9a95" stop-opacity="0"/></radialGradient>
 <radialGradient id="blue-glow"><stop stop-color="#85d5ff" stop-opacity=".7"/><stop offset="1" stop-color="#85d5ff" stop-opacity="0"/></radialGradient>
 <filter id="depth" x="-.2" y="-.3" width="1.4" height="1.8"><feDropShadow dy="8" stdDeviation="7" flood-color="#001e28" flood-opacity=".55"/></filter>
 <pattern id="districts" width="108" height="92" patternUnits="userSpaceOnUse"><path d="M8 9H77V29H99V76H61V55H8ZM15 17V46H52V68H89V37H68V17Z" stroke="#98c3b8" stroke-width=".65" stroke-opacity=".12"/></pattern>
 <clipPath id="map-plane"><path d="M405 55H1220V410C1075 350 957 391 841 447C721 505 616 472 510 505L405 535Z"/></clipPath>
'''

TRAIN = '''<g id="metro-train" transform="translate(1023 128) rotate(-2) scale(.74)" opacity=".72" filter="url(#depth)">
 <path d="M-190-42H103Q124-43 137-29L152 5Q155 18 139 23H-191Q-204 20-205 6V-27Q-204-42-190-42Z" fill="url(#train)" stroke="#bfd5c9" stroke-width="1"/>
 <path d="M105-37Q122-38 129-26L142-1Q137 7 119 8H103Z" fill="url(#glass)" stroke="#9bbaaf" stroke-width=".8"/>
 <path d="M-196-30H92V-3H-196Z" fill="url(#glass)"/><path d="M-194 3H142V10H-194Z" fill="#3080b7" fill-opacity=".9"/>
 <path d="M-199 16H143M-194-38H94" stroke="#d0d9c4" stroke-width=".8"/>
 <path d="M-136-40V21M-62-40V21M13-40V21M89-40V21" stroke="#415f62" stroke-width="1.5"/>
 <path d="M-171-29V-3M-97-29V-3M-23-29V-3M52-29V-3" stroke="#99b8b3" stroke-width="1"/>
 <path d="M-163-28L-140-6M-88-28L-66-6M-13-28L9-6M63-28L86-6M110-32L134-6" stroke="#d6e6d4" stroke-opacity=".21" stroke-width="3"/>
 <path d="M-176 23V30H-155V23M-101 23V30H-80V23M-26 23V30H-5V23M49 23V30H70V23M116 22V29H133V22" fill="#0c2934"/>
 <path d="M124 15h9M141 12h7" stroke="#f0dfb0" stroke-width="2"/>
</g>
'''

QUAY = '''<g id="river-quay" transform="translate(667 627) scale(.62)" opacity=".48" stroke-linecap="round" stroke-linejoin="round">
 <!-- A continuous bank, stepped water edge and the dock's reflection. -->
 <path d="M-110-7C-84-17-58-17-33-11L36 9Q71 21 83 38L77 47C41 35 18 24-13 21L-91 14Z" fill="#173d40"/>
 <path d="M-108-10C-76-20-56-15-30-8L37 11Q65 21 81 36L74 41C48 26 23 23-11 18L-93 10Z" fill="url(#quay-stone)"/>
 <path d="M-105-10C-77-18-55-12-29-5L37 14Q61 23 77 36M-97 4L-10 12Q37 17 72 37" stroke="#c5c7a1" stroke-opacity=".37" stroke-width=".8"/>
 <path d="M-84 19Q-31 24 12 31M-67 25Q-28 30-5 32M65 71Q104 82 142 75M78 79Q111 86 128 82" stroke="#8db4a5" stroke-opacity=".18" stroke-width="1.2"/>
 <!-- Terminal entrance, with stone gateposts and a recessed glazed hall. -->
 <path d="M-60-62L28-47L28 7L-60-9Z" fill="#244e50"/>
 <path d="M-52-48L19-36V-2L-52-15Z" fill="url(#quay-windows)"/>
 <path d="M-48-44L-1-36L-30-19L-49-23ZM0-35L15-32V-19L-10-23Z" fill="#b6d1bd" fill-opacity=".12"/>
 <path d="M-35-45V-12M-15-41V-8M5-38V-4M-51-29L18-17" stroke="#a7b6a0" stroke-opacity=".5" stroke-width=".8"/>
 <path d="M-65-69L-53-67L-53-7L-65-9ZM19-54L32-52V8L19 5Z" fill="url(#quay-stone)" stroke="#92a38c" stroke-width=".65"/>
 <path d="M-65-69L-71-65V-5L-65-9M32-52L37-56V4L32 8" fill="#274c4d" stroke="#668a7e" stroke-width=".6"/>
 <path d="M-72-72L-57-74L-49-69L-65-66ZM15-57L29-60L38-55L23-52Z" fill="url(#quay-roof)" stroke="#b3b99a" stroke-width=".6"/>
 <path d="M-54-60L20-47V-36L-54-49Z" fill="url(#quay-stone)" stroke="#9cae97" stroke-width=".65"/>
 <path d="M-49-57L15-46M-49-51L15-40" stroke="#c7c8a1" stroke-opacity=".35" stroke-width=".7"/>
 <!-- Restrained blue ferry insignia and a fine steel awning. -->
 <ellipse cx="-18" cy="-48" rx="5.7" ry="5" transform="rotate(10 -18 -48)" fill="#39768b" stroke="#a3beb0" stroke-width=".65"/>
 <path d="M-21-47L-18-45L-15-46M-18-50V-46" stroke="#d2dbbd" stroke-width=".8"/>
 <path d="M-60-34L20-20L34-25L-47-40Z" fill="url(#quay-roof)" stroke="#a9b59a" stroke-width=".65"/>
 <path d="M-60-34L20-20V-17L-60-31ZM20-20L34-25V-22L20-17Z" fill="#436c67"/>
 <path d="M-48-33L-39-31M-30-30L-21-28M-12-27L-3-25M6-24L15-22" stroke="#d9d0a4" stroke-width="1.1"/>
 <path d="M-55-31V-10M16-19V4" stroke="#a5b29a" stroke-width="1"/>
 <!-- Sloping gangway: one connected deck, two clear railings, no dangling stilts. -->
 <path d="M-4 3L20-2L101 52L77 60Z" fill="url(#quay-deck)" stroke="#8fa99c" stroke-width=".8"/>
 <path d="M-4 3V7L77 64L101 56V52L77 60Z" fill="#214a4d"/>
 <path d="M6 9L29 4M17 17L40 12M28 25L51 20M39 32L62 27M50 40L73 35M61 47L84 42M72 54L95 49" stroke="#c1c5a4" stroke-opacity=".26" stroke-width=".65"/>
 <path d="M-4-8L77 49L101 41M20-13L101 41M-4 3V-8M16 17V6M36 31V20M56 46V35M77 60V49M20-2V-13M40 11V0M60 24V13M80 38V27M101 52V41" stroke="#9ab4a2" stroke-width=".8"/>
 <path d="M-4-8L77 49M20-13L101 41" stroke="#dad1a5" stroke-opacity=".65" stroke-width="1.1"/>
 <!-- Floating landing and cylindrical mooring fenders sit on the waterline. -->
 <path d="M66 54Q91 46 113 54L139 69Q143 73 136 76L104 85Q95 88 88 83L63 66Q58 61 66 54Z" fill="#264e52" stroke="#8caa9b" stroke-width=".75"/>
 <path d="M66 54Q91 46 113 54L139 69L106 79Q98 82 90 77L63 60Z" fill="url(#quay-deck)"/>
 <path d="M72 56L98 73L128 65M69 62L94 79L133 69" stroke="#bfd0b3" stroke-opacity=".28" stroke-width=".65"/>
 <path d="M88 80L90 85M112 79L113 84M133 73L134 78" stroke="#0d323b" stroke-width="3.3"/>
 <path d="M109 59V48M109 48h7M112 59V48" stroke="#bbbf99" stroke-width=".9"/>
 <path d="M114 61Q122 66 130 64" stroke="#b5b99c" stroke-opacity=".5" stroke-width=".8"/>
 <!-- Warm pin lights, kept small so the illustration remains a background. -->
 <circle cx="-77" cy="-5" r="16" fill="url(#quay-lamplight)"/><path d="M-77 2V-24" stroke="#91a58e" stroke-width="1.1"/>
 <path d="M-80-25Q-77-29-74-25L-75-21H-79Z" fill="#cfce9d"/><circle cx="-77" cy="-24" r="1.5" fill="#f4dca1"/>
 <path d="M-88 7Q-80 3-72 7L-72 10L-88 10Z" fill="#244f49"/><path d="M-86 4Q-91-3-86-6Q-81-9-80-1Q-77-8-73-5Q-70-1-75 5Z" fill="#426f5b"/>
</g>
'''

FERRY = '''<g class="river-ferry" opacity=".67">

 <path d="M844 719Q968 726 1081 676M902 732Q1011 731 1101 689" stroke="url(#wake)" stroke-width="1"/>
 <g transform="translate(1080 676) rotate(-5) scale(.68)" filter="url(#depth)">
  <path d="M-118 9H126L103 41Q-12 56-96 37Z" fill="url(#hull)" stroke="#c1c7a8" stroke-width="1.1"/>
  <path d="M-107 16H116L108 26H-101Z" fill="#42777a"/><path d="M-94 35Q-3 48 103 37" stroke="#dfd4ac" stroke-opacity=".7"/>
  <path d="M-85-21H76L97 9H-99Z" fill="#628e87" stroke="#c1c7a8" stroke-width=".9"/>
  <path d="M-61-44H43L66-21H-73Z" fill="#aec0ad" stroke="#c9d0ad" stroke-width=".8"/>
  <path d="M-52-37H35L46-27H-58Z" fill="url(#glass)"/>
  <path d="M-68-14H65V0H-79Z" fill="url(#glass)"/>
  <path d="M-52-14V0M-28-14V0M-4-14V0M20-14V0M44-14V0M-28-37V-27M-4-37V-27M20-37V-27" stroke="#aac8b8" stroke-width="1.8"/>
  <path d="M-93-23H82M-108 7H113M-101 2V-11M-82 2V-14M78 2V-12M98 2V-4" stroke="#d2cfab" stroke-width=".8"/>
  <path d="M-18-46V-70M-29-59H-7M-18-69L6-59L-18-55" stroke="#d5c798" stroke-width="1"/><path d="M-18-69L6-59L-18-55" fill="#b86354"/>
  <path d="M48-38h12v14H48Z" fill="#315c60" stroke="#a3b7a3" stroke-width=".7"/>
  <path d="M-76 19h7m17 0h7m17 0h7m17 0h7m17 0h7m17 0h7m17 0h7" stroke="#d7d8b4" stroke-width="2.3"/>
 </g>
</g>
'''

# Curves turn each route into a controlled ribbon. The entire network recedes
# around the face and torso rather than running through the character.
routes = [
 (1, 'M420 238H536Q554 238 568 224L690 102Q706 86 729 86H1220', [(487,238),(620,172),(794,86),(1143,86)]),
 (2, 'M640 35V160Q640 180 654 194L724 264Q742 282 768 282H1090Q1110 282 1125 300L1215 390', [(640,116),(686,226),(1060,282),(1170,345)]),
 (3, 'M410 410H540Q560 410 576 394L648 322Q663 307 685 307H970Q990 307 1004 321L1109 426Q1126 443 1150 443H1215', [(474,410),(610,360),(1060,377),(1180,443)]),
 (6, 'M1165 40V290Q1165 309 1151 323L1090 378Q1074 394 1074 417V468', [(1165,164),(1165,250),(1123,348),(1074,442)]),
 (7, 'M720 30V132Q720 150 706 164L594 276Q580 290 580 310V460Q580 480 600 480H666Q684 480 698 494L738 534Q752 548 772 548H950', [(720,66),(650,220),(580,341),(580,429),(642,480),(931,548)]),
 (8, 'M1215 205H1084Q1064 205 1050 219L1006 263Q992 277 992 297V388Q992 408 978 422L888 512Q874 526 854 526H450', [(1140,205),(1030,239),(992,341),(953,447),(660,526),(493,526)]),
]
# Short continuations fill the outer districts without becoming a second grid.
# Junctions use the same colours as their parent routes.
continuations = [
 (3, 'M474 410V348Q474 328 488 314L522 280Q536 266 556 266H604', [(474,369),(509,293),(578,266)]),
 (6, 'M1074 442H1045Q1025 442 1011 456L982 485', [(1039,442),(996,471)]),
]
out = [DEFS, '''
 <radialGradient id="route-quiet" gradientUnits="userSpaceOnUse" cx="851" cy="350" r="222" gradientTransform="translate(851 350) scale(.76 1.15) translate(-851 -350)"><stop stop-color="black"/><stop offset=".46" stop-color="black"/><stop offset="1" stop-color="white"/></radialGradient>
 <mask id="portrait-breathing-room" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="800"><path d="M0 0H1200V800H0Z" fill="url(#route-quiet)"/></mask>
 <linearGradient id="river-edge" x1="420" y1="640" x2="1200" y2="492" gradientUnits="userSpaceOnUse"><stop stop-color="#4d8179" stop-opacity="0"/><stop offset=".3" stop-color="#c8be86" stop-opacity=".5"/><stop offset=".72" stop-color="#d3c49c" stop-opacity=".7"/><stop offset="1" stop-color="#90b9ae" stop-opacity=".08"/></linearGradient>
 <linearGradient id="district-fade"><stop stop-color="#8cbbb0" stop-opacity="0"/><stop offset=".55" stop-color="#8cbbb0" stop-opacity=".1"/><stop offset="1" stop-color="#8cbbb0" stop-opacity=".02"/></linearGradient>
</defs>
<style>
.river-ferry{animation:ferry-breath 8s ease-in-out infinite}
@keyframes ferry-breath{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
@media(prefers-reduced-motion:reduce){.metro-traveller{display:none}.river-ferry{animation:none}}
</style>
<!-- The network belongs behind the engraved architecture. -->
<g id="metro-network" mask="url(#portrait-breathing-room)" stroke-linecap="round" stroke-linejoin="round">
<g mask="url(#atlas-landmark-clearance)">
''']
out[1] = out[1].replace('<!-- The network belongs', city_engraving() + '\n<!-- The network belongs', 1)
for line, path, stations in routes + continuations:
 colour = colours[line]
 primary = (line, path, stations) in routes
 route_id = f'line-{line}' if primary else f'line-{line}-continuation'
 opacity = ('.56' if line in [1,2] else '.46') if primary else '.25'
 width = ('1.9' if line in [1,2] else '1.65') if primary else '1.15'
 out.append(f'<path d="{path}" stroke="{colour}" stroke-width="7" stroke-opacity=".035"/><path id="{route_id}" d="{path}" stroke="{colour}" stroke-width="{width}" stroke-opacity="{opacity}"/>')
 for x,y in stations:
  out.append(f'<circle cx="{x}" cy="{y}" r="2.3" fill="#143a3c" stroke="{colour}" stroke-width="1" stroke-opacity=".6"/>')
out.append('''
<!-- Transfer rings make the intersections legible, rather than tangled. -->
<g id="metro-interchanges" stroke="#bfd0b5" stroke-opacity=".65" fill="#153c40" stroke-width="1.1">
 <circle cx="474" cy="410" r="4"/><circle cx="1074" cy="442" r="4"/>
</g>
<!-- Small route lozenges are part of the map, subordinate to the four main labels. -->
<g id="secondary-route-labels" font-family="sans-serif" font-size="11" text-anchor="middle">
 <g transform="translate(580 381)"><rect x="-9" y="-10" width="18" height="20" rx="3" fill="#EE782E" fill-opacity=".2" stroke="#EE782E" stroke-opacity=".5"/><text y="4" fill="#d5ac7d" fill-opacity=".8">7</text></g>
 <g transform="translate(1026 205)"><rect x="-9" y="-10" width="18" height="20" rx="3" fill="#99ADAC" fill-opacity=".15" stroke="#99ADAC" stroke-opacity=".45"/><text y="4" fill="#b5ccc6" fill-opacity=".75">8</text></g>
</g>
''')
out.append('''</g></g>
<!-- A single distant arc carries the metro; no pillars slice through the map. -->
<g id="elevated-arc" opacity=".46">
 <path d="M584 183C781 150 984 134 1230 144V155C984 145 782 162 586 196Z" fill="#24494c"/>
 <path d="M584 182C781 149 984 133 1230 143" stroke="#9cb7a3" stroke-width=".85"/>
 <path d="M585 188C782 155 984 139 1230 149" stroke="#b5b995" stroke-opacity=".45" stroke-width=".6"/>
 <path d="M586 197C782 163 984 147 1230 157" stroke="#4e827b" stroke-opacity=".38" stroke-width="1.1"/>
</g>
''')
out.append(TRAIN)
out.append('''
<!-- The bank is a continuous diagonal seam, leading naturally to the dock. -->
<path d="M380 651C548 589 665 627 780 573C937 499 1072 461 1225 498V820H380Z" fill="url(#water)" fill-opacity=".72"/>
<path d="M380 651C548 589 665 627 780 573C937 499 1072 461 1225 498" stroke="#092b31" stroke-width="5" stroke-opacity=".24"/>
<path d="M380 649C548 587 665 625 780 571C937 497 1072 459 1225 496" stroke="url(#river-edge)" stroke-width="1.1"/>
<path d="M443 653C574 614 677 644 795 585C943 513 1073 477 1215 510" stroke="#84b1a4" stroke-width=".55" stroke-opacity=".16"/>
<!-- A low riverfront silhouette sits on the far shore, rather than on the train. -->
<g id="distant-riverfront" transform="translate(0 86)" fill="#699489" opacity=".13">
 <path d="M1037 416H1054V397H1064V416H1081V388H1096V418H1111V402H1125V420H1139V393H1150V424H1170V412H1187V431H1204V442H1037Z"/>
 <path d="M1048 417Q1125 418 1206 442" stroke="#95b3a0" stroke-width=".7"/>
</g>
<!-- Quiet reflections; none cross the portrait's shoulders or face. -->
<g stroke="#95c0b2" stroke-width=".65" stroke-opacity=".13" fill="none">
 <path d="M424 698Q573 653 713 663M608 751Q823 678 1022 706M900 759Q1079 735 1231 671"/>
 <path d="M1028 561Q1122 539 1217 551M1056 572Q1152 554 1228 564"/>
</g>
''')
out.extend([QUAY,FERRY])
out.append('''
<!-- A small destination pin is paired with the bank, away from the figure. -->
<g id="travel-map-pins" transform="translate(1174 477) scale(.62)" fill="#b8665b" stroke="#e1a38a" opacity=".6"><path d="M0-15C-23-15-23 10 0 29C23 10 23-15 0-15Z"/><circle r="5" fill="#dfd3b2" stroke="none"/></g>
''')
for line,glow,fill,duration in [(1,'blue-glow','#8bd9fa',30),(2,'red-glow','#f8ad9f',25)]:
 path=next(path for number,path,_ in routes if number==line)
 out.append(f'''<g class="metro-traveller" mask="url(#portrait-breathing-room)"><g mask="url(#atlas-landmark-clearance)"><g opacity="0"><circle r="10" fill="url(#{glow})"/><circle r="1.9" fill="{fill}"/><circle r=".7" fill="#f3f5d9"/><animateMotion path="{path}" dur="{duration}s" calcMode="paced" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;.8;0" keyTimes="0;.06;.94;1" dur="{duration}s" repeatCount="indefinite"/></g></g></g>''')
out.append('</svg>')
path=root/'public/assets/travel-atlas.svg'
path.write_text('\n'.join(out),encoding='utf-8')
print(f'{path.name}: {path.stat().st_size:,} bytes')

# Portrait framing preserves the complete dock and ferry on narrow screens.
mobile=('\n'.join(out)
 .replace('viewBox="0 0 1200 800"','viewBox="520 0 680 800"',1)
 .replace('translate(1023 128)','translate(1023 48)',1)
 .replace('id="elevated-arc"','id="elevated-arc" transform="translate(0 -80)"',1))
(root/'public/assets/travel-atlas-mobile.svg').write_text(mobile,encoding='utf-8')
