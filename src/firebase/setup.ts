import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyDAqYcn5CRKt6bbCOeMJkvF1lA0Ixx0lAk",
  authDomain: "pulse-b688b.firebaseapp.com",
  projectId: "pulse-b688b",
  storageBucket: "pulse-b688b.firebasestorage.app",
  messagingSenderId: "246245685772",
  appId: "1:246245685772:web:39f5b04a88c328aa818c29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);