
import { auth, signInWithEmailAndPassword } from '../firebaseconfig.js';

  document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();


    const user = document.getElementById('user').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth,user, password)
      .then((userCredential) => {
        // Inicio de sesión exitoso
        const user = userCredential.user;
        console.log('Usuario autenticado:', user);
        // Redirigir o realizar alguna acción
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error al iniciar sesión:', errorCode, errorMessage);
      });
  });
