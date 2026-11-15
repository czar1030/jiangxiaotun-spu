"""Draw Jiang Xiaotun's Jingchu redesign as editable SVG paths.

No reference bitmaps are embedded. SVG is the master; PNG/WebP are generated
for the website. Requires Pillow and resvg-py, no image API or model weights.
"""
from pathlib import Path
import io
import json
import shutil
import resvg_py
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/jiangxiaotun-v3'
DEST.mkdir(parents=True, exist_ok=True)
W, H = 760, 920

DEFS = '''<defs>
 <linearGradient id="hair" x1="0%" y1="0%" x2="65%" y2="100%"><stop stop-color="#416a83"/><stop offset=".44" stop-color="#355875"/><stop offset=".8" stop-color="#376c80"/><stop offset="1" stop-color="#75b0b2"/></linearGradient>
 <linearGradient id="bang" x1="10%" y1="0%" x2="80%" y2="100%"><stop stop-color="#557e96"/><stop offset=".48" stop-color="#3d647f"/><stop offset="1" stop-color="#304f6a"/></linearGradient>
 <linearGradient id="hairEdge" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#325572"/><stop offset=".6" stop-color="#4d8194"/><stop offset="1" stop-color="#a0cdca"/></linearGradient>
 <linearGradient id="jade" x1="0%" y1="0%" x2="80%" y2="100%"><stop stop-color="#77b6a6"/><stop offset=".42" stop-color="#438d83"/><stop offset="1" stop-color="#245b60"/></linearGradient>
 <linearGradient id="silk" x1="0%" y1="0%" x2="70%" y2="100%"><stop stop-color="#fffdf3"/><stop offset=".52" stop-color="#f9efd9"/><stop offset="1" stop-color="#e4d5b8"/></linearGradient>
 <linearGradient id="gold" x1="0%" y1="0%" x2="75%" y2="100%"><stop stop-color="#fff1ba"/><stop offset=".48" stop-color="#e5bd78"/><stop offset="1" stop-color="#b98446"/></linearGradient>
 <linearGradient id="tail" x1="0%" y1="0%" x2="100%" y2="80%"><stop stop-color="#2a506b"/><stop offset=".6" stop-color="#448a96"/><stop offset="1" stop-color="#9bd2c6"/></linearGradient>
 <radialGradient id="skin" cx="50%" cy="30%" r="80%"><stop stop-color="#fff6e9"/><stop offset=".7" stop-color="#ffeddf"/><stop offset="1" stop-color="#eac4b7"/></radialGradient>
 <radialGradient id="blush"><stop stop-color="#ef9d9a" stop-opacity=".65"/><stop offset="1" stop-color="#f8c7b5" stop-opacity="0"/></radialGradient>
 <linearGradient id="iris" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="#604133"/><stop offset=".33" stop-color="#9e6339"/><stop offset=".7" stop-color="#e6b65c"/><stop offset="1" stop-color="#ffe6a0"/></linearGradient>
 <linearGradient id="white" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="#d5d8dc"/><stop offset=".28" stop-color="#fffdf7"/></linearGradient>
 <g id="wave" fill="none" stroke="#d8bc80" stroke-width="1.8" stroke-linecap="round"><path d="M0 7Q8-3 16 7T32 7T48 7M1 13Q9 3 17 13T33 13T49 13"/></g>
 <g id="crane" stroke="#996d39" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M-29 8Q-8-7 9 2L4 14Q-12 21-29 8Z" fill="url(#gold)"/><path d="M-21 8Q-17-12-34-23Q-14-23-3-6L8 5" fill="url(#gold)"/><path d="M6 8C24 0 8-18 20-23Q26-26 29-22" fill="none" stroke="#f1d49a" stroke-width="6"/><path d="M27-22L39-18L28-16" fill="#e4b76c"/><circle cx="25" cy="-23" r="1.6" fill="#5d5140" stroke="none"/><path d="M-15 11L-4 12M-3 17L-8 31M7 16L12 28" fill="none"/><circle cx="-8" cy="34" r="4" fill="#a5d3bc"/><circle cx="12" cy="31" r="3.5" fill="#a5d3bc"/></g>
 <g id="phoenix" fill="none" stroke="#e7cb8d" stroke-width="1.5" stroke-linecap="round"><path d="M-23 4Q-8-18 5-7Q17 1 8 11Q-2 18-8 7Q-10-1-3-2Q3-3 4 2M6-9Q20-15 24-8L16-5M-12 7Q-25 15-23 25Q-8 18-7 10M-7 13Q-5 34 12 31Q11 22 0 18M-19-1Q-35-8-31-20Q-15-16-10-7"/></g>
</defs>'''

def svg(markup, label):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc"><title id="title">江小豚 · 楚风灵豚 · {label}</title><desc id="desc">重新绘制的矢量设定：江蓝斜刘海、琥珀眼、黄鹤簪、青玉交领短襦、楚凤水纹短裙与江豚尾鳍。参考与制作记录见 CREDITS.md。</desc>{DEFS}<g stroke="#304e60" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">{markup}</g></svg>'''

def render(markup):
    data = resvg_py.svg_to_bytes(svg_string=markup, zoom=2, skip_system_fonts=True)
    return Image.open(io.BytesIO(data)).convert('RGBA').resize((W,H), Image.Resampling.LANCZOS)

def save(name, markup=None, image=None):
    if markup:
        (DEST/f'{name}.svg').write_text(markup, encoding='utf8')
        image = render(markup)
    image.save(DEST/f'{name}.png', optimize=True)
    image.save(DEST/f'{name}.webp', quality=95, method=6)
    return image

