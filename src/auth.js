import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./db.js";

onAuthStateChanged(auth, (user) => {
    const isSignInPage = window.location.href.includes("sign-in.html"),
        isSignUpPage = window.location.href.includes("sign-up.html"),
        isVerifyPage = window.location.href.includes("verify.html"),
        isSignInOrUp = isSignInPage || isSignUpPage,
        isSignInUpOrVerify = isSignInOrUp || isVerifyPage;
    if (user) {
        if (!user.emailVerified) {
            if (!isVerifyPage) {
                window.location.href = "/verify.html";
            } else {
                displayMain();
            }
            return;
        }
        if (isSignInUpOrVerify) {
            window.location.href = "/";
            return;
        }
    }
    if (!user && !isSignInOrUp) {
        window.location.href = "/sign-in.html";
        return;
    }
    displayMain();
});

function displayMain() {
    document.querySelector("main").style.display = "block";
}
