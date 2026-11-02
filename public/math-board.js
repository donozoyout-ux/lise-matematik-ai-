(()=>{
const css=document.createElement('style');
css.textContent='main{max-width:1520px!important;width:98%!important}.layout{display:grid!important;grid-template-columns:minmax(320px,32%) minmax(0,68%)!important;gap:20px!important;align-items:start}.panel{min-width:0}.question-card{display:none!important}.solution-board{background:#fff!important;padding:13px!important;overflow:hidden!important}.solution-board>.board-step,.solution-board>.answer{display:none!important}.visual-sheet{display:block;width:100%;height:auto;background:#fffef9;border-radius:16px;border:1px solid #dae6f4}.sheet-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-top:12px}.sheet-actions button{background:#e8f2ff!important;color:#19549b!important;min-height:44px;box-shadow:none!important}.sheet-check{font-size:13px;font-weight:700;padding:10px;border-radius:10px;background:#fff1d8;color:#875915}.sheet-check.checked{background:#dff9eb;color:#11633b}.sheet-check.mismatch{background:#ffe3e3;color:#9c2929}.board-zoom{position:fixed!important;inset:1vh 1vw!important;z-index:100!important;overflow:auto!important;background:white!important;max-height:98vh;box-shadow:0 0 0 100vmax #061526c9!important}.board-zoom .visual-sheet{max-width:1200px;margin:auto}.visual-caption{font-weight:700;color:#53769a;font-size:14px;margin:6px 0 12px}@media(max-width:850px){main{width:100%!important;padding:0 10px!important}.layout{grid-template-columns:minmax(0,1fr)!important;gap:12px!important}.panel{padding:13px!important}.solution-board{padding:6px!important}.visual-sheet{border-radius:8px}.sheet-actions button{flex:1}.sheet-check{width:100%}}';
document.head.append(css);
const original=render;
const friendly=s=>String(s??'').trim().replace(/\^2\b/g,'²').replace(/\^3\b/g,'³');
function setFont(c,size,bold=false){c.font=(bold?'bold ':'')+size+'px system-ui'}
function rows(c,str,width){const out=[];for(const para of String(str||'').split('\n')){let row='';for(let word of para.split(/\s+/)){if(!word)continue;while(c.measureText(word).width>width){if(row){out.push(row);row=''}let cut=1;while(cut<word.length&&c.measureText(word.slice(0,cut+1)).width<=width)cut++;out.push(word.slice(0,cut));word=word.slice(cut)}const cand=row?row+' '+word:word;if(row&&c.measureText(cand).width>width){out.push(row);row=word}else row=cand}if(row)out.push(row)}return out.length?out:['']}
function lines(c,s,x,y,width,size,lead,color,bold=false){setFont(c,size,bold);c.fillStyle=color;const arr=rows(c,s,width);for(const row of arr){c.fillText(row,x,y);y+=lead}return y}
function sizeFor(c,s,width,size,lead,bold=false){setFont(c,size,bold);return rows(c,s,width).length*lead}
function rect(c,x,y,w,h,fill,stroke){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,14);c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function geometry(d,c,x,y,w,h){rect(c,x,y,w,h,'#f3f8ff','#dce9f7');lines(c,d.title||'Şekil',x+19,y+36,w-40,24,28,'#28599b',true);
const p=new Map(d.points.map(a=>[a.id,a])),px=x+30,py=y+57,pw=w-60,ph=h-93;
const at=v=>({x:px+pw*v.x/100,y:py+ph*v.y/100});
c.strokeStyle='#2864c0';c.lineWidth=4;for(const seg of d.segments){const aa=p.get(seg.from),bb=p.get(seg.to);if(!aa||!bb)continue;const A=at(aa),B=at(bb);c.beginPath();c.moveTo(A.x,A.y);c.lineTo(B.x,B.y);c.stroke()}
setFont(c,22,true);c.fillStyle='#16406c';for(const point of d.points){const v=at(point);c.fillText(point.id,v.x+8,v.y-7)}
c.fillStyle='#b15e13';for(const label of d.labels||[]){const v=at(label);c.fillText(String(label.text||''),v.x+3,v.y-7)}}
function getKind(){if(solution.kind==='geometry'||solution.diagram||solution.diagrams?.length)return 'geometry';return 'algebra'}
function needsTwoPositions(){const q=String(solution.question||'');return /(?:1\.?\s*konum|birinci\s+konum)/i.test(q)&&/(?:2\.?\s*konum|ikinci\s+konum)/i.test(q)}
function getDiagrams(){const ds=Array.isArray(solution.diagrams)?solution.diagrams:(solution.diagram?[solution.diagram]:[]);const accepted=ds.filter(d=>d&&d.points?.length>=2&&d.segments?.length).slice(0,3);return needsTwoPositions()&&accepted.length<2?[]:accepted}
function loadPhoto(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src})}
function paint(canvas){
const mobile=window.innerWidth<700,W=mobile?680:1120,P=30,inside=W-P*2;
const c=canvas.getContext('2d'),steps=solution.steps.slice(0,step+1),kind=getKind(),ds=getDiagrams();
const questionH=sizeFor(c,solution.question,inside,31,43,true)+150;
let geometryH=0,cols=1,diagramH=mobile?320:350;
const workings=(Array.isArray(solution.working)?solution.working:[]).slice(0,Math.max(1,step+1));
if(kind==='geometry'){cols=mobile?1:Math.min(ds.length||1,2);geometryH=ds.length?Math.ceil(ds.length/cols)*(diagramH+13)+35:(mobile?280:350)}
else{geometryH=110+workings.reduce((n,w)=>n+sizeFor(c,friendly(w),inside-48,35,46,true)+15,0);geometryH=Math.max(175,geometryH)}
const hs=steps.map(s=>95+sizeFor(c,s.title||'Çözüm',inside-90,29,38,true)+(s.formula?sizeFor(c,friendly(s.formula),inside-90,34,46,true)+12:0)+(s.explanation?sizeFor(c,s.explanation,inside-90,26,38)+13:0));
const stepH=hs.reduce((a,b)=>a+b,0)+Math.max(0,steps.length-1)*14;
const final=step===solution.steps.length-1,answerH=final?135:0;
const H=questionH+geometryH+stepH+answerH+70;
canvas.width=W;canvas.height=H;
const ctx=canvas.getContext('2d');ctx.fillStyle='#fffdfa';ctx.fillRect(0,0,W,H);ctx.fillStyle='#3074ef';ctx.fillRect(0,0,W,8);
ctx.strokeStyle='#edf2fa';ctx.lineWidth=1;for(let yy=70;yy<H;yy+=65){ctx.beginPath();ctx.moveTo(18,yy);ctx.lineTo(W-18,yy);ctx.stroke()}
lines(ctx,'MATEMATİK AI / GÖRSEL ÇÖZÜM',P,45,inside,23,28,'#3471b6',true);
lines(ctx,kind==='geometry'?'GEOMETRİ':'CEBİR',P,79,inside,18,25,'#6b819e',true);
let y=lines(ctx,solution.question,P,123,inside,31,43,'#19345a',true)+27;
const mainY=y;
if(kind==='algebra'){
rect(ctx,25,y,W-50,geometryH,'#f1f7ff','#dce8f7');
let lineY=y+42;
lineY=lines(ctx,'DENKLEM VE İŞLEMLER',43,lineY,inside-36,22,31,'#2868b1',true)+25;
if(workings.length)for(const w of workings){lineY=lines(ctx,friendly(w),48,lineY,inside-46,35,46,'#1d58a6',true)+15}
else lines(ctx,'Çözüm adımları aşağıda gösteriliyor.',47,lineY,inside-45,26,36,'#42698e');
}else if(ds.length){
let cellW=(W-50-(cols-1)*12)/cols;
for(let i=0;i<ds.length;i++){const x=25+(i%cols)*(cellW+12),yy=y+Math.floor(i/cols)*(diagramH+13);geometry(ds[i],ctx,x,yy,cellW,diagramH)}
lines(ctx,'Şekildeki ölçüleri orijinal soruyla karşılaştırın.',37,y+geometryH-11,inside-14,19,24,'#8b6a39');
}else{
rect(ctx,25,y,W-50,geometryH,'#f2f8ff','#dce8f7');
lines(ctx,needsTwoPositions()?'İKİ KONUM TAM ÇİZİLEMEDİ · ORİJİNAL ŞEKİL':'ORİJİNAL ŞEKİL · REFERANS',42,y+34,inside-40,20,28,'#54739b',true);
}
y+=geometryH+27;
for(let i=0;i<steps.length;i++){
const s=steps[i];rect(ctx,25,y,W-50,hs[i],i===step?'#fff3d5':'#f4f8ff',i===step?'#f0d69e':'#e1eaf7');
rect(ctx,39,y+19,42,43,i===step?'#e6a534':'#2873cd');
lines(ctx,String(i+1),51,y+49,28,23,26,'#fff',true);
let yy=lines(ctx,s.title||'Çözüm',95,y+47,W-126,29,38,'#163c6c',true)+10;
if(s.formula)yy=lines(ctx,friendly(s.formula),95,yy,W-127,34,46,'#1d6bc6',true)+12;
if(s.explanation)lines(ctx,s.explanation,95,yy,W-126,26,38,'#273f5d');
y+=hs[i]+14;
}
if(final){
const stat=solution.verification?.status||'review',bad=stat==='mismatch',ok=stat==='checked';
const ink=bad?'#9a2929':ok?'#17603d':'#92611c';
rect(ctx,25,H-153,W-50,103,bad?'#ffe5e5':ok?'#dff9e8':'#fff0d3');
lines(ctx,bad?'DOĞRULAMA HATASI':ok?'ARİTMETİK DOĞRULANDI':'SONUÇ KONTROL EDİLMELİ',41,H-110,inside-24,20,28,ink,true);
lines(ctx,bad?'Sonuç güvenli değil.':'SONUÇ: '+solution.answer,41,H-69,inside-24,34,40,ink,true);
}
const drawFallback=async()=>{if(kind==='geometry'&&!ds.length){const img=await loadPhoto(solution.cropImage||image);if(img){const sc=Math.min((W-90)/img.width,(geometryH-57)/img.height),dw=img.width*sc,dh=img.height*sc;ctx.save();ctx.filter='brightness(1.12) contrast(1.10)';ctx.drawImage(img,(W-dw)/2,mainY+41+(geometryH-55-dh)/2,dw,dh);ctx.restore()}}};
return drawFallback();
}
render=function(){original();if(!solution)return;const board=document.querySelector('.solution-board');if(!board)return;
const label=document.createElement('p');label.className='visual-caption';label.textContent=(needsTwoPositions()&&!getDiagrams().length?'İki geometri konumu birlikte çizilemedi; orijinal soru şekli gösteriliyor':getKind()==='geometry'?'Geometri çizimi':'Cebir işlemleri')+' · '+(step+1)+'/'+solution.steps.length+' adım';
const canvas=document.createElement('canvas');canvas.className='visual-sheet';canvas.setAttribute('aria-label','Beyaz matematik çözüm tahtası, soru ve işlemler');board.insertBefore(label,board.firstChild);board.insertBefore(canvas,label.nextSibling);
const actions=document.createElement('div');actions.className='sheet-actions';
const save=document.createElement('button');save.className='btn';save.disabled=true;save.textContent='Çözüm PNG kaydet';save.onclick=()=>{const a=document.createElement('a');a.download='matematik-cozum.png';a.href=canvas.toDataURL('image/png');a.click()};
const zoom=document.createElement('button');zoom.className='btn';zoom.textContent='Büyüt';zoom.onclick=()=>{const on=board.classList.toggle('board-zoom');zoom.textContent=on?'Kapat':'Büyüt'};
const proof=document.createElement('div');proof.className='sheet-check '+(solution.verification?.status||'review');proof.textContent=solution.verification?.message||'Bağımsız matematik kontrolü bulunmuyor.';
actions.append(save,zoom,proof);board.append(actions);
paint(canvas).then(()=>{save.disabled=false}).catch(e=>{proof.textContent='Görsel oluşturulamadı: '+e.message});
};
})();