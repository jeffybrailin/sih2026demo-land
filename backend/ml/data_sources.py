"""
Official Government Data Sources for NE India Landslide Prediction Model
=========================================================================
All sources are public, freely accessible, and from official Indian government
or international meteorological bodies. No commercial data is required.

USAGE:
  Descriptions and download links are provided for each source.
  Run download_instructions() to print a step-by-step guide.

COVERAGE:
  25 years: 2000–2025 (some datasets extend to 1901)
  Region:   North East India (22°N–30°N, 88°E–97.5°E)
"""

DATA_SOURCES = {

    # ─────────────────────────────────────────────────────────────────────
    # 1. LANDSLIDE INVENTORY
    # ─────────────────────────────────────────────────────────────────────
    "GSI_Landslide_Atlas": {
        "name":        "Geological Survey of India — Landslide Atlas of India (2021)",
        "type":        "Landslide Inventory (event points + polygons)",
        "url":         "https://bhukosh.gsi.gov.in/",
        "api":         "https://bhukosh.gsi.gov.in/Bhukosh/MapViewer.aspx",
        "format":      "Shapefile / GeoTIFF",
        "years":       "Historical (1900–2023)",
        "resolution":  "Point/polygon per event",
        "features":    ["lat", "lon", "date", "type", "fatalities", "area_m2", "cause"],
        "download":    "Bhukosh Portal → Thematic Maps → Geohazards → Landslide",
        "notes":       "India's most comprehensive inventory. NE India chapter covers 80,000+ events.",
    },

    "NDMA_Disaster_DB": {
        "name":        "NDMA National Disaster Database",
        "type":        "Disaster events + fatality data",
        "url":         "https://ndma.gov.in/Natural-Hazard/Landslide",
        "api":         "https://ndmindia.mha.gov.in/",
        "format":      "CSV / Excel",
        "years":       "2000–2025",
        "resolution":  "District-level",
        "features":    ["district", "state", "date", "deaths", "houses_damaged", "type"],
        "download":    "NDMA portal → Reports → Annual State-wise Data",
        "notes":       "Includes district-wise annual summaries of all natural disasters.",
    },

    # ─────────────────────────────────────────────────────────────────────
    # 2. RAINFALL & METEOROLOGICAL DATA
    # ─────────────────────────────────────────────────────────────────────
    "IMD_Gridded_Rainfall": {
        "name":        "IMD Gridded Daily Rainfall Dataset (RF25)",
        "type":        "Daily rainfall (antecedent + trigger)",
        "url":         "https://imdpune.gov.in/cmpg/Griddata/Rainfall_25_NetCDF.html",
        "api":         "https://imdpune.gov.in/",
        "format":      "NetCDF4 (.nc)",
        "years":       "1901–2025",
        "resolution":  "0.25° × 0.25° (~25 km)",
        "features":    ["rain_mm_day", "lat", "lon", "date"],
        "download":    "IMD Pune → Climate Data → Gridded Daily Rainfall → 0.25° dataset",
        "notes":       "Gold standard for Indian rainfall. Bias-corrected against 6500+ gauge stations.",
    },

    "IMD_District_Rainfall": {
        "name":        "IMD District-Wise Monthly Rainfall (Actual vs Normal)",
        "type":        "District monthly rainfall",
        "url":         "https://mausam.imd.gov.in/imd_latest/contents/rainfall_data_2.php",
        "format":      "CSV",
        "years":       "2000–2025",
        "resolution":  "District-level, monthly",
        "features":    ["district", "state", "month", "year", "actual_mm", "normal_mm", "departure_pct"],
        "download":    "IMD National Weather Services → District Rainfall Statistics",
        "notes":       "Useful for antecedent rainfall features and seasonal normalization.",
    },

    "IMD_Station_Data": {
        "name":        "IMD Automatic Weather Stations (AWS) Hourly Data",
        "type":        "Hourly rainfall + temperature + humidity",
        "url":         "https://dsp.imdpune.gov.in/",
        "format":      "CSV",
        "years":       "2011–2025",
        "resolution":  "Hourly, ~500+ stations in NE India",
        "features":    ["station_id", "lat", "lon", "timestamp", "rain_mm", "temp_C", "humidity_pct", "wind_kmh"],
        "download":    "IMD Data Supply Portal → AWS Hourly → State selection",
        "notes":       "Best source for hourly trigger rainfall. Requires free registration.",
    },

    "ERA5_Reanalysis": {
        "name":        "ECMWF ERA5 Reanalysis (via Copernicus)",
        "type":        "Soil moisture, total precipitation, temperature, wind",
        "url":         "https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land",
        "api":         "cdsapi Python package",
        "format":      "NetCDF4 / GRIB",
        "years":       "1950–2025",
        "resolution":  "0.1° × 0.1° (~9 km), hourly",
        "features":    ["volumetric_soil_water_l1-4", "total_precipitation", "skin_temperature", "snowmelt"],
        "download":    "Copernicus CDS API: pip install cdsapi → free registration",
        "notes":       "Best global source for soil moisture layers. Covers 25+ years at high resolution.",
    },

    # ─────────────────────────────────────────────────────────────────────
    # 3. TERRAIN / DEM
    # ─────────────────────────────────────────────────────────────────────
    "SRTM_30m_DEM": {
        "name":        "NASA SRTM 30-meter Digital Elevation Model",
        "type":        "Terrain analysis (slope, aspect, curvature, TWI, SPI, relief)",
        "url":         "https://earthexplorer.usgs.gov/",
        "api":         "pip install elevation  # auto-downloads SRTM tiles",
        "format":      "GeoTIFF",
        "years":       "2000 (static)",
        "resolution":  "30 m",
        "features":    ["elevation_m", "slope_deg", "aspect_deg", "curvature", "twi", "spi", "relief_m"],
        "download":    "NASA EarthExplorer → SRTM 1 Arc-Second → Select NE India bounding box",
        "notes":       "Derive all terrain features using SAGA GIS or richdem Python library.",
    },

    "ALOS_PALSAR_DEM": {
        "name":        "JAXA ALOS PALSAR RTC 12.5m SAR DEM",
        "type":        "High-resolution terrain (better than SRTM in dense vegetation)",
        "url":         "https://search.asf.alaska.edu/",
        "format":      "GeoTIFF",
        "years":       "2006–2011 (static)",
        "resolution":  "12.5 m",
        "features":    ["elevation_m", "slope_deg", "aspect_deg"],
        "download":    "ASF Data Search → ALOS PALSAR → RTC Hi-Res → NE India",
        "notes":       "Preferred for Arunachal & Sikkim where vegetation masks SRTM errors.",
    },

    # ─────────────────────────────────────────────────────────────────────
    # 4. GEOLOGY / SOIL
    # ─────────────────────────────────────────────────────────────────────
    "GSI_Geology_Map": {
        "name":        "GSI National Geological Map (1:250,000)",
        "type":        "Lithology classification",
        "url":         "https://bhukosh.gsi.gov.in/",
        "format":      "Shapefile",
        "years":       "Static",
        "resolution":  "1:250,000",
        "features":    ["lithology_code", "rock_type", "age", "permeability_class"],
        "download":    "Bhukosh Portal → Geological Maps → Regional Geology → NE India",
        "notes":       "Lithology is a critical landslide predictor. Schist & Shale = highest risk.",
    },

    "NBSS_Soil_Map": {
        "name":        "NBSS&LUP National Soil Survey (1:500,000)",
        "type":        "Soil type, depth, texture, drainage",
        "url":         "https://www.nbsslup.in/",
        "format":      "Shapefile / PDF reports",
        "years":       "Static",
        "resolution":  "1:500,000",
        "features":    ["soil_type", "texture_class", "depth_cm", "drainage_class", "permeability"],
        "download":    "NBSS&LUP website → Publications → State Soil Maps → NE India states",
        "notes":       "Clay soils retain water and reduce shear strength — key landslide predictor.",
    },

    # ─────────────────────────────────────────────────────────────────────
    # 5. LAND USE / VEGETATION
    # ─────────────────────────────────────────────────────────────────────
    "NRSC_LULC": {
        "name":        "NRSC/ISRO Land Use Land Cover — NLCMS (National Land Cover Mapping System)",
        "type":        "Land cover classification (annual)",
        "url":         "https://bhuvan.nrsc.gov.in/",
        "api":         "https://bhuvan-app1.nrsc.gov.in/thematic/thematic/index.php",
        "format":      "GeoTIFF / Shapefile",
        "years":       "2005–2023 (annual)",
        "resolution":  "30 m (Resourcesat-2 based)",
        "features":    ["lulc_class", "forest_cover_pct", "change_detected"],
        "download":    "Bhuvan Portal → Thematic Services → NLCMS → Select Year + State",
        "notes":       "Deforestation tracking: cleared forest = slope destabilization over time.",
    },

    "MODIS_NDVI": {
        "name":        "NASA MODIS MOD13Q1 NDVI (Terra, 16-day)",
        "type":        "Vegetation density (NDVI) — seasonal + interannual",
        "url":         "https://lpdaac.usgs.gov/products/mod13q1v006/",
        "api":         "NASA EARTHDATA API (free registration)",
        "format":      "HDF4 / GeoTIFF",
        "years":       "2000–2025",
        "resolution":  "250 m, 16-day composites",
        "features":    ["ndvi", "evi", "pixel_reliability"],
        "download":    "NASA EarthData Search → MODIS → MOD13Q1 → NE India tile H25V05-H26V05",
        "notes":       "NDVI < 0.3 indicates degraded vegetation → higher landslide susceptibility.",
    },

    # ─────────────────────────────────────────────────────────────────────
    # 6. HYDROLOGY / FAULTS
    # ─────────────────────────────────────────────────────────────────────
    "CWC_River_Network": {
        "name":        "Central Water Commission — River & Drainage Network",
        "type":        "Proximity to streams (distance_to_stream_km)",
        "url":         "https://cwc.gov.in/",
        "format":      "Shapefile",
        "years":       "Static",
        "features":    ["river_name", "order", "flow_direction"],
        "download":    "CWC WRIS portal → GIS Layers → River Network → NE India",
        "notes":       "Stream proximity drives lateral erosion and toe cutting of slopes.",
    },

    "GSI_Fault_Map": {
        "name":        "GSI Active Fault Database of India",
        "type":        "Proximity to tectonic faults (seismic precondition)",
        "url":         "https://bhukosh.gsi.gov.in/",
        "format":      "Shapefile",
        "years":       "Static",
        "features":    ["fault_name", "type", "slip_rate", "last_activity"],
        "download":    "Bhukosh Portal → Seismotectonics → Active Faults → NE India",
        "notes":       "NE India is seismically active (Zone V). Fault proximity amplifies rainfall risk.",
    },

    "USGS_ShakeMap": {
        "name":        "USGS ShakeMap / NCS Peak Ground Acceleration",
        "type":        "Seismic hazard (co-seismic trigger)",
        "url":         "https://earthquake.usgs.gov/data/shakemap/",
        "format":      "GeoTIFF / JSON",
        "years":       "2000–2025",
        "features":    ["pga_g", "psa_03", "psa_10"],
        "download":    "USGS Earthquake Hazards → ShakeMap → Regional → NE India events",
        "notes":       "PGA > 0.1g can trigger landslides even in dry conditions.",
    },
}


