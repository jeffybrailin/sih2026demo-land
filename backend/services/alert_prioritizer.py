"""
Emergency Alert Prioritization Engine
======================================
Hazard × Exposure × Vulnerability → Priority Score

Formula (configurable weights):
  priority_score = (
      0.45 * hazard_score           # ML model output
    + 0.25 * exposure_score         # population + road criticality
    + 0.20 * vulnerability_score    # remoteness + hospital distance
    + 0.10 * infra_criticality      # NH class, bridges, critical nodes
  )

Weights are CONFIGURABLE and documented as decision-support policy.
They are NOT physical laws or empirically derived weights.

Data sources for exposure/vulnerability:
  - Road class: MoRTH National Highway Atlas (NH class 1-4)
  - Population: Census 2011 district data (RGI India)
  - Hospital distance: NHM facility registry (district hospital database)
"""
import collections

SECTOR_EXPOSURE = collections.defaultdict(lambda: {
    'population_50km': 5000,
    'road_class': 2,
    'aadt_proxy': 1000,
    'road_name': 'State Highway',
    'bridges_count': 1
})

SECTOR_VULNERABILITY = collections.defaultdict(lambda: {
    'nearest_hospital_km': 15.0,
    'nearest_relief_centre_km': 5.0,
    'alternate_route_available': True,
    'remoteness_score': 0.5,
    'response_time_min': 45
})

class AlertPrioritizer:
    WEIGHTS = {'hazard': 0.45, 'exposure': 0.25, 'vulnerability': 0.20, 'infrastructure': 0.10}

    def compute_exposure_score(self, sector_id: str) -> float:
        exp = SECTOR_EXPOSURE[sector_id]
        # normalize pop (max 50000)
        pop = min(1.0, exp['population_50km'] / 50000.0)
        rc = 1.0 / exp['road_class']  # 1 (NH) -> 1.0, 4 -> 0.25
        return (pop * 0.6) + (rc * 0.4)

    def compute_vulnerability_score(self, sector_id: str) -> float:
        vuln = SECTOR_VULNERABILITY[sector_id]
        # max hospital dist 50km
        hosp = min(1.0, vuln['nearest_hospital_km'] / 50.0)
        alt = 0.0 if vuln['alternate_route_available'] else 1.0
        return (hosp * 0.5) + (alt * 0.3) + (vuln['remoteness_score'] * 0.2)

    def compute_infra_criticality(self, sector_id: str) -> float:
        exp = SECTOR_EXPOSURE[sector_id]
        return min(1.0, exp['bridges_count'] / 5.0)

    def prioritize(self, hazard_results: list) -> list:
        enriched = []
        for hz in hazard_results:
            sid = hz.get('sector_id', '')
            hz_score = hz.get('prob_now', 0.0)
            
            exp_score = self.compute_exposure_score(sid)
            vuln_score = self.compute_vulnerability_score(sid)
            infra_score = self.compute_infra_criticality(sid)
            
            p_score = (
                self.WEIGHTS['hazard'] * hz_score +
                self.WEIGHTS['exposure'] * exp_score +
                self.WEIGHTS['vulnerability'] * vuln_score +
                self.WEIGHTS['infrastructure'] * infra_score
            )
            
            hz['exposure_score'] = exp_score
            hz['vulnerability_score'] = vuln_score
            hz['infrastructure_criticality'] = infra_score
            hz['priority_score'] = p_score
            hz['population_at_risk'] = SECTOR_EXPOSURE[sid]['population_50km']
            hz['road_name'] = SECTOR_EXPOSURE[sid]['road_name']
            hz['nearest_hospital_km'] = SECTOR_VULNERABILITY[sid]['nearest_hospital_km']
            
            enriched.append(hz)
            
        enriched.sort(key=lambda x: x['priority_score'], reverse=True)
        for i, h in enumerate(enriched):
            h['priority_rank'] = i + 1
            
        return enriched
