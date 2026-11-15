"""Jingchu silk and embroidery, fitted to the existing animated v5 anchors."""

MATERIALS = '''<defs>
 <linearGradient id="coutureJade" x1="0%" y1="8%" x2="100%" y2="85%"><stop stop-color="#8ab3a0"/><stop offset=".17" stop-color="#538e79"/><stop offset=".48" stop-color="#286d5e"/><stop offset=".78" stop-color="#20564d"/><stop offset="1" stop-color="#143e3d"/></linearGradient>
 <linearGradient id="coutureSilk" x1="0%" y1="15%" x2="95%" y2="80%"><stop stop-color="#fff9e9"/><stop offset=".34" stop-color="#f6ecd6"/><stop offset=".67" stop-color="#e4d7bd"/><stop offset="1" stop-color="#b4a58d"/></linearGradient>
 <linearGradient id="couturePleat" x1="0%" y1="40%" x2="100%" y2="58%"><stop stop-color="#b3aa93"/><stop offset=".12" stop-color="#d8cdb4"/><stop offset=".36" stop-color="#fff8e6"/><stop offset=".64" stop-color="#f5ead1"/><stop offset=".85" stop-color="#d9cdb3"/><stop offset="1" stop-color="#b8b09a"/></linearGradient>
 <linearGradient id="coutureGold" x1="0%" y1="0%" x2="40%" y2="100%"><stop stop-color="#fff2bf"/><stop offset=".28" stop-color="#e7ce90"/><stop offset=".55" stop-color="#bc995b"/><stop offset=".72" stop-color="#f1daa2"/><stop offset="1" stop-color="#a7834e"/></linearGradient>
 <linearGradient id="coutureRecess" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#203e35" stop-opacity=".35"/><stop offset="1" stop-color="#203e35" stop-opacity="0"/></linearGradient>
 <linearGradient id="coutureRibbon" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#bca57d"/><stop offset=".22" stop-color="#fff5d7"/><stop offset=".64" stop-color="#f2e1b5"/><stop offset="1" stop-color="#b9a179"/></linearGradient>
 <radialGradient id="coutureGem" cx=".3" cy=".2" r=".85"><stop stop-color="#e3f5d9"/><stop offset=".3" stop-color="#94c3a6"/><stop offset=".7" stop-color="#4c8d77"/><stop offset="1" stop-color="#255749"/></radialGradient>
 <linearGradient id="coutureBrass" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f1ddaa"/><stop offset=".2" stop-color="#cfb677"/><stop offset=".42" stop-color="#a98b53"/><stop offset=".62" stop-color="#e7ce8e"/><stop offset="1" stop-color="#877045"/></linearGradient>
 <linearGradient id="coutureLeather" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#ceb582"/><stop offset=".3" stop-color="#b79a68"/><stop offset=".75" stop-color="#96794e"/><stop offset="1" stop-color="#745c3c"/></linearGradient>
 </defs>'''

SKIRT_OUTLINE = 'M405 617Q369 659 323 713L276 763Q320 803 397 815Q469 827 553 812Q621 800 663 779L626 736Q568 672 531 617Z'


