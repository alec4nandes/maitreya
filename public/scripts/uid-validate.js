import uids from "./uids.js";

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

export { fetcher, fetchSuttaplexUID };
