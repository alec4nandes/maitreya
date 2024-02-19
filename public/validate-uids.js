import uids from "./suttas/uids.js";

const MAX_SUTTAS = 3;

async function getValidUIDs({ prompt, level = 0 }) {
    const params = getParamsForUIDs(prompt),
        uids = await fetchUIDs(params);
    console.log(uids);
    const valid = [];
    for (const uid of uids) {
        try {
            valid.push(await fetchSuttaplexUID(uid));
        } catch (error) {
            console.error(error);
        }
    }
    const result = valid
        .filter(({ uid }) => uid)
        .reduce(
            (acc, { uid, blurb }) =>
                uid in acc ? acc : { ...acc, [uid]: blurb },
            {}
        );
    return Object.entries(result).length
        ? result
        : level > 2
        ? null
        : await getValidUIDs({ prompt, level: level + 1 });
}

function getParamsForUIDs(prompt) {
    const systemContent =
        "Respond only with a comma-separated list of Buddhist sutta IDs " +
        "that relate to each prompt. " +
        "Order the list from most relevant to least relevant " +
        `with no more than ${MAX_SUTTAS} IDs. ` +
        "Every Buddhist sutta has a unique abbreviated ID. " +
        "Format each one according to these rules: " +
        "1. Remove all spaces. " +
        "2. The first numeric digit must immediately follow a letter. " +
        "3. Change all letters to lowercase. " +
        '4. If the ID is for Dhammapada text, use the abbreviation "dhp".';
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
        apiKeyName: "OPENAI_API_KEY_MAITREYA",
    };
}

async function fetchUIDs(params) {
    const response = await fetch(
            "https://nsr23vt5ps2kdjj2ypy2ypvlpe0oxnqb.lambda-url.us-east-2.on.aws/",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            }
        ),
        { choices } = await response.json(),
        result = choices[0].message.content;
    return result
        .split(",")
        .map((uid) => uid.trim())
        .filter(Boolean);
}

async function fetchSuttaplexUID(uid) {
    const prefix = "https://suttacentral.net/api/suttas/";
    let url = `${prefix}${uid}`,
        { suttaplex } = await fetcher(url);
    if (!suttaplex?.uid) {
        // if range, get first part
        uid = uid.split("-")[0];
        url = `${prefix}${uid}`;
        ({ suttaplex } = await fetcher(url));
        if (!suttaplex?.uid) {
            // if more than 2 subsections, pop off last
            const arr = uid.split(".");
            arr.pop();
            uid = arr.join(".");
            if (uid) {
                url = `${prefix}${uid}`;
                ({ suttaplex } = await fetcher(url));
            }
        }
    }
    const allUids = Object.keys(uids);
    return {
        uid: allUids.includes(suttaplex?.uid) && suttaplex.uid,
        blurb: suttaplex?.blurb,
    };
}

async function fetcher(url) {
    return await (await fetch(url)).json();
}

export default getValidUIDs;
export { MAX_SUTTAS, fetchSuttaplexUID, fetcher };