# Woven grounds remain low contrast; volume comes from tailored overlap and folds.
RICH_MATERIALS = '''<linearGradient id="coutureFold" x1="0" y1="0" x2="1" y2=".1"><stop stop-color="#667568"/><stop offset=".2" stop-color="#a7aa91"/><stop offset=".44" stop-color="#f3e8ce"/><stop offset=".63" stop-color="#fff7e3"/><stop offset="1" stop-color="#c6bca0"/></linearGradient>
 <linearGradient id="coutureUnder" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a3997f"/><stop offset=".5" stop-color="#ded3b8"/><stop offset=".76" stop-color="#fff4dc"/><stop offset="1" stop-color="#b7aa8d"/></linearGradient>
 <linearGradient id="coutureBelt" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#193f38"/><stop offset=".15" stop-color="#749f80"/><stop offset=".35" stop-color="#376e5b"/><stop offset=".72" stop-color="#1c4c42"/><stop offset=".92" stop-color="#143e37"/><stop offset="1" stop-color="#7c9b77"/></linearGradient>
 <linearGradient id="coutureCollar" x1="0" y1="0" x2="1" y2=".7"><stop stop-color="#a6aa91"/><stop offset=".16" stop-color="#e9dcc0"/><stop offset=".48" stop-color="#fff9e7"/><stop offset=".83" stop-color="#e5d6b5"/><stop offset="1" stop-color="#929a7f"/></linearGradient>
 <linearGradient id="coutureJadeRich" x1="0" y1="0" x2="1" y2=".85"><stop stop-color="#8eaa86"/><stop offset=".16" stop-color="#4e8a70"/><stop offset=".39" stop-color="#296e5a"/><stop offset=".72" stop-color="#154c41"/><stop offset="1" stop-color="#0e332f"/></linearGradient>
 <linearGradient id="coutureMetalEdge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffedb8"/><stop offset=".25" stop-color="#e3c485"/><stop offset=".5" stop-color="#9b7842"/><stop offset=".75" stop-color="#f4dba2"/><stop offset="1" stop-color="#826c40"/></linearGradient>
 <radialGradient id="coutureSilkLight" cx=".47" cy=".15" r=".9"><stop stop-color="#fffbee"/><stop offset=".47" stop-color="#eee3c8"/><stop offset="1" stop-color="#a9a48b"/></radialGradient>
 <pattern id="coutureDamask" width="28" height="32" patternUnits="userSpaceOnUse"><path d="M0 16Q7 5 14 16Q21 27 28 16M0 16Q7 27 14 16Q21 5 28 16M14 0Q20 7 14 13Q8 7 14 0ZM14 19Q20 26 14 32Q8 26 14 19Z" fill="none" stroke="#d7d49d" stroke-width=".55" opacity=".25"/></pattern>
 <pattern id="coutureWeave" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1H4M1 0V4" fill="none" stroke="#7d8067" stroke-opacity=".10" stroke-width=".28"/><path d="M0 3H4" fill="none" stroke="#fffceb" stroke-opacity=".28" stroke-width=".35"/></pattern>
 <g id="coutureCloud" fill="none" stroke="url(#coutureGold)" stroke-linecap="round"><path d="M-18 4Q-20-3-13-4Q-10-14 0-9Q9-15 13-6Q23-5 19 3Q9 6 4 1Q0-5-5-1Q-9 4-16 2M-12 8Q-5 3 1 7Q9 12 15 7" stroke-width="1"/><path d="M-13-2Q-8-6-5-4M4-8Q9-9 11-4" stroke-width=".5" opacity=".75"/></g>
 <g id="coutureCrane" stroke="url(#coutureGold)" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M-2 5C-8-2-5-11 3-13Q9-14 7-8L3-3Q1 2 7 7Q-1 12-7 8M6-10L13-10L7-8M-3 2Q-16-17-32-15Q-20-9-14-1Q-25-5-34-2Q-23 0-12 9M4 3Q18-16 32-12Q23-8 17-1Q27-5 34 0Q22 1 11 10M-7 8L-20 17L-7 12M3 10L10 20M7 9L15 18" stroke-width="1.2"/><path d="M-27-12L-14-5M-26-1L-14 4M27-10L16-4M28 0L16 4" stroke-width=".6"/><circle cx="5" cy="-10.5" r=".7" fill="#705d37" stroke="none"/></g>'''
MATERIALS=MATERIALS.replace('</defs>', RICH_MATERIALS+'</defs>')


