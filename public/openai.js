import getValidUIDs, { MAX_SUTTAS } from "./validate-uids.js";

/*
    1. Get valid sutta IDs
    2. If no valid UIDs, show generic message
    3. Call OpenAI API with the prompt and list of valid UIDs
*/

async function readStream({ event, summaryElem, responseElem }) {
    try {
        event.preventDefault();
        summaryElem.style.display = "none";
        responseElem.style.textAlign = "center";
        responseElem.textContent = "Asking...";
        const prompt = event.target.prompt.value.trim(),
            uids = await getValidUIDs({ prompt });
        if (!uids) {
            responseElem.textContent =
                "There are no valid suttas that match your question. " +
                "Please ask something else.";
            return;
        }
        const params = getParamsForOpenAi({ uids, prompt }),
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
                responseElem.innerHTML = parseContent(responseElem.textContent);
                showSummary({ uids, summaryElem });
            } else {
                const decoded = new TextDecoder().decode(value);
                responseElem.textContent += decoded;
            }
            // Read some more, and call this function again
            return !done && reader.read().then(processText);
        });
    } catch (err) {
        responseElem.textContent = err.message;
    }
}

function getParamsForOpenAi({ uids, prompt }) {
    const systemContent =
        "You are the next Buddha named Maitreya. " +
        "You give advice based on Buddhist suttas. " +
        `Do not write more than ${MAX_SUTTAS} paragraphs.`;
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
    return (
        "Here are a list of sutta IDs: " +
        Object.keys(uids).join(", ") +
        ". Do not expand on a hypenated range of verses, for example dhp1-20. " +
        "Treat them as a single unit. " +
        "Write a separate paragraph for each ID that begins with the ID " +
        "followed by a colon. After the colon, without mentioning the ID again, " +
        "explain how each sutta ID relates to the following prompt: " +
        prompt
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
    const regExp = new RegExp(/[A-Za-z]{2,4}[0-9]+[\.0-9\-]*/g),
        matches = [...new Set(content.match(regExp) || [])];
    for (const m of matches) {
        content = content.replaceAll(
            m,
            `<a href="/suttas/?uid=${formatMatch(
                m
            )}" rel="noopener" target="_blank">${m}</a>`
        );
    }
    return content;
}

function formatMatch(m) {
    return m.toLowerCase();
}

function showSummary({ uids, summaryElem }) {
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
    summaryElem.innerHTML = `
        <h2>References</h2>
        <ul>${listItems}</ul>`;
    summaryElem.style.display = "block";
}

export default readStream;
