'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, BrainCircuit, Calculator, Camera, Check, ChevronLeft, ChevronRight, LoaderCircle, Pencil, Plus, RotateCcw, Sparkles, Trash2, TriangleAlert, Utensils, X } from 'lucide-react';
import { Modal } from './court-tools';
import { analyzeFoodPhoto, estimateFoodByGrams, foodProfiles, searchFoodProfiles, type FoodPrediction } from './food-ai';
import { MacroTargetEditor } from './macro-target-editor';
import { remainingText, targetProgress } from './macro-targets';
import { foodPresets, totals, type Entry, type MacroTargets, type Profile } from './model';

export type MealValues = { name: string; kcal: string; p: string; c: string; f: string };
const emptyMeal: MealValues = { name: '', kcal: '', p: '', c: '', f: '' };
const fromEntry = (entry: Entry): MealValues => ({ name: entry.data.name, kcal: String(entry.data.kcal), p: String(entry.data.p), c: String(entry.data.c), f: String(entry.data.f) });
export function mealPayload(meal: MealValues) { return { name: meal.name.trim(), kcal: Number(meal.kcal), p: Number(meal.p), c: Number(meal.c), f: Number(meal.f) }; }
const recentMeals = (entries: Entry[]): Entry[] => {
  const seen = new Set<string>();
  return entries.filter(entry => { if (entry.kind !== 'meal' || seen.has(entry.data.name)) return false; seen.add(entry.data.name); return true; }).slice(0, 5);
};