def skirt():
    roots = [405,419,435,453,472,491,508,522,531]
    hems = [(276,763),(322,790),(374,811),(427,820),(480,823),(533,818),(584,805),(630,791),(663,779)]
    panels=[]
    for i in range(8):
        a,b=roots[i:i+2];(x,y),(u,v)=hems[i:i+2]
        outline=f'M{a} 617L{b} 617Q{(b+u)/2:.1f} 704 {u} {v}Q{(x+u)/2:.1f} {max(y,v)+3} {x} {y}Q{(a+x)/2:.1f} 704 {a} 617Z'
        panels.append(f'<path d="{outline}" fill="url(#coutureFold)"/>')
        panels.append(f'<path d="M{a+1} 625Q{(a+x)/2+2:.1f} 717 {x+2} {y-4}Q{x+10} {y-2} {x+14} {y-1}Q{(a+x)/2+9:.1f} 709 {a+4} 625Z" fill="#526451" opacity=".21"/>')
        panels.append(f'<path d="M{b-2} 646Q{(b+u)/2-5:.1f} 715 {u-4} {v-7}" fill="none" stroke="#fff9e4" stroke-width="1.1" opacity=".68"/>')
    left='M407 620Q391 646 365 694Q412 722 467 681L477 635Z'
    right='M484 630L531 620Q554 651 576 694Q527 720 474 683Z'
    return f'''<g data-travel="skirt" data-paint="couture-skirt" stroke-linejoin="round" stroke-linecap="round">
     <defs><clipPath id="coutureSkirtClip"><path d="{SKIRT_OUTLINE}"/></clipPath></defs>
     <path d="M285 766Q395 835 548 816Q613 804 658 779L660 788Q614 814 549 825Q399 845 282 775Z" fill="url(#coutureUnder)" stroke="#8b9278" stroke-width="1.3"/>
     <path d="M289 774Q398 837 548 819Q613 808 655 786" fill="none" stroke="#fff8e1" stroke-width="1.6"/>
     <path d="{SKIRT_OUTLINE}" fill="url(#coutureSilkLight)" stroke="#526450" stroke-width="2.2"/>
     <g clip-path="url(#coutureSkirtClip)">{''.join(panels)}
      <path d="{SKIRT_OUTLINE}" fill="url(#coutureWeave)"/>
      <path d="M398 623H541L574 686Q464 711 362 683Z" fill="#193c31" opacity=".19"/>
      <path d="M405 637Q380 722 351 783M439 637Q416 742 409 805M510 635Q527 741 539 803M533 636Q574 731 600 790" fill="none" stroke="#6d7860" stroke-opacity=".17" stroke-width="3.1"/>
      <g opacity=".28"><use href="#coutureCrane" transform="translate(371 750) scale(.65) rotate(-13)"/><use href="#coutureCrane" transform="translate(559 750) scale(-.65 .65) rotate(-13)"/>
       <use href="#coutureCloud" transform="translate(427 783) scale(.8)"/><use href="#coutureCloud" transform="translate(506 781) scale(.8)"/></g>
     </g>
     <path d="{left}" fill="#203a2c" opacity=".22" transform="translate(2 5)"/><path d="{right}" fill="#203a2c" opacity=".22" transform="translate(1 5)"/>
     <path d="{left}" fill="url(#coutureJadeRich)" stroke="#365441" stroke-width="1.6"/><path d="{right}" fill="url(#coutureJadeRich)" stroke="#365441" stroke-width="1.6"/>
     <path d="{left}" fill="url(#coutureDamask)"/><path d="{right}" fill="url(#coutureDamask)"/>
     <path d="M370 690Q414 716 465 681M480 681Q527 716 572 690" fill="none" stroke="#17382e" stroke-width="6.5"/>
     <path d="M370 688Q413 713 464 678M480 678Q526 713 572 688" fill="none" stroke="url(#coutureMetalEdge)" stroke-width="3.8"/>
     <path d="M375 685Q413 705 458 677M485 677Q528 705 567 685" fill="none" stroke="#e6d5a1" stroke-width=".65" stroke-dasharray="1 2.3"/>
     <use href="#coutureCrane" transform="translate(417 668) scale(.72) rotate(-10)"/><use href="#coutureCrane" transform="translate(529 668) scale(-.72 .72) rotate(-10)"/>
     <path d="M394 645Q406 638 420 643M518 644Q530 639 542 648" fill="none" stroke="#abc69a" stroke-opacity=".5" stroke-width="1.2"/>
     <path d="M284 752Q331 787 399 797Q469 808 550 795Q612 784 653 766L663 779Q618 801 553 812Q469 827 397 815Q320 803 276 763Z" fill="url(#coutureJadeRich)" stroke="#385b47" stroke-width="1.8"/>
     <path d="M287 754Q334 788 399 799Q469 810 550 797Q611 786 655 769M279 763Q325 800 398 813Q470 825 553 810Q616 799 660 778" fill="none" stroke="url(#coutureMetalEdge)" stroke-width="1.7"/>
     <path d="M293 761Q339 792 399 802Q470 814 550 800Q612 789 651 773" fill="none" stroke="#d9d3a0" stroke-width=".65" stroke-dasharray=".7 2.4"/>
     <use href="#wave" transform="translate(309 772) rotate(19)"/><use href="#wave" transform="translate(369 793) rotate(9)"/><use href="#wave" transform="translate(436 805)"/><use href="#wave" transform="translate(506 801) rotate(-7)"/><use href="#wave" transform="translate(574 785) rotate(-17)"/>
     <path d="M302 772L307 777M358 790L362 795M420 802L424 807M489 800L493 805M557 790L561 795M619 774L623 779" fill="none" stroke="#f5e5b5" stroke-width=".65"/>
    </g>'''


