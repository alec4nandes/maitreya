const toggleBtns = [...document.querySelectorAll("button.toggle-menu")];
toggleBtns.forEach((btn) => (btn.onclick = handleToggleMenu));

function handleToggleMenu() {
    const menu = document.querySelector("header#menu"),
        isClosed = menu.classList.contains("closed");
    menu.classList[isClosed ? "remove" : "add"]("closed");
}
