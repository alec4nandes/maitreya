async function readStream({ event, responseElem }) {
    try {
        event.preventDefault();
        responseElem.textContent = "Asking...";
        const prompt = event.target.prompt.value.trim(),
            stream = await fetchStream(prompt),
            reader = stream.getReader();
        // read() returns a promise that fulfills
        // when a value has been received
        responseElem.textContent = "";
        reader.read().then(function processText({ done, value }) {
            // Result objects contain two properties:
            // done  - true if the stream has already given you all its data.
            // value - some data. Always undefined when done is true.
            if (done) {
                console.log("Stream complete!");
            } else {
                const decoded = new TextDecoder().decode(value);
                responseElem.textContent += parseDecoded(decoded);
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

function parseDecoded(chunk) {
    const data = chunk
        .split("data:")
        .map((line) => {
            try {
                return JSON.parse(line.trim());
            } catch (err) {
                return "";
            }
        })
        .filter(Boolean)
        .map(({ choices }) => choices)
        .flat(Infinity)
        .filter(Boolean)
        .map(({ delta }) => delta?.content)
        .join("");
    return data;
}

export { readStream };
