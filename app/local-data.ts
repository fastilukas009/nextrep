import { z } from 'zod';
import { defaultProfile, shop, type AppData, type Entry, type Profile } from './model';
import { parseEntry, schemas, type EntryKind } from './validation';

export const STORAGE_KEY = 'fastrep.nextrep.browser.v1';
const kindSchema = z.enum(['workout', 'skill', 'meal', 'challenge', 'review']);
const rewards: Record<EntryKind, [number, number]> = { workout: [100, 30], skill: [30, 10], meal: [0, 0], challenge: [50, 15], review: [20, 0] };
export type LocalState = { version: 1; profile: Profile; entries: Entry[]; owned: string[] };
const dayAt = (at: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(at);
const entrySchema = z.object({
  id: z.string().uuid(), kind: kindSchema, day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  at: z.number().int().min(0).max(8640000000000000), data: z.record(z.unknown()),
  xp: z.number().int().min(0).max(100), coins: z.number().int().min(0).max(30),
});
const stateSchema = z.object({ version: z.literal(1), profile: schemas.profile, entries: z.array(entrySchema).max(20000), owned: z.array(z.enum(['lime', 'orange', 'purple'])).max(3) });

export function snapshot(state: LocalState): AppData {
  const spent = state.owned.reduce((sum, id) => sum + shop.find(item => item.id === id)!.cost, 0);
  return { profile: { ...state.profile }, entries: [...state.entries].sort((a, b) => b.at - a.at).slice(0, 300),
    xp: state.entries.reduce((sum, entry) => sum + entry.xp, 0),
    coins: state.entries.reduce((sum, entry) => sum + entry.coins, 0) - spent, owned: [...state.owned] };
}

export function parseBackup(text: string): LocalState {
  if (text.length > 8 * 1024 * 1024) throw Error('Varmuuskopio on liian suuri (enintään 8 Mt).');
  try {
    const state = stateSchema.parse(JSON.parse(text));
    const ids = new Set<string>(), rewarded = new Set<string>();
    for (const entry of state.entries) {
      if (ids.has(entry.id) || entry.day !== dayAt(entry.at)) throw Error();
      ids.add(entry.id);
      entry.data = parseEntry(entry.kind, entry.data);
      const [xp, coins] = rewards[entry.kind];
      if (entry.xp || entry.coins) {
        const key = entry.kind + ':' + entry.day;
        if (entry.xp !== xp || entry.coins !== coins || rewarded.has(key)) throw Error();
        rewarded.add(key);
      }
    }
    if (new Set(state.owned).size !== state.owned.length || snapshot(state).coins < 0 || (state.profile.frame !== 'default' && !state.owned.some(id => id === state.profile.frame))) throw Error();
    return state;
  } catch { throw Error('Tiedosto ei ole kelvollinen FastRep-varmuuskopio. Nykyisiä tietoja ei muutettu.'); }
}

export function readLocalState(): LocalState {
  let raw: string | null;
  try { raw = localStorage.getItem(STORAGE_KEY); }
  catch { throw Error('Selaimen tallennustila ei ole käytettävissä. Salli sivustotietojen tallennus ja yritä uudelleen.'); }
  if (raw === null) return { version: 1, profile: { ...defaultProfile }, entries: [], owned: [] };
  try { return parseBackup(raw); }
  catch { throw Error('Tallennettuja tietoja ei voitu lukea. Niitä ei poistettu. Voit palauttaa varmuuskopion Oma profiili -valikossa.'); }
}
function persist(state: LocalState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { throw Error('Tallennus epäonnistui: selaimen tila on täynnä tai tallennus estettiin. Lataa aiempien tietojen varmuuskopio profiilista.'); }
  return snapshot(state);
}

export function applyLocalMutation(state: LocalState, body: any, now = Date.now()): LocalState {
  const next: LocalState = { ...state, entries: [...state.entries], owned: [...state.owned] };
  try {
    if (body.action === 'profile') {
      const profile = schemas.profile.parse(body.data);
      if (profile.frame !== 'default' && !next.owned.includes(profile.frame)) throw Error('Hanki kehys ensin kaupasta.');
      next.profile = profile;
    } else if (body.action === 'entry') {
      const id = z.string().uuid().parse(body.id), kind = kindSchema.parse(body.kind);
      const data = parseEntry(kind, body.data);
      if (next.entries.some(entry => entry.id === id)) return next;
      if (next.entries.length >= 20000) throw Error('Päiväkirja on täynnä. Lataa varmuuskopio ennen vanhojen aterioiden poistamista.');
      const day = dayAt(now), repeat = next.entries.some(entry => entry.kind === kind && entry.day === day);
      const [xp, coins] = repeat ? [0, 0] : rewards[kind];
      next.entries.push({ id, kind, day, at: now, data, xp, coins });
    } else if (body.action === 'editMeal' || body.action === 'deleteMeal') {
      const id = z.string().uuid().parse(body.id), index = next.entries.findIndex(entry => entry.id === id && entry.kind === 'meal');
      if (index < 0) throw Error('Ateriaa ei löytynyt.');
      if (body.action === 'editMeal') next.entries[index] = { ...next.entries[index], data: schemas.meal.parse(body.data) };
      else next.entries.splice(index, 1);
    } else if (body.action === 'buy') {
      const item = shop.find(item => item.id === body.item);
      if (!item) throw Error('Tuotetta ei löytynyt.');
      if (next.owned.includes(item.id) || snapshot(next).coins < item.cost) throw Error('Kolikot eivät riitä tai omistat jo tämän.');
      next.owned.push(item.id);
    } else if (String(body.action).startsWith('room')) throw Error('Live-kisat tarvitsevat yhteisen palvelimen eivätkä ole käytössä tässä versiossa.');
    else throw Error('Tuntematon toiminto.');
    return next;
  } catch (error) {
    if (error instanceof z.ZodError) throw Error('Tarkista lomakkeen tiedot.');
    throw error;
  }
}

async function withStorageLock<T>(operation: () => T): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(STORAGE_KEY, operation);
  return operation();
}
export async function mutateLocalData(body: unknown) {
  return withStorageLock(() => persist(applyLocalMutation(readLocalState(), body)));
}
export function exportLocalData() { return JSON.stringify(readLocalState(), null, 2); }
export async function restoreLocalData(text: string) {
  const state = parseBackup(text);
  return withStorageLock(() => persist(state));
}
