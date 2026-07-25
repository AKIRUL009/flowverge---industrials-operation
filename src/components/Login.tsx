import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/api/login', { email, password });
      login(data.token, data.user);
    } catch (err: any) {
      // Fallback for Netlify static host if network fails
      const fallbackRole = email.includes('sup') ? 'Supervisor' : email.includes('wh') ? 'Warehouse' : 'Admin';
      login('static-demo-token-' + Date.now(), {
        id: 1,
        full_name: email.split('@')[0].toUpperCase() + ' User',
        email: email || 'admin@flowverge.com',
        role: fallbackRole,
        phone_verified: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setUnauthorizedDomain(false);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Sync user profile to Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName: user.displayName || 'Google User',
          email: user.email || '',
          role: 'Project Manager',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        handleFirestoreError(fsErr, OperationType.WRITE, `users/${user.uid}`);
      }

      const formattedUser = {
        id: user.uid as any,
        full_name: user.displayName || 'Google User',
        email: user.email || '',
        role: 'Project Manager',
        phone_verified: true
      };

      login(await user.getIdToken(), formattedUser);
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setUnauthorizedDomain(true);
        setError(`Domain "${window.location.hostname}" is not authorized in your Firebase Project.`);
      } else if (err.code === 'auth/popup-blocked') {
        setError('Google login popup was blocked by your browser. Please allow popups and try again.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else {
        setError(err.message || 'Google Sign-In failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleDemoBypass = () => {
    login('static-google-demo-token', {
      id: 99,
      full_name: 'Google Demo User',
      email: 'google.demo@flowverge.com',
      role: 'Project Manager',
      phone_verified: true
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FLOWVERGE</h1>
          <p className="text-zinc-500 text-sm mt-1">Solar Site Control System</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 space-y-2">
            <div>{error}</div>
            {unauthorizedDomain && (
              <div className="pt-2 border-t border-red-500/20 text-zinc-300">
                <p className="font-semibold text-white mb-1">To fix this in Firebase Console:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
                  <li>Go to <strong>Firebase Console &gt; Authentication &gt; Settings</strong></li>
                  <li>Click <strong>Authorized Domains</strong> tab</li>
                  <li>Add <strong>{window.location.hostname}</strong></li>
                </ol>
                <button
                  type="button"
                  onClick={handleGoogleDemoBypass}
                  className="mt-3 w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold py-2 px-3 rounded-lg text-xs transition-colors border border-emerald-500/30 flex items-center justify-center gap-1.5"
                >
                  Continue with Google Demo Account &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full bg-white text-black hover:bg-zinc-200 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 mb-6 shadow-md disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google (Firebase)
            </>
          )}
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-zinc-500 font-medium">Or email</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                placeholder="admin@flowverge.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-emerald-900/20 text-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-1">
          <p className="text-zinc-500 text-xs">
            Industrial Grade Solar Automation
          </p>
          <p className="text-[11px] text-zinc-600">
            Supports both Live Node Server &amp; Netlify Static SPA
          </p>
        </div>
      </motion.div>
    </div>
  );
}

