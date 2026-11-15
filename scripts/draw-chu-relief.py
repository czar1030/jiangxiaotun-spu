"""Draw the Wuhan hero's original bronze-and-lacquer relief. No raster dependencies."""
from pathlib import Path
import math

root = Path(__file__).resolve().parents[1]
parts = ['''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 820" fill="none">
<title>楚韵青铜与江城山水</title>
<desc>编钟、黄鹤楼五重飞檐、展翼仙鹤、楚凤与两江水纹组成的原创青金山水浮雕。以漆色、青铜和鎏金细刻分出远山、中景器物与近景楼阁。非文物或建筑复原图。</desc>
<defs>
 <linearGradient id="bronze" x1="-42" y1="0" x2="42" y2="10" gradientUnits="userSpaceOnUse"><stop stop-color="#203f35"/><stop offset=".16" stop-color="#6e8260"/><stop offset=".36" stop-color="#c3b67d"/><stop offset=".54" stop-color="#7f8c65"/><stop offset=".76" stop-color="#385c4b"/><stop offset="1" stop-color="#142f2b"/></linearGradient>
 <linearGradient id="edge" x1="0" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#e3ce92"/><stop offset=".45" stop-color="#789076"/><stop offset=".78" stop-color="#b8a875"/><stop offset="1" stop-color="#54745c"/></linearGradient>
 <linearGradient id="gold"><stop stop-color="#728365"/><stop offset=".3" stop-color="#e4cd93"/><stop offset=".65" stop-color="#a59461"/><stop offset="1" stop-color="#4a6f59"/></linearGradient>
 <linearGradient id="lacquer" x1="0" x2="0" y2="1"><stop stop-color="#677553"/><stop offset=".17" stop-color="#a69a65"/><stop offset=".23" stop-color="#172f28"/><stop offset=".7" stop-color="#29453a"/><stop offset=".85" stop-color="#0b2824"/><stop offset="1" stop-color="#8c8459"/></linearGradient>
 <linearGradient id="mist" x1="0" x2="1"><stop stop-color="#0a302b" stop-opacity="0"/><stop offset=".55" stop-color="#9da67c" stop-opacity=".15"/><stop offset="1" stop-color="#9ebca1" stop-opacity=".04"/></linearGradient>
 <linearGradient id="tower-roof" x1="-120" y1="-18" x2="120" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#2a5141"/><stop offset=".25" stop-color="#9a9a67"/><stop offset=".48" stop-color="#b9aa72"/><stop offset=".6" stop-color="#6f845e"/><stop offset="1" stop-color="#193f33"/></linearGradient>
 <linearGradient id="tower-wall" x1="-85" y1="0" x2="85" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#113b30"/><stop offset=".52" stop-color="#34533d"/><stop offset=".65" stop-color="#143b30"/><stop offset="1" stop-color="#082e28"/></linearGradient>
 <linearGradient id="crane-ivory" x1="-65" y1="-55" x2="40" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#80977d"/><stop offset=".48" stop-color="#d2c896"/><stop offset=".7" stop-color="#a4ac80"/><stop offset="1" stop-color="#315b49"/></linearGradient>
 <linearGradient id="cloud-glaze" x1="0" x2="1"><stop stop-color="#315b47" stop-opacity="0"/><stop offset=".5" stop-color="#93a17a" stop-opacity=".17"/><stop offset="1" stop-color="#254f40" stop-opacity="0"/></linearGradient>
 <radialGradient id="light"><stop stop-color="#c5b67c" stop-opacity=".17"/><stop offset="1" stop-color="#6f9473" stop-opacity="0"/></radialGradient>
 <linearGradient id="scene-fade"><stop offset=".3" stop-color="white" stop-opacity="0"/><stop offset=".48" stop-color="white" stop-opacity=".5"/><stop offset=".68" stop-color="white"/></linearGradient>
 <mask id="right-scene"><path fill="url(#scene-fade)" d="M0 0H1280V820H0Z"/></mask>
 <pattern id="leiwen" width="24" height="18" patternUnits="userSpaceOnUse"><path d="M0 2H19V15H5V6H14V11H10M24 2H22V18H0" stroke="#d8c48c" stroke-opacity=".5" stroke-width=".7"/></pattern>
 <pattern id="scales" width="18" height="20" patternUnits="userSpaceOnUse"><path d="M-9 0Q0 18 9 0Q18 18 27 0M-9 10Q0 28 9 10Q18 28 27 10" stroke="#b6b887" stroke-opacity=".3" stroke-width=".65"/></pattern>
 <pattern id="bronze-grain" width="73" height="61" patternUnits="userSpaceOnUse"><path d="M5 9l8-2m33 9l6-3M18 41l3 7m37-12l8 1M38 59l5-5M3 57l4 1" stroke="#1a4d40" stroke-opacity=".55" stroke-width="2"/><path d="M29 17l3 1M7 33l2-2m50 17l3-1" stroke="#d0c18a" stroke-opacity=".25"/></pattern>
 <filter id="shadow" x="-.5" y="-.3" width="2" height="1.8"><feDropShadow dx="2" dy="8" stdDeviation="5" flood-color="#001c18" flood-opacity=".7"/></filter>
 <g id="stud"><path d="M-4 1C-5-3-3-7 0-8C3-7 5-3 4 1Q0 6-4 1Z" fill="#57745a" stroke="#c3b981" stroke-width=".65"/><path d="M0-6Q-2-3-1 1" stroke="#ddd09b" stroke-width=".7"/><path d="M-2 3Q2 5 4 1" stroke="#153e33"/></g>
 <g id="bronze-bell">
  <!-- A yongzhong silhouette: long shank, sloping shoulders, flared almond mouth. -->
  <path d="M-5-39L-4-67Q0-71 4-67L5-39" fill="url(#bronze)" stroke="#c0b781" stroke-width=".8"/>
  <path d="M-8-53H8V-46H-8ZM-6-63H6M-5-58H5" fill="#344f3c" stroke="#b6a876" stroke-width=".8"/>
  <path d="M5-57C24-65 25-35 9-37L8-43C18-42 18-55 7-51Z" fill="url(#bronze)" stroke="#b8ac74" stroke-width=".8"/>
  <path d="M-7-38Q-21-38-31-29L-34 3L-43 81Q-25 99 0 94Q25 99 43 81L34 3L31-29Q21-38 7-38Z" fill="url(#bronze)" stroke="url(#edge)" stroke-width="1.15"/>
  <path d="M28-29L32 3L40 80Q25 91 18 90L17-28" fill="#103e32" opacity=".48"/>
  <path d="M-31-27Q0-37 31-27L32-17Q0-27-32-17Z" fill="url(#leiwen)" stroke="#bdb47e" stroke-width=".65"/>
  <path d="M-33-10Q0-18 33-10M-35 22Q0 17 35 22M-38 54Q0 50 38 54" stroke="#c4ba85" stroke-width=".8"/>
  <path d="M-37 56Q0 52 37 56L39 65Q0 61-39 65Z" fill="url(#leiwen)" stroke="#bcad75" stroke-width=".6"/>
  <path d="M-40 70Q0 64 40 70L42 81Q22 95 0 90Q-22 95-42 81Z" fill="url(#scales)" stroke="#b4ac79" stroke-width=".7"/>
  <path d="M-42 82Q0 108 42 82Q18 95 0 87Q-18 95-42 82Z" fill="#092d26" stroke="#9c9f70" stroke-width=".8"/>
  <path d="M-5-20V61M5-20V61M-2-18V58M2-18V58" stroke="#e0cb92" stroke-width=".65" opacity=".75"/>
  <path d="M-7-37Q-22-37-29-28L-33 20L-39 77" stroke="#e0ca8e" stroke-width="1" opacity=".65"/>
  <path d="M-28-26Q0-34 28-26M-39 72Q0 66 39 72" stroke="#e8d6a1" stroke-width=".5"/>
  <path d="M-27 62C-34 54-31 45-24 47C-18 49-23 56-27 52M-24 47Q-16 40-12 46L-15 50L-9 49M27 62C34 54 31 45 24 47C18 49 23 56 27 52M24 47Q16 40 12 46L15 50L9 49" stroke="#d2c18a" stroke-width=".65" opacity=".7"/>
  <path d="M-31-28Q0-39 31-28L41 80Q0 103-41 80Z" fill="url(#bronze-grain)"/>
''']
for x in [-29, -19, -10, 10, 19, 29]:
    for y in [-1, 17, 37]:
        parts.append(f'<use href="#stud" transform="translate({x} {y})"/>')
