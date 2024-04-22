// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAD37NLuU5LHkLRtq7iXj_c1ul3fTwOPZE",
  authDomain: "electricity-bill-calcula-5571c.firebaseapp.com",
  databaseURL: "https://electricity-bill-calcula-5571c-default-rtdb.firebaseio.com",
  projectId: "electricity-bill-calcula-5571c",
  storageBucket: "electricity-bill-calcula-5571c.appspot.com",
  messagingSenderId: "900237736953",
  appId: "1:900237736953:web:dcfdb982c0280ca7359b28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Obtiene una instancia de Firestore
const db = getFirestore(app);

// Exporta la instancia de Firestore para su uso en otros archivos
export { db };