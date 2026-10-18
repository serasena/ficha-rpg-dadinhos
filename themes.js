/* ୨୧ Theme Selection Panel */
const openThemeBtn = document.getElementById("open-theme-btn");
const closeThemeBtn = document.getElementById("close-theme-btn");
const themePanel = document.getElementById("theme-panel");

/* Open Panel */

openThemeBtn.addEventListener("click", () => {
    themePanel.classList.remove("hidden");
});

/* Close Panel */

closeThemeBtn.addEventListener("click", () => {
    themePanel.classList.add("hidden");
});

/* ୨୧ Theme Switching */

const activeTheme = document.getElementById("active-theme");
const themeButtons = document.querySelectorAll(".theme-options button");

themeButtons.forEach(button => {
    button.addEventListener("click", () => {
        const selectedTheme = button.dataset.theme;

        activeTheme.href = `themes/theme-${selectedTheme}.css`;

        themePanel.classList.add("hidden");
    });
});