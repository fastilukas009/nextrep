const fs = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function moduleAt(path, deps = {}) {
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: id => deps[id] || require(id), Date, Intl, crypto, console }, { filename: path });
  return module.exports;
}
const model = moduleAt('app/model.ts');
const validation = moduleAt('app/validation.ts', { './model': model });
const training = moduleAt('app/training.ts', { './model': model });
const guides = moduleAt('app/video-guides.ts');
const local = moduleAt('app/local-data.ts', { './model': model, './validation': validation });
const library = moduleAt('app/training-library.tsx', { './model': model });
const videoLink = moduleAt('app/video-guide-link.tsx');
const workout = moduleAt('app/workout-session.tsx', { './training': training, './video-guides': guides, './video-guide-link': videoLink });
const expectedAreas = ['strength','explosiveness','mobility','core','legs','arms','finishing','midrange','threepoint','passing','defense'];
assert.deepEqual(Array.from(new Set(model.programs.map(p => p.area))).sort(), expectedAreas.sort());
for (const goal of ['Heittotaito','Liikkuvuus','Voima','Kokonaisvaltainen kehitys']) {
  assert.deepEqual(Array.from(training.orderPrograms(goal), p => p.id).sort(), Array.from(model.programs, p => p.id).sort(), `Goal must not hide programs: ${goal}`);
}
let state = { version: 1, profile: model.defaultProfile, entries: [], owned: [] };
const payload = program => ({ program: program.id, sets: program.exercises.map(() => true), notes: '', duration: 900,
  logs: training.makeLogs(program).map(log => ({ name: log.name, sets: log.sets.map(set => ({ done: true, reps: set.reps ? Number(set.reps) : null, weight: null })) })) });
// Save and restore both old beta workouts and every new program through real storage validation.
for (const program of model.allPrograms) {
  const data = payload(program);
  assert.ok(validation.parseEntry('workout', data));
  state = local.applyLocalMutation(state, { action: 'entry', kind: 'workout', id: crypto.randomUUID(), data }, Date.parse('2026-10-16T12:00:00Z'));
}
const restored = local.parseBackup(JSON.stringify(state));
assert.equal(restored.entries.length, model.allPrograms.length);
assert.equal(local.snapshot(restored).xp, 100);
assert.throws(() => validation.parseEntry('workout', { ...payload(model.programs[0]), program: 'unknown' }));
const corrupt = payload(model.programs[0]); corrupt.logs[0].name = 'Wrong exercise';
assert.throws(() => validation.parseEntry('workout', corrupt), /sarjamerkinnät/);
const incomplete = payload(model.programs[0]); incomplete.logs[1].sets[0].done = false;
assert.throws(() => validation.parseEntry('workout', incomplete), /sarjamerkinnät/);
const unique = new Set();
for (const program of model.programs) {
  assert.ok(program.equipment && program.soloTip);
  assert.equal(new Set(program.exercises.map(([name]) => name)).size, program.exercises.length);
  const logs = training.makeLogs(program);
  for (const [i, [name, prescription]] of program.exercises.entries()) {
    const guide = guides.exerciseGuides[name];
    assert.ok(guide?.instruction && guide.channel, `Missing exercise guide: ${name}`);
    assert.ok(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}(?:&t=\d+s)?$/.test(guide.url), guide.url);
    unique.add(new URL(guide.url).searchParams.get('v'));
    assert.equal(training.isTimedPrescription(prescription), guide.tracking === 'time');
    if (guide.tracking === 'time') assert.ok(logs[i].sets.every(set => set.reps === ''), 'Seconds must not be saved as reps');
    const html = renderToStaticMarkup(React.createElement(workout.WorkoutSession, { draft: { id: 'test', program, logs, current: i, notes: '', effort: 0, elapsed: 0, runningSince: null }, open: false, busy: false, error: '', change() {}, minimize() {}, discard() {}, save() {} }));
    assert.ok(html.includes(guide.url.replaceAll('&', '&amp;')), `Guide missing from workout: ${name}`);
    assert.equal(html.includes('paino kilogrammoina'), guide.tracking === 'strength');
  }
}
for (const key of model.skills.map(s => s.id)) assert.ok(guides.skillGuides[key]);
for (const key of model.challenges.map(c => c.id)) assert.ok(guides.challengeGuides[key]);
for (const filter of ['all', ...expectedAreas]) {
  const html = renderToStaticMarkup(React.createElement(library.TrainingLibrary, { programs: model.programs, entries: [], filter, selectFilter() {}, goal: 'Voima', openProfile() {}, preview() {}, openSkills() {} }));
  assert.equal((html.match(/class="card training-card /g) || []).length, filter === 'all' ? 11 : 1);
}
console.log(`PASS: 11 areas, ${unique.size} workout videos, all workout views, filters, timed sets, old/new backup roundtrip and validation.`);
