import { angleBetween } from './model';

export type ShotPoint = { x: number; y: number };
export type MeasurementKind = 'elbow' | 'knee' | 'body';
export type ShotMeasurement = { id: string; kind: MeasurementKind; angle: number; time: number; points: ShotPoint[] };

export const measurementKinds: Record<MeasurementKind, { title: string; short: string; points: [string, string, string] }> = {
  elbow: { title: 'Heittokäden kulma', short: 'Kyynärpää', points: ['Olkapää', 'Kyynärpää', 'Ranne'] },
  knee: { title: 'Ponnistusjalan kulma', short: 'Polvi', points: ['Lonkka', 'Polvi', 'Nilkka'] },
  body: { title: 'Vartalon linja', short: 'Vartalo', points: ['Olkapää', 'Lonkka', 'Nilkka'] },
};

export function measureShotAngle(points: ShotPoint[], dimensions: { w: number; h: number }) {
  return angleBetween(points.map(point => ({ x: point.x * dimensions.w, y: point.y * dimensions.h })));
}

export function formatShotTime(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${(safe % 60).toFixed(2).padStart(5, '0')}`;
}

export function consistencyText(measurements: ShotMeasurement[], kind: MeasurementKind) {
  const values = measurements.filter(item => item.kind === kind).map(item => item.angle);
  if (values.length < 2) return 'Tallenna sama mittaus vähintään kahdesta heitosta nähdäksesi vaihtelun.';
  const spread = Math.max(...values) - Math.min(...values);
  return `${values.length} mittausta · vaihteluväli ${spread}° (${Math.min(...values)}–${Math.max(...values)}°).`;
}
