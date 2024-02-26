import firebaseConfig from "./credentials.js";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig),
    auth = getAuth(app);

export default app;
export { auth };