# Fine seal-like incisions, not counterfeit historical inscriptions.
for x in [-10, 8]:
    for y in range(-6, 53, 10):
        parts.append(f'<path d="M{x} {y}h3m-2-2v6m-1-1h3" stroke="#d3c58d" stroke-width=".6" opacity=".72"/>')
parts.append('''</g>
 <g id="phoenix-finial" stroke-linejoin="round">
  <path d="M0 42C-18 19-4-10 19-14C30-17 35-28 30-37L43-30L39-18L54-20L43-7C61 3 63 21 47 27C34 30 29 20 36 13C39 9 47 11 44 17C49 15 49 7 39 4C20-1 9 17 17 32L30 45Z" fill="url(#bronze)" stroke="#c8b77e" stroke-width="1.2"/>
  <path d="M14 31C-23 16-45-18-69-11C-33-6-34 18-21 24C-49 19-64 3-82 10C-42 17-48 32-29 35C-54 33-67 27-82 36C-44 36-51 51-15 49" fill="url(#scales)" stroke="#a9aa79" stroke-width=".9"/>
  <path d="M22-7Q12 10 22 27M26-8Q17 9 27 22M-12 29Q-32 9-50 4M-16 38L-57 25" stroke="#e2c790" stroke-width=".65"/>
  <path d="M32-9l5-1-3 3Z" fill="#ebdcad"/><path d="M36 4L49-1L41 7" stroke="#b6a572"/>
 </g>
 <g id="roof"><path d="M-85 4Q-66 6-49-5L-24-11L0-24L24-11L49-5Q66 6 85 4L73 13H-73Z" fill="#183d33" stroke="#b8ae7c" stroke-width="1"/><path d="M-73 13H73M-63 17H63M-54 20H54" stroke="#83966d" stroke-width=".7"/><path d="M-69 7Q0-4 69 7M-49 1L-31 7M-36-4L-23 5M-21-10L-13 4M0-23V3M21-10L13 4M36-4L23 5M49 1L31 7" stroke="#98a177" stroke-width=".6"/></g>
 <g id="engraved-crane" stroke-linecap="round" stroke-linejoin="round">
  <!-- Long neck, narrow beak and trailing legs distinguish the crane from the Chu phoenix. -->
  <path d="M-21 7C-41-12-60-53-110-72C-81-67-60-48-48-32L-38-14C-49-29-72-49-93-49C-69-36-57-18-51-6C-64-21-78-30-90-30C-72-18-67-4-52 9L-26 16Z" fill="url(#crane-ivory)" stroke="#c3bd8b" stroke-width="1.1"/>
  <path d="M-1 3C12-34 47-66 89-82C59-61 42-35 35-17L24 2L10 10Z" fill="url(#crane-ivory)" stroke="#b6b98a" stroke-width="1"/>
  <path d="M-26 10C-16 1-4-2 9 3C22-3 29-19 40-27C48-34 57-31 62-27L88-24L65-21C56-24 49-20 44-12C33 6 22 15 8 18L-17 17L-42 23L-32 14Z" fill="url(#crane-ivory)" stroke="#ded09c" stroke-width="1.15"/>
  <path d="m-18 17-43 22-18 1m62-20-40 25-17 1m-26-114c29 15 47 38 58 60m-44-46c20 12 33 28 42 44m-26-34 26 31m58 3c12-24 28-47 49-63m-34 54c8-16 18-30 30-44M-14 10c9-5 17-4 23-1M37-13c4-7 8-10 14-11" stroke="#405e48" stroke-width=".85"/>
  <path d="M-29 14-37 20m-12-11-3-10m92-27c5-2 9-1 13 1m13 2 17 1" stroke="#efe0ac" stroke-width=".7"/>
  <circle cx="57" cy="-26" r="1.05" fill="#173b31"/>
 </g>
</defs>
<!-- Glazing and a quiet left-hand field keep the invitation readable. -->
<ellipse cx="1010" cy="240" rx="480" ry="340" fill="url(#light)"/>
<g mask="url(#right-scene)">
 <!-- Receding lacquer screen: a rectangular structure, rather than ornamental rings. -->
 <path d="M600 73H1254V583H600Z" fill="#163e32" fill-opacity=".2" stroke="#84946a" stroke-opacity=".15"/>
 <path d="M609 82H1245V574H609Z" stroke="#a9b17b" stroke-opacity=".12"/>
 <path d="M650 89V570M801 89V570M952 89V570M1103 89V570M601 323H1254" stroke="#95a47a" stroke-opacity=".07"/>
 <!-- Two registers of the chime rack. The beam and supports carry the bells. -->
 <g opacity=".75" filter="url(#shadow)">
  <path d="M628 123L1243 116L1257 123L1247 142L628 149L616 139Z" fill="url(#lacquer)" stroke="#b4a574" stroke-width=".8"/>
  <path d="M636 127L1241 121L1239 136L634 143Z" fill="url(#leiwen)" opacity=".75"/>
  <path d="M654 145L671 144L666 496H646ZM1199 138L1215 138L1226 496H1205Z" fill="url(#bronze)" stroke="#9a9d6b" stroke-width=".7"/>
  <path d="M640 489H681L688 500H632ZM1196 489H1235L1243 500H1189Z" fill="url(#lacquer)" stroke="#ada173" stroke-width=".7"/>
  <path d="M640 300L1223 295L1237 305L1228 320L638 327L626 315Z" fill="url(#lacquer)" stroke="#a1a06c" stroke-width=".85"/>
  <path d="M649 305L1219 301V314L645 320Z" fill="url(#leiwen)"/>
  <use href="#phoenix-finial" transform="translate(641 104) scale(.7)"/>
  <use href="#phoenix-finial" transform="translate(1234 98) scale(-.7 .7)"/>
 </g>
''')
# Individual bells use graded size, subtle perspective, and independently drawn hangers.
for row, (start_y, scale, count, spacing, start_x) in enumerate([(158, .61, 9, 59, 692), (336, .87, 6, 90, 709)]):
    for i in range(count):
        x = start_x + i * spacing
        size = scale * (1 - i * .022)
        y = start_y + i * -.7
        parts.append(f'<g opacity="{.61 if row == 0 else .69}" filter="url(#shadow)"><path d="M{x} {y-22}V{y+12}" stroke="#c5b988" stroke-width="1.2"/><path d="M{x-5} {y-18}q5-10 10 0v9q-5 8-10 0Z" stroke="#82916b" stroke-width="1.3"/><use href="#bronze-bell" transform="translate({x} {y+size*68+9}) scale({size})"/></g>')
