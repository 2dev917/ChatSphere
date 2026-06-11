import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBkuGeYdDOsPUs_sOfEpXpapn9QwP0ektM",
    authDomain: "chatsphere-c1d34.firebaseapp.com",
    projectId: "chatsphere-c1d34",
    storageBucket: "chatsphere-c1d34.firebasestorage.app",
    messagingSenderId: "74928618208",
    appId: "1:74928618208:web:3befb9d1413fb79e52ee85"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);