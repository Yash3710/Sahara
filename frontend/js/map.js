/**
 * map.js — Sahara Find Hospital
 *
 * Features:
 * - Full-viewport map with Leaflet + zoom controls
 * - Geolocation → Overpass API for up to 8 nearby hospitals
 * - Clicking a hospital fetches real driving route via OSRM (free, no API key)
 *   and draws the polyline path on the map
 * - Shows real distance (km) and estimated drive time (mins)
 * - Navigate button opens Google Maps directions
 * - Share Location copies coordinates to clipboard
 */

import L from 'leaflet';
import { requireAuth } from './supabaseClient.js';

await requireAuth();

// ── DOM ──────────────────────────────────────────────────────────
const errorDiv         = document.getElementById('location-error');
const statusDot        = document.getElementById('status-dot');
const statusText       = document.getElementById('status-text');
const hospitalList     = document.getElementById('hospital-list');
const routeCard        = document.getElementById('route-card');
const routeHospName    = document.getElementById('route-hospital-name');
const routeDistance    = document.getElementById('route-distance');
const routeTime        = document.getElementById('route-time');
const btnNavigate      = document.getElementById('btn-navigate');
const btnShare         = document.getElementById('btn-share');

// ── Map ──────────────────────────────────────────────────────────
const DEFAULT_LOC = [19.076, 72.8777];

const map = L.map('map', {
  zoomControl: false,
  attributionControl: true,
}).setView(DEFAULT_LOC, 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

// ── Icons ────────────────────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#06477D;border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(6,71,125,0.5);
  "></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});

function makeHospIcon(rank, active) {
  const bg  = active ? '#06477D' : '#fff';
  const fg  = active ? '#fff'    : '#06477D';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${bg};border:2.5px solid #06477D;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:800;color:${fg};
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
      font-family:system-ui,sans-serif;
    ">${rank}</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
}

// ── Helpers ──────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function distLabel(km) {
  return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`;
}

function minLabel(secs) {
  const m = Math.ceil(secs / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}m`;
}

function setStatus(state, text) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = text;
}

// ── State ────────────────────────────────────────────────────────
let userLat = null, userLng = null;
let userMarker = null;
let hospitalMarkers = [];
let routeLayer = null;
let hospitals = [];
let activeIdx = -1;

function clearRoute() {
  if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
}

