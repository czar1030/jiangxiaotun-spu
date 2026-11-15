// Buttons are sent verbatim as the visitor's next message. Repair known
// assistant-to-visitor questions in both new responses and saved conversations.
// Replacements request guidance; they never invent allergies or preferences.
export function normalizeFollowups(values) {
  if (!Array.isArray(values)) return [];
  const result = [];
  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) continue;
    let text = value.trim().slice(0, 180);
    const userRequest = /^(?:请|請|帮我|幫我|我|我们|我們|能否|可以|能不能|你(?:能|可以|能否|可否|觉得|覺得|知道|推荐|推薦|建议|建議)|please\b|can you\b|could you\b|help me\b|i\b|we\b)/iu.test(text);
    if (!userRequest) {
      const traditional = /沒有|過敏|輕鬆|選擇|計劃|優先|場館/.test(text);
      if (/(?:有没有|有沒有|有无|有無|有什么|有什麼)忌口|想尝试哪些武汉小吃|想嘗試哪些武漢小吃|不吃或过敏的食物/.test(text)) {
        text = traditional ? '請介紹武漢特色小吃的口味、常見食材和飲食注意事項。' : '请介绍武汉特色小吃的口味、常见食材和饮食注意事项。';
      } else if (/(?:下雨|雨天).*(?:希望|想|优先|優先|还是|還是)/.test(text)) {
        text = traditional ? '如果下雨，請幫我比較室內場館和商圈休息的替代方案。' : '如果下雨，请帮我比较室内场馆和商圈休息的替代方案。';
      } else if (/(?:你[们們]?|希望|更想).*(?:哪一天|轻松|輕鬆|少走|休息)/.test(text)) {
        text = traditional ? '請看看哪些天可以減少步行，安排得更輕鬆一些。' : '请看看哪些天可以减少步行，安排得更轻松一些。';
      } else if (/\b(?:do you have|any)\b.*\b(?:dietary|allerg|food restriction)/iu.test(text)) {
        text = 'Please recommend Wuhan dishes and explain their common ingredients and dietary considerations.';
      } else if (/\b(?:would you prefer|do you prefer|would you like|are you planning|where are you staying)\b|\bwhich day\b.*\b(?:would|do|will) you\b|\bhow many days (?:will you|are you|would you|do you)\b/iu.test(text) ||
        /(?:你[们們]?(?:更)?(?:有没有|有沒有|有无|有無|更想|想|希望|喜欢|喜歡|偏好|准备|準備|计划|計劃|打算|是否|住在|住哪)|希望优先|希望優先)/.test(text)) {
        // An unknown second-person preference question has no safe factual
        // conversion. Omit it rather than answer on behalf of the visitor.
        continue;
      }
    }
    if (!result.includes(text)) result.push(text);
    if (result.length === 3) break;
  }
  return result;
}
