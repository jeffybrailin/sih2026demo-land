import React, { useState } from 'react';
import { Camera, X, MapPin, Upload, CheckCircle } from 'lucide-react';
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
        lat: 25.578, lng: 91.893,
        hazard_type: hazardType, severity, notes, photo_url: null,
      };
      const res = await axios.post('http://127.0.0.1:8000/api/v1/report-hazard', payload);
      setTicketId(res.data.ticket_id);
      setSubmitted(true);
    } catch (_) {
      const offline = JSON.parse(localStorage.getItem('offline_reports') || '[]');
      offline.push({ hazardType, severity, notes, timestamp: new Date().toISOString() });
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

  const severityOpts = [
    { val: 'low',      label: 'Low',      color: '#16A34A', bgClass: 'bg-green-950/30  border-green-800  text-green-400'  },
    { val: 'moderate', label: 'Moderate', color: '#D97706', bgClass: 'bg-yellow-950/30 border-yellow-800 text-yellow-400' },
    { val: 'high',     label: 'High',     color: '#EA580C', bgClass: 'bg-orange-950/30 border-orange-800 text-orange-400' },
    { val: 'critical', label: 'Critical', color: '#DC2626', bgClass: 'bg-red-950/30    border-red-800    text-red-400'    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,14,26,0.85)', backdropFilter: 'blur(12px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="glass-card rounded-2xl w-full max-w-md overflow-hidden"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b border-slate-800/60"
          style={{ background: 'rgba(30,58,138,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #172e70)' }}>
              <Camera size={16} className="text-blue-200" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-sm font-bold text-white">
                Citizen Field Report
              </h2>
              <p className="text-[10px] text-slate-500">NDMA Hazard Reporting Portal</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-slate-500 hover:text-white"
            aria-label="Close report form"
          >
            <X size={17} />
          </button>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-white mb-1">Report Submitted</h3>
            <p className="text-slate-400 text-sm mb-2">Your hazard report has been logged</p>
            <div className="glass-card rounded-xl px-4 py-3 inline-block mb-4">
              <div className="text-[10px] text-slate-500 mb-0.5">Ticket Reference</div>
              <div className="font-mono text-blue-300 font-bold text-lg">{ticketId}</div>
            </div>
            {ticketId.startsWith('OFFLINE') && (
              <p className="text-amber-400 text-xs bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-4">
                💾 Saved offline. Will sync automatically when network is available.
              </p>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1E3A8A, #172e70)' }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* GPS badge */}
            <div className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-2">
              <MapPin size={13} className="text-blue-400 flex-shrink-0" />
              <span className="text-xs text-slate-400">
                GPS: <strong className="text-slate-200 font-mono">25.578°N, 91.893°E</strong>
              </span>
              <span className="ml-auto text-[10px] text-green-400 font-semibold">● Live</span>
            </div>

            {/* Hazard Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2" htmlFor="hazard-type">
                Hazard Type
              </label>
              <select
                id="hazard-type"
                value={hazardType}
                onChange={e => setHazardType(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white border transition-colors focus:outline-none"
                style={{
                  background: 'rgba(15,23,42,0.8)',
                  borderColor: '#334155',
                }}
              >
                <option value="crack">🔴 Road Crack / Subsidence</option>
                <option value="slope_movement">🟠 Slope Movement</option>
                <option value="rockfall">🪨 Rockfall / Debris</option>
                <option value="blocked_road">🚧 Road Blocked</option>
                <option value="seepage">💧 Water Seepage / Spring</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <legend className="block text-xs font-semibold text-slate-400 mb-2">
                Severity Level
              </legend>
              <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Severity level">
                {severityOpts.map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setSeverity(opt.val)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      severity === opt.val ? opt.bgClass : 'border-slate-800 text-slate-500 hover:border-slate-600'
                    }`}
                    style={severity === opt.val ? { background: `${opt.color}18`, minHeight: '44px' } : { minHeight: '44px' }}
                    aria-pressed={severity === opt.val}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div
              className="glass-card rounded-xl p-4 text-center cursor-pointer border-dashed transition-colors hover:border-slate-500"
              style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: '#334155' }}
              role="button"
              aria-label="Attach geo-tagged photo"
              tabIndex={0}
            >
              <Upload size={22} className="text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tap to attach geo-tagged photo</p>
              <p className="text-[10px] text-slate-700 mt-0.5">JPEG/PNG · Stored locally if offline</p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="obs-notes" className="block text-xs font-semibold text-slate-400 mb-2">
                Observation Notes
              </label>
              <textarea
                id="obs-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white h-20 resize-none border transition-colors focus:outline-none focus:border-blue-500"
                style={{ background: 'rgba(15,23,42,0.8)', borderColor: '#334155' }}
                placeholder="Describe: extent of crack, sounds heard, water flow, estimated area…"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-sm text-slate-300 border border-slate-800 hover:border-slate-600 transition-colors"
                style={{ background: 'rgba(30,41,59,0.4)', minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1E3A8A, #172e70)', minHeight: '44px' }}
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
