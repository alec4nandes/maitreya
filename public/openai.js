async function readStream({ event, responseElem }) {
    event.preventDefault();
    try {
        responseElem.textContent = "Asking...";
        const prompt = event.target.prompt.value.trim(),
            reader = (await fetchStream(prompt)).getReader();
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
                responseElem.textContent += decoded;
            }
            // Read some more, and call this function again
            return !done && reader.read().then(processText);
        });
    } catch (err) {
        responseElem.textContent = err.message;
    }
}

async function fetchStream(prompt) {
    const response = await fetch(
        "https://uf663xchsyh44bikbn723q7ewq0xqoaz.lambda-url.us-east-2.on.aws/",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
        }
    );
    return response.body;
}

export { readStream };
