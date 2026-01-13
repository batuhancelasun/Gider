
import { auth } from '../auth.js';
import { formatCurrency, formatDateShort, showToast } from '../core.js';

let notifications = [];
let settings = {};

const ICONS = {
    alertCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    checkCircle: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    clock: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    trendingUp: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    trendingDown: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`
};

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
                            ${ICONS.alertCircle}
                            <h3>Due Now</h3>
                        </div>
                        <span class="badge" id="dueBadge">0</span>
                    </div>
                    <div class="notification-list" id="dueList">
                        <div class="empty-state">
                            ${ICONS.checkCircle}
                            <p>No transactions due</p>
                        </div>
                    </div>
                </div>

                <div class="notifications-section">
                    <div class="section-header">
                        <div class="section-title">
                            ${ICONS.clock}
                            <h3>Upcoming</h3>
                        </div>
                        <span class="badge" id="upcomingBadge">0</span>
                    </div>
                    <div class="notification-list" id="upcomingList">
                        <div class="empty-state">
                            ${ICONS.calendar}
                            <p>No upcoming transactions</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: async () => {
        try {
            await loadNotifications();
            renderNotifications();
            
            setInterval(async () => {
                try {
                    await loadNotifications();
                    renderNotifications();
                } catch (err) {
                    console.error('Polling error:', err);
                }
            }, 60000);
        } catch (error) {
            console.error('Notifications init error:', error);
            showToast('error', 'Error', 'Failed to initialize notifications');
        }
    }
};

async function loadNotifications() {
    try {
        const notifResponse = await fetch('/api/recurring/notifications', { headers: auth.getHeaders() });
        if (!notifResponse.ok) {
            throw new Error(`API error: ${notifResponse.status}`);
        }
        notifications = await notifResponse.json();
    } catch (error) {
        console.error('Failed to load notifications:', error);
        notifications = { due: [], upcoming: [] };
        showToast('error', 'Error', 'Failed to load notifications');
    }
}

function renderNotifications() {
    try {
        const { due = [], upcoming = [] } = notifications || {};
        
        // Update badges
        const dueBadge = document.getElementById('dueBadge');
        const upcomingBadge = document.getElementById('upcomingBadge');
        if (dueBadge) dueBadge.textContent = due.length;
        if (upcomingBadge) upcomingBadge.textContent = upcoming.length;
        
        // Render due
        const dueList = document.getElementById('dueList');
        if (dueList) {
            if (due.length === 0) {
                dueList.innerHTML = `
                    <div class="empty-state">
                        ${ICONS.checkCircle}
                        <p>No transactions due</p>
                    </div>
                `;
            } else {
                dueList.innerHTML = due.map(item => renderNotificationItem(item, true)).join('');
            }
        }
        
        // Render upcoming
        const upcomingList = document.getElementById('upcomingList');
        if (upcomingList) {
            if (upcoming.length === 0) {
                upcomingList.innerHTML = `
                    <div class="empty-state">
                        ${ICONS.calendar}
                        <p>No upcoming transactions</p>
                    </div>
                `;
            } else {
                upcomingList.innerHTML = upcoming.map(item => renderNotificationItem(item, false)).join('');
            }
        }
    } catch (error) {
        console.error('Error rendering notifications:', error);
    }
}

function renderNotificationItem(item, isDue) {
    try {
        const nextDate = new Date(item.next_occurrence);
        const isValidDate = !isNaN(nextDate.getTime());
        const daysUntil = isValidDate ? Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24)) : NaN;
        const isIncome = item.amount >= 0;
        const prefix = isIncome ? '+' : '-';
        
        let timeText;
        let dateText = isValidDate ? formatDateShort(item.next_occurrence) : 'Invalid Date';
        
        if (!isValidDate || isNaN(daysUntil)) {
            timeText = `<span class="text-muted">Invalid date</span>`;
        } else if (isDue) {
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
        
        const itemName = (item.name || 'Unnamed').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const itemId = (item.id || '').replace(/'/g, "\\'");
        const trendIcon = isIncome ? ICONS.trendingUp : ICONS.trendingDown;
        
        return `
            <div class="notification-item ${isDue ? 'due' : ''}" onclick="handleNotificationClick('${itemId}')">
                <div class="notification-icon ${isIncome ? 'income' : 'expense'}">
                    ${trendIcon}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${itemName}</div>
                    <div class="notification-meta">
                        <span>${item.frequency || 'N/A'}</span>
                        <span>•</span>
                        <span>${dateText}</span>
                        <span>•</span>
                        ${timeText}
                    </div>
                </div>
                <div class="notification-amount ${isIncome ? 'income' : 'expense'}">
                    ${prefix}${formatCurrency(Math.abs(item.amount || 0))}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering notification item:', error, item);
        return `<div class="notification-item" style="padding: 1rem; color: var(--danger);">Error displaying item</div>`;
    }
}

window.handleNotificationClick = function(id) {
    // Navigate to recurring page
    if (window.router) {
        window.router.navigate('/recurring');
    } else {
        window.location.href = '/recurring';
    }
};
