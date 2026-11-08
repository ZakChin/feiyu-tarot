# 肥鱼塔罗 · Feiyu Tarot

一个运行在 DeepSeek Harness Web 界面里的哥特风塔罗插件：侧边栏点开「肥鱼塔罗」，写下**为谁求问**与**所问何事**，抽三张牌（过去 / 现在 / 未来），得到针对这个问题的断言、牌面解读与两条可执行建议。

## 功能

- **三步分屏**：提问 → 洗牌抽卡 → 结果解读，各自独立一屏。
- **侧边栏入口**：注册 `sidebar.panellist` 与 `main` 面板，点图标即进入整块中央面板。
- **不限次数**：一天可以抽很多次，方便替别人抽；会自动避开与上一次完全相同的牌组。
- **求问者与议题**：输入求问者（可留空为自己）和问题；问题失焦时按关键词识别议题（感情 / 事业 / 财富 / 学业 / 人际 / 健康 / 抉择 / 综合），也可手动改。
- **断言而非泛泛牌义**：按正逆位吉凶计分（吉 +2、平 0、凶 −2），总分映射为 yes / leanYes / mixed / no 四档，再用议题语料 + 牌面关键词拼出明确结论、支持牌与阻碍牌。
- **原创牌背**：黑底、金色巴洛克卷草、太阳、双眼与月相，叠加彩虹全息反光；抽卡前是牌背，落位后翻开为黑金红三色魔法阵牌面。
- **吉兆闪卡**：抽到吉位牌时，牌面出现全息光带、星点、彩虹迸射与「✦ 吉兆」标。
- **卡牌风暴**：底部牌堆先洗牌，三张牌独立从牌堆飞出、沿弧线落位并炸开白光；42 张背景牌只负责漩涡氛围。可点击 / 空格 / 回车 / Esc 跳过，`prefers-reduced-motion` 下直接入位。
- **音效**：Web Audio 实时合成的升调蓄能、风声、钟声与落位爆响，可在顶栏静音。
- **星空背景**：梵高式漩涡星空、月牙与星尘缓慢流动。
- **历史**：按日分组保留最近 30 天、最多 60 次抽牌，可展开重读、可二次确认清空。
- **中英双语 UI**：所有界面文案走 Client locale 服务；牌义与断言语料为中文。

## 安装（自己 / 朋友）

插件是一个本地 bundle 包，不需要发布到 npm。让 Harness 里的 agent 执行：

```
plugin_manager action: install_bundle, target: <解压后的绝对路径>\feiyu-tarot
```

例如 `F:\塔罗\daily-tarot`。安装完成后按 **Ctrl+R** 刷新页面，侧边栏出现「肥鱼塔罗」图标。

分享给朋友：把 `feiyu-tarot-1.0.0.zip` 发给他，解压到任意目录，然后让他的 DSH agent 安装解压出来的 `feiyu-tarot` 文件夹（包内 `INSTALL.md` 有逐步说明）。

## 从 GitHub 安装

仓库发布后，朋友的 DSH 可以直接从仓库安装：

```
plugin_manager action: install_bundle, target: github:<用户名>/feiyu-tarot
```

DSH 在安装 GitHub 仓库前会先执行 `git ls-remote`，所以对方机器需要有可用的 `git`。如果对方没有 git，也可以下载仓库 ZIP、解压后按 `INSTALL.md` 做本地安装。

## 开发

```powershell
# 校验数据 + 生成 client.js（把 78 张牌、8 个议题与 i18n 字典内联进 bundle）
node build.mjs

# 纯逻辑测试（沙箱禁止 node --test 的 spawn，故直接逐个运行）
node test/logic.test.mjs
node test/storm.test.mjs
```

- `src/cards/*.json`：78 张牌数据（major / wands / cups / swords / pentacles）。
- `src/topics.json`：8 个议题的断言模板、四档结论与行动建议。
- `src/logic.js`：抽牌、议题识别、计分、断言拼装、存储清洗（无 DOM，可单测）。
- `src/i18n.js` / `locale/*.json`：文案。
- `src/sound.js`：Web Audio 蓄能音效。
- `src/storm.js`：canvas 卡牌风暴与牌堆飞出。
- `src/view.js`：哥特牌面、三步分屏、解读与历史。
- `src/entry.js`：注册 locale、侧边栏图标与主面板。
- `client.js` 由 `build.mjs` 生成，不要手改。

## 数据契约

牌：`{ id, arcana, number?, suit?, rank?, name, nameEn, keywords: { upright[3], reversed[3] }, fortune: { upright, reversed }, text: { upright, reversed } }`，`fortune` 取 `good | neutral | shadow`。

议题：`{ id, labelKey, detect[], frames: { past|present|future: { upright, reversed } }, verdicts: { yes, leanYes, mixed, no }, actions: { 每档 3 条 } }`。模板占位符仅限 `{querent} {question} {card} {kw1} {kw2} {kw3} {position} {supportCard} {challengeCard}`。

## 隐私

抽牌记录只写入浏览器 `localStorage` 的 `dsh.tarot.v1` 键，不上传、不跨设备同步。清除浏览器站点数据会一并清空历史。

## 声明

塔罗解读用于自我觉察与叙事整理，不构成医疗、投资、法律或心理诊断建议。