FEATURE_COLUMNS = [
    # Terrain (from SRTM / ALOS)
    "slope_deg",         # Slope angle in degrees
    "aspect_sin",        # sin(aspect) — north/south solar exposure
    "aspect_cos",        # cos(aspect) — east/west rain shadow
    "elevation_m",       # Altitude above sea level (m)
    "curvature",         # Plan curvature (negative = concave = water convergence)
    "twi",               # Topographic Wetness Index
    "spi",               # Stream Power Index (erosion potential)
    "relief_m",          # Local relief in 1-km radius (m)
    # Rainfall (from IMD RF25 + ERA5)
    "rainfall_24h_mm",   # 24-hour trigger rainfall (mm)
    "rainfall_7d_mm",    # 7-day antecedent rainfall (mm)
    "rainfall_15d_mm",   # 15-day antecedent rainfall (mm)
    "rainfall_30d_mm",   # 30-day antecedent rainfall (mm)
    "api_7d",            # Antecedent Precipitation Index (k=0.85 decay)
    "soil_moisture",     # Volumetric soil moisture 0–1 (from ERA5)
    # Soil / Geology (from NBSS + GSI)
    "soil_type",         # 0=Sandy 1=Loamy 2=Clay 3=SandyLoam 4=ClayLoam
    "lithology",         # 0=Alluvium 1=Granite 2=Schist 3=Quartzite 4=Limestone 5=Shale
    # Vegetation (from NRSC LULC + MODIS)
    "ndvi",              # Normalized Difference Vegetation Index (-1 to 1)
    "lulc",              # 0=Forest 1=Agriculture 2=BareRock 3=Urban 4=Scrubland
    # Hydrology / Seismicity
    "dist_fault_km",     # Distance to nearest active fault (km)
    "dist_stream_km",    # Distance to nearest stream (km)
    # Historical (from GSI inventory)
    "historical_density",# Past landslide density in 5-km radius (events/km²)
    # Temporal (seasonality)
    "month",             # Calendar month 1–12 (monsoon June–Sept dominates)
]

TARGET_COLUMN = "landslide"  # Binary: 1 = landslide event, 0 = stable


def download_instructions():
    print("=" * 70)
    print("NE INDIA LANDSLIDE PREDICTION — DATA DOWNLOAD GUIDE")
    print("=" * 70)
    for key, src in DATA_SOURCES.items():
        print(f"\n[{key}]")
        print(f"  Name:       {src['name']}")
        print(f"  URL:        {src['url']}")
        print(f"  Format:     {src['format']}")
        print(f"  Years:      {src['years']}")
        print(f"  Download:   {src['download']}")
        if 'notes' in src:
            print(f"  Notes:      {src['notes']}")
    print("\n" + "=" * 70)


if __name__ == "__main__":
    download_instructions()
