/*
    This is the second step of the Sutta API.
    The goal here is to pick the best sutta UID from the list
    provided by getValidUIDs in ./get-uids.js (step 1).
*/

// Ask OpenAI to choose the most relevant blurb
// and its sutta UID in relation to the prompt.
async function getBestPick({ prompt, uids }) {
    const params = getParamsForbestPick({ prompt, uids }),
        result = await fetchbestPick({ params, uids });
    console.log(result);
    return result;
}

function getParamsForbestPick({ prompt, uids }) {
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
        apiKeyName: "OPENAI_API_KEY_MAITREYA",
    };
}

async function fetchbestPick({ params, uids }) {
    const response = await fetch(
            "https://nsr23vt5ps2kdjj2ypy2ypvlpe0oxnqb.lambda-url.us-east-2.on.aws/",
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
