import getValidUIDs, { formatMatch } from "../public/uid-validate.js";
import getBestUIDForPrompt from "../public/uid-best.js";
import { saveResponse, updateResponse } from "./firestore.js";
import uids from "../public/suttas/uids.js";

/*
    1. Get valid sutta IDs
    2. If no valid UIDs, show generic message
    3. Call OpenAI API with the prompt and list of valid UIDs
*/

const formElem = document.querySelector("form");
formElem.onsubmit = readStream;

async function readStream(event) {
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
            uids = await getValidUIDs({ prompt }),
            bestUID = uids && (await getBestUIDForPrompt({ prompt, uids }));
        if (!bestUID) {
            responseElem.textContent =
                "There are no valid suttas that match your question. " +
                "Please ask something else.";
            return;
        }
        const params = getParamsForOpenAi({ uids: bestUID, prompt }),
            stream = await fetchStream(params),
            reader = stream.getReader();
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
                    summary = getSummary(bestUID);
                responseElem.innerHTML = response;
                showSummary({ summaryElem, summary });
                const dbParams = { prompt, response, summary, uids: bestUID };
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
    } catch (err) {
        console.error(err);
        responseElem.textContent = "There has been an error. Please try again.";
    }
}

function getParamsForOpenAi({ uids, prompt }) {
    const systemContent =
        "You are the next Buddha named Maitreya. " +
        "You give advice based on Buddhist suttas. " +
        `Do not write more than two paragraphs.`;
    return {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: systemContent,
            },
            {
                role: "user",
                content: getPrompt({ uids, prompt }),
            },
        ],
        temperature: 0.4,
        apiKeyName: "OPENAI_API_KEY_MAITREYA",
    };
}

function getPrompt({ uids, prompt }) {
    const [uid, blurb] = Object.entries(uids)[0];
    return (
        (blurb
            ? `Here is a quick summary of the sutta with the ID ${uid}: ` +
              `"${blurb}" ` +
              "\n\nPlease explain why it matches so well with this prompt: " +
              `"${prompt}"`
            : `Please explain why the sutta with the ID ${uid} fits ` +
              `so well with this prompt: "${prompt}"`) +
        "\n\nIn your answer, please mention the sutta ID again in the same format. " +
        "Please do not provide any standalone references to this ID."
    );
}

async function fetchStream(params) {
    const response = await fetch(
        "https://uf663xchsyh44bikbn723q7ewq0xqoaz.lambda-url.us-east-2.on.aws/",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        }
    );
    return response.body;
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

function showSummary({ summaryElem, summary }) {
    summaryElem.innerHTML = summary;
    summaryElem.style.display = "block";
}

function getSummary(uids) {
    const listItems = Object.entries(uids)
        .map(
            ([uid, blurb]) => `
            <li>
                <strong>
                    <a
                        href="/suttas/?uid=${uid}"
                        target="_blank"
                        rel="noopener"
                    >${uid}</a>${blurb ? ":" : ""}
                </strong>
                ${blurb || ""}
            </li>`
        )
        .join("");
    return `<h2>References</h2><ul>${listItems}</ul>`;
}