// ── OSRM routing ─────────────────────────────────────────────────
async function fetchRoute(toLat, toLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/` +
    `${userLng},${userLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route');

  const route  = data.routes[0];
  const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const distKm = (route.distance / 1000).toFixed(1);
  const timeSec = route.duration;

  return { coords, distKm, timeSec };
}

// ── Select / activate a hospital ────────────────────────────────
async function selectHospital(idx) {
  activeIdx = idx;
  const h = hospitals[idx];
  const name = h.tags?.name || `Hospital ${idx + 1}`;

  // Update list active state
  document.querySelectorAll('.hospital-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });

  // Update marker icons
  hospitalMarkers.forEach((m, i) => m.setIcon(makeHospIcon(i+1, i === idx)));

  // Show route card with loading state
  routeCard.classList.remove('hidden');
  routeHospName.textContent = name;
  routeDistance.textContent = '…';
  routeTime.textContent = '…';

  // Set navigate URL immediately (straight-line fallback)
  btnNavigate.href =
    `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}` +
    `&destination=${h.lat},${h.lon}&travelmode=driving`;

  // Fly to hospital
  map.flyTo([h.lat, h.lon], 15, { animate: true, duration: 0.75 });
  hospitalMarkers[idx]?.openPopup();

  clearRoute();

  try {
    const { coords, distKm, timeSec } = await fetchRoute(h.lat, h.lon);

    // Draw route polyline
    routeLayer = L.polyline(coords, {
      color: '#06477D',
      weight: 5,
      opacity: 0.85,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    // Fit the route + user in view
    const bounds = L.latLngBounds([
      [userLat, userLng],
      ...coords,
    ]);
    map.fitBounds(bounds.pad(0.12));

    // Update stats
    routeDistance.textContent = `${distKm} km`;
    routeTime.textContent = minLabel(timeSec);

    // Update navigate URL with real route
    btnNavigate.href =
      `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}` +
      `&destination=${h.lat},${h.lon}&travelmode=driving`;

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.warn('[map] OSRM routing failed, using straight-line:', err.message);
    // Straight-line fallback
    const km = haversineKm(userLat, userLng, h.lat, h.lon);
    routeDistance.textContent = `~${distLabel(km)}`;
    routeTime.textContent = `~${Math.ceil(km / 0.4)} min`;  // rough 24 km/h city speed

    // Draw dashed line as fallback
    routeLayer = L.polyline([[userLat, userLng], [h.lat, h.lon]], {
      color: '#06477D',
      weight: 3,
      opacity: 0.6,
      dashArray: '8 6',
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds().pad(0.18));
    if (window.lucide) lucide.createIcons();
  }
}

// ── Build hospital list ──────────────────────────────────────────
function buildList() {
  hospitalList.innerHTML = '';

  if (!hospitals.length) {
    hospitalList.innerHTML = `
      <li class="panel-placeholder">
        <i data-lucide="map-off"></i>
        <span>No hospitals found within 5 km.</span>
      </li>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  hospitals.forEach((h, i) => {
    const km   = haversineKm(userLat, userLng, h.lat, h.lon);
    const name = h.tags?.name || `Hospital ${i+1}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1` +
      `&origin=${userLat},${userLng}&destination=${h.lat},${h.lon}&travelmode=driving`;

    const li = document.createElement('li');
    li.className = 'hospital-item';
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', `${name}, ${distLabel(km)} away`);
    li.dataset.index = i;

    li.innerHTML = `
      <span class="hospital-rank" aria-hidden="true">${i+1}</span>
      <div class="hospital-info">
        <p class="hospital-name">${name}</p>
        <p class="hospital-meta">${distLabel(km)} away · tap to see route</p>
      </div>
      <a href="${mapsUrl}" target="_blank" rel="noopener"
         class="hospital-dir-btn" aria-label="Directions to ${name}">
        <i data-lucide="navigation"></i> Go
      </a>`;

    const activate = (e) => {
      if (e.target.closest('.hospital-dir-btn')) return;
      selectHospital(i);
      li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    li.addEventListener('click', activate);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') activate(e); });

    hospitalList.appendChild(li);
  });

  if (window.lucide) lucide.createIcons();
}

// ── Share location ───────────────────────────────────────────────
btnShare.addEventListener('click', async () => {
  if (!userLat) return;
  const text = `My location: https://maps.google.com/?q=${userLat},${userLng}`;
  if (navigator.share) {
    try { await navigator.share({ title: 'My Location – Sahara', text }); return; } catch {}
  }
  try {
    await navigator.clipboard.writeText(text);
    btnShare.textContent = 'Copied!';
    setTimeout(() => {
      btnShare.innerHTML = '<i data-lucide="share-2"></i> Share Location';
      lucide.createIcons();
    }, 2000);
  } catch {
    alert(text);
  }
});

// ── Geolocation ──────────────────────────────────────────────────
if (!navigator.geolocation) {
  errorDiv.classList.remove('hidden');
  setStatus('error', 'Location not supported on this device');
} else {
  setStatus('locating', 'Detecting your location…');

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      errorDiv.classList.add('hidden');
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;

      map.setView([userLat, userLng], 15);
      userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>You are here</strong>', { offset: [0, -4] })
        .openPopup();

      setStatus('locating', 'Searching for nearby hospitals…');

      try {
        const query = `
          [out:json][timeout:20];
          (
            node["amenity"="hospital"](around:5000,${userLat},${userLng});
            way["amenity"="hospital"](around:5000,${userLat},${userLng});
          );
          out center 8;
        `.trim();

        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
        });
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        const data = await res.json();

        hospitals = (data.elements || [])
          .map(el => ({ ...el, lat: el.lat ?? el.center?.lat, lon: el.lon ?? el.center?.lon }))
          .filter(el => el.lat && el.lon)
          .sort((a, b) =>
            haversineKm(userLat, userLng, a.lat, a.lon) -
            haversineKm(userLat, userLng, b.lat, b.lon)
          );

        if (!hospitals.length) {
          setStatus('error', 'No hospitals found within 5 km');
          buildList();
          return;
        }

        setStatus('found', `${hospitals.length} hospital${hospitals.length > 1 ? 's' : ''} found nearby`);

        // Add markers
        hospitals.forEach((h, i) => {
          const name = h.tags?.name || `Hospital ${i+1}`;
          const km   = haversineKm(userLat, userLng, h.lat, h.lon);
          const m = L.marker([h.lat, h.lon], { icon: makeHospIcon(i+1, false) })
            .addTo(map)
            .bindPopup(`<strong>${name}</strong><br>${distLabel(km)} away`, { offset: [0,-8] });
          m.on('click', () => selectHospital(i));
          hospitalMarkers.push(m);
        });

        buildList();

        // Auto-select nearest and draw its route
        selectHospital(0);

      } catch (err) {
        console.error('[map]', err);
        setStatus('error', 'Could not load hospitals — check your connection');
        hospitalList.innerHTML = `
          <li class="panel-placeholder">
            <i data-lucide="wifi-off"></i>
            <span>Could not reach the hospital directory. Please try again.</span>
          </li>`;
        if (window.lucide) lucide.createIcons();
      }
    },
    () => {
      errorDiv.classList.remove('hidden');
      setStatus('error', 'Location access denied');
      hospitalList.innerHTML = `
        <li class="panel-placeholder">
          <i data-lucide="lock"></i>
          <span>Allow location access to find hospitals near you.</span>
        </li>`;
      if (window.lucide) lucide.createIcons();
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}
