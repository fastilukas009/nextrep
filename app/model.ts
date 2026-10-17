export type Entry = {id:string;kind:string;day:string;at:number;data:Record<string,any>;xp:number;coins:number};
export type MacroTargets = {kcal:number;p:number;c:number;f:number};
export type Profile = {name:string;goal:string;days:number;diet:string;frame:string;macroTargets?:MacroTargets};
export type AppData = {profile:Profile;entries:Entry[];xp:number;coins:number;owned:string[]};
export const defaultProfile:Profile={name:'Pelaaja',goal:'Kokonaisvaltainen kehitys',days:3,diet:'Kaikki',frame:'default'};
// Retained for saved workouts and backups from the first beta. Do not edit their prescriptions.
export const legacyPrograms=[
 {id:'foundation',title:'Vahva perusta',tag:'VOIMA',minutes:35,desc:'Koko kehon harjoitus. Rauhalliset toistot, hallittu liike.',exercises:[['Alkulämmittely','5–8 min'],['Goblet-kyykky','3 × 8'],['Punnerrus','3 × 8'],['Käsipainosoutu','3 × 10 / puoli'],['Askelkyykky','2 × 8 / puoli'],['Dead bug','2 × 8 / puoli']]},
 {id:'court',title:'Heittäjän päivä',tag:'KORIPALLO',minutes:25,desc:'Lähde läheltä. Rakenna tasainen rytmi ennen etäisyyttä.',exercises:[['Alkulämmittely pallolla','5 min'],['Lähiheitot yhdellä kädellä','3 × 10'],['Heitto viidestä paikasta','5 × 5'],['Pysähdys ja heitto','3 × 6'],['Vapaaheitot','20 heittoa']]},
 {id:'reset',title:'Palauttava päivä',tag:'LIIKKUVUUS',minutes:15,desc:'Kevyttä liikettä oman tuntemuksen mukaan.',exercises:[['Kevyt kävely','5 min'],['Nilkan liikkuvuus','2 × 8 / puoli'],['Lonkan avaus','2 × 6 / puoli'],['Rintarangan kierto','2 × 6 / puoli'],['Rauhallinen hengitys','2 min']]}
];
export const trainingAreas = [
 { id: 'strength', label: 'Voima', group: 'physical' },
 { id: 'explosiveness', label: 'Räjähtävyys', group: 'physical' },
 { id: 'mobility', label: 'Liikkuvuus', group: 'physical' },
 { id: 'core', label: 'Keskivartalo', group: 'physical' },
 { id: 'legs', label: 'Jalat', group: 'physical' },
 { id: 'arms', label: 'Kädet', group: 'physical' },
 { id: 'finishing', label: 'Korinalusheitot', group: 'court' },
 { id: 'midrange', label: 'Midrange', group: 'court' },
 { id: 'threepoint', label: '3PT', group: 'court' },
 { id: 'passing', label: 'Passing', group: 'court' },
 { id: 'defense', label: 'Defending', group: 'court' },
] as const;
export type TrainingArea = (typeof trainingAreas)[number]['id'];
export type TrainingProgram = {
 id: string; area: TrainingArea; group: 'physical' | 'court'; title: string; tag: string;
 minutes: number; desc: string; equipment: string; soloTip: string; exercises: [string, string][];
};
const warmup: [string, string][] = [
 ['Koripallon dynaaminen lämmittely', '5 min'],
 ['Pakarasilta – aktivointi', '1 × 12'],
 ['Kevyet pogo-hypyt', '2 × 10'],
];
export const programs: TrainingProgram[] = [
 { id:'strength',area:'strength',group:'physical',title:'Voimaa koko kehoon',tag:'VOIMA',minutes:40,
   desc:'Kyykky, työntö, veto ja keskivartalon tuki samassa treenissä.',equipment:'Käsipaino tai kahvakuula, tukeva penkki ja matto',
   soloTip:'Tee ennen työsarjoja 1–2 kevyttä harjoitussarjaa. Valitse paino, jolla jäisi noin kaksi hallittua toistoa varastoon.',
   exercises:[...warmup,['Goblet-kyykky','3 × 8'],['Punnerrus','3 × 8'],['Käsipainosoutu','3 × 10 / puoli'],['Dead bug','2 × 8 / puoli']] },
 { id:'explosiveness',area:'explosiveness',group:'physical',title:'Terävä ponnistus',tag:'RÄJÄHTÄVYYS',minutes:30,
   desc:'Ponnistusvoimaa ylös, eteen ja sivulle. Laadukkaat hypyt, kunnolliset palautukset.',equipment:'Tasainen pitävä alusta ja muutama metri vapaata tilaa',
   soloTip:'Palauta hyppysarjojen välissä 2–3 minuuttia. Lopeta sarja, jos ponnistus tai laskeutumisen hallinta selvästi heikkenee.',
   exercises:[...warmup,['Kyykkyhyppy','3 × 3'],['Vauhditon pituushyppy','3 × 3'],['Sivuttaisloikka ja pito','2 × 4 / puoli']] },
 { id:'mobility',area:'mobility',group:'physical',title:'Liikkuvuutta kentälle',tag:'LIIKKUVUUS',minutes:20,
   desc:'Nilkat, lonkat ja rintaranka liikkeelle hallitusti.',equipment:'Matto ja vapaa seinä',
   soloTip:'Liiku omalla hallitulla liikeradalla. Tämä on kevyt oma treeninsä, ei maksimaalinen venyttely ennen hyppyjä.',
   exercises:[['Koripallon dynaaminen lämmittely','5 min'],['Nilkka – polvi seinään','2 × 10 / puoli'],['Lonkan 90/90-kierto','2 × 6 / puoli'],['Rintarangan kierto konttausasennossa','2 × 8 / puoli']] },
 { id:'core',area:'core',group:'physical',title:'Vahva keskivartalo',tag:'KESKIVARTALO',minutes:20,
   desc:'Hallintaa ojennusta, kiertoa ja sivutaivutusta vastaan.',equipment:'Matto',
   soloTip:'Pidä hengitys liikkeessä ja lantio hallinnassa. Lyhennä vipuvartta tai pitoa, jos asento alkaa hajota.',
   exercises:[['Koripallon dynaaminen lämmittely','5 min'],['Dead bug','3 × 8 / puoli'],['Sivulankku','3 × 25 s / puoli'],['Bird dog','3 × 6 / puoli']] },
 { id:'legs',area:'legs',group:'physical',title:'Vahvat jalat',tag:'JALAT',minutes:40,
   desc:'Yhden jalan voimaa, takaketjua ja pohkeita koripallon kuormitukseen.',equipment:'Käsipainot, tukeva penkki ja seinä tasapainotueksi',
   soloTip:'Tee kevyet lämmittelysarjat ennen painojen nostamista. Käytä vakaata penkkiä ja tarvittaessa tukea tasapainoon.',
   exercises:[...warmup,['Bulgarialainen askelkyykky','3 × 8 / puoli'],['Romanialainen maastaveto käsipainoilla','3 × 8'],['Yhden jalan pohjenousu','3 × 12 / puoli']] },
 { id:'arms',area:'arms',group:'physical',title:'Kädet ja ylävartalo',tag:'KÄDET',minutes:35,
   desc:'Olkapäät, hauikset ja ojentajat. Hallittu liike ja sopiva kuorma.',equipment:'Käsipainot ja tukeva penkki',
   soloTip:'Aloita liikkeet kevyellä harjoitussarjalla. Valitse käsipainot, jotka saat turvallisesti alkuasentoon ja takaisin alas yksin.',
   exercises:[['Koripallon dynaaminen lämmittely','5 min'],['Käsipainopystypunnerrus','3 × 10'],['Vasarakääntö','3 × 10'],['Ojentajapunnerrus käsipainoilla makuulla','3 × 10'],['Käsipainosoutu','2 × 10 / puoli']] },
 { id:'finishing',area:'finishing',group:'court',title:'Viimeistele korin alta',tag:'KORINALUSHEITOT',minutes:35,
   desc:'Kosketus lautaan, vaihtoehtoiset ponnistukset ja post-pelin jalkatyö.',equipment:'Koripallo ja kori',
   soloTip:'Ota oma levypallo joka heiton jälkeen. Drop step alkaa itselle annetusta pomppusyötöstä. Tee kumpikin puoli; määrät tarkoittavat heittoyrityksiä.',
   exercises:[...warmup,['Mikan-viimeistely','2 × 12'],['Saman jalan ja käden viimeistely','3 × 6 / puoli'],['Eurostep-viimeistely','3 × 6 / puoli'],['Drop step korin alla','3 × 6 / puoli']] },
 { id:'midrange',area:'midrange',group:'court',title:'Midrange pelivauhdissa',tag:'MIDRANGE',minutes:35,
   desc:'Viisi heittopaikkaa, pull-up ja stepback keskimatkalta.',equipment:'Koripallo ja kori',
   soloTip:'Syötä pallo itsellesi alakierteisellä pompulla ja ota omat levypallot. Määrät ovat yrityksiä, eivät vaadittuja osumia.',
   exercises:[...warmup,['Midrange viidestä paikasta','5 × 5'],['Yhden pompun pull-up','3 × 6 / puoli'],['Midrange stepback','2 × 5 / puoli'],['Vapaaheitot','20 heittoa']] },
 { id:'threepoint',area:'threepoint',group:'court',title:'Kolmoset tasapainosta',tag:'3PT',minutes:30,
   desc:'Voimantuotto jaloista, omasta syötöstä heittäminen ja vaihteleva jalkatyö.',equipment:'Koripallo, kori ja kolmosviiva',
   soloTip:'Anna syöttö itsellesi ja hae levypallot itse. Palaa lähemmäs, jos heitto muuttuu puskemiseksi. Määrät tarkoittavat yrityksiä.',
   exercises:[...warmup,['Kolmosen voimantuotto','3 × 5'],['Kolmoset vaihtelevalla jalkatyöllä','5 × 5'],['Vapaaheitot','20 heittoa']] },
 { id:'passing',area:'passing',group:'court',title:'Syötöt ja kiinniotot',tag:'PASSING',minutes:25,
   desc:'Syöttötarkkuutta seinään ja kiinniottoja omassa liikkeessä.',equipment:'Koripallo, pallotteluun sopiva vapaa seinä ja liikkumatilaa',
   soloTip:'Seinä palauttaa syötön. Muissa harjoitteissa heität pallon itsellesi. Valitse paikka, jossa pallottelu on sallittua eikä lähellä ole ikkunoita.',
   exercises:[...warmup,['Seinäsyötöt','3 × 15'],['Soolosyöttö ja kiinniotto','3 × 45 s']] },
 { id:'defense',area:'defense',group:'court',title:'Puolustajan jalkatyö',tag:'DEFENDING',minutes:25,
   desc:'Sivuttaisliike, closeout ja suunnanvaihto ilman harjoitusparia.',equipment:'Kentän viivat tai kaksi merkkiä ja 5–10 m vapaata tilaa',
   soloTip:'Käytä viivaa tai merkkiä kuvitteellisena hyökkääjänä. Tämä treenaa liikkumista; vastustajan lukeminen ja kontaktipuolustus vaativat myös pelitilanteita.',
   exercises:[...warmup,['Puolustusliuku','4 × 20 s'],['Closeout ja pysähdys','3 × 5'],['Puolustuksen soolojalkatyö','3 × 30 s']] },
];
export const allPrograms = [...programs, ...legacyPrograms];
export const skills=[
 {id:'crossover',title:'Crossover',level:'PERUSTA',steps:['Asetu tasapainoiseen asentoon ja katso eteen.','Pomputa pallo matalalta kädestä toiseen vartalon edessä.','Lisää vartaloharhautus ja ensimmäinen askel.'],task:'3 × 30 sekuntia, välissä 30 sekuntia lepoa.'},
 {id:'hesitation',title:'Hesitation',level:'RYTMI',steps:['Kuljeta rauhallisesti ja pidä pallo hallinnassa.','Nosta katsetta ja muuta rytmiä lyhyellä hidastuksella.','Kiihdytä yhdellä napakalla askeleella.'],task:'5 rauhallista toistoa molemmille puolille.'},
 {id:'footwork',title:'Pysähdys & pivot',level:'JALKATYÖ',steps:['Anna itsellesi pomppusyöttö ja ota pallo kiinni tasapainoiseen kahden jalan pysähdykseen.','Valitse tukijalka ja pidä se paikoillaan.','Käänny molempiin suuntiin pallo suojattuna.'],task:'2 × 8 toistoa kummallakin tukijalalla.'}
];
export const shop=[{id:'lime',name:'Volt',desc:'Lime profiilikehys',cost:60,color:'#c8f36b'},{id:'orange',name:'Heat check',desc:'Oranssi profiilikehys',cost:120,color:'#ffa76e'},{id:'purple',name:'After hours',desc:'Violetti profiilikehys',cost:180,color:'#b9a2ff'}];
export const challenges=[{id:'free20',name:'20 vapaaheittoa',tag:'TARKKUUS',desc:'20 vapaaheittoa. Kuinka monta osuu?',limit:20,seconds:0,xp:50},{id:'minute',name:'Minuutin haaste',tag:'NOPEUS',desc:'Minuutti aikaa kerätä osumia.',limit:0,seconds:60,xp:50},{id:'around',name:'Viiden paikan heitot',tag:'VIISI PAIKKAA',desc:'Viisi heittoa jokaisesta viidestä paikasta.',limit:25,seconds:0,xp:50}];
export const foodPresets=[{name:'Kaurahiutaleet, kuivat',kcal:370,p:13,c:60,f:7},{name:'Banaani',kcal:89,p:1.1,c:23,f:0.3},{name:'Maustamaton rahka',kcal:65,p:11,c:4,f:0.3},{name:'Riisi, keitetty',kcal:130,p:2.7,c:28,f:0.3},{name:'Kana, kypsä',kcal:165,p:31,c:0,f:3.6},{name:'Tofu',kcal:130,p:14,c:1.5,f:7.5},{name:'Kasvikset',kcal:35,p:2,c:5,f:0.5}];
export function angleBetween(points:{x:number;y:number}[]){if(points.length!==3)return null;const [a,b,c]=points,u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};const length=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);return length<0.000001?null:Math.round(Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/length)))*180/Math.PI);}
export function totals(list:Entry[]){return list.filter(e=>e.kind==='meal').reduce((a,e)=>({kcal:a.kcal+Number(e.data.kcal||0),p:a.p+Number(e.data.p||0),c:a.c+Number(e.data.c||0),f:a.f+Number(e.data.f||0)}),{kcal:0,p:0,c:0,f:0});}
