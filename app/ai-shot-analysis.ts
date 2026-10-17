export type ShootingHand = 'right' | 'left';
export type PoseLandmark = { x: number; y: number; z?: number; visibility?: number; presence?: number };
export type PoseFrame = { time: number; landmarks: PoseLandmark[]; worldLandmarks?: PoseLandmark[] };
export type PoseDetectionFrame = { time: number; poses: Array<{ landmarks: PoseLandmark[]; worldLandmarks?: PoseLandmark[] }> };
export type ShooterTarget = { x: number; y: number; time: number };
export type AiShotMetrics = {
  elbowSet: number; elbowRelease: number; elbowExtension: number;
  kneeSet: number; kneeRelease: number; kneeExtension: number;
  releaseHeight: number; timingDelay: number; bodyLean: number; bodyDrift: number;
};
export type AiShotFocus = { title: string; cue: string; drill: string };
export type AiShotResult = {
  model: 'MediaPipe Pose Landmarker'; modelVersion: '1.1.1'; hand: ShootingHand;
  confidence: number; shotConfidence: number; samples: number; windowStart: number; windowEnd: number;
  setTime: number; releaseTime: number; metrics: AiShotMetrics;
  focus: AiShotFocus; pluses: string[]; improvements: string[]; cautions: string[]; releasePose: PoseLandmark[];
};

const MODULE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/vision_bundle.mjs';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const sideIndices = {
  left: { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 },
  right: { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 },
} as const;

const round = (value: number, decimals = 0) => Number(value.toFixed(decimals));
const distance = (a: PoseLandmark, b: PoseLandmark) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
function angle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark) {
  const u = [a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)];
  const v = [c.x - b.x, c.y - b.y, (c.z || 0) - (b.z || 0)];
  const lengths = [Math.hypot(...u), Math.hypot(...v)];
  if (!lengths[0] || !lengths[1]) return null;
  const cosine = Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (lengths[0] * lengths[1])));
  return Math.acos(cosine) * 180 / Math.PI;
}
function midpoint(a: PoseLandmark, b: PoseLandmark): PoseLandmark { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 }; }
function leanFromVertical(shoulder: PoseLandmark, hip: PoseLandmark) {
  return Math.abs(Math.atan2(shoulder.x - hip.x, hip.y - shoulder.y) * 180 / Math.PI);
}
function frameQuality(frame: PoseFrame, hand: ShootingHand) {
  const index = sideIndices[hand], required = Object.values(index);
  if (frame.landmarks.length < 29 || required.some(i => !frame.landmarks[i])) return 0;
  return required.reduce((sum, i) => sum + (frame.landmarks[i].visibility ?? .75), 0) / required.length;
}
function jointAngle(frame: PoseFrame, a: number, b: number, c: number) {
  const points = frame.worldLandmarks?.length === 33 ? frame.worldLandmarks : frame.landmarks;
  return angle(points[a], points[b], points[c]);
}

function poseCenter(frame: PoseFrame) {
  const shoulders = midpoint(frame.landmarks[11], frame.landmarks[12]);
  const hips = midpoint(frame.landmarks[23], frame.landmarks[24]);
  return midpoint(shoulders, hips);
}

function poseScale(frame: PoseFrame) {
  return Math.max(.03, distance(midpoint(frame.landmarks[11], frame.landmarks[12]), midpoint(frame.landmarks[23], frame.landmarks[24])));
}

