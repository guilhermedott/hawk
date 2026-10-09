export function FormAlert({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <div role="alert" className="rounded-lg border border-hawk-danger/50 bg-hawk-danger/10 p-3 text-sm text-hawk-danger">
      {messages.map((m) => <p key={m}>{m}</p>)}
    </div>
  );
}