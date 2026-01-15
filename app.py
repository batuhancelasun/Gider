from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
import uuid
import base64
import re
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__, static_folder='static')
CORS(app)

DATA_DIR = Path('./data')
USERS_FILE = DATA_DIR / 'users.json'

# Configuration
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-this')

# Default categories with icons
DEFAULT_CATEGORIES = [
    {'id': '1', 'name': 'Food & Dining', 'icon': 'food', 'type': 'expense'},
    {'id': '2', 'name': 'Transportation', 'icon': 'transport', 'type': 'expense'},
    {'id': '3', 'name': 'Shopping', 'icon': 'shopping', 'type': 'expense'},
    {'id': '4', 'name': 'Bills & Utilities', 'icon': 'utilities', 'type': 'expense'},
    {'id': '5', 'name': 'Entertainment', 'icon': 'entertainment', 'type': 'expense'},
    {'id': '6', 'name': 'Health', 'icon': 'health', 'type': 'expense'},
    {'id': '7', 'name': 'Education', 'icon': 'education', 'type': 'expense'},
    {'id': '8', 'name': 'Travel', 'icon': 'travel', 'type': 'expense'},
    {'id': '9', 'name': 'Rent', 'icon': 'rent', 'type': 'expense'},
    {'id': '10', 'name': 'Insurance', 'icon': 'insurance', 'type': 'expense'},
    {'id': '11', 'name': 'Subscriptions', 'icon': 'subscriptions', 'type': 'expense'},
    {'id': '12', 'name': 'Clothing', 'icon': 'clothing', 'type': 'expense'},
    {'id': '13', 'name': 'Salary', 'icon': 'salary', 'type': 'income'},
    {'id': '14', 'name': 'Freelance', 'icon': 'freelance', 'type': 'income'},
    {'id': '15', 'name': 'Investment', 'icon': 'investment', 'type': 'income'},
    {'id': '16', 'name': 'Gift', 'icon': 'gift', 'type': 'income'},
    {'id': '17', 'name': 'Savings', 'icon': 'savings', 'type': 'income'},
    {'id': '18', 'name': 'Other', 'icon': 'other', 'type': 'both'}
]


def normalize_item_name(name: str) -> str:
    """Return a title-cased item name for consistent storage/display."""
    return name.strip().title() if name else ''

def ensure_data_dir():
    """Create data directory if it doesn't exist"""
    DATA_DIR.mkdir(exist_ok=True)

# --- User Management ---

def load_users():
    ensure_data_dir()
    if not USERS_FILE.exists():
        return {}
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_users(users):
    ensure_data_dir()
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2)

def get_user_data_file(user_id):
    return DATA_DIR / f'data_{user_id}.json'

# --- Auth Decorator ---

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(current_user_id, *args, **kwargs)
    return decorated

# --- Data Management ---

