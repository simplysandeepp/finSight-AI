import React from 'react';

const AuditModal = ({ open, result, onClose }) => {
  if (!open || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#101217] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Audit JSON</h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">{result.trace_id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">x</button>
        </div>
        <div className="p-5 overflow-auto">
          <pre className="text-xs text-cyan-300 whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default AuditModal;
