export function applyTheme(theme) {
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else if (theme === "light") {
    document.body.classList.remove("dark-mode");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.body.classList.toggle("dark-mode", prefersDark);
  }
}

export function getTheme() {
  return localStorage.getItem("theme") || "auto";
}

export function applyFontSize(size) {
  localStorage.setItem("fontSize", size);
  document.documentElement.style.fontSize = size + "%";
}

export function getFontSize() {
  return Number(localStorage.getItem("fontSize")) || 100;
}

export function applyBold(isBold) {
  localStorage.setItem("bold", isBold);
  document.body.classList.toggle("bold-text", isBold === "true");
}

export function loadPreferences() {
  applyTheme(getTheme());
  applyFontSize(getFontSize());
  applyBold(localStorage.getItem("bold") || "false");
}
