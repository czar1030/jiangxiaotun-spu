from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
keys=['Mark印文物AI明信片','创业团队合影','官方产品图','查看产品官网','查阅人物资料']
rows={
 'zh-TW':['Mark印文物AI明信片','創業團隊合照','官方產品圖','查看產品官網','查閱人物資料'],
 'en':['Markyin cultural heritage AI postcards','Founding team photograph','Official product image','Visit product website','Read the profile'],
 'ja':['Mark印の文化財AIポストカード','創業チームの集合写真','公式製品画像','製品公式サイトを見る','人物紹介を読む'],
 'ko':['Mark印 문화유산 AI 엽서','창업팀 단체 사진','공식 제품 이미지','제품 공식 사이트 보기','인물 소개 보기'],
 'fr':['Cartes postales patrimoniales IA Markyin','Photo de l’équipe fondatrice','Image officielle du produit','Visiter le site du produit','Lire le portrait'],
 'de':['Markyin KI-Postkarten zum Kulturerbe','Foto des Gründungsteams','Offizielles Produktbild','Produktwebsite besuchen','Personenprofil lesen'],
 'es':['Postales de patrimonio con IA Markyin','Fotografía del equipo fundador','Imagen oficial del producto','Visitar el sitio del producto','Leer el perfil'],
 'pt':['Postais de património com IA Markyin','Fotografia da equipa fundadora','Imagem oficial do produto','Visitar o site do produto','Ler o perfil'],
 'it':['Cartoline del patrimonio con IA Markyin','Foto del gruppo fondatore','Immagine ufficiale del prodotto','Visita il sito del prodotto','Leggi il profilo'],
 'ru':['Открытки культурного наследия с ИИ Markyin','Фото команды основателей','Официальное изображение продукта','Открыть сайт продукта','Прочитать биографию'],
 'ar':['بطاقات Markyin البريدية للتراث بالذكاء الاصطناعي','صورة فريق التأسيس','صورة رسمية للمنتج','زيارة موقع المنتج','قراءة نبذة عن الشخصية'],
 'hi':['Markyin सांस्कृतिक धरोहर एआई पोस्टकार्ड','संस्थापक टीम की तस्वीर','आधिकारिक उत्पाद चित्र','उत्पाद की वेबसाइट देखें','व्यक्ति का परिचय पढ़ें'],
 'id':['Kartu pos warisan budaya AI Markyin','Foto tim pendiri','Gambar produk resmi','Kunjungi situs produk','Baca profil tokoh'],
 'th':['โปสการ์ดมรดกวัฒนธรรม AI ของ Markyin','ภาพถ่ายทีมผู้ก่อตั้ง','ภาพผลิตภัณฑ์อย่างเป็นทางการ','เยี่ยมชมเว็บไซต์ผลิตภัณฑ์','อ่านประวัติบุคคล'],
 'vi':['Bưu thiếp di sản văn hóa AI Markyin','Ảnh nhóm sáng lập','Hình ảnh sản phẩm chính thức','Xem trang web sản phẩm','Đọc hồ sơ nhân vật'],
}
for locale,values in rows.items():
 path=root/f'public/locales/{locale}.json'
 pack=json.loads(path.read_text(encoding='utf-8'));pack.update(zip(keys,values))
 path.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
path=root/'data/i18n-source.json';source=json.loads(path.read_text(encoding='utf-8'))
path.write_text(json.dumps(sorted(set(source+keys)),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
