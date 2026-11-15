export function plannerChoices({days='1-5',exactDays='',area='',customArea=''}){
 const range=String(days).match(/^(1-5|6-10|11-15|16-20|21-30)$/);
 const exact=String(exactDays).trim();
 if(!range||exact&&(!/^\d+$/.test(exact)||Number(exact)<1||Number(exact)>30))throw new RangeError('Invalid travel duration');
 return {duration:exact?`${Number(exact)} 天`:`${days.replace('-','–')} 天（按时间范围推荐玩法与住宿周边交通，不需要先确认具体天数；完整推荐后再邀请补充天数细化）`,
  area:String(customArea).trim().slice(0,120)||String(area),exactDays:exact?Number(exact):null};
}
