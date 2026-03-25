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
    <div class="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <p class="text-sm font-medium text-slate-400">${title}</p>
      <p class="mt-3 text-3xl font-bold tracking-tight text-white">${value}</p>
      ${
        subtitle
          ? `<p class="mt-2 text-sm leading-5 text-slate-400">${subtitle}</p>`
          : ""
      }
    </div>
  `;
}