import { getUserProfile, upsertUserProfile } from "../services/supabaseService.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function getProfile(req, res) {
  try {
    const profile = await getUserProfile(req.userId);
    return sendSuccess(res, profile, "Profile retrieved");
  } catch (err) {
    return sendError(res, "Could not load your profile. Please try again.", 500);
  }
}

export async function updateProfile(req, res) {
  try {
    const allowed = [
      'full_name', 'date_of_birth', 'phone', 'alternate_phone',
      'address', 'city', 'state', 'pincode', 'blood_group',
      'aadhaar_number', 'pan_number', 'insurance_provider',
      'insurance_policy_number', 'allergies', 'medical_conditions'
    ];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }
    if (Object.keys(data).length === 0) {
      return sendError(res, "Please provide at least one field to update.", 400);
    }
    const result = await upsertUserProfile(req.userId, data);
    return sendSuccess(res, result, "Profile saved successfully");
  } catch (err) {
    return sendError(res, "Could not save your profile. Please try again.", 500);
  }
}
