import { auth } from "./db.js";
import { signInWithEmailAndPassword } from "firebase/auth";

document.querySelector("form#sign-in").onsubmit = handleSignIn;

async function handleSignIn(e) {
    e.preventDefault();
    const { email, password } = e.target;
    try {
        await signInWithEmailAndPassword(auth, email.value, password.value);
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
