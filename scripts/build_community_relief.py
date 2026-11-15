"""Build the community's blue-metal architectural relief, with no HUD panels.

An original interpretation of Optics Valley's calla-lily architecture and
photonic materials. The existing Jiang'an photograph supplies the old street.
This illustration is decorative, not an architectural reconstruction.
"""
from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets'

DEFS = '''<defs>
 <linearGradient id="cv-metal" x1="360" y1="130" x2="754" y2="277" gradientUnits="userSpaceOnUse"><stop stop-color="#244b61"/><stop offset=".2" stop-color="#6c8d98"/><stop offset=".37" stop-color="#a7b9ae"/><stop offset=".48" stop-color="#698f98"/><stop offset=".72" stop-color="#305d73"/><stop offset="1" stop-color="#173b51"/></linearGradient>
 <linearGradient id="cv-rim" x1="350" y1="240" x2="758" y2="130" gradientUnits="userSpaceOnUse"><stop stop-color="#2c596a"/><stop offset=".3" stop-color="#91acac"/><stop offset=".53" stop-color="#c0bb97"/><stop offset=".67" stop-color="#668d91"/><stop offset="1" stop-color="#2e596e"/></linearGradient>
 <linearGradient id="cv-inside" x1="435" y1="140" x2="639" y2="275" gradientUnits="userSpaceOnUse"><stop stop-color="#0d2c40"/><stop offset=".45" stop-color="#284f66"/><stop offset="1" stop-color="#123448"/></linearGradient>
 <linearGradient id="cv-stem" x1="574" y1="350" x2="717" y2="360" gradientUnits="userSpaceOnUse"><stop stop-color="#173d52"/><stop offset=".24" stop-color="#3d6579"/><stop offset=".42" stop-color="#8baba8"/><stop offset=".53" stop-color="#527c87"/><stop offset=".7" stop-color="#274e64"/><stop offset=".9" stop-color="#63848a"/><stop offset="1" stop-color="#1e4358"/></linearGradient>
 <linearGradient id="cv-gold" x1="0" x2="1"><stop stop-color="#82937e" stop-opacity=".1"/><stop offset=".4" stop-color="#c7bd91" stop-opacity=".85"/><stop offset=".7" stop-color="#b3c3b0" stop-opacity=".7"/><stop offset="1" stop-color="#6ba4ae" stop-opacity=".1"/></linearGradient>
 <linearGradient id="cv-glass" x1="0" x2="1"><stop stop-color="#173d54"/><stop offset=".47" stop-color="#315c73"/><stop offset=".5" stop-color="#557d89"/><stop offset=".55" stop-color="#284e64"/><stop offset="1" stop-color="#123147"/></linearGradient>
 <linearGradient id="cv-wake" x1="0" x2="1"><stop stop-color="#55989c" stop-opacity="0"/><stop offset=".3" stop-color="#6baab1" stop-opacity=".25"/><stop offset=".66" stop-color="#73b1bd" stop-opacity=".45"/><stop offset="1" stop-color="#59899b" stop-opacity="0"/></linearGradient>
 <radialGradient id="cv-light"><stop stop-color="#7ac4c6" stop-opacity=".17"/><stop offset="1" stop-color="#7ac4c6" stop-opacity="0"/></radialGradient>
 <linearGradient id="cv-fade" x1="0" x2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".2" stop-color="white" stop-opacity=".32"/><stop offset=".5" stop-color="white" stop-opacity=".9"/><stop offset="1" stop-color="white"/></linearGradient>
 <mask id="cv-scene"><path fill="url(#cv-fade)" d="M0 0H800V600H0Z"/></mask>
 <clipPath id="cv-petal"><path d="M383 220C463 151 615 99 736 110C700 179 645 213 584 233C512 254 444 246 383 220Z"/></clipPath>
 <clipPath id="cv-stem-cut"><path d="M566 255C583 331 610 413 649 492L721 494C679 410 646 323 642 238Z"/></clipPath>
 <pattern id="cv-facade" width="13" height="23" patternUnits="userSpaceOnUse"><path d="M0 0H13V23H0Z" fill="#163b51"/><path d="M1 1H11V19H1Z" fill="#527b8b" fill-opacity=".15"/><path d="M1 1H11M1 1V19" stroke="#9ab8b5" stroke-opacity=".13" stroke-width=".6"/></pattern>
 <filter id="cv-shadow" x="-.25" y="-.3" width="1.5" height="1.6"><feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#031f31" flood-opacity=".55"/></filter>
 <filter id="cv-soft"><feGaussianBlur stdDeviation="10"/></filter>
</defs>'''


