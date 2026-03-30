type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  id: string;
  label: string;
  options: SelectOption[];
};

export function Select({ id, label, options }: SelectProps): string {
  return `
    <div class="flex flex-col gap-2">
      <label for="${id}" class="text-sm font-medium text-slate-700">
        ${label}
      </label>

      <select
        id="${id}"
        class="h-12 w-full rounded-2xl border border-[#e76e1d]/30 bg-white/90 px-4 text-slate-900 outline-none transition focus:border-[#e76e1d] focus:ring-4 focus:ring-[#e76e1d]/20"
      >
        ${options
          .map(
            (option) =>
              `<option value="${option.value}">${option.label}</option>`
          )
          .join("")}
      </select>
    </div>
  `;
}