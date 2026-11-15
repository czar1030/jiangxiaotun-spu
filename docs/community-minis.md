# SPU 社区迷你江豚

新增铁盆大肥鱼：从用户附件 `cb088a51-5355-4d39-9c77-21852c4ff36c` 原图精细抠出，保留盆沿、发丝、服装与鞋子的原始图像，不生成或放大。素材为 `public/assets/community-basin/basin-dafeiyu.webp`；原图与处理记录见同目录 `provenance.json`，重新处理运行 `python scripts/prepare_basin_companion.py`。深蓝、白、黑三底检查图存于 `qa/deepseek-basin/edge-review.png`。

大肥鱼放在江小豚尾巴下方、大白左侧，层级低于小江豚。位置由 `basinCompanionLayout` 根据角色尾巴、大白及十只小江豚的真实边界计算，给尾巴和小江豚留缝，保留原有十只的位置；窄屏依可用空间缩小，空间不足时隐藏该装饰，避免遮挡原有角色。

十只迷你江豚：原有的瓦力右侧、回声脚边右侧、回声脚边前侧、江小豚双脚左侧、江小豚双脚右侧、大白前侧六只，另在瓦力前侧、回声前侧地面、江小豚右前方、大白旁边各增加一只较小的伙伴。通过大小与前后错落组成小群体，复用三种已有表情。

当前使用 v2：参考用户提供的 SPU 社区吉祥物，保留蓝白圆润身形与江豚尾鳍，改用简洁描边、大色块及柔和赛璐璐阴影，替换原有毛绒质感，使画风贴合场景中的瓦力和大白。三种表情姿态为 hello（热情招手）、joy（开心合掌）、hope（仰头张开小鳍）。素材通过用户已授权的 imagegen API/CLI，gpt-image-2 参考图编辑生成；一张三格动作条切出三个独立透明 WebP，保留原始返回的 alpha，没有把透明区的背景光晕贴入场景。浏览器轻微降低饱和度、匹配冷色环境，并增加脚下柔和阴影。

完整素材与生成提示词：`output/imagegen/community-minis/delivery-v2.md`。源图、提示词、三个 WebP 的校验值见 `public/assets/community-minis/provenance-v2.json`。重新切图：`python scripts/prepare_community_minis.py --version v2`，需要 Pillow、NumPy、SciPy。旧版 v1 素材保留。

社区回声同步使用 v3 动漫化素材：`public/assets/community-echo/echo-body-v3.webp` 与 `echo-hand-v3.webp`。保持原有姿态和搭肩接触点，简化写实机甲细节、使用干净线稿与柔和明暗；仅更换社区角色素材，不影响 SAIG 对阵角色。完整提示词、源图、处理与交付见 `output/imagegen/community-style-delivery-v2.md`。重新分层：`python scripts/prepare_echo_companion.py --version v3`。

`public/community-minis.mjs` 在伙伴与主角加载后读取真实脚边位置，页面缩放、窗口尺寸或栏目变化时重新排布；回声的入场位移不影响迷你伙伴的落点。手机端将瓦力右侧的小江豚放到更靠前的地面，并为名牌腾出空间，避免遮挡主角鞋子。三种姿态以不同时差轻微呼吸，身体底部保持在地面，离屏、切换栏目、打开对话框或隐藏页面时暂停；遵循减少动态效果偏好。

验证：社区测试覆盖十个位置的数量、原有方向、随页面滚动保持相对位置、桌面轮廓间距、手机端避开主角鞋子。桌面与 390px 手机实际效果保存于 `qa/community-minis/`。
