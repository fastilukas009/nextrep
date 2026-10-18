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
const ai = moduleAt('app/ai-shot-analysis.ts');
const foodAi = moduleAt('app/food-ai.ts');
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
assert.equal(Object.keys(foodAi.foodProfiles).length, 101);
assert.equal(JSON.stringify(foodAi.scaleFoodEstimate('grilled_salmon', 1)), JSON.stringify({ label: 'grilled_salmon', name: 'Grillattu lohi', grams: 250, kcal: 520, p: 55, c: 4, f: 31 }));
assert.equal(foodAi.scaleFoodEstimate('pizza', 1.5).kcal, 1470);
assert.equal(foodAi.scaleFoodEstimate('pizza', 4).grams, 800, 'portion scaling is capped at 2×');
assert.throws(() => foodAi.scaleFoodEstimate('not_food', 1), /ravintoarviota/);
assert.equal(foodAi.estimateFoodByGrams('pizza', 100).kcal, 245, 'one pizza slice can be estimated without the old half-portion limit');
assert.equal(foodAi.estimateFoodByGrams('grilled_salmon', 125).p, 27.5);
assert.throws(() => foodAi.estimateFoodByGrams('pizza', 0), /1–3000/);
assert.throws(() => foodAi.estimateFoodByGrams('pizza', Number.NaN), /1–3000/);
assert.throws(() => foodAi.estimateFoodByGrams('pizza', 3001), /1–3000/);
assert.ok(foodAi.searchFoodProfiles('lohi').some(item => item.label === 'grilled_salmon'));
assert.ok(foodAi.searchFoodProfiles('creme').some(item => item.label === 'creme_brulee'));
assert.equal(foodAi.searchFoodProfiles('x').length, 0);

function poseFrame(index) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: .5, y: .5, z: 0, visibility: .98 }));
  landmarks[11] = { x: .44, y: .4, z: 0, visibility: .98 }; landmarks[12] = { x: .5, y: .4, z: 0, visibility: .98 };
  landmarks[23] = { x: .44, y: .62, z: 0, visibility: .98 }; landmarks[24] = { x: .5, y: .62, z: 0, visibility: .98 };
  landmarks[14] = { x: .52, y: .31, z: 0, visibility: .98 }; landmarks[16] = { x: .52, y: .26, z: 0, visibility: .98 };
  landmarks[26] = { x: .5, y: .78, z: 0, visibility: .98 }; landmarks[28] = { x: .5, y: .95, z: 0, visibility: .98 };
  if (index === 2) { landmarks[14] = { x: .6, y: .48, z: 0, visibility: .98 }; landmarks[16] = { x: .54, y: .57, z: 0, visibility: .98 }; landmarks[26] = { x: .62, y: .74, z: 0, visibility: .98 }; landmarks[28] = { x: .5, y: .84, z: 0, visibility: .98 }; }
  if (index === 9) { landmarks[14] = { x: .5, y: .28, z: 0, visibility: .98 }; landmarks[16] = { x: .5, y: .1, z: 0, visibility: .98 }; }
  return { time: index / 10, landmarks };
}
const aiResult = ai.analyzePoseFrames(Array.from({ length: 12 }, (_, index) => poseFrame(index)), 'right');
assert.ok(aiResult.confidence > 90);
assert.ok(aiResult.shotConfidence >= 80);
assert.equal(aiResult.releaseTime, .9);
assert.ok(aiResult.metrics.elbowExtension > 0);
assert.ok(aiResult.focus.title.length > 0);
assert.ok(aiResult.focus.drill.length > 0);
assert.ok(aiResult.pluses.length >= 4);
assert.ok(!Object.hasOwn(ai.savedAiAnalysis(aiResult), 'releasePose'));
assert.throws(() => ai.analyzePoseFrames(Array.from({ length: 12 }, (_, index) => ({ ...poseFrame(0), time: index / 10 })), 'right'), /selkeää heittoliikettä/);

function shiftedFrame(frame, dx) {
  return { ...frame, landmarks: frame.landmarks.map(point => ({ ...point, x: point.x + dx })) };
}
function defenderFrame(index) {
  const frame = poseFrame(0);
  frame.time = index / 10;
  if (index === 8) { frame.landmarks[14] = { x: .52, y: .3, z: 0, visibility: .98 }; frame.landmarks[16] = { x: .52, y: .18, z: 0, visibility: .98 }; }
  return frame;
}
const multiPlayerDetections = Array.from({ length: 12 }, (_, index) => {
  const shooter = shiftedFrame(poseFrame(index), -.22), defender = shiftedFrame(defenderFrame(index), .22);
  return { time: index / 10, poses: (index % 2 ? [defender, shooter] : [shooter, defender]).map(({ landmarks, worldLandmarks }) => ({ landmarks, worldLandmarks })) };
});
const automaticShooter = ai.selectShooterTrack(multiPlayerDetections, 'right');
assert.equal(automaticShooter.peopleDetected, 2);
assert.equal(automaticShooter.selection, 'auto');
assert.ok(automaticShooter.frames[0].landmarks[12].x < .4, 'automatic selection follows the shooter, not the defender');
const markedShooter = ai.selectShooterTrack(multiPlayerDetections, 'right', { x: .72, y: .5, time: .5 });
assert.equal(markedShooter.selection, 'manual');
assert.ok(markedShooter.frames[0].landmarks[12].x > .6, 'manual player marker selects the requested person');

const profile = validation.schemas.profile.parse({ ...model.defaultProfile, macroTargets: { kcal: 2500, p: 150, c: 306, f: 75 } });
assert.equal(profile.macroTargets.c, 306);
const review = validation.schemas.review.parse({ notes: '', checks: [true, false, true, false, true], angle: 88, duration: 12, measurements: [{ id: 'measurement-1', kind: 'elbow', angle: 88, time: 1.2, points: [{ x: .2, y: .2 }, { x: .3, y: .4 }, { x: .5, y: .3 }] }] });
assert.equal(review.measurements.length, 1);
assert.equal(validation.schemas.review.parse({ notes: '', checks: [], angle: null, ai: ai.savedAiAnalysis(aiResult) }).ai.confidence, aiResult.confidence);
assert.throws(() => validation.schemas.review.parse({ notes: '', checks: [], angle: 90, measurements: [{ id: 'bad', kind: 'elbow', angle: 90, time: 1, points: [{ x: 2, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }] }] }));

console.log('PASS: pose-AI feedback, jumpshot measurements, macro calculations and validation.');
