// ============================================
// GIDER - Settings JavaScript
// ============================================

let editingCategoryId = null;

// Basic auth headers helper for protected API calls
function getAuthHeaders(json = true) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Initialize settings
document.addEventListener('DOMContentLoaded', async () => {
    await loadStaticConfig();
    await loadCategories();
    await loadSettingsForm();
    renderCategoriesList();
    setupSettingsForm();
    setupGeminiForm();
    renderIconPicker();
    initSettingsIcons();
});

async function loadStaticConfig() {
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            const cfg = await res.json();
            if (cfg?.vapidPublicKey) {
                window.VAPID_PUBLIC_KEY = cfg.vapidPublicKey;
            }
        }
    } catch (e) {
        console.warn('Failed to load config on static settings page', e);
    }
}

function initSettingsIcons() {
    // Scanner settings icon
    const scannerIconEl = document.querySelector('.settings-card:nth-child(2) .settings-card-icon');
    if (scannerIconEl) scannerIconEl.innerHTML = getIcon('scan', 18);
}

async function loadSettingsForm() {
    try {
        const response = await fetch('/api/settings');
        settings = await response.json();
        
        document.getElementById('currencySymbol').value = settings.currency_symbol || '$';
        document.getElementById('startDate').value = settings.start_date || 1;
        document.getElementById('theme').value = settings.theme || 'dark';
        const notificationsToggle = document.getElementById('notificationsToggle');
        if (notificationsToggle) notificationsToggle.checked = settings.notifications_enabled !== false;
        const notificationLead = document.getElementById('notificationLead');
        if (notificationLead) notificationLead.value = settings.notifications_lead_days ?? 3;
        
        // Load Gemini API key (masked)
        const geminiInput = document.getElementById('geminiApiKey');
        if (geminiInput && settings.gemini_api_key) {
            geminiInput.value = '••••••••••••••••';
            geminiInput.dataset.hasKey = 'true';
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
        showToast('error', 'Error', 'Failed to load settings');
    }
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
                <button class="btn btn-ghost btn-icon" onclick="editCategory('${cat.id}')" title="Edit">
                    ${getIcon('edit', 14)}
                </button>
                <button class="btn btn-ghost btn-icon" onclick="deleteCategory('${cat.id}')" title="Delete">
                    ${getIcon('trash', 14)}
                </button>
            </div>
        </div>
    `).join('');
}

function renderIconPicker() {
    const picker = document.getElementById('iconPicker');
    if (!picker) return;
    
    picker.innerHTML = categoryIcons.map(iconName => `
        <button type="button" class="icon-option ${selectedCategoryIcon === iconName ? 'selected' : ''}" 
                onclick="selectIcon('${iconName}')" title="${iconName}">
            ${getIcon(iconName, 18)}
        </button>
    `).join('');
}

function selectIcon(iconName) {
    selectedCategoryIcon = iconName;
    renderIconPicker();
}

function setupSettingsForm() {
    const form = document.getElementById('settingsForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
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
                headers: getAuthHeaders(),
                body: JSON.stringify(newSettings)
            });
            
            if (response.ok) {
                settings = newSettings;
                applyTheme(settings.theme);
                try {
                    if (typeof syncNotificationsPreference === 'function') {
                        await syncNotificationsPreference(newSettings.notifications_enabled);
                    }
                } catch (err) {
                    console.warn('Notification preference sync failed', err);
                }
                showToast('success', 'Saved', 'Settings updated successfully');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('error', 'Error', 'Failed to save settings');
        }
    });
}

function setupGeminiForm() {
    const form = document.getElementById('geminiForm');
    if (!form) return;
    
    const geminiInput = document.getElementById('geminiApiKey');
    
    // Clear placeholder on focus if it's the masked value
    geminiInput.addEventListener('focus', () => {
        if (geminiInput.dataset.hasKey === 'true' && geminiInput.value === '••••••••••••••••') {
            geminiInput.value = '';
        }
    });
    
    // Restore masked value on blur if empty and key exists
    geminiInput.addEventListener('blur', () => {
        if (geminiInput.dataset.hasKey === 'true' && geminiInput.value === '') {
            geminiInput.value = '••••••••••••••••';
        }
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiKey = geminiInput.value;
        
        // Don't save if it's the masked value
        if (apiKey === '••••••••••••••••') {
            showToast('warning', 'No Change', 'API key not modified');
            return;
        }
        
        try {
            // Get current settings and update just the API key
            const currentSettings = { ...settings, gemini_api_key: apiKey };
            
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: getAuthHeaders(),
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
            console.error('Error saving API key:', error);
            showToast('error', 'Error', 'Failed to save API key');
        }
    });
}

// Category Modal
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
    
    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
    
    setTimeout(() => {
        document.getElementById('categoryName').focus();
    }, 100);
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
        editingCategoryId = null;
    }, 300);
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
        id: id || undefined,
        name,
        icon: selectedCategoryIcon,
        type
    };
    
    try {
        const url = id ? `/api/categories/${id}` : '/api/categories';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
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
        console.error('Error saving category:', error);
        showToast('error', 'Error', 'Failed to save category');
    }
}

async function deleteCategory(id) {
    const category = allCategories.find(c => c.id === id);
    if (!category) return;
    
    if (!confirm(`Delete category "${category.name}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false)
        });
        
        if (response.ok) {
            showToast('success', 'Deleted', `Category "${category.name}" deleted`);
            await loadCategories();
            renderCategoriesList();
        } else {
            throw new Error('Failed to delete');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('error', 'Error', 'Failed to delete category');
    }
}

