import { auth } from '../auth.js';
import {
    formatCurrency, formatDate, getIcon, getCategoryIcon, showToast,
    openModal, closeModal, openDetailsModal, closeDetailsModal, saveTransaction,
    setTransactionType // Need this too for the modal toggle
} from '../core.js';

let allTransactions = [];
let expensesPieChart = null;
let incomePieChart = null;

export const TransactionsView = {
    render: async () => {
        return `
            <div class="container animate-fade-in">
                <!-- ... header ... -->
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Transactions</h1>
                        <p class="page-subtitle">All your income and expenses</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.openModal()" id="addBtn">
                        ${getIcon('plus', 18)} <span>Add Transaction</span>
                    </button>
                </div>

                <!-- Tabs -->
                <div class="tabs" id="transactionTabs">
                    <button class="tab active" data-tab="all" onclick="window.switchTab('all')">
                        <span id="tabAllIcon">${getIcon('list', 18)}</span>
                        <span>All</span>
                    </button>
                    <button class="tab" data-tab="expenses" onclick="window.switchTab('expenses')">
                        <span id="tabExpensesIcon">${getIcon('trendingDown', 18)}</span>
                        <span>Expenses</span>
                    </button>
                    <button class="tab" data-tab="income" onclick="window.switchTab('income')">
                        <span id="tabIncomeIcon">${getIcon('trendingUp', 18)}</span>
                        <span>Income</span>
                    </button>
                </div>

                <!-- All Transactions Tab -->
                <div class="tab-content active" id="tab-all">
                    <div class="table-card animate-slide-up">
                        <div class="table-header">
                            <div class="search-box">
                                <span class="search-icon">${getIcon('search', 18)}</span>
                                <input type="text" id="searchInput" class="search-input" placeholder="Search transactions..."
                                    oninput="window.filterTransactions()">
                            </div>
                            <div class="filter-group">
                                <select id="categoryFilter" class="form-select" style="width: auto; min-width: 150px;"
                                    onchange="window.filterTransactions()">
                                    <option value="all">All Categories</option>
                                </select>
                            </div>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th style="width: 100px;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="transactionsTableBody">
                                    <tr>
                                        <td colspan="6" class="text-center text-muted" style="padding: 2rem;">
                                            <div class="spinner" style="margin: 0 auto;"></div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Expenses Tab -->
                <div class="tab-content" id="tab-expenses">
                    <div class="chart-grid" style="margin-bottom: 1.5rem;">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3 class="card-title" id="expensesPieTitle">${getIcon('pieChart', 18)} Expenses by Category</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="expensesPieChart"></canvas>
                            </div>
                        </div>
                        <div class="stats-grid" style="grid-template-columns: 1fr; gap: 1rem;">
                            <div class="stat-card expense">
                                <div class="stat-header">
                                    <div class="stat-icon" id="totalExpenseIcon">${getIcon('trendingDown', 20)}</div>
                                    <span class="stat-label">Total Expenses</span>
                                </div>
                                <div class="stat-value" id="expensesTotal">$0.00</div>
                            </div>
                            <div class="stat-card expense" style="--danger: #ff8787;">
                                <div class="stat-header">
                                    <div class="stat-icon" id="avgExpenseIcon">${getIcon('barChart', 20)}</div>
                                    <span class="stat-label">Average per Transaction</span>
                                </div>
                                <div class="stat-value" id="expensesAvg">$0.00</div>
                            </div>
                        </div>
                    </div>
                    <div class="table-card">
                        <div class="table-header">
                            <div class="search-box">
                                <span class="search-icon">${getIcon('search', 18)}</span>
                                <input type="text" id="searchInputExpenses" class="search-input"
                                    placeholder="Search expenses..." oninput="window.filterExpenses()">
                            </div>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th style="width: 100px;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="expensesTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Income Tab -->
                <div class="tab-content" id="tab-income">
                    <div class="chart-grid" style="margin-bottom: 1.5rem;">
                        <div class="chart-card">
                            <div class="card-header">
                                <h3 class="card-title" id="incomePieTitle">${getIcon('pieChart', 18)} Income by Category</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="incomePieChart"></canvas>
                            </div>
                        </div>
                        <div class="stats-grid" style="grid-template-columns: 1fr; gap: 1rem;">
                            <div class="stat-card income">
                                <div class="stat-header">
                                    <div class="stat-icon" id="totalIncomeIcon">${getIcon('trendingUp', 20)}</div>
                                    <span class="stat-label">Total Income</span>
                                </div>
                                <div class="stat-value" id="incomeTotal">$0.00</div>
                            </div>
                            <div class="stat-card income" style="--success: #55efc4;">
                                <div class="stat-header">
                                    <div class="stat-icon" id="avgIncomeIcon">${getIcon('barChart', 20)}</div>
                                    <span class="stat-label">Average per Transaction</span>
                                </div>
                                <div class="stat-value" id="incomeAvg">$0.00</div>
                            </div>
                        </div>
                    </div>
                    <div class="table-card">
                        <div class="table-header">
                            <div class="search-box">
                                <span class="search-icon">${getIcon('search', 18)}</span>
                                <input type="text" id="searchInputIncome" class="search-input" placeholder="Search income..."
                                    oninput="window.filterIncome()">
                            </div>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th style="width: 100px;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="incomeTableBody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init: async () => {
        // Load data
        await loadCategories();
        await loadTransactions();
        loadCategorySelect();

        // Expose functions to window for inline onclick handlers
        window.switchTab = switchTab;
        window.filterTransactions = filterTransactions;
        window.filterExpenses = filterExpenses;
        window.filterIncome = filterIncome;
        window.showDeleteModal = showDeleteModal;

        // Core Modal functions
        window.openModal = openModal;
        window.closeModal = closeModal;
        window.openDetailsModal = openDetailsModal;
        window.closeDetailsModal = closeDetailsModal;
        window.saveTransaction = saveTransaction;
        window.setTransactionType = setTransactionType;

        // Initial render
        renderAllTabs();
    }
};

// -- Data Loading --

async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions', { headers: auth.getHeaders() });
        allTransactions = await response.json();
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast('error', 'Error', 'Failed to load transactions');
    }
}

let allCategories = [];
async function loadCategories() {
    try {
        const response = await fetch('/api/categories', { headers: auth.getHeaders() });
        allCategories = await response.json();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function loadCategorySelect() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;

    // Preserve current value
    const currentVal = filter.value;

    filter.innerHTML = '<option value="all">All Categories</option>' +
        allCategories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

    filter.value = currentVal || 'all';
}


// -- Tab Logic --

function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('#transactionTabs .tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');

    // Render logic
    if (tab === 'expenses') renderExpensesTab();
    else if (tab === 'income') renderIncomeTab();
}


// -- Rendering Tables --

function renderAllTabs() {
    renderTable(allTransactions);
    renderExpensesTab();
    renderIncomeTab();
}

function renderTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    if (!transactions.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted" style="padding: 2rem;">
                    ${getIcon('wallet', 32)}
                    <p style="margin-top: 0.5rem;">No transactions found</p>
                </td>
            </tr>
        `;
        return;
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = transactions.map(t => {
        const type = t.is_income ? 'income' : 'expense';
        const iconName = getCategoryIconFromList(t.category);

        return `
            <tr onclick="window.openDetailsModal('${t.id}')" style="cursor: pointer;">
                <td>${formatDate(t.date)}</td>
                <td>
                    <strong>${t.name}</strong>
                    ${t.description ? `<br><small class="text-muted">${t.description}</small>` : ''}
                </td>
                <td>
                    <span class="transaction-category" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                        ${getIcon(iconName, 14)}
                        ${t.category}
                    </span>
                </td>
                <td><span class="badge ${type}">${getIcon(t.is_income ? 'trendingUp' : 'trendingDown', 14)} ${t.is_income ? 'Income' : 'Expense'}</span></td>
                <td class="${t.is_income ? 'text-success' : 'text-danger'}">
                    <strong>${t.is_income ? '+' : '-'}${formatCurrency(Math.abs(t.amount))}</strong>
                </td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.openModal('${t.id}')" title="Edit">
                            ${getIcon('edit', 16)}
                        </button>
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showDeleteModal('${t.id}')" title="Delete">
                            ${getIcon('trash', 16)}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderExpensesTab() {
    const expenses = allTransactions.filter(t => !t.is_income);
    updateStats('expenses', expenses);
    renderExpensesPieChart(expenses);
    renderExpensesTable(expenses);
}

function renderIncomeTab() {
    const income = allTransactions.filter(t => t.is_income);
    updateStats('income', income);
    renderIncomePieChart(income);
    renderIncomeTable(income);
}

function updateStats(type, items) {
    const total = items.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avg = items.length > 0 ? total / items.length : 0;

    const totalEl = document.getElementById(`${type}Total`);
    const avgEl = document.getElementById(`${type}Avg`);

    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (avgEl) avgEl.textContent = formatCurrency(avg);
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;

    if (!expenses.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">No expenses found</td></tr>`;
        return;
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = expenses.map(t => {
        const iconName = getCategoryIconFromList(t.category);
        return `
            <tr onclick="window.openDetailsModal('${t.id}')" style="cursor: pointer;">
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.name}</strong></td>
                <td><span class="transaction-category">${getIcon(iconName, 14)} ${t.category}</span></td>
                <td class="text-danger"><strong>-${formatCurrency(Math.abs(t.amount))}</strong></td>
                <td>
                     <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.openModal('${t.id}')">${getIcon('edit', 16)}</button>
                     <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showDeleteModal('${t.id}')">${getIcon('trash', 16)}</button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderIncomeTable(income) {
    const tbody = document.getElementById('incomeTableBody');
    if (!tbody) return;

    if (!income.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 2rem;">No income found</td></tr>`;
        return;
    }

    income.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = income.map(t => {
        const iconName = getCategoryIconFromList(t.category);
        return `
            <tr onclick="window.openDetailsModal('${t.id}')" style="cursor: pointer;">
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.name}</strong></td>
                <td><span class="transaction-category">${getIcon(iconName, 14)} ${t.category}</span></td>
                <td class="text-success"><strong>+${formatCurrency(Math.abs(t.amount))}</strong></td>
                 <td>
                     <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.openModal('${t.id}')">${getIcon('edit', 16)}</button>
                     <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showDeleteModal('${t.id}')">${getIcon('trash', 16)}</button>
                </td>
            </tr>
        `;
    }).join('');
}

// -- Charts --

function renderExpensesPieChart(items) {
    renderPieChart('expensesPieChart', items, expensesPieChart, (chart) => expensesPieChart = chart);
}

function renderIncomePieChart(items) {
    renderPieChart('incomePieChart', items, incomePieChart, (chart) => incomePieChart = chart);
}

function renderPieChart(canvasId, items, chartInstance, setChart) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const categoryMap = {};
    items.forEach(t => categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount));

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    if (chartInstance) chartInstance.destroy();

    const colors = ['#ff6b6b', '#ff8787', '#ffa8a8', '#00d4aa', '#55efc4', '#feca57', '#54a0ff', '#5f27cd'];

    const newChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });

    setChart(newChart);
}

