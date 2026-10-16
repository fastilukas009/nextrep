import { mutateLocalData, readLocalState, snapshot } from './local-data';

declare const __FASTREP_LOCAL__: boolean;
export const LOCAL_MODE = typeof __FASTREP_LOCAL__ !== 'undefined' && __FASTREP_LOCAL__;
export class SignInRequired extends Error {}

async function serverRequest(body?: unknown) {
  const response = await fetch('/api/nextrep', body === undefined ? { cache: 'no-store' } : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (response.status === 401) throw new SignInRequired('Kirjaudu sisään, jotta näet oman päiväkirjasi.');
  const result: any = await response.json();
  if (!response.ok) throw Error(result.error || 'Tietojen tallennus tai lataus epäonnistui.');
  return result;
}
export async function readClientData() { return LOCAL_MODE ? snapshot(readLocalState()) : serverRequest(); }
export async function mutateClientData(body: unknown) { return LOCAL_MODE ? mutateLocalData(body) : serverRequest(body); }
