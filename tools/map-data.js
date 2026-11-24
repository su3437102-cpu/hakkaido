(() => {
const p = (name,lat,lng,query=name) => ({name,lat,lng,query});
const places = {
 hotel:p('Route Inn 札幌站前北口',43.0692469,141.3492214,'ホテルルートイン札幌駅前北口'),
 sapporo:p('JR札幌站',43.0686555,141.350787,'札幌駅 JR'),
 university:p('北海道大学南侧校园',43.0742,141.3456,'北海道大学 正門'),
 chika:p('Chi-Ka-Ho 地下步行空间',43.0641,141.3509,'札幌駅前通地下歩行空間'),
 redbrick:p('红砖厅舍',43.0639656,141.3480242,'北海道庁旧本庁舎'),
 clock:p('札幌钟楼',43.0625537,141.3536448,'札幌市時計台'),
 nijo:p('二条市场',43.0582472,141.3584604,'二条市場 札幌'),
 tower:p('札幌电视塔',43.0611129,141.3564484,'さっぽろテレビ塔'),
 odori:p('大通公园西1–6丁目',43.0607249,141.3535386,'大通公園 札幌'),
 odori6:p('大通公园西6丁目',43.0599018,141.3475101,'大通公園 西6丁目'),
 tanuki:p('狸小路商店街',43.0568,141.3532,'狸小路商店街'),
 susukino:p('薄野冰雕会场一带',43.0557,141.353,'すすきの駅'),
 otaru:p('JR小樽站',43.1972462,140.9941939,'小樽駅 JR'),
 sankaku:p('三角市场',43.198542,140.9938691,'小樽 三角市場'),
 temiya:p('旧手宫线遗址',43.1983,140.9989,'旧手宮線跡地 小樽'),
 bank:p('色内银行街',43.1948,141.0016,'日本銀行旧小樽支店'),
 warehouse:p('小樽运河仓库群',43.1995,141.0017,'小樽運河 倉庫群'),
 sakaimachi:p('堺町通',43.1941,141.0060,'小樽 堺町通り'),
 canal:p('小樽运河 · 浅草桥',43.1975,141.0036,'小樽運河 浅草橋'),
 chitose:p('JR千岁站',42.8280,141.6511,'千歳駅 北海道'),
 lake:p('支笏湖温泉 / 冰涛祭一带',42.7728,141.4068,'支笏湖 氷濤まつり'),
 ski:{name:'雪场与接驳地点待确认',query:'札幌 スキー場'},
 art:{name:'室内艺术场馆待选',query:'札幌 美術館'},
 noboribetsu:p('JR登别站',42.4521,141.1802,'登別駅'),
 onsen:p('登别温泉巴士总站',42.4914081,141.1432133,'登別温泉バスターミナル'),
 takimoto:p('第一滝本馆',42.4951825,141.1448378,'第一滝本館 登別'),
 jigoku:p('地狱谷入口一带',42.4979,141.1480,'登別地獄谷'),
 cts:p('新千岁机场 / JR机场站',42.7878,141.6810,'新千歳空港駅'),
 ctsintl:p('新千岁国际航站楼',42.7836,141.6765,'新千歳空港 国際線ターミナル'),
 guangzhou:p('广州天河 · 出发区域',23.131,113.327,'广州天河'),
 south:p('广州南站（可选）',22.9888,113.2693,'广州南站'),
 east:p('广州东站（可选）',23.1495,113.3247,'广州东站'),
 kowloon:p('香港西九龙站',22.3045,114.1654,'香港西九龍站'),
 tungchung:p('东涌酒店区域 · 待订',22.2908,113.9418,'東涌 酒店'),
 hkg:p('香港国际机场',22.315,113.936,'香港國際機場')
};
const food = (name,lat,lng,query,source,note) => ({...p(name,lat,lng,query),source,note});
const foods = {
 horyu:food('寳龍 APIA店',43.0676,141.3506,'ラーメンの寳龍 アピア店','https://www.apiadome.com/','札幌站地下商场内；按楼内导览找店。'),
 hotei:food('布袋 赤れんがテラス店',43.0641,141.3500,'布袋 赤れんがテラス店','https://www.akarenga-terrace.jp/','札幌站南侧赤砖露台楼内；晚餐备选。'),
 donburi:food('どんぶり茶屋 二条市场店',43.0580,141.3582,'どんぶり茶屋 二条市場店','https://donburi.jp/shop/nijo','南3条东1-7，新二条市场内；适合作为二条市场午餐。'),
 kushistation:food('串鳥 札幌站前店',43.0661,141.3531,'串鳥 札幌駅前店 札幌TRビル','https://kushidori.com/shop/','北4条西2丁目，札幌TR大厦2F；晚餐后回北口酒店。'),
 naruto:food('若鶏時代なると 本店',43.2011,140.9952,'若鶏時代なると 本店 小樽','https://otaru.gr.jp/shop/wakatorijidai-naruto-honten','午餐主选。位于站北侧，从色内银行街前往需要折返。'),
 yabuhan:food('蕎麦屋 薮半',43.1954,140.9967,'蕎麦屋 薮半 小樽','https://yabuhan.co.jp/','午餐备选；小樽站南侧，想少折返时选择。'),
 matsuo:food('松尾成吉思汗 札幌站前店',43.0656,141.3503,'松尾ジンギスカン 札幌駅前店','https://www.matsuo1956.jp/shop/ekimae/','北3条西4-1-1，日本生命札幌大厦B1；晚餐建议预约。'),
 kitakaro:food('北菓楼 札幌本馆',43.0618,141.3481,'北菓楼 札幌本館','https://www.kitakaro.com/','市内方案的咖啡甜品候选；不为此增加跨城行程。'),
 samamaruyama:{name:'SAMA 圆山店（原推荐）',query:'SAMA 円山店 札幌',source:'https://hb-sama.com/',note:'原文件未明确可核对的分店，保留推荐，暂不落点。先确认分店再安排。'},
 daio:food('味の大王 登别温泉店',42.4925918,141.143313,'味の大王 登別温泉店','https://noboribetsu-spa.jp/spot/spot0189/','温泉街午餐主选；之后再去地狱谷。'),
 fukuan:food('そば処 福庵',42.4920,141.1429,'そば処 福庵 登別温泉','https://noboribetsu-spa.jp/','温泉街午餐备选；晚餐已包含在旅馆订单内。'),
 ippin:food('十勝豚丼いっぴん · 札幌站商圈',43.0677,141.3509,'十勝豚丼いっぴん 札幌駅','https://butadon-ippin.com/restaurant/','按原计划选择札幌站商圈门店，图示为商圈位置；请在官网确认最终分店。'),
 sama:{name:'SAMA 汤咖喱（分店待定）',query:'SOUP CURRY SAMA 札幌',source:'https://hb-sama.com/',note:'原计划未指定分店；先比较与札幌站北口酒店的距离，再决定是否外出。'},
 kushisouth:food('串鳥 南二条店',43.0572,141.3499,'串鳥 南二条店','https://kushidori.com/shop/','南2条西5丁目，メゾン本府1F；冰雪节当天晚餐主选。'),
 manryu:food('札幌拉面 满龙 · 总本店',43.0531,141.3540,'満龍 総本店 札幌','https://manryu.co.jp/shop_ekimae.html','为原推荐明确薄野总本店作为导航候选；晚餐备选。'),
 airportdon:food('どんぶり茶屋 新千岁机场店',42.7871,141.6804,'どんぶり茶屋 新千歳空港店','https://donburi.jp/shop/chitose/','国内线航站楼3F；需预留前往国际线柜台和安检的时间。'),
 ramen:food('北海道拉面道场',42.7876,141.6808,'北海道ラーメン道場 新千歳空港','https://www.hokkaido-airports.com/ja/new-chitose/','国内线航站楼3F，多家拉面店；按排队和剩余时间选择。')
};
const stop = (place,time,title,mode='walk',note='',extra={}) => ({place,time,title,mode,note,...extra});
const dinner = (time='18:00',choices=['horyu','hotei']) => stop('sapporo',time,'札幌站附近晚餐','walk','只选一家，不为名店长时间排队。',{meal:'晚餐',choices});
const home = (time='20:30') => stop('hotel',time,'回北口酒店休息','walk');
const days = [
 {id:'eve',label:'前夜',date:'1/28',title:'广州 → 香港机场一带',summary:'高铁后直接前往机场 / 东涌酒店区域；香港酒店尚未确定。',note:'广州东 / 南站二选一，以出票为准；地图按所选车站绘制，不表示已订车次。香港段交通以实际酒店位置为准。',branches:{south:'经广州南站',east:'经广州东站'},defaultBranch:'south',stops:[stop('guangzhou','14:00','天河出发'),stop('south','15:30–17:30','高铁出发站（按出票选择）','urban'),stop('kowloon','傍晚','抵达香港西九龙','rail'),stop('tungchung','18:00–19:15','前往机场 / 东涌酒店一带','urban','地图标注酒店区域；不是已订酒店。'),stop('hkg','次日06:10','次晨前往香港机场','bus')],foods:[],planMap:[0,1,3,3,3]},
 {id:'d1',label:'D1',date:'1/29',title:'新千岁落地 → 札幌入住',summary:'HX692：香港09:10出发，新千岁15:00抵达。地图聚焦日本落地段；时间均沿用原计划的当地时间。',note:'先入境取行李，再乘JR快速Airport。第一晚只在札幌站附近吃饭，21:30回酒店。',stops:[stop('ctsintl','15:00–16:10','入境、取行李'),stop('cts','16:20','前往JR新千岁机场站','walk'),stop('sapporo','17:10','JR快速Airport → 札幌','rail','原计划预留16:20–17:10；具体搭乘以现场运行情况为准。'),stop('hotel','17:20–17:40','北口 Route Inn 入住','walk'),dinner('18:15–19:15'),home('21:30')],foods:['horyu','hotei'],planMap:[0,0,0,0,0,2,3,4,5,5]},
 {id:'d2',label:'D2',date:'1/30',title:'札幌雪景散步 · 从北到南',summary:'北大校园 → 历史建筑 → 二条市场 → 大通 → 狸小路 → 薄野；晚餐回札幌站前，沿用原餐饮推荐。',note:'雪大时跳过北大，从札幌站进入Chi-Ka-Ho。大通、薄野与札幌站之间可改乘南北线。',stops:[stop('hotel','09:15左右','从北口酒店出发'),stop('university','09:30','北海道大学雪景','walk','只走南侧校园，不追求走完整个校区。'),stop('chika','11:15','经札幌站进入Chi-Ka-Ho','walk'),stop('redbrick','11:45','红砖厅舍','walk'),stop('clock','随后','札幌钟楼','walk'),stop('nijo','13:00','二条市场午餐','walk','按原推荐吃海鲜丼。',{meal:'午餐',choices:['donburi']}),stop('tower','14:30','电视塔','walk'),stop('odori6','下午','大通公园西1–6丁目','walk'),stop('tanuki','17:15起','灯光 → 狸小路','walk'),stop('susukino','傍晚','薄野夜雪','walk'),dinner('晚间',['kushistation']),home('20:30前')],foods:['donburi','kushistation'],planMap:[1,2,3,5,6,8]},
 {id:'d3',label:'D3',date:'1/31',title:'小樽日归 · 赶上运河蓝调',summary:'JR往返 + 小樽步行；16:15前往运河，不追加远处景点。午餐两选一。',note:'なると本店位于站北侧，从银行街去吃饭会折返；想少走路可选薮半。回程前查看JR运行状态。',stops:[stop('sapporo','09:20','札幌站出发'),stop('otaru','约10:00','JR抵达小樽','rail'),stop('sankaku','10:20','三角市场短逛','walk'),stop('temiya','随后','旧手宫线','walk'),stop('bank','12:00前','色内银行街','walk'),stop('bank','12:00','小樽午餐','walk','候选只选一家；排队超过30分钟启用备选。',{meal:'午餐',choices:['naruto','yabuhan']}),stop('warehouse','下午','运河仓库群','walk'),stop('sakaimachi','14:00','堺町通与室内休息','walk'),stop('canal','16:15','浅草桥 · 运河蓝调时刻','walk'),stop('otaru','18:00','小樽站返程','walk'),stop('sapporo','晚间','JR返回札幌站','rail'),home('晚餐后')],foods:['naruto','yabuhan'],planMap:[0,2,4,6,8,9]},
 {id:'d4',label:'D4',date:'2/1',title:'天气决策日 · 三选一',summary:'前一晚20:00根据天气、交通、体力与预约决定。切换方案后只显示该方案的路线。',note:'原计划没有指定雪场或艺术场馆，不擅自补成已确定目的地。支笏湖经千岁换巴士仅为交通方向示意，2027班次及往返衔接仍需确认。',branches:{lake:'A · 支笏湖',ski:'B · 半日滑雪',city:'C · 市内艺术'},defaultBranch:'lake',stops:[],foods:['matsuo'],planMap:[0,2,1,1,4]},
 {id:'d5',label:'D5',date:'2/2',title:'札幌 → 登别温泉',summary:'大箱留札幌，只带一晚包。JR特急 → 道南巴士 → 温泉街午餐 → 地狱谷 → 第一滝本馆。',note:'交通延误就取消地狱谷，优先衔接巴士、入住和旅馆晚餐；14:30为原计划到馆时间，办理入住以旅馆安排为准。',stops:[stop('hotel','09:00','退房、寄存大箱'),stop('sapporo','10:00左右','札幌站乘JR特急','walk'),stop('noboribetsu','约11:30','JR登别站','rail','原计划特急耗时约75–90分钟，需查正式时刻。'),stop('onsen','12:00左右','道南巴士 → 温泉街','bus','巴士约15–22分钟，衔接需留缓冲。'),stop('onsen','13:00前','温泉街午餐','walk','晚餐已含在旅馆订单内。',{meal:'午餐',choices:['daio','fukuan']}),stop('jigoku','13:00后','地狱谷 · 只走开放步道','walk'),stop('takimoto','14:30','第一滝本馆到馆 / 入住','walk'),stop('takimoto','晚间','怀石晚餐与温泉','stay','按旅馆约定用餐，不另订晚餐。')],foods:['daio','fukuan'],planMap:[0,1,3,4,6,7]},
 {id:'d6',label:'D6',date:'2/3',title:'登别晨间 → 回札幌休息',summary:'晨汤与旅馆早餐 → 温泉街短走 → 巴士 + JR回札幌 → 取大箱、洗衣、休息。',note:'若前一天已看过地狱谷，09:00留在旅馆。下午没有必须项目；SAMA分店未定，暂不画入路线。',stops:[stop('takimoto','07:30','晨汤与旅馆早餐'),stop('jigoku','09:00 · 可跳过','温泉街短走 / 补看地狱谷','walk'),stop('onsen','10:00','退房后到巴士站','walk'),stop('noboribetsu','10:30起','道南巴士 → 登别站','bus'),stop('sapporo','13:00–14:00左右','JR特急返回札幌','rail'),stop('hotel','14:00','取大箱、重新入住、洗衣','walk'),dinner('18:00',['ippin']),home('晚餐后')],foods:['ippin','sama'],planMap:[0,1,2,3,5,6]},
 {id:'d7',label:'D7',date:'2/4',title:'冰雪节 · 上午与夜景分两段',summary:'上午大通雪像 → 地下街午餐 → 回酒店休息2–3小时 → 16:30再出发 → 薄野冰雕与晚餐。',note:'保留午后休息。大通与薄野之间可走地下空间；人流太大就先入地下街，错峰返回。',stops:[stop('hotel','08:45左右','北口酒店出发'),stop('sapporo','09:00','前往地铁さっぽろ站','walk'),stop('odori','09:00后','南北线1站 → 大通','metro'),stop('odori6','09:20','大通雪像主线','walk'),stop('odori','12:00','地下街午餐','walk','店铺按现场空位选择，不把摊位当必须正餐。'),stop('hotel','午后','回酒店休息2–3小时','metro'),stop('odori','16:30','再次到大通 · 灯光与雪像','metro'),stop('susukino','19:00','薄野冰雕会场','walk'),stop('susukino','冰雕后','晚餐二选一','walk','串鳥南二条店需向北折返；不想折返可选薄野满龙。',{meal:'晚餐',choices:['kushisouth','manryu']}),home('21:00前')],foods:['kushisouth','manryu'],planMap:[2,3,4,6,7]},
 {id:'d8',label:'D8',date:'2/5',title:'札幌 → 新千岁 → 香港',summary:'HX693原计划16:00新千岁出发、21:20香港抵达。地图聚焦去机场路线；不追加上午远景点。',note:'餐厅位于国内线3F；提前确认国际柜台位置，预留跨楼和安检时间。13:00开始值机、15:00到登机口，以出票通知为准。',stops:[stop('hotel','09:30','北口酒店退房'),stop('sapporo','10:10–10:30','札幌站准备乘车','walk'),stop('cts','11:20左右','JR快速Airport → 新千岁','rail'),stop('cts','11:20–12:30','机场午餐 / 最后采购','walk','先确认国际线柜台，按剩余时间决定是否用餐。',{meal:'午餐',choices:['airportdon','ramen']}),stop('ctsintl','13:00','国际线值机、托运','walk'),stop('ctsintl','15:00 / 16:00','到登机口 / HX693起飞','stay')],foods:['airportdon','ramen'],planMap:[0,0,1,2,3,4,5,5,5]}
];
const branches = {
 lake:[stop('hotel','08:30起','酒店出发'),stop('chitose','以时刻为准','JR到千岁 · 换乘点示意','rail'),stop('lake','以时刻为准','支笏湖温泉 / 冰涛祭','bus','确认2027往返班次、末班及道路状况；午餐当地食堂，带能量棒。'),stop('chitose','按返程班次','巴士回千岁','bus'),stop('sapporo','晚间','JR返回札幌','rail'),dinner('回札幌后',['matsuo']),home('18:30目标')],
 ski:[stop('hotel','08:00起','酒店出发'),stop('ski','预约后确定','半日滑雪 · 目的地待定','pending','必须先确定雪场、课程、雪具、保险、接驳上下车点和返程。'),stop('hotel','18:30前','回酒店，整理登别一晚包','pending'),dinner('晚间',['matsuo']),home('晚餐后')],
 city:[stop('hotel','10:00左右','酒店出发'),stop('art','10:30','室内艺术场馆 · 待选','pending','先核对2月1日营业与展览；只选一个场馆。'),stop('hotel','下午','返回市中心 / 咖啡甜品候选','pending','北菓楼为原推荐，可按体力安排。',{meal:'咖啡',choices:['kitakaro']}),dinner('晚间',['matsuo']),home('18:30目标')]
};
window.HKMapData = {places,foods,days,branches};
})();
