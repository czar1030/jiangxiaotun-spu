"""An original engraved city atlas, designed around the travel mascot."""


def city_engraving():
    parts = ['''
<defs>
 <linearGradient id="atlas-land" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#49796d" stop-opacity=".12"/><stop offset=".45" stop-color="#42796e" stop-opacity=".48"/><stop offset="1" stop-color="#163f43" stop-opacity=".15"/></linearGradient>
 <linearGradient id="atlas-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#779f8c" stop-opacity=".08"/><stop offset=".4" stop-color="#c7bd8a" stop-opacity=".45"/><stop offset=".7" stop-color="#82b5a5" stop-opacity=".3"/><stop offset="1" stop-color="#719c8f" stop-opacity=".08"/></linearGradient>
 <linearGradient id="atlas-current" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#70b9b0" stop-opacity=".06"/><stop offset=".5" stop-color="#72b7b6" stop-opacity=".32"/><stop offset="1" stop-color="#5aa9a9" stop-opacity=".07"/></linearGradient>
 <linearGradient id="engraved-stone" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#285750"/><stop offset=".45" stop-color="#7b9d80"/><stop offset=".62" stop-color="#486f60"/><stop offset="1" stop-color="#204a49"/></linearGradient>
 <linearGradient id="engraved-roof"><stop stop-color="#325d51"/><stop offset=".45" stop-color="#a8ac79"/><stop offset=".7" stop-color="#587c61"/><stop offset="1" stop-color="#204b44"/></linearGradient>
 <clipPath id="atlas-hankou-crop"><path d="M467 331L681 193Q738 161 799 179L839 192L805 286Q777 354 706 379L576 432L467 399Z"/></clipPath>
 <clipPath id="atlas-wuchang-crop"><path d="M945 282Q1031 232 1127 256L1225 278V456L1083 498L959 468L929 365Q913 313 945 282Z"/></clipPath>
 <clipPath id="atlas-hanyang-crop"><path d="M480 511L659 469Q710 461 756 481L827 515L778 574L557 537Z"/></clipPath>
 <filter id="atlas-clearance-feather" x="-.15" y="-.15" width="1.3" height="1.3"><feGaussianBlur stdDeviation="4"/></filter>
 <mask id="atlas-landmark-clearance" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="800">
  <path d="M0 0H1200V800H0Z" fill="white"/>
  <g fill="black" filter="url(#atlas-clearance-feather)">
   <path d="M640 193H686V276L723 287V369H597V287H636Z"/>
   <path d="M1071 284H1116V316L1134 335L1158 374V429H1029V372L1052 333L1071 316Z"/>
   <g transform="translate(616 536) rotate(-12)"><rect x="-24" y="-64" width="470" height="105" rx="10"/></g>
  </g>
 </mask>
</defs>
<g id="three-towns-atlas">
 <!-- The river is the organising gesture: three engraved banks unfold around it. -->
 <path d="M449 579C553 551 586 475 690 454S849 450 888 348S1027 208 1225 240" stroke="url(#atlas-current)" stroke-width="38"/>
 <path d="M453 568C558 535 590 459 691 439S834 432 873 340S1019 195 1225 225M452 591C563 563 599 493 702 473S868 458 906 356S1040 227 1225 257" stroke="#7fb7a8" stroke-opacity=".16" stroke-width=".8"/>
 <path d="M467 331L681 193Q738 161 799 179L839 192L805 286Q777 354 706 379L576 432L467 399Z" fill="url(#atlas-land)" stroke="url(#atlas-rim)" stroke-width="1.1"/>
 <path d="M467 399V407L574 440L706 386Q783 358 812 287L846 194" stroke="#0a3035" stroke-opacity=".6" stroke-width="4"/>
 <path d="M945 282Q1031 232 1127 256L1225 278V456L1083 498L959 468L929 365Q913 313 945 282Z" fill="url(#atlas-land)" stroke="url(#atlas-rim)" stroke-width="1.2"/>
 <path d="M480 511L659 469Q710 461 756 481L827 515L778 574L557 537Z" fill="url(#atlas-land)" stroke="url(#atlas-rim)" stroke-width="1"/>
 <!-- Contours and streets are locally aligned to the three banks. -->
 <g mask="url(#atlas-landmark-clearance)" fill="none" stroke="#92baa1" stroke-opacity=".12" stroke-width=".7">
  <g clip-path="url(#atlas-hankou-crop)">
   <path d="M493 347L687 218Q737 191 791 206M505 366L696 240Q731 218 782 229M522 386L704 264Q737 243 773 250M554 402L710 294Q738 278 761 275"/>
   <path d="M539 321L592 397M580 292L634 374M624 263L677 351M676 231L727 311"/>
  </g>
  <g clip-path="url(#atlas-wuchang-crop)">
   <path d="M974 299Q1059 264 1198 302M969 334Q1070 299 1219 339M978 376Q1083 343 1225 382M992 422Q1101 392 1220 432"/>
   <path d="M1019 284L1044 475M1064 276L1094 483M1110 278L1143 470M1159 288L1190 453"/>
  </g>
  <g clip-path="url(#atlas-hanyang-crop)">
   <path d="M513 514L662 486L785 531M540 528L661 505L765 546M574 538L660 522L744 554M592 497L621 533M644 487L672 540M701 508L714 560"/>
  </g>
 </g>
 <!-- Small raised blocks catch a restrained brass edge, like a printed relief. -->
 <g mask="url(#atlas-landmark-clearance)" fill="#416e61" fill-opacity=".38" stroke="#a8b78d" stroke-opacity=".24" stroke-width=".6">
''']
    for x, y, w in [(536,342,25),(571,319,27),(608,297,24),(647,273,22),
                    (995,319,22),(1033,306,23),(1110,328,24),(1151,341,22),
                    (1007,380,22),(1126,402,22),(1164,413,21),(590,508,24),(685,530,23)]:
        parts.append(f'<path d="M{x} {y}l{w} -7 5 16 -{w} 7Z"/><path d="M{x} {y}v-4l{w} -7v4M{x+w} {y-7}l5 16" fill="none"/>')
    parts.append('''
 </g>
 <!-- Hankou: the Jianghanguan clock tower and its colonnaded riverfront. -->
 <g id="atlas-clocktower" transform="translate(661 333)" opacity=".9" stroke-linejoin="round">
  <path d="M-58 7L-4-7L58 7L9 23Z" fill="#153d3d" stroke="#92a684" stroke-opacity=".4"/>
  <path d="M-49-25L4-37L49-24V6L4 17L-49 5Z" fill="url(#engraved-stone)" stroke="#a8b78d" stroke-width=".8"/>
  <path d="M4-37L49-24V6L4 17Z" fill="#173f3f" fill-opacity=".5"/>
  <path d="M-54-29L3-43L54-28L49-23L4-34L-49-22Z" fill="url(#engraved-roof)" stroke="#adb68c" stroke-width=".7"/>
  <path d="M-13-37V-83L3-88L19-82V-34L4-30Z" fill="url(#engraved-stone)" stroke="#b0bb94" stroke-width=".8"/>
  <path d="M3-88L19-82V-34L4-30Z" fill="#214843"/>
  <path d="M-17-84L3-91L23-84L19-79L3-85L-13-79Z" fill="url(#engraved-roof)" stroke="#c5c39c" stroke-width=".7"/>
  <path d="M-10-90V-102L3-111L15-102V-90L3-86Z" fill="#31564a" stroke="#acb48a" stroke-width=".8"/>
  <path d="M-15-103L3-117L20-103L15-100L3-110L-10-100ZM3-117V-127" fill="url(#engraved-roof)" stroke="#bdb98c" stroke-width=".8"/>
  <ellipse cx="-3" cy="-70" rx="6" ry="7" fill="#abb995" fill-opacity=".62" stroke="#d2c99c" stroke-width=".7"/>
  <path d="M-3-75V-70L1-68M-7-53V-39M1-55V-40M10-53V-39" stroke="#d1c99a" stroke-width=".8"/>
  <path d="M-41-16V0M-29-19V3M-17-22V6M-5-25V8M14-24V7M27-20V4M40-16V1" stroke="#aeba94" stroke-width="2"/>
  <path d="M-47-7L4 5L47-6M-47 0L4 12L47 1" stroke="#b3bd95" stroke-opacity=".55" stroke-width=".7"/>
 </g>
 <!-- Wuchang: five distinct eaves, a quiet gold engraving rather than an icon. -->
 <g id="atlas-yellow-crane-tower" transform="translate(1093 387) scale(.72)" opacity=".9">
  <path d="M-82 5Q0-18 82 5L64 16L-65 16Z" fill="#2c5b50" stroke="#9dad85" stroke-width=".7"/>
''')
    for y, w in [(0,64),(-23,53),(-45,43),(-66,32),(-85,21)]:
        parts.append(f'''<path d="M{-w+9} {y}V{y-16}H{w-9}V{y}Z" fill="url(#engraved-stone)" stroke="#9baa81" stroke-width=".7"/>
<path d="M{-w-9} {y-17}Q{-w+8} {y-14} {-w+19} {y-26}H{w-19}Q{w-8} {y-14} {w+9} {y-17}L{w-2} {y-10}H{-w+2}Z" fill="url(#engraved-roof)" stroke="#c3bd8d" stroke-width=".8"/>
<path d="M{-w+17} {y-5}H{w-17}M{-w+17} {y-15}V{y-2}M{w-17} {y-15}V{y-2}M-9 {y-15}V{y-2}M9 {y-15}V{y-2}" stroke="#c0bd8b" stroke-width=".65"/>''')
    parts.append('''
  <path d="M0-111V-126M-5-120H5M-74 17H74M-56 22H56" stroke="#c2bd8d" stroke-width="1"/>
 </g>
 <!-- A bridge stitches the atlas to the real river below the mascot. -->
 <g id="atlas-river-bridge" transform="translate(616 536) rotate(-12)" stroke-linecap="round" opacity=".66">
  <path d="M-18 10H438V18H-18Z" fill="#285551" stroke="#9fb292" stroke-width=".85"/>
  <path d="M42 10V-56H52V11M338 10V-56H348V11M38-56H56M334-56H352" stroke="#bac29a" stroke-width="1.4"/>
  <path d="M47-49Q195 44 343-49M-18 10Q14-12 47-49M343-49Q387-10 438 10" stroke="#c1c298" stroke-width="1.1"/>
''')
    for x in range(65,335,18):
        y = -49 + 2 * ((x-47)/296) * (1-(x-47)/296) * 93
        parts.append(f'<path d="M{x} {y:.1f}V10" stroke="#9bb69b" stroke-width=".65"/>')
    parts.append('''
  <path d="M47 19V35M343 19V35M-17 14H438" stroke="#547e6b" stroke-width="1.3"/>
 </g>
 <g font-family="Noto Serif SC,SimSun,serif" fill="#bdc69e" font-size="14" letter-spacing="5" opacity=".57">
  <text x="540" y="251" transform="rotate(-31 540 251)">汉口</text>
  <text x="1150" y="383" transform="rotate(6 1150 383)">武昌</text>
  <text x="533" y="547" transform="rotate(-12 533 547)">汉阳</text>
 </g>
 <g fill="#aec6aa" font-family="sans-serif" font-size="7" letter-spacing="1.2" opacity=".5">
  <text x="617" y="358">江汉关 · 江岸风华</text>
  <text x="1060" y="416">黄鹤楼 · 江城千年</text>
 </g>
</g>
''')
    return '\n'.join(parts)
