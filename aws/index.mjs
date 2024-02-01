import fetch from "node-fetch";

export const handler = awslambda.streamifyResponse(
    async (event, responseStream, context) => {
        const { prompt } = event;
        responseStream.setContentType("text/plain");
        await ask({ prompt, responseStream });
    }
);

async function ask({ prompt, responseStream }) {
    const systemContent =
        "You are the next Buddha named Maitreya. " +
        "You give advice based on the suttas. " +
        "Reference the Tripiṭaka as much as possible.";
    await streamOpenAiResponse({ systemContent, prompt, responseStream });
}

async function streamOpenAiResponse({ systemContent, prompt, responseStream }) {
    try {
        const data = {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemContent },
                { role: "user", content: prompt },
            ],
            stream: true,
            temperature: 0.7,
        };
        await fetchStream({ data, responseStream });
    } catch (err) {
        console.error(err.message);
    }
}

async function fetchStream({ data, responseStream }) {
    await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.body)
        .then((res) => {
            res.on("readable", () => {
                let chunk;
                while (null !== (chunk = res.read())) {
                    parseDecoded({ chunk, responseStream });
                }
            });
            res.on("end", () => {
                responseStream.end();
            });
        })
        .catch((err) => console.log(err));
}

function parseDecoded({ chunk, responseStream }) {
    const data = ("" + chunk)
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
        const parsed = piece?.choices?.[0]?.delta?.content;
        responseStream.write(parsed || "");
    }
}
