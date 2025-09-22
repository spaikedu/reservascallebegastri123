document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.classList.add('d-none');

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            // Using sessionStorage to keep the user logged in for the session.
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            window.location.href = '/admin.html';
        } else {
            errorMessage.textContent = result.message || 'Error al iniciar sesión.';
            errorMessage.classList.remove('d-none');
        }
    });
});
