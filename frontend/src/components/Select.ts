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
      <label for="${id}" class="text-sm font-medium text-slate-200">
        ${label}
      </label>

      <select
        id="${id}"
        class="h-12 w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 text-slate-100 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
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