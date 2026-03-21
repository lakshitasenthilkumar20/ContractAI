import { apiFetch } from './api';

export const authService = {
    login: async (email: string, password: string) => {
        // Note: FastAPI by default expects form data for OAuth2PasswordRequestForm
        // But since our backend uses username/password in JSON or Form, 
        // we need to match what verify_backend.py does (which is Form data).

        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        console.log('Attempting login for:', email);
        const response = await fetch('http://localhost:8000/auth/login', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Login response not OK:', response.status, errorData);
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        console.log('Login successful, received token');
        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
        }
        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },

    getCurrentUser: async () => {
        return apiFetch('/auth/me');
    }
};
