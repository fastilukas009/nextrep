export type FoodMacroEstimate = {
  label: string; name: string; grams: number; kcal: number; p: number; c: number; f: number;
};

export type FoodPrediction = FoodMacroEstimate & { confidence: number };

type FoodProfile = Omit<FoodMacroEstimate, 'label'>;

const MODULE_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm';
const MODEL_ID = 'onnx-community/swin-finetuned-food101-ONNX';

// Typical restaurant/home portions. These are starting estimates, not package-label values.
export const foodProfiles: Record<string, FoodProfile> = {
  apple_pie:{name:'Omenapiirakka',grams:125,kcal:295,p:3,c:43,f:13}, baby_back_ribs:{name:'Possun ribsit',grams:250,kcal:640,p:48,c:18,f:42},
  baklava:{name:'Baklava',grams:90,kcal:385,p:6,c:43,f:22}, beef_carpaccio:{name:'Naudan carpaccio',grams:140,kcal:260,p:28,c:4,f:15},
  beef_tartare:{name:'Naudan tartar',grams:180,kcal:330,p:35,c:8,f:18}, beet_salad:{name:'Punajuurisalaatti',grams:250,kcal:270,p:7,c:28,f:15},
  beignets:{name:'Beignet-munkit',grams:120,kcal:430,p:7,c:54,f:21}, bibimbap:{name:'Bibimbap',grams:500,kcal:690,p:29,c:94,f:22},
  bread_pudding:{name:'Leipävanukas',grams:200,kcal:430,p:10,c:62,f:16}, breakfast_burrito:{name:'Aamiaisburrito',grams:330,kcal:650,p:29,c:58,f:34},
  bruschetta:{name:'Bruschetta',grams:180,kcal:320,p:9,c:45,f:12}, caesar_salad:{name:'Caesarsalaatti',grams:350,kcal:520,p:25,c:24,f:36},
  cannoli:{name:'Cannoli',grams:100,kcal:340,p:8,c:38,f:18}, caprese_salad:{name:'Caprese-salaatti',grams:280,kcal:430,p:23,c:13,f:32},
  carrot_cake:{name:'Porkkanakakku',grams:140,kcal:520,p:6,c:66,f:26}, ceviche:{name:'Ceviche',grams:250,kcal:260,p:34,c:16,f:7},
  cheesecake:{name:'Juustokakku',grams:140,kcal:480,p:9,c:40,f:32}, cheese_plate:{name:'Juustolautanen',grams:180,kcal:650,p:34,c:12,f:52},
  chicken_curry:{name:'Kanacurry',grams:420,kcal:620,p:42,c:55,f:26}, chicken_quesadilla:{name:'Kanaquesadilla',grams:300,kcal:690,p:39,c:58,f:34},
  chicken_wings:{name:'Kanansiivet',grams:300,kcal:690,p:54,c:18,f:45}, chocolate_cake:{name:'Suklaakakku',grams:140,kcal:520,p:7,c:66,f:27},
  chocolate_mousse:{name:'Suklaamousse',grams:160,kcal:430,p:7,c:40,f:28}, churros:{name:'Churrot',grams:150,kcal:560,p:8,c:72,f:27},
  clam_chowder:{name:'Simpukkakeitto',grams:350,kcal:440,p:19,c:39,f:23}, club_sandwich:{name:'Club sandwich',grams:400,kcal:780,p:43,c:66,f:39},
  crab_cakes:{name:'Rapukakut',grams:220,kcal:430,p:28,c:24,f:25}, creme_brulee:{name:'Crème brûlée',grams:150,kcal:430,p:7,c:38,f:28},
  croque_madame:{name:'Croque madame',grams:350,kcal:760,p:38,c:55,f:43}, cup_cakes:{name:'Kuppikakku',grams:100,kcal:360,p:4,c:48,f:17},
  deviled_eggs:{name:'Täytetyt kananmunat',grams:150,kcal:310,p:18,c:4,f:25}, donuts:{name:'Donitsi',grams:90,kcal:370,p:5,c:45,f:19},
  dumplings:{name:'Dumplingit',grams:250,kcal:430,p:21,c:58,f:13}, edamame:{name:'Edamamepavut',grams:180,kcal:220,p:20,c:16,f:9},
  eggs_benedict:{name:'Eggs Benedict',grams:300,kcal:650,p:28,c:39,f:43}, escargots:{name:'Etanat',grams:180,kcal:330,p:24,c:10,f:22},
  falafel:{name:'Falafel-annos',grams:300,kcal:610,p:22,c:67,f:29}, filet_mignon:{name:'Naudan sisäfilee',grams:220,kcal:520,p:58,c:4,f:30},
  fish_and_chips:{name:'Fish and chips',grams:450,kcal:960,p:46,c:105,f:40}, foie_gras:{name:'Hanhenmaksa',grams:100,kcal:460,p:12,c:5,f:44},
  french_fries:{name:'Ranskalaiset',grams:180,kcal:560,p:7,c:75,f:26}, french_onion_soup:{name:'Ranskalainen sipulikeitto',grams:380,kcal:430,p:18,c:42,f:21},
  french_toast:{name:'Köyhät ritarit',grams:250,kcal:550,p:17,c:74,f:21}, fried_calamari:{name:'Friteerattu mustekala',grams:250,kcal:570,p:31,c:54,f:25},
  fried_rice:{name:'Paistettu riisi',grams:400,kcal:650,p:20,c:94,f:22}, frozen_yogurt:{name:'Frozen yogurt',grams:200,kcal:300,p:8,c:58,f:4},
  garlic_bread:{name:'Valkosipulileipä',grams:160,kcal:520,p:13,c:65,f:23}, gnocchi:{name:'Gnocchi',grams:350,kcal:590,p:18,c:96,f:15},
  greek_salad:{name:'Kreikkalainen salaatti',grams:350,kcal:390,p:12,c:23,f:29}, grilled_cheese_sandwich:{name:'Grillattu juustoleipä',grams:220,kcal:610,p:24,c:48,f:36},
  grilled_salmon:{name:'Grillattu lohi',grams:250,kcal:520,p:55,c:4,f:31}, guacamole:{name:'Guacamole',grams:150,kcal:260,p:3,c:14,f:23},
  gyoza:{name:'Gyozat',grams:240,kcal:420,p:20,c:52,f:15}, hamburger:{name:'Hampurilainen',grams:320,kcal:720,p:37,c:52,f:40},
  hot_and_sour_soup:{name:'Hapan-tulinen keitto',grams:400,kcal:280,p:18,c:31,f:9}, hot_dog:{name:'Hot dog',grams:180,kcal:460,p:17,c:38,f:27},
  huevos_rancheros:{name:'Huevos rancheros',grams:400,kcal:620,p:28,c:61,f:30}, hummus:{name:'Hummus',grams:150,kcal:260,p:12,c:22,f:15},
  ice_cream:{name:'Jäätelö',grams:180,kcal:380,p:7,c:45,f:20}, lasagna:{name:'Lasagne',grams:400,kcal:650,p:36,c:61,f:29},
  lobster_bisque:{name:'Hummerikeitto',grams:350,kcal:430,p:20,c:25,f:28}, lobster_roll_sandwich:{name:'Hummerileipä',grams:300,kcal:620,p:32,c:52,f:32},
  macaroni_and_cheese:{name:'Mac and cheese',grams:380,kcal:720,p:28,c:82,f:31}, macarons:{name:'Macaron-leivokset',grams:75,kcal:300,p:5,c:42,f:13},
  miso_soup:{name:'Misokeitto',grams:350,kcal:120,p:8,c:14,f:4}, mussels:{name:'Sinisimpukat',grams:350,kcal:390,p:42,c:24,f:14},
  nachos:{name:'Nachot',grams:350,kcal:900,p:28,c:85,f:50}, omelette:{name:'Munakas',grams:280,kcal:430,p:31,c:8,f:31},
  onion_rings:{name:'Sipulirenkaat',grams:180,kcal:590,p:8,c:70,f:31}, oysters:{name:'Osterit',grams:180,kcal:150,p:17,c:9,f:5},
  pad_thai:{name:'Pad thai',grams:450,kcal:780,p:33,c:105,f:27}, paella:{name:'Paella',grams:450,kcal:700,p:35,c:92,f:22},
  pancakes:{name:'Pannukakut',grams:300,kcal:620,p:17,c:95,f:19}, panna_cotta:{name:'Panna cotta',grams:160,kcal:390,p:6,c:33,f:27},
  peking_duck:{name:'Pekingin ankka',grams:300,kcal:700,p:43,c:35,f:43}, pho:{name:'Pho-keitto',grams:650,kcal:590,p:38,c:72,f:17},
  pizza:{name:'Pizza',grams:400,kcal:980,p:42,c:112,f:40}, pork_chop:{name:'Porsaankyljys',grams:280,kcal:610,p:62,c:8,f:37},
  poutine:{name:'Poutine',grams:450,kcal:1050,p:28,c:108,f:56}, prime_rib:{name:'Naudan paahtokylki',grams:280,kcal:760,p:65,c:5,f:53},
  pulled_pork_sandwich:{name:'Pulled pork -leipä',grams:350,kcal:760,p:42,c:68,f:35}, ramen:{name:'Ramen',grams:650,kcal:730,p:37,c:88,f:26},
  ravioli:{name:'Ravioli',grams:380,kcal:650,p:26,c:86,f:22}, red_velvet_cake:{name:'Red velvet -kakku',grams:140,kcal:520,p:6,c:62,f:28},
  risotto:{name:'Risotto',grams:400,kcal:680,p:18,c:91,f:27}, samosa:{name:'Samosat',grams:180,kcal:480,p:12,c:58,f:22},
  sashimi:{name:'Sashimi',grams:220,kcal:330,p:48,c:7,f:12}, scallops:{name:'Kampasimpukat',grams:230,kcal:330,p:36,c:14,f:14},
  seaweed_salad:{name:'Merileväsalaatti',grams:180,kcal:160,p:4,c:22,f:7}, shrimp_and_grits:{name:'Katkarapuja ja maissipuuroa',grams:420,kcal:680,p:38,c:66,f:29},
  spaghetti_bolognese:{name:'Spaghetti bolognese',grams:500,kcal:760,p:38,c:101,f:23}, spaghetti_carbonara:{name:'Spaghetti carbonara',grams:450,kcal:850,p:36,c:91,f:38},
  spring_rolls:{name:'Kevätkääryleet',grams:220,kcal:470,p:14,c:59,f:20}, steak:{name:'Pihvi',grams:250,kcal:590,p:62,c:3,f:36},
  strawberry_shortcake:{name:'Mansikkakakku',grams:180,kcal:470,p:7,c:62,f:22}, sushi:{name:'Sushiannos',grams:350,kcal:570,p:24,c:91,f:12},
  tacos:{name:'Tacot',grams:350,kcal:720,p:35,c:67,f:35}, takoyaki:{name:'Takoyaki',grams:250,kcal:500,p:21,c:62,f:19},
  tiramisu:{name:'Tiramisu',grams:170,kcal:510,p:9,c:48,f:32}, tuna_tartare:{name:'Tonnikalatartar',grams:220,kcal:340,p:42,c:12,f:14},
  waffles:{name:'Vohvelit',grams:300,kcal:690,p:16,c:96,f:27},
};

