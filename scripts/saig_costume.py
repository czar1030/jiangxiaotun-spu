"""Jingchu dress drawn in three-quarter view, with explicit side/front planes."""
from mascot_soft_layers import fragment

def costume():
    return fragment('''<g data-soft="quarterCostume" stroke-linejoin="round" stroke-linecap="round">
      <defs>
        <linearGradient id="arenaIvory" x1="0" y1="0" x2="1" y2=".5"><stop stop-color="#f4e7cb"/><stop offset=".55" stop-color="#fff4dc"/><stop offset="1" stop-color="#e6d6b6"/></linearGradient>
        <linearGradient id="arenaJade" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#477868"/><stop offset=".55" stop-color="#639783"/><stop offset="1" stop-color="#73a18b"/></linearGradient>
        <linearGradient id="arenaSkirt" x1="0" y1="0" x2="1" y2=".4"><stop stop-color="#d7ccad"/><stop offset=".38" stop-color="#f2e6c9"/><stop offset=".75" stop-color="#fff4dc"/><stop offset="1" stop-color="#e6d8b8"/></linearGradient>
      </defs>
      <!-- Continuous far shoulder and side seam; the front closure is offset
           toward the opponent, rather than centered as on the frontal costume. -->
      <path d="M430 532Q474 522 510 527L545 541Q564 562 559 595L548 657L555 687Q484 717 411 685L419 632L404 575Q399 548 430 532Z" fill="url(#arenaJade)" stroke="#5d7663" stroke-width="2.4"/>
      <path d="M430 540Q447 565 473 584L470 664Q450 687 412 682L420 629L409 574Z" fill="#47776a" opacity=".6"/>
      <path d="M474 585Q514 583 548 566L550 653Q522 679 470 669Z" fill="#78a18a" opacity=".45"/>
      <!-- Rear collar, cross collar and a slim far lapel have different widths. -->
      <path d="M430 531Q473 519 510 527L541 541L523 558Q482 547 451 557Z" fill="#d9d2b3" stroke="#70816c" stroke-width="2"/>
      <path d="M408 546L430 532Q471 549 526 582L511 608Q453 589 413 565Z" fill="url(#arenaIvory)" stroke="#8b9176" stroke-width="2.2"/>
      <path d="M414 550Q463 574 515 597L511 605Q458 585 412 561Z" fill="#3d7061"/>
      <path d="M510 528L543 541L530 571L499 603L481 589L517 557Z" fill="#fff2d5" stroke="#8a9075" stroke-width="2"/>
      <path d="M536 544L526 568L498 594L491 589L520 560L524 540" fill="#436f60" stroke="none"/>
      <path d="M412 552Q459 572 487 588M533 544L524 566" fill="none" stroke="#dac18a" stroke-width="1.6"/>
      <!-- Belt curves around the body and disappears on the far hip. -->
      <path d="M418 656Q480 678 549 653L551 675Q486 704 414 678Z" fill="#ede0b9" stroke="#8f9774" stroke-width="2"/>
      <path d="M417 662Q484 685 550 660M416 672Q484 695 551 670" fill="none" stroke="#c4a76c" stroke-width="1.4"/>
      <path d="M419 684Q482 709 553 680L622 805Q588 836 516 845Q416 854 338 817Z" fill="url(#arenaSkirt)" stroke="#88927b" stroke-width="2.5"/>
      <path d="M421 689L338 817Q366 833 397 840L447 699Z" fill="#d1c5a6" opacity=".85"/>
      <path d="M447 700L397 837L409 841L455 702M473 706L455 846L467 847L480 707M510 703L529 842L541 840L519 702M538 693L585 829L596 824L546 689" fill="#cabb98" opacity=".4" stroke="none"/>
      <path d="M447 703L397 833M477 709L460 842M513 706L535 838M542 699L590 822" fill="none" stroke="#afad8a" stroke-width="1.5" opacity=".8"/>
      <path d="M339 810Q417 843 507 838Q585 833 619 801L622 813Q584 848 508 852Q417 858 337 823Z" fill="#396e60" stroke="#576f5a" stroke-width="1.6"/>
      <path d="M345 818Q418 849 507 845Q581 839 615 811" fill="none" stroke="#cdb77e" stroke-width="1.5"/>
      <path d="M360 824q5-7 10 2t11 3m23 6q5-8 10 0t11 2m23 2q5-9 10-1t11 1m24-1q4-9 10-3t11-2m22-1q4-9 10-3t11-3m20-5q3-8 8-4" fill="none" stroke="#dbcc96" stroke-width="1.5"/>
      <!-- Small Chu cloud motifs follow the near side plane, not a frontal decal. -->
      <g fill="none" stroke="#d6c88f" stroke-width="1.4" opacity=".85">
        <path d="M427 612q-9-10-14 0q-2 8 7 8q9-1 4-7m4-5q9-9 12 0q2 7-4 10q-6 3-6 11q0 8-8 5q-6-4 0-7"/>
        <path d="M538 614q-8-6-10 1q-2 7 5 6q5-2 2-5m3-4q6-7 9-1q2 5-3 9q-4 5-3 10"/>
      </g>
      <!-- Knot sits on the turned front plane; ribbons fall with gravity. -->
      <g fill="#f7e8bc" stroke="#bba471" stroke-width="1.3">
        <path d="M516 677Q495 664 494 677Q499 689 516 682Q533 665 536 676Q533 687 517 683Z"/>
        <ellipse cx="516" cy="681" rx="4" ry="6"/>
        <path d="M514 685Q503 708 505 741L511 747L515 738Q509 712 518 688Z"/>
        <path d="M519 685Q530 711 528 731L533 735L537 727Q537 705 522 684Z"/>
      </g>
      <path d="M508 739L508 752M511 741L511 751M532 730L533 742M536 729L537 739" stroke="#d4bd82" stroke-width="1.8"/>
    </g>''')[0]