// -- Filters --

function filterTransactions() {
    const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const cat = document.getElementById('categoryFilter')?.value || 'all';

    let filtered = allTransactions;
    if (term) filtered = filtered.filter(t => t.name.toLowerCase().includes(term));
    if (cat !== 'all') filtered = filtered.filter(t => t.category === cat);

    renderTable(filtered);
}

function filterExpenses() {
    const term = document.getElementById('searchInputExpenses')?.value.toLowerCase() || '';
    let filtered = allTransactions.filter(t => !t.is_income);
    if (term) filtered = filtered.filter(t => t.name.toLowerCase().includes(term));
    renderExpensesTable(filtered);
}

function filterIncome() {
    const term = document.getElementById('searchInputIncome')?.value.toLowerCase() || '';
    let filtered = allTransactions.filter(t => t.is_income);
    if (term) filtered = filtered.filter(t => t.name.toLowerCase().includes(term));
    renderIncomeTable(filtered);
}

// -- Delete Modal --

let deleteTransactionId = null;

function showDeleteModal(id) {
    deleteTransactionId = id;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('active', 'show');
        // Attach confirm handler dynamically if needed or rely on static html if global
        // Since deleteModal is global in index.html, we need to ensure confirmDelete is available
        window.confirmDelete = confirmDelete;
    }
}

async function confirmDelete() {
    if (!deleteTransactionId) return;
    try {
        const response = await fetch(`/api/transactions/${deleteTransactionId}`, {
            method: 'DELETE',
            headers: auth.getHeaders()
        });

        if (response.ok) {
            document.getElementById('deleteModal').classList.remove('show', 'active');
            showToast('success', 'Deleted', 'Transaction deleted');
            await loadTransactions();
            renderAllTabs();
        } else {
            throw new Error('Failed to delete');
        }
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete transaction');
    }
}

function getCategoryIconFromList(name) {
    const cat = allCategories.find(c => c.name === name);
    return cat?.icon || 'tag';
}
