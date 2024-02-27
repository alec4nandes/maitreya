import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, firestore } from "./db.js";

async function getLastResponse() {
    try {
        const textarea = document.querySelector('textarea[name="prompt"]'),
            responseElem = document.querySelector("#response"),
            summaryElem = document.querySelector("footer"),
            { last_prompt, last_response, last_summary } = (
                await getDoc(getDocRef())
            ).data();
        textarea.value = last_prompt;
        responseElem.innerHTML = last_response;
        summaryElem.innerHTML = last_summary;
        summaryElem.style.display = "block";
    } catch (err) {
        console.error(err.message);
    }
}

async function updateResponse({ prompt, response, summary }) {
    try {
        await setDoc(getDocRef(), {
            last_prompt: prompt,
            last_response: response,
            last_summary: summary,
        });
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

function getDocRef() {
    const docRef = doc(firestore, "users", auth.currentUser.email);
    return docRef;
}

export { getLastResponse, updateResponse };
