/*
    This is the first step of the Sutta API.
    The goal here is to get a list of sutta UIDs
    that best relate to the user's input (aka prompt).
*/

import { fetchSuttaplexUID } from "../../public/scripts/uid-validate.js";
import { auth } from "../db.js";

const SUTTA_COUNT = 5;

// Ask OpenAI to provide a list of UIDs for suttas that relate to the prompt.
// Then see if those UIDs are valid for SuttaCentral by checking the Suttaplex.
// If valid, also get the sutta's blurb (short description) from the Suttaplex.
async function getValidUIDs({ prompt, level = 1, result = {} }) {
    const params = await getParamsForUIDs(prompt),
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

async function getParamsForUIDs(prompt) {
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
        projectId: "MAITREYA",
        token: await auth.currentUser.getIdToken(true),
    };
}

async function fetchUIDs(params) {
    const response = await fetch(
            "https://22bgimafvhroblvxfwaicex73e0khmzb.lambda-url.us-east-2.on.aws/",
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

export default getValidUIDs;
export { formatMatch };
