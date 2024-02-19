import { getSuttaplexUid } from "./suttas/get-sutta.js";

const MAX_SUTTAS = 3,
    regExp = new RegExp(/[A-Za-z]{2,4}[0-9]+[\.0-9\-]*/g);

/*
    1. Get sutta IDs as CSV
    2. Split CSV, and map out valid UIDs
    3. Filter out null values
    4. If no values, show generic message
    5. Call OpenAI again with the prompt + a list of valid UIDs
*/

// STEPS 1-3

async function getUIDs(prompt) {
    try {
        const uids = await getOpenAiUIDs(prompt),
            validUIDs = await getValidUIDs(uids);
        console.log(validUIDs);
        return validUIDs;
    } catch (err) {
        console.error(err);
    }
}

async function getOpenAiUIDs(prompt) {
    const response = await fetch(
            "https://nsr23vt5ps2kdjj2ypy2ypvlpe0oxnqb.lambda-url.us-east-2.on.aws/",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(getDataForUIDs(prompt)),
            }
        ),
        { choices } = await response.json(),
        result = choices[0].message.content;
    return result
        .split(",")
        .map((uid) => uid.trim())
        .filter(Boolean);
}

function getDataForUIDs(prompt) {
    const systemContent =
        "Respond only with a comma-separated list of Buddhist sutta IDs " +
        "that relate to each prompt. " +
        "Order the list from most relevant to least relevant " +
        `with no more than ${MAX_SUTTAS} IDs. ` +
        "Every Buddhist sutta has a unique abbreviated ID. " +
        "Format each one according to these rules: " +
        "1. Remove all spaces. " +
        "2. The first numeric digit must immediately follow a letter. " +
        "3. Change all letters to lowercase. " +
        '4. If the ID is for Dhammapada text, use the abbreviation "dhp".';
    return {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: systemContent,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        apiKeyName: "OPENAI_API_KEY_MAITREYA",
    };
}

async function getValidUIDs(uids) {
    const result = {};
    for (const uid of uids) {
        try {
            result[uid] = await getSuttaplexUid(uid);
        } catch (err) {
            console.error(err);
        }
    }
    return result;
}

// STEPS 4-5

async function readStream({ event, summaryElem, responseElem, level = 0 }) {
    try {
        event.preventDefault();
        summaryElem.style.display = "none";
        responseElem.style.textAlign = "center";
        responseElem.textContent = "Asking...";
        const prompt = event.target.prompt.value.trim(),
            uids = await getUIDs(prompt),
            data = getData({ uids, prompt });
        if (!data) {
            if (level > 2) {
                responseElem.textContent =
                    "There are no valid suttas that match your question. " +
                    "Please ask something else.";
                return;
            } else {
                readStream({
                    event,
                    summaryElem,
                    responseElem,
                    level: level + 1,
                });
                return;
            }
        }
        const stream = await fetchStream(data),
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
                showSummary({ summaryElem, uids });
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

function getData({ uids, prompt }) {
    for (const uid of Object.keys(uids)) {
        !uids[uid].uid && delete uids[uid];
    }
    if (!Object.entries(uids).length) {
        return null;
    }
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
    const uniqueUIDs = [...new Set(Object.values(uids).map(({ uid }) => uid))];
    return (
        "Here are a list of sutta IDs: " +
        uniqueUIDs.join(", ") +
        ". Do not expand on a hypenated range of verses, for example dhp1-20. " +
        "Treat them as a single unit. " +
        "Write a separate paragraph for each ID that begins with the ID " +
        "followed by a colon. After the colon, explain how each sutta ID " +
        "relates to the following prompt: " +
        prompt
    );
}

async function fetchStream(data) {
    const response = await fetch(
        "https://uf663xchsyh44bikbn723q7ewq0xqoaz.lambda-url.us-east-2.on.aws/",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }
    );
    return response.body;
}

function parseContent(content) {
    const matches = [...new Set(content.match(regExp) || [])];
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

function showSummary({ summaryElem, uids }) {
    const noRepeats = Object.values(uids).reduce(
        (acc, { uid, blurb }) => (uid in acc ? acc : { ...acc, [uid]: blurb }),
        {}
    );
    summaryElem.innerHTML = `
        <h2>References</h2>
        <ul>
            ${Object.entries(noRepeats)
                .map(
                    ([uid, blurb]) => `
                    <li>
                        <strong>
                            <a
                                href="/suttas/?uid=${uid}"
                                target="_blank"
                                rel="noopener">${uid}</a>${blurb ? ":" : ""}
                        </strong>
                        ${blurb || ""}
                    </li>`
                )
                .join("")}
        </ul>`;
    summaryElem.style.display = "block";
}

export { getUIDs, readStream };
