(()=>{
const style=document.createElement('style');style.textContent="main{max-width:1560px!important;width:min(98%,1560px)!important}.layout{grid-template-columns:minmax(320px,32%) minmax(0,68%)!important;gap:20px!important}.question-card{display:none!important}.solution-board{padding:12px!important;background:#fff!important}.solution-board>.board-step,.solution-board>.answer{display:none!important}.visual-sheet{display:block;width:100%;height:auto;background:#fff;border:1px solid #d9e7fa;border-radius:15px}.sheet-actions{display:flex;gap:10px;margin:10px 0;flex-wrap:wrap}.sheet-actions button{background:#e8f2ff;color:#1b56a0}.visual-caption{font-size:13px;color:#59759b;margin:5px 0 12px}@media(max-width:850px){main{width:100%!important;padding:0 10px!important;margin:12px auto!important}.layout{grid-template-columns:minmax(0,1fr)!important;gap:12px!important}.panel{padding:12px!important}.solution-board{padding:5px!important}.visual-sheet{border-radius:9px}.sheet-actions button{flex:1}}";document.head.append(style);
const oldRender=render;
function flowText(ctx,txt,x,y,width,lineHeight,maxLines){let line='',n=0;for(const word of String(txt||'').split(/\s+/)){let next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){ctx.fillText(line,x,y);y+=lineHeight;n++;line=word;if(n>=maxLines)return y}else line=next}if(line){ctx.fillText(line,x,y);y+=lineHeight}return y}
function drawDiagram(ctx,d,x,y,w,h){if(!d||!d.points||!d.segments?.length)return false;const lookup=Object.fromEntries(d.points.map(p=>[p.id,p]));const pos=p=>({x:x+(p.x/100)*w,y:y+(p.y/100)*h});ctx.lineWidth=3.5;ctx.strokeStyle='#245caa';for(const s of d.segments){const a=lookup[s.from],b=lookup[s.to];if(!a||!b)continue;let pa=pos(a),pb=pos(b);ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke()}ctx.font='bold 23px Arial';ctx.fillStyle='#13457e';for(const p of d.points){let k=pos(p);ctx.beginPath();ctx.arc(k.x,k.y,4,0,Math.PI*2);ctx.fill();ctx.fillText(p.id,k.x+9,k.y-8)}ctx.fillStyle='#ad5f17';for(const l of d.labels||[]){let k=pos(l);ctx.fillText(l.text,k.x,k.y)}return true}
function paint(canvas){
 const W=1120,items=solution.steps.slice(0,step+1);
 const imageArea=solution.diagram?550:335;
 const lineEst=items.reduce((n,s)=>n+110+Math.ceil(String(s.explanation||'').length/58)*42,0);
 const H=Math.max(650,Math.max(215,Math.ceil(String(solution.question).length/52)*43+110)+imageArea+lineEst+(step===solution.steps.length-1?130:0));
 canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');
 c.fillStyle='#fffefa';c.fillRect(0,0,W,H);c.fillStyle='#2563eb';c.fillRect(0,0,W,9);
 c.font='bold 24px Arial';c.fillStyle='#3471b9';c.fillText('MATEMATİK AI  /  ÇÖZÜM',36,48);
 c.font='bold 36px Arial';c.fillStyle='#172d50';
 const questionBottom=flowText(c,solution.question,38,98,1035,43,4);
 const diagramTop=Math.max(215,questionBottom+12);
 let detailsTop=diagramTop+imageArea+24;
 function work(){c.strokeStyle='#c9ddf5';c.beginPath();c.moveTo(32,detailsTop);c.lineTo(1088,detailsTop);c.stroke();let y=detailsTop+47;
 items.forEach((s,i)=>{c.fillStyle=i===step?'#fff0cb':'#ebf4ff';c.fillRect(32,y-33,1052,9);c.fillStyle=i===step?'#a6680f':'#176bc1';c.font='bold 30px Arial';y=flowText(c,(i+1)+'. '+(s.title||'Çözüm'),45,y,1020,36,2)+11;c.fillStyle='#203853';c.font='30px Georgia';y=flowText(c,s.explanation,45,y,1010,42,14)+28});
 if(step===solution.steps.length-1){c.fillStyle='#e0faea';c.fillRect(29,H-95,1060,68);c.fillStyle='#14683e';c.font='bold 38px Arial';flowText(c,'SONUÇ: '+solution.answer,47,H-49,1010,36,1)}}
 if(drawDiagram(c,solution.diagram,95,diagramTop+16,650,imageArea-65)){c.fillStyle='#f1f7ff';c.fillRect(770,diagramTop+15,312,imageArea-50);c.font='bold 22px Arial';c.fillStyle='#225bab';c.fillText('ŞEKİL ÜZERİNDE',787,diagramTop+52);c.fillText('İŞLEMLER',787,diagramTop+82);c.font='22px Georgia';c.fillStyle='#194166';let ay=diagramTop+124;for(const s of items.slice(-3)){ay=flowText(c,s.title,787,ay,275,29,2)+12;ay=flowText(c,s.explanation,787,ay,275,29,3)+18;if(ay>detailsTop-70)break}work();return}
 // Geometri çizimi doğrulanamadığında şekli kaybetme: seçilen özgün bölgeyi beyaz sayfanın içine büyük yerleştir.
 const img=new Image();img.onload=()=>{c.fillStyle='#f7faff';c.fillRect(30,diagramTop,1060,imageArea-12);
 const factor=Math.min(1010/img.width,(imageArea-35)/img.height);const iw=img.width*factor,ih=img.height*factor;
 c.drawImage(img,(W-iw)/2,diagramTop+8+(imageArea-35-ih)/2,iw,ih);
 c.strokeStyle='#b9d0e9';c.strokeRect(30,diagramTop,1060,imageArea-12);work()};
 img.onerror=()=>{c.fillStyle='#9b6320';c.font='24px Arial';c.fillText('Soru görseli yüklenemedi.',42,diagramTop+70);work()};
 img.src=solution.cropImage||image;
}
render=function(){oldRender();if(!solution)return;const board=document.querySelector('.solution-board');if(!board)return;const label=document.createElement('p');label.className='visual-caption';label.textContent=solution.diagram?'Yeniden çizilen şekil ve çözüm işlemleri':'Seçilen soru görseli ve üzerine hazırlanan çözüm';const canvas=document.createElement('canvas');canvas.className='visual-sheet';canvas.setAttribute('aria-label','Yeni oluşturulan matematik sorusu ve adım adım çözüm görseli');board.insertBefore(label,board.firstChild);board.insertBefore(canvas,label.nextSibling);paint(canvas);const actions=document.createElement('div');actions.className='sheet-actions';const save=document.createElement('button');save.className='btn';save.textContent='Çözüm görselini kaydet';save.onclick=()=>{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='matematik-cozum.png';a.click()};actions.append(save);board.append(actions)};
})();