// ============================================
// GIDER - Analytics JavaScript
// ============================================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedYear = currentYear;

let monthExpenseChart = null;
let monthIncomeChart = null;
let dailyChart = null;
let yearlyComparisonChart = null;
let yearExpenseChart = null;
let yearIncomeChart = null;

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadTransactions();
    initAnalyticsIcons();
    updateMonthlyView();
    updateYearlyView();
});

function initAnalyticsIcons() {
    // Navigation - add analytics link
    const navAnalytics = document.getElementById('nav-analytics');
    if (navAnalytics) navAnalytics.innerHTML = getIcon('barChart', 18) + '<span>Analytics</span>';
    
    // Tab icons
    const tabMonthlyIcon = document.getElementById('tabMonthlyIcon');
    const tabYearlyIcon = document.getElementById('tabYearlyIcon');
    if (tabMonthlyIcon) tabMonthlyIcon.innerHTML = getIcon('pieChart', 18);
    if (tabYearlyIcon) tabYearlyIcon.innerHTML = getIcon('barChart', 18);
    
    // Navigation buttons
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const prevYearBtn = document.getElementById('prevYearBtn');
    const nextYearBtn = document.getElementById('nextYearBtn');
    if (prevMonthBtn) prevMonthBtn.innerHTML = getIcon('arrowRight', 18);
    if (nextMonthBtn) nextMonthBtn.innerHTML = getIcon('arrowRight', 18);
    if (prevYearBtn) prevYearBtn.innerHTML = getIcon('arrowRight', 18);
    if (nextYearBtn) nextYearBtn.innerHTML = getIcon('arrowRight', 18);
    
    // Rotate left arrows
    if (prevMonthBtn) prevMonthBtn.style.transform = 'rotate(180deg)';
    if (prevYearBtn) prevYearBtn.style.transform = 'rotate(180deg)';
    
    // Stat icons
    ['month', 'year'].forEach(prefix => {
        const incomeIcon = document.getElementById(`${prefix}IncomeIcon`);
        const expenseIcon = document.getElementById(`${prefix}ExpenseIcon`);
        const balanceIcon = document.getElementById(`${prefix}BalanceIcon`);
        if (incomeIcon) incomeIcon.innerHTML = getIcon('trendingUp', 20);
        if (expenseIcon) expenseIcon.innerHTML = getIcon('trendingDown', 20);
        if (balanceIcon) balanceIcon.innerHTML = getIcon('wallet', 20);
    });
    
    // Chart titles
    const titles = {
        'monthExpenseChartTitle': ['pieChart', 'Expenses by Category'],
        'monthIncomeChartTitle': ['pieChart', 'Income by Category'],
        'dailyChartTitle': ['barChart', 'Daily Spending'],
        'topExpensesTitle': ['trendingDown', 'Top Expenses'],
        'topIncomeTitle': ['trendingUp', 'Top Income'],
        'yearlyComparisonTitle': ['barChart', 'Monthly Comparison'],
        'yearExpenseChartTitle': ['pieChart', 'Yearly Expenses'],
        'yearIncomeChartTitle': ['pieChart', 'Yearly Income'],
        'monthlySummaryTitle': ['list', 'Monthly Summary']
    };
    
    Object.entries(titles).forEach(([id, [icon, text]]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = getIcon(icon, 18) + `<span>${text}</span>`;
    });
}

async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions');
        allTransactions = await response.json();
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast('error', 'Error', 'Failed to load data');
    }
}

function switchAnalyticsTab(tab) {
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) btn.classList.add('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================
// MONTHLY VIEW
// ============================================

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateMonthlyView();
}

function getMonthTransactions(month, year) {
    return allTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === month && date.getFullYear() === year;
    });
}

