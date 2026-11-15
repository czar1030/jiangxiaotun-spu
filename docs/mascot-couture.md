# 江小豚荆楚衣装细化

认识武汉、旅行规划和 SPU 社区共用的荆楚衣装已完成第二轮细化。交领采用叠层缝边和接触暗影；腰封增加束紧的明暗、织锦与滚边；蝴蝶结补充折回的带面、结芯与压影。裙摆保留原有主轮廓，加入里衬、包边、深浅相间的褶面、细织纹以及低对比仙鹤、水纹暗绣。青玉罩裙、衣袖采用金线仙鹤刺绣，玉佩补充镶边、刻纹、挂绳与流苏。

## 构建与更新

材质、衣身和裙片定义于 `scripts/mascot_couture.py`；连续袖片的细节定义于 `scripts/mascot_soft_layers.py`。`public/soft-sleeve.mjs` 返回沿实际袖面分布的刺绣和袖口折线，`public/mascot-soft-rig.mjs` 将它们应用到现有绘制层。肩、肘、腕、手掌和道具目标位置与动作时序沿用。

对现有素材推荐运行：

```powershell
python -X utf8 scripts/update_mascot_couture.py
```

这个更新器只替换服装和材质，并为连续袖片添加细节图层。更新前的 SVG 保存到 `qa/mascot-couture-v2/`，头部所有嵌入图像逐一校验，避免覆盖后续修正的脸、眼睛与发型。它同时用真实静立姿态重建 `reception-rest.webp`。

完整从源构建仍可按顺序运行 `build_mascot_travel.py`、`build_mascot_reception.py` 和 `build_mascot_community.py`。本次未重建 SAIG 的独立侧面竞技造型。

页面素材版本：reception.svg v10、travel.svg v16、community.svg v14、reception-rest.webp v6。

## 验证与样片

`npm test` 全部 147 项通过，包括衣袖与手掌/道具锚点、连续动作、移动裙摆与小腿衔接、脚底固定和旅行望远镜动作。三套 SVG 的材质 ID 无重复；7 + 7 + 8 张头部图像的内容哈希在服装更新前后完全相同，结果见 `qa/mascot-couture-v2/asset-verification.json`。

查看 `qa/mascot-couture/gesture-board.jpg` 的 15 个招呼/待机姿态，及 `qa/travel/poseboard.jpg`、`qa/community/poseboard.jpg` 的 20 个道具姿态。独立新版招呼样片与服装细节图保存于工作区 `output/jiangxiaotun-couture/`，原版样片仍保留。独立样片的袖片刺绣以自身布料切线定位，眼睛、刘海沿用完整原版头脸。
