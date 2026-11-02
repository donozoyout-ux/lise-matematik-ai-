import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedFromEvidence,assessSolution} from '../src/evidence-check.mjs';
test('substituted fraction is calculated independently',()=>{
 const evidence={type:'substitution',expression:'(x^2+y^3)/(x-y)',variables:{x:'2',y:'-1'}};
 const expected=expectedFromEvidence(evidence);assert.equal(expected.result.n,1n);assert.equal(expected.result.d,1n);
 assert.equal(assessSolution({answer:'1'},{answer:'1',question:'x=2, y=-1',evidence}).status,'checked');
 assert.equal(assessSolution({answer:'1/3'},{answer:'1/3',question:'x=2, y=-1',evidence}).status,'mismatch');
});
test('two ladder locations are calculated by Pythagoras',()=>{
 const evidence={type:'ladder_two_positions',height1:'400',ground1:'300',ground2:'480',target:'cos_alpha_times_cot_theta'};
 const r=expectedFromEvidence(evidence);assert.equal(r.result.n,72n);assert.equal(r.result.d,35n);
 assert.equal(assessSolution({answer:'72/35'},{answer:'72/35',question:'merdiven',evidence}).status,'checked');
 assert.equal(assessSolution({answer:'16/25'},{answer:'16/25',question:'merdiven',evidence}).status,'mismatch');
});
test('invalid geometric data are not claimed proven',()=>{
 for(const evidence of [{type:'ladder_two_positions',height1:'400',ground1:'300',ground2:'600',target:'cos_alpha_times_cot_theta'},{type:'ladder_two_positions',height1:'400',ground1:'300',ground2:'480',target:'tan_alpha'}, {type:'substitution',expression:'process.exit()',variables:{x:'2'}}])assert.equal(expectedFromEvidence(evidence),null);
});
test('independent disagreement blocks an answer',()=>{
 assert.equal(assessSolution({answer:'1'},{question:'expr',answer:'2',evidence:null}).status,'mismatch');
 assert.equal(assessSolution({answer:'1'},{question:'expr',answer:'1',uncertain:true}).status,'mismatch');
 assert.equal(assessSolution({answer:'x'},{question:'expr',answer:'x',evidence:null}).status,'review');
});

test('disagreement in image numbers cannot be certified',()=>{
 const a={kind:'algebra',question:'x=2, y=-1',answer:'1'};
 const b={kind:'algebra',question:'x=3, y=-1',answer:'1',evidence:{type:'none'}};
 assert.equal(assessSolution(a,b).status,'mismatch');
});
