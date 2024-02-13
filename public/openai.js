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
        "You give advice based on the suttas. " +
        "Reference the Tripiṭaka as much as possible.";
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
        temperature: 0.7,
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

export { readStream };
