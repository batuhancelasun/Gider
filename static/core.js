// ============================================
// GIDER - Core Application JavaScript
// ============================================

import { auth } from './auth.js';

// Global state
export let settings = null;
export let allTransactions = [];
export let allCategories = [];
export let currentTransactionType = 'expense';
export let selectedCategoryIcon = 'other';

// ============================================
// INITIALIZATION
// ============================================

export async function initApp() {
    await loadSettings();
    applyTheme(settings?.theme || 'dark');
    registerServiceWorker();
    initIcons();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
        openModal();
    }
}

export function initIcons() {
    // Navigation icons
    const navDashboard = document.getElementById('nav-dashboard');
    const navTransactions = document.getElementById('nav-transactions');
    const navAnalytics = document.getElementById('nav-analytics');
    const navItems = document.getElementById('nav-items');
    const navRecurring = document.getElementById('nav-recurring');
    const navSettings = document.getElementById('nav-settings');

    if (navDashboard) navDashboard.innerHTML = getIcon('dashboard', 18) + '<span>Dashboard</span>';
    if (navTransactions) navTransactions.innerHTML = getIcon('list', 18) + '<span>Transactions</span>';
    if (navAnalytics) navAnalytics.innerHTML = getIcon('barChart', 18) + '<span>Analytics</span>';
    if (navItems) navItems.innerHTML = getIcon('shoppingBag', 18) + '<span>Items</span>';
    if (navRecurring) navRecurring.innerHTML = getIcon('subscriptions', 18) + '<span>Recurring</span>';
    if (navSettings) navSettings.innerHTML = getIcon('settings', 18) + '<span>Settings</span>';

    // Theme toggle
    document.querySelectorAll('.icon-sun').forEach(el => el.innerHTML = getIcon('sun', 20));
    document.querySelectorAll('.icon-moon').forEach(el => el.innerHTML = getIcon('moon', 20));

    // Buttons
    const addBtn = document.getElementById('addBtn');
    if (addBtn) addBtn.innerHTML = getIcon('plus', 18) + '<span>Add Transaction</span>';

    const fab = document.getElementById('fab');
    if (fab) fab.innerHTML = getIcon('plus', 24);

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.innerHTML = getIcon('check', 18) + '<span>Save</span>';

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(el => {
        el.innerHTML = getIcon('x', 18);
    });

    // Type toggle buttons
    const expenseBtn = document.getElementById('expenseBtn');
    const incomeBtn = document.getElementById('incomeBtn');
    if (expenseBtn) expenseBtn.innerHTML = getIcon('trendingDown', 18) + '<span>Expense</span>';
    if (incomeBtn) incomeBtn.innerHTML = getIcon('trendingUp', 18) + '<span>Income</span>';

    // Stat icons
    const incomeIcon = document.getElementById('incomeIcon');
    const expenseIcon = document.getElementById('expenseIcon');
    const balanceIcon = document.getElementById('balanceIcon');
    if (incomeIcon) incomeIcon.innerHTML = getIcon('trendingUp', 20);
    if (expenseIcon) expenseIcon.innerHTML = getIcon('trendingDown', 20);
    if (balanceIcon) balanceIcon.innerHTML = getIcon('wallet', 20);

    // Chart titles
    const expenseChartTitle = document.getElementById('expenseChartTitle');
    const comparisonChartTitle = document.getElementById('comparisonChartTitle');
    if (expenseChartTitle) expenseChartTitle.innerHTML = getIcon('pieChart', 18) + '<span>Expenses by Category</span>';
    if (comparisonChartTitle) comparisonChartTitle.innerHTML = getIcon('barChart', 18) + '<span>Income vs Expenses</span>';

    // Recent transactions
    const recentTitle = document.getElementById('recentTitle');
    if (recentTitle) recentTitle.innerHTML = getIcon('list', 18) + '<span>Recent Transactions</span>';

    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) viewAllBtn.innerHTML = '<span>View All</span>' + getIcon('arrowRight', 16);

    // Empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.innerHTML = getIcon('wallet', 48) + '<p>No transactions yet</p>';

    // Search icons
    document.querySelectorAll('.search-icon').forEach(el => {
        el.innerHTML = getIcon('search', 18);
    });

    // Delete modal
    const deleteIcon = document.getElementById('deleteIcon');
    if (deleteIcon) deleteIcon.innerHTML = `<span style="display:inline-block; color: var(--danger); opacity: 0.8;">${getIcon('trash', 48)}</span>`;

    // Tab icons
    const tabAllIcon = document.getElementById('tabAllIcon');
    const tabExpensesIcon = document.getElementById('tabExpensesIcon');
    const tabIncomeIcon = document.getElementById('tabIncomeIcon');
    if (tabAllIcon) tabAllIcon.innerHTML = getIcon('list', 18);
    if (tabExpensesIcon) tabExpensesIcon.innerHTML = getIcon('trendingDown', 18);
    if (tabIncomeIcon) tabIncomeIcon.innerHTML = getIcon('trendingUp', 18);

    // Tab chart titles
    const expensesPieTitle = document.getElementById('expensesPieTitle');
    const incomePieTitle = document.getElementById('incomePieTitle');
    if (expensesPieTitle) expensesPieTitle.innerHTML = getIcon('pieChart', 18) + '<span>Expenses by Category</span>';
    if (incomePieTitle) incomePieTitle.innerHTML = getIcon('pieChart', 18) + '<span>Income by Category</span>';

    // Tab stat icons
    const totalExpenseIcon = document.getElementById('totalExpenseIcon');
    const avgExpenseIcon = document.getElementById('avgExpenseIcon');
    const totalIncomeIcon = document.getElementById('totalIncomeIcon');
    const avgIncomeIcon = document.getElementById('avgIncomeIcon');
    if (totalExpenseIcon) totalExpenseIcon.innerHTML = getIcon('trendingDown', 20);
    if (avgExpenseIcon) avgExpenseIcon.innerHTML = getIcon('barChart', 20);
    if (totalIncomeIcon) totalIncomeIcon.innerHTML = getIcon('trendingUp', 20);
    if (avgIncomeIcon) avgIncomeIcon.innerHTML = getIcon('barChart', 20);

    // Settings icons
    const generalIcon = document.getElementById('generalIcon');
    const categoriesIcon = document.getElementById('categoriesIcon');
    const dataIcon = document.getElementById('dataIcon');
    const aboutIcon = document.getElementById('aboutIcon');
    if (generalIcon) generalIcon.innerHTML = getIcon('settings', 18);
    if (categoriesIcon) categoriesIcon.innerHTML = getIcon('tag', 18);
    if (dataIcon) dataIcon.innerHTML = getIcon('barChart', 18);
    if (aboutIcon) aboutIcon.innerHTML = getIcon('info', 18);

    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) saveSettingsBtn.innerHTML = getIcon('check', 18) + '<span>Save Settings</span>';

    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.innerHTML = getIcon('plus', 18) + '<span>Add Category</span>';

    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const clearBtn = document.getElementById('clearBtn');
    if (exportBtn) exportBtn.innerHTML = getIcon('download', 18) + '<span>Export to CSV</span>';
    if (importBtn) importBtn.innerHTML = getIcon('upload', 18) + '<span>Import from CSV</span>';
    if (clearBtn) clearBtn.innerHTML = getIcon('trash', 18) + '<span>Clear All Data</span>';

    const githubBtn = document.getElementById('githubBtn');
    if (githubBtn) githubBtn.innerHTML = getIcon('github', 18) + '<span>View on GitHub</span>';

    // Warning icon
    const warningIcon = document.getElementById('warningIcon');
    if (warningIcon) warningIcon.innerHTML = `<span style="display:inline-block; color: var(--warning); opacity: 0.8;">${getIcon('alertTriangle', 48)}</span>`;

    // Scanner icons
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) scanBtn.innerHTML = getIcon('scan', 18) + '<span>Scan Receipt</span>';

    const scannerIcon = document.getElementById('scannerIcon');
    if (scannerIcon) scannerIcon.innerHTML = getIcon('receipt', 48);

    const uploadIcon = document.getElementById('uploadIcon');
    if (uploadIcon) uploadIcon.innerHTML = getIcon('upload', 18);

    const cameraIcon = document.getElementById('cameraIcon');
    if (cameraIcon) cameraIcon.innerHTML = getIcon('camera', 18);

    const clearPreviewBtn = document.getElementById('clearPreviewBtn');
    if (clearPreviewBtn) clearPreviewBtn.innerHTML = getIcon('x', 16);

    const successIcon = document.getElementById('successIcon');
    if (successIcon) successIcon.innerHTML = getIcon('check', 18);

    const scanReceiptBtn = document.getElementById('scanReceiptBtn');
    if (scanReceiptBtn) scanReceiptBtn.innerHTML = getIcon('scan', 18) + '<span>Scan Receipt</span>';

    const confirmCheckoutBtn = document.getElementById('confirmCheckoutBtn');
    if (confirmCheckoutBtn) confirmCheckoutBtn.innerHTML = getIcon('check', 18) + '<span>Confirm & Save</span>';

    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) addItemBtn.innerHTML = getIcon('plus', 16) + '<span>Add Item</span>';

    // Settings scanner icon
    const settingsScannerIcon = document.getElementById('scannerIcon');
    if (settingsScannerIcon && settingsScannerIcon.closest('.settings-card-icon')) {
        settingsScannerIcon.innerHTML = getIcon('scan', 18);
    }

    const saveGeminiBtn = document.getElementById('saveGeminiBtn');
    if (saveGeminiBtn) saveGeminiBtn.innerHTML = getIcon('key', 18) + '<span>Save API Key</span>';
}

