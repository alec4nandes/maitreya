import { auth } from "./db.js";
import {
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
} from "firebase/auth";

const signInForm = document.querySelector("form#sign-in");

signInForm.onsubmit = handleSignIn;
document.querySelector("button#reset-pw").onclick = handleResetPassword;

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

async function handleResetPassword() {
    try {
        const email = signInForm.email.value.trim();
        console.log(email);
        if (email) {
            await sendPasswordResetEmail(auth, email);
            alert(`Password reset email sent to ${email}`);
        } else {
            alert(
                "Please enter your email address " +
                    "to receive a password reset email."
            );
        }
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
