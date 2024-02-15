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
        sutta = getLegacySutta({ div, authorName });
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

function getLegacySutta({ div, authorName }) {
    const paragraphs = [...div.querySelectorAll("p")],
        copyrightIndex = removeLinksFromParagraphs({ paragraphs, authorName });
    return paragraphs
        .map(
            (p, i) =>
                `<p${
                    copyrightIndex && i >= copyrightIndex
                        ? ' class="copyright"'
                        : ""
                }>${p.innerHTML}</p>`
        )
        .join("");
}

function removeLinksFromParagraphs({ paragraphs, authorName }) {
    const copyrightIndex = getCopyrightIndex({ paragraphs, authorName });
    copyrightIndex &&
        paragraphs.forEach((p, i) => {
            if (i < copyrightIndex) {
                // remove all links above copyright
                [...p.querySelectorAll("a")].forEach((link) => link.remove());
            }
        });
    return copyrightIndex;
}

function getCopyrightIndex({ paragraphs, authorName }) {
    const targets = ["©", authorName, "translated", "translation", "published"];
    for (let i = 0; i < paragraphs.length; i++) {
        const foundIt = targets.find((text, n) => {
            const html = paragraphs[i].innerHTML,
                check = n < 2 ? html : html.toLowerCase();
            return check.includes(text);
        });
        if (foundIt) {
            return i;
        }
    }
    return null;
}

export { formatText, formatLegacyText };
