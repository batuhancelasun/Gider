
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
                            <span class="section-icon" data-icon="alert-circle" data-size="20"></span>
                            <h3>Due Now</h3>
                        </div>
                        <span class="badge" id="dueBadge">0</span>
                    </div>
                    <div class="notification-list" id="dueList">
                        <div class="empty-state">
                            <span class="empty-icon" data-icon="check-circle" data-size="48"></span>
                            <p>No transactions due</p>
                        </div>
                    </div>
                </div>

                <div class="notifications-section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="section-icon" data-icon="clock" data-size="20"></span>
                            <h3>Upcoming</h3>
                        </div>
                        <span class="badge" id="upcomingBadge">0</span>
                    </div>
                    <div class="notification-list" id="upcomingList">
                        <div class="empty-state">
                            <span class="empty-icon" data-icon="calendar" data-size="48"></span>
                            <p>No upcoming transactions</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    init: async () => {
        try {
            console.log('Notifications view init started');
            
            // Render icons after DOM is ready
            document.querySelectorAll('[data-icon]').forEach(el => {
                const iconName = el.getAttribute('data-icon');
                const size = el.getAttribute('data-size') || 20;
                if (window.getIcon) {
                    el.innerHTML = window.getIcon(iconName, size);
                }
            });
            
            await loadNotifications();
            console.log('Notifications loaded:', notifications);
            renderNotifications();
            console.log('Notifications rendered');
            
            // Set up polling and re-render
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
        
        const checkCircleIcon = window.getIcon ? window.getIcon('check-circle', 48) : '';
        const calendarIcon = window.getIcon ? window.getIcon('calendar', 48) : '';
        
        // Render due
        const dueList = document.getElementById('dueList');
        if (dueList) {
            if (due.length === 0) {
                dueList.innerHTML = `
                    <div class="empty-state">
                        ${checkCircleIcon}
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
                        ${calendarIcon}
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
        const trendIcon = window.getIcon ? window.getIcon(isIncome ? 'trendingUp' : 'trendingDown', 20) : '';
        
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
