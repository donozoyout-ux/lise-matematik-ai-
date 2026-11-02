import {evaluate,identical} from './math-check.mjs';

const safeText = x => typeof x==='string'?x.trim():'';
const pretty = r => r.d===1n?r.n.toString():r.n.toString()+'/'+r.d.toString();
const okInt = x => typeof x==='string'&&/^\d{1,7}$/.test(x.trim())&&Number(x)>0;
function exactRoot(square) {
  if(square<0||square>10n**15n)return null;
  const n=BigInt(Math.floor(Math.sqrt(Number(square))));
  for(const r of [n-1n,n,n+1n])if(r>=0n&&r*r===square)return r;
  return null;
}
export function expectedFromEvidence(evidence){
  if(!evidence||typeof evidence!=='object')return null;
  try{
    if(evidence.type==='substitution'){
      const vars=evidence.variables;
      if(typeof evidence.expression!=='string'||evidence.expression.length>160||!vars||typeof vars!=='object'||Array.isArray(vars))return null;
      if(!Object.keys(vars).length||Object.keys(vars).length>6)return null;
      const expr=evidence.expression.replace(/[a-zA-Z]+/g,name=>{
        if(!/^[a-z]$/.test(name)||!Object.hasOwn(vars,name))throw Error('Bilinmeyen değişken');
        const num=String(vars[name]).trim();
        if(!/^-?\d{1,8}(?:\.\d{1,5})?$/.test(num))throw Error('Desteklenmeyen değer');
        return '('+num+')';
      });
      return {result:evaluate(expr),kind:'substitution',detail:'Sayılar yerine konularak hesaplandı'};
    }
    if(evidence.type==='ladder_two_positions'){
      const {height1,ground1,ground2,target}=evidence;
      if(target!=='cos_alpha_times_cot_theta'||![height1,ground1,ground2].every(okInt))return null;
      const h=BigInt(height1),g=BigInt(ground1),other=BigInt(ground2);
      const hyp=exactRoot(h*h+g*g);
      if(!hyp||hyp<=other)return null;
      const secondHeight=exactRoot(hyp*hyp-other*other);
      if(!secondHeight||secondHeight<=0n)return null;
      // cos(alpha) = ground1/hypotenuse, cot(theta) = ground2/second wall height.
      const result=evaluate('('+g.toString()+'/'+hyp.toString()+')*('+other.toString()+'/'+secondHeight.toString()+')');
      return {result,kind:'ladder_two_positions',detail:'İki merdiven konumu Pisagor ve trigonometrik oranlarla hesaplandı'};
    }
  }catch{return null}
  return null;
}
function equivalentNumber(a,b){
  try{return identical(evaluate(a),evaluate(b))}catch{return safeText(a).toLowerCase()===safeText(b).toLowerCase()}
}
export function assessSolution(draft,reader){
  if(!reader||reader.uncertain===true||!safeText(reader.answer)||!safeText(reader.question)){
    return {status:'mismatch',message:'Fotoğraftaki soru ikinci okumada net doğrulanamadı.',checked:0};
  }
  if(!equivalentNumber(String(draft.answer||''),reader.answer)){
    return {status:'mismatch',message:'İki bağımsız görsel okuması aynı sonuca ulaşmadı.',checked:0};
  }
  const expected=expectedFromEvidence(reader.evidence);
  if(expected){
    if(!equivalentNumber(String(draft.answer||''),pretty(expected.result)))return {status:'mismatch',message:'Bağımsız hesaplama cevabı doğrulamadı.',checked:0};
    return {status:'checked',message:expected.detail+'. Görseldeki değerler için ikinci okuma da aynı cevabı verdi.',checked:1};
  }
  return {status:'review',message:'İki AI okuması aynı cevabı verdi; bağımsız matematik kanıtı bulunamadı.',checked:0};
}
