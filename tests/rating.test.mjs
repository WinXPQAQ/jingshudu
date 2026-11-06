import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {solutions,hasOneBranchShortcut} from '../tools/verify-corpus.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('./rating-fixtures.json',import.meta.url)));
for(const f of fixtures)test(`binary threshold regression: ${f.label}`,()=>{assert.equal(solutions(f.puzzle),1);assert.equal(hasOneBranchShortcut(f.puzzle),Number(f.binaryFloor)<2);if(Number(f.finalTier)>=3)assert.equal(Number(f.binaryFloor),2);if(f.label==='demoted'){assert(Number(f.logicTier)>=3);assert.equal(Number(f.finalTier),2);}});
