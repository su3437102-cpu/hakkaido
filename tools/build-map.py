from pathlib import Path
import re

root=Path('/workspace/work')
data=(root/'map-data.js').read_text()
data=data.replace("43.0661,141.3531", "43.0668865,141.3531117").replace("43.2011,140.9952", "43.200282,140.995107").replace("43.0656,141.3503", "43.0650233,141.3503482").replace("43.0572,141.3499", "43.0573156,141.3500481").replace("43.0531,141.3540", "43.0534054,141.3540889")
data=data.replace("title:'天气决策日 · 三选一'", "title:'支笏湖冰涛祭 · 已选主线'")
data=data.replace("summary:'前一晚20:00根据天气、交通、体力与预约决定。切换方案后只显示该方案的路线。'", "summary:'2月1日已选支笏湖冰涛祭：札幌 → 千岁换乘 → 支笏湖 → 原路返回。札幌市内只作为强风雪或交通异常时的备选。'")
data=data.replace("原计划没有指定雪场或艺术场馆，不擅自补成已确定目的地。支笏湖经千岁换巴士仅为交通方向示意，2027班次及往返衔接仍需确认。", "08:30按原计划从酒店出发；JR至千岁后换巴士是交通方向示意，需核对2027冬季正式班次、往返衔接与末班。优先白天游览，不默认等亮灯；目标18:30回酒店整理登别一晚包。")
data=data.replace("branches:{lake:'A · 支笏湖',ski:'B · 半日滑雪',city:'C · 市内艺术'}", "branches:{lake:'已选 · 支笏湖冰涛祭',city:'风雪备选 · 札幌市内'}")
data=data.replace("foods:['matsuo'],planMap:[0,2,1,1,4]", "foods:['matsuo'],planMap:[0,0,1,2,2,3,6]")
data=data.replace("dinner('回札幌后',['matsuo'])", "dinner('返程时间允许时',['matsuo'])")
data=data.replace("home('18:30目标')", "home('18:30目标 · 整理登别一晚包')")
data=data.replace("dinner('晚间',['matsuo']),home('18:30", "dinner('17:00左右',['matsuo']),home('18:30")

src=(root/'hokkaido/index.html').read_text()
source_d4=re.search(r'<details class="day-plan"><summary><span class="plan-day">D4</span>.*?</details>',src,re.S).group()
rows=[
 ('前晚20:00','查支笏湖天气、道路与往返交通','已选择支笏湖冰涛祭。出发前核对2027冬季巴士正式时刻、去回程、末班与JR衔接；风雪或交通异常改札幌市内。'),
 ('08:30','酒店出发 → 札幌站','按原计划08:30出发。带暖宝宝、饮水与能量棒；冬季班次发布后再锁定具体车次。'),
 ('上午','JR札幌站 → 千岁站','JR到千岁后换乘支笏湖方向巴士，当前为交通方向示意。以当年官方交通和实际班次为准，不把换乘压到几分钟。'),
 ('随巴士班次','千岁站 → 支笏湖温泉 / 冰涛祭一带','去程、返程一起确认；不依赖未核实的直达车或临时加班车。'),
 ('白天游览','支笏湖冰涛祭 → 当地午餐','以湖景、冰雕和保暖休息为主；午餐当地食堂，原计划未指定店铺。优先白天游览，不默认等夜间亮灯；返程余量比多看一个项目更重要。'),
 ('按返程时刻','支笏湖 → 千岁 → 札幌','先赶已确认的返程巴士，再接JR。若时间充足，回札幌后可吃原推荐松尾成吉思汗；赶不上或疲劳就车站便餐，不硬塞预约。'),
 ('18:30目标','回酒店 → 整理登别一晚包','回酒店充电、准备换洗；19:30整理完成一晚包，大箱次日寄存在札幌原酒店。回程时间最终取决于正式班次。')
]
d4='<details class="day-plan"><summary><span class="plan-day">D4</span><span class="plan-title"><b>2月1日 · 支笏湖冰涛祭（已选）</b><span>札幌 → 千岁换乘 → 支笏湖 · 风雪时改市内</span></span></summary><div class="plan-body"><div class="plan-metrics"><span>主路线已选</span><span>往返班次待核</span><span>18:30回酒店目标</span></div>'
for time,title,note in rows:
 d4+=f'<div class="plan-stop"><time>{time}</time><div class="plan-rail"><i class="plan-dot"></i></div><div class="plan-content"><h3>{title}</h3><p>{note}</p></div></div>'
