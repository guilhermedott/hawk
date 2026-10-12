'use client';

import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react';

export function DataPageState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  if (loading) {
    return (
      <div className="page-state" role="status">
        <LoaderCircle size={18} className="spin-icon" /> Carregando dados...
      </div>
    );
  }
  if (!error) return null;
  return (
    <div className="page-state page-state-error" role="alert">
      <AlertCircle size={17} />
      <span>{error}</span>
      <button className="text-action" onClick={retry}><RefreshCw size={14} /> Tentar novamente</button>
    </div>
  );
}