TAIL = '''<g id="porpoise-tail"><path d="M455 658C511 728 574 737 600 683C563 673 553 634 568 602C588 605 611 628 618 649C637 623 667 612 699 618C697 660 673 698 628 697C597 794 509 787 454 716Z" fill="url(#tail)"/><path d="M476 709Q574 786 618 682Q591 672 579 633M620 676Q646 640 681 631" fill="none" stroke="#b3ded2" stroke-opacity=".65" stroke-width="3"/><path d="M619 676Q633 655 659 647M609 678Q595 660 588 644" fill="none" stroke="#315c70" stroke-width="1.7"/></g>'''

LEGS = '''<g id="legs"><path d="M306 703L307 779Q320 795 343 780L348 706M412 705L417 780Q437 795 453 778L454 703" fill="url(#skin)" stroke="#b38272" stroke-width="2"/><path d="M306 754Q325 762 345 754L345 783Q327 797 307 781ZM416 755Q436 762 454 755L454 782Q435 795 418 782Z" fill="url(#silk)"/><path d="M303 779Q325 786 345 775Q358 782 357 804Q336 826 299 808Q296 791 303 779ZM416 776Q436 785 454 777Q464 791 461 808Q426 825 408 808Q405 788 416 776Z" fill="url(#jade)"/><path d="M301 805Q330 815 354 803M411 803Q433 815 459 803" fill="none" stroke="#233f51" stroke-width="3"/><path d="M310 785Q322 772 336 787Q322 784 318 797M427 788Q439 772 449 785Q438 785 434 798" fill="none" stroke="#f1d29a" stroke-width="2"/><path d="M312 771L338 771M421 771L449 771" stroke="#c7aa75" stroke-width="1.5"/></g>'''

BACK_HAIR = '''<g id="hair-under"><path d="M191 362C139 429 147 507 180 557Q164 580 142 572Q170 612 210 591Q222 625 257 609Q264 633 292 616L477 619Q504 635 526 604Q565 620 584 585Q616 593 631 564Q598 580 590 546C634 466 619 375 573 333Z" fill="url(#hairEdge)"/><path d="M193 428Q170 529 207 565Q198 580 184 580M225 441Q205 556 248 584M565 421Q608 515 565 565M538 440Q570 556 528 587" fill="none" stroke="#294d68" stroke-width="2"/><path d="M181 487Q177 538 193 552M228 502Q226 552 245 570M579 479Q594 531 575 549M538 516Q547 550 531 572" fill="none" stroke="#9cc9c7" stroke-opacity=".5" stroke-width="6"/></g>'''

RIBBONS = '''<g id="pibo"><path d="M286 483C260 508 241 566 210 597C190 621 173 621 159 601C154 635 173 654 202 645C257 629 264 549 297 517Z" fill="url(#silk)" stroke="#a48d6b" stroke-width="2"/><path d="M476 485C505 522 521 563 551 582Q583 609 597 590Q600 624 570 627C523 627 505 565 466 516Z" fill="url(#silk)" stroke="#a48d6b" stroke-width="2"/><path d="M283 495Q254 550 226 591Q194 641 170 625M482 501Q525 584 559 601Q579 615 590 606" fill="none" stroke="#d5b578" stroke-width="2"/></g>'''

SKIRT = '''<g id="skirt"><path d="M302 572Q263 628 247 710Q285 737 326 729Q383 755 433 730Q479 742 523 711Q499 624 462 572Z" fill="url(#silk)"/><path d="M313 585Q281 656 277 720M340 590L324 730M378 591L377 740M419 590L433 730M449 584Q475 652 488 722" fill="none" stroke="#c3c2a9" stroke-width="2.2"/><path d="M312 583L279 719Q300 727 321 720L343 585M413 585L435 722Q460 728 484 716L450 583" fill="#73a99a" fill-opacity=".16" stroke="none"/><path d="M300 567Q282 612 273 649Q309 674 347 651L382 613L421 651Q457 673 494 648Q485 610 464 567Z" fill="url(#jade)"/><path d="M275 644Q314 669 346 646L382 607L421 646Q456 667 492 644" fill="none" stroke="#edce93" stroke-width="4.5"/><path d="M254 696Q287 716 325 708Q381 732 432 708Q476 721 516 696L523 711Q480 742 433 730Q382 755 326 729Q285 737 247 710Z" fill="url(#jade)"/><use href="#wave" transform="translate(260 701) scale(.8)"/><use href="#wave" transform="translate(322 714) scale(.85)"/><use href="#wave" transform="translate(389 716) scale(.85)"/><use href="#wave" transform="translate(457 703) scale(.8)"/><path d="M284 706L294 673M470 706L458 675" stroke="#e1d8bd" stroke-width="3"/><use href="#phoenix" transform="translate(314 619) scale(.7)"/><use href="#phoenix" transform="translate(450 618) scale(-.7 .7)"/></g>'''

