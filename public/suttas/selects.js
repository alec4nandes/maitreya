import uids, { authors } from "./uids.js";

function buildSelects() {
    const selectUid = getSelect("uid"),
        selectAuthor = getSelect("author"),
        uidKeys = Object.keys(uids),
        firstKey = uidKeys[0],
        authors = uids[firstKey];
    addOptions(selectUid, uidKeys);
    selectUid.value = firstKey;
    addOptions(selectAuthor, authors, true);
    selectAuthor.value = authors[0];
    selectUid.onchange = (e) => {
        const uid = e.target.value,
            newAuthors = uids[uid],
            currentAuthor = selectAuthor.value;
        addOptions(selectAuthor, newAuthors, true);
        selectAuthor.value = newAuthors.includes(currentAuthor)
            ? currentAuthor
            : newAuthors[0];
    };
}

function getSelect(name) {
    return document.querySelector(`select[name="${name}"]`);
}

function addOptions(selectElem, arr, showName) {
    selectElem.innerHTML = arr
        .map(
            (value) =>
                `<option value="${value}">${
                    showName ? authors[value] : value
                }</option>`
        )
        .join("");
}

export default buildSelects;
export { getSelect, addOptions };
