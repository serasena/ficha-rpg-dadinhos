import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIyAG4VBLs9QEdXKHI7smTmzwOljQ0Y5M",
  authDomain: "dadinhos-rpg-ficha.firebaseapp.com",
  projectId: "dadinhos-rpg-ficha",
  storageBucket: "dadinhos-rpg-ficha.firebasestorage.app",
  messagingSenderId: "355869242824",
  appId: "1:355869242824:web:1b3272a8e5ed774682fcfd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);