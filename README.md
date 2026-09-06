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

Den gemensamma grunden under `src/domain`, `src/application` och `src/demo-data`
är ren TypeScript och inför brandade ID:n, normaliserat `DemoState`, validerade
commands, en atomär reducer och rena selectors. Det befintliga presentationslagret
behålls under etapp 1 och migreras stegvis i senare, separat verifierade etapper.

Etapp 2 använder samma grund för sex härledda kvalificeringsområden, styrda
kompletteringskrav, icke-bindande effektpotential och versionsbunden, transparent
prioritering med ett separat mänskligt ställningstagande.

Etapp 3 utökar samma normaliserade state med en riktad förutsättningsgraf,
topologiskt härledd genomförandeordning, tidsatt kapacitetsanalys och spårbara
kostnadsursprung. Scenariobunden kostnadsallokering fördelar en befintlig kostnad
och skapar ingen ny. Startbeslut, effektåtaganden och effektutfall ingår ännu inte
i den nya arkitekturen.

Kostnadsberäkningen skiljer investeringens ursprung från enskilda ekonomiska
poster. Faktiska delutfall summeras, medan bara den senaste versionen av samma
bedömning används. Återkommande årsbelopp projiceras endast när ett uttryckligt
tidsintervall har angetts, och då endast för hela kalenderår. Utan sådan horisont
visas beloppet som ett oprojicerat årsbelopp. Allokering avrundas till hela kronor
och sista mottagaren får deterministiskt återstående belopp.

Om en vald horisont innehåller delår returnerar kostnadsselectorn en ofullständig
beräkning med beräknad helårsdel, obehandlad period, anledning och källreferenser.
Kapacitetsunderlag väljs genom explicita ersättningsrelationer; motstridiga
överlappande underlag utan sådan relation redovisas som `UNKNOWN` och väljs aldrig
automatiskt efter högsta eller lägsta värde.

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
- Etapp 1–3 har enkla command-drivna formulärflöden; senare arbetsytor är tydligt märkta platshållare utan frikopplade resultat.
- Behörigheter, autentisering, notifieringar, export, API-integrationer och revisionslogg ingår inte.
- Prioriteringspoäng och effekter är demonstrativa, inte en validerad kommunal beräkningsmodell. Deltagarscenariot skiljer mellan fast, organisationsspecifik och deltagarskalande kostnad.
- Alternativkostnaden, den tekniska skulden och andra följder för en kommun som väljer att stå utanför modelleras inte i denna iteration; det är en framtida modellfråga.
- Prototypen har grundläggande responsivitet men har ännu inte genomgått en fullständig tillgänglighetsgranskning eller användartestning.
