const motifs = {
  community: `<g fill="currentColor" stroke="none" text-anchor="middle"><text x="80" y="56" font-family="Georgia,serif" font-size="35" letter-spacing="7">SPU</text><text x="78" y="76" font-family="Inter,sans-serif" font-size="6.5" letter-spacing="2.5">PEOPLE × AI</text></g>`,
  saig: `<g fill="currentColor" stroke="none" text-anchor="middle"><text x="80" y="56" font-family="Georgia,serif" font-size="32" font-style="italic" letter-spacing="4">SAIG</text><text x="79" y="76" font-family="Inter,sans-serif" font-size="6.5" letter-spacing="2.4">CREATE · COMPETE</text></g>`
};

const seals = {wuhan:'楚', travel:'游', community:'智', saig:'竞'};

const companionCopy = {
  'zh-CN': ['这座城的故事，我陪你一起听。', '想去哪？我陪你把路认清楚。', '有想法就来，我陪你迈出第一步。', '拿出你的本事，我在场边给你撑腰。'],
  'zh-TW': ['這座城的故事，我陪你一起聽。', '想去哪？我陪你把路認清楚。', '有想法就來，我陪你邁出第一步。', '拿出你的本事，我在場邊給你撐腰。'],
  en: ['Let’s discover the stories of this city together.', 'Where to? We’ll find your way together.', 'Bring your idea. I’m here for your first step.', 'Show what you can do. I’ll be cheering you on.'],
  ja: ['この街の物語、一緒に聞こう。', 'どこへ行く？道は一緒に確かめよう。', 'アイデアを持っておいで。最初の一歩は一緒に。', '実力を見せて。そばで応援しているよ。'],
  ko: ['이 도시의 이야기를 함께 들어요.', '어디로 갈까요? 길은 함께 찾아봐요.', '아이디어가 있다면 와요. 첫걸음을 함께해요.', '실력을 보여줘요. 곁에서 응원할게요.'],
  fr: ['Découvrons ensemble les histoires de cette ville.', 'Où aller ? Trouvons le chemin ensemble.', 'Venez avec votre idée. Faisons le premier pas ensemble.', 'Montrez votre talent. Je suis là pour vous encourager.'],
  de: ['Entdecken wir gemeinsam die Geschichten dieser Stadt.', 'Wohin soll es gehen? Wir finden gemeinsam den Weg.', 'Bring deine Idee mit. Den ersten Schritt gehen wir zusammen.', 'Zeig, was du kannst. Ich feuere dich an.'],
  es: ['Descubramos juntos las historias de esta ciudad.', '¿Adónde vamos? Encontraremos el camino juntos.', 'Trae tu idea. Te acompaño en el primer paso.', 'Demuestra tu talento. Aquí estoy para animarte.'],
  pt: ['Vamos descobrir juntos as histórias desta cidade.', 'Para onde vamos? Encontraremos o caminho juntos.', 'Traga sua ideia. Vamos dar o primeiro passo juntos.', 'Mostre seu talento. Estou aqui para torcer por você.'],
  it: ['Scopriamo insieme le storie di questa città.', 'Dove andiamo? Troviamo la strada insieme.', 'Porta la tua idea. Facciamo insieme il primo passo.', 'Mostra il tuo talento. Sono qui a fare il tifo per te.'],
  ru: ['Давай вместе узнаем истории этого города.', 'Куда отправимся? Найдём дорогу вместе.', 'Приходи с идеей. Первый шаг сделаем вместе.', 'Покажи, что умеешь. Я буду за тебя болеть.'],
  ar: ['لنكتشف حكايات هذه المدينة معًا.', 'إلى أين؟ سنجد الطريق معًا.', 'تعال بفكرتك. سأرافقك في الخطوة الأولى.', 'أظهر موهبتك. سأكون هنا لتشجيعك.'],
  hi: ['आओ, इस शहर की कहानियाँ साथ सुनें।', 'कहाँ चलें? रास्ता साथ ढूँढ़ लेंगे।', 'अपना विचार लेकर आओ। पहला कदम साथ बढ़ाएँगे।', 'अपना हुनर दिखाओ। मैं तुम्हारा हौसला बढ़ाऊँगी।'],
  id: ['Mari temukan cerita kota ini bersama.', 'Mau ke mana? Kita cari jalannya bersama.', 'Bawa idemu. Kita ambil langkah pertama bersama.', 'Tunjukkan kemampuanmu. Aku akan mendukungmu.'],
  th: ['มาฟังเรื่องราวของเมืองนี้ด้วยกันนะ', 'อยากไปไหน? เรามาหาทางไปด้วยกัน', 'มีไอเดียก็มาเลย ก้าวแรกเราจะไปด้วยกัน', 'แสดงฝีมือเลย ฉันจะคอยเชียร์อยู่ข้าง ๆ'],
  vi: ['Cùng khám phá những câu chuyện của thành phố này nhé.', 'Muốn đi đâu? Mình cùng tìm đường nhé.', 'Hãy mang ý tưởng đến. Mình cùng bước bước đầu tiên.', 'Hãy thể hiện tài năng. Mình sẽ cổ vũ cho bạn.']
};
const modes = ['wuhan', 'travel', 'community', 'saig'];
export function shellCompanionLine(mode, locale) {
  return (companionCopy[locale] || companionCopy.en)[Math.max(0, modes.indexOf(mode))];
}
const landscapes = {wuhan:'crane', travel:'ferry'};
const art = (mode, className) => landscapes[mode]
  ? `<img class="${className} chrome-header-panorama" src="/assets/header-${landscapes[mode]}-river.svg?v=1" alt="" width="520" height="104" aria-hidden="true">`
  : `<svg class="${className}" viewBox="0 0 160 100" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${motifs[mode]}</svg>`;
