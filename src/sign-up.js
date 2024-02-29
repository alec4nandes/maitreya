import { auth } from "./db.js";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";

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
    } catch (err) {
        console.error(err);
        if (err.message.includes("auth/network-request-failed")) {
            // set delay on this particular alert
            // (sometimes it pops up too early and isn't necessary)
            setTimeout(() => alert(err.message), 1000);
        } else {
            alert(err.message);
        }
    }
}
