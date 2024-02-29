import { auth } from "./db.js";
import { signOut } from "firebase/auth";

document.querySelector("button#sign-out").onclick = handleSignOut;

async function handleSignOut() {
    try {
        await signOut(auth);
        window.location.href = "/sign-in.html";
    } catch (err) {
        console.error(err);
        alert("Could not sign out. Error: " + err.message);
    }
}
