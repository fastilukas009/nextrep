const {readFileSync,readdirSync}=require('node:fs');
const {DatabaseSync}=require('node:sqlite');
const ts=require('typescript');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const sql=new DatabaseSync(':memory:');
for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+file,'utf8'));
const DB = {
  prepare(statement) {
    return {
      bind(...params) {
        const q = sql.prepare(statement);
        return {
          async first() { return q.get(...params) || null; },
          async all() { return { results: q.all(...params) }; },
          async run() { const result = q.run(...params); return { meta: { changes: Number(result.changes) } }; }
        };
      }
    };
  }
};
let user={userId:'alice',email:'test@example.invalid'};
function moduleAt(path,deps={}){const output=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const mod={exports:{}};vm.runInNewContext(output,{module:mod,exports:mod.exports,require:id=>deps[id]||require(id),Response,Request,URL,Date,Intl,crypto,console},{filename:path});return mod.exports}
const model=moduleAt('app/model.ts');
const api=moduleAt('app/api/nextrep/route.ts',{'cloudflare:workers':{env:{DB}},'../../chatgpt-auth':{getChatGPTUser:async()=>user},'../../model':model});
async function post(body){const r=await api.POST(new Request('https://nextrep.test/api/nextrep',{method:'POST',headers:{origin:'https://nextrep.test','Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:r.status,data:await r.json()}}
async function get(query=''){const r=await api.GET(new Request('https://nextrep.test/api/nextrep'+query));return {status:r.status,data:await r.json()}}
(async()=>{
assert.equal(model.angleBetween([{x:1,y:0},{x:0,y:0},{x:0,y:1}]),90);
assert.equal(model.angleBetween([{x:0,y:0},{x:0,y:0},{x:1,y:0}]),null);
user=null;assert.equal((await get()).status,401);user={userId:'alice',email:'a@example.invalid'};
assert.equal((await get()).data.entries.length,0);
let id=crypto.randomUUID();const workout={action:'entry',kind:'workout',id,data:{program:'foundation',sets:Array(6).fill(true),notes:'test'}};
assert.equal((await post(workout)).data.xp,100);assert.equal((await post(workout)).data.xp,100);
assert.equal((await post({...workout,id:crypto.randomUUID()})).data.xp,100);
assert.equal((await post({...workout,id:crypto.randomUUID(),data:{...workout.data,sets:[false]}})).status,400);
assert.equal((await post({action:'entry',id:crypto.randomUUID(),kind:'challenge',data:{challenge:'free20',made:21,attempts:20}})).status,400);
assert.equal((await post({action:'buy',item:'lime'})).status,400);
assert.equal((await post({action:'profile',data:{...model.defaultProfile,frame:'lime'}})).status,400);
// Seed one completed earlier day to test a real purchase and enforce balance/idempotency.
sql.prepare('UPDATE entries SET day=?').run('2020-01-01');await post({...workout,id:crypto.randomUUID()});
let buy=await post({action:'buy',item:'lime'});assert.equal(buy.status,200);assert.equal(buy.data.coins,0);assert.equal((await post({action:'buy',item:'lime'})).status,400);
assert.equal((await post({action:'profile',data:{...model.defaultProfile,name:'Alice',frame:'lime'}})).status,200);
const room=(await post({action:'roomCreate'})).data;assert.equal(room.hostName,'Alice');
assert.equal((await post({action:'roomStart',code:room.code})).status,400);
user={userId:'bob',email:'b@example.invalid'};assert.equal((await get()).data.entries.length,0);assert.equal((await get('?room='+room.code)).status,404);
assert.equal((await post({action:'roomJoin',code:room.code})).status,200);assert.equal((await post({action:'roomStart',code:room.code})).status,400);
user={userId:'eve',email:'e@example.invalid'};assert.equal((await post({action:'roomJoin',code:room.code})).status,409);assert.equal((await get('?room='+room.code)).status,404);
user={userId:'alice',email:'a@example.invalid'};assert.equal((await post({action:'roomStart',code:room.code})).status,200);assert.equal((await post({action:'roomShot',code:room.code,made:true})).status,400);
sql.prepare('UPDATE rooms SET starts=? WHERE code=?').run(Date.now()-10000,room.code);assert.equal((await post({action:'roomShot',code:room.code,made:true})).data.hostMade,1);
sql.prepare('UPDATE rooms SET starts=? WHERE code=?').run(Date.now()-70000,room.code);assert.equal((await post({action:'roomShot',code:room.code,made:true})).status,400);
const csrf=await api.POST(new Request('https://nextrep.test/api/nextrep',{method:'POST',headers:{origin:'https://other.test'},body:'{}'}));assert.equal(csrf.status,403);
console.log('PASS: 25 checks — authentication, privacy, reward limits, purchases, live-room access/timing, measurement and request origin.');
})().catch(e=>{console.error(e);process.exitCode=1});