export function scaleFoodEstimate(label: string, factor = 1): FoodMacroEstimate {
  const profile = foodProfiles[label];
  if (!profile) throw Error('Ruokalajin ravintoarviota ei löytynyt.');
  const safeFactor = Math.min(2, Math.max(.5, factor));
  return estimateFoodByGrams(label, Math.round(profile.grams * safeFactor));
}

export function estimateFoodByGrams(label: string, grams: number): FoodMacroEstimate {
  const profile = foodProfiles[label];
  if (!profile) throw Error('Ruokalajin ravintoarviota ei löytynyt.');
  if (!Number.isInteger(grams) || grams < 1 || grams > 3000) throw Error('Anna määrä väliltä 1–3000 grammaa.');
  const factor = grams / profile.grams;
  return {
    label, name: profile.name, grams, kcal: Math.round(profile.kcal * factor),
    p: Math.round(profile.p * factor * 10) / 10, c: Math.round(profile.c * factor * 10) / 10, f: Math.round(profile.f * factor * 10) / 10,
  };
}

export function searchFoodProfiles(query: string): { label: string; name: string; grams: number }[] {
  const normalized = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.length < 2) return [];
  return Object.entries(foodProfiles).filter(([label, profile]) =>
    `${label.replace(/_/g, ' ')} ${profile.name}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalized)
  ).slice(0, 8).map(([label, profile]) => ({ label, name: profile.name, grams: profile.grams }));
}

let classifierPromise: Promise<any> | null = null;
let progressListener: ((progress: number, stage: string) => void) | null = null;

async function getClassifier(onProgress: (progress: number, stage: string) => void) {
  progressListener = onProgress;
  if (!classifierPromise) classifierPromise = (async () => {
    const vision = await import(/* @vite-ignore */ MODULE_URL);
    return vision.pipeline('image-classification', MODEL_ID, {
      dtype: 'q4',
      progress_callback: (event: { status?: string; progress?: number; file?: string }) => {
        if (!progressListener) return;
        const progress = Number.isFinite(event.progress) ? Math.round(event.progress as number) : 0;
        progressListener(progress, event.status === 'progress' ? 'Ladataan ruokamallia' : event.status === 'ready' ? 'AI valmis' : 'Valmistellaan AI:ta');
      },
    });
  })().catch(error => { classifierPromise = null; throw error; });
  return classifierPromise;
}

export async function analyzeFoodPhoto(imageUrl: string, onProgress: (progress: number, stage: string) => void): Promise<FoodPrediction[]> {
  try {
    onProgress(2, 'Käynnistetään ruoka-AI');
    const classifier = await getClassifier(onProgress);
    onProgress(94, 'Tunnistetaan ruokalajia');
    const raw = await classifier(imageUrl, { top_k: 3 });
    const predictions = (Array.isArray(raw) ? raw : []).map((item: { label?: string; score?: number }) => {
      const label = String(item.label || '').toLowerCase().replace(/ /g, '_');
      if (!foodProfiles[label]) return null;
      return { ...scaleFoodEstimate(label), confidence: Math.round(Number(item.score || 0) * 100) };
    }).filter(Boolean) as FoodPrediction[];
    if (!predictions.length) throw Error('AI ei tunnistanut kuvasta tuettua ruokalajia.');
    onProgress(100, 'Makroarvio valmis');
    return predictions;
  } catch (error) {
    if (error instanceof Error && /tunnistanut|ravintoarviota/.test(error.message)) throw error;
    throw Error('Ruoka-AI:ta ei saatu käynnistettyä. Tarkista verkkoyhteys ja yritä uudelleen.');
  }
}
