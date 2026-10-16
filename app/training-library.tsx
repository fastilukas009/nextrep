'use client';
import { Activity, ArrowRight, ChevronRight, Dumbbell, Info, Target, Zap } from 'lucide-react';
import { trainingAreas, type Entry } from './model';
import type { Program } from './training';

type Props = {
  programs: Program[]; entries: Entry[]; filter: string; selectFilter: (id: string) => void;
  goal: string; openProfile: () => void; preview: (program: Program) => void; openSkills: () => void;
};
export function TrainingLibrary({ programs, entries, filter, selectFilter, goal, openProfile, preview, openSkills }: Props) {
  const visible = programs.filter(p => filter === 'all' || p.area === filter);
  return <>
    <div className="section-heading"><div><span className="eyebrow">11 TREENIALUETTA · YKSIN TEHTÄVÄT HARJOITUKSET</span><h1>Valitse päivän suunta.</h1><p>Voimaa salilla ja pelitaitoja kentällä. Välineet ja suoritusohjeet jokaisessa treenissä.</p></div><button className="secondary" onClick={openProfile}>Tavoite: {goal}<ChevronRight size={17}/></button></div>
    <div className="training-intro"><div><span className="pill"><Target size={14}/> Kaikki treenit yksin</span><h2>Yksi tavoite. Selkeä treeni.</h2><p>Valitse yksi treeni päivän muuhun harjoitteluun sopivaksi. Kenttä- ja jalkatreenien alussa on dynaaminen korisalkulämpö, pakara-aktivointi ja kevyet hypyt.</p></div><div className="warmup-summary"><span>01 · LÄMPÖ & LIIKE</span><span>02 · AKTIVOINTI</span><span>03 · KEVYET HYPYT</span><small>Liikkuvuus-, keskivartalo- ja käsitreeneissä on kevyempi aloitus.</small></div></div>
    <div className="filter-chips training-filters" aria-label="Treenialueen valinta"><button className={filter === 'all' ? 'selected' : ''} aria-pressed={filter === 'all'} onClick={() => selectFilter('all')}>Kaikki <span>{programs.length}</span></button>{trainingAreas.map(area => <button key={area.id} className={filter === area.id ? 'selected' : ''} aria-pressed={filter === area.id} onClick={() => selectFilter(area.id)}>{area.label}</button>)}</div>
    <p className="training-result-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'treeni' : 'treeniä'} · {filter === 'all' ? 'Kaikki alueet' : trainingAreas.find(a => a.id === filter)?.label}</p>
    <div className="training-grid">{visible.map(p => {
      const Icon = p.group === 'court' ? Target : p.area === 'explosiveness' ? Zap : p.area === 'mobility' || p.area === 'core' ? Activity : Dumbbell;
      const last = entries.find(e => e.kind === 'workout' && e.data.program === p.id);
      return <section className={`card training-card plan-${p.area} training-${p.group}`} key={p.id}>
        <div className="training-art"><Icon size={70} strokeWidth={1.4}/><span>{p.tag}</span><div className="art-lines"/></div>
        <div className="card-body"><span className="eyebrow">NOIN {p.minutes} MIN · {p.exercises.length} HARJOITETTA</span><h2>{p.title}</h2><p>{p.desc}</p><div className="training-equipment"><strong>Tarvitset</strong><span>{p.equipment}</span></div><div className="plan-exercises">{p.exercises.filter(([name]) => !['Koripallon dynaaminen lämmittely', 'Pakarasilta – aktivointi', 'Kevyet pogo-hypyt'].includes(name)).slice(0, 3).map(([name]) => <span key={name}>{name}</span>)}</div><button className="primary full" onClick={() => preview(p)}>Näytä harjoitus<ArrowRight size={17}/></button><small className="last-trained">{last ? `Viimeksi ${new Date(last.at).toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' })}` : 'Yksin · Video-ohje jokaiselle harjoitteelle'}</small></div>
      </section>;
    })}</div>
    <div className="context-note"><Info size={18}/><p>Harjoitukset ovat valittavia treenipohjia. Niitä ei ole tarkoitus tehdä kaikkia samana päivänä. Sovita kuormitus joukkueharjoituksiin ja peleihin oman PT:n kanssa.</p></div>
    <section className="skill-banner"><div className="square-icon"><Target size={25}/></div><div className="grow"><h2>Myös pallonkäsittely mukaan.</h2><p>Crossover, hesitation ja pivotit video-ohjeineen.</p></div><button className="secondary" onClick={openSkills}>Avaa taitoharjoitukset<ArrowRight size={17}/></button></section>
  </>;
}
