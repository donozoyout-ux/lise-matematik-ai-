import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const script=await readFile(new URL('../public/photo-upload.js',import.meta.url),'utf8');
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
function harness({dataUrl='data:image/jpeg;base64,abc',width=4000,height=3000}={}){
  const events={draws:0,revoked:0,read:0,encoded:0,dimensions:[]};
  const canvas={width:0,height:0,getContext:()=>({
    fillRect(){},set fillStyle(v){},drawImage(){events.draws++;events.dimensions.push([canvas.width,canvas.height])}
  }),toDataURL(){events.encoded++;return dataUrl}};
  const sandbox={
    document:{createElement:()=>canvas},
    URL:{createObjectURL:()=> 'blob:camera',revokeObjectURL:()=>{events.revoked++}},
    Image:class{naturalWidth=width;naturalHeight=height;set src(v){Promise.resolve().then(()=>this.onload?.())}},
    FileReader:class{readAsDataURL(){events.read++;this.result='data:image/png;base64,small';Promise.resolve().then(()=>this.onload?.())}}
  };
  sandbox.globalThis=sandbox;
  vm.runInNewContext(script,sandbox);
  return {prepare:sandbox.PhotoUpload.prepare,events};
}
test('mobile camera input requests rear camera',()=>{
  assert.match(html,/id="camera"[^>]*type="file"[^>]*accept="image\/\*"[^>]*capture="environment"/);
  assert.match(html,/<label[^>]*for="camera"[^>]*>📷 Kamerayla çek<\/label>/);
  assert.match(html,/\$\('camera'\)\.onchange=e=>accept\(e.target.files\[0\]\)/);
  assert.match(html,/PhotoUpload\.prepare\(f\)/);
  assert.match(html,/photo-upload\.js\?v=camera1/);
});
test('small gallery PNG stays lossless',async()=>{
  const {prepare,events}=harness();
  const value=await prepare({name:'soru.png',type:'image/png',size:30000});
  assert.equal(value,'data:image/png;base64,small');
  assert.equal(events.read,1);assert.equal(events.draws,0);
});
test('large camera JPEG is scaled and encoded below upload limit',async()=>{
  const {prepare,events}=harness();
  const value=await prepare({name:'camera.jpg',type:'image/jpeg',size:12*1024*1024});
  assert.equal(value,'data:image/jpeg;base64,abc');
  assert.equal(events.draws,1);assert.deepEqual(events.dimensions[0],[2600,1950]);assert.equal(events.revoked,1);
});
test('HEIC photo is transcoded where browser supports decoding',async()=>{
  const {prepare,events}=harness();
  const value=await prepare({name:'camera.heic',type:'image/heic',size:2*1024*1024});
  assert.equal(value,'data:image/jpeg;base64,abc');assert.equal(events.revoked,1);
});
test('large and invalid non-photo files fail clearly',async()=>{
  const {prepare}=harness();
  await assert.rejects(prepare({name:'fake.txt',type:'text/plain',size:100}),/fotoğraf/i);
  await assert.rejects(prepare({name:'huge.jpg',type:'image/jpeg',size:41*1024*1024}),/büyük/i);
});
test('same photo picker can be reset and used again',()=>{
  assert.match(html,/function reset\(\)\{photoRequest\+\+/);
  assert.match(html,/\$\('file'\)\.value='';\$\('camera'\)\.value=''/);
});
