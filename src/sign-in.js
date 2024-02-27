import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./db.js";

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
