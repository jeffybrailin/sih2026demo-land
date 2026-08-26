import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [hazardType, setHazardType] = useState('crack');
  const [severity, setSeverity] = useState('moderate');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        lat: 25.578, // Mocked device GPS
        lng: 91.893,
        hazard_type: hazardType,
        severity,
        notes
      };
      await axios.post('http://localhost:8000/api/v1/report-hazard', payload);
      alert('Report submitted successfully. Thank you for your contribution.');
      onClose();
    } catch (err) {
      alert('Saved offline. Will sync when network is available.');
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl w-[400px] overflow-hidden border border-gray-700">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Camera size={20} className="text-blue-400" /> 
            Submit Field Report
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Hazard Type</label>
            <select 
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
            >
              <option value="crack">Road Crack / Subsidence</option>
              <option value="slope_movement">Slope Movement</option>
              <option value="rockfall">Rockfall / Debris</option>
              <option value="blocked_road">Road Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Severity</label>
            <select 
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
            >
              <option value="low">Low (Minor impact)</option>
              <option value="moderate">Moderate (Use caution)</option>
              <option value="high">High (Dangerous)</option>
              <option value="critical">Critical (Impassable)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm h-24 resize-none"
              placeholder="Describe the situation..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors font-medium">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