// ============================================
// SERVICE WORKER (PWA)
// ============================================

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
        } catch (error) {
            console.log('SW registration failed:', error);
        }
    }
}

// ============================================
// SETTINGS & THEME
// ============================================

async function loadSettings() {
    try {
        const response = await fetch('/api/settings', {
            headers: auth.getHeaders()
        });
        settings = await response.json();
    } catch (error) {
        console.error('Failed to load settings:', error);
        settings = { currency_symbol: '$', start_date: 1, theme: 'dark' };
    }
}

export function applyTheme(theme) {
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);

    if (settings) {
        settings.theme = newTheme;
        saveSettings(settings);
    }

    showToast('success', 'Theme Changed', `Switched to ${newTheme} mode`);
}

// Expose to window for inline handlers
window.toggleTheme = toggleTheme;

async function saveSettings(newSettings) {
    try {
        await fetch('/api/settings', {
            method: 'PUT',
            headers: auth.getHeaders(),
            body: JSON.stringify(newSettings)
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Export getIcon as a function that dynamically gets it from window
// This is necessary because icons.js is a regular script that may not have loaded yet
export function getIcon(name, size) {
    if (window.getIcon) {
        return window.getIcon(name, size);
    }
    // Fallback if icons.js hasn't loaded yet
    return '';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

export function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
        success: 'check',
        error: 'x',
        warning: 'alertTriangle'
    };

    toast.innerHTML = `
        <span class="toast-icon">${getIcon(iconMap[type] || 'info', 20)}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">${getIcon('x', 16)}</button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// MODAL SYSTEM
// ============================================

export function openModal(transactionId = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    setTransactionType('expense');

    document.getElementById('modalTitle').textContent = transactionId ? 'Edit Transaction' : 'Add Transaction';

    if (transactionId) {
        loadTransactionForEdit(transactionId);
    }

    loadCategorySelect();

    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    setTimeout(() => {
        document.getElementById('name').focus();
    }, 100);
}

export function openDetailsModal(transactionId) {
    const modal = document.getElementById('transactionDetailsModal');
    if (!modal) return;

    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const iconName = getCategoryIcon(transaction.category);
    const amount = formatCurrency(Math.abs(transaction.amount));
    const prefix = transaction.is_income ? '+' : '-';
    const color = transaction.is_income ? 'var(--success)' : 'var(--danger)';

    // Header
    const iconEl = document.getElementById('detailsIcon');
    iconEl.innerHTML = getIcon(iconName, 32);
    iconEl.style.color = color;
    iconEl.style.background = transaction.is_income ? 'var(--success-bg)' : 'var(--danger-bg)';
    iconEl.style.width = '64px';
    iconEl.style.height = '64px';
    iconEl.style.borderRadius = 'var(--radius-md)';
    iconEl.style.display = 'inline-flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';

    document.getElementById('detailsName').textContent = transaction.name;
    const amountEl = document.getElementById('detailsAmount');
    amountEl.textContent = `${prefix}${amount}`;
    amountEl.style.color = color;

    // Details
    document.getElementById('detailsCategory').textContent = transaction.category;
    document.getElementById('detailsDate').textContent = formatDate(transaction.date);
    document.getElementById('detailsType').textContent = transaction.is_income ? 'Income' : 'Expense';

    // Tags
    const tagsContainer = document.getElementById('detailsTagsContainer');
    const tagsEl = document.getElementById('detailsTags');
    if (transaction.tags && transaction.tags.length > 0) {
        tagsContainer.style.display = 'block';
        tagsEl.innerHTML = transaction.tags.map(tag =>
            `<span class="badge" style="background: var(--bg-tertiary); color: var(--text-secondary);">${tag}</span>`
        ).join('');
    } else {
        tagsContainer.style.display = 'none';
    }

    // Items (from receipt scan)
    const itemsContainer = document.getElementById('detailsItemsContainer');
    const itemsEl = document.getElementById('detailsItems');
    if (transaction.items && transaction.items.length > 0) {
        itemsContainer.style.display = 'block';
        itemsEl.innerHTML = transaction.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                <div>
                    <div style="font-weight: 500;">${item.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${item.quantity} x ${formatCurrency(item.price)}</div>
                </div>
                <div style="font-weight: 600;">${formatCurrency(item.quantity * item.price)}</div>
            </div>
        `).join('');
    } else {
        itemsContainer.style.display = 'none';
        itemsEl.innerHTML = '';
    }

    // Description
    const descContainer = document.getElementById('detailsDescriptionContainer');
    const descEl = document.getElementById('detailsDescription');
    if (transaction.description) {
        descContainer.style.display = 'block';
        descEl.textContent = transaction.description;
    } else {
        descContainer.style.display = 'none';
    }

    // Edit Button
    const editBtn = document.getElementById('detailsEditBtn');
    editBtn.onclick = () => {
        closeDetailsModal();
        setTimeout(() => openModal(transactionId), 300);
    };

    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

export function closeDetailsModal() {
    const modal = document.getElementById('transactionDetailsModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
    }, 300);
}

export function closeModal() {
    const modal = document.getElementById('transactionModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
    }, 300);
}

