/*
    This is the second step of the Sutta API.
    The goal here is to pick the best sutta UID from the list
    provided by getValidUIDs in ./get-uids.js (step 1).
*/

import { auth } from "../db";

// Ask OpenAI to choose the most relevant blurb
// and its sutta UID in relation to the prompt.
async function getBestPick({ prompt, uids }) {
    const params = await getParamsForBestPick({ prompt, uids }),
        result = await fetchbestPick({ params, uids });
    console.log(result);
    return result;
}

async function getParamsForBestPick({ prompt, uids }) {
    const systemContent =
            "For this prompt, respond only with a single number. " +
            "This number should match the prompt's numbered " +
            "paragraph that best relates to this content: " +
            `"${prompt}"`,
        newPrompt = Object.entries(uids)
            .map(
                ([uid, blurb], i) =>
                    `${i + 1}. ${blurb || `The text for sutta ${uid}.`}`
            )
            .join("\n\n");
    return {
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: systemContent,
            },
            {
                role: "user",
                content: newPrompt,
            },
        ],
        projectId: "MAITREYA",
        token: await auth.currentUser.getIdToken(true),
    };
}

async function fetchbestPick({ params, uids }) {
    const response = await fetch(
            "https://22bgimafvhroblvxfwaicex73e0khmzb.lambda-url.us-east-2.on.aws/",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            }
        ),
        { choices } = await response.json(),
        result = choices[0].message.content.trim().split(" ")[0],
        index = result - 1;
    console.log("INDEX:", index, `(${result})`);
    const [uid, blurb] = Object.entries(uids)[index];
    return { uid, blurb };
}

export default getBestPick;
