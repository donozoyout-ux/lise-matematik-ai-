import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('../public/math-board.js',import.meta.url),'utf8');
function harness({width=1200,solution}){
 const drawn=[];
 const ctx={font:'24px Arial',fillStyle:'',strokeStyle:'',lineWidth:1,filter:'none',
  fillText:(s)=>drawn.push(String(s)),fillRect(){},drawImage(){},beginPath(){},
  moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},roundRect(){},save(){},restore(){},
  measureText(s){const px=Number(/(\d+)px/.exec(this.font)?.[1]||24);return {width:String(s).length*px*.53}}};
 function element(tag){return {tag,children:[],style:{},disabled:false,textContent:'',className:'',
  classList:{_enabled:false,toggle(){this._enabled=!this._enabled;return this._enabled}},
  append(...e){this.children.push(...e)},insertBefore(el,before){const i=this.children.indexOf(before);if(i<0)this.children.push(el);else this.children.splice(i,0,el)},
  setAttribute(){},getContext(){return ctx},toDataURL(){return 'data:image/png;base64,abc'}}}
 const board=element('section');
 class FakeImage{constructor(){this.width=640;this.height=480}set src(v){queueMicrotask(()=>this.onload?.())}}
 const sandbox={document:{createElement:element,head:{append(){}},querySelector:(q)=>q==='.solution-board'?board:null},window:{innerWidth:width},Image:FakeImage,solution,step:solution.steps.length-1,image:'data:image/png;base64,aGVsbG8=',render:()=>{},console};
 vm.runInNewContext(code,sandbox,{timeout:4000});
 sandbox.render();return {board,drawn};
}
const step={title:'Kenarları bul',formula:'300/500 = 3/5',explanation:'Hipotenüs 500 cm ve komşu kenar 300 cm'};
function triangle(title){return {title,points:[{id:'A',x:20,y:10},{id:'B',x:20,y:90},{id:'C',x:88,y:90}],segments:[{from:'A',to:'B'},{from:'B',to:'C'},{from:'A',to:'C'}],labels:[{text:'400 cm',x:5,y:55}]}}
const proof={status:'checked',message:'Aritmetik kontrol edildi'};
test('algebra board shows equation and result',()=>{const out=harness({solution:{kind:'algebra',question:'x=2 y=-1',answer:'1',working:['(2^2+(-1)^3)/(2-(-1))','3/3 = 1'],steps:[step],verification:proof}});assert.ok(out.drawn.some(t=>t.includes('DENKLEM')));assert.ok(out.drawn.some(t=>t.includes('SONUÇ: 1')));assert.ok(out.board.children.some(c=>c.tag==='canvas'))});
test('both ladder positions appear on desktop',()=>{const out=harness({solution:{kind:'geometry',question:'Bir merdiven iki konumda',answer:'72/35',diagrams:[triangle('1. Konum'),triangle('2. Konum')],steps:[step],verification:proof}});assert.ok(out.drawn.includes('1. Konum'));assert.ok(out.drawn.includes('2. Konum'))});
test('both geometry positions are preserved on mobile',()=>{const out=harness({width:390,solution:{kind:'geometry',question:'İki konum',answer:'1',diagrams:[triangle('1. Konum'),triangle('2. Konum')],steps:[step],verification:proof}});assert.equal(out.drawn.filter(x=>x.includes('Konum')).length,2);const canvas=out.board.children.find(c=>c.tag==='canvas');assert.equal(canvas.width,680)});

test('incomplete two-position diagram is not presented as full geometry',()=>{const out=harness({solution:{kind:'geometry',question:'1. konumda ve 2. konumda merdiven',answer:'72/35',diagrams:[triangle('1. Konum')],steps:[step],verification:proof}});assert.equal(out.drawn.includes('1. Konum'),false);assert.ok(out.drawn.some(t=>t.includes('İKİ KONUM TAM ÇİZİLEMEDİ')))});