function updateMonthlyView() {
    const label = document.getElementById('currentMonthLabel');
    if (label) label.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const transactions = getMonthTransactions(currentMonth, currentYear);
    
    const income = transactions.filter(t => t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = transactions.filter(t => !t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;
    
    document.getElementById('monthIncome').textContent = formatCurrency(income);
    document.getElementById('monthExpense').textContent = formatCurrency(expenses);
    document.getElementById('monthBalance').textContent = (balance >= 0 ? '+' : '-') + formatCurrency(Math.abs(balance));
    
    updateMonthExpenseChart(transactions);
    updateMonthIncomeChart(transactions);
    updateDailyChart(transactions);
    updateTopCategories(transactions);
}

function updateMonthExpenseChart(transactions) {
    const ctx = document.getElementById('monthExpenseChart');
    if (!ctx) return;
    
    const categoryMap = {};
    transactions.filter(t => !t.is_income).forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });
    
    if (monthExpenseChart) monthExpenseChart.destroy();
    
    const colors = ['#ff6b6b', '#ff8787', '#ffa8a8', '#ff4757', '#ee5a24', '#e17055', '#d63031', '#c0392b', '#b71540', '#eb2f06'];
    const labels = Object.keys(categoryMap);
    
    monthExpenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(categoryMap),
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
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
                    window.location.href = `/table?category=${encodeURIComponent(category)}`;
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    onClick: (event, legendItem) => {
                        window.location.href = `/table?category=${encodeURIComponent(legendItem.text)}`;
                    }
                },
                tooltip: {
                    callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)} - Click to view` }
                }
            }
        }
    });
    ctx.style.cursor = 'pointer';
}

function updateMonthIncomeChart(transactions) {
    const ctx = document.getElementById('monthIncomeChart');
    if (!ctx) return;
    
    const categoryMap = {};
    transactions.filter(t => t.is_income).forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });
    
    if (monthIncomeChart) monthIncomeChart.destroy();
    
    const colors = ['#00d4aa', '#00cec9', '#55efc4', '#00b894', '#1dd1a1', '#10ac84', '#2bcbba', '#26de81', '#20bf6b', '#0be881'];
    
    const labels = Object.keys(categoryMap);
    
    monthIncomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(categoryMap),
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
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
                    window.location.href = `/table?category=${encodeURIComponent(category)}`;
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    onClick: (event, legendItem) => {
                        window.location.href = `/table?category=${encodeURIComponent(legendItem.text)}`;
                    }
                },
                tooltip: {
                    callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)} - Click to view` }
                }
            }
        }
    });
    ctx.style.cursor = 'pointer';
}

function updateDailyChart(transactions) {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyExpenses = new Array(daysInMonth).fill(0);
    const dailyIncome = new Array(daysInMonth).fill(0);
    
    transactions.forEach(t => {
        const day = new Date(t.date).getDate() - 1;
        if (t.is_income) {
            dailyIncome[day] += Math.abs(t.amount);
        } else {
            dailyExpenses[day] += Math.abs(t.amount);
        }
    });
    
    if (dailyChart) dailyChart.destroy();
    
    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            datasets: [
                {
                    label: 'Income',
                    data: dailyIncome,
                    backgroundColor: 'rgba(0, 212, 170, 0.7)',
                    borderRadius: 4
                },
                {
                    label: 'Expenses',
                    data: dailyExpenses,
                    backgroundColor: 'rgba(255, 107, 107, 0.7)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    }
                },
                tooltip: {
                    callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim()
                    }
                },
                y: {
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif" },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function updateTopCategories(transactions) {
    // Top Expenses
    const expenseMap = {};
    transactions.filter(t => !t.is_income).forEach(t => {
        expenseMap[t.category] = (expenseMap[t.category] || 0) + Math.abs(t.amount);
    });
    
    const topExpenses = Object.entries(expenseMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const expensesList = document.getElementById('topExpensesList');
    if (expensesList) {
        if (topExpenses.length === 0) {
            expensesList.innerHTML = '<p class="text-muted text-center" style="padding: 1rem;">No expenses this month</p>';
        } else {
            const maxExpense = topExpenses[0][1];
            expensesList.innerHTML = topExpenses.map(([cat, amount]) => {
                const iconName = getCategoryIcon(cat);
                const percent = (amount / maxExpense) * 100;
                return `
                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--danger-bg); color: var(--danger); display: flex; align-items: center; justify-content: center;">
                            ${getIcon(iconName, 18)}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem;">${cat}</div>
                            <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin-top: 0.25rem;">
                                <div style="height: 100%; width: ${percent}%; background: var(--danger); border-radius: 2px;"></div>
                            </div>
                        </div>
                        <div class="text-danger" style="font-weight: 700;">${formatCurrency(amount)}</div>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Top Income
    const incomeMap = {};
    transactions.filter(t => t.is_income).forEach(t => {
        incomeMap[t.category] = (incomeMap[t.category] || 0) + Math.abs(t.amount);
    });
    
    const topIncome = Object.entries(incomeMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const incomeList = document.getElementById('topIncomeList');
    if (incomeList) {
        if (topIncome.length === 0) {
            incomeList.innerHTML = '<p class="text-muted text-center" style="padding: 1rem;">No income this month</p>';
        } else {
            const maxIncome = topIncome[0][1];
            incomeList.innerHTML = topIncome.map(([cat, amount]) => {
                const iconName = getCategoryIcon(cat);
                const percent = (amount / maxIncome) * 100;
                return `
                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                        <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--success-bg); color: var(--success); display: flex; align-items: center; justify-content: center;">
                            ${getIcon(iconName, 18)}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 0.9rem;">${cat}</div>
                            <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin-top: 0.25rem;">
                                <div style="height: 100%; width: ${percent}%; background: var(--success); border-radius: 2px;"></div>
                            </div>
                        </div>
                        <div class="text-success" style="font-weight: 700;">${formatCurrency(amount)}</div>
                    </div>
                `;
            }).join('');
        }
    }
}

// ============================================
// YEARLY VIEW
// ============================================

function changeYear(delta) {
    selectedYear += delta;
    updateYearlyView();
}

function getYearTransactions(year) {
    return allTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year;
    });
}

function updateYearlyView() {
    const label = document.getElementById('currentYearLabel');
    if (label) label.textContent = selectedYear;
    
    const transactions = getYearTransactions(selectedYear);
    
    const income = transactions.filter(t => t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = transactions.filter(t => !t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;
    
    document.getElementById('yearIncome').textContent = formatCurrency(income);
    document.getElementById('yearExpense').textContent = formatCurrency(expenses);
    document.getElementById('yearBalance').textContent = (balance >= 0 ? '+' : '-') + formatCurrency(Math.abs(balance));
    
    updateYearlyComparisonChart(transactions);
    updateYearExpenseChart(transactions);
    updateYearIncomeChart(transactions);
    updateMonthlySummaryTable(transactions);
}

function updateYearlyComparisonChart(transactions) {
    const ctx = document.getElementById('yearlyComparisonChart');
    if (!ctx) return;
    
    const monthlyIncome = new Array(12).fill(0);
    const monthlyExpenses = new Array(12).fill(0);
    
    transactions.forEach(t => {
        const month = new Date(t.date).getMonth();
        if (t.is_income) {
            monthlyIncome[month] += Math.abs(t.amount);
        } else {
            monthlyExpenses[month] += Math.abs(t.amount);
        }
    });
    
    if (yearlyComparisonChart) yearlyComparisonChart.destroy();
    
    yearlyComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthNamesShort,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyIncome,
                    backgroundColor: 'rgba(0, 212, 170, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'Expenses',
                    data: monthlyExpenses,
                    backgroundColor: 'rgba(255, 107, 107, 0.8)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    }
                },
                tooltip: {
                    callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif", weight: '500' },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    }
                },
                y: {
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim() },
                    ticks: {
                        font: { family: "'Plus Jakarta Sans', sans-serif" },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

function updateYearExpenseChart(transactions) {
    const ctx = document.getElementById('yearExpenseChart');
    if (!ctx) return;
    
    const categoryMap = {};
    transactions.filter(t => !t.is_income).forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });
    
    if (yearExpenseChart) yearExpenseChart.destroy();
    
    const colors = ['#ff6b6b', '#ff8787', '#ffa8a8', '#ff4757', '#ee5a24', '#e17055', '#d63031', '#c0392b', '#b71540', '#eb2f06'];
    
    const labels = Object.keys(categoryMap);
    
    yearExpenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(categoryMap),
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
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
                    window.location.href = `/table?category=${encodeURIComponent(category)}`;
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    onClick: (event, legendItem) => {
                        window.location.href = `/table?category=${encodeURIComponent(legendItem.text)}`;
                    }
                },
                tooltip: {
                    callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)} - Click to view` }
                }
            }
        }
    });
    ctx.style.cursor = 'pointer';
}

