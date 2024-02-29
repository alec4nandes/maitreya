import getBestPick from "./pick-best.js";
import getValidUIDs from "../public/scripts/uid-validate.js";

async function processPrompt(prompt) {
    // Ask OpenAI to provide a list of UIDs for suttas that relate to the prompt.
    // Then see if those UIDs are valid for SuttaCentral by checking the Suttaplex.
    // If valid, also get the sutta's blurb (short description) from the Suttaplex.
    const uids = await getValidUIDs({ prompt }),
        // Ask OpenAI to choose the most relevant blurb
        // and its sutta UID in relation to the prompt.
        // TODO: change data from {uid: blurb} to {uid, blurb}
        bestPick = uids && (await getBestPick({ prompt, uids }));
    if (!bestPick) {
        return null;
    }
    // Ask OpenAI to explain how the best blurb relates to the prompt.
    const stream = await fetchBestPickStream({ bestPick, prompt });
    return { bestPick, stream };
}

async function fetchBestPickStream({ bestPick, prompt }) {
    const streamPrompt = getStreamPrompt({ bestPick, prompt }),
        params = getStreamParams(streamPrompt),
        stream = await fetchStream(params);
    return stream;
}

function getStreamPrompt({ bestPick, prompt }) {
    const [uid, blurb] = Object.entries(bestPick)[0];
    return (
        (blurb
            ? `Here is a quick summary of the sutta with the ID ${uid}: ` +
              `"${blurb}" ` +
              "\n\nPlease explain why it matches so well with this prompt: " +
              `"${prompt}"`
            : `Please explain why the sutta with the ID ${uid} fits ` +
              `so well with this prompt: "${prompt}"`) +
        "\n\nIn your answer, please mention the sutta ID again in the same format. " +
        "Please do not provide any standalone references to this ID."
    );
}

function getStreamParams(streamPrompt) {
    const systemContent =
        "You are the next Buddha named Maitreya. " +
        "You give advice based on Buddhist suttas. " +
        `Do not write more than two paragraphs.`;
    return {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: systemContent,
            },
            {
                role: "user",
                content: streamPrompt,
            },
        ],
        temperature: 0.4,
        apiKeyName: "OPENAI_API_KEY_MAITREYA",
    };
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

export default processPrompt;
