
import { auth } from '../auth.js';
import { router } from '../router.js';
import { showToast } from '../core.js';

export const LoginView = {
    render: () => `
        <div class="auth-container animate-fade-in">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="/logo.png" alt="Gider" class="auth-logo">
                    <h1 class="auth-title">Welcome Back</h1>
                    <p class="auth-subtitle">Sign in to manage your finances</p>
                </div>
                
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label class="form-label" for="username">Username</label>
                        <input type="text" id="username" class="form-input" required autofocus>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <input type="password" id="password" class="form-input" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <span>Sign In</span>
                    </button>
                    
                    <div class="auth-footer">
                        <p>Don't have an account? <a href="/register" data-link class="text-primary">Create one</a></p>
                    </div>
                </form>
            </div>
        </div>
    `,

    init: () => {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = form.username.value;
            const password = form.password.value;
            const btn = form.querySelector('button');

            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-sm"></span> Signing in...';

                await auth.login(username, password);
                router.navigate('/dashboard');
            } catch (error) {
                showToast('error', 'Login Failed', error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span>Sign In</span>';
            }
        });
    }
};

export const RegisterView = {
    render: () => `
        <div class="auth-container animate-fade-in">
            <div class="auth-card">
                <div class="auth-header">
                    <img src="/logo.png" alt="Gider" class="auth-logo">
                    <h1 class="auth-title">Create Account</h1>
                    <p class="auth-subtitle">Start tracking your expenses today</p>
                </div>
                
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label class="form-label" for="username">Username</label>
                        <input type="text" id="username" class="form-input" required autofocus>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <input type="password" id="password" class="form-input" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" class="form-input" required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <span>Create Account</span>
                    </button>
                    
                    <div class="auth-footer">
                        <p>Already have an account? <a href="/login" data-link class="text-primary">Sign in</a></p>
                    </div>
                </form>
            </div>
        </div>
    `,

    init: () => {
        const form = document.getElementById('registerForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = form.username.value;
            const password = form.password.value;
            const confirmPassword = form.confirmPassword.value;

            if (password !== confirmPassword) {
                showToast('error', 'Validation Error', "Passwords don't match");
                return;
            }

            const btn = form.querySelector('button');

            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-sm"></span> Creating account...';

                await auth.register(username, password);
                // Auto login after register
                await auth.login(username, password);
                router.navigate('/dashboard');
            } catch (error) {
                showToast('error', 'Registration Failed', error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span>Create Account</span>';
            }
        });
    }
};
