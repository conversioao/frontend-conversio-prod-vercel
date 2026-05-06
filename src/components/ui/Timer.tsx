import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  isActive: boolean;
}

export function Timer({ isActive }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((seconds) => seconds + 1);
      }, 1000);
    } else {
      setSeconds(0);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  if (!isActive) return null;

  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-full animate-in fade-in zoom-in duration-300">
      <Clock size={14} className="text-[#FFB800] animate-pulse" />
      <span className="text-[10px] font-black text-[#FFB800] tabular-nums tracking-widest uppercase">
        Tempo de Espera: {formatTime(seconds)}
      </span>
    </div>
  );
}
