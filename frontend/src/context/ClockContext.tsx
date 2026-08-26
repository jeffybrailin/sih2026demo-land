import React, { createContext, useContext, useEffect, useState } from 'react';

interface ClockContextType {
  now: Date;
  isoString: string;
  timeString: string;
  dateString: string;
}

const ClockContext = createContext<ClockContextType>({
  now: new Date(),
  isoString: new Date().toISOString(),
  timeString: '',
  dateString: '',
});

export const ClockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Tick every second — real live clock
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const value: ClockContextType = {
    now,
    isoString: now.toISOString(),
    timeString: now.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }),
    dateString: now.toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    }),
  };

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
};

export const useClock = () => useContext(ClockContext);
