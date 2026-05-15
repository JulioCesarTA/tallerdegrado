import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}>;

export function SectionCard({ title, description, actions, children }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
