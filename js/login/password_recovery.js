import { auth, sendPasswordResetEmail } from '../firebaseconfig.js';

// Obtener el formulario de recuperación y agregar el evento de submit
document.getElementById('recoveryForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener el correo electrónico introducido por el usuario
    const email = document.getElementById('email').value;

    // Validar el formato del correo electrónico
    if (!isValidEmail(email)) {
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

    // Intentar enviar el enlace de recuperación
    sendPasswordResetEmail(auth, email)
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: '¡Correo de recuperación enviado!',
                text: 'Por favor revisa tu bandeja de entrada para restablecer tu contraseña.',
                customClass: {
                    popup: 'swal-popup',
                    title: 'swal-title',
                    content: 'swal-text',
                    confirmButton: 'swal-btn'
                }
            });
        })
        .catch((error) => {
            // Mostrar el mensaje de error si ocurre algún problema
            console.error('Error al enviar el enlace de recuperación:', error.message);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Algo salió mal al intentar enviar el enlace de recuperación.',
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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA0-9]{2,}$/;
    return emailRegex.test(email);
}