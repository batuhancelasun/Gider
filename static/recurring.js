// ============================================
// GIDER - Recurring Transactions JavaScript
// ============================================

let recurringTransactions = [];
let currentRecurringType = 'expense';
let selectedFrequency = 'monthly';
let deleteRecurringId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit to ensure icons.js is loaded
    if (typeof getIcon === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    await loadSettings();
    await loadCategories();
    await loadRecurringTransactions();
    initRecurringIcons();
    renderRecurringLists();
    updateRecurringStats();
});

function initRecurringIcons() {
    // Navigation icons - set directly
    const navItems = document.getElementById('nav-items');
    const navRecurring = document.getElementById('nav-recurring');
    if (navItems) navItems.innerHTML = getIcon('shoppingBag', 18) + '<span>Items</span>';
    if (navRecurring) navRecurring.innerHTML = getIcon('subscriptions', 18) + '<span>Recurring</span>';

    // Add button
    const addRecurringBtn = document.getElementById('addRecurringBtn');
    if (addRecurringBtn) addRecurringBtn.innerHTML = getIcon('plus', 18) + '<span>Add Recurring</span>';

    // Stat icons
    const monthlyExpenseIcon = document.getElementById('monthlyExpenseIcon');
    if (monthlyExpenseIcon) monthlyExpenseIcon.innerHTML = getIcon('trendingDown', 20);

    const monthlyIncomeIcon = document.getElementById('monthlyIncomeIcon');
    if (monthlyIncomeIcon) monthlyIncomeIcon.innerHTML = getIcon('trendingUp', 20);

    const monthlyNetIcon = document.getElementById('monthlyNetIcon');
    if (monthlyNetIcon) monthlyNetIcon.innerHTML = getIcon('wallet', 20);

    // Section titles
    const expensesTitle = document.getElementById('expensesTitle');
    if (expensesTitle) expensesTitle.innerHTML = getIcon('trendingDown', 18) + '<span>Recurring Expenses</span>';

    const incomeTitle = document.getElementById('incomeTitle');
    if (incomeTitle) incomeTitle.innerHTML = getIcon('trendingUp', 18) + '<span>Recurring Income</span>';

    // Modal icons
    const recurringExpenseTypeIcon = document.getElementById('recurringExpenseTypeIcon');
    if (recurringExpenseTypeIcon) recurringExpenseTypeIcon.innerHTML = getIcon('trendingDown', 18);

    const recurringIncomeTypeIcon = document.getElementById('recurringIncomeTypeIcon');
    if (recurringIncomeTypeIcon) recurringIncomeTypeIcon.innerHTML = getIcon('trendingUp', 18);

    const saveRecurringBtn = document.getElementById('saveRecurringBtn');
    if (saveRecurringBtn) saveRecurringBtn.innerHTML = getIcon('check', 18) + '<span>Save</span>';

    const confirmDeleteRecurringBtn = document.getElementById('confirmDeleteRecurringBtn');
    if (confirmDeleteRecurringBtn) confirmDeleteRecurringBtn.innerHTML = getIcon('trash', 18) + '<span>Delete</span>';

    const recurringModalClose = document.getElementById('recurringModalClose');
    if (recurringModalClose) recurringModalClose.innerHTML = getIcon('x', 18);

    const deleteRecurringModalClose = document.getElementById('deleteRecurringModalClose');
    if (deleteRecurringModalClose) deleteRecurringModalClose.innerHTML = getIcon('x', 18);
}

async function loadRecurringTransactions() {
    try {
        const response = await fetch('/api/recurring');
        recurringTransactions = await response.json();
    } catch (error) {
        console.error('Failed to load recurring transactions:', error);
        recurringTransactions = [];
    }
}

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
        if (rt.is_income) {
            monthlyIncome += monthly;
        } else {
            monthlyExpenses += monthly;
        }
    });

    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);

    const net = monthlyIncome - monthlyExpenses;
    const netEl = document.getElementById('monthlyNet');
    netEl.textContent = (net >= 0 ? '+' : '-') + formatCurrency(Math.abs(net));
    netEl.parentElement.parentElement.className = net >= 0 ? 'stat-card income animate-slide-up' : 'stat-card expense animate-slide-up';
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
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="editRecurring('${rt.id}')" title="Edit">
                        ${getIcon('edit', 16)}
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="toggleRecurringStatus('${rt.id}')" title="${isActive ? 'Pause' : 'Resume'}">
                        ${getIcon(isActive ? 'x' : 'check', 16)}
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="deleteRecurring('${rt.id}')" title="Delete" style="color: var(--danger);">
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

// ============================================
// MODAL FUNCTIONS
// ============================================

function openRecurringModal(id = null) {
    const modal = document.getElementById('recurringModal');
    if (!modal) return;

    // Reset form
    document.getElementById('recurringForm').reset();
    document.getElementById('recurringId').value = '';
    document.getElementById('recurringStartDate').value = new Date().toISOString().split('T')[0];

    // Set defaults
    setRecurringType('expense');
    selectFrequency('monthly');
    loadRecurringCategorySelect();

    // Set title
    document.getElementById('recurringModalTitle').textContent = id ? 'Edit Recurring' : 'Add Recurring';

    // If editing, load data
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

    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function closeRecurringModal() {
    const modal = document.getElementById('recurringModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
    }, 300);
}

function setRecurringType(type) {
    currentRecurringType = type;

    document.querySelectorAll('#recurringModal .type-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains(type)) {
            btn.classList.add('active');
        }
    });

    loadRecurringCategorySelect();
}

function selectFrequency(freq) {
    selectedFrequency = freq;
    document.getElementById('recurringFrequency').value = freq;

    document.querySelectorAll('.frequency-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.freq === freq) {
            opt.classList.add('active');
        }
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

    if (!name || !amount || !category || !startDate) {
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recurring)
        });

        if (response.ok) {
            closeRecurringModal();
            showToast('success', id ? 'Updated' : 'Added', `${name} - ${getFrequencyLabel(frequency)}`);
            await loadRecurringTransactions();
            renderRecurringLists();
            updateRecurringStats();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Error saving recurring:', error);
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...rt, is_active: newStatus })
        });

        if (response.ok) {
            showToast('success', newStatus ? 'Resumed' : 'Paused', rt.name);
            await loadRecurringTransactions();
            renderRecurringLists();
            updateRecurringStats();
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showToast('error', 'Error', 'Failed to update status');
    }
}

function deleteRecurring(id) {
    deleteRecurringId = id;
    const modal = document.getElementById('deleteRecurringModal');
    if (!modal) return;

    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function closeDeleteRecurringModal() {
    const modal = document.getElementById('deleteRecurringModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
        deleteRecurringId = null;
    }, 300);
}

async function confirmDeleteRecurring() {
    if (!deleteRecurringId) return;

    try {
        const response = await fetch(`/api/recurring/${deleteRecurringId}`, {
            method: 'DELETE'
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
        console.error('Error deleting recurring:', error);
        showToast('error', 'Error', 'Failed to delete recurring transaction');
    }
}

