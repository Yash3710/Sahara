/**
 * dashboardExtras.js
 * Handles two dashboard sections:
 *   1. Daily Mood Check-in    — localStorage, keyed by date
 *   2. A Little Positivity    — deterministic daily message from curated list
 *
 * Note: Daily Routine was removed (duplicate of Today's Reminders).
 * Reminder data is managed by dashboard.js + the Reminders page.
 */

import { isDemoMode } from './supabaseClient.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// ─── 1. MOOD CHECK-IN ───────────────────────────────────────────────────────

const MOODS = [
  { key: 'happy',   emoji: '😊', label: 'Happy',            response: "That's wonderful to hear! Have a beautiful day. 🌟" },
  { key: 'okay',    emoji: '🙂', label: 'Okay',             response: "That's alright. Even ordinary days have little gifts in them. 💛" },
  { key: 'lonely',  emoji: '😔', label: 'Lonely',           response: "You are never truly alone — Sahara is always here for you. Would you like to chat? 💙" },
  { key: 'unwell',  emoji: '🤒', label: 'Not Feeling Well', response: "I'm sorry you're not feeling well. Please rest and take care. If you need help, press the SOS button anytime. 🙏" },
];

function loadMood() {
  const container = document.getElementById('mood-section');
  if (!container) return;

  const saved = getMoodToday();
  if (saved) {
    renderMoodResponse(container, saved);
  } else {
    renderMoodOptions(container);
  }
}

function getMoodToday() {
  try {
    const record = JSON.parse(localStorage.getItem('sahara_mood') || '{}');
    return record.date === todayKey() ? record.mood : null;
  } catch { return null; }
}

function saveMoodToday(moodKey) {
  localStorage.setItem('sahara_mood', JSON.stringify({ date: todayKey(), mood: moodKey }));
}

function renderMoodOptions(container) {
  container.innerHTML = `
    <p class="mood-question">How are you feeling today?</p>
    <div class="mood-options" role="group" aria-label="Mood options">
      ${MOODS.map(m => `
        <button class="mood-btn" data-mood="${m.key}" aria-label="${m.label}">
          <span class="mood-emoji">${m.emoji}</span>
          <span class="mood-label">${m.label}</span>
        </button>`).join('')}
    </div>`;

  container.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.mood;
      saveMoodToday(key);
      renderMoodResponse(container, key);
    });
  });
}

function renderMoodResponse(container, moodKey) {
  const mood = MOODS.find(m => m.key === moodKey) || MOODS[0];
  container.innerHTML = `
    <div class="mood-response">
      <span class="mood-response-emoji">${mood.emoji}</span>
      <div class="mood-response-text">
        <p class="mood-response-feeling">You're feeling <strong>${mood.label}</strong> today.</p>
        <p class="mood-response-message">${mood.response}</p>
      </div>
    </div>
    <button class="mood-change-btn" aria-label="Change mood">Change my answer</button>`;

  container.querySelector('.mood-change-btn').addEventListener('click', () => {
    localStorage.removeItem('sahara_mood');
    renderMoodOptions(container);
  });
}

// ─── 3. POSITIVITY ──────────────────────────────────────────────────────────

const MESSAGES = [
  "Every day is a new beginning. Take a deep breath and start again.",
  "Small steps still move you forward. You are doing wonderfully.",
  "You are loved more than you know.",
  "A kind heart makes the world a warmer place — and yours does.",
  "Today's sunshine is meant for you too.",
  "The best thing about today is that it belongs entirely to you.",
  "Age is a gift. You carry wisdom that no book can hold.",
  "You have survived every hard day so far. That is remarkable.",
  "Even the smallest moments of joy are worth celebrating.",
  "Reach out to someone today — your voice brings happiness.",
  "Good things are coming. Keep going.",
  "You matter deeply to the people around you.",
  "Rest when you need to. Resting is also doing something important.",
  "Every morning you wake up is a gift worth being grateful for.",
  "Kindness given away always finds its way back.",
  "Your story is still being written. The best chapters may be ahead.",
  "A warm cup of tea and a quiet moment can change the whole day.",
  "You bring something irreplaceable to this world.",
  "Today, let yourself be gentle with yourself.",
  "Happiness doesn't require perfection — just presence.",
  "The garden of life needs your unique bloom.",
  "Someone somewhere is glad you exist.",
  "It is never too late to appreciate what you have.",
  "Your calm is contagious — share it with the world today.",
  "There is beauty in ordinary days, if we remember to look.",
  "Worries are clouds — they pass. You remain.",
  "A smile costs nothing and gives everything.",
  "You are exactly where you need to be right now.",
  "Peace begins with a single quiet breath.",
  "Today is a good day to notice something beautiful.",
  "The world is richer because you are in it.",
];

function loadPositivity() {
  const el = document.getElementById('positivity-message');
  if (!el) return;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  el.textContent = MESSAGES[dayOfYear % MESSAGES.length];
}

// ─── Boot ────────────────────────────────────────────────────────────────────

loadMood();
loadPositivity();
