
import { router } from './router.js';
import { auth } from './auth.js';
import { LoginView, RegisterView } from './views/auth.js';
import { DashboardView } from './views/dashboard.js';
import { TransactionsView } from './views/transactions.js';
import { AnalyticsView } from './views/analytics.js';
import { ItemsView } from './views/items.js';
import { RecurringView } from './views/recurring.js';
import { NotificationsView } from './views/notifications.js';
import { SettingsView } from './views/settings.js';
import { initApp } from './core.js';

// Define Routes
router.addRoute('/login', LoginView);
router.addRoute('/register', RegisterView);
router.addRoute('/dashboard', DashboardView);
router.addRoute('/', DashboardView); // Default
router.addRoute('/table', TransactionsView);
router.addRoute('/analytics', AnalyticsView);
router.addRoute('/items', ItemsView);
router.addRoute('/recurring', RecurringView);
router.addRoute('/notifications', NotificationsView);
router.addRoute('/settings', SettingsView);

// 404 View
router.addRoute('/404', {
    render: () => `<h1>404 - Page Not Found</h1><a href="/" data-link>Go Home</a>`
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth on load
    // Check Auth on load
    if (auth.isAuthenticated()) {
        // Initialize Core App with timeout safeguard
        try {
            await Promise.race([
                initApp(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Init timeout')), 3000))
            ]);
        } catch (e) {
            console.error("Init App failed or timed out", e);
            // Only logout if it's explicitly an auth error
            if (e.message && (e.message.includes('401') || e.message.includes('Token'))) {
                auth.logout();
            }
            // Otherwise we proceed to router.init() to avoid blank screen
        }
    }

    // Start Router
    router.init();
});
