'use client';
import { useEffect, useRef, useState } from 'react';
import { LOCAL_MODE, SignInRequired, readClientData, mutateClientData } from './client-data';
import { STORAGE_KEY } from './local-data';
import { LocalBackup } from './local-backup';
import { exerciseGuides, skillGuides, challengeGuides } from './video-guides';
import { VideoGuideLink } from './video-guide-link';
import { Activity, ArrowRight, ArrowUpRight, Check, ChevronRight, Clock, Coins, Crosshair, Dumbbell, Flame, Gift, Home, Info, LoaderCircle, Plus, Pencil, Settings, Target, Trophy, Utensils, X, Zap } from 'lucide-react';
import { defaultProfile, programs, skills, shop, totals, type AppData, type Entry } from './model';
import { Competition, Court, Modal, ShotStudio } from './court-tools';
import { FoodDiary, MealEditor } from './food-diary';
import { EntryRow, Progress, dayKey, entryTitle } from './progress';
import { WorkoutSession } from './workout-session';
import { TrainingLibrary } from './training-library';
import { makeLogs, orderPrograms, sessionProgress, type Program, type WorkoutDraft } from './training';

type Tab = 'home' | 'train' | 'court' | 'food' | 'progress';
type CourtView = 'challenge' | 'shot' | 'skills';
const tabs = [
  { id: 'home', label: 'Tänään', icon: Home },
  { id: 'train', label: 'Treenit', icon: Dumbbell },
  { id: 'court', label: 'Kenttä', icon: Target },
  { id: 'food', label: 'Ravinto', icon: Utensils },
  { id: 'progress', label: 'Kehitys', icon: Activity },
] as const;
const blank: AppData = { profile: defaultProfile, entries: [], xp: 0, coins: 0, owned: [] };

