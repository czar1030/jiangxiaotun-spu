// Small acting captions are editorial copy, independent of generated answers.
const lines={
 'zh-CN':['咦，在想下一站去哪儿吗？','你先忙，小豚托腮等一会儿。','唔……眯一下，回来记得叫我。'],
 'zh-TW':['咦，在想下一站去哪裡嗎？','你先忙，小豚托腮等一會兒。','唔……瞇一下，回來記得叫我。'],
 en:['Thinking about your next stop?','Take your time. I’ll wait right here.','Just resting my eyes… wake me when you’re back.'],
 ja:['次はどこへ行こうか、考え中？','ごゆっくり。ここで待ってるね。','ちょっとだけ、うとうと……戻ったら呼んでね。'],
 ko:['다음엔 어디로 갈지 생각 중인가요?','천천히 하세요. 여기서 기다릴게요.','잠깐 눈 좀 붙일게요… 돌아오면 불러 주세요.'],
 fr:['Vous pensez à votre prochaine étape ?','Prenez votre temps. Je vous attends ici.','Je ferme un peu les yeux… appelez-moi à votre retour.'],
 de:['Überlegst du, wohin es als Nächstes geht?','Lass dir Zeit. Ich warte hier auf dich.','Ich ruhe kurz die Augen aus… weck mich, wenn du zurück bist.'],
 es:['¿Pensando en tu próxima parada?','Sin prisa. Te espero aquí.','Descanso un poquito los ojos… avísame cuando vuelvas.'],
 pt:['Pensando na próxima parada?','Sem pressa. Espero você aqui.','Vou descansar os olhos… me chame quando voltar.'],
 it:['Stai pensando alla prossima tappa?','Fai con calma. Ti aspetto qui.','Riposo un attimo gli occhi… chiamami quando torni.'],
 ru:['Думаете, куда отправиться дальше?','Не спешите. Я подожду здесь.','Прикрою глаза… позовите, когда вернётесь.'],
 ar:['هل تفكّر في محطتك التالية؟','خذ وقتك، سأنتظرك هنا.','سأريح عينيّ قليلاً… نادني عندما تعود.'],
 hi:['अगला पड़ाव कहाँ हो, यही सोच रहे हैं?','आराम से कीजिए। मैं यहीं इंतज़ार करूँगी।','ज़रा आँखें आराम दूँ… लौटें तो बुला लीजिएगा।'],
 id:['Sedang memikirkan tujuan berikutnya?','Santai saja. Aku menunggu di sini.','Istirahatkan mata sebentar… panggil kalau sudah kembali.'],
 th:['กำลังคิดว่าจะไปที่ไหนต่อดีใช่ไหม','ค่อย ๆ ทำธุระนะ ฉันจะรออยู่ตรงนี้','ขอพักสายตาสักนิด… กลับมาแล้วเรียกด้วยนะ'],
 vi:['Bạn đang nghĩ xem điểm đến tiếp theo là đâu à?','Cứ thong thả nhé. Mình đợi ở đây.','Mình nghỉ mắt một chút… quay lại thì gọi mình nhé.']
};
export function idleLine(locale,pose){return (lines[locale]||lines.en)[{curious:0,bored:1,sleepy:2}[pose]??0];}
