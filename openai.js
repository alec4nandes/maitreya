import { openAiApiKey } from "./secrets.js";

/*
    STYLE GUIDE:
    If a function has more than one param, destructure them.
*/

async function ask({ event, responseElem }) {
    event.preventDefault();
    const systemContent =
            "You are the next Buddha named Maitreya. " +
            "You give advice based on the suttas. " +
            "Reference the Tripiṭaka as much as possible.",
        prompt = event.target.prompt.value;
    await streamOpenAiResponse({ responseElem, systemContent, prompt });
}

async function streamOpenAiResponse({ responseElem, systemContent, prompt }) {
    try {
        responseElem.textContent = "Asking...";
        const data = {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemContent },
                    { role: "user", content: prompt },
                ],
                stream: true,
                temperature: 0.7,
            },
            stream = await getStream(data);
        fetchStream({ responseElem, stream });
    } catch (err) {
        responseElem.textContent = err.message;
    }
}

async function getStream(data) {
    const apiEndpoint = "https://api.openai.com/v1/chat/completions",
        response = await fetch(apiEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openAiApiKey}`,
            },
            body: JSON.stringify(data),
        }),
        stream = response.body;
    return stream;
}

function fetchStream({ responseElem, stream }) {
    responseElem.textContent = "";
    const reader = stream.getReader();
    // read() returns a promise that fulfills
    // when a value has been received
    reader.read().then(function processText({ done, value }) {
        // Result objects contain two properties:
        // done  - true if the stream has already given you all its data.
        // value - some data. Always undefined when done is true.
        if (done) {
            console.log("Stream complete!");
        } else {
            const decoded = new TextDecoder().decode(value);
            parseDecoded({ decoded, responseElem });
        }
        // Read some more, and call this function again
        return !done && reader.read().then(processText);
    });
}

function parseDecoded({ decoded, responseElem }) {
    const data = decoded
        .split("data:")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            try {
                return JSON.parse(line);
            } catch (err) {
                console.warn(line);
                return "";
            }
        });
    for (const piece of data) {
        const chunk = piece?.choices?.[0]?.delta?.content;
        responseElem.innerHTML += chunk || "";
    }
}

export { ask };