async function loadTransactionForEdit(id) {
    const transaction = allTransactions.find(t => t.id === id);
    if (!transaction) return;

    document.getElementById('transactionId').value = transaction.id;
    document.getElementById('name').value = transaction.name;
    document.getElementById('amount').value = Math.abs(transaction.amount);
    document.getElementById('category').value = transaction.category;
    document.getElementById('date').value = new Date(transaction.date).toISOString().split('T')[0];
    document.getElementById('tags').value = transaction.tags ? transaction.tags.join(', ') : '';
    document.getElementById('description').value = transaction.description || '';

    setTransactionType(transaction.is_income ? 'income' : 'expense');
}

// ============================================
// TRANSACTION TYPE TOGGLE
// ============================================

export function setTransactionType(type) {
    currentTransactionType = type;

    document.querySelectorAll('.type-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains(type)) {
            btn.classList.add('active');
        }
    });

    // Update category select based on type
    loadCategorySelect();
}

// ============================================
// LOAD CATEGORIES
// ============================================

async function loadCategories() {
    try {
        const response = await fetch('/api/categories', { headers: auth.getHeaders() });
        allCategories = await response.json();
        return allCategories;
    } catch (error) {
        console.error('Failed to load categories:', error);
        return [];
    }
}

function loadCategorySelect() {
    const select = document.getElementById('category');
    if (!select || !allCategories.length) return;

    const currentValue = select.value;
    const type = currentTransactionType;

    const filteredCategories = allCategories.filter(cat =>
        cat.type === type || cat.type === 'both'
    );

    select.innerHTML = '<option value="">Select category</option>' +
        filteredCategories.map(cat =>
            `<option value="${cat.name}">${cat.name}</option>`
        ).join('');

    if (currentValue && filteredCategories.some(c => c.name === currentValue)) {
        select.value = currentValue;
    }

    // Update category filter if exists
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        const filterValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
            allCategories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
        categoryFilter.value = filterValue;
    }
}

