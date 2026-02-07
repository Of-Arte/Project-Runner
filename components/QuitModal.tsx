import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface QuitModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const QuitModal: React.FC<QuitModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md p-6 mx-4 bg-gray-900 border-2 border-red-500/50 rounded-lg shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden">
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 text-red-500">
            <AlertTriangle className="animate-pulse" size={24} />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Leaving So Soon?</h2>
          </div>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-300 text-sm leading-relaxed">
              Hey, we get it—sometimes you need a break from the grind. But if you leave now, you'll lose all your progress from this run.
              <br />
              <span className="text-red-400 font-bold">Your current score won't be saved.</span>
            </p>
            
            <div className="p-3 bg-black/40 border border-gray-800 rounded text-[11px] text-gray-400 italic">
              "The only way out is through... or the quit button, I guess."
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-700 hover:border-white text-gray-400 hover:text-white transition-all uppercase font-black text-xs tracking-widest group"
            >
              <X size={14} className="group-hover:rotate-90 transition-transform" /> Keep Playing
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white transition-all uppercase font-black text-xs tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            >
              <Check size={14} /> Quit to Menu
            </button>
          </div>
        </div>
        
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500/20"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500/20"></div>
      </div>
    </div>
  );
};

export default QuitModal;