const seal = mode => `<span class="chrome-seal-character" aria-hidden="true" data-no-i18n>${seals[mode]}</span>`;

export function installShellChrome({getLocale, reducedMotion}) {
  const sidebar = document.querySelector('.sidebar');
  const nav = document.querySelector('.main-nav');
  const guide = document.querySelector('.sidebar-guide');
  const portrait = guide.querySelector('img');
  const sceneWindow = document.createElement('div');
  sceneWindow.className = 'chrome-guide-window';
  sceneWindow.innerHTML = `<svg class="chrome-guide-landscape" viewBox="0 0 240 154" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-linecap="round" stroke-width=".85"><path d="M18 120C40 114 57 116 77 119M164 119C186 113 203 117 222 111"/><path d="M25 135C72 127 143 142 216 130" opacity=".65"/><path d="M51 145C98 140 140 147 184 141" opacity=".3"/></g></svg><span class="chrome-guide-platform" aria-hidden="true"></span><div class="chrome-guide-breath"></div>`;
  portrait.before(sceneWindow);
  sceneWindow.querySelector('.chrome-guide-breath').append(portrait);
  const line = guide.querySelector('p');
  line.dataset.noI18n = '';

  for (const [index, button] of [...nav.querySelectorAll('.nav-item')].entries()) {
    const mode = button.dataset.mode;
    button.querySelector(':scope > svg').outerHTML = `<span class="chrome-nav-seal" aria-hidden="true">${seal(mode)}</span>`;
    const label = button.querySelector(':scope > span:not(.chrome-nav-seal):not(.nav-arrow)');
    label.classList.add('chrome-nav-label');
    button.querySelector('.nav-arrow').innerHTML = `<small aria-hidden="true">0${index + 1}</small><i aria-hidden="true">↗</i>`;
    const attend = () => { guide.dataset.attention = mode; };
    const release = () => { delete guide.dataset.attention; };
    button.addEventListener('pointerenter', attend);
    button.addEventListener('pointerleave', release);
    button.addEventListener('focus', attend);
    button.addEventListener('blur', release);
  }

  const topbar = document.querySelector('.topbar');
  const left = topbar.querySelector('.topbar-left');
  const crumbs = document.createElement('div');
  crumbs.className = 'chrome-breadcrumbs';
  for (const child of [...left.children]) if (!child.matches('.menu-toggle')) crumbs.append(child);
  const stamp = document.createElement('span');
  stamp.className = 'chrome-header-seal'; stamp.setAttribute('aria-hidden', 'true');
  left.append(stamp, crumbs);
  const backdrop = document.createElement('div');
  backdrop.className = 'chrome-header-art'; backdrop.setAttribute('aria-hidden', 'true');
  topbar.prepend(backdrop);
  const river = document.createElement('div');
  river.className = 'chrome-header-river'; river.setAttribute('aria-hidden', 'true');
  river.innerHTML = '<svg viewBox="0 0 1200 12" preserveAspectRatio="none" fill="none"><path d="M0 8C190 8 196 2 348 5S501 11 644 6 858 2 976 5s133 1 224-3"/><path d="M0 11C190 11 196 5 348 8S501 14 644 9 858 5 976 8s133 1 224-3"/></svg><i></i>';
  topbar.append(river);
  let currentMode;
  let response;
  return {sync(mode) {
    if (!modes.includes(mode)) return;
    line.textContent = shellCompanionLine(mode, getLocale());
    sidebar.dataset.chromeMode = mode;
    if (mode === currentMode) return;
    stamp.innerHTML = seal(mode);
    backdrop.innerHTML = art(mode, 'chrome-header-motif');
    delete guide.dataset.attention;
    if (currentMode && !reducedMotion.matches && !document.hidden) {
      response?.cancel();
      response = sceneWindow.animate([
        {transform:'translateY(0)'}, {transform:'translateY(-2px)', offset:.36}, {transform:'translateY(0)'}
      ], {duration:650, easing:'cubic-bezier(.22,.61,.36,1)'});
    }
    currentMode = mode;
  }};
}
