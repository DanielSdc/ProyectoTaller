import { auth, signInWithEmailAndPassword } from '../firebaseconfig.js';

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener los valores de los campos de usuario y contraseña
    const user = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    // Limpiar mensaje de error previo (si existe)
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('d-none');

    // Intentar iniciar sesión
    signInWithEmailAndPassword(auth, user, password)
        .then((userCredential) => {
            // Inicio de sesión exitoso
            const user = userCredential.user;
            console.log('Usuario autenticado:', user);
            // Redirigir al usuario a la página principal
            window.location.href = '../pages/main.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error al iniciar sesión:', errorCode, errorMessage);

            // Mostrar el mensaje de error
            const errorMessageElement = document.getElementById('error-message');
            errorMessageElement.classList.remove('d-none'); // Hacer visible el mensaje
        });
});