document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.classList.add('hidden');

    try {
        const respuesta = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'Error al iniciar sesión');
        }

        // Guardar la sesión de forma ligera en el navegador
        localStorage.setItem('sesion_usuario', JSON.stringify(resultado.usuario));

        // Redireccionar al Dashboard principal
        window.location.href = 'index.html';

    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
});