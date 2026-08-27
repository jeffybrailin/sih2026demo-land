"""
Multilingual Notification Service
====================================
Channels: Dashboard · Push/App · SMS
Languages: English (en) · Hindi (hi) · Assamese (as) — MVP

Provider abstraction:
  - demo mode: logs message, simulates delivery
  - SMS: Fast2SMS / Twilio (plug in API key)
  - Push: FCM (placeholder)

Citizen-facing messages use plain language.
NO ML terminology (no 'XGBoost', 'probability', 'SHAP').
"""
from datetime import datetime

class NotificationService:
    def __init__(self, mode='demo'):
        self.mode = mode
        self.delivery_log = []

    def send_alert(self, sector_name: str, level: str, road_name: str, lang: str = 'en', recipients: list = []) -> dict:
        msg = self._format_message(level, lang, location=sector_name, road=road_name)
        if not msg:
            return {'status': 'failed', 'reason': 'Unknown level/lang'}
            
        record = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'type': 'CITIZEN_ALERT',
            'level': level,
            'message': msg,
            'recipients_count': len(recipients),
            'mode': self.mode
        }
        
        if self.mode == 'demo':
            self._send_sms_demo(msg, recipients)
            self._send_push_demo(msg, recipients)
            
        self.delivery_log.append(record)
        return record

    def send_to_authority(self, sector_id, priority_rank, hazard_score, details) -> dict:
        msg = f"AUTHORITY DISPATCH: Sector {sector_id} ranked #{priority_rank} for hazard. Prob={hazard_score:.2f}. Details: {details}"
        record = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'type': 'AUTHORITY_ESCALATION',
            'message': msg,
            'mode': self.mode
        }
        self.delivery_log.append(record)
        return record

    def _format_message(self, level, lang, **kwargs):
        # We'll import templates here to avoid circular imports if any
        try:
            from .message_templates import format_alert
            return format_alert(level, lang, kwargs.get('location', ''), kwargs.get('road', ''))
        except ImportError:
            return f"{level} Alert for {kwargs.get('location')}"

    def _send_sms_demo(self, message, recipients):
        print(f"[DEMO SMS] To {len(recipients)} recipients: {message}")
        return {'status': 'delivered'}

    def _send_push_demo(self, message, recipients):
        print(f"[DEMO PUSH] To {len(recipients)} recipients: {message}")
        return {'status': 'delivered'}

    def get_delivery_log(self) -> list:
        return self.delivery_log