TORSO = '''<g id="cross-collar"><path d="M349 453L349 481L319 488L310 565Q380 593 453 565L447 489L416 480L414 453Z" fill="url(#skin)" stroke="#b48d76" stroke-width="2"/><path d="M345 476L382 508L415 476L446 489L458 570Q384 594 302 569L314 490Z" fill="url(#silk)"/><path d="M341 477L385 515L416 477L430 486L384 536L329 487Z" fill="#fefbf2"/><path d="M341 477L382 515M416 478L369 533" fill="none" stroke="#5a938b" stroke-width="8"/><path d="M342 478L382 514M416 479L370 532" fill="none" stroke="#e8cf9b" stroke-width="2"/><path d="M316 489L307 553Q331 570 350 558L369 533M446 489L457 553Q422 571 410 555L396 527" fill="none" stroke="#dac8a6" stroke-width="2"/><path d="M305 553Q382 572 456 553L464 580Q382 602 300 579Z" fill="url(#jade)"/><path d="M304 557Q382 577 458 557M302 577Q380 597 461 577" fill="none" stroke="#e4c17e" stroke-width="2"/><path d="M396 577C414 570 429 586 413 594Q402 594 403 581C391 601 379 585 396 577Z" fill="url(#silk)" stroke="#b8955d" stroke-width="1.5"/><path d="M406 590L401 645L412 652L420 596" fill="url(#silk)" stroke="#b8955d" stroke-width="1.5"/><path d="M425 590L433 628" fill="none" stroke="#b8955d" stroke-width="2"/><rect x="424" y="626" width="20" height="31" rx="7" fill="#b5d5ba" stroke="#6f9b8b" stroke-width="1.5"/><path d="M429 640Q435 634 440 640Q436 647 429 640ZM435 657L435 675M430 659L430 674M440 659L440 674" fill="none" stroke="#e8d6a2" stroke-width="1.5"/></g>'''

def arms(mood):
    if mood == 'happy':
        return '''<g id="arms-welcome"><path d="M313 488Q281 478 262 497L228 464Q215 483 212 507Q241 554 272 562L308 538Z" fill="url(#jade)"/><path d="M449 489Q480 478 498 497L532 465Q547 481 550 506Q518 555 487 561L452 537Z" fill="url(#jade)"/><path d="M215 484L244 512L232 527L207 502ZM522 512L546 485L554 503L536 528Z" fill="url(#silk)" stroke="#bd9b64" stroke-width="2"/><path d="M224 487Q210 475 206 461Q204 450 211 452L220 465L217 443Q219 431 225 444L230 460L233 439Q239 433 240 444L240 463Q247 450 252 456Q256 462 246 478L238 490Z" fill="url(#skin)" stroke="#b67c70" stroke-width="1.8"/><path d="M539 488Q554 475 557 460Q560 448 553 452L544 464L547 443Q544 432 539 445L534 459L531 440Q525 433 525 445L525 463Q518 450 513 456Q509 462 519 478L527 490Z" fill="url(#skin)" stroke="#b67c70" stroke-width="1.8"/><path d="M258 518Q278 545 299 529M465 529Q489 543 512 517" fill="none" stroke="#9dc9b4" stroke-width="3"/></g>'''
    if mood == 'serious':
        return '''<g id="folded-arms"><path d="M315 488Q283 483 274 518L276 558Q311 584 359 565L401 540L389 520L320 541L334 509Z" fill="url(#jade)"/><path d="M447 487Q480 489 487 520L483 559Q446 581 405 560L367 535L380 515L443 538L429 512Z" fill="url(#jade)"/><path d="M356 541L381 526L396 543L374 559ZM405 540L383 528L371 543L394 558Z" fill="url(#silk)" stroke="#b99c6e" stroke-width="2"/><path d="M384 529Q391 518 409 523L425 529Q430 534 420 537L402 535L393 543ZM379 532Q370 521 357 526L340 532Q335 538 345 539L362 536L371 546Z" fill="url(#skin)" stroke="#b98877" stroke-width="1.6"/><path d="M290 547Q323 559 344 551M420 549Q452 560 471 549" fill="none" stroke="#a5cdb5" stroke-width="2"/></g>'''
    if mood == 'thinking':
        return '''<g id="thinking-arms"><path d="M314 488Q286 488 278 520L273 580Q298 597 319 582L332 516Z" fill="url(#jade)"/><path d="M278 565L318 571L316 587Q295 599 272 582Z" fill="url(#silk)" stroke="#b79b6a" stroke-width="2"/><path d="M283 587L281 606Q285 616 292 612L295 603Q300 617 307 612L310 591Z" fill="url(#skin)" stroke="#b98877" stroke-width="1.8"/><path d="M448 488Q476 489 484 518L462 549Q432 547 413 504L421 478L448 485Z" fill="url(#jade)"/><path d="M418 475L446 482L441 501L413 494Z" fill="url(#silk)" stroke="#b79b6a" stroke-width="2"/><path d="M422 482L413 465Q408 457 416 454L429 460L425 438Q428 430 433 440L440 462Q450 466 441 486Z" fill="url(#skin)" stroke="#b98877" stroke-width="1.8"/></g>'''
    if mood == 'worried':
        return '''<g id="worried-arms"><path d="M314 489Q281 489 276 519L290 559L337 580L348 552L315 532Z" fill="url(#jade)"/><path d="M448 489Q480 491 484 519L470 559L424 580L413 552L445 532Z" fill="url(#jade)"/><path d="M329 547L348 553L343 580L323 569ZM414 553L434 548L440 569L420 581Z" fill="url(#silk)" stroke="#b79b6a" stroke-width="2"/><path d="M345 556Q358 547 372 552L383 565Q383 576 375 573L367 566Q359 581 344 576ZM418 556Q403 547 391 551L379 564Q378 576 386 572L395 566Q405 582 419 575Z" fill="url(#skin)" stroke="#b98877" stroke-width="1.8"/></g>'''
    return '''<g id="arms-rest"><path d="M314 488Q284 487 275 519L265 583Q286 602 311 590L331 520Z" fill="url(#jade)"/><path d="M269 568L313 576L310 593Q287 604 264 586Z" fill="url(#silk)" stroke="#b79b6a" stroke-width="2"/><path d="M276 590L272 611Q274 623 281 619L285 608Q288 624 295 618L298 611Q302 621 307 613L308 594Z" fill="url(#skin)" stroke="#b98877" stroke-width="1.8"/><path d="M446 488Q475 486 487 514L510 549Q509 572 482 574L449 560L449 538L478 543L456 520Z" fill="url(#jade)"/><path d="M448 535L469 544L464 565L443 559Z" fill="url(#silk)" stroke="#b79b6a" stroke-width="2"/><path d="M447 541Q438 530 427 534Q420 538 426 544L435 548Q422 548 426 555L445 560L454 553Z" fill="url(#skin)" stroke="#b98877" stroke-width="1.8"/><path d="M287 543L282 560M482 538L491 552" fill="none" stroke="#b4d5bc" stroke-width="3"/></g>'''

