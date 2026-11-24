from pathlib import Path
import re,shutil

source=Path('/workspace/sites/hokkaido-winter-map-2027/dist')
root=Path('/workspace/work/hokkaido-lan-site')
public=root/'public'
for folder in [public/'styles',public/'js',public/'vendor',public/'data']:
 folder.mkdir(parents=True,exist_ok=True)
html=(source/'index.html').read_text()
styles=re.findall(r'<style[^>]*>(.*?)</style>',html,re.S)
scripts=re.findall(r'<script[^>]*>(.*?)</script>',html,re.S)
assert len(styles)==2 and len(scripts)==6
(public/'styles/page.css').write_text(styles[0])
(public/'styles/map.css').write_text(styles[1])
(public/'js/page.js').write_text(scripts[0])
(public/'js/packing.js').write_text(scripts[1])
(public/'vendor/leaflet.js').write_text(scripts[2])
(root/'itinerary-source.js').write_text(scripts[3])
offline=scripts[4]
marker='/* Offline cartography:'
pos=offline.index(marker)
(public/'data/offline-basemap.js').write_text(offline[:pos])
(public/'js/offline-basemap.js').write_text(offline[pos:])
(public/'js/map-app.js').write_text(scripts[5])
for tag in ['style','script']:
 html=re.sub('<'+tag+r'[^>]*>.*?</'+tag+'>','',html,flags=re.S)
html=html.replace('<title>北海道冬日独旅 · 2027执行版</title>','<title>北海道行程 · 局域网预览</title>')
html=html.replace('href="offline-map-preview.html#route-map"','href="#route-map"').replace('⌂ 离线地图预览与下载 ↗','⌂ 内网行程地图 ↓')
banner='''<aside class="lan-preview-banner"><b>局域网预览</b><span>同一网络可访问 · 修改保存后自动刷新 · 地理底图已内置</span><span id="lan-connection-status" role="status" aria-live="polite">正在连接更新服务</span></aside>'''
html=html.replace('</header>','</header>'+banner,1)
links='\n<link rel="stylesheet" href="styles/page.css">\n<link rel="stylesheet" href="styles/map.css">\n<link rel="stylesheet" href="styles/lan.css">\n'
html=html.replace('</head>',links+'</head>')
loads='\n'.join('<script src="'+path+'" defer></script>' for path in ['js/page.js','js/packing.js','vendor/leaflet.js','data/offline-basemap.js','js/offline-basemap.js','js/bootstrap.js','js/live-reload.js'])
html=html.replace('</body>',loads+'\n</body>')
(public/'index.html').write_text(html)
for file in ['price-monitor.html','hokkaido-trip-hub.zip','Leaflet-LICENSE.txt','地图数据来源.txt']:
 shutil.copy2(source/file,public/file)
(public/'styles/lan.css').write_text('''.lan-preview-banner{display:flex;gap:9px 16px;align-items:center;flex-wrap:wrap;margin:0 0 18px;padding:11px 16px;border:1px solid #bed9e5;border-radius:12px;background:#eaf7fc;color:#365e73;font-size:12px}.lan-preview-banner>b{color:#153a51;font-size:13px}.lan-preview-banner>span:nth-child(2){flex:1;min-width:230px}#lan-connection-status{font-size:11px;color:#187c63}#lan-connection-status.disconnected{color:#956328}@media print{.lan-preview-banner{display:none}}''')
print('Split page into editable project:',root)
