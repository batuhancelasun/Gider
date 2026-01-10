// ============================================
// GIDER - Items Analytics JavaScript
// ============================================

let itemStats = null;
let topItemsChart = null;
let storesChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit to ensure icons.js is loaded
    if (typeof getIcon === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    await loadSettings();
    await loadCategories();
    await loadItemStats();
    initItemsIcons();
    renderItemsAnalytics();
});

function initItemsIcons() {
    // Navigation icons - set directly
    const navItems = document.getElementById('nav-items');
    const navRecurring = document.getElementById('nav-recurring');
    if (navItems) navItems.innerHTML = getIcon('shoppingBag', 18) + '<span>Items</span>';
    if (navRecurring) navRecurring.innerHTML = getIcon('subscriptions', 18) + '<span>Recurring</span>';

    // Stat icons - ensure they have icons
    const totalItemsIcon = document.getElementById('totalItemsIcon');
    if (totalItemsIcon) totalItemsIcon.innerHTML = getIcon('shoppingBag', 20);

    const uniqueItemsIcon = document.getElementById('uniqueItemsIcon');
    if (uniqueItemsIcon) uniqueItemsIcon.innerHTML = getIcon('tag', 20);

    const topStoreIcon = document.getElementById('topStoreIcon');
    if (topStoreIcon) topStoreIcon.innerHTML = getIcon('home', 20);

    // Chart titles
    const topItemsChartTitle = document.getElementById('topItemsChartTitle');
    if (topItemsChartTitle) topItemsChartTitle.innerHTML = getIcon('barChart', 18) + '<span>Most Purchased Items</span>';

    const storesChartTitle = document.getElementById('storesChartTitle');
    if (storesChartTitle) storesChartTitle.innerHTML = getIcon('pieChart', 18) + '<span>Purchases by Store</span>';

    const itemsListTitle = document.getElementById('itemsListTitle');
    if (itemsListTitle) itemsListTitle.innerHTML = getIcon('list', 18) + '<span>All Items</span>';
}

async function loadItemStats() {
    try {
        const response = await fetch('/api/items/stats');
        itemStats = await response.json();
    } catch (error) {
        console.error('Failed to load item stats:', error);
        itemStats = { total_items: 0, unique_items: 0, top_items: [], top_stores: [] };
    }
}

function renderItemsAnalytics() {
    if (!itemStats) return;

    // Update stats
    document.getElementById('totalItemsCount').textContent = itemStats.total_items.toLocaleString();
    document.getElementById('uniqueItemsCount').textContent = itemStats.unique_items.toLocaleString();

    if (itemStats.top_stores && itemStats.top_stores.length > 0) {
        document.getElementById('topStoreName').textContent = itemStats.top_stores[0].name;
    }

    // Render charts
    renderTopItemsChart();
    renderStoresChart();
    renderItemsList();
}

function renderTopItemsChart() {
    const ctx = document.getElementById('topItemsChart');
    if (!ctx || !itemStats.top_items || itemStats.top_items.length === 0) {
        if (ctx) {
            ctx.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: var(--text-muted);">No item data yet. Scan receipts to track items!</div>';
        }
        return;
    }

    const topItems = itemStats.top_items.slice(0, 10);

    if (topItemsChart) topItemsChart.destroy();

    // Get computed colors
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#6b7280';
    const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#9ca3af';
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#374151';

    topItemsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topItems.map(i => i.name.length > 20 ? i.name.substring(0, 20) + '...' : i.name),
            datasets: [{
                label: 'Quantity',
                data: topItems.map(i => i.total_qty),
                backgroundColor: 'rgba(0, 212, 170, 0.7)',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.raw} purchased`
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: borderColor },
                    ticks: {
                        color: textMuted,
                        font: { family: "'Plus Jakarta Sans', sans-serif" }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: textSecondary,
                        font: { family: "'Plus Jakarta Sans', sans-serif", weight: '500' }
                    }
                }
            }
        }
    });
}

function renderStoresChart() {
    const ctx = document.getElementById('storesChart');
    if (!ctx || !itemStats.top_stores || itemStats.top_stores.length === 0) {
        if (ctx) {
            ctx.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: var(--text-muted);">No store data yet</div>';
        }
        return;
    }

    const colors = ['#00d4aa', '#00cec9', '#55efc4', '#00b894', '#1dd1a1', '#10ac84', '#2bcbba', '#26de81', '#20bf6b', '#0be881'];
    const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#9ca3af';

    if (storesChart) storesChart.destroy();

    storesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: itemStats.top_stores.map(s => s.name),
            datasets: [{
                data: itemStats.top_stores.map(s => s.count),
                backgroundColor: colors.slice(0, itemStats.top_stores.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 12,
                        usePointStyle: true,
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                        color: textSecondary
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.raw} items`
                    }
                }
            }
        }
    });
}

function renderItemsList() {
    const container = document.getElementById('itemsList');
    if (!container) return;

    if (!itemStats.top_items || itemStats.top_items.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No items tracked yet. Scan a receipt to start!</div>';
        return;
    }

    const maxQty = itemStats.top_items[0]?.total_qty || 1;

    container.innerHTML = itemStats.top_items.map(item => {
        const percent = (item.total_qty / maxQty) * 100;
        return `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--border);">
                <div style="width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--primary-bg); color: var(--primary); display: flex; align-items: center; justify-content: center;">
                    ${getIcon('shoppingBag', 18)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.name)}</div>
                    <div style="height: 4px; background: var(--bg-tertiary); border-radius: 2px; margin-top: 0.25rem;">
                        <div style="height: 100%; width: ${percent}%; background: var(--primary); border-radius: 2px;"></div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; color: var(--primary);">${item.total_qty}x</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${formatCurrency(item.total_spent)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

