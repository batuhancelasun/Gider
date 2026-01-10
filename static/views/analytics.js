import { auth } from '../auth.js';
import {
    formatCurrency, getIcon, getCategoryIcon
} from '../core.js';

let allTransactions = [];
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

export const AnalyticsView = {
    render: async () => {
        return `
            <div class="container animate-fade-in">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Analytics</h1>
                        <p class="page-subtitle">Monthly and yearly insights</p>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="tabs" id="analyticsTabs">
                    <button class="tab active" data-tab="monthly" onclick="window.switchAnalyticsTab('monthly')">
                        <span id="tabMonthlyIcon">${getIcon('pieChart', 18)}</span>
                        <span>Monthly</span>
                    </button>
                    <button class="tab" data-tab="yearly" onclick="window.switchAnalyticsTab('yearly')">
                        <span id="tabYearlyIcon">${getIcon('barChart', 18)}</span>
                        <span>Yearly</span>
                    </button>
                </div>

                <!-- Monthly Tab -->
                <div class="tab-content active" id="tab-monthly">
                    <!-- Month Selector -->
                    <div class="card animate-slide-up" style="margin-bottom: 1.5rem;">
                        <div class="flex gap-2" style="align-items: center; flex-wrap: wrap;">
                            <button class="btn btn-secondary btn-icon" onclick="window.changeMonth(-1)" style="transform: rotate(180deg)">${getIcon('arrowRight', 18)}</button>
                            <div style="flex: 1; text-align: center;">
                                <h2 id="currentMonthLabel" style="font-size: 1.25rem; font-weight: 700;"></h2>
                            </div>
                            <button class="btn btn-secondary btn-icon" onclick="window.changeMonth(1)">${getIcon('arrowRight', 18)}</button>
                        </div>
                    </div>

                    <!-- Monthly Stats -->
                    <div class="stats-grid" style="margin-bottom: 1.5rem;">
                        <div class="stat-card income animate-slide-up">
                            <div class="stat-header">
                                <div class="stat-icon" id="monthIncomeIcon">${getIcon('trendingUp', 20)}</div>
                                <span class="stat-label">Income</span>
                            </div>
                            <div class="stat-value" id="monthIncome">$0.00</div>
                        </div>
                        <div class="stat-card expense animate-slide-up">
                            <div class="stat-header">
                                <div class="stat-icon" id="monthExpenseIcon">${getIcon('trendingDown', 20)}</div>
                                <span class="stat-label">Expenses</span>
                            </div>
                            <div class="stat-value" id="monthExpense">$0.00</div>
                        </div>
                        <div class="stat-card balance animate-slide-up">
                            <div class="stat-header">
                                <div class="stat-icon" id="monthBalanceIcon">${getIcon('wallet', 20)}</div>
                                <span class="stat-label">Net</span>
                            </div>
                            <div class="stat-value" id="monthBalance">$0.00</div>
                        </div>
                    </div>

                    <!-- Monthly Charts -->
                    <div class="chart-grid" style="margin-bottom: 1.5rem;">
                        <div class="chart-card animate-slide-up">
                            <div class="card-header">
                                <h3 class="card-title">${getIcon('pieChart', 18)} Expenses by Category</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="monthExpenseChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-card animate-slide-up">
                            <div class="card-header">
                                <h3 class="card-title">${getIcon('pieChart', 18)} Income by Category</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="monthIncomeChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Daily Breakdown Chart -->
                    <div class="chart-card animate-slide-up" style="margin-bottom: 1.5rem;">
                        <div class="card-header">
                            <h3 class="card-title">${getIcon('barChart', 18)} Daily Spending</h3>
                        </div>
                        <div class="chart-container" style="height: 300px;">
                            <canvas id="dailyChart"></canvas>
                        </div>
                    </div>

                    <!-- Top Categories -->
                    <div class="chart-grid">
                        <div class="card animate-slide-up">
                            <div class="card-header">
                                <h3 class="card-title">${getIcon('trendingDown', 18)} Top Expenses</h3>
                            </div>
                            <div id="topExpensesList"></div>
                        </div>
                        <div class="card animate-slide-up">
                            <div class="card-header">
                                <h3 class="card-title">${getIcon('trendingUp', 18)} Top Income</h3>
                            </div>
                            <div id="topIncomeList"></div>
                        </div>
                    </div>
                </div>

                <!-- Yearly Tab -->
                <div class="tab-content" id="tab-yearly">
                    <!-- Year Selector -->
                    <div class="card animate-slide-up" style="margin-bottom: 1.5rem;">
                        <div class="flex gap-2" style="align-items: center; flex-wrap: wrap;">
                            <button class="btn btn-secondary btn-icon" onclick="window.changeYear(-1)" style="transform: rotate(180deg)">${getIcon('arrowRight', 18)}</button>
                            <div style="flex: 1; text-align: center;">
                                <h2 id="currentYearLabel" style="font-size: 1.25rem; font-weight: 700;"></h2>
                            </div>
                            <button class="btn btn-secondary btn-icon" onclick="window.changeYear(1)">${getIcon('arrowRight', 18)}</button>
                        </div>
                    </div>

                    <!-- Yearly Stats -->
                    <div class="stats-grid" style="margin-bottom: 1.5rem;">
                        <div class="stat-card income animate-slide-up">
                            <div class="stat-header">
                                <div class="stat-icon">${getIcon('trendingUp', 20)}</div>
                                <span class="stat-label">Total Income</span>
                            </div>
                            <div class="stat-value" id="yearIncome">$0.00</div>
                        </div>
                        <div class="stat-card expense animate-slide-up">
                            <div class="stat-header">
                                <div class="stat-icon">${getIcon('trendingDown', 20)}</div>
                                <span class="stat-label">Total Expenses</span>
                            </div>
                            <div class="stat-value" id="yearExpense">$0.00</div>
                        </div>
                        <div class="stat-card balance animate-slide-up">
                            <div class="stat-header">
                                <div class="stat-icon">${getIcon('wallet', 20)}</div>
                                <span class="stat-label">Net Savings</span>
                            </div>
                            <div class="stat-value" id="yearBalance">$0.00</div>
                        </div>
                    </div>

                    <!-- Monthly Comparison Chart -->
                    <div class="chart-card animate-slide-up" style="margin-bottom: 1.5rem;">
                        <div class="card-header">
                            <h3 class="card-title">${getIcon('barChart', 18)} Monthly Comparison</h3>
                        </div>
                        <div class="chart-container" style="height: 350px;">
                            <canvas id="yearlyComparisonChart"></canvas>
                        </div>
                    </div>

                    <!-- Yearly Breakdown -->
                    <div class="chart-grid">
                        <div class="chart-card animate-slide-up">
                            <div class="card-header">
                                <h3 class="card-title">${getIcon('pieChart', 18)} Yearly Expenses</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="yearExpenseChart"></canvas>
                            </div>
                        </div>
                        <div class="chart-card animate-slide-up">
                            <div class="card-header">
                                <h3 class="card-title">${getIcon('pieChart', 18)} Yearly Income</h3>
                            </div>
                            <div class="chart-container">
                                <canvas id="yearIncomeChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Monthly Summary Table -->
                    <div class="table-card animate-slide-up" style="margin-top: 1.5rem;">
                        <div class="card-header" style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);">
                            <h3 class="card-title">${getIcon('list', 18)} Monthly Summary</h3>
                        </div>
                        <div style="overflow-x: auto;">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Income</th>
                                        <th>Expenses</th>
                                        <th>Net</th>
                                        <th>Transactions</th>
                                    </tr>
                                </thead>
                                <tbody id="monthlySummaryBody"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init: async () => {
        await loadTransactions();

        // Expose functions to window
        window.switchAnalyticsTab = switchAnalyticsTab;
        window.changeMonth = changeMonth;
        window.changeYear = changeYear;

        updateMonthlyView();
        updateYearlyView();
    }
};

// -- Data Loading --

async function loadTransactions() {
    try {
        const response = await fetch('/api/transactions', { headers: auth.getHeaders() });
        allTransactions = await response.json();
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showToast('error', 'Error', 'Failed to load data');
    }
}

// -- Tab Logic --

function switchAnalyticsTab(tab) {
    document.querySelectorAll('#analyticsTabs .tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) btn.classList.add('active');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');
}

// -- Monthly View --

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

function updateMonthlyView() {
    const label = document.getElementById('currentMonthLabel');
    if (label) label.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    const transactions = allTransactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const income = transactions.filter(t => t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = transactions.filter(t => !t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;

    const incomeEl = document.getElementById('monthIncome');
    const expensesEl = document.getElementById('monthExpense');
    const balanceEl = document.getElementById('monthBalance');

    if (incomeEl) incomeEl.textContent = formatCurrency(income);
    if (expensesEl) expensesEl.textContent = formatCurrency(expenses);
    if (balanceEl) balanceEl.textContent = (balance >= 0 ? '+' : '-') + formatCurrency(Math.abs(balance));

    updateMonthExpenseChart(transactions);
    updateMonthIncomeChart(transactions);
    updateDailyChart(transactions);
    updateTopCategories(transactions);
}

// -- Charts (Monthly) --

function updateMonthExpenseChart(transactions) {
    renderDoughnutChart('monthExpenseChart', transactions.filter(t => !t.is_income), monthExpenseChart, c => monthExpenseChart = c, ['#ff6b6b', '#ff8787', '#ffa8a8', '#ff4757', '#ee5a24']);
}

function updateMonthIncomeChart(transactions) {
    renderDoughnutChart('monthIncomeChart', transactions.filter(t => t.is_income), monthIncomeChart, c => monthIncomeChart = c, ['#00d4aa', '#00cec9', '#55efc4', '#00b894', '#1dd1a1']);
}

function renderDoughnutChart(canvasId, items, chartInstance, setChart, colors) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const categoryMap = {};
    items.forEach(t => categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount));

    const labels = Object.keys(categoryMap);

    if (chartInstance) chartInstance.destroy();

    const newChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: Object.values(categoryMap),
                backgroundColor: colors.slice(0, labels.length).concat(colors), // Repeat colors if needed
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
    setChart(newChart);
}

function updateDailyChart(transactions) {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyExpenses = new Array(daysInMonth).fill(0);
    const dailyIncome = new Array(daysInMonth).fill(0);

    transactions.forEach(t => {
        const day = new Date(t.date).getDate() - 1;
        if (t.is_income) dailyIncome[day] += Math.abs(t.amount);
        else dailyExpenses[day] += Math.abs(t.amount);
    });

    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            datasets: [
                { label: 'Income', data: dailyIncome, backgroundColor: 'rgba(0, 212, 170, 0.7)', borderRadius: 4 },
                { label: 'Expenses', data: dailyExpenses, backgroundColor: 'rgba(255, 107, 107, 0.7)', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateTopCategories(transactions) {
    const renderList = (items, elementId, colorClass, bgClass) => {
        const el = document.getElementById(elementId);
        if (!el) return;

        const map = {};
        items.forEach(t => map[t.category] = (map[t.category] || 0) + Math.abs(t.amount));
        const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);

        if (!sorted.length) {
            el.innerHTML = '<p class="text-muted text-center" style="padding: 1rem;">No data</p>';
            return;
        }

        const max = sorted[0][1];
        el.innerHTML = sorted.map(([cat, amount]) => {
            const percent = (amount / max) * 100;
            return `
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.9rem;">${cat}</div>
                        <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin-top: 0.25rem;">
                            <div style="height: 100%; width: ${percent}%; background: var(${colorClass}); border-radius: 2px;"></div>
                        </div>
                    </div>
                    <div style="font-weight: 700;">${formatCurrency(amount)}</div>
                </div>
            `;
        }).join('');
    };

    renderList(transactions.filter(t => !t.is_income), 'topExpensesList', '--danger', '--danger-bg');
    renderList(transactions.filter(t => t.is_income), 'topIncomeList', '--success', '--success-bg');
}

// -- Yearly View --

function changeYear(delta) {
    selectedYear += delta;
    updateYearlyView();
}

function updateYearlyView() {
    const label = document.getElementById('currentYearLabel');
    if (label) label.textContent = selectedYear;

    const transactions = allTransactions.filter(t => new Date(t.date).getFullYear() === selectedYear);

    const income = transactions.filter(t => t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = transactions.filter(t => !t.is_income).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;

    const incomeEl = document.getElementById('yearIncome');
    const expensesEl = document.getElementById('yearExpense');
    const balanceEl = document.getElementById('yearBalance');

    if (incomeEl) incomeEl.textContent = formatCurrency(income);
    if (expensesEl) expensesEl.textContent = formatCurrency(expenses);
    if (balanceEl) balanceEl.textContent = (balance >= 0 ? '+' : '-') + formatCurrency(Math.abs(balance));

    updateYearlyComparisonChart(transactions);
    updateYearExpenseChart(transactions);
    updateYearIncomeChart(transactions);
    updateMonthlySummaryTable(transactions);
}

function updateYearlyComparisonChart(transactions) {
    const ctx = document.getElementById('yearlyComparisonChart');
    if (!ctx) return;

    const income = new Array(12).fill(0);
    const expenses = new Array(12).fill(0);

    transactions.forEach(t => {
        const month = new Date(t.date).getMonth();
        if (t.is_income) income[month] += Math.abs(t.amount);
        else expenses[month] += Math.abs(t.amount);
    });

    if (yearlyComparisonChart) yearlyComparisonChart.destroy();

    yearlyComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthNamesShort,
            datasets: [
                { label: 'Income', data: income, backgroundColor: 'rgba(0, 212, 170, 0.8)', borderRadius: 4 },
                { label: 'Expenses', data: expenses, backgroundColor: 'rgba(255, 107, 107, 0.8)', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateYearExpenseChart(transactions) {
    renderDoughnutChart('yearExpenseChart', transactions.filter(t => !t.is_income), yearExpenseChart, c => yearExpenseChart = c, ['#ff6b6b', '#ff8787', '#ffa8a8']);
}

function updateYearIncomeChart(transactions) {
    renderDoughnutChart('yearIncomeChart', transactions.filter(t => t.is_income), yearIncomeChart, c => yearIncomeChart = c, ['#00d4aa', '#00cec9', '#55efc4']);
}

function updateMonthlySummaryTable(transactions) {
    const tbody = document.getElementById('monthlySummaryBody');
    if (!tbody) return;

    const data = monthNames.map((m, i) => {
        const trans = transactions.filter(t => new Date(t.date).getMonth() === i);
        const inc = trans.filter(t => t.is_income).reduce((s, t) => s + Math.abs(t.amount), 0);
        const exp = trans.filter(t => !t.is_income).reduce((s, t) => s + Math.abs(t.amount), 0);
        return { month: m, income: inc, expenses: exp, net: inc - exp, count: trans.length };
    });

    tbody.innerHTML = data.map(d => `
        <tr>
            <td><strong>${d.month}</strong></td>
            <td class="text-success">${formatCurrency(d.income)}</td>
            <td class="text-danger">${formatCurrency(d.expenses)}</td>
            <td class="${d.net >= 0 ? 'text-success' : 'text-danger'}">${d.net >= 0 ? '+' : '-'}${formatCurrency(Math.abs(d.net))}</td>
            <td>${d.count}</td>
        </tr>
    `).join('');
}
