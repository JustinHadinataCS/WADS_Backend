import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAy-Ah-QphXhftpA6iwzEyhJqKh6PjA3CQ",
    authDomain: "semestamedikaapp.firebaseapp.com",
    projectId: "semestamedikaapp",
    storageBucket: "semestamedikaapp.firebasestorage.app",
    messagingSenderId: "513901903795",
    appId: "1:513901903795:web:1d2bfe916b2e0b89e955c6",
    measurementId: "G-3PFZSFD5W8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 