def load_data(user_id):
    """Load data from JSON file for specific user"""
    ensure_data_dir()
    user_file = get_user_data_file(user_id)
    
    if not user_file.exists():
        # Initialize new user data
        return {
            'transactions': [],
            'recurring_transactions': [],
            'categories': DEFAULT_CATEGORIES.copy(),
            'items': [],
            'notifications': [],
            'settings': {
                'currency_symbol': '$',
                'start_date': 1,
                'theme': 'dark',
                'gemini_api_key': '',
                'notifications_enabled': True
            }
        }
    
    with open(user_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Ensure structure (migrations)
    if not data.get('categories'):
        data['categories'] = DEFAULT_CATEGORIES.copy()
    if 'items' not in data:
        data['items'] = []
    if 'notifications' not in data:
        data['notifications'] = []
    if 'settings' not in data:
        data['settings'] = {
            'currency_symbol': '$',
            'start_date': 1,
            'theme': 'dark',
            'gemini_api_key': '',
            'notifications_enabled': True,
            'notifications_lead_days': 3
        }
    else:
        data['settings'].setdefault('notifications_enabled', True)
    
    return data

def save_data(user_id, data):
    """Save data to JSON file for specific user"""
    ensure_data_dir()
    user_file = get_user_data_file(user_id)
    with open(user_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=str)

def process_recurring_transactions(user_id):
    """Check and create transactions for due recurring items"""
    data = load_data(user_id)
    today = datetime.now().date()
    created = []
    
    for rt in data['recurring_transactions']:
        if not rt.get('is_active', True):
            continue
            
        last_processed = rt.get('last_processed')
        if last_processed:
            last_date = datetime.fromisoformat(last_processed.replace('Z', '')).date()
        else:
            last_date = None
        
        next_date = calculate_next_date(rt, last_date)
        
        while next_date and next_date <= today:
            # Create transaction
            transaction = {
                'id': str(uuid.uuid4()),
                'name': rt['name'],
                'amount': rt['amount'],
                'category': rt['category'],
                'is_income': rt.get('is_income', False),
                'date': next_date.isoformat(),
                'description': f"Recurring: {rt.get('description', '')}",
                'recurring_id': rt['id']
            }
            data['transactions'].append(transaction)
            created.append(transaction)
            
            # Update last processed
            rt['last_processed'] = next_date.isoformat()
            last_date = next_date
            next_date = calculate_next_date(rt, last_date)
    
    if created:
        save_data(user_id, data)
    
    return created

def calculate_next_date(rt, last_date):
    """Calculate next occurrence date for recurring transaction"""
    frequency = rt.get('frequency', 'monthly')
    start_date = datetime.fromisoformat(rt.get('start_date', datetime.now().isoformat()).replace('Z', '')).date()
    end_date = rt.get('end_date')
    if end_date:
        end_date = datetime.fromisoformat(end_date.replace('Z', '')).date()
    
    if last_date is None:
        next_date = start_date
    else:
        if frequency == 'daily':
            next_date = last_date + timedelta(days=1)
        elif frequency == 'weekly':
            next_date = last_date + timedelta(weeks=1)
        elif frequency == 'biweekly':
            next_date = last_date + timedelta(weeks=2)
        elif frequency == 'monthly':
            # Add one month
            month = last_date.month + 1
            year = last_date.year
            if month > 12:
                month = 1
                year += 1
            day = min(last_date.day, [31, 29 if year % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
            next_date = last_date.replace(year=year, month=month, day=day)
        elif frequency == 'yearly':
            next_date = last_date.replace(year=last_date.year + 1)
        else:
            return None
    
    if end_date and next_date > end_date:
        return None
    
    return next_date


def next_occurrence(rt):
    """Calculate next occurrence date (date) for a recurring transaction."""
    last_processed = rt.get('last_processed')
    last_date = None
    if last_processed:
        last_date = datetime.fromisoformat(last_processed.replace('Z', '')).date()
    return calculate_next_date(rt, last_date)


def create_notification(current_user_id, title, body, notification_type='info'):
    """Create an in-app notification for the user."""
    data = load_data(current_user_id)
    notification = {
        'id': str(uuid.uuid4()),
        'title': title,
        'body': body,
        'type': notification_type,
        'read': False,
        'created_at': datetime.utcnow().isoformat(),
        'deleted_at': None
    }
    data['notifications'].append(notification)
    save_data(current_user_id, data)
    return notification


def sync_recurring_notifications(current_user_id):
    """Auto-generate notifications for due/upcoming recurring transactions.
    Called daily to create notifications for upcoming transactions."""
    if not load_data(current_user_id).get('settings', {}).get('notifications_enabled', True):
        return
    
    data = load_data(current_user_id)
    today = datetime.now().date()
    horizon = today + timedelta(days=7)  # 7-day horizon for notifications
    
    # Get all active recurring transactions due within 7 days
    for rt in data.get('recurring_transactions', []):
        if not rt.get('is_active', True):
            continue
        
        next_date = next_occurrence(rt)
        if not next_date:
            continue
        
        # Skip if already past
        if next_date < today:
            continue
        
        # Only create notification if within horizon
        if next_date > horizon:
            continue
        
        # Check if notification already exists for this recurring transaction on this date
        existing = [n for n in data.get('notifications', []) 
                   if not n.get('deleted_at') and 
                   n.get('type') == 'recurring' and
                   n.get('recurring_id') == rt['id'] and
                   n.get('notification_date') == next_date.isoformat()]
        
        if existing:
            continue  # Already notified for this date
        
        # Create notification
        amount_text = f"€{abs(rt.get('amount', 0))}" if rt.get('is_income') else f"-€{abs(rt.get('amount', 0))}"
        category = rt.get('category', 'Other')
        frequency = rt.get('frequency', 'monthly')
        
        days_until = (next_date - today).days
        if days_until == 0:
            time_text = "Today"
        elif days_until == 1:
            time_text = "Tomorrow"
        else:
            time_text = f"In {days_until} days"
        
        title = f"{rt.get('name', 'Transaction')} due {time_text}"
        body = f"{amount_text} • {category} • {frequency}"
        
        notification = {
            'id': str(uuid.uuid4()),
            'title': title,
            'body': body,
            'type': 'recurring',
            'recurring_id': rt['id'],
            'notification_date': next_date.isoformat(),
            'read': False,
            'created_at': datetime.utcnow().isoformat(),
            'deleted_at': None
        }
        data['notifications'].append(notification)
    
    save_data(current_user_id, data)

# --- Auth Routes ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    users = load_users()
    if username in users:
        return jsonify({'error': 'Username already exists'}), 400
        
    user_id = str(uuid.uuid4())
    users[username] = {
        'id': user_id,
        'password': generate_password_hash(password)
    }
    save_users(users)
    
    # If this is the first user or we want to migrate old data:
    # Check if old data.json exists and not assigned
    old_data_file = DATA_DIR / 'data.json'
    new_data_file = get_user_data_file(user_id)
    if old_data_file.exists() and not new_data_file.exists():
        # Simple migration: rename/copy old data to new user
        # In a real multi-user env, we might only do this for the *first* registered user
        # For now, let's just do it if the user doesn't have data yet.
        # But wait, if 2nd user registers, they shouldn't inherit the data.
        # Let's verify if any user exists at all initially.
        if len(users) == 1:
             import shutil
             shutil.copy(old_data_file, new_data_file)
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    users = load_users()
    user = users.get(username)
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.utcnow() + timedelta(days=30)
    }, JWT_SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': {'username': username, 'id': user['id']}
    })

