# 静数独

无广告的离线数独网页版，适合手机和电脑。

游戏网址：https://WinXPQAQ.github.io/jingshudu/

## 玩法

五档难度，每档 100 道已验证题目。选格填数、候选数笔记、撤销、擦除、重复冲突提示、辅助增强与本地自动存档。新游戏选难度后直接开局。

iPhone 用 Safari 打开网址，分享 → 添加到主屏幕。首次联网等待“已可离线使用”后，可以离线游玩。存档只在当前浏览器中保存，建议通过“存档与备份”定期导出；网页版不与安卓 App 自动同步。

本版随机抽取现有题库，暂不实时生成。最近 300 步可撤销。

## GitHub Pages

Settings → Pages → Deploy from a branch → main → / (root)。无需编译、域名或服务器。项目根目录就是发布目录。

## Cloudflare Pages

在 Cloudflare 中创建 Pages 项目，连接本仓库：Production branch 选 main，Framework preset 选 None，Build command 留空，Build output directory 填 /（仓库根目录）。

也可以使用 Direct Upload 上传网页静态文件包。请选择 Pages，不是需要 Worker 入口的项目。平台免费额度与大陆网络可达性以实际使用情况为准。

## 本地验证

npm ci && npm test。测试依赖不会被游戏加载，线上无需安装依赖。

11 项自动化检查覆盖游戏规则、500 道题的独立唯一解复查、存档、DOM 交互及离线缓存逻辑。尚未做 iPhone 真机测试。

更新网页时需递增 sw.js 的缓存版本，已打开的旧页面关闭后激活新版本。
