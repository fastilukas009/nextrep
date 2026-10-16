'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock, Dumbbell, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { elapsedSeconds, isTimedPrescription, sessionProgress, timerText, type WorkoutDraft } from './training';
import { exerciseGuides } from './video-guides';
import { VideoGuideLink } from './video-guide-link';

type Props = {
  draft: WorkoutDraft; open: boolean; busy: boolean; error: string;
  change: (draft: WorkoutDraft) => void; minimize: () => void;
  discard: () => void; save: (draft: WorkoutDraft, seconds: number) => void;
};
export function WorkoutSession({ draft, open, busy, error, change, minimize, discard, save }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [now, setNow] = useState(Date.now());
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [restLength, setRestLength] = useState(60);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  const progress = sessionProgress(draft.logs);
  const exercise = draft.logs[draft.current];
  const prescription = draft.program.exercises[draft.current][1];
  const seconds = elapsedSeconds(draft, now);
  const rest = restUntil ? Math.max(0, Math.ceil((restUntil - now) / 1000)) : 0;
  const guide = exerciseGuides[exercise.name];
  const isTimed = isTimedPrescription(prescription);
  const withWeight = !isTimed && guide?.tracking === 'strength';
  const countLabel = guide?.tracking === 'shots' ? 'Heittoyritykset' : 'Toistot';
  useEffect(() => { setRestLength(guide?.restSeconds ?? 60); setRestUntil(null); }, [draft.current, guide?.restSeconds]);
  function updateSet(index: number, patch: Partial<typeof exercise.sets[number]>) {
    change({ ...draft, logs: draft.logs.map((log, i) => i === draft.current ? {
      ...log, sets: log.sets.map((set, j) => j === index ? { ...set, ...patch } : set),
    } : log) });
    if (patch.done) setRestUntil(Date.now() + restLength * 1000);
  }
  function toggleTimer() {
    const at = Date.now();
    change({ ...draft, elapsed: elapsedSeconds(draft, at), runningSince: draft.runningSince === null ? at : null });
  }
  return <dialog ref={dialog} className="workout-dialog" aria-labelledby="workout-title" onCancel={event => { event.preventDefault(); minimize(); }}>
    <div className="session-header">
      <div><span className="eyebrow">TREENI KÄYNNISSÄ</span><h2 id="workout-title">{draft.program.title}</h2></div>
      <button className="icon-btn" onClick={minimize} aria-label="Pienennä harjoitus, edistyminen säilyy"><ChevronDown size={22}/></button>
    </div>
    <div className="session-meta"><span><Clock size={16}/>{timerText(seconds)}</span><button className="text-btn" onClick={toggleTimer}>{draft.runningSince === null ? <><Play size={15}/>Jatka ajastinta</> : <><Pause size={15}/>Tauko</>}</button><span>{progress.complete}/{progress.total} sarjaa</span></div>
    <div className="progress"><i style={{ width: `${progress.complete / progress.total * 100}%` }}/></div>
    <div className="exercise-tabs" aria-label="Harjoitteet">{draft.logs.map((log, index) => <button key={log.name} aria-current={index === draft.current ? 'step' : undefined} aria-label={`${index + 1}. ${log.name}`} className={`${index === draft.current ? 'selected' : ''} ${log.sets.every(set => set.done) ? 'completed' : ''}`} onClick={() => change({ ...draft, current: index })}>{log.sets.every(set => set.done) ? <Check size={16}/> : index + 1}</button>)}</div>
    <div className="exercise-title"><span className="eyebrow">HARJOITE {draft.current + 1} / {draft.logs.length}</span><h3>{exercise.name}</h3><p>{prescription} <span>· {isTimed ? 'Tee määrätty aika ja merkitse sarja valmiiksi.' : withWeight ? 'Paino on vapaaehtoinen. Kirjaa omat toistot.' : guide?.tracking === 'shots' ? 'Kirjaa yritykset. Hae levypallot itse.' : 'Kirjaa hallitut toistot.'}</span></p></div>
    {guide && <div className="session-instruction"><p>{guide.instruction}</p><small>Palautus sarjojen välissä: {guide.restSeconds} s{prescription.includes('/ puoli') ? ' · Tee molemmat puolet ennen sarjan merkitsemistä. Kirjaa määrä per puoli.' : ''}</small></div>}
    <VideoGuideLink guide={guide}/>
    <div className={`set-table ${isTimed ? 'timed' : withWeight ? '' : 'bodyweight'}`}>
      <div className="set-table-head"><span>Sarja</span>{withWeight && <span>Paino, kg</span>}{!isTimed && <span>{countLabel}</span>}<span>Valmis</span></div>
      {exercise.sets.map((set, index) => <div className={`set-row ${set.done ? 'is-done' : ''}`} key={index}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        {withWeight && <input aria-label={`${exercise.name}, sarja ${index + 1}, paino kilogrammoina`} type="number" inputMode="decimal" min="0" max="500" step="0.5" placeholder="—" value={set.weight} onChange={e => updateSet(index, { weight: e.target.value })}/>}
        {!isTimed && <input aria-label={`${exercise.name}, sarja ${index + 1}, ${countLabel.toLowerCase()}`} type="number" inputMode="numeric" min="0" max="500" placeholder="—" value={set.reps} onChange={e => updateSet(index, { reps: e.target.value })}/>}
        <button className="set-check" aria-pressed={set.done} aria-label={`${exercise.name}, sarja ${index + 1} ${set.done ? 'merkitty valmiiksi' : 'merkitse valmiiksi'}`} onClick={() => updateSet(index, { done: !set.done })}><Check size={21}/></button>
      </div>)}
    </div>
    <div className="rest-timer"><Timer size={20}/><div><strong>{restUntil === null ? 'Palautusajastin' : rest > 0 ? `Palautus ${timerText(rest)}` : 'Palautusaika päättyi'}</strong><small>Voit jatkaa oman tuntemuksen mukaan.</small></div><select aria-label="Palautusajan pituus" value={restLength} onChange={e => { setRestLength(Number(e.target.value)); if (rest > 0) setRestUntil(Date.now() + Number(e.target.value) * 1000); }}><option value="30">30 s</option><option value="45">45 s</option><option value="60">60 s</option><option value="90">90 s</option><option value="120">120 s</option><option value="180">180 s</option></select><button className="icon-btn" aria-label="Käynnistä palautusajastin uudelleen" onClick={() => setRestUntil(Date.now() + restLength * 1000)}><RotateCcw size={17}/></button></div>
    <div className="session-navigation"><button className="secondary" disabled={draft.current === 0} onClick={() => change({ ...draft, current: draft.current - 1 })}><ArrowLeft size={17}/>Edellinen</button>{draft.current < draft.logs.length - 1 && <button className="primary" onClick={() => change({ ...draft, current: draft.current + 1 })}>Seuraava harjoite<ArrowRight size={17}/></button>}</div>
    <details className="session-notes"><summary>Muistiinpanot ja oma fiilis</summary><label>Miltä harjoitus tuntui?<select value={draft.effort} onChange={e => change({ ...draft, effort: Number(e.target.value) })}><option value="0">Valitse halutessasi</option><option value="2">Kevyt</option><option value="5">Sopiva</option><option value="8">Raskas</option><option value="10">Erittäin raskas</option></select></label><label>Muistiinpanot<textarea maxLength={500} value={draft.notes} onChange={e => change({ ...draft, notes: e.target.value })} placeholder="Esim. viimeiseen sarjaan jäi hyvin varaa."/></label></details>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary full finish-workout" disabled={busy || !progress.finished} onClick={() => save(draft, elapsedSeconds(draft, Date.now()))}><Check size={19}/>{busy ? 'Tallennetaan…' : progress.finished ? 'Tallenna valmis treeni' : `Vielä ${progress.total - progress.complete} sarjaa jäljellä`}</button>
    <p className="tiny">Voit pienentää treenin ja palata siihen. Keskeneräinen treeni säilyy, kunnes lataat sivun uudelleen.</p>
    {confirmDiscard ? <div className="discard-confirm"><p>Poistetaanko keskeneräisen treenin kirjaukset?</p><button className="secondary" onClick={() => setConfirmDiscard(false)}>Jatka treeniä</button><button className="text-btn danger" onClick={discard}>Poista keskeneräinen treeni</button></div> : <button className="text-btn danger" disabled={busy} onClick={() => setConfirmDiscard(true)}><X size={15}/>Keskeytä treeni</button>}
  </dialog>;
}
