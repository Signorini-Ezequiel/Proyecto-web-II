type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

export function StatCard({
  title,
  value,
  subtitle = "",
}: StatCardProps): string {
  return `
    <div class="rounded-3xl border border-[#e76e1d]/30 bg-white/90 p-5">
      <p class="text-sm font-medium text-slate-600">${title}</p>
      <p class="mt-3 text-3xl font-bold tracking-tight text-[#0f172a]">${value}</p>
      ${
        subtitle
          ? `<p class="mt-2 text-sm leading-5 text-slate-600">${subtitle}</p>`
          : ""
      }
    </div>
  `;
}