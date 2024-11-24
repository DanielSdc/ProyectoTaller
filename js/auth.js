import { auth, onAuthStateChanged } from './firebaseconfig.js';

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, save user email to localStorage
        localStorage.setItem('userEmail', user.email);
    } else {
        // User is signed out, redirect to login page
        localStorage.removeItem('userEmail');
        window.location.href = '../pages/login.html';
    }
});