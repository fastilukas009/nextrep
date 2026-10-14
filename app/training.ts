import { programs } from './model';

export type Program = (typeof programs)[number];
export type LoggedSet = { done: boolean; reps: string; weight: string };
export type ExerciseLog = { name: string; sets: LoggedSet[] };
export type WorkoutDraft = {
  id: string; program: Program; logs: ExerciseLog[]; current: number;
  notes: string; effort: number; elapsed: number; runningSince: number | null;
};
export function makeLogs(program: Program): ExerciseLog[] {
  return program.exercises.map(([name, prescription]) => {
    const match = prescription.match(/^(\d+)\s*×\s*(\d+)/);
    const reps = match?.[2] ?? (prescription.includes('heittoa') ? prescription.match(/\d+/)?.[0] ?? '' : '');
    return { name, sets: Array.from({ length: match ? Number(match[1]) : 1 }, () => ({ done: false, reps, weight: '' })) };
  });
}
export function sessionProgress(logs: ExerciseLog[]) {
  const sets = logs.flatMap(log => log.sets);
  const complete = sets.filter(set => set.done).length;
  return { complete, total: sets.length, finished: sets.length > 0 && complete === sets.length };
}
export function elapsedSeconds(draft: WorkoutDraft, now: number) {
  return Math.max(0, Math.floor(draft.elapsed + (draft.runningSince === null ? 0 : (now - draft.runningSince) / 1000)));
}
export const timerText = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
