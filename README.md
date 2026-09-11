# Transformation Cockpit

En ny, avgränsad produktingång för strategiskt stöd till en digitaliserings- och
transformationsportfölj. All visad verksamhetsdata är syntetisk.

## Vad det aktuella steget demonstrerar

- Ett stabilt `ChallengeId` och `InitiativeId` genom en sammanhängande referensberättelse.
- Icke-bindande effektpotential, separat per effektkategori och måttenhet.
- Befintliga förmågor, möjliggörande initiativ och verksamhetsförändringar som
  delar i en riktad förutsättningsgraf.
- En topologiskt härledd ordning som uttryckligen inte är startgodkännande.
- En strategisk jämförelse av tre initiativ med kriteriebidrag, osäkerhet och versionsbunden styrprofil.
- Interaktioner för ny potentialversion, nytt viktscenario, beroendefördjupning, ansvar och återanvänd förutsättning; samtliga går genom validerade commands.
- En kontextbunden kostnadsbild där delade kostnadsposter räknas en gång.
- Källidentiteter tillbaka till samma normaliserade grunddata.
- En ärlig gräns mot ännu ej implementerade effektåtaganden, startbeslut,
  beslutsversioner, mätpunkter, realiserad effekt och strategisk översikt.

Den äldre applikationens navigation, organisationsväljare och lokala affärsstate
används inte av den nya ingången.

## Arkitektur och avgränsad återanvändning

Applikationen är React, TypeScript och Vite. Ingången komponerar läsmodeller
genom `referenceStory` och `strategicComparison` från normaliserat `DemoState`.
Skrivningar går genom `demoReducer`; UI:t innehåller inte egna kopior av ärende-,
potential-, prioriterings-, kostnads- eller grafdata.

Följande delar återanvänds eftersom de redan har testade kontrakt som motsvarar
målmodellen:

- brandade och stabila domän-ID:n,
- organisationsneutrala entiteter och referentiell validering,
- det syntetiska värdeskapande initiativets `EffectPotential`,
- `ExecutionNode` och riktade `Dependency`-relationer,
- selectors för transitiv graf och topologisk ordning.

Reducer- och selectorlagrens tidigare tester behålls som regressionsskydd. Tester
för den avsiktligt borttagna gamla App-navigationen och dess lokala
initiativmodell har ersatts av tester för den nya ingångens identitet,
processgräns, källspårning och informationsarkitektur.

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
4. Behåll repositoryts beslutade synlighet. Ändra aldrig ett privat repository
   till offentligt för att lösa en hostingbegränsning. Välj en hostinglösning
   som uppfyller åtkomstkraven innan publicering.

Efter en lyckad körning finns webbplatsen på
`https://joben-dot.github.io/transformation-cockpit/`. Inga secrets eller egna
domäninställningar krävs.

## Nuvarande begränsningar

- Det aktuella steget stödjer endast avgränsade scenario-, potential-, ansvar- och
  förutsättningscommands; det är inte ett komplett berednings- eller beslutsflöde.
- Effektpotential är en bedömning och inget lokalt effektåtagande.
- Startbeslut, låst beslutsbaslinje, prognoser, mätpunkter, realiserad effekt,
  kontrollrum och lärande är uttryckligen inte implementerade i denna vy.
- Ingen backend, autentisering, extern AI eller integration är ansluten.
- Grundläggande responsivitet finns, men full tillgänglighets- och
  användbarhetsgranskning återstår.