function distanceToPose(frame: PoseFrame, target: ShooterTarget) {
  const visible = frame.landmarks.filter(point => (point.visibility ?? .75) >= .3);
  if (!visible.length) return Infinity;
  const xs = visible.map(point => point.x), ys = visible.map(point => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const dx = target.x < minX ? minX - target.x : target.x > maxX ? target.x - maxX : 0;
  const dy = target.y < minY ? minY - target.y : target.y > maxY ? target.y - maxY : 0;
  return Math.hypot(dx, dy);
}

function shooterMotionScore(frames: PoseFrame[], hand: ShootingHand, totalFrames: number) {
  const index = sideIndices[hand], guideWrist = hand === 'right' ? 15 : 16;
  const scale = frames.reduce((sum, frame) => sum + poseScale(frame), 0) / frames.length;
  const wristY = frames.map(frame => frame.landmarks[index.wrist].y);
  const guideY = frames.map(frame => frame.landmarks[guideWrist].y);
  const elbowAngles = frames.map(frame => jointAngle(frame, index.shoulder, index.elbow, index.wrist)).filter((value): value is number => value !== null);
  const kneeAngles = frames.map(frame => jointAngle(frame, index.hip, index.knee, index.ankle)).filter((value): value is number => value !== null);
  const releaseFrame = frames[wristY.indexOf(Math.min(...wristY))];
  const wristLift = (Math.max(...wristY) - Math.min(...wristY)) / scale;
  const guideLift = (Math.max(...guideY) - Math.min(...guideY)) / scale;
  const releaseHeight = (releaseFrame.landmarks[index.shoulder].y - releaseFrame.landmarks[index.wrist].y) / scale;
  const handsApart = distance(releaseFrame.landmarks[index.wrist], releaseFrame.landmarks[guideWrist]) / scale;
  const elbowMotion = elbowAngles.length ? Math.max(...elbowAngles) - Math.min(...elbowAngles) : 0;
  const kneeMotion = kneeAngles.length ? Math.max(...kneeAngles) - Math.min(...kneeAngles) : 0;
  const coverage = frames.length / Math.max(1, totalFrames);
  return Math.min(3, wristLift) * 3 + Math.min(3, guideLift) * 1.25 + Math.max(0, Math.min(2, releaseHeight)) * 1.5
    + Math.min(2, elbowMotion / 50) + Math.min(1.5, kneeMotion / 45) + Math.max(0, 1.5 - handsApart) + coverage * 2;
}

export function selectShooterTrack(input: PoseDetectionFrame[], hand: ShootingHand, target?: ShooterTarget) {
  const tracks: PoseFrame[][] = [];
  for (const detection of [...input].sort((a, b) => a.time - b.time)) {
    const poses = detection.poses.map(pose => ({ time: detection.time, ...pose })).filter(frame => frameQuality(frame, hand) >= .3);
    const pairs: Array<{ track: number; pose: number; score: number }> = [];
    tracks.forEach((track, trackIndex) => {
      const previous = track.at(-1)!;
      if (detection.time - previous.time > .65) return;
      poses.forEach((pose, poseIndex) => {
        const movement = distance(poseCenter(previous), poseCenter(pose));
        const sizeChange = Math.abs(poseScale(previous) - poseScale(pose));
        pairs.push({ track: trackIndex, pose: poseIndex, score: movement + sizeChange * .6 });
      });
    });
    const usedTracks = new Set<number>(), usedPoses = new Set<number>();
    for (const pair of pairs.sort((a, b) => a.score - b.score)) {
      if (pair.score > .24 || usedTracks.has(pair.track) || usedPoses.has(pair.pose)) continue;
      tracks[pair.track].push(poses[pair.pose]); usedTracks.add(pair.track); usedPoses.add(pair.pose);
    }
    poses.forEach((pose, poseIndex) => { if (!usedPoses.has(poseIndex)) tracks.push([pose]); });
  }
  const minimumFrames = Math.max(8, input.length * .35);
  const viable = tracks.filter(track => track.length >= minimumFrames);
  if (!viable.length) throw Error('AI ei pystynyt seuraamaan samaa pelaajaa tarpeeksi pitkään. Pidä heittäjä kokonaan kuvassa ja kokeile uudelleen.');
  let frames: PoseFrame[];
  if (target) {
    frames = viable.reduce((best, track) => {
      const nearest = track.reduce((a, b) => Math.abs(a.time - target.time) <= Math.abs(b.time - target.time) ? a : b);
      const bestNearest = best.reduce((a, b) => Math.abs(a.time - target.time) <= Math.abs(b.time - target.time) ? a : b);
      const score = distanceToPose(nearest, target) + Math.abs(nearest.time - target.time) * .05;
      const bestScore = distanceToPose(bestNearest, target) + Math.abs(bestNearest.time - target.time) * .05;
      return score < bestScore ? track : best;
    });
  } else {
    frames = viable.reduce((best, track) => shooterMotionScore(track, hand, input.length) > shooterMotionScore(best, hand, input.length) ? track : best);
  }
  return { frames, peopleDetected: Math.max(0, ...input.map(frame => frame.poses.length)), selection: target ? 'manual' as const : 'auto' as const };
}

function shotSequence(frames: PoseFrame[], hand: ShootingHand) {
  const index = sideIndices[hand];
  const candidates: Array<{ setFrame: PoseFrame; releaseFrame: PoseFrame; score: number; confidence: number }> = [];
  for (let releaseIndex = 0; releaseIndex < frames.length - 2; releaseIndex++) {
    const releaseFrame = frames[releaseIndex];
    const releaseElbow = jointAngle(releaseFrame, index.shoulder, index.elbow, index.wrist);
    const releaseKnee = jointAngle(releaseFrame, index.hip, index.knee, index.ankle);
    if (releaseElbow === null || releaseKnee === null) continue;
    const releaseScale = poseScale(releaseFrame);
    const releaseHeight = (releaseFrame.landmarks[index.shoulder].y - releaseFrame.landmarks[index.wrist].y) / releaseScale;
    if (releaseElbow < 105 || releaseHeight < .15) continue;
    for (let setIndex = 0; setIndex < releaseIndex; setIndex++) {
      const setFrame = frames[setIndex], duration = releaseFrame.time - setFrame.time;
      if (duration < .12 || duration > 1.65) continue;
      const setElbow = jointAngle(setFrame, index.shoulder, index.elbow, index.wrist);
      const setKnee = jointAngle(setFrame, index.hip, index.knee, index.ankle);
      if (setElbow === null || setKnee === null) continue;
      const scale = Math.max(.03, (poseScale(setFrame) + releaseScale) / 2);
      const wristLift = (setFrame.landmarks[index.wrist].y - releaseFrame.landmarks[index.wrist].y) / scale;
      const elbowExtension = releaseElbow - setElbow;
      const kneeExtension = releaseKnee - setKnee;
      if (wristLift < .22 || elbowExtension < 12) continue;
      const timingQuality = duration >= .2 && duration <= 1.25 ? 1 : .65;
      const liftQuality = Math.min(1, wristLift / 1.15);
      const elbowQuality = Math.min(1, elbowExtension / 48);
      const heightQuality = Math.min(1, releaseHeight / .8);
      const kneeQuality = Math.max(0, Math.min(1, kneeExtension / 35));
      const afterRelease = frames.slice(releaseIndex + 1, releaseIndex + 4);
      const stableFollowThrough = afterRelease.filter(frame => frame.landmarks[index.wrist].y <= releaseFrame.landmarks[index.shoulder].y + scale * .25).length / Math.max(1, afterRelease.length);
      const confidence = Math.round((liftQuality * .28 + elbowQuality * .28 + heightQuality * .19 + timingQuality * .12 + kneeQuality * .07 + stableFollowThrough * .06) * 100);
      const score = liftQuality * 3 + elbowQuality * 3 + heightQuality * 2 + timingQuality + kneeQuality * .7 + stableFollowThrough * .6;
      candidates.push({ setFrame, releaseFrame, score, confidence });
    }
  }
  if (!candidates.length) throw Error('AI ei löytänyt videosta selkeää heittoliikettä. Rajaa video yhteen heittoon: aloita juuri ennen latausta ja jätä mukaan saatto sekä laskeutuminen.');
  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (best.confidence < 55) throw Error('Heiton vaiheiden tunnistus jäi liian epävarmaksi. Kuvaa yksi kokonainen heitto sivulta ja pidä koko vartalo näkyvissä.');
  return best;
}

export function analyzePoseFrames(input: PoseFrame[], hand: ShootingHand): AiShotResult {
  if (input.length < 8) throw Error('AI ei saanut videosta tarpeeksi selkeitä ruutuja. Kuvaa koko pelaaja sivulta paremmassa valossa.');
  const frames = input.filter(frame => frameQuality(frame, hand) >= .4);
  if (frames.length < Math.max(8, input.length * .35)) throw Error('Pelaajan nivelet eivät näkyneet riittävän monessa ruudussa. Rajaa kuva koko vartaloon ja vältä peittäviä pelaajia.');
  const index = sideIndices[hand];
  const sequence = shotSequence(frames, hand), { setFrame, releaseFrame } = sequence;
  const setElbow = jointAngle(setFrame, index.shoulder, index.elbow, index.wrist);
  const releaseElbow = jointAngle(releaseFrame, index.shoulder, index.elbow, index.wrist);
  const setKnee = jointAngle(setFrame, index.hip, index.knee, index.ankle);
  const releaseKnee = jointAngle(releaseFrame, index.hip, index.knee, index.ankle);
  if ([setElbow, releaseElbow, setKnee, releaseKnee].some(value => value === null)) throw Error('AI ei saanut nivelkulmia laskettua tästä videosta. Kokeile selkeämpää sivukuvaa.');

  const shoulders = midpoint(releaseFrame.landmarks[11], releaseFrame.landmarks[12]);
  const hips = midpoint(releaseFrame.landmarks[23], releaseFrame.landmarks[24]);
  const torso = Math.max(.03, distance(shoulders, hips));
  const firstHips = midpoint(setFrame.landmarks[23], setFrame.landmarks[24]);
  const elbowExtension = (releaseElbow as number) - (setElbow as number);
  const kneeExtension = (releaseKnee as number) - (setKnee as number);
  const releaseHeight = (releaseFrame.landmarks[index.shoulder].y - releaseFrame.landmarks[index.wrist].y) / torso;
  const timingDelay = releaseFrame.time - setFrame.time;
  const bodyLean = leanFromVertical(shoulders, hips);
  const bodyDrift = Math.abs(hips.x - firstHips.x) / torso;
  const metrics: AiShotMetrics = {
    elbowSet: round(setElbow as number), elbowRelease: round(releaseElbow as number), elbowExtension: round(elbowExtension),
    kneeSet: round(setKnee as number), kneeRelease: round(releaseKnee as number), kneeExtension: round(kneeExtension),
    releaseHeight: round(releaseHeight, 2), timingDelay: round(timingDelay, 2), bodyLean: round(bodyLean), bodyDrift: round(bodyDrift, 2),
  };
  const pluses: string[] = [], improvements: string[] = [], cautions: string[] = [];
  const focusOptions: Array<{ severity: number; feedback: string; focus: AiShotFocus }> = [];
  if (elbowExtension >= 28) pluses.push(`Heittokäsi ojentuu selvästi: kyynärkulma kasvaa ${metrics.elbowExtension}°.`);
  else focusOptions.push({ severity: (28 - elbowExtension) / 28, feedback: `Heittokäden ojennus jää pieneksi (${metrics.elbowExtension}°).`, focus: { title: 'Vie saatto loppuun', cue: 'Ojenna kyynärpää ja jätä ranne rennosti alas kohti koria.', drill: 'Form shooting 3 × 10 läheltä. Pysäytä saatto jokaisella toistolla sekunniksi.' } });
  if (kneeExtension >= 14) pluses.push(`Jalat osallistuvat voimantuottoon: polvikulma kasvaa ${metrics.kneeExtension}°.`);
  else focusOptions.push({ severity: (14 - kneeExtension) / 20, feedback: `Jalkojen ojennus näkyy heikosti (${metrics.kneeExtension}°).`, focus: { title: 'Yhdistä jalat ja kädet', cue: 'Aloita pallon nousu samalla hetkellä, kun polvet lähtevät ojentumaan.', drill: 'One-motion shooting: 3 × 8 ilman hyppyä, sitten 3 × 5 kevyellä hypyllä.' } });
  if (releaseHeight >= .35) pluses.push('Ranne nousee selvästi olkapään yläpuolelle saatossa.');
  else focusOptions.push({ severity: (.35 - releaseHeight) / .35, feedback: 'Release jää kuvassa matalaksi.', focus: { title: 'Nosta release ylemmäs', cue: 'Vie pallo heittosilmän yläpuolelle ja viimeistele ranne korkealla.', drill: 'Wall form shooting 3 × 12: seiso lähellä seinää ja tee korkea saatto ilman pallon osumista seinään.' } });
  if (timingDelay >= .18 && timingDelay <= 1.25) pluses.push(`Latauksesta releaseen muodostuu yhtenäinen ${metrics.timingDelay} s liike.`);
  else focusOptions.push({ severity: timingDelay > 1.25 ? Math.min(1.5, (timingDelay - 1.25) / 1.25 + .4) : .7, feedback: `Jalkojen ja heittokäden ajoitus kestää ${metrics.timingDelay} s.`, focus: { title: 'Tee heitosta yksi liike', cue: 'Älä pysäytä palloa set pointiin: jatka liikettä jaloista suoraan saattoon.', drill: 'Rhythm shooting 3 × 8: sano ääneen “alas–ylös” ilman taukoa.' } });
  if (bodyLean <= 25) pluses.push(`Vartalon linja pysyy melko pystynä (${metrics.bodyLean}° kallistus).`);
  else focusOptions.push({ severity: (bodyLean - 25) / 30 + .3, feedback: `Vartalo kallistuu release-vaiheessa noin ${metrics.bodyLean}°.`, focus: { title: 'Pysy tasapainossa', cue: 'Pidä rintakehä lantion päällä ja katse korissa koko heiton ajan.', drill: 'Balance hold 3 × 6: heitä ja pysäytä laskeutuminen kahdeksi sekunniksi.' } });
  if (bodyDrift <= .55) pluses.push('Lantion sivuttaissiirtymä pysyy pienenä heiton aikana.');
  else focusOptions.push({ severity: Math.min(1.5, bodyDrift - .25), feedback: 'Lantio siirtyy heitossa sivulle suhteessa vartalon kokoon.', focus: { title: 'Laskeudu suoraan', cue: 'Suuntaa varpaat ja polvet kohti koria ja pidä ponnistuslinja suorana.', drill: 'Line landing 3 × 8: heitä lattialinjan päältä ja laskeudu samalle linjalle.' } });
  focusOptions.sort((a, b) => b.severity - a.severity);
  improvements.push(...focusOptions.slice(0, 3).map(item => `${item.feedback} ${item.focus.cue}`));
  const focus = focusOptions[0]?.focus || { title: 'Vahvista toistettavuutta', cue: 'Pidä sama rytmi, release ja tasapainoinen laskeutuminen jokaisessa toistossa.', drill: '5 spot form shooting: 5 onnistunutta heittoa jokaisesta paikasta ja kuvaa viimeinen sarja.' };

  const meanVisibility = frames.reduce((sum, frame) => sum + frameQuality(frame, hand), 0) / frames.length;
  const confidence = Math.round(Math.min(1, meanVisibility * (frames.length / input.length)) * 100);
  if (confidence < 65) cautions.push('Tunnistuksen varmuus jäi matalaksi. Älä tee tämän videon perusteella isoja tekniikkamuutoksia.');
  cautions.push('AI ei näe palloa tai koria, joten release arvioidaan ranteen noususta ja kyynärpään ojennuksesta.');
  return {
    model: 'MediaPipe Pose Landmarker', modelVersion: '1.1.1', hand, confidence, shotConfidence: sequence.confidence, samples: frames.length,
    windowStart: round(frames[0].time, 2), windowEnd: round(frames.at(-1)!.time, 2),
    setTime: round(setFrame.time, 2), releaseTime: round(releaseFrame.time, 2), metrics,
    focus, pluses: pluses.slice(0, 5), improvements, cautions, releasePose: releaseFrame.landmarks,
  };
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    if (Math.abs(video.currentTime - time) < .002 && video.readyState >= 2) { resolve(); return; }
    const timer = window.setTimeout(() => { cleanup(); reject(Error('Videoruudun lukeminen aikakatkaistiin.')); }, 5000);
    const done = () => { cleanup(); requestAnimationFrame(() => resolve()); };
    const cleanup = () => { window.clearTimeout(timer); video.removeEventListener('seeked', done); video.removeEventListener('error', failed); };
    const failed = () => { cleanup(); reject(Error('Videoruudun lukeminen epäonnistui.')); };
    video.addEventListener('seeked', done, { once: true }); video.addEventListener('error', failed, { once: true }); video.currentTime = time;
  });
}

