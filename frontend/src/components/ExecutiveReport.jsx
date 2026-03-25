import React from 'react';
import { FileText } from 'lucide-react';

const ExecutiveReport = ({ onDownload, disabled }) => (
  <button
    onClick={onDownload}
    disabled={disabled}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
  >
    <FileText className="w-4 h-4" />
    Download Executive Report
  </button>
);

export default ExecutiveReport;
