# Gider

A self-hosted expense and income tracker with recurring reminders, browser/PWA notifications, and a responsive SPA UI.

## Features

- 💰 **Expense & Income Tracking** — items, categories, tags, income/expense flags
- 📊 **Dashboard & Charts** — net balance, category breakdown, recent activity
- 🔔 **Notifications & PWA** — Notifications tab, browser alerts, installable PWA with service worker/manifest
- 🔁 **Recurring Transactions** — lead-time reminders and due/upcoming visibility on dashboard
- 📥 **Import/Export** — CSV in/out; itemized transaction support
- ⚙️ **Settings** — currency symbol, start day, theme, notifications toggle/lead days, Gemini API key for receipt OCR
- 🔒 **Auth** — username/password with JWT
- 🐳 **Docker Ready** — one-command up via Docker Compose

## Quick start (Docker Compose)

1) Optional: create `.env` or edit variables in [docker-compose.yml](docker-compose.yml):

```env
PORT=8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
# Optional: GEMINI_API_KEY=your_api_key
```

2) Run:

```bash
docker compose up -d
```

3) Open http://localhost:8080 and log in with the credentials above.

Data persists in the `gider-data` volume. Adjust `ports` or volume path in [docker-compose.yml](docker-compose.yml) as needed.

### Manual Docker build/push

```bash
docker build -t batubaba619/gider:latest .
docker push batubaba619/gider:latest
```

### GitHub Actions (automated build)

- Add `DOCKERHUB_TOKEN` (and optionally `DOCKERHUB_USERNAME`) as repo secrets.
- Push to main/master; the workflow builds and pushes `batubaba619/gider:latest`.

## Running locally (without Docker)

```bash
python -m venv .venv
./.venv/Scripts/activate  # Windows
pip install -r requirements.txt
python app.py
# visit http://localhost:8080
```

## API Endpoints

### Auth
- `POST /api/login` — obtain JWT

### Transactions
- `GET /api/transactions` — list
- `POST /api/transactions` — create
- `GET /api/transactions/{id}` — detail
- `PUT /api/transactions/{id}` — update
- `DELETE /api/transactions/{id}` — delete

### Recurring
- `GET /api/recurring` — list
- `POST /api/recurring` — create
- `PUT /api/recurring/{id}` — update
- `DELETE /api/recurring/{id}` — delete
- `GET /api/recurring/notifications` — due/upcoming payload for reminders

### Categories
- `GET /api/categories` — list
- `POST /api/categories` — create
- `PUT /api/categories/{id}` — update
- `DELETE /api/categories/{id}` — delete

### Settings
- `GET /api/settings` — current settings
- `PUT /api/settings` — update settings

## Data storage

- JSON files under `./data` (or `/app/data` in Docker). Auto-created on first run.
- Volume `gider-data` in Compose keeps data between restarts.

## Transaction format

```json
{
   "id": "unique-id",
   "name": "Transaction name",
   "category": "Category name",
   "amount": -100.0,
   "date": "2024-01-15T00:00:00Z",
   "tags": ["tag1", "tag2"],
   "is_income": false,
   "description": "Optional description",
   "items": [
      { "name": "Item", "quantity": 1, "price": 10 }
   ]
}
```

## CSV import format

Required columns (case-insensitive): `name`, `category`, `amount`, `date`

Example:

```csv
name,category,amount,date
"Groceries","Food",-50.00,"2024-01-15"
"Salary","Income",3000.00,"2024-01-01"
```

## Configuration

Environment variables:
- `PORT` (default 8080)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- `GEMINI_API_KEY` (optional, receipt OCR)

In-app settings: currency symbol, start day, theme (light/dark/auto), notifications enabled, notification lead days, categories, CSV import/export, Gemini key.

## PWA & notifications

- Installable PWA (manifest + service worker). Works offline for cached assets.
- Notifications tab shows due/upcoming recurring items; browser notifications if permission granted.
- Dashboard surfaces upcoming recurring items.

## Development

```
app.py                   # Flask API entrypoint
requirements.txt         # Python deps
static/
   index.html             # Shell
   app.js / router.js     # SPA wiring
   core.js                # shared helpers/auth
   views/                 # dashboard, transactions, analytics, recurring, notifications, settings, items
   sw.js                  # service worker (PWA/cache)
data/                    # JSON storage (created automatically)
Dockerfile
docker-compose.yml
Makefile
README.md
```

## Security

- JWT auth with username/password. For internet exposure, still recommend a reverse proxy (TLS, rate limits, optional SSO) in front.

## Contributing

PRs welcome! Please:
- Keep frontend vanilla HTML/CSS/JS.
- Match existing patterns and formatting.
- Preserve simplicity and PWA/offline friendliness.
- Add tests where practical and keep API/README updated.

