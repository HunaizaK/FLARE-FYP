export function initFloodOverlay(map, opts = {}) {
  const API = opts.apiBase || "http://localhost:8002";
  const overlays = {};
  let loaded = false;

  async function load() {
    if (loaded) return;
    try {
      const res = await fetch(`${API}/api/flood_maps`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      Object.entries(data.gauges).forEach(([gaugeName, g]) => {
        overlays[gaugeName] = L.imageOverlay(
          `${API}/static/${g.peak.png_path}`,
          g.leaflet_bounds,
          { opacity: 1.0, interactive: false }
        );
      });
      loaded = true;
    } catch (e) {
      console.error("Flood overlay error:", e);
    }
  }

  function show() {
    Object.values(overlays).forEach(o => o.addTo(map));
  }

  function hide() {
    Object.values(overlays).forEach(o => {
      if (map.hasLayer(o)) map.removeLayer(o);
    });
  }

  const ready = load();
  return { show, hide, ready };
}
