/*
    This JS file needs to run every so often to crawl
    the SuttaCentral git repo for any new UIDs.
    An UID (aka "mn11") refers to a specific sutta.
    
    Run this file:
        cd public/suttas
        node crawl.js
*/

const fs = require("fs");

crawl();

async function crawl() {
    const abbvs = await getAbbreviations();
    let authors = {},
        result = {};
    for (const abbv of abbvs) {
        result = { ...result, ...(await getChapter(abbv, authors)) };
    }
    authors = sortObject(authors);
    result = sortObject(result);
    const str = `
            const uids = ${JSON.stringify(result)};
            
            const authors = ${JSON.stringify(authors)};
            
            export default uids;
            export { authors };
        `;
    fs.writeFile("uids.js", str, function () {});
}

async function getAbbreviations() {
    const url = "https://suttacentral.net/api/expansion",
        data = await fetcher(url);
    return data.map((d) => Object.keys(d)).flat(Infinity);
}

async function fetcher(url) {
    return await (await fetch(url)).json();
}

async function getChapter(chapter, authors) {
    const url = `https://suttacentral.net/api/suttaplex/${chapter}`,
        data = await fetcher(url),
        uids = data.filter(
            ({ uid }) => uid && [...uid].find((char) => !isNaN(char))
        ),
        result = {};
    for (const { uid, translations } of uids) {
        const english = translations
            .filter(
                ({ lang, author, author_uid }) =>
                    lang === "en" && author && author_uid
            )
            .map(({ author, author_uid }) => {
                authors[author_uid] = author;
                return author_uid;
            });
        if (english.length) {
            result[uid] = english;
        }
    }
    return result;
}

function sortObject(obj) {
    const keys = Object.keys(obj).sort(sortUID),
        result = {};
    keys.forEach(
        (key) =>
            (result[key] = Array.isArray(obj[key]) ? obj[key].sort() : obj[key])
    );
    return result;
}

function sortUID(a, b) {
    const [aChap, aNum] = splitUID(a),
        [bChap, bNum] = splitUID(b),
        compareChaps = aChap.localeCompare(bChap);
    if (compareChaps) {
        return compareChaps;
    } else {
        const [an1, an2] = aNum.split(".").map((n) => +n),
            [bn1, bn2] = bNum.split(".").map((n) => +n);
        return an1 - bn1 || an2 - bn2;
    }
}

function splitUID(uid) {
    const index = getFirstNumIndex(uid),
        chap = uid.slice(0, index),
        num = uid.slice(index).split("-")[0];
    return [chap, num];
}

function getFirstNumIndex(uid) {
    const chars = [...uid];
    for (let i = 0; i < chars.length; i++) {
        if (!isNaN(chars[i])) {
            return i;
        }
    }
}
