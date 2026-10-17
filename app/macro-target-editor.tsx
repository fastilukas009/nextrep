'use client';
import { useState } from 'react';
import { ArrowRight, Calculator } from 'lucide-react';
import { Modal } from './court-tools';
import { calculateCarbs, macroCalories } from './macro-targets';
import type { MacroTargets } from './model';

export function MacroTargetEditor({ current, busy, close, save }: { current?: MacroTargets; busy: boolean; close: () => void; save: (targets: MacroTargets) => Promise<boolean> }) {
  const [kcal, setKcal] = useState(String(current?.kcal || 2500));
  const [protein, setProtein] = useState(String(current?.p || 150));
  const [fat, setFat] = useState(String(current?.f || 75));
  const [error, setError] = useState('');
  const energy = Number(kcal), p = Number(protein), f = Number(fat);
  const carbs = calculateCarbs(energy, p, f);
  const targets = { kcal: energy, p, c: carbs, f };
  const allocated = p * 4 + f * 9;

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!Number.isFinite(energy) || energy < 500 || energy > 10000 || !Number.isFinite(p) || p < 0 || p > 1000 || !Number.isFinite(f) || f < 0 || f > 1000) { setError('Tarkista arvot: energia 500–10 000 kcal ja makrot 0–1 000 g.'); return; }
    if (allocated > energy) { setError('Proteiini ja rasva käyttävät enemmän energiaa kuin päivän kcal-tavoite. Pienennä niitä tai nosta energiatavoitetta.'); return; }
    if (await save(targets)) close(); else setError('Tavoitetta ei saatu tallennettua. Kokeile uudelleen.');
  }

  return <Modal title="Makrotavoitteen laskuri" close={close}>
    <div className="macro-calculator-intro"><span className="square-icon mint"><Calculator size={20}/></span><div><strong>Aseta oma päiväkohtainen tavoite</strong><p>Laskuri muuttaa proteiinin ja rasvan jälkeen jäljelle jäävän energian hiilihydraateiksi.</p></div></div>
    <form onSubmit={submit}><label>Päivän energia (kcal)<input autoFocus type="number" inputMode="numeric" min="500" max="10000" step="1" value={kcal} onChange={event => setKcal(event.target.value)}/></label><div className="form-grid"><label>Proteiini (g)<input type="number" inputMode="decimal" min="0" max="1000" step="1" value={protein} onChange={event => setProtein(event.target.value)}/></label><label>Rasva (g)<input type="number" inputMode="decimal" min="0" max="1000" step="1" value={fat} onChange={event => setFat(event.target.value)}/></label></div>
      <div className="calculated-target"><span>Laskettu hiilihydraatti</span><strong>{Number.isFinite(carbs) ? carbs : 0}<small> g</small></strong><p>P {Number.isFinite(p) ? p : 0} g × 4 + H {Number.isFinite(carbs) ? carbs : 0} g × 4 + R {Number.isFinite(f) ? f : 0} g × 9 = {Number.isFinite(macroCalories(targets)) ? macroCalories(targets) : 0} kcal</p></div>
      <p className="tiny">Tämä on matemaattinen laskuri, ei henkilökohtainen ravitsemussuositus. Säädä tavoite oman valmentajan tai ravitsemusammattilaisen kanssa.</p>{error && <p className="form-error" role="alert">{error}</p>}<button disabled={busy} className="primary full">{busy ? 'Tallennetaan…' : 'Tallenna makrotavoite'}<ArrowRight size={17}/></button></form>
  </Modal>;
}
