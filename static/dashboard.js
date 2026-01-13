// ============================================
// GIDER - Dashboard JavaScript
// ============================================

import { auth } from './auth.js';
import {
    settings, allTransactions, formatCurrency, formatDateShort,
    getIcon, getCategoryIcon, showToast, openDetailsModal
} from './core.js';

let expenseChart = null;
let comparisonChart = null;
let upcomingTransactions = { due: [], upcoming: [] };

// Export init function
export async function initDashboard() {
    // We assume loadCategories/loadTransactions might be in core or here.
    // In original code, loadTransactions is here, but check variable scope.
    // allTransactions is global in core.js.
    // loadTransactions modifies allTransactions?
    // In original dashboard.js Line 18: allTransactions = ...
    // But allTransactions is declared in dashboard.js? No.
    // Line 7 of dashboard.js ref: allTransactions? No, line 7 is blank.
    // Let's check original dashboard.js content again.
    // Line 18 says: "allTransactions = await response.json();"
    // "allTransactions" is NOT declared in dashboard.js. It assumes global.
    // So it modifies the exported variable from core.js? 
    // You cannot reassign an imported binding. "allTransactions = ..." will fail if imported.
    // Solution: core.js should export a function `setAllTransactions(data)`.
    await loadTransactions();
        await loadUpcomingTransactions();
    updateDashboard();
    
    // Expose functions to window for use by core.js after saving transactions
    window.loadTransactions = loadTransactions;
    window.updateDashboard = updateDashboard;
}

export async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions', { headers: auth.getHeaders() });
        // We need to update the array in core.js
        // But we can't write to import strings.
        // We'll need to patch core.js to have a setter or just use mutable array methods.
        // "allTransactions.length = 0; allTransactions.push(...json)" ?
        const json = await response.json();
        allTransactions.length = 0;
        allTransactions.push(...json);
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast('error', 'Error', 'Failed to load transactions');
    }
}

    async function loadUpcomingTransactions() {
        try {
            const response = await fetch('/api/recurring/notifications', { headers: auth.getHeaders() });
            upcomingTransactions = await response.json();
        } catch (error) {
            console.error('Failed to load upcoming transactions:', error);
        }
    }

function getCurrentMonthTransactions() {
    const now = new Date();
    const startDate = settings?.start_date || 1;
    const currentDay = now.getDate();

    let monthStart, monthEnd;

    if (currentDay >= startDate) {
        monthStart = new Date(now.getFullYear(), now.getMonth(), startDate);
        monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, startDate - 1, 23, 59, 59);
    } else {
        monthStart = new Date(now.getFullYear(), now.getMonth() - 1, startDate);
        monthEnd = new Date(now.getFullYear(), now.getMonth(), startDate - 1, 23, 59, 59);
    }

    const dateRangeEl = document.getElementById('dateRange');
    if (dateRangeEl) {
        dateRangeEl.textContent = `${formatDateShort(monthStart)} - ${formatDateShort(monthEnd)}`;
    }

    return allTransactions.filter(t => {
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
    });
}

export function updateDashboard() {
    const monthTransactions = getCurrentMonthTransactions();

    const income = monthTransactions
        .filter(t => t.is_income)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = monthTransactions
        .filter(t => !t.is_income)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const balance = income - expenses;

    document.getElementById('totalIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpense').textContent = formatCurrency(expenses);
    document.getElementById('netBalance').textContent = (balance >= 0 ? '+' : '-') + formatCurrency(Math.abs(balance));

    updateExpenseChart(monthTransactions);
    updateComparisonChart(income, expenses);
        updateUpcomingTransactions();
    updateRecentTransactions();
}

function updateExpenseChart(transactions) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    const categoryMap = {};
    transactions.filter(t => !t.is_income).forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    if (expenseChart) {
        expenseChart.destroy();
    }

    const colors = [
        '#00d4aa', '#00cec9', '#0984e3', '#6c5ce7', '#a29bfe',
        '#fd79a8', '#ff6b6b', '#feca57', '#1dd1a1', '#54a0ff'
    ];

    expenseChart = new Chart(ctx, {
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
                    // Navigate to table page with category filter
                    // Navigate via router? Or just href?
                    // "window.location.href" reloads page.
                    // Should use router.navigate if possible, but router isn't imported everywhere.
                    // For now, let's keep it, but it breaks SPA.
                    // We'll fix navigation later.
                    window.location.href = `/table?category=${encodeURIComponent(category)}`;
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            family: "'Plus Jakarta Sans', sans-serif",
                            size: 11
                        },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    onClick: (event, legendItem, legend) => {
                        const category = legendItem.text;
                        window.location.href = `/table?category=${encodeURIComponent(category)}`;
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: '600' },
                    bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                    callbacks: {
                        label: function (context) {
                            return ` ${formatCurrency(context.raw)} - Click to view`;
                        }
                    }
                }
            }
        }
    });

    // Add cursor pointer on hover
    ctx.style.cursor = 'pointer';
}