export default function Page() {
  const [tab, setTab] = useState<Tab>('home');
  const [courtView, setCourtView] = useState<CourtView>('challenge');
  const [rewardView, setRewardView] = useState(false);
  const [data, setData] = useState<AppData>(blank);
  const [loading, setLoading] = useState(true), [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(''), [auth, setAuth] = useState(false), [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(''), [clock, setClock] = useState(Date.now());
  const [profileOpen, setProfileOpen] = useState(false), [profile, setProfile] = useState(defaultProfile), [profileError, setProfileError] = useState('');
  const [mealOpen, setMealOpen] = useState(false), [mealEntry, setMealEntry] = useState<Entry | null>(null);
  const [preview, setPreview] = useState<Program | null>(null), [trainFilter, setTrainFilter] = useState('all');
  const [draft, setDraft] = useState<WorkoutDraft | null>(null), [workoutOpen, setWorkoutOpen] = useState(false), [workoutError, setWorkoutError] = useState('');
  const [activeSkill, setActiveSkill] = useState<(typeof skills)[number] | null>(null);
  const [detail, setDetail] = useState<Entry | null>(null);
  const mutation = useRef(false);
  const mealMutationId = useRef('');
  const notify = (message: string) => setToast(message);

  async function load() {
    setLoading(true);
    try {
      const result = await readClientData();
      setData(result); setProfile(result.profile); setError(''); setAuth(false); setLoaded(true);
    } catch (e) { setAuth(e instanceof SignInRequired); setError(e instanceof Error ? e.message : 'Yhteyttä ei saatu. Kokeile uudelleen.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    const timer = setInterval(() => setClock(Date.now()), 30000);
    const sync = () => {
      const [page, view] = window.location.hash.slice(1).split('/');
      if (tabs.some(t => t.id === page)) setTab(page as Tab); else setTab('home');
      if (page === 'court') setCourtView(['challenge', 'shot', 'skills'].includes(view) ? view as CourtView : 'challenge');
      if (page === 'progress') setRewardView(view === 'rewards');
    };
    const storageChanged = (event: StorageEvent) => { if (LOCAL_MODE && (event.key === STORAGE_KEY || event.key === null)) load(); };
    sync(); window.addEventListener('hashchange', sync); window.addEventListener('storage', storageChanged);
    return () => { clearInterval(timer); window.removeEventListener('hashchange', sync); window.removeEventListener('storage', storageChanged); };
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    if (!draft) return;
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [!!draft]);

  async function post(body: any) {
    if (mutation.current) throw Error('Edellistä kirjausta tallennetaan vielä.');
    mutation.current = true; setBusy(true);
    try {
      const result = await mutateClientData(body);
      if (result.profile) { setData(result); setProfile(result.profile); }
      return result;
    } finally { mutation.current = false; setBusy(false); }
  }
  async function save(kind: string, value: any) {
    try { await post({ action: 'entry', id: crypto.randomUUID(), kind, data: value }); return true; }
    catch (e) { notify(e instanceof Error ? e.message : 'Tallennus epäonnistui.'); return false; }
  }
  function nav(next: Tab, view?: string) {
    setTab(next);
    if (next === 'court') setCourtView(view as CourtView || 'challenge');
    if (next === 'progress') setRewardView(view === 'rewards');
    window.location.hash = next + (view ? '/' + view : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openProfile() { setProfile(data.profile); setProfileError(''); setProfileOpen(true); }
  function addMeal(entry?: Entry) { mealMutationId.current = crypto.randomUUID(); setMealEntry(entry || null); setMealOpen(true); }
  function startWorkout(program: Program) {
    if (draft) { setPreview(null); setWorkoutOpen(true); return; }
    setDraft({ id: crypto.randomUUID(), program, logs: makeLogs(program), current: 0, notes: '', effort: 0, elapsed: 0, runningSince: Date.now() });
    setWorkoutError(''); setPreview(null); setWorkoutOpen(true);
  }
  async function finishWorkout(session: WorkoutDraft, duration: number) {
    setWorkoutError('');
    if (session.logs.some(log => log.sets.some(set => (set.weight !== '' && (!Number.isFinite(Number(set.weight)) || Number(set.weight) < 0 || Number(set.weight) > 500)) || (set.reps !== '' && (!Number.isInteger(Number(set.reps)) || Number(set.reps) < 0 || Number(set.reps) > 500))))) {
      setWorkoutError('Tarkista kirjaukset: paino 0–500 kg ja toistot kokonaislukuna 0–500.'); return;
    }
    try {
      const result = await post({ action: 'entry', id: session.id, kind: 'workout', data: { program: session.program.id, sets: session.logs.map(log => log.sets.every(set => set.done)), logs: session.logs.map(log => ({ name: log.name, sets: log.sets.map(set => ({ done: set.done, weight: set.weight === '' ? null : Number(set.weight), reps: set.reps === '' ? null : Number(set.reps) })) })), notes: session.notes, duration: Math.min(duration, 86400), effort: session.effort || null } });
      const earned = result.xp - data.xp;
      setDraft(null); setWorkoutOpen(false); notify(earned ? `Treeni tallennettu. +${earned} XP — hyvä työ!` : 'Treeni tallennettu päiväkirjaan.');
    } catch (e) { setWorkoutError(e instanceof Error ? e.message : 'Tallennus epäonnistui. Yritä uudelleen.'); }
  }
  const day = dayKey(clock), today = data.entries.filter(e => e.day === day);
  const weekDays = Array.from({ length: 7 }, (_, i) => dayKey(clock - (6 - i) * 86400000));
  const weekEntries = data.entries.filter(e => weekDays.includes(e.day));
  const weekWorkouts = weekEntries.filter(e => e.kind === 'workout').length;
  const nutrition = totals(today), level = Math.floor(data.xp / 250) + 1;
  const frame = shop.find(item => item.id === data.profile.frame)?.color || '#c8f36b';
  const ordered = orderPrograms(data.profile.goal);
  const featured = ordered[0];
  const shots = data.entries.filter(e => e.kind === 'challenge');
  const attempts = shots.reduce((sum, e) => sum + e.data.attempts, 0), made = shots.reduce((sum, e) => sum + e.data.made, 0);
  const completedToday = today.some(e => e.kind === 'workout');
  const goalPercent = Math.min(100, weekWorkouts / data.profile.days * 100);
  const draftProgress = draft ? sessionProgress(draft.logs) : null;

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Siirry sisältöön</a>
    <aside className="sidebar"><button className="brand" onClick={() => nav('home')} aria-label="FastRep etusivu"><span className="brand-symbol">F<span>↗</span></span>FastRep<span className="brand-dot">.</span></button><div className="sidebar-label">OMA PELIKENTTÄSI</div><nav aria-label="Päänavigaatio">{tabs.map(t => <button key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => nav(t.id)}><t.icon size={21}/><span>{t.label}</span>{tab === t.id && <ChevronRight className="nav-chevron" size={16}/>}</button>)}</nav><div className="sidebar-bottom"><button className="level-card" onClick={() => nav('progress', 'rewards')}><div><span className="level-icon"><Zap size={18}/></span><strong>Taso {level}</strong><span>{data.xp % 250}/250 XP</span></div><div className="progress"><i style={{ width: `${data.xp % 250 / 2.5}%` }}/></div><p>Avaa palkinnot <ArrowUpRight size={14}/></p></button><button className="nav-item" onClick={openProfile}><Settings size={19}/>Oma profiili</button><div className="beta-label"><i/>FASTREP BETA<span>0.2</span></div></div></aside>
    <div className="main-shell"><header className="topbar"><button className="mobile-brand" onClick={() => nav('home')}>FastRep<span>.</span></button><div className="breadcrumb">Oma pelikenttä<ChevronRight size={14}/><strong>{tabs.find(t => t.id === tab)?.label}</strong></div><div className="topbar-right"><span className="today-date">{new Date(clock).toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Helsinki' })}</span><button className="coin-balance" onClick={() => nav('progress', 'rewards')} aria-label={`${data.coins} kolikkoa. Avaa palkinnot.`}><Coins size={17}/>{data.coins}</button><button className="avatar" style={{ borderColor: frame }} onClick={openProfile} aria-label="Oma profiili">{data.profile.name.slice(0, 2).toUpperCase()}</button></div></header>
    <main id="main-content" className={draft && !workoutOpen ? 'has-active-workout' : ''} tabIndex={-1}>
      {LOCAL_MODE && <div className="browser-note"><Info size={16}/><span>Tiedot tallentuvat tähän selaimeen.</span><button className="text-btn" onClick={openProfile}>Varmuuskopioi<ArrowRight size={15}/></button></div>}
      {error && <div className="error-banner" role="alert"><Info size={20}/><span>{error}</span>{!LOCAL_MODE && auth ? <a className="secondary" href="/signin-with-chatgpt?return_to=%2F" target="_top">Kirjaudu sisään</a> : <button className="secondary" onClick={load}>Yritä uudelleen</button>}</div>}
      {loading && !loaded ? <div className="loading-state" role="status"><LoaderCircle className="spinner" size={28}/><h2>Oma pelikenttäsi latautuu.</h2><p>Haetaan harjoitukset ja kirjaukset.</p><div className="skeleton-grid"><i/><i/><i/></div></div> : !loaded ? <div className="empty connection-empty"><Target size={42}/><h1>Oma treeni. Oma kehitys.</h1><p>{auth ? 'Kirjaudu, niin FastRep pitää harjoituksesi ja kirjauksesi tallessa.' : 'Tietoja ei juuri nyt saatu ladattua. Yritä uudelleen yllä olevasta painikkeesta.'}</p></div> : <>
      {tab === 'home' && <>
        <div className="section-heading home-heading"><div><span className="eyebrow">UUSI PÄIVÄ. UUSI TOISTO.</span><h1>{data.profile.name === 'Pelaaja' ? 'Sun peli. Sun kehitys.' : `Moi, ${data.profile.name}.`}</h1><p>{completedToday ? 'Päivän treeni on kirjattu. Anna myös palautumiselle aikaa.' : 'Kaikki valmiina seuraavaan harjoitukseen.'}</p></div><button className="secondary" onClick={openProfile}><Settings size={17}/>Oma tavoite</button></div>
        <div className="dashboard-top"><section className="hero"><div className="hero-copy"><span className="light-label"><i/>{draft ? 'JATKA SIITÄ MIHIN JÄIT' : 'VALMIINA TREENIIN'}</span><h2>{draft ? draft.program.title : featured.title}</h2><p>{draft ? `${draftProgress?.complete} / ${draftProgress?.total} sarjaa tehty. Treenisi odottaa sinua.` : featured.desc}</p><div className="hero-meta"><span><Clock size={16}/>{(draft?.program || featured).minutes} min</span><span><Dumbbell size={16}/>{(draft?.program || featured).exercises.length} harjoitetta</span></div><button className="lime-btn" onClick={() => draft ? setWorkoutOpen(true) : startWorkout(featured)}>{draft ? 'Jatka treeniä' : 'Aloita treeni'}<ArrowUpRight size={19}/></button>{!draft && <button className="hero-secondary" onClick={() => nav('train')}>Valitse toinen harjoitus<ChevronRight size={16}/></button>}</div><Court/></section>
        <section className="card weekly-target"><div className="card-heading"><span className="eyebrow">OMA VIIKKOTAVOITE</span><Flame size={20}/></div><div className="weekly-count"><strong>{weekWorkouts}</strong><span>/ {data.profile.days}<small>treeniä / 7 päivää</small></span></div><div className="progress"><i style={{ width: `${goalPercent}%` }}/></div><div className="week-dots">{weekDays.map((date, i) => { const active = weekEntries.some(e => e.day === date && e.kind !== 'meal'); return <div key={date} className={`${active ? 'done' : ''} ${i === 6 ? 'today' : ''}`} title={`${date}${active ? ': harjoiteltu' : ': ei harjoitusta'}`}><small>{new Date(date + 'T12:00:00Z').toLocaleDateString('fi-FI', { weekday: 'short' })}</small><span>{active ? <Check size={16}/> : '·'}</span></div>; })}</div><p>{weekWorkouts >= data.profile.days ? 'Viikkotavoite saavutettu.' : `${Math.max(0, data.profile.days - weekWorkouts)} treeniä omaan tavoitteeseen.`}</p><button className="text-btn" onClick={() => nav('progress')}>Katso oma kehitys<ArrowRight size={16}/></button></section></div>
        <div className="quick-actions"><button onClick={() => addMeal()}><span className="action-icon peach"><Utensils size={22}/></span><span><strong>Kirjaa ateria</strong><small>Päiväkirja ajan tasalle</small></span><Plus size={20}/></button><button onClick={() => nav('court', 'challenge')}><span className="action-icon mint"><Target size={23}/></span><span><strong>Heittohaaste</strong><small>20 heittoa. Oma ennätys.</small></span><ArrowUpRight size={20}/></button><button onClick={() => nav('court', 'shot')}><span className="action-icon lilac"><Crosshair size={22}/></span><span><strong>Katso heittosi</strong><small>Video ja omat havainnot</small></span><ArrowUpRight size={20}/></button></div>
        <div className="two-col home-lower"><section className="card"><div className="card-heading"><h2>Viimeisimmät suoritukset</h2><button className="text-btn" onClick={() => nav('progress')}>Päiväkirja<ArrowUpRight size={15}/></button></div>{data.entries.filter(e => e.kind !== 'meal').slice(0, 3).map(e => <EntryRow entry={e} key={e.id} open={setDetail}/>)}{!data.entries.some(e => e.kind !== 'meal') && <div className="empty home-empty"><div className="empty-icon"><Dumbbell size={27}/></div><h3>Ensimmäinen toisto aloittaa tarinan.</h3><p>Aloita harjoitus tai heittohaaste. Näet tuloksesi täällä.</p><button className="text-btn" onClick={() => nav('train')}>Tutustu harjoituksiin<ArrowRight size={16}/></button></div>}</section><section className="card fuel-card"><div className="card-heading"><h2>Ravinto tänään</h2><span className="square-icon peach"><Utensils size={19}/></span></div><div className="fuel-total"><strong>{Math.round(nutrition.kcal)}</strong><span>kcal kirjattu</span></div><div className="macro-grid">{[['Proteiini', nutrition.p], ['Hiilihydraatit', nutrition.c], ['Rasva', nutrition.f]].map(([label, amount], i) => <div key={String(label)}><span className={`macro-line line-${i}`}/><strong>{Math.round(Number(amount))}<small> g</small></strong><span>{label}</span></div>)}</div><button className="secondary full" onClick={() => nav('food')}>Avaa ruokapäiväkirja<ArrowRight size={16}/></button></section></div>
        <div className="home-bottomline"><span><Target size={18}/>{attempts ? `${Math.round(made / attempts * 100)} % osumia · ${attempts} kirjattua heittoa` : 'Heittotarkkuus alkaa ensimmäisestä haasteesta.'}</span><button className="text-btn" onClick={() => nav('progress', 'rewards')}><Zap size={17}/>Taso {level} · {data.xp} XP<ChevronRight size={16}/></button></div>
      </>}
      {tab === 'train' && <TrainingLibrary programs={ordered} entries={data.entries} filter={trainFilter} selectFilter={setTrainFilter} goal={data.profile.goal} openProfile={openProfile} preview={setPreview} openSkills={() => nav('court', 'skills')}/>}
      {tab === 'court' && <><div className="court-nav" aria-label="Kentän työkalut">{[['challenge', 'Haasteet', Trophy], ['shot', 'Heittovideo', Crosshair], ['skills', 'Koristaidot', Target]].map(([id, label, Icon]) => { const I = Icon as typeof Trophy; return <button key={String(id)} className={courtView === id ? 'selected' : ''} aria-pressed={courtView === id} onClick={() => nav('court', String(id))}><I size={19}/>{String(label)}</button>; })}</div>{courtView === 'challenge' && <Competition entries={data.entries} post={post} save={save} notify={notify} busy={busy}/>} {courtView === 'shot' && <ShotStudio save={save} notify={notify} busy={busy}/>} {courtView === 'skills' && <><div className="section-heading"><div><span className="eyebrow">KORISTAIDOT</span><h1>Ota seuraava liike haltuun.</h1><p>Selkeä harjoite. Rauhallinen aloitus. Lisää vauhtia hallinnan mukana.</p></div></div><div className="skills-grid">{skills.map((skill, i) => <button className="card skill-choice" key={skill.id} onClick={() => setActiveSkill(skill)}><span className="skill-number">0{i + 1}</span><span className="eyebrow">{skill.level}</span><h2>{skill.title}</h2><p>{skill.task}</p><span className="text-btn">Avaa ohje<ArrowRight size={17}/></span></button>)}</div><p className="tiny">Vaiheittaiset ohjeet ja YouTube-videot löytyvät harjoitteista. Liikkeiden automaattista videopalautetta ei vielä ole.</p></>}</>}
      {tab === 'food' && <FoodDiary entries={data.entries} profile={data.profile} day={day} busy={busy} add={() => addMeal()} edit={addMeal} repeat={async entry => { if (await save('meal', entry.data)) notify('Ateria lisätty tämän päivän päiväkirjaan.'); }} remove={async entry => { try { await post({ action: 'deleteMeal', id: entry.id }); notify('Ateria poistettu.'); return true; } catch (e) { notify((e as Error).message); return false; } }}/>}
      {tab === 'progress' && <Progress data={data} clock={clock} rewardView={rewardView} selectView={value => nav('progress', value ? 'rewards' : undefined)} post={post} notify={notify} busy={busy} openEntry={setDetail} start={() => nav('train')}/>}
      </>}
      <footer className="page-footer"><span>FastRep<span className="green">.</span><span className="muted">Yksi toisto kerrallaan.</span></span><span>BETA 0.2</span></footer>
    </main></div>
    <nav className="mobile-nav" aria-label="Mobiilin päänavigaatio">{tabs.map(t => <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} className={tab === t.id ? 'active' : ''} onClick={() => nav(t.id)}><t.icon size={22}/><span>{t.label}</span></button>)}</nav>
    {draft && !workoutOpen && <button className="resume-workout" onClick={() => setWorkoutOpen(true)}><span className="resume-icon"><Dumbbell size={21}/></span><span><strong>Jatka: {draft.program.title}</strong><small>{draftProgress?.complete}/{draftProgress?.total} sarjaa tehty</small></span><ArrowRight size={20}/></button>}
    {toast && !workoutOpen && <div className="toast" role="status"><Check size={19}/><span>{toast}</span><button aria-label="Sulje ilmoitus" onClick={() => setToast('')}><X size={17}/></button></div>}
    {draft && <WorkoutSession draft={draft} open={workoutOpen} change={setDraft} busy={busy} error={workoutError} minimize={() => setWorkoutOpen(false)} discard={() => { setDraft(null); setWorkoutOpen(false); }} save={finishWorkout}/>}
    {mealOpen && <MealEditor entry={mealEntry} entries={data.entries} busy={busy} close={() => setMealOpen(false)} submit={async (value, id) => { try { await post(id ? { action: 'editMeal', id, data: value } : { action: 'entry', id: mealMutationId.current, kind: 'meal', data: value }); notify(id ? 'Ateria päivitetty.' : 'Ateria lisätty.'); return true; } catch (e) { notify((e as Error).message); return false; } }}/>}
    {profileOpen && <Modal title="Oma profiili" close={() => setProfileOpen(false)}><p className="muted">Aseta oma tavoite. Voit muuttaa sitä milloin vain.</p><form onSubmit={async e => { e.preventDefault(); setProfileError(''); try { await post({ action: 'profile', data: profile }); setProfileOpen(false); notify('Profiili päivitetty.'); } catch (e) { setProfileError((e as Error).message); } }}><label>Pelaajanimi<input required maxLength={30} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}/></label><label>Harjoittelun painotus<select value={profile.goal} onChange={e => setProfile({ ...profile, goal: e.target.value })}>{['Kokonaisvaltainen kehitys', 'Voima', 'Heittotaito', 'Liikkuvuus'].map(goal => <option key={goal}>{goal}</option>)}</select></label><label>Oma tavoite: {profile.days} treeniä / 7 päivää<div className="day-picker">{[1, 2, 3, 4, 5, 6, 7].map(n => <button type="button" key={n} aria-label={`${n} harjoitusta viikossa`} aria-pressed={profile.days === n} className={profile.days === n ? 'selected' : ''} onClick={() => setProfile({ ...profile, days: n })}>{n}</button>)}</div></label><label>Ateriaideoiden valinta<select value={profile.diet} onChange={e => setProfile({ ...profile, diet: e.target.value })}>{['Kaikki', 'Kasvis', 'Maidoton'].map(diet => <option key={diet}>{diet}</option>)}</select></label><p className="tiny">Painotus järjestää harjoituspohjat. Se ei luo henkilökohtaista PT-ohjelmaa.</p>{profileError && <p className="form-error" role="alert">{profileError}</p>}<button disabled={busy} className="primary full">{busy ? 'Tallennetaan…' : 'Tallenna profiili'}<Check size={17}/></button></form>{LOCAL_MODE && <LocalBackup restored={result => { setData(result); setProfile(result.profile); setLoaded(true); setError(''); }}/>}</Modal>}
    {preview && <Modal title={preview.title} close={() => setPreview(null)}><div className="preview-meta"><span><Clock size={17}/>{preview.minutes} min</span><span>{preview.exercises.length} harjoitetta</span></div><p className="muted">{preview.desc}</p><div className="preview-equipment"><strong>Tarvitset</strong><p>{preview.equipment}</p><strong>Näin teet yksin</strong><p>{preview.soloTip}</p></div>{preview.exercises.map(([name, reps], i) => <div className="list-row" key={name}><span className="exercise-index">{String(i + 1).padStart(2, '0')}</span><div className="grow"><strong>{name}</strong><small>{reps}</small><p className="exercise-cue">{exerciseGuides[name]?.instruction}</p><VideoGuideLink compact guide={exerciseGuides[name]}/></div></div>)}<button className="primary full" onClick={() => startWorkout(preview)}>{draft ? 'Jatka keskeneräistä treeniä' : 'Aloita treeni'}<ArrowRight size={18}/></button>{draft && <p className="tiny">Sinulla on {draft.program.title} kesken. Viimeistele tai keskeytä se ensin.</p>}</Modal>}
    {activeSkill && <Modal title={activeSkill.title} message={toast} close={() => setActiveSkill(null)}><span className="pill">{activeSkill.level}</span>{activeSkill.steps.map((step, i) => <div className="skill-step" key={step}><span>{i + 1}</span><p>{step}</p></div>)}<div className="notice"><Clock size={18}/><p>{activeSkill.task}</p></div><VideoGuideLink guide={skillGuides[activeSkill.id]}/><button disabled={busy} className="primary full" onClick={async () => { if (await save('skill', { skill: activeSkill.id })) { setActiveSkill(null); notify('Taitoharjoitus tallennettu.'); } }}>Merkitse harjoitelluksi<Check size={18}/></button></Modal>}
    {detail && <Modal title={entryTitle(detail)} close={() => setDetail(null)}><p className="muted">{new Date(detail.at).toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' })}</p>{detail.kind === 'workout' && <><div className="preview-meta"><span><Clock size={17}/>{detail.data.duration ? `${Math.ceil(detail.data.duration / 60)} min` : 'Kestoa ei kirjattu'}</span><span>+{detail.xp} XP</span></div>{detail.data.logs ? detail.data.logs.map((log: any, i: number) => <div className="list-row" key={i}><Check size={18}/><div className="grow"><strong>{log.name}</strong><small>{log.sets.map((set: any) => [set.weight !== null ? `${set.weight} kg` : '', set.reps !== null ? `${set.reps} toistoa` : 'Tehty'].filter(Boolean).join(' × ')).join(' · ')}</small><VideoGuideLink compact guide={exerciseGuides[log.name]}/></div></div>) : <p>{detail.data.sets.length} harjoitetta kirjattu valmiiksi.</p>}{detail.data.effort && <p className="muted">Oma kuormitustuntemus: {detail.data.effort}/10</p>}</>}{detail.kind === 'challenge' && <div className="detail-score">{detail.data.made}<span> / {detail.data.attempts} osumaa</span></div>}{detail.kind === 'meal' && <><p>{detail.data.kcal} kcal · P {detail.data.p} / H {detail.data.c} / R {detail.data.f} g</p><button className="secondary" onClick={() => { const entry = detail; setDetail(null); addMeal(entry); }}><Pencil size={16}/>Muokkaa ateriaa</button></>}{detail.kind === 'review' && <><p>Mitattu 2D-kulma: {detail.data.angle === null ? 'Ei mittausta' : `${detail.data.angle}°`}</p>{['Tasapainoinen lähtöasento', 'Yhtenäinen liike kohti koria', 'Hallittu laskeutuminen'].map((label, i) => <div className="list-row" key={label}>{detail.data.checks[i] ? <Check size={18}/> : <span className="muted">—</span>}<span>{label}</span></div>)}</>}{detail.kind === 'skill' && <><p>Taitoharjoitus tehty. +{detail.xp} XP</p><VideoGuideLink guide={skillGuides[detail.data.skill]}/></>}{detail.kind === 'challenge' && <VideoGuideLink guide={challengeGuides[detail.data.challenge]}/>} {detail.data.notes && <blockquote className="entry-notes">{detail.data.notes}</blockquote>}</Modal>}
  </div>;
}