@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user(current_user_id):
    # Find username from id (inefficient but simple)
    users = load_users()
    for username, data in users.items():
        if data['id'] == current_user_id:
            return jsonify({'username': username, 'id': current_user_id})
    return jsonify({'error': 'User not found'}), 404

# --- API Routes ---

@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions(current_user_id):
    """Get all transactions"""
    process_recurring_transactions(current_user_id)
    data = load_data(current_user_id)
    return jsonify(data['transactions'])

@app.route('/api/transactions', methods=['POST'])
@login_required
def create_transaction(current_user_id):
    """Create a new transaction"""
    data = load_data(current_user_id)
    transaction = request.json
    
    if 'id' not in transaction or not transaction['id']:
        transaction['id'] = str(uuid.uuid4())
    
    if 'date' not in transaction or not transaction['date']:
        transaction['date'] = datetime.utcnow().isoformat() + 'Z'
    
    # Handle items if present
    if 'items' in transaction and transaction['items']:
        normalized_items = []
        for item in transaction['items']:
            item_name = normalize_item_name(item.get('name', ''))
            item_record = {
                'id': str(uuid.uuid4()),
                'name': item_name,
                'quantity': item.get('quantity', 1),
                'price': item.get('price', 0),
                'transaction_id': transaction['id'],
                'store': transaction.get('name', ''),
                'category': transaction.get('category', ''),
                'date': transaction['date']
            }
            normalized_items.append({**item, 'name': item_name})
            data['items'].append(item_record)
        transaction['items'] = normalized_items
    
    data['transactions'].append(transaction)
    save_data(current_user_id, data)
    return jsonify(transaction), 201

