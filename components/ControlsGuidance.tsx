import React from 'react';
import { Fingerprint, Keyboard, ArrowDown, MousePointer2 } from 'lucide-react';
import { useDeviceType } from '../hooks/useDeviceType';

interface ControlsGuidanceProps {
  mode: 'overlay' | 'static';
}

const ControlsGuidance: React.FC<ControlsGuidanceProps> = ({ mode }) => {
  const { isMobile } = useDeviceType();

  if (mode === 'overlay') {
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
        <div className="flex gap-12 sm:gap-24 items-center justify-center">
            {/* JUMP HINT */}
            <div className="flex flex-col items-center gap-4 group">
                <div className="relative">
                    {/* Ring animation */}
                    <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping"></div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-cyan-400/30 bg-cyan-900/10 flex items-center justify-center backdrop-blur-sm">
                        {isMobile ? 
                            <MousePointer2 size={24} className="text-cyan-400 animate-pulse" /> : 
                            <div className="text-[10px] font-mono font-bold text-cyan-400 border border-cyan-400/50 px-2 py-0.5 rounded">SPACE</div>
                        }
                    </div>
                </div>
                <span className="text-[10px] sm:text-xs font-mono text-cyan-400 tracking-[0.3em] uppercase opacity-70">
                    {isMobile ? 'Tap' : 'Jump'}
                </span>
            </div>

            {/* DUCK HINT */}
            <div className="flex flex-col items-center gap-4 group">
                <div className="relative">
                    {/* Directional animation */}
                    <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                         <div className="w-0.5 h-4 bg-gradient-to-t from-yellow-400/0 via-yellow-400/50 to-yellow-400/0 animate-bounce"></div>
                    </div>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-yellow-400/30 bg-yellow-900/10 flex items-center justify-center backdrop-blur-sm">
                        {isMobile ? 
                            <ArrowDown size={24} className="text-yellow-400 animate-bounce" /> : 
                            <div className="text-[10px] font-mono font-bold text-yellow-400 border border-yellow-400/50 px-2 py-0.5 rounded">DOWN</div>
                        }
                    </div>
                </div>
                <span className="text-[10px] sm:text-xs font-mono text-yellow-400 tracking-[0.3em] uppercase opacity-70">
                    {isMobile ? 'Swipe' : 'Duck'}
                </span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4 py-2 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-900/40 border border-gray-800 rounded-sm group hover:border-cyan-500/30 transition-all">
            {isMobile ? <Fingerprint size={14} className="text-cyan-400/60" /> : <Keyboard size={14} className="text-cyan-400/60" />}
            <span className="text-[10px] font-mono text-gray-500 tracking-wider">
                {isMobile ? 'TAP TO' : 'SPACE / UP TO'} <span className="text-cyan-400/80 font-bold">JUMP</span>
            </span>
        </div>
        <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-900/40 border border-gray-800 rounded-sm group hover:border-yellow-500/30 transition-all">
            {isMobile ? <ArrowDown size={14} className="text-yellow-400/60" /> : <ArrowDown size={14} className="text-yellow-400/60" />}
            <span className="text-[10px] font-mono text-gray-500 tracking-wider">
                {isMobile ? 'SWIPE TO' : 'DOWN TO'} <span className="text-yellow-400/80 font-bold">DUCK</span>
            </span>
        </div>
    </div>
  );
};

export default ControlsGuidance;
