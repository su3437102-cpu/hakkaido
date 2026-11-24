from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

base=Path('/workspace/sites/hokkaido-winter-map-2027')
src=(base/'dist/index.html').read_text()
preview=Path('/workspace/work/hokkaido-local-preview')
preview.mkdir(exist_ok=True)
html=src.replace('<title>北海道冬日独旅 · 2027执行版</title>','<title>北海道行程 · 本机预览版</title>')
html=html.replace('href="hokkaido-trip-hub.zip" download>↓ 下载离线包</a>', 'href="hokkaido-offline-map-preview.zip" download>↓ 下载离线地图版</a>')
html=html.replace("if(location.protocol==='file:'){$('.offline-download').hidden=true;", "if(location.protocol==='file:'){$('.offline-download').textContent='本机预览 · 路线地图 ↓';$('.offline-download').href='#route-map';$('.offline-download').removeAttribute('download');")
html=html.replace("let current='d2', branch='lake', view=navigator.onLine===false?'order':'geo', selected=-1;", "let current='d2', branch='lake', view='order', selected=-1;")
html=html.replace('hk-route-map-v1','hk-route-map-local-preview-v1')
html=html.replace('北海道冬日独旅 · 路线地图版 v3','北海道冬日独旅 · 独立本机预览版')
html=html.replace('行程与地理底图均已内置；可离线缩放地图、查看路线与餐厅。导航、比价和视频需联网。','本机预览版：地理底图已内置，可离线缩放、查看道路、路线与餐厅。导航、官网、比价和视频需联网。')
banner='''<aside class="local-preview-banner" role="note"><b>独立本机预览版 · 离线地图已内置</b><span>下载并解压后，双击 <strong>index.html</strong> 即可打开。地理底图、餐厅与行程均可离线查看，无需安装。</span><a href="#route-map">直接看路线 ↓</a></aside>'''
banner_css='''.local-preview-banner{display:flex;align-items:center;gap:14px;flex-wrap:wrap;border:1px solid #b9d8e5;background:#eaf7fd;border-radius:13px;padding:12px 16px;margin:0 0 18px;color:#265a71;font-size:12px}.local-preview-banner>b{font-size:13px;color:#123f56;white-space:nowrap}.local-preview-banner>span{flex:1;min-width:200px}.local-preview-banner>a{white-space:nowrap;color:#176b90;text-underline-offset:3px}@media(max-width:600px){.local-preview-banner{gap:7px}.local-preview-banner>span{flex-basis:100%}}'''
html=html.replace('</header>','</header>'+banner,1)
html=html.replace('</head>','<style>'+banner_css+'</style></head>',1)
# The preview is standalone: style, map library, itinerary and restaurant data
# are already embedded. The original airfare page is preserved alongside it.
(preview/'index.html').write_text(html)
shutil.copy2(base/'dist/price-monitor.html',preview/'price-monitor.html')
shutil.copy2(base/'dist/Leaflet-LICENSE.txt',preview/'Leaflet-LICENSE.txt')
(preview/'使用说明.txt').write_text('''北海道行程 · 独立本机预览版

1. 将压缩包解压到任意新文件夹，例如桌面/北海道行程预览。
2. 双击解压后的 index.html，用 Chrome 或 Edge 打开。不需要安装或启动服务器。
3. 页面默认显示真正的离线地理底图，不需要先联网缓存。可以拖动、缩放、查看道路与地名；也可切换顺序图。
4. 每日地图、餐厅主备选、分段导航与完成勾选已包含。
5. 2月1日已选择支笏湖冰涛祭，札幌市内仅作风雪备选。
6. 这是独立预览文件夹，不需要覆盖你的原版网页。

离线可以使用：地理底图、完整行程、餐厅卡片、顺序图、餐厅选择与完成记录。
需要联网使用：Google Maps导航、餐厅官网、酒店/机票比价与视频。
街道详图已覆盖札幌市中心、小樽市中心、登别温泉与车站、支笏湖温泉、千岁与新千岁机场。
北海道跨城段为区域概览；广州—香港前夜段仅海陆轮廓与行程点，未含当地街道详图。
地图只打包了本次行程区域；超出街道详图范围会显示区域概览提示。不是完整世界地图。
数据已打包进HTML，不依赖浏览器缓存、在线瓦片、在线字体或API密钥。缩放最高17级。
连线为计划顺序示意，不是实际道路导航；交通班次和餐厅营业信息需出发前复查。
SAMA等分店未明确的原推荐没有虚构精确位置。
地图选择与完成记录保存在当前浏览器；本预览使用单独的记录，不影响在线版记录。

包含文件：index.html、price-monitor.html、Leaflet-LICENSE.txt、使用说明.txt。
底图来源：国土地理院ベクトルタイル提供実験（经裁剪和重绘）与Natural Earth（海陆轮廓，公有领域）。
国土地理院来源：https://github.com/gsi-cyberjapan/gsimaps-vector-experiment
国土地理院利用条款：https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html
Natural Earth：https://www.naturalearthdata.com/about/terms-of-use/

已完成禁止网络请求下的DOM交互与file://检查，并用Canvas绘制核查地理底图。
当前环境缺少真实浏览器操作工具，未进行整页浏览器画面检查。
''')
archive=base/'dist/hokkaido-offline-map-preview.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
 for f in sorted(preview.iterdir()):z.write(f,'hokkaido-offline-map-preview/'+f.name)
with ZipFile(archive) as z:
 assert z.testzip() is None
 assert z.read('hokkaido-offline-map-preview/index.html')==(preview/'index.html').read_bytes()
shutil.copy2(archive,base/'dist/hokkaido-local-preview.zip')
shutil.copy2(preview/'index.html',base/'dist/local-preview.html')
shutil.copy2(preview/'index.html',base/'dist/offline-map-preview.html')
# Add a small explicit entry on the established Site, leaving its route state unchanged.
entry='<a class="pill" href="offline-map-preview.html#route-map" style="text-decoration:none">⌂ 离线地图预览与下载 ↗</a>'
assert 'local-preview.html' not in src
src=src.replace('<div class="hero-pills">','<div class="hero-pills">'+entry,1)
(base/'dist/index.html').write_text(src)
print('Created independent local preview HTML and ZIP; download entry added.')
