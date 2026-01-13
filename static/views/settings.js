import { auth } from '../auth.js';
import {
    getIcon, showToast, applyTheme, allCategories, selectedCategoryIcon as coreSelectedIcon, loadCategories as loadCategoriesFromCore
} from '../core.js';

// Import categoryIcons from icons.js - we'll get it from window or define it here
// The categoryIcons array is defined in icons.js
const categoryIcons = [
    'shopping', 'food', 'transport', 'home', 'utilities', 'entertainment',
    'health', 'education', 'travel', 'salary', 'investment', 'gift',
    'bills', 'insurance', 'subscriptions', 'savings', 'freelance', 'rent',
    'phone', 'clothing', 'pets', 'fitness', 'creditCard', 'wallet', 'other', 'tag'
];

// Use a local variable that syncs with core.js
let selectedCategoryIcon = coreSelectedIcon || 'other';
let editingCategoryId = null;
let settings = {};

export const SettingsView = {
    render: async () => {
        return `
            <div class="container animate-fade-in">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Settings</h1>
                        <p class="page-subtitle">Customize your expense tracker</p>
                    </div>
                </div>

                <div class="settings-grid">
                    <!-- General Settings -->
                    <div class="settings-card animate-slide-up">
                        <div class="settings-card-header">
                            <div class="settings-card-icon">${getIcon('settings', 18)}</div>
                            <h3 class="settings-card-title">General Settings</h3>
                        </div>
                        <div class="settings-card-body">
                            <form id="settingsForm" onsubmit="window.handleSettingsSubmit(event)">
                                <div class="form-group">
                                    <label class="form-label" for="currencySymbol">Currency Symbol</label>
                                    <input type="text" id="currencySymbol" class="form-input" maxlength="5" placeholder="$">
                                    <p class="form-hint">Symbol displayed before amounts</p>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="startDate">Budget Start Day</label>
                                    <input type="number" id="startDate" class="form-input" min="1" max="31" value="1">
                                    <p class="form-hint">Day of month when your budget cycle starts</p>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="theme">Theme</label>
                                    <select id="theme" class="form-select">
                                        <option value="dark">Dark</option>
                                        <option value="light">Light</option>
                                        <option value="auto">Auto (System)</option>
                                    </select>
                                </div>

                                <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
                                    <div>
                                        <label class="form-label" for="notificationsToggle">Notifications</label>
                                        <p class="form-hint">Enable or disable in-app/push notifications</p>
                                    </div>
                                    <input type="checkbox" id="notificationsToggle" style="width: 18px; height: 18px;">
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="notificationLead">Notify Ahead (days)</label>
                                    <input type="number" id="notificationLead" class="form-input" min="0" max="30" value="3">
                                    <p class="form-hint">How many days before the due date to notify for recurring items</p>
                                </div>
                    <div class="settings-card animate-slide-up">
                        <div class="settings-card-header">
                            <div class="settings-card-icon">${getIcon('tag', 18)}</div>
                            <h3 class="settings-card-title">Categories</h3>
                        </div>
                        <div class="settings-card-body">
                            <div id="categoriesList" style="max-height: 350px; overflow-y: auto; margin-bottom: 1rem;"></div>
                            <button type="button" class="btn btn-secondary" style="width: 100%;" onclick="window.openCategoryModal()">
                                ${getIcon('plus', 14)} Add Category
                            </button>
                        </div>
                    </div>

                    <!-- Receipt Scanner Settings -->
                    <div class="settings-card animate-slide-up">
                        <div class="settings-card-header">
                            <div class="settings-card-icon">${getIcon('scan', 18)}</div>
                            <h3 class="settings-card-title">Receipt Scanner</h3>
                        </div>
                        <div class="settings-card-body">
                            <form id="geminiForm" onsubmit="window.handleGeminiSubmit(event)">
                                <div class="form-group">
                                    <label class="form-label" for="geminiApiKey">Google Gemini API Key</label>
                                    <input type="password" id="geminiApiKey" class="form-input" placeholder="Enter your API key">
                                    <p class="form-hint">Required for receipt scanning. Get a free key from <a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--primary);">Google AI Studio</a></p>
                                </div>
                                <button type="submit" class="btn btn-primary" style="width: 100%;">Save API Key</button>
                            </form>
                        </div>
                    </div>

                    <!-- Data Management -->
                    <div class="settings-card animate-slide-up">
                        <div class="settings-card-header">
                            <div class="settings-card-icon">${getIcon('database', 18)}</div>
                            <h3 class="settings-card-title">Data Management</h3>
                        </div>
                        <div class="settings-card-body">
                            <div class="form-group">
                                <label class="form-label">Export Data</label>
                                <p class="form-hint mb-1">Download all your transactions as CSV</p>
                                <button type="button" class="btn btn-secondary" onclick="window.exportData()" style="width: 100%;">
                                    ${getIcon('download', 14)} Export CSV
                                </button>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Import Data</label>
                                <p class="form-hint mb-1">Import transactions from CSV file</p>
                                <input type="file" id="importFile" accept=".csv" style="display: none;" onchange="window.importData(event)">
                                <button type="button" class="btn btn-secondary" onclick="document.getElementById('importFile').click()" style="width: 100%;">
                                    ${getIcon('upload', 14)} Import CSV
                                </button>
                            </div>

                            <div class="form-group" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                                <label class="form-label text-danger">Danger Zone</label>
                                <p class="form-hint mb-1">Clear all transactions (cannot be undone)</p>
                                <button type="button" class="btn btn-danger" onclick="window.confirmClearData()" style="width: 100%;">
                                    ${getIcon('trash', 14)} Clear All Data
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- About -->
                    <div class="settings-card animate-slide-up">
                        <div class="settings-card-header">
                            <div class="settings-card-icon">${getIcon('info', 18)}</div>
                            <h3 class="settings-card-title">About</h3>
                        </div>
                        <div class="settings-card-body">
                            <div style="text-align: center; padding: 1rem;">
                                <img src="/logo.png" alt="Gider" style="width: 64px; height: 64px; margin-bottom: 1rem;">
                                <h4 style="margin-bottom: 0.25rem;">Gider</h4>
                                <p class="text-muted" style="font-size: 0.85rem;">Simple Expense Tracker</p>
                                <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.75rem;">
                                    A self-hosted expense and income tracking application.
                                </p>
                                <a href="https://github.com/batuhancelasun/Gider" target="_blank" class="btn btn-ghost mt-2">
                                    ${getIcon('github', 16)} GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Category Modal -->
                <div class="modal-overlay" id="categoryModal">
                    <div class="modal" style="max-width: 420px;">
                        <div class="modal-header">
                            <h2 class="modal-title" id="categoryModalTitle">Add Category</h2>
                            <button class="modal-close" onclick="window.closeCategoryModal()"></button>
                        </div>
                        <div class="modal-body">
                            <form id="categoryForm">
                                <input type="hidden" id="categoryId">
                                
                                <div class="form-group">
                                    <label class="form-label" for="categoryName">Name</label>
                                    <input type="text" id="categoryName" class="form-input" placeholder="Category name" required>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="categoryType">Type</label>
                                    <select id="categoryType" class="form-select">
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Icon</label>
                                    <div class="icon-picker" id="iconPicker"></div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="window.closeCategoryModal()">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="window.saveCategory()">Save</button>
                        </div>
                    </div>
                </div>

                <!-- Clear Data Confirmation Modal -->
                <div class="modal-overlay" id="clearDataModal">
                    <div class="modal" style="max-width: 400px;">
                        <div class="modal-header">
                            <h2 class="modal-title">Clear All Data</h2>
                            <button class="modal-close" onclick="window.closeClearDataModal()"></button>
                        </div>
                        <div class="modal-body text-center">
                            <div style="margin-bottom: 1rem; color: var(--danger);">${getIcon('alertTriangle', 48)}</div>
                            <p><strong>Are you sure?</strong></p>
                            <p class="text-muted mt-1">This will permanently delete all your transactions. This action cannot be undone.</p>
                        </div>
                        <div class="modal-footer" style="justify-content: center;">
                            <button type="button" class="btn btn-secondary" onclick="window.closeClearDataModal()">Cancel</button>
                            <button type="button" class="btn btn-danger" onclick="window.clearAllData()">Delete Everything</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init: async () => {
        await loadCategories();
        await loadSettings();
        renderCategoriesList();

        // Expose functions to window
        window.handleSettingsSubmit = handleSettingsSubmit;
        window.handleGeminiSubmit = handleGeminiSubmit;
        window.openCategoryModal = openCategoryModal;
        window.closeCategoryModal = closeCategoryModal;
        window.saveCategory = saveCategory;
        window.editCategory = editCategory;
        window.deleteCategory = deleteCategory;
        window.selectIcon = selectIcon;
        window.exportData = exportData;
        window.importData = importData;
        window.confirmClearData = confirmClearData;
        window.clearAllData = clearAllData;
        window.closeClearDataModal = closeClearDataModal;

        setupGeminiInput();
    }
};

// -- Settings & Loading --

async function loadSettings() {
    try {
        const response = await fetch('/api/settings', { headers: auth.getHeaders() });
        settings = await response.json();

        const currencyEl = document.getElementById('currencySymbol');
        const dateEl = document.getElementById('startDate');
        const themeEl = document.getElementById('theme');
        const notifEl = document.getElementById('notificationsToggle');
        const leadEl = document.getElementById('notificationLead');
        const geminiEl = document.getElementById('geminiApiKey');
 
        if (currencyEl) currencyEl.value = settings.currency_symbol || '$';
        if (dateEl) dateEl.value = settings.start_date || 1;
        if (themeEl) themeEl.value = settings.theme || 'dark';
        if (notifEl) notifEl.checked = settings.notifications_enabled !== false;
        if (leadEl) leadEl.value = settings.notifications_lead_days ?? 3;
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

async function handleSettingsSubmit(e) {
    e.preventDefault();
    const newSettings = {
        currency_symbol: document.getElementById('currencySymbol').value || '$',
        start_date: parseInt(document.getElementById('startDate').value) || 1,
        theme: document.getElementById('theme').value || 'dark',
        notifications_enabled: (document.getElementById('notificationsToggle')?.checked ?? true),
        notifications_lead_days: Math.max(0, parseInt(document.getElementById('notificationLead')?.value) || 0),
        gemini_api_key: settings?.gemini_api_key || ''
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: auth.getHeaders(),
            body: JSON.stringify(newSettings)
        });

        if (response.ok) {
            settings = newSettings;
            applyTheme(settings.theme);
            showToast('success', 'Saved', 'Settings updated successfully');
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to save settings');
    }
}

// -- Gemini Scanner --

function setupGeminiInput() {
    const geminiInput = document.getElementById('geminiApiKey');
    if (!geminiInput) return;

    geminiInput.addEventListener('focus', () => {
        if (geminiInput.dataset.hasKey === 'true' && geminiInput.value === '••••••••••••••••') {
            geminiInput.value = '';
        }
    });

    geminiInput.addEventListener('blur', () => {
        if (geminiInput.dataset.hasKey === 'true' && geminiInput.value === '') {
            geminiInput.value = '••••••••••••••••';
        }
    });
}

async function handleGeminiSubmit(e) {
    e.preventDefault();
    const geminiInput = document.getElementById('geminiApiKey');
    const apiKey = geminiInput.value;

    if (apiKey === '••••••••••••••••') {
        showToast('warning', 'No Change', 'API key not modified');
        return;
    }

    try {
        const currentSettings = { ...settings, gemini_api_key: apiKey };
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: auth.getHeaders(),
            body: JSON.stringify(currentSettings)
        });

        if (response.ok) {
            settings = currentSettings;
            geminiInput.value = '••••••••••••••••';
            geminiInput.dataset.hasKey = 'true';
            showToast('success', 'Saved', 'API key saved successfully');
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to save API key');
    }
}

// -- Categories --

async function loadCategories() {
    // Use the loadCategories function from core.js to keep everything in sync
    await loadCategoriesFromCore();
}

function renderCategoriesList() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    if (allCategories.length === 0) {
        list.innerHTML = '<p class="text-muted text-center">No categories yet</p>';
        return;
    }

    list.innerHTML = allCategories.map(cat => `
        <div class="category-item">
            <div class="category-icon">${getIcon(cat.icon || 'other', 18)}</div>
            <span class="category-name">${cat.name}</span>
            <span class="badge ${cat.type === 'income' ? 'income' : (cat.type === 'expense' ? 'expense' : '')}" style="font-size: 0.7rem;">
                ${cat.type === 'both' ? 'Both' : (cat.type === 'income' ? 'Income' : 'Expense')}
            </span>
            <div class="category-actions">
                <button class="btn btn-ghost btn-icon" onclick="window.editCategory('${cat.id}')" title="Edit">
                    ${getIcon('edit', 14)}
                </button>
                <button class="btn btn-ghost btn-icon" onclick="window.deleteCategory('${cat.id}')" title="Delete">
                    ${getIcon('trash', 14)}
                </button>
            </div>
        </div>
    `).join('');
}

function openCategoryModal(categoryId = null) {
    editingCategoryId = categoryId;
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');

    if (!modal || !form) return;

    form.reset();
    selectedCategoryIcon = 'other';
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModalTitle').textContent = categoryId ? 'Edit Category' : 'Add Category';

    if (categoryId) {
        const category = allCategories.find(c => c.id === categoryId);
        if (category) {
            document.getElementById('categoryId').value = category.id;
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryType').value = category.type;
            selectedCategoryIcon = category.icon || 'other';
        }
    }

    renderIconPicker();
    modal.classList.add('active', 'show');
}

function closeCategoryModal() {
    document.getElementById('categoryModal')?.classList.remove('show', 'active');
    editingCategoryId = null;
}

function renderIconPicker() {
    const picker = document.getElementById('iconPicker');
    if (!picker) return;

    // window.getIcon should be available from icons.js which loads before app.js
    // If not available, use the imported getIcon function
    const getIconFunc = window.getIcon || getIcon;
    
    picker.innerHTML = categoryIcons.map(iconName => {
        const iconHtml = getIconFunc(iconName, 18);
        return `
        <button type="button" class="icon-option ${selectedCategoryIcon === iconName ? 'selected' : ''}" 
                onclick="window.selectIcon('${iconName}')" title="${iconName}">
            ${iconHtml}
        </button>
    `;
    }).join('');
}

function selectIcon(iconName) {
    selectedCategoryIcon = iconName;
    // Update core.js selectedCategoryIcon if possible
    if (window.selectedCategoryIcon !== undefined) {
        window.selectedCategoryIcon = iconName;
    }
    renderIconPicker();
}

function editCategory(id) {
    openCategoryModal(id);
}

async function saveCategory() {
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    const type = document.getElementById('categoryType').value;

    if (!name) {
        showToast('warning', 'Warning', 'Please enter a category name');
        return;
    }

    const category = {
        name,
        icon: selectedCategoryIcon,
        type
    };

    try {
        const url = id ? `/api/categories/${id}` : '/api/categories';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: auth.getHeaders(),
            body: JSON.stringify(category)
        });

        if (response.ok) {
            closeCategoryModal();
            showToast('success', id ? 'Updated' : 'Added', `Category "${name}" saved`);
            await loadCategories();
            renderCategoriesList();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to save category');
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: auth.getHeaders()
        });
        if (response.ok) {
            showToast('success', 'Deleted', 'Category deleted');
            await loadCategories();
            renderCategoriesList();
        } else {
            throw new Error('Failed to delete');
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete category');
    }
}

// -- Data Management --

function exportData() {
    fetch('/api/transactions', { headers: auth.getHeaders() })
        .then(res => res.json())
        .then(transactions => {
            if (!transactions.length) {
                showToast('warning', 'No Data', 'No transactions to export');
                return;
            }
            const headers = ['ID', 'Name', 'Category', 'Amount', 'Date', 'Type', 'Tags', 'Description'];
            const rows = transactions.map(t => [
                t.id, t.name, t.category, t.amount, t.date,
                t.is_income ? 'Income' : 'Expense', t.tags?.join(';') || '', t.description || ''
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gider_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('success', 'Exported', `${transactions.length} transactions exported`);
        })
        .catch(e => showToast('error', 'Error', 'Failed to export'));
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());

        const nameIdx = headers.indexOf('name');
        const categoryIdx = headers.indexOf('category');
        const amountIdx = headers.indexOf('amount');
        const dateIdx = headers.indexOf('date');

        if (nameIdx === -1 || categoryIdx === -1 || amountIdx === -1 || dateIdx === -1) {
            showToast('error', 'Invalid File', 'CSV missing required columns');
            return;
        }

        let imported = 0;
        showToast('warning', 'Importing...', 'Please wait');

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            // Simple CSV split handling (naive)
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

            try {
                const amount = parseFloat(values[amountIdx]);
                if (isNaN(amount)) continue;

                const transaction = {
                    name: values[nameIdx],
                    category: values[categoryIdx],
                    amount: Math.abs(amount),
                    date: new Date(values[dateIdx]).toISOString(),
                    is_income: amount >= 0,
                    tags: [],
                    description: ''
                };

                await fetch('/api/transactions', {
                    method: 'POST',
                    headers: auth.getHeaders(),
                    body: JSON.stringify(transaction)
                });
                imported++;
            } catch (err) { }
        }
        showToast('success', 'Complete', `${imported} transactions imported`);
        event.target.value = '';
    };
    reader.readAsText(file);
}

function confirmClearData() {
    document.getElementById('clearDataModal')?.classList.add('show', 'active');
}

function closeClearDataModal() {
    document.getElementById('clearDataModal')?.classList.remove('show', 'active');
}

async function clearAllData() {
    try {
        const res = await fetch('/api/transactions', { headers: auth.getHeaders() });
        const transactions = await res.json();
        showToast('warning', 'Clearing...', 'Please wait');
        for (const t of transactions) {
            await fetch(`/api/transactions/${t.id}`, {
                method: 'DELETE',
                headers: auth.getHeaders()
            });
        }
        closeClearDataModal();
        showToast('success', 'Cleared', 'All data deleted');
    } catch (e) {
        showToast('error', 'Error', 'Failed to clear data');
    }
}
