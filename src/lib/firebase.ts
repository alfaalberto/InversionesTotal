// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBB-L31Jg6Lokhl9bCsf_WaplB8ZywWm8I",
  authDomain: "inversionestotal.firebaseapp.com",
  projectId: "inversionestotal",
  storageBucket: "inversionestotal.firebasestorage.app",
  messagingSenderId: "87896140769",
  appId: "1:87896140769:web:ba3de3025908634a1d40a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