parts.append('''
 <!-- A foreground artifact gives the bronze enough scale to reveal its casting details. -->
 <g transform="translate(657 423) rotate(-8) scale(1.32)" filter="url(#shadow)" opacity=".92"><use href="#bronze-bell"/></g>
 <path d="M634 333Q637 325 641 332" stroke="#d9c38b" stroke-width="1" opacity=".6"/>
 <!-- The feather carving belongs to a Chu phoenix: a beak, crown, folded wing and flowing tail. -->
 <g transform="translate(1203 382)" opacity=".31" stroke="url(#gold)">
  <path d="M-14-92Q-37-129-62-112L-51-108L-68-100L-44-101C-25-91-28-76-42-66C-74-43-53-9-27 4C-2 18-2 56-27 76C-50 95-43 109-24 113C-76 120-94 90-69 69C-95 80-104 119-73 139C-126 136-135 103-110 80" stroke-width="1.5"/>
  <path d="M-47-65C-91-51-108-12-86 15C-72 32-53 24-54 10C-56-3-75-4-76 7M-44-53Q-79-36-72-12M-39-44Q-62-25-60-15M-18 23C37-2 35-52-3-61C27-47 5-26-17-26M-8 37C65 15 73-37 38-67C60-29 28-11 9-4M-3 54C94 29 119-26 77-75C101-32 69-11 58-1" stroke-width="1"/>
  <path d="M-57-108l3 2M-38-106Q-27-118-30-133M-34-106Q-19-117-18-131M-26-103Q-10-112-5-128" stroke-width="1"/>
 </g>
 <!-- The far riverbank and bridge are the quietest layer of the relief. -->
 <g opacity=".27" stroke="#9eae83" stroke-width=".8">
  <path d="M554 589L577 576L608 578L638 560L666 563L691 546L725 553L753 543L780 550L817 542L855 554L902 549L937 569L971 559L1004 575L1040 571L1083 580L1120 565L1161 572L1202 560L1257 581L1300 575V681H554Z" fill="#234b3b" stroke="none"/>
  <path d="M532 622Q798 600 1072 618L1285 610M532 629Q798 607 1072 625L1285 617" stroke="#a3a779" stroke-width="1.8"/>
''')
for x in range(548, 1260, 57):
    parts.append(f'<path d="M{x} 623v43l9 3v-47M{x-10} 623q14-23 35-1"/>')
