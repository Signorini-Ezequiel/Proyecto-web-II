type CardProps = {
  children: string;
  className?: string;
};

export function Card({ children, className = "" }: CardProps): string {
  return `
    <section class="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm ${className}">
      ${children}
    </section>
  `;
}