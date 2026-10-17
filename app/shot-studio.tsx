'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Crosshair, Download, Info, Pause, Play, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { CameraStudio, Court } from './court-tools';
import { consistencyText, formatShotTime, measureShotAngle, measurementKinds, type MeasurementKind, type ShotMeasurement, type ShotPoint } from './shot-analysis';

const reviewLabels = [
  'Tasapainoinen lähtöasento',
  'Pallo nousee hallitusti heittolinjaan',
  'Kyynärpää pysyy pallon alla',
  'Saatto jatkuu kohti koria',
  'Laskeutuminen pysyy hallinnassa',
];

export function ShotStudio({ save, notify, busy }: { save: (kind: string, data: any) => Promise<boolean>; notify: (message: string) => void; busy: boolean }) {
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<MeasurementKind>('elbow');
  const [points, setPoints] = useState<ShotPoint[]>([]);
  const [measurements, setMeasurements] = useState<ShotMeasurement[]>([]);
  const [highlighted, setHighlighted] = useState('');
  const [dimensions, setDimensions] = useState({ w: 16, h: 9 });
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const [notes, setNotes] = useState('');
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const selectedMeasurement = measurements.find(item => item.id === highlighted) || measurements.at(-1);
  const visiblePoints = points.length ? points : selectedMeasurement?.points || [];
  const draftAngle = measureShotAngle(points, dimensions);
  const definition = measurementKinds[kind];
  const grouped = useMemo(() => (Object.keys(measurementKinds) as MeasurementKind[]).map(id => ({ id, items: measurements.filter(item => item.kind === id) })), [measurements]);

  function loadVideo(nextUrl: string) {
    setUrl(nextUrl); setPoints([]); setMeasurements([]); setHighlighted(''); setDuration(0); setCurrentTime(0); setPlaying(false);
  }
  function seek(next: number) {
    if (!video.current) return;
    const safe = Math.min(duration || video.current.duration || 0, Math.max(0, next));
    video.current.currentTime = safe; setCurrentTime(safe); video.current.pause(); setPlaying(false); setPoints([]);
  }
  function markPoint(event: React.MouseEvent<SVGSVGElement>) {
    video.current?.pause(); setPlaying(false);
    const box = event.currentTarget.getBoundingClientRect();
    const next = [...points, { x: Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)), y: Math.min(1, Math.max(0, (event.clientY - box.top) / box.height)) }];
    if (next.length < 3) { setPoints(next); return; }
    const angle = measureShotAngle(next, dimensions);
    if (angle === null) { notify('Pisteet ovat liian lähellä toisiaan. Merkitse nivelet uudelleen.'); setPoints([]); return; }
    const measurement: ShotMeasurement = { id: crypto.randomUUID(), kind, angle, time: currentTime, points: next };
    setMeasurements(previous => [...previous, measurement].slice(-24)); setHighlighted(measurement.id); setPoints([]);
  }
  function removeMeasurement(id: string) {
    setMeasurements(items => items.filter(item => item.id !== id));
    if (highlighted === id) setHighlighted('');
  }

  return <>
    <div className="section-heading"><div><span className="eyebrow">OHJATTU 2D-ANALYYSI</span><h1>Jumpshot-analyysi</h1><p>Hidasta video, merkitse nivelet ja vertaa heittojen toistettavuutta.</p></div><span className="pill"><Crosshair size={14}/> {measurements.length} mittausta</span></div>
    <div className="shot-layout">
      <section className="card shot-video-card"><div className="card-heading"><div><h2>1. Valitse video</h2><p className="muted">Kuvaa sivulta, pidä puhelin paikallaan ja varmista, että koko pelaaja näkyy.</p></div></div>
        {url ? <>
          <div className="video-wrap shot-video-wrap">
            <video ref={video} src={url} playsInline onLoadedMetadata={() => { if (!video.current) return; setDimensions({ w: video.current.videoWidth || 16, h: video.current.videoHeight || 9 }); setDuration(Number.isFinite(video.current.duration) ? video.current.duration : 0); }} onTimeUpdate={() => setCurrentTime(video.current?.currentTime || 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}/>
            <svg className="measure" role="img" aria-label={`Merkitse seuraavaksi: ${definition.points[points.length] || definition.points[0]}`} viewBox={`0 0 ${dimensions.w} ${dimensions.h}`} preserveAspectRatio="none" onClick={markPoint}>
              {visiblePoints.length > 1 && <polyline points={visiblePoints.map(point => `${point.x * dimensions.w},${point.y * dimensions.h}`).join(' ')} stroke="#c8f36b" strokeWidth={dimensions.w / 220} fill="none"/>}
              {visiblePoints.map((point, index) => <g key={`${point.x}-${point.y}-${index}`}><circle cx={point.x * dimensions.w} cy={point.y * dimensions.h} r={dimensions.w / 72} fill="#c8f36b" stroke="#173b2a" strokeWidth={dimensions.w / 500}/><text x={point.x * dimensions.w} y={point.y * dimensions.h} textAnchor="middle" dominantBaseline="central" fontSize={dimensions.w / 65} fill="#173b2a" fontWeight="800">{index + 1}</text></g>)}
            </svg>
          </div>
          <div className="shot-timeline"><input aria-label="Videon kohta" type="range" min="0" max={duration || 0.01} step="0.01" value={Math.min(currentTime, duration || 0)} onChange={event => seek(Number(event.target.value))}/><span>{formatShotTime(currentTime)} / {formatShotTime(duration)}</span></div>
          <div className="button-row shot-controls"><button className="secondary compact" aria-label={playing ? 'Pysäytä video' : 'Toista video'} onClick={() => { if (!video.current) return; if (video.current.paused) void video.current.play(); else video.current.pause(); }}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button><button className="secondary compact" onClick={() => seek(currentTime - 1 / 30)} aria-label="Edellinen ruutu"><ChevronLeft size={16}/></button><button className="secondary compact" onClick={() => seek(currentTime + 1 / 30)} aria-label="Seuraava ruutu"><ChevronRight size={16}/></button><select aria-label="Toistonopeus" onChange={event => { if (video.current) video.current.playbackRate = Number(event.target.value); }} defaultValue="0.5"><option value="1">1×</option><option value="0.5">0,5×</option><option value="0.25">0,25×</option></select><button className="text-btn" disabled={!points.length} onClick={() => setPoints(value => value.slice(0, -1))}><Undo2 size={15}/>Peru piste</button><a href={url} download="fastrep-jumpshot-video" className="icon-btn" aria-label="Lataa video"><Download size={18}/></a></div>
        </> : <div className="upload-zone"><div className="round-icon"><Crosshair size={36}/></div><h2>Yksi kuvakulma. Monta havaintoa.</h2><p>Valitse lyhyt sivulta kuvattu video tai kuvaa uusi.</p><Court compact/></div>}
        <CameraStudio onVideo={loadVideo} notify={notify}/><p className="tiny">Video pysyy laitteellasi. Päiväkirjaan tallennetaan vain mittauspisteet, ajat, kulmat ja omat muistiinpanosi.</p>
      </section>

      <div className="stack shot-analysis-side">
        <section className="card"><span className="eyebrow">2. MITTAA VIDEOSTA</span><h2>{definition.title}</h2><div className="segmented shot-kind-picker">{(Object.keys(measurementKinds) as MeasurementKind[]).map(id => <button key={id} className={kind === id ? 'selected' : ''} aria-pressed={kind === id} onClick={() => { setKind(id); setPoints([]); }}>{measurementKinds[id].short}</button>)}</div>
          <div className="marking-guide"><strong>{url ? `${points.length + 1}/3 · Merkitse ${definition.points[points.length] || definition.points[0]}` : 'Lisää ensin video'}</strong><p>{url ? 'Pysäytä video haluamaasi kohtaan ja napauta niveltä videosta. Kolmas piste tallentaa mittauksen.' : 'Mittausohje avautuu videon lisäämisen jälkeen.'}</p>{points.length > 0 && <div className="point-steps">{definition.points.map((label, index) => <span className={index < points.length ? 'done' : index === points.length ? 'active' : ''} key={label}>{index + 1}. {label}</span>)}</div>}<strong className="draft-angle">{draftAngle === null ? '—' : `${draftAngle}°`}</strong></div>
          {grouped.map(group => group.items.length > 0 && <div className="measurement-group" key={group.id}><div className="measurement-group-head"><strong>{measurementKinds[group.id].title}</strong><small>{consistencyText(measurements, group.id)}</small></div>{group.items.map(item => <button className={`measurement-row ${highlighted === item.id ? 'selected' : ''}`} key={item.id} onClick={() => { setHighlighted(item.id); seek(item.time); }}><span>{formatShotTime(item.time)}</span><strong>{item.angle}°</strong><span className="grow">{measurementKinds[item.kind].short}</span><span className="icon-btn" role="button" aria-label="Poista mittaus" onClick={event => { event.stopPropagation(); removeMeasurement(item.id); }}><Trash2 size={15}/></span></button>)}</div>)}
          {!measurements.length && <p className="empty-inline">Tallennetut kulmat ja heittojen välinen vaihtelu näkyvät tässä.</p>}
        </section>
        <section className="card"><span className="eyebrow">3. OMA ARVIO</span><h2>Tarkista koko suoritus</h2>{reviewLabels.map((label, index) => <label className="check-row" key={label}><input type="checkbox" checked={checks[index]} onChange={() => setChecks(values => values.map((value, i) => i === index ? !value : value))}/><span>{label}</span></label>)}<label>Havainnot<textarea placeholder="Mikä toistui hyvin? Mitä kokeilet seuraavaksi?" value={notes} maxLength={1000} onChange={event => setNotes(event.target.value)}/></label><button disabled={!url || busy} className="primary full" onClick={async () => { const last = measurements.at(-1); if (await save('review', { checks, notes, angle: last?.angle ?? null, duration, measurements })) notify('Heittoanalyysi tallennettu päiväkirjaan.'); }}>{busy ? 'Tallennetaan…' : 'Tallenna analyysi'}<ArrowRight size={17}/></button><div className="notice"><Info size={18}/><p>Kulmat ovat kamerakuvan 2D-mittauksia. Työkalu auttaa vertaamaan omia toistoja, mutta ei tee automaattista AI-tekniikka-arviota.</p></div></section>
      </div>
    </div>
  </>;
}
