import AppShell from "../layouts/AppShell";

type Props = {
  title: string;
  description?: string;
};

export default function Placeholder({ title, description }: Props) {
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto text-center space-y-2">
        <h1 className="text-2xl font-bold text-[#3f3a64]">{title}</h1>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
    </AppShell>
  );
}
