const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');

function moduleAt(path, deps = {}) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: id => deps[id] || require(id), console }, { filename: path });
  return module.exports;
}

const model = moduleAt('app/model.ts');
const shot = moduleAt('app/shot-analysis.ts', { './model': model });
const macro = moduleAt('app/macro-targets.ts');
const validation = moduleAt('app/validation.ts', { './model': model });

assert.equal(shot.measureShotAngle([{ x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }], { w: 100, h: 100 }), 90);
assert.equal(shot.measureShotAngle([{ x: .1, y: .1 }, { x: .1, y: .1 }, { x: .5, y: .5 }], { w: 100, h: 100 }), null);
assert.equal(shot.formatShotTime(65.2), '1:05.20');
assert.match(shot.consistencyText([{ id: '1', kind: 'elbow', angle: 80, time: 1, points: [] }, { id: '2', kind: 'elbow', angle: 92, time: 2, points: [] }], 'elbow'), /12°/);

assert.equal(macro.calculateCarbs(2500, 150, 75), 306);
assert.equal(macro.macroCalories({ p: 150, c: 306, f: 75 }), 2499);
assert.equal(macro.targetProgress(1250, 2500), 50);
assert.equal(macro.targetProgress(3000, 2500), 100);
assert.equal(macro.remainingText(2400, 2500, 'kcal'), '100 kcal jäljellä');
assert.equal(macro.remainingText(2600, 2500, 'kcal'), '100 kcal yli');

const profile = validation.schemas.profile.parse({ ...model.defaultProfile, macroTargets: { kcal: 2500, p: 150, c: 306, f: 75 } });
assert.equal(profile.macroTargets.c, 306);
const review = validation.schemas.review.parse({ notes: '', checks: [true, false, true, false, true], angle: 88, duration: 12, measurements: [{ id: 'measurement-1', kind: 'elbow', angle: 88, time: 1.2, points: [{ x: .2, y: .2 }, { x: .3, y: .4 }, { x: .5, y: .3 }] }] });
assert.equal(review.measurements.length, 1);
assert.throws(() => validation.schemas.review.parse({ notes: '', checks: [], angle: 90, measurements: [{ id: 'bad', kind: 'elbow', angle: 90, time: 1, points: [{ x: 2, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }] }] }));

console.log('PASS: jumpshot measurements, macro calculations and validation.');
