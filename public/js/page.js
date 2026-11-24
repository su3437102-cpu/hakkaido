
const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
function updateBudget(){const v=+$('#budget').value;$('#budgetLabel').textContent='¥'+v.toLocaleString('zh-CN');$('#dailyBudget').textContent='¥'+Math.round(v/8).toLocaleString('zh-CN')+' / 日本日'}
$('#budget').addEventListener('input',updateBudget);
$('#save').addEventListener('click',e=>{localStorage.setItem('hk-v2-plan',JSON.stringify({budget:+$('#budget').value}));e.currentTarget.textContent='已保存到此设备';e.currentTarget.classList.add('saved');setTimeout(()=>{e.currentTarget.textContent='保存我的版本';e.currentTarget.classList.remove('saved')},1600)});try{const p=JSON.parse(localStorage.getItem('hk-v2-plan'));if(p){$('#budget').value=p.budget||16500}}catch(e){}updateBudget();
if(location.protocol==='file:'){$('.offline-download').hidden=true;const frame=$('.video');const note=document.createElement('div');note.className='video';note.style.cssText='display:grid;place-items:center;padding:24px;color:white;text-align:center';note.innerHTML='离线模式：视频未打包<br><small>联网后点击下方链接即可观看</small>';frame.replaceWith(note)}
const speechStatus=$('#speechStatus'),speakButtons=$$('.speak');let activeSpeakButton=null;
function japaneseVoice(){const voices=window.speechSynthesis.getVoices();return voices.find(v=>/^ja[-_]/i.test(v.lang)&&/Japanese|Japan|Haruka|Ayumi|Ichiro|Nanami|Kyoko|Otoya/i.test(v.name))||voices.find(v=>/^ja[-_]/i.test(v.lang))||null}
function resetSpeakButton(){if(activeSpeakButton){activeSpeakButton.classList.remove('playing');activeSpeakButton.textContent='朗读'}activeSpeakButton=null}
function speakJapanese(button){
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){speechStatus.textContent='当前浏览器不支持系统朗读，请改用 Chrome 或 Edge 打开此网页。';speechStatus.classList.add('error');return}
  window.speechSynthesis.cancel();resetSpeakButton();
  const utterance=new SpeechSynthesisUtterance(button.dataset.say);utterance.lang='ja-JP';utterance.rate=.82;utterance.pitch=1;utterance.volume=1;
  const voice=japaneseVoice();if(voice)utterance.voice=voice;
  activeSpeakButton=button;button.classList.add('playing');button.textContent='停止';speechStatus.classList.remove('error');speechStatus.textContent=voice?'正在使用 '+voice.name+' 朗读日语。':'正在调用系统日语语音；首次播放可能需要稍候。';
  utterance.onend=()=>{resetSpeakButton();speechStatus.textContent='朗读完成，可继续试听其他句子。'};
  utterance.onerror=e=>{resetSpeakButton();if(e.error==='canceled'||e.error==='interrupted')return;speechStatus.textContent='系统没有成功播放日语语音，请确认设备音量，并尝试用 Chrome 或 Edge 打开。';speechStatus.classList.add('error')};
  window.speechSynthesis.speak(utterance)
}
speakButtons.forEach(button=>button.addEventListener('click',()=>{if(button===activeSpeakButton){window.speechSynthesis.cancel();resetSpeakButton();speechStatus.textContent='已停止朗读。'}else speakJapanese(button)}));
if('speechSynthesis' in window){window.speechSynthesis.getVoices();window.speechSynthesis.addEventListener?.('voiceschanged',()=>window.speechSynthesis.getVoices())}
