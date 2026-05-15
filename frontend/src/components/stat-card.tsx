type Props = {
  label: string;
  value: string | number;
  hint: string;
};

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  );
}
