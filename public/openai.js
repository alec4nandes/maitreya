const regExp = new RegExp(/[A-Za-z]{2,4}[0-9]+[\.0-9\-]*/g);

async function readStream({ event, responseElem }) {
    try {
        event.preventDefault();
        responseElem.style.textAlign = "center";
        responseElem.textContent = "Asking...";
        const prompt = event.target.prompt.value.trim(),
            data = getData(prompt),
            stream = await fetchStream(data),
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

function getData(prompt) {
    const systemContent =
        "You are the next Buddha named Maitreya. " +
        "You give advice based on Buddhist suttas. " +
        "Every sutta has a unique ID. " +
        "Find the IDs of all suttas that relate to each prompt. " +
        '(For example, Dhammapada verses should contain the abbreviation "Dhp".) ' +
        "Every ID must have absolutely no whitespace, but dots and periods are okay. " +
        "Follow each one of these formatted IDs with a colon and a brief summary " +
        "of the sutta that doesn't contain any direct quotes.";
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
        temperature: 0.6,
        apiKeyName: "OPENAI_API_KEY_MAITREYA",
    };
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
    return m.replaceAll(" ", "").toLowerCase();
}

export { readStream };
