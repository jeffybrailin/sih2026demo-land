"""
Alert Message Templates — EN / HI / AS
========================================
All citizen-facing messages use plain language.
No ML/technical terminology.

Template variables: {location}, {risk_level}, {road}, {action}
"""

SUPPORTED_LANGUAGES = ['en', 'hi', 'as']

TEMPLATES = {
  'CRITICAL': {
    'en': 'LANDSLIDE DANGER: {location} area is at CRITICAL risk. Avoid {road}. Move to safe ground immediately. Follow local authority instructions.',
    'hi': 'भूस्खलन खतरा: {location} क्षेत्र में गंभीर खतरा है। {road} से दूर रहें। तुरंत सुरक्षित स्थान पर जाएं।',
    'as': 'ভূমিস্খলনৰ বিপদ: {location} অঞ্চলত মাৰাত্মক বিপদ আছে। {road} পৰিহাৰ কৰক। তৎকালে নিৰাপদ ঠাইলৈ যাওক।',
  },
  'WARNING': {
    'en': 'LANDSLIDE WARNING: {location}. High risk detected. Avoid {road}. Be ready to evacuate.',
    'hi': 'भूस्खलन चेतावनी: {location}। उच्च खतरा। {road} से बचें। निकासी के लिए तैयार रहें।',
    'as': 'ভূমিস্খলন সতৰ্কতা: {location}। উচ্চ বিপদ চিনাক্ত হৈছে। {road} পৰিহাৰ কৰক।',
  },
  'WATCH': {
    'en': 'LANDSLIDE WATCH: {location} area. Risk increasing. Monitor local updates. Restrict heavy vehicles on {road}.',
    'hi': 'भूस्खलन निगरानी: {location} क्षेत्र। खतरा बढ़ रहा है। स्थानीय अपडेट देखते रहें।',
    'as': 'ভূমিস্খলন নিগৰানী: {location} অঞ্চল। বিপদ বাঢ়িছে। স্থানীয় আপডেট অনুসৰণ কৰক।',
  },
  'ADVISORY': {
    'en': 'ADVISORY: {location}. Elevated landslide conditions. Exercise caution on {road}.',
    'hi': 'सलाह: {location}। भूस्खलन की संभावित स्थिति। {road} पर सावधान रहें।',
    'as': 'পৰামৰ্শ: {location}। ভূমিস্খলনৰ পৰিস্থিতি বৃদ্ধি পাইছে। {road} ত সাৱধান থাকক।',
  },
}

def format_alert(level: str, lang: str, location: str, road: str) -> str:
    if level not in TEMPLATES:
        return ""
    if lang not in SUPPORTED_LANGUAGES:
        lang = 'en'
    
    tmpl = TEMPLATES[level].get(lang, TEMPLATES[level]['en'])
    return tmpl.format(location=location, road=road, risk_level=level, action='')

def get_authority_message(sector_id: str, priority_rank: int, prob: float, details: str) -> str:
    return f"SECTOR {sector_id} (Rank #{priority_rank}) ALERT. Prob: {prob:.2f}. Details: {details}"
