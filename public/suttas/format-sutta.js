function formatText({ data, authorName }) {
    const title = getTitle({ data, authorName }),
        sutta = getSuttaTable(data);
    document.querySelector("#title").innerHTML = title;
    document.querySelector("#sutta").innerHTML = sutta;
}

function getTitle({ data, authorName }) {
    const keys = Object.keys(data),
        titleKeys = keys.filter(
            // line number starts with 0
            (key) => key.split(":")[1].split(".")[0] === "0"
        ),
        titleLines = titleKeys.map((key) => {
            const result = data[key];
            delete data[key];
            return result;
        }),
        headings = titleLines
            .map((line, i) => `<h${i + 2}>${line}</h${i + 2}>`)
            .join("");
    return `
        ${headings}
        <em>by ${authorName}</em>
    `;
}

function getSuttaTable(data) {
    const rows = Object.entries(data)
        .map(([key, line]) => `<tr><td>${key}</td><td>${line}</td></tr>`)
        .join("");
    return `<table>${rows}</table>`;
}

function formatLegacyText({ data, authorName }) {
    const div = document.createElement("div");
    div.innerHTML = data;
    const title = getLegacyTitle({ div, authorName }),
        sutta = getLegacySutta(div);
    document.querySelector("#title").innerHTML = title;
    document.querySelector("#sutta").innerHTML = sutta;
}

function getLegacyTitle({ div, authorName }) {
    const h1 = div.querySelector("h1"),
        ul = div.querySelector("ul"),
        titleListItems = [...(ul?.querySelectorAll("li") || [])],
        titleLines = [h1, ...titleListItems].map((line) =>
            line.innerHTML?.trim()
        ),
        headings = titleLines
            .map((line, i) => `<h${i + 2}>${line}</h${i + 2}>`)
            .join("");
    return `
        ${headings}
        <em>by ${authorName}</em>
    `;
}

function getLegacySutta(div) {
    const paragraphs = [...div.querySelectorAll("p")];
    removeLinksFromParagraphs(paragraphs);
    return paragraphs.map((p) => `<p>${p.innerHTML}</p>`).join("");
}

function removeLinksFromParagraphs(paragraphs) {
    const copyrightIndex = getCopyrightIndex(paragraphs);
    paragraphs.forEach((p, i) => {
        if (i < copyrightIndex) {
            // remove all links above copyright
            [...p.querySelectorAll("a")].forEach((link) => link.remove());
        }
    });
}

function getCopyrightIndex(paragraphs) {
    for (let i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i].innerHTML.includes("©")) {
            return i;
        }
    }
    return -1;
}

export { formatText, formatLegacyText };
