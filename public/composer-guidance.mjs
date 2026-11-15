// Each question is both visible copy and the visitor message sent on click.
// Keep the four topics separate; free-form questions remain unrestricted.
const copy = {
  'zh-CN': [
    ['武汉的历史从哪里讲起？', '辛亥革命在武汉哪里发生？', '武汉的 AI 发展怎么样？'],
    ['按1–5天的范围，武汉旅行可以怎么玩？', '在武汉住哪里，地铁和轮渡出行更方便？', '带父母游武汉，如何安排得少走路？'],
    ['不会编程，也能参与 SPU 社区吗？', 'SPU 社区是谁创办的，有怎样的故事？', 'SPU 社区有哪些学习与项目参与机会？'],
    ['谁可以参加 SAIG，需要什么条件？', 'SAIG 需要提交哪些材料，什么时候截止？', 'SAIG 的四项赛题和评分标准是什么？']
  ],
  'zh-TW': [
    ['武漢的歷史從哪裡講起？', '辛亥革命在武漢哪裡發生？', '武漢的 AI 發展怎麼樣？'],
    ['按1–5天的範圍，武漢旅行可以怎麼玩？', '在武漢住哪裡，地鐵和渡輪出行更方便？', '帶父母遊武漢，如何安排得少走路？'],
    ['不會程式設計，也能參與 SPU 社區嗎？', 'SPU 社區是誰創辦的，有怎樣的故事？', 'SPU 社區有哪些學習與專案參與機會？'],
    ['誰可以參加 SAIG，需要什麼條件？', 'SAIG 需要提交哪些資料，何時截止？', 'SAIG 的四項賽題和評分標準是什麼？']
  ],
  en: [
    ['Where does Wuhan’s history begin?', 'Where in Wuhan did the 1911 Revolution begin?', 'How is AI developing in Wuhan?'],
    ['What could I explore in Wuhan over 1–5 days?', 'Where should I stay for easy metro and ferry access in Wuhan?', 'How can I visit Wuhan with my parents with less walking?'],
    ['Can I join the SPU community without coding skills?', 'Who founded the SPU community, and what is its story?', 'What learning and project opportunities does the SPU community offer?'],
    ['Who can enter SAIG, and what are the requirements?', 'What must I submit for SAIG, and when is the deadline?', 'What are SAIG’s four tasks and scoring criteria?']
  ],
  ja: [
    ['武漢の歴史はどこから始まりますか？', '辛亥革命は武漢のどこで始まりましたか？', '武漢の AI はどのように発展していますか？'],
    ['武漢を1～5日間で楽しむには？', '地下鉄やフェリーに便利な武漢の宿泊エリアは？', '両親と武漢を旅行する際、歩く量を減らすには？'],
    ['プログラミング未経験でも SPU コミュニティに参加できますか？', 'SPU コミュニティの創設者と設立の物語を教えてください。', 'SPU コミュニティにはどんな学習やプロジェクト参加の機会がありますか？'],
    ['SAIG の参加資格と条件は？', 'SAIG の提出物と締切は？', 'SAIG の4つの課題と採点基準は？']
  ],
  ko: [
    ['우한의 역사는 어디서 시작되나요?', '신해혁명은 우한의 어디에서 시작됐나요?', '우한의 AI 산업은 어떻게 발전하고 있나요?'],
    ['우한을 1~5일 동안 어떻게 여행하면 좋을까요?', '우한에서 지하철과 페리 이용이 편리한 숙박 지역은 어디인가요?', '부모님과 우한을 여행할 때 걷는 양을 줄이려면 어떻게 하나요?'],
    ['코딩을 몰라도 SPU 커뮤니티에 참여할 수 있나요?', 'SPU 커뮤니티는 누가, 어떤 계기로 만들었나요?', 'SPU 커뮤니티에는 어떤 학습 및 프로젝트 참여 기회가 있나요?'],
    ['SAIG에는 누가 참가할 수 있고 조건은 무엇인가요?', 'SAIG 제출 자료와 마감일은 무엇인가요?', 'SAIG의 네 가지 과제와 평가 기준은 무엇인가요?']
  ],
  fr: [
    ['Par où commencer pour découvrir l’histoire de Wuhan ?', 'Où la révolution de 1911 a-t-elle commencé à Wuhan ?', 'Comment l’IA se développe-t-elle à Wuhan ?'],
    ['Que découvrir à Wuhan sur une durée de 1 à 5 jours ?', 'Où loger à Wuhan pour accéder facilement au métro et aux ferries ?', 'Comment visiter Wuhan avec mes parents en marchant moins ?'],
    ['Peut-on rejoindre la communauté SPU sans savoir coder ?', 'Qui a fondé la communauté SPU, et quelle est son histoire ?', 'Quelles possibilités d’apprentissage et de projets propose la communauté SPU ?'],
    ['Qui peut participer au SAIG, et sous quelles conditions ?', 'Que faut-il soumettre au SAIG, et à quelle date limite ?', 'Quels sont les quatre défis du SAIG et leurs critères de notation ?']
  ],
  de: [
    ['Wo beginnt Wuhans Geschichte?', 'Wo in Wuhan begann die Revolution von 1911?', 'Wie entwickelt sich KI in Wuhan?'],
    ['Was kann ich in Wuhan in 1–5 Tagen entdecken?', 'Wo wohne ich in Wuhan mit guter Metro- und Fähranbindung?', 'Wie kann ich Wuhan mit meinen Eltern mit weniger Fußwegen besuchen?'],
    ['Kann ich ohne Programmierkenntnisse an der SPU-Community teilnehmen?', 'Wer hat die SPU-Community gegründet, und wie entstand sie?', 'Welche Lern- und Projektmöglichkeiten bietet die SPU-Community?'],
    ['Wer kann am SAIG teilnehmen, und welche Voraussetzungen gelten?', 'Was muss ich für SAIG einreichen, und bis wann?', 'Welche vier Aufgaben und Bewertungskriterien hat SAIG?']
  ],
  es: [
    ['¿Por dónde empezar a conocer la historia de Wuhan?', '¿Dónde comenzó la Revolución de 1911 en Wuhan?', '¿Cómo se está desarrollando la IA en Wuhan?'],
    ['¿Qué puedo conocer en Wuhan durante 1–5 días?', '¿Dónde alojarme en Wuhan para acceder fácilmente al metro y al ferri?', '¿Cómo visitar Wuhan con mis padres caminando menos?'],
    ['¿Puedo participar en la comunidad SPU sin saber programar?', '¿Quién fundó la comunidad SPU y cuál es su historia?', '¿Qué oportunidades de aprendizaje y proyectos ofrece la comunidad SPU?'],
    ['¿Quién puede participar en SAIG y cuáles son los requisitos?', '¿Qué debo entregar para SAIG y cuál es la fecha límite?', '¿Cuáles son las cuatro pruebas de SAIG y sus criterios de evaluación?']
  ],
  pt: [
    ['Por onde começar a conhecer a história de Wuhan?', 'Onde começou a Revolução de 1911 em Wuhan?', 'Como a IA está se desenvolvendo em Wuhan?'],
    ['O que conhecer em Wuhan durante 1–5 dias?', 'Onde ficar em Wuhan para ter fácil acesso ao metrô e às balsas?', 'Como visitar Wuhan com meus pais caminhando menos?'],
    ['Posso participar da comunidade SPU sem saber programar?', 'Quem fundou a comunidade SPU e qual é sua história?', 'Quais oportunidades de aprendizagem e projetos a comunidade SPU oferece?'],
    ['Quem pode participar do SAIG e quais são os requisitos?', 'O que preciso enviar ao SAIG e qual é o prazo?', 'Quais são os quatro desafios do SAIG e seus critérios de avaliação?']
  ],
  it: [
    ['Da dove iniziare a conoscere la storia di Wuhan?', 'Dove iniziò la Rivoluzione del 1911 a Wuhan?', 'Come si sta sviluppando l’IA a Wuhan?'],
    ['Cosa posso scoprire a Wuhan in 1–5 giorni?', 'Dove alloggiare a Wuhan per usare facilmente metro e traghetti?', 'Come visitare Wuhan con i miei genitori camminando meno?'],
    ['Posso partecipare alla comunità SPU senza saper programmare?', 'Chi ha fondato la comunità SPU e qual è la sua storia?', 'Quali opportunità di apprendimento e progetti offre la comunità SPU?'],
    ['Chi può partecipare a SAIG e quali sono i requisiti?', 'Cosa devo presentare a SAIG e qual è la scadenza?', 'Quali sono le quattro prove di SAIG e i criteri di valutazione?']
  ],
  ru: [
    ['С чего начинается история Уханя?', 'Где в Ухане началась Синьхайская революция 1911 года?', 'Как развивается ИИ в Ухане?'],
    ['Что посмотреть в Ухане за 1–5 дней?', 'Где остановиться в Ухане, чтобы удобно пользоваться метро и паромом?', 'Как путешествовать по Уханю с родителями и меньше ходить пешком?'],
    ['Можно ли участвовать в сообществе SPU без навыков программирования?', 'Кто основал сообщество SPU и какова его история?', 'Какие возможности обучения и участия в проектах есть в сообществе SPU?'],
    ['Кто может участвовать в SAIG и каковы требования?', 'Что нужно подать на SAIG и когда крайний срок?', 'Каковы четыре задания SAIG и критерии оценки?']
  ],
  ar: [
    ['من أين تبدأ قصة تاريخ ووهان؟', 'أين بدأت ثورة عام 1911 في ووهان؟', 'كيف يتطور الذكاء الاصطناعي في ووهان؟'],
    ['ماذا يمكنني استكشافه في ووهان خلال يوم إلى خمسة أيام؟', 'أين أقيم في ووهان للوصول بسهولة إلى المترو والعبّارات؟', 'كيف أزور ووهان مع والديّ مع تقليل المشي؟'],
    ['هل يمكنني المشاركة في مجتمع SPU دون معرفة البرمجة؟', 'من أسس مجتمع SPU وما قصته؟', 'ما فرص التعلم والمشاركة في المشاريع في مجتمع SPU؟'],
    ['من يمكنه المشاركة في SAIG وما الشروط؟', 'ما المواد المطلوبة للتقديم إلى SAIG وما الموعد النهائي؟', 'ما المهام الأربع في SAIG ومعايير التقييم؟']
  ],
  hi: [
    ['वुहान के इतिहास की शुरुआत कहाँ से होती है?', '1911 की क्रांति वुहान में कहाँ शुरू हुई थी?', 'वुहान में AI का विकास कैसा हो रहा है?'],
    ['1–5 दिनों में वुहान में क्या-क्या घूम सकते हैं?', 'वुहान में मेट्रो और फ़ेरी के लिए कहाँ ठहरना सुविधाजनक होगा?', 'माता-पिता के साथ वुहान में कम पैदल चलते हुए कैसे घूमें?'],
    ['क्या बिना कोडिंग सीखे SPU समुदाय में भाग ले सकते हैं?', 'SPU समुदाय की स्थापना किसने की और उसकी कहानी क्या है?', 'SPU समुदाय में सीखने और परियोजनाओं से जुड़ने के क्या अवसर हैं?'],
    ['SAIG में कौन भाग ले सकता है और क्या शर्तें हैं?', 'SAIG के लिए क्या जमा करना है और अंतिम तारीख क्या है?', 'SAIG के चार कार्य और मूल्यांकन मानदंड क्या हैं?']
  ],
  id: [
    ['Dari mana kisah sejarah Wuhan dimulai?', 'Di mana Revolusi 1911 dimulai di Wuhan?', 'Bagaimana perkembangan AI di Wuhan?'],
    ['Apa yang bisa dijelajahi di Wuhan selama 1–5 hari?', 'Di mana sebaiknya menginap di Wuhan agar mudah naik metro dan feri?', 'Bagaimana berwisata di Wuhan bersama orang tua dengan lebih sedikit berjalan kaki?'],
    ['Bisakah saya bergabung dengan komunitas SPU tanpa bisa coding?', 'Siapa pendiri komunitas SPU dan bagaimana kisahnya?', 'Apa peluang belajar dan berpartisipasi dalam proyek komunitas SPU?'],
    ['Siapa yang bisa mengikuti SAIG dan apa syaratnya?', 'Apa yang harus dikumpulkan untuk SAIG dan kapan tenggatnya?', 'Apa empat tugas SAIG dan kriteria penilaiannya?']
  ],
  th: [
    ['ประวัติศาสตร์อู่ฮั่นเริ่มต้นอย่างไร?', 'การปฏิวัติซินไฮ่เริ่มขึ้นที่ไหนในอู่ฮั่น?', 'AI ในอู่ฮั่นพัฒนาไปอย่างไรบ้าง?'],
    ['เที่ยวอู่ฮั่นในช่วง 1–5 วัน ไปที่ไหนได้บ้าง?', 'ควรพักย่านไหนในอู่ฮั่นเพื่อขึ้นรถไฟใต้ดินและเรือข้ามฟากได้สะดวก?', 'เที่ยวอู่ฮั่นกับพ่อแม่อย่างไรให้เดินน้อยลง?'],
    ['เขียนโปรแกรมไม่เป็นก็เข้าร่วมชุมชน SPU ได้ไหม?', 'ใครก่อตั้งชุมชน SPU และมีเรื่องราวอย่างไร?', 'ชุมชน SPU มีโอกาสเรียนรู้และร่วมโครงการอะไรบ้าง?'],
    ['ใครเข้าร่วม SAIG ได้ และมีเงื่อนไขอะไรบ้าง?', 'SAIG ต้องส่งอะไรบ้าง และหมดเขตเมื่อไร?', 'โจทย์ทั้งสี่และเกณฑ์ให้คะแนนของ SAIG คืออะไร?']
  ],
  vi: [
    ['Lịch sử Vũ Hán bắt đầu từ đâu?', 'Cách mạng Tân Hợi bắt đầu ở đâu tại Vũ Hán?', 'AI ở Vũ Hán đang phát triển như thế nào?'],
    ['Có thể khám phá gì ở Vũ Hán trong khoảng 1–5 ngày?', 'Nên ở khu nào tại Vũ Hán để tiện đi tàu điện ngầm và phà?', 'Đi Vũ Hán cùng bố mẹ thế nào để ít phải đi bộ?'],
    ['Không biết lập trình có thể tham gia cộng đồng SPU không?', 'Ai sáng lập cộng đồng SPU và câu chuyện của họ là gì?', 'Cộng đồng SPU có cơ hội học tập và tham gia dự án nào?'],
    ['Ai có thể tham gia SAIG và cần điều kiện gì?', 'SAIG yêu cầu nộp tài liệu gì và hạn chót khi nào?', 'Bốn đề bài và tiêu chí chấm điểm của SAIG là gì?']
  ]
};

const modes = ['wuhan', 'travel', 'community', 'saig'];
export function composerGuidance(mode = 'wuhan', locale = 'zh-CN') {
  const questions = [...(copy[locale] || copy.en)[Math.max(0, modes.indexOf(mode))]];
  return {questions, placeholder: questions[0], planner: mode === 'travel'};
}