@app.route('/api/transactions/<transaction_id>', methods=['GET'])
@login_required
def get_transaction(current_user_id, transaction_id):
    """Get a specific transaction"""
    data = load_data(current_user_id)
    for transaction in data['transactions']:
        if transaction['id'] == transaction_id:
            return jsonify(transaction)
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/transactions/<transaction_id>', methods=['PUT'])
@login_required
def update_transaction(current_user_id, transaction_id):
    """Update a transaction"""
    data = load_data(current_user_id)
    updated_transaction = request.json
    updated_transaction['id'] = transaction_id
    
    for i, transaction in enumerate(data['transactions']):
        if transaction['id'] == transaction_id:
            # Preserve existing items when none are provided
            incoming_items = updated_transaction.get('items') if 'items' in updated_transaction else transaction.get('items', [])

            if 'items' in updated_transaction:
                # Remove old items for this transaction
                data['items'] = [itm for itm in data['items'] if itm.get('transaction_id') != transaction_id]

                normalized_items = []
                for item in incoming_items or []:
                    item_name = normalize_item_name(item.get('name', ''))
                    item_record = {
                        'id': str(uuid.uuid4()),
                        'name': item_name,
                        'quantity': item.get('quantity', 1),
                        'price': item.get('price', 0),
                        'transaction_id': transaction_id,
                        'store': updated_transaction.get('name', transaction.get('name', '')),
                        'category': updated_transaction.get('category', transaction.get('category', '')),
                        'date': updated_transaction.get('date', transaction.get('date'))
                    }
                    normalized_items.append({**item, 'name': item_name})
                    data['items'].append(item_record)

                updated_transaction['items'] = normalized_items
            else:
                updated_transaction['items'] = incoming_items

            data['transactions'][i] = updated_transaction
            save_data(current_user_id, data)
            return jsonify(updated_transaction)
    
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
@login_required
def delete_transaction(current_user_id, transaction_id):
    """Delete a transaction"""
    data = load_data(current_user_id)
    data['transactions'] = [t for t in data['transactions'] if t['id'] != transaction_id]
    # Also delete associated items
    data['items'] = [i for i in data['items'] if i.get('transaction_id') != transaction_id]
    save_data(current_user_id, data)
    return '', 204

@app.route('/api/recurring', methods=['GET'])
@login_required
def get_recurring_transactions(current_user_id):
    """Get all recurring transactions"""
    data = load_data(current_user_id)
    return jsonify(data['recurring_transactions'])

@app.route('/api/recurring', methods=['POST'])
@login_required
def create_recurring_transaction(current_user_id):
    """Create a new recurring transaction"""
    data = load_data(current_user_id)
    rt = request.json
    
    if 'id' not in rt or not rt['id']:
        rt['id'] = str(uuid.uuid4())
    
    if 'is_active' not in rt:
        rt['is_active'] = True
    
    data['recurring_transactions'].append(rt)
    save_data(current_user_id, data)
    return jsonify(rt), 201

@app.route('/api/recurring/<transaction_id>', methods=['PUT'])
@login_required
def update_recurring_transaction(current_user_id, transaction_id):
    """Update a recurring transaction"""
    data = load_data(current_user_id)
    updated_rt = request.json
    updated_rt['id'] = transaction_id
    
    for i, rt in enumerate(data['recurring_transactions']):
        if rt['id'] == transaction_id:
            data['recurring_transactions'][i] = updated_rt
            save_data(current_user_id, data)
            return jsonify(updated_rt)
    
    return jsonify({'error': 'Recurring transaction not found'}), 404

@app.route('/api/recurring/<transaction_id>', methods=['DELETE'])
@login_required
def delete_recurring_transaction(current_user_id, transaction_id):
    """Delete a recurring transaction"""
    data = load_data(current_user_id)
    data['recurring_transactions'] = [rt for rt in data['recurring_transactions'] if rt['id'] != transaction_id]
    save_data(current_user_id, data)
    return '', 204


