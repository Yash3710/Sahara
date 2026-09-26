import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

const { url: SUPABASE_URL, serviceRoleKey: SERVICE_KEY } = config.supabase;

/**
 * supabaseFetch(path, params)
 *
 * Calls the Supabase PostgREST REST API using the service role key.
 * Queries are scoped manually with user_id filters - RLS is bypassed
 * intentionally so the backend can fetch data on behalf of the user
 * after verifying their JWT.
 */
async function supabaseFetch(path, params = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    logger.warn("Supabase credentials not configured - skipping DB fetch");
    return [];
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error(`supabaseFetch ${path} -> HTTP ${res.status}`, text);
    return [];
  }

  return res.json();
}



export async function getMedicines(userId) {
  try {
    return await supabaseFetch("medicines", {
      select: "name,dosage,time_of_day,frequency,notes",
      user_id: `eq.${userId}`,
      is_active: "eq.true",
      order: "time_of_day.asc",
    });
  } catch (err) {
    logger.error("getMedicines error", err.message);
    return [];
  }
}

export async function getAppointments(userId) {
  try {
    const now = new Date().toISOString();
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Use PostgREST 'and' filter for multiple conditions on the same column
    return await supabaseFetch("appointments", {
      select: "doctor_name,specialty,location,appointment_at,notes",
      user_id: `eq.${userId}`,
      is_completed: "eq.false",
      // Range filter: appointment_at >= now AND <= in30
      and: `(appointment_at.gte.${now},appointment_at.lte.${in30})`,
      order: "appointment_at.asc",
      limit: 5,
    });
  } catch (err) {
    logger.error("getAppointments error", err.message);
    return [];
  }
}

export async function getReminders(userId) {
  try {
    const now = new Date().toISOString();
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return await supabaseFetch("reminders", {
      select: "title,remind_at",
      user_id: `eq.${userId}`,
      is_done: "eq.false",
      and: `(remind_at.gte.${now},remind_at.lte.${in24h})`,
      order: "remind_at.asc",
      limit: 10,
    });
  } catch (err) {
    logger.error("getReminders error", err.message);
    return [];
  }
}

export async function getCommunityEvents() {
  try {
    const now = new Date().toISOString();
    const in7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    return await supabaseFetch("community_events", {
      select: "title,description,location,event_at",
      and: `(event_at.gte.${now},event_at.lte.${in7d})`,
      order: "event_at.asc",
      limit: 5,
    });
  } catch (err) {
    logger.error("getCommunityEvents error", err.message);
    return [];
  }
}


async function supabaseMutate(path, method, body, params = {}) {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
  
  if (method === "POST" || method === "PATCH") {
    headers["Prefer"] = "return=representation";
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error(`supabaseMutate ${method} ${path} -> HTTP ${res.status}`, text);
    throw new Error(`Database error: ${res.statusText}`);
  }

  if (method === "DELETE" && res.status === 204) return true;
  return res.json();
}


export async function saveSosAlert(userId, latitude, longitude) {
  return supabaseMutate("sos_alerts", "POST", { user_id: userId, latitude, longitude });
}

export async function getEmergencyContacts(userId) {
  try {
    return await supabaseFetch("emergency_contacts", {
      user_id: `eq.${userId}`,
    });
  } catch (err) {
    logger.error("getEmergencyContacts error", err.message);
    return [];
  }
}


export async function saveChatMessage(userId, role, message) {
  return supabaseMutate("chat_messages", "POST", { user_id: userId, role, message });
}

export async function getChatHistory(userId, limit = 50) {
  try {
    return await supabaseFetch("chat_messages", {
      user_id: `eq.${userId}`,
      order: "created_at.desc", // we'll reverse in the frontend or controller if needed
      limit,
    });
  } catch (err) {
    logger.error("getChatHistory error", err.message);
    return [];
  }
}


export async function createReminder(userId, data) {
  return supabaseMutate("reminders", "POST", { user_id: userId, ...data });
}

export async function getUserReminders(userId) {
  try {
    return await supabaseFetch("reminders", {
      user_id: `eq.${userId}`,
      order: "remind_at.asc",
    });
  } catch (err) {
    return [];
  }
}

export async function updateReminder(userId, reminderId, data) {
  return supabaseMutate("reminders", "PATCH", data, {
    id: `eq.${reminderId}`,
    user_id: `eq.${userId}`,
  });
}

export async function deleteReminder(userId, reminderId) {
  return supabaseMutate("reminders", "DELETE", null, {
    id: `eq.${reminderId}`,
    user_id: `eq.${userId}`,
  });
}

export async function getUserAppointments(userId) {
  try {
    return await supabaseFetch("appointments", {
      user_id: `eq.${userId}`,
      order: "appointment_at.asc",
    });
  } catch (err) {
    return [];
  }
}

export async function createAppointment(userId, data) {
  return supabaseMutate("appointments", "POST", { user_id: userId, ...data });
}

export async function updateAppointment(userId, appointmentId, data) {
  return supabaseMutate("appointments", "PATCH", data, {
    id: `eq.${appointmentId}`,
    user_id: `eq.${userId}`,
  });
}

export async function deleteAppointment(userId, appointmentId) {
  return supabaseMutate("appointments", "DELETE", null, {
    id: `eq.${appointmentId}`,
    user_id: `eq.${userId}`,
  });
}


export async function getUserProfile(userId) {
  try {
    const rows = await supabaseFetch("user_profiles", {
      user_id: `eq.${userId}`,
      limit: 1,
    });
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    logger.error("getUserProfile error", err.message);
    return null;
  }
}

export async function upsertUserProfile(userId, data) {
  // Try to get existing profile first
  const existing = await getUserProfile(userId);
  if (existing) {
    return supabaseMutate("user_profiles", "PATCH", { ...data, updated_at: new Date().toISOString() }, {
      user_id: `eq.${userId}`,
    });
  } else {
    return supabaseMutate("user_profiles", "POST", { user_id: userId, ...data });
  }
}


export async function getUserDocuments(userId, category = null) {
  try {
    const params = {
      user_id: `eq.${userId}`,
      order: "created_at.desc",
    };
    if (category && category !== 'all') {
      params.category = `eq.${category}`;
    }
    return await supabaseFetch("documents", params);
  } catch (err) {
    logger.error("getUserDocuments error", err.message);
    return [];
  }
}

export async function saveDocumentMeta(userId, data) {
  return supabaseMutate("documents", "POST", { user_id: userId, ...data });
}

export async function updateDocumentMeta(userId, docId, data) {
  return supabaseMutate("documents", "PATCH", data, {
    id: `eq.${docId}`,
    user_id: `eq.${userId}`,
  });
}

export async function deleteDocumentMeta(userId, docId) {
  return supabaseMutate("documents", "DELETE", null, {
    id: `eq.${docId}`,
    user_id: `eq.${userId}`,
  });
}

export async function getDocumentById(userId, docId) {
  try {
    const rows = await supabaseFetch("documents", {
      id: `eq.${docId}`,
      user_id: `eq.${userId}`,
      limit: 1,
    });
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    logger.error("getDocumentById error", err.message);
    return null;
  }
}
