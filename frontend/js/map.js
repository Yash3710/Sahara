import L from 'leaflet';
import { requireAuth } from './supabaseClient.js';

// Setup Map
const DEFAULT_LOC = [19.076, 72.8777]; // Mumbai
let map = L.map('map').setView(DEFAULT_LOC, 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#15803d;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

let userMarker = null;
let nearestHospital = null;
const errorDiv = document.getElementById('location-error');
const hospitalNameEl = document.getElementById('nearest-hospital-name');

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (p) => {
      errorDiv.classList.add('hidden');
      const loc = [p.coords.latitude, p.coords.longitude];
      map.setView(loc, 15);
      userMarker = L.marker(loc, { icon: userIcon }).addTo(map).bindPopup('Your location').openPopup();
      
      // Find nearest hospital via Overpass
      try {
        const query = `[out:json][timeout:15];node["amenity"="hospital"](around:5000,${loc[0]},${loc[1]});out 1;`;
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(query)}` });
        const data = await res.json();
        
        if (data.elements && data.elements.length > 0) {
          const h = data.elements[0];
          nearestHospital = { lat: h.lat, lng: h.lon, name: h.tags?.name || 'Nearest Hospital' };
          hospitalNameEl.innerText = nearestHospital.name;
          
          L.marker([h.lat, h.lon]).addTo(map).bindPopup(nearestHospital.name);
        } else {
          hospitalNameEl.innerText = 'No hospitals found nearby.';
        }
      } catch (err) {
        console.error(err);
        hospitalNameEl.innerText = 'Could not find hospitals.';
      }
    },
    (err) => {
      errorDiv.classList.remove('hidden');
      hospitalNameEl.innerText = 'Location access denied.';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
} else {
  errorDiv.classList.remove('hidden');
  errorDiv.innerHTML = '<p class="text-lg font-semibold text-red-700">Location Not Supported</p><p class="text-base text-red-600">Your device does not support location services.</p>';
}

document.getElementById('emergency-btn').addEventListener('click', () => {
  if (nearestHospital && userMarker) {
    const loc = userMarker.getLatLng();
    const url = `https://www.google.com/maps/dir/?api=1&origin=${loc.lat},${loc.lng}&destination=${nearestHospital.lat},${nearestHospital.lng}&travelmode=driving`;
    window.open(url, '_blank');
  } else if (nearestHospital) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${nearestHospital.lat},${nearestHospital.lng}&travelmode=driving`;
    window.open(url, '_blank');
  } else {
    alert("Please wait while we locate the nearest hospital, or allow location permissions.");
  }
});
