import { auth, sendPasswordResetEmail } from '../firebaseconfig.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('email').classList.remove('is-invalid');

    document.getElementById('span-email').classList.remove('is-invalid-span');

        // Validación en tiempo real al escribir en el campo de correo electrónico
        document.getElementById('email').addEventListener('input', () => {
            const userEmail = document.getElementById('email').value;
            if (!isValidEmail(userEmail)) {
                document.getElementById('email').classList.add('is-invalid');
                document.getElementById('span-email').classList.add('is-invalid-span');
                document.getElementById('emailError').classList.remove('d-none');
            } else {
                document.getElementById('email').classList.remove('is-invalid');
                document.getElementById('span-email').classList.remove('is-invalid-span');
                document.getElementById('emailError').classList.add('d-none');
            }
        });
});

// Obtener el formulario de recuperación y agregar el evento de submit
document.getElementById('recoveryForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener el correo electrónico introducido por el usuario
    const email = document.getElementById('email').value;

    // Limpiar errores previos
    document.getElementById('emailError').classList.add('d-none');

    document.getElementById('email').classList.remove('is-invalid');

    document.getElementById('span-email').classList.remove('is-invalid-span');

    let valid = true;

    // Validar el correo electrónico
    if (!isValidEmail(email)) {
        document.getElementById('email').classList.add('is-invalid');
        document.getElementById('span-email').classList.add('is-invalid-span');
        document.getElementById('emailError').classList.remove('d-none'); // Mostrar mensaje de error
        valid = false;
    }

    if (!valid) {
        return; // Si no es válido, no intentamos hacer login
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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}