def eye(x, mood='welcome', mirror=False):
    transform = f'translate({x} 367)'+(' scale(-1 1)' if mirror else '')
    if mood in ['blink','happy']:
        eye_art = '<path d="M-39 4Q-7-29 29 5" fill="none" stroke="#664c43" stroke-width="8"/><path d="M-37 3L-47-4M-31-2L-38-11" fill="none" stroke="#664c43" stroke-width="4"/>'
        if mood == 'happy':
            # Open smiling eyes retain the iris and bright catchlights.
            mood = 'smile-eye'
        else:
            return f'<g transform="{transform}">{eye_art}</g>'
    pupil_x = -4 if mood=='thinking' else 2
    return f'''<g transform="{transform}" id="eye-{'right' if mirror else 'left'}"><path d="M-44-15Q-10-43 34-15Q44 6 22 33Q-8 49-32 26Q-41 14-44-15Z" fill="url(#white)" stroke="#a67f6a" stroke-width="1.5"/><ellipse cx="{pupil_x}" cy="2" rx="29" ry="38" fill="url(#iris)" stroke="#76503a" stroke-width="1.5"/><path d="M-22 20Q-6 34 19 20L15 31Q-3 42-19 29Z" fill="#ffe3a0" stroke="none"/><ellipse cx="{pupil_x}" cy="-5" rx="11" ry="22" fill="#654339" stroke="none"/><path d="M-22 10L-16 14M-12 25L-9 19M4 28L4 21M18 21L14 15" fill="none" stroke="#fff4c0" stroke-width="2.5"/><ellipse cx="-10" cy="-18" rx="10" ry="12" fill="#fffef6" stroke="none"/><circle cx="18" cy="2" r="5" fill="#fffaf0" stroke="none"/><ellipse cx="-15" cy="18" rx="4" ry="2.5" fill="#fff4c6" stroke="none"/><path d="M-43-14Q-11-40 35-15L42-22Q40-8 32-6Q-7-30-38-6L-49-24Z" fill="#59453f" stroke="none"/><path d="M-40-13L-50-19M-32-23L-39-31M-20-27L-24-34" fill="none" stroke="#59453f" stroke-width="3.5"/><path d="M-30 29Q-5 44 20 31" fill="none" stroke="#956c57" stroke-width="1.3"/></g>'''

def face(mood):
    brows = {
        'welcome': 'M281 317Q305 306 332 319M418 317Q448 300 469 311',
        'blink': 'M281 317Q305 306 332 319M418 317Q448 300 469 311',
        'happy': 'M281 313Q304 300 330 310M419 310Q446 299 469 312',
        'thinking': 'M280 316Q306 301 331 313M418 317Q444 318 468 308',
        'serious': 'M279 305Q308 307 333 324M418 324Q446 307 471 304',
        'worried': 'M280 324Q309 317 330 306M418 306Q443 320 470 325',
    }[mood]
    mouth = {
        'welcome': '<path d="M369 441Q377 445 383 439Q390 446 396 440" fill="none" stroke="#b16d68" stroke-width="2.3"/>',
        'blink': '<path d="M369 441Q377 445 383 439Q390 446 396 440" fill="none" stroke="#b16d68" stroke-width="2.3"/>',
        'happy': '<path d="M360 430Q382 441 405 429Q403 459 382 461Q364 458 360 430Z" fill="#a25b57" stroke="#a25b57" stroke-width="2"/><path d="M369 452Q383 444 397 453Q382 467 369 452Z" fill="#efaa9d" stroke="none"/><path d="M363 432Q384 439 402 431L399 437Q382 444 366 438Z" fill="#fff7e9" stroke="none"/>',
        'thinking': '<path d="M377 440Q385 435 392 441" fill="none" stroke="#b16d68" stroke-width="2.4"/>',
        'serious': '<path d="M365 441L379 439L384 443L389 439L401 441" fill="none" stroke="#b16d68" stroke-width="2.4"/><path d="M260 417Q258 428 267 432M497 417Q500 429 491 433" fill="none" stroke="#e5b4a1" stroke-width="2"/>',
        'worried': '<ellipse cx="382" cy="441" rx="8" ry="10" fill="#af7370" stroke="none"/>',
    }[mood]
    sweat = '<path d="M507 343Q524 370 516 377Q502 382 502 367Q502 357 507 343Z" fill="#add9df" stroke="#fff8ed" stroke-width="2"/>' if mood=='worried' else ''
    return f'''<g id="face"><path d="M243 301Q255 261 297 255L456 256Q508 274 520 320L513 411Q503 467 382 481Q265 469 249 421Z" fill="url(#skin)" stroke="#bd9381" stroke-width="2.2"/><path d="M252 337Q253 295 288 282M484 282Q509 303 511 332" fill="none" stroke="#dfb9a5" stroke-width="8" stroke-opacity=".3"/><ellipse cx="275" cy="416" rx="44" ry="27" fill="url(#blush)" stroke="none"/><ellipse cx="489" cy="416" rx="44" ry="27" fill="url(#blush)" stroke="none"/>{eye(318,mood)}{eye(447,mood,True)}<path d="{brows}" fill="none" stroke="#36566b" stroke-width="3.2"/><path d="M380 413L383 414" stroke="#e2b39b" stroke-width="2"/>{mouth}<path d="M266 414L264 420M273 413L271 419M280 414L279 420M486 414L487 420M493 413L495 419M500 414L502 420" stroke="#d79a8c" stroke-width="1.3" opacity=".7"/>{sweat}</g>'''

