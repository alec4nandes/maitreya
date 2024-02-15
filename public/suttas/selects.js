import uids, { authors } from "./uids.js";

function buildSelects() {
    const selectUid = getSelect("uid"),
        selectAuthor = getSelect("author"),
        uidKeys = Object.keys(uids),
        firstKey = uidKeys[0],
        authors = uids[firstKey];
    addOptions({ elem: selectUid, arr: uidKeys, showName: false });
    selectUid.value = firstKey;
    addOptions({ elem: selectAuthor, arr: authors, showName: true });
    selectAuthor.value = authors[0];
    selectUid.onchange = (e) => {
        const uid = e.target.value,
            newAuthors = uids[uid],
            currentAuthor = selectAuthor.value;
        addOptions({ elem: selectAuthor, arr: newAuthors, showName: true });
        selectAuthor.value = newAuthors.includes(currentAuthor)
            ? currentAuthor
            : newAuthors[0];
    };
}

function getSelect(name) {
    return document.querySelector(`select[name="${name}"]`);
}

function addOptions({ elem, arr, showName }) {
    const names =
        showName &&
        arr.reduce(
            (acc, author) => ({ ...acc, [authors[author]]: author }),
            {}
        );
    elem.innerHTML = (names ? Object.keys(names).sort() : arr)
        .map(
            (value) =>
                `<option value="${
                    names ? names[value] : value
                }">${value}</option>`
        )
        .join("");
}

export default buildSelects;
export { getSelect, addOptions };
