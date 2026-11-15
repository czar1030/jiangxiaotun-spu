// Short editorial headlines keep the original composition across writing systems.
const headlines={
 en:['A city of rivers.|A world to discover.','A place to meet.|Ideas to make real.','Across three towns.|Explore Wuhan.','One creator.|Endless possibilities.'],
 ja:['川と湖の街で、|武漢に出会う。','ここから、|アイデアを形に。','三鎮をつないで、|武漢を旅しよう。','ひとりの創造に、|無限の可能性を。'],
 ko:['강과 호수의 도시,|우한을 만나다.','여기에서,|생각이 현실로.','세 지역을 잇고,|우한을 즐기다.','한 사람의 창작,|무한한 가능성.'],
 fr:['Une ville de fleuves.|Wuhan vous attend.','Des rencontres.|Des idées à créer.','Trois villes reliées.|Explorez Wuhan.','Une personne.|Mille possibles.'],
 de:['Eine Stadt am Wasser.|Entdecke Wuhan.','Hier begegnen sich|Menschen und Ideen.','Drei Stadtteile.|Ganz Wuhan entdecken.','Ein Mensch.|Unendliche Ideen.'],
 es:['Una ciudad de ríos.|Descubre Wuhan.','Un lugar de encuentro.|Ideas que cobran vida.','Tres ciudades unidas.|Explora Wuhan.','Una persona.|Infinitas posibilidades.'],
 pt:['Uma cidade de rios.|Descubra Wuhan.','Um lugar de encontro.|Ideias ganham vida.','Três cidades unidas.|Explore Wuhan.','Uma pessoa.|Infinitas possibilidades.'],
 it:['Una città di fiumi.|Scopri Wuhan.','Un luogo d’incontro.|Le idee prendono vita.','Tre città collegate.|Esplora Wuhan.','Una persona.|Infinite possibilità.'],
 ru:['Город двух рек.|Откройте Ухань.','Место для встреч.|Идеи для воплощения.','Три города вместе.|Откройте Ухань.','Один автор.|Мир возможностей.'],
 ar:['مدينة تلتقي فيها الأنهار.|اكتشف ووهان.','هنا نلتقي.|وهنا تزدهر الأفكار.','ثلاث مدن مترابطة.|اكتشف ووهان.','مبدع واحد.|إمكانات بلا حدود.'],
 hi:['नदियों का शहर।|वुहान से मिलिए।','मिलने की जगह।|साकार होते विचार।','तीन नगर जुड़े।|वुहान घूमिए।','एक रचनाकार।|अनगिनत संभावनाएँ।'],
 id:['Kota pertemuan sungai.|Jelajahi Wuhan.','Tempat bertemu.|Ide menjadi nyata.','Tiga kota terhubung.|Jelajahi Wuhan.','Satu kreator.|Beragam kemungkinan.'],
 th:['เมืองที่สายน้ำมาบรรจบ|มารู้จักอู่ฮั่นกัน','พื้นที่แห่งการพบปะ|เปลี่ยนไอเดียให้เป็นจริง','เชื่อมถึงสามเมือง|เที่ยวอู่ฮั่นให้เต็มที่','ผู้สร้างหนึ่งคน|ความเป็นไปได้ไม่สิ้นสุด'],
 vi:['Thành phố bên sông.|Khám phá Vũ Hán.','Nơi gặp gỡ.|Nơi ý tưởng thành hình.','Kết nối ba thành phố.|Khám phá Vũ Hán.','Một người sáng tạo.|Muôn vàn khả năng.']
};
export function localizedHeadline(locale,mode){
 const value=headlines[locale]?.[['wuhan','community','travel','saig'].indexOf(mode)];
 return value?value.split('|'):null;
}
