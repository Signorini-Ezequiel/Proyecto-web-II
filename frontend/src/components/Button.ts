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
      "bg-[#e76e1d] text-white shadow-lg shadow-[#e76e1d]/30 hover:bg-[#c05511]",
    secondary:
      "border border-[#e76e1d] bg-white text-[#0f172a] hover:bg-[#fff1e6]",
    ghost: "bg-transparent text-[#0f172a] hover:bg-[#fff4eb]",
    danger:
      "border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20",
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