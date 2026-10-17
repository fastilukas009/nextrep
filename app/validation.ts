import { z } from 'zod';
import { allPrograms, challenges } from './model';
const integer=(max=10000)=>z.number().int().min(0).max(max),label=z.string().trim().min(1).max(80);
export const schemas={
 profile:z.object({name:label,goal:z.enum(['Kokonaisvaltainen kehitys','Voima','Heittotaito','Liikkuvuus']),days:z.number().int().min(1).max(7),diet:z.enum(['Kaikki','Kasvis','Maidoton']),frame:z.enum(['default','lime','orange','purple']),macroTargets:z.object({kcal:z.number().int().min(500).max(10000),p:z.number().min(0).max(1000),c:z.number().min(0).max(2000),f:z.number().min(0).max(1000)}).optional()}),
 workout:z.object({program:z.string().refine(id => allPrograms.some(program => program.id === id), 'Tuntematon harjoitus.'),sets:z.array(z.boolean()).max(12),notes:z.string().max(500),duration:integer(86400).optional(),effort:z.number().int().min(1).max(10).nullable().optional(),logs:z.array(z.object({name:label,sets:z.array(z.object({done:z.boolean(),reps:integer(500).nullable(),weight:z.number().min(0).max(500).nullable()})).min(1).max(10)})).max(12).optional()}),skill:z.object({skill:z.enum(['crossover','hesitation','footwork'])}),
 meal:z.object({name:label,kcal:integer(10000),p:z.number().min(0).max(1000),c:z.number().min(0).max(2000),f:z.number().min(0).max(1000)}),
challenge:z.object({challenge:z.enum(['free20','minute','around']),made:integer(200),attempts:integer(200)}),review:z.object({notes:z.string().max(1000),checks:z.array(z.boolean()).max(5),angle:z.number().min(0).max(180).nullable(),duration:z.number().min(0).max(10800).optional(),measurements:z.array(z.object({id:z.string().max(100),kind:z.enum(['elbow','knee','body']),angle:z.number().min(0).max(180),time:z.number().min(0).max(10800),points:z.array(z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1)})).length(3)})).max(24).optional(),ai:z.object({model:z.literal('MediaPipe Pose Landmarker'),modelVersion:z.literal('1.1.1'),hand:z.enum(['right','left']),confidence:z.number().int().min(0).max(100),shotConfidence:z.number().int().min(0).max(100).optional(),samples:z.number().int().min(1).max(200),windowStart:z.number().min(0).max(10800),windowEnd:z.number().min(0).max(10800),setTime:z.number().min(0).max(10800),releaseTime:z.number().min(0).max(10800),metrics:z.object({elbowSet:z.number().min(0).max(180),elbowRelease:z.number().min(0).max(180),elbowExtension:z.number().min(-180).max(180),kneeSet:z.number().min(0).max(180),kneeRelease:z.number().min(0).max(180),kneeExtension:z.number().min(-180).max(180),releaseHeight:z.number().min(-10).max(10),timingDelay:z.number().min(0).max(20),bodyLean:z.number().min(0).max(180),bodyDrift:z.number().min(0).max(20)}),focus:z.object({title:z.string().max(120),cue:z.string().max(240),drill:z.string().max(260)}).optional(),pluses:z.array(z.string().max(220)).max(5),improvements:z.array(z.string().max(220)).max(5),cautions:z.array(z.string().max(220)).max(4)}).optional()}),
};

export type EntryKind = keyof Omit<typeof schemas, 'profile'>;
export function parseEntry(kind: EntryKind, raw: unknown): Record<string, any> {
 const data: any = schemas[kind].parse(raw);
 if (kind === 'challenge') {
  const challenge = challenges.find(c => c.id === data.challenge)!;
  if (data.made > data.attempts || data.attempts < 1 || (challenge.limit && data.attempts !== challenge.limit)) throw Error('Tarkista heittojen määrä.');
 }
 if (kind === 'workout') {
  const program = allPrograms.find(p => p.id === data.program)!;
  if (data.sets.length !== program.exercises.length || !data.sets.every(Boolean)) throw Error('Kirjaa harjoitteet ennen tallennusta.');
  if (data.logs && (data.logs.length !== program.exercises.length || data.logs.some((log: any, i: number) => log.name !== program.exercises[i][0] || log.sets.length !== Number(program.exercises[i][1].match(/^(\d+)\s*×/)?.[1] || 1) || !log.sets.every((set: any) => set.done)))) throw Error('Tarkista harjoituksen sarjamerkinnät.');
 }
 return data;
}