def far_buildings():
    output = ['<g opacity=".34">']
    for x, y, w, h in [(440, 268, 53, 208), (505, 220, 59, 262), (734, 292, 52, 200)]:
        output += [
            f'<path d="M{x} {y}L{x+w*.62} {y-17}L{x+w} {y-8}V{y+h}H{x}Z" fill="url(#cv-glass)"/>',
            f'<path d="M{x+4} {y+5}H{x+w-5}V{y+h-5}H{x+4}Z" fill="url(#cv-facade)"/>',
            f'<path d="M{x} {y}L{x+w*.62} {y-17}L{x+w} {y-8}" stroke="#8eb0b2" stroke-opacity=".3" stroke-width=".8"/>',
        ]
    output.append('</g>')
    return ''.join(output)


def canopy_ribs():
    # Each rib belongs to the same curved roof. No freestanding circuit paths.
    output = ['<g clip-path="url(#cv-petal)">']
    for i in range(22):
        x = 396 + i * 15.5
        end = 541 + i * 3.25
        output.append(f'<path d="M{x:.1f} {215-i*3.7:.1f}Q{510+i*5:.1f} {162-i*1.6:.1f} {end:.1f} 245" stroke="#92b6b7" stroke-opacity="{.1+(i%4)*.025:.3f}" stroke-width=".85"/>')
    output += [
        '<path d="M403 218C479 170 598 122 712 121M433 226C513 179 609 146 696 142M476 237C541 198 616 169 673 161" stroke="#99c6c5" stroke-opacity=".22" stroke-width=".8"/>',
        '<g fill="#b4d7cd" fill-opacity=".65"><circle cx="476" cy="179" r="1.8"/><circle cx="545" cy="147" r="1.6"/><circle cx="612" cy="128" r="1.7"/><circle cx="576" cy="179" r="1.5"/><circle cx="634" cy="151" r="1.4"/></g>',
        '</g>',
    ]
    return ''.join(output)


def stem_flutes():
    output = ['<g clip-path="url(#cv-stem-cut)">']
    for i in range(17):
        x = 565 + i * 4.8
        output.append(f'<path d="M{x:.1f} 244C{x+13:.1f} 330 {x+41:.1f} 419 {x+80:.1f} 501" stroke="{["#b4c3ac", "#0c2c42", "#7a9c9f"][i%3]}" stroke-opacity="{[.35,.55,.26][i%3]}" stroke-width="{[1.1,2.2,.7][i%3]}"/>')
    output.append('</g>')
    return ''.join(output)


def seated_companion():
    # Seat meets the near rim beside Jiang Xiaotun's right ear at (610, 255).
    # Shoes hang over the
    # front; the original opaque white clothing is part of the character.
    image = base64.b64encode((DEST / 'community-rim/seated-companion.png').read_bytes()).decode('ascii')
    return f'''<g class="cv-rim-companion">
 <ellipse cx="610" cy="255" rx="19" ry="3" transform="rotate(-18 610 255)" fill="#041c2b" opacity=".45"/>
 <image x="558" y="143" width="102" height="130.578" href="data:image/png;base64,{image}"/>
</g>'''


