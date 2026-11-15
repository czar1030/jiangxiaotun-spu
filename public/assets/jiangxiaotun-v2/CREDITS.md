# 江小豚 · 蓝白女仆参考改编版

本版本保留用户指定的蓝色大肥鱼／鲸鱼娘形象，属于参考素材的轻度改编，**不是全新原创角色或纯矢量重绘**。角色主体是上游的透明位图，黄鹤与江豚装饰为可编辑矢量，网页使用透明 WebP。

## 来源与署名

- 原始鲸鱼娘角色：**上善无形（上善）**，https://space.bilibili.com/4456176
- DeepSeek 女仆形象二次设计：**ZipZipPipe**，https://www.pixiv.net/artworks/148186519
- 本次使用的高清正面及闭眼素材、三视图与表情动作图集：**YunYueSama**，https://github.com/YunYueSama/codex-deepseek-pet ，文件 `assets/whale/idle-front.png`、`design/character-standard.png`、`assets/whale/actions.png`；原文件完整保存在 `sources/`。
- 六视图及许可链参考：**xiaoweigen**，https://github.com/xiaoweigen/deepseek-dafeiyu-assets 。本版本没有直接拼贴该库的六视图，保留其来源与许可说明。
- 补充参考：用户上传的蓝白女仆形象截图与 https://github.com/Cayhaze/deepseek-pet 。未直接使用该项目的低分辨率角色文件。

本次修改：黄鹤发饰、以无喷泉无背鳍的江豚替换围兜鲸鱼图案、黄鹤楼裙边刺绣、下半身轻度缩短、微笑、透明画幅、头像裁切、闭眼状态及网页眨眼；三视图背景透明化并统一陈列；开心、思考、认真和困惑的动作帧提取与装饰，困惑表情添加汗珠。保留原图的蓝色头发、脸型、眼睛、荷叶边女仆裙和双叶尾鳍。

## 许可

依照已记录的上游角色与改编许可，本次美术演绎贡献以 **CC BY-NC-SA 4.0** 共享，保留适用的上游署名义务。本目录美术资源的许可不改变网站其他代码及资料的许可。

- 完整 CC 许可：`CC-BY-NC-SA-4.0.txt`
- 中文说明：`CC-BY-NC-SA-4.0.zh-CN.md`
- 上游完整署名许可：`YunYueSama-ATTRIBUTION-1.0.txt`
- 上游素材范围：`UPSTREAM-ASSET-LICENSE.md`
- 资源库原有署名及修改记录：`REFERENCE-NOTICE.md`
- https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans

许可允许符合条件的非商业分享及改编；商业使用须另行取得相应权利人的授权。署名不表示原作者或 DeepSeek 为本作品背书。

构建脚本：`scripts/build_mascot.py` 与 `scripts/build_character_sheets.py`。执行后者会一并重建立绘。动作图集按 4 × 4 格、每格 512 像素提取，使用从 0 计的第 5、2、8、9 帧；没有用闭眼帧冒充不同情绪。本次未调用 AI 绘图服务。来源校验值与修改说明见 `provenance.json`。
