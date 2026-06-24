export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-accent" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
