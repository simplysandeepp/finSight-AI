import React from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({ theme, onToggle }) => (
  <button
    onClick={onToggle}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
  >
    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    {theme === 'dark' ? 'Light' : 'Dark'}
  </button>
);

export default ThemeToggle;
