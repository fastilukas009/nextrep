export type ShootingHand = 'right' | 'left';
export type PoseLandmark = { x: number; y: number; z?: number; visibility?: number; presence?: number };
export type PoseFrame = { time: number; landmarks: PoseLandmark[]; worldLandmarks?: PoseLandmark[] };
export type AiShotMetrics = {
  elbowSet: number; elbowRelease: number; elbowExtension: number;
  kneeSet: number; kneeRelease: number; kneeExtension: number;
  releaseHeight: number; timingDelay: number; bodyLean: number; bodyDrift: number;
};
export type AiShotResult = {
  model: 'MediaPipe Pose Landmarker'; modelVersion: '1.1.1'; hand: ShootingHand;
  confidence: number; samples: number; windowStart: number; windowEnd: number;
  setTime: number; releaseTime: number; metrics: AiShotMetrics;
  pluses: string[]; improvements: string[]; cautions: string[]; releasePose: PoseLandmark[];
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

export function analyzePoseFrames(input: PoseFrame[], hand: ShootingHand): AiShotResult {
  if (input.length < 8) throw Error('AI ei saanut videosta tarpeeksi selkeitä ruutuja. Kuvaa koko pelaaja sivulta paremmassa valossa.');
  const frames = input.filter(frame => frameQuality(frame, hand) >= .4);
  if (frames.length < Math.max(8, input.length * .35)) throw Error('Pelaajan nivelet eivät näkyneet riittävän monessa ruudussa. Rajaa kuva koko vartaloon ja vältä peittäviä pelaajia.');
  const index = sideIndices[hand];
  const releaseFrame = frames.reduce((best, frame) => frame.landmarks[index.wrist].y < best.landmarks[index.wrist].y ? frame : best, frames[0]);
  const beforeRelease = frames.filter(frame => frame.time <= releaseFrame.time);
  const setFrame = beforeRelease.reduce((best, frame) => {
    const value = jointAngle(frame, index.hip, index.knee, index.ankle) ?? 180;
    const bestValue = jointAngle(best, index.hip, index.knee, index.ankle) ?? 180;
    return value < bestValue ? frame : best;
  }, beforeRelease[0]);
  const setElbow = jointAngle(setFrame, index.shoulder, index.elbow, index.wrist);
  const releaseElbow = jointAngle(releaseFrame, index.shoulder, index.elbow, index.wrist);
  const setKnee = jointAngle(setFrame, index.hip, index.knee, index.ankle);
  const releaseKnee = jointAngle(releaseFrame, index.hip, index.knee, index.ankle);
  if ([setElbow, releaseElbow, setKnee, releaseKnee].some(value => value === null)) throw Error('AI ei saanut nivelkulmia laskettua tästä videosta. Kokeile selkeämpää sivukuvaa.');

  const shoulders = midpoint(releaseFrame.landmarks[11], releaseFrame.landmarks[12]);
  const hips = midpoint(releaseFrame.landmarks[23], releaseFrame.landmarks[24]);
  const torso = Math.max(.03, distance(shoulders, hips));
  const firstHips = midpoint(frames[0].landmarks[23], frames[0].landmarks[24]);
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
  if (elbowExtension >= 30) pluses.push(`Heittokäsi ojentuu selvästi: kyynärkulma kasvaa ${metrics.elbowExtension}°.`);
  else improvements.push(`Heittokäden ojennus jää pieneksi (${metrics.elbowExtension}°). Kokeile viedä saatto loppuun asti rennosti.`);
  if (kneeExtension >= 15) pluses.push(`Jalat osallistuvat voimantuottoon: polvikulma kasvaa ${metrics.kneeExtension}°.`);
  else improvements.push(`Jaloista tuleva ojennus näkyy heikosti (${metrics.kneeExtension}°). Hae yhtenäinen ponnistus ennen käsien viimeistelyä.`);
  if (releaseHeight >= .2) pluses.push('Ranne nousee olkapään yläpuolelle saatossa.');
  else improvements.push('Saatto jää kuvassa matalaksi. Pyri viimeistelemään heittokäsi ylös kohti koria.');
  if (timingDelay >= .12 && timingDelay <= 1.25) pluses.push(`Jalkojen latauksesta saattoon muodostuu yhtenäinen ${metrics.timingDelay} s liike.`);
  else improvements.push('Jalkojen ja heittokäden ajoitus näyttää katkonaiselta. Kokeile yhtä jatkuvaa liikettä alhaalta ylös.');
  if (bodyLean <= 25) pluses.push(`Vartalon linja pysyy melko pystynä (${metrics.bodyLean}° kallistus).`);
  else improvements.push(`Vartalo kallistuu release-vaiheessa noin ${metrics.bodyLean}°. Vertaa, säilyykö tasapaino seuraavissa toistoissa.`);
  if (bodyDrift <= .55) pluses.push('Lantion sivuttaissiirtymä pysyy pienenä analysoidussa jaksossa.');
  else improvements.push('Lantio siirtyy sivulle suhteessa vartalon kokoon. Tarkista jalkojen suunta ja tasapainoinen laskeutuminen.');

  const meanVisibility = frames.reduce((sum, frame) => sum + frameQuality(frame, hand), 0) / frames.length;
  const confidence = Math.round(Math.min(1, meanVisibility * (frames.length / input.length)) * 100);
  if (confidence < 65) cautions.push('Tunnistuksen varmuus jäi matalaksi. Älä tee tämän videon perusteella isoja tekniikkamuutoksia.');
  cautions.push('AI ei näe palloa tai koria, joten release-kohta on ranteen korkeimman pisteen arvio.');
  return {
    model: 'MediaPipe Pose Landmarker', modelVersion: '1.1.1', hand, confidence, samples: frames.length,
    windowStart: round(frames[0].time, 2), windowEnd: round(frames.at(-1)!.time, 2),
    setTime: round(setFrame.time, 2), releaseTime: round(releaseFrame.time, 2), metrics,
    pluses: pluses.slice(0, 5), improvements: improvements.slice(0, 5), cautions, releasePose: releaseFrame.landmarks,
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

export async function analyzeVideoWithPoseAi(video: HTMLVideoElement, hand: ShootingHand, startAt: number, onProgress: (progress: number, stage: string) => void) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) throw Error('Videon kestoa ei voitu lukea. Valitse toinen video.');
  const windowLength = Math.min(8, video.duration);
  const start = video.duration <= 8 ? 0 : Math.min(Math.max(0, startAt), video.duration - windowLength);
  const end = Math.min(video.duration, start + windowLength);
  const sampleCount = Math.max(8, Math.floor((end - start) * 8) + 1);
  const times = Array.from({ length: sampleCount }, (_, i) => start + (end - start) * i / Math.max(1, sampleCount - 1));
  video.pause(); onProgress(2, 'Ladataan pose-AI-mallia…');
  let landmarker: any;
  try {
    const visionModule: any = await import(/* @vite-ignore */ MODULE_URL);
    const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_URL);
    landmarker = await visionModule.PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: .5, minPosePresenceConfidence: .5, minTrackingConfidence: .5, outputSegmentationMasks: false });
    const frames: PoseFrame[] = [];
    for (let i = 0; i < times.length; i++) {
      await seekVideo(video, Math.min(times[i], Math.max(0, video.duration - .001)));
      const result = landmarker.detectForVideo(video, times[i] * 1000);
      if (result.landmarks?.[0]) frames.push({ time: times[i], landmarks: result.landmarks[0], worldLandmarks: result.worldLandmarks?.[0] });
      onProgress(8 + Math.round((i + 1) / times.length * 90), `AI analysoi videota ${i + 1}/${times.length}`);
    }
    const analysis = analyzePoseFrames(frames, hand); onProgress(100, 'Analyysi valmis'); return analysis;
  } catch (error) {
    if (error instanceof Error && /tarpeeksi|nivelet|nivelkulmia|Videoruudun/.test(error.message)) throw error;
    throw Error('AI-mallia ei saatu käynnistettyä. Tarkista verkkoyhteys ja kokeile uudelleen.');
  } finally { try { landmarker?.close(); } catch {} }
}

export function savedAiAnalysis(result: AiShotResult) {
  const { releasePose: _releasePose, ...saved } = result;
  return saved;
}
