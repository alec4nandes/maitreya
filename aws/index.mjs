import util from "util";
import stream from "stream";
import fetch from "node-fetch";

const pipeline = util.promisify(stream.pipeline);

export const handler = awslambda.streamifyResponse(
    async (event, responseStream, context) => {
        const prompt = event.body
                ? JSON.parse(event.body).prompt
                : event.prompt,
            requestStream = await fetchStream(prompt?.trim() || "Hi!");
        await pipeline(requestStream, responseStream);
    }
);

async function fetchStream(prompt) {
    try {
        const systemContent =
                "You are the next Buddha named Maitreya. " +
                "You give advice based on the suttas. " +
                "Reference the Tripiṭaka as much as possible.",
            data = {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemContent },
                    { role: "user", content: prompt },
                ],
                stream: true,
                temperature: 0.7,
            },
            response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify(data),
                }
            );
        return response.body;
    } catch (err) {
        console.error(err.message);
    }
}