export async function analyzeVideoWithPoseAi(video: HTMLVideoElement, hand: ShootingHand, startAt: number, onProgress: (progress: number, stage: string) => void, target?: ShooterTarget) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) throw Error('Videon kestoa ei voitu lukea. Valitse toinen video.');
  const windowLength = Math.min(12, video.duration);
  const start = video.duration <= 12 ? 0 : Math.min(Math.max(0, startAt - 1.5), video.duration - windowLength);
  const end = Math.min(video.duration, start + windowLength);
  const sampleCount = Math.max(8, Math.floor((end - start) * 8) + 1);
  const times = Array.from({ length: sampleCount }, (_, i) => start + (end - start) * i / Math.max(1, sampleCount - 1));
  video.pause(); onProgress(2, 'Ladataan pose-AI-mallia…');
  let landmarker: any;
  try {
    const visionModule: any = await import(/* @vite-ignore */ MODULE_URL);
    const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_URL);
    landmarker = await visionModule.PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 4, minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5, outputSegmentationMasks: false });
    const detections: PoseDetectionFrame[] = [];
    for (let i = 0; i < times.length; i++) {
      await seekVideo(video, Math.min(times[i], Math.max(0, video.duration - .001)));
      const result = landmarker.detectForVideo(video, times[i] * 1000);
      detections.push({ time: times[i], poses: (result.landmarks || []).map((landmarks: PoseLandmark[], poseIndex: number) => ({ landmarks, worldLandmarks: result.worldLandmarks?.[poseIndex] })) });
      onProgress(8 + Math.round((i + 1) / times.length * 90), `AI analysoi videota ${i + 1}/${times.length}`);
    }
    const selected = selectShooterTrack(detections, hand, target);
    const analysis = analyzePoseFrames(selected.frames, hand);
    if (selected.peopleDetected > 1) analysis.cautions.unshift(selected.selection === 'manual'
      ? `Videolla näkyi ${selected.peopleDetected} pelaajaa. Analyysi kohdistettiin merkitsemääsi heittäjään.`
      : `Videolla näkyi ${selected.peopleDetected} pelaajaa. AI valitsi heittäjän käsien nousun ja ojennusliikkeen perusteella.`);
    onProgress(100, 'Analyysi valmis'); return analysis;
  } catch (error) {
    if (error instanceof Error && /tarpeeksi|nivelet|nivelkulmia|Videoruudun|seuraamaan samaa pelaajaa|heittoliikettä|vaiheiden tunnistus/.test(error.message)) throw error;
    throw Error('AI-mallia ei saatu käynnistettyä. Tarkista verkkoyhteys ja kokeile uudelleen.');
  } finally { try { landmarker?.close(); } catch {} }
}

export function savedAiAnalysis(result: AiShotResult) {
  const { releasePose: _releasePose, ...saved } = result;
  return saved;
}
