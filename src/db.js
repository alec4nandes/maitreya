import config, { devConfig } from "./credentials.js";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const IS_DEVELOPMENT = false,
    app = initializeApp(IS_DEVELOPMENT ? devConfig : config),
    auth = getAuth(app),
    firestore = getFirestore(app);

export default app;
export { auth, firestore };
