import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "./db.js";

async function getLastResponse() {
    try {
        const textarea = document.querySelector('textarea[name="prompt"]'),
            responseElem = document.querySelector("#response"),
            summaryElem = document.querySelector("footer"),
            saveBtn = document.querySelector("button#save-response"),
            { last_prompt, last_response, last_summary, last_uids } = (
                await getDoc(getDocRef())
            ).data();
        textarea.value = last_prompt;
        responseElem.innerHTML = last_response;
        summaryElem.innerHTML = last_summary;
        summaryElem.style.display = "block";
        saveBtn.onclick = () =>
            saveResponse({
                prompt: last_prompt,
                response: last_response,
                summary: last_summary,
                uids: last_uids,
            });
        saveBtn.disabled = false;
    } catch (err) {
        console.error(err.message);
    }
}

async function getSavedResponses() {
    const menuContent = document.querySelector("#menu-content");
    try {
        const { saved_responses: saved } = (await getDoc(getDocRef())).data();
        menuContent.innerHTML += saved?.length
            ? formatSavedResponses(saved)
            : "<p><em>No saved responses.</em></p>";
    } catch (err) {
        console.error(err);
        menuContent.innerHTML +=
            "<p><em>Unable to retrieve saved responses.</em></p>";
    }
}

function formatSavedResponses(saved) {
    const listItems = saved
        .map(
            ({ time, prompt, uids }) => `
                <li>
                    <p class="time">${new Date(time).toLocaleString()}</p>
                    <p class="asked">${prompt}</p>
                    <p class="uids">
                        ${Object.keys(uids)
                            .map(
                                (uid) => `
                                    <a
                                        href="/suttas/?uid=${uid}"
                                        target="_blank"
                                        rel="noopener">${uid}</a>`
                            )
                            .join(", ")}
                    </p>
                </li>
            `
        )
        .join("");
    return `<ul>${listItems}</ul>`;
}

async function updateResponse({ prompt, response, summary, uids }) {
    try {
        const docRef = getDocRef(),
            docExists = (await getDoc(docRef)).exists();
        await (docExists ? updateDoc : setDoc)(getDocRef(), {
            last_prompt: prompt,
            last_response: response,
            last_summary: summary,
            last_uids: uids,
        });
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

async function saveResponse({ prompt, response, summary, uids }) {
    try {
        await updateDoc(getDocRef(), {
            saved_responses: arrayUnion({
                time: new Date().getTime(),
                prompt,
                response,
                summary,
                uids,
            }),
        });
        alert("Response saved!");
        window.location.reload();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

function getDocRef() {
    const docRef = doc(firestore, "users", auth.currentUser.email);
    return docRef;
}

export { getLastResponse, getSavedResponses, updateResponse, saveResponse };