export function getCategoryIcon(categoryName) {
    const category = allCategories.find(c => c.name === categoryName);
    return category?.icon || 'other';
}

// ============================================
// REFRESH TRANSACTIONS
// ============================================

async function refreshTransactions() {
    try {
        const response = await fetch('/api/transactions', { headers: auth.getHeaders() });
        if (!response.ok) throw new Error('Failed to load transactions');
        
        const json = await response.json();
        // Update the allTransactions array
        allTransactions.length = 0;
        allTransactions.push(...json);
        
        // Call view-specific refresh functions if they exist
        if (typeof window.updateDashboard === 'function') {
            window.updateDashboard();
        }
        if (typeof window.filterTransactions === 'function') {
            window.filterTransactions();
        }
        if (typeof window.renderAllTabs === 'function') {
            window.renderAllTabs();
        }
        // Check for analytics refresh
        if (typeof window.updateAnalytics === 'function') {
            window.updateAnalytics();
        }
    } catch (error) {
        console.error('Failed to refresh transactions:', error);
    }
}

// ============================================
// SAVE TRANSACTION
// ============================================

export async function saveTransaction() {
    const id = document.getElementById('transactionId').value;
    const name = document.getElementById('name').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const tagsInput = document.getElementById('tags').value;
    const description = document.getElementById('description').value.trim();

    if (!name || !amount || !category || !date) {
        showToast('error', 'Validation Error', 'Please fill in all required fields');
        return;
    }

    const isIncome = currentTransactionType === 'income';
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

    const transaction = {
        id: id || undefined,
        name,
        category,
        amount: isIncome ? Math.abs(amount) : -Math.abs(amount),
        date: new Date(date).toISOString(),
        tags,
        is_income: isIncome,
        description
    };

    try {
        const url = id ? `/api/transactions/${id}` : '/api/transactions';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: auth.getHeaders(),
            body: JSON.stringify(transaction)
        });

        if (response.ok) {
            closeModal();
            showToast('success', id ? 'Updated' : 'Added', `${name} - ${formatCurrency(Math.abs(amount))}`);

            // Refresh transactions and update all views
            await refreshTransactions();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        showToast('error', 'Error', 'Failed to save transaction');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function formatCurrency(amount) {
    const symbol = settings?.currency_symbol || '$';
    const absAmount = Math.abs(amount);
    return `${symbol}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        const modalId = e.target.id;
        if (modalId === 'transactionModal') closeModal();
        else if (modalId === 'transactionDetailsModal') closeDetailsModal();
        else if (modalId === 'deleteModal' && typeof closeDeleteModal === 'function') closeDeleteModal();
        else if (modalId === 'clearDataModal' && typeof closeClearDataModal === 'function') closeClearDataModal();
        else if (modalId === 'categoryModal' && typeof closeCategoryModal === 'function') closeCategoryModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeDetailsModal();
        if (typeof closeDeleteModal === 'function') closeDeleteModal();
        if (typeof closeClearDataModal === 'function') closeClearDataModal();
        if (typeof closeCategoryModal === 'function') closeCategoryModal();
    }
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (settings?.theme === 'auto') {
        applyTheme('auto');
    }
});

// Expose core functions to window for inline handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.setTransactionType = setTransactionType;
window.saveTransaction = saveTransaction;

// ============================================
// RECEIPT SCANNER
// ============================================

let receiptImageData = null;
let scannedData = null;
let checkoutItems = [];

export function openScannerModal() {
    const modal = document.getElementById('scannerModal');
    if (!modal) return;

    resetScannerModal();
    loadCheckoutCategories();

    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

export function closeScannerModal() {
    const modal = document.getElementById('scannerModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
        resetScannerModal();
    }, 300);
}

function resetScannerModal() {
    receiptImageData = null;
    scannedData = null;
    checkoutItems = [];

    const scannerContent = document.getElementById('scannerContent');
    const scannerLoading = document.getElementById('scannerLoading');
    const scannerCheckout = document.getElementById('scannerCheckout');
    const receiptPreview = document.getElementById('receiptPreview');
    const scanReceiptBtn = document.getElementById('scanReceiptBtn');
    const confirmCheckoutBtn = document.getElementById('confirmCheckoutBtn');

    if (scannerContent) scannerContent.style.display = 'block';
    if (scannerLoading) scannerLoading.style.display = 'none';
    if (scannerCheckout) scannerCheckout.style.display = 'none';
    if (receiptPreview) receiptPreview.style.display = 'none';
    if (scanReceiptBtn) scanReceiptBtn.style.display = 'none';
    if (confirmCheckoutBtn) confirmCheckoutBtn.style.display = 'none';

    // Clear file inputs
    const fileInput = document.getElementById('receiptFileInput');
    const cameraInput = document.getElementById('receiptCameraInput');
    if (fileInput) fileInput.value = '';
    if (cameraInput) cameraInput.value = '';
}

function loadCheckoutCategories() {
    const select = document.getElementById('checkoutCategory');
    if (!select || !allCategories.length) return;

    const expenseCategories = allCategories.filter(cat => cat.type === 'expense' || cat.type === 'both');
    select.innerHTML = expenseCategories.map(cat =>
        `<option value="${cat.name}">${cat.name}</option>`
    ).join('');
}

function handleReceiptFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        receiptImageData = e.target.result;

        // Show preview
        document.getElementById('receiptImage').src = receiptImageData;
        document.getElementById('receiptPreview').style.display = 'block';
        document.getElementById('scanReceiptBtn').style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
}

function clearReceiptPreview() {
    receiptImageData = null;
    document.getElementById('receiptPreview').style.display = 'none';
    document.getElementById('scanReceiptBtn').style.display = 'none';

    const fileInput = document.getElementById('receiptFileInput');
    const cameraInput = document.getElementById('receiptCameraInput');
    if (fileInput) fileInput.value = '';
    if (cameraInput) cameraInput.value = '';
}

async function scanReceipt() {
    if (!receiptImageData) {
        showToast('error', 'Error', 'Please select an image first');
        return;
    }

    // Show loading
    document.getElementById('scannerContent').style.display = 'none';
    document.getElementById('scannerLoading').style.display = 'block';
    document.getElementById('scanReceiptBtn').style.display = 'none';

    try {
        const response = await fetch('/api/scan-receipt', {
            method: 'POST',
            headers: auth.getHeaders(),
            body: JSON.stringify({ image: receiptImageData })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to scan receipt');
        }

        scannedData = result.data;
        checkoutItems = scannedData.items || [];

        // Show checkout page
        document.getElementById('scannerLoading').style.display = 'none';
        document.getElementById('scannerCheckout').style.display = 'block';
        document.getElementById('confirmCheckoutBtn').style.display = 'inline-flex';

        // Fill checkout data
        document.getElementById('checkoutStoreName').value = scannedData.store_name || '';
        document.getElementById('checkoutDate').value = scannedData.date || new Date().toISOString().split('T')[0];
        document.getElementById('checkoutCategory').value = scannedData.category || 'Other';
        document.getElementById('checkoutTax').value = scannedData.tax || 0;
        document.getElementById('checkoutTotal').value = scannedData.total || 0;

        // Render items
        renderCheckoutItems();
        updateCheckoutTotals();

        showToast('success', 'Receipt Scanned', `Found ${checkoutItems.length} items`);

    } catch (error) {
        console.error('Error scanning receipt:', error);
        showToast('error', 'Scan Failed', error.message);

        // Reset to content view
        document.getElementById('scannerLoading').style.display = 'none';
        document.getElementById('scannerContent').style.display = 'block';
        document.getElementById('scanReceiptBtn').style.display = 'inline-flex';
    }
}

function renderCheckoutItems() {
    const container = document.getElementById('checkoutItemsList');
    if (!container) return;

    if (checkoutItems.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">No items found. Add items manually.</div>';
    } else {
        container.innerHTML = checkoutItems.map((item, index) => `
            <div class="checkout-item" data-index="${index}">
                <input type="text" class="name-input" value="${escapeHtml(item.name || '')}" placeholder="Item name" onchange="updateCheckoutItem(${index}, 'name', this.value)">
                <input type="number" class="qty-input" value="${item.quantity || 1}" min="1" onchange="updateCheckoutItem(${index}, 'quantity', this.value)">
                <input type="number" class="price-input" value="${item.price || 0}" step="0.01" min="0" onchange="updateCheckoutItem(${index}, 'price', this.value)">
                <button class="remove-btn" onclick="removeCheckoutItem(${index})">${getIcon('x', 16)}</button>
            </div>
        `).join('');
    }

    document.getElementById('checkoutItemCount').textContent = checkoutItems.length;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCheckoutItem(index, field, value) {
    if (index < 0 || index >= checkoutItems.length) return;

    if (field === 'quantity') {
        checkoutItems[index].quantity = parseInt(value) || 1;
    } else if (field === 'price') {
        checkoutItems[index].price = parseFloat(value) || 0;
    } else {
        checkoutItems[index][field] = value;
    }

    updateCheckoutTotals();
}

function removeCheckoutItem(index) {
    checkoutItems.splice(index, 1);
    renderCheckoutItems();
    updateCheckoutTotals();
}

function addCheckoutItem() {
    checkoutItems.push({ name: '', quantity: 1, price: 0 });
    renderCheckoutItems();

    // Focus the new item's name input
    const container = document.getElementById('checkoutItemsList');
    const lastInput = container.querySelector('.checkout-item:last-child .name-input');
    if (lastInput) lastInput.focus();
}

function updateCheckoutTotals() {
    const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('checkoutSubtotal').textContent = formatCurrency(subtotal);

    // Update item count
    document.getElementById('checkoutItemCount').textContent = checkoutItems.length;
}

async function confirmCheckout() {
    const storeName = document.getElementById('checkoutStoreName').value.trim();
    const date = document.getElementById('checkoutDate').value;
    const category = document.getElementById('checkoutCategory').value;
    const total = parseFloat(document.getElementById('checkoutTotal').value) || 0;

    if (!storeName) {
        showToast('error', 'Error', 'Please enter a store name');
        return;
    }

    if (total <= 0) {
        showToast('error', 'Error', 'Please enter a valid total amount');
        return;
    }

    // Prepare items for saving
    const validItems = checkoutItems.filter(item => item.name && item.name.trim());

    const transaction = {
        name: storeName,
        amount: -Math.abs(total),
        category: category,
        is_income: false,
        date: new Date(date).toISOString(),
        items: validItems,
        description: validItems.length > 0 ? `${validItems.length} items from receipt scan` : ''
    };

    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: auth.getHeaders(),
            body: JSON.stringify(transaction)
        });

        if (response.ok) {
            closeScannerModal();
            showToast('success', 'Transaction Added', `${storeName} - ${formatCurrency(total)}`);

            // Refresh transactions and update all views
            await refreshTransactions();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
        showToast('error', 'Error', 'Failed to save transaction');
    }
}

// Expose scanner modal functions to window for inline handlers
window.openScannerModal = openScannerModal;
window.closeScannerModal = closeScannerModal;
window.scanReceipt = scanReceipt;
window.confirmCheckout = confirmCheckout;
window.handleReceiptFile = handleReceiptFile;
window.clearReceiptPreview = clearReceiptPreview;
window.addCheckoutItem = addCheckoutItem;
window.updateCheckoutItem = updateCheckoutItem;
window.removeCheckoutItem = removeCheckoutItem;
