import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.mjs';

const image='data:image/png;base64,aGVsbG8=';
async function callAI(payload, body){
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(body)}]}}]}),{status:200,headers:{'content-type':'application/json'}});
 try{const response=await worker.fetch(new Request('https://example.test/api/solve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({image,...payload})}),{GEMINI_API_KEY:'dummy'});
 return {http:response.status,...await response.json()};
 }finally{globalThis.fetch=original}
}
const base={question:'x=2, y=-1, (x^2+y^3)/(x-y)',kind:'algebra',answer:'1',steps:[{title:'Hesapla',formula:'(4-1)/3 = 1',explanation:'Yerine koy.'}],working:['(2^2+(-1)^3)/(2-(-1))','3/3 = 1'],checks:[{expression:'(2^2+(-1)^3)/(2-(-1))',expected:'1',final:true}]};
test('numerical answer is verified and algebra lines are kept',async()=>{
 const out=await callAI({},base);assert.equal(out.http,200);assert.equal(out.verification.status,'checked');assert.equal(out.kind,'algebra');assert.equal(out.working.length,2);assert.equal(out.steps[0].formula,'(4-1)/3 = 1');
});
test('incorrect numeric proof suppresses answer',async()=>{
 const out=await callAI({},{...base,answer:'1/3'});assert.equal(out.verification.status,'mismatch');assert.equal(out.answer,'Kontrol gerekli');
});
test('two independent geometry positions are returned',async()=>{
 const diagram=id=>({title:id+'. Konum',points:[{id:'A',x:20,y:20},{id:'B',x:20,y:90},{id:'C',x:80,y:90}],segments:[{from:'A',to:'B'},{from:'B',to:'C'},{from:'A',to:'C'}],labels:[{text:'400 cm',x:9,y:50}]});
 const out=await callAI({},{...base,kind:'geometry',diagrams:[diagram('1'),diagram('2')]});
 assert.equal(out.diagrams.length,2);assert.equal(out.diagrams[0].title,'1. Konum');assert.equal(out.diagrams[1].title,'2. Konum');
});
test('unverified geometry returns a caution',async()=>{
 const out=await callAI({},{...base,kind:'geometry',checks:[]});assert.equal(out.verification.status,'review');assert.match(out.warning,/kontrol/i);
});
