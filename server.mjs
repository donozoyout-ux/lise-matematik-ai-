import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||3000);
const model=process.env.GEMINI_MODEL||'gemini-2.5-flash-lite';
const limits=new Map();
const instruction='Sen Türkiye lise matematiği (9-12. sınıf) öğretmenisin. Görseli dikkatle oku. Emin olmadığın işaretleri belirt; uydurma. Soruyu Türkçe, pedagojik biçimde, kısa ve doğrulanabilir adımlarla çöz. Görselde birden çok soru varsa en belirginini çöz ve hangi soru olduğunu belirt. Çözüm adımlarına görselin üstüne yerleştirilebilecek yaklaşık konum koordinatları (x,y 0-100) ver. Bunlar yalnızca işaretleme önerisidir. Sadece JSON dön: {"question":"soru metni","answer":"sonuç","steps":[{"title":"başlık","explanation":"açıklama","x":50,"y":50}],"warning":"varsa belirsizlik yoksa boş"}. En fazla 8 adım.';
function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data));}
function gate(req){const ip=req.socket.remoteAddress||'unknown',now=Date.now(),old=limits.get(ip)||[];const next=old.filter(t=>now-t<60000);if(next.length>=12)return false;next.push(now);limits.set(ip,next);if(limits.size>3000)limits.clear();return true;}
async function body(req){let s='';for await(const part of req){s+=part;if(s.length>8_000_000)throw Error('İstek çok büyük (en fazla 5 MB görsel).');}return JSON.parse(s);}
function validImage(im){return typeof im==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(im)&&im.length<7_100_000;}
async function askGemini(messages, asJson=false){
 if(!process.env.GEMINI_API_KEY)throw Error('Sunucuda GEMINI_API_KEY tanımlanmadı.');
 const parts=[];for(const m of messages){if(Array.isArray(m.content)){for(const p of m.content){if(p.type==='text')parts.push({text:p.text});else if(p.type==='image_url'){const match=/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(p.image_url.url);if(!match)throw Error('Görsel biçimi geçersiz.');parts.push({inline_data:{mime_type:match[1],data:match[2]}})}}}else parts.push({text:(m.role==='assistant'?'Öğretmen: ':'Öğrenci: ')+m.content});}
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),70000);
 try{const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
 const r=await fetch(url,{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{temperature:0.2,...(asJson?{responseMimeType:'application/json'}:{})}})});
 const data=await r.json();if(!r.ok){if(r.status===429)throw Error('Ücretsiz Gemini kotası doldu. Daha sonra tekrar dene.');throw Error('Gemini API hatası: '+(data.error?.message||r.status));}
 return (data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
 }finally{clearTimeout(timer);}
}
const server=http.createServer(async(req,res)=>{try{
 if(req.method==='GET'&&(req.url==='/'||req.url==='/health')){if(req.url==='/health')return json(res,200,{ok:true});const html=await readFile(path.join(root,'public/index.html'));res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});return res.end(html);}
 if(req.method==='POST'&&(req.url==='/api/solve'||req.url==='/api/chat')){if(!gate(req))return json(res,429,{error:'Çok fazla istek. Biraz sonra tekrar dene.'});let b;try{b=await body(req);}catch(e){return json(res,400,{error:e.message||'Geçersiz veri.'});}if(!validImage(b.image))return json(res,400,{error:'JPG, PNG veya WebP görsel yükle (en fazla 5 MB).'});
 if(req.url==='/api/solve'){const messages=[{role:'system',content:instruction},{role:'user',content:[{type:'text',text:'Bu lise matematiği sorusunu oku ve çöz. Sadece JSON biçiminde yanıt ver.'},{type:'image_url',image_url:{url:b.image,detail:'high'}}]}];let raw=await askGemini(messages, true);let result;try{result=JSON.parse(raw);}catch{throw Error('AI çözümü yapılandırılamadı, yeniden dene.');}if(!result||typeof result.question!=='string'||!Array.isArray(result.steps)||!result.steps.length)throw Error('Çözüm adımları eksik. Tekrar dene.');return json(res,200,{question:result.question.slice(0,3000),answer:String(result.answer||'').slice(0,1000),warning:String(result.warning||'').slice(0,1000),steps:result.steps.slice(0,8).map(s=>({title:String(s.title||'Adım').slice(0,200),explanation:String(s.explanation||'').slice(0,2000),x:Math.max(4,Math.min(94,Number(s.x)||50)),y:Math.max(5,Math.min(90,Number(s.y)||50))}))});}
 if(typeof b.question!=='string'||!b.question.trim()||b.question.length>1000||typeof b.context!=='string'||b.context.length>12000)return json(res,400,{error:'Soru veya çözüm bilgisi geçersiz.'});const turns=Array.isArray(b.history)?b.history.slice(-6).filter(x=>['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,1500)})):[];const messages=[{role:'system',content:'Sen Türkçe lise matematik öğretmenisin. Verilen çözümü ve görseli esas al. Soruyu anlaşılır, doğruluğa önem vererek cevapla. Belirsizlik varsa belirt.'},{role:'user',content:[{type:'text',text:'Çözüm bağlamı: '+b.context},{type:'image_url',image_url:{url:b.image,detail:'high'}}]},...turns,{role:'user',content:b.question}];const reply=await askGemini(messages, false);return json(res,200,{reply:reply.slice(0,6000)});}
 return json(res,404,{error:'Bulunamadı.'});
 }catch(e){const msg=e.name==='AbortError'?'AI zaman aşımına uğradı.':e.message||'Beklenmeyen hata';json(res,500,{error:msg});}});
if(!process.env.NODE_TEST_CONTEXT && process.env.NODE_ENV!=='test')server.listen(port,()=>console.log('Matematik AI port '+port));
export {server,validImage};