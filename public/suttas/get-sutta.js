import { formatText, formatLegacyText } from "./format-sutta.js";
import { fetchSuttaplexUID, fetcher } from "../uid-validate.js";
import uids, { authors as authorsInfo } from "./uids.js";
import { getSelect, addOptions } from "./selects.js";

async function getSutta() {
    const { uid, authors, authorParam } = await getUID();
    if (!uid) {
        return;
    }
    const author = authorParam || getRandom(authors);
    updateUrl({ authorParam, author });
    changeSelects({ uid, authors, author });
    const { text, legacyText } = await fetchText({ uid, author }),
        authorName = authorsInfo[author];
    text
        ? formatText({ data: text, authorName })
        : legacyText && formatLegacyText({ data: legacyText, authorName });
    (text || legacyText) && appendPrevAndNextBtns({ uid, author });
}

/* GET UID */

async function getUID() {
    const uid = getSearchParam("uid"),
        author = getSearchParam("author");
    if (!uid) {
        return { uid: null };
    }
    const { uid: suttaplexUid } = await fetchSuttaplexUID(uid),
        authorUids = uids[suttaplexUid];
    return authorUids
        ? {
              uid: suttaplexUid,
              authors: authorUids,
              authorParam: authorUids.includes(author) && author,
          }
        : { uid: null };
}

function getSearchParam(param) {
    const params = new URL(document.location).searchParams;
    return params.get(param);
}

/* END GET UID */

function getRandom(arr) {
    return arr[~~(Math.random() * arr.length)];
}

function updateUrl({ authorParam, author }) {
    if (!authorParam) {
        const newUrl = window.location.href + `&author=${author}`;
        window.history.pushState({ path: newUrl }, "", newUrl);
    }
}

function changeSelects({ uid, authors, author }) {
    const selectUid = getSelect("uid"),
        selectAuthor = getSelect("author");
    selectUid.value = uid;
    addOptions({ elem: selectAuthor, arr: authors, showName: true });
    selectAuthor.value = author;
}

async function fetchText({ uid, author }) {
    let url = `https://suttacentral.net/api/bilarasuttas/${uid}/${author}`;
    const text = (await fetcher(url)).translation_text;
    if (text) {
        return { text };
    }
    // or else it's "legacy text"
    url = `https://suttacentral.net/api/suttas/${uid}/${author}`;
    const legacyText = (await fetcher(url)).root_text.text;
    return { legacyText };
}

function appendPrevAndNextBtns({ uid, author }) {
    const prevAndNextElems = [...document.querySelectorAll(".prev-and-next")];
    prevAndNextElems.forEach((elem) =>
        buildPrevAndNextBtns({ uid, author, elem })
    );
}

function buildPrevAndNextBtns({ uid, author, elem }) {
    const prevBtn = document.createElement("button"),
        nextBtn = document.createElement("button"),
        uidKeys = Object.keys(uids),
        index = uidKeys.indexOf(uid),
        prevIndex = index - 1 >= 0 ? index - 1 : uidKeys.length - 1,
        nextIndex = index + 1 < uidKeys.length ? index + 1 : 0;
    prevBtn.textContent = "< previous";
    nextBtn.textContent = "next >";
    setClickHandler({ elem: prevBtn, uid: uidKeys[prevIndex], author });
    setClickHandler({ elem: nextBtn, uid: uidKeys[nextIndex], author });
    elem.append(prevBtn, nextBtn);
}

function setClickHandler({ elem, uid, author }) {
    elem.onclick = () =>
        (window.location.href = `?uid=${uid}&author=${author}`);
}

export default getSutta;
export { getRandom };
