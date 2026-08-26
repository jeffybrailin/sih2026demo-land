import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapComponent } from './components/MapComponent';
import { ReportModal } from './components/ReportModal';
import { useStore } from './store/useStore';
import { Camera } from 'lucide-react';

function App() {
  const { fetchData } = useStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetchData();
    
    // Poll every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 relative">
        {/* Map Layer */}
        <MapComponent />
        
        {/* Top Header Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-10">
          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-lg p-3 shadow-lg pointer-events-auto flex items-center gap-4">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">System Status</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="font-medium text-white">Live Monitoring</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-700"></div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Last Sync</div>
              <div className="font-medium text-white">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 shadow-lg pointer-events-auto flex items-center gap-2 font-medium transition-colors border border-blue-500"
          >
            <Camera size={18} />
            Field Report
          </button>
        </div>

      </main>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}

export default App;
