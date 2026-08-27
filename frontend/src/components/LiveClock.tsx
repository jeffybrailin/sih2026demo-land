import React from 'react';
import { useClock } from '../context/ClockContext';

interface Props {
  compact?: boolean;
  className?: string;
}

export const LiveClock: React.FC<Props> = ({ compact = false, className = '' }) => {
  const { timeString, dateString } = useClock();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="font-mono text-sm font-bold text-white tracking-widest leading-none">
          {timeString}
        </div>
        <div className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider">IST</div>
        <div className="text-[9px] text-slate-500">{dateString}</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <div className="font-mono text-lg font-bold text-white tracking-widest leading-none">
        {timeString}{' '}
        <span className="text-[11px] font-semibold text-blue-400">IST</span>
      </div>
      <div className="text-[10px] text-slate-500 tracking-wide mt-0.5">{dateString}</div>
    </div>
  );
};
