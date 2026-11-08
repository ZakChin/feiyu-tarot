# 肥鱼塔罗 · 安装说明

这是一个 DeepSeek Harness（DSH）的本地插件包，不需要联网下载依赖。

## 步骤

1. 解压 `feiyu-tarot-1.0.0.zip`，得到 `feiyu-tarot` 文件夹。
2. 把文件夹放到一个固定位置，例如 `D:\DSH-Plugins\feiyu-tarot`。
3. 打开 DSH Web，在对话框里对 agent 说：

   > 安装这个本地插件：D:\DSH-Plugins\feiyu-tarot

   agent 会调用 `plugin_manager` 的 `install_bundle`，如果弹出审批请允许。
4. 安装完成后按 **Ctrl+R** 刷新页面。
5. 侧边栏会出现「肥鱼塔罗」图标；点开即可提问、抽牌、看解读。

## 说明

- 这是本地 bundle（`link:` 安装），不发布到 npm，也不需要 npm 账号。
- 抽牌记录保存在浏览器 `localStorage` 的 `dsh.tarot.v1`，不上传。
- 需要 DSH Web 版本支持插件面板；安装后若没看到图标，先刷新一次页面。
- 卸载：在插件管理里停用/移除 `@local/daily-tarot` 即可；历史数据可用浏览器站点数据清除。
