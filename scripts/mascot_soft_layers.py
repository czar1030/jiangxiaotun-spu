"""Shared continuous fabric layers; positional guides remain invisible."""
import xml.etree.ElementTree as ET

NS='http://www.w3.org/2000/svg'

def fragment(text):
    return ET.fromstring(f'<g xmlns="{NS}">{text}</g>')

def soften_arms(root,electronics=False):
    parts={n.get('data-travel'):n for n in root.iter() if n.get('data-travel')}
    body=parts['body']
    if 'rightSoft' not in parts:
        root.insert(0,fragment('''<defs><linearGradient id="softJade" gradientUnits="userSpaceOnUse" x1="335" y1="550" x2="565" y2="730"><stop stop-color="#8eaa86"/><stop offset=".17" stop-color="#4e8a70"/><stop offset=".48" stop-color="#296e5a"/><stop offset=".78" stop-color="#154c41"/><stop offset="1" stop-color="#0e332f"/></linearGradient></defs>'''))
        for side in ['right','left']:
            parts[side+'Upper'].set('opacity','0')
            sleeve=fragment(f'''<g data-travel="{side}Soft">
              <path data-travel="{side}Sleeve" fill="url(#softJade)"/>
              <path data-travel="{side}SleeveShade" fill="#163f38" opacity=".23"/>
              <path data-travel="{side}SleeveLight" fill="#b5d0ad" opacity=".15"/>
              <path data-travel="{side}Cap" fill="url(#coutureSilk)"/>
              <path data-travel="{side}Outline" fill="none" stroke="#47685a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
              <path data-travel="{side}Highlight" fill="none" stroke="#d0dbc0" stroke-width="1.7" opacity=".46" stroke-linecap="round"/>
              <path data-travel="{side}Folds" fill="none" stroke="#204d40" stroke-width="1.2" opacity=".45" stroke-linecap="round"/>
              <path data-travel="{side}Embroidery" fill="none" stroke="url(#coutureGold)" stroke-width=".85" opacity=".8" stroke-linecap="round" stroke-linejoin="round"/>
            </g>''')[0]
            body.insert(2,sleeve)
            overlay=parts[side+'ForeOverlay']
            for child in list(overlay):overlay.remove(child)
            overlay.extend(fragment(f'''
              <path data-travel="{side}SoftFront" fill="url(#softJade)"/>
              <path data-travel="{side}SoftFrontShade" fill="#163f38" opacity=".23"/>
              <path data-travel="{side}SoftFrontLight" fill="#b5d0ad" opacity=".15"/>
              <path data-travel="{side}SoftFrontEdge" fill="none" stroke="#47685a" stroke-width="1.9" stroke-linecap="round"/>
              <path data-travel="{side}FrontEmbroidery" fill="none" stroke="url(#coutureGold)" stroke-width=".85" opacity=".8" stroke-linecap="round" stroke-linejoin="round"/>
              <path data-travel="{side}Cuff" fill="url(#coutureSilk)" stroke="#a8916b" stroke-width="1.5" stroke-linejoin="round"/>
              <path data-travel="{side}CuffShade" fill="#69755c" opacity=".22"/>
              <path data-travel="{side}CuffFold" fill="none" stroke="#b8a780" stroke-width=".9" opacity=".7"/>
              <path data-travel="{side}CuffTrim" fill="none" stroke="url(#coutureGold)" stroke-width="1.6"/>
              <path data-travel="{side}CuffStitch" fill="none" stroke="#e4d1a0" stroke-width=".65" stroke-dasharray=".7 1.8"/>
              <g data-travel="{side}Device"><path d="M-14-9H14" stroke="#d8ba80" stroke-width="2"/></g>'''))
    parts={n.get('data-travel'):n for n in root.iter() if n.get('data-travel')}
    skin=next(n.get('id') for n in root.iter() if (n.get('id') or '').endswith('skin'))
    for side in ['right','left']:
        if side+'Relaxed' not in parts:
            parts[side+'Palm'].extend(fragment(f'''<g data-travel="{side}Relaxed" opacity="0" fill="url(#skin)">
              <path d="M-9-8C-13-3-13 5-10 12L-8 22Q-7 27-4 24L-3 15L-1 25Q1 29 3 25L3 16L7 24Q10 27 11 23L9 13L12 17Q16 18 16 14L12 3Q10-6 5-8Z"/>
              <path d="M-9 2Q-17 0-17 6Q-16 12-7 13L-3 10Q-2 6-5 5Z"/>
              <path d="M-5 13L-4 19M1 13L2 20M7 12L8 18M-10 5L-7 7" fill="none" stroke="#d2a393" stroke-width="1.1"/>
            </g>'''))
        if side+'Wave' not in parts:
            parts[side+'Palm'].extend(fragment(f'''<g data-travel="{side}Wave" opacity="0" fill="url(#skin)">
             <path data-travel="{side}WaveShape" d="M-9-7Q-13 0-11 10L-17 6Q-23 4-21 10L-12 21L-8 32Q-6 37-3 33L-3 23L0 38Q3 42 5 37L5 23L10 34Q14 38 15 33L11 19L17 26Q22 29 21 23L15 6Q12-5 6-8Z"/>
             <path d="M-6 8Q0 5 7 10M-5 17Q1 14 8 17" fill="none" stroke="#d2a393" stroke-width="1"/>
            </g>'''))
        if side+'Rub' not in parts:
            parts[side+'Palm'].extend(fragment(f'''<g data-travel="{side}Rub" opacity="0" fill="url(#skin)">
             <path d="M-10 4Q-14-1-12-8L-10-20Q-8-28-2-25Q3-29 8-24Q15-23 15-16L13-4Q10 5 4 7Z"/>
             <path d="M-9-7Q-17-12-18-5Q-19 2-8 4L-2 0Q1-4-3-6Z"/>
             <path d="M-8-18Q-4-22-1-18M-1-19Q3-23 6-19M6-18Q10-21 12-17M-8-8Q-3-10 1-6" fill="none" stroke="#cf9e8a" stroke-width="1.2"/>
             <path d="M-5-23Q1-26 6-23" fill="none" stroke="#fff3e6" stroke-width="1.7"/>
            </g>'''))
    if electronics:
        parts={n.get('data-travel'):n for n in root.iter() if n.get('data-travel')}
        for side in ['right','left']:
            parts[side+'Device'].extend(fragment('''<rect x="-8" y="-24" width="16" height="8" rx="3" fill="#214651" stroke="#97d3c9" stroke-width="1"/><path d="M-3-20H3" stroke="#a0f2de" stroke-width="1.8"/>'''))
    # Keep legacy group names for older renderers, but remove the stacked palm,
    # finger and thumb drawings. The production rig morphs one connected hand.
    parts={n.get('data-travel'):n for n in root.iter() if n.get('data-travel')}
    for side in ['right','left']:
        palm=parts[side+'Palm']
        for child in list(palm):
            if child.get('data-travel')==side+'HandModel':
                palm.remove(child)
            else:
                for node in child.iter():
                    if node.tag.endswith(('path','circle','ellipse','rect')):
                        node.set('display','none')
        palm.extend(fragment(f'''<g data-travel="{side}HandModel" fill="url(#{skin})" stroke="#a77b69" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">
          <path data-travel="{side}HandShape"/>
          <path data-travel="{side}HandCreases" fill="none" stroke="#cc9e89" stroke-width=".85"/>
          <path data-travel="{side}HandNails" fill="none" stroke="#fff2df" stroke-width="1.15"/>
        </g>'''))

def namespace_ids(root,prefix):
    identifiers={node.get('id'):prefix+node.get('id') for node in root.iter() if node.get('id')}
    for node in root.iter():
        for key,value in list(node.attrib.items()):
            if key=='id':node.set(key,identifiers[value]);continue
            for original,unique in identifiers.items():value=value.replace('url(#'+original+')','url(#'+unique+')')
            if value.startswith('#') and value[1:] in identifiers:value='#'+identifiers[value[1:]]
            node.set(key,value)
