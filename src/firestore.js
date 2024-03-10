import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, firestore } from "./db.js";

async function getLastResponse() {
    try {
        const textarea = document.querySelector('textarea[name="prompt"]'),
            lastSavedTime = document.querySelector("#last-saved-time"),
            responseElem = document.querySelector("#response"),
            summaryElem = document.querySelector("footer"),
            saveBtn = document.querySelector("button#save-response"),
            {
                last_prompt,
                last_response,
                last_summary,
                last_uids,
                last_saved_time,
            } = (await getDoc(getDocRef())).data();
        textarea.value = last_prompt;
        if (last_saved_time) {
            lastSavedTime.innerHTML = `<em>saved on ${formatTime(
                last_saved_time
            )}</em>`;
        }
        responseElem.innerHTML = last_response;
        summaryElem.innerHTML = last_summary;
        summaryElem.style.display = "block";
        saveBtn.textContent = last_saved_time
            ? "delete response"
            : "save response";
        saveBtn.onclick = async () => {
            if (last_saved_time) {
                await updateResponse({
                    prompt: last_prompt,
                    response: last_response,
                    summary: last_summary,
                    uids: last_uids,
                    saved_time: false,
                });
                await deleteSavedResponse(last_saved_time);
            } else {
                saveResponse({
                    prompt: last_prompt,
                    response: last_response,
                    summary: last_summary,
                    uids: last_uids,
                });
            }
        };
        saveBtn.disabled = false;
    } catch (err) {
        console.error(err.message);
    }
}

async function getSavedResponses() {
    const menuContent = document.querySelector("#menu-content");
    try {
        const { saved_responses: saved } = (await getDoc(getDocRef())).data();
        saved?.length
            ? menuContent.appendChild(formatSavedResponses(saved))
            : (menuContent.innerHTML = "<p><em>No saved responses.</em></p>");
    } catch (err) {
        console.error(err);
        menuContent.innerHTML +=
            "<p><em>Unable to retrieve saved responses.</em></p>";
    }
}

function formatSavedResponses(saved) {
    const ul = document.createElement("ul");
    saved
        .sort(({ time: a }, { time: b }) => b - a)
        .forEach(({ time, prompt, response, summary, uids }) => {
            const li = document.createElement("li");

            const pTime = document.createElement("p");
            pTime.classList.add("time");
            pTime.textContent = formatTime(time);
            li.appendChild(pTime);

            const btn = document.createElement("button");
            btn.classList.add("text-button");
            btn.textContent = prompt;
            btn.onclick = () =>
                showSavedResponse({ time, prompt, response, summary, uids });
            li.appendChild(btn);

            const pUids = document.createElement("p"),
                uidLinks = Object.keys(uids)
                    .map(
                        (uid) => `
                            <a
                                href="/suttas/?uid=${uid}"
                                target="_blank"
                                rel="noopener">${uid}</a>`
                    )
                    .join(", ");
            pUids.classList.add("uids");
            pUids.innerHTML = uidLinks;
            li.appendChild(pUids);

            ul.appendChild(li);
        });
    return ul;
}

function formatTime(time) {
    return new Date(time).toLocaleString();
}

async function showSavedResponse({ time, prompt, response, summary, uids }) {
    const lastSavedTime = document.querySelector("#last-saved-time"),
        saveBtn = document.querySelector("button#save-response"),
        textarea = document.querySelector('textarea[name="prompt"]'),
        responseElem = document.querySelector("#response"),
        summaryElem = document.querySelector("footer"),
        menu = document.querySelector("header#menu");
    lastSavedTime.innerHTML = `<em>saved on ${formatTime(time)}</em>`;
    saveBtn.textContent = "delete response";
    saveBtn.onclick = () => deleteSavedResponse(time);
    textarea.value = prompt;
    responseElem.innerHTML = response;
    summaryElem.innerHTML = summary;
    summaryElem.style.display = "block";
    menu.classList.add("closed");
    await updateResponse({ prompt, response, summary, uids, saved_time: time });
}

async function deleteSavedResponse(time) {
    const proceed = confirm(`Delete response saved on ${formatTime(time)}?`);
    if (proceed) {
        try {
            const docRef = getDocRef(),
                { saved_responses: saved } = (await getDoc(docRef)).data(),
                filtered = saved.filter(({ time: t }) => t !== time);
            await updateDoc(docRef, { saved_responses: filtered });
            alert("Response deleted!");
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    }
}

async function saveResponse({ prompt, response, summary, uids }) {
    try {
        const time = new Date().getTime();
        await updateDoc(getDocRef(), {
            saved_responses: arrayUnion({
                time,
                prompt,
                response,
                summary,
                uids,
            }),
            last_saved_time: time,
        });
        alert("Response saved!");
        window.location.reload();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

async function updateResponse({ prompt, response, summary, uids, saved_time }) {
    try {
        const docRef = getDocRef(),
            docExists = (await getDoc(docRef)).exists();
        await (docExists ? updateDoc : setDoc)(getDocRef(), {
            last_prompt: prompt,
            last_response: response,
            last_summary: summary,
            last_uids: uids,
            last_saved_time: saved_time,
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

export { getLastResponse, getSavedResponses, saveResponse, updateResponse };
