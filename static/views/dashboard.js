
import { initDashboard } from '../dashboard.js';

export const DashboardView = {
    render: () => `
        <div class="container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-subtitle" id="dateRange">Loading...</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="window.openScannerModal?.()" id="scanBtn">Scan</button>
                    <button class="btn btn-primary" onclick="window.openModal?.()" id="addBtn">Add</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card income animate-slide-up">
                    <div class="stat-header">
                        <div class="stat-icon" id="incomeIcon"></div>
                        <span class="stat-label">Total Income</span>
                    </div>
                    <div class="stat-value" id="totalIncome">$0.00</div>
                </div>
                <div class="stat-card expense animate-slide-up">
                    <div class="stat-header">
                        <div class="stat-icon" id="expenseIcon"></div>
                        <span class="stat-label">Total Expenses</span>
                    </div>
                    <div class="stat-value" id="totalExpense">$0.00</div>
                </div>
                <div class="stat-card balance animate-slide-up">
                    <div class="stat-header">
                        <div class="stat-icon" id="balanceIcon"></div>
                        <span class="stat-label">Net Balance</span>
                    </div>
                    <div class="stat-value" id="netBalance">$0.00</div>
                </div>
            </div>

            <div class="chart-grid">
                <div class="chart-card animate-slide-up">
                    <div class="card-header">
                        <h3 class="card-title" id="expenseChartTitle"></h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="expenseChart"></canvas>
                    </div>
                </div>
                <div class="chart-card animate-slide-up">
                    <div class="card-header">
                        <h3 class="card-title" id="comparisonChartTitle"></h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="comparisonChart"></canvas>
                    </div>
                </div>
            </div>

                <div class="upcoming-card animate-slide-up">
                    <div class="transactions-header">
                        <h3 class="transactions-title" id="upcomingTitle"></h3>
                        <a href="/notifications" class="btn btn-ghost" data-link id="viewAllNotifBtn">View All</a>
                    </div>
                    <div class="upcoming-list" id="upcomingList">
                        <div class="empty-state" id="emptyUpcoming"></div>
                    </div>
                </div>

            <div class="transactions-card animate-slide-up">
                <div class="transactions-header">
                    <h3 class="transactions-title" id="recentTitle"></h3>
                    <a href="/table" class="btn btn-ghost" id="viewAllBtn">View All</a>
                </div>
                <div class="transaction-list" id="recentList">
                    <div class="empty-state" id="emptyState"></div>
                </div>
            </div>
        </div>
    `,

    init: async () => {
        // Expose modal functions to window so inline onclicks work
        // Ideally we should use addEventListener, but for migration:
        const { openModal, openScannerModal, initIcons } = await import('../core.js');
        window.openModal = openModal;
        window.openScannerModal = openScannerModal;

        // Initialize icons for the rendered view
        initIcons();

        await initDashboard();
    }
};
