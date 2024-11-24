import { auth, signInWithEmailAndPassword } from '../firebaseconfig.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('user').classList.remove('is-invalid');
    document.getElementById('password').classList.remove('is-invalid');
    
    document.getElementById('span-user').classList.remove('is-invalid-span');
    document.getElementById('span-password').classList.remove('is-invalid-span');

    // Validación en tiempo real al escribir en el campo de correo electrónico
    document.getElementById('user').addEventListener('input', () => {
        const userEmail = document.getElementById('user').value;
        if (!isValidEmail(userEmail)) {
            document.getElementById('user').classList.add('is-invalid');
            document.getElementById('span-user').classList.add('is-invalid-span');
            document.getElementById('userError').classList.remove('d-none');
        } else {
            document.getElementById('user').classList.remove('is-invalid');
            document.getElementById('span-user').classList.remove('is-invalid-span');
            document.getElementById('userError').classList.add('d-none');
        }
    });

    // Validación en tiempo real al escribir en el campo de contraseña
    document.getElementById('password').addEventListener('input', () => {
        const password = document.getElementById('password').value;
        if (password.trim() === "") {
            document.getElementById('password').classList.add('is-invalid');
            document.getElementById('span-password').classList.add('is-invalid-span');
            document.getElementById('passwordError').classList.remove('d-none');
        } else {
            document.getElementById('password').classList.remove('is-invalid');
            document.getElementById('span-password').classList.remove('is-invalid-span');
            document.getElementById('passwordError').classList.add('d-none');
        }
    });
});

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Obtener los valores de los campos de usuario y contraseña
    const userEmail = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    // Limpiar errores previos
    document.getElementById('userError').classList.add('d-none');
    document.getElementById('passwordError').classList.add('d-none');

    document.getElementById('user').classList.remove('is-invalid');
    document.getElementById('password').classList.remove('is-invalid');

    document.getElementById('span-user').classList.remove('is-invalid-span');
    document.getElementById('span-password').classList.remove('is-invalid-span');

    let valid = true;

    // Validar el correo electrónico
    if (!isValidEmail(userEmail)) {
        document.getElementById('user').classList.add('is-invalid');
        document.getElementById('span-user').classList.add('is-invalid-span');
        document.getElementById('userError').classList.remove('d-none'); // Mostrar mensaje de error
        valid = false;
    }

    // Validar que la contraseña no esté vacía
    if (password.trim() === "") {
        document.getElementById('password').classList.add('is-invalid');
        document.getElementById('span-password').classList.add('is-invalid-span');
        document.getElementById('passwordError').classList.remove('d-none'); // Mostrar mensaje de error
        valid = false;
    }

    if (!valid) {
        return; // Si no es válido, no intentamos hacer login
    }

    // Intentar iniciar sesión
    signInWithEmailAndPassword(auth, userEmail, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('Usuario autenticado:', user);
            // Save user email to localStorage
            localStorage.setItem('userEmail', user.email);
            window.location.href = '../pages/main.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error al iniciar sesión:', errorCode, errorMessage);

            // Mostrar el mensaje de error usando Swal.fire
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Algo salió mal al intentar iniciar sesión. Por favor verifica tus datos e inténtalo nuevamente.',
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