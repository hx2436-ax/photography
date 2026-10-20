# Alex Haotian Xue — Photographs

黑底白字的摄影作品集。原比例展示、Sequence / Index 双视图、系列筛选、全屏灯箱、键盘左右翻页、手机滑动、响应式图片和延迟加载。纯 HTML/CSS/JS，不需要安装前端依赖。

首版使用 Alex 已提供的 8 张建筑模型照片，整理成 **Studies in light**。标题是可编辑的策展标题，不代表原作正式命名。源照片最长边只有 1536px；本站没有进行虚假的高清放大。

## 发布

在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。首次保存后，在 Actions 中运行 **Deploy photography to GitHub Pages**；以后向 main 提交会自动部署。

预期地址（需工作流部署成功后才生效）：https://hx2436-ax.github.io/photography/

本地预览：`python3 -m http.server 8000`，然后打开 http://localhost:8000 。

## 添加照片

编辑 `photos.json` 的 `photos` 数组。`series` 相同的照片自动组成系列；数组顺序决定播放顺序。每张照片包含 id、title、alt、series、width、height、src、thumbnail、full、variants。src 等字段可填写本地相对路径，也可填写外部 HTTPS 图片地址。variants 包含实际宽度 width 和 url，供浏览器按屏幕尺寸选择合适文件。

不要把有访问期限的分享链接、需要登录的网盘链接当作图片地址。更换 CDN 后只需要修改清单，不用改布局。

## 推荐：GitHub 代码 + Cloudflare R2 图片

GitHub 只存 HTML/CSS/JS、照片清单和少量首版样图。后续大批照片存到 R2 Standard 的公开图片桶，通过自己的图片子域名和 CDN 读取。RAW/TIFF 原始作品保留在私人备份中；公开桶只放你决定公开的网页导出图。不要在清单或代码中放访问密钥。

1. 在 Cloudflare 创建 R2 Standard bucket。连接自定义域名，例如 `images.your-domain.com`，用于正式公开服务。`r2.dev` 仅适合开发，不作为正式 CDN 地址。
2. 安装 Python 和 Pillow：`python -m pip install Pillow`。
3. 从 Lightroom 等软件导出高质量、sRGB 的 JPEG，再批量运行：

```bash
python scripts/prepare_photos.py /path/to/photos --series "Everyday" --base-url https://images.your-domain.com/photography --output exports --manifest exports/photos.json
```

4. 脚本生成 480 / 960 / 1600 / 2560 / 3200px 宽度 WebP（不放大原图），统一色彩为 sRGB、去除 EXIF/GPS。手动检查细节、渐变和暗部质量；有特殊要求的作品可以单独调整压缩参数或使用 JPEG。
5. 将 `exports` 内 WebP 文件上传到 R2 的 `photography/` 前缀，可用 Cloudflare 控制台少量上传，或 rclone 批量 `copy`。配置凭据只保存在本机，不提交仓库。
6. 为带版本号的图片设置 `Cache-Control: public, max-age=31536000, immutable`，在 Cloudflare 为图片路径配置缓存规则。脚本按文件内容生成文件名，更新照片不会误用旧缓存。
7. 编辑生成清单的标题和 alt 描述，再把其 `photos` 条目合并到根目录 `photos.json`。脚本生成新清单，不会自动覆盖或合并站点已有系列。不要只替换清单而忘记上传图片。
8. 提交新的清单即可；`exports/` 和 `originals/` 已被 Git 忽略。

R2 不是自动图像压缩服务；本项目在本地生成不同尺寸，因此不依赖付费实时图片转换。网页索引懒加载，单张视图只请求当前图，不预加载整个照片库。浏览器通过 srcset 选择图像分辨率。全屏表示无页面干扰的视窗内观看，并非下载 RAW 或像素级无损查看。

### 成本与限制（2026-10-20 查阅）

- GitHub Pages：源仓库推荐不超过 1GB，发布的网站不超过 1GB，带宽软限制 100GB/月。图片放外部 CDN 就不累计到这些仓库/站点体积中。
- R2 Standard：免费额度 10 GB-month、100 万次 Class A、1000 万次 Class B/月；标准存储超出免费量 $0.015/GB-month，直接出站流量免费。请求、域名和其他 Cloudflare 服务可能另收费。
- 示例：1000 张照片的各尺寸合计平均 3MB/张，约 3GB；5000 张约 15GB。按稳定占用 15GB 估算，超出免费量的纯存储约 $0.075/月，实际账单还受计量取整、操作请求、其他使用量影响。这里的每张 3MB 是估算，不是保证。
- Git LFS 不适合作为 GitHub Pages 的大图库分发方案；GitHub Pages 不支持 LFS。不要靠反复删图解决仓库体积，历史提交仍会保留旧二进制。

官方参考：
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/buckets/public-buckets/

设计参考：川内伦子官网的系列组织与作品优先的浏览方式 https://rinkokawauchi.com/en/works/ 。本网站采用原创黑色布局，没有复制其照片或源码。