BODICE = '''<g data-paint="couture-bodice" stroke-linejoin="round" stroke-linecap="round">
 <path d="M399 546Q419 535 444 534L469 552L496 534Q525 535 540 546Q547 579 529 618Q469 634 408 618Q394 582 399 546Z" fill="url(#coutureSilkLight)" stroke="#647158" stroke-width="2"/>
 <path d="M399 546Q419 535 444 534L469 552L496 534Q525 535 540 546Q547 579 529 618Q469 634 408 618Q394 582 399 546Z" fill="url(#coutureWeave)"/>
 <path d="M402 546L421 549Q429 583 419 615L407 620Q395 584 402 546ZM531 543L515 548Q507 580 520 618L535 614Q547 576 531 543Z" fill="url(#coutureJadeRich)" stroke="#52745a" stroke-width="1.3"/>
 <path d="M405 548Q404 584 413 608M531 548Q539 578 529 608" fill="none" stroke="#b5c69b" stroke-width="1.5" opacity=".46"/>
 <path d="M423 568Q438 586 459 589M517 568Q506 591 489 599M426 603Q445 610 459 605M514 608L502 610" fill="none" stroke="#90987c" stroke-opacity=".62" stroke-width="2"/>
 <path d="M425 567Q442 580 454 580M503 599L492 605M428 599Q444 604 453 602" fill="none" stroke="#fffbed" stroke-width="1.4"/>
 <path d="M431 536L471 567L498 535L519 544L471 600L412 550Z" fill="#203f32" opacity=".3" transform="translate(1 4)"/>
 <path d="M432 534L473 566L457 584L413 546Z" fill="url(#coutureCollar)" stroke="#7b856a" stroke-width="1.5"/>
 <path d="M432 539L468 568L459 578L422 548Z" fill="url(#coutureJadeRich)" stroke="#b5985c" stroke-width="1.1"/>
 <path d="M431 535L471 566M416 547L455 582" fill="none" stroke="#fff9e5" stroke-width="1.5"/>
 <path d="M496 534L519 544L463 600L446 587Z" fill="url(#coutureCollar)" stroke="#77836b" stroke-width="1.5"/>
 <path d="M504 539L511 545L457 593L451 588Z" fill="url(#coutureJadeRich)" stroke="#d8bb7c" stroke-width="1.2"/>
 <path d="M517 544L462 598L448 587" fill="none" stroke="#fff9e5" stroke-width="1.5"/>
 <path d="M431 542L462 568M506 544L454 590" fill="none" stroke="#f0ddb0" stroke-width=".65" stroke-dasharray=".8 1.7"/>
 <path d="M410 606Q470 624 530 606L533 634Q469 654 404 634Z" fill="#16382f" opacity=".35" transform="translate(0 3)"/>
 <path d="M408 607Q470 624 530 607L533 631Q469 650 404 631Z" fill="url(#coutureBelt)" stroke="#35523f" stroke-width="1.7"/>
 <path d="M408 607Q470 624 530 607L533 631Q469 650 404 631Z" fill="url(#coutureDamask)" opacity=".6"/>
 <path d="M410 610Q469 628 529 610M406 629Q470 647 531 629" fill="none" stroke="url(#coutureMetalEdge)" stroke-width="1.8"/>
 <path d="M411 615Q466 632 527 615" fill="none" stroke="#bbd1a5" stroke-width=".6" stroke-dasharray=".8 2.2"/>
 <g data-travel="ribbons">
  <path d="M477 637Q467 663 463 705L477 702L486 652Q490 691 504 719L515 718Q498 681 496 638Z" fill="#203729" opacity=".28" transform="translate(2 4)"/>
  <path d="M477 637Q471 667 464 706L478 701Q482 673 487 650Q490 687 502 715L515 719Q500 681 495 636Z" fill="url(#coutureRibbon)" stroke="#a38955" stroke-width="1.25"/>
  <path d="M477 645Q473 674 469 697M492 647Q496 680 507 709" fill="none" stroke="#fff7dc" stroke-width="1.7"/>
  <path d="M464 706L472 695L478 701M502 715L505 705L515 719" fill="none" stroke="#8d784f" stroke-width="1.1"/>
  <path d="M480 632C464 615 449 624 456 636Q463 645 479 640C465 657 471 664 483 646C498 664 515 650 502 640C520 626 504 615 486 631Z" fill="#625c3c" opacity=".26" transform="translate(1 3)"/>
  <path d="M480 631C465 613 448 623 455 635Q462 644 479 638C466 653 470 661 482 644C496 661 513 648 500 638C518 624 503 614 486 630Z" fill="url(#coutureRibbon)" stroke="#9c8050" stroke-width="1.35"/>
  <path d="M477 633Q462 620 458 629Q456 635 474 635M488 633Q502 621 506 628Q509 633 491 636" fill="none" stroke="#fff6d8" stroke-width="1.8"/>
  <path d="M476 637Q461 637 457 632M489 638Q502 638 506 632M479 644L474 652M487 644L496 651" fill="none" stroke="#ae915a" stroke-width="1.2"/>
  <ellipse cx="483" cy="636" rx="7" ry="8" fill="url(#coutureMetalEdge)" stroke="#917544" stroke-width="1"/>
  <ellipse cx="482.5" cy="635" rx="4.8" ry="5.7" fill="url(#coutureGem)" stroke="#e3cf92" stroke-width=".6"/>
  <ellipse cx="481.2" cy="632.7" rx="1.5" ry="1.8" fill="#effbdc" opacity=".9"/>
  <path d="M516 639Q532 649 528 675" fill="none" stroke="#645e3c" stroke-width="2.8"/>
  <path d="M516 638Q531 649 527 674" fill="none" stroke="url(#coutureMetalEdge)" stroke-width="1.5"/>
  <path d="M519 673L535 675L538 680L536 701L531 706L516 703L513 697L515 679Z" fill="url(#coutureGem)" stroke="#b19b63" stroke-width="1.5"/>
  <path d="M520 677L531 678L533 681L532 698L528 702L519 700L517 696L518 682Z" fill="none" stroke="#e4e8b8" stroke-width=".8" opacity=".8"/>
  <g data-paint="yellow-crane-pendant" stroke="#f1dfab" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round">
   <path d="M526 678.5V680M523.5 682V685M528.5 682V685M522.8 686V689M529.2 686V689M522 690V693M530 690V693M521.3 694V697M530.7 694V697M520.5 698V700M531.5 698V700" fill="none"/>
   <path d="M522.2 681.1Q524.5 681.2 526 679.6Q527.5 681.2 529.8 681.1L529 682.4H523Z
    M521.1 685Q524.1 685 526 683.5Q527.9 685 530.9 685L530 686.5H522Z
    M520.3 689Q523.7 689 526 687.4Q528.3 689 531.7 689L530.7 690.5H521.3Z
    M519.5 693Q523.5 693 526 691.3Q528.5 693 532.5 693L531.3 694.5H520.7Z
    M518.8 697Q523.2 697 526 695.2Q528.8 697 533.2 697L531.9 698.5H520.1Z" fill="#ead399" stroke-width=".38"/>
   <path d="M525 682.5V684M527 686.6V688M524.8 690.6V692M527 694.6V696M525 698.6V700M519.8 700H532.2" fill="none" stroke-width=".5"/>
  </g>
  <path d="M526 706Q529 712 525 717M519 713Q516 721 517 733M522 715Q520 725 521 736M525 715Q526 727 525 738M528 714Q530 723 529 735M531 712Q535 722 533 731" fill="none" stroke="url(#coutureGold)" stroke-width="1.2"/>
  <ellipse cx="525" cy="714" rx="7.3" ry="2.8" fill="url(#coutureMetalEdge)"/>
 </g>
</g>'''


