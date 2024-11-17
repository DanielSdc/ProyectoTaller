import { auth, signInWithEmailAndPassword } from '../firebaseconfig.js';

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener los valores de los campos de usuario y contraseña
    const userEmail = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    // Validar el formato del correo electrónico
    if (!isValidEmail(userEmail)) {
        Swal.fire({
            icon: 'error',
            title: 'Correo electrónico inválido',
            text: 'Por favor ingresa un correo electrónico válido.',
            customClass: {
                popup: 'swal-popup',
                title: 'swal-title',
                content: 'swal-text',
                confirmButton: 'swal-btn'
            }
        });
        return;
    }

    // Intentar iniciar sesión
    signInWithEmailAndPassword(auth, userEmail, password)
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

            // Mostrar el mensaje genérico de SweetAlert
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Algo salió mal al intentar iniciar sesión.',
                customClass: {
                    popup: 'swal-popup',
                    title: 'swal-title',
                    content: 'swal-text',
                    confirmButton: 'swal-btn'
                }
            });
        });
});

// Función para validar el formato del correo electrónico
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}