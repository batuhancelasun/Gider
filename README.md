# Gider

A self-hosted expense and income tracker with recurring transactions, in-app notifications, receipt scanning, and a modern PWA interface.

## Features

- 💰 **Expense & Income Tracking** — Categories, tags, descriptions, income/expense flags
- 📊 **Dashboard & Analytics** — Net balance, category breakdown, spending trends, recent activity
- 🔔 **In-App Notifications** — Alerts for upcoming recurring transactions with read/unread states
- 🔁 **Recurring Transactions** — Automatic transaction creation with customizable frequencies
- 📷 **Receipt Scanner** — AI-powered receipt scanning with Google Gemini (extracts store, total, tax, date, category)
- 📥 **Import/Export** — CSV import and export for data portability
- ⚙️ **Settings** — Currency symbol, theme (dark/light), notification preferences, Gemini API key
- 🔒 **Authentication** — Username/password with JWT tokens
- 🐳 **Docker Ready** — One-command deployment via Docker Compose
- 📱 **PWA** — Installable progressive web app with offline support

## Quick Start (Docker Compose)

1. Optional: Create `.env` or set variables in [docker-compose.yml](docker-compose.yml):

```env
PORT=8080
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
# Optional: GEMINI_API_KEY=your_api_key
```

2. Run:

```bash
docker compose up -d
```

3. Open http://localhost:8080 and log in with your credentials.

Data persists in the `gider-data` volume.

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  gider:
    image: batubaba619/gider:latest
    container_name: gider
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - gider-data:/app/data
    environment:
      - PORT=8080
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin
      # Optional: Set your Gemini API key for receipt scanning
      # - GEMINI_API_KEY=your_api_key_here
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  gider-data:
    driver: local
```

### Manual Docker Build/Push

```bash
docker build -t batubaba619/gider:latest .
docker push batubaba619/gider:latest
```

## Running Locally (without Docker)

```bash
python -m venv .venv
./.venv/Scripts/activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py
# Visit http://localhost:5000
```

## API Endpoints

### Auth
- `POST /api/auth/register` — Create new user
- `POST /api/auth/login` — Obtain JWT token
- `GET /api/auth/me` — Get current user info

### Transactions
- `GET /api/transactions` — List all transactions
- `POST /api/transactions` — Create transaction
- `GET /api/transactions/{id}` — Get transaction
- `PUT /api/transactions/{id}` — Update transaction
- `DELETE /api/transactions/{id}` — Delete transaction

### Recurring Transactions
- `GET /api/recurring` — List recurring transactions
- `POST /api/recurring` — Create recurring transaction
- `PUT /api/recurring/{id}` — Update recurring transaction
- `DELETE /api/recurring/{id}` — Delete recurring transaction
- `GET /api/recurring/notifications` — Get due/upcoming recurring items

### Notifications
- `GET /api/notifications` — List all notifications
- `POST /api/notifications/test` — Create test notification
- `PUT /api/notifications/{id}/read` — Mark as read
- `DELETE /api/notifications/{id}` — Delete notification

### Categories
- `GET /api/categories` — List categories
- `POST /api/categories` — Create category
- `PUT /api/categories/{id}` — Update category
- `DELETE /api/categories/{id}` — Delete category

### Settings
- `GET /api/settings` — Get settings
- `PUT /api/settings` — Update settings

### Receipt Scanner
- `POST /api/scan-receipt` — Scan receipt image (requires Gemini API key)

## Data Storage

- JSON files stored in `./data` (or `/app/data` in Docker)
- Created automatically on first run
- Volume `gider-data` persists data between container restarts

## Transaction Format

```json
{
  "id": "unique-id",
  "name": "Transaction name",
  "category": "Category name",
  "amount": -100.0,
  "date": "2024-01-15T00:00:00Z",
  "tags": ["tag1", "tag2"],
  "is_income": false,
  "description": "Optional description"
}
```

## CSV Import Format

Required columns (case-insensitive): `name`, `category`, `amount`, `date`

```csv
name,category,amount,date
"Groceries","Food & Dining",-50.00,"2024-01-15"
"Salary","Salary",3000.00,"2024-01-01"
```

## Configuration

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 (8080 in Docker) | Server port |
| `ADMIN_USERNAME` | - | Auto-create admin user |
| `ADMIN_PASSWORD` | - | Admin user password |
| `GEMINI_API_KEY` | - | Google Gemini API key for receipt scanning |
| `JWT_SECRET_KEY` | dev-secret-key | JWT signing key (change in production!) |

### In-App Settings
- Currency symbol (€, $, £, etc.)
- Theme (dark/light)
- Notifications enabled/disabled
- Gemini API key for receipt scanning
- Custom categories

## Receipt Scanner

The receipt scanner uses Google Gemini AI to extract:
- **Store name** — Merchant/store name
- **Subtotal** — Price before tax
- **Tax** — VAT/sales tax amount
- **Total** — Final amount (subtotal + tax)
- **Date** — Transaction date
- **Category** — Auto-matched to your categories

To use: Add your Gemini API key in Settings → Receipt Scanner section.

## Project Structure

```
app.py                   # Flask API server
requirements.txt         # Python dependencies
static/
  index.html             # SPA shell
  app.js                 # Route definitions
  router.js              # Client-side router
  core.js                # Shared utilities & auth
  styles.css             # Styling (dark/light themes)
  views/                 # View modules
    dashboard.js
    transactions.js
    analytics.js
    recurring.js
    notifications.js
    settings.js
    auth.js
  sw.js                  # Service worker (PWA)
  manifest.json          # PWA manifest
data/                    # JSON storage (auto-created)
Dockerfile
docker-compose.yml
```

## Security Notes

- JWT authentication with 30-day token expiry
- Passwords hashed with Werkzeug's secure hashing
- For internet exposure, use a reverse proxy with TLS (nginx, Caddy, Traefik)
- Change `JWT_SECRET_KEY` in production!

## Contributing

PRs welcome! Please:
- Keep frontend vanilla HTML/CSS/JS (no frameworks)
- Match existing code style and patterns
- Preserve PWA/offline functionality
- Update README for API changes

## License

MIT

 
 