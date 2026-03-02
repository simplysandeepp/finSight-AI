import React from 'react';
import { BarChart3, Building2 } from 'lucide-react';

const roles = [
  {
    id: 'investor',
    title: 'I am an Investor',
    description: 'I want to analyze public companies and decide where to invest.',
    icon: BarChart3,
  },
  {
    id: 'org',
    title: 'I am a Private Organization',
    description: 'I want to analyze my own company performance and compare with competitors.',
    icon: Building2,
  },
];

const RoleSelectModal = ({ onSelect, isSaving = false, error = '' }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050608]/85 backdrop-blur-sm px-6">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-8 shadow-2xl shadow-black/40">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Role Selection</p>
        <h2 className="mt-2 text-3xl font-bold text-zinc-100">Choose your workspace</h2>
        <p className="mt-2 text-zinc-400">Select one option to continue.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              disabled={isSaving}
              className="text-left rounded-2xl border border-white/10 bg-[#0f1116]/80 p-6 transition-colors hover:border-blue-500/50 hover:bg-blue-500/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                <role.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">{role.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{role.description}</p>
            </button>
          ))}
        </div>

        {isSaving && <p className="mt-5 text-sm text-zinc-400">Saving your role...</p>}
      </div>
    </div>
  );
};

export default RoleSelectModal;
