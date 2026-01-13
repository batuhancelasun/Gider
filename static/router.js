
import { auth } from './auth.js';

const routes = {};

export const router = {
    addRoute(path, view) {
        routes[path] = view;
    },

    async navigate(path) {
        // Normalize path
        path = path || '/';
        if (path.endsWith('/index.html')) path = '/';
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

        // Handle root path
        if (path === '' || path === '/') {
            path = '/dashboard';
        }

        // Handle Auth Guard
        if (path !== '/login' && path !== '/register' && !auth.isAuthenticated()) {
            this.navigate('/login');
            return;
        }

        // Handle Redirect if logged in
        if ((path === '/login' || path === '/register') && auth.isAuthenticated()) {
            this.navigate('/dashboard');
            return;
        }

        const view = routes[path] || routes['/404'];

        if (view) {
            // Update URL without reload
            window.history.pushState({}, '', path === '/dashboard' ? '/' : path);

            // Render View
            const app = document.getElementById('app-container');
            app.innerHTML = await view.render();

            // Initialize View Logic
            if (view.init) {
                await view.init();
            }

            // Update Active Nav
            this.updateActiveNav(path);
        }
    },

    updateActiveNav(path) {
        // Hide/Show Shell Elements
        const isAuthPage = path === '/login' || path === '/register';
        const elementsToToggle = [
            document.querySelector('.navbar'),
            document.querySelector('.bottom-nav'),
            document.querySelector('.fab')
        ];

        elementsToToggle.forEach(el => {
            if (el) {
                if (isAuthPage) {
                    el.classList.add('hidden');
                } else {
                    el.classList.remove('hidden');
                }
            }
        });

        if (isAuthPage) return;

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === path) {
                link.classList.add('active');
            }
        });

        // Mobile Tab Bar
        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('href') === path) {
                tab.classList.add('active');
            }
        });
    },

    init() {
        // Handle Back/Forward
        window.addEventListener('popstate', () => {
            this.navigate(window.location.pathname);
        });

        // Intercept Link Clicks
        document.body.addEventListener('click', e => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                this.navigate(e.target.getAttribute('href'));
            }
            // Handle links inside other elements (like icons)
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });

        // Initial Load
        this.navigate(window.location.pathname);
        
            // Expose to window for view components
            window.router = this;
    }
};
