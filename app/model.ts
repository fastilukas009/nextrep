export type Entry = {id:string;kind:string;day:string;at:number;data:Record<string,any>;xp:number;coins:number};
export type Profile = {name:string;goal:string;days:number;diet:string;frame:string};
export type AppData = {profile:Profile;entries:Entry[];xp:number;coins:number;owned:string[]};
export const defaultProfile:Profile={name:'Pelaaja',goal:'Kokonaisvaltainen kehitys',days:3,diet:'Kaikki',frame:'default'};
export const programs=[
 {id:'foundation',title:'Vahva perusta',tag:'VOIMA',minutes:35,desc:'Koko kehon harjoitus. Rauhalliset toistot, hallittu liike.',exercises:[['Alkulämmittely','5–8 min'],['Goblet-kyykky','3 × 8'],['Punnerrus','3 × 8'],['Käsipainosoutu','3 × 10 / puoli'],['Askelkyykky','2 × 8 / puoli'],['Dead bug','2 × 8 / puoli']]},
 {id:'court',title:'Heittäjän päivä',tag:'KORIPALLO',minutes:25,desc:'Lähde läheltä. Rakenna tasainen rytmi ennen etäisyyttä.',exercises:[['Alkulämmittely pallolla','5 min'],['Lähiheitot yhdellä kädellä','3 × 10'],['Heitto viidestä paikasta','5 × 5'],['Pysähdys ja heitto','3 × 6'],['Vapaaheitot','20 heittoa']]},
 {id:'reset',title:'Palauttava päivä',tag:'LIIKKUVUUS',minutes:15,desc:'Kevyttä liikettä oman tuntemuksen mukaan.',exercises:[['Kevyt kävely','5 min'],['Nilkan liikkuvuus','2 × 8 / puoli'],['Lonkan avaus','2 × 6 / puoli'],['Rintarangan kierto','2 × 6 / puoli'],['Rauhallinen hengitys','2 min']]}
];
export const skills=[
 {id:'crossover',title:'Crossover',level:'PERUSTA',steps:['Asetu tasapainoiseen asentoon ja katso eteen.','Pomputa pallo matalalta kädestä toiseen vartalon edessä.','Lisää vartaloharhautus ja ensimmäinen askel.'],task:'3 × 30 sekuntia, välissä 30 sekuntia lepoa.'},
 {id:'hesitation',title:'Hesitation',level:'RYTMI',steps:['Kuljeta rauhallisesti ja pidä pallo hallinnassa.','Nosta katsetta ja muuta rytmiä lyhyellä hidastuksella.','Kiihdytä yhdellä napakalla askeleella.'],task:'5 rauhallista toistoa molemmille puolille.'},
 {id:'footwork',title:'Pysähdys & pivot',level:'JALKATYÖ',steps:['Ota pallo kiinni tasapainoiseen kahden jalan pysähdykseen.','Valitse tukijalka ja pidä se paikoillaan.','Käänny molempiin suuntiin pallo suojattuna.'],task:'2 × 8 toistoa kummallakin tukijalalla.'}
];
export const shop=[{id:'lime',name:'Volt',desc:'Lime profiilikehys',cost:60,color:'#c8f36b'},{id:'orange',name:'Heat check',desc:'Oranssi profiilikehys',cost:120,color:'#ffa76e'},{id:'purple',name:'After hours',desc:'Violetti profiilikehys',cost:180,color:'#b9a2ff'}];
export const challenges=[{id:'free20',name:'20 vapaaheittoa',tag:'TARKKUUS',desc:'20 vapaaheittoa. Kuinka monta osuu?',limit:20,seconds:0,xp:50},{id:'minute',name:'Minuutin haaste',tag:'NOPEUS',desc:'Minuutti aikaa kerätä osumia.',limit:0,seconds:60,xp:50},{id:'around',name:'Viiden paikan heitot',tag:'VIISI PAIKKAA',desc:'Viisi heittoa jokaisesta viidestä paikasta.',limit:25,seconds:0,xp:50}];
export const foodPresets=[{name:'Kaurahiutaleet, kuivat',kcal:370,p:13,c:60,f:7},{name:'Banaani',kcal:89,p:1.1,c:23,f:0.3},{name:'Maustamaton rahka',kcal:65,p:11,c:4,f:0.3},{name:'Riisi, keitetty',kcal:130,p:2.7,c:28,f:0.3},{name:'Kana, kypsä',kcal:165,p:31,c:0,f:3.6},{name:'Tofu',kcal:130,p:14,c:1.5,f:7.5},{name:'Kasvikset',kcal:35,p:2,c:5,f:0.5}];
export function angleBetween(points:{x:number;y:number}[]){if(points.length!==3)return null;const [a,b,c]=points,u={x:a.x-b.x,y:a.y-b.y},v={x:c.x-b.x,y:c.y-b.y};const length=Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y);return length<0.000001?null:Math.round(Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/length)))*180/Math.PI);}
export function totals(list:Entry[]){return list.filter(e=>e.kind==='meal').reduce((a,e)=>({kcal:a.kcal+Number(e.data.kcal||0),p:a.p+Number(e.data.p||0),c:a.c+Number(e.data.c||0),f:a.f+Number(e.data.f||0)}),{kcal:0,p:0,c:0,f:0});}
