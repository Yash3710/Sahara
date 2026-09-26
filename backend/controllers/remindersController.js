import { 
  createReminder as dbCreateReminder,
  getUserReminders,
  updateReminder as dbUpdateReminder,
  deleteReminder as dbDeleteReminder,
  getUserAppointments,
  createAppointment as dbCreateAppointment,
  updateAppointment as dbUpdateAppointment,
  deleteAppointment as dbDeleteAppointment
} from "../services/supabaseService.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export async function listReminders(req, res) {
  try {
    const userId = req.userId;
    const reminders = await getUserReminders(userId);
    const appointments = await getUserAppointments(userId);
    return sendSuccess(res, "Retrieved successfully", { reminders, appointments });
  } catch (err) {
    logger.error("[listReminders] Error:", err.message);
    return sendError(res, "Failed to retrieve reminders", 500);
  }
}

export async function createReminder(req, res) {
  try {
    const { title, remind_at } = req.body;
    if (!title || !remind_at) {
      return sendError(res, "Title and remind date are required", 400);
    }
    const record = await dbCreateReminder(req.userId, req.body);
    return sendSuccess(res, "Reminder created", record[0] || record);
  } catch (err) {
    logger.error("[createReminder] Error:", err.message);
    return sendError(res, "Failed to create reminder", 500);
  }
}

export async function updateReminder(req, res) {
  try {
    const { id } = req.params;
    const record = await dbUpdateReminder(req.userId, id, req.body);
    return sendSuccess(res, "Reminder updated", record[0] || record);
  } catch (err) {
    logger.error("[updateReminder] Error:", err.message);
    return sendError(res, "Failed to update reminder", 500);
  }
}

export async function deleteReminder(req, res) {
  try {
    const { id } = req.params;
    await dbDeleteReminder(req.userId, id);
    return sendSuccess(res, "Reminder deleted");
  } catch (err) {
    logger.error("[deleteReminder] Error:", err.message);
    return sendError(res, "Failed to delete reminder", 500);
  }
}

export async function createAppointment(req, res) {
  try {
    const { doctor_name, appointment_at } = req.body;
    if (!doctor_name || !appointment_at) {
      return sendError(res, "Doctor name and appointment date are required", 400);
    }
    const record = await dbCreateAppointment(req.userId, req.body);
    return sendSuccess(res, "Appointment created", record[0] || record);
  } catch (err) {
    logger.error("[createAppointment] Error:", err.message);
    return sendError(res, "Failed to create appointment", 500);
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const record = await dbUpdateAppointment(req.userId, id, req.body);
    return sendSuccess(res, "Appointment updated", record[0] || record);
  } catch (err) {
    logger.error("[updateAppointment] Error:", err.message);
    return sendError(res, "Failed to update appointment", 500);
  }
}

export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    await dbDeleteAppointment(req.userId, id);
    return sendSuccess(res, "Appointment deleted");
  } catch (err) {
    logger.error("[deleteAppointment] Error:", err.message);
    return sendError(res, "Failed to delete appointment", 500);
  }
}
