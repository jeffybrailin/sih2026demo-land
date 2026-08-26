import React from 'react';
import { useClock } from '../context/ClockContext';

export const LiveClock: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { timeString, dateString } = useClock();
  return (
    <div className={`flex flex-col items-end ${className}`}>
      <div className="font-mono text-lg font-bold text-white tracking-widest leading-none">
        {timeString}
      </div>
      <div className="text-[10px] text-gray-500 tracking-wide mt-0.5">{dateString} IST</div>
    </div>
  );
};