export function MealEditor({ entry, entries, busy, submit, close }: { entry?: Entry | null; entries: Entry[]; busy: boolean; submit: (data: ReturnType<typeof mealPayload>, id?: string) => Promise<boolean>; close: () => void }) {
  const [meal, setMeal] = useState<MealValues>(entry ? fromEntry(entry) : emptyMeal);
  const [mode, setMode] = useState<'photo' | 'manual' | 'ingredients' | 'recent'>(entry ? 'manual' : 'photo');
  const [ingredients, setIngredients] = useState<{ preset: number; grams: number }[]>([]);
  const [preset, setPreset] = useState(0), [grams, setGrams] = useState('100');
  const [photo, setPhoto] = useState(''), [error, setError] = useState('');
  const [aiRunning, setAiRunning] = useState(false), [aiProgress, setAiProgress] = useState(0), [aiStage, setAiStage] = useState('');
  const [predictions, setPredictions] = useState<FoodPrediction[]>([]), [selectedFood, setSelectedFood] = useState('');
  const [foodQuery, setFoodQuery] = useState(''), [portionGrams, setPortionGrams] = useState('');
  const [usedPhotoEstimate, setUsedPhotoEstimate] = useState(false);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);
  const sum = ingredients.reduce((a, item) => { const f = foodPresets[item.preset], factor = item.grams / 100; return { kcal: a.kcal + f.kcal * factor, p: a.p + f.p * factor, c: a.c + f.c * factor, f: a.f + f.f * factor }; }, { kcal: 0, p: 0, c: 0, f: 0 });
  const gramsValue = Number(portionGrams);
  const validGrams = Number.isInteger(gramsValue) && gramsValue >= 1 && gramsValue <= 3000;
  const aiEstimate = selectedFood && validGrams ? estimateFoodByGrams(selectedFood, gramsValue) : null;
  const foodMatches = searchFoodProfiles(foodQuery);
  const suggestedFood = predictions.find(item => item.label === selectedFood);
  function chooseFood(label: string) {
    setSelectedFood(label); setPortionGrams(String(foodProfiles[label].grams)); setFoodQuery(''); setError('');
  }
  async function runPhotoAi() {
    if (!photo) return;
    setAiRunning(true); setError(''); setPredictions([]); setAiProgress(0);
    try {
      const result = await analyzeFoodPhoto(photo, (progress, stage) => { setAiProgress(progress); setAiStage(stage); });
      setPredictions(result); chooseFood(result[0].label);
    } catch (e) { setError((e as Error).message); }
    finally { setAiRunning(false); }
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (await submit(mealPayload(meal), entry?.id)) close();
    else setError('Ateriaa ei saatu tallennettua. Tietosi säilyivät lomakkeella; kokeile uudelleen.');
  }
  return <Modal title={entry ? 'Muokkaa ateriaa' : 'Lisää ateria'} close={close}>
    <div className="segmented meal-modes" aria-label="Aterian lisäämistapa">{[['photo', 'Kuva-AI'], ['manual', 'Kirjaa'], ['ingredients', 'Annos'], ['recent', 'Aiemmat']].map(([id, label]) => <button key={id} aria-pressed={mode === id} className={mode === id ? 'selected' : ''} onClick={() => { setMode(id as typeof mode); setError(''); }}>{label}</button>)}</div>
    {mode === 'photo' && <div className="food-ai-panel">
      <div className="food-ai-intro"><span className="square-icon mint"><BrainCircuit size={21}/></span><div><strong>Makrot kuvasta AI:lla</strong><p>AI ehdottaa ruokalajia kuvasta. Annoksen makrot lasketaan valitun ruoan ja antamasi grammamäärän perusteella.</p></div></div>
      <label className={`photo-upload food-ai-upload ${photo ? 'has-photo' : ''}`}>{photo ? <><img src={photo} alt="Analysoitava ateria"/><span className="food-ai-replace">Vaihda kuva</span></> : <><Camera size={31}/><strong>Ota kuva tai valitse galleriasta</strong><span>Kuvaa koko annos suoraan ylhäältä tai 45° kulmasta.</span></>}<input type="file" aria-label={photo ? 'Vaihda ruokakuva' : 'Valitse ruokakuva'} accept="image/*" disabled={aiRunning} onChange={e => { const file = e.target.files?.[0]; if (file) { if (!file.type.startsWith('image/')) setError('Valitse kuvatiedosto.'); else if (file.size > 15 * 1024 * 1024) setError('Kuvan enimmäiskoko on 15 Mt.'); else { setPhoto(URL.createObjectURL(file)); setPredictions([]); setSelectedFood(''); setFoodQuery(''); setPortionGrams(''); setUsedPhotoEstimate(false); setError(''); } } e.target.value = ''; }}/></label>
      {photo && <button className="primary full food-ai-button" disabled={aiRunning} onClick={runPhotoAi}>{aiRunning ? <LoaderCircle className="spinner" size={18}/> : <Sparkles size={18}/>} {aiRunning ? 'AI analysoi…' : predictions.length ? 'Tunnista kuva uudelleen' : 'Tunnista ruokalaji'}</button>}
      {aiRunning && <div className="ai-progress" role="status"><div><strong>{aiStage || 'Valmistellaan AI:ta'}</strong><span>{aiProgress} %</span></div><div className="progress"><i style={{ width: `${aiProgress}%` }}/></div><small>Ensimmäisellä kerralla noin 60 Mt ruokamalli ladataan selaimeen. Seuraava analyysi on nopeampi.</small></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {photo && !aiRunning && <div className="food-ai-correction"><label>Väärä ruoka tai tunnistus ei toimi? Hae ruokalaji itse<input type="search" value={foodQuery} placeholder="Esim. pizza, lohi tai spagetti" onChange={e => setFoodQuery(e.target.value)}/></label>{foodQuery.trim().length >= 2 && <div className="food-ai-search-results" aria-label="Ruokalajit">{foodMatches.length ? foodMatches.map(item => <button key={item.label} onClick={() => chooseFood(item.label)}><span>{item.name}</span><small>Tyypillinen annos {item.grams} g</small></button>) : <p>Ruokalajia ei löydy. Kokoa ateria Annos-välilehdellä tai kirjaa arvot itse.</p>}</div>}</div>}
      {!!predictions.length && predictions[0].confidence < 50 && <p className="food-ai-uncertain" role="status">Tunnistus on epävarma. Tarkista ruoka ennen kuin käytät arviota.</p>}
      {!!predictions.length && <div className="food-ai-choices" aria-label="AI:n ehdottamat ruokalajit">{predictions.map(item => <button key={item.label} aria-pressed={selectedFood === item.label} className={selectedFood === item.label ? 'selected' : ''} onClick={() => chooseFood(item.label)}><strong>{item.name}</strong><span>{item.confidence} %</span></button>)}</div>}
      {selectedFood && <div className="food-ai-result">
        <div className="food-ai-result-head"><div><span className="eyebrow">ANNOSARVIO</span><h3>{foodProfiles[selectedFood].name}</h3></div><span className="ai-badge"><BrainCircuit size={15}/>{suggestedFood ? `${suggestedFood.confidence} %` : 'Valittu itse'}</span></div>
        <p className="tiny food-ai-model-note">AI:n prosentti koskee vain ruokalajin tunnistusta 101 vaihtoehdosta. Se ei kerro makroarvion tarkkuutta.</p>
        <div className="portion-control"><label htmlFor="food-ai-grams"><strong>Annoksen paino (g)</strong><input id="food-ai-grams" type="number" inputMode="numeric" min="1" max="3000" step="1" value={portionGrams} onChange={e => setPortionGrams(e.target.value)}/></label><p>Tyypillinen annos: {foodProfiles[selectedFood].grams} g. Kuvasta ei voi mitata painoa.</p><div className="food-ai-portions">{[[.25, '¼'], [.5, '½'], [1, '1'], [2, '2']].map(([factor, label]) => <button key={label} onClick={() => setPortionGrams(String(Math.round(foodProfiles[selectedFood].grams * Number(factor))))}>{label} annos{factor === 2 ? 'ta' : ''}</button>)}</div></div>
        {!validGrams && <p className="form-error" role="alert">Anna määrä väliltä 1–3000 grammaa.</p>}
        {aiEstimate && <div className="food-ai-macros"><div><span>Energia</span><strong>{aiEstimate.kcal}<small> kcal</small></strong></div><div><span>Proteiini</span><strong>{aiEstimate.p}<small> g</small></strong></div><div><span>Hiilihydraatit</span><strong>{aiEstimate.c}<small> g</small></strong></div><div><span>Rasva</span><strong>{aiEstimate.f}<small> g</small></strong></div></div>}
        <div className="food-ai-warning"><TriangleAlert size={18}/><p>Nämä ovat tyypillisen ruoan arvioita. Öljy, kastike, täytteet ja eri reseptit muuttavat makroja. Jos lautasella on monta erillistä ruokaa, kokoa annos raaka-aineista.</p></div>
        <button className="primary full" disabled={!aiEstimate} onClick={() => { if (!aiEstimate) return; setMeal({ name: aiEstimate.name, kcal: String(aiEstimate.kcal), p: String(aiEstimate.p), c: String(aiEstimate.c), f: String(aiEstimate.f) }); setUsedPhotoEstimate(true); setMode('manual'); setError(''); }}>Käytä arviota ja tarkista<ArrowRight size={17}/></button>
      </div>}
      {photo && <button className="text-btn food-ai-compose" onClick={() => { setMode('ingredients'); setError(''); }}>Useita ruokia lautasella? Kokoa annos raaka-aineista <ArrowRight size={16}/></button>}
      <p className="tiny food-ai-privacy">Kuva pysyy laitteellasi eikä sitä tallenneta tai lähetetä palvelimelle. AI-malli ladataan Hugging Facesta ja analyysi tehdään selaimessa.</p>
    </div>}
    {mode === 'recent' && <><p className="muted">Valitse aiempi ateria. Voit muuttaa määriä ennen tallennusta.</p>{recentMeals(entries).map(e => <button key={e.id} className="list-row clickable" onClick={() => { setMeal(fromEntry(e)); setUsedPhotoEstimate(false); setMode('manual'); }}><span className="square-icon"><RotateCcw size={18}/></span><span className="grow"><strong>{e.data.name}</strong><small>{e.data.kcal} kcal · P {e.data.p} g</small></span><ChevronRight size={18}/></button>)}{!recentMeals(entries).length && <div className="empty"><Utensils size={32}/><p>Ensimmäisen aterian jälkeen löydät sen täältä.</p><button className="secondary" onClick={() => setMode('manual')}>Kirjaa ensimmäinen ateria</button></div>}</>}
    {mode === 'ingredients' && <><p className="muted">Kokoa annos useasta raaka-aineesta. Arvot ovat arvioita; pakkauksen tiedot ovat tarkemmat.</p><label>Raaka-aine<select value={preset} onChange={e => setPreset(Number(e.target.value))}>{foodPresets.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}</select></label><div className="ingredient-add"><label>Määrä (g)<input type="number" inputMode="decimal" min="1" max="3000" value={grams} onChange={e => setGrams(e.target.value)}/></label><button className="secondary" disabled={ingredients.length >= 15} onClick={() => { const n = Number(grams); if (!Number.isFinite(n) || n < 1 || n > 3000) { setError('Anna määrä väliltä 1–3000 grammaa.'); return; } setIngredients([...ingredients, { preset, grams: n }]); setError(''); }}><Plus size={17}/>Lisää</button></div>
      {ingredients.map((item, i) => <div className="list-row" key={i}><div className="grow"><strong>{foodPresets[item.preset].name}</strong><small>{item.grams} g</small></div><span>{Math.round(foodPresets[item.preset].kcal * item.grams / 100)} kcal</span><button className="icon-btn" aria-label={`Poista ${foodPresets[item.preset].name}`} onClick={() => setIngredients(ingredients.filter((_, j) => i !== j))}><X size={17}/></button></div>)}
      <div className="ingredient-total"><strong>{Math.round(sum.kcal)} kcal</strong><span>P {Math.round(sum.p)} · H {Math.round(sum.c)} · R {Math.round(sum.f)} g</span></div><button className="primary full" disabled={!ingredients.length} onClick={() => { setMeal({ name: meal.name || ingredients.map(i => foodPresets[i.preset].name.split(',')[0]).join(' + ').slice(0, 80), kcal: String(Math.round(sum.kcal)), p: String(Math.round(sum.p * 10) / 10), c: String(Math.round(sum.c * 10) / 10), f: String(Math.round(sum.f * 10) / 10) }); setUsedPhotoEstimate(false); setMode('manual'); setError(''); }}>Käytä annoksen arvoja<ArrowRight size={17}/></button></>}
    {mode === 'manual' && <form onSubmit={onSubmit}><label>Aterian nimi<input autoFocus required maxLength={80} placeholder="Esim. kana-riisikulho" value={meal.name} onChange={e => setMeal({ ...meal, name: e.target.value })}/></label><div className="form-grid">{[['kcal', 'Energia', 'kcal'], ['p', 'Proteiini', 'g'], ['c', 'Hiilihydraatit', 'g'], ['f', 'Rasva', 'g']].map(([key, label, unit]) => <label key={key}>{label} ({unit})<input type="number" inputMode="decimal" required min="0" max={key === 'kcal' ? 10000 : key === 'c' ? 2000 : 1000} step={key === 'kcal' ? 1 : 0.1} placeholder="0" value={meal[key as keyof MealValues]} onChange={e => setMeal({ ...meal, [key]: e.target.value })}/></label>)}</div>{usedPhotoEstimate && <p className="ai-source-note"><BrainCircuit size={16}/>Arvot on esitäytetty kuva-AI:n arviosta. Muokkaa niitä tarvittaessa ennen tallennusta.</p>}<button disabled={busy} className="primary full"><Check size={18}/>{busy ? 'Tallennetaan…' : entry ? 'Tallenna muutokset' : 'Lisää päiväkirjaan'}</button></form>}
    {mode !== 'photo' && error && <p className="form-error" role="alert">{error}</p>}
  </Modal>;
}