for i in range(17):
    x = 710 + i * 31
    y = 580 - (i % 5) * 9
    parts.append(f'<path d="M{x} 610V{y}h17v30m-13-25v4m5-4v4m-5 5v4m5-4v4" opacity=".35"/>')
parts.append('''</g>
 <!-- The tower emerges in front of the chimes, where the host leaves the skyline open. -->
 <g id="yellow-crane-tower" transform="translate(815 275)" opacity=".78" filter="url(#shadow)" stroke-linecap="round" stroke-linejoin="round">
  <path d="M-114 332Q-65 310-9 315Q49 305 114 330L111 342H-113Z" fill="#123e31" stroke="#7f956e" stroke-width=".85"/>
  <path d="M-102 335H103M-94 344H95M-83 350H84" stroke="#acaa76" stroke-width=".8"/>
  <path d="M0-37V-61m-4 13h8m-3-6h6" stroke="#c8b880" stroke-width="1.2"/>
  <path d="M0-65c-6 4-5 9 0 11 5-2 6-7 0-11Z" fill="url(#gold)" stroke="#c9bd8b" stroke-width=".6"/>
''')
# Five principal eaves, octagonal facets, recessed galleries, tiled roof incisions,
# and balustrades make the landmark read as the Yellow Crane Tower at small sizes.
for level, (y, half_width, height) in enumerate([(0, 65, 45), (64, 73, 46), (129, 82, 47), (195, 94, 49), (263, 109, 54)]):
    w, h = half_width, height
    wall = w * .68
    peak = 33 if level == 0 else 15
    parts.append(f'''<g transform="translate(0 {y})" data-eave="{level+1}">
      <path d="M{-wall:.1f} 10H{wall:.1f}V{h+16}H{-wall:.1f}Z" fill="url(#tower-wall)" stroke="#9eaa7b" stroke-width=".7"/>
      <path d="M{-wall:.1f} 12L-15 17V{h+13}L{-wall:.1f} {h+8}ZM-15 17L{wall:.1f} 10V{h+8}L-15 {h+13}Z" fill="#0c332b" stroke="#87996d" stroke-width=".65"/>
      <path d="M{-wall+5:.1f} 24L-19 28V{h+3}L{-wall+5:.1f} {h-1}ZM-10 28L{wall-5:.1f} 21V{h-1}L-10 {h+4}Z" fill="#082c26" stroke="#8b9a6b" stroke-width=".55"/>
      <path d="M{-w} -12Q{-w+1} 0 {-w+18} 1L-18 -11L0 {-peak}L18 -11L{w-18} 1Q{w-1} 0 {w} -12L{w-2} 6Q{w-16} 16 {w-29} 17L-15 24L{-w+24} 15Q{-w+8} 13 {-w+2} 6Z" fill="url(#tower-roof)" stroke="#c5b880" stroke-width="1.05"/>
      <path d="M{-w+3} 3Q{-w+13} 9 {-w+27} 9L-15 17L{w-28} 10Q{w-12} 10 {w-3} 2M-15 17L0 {-peak+1}m-15 {23+peak}v-7" stroke="#dec58e" stroke-width=".65"/>
      <path d="M{-w} -12l-2-5m{2*w+2} 5 2-5M{-w+7} 13L-15 29L{w-10} 15m{-2*w+24} 4L-15 34L{w-22} 21" stroke="#a2a675" stroke-width=".65"/>
    ''')
    for side in [-1, 1]:
        for column in range(1, 7):
            t = column / 7
            # Tile lines fan along the curved eaves, rather than horizontal stripes.
            x = side * (16 + (w - 31) * t)
            parts.append(f'<path d="M{x*.47:.1f} {-peak*.55+peak*.48*t:.1f}Q{x*.78:.1f} {1+5*t:.1f} {x:.1f} {15-5*t:.1f}" stroke="#e0cb92" stroke-width=".48" opacity=".6"/>')
    for x in [-wall, -wall*.55, -15, wall*.32, wall*.7, wall]:
        shift = 5 * (1 - abs(x) / wall)
        parts.append(f'<path d="M{x:.1f} {29+shift:.1f}V{h+8+shift:.1f}m-2 0h4" stroke="#b8b184" stroke-width="1.15"/>')
    parts.append(f'<path d="M{-wall-4:.1f} {h+1}L-15 {h+9}L{wall+4:.1f} {h-1}m{-2*wall-8:.1f} 6L-15 {h+15}L{wall+4:.1f} {h+5}" stroke="#b4ac7a" stroke-width=".75"/>')
    for j in range(13):
        x = -wall + 2 * wall * j / 12
        shift = 6 * (1 - abs(x) / wall)
        parts.append(f'<path d="M{x:.1f} {h+1+shift:.1f}v6m-2-4h4" stroke="#9ba77b" stroke-width=".65"/>')
    if level == 0:
        parts.append('<path d="M-12 32L22 28V42L-12 46Z" fill="#173d30" stroke="#c2b17c" stroke-width=".65"/><path d="m-6 36 3-1m-1-1v5m6-6 3-1m-1-1v5m6-5 3-1m-1-1v5" stroke="#d3be85" stroke-width=".7"/>')
    parts.append('</g>')
