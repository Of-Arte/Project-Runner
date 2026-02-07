import React, { useState } from 'react';
import { COLORS } from '../constants';
import { Fingerprint, UserPlus, LogIn, AlertCircle, Loader2, X } from 'lucide-react';
import { validateUsername } from '../services/profanity';
import { login, signUp } from '../services/auth';
import { checkUsernameAvailability } from '../services/leaderboard';

interface AuthModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onSuccess, onCancel }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'REGISTER') {
        // Validation
        const validation = validateUsername(username);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid username');
        }
        
        // Check availability
        const available = await checkUsernameAvailability(username);
        if (!available) {
          throw new Error('Username already taken');
        }

        await signUp(email, password, username);
      } else {
        await login(email, password);
      }
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Authentication failed';
      if (msg.includes('auth/email-already-in-use')) msg = 'Email already registered';
      if (msg.includes('auth/user-not-found')) msg = 'Account not found';
      if (msg.includes('auth/wrong-password')) msg = 'Invalid credentials';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div 
        className="max-w-md w-full border-2 p-1 relative flex flex-col shadow-[0_0_60px_rgba(34,211,238,0.2)]"
        style={{ borderColor: COLORS.NEON_CYAN, backgroundColor: '#050505' }}
      >
        {/* Decorative Corners */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-500"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-500"></div>

        {/* Content Container */}
        <div className="p-5 sm:p-7 relative overflow-hidden">
           {/* Close Button */}
           <button 
              onClick={onCancel}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black tracking-[0.2em] text-white uppercase glitch-text">
              {mode === 'LOGIN' ? 'Resume Session' : 'Sign Up'}
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 border-b border-gray-800">
            <button
              onClick={() => setMode('LOGIN')}
              className={`flex-1 pb-2 text-xs font-mono tracking-widest uppercase transition-colors ${
                mode === 'LOGIN' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('REGISTER')}
              className={`flex-1 pb-2 text-xs font-mono tracking-widest uppercase transition-colors ${
                mode === 'REGISTER' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'REGISTER' && (
              <div>
                 <label className="text-[10px] text-cyan-500/80 font-mono uppercase tracking-widest block mb-1">
                  Runner Alias
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ENTER ALIAS..."
                  className="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-400 focus:bg-cyan-950/10 transition-all placeholder:text-gray-700"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-cyan-500/80 font-mono uppercase tracking-widest block mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="USER@CORP.NET"
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-400 focus:bg-cyan-950/10 transition-all placeholder:text-gray-700"
                required
              />
            </div>

            <div>
              <label className="text-[10px] text-cyan-500/80 font-mono uppercase tracking-widest block mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-900/50 border border-gray-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-400 focus:bg-cyan-950/10 transition-all placeholder:text-gray-700"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-950/30 border border-red-500/30 p-3 mt-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-400 font-mono uppercase">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-4 px-4 flex items-center justify-center gap-2 transition-all uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  {mode === 'LOGIN' ? <LogIn size={16} /> : <UserPlus size={16} />}
                  {mode === 'LOGIN' ? 'ACCESS SYSTEM' : 'CREATE PROFILE'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
