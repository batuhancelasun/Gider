# Expense Tracker

A simple, self-hosted expense and income tracking application with a beautiful UI, similar to ExpenseOwl. Track your expenses and income with categories, tags, and monthly visualizations.

## Features

- 💰 **Expense & Income Tracking** - Track both expenses and income in one place
- 📊 **Monthly Dashboard** - Visual pie chart showing expense breakdown by category
- 📈 **Cashflow Overview** - See total income, expenses, and net balance at a glance
- 🏷️ **Categories & Tags** - Organize transactions with categories and optional tags
- 📅 **Custom Start Date** - Configure which day of the month your budget cycle starts
- 🌓 **Dark/Light Theme** - Automatic theme switching based on system preferences
- 📋 **Table View** - Detailed table view of all transactions with search
- ⚙️ **Settings Page** - Customize currency symbol, theme, and more
- 📤 **Import/Export** - Export data as CSV or import from CSV files
- 🐳 **Docker Ready** - Easy deployment with Docker and Docker Compose

## Quick Start

### Using Docker Compose

1. Clone or download this repository
2. Build and run:
   ```bash
   docker-compose up -d
   ```
3. Access the application at `http://localhost:8080`

The Docker image is automatically built and pushed to DockerHub on every push to the main/master branch via GitHub Actions.

### Building the Docker Image

#### Manual Build

```bash
docker build -t batubaba619/expense-tracker:latest .
docker push batubaba619/expense-tracker:latest
```

#### Automatic Build (GitHub Actions)

The repository includes GitHub Actions workflows that automatically build and push Docker images to DockerHub when you push to the main/master branch.

**Setup Instructions:**

1. Go to your GitHub repository settings
2. Navigate to **Secrets and variables** → **Actions**
3. Add a new secret named `DOCKERHUB_TOKEN` with your DockerHub access token
   - To create a token: DockerHub → Account Settings → Security → New Access Token
4. Push to the main/master branch and the workflow will automatically build and push the image

The image will be available at: `batubaba619/expense-tracker:latest`

### Running Locally (Without Docker)

1. Install Python 3.11 or later
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run:
   ```bash
   python app.py
   ```
4. Access the application at `http://localhost:8080`

## Usage

### Dashboard (`/`)
- View monthly income, expenses, and net balance
- See expense breakdown in a pie chart
- View recent transactions
- Add new transactions

### Table View (`/table.html`)
- View all transactions in a table
- Search and filter transactions
- Edit or delete transactions

### Settings (`/settings.html`)
- Configure currency symbol
- Set custom start date for monthly cycles
- Choose theme (light, dark, or auto)
- Manage categories
- Import/Export data as CSV

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/{id}` - Get a specific transaction
- `PUT /api/transactions/{id}` - Update a transaction
- `DELETE /api/transactions/{id}` - Delete a transaction

### Recurring Transactions
- `GET /api/recurring` - Get all recurring transactions
- `POST /api/recurring` - Create a recurring transaction
- `PUT /api/recurring/{id}` - Update a recurring transaction
- `DELETE /api/recurring/{id}` - Delete a recurring transaction

### Categories
- `GET /api/categories` - Get all categories

### Settings
- `GET /api/settings` - Get current settings
- `PUT /api/settings` - Update settings

## Data Storage

Data is stored in JSON format in the `./data` directory (or `/app/data` in Docker). The data file is automatically created on first run.

## Transaction Format

```json
{
  "id": "unique-id",
  "name": "Transaction name",
  "category": "Category name",
  "amount": -100.00,  // Negative for expenses, positive for income
  "date": "2024-01-15T00:00:00Z",
  "tags": ["tag1", "tag2"],
  "is_income": false,
  "description": "Optional description"
}
```

## CSV Import Format

CSV files must contain the following columns (case-insensitive):
- `name` - Transaction name
- `category` - Category name
- `amount` - Amount (positive for income, negative for expenses)
- `date` - Date in RFC3339 format or YYYY-MM-DD format

Example:
```csv
name,category,amount,date
"Groceries","Food",-50.00,"2024-01-15"
"Salary","Income",3000.00,"2024-01-01"
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 8080)

### Settings (via UI)

- **Currency Symbol** - Symbol to display for amounts (default: $)
- **Start Date** - Day of month when budget cycle starts (default: 1)
- **Theme** - UI theme: light, dark, or auto (default: auto)

## Development

### Project Structure

```
.
├── app.py                   # Flask application (main entry point)
├── requirements.txt         # Python dependencies
├── static/
│   ├── index.html           # Dashboard page
│   ├── table.html           # Table view page
│   ├── settings.html        # Settings page
│   ├── styles.css           # Stylesheet
│   ├── dashboard.js         # Dashboard logic
│   ├── table.js             # Table view logic
│   └── settings.js          # Settings logic
├── data/                    # Data directory (created automatically)
│   └── data.json            # JSON data storage
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

## Security Note

⚠️ **This application does not include authentication.** It is intended for personal/home use behind a reverse proxy with authentication (e.g., Authelia, Nginx Proxy Manager, etc.).

## License

MIT License

## Contributing

Contributions are welcome! Please ensure:
- Code follows the existing patterns
- Frontend uses vanilla HTML/CSS/JS (no frameworks)
- Backend uses Python with Flask
- Changes maintain simplicity

