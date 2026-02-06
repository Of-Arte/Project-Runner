import React, { useState } from 'react';
import { COLORS } from '../constants';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { validateUsername } from '../services/profanity';
import { registerUser, checkUsernameAvailability } from '../services/leaderboard';

interface UsernameInputProps {
  onSuccess: (username: string) => void;
  onCancel: () => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ onSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username format and profanity
    const validation = validateUsername(username);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }

    setIsLoading(true);

    try {
      // Get or create device ID
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('deviceId', deviceId);
      }

      // Check availability
      const available = await checkUsernameAvailability(username);
      if (!available) {
        setError('Username already taken');
        setIsLoading(false);
        return;
      }

      // Register user
      await registerUser(username, deviceId);

      // Save to localStorage
      localStorage.setItem('username', username);

      onSuccess(username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register username');
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <div 
        className="max-w-md w-full border-2 p-6 relative flex flex-col gap-4 shadow-[0_0_60px_rgba(34,211,238,0.4)]"
        style={{ borderColor: COLORS.NEON_CYAN, backgroundColor: '#050505' }}
      >
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500"></div>

        {/* Header */}
        <div className="text-center border-b border-cyan-500/20 pb-4">
          <UserPlus className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
          <h2 className="text-2xl font-black tracking-[0.2em] text-cyan-400 uppercase">
            Create Profile
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-2">
            Claim your username to join the corporate ladder
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 font-mono uppercase tracking-widest block mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full bg-gray-900/50 border border-cyan-500/30 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.3)] transition-all"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              3-12 characters, letters, numbers, underscore only
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-950/30 border border-red-500/50 p-3 rounded">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400 font-mono">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-4 uppercase tracking-widest text-sm transition-all"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black py-3 px-4 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  REGISTERING...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  CLAIM
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsernameInput;
