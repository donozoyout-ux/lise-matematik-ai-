// Exact, dependency-free arithmetic checker. Only a small, explicitly safe grammar is accepted.
const MAX_LENGTH = 180;
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const t=a%b;a=b;b=t}return a||1n}
function fraction(n,d=1n){if(d===0n)throw Error('Sıfıra bölme');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return {n:n/g,d:d/g}}
const add=(a,b)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
const neg=a=>fraction(-a.n,a.d);
const mul=(a,b)=>fraction(a.n*b.n,a.d*b.d);
const div=(a,b)=>fraction(a.n*b.d,a.d*b.n);
function decimal(token){const [whole,part='']=token.split('.');const scale=10n**BigInt(part.length);return fraction(BigInt(whole)*scale+BigInt(part||0),scale)}
export function evaluate(expression){
 if(typeof expression!=='string'||!expression.trim()||expression.length>MAX_LENGTH)throw Error('İfade çok uzun');
 const src=expression.replaceAll('−','-').replaceAll('×','*').replaceAll('÷','/').replaceAll('²','^2').replaceAll('³','^3').replace(/\s+/g,'');
 if(!/^[\d.+\-*/^()]+$/.test(src))throw Error('Desteklenmeyen matematik ifadesi');
 let i=0,ops=0;
 function limit(){if(++ops>180)throw Error('İfade çok karmaşık')}
 function primary(){limit();if(src[i]==='('){i++;const v=sum();if(src[i++]!==')')throw Error('Parantez kapanmadı');return v}const m=/^\d+(?:\.\d+)?/.exec(src.slice(i));if(!m)throw Error('Sayı bekleniyor');i+=m[0].length;return decimal(m[0])}
 function power(){let a=primary();if(src[i]==='^'){i++;const b=unary();if(b.d!==1n||b.n>12n||b.n< -12n)throw Error('Üs sınır dışında');if(b.n<0n)a=fraction(a.d**(-b.n),a.n**(-b.n));else a=fraction(a.n**b.n,a.d**b.n)}return a}
 function unary(){if(src[i]==='+'){i++;return unary()}if(src[i]==='-'){i++;return neg(unary())}return power()}
 function product(){let a=unary();while(src[i]==='*'||src[i]==='/'){const op=src[i++];const b=unary();a=op==='*'?mul(a,b):div(a,b)}return a}
 function sum(){let a=product();while(src[i]==='+'||src[i]==='-'){const op=src[i++];const b=product();a=op==='+'?add(a,b):add(a,neg(b))}return a}
 const result=sum();if(i!==src.length)throw Error('İfade tam okunamadı');
 if((result.n<0n?-result.n:result.n).toString().length>100||result.d.toString().length>100)throw Error('Sayı çok büyük');
 return result;
}
export function identical(a,b){return a.n===b.n&&a.d===b.d}
export function verification(answer,checks){
 if(!Array.isArray(checks)||!checks.length)return {status:'review',message:'Bağımsız aritmetik kanıt yok; sonuç kontrol edilmeli.',checked:0};
 let finalFound=false,checked=0;
 try{
  for(const check of checks.slice(0,12)){
   if(!check||typeof check.expression!=='string'||typeof check.expected!=='string')throw Error('Eksik kontrol');
   if(!identical(evaluate(check.expression),evaluate(check.expected)))throw Error('Ara işlem uyuşmuyor');
   checked++;
   if(check.final===true){finalFound=true;if(!identical(evaluate(check.expected),evaluate(String(answer))))throw Error('Sonuç ile aritmetik uyuşmuyor')}
  }
 }catch(e){return {status:'mismatch',message:'Matematik kontrolü başarısız: '+e.message,checked}}
 if(!finalFound)return {status:'review',message:'Ara hesaplar doğru, ancak nihai sonuç bağımsız doğrulanamadı.',checked};
 return {status:'checked',message:'Aritmetik kontrol edildi; görseldeki verilenler ayrıca doğrulanmalı.',checked};
}
