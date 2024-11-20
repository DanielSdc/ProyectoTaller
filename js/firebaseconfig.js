// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGAuLOFW11Wdq5O60tgUq45npXR8vu4kw",
    authDomain: "rentalcontrol-7f879.firebaseapp.com",
    projectId: "rentalcontrol-7f879",
    storageBucket: "rentalcontrol-7f879.appspot.com",
    messagingSenderId: "1082078335810",
    appId: "1:1082078335810:web:a641ba8a19400274946edb",
    measurementId: "G-LPQLDEVKJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, db, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, getDoc };