import { auth, sendPasswordResetEmail } from '../firebaseconfig.js';

// Obtener el formulario de recuperación y agregar el evento de submit
document.getElementById('recoveryForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener el correo electrónico introducido por el usuario
    const email = document.getElementById('email').value;

    // Mostrar el mensaje de espera o error si es necesario
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Limpiar los mensajes anteriores
    errorMessage.classList.add('d-none');
    successMessage.classList.add('d-none');

    // Intentar enviar el enlace de recuperación
    sendPasswordResetEmail(auth, email)
        .then(() => {
            // Mostrar el mensaje de éxito si el enlace fue enviado correctamente
            successMessage.classList.remove('d-none');
        })
        .catch((error) => {
            // Mostrar el mensaje de error si ocurre algún problema
            errorMessage.classList.remove('d-none');
            console.error('Error al enviar el enlace de recuperación:', error.message);
        });
});