HAIR_FRONT = '''<g id="asymmetric-hair"><path d="M175 366C146 261 198 152 290 136C388 90 513 132 560 199C610 250 617 349 583 409L552 458Q527 475 505 461Q541 441 530 392L513 319L473 295L299 286L254 325Q235 355 247 406Q245 447 265 469Q230 490 207 460Q180 433 175 366Z" fill="url(#hair)"/><path d="M306 150C261 175 216 238 214 317Q209 386 236 407Q209 412 197 394C180 344 194 263 227 219Q249 178 306 150Z" fill="url(#bang)"/><path d="M310 149C383 120 491 158 526 221Q550 268 523 331Q508 305 486 290Q482 330 452 349Q457 311 426 305C392 302 347 282 310 249Q287 281 268 323Q253 328 242 327C244 247 262 181 310 149Z" fill="url(#bang)"/><path d="M310 151C303 213 367 271 427 281Q468 290 461 330Q487 302 480 270" fill="none" stroke="#26475e" stroke-width="2.2"/><path d="M312 154C352 172 359 211 410 236Q453 260 481 253" fill="none" stroke="#7097a9" stroke-width="2" opacity=".7"/><path d="M302 181C286 212 278 250 267 281M248 213Q222 256 222 294M358 166Q416 164 460 204" fill="none" stroke="#91b6c1" stroke-width="7" opacity=".45"/><path d="M315 176Q315 203 328 219M338 216L350 230M361 238L376 247M397 256L411 260" fill="none" stroke="#adcbd0" stroke-width="9" opacity=".5"/><path d="M224 341Q207 413 228 445Q235 455 249 455M540 342Q562 404 541 442Q535 454 524 455" fill="none" stroke="#7caab4" stroke-width="6" opacity=".65"/><path d="M242 323Q217 352 228 389M518 326Q540 361 535 389" fill="none" stroke="#31506a" stroke-width="2"/><path d="M322 144C300 117 311 63 353 63C392 65 400 107 371 120C384 87 362 73 341 88C326 100 327 121 341 137Z" fill="url(#hair)"/><path d="M329 107Q329 79 353 79" fill="none" stroke="#93bdc5" stroke-width="3"/>
 <g id="side-knot"><path d="M558 215Q610 197 626 236Q638 272 608 295L574 284Z" fill="url(#bang)"/><path d="M574 227Q615 217 618 248Q613 272 590 273M584 238Q607 235 607 252" fill="none" stroke="#28465f" stroke-width="2"/><path d="M563 240Q581 255 615 257" fill="none" stroke="url(#gold)" stroke-width="5"/></g>
 <use href="#crane" transform="translate(575 261) rotate(-12) scale(.88)"/><path d="M566 293L563 324M581 291L588 315" stroke="#d5b170" stroke-width="1.6"/><ellipse cx="562" cy="327" rx="5" ry="8" fill="#b9d8c4" stroke="#638e84" stroke-width="1.3"/><circle cx="588" cy="318" r="4" fill="#e5c48b" stroke="#a88a59" stroke-width="1.3"/>
</g>'''

def front(mood='welcome'):
    head = face(mood)+HAIR_FRONT
    if mood=='thinking':
        head = '<g transform="rotate(-3 382 440)">'+head+'</g>'
    # Body stays behind the round chin. Folded/thinking hands are in front.
    # Hands must remain in front of the hair and chin for gestures to read.
    effect = '<path d="M507 343Q524 370 516 377Q502 382 502 367Q502 357 507 343Z" fill="#add9df" stroke="#fff8ed" stroke-width="2"/>' if mood=='worried' else ''
    return svg(TAIL+BACK_HAIR+RIBBONS+LEGS+SKIRT+TORSO+head+arms(mood)+effect, mood)

