import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL;

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const response = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();

    if (!response.ok) {
      setMessage(body?.detail || 'Auth failed');
      return;
    }

    localStorage.setItem('auth_token', body.token);
    setMessage(`Authenticated as ${body.user.email} (${body.user.role})`);
  };

  return (
    <div className="max-w-md mx-auto bg-[#121520] border border-white/10 rounded-2xl p-6">
      <h1 className="text-2xl font-bold mb-4">Authentication</h1>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('login')} className={`px-3 py-2 rounded-lg ${mode === 'login' ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>Login</button>
        <button onClick={() => setMode('signup')} className={`px-3 py-2 rounded-lg ${mode === 'signup' ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>Sign Up</button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full px-4 py-3 rounded-lg bg-[#0b0e16] border border-white/10" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white">{mode === 'login' ? 'Login' : 'Create Account'}</button>
      </form>

      {message && <p className="text-sm mt-3 text-zinc-300">{message}</p>}
    </div>
  );
};

export default AuthPage;
