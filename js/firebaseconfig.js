// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL ,deleteObject} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGAuLOFW11Wdq5O60tgUq45npXR8vu4kw",
    authDomain: "rentalcontrol-7f879.firebaseapp.com",
    projectId: "rentalcontrol-7f879",
    storageBucket: "rentalcontrol-7f879.firebasestorage.app",
    messagingSenderId: "1082078335810",
    appId: "1:1082078335810:web:a641ba8a19400274946edb",
    measurementId: "G-LPQLDEVKJV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, db, collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, updateDoc, getDoc, storage, ref, uploadBytes, getDownloadURL,deleteObject };