BACK = '''<g id="back-costume"><path d="M306 476L451 476L478 567L455 588L301 585L279 560Z" fill="url(#jade)"/><path d="M322 477Q382 499 436 477L446 493Q383 521 313 493Z" fill="url(#silk)"/><path d="M297 551Q381 575 466 551L462 580Q382 600 300 579Z" fill="url(#jade)"/><path d="M298 555Q381 581 465 555M301 577Q383 601 461 577" fill="none" stroke="#e7c88e" stroke-width="2"/><path d="M379 576C345 552 337 580 365 587C338 599 353 611 380 590C401 611 425 598 396 586C427 574 408 554 379 576Z" fill="url(#silk)" stroke="#b79462" stroke-width="1.5"/><path d="M370 591L351 664L371 656L381 605L398 662L417 667L394 590" fill="url(#silk)" stroke="#b79462" stroke-width="1.5"/><use href="#wave" transform="translate(359 639) scale(.8)"/></g>
 <g id="back-hair"><path d="M177 351C154 272 188 183 263 145Q375 90 486 144C570 175 610 256 591 356Q614 437 583 515Q606 546 627 528Q615 572 578 561Q568 594 535 580Q519 607 485 587Q452 610 422 591Q386 611 351 593Q314 611 282 591Q250 606 231 580Q193 599 181 566Q144 574 136 543Q168 556 180 526Q144 438 177 351Z" fill="url(#hair)"/><path d="M290 145Q224 232 240 381Q210 483 242 545M346 133Q294 259 313 399L296 566M409 132Q445 256 425 396L444 571M467 145Q530 251 511 393Q549 506 520 552M195 370Q171 470 195 522M572 371Q596 466 573 518" fill="none" stroke="#294d66" stroke-width="2"/><path d="M245 215Q221 265 228 320M319 194Q303 253 310 297M422 192Q439 250 432 292M510 220Q535 267 526 320" fill="none" stroke="#8db7c3" stroke-width="8" opacity=".5"/><path d="M233 449Q221 505 241 528M301 473L299 539M444 469L446 539M525 447Q541 505 522 530" fill="none" stroke="#a4d2cb" stroke-width="7" opacity=".6"/><path d="M202 278Q383 338 561 277" fill="none" stroke="#d7b475" stroke-width="5"/><path d="M327 139C306 115 314 68 351 65Q395 68 378 111Q378 82 353 81Q324 90 343 136Z" fill="url(#hair)"/><path d="M555 219Q600 204 618 235Q639 275 602 295L570 285Z" fill="url(#bang)"/><path d="M575 232Q611 222 616 251Q611 274 589 275" fill="none" stroke="#28465f" stroke-width="2"/><use href="#crane" transform="translate(577 264) rotate(-12) scale(.9)"/><path d="M566 295L561 326" stroke="#d5b170" stroke-width="1.6"/><ellipse cx="561" cy="328" rx="5" ry="8" fill="#b9d8c4" stroke="#638e84" stroke-width="1.3"/></g>'''

def back():
    arm_art = '''<g id="back-arms"><path d="M292 506L270 577Q283 598 311 587L327 523M456 505L484 575Q473 598 449 588L435 522" fill="url(#jade)"/><path d="M275 569L315 578L310 593L269 584M448 578L482 568L488 585L451 595" fill="url(#silk)" stroke="#b79b6a" stroke-width="2"/><path d="M279 591L278 612Q292 628 301 611L303 597M454 597L458 614Q473 626 477 611L474 592" fill="url(#skin)" stroke="#b98877" stroke-width="1.8"/></g>'''
    return svg(TAIL+RIBBONS+LEGS+SKIRT+arm_art+BACK, '背面')

