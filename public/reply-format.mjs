const record = value => value && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

export function isItinerary(value) {
  return record(value) && typeof value.title === 'string' && Array.isArray(value.days) && value.days.length > 0 && value.days.length <= 30 &&
    new Set(value.days.map(day => day?.day)).size === value.days.length && value.days.every(day => record(day) && Number.isInteger(day.day) &&
      day.day >= 1 && day.day <= 30 && typeof day.title === 'string' && Array.isArray(day.stops) && day.stops.every(stop => record(stop) &&
        typeof stop.name === 'string' && typeof stop.time === 'string' && typeof stop.description === 'string'));
}

// Balanced scanning handles braces inside quoted descriptions and consecutive
// JSON objects. It never executes text or guesses missing closing braces.
function embeddedPlan(text) {
  let start = -1, depth = 0, quoted = false, escaped = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (!depth) {
      if (char !== '{') continue;
      start = index; depth = 1; quoted = false; escaped = false; continue;
    }
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && !--depth) {
      let payload;
      try { payload = JSON.parse(text.slice(start, index + 1)); } catch { continue; }
      const itinerary = isItinerary(payload.itinerary) ? payload.itinerary : isItinerary(payload) ? payload : null;
      if (itinerary) return {start, end: index + 1, payload, itinerary};
    }
  }
  return null;
}

function cleanFence(text) {
  return text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```(?:json)?\s*$/i, '').trim();
}

export function recoverReplyFormat(reply = {}) {
  if (typeof reply.answer !== 'string') return reply;
  const found = embeddedPlan(reply.answer);
  if (!found) return reply;
  const {payload, itinerary} = found;
  const before = cleanFence(reply.answer.slice(0, found.start));
  const after = cleanFence(reply.answer.slice(found.end));
  const prose = [...new Set([before, typeof payload.answer === 'string' ? payload.answer.trim() : '', after].filter(Boolean))].join('\n\n');
  const plan = isItinerary(reply.itinerary) ? reply.itinerary : itinerary;
  return {...payload, ...reply,
    answer: prose || plan.summary || plan.title,
    itinerary: {...plan, summary: typeof plan.summary === 'string' ? plan.summary : '', assumptions: strings(plan.assumptions),
      notes: strings(plan.notes), budget: Array.isArray(plan.budget) ? plan.budget.filter(item => record(item) && typeof item.item === 'string' && typeof item.amount === 'string') : []},
    // Existing source objects and metadata belong to the original response.
    // Keep them intact when recovering a conversation in the browser.
    ...(Array.isArray(reply.sources) ? {sources: reply.sources} : {})
  };
}

export function hasSerializedItinerary(text) {
  return typeof text === 'string' && /[{"]\s*"?(?:itinerary|days|stops)"?\s*:/u.test(text);
}
