import {
  getMedicines,
  getAppointments,
  getReminders,
  getCommunityEvents,
} from "./supabaseService.js";
import { logger } from "../utils/logger.js";

const INTENT_PATTERNS = {
  medicines: [
    "medicine",
    "medicines",
    "medication",
    "tablet",
    "tablets",
    "pill",
    "pills",
    "dose",
    "dosage",
    "drug",
    "drugs",
    "metformin",
    "aspirin",
    "injection",
    "दवाई",
    "दवा",
    "गोली",
  ],
  appointments: [
    "appointment",
    "appointments",
    "doctor",
    "hospital",
    "clinic",
    "checkup",
    "check-up",
    "visit",
    "dr.",
    "consultation",
    "specialist",
    "cardiology",
    "डॉक्टर",
    "अपॉइंटमेंट",
  ],
  reminders: [
    "reminder",
    "reminders",
    "remind",
    "pending",
    "due",
    "scheduled",
    "today",
    "tomorrow",
    "task",
    "tasks",
    "याद",
    "रिमाइंडर",
  ],
  events: [
    "event",
    "events",
    "community",
    "activity",
    "activities",
    "yoga",
    "walk",
    "programme",
    "program",
    "gathering",
    "bhajan",
    "class",
    "workshop",
    "इवेंट",
    "योग",
    "सामुदायिक",
  ],
};

/**
 * detectIntents(message)
 * Returns a Set of matched intent keys: 'medicines' | 'appointments' | 'reminders' | 'events'
 */
function detectIntents(message) {
  const lower = message.toLowerCase();
  const matched = new Set();

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.add(intent);
    }
  }
  return matched;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMedicines(rows) {
  if (!rows.length) return "No active medicines found.";
  return rows
    .map(
      (m) =>
        `• ${m.name}${m.dosage ? ` (${m.dosage})` : ""} - ${m.time_of_day || "as needed"}${m.frequency ? `, ${m.frequency}` : ""}${m.notes ? `. Note: ${m.notes}` : ""}`,
    )
    .join("\n");
}

function formatAppointments(rows) {
  if (!rows.length) return "No upcoming appointments in the next 30 days.";
  return rows
    .map(
      (a) =>
        `• Dr. ${a.doctor_name}${a.specialty ? ` (${a.specialty})` : ""} - ${formatDate(a.appointment_at)}${a.location ? ` at ${a.location}` : ""}${a.notes ? `. Note: ${a.notes}` : ""}`,
    )
    .join("\n");
}

function formatReminders(rows) {
  if (!rows.length) return "No pending reminders in the next 24 hours.";
  return rows
    .map((r) => `• ${r.title} - ${formatDate(r.remind_at)}`)
    .join("\n");
}

function formatEvents(rows) {
  if (!rows.length) return "No community events scheduled in the next 7 days.";
  return rows
    .map(
      (e) =>
        `• ${e.title}${e.location ? ` at ${e.location}` : ""} - ${formatDate(e.event_at)}${e.description ? `. ${e.description}` : ""}`,
    )
    .join("\n");
}

/**
 * buildContext(message, userId)
 *
 * Main export. Detects what the user is asking,
 * fetches only the relevant data, and returns a
 * context string to inject into the Ollama prompt.
 * Returns null if no DB data is needed.
 */
export async function buildContext(message, userId) {
  if (!userId) return null;

  const intents = detectIntents(message);
  if (intents.size === 0) return null;

  logger.info(`Context intents detected: [${[...intents].join(", ")}]`);

  // Fetch only what's needed - all in parallel
  const fetches = {};
  if (intents.has("medicines")) fetches.medicines = getMedicines(userId);
  if (intents.has("appointments"))
    fetches.appointments = getAppointments(userId);
  if (intents.has("reminders")) fetches.reminders = getReminders(userId);
  if (intents.has("events")) fetches.events = getCommunityEvents();

  const results = Object.fromEntries(
    await Promise.all(
      Object.entries(fetches).map(async ([k, p]) => [k, await p]),
    ),
  );

  // Build the context block
  const sections = [];
  const today = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  sections.push(`[CURRENT DATE & TIME: ${today}]`);
  sections.push(
    "[IMPORTANT: Use ONLY the data below to answer. Do not guess or make up information.]\n",
  );

  if (results.medicines)
    sections.push(`MEDICINES:\n${formatMedicines(results.medicines)}`);
  if (results.appointments)
    sections.push(
      `UPCOMING APPOINTMENTS:\n${formatAppointments(results.appointments)}`,
    );
  if (results.reminders)
    sections.push(`PENDING REMINDERS:\n${formatReminders(results.reminders)}`);
  if (results.events)
    sections.push(`COMMUNITY EVENTS:\n${formatEvents(results.events)}`);

  return sections.join("\n\n");
}
