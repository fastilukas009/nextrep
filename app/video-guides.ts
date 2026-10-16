export type VideoGuide = {
  url: string;
  label: string;
  channel: string;
  language: string;
  note?: string;
};

// Direct video links and creator names verified with YouTube on 2026-10-16.
// These demonstrate technique; FastRep supplies the workout sets and repetitions.
function guide(id: string, label: string, channel: string, note?: string): VideoGuide {
  return { url: `https://www.youtube.com/watch?v=${id}`, label, channel, language: 'englanniksi', note };
}

export const exerciseGuides: Record<string, VideoGuide> = {
  'Alkulämmittely': guide('_sNRH65Wmuw', 'Katso lämmittelyohje', 'MadFit', 'Videolla on viiden minuutin lämmittely ilman hyppyjä.'),
  'Goblet-kyykky': guide('JO7D6GJ98wY', 'Katso goblet-kyykyn tekniikka', 'Jack Hanrahan Fitness'),
  'Punnerrus': guide('WDIpL0pjun0', 'Katso punnerruksen tekniikka', 'NASM'),
  'Käsipainosoutu': guide('YZgVEy6cmaY', 'Katso yhden käden käsipainosoutu', 'Muscle & Strength'),
  'Askelkyykky': guide('4KprDo5DT-Q', 'Katso askelkyykky eteen', 'Special Olympics'),
  'Dead bug': guide('g_BYB0R-4Ws', 'Katso dead bug -liikkeen ohje', "Children's Hospital Colorado"),
  'Alkulämmittely pallolla': guide('sbyWcggcRa8', 'Katso viiden minuutin pallolämmittely', 'TJL Training'),
  'Lähiheitot yhdellä kädellä': guide('zFZEqPFnhPA', 'Katso yhden käden heittoharjoite', 'Jr. NBA Jr. WNBA'),
  'Heitto viidestä paikasta': guide('Ae_yfNeo12c', 'Katso viiden paikan heittoharjoite', "DICK'S", 'Video näyttää heittopaikat. Tee tämän harjoituksen sarjat ja toistot.'),
  'Pysähdys ja heitto': guide('AueLd1-H1V8', 'Katso pysähdys ja heitto', 'Jr. NBA Jr. WNBA'),
  'Vapaaheitot': guide('lnuZNZPDvaY', 'Katso vapaaheiton tekniikka', 'Jr. NBA Jr. WNBA'),
  'Kevyt kävely': guide('QGj2buqFDNo', 'Katso viiden minuutin sisäkävely', 'Lucy Wyndham-Read', 'Video on vaihtoehto sisäkävelyyn. Voit myös kävellä rauhallisesti ulkona viisi minuuttia.'),
  'Nilkan liikkuvuus': guide('Y48sAE4m2Uc', 'Katso nilkan liikkuvuusharjoite', 'Peak Physio', 'Videolla polvea viedään kohti seinää kantapää maassa.'),
  'Lonkan avaus': guide('HUZimFZJZWU', 'Katso 90/90-lonkanavaus', 'Alejandro Matias', 'Videolla näytetään 90/90-lonkanavaus. Tee tämän harjoituksen toistot.'),
  'Rintarangan kierto': guide('uzpyRbwYgGA', 'Katso rintarangan kierto kylkimakuulla', 'Physio REHAB'),
  'Rauhallinen hengitys': guide('IYTZwBzjNC0', 'Katso rauhallinen hengitysharjoitus', 'NHS inform'),
};

export const skillGuides: Record<string, VideoGuide> = {
  crossover: guide('2_Nqc7eXkBM', 'Katso crossoverin perusteet', 'Jr. NBA Jr. WNBA'),
  hesitation: guide('EyYbMJzrKYs', 'Katso hesitation-harhautus', 'Shot Science Basketball'),
  footwork: guide('jgqdv9ySjYM', 'Katso pysähdys ja pivot', 'Jr. NBA Jr. WNBA', 'Katso pysähdys ja tukijalan käyttö. FastRepin harjoitteessa voit tehdä pivotit ilman paria.'),
};

export const challengeGuides: Record<string, VideoGuide> = {
  free20: { ...exerciseGuides['Vapaaheitot'], note: 'Video näyttää vapaaheiton tekniikan. Tässä haasteessa heität 20 kertaa.' },
  minute: { ...exerciseGuides['Pysähdys ja heitto'], note: 'Video näyttää heittotekniikan. FastRepin haasteessa kirjaat omat heittosi 60 sekunnin ajan.' },
  around: { ...exerciseGuides['Heitto viidestä paikasta'], note: 'Video näyttää viisi heittopaikkaa. FastRepissä heität viisi kertaa jokaisesta paikasta.' },
};
