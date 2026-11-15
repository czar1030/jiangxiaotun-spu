import {cleanCitationTokens, resolveSubject} from './media-utils.mjs?v=7';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function tableCells(line) {
  return line.trim().replace(/^\|/,'').replace(/(?<!\\)\|$/,'').replace(/\\\|/g,'\u0000').split('|').map(cell=>cell.trim().replace(/\u0000/g,'|'));
}

// Return null for ordinary prose. Tables scroll inside their own container on narrow screens.
export function readMarkdownTable(lines, start, renderCell = escape) {
  if (!lines[start]?.includes('|') || !lines[start+1]) return null;
  const headers=tableCells(lines[start]), rules=tableCells(lines[start+1]);
  if(headers.length<2 || rules.length!==headers.length || !rules.every(cell=>/^:?-{3,}:?$/.test(cell)))return null;
  let end=start+2;
  const rows=[];
  while(end<lines.length && lines[end].trim() && lines[end].includes('|')){
    const row=tableCells(lines[end]);if(row.length!==headers.length)break;rows.push(row);end++;
  }
  const alignment=i=>rules[i].startsWith(':')&&rules[i].endsWith(':')?'center':rules[i].endsWith(':')?'right':'left';
  return {end,html:`<div class="answer-table-wrap" role="region" aria-label="${escape(headers.join(' / '))}" tabindex="0"><table><thead><tr>${headers.map((cell,i)=>`<th scope="col" style="text-align:${alignment(i)}">${renderCell(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>`<td style="text-align:${alignment(i)}">${renderCell(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`};
}

// Match each stop against the reviewed catalog, never against a model-provided image URL.
export function itinerarySubjects(plan, subjects) {
  return (plan?.days || []).flatMap(day => (day.stops || []).map(stop => resolveSubject(subjects, stop.name))).filter(subject => subject?.image);
}

export function dayRevisionPrompt(plan, dayNumber, locale = 'zh-CN') {
  const day = plan?.days?.find(day => String(day.day) === String(dayNumber));
  if (!day) return '';
  return locale.startsWith('zh')
    ? `请调整《${plan.title}》中第${day.day}天「${day.title}」，其余天数和安排保持不变，保留已有住宿、同行与预算条件。我的修改要求：`
    : `Please revise day ${day.day} (“${day.title}”) of “${plan.title}”. Keep the other days, accommodation, companions and budget unchanged. My requested change: `;
}

export function revisionPlanForDraft(context, question) {
  return context?.prefix && String(question).startsWith(context.prefix) ? context.plan : undefined;
}

export function renderPlanOverview(days, index, chinese = true) {
  return `<nav class="plan-overview" aria-label="${chinese ? '行程概览，选择一天查看详情' : 'Itinerary overview: choose a day'}">${days.map((day, position) => `<button type="button" data-answer-jump="plan-${index}-day-${position}"><span>DAY ${String(day.day).padStart(2,'0')}</span><strong>${escape(cleanCitationTokens(day.title))}</strong><small>${escape(day.stops.slice(0,3).map(stop => cleanCitationTokens(stop.name)).join(' · '))}</small><i aria-hidden="true">↓</i></button>`).join('')}</nav>`;
}

export function installAnswerLayout({getState, getLocale, onDraft}) {
  const messages = document.querySelector('#messages');
  const openDays = new Map();
  const text = (zh, en) => getLocale().startsWith('zh') ? zh : en;
  messages.addEventListener('click', event => {
    const jump = event.target.closest('[data-answer-jump]');
    if (jump) {
      const target = document.getElementById(jump.dataset.answerJump);
      if (!target || !messages.contains(target)) return;
      if (target.tagName === 'DETAILS') target.open = true;
      target.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
      (target.querySelector('summary') || target).focus({preventScroll:true});
    }
    const revise = event.target.closest('[data-refine-day]');
    if (revise) {
      const plan = getState().messages[Number(revise.dataset.message)]?.result?.itinerary;
      const draft = dayRevisionPrompt(plan, revise.dataset.refineDay, getLocale());
      if (draft) onDraft(draft, plan);
    }
  });
  return {
    remember() {
      if (!getState().messages.length) {openDays.clear();return;}
      messages.querySelectorAll('.itinerary-day[id]').forEach(day => openDays.set(day.id, day.open));
    },
    sync() {
      messages.querySelectorAll('.itinerary-day[id]').forEach(day => {
        if (openDays.has(day.id)) day.open = openDays.get(day.id);
      });
      messages.querySelectorAll('.message.assistant').forEach(article => {
        const bubble = article.querySelector('.bubble');
        const headings = [...bubble.querySelectorAll('h3')];
        if (headings.length < 3) return;
        const nav = document.createElement('nav');
        nav.className = 'reply-outline';
        nav.setAttribute('aria-label', text('回答目录', 'Answer contents'));
        nav.dataset.noI18n = '';
        const label = document.createElement('span');label.textContent = text('快速阅读', 'IN THIS ANSWER');nav.append(label);
        headings.forEach((heading, i) => {
          heading.id = `${article.id}-section-${i}`;
          heading.tabIndex = -1;
          const button = document.createElement('button');
          button.type = 'button';button.dataset.answerJump = heading.id;button.textContent = heading.textContent;nav.append(button);
        });
        bubble.before(nav);
      });
    },
    reset() {openDays.clear();}
  };
}