export function FoodDiary({ entries, profile, day, busy, add, edit, repeat, remove, saveTargets }: { entries: Entry[]; profile: Profile; day: string; busy: boolean; add: () => void; edit: (entry: Entry) => void; repeat: (entry: Entry) => void; remove: (entry: Entry) => Promise<boolean>; saveTargets: (targets: MacroTargets) => Promise<boolean> }) {
  const [selected, setSelected] = useState(day);
  const [targetOpen, setTargetOpen] = useState(false);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const meals = entries.filter(e => e.kind === 'meal' && e.day === selected);
  const nutrition = totals(meals);
  function moveDay(offset: number) { const date = new Date(selected + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + offset); setSelected(date.toISOString().slice(0, 10)); }
  const target = profile.macroTargets;
  const macroRows = target ? [
    ['Energia', nutrition.kcal, target.kcal, 'kcal'],
    ['Proteiini', nutrition.p, target.p, 'g'],
    ['Hiilihydraatit', nutrition.c, target.c, 'g'],
    ['Rasva', nutrition.f, target.f, 'g'],
  ] as const : [];
  return <><div className="section-heading"><div><span className="eyebrow">RAVINTO</span><h1>Energiaa kentälle.</h1><p>Ateriat, päivän makrot ja oma tavoite yhdellä silmäyksellä.</p></div><div className="button-row"><button className="secondary" onClick={() => setTargetOpen(true)}><Calculator size={17}/>{target ? 'Muokkaa tavoitetta' : 'Aseta makrotavoite'}</button><button className="primary" onClick={add}><Plus size={18}/>Lisää {selected === day ? 'ateria' : 'ateria tänään'}</button></div></div>
    <div className="date-selector"><button className="icon-btn" aria-label="Edellinen päivä" onClick={() => moveDay(-1)}><ChevronLeft size={19}/></button><label className="date-input"><span>{selected === day ? 'Tänään' : 'Päiväkirjan päivä'}</span><input aria-label="Päiväkirjan päivä" type="date" value={selected} max={day} onChange={e => { if (e.target.value && e.target.value <= day) setSelected(e.target.value); }}/></label><button className="icon-btn" aria-label="Seuraava päivä" disabled={selected >= day} onClick={() => moveDay(1)}><ChevronRight size={19}/></button>{selected !== day && <button className="text-btn" onClick={() => setSelected(day)}>Tänään</button>}</div>
    <div className="nutrition-strip">{[['Energia', nutrition.kcal, 'kcal'], ['Proteiini', nutrition.p, 'g'], ['Hiilihydraatit', nutrition.c, 'g'], ['Rasva', nutrition.f, 'g']].map(([label, amount, unit], i) => <div key={String(label)} className={`nutrient nutrient-${i}`}><span>{label}</span><strong>{Math.round(Number(amount))}<small>{unit}</small></strong></div>)}</div>
    {target ? <section className="card macro-target-card"><div className="card-heading"><div><span className="eyebrow">PÄIVÄN ETENEMÄ</span><h2>{selected === day ? 'Tänään jäljellä' : 'Päivän tavoitevertailu'}</h2></div><button className="text-btn" onClick={() => setTargetOpen(true)}>Muokkaa</button></div><div className="macro-progress-grid">{macroRows.map(([label, value, goal, unit], index) => <div className={`macro-progress macro-progress-${index}`} key={label}><div><strong>{label}</strong><span>{remainingText(Number(value), Number(goal), unit)}</span></div><div className="progress"><i style={{ width: `${targetProgress(Number(value), Number(goal))}%` }}/></div><small>{Math.round(Number(value))} / {Math.round(Number(goal))} {unit}</small></div>)}</div></section> : <button className="card macro-empty-card" onClick={() => setTargetOpen(true)}><span className="square-icon mint"><Calculator size={21}/></span><span><strong>Laske päivän makrotavoite</strong><small>Aseta energia, proteiini ja rasva. Laskuri täydentää hiilihydraatit ja näyttää päivän jäljellä olevan määrän.</small></span><ArrowRight size={19}/></button>}
    <div className="two-col diary-columns"><section className="card"><div className="card-heading"><h2>Päivän ateriat</h2><span className="count-label">{meals.length} kirjausta</span></div>{meals.map(e => <div className="meal-row" key={e.id}><span className="square-icon"><Utensils size={20}/></span><div className="grow"><strong>{e.data.name}</strong><small>{new Date(e.at).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Helsinki' })} · P {e.data.p} / H {e.data.c} / R {e.data.f} g</small></div><strong>{e.data.kcal}<small>kcal</small></strong><div className="meal-actions"><button className="icon-btn" aria-label={`Muokkaa ateriaa ${e.data.name}`} onClick={() => edit(e)}><Pencil size={16}/></button><button className="icon-btn" disabled={busy} aria-label={`Poista ateria ${e.data.name}`} onClick={() => { setDeleting(e); setDeleteError(false); }}><Trash2 size={16}/></button></div></div>)}{!meals.length && <div className="empty"><div className="empty-icon"><Utensils size={27}/></div><h3>{selected === day ? 'Aloita yhdestä ateriasta.' : 'Ei kirjauksia tälle päivälle.'}</h3><p>{selected === day ? 'Kirjaa itse, laske annos tai käytä aiempaa ateriaa.' : 'Voit tarkastella toista päivää päivämäärävalitsimella.'}</p>{selected === day && <button className="secondary" onClick={add}><Plus size={17}/>Lisää ateria</button>}</div>}</section>
    <div className="stack"><section className="card"><span className="eyebrow">NOPEA LISÄYS</span><h2>Sama ateria uudestaan?</h2><p className="muted">Lisää viimeksi käyttämäsi annos tämän päivän päiväkirjaan.</p>{recentMeals(entries).length ? recentMeals(entries).slice(0, 3).map(e => <button className="list-row clickable" disabled={busy} key={e.id} onClick={() => repeat(e)}><span className="grow"><strong>{e.data.name}</strong><small>{e.data.kcal} kcal</small></span><Plus size={20}/></button>) : <p className="empty-inline">Aiemmat ateriasi ilmestyvät tähän.</p>}</section>
    <details className="card meal-ideas"><summary>Ateriaideoita päivään</summary>{[['AAMU', profile.diet === 'Maidoton' ? 'Kaurapuuro, marjat ja kananmuna' : 'Kaurapuuro, marjat ja jogurtti'], ['LOUNAS', profile.diet === 'Kasvis' ? 'Tofua, riisiä ja kasviksia' : 'Kanaa, riisiä ja kasviksia'], ['VÄLIPALA', 'Täysjyväleipä ja hedelmä'], ['ILTA', profile.diet === 'Kasvis' ? 'Linssipasta ja salaatti' : 'Kala, perunat ja salaatti']].map(([time, title]) => <div className="meal-idea" key={time}><small>{time}</small><strong>{title}</strong></div>)}<p className="tiny">Yleisiä ateriaideoita. Yksilölliset annoskoot suunnitellaan oman valmentajan kanssa.</p></details></div></div>
    {deleting && <Modal title="Poistetaanko ateria?" close={() => setDeleting(null)}><p>{deleting.data.name} poistetaan päiväkirjasta.</p>{deleteError && <p role="alert" className="form-error">Poisto ei onnistunut. Yritä uudelleen.</p>}<div className="button-row"><button className="secondary" onClick={() => setDeleting(null)}>Peruuta</button><button className="primary" disabled={busy} onClick={async () => { if (await remove(deleting)) setDeleting(null); else setDeleteError(true); }}>{busy ? 'Poistetaan…' : 'Poista ateria'}</button></div></Modal>}
    {targetOpen && <MacroTargetEditor current={target} busy={busy} close={() => setTargetOpen(false)} save={saveTargets}/>}
  </>;
}