@app.route('/api/recurring/notifications', methods=['GET'])
@login_required
def get_recurring_notifications(current_user_id):
    """Return recurring transactions that are due today or coming up soon."""
    data = load_data(current_user_id)
    today = datetime.now().date()
    horizon = today + timedelta(days=7)  # Fixed 7-day horizon

    due = []
    upcoming = []

    for rt in data['recurring_transactions']:
        if not rt.get('is_active', True):
            continue

        next_date = next_occurrence(rt)
        if not next_date:
            continue

        payload = {
            'id': rt['id'],
            'name': rt.get('name', 'Recurring'),
            'amount': rt.get('amount', 0),
            'category': rt.get('category', ''),
            'frequency': rt.get('frequency', 'monthly'),
            'next_occurrence': next_date.isoformat(),
            'is_income': rt.get('is_income', False)
        }

        if next_date <= today:
            due.append(payload)
        elif next_date <= horizon:
            upcoming.append(payload)

    return jsonify({'due': due, 'upcoming': upcoming})


@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications(current_user_id):
    """Get all non-deleted notifications for the user."""
    # First, sync recurring notifications for today
    try:
        sync_recurring_notifications(current_user_id)
    except Exception as e:
        print(f"Error syncing recurring notifications: {e}")
    
    data = load_data(current_user_id)
    notifications = [n for n in data.get('notifications', []) if not n.get('deleted_at')]
    # Sort by creation date (newest first)
    notifications.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify(notifications)


@app.route('/api/notifications/test', methods=['POST'])
@login_required
def create_test_notification(current_user_id):
    """Create a test notification (for testing purposes)."""
    body = request.json or {}
    title = body.get('title', 'Test Notification')
    message = body.get('body', 'This is a test notification')
    notif_type = body.get('type', 'info')
    
    notif = create_notification(current_user_id, title, message, notif_type)
    return jsonify(notif), 201