parts.append('''</g>
 <!-- Cut cloud ribbons soften the transition from stone terrace to river. -->
 <g stroke="#b3b383" stroke-width=".8" fill="url(#cloud-glaze)">
  <path d="M620 557c45 8 62-5 85-10 22-6 41-4 57 2-14-14-39-18-59-10-13 6-27 7-41 5 24-4 31-18 51-19 21-2 36 10 54 10 22 0 34-12 55-10 18 1 35 11 60 8-16 9-32 12-47 10-21-4-35 2-55 7-25 6-47 0-64 4-31 8-50 14-96 10Z" opacity=".2"/>
  <path d="M706 611c32 7 65-10 93-8 30 1 50 15 79 12 28-4 47-17 78-13 20 2 39 10 62 4-20 14-38 15-60 10-27-5-46 6-72 10-36 5-54-9-83-10-35-1-66 9-97 3" opacity=".35"/>
  <path d="M755 576c16-7 27-17 42-17 14 1 19 11 12 16-6 5-16 1-11-4m19-9c20-9 32 11 50 10 14-1 23-9 38-7" fill="none" opacity=".35"/>
 </g>
 <!-- Two cranes occupy open air, sharing the bronze palette and carved feathers. -->
 <use href="#engraved-crane" transform="translate(825 162) rotate(-13) scale(.93)" opacity=".8"/>
 <use href="#engraved-crane" transform="translate(1194 552) rotate(9) scale(.56)" opacity=".47"/>
 <!-- Fine interlaced river currents replace the old circular dial. -->
 <path d="M287 681C447 601 598 712 752 699C951 683 1045 615 1307 643" stroke="url(#gold)" stroke-width=".9" opacity=".65"/>
 <path d="M278 694C444 615 598 725 754 713C961 696 1053 630 1307 656" stroke="#94ad88" stroke-width=".5" opacity=".37"/>
 <path d="M330 735C552 652 715 780 930 727C1050 697 1178 682 1305 709" stroke="#9ea87a" stroke-width=".7" opacity=".26"/>
 <path d="M271 724C486 642 616 771 858 731C1015 705 1108 667 1310 692L1310 715C1108 690 1015 728 858 754C616 794 486 665 271 747Z" fill="url(#mist)"/>
</g>
<!-- Corner inlays: restrained angular lacquer work, never another orbit. -->
<g stroke="url(#gold)" stroke-width=".65" opacity=".45"><path d="M1247 101V70H1216M1238 100V79H1216M1247 552V583H1216M1238 552V574H1216"/><path d="M584 704H610V730M589 711H603V725" opacity=".6"/></g>
</svg>''')
out = root / 'public/assets/chu-cultural-relief.svg'
out.write_text('\n'.join(parts), encoding='utf-8')
print(f'{out.name}: {out.stat().st_size:,} bytes')
