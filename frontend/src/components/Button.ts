type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  id?: string;
  text: string;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  fullWidth?: boolean;
};

export function Button({
  id = "",
  text,
  variant = "primary",
  type = "button",
  fullWidth = false,
}: ButtonProps): string {
  const baseClasses =
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

  const widthClass = fullWidth ? "w-full" : "";

  const variantClassesByType: Record<ButtonVariant, string> = {
    primary:
      "bg-sky-500 text-white shadow-lg shadow-sky-950/30 hover:bg-sky-400",
    secondary:
      "border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700",
    ghost: "bg-transparent text-slate-200 hover:bg-slate-800/70",
    danger:
      "border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
  };

  return `
    <button
      ${id ? `id="${id}"` : ""}
      type="${type}"
      class="${baseClasses} ${widthClass} ${variantClassesByType[variant]}"
    >
      ${text}
    </button>
  `;
}