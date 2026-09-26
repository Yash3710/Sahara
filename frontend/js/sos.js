import { requireAuth, apiRequest } from './supabaseClient.js';

// Protect page
const session = await requireAuth();
if (!session) throw new Error('Not authenticated');

// Elements
const triggerView = document.getElementById('sos-trigger');
const confirmView = document.getElementById('sos-confirm');
const sentView = document.getElementById('sos-sent');
const errorView = document.getElementById('sos-error');

const sosBtn = document.getElementById('sos-btn');
const confirmBtn = document.getElementById('confirm-sos-btn');
const cancelBtn = document.getElementById('cancel-sos-btn');
const retryBtn = document.getElementById('retry-sos-btn');

const locationText = document.getElementById('location-text');
const alertTime = document.getElementById('alert-time');

let userLat = null;
let userLng = null;

// Try to get location early
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
    },
    () => { /* ignore error */ }
  );
}

function showView(view) {
  [triggerView, confirmView, sentView, errorView].forEach(v => v.classList.add('hidden'));
  view.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

// Step 1 → Step 2
sosBtn.addEventListener('click', () => {
  showView(confirmView);
});

// Cancel → back to Step 1
cancelBtn.addEventListener('click', () => {
  showView(triggerView);
});

// Retry
retryBtn.addEventListener('click', () => {
  showView(triggerView);
});

// Confirm → Send Alert
confirmBtn.addEventListener('click', async () => {
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span class="spinner"></span> Sending alert...';

  // Try to get fresh location
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('no geolocation'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude;
  } catch {
    // Continue without location
  }

  try {
    await apiRequest('/api/sos/alert', {
      method: 'POST',
      body: JSON.stringify({
        latitude: userLat,
        longitude: userLng,
      }),
    });

    // Show success
    showView(sentView);

    // Display location
    if (userLat && userLng) {
      locationText.textContent = `Latitude: ${userLat.toFixed(4)}, Longitude: ${userLng.toFixed(4)}`;
    } else {
      locationText.textContent = 'Location could not be determined. Please share your location with emergency services if needed.';
    }

    const now = new Date();
    alertTime.textContent = `Alert sent at ${now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} on ${now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}`;

  } catch (err) {
    showView(errorView);
    const errorDetail = document.getElementById('error-detail');
    errorDetail.textContent = err.message || 'We could not send your alert. Please try again or call emergency services directly.';
  }
});
