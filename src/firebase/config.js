import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnZgChy8R3WoCCTDG2VPw19MYz7JRHDiw",
  authDomain: "traxalon-baf10.firebaseapp.com",
  projectId: "traxalon-baf10",
  storageBucket: "traxalon-baf10.firebasestorage.app",
  messagingSenderId: "76983184891",
  appId: "1:76983184891:web:ee7592a8ceddd1ea54ef5e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
