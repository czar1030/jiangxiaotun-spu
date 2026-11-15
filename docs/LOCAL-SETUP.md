# 下载后在自己电脑使用

## 下载安装与启动

1. 安装 [Node.js LTS](https://nodejs.org/zh-cn/download)，推荐 22 或更新的受支持 LTS 版本；项目最低要求 Node.js 20。
2. [下载项目 ZIP](https://github.com/czar1030/jiangxiaotun-spu/archive/refs/heads/main.zip)，完整解压到自己的文件夹。
3. Windows 双击 `启动江小豚.cmd`。macOS / Linux 在项目目录执行 `npm start`。
4. 浏览器打开 `http://127.0.0.1:3210`。

基础网页不需要执行 `npm install`。不要在 ZIP 内直接启动，也不要直接双击 `public/index.html`。
Windows 后台启动的服务可用 `停止江小豚.cmd` 关闭；`npm start` 方式使用 Ctrl+C 关闭。
Node 命令未找到时，确认 Node.js 已安装，再重新打开终端。

无 AI 密钥时，页面、角色动画、图文浏览、资料直答、收藏、偏好与本地会话功能仍可使用。
资料直答与在线模型回答在界面中明确区分；没有调用在线 AI 时不会冒充 AI 回答。
收藏和对话保存在当前浏览器，换电脑或浏览器后不会自动同步。

## 可选：使用自己的在线 AI 密钥

作者的密钥不随源码分发，下载者不能自动使用作者的 AI 额度。
要启用在线 AI，先在自己的服务商账号获取密钥，再将根目录 `.env.example` 复制为 `.env`。
Windows 可在项目目录的 PowerShell 执行：

```powershell
Copy-Item .env.example .env
notepad .env
```

已有 `.env` 时直接编辑现有文件，不要用示例覆盖自己的配置。
保持 DeepSeek 配置如下，将 `AI_API_KEY` 的占位文字替换成自己的密钥，并设置 `AI_ENABLED=true`：

```dotenv
AI_BASE_URL=https://api.deepseek.com/v1
AI_API_KEY=your-own-key
AI_MODEL=deepseek-flash
AI_API_STYLE=chat
AI_ENABLED=true
HOST=127.0.0.1
PORT=3210
```

保留示例中其余额度限制配置即可。本机启动不需要修改生产环境的确认开关，也不需要云端托管账号。
编辑后停止并重新启动项目；同时确认页面没有主动选择“资料直答”。
在线调用使用下载者自己的服务商额度；费用与可用模型以该账号为准。

`.env` 已被 Git 忽略，且不由网页服务提供。不要把它上传 GitHub，也不要把密钥写到 `public/`、聊天框、截图或公开文档里。

## 可选：临时回答的自然语音

四个模块的固定开场音频已经随项目提供。要让临时回答也使用项目的自然语音，还需安装 Python 并准备语音环境。

Windows 在项目目录执行：

```powershell
python -m venv tools/voice-venv
tools/voice-venv/Scripts/python.exe -m pip install -r scripts/presenter-voice-requirements.txt
```

macOS / Linux 执行：

```sh
python3 -m venv tools/voice-venv
tools/voice-venv/bin/python -m pip install -r scripts/presenter-voice-requirements.txt
```

自然语音需要联网，不使用你的 DeepSeek 密钥。未安装语音环境时，也可在讲解设置中手动选择可用的浏览器音色；音色与可用性由当前设备提供。
无需为基础网页安装 Python、Docker 或 Blender。

## 如果以后要让人点网址直接使用

那时再参考 [服务端部署说明](DEPLOYMENT.md)。下载后本地运行不需要进行云端部署。
