'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[client] Dashboard error boundary:', error);
  return (
    <div className="space-y-3">
      <h2 className="text-red-600 font-semibold">Dashboard crashed</h2>
      <pre className="whitespace-pre-wrap text-sm">{String(error)}</pre>
      <button className="btn" onClick={() => reset()}>Try again</button>
    </div>
  );
}
