# Google Tasks → Pictokaarten (DAKboard iFrame) — PoC (v2)

Wijzigingen in deze versie:
- **server.js**: Frontend wordt nu geserveerd vanaf `__dirname + '/frontend'` (fix voor Azure pad), plus uitgebreidere OAuth-foutlogging in `/auth/callback`.
- **UI verticaal**: Lijst van taken staat nu **verticaal** in plaats van een grid met meerdere kolommen.

Snelstart (zoals v1):
1. Voeg je Google OAuth-gegevens toe in `backend/.env` of als App Settings op Azure.
2. Bouw de forward-slash ZIP vanaf **`backend/`** met de `frontend/`-map erbij (zie README v1).
3. Deploy via `az webapp deploy --type zip` of Kudu ZipDeploy.
