"""Prepare current production artwork as reference for the animation turnaround."""
from pathlib import Path
import io
import json
import shutil
import subprocess
import xml.etree.ElementTree as ET

from PIL import Image
import resvg_py

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'output/imagegen/jiangxiaotun-turnaround-v1'
DEST.mkdir(parents=True, exist_ok=True)
attrs = json.loads(subprocess.run(['node', str(ROOT / 'scripts/mascot_rest_attributes.mjs')], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
tree = ET.parse(ROOT / 'public/assets/jiangxiaotun-v5/reception.svg')
for node in tree.getroot().iter():
    for key, value in attrs.get(node.get('data-soft'), {}).items():
        node.set(key, str(value))
svg = ET.tostring(tree.getroot(), encoding='unicode')
figure = Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg, width=1290, height=1700))).convert('RGBA')
figure.save(DEST / 'current-front-transparent.png')
white = Image.new('RGBA', figure.size, 'white')
white.alpha_composite(figure)
white.convert('RGB').save(DEST / 'current-front-reference.png')
shutil.copyfile(ROOT / 'public/assets/jiangxiaotun-v5/three-views.png', DEST / 'older-topology-reference.png')
prompt = '''Use case: identity-preserve
Asset type: production character turnaround reference for image-to-video animation.
Input image 1: PRIMARY reference, the CURRENT approved Jiang Xiaotun character from our website. This is authoritative for face, hair, proportions, costume, colors, embroidery, materials and shoes.
Input image 2: SECONDARY older turnaround; use only to understand the unseen side/back construction, bob haircut, small fin ears, rear bow and tail attachment. Its simpler older dress and flat rendering must be upgraded to match input 1, not copied.

Create ONE polished model sheet of this SAME character, exactly THREE evenly spaced full-body views on a pure white seamless background: left column FRONT (0 degrees), middle column true LEFT PROFILE (90 degrees, facing image-left), right column BACK (180 degrees). Each occupies one equal third of the canvas. No additional figures, inset details, labels, title, watermark, panel border, perspective grid, scenery, props or shadows crossing into another column. Leave clear whitespace between silhouettes and around every hair curl and tail tip. Use identical orthographic scale, identical height, identical head/body proportion, shared crown height and sole baseline. All feet and the entire thin curled crown hair must fit, uncropped.

Identity: very cute diminutive chibi anime girl, large round head, soft rounded cheeks, tiny nose and single tiny closed neutral mouth, large amber/golden irises with dark brown pupils and the exact thick upper eyelash shapes of image 1. Warm amber/golden short bob with the same side-swept layered bangs, softly modeled fine hair strands, rounded bob tips at the jaw, one curved raised ahoge strand, small gold crane hairpin with delicate dangling beads on the same anatomical side, short rounded blue-gray fin ears at cheek level. No visible long neck, no mature/adult proportions. Match the approved eye spacing, facial shape and head width from image 1; do not replace the face with a generic new anime face. The left profile has a genuine rounded forehead-nose-cheek silhouette and one visible eye. The rear view has no face, eyes or front bangs pasted onto the back of the head.

Current costume MUST match input 1: jade/deep teal and warm ivory modern Chu-inspired wrapped cross-collar outfit, warm ivory shoulder section, jade long sleeves with subtle tailored cloth folds and delicate gold botanical embroidery, narrow teal-and-gold collar piping, fitted jade waist panels with fine gold crane/water motifs, central ivory-gold decorative knot and turquoise-green stone, dangling ribbons and small jade hanging ornament on the same anatomical side. Bell-shaped warm ivory pleated skirt with detailed soft fabric volume, alternating subtle silk highlights, continuous deep jade hem band with gold wave embroidery. Preserve the current textile quality, fabric thickness and structured layers. Do not switch to the simplified green-shirt costume in image 2. Adapt seams, collar, sleeve overlaps and folds correctly for the profile and back; use a plausible matching back collar, waist bow and restrained matching gold embroidery. Ivory short socks with thin gold trim and dark slate blue rounded Mary Jane shoes with small warm gold fasteners. Normal connected calves and ankles, matching shoe volume from each angle.

The character has ONE blue-gray porpoise tail extending naturally from behind the lower back, curling low beside the skirt and ending in a horizontal pair of rounded caudal flukes. Keep its length, thickness, curve, fin anatomy and color consistent with image 1 and rotate it coherently with the character; no extra tails, shark fins or mermaid legs. Both humanoid legs stay visible in the front and back; profile is anatomically occluded correctly.

Pose and finish: relaxed neutral standing reference pose, arms slightly away from the skirt so sleeve and hand silhouettes remain readable, small natural hands with plausible fingers. Same calm friendly neutral expression. Preserve the current polished 2D anime illustration style, subtle silk shading, clean delicate warm-dark linework, soft highlights and sophisticated jade/ivory/gold palette. No 3D toy, photorealism, VR, laptop, bag, telescope, map or new costume. This is an animation identity sheet, not a character redesign. White background #FFFFFF, crisp high quality edges. Exactly three full-body figures, equally sized and precisely aligned.'''
(DEST / 'turnaround-prompt.txt').write_text(prompt + '\n', encoding='utf-8')
print(DEST)
