// ============================================
// GIDER - Table View JavaScript
// ============================================

let deleteTransactionId = null;
let expensesPieChart = null;
let incomePieChart = null;
let currentTab = 'all';

// Initialize table
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadTransactions();
    loadCategorySelect();

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam) {
        // Set the category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.value = categoryParam;
        }
        // Filter transactions by the category
        filterTransactions();
    } else {
        renderAllTabs();
    }
});

async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        allTransactions = await response.json();
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast('error', 'Error', 'Failed to load transactions');
    }
}

function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Render the active tab
    if (tab === 'expenses') {
        renderExpensesTab();
    } else if (tab === 'income') {
        renderIncomeTab();
    }
}

function renderAllTabs() {
    renderTable(allTransactions);
    renderExpensesTab();
    renderIncomeTab();
}

function renderTable(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;

    if (transactions.length === 0) {
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
        const iconName = getCategoryIcon(t.category);

        return `
            <tr onclick="openDetailsModal('${t.id}')" style="cursor: pointer;">
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
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); openModal('${t.id}')" title="Edit">
                            ${getIcon('edit', 16)}
                        </button>
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); showDeleteModal('${t.id}')" title="Delete">
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

    // Update stats
    const total = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avg = expenses.length > 0 ? total / expenses.length : 0;

    document.getElementById('expensesTotal').textContent = formatCurrency(total);
    document.getElementById('expensesAvg').textContent = formatCurrency(avg);

    // Render pie chart
    renderExpensesPieChart(expenses);

    // Render table
    renderExpensesTable(expenses);
}

function renderIncomeTab() {
    const income = allTransactions.filter(t => t.is_income);

    // Update stats
    const total = income.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avg = income.length > 0 ? total / income.length : 0;

    document.getElementById('incomeTotal').textContent = formatCurrency(total);
    document.getElementById('incomeAvg').textContent = formatCurrency(avg);

    // Render pie chart
    renderIncomePieChart(income);

    // Render table
    renderIncomeTable(income);
}

function renderExpensesPieChart(expenses) {
    const ctx = document.getElementById('expensesPieChart');
    if (!ctx) return;

    const categoryMap = {};
    expenses.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    if (expensesPieChart) {
        expensesPieChart.destroy();
    }

    const colors = ['#ff6b6b', '#ff8787', '#ffa8a8', '#ffc9c9', '#ff4757', '#ff6348', '#ee5a24', '#ea8685', '#e17055', '#d63031'];

    expensesPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const category = labels[index];
                    // Set the filter
                    const categoryFilter = document.getElementById('categoryFilter');
                    if (categoryFilter) {
                        categoryFilter.value = category;
                        filterTransactions();
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    onClick: (event, legendItem) => {
                        const categoryFilter = document.getElementById('categoryFilter');
                        if (categoryFilter) {
                            categoryFilter.value = legendItem.text;
                            filterTransactions();
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            return ` ${formatCurrency(context.raw)} - Click to filter`;
                        }
                    }
                }
            }
        }
    });
    ctx.style.cursor = 'pointer';
}

function renderIncomePieChart(income) {
    const ctx = document.getElementById('incomePieChart');
    if (!ctx) return;

    const categoryMap = {};
    income.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    if (incomePieChart) {
        incomePieChart.destroy();
    }

    const colors = ['#00d4aa', '#00cec9', '#55efc4', '#00b894', '#1dd1a1', '#10ac84', '#00a8a8', '#26de81', '#20bf6b', '#2bcbba'];

    incomePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const category = labels[index];
                    const categoryFilter = document.getElementById('categoryFilter');
                    if (categoryFilter) {
                        categoryFilter.value = category;
                        filterTransactions();
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    onClick: (event, legendItem) => {
                        const categoryFilter = document.getElementById('categoryFilter');
                        if (categoryFilter) {
                            categoryFilter.value = legendItem.text;
                            filterTransactions();
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            return ` ${formatCurrency(context.raw)} - Click to filter`;
                        }
                    }
                }
            }
        }
    });
    ctx.style.cursor = 'pointer';
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;

    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted" style="padding: 2rem;">
                    ${getIcon('trendingDown', 32)}
                    <p style="margin-top: 0.5rem;">No expenses found</p>
                </td>
            </tr>
        `;
        return;
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = expenses.map(t => {
        const iconName = getCategoryIcon(t.category);
        return `
            <tr onclick="openDetailsModal('${t.id}')" style="cursor: pointer;">
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.name}</strong></td>
                <td>
                    <span class="transaction-category" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                        ${getIcon(iconName, 14)}
                        ${t.category}
                    </span>
                </td>
                <td class="text-danger"><strong>-${formatCurrency(Math.abs(t.amount))}</strong></td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); openModal('${t.id}')" title="Edit">${getIcon('edit', 16)}</button>
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); showDeleteModal('${t.id}')" title="Delete">${getIcon('trash', 16)}</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderIncomeTable(income) {
    const tbody = document.getElementById('incomeTableBody');
    if (!tbody) return;

    if (income.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted" style="padding: 2rem;">
                    ${getIcon('trendingUp', 32)}
                    <p style="margin-top: 0.5rem;">No income found</p>
                </td>
            </tr>
        `;
        return;
    }

    income.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = income.map(t => {
        const iconName = getCategoryIcon(t.category);
        return `
            <tr onclick="openDetailsModal('${t.id}')" style="cursor: pointer;">
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.name}</strong></td>
                <td>
                    <span class="transaction-category" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                        ${getIcon(iconName, 14)}
                        ${t.category}
                    </span>
                </td>
                <td class="text-success"><strong>+${formatCurrency(Math.abs(t.amount))}</strong></td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); openModal('${t.id}')" title="Edit">${getIcon('edit', 16)}</button>
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); showDeleteModal('${t.id}')" title="Delete">${getIcon('trash', 16)}</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterTransactions() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filtered = allTransactions;

    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm) ||
            (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
            (t.description && t.description.toLowerCase().includes(searchTerm))
        );
    }

    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }

    renderTable(filtered);
}

function filterExpenses() {
    const searchTerm = document.getElementById('searchInputExpenses').value.toLowerCase();
    let filtered = allTransactions.filter(t => !t.is_income);

    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    renderExpensesTable(filtered);
}

function filterIncome() {
    const searchTerm = document.getElementById('searchInputIncome').value.toLowerCase();
    let filtered = allTransactions.filter(t => t.is_income);

    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    renderIncomeTable(filtered);
}

// Delete Modal
function showDeleteModal(id) {
    deleteTransactionId = id;
    const modal = document.getElementById('deleteModal');
    if (!modal) return;

    modal.classList.add('active');
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.classList.remove('active');
        deleteTransactionId = null;
    }, 300);
}

async function confirmDelete() {
    if (!deleteTransactionId) return;

    try {
        const response = await fetch(`/api/transactions/${deleteTransactionId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeDeleteModal();
            showToast('success', 'Deleted', 'Transaction deleted successfully');
            await loadTransactions();
            renderAllTabs();
            filterTransactions();
        } else {
            throw new Error('Failed to delete');
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showToast('error', 'Error', 'Failed to delete transaction');
    }
}
