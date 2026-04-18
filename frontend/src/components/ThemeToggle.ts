type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps = {}): string {
  return `
    <button
      type="button"
      data-theme-toggle
      class="theme-toggle inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 transition hover:bg-white ${className}"
    >
      <span data-theme-icon class="text-base leading-none">☾</span>
      ${showLabel ? `<span data-theme-label>Oscuro</span>` : ""}
    </button>
  `;
}