@app.route('/api/notifications/<notification_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(current_user_id, notification_id):
    """Mark a notification as read."""
    data = load_data(current_user_id)
    for notif in data.get('notifications', []):
        if notif['id'] == notification_id:
            notif['read'] = True
            save_data(current_user_id, data)
            return jsonify(notif)
    return jsonify({'error': 'Notification not found'}), 404


@app.route('/api/notifications/<notification_id>', methods=['DELETE'])
@login_required
def delete_notification(current_user_id, notification_id):
    """Delete (soft delete) a notification."""
    data = load_data(current_user_id)
    for notif in data.get('notifications', []):
        if notif['id'] == notification_id:
            notif['deleted_at'] = datetime.utcnow().isoformat()
            save_data(current_user_id, data)
            return '', 204
    return jsonify({'error': 'Notification not found'}), 404

# Items API
@app.route('/api/items', methods=['GET'])
@login_required
def get_items(current_user_id):
    """Get all items"""
    data = load_data(current_user_id)
    items = data.get('items', [])

    updated = False
    for item in items:
        normalized_name = normalize_item_name(item.get('name', ''))
        if normalized_name and item.get('name') != normalized_name:
            item['name'] = normalized_name
            updated = True

    if updated:
        save_data(current_user_id, data)

    return jsonify(items)

@app.route('/api/items/stats', methods=['GET'])
@login_required
def get_item_stats(current_user_id):
    """Get item statistics"""
    data = load_data(current_user_id)
    items = data.get('items', [])
    
    # Calculate stats
    item_counts = {}
    store_counts = {}
    
    for item in items:
        display_name = normalize_item_name(item.get('name', 'Unknown')) or 'Unknown'
        name_key = display_name.lower()
        qty = item.get('quantity', 1)
        price = item.get('price', 0)
        store = item.get('store', 'Unknown')
        
        # Item frequency
        if name_key not in item_counts:
            item_counts[name_key] = {'count': 0, 'total_qty': 0, 'total_spent': 0, 'name': display_name}
        item_counts[name_key]['count'] += 1
        item_counts[name_key]['total_qty'] += qty
        item_counts[name_key]['total_spent'] += price * qty
        
        # Store frequency
        if store not in store_counts:
            store_counts[store] = 0
        store_counts[store] += 1
    
    # Sort by frequency
    top_items = sorted(item_counts.values(), key=lambda x: x['total_qty'], reverse=True)[:20]
    top_stores = sorted(store_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return jsonify({
        'total_items': len(items),
        'unique_items': len(item_counts),
        'top_items': top_items,
        'top_stores': [{'name': s[0], 'count': s[1]} for s in top_stores]
    })

# Category routes
@app.route('/api/categories', methods=['GET'])
@login_required
def get_categories(current_user_id):
    """Get all categories"""
    data = load_data(current_user_id)
    return jsonify(data['categories'])

@app.route('/api/categories', methods=['POST'])
@login_required
def create_category(current_user_id):
    """Create a new category"""
    data = load_data(current_user_id)
    category = request.json
    
    if 'id' not in category or not category['id']:
        category['id'] = str(uuid.uuid4())
    
    if 'icon' not in category:
        category['icon'] = 'other'
    if 'type' not in category:
        category['type'] = 'both'
    
    data['categories'].append(category)
    save_data(current_user_id, data)
    return jsonify(category), 201

@app.route('/api/categories/<category_id>', methods=['PUT'])
@login_required
def update_category(current_user_id, category_id):
    """Update a category"""
    data = load_data(current_user_id)
    updated_category = request.json
    updated_category['id'] = category_id
    
    for i, category in enumerate(data['categories']):
        if category['id'] == category_id:
            data['categories'][i] = updated_category
            save_data(current_user_id, data)
            return jsonify(updated_category)
    
    return jsonify({'error': 'Category not found'}), 404

@app.route('/api/categories/<category_id>', methods=['DELETE'])
@login_required
def delete_category(current_user_id, category_id):
    """Delete a category"""
    data = load_data(current_user_id)
    data['categories'] = [c for c in data['categories'] if c['id'] != category_id]
    save_data(current_user_id, data)
    return '', 204

@app.route('/api/settings', methods=['GET'])
@login_required
def get_settings(current_user_id):
    """Get current settings"""
    data = load_data(current_user_id)
    return jsonify(data['settings'])

@app.route('/api/settings', methods=['PUT'])
@login_required
def update_settings(current_user_id):
    """Update settings"""
    data = load_data(current_user_id)
    incoming = request.json or {}
    # Merge to retain unspecified keys
    merged = data.get('settings', {}).copy()
    merged.update(incoming)
    try:
        merged['notifications_lead_days'] = max(0, int(merged.get('notifications_lead_days', 3)))
    except Exception:
        merged['notifications_lead_days'] = 3
    data['settings'] = merged
    save_data(current_user_id, data)
    return jsonify(data['settings'])


@app.route('/api/config', methods=['GET'])
def get_config():
    """Public config for frontend bootstrapping (no auth needed)."""
    return jsonify({
        'vapidPublicKey': VAPID_PUBLIC_KEY
    })

# Receipt Scanner API
@app.route('/api/scan-receipt', methods=['POST'])
@login_required
def scan_receipt(current_user_id):
    """Scan receipt image using Google Gemini API"""
    try:
        import google.generativeai as genai
        from PIL import Image
        import io
        
        # Get API key from settings or environment
        data = load_data(current_user_id)
        api_key = data['settings'].get('gemini_api_key') or GEMINI_API_KEY
        
        if not api_key:
            return jsonify({'error': 'Gemini API key not configured. Please add it in Settings.'}), 400
        
        # Get image data from request
        if 'image' not in request.json:
            return jsonify({'error': 'No image provided'}), 400
        
        image_data = request.json['image']
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Get available categories for context
        categories = data['categories']
        expense_categories = [c['name'] for c in categories if c['type'] in ['expense', 'both']]
        
        # Create detailed prompt for item extraction
        prompt = f"""Analyze this receipt image and extract ALL information in JSON format:
{{
    "store_name": "Name of the store/merchant",
    "store_address": "Store address if visible",
    "total": "Total/Grand total amount as a number (e.g., 25.99)",
    "subtotal": "Subtotal before tax if visible",
    "tax": "Tax amount if visible",
    "date": "Date in YYYY-MM-DD format if visible, otherwise null",
    "time": "Time if visible (HH:MM format)",
    "payment_method": "Cash, Card, etc. if visible",
    "items": [
        {{
            "name": "Item name",
            "quantity": 1,
            "price": 5.99
        }}
    ],
    "category": "Best matching category from: {', '.join(expense_categories)}"
}}

IMPORTANT RULES:
1. Extract EVERY line item from the receipt with name, quantity, and individual price
2. The "total" should be the FINAL/GRAND TOTAL, not subtotals
3. For quantity, if not specified assume 1
4. For item price, use the unit price not line total
5. If information is unclear or not visible, use null
6. Return ONLY valid JSON, no markdown or extra text
7. Be thorough - extract ALL items visible on the receipt
8. GROUP IDENTICAL ITEMS: If the same item appears multiple times (e.g., "LidlPlus Rabatt" appears 4 times), 
   combine them into a single item with the total quantity (e.g., quantity: 4) and the unit price
9. Use exact item names as they appear on the receipt - do not modify or abbreviate names"""
        
        # Use Gemini 2.0 Flash model
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content([prompt, image])
        
        # Parse response
        response_text = response.text.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0].strip()
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0].strip()
        
        result = json.loads(response_text)
        
        # Process items and group duplicates
        items_dict = {}
        if result.get('items'):
            for item in result['items']:
                name = item.get('name', 'Unknown Item').strip()
                quantity = int(item.get('quantity', 1)) if item.get('quantity') else 1
                price = float(item.get('price', 0)) if item.get('price') else 0
                
                # Normalize name for grouping (case-insensitive, trim whitespace)
                name_key = name.lower().strip()
                
                # If item already exists, combine quantities
                if name_key in items_dict:
                    items_dict[name_key]['quantity'] += quantity
                    # Use the average price if prices differ slightly, or keep the first price
                    if abs(items_dict[name_key]['price'] - price) > 0.01:
                        # If prices differ significantly, use weighted average
                        total_qty = items_dict[name_key]['quantity']
                        old_total = items_dict[name_key]['price'] * (total_qty - quantity)
                        new_total = price * quantity
                        items_dict[name_key]['price'] = (old_total + new_total) / total_qty
                else:
                    items_dict[name_key] = {
                        'name': name,  # Keep original casing
                        'quantity': quantity,
                        'price': price
                    }
        
        # Convert dict back to list
        items = list(items_dict.values())
        
        return jsonify({
            'success': True,
            'data': {
                'store_name': result.get('store_name') or 'Unknown Store',
                'store_address': result.get('store_address'),
                'total': float(result.get('total', 0)) if result.get('total') else 0,
                'subtotal': float(result.get('subtotal', 0)) if result.get('subtotal') else None,
                'tax': float(result.get('tax', 0)) if result.get('tax') else None,
                'date': result.get('date'),
                'time': result.get('time'),
                'payment_method': result.get('payment_method'),
                'category': result.get('category', 'Other'),
                'items': items,
                'item_count': len(items)
            }
        })
        
    except json.JSONDecodeError as e:
        return jsonify({'error': f'Failed to parse receipt data: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Failed to scan receipt: {str(e)}'}), 500

# Static file serving
@app.route('/')
def index():
    # Serve index.html for all routes (SPA)
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if '.' in path:
        # Static files (css, js, images)
        if os.path.exists(f'static/{path}'):
            return send_from_directory('static', path)
    
    # Everything else goes to index.html for client-side routing
    return send_from_directory('static', 'index.html')

# --- Admin User Initialization ---

def initialize_admin_user():
    """Create or update admin user from environment variables"""
    admin_username = os.environ.get('ADMIN_USERNAME')
    admin_password = os.environ.get('ADMIN_PASSWORD')
    
    if admin_username and admin_password:
        print(f"Initializing admin user: {admin_username}")
        users = load_users()
        
        # Check if user exists
        if admin_username not in users:
            user_id = str(uuid.uuid4())
            users[admin_username] = {
                'id': user_id,
                'password': generate_password_hash(admin_password)
            }
            save_users(users)
            print(f"Admin user '{admin_username}' created successfully.")
        else:
            print(f"Admin user '{admin_username}' already exists. Skipping creation.")

# Initialize admin user on startup
try:
    initialize_admin_user()
except Exception as e:
    print(f"Error initializing admin user: {e}")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
