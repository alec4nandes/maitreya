import uids from "./uids.js";

const SUTTA_COUNT = 5;

async function getValidUIDs({ prompt, level = 1, result = {} }) {
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
    result = {
        ...result,
        ...valid
            .filter(({ uid }) => uid)
            .reduce(
                (acc, { uid, blurb }) =>
                    uid in acc || uid in result
                        ? acc
                        : { ...acc, [uid]: blurb },
                {}
            ),
    };
    console.log(result);
    const { length } = Object.entries(result),
        above2 = level > 2;
    return length >= SUTTA_COUNT || (length && above2)
        ? result
        : above2
        ? null
        : await getValidUIDs({ prompt, level: level + 1, result });
}

function getParamsForUIDs(prompt) {
    const systemContent =
        "Respond only with a comma-separated list of IDs for Buddhist suttas " +
        "that relate to this prompt. " +
        `The list must have ${SUTTA_COUNT} IDs. ` +
        'If the ID is for Dhammapada text, use the abbreviation "dhp".';
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
    console.log(result);
    return result.split(",").map(formatMatch).filter(Boolean);
}

function formatMatch(m) {
    return m.trim().replaceAll(" ", "").toLowerCase();
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
export { fetcher, fetchSuttaplexUID, formatMatch };
