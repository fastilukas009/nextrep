# FastRep on julkaistu

Avaa sovellus: **https://fastilukas009.github.io/nextrep/**

Sovellus toimii ilman ChatGPT-kirjautumista. GitHub Pages on käytössä ja julkaisee **gh-pages-haaran juuresta (/)**. Asetuksia ei tarvitse enää muuttaa.

Tiedot tallentuvat tähän selaimeen. Varmuuskopion saa sovelluksesta **Oma profiili → Lataa varmuuskopio**. Live-kisat ja automaattinen laitteiden välinen synkronointi tarvitsevat erillisen palvelimen.

Koodimuutosten jälkeen suorita `pnpm build:pages`, vie lähdekoodi ja docs-kansio main-haaraan sekä docs-kansion sisältö gh-pages-haaran juureen uudessa commitissa. GitHub julkaisee gh-pages-haaran muutokset automaattisesti. Tarkemmat ohjeet ovat README.md-tiedostossa.
