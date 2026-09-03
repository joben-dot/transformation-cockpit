# Transformation Cockpit

En körbar prototyp för effektstyrd verksamhetstransformation i en **fiktiv svensk kommun**. All information i applikationen är syntetisk och får inte betraktas som verkliga verksamhetsdata.

## Vad prototypen demonstrerar

- En ledningsvy med största möjlighet, uppnådd effekt, effekt i risk, aktuella beslut och blockerade initiativ.
- Ett sammanhängande transformationsflöde: **problem → kvalificering → prioritering → initiativ/program → förändrat arbetssätt → mätbar effekt → återbruk/skala**.
- Kvalificering av verksamhetens utmaningar innan lösningar bestäms.
- Portföljprioritering utifrån effekt, kostnad, brådska, strategisk relevans, återbrukspotential och risk, med rekommendationerna `STARTA`, `UTRED`, `VÄNTA` och `STOPPA`.
- Exempelprogrammet **125/75**, dess gemensamma effektmål och kopplade initiativ.
- Initiativstyrning med effekthypotes, ägare, tvärfunktionellt team, experiment, nästa beslut, blockering, mandatbehov och tid till nästa mätbara resultat.
- En tydlig effektkedja som skiljer aktivitet/output från förändrat arbetssätt, verksamhetsutfall och ekonomi/produktivitet.

## Arkitektur

Prototypen är en responsiv single-page application byggd med **React**, **TypeScript** och **Vite**. Navigering och demo-interaktioner hanteras lokalt i React utan router eller backend. Ikoner kommer från `lucide-react`; all verksamhetsdata ligger som statisk, syntetisk demodata i klienten.

## Kör lokalt

Krav: Node.js 20 eller senare.

```bash
npm install
npm run dev
```

Öppna adressen som Vite visar, normalt `http://localhost:5173`.

Produktionsbygge och kodkontroll:

```bash
npm run build
npm run lint
```

Ett byggt paket kan förhandsvisas med `npm run preview`.

## Publicering på Netlify

Det vanliga produktionsbygget använder basvägen `/` och kan därför publiceras
direkt på Netlify. Skapa distributionsfilerna med `npm run build` och publicera
innehållet i katalogen `dist` (inte själva katalogen som en extra mappnivå).

## Publicering på GitHub Pages

Webbplatsen publiceras automatiskt från `main` med GitHub Actions-arbetsflödet
`.github/workflows/deploy-pages.yml`. Arbetsflödet bygger applikationen och publicerar
innehållet i `dist` till GitHub Pages. Eftersom GitHub Pages ligger under repots
undermapp anger arbetsflödet den särskilda basvägen vid byggtillfället. Det kan
också startas manuellt från fliken **Actions** i GitHub.

För att aktivera publiceringen i `joben-dot/transformation-cockpit`:

1. Öppna **Settings → Pages** i GitHub-repot.
2. Under **Build and deployment**, välj **GitHub Actions** som källa.
3. Slå ihop ändringarna till `main`, eller starta arbetsflödet **Deploy to GitHub
   Pages** manuellt från **Actions**.
4. Om repot är privat behöver kontots GitHub-plan tillåta Pages för privata repon.
   Gör annars repot publikt under **Settings → General → Danger Zone → Change
   repository visibility**.

Efter en lyckad körning finns webbplatsen på
`https://joben-dot.github.io/transformation-cockpit/`. Inga secrets eller egna
domäninställningar krävs.

## Nuvarande begränsningar

- All data är syntetisk och lagras enbart i klientkoden; ändringar sparas inte.
- Knappar för att skapa och redigera objekt är visuella prototypytor och saknar formulärflöden.
- Behörigheter, autentisering, notifieringar, export, API-integrationer och revisionslogg ingår inte.
- Prioriteringspoäng och effekter är demonstrativa, inte en validerad kommunal beräkningsmodell.
- Prototypen har grundläggande responsivitet men har ännu inte genomgått en fullständig tillgänglighetsgranskning eller användartestning.
