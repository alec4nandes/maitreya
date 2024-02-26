import { sendEmailVerification } from "firebase/auth";
import { auth } from "./db.js";

document.querySelector("button#resend-verify").onclick = handleResendVerify;

async function handleResendVerify() {
    try {
        await sendEmailVerification(auth.currentUser, {
            url: "https://maitreya-buddha.web.app/",
        });
        alert("Email sent!");
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}
