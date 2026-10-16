const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const values = new Map();
let blocked = false, fetches = 0;
const localStorage = {
  getItem(key) { return values.get(key) ?? null; },
  setItem(key, value) { if (blocked) throw Error('QuotaExceededError'); values.set(key, value); },
};
function moduleAt(path, deps = {}, extra = {}) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: id => deps[id] || require(id), localStorage, Date, Intl, crypto, console, ...extra }, { filename: path });
  return module.exports;
}
const model = moduleAt('app/model.ts');
const validation = moduleAt('app/validation.ts', { './model': model });
const localDeps = { './model': model, './validation': validation };
const local = moduleAt('app/local-data.ts', localDeps);
const client = moduleAt('app/client-data.ts', { './local-data': local }, { __FASTREP_LOCAL__: true, fetch() { fetches++; throw Error('Unexpected network request'); } });
const entry = (kind, data) => ({ action: 'entry', id: crypto.randomUUID(), kind, data });
const workout = () => entry('workout', { program: 'foundation', sets: Array(6).fill(true), notes: 'Completed' });

(async () => {
  assert.equal((await client.readClientData()).entries.length, 0);
  const action = workout();
  assert.equal((await client.mutateClientData(action)).xp, 100);
  assert.equal((await client.mutateClientData(action)).entries.length, 1);
  assert.equal((await client.mutateClientData(workout())).xp, 100);
  // Reload the actual module against the same storage: no network or in-memory fake.
  const reloaded = moduleAt('app/local-data.ts', localDeps);
  assert.equal(reloaded.readLocalState().entries.length, 2);
  const saved = local.exportLocalData();
  blocked = true;
  await assert.rejects(() => client.mutateClientData(entry('skill', { skill: 'crossover' })), /Tallennus epäonnistui/);
  blocked = false;
  assert.equal(local.exportLocalData(), saved);
  await assert.rejects(() => client.mutateClientData({ action: 'buy', item: 'lime' }), /Kolikot/);
  await assert.rejects(() => client.mutateClientData({ action: 'profile', data: { ...model.defaultProfile, frame: 'lime' } }), /Hanki/);

  // Daily rewards use Helsinki midnight, even while it is still yesterday in UTC.
  let state = { version: 1, profile: model.defaultProfile, entries: [], owned: [] };
  for (const time of ['2026-10-15T20:59:00Z', '2026-10-15T21:01:00Z']) state = local.applyLocalMutation(state, workout(), Date.parse(time));
  assert.equal(local.snapshot(state).coins, 60);
  state = local.applyLocalMutation(state, { action: 'buy', item: 'lime' });
  assert.equal(local.snapshot(state).coins, 0);
  assert.throws(() => local.applyLocalMutation(state, { action: 'buy', item: 'lime' }), /Kolikot/);
  state = local.applyLocalMutation(state, { action: 'profile', data: { ...model.defaultProfile, name: 'Lukas', frame: 'lime' } });

  const meal = entry('meal', { name: 'Puuro', kcal: 400, p: 20, c: 50, f: 10 });
  state = local.applyLocalMutation(state, meal, Date.parse('2026-10-14T10:00:00Z'));
  const before = state.entries.find(e => e.id === meal.id);
  state = local.applyLocalMutation(state, { action: 'editMeal', id: meal.id, data: { ...meal.data, kcal: 500 } });
  const after = state.entries.find(e => e.id === meal.id);
  assert.equal(after.data.kcal, 500); assert.equal(after.at, before.at); assert.equal(after.day, before.day);
  assert.equal(before.data.kcal, 400); // reducer did not mutate previous records
  await local.restoreLocalData(JSON.stringify(state));
  assert.equal((await client.readClientData()).profile.name, 'Lukas');
  const backup = local.exportLocalData();
  await assert.rejects(() => local.restoreLocalData('{"version":9}'), /kelvollinen/);
  assert.equal(local.exportLocalData(), backup);
  assert.throws(() => local.parseBackup(JSON.stringify({ ...state, entries: [state.entries[0], state.entries[0]] })), /kelvollinen/);
  const incomplete = workout(); incomplete.data.sets[0] = false;
  await assert.rejects(() => client.mutateClientData(incomplete), /Kirjaa/);
  await assert.rejects(() => client.mutateClientData(entry('challenge', { challenge: 'free20', made: 21, attempts: 20 })), /heittojen/);
  await assert.rejects(() => client.mutateClientData({ action: 'roomCreate' }), /Live-kisat/);
  assert.equal(fetches, 0);
  values.set(local.STORAGE_KEY, 'broken-json');
  assert.throws(() => local.readLocalState(), /ei poistettu/);
  await assert.rejects(() => client.mutateClientData(workout()), /ei poistettu/);
  assert.equal(values.get(local.STORAGE_KEY), 'broken-json');
  await local.restoreLocalData(backup);
  assert.equal(local.readLocalState().profile.name, 'Lukas');
  console.log('PASS: Pages persistence/reload, no API calls, duplicate protection, daily rewards, purchases, meal edits, backups, corruption and storage failures.');
})().catch(error => { console.error(error); process.exitCode = 1; });
