const instruction='Sen Türkiye lise matematiği (9-12. sınıf) öğretmenisin. Görseli dikkatle oku. Görselde okunamayan rakam, uzunluk veya açı varsa kesin sonuç verme; belirsizlik uyarısı yaz. Verilmeyen ölçüleri asla varsayma. Geometri sorularında çizimdeki ölçüleri, şekil ilişkilerini ve oranların pay/paydasını ayrı ayrı kontrol et. Her hesaplama adımını sonuca geri yerine koyarak doğrula. Doğrulayamadığın cevap için sonuç yerine Kontrol gerekli yaz. Emin olmadığın işaretleri belirt; uydurma. Soruyu Türkçe, pedagojik biçimde, kısa ve doğrulanabilir adımlarla çöz. Görselde birden çok soru varsa en belirginini çöz ve hangi soru olduğunu belirt. Çözüm adımlarına görselin üstüne yerleştirilebilecek yaklaşık konum koordinatları (x,y 0-100) ver. Bunlar yalnızca işaretleme önerisidir. Sadece JSON dön: {"question":"soru metni","answer":"sonuç","steps":[{"title":"başlık","explanation":"açıklama","x":50,"y":50}],"warning":"varsa belirsizlik yoksa boş"}. En fazla 8 adım. Ek olarak, yalnızca geometri figürünü emin biçimde okuyabiliyorsan diagram nesnesi döndür: {points:[{id:'A',x:40,y:10}],segments:[{from:'A',to:'B'}],labels:[{text:'13',x:50,y:35}]}. Buradaki x,y değerleri 0-100 arası temiz yeniden çizim koordinatlarıdır. Geometrik ilişki açıkça doğrulanamıyorsa diagram:null döndür; sayı ve kenar uydurma.';
function validImage(im){return typeof im==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(im)&&im.length<7_100_000;}
async function askGemini(messages, env, asJson=false){
 if(!env.GEMINI_API_KEY)throw Error('Sunucuda GEMINI_API_KEY tanımlanmadı.');
 const parts=[];for(const m of messages){if(Array.isArray(m.content)){for(const p of m.content){if(p.type==='text')parts.push({text:p.text});else if(p.type==='image_url'){const match=/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(p.image_url.url);if(!match)throw Error('Görsel biçimi geçersiz.');parts.push({inline_data:{mime_type:match[1],data:match[2]}})}}}else parts.push({text:(m.role==='assistant'?'Öğretmen: ':'Öğrenci: ')+m.content});}
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),70000);
 try{const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent((!env.GEMINI_MODEL||env.GEMINI_MODEL==='gemini-2.5-flash-lite')?'gemini-3.5-flash-lite':env.GEMINI_MODEL)+':generateContent';
 const r=await fetch(url,{method:'POST',headers:{'x-goog-api-key':env.GEMINI_API_KEY,'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{temperature:0.2,...(asJson?{responseMimeType:'application/json'}:{})}})});
 const data=await r.json();if(!r.ok){if(r.status===429)throw Error('Ücretsiz Gemini kotası doldu. Daha sonra tekrar dene.');throw Error('Gemini API hatası: '+(data.error?.message||r.status));}
 return (data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
 }finally{clearTimeout(timer);}
}
function sanitizeDiagram(d){if(!d||typeof d!=='object'||!Array.isArray(d.points)||d.points.length>24||d.points.length<2)return null;const clamp=n=>Math.max(3,Math.min(97,Number(n)||50));const points=d.points.filter(p=>p&&typeof p.id==='string').slice(0,24).map(p=>({id:p.id.slice(0,8),x:clamp(p.x),y:clamp(p.y)}));const ids=new Set(points.map(p=>p.id));const segments=(Array.isArray(d.segments)?d.segments:[]).slice(0,40).filter(s=>ids.has(s.from)&&ids.has(s.to)).map(s=>({from:s.from,to:s.to}));if(!segments.length)return null;const labels=(Array.isArray(d.labels)?d.labels:[]).slice(0,25).map(l=>({text:String(l.text||'').slice(0,18),x:clamp(l.x),y:clamp(l.y)}));return {points,segments,labels};}
const limits=new Map();
function response(status,data){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});}
function gate(request){const ip=request.headers.get('cf-connecting-ip')||'unknown',now=Date.now();const next=(limits.get(ip)||[]).filter(t=>now-t<60000);if(next.length>=12)return false;next.push(now);limits.set(ip,next);if(limits.size>3000)limits.clear();return true;}
export default {async fetch(request,env){
 const url=new URL(request.url),route=url.pathname;
 if(request.method==='GET'){if(route==='/health')return response(200,{ok:true});return env.ASSETS.fetch(request);}
 if(request.method!=='POST'||!['/api/solve','/api/chat'].includes(route))return response(404,{error:'Bulunamadı.'});
 if(!gate(request))return response(429,{error:'Çok fazla istek. Biraz sonra tekrar dene.'});
 try{
 const length=Number(request.headers.get('content-length')||0);if(length>8_000_000)return response(413,{error:'İstek çok büyük.'});
 const raw=await request.text();if(raw.length>8_000_000)return response(413,{error:'İstek çok büyük.'});
 let b;try{b=JSON.parse(raw)}catch{return response(400,{error:'Geçersiz JSON.'})}
 if(!validImage(b.image))return response(400,{error:'JPG, PNG veya WebP görsel yükle (en fazla 5 MB).'});
 if(route==='/api/solve'){
 const messages=[{role:'system',content:instruction},{role:'user',content:[{type:'text',text:'Bu lise matematiği sorusunu oku ve çöz. Sadece JSON biçiminde yanıt ver.'},{type:'image_url',image_url:{url:b.image,detail:'high'}}]}];
 const rawAnswer=await askGemini(messages,env,true);let result;try{result=JSON.parse(rawAnswer)}catch{return response(502,{error:'AI çözümü yapılandırılamadı, yeniden dene.'})}
 if(!result||typeof result.question!=='string'||!Array.isArray(result.steps)||!result.steps.length)return response(502,{error:'Çözüm adımları eksik. Tekrar dene.'});
 return response(200,{question:result.question.slice(0,3000),answer:String(result.answer||'').slice(0,1000),warning:String(result.warning||'').slice(0,1000),diagram:sanitizeDiagram(result.diagram),steps:result.steps.slice(0,8).map(s=>({title:String(s.title||'Adım').slice(0,200),explanation:String(s.explanation||'').slice(0,2000),x:Math.max(4,Math.min(94,Number(s.x)||50)),y:Math.max(5,Math.min(90,Number(s.y)||50))}))});
 }
 if(typeof b.question!=='string'||!b.question.trim()||b.question.length>1000||typeof b.context!=='string'||b.context.length>12000)return response(400,{error:'Soru veya çözüm bilgisi geçersiz.'});
 const turns=Array.isArray(b.history)?b.history.slice(-6).filter(x=>['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,1500)})):[];
 const messages=[{role:'system',content:'Sen Türkçe lise matematik öğretmenisin. Verilen çözümü ve görseli esas al. Soruyu anlaşılır, doğruluğa önem vererek cevapla. Belirsizlik varsa belirt.'},{role:'user',content:[{type:'text',text:'Çözüm bağlamı: '+b.context},{type:'image_url',image_url:{url:b.image,detail:'high'}}]},...turns,{role:'user',content:b.question}];
 const reply=await askGemini(messages,env,false);return response(200,{reply:reply.slice(0,6000)});
 }catch(e){return response(502,{error:e.name==='AbortError'?'AI zaman aşımına uğradı.':(e.message||'İstek başarısız.')});}
}};
