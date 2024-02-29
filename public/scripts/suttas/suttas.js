import buildSelects from "./selects.js";
import getSutta, { getRandom } from "./get-sutta.js";
import uids from "../uids.js";

buildSelects();
getSutta();

const randomLink = document.querySelector("#random"),
    randomUid = getRandom(Object.keys(uids)),
    randomAuthor = getRandom(uids[randomUid]);
randomLink.href = `?uid=${randomUid}&author=${randomAuthor}`;
