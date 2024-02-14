import { getSelect, addOptions } from "./selects.js";

async function getSutta() {
    const { uid, authors, author: authorParam } = await getUID();
    if (!uid) {
        return;
    }
    const authorUids = Object.keys(authors),
        author = authorParam || getRandom(authorUids),
        selectAuthor = getSelect("author"),
        selectUid = getSelect("uid");
    if (!authorParam) {
        const newUrl = window.location.href + `&author=${author}`;
        window.history.pushState({ path: newUrl }, "", newUrl);
    }
    addOptions(selectAuthor, authorUids, true);
    selectAuthor.value = author;
    selectUid.value = uid;
    let url = `https://suttacentral.net/api/bilarasuttas/${uid}/${author}`,
        { translation_text: text } = await fetcher(url);
    if (text) {
        formatText(text, authors[author]);
    } else {
        // is "legacy text"
        url = `https://suttacentral.net/api/suttas/${uid}/${author}`;
        const { text } = (await fetcher(url)).root_text || {};
        text && formatLegacyText(text, authors[author]);
    }
}

async function getUID() {
    const uid = getSearchParam("uid"),
        author = getSearchParam("author");
    if (!uid) {
        return { uid: null };
    }
    try {
        const prefix = "https://suttacentral.net/api/suttas/";
        let url = `${prefix}${uid}`,
            { suttaplex } = await fetcher(url);
        if (!suttaplex) {
            url = `${prefix}${uid.split("-")[0]}`;
            ({ suttaplex } = await fetcher(url));
        }
        const authors = getAuthors(suttaplex),
            authorUids = Object.keys(authors);
        return authorUids.length
            ? {
                  uid: suttaplex.uid,
                  authors,
                  author: authorUids.includes(author) && author,
              }
            : { uid: null };
    } catch (err) {
        console.error(err);
        return { uid: null };
    }
}

function getSearchParam(param) {
    const params = new URL(document.location).searchParams;
    return params.get(param);
}

function getAuthors(suttaplex) {
    return suttaplex.translations
        .filter(({ lang }) => lang === "en")
        .reduce(
            (acc, { author_uid, author }) => ({
                ...acc,
                [author_uid]: author,
            }),
            {}
        );
}

function getRandom(arr) {
    return arr[~~(Math.random() * arr.length)];
}

async function fetcher(url) {
    return await (await fetch(url)).json();
}

function formatText(data, authorName) {
    const keys = Object.keys(data),
        titleKeys = keys.filter(
            (key) => key.split(":")[1].split(".")[0] === "0"
        ),
        title = titleKeys.map((key) => {
            const result = data[key];
            delete data[key];
            return result;
        }),
        header =
            title.map((line, i) => `<h${i + 2}>${line}</h${i + 2}>`).join("") +
            `<em>by ${authorName}</em>`,
        table = `
                <table>
                    ${Object.entries(data)
                        .map(
                            ([key, line]) =>
                                `<tr><td>${key}</td><td>${line}</td></tr>`
                        )
                        .join("")}
                </table>
            `;
    document.querySelector("#title").innerHTML = header;
    document.querySelector("#sutta").innerHTML = table;
}

function formatLegacyText(data, authorName) {
    const div = document.createElement("div");
    div.innerHTML = data;
    const h1 = div.querySelector("h1"),
        title =
            [h1, ...(div.querySelector("ul")?.querySelectorAll("li") || [])]
                .map((line) => line.innerHTML?.trim())
                .map((line, i) => `<h${i + 2}>${line}</h${i + 2}>`)
                .join("") + `<em>by ${authorName}</em>`,
        lines = [...div.querySelectorAll("p")],
        copyrightIndex = getCopyrightIndex(lines),
        formattedLines = lines
            .map((line, i) => {
                if (i < copyrightIndex) {
                    // remove all links
                    [...line.querySelectorAll("a")].forEach((link) =>
                        link.remove()
                    );
                }
                return `<p>${line.innerHTML}</p>`;
            })
            .join("");
    document.querySelector("#title").innerHTML = title;
    document.querySelector("#sutta").innerHTML = formattedLines;
}

function getCopyrightIndex(lines) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].innerHTML.includes("©")) {
            return i;
        }
    }
    return -1;
}

export default getSutta;
export { getRandom };
