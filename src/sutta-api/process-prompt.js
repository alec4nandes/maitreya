/*
    This is the third and final step of the Sutta API that
    brings it all together.
    The goal here is to take the list of valid sutta UIDs for
    the user's input (see step 1 in ./get-uids.js) and then
    pass it to getBestPick() to find the most appropriate UID
    in the list (see step 2 in ./pick-best.js).
    After getting the best UID, format the final prompt for
    OpenAI and return the best pick data along with the
    streamed response for display.
*/

import getBestPick from "./pick-best.js";
import getValidUIDs from "./get-uids.js";
import { auth } from "../db.js";

async function processPrompt(prompt) {
    // Ask OpenAI to provide a list of UIDs for suttas that relate to the prompt.
    // Then see if those UIDs are valid for SuttaCentral by checking the Suttaplex.
    // If valid, also get the sutta's blurb (short description) from the Suttaplex.
    const uids = await getValidUIDs({ prompt }),
        // Ask OpenAI to choose the most relevant blurb
        // and its sutta UID in relation to the prompt.
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
        params = await getStreamParams(streamPrompt),
        stream = await fetchStream(params);
    return stream;
}

function getStreamPrompt({ bestPick, prompt }) {
    const { uid, blurb } = bestPick;
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

async function getStreamParams(streamPrompt) {
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
        projectId: "MAITREYA",
        token: await auth.currentUser.getIdToken(true),
    };
}

async function fetchStream(params) {
    const response = await fetch(
        "https://qkhc7ig77yaaly33hd6i2he6yi0ydqdx.lambda-url.us-east-2.on.aws/",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        }
    );
    return response.body;
}

export default processPrompt;
