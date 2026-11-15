"""Collect the curated shell and atlas labels. Never reads credentials or conversations."""
import json, re
from pathlib import Path
from html.parser import HTMLParser
root = Path(__file__).resolve().parents[1]
keys = set()
def add(s):
    s=s.strip()
    if re.search(r'[\u4e00-\u9fff]',s) and len(s)<1500 and '${' not in s and not re.search(r'\b(const|function|return|document)\b',s): keys.add(s)
class Shell(HTMLParser):
    def handle_data(self,data): add(data)
    def handle_starttag(self,tag,attrs):
        for k,v in attrs:
            if k in ('placeholder','aria-label','title','data-prompt','alt'): add(v or '')
Shell().feed((root/'public/index.html').read_text(encoding='utf-8'))
for path in ['public/app.js','public/mascot.mjs','public/mascot-greeting.mjs']:
    code=(root/path).read_text(encoding='utf-8')
    for s in re.findall(r"'([^'\n]*)'",code):
        if '<' in s: Shell().feed(s)
        else: add(s)
    for s in re.findall(r'>([^<>\n]+)<',code):
        if '${' not in s: add(s)
for subject in json.loads((root/'public/assets/wuhan-media/catalog.json').read_text(encoding='utf-8'))['subjects']:
    for k in ['name','area','description']: add(subject.get(k,''))
extra = '''选择接待语言
自动识别提问语言
多语言接待
界面跟随浏览器，回答跟随提问语言。
切换语言后，新回答使用所选语言；已有对话保留原文。
语言包加载失败，请稍后重试。
原始资料为中文，保留原文供核对。
资料直答模式：以下是已核对的主题概览，未对你的具体问题或后续条件进行分析。定制行程与复杂问答请切回在线 AI。
武汉位于中国湖北，长江与汉江在此交汇，武昌、汉口、汉阳合称武汉三镇。可以从黄鹤楼、东湖、湖北省博物馆和汉口江滩认识这座城市；热干面是当地代表性早餐。开放时间、门票和预约请向景区核实。
数命 SPU 社区在武汉江岸智民里与光谷创新天地布局，面向希望学习、使用 AI 并共同完成项目的人群。资料中的工坊和体验区包含规划内容，不能据此认定设施已开放。不会编程也可以了解参与方式；参访和加入条件请在官方网站咨询。
武汉旅行可先按汉口、武昌、汉阳分区安排，减少跨江往返。请告诉我旅行天数、同行人、住宿区域和预算，以及是否需要少走路或雨天室内安排。在线 AI 可结合这些条件生成并修改逐日行程。营业、天气、票务与预约需另外核实。
SPU 指 Super Person Unit（超级个体单元），公式 U=P^S。SAIG 本届要求独立个人参赛，作品涵盖武汉介绍、社区介绍、旅游规划、SPU 与 SAIG 介绍，每项 25 分。报名须交项目简介和完整演示视频链接，视频添加 #SAIG 或 SAIG 标签。截止为北京时间 2026-11-20 23:59；线下赛为 2026-12-18 12:00 至 2026-12-20 12:00。最终成绩现场占 40%，市场检验占 60%。以官方最新公告为准。
在线 AI 暂不可用，已切换到本地主题概览。
你选择了本地主题概览，未调用在线 AI。
请稍等一分钟再试。
连接暂时中断，请重试。
查看来源
预算估算
交通
费用
提醒
复制行程
保存行程文本
复制回答
重试在线 AI
查阅资料来源
AI 接待
资料直答
原始中文资料
天
全部
景点
历史
人物
美食
实景照片
历史照片
后人画作
纪念雕像
条目
图像
旅行天数
同行人
住宿区域
预算每人（人民币元，不含住宿及往返武汉交通）
旅行偏好
其他要求
请按天与时段规划武汉旅行，写明交通、休息、分项预算、预约提醒及必要假设。
预算未确定，请提供人均分项估算。
少走路、留足休息
优先室内，考虑下雨
你好呀，欢迎来武汉！
在武汉，慢慢聊。
一江两岸，
与武汉
相遇。
在这里，
让想法
发生。
慢一点，
更喜欢
武汉。
一个人，
创造更多
可能。
我是江小豚，你的城市 AI 接待员。
从千年荆楚到明日灵感，陪你走进武汉的每一种可能。
认识智民里与光谷的数命 SPU 社区。
从学习 AI，到协作完成一个真实项目。
和谁同行、住在哪里、喜欢什么？
让小豚按你的节奏，整理一份武汉行程。
从真实需求出发，与 AI 一起交付答案。
了解 SAIG 的参赛要求、赛程与提交材料。'''
for s in extra.splitlines(): add(s)
for s in list(keys):
    if '\\' in s or s.startswith(("',",'社区哪些','))','}')): keys.remove(s)
out=root/'data/i18n-source.json'
out.write_text(json.dumps(sorted(keys),ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(keys)} curated translation strings -> {out.name}')