function updateComparisonChart(income, expenses) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['rgba(0, 212, 170, 0.8)', 'rgba(255, 107, 107, 0.8)'],
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    }
                },
                y: {
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif" },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                        callback: function (value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateRecentTransactions() {
    const list = document.getElementById('recentList');
    if (!list) return;

    const recent = allTransactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);

    if (recent.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                ${getIcon('wallet', 48)}
                <p>No transactions yet</p>
                <p class="text-muted" style="font-size: 0.85rem;">Add your first transaction to get started</p>
            </div>
        `;
        return;
    }

    list.innerHTML = recent.map(t => {
        const amount = t.is_income ? Math.abs(t.amount) : -Math.abs(t.amount);
        const prefix = t.is_income ? '+' : '-';
        const iconName = getCategoryIcon(t.category);

        return `
            <div class="transaction-item ${t.is_income ? 'income' : 'expense'}" onclick="openDetailsModal('${t.id}')">
                <div class="transaction-icon">${getIcon(iconName, 20)}</div>
                <div class="transaction-info">
                    <div class="transaction-name">${t.name}</div>
                    <div class="transaction-meta">
                        <span class="transaction-category">${t.category}</span>
                        <span>•</span>
                        <span>${formatDateShort(t.date)}</span>
                    </div>
                </div>
                <div class="transaction-amount">${prefix}${formatCurrency(Math.abs(amount))}</div>
            </div>
        `;
    }).join('');
}

    function updateUpcomingTransactions() {
        const list = document.getElementById('upcomingList');
        const title = document.getElementById('upcomingTitle');
        if (!list || !title) return;

        // Get icon function
        const upcomingIcon = document.createElement('div');
        upcomingIcon.innerHTML = getIcon('bell', 18);
        title.innerHTML = `${upcomingIcon.innerHTML} Upcoming Transactions`;

        const { due = [], upcoming = [] } = upcomingTransactions;
        const combined = [...due, ...upcoming].slice(0, 5);

        if (combined.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    ${getIcon('check-circle', 48)}
                    <p>No upcoming transactions</p>
                    <p class="text-muted" style="font-size: 0.85rem;">All recurring transactions are up to date</p>
                </div>
            `;
            return;
        }

        list.innerHTML = combined.map(item => {
            const nextDate = new Date(item.next_occurrence);
            const isValidDate = !isNaN(nextDate.getTime());
            const daysUntil = isValidDate ? Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24)) : NaN;
            const isIncome = item.amount >= 0;
            const prefix = isIncome ? '+' : '-';
            const isDue = daysUntil <= 0 && !isNaN(daysUntil);
        
            let timeText;
            if (!isValidDate || isNaN(daysUntil)) {
                timeText = `<span class="text-muted">Invalid date</span>`;
            } else if (daysUntil < 0) {
                timeText = `<span class="text-danger" style="font-weight: 600;">${Math.abs(daysUntil)}d overdue</span>`;
            } else if (daysUntil === 0) {
                timeText = `<span class="text-warning" style="font-weight: 600;">Due today</span>`;
            } else {
                timeText = `<span class="text-muted">In ${daysUntil}d</span>`;
            }

            return `
                <div class="transaction-item ${isIncome ? 'income' : 'expense'} ${isDue ? 'due' : ''}" style="cursor: pointer;" onclick="window.router?.navigate('/recurring') || (window.location.href='/recurring')">
                    <div class="transaction-icon">${getIcon(isIncome ? 'trending-up' : 'trending-down', 20)}</div>
                    <div class="transaction-info">
                        <div class="transaction-name">${item.name}</div>
                        <div class="transaction-meta">
                            <span class="transaction-category">${item.frequency}</span>
                            <span>•</span>
                            <span>${formatDateShort(item.next_occurrence)}</span>
                            <span>•</span>
                            ${timeText}
                        </div>
                    </div>
                    <div class="transaction-amount">${prefix}${formatCurrency(Math.abs(item.amount))}</div>
                </div>
            `;
        }).join('');
    }