SIDE = '''<g id="profile-hair-under"><path d="M345 176Q510 111 571 285Q603 385 561 516Q584 555 612 535Q601 576 565 564Q555 593 524 580Q499 606 471 587Q446 602 420 581L355 453Z" fill="url(#hair)"/><path d="M502 308Q553 438 522 540M550 357Q582 468 552 530M466 330Q497 448 477 560" fill="none" stroke="#2d526b" stroke-width="2"/><path d="M524 448Q539 507 521 531M478 473L477 541" fill="none" stroke="#96c8c6" stroke-width="6" opacity=".5"/></g>
 <g id="profile-body"><path d="M351 697L351 779L389 782L394 701M401 701L407 780L440 777L440 698" fill="url(#skin)" stroke="#b98877" stroke-width="2"/><path d="M351 754L389 754L390 784L351 784M406 754L440 753L441 783L407 784" fill="url(#silk)"/><path d="M350 777Q323 779 322 803Q355 819 394 808L393 783ZM407 779Q389 787 387 806Q411 819 449 808Q452 790 438 778Z" fill="url(#jade)"/><path d="M327 800Q354 811 388 801M395 803L443 803" stroke="#e1c68b" stroke-width="1.6"/>
 <path d="M356 568Q321 617 308 716Q350 741 387 731Q430 744 470 718L445 572Z" fill="url(#silk)"/><path d="M359 588L339 724M389 588L388 731M422 588L441 726" fill="none" stroke="#bdc0aa" stroke-width="2"/><path d="M357 568Q337 607 332 648Q360 666 385 650L409 615L444 648Q456 638 459 633L441 566Z" fill="url(#jade)"/><path d="M333 643Q361 663 384 644L409 608L444 642" fill="none" stroke="#ead09a" stroke-width="4"/><path d="M310 702Q351 724 387 714Q433 730 467 704L470 719Q430 744 387 731Q350 741 308 716Z" fill="url(#jade)"/><use href="#wave" transform="translate(320 710) scale(.85)"/><use href="#wave" transform="translate(392 715) scale(.85)"/>
 <path d="M369 460L369 484L351 491L347 565Q395 586 445 562L436 491L416 479L412 458" fill="url(#skin)" stroke="#b48d76" stroke-width="2"/><path d="M367 479L394 505L414 477L438 489L447 568Q396 592 344 568L350 491Z" fill="url(#silk)"/><path d="M363 483L394 515L418 481" fill="none" stroke="#4b8b81" stroke-width="8"/><path d="M363 483L394 515L418 481" fill="none" stroke="#e7cc97" stroke-width="2"/><path d="M346 552Q397 572 445 551L448 577Q398 598 343 578Z" fill="url(#jade)"/><path d="M346 556Q394 579 445 555" fill="none" stroke="#ddbd7f" stroke-width="2"/>
 <path d="M393 491Q372 513 381 546L389 590Q411 600 435 584L430 519Q429 493 412 489Z" fill="url(#jade)"/><path d="M386 572L432 568L438 586Q415 607 389 590Z" fill="url(#silk)" stroke="#b79b6a" stroke-width="2"/><path d="M396 594L395 613Q398 625 405 620L407 609Q410 625 418 620L420 610Q426 622 430 612L428 593Z" fill="url(#skin)" stroke="#b98877" stroke-width="1.8"/>
 <path d="M436 492Q471 526 483 578Q493 615 522 605Q520 630 497 629Q465 619 458 580L424 516Z" fill="url(#silk)" stroke="#a48d6b" stroke-width="2"/><path d="M437 510Q469 551 473 586Q480 619 506 620" fill="none" stroke="#d5b578" stroke-width="2"/><use href="#phoenix" transform="translate(408 535) scale(.6)"/>
 </g>
 <g id="profile-face"><path d="M311 287Q358 263 407 291L453 352Q450 423 413 466Q367 486 310 452Q293 440 287 416L271 406Q261 401 273 388L286 375L286 332Z" fill="url(#skin)" stroke="#b48d76" stroke-width="2"/><ellipse cx="310" cy="421" rx="33" ry="23" fill="url(#blush)" stroke="none"/>
 <g transform="translate(322 367) scale(.73 1)"><path d="M-31-17Q-2-40 28-16Q38 5 16 32Q-14 46-30 21Z" fill="url(#white)" stroke="#a67f6a" stroke-width="1.5"/><ellipse cx="-3" cy="3" rx="24" ry="37" fill="url(#iris)" stroke="#76503a" stroke-width="1.5"/><ellipse cx="-6" cy="-3" rx="9" ry="20" fill="#654339" stroke="none"/><ellipse cx="-13" cy="-18" rx="8" ry="11" fill="#fffef6" stroke="none"/><circle cx="10" cy="6" r="5" fill="#fffaf0" stroke="none"/><path d="M-31-16Q-5-42 29-16L36-21L31-6Q-3-31-27-7L-38-22Z" fill="#59453f" stroke="none"/><path d="M-29-16L-38-25" stroke="#59453f" stroke-width="3"/></g><path d="M298 317Q321 307 338 316" fill="none" stroke="#36566b" stroke-width="3"/><path d="M284 434Q292 437 299 433" fill="none" stroke="#b16d68" stroke-width="2"/>
 </g>
 <g id="profile-bangs"><path d="M285 351Q258 332 263 290Q253 210 315 157Q381 113 462 143Q544 161 570 239Q577 280 553 316L523 350Q505 356 490 347L474 308Q473 398 438 443Q420 467 397 460Q420 422 408 372Q390 352 383 325Q377 285 366 275Q346 305 320 322Q303 335 285 351Z" fill="url(#bang)"/><path d="M316 158Q283 235 299 285Q312 280 324 265M330 163Q356 204 361 252Q383 299 403 312M408 158Q459 184 474 247M433 323Q464 390 431 438" fill="none" stroke="#294b63" stroke-width="2"/><path d="M299 197Q281 229 287 254M338 187Q347 212 351 230M418 173Q448 185 460 208M436 359Q452 396 436 422" fill="none" stroke="#8bb5bf" stroke-width="7" opacity=".5"/><path d="M337 142Q312 111 330 81Q359 49 393 72Q421 95 399 115Q404 84 378 83Q350 82 351 107L358 135Z" fill="url(#hair)"/>
 <path d="M491 226Q535 202 566 228Q595 252 575 287Q547 314 514 291Z" fill="url(#bang)"/><path d="M506 238Q546 218 566 247Q579 274 546 286M523 247Q549 237 554 258" fill="none" stroke="#28465f" stroke-width="2"/><path d="M430 214Q452 249 509 259" fill="none" stroke="#d7b475" stroke-width="4"/><use href="#crane" transform="translate(536 262) rotate(-12) scale(.9)"/><path d="M528 293L523 326" stroke="#d5b170" stroke-width="1.6"/><ellipse cx="523" cy="329" rx="5" ry="8" fill="#b9d8c4" stroke="#638e84" stroke-width="1.3"/></g>'''

def side():
    return svg(TAIL+SIDE, '左侧面')

