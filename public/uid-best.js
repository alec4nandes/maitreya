async function getBestUIDForPrompt({ prompt, uids }) {
    const params = getParamsForBestUID({ prompt, uids }),
        result = await fetchBestUID({ params, uids });
    console.log(result);
    return result;
}

function getParamsForBestUID({ prompt, uids }) {
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

async function fetchBestUID({ params, uids }) {
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
    return { [uid]: blurb };
}

export default getBestUIDForPrompt;
