import test from 'node:test';import assert from 'node:assert/strict';import {evaluate,identical,verification} from '../src/math-check.mjs';
test('fractions and negative powers',()=>{assert.ok(identical(evaluate('(2^2+(-1)^3)/(2-(-1))'),evaluate('1')));assert.ok(identical(evaluate('3/5 * (480/140)'),evaluate('72/35')));assert.ok(identical(evaluate('-2^2'),evaluate('-4')))});
test('catches incorrect answer',()=>{assert.equal(verification('16/13',[{expression:'16/13',expected:'16/13',final:true}]).status,'checked');assert.equal(verification('1/3',[{expression:'(4-1)/3',expected:'1',final:true}]).status,'mismatch')});
test('does not blindly approve unverified answers',()=>{assert.equal(verification('2',[]).status,'review');assert.equal(verification('1',[{expression:'2+2',expected:'4'}]).status,'review')});
test('rejects unsafe or invalid input',()=>{for(const x of ['process.exit()','1/0','99^99','2+()','2**3'])assert.throws(()=>evaluate(x))});
