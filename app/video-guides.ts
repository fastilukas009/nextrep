export type VideoGuide = { url: string; label: string; channel: string; language: string; note?: string };
export type ExerciseGuide = VideoGuide & {
  instruction: string;
  tracking: 'strength' | 'reps' | 'shots' | 'time';
  restSeconds: number;
};

// Primary YouTube titles/descriptions reviewed 2026-10-16. Chapter offsets below
// are taken from the publishers' chapter lists. FastRep sets/reps are our own.
const video = (id: string, label: string, channel: string, seconds = 0): VideoGuide => ({
  url: `https://www.youtube.com/watch?v=${id}${seconds ? `&t=${seconds}s` : ''}`,
  label: `Katso: ${label}`, channel, language: 'englanniksi',
});
const exercise = (id: string, label: string, channel: string, instruction: string, tracking: ExerciseGuide['tracking'] = 'reps', restSeconds = 60, seconds = 0): ExerciseGuide => ({
  ...video(id, label, channel, seconds), instruction, tracking, restSeconds,
});
const scott = 'Scott Herman';
const e3 = 'E3 Rehab';
const shot = 'Coach Tom · Shot Science';
const meech = 'Coach Meech · ILoveBasketballTV';

export const exerciseGuides: Record<string, ExerciseGuide> = {
  'Koripallon dynaaminen lämmittely': exercise('8hdqQyX8y1o', 'koripallon alkulämmittely', 'Alan Stein · Shot Science', 'Nosta lämpöä kevyellä liikkeellä. Etene videon dynaamisiin liikkeisiin ja askelluksiin omalla kaistalla. Aktivoinnit ja kevyet hypyt seuraavat tämän treenin omissa kohdissa, jos ne kuuluvat ohjelmaan.', 'time', 30),
  'Pakarasilta – aktivointi': exercise('8bbE64NuDTU', 'pakarasilta', scott, 'Nosta lantio pakaroilla, pidä kyljet hallinnassa ja laske rauhassa. Tee aktivointi kehonpainolla, älä maksimisarjana.', 'reps', 30),
  'Kevyet pogo-hypyt': exercise('8VddB27UkY4', 'pogo-hyppyjen tekniikka', 'Matthew Accetta · HSS', 'Tee matalia, kevyitä joustoja päkiöiltä. Pidä polvissa pieni jousto ja vartalo ryhdikkäänä. Lämmittelyhyppyjen tarkoitus on valmistaa, ei väsyttää.', 'reps', 45),
  'Goblet-kyykky': exercise('JO7D6GJ98wY', 'goblet-kyykky', 'Jack Hanrahan', 'Pidä paino lähellä rintaa. Kyykkää hallitusti omaan liikerataan ja nouse koko jalkapohjan kautta.', 'strength', 90),
  'Punnerrus': exercise('wxhNoKZlfY8', 'punnerrus', scott, 'Pidä pää, vartalo ja lantio samassa linjassa. Laske hallitusti. Tarvittaessa nosta kädet tukevalle korokkeelle.', 'reps', 90),
  'Käsipainosoutu': exercise('pYcpY20QaE8', 'yhden käden käsipainosoutu', scott, 'Ota tuki vakaasta penkistä. Vedä kyynärpäätä kohti lantiota ja vältä vartalon kiertämistä. Tee sarja molemmille puolille.', 'strength', 90),
  'Dead bug': exercise('BZYaCzbP09M', 'dead bug', e3, 'Ojenna vastakkaista kättä ja jalkaa rauhallisesti. Pidä kyljet ja lantio hallinnassa. Yksi toisto tarkoittaa yhtä ojennusta per puoli.', 'reps', 45),
  'Kyykkyhyppy': exercise('DeTBwEL4m7s', 'kyykkyhyppy', scott, 'Ponnista kehonpainolla ja laskeudu pehmeästi tasapainoon. Nollaa asento jokaisen hypyn välissä; kolmen hypyn sarja ei ole väsymyskisa.', 'reps', 180),
  'Vauhditon pituushyppy': exercise('CpmTk9kmdm8', 'vauhditon pituushyppy', 'Brandon Hall · STACK', 'Ponnista kahdelta jalalta eteenpäin. Laskeudu molemmille jaloille ja pysäytä liike hallitusti. Varaa riittävästi tyhjää tilaa.', 'reps', 180),
  'Sivuttaisloikka ja pito': exercise('atk4R0SclS8', 'lateral bound', 'Tim Welsh · RADCENTRE', 'Loikkaa sivulle jalalta toiselle. Pidä alastulo hetki vakaana ennen seuraavaa hyppyä. Aloita lyhyestä etäisyydestä.', 'reps', 120),
  'Nilkka – polvi seinään': exercise('KmiPXKmoUbs', 'polvi seinään', e3, 'Vie polvea hallitusti kohti seinää kantapään pysyessä lattiassa. Säädä jalan etäisyyttä niin, ettei kantapää nouse.', 'reps', 30),
  'Lonkan 90/90-kierto': exercise('ZLmzx9Un9gk', 'lonkan 90/90-liikkuvuus', 'Tom Merrick', 'Istu 90/90-asentoon ja vaihda puolta hallitusti. Tue käsillä tarvittaessa. Älä pakota polvia lattiaan.', 'reps', 30, 35),
  'Rintarangan kierto konttausasennossa': exercise('ADeGAWCDjhQ', 'rintarangan kierto', e3, 'Asetu konttausasentoon, vie käsi pään taakse ja kierrä ylävartaloa. Pidä lantio mahdollisimman paikallaan.', 'reps', 30),
  'Sivulankku': exercise('eRygfYEe1hs', 'sivulankku', e3, 'Kyynärpää olkapään alla. Nosta lantio ja pidä vartalo suorana. Tee jokaisessa sarjassa pito kummallekin puolelle.', 'time', 45),
  'Bird dog': exercise('egKWoMZ6cXM', 'bird dog', e3, 'Ojenna konttausasennosta vastakkainen käsi ja jalka. Pysäytä hetkeksi, palauta ja vaihda puolta ilman lantion kiertymistä.', 'reps', 45),
  'Bulgarialainen askelkyykky': exercise('2C-uNgKwPLE', 'bulgarialainen askelkyykky', scott, 'Takajalka on matalalla, vakaalla penkillä. Laskeudu hallitusti etujalan varaan. Aloita kehonpainolla ja lisää painoa vasta hallinnan säilyessä.', 'strength', 120),
  'Romanialainen maastaveto käsipainoilla': exercise('6T4q4iagIS8', 'käsipaino-RDL', 'Jeff Nippard', 'Vie lantiota taakse pienellä polvijoustolla. Pidä painot lähellä jalkoja ja selkä hallittuna. Palaa ylös lantiota ojentamalla.', 'strength', 120),
  'Yhden jalan pohjenousu': exercise('ORT4oJ_R8Qs', 'yhden jalan pohjenousu', scott, 'Ota kevyt tuki seinästä. Nouse päkiälle ja laske rauhassa. Tee ensin lattialla; lisäpaino on vapaaehtoinen.', 'strength', 60),
  'Käsipainopystypunnerrus': exercise('GFblCmuEE18', 'käsipainopystypunnerrus', scott, 'Istu tukevasti penkillä. Punnerra painot hallitusti ylös ilman voimakasta alaselän kaarta. Laske takaisin rauhassa.', 'strength', 90),
  'Vasarakääntö': exercise('zC3nLlEvin4', 'vasarakääntö', scott, 'Pidä kämmenet toisiaan kohti ja kyynärpäät lähellä kylkiä. Nosta ja laske painot ilman vartalon heilautusta.', 'strength', 60),
  'Ojentajapunnerrus käsipainoilla makuulla': exercise('MO_03opCc0g', 'ojentajat käsipainoilla', scott, 'Makaa tukevalla penkillä. Taivuta ja ojenna kyynärpäitä rauhallisesti. Käytä painoja, jotka pystyt laskemaan turvallisesti alas itse.', 'strength', 60),
  'Mikan-viimeistely': exercise('ho9GJkWyuYQ', 'Mikan-harjoite', 'Jordan Fliegel · CoachUp', 'Viimeistele vuorotellen korin oikealta ja vasemmalta puolelta ulommalla kädellä. Ota pallo itse kiinni. Sarjan määrä on heittoja yhteensä.', 'shots', 45),
  'Saman jalan ja käden viimeistely': exercise('aWuh9lNkMk8', 'same-leg / same-hand finish', meech, 'Harjoittele viimeistelyä saman puolen jalalta ja kädellä. Tee molemmat puolet ja ota oma levypallo. Aloita läheltä koria.', 'shots', 60, 193),
  'Eurostep-viimeistely': exercise('aWuh9lNkMk8', 'punch eurostep', meech, 'Vaihda suuntaa eurostepillä ja viimeistele hallitusti. Tee peilikuvana molemmille puolille; kuvitteellinen puolustaja riittää.', 'shots', 60, 285),
  'Drop step korin alla': exercise('4bndda2KIVA', 'drop step', shot, 'Anna itsellesi pomppusyöttö alablokissa. Ota pallo haltuun, tee pudotusaskel ja viimeistele. Videon puolustajaa ei tarvita jalkatyön harjoitteluun.', 'shots', 60),
  'Midrange viidestä paikasta': exercise('BYXRkytxlcI', 'midrange-heittosarja', 'Justin Razzano', 'Heitä viisi kertaa kustakin paikasta: molemmat kulmat, molemmat kyynärpäät ja keskeltä. Anna syöttö itsellesi ja hae levypallot itse.', 'shots', 45),
  'Yhden pompun pull-up': exercise('aWuh9lNkMk8', 'elbow dribble pull-up', meech, 'Hyökkää yhdellä pompulla kohti kyynärpäätä, pysähdy tasapainoon ja heitä. Vaihda puolta ja kuljetuskättä.', 'shots', 60, 379),
  'Midrange stepback': exercise('BYXRkytxlcI', 'midrange-stepback', 'Justin Razzano', 'Luo tilaa yhdellä hallitulla stepbackilla ja nouse heittoon tasapainosta. Tee molemmilta puolilta. Ei harjoitusparia.', 'shots', 60),
  'Kolmosen voimantuotto': exercise('prUyWk7awr8', 'jalkojen käyttö kaukoheitossa', shot, 'Yhdistä jalkojen ojennus ja heitto yhdeksi liikkeeksi. Aloita lähempää ja siirry kolmosviivalle vasta rytmin säilyessä.', 'shots', 45),
  'Kolmoset vaihtelevalla jalkatyöllä': exercise('aWuh9lNkMk8', 'three-point variable shooting', meech, 'Anna syöttö itsellesi, vaihtele heittopaikkaa ja jalkatyötä. Hae oma levypallo. Pidä tasapaino tärkeämpänä kuin kiire.', 'shots', 60, 459),
  'Vapaaheitot': exercise('DoS57RCOtCo', 'vapaaheiton kohdistusharjoite', 'Collin Castellaw · ShotMechanics', 'Tee 20 tavallista vapaaheittoa samalla valmistautumisrutiinilla. Videon 180 asteen käännös on erillinen variaatio, jota ei vaadita tässä treenissä.', 'shots', 45),
  'Seinäsyötöt': exercise('LKlxJyKflsI', 'seinäsyöttöharjoite', 'Steve Collins · Teach Hoops', 'Valitse seinästä kohde. Syötä siihen ja ota pallo hallitusti kiinni. Säädä etäisyys niin, että palautuva pallo on hallittavissa.', 'reps', 45),
  'Soolosyöttö ja kiinniotto': exercise('gm6J905nD-8', 'kolme soolosyöttöharjoitetta', 'Jesse Muench · Get Handles', 'Tee videon kolme itselle syöttämisen ja kiinnioton variaatiota: yksi variaatio per 45 sekunnin sarja. Näihin ei tarvita seinää eikä paria.', 'time', 45),
  'Puolustusliuku': exercise('D4TX7F1cnT4', 'puolustajan liikkumistekniikka', 'Gordon McLeod · FIBA', 'Liiku puolustusasennossa 3–4 metriä sivulle ja takaisin. Pidä vartalo tasapainossa. Tee sarja yksin viivojen välissä.', 'time', 60),
  'Closeout ja pysähdys': exercise('D4TX7F1cnT4', 'puolustuksen jalkatyö', 'Gordon McLeod · FIBA', 'Kiihdytä 3–5 metriä kohti merkkiä, jarruta hallitusti ja nosta käsi heiton eteen. Merkki korvaa hyökkääjän. Palaa kävellen lähtöön.', 'reps', 60),
  'Puolustuksen soolojalkatyö': exercise('3dkkDwwx8Bs', 'puolustuksen sooloharjoite', 'Charlie Miller · ATTACKBball', 'Katso videon yksin tehtävä jalkatyöharjoite kohdasta 2:23. Tee sen liikemalli rauhallisesti, sitten hallitulla pelivauhdilla. Et tarvitse puolustettavaa pelaajaa.', 'time', 60, 143),
};

