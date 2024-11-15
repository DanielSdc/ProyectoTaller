  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  
  export { auth, signInWithEmailAndPassword };
