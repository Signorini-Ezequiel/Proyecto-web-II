type CardProps = {
  children: string;
  className?: string;
};

export function Card({ children, className = "" }: CardProps): string {
  return `
    <section class="rounded-3xl card-surface p-6 shadow-2xl shadow-slate-200/60 backdrop-blur-sm ${className}">
      ${children}
    </section>
  `;
}