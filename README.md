# Google Tasks → Pictokaarten (DAKboard iFrame) — PoC (v2)

Wijzigingen in deze versie:
- **server.js**: Frontend wordt nu geserveerd vanaf `__dirname + '/frontend'` (fix voor Azure pad), plus uitgebreidere OAuth-foutlogging in `/auth/callback`.
- **UI verticaal**: Lijst van taken staat nu **verticaal** in plaats van een grid met meerdere kolommen.

Snelstart (zoals v1):
1. Voeg je Google OAuth-gegevens toe in `backend/.env` of als App Settings op Azure.
2. Bouw de forward-slash ZIP vanaf **`backend/`** met de `frontend/`-map erbij (zie README v1).
3. Deploy via `az webapp deploy --type zip` of Kudu ZipDeploy.



# Google Tasks → Pictokaarten (DAKboard iFrame) — PoC

Deze Proof of Concept toont Google Tasks als **grote pictokaarten** die je op een touchscreen kunt **afvinken**. 
Je kunt de webapp als **Website/iFrame** in DAKboard plaatsen.

## Belangrijkste features
- Leest en schrijft naar **Google Tasks** (afvinken/terugzetten).
- **Pictogrammen** via `picto:<sleutel>` in de **titel** of **notities** van een taak (bijv. `picto:tandenpoetsen`).
- Touch-vriendelijke UI met **grote kaarten** en **optimistische updates**.
- Eenvoudige **OAuth2** autorisatie, token lokaal opgeslagen (JSON).
- Kan gehost worden op **Azure Web Apps** of **Docker**.
  
> ⚠️ **Test-inlog vereist (eenmalig):** open de app in je browser (op de tablet), klik **Inloggen met Google** en geef toegang tot **Google Tasks**.
> Daarna blijft de sessie actief (token wordt lokaal ververst). Voor productie kun je de tokenopslag en secrets centraliseren (bijv. KeyVault).

---

## Snelstart (lokaal)
1. **Google Cloud**:
   - Maak een project, activeer **Google Tasks API**.
   - Maak een **OAuth 2.0 Client ID** (type: **Web application**).
   - Voeg **Authorized redirect URI** toe: `http://localhost:5173/auth/callback`
   - Noteer **Client ID** en **Client Secret**.

2. **.env invullen**:
   - Kopieer `backend/.env.example` naar `backend/.env` en vul waarden in.
   - Laat `PORT=5173` staan voor lokaal.

3. **Installeren & starten**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Open vervolgens: http://localhost:5173

4. **Inloggen**:
   - Klik op **Inloggen met Google** en rond de autorisatie af.
   - Je taken verschijnen als kaarten. Tik op een kaart om af te vinken / terug te zetten.

---

## DAKboard iFrame
- Host deze app (bijv. op **Azure Web Apps** met HTTPS).
- Voeg in DAKboard een **Website/iFrame**-blok toe met jouw publieke URL (bijv. `https://jouwdomein.nl`).
- Zorg dat je **eenmalig** inlogt met Google via diezelfde URL op de tablet.

---

## Azure Web Apps (kort)
1. Maak een Web App (Node 20+).
2. Stel **App Settings** in (als env vars) voor alles uit `.env`.
3. Deploy de hele map (of via Docker).
4. Pas de **redirect URI** in je Google OAuth-client aan naar je publieke URL, bijv. `https://jouwdomein.nl/auth/callback`.

---

## Docker (optioneel)
```bash
docker compose up --build
```
- De app is bereikbaar op poort 5173. Gebruik een reverse proxy met HTTPS voor DAKboard.

---

## Pictogrammen gebruiken
- Voeg `picto:<sleutel>` toe in de **titel** of **notities** van een taak. Voorbeelden:
  - `picto:tandenpoetsen`
  - `picto:aankleden`
  - `picto:ontbijt`
  - `picto:jas`
  - `picto:school`
- Mapping staat in `backend/icon-map.json`. Voeg hier eigen sleutels aan toe.
- Geen `picto:` gevonden? De app probeert emoji/keywords te herkennen en valt anders terug op een **generiek** pictogram.

---

## Bestandstructuur
```
google-tasks-picto-poc/
├─ backend/
│  ├─ server.js            # Express server + OAuth2 + API
│  ├─ tasks.js             # Google Tasks API helper
│  ├─ package.json
│  ├─ .env.example
│  ├─ icon-map.json
│  └─ tokens/              # lokale token-bestanden (gitignore)
└─ frontend/
   ├─ index.html
   ├─ app.js
   ├─ styles.css
   └─ icons/               # SVG-pictogrammen
```

---

## Veiligheid & Privacy
- Deze PoC bewaart tokens op schijf in `backend/tokens/`. Voor productie: gebruik een beveiligde opslag (bijv. Azure Key Vault) en zet de server achter HTTPS.
- Beperk toegang tot je host (firewall/IP-allowlist) als je iFrame publiek is.

---

## Veelvoorkomende issues
- **400 redirect_uri_mismatch**: De redirect-URL in Google Cloud moet exact matchen met je host, bijv. `https://jouwdomein.nl/auth/callback`.
- **CORS**: De server staat CORS toe vanaf je front-end host (`ORIGIN_ALLOWED`). Pas dit aan in `.env`.
- **Geen taken zichtbaar**: Zorg dat er taken in je **eerste lijst** staan of kies een andere `TASKS_LIST_INDEX` in `.env`.

Succes!
