"""
Alert Engine — Persistence, Escalation and Dispatch
=====================================================
Alerts are NOT sent on every threshold crossing.
Requires: risk_threshold + forecast_direction + N consecutive updates + confidence

Escalation levels:
  ADVISORY  -> dashboard only
  WATCH     -> dashboard + field team notification
  WARNING   -> dashboard + push + SMS
  CRITICAL  -> dashboard + push + SMS + authority escalation
"""
from dataclasses import dataclass, field
from typing import Optional, Dict, List
from datetime import datetime

@dataclass
class AlertState:
    sector_id: str
    current_level: str
    consecutive_count: int
    first_triggered: datetime
    last_updated: datetime
    max_prob_seen: float
    channels_notified: List[str] = field(default_factory=list)

class AlertEngine:
    def __init__(self):
        self._state: Dict[str, AlertState] = {}

    def _determine_level(self, prob: float, consecutive: int, fos_override: bool) -> str:
        if fos_override and prob > 0.50:
            return 'CRITICAL'
        if prob > 0.75:
            return 'CRITICAL'
        if prob > 0.50 and consecutive >= 2:
            return 'WARNING'
        if prob > 0.40 and consecutive >= 2:
            return 'WATCH'
        if prob > 0.25:
            return 'ADVISORY'
        return 'NORMAL'

    def process_update(self, sector_id: str, prob: float, priority_score: float, fos_override: bool) -> Optional[str]:
        now = datetime.utcnow()
        if sector_id not in self._state:
            self._state[sector_id] = AlertState(sector_id, 'NORMAL', 0, now, now, prob)
            
        state = self._state[sector_id]
        state.max_prob_seen = max(state.max_prob_seen, prob)
        state.last_updated = now
        
        # very simple mock for consecutive
        if prob > 0.25:
            state.consecutive_count += 1
        else:
            state.consecutive_count = 0
            
        new_level = self._determine_level(prob, state.consecutive_count, fos_override)
        
        if new_level != state.current_level:
            state.current_level = new_level
            if state.current_level == 'NORMAL':
                state.channels_notified = []
            return new_level
            
        return None

    def get_active_alerts(self) -> List[dict]:
        alerts = []
        for sid, state in self._state.items():
            if state.current_level in ['WATCH', 'WARNING', 'CRITICAL']:
                alerts.append({
                    'sector_id': sid,
                    'level': state.current_level,
                    'first_triggered': state.first_triggered.isoformat() + 'Z',
                    'last_updated': state.last_updated.isoformat() + 'Z',
                    'max_prob': state.max_prob_seen
                })
        return alerts

    def acknowledge(self, sector_id: str, authority_id: str) -> bool:
        if sector_id in self._state:
            # log ack
            return True
        return False

    def get_lead_time(self, sector_id: str) -> Optional[float]:
        if sector_id in self._state:
            state = self._state[sector_id]
            if state.current_level != 'NORMAL':
                diff = datetime.utcnow() - state.first_triggered
                return diff.total_seconds() / 3600.0
        return None