function updateYearIncomeChart(transactions) {
    const ctx = document.getElementById('yearIncomeChart');
    if (!ctx) return;
    
    const categoryMap = {};
    transactions.filter(t => t.is_income).forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
    });
    
    if (yearIncomeChart) yearIncomeChart.destroy();
    
    const colors = ['#00d4aa', '#00cec9', '#55efc4', '#00b894', '#1dd1a1', '#10ac84', '#2bcbba', '#26de81', '#20bf6b', '#0be881'];
    
    const labels = Object.keys(categoryMap);
    
    yearIncomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(categoryMap),
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
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
                    window.location.href = `/table?category=${encodeURIComponent(category)}`;
                }
            },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                    },
                    onClick: (event, legendItem) => {
                        window.location.href = `/table?category=${encodeURIComponent(legendItem.text)}`;
                    }
                },
                tooltip: {
                    callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)} - Click to view` }
                }
            }
        }
    });
    ctx.style.cursor = 'pointer';
}

function updateMonthlySummaryTable(transactions) {
    const tbody = document.getElementById('monthlySummaryBody');
    if (!tbody) return;
    
    const monthlyData = monthNames.map((month, idx) => {
        const monthTrans = transactions.filter(t => new Date(t.date).getMonth() === idx);
        const income = monthTrans.filter(t => t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const expenses = monthTrans.filter(t => !t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        return { month, income, expenses, net: income - expenses, count: monthTrans.length };
    });
    
    tbody.innerHTML = monthlyData.map(data => `
        <tr>
            <td><strong>${data.month}</strong></td>
            <td class="text-success">${formatCurrency(data.income)}</td>
            <td class="text-danger">${formatCurrency(data.expenses)}</td>
            <td class="${data.net >= 0 ? 'text-success' : 'text-danger'}">${data.net >= 0 ? '+' : '-'}${formatCurrency(Math.abs(data.net))}</td>
            <td>${data.count}</td>
        </tr>
    `).join('');
}

