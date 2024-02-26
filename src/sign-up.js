import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";
import { auth } from "./db.js";

document.querySelector("form#sign-up").onsubmit = handleSignUp;

async function handleSignUp(e) {
    e.preventDefault();
    const { email, password } = e.target;
    try {
        const { user } = await createUserWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );
        await sendEmailVerification(user, {
            url: "https://maitreya-buddha.web.app/",
        });
        window.location.href = "/";
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
