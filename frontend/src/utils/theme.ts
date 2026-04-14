export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "autopoint-theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): Theme | null {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(storedTheme) ? storedTheme : null;
}

export function getPreferredTheme(): Theme {
  const storedTheme = getStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  syncThemeToggleButtons();
}

export function getCurrentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function toggleTheme(): void {
  setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
}

export function initializeTheme(): void {
  applyTheme(getPreferredTheme());
}

export function syncThemeToggleButtons(): void {
  const theme = getCurrentTheme();
  const isDark = theme === "dark";

  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute(
      "aria-label",
      isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
    );

    const icon = button.querySelector("[data-theme-icon]");
    const label = button.querySelector("[data-theme-label]");

    if (icon) {
      icon.textContent = isDark ? "☀" : "☾";
    }

    if (label) {
      label.textContent = isDark ? "Claro" : "Oscuro";
    }
  });
}

export function bindThemeToggleButtons(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
    if (button.dataset.themeToggleBound === "true") {
      return;
    }

    button.dataset.themeToggleBound = "true";
    button.addEventListener("click", toggleTheme);
  });

  syncThemeToggleButtons();
}