d4+='<div class="fallback"><b>风雪备选：</b>交通停运、道路异常、强风雪或身体不适就取消支笏湖，改札幌室内场馆＋咖啡。半日滑雪不再作为2月1日的执行方案。</div></div></details>'
src=src.replace(source_d4,d4)
src=src.replace('2/1 · 天气决策日','2/1 · 支笏湖冰涛祭（已选）')
src=src.replace('支笏湖 / 半日滑雪 / 札幌市内三选一；18:30回酒店，19:30整理登别一晚包。','已选支笏湖；经千岁换乘，往返班次待核。风雪时改札幌市内；18:30回酒店目标。')
src=src.replace('2月1日：看状态再决定','2月1日：支笏湖冰涛祭（已选）')
src=src.replace('提前准备三个答案，不让天气替你毁掉一天。','主线已选择支笏湖，札幌市内保留为风雪备选；半日滑雪不再安排。')
src=re.sub(r'<div class="choice" data-choice="ski">.*?</div></div>', '',src,count=1,flags=re.S)
src=src.replace('<button data-pick="ski">选滑雪</button>','')
src=src.replace('>选支笏湖</button>','>支笏湖 · 已选主线</button>').replace('>留在市内</button>','>查看风雪市内备选</button>')
src=src.replace('<div class="choice-grid" id="choices">','<div class="choice-grid" id="choices" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">')
src=src.replace('湖边冰雕与夜间灯光；公共交通班次少，回程受天气影响更明显。','已选：以白天湖景、冰雕为主；不默认等亮灯。经千岁换巴士，正式班次需核对。')
src=src.replace('<b>D4 · 神社艺术日</b>','<b>2/1 · 风雪市内餐饮备选</b>')
src=src.replace('圆山一带午餐选汤咖喱；晚餐提前预约札幌站前成吉思汗，避免去薄野热门排队店。','仅风雪取消支笏湖时参考。SAMA原推荐未明确可核对分店，先确认门店；不为一餐绕行圆山。')
src=src.replace('<b>2/1 · 天气决策日</b>','<b>2/1 · 支笏湖冰涛祭（已选）</b>')
src=src.replace('支笏湖/滑雪选当地食堂并准备能量棒；留在札幌则安排一顿预约制或错峰成吉思汗。','午餐在支笏湖当地食堂，携带能量棒；回札幌后时间与体力允许再选松尾成吉思汗，不硬塞晚餐预约。北菓楼只作为市内风雪备选。')
src=src.replace('其他只在2月3日根据状态选择。','2月1日已选支笏湖；其他方案保留作比较，不追加进当天主路线。')

# Keep the original page intact outside the itinerary/map integration.
style=(root/'vendor/leaflet.css').read_text().replace('/*# sourceMappingURL=leaflet.css.map */','')
style+='\n'+(root/'map-style.css').read_text()
src=src.replace('</head>','<style>\n'+style+'\n</style>\n</head>',1)
marker='带虚线下划线的交通文字可悬停或点击查看乘车区间、耗时、频率与换乘提示。</p>'
src=src.replace(marker,marker+'\n'+(root/'map-section.html').read_text(),1)
src=src.replace('北海道冬日独旅 · 个性化执行版 v2','北海道冬日独旅 · 路线地图版 v3')
src=src.replace('最后整理：2026-09-29','地图更新：2026-11-15')
src=re.sub(r'<iframe class="video" src="([^"]+)"[^>]*></iframe>',r'<button type="button" class="video video-load" data-video-src="\1" style="color:white;cursor:pointer;padding:24px">▶ 联网播放温泉视频</button>',src)
src=src.replace('})();\n</script>', '})();\n</script>')
leaflet=(root/'vendor/leaflet.js').read_text()
leaflet=re.sub(r'//# sourceMappingURL=.*','',leaflet)
license_text=(root/'hokkaido-map/Leaflet-LICENSE.txt').read_text()
leaflet='/*\nLeaflet license:\n'+license_text.replace('*/','* /')+'\n*/\n'+leaflet
app=(root/'map-app.js').read_text()
app=app.replace("const n=d.id==='d4'?[0,1,2,4,1,route.length-1][j]:(d.planMap[j]??0);", "const n=d.planMap[j]??0;")
app=app.replace("let br=d.defaultBranch;if(d.id==='d4'&&j===4)br='city';", "let br=d.defaultBranch;")
offline=(root/'offline-map/offline-data.js').read_text()+'\n'+(root/'offline-map/offline-basemap.js').read_text()
scripts='\n<script>\n'+leaflet+'\n</script>\n<script>\n'+data+'\n</script>\n<script>\n'+offline+'\n</script>\n<script>\n'+app+'\n</script>\n'
src=src.replace('离线版保留完整攻略与交互；酒店比价、地图和视频需联网打开。','行程与地理底图均已内置；可离线缩放地图、查看路线与餐厅。导航、比价和视频需联网。')
assert src.count('id="route-map"')==1
assert '</body>' in src
src=src.replace('</body>',scripts+'</body>')
(root/'hokkaido-map/index.html').write_text(src)
(root/'built-data.js').write_text(data)
(root/'built-app.js').write_text(app)
print('Built',len(src.encode()),'bytes')