export const skillGuides: Record<string, VideoGuide> = {
  crossover: video('6oa1UgVc_4U', 'crossoverin tekniikka', shot),
  hesitation: video('EyYbMJzrKYs', 'hesitation-harhautus', shot),
  footwork: { ...video('S7X5E-rtjjA', 'jump stop ja pivot', shot), note: 'Anna syöttö itsellesi ja tee pysähdys sekä pivotit ilman paria.' },
};
export const challengeGuides: Record<string, VideoGuide> = {
  free20: { ...exerciseGuides['Vapaaheitot'], note: 'Video näyttää kohdistusharjoitteen. FastRepin haasteessa heitetään 20 tavallista vapaaheittoa.' },
  minute: { ...exerciseGuides['Yhden pompun pull-up'], note: 'Video näyttää heittotekniikan. Haasteessa kirjaat omat heittosi 60 sekunnin ajan ja haet levypallot itse.' },
  around: { ...exerciseGuides['Midrange viidestä paikasta'], note: 'FastRepin haasteessa heität viisi kertaa jokaisesta viidestä paikasta. Anna syötöt itsellesi.' },
};

// Historical exercise names retain relevant guides where the movement is unchanged.
exerciseGuides['Alkulämmittely'] = exerciseGuides['Koripallon dynaaminen lämmittely'];
exerciseGuides['Heitto viidestä paikasta'] = exerciseGuides['Midrange viidestä paikasta'];
exerciseGuides['Pysähdys ja heitto'] = exerciseGuides['Yhden pompun pull-up'];
exerciseGuides['Nilkan liikkuvuus'] = exerciseGuides['Nilkka – polvi seinään'];
exerciseGuides['Lonkan avaus'] = exerciseGuides['Lonkan 90/90-kierto'];