def polish_hair(hair, draw):
    """Draw only inside the existing hair alpha; face and eye pixels are kept."""
    from PIL import Image, ImageChops
    finish = draw('''<g stroke-linecap="round" stroke-linejoin="round" fill="none">
     <path d="M309 395C305 309 365 238 435 227M627 372Q653 432 622 486" stroke="#fff0ba" stroke-width="6" opacity=".23"/>
     <path d="M324 377C328 323 365 270 392 260M419 258C423 289 442 316 461 328M455 268Q495 284 518 318M552 297Q582 323 587 355" stroke="#ffe5a2" stroke-width="2.4" opacity=".6"/>
     <path d="M343 361Q360 311 385 286M429 276Q439 301 454 310M480 288Q501 300 515 320M608 379Q625 430 605 486" stroke="#fff4d0" stroke-width="1.2" opacity=".62"/>
     <path d="M413 277Q417 322 453 349M451 273Q481 289 497 316M370 312Q354 353 335 376M568 321Q588 358 590 389M309 428Q310 478 339 505M637 405Q640 457 617 492" stroke="#a66e32" stroke-width="1.25" opacity=".55"/>
     <path d="M312 465Q324 498 349 507M611 491L624 480M401 255Q400 297 425 325" stroke="#ffe6a3" stroke-width="2" opacity=".52"/>
    </g>''', hair.size)
    finish.putalpha(ImageChops.multiply(finish.getchannel('A'), hair.getchannel('A')))
    return Image.alpha_composite(hair, finish)

