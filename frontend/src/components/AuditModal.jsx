import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const AuditModal = ({ open, result, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!open || !result) return null;

  const handleCopyLogs = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#101217] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Audit JSON</h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">{result.trace_id}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Logs</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">x</button>
          </div>
        </div>
        <div className="p-5 overflow-auto">
          <pre className="text-xs text-cyan-300 whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default AuditModal;
