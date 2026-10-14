# NextRep beta 0.1 — aloita tästä

Tässä ZIP-paketissa on nettibetan koko lähdekoodi: käyttöliittymä, palvelinreitit,
tietokannan rakenne ja migraatiot, testit, riippuvuuksien lukitustiedosto ja rakennusskriptit.
Paketti vastaa julkaistun version lähdekoodia. Tämä ohje on lisätty vientiä varten.

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

## GitHubiin

Luo oma tyhjä yksityinen nextrep-repo. Kansion sisällä voit käyttää GitHub Desktopia
tai seuraavia komentoja. Korvaa OMATUNNUS omalla GitHub-tunnuksellasi.

```bash
git init -b main
git add .
git commit -m "Initial NextRep beta"
git remote add origin https://github.com/OMATUNNUS/nextrep.git
git push -u origin main
```

GitHubiin siirto tallentaa lähdekoodin. Se ei yksin julkaise sovellusta nettiin.
Tämä versio käyttää Cloudflare Workersia ja D1:tä sekä Sites-alustan kirjautumista.
Se ei toimi sellaisenaan GitHub Pagesissa, joka ei suorita näitä palvelinreittejä.
Muulle alustalle siirrettäessä pitää sovittaa kirjautuminen, tietokantayhteys ja julkaisu.
.openai/hosting.json viittaa nykyiseen NextRep-sivustoon; älä käytä sen projektitunnusta
uuden erillisen sivuston tunnuksena.

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
