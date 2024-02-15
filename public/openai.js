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
        "Every sutta has a unique abbreviated ID. " +
        "Find the IDs of all suttas that relate to each prompt, " +
        "then format them according to these rules: " +
        "1. Remove all spaces. " +
        "2. The first numeric digit must immediately follow a letter. " +
        "3. Change all letters to lowercase. " +
        '4. If the ID is for Dhammapada text, use the abbreviation "dhp". ' +
        "You absolutely must follow the above formatting rules. " +
        "You also must follow these next rules: " +
        "1. Write a separate paragraph for each newly formatted ID. " +
        "2. Start the paragraph with the formatted ID, followed by a colon. " +
        "3. Write a brief summary of the sutta that doesn't contain any " +
        "direct quotes. The summary also must not mention the ID again.";
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
        temperature: 0.4,
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
    return m.toLowerCase();
}

export { readStream };
