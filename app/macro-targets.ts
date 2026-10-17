import type { MacroTargets } from './model';

export function calculateCarbs(kcal: number, protein: number, fat: number) {
  return Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
}

export function macroCalories(targets: Pick<MacroTargets, 'p' | 'c' | 'f'>) {
  return Math.round(targets.p * 4 + targets.c * 4 + targets.f * 9);
}

export function targetProgress(value: number, target?: number) {
  return target ? Math.min(100, Math.max(0, value / target * 100)) : 0;
}

export function remainingText(value: number, target: number, unit: string) {
  const difference = Math.round(target - value);
  return difference >= 0 ? `${difference} ${unit} jäljellä` : `${Math.abs(difference)} ${unit} yli`;
}
