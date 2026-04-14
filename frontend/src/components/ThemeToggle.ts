type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({
  className = "",
  showLabel = true,
}: ThemeToggleProps = {}): string {
  return `
    <button
      type="button"
      data-theme-toggle
      class="theme-toggle inline-flex h-10 w-10 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 text-sm font-semibold text-slate-700 transition hover:bg-white ${className}"
      aria-label="Cambiar tema"
      aria-pressed="false"
    >
      <span data-theme-icon class="text-base leading-none">☾</span>
      ${showLabel ? `<span data-theme-label>Oscuro</span>` : ""}
    </button>
  `;
}
