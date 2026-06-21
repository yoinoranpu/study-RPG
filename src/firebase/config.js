import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIfeK0RikmFkPY4nTr32ZChIzqLRjh4wM",
  authDomain: "study-rpg-cae70.firebaseapp.com",
  projectId: "study-rpg-cae70",
  storageBucket: "study-rpg-cae70.firebasestorage.app",
  messagingSenderId: "925055240345",
  appId: "1:925055240345:web:2cf616670651d665e25008"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;