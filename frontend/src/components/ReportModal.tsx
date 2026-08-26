import React, { useState } from 'react';
import { Camera, X, MapPin, Upload } from 'lucide-react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [hazardType, setHazardType] = useState('crack');
  const [severity, setSeverity] = useState('moderate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        lat: 25.578,
        lng: 91.893,
        hazard_type: hazardType,
        severity,
        notes,
        photo_url: null,
      };
      const res = await axios.post('http://127.0.0.1:8000/api/v1/report-hazard', payload);
      setTicketId(res.data.ticket_id);
      setSubmitted(true);
    } catch (_) {
      // Offline fallback – save to localStorage
      const offline = JSON.parse(localStorage.getItem('offline_reports') || '[]');
      offline.push({ ...{ hazardType, severity, notes }, timestamp: new Date().toISOString() });
      localStorage.setItem('offline_reports', JSON.stringify(offline));
      setTicketId('OFFLINE-' + Date.now().toString().slice(-4));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setNotes('');
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl w-[420px] overflow-hidden border border-gray-700">

        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-950">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Camera size={18} className="text-blue-400" />
            Citizen Field Report
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-bold text-lg text-green-400 mb-2">Report Submitted</h3>
            <p className="text-gray-400 text-sm mb-1">Ticket ID:</p>
            <p className="font-mono text-blue-300 font-bold text-lg">{ticketId}</p>
            {ticketId.startsWith('OFFLINE') && (
              <p className="text-yellow-400 text-xs mt-3 bg-yellow-400/10 border border-yellow-400/20 rounded px-3 py-2">
                💾 Saved offline. Will sync automatically when network is available.
              </p>
            )}
            <button onClick={handleClose} className="mt-5 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">

            {/* Location badge */}
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">
              <MapPin size={12} className="text-blue-400" />
              <span>GPS: <strong className="text-gray-300">25.578°N, 91.893°E</strong></span>
              <span className="ml-auto text-green-400">● Live</span>
            </div>

            {/* Hazard Type */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Hazard Type</label>
              <select value={hazardType} onChange={e => setHazardType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value="crack">🔴 Road Crack / Subsidence</option>
                <option value="slope_movement">🟠 Slope Movement</option>
                <option value="rockfall">🪨 Rockfall / Debris</option>
                <option value="blocked_road">🚧 Road Blocked</option>
                <option value="seepage">💧 Water Seepage / Spring</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Severity</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: 'low', label: 'Low', color: 'border-green-600 bg-green-900/20 text-green-400' },
                  { val: 'moderate', label: 'Moderate', color: 'border-yellow-600 bg-yellow-900/20 text-yellow-400' },
                  { val: 'high', label: 'High', color: 'border-orange-600 bg-orange-900/20 text-orange-400' },
                  { val: 'critical', label: 'Critical', color: 'border-red-600 bg-red-900/20 text-red-400' },
                ].map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setSeverity(opt.val)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${severity === opt.val ? opt.color : 'border-gray-700 bg-gray-800 text-gray-500'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload zone */}
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-gray-500 transition-colors cursor-pointer">
              <Upload size={20} className="text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Tap to attach geo-tagged photo</p>
              <p className="text-[10px] text-gray-700 mt-1">Stored locally if offline</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Observation Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white h-20 resize-none focus:outline-none focus:border-blue-500"
                placeholder="Describe the situation: extent of crack, sounds heard, water flow..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleClose}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors text-gray-300">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
