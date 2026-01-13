
import { auth } from '../auth.js';
import { formatCurrency, formatDateShort, getIcon, showToast } from '../core.js';

let notifications = [];
let settings = {};

export const NotificationsView = {
    render: () => `
        <div class="container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Notifications</h1>
                    <p class="page-subtitle">Upcoming recurring transactions</p>
                </div>
            </div>

            <div class="notifications-container">
                <div class="notifications-section">
                    <div class="section-header">
                        <div class="section-title">
                            ${getIcon('alert-circle', 20)}
                            <h3>Due Now</h3>
                        </div>
                        <span class="badge" id="dueBadge">0</span>
                    </div>
                    <div class="notification-list" id="dueList">
                        <div class="empty-state">
                            ${getIcon('check-circle', 48)}
                            <p>No transactions due</p>
                        </div>
                    </div>
                </div>

                <div class="notifications-section">
                    <div class="section-header">
                        <div class="section-title">
                            ${getIcon('clock', 20)}
                            <h3>Upcoming</h3>
                        </div>
                        <span class="badge" id="upcomingBadge">0</span>
                    </div>
                    <div class="notification-list" id="upcomingList">
                        <div class="empty-state">
                            ${getIcon('calendar', 48)}
                            <p>No upcoming transactions</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: async () => {
        await loadNotifications();
        renderNotifications();
        
        // Set up polling
        setInterval(loadNotifications, 60000);
    }
};

async function loadNotifications() {
    try {
        const [notifResponse, settingsResponse] = await Promise.all([
            fetch('/api/recurring/notifications', { headers: auth.getHeaders() }),
            fetch('/api/settings', { headers: auth.getHeaders() })
        ]);
        
        notifications = await notifResponse.json();
        settings = await settingsResponse.json();
    } catch (error) {
        console.error('Failed to load notifications:', error);
        showToast('error', 'Error', 'Failed to load notifications');
    }
}

function renderNotifications() {
    const { due = [], upcoming = [] } = notifications;
    
    // Update badges
    document.getElementById('dueBadge').textContent = due.length;
    document.getElementById('upcomingBadge').textContent = upcoming.length;
    
    // Render due
    const dueList = document.getElementById('dueList');
    if (due.length === 0) {
        dueList.innerHTML = `
            <div class="empty-state">
                ${getIcon('check-circle', 48)}
                <p>No transactions due</p>
            </div>
        `;
    } else {
        dueList.innerHTML = due.map(item => renderNotificationItem(item, true)).join('');
    }
    
    // Render upcoming
    const upcomingList = document.getElementById('upcomingList');
    if (upcoming.length === 0) {
        upcomingList.innerHTML = `
            <div class="empty-state">
                ${getIcon('calendar', 48)}
                <p>No upcoming transactions</p>
            </div>
        `;
    } else {
        upcomingList.innerHTML = upcoming.map(item => renderNotificationItem(item, false)).join('');
    }
}

function renderNotificationItem(item, isDue) {
    const daysUntil = Math.ceil((new Date(item.next_occurrence) - new Date()) / (1000 * 60 * 60 * 24));
    const isIncome = item.amount >= 0;
    const prefix = isIncome ? '+' : '-';
    
    let timeText;
    if (isDue) {
        if (daysUntil < 0) {
            timeText = `<span class="text-danger">${Math.abs(daysUntil)} days overdue</span>`;
        } else if (daysUntil === 0) {
            timeText = `<span class="text-warning">Due today</span>`;
        } else {
            timeText = `<span class="text-warning">Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}</span>`;
        }
    } else {
        timeText = `<span class="text-muted">In ${daysUntil} day${daysUntil > 1 ? 's' : ''}</span>`;
    }
    
    return `
        <div class="notification-item ${isDue ? 'due' : ''}" onclick="handleNotificationClick('${item.id}')">
            <div class="notification-icon ${isIncome ? 'income' : 'expense'}">
                ${getIcon(isIncome ? 'trending-up' : 'trending-down', 20)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${item.name}</div>
                <div class="notification-meta">
                    <span>${item.frequency}</span>
                    <span>•</span>
                    <span>${formatDateShort(item.next_occurrence)}</span>
                    <span>•</span>
                    ${timeText}
                </div>
            </div>
            <div class="notification-amount ${isIncome ? 'income' : 'expense'}">
                ${prefix}${formatCurrency(Math.abs(item.amount))}
            </div>
        </div>
    `;
}

window.handleNotificationClick = function(id) {
    // Navigate to recurring page
    if (window.router) {
        window.router.navigate('/recurring');
    } else {
        window.location.href = '/recurring';
    }
};
