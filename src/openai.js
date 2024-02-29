import { formatMatch } from "../public/scripts/uid-validate.js";
import processPrompt from "./process-prompt.js";
import { saveResponse, updateResponse } from "./firestore.js";
import uids from "../public/scripts/uids.js";

const formElem = document.querySelector("form");
formElem.onsubmit = handleAsk;

async function handleAsk(event) {
    event.preventDefault();
    const saveBtn = document.querySelector("button#save-response"),
        summaryElem = document.querySelector("footer"),
        responseElem = document.querySelector("#response");
    try {
        saveBtn.disabled = true;
        summaryElem.style.display = "none";
        responseElem.style.textAlign = "center";
        responseElem.textContent = "Asking...";
        const prompt = event.target.prompt.value.trim(),
            { bestPick, stream } = await processPrompt(prompt);
        if (!stream) {
            responseElem.textContent =
                "There are no valid suttas that match your question. " +
                "Please ask something else.";
            return;
        }
        readStream({
            stream,
            responseElem,
            bestPick,
            summaryElem,
            prompt,
            saveBtn,
        });
    } catch (err) {
        console.error(err);
        responseElem.textContent = "There has been an error. Please try again.";
    }
}

function readStream({
    stream,
    responseElem,
    bestPick,
    summaryElem,
    prompt,
    saveBtn,
}) {
    const reader = stream.getReader();
    // read() returns a promise that fulfills
    // when a value has been received
    responseElem.textContent = "";
    responseElem.style.textAlign = "left";
    reader.read().then(function processText({ done, value }) {
        // Result objects contain two properties:
        // done  - true if the stream has already given you all its data.
        // value - some data. Always undefined when done is true.
        if (done) {
            console.log("Stream complete!");
            const response = parseContent(responseElem.textContent),
                summary = getSummary(bestPick);
            responseElem.innerHTML = response;
            summaryElem.innerHTML = summary;
            summaryElem.style.display = "block";
            const dbParams = { prompt, response, summary, uids: bestPick };
            updateResponse(dbParams);
            saveBtn.textContent = "save response";
            saveBtn.onclick = () => saveResponse(dbParams);
            saveBtn.disabled = false;
        } else {
            const decoded = new TextDecoder().decode(value);
            responseElem.textContent += decoded;
        }
        // Read some more, and call this function again
        return !done && reader.read().then(processText);
    });
}

function parseContent(content) {
    const regExp = new RegExp(/[A-Za-z]{2,4}[ ]{0,1}[0-9]+[\.0-9\-]*/g),
        matches = [...new Set(content.match(regExp) || [])],
        uidKeys = Object.keys(uids);
    for (const m of matches) {
        const formatted = formatMatch(m);
        if (uidKeys.includes(formatted)) {
            content = content.replaceAll(
                m,
                `<a href="/suttas/?uid=${formatted}" ` +
                    `rel="noopener" target="_blank">${formatted}</a>`
            );
        }
    }
    return content;
}

function getSummary(bestPick) {
    const { uid, blurb } = bestPick;
    return `
        <h2>Sutta Reference</h2>
        <div id="summary">
            <strong>
                <a
                    href="/suttas/?uid=${uid}"
                    target="_blank"
                    rel="noopener"
                >${uid}</a>${blurb ? ":" : ""}
            </strong>
            ${blurb || ""}
        </div>`;
}
