import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTT7nNuznQrxUz_Xm9mN39KelFRBXOcSA",
    authDomain: "smart-rural-bus-tracker.firebaseapp.com",
    projectId: "smart-rural-bus-tracker",
    storageBucket: "smart-rural-bus-tracker.firebasestorage.app",
    messagingSenderId: "35549025787",
    appId: "1:35549025787:web:adbdb9a7cd96c1e0a1675e",
    measurementId: "G-V9YQ6VW6HQ"
};

const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);

export {
    auth,
    db
};