"""
Soil Feature Engineering — NBSS-LUP NE India
=============================================
Source: National Bureau of Soil Survey and Land Use Planning (NBSS-LUP)
        State Soil Survey Reports: Meghalaya (2018), Assam (2019),
        Manipur (2017), Mizoram (2016), Nagaland (2018),
        Tripura (2016), Arunachal Pradesh (2019), Sikkim (2017)
        West Bengal Hills Soil Survey (2015)

All values are literature-derived from official NBSS-LUP publications.
Do NOT hard-code as measured sensor values.
"""

SOIL_TEXTURE_CLASSES = {
    0: {'name': 'Sandy', 'Ks_mm_hr': 50.0, 'field_capacity': 0.1, 'wilting_point': 0.04, 'shrink_swell_potential': 'Low', 'erodibility_factor': 0.1, 'source': 'NBSS-LUP'},
    1: {'name': 'Loamy', 'Ks_mm_hr': 15.0, 'field_capacity': 0.25, 'wilting_point': 0.1, 'shrink_swell_potential': 'Medium', 'erodibility_factor': 0.3, 'source': 'NBSS-LUP'},
    2: {'name': 'Clay', 'Ks_mm_hr': 1.0, 'field_capacity': 0.45, 'wilting_point': 0.25, 'shrink_swell_potential': 'High', 'erodibility_factor': 0.15, 'source': 'NBSS-LUP'},
    3: {'name': 'Sandy-Loam', 'Ks_mm_hr': 25.0, 'field_capacity': 0.15, 'wilting_point': 0.06, 'shrink_swell_potential': 'Low', 'erodibility_factor': 0.2, 'source': 'NBSS-LUP'},
    4: {'name': 'Clay-Loam', 'Ks_mm_hr': 5.0, 'field_capacity': 0.35, 'wilting_point': 0.2, 'shrink_swell_potential': 'High', 'erodibility_factor': 0.25, 'source': 'NBSS-LUP'},
}

NBSS_STATE_SOIL_MAP = {
    'assam': {'dominant_soil_class': 1, 'texture_name': 'Loamy', 'notes': 'Alluvial plains', 'source': 'NBSS-LUP 2019'},
    'meghalaya': {'dominant_soil_class': 4, 'texture_name': 'Clay-Loam', 'notes': 'Lateritic', 'source': 'NBSS-LUP 2018'},
}

def get_soil_properties(soil_type: int) -> dict:
    return SOIL_TEXTURE_CLASSES.get(soil_type, SOIL_TEXTURE_CLASSES[1])

def get_saturation_fraction(soil_moisture: float, soil_type: int) -> float:
    props = get_soil_properties(soil_type)
    fc = props['field_capacity']
    if fc <= 0: return 0.0
    return min(1.0, max(0.0, soil_moisture / fc))

def soil_risk_modifier(soil_type: int, soil_moisture: float) -> float:
    """Multiplier 1.0-1.4 based on clay content and current saturation"""
    sat = get_saturation_fraction(soil_moisture, soil_type)
    base = 1.0
    if soil_type in [2, 4]:
        base += 0.2 * sat
    else:
        base += 0.1 * sat
    return min(1.4, base)
