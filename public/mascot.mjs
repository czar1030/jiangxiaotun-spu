// Shared presentation policy: only these local, finished character assets exist.
export const expressions = Object.freeze({
  neutral: { image: 'welcome', avatar: 'avatar', label: '陪你聊聊', line: '在武汉，慢慢聊。' },
  happy: { image: 'happy', avatar: 'avatar-happy', label: '开心欢迎', line: '江城的美好，想和你分享。' },
  thinking: { image: 'thinking', avatar: 'avatar-thinking', label: '认真思考', line: '把细节想周到，陪你慢慢安排。' },
  serious: { image: 'serious', avatar: 'avatar-serious', label: '认真讲解', line: '重要的事，我会仔细说清楚。' },
  worried: { image: 'worried', avatar: 'avatar-worried', label: '关心一下', line: '别着急，我们一起想办法。' }
});

export function validEmotion(value) {
  return typeof value === 'string' && Object.hasOwn(expressions, value) ? value : undefined;
}

export function resolveEmotion(result = {}, question = '', mode = 'wuhan') {
  if (result.meta?.mode === 'error' || result.meta?.code) return 'worried';
  const explicit = validEmotion(result.emotion);
  // A finished plan is a result, even if the model tagged its analysis as
  // "thinking". Apply this to restored conversations as well as new replies.
  if (explicit === 'thinking' && result.itinerary?.days?.length) return 'happy';
  if (explicit) return explicit;
  // Older conversations and compatible models without an emotion still work.
  if (/难过|伤心|不舒服|迷路|走丢|生气|投诉|担心|害怕|失望|受伤/.test(question)) return 'worried';
  if (/谢谢|多谢|你好|您好|早上好|晚上好|太棒|好开心/.test(question)) return 'happy';
  const answer = String(result.answer || '');
  if (/请告诉我|请问你|想先确认|需要先确认|准备玩几天|还需要.*信息/.test(answer) && !result.itinerary?.days?.length) return 'thinking';
  if (/SAIG|比赛|报名|参赛|截止|提交|评分|公式|规则|预约要求/i.test(question) || mode === 'saig') return 'serious';
  if (result.itinerary?.days?.length) return 'happy';
  if (/行程|规划|预算|下雨|少走路|怎么安排/.test(question) || mode === 'travel') return 'thinking';
  if (/介绍|美食|好吃|景点|武汉|社区|加入/.test(question)) return 'happy';
  return 'neutral';
}

export function receptionEmotion({pending = false, result = {}, question = '', mode = 'wuhan'} = {}) {
  if (pending) return 'thinking';
  const emotion = resolveEmotion(result, question, mode);
  // Thinking is a request lifecycle state for the live host. Asking for more
  // details in an already finished reply returns her to attentive reception.
  return emotion === 'thinking' ? 'neutral' : emotion;
}

export function mascotAsset(emotion = 'neutral', avatar = false) {
  const expression = expressions[validEmotion(emotion) || 'neutral'];
  return `/assets/jiangxiaotun-v5/${avatar ? expression.avatar : expression.image}.webp?v=9`;
}
