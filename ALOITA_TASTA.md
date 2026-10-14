# FastRep beta 0.2 — aloita tästä

Tässä ZIP-paketissa on nettibetan koko lähdekoodi: käyttöliittymä, palvelinreitit,
tietokannan rakenne ja migraatiot, testit, riippuvuuksien lukitustiedosto ja rakennusskriptit.
Ajantasainen lähdekoodi on tässä GitHub-repositoriossa. Sovelluksen nimi on nyt FastRep; repon osoite pysyy samana.

## Käynnistys omalla koneella

Tarvitset Node.js 24:n ja pnpm:n (projektin packageManager: pnpm@11.25.0).
Pura ZIP ja avaa nextrep-kansio esimerkiksi VS Codessa. Avaa sen terminaali.

1. Asenna riippuvuudet:

```bash
pnpm install --frozen-lockfile
```

2. Käännä projekti. Tämä muodostaa myös paikallisen tietokannan asetustiedoston:

```bash
pnpm build
```

3. Luo paikallisen tietokannan taulut kerran (suorita tämä yhtenä komentona):

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_large_bishop.sql
```

Älä aja samaa migraatiota uudelleen olemassa olevaan tietokantaan.

4. Käynnistä kehitysversio:

```bash
pnpm dev
```

Avaa terminaalin näyttämä localhost-osoite (oletuksena http://localhost:5173).
Paikallinen kehitysversio käyttää testikirjautumista: paina sovelluksen Kirjaudu-linkkiä.
Se ei tarvitse oikeaa ChatGPT-salasanaa. Paikalliset testitiedot ovat erillään julkaistun
sovelluksen tiedoista. Uusi puhdas checkout valitsee automaattisesti portable-tilan.

Nämä ovat projektin käynnistysohjeet. Uutta asennusta käyttäjän Macilla tai Windowsilla
ei ole vielä testattu. Kameran käyttö, mobiiliselaimet ja kahden oikean pelaajan live-kisa
vaativat vielä laitetestausta.

## Tärkeimmät tiedostot

- app/page.tsx — sovelluksen näkymät ja käyttöliittymätoiminnot
- app/globals.css — ulkoasu ja mobiiliasettelu
- app/model.ts — ohjelmapohjat, haasteet ja laskentatoiminnot
- app/api/nextrep/route.ts — tallennukset, palkinnot ja live-huoneet
- app/chatgpt-auth.ts — nykyisen julkaisualustan kirjautuminen
- db/schema.ts ja drizzle/ — tietokannan rakenne ja migraatiot
- tests/core.test.cjs — palvelinlogiikan ja laskennan testit
- README.md — toteutuksen kuvaus ja rajoitukset englanniksi

## Tarkistukset

```bash
node node_modules/typescript/bin/tsc --noEmit
node tests/core.test.cjs
pnpm build
```

Alkuperäisessä kehitysympäristössä TypeScript-tarkistus, tuotantokäännös ja palvelinlogiikan
testit läpäistiin. Pelkkää ZIP-vientiä varten niitä ei ajettu uudelleen.

## GitHub ja julkaisu

Lähdekoodi: https://github.com/fastilukas009/nextrep
Nettibeta: https://nextrep-beta.qwerxm.chatgpt.site

GitHub säilyttää lähdekoodin. Sovellus käyttää Sites-julkaisualustaa, Cloudflare Workersia ja D1-tietokantaa. GitHub Pages ei suorita sen palvelinreittejä. Projektin tunnus ja tietokanta on säilytetty nimenmuutoksen yhteydessä.

## Beta 0.2:n uudistukset

- FastRep-nimi, uusi etusivu ja viiden pääosion navigointi.
- Harjoittelutila sarjoille, painoille ja toistoille, treeni- ja palautusajastimet.
- Keskeneräisen treenin pienentäminen ja jatkaminen samalla sivulla.
- Aterioiden muokkaus, pikalisäys aiemmasta ateriasta sekä usean raaka-aineen laskuri.
- Päiväkohtainen ravintopäiväkirja, harjoitushistoria ja viikkonäkymä.

Keskeneräinen treeni säilyy tämän sivun muistissa, ei täyden sivupäivityksen yli. Tallennetut treenit pysyvät tietokannassa. Automaattinen ruoka- tai heittoanalyysi ei vielä ole käytössä.

## Rehellinen toteutustilanne

Toimintojen ensimmäiset toteutukset:
- profiili, harjoituspäiväkirja ja esimerkkiohjelmat
- ruokapäiväkirja ja käsin korjattavat makrot
- videon katselu, hidastus ja itse merkitty 2D-kulmamittaus
- käsin kirjatut heittohaasteet ja omat ennätykset
- kutsukoodilla toimivan live-kisan palvelinlogiikka
- XP, kolikot, saavutukset ja profiilikehysten kauppa

Vielä toteuttamatta:
- kuvan automaattinen ruoka- ja makrotunnistus
- automaattinen heittolaskenta ja tekniikka-/liikepalaute
- PT:n hyväksymät yksilölliset ohjelmat ja ruokavaliot
- opetusvideot, videovarmennetut ennätykset ja julkinen ranking
- mainokset, sponsorit ja App Store -paketointi

Kuvat ja videot pysyvät selaimessa, ellei käyttäjä lataa niitä omalle laitteelleen.
Paketissa ei ole käyttäjätietokantaa, kirjautumisistuntoja, API-avaimia,
node_modules-kansiota eikä valmiiksi rakennettua dist-kansiota.