function exportData() {
    fetch('/api/transactions', { headers: getAuthHeaders(false) })
        .then(response => response.json())
        .then(transactions => {
            if (transactions.length === 0) {
                showToast('warning', 'No Data', 'There are no transactions to export');
                return;
            }
            
            const headers = ['ID', 'Name', 'Category', 'Amount', 'Date', 'Type', 'Tags', 'Description'];
            const rows = transactions.map(t => [
                t.id,
                t.name,
                t.category,
                t.amount,
                new Date(t.date).toISOString(),
                t.is_income ? 'Income' : 'Expense',
                t.tags ? t.tags.join(';') : '',
                t.description || ''
            ]);
            
            const csv = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gider_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            showToast('success', 'Exported', `${transactions.length} transactions exported`);
        })
        .catch(error => {
            console.error('Error exporting data:', error);
            showToast('error', 'Error', 'Failed to export data');
        });
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
        
        const nameIdx = headers.findIndex(h => h === 'name');
        const categoryIdx = headers.findIndex(h => h === 'category');
        const amountIdx = headers.findIndex(h => h === 'amount');
        const dateIdx = headers.findIndex(h => h === 'date');
        
        if (nameIdx === -1 || categoryIdx === -1 || amountIdx === -1 || dateIdx === -1) {
            showToast('error', 'Invalid File', 'CSV must contain: name, category, amount, and date columns');
            return;
        }
        
        let imported = 0;
        let errors = 0;
        
        showToast('warning', 'Importing...', 'Please wait');
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let char of lines[i]) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^"|"$/g, ''));
            
            try {
                const amount = parseFloat(values[amountIdx]);
                const date = new Date(values[dateIdx]);
                
                if (isNaN(amount) || isNaN(date.getTime())) {
                    errors++;
                    continue;
                }
                
                const transaction = {
                    name: values[nameIdx],
                    category: values[categoryIdx],
                    amount: amount,
                    date: date.toISOString(),
                    is_income: amount >= 0,
                    tags: [],
                    description: ''
                };
                
                const response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(transaction)
                });
                
                if (response.ok) {
                    imported++;
                } else {
                    errors++;
                }
            } catch (error) {
                errors++;
            }
        }
        
        showToast('success', 'Import Complete', `${imported} imported, ${errors} errors`);
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Clear data functions
function confirmClearData() {
    const modal = document.getElementById('clearDataModal');
    if (!modal) return;
    
    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function closeClearDataModal() {
    const modal = document.getElementById('clearDataModal');
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
    }, 300);
}

async function clearAllData() {
    try {
        const response = await fetch('/api/transactions', { headers: getAuthHeaders(false) });
        const transactions = await response.json();
        
        showToast('warning', 'Clearing...', 'Please wait');
        
        for (const t of transactions) {
            await fetch(`/api/transactions/${t.id}`, { method: 'DELETE', headers: getAuthHeaders(false) });
        }
        
        closeClearDataModal();
        showToast('success', 'Cleared', 'All transactions deleted');
    } catch (error) {
        console.error('Error clearing data:', error);
        showToast('error', 'Error', 'Failed to clear data');
    }
}
