import firebaseConfig from "./credentials.js";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const app = initializeApp(firebaseConfig),
    auth = getAuth(app),
    firestore = getFirestore(app);

export default app;
export { auth, firestore };