def board(views, name, title, subtitle, footer, size=(1800,1040)):
    canvas=Image.new('RGB',size,'#f2f2e9')
    d=ImageDraw.Draw(canvas)
    font=lambda n:ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',n)
    serif=lambda n:ImageFont.truetype('C:/Windows/Fonts/simsun.ttc',n)
    d.text((65,38),title,font=serif(43),fill='#254e54')
    d.text((68,99),subtitle,font=font(16),fill='#7a8e88')
    gap=25; count=len(views); cardw=(size[0]-130-gap*(count-1))//count
    bottom=size[1]-150
    for i,(label,im) in enumerate(views):
        x=65+i*(cardw+gap)
        d.rounded_rectangle((x,151,x+cardw,bottom),radius=24,fill='#fffcf4',outline='#d5dcd1',width=2)
        art=im.copy();art.thumbnail((cardw-15,bottom-235),Image.Resampling.LANCZOS)
        canvas.paste(art,(x+(cardw-art.width)//2,158),art)
        d.line((x+30,bottom-72,x+cardw-30,bottom-72),fill='#e6e4d5',width=2)
        length=d.textlength(label,font=font(22))
        d.text((x+(cardw-length)//2,bottom-53),label,font=font(22),fill='#365e5c')
    d.text((68,size[1]-113),footer,font=font(21),fill='#4e6e68')
    d.text((68,size[1]-63),'JIANG XIAO TUN / 03 · WUHAN · 江蓝 / 青玉 / 米白 / 琥珀 / 暖金',font=font(15),fill='#8a958b')
    canvas.save(DEST/f'{name}.png');canvas.save(DEST/f'{name}.webp',quality=94,method=6)
    return canvas

def main():
    images={}
    for name in ['welcome','blink','happy','thinking','serious','worried']:
        images[name]=save(name,front(name))
        avatar=images[name].crop((200,193,560,553)).resize((256,256),Image.Resampling.LANCZOS)
        save('avatar' if name=='welcome' else 'avatar-'+name,image=avatar)
    save('front-view',front())
    side_im=save('side-view',side())
    back_im=save('back-view',back())
    board([('正面 / 微微傲娇',images['welcome']),('左侧 / 黄鹤挽发',side_im),('背面 / 江豚尾鳍',back_im)],'three-views','江小豚 · 楚风灵豚','CHARACTER TURNAROUND / 斜刘海 · 琥珀眼 · 青玉交领 · 楚凤水纹','圆圆的江城姑娘，有一点傲娇，也有一点温柔。')
    board([(label,images[name]) for name,label in [('happy','开心 / 张手欢迎'),('thinking','思考 / 歪头托腮'),('serious','认真 / 抱臂鼓脸'),('worried','困惑 / 垂眉捏手')]],'emotions','小豚的心情，都写在脸上。','EMOTIONS & GESTURES / 同一套发型、服装与配色，四种表情动作','情绪由眉眼、嘴型和手势一起表达。',size=(1800,840))
    # Detail crops are explicit assets, avoiding fragile page-level offsets.
    for name,box in [('detail-hair',(164,73,635,459)),('detail-eyes',(235,295,527,456)),('detail-costume',(238,464,526,743))]:
        save(name,image=images['welcome'].crop(box))
    previous=ROOT/'public/assets/jiangxiaotun-v2'
    for name in ['CC-BY-NC-SA-4.0.txt','CC-BY-NC-SA-4.0.zh-CN.md']:
        if (previous/name).exists():shutil.copyfile(previous/name,DEST/name)
    meta={
        'name':'江小豚 · 楚风灵豚', 'version':3,
        'type':'newly drawn editable SVG paths; no embedded source raster',
        'builder':'scripts/build_mascot_v3.py', 'aiImageGenerationUsed':False,
        'palette':{'hair':'#355875','eyes':'#e6b65c','robe':'#438d83','ivory':'#f9efd9','gold':'#e5bd78'},
        'changes':['侧分斜刘海与圆润短发束','侧后小发髻、保留呆毛','琥珀金眼与微傲娇眉嘴','青玉交领短襦、无围裙和蕾丝头箍','楚式凤纹、水纹裙缘、轻披帛、黄鹤簪','重绘三视图、四情绪动作和网页眨眼帧'],
        'references':['https://github.com/xiaoweigen/deepseek-dafeiyu-assets','https://github.com/Cayhaze/deepseek-pet','https://github.com/YunYueSama/codex-deepseek-pet'],
        'referenceCredits':['上善无形（上善）','ZipZipPipe','YunYueSama','xiaoweigen'],
        'license':'CC BY-NC-SA 4.0 for this reference-informed art revision; historical raster sources remain in v2 with their original notices',
        'note':'现代荆楚风创作服装，并非特定朝代服制或汉绣实物的考据复原。角色独占权与商用授权未经法律审查。',
    }
    (DEST/'provenance.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf8')
    (DEST/'CREDITS.md').write_text('''# 江小豚 · 楚风灵豚 / 03

本版用 SVG 路径重新绘制发型、脸部、眼睛、服装、尾鳍、三视图与表情动作；没有嵌入参考角色的位图或旧版贴图。PNG / WebP 由 SVG 导出，头像由新立绘裁切。没有调用图像生成 API。

根据用户提供的蓝色大肥鱼 / 鲸鱼娘参考进行外观再设计，保留圆脸、大眼、短圆身材和呆毛的喜好。风格与设定参考：

- 原始鲸鱼娘角色：上善无形（上善）。
- DeepSeek 女仆衍生设定：ZipZipPipe。
- 高清参考图：YunYueSama，https://github.com/YunYueSama/codex-deepseek-pet 。
- 汉服 / 多视图参考：xiaoweigen，https://github.com/xiaoweigen/deepseek-dafeiyu-assets 。
- 桌宠与表情参考：Cayhaze，https://github.com/Cayhaze/deepseek-pet 。

主要变化：侧分斜刘海、圆润短发与侧髻；江蓝、青玉、米白、暖金的统一配色；琥珀眼；交领短襦、短圆裙、轻披帛；楚凤与水纹、黄鹤簪、江豚双叶尾鳍。服装为现代荆楚风创作，未宣称特定朝代考据复原。

本轮美术按 CC BY-NC-SA 4.0 共享，许可全文随附。该版本的重绘事实不代表已取得参考角色全部独占权或商业授权。历史 v2 及原始素材保持原许可，见相邻 jiangxiaotun-v2/CREDITS.md。

复现：python -X utf8 scripts/build_mascot_v3.py（Pillow、resvg-py）。SVG 为路径主文件，可在 Inkscape / Illustrator 中编辑；网页加载其 PNG / WebP 导出版本。
''',encoding='utf8')
    print('Built Jiang Xiaotun v3: editable SVG, 3 views, 6 states, avatars, design sheets.')

if __name__=='__main__':main()
