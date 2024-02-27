const toggleBtns = [...document.querySelectorAll("button.toggle-menu")];
toggleBtns.forEach((btn) => (btn.onclick = handleToggleMenu));

function handleToggleMenu() {
    const header = document.querySelector("header"),
        isClosed = header.classList.contains("closed");
    header.classList[isClosed ? "remove" : "add"]("closed");
}