def artwork():
    return f'''{DEFS}
<g mask="url(#cv-scene)">
 <ellipse cx="595" cy="260" rx="310" ry="263" fill="url(#cv-light)"/>
 {far_buildings()}
 <path d="M147 516C309 469 370 410 554 434C658 449 724 438 803 401L803 453C689 489 633 470 537 459C380 439 302 515 147 538Z" fill="#205569" fill-opacity=".15"/>
 <path d="M41 525C214 547 258 463 410 451C553 440 652 488 800 427L800 447C648 503 550 455 413 466C259 478 216 562 41 540Z" fill="url(#cv-wake)"/>
 <path d="M40 531C212 552 259 470 412 458C552 448 652 495 800 437" stroke="url(#cv-gold)" stroke-width="1.1"/>
 <path d="M40 540C212 562 260 480 413 468C552 457 652 505 800 447" stroke="#71a2ae" stroke-opacity=".17" stroke-width=".7"/>
 <g filter="url(#cv-shadow)">
  <path d="M554 495L695 481L752 507L607 531Z" fill="#193d51" stroke="#6f959c" stroke-opacity=".3"/>
  <path d="M607 531L752 507V520L607 545Z" fill="#0f3046"/>
  <path d="M554 495V510L607 545V531Z" fill="#21485b"/>
  <path d="M566 255C583 331 610 413 649 492L721 494C679 410 646 323 642 238Z" fill="url(#cv-stem)"/>
  {stem_flutes()}
  <path d="M574 262C593 340 622 422 658 490" stroke="#a4b7a8" stroke-opacity=".46" stroke-width="1.1"/>
  <path d="M640 250C645 328 678 421 713 491" stroke="#0d2c42" stroke-opacity=".6" stroke-width="2"/>
  <path d="M354 226C414 139 593 70 760 100C735 193 668 238 590 258C488 279 406 257 354 226Z" fill="url(#cv-metal)"/>
  <path d="M383 220C463 151 615 99 736 110C700 179 645 213 584 233C512 254 444 246 383 220Z" fill="url(#cv-inside)"/>
  {canopy_ribs()}
  <path d="M354 226C425 259 500 281 590 258C668 238 735 193 760 100L752 122C731 214 674 253 592 274C490 298 409 271 347 239Z" fill="url(#cv-rim)"/>
  <path d="M354 226C414 139 593 70 760 100" stroke="url(#cv-gold)" stroke-width="1.45"/>
  <path d="M355 230C436 266 509 276 590 254C667 234 719 186 747 121" stroke="#a2c6c1" stroke-opacity=".53" stroke-width="1"/>
  <path d="M363 240C445 277 517 286 591 267C662 250 715 211 740 165" stroke="#1a485e" stroke-opacity=".5" stroke-width="1.2"/>
 </g>
 <path d="M380 222C464 160 602 111 729 111" stroke="#80cbc9" stroke-opacity=".14" stroke-width="8" filter="url(#cv-soft)"/>
 <g class="cv-photon" fill="#badbd0"><circle cx="612" cy="128" r="1.8" opacity=".7"/><circle cx="476" cy="179" r="1.8" opacity=".5"/></g>
</g>
{seated_companion()}
<style>.cv-photon{{animation:cv-breathe 7s ease-in-out infinite}}@keyframes cv-breathe{{0%,100%{{opacity:.38}}50%{{opacity:.9}}}}@media(prefers-reduced-motion:reduce){{.cv-photon{{animation:none}}}}</style>'''


def main():
    content = artwork()
    for name, viewbox in [('community-relief.svg', '0 0 800 600'), ('community-relief-mobile.svg', '210 -75 530 575')]:
        doc = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" fill="none"><title>江岸旧巷与光谷新光</title><desc>以马蹄莲建筑的曲面、光子晶格与青金水带构成的原创数智浮雕，保留人物前方的完整空间。</desc>{content}</svg>'
        (DEST / name).write_text(doc, encoding='utf-8')
    print('Built desktop and mobile architectural reliefs.')


if __name__ == '__main__':
    main()
