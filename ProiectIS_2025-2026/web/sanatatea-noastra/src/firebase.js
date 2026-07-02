import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCL-FEguKUp1cuIUlI7JWAA7N1Qg0OoI9c",
  authDomain: "sanatatea-noastra.firebaseapp.com",
  projectId: "sanatatea-noastra",
  storageBucket: "sanatatea-noastra.firebasestorage.app",
  messagingSenderId: "249856019305",
  appId: "1:249856019305:web:f3faa38803302905b4cbf8"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)