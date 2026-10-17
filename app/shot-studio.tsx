'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BrainCircuit, CheckCircle2, ChevronLeft, ChevronRight, Crosshair, Download, Info, LoaderCircle, Pause, Play, Sparkles, Trash2, TriangleAlert, Undo2 } from 'lucide-react';
import { CameraStudio, Court } from './court-tools';
import { analyzeVideoWithPoseAi, savedAiAnalysis, type AiShotResult, type ShootingHand } from './ai-shot-analysis';
import { consistencyText, formatShotTime, measureShotAngle, measurementKinds, type MeasurementKind, type ShotMeasurement, type ShotPoint } from './shot-analysis';

const reviewLabels = [
  'Tasapainoinen lähtöasento',
  'Pallo nousee hallitusti heittolinjaan',
  'Kyynärpää pysyy pallon alla',
  'Saatto jatkuu kohti koria',
  'Laskeutuminen pysyy hallinnassa',
];
const poseConnections = [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]];

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
  const [hand, setHand] = useState<ShootingHand>('right');
  const [aiResult, setAiResult] = useState<AiShotResult | null>(null);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiRunning, setAiRunning] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const [notes, setNotes] = useState('');
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const selectedMeasurement = measurements.find(item => item.id === highlighted) || measurements.at(-1);
  const visiblePoints = points.length ? points : selectedMeasurement?.points || [];
  const draftAngle = measureShotAngle(points, dimensions);
  const definition = measurementKinds[kind];
  const grouped = useMemo(() => (Object.keys(measurementKinds) as MeasurementKind[]).map(id => ({ id, items: measurements.filter(item => item.kind === id) })), [measurements]);
  const aiPose = aiResult && Math.abs(currentTime - aiResult.releaseTime) < .18 ? aiResult.releasePose : [];

  function loadVideo(nextUrl: string) {
    setUrl(nextUrl); setPoints([]); setMeasurements([]); setHighlighted(''); setDuration(0); setCurrentTime(0); setPlaying(false); setAiResult(null); setAiError(''); setAiProgress(0); setAiStage('');
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
  async function runAiAnalysis() {
    if (!video.current || aiRunning) return;
    setAiRunning(true); setAiError(''); setAiResult(null); setAiProgress(0);
    try {
      const result = await analyzeVideoWithPoseAi(video.current, hand, currentTime, (progress, stage) => { setAiProgress(progress); setAiStage(stage); });
      setAiResult(result); seek(result.releaseTime); notify('AI-analyysi valmis. Tarkista plussat ja kehityskohdat.');
    } catch (error) { setAiError(error instanceof Error ? error.message : 'AI-analyysi epäonnistui.'); }
    finally { setAiRunning(false); }
  }
  function diaryNotes() {
    if (!aiResult) return notes;
    const generated = [`AI-plussat:`, ...aiResult.pluses.map(item => `+ ${item}`), '', 'AI-kehityskohdat:', ...(aiResult.improvements.length ? aiResult.improvements.map(item => `- ${item}`) : ['- Ei selvää yksittäistä kehityskohdetta.']), notes.trim() ? ['', 'Omat havainnot:', notes.trim()] : []].join('\n');
    return generated.slice(0, 1000);
  }

  return <>
    <div className="section-heading"><div><span className="eyebrow">POSE AI + 2D-MITTAUS</span><h1>Jumpshot-analyysi</h1><p>AI tunnistaa kehon nivelet, arvioi heiton vaiheet ja kertoo plussat sekä kehityskohdat.</p></div><span className="pill"><BrainCircuit size={14}/> {aiResult ? `${aiResult.confidence} % varmuus` : 'AI valmis videoon'}</span></div>
    <div className="shot-layout">
      <section className="card shot-video-card"><div className="card-heading"><div><h2>1. Valitse video</h2><p className="muted">Kuvaa sivulta, pidä puhelin paikallaan ja varmista, että koko pelaaja näkyy.</p></div></div>
        {url ? <>
          <div className="video-wrap shot-video-wrap">
            <video ref={video} src={url} playsInline onLoadedMetadata={() => { if (!video.current) return; setDimensions({ w: video.current.videoWidth || 16, h: video.current.videoHeight || 9 }); setDuration(Number.isFinite(video.current.duration) ? video.current.duration : 0); }} onTimeUpdate={() => setCurrentTime(video.current?.currentTime || 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}/>
            <svg className="measure" role="img" aria-label={`Merkitse seuraavaksi: ${definition.points[points.length] || definition.points[0]}`} viewBox={`0 0 ${dimensions.w} ${dimensions.h}`} preserveAspectRatio="none" onClick={markPoint}>
              {aiPose.length === 33 && <g className="ai-pose-overlay">{poseConnections.map(([from, to]) => <line key={`${from}-${to}`} x1={aiPose[from].x * dimensions.w} y1={aiPose[from].y * dimensions.h} x2={aiPose[to].x * dimensions.w} y2={aiPose[to].y * dimensions.h} stroke="#61e5d0" strokeWidth={dimensions.w / 260}/>)}{[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map(index => <circle key={index} cx={aiPose[index].x * dimensions.w} cy={aiPose[index].y * dimensions.h} r={dimensions.w / 110} fill="#61e5d0" stroke="#173b2a" strokeWidth={dimensions.w / 620}/>)}</g>}
              {visiblePoints.length > 1 && <polyline points={visiblePoints.map(point => `${point.x * dimensions.w},${point.y * dimensions.h}`).join(' ')} stroke="#c8f36b" strokeWidth={dimensions.w / 220} fill="none"/>}
              {visiblePoints.map((point, index) => <g key={`${point.x}-${point.y}-${index}`}><circle cx={point.x * dimensions.w} cy={point.y * dimensions.h} r={dimensions.w / 72} fill="#c8f36b" stroke="#173b2a" strokeWidth={dimensions.w / 500}/><text x={point.x * dimensions.w} y={point.y * dimensions.h} textAnchor="middle" dominantBaseline="central" fontSize={dimensions.w / 65} fill="#173b2a" fontWeight="800">{index + 1}</text></g>)}
            </svg>
          </div>
          <div className="shot-timeline"><input aria-label="Videon kohta" type="range" min="0" max={duration || 0.01} step="0.01" value={Math.min(currentTime, duration || 0)} onChange={event => seek(Number(event.target.value))}/><span>{formatShotTime(currentTime)} / {formatShotTime(duration)}</span></div>
          <div className="button-row shot-controls"><button className="secondary compact" aria-label={playing ? 'Pysäytä video' : 'Toista video'} onClick={() => { if (!video.current) return; if (video.current.paused) void video.current.play(); else video.current.pause(); }}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button><button className="secondary compact" onClick={() => seek(currentTime - 1 / 30)} aria-label="Edellinen ruutu"><ChevronLeft size={16}/></button><button className="secondary compact" onClick={() => seek(currentTime + 1 / 30)} aria-label="Seuraava ruutu"><ChevronRight size={16}/></button><select aria-label="Toistonopeus" onChange={event => { if (video.current) video.current.playbackRate = Number(event.target.value); }} defaultValue="0.5"><option value="1">1×</option><option value="0.5">0,5×</option><option value="0.25">0,25×</option></select><button className="text-btn" disabled={!points.length} onClick={() => setPoints(value => value.slice(0, -1))}><Undo2 size={15}/>Peru piste</button><a href={url} download="fastrep-jumpshot-video" className="icon-btn" aria-label="Lataa video"><Download size={18}/></a></div>
        </> : <div className="upload-zone"><div className="round-icon"><Crosshair size={36}/></div><h2>Yksi kuvakulma. Monta havaintoa.</h2><p>Valitse lyhyt sivulta kuvattu video tai kuvaa uusi.</p><Court compact/></div>}
        <CameraStudio onVideo={loadVideo} notify={notify}/>
        <div className="ai-launch-panel"><div><span className="eyebrow">TEKOÄLYANALYYSI</span><h3>Valitse heittokäsi</h3><div className="segmented hand-picker"><button className={hand === 'right' ? 'selected' : ''} aria-pressed={hand === 'right'} onClick={() => { setHand('right'); setAiResult(null); }}>Oikea</button><button className={hand === 'left' ? 'selected' : ''} aria-pressed={hand === 'left'} onClick={() => { setHand('left'); setAiResult(null); }}>Vasen</button></div></div><button className="primary ai-button" disabled={!url || aiRunning} onClick={runAiAnalysis}>{aiRunning ? <LoaderCircle className="spinner" size={18}/> : <Sparkles size={18}/>} {aiRunning ? 'Analysoidaan…' : duration > 8 ? 'Analysoi tästä 8 s' : 'Analysoi koko video'}</button></div>
        {aiRunning && <div className="ai-progress" role="status"><div><strong>{aiStage}</strong><span>{aiProgress} %</span></div><div className="progress"><i style={{ width: `${aiProgress}%` }}/></div><small>Ensimmäisellä kerralla AI-mallin lataus voi kestää hetken.</small></div>}
        {aiError && <p className="form-error" role="alert">{aiError}</p>}
        <p className="tiny">Video ja videoruudut pysyvät laitteellasi. MediaPipe käsittelee kuvan paikallisesti; palvelu voi lähettää Googlelle teknisiä käyttö- ja suorituskykymittareita. Päiväkirjaan tallennetaan vain analyysin tulokset, mittaukset ja omat muistiinpanosi.</p>
      </section>

      <div className="stack shot-analysis-side">
        <section className={`card ai-result-card ${aiResult ? 'has-result' : ''}`}><div className="card-heading"><div><span className="eyebrow">2. AI:N PALAUTE</span><h2>{aiResult ? 'Heiton havainnot' : 'Odottaa videota'}</h2></div><span className="ai-badge"><BrainCircuit size={15}/>{aiResult ? `${aiResult.confidence} %` : 'AI'}</span></div>
          {!aiResult ? <div className="ai-empty"><BrainCircuit size={34}/><p>Lisää video, valitse heittokäsi ja käynnistä analyysi. AI merkitsee nivelpisteet sekä arvioi liikkeen ranteen korkeimman kohdan ympäriltä.</p></div> : <><div className="ai-summary"><div><small>Tunnistuksen varmuus</small><strong>{aiResult.confidence}<span>%</span></strong></div><div><small>Analysoitu jakso</small><strong>{formatShotTime(aiResult.windowEnd - aiResult.windowStart)}</strong></div><div><small>Release-arvio</small><strong>{formatShotTime(aiResult.releaseTime)}</strong></div></div>
            <div className="ai-feedback good"><h3><CheckCircle2 size={18}/>Plussat</h3>{aiResult.pluses.map(item => <p key={item}>{item}</p>)}</div>
            <div className="ai-feedback improve"><h3><TriangleAlert size={18}/>Kehityskohdat</h3>{aiResult.improvements.length ? aiResult.improvements.map(item => <p key={item}>{item}</p>) : <p>AI ei löytänyt tästä jaksosta selvää yksittäistä kehityskohdetta.</p>}</div>
            <div className="ai-metrics"><div><span>Kyynärpää</span><strong>{aiResult.metrics.elbowSet}° → {aiResult.metrics.elbowRelease}°</strong></div><div><span>Polvi</span><strong>{aiResult.metrics.kneeSet}° → {aiResult.metrics.kneeRelease}°</strong></div><div><span>Vartalon kallistus</span><strong>{aiResult.metrics.bodyLean}°</strong></div><div><span>Ajoitus</span><strong>{aiResult.metrics.timingDelay} s</strong></div></div>
            {aiResult.cautions.map(item => <p className="ai-caution" key={item}><Info size={15}/>{item}</p>)}</>}
        </section>
        <section className="card"><span className="eyebrow">3. TARKENNA KÄSIN</span><h2>{definition.title}</h2><p className="muted ai-manual-note">Voit tarkistaa AI:n havaintoa omalla kolmen pisteen 2D-mittauksella.</p><div className="segmented shot-kind-picker">{(Object.keys(measurementKinds) as MeasurementKind[]).map(id => <button key={id} className={kind === id ? 'selected' : ''} aria-pressed={kind === id} onClick={() => { setKind(id); setPoints([]); }}>{measurementKinds[id].short}</button>)}</div>
          <div className="marking-guide"><strong>{url ? `${points.length + 1}/3 · Merkitse ${definition.points[points.length] || definition.points[0]}` : 'Lisää ensin video'}</strong><p>{url ? 'Pysäytä video haluamaasi kohtaan ja napauta niveltä videosta. Kolmas piste tallentaa mittauksen.' : 'Mittausohje avautuu videon lisäämisen jälkeen.'}</p>{points.length > 0 && <div className="point-steps">{definition.points.map((label, index) => <span className={index < points.length ? 'done' : index === points.length ? 'active' : ''} key={label}>{index + 1}. {label}</span>)}</div>}<strong className="draft-angle">{draftAngle === null ? '—' : `${draftAngle}°`}</strong></div>
          {grouped.map(group => group.items.length > 0 && <div className="measurement-group" key={group.id}><div className="measurement-group-head"><strong>{measurementKinds[group.id].title}</strong><small>{consistencyText(measurements, group.id)}</small></div>{group.items.map(item => <button className={`measurement-row ${highlighted === item.id ? 'selected' : ''}`} key={item.id} onClick={() => { setHighlighted(item.id); seek(item.time); }}><span>{formatShotTime(item.time)}</span><strong>{item.angle}°</strong><span className="grow">{measurementKinds[item.kind].short}</span><span className="icon-btn" role="button" aria-label="Poista mittaus" onClick={event => { event.stopPropagation(); removeMeasurement(item.id); }}><Trash2 size={15}/></span></button>)}</div>)}
          {!measurements.length && <p className="empty-inline">Tallennetut kulmat ja heittojen välinen vaihtelu näkyvät tässä.</p>}
        </section>
        <section className="card"><span className="eyebrow">4. OMA ARVIO</span><h2>Tarkista koko suoritus</h2>{reviewLabels.map((label, index) => <label className="check-row" key={label}><input type="checkbox" checked={checks[index]} onChange={() => setChecks(values => values.map((value, i) => i === index ? !value : value))}/><span>{label}</span></label>)}<label>Havainnot<textarea placeholder="Mikä toistui hyvin? Mitä kokeilet seuraavaksi?" value={notes} maxLength={1000} onChange={event => setNotes(event.target.value)}/></label><button disabled={!url || busy} className="primary full" onClick={async () => { const last = measurements.at(-1); if (await save('review', { checks, notes: diaryNotes(), angle: last?.angle ?? null, duration, measurements, ai: aiResult ? savedAiAnalysis(aiResult) : undefined })) notify('Heittoanalyysi tallennettu päiväkirjaan.'); }}>{busy ? 'Tallennetaan…' : 'Tallenna analyysi'}<ArrowRight size={17}/></button><div className="notice"><Info size={18}/><p>AI-palaute perustuu yhdestä kuvakulmasta tunnistettuihin nivelpisteisiin ja yleisiin liikeheuristiikkoihin. Se ei korvaa valmentajan arviota eikä näe palloa tai koria.</p></div></section>
      </div>
    </div>
  </>;
}
