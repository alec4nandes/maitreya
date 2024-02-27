import firebaseConfig from "./credentials.js";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = initializeApp(firebaseConfig),
    auth = getAuth(app),
    firestore = getFirestore(app);

export default app;
export { auth, firestore };
