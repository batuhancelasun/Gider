import { auth } from '../auth.js';
import {
    formatCurrency, getIcon, getCategoryIcon, showToast
} from '../core.js';

let recurringTransactions = [];
let currentRecurringType = 'expense';
let selectedFrequency = 'monthly';
let deleteRecurringId = null;
let allCategories = [];
let editingRecurringId = null;

export const RecurringView = {
    render: async () => {
        // Detect if mobile - use flex column for vertical, grid for horizontal
        const isMobile = window.innerWidth < 768;
        const statsStyle = isMobile
            ? 'display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;'
            : 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;';

        return `
            <div class="container animate-fade-in">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Recurring</h1>
                        <p class="page-subtitle">Manage your recurring expenses and income</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.openRecurringModal()" id="addRecurringBtn">
                         ${getIcon('plus', 18)} <span>Add Recurring</span>
                    </button>
                </div>

                <!-- Stats -->
                <div style="${statsStyle}">
                    <div class="stat-card expense">
                        <div class="stat-header">
                            <div class="stat-icon" id="monthlyExpenseIcon">${getIcon('trendingDown', 20)}</div>
                            <span class="stat-label">Monthly Expenses</span>
                        </div>
                        <div class="stat-value" id="monthlyExpenses">$0.00</div>
                    </div>
                    <div class="stat-card income">
                        <div class="stat-header">
                            <div class="stat-icon" id="monthlyIncomeIcon">${getIcon('trendingUp', 20)}</div>
                            <span class="stat-label">Monthly Income</span>
                        </div>
                        <div class="stat-value" id="monthlyIncome">$0.00</div>
                    </div>
                    <div class="stat-card balance" id="monthlyNetCard">
                        <div class="stat-header">
                            <div class="stat-icon" id="monthlyNetIcon">${getIcon('wallet', 20)}</div>
                            <span class="stat-label">Monthly Net</span>
                        </div>
                        <div class="stat-value" id="monthlyNet">$0.00</div>
                    </div>
                </div>

                <!-- Recurring Expenses -->
                <div class="card animate-slide-up" style="margin-bottom: 1.5rem;">
                    <div class="card-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);">
                       <h3 class="card-title">${getIcon('trendingDown', 18)} Recurring Expenses</h3>
                    </div>
                    <div id="recurringExpensesList"></div>
                </div>

                <!-- Recurring Income -->
                <div class="card animate-slide-up">
                    <div class="card-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);">
                        <h3 class="card-title">${getIcon('trendingUp', 18)} Recurring Income</h3>
                    </div>
                    <div id="recurringIncomeList"></div>
                </div>

                <!-- Add/Edit Recurring Modal -->
                <div class="modal-overlay" id="recurringModal">
                    <div class="modal">
                        <div class="modal-header">
                            <h2 class="modal-title" id="recurringModalTitle">Add Recurring</h2>
                            <button class="modal-close" onclick="window.closeRecurringModal()">${getIcon('x', 18)}</button>
                        </div>
                        <div class="modal-body">
                            <form id="recurringForm">
                                <input type="hidden" id="recurringId">
                                
                                <!-- Type Toggle -->
                                <div class="type-toggle" style="margin-bottom: 1rem;">
                                    <button type="button" class="type-toggle-btn expense active" onclick="window.setRecurringType('expense')">
                                        ${getIcon('trendingDown', 18)} <span>Expense</span>
                                    </button>
                                    <button type="button" class="type-toggle-btn income" onclick="window.setRecurringType('income')">
                                        ${getIcon('trendingUp', 18)} <span>Income</span>
                                    </button>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="recurringName">Name *</label>
                                    <input type="text" id="recurringName" class="form-input" placeholder="e.g., Netflix, Rent, Salary" required>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="recurringAmount">Amount *</label>
                                    <input type="number" id="recurringAmount" class="form-input" step="0.01" min="0" placeholder="0.00" required>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="recurringCategory">Category *</label>
                                    <select id="recurringCategory" class="form-select" required></select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Frequency *</label>
                                    <div class="frequency-select">
                                        <div class="frequency-option" data-freq="daily" onclick="window.selectFrequency('daily')">Daily</div>
                                        <div class="frequency-option" data-freq="weekly" onclick="window.selectFrequency('weekly')">Weekly</div>
                                        <div class="frequency-option" data-freq="biweekly" onclick="window.selectFrequency('biweekly')">Bi-weekly</div>
                                        <div class="frequency-option active" data-freq="monthly" onclick="window.selectFrequency('monthly')">Monthly</div>
                                        <div class="frequency-option" data-freq="yearly" onclick="window.selectFrequency('yearly')">Yearly</div>
                                    </div>
                                    <input type="hidden" id="recurringFrequency" value="monthly">
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="recurringStartDate">Start Date *</label>
                                    <input type="date" id="recurringStartDate" class="form-input" required>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="recurringEndDate">End Date (Optional)</label>
                                    <input type="date" id="recurringEndDate" class="form-input">
                                    <p class="form-hint">Leave empty for indefinite</p>
                                </div>

                                <div class="form-group">
                                    <label class="form-label" for="recurringDescription">Description</label>
                                    <textarea id="recurringDescription" class="form-textarea" placeholder="Optional notes..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="window.closeRecurringModal()">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="window.saveRecurring()">
                                ${getIcon('check', 18)} <span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Delete Confirmation Modal -->
                <div class="modal-overlay" id="deleteRecurringModal">
                    <div class="modal" style="max-width: 400px;">
                        <div class="modal-header">
                            <h2 class="modal-title">Delete Recurring?</h2>
                            <button class="modal-close" onclick="window.closeDeleteRecurringModal()">${getIcon('x', 18)}</button>
                        </div>
                        <div class="modal-body">
                            <p style="color: var(--text-secondary);">Are you sure you want to delete this recurring transaction? This won't affect past transactions.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="window.closeDeleteRecurringModal()">Cancel</button>
                            <button type="button" class="btn btn-danger" onclick="window.confirmDeleteRecurring()">
                                ${getIcon('trash', 18)} <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init: async () => {
        await loadCategories();
        await loadRecurringTransactions();

        // Expose functions
        window.openRecurringModal = openRecurringModal;
        window.closeRecurringModal = closeRecurringModal;
        window.setRecurringType = setRecurringType;
        window.selectFrequency = selectFrequency;
        window.saveRecurring = saveRecurring;
        window.editRecurring = editRecurring;
        window.toggleRecurringStatus = toggleRecurringStatus;
        window.deleteRecurring = deleteRecurring;
        window.closeDeleteRecurringModal = closeDeleteRecurringModal;
        window.confirmDeleteRecurring = confirmDeleteRecurring;

        renderRecurringLists();
        updateRecurringStats();

        // Force vertical layout on mobile - inject CSS dynamically
        const mobileStyleId = 'recurring-mobile-fix';
        if (!document.getElementById(mobileStyleId)) {
            const style = document.createElement('style');
            style.id = mobileStyleId;
            style.textContent = `
                @media (max-width: 900px) {
                    .stats-grid {
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 1rem !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// -- Data Loading --

async function loadCategories() {
    try {
        const response = await fetch('/api/categories', { headers: auth.getHeaders() });
        allCategories = await response.json();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadRecurringTransactions() {
    try {
        const response = await fetch('/api/recurring', { headers: auth.getHeaders() });
        recurringTransactions = await response.json();
    } catch (error) {
        console.error('Failed to load recurring transactions:', error);
        recurringTransactions = [];
    }
}

// -- Recurring Logic --

function calculateMonthlyAmount(rt) {
    const amount = Math.abs(rt.amount);
    switch (rt.frequency) {
        case 'daily': return amount * 30;
        case 'weekly': return amount * 4.33;
        case 'biweekly': return amount * 2.17;
        case 'monthly': return amount;
        case 'yearly': return amount / 12;
        default: return amount;
    }
}

function updateRecurringStats() {
    const activeRecurring = recurringTransactions.filter(rt => rt.is_active !== false);

    let monthlyExpenses = 0;
    let monthlyIncome = 0;

    activeRecurring.forEach(rt => {
        const monthly = calculateMonthlyAmount(rt);
        if (rt.is_income) monthlyIncome += monthly;
        else monthlyExpenses += monthly;
    });

    const expensesEl = document.getElementById('monthlyExpenses');
    const incomeEl = document.getElementById('monthlyIncome');
    const netEl = document.getElementById('monthlyNet');

    if (expensesEl) expensesEl.textContent = formatCurrency(monthlyExpenses);
    if (incomeEl) incomeEl.textContent = formatCurrency(monthlyIncome);

    const net = monthlyIncome - monthlyExpenses;
    if (netEl) {
        netEl.textContent = (net >= 0 ? '+' : '-') + formatCurrency(Math.abs(net));
        const netCard = document.getElementById('monthlyNetCard');
        if (netCard) {
            netCard.className = net >= 0 ? 'stat-card income' : 'stat-card expense';
        }
    }
}

function renderRecurringLists() {
    const expenses = recurringTransactions.filter(rt => !rt.is_income);
    const income = recurringTransactions.filter(rt => rt.is_income);

    renderRecurringList('recurringExpensesList', expenses, false);
    renderRecurringList('recurringIncomeList', income, true);
}

function renderRecurringList(containerId, items, isIncome) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No recurring ${isIncome ? 'income' : 'expenses'} yet</div>`;
        return;
    }

    container.innerHTML = items.map(rt => {
        const iconName = getCategoryIcon(rt.category);
        const monthly = calculateMonthlyAmount(rt);
        const freqLabel = getFrequencyLabel(rt.frequency);
        const isActive = rt.is_active !== false;

        return `
            <div class="recurring-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); ${!isActive ? 'opacity: 0.5;' : ''}">
                <div style="width: 40px; height: 40px; border-radius: var(--radius-sm); background: ${isIncome ? 'var(--success-bg)' : 'var(--danger-bg)'}; color: ${isIncome ? 'var(--success)' : 'var(--danger)'}; display: flex; align-items: center; justify-content: center;">
                    ${getIcon(iconName, 20)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-weight: 600;">${escapeHtml(rt.name)}</span>
                        ${!isActive ? '<span class="recurring-badge" style="background: var(--bg-tertiary); color: var(--text-muted);">Paused</span>' : ''}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">
                        ${rt.category} - ${freqLabel}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; color: ${isIncome ? 'var(--success)' : 'var(--danger)'};">
                        ${isIncome ? '+' : '-'}${formatCurrency(Math.abs(rt.amount))}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">
                        ~${formatCurrency(monthly)}/mo
                    </div>
                </div>
                <div style="display: flex; gap: 0.25rem;">
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="window.editRecurring('${rt.id}')" title="Edit">
                        ${getIcon('edit', 16)}
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="window.toggleRecurringStatus('${rt.id}')" title="${isActive ? 'Pause' : 'Resume'}">
                        ${getIcon(isActive ? 'x' : 'check', 16)}
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="window.deleteRecurring('${rt.id}')" title="Delete" style="color: var(--danger);">
                        ${getIcon('trash', 16)}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getFrequencyLabel(freq) {
    const labels = {
        'daily': 'Daily',
        'weekly': 'Weekly',
        'biweekly': 'Bi-weekly',
        'monthly': 'Monthly',
        'yearly': 'Yearly'
    };
    return labels[freq] || freq;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// -- Modal Functions --

function openRecurringModal(id = null) {
    const modal = document.getElementById('recurringModal');
    if (!modal) return;

    editingRecurringId = id;
    document.getElementById('recurringForm').reset();
    document.getElementById('recurringId').value = '';
    document.getElementById('recurringStartDate').value = new Date().toISOString().split('T')[0];

    // Set defaults
    setRecurringType('expense');
    selectFrequency('monthly');
    loadRecurringCategorySelect();

    // Set title
    document.getElementById('recurringModalTitle').textContent = id ? 'Edit Recurring' : 'Add Recurring';

    if (id) {
        const rt = recurringTransactions.find(r => r.id === id);
        if (rt) {
            document.getElementById('recurringId').value = rt.id;
            document.getElementById('recurringName').value = rt.name || '';
            document.getElementById('recurringAmount').value = Math.abs(rt.amount) || '';
            document.getElementById('recurringStartDate').value = rt.start_date ? rt.start_date.split('T')[0] : '';
            document.getElementById('recurringEndDate').value = rt.end_date ? rt.end_date.split('T')[0] : '';
            document.getElementById('recurringDescription').value = rt.description || '';

            setRecurringType(rt.is_income ? 'income' : 'expense');
            selectFrequency(rt.frequency || 'monthly');

            setTimeout(() => {
                document.getElementById('recurringCategory').value = rt.category || '';
            }, 50);
        }
    }

    modal.classList.add('active', 'show');
}

function closeRecurringModal() {
    const modal = document.getElementById('recurringModal');
    if (!modal) return;
    modal.classList.remove('show', 'active');
    editingRecurringId = null;
}

function setRecurringType(type) {
    currentRecurringType = type;
    document.querySelectorAll('#recurringModal .type-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.classList.contains(type));
    });
    loadRecurringCategorySelect();
}

function selectFrequency(freq) {
    selectedFrequency = freq;
    document.getElementById('recurringFrequency').value = freq;
    document.querySelectorAll('.frequency-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.freq === freq);
    });
}

function loadRecurringCategorySelect() {
    const select = document.getElementById('recurringCategory');
    if (!select || !allCategories.length) return;

    const filteredCategories = allCategories.filter(cat =>
        cat.type === currentRecurringType || cat.type === 'both'
    );

    select.innerHTML = '<option value="">Select category</option>' +
        filteredCategories.map(cat =>
            `<option value="${cat.name}">${cat.name}</option>`
        ).join('');
}

async function saveRecurring() {
    const id = document.getElementById('recurringId').value;
    const name = document.getElementById('recurringName').value.trim();
    const amount = parseFloat(document.getElementById('recurringAmount').value);
    const category = document.getElementById('recurringCategory').value;
    const frequency = document.getElementById('recurringFrequency').value;
    const startDate = document.getElementById('recurringStartDate').value;
    const endDate = document.getElementById('recurringEndDate').value;
    const description = document.getElementById('recurringDescription').value.trim();

    if (!name || isNaN(amount) || !category || !startDate) {
        showToast('error', 'Validation Error', 'Please fill in all required fields');
        return;
    }

    const recurring = {
        id: id || undefined,
        name,
        amount: currentRecurringType === 'income' ? Math.abs(amount) : -Math.abs(amount),
        category,
        frequency,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_income: currentRecurringType === 'income',
        is_active: true,
        description
    };

    try {
        const url = id ? `/api/recurring/${id}` : '/api/recurring';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: auth.getHeaders(),
            body: JSON.stringify(recurring)
        });

        if (response.ok) {
            closeRecurringModal();
            showToast('success', id ? 'Updated' : 'Added', `${name}`);
            await loadRecurringTransactions();
            renderRecurringLists();
            updateRecurringStats();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to save recurring transaction');
    }
}

function editRecurring(id) {
    openRecurringModal(id);
}

async function toggleRecurringStatus(id) {
    const rt = recurringTransactions.find(r => r.id === id);
    if (!rt) return;

    const newStatus = rt.is_active === false ? true : false;

    try {
        const response = await fetch(`/api/recurring/${id}`, {
            method: 'PUT',
            headers: auth.getHeaders(),
            body: JSON.stringify({ ...rt, is_active: newStatus })
        });

        if (response.ok) {
            showToast('success', newStatus ? 'Resumed' : 'Paused', rt.name);
            await loadRecurringTransactions();
            renderRecurringLists();
            updateRecurringStats();
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to update status');
    }
}

function deleteRecurring(id) {
    deleteRecurringId = id;
    document.getElementById('deleteRecurringModal')?.classList.add('active', 'show');
}

function closeDeleteRecurringModal() {
    deleteRecurringId = null;
    document.getElementById('deleteRecurringModal')?.classList.remove('show', 'active');
}

async function confirmDeleteRecurring() {
    if (!deleteRecurringId) return;

    try {
        const response = await fetch(`/api/recurring/${deleteRecurringId}`, {
            method: 'DELETE',
            headers: auth.getHeaders()
        });

        if (response.ok) {
            closeDeleteRecurringModal();
            showToast('success', 'Deleted', 'Recurring transaction removed');
            await loadRecurringTransactions();
            renderRecurringLists();
            updateRecurringStats();
        } else {
            throw new Error('Failed to delete');
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete recurring transaction');
    }
}
