import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./db.js";
import { getLastResponse } from "./firestore.js";

onAuthStateChanged(auth, async (user) => {
    const isSignInPage = window.location.href.includes("sign-in.html"),
        isSignUpPage = window.location.href.includes("sign-up.html"),
        isVerifyPage = window.location.href.includes("verify.html"),
        isSignInOrUp = isSignInPage || isSignUpPage,
        isSignInUpOrVerify = isSignInOrUp || isVerifyPage;
    if (user) {
        if (!user.emailVerified) {
            if (!isVerifyPage) {
                window.location.replace("/verify.html");
            } else {
                displayMain();
            }
            return;
        }
        if (isSignInUpOrVerify) {
            window.location.replace("/");
            return;
        }
        await getLastResponse();
    }
    if (!user && !isSignInOrUp) {
        window.location.replace("/sign-in.html");
        return;
    }
    displayMain();
});

function displayMain() {
    document.querySelector("main").style.display = "block";